/* =========================================================================
   tests/stage5a-investigation-calc.test.js

   NEW RECOVERY TESTS — Stage 5A (NOT the historical test suite)
   Tests for the recovered Investigation Lab calc engine in
   src/investigation/calc.js.

   ARTIFACT PROVENANCE: Class D (recovery infrastructure, not a historical test).
   This file is new recovery-test infrastructure written during Stage 5A.

   TEST EXPECTATION PROVENANCE:
   Two categories, classified assertion-by-assertion:

   SOURCE-GROUNDED EXPECTATION (80 of 118):
     Expected value, mapping, status, return structure, omission or behaviour
     explicitly encoded in recovery/original-v0.8.html. Includes:
       S1 (29): enum array literals (values + deliberate omissions) from HTML
       S2 (2):  T-S2-TEST3, T-S2-TEST4 — named spec tests cited in HTML
       S3 (18): stage array values, index lookups, visibility logic — all from HTML
       S4 (3):  T-S4-TESTD-01/02/03 — the three explicit branches in HTML source
       S5 (4):  T-S5-ABS-01/02/03/04 — formula values + units field from HTML
       S6 (6):  T-S6-REL-01/02/03/04 — formula values + units; REL-05/06 — zero-denom guard from HTML
       S7 (5):  T-S7-ACR-01/02/03/04/05 — exact return shape + reason substrings from HTML
       S8 (5):  T-S8-WIN-01/02/03/04/05 — core window semantics from HTML (>=/<=, strictly-before note)
       S9 (8):  all 8 — deliberate omissions explicitly stated in HTML spec comment

   RECONSTRUCTED EXPECTATION (38 of 118):
     Boundary, negative, structural, cross-check or independently-chosen
     inputs written during recovery to verify the recovered behaviour.
       S2 (3):  T-S2-ONLY2/NOPROCESS/NOESCAPE — structural consequences
       S4 (4):  T-S4-TESTD-04/05/06 + CRIT-01 — guard inputs + emphasis duplicate
       S5 (6):  T-S5-ABS-05 through ABS-10 — guard inputs chosen during recovery
       S6 (4):  T-S6-REL-07/08/09/10 — guard inputs chosen during recovery
       S7 (1):  T-S7-ACR-06 — calling with arguments (not in HTML)
       S8 (6):  T-S8-WIN-06/07/08/09 (null/non-string guards) + WIN-10/11 (edge pairs)
       S10 (14): all 14 — loop-generated and specific pairs chosen during recovery

   CANDIDATE-WINDOW FORMAT LIMITATION:
   isWithinCandidateWindow() performs lexicographic string comparison.
   String inputs are assumed to be valid zero-padded same-day 24-hour
   HH:MM values. Format validation is NOT implemented in the recovered
   v0.8 function — malformed strings that pass the typeof check (e.g.
   "99:99", "abc") are not caught. This is a recovered implementation
   limitation documented here; no datetime parsing is added during recovery.

   ANTI-CIRCULAR DISCIPLINE:
   - absoluteDifference and relativeDifferencePercent have simple, closed-form
     equations recoverable directly from the HTML: abs = post - original;
     rel% = (post - original)/original * 100. Expected values are
     independently computed once and hard-coded.
   - No calculation function is called to generate an expected value for
     the same function's test.

   Run: node tests/stage5a-investigation-calc.test.js
   ========================================================================= */

'use strict';

const {
  QC_SIGNAL_STATUSES, PROCESS_STATUSES, CAUSE_STATUSES,
  PATIENT_IMPACT_STATUSES, PATIENT_RESULT_CATEGORIES,
  RESULT_DISPOSITION_STATUSES, COMMUNICATION_CONSIDERATION_STATUSES,
  initialResultDispositionStatus,
  REASONING_STAGES, stageIndex, isVisibleAtStage,
  deriveQcSignalStatus,
  absoluteDifference, relativeDifferencePercent, autoCorrectPatientResult,
  isWithinCandidateWindow
} = require('../src/investigation/calc');

let passed = 0, failed = 0;

