import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SimulatorAdapter } from "../src/simulator.js";
import { FleetService } from "../src/fleet-service.js";
import { calculateHealth } from "../src/analytics.js";
import { assertRobotAdapter } from "../src/robot-adapter.js";
import { AlertEngine } from "../src/alert-engine.js";
import { MaintenanceWorkflow } from "../src/maintenance-workflow.js";
import { IncidentReplay } from "../src/incident-replay.js";
import { DiagnosticCopilot } from "../src/diagnostic-copilot.js";
import { MissionTimeline } from "../src/mission-timeline.js";
import { MissionAnalytics } from "../src/mission-analytics.js";
import { InMemoryTelemetryRepository, assertTelemetryRepository } from "../src/telemetry-repository.js";
import { TelemetryIngestionGateway } from "../src/telemetry-ingestion.js";
import { FixtureRestTransport, RestMonitoringAdapter } from "../src/rest-monitoring-adapter.js";

test("adapter contract rejects incomplete vendor integrations", () => {
  assert.throws(() => assertRobotAdapter({ describe() { return {}; } }), /missing listRobots/);
  assert.doesNotThrow(() => assertRobotAdapter(new SimulatorAdapter()));
});

test("fixed seed produces reproducible identities and telemetry", () => {
  const first = new SimulatorAdapter({ seed: 42 });
  const second = new SimulatorAdapter({ seed: 42 });
  assert.deepEqual(first.listRobots(), second.listRobots());
  assert.deepEqual(first.telemetry("PDR-001"), second.telemetry("PDR-001"));
});

test("simulator exposes twenty robots with changing timestamped samples", () => {
  const adapter = new SimulatorAdapter();
  assert.equal(adapter.listRobots().length, 20);
  const before = adapter.telemetry("PDR-001").at(-1);
  adapter.tick();
  const after = adapter.telemetry("PDR-001").at(-1);
  assert.notEqual(before.observedAt, after.observedAt);
  assert.notEqual(before.batteryPercentage, after.batteryPercentage);
});

test("parcel-delivery fixtures are fictional, tenant scoped and expose route evidence", () => {
  const adapter = new SimulatorAdapter();
  const robots = adapter.listRobots();
  assert.equal(robots.every((robot) => robot.id.startsWith("PDR-") && robot.organizationId === "org-parcel-grid-demo"), true);
  assert.equal(robots.every((robot) => Number.isFinite(robot.payloadCapacityKg)), true);
  const active = robots.find((robot) => adapter.telemetry(robot.id).at(-1)?.mission?.parcelId);
  const mission = adapter.telemetry(active.id).at(-1).mission;
  assert.match(mission.parcelId, /^PKG-/);
  assert.match(mission.pickupStop, /^P-/);
  assert.match(mission.dropoffStop, /^D-/);
  assert.equal(mission.routeProgress, mission.progress);
  assert.equal(Number.isFinite(mission.payloadKg), true);
});

test("shipped identity is generic and keeps explicit simulation and control boundaries", () => {
  const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
  const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  const design = readFileSync(new URL("../docs/DESIGN.md", import.meta.url), "utf8");
  const shipped = `${html}\n${app}\n${design}`;
  assert.doesNotMatch(shipped, /al.?jazari|الجزري|baghdad|بغداد|AJR-/i);
  assert.match(shipped, /Parcel Grid/);
  assert.match(shipped, /SIMULATED DATA/);
  assert.match(shipped, /No physical control/);
  assert.match(design, /unaffiliated with any real company/i);
});

test("simulator telemetry carries verified source provenance", () => {
  const adapter = new SimulatorAdapter();
  const sample = adapter.telemetry("PDR-001").at(-1);
  assert.deepEqual(sample.provenance, {
    gatewayId: "telemetry-ingestion-v1",
    sourceId: "simulator-primary",
    adapterId: "deterministic-simulator",
    transport: "in-process",
    sequence: 6,
    receivedAt: sample.observedAt,
    simulated: true,
    verified: true
  });
  assert.equal(adapter.telemetryIngestion.describe().physicalControl, false);
});

test("telemetry ingestion enforces source, tenant and monotonic sequence", () => {
  const repository = new InMemoryTelemetryRepository();
  const gateway = new TelemetryIngestionGateway({
    repository,
    source: { sourceId: "fixture-source", adapterId: "fixture-adapter", transport: "in-process", simulated: true, supportsControl: false }
  });
  gateway.registerRobot({ id: "R-1", organizationId: "org-1", clientId: "client-1" });
  const envelope = {
    sourceId: "fixture-source",
    adapterId: "fixture-adapter",
    transport: "in-process",
    sequence: 1,
    receivedAt: "2026-09-08T10:00:01.000Z",
    robotId: "R-1",
    organizationId: "org-1",
    clientId: "client-1",
    sample: { observedAt: "2026-09-08T10:00:00.000Z", batteryPercentage: 90 }
  };
  const receipt = gateway.ingest(envelope);
  assert.equal(receipt.accepted, true);
  assert.equal(receipt.provenance.verified, true);
  assert.equal(repository.query({ robotId: "R-1" }).samples[0].provenance.sourceId, "fixture-source");
  assert.throws(() => gateway.ingest(envelope), /sequence must be strictly increasing/);
  assert.throws(() => gateway.ingest({ ...envelope, sequence: 2, clientId: "client-2" }), /registered tenant/);
  assert.throws(() => gateway.ingest({ ...envelope, sequence: 2, sourceId: "spoofed-source" }), /provenance does not match/);
});

