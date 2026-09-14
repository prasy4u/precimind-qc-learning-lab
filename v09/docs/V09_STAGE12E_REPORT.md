# PreciMind QC Learning Lab v0.9 — Stage 12E Report

## Instructor Workflow + Educational Research Instrumentation + Release-Candidate Hardening

### A. Stage 12E scope
Stage 12E concerns three tightly bounded purposes: (1) an instructor
workflow built on the already-accepted local analytics foundation, (2)
reproducible, anonymous educational-research instrumentation (a metric
registry, denominator governance, and a safe local export), and (3)
release-candidate hardening (storage resilience, deeper privacy
testing, and governance documentation). It is explicitly **not** a new
learning-engine stage.

### B. Frozen scientific boundary
Stage 12A through Stage 12D scientific/runtime semantics were **not**
redesigned. Verified directly via `git diff` against the accepted
Stage 12D FINAL ACCEPTANCE MICRO-closure baseline
(`27e0a751a72ccfcf2c3878c4a917b2c2c3ac2c60`): zero changes to
`engine.js`, `case-schema.js`, `case-validator.js`, `states.js`,
`decision-model.js`, `evidence-model.js`, `debrief-model.js`,
`scoring-model.js`, `debrief-adapter.js`, or any of the 12 case files.
The Morning QC state model, evidence gating, hypothesis state, decision-
option-specific evidence provenance, `decisionEventId` linkage,
confidence/calibration doctrine, adaptive sequencing rules (Rule A-D),
difficulty ranking, and all 12 case scientific resolutions are
unchanged.

### C. Instructor workspace
Extended the existing dev-only `InstructorAnalyticsView` (isolated
under `v09/dev/`, reachable only through the isolated `DevLauncher` —
never imported by production `app-shell.jsx`) with: a dataset-overview
section (valid/quarantined counts, cases represented), denominator-
explicit displays for unsupported-decision rate and confidence
calibration (both showing their real eligible-count denominator
alongside the percentage), an evidence-acquisition-behavior section
(efficiency ratio excluding zero-evidence attempts from its
denominator, explicitly captioned that more panels is not inherently
better), an educational-research export button, and a "Load synthetic
fixtures (demo)" control for exercising the workspace with a
deterministic, clearly-labeled-as-synthetic cohort. The mandatory
disclaimer and an explicit no-ranking/no-certification statement are
both rendered, not merely documented.

### D. Metric/denominator registry
`app/morning-qc/research/metric-registry.js`: 10 formally defined
metrics, each with `metricId`, `displayName`, `definition`, `numerator`,
`denominator`, `eligibilityCriteria`, `exclusions`,
`missingDataHandling`, `sourceFields`, `interpretation`, and
`nonInterpretation`. `safeRatio(numerator, denominator)` returns `null`
(never `0` or `NaN`) for a zero-eligible denominator;
`formatRatioForDisplay()` renders `null` as "Not applicable (no eligible
data)", never "0%". `app/morning-qc/research/instructor-metrics.js`
(`computeInstructorMetrics()`) derives every displayed proportion from
this registry's denominator doctrine — competency distributions use the
count of attempts where THAT dimension was genuinely evaluated (never
total attempts); confidence calibration uses the count of decisions
where confidence was genuinely recorded (never coerced from missing);
evidence efficiency excludes attempts that obtained zero evidence
entirely from its denominator (correct inaction is not penalized);
verification metrics keep attempt-sums and case-counts as explicitly
distinct fields.

### E. Educational research export
`app/morning-qc/research/research-export.js`
(`buildResearchExportBundle()`): re-validates every stored record
independently before export (never trusting a prior filter), producing
`attempts.csv`, `events.csv` (preserving `decisionEventId` for
linkage), `metric_dictionary.json` (the full registry), a
`dataset_manifest.json` (all schema versions, valid/excluded counts,
synthetic-data flag), and a `README.md`. Uses only an anonymous,
per-export `rowKey` (`row-0001`, ...) for linkage — never any identity-
derived key. Verified to contain no PII pattern (`groundTruth`,
`learnerName`, `email`, `staffId`, `institution`, `deviceId`,
`ipAddress`, etc.) and to be fully deterministic (identical input
produces byte-identical CSV output).

