// Presentation only. No inferred measurements or control capability.
export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

export function groupSites(robots) {
  const sites = new Map();
  for (const robot of robots) {
    const key = JSON.stringify([robot.organizationId, robot.clientId, robot.siteId]);
    if (!sites.has(key)) sites.set(key, { key, name: robot.siteName, client: robot.clientName, robots: [] });
    sites.get(key).robots.push(robot);
  }
  return [...sites.values()];
}

export function comparisonRows(robots) {
  const signal = (robot, capability, field, suffix) => robot.capabilities[capability] === true && Number.isFinite(robot.telemetry[field]) ? `${robot.telemetry[field]}${suffix}` : null;
  return [
    { key: "health", values: robots.map(r => Number.isFinite(r.health.overall) ? `${r.health.overall} / 100` : null) },
    { key: "batteryLabel", values: robots.map(r => signal(r, "battery", "batteryPercentage", "%")) },
    { key: "networkLabel", values: robots.map(r => signal(r, "network", "networkLatency", " ms")) },
    { key: "motorLabel", values: robots.map(r => signal(r, "motors", "motorCurrent", " A")) },
    { key: "temperatureLabel", values: robots.map(r => signal(r, "motors", "motorTemperature", " °C")) },
    { key: "state", values: robots.map(r => r.operationalState) },
    { key: "observedLabel", values: robots.map(r => r.telemetry.observedAt ?? null) }
  ];
}

export function toggleComparison(ids, id) {
  if (ids.includes(id)) return ids.filter(value => value !== id);
  return ids.length < 2 ? [...ids, id] : ids;
}
