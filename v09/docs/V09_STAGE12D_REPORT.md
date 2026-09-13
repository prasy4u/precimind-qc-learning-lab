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

---

## Stage 12D SCIENTIFIC, ADAPTIVE AND ANALYTICS TRUTH Corrective Closure

A second independent audit found 17 material defects across scientific accuracy, generic-engine limitations, adaptive-sequencing honesty, and privacy hardening. All are resolved.

### Scientific numeric corrections (by case)
- **Case 5**: the original 4-point design incorrectly claimed a "2_2s rule triggered" (none of the 4 points exceeded ±2SD; the nearest pair was on opposite sides of the mean). Redesigned around a genuine 20-point rolling window with mean/SD/CV/Sigma computed and independently re-verified (mean 3.505, sample SD 0.1059, current Sigma≈2.58 vs. prior≈3.41) — no fabricated rule claim remains.
- **Case 7**: 8.42→8.68 mg/dL (z now genuinely 3.4, was 2.10 — did not actually exceed 1_3s).
- **Case 11**: 4.28→4.35 µIU/mL (z now genuinely 3.5, was 2.80).
- **Case 12**: 54.8/54.1→53.8/53.5 U/L (both now genuinely exceed -3SD, were -2.60/-2.95).
- All four corrections independently re-verified via `scientific-numeric-audit.test.cjs`, which recomputes z-scores/CV/Sigma from first principles and confirms both that the corrected values exceed strict 1_3s and that the original values did not.

### Decision-option-specific evidence provenance
Added `availableOnlyAfterDecisionOption` to the engine (`isEvidenceAvailable()`), schema, and validator — requiring a prior action to have executed the *exact* decisionId+optionId, closing a class of exploits where multiple authored options sharing one actionType could unlock the wrong recovery evidence. This is the one sanctioned Stage 12A engine change this closure, explicitly authorized by the audit itself.

### RECOV-05/10/11/12 — all four closed and directly replayed
- **RECOV-05**: verifying/resuming with only the probe diagnostic flag (no intervention, no post-service evidence) is refused — `severity=UNSAFE`, service remains `HELD`, resume attempt throws `Illegal service-state transition`.
- **RECOV-10**: `ev-second-repeat-normal` now requires the exact `opt-replace-electrode` execution; after only `opt-revert-lot`, the evidence request is refused.
- **RECOV-11**: added genuine post-recalibration TSH recovery evidence tied to `opt-recalibrate-tsh`; without it, verification fails `UNSAFE`.
- **RECOV-12**: `ev-post-replacement-recovery` now requires the exact `opt-replace-light-source` execution; after `opt-redo-maintenance`, the evidence request is refused.

### Case 10 root-cause hypothesis completed
Added `hyp-electrode` (the genuine reference-junction cause), linked the relevant evidence to it, and fixed the case's own answer-leaking title.

### Case 11 causal/verification correction
`ev-tsh-cal-overdue` changed from decisive to supportive-only; removed generic "TSH is higher-stakes" framing throughout, replaced with case-specific "persistent multi-run trend vs. isolated excursion" reasoning; added genuine post-recalibration recovery evidence required for verification.

### Case 8 EQA doctrine correction
Removed wording equating a peer-group mean with "the true (peer/reference) value" — peer mean ≠ truth, and the three constructs (reference/assigned target, all-methods peer mean, method-specific peer-group mean) are never conflated.

### Genuine competency targeting
Added `competencyTargets` as a required, validated curriculum field (distinct from `prerequisiteCompetencies` and `competencyMapping`) to all 12 cases — including metadata-only additions to the 3 pilots (scientific content unchanged, reverified: `pilot-paths.test.cjs` still 39/39). Removed `case-recommender.js`'s `caseTargetsDimension() { return true; }` false-adaptivity fallback entirely; the recommender now falls through generically (never fabricating an explanation) when no case targets a given dimension.

