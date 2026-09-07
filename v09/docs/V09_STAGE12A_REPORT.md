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

For all 3 pilots: **expert path** (zero inefficient/unsafe actions, correct hypothesis established, correct disposition), **safe-but-inefficient path** (same correct conclusion, additional irrelevant-panel inspections flagged `INEFFICIENT`, more elapsed time), **unsafe/premature path** (structurally legal but flagged `UNSAFE`/`CRITICAL_UNSAFE`, never establishes the correct hypothesis). Debrief output directly confirmed to differ meaningfully between expert and unsafe paths (`P1-DEBRIEF-DIFF`).

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
