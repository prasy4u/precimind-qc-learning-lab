# Stage 12A — Morning QC Room Foundation Report

**Starting HEAD:** `3581d28` | **Commit count:** 55 | **Branch:** `v0.9-development`

---

## Scope

Stage 12A establishes the Morning QC Room **domain foundation and simulation engine** only — no production UI, no navigation integration. This report documents the actual work performed, including genuine defects found and fixed during authoring.

---

## Computed Scientific Values (Not Invented)

The following exact values were computed by directly invoking the active scientific modules during case authoring (transcript below), then embedded verbatim into the pilot case data:

```
Pre-shift QC mean: 100.02, SD: 0.4324
Post-shift QC mean: 107.0667, SD: 0.4761
Post-shift bias% vs target 100: 7.0667
Sigma with TEa=9%: 0.9667 (valid: true)
RCV (CVA=2, CVI=6, bidirectional-95): 17.5308%
Relative difference% baseline 4.2 -> repeat 5.1: 21.43%
```

Computed via: `app/core/statistics.js:calcMean/calcSampleSD/calcBiasPercent/calcSigma` and `app/bv/calc.js:calculateClassicalRcv`.

---

## Genuine Defects Found and Fixed During Authoring

**1. Case validator design flaw** (caught by the validator itself rejecting valid case designs): the initial ground-truth consistency rule assumed `rootCauseEstablished: true` could never co-occur with `disturbanceEstablished: false`. This is wrong — case families K (PBRTQC/population shift) and M (RCV/genuine biological change) specifically require establishing a *non-disturbance* explanation for an observed signal. Corrected the rule to instead check for literal string identity between `observedSignal` and `rootCauseDescription` (the actual Section 25 requirement: "a case automatically equates signal with root cause").

**2. Missing hypothesis transition** (caught by engine unit test `HYP-03` failing): `HYPOTHESIS_STATE_TRANSITIONS` did not permit `PLAUSIBLE → ESTABLISHED` directly, so decisive evidence could not establish a hypothesis without an artificial intermediate `SUPPORTED` step. Added the missing legal transition.

**3. Unrealistic test scenarios, not engine bugs** (caught by test failures that on investigation revealed the *test* was wrong): initial engine tests called `VERIFY_RECOVERY` and `RESUME_SERVICE` directly from a pristine `RUNNING` state. Both were correctly rejected as structurally illegal by the engine's transition tables (`RUNNING` cannot reach `READY_FOR_VERIFICATION` or `RESUMED` directly — verification/resumption conceptually implies resuming *from* a held/reviewed state). Fixed the tests to follow the realistic `HOLD_RESULTS → VERIFY_RECOVERY → RESUME_SERVICE` flow instead of loosening the transition tables.

---

## State Machine Summary

- **14 `SIMULATION_PHASES`** (`BRIEFING` → ... → `DEBRIEF`), non-linear, derived from action history, not a forced wizard.
- **7 `SERVICE_STATES`** with an explicit transition table — `RESUMED` reachable only via `READY_FOR_VERIFICATION`.
- **6 `PATIENT_IMPACT_STATES`** — never auto-inferred from a QC signal.
- **6 `HYPOTHESIS_EVIDENCE_STATES`** (graded, not boolean) — `ESTABLISHED` requires decisive evidence, not mere "most supported."
- **5 `SEVERITY_LEVELS`** distinguishing structural illegality (blocked outright) from severity-flagged-but-legal unsafe actions (recorded for scoring/debrief).

## Decision / Evidence / Scoring / Debrief Models

- `decision-model.js`: every decision evaluated on two independent axes (`outcomeAppropriate`, `reasoningSupported`) — a correct outcome via unsupported reasoning never receives `fullCreditEligible`.
- `evidence-model.js`: panel/evidence usage summarized without rewarding indiscriminate inspection (`selectivityRatio` rewards correctly ignoring irrelevant panels).
- `scoring-model.js`: 12 independent dimensions, never collapsed to one score; confidence calibration classified into 6 categories, never substituting for correctness.
- `debrief-model.js`: consults ground truth only post-hoc; produces a structured multi-part explanation, never a bare "correct answer = X."

## Case Schema and Validator