### Authoritative difficulty ranking
Replaced the second, drifting `DIFFICULTY_RANK` copy (which used the incorrect `LEVEL_5_EXPERT_AMBIGUOUS` label) with direct indexing into the single authoritative `CASE_DIFFICULTY_LEVELS` array — a synthetic Level-5 case now correctly ranks highest, never falling through to rank 0.

### Explicit `CASE_SCHEMA_VERSION`
Added and documented as distinct from each case's own `identity.version` (content version vs. schema version).

### Privacy hardening — both APIs
- **`attempt-store.js`**: `recordAttempt()` now validates every record against a strict allowlist and **throws** (never silently strips) on any disallowed field, including `groundTruth` or any personal identifier.
- **`analytics-model.js`**: `validateEvent()` switched from an easily-bypassed small `prohibited` array to a **strict allowlist** (type + required + optional) — independently reproduced both of the audit's proven exploits (`DECISION_EXECUTED`+`email`+`staffId`, `CASE_COMPLETED`+`learnerName`+`institution`) failing validation before the fix and passing after.
- Both APIs verified via a direct adversarial matrix (7 fields each) plus confirmation that a valid representative of every one of the 10 event types still passes.

### Research-ready attempt records and operational analytics pipeline
`buildAttemptRecord()` now includes `caseSchemaVersion`, `caseFamily`, `difficulty`, `decisionEventId` in both decision and confidence summaries, a `verificationSummary`, and `executedFinalDisposition`. `projectEventsFromAttempt()` makes the 10-event schema operational — every generated event is independently re-validated before being returned; verified deterministic, `decisionEventId`-preserving, and free of any hidden ground truth or PII.

### Instructor dev view
Built `v09/dev/instructor-analytics-view.jsx` — isolated under `v09/dev/` (never imported by `app-shell.jsx`), showing aggregate attempts, competency distribution, unsupported-reasoning patterns, confidence-calibration patterns, and the mandatory disclaimer verbatim. Verified rendering in a real browser with screenshot evidence retained.

### Full 12-case title-leakage audit
Built a genuine phrase-based semantic audit (not naive substring matching) checking every title against its own case's hypothesis labels, intervention labels, and groundTruth fields for 3+ word phrase overlap, plus an outcome-presupposing-word check. This **found and fixed a second real leak** the original closure had missed: Case 10's production-facing title map had never been synced with the earlier case-identity fix, still showing "Shift Persists After First Correction." Also caught and removed "brief" (Case 7) and "ambiguous" (Case 9), both of which subtly telegraphed the case's resolution before the learner began.

### Historical evidence — restored twice
The corrective closure's own regression verification re-triggered the exact overwrite the audit first flagged (running Stage 12B/12C's browser suites as part of cross-stage regression checking writes into their evidence directories). Restored a second time from the accepted baseline, and added a permanent governance check (`stage12d-casebank-adaptive.test.js` assertion `1c`) that independently hashes all 27 frozen PNGs on every future run, so this class of regression can never again pass silently.