test("telemetry ingestion fails closed for real sources, commands and invalid receipt time", () => {
  const repository = new InMemoryTelemetryRepository();
  assert.throws(() => new TelemetryIngestionGateway({
    repository,
    source: { sourceId: "real", adapterId: "vendor", transport: "mqtt", simulated: false, supportsControl: false }
  }), /simulated sources only/);
  assert.throws(() => new TelemetryIngestionGateway({
    repository,
    source: { sourceId: "unsafe", adapterId: "vendor", transport: "mqtt", simulated: true, supportsControl: true }
  }), /must not expose physical control/);

  const gateway = new TelemetryIngestionGateway({
    repository,
    source: { sourceId: "fixture-source", adapterId: "fixture-adapter", transport: "in-process", simulated: true, supportsControl: false }
  });
  gateway.registerRobot({ id: "R-1", organizationId: "org-1", clientId: "client-1" });
  const envelope = {
    sourceId: "fixture-source",
    adapterId: "fixture-adapter",
    transport: "in-process",
    sequence: 1,
    receivedAt: "2026-09-08T10:00:01.000Z",
    robotId: "R-1",
    organizationId: "org-1",
    clientId: "client-1",
    sample: { observedAt: "2026-09-08T10:00:00.000Z", motor: { command: "move" } }
  };
  assert.throws(() => gateway.ingest(envelope), /Control fields are not accepted/);
  assert.throws(() => gateway.ingest({
    ...envelope,
    sample: { observedAt: "2026-09-08T10:00:00.000Z", simulated: false }
  }), /conflicts with the simulated source boundary/);
  assert.throws(() => gateway.ingest({
    ...envelope,
    receivedAt: "2026-09-08T09:59:59.000Z",
    sample: { observedAt: "2026-09-08T10:00:00.000Z" }
  }), /must not precede observedAt/);
});

test("fixture REST adapter conforms to the robot contract and preserves optional capabilities", () => {
  const fixtures = JSON.parse(readFileSync(new URL("../fixtures/rest-monitoring-example.json", import.meta.url), "utf8"));
  const transport = new FixtureRestTransport(fixtures);
  const adapter = new RestMonitoringAdapter({ transport });

  assert.doesNotThrow(() => assertRobotAdapter(adapter));
  assert.deepEqual(transport.describe(), {
    transportId: "deterministic-fixture-rest",
    network: false,
    credentials: false,
    readOnly: true
  });
  assert.equal(adapter.describe().supportsControl, false);
  assert.equal(adapter.command, undefined);
  assert.equal(adapter.listRobots().length, 2);
  assert.deepEqual(adapter.capabilities("REST-002"), { battery: true });
  assert.equal(Object.hasOwn(adapter.listRobots()[1], "manufacturer"), false);
});

test("fixture REST adapter normalizes monitoring samples through verified ingestion", () => {
  const fixtures = JSON.parse(readFileSync(new URL("../fixtures/rest-monitoring-example.json", import.meta.url), "utf8"));
  const adapter = new RestMonitoringAdapter({ transport: new FixtureRestTransport(fixtures) });
  const receipt = adapter.tick();

  assert.deepEqual(receipt, { accepted: 2, simulated: true, readOnly: true, physicalControl: false });
  const first = adapter.telemetry("REST-001")[0];
  assert.equal(first.batteryPercentage, 87);
  assert.equal(Object.hasOwn(first, "position"), false);
  assert.deepEqual(first.provenance, {
    gatewayId: "telemetry-ingestion-v1",
    sourceId: "fixture-rest-source",
    adapterId: "rest-monitoring-v1",
    transport: "fixture-rest",
    sequence: 1,
    receivedAt: "2026-09-08T12:45:01.000Z",
    simulated: true,
    verified: true
  });
});

