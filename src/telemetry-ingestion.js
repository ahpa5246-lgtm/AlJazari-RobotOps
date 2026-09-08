import { assertTelemetryRepository } from "./telemetry-repository.js";

/**
 * Validates one configured telemetry source before samples cross the storage boundary.
 * The prototype intentionally accepts simulated, monitoring-only sources exclusively.
 */
export class TelemetryIngestionGateway {
  constructor({ repository, source } = {}) {
    this.repository = assertTelemetryRepository(repository);
    this.source = Object.freeze(validateSource(source));
    this.robots = new Map();
    this.lastSequence = new Map();
  }

  describe() {
    return {
      gatewayId: "telemetry-ingestion-v1",
      source: structuredClone(this.source),
      acceptsRealTelemetry: false,
      acceptsCommands: false,
      physicalControl: false
    };
  }

  registerRobot(robot) {
    if (!robot?.id || !robot.organizationId || !robot.clientId) {
      throw new TypeError("Robot tenant identity is required for ingestion");
    }
    const identity = {
      robotId: robot.id,
      organizationId: robot.organizationId,
      clientId: robot.clientId
    };
    const existing = this.robots.get(robot.id);
    if (existing && (existing.organizationId !== identity.organizationId || existing.clientId !== identity.clientId)) {
      throw new Error("Ingestion robot tenant identity cannot change");
    }
    this.repository.registerRobot(robot);
    this.robots.set(robot.id, identity);
  }

  ingest({ sourceId, adapterId, transport, sequence, receivedAt, robotId, organizationId, clientId, sample } = {}) {
    const identity = this.robots.get(robotId);
    if (!identity) throw new Error("Robot is not registered for ingestion");
    if (identity.organizationId !== organizationId || identity.clientId !== clientId) {
      throw new Error("Telemetry envelope does not match the registered tenant");
    }
    if (sourceId !== this.source.sourceId || adapterId !== this.source.adapterId || transport !== this.source.transport) {
      throw new Error("Telemetry source provenance does not match the configured source");
    }
    if (!Number.isSafeInteger(sequence) || sequence < 1) throw new TypeError("Telemetry sequence must be a positive safe integer");
    const previousSequence = this.lastSequence.get(robotId);
    if (previousSequence && sequence <= previousSequence) throw new Error("Telemetry sequence must be strictly increasing");
    if (!sample || typeof sample !== "object" || Array.isArray(sample)) throw new TypeError("Telemetry sample must be an object");
    if (Object.hasOwn(sample, "provenance")) throw new Error("Telemetry payload cannot supply provenance metadata");
    if (sample.simulated === false) throw new Error("Telemetry payload conflicts with the simulated source boundary");
    if (containsControlField(sample)) {
      throw new Error("Control fields are not accepted by telemetry ingestion");
    }

    const normalizedReceivedAt = parseTimestamp(receivedAt, "receivedAt");
    const normalizedObservedAt = parseTimestamp(sample.observedAt, "observedAt");
    if (normalizedReceivedAt < normalizedObservedAt) throw new RangeError("receivedAt must not precede observedAt");

    const provenance = {
      gatewayId: "telemetry-ingestion-v1",
      sourceId: this.source.sourceId,
      adapterId: this.source.adapterId,
      transport: this.source.transport,
      sequence,
      receivedAt: normalizedReceivedAt,
      simulated: true,
      verified: true
    };
    this.repository.append(robotId, { ...sample, observedAt: normalizedObservedAt, provenance });
    this.lastSequence.set(robotId, sequence);
    return {
      accepted: true,
      robotId,
      observedAt: normalizedObservedAt,
      provenance: structuredClone(provenance),
      physicalControl: false
    };
  }
}

function validateSource(source) {
  if (!source?.sourceId || !source.adapterId || !source.transport) {
    throw new TypeError("Telemetry source identity, adapter and transport are required");
  }
  if (source.simulated !== true) throw new Error("Prototype ingestion accepts simulated sources only");
  if (source.supportsControl !== false) throw new Error("Telemetry source must not expose physical control");
  return {
    sourceId: source.sourceId,
    adapterId: source.adapterId,
    transport: source.transport,
    simulated: true,
    supportsControl: false
  };
}

function containsControlField(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object") return false;
  if (seen.has(value)) throw new TypeError("Telemetry sample must not contain circular references");
  seen.add(value);
  for (const [key, nested] of Object.entries(value)) {
    if (key === "command" || key === "physicalControl") return true;
    if (containsControlField(nested, seen)) return true;
  }
  seen.delete(value);
  return false;
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
