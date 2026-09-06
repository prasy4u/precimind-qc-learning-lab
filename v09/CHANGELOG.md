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

### Stage 11B — Compatibility Foundation + Accessibility Remediation + Test Architecture

**Documentation correction:**
- Corrected the Stage 11A error stating v0.8 has "13 independent labs" — the validated app shell has 14 primary nav destinations: 11 progress-tracked labs + Home/Competency Map/Evidence. QC-01–12 is a separate competency count from the screen count. Fixed in `V09_PRODUCT_CHARTER.md` and `ADR-001-V09-APPLICATION-ARCHITECTURE.md`.

**Deterministic v0.9 compatibility baseline:**
- Created `v09/tools/v09-source-order.json` (source-order manifest, 34 application modules + CSS + bootstrap)
- Created `v09/tools/assemble-v09-compat.js` (consumes `v09/src`, reuses the validated v0.8 document/vendor envelope, deterministic, reports SHA/module count/mount count)
- Pre-fix compatibility artifact SHA matched the v0.8 faithful candidate exactly (`a9fe9a3a...`) — confirmed via a 21-checkpoint Playwright smoke differential (`V09_COMPAT_BASELINE_MATCH`: 21/21 MATCH, 0 DIFFERENCE)

**Accessibility audit and remediation:**
- Full-repository search of `v09/src/**` found exactly 3 synthetic `role="button"` SVG controls: Rule Detective (`.mlj-point-g`), LJ chart (`.ljchart-point-g`), and EQA longitudinal chart (`.ljchart-point-g` in `eqa/ui-components.jsx`) — the third was not named in the Stage 11A debt register and was discovered by this audit. Documented in `V09_INTERACTIVE_CONTROL_AUDIT.md`.
- Fixed all three in `v09/src` only (root `src/` unchanged): each now uses a single shared activation function so click/Enter/Space all invoke identical semantics, with `preventDefault()` on Space. Click behavior verified unchanged; Enter/Space verified newly functional (documented `INTENDED_DELTA` vs. the validated v0.8 known limitation).
- `V09_ACCESSIBILITY_DEBT.md` updated: AD-001, AD-002 status → `FIXED_STAGE_11B`; new AD-003 (EQA) added and marked `FIXED_STAGE_11B`.

**Test architecture:**
- `V09_TEST_ARCHITECTURE.md` — formalizes Unit / Integration / Browser-E2E layers, explicit provenance separation from the frozen v0.8 historical suite
- `v09/tests/unit/v09-scientific-compat.test.js` — 28 assertions (sample SD, signed bias, negative-Sigma preservation, R_4s within-run, 8x vs 10x, single 1₃s operating characteristic, detection-delay model, EQA safeguards, RCV, PBRTQC frozen signatures)
- `v09/tests/integration/v09-accessibility-source.test.js` — 30 assertions (shared activation functions, Enter/Space handling, preventDefault, preserved aria-labels/classes/ring logic)
- `v09/tests/browser/v09-accessibility.e2e.js` (maintained, not disposable) — 30 checkpoints: 26 MATCH, 4 INTENDED_DELTA, 0 UNEXPECTED_DIFFERENCE, 0 BLOCKED

**Baseline provenance map updated:**
- `v09/src/rules/ui-components.jsx`, `v09/src/ui/shared-components.jsx`, `v09/src/eqa/ui-components.jsx` marked `V09_MODIFIED` with rationale; all other 33 copied files remain `UNCHANGED_FROM_V08`

**ADR-001 refined:**
- Rejected the Stage 11A "split-runtime" recommendation (Vite for new work only, standalone for existing labs)
- **Status: ACCEPTED — target unified Vite/React build hosting both inherited labs and Morning QC Room**, migration deferred to new **Stage 11C** (added to roadmap)

**Not done in Stage 11B (explicitly deferred):**
- Vite is NOT installed; no build tooling added
- Morning QC Room schema/engine/case/UI — not started
- TD-001 (19-mount cleanup) — not addressed

### Stage 11B Corrective Closure

Independent audit identified two validation/integrity defects in the initial Stage 11B work, corrected here without reopening the architectural decision (ADR-001 remains ACCEPTED — target unified Vite/React build, migration deferred to Stage 11C):

**1. Assembler changed from drift-warning to fail-closed SHA enforcement.**
- `v09/tools/v09-source-order.json` revised to a two-SHA model: every runtime source entry now records both `v08_baseline_sha256` (immutable) and `expected_current_v09_sha256` (the admitted current state).
- `v09/tools/assemble-v09-compat.js` rewritten: any file whose on-disk SHA does not match its `expected_current_v09_sha256` causes the assembler to print `ASSEMBLY FAIL: Unexpected SHA drift` (with path, expected SHA, actual SHA) and **exit non-zero before writing output** — replacing the previous permissive `[MODIFIED since manifest]` log-and-continue behavior.
- New `v09/tests/unit/v09-assembler-drift-fail.test.js`: proves fail-closed behavior using an isolated temporary workspace (never touches real `v09/src`) — confirms (A) clean source assembles successfully, (B) a simulated one-character drift causes non-zero exit with the correct diagnostic, (C) the previously-accepted candidate file is not corrupted or overwritten by the failed attempt.

**2. EQA and LJ Space/Enter browser behavior genuinely measured (was previously declared, not measured).**
- The maintained `v09/tests/browser/v09-accessibility.e2e.js` now uses a deterministic DOM state indicator (the toggled point's SVG circle `r` attribute, which flips between 7=active and 5=inactive on every successful toggle) to distinguish focus-only from actual activation — tooltip visibility alone is no longer treated as proof.
- LJ chart: click/Enter/Space are now each independently measured from a fresh, common focused starting state. Click: MATCH. Enter: `INTENDED_DELTA` (v0.8 leaves state unchanged; v0.9 toggles, matching v0.9's own click result). Space: `INTENDED_DELTA` (same pattern).
- EQA chart: the previous invalid checkpoint recording `original="n/a", candidate="n/a"` has been removed entirely. EQA click/Enter/Space are now measured identically to LJ, using the default longitudinal round data. Click: MATCH. Enter: `INTENDED_DELTA`. Space: `INTENDED_DELTA`.
- Result: 32 checkpoints (was 30) — 26 MATCH, 6 INTENDED_DELTA (Rule Enter/Space + LJ Enter/Space + EQA Enter/Space), 0 UNEXPECTED_DIFFERENCE, 0 BLOCKED.
- New `v09/tests/browser/v09-prefix-compat-baseline.json`: retained summary record of the already-executed pre-fix compatibility run (21/21 MATCH, `V09_COMPAT_BASELINE_MATCH`), explicitly labeled as a summary record rather than a freshly rerun trace.

**Test totals updated:** Stage 11B governance test grew from 39 to 67 assertions (added two-SHA manifest checks, fail-closed assembler checks, browser-evidence-quality checks, pre-fix record checks). New unit test `v09-assembler-drift-fail.test.js` adds 16 assertions.

**No architecture change.** ADR-001 status unchanged. No Vite/build tooling installed. No Morning QC Room work performed.
