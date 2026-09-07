import test from "node:test";
import assert from "node:assert/strict";
import { SimulatorAdapter } from "../src/simulator.js";
import { FleetService } from "../src/fleet-service.js";
import { calculateHealth } from "../src/analytics.js";
import { assertRobotAdapter } from "../src/robot-adapter.js";

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
