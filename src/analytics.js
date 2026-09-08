/**
 * Robot health is a weighted mean of supported components only.
 * battery 30%, motors 30%, sensors 20%, connectivity 20%.
 * Unsupported components are excluded and weights are renormalized.
 * This is an interpretable prototype heuristic, not validated prediction.
 */
export function calculateHealth(sample, capabilities) {
  const parts = [];
  if (capabilities.battery) {
    const charge = clamp(sample.batteryPercentage, 0, 100);
    const heatPenalty = clamp((sample.batteryTemperature - 38) * 3, 0, 45);
    parts.push({ key: "battery", score: clamp(charge - heatPenalty, 0, 100), weight: 0.3 });
  }
  if (capabilities.motors) {
    const heatPenalty = clamp((sample.motorTemperature - 45) * 2.4, 0, 60);
    const currentPenalty = clamp((sample.motorCurrent - 3.2) * 11, 0, 45);
    parts.push({ key: "motors", score: clamp(100 - heatPenalty - currentPenalty, 0, 100), weight: 0.3 });
  }
  if (capabilities.sensors) {
    parts.push({ key: "sensors", score: clamp(sample.localizationQuality, 0, 100), weight: 0.2 });
  }
  if (capabilities.network) {
    const latencyPenalty = clamp((sample.networkLatency - 80) / 6, 0, 60);
    parts.push({ key: "connectivity", score: clamp(sample.signalStrength - latencyPenalty, 0, 100), weight: 0.2 });
  }

  const weight = parts.reduce((sum, part) => sum + part.weight, 0);
  const overall = weight === 0 ? null : Math.round(parts.reduce((sum, part) => sum + part.score * part.weight, 0) / weight);
  return { overall, components: Object.fromEntries(parts.map((part) => [part.key, Math.round(part.score)])), formulaVersion: "health-v1" };
}

export function detectAnomalies(history) {
  if (history.length < 4) return [];
  const latest = history.at(-1);
  const baseline = history.slice(0, -1);
  const rules = [
    { metric: "motorCurrent", threshold: 5.6, direction: "high", code: "DRIVETRAIN_CURRENT_HIGH", severity: "high" },
    { metric: "motorTemperature", threshold: 62, direction: "high", code: "MOTOR_HEAT_HIGH", severity: "critical" },
    { metric: "networkLatency", threshold: 420, direction: "high", code: "NETWORK_LATENCY_HIGH", severity: "warning" },
    { metric: "localizationQuality", threshold: 58, direction: "low", code: "LOCALIZATION_CONFIDENCE_LOW", severity: "high" }
  ];

  return rules.flatMap((rule) => {
    const value = latest[rule.metric];
    if (typeof value !== "number") return [];
    const triggered = rule.direction === "high" ? value >= rule.threshold : value <= rule.threshold;
    if (!triggered) return [];
    const values = baseline.map((item) => item[rule.metric]).filter(Number.isFinite);
    const mean = values.reduce((sum, current) => sum + current, 0) / values.length;
    const variance = values.reduce((sum, current) => sum + (current - mean) ** 2, 0) / Math.max(values.length, 1);
    const zScore = Math.sqrt(variance) === 0 ? 0 : (value - mean) / Math.sqrt(variance);
    return [{
      code: rule.code,
      severity: rule.severity,
      metric: rule.metric,
      value: round(value),
      threshold: rule.threshold,
      baselineMean: round(mean),
      zScore: round(zScore),
      observedAt: latest.observedAt,
      recommendation: "Human inspection recommended; no automatic physical action is permitted."
    }];
  });
}

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function round(value) { return Math.round(value * 100) / 100; }
