const DEFAULT_LIMIT = 30;

/** Executable storage boundary for timestamped robot telemetry. */
export function assertTelemetryRepository(repository) {
  for (const method of ["describe", "registerRobot", "append", "query"]) {
    if (typeof repository?.[method] !== "function") {
      throw new TypeError(`Telemetry repository is missing ${method}()`);
    }
  }
  const description = repository.describe();
  if (!description?.repositoryId || !Number.isInteger(description.maxQueryLimit) || description.maxQueryLimit < 1) {
    throw new TypeError("Telemetry repository metadata is incomplete");
  }
  return repository;
}

/**
 * Deterministic, bounded prototype implementation.
 * It is intentionally non-durable and must not be represented as production storage.
 */
export class InMemoryTelemetryRepository {
  constructor({ retentionSamplesPerRobot = 120, maxQueryLimit = 120 } = {}) {
    if (!Number.isInteger(retentionSamplesPerRobot) || retentionSamplesPerRobot < 1) {
      throw new TypeError("Invalid retention capacity");
    }
    if (!Number.isInteger(maxQueryLimit) || maxQueryLimit < 1) throw new TypeError("Invalid query limit");
    this.retentionSamplesPerRobot = retentionSamplesPerRobot;
    this.maxQueryLimit = Math.min(maxQueryLimit, retentionSamplesPerRobot);
    this.robots = new Map();
    this.samples = new Map();
    this.dropped = new Map();
  }

  describe() {
    return {
      repositoryId: "deterministic-in-memory-telemetry",
      storage: "memory",
      durable: false,
      retentionSamplesPerRobot: this.retentionSamplesPerRobot,
      maxQueryLimit: this.maxQueryLimit
    };
  }

  registerRobot(robot) {
    if (!robot?.id || !robot.organizationId || !robot.clientId) {
      throw new TypeError("Robot tenant identity is required");
    }
    const identity = {
      robotId: robot.id,
      organizationId: robot.organizationId,
      clientId: robot.clientId
    };
    const existing = this.robots.get(robot.id);
    if (existing && (existing.organizationId !== identity.organizationId || existing.clientId !== identity.clientId)) {
      throw new Error("Registered robot tenant identity cannot change");
    }
    this.robots.set(robot.id, identity);
    if (!this.samples.has(robot.id)) this.samples.set(robot.id, []);
    if (!this.dropped.has(robot.id)) this.dropped.set(robot.id, 0);
  }

  append(robotId, sample) {
    if (!this.robots.has(robotId)) throw new Error("Robot is not registered");
    const observedAt = parseTimestamp(sample?.observedAt, "observedAt");
    const history = this.samples.get(robotId);
    const previous = history.at(-1);
    if (previous && observedAt <= previous.observedAt) {
      throw new Error("Telemetry timestamps must be strictly increasing");
    }
    history.push(structuredClone({ ...sample, observedAt }));
    while (history.length > this.retentionSamplesPerRobot) {
      history.shift();
      this.dropped.set(robotId, this.dropped.get(robotId) + 1);
    }
  }

  query({ robotId, organizationId, clientId, startAt, endAt, cursor, limit } = {}) {
    const identity = this.robots.get(robotId);
    if (!identity) return null;
    if (organizationId && identity.organizationId !== organizationId) return null;
    if (clientId && identity.clientId !== clientId) return null;

    const normalizedLimit = Number(limit ?? Math.min(DEFAULT_LIMIT, this.maxQueryLimit));
    if (!Number.isInteger(normalizedLimit) || normalizedLimit < 1 || normalizedLimit > this.maxQueryLimit) {
      throw new RangeError(`limit must be between 1 and ${this.maxQueryLimit}`);
    }
    const normalizedStart = startAt ? parseTimestamp(startAt, "startAt") : null;
    const normalizedEnd = endAt ? parseTimestamp(endAt, "endAt") : null;
    const normalizedCursor = cursor ? parseTimestamp(cursor, "cursor") : null;
    if (normalizedStart && normalizedEnd && normalizedStart > normalizedEnd) {
      throw new RangeError("startAt must not follow endAt");
    }

    const retained = this.samples.get(robotId);
    const eligible = retained.filter((sample) =>
      (!normalizedStart || sample.observedAt >= normalizedStart) &&
      (!normalizedEnd || sample.observedAt <= normalizedEnd) &&
      (!normalizedCursor || sample.observedAt > normalizedCursor)
    );
    const page = eligible.slice(0, normalizedLimit);
    const hasNextPage = eligible.length > page.length;

    return {
      robotId,
      scope: structuredClone(identity),
      samples: structuredClone(page),
      pageInfo: {
        limit: normalizedLimit,
        returned: page.length,
        hasNextPage,
        nextCursor: hasNextPage ? page.at(-1).observedAt : null,
        order: "observedAt-ascending"
      },
      retention: {
        policy: "bounded-sample-count",
        capacity: this.retentionSamplesPerRobot,
        retainedSamples: retained.length,
        droppedSamples: this.dropped.get(robotId),
        oldestRetainedAt: retained.at(0)?.observedAt ?? null,
        newestRetainedAt: retained.at(-1)?.observedAt ?? null
      },
      source: this.describe(),
      simulated: true,
      readOnly: true,
      physicalControl: false
    };
  }
}

function parseTimestamp(value, field) {
  const explicitIsoTimestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;
  if (typeof value !== "string" || !explicitIsoTimestamp.test(value)) {
    throw new TypeError(`${field} must be an ISO timestamp with an explicit timezone`);
  }
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) throw new TypeError(`${field} must be an ISO timestamp`);
  return timestamp.toISOString();
}
