# PreciMind QC Learning Lab v0.9 — Stage 12D Adaptive Sequencing

## Design principle

The system asks "what case should this learner see next, and why?" —
but remains transparent, deterministic, explainable, reversible, and
non-punitive throughout. It is **not** validated adaptive-learning
psychometrics; it is deterministic competency-aware sequencing.

## Inputs (Section 24)

`recommendNextCase(allCases, attempts)` uses only: prior competency
ratings (from attempt records), the immediately previous attempted
case's family/difficulty, and each case's own `identity.caseFamily`/
`identity.difficulty`/`identity.curriculum`. It never uses hidden
ground truth, random ranking, opaque ML, or an external API call —
verified structurally in `stage12d-casebank-adaptive.test.js`.

## Rules (Section 25)

- **Rule A**: `NEEDS_IMPROVEMENT` dimensions are prioritized before
  `DEVELOPING` ones.
- **Rule B**: among cases targeting the weak dimension, one from a
  *different* case family than the immediately previous case is
  preferred, avoiding rote memorization of one pattern.
- **Rule C**: difficulty is never immediately increased following a
  weak-performance case.
- **Rule D**: after performance with no remaining weak dimensions,
  difficulty progresses to an unattempted, harder case.
- **Rule E**: the same case is not recommended again unless no
  suitable alternative exists.

## Cold start (Section 29)

With no attempt history, the lowest-difficulty (`LEVEL_1_CLEAR_SIGNAL`)
case is recommended deterministically — never inferred from unrelated
PreciMind lab completion (not implemented).

## Explainability (Section 27)

Every recommendation carries exactly one short, non-punitive sentence
(e.g. "Recommended because your previous debrief identified evidence
selection as a development priority."). No internal scoring object is
ever exposed to the learner.

## Learner choice (Section 28)

The recommendation is guidance, never a lock: "Browse all cases" always
shows the complete bank, and any case — recommended or not — opens
identically. Verified directly in the real browser
(`OVERRIDE-OPENS-NORMALLY`).

## Competency history and trend doctrine (Section 30-31)

`buildCompetencyHistory()` retains, per dimension: latest rating,
observation count, and a cautious trend label. A single observation is
reported as "initial evidence," two as "early pattern" — only 3+
observations report a directional trend (`IMPROVING`/`STABLE`/
`NEEDS_MORE_EVIDENCE`), and even then via a simple first-vs-last
comparison over the most recent 3, never a fitted regression. No
percentage is ever computed.

## Mastery doctrine (Section 32)

`describeConsistentStrength()` never returns `MASTERED`, `CERTIFIED`, or
`COMPETENT_FOR_PRACTICE` — only "Strong recent performance" or
"Consistently strong across recent cases" (the latter requiring 3+
observations with no recent decline).

## Storage and privacy (Section 20-22)

`attempt-store.js` persists to `localStorage` only (with an injectable
in-memory fallback for tests and for environments where localStorage is
unavailable/blocked) — no network call, ever. An attempt record contains
only: attemptId, caseId, timestamps, the safe competency profile,
decision quadrants, confidence categories, evidence counts, final
service state, and learning priorities — never raw `groundTruth`, never
a personal identifier. "Reset learning history" is explicit (with
confirmation in the production UI) and fully restores cold-start
behavior.

## Limitations

This is a small-bank (12-case), rule-based recommender, not a validated
psychometric instrument. It has not been evaluated for adaptive-learning
efficacy; it exists to make case sequencing transparent and
competency-aware rather than arbitrary.
