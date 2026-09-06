# v0.9 Development Roadmap

**Baseline:** `recovered-v0.8-validated` (commit `1352dba`)  
**Current stage:** 11A (this document)

---

## Stage 11A — Development Fork + Architecture Charter *(this stage)*
Establish `v0.9-development` branch, `v09/` tree, baseline copy map, product charter, technical/accessibility debt registers, ADR-001, scientific invariants inheritance statement, roadmap, changelog. No implementation.

## Stage 11B — Technical Foundation + Accessibility Remediation
- Formal decision on ADR-001 (build system) for new v0.9 modules
- Fix AD-001 (Rule Detective keyboard activation) and AD-002 (LJ chart, if applicable) in `v09/src` only
- Establish the three-layer test architecture proposed in TD-005
- No Morning QC Room implementation yet

## Stage 12A — Morning QC Room Specification + Case Schema
- Formalize the case-state machine outlined in the Product Charter (BRIEFING → ... → DEBRIEF)
- Define `case-schema.js` data shape
- Define competency-tagging taxonomy referenced by the Case Family Catalogue
- No case content authored yet

## Stage 12B — Morning QC Room Deterministic Case Engine
- Implement `case-engine.js` and `decision-engine.js` per the schema from 12A
- Engine must be pure/testable independent of UI
- Unit tests for state transitions

## Stage 12C — Case Library v1
- Author concrete cases for a representative subset of the Case Family Catalogue (Families A–P)
- Each case validated against the schema and engine from 12A/12B

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

This sequence may be revised as Stage 11B architecture analysis proceeds — in particular, the build-system decision (ADR-001) may reveal that some accessibility fixes (Stage 11B) are easier or harder depending on which architecture is chosen for new components. Stage 11B should confirm or adjust this roadmap before Stage 12A begins.