test("fixture REST adapter rejects tenant, provenance, timestamp, capability and actuator violations before storage", () => {
  const base = JSON.parse(readFileSync(new URL("../fixtures/rest-monitoring-example.json", import.meta.url), "utf8"));
  const cases = [
    {
      mutate(fixtures) { fixtures["/robots/REST-001/telemetry"].tenant.clientId = "client-other"; },
      error: /registered tenant/
    },
    {
      mutate(fixtures) { fixtures["/robots/REST-001/telemetry"].sample.motorCurrent = 2.4; },
      error: /requires declared motors capability/
    },
    {
      mutate(fixtures) { fixtures["/robots/REST-001/telemetry"].sample.actuator = { command: "move" }; },
      error: /cannot contain control or actuator fields/
    },
    {
      mutate(fixtures) { fixtures["/robots/REST-001/telemetry"].sourceId = "spoofed"; },
      error: /cannot assert source provenance/
    },
    {
      mutate(fixtures) { fixtures["/robots/REST-001/telemetry"].sample.provenance = { verified: true }; },
      error: /cannot assert provenance/
    },
    {
      mutate(fixtures) { fixtures["/robots/REST-001/telemetry"].sample.observedAt = "2026-09-08 12:45:00"; },
      error: /explicit timezone/
    },
    {
      mutate(fixtures) { fixtures["/robots/REST-001/telemetry"].sample.simulated = false; },
      error: /simulated telemetry only/
    }
  ];

  for (const scenario of cases) {
    const fixtures = structuredClone(base);
    scenario.mutate(fixtures);
    const adapter = new RestMonitoringAdapter({ transport: new FixtureRestTransport(fixtures) });
    assert.throws(() => adapter.tick(), scenario.error);
    assert.equal(adapter.telemetry("REST-001").length, 0);
  }
});

test("fixture REST adapter refuses transports that could use network or credentials", () => {
  const unsafe = {
    describe() { return { readOnly: true, network: true, credentials: false }; },
    get() { return { robots: [] }; }
  };
  assert.throws(() => new RestMonitoringAdapter({ transport: unsafe }), /offline and credential-free/);
});

test("capability discovery keeps unsupported values unavailable", () => {
  const adapter = new SimulatorAdapter();
  const robot = adapter.listRobots().find((item) => !item.capabilities.motors);
  assert.equal(adapter.telemetry(robot.id).at(-1).motorCurrent, null);
  assert.equal(adapter.capabilities(robot.id).motors, false);
});

test("health score is documented and derived from supported values", () => {
  const health = calculateHealth({ batteryPercentage: 80, batteryTemperature: 34, motorCurrent: null, motorTemperature: null, localizationQuality: null, networkLatency: 50, signalStrength: 90 }, { battery: true, motors: false, sensors: false, network: true });
  assert.equal(health.formulaVersion, "health-v1");
  assert.equal(health.overall, 84);
  assert.deepEqual(Object.keys(health.components), ["battery", "connectivity"]);
});

test("fault injection creates threshold evidence and never enables control", () => {
  const adapter = new SimulatorAdapter();
  const service = new FleetService(adapter);
  const result = service.injectFault("PDR-002", "wheel-friction");
  assert.equal(result.confirmation.simulated, true);
  assert.equal(adapter.describe().supportsControl, false);
  assert.equal(result.robot.anomalies[0].code, "DRIVETRAIN_CURRENT_HIGH");
  assert.ok(Number.isFinite(result.robot.anomalies[0].baselineMean));
});

test("client tenant filter cannot access another client's robot", () => {
  const service = new FleetService(new SimulatorAdapter());
  assert.equal(service.robot("PDR-002", { organizationId: "org-parcel-grid-demo", clientId: "client-northstar" }), null);
  const fleet = service.snapshot({ organizationId: "org-parcel-grid-demo", clientId: "client-northstar" });
  assert.ok(fleet.robots.length > 0);
  assert.ok(fleet.robots.every((robot) => robot.clientId === "client-northstar"));
  assert.equal(fleet.totals.total, fleet.robots.length);
});


test("alert engine groups repeated evidence and suppresses cooldown duplicates", () => {
  const engine = new AlertEngine({ cooldownMs: 60_000 });
  const robot = { id: "PDR-002", organizationId: "org-1", clientId: "client-1", siteId: "site-1" };
  const evidence = (observedAt) => [{ code: "DRIVETRAIN_CURRENT_HIGH", severity: "high", metric: "motorCurrent", value: 6.4, threshold: 5.6, baselineMean: 2.6, zScore: 8, observedAt }];

  engine.ingest(robot, evidence("2026-09-07T20:00:00.000Z"));
  engine.ingest(robot, evidence("2026-09-07T20:00:00.000Z"));
  engine.ingest(robot, evidence("2026-09-07T20:00:30.000Z"));
  engine.ingest(robot, evidence("2026-09-07T20:01:01.000Z"));

  const [alert] = engine.list({ clientId: "client-1" });
  assert.equal(alert.occurrences, 3);
  assert.equal(alert.notificationCount, 2);
  assert.equal(alert.suppressedOccurrences, 1);
  assert.equal(engine.list({ clientId: "another-client" }).length, 0);
});

