import { calculateHealth, detectAnomalies } from "./analytics.js";
import { SimulatorAdapter } from "./simulator.js";
import { assertRobotAdapter } from "./robot-adapter.js";
import { AlertEngine } from "./alert-engine.js";
import { MaintenanceWorkflow } from "./maintenance-workflow.js";
import { IncidentReplay } from "./incident-replay.js";
import { DiagnosticCopilot } from "./diagnostic-copilot.js";
import { MissionTimeline } from "./mission-timeline.js";
import { MissionAnalytics } from "./mission-analytics.js";

export class FleetService {
  constructor(adapter = new SimulatorAdapter(), alertEngine = new AlertEngine(), maintenanceWorkflow = new MaintenanceWorkflow(), incidentReplay = new IncidentReplay(), diagnosticCopilot = new DiagnosticCopilot(), missionTimeline = new MissionTimeline(), missionAnalytics = new MissionAnalytics()) {
    this.adapter = assertRobotAdapter(adapter);
    this.alertEngine = alertEngine;
    this.maintenanceWorkflow = maintenanceWorkflow;
    this.incidentReplay = incidentReplay;
    this.diagnosticCopilot = diagnosticCopilot;
    this.missionTimelineBuilder = missionTimeline;
    this.missionAnalyticsBuilder = missionAnalytics;
  }

  snapshot({ organizationId, clientId, search = "", status } = {}) {
    this.adapter.tick();
    const normalizedSearch = search.trim().toLowerCase();
    const robots = this.adapter.listRobots()
      .filter((robot) => !organizationId || robot.organizationId === organizationId)
      .filter((robot) => !clientId || robot.clientId === clientId)
      .map((robot) => this.#decorate(robot))
      .filter((robot) => !status || robot.operationalState === status)
      .filter((robot) => !normalizedSearch || [robot.id, robot.serialNumber, robot.model, robot.clientName, robot.siteName].some((value) => value.toLowerCase().includes(normalizedSearch)));

    const alerts = this.alertEngine.list().filter((alert) => robots.some((robot) => robot.id === alert.robotId));
    const robotIds = new Set(robots.map((robot) => robot.id));
    const histories = new Map(robots.map((robot) => [robot.id, this.adapter.telemetry(robot.id)]));
    const incidents = this.incidentReplay.list(robots, histories, alerts);
    return {
      generatedAt: robots[0]?.telemetry.observedAt ?? new Date().toISOString(),
      simulated: true,
      source: this.adapter.describe(),
      totals: deriveTotals(robots),
      alerts,
      maintenance: {
        suggestions: this.maintenanceWorkflow.listSuggestions(alerts),
        tickets: this.maintenanceWorkflow.listTickets().filter((ticket) => robotIds.has(ticket.robotId))
      },
      incidents,
      robots
    };
  }

  robot(robotId, tenant = {}) {
    const robot = this.adapter.listRobots().find((item) => item.id === robotId);
    if (!robot) return null;
    if (tenant.organizationId && robot.organizationId !== tenant.organizationId) return null;
    if (tenant.clientId && robot.clientId !== tenant.clientId) return null;
    const decorated = this.#decorate(robot);
    return {
      ...decorated,
      history: this.adapter.telemetry(robotId).slice(-30),
      alerts: this.alertEngine.list({ robotId }),
      maintenance: this.maintenance({ ...tenant, robotId }),
      incidents: this.incidents({ ...tenant, robotId }),
      missionTimeline: this.missionTimeline(robotId, tenant)
    };
  }

  injectFault(robotId, fault) {
    const confirmation = this.adapter.injectFault(robotId, fault);
    return { confirmation, robot: this.robot(robotId, { organizationId: "org-aljazari-demo" }) };
  }

  alerts(tenant = {}) {
    return this.alertEngine.list(tenant);
  }

  acknowledgeAlert(alertId, acknowledgement, tenant = {}) {
    const visible = this.alertEngine.list(tenant).some((alert) => alert.id === alertId);
    if (!visible) throw new Error("Alert not found in tenant");
    return this.alertEngine.acknowledge(alertId, acknowledgement);
  }

  maintenance(tenant = {}) {
    const alerts = this.alertEngine.list(tenant);
    return {
      simulated: true,
      suggestions: this.maintenanceWorkflow.listSuggestions(alerts),
      tickets: this.maintenanceWorkflow.listTickets(tenant)
    };
  }

  confirmMaintenanceTicket(alertId, confirmation, tenant = {}) {
    const alert = this.alertEngine.list(tenant).find((item) => item.id === alertId);
    if (!alert) throw new Error("Alert not found in tenant");
    return this.maintenanceWorkflow.confirm(alert, confirmation);
  }

  incidents(tenant = {}) {
    const robots = this.adapter.listRobots()
      .filter((robot) => !tenant.organizationId || robot.organizationId === tenant.organizationId)
      .filter((robot) => !tenant.clientId || robot.clientId === tenant.clientId)
      .filter((robot) => !tenant.robotId || robot.id === tenant.robotId);
    const histories = new Map(robots.map((robot) => [robot.id, this.adapter.telemetry(robot.id)]));
    return this.incidentReplay.list(robots, histories, this.alertEngine.list(tenant));
  }

  incident(incidentId, tenant = {}) {
    return this.incidents(tenant).find((incident) => incident.id === incidentId) ?? null;
  }

  diagnostic(robotId, tenant = {}, question = "") {
    const robot = this.adapter.listRobots().find((item) => item.id === robotId);
    if (!robot) return null;
    if (tenant.organizationId && robot.organizationId !== tenant.organizationId) return null;
    if (tenant.clientId && robot.clientId !== tenant.clientId) return null;
    const decorated = this.#decorate(robot);
    const history = this.adapter.telemetry(robotId);
    return this.diagnosticCopilot.analyze({
      robot: decorated,
      history,
      alerts: this.alertEngine.list({ ...tenant, robotId }),
      incidents: this.incidents({ ...tenant, robotId }),
      maintenance: this.maintenanceWorkflow.listTickets({ ...tenant, robotId }),
      question
    });
  }

  missionTimeline(robotId, tenant = {}) {
    const robot = this.adapter.listRobots().find((item) => item.id === robotId);
    if (!robot) return null;
    if (tenant.organizationId && robot.organizationId !== tenant.organizationId) return null;
    if (tenant.clientId && robot.clientId !== tenant.clientId) return null;
    return this.missionTimelineBuilder.build(robot, this.adapter.telemetry(robotId));
  }

  missionAnalytics(tenant = {}) {
    const robots = this.adapter.listRobots()
      .filter((robot) => !tenant.organizationId || robot.organizationId === tenant.organizationId)
      .filter((robot) => !tenant.clientId || robot.clientId === tenant.clientId);
    const histories = new Map(robots.map((robot) => [robot.id, this.adapter.telemetry(robot.id)]));
    const timelines = robots.map((robot) => this.missionTimelineBuilder.build(robot, histories.get(robot.id)));
    return {
      ...this.missionAnalyticsBuilder.build({ robots, histories, timelines }),
      scope: {
        organizationId: tenant.organizationId ?? null,
        clientId: tenant.clientId ?? null
      }
    };
  }

  #decorate(robot) {
    const history = this.adapter.telemetry(robot.id);
    const telemetry = history.at(-1);
    const anomalies = detectAnomalies(history);
    const health = calculateHealth(telemetry, robot.capabilities);
    this.alertEngine.ingest(robot, anomalies);
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
