# Prototype security and safety boundary

- Contains only deterministic fictional data labelled `SIMULATED DATA`.
- Stores no credentials, personal data or proprietary robot information.
- Exposes no physical robot command path; simulator metadata reports `supportsControl: false`.
- Simulator fault injection requires an explicit confirmation field and changes only in-memory fictional telemetry.
- Tenant checks currently demonstrate the domain boundary but do not replace production authentication and RBAC.
- Maintenance suggestions require an acknowledged alert; ticket creation requires a second explicit human confirmation and is idempotent. Neither can perform physical actions.
- Public deployment, production database migration, secrets and real robot integration require separate owner and security approval.
