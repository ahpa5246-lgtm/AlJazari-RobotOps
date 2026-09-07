const INSPECTION_WINDOWS_HOURS = {
  critical: 24,
  high: 120,
  warning: 336,
  info: 720
};

/**
 * Turns acknowledged alert evidence into a deterministic maintenance suggestion.
 * Suggestions never claim a probability and never perform physical or repair actions.
 */
export class MaintenanceWorkflow {
  constructor() {
    this.tickets = new Map();
  }

  suggest(alert) {
    if (alert.status !== "acknowledged" || alert.acknowledgement?.humanConfirmed !== true) return null;
    const inspectWithinHours = INSPECTION_WINDOWS_HOURS[alert.severity] ?? INSPECTION_WINDOWS_HOURS.info;
    const dueAt = new Date(Date.parse(alert.lastSeenAt) + inspectWithinHours * 60 * 60_000).toISOString();
    const existing = this.#ticketForAlert(alert.id);
    return {
      id: `SUG-${alert.id}`,
      sourceAlertId: alert.id,
      organizationId: alert.organizationId,
      clientId: alert.clientId,
      siteId: alert.siteId,
      robotId: alert.robotId,
      priority: alert.severity,
      inspectWithinHours,
      dueAt,
      ruleVersion: "maintenance-window-v1",
      rationale: `Rule-based inspection window for ${alert.code}; review source evidence before replacing parts.`,
      evidence: {
        code: alert.code,
        metric: alert.evidence.metric,
        value: alert.evidence.value,
        threshold: alert.evidence.threshold,
        baselineMean: alert.evidence.baselineMean,
        zScore: alert.evidence.zScore,
        observedAt: alert.evidence.observedAt
      },
      status: existing ? "ticket-created" : "awaiting-human-confirmation",
      ticketId: existing?.id ?? null,
      simulated: true,
      physicalAction: false
    };
  }

  listSuggestions(alerts) {
    return alerts.map((alert) => this.suggest(alert)).filter(Boolean);
  }

  confirm(alert, { actor, confirmed, confirmedAt = new Date().toISOString() }) {
    if (confirmed !== true) throw new Error("Explicit human confirmation is required");
    if (typeof actor !== "string" || actor.trim().length < 2 || actor.trim().length > 80) {
      throw new Error("A valid human actor is required");
    }
    const suggestion = this.suggest(alert);
    if (!suggestion) throw new Error("An acknowledged alert is required");
    const existing = this.#ticketForAlert(alert.id);
    if (existing) return { ticket: structuredClone(existing), created: false, duplicatePrevented: true };

    const ticket = {
      id: `MNT-${alert.id.replace(/^ALT-/, "")}`,
      sourceAlertId: alert.id,
      organizationId: alert.organizationId,
      clientId: alert.clientId,
      siteId: alert.siteId,
      robotId: alert.robotId,
      status: "open",
      priority: suggestion.priority,
      dueAt: suggestion.dueAt,
      openedAt: confirmedAt,
      openedBy: actor.trim(),
      humanConfirmed: true,
      ruleVersion: suggestion.ruleVersion,
      rationale: suggestion.rationale,
      evidence: structuredClone(suggestion.evidence),
      simulated: true,
      physicalAction: false
    };
    this.tickets.set(ticket.id, ticket);
    return { ticket: structuredClone(ticket), created: true, duplicatePrevented: false };
  }

  listTickets({ organizationId, clientId, robotId } = {}) {
    return [...this.tickets.values()]
      .filter((ticket) => !organizationId || ticket.organizationId === organizationId)
      .filter((ticket) => !clientId || ticket.clientId === clientId)
      .filter((ticket) => !robotId || ticket.robotId === robotId)
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
      .map((ticket) => structuredClone(ticket));
  }

  #ticketForAlert(alertId) {
    return [...this.tickets.values()].find((ticket) => ticket.sourceAlertId === alertId) ?? null;
  }
}
