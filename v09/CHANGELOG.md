# v0.9 Changelog

## v0.9 — In Development

**Baseline:** `recovered-v0.8-validated` (commit `1352dba`)

### Planned Themes

- Morning QC Room capstone (integrates QC-01 through QC-12 competencies)
- Integrated competency-based application layer
- Accessibility improvements (see `docs/V09_ACCESSIBILITY_DEBT.md`)
- Runtime/build modernization if ADR-001 is approved (see `docs/ADR-001-V09-APPLICATION-ARCHITECTURE.md`)
- Maintain scientific compatibility with the validated v0.8 baseline (see `docs/V09_SCIENTIFIC_INVARIANTS.md`)

### Stage 11A — Development Fork + Architecture Charter

- Created `v0.9-development` branch from `recovered-v0.8-validated`
- Created `v09/` development tree (`src/`, `tests/`, `tools/`, `docs/`, `dist/`)
- Copied validated v0.8 application source into `v09/src/` as the development starting point (36 files, all `UNCHANGED_FROM_V08` at copy time)
- Established baseline copy manifest (`docs/V08_TO_V09_BASELINE_MAP.md`, `docs/v08-to-v09-baseline-map.json`)
- Established product charter (`docs/V09_PRODUCT_CHARTER.md`)
- Established technical debt register (`docs/V09_TECHNICAL_DEBT.md`)
- Established accessibility debt register (`docs/V09_ACCESSIBILITY_DEBT.md`)
- Established architecture decision record (`docs/ADR-001-V09-APPLICATION-ARCHITECTURE.md`) — recommends Vite for new Morning QC Room modules, no build tooling installed yet
- Established scientific invariants inheritance statement (`docs/V09_SCIENTIFIC_INVARIANTS.md`)
- Established case family catalogue design (`docs/V09_CASE_FAMILY_CATALOGUE.md`) — 16 case families (A–P), no case data authored
- Established roadmap (`docs/V09_ROADMAP.md`)
- No features implemented. No scientific changes. No accessibility fixes yet.

**This changelog does not claim any feature is complete.** Stage 11A is architecture and governance only.
