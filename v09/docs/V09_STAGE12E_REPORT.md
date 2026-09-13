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
