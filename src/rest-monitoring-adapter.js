import { TelemetryIngestionGateway } from "./telemetry-ingestion.js";
import { InMemoryTelemetryRepository, assertTelemetryRepository } from "./telemetry-repository.js";

const CAPABILITY_KEYS = ["battery", "pose", "missions", "motors", "sensors", "network"];
const NUMERIC_TELEMETRY_KEYS = [
  "batteryPercentage",
  "batteryTemperature",
  "motorCurrent",
  "motorTemperature",
  "localizationQuality",
  "networkLatency",
  "signalStrength"
];
const TELEMETRY_CAPABILITY = {
  batteryPercentage: "battery",
  batteryTemperature: "battery",
  motorCurrent: "motors",
  motorTemperature: "motors",
  localizationQuality: "sensors",
  networkLatency: "network",
  signalStrength: "network"
};
const CONTROL_KEYS = new Set(["command", "physicalcontrol", "actuator", "actuators", "control", "velocitycommand"]);

/**
 * Vendor-neutral REST-shaped monitoring adapter.
 *
 * The transport is injected so this example can be exercised with deterministic
 * fixtures without network access or credentials. Only GET-style reads are
 * accepted; physical commands are deliberately outside this adapter.
 */
export class RestMonitoringAdapter {
  constructor({
    transport,
    sourceId = "fixture-rest-source",
    adapterId = "rest-monitoring-v1",
    telemetryRepository = new InMemoryTelemetryRepository()
  } = {}) {
    this.transport = assertReadOnlyTransport(transport);
    this.adapterId = requiredString(adapterId, "adapterId");
    this.sourceId = requiredString(sourceId, "sourceId");
    this.telemetryRepository = assertTelemetryRepository(telemetryRepository);
    this.telemetryIngestion = new TelemetryIngestionGateway({
      repository: this.telemetryRepository,
      source: { sourceId: this.sourceId, ...this.describe() }
    });
    this.robots = new Map();
    this.capabilityMap = new Map();
    this.#discoverRobots();
  }

  describe() {
    return {
      adapterId: this.adapterId,
      transport: "fixture-rest",
      simulated: true,
      supportsControl: false,
      monitoringOnly: true
    };
  }

  listRobots() {
    return [...this.robots.values()].map((robot) => structuredClone(robot));
  }

  capabilities(robotId) {
    this.#robot(robotId);
    return structuredClone(this.capabilityMap.get(robotId));
  }

  telemetry(robotId) {
    this.#robot(robotId);
    return this.telemetryRepository.query({
      robotId,
      limit: this.telemetryRepository.describe().maxQueryLimit
    })?.samples ?? [];
  }

  tick() {
    let accepted = 0;
    for (const robot of this.robots.values()) {
      const path = `/robots/${encodeURIComponent(robot.id)}/telemetry`;
      const envelope = this.transport.get(path);
      if (envelope == null) continue;
      const normalized = normalizeEnvelope(envelope, robot, this.capabilityMap.get(robot.id));
      this.telemetryIngestion.ingest({
        sourceId: this.sourceId,
        adapterId: this.adapterId,
        transport: this.describe().transport,
        ...normalized
      });
      robot.lastSeen = normalized.sample.observedAt;
      accepted += 1;
    }
    return { accepted, simulated: true, readOnly: true, physicalControl: false };
  }

  #discoverRobots() {
    const response = this.transport.get("/robots");
    if (!response || !Array.isArray(response.robots)) throw new TypeError("REST robot fixture must contain robots[]");
    for (const record of response.robots) {
      const robot = normalizeRobot(record);
      if (this.robots.has(robot.id)) throw new Error(`Duplicate REST robot identity: ${robot.id}`);
      this.robots.set(robot.id, robot);
      this.capabilityMap.set(robot.id, robot.capabilities);
      this.telemetryIngestion.registerRobot(robot);
    }
  }

  #robot(robotId) {
    const robot = this.robots.get(robotId);
    if (!robot) throw new Error("Robot not found");
    return robot;
  }
}

/** Deterministic test/demo transport. It cannot make a network request or mutate a vendor. */
export class FixtureRestTransport {
  constructor(fixtures = {}) {
    if (!fixtures || typeof fixtures !== "object" || Array.isArray(fixtures)) {
      throw new TypeError("Fixture transport requires a path-to-response object");
    }
    this.fixtures = structuredClone(fixtures);
  }

  describe() {
    return { transportId: "deterministic-fixture-rest", network: false, credentials: false, readOnly: true };
  }

  get(path) {
    if (typeof path !== "string" || !path.startsWith("/")) throw new TypeError("Fixture path must be absolute");
    const response = this.fixtures[path];
    return response === undefined ? null : structuredClone(response);
  }
}