Formal contract in `case-schema.js` (identity, lab context, timeline, panels, ground truth, decision opportunities, verification criteria, debrief evidence, hypotheses, evidence, provenance). `case-validator.js` fails closed, accumulating every violation; directly tested to reject 6 distinct classes of invalid case (missing fields, dangling hypothesis references, contradictory ground truth, duplicate IDs, unreachable verification, signal-equals-root-cause).

## Revised A–P (→A–S) Case-Family Catalogue

Full analysis in `V09_MORNING_QC_CASE_CATALOGUE.md`: normalized all 16 Stage 11A families to the new schema, classified into 7 learning-purpose clusters, documented 5 explicit overlaps (kept as intentional matched/related pairs, not merged), identified 5 coverage gaps against Section 11, proposed 3 new families (Q, R, S). Historical A–P document retained unchanged.

## Three Pilot Cases

| Pilot | Family | Teaching focus |
|---|---|---|
| 1 | B | Straightforward systematic disturbance: containment → investigation → decisive test → intervention → verification → patient-impact review → resume |
| 2 | K | Misleading/discordant: PBRTQC alert explained by population shift, not analytical error; irrelevant panels present |
| 3 | M | IQC+EQA context with RCV-based patient-impact reasoning; large result change is genuine biological change, not an error |

All 3 validate cleanly. Machine-readable scientific rationale for each in `app/morning-qc/data/pilot-scientific-rationale.js`, explicitly distinguishing known facts from intentionally-uncertain ones.

## Path-Test Results

For all 3 pilots: **expert path** (zero inefficient/unsafe actions, correct hypothesis established, correct disposition), **safe-but-inefficient path** (same correct conclusion, additional irrelevant-panel inspections flagged `INEFFICIENT`, more elapsed time), **unsafe/premature path** (structurally legal but produces an ACTUAL engine-recorded `UNSUPPORTED`/`UNSAFE`/`CRITICAL_UNSAFE` decision via a case-authored `decisionId`/`optionId`, not merely "fails to establish the correct hypothesis"). Debrief output directly confirmed to differ meaningfully between expert and unsafe paths (`P1-DEBRIEF-DIFF`).

**Corrective-closure note:** this claim was NOT fully true in the initial Stage 12A submission — independent audit found Pilot 2's and Pilot 3's "unsafe" paths only demonstrated a missing correct conclusion, with no actual engine-recorded severity behind them (the case-defined `decisionOpportunities` were not yet wired into the engine at all). This is now corrected for all 3 pilots — see the corrective-closure section below.

## Test Totals (Stage 12A, reported separately)

| Suite | Assertions |
|---|---|
| Engine unit tests | 41/41 |
| Pilot path tests | 28/28 |
| Stage 12A governance | 42/42 |
| **Stage 12A total** | **111/111** |

## Regression (all prior baselines reconfirmed unchanged)

- Pre-11C1 v0.9 historical: 189/189
- Stage 11C1 governance: 98/98 (node_modules present), 94/94 (absent)
- Stage 11C2 scientific parity: 35/35
- Stage 11C2 governance: 49/49
- v0.8: 3849/3849, 30 suites
- Stage 11B compat SHA: `975adefb62df00f12372cb705b9c2ef9b51c89a2b8133ade77ebf0db16f8c97c` — unchanged
- Stage 11C1 bridge tree SHA: `c0407262fae35c913ec802740f27c37289e31038de9ad4cd542bb803e61d2e65` — unchanged
- Stage 11C2 modular tree SHA: `4614aca944cedfa650b0533280b2923e6f13c2b9f25e7c208501a3fcc477c2a5` — unchanged (Stage 12A touches no production application source)

## Scope Discipline

No production UI, no navigation destination, no dashboards, no case-selection screen. All new code under `v09/app/morning-qc/**`, `v09/tests/morning-qc/**`, `v09/tests/stage12a-morning-qc-foundation.test.js`, and `v09/docs/*morning-qc*`/`*Stage12A*`. Zero changes to any of the 34 inherited active modules, `main.jsx`, frozen `v09/src/**`, the Stage 11C1 bridge, or package dependencies (only new test-invocation npm scripts would be added if needed — none were required for Stage 12A specifically, since these tests are run directly via `node`).

---

