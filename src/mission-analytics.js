const TERMINAL_STATES = new Set(["completed", "failed", "cancelled"]);

/**
 * Aggregates mission evidence without manufacturing missing observations.
 * Rates always expose their numerator, denominator and eligibility rule.
 */
export class MissionAnalytics {
  build({ robots = [], histories = new Map(), timelines = [] } = {}) {
    const capableRobots = robots.filter((robot) => robot.capabilities?.missions === true);
    const capableIds = new Set(capableRobots.map((robot) => robot.id));
    const eligibleTimelines = timelines.filter((timeline) => timeline.supported && capableIds.has(timeline.robotId));
    const missions = eligibleTimelines.flatMap((timeline) => timeline.missions);
    const terminalMissions = missions.filter((mission) => TERMINAL_STATES.has(mission.status));
    const observedSamples = capableRobots.flatMap((robot) => histories.get(robot.id) ?? []);
    const samplesWithMissionState = observedSamples.filter((sample) => typeof sample.mission?.state === "string");
    const workingSamples = samplesWithMissionState.filter((sample) => sample.mission.state === "working");
    const timestamps = observedSamples.map((sample) => sample.observedAt).filter(Boolean).sort();
    const durations = missions.map((mission) => mission.durationSeconds).filter(Number.isFinite);
    const distances = missions.map((mission) => mission.distanceMeters).filter(Number.isFinite);

    return {
      formulaVersion: "mission-analytics-v1",
      observationWindow: {
        startedAt: timestamps.at(0) ?? null,
        endedAt: timestamps.at(-1) ?? null,
        telemetrySampleCount: observedSamples.length
      },
      coverage: {
        missionCapableRobots: capableRobots.length,
        totalRobots: robots.length,
        unsupportedRobots: robots.length - capableRobots.length
      },
      records: {
        observedMissions: missions.length,
        terminalMissions: terminalMissions.length,
        incompleteMissions: missions.filter((mission) => mission.incompleteEvidence).length
      },
      outcomes: {
        completion: rate(terminalMissions.filter((mission) => mission.status === "completed").length, terminalMissions.length, "observed terminal missions only"),
        failure: rate(terminalMissions.filter((mission) => mission.status === "failed").length, terminalMissions.length, "observed terminal missions only"),
        cancellation: rate(terminalMissions.filter((mission) => mission.status === "cancelled").length, terminalMissions.length, "observed terminal missions only")
      },
      utilization: {
        ...rate(workingSamples.length, samplesWithMissionState.length, "telemetry samples from mission-capable robots with a reported mission state"),
        excludedSamples: observedSamples.length - samplesWithMissionState.length
      },
      duration: average(durations, missions.length, "missions with both an observed start and terminal timestamp", "seconds"),
      distance: total(distances, missions.length, "missions with adapter-reported distance", "metres"),
      simulated: true,
      confidence: null,
      predictive: false,
      readOnly: true,
      physicalControl: false
    };
  }
}

function rate(numerator, denominator, eligibility) {
  return {
    valuePercent: denominator > 0 ? round(numerator / denominator * 100) : null,
    numerator,
    denominator,
    eligibility
  };
}

function average(values, totalRecords, eligibility, unit) {
  return {
    value: values.length ? round(values.reduce((sum, value) => sum + value, 0) / values.length) : null,
    contributingRecords: values.length,
    excludedRecords: totalRecords - values.length,
    eligibility,
    unit
  };
}

function total(values, totalRecords, eligibility, unit) {
  return {
    value: values.length ? round(values.reduce((sum, value) => sum + value, 0)) : null,
    contributingRecords: values.length,
    excludedRecords: totalRecords - values.length,
    eligibility,
    unit
  };
}

function round(value) { return Math.round(value * 100) / 100; }
