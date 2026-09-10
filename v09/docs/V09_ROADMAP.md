# v0.9 Development Roadmap

**Baseline:** `recovered-v0.8-validated` (commit `1352dba`)  
**Current stage:** 11A (this document)

---

## Stage 11A — Development Fork + Architecture Charter *(this stage)*
Establish `v0.9-development` branch, `v09/` tree, baseline copy map, product charter, technical/accessibility debt registers, ADR-001, scientific invariants inheritance statement, roadmap, changelog. No implementation.

## Stage 11B — Technical Foundation + Accessibility Remediation *(this stage)*
- Corrected the Stage 11A lab/screen count documentation error
- Established a runnable v0.9 compatibility baseline (`v09/tools/assemble-v09-compat.js`, `v09/dist/precimind-v0.9-compat.html`)
- Full-repository interactive-control audit (found a third control — EQA — not named in the Stage 11A debt register)
- Fixed AD-001 (Rule Detective), AD-002 (LJ chart), and the newly-discovered EQA chart keyboard-activation gaps in `v09/src` only
- Established the three-layer test architecture (unit / integration / browser)
- Refined ADR-001: rejected the split-runtime approach, accepted a unified Vite/React target architecture for both inherited labs and Morning QC Room
- No Morning QC Room implementation yet

## Stage 11C — Unified v0.9 Build Migration (split into 11C1 + 11C2)

### Stage 11C1 — Vite Build Bridge + Migration Graph *(complete)*
- Established package-managed React/Vite toolchain (React 19.2.8, ReactDOM 19.2.8, Vite 8.2.2, @vitejs/plugin-react 6.1.1)
- Generated a temporary bridge (`v09/app-bridge/`) wrapping the accepted Stage 11B source (34 modules, accepted order, 19 mount calls) — no ES-module conversion, no single-root conversion, no scientific changes
- Eliminated runtime Babel from the new build path (JSX compiled at build time)
- Produced a fully source-inspected, evidence-based dependency graph (`v09/docs/v09-module-dependency-graph.json` + `V09_MODULE_DEPENDENCY_GRAPH.md`): zero cycles, zero collisions, 12 modules relying on an implicit React-hook global, 14 CommonJS-guarded modules, recommended migration order
- Established deterministic build-tree hashing with confirmed reproducibility (including clean `npm ci`)
- Browser-equivalence confirmed against the frozen Stage 11B reference: 63/63 MATCH, 0 unexpected differences, 0 blocked (final accepted total, after the Stage 11C1 audit corrective closures — the initial 53/53 figure was superseded once genuine scientific-interaction checkpoints and evidence-based console classification were added)

### Stage 11C2 — ES Modules + Single React Root + Final Architecture Equivalence *(complete)*
- Converted all 34 modules to standard ES modules under `v09/app/**`, verified surgical (34/34 strict source-transform PASS — no scientific/pedagogic content altered)
- Replaced all 14 CommonJS guard-wrapper blocks with plain `export` statements (TD-003 resolved for active runtime)
- Added explicit `react` hook imports to all 12 modules previously relying on the implicit `shared-components.jsx` global destructuring; zero bare-hook-global reliance remains
- Collapsed the 19 historical `ReactDOM.createRoot` mount calls to a single authored entry-point mount in `v09/app/main.jsx` (TD-001 resolved), validated experimentally via full browser equivalence against the frozen Stage 11C1 bridge — NOT assumed safe from prior documentation
- Preserved inherited scientific semantics exactly — reconfirmed via a dedicated scientific-parity test importing the ACTIVE modules directly (25/25 passing)
- Established browser equivalence against the Stage 11C1 bridge reference (not the older v0.8/Stage-11B standalone): 63/63 MATCH, 0 UNEXPECTED_DIFFERENCE, 0 BLOCKED, including all 8 genuine scientific interactions and pixel-identical (0 differing pixels) desktop/mobile screenshots
- A genuine gap was found in the Stage 11C1 dependency graph during actual migration (missing imports for bare-identifier data references, not caught by the original regex-based extraction) — caught via real browser execution and a dedicated raw-source cross-reference check, not by trusting the plan; fully documented in `V09_STAGE11C2_MIGRATION_REPORT.md`
- No Morning QC Room feature implementation — this stage was architecture migration only