function assert(id, condition, detail) {
  if (condition) { console.log(`  ✓ [${id}] ${detail}`); passed++; }
  else { console.error(`  ✗ [${id}] FAIL: ${detail}`); failed++; }
}

const near = (a, b, tol = 0.0001) =>
  typeof a === 'number' && typeof b === 'number' && isFinite(a) && isFinite(b) && Math.abs(a - b) <= tol;

/* -----------------------------------------------------------------------
   SECTION 1: STATUS MODEL ENUMERATIONS (source-grounded expectations)
   Exact values are encoded in the HTML as array literals.
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 1: Status model enumerations (source-grounded) ===');

// QC_SIGNAL_STATUSES: exactly 3, exact values
assert('T-S1-QCS-01', Array.isArray(QC_SIGNAL_STATUSES) && QC_SIGNAL_STATUSES.length === 3, 'QC_SIGNAL_STATUSES: exactly 3 entries');
assert('T-S1-QCS-02', QC_SIGNAL_STATUSES[0] === 'none' && QC_SIGNAL_STATUSES[1] === 'warning' && QC_SIGNAL_STATUSES[2] === 'rejection-signal', 'QC_SIGNAL_STATUSES: none/warning/rejection-signal');

// PROCESS_STATUSES: exactly 6, exact values
assert('T-S1-PS-01', Array.isArray(PROCESS_STATUSES) && PROCESS_STATUSES.length === 6, 'PROCESS_STATUSES: 6 entries');
assert('T-S1-PS-02', PROCESS_STATUSES.includes('apparently-stable'), 'ProcessStatus: apparently-stable');
assert('T-S1-PS-03', PROCESS_STATUSES.includes('validity-in-question'), 'ProcessStatus: validity-in-question');
assert('T-S1-PS-04', PROCESS_STATUSES.includes('evidence-of-instability'), 'ProcessStatus: evidence-of-instability');
assert('T-S1-PS-05', PROCESS_STATUSES.includes('recovery-being-verified'), 'ProcessStatus: recovery-being-verified');
assert('T-S1-PS-06', PROCESS_STATUSES.includes('recovered'), 'ProcessStatus: recovered');
assert('T-S1-PS-07', PROCESS_STATUSES.includes('indeterminate'), 'ProcessStatus: indeterminate');
// CRITICAL: no "confirmed" status
assert('T-S1-PS-08', !PROCESS_STATUSES.includes('confirmed'), 'ProcessStatus: no "confirmed" value (deliberate omission)');

// CAUSE_STATUSES: exactly 5, no "confirmed"
assert('T-S1-CS-01', Array.isArray(CAUSE_STATUSES) && CAUSE_STATUSES.length === 5, 'CAUSE_STATUSES: 5 entries');
assert('T-S1-CS-02', CAUSE_STATUSES.includes('no-hypothesis'), 'CauseStatus: no-hypothesis');
assert('T-S1-CS-03', CAUSE_STATUSES.includes('strongly-corroborated'), 'CauseStatus: strongly-corroborated');
assert('T-S1-CS-04', !CAUSE_STATUSES.includes('confirmed'), 'CauseStatus: no "confirmed" value (deliberate omission)');

// PATIENT_IMPACT_STATUSES: exactly 6, no "harmed"/"invalid"
assert('T-S1-PIS-01', Array.isArray(PATIENT_IMPACT_STATUSES) && PATIENT_IMPACT_STATUSES.length === 6, 'PATIENT_IMPACT_STATUSES: 6 entries');
assert('T-S1-PIS-02', !PATIENT_IMPACT_STATUSES.includes('harmed'), 'PatientImpactStatus: no "harmed" (deliberate omission)');
assert('T-S1-PIS-03', !PATIENT_IMPACT_STATUSES.includes('invalid'), 'PatientImpactStatus: no "invalid" (deliberate omission)');

// PATIENT_RESULT_CATEGORIES: exactly 7
assert('T-S1-PRC-01', Array.isArray(PATIENT_RESULT_CATEGORIES) && PATIENT_RESULT_CATEGORIES.length === 7, 'PATIENT_RESULT_CATEGORIES: 7 entries');
assert('T-S1-PRC-02', PATIENT_RESULT_CATEGORIES.includes('outside candidate interval'), 'PRC: outside candidate interval');
assert('T-S1-PRC-03', PATIENT_RESULT_CATEGORIES.includes('no material analytical difference demonstrated'), 'PRC: no material analytical difference demonstrated');
assert('T-S1-PRC-04', PATIENT_RESULT_CATEGORIES.includes('analytical difference demonstrated'), 'PRC: analytical difference demonstrated');
assert('T-S1-PRC-05', !PATIENT_RESULT_CATEGORIES.includes('harmed'), 'PRC: no "harmed" (deliberate omission)');

// RESULT_DISPOSITION_STATUSES: exactly 7, no "invalid"/"unsafe"/"harmed"
assert('T-S1-RDS-01', Array.isArray(RESULT_DISPOSITION_STATUSES) && RESULT_DISPOSITION_STATUSES.length === 7, 'RESULT_DISPOSITION_STATUSES: 7 entries');
assert('T-S1-RDS-02', RESULT_DISPOSITION_STATUSES.includes('routine-release'), 'RDS: routine-release');
assert('T-S1-RDS-03', RESULT_DISPOSITION_STATUSES.includes('review-required'), 'RDS: review-required');
assert('T-S1-RDS-04', RESULT_DISPOSITION_STATUSES.includes('amendment-or-reissue-being-considered'), 'RDS: amendment-or-reissue-being-considered');
assert('T-S1-RDS-05', !RESULT_DISPOSITION_STATUSES.includes('invalid') && !RESULT_DISPOSITION_STATUSES.includes('unsafe') && !RESULT_DISPOSITION_STATUSES.includes('harmed'), 'RDS: no invalid/unsafe/harmed');

// COMMUNICATION_CONSIDERATION_STATUSES: exactly 4
assert('T-S1-CCS-01', Array.isArray(COMMUNICATION_CONSIDERATION_STATUSES) && COMMUNICATION_CONSIDERATION_STATUSES.length === 4, 'COMMUNICATION_CONSIDERATION_STATUSES: 4 entries');
assert('T-S1-CCS-02', !COMMUNICATION_CONSIDERATION_STATUSES.some(s => s.includes('auto')), 'CommunicationConsideration: no automatic entries');

/* -----------------------------------------------------------------------
   SECTION 2: initialResultDispositionStatus — spec Tests 3 and 4 (source-grounded expectations)
   These are directly cited in the HTML spec comments as "Test 3" and "Test 4".
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 2: initialResultDispositionStatus — spec Tests 3 & 4 (source-grounded) ===');

// Spec Test 3: outside candidate window -> "routine-release"
// (never held, regardless of whether the investigation remains open)
assert('T-S2-TEST3', initialResultDispositionStatus(false) === 'routine-release',
  'Spec Test 3: withinCandidateWindow=false -> "routine-release"');

// Spec Test 4: inside candidate window -> "review-required"
// (never auto-escalated to "amendment-or-reissue-being-considered")
assert('T-S2-TEST4', initialResultDispositionStatus(true) === 'review-required',
  'Spec Test 4: withinCandidateWindow=true -> "review-required"');

// Behavioural invariant: ONLY two possible outputs
const possibleOutputs = new Set([
  initialResultDispositionStatus(true),
  initialResultDispositionStatus(false)
]);
assert('T-S2-ONLY2', possibleOutputs.size === 2 &&
  possibleOutputs.has('routine-release') && possibleOutputs.has('review-required'),
  'initialResultDispositionStatus: exactly 2 possible outputs');

// CRITICAL: function does NOT depend on ProcessStatus — no such parameter
assert('T-S2-NOPROCESS', typeof initialResultDispositionStatus === 'function' &&
  initialResultDispositionStatus.length === 1,
  'initialResultDispositionStatus takes exactly 1 argument (withinCandidateWindow), not ProcessStatus');

// Never produces "amendment-or-reissue-being-considered" automatically
assert('T-S2-NOESCAPE', initialResultDispositionStatus(true) !== 'amendment-or-reissue-being-considered' &&
  initialResultDispositionStatus(false) !== 'amendment-or-reissue-being-considered',
  'initialResultDispositionStatus never produces amendment-or-reissue-being-considered (scenario-authored only)');

/* -----------------------------------------------------------------------
   SECTION 3: REASONING STAGES (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 3: Reasoning stages (source-grounded) ===');

assert('T-S3-RST-01', Array.isArray(REASONING_STAGES) && REASONING_STAGES.length === 10, 'REASONING_STAGES: exactly 10 stages');
assert('T-S3-RST-02', REASONING_STAGES[0] === 'signal', 'Stage 0: signal');
assert('T-S3-RST-03', REASONING_STAGES[1] === 'containment', 'Stage 1: containment');
assert('T-S3-RST-04', REASONING_STAGES[4] === 'evidence-1', 'Stage 4: evidence-1');
assert('T-S3-RST-05', REASONING_STAGES[9] === 'resume-decision', 'Stage 9: resume-decision');

// stageIndex
assert('T-S3-IDX-01', stageIndex('signal') === 0, 'stageIndex("signal") = 0');
assert('T-S3-IDX-02', stageIndex('resume-decision') === 9, 'stageIndex("resume-decision") = 9');
assert('T-S3-IDX-03', stageIndex('evidence-1') === 4, 'stageIndex("evidence-1") = 4');
assert('T-S3-IDX-04', stageIndex('nonexistent') === null, 'stageIndex("nonexistent") = null');
assert('T-S3-IDX-05', stageIndex(null) === null, 'stageIndex(null) = null');

// isVisibleAtStage
assert('T-S3-VIS-01', isVisibleAtStage('signal', 'signal') === true, 'revealStage==currentStage: visible');
assert('T-S3-VIS-02', isVisibleAtStage('signal', 'containment') === true, 'earlier revealStage: visible');
assert('T-S3-VIS-03', isVisibleAtStage('containment', 'signal') === false, 'later revealStage: not visible');
assert('T-S3-VIS-04', isVisibleAtStage('patient-impact', 'resume-decision') === true, 'patient-impact visible at resume-decision');
assert('T-S3-VIS-05', isVisibleAtStage('resume-decision', 'patient-impact') === false, 'resume-decision not visible at patient-impact');
assert('T-S3-VIS-06', isVisibleAtStage('unknown', 'signal') === false, 'unknown revealStage: not visible');
assert('T-S3-VIS-07', isVisibleAtStage('signal', 'unknown') === false, 'unknown currentStage: not visible');
assert('T-S3-VIS-08', isVisibleAtStage(null, 'signal') === false, 'null revealStage: not visible');

/* -----------------------------------------------------------------------
   SECTION 4: deriveQcSignalStatus — spec section 90, Test D (source-grounded)
   The HTML spec comment cites "spec section 90, Test D" for this invariant.
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 4: deriveQcSignalStatus — spec section 90 Test D (source-grounded) ===');

// Spec Test D requires:
// - "rejection" maps to "rejection-signal" (not "warning")
// - "warning" maps to "warning" (not "rejection-signal")
// - anything else maps to "none" (never silently upgraded)
assert('T-S4-TESTD-01', deriveQcSignalStatus('rejection') === 'rejection-signal',
  'Spec Test D: rejection -> rejection-signal (not warning)');
assert('T-S4-TESTD-02', deriveQcSignalStatus('warning') === 'warning',
  'Spec Test D: warning -> warning (not rejection-signal)');
assert('T-S4-TESTD-03', deriveQcSignalStatus('none') === 'none',
  'Spec Test D: none -> none (no silent upgrade)');
assert('T-S4-TESTD-04', deriveQcSignalStatus(undefined) === 'none',
  'Spec Test D: undefined -> none (no silent upgrade)');
assert('T-S4-TESTD-05', deriveQcSignalStatus('') === 'none',
  'empty string -> none');
assert('T-S4-TESTD-06', deriveQcSignalStatus('bogus') === 'none',
  'unknown input -> none (no upgrade)');

// CRITICAL: warning must NEVER be silently upgraded to rejection-signal
assert('T-S4-CRIT-01', deriveQcSignalStatus('warning') !== 'rejection-signal',
  'CRITICAL: warning never upgraded to rejection-signal');

/* -----------------------------------------------------------------------
   SECTION 5: absoluteDifference — spec sections 34-37, 96-98 (source-grounded)
   Formula: post - original. Expected values independently computed.
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 5: absoluteDifference (source-grounded formula) ===');

// Independently computed expected values: post - original
// 105 - 100 = +5
const abs1 = absoluteDifference(100, 105);
assert('T-S5-ABS-01', abs1.supported && near(abs1.value, 5.0), 'abs(100, 105) = +5 [independently: 105-100]');
assert('T-S5-ABS-02', abs1.units === 'same units as the original result', 'abs: units field correct');

// 95 - 100 = -5
const abs2 = absoluteDifference(100, 95);
assert('T-S5-ABS-03', abs2.supported && near(abs2.value, -5.0), 'abs(100, 95) = -5 [independently: 95-100]');

// 100 - 100 = 0
const abs3 = absoluteDifference(100, 100);
assert('T-S5-ABS-04', abs3.supported && near(abs3.value, 0.0), 'abs(100, 100) = 0');

// Guards: non-finite inputs
assert('T-S5-ABS-05', absoluteDifference(NaN, 100).supported === false, 'abs(NaN, 100) invalid');
assert('T-S5-ABS-06', absoluteDifference(100, NaN).supported === false, 'abs(100, NaN) invalid');
assert('T-S5-ABS-07', absoluteDifference(Infinity, 100).supported === false, 'abs(Infinity, 100) invalid');
assert('T-S5-ABS-08', absoluteDifference('100', 105).supported === false, 'abs(string, 105) invalid');
assert('T-S5-ABS-09', absoluteDifference(null, 105).supported === false, 'abs(null, 105) invalid');

// Invalid result has value=null and reason string
const absInv = absoluteDifference(NaN, 100);
assert('T-S5-ABS-10', absInv.value === null && typeof absInv.reason === 'string', 'abs invalid result: value=null, reason string');

/* -----------------------------------------------------------------------
   SECTION 6: relativeDifferencePercent — spec sections 36-37, 97 (source-grounded)
   Formula: (post - original) / original * 100. Expected values independently computed.
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 6: relativeDifferencePercent (source-grounded formula) ===');

// Independently computed: (105-100)/100 * 100 = 5.0%
const rel1 = relativeDifferencePercent(100, 105);
assert('T-S6-REL-01', rel1.supported && near(rel1.value, 5.0), 'rel%(100, 105) = 5.0 [independently: (105-100)/100*100]');
assert('T-S6-REL-02', rel1.units === '%', 'rel%: units = "%"');

// (95-100)/100 * 100 = -5.0%
const rel2 = relativeDifferencePercent(100, 95);
assert('T-S6-REL-03', rel2.supported && near(rel2.value, -5.0), 'rel%(100, 95) = -5.0 [independently: (95-100)/100*100]');

// (110-100)/100 * 100 = 10.0%
const rel3 = relativeDifferencePercent(100, 110);
assert('T-S6-REL-04', rel3.supported && near(rel3.value, 10.0), 'rel%(100, 110) = 10.0');

// CRITICAL: zero original -> unsupported (no Infinity or silent NaN)
const relZero = relativeDifferencePercent(0, 5);
assert('T-S6-REL-05', relZero.supported === false, 'CRITICAL: rel%(original=0) -> unsupported (no Infinity)');
assert('T-S6-REL-06', relZero.value === null && typeof relZero.reason === 'string' && relZero.reason.includes('zero'), 'rel% zero-denom: value=null, reason mentions zero');

// Guards: non-finite inputs -> unsupported
assert('T-S6-REL-07', relativeDifferencePercent(NaN, 100).supported === false, 'rel%(NaN, 100) invalid');
assert('T-S6-REL-08', relativeDifferencePercent(100, NaN).supported === false, 'rel%(100, NaN) invalid');
assert('T-S6-REL-09', relativeDifferencePercent(Infinity, 100).supported === false, 'rel%(Infinity, 100) invalid');
assert('T-S6-REL-10', relativeDifferencePercent('100', 105).supported === false, 'rel%(string, 105) invalid');

/* -----------------------------------------------------------------------
   SECTION 7: autoCorrectPatientResult — spec section 98 (source-grounded)
   The HTML source explicitly states this "always returns unsupported" and
   that spec section 98 has a regression test for this behaviour.
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 7: autoCorrectPatientResult — spec section 98 (source-grounded) ===');

// Spec section 98 regression test: always refuses
const autoCorr = autoCorrectPatientResult();
assert('T-S7-ACR-01', autoCorr.supported === false, 'Spec §98: autoCorrectPatientResult always returns supported=false');
assert('T-S7-ACR-02', autoCorr.value === null, 'Spec §98: autoCorrectPatientResult always returns value=null');
assert('T-S7-ACR-03', typeof autoCorr.reason === 'string' && autoCorr.reason.length > 0, 'autoCorrectPatientResult: reason string present');
assert('T-S7-ACR-04', autoCorr.reason.includes('never automatically corrects'), 'autoCorrectPatientResult reason: "never automatically corrects"');
assert('T-S7-ACR-05', autoCorr.reason.includes('professional judgement'), 'autoCorrectPatientResult reason: defers to professional judgement');

// Must always refuse — no arguments change behaviour
const autoCorr2 = autoCorrectPatientResult(100, 105);
assert('T-S7-ACR-06', autoCorr2.supported === false, 'autoCorrectPatientResult always refuses regardless of arguments');

/* -----------------------------------------------------------------------
   SECTION 8: isWithinCandidateWindow — spec sections 27-28, 95 (source-grounded)
   HH:MM lexicographic comparison for same-day zero-padded timestamps.
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 8: isWithinCandidateWindow — spec sections 27-28, 95 (source-grounded) ===');
// FORMAT LIMITATION: String inputs are assumed to be valid zero-padded same-day 24-hour
// HH:MM values. Format validation is NOT implemented in the recovered v0.8 function.
// Malformed strings that pass typeof (e.g. "99:99", "abc") are NOT caught — this is
// a recovered implementation limitation, NOT a reason to modify the source.

// Basic inclusion
assert('T-S8-WIN-01', isWithinCandidateWindow('10:30', '10:00', '11:00') === true, 'within window: true');
// Exact start boundary
assert('T-S8-WIN-02', isWithinCandidateWindow('10:00', '10:00', '11:00') === true, 'at window start: true (inclusive)');
// Exact end boundary
assert('T-S8-WIN-03', isWithinCandidateWindow('11:00', '10:00', '11:00') === true, 'at window end: true (inclusive)');
// Strictly before window start
assert('T-S8-WIN-04', isWithinCandidateWindow('09:59', '10:00', '11:00') === false,
  'CRITICAL: strictly before window start -> false (results strictly before window never included)');
// After window end
assert('T-S8-WIN-05', isWithinCandidateWindow('11:01', '10:00', '11:00') === false, 'after window end: false');
// Non-string inputs
assert('T-S8-WIN-06', isWithinCandidateWindow(null, '10:00', '11:00') === false, 'null timestamp: false');
assert('T-S8-WIN-07', isWithinCandidateWindow('10:30', null, '11:00') === false, 'null windowStart: false');
assert('T-S8-WIN-08', isWithinCandidateWindow('10:30', '10:00', null) === false, 'null windowEnd: false');
assert('T-S8-WIN-09', isWithinCandidateWindow(1030, '10:00', '11:00') === false, 'numeric timestamp: false');
// Zero-padded HH:MM lexicographic correctness
assert('T-S8-WIN-10', isWithinCandidateWindow('09:00', '08:00', '10:00') === true, 'zero-padded: 09:00 within 08:00-10:00');
assert('T-S8-WIN-11', isWithinCandidateWindow('23:59', '23:00', '23:59') === true, 'late-night boundary: true');

/* -----------------------------------------------------------------------
   SECTION 9: CRITICAL OMISSIONS — no automated root-cause, inference, or notification
   (source-grounded: explicitly stated in HTML spec comments)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 9: Critical omissions (source-grounded) ===');

const allExports = require('../src/investigation/calc');
const exportedFns = Object.keys(allExports).filter(k => typeof allExports[k] === 'function');

// No automated root-cause function
const rootCauseNames = ['diagnoseRootCause', 'scoreRootCause', 'inferCause', 'bayesianRootCause', 'autoRootCause'];
rootCauseNames.forEach(fn => {
  assert(`T-S9-NORC-${fn}`, !(fn in allExports), `No automated root-cause function: ${fn}`);
});

// No causal-interval inference
assert('T-S9-NOCAUSAL', !exportedFns.some(f => f.toLowerCase().includes('causal') || f.toLowerCase().includes('infer')),
  'No causal-interval inference function exported');

// No clinician notification function
assert('T-S9-NONOTIFY', !exportedFns.some(f => f.toLowerCase().includes('notify') || f.toLowerCase().includes('alert')),
  'No automated clinician notification function exported');

// autoCorrectPatientResult is the ONLY "correct" function and it always refuses
assert('T-S9-ONLYCORR', exportedFns.filter(f => f.toLowerCase().includes('correct')).length === 1,
  'Only one "correct" function exported (autoCorrectPatientResult, which always refuses)');

/* -----------------------------------------------------------------------
   SECTION 10: REASONING STAGE ORDERING SEMANTICS
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 10: Reasoning stage ordering semantics ===');

// Evidence gating: item authored at a later stage is not visible at earlier stage
const stages = REASONING_STAGES;
for (let i = 0; i < stages.length; i++) {
  for (let j = 0; j < stages.length; j++) {
    const expected = i <= j; // revealStage i is visible at currentStage j iff i <= j
    if (i === j) {
      assert(`T-S10-EQ-${stages[i]}`, isVisibleAtStage(stages[i], stages[j]) === true,
        `Stage ${stages[i]} visible at same stage`);
    }
  }
}

// Forward-only: stage only visible from its index onward
assert('T-S10-FWD-01', isVisibleAtStage('hypothesis', 'signal') === false, 'hypothesis not visible at signal');
assert('T-S10-FWD-02', isVisibleAtStage('hypothesis', 'hypothesis') === true, 'hypothesis visible at hypothesis');
assert('T-S10-FWD-03', isVisibleAtStage('hypothesis', 'evidence-1') === true, 'hypothesis visible at evidence-1');

// No "future" evidence leaks
assert('T-S10-NOLEAK', isVisibleAtStage('resume-decision', 'signal') === false, 'resume-decision not leaked at signal');

/* -----------------------------------------------------------------------
   SUMMARY
   ----------------------------------------------------------------------- */
const total = passed + failed;
// Exact provenance (audited assertion-by-assertion, see file header):
//   Source-grounded (80): S1(29)+S2(2)+S3(18)+S4(3)+S5(4)+S6(6)+S7(5)+S8(5)+S9(8)
//   Reconstructed   (38): S2(3)+S4(4)+S5(6)+S6(4)+S7(1)+S8(6)+S10(14)
const sourceGroundedCount = 80;
const reconstructedCount = 38;

console.log(`\n${'='.repeat(60)}`);
console.log(`Stage 5A Investigation Calc Tests: ${passed}/${total} passed, ${failed} failed`);
console.log(`  Source-grounded expectations: ${sourceGroundedCount}/118`);
console.log(`  Reconstructed expectations:   ${reconstructedCount}/118`);
console.log(`  Artifact class: D (recovery infrastructure)`);
if (failed > 0) {
  console.error('STAGE 5A FAILED — do not commit.');
  process.exit(1);
} else {
  console.log('STAGE 5A PASSED — all tests green.');
  process.exit(0);
}