test("alert acknowledgement is explicit, human-attributed and does not trigger control", () => {
  const engine = new AlertEngine();
  const robot = { id: "PDR-002", organizationId: "org-1", clientId: "client-1", siteId: "site-1" };
  engine.ingest(robot, [{ code: "NETWORK_LATENCY_HIGH", severity: "warning", metric: "networkLatency", value: 520, threshold: 420, baselineMean: 70, zScore: 12, observedAt: "2026-09-07T20:00:00.000Z" }]);
  const [openAlert] = engine.list();

  assert.throws(() => engine.acknowledge(openAlert.id, { actor: "technician", confirmed: false }), /confirmation/);
  const acknowledged = engine.acknowledge(openAlert.id, { actor: "demo-technician", confirmed: true, acknowledgedAt: "2026-09-07T20:02:00.000Z" });
  assert.equal(acknowledged.status, "acknowledged");
  assert.equal(acknowledged.acknowledgement.humanConfirmed, true);
  assert.equal(acknowledged.acknowledgement.actor, "demo-technician");
  assert.equal(acknowledged.simulated, true);
});


function acknowledgedAlert(overrides = {}) {
  return {
    id: "ALT-PDR-002-DRIVETRAIN_CURRENT_HIGH",
    organizationId: "org-1",
    clientId: "client-1",
    siteId: "site-1",
    robotId: "PDR-002",
    code: "DRIVETRAIN_CURRENT_HIGH",
    severity: "high",
    status: "acknowledged",
    lastSeenAt: "2026-09-07T20:00:00.000Z",
    acknowledgement: { actor: "technician", acknowledgedAt: "2026-09-07T20:01:00.000Z", humanConfirmed: true },
    evidence: { metric: "motorCurrent", value: 6.4, threshold: 5.6, baselineMean: 2.6, zScore: 8, observedAt: "2026-09-07T20:00:00.000Z" },
    ...overrides
  };
}

test("maintenance suggestions require acknowledged evidence and expose a deterministic rule basis", () => {
  const workflow = new MaintenanceWorkflow();
  assert.equal(workflow.suggest(acknowledgedAlert({ status: "open", acknowledgement: null })), null);

  const suggestion = workflow.suggest(acknowledgedAlert());
  assert.equal(suggestion.inspectWithinHours, 120);
  assert.equal(suggestion.dueAt, "2026-09-12T20:00:00.000Z");
  assert.equal(suggestion.ruleVersion, "maintenance-window-v1");
  assert.equal(suggestion.status, "awaiting-human-confirmation");
  assert.equal(suggestion.physicalAction, false);
  assert.equal("confidence" in suggestion, false);
});

test("maintenance tickets require human confirmation, remain tenant scoped and prevent duplicates", () => {
  const workflow = new MaintenanceWorkflow();
  const alert = acknowledgedAlert();
  assert.throws(() => workflow.confirm(alert, { actor: "technician", confirmed: false }), /confirmation/);

  const first = workflow.confirm(alert, { actor: "demo-technician", confirmed: true, confirmedAt: "2026-09-07T20:02:00.000Z" });
  const repeated = workflow.confirm(alert, { actor: "demo-technician", confirmed: true, confirmedAt: "2026-09-07T20:03:00.000Z" });
  assert.equal(first.created, true);
  assert.equal(first.ticket.status, "open");
  assert.equal(first.ticket.physicalAction, false);
  assert.equal(repeated.created, false);
  assert.equal(repeated.duplicatePrevented, true);
  assert.equal(repeated.ticket.id, first.ticket.id);
  assert.equal(workflow.listTickets({ clientId: "client-1" }).length, 1);
  assert.equal(workflow.listTickets({ clientId: "another-client" }).length, 0);
});


test("incident replay is deterministic and derives its trigger window from telemetry", () => {
  const replay = new IncidentReplay({ windowSize: 4 });
  const robot = { id: "PDR-002", organizationId: "org-1", clientId: "client-1", siteId: "site-1" };
  const history = [
    { observedAt: "2026-09-07T20:00:00.000Z", batteryPercentage: 80, motorCurrent: 2.5, motorTemperature: 44, localizationQuality: 90, networkLatency: 50, mission: { state: "working" }, position: { x: 1, y: 1, orientation: 0 } },
    { observedAt: "2026-09-07T20:00:30.000Z", batteryPercentage: 79, motorCurrent: 2.7, motorTemperature: 45, localizationQuality: 89, networkLatency: 55, mission: { state: "working" }, position: { x: 2, y: 1, orientation: .2 } },
    { observedAt: "2026-09-07T20:01:00.000Z", batteryPercentage: 78, motorCurrent: 6.4, motorTemperature: 46, localizationQuality: 88, networkLatency: 58, mission: { state: "working" }, position: { x: 3, y: 2, orientation: .4 } }
  ];
  const alert = acknowledgedAlert({ lastSeenAt: "2026-09-07T20:01:00.000Z", evidence: { metric: "motorCurrent", value: 6.4, threshold: 5.6, baselineMean: 2.6, zScore: 8, observedAt: "2026-09-07T20:01:00.000Z" } });

  const first = replay.build(robot, history, alert);
  const second = replay.build(robot, history, alert);
  assert.deepEqual(first, second);
  assert.equal(first.sampleCount, 3);
  assert.equal(first.events.at(-1).codes.includes("MOTOR_CURRENT_HIGH"), true);
  assert.equal(first.trajectory.length, 3);
  assert.equal(first.spatialReplayAvailable, true);
  assert.equal(first.physicalControl, false);
  assert.equal(first.causalConclusion, null);
});

