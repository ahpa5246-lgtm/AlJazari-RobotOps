const TERMINAL_STATES = new Set(["completed", "failed", "cancelled"]);

/**
 * Reconstructs mission lifecycle records from adapter-supplied telemetry only.
 * Missing starts, distances and reasons remain null rather than being inferred.
 */
export class MissionTimeline {
  build(robot, history = []) {
    if (!robot) throw new Error("Mission timeline requires a robot");
    if (robot.capabilities?.missions !== true) {
      return emptyTimeline(robot, "Mission telemetry is unsupported by this adapter.");
    }

    const ordered = [...history].sort((a, b) => a.observedAt.localeCompare(b.observedAt));
    const records = new Map();
    const events = [];

    for (const [index, sample] of ordered.entries()) {
      const mission = sample.mission;
      if (!mission?.id || !mission.state || mission.state === "idle") continue;
      const previousMission = ordered[index - 1]?.mission;
      const observedStart = mission.state === "working" && index > 0 && previousMission?.id !== mission.id;
      let record = records.get(mission.id);
      if (!record) {
        record = {
          id: mission.id,
          parcelId: mission.parcelId ?? null,
          pickupStop: mission.pickupStop ?? null,
          dropoffStop: mission.dropoffStop ?? null,
          payloadKg: Number.isFinite(mission.payloadKg) ? mission.payloadKg : null,
          robotId: robot.id,
          status: mission.state,
          startedAt: observedStart ? sample.observedAt : null,
          endedAt: TERMINAL_STATES.has(mission.state) ? sample.observedAt : null,
          durationSeconds: null,
          distanceMeters: Number.isFinite(mission.distanceMeters) ? mission.distanceMeters : null,
          reasonCode: mission.reasonCode ?? null,
          firstObservedAt: sample.observedAt,
          lastObservedAt: sample.observedAt,
          incompleteEvidence: !observedStart
        };
        records.set(mission.id, record);
        events.push(eventFrom(robot, mission, sample.observedAt, observedStart ? "transition" : "first-observed"));
      } else {
        if (record.status !== mission.state) events.push(eventFrom(robot, mission, sample.observedAt, "transition"));
        record.status = mission.state;
        record.lastObservedAt = sample.observedAt;
        if (!record.startedAt && mission.state === "working" && previousMission?.id !== mission.id) record.startedAt = sample.observedAt;
        if (TERMINAL_STATES.has(mission.state) && !record.endedAt) record.endedAt = sample.observedAt;
        if (Number.isFinite(mission.distanceMeters)) {
          record.distanceMeters = record.distanceMeters === null ? mission.distanceMeters : Math.max(record.distanceMeters, mission.distanceMeters);
        }
        if (mission.reasonCode) record.reasonCode = mission.reasonCode;
      }
    }

    const missions = [...records.values()].map((record) => {
      const durationSeconds = record.startedAt && record.endedAt
        ? Math.max(0, Math.round((Date.parse(record.endedAt) - Date.parse(record.startedAt)) / 1000))
        : null;
      return {
        ...record,
        durationSeconds,
        incompleteEvidence: record.startedAt === null || (TERMINAL_STATES.has(record.status) && record.endedAt === null)
      };
    }).sort((a, b) => b.lastObservedAt.localeCompare(a.lastObservedAt));

    const latestMission = ordered.at(-1)?.mission;
    const currentMission = latestMission?.id && latestMission.state === "working"
      ? missions.find((mission) => mission.id === latestMission.id) ?? null
      : null;

    return {
      robotId: robot.id,
      organizationId: robot.organizationId,
      clientId: robot.clientId,
      supported: true,
      generatedAt: ordered.at(-1)?.observedAt ?? null,
      currentMission,
      missions,
      events: events.sort((a, b) => a.observedAt.localeCompare(b.observedAt)),
      capabilityNotice: missions.length ? null : "No mission lifecycle evidence is present in the recorded window.",
      simulated: true,
      readOnly: true,
      physicalControl: false
    };
  }
}

function eventFrom(robot, mission, observedAt, kind) {
  return {
    id: `${mission.id}-${mission.state}-${observedAt}`,
    robotId: robot.id,
    missionId: mission.id,
    observedAt,
    state: mission.state,
    progress: Number.isFinite(mission.progress) ? mission.progress : null,
    routeProgress: Number.isFinite(mission.routeProgress) ? mission.routeProgress : null,
    parcelId: mission.parcelId ?? null,
    pickupStop: mission.pickupStop ?? null,
    dropoffStop: mission.dropoffStop ?? null,
    payloadKg: Number.isFinite(mission.payloadKg) ? mission.payloadKg : null,
    distanceMeters: Number.isFinite(mission.distanceMeters) ? mission.distanceMeters : null,
    reasonCode: mission.reasonCode ?? null,
    kind,
    source: "adapter-telemetry"
  };
}

function emptyTimeline(robot, capabilityNotice) {
  return {
    robotId: robot.id,
    organizationId: robot.organizationId,
    clientId: robot.clientId,
    supported: false,
    generatedAt: null,
    currentMission: null,
    missions: [],
    events: [],
    capabilityNotice,
    simulated: true,
    readOnly: true,
    physicalControl: false
  };
}
