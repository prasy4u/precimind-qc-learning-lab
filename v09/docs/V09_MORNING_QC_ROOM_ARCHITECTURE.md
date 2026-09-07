# Morning QC Room — Stage 12A Architecture

**Status:** Foundation only — no production UI, no navigation integration (Stage 12A Sections 30, 33). This document describes the domain model and simulation engine established in Stage 12A.

---

## 1. Module Location

All Morning QC Room foundation code lives under `v09/app/morning-qc/`:

```
v09/app/morning-qc/
  types.js              — JSDoc type documentation (no runtime code)
  states.js              — all enumerated state spaces + legal transition tables
  case-schema.js         — formal case-contract field-list definitions
  case-validator.js      — strict, fail-closed case validator
  engine.js               — deterministic simulation engine
  decision-model.js       — decision categorization (Section 17: separate axes)
  evidence-model.js       — evidence/panel usage summarization
  scoring-model.js        — multi-dimensional scoring profile (Section 19)
  debrief-model.js        — structured post-case debrief generator (Section 24)
  data/
    pilot-scientific-rationale.js — Section 27 rationale for the 3 pilot cases
  cases/
    pilot-1-reagent-lot-shift.js
    pilot-2-pbrtqc-population-shift.js
    pilot-3-rcv-patient-impact.js
    index.js
```

No Morning QC Room screen is attached to production navigation. The 14 primary navigation destinations are unchanged (verified by the Stage 12A governance test, re-running the retained Stage 11C2 browser-equivalence evidence).

---

## 2. Simulation Phases (Non-Linear)

`states.js` defines 14 `SIMULATION_PHASES` (Section 5): `BRIEFING → SCAN → SIGNAL_RECOGNITION → IMMEDIATE_CONTAINMENT → CHARACTERISATION → HYPOTHESIS_GENERATION → EVIDENCE_SELECTION → INVESTIGATION → INTERVENTION → VERIFICATION → PATIENT_IMPACT_REVIEW → RESUME_OR_HOLD → DOCUMENTATION → DEBRIEF`.

These are **reasoning-progress markers derived from the action history**, not a UI wizard the learner steps through directly — `engine.js`'s `derivePhaseFromAction()` advances the current phase based on which action types the learner has taken, and `PHASE_ALLOWS_RETURN_TO` documents which earlier phases remain legitimately revisitable (e.g., a failed `VERIFICATION` can return to `INVESTIGATION`).

Panel inspection is explicitly **not gated by phase** — the engine tests directly verify (`NONLINEAR-01`/`NONLINEAR-02`) that a learner can inspect a "later-phase" panel before formally reaching that phase, modeling genuine non-linear investigation (Section 6).

---

## 3. Service State, Patient-Impact State, Hypothesis State

Three independent state machines, each with an explicit, tested legal-transition table (`states.js`):

- **`SERVICE_STATES`** (7 states, Section 21): `RUNNING, UNDER_REVIEW, HELD, LIMITED_RELEASE, READY_FOR_VERIFICATION, RESUMED, ESCALATED`. Notably, `RESUMED` is only reachable via `READY_FOR_VERIFICATION` — a learner cannot "resume" a service that was never held, which the engine enforces structurally (not merely via a severity flag).
- **`PATIENT_IMPACT_STATES`** (6 states, Section 22): `NOT_INDICATED → INDICATED → PENDING → {COMPLETED_NO_AFFECTED_RESULTS | AFFECTED_RESULT_SET_IDENTIFIED} → ESCALATION_REQUIRED`. Patient impact is never automatically inferred from a QC signal — it requires an explicit `REVIEW_PATIENT_IMPACT` action sequence.
- **`HYPOTHESIS_EVIDENCE_STATES`** (6 states, Section 15): `NOT_CONSIDERED → PLAUSIBLE → {SUPPORTED | WEAKENED | CONTRADICTED} → ESTABLISHED`. A hypothesis reaching `ESTABLISHED` requires the engine to have processed at least one `decisive: true` evidence item supporting it — "most-supported" alone is not sufficient (this is directly tested: `HYP-04`).

---

## 4. Structural Legality vs. Severity Flagging

A key architectural decision made during Stage 12A: the engine distinguishes two independent concerns that Section 20/21 could otherwise conflate:

