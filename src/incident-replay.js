const RULES = [
  { metric: "motorCurrent", code: "MOTOR_CURRENT_HIGH", matches: (value) => value >= 5.6 },
  { metric: "motorTemperature", code: "MOTOR_TEMPERATURE_HIGH", matches: (value) => value >= 62 },
  { metric: "networkLatency", code: "NETWORK_LATENCY_HIGH", matches: (value) => value >= 420 },
  { metric: "localizationQuality", code: "LOCALIZATION_QUALITY_LOW", matches: (value) => value <= 58 }
];

/**
 * Builds a replayable incident window solely from recorded simulator telemetry.
 * It does not interpolate missing capabilities or invent causal conclusions.
 */
export class IncidentReplay {
  constructor({ windowSize = 8 } = {}) {
    this.windowSize = windowSize;
  }

  build(robot, history, alert) {
    const targetTime = Date.parse(alert.evidence.observedAt);
    const eligible = history.filter((sample) => Date.parse(sample.observedAt) <= targetTime);
    const window = (eligible.length ? eligible : history).slice(-this.windowSize);
    if (!window.length) throw new Error("Incident replay requires telemetry history");

    const events = window.map((sample, index) => {
      const previous = window[index - 1];
      const codes = RULES
        .filter((rule) => Number.isFinite(sample[rule.metric]) && rule.matches(sample[rule.metric]))
        .map((rule) => rule.code);
      if (previous?.mission?.state !== sample.mission?.state && sample.mission?.state) codes.push("MISSION_STATE_CHANGED");
      if (!codes.length) codes.push(index === 0 ? "WINDOW_BASELINE" : "TELEMETRY_SAMPLE");
      return {
        id: `${alert.id}-E${String(index + 1).padStart(2, "0")}`,
        observedAt: sample.observedAt,
        codes,
        telemetry: {
          batteryPercentage: sample.batteryPercentage,
          motorCurrent: sample.motorCurrent,
          motorTemperature: sample.motorTemperature,
          localizationQuality: sample.localizationQuality,
          networkLatency: sample.networkLatency,
          missionState: sample.mission?.state ?? null
        },
        position: sample.position ? structuredClone(sample.position) : null
      };
    });

    const trajectory = events
      .filter((event) => event.position)
      .map((event) => ({ observedAt: event.observedAt, ...event.position }));

    return {
      id: `INC-${alert.id.replace(/^ALT-/, "")}`,
      sourceAlertId: alert.id,
      organizationId: robot.organizationId,
      clientId: robot.clientId,
      siteId: robot.siteId,
      robotId: robot.id,
      status: alert.status === "acknowledged" ? "acknowledged" : "open",
      severity: alert.severity,
      trigger: {
        code: alert.code,
        metric: alert.evidence.metric,
        value: alert.evidence.value,
        threshold: alert.evidence.threshold,
        observedAt: alert.evidence.observedAt
      },
      windowStartAt: events[0].observedAt,
      windowEndAt: events.at(-1).observedAt,
      sampleCount: events.length,
      events,
      trajectory,
      spatialReplayAvailable: trajectory.length >= 2,
      capabilityNotice: trajectory.length >= 2 ? null : "Pose history is unsupported or insufficient; telemetry timeline remains available.",
      simulated: true,
      physicalControl: false,
      causalConclusion: null
    };
  }

  list(robots, histories, alerts) {
    const robotMap = new Map(robots.map((robot) => [robot.id, robot]));
    return alerts.flatMap((alert) => {
      const robot = robotMap.get(alert.robotId);
      const history = histories.get(alert.robotId) ?? [];
      return robot && history.length ? [this.build(robot, history, alert)] : [];
    }).sort((a, b) => b.windowEndAt.localeCompare(a.windowEndAt));
  }
}
