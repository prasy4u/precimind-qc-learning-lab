# PreciMind QC Learning Lab v0.9 — Stage 12D Analytics Schema

## Schema versioning

`ANALYTICS_SCHEMA_VERSION = '1.0.0'` (`analytics-types.js`).
`identity.version` on every case (already present since Stage 12A)
serves as `caseSchemaVersion` per case. No elaborate migration framework
exists yet (Section 42) — not needed until the schema changes.

## Event schema (Section 40)

Ten documented event types: `CASE_STARTED`, `PANEL_INSPECTED`,
`EVIDENCE_OBTAINED`, `DECISION_EXECUTED`, `CONFIDENCE_RECORDED`,
`VERIFICATION_ATTEMPTED`, `CASE_COMPLETED`, `DEBRIEF_VIEWED`,
`CASE_RECOMMENDED`, `CASE_SELECTED`. Each declares required fields,
optional fields, and prohibited fields — every single event type
explicitly prohibits `groundTruth` (verified in `analytics.test.cjs`).
`validateEvent()` rejects any event missing a required field or
carrying a prohibited one.

## Aggregation (Section 35, 39)

`aggregateAttempts()` computes only metrics with a genuine pedagogic
interpretation: attempts by case, common low-rated competencies
(sorted, capped at 5), decision-quadrant counts (including the
unsupported-decision rate), and confidence-calibration category counts.
It deliberately does **not** collect raw UI telemetry (mouse
movements, etc.) — only the same safe fields already exposed through
the debrief projection.

## The documentation/event/truth boundary (Section 41)

An attempt record's `finalServiceState` and `decisionSummary` always
derive from genuine engine state (via the debrief projection), never
from a learner's documentation claim. A learner who documents "held
results" without ever executing `HOLD_RESULTS` produces an attempt
record whose `finalServiceState` reflects the *real* service state —
the documentation claim itself is never conflated with, or promoted to,
engine truth anywhere in the analytics pipeline.

## Instructor projection (Section 34, 36-38)

`buildInstructorSummary()` is a development-facing-only aggregation —
**not** a production primary navigation destination (verified: `app-shell.jsx`
never references it, and primary navigation remains exactly 14). Every
summary carries the mandatory disclaimer verbatim: *"Simulation-learning
analytics only. Not a measure of clinical competence or employment
performance."* No ranking, pass/fail label, or staff comparison is ever
computed. Any synthetic multi-learner fixture uses "Learner A/B/C"
labels only — verified structurally that no real-name-shaped strings
appear.

## Privacy (Section 22, 37)

No name, email, staff identifier, institution, real patient data, IP
address, or device fingerprint is ever collected, stored, or
aggregated — analytics operates exclusively on the same safe,
already-reduced attempt-record shape the adaptive module itself
produces and persists locally.

## Research-readiness limitations (Section 39)

Stable fields exist for case ID, family, difficulty, competency
dimensions, `decisionEventId`-derived quadrants, confidence categories,
evidence-selection counts, and final disposition — sufficient for
future small-scale educational-research aggregation, but this schema
has not itself been validated for research use, and the case bank (12
cases) is too small for any statistically robust research conclusions
at this stage.
