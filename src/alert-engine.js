const SEVERITY_ORDER = { critical: 0, high: 1, warning: 2, info: 3 };

/**
 * In-memory prototype alert lifecycle.
 * Fingerprints group repeated anomaly evidence by robot and rule.
 * Cooldown suppresses duplicate notifications while preserving occurrence counts.
 * Acknowledgement always requires an explicit human actor and confirmation.
 */
export class AlertEngine {
  constructor({ cooldownMs = 5 * 60_000 } = {}) {
    this.cooldownMs = cooldownMs;
    this.records = new Map();
  }

  ingest(robot, anomalies) {
    for (const anomaly of anomalies) {
      const id = `ALT-${robot.id}-${anomaly.code}`;
      const observedMs = Date.parse(anomaly.observedAt);
      if (!Number.isFinite(observedMs)) throw new Error("Alert evidence requires a valid timestamp");
      const existing = this.records.get(id);

      if (!existing) {
        this.records.set(id, {
          id,
          fingerprint: `${robot.id}:${anomaly.code}`,
          organizationId: robot.organizationId,
          clientId: robot.clientId,
          siteId: robot.siteId,
          robotId: robot.id,
          code: anomaly.code,
          severity: anomaly.severity,
          status: "open",
          firstSeenAt: anomaly.observedAt,
          lastSeenAt: anomaly.observedAt,
          lastObservedAt: anomaly.observedAt,
          lastNotifiedAt: anomaly.observedAt,
          cooldownUntil: new Date(observedMs + this.cooldownMs).toISOString(),
          occurrences: 1,
          notificationCount: 1,
          suppressedOccurrences: 0,
          evidence: structuredClone(anomaly),
          acknowledgement: null,
          simulated: true
        });
        continue;
      }

      if (existing.lastObservedAt === anomaly.observedAt) continue;
      existing.lastObservedAt = anomaly.observedAt;
      existing.lastSeenAt = anomaly.observedAt;
      existing.occurrences += 1;
      existing.evidence = structuredClone(anomaly);
      existing.severity = anomaly.severity;

      if (existing.status === "acknowledged" || observedMs < Date.parse(existing.cooldownUntil)) {
        existing.suppressedOccurrences += 1;
      } else {
        existing.notificationCount += 1;
        existing.lastNotifiedAt = anomaly.observedAt;
        existing.cooldownUntil = new Date(observedMs + this.cooldownMs).toISOString();
      }
    }
    return this.list();
  }

  acknowledge(alertId, { actor, confirmed, acknowledgedAt = new Date().toISOString() }) {
    if (confirmed !== true) throw new Error("Explicit human confirmation is required");
    if (typeof actor !== "string" || actor.trim().length < 2 || actor.trim().length > 80) {
      throw new Error("A valid human actor is required");
    }
    const alert = this.records.get(alertId);
    if (!alert) throw new Error("Alert not found");
    if (alert.status !== "acknowledged") {
      alert.status = "acknowledged";
      alert.acknowledgement = {
        actor: actor.trim(),
        acknowledgedAt,
        humanConfirmed: true
      };
    }
    return structuredClone(alert);
  }

  list({ organizationId, clientId, robotId } = {}) {
    return [...this.records.values()]
      .filter((alert) => !organizationId || alert.organizationId === organizationId)
      .filter((alert) => !clientId || alert.clientId === clientId)
      .filter((alert) => !robotId || alert.robotId === robotId)
      .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9) || b.lastSeenAt.localeCompare(a.lastSeenAt))
      .map((alert) => structuredClone(alert));
  }
}
