/**
 * Runtime contract for every vendor adapter.
 * Capabilities and telemetry values are intentionally optional; an adapter must
 * never synthesize an unsupported signal merely to satisfy the interface.
 */
export function assertRobotAdapter(adapter) {
  const methods = ["describe", "listRobots", "capabilities", "telemetry", "tick"];
  for (const method of methods) {
    if (typeof adapter?.[method] !== "function") throw new TypeError(`Robot adapter is missing ${method}()`);
  }
  const description = adapter.describe();
  if (!description?.adapterId || !description?.transport || typeof description.supportsControl !== "boolean") {
    throw new TypeError("Robot adapter metadata is incomplete");
  }
  return adapter;
}