test("incident replay retains a telemetry timeline when pose is unsupported", () => {
  const replay = new IncidentReplay();
  const robot = { id: "PDR-003", organizationId: "org-1", clientId: "client-1", siteId: "site-1" };
  const alert = acknowledgedAlert({ id: "ALT-PDR-003-NETWORK_LATENCY_HIGH", robotId: "PDR-003", code: "NETWORK_LATENCY_HIGH", severity: "warning", evidence: { metric: "networkLatency", value: 520, threshold: 420, baselineMean: 60, zScore: 10, observedAt: "2026-09-07T20:00:30.000Z" } });
  const history = [
    { observedAt: "2026-09-07T20:00:00.000Z", batteryPercentage: 80, motorCurrent: null, motorTemperature: null, localizationQuality: null, networkLatency: 60, mission: null, position: null },
    { observedAt: "2026-09-07T20:00:30.000Z", batteryPercentage: 79, motorCurrent: null, motorTemperature: null, localizationQuality: null, networkLatency: 520, mission: null, position: null }
  ];
  const incident = replay.build(robot, history, alert);
  assert.equal(incident.events.length, 2);
  assert.equal(incident.trajectory.length, 0);
  assert.equal(incident.spatialReplayAvailable, false);
  assert.match(incident.capabilityNotice, /Pose history is unsupported/);
});

test("fleet incident queries enforce tenant scope", () => {
  const service = new FleetService(new SimulatorAdapter());
  service.injectFault("PDR-002", "wheel-friction");
  const visible = service.incidents({ organizationId: "org-parcel-grid-demo", clientId: "client-bluebird" });
  const hidden = service.incidents({ organizationId: "org-parcel-grid-demo", clientId: "client-northstar" });
  assert.equal(visible.some((incident) => incident.robotId === "PDR-002"), true);
  assert.equal(hidden.some((incident) => incident.robotId === "PDR-002"), false);
});


test("incident replay UI consumes the public replay contract fields", () => {
  const client = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(client, /replay\.windowStartAt/);
  assert.match(client, /replay\.windowEndAt/);
  assert.match(client, /replay\.sampleCount/);
  assert.doesNotMatch(client, /replay\.window\./);
});


function diagnosticHistory(latest = {}) {
  return [
    { observedAt: "2026-09-07T20:00:00.000Z", batteryPercentage: 82, batteryTemperature: 34, motorCurrent: 2.4, motorTemperature: 44, localizationQuality: 93, networkLatency: 48, signalStrength: 91 },
    { observedAt: "2026-09-07T20:00:30.000Z", batteryPercentage: 81, batteryTemperature: 34, motorCurrent: 2.5, motorTemperature: 44, localizationQuality: 92, networkLatency: 52, signalStrength: 90 },
    { observedAt: "2026-09-07T20:01:00.000Z", batteryPercentage: 80, batteryTemperature: 35, motorCurrent: 2.6, motorTemperature: 45, localizationQuality: 91, networkLatency: 55, signalStrength: 89 },
    { observedAt: "2026-09-07T20:01:30.000Z", batteryPercentage: 79, batteryTemperature: 35, motorCurrent: 2.5, motorTemperature: 45, localizationQuality: 90, networkLatency: 58, signalStrength: 88, ...latest }
  ];
}

test("diagnostic copilot is deterministic and grounds a working hypothesis in threshold evidence", () => {
  const copilot = new DiagnosticCopilot();
  const robot = { id: "PDR-002", organizationId: "org-1", clientId: "client-1" };
  const input = { robot, history: diagnosticHistory({ networkLatency: 520 }), question: "Why did it pause?" };
  const first = copilot.analyze(input);
  const second = copilot.analyze(input);

  assert.deepEqual(first, second);
  assert.equal(first.summaryCode, "POSSIBLE_CONNECTIVITY_DEGRADATION");
  assert.equal(first.primaryHypothesis.sourceEvidenceCode, "NETWORK_LATENCY_HIGH");
  assert.equal(first.observations[0].metric, "networkLatency");
  assert.equal(first.observations[0].value, 520);
  assert.equal(first.confidence, null);
  assert.equal(first.causalConclusion, null);
  assert.equal(first.physicalControl, false);
});

test("diagnostic copilot reports insufficient evidence instead of inventing a cause", () => {
  const copilot = new DiagnosticCopilot();
  const result = copilot.analyze({
    robot: { id: "PDR-001", organizationId: "org-1", clientId: "client-1" },
    history: diagnosticHistory()
  });
  assert.equal(result.status, "insufficient-evidence");
  assert.equal(result.primaryHypothesis, null);
  assert.equal(result.summaryCode, "INSUFFICIENT_EVIDENCE");
  assert.equal(result.recommendedInspection[0].code, "COLLECT_MORE_EVIDENCE");
  assert.equal(result.alternatives.every((item) => item.status === "not-ruled-out"), true);
});

