# Morning QC Room — Stage 12A Scoring Model

**Status:** Scoring MODEL only (Section 19) — not final product gamification. No point totals, no leaderboards, no single opaque grade.

---

## Twelve Independent Dimensions

`scoring-model.js` computes a qualitative rating (`NEEDS_IMPROVEMENT | DEVELOPING | PROFICIENT | STRONG`, or `null` where not yet exercised) for each of the 12 `SCORING_DIMENSIONS`:

| Dimension | Stage 12A computation basis |
|---|---|
| `SIGNAL_RECOGNITION` | Whether the learner's documentation records an acknowledged signal |
| `STATISTICAL_INTERPRETATION` | Reserved — not yet wired to a specific action in the 3 pilot cases |
| `ANALYTICAL_REASONING` | Fraction of `INTERPRETATION`-category decisions that were reasoning-supported |
| `RULE_INTERPRETATION` | Reserved — populated when a case directly exercises rule-engine evidence |
| `RISK_REASONING` | Fraction of `CONTAINMENT`-category decisions that were reasoning-supported |
| `INVESTIGATION_STRATEGY` | Evidence efficiency ratio (high-value obtained / total obtained) |
| `EVIDENCE_SELECTION` | Panel selectivity ratio (1 − irrelevant-panels-inspected / total panels) |
| `PATIENT_IMPACT_REASONING` | Fraction of `PATIENT_IMPACT_REVIEW`-category decisions that were reasoning-supported |
| `DECISION_APPROPRIATENESS` | Fraction of `DISPOSITION`-category decisions that were reasoning-supported |
| `VERIFICATION_QUALITY` | Fraction of `VERIFICATION`-category decisions that were reasoning-supported |
| `DOCUMENTATION_GOVERNANCE` | Fraction of documentation fields populated |
| `METACOGNITIVE_CALIBRATION` | Confidence-vs-reasoning-support alignment across recorded confidence points |

Every dimension is reported **independently** — `computeScoringProfile()` never sums or averages them into one number.

---

## Never Reward Panel-Opening; Never Penalize Correct Selectivity

`EVIDENCE_SELECTION` is computed as `1 − irrelevantInspected/totalPanels` — a learner who correctly ignores every irrelevant panel scores the maximum on this dimension, while a learner who opens every panel indiscriminately scores lower, even if their final disposition happens to be correct. This directly implements Section 19's "do not award points simply for opening every panel" and "do not punish an expert for correctly ignoring irrelevant information."

---

## Two-Axis Decision Evaluation (Not One Collapsed Pass/Fail)

`decision-model.js`'s `evaluateDecision()` reports `outcomeAppropriate` and `reasoningSupported` as **separate booleans** per decision, plus a derived `fullCreditEligible = outcomeAppropriate && reasoningSupported`. This directly implements Section 17: a correct final disposition reached through unsafe or unsupported reasoning (e.g., resuming service without adequate verification, even if no harm resulted in that particular case) does not receive full credit — `reasoningSupported` is `false` whenever the action's engine-assigned severity is `UNSUPPORTED`, `UNSAFE`, or `CRITICAL_UNSAFE`.

---

## Confidence Calibration (Never a Correctness Substitute)

`classifyCalibrationCategory(confidence, wasCorrect)` in `scoring-model.js` produces exactly the six categories Stage 12A Section 18 requires:

- `CORRECT_CALIBRATED` (high confidence, correct)
- `CORRECT_UNDERCONFIDENT` (low confidence, correct)
- `INCORRECT_OVERCONFIDENT` (high confidence, incorrect)
- `INCORRECT_APPROPRIATELY_UNCERTAIN` (low confidence, incorrect)
- `CORRECT_MODERATE` / `INCORRECT_MODERATE` (moderate confidence, either outcome)

Recording a confidence value never alters the underlying correctness determination — `RECORD_CONFIDENCE` actions are purely additive to `confidenceRecords` and do not touch `serviceState`, `patientImpactState`, or `hypothesisStates`.

---

## Severity Model (Distinct From Scoring, Feeds Into It)

`states.js`'s `SEVERITY_LEVELS` (`INFORMATIONAL, INEFFICIENT, UNSUPPORTED, UNSAFE, CRITICAL_UNSAFE`) is a structured ordinal scale, not arbitrary punitive scoring (Section 20). The pilot path tests directly confirm two different unsafe actions (inspecting an irrelevant panel vs. a premature service resumption) receive meaningfully different, correctly-ordered severities (`SAFEUNSAFE-01`, `SAFEUNSAFE-02`).

---

## What Stage 12A Does NOT Implement

Per Section 19: no numeric point totals, no leaderboard, no single grade. Per Section 18: no elaborate metacognitive analytics beyond the calibration classification the engine needs. These remain reserved for a later UI/product stage, once the full Morning QC Room interaction shell exists to present multi-dimensional feedback meaningfully rather than as a bare data structure.
