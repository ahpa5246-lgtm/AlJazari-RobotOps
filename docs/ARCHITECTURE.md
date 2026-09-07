# Architecture baseline

## Runtime boundary

`assertRobotAdapter` is the executable Universal Robot Interface boundary. It requires adapter metadata, identity enumeration, optional capability discovery, timestamped telemetry history and ticking while deliberately permitting unsupported signals to remain absent. `SimulatorAdapter` is the first conforming adapter. `FleetService` is the vendor-neutral application layer; HTTP endpoints and the interface depend on this service rather than simulator internals.

Future REST, MQTT, WebSocket and ROS 2 adapters must implement the same boundary without changing fleet-domain consumers. Physical control is deliberately absent; `supportsControl` is always false in this prototype.

## Tenant model

The current in-memory model is `organization → client → site → robot`. Every query accepts a tenant scope, and tests prove that a client cannot retrieve a robot owned by another client. A later persistence adapter must enforce the same constraint in repository queries and authorization—not merely in the UI.

## Telemetry and analytics

Samples contain ISO timestamps and are stored behind an adapter history method so a time-series store can replace memory later. Fleet totals, health, operational states and alerts are computed from samples. No UI metric is hardcoded.

Health `health-v1` is the supported-component weighted mean: battery 30%, motors 30%, sensors 20%, connectivity 20%. Missing capabilities are removed and remaining weights renormalized. This heuristic is explainable but not clinically, commercially or statistically validated.

Anomaly rules currently expose measured value, explicit threshold, baseline mean and z-score. They produce human inspection recommendations only. No claim of predictive accuracy is made.


## Alert lifecycle

`AlertEngine` fingerprints anomaly evidence by robot and rule. A first observation opens one alert; later observations update its evidence and occurrence count instead of creating new records. The five-minute prototype cooldown counts repeated observations as suppressed and permits a new notification only after the cooldown. Acknowledgement requires an explicit human actor and confirmation, remains tenant-scoped, and never closes the underlying diagnostic evidence or triggers maintenance/physical control. Persistence, authentication, escalation and resolution policy remain later gates.


## Maintenance suggestion lifecycle

`MaintenanceWorkflow` accepts only alerts already acknowledged by a named human. `maintenance-window-v1` maps severity to an explicit inspection window: critical 24 hours, high 120 hours, warning 336 hours and info 720 hours. The output deliberately contains no probability or confidence score. Creating a ticket is a second separately confirmed human action, is idempotent per source alert, preserves the exact anomaly evidence and remains tenant-scoped. Tickets are simulated in-memory work records and cannot issue repair or robot commands.