test("fleet diagnostic queries enforce tenant scope and preserve control separation", () => {
  const service = new FleetService(new SimulatorAdapter());
  assert.equal(service.diagnostic("PDR-002", { organizationId: "org-parcel-grid-demo", clientId: "client-northstar" }), null);
  const visible = service.diagnostic("PDR-002", { organizationId: "org-parcel-grid-demo", clientId: "client-bluebird" }, "Summarize evidence");
  assert.equal(visible.clientId, "client-bluebird");
  assert.equal(visible.decisionSupportOnly, true);
  assert.equal(visible.physicalControl, false);
});

test("diagnostic UI consumes evidence, alternatives and safety fields through the read-only endpoint", () => {
  const client = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(client, /\/api\/robots\/\$\{encodeURIComponent\(robotId\)\}\/diagnostics/);
  assert.match(client, /diagnostic\.observations/);
  assert.match(client, /diagnostic\.alternatives/);
  assert.match(client, /diagnostic\.recommendedInspection/);
  assert.match(client, /SIMULATED DATA \/ DECISION SUPPORT/);
});

test("mission timeline derives lifecycle duration and distance from recorded transitions", () => {
  const timeline = new MissionTimeline();
  const robot = { id: "PDR-002", organizationId: "org-1", clientId: "client-1", capabilities: { missions: true } };
  const history = [
    { observedAt: "2026-09-07T20:00:00.000Z", mission: { id: null, state: "idle", progress: 0, distanceMeters: 0 } },
    { observedAt: "2026-09-07T20:00:30.000Z", mission: { id: "MS-1", state: "working", progress: 0, distanceMeters: 0 } },
    { observedAt: "2026-09-07T20:01:00.000Z", mission: { id: "MS-1", state: "working", progress: 55, distanceMeters: 8 } },
    { observedAt: "2026-09-07T20:01:30.000Z", mission: { id: "MS-1", state: "completed", progress: 100, distanceMeters: 12 } }
  ];
  const result = timeline.build(robot, history);
  assert.equal(result.missions.length, 1);
  assert.equal(result.missions[0].status, "completed");
  assert.equal(result.missions[0].durationSeconds, 60);
  assert.equal(result.missions[0].distanceMeters, 12);
  assert.equal(result.missions[0].incompleteEvidence, false);
  assert.deepEqual(result.events.map((event) => event.state), ["working", "completed"]);
  assert.deepEqual(result.events.map((event) => event.kind), ["transition", "transition"]);
  assert.equal(result.physicalControl, false);
});

test("mission timeline preserves a reported terminal reason without inventing a missing start", () => {
  const timeline = new MissionTimeline();
  const robot = { id: "PDR-004", organizationId: "org-1", clientId: "client-1", capabilities: { missions: true } };
  const result = timeline.build(robot, [{
    observedAt: "2026-09-07T20:05:00.000Z",
    mission: { id: "MS-TRUNCATED", state: "failed", progress: 61, distanceMeters: 17.5, reasonCode: "DELIVERY_ROUTE_BLOCKED" }
  }]);
  assert.equal(result.missions[0].startedAt, null);
  assert.equal(result.missions[0].durationSeconds, null);
  assert.equal(result.missions[0].reasonCode, "DELIVERY_ROUTE_BLOCKED");
  assert.equal(result.missions[0].incompleteEvidence, true);
  assert.equal(result.events[0].kind, "first-observed");
});

test("mission timeline does not turn a later sample into a missing start transition", () => {
  const timeline = new MissionTimeline();
  const robot = { id: "PDR-005", organizationId: "org-1", clientId: "client-1", capabilities: { missions: true } };
  const result = timeline.build(robot, [
    { observedAt: "2026-09-07T20:00:00.000Z", mission: { id: "MS-MID", state: "working", progress: 35, distanceMeters: 5 } },
    { observedAt: "2026-09-07T20:00:30.000Z", mission: { id: "MS-MID", state: "working", progress: 45, distanceMeters: 7 } },
    { observedAt: "2026-09-07T20:01:00.000Z", mission: { id: null, state: "idle", progress: 0, distanceMeters: 0 } }
  ]);
  assert.equal(result.missions[0].startedAt, null);
  assert.equal(result.missions[0].durationSeconds, null);
  assert.equal(result.missions[0].incompleteEvidence, true);
  assert.equal(result.currentMission, null);
});

test("mission timeline reports unsupported capability explicitly", () => {
  const result = new MissionTimeline().build({ id: "PDR-003", organizationId: "org-1", clientId: "client-1", capabilities: { missions: false } }, []);
  assert.equal(result.supported, false);
  assert.equal(result.missions.length, 0);
  assert.match(result.capabilityNotice, /unsupported/);
  assert.equal(result.readOnly, true);
});