### F. Synthetic cohort fixtures
`app/morning-qc/research/synthetic-fixtures.js`
(`buildSyntheticCohort()`): 10 deterministic, canonical-schema-valid
records (verified against the real `validateAttemptRecord()`) plus one
deliberately malformed fixture for quarantine testing. Covers: STRONG/
DEVELOPING/NEEDS_IMPROVEMENT performance, an overconfident-unsupported
decision, an appropriately-cautious low-confidence decision, no-
verification / failed-then-successful-verification patterns, evidence-
efficient and low-value-heavy acquisition, an attempt with zero
evaluated competencies, a decision with no confidence recorded at all,
and a two-attempt same-learner sequence sufficient for genuine Rule D
progression. Always explicitly labeled synthetic wherever surfaced in
the UI or export.

### G. Privacy
Extended the already-strict `validateAttemptRecord()` allowlist with
direct adversarial tests for 14 forbidden identity-adjacent keys
(`name`, `learnerName`, `email`, `staffId`, `employeeId`, `institution`,
`hospital`, `patientId`, `patientName`, `MRN`, `IP`, `ipAddress`,
`deviceId`, `fingerprint`), each tested both as a shallow top-level
field AND nested inside `executedFinalDisposition` and
`competencyProfile` entries — all confirmed rejected. The research
export module was independently verified to emit none of these patterns
in any generated file.

### H. Local-data management
"Load synthetic fixtures (demo)" and "Clear learning history" controls
added to the instructor workspace (dev-only). The main learner-facing
reset control (with explicit confirmation) was already accepted in
Stage 12D and is unchanged. No general learner-facing arbitrary-data
import was added (Section 17 doctrine) — fixture loading is a narrow,
developer-triggered demonstration feature only.

### I. Storage robustness
New test suite (`stage12e-storage-robustness.test.cjs`) verifies safe
(non-throwing, correctly-quarantining) behavior for: a missing storage
entry, an empty string, malformed JSON, a non-array JSON value, an
array of nulls, an array of non-object entries, a mixed valid/
malformed/null/garbage array, and duplicate attempt IDs — none of these
crash the application or corrupt engine behavior.

### J. Real-browser QA
New dedicated `tests/browser/evidence/stage12e/` directory (never
overwriting Stage 12B/12C historical evidence). Verified in a real
Chromium instance: the instructor workspace loads in its empty state,
"Load synthetic fixtures" populates a genuinely non-zero, correctly-
denominated dataset overview and evidence-use section, the export
button triggers a real browser file download (`attempts.csv` and
others), and "Clear learning history" correctly returns the workspace
to its empty state.

### K. Production integrity
Verified directly (not assumed): production navigation remains exactly
**14** destinations; Morning QC remains labeled **CAPSTONE** (never
QC-13); `app-shell.jsx` never references an instructor view or the
research module; no network/remote-URL reference exists anywhere in the
new Stage 12E modules.

### L. Testing
`research.test.cjs`: **59/59**. `stage12e-storage-robustness.test.cjs`:
**52/52**. `stage12e-research-instrumentation.test.js` (governance):
**13/13**. All prior Stage 12A-12D suites reconfirmed passing unchanged.

### M. Release-candidate status
This delivery is a **Stage 12E release-candidate candidate** — not a
tagged v0.9 release. No release tag was created. Formal RC acceptance
occurs only after independent audit.

### N. Known limitations / not completed this stage
Given the scope of Stage 12E's full specification, this delivery
prioritizes the core, independently-testable instrumentation (metric
registry, denominator governance, export, fixtures, privacy, storage
robustness, and the essential instructor-workspace UI). Not
implemented in this pass: multi-browser-engine QA (Firefox/WebKit —
only Chromium was available and tested), a full WCAG accessibility
audit pass, and the complete standalone README/release-checklist
documents beyond this report. These are explicitly documented here as
deferred rather than silently omitted, per Section 39's requirement to
report accurately rather than fabricate completion.

---

## Stage 12E CORRECTIVE CLOSURE

An independent audit of the actually-delivered repository ZIP found 13
defects. All resolved, each independently reproduced before being
fixed and reconfirmed after. **Documentation correction**: Section L
above stated the governance suite was 13/13 at the time of the first
delivery; after this closure's additions the actual, current total is
**22/22** (see Section 5 below) — the original count is left in place
above as an accurate historical record of that delivery, corrected
here rather than silently edited.

