# PreciMind QC Learning Lab v0.9 — Stage 12C Competency Model

## Source of truth

Stage 12C consumes Stage 12A's `SCORING_DIMENSIONS` (states.js) and
`computeScoringProfile()` (scoring-model.js) directly. No second
competency engine exists in React.

## The 12 dimensions

| Stage 12A dimension | Learner-facing label |
|---|---|
| SIGNAL_RECOGNITION | Signal Recognition |
| STATISTICAL_INTERPRETATION | Statistical Interpretation (reserved — currently always `null`) |
| ANALYTICAL_REASONING | Analytical Reasoning |
| RULE_INTERPRETATION | QC Rule Interpretation (reserved — currently always `null`) |
| RISK_REASONING | Risk / Immediate Containment |
| INVESTIGATION_STRATEGY | Investigation Strategy |
| EVIDENCE_SELECTION | Evidence Selection |
| PATIENT_IMPACT_REASONING | Patient-Impact Reasoning |
| DECISION_APPROPRIATENESS | Decision Appropriateness |
| VERIFICATION_QUALITY | Verification / Recovery |
| DOCUMENTATION_GOVERNANCE | Documentation Quality |
| METACOGNITIVE_CALIBRATION | Metacognitive Calibration |

## Rating bands

Exact Stage 12A `RATINGS` (`scoring-model.js`): `NEEDS_IMPROVEMENT` →
"Needs Attention", `DEVELOPING` → "Developing", `PROFICIENT` →
"Proficient", `STRONG` → "Strong". `null` (not yet assessable) is shown
as "Not yet assessable" rather than defaulting to a false rating. No
numeric percentage is ever invented — Stage 12A itself never computes
one.

## Learning priorities and lab recommendations

`debrief-adapter.js` filters the 12-dimension profile for
`NEEDS_IMPROVEMENT`/`DEVELOPING` ratings, caps the result at 3, and maps
each to a fixed, hand-authored priority sentence (`PRIORITY_TEXT` in
`learning-priorities.jsx`). Strengths (`STRONG` ratings) are surfaced
separately, capped at 2. Lab recommendations use a fixed
`DIMENSION_TO_LAB` map pointing only at real, existing PreciMind labs
(Rule Laboratory, Investigation Lab, Sigma Sandbox, QC Strategy Lab,
External Assurance Lab, BV & RCV Lab, Patient Surveillance Lab) — no new
module names are ever invented, capped at 3.

## Confidence calibration

Uses `classifyCalibrationCategory(confidence, wasCorrect)`
(scoring-model.js) verbatim, mapped to learner-facing text via
`CALIBRATION_CATEGORY_LABELS`. Grouped by `decisionEventId` throughout —
a revised decision under the same reusable `decisionId` produces two
separate calibration entries, never merged (verified:
`REVISED-03`/`REVISED-04` in `debrief-ui.test.cjs`).
