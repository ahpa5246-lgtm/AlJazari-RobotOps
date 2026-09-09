# Parcel Grid — Pastel Route Orbit delivery workspace

Status: implementation delivered for review; browser visual acceptance remains open.

## Visual thesis

A nocturnal logistics studio where a luminous route connects pickup, sorting, transit and drop-off while layered operational surfaces float above a deep teal-to-indigo field. Oversized editorial type, restrained grain and one tilted delivery-unit specimen adapt the supplied Figma reference's compositional intelligence without copying its artwork, author identity or hero pages.

Principles:
- The route signature gives the hero a logistics-specific reading order before any metric appears.
- Deep teal, cyan, indigo and acid-lime indicate space, route, selection and caution; status always retains text.
- One original inline SVG parcel carrier establishes character; it is explicitly illustrative, never device geometry.
- Tilt and glow are limited to the hero specimen and two major surfaces; operational rows remain stable and readable.
- Every operation has a semantic control; the visual treatment supports inspection instead of replacing it.

Anti-goals: real-company affiliation, copied trade dress, all-glass interfaces, decorative fake telemetry, scroll hijacking, continuous animation, external design assets, overlapping rendering libraries.

The current visual thesis is a white spatial canvas with softly modelled cyan, pink and lilac route bodies. Two tilted operational surfaces represent a route passport and delivery unit—not generic phone mockups—and retain live product content. Motion is limited to three slow transform-only floats with a complete reduced-motion fallback.

## Tokens and typography

| Role | Token |
|---|---|
| Canvas / surface | #0e0d17 / #151725 |
| Elevated surface | #1c2031 |
| Primary ink / secondary ink | #f8f8fb / #aeb4c5 |
| Route cyan / indigo | #6de7ff / #765dff |
| Safety lime / focus | #d8ff52 |
| Borders | rgba(230,239,255,.14) |
| Critical | #ff6b72 |

System sans-serif typography uses Segoe UI, Tahoma and Arial with no remote fonts. Monospace is reserved for parcel and unit identifiers. Large display type leads the hero; irregular radii and a single rotated specimen create depth without making every surface a floating card. Status always includes text; color alone is insufficient.

Token choices target WCAG AA text contrast and retain a separate visible blue focus outline. Exact contrast and browser-layout checks remain part of the visual acceptance gate; token intent is not presented as a complete accessibility audit.

## Catalog decisions

Applied the current build-distinctive-websites and Figma design-to-code workflows. The owner-supplied “35 Modern Heros with Gradients and Mockups” file was inspected in reference mode: dark spatial canvas, oversized typography, grain, overlapping mockup depth and controlled gradients were re-authored as a parcel-delivery command surface. The product uses no downloaded reference images, author marks, texture files, shaders or new packages.

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

Layouts adapt at 1120, 760 and 370 pixels with one-column delivery zones and stacked detail regions. Logical properties support RTL, including a translated and direction-aware route signature. Minimum action size is 44 pixels; visible focus uses high-contrast lime. Reduced motion removes tilt and transform feedback, transitions and smooth scrolling. No WebGL is needed. Print output suppresses decoration and restores a plain light surface.

## Evidence and remaining acceptance gate

- Reproducible install: npm ci --ignore-scripts passed.
- npm run verify: 46/46 deterministic tests, JavaScript syntax checks and build passed.
- Existing typecheck/lint scripts perform node --check, not a TypeScript compiler or full semantic linter. No formatter is configured; git diff --check passes.
- Six added tests cover identity escaping, tenant-aware grouping, bounded comparison selection, capability-aware actual values, static semantic/safety contracts and transfer budget.
- Initial frontend budget: under 150 KiB raw / 45 KiB gzip across HTML, both stylesheets and both modules. Measured approximately 90 KB raw / 26 KB gzip. The test enforces the ceiling.
- No frame-rate, Lighthouse, screen-reader or browser-layout pass is claimed.
- Cloud browser refused the localhost preview under its URL security policy. No alternative browser, tunnel or policy workaround was attempted after denial. Desktop/mobile screenshots and interactive keyboard/RTL/reduced-motion QA remain unresolved; keep the PR draft.

Required visual review on an authorized local preview: English and Arabic at 1440, 768, 390 and 320 px; 200% zoom; Tab/Enter/Escape and focus return; no document horizontal overflow; atlas → passport → evidence/mission flows; comparison selection limits; pause/refresh and failed requests; reduced motion; long identifiers; empty filters. Fix findings on the same branch before claiming visual completion.

## Scope and rollback

This redesign changes identity and parcel-delivery context while preserving the simulated monitoring architecture. Parcel Grid is fictional and unaffiliated with any real company. Production authentication, persistent deployment storage, live hardware, physical control and real-world validation remain outside this change. SIMULATED DATA remains explicit and health/diagnostics remain documented heuristics.

Rollback by reverting this feature commit after review. No backend schema, API contract, dependency lockfile, deployment or data migration changed.
