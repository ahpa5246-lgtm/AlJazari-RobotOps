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
- `POST /api/simulator/faults` with `{ "robotId": "AJR-002", "fault": "wheel-friction", "confirmed": true }`

The POST endpoint mutates the simulator only and cannot issue physical commands.

## Verification

`npm run verify` performs syntax/type-safety checks available without dependencies, seven deterministic domain tests and a reproducible production artifact build. GitHub Actions runs the same command.

## Known limits

- In-memory demo persistence only.
- Authentication/RBAC and database adapters are architecture gates for a later milestone.
- Health and anomaly rules are transparent prototype heuristics, not validated failure prediction.
- Canvas topology is a progressive visualization; the semantic fleet registry remains available without it.

See [architecture](docs/ARCHITECTURE.md), [design](docs/DESIGN.md) and [security boundaries](docs/SECURITY.md).
