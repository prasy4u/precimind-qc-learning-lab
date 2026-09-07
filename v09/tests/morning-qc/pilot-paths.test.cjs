/* =========================================================================
   v09/tests/morning-qc/pilot-paths.test.cjs

   Morning QC Room — Stage 12A Pilot Path Tests
   PROVENANCE: V09_TEST
   Rewritten during the Stage 12A independent-audit corrective closure.

   For each of the 3 pilot cases: an EXPERT path (efficient, safe,
   selective, all information genuinely earned via real prerequisites),
   a SAFE-BUT-INEFFICIENT path (defensible outcome, wasted effort), and
   an UNSAFE/PREMATURE path that produces an ACTUAL engine-recorded
   UNSUPPORTED/UNSAFE/CRITICAL_UNSAFE decision via a case-authored
   decisionId/optionId — not merely a path that "fails to establish the
   correct hypothesis."
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
  function anyUnsafeOrUnsupported(trace) {
    return trace.some(t => ['UNSUPPORTED', 'UNSAFE', 'CRITICAL_UNSAFE'].includes(t.severity));
  }

  /* ======================= PILOT 1 ======================= */
  console.log('\n=== PILOT 1: Reagent Lot Shift ===');
  {
    const caseObj = pilot1ReagentLotShift;

    const expertActions = [
      { type: 'ACKNOWLEDGE_SIGNAL', description: 'Sustained shift detected at run 6.' },
      { type: 'HOLD_RESULTS', decisionId: 'dec-containment', optionId: 'opt-hold' },
      { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' },
      { type: 'INSPECT_PANEL', panelId: 'panel-lj-chart' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-lot-timing' },
      { type: 'INSPECT_PANEL', panelId: 'panel-reagent-lot' },
      { type: 'INSPECT_PANEL', panelId: 'panel-calibration' },
      { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-lot' },
      { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-calibration' },
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
    assert('P1-EXPERT-01', expertResult.trace.every(t => !t.error), `Expert path completes with zero illegal transitions (errors: ${JSON.stringify(expertResult.trace.filter(t=>t.error).map(t=>t.error))})`);
    assert('P1-EXPERT-02', countSeverity(expertResult.trace, 'INEFFICIENT') === 0, 'Expert path has zero INEFFICIENT actions');
    assert('P1-EXPERT-03', !anyUnsafeOrUnsupported(expertResult.trace), 'Expert path has zero UNSUPPORTED/UNSAFE/CRITICAL_UNSAFE actions');
    assert('P1-EXPERT-04', expertResult.finalState.hypothesisStates['hyp-lot'] === 'ESTABLISHED', 'Expert path establishes the correct hypothesis (hyp-lot)');
    assert('P1-EXPERT-05', expertResult.finalState.serviceState === 'RESUMED', 'Expert path reaches RESUMED disposition');
    assert('P1-EXPERT-06', expertResult.trace[expertResult.trace.length - 2].outcomeAppropriate === true, 'Expert path final disposition action is outcome-appropriate (case-authored)');

    const safeIneffActions = [
      ...expertActions.slice(0, 2),
      { type: 'INSPECT_PANEL', panelId: 'panel-analyzer-status' }, // irrelevant, available from SIGNAL_RECOGNITION>=SCAN
      ...expertActions.slice(2, 6),
      { type: 'INSPECT_PANEL', panelId: 'panel-maintenance' }, // irrelevant
      ...expertActions.slice(6, 10),
      { type: 'REPEAT_QC', wasNecessary: false }, // unnecessary extra repeat
      ...expertActions.slice(10),
    ];
    const safeIneffResult = replay(caseObj, safeIneffActions);
    assert('P1-SAFEINEFF-01', safeIneffResult.trace.every(t => !t.error), `Safe-but-inefficient path completes with zero illegal transitions (errors: ${JSON.stringify(safeIneffResult.trace.filter(t=>t.error).map(t=>t.error))})`);
    assert('P1-SAFEINEFF-02', countSeverity(safeIneffResult.trace, 'INEFFICIENT') >= 3, `Safe-but-inefficient path has multiple INEFFICIENT actions (found ${countSeverity(safeIneffResult.trace, 'INEFFICIENT')})`);
    assert('P1-SAFEINEFF-03', !anyUnsafeOrUnsupported(safeIneffResult.trace), 'Safe-but-inefficient path has NO unsafe/unsupported actions (it is safe, just wasteful)');
    assert('P1-SAFEINEFF-04', safeIneffResult.finalState.serviceState === 'RESUMED', 'Safe-but-inefficient path still reaches the same defensible RESUMED disposition');
    assert('P1-SAFEINEFF-05', safeIneffResult.finalState.elapsedMinutes > expertResult.finalState.elapsedMinutes, 'Safe-but-inefficient path consumes more elapsed time than the expert path');

    // Unsafe path: a genuine engine-recorded UNSAFE/CRITICAL_UNSAFE decision,
    // not merely "never establishes the hypothesis."
    const unsafeActions = [
      { type: 'ACKNOWLEDGE_SIGNAL' },
      { type: 'HOLD_RESULTS' },
      { type: 'VERIFY_RECOVERY' }, // no evidence obtained -> UNSAFE, stays HELD
      { type: 'DOCUMENT', decisionId: 'dec-disposition', optionId: 'opt-resume-unverified', fields: { finalDisposition: 'ATTEMPTED_RESUME_UNVERIFIED' } }, // CRITICAL_UNSAFE, case-authored
    ];
    const unsafeResult = replay(caseObj, unsafeActions);
    assert('P1-UNSAFE-01', unsafeResult.trace.every(t => !t.error), 'Unsafe path is structurally legal (engine permits it to record the mistake)');
    assert('P1-UNSAFE-02', unsafeResult.trace[2].severity === 'UNSAFE', `Premature verification attempt is engine-recorded UNSAFE (found ${unsafeResult.trace[2].severity})`);
    assert('P1-UNSAFE-03', unsafeResult.trace[3].severity === 'CRITICAL_UNSAFE' && unsafeResult.trace[3].outcomeAppropriate === false, `Case-authored premature-resume decision is engine-recorded CRITICAL_UNSAFE with outcomeAppropriate=false (found severity=${unsafeResult.trace[3].severity}, outcomeAppropriate=${unsafeResult.trace[3].outcomeAppropriate})`);
    assert('P1-UNSAFE-04', unsafeResult.finalState.hypothesisStates['hyp-lot'] !== 'ESTABLISHED', 'Unsafe path never establishes the root cause (no decisive evidence obtained) — but this is IN ADDITION TO, not a substitute for, the recorded unsafe decisions above');

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
      { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-analytical', decisionId: 'dec-take-seriously', optionId: 'opt-investigate' },
      { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-iqc-stable' },
      { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-population' },
      { type: 'INSPECT_PANEL', panelId: 'panel-patient-distribution' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-ward-timing' },
      { type: 'CHECK_PATIENT_DISTRIBUTION' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-case-mix-decisive' },
      { type: 'DOCUMENT', decisionId: 'dec-disposition', optionId: 'opt-continue-documented', fields: { establishedCause: 'Patient population case-mix shift.', finalDisposition: 'CONTINUE_ANALYSIS_DOCUMENTED' } },
    ];
    const expertResult = replay(caseObj, expertActions);
    assert('P2-EXPERT-01', expertResult.trace.every(t => !t.error), `Expert path completes with zero illegal transitions (errors: ${JSON.stringify(expertResult.trace.filter(t=>t.error).map(t=>t.error))})`);
    assert('P2-EXPERT-02', countSeverity(expertResult.trace, 'INEFFICIENT') === 0, 'Expert path inspects no irrelevant panels');
    assert('P2-EXPERT-03', expertResult.finalState.hypothesisStates['hyp-population'] === 'ESTABLISHED', 'Expert path establishes the correct hypothesis');
    assert('P2-EXPERT-04', expertResult.finalState.hypothesisStates['hyp-analytical'] !== 'ESTABLISHED', 'Expert path never establishes the incorrect analytical-error hypothesis');
    assert('P2-EXPERT-05', !anyUnsafeOrUnsupported(expertResult.trace), 'Expert path has zero unsafe/unsupported actions');

    const safeIneffActions = [
      ...expertActions.slice(0, 3),
      { type: 'INSPECT_PANEL', panelId: 'panel-analyzer-status' },
      { type: 'INSPECT_PANEL', panelId: 'panel-calibration' },
      { type: 'INSPECT_PANEL', panelId: 'panel-maintenance' },
      ...expertActions.slice(3),
    ];
    const safeIneffResult = replay(caseObj, safeIneffActions);
    assert('P2-SAFEINEFF-01', safeIneffResult.trace.every(t => !t.error), `Safe-but-inefficient path completes cleanly (errors: ${JSON.stringify(safeIneffResult.trace.filter(t=>t.error).map(t=>t.error))})`);
    assert('P2-SAFEINEFF-02', countSeverity(safeIneffResult.trace, 'INEFFICIENT') === 3, `Safe-but-inefficient path inspects 3 irrelevant panels (found ${countSeverity(safeIneffResult.trace, 'INEFFICIENT')})`);
    assert('P2-SAFEINEFF-03', safeIneffResult.finalState.hypothesisStates['hyp-population'] === 'ESTABLISHED', 'Safe-but-inefficient path still reaches the correct conclusion');

    // Unsafe: an ACTUAL recorded UNSUPPORTED decision (dismissing the alert
    // via the case-authored option), not a generic DOCUMENT string.
    const unsafeActions = [
      { type: 'INSPECT_PANEL', panelId: 'panel-pbrtqc' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-iqc-stable' },
      { type: 'DOCUMENT', decisionId: 'dec-take-seriously', optionId: 'opt-dismiss', fields: { finalDisposition: 'DISMISSED_ALERT_BECAUSE_IQC_PASSED' } },
    ];
    const unsafeResult = replay(caseObj, unsafeActions);
    assert('P2-UNSAFE-01', unsafeResult.trace.every(t => !t.error), 'Unsafe path is structurally legal');
    assert('P2-UNSAFE-02', unsafeResult.trace[2].severity === 'UNSUPPORTED' && unsafeResult.trace[2].outcomeAppropriate === false,
      `Dismissing the alert because IQC passed is engine-recorded UNSUPPORTED with outcomeAppropriate=false (found severity=${unsafeResult.trace[2].severity}, outcomeAppropriate=${unsafeResult.trace[2].outcomeAppropriate})`);
    assert('P2-UNSAFE-03', unsafeResult.finalState.hypothesisStates['hyp-population'] !== 'ESTABLISHED', 'Unsafe path never obtains the decisive evidence needed to establish the true cause');
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
      { type: 'DOCUMENT', decisionId: 'dec-disposition', optionId: 'opt-no-hold-document', fields: { finalDisposition: 'NO_ANALYTICAL_HOLD_RCV_DOCUMENTED' } },
    ];
    const expertResult = replay(caseObj, expertActions);
    assert('P3-EXPERT-01', expertResult.trace.every(t => !t.error), `Expert path completes with zero illegal transitions (errors: ${JSON.stringify(expertResult.trace.filter(t=>t.error).map(t=>t.error))})`);
    assert('P3-EXPERT-02', expertResult.finalState.hypothesisStates['hyp-statistically-significant-change'] === 'ESTABLISHED', 'Expert path establishes the statistical-significance hypothesis via the RCV calculation');
    assert('P3-EXPERT-03', expertResult.finalState.hypothesisStates['hyp-analytical-error'] !== 'ESTABLISHED', 'Expert path never establishes the incorrect analytical-error hypothesis');
    assert('P3-EXPERT-04', expertResult.finalState.serviceState === 'RUNNING', 'Expert path correctly does NOT hold analytical service (no analytical disturbance exists)');
    assert('P3-EXPERT-05', expertResult.finalState.hypothesisStates['hyp-preanalytical-factor'] === 'WEAKENED', `Preanalytical hypothesis is WEAKENED (not CONTRADICTED/eliminated) — appropriate residual uncertainty preserved (found ${expertResult.finalState.hypothesisStates['hyp-preanalytical-factor']})`);
    assert('P3-EXPERT-06', !anyUnsafeOrUnsupported(expertResult.trace), 'Expert path has zero unsafe/unsupported actions');

    const safeIneffActions = [
      ...expertActions.slice(0, 4),
      { type: 'INSPECT_PANEL', panelId: 'panel-analyzer-status' },
      { type: 'INSPECT_PANEL', panelId: 'panel-calibration' },
      ...expertActions.slice(4),
    ];
    const safeIneffResult = replay(caseObj, safeIneffActions);
    assert('P3-SAFEINEFF-01', safeIneffResult.trace.every(t => !t.error), `Safe-but-inefficient path completes cleanly (errors: ${JSON.stringify(safeIneffResult.trace.filter(t=>t.error).map(t=>t.error))})`);
    assert('P3-SAFEINEFF-02', countSeverity(safeIneffResult.trace, 'INEFFICIENT') === 2, `Safe-but-inefficient path inspects 2 irrelevant panels (found ${countSeverity(safeIneffResult.trace, 'INEFFICIENT')})`);
    assert('P3-SAFEINEFF-03', safeIneffResult.finalState.hypothesisStates['hyp-statistically-significant-change'] === 'ESTABLISHED', 'Safe-but-inefficient path still reaches the correct conclusion');

    // Unsafe path A: assumed analytical error, held without evidence —
    // an ACTUAL engine-recorded UNSUPPORTED decision.
    const unsafeActionsA = [
      { type: 'ACKNOWLEDGE_SIGNAL', description: 'Large change observed.' },
      { type: 'INSPECT_PANEL', panelId: 'panel-patient-distribution' },
      { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-analytical-error', decisionId: 'dec-interpretation', optionId: 'opt-assume-error' },
    ];
    const unsafeResultA = replay(caseObj, unsafeActionsA);
    assert('P3-UNSAFE-01', unsafeResultA.trace.every(t => !t.error), 'Unsafe path A is structurally legal');
    assert('P3-UNSAFE-02', unsafeResultA.trace[2].severity === 'UNSUPPORTED' && unsafeResultA.trace[2].outcomeAppropriate === false,
      `Assuming analytical error without checking evidence is engine-recorded UNSUPPORTED with outcomeAppropriate=false (found severity=${unsafeResultA.trace[2].severity})`);
    assert('P3-UNSAFE-03', unsafeResultA.finalState.hypothesisStates['hyp-statistically-significant-change'] !== 'ESTABLISHED', 'Unsafe path A never establishes the correct hypothesis');

    // Unsafe path B: over-claims biological certainty from RCV exceedance —
    // the OPPOSITE over-reach, also engine-recorded UNSUPPORTED.
    const unsafeActionsB = [
      ...expertActions.slice(0, 11), // through obtaining the RCV evidence
      { type: 'DOCUMENT', decisionId: 'dec-disposition', optionId: 'opt-overclaim-biological', fields: { finalDisposition: 'CLAIMED_DEFINITIVE_BIOLOGICAL_CAUSE' } },
    ];
    const unsafeResultB = replay(caseObj, unsafeActionsB);
    assert('P3-UNSAFE-04', unsafeResultB.trace.every(t => !t.error), 'Unsafe path B is structurally legal');
    assert('P3-UNSAFE-05', unsafeResultB.trace[unsafeResultB.trace.length - 1].severity === 'UNSUPPORTED' && unsafeResultB.trace[unsafeResultB.trace.length - 1].outcomeAppropriate === false,
      `Over-claiming definitive biological causation from RCV exceedance is ALSO engine-recorded UNSUPPORTED (found severity=${unsafeResultB.trace[unsafeResultB.trace.length - 1].severity})`);
  }

  const total = passed + failed;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Morning QC Pilot Path Tests: ${passed}/${total} passed, ${failed} failed`);
  if (failed > 0) { console.error('PILOT PATH TESTS FAILED.'); process.exit(1); }
  console.log('PILOT PATH TESTS PASSED.');
  process.exit(0);
}
main().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
