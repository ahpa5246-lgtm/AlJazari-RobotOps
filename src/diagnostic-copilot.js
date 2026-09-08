import { detectAnomalies } from "./analytics.js";

const RULES = {
  MOTOR_HEAT_HIGH: {
    hypothesis: "POSSIBLE_MOTOR_THERMAL_STRESS",
    inspection: "Inspect cooling, airflow and motor temperature with the robot safely powered down.",
    alternatives: ["POSSIBLE_DRIVETRAIN_LOAD", "POSSIBLE_SENSOR_ERROR"]
  },
  DRIVETRAIN_CURRENT_HIGH: {
    hypothesis: "POSSIBLE_DRIVETRAIN_LOAD",
    inspection: "Inspect wheels, bearings and floor resistance before replacing drivetrain parts.",
    alternatives: ["POSSIBLE_PAYLOAD_OR_SURFACE_EFFECT", "POSSIBLE_CURRENT_SENSOR_ERROR"]
  },
  LOCALIZATION_CONFIDENCE_LOW: {
    hypothesis: "POSSIBLE_LOCALIZATION_OR_ENVIRONMENT_ISSUE",
    inspection: "Inspect map changes, reflective surfaces, occlusion and localization sensors.",
    alternatives: ["POSSIBLE_SENSOR_DEGRADATION", "POSSIBLE_ENVIRONMENT_CHANGE"]
  },
  NETWORK_LATENCY_HIGH: {
    hypothesis: "POSSIBLE_CONNECTIVITY_DEGRADATION",
    inspection: "Inspect access-point coverage, interference and network path before changing robot hardware.",
    alternatives: ["POSSIBLE_SITE_NETWORK_LOAD", "POSSIBLE_ADAPTER_DELAY"]
  }
};

/**
 * Produces deterministic decision support from recorded telemetry.
 * It records but does not semantically interpret free-text questions, call an LLM,
 * calculate an unvalidated probability, claim causality or issue robot commands.
 */
export class DiagnosticCopilot {
  analyze({ robot, history = [], alerts = [], incidents = [], maintenance = [], question = "" }) {
    if (!robot) throw new Error("Diagnostic analysis requires a robot");
    const safeQuestion = typeof question === "string" ? question.trim().slice(0, 240) : "";
    const ordered = [...history].sort((a, b) => a.observedAt.localeCompare(b.observedAt));
    const anomalies = detectAnomalies(ordered);
    const ranked = [...anomalies].sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || a.code.localeCompare(b.code));
    const primaryEvidence = ranked[0] ?? null;
    const rule = primaryEvidence ? RULES[primaryEvidence.code] : null;
    const observations = ranked.map((item) => ({
      source: "telemetry",
      code: item.code,
      observedAt: item.observedAt,
      metric: item.metric,
      value: item.value,
      threshold: item.threshold,
      baselineMean: item.baselineMean,
      zScore: item.zScore
    }));
    const latest = ordered.at(-1);
    const startedAt = ordered[0]?.observedAt ?? null;
    const endedAt = latest?.observedAt ?? null;

    return {
      id: `DX-${robot.id}-${endedAt ?? "NO-DATA"}`,
      robotId: robot.id,
      organizationId: robot.organizationId,
      clientId: robot.clientId,
      generatedAt: endedAt,
      question: safeQuestion || "Summarize current evidence",
      questionHandling: "recorded-not-semantically-interpreted",
      status: rule ? "working-hypothesis" : "insufficient-evidence",
      summaryCode: rule?.hypothesis ?? "INSUFFICIENT_EVIDENCE",
      timeRange: { startedAt, endedAt, sampleCount: ordered.length },
      observations,
      primaryHypothesis: rule ? {
        code: rule.hypothesis,
        basis: "diagnostic-rules-v1",
        sourceEvidenceCode: primaryEvidence.code,
        rationale: `${primaryEvidence.metric} measured ${primaryEvidence.value} against threshold ${primaryEvidence.threshold}; this supports inspection, not a confirmed cause.`
      } : null,
      alternatives: (rule?.alternatives ?? ["NO_ACTIVE_THRESHOLD_BREACH", "MISSING_OR_UNSUPPORTED_SIGNAL"]).map((code) => ({
        code,
        status: "not-ruled-out",
        evidenceGap: "Additional technician observations or supported telemetry are required."
      })),
      recommendedInspection: rule ? [{
        code: `INSPECT_${rule.hypothesis.replace(/^POSSIBLE_/, "")}`,
        priority: primaryEvidence.severity,
        action: rule.inspection,
        humanConfirmationRequired: true
      }] : [{
        code: "COLLECT_MORE_EVIDENCE",
        priority: "info",
        action: "Review supported capabilities and collect more timestamped telemetry before proposing a cause.",
        humanConfirmationRequired: true
      }],
      relatedEvidence: {
        alertIds: alerts.map((alert) => alert.id).sort(),
        incidentIds: incidents.map((incident) => incident.id).sort(),
        maintenanceTicketIds: maintenance.map((ticket) => ticket.id).sort()
      },
      confidence: null,
      confidenceNotice: "No validated probability model is available; no confidence percentage is shown.",
      limitations: [
        "SIMULATED DATA only.",
        "Free-text questions are recorded for traceability but are not interpreted in this deterministic milestone.",
        "A working hypothesis is not a diagnosis or confirmed root cause."
      ],
      simulated: true,
      decisionSupportOnly: true,
      physicalControl: false,
      causalConclusion: null
    };
  }
}

function severityRank(severity) {
  return ({ info: 0, warning: 1, high: 2, critical: 3 })[severity] ?? -1;
}