### 1. Raw-storage/quarantine truth boundary (CRITICAL)
Independently reproduced the exact gap: 2 raw stored records (1
canonical + 1 malformed), `listAttempts()` correctly returned 1, but
the export manifest reported `excludedRecordCount: 0` because it only
ever saw the already-filtered array. Added a narrow, read-only
`inspectStoredAttempts()` to `attempt-store.js` (the one narrowly
justified Stage 12D-frozen-interface addition this closure makes) that
returns `{totalEncountered, validAttemptCount, quarantinedCount,
validRecords}` without changing `listAttempts()`/`getAttemptHistory()`/
`recordAttempt()` semantics at all, and without ever exposing quarantined
record CONTENT. Verified the exact required scenario now gives
`validAttemptCount=1, quarantinedCount=1` in both the export manifest
and the instructor UI.

### 2. Canonical event export (CRITICAL)
The prior export reconstructed decision rows independently and merged
confidence into them via `Object.fromEntries()`, which silently
collapsed duplicate `confidenceSummary` entries for the same
`decisionEventId`. Replaced entirely with the accepted
`projectEventsFromAttempt()` as the sole event source, exported as
`events.jsonl` (one JSON object per line, preserving the genuinely
heterogeneous event schema) with only an added `rowKey` for linkage —
no canonical event field is altered. Verified event-sequence parity
against `projectEventsFromAttempt()` for all 10 synthetic fixtures, and
directly reproduced-then-fixed the duplicate-confidence adversarial
case (both HIGH and LOW confidence events for the same decisionEventId
now survive export).

### 3. Non-destructive synthetic fixtures (CRITICAL)
Independently reproduced the exact defect: "Load synthetic fixtures"
called `resetHistory()` then wrote synthetic records into the REAL
canonical storage key — a single click could erase genuine local
learner history. Redesigned entirely: the synthetic cohort is now held
solely in React component state (`useMemo`, deterministic), never
read from or written to `localStorage` under any circumstance. A
prominent "SYNTHETIC DEMONSTRATION DATA" banner is shown throughout
demo mode. Verified end-to-end in a real browser with a sentinel real
attempt: the sentinel's storage value is confirmed **byte-for-byte
identical** before entering demo mode, while demo mode is active, and
after exiting demo mode.

### 4. Reset safety
The dev-only "Clear learning history" control had no confirmation at
all. Given equivalent explicit, cancelable confirmation semantics to
the accepted production reset (`window.confirm`, stating the action is
permanent and irreversible). Verified directly: cancelling leaves
history completely intact; confirming clears exactly the intended key.

### 5. Competency export + data dictionary
Added `competencies.csv` (long-form: `rowKey, dimension, rating`, one
row per attempt×evaluated-dimension pair) so unevaluated (blank) ratings
remain distinguishable from `NEEDS_IMPROVEMENT`. Added
`data-dictionary.js`/`data_dictionary.json` documenting every exported
field's type, nullability, allowed values, source, level, meaning,
interpretation, and limitations — verified via a governance test that
every column actually emitted by `attempts.csv`/`competencies.csv` has
a corresponding dictionary entry.

### 6. Privacy-minimised time fields
`attempts.csv` no longer exports exact `startedAt`/`completedAt` epoch
timestamps by default (a quasi-identifier risk when combined with
external schedules/logs) — exports `attemptOrdinal` and `durationMs`
instead. The manifest documents this policy explicitly
(`timingFieldsPolicy`).

