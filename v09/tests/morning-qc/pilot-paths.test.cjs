/* =========================================================================
   v09/tests/morning-qc/pilot-paths.test.cjs

   Morning QC Room — Stage 12A Pilot Path Tests
   PROVENANCE: V09_TEST
   Rewritten during the Stage 12A independent-audit FINAL engine-semantics
   closure: every phase-advancing action now correctly follows
   ACKNOWLEDGE_SIGNAL; decision executions now bind the correct
   case-authored actionType; unsafe paths demonstrate genuine
   engine-recorded severities via properly-typed decision executions.
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

  function countSeverity(trace, sev) { return trace.filter(t => t.severity === sev).length; }
  function anyUnsafeOrUnsupported(trace) { return trace.some(t => ['UNSUPPORTED', 'UNSAFE', 'CRITICAL_UNSAFE'].includes(t.severity)); }

  /* ======================= PILOT 1 ======================= */
  console.log('\n=== PILOT 1: Reagent Lot Shift ===');
  {
    const caseObj = pilot1ReagentLotShift;

    const expertActions = [
      { type: 'ACKNOWLEDGE_SIGNAL', description: 'Sustained shift detected at run 6.' },
      { type: 'HOLD_RESULTS', decisionId: 'dec-containment', optionId: 'opt-hold' },
      { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' },
      { type: 'INSPECT_PANEL', panelId: 'panel-lj-chart' },
      { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-lot' },
      { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-calibration' },
      { type: 'INSPECT_PANEL', panelId: 'panel-reagent-lot' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-lot-timing' },
      { type: 'INSPECT_PANEL', panelId: 'panel-calibration' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-cal-timing' },
      { type: 'REPEAT_QC', wasNecessary: true },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-old-lot-repeat' },
      { type: 'APPLY_INTERVENTION', description: 'Reverted to verified reagent lot.', evidenceSupported: true },
      { type: 'VERIFY_RECOVERY' },
      { type: 'CHECK_PATIENT_DISTRIBUTION' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-affected-window' },
      { type: 'REVIEW_PATIENT_IMPACT', targetState: 'INDICATED' },
      { type: 'REVIEW_PATIENT_IMPACT', targetState: 'PENDING' },
      { type: 'REVIEW_PATIENT_IMPACT', targetState: 'AFFECTED_RESULT_SET_IDENTIFIED' },
      { type: 'RESUME_SERVICE', decisionId: 'dec-disposition', optionId: 'opt-resume-verified' },
      { type: 'DOCUMENT', fields: { finalDisposition: 'RESUMED' } },
    ];
    const expertResult = replay(caseObj, expertActions);
    assert('P1-EXPERT-01', expertResult.trace.every(t => !t.error), `Expert path completes cleanly (errors: ${JSON.stringify(expertResult.trace.filter(t=>t.error).map(t=>t.error))})`);
    assert('P1-EXPERT-02', countSeverity(expertResult.trace, 'INEFFICIENT') === 0, 'Expert path has zero INEFFICIENT actions');
    assert('P1-EXPERT-03', !anyUnsafeOrUnsupported(expertResult.trace), 'Expert path has zero unsafe/unsupported actions');
    assert('P1-EXPERT-04', expertResult.finalState.hypothesisStates['hyp-lot'] === 'ESTABLISHED', 'Expert path establishes hyp-lot');
    assert('P1-EXPERT-05', expertResult.finalState.serviceState === 'RESUMED', 'Expert path reaches RESUMED');

    const safeIneffActions = [
      ...expertActions.slice(0, 2),
      { type: 'INSPECT_PANEL', panelId: 'panel-analyzer-status' },
      ...expertActions.slice(2, 6),
      { type: 'INSPECT_PANEL', panelId: 'panel-maintenance' },
      ...expertActions.slice(6, 11),
      { type: 'REPEAT_QC', wasNecessary: false },
      ...expertActions.slice(11),
    ];
    const safeIneffResult = replay(caseObj, safeIneffActions);
    assert('P1-SAFEINEFF-01', safeIneffResult.trace.every(t => !t.error), `Safe-inefficient path completes cleanly (errors: ${JSON.stringify(safeIneffResult.trace.filter(t=>t.error).map(t=>t.error))})`);
    assert('P1-SAFEINEFF-02', countSeverity(safeIneffResult.trace, 'INEFFICIENT') >= 3, `Multiple INEFFICIENT actions (found ${countSeverity(safeIneffResult.trace, 'INEFFICIENT')})`);
    assert('P1-SAFEINEFF-03', !anyUnsafeOrUnsupported(safeIneffResult.trace), 'No unsafe/unsupported actions');
    assert('P1-SAFEINEFF-04', safeIneffResult.finalState.serviceState === 'RESUMED', 'Still reaches RESUMED');
    assert('P1-SAFEINEFF-05', safeIneffResult.finalState.elapsedMinutes > expertResult.finalState.elapsedMinutes, 'Consumes more time than expert path');

    // Unsafe: premature verification (UNSAFE), then a genuinely-reachable
    // unsafe disposition — resume after SUCCESSFUL verification but WITHOUT
    // patient-impact review (dec-disposition/opt-resume-no-pi-review, UNSAFE).
    const unsafeActions = [
      { type: 'ACKNOWLEDGE_SIGNAL' },
      { type: 'HOLD_RESULTS' },
      { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' }, // genuinely reach CHARACTERISATION before any investigative action
      { type: 'VERIFY_RECOVERY' }, // fails -> UNSAFE, stays HELD, phase -> INVESTIGATION
      { type: 'REPEAT_QC', wasNecessary: true },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-old-lot-repeat' },
      { type: 'VERIFY_RECOVERY' }, // now succeeds -> READY_FOR_VERIFICATION
      { type: 'RESUME_SERVICE', decisionId: 'dec-disposition', optionId: 'opt-resume-no-pi-review' }, // patient impact never addressed
    ];
    const unsafeResult = replay(caseObj, unsafeActions);
    assert('P1-UNSAFE-01', unsafeResult.trace.every(t => !t.error), `Unsafe path is structurally legal throughout (errors: ${JSON.stringify(unsafeResult.trace.filter(t=>t.error).map(t=>t.error))})`);
    assert('P1-UNSAFE-02', unsafeResult.trace[3].severity === 'UNSAFE', `First verification attempt (premature) engine-recorded UNSAFE (found ${unsafeResult.trace[3].severity})`);
    assert('P1-UNSAFE-03', unsafeResult.trace[unsafeResult.trace.length-1].severity === 'UNSAFE' && unsafeResult.trace[unsafeResult.trace.length-1].outcomeAppropriate === false,
      `Case-authored resume-without-patient-impact-review decision is engine-recorded UNSAFE with outcomeAppropriate=false (found severity=${unsafeResult.trace[unsafeResult.trace.length-1].severity})`);

    const debriefExpert = generateDebrief(caseObj, expertResult.finalState);
    const debriefUnsafe = generateDebrief(caseObj, unsafeResult.finalState);
    assert('P1-DEBRIEF-DIFF', debriefExpert.patientImpact.addressed === true && debriefUnsafe.patientImpact.addressed === false,
      'Debrief distinguishes expert (patient impact addressed) from unsafe (not addressed) paths');
  }

  /* ======================= PILOT 2 ======================= */
  console.log('\n=== PILOT 2: PBRTQC Population Shift ===');
  {
    const caseObj = pilot2PbrtqcPopulationShift;

    const expertActions = [
      { type: 'ACKNOWLEDGE_SIGNAL', description: 'PBRTQC alert at t=720.' },
      { type: 'INSPECT_PANEL', panelId: 'panel-pbrtqc' },
      { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-analytical', decisionId: 'dec-take-seriously', optionId: 'opt-investigate' },
      { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-iqc-stable' },
      { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-population' },
      { type: 'INSPECT_PANEL', panelId: 'panel-patient-distribution' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-ward-timing' },
      { type: 'CHECK_PATIENT_DISTRIBUTION' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-case-mix-decisive' },
      { type: 'DOCUMENT', decisionId: 'dec-disposition', optionId: 'opt-continue-documented', fields: { establishedCause: 'Patient population case-mix shift.' } },
    ];
    const expertResult = replay(caseObj, expertActions);
    assert('P2-EXPERT-01', expertResult.trace.every(t => !t.error), `Expert path completes cleanly (errors: ${JSON.stringify(expertResult.trace.filter(t=>t.error).map(t=>t.error))})`);
    assert('P2-EXPERT-02', countSeverity(expertResult.trace, 'INEFFICIENT') === 0, 'Zero irrelevant panels inspected');
    assert('P2-EXPERT-03', expertResult.finalState.hypothesisStates['hyp-population'] === 'ESTABLISHED', 'Correct hypothesis established');
    assert('P2-EXPERT-04', expertResult.finalState.hypothesisStates['hyp-analytical'] !== 'ESTABLISHED', 'Incorrect hypothesis never established');
    assert('P2-EXPERT-05', !anyUnsafeOrUnsupported(expertResult.trace), 'Zero unsafe/unsupported actions');

    const safeIneffActions = [
      ...expertActions.slice(0, 4),
      { type: 'INSPECT_PANEL', panelId: 'panel-analyzer-status' },
      { type: 'INSPECT_PANEL', panelId: 'panel-calibration' },
      { type: 'INSPECT_PANEL', panelId: 'panel-maintenance' },
      ...expertActions.slice(4),
    ];
    const safeIneffResult = replay(caseObj, safeIneffActions);
    assert('P2-SAFEINEFF-01', safeIneffResult.trace.every(t => !t.error), `Safe-inefficient path completes cleanly (errors: ${JSON.stringify(safeIneffResult.trace.filter(t=>t.error).map(t=>t.error))})`);
    assert('P2-SAFEINEFF-02', countSeverity(safeIneffResult.trace, 'INEFFICIENT') === 3, `3 irrelevant panels (found ${countSeverity(safeIneffResult.trace, 'INEFFICIENT')})`);
    assert('P2-SAFEINEFF-03', safeIneffResult.finalState.hypothesisStates['hyp-population'] === 'ESTABLISHED', 'Still reaches correct conclusion');

    // Unsafe: dismiss the alert — genuinely bound to DOCUMENT via decisionId/optionId.
    const unsafeActions = [
      { type: 'ACKNOWLEDGE_SIGNAL' },
      { type: 'INSPECT_PANEL', panelId: 'panel-pbrtqc' },
      { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-iqc-stable' },
      { type: 'DOCUMENT', decisionId: 'dec-take-seriously', optionId: 'opt-dismiss', fields: { finalDisposition: 'DISMISSED_ALERT_BECAUSE_IQC_PASSED' } },
    ];
    const unsafeResult = replay(caseObj, unsafeActions);
    assert('P2-UNSAFE-01', unsafeResult.trace.every(t => !t.error), 'Unsafe path is structurally legal');
    const lastU = unsafeResult.trace[unsafeResult.trace.length-1];
    assert('P2-UNSAFE-02', lastU.severity === 'UNSUPPORTED' && lastU.outcomeAppropriate === false, `Dismissal is engine-recorded UNSUPPORTED with outcomeAppropriate=false (found ${lastU.severity})`);
    assert('P2-UNSAFE-03', unsafeResult.finalState.hypothesisStates['hyp-population'] !== 'ESTABLISHED', 'Never establishes the correct cause');
  }

  /* ======================= PILOT 3 ======================= */
  console.log('\n=== PILOT 3: RCV Patient Impact ===');
  {
    const caseObj = pilot3RcvPatientImpact;

    const expertActions = [
      { type: 'ACKNOWLEDGE_SIGNAL', description: 'Serial result change 4.2 -> 5.1.' },
      { type: 'INSPECT_PANEL', panelId: 'panel-patient-distribution' },
      { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' },
      { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-analytical-error' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-iqc-clean' },
      { type: 'INSPECT_PANEL', panelId: 'panel-eqa' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-eqa-pass' },
      { type: 'INSPECT_PANEL', panelId: 'panel-specimen-context' },
      { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-preanalytical-factor' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-specimen-handling' },
      { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-statistically-significant-change', decisionId: 'dec-interpretation', optionId: 'opt-apply-rcv' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-rcv-calculation' },
      { type: 'DOCUMENT', decisionId: 'dec-disposition', optionId: 'opt-no-hold-document', fields: {} },
    ];
    const expertResult = replay(caseObj, expertActions);
    assert('P3-EXPERT-01', expertResult.trace.every(t => !t.error), `Expert path completes cleanly (errors: ${JSON.stringify(expertResult.trace.filter(t=>t.error).map(t=>t.error))})`);
    assert('P3-EXPERT-02', expertResult.finalState.hypothesisStates['hyp-statistically-significant-change'] === 'ESTABLISHED', 'Statistical-significance hypothesis established');
    assert('P3-EXPERT-03', expertResult.finalState.hypothesisStates['hyp-analytical-error'] !== 'ESTABLISHED', 'Incorrect hypothesis never established');
    assert('P3-EXPERT-04', expertResult.finalState.serviceState === 'RUNNING', 'No analytical hold');
    assert('P3-EXPERT-05', expertResult.finalState.hypothesisStates['hyp-preanalytical-factor'] === 'WEAKENED', `Preanalytical hypothesis WEAKENED, not eliminated (found ${expertResult.finalState.hypothesisStates['hyp-preanalytical-factor']})`);
    assert('P3-EXPERT-06', !anyUnsafeOrUnsupported(expertResult.trace), 'Zero unsafe/unsupported actions');

    const safeIneffActions = [
      ...expertActions.slice(0, 4),
      { type: 'INSPECT_PANEL', panelId: 'panel-analyzer-status' },
      { type: 'INSPECT_PANEL', panelId: 'panel-calibration' },
      ...expertActions.slice(4),
    ];
    const safeIneffResult = replay(caseObj, safeIneffActions);
    assert('P3-SAFEINEFF-01', safeIneffResult.trace.every(t => !t.error), `Safe-inefficient path completes cleanly (errors: ${JSON.stringify(safeIneffResult.trace.filter(t=>t.error).map(t=>t.error))})`);
    assert('P3-SAFEINEFF-02', countSeverity(safeIneffResult.trace, 'INEFFICIENT') === 2, `2 irrelevant panels (found ${countSeverity(safeIneffResult.trace, 'INEFFICIENT')})`);
    assert('P3-SAFEINEFF-03', safeIneffResult.finalState.hypothesisStates['hyp-statistically-significant-change'] === 'ESTABLISHED', 'Still reaches correct conclusion');

    const unsafeActionsA = [
      { type: 'ACKNOWLEDGE_SIGNAL', description: 'Large change observed.' },
      { type: 'INSPECT_PANEL', panelId: 'panel-patient-distribution' },
      { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-analytical-error', decisionId: 'dec-interpretation', optionId: 'opt-assume-error' },
    ];
    const unsafeResultA = replay(caseObj, unsafeActionsA);
    assert('P3-UNSAFE-01', unsafeResultA.trace.every(t => !t.error), 'Unsafe path A is structurally legal');
    const lastA = unsafeResultA.trace[unsafeResultA.trace.length-1];
    assert('P3-UNSAFE-02', lastA.severity === 'UNSUPPORTED' && lastA.outcomeAppropriate === false, `Assuming error without checking is UNSUPPORTED (found ${lastA.severity})`);
    assert('P3-UNSAFE-03', unsafeResultA.finalState.hypothesisStates['hyp-statistically-significant-change'] !== 'ESTABLISHED', 'Never establishes correct hypothesis');

    const unsafeActionsB = [
      ...expertActions.slice(0, 12),
      { type: 'DOCUMENT', decisionId: 'dec-disposition', optionId: 'opt-overclaim-biological', fields: {} },
    ];
    const unsafeResultB = replay(caseObj, unsafeActionsB);
    assert('P3-UNSAFE-04', unsafeResultB.trace.every(t => !t.error), 'Unsafe path B is structurally legal');
    const lastB = unsafeResultB.trace[unsafeResultB.trace.length-1];
    assert('P3-UNSAFE-05', lastB.severity === 'UNSUPPORTED' && lastB.outcomeAppropriate === false, `Over-claiming biological certainty is ALSO UNSUPPORTED (found ${lastB.severity})`);
  }

  const total = passed + failed;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Morning QC Pilot Path Tests: ${passed}/${total} passed, ${failed} failed`);
  if (failed > 0) { console.error('PILOT PATH TESTS FAILED.'); process.exit(1); }
  console.log('PILOT PATH TESTS PASSED.');
  process.exit(0);
}
main().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
