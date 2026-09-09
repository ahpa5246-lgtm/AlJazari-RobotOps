# Parcel Grid — Pastel Route Orbit delivery workspace

Status: implementation delivered for review; browser visual acceptance remains open.

## Visual thesis

A bright spatial logistics studio adapted from the owner-selected Figma node `37:430`: compact navigation and editorial copy anchor the left edge while two tall, tilted operational surfaces and softly modelled cyan, pink and lilac bodies create depth on the right. The composition keeps real parcel-route content instead of empty phone mockups and uses no reference artwork, logo or author identity.

Principles:
- The route signature gives the hero a logistics-specific reading order before any metric appears.
- Black, cyan, lilac and pink define the presentation layer; operational status always retains text and never relies on those decorative colors alone.
- One original inline SVG parcel carrier establishes character; it is explicitly illustrative, never device geometry.
- Tilt and modelled gradients are limited to the hero specimen and route surface; operational rows remain stable and readable.
- Every operation has a semantic control; the visual treatment supports inspection instead of replacing it.

Anti-goals: real-company affiliation, copied trade dress, all-glass interfaces, decorative fake telemetry, scroll hijacking, continuous animation, external design assets, overlapping rendering libraries.

The white canvas deliberately leaves the pastel bodies outside any enclosing card, matching the reference's open depth. Fine-pointer movement produces a bounded counter-parallax between the two surfaces; slow decorative floats and all parallax stop under reduced motion.

## Tokens and typography

| Role | Token |
|---|---|
| Canvas / surface | #ffffff / #f7f7fb |
| Elevated surface | rgba(255,255,255,.91) |
| Primary ink / secondary ink | #0a0b12 / #5d6370 |
| Route cyan / lilac / pink | #8ae8ff / #8872f7 / #ed83ca |
| Interaction / focus | #4d5cff / #2647d8 |
| Borders | #e6e8ef |
| Critical | #ae2448 |

System sans-serif typography uses Segoe UI, Tahoma and Arial with no remote fonts. Monospace is reserved for parcel and unit identifiers. Large display type leads the hero; irregular radii and a single rotated specimen create depth without making every surface a floating card. Status always includes text; color alone is insufficient.

Token choices target WCAG AA text contrast and retain a separate visible blue focus outline. Exact contrast and browser-layout checks remain part of the visual acceptance gate; token intent is not presented as a complete accessibility audit.

## Catalog decisions

Applied the current build-distinctive-websites and Figma design-to-code workflows. The owner-supplied “35 Modern Heros with Gradients and Mockups” node `37:430` was inspected directly: its open white canvas, compact navigation, left editorial block, two opposing tilted frames and modelled pastel volumes were re-authored as a parcel-delivery command surface. The product uses no downloaded reference images, author marks, fonts, texture files, shaders or new packages.

Reference mode only; no third-party implementation or asset copied:
- [React Spectrum](https://github.com/adobe/react-spectrum): Apache-2.0; accessible native selection/dialog behavior and explicit focus. Upstream activity/license metadata inspected 2026-09-08.
- [D3](https://github.com/d3/d3): ISC; meaningful data grouping and truthful scales, applied here as native semantic site groups. Upstream metadata inspected 2026-09-08.
- [Atropos](https://github.com/nolimits4web/atropos): MIT; bounded focal-object depth, implemented as a small native SVG hover offset. Upstream metadata inspected 2026-09-08.

The wider catalog is a selection resource, not eighty dependencies. Zero packages were added. Grain, gradients, route lines and depth use local CSS and the existing original inline SVG; no remote scripts, textures, fonts or CDN requests are required.

## Useful interactions

- Select any atlas node to inspect that robot's identity.
- Choose two visible robots for a snapshot comparison of health, battery, network, motor current, temperature, state and observation time. Unsupported/nonfinite fields remain unavailable; no best-robot ranking is implied.
- Robot passports expose health-v1 component meters and the documented 30/30/20/20 supported-weight formula.
- Pause/resume and explicit Refresh support deliberate inspection. Automatic refresh holds while a dialog is open, a main control has focus, or the document is hidden. The status text discloses reading mode.
- Failed loads retain the last successful snapshot with a retry notice; failed actions never display a success claim.
- Existing alert acknowledgement, confirmed maintenance, incident replay, evidence assistant and mission timelines remain connected to the same API.
- Fault injection requires confirmation and changes simulator data only.
- Registry filters scope the atlas/registry/summary; the mission ledger explicitly states its separate full-demo-fleet scope.

## Accessibility, response and motion

Native buttons, labelled search/filter controls, semantic sections and a native modal dialog form the interaction foundation. Focus moves to dialog headings and is preserved for regenerated registry/atlas controls. The document section order matches the visual reading order. Status changes are announced without announcing every telemetry timestamp.

Layouts adapt at 1120, 760 and 430 pixels with one-column delivery zones and stacked detail regions. The hero composition mirrors for RTL while content uses logical spacing and translated copy. Minimum action size is 44 pixels; visible focus uses high-contrast blue. Reduced motion removes tilt, pointer parallax, transform feedback, transitions and smooth scrolling. No WebGL is needed. Print output suppresses decoration and restores a plain light surface.

## Evidence and remaining acceptance gate

- Reproducible install: npm ci --ignore-scripts passed.
- npm run verify: 48/48 deterministic tests, JavaScript syntax checks and build passed.
- Existing typecheck/lint scripts perform node --check, not a TypeScript compiler or full semantic linter. No formatter is configured; git diff --check passes.
- Six added tests cover identity escaping, tenant-aware grouping, bounded comparison selection, capability-aware actual values, static semantic/safety contracts and transfer budget.
- Initial frontend budget: under 150 KiB raw / 45 KiB gzip across HTML, four stylesheets and both modules. The test enforces the ceiling.
- No frame-rate, Lighthouse, screen-reader or browser-layout pass is claimed.
- Cloud browser refused the localhost preview under its URL security policy. No alternative browser, tunnel or policy workaround was attempted after denial. Desktop/mobile screenshots and interactive keyboard/RTL/reduced-motion QA remain unresolved; keep the PR draft.

Required visual review on an authorized local preview: English and Arabic at 1440, 768, 390 and 320 px; 200% zoom; Tab/Enter/Escape and focus return; no document horizontal overflow; atlas → passport → evidence/mission flows; comparison selection limits; pause/refresh and failed requests; reduced motion; long identifiers; empty filters. Fix findings on the same branch before claiming visual completion.

## Scope and rollback

This redesign changes identity and parcel-delivery context while preserving the simulated monitoring architecture. Parcel Grid is fictional and unaffiliated with any real company. Production authentication, persistent deployment storage, live hardware, physical control and real-world validation remain outside this change. SIMULATED DATA remains explicit and health/diagnostics remain documented heuristics.

Rollback by reverting this feature commit after review. No backend schema, API contract, dependency lockfile, deployment or data migration changed.
