# PreciMind QC Learning Lab v0.9 — Stage 12D Report

## Morning QC Case Expansion + Adaptive Sequencing + Instructor Analytics Foundation

### 1. Final case-bank size
**12 cases** — the 3 accepted Stage 12A/12B/12C pilots plus 9 new
Stage 12D cases.

### 2. Nine new cases
Case 4 (Isolated Excursion, Family A), Case 5 (Increased Imprecision,
Family C), Case 6 (Calibration Shift, Family D), Case 7 (No Patient
Impact, Family E), Case 8 (EQA Discordance, Family I), Case 9 (Seek
More Evidence, Family O), Case 10 (Premature-Release Trap, Family P),
Case 11 (Concurrent Triage, Family N), Case 12 (Maintenance
Coincidence, Family D-variant). Full detail in
`V09_STAGE12D_CASE_SCIENTIFIC_REVIEW.md`.

### 3. Family coverage
11 distinct case families across the 12-case bank (B, K, M, A, C, D, E,
I, O, P, N — D used twice, deliberately paired as Case 6/Case 12 to
test the opposite failure mode of the same "temporal association ≠
causation" lesson). Deliberately includes cases where the correct
decision is to **not** hold (Case 8), to seek more evidence before
deciding (Case 9), to prioritize by risk rather than visual salience
(Case 11), and where no analytical disturbance exists at all despite a
genuine QC signal (Case 4, Case 7).

### 4. Difficulty distribution
4 distinct levels represented: `LEVEL_1_CLEAR_SIGNAL` through
`LEVEL_4_ANALYTICAL_PLUS_RISK_TRADEOFF`.

### 5. Case authoring standard
`V09_MORNING_QC_CASE_AUTHORING_STANDARD.md` — 16 required documentation
elements per case, plus the non-negotiable scientific doctrine every
case must respect.

### 6. Scientific validation approach
Every case was validated against the existing schema/validator (all 12
pass with zero errors), then had its expert path run through the real
engine end-to-end before being considered complete — several real
case-authoring bugs (missing panel definitions, wrong phase
prerequisites) were caught this way rather than assumed away.

### 7. Expert/adversarial path totals
`expanded-case-paths.test.cjs`: **27/27** (9 expert + 18 adversarial,
2 per new case, meeting the required minimum). Building this suite
surfaced and resolved a subtle test-authoring pattern (`CHARACTERISATION`
requires a genuine panel inspection as a real prerequisite, and
`plausibleFromStart` hypotheses don't count as "genuinely formed" for
phase-progression purposes) — caught by careful, instrumented debugging
rather than assumed.

### 8. Production case-bank UI
`production-case-select.jsx` now shows: a recommended-next-case card
(guidance, never a lock), a modest progress dashboard (cases completed,
recent strengths, development priorities — no badges/XP/leaderboards),
per-case completion status badges, and a confirmed "Reset learning
history" control. Neutral titles for all 12 cases; the raw case
`identity.title` fields are never shown to learners.

### 9. Learner-history schema
`attemptRecord = {attemptId, caseId, startedAt, completedAt,
competencyProfile, decisionSummary, confidenceSummary, evidenceSummary,
finalServiceState, recommendedLearningPriorities}` — never raw
`groundTruth`, never a personal identifier.

### 10. Privacy/storage model
`localStorage`-only (injectable in-memory fallback for tests and for
environments where storage is blocked — a real robustness bug found and
fixed this stage: `localStorage` access can throw on opaque origins).
No network call anywhere in the adaptive or analytics modules
(structurally verified). "Reset learning history" always available,
always explicit.

### 11. Adaptive-sequencing rules
Rules A–E as specified: prioritize `NEEDS_IMPROVEMENT` before
`DEVELOPING`; prefer a different case family than the immediately
previous case; never increase difficulty immediately after weak
performance; progress difficulty after sustained strength; avoid
repeating the same case unless no alternative exists. Full detail in
`V09_STAGE12D_ADAPTIVE_SEQUENCING.md`.

### 12. Cold-start behavior
Recommends the lowest-difficulty (`LEVEL_1_CLEAR_SIGNAL`) case
deterministically. Verified in a real browser: cold start recommends
Case 4 exactly.

### 13. Weak-performance recommendation behavior
Verified (unit + real browser, via injected history): a recorded
`NEEDS_IMPROVEMENT` in Evidence Selection produces a recommendation
naming that exact competency and drawn from a different case family
than the one just attempted.

### 14. Strong-performance progression
Verified (unit): after competency ratings show no remaining weak
dimensions, the recommender progresses to a harder, unattempted case.

### 15. Learner override
Verified in a real browser: choosing any non-recommended case from
"Browse all cases" opens it identically — the recommender never removes
or locks out any case.

### 16. Competency-history model
Per-dimension latest rating, cautious trend (`INITIAL_EVIDENCE` at 1
observation, `EARLY_PATTERN` at 2, a directional trend only at 3+), and
observation count. Never a fitted regression, never a percentage.

### 17. Learner progress view
Cases completed, recommended next case, recent competency strengths
("Strong recent performance" / "Consistently strong across recent
cases" — never MASTERED/CERTIFIED), and development priorities. No
gamification.

### 18. Instructor analytics schema
`analytics-model.js` aggregates anonymised attempt records into
pedagogically interpretable metrics only: attempts by case, common
low-rated competencies, decision-quadrant counts (including an explicit
unsupported-decision rate), and confidence-calibration category counts.

### 19. Instructor dev view
`instructor-projection.js` — development-facing only, never a
production primary navigation destination (verified: `app-shell.jsx`
never references it; primary nav remains exactly 14). Every summary
carries the mandatory disclaimer verbatim: *"Simulation-learning
analytics only. Not a measure of clinical competence or employment
performance."* Synthetic multi-learner fixtures use "Learner A/B/C"
only.

### 20. Analytics event schema
10 versioned, documented event types (`analytics-types.js`,
`ANALYTICS_SCHEMA_VERSION = '1.0.0'`), each declaring required/optional/
prohibited fields — every event type explicitly prohibits `groundTruth`.
The documentation-vs-event-vs-truth boundary (Section 41) is preserved
throughout: an attempt record's `finalServiceState` always derives from
genuine engine state, never a learner's documentation claim.

### 21. Privacy protections
No name, email, staff identifier, institution, real patient data, IP
address, or device fingerprint anywhere in the adaptive or analytics
pipeline — verified structurally and via pattern-matching in
`case-bank.test.cjs`/`analytics.test.cjs`.

### 22. Research-readiness limitations
Stable fields exist for future small-scale educational-research
aggregation (case ID, family, difficulty, competency dimensions,
decision quadrants, confidence categories), but this schema is
unvalidated for research use and the 12-case bank is too small for any
statistically robust research conclusions at this stage. Full detail in
`V09_STAGE12D_ANALYTICS_SCHEMA.md`.

### 23. Mobile behavior
Verified in a real browser at 390×844: case bank, recommendation, and
completion state all render with zero horizontal overflow; progress
dashboard remains readable; no dense desktop-style analytics grid was
ever pushed to mobile (the instructor dev view remains desktop-first
and dev-only).

### 24. Browser E2E totals
`v09-stage12d-casebank-adaptive.e2e.js`: **17/17** — all 12 case cards
render, cold start, genuine-gameplay completion and status update,
recommendation reacting to real recorded history, learner override,
reset restoring cold start, deep gameplay through one FOUNDATION, one
INTERMEDIATE, and one ADVANCED case, and mobile responsiveness.

**A genuine cross-stage regression was found and fixed during final
verification**: adding the recommended-case card (sharing a CSS class
with the browse-all grid cards) shifted DOM-order-based selectors in
the *existing* Stage 12C browser test, causing it to select the wrong
case entirely. Fixed by scoping Stage 12C's selectors to the stable
`.mqc-case-select__grid` container specifically; reconfirmed all three
browser suites (Stage 12B 47/47, Stage 12C 25/25, Stage 12D 17/17) pass
together against the final rebuilt artifacts.

### 25. Stage 12D test/governance totals
`case-bank.test.cjs` **136/136**, `expanded-case-paths.test.cjs`
**27/27**, `adaptive-sequencing.test.cjs` **17/17**, `analytics.test.cjs`
**34/34**, `stage12d-casebank-adaptive.test.js` **40/40**, browser E2E
**17/17**.

### 26. Stage 12A baseline
Unchanged: engine 49/49, pilot paths 39/39, progression-invariants
59/59, governance 121/121 — **268/268** total.

### 27. Stage 12B baseline
Unchanged: UI 105/105, browser E2E 47/47, governance 65/65.

### 28. Stage 12C baseline
Unchanged (after the selector-scoping fix): debrief-ui 44/44,
governance 48/48, browser E2E 25/25.

### 29. Historical regressions
All unchanged: pre-11C1 189/189, 11C1 98/98/94/94, 11C2 35/35/49/49,
v0.8 3849/3849.

### 30. Frozen SHAs
All three reconfirmed byte-identical: Stage 11B `975adefb...`, Stage
11C1 `c0407262...`, Stage 11C2 `4614aca9...`.

### 31. Exact changed-file scope
New: `v09/app/morning-qc/cases/case-{04..12}-*.js` (9 files),
`v09/app/morning-qc/adaptive/**` (6 files), `v09/app/morning-qc/analytics/**`
(4 files), `v09/tests/morning-qc/{case-bank,expanded-case-paths,
adaptive-sequencing,analytics}.test.cjs`, `v09/tests/stage12d-casebank-adaptive.test.js`,
`v09/tests/browser/v09-stage12d-casebank-adaptive.e2e.js` +
`v09/tests/browser/evidence/stage12d/**`, five new docs.
Modified (all narrowly, all explicitly authorized): `v09/app/morning-qc/case-schema.js`
+ `case-validator.js` (optional curriculum/instructor metadata, per this
audit's own Section 9/14 sanction), `v09/app/morning-qc/cases/index.js`
(new `ALL_CASES` export — never frozen), `v09/app/morning-qc/ui/production-case-select.jsx`
+ `morning-qc-room.jsx` + `morning-qc-room.css` (case-bank UI +
completion hook), `v09/app/morning-qc/debrief/debrief-adapter.js` (fixed
a real leak of the newly-added `instructor` field, found by this
stage's own case-bank test), `v09/app/ui/app-shell.jsx` (generic
`ALL_CASES` import, replacing the 3 hardcoded pilot imports), one
selector-scoping fix in `v09/tests/browser/v09-stage12c-debrief-production.e2e.js`,
`v09/tests/morning-qc/build-support/jsx-build.cjs` (generalized to
handle the new `adaptive/`/`analytics/` sibling directories), and
`v09/docs/**`+`v09/CHANGELOG.md`.

Zero changes to: `engine.js`, `states.js`, `types.js`,
`decision-model.js`, `evidence-model.js`, `debrief-model.js`,
`scoring-model.js` (all untouched this stage), the 3 original pilot
case files, `dist-vite/`, `vite.modular.config.mjs`, `dist-vite-bridge/`,
or `package.json`/`package-lock.json`.

### 32-35. Delivery
See the accompanying delivery message for final commit SHA/count, both
deterministic build tree hashes, and ZIP SHA-256/integrity.