## Independent-Audit Corrective Closure

An independent audit of the initial Stage 12A commit found the domain model was well-designed but the engine did not yet ENFORCE several behaviors it claimed to model. Fifteen distinct defects were corrected:

1. **Panel availability enforced** via a `maxPhaseIndexReached` high-water mark in engine state (regression-safe: a phase regression never revokes previously-earned panel access).
2. **Evidence prerequisites enforced**: `availableOnlyAfterActionType` is now checked before `REQUEST_EVIDENCE` succeeds; premature requests fail without mutating state. Pilot 3's RCV evidence had a tautological `REQUEST_EVIDENCE` prerequisite — removed (now directly requestable), and the validator now rejects this specific self-referential pattern outright.
3. **Decision opportunities made executable**: actions may carry `{ decisionId, optionId }`; the engine looks up the case-authored option for authoritative `severity`/`outcomeAppropriate`. A gap where this override didn't apply to `FORM_HYPOTHESIS` (and was only an allow-list for a few action types) was found and fixed — the override is now universal.
4. **Two-axis model corrected**: `outcomeAppropriate` no longer derives from severity ("anything except `CRITICAL_UNSAFE`") — it is a genuinely independent, case-authored field on every decision option.
5. **Signal explanation separated from analytical root cause**: new `signalExplanationEstablished`/`signalExplanationDescription` ground-truth fields; `rootCauseEstablished` now means exclusively an analytical cause and the validator rejects it being true when `disturbanceEstablished` is false.
6. **Pilot 2 revised**: `rootCauseEstablished` → `false`; `signalExplanationEstablished` → `true` (population case-mix shift explains the signal without being an analytical root cause).
7. **Pilot 3 RCV science corrected**: no longer claims RCV exceedance establishes "a genuine biological/clinical change." Hypotheses restructured (`hyp-statistically-significant-change` replaces the overclaiming `hyp-genuine-biological-change`); added `hyp-preanalytical-factor` and a specimen-handling evidence item (`ev-specimen-handling`, `panel-specimen-context`) so the case does not falsely eliminate every alternative through IQC/EQA alone — the preanalytical hypothesis is correctly left `WEAKENED`, never `CONTRADICTED`.
8. **Patient-impact terminal states evidence-gated**: new `patientImpactCriteria.requiredEvidenceIdsForTerminalState`; Pilot 1 gained a new evidence item (`ev-affected-window`, via `CHECK_PATIENT_DISTRIBUTION`) identifying the actual affected result window before `AFFECTED_RESULT_SET_IDENTIFIED` can be declared.
9. **Verification/service-state semantics corrected**: a failed `VERIFY_RECOVERY` no longer advances to `READY_FOR_VERIFICATION` — it remains `HELD`.
10. **Phase regression implemented**: failed verification deterministically regresses `phase` to `INVESTIGATION` (the engine, not the learner, determines this), using the previously-declared-but-unused `PHASE_ALLOWS_RETURN_TO` table (extended with the `VERIFICATION → INVESTIGATION` entry).
11. **Confidence-to-decision association corrected**: `computeCalibration()` now matches each confidence record to its specific `decisionId` among decisions actually made in the trace, excluding unmatched records rather than silently comparing against an unrelated decision.
12. **Pilot 1 Sigma provenance clarified**: `labContext.sigmaContext` explicitly documents that Sigma 0.97 uses a pre-specified analytical CVA of 2%, distinct from the post-shift sample SD (≈0.4761) of the disturbed cluster.
13. **Scoring model corrected**: `DECISION_APPROPRIATENESS` now reads the outcome-correctness axis (was accidentally duplicating `VERIFICATION_QUALITY`'s reasoning-support measure); `INVESTIGATION_STRATEGY` now penalizes missed high-value evidence directly.
14. **Terminal/debrief semantics explicitly deferred** (Option B): `terminal` remains permanently `false` throughout Stage 12A and this is now documented as an intentional deferral to Stage 12B, not a silently-unfinished feature.
15. **Validator strengthened**: decision options now require `outcomeAppropriate`; `patientImpactCriteria` is validated for required-field presence and evidence reachability; the `REQUEST_EVIDENCE`-as-prerequisite tautology is explicitly rejected.

**Testing after closure**: engine unit tests 61/61 (was 41, all genuinely re-verified — 2 test-authoring bugs of my own were also found and fixed along the way: an off-by-one in a panel-count assertion, and two instances of calling an action from an unrealistic starting phase). Pilot path tests 41/41 (was 28). Stage 12A governance 60/60 (was 42, +18 new corrective-closure-specific assertions). All 3 revised pilot cases validate cleanly.

---

## Independent-Audit FINAL Engine-Semantics Closure

A second independent re-audit confirmed the domain model and scientific corrections from the prior closure were sound, but found nine remaining engine-semantics gaps between declared and enforced behavior:

1. **Source-panel evidence gating**: added `sourcePanelId` to the evidence schema; the engine now requires the referenced panel to be genuinely inspected (not merely phase-available) before panel-derived evidence can be obtained. Verified: `ev-lot-timing` (sourced from `panel-reagent-lot`) cannot be obtained without inspecting that panel first, even though the panel itself is phase-available.
2. **Phase high-water-mark gaming closed**: every phase-advancing action except `ACKNOWLEDGE_SIGNAL` now requires `documentation.signal != null`, rejected outright if unmet. **A third exploit of the same class was found during this work** (`FORM_HYPOTHESIS` at pristine `BRIEFING`), beyond the two the audit specifically demonstrated (`DOCUMENT`, `REVIEW_PATIENT_IMPACT`) — closed with the same guard.
3. **Executable decision contracts**: decision options now declare `actionType`; the engine rejects execution via a mismatched action type and enforces the owning decision's `availableFromPhase` before the action's own phase-advance. Decision `category` is recorded on the action-history entry and consumed directly by `decision-model.js`.
4. **Genuine four-combination outcome/reasoning matrix**: built via a small synthetic fixture case (`cases/synthetic-fixture.js`), per the audit's explicit permission, rather than distorting pilot science. **Found a test-design bug during this work**: the fourth combination's synthetic decision initially bound to `ESCALATE`, which is structurally unreachable from a fresh `RUNNING` state (requires `HELD` first) — rebound to `DOCUMENT`.
5. **Confidence calibration corrected**: now uses `outcomeAppropriate`, not `reasoningSupported`. `RECORD_CONFIDENCE` rejects an unexecuted `decisionId` outright; duplicate confidence for one decision follows an explicit "latest replaces earlier" policy.
6. **`EVIDENCE_SELECTION` false-perfect-score fixed**: combined with a new recall metric via minimum — a zero-inspection state no longer scores `STRONG`.
7. **Validator reachability strengthened**: rejects invalid `sourcePanelId`/`actionType` references and the audit's exact `CHECK_EQA`-with-no-EQA-panel example.
8. **Phase-return governance made truthful**: added `canReturnToPhase()`, genuinely consulting `PHASE_ALLOWS_RETURN_TO`. **Found a real design gap while wiring this in**: the check must use the attempted action's *nominal* phase (`VERIFICATION`, for `VERIFY_RECOVERY`), not the stale current phase — otherwise verification attempted before other actions had separately advanced phase would be incorrectly blocked from regressing. Fixed and verified.
9. **Pilot 1's `opt-resume-unverified` redesigned**: the prior closure's verification fix made "resume without verification" structurally unreachable. Redesigned as `opt-resume-no-pi-review`, representing the still-genuinely-reachable "verified but patient-impact review not addressed" `UNSAFE` scenario.

**All three pilot cases updated**: `sourcePanelId` added to every evidence item (explicit `null` for action-generated evidence); `actionType` added to every decision option, with `availableFromPhase` values corrected to avoid chicken-and-egg self-unlock (e.g. Pilot 1's `dec-disposition` moved from the unreachable `RESUME_OR_HOLD` to `VERIFICATION`).

**Testing after this closure**: engine unit tests 59/59 (was 41 before this closure cycle), pilot path tests 39/39 (was 28), Stage 12A governance 77/77 (was 60) — **Stage 12A total: 175/175**. Several genuine bugs were found and fixed through this testing, not merely asserted correct — see items 2, 4, and 8 above, plus 4 governance assertions (21, 22, 24, 25) that needed updating to acknowledge the signal first under the new phase-guard before they passed for the right reason.
