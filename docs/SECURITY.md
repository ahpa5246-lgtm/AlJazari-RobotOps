# Prototype security and safety boundary

- Contains only deterministic fictional data labelled `SIMULATED DATA`.
- Stores no credentials, personal data or proprietary robot information.
- Exposes no physical robot command path; simulator metadata reports `supportsControl: false`.
- Simulator fault injection requires an explicit confirmation field and changes only in-memory fictional telemetry.
- Tenant checks currently demonstrate the domain boundary but do not replace production authentication and RBAC.
- Maintenance suggestions require an acknowledged alert; ticket creation requires a second explicit human confirmation and is idempotent. Neither can perform physical actions.
- Incident replay reads only tenant-scoped simulator history. It issues no commands, invents no missing position, and exposes no root-cause or validated-prediction claim.
- Diagnostic output is deterministic decision support. It does not call an LLM, interpret free text, claim confidence or causality, or expose a command route.
- Mission timelines are tenant-scoped, read-only reconstructions from simulator telemetry. They cannot start, cancel, reroute or otherwise control a robot, and missing lifecycle evidence is never synthesized.
- Fleet mission analytics use the same tenant-filtered histories, expose formula denominators/exclusions and return no confidence or prediction. The endpoint is read-only and has no physical-control path.
- Telemetry history scope is checked inside repository queries as well as the service boundary; invalid ranges and over-limit requests fail closed.
- Telemetry ingestion accepts only a preconfigured simulated monitoring source, verifies source/adapter/transport and tenant identity, rejects replayed sequence numbers, and refuses command/control fields. Provenance is attached by the gateway rather than trusted from the payload.
- The REST monitoring example accepts only an injected offline, credential-free, read-only fixture transport. It rejects tenant spoofing, undeclared capability signals and nested command/control/actuator fields before storage; it cannot contact a vendor or issue a physical command.
- The in-memory telemetry repository is explicitly non-durable and makes no encryption, backup or production-retention claim.
- Public deployment, production database migration, secrets and real robot integration require separate owner and security approval.