test("deterministic simulator emits explicit mission outcomes only for capable robots", () => {
  const adapter = new SimulatorAdapter();
  for (let index = 0; index < 30; index += 1) adapter.tick();
  const capableStates = adapter.listRobots().filter((robot) => robot.capabilities.missions)
    .flatMap((robot) => adapter.telemetry(robot.id).map((sample) => sample.mission?.state));
  assert.equal(capableStates.includes("completed"), true);
  assert.equal(capableStates.includes("failed"), true);
  assert.equal(capableStates.includes("cancelled"), true);
  const unsupported = adapter.listRobots().find((robot) => !robot.capabilities.missions);
  assert.equal(adapter.telemetry(unsupported.id).every((sample) => sample.mission === null), true);
});

test("fleet mission timeline queries enforce tenant scope", () => {
  const service = new FleetService(new SimulatorAdapter());
  assert.equal(service.missionTimeline("PDR-002", { organizationId: "org-parcel-grid-demo", clientId: "client-northstar" }), null);
  const visible = service.missionTimeline("PDR-002", { organizationId: "org-parcel-grid-demo", clientId: "client-bluebird" });
  assert.equal(visible.clientId, "client-bluebird");
  assert.equal(visible.simulated, true);
  assert.equal(visible.physicalControl, false);
});

test("mission timeline UI consumes the tenant-safe read-only contract", () => {
  const client = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(client, /\/api\/robots\/\$\{encodeURIComponent\(robotId\)\}\/missions/);
  assert.match(client, /timeline\.events/);
  assert.match(client, /timeline\.missions/);
  assert.match(client, /SIMULATED DATA \/ READ-ONLY MISSION EVIDENCE/);
  assert.match(client, /mission-timeline-title.*focus/);
});

test("mission analytics exposes exact denominators, coverage and exclusions", () => {
  const robots = [
    { id: "R-1", capabilities: { missions: true } },
    { id: "R-2", capabilities: { missions: false } }
  ];
  const histories = new Map([["R-1", [
    { observedAt: "2026-09-07T20:00:00.000Z", mission: { state: "working" } },
    { observedAt: "2026-09-07T20:00:30.000Z", mission: { state: "completed" } },
    { observedAt: "2026-09-07T20:01:00.000Z", mission: null }
  ]]]);
  const timelines = [{ robotId: "R-1", supported: true, missions: [
    { status: "completed", durationSeconds: 60, distanceMeters: 12, incompleteEvidence: false },
    { status: "failed", durationSeconds: 30, distanceMeters: 5, incompleteEvidence: false },
    { status: "cancelled", durationSeconds: null, distanceMeters: 3, incompleteEvidence: true },
    { status: "working", durationSeconds: null, distanceMeters: 4, incompleteEvidence: true }
  ] }];
  const result = new MissionAnalytics().build({ robots, histories, timelines });

  assert.deepEqual(result.outcomes.completion, { valuePercent: 33.33, numerator: 1, denominator: 3, eligibility: "observed terminal missions only" });
  assert.equal(result.outcomes.failure.valuePercent, 33.33);
  assert.equal(result.outcomes.cancellation.valuePercent, 33.33);
  assert.equal(result.utilization.valuePercent, 50);
  assert.equal(result.utilization.excludedSamples, 1);
  assert.deepEqual(result.coverage, { missionCapableRobots: 1, totalRobots: 2, unsupportedRobots: 1 });
  assert.equal(result.duration.value, 45);
  assert.equal(result.duration.contributingRecords, 2);
  assert.equal(result.duration.excludedRecords, 2);
  assert.equal(result.distance.value, 24);
  assert.equal(result.confidence, null);
  assert.equal(result.predictive, false);
  assert.equal(result.physicalControl, false);
});

test("mission analytics returns unavailable rates instead of zero for empty denominators", () => {
  const result = new MissionAnalytics().build({
    robots: [{ id: "R-1", capabilities: { missions: true } }],
    histories: new Map([["R-1", []]]),
    timelines: [{ robotId: "R-1", supported: true, missions: [] }]
  });
  assert.equal(result.outcomes.completion.valuePercent, null);
  assert.equal(result.outcomes.completion.denominator, 0);
  assert.equal(result.utilization.valuePercent, null);
  assert.equal(result.duration.value, null);
  assert.equal(result.distance.value, null);
});

test("fleet mission analytics stays inside the requested tenant", () => {
  const service = new FleetService(new SimulatorAdapter());
  const tenant = service.missionAnalytics({ organizationId: "org-parcel-grid-demo", clientId: "client-bluebird" });
  assert.equal(tenant.coverage.totalRobots, 7);
  assert.equal(tenant.coverage.missionCapableRobots, 7);
  assert.equal(tenant.observationWindow.telemetrySampleCount, 42);
  assert.equal(tenant.formulaVersion, "mission-analytics-v1");
  assert.deepEqual(tenant.scope, { organizationId: "org-parcel-grid-demo", clientId: "client-bluebird" });
  assert.equal(tenant.readOnly, true);
});

