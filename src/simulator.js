import { InMemoryTelemetryRepository, assertTelemetryRepository } from "./telemetry-repository.js";
import { TelemetryIngestionGateway } from "./telemetry-ingestion.js";

const CLIENTS = [
  { id: "client-northstar", name: "Northstar Market", site: { id: "site-river", name: "River District Hub" } },
  { id: "client-bluebird", name: "Bluebird Pharmacy Demo", site: { id: "site-harbor", name: "Harbor Pickup Zone" } },
  { id: "client-evergreen", name: "Evergreen Grocer", site: { id: "site-garden", name: "Garden Loop Depot" } }
];

const MODELS = [
  { manufacturer: "Fictional Open Fleet", model: "Parcel-25", payloadCapacityKg: 25, capabilities: { battery: true, pose: true, missions: true, motors: false, sensors: true, network: true } },
  { manufacturer: "Generic ROS 2", model: "Courier-X", payloadCapacityKg: 40, capabilities: { battery: true, pose: true, missions: true, motors: true, sensors: true, network: true } },
  { manufacturer: "Fictional Adapter", model: "Drop-Mini", payloadCapacityKg: 12, capabilities: { battery: true, pose: false, missions: false, motors: false, sensors: false, network: true } }
];

export class SimulatorAdapter {
  constructor({ seed = 20260907, count = 20, startTime = "2026-09-07T20:00:00.000Z", telemetryRepository = new InMemoryTelemetryRepository() } = {}) {
    this.seed = seed;
    this.random = mulberry32(seed);
    this.tickNumber = 0;
    this.startTime = new Date(startTime).getTime();
    this.robots = Array.from({ length: count }, (_, index) => this.#createRobot(index));
    this.telemetryRepository = assertTelemetryRepository(telemetryRepository);
    this.telemetryIngestion = new TelemetryIngestionGateway({
      repository: this.telemetryRepository,
      source: { sourceId: "simulator-primary", ...this.describe() }
    });
    for (const robot of this.robots) this.telemetryIngestion.registerRobot(robot);
    this.faults = new Map();
    for (let index = 0; index < 6; index += 1) this.tick();
  }

  describe() {
    return { adapterId: "deterministic-simulator", transport: "in-process", simulated: true, supportsControl: false };
  }

  listRobots() { return this.robots.map((robot) => structuredClone(robot)); }
  capabilities(robotId) { return structuredClone(this.#robot(robotId).capabilities); }
  telemetry(robotId) {
    return this.telemetryRepository.query({
      robotId,
      limit: this.telemetryRepository.describe().maxQueryLimit
    })?.samples ?? [];
  }

  injectFault(robotId, fault) {
    const supported = ["motor-overheat", "wheel-friction", "network-instability", "localization-loss"];
    if (!supported.includes(fault)) throw new Error("Unsupported simulator fault");
    this.#robot(robotId);
    this.faults.set(robotId, fault);
    this.tick();
    return { robotId, fault, simulated: true, humanConfirmed: true };
  }

  tick() {
    this.tickNumber += 1;
    const observedAt = new Date(this.startTime + this.tickNumber * 30_000).toISOString();
    for (const [index, robot] of this.robots.entries()) {
      const fault = this.faults.get(robot.id);
      const phase = this.tickNumber * 0.37 + index;
      const sample = {
        observedAt,
        batteryPercentage: round(Math.max(8, 96 - this.tickNumber * (0.18 + index % 4 * 0.02) - index * 1.7)),
        batteryTemperature: round(34 + Math.sin(phase) * 1.8),
        motorCurrent: robot.capabilities.motors ? round(2.5 + Math.sin(phase) * 0.35) : null,
        motorTemperature: robot.capabilities.motors ? round(43 + Math.cos(phase) * 2.2) : null,
        localizationQuality: robot.capabilities.sensors ? round(91 + Math.sin(phase / 2) * 4) : null,
        networkLatency: round(48 + (index % 5) * 9 + Math.abs(Math.sin(phase)) * 18),
        signalStrength: round(91 - (index % 6) * 4),
        position: robot.capabilities.pose ? { x: round(12 + Math.cos(phase) * (3 + index % 4)), y: round(8 + Math.sin(phase) * (2 + index % 3)), orientation: round(phase % (Math.PI * 2)) } : null,
        mission: robot.capabilities.missions ? missionAt(this.tickNumber, index) : null
      };
      if (fault === "motor-overheat" && robot.capabilities.motors) sample.motorTemperature = 69 + this.tickNumber % 3;
      if (fault === "wheel-friction" && robot.capabilities.motors) sample.motorCurrent = 6.4 + this.tickNumber % 2 * 0.2;
      if (fault === "network-instability") sample.networkLatency = 520 + this.tickNumber % 4 * 20;
      if (fault === "localization-loss" && robot.capabilities.sensors) sample.localizationQuality = 42 - this.tickNumber % 3;
      this.telemetryIngestion.ingest({
        sourceId: "simulator-primary",
        adapterId: this.describe().adapterId,
        transport: this.describe().transport,
        sequence: this.tickNumber,
        receivedAt: observedAt,
        robotId: robot.id,
        organizationId: robot.organizationId,
        clientId: robot.clientId,
        sample
      });
      robot.lastSeen = observedAt;
      robot.connectionStatus = sample.networkLatency > 500 ? "warning" : "online";
    }
    return observedAt;
  }

  #createRobot(index) {
    const model = MODELS[index % MODELS.length];
    const client = CLIENTS[index % CLIENTS.length];
    return {
      id: `PDR-${String(index + 1).padStart(3, "0")}`,
      organizationId: "org-parcel-grid-demo",
      clientId: client.id,
      clientName: client.name,
      siteId: client.site.id,
      siteName: client.site.name,
      manufacturer: model.manufacturer,
      model: model.model,
      payloadCapacityKg: model.payloadCapacityKg,
      serialNumber: `SIM-${this.seed}-${String(index + 1).padStart(3, "0")}`,
      firmwareVersion: `demo-${1 + index % 3}.${index % 10}`,
      connectionStatus: "online",
      lastSeen: null,
      capabilities: structuredClone(model.capabilities),
      simulated: true
    };
  }

  #robot(robotId) {
    const robot = this.robots.find((item) => item.id === robotId);
    if (!robot) throw new Error("Robot not found");
    return robot;
  }
}

function mulberry32(seed) {
  return function random() {
    let value = seed += 0x6D2B79F5;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function round(value) { return Math.round(value * 100) / 100; }

function missionAt(tickNumber, robotIndex) {
  const absolute = tickNumber + robotIndex * 5;
  const cycle = Math.floor(absolute / 24);
  const phase = absolute % 24;
  if (phase < 3 || phase > 18) return { id: null, parcelId: null, state: "idle", stage: "awaiting-pickup", progress: 0, routeProgress: 0, payloadKg: 0, pickupStop: null, dropoffStop: null, distanceMeters: 0, reasonCode: null };

  const id = `MS-${String(robotIndex + 1).padStart(3, "0")}-${String(cycle + 1).padStart(3, "0")}`;
  const workingProgress = Math.min(94, Math.round((phase - 3) / 15 * 94));
  if (phase < 18) {
    return { id, parcelId: `PKG-${String(robotIndex + 41).padStart(4, "0")}`, state: "working", stage: workingProgress < 20 ? "pickup" : workingProgress < 88 ? "en-route" : "drop-off", progress: workingProgress, routeProgress: workingProgress, payloadKg: round(2.4 + robotIndex % 5 * 1.3), pickupStop: `P-${1 + robotIndex % 7}`, dropoffStop: `D-${8 + robotIndex % 9}`, distanceMeters: round(workingProgress * (0.36 + robotIndex % 4 * 0.04)), reasonCode: null };
  }

  const selector = (robotIndex + cycle) % 10;
  const state = selector === 0 ? "failed" : selector === 1 ? "cancelled" : "completed";
  return {
    id,
    parcelId: `PKG-${String(robotIndex + 41).padStart(4, "0")}`,
    state,
    stage: state === "completed" ? "delivered" : "delivery-exception",
    progress: state === "completed" ? 100 : workingProgress,
    routeProgress: state === "completed" ? 100 : workingProgress,
    payloadKg: round(2.4 + robotIndex % 5 * 1.3),
    pickupStop: `P-${1 + robotIndex % 7}`,
    dropoffStop: `D-${8 + robotIndex % 9}`,
    distanceMeters: round((state === "completed" ? 100 : workingProgress) * (0.36 + robotIndex % 4 * 0.04)),
    reasonCode: state === "failed" ? "DELIVERY_ROUTE_BLOCKED" : state === "cancelled" ? "DEMO_OPERATOR_CANCELLED" : null
  };
}
