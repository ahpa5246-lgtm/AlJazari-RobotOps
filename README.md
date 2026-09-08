# AlJazari RobotOps

Vendor-agnostic robot fleet intelligence, diagnostics and predictive-maintenance foundation for an independent AlJazari Robotics proposal.

This first vertical slice is real software backed by a deterministic in-memory simulator—not a hardcoded dashboard. Twenty fictional robots expose optional capabilities and changing timestamped telemetry through a universal service boundary. Derived fleet totals, a documented health heuristic and explainable threshold evidence feed an Arabic/English command center.

> **SIMULATED DATA:** all robots, clients, sites, telemetry, faults and recommendations in this repository are fictional. The prototype cannot control a physical robot and makes no validated predictive-accuracy claim.

## Run

Requires Node.js 22 or later.

```bash
npm ci
npm run verify
npm start
```

Open `http://localhost:3000`.

## API

- `GET /api/health`
- `GET /api/fleet?search=&status=&clientId=`
- `GET /api/analytics/missions?clientId=`
- `GET /api/robots/:id?clientId=`
- `GET /api/robots/:id/diagnostics?clientId=&question=`
- `GET /api/robots/:id/missions?clientId=`
- `GET /api/robots/:id/telemetry?clientId=&startAt=&endAt=&limit=&cursor=`
- `GET /api/alerts?clientId=`
- `POST /api/alerts/:id/acknowledge` with `{ "actor": "demo-technician", "confirmed": true }`
- `GET /api/incidents?clientId=`
- `GET /api/incidents/:id/replay?clientId=`
- `GET /api/maintenance?clientId=`
- `POST /api/maintenance/tickets` with `{ "alertId": "ALT-...", "actor": "demo-technician", "confirmed": true }`
- `POST /api/simulator/faults` with `{ "robotId": "AJR-002", "fault": "wheel-friction", "confirmed": true }`

Incident replay endpoints reconstruct a bounded, read-only evidence window from recorded simulator samples. Missing position capability is reported explicitly; no path is interpolated and no causal conclusion is generated.

The diagnostic endpoint applies documented deterministic rules to recorded telemetry. It returns the exact evidence window, a cautious working hypothesis, alternatives and human inspection steps. The free-text question is recorded for traceability but is not semantically interpreted in this milestone. Confidence remains `null` because no validated probability model exists.

Mission timelines are reconstructed from adapter-reported mission transitions. Start time, terminal status, duration, distance and reason codes remain `null` or incomplete when the recorded window or robot capability does not supply enough evidence. The endpoint is read-only and cannot start, cancel or reroute a robot.

Fleet mission analytics aggregate those records with formula version `mission-analytics-v1`. Every rate exposes its exact numerator, denominator and eligibility rule. Completion, failure and cancellation use observed terminal outcomes only; utilization uses reported mission-state samples from mission-capable robots. Duration and distance disclose contributing and excluded records. Empty denominators return `null`, never a decorative zero. No confidence or predictive claim is produced.

Bounded telemetry history is read through an explicit repository contract rather than simulator-owned arrays. The endpoint exposes stable ascending timestamp order, inclusive time bounds, an exclusive continuation cursor, a maximum 120-sample page, tenant scope and retention/source metadata. The current repository is deterministic, in-memory and non-durable; it is not production storage.

Simulator samples enter that repository through `telemetry-ingestion-v1`. The gateway verifies configured source identity, tenant ownership, per-robot sequence and observed/received timestamps, then attaches source provenance that payloads cannot provide themselves. It rejects real sources and command fields in this prototype; it is not a production broker, credential verifier or physical-control path.

`RestMonitoringAdapter` demonstrates a second adapter behind the same contracts. It reads deterministic JSON fixtures through an injected `FixtureRestTransport`, normalizes only explicitly supplied capabilities and telemetry, and sends accepted samples through `telemetry-ingestion-v1`. The fixture transport is offline, credential-free and GET-only; the adapter has no command method, control route or actuator schema. It is an integration example, not a live vendor connector.

All POST endpoints mutate in-memory demo state only and cannot issue physical commands. Alert acknowledgement and maintenance-ticket creation each require an explicit human actor and confirmation. A ticket can be created only from acknowledged evidence.

## Verification

`npm run verify` performs syntax/type-safety checks available without dependencies, forty deterministic domain and UI-contract tests and a reproducible production artifact build. GitHub Actions runs the same command.

## Known limits

- In-memory demo persistence only.
- Alert and maintenance state are in-memory only; authentication/RBAC and database adapters are later architecture gates.
- Incident replay is a bounded evidence reconstruction, not a physics simulator or proof of root cause.
- The diagnostic assistant is deterministic decision support, not an LLM diagnosis. It does not interpret free text, prove causality or display an unvalidated confidence percentage.
- Mission history exists only inside the bounded in-memory telemetry window. Partial lifecycles remain visibly incomplete and are not backfilled.
- Fleet mission analytics describe only the current bounded in-memory window; they are not historical SLAs, forecasts or validated business-performance claims.
- The telemetry repository retains at most 120 samples per robot, is erased on restart and provides no production database, encryption-at-rest or backup guarantee.
- The REST monitoring example uses local deterministic fixtures only. It performs no network I/O, authentication or vendor API negotiation and must not be presented as a production connector.
- Inspection windows are documented severity rules, not predicted failure probabilities. Tickets never trigger repair or physical control.
- Health and anomaly rules are transparent prototype heuristics, not validated failure prediction.
- Canvas topology is a progressive visualization; the semantic fleet registry remains available without it.

See [architecture](docs/ARCHITECTURE.md), [design](docs/DESIGN.md) and [security boundaries](docs/SECURITY.md).