## Stage 12A — Morning QC Room Foundation *(complete)*
- Established the domain foundation and deterministic simulation engine under `v09/app/morning-qc/**`: `types.js`, `states.js` (simulation phases, service-state/patient-impact/hypothesis-evidence transition tables, action types, severity model), `case-schema.js`, `case-validator.js` (strict, fail-closed), `engine.js` (deterministic replay), `decision-model.js`, `evidence-model.js`, `scoring-model.js` (12 independent dimensions), `debrief-model.js`
- Retrieved, normalized, and reviewed the Stage 11A A–P case-family catalogue; identified 5 coverage gaps and 3 new candidate families (Q, R, S); documented overlaps rather than silently merging families
- Authored exactly 3 fully structured pilot cases (not all 16+ families), each with machine-readable scientific rationale distinguishing known from intentionally-uncertain facts
- Validated via genuine engine execution: 41 engine unit-test assertions + 28 pilot-path assertions (expert / safe-but-inefficient / unsafe paths for each of the 3 pilots) — all passing, with 2 genuine engine bugs and 1 genuine validator design flaw caught and fixed during authoring (not merely asserted correct)
- No production UI, no navigation integration — 14 primary destinations unchanged, reconfirmed against the retained Stage 11C2 browser-equivalence evidence
- No existing scientific formula duplicated; Morning QC case rationale imports/references the active `app/core/statistics.js` and `app/bv/calc.js` functions directly

## Stage 12B — Morning QC Room Interaction Shell and Panel Architecture
*(Not yet started.)*
- Build the non-linear information-panel UI (QC chart, analyzer status, reagent lot, etc.) driven by the Stage 12A engine
- Wire the 3 pilot cases (and additional cases as authored) to a real interactive shell
- Still no production navigation integration until the interaction shell is validated

## Stage 12C — Expanded Case Library
- Author additional concrete cases from the revised A–S case-family catalogue (`V09_MORNING_QC_CASE_CATALOGUE.md`)
- Each case validated against the Stage 12A schema/engine (`case-validator.js`)

## Stage 13A — Morning QC Room UI Shell
- Build the non-linear information-panel interface (QC chart, analyzer status, reagent lot, etc.)
- Wire to case engine; no scoring/debrief yet

## Stage 13B — Evidence Workspace + Decision Workflow
- Implement evidence selection, hypothesis tracking, intervention/verification UI
- Integrate the INTEGRATE→PRIORITISE→ACT→REASSESS→DOCUMENT→RELEASE/HOLD/ESCALATE flow

## Stage 13C — Debrief + Competency Mapping
- Implement `debrief.js` and `competency-map.js` integration
- Multi-dimensional decision-quality feedback (not a single score) per the Product Charter
- Confidence-calibration feedback, kept separate from correctness

## Stage 14 — Integrated Testing / Calibration / Accessibility
- Full regression across v0.8-inherited labs + Morning QC Room
- Accessibility audit of all new Morning QC Room components
- Calibrate case difficulty (Levels 1–5) against actual learner performance if pilot data available

## Stage 15 — v0.9 Release Validation
- Full browser-equivalence-style validation for all NEW v0.9 surfaces (Morning QC Room), analogous in rigor to the v0.8 Stage 10 series
- Confirm all Quality Gates (see below) are met
- Tag `v0.9-validated` (or equivalent) only after passing

---

## Sequencing Notes