1. **Structural legality** — enforced unconditionally via the transition tables. An illegal transition (e.g., `HELD → RESUMED` directly, skipping `READY_FOR_VERIFICATION`) is rejected outright with an error; the state does not change.
2. **Severity flagging** — for actions that ARE structurally legal but reflect unsafe or inefficient reasoning (e.g., resuming service after a `VERIFY_RECOVERY` attempt that did NOT meet the case's required-evidence criteria). These are recorded with a `SEVERITY_LEVELS` value (`INFORMATIONAL, INEFFICIENT, UNSUPPORTED, UNSAFE, CRITICAL_UNSAFE`) on the action-history entry, for scoring/debrief consumption — the action still proceeds, because forcibly blocking every unsafe-but-legal choice would prevent the simulation from ever teaching the CONSEQUENCE of that choice.

This distinction was validated directly: the pilot-path "unsafe" tests (`P1-UNSAFE-*`) confirm a premature-resume path is structurally legal (the engine lets it happen) while being flagged `CRITICAL_UNSAFE` and producing a debrief that meaningfully differs from the expert path's debrief (`P1-DEBRIEF-DIFF`).

---

## 5. Determinism

`engine.js` contains zero calls to `Math.random()` or any other nondeterministic source. `replay(caseObj, actions)` given the same case and action list always produces byte-identical final state — verified directly (`DETERM-01`) via JSON-stringified deep equality across two independent replay calls.

---

## 6. Case Validation (Fail-Closed)

`case-validator.js` returns `{ valid, errors }` rather than a bare boolean, and accumulates every violation found rather than stopping at the first. During Stage 12A case authoring, the validator caught **two genuine design errors** before they reached the engine test suite:

1. An overly strict ground-truth rule that incorrectly assumed `rootCauseEstablished` could never be `true` when `disturbanceEstablished` was `false` — this would have made case families K and M (where the established explanation for a signal is precisely that no disturbance exists) impossible to express. Corrected to instead check for literal identity between `observedSignal` and `rootCauseDescription` (Section 25's actual requirement: "a case automatically equates signal with root cause").
2. (See `V09_STAGE12A_REPORT.md` for the full defect log, including two further genuine engine bugs the test suite itself caught: a missing `PLAUSIBLE → ESTABLISHED` hypothesis transition, and an unrealistic test scenario that called `VERIFY_RECOVERY` from a pristine `RUNNING` state.)

---

## 7. Scoring and Debrief

`scoring-model.js` computes a profile across all 12 `SCORING_DIMENSIONS` (Section 19) — every dimension reported independently, several deliberately `null` where Stage 12A's pilot cases do not yet exercise that dimension (e.g., `STATISTICAL_INTERPRETATION`, `RULE_INTERPRETATION` are reserved for future cases that directly exercise rule-engine/statistical evidence). No dimension is ever collapsed into a single score.

`debrief-model.js` consults `groundTruth` **only after the case is complete** — ground truth is never exposed to `engine.js` during play, keeping the "learner must not receive ground truth during the case" requirement (Section 9) structurally enforced by module boundaries, not just convention.

---

## 8. Reuse of Existing Scientific Modules

Per Section 31, Morning QC Room imports rather than duplicates. Pilot case scientific rationale references exact function calls against the active modules: `app/core/statistics.js` (Pilot 1: mean/SD/bias/Sigma), `app/bv/calc.js:calculateClassicalRcv` (Pilot 3: RCV). No formula is reimplemented inside `v09/app/morning-qc/**`.

---

## 9. Stage 12A Independent-Audit Corrective Closure

An independent audit found the initial Stage 12A foundation had several domain-model and scientific gaps that made the engine's stated behaviors partly aspirational rather than enforced. All were corrected:

- **Panel/evidence availability is now genuinely ENFORCED**, not merely declared. `engine.js` tracks a `maxPhaseIndexReached` high-water mark (so a legitimate phase regression never revokes previously-earned access) and checks `panel.availableFromPhase` before permitting `INSPECT_PANEL`, and `evidence.availableOnlyAfterActionType` before permitting `REQUEST_EVIDENCE`. Both are directly tested with negative cases (premature access correctly fails and does not silently update state).
- **Case-defined `decisionOpportunities` are now EXECUTABLE.** An action may carry `{ decisionId, optionId }`; the engine looks up the case-authored option and uses its own `severity` **and** `outcomeAppropriate` fields as authoritative, replacing the earlier heuristic-only severity guess. This override is universal across all action types (a gap where `FORM_HYPOTHESIS` didn't respect it was caught and fixed during this closure).
- **The two-axis decision model is now genuinely independent.** `outcomeAppropriate` is sourced directly from the case-authored option (or a narrow action-type default), never derived from severity as "anything except `CRITICAL_UNSAFE`" — the prior model's actual flaw.
- **`rootCauseEstablished` now means exclusively an analytical root cause.** A new, separate ground-truth construct — `signalExplanationEstablished` / `signalExplanationDescription` — models a non-disturbance explanation for an observed signal (population shift, statistically significant serial change), restoring the frozen doctrine that signal ≠ disturbance ≠ root cause without redefining what "root cause" means.
- **Pilot 3's RCV science was corrected.** The case no longer treats RCV exceedance as establishing "a genuine biological/clinical change" — RCV exceedance ≠ disease, and does not establish etiological cause. The corrected case models only the defensible statistical inference, adds a specimen-handling/preanalytical evidence item, and leaves a preanalytical hypothesis appropriately `WEAKENED` (never `CONTRADICTED`) rather than falsely eliminating every alternative through IQC/EQA alone.
- **Patient-impact terminal states are now evidence-backed.** A new `patientImpactCriteria.requiredEvidenceIdsForTerminalState` field gates `COMPLETED_NO_AFFECTED_RESULTS`/`AFFECTED_RESULT_SET_IDENTIFIED` behind genuinely obtained evidence — a learner can no longer declare an affected-result set merely by selecting the next enum value.
- **Verification/service-state semantics corrected.** A FAILED verification (`VERIFY_RECOVERY` with unmet criteria) no longer advances `serviceState` to `READY_FOR_VERIFICATION` — it correctly remains `HELD`, and the engine deterministically regresses `phase` to `INVESTIGATION`, implementing the previously-declared-but-unused `PHASE_ALLOWS_RETURN_TO` return path.
- **Confidence is now scored against the specific decision it names**, via `decisionId`, not "the last decision in the case" — a confidence record naming a decision that never actually occurred in the trace is excluded from calibration rather than silently mismatched.
- **`DECISION_APPROPRIATENESS` now reads the outcome-correctness axis**, not reasoning-support (which other dimensions already measured) — the two were previously, unintentionally, measuring the same thing.
- **Pilot 1's Sigma provenance is now explicit** (`labContext.sigmaContext`): the reported Sigma (0.97) uses a pre-specified analytical CVA of 2%, not the post-shift sample SD of the disturbed cluster — both are documented and distinguished.

Full defect-by-defect detail in `V09_STAGE12A_REPORT.md`.

---

## 10. Stage 12A Independent-Audit FINAL Engine-Semantics Closure

A second independent re-audit found the domain model was scientifically sound but the engine still had exploitable gaps between declared and enforced behavior. Nine engine-semantics defects were corrected:

- **Source-panel evidence gating**: evidence with a `sourcePanelId` now requires that panel to be genuinely inspected (not merely phase-available) before the evidence can be obtained — closing an exploit where panel-derived evidence (e.g. `ev-lot-timing`, sourced from `panel-reagent-lot`) could be requested from a pristine state without ever opening the panel.
- **Phase high-water-mark gaming closed**: every phase-advancing action except `ACKNOWLEDGE_SIGNAL` now requires `documentation.signal != null` as a precondition, rejected outright (no state mutation) if unmet. This closes the exploit where `DOCUMENT` or `REVIEW_PATIENT_IMPACT` could fire from a pristine `BRIEFING` state and unlock later-phase panels purely by their nominal phase target. A third instance of the same exploit class (`FORM_HYPOTHESIS`) was found and closed during this work, beyond the two the audit specifically named.
- **Executable decision contracts**: every decision option now declares an `actionType`; the engine rejects execution when the submitted action's type doesn't match, and separately enforces the owning decision's `availableFromPhase` (checked against `maxPhaseIndexReached` *before* the action's own phase-advance, avoiding a chicken-and-egg self-unlock). The executed decision's `category` is recorded on the action-history entry and consumed directly by `decision-model.js`, rather than re-derived from action type alone.
- **Genuine four-combination outcome/reasoning testing**: a small synthetic fixture case (`cases/synthetic-fixture.js`, `provenanceClass: V09_TEST`, never referenced by the pilot index) exercises all four `outcomeAppropriate × reasoningSupported` combinations without distorting the three teaching pilots' science.
- **Confidence calibration corrected**: `computeCalibration()` now scores against `outcomeAppropriate` (the conclusion-correctness axis), not `reasoningSupported` — these are intentionally independent, and the prior model silently conflated them. `RECORD_CONFIDENCE` now rejects a `decisionId` that was never actually executed in the trace, and duplicate confidence for the same decision follows an explicit, deterministic policy (latest replaces earlier).
- **`EVIDENCE_SELECTION` corrected**: previously, a pristine state with zero panels inspected scored a perfect `selectivityRatio` (trivially avoiding irrelevant panels by avoiding everything). Now combined with a `recallRatio` (did the learner obtain the relevant information that exists?) via the minimum of the two — a zero-recall state can no longer score `STRONG`.
- **Validator reachability strengthened**: rejects `sourcePanelId` referencing a nonexistent panel, decision options with an unrecognized `actionType`, and — the audit's exact example — an evidence prerequisite of `CHECK_EQA` when no `EQA`-type panel exists anywhere in the case.
- **Phase-return governance made truthful**: a new `canReturnToPhase()` helper genuinely consults `PHASE_ALLOWS_RETURN_TO` (previously the engine hardcoded the regression target without consulting the table it claimed to use). Wiring this in surfaced a real design subtlety: the check must use the *nominal* phase the attempted action represents (`VERIFICATION`, for a `VERIFY_RECOVERY` attempt), not the stale current phase — otherwise a verification attempted before other actions had separately advanced the phase would be incorrectly blocked from regressing.
- **Pilot 1's disposition option redesigned**: the prior closure's verification fix made "resume without verification" structurally unreachable (since `READY_FOR_VERIFICATION` can now only be reached via genuine verification success). The decision option was redesigned to represent the still-genuinely-reachable "resume after successful verification but without patient-impact review" scenario, which the engine already classifies `UNSAFE`.

Full defect-by-defect detail and exact test counts in `V09_STAGE12A_REPORT.md`.
