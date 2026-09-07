import test from "node:test";
import assert from "node:assert/strict";
import { SimulatorAdapter } from "../src/simulator.js";
import { FleetService } from "../src/fleet-service.js";
import { calculateHealth } from "../src/analytics.js";
import { assertRobotAdapter } from "../src/robot-adapter.js";
import { AlertEngine } from "../src/alert-engine.js";

test("adapter contract rejects incomplete vendor integrations", () => {
  assert.throws(() => assertRobotAdapter({ describe() { return {}; } }), /missing listRobots/);
  assert.doesNotThrow(() => assertRobotAdapter(new SimulatorAdapter()));
});

test("fixed seed produces reproducible identities and telemetry", () => {
  const first = new SimulatorAdapter({ seed: 42 });
  const second = new SimulatorAdapter({ seed: 42 });
  assert.deepEqual(first.listRobots(), second.listRobots());
  assert.deepEqual(first.telemetry("AJR-001"), second.telemetry("AJR-001"));
});

test("simulator exposes twenty robots with changing timestamped samples", () => {
  const adapter = new SimulatorAdapter();
  assert.equal(adapter.listRobots().length, 20);
  const before = adapter.telemetry("AJR-001").at(-1);
  adapter.tick();
  const after = adapter.telemetry("AJR-001").at(-1);
  assert.notEqual(before.observedAt, after.observedAt);
  assert.notEqual(before.batteryPercentage, after.batteryPercentage);
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
  const result = service.injectFault("AJR-002", "wheel-friction");
  assert.equal(result.confirmation.simulated, true);
  assert.equal(adapter.describe().supportsControl, false);
  assert.equal(result.robot.anomalies[0].code, "DRIVETRAIN_CURRENT_HIGH");
  assert.ok(Number.isFinite(result.robot.anomalies[0].baselineMean));
});

test("client tenant filter cannot access another client's robot", () => {
  const service = new FleetService(new SimulatorAdapter());
  assert.equal(service.robot("AJR-002", { organizationId: "org-aljazari-demo", clientId: "client-sindbad" }), null);
  const fleet = service.snapshot({ organizationId: "org-aljazari-demo", clientId: "client-sindbad" });
  assert.ok(fleet.robots.length > 0);
  assert.ok(fleet.robots.every((robot) => robot.clientId === "client-sindbad"));
  assert.equal(fleet.totals.total, fleet.robots.length);
});


test("alert engine groups repeated evidence and suppresses cooldown duplicates", () => {
  const engine = new AlertEngine({ cooldownMs: 60_000 });
  const robot = { id: "AJR-002", organizationId: "org-1", clientId: "client-1", siteId: "site-1" };
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
  const robot = { id: "AJR-002", organizationId: "org-1", clientId: "client-1", siteId: "site-1" };
  engine.ingest(robot, [{ code: "NETWORK_LATENCY_HIGH", severity: "warning", metric: "networkLatency", value: 520, threshold: 420, baselineMean: 70, zScore: 12, observedAt: "2026-09-07T20:00:00.000Z" }]);
  const [openAlert] = engine.list();

  assert.throws(() => engine.acknowledge(openAlert.id, { actor: "technician", confirmed: false }), /confirmation/);
  const acknowledged = engine.acknowledge(openAlert.id, { actor: "demo-technician", confirmed: true, acknowledgedAt: "2026-09-07T20:02:00.000Z" });
  assert.equal(acknowledged.status, "acknowledged");
  assert.equal(acknowledged.acknowledgement.humanConfirmed, true);
  assert.equal(acknowledged.acknowledgement.actor, "demo-technician");
  assert.equal(acknowledged.simulated, true);
});
