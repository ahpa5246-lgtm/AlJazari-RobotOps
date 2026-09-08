# AlJazari — porcelain and violet operations studio

Status: implementation delivered for review; browser visual acceptance remains open.

## Visual thesis

A white robotics studio with a sculptural violet specimen, a site atlas and a clear evidence desk. The owner explicitly replaced the previous dark mineral-green direction with white and shades of purple on 2026-09-08. The supplied moodboards inform depth, shape rhythm and hierarchy, not copied layout or artwork.

Principles:
- A quiet white canvas makes robot identity and measured evidence the focal points.
- One original inline SVG specimen establishes character; it is explicitly illustrative, never device geometry.
- The atlas groups real simulator identities by organization, client and site. It is not a spatial digital twin.
- A broad registry, compact evidence desk and full-width mission ledger have different information densities.
- Every operation has a semantic control; the visual treatment supports inspection instead of replacing it.

Anti-goals: copied brand trade dress, green console styling, neon glow, fake graphs or rankings, decorative telemetry, scroll hijacking, continuous ambient animation, overlapping rendering libraries.

## Tokens and typography

| Role | Token |
|---|---|
| Canvas / surface | #faf9fd / #ffffff |
| Lilac surface | #f0eaf8 |
| Primary ink / secondary ink | #291b3d / #6b6079 |
| Brand violet / focus | #69419b / #54239b |
| Borders | #ded5e9 |
| Warning / critical | #885214 / #a82c53 |

System sans-serif typography uses Segoe UI, Tahoma and Arial with no remote fonts. Monospace is reserved for technical identifiers. Shapes combine an asymmetric specimen frame, raised site islands and quieter data regions. Status always includes text; color alone is insufficient.

Calculated text contrast: primary ink on canvas 15.19:1; secondary ink on lilac 4.99:1; violet on white 7.42:1; warning on white 6.43:1; critical on white 6.67:1. These token calculations are not a complete browser accessibility audit.

## Catalog decisions

Applied the current build-distinctive-websites skill and its 2026-09-07 curated catalog, design-direction, interaction-patterns and selection recipes. The existing daily radar includes Paper Shaders; this product does not need a shader or another renderer.

Reference mode only; no third-party implementation or asset copied:
- [React Spectrum](https://github.com/adobe/react-spectrum): Apache-2.0; accessible native selection/dialog behavior and explicit focus. Upstream activity/license metadata inspected 2026-09-08.
- [D3](https://github.com/d3/d3): ISC; meaningful data grouping and truthful scales, applied here as native semantic site groups. Upstream metadata inspected 2026-09-08.
- [Atropos](https://github.com/nolimits4web/atropos): MIT; bounded focal-object depth, implemented as a small native SVG hover offset. Upstream metadata inspected 2026-09-08.

The wider catalog is a selection resource, not eighty dependencies. Zero packages were added. No remote scripts, textures, fonts or CDN requests are required.

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

Layouts adapt at 1120, 760 and 370 pixels with one-column site groups and stacked detail regions. Logical properties support RTL. Minimum action size is 44 pixels; visible focus uses a high-contrast violet outline. Reduced motion removes transform feedback, transitions and smooth scrolling. No WebGL is needed. Print output suppresses decoration and controls.

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

This redesign improves the simulated operations experience. Production authentication, persistent deployment storage, live hardware, physical control and real-world validation remain outside this change. SIMULATED DATA remains explicit and health/diagnostics remain documented heuristics.

Rollback by reverting this feature commit after review. No backend schema, API contract, dependency lockfile, deployment or data migration changed.