### 7-8. Completed denominator-governed instructor analytics
Added a full per-case summary (attempt count, family, difficulty) and
a complete denominator-governed competency-distribution display
(evaluated/not-evaluated counts plus all 4 rating proportions, each
using that dimension's own evaluated count as denominator) as the
PRIMARY competency view, with the prior "Common Low-Rated
Competencies" list retained underneath as a supplementary summary —
verified rendering correctly in a real browser.

### 9. Export-delivery robustness
Replaced the prior "click once, several silent downloads happen"
design with an explicit two-step flow: "Prepare research export"
computes the bundle, then a real, individually-clickable download
button is rendered for each of the 7 generated files. Verified all 7
files are individually downloadable with the correct filename in a
real browser.

### 10. Deferred documentation completed
Added `V09_README.md` (how to run, Morning QC, local history, privacy,
instructor workspace, synthetic demo, research export, limitations) and
`V09_STAGE12E_RELEASE_CHECKLIST.md` (with unperformed items honestly
left unchecked — full cross-browser QA and a formal WCAG audit were not
performed and are marked as such, not fabricated).

### 11. Targeted accessibility closure
A focused source- and browser-verified pass over the NEW Stage 12E
controls only (heading hierarchy, `role="status"`/`role="alert"`,
`aria-labelledby`, explicit `type="button"`, real button text content,
no horizontal overflow at any tested viewport) — not a broad redesign,
and not a claim of full WCAG conformance.

### Updated Stage 12E test totals
`research.test.cjs`: **140/140** (was 59, +81: raw-storage/quarantine
truth, event-parity for all 10 fixtures, duplicate-confidence
adversarial replay, competency-export/data-dictionary governance,
privacy-minimised-timing checks). `stage12e-storage-robustness.test.cjs`:
**52/52** (unchanged). `stage12e-research-instrumentation.test.js`
(governance): **22/22** (was 13, +9: accessibility audit). Real browser
E2E (rewritten, evidence moved to a new `stage12e-corrective`
directory): **24/24**.

---

## Stage 12E FINAL MICRO-CLOSURE

A sixth independent audit found 5 remaining defects (2 substantive gaps, plus documentation/test completeness items). All addressed.

### 1. Complete per-case denominator-governed analytics
The prior `caseLevelSummary` reduced each case to `{attemptCount, caseFamily, difficulty}` only — metadata, not the denominator-governed per-case analytics the corrective specification required. Refactored `instructor-metrics.js` to extract a single shared `computeAggregateMetrics()` function (final disposition, decision quality, confidence calibration, evidence use, verification behavior — all denominator-governed exactly as at the dataset level) and apply it identically per-case, so per-case and dataset-level metrics can never drift from separate definitions. Verified every case's summary includes all 8 required sections, and that summing per-case totals reproduces the dataset-level totals exactly (no double-counting or omission). Rendered in the instructor UI as the primary per-case view, verified in a real browser.

### 2. Field-complete research data dictionary
Replaced the generic `"(other canonical event fields)"` placeholder with an individual dictionary entry for every field genuinely allowed by `EVENT_FIELD_SCHEMA` (16 distinct fields across all 10 event types, plus the export-added `rowKey` and `type`), and added entries for the 3 new manifest fields (`dataDictionaryVersion`, `malformedContainer`, `recordCountsReliable`). Strengthened governance with a test that programmatically verifies every field actually emitted by `attempts.csv`, `competencies.csv`, every field in `EVENT_FIELD_SCHEMA`, and every field in the manifest has a corresponding dictionary entry — the test fails if any exported field lacks documentation.

### 3. Truthful malformed-container propagation
Independently reproduced the exact gap: `inspectStoredAttempts()` already correctly computed `malformedContainer: true` for corrupted storage, but `buildResearchExportBundle()` never surfaced it, making malformed JSON indistinguishable from a clean empty dataset (both showed `excludedRecordCount: 0`). Fixed: the manifest now includes `malformedContainer`/`recordCountsReliable`, and `excludedRecordCount` is `null` (never a fabricated `0`) whenever the raw container itself could not be parsed. Verified all 5 required scenarios (no entry, clean empty array, one valid + one invalid, malformed JSON, valid-but-non-array) are correctly and mutually distinguishable. The instructor UI now shows an explicit "Storage container status: VALID / MALFORMED" line and "Unknown (storage container unreadable)" instead of a fabricated zero.

### 4. Dataset overview completion
Added attempt-record/case schema version, analytics schema version, metric-definition version, and data-dictionary version to the dataset overview, plus a privacy-minimised temporal summary (attempt-ordinal span and duration-range — never an exact wall-clock date range, and never computed internally merely to discard it).

### 5. Accessibility/download-content test gaps closed
Added a dedicated browser test verifying keyboard reachability and operability (Tab/Enter) for the demo toggle, prepare-export button, individual file-download buttons, and the clear-history control including a keyboard-triggered cancel; mobile touch-target practicality and no-overflow at 390×844 with per-case analytics populated; and — critically — genuine CONTENT verification for all 7 downloaded files (parsed and checked against expected structure/values), not merely correct filenames as the prior closure's test had done.

### 6. Documentation consistency
Corrected the stale `V09_STAGE12E_ANALYTICS_SCHEMA` reference in `V09_README.md` to point to the actual accepted `V09_STAGE12D_ANALYTICS_SCHEMA.md`.

### Updated test totals
`research.test.cjs` **213/213** (was 140, +73: malformed-container A-E scenarios, per-case analytics completeness/consistency, complete event-field and manifest-field dictionary-coverage governance). Real browser E2E (new `stage12e-final-micro-closure` evidence directory): **24/24** (per-case UI rendering, malformed-container UI truth, keyboard reachability/operability, mobile touch targets, and full 7-file content verification).

Note: this session recovered from an environment reset partway through implementation, by re-extracting the prior corrective-closure delivery ZIP and independently re-verifying its Git state (branch, HEAD, commit count, clean tree) matched the expected starting baseline exactly before redoing the in-progress work.

---

## Stage 12E FINAL PRIVACY/GOVERNANCE MICRO-PATCH

A seventh, narrowly-scoped independent audit found 4 remaining gaps, all acceptance-blocking or governance-relevant. All resolved.

### 1. Exact timestamp leakage from events.jsonl (acceptance-blocking)
Independently reproduced the exact defect: `events.jsonl` used the raw output of `projectEventsFromAttempt(record)`, whose `timestamp` field is a genuine epoch-millisecond value derived from `record.startedAt`/`completedAt` — contradicting the documented "no exact timestamps" policy. Fixed strictly at the research-export layer (`projectEventsFromAttempt()` itself untouched — verified via `git diff`): every event's absolute `timestamp` is replaced with `relativeTimestampMs` (timestamp minus that attempt's own `startedAt`) after canonical projection. Verified with the exact required adversarial test (realistic epoch values `1789365600000`/`1789365660000`): neither appears anywhere in the default export bundle, and the relative timing is correct (`CASE_STARTED` → 0, `CASE_COMPLETED` → the full 60000ms duration) — confirmed both at the module level and via genuinely downloaded browser content. `EXPORT_SCHEMA_VERSION` bumped to `2.2.0`, `DATA_DICTIONARY_VERSION` to `2.1.0`. Documentation (manifest `timingFieldsPolicy`, README, this report) now describes exported events as "canonical Stage 12D analytics events with a deterministic, privacy-minimised timing projection" — never as byte-identical, since the timing field is deliberately transformed.