test("mission analytics UI renders API evidence rather than decorative constants", () => {
  const client = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  const page = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
  assert.match(client, /fetch\("\/api\/analytics\/missions"\)/);
  assert.match(client, /metric\.numerator/);
  assert.match(client, /metric\.denominator/);
  assert.match(client, /missionAnalytics\.duration\.excludedRecords/);
  assert.match(client, /missionAnalytics\.formulaVersion/);
  assert.match(page, /id="mission-analytics"/);
});

test("telemetry repository enforces tenant scope, stable windows and bounded pagination", () => {
  const repository = new InMemoryTelemetryRepository({ retentionSamplesPerRobot: 4, maxQueryLimit: 2 });
  repository.registerRobot({ id: "R-1", organizationId: "org-1", clientId: "client-1" });
  assert.throws(
    () => repository.registerRobot({ id: "R-1", organizationId: "org-1", clientId: "client-2" }),
    /tenant identity cannot change/
  );
  for (let index = 0; index < 5; index += 1) {
    repository.append("R-1", {
      observedAt: `2026-09-08T00:0${index}:00.000Z`,
      batteryPercentage: 90 - index
    });
  }

  assert.equal(repository.query({ robotId: "R-1", organizationId: "org-2", limit: 2 }), null);
  const first = repository.query({
    robotId: "R-1",
    organizationId: "org-1",
    clientId: "client-1",
    startAt: "2026-09-08T00:01:00.000Z",
    endAt: "2026-09-08T00:04:00.000Z",
    limit: 2
  });
  assert.deepEqual(first.samples.map((sample) => sample.observedAt), [
    "2026-09-08T00:01:00.000Z",
    "2026-09-08T00:02:00.000Z"
  ]);
  assert.deepEqual(first.pageInfo, {
    limit: 2,
    returned: 2,
    hasNextPage: true,
    nextCursor: "2026-09-08T00:02:00.000Z",
    order: "observedAt-ascending"
  });
  const second = repository.query({ robotId: "R-1", cursor: first.pageInfo.nextCursor, limit: 2 });
  assert.deepEqual(second.samples.map((sample) => sample.observedAt), [
    "2026-09-08T00:03:00.000Z",
    "2026-09-08T00:04:00.000Z"
  ]);
  assert.equal(first.retention.droppedSamples, 1);
  assert.equal(first.source.durable, false);
  assert.equal(first.physicalControl, false);
});

test("telemetry repository rejects invalid limits, timestamps and ordering", () => {
  const repository = new InMemoryTelemetryRepository({ retentionSamplesPerRobot: 3, maxQueryLimit: 2 });
  assert.doesNotThrow(() => assertTelemetryRepository(repository));
  assert.throws(
    () => assertTelemetryRepository({ describe: () => ({ repositoryId: "broken", maxQueryLimit: 2 }) }),
    /missing registerRobot/
  );
  repository.registerRobot({ id: "R-1", organizationId: "org-1", clientId: "client-1" });
  repository.append("R-1", { observedAt: "2026-09-08T00:00:00.000Z" });
  assert.throws(() => repository.query({ robotId: "R-1", limit: 3 }), /limit must be between/);
  assert.throws(() => repository.query({ robotId: "R-1", startAt: "not-a-date" }), /ISO timestamp/);
  assert.throws(() => repository.query({ robotId: "R-1", startAt: "2026-09-08" }), /explicit timezone/);
  assert.throws(() => repository.query({ robotId: "R-1", startAt: "2026-09-08T00:00:00" }), /explicit timezone/);
  assert.throws(() => repository.query({ robotId: "R-1", startAt: "2026-09-08T01:00:00Z", endAt: "2026-09-08T00:00:00Z" }), /must not follow/);
  assert.throws(() => repository.append("R-1", { observedAt: "2026-09-08T00:00:00.000Z" }), /strictly increasing/);
});

test("fleet telemetry history uses the repository boundary and remains tenant scoped", () => {
  const adapter = new SimulatorAdapter();
  adapter.telemetry = () => { throw new Error("legacy adapter telemetry must not be read"); };
  const service = new FleetService(adapter);
  const hidden = service.telemetryHistory("PDR-002", {
    organizationId: "org-parcel-grid-demo",
    clientId: "client-northstar"
  }, { limit: 2 });
  assert.equal(hidden, null);
  const visible = service.telemetryHistory("PDR-002", {
    organizationId: "org-parcel-grid-demo",
    clientId: "client-bluebird"
  }, { limit: 2 });
  assert.equal(visible.samples.length, 2);
  assert.equal(visible.scope.clientId, "client-bluebird");
  assert.equal(visible.source.repositoryId, "deterministic-in-memory-telemetry");
  assert.equal(visible.simulated, true);
  assert.equal(visible.readOnly, true);
  assert.equal(visible.physicalControl, false);
});