Stage 11C2 has now implemented the unified Vite/React active architecture (ES modules, single React root) that ADR-001 targeted, and passed independent audit. This roadmap's remaining stages (12A onward, Morning QC Room) build on the active `v09/app/**` application and are no longer conditional on an architecture decision — that decision has been made and executed. Stage 12A (foundation/engine) is now complete. Stage 12B onward remain gated on independent audit acceptance of the preceding stage before proceeding, not self-authorized.

---

## Stage 12B (current) — Morning QC Room Interaction Shell + Panel Architecture

Completed: the learner-facing interaction shell (`v09/app/morning-qc/ui/**`)
consuming the Stage 12A engine — panel dock/viewer, action dock, decision
dialog, hypothesis workspace, evidence tray, patient-impact panel,
confidence control (decisionEventId-bound), documentation drawer (event/
documentation separation), and a Stage-12B-only developer pilot-case
launcher. Full details in `V09_STAGE12B_REPORT.md`,
`V09_MORNING_QC_UI_ARCHITECTURE.md`, and `V09_STAGE12B_INTERACTION_MODEL.md`.

*(Note: the "Stage 13A/13B/13C" entries above predate the renumbering that
occurred once Stage 12A/12B were actually executed under those names; they
describe materially the same scope as what is now Stage 12B [completed]
and the still-unimplemented Stage 12C below. Left as historical record
rather than rewritten, per this update's narrow-scope instruction.)*

### Suggested next stage

**Stage 12C — Learner-facing debrief + competency feedback + production
integration.** Stage 12B deliberately built only a minimal
developer-facing debrief preview; the polished, learner-facing debrief
(multi-dimensional, non-single-score, confidence-calibration-aware, per
the Product Charter) and production-navigation integration remain
Stage 12C's scope. Not implemented in Stage 12B.

---

## Stage 12C (current) — Debrief, Competency Feedback, Calibration + Controlled Production Integration

Completed: learner-facing debrief (`v09/app/morning-qc/debrief/**`)
consuming Stage 12A's scoring/debrief models directly — case resolution,
12-dimension competency profile, four-quadrant decision review,
decisionEventId-preserving confidence calibration, documentation-vs-
executed comparison, patient-safety review, targeted learning
priorities/lab recommendations — plus controlled production integration
(Home capstone card, Competency Map `CAPSTONE` entry, a new deterministic
`dist-vite-production/` build) preserving the 14-primary-destination
doctrine and the frozen Stage 11C2 `dist-vite/` tree hash exactly. Full
details in `V09_STAGE12C_REPORT.md`, `V09_STAGE12C_DEBRIEF_ARCHITECTURE.md`,
`V09_STAGE12C_COMPETENCY_MODEL.md`, and `V09_STAGE12C_PRODUCTION_INTEGRATION.md`.

### Suggested next stage

**Stage 12D — Morning QC case expansion + adaptive sequencing +
instructor analytics foundation.** Not implemented in Stage 12C.

---

## Stage 12D (current) — Morning QC Case Expansion + Adaptive Sequencing + Instructor Analytics Foundation

Completed: expanded the production case bank from 3 to 12 cases across
11 distinct reasoning families, each with a genuine expert path plus 2
adversarial paths verified through the real engine; a deterministic,
transparent, explainable adaptive-sequencing engine
(`v09/app/morning-qc/adaptive/**`) recommending a next case from local
attempt history only (never hidden ground truth); and an instructor
analytics foundation (`v09/app/morning-qc/analytics/**`) with a
versioned event schema and a development-only summary view (never a
production navigation destination). Full details in
`V09_STAGE12D_REPORT.md`, `V09_STAGE12D_CASE_SCIENTIFIC_REVIEW.md`,
`V09_STAGE12D_ADAPTIVE_SEQUENCING.md`, and `V09_STAGE12D_ANALYTICS_SCHEMA.md`.

### Suggested next stage

**Stage 12E — Instructor workflow + educational research instrumentation
+ release candidate hardening.** Not implemented in Stage 12D.
