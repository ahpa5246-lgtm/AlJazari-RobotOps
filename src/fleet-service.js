import { calculateHealth, detectAnomalies } from "./analytics.js";
import { SimulatorAdapter } from "./simulator.js";
import { assertRobotAdapter } from "./robot-adapter.js";

export class FleetService {
  constructor(adapter = new SimulatorAdapter()) { this.adapter = assertRobotAdapter(adapter); }

  snapshot({ organizationId, clientId, search = "", status } = {}) {
    this.adapter.tick();
    const normalizedSearch = search.trim().toLowerCase();
    const robots = this.adapter.listRobots()
      .filter((robot) => !organizationId || robot.organizationId === organizationId)
      .filter((robot) => !clientId || robot.clientId === clientId)
      .map((robot) => this.#decorate(robot))
      .filter((robot) => !status || robot.operationalState === status)
      .filter((robot) => !normalizedSearch || [robot.id, robot.serialNumber, robot.model, robot.clientName, robot.siteName].some((value) => value.toLowerCase().includes(normalizedSearch)));

    return {
      generatedAt: robots[0]?.telemetry.observedAt ?? new Date().toISOString(),
      simulated: true,
      source: this.adapter.describe(),
      totals: deriveTotals(robots),
      robots
    };
  }

  robot(robotId, tenant = {}) {
    const robot = this.adapter.listRobots().find((item) => item.id === robotId);
    if (!robot) return null;
    if (tenant.organizationId && robot.organizationId !== tenant.organizationId) return null;
    if (tenant.clientId && robot.clientId !== tenant.clientId) return null;
    const decorated = this.#decorate(robot);
    return { ...decorated, history: this.adapter.telemetry(robotId).slice(-30) };
  }

  injectFault(robotId, fault) {
    const confirmation = this.adapter.injectFault(robotId, fault);
    return { confirmation, robot: this.robot(robotId, { organizationId: "org-aljazari-demo" }) };
  }

  #decorate(robot) {
    const history = this.adapter.telemetry(robot.id);
    const telemetry = history.at(-1);
    const anomalies = detectAnomalies(history);
    const health = calculateHealth(telemetry, robot.capabilities);
    const operationalState = anomalies.some((item) => item.severity === "critical") ? "critical"
      : anomalies.length ? "warning"
        : telemetry.mission?.state === "working" ? "working" : "idle";
    return { ...robot, telemetry, health, anomalies, operationalState };
  }
}

function deriveTotals(robots) {
  return robots.reduce((totals, robot) => {
    totals.total += 1;
    totals[robot.operationalState] += 1;
    if (robot.connectionStatus === "online") totals.online += 1;
    if (robot.telemetry.batteryPercentage <= 18) totals.chargingNeeded += 1;
    return totals;
  }, { total: 0, online: 0, working: 0, idle: 0, warning: 0, critical: 0, chargingNeeded: 0 });
}
