/* =========================================================================
   v09/tests/morning-qc/pilot-paths.test.cjs

   Morning QC Room — Stage 12A Pilot Path Tests
   PROVENANCE: V09_TEST

   For each of the 3 pilot cases, tests an EXPERT path (efficient, safe,
   selective), a SAFE-BUT-INEFFICIENT path (defensible outcome, wasted
   effort), and an UNSAFE/PREMATURE path (Stage 12A Section 29).
   ========================================================================= */
'use strict';
const path = require('path');
const APP = path.join(__dirname, '..', '..', 'app', 'morning-qc');

let passed = 0, failed = 0;
function assert(id, cond, detail) {
  if (cond) { console.log(`  ✓ [${id}] ${detail}`); passed++; }
  else { console.error(`  ✗ [${id}] FAIL: ${detail}`); failed++; }
}

async function main() {
  const { replay } = await import('file://' + path.join(APP, 'engine.js'));
  const { generateDebrief } = await import('file://' + path.join(APP, 'debrief-model.js'));
  const { pilot1ReagentLotShift, pilot2PbrtqcPopulationShift, pilot3RcvPatientImpact } = await import('file://' + path.join(APP, 'cases', 'index.js'));

  function lastSeverity(trace) { return trace[trace.length - 1]?.severity; }
  function countSeverity(trace, sev) { return trace.filter(t => t.severity === sev).length; }

  /* ======================= PILOT 1 ======================= */
  console.log('\n=== PILOT 1: Reagent Lot Shift ===');
  {
    const caseObj = pilot1ReagentLotShift;

    const expertActions = [
      { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' },
      { type: 'ACKNOWLEDGE_SIGNAL', description: 'Sustained shift detected at run 6.' },
      { type: 'HOLD_RESULTS', reason: 'Sustained rule violation.' },
      { type: 'INSPECT_PANEL', panelId: 'panel-lj-chart' },
      { type: 'INSPECT_PANEL', panelId: 'panel-reagent-lot' },
      { type: 'INSPECT_PANEL', panelId: 'panel-calibration' },
      { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-lot' },
      { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-calibration' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-lot-timing' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-cal-timing' },
      { type: 'REPEAT_QC', wasNecessary: true },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-old-lot-repeat' },
      { type: 'APPLY_INTERVENTION', description: 'Reverted to verified reagent lot.', evidenceSupported: true },
      { type: 'VERIFY_RECOVERY' },
      { type: 'REVIEW_PATIENT_IMPACT', targetState: 'INDICATED' },
      { type: 'REVIEW_PATIENT_IMPACT', targetState: 'PENDING' },
      { type: 'REVIEW_PATIENT_IMPACT', targetState: 'AFFECTED_RESULT_SET_IDENTIFIED' },
      { type: 'RESUME_SERVICE' },
      { type: 'DOCUMENT', fields: { finalDisposition: 'RESUMED' } },
    ];
    const expertResult = replay(caseObj, expertActions);
    assert('P1-EXPERT-01', expertResult.trace.every(t => !t.error), 'Expert path completes with zero illegal transitions');
    assert('P1-EXPERT-02', countSeverity(expertResult.trace, 'INEFFICIENT') === 0, 'Expert path has zero INEFFICIENT actions (no irrelevant panels, no unnecessary repeats)');
    assert('P1-EXPERT-03', countSeverity(expertResult.trace, 'CRITICAL_UNSAFE') === 0 && countSeverity(expertResult.trace, 'UNSAFE') === 0, 'Expert path has zero UNSAFE/CRITICAL_UNSAFE actions');
    assert('P1-EXPERT-04', expertResult.finalState.hypothesisStates['hyp-lot'] === 'ESTABLISHED', 'Expert path establishes the correct hypothesis (hyp-lot)');
    assert('P1-EXPERT-05', expertResult.finalState.serviceState === 'RESUMED', 'Expert path reaches RESUMED disposition');

    const safeIneffActions = [
      ...expertActions.slice(0, 3),
      { type: 'INSPECT_PANEL', panelId: 'panel-analyzer-status' }, // irrelevant
      { type: 'INSPECT_PANEL', panelId: 'panel-maintenance' }, // irrelevant
      ...expertActions.slice(3, 10),
      { type: 'REPEAT_QC', wasNecessary: false }, // unnecessary extra repeat
      ...expertActions.slice(10),
    ];
    const safeIneffResult = replay(caseObj, safeIneffActions);
    assert('P1-SAFEINEFF-01', safeIneffResult.trace.every(t => !t.error), 'Safe-but-inefficient path completes with zero illegal transitions');
    assert('P1-SAFEINEFF-02', countSeverity(safeIneffResult.trace, 'INEFFICIENT') >= 3, `Safe-but-inefficient path has multiple INEFFICIENT actions (found ${countSeverity(safeIneffResult.trace, 'INEFFICIENT')})`);
    assert('P1-SAFEINEFF-03', safeIneffResult.finalState.serviceState === 'RESUMED', 'Safe-but-inefficient path still reaches the same defensible RESUMED disposition');
    assert('P1-SAFEINEFF-04', safeIneffResult.finalState.elapsedMinutes > expertResult.finalState.elapsedMinutes, 'Safe-but-inefficient path consumes more elapsed time than the expert path');

    const unsafeActions = [
      { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' },
      { type: 'ACKNOWLEDGE_SIGNAL', description: 'Shift noticed.' },
      { type: 'HOLD_RESULTS' },
      { type: 'VERIFY_RECOVERY' }, // no evidence obtained -> criteria not met
      { type: 'RESUME_SERVICE' }, // premature
    ];
    const unsafeResult = replay(caseObj, unsafeActions);
    assert('P1-UNSAFE-01', unsafeResult.trace.every(t => !t.error), 'Unsafe path is structurally legal (engine permits it to record the mistake, per Section 20 severity model)');
    assert('P1-UNSAFE-02', lastSeverity(unsafeResult.trace) === 'CRITICAL_UNSAFE', `Unsafe path final action (premature resume) is flagged CRITICAL_UNSAFE (found ${lastSeverity(unsafeResult.trace)})`);
    assert('P1-UNSAFE-03', unsafeResult.finalState.hypothesisStates['hyp-lot'] !== 'ESTABLISHED', 'Unsafe path never establishes the root cause (no decisive evidence obtained)');

    const debriefExpert = generateDebrief(caseObj, expertResult.finalState);
    const debriefUnsafe = generateDebrief(caseObj, unsafeResult.finalState);
    assert('P1-DEBRIEF-DIFF', debriefExpert.verification.adequate === true && debriefUnsafe.verification.adequate === false,
      'Debrief meaningfully distinguishes expert (adequate verification) from unsafe (inadequate verification) paths');
  }

  /* ======================= PILOT 2 ======================= */
  console.log('\n=== PILOT 2: PBRTQC Population Shift ===');
  {
    const caseObj = pilot2PbrtqcPopulationShift;

    const expertActions = [
      { type: 'INSPECT_PANEL', panelId: 'panel-pbrtqc' },
      { type: 'ACKNOWLEDGE_SIGNAL', description: 'PBRTQC alert at t=720.' },
      { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' },
      { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-analytical' },
      { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-population' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-iqc-stable' },
      { type: 'INSPECT_PANEL', panelId: 'panel-patient-distribution' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-ward-timing' },
      { type: 'CHECK_PATIENT_DISTRIBUTION' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-case-mix-decisive' },
      { type: 'DOCUMENT', fields: { establishedCause: 'Patient population case-mix shift.', finalDisposition: 'CONTINUE_ANALYSIS_DOCUMENTED' } },
    ];
    const expertResult = replay(caseObj, expertActions);
    assert('P2-EXPERT-01', expertResult.trace.every(t => !t.error), 'Expert path completes with zero illegal transitions');
    assert('P2-EXPERT-02', countSeverity(expertResult.trace, 'INEFFICIENT') === 0, 'Expert path inspects no irrelevant panels (avoids maintenance/calibration/analyzer-status, all IRRELEVANT here)');
    assert('P2-EXPERT-03', expertResult.finalState.hypothesisStates['hyp-population'] === 'ESTABLISHED', 'Expert path establishes the correct hypothesis (population shift)');
    assert('P2-EXPERT-04', expertResult.finalState.hypothesisStates['hyp-analytical'] !== 'ESTABLISHED', 'Expert path never establishes the incorrect analytical-error hypothesis');

    const safeIneffActions = [
      ...expertActions.slice(0, 3),
      { type: 'INSPECT_PANEL', panelId: 'panel-analyzer-status' },
      { type: 'INSPECT_PANEL', panelId: 'panel-calibration' },
      { type: 'INSPECT_PANEL', panelId: 'panel-maintenance' },
      ...expertActions.slice(3),
    ];
    const safeIneffResult = replay(caseObj, safeIneffActions);
    assert('P2-SAFEINEFF-01', countSeverity(safeIneffResult.trace, 'INEFFICIENT') === 3, `Safe-but-inefficient path inspects 3 irrelevant panels (found ${countSeverity(safeIneffResult.trace, 'INEFFICIENT')})`);
    assert('P2-SAFEINEFF-02', safeIneffResult.finalState.hypothesisStates['hyp-population'] === 'ESTABLISHED', 'Safe-but-inefficient path still reaches the correct conclusion');

    const unsafeActions = [
      { type: 'INSPECT_PANEL', panelId: 'panel-pbrtqc' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-iqc-stable' },
      { type: 'DOCUMENT', fields: { finalDisposition: 'DISMISSED_ALERT_BECAUSE_IQC_PASSED' } }, // premature dismissal without decisive evidence
    ];
    const unsafeResult = replay(caseObj, unsafeActions);
    assert('P2-UNSAFE-01', unsafeResult.finalState.hypothesisStates['hyp-population'] !== 'ESTABLISHED', 'Unsafe (premature-dismissal) path never obtains the decisive evidence needed to establish the true cause');
  }

  /* ======================= PILOT 3 ======================= */
  console.log('\n=== PILOT 3: RCV Patient Impact ===');
  {
    const caseObj = pilot3RcvPatientImpact;

    const expertActions = [
      { type: 'INSPECT_PANEL', panelId: 'panel-patient-distribution' },
      { type: 'ACKNOWLEDGE_SIGNAL', description: 'Serial result change 4.2 -> 5.1.' },
      { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' },
      { type: 'INSPECT_PANEL', panelId: 'panel-eqa' },
      { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-analytical-error' },
      { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-genuine-biological-change' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-iqc-clean' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-eqa-pass' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-rcv-calculation' },
      { type: 'DOCUMENT', fields: { finalDisposition: 'NO_ANALYTICAL_HOLD_RCV_DOCUMENTED' } },
    ];
    const expertResult = replay(caseObj, expertActions);
    assert('P3-EXPERT-01', expertResult.trace.every(t => !t.error), 'Expert path completes with zero illegal transitions');
    assert('P3-EXPERT-02', expertResult.finalState.hypothesisStates['hyp-genuine-biological-change'] === 'ESTABLISHED', 'Expert path establishes the correct hypothesis via the RCV calculation');
    assert('P3-EXPERT-03', expertResult.finalState.hypothesisStates['hyp-analytical-error'] !== 'ESTABLISHED', 'Expert path never establishes the incorrect analytical-error hypothesis');
    assert('P3-EXPERT-04', expertResult.finalState.serviceState === 'RUNNING', 'Expert path correctly does NOT hold analytical service (no analytical disturbance exists)');

    const safeIneffActions = [
      ...expertActions.slice(0, 3),
      { type: 'INSPECT_PANEL', panelId: 'panel-analyzer-status' },
      { type: 'INSPECT_PANEL', panelId: 'panel-calibration' },
      ...expertActions.slice(3),
    ];
    const safeIneffResult = replay(caseObj, safeIneffActions);
    assert('P3-SAFEINEFF-01', countSeverity(safeIneffResult.trace, 'INEFFICIENT') === 2, `Safe-but-inefficient path inspects 2 irrelevant panels (found ${countSeverity(safeIneffResult.trace, 'INEFFICIENT')})`);
    assert('P3-SAFEINEFF-02', safeIneffResult.finalState.hypothesisStates['hyp-genuine-biological-change'] === 'ESTABLISHED', 'Safe-but-inefficient path still reaches the correct conclusion');

    const unsafeActions = [
      { type: 'INSPECT_PANEL', panelId: 'panel-patient-distribution' },
      { type: 'ACKNOWLEDGE_SIGNAL', description: 'Large change observed.' },
      { type: 'HOLD_RESULTS', reason: 'Assumed analytical error without checking IQC/EQA/RCV.' }, // unsupported containment
    ];
    const unsafeResult = replay(caseObj, unsafeActions);
    assert('P3-UNSAFE-01', unsafeResult.finalState.hypothesisStates['hyp-genuine-biological-change'] !== 'ESTABLISHED', 'Unsafe path (assumed error, held without evidence) never establishes the correct hypothesis');
    assert('P3-UNSAFE-02', unsafeResult.finalState.serviceState === 'HELD', 'Unsafe path results in an unsupported analytical hold, contradicting ground truth (no disturbance exists)');
  }

  const total = passed + failed;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Morning QC Pilot Path Tests: ${passed}/${total} passed, ${failed} failed`);
  if (failed > 0) { console.error('PILOT PATH TESTS FAILED.'); process.exit(1); }
  console.log('PILOT PATH TESTS PASSED.');
  process.exit(0);
}
main().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