### 2. Privacy scan typo fixed
Found the exact bug: the export privacy scan referenced `bundle.eventsCsv`, a field that has never existed (the real field is `eventsJsonl`) — the scan silently concatenated `undefined` and never actually inspected any event content. Fixed to scan all 7 export outputs; added an explicit test proving `events.jsonl` genuinely participates.

### 3. Export schema version added to Dataset Overview
`EXPORT_SCHEMA_VERSION` is now imported and rendered in the instructor Dataset Overview alongside the other version fields, verified via both source-level and browser-level checks.

### 4. Metric-registry and accessibility evidence gaps closed
Added a full `appropriate_disposition_rate` metric definition (the rate the UI already displayed had no backing registry entry). Replaced the prior `.focus()`-only keyboard test with genuine `page.keyboard.press('Tab')` traversal from a known starting point, verifying the demo toggle, prepare-export button, and clear-history control are all reached in sensible order, that Tab+Enter genuinely activates controls (including the first file-download button), that `:focus-visible` produces a measurably real outline (`outlineStyle: solid, outlineWidth: 2px`), and that all 9 Stage 12E buttons meet the existing `.mqc-btn` ≥44px min-height touch-target contract.

### Updated test totals
`research.test.cjs` **242/242** (was 213 before this micro-patch's Item 1/2 fixes — the prior `EVENT-PARITY` test was restructured into separate count/sequence-non-timing/timing-transform assertions per event, and new tests were added for the privacy-scan participation proof and the realistic-epoch adversarial scenario). Stage 12E governance **26/26** (was 23, +3: new evidence-directory and export-schema-version checks). New dedicated browser E2E (`stage12e-privacy-governance-patch`): **14/14**.
