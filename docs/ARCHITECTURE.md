# Architecture baseline

## Runtime boundary

`SimulatorAdapter` implements the first Universal Robot Interface: adapter metadata, robot identity, optional capability discovery, timestamped telemetry history and controlled simulator-only fault injection. `FleetService` is the vendor-neutral application layer. HTTP endpoints and the interface depend on this service rather than simulator internals.

Future REST, MQTT, WebSocket and ROS 2 adapters must implement the same boundary without changing fleet-domain consumers. Physical control is deliberately absent; `supportsControl` is always false in this prototype.

## Tenant model

The current in-memory model is `organization → client → site → robot`. Every query accepts a tenant scope, and tests prove that a client cannot retrieve a robot owned by another client. A later persistence adapter must enforce the same constraint in repository queries and authorization—not merely in the UI.

## Telemetry and analytics

Samples contain ISO timestamps and are stored behind an adapter history method so a time-series store can replace memory later. Fleet totals, health, operational states and alerts are computed from samples. No UI metric is hardcoded.

Health `health-v1` is the supported-component weighted mean: battery 30%, motors 30%, sensors 20%, connectivity 20%. Missing capabilities are removed and remaining weights renormalized. This heuristic is explainable but not clinically, commercially or statistically validated.

Anomaly rules currently expose measured value, explicit threshold, baseline mean and z-score. They produce human inspection recommendations only. No claim of predictive accuracy is made.