function assertReadOnlyTransport(transport) {
  if (typeof transport?.get !== "function" || typeof transport?.describe !== "function") {
    throw new TypeError("REST adapter requires an injected read-only transport");
  }
  const description = transport.describe();
  if (description?.readOnly !== true || description?.network !== false || description?.credentials !== false) {
    throw new Error("Prototype REST transport must be read-only, offline and credential-free");
  }
  return transport;
}

function normalizeRobot(record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) throw new TypeError("REST robot must be an object");
  if (record.simulated === false) throw new Error("Prototype REST adapter accepts simulated robot fixtures only");
  const tenant = record.tenant;
  if (!tenant || typeof tenant !== "object" || Array.isArray(tenant)) throw new TypeError("REST robot tenant is required");
  const capabilities = normalizeCapabilities(record.capabilities);
  const robot = {
    id: requiredString(record.robotId, "robotId"),
    organizationId: requiredString(tenant.organizationId, "organizationId"),
    clientId: requiredString(tenant.clientId, "clientId"),
    siteId: requiredString(tenant.siteId, "siteId"),
    capabilities,
    simulated: true,
    connectionStatus: "unknown",
    lastSeen: null
  };
  copyOptionalString(record, robot, "manufacturer");
  copyOptionalString(record, robot, "model");
  copyOptionalString(record, robot, "serialNumber");
  copyOptionalString(record, robot, "firmwareVersion");
  return robot;
}

function normalizeCapabilities(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const normalized = {};
  for (const key of CAPABILITY_KEYS) {
    if (!Object.hasOwn(value, key)) continue;
    if (typeof value[key] !== "boolean") throw new TypeError(`Capability ${key} must be boolean when supplied`);
    normalized[key] = value[key];
  }
  return normalized;
}

function normalizeEnvelope(envelope, robot, capabilities) {
  if (!envelope || typeof envelope !== "object" || Array.isArray(envelope)) {
    throw new TypeError("REST telemetry envelope must be an object");
  }
  if (containsControlField(envelope)) throw new Error("REST monitoring payload cannot contain control or actuator fields");
  for (const field of ["sourceId", "adapterId", "transport", "provenance"]) {
    if (Object.hasOwn(envelope, field)) throw new Error("REST payload cannot assert source provenance");
  }
  const tenant = envelope.tenant;
  if (!tenant || typeof tenant !== "object" || Array.isArray(tenant)) throw new TypeError("REST telemetry tenant is required");
  const sample = normalizeSample(envelope.sample, capabilities);
  return {
    sequence: envelope.sequence,
    receivedAt: envelope.receivedAt,
    robotId: requiredString(envelope.robotId, "robotId"),
    organizationId: requiredString(tenant.organizationId, "organizationId"),
    clientId: requiredString(tenant.clientId, "clientId"),
    sample
  };
}

function normalizeSample(value, capabilities) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError("REST telemetry sample must be an object");
  if (Object.hasOwn(value, "provenance")) throw new Error("REST telemetry sample cannot assert provenance");
  if (value.simulated === false) throw new Error("Prototype REST adapter accepts simulated telemetry only");
  const sample = { observedAt: value.observedAt };
  for (const key of NUMERIC_TELEMETRY_KEYS) {
    if (!Object.hasOwn(value, key)) continue;
    const capability = TELEMETRY_CAPABILITY[key];
    if (capabilities[capability] !== true) throw new Error(`${key} telemetry requires declared ${capability} capability`);
    if (value[key] !== null && !Number.isFinite(value[key])) throw new TypeError(`${key} must be finite or null`);
    sample[key] = value[key];
  }
  copyCapabilityObject(value, sample, capabilities, "pose", "position");
  copyCapabilityObject(value, sample, capabilities, "missions", "mission");
  return sample;
}

function copyCapabilityObject(source, target, capabilities, capability, field) {
  if (!Object.hasOwn(source, field)) return;
  if (capabilities[capability] !== true) throw new Error(`${field} telemetry requires declared ${capability} capability`);
  const value = source[field];
  if (value !== null && (typeof value !== "object" || Array.isArray(value))) {
    throw new TypeError(`${field} must be an object or null`);
  }
  target[field] = structuredClone(value);
}

function copyOptionalString(source, target, key) {
  if (!Object.hasOwn(source, key)) return;
  target[key] = requiredString(source[key], key);
}

function requiredString(value, field) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${field} is required`);
  return value;
}

function containsControlField(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object") return false;
  if (seen.has(value)) throw new TypeError("REST fixture must not contain circular references");
  seen.add(value);
  for (const [key, nested] of Object.entries(value)) {
    if (CONTROL_KEYS.has(key.toLowerCase())) return true;
    if (containsControlField(nested, seen)) return true;
  }
  seen.delete(value);
  return false;
}
