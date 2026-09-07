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
- `GET /api/robots/:id?clientId=`
- `GET /api/alerts?clientId=`
- `POST /api/alerts/:id/acknowledge` with `{ "actor": "demo-technician", "confirmed": true }`
- `GET /api/maintenance?clientId=`
- `POST /api/maintenance/tickets` with `{ "alertId": "ALT-...", "actor": "demo-technician", "confirmed": true }`
- `POST /api/simulator/faults` with `{ "robotId": "AJR-002", "fault": "wheel-friction", "confirmed": true }`

All POST endpoints mutate in-memory demo state only and cannot issue physical commands. Alert acknowledgement and maintenance-ticket creation each require an explicit human actor and confirmation. A ticket can be created only from acknowledged evidence.

## Verification

`npm run verify` performs syntax/type-safety checks available without dependencies, eleven deterministic domain tests and a reproducible production artifact build. GitHub Actions runs the same command.

## Known limits

- In-memory demo persistence only.
- Alert and maintenance state are in-memory only; authentication/RBAC and database adapters are later architecture gates.
- Inspection windows are documented severity rules, not predicted failure probabilities. Tickets never trigger repair or physical control.
- Health and anomaly rules are transparent prototype heuristics, not validated failure prediction.
- Canvas topology is a progressive visualization; the semantic fleet registry remains available without it.

See [architecture](docs/ARCHITECTURE.md), [design](docs/DESIGN.md) and [security boundaries](docs/SECURITY.md).