### Updated test totals
- `case-bank.test.cjs`: **220/220** (was 172, +48: full title-leakage audit, competencyTargets validation)
- `expanded-case-paths.test.cjs`: **27/27** (unchanged count; Cases 5/11 expert paths updated for new recovery-evidence steps)
- `adaptive-sequencing.test.cjs`: **33/33** (was 17, +16: ADAPT-TARGET-01..05, synthetic Level-5, 7 privacy adversarial replays)
- `analytics.test.cjs`: **44/44** (was 34, +10: 7 privacy adversarial replays, 3 pipeline tests)
- `scientific-numeric-audit.test.cjs`: **29/29** (new)
- `stage12d-casebank-adaptive.test.js`: **47/47** (was 40, +7)
- Real browser E2E: **17/17** (title-reference fix applied)
- Stage 12A/12B/12C baselines: all reconfirmed unchanged after two additional governance false-positives were found and fixed (both from the legitimate `dev-launcher.jsx` instructor-view change, caught by each stage's own independent diff-based governance check)

---

## Stage 12D FINAL Adaptive, Privacy, Analytics + EQA Truth Closure

A third independent audit found 16 remaining defects. All resolved.

### 1. Rule C enforcement fixed
Independently reproduced the exact violation (Level-1 weak performance recommending a Level-3 case). The recommender no longer falls back to a harder pool when no same-or-lower-difficulty targeting case exists — it recommends genuine consolidation practice (or an honest repeat, when no lateral alternative exists) with a truthful explanation, while the harder targeting case remains manually selectable.

### 2. Honest no-target-dimension behavior
A weak `DOCUMENTATION_GOVERNANCE` rating no longer produces the false "following consistently strong recent performance" message. `DOCUMENTATION_GOVERNANCE` was also added as a genuine, scientifically-justified `competencyTargets` entry on Case 8 (which centers on a `DOCUMENT` disposition).

### 3. Rule D requires repeated strong performance
Added an explicit, documented threshold (`MIN_ATTEMPTS_FOR_STRONG_PROGRESSION = 2`). One strong attempt no longer escalates difficulty; two genuinely does.

### 4-5. Deep attempt validation, validated on read
Every nested field (competencyProfile, decisionSummary, confidenceSummary, evidenceSummary, panelSummary, verificationSummary, executedFinalDisposition, recommendedLearningPriorities) now has its own keys and enum values strictly validated. All three of the audit's exact exploits (`{}`, `{attemptId:'x'}`, nested `email`/`groundTruth` inside `competencyProfile`) independently reproduced as accepted before the fix, and confirmed rejected after. `readAll()` now re-validates every stored record on read, silently dropping any that fail.

### 6. Deep analytics-event validation
Every scalar field now has its own type/enum check (not just top-level presence), and `competencyProfile` nested inside `CASE_COMPLETED` is recursively validated. All three of the audit's exact exploits reproduced-then-closed.

### 7. Confidence preservation fixed
Found the exact bug: `sequencing-model.js` dropped the real `confidence` field; `analytics-model.js` defaulted the missing value to `MODERATE`. Fixed both; verified HIGH and LOW both survive end-to-end.

### 8. Verification-event fabrication fixed
Changed the emission guard from `!= null` to strict `=== true`; verified all three scenarios (no attempt/failed/successful).

### 9. Expanded safe attempt metrics
Added `evidenceSummary.efficiencyRatio`, `panelSummary.inspectedCount` (from real `reasoningTimeline` action history), and `verificationSummary.attemptCount`/`failedAttemptCount`/`hadPrematureOrFailedAttemptBeforeSuccess`. `relevantInspectedCount`/`irrelevantInspectedCount` are documented as a known, deliberate gap — deriving them would require modifying `debrief-adapter.js`'s Stage-12C-frozen projection, which this closure does not reopen.

### 10-11. Instructor verification analytics + populated screenshot
Added aggregate verification-behavior counts (no attempt / failed / successful / failed-before-success) to `aggregateAttempts()` and the instructor view. Replaced the empty ("Total attempts: 0") screenshot with a populated one showing synthetic Learner A/B/C data with non-zero totals across every section — captured via a real, permanent browser-test checkpoint (not an ad-hoc script), which in the process found and fixed a real bug: `executedFinalDisposition` can legitimately be `null` (no disposition decision yet), which the deep validator had incorrectly rejected.

### 12. Case 8 EQA model finalized (Option A)
Removed all trueness/bias/interference/root-cause claims. Reframed as a genuine signal-explanation case: the apparent discordance is explained by comparison against the wrong peer group, not by any established mechanism. `disturbanceEstablished`/`rootCauseEstablished` both `false`; `signalExplanationEstablished` `true`.

### 13. Genuine end-to-end adaptive path test
Added a test that plays a real case through the engine, builds a real debrief projection, builds a real attempt record, records it, and calls the real recommender — verifying Rule C and genuine targeting hold through the full production pipeline, not just hand-built history objects.

### 14. Nested privacy adversarial matrix
Added direct tests for nested injection inside `competencyProfile`, `decisionSummary`, `confidenceSummary`, and `executedFinalDisposition` (attempt store), and nested injection inside `CASE_COMPLETED.competencyProfile` plus scalar-fields-supplied-as-objects (analytics events) — all confirmed rejected.

### Regression note
Fixing Rule C changed genuine, correct behavior for weak-dimension-with-only-harder-targets scenarios, which broke 5 existing tests that had unknowingly relied on the old, buggy escalation behavior when baselined from a Level-1 case. Re-baselined those tests to a Level-4 starting case so they test Rule B/targeting in isolation from Rule C, rather than weakening the new correct behavior.

### Updated test totals
`case-bank.test.cjs` **221/221**, `expanded-case-paths.test.cjs` **27/27**, `adaptive-sequencing.test.cjs` **41/41** (was 33, +8), `analytics.test.cjs` **47/47** (was 44, +3), `scientific-numeric-audit.test.cjs` **29/29**, `stage12d-casebank-adaptive.test.js` **48/48** (was 47, +1), real browser E2E **21/21** (was 17, +4, including the new populated-instructor-view checkpoint).

---

## Stage 12D FINAL ACCEPTANCE Integrity Closure

A fourth independent audit found 9 remaining integrity defects in the adaptive/privacy/analytics layer. All resolved, each independently reproduced before being fixed and reconfirmed after.

### 1. Rule D genuinely requires repeated PROFICIENT/STRONG performance
Independently reproduced: two attempts with empty `competencyProfile: []` previously satisfied the naive `attempts.length >= 2` check and triggered the false "following consistently strong recent performance" claim. Implemented `hasRepeatedStrongPerformance()`: requires the most recent 2 attempts to each contain at least one genuinely evaluated (non-null) competency, all rated PROFICIENT/STRONG. Verified all 4 required scenarios (two empty, two null-only, and one-strong-plus-one-unevaluated all correctly do NOT progress; two genuinely strong attempts correctly do). Also fixed the neutral fallback path, which had not respected any difficulty cap at all — only genuine repeated strong performance may now increase difficulty through any path.

### 2. Canonical attempt schema
`{attemptId, caseId}` previously validated successfully even though `projectEventsFromAttempt()` then failed on missing fields. All 16 fields `buildAttemptRecord()` genuinely always produces (including `caseFamily`/`difficulty`, since production always supplies them) are now required; `executedFinalDisposition` may still legitimately be `null`. Verified a real `buildAttemptRecord()` output passes and all three incompleteness scenarios fail.

### 3. Nested disposition privacy escape closed
Independently reproduced `executedFinalDisposition: { decisionEventId: { email: ... } }` validating successfully — traced to `decisionEventId` having been omitted entirely from the per-field type checks (unlike `decisionId`/`optionId`, which were already checked). Fixed and reconfirmed closed.

### 4. Cross-field verification consistency
Added all four required invariants (attempted↔attemptCount, failedAttemptCount≤attemptCount, adequate⇒attempted, hadPremature⇒attempted+failedCount>0+adequate). The audit's exact contradictory example is now rejected.

### 5. Analytics enum validation deepened
`competencyProfile[].dimension` and `difficulty` now validate against the authoritative `SCORING_DIMENSIONS`/`CASE_DIFFICULTY_LEVELS` imports rather than accepting any string. Both exact reproductions confirmed closed.

### 6. Instructor verification aggregation corrected
Independently reproduced the exact contradictory output (`attemptCount=2, failedAttemptCount=1, adequate=true` reporting "Failed verification attempts: 0"). Rewrote with explicit, unambiguous labels distinguishing attempt-counts from case-counts (`totalFailedVerificationAttempts` is a genuine sum, never confused with `casesSuccessfullyVerified`). Verified the exact reproduction case now gives correct numbers; updated the instructor view labels to match.

### 7. Evidence metric cross-consistency
Added a check that `evidenceSummary.efficiencyRatio`, when present alongside the raw counts, is arithmetically consistent with them (same rounding tolerance `buildAttemptRecord()` itself uses).

### 8. Tautological test removed
Deleted `NUM-C5-07`'s `... || true` (Option B) — the adjacent source-level check already independently verifies Case 5 makes no rule-violation claim.

### 9. Stale Level-5 test enums removed
Both remaining local `DIFFICULTY_RANK` copies (which still used the obsolete `LEVEL_5_EXPERT_AMBIGUOUS` label) were replaced with a shared helper built directly on the authoritative `CASE_DIFFICULTY_LEVELS` array.

### Regression note
Fixing the canonical-schema requirement (Item 2) broke three of the browser E2E test's own synthetic localStorage injections, which had used minimal, now-incomplete records — silently filtered out by the new read-time validation, causing cold-start behavior instead of the intended test scenario. Found via a real, permanent browser test failure (not assumed), fixed by making all injected fixtures genuinely canonical.

### Updated test totals
`case-bank.test.cjs` **221/221**, `expanded-case-paths.test.cjs` **27/27**, `adaptive-sequencing.test.cjs` **41/41**, `analytics.test.cjs` **47/47**, `scientific-numeric-audit.test.cjs` **28/28** (was 29, −1: removed tautology), `stage12d-casebank-adaptive.test.js` **48/48**, real browser E2E **21/21**.

---

## Stage 12D FINAL ACCEPTANCE MICRO-Closure

A fifth independent audit found 2 remaining integrity defects. Both resolved.

### 1. Neutral-fallback difficulty escalation closed
Independently reproduced all three violations (two empty/null/sparse Level-1 attempts each recommending Level 2) before touching code — traced to the final fallback (`unattempted`, reached once `unattemptedNotHarder` was empty) having no difficulty restriction at all. Fixed by adding two further capped fallback tiers (attempted-but-not-harder-different-family, then any-not-harder) before ever considering a harder case; a harder case is now never selected automatically anywhere in the function. Verified all 4 required scenarios directly (A/B/C correctly stay at Level 1; D correctly progresses to Level 2), plus additional checks confirming the same holds starting from Level 2/3/4.

### 2. Nested attempt structures made fully canonical
Independently reproduced `evidenceSummary: {}`, `panelSummary: {}`, `verificationSummary: {}`, `executedFinalDisposition: {}` all validating and persisting successfully. Fixed:
- **evidenceSummary**: `highValueObtainedCount`/`lowValueObtainedCount` now required; `efficiencyRatio` required (and consistency-checked) once the denominator is positive.
- **panelSummary**: `inspectedCount` required; optional fine-grained counts cross-checked (`relevantInspectedCount + irrelevantInspectedCount` cannot exceed `inspectedCount`; `selectivityRatio` consistency-checked when derivable).
- **verificationSummary**: all five fields required; added `attempted===true ⇒ attemptCount>0`, `attemptCount===0 ⇒ attempted===false`, and `failedAttemptCount>0 ⇒ attempted===true`.
- **executedFinalDisposition**: non-null values must now be the exact six-field object; `{}` no longer validates.

Verified the full required replay matrix directly: E (nested-empty rejected), F (attempted=true+attemptCount=0 rejected), G (executedFinalDisposition={} rejected), H (a real `buildAttemptRecord()` output still accepted), and I (a malformed legacy record pre-populated directly into storage is silently quarantined on read, confirming no explicit migration was needed).

### Regression found and fixed
Tightening these nested schemas broke the browser E2E test's own three synthetic instructor-view fixtures (missing the now-required `efficiencyRatio`), caught via a real, permanent browser-test failure during this closure's own verification — fixed by adding the correct, consistent ratios to each fixture, then reconfirmed 21/21.

### Updated test totals
`adaptive-sequencing.test.cjs` **53/53** (was 41, +12: 7 Rule-D fallback replays, 5 canonical nested-shape/quarantine tests). All other Stage 12D suites unchanged in count: case-bank 221/221, expanded-paths 27/27, analytics 47/47, scientific-numeric-audit 28/28, Stage 12D governance 48/48, real browser E2E 21/21.
