/* =========================================================================
   v09/tests/morning-qc/expanded-case-paths.test.cjs

   Morning QC Room — Stage 12D Expanded Case Path Tests
   PROVENANCE: V09_TEST

   For all 9 new Stage 12D cases: an expert path (proving the case is
   mechanically sound end-to-end, using the generic engine only — no
   case-ID branching anywhere) plus at least 2 adversarial paths each
   (proving the engine correctly catches the specific unsafe/unsupported
   shortcut each case is designed to test). Minimum 27 scenarios (9
   expert + 18 adversarial).
   ========================================================================= */
'use strict';
const path = require('path');

let passed = 0, failed = 0;
function assert(id, cond, detail) {
  if (cond) { console.log(`  ✓ [${id}] ${detail}`); passed++; }
  else { console.error(`  ✗ [${id}] FAIL: ${detail}`); failed++; }
}

async function run(c, actions) {
  const { createInitialState, applyAction } = await import('file://' + path.join(MQC, 'engine.js'));
  let state = createInitialState(c);
  let lastOut = null;
  for (const a of actions) {
    lastOut = applyAction(c, state, a);
    if (lastOut.error) return { error: lastOut.error, state, lastOut };
    state = lastOut.state;
  }
  return { error: null, state, lastOut };
}

const MQC = path.join(__dirname, '..', '..', 'app', 'morning-qc');

async function main() {
  const cases = await import('file://' + path.join(MQC, 'cases', 'index.js'));
  const {
    case04IsolatedExcursion, case05IncreasedImprecision, case06CalibrationShift,
    case07NoPatientImpact, case08EqaDiscordance, case09SeekMoreEvidence,
    case10PrematureReleaseTrap, case11ConcurrentTriage, case12MaintenanceCoincidence,
  } = cases;

  /* ===================== Case 4: Isolated Excursion ===================== */
  console.log('\n=== Case 4: Isolated Excursion (Family A) ===');
  {
    const c = case04IsolatedExcursion;
    const expert = await run(c, [
      { type: 'ACKNOWLEDGE_SIGNAL' }, { type: 'HOLD_RESULTS', decisionId: 'dec-containment', optionId: 'opt-hold' },
      { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' }, { type: 'INSPECT_PANEL', panelId: 'panel-lj-chart' },
      { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-random' },
      { type: 'INSPECT_PANEL', panelId: 'panel-reagent-lot' }, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-no-lot-change' },
      { type: 'INSPECT_PANEL', panelId: 'panel-calibration' }, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-no-recent-cal' },
      { type: 'REPEAT_QC' }, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-repeat-normal' },
      { type: 'VERIFY_RECOVERY' }, { type: 'RESUME_SERVICE', decisionId: 'dec-disposition', optionId: 'opt-resume-confirmed-random' },
    ]);
    assert('P4-EXPERT-01', expert.error === null && expert.state.serviceState === 'RESUMED', 'Case 4 expert path resumes cleanly');

    const adv1 = await run(c, [{ type: 'ACKNOWLEDGE_SIGNAL' }, { type: 'CONTINUE_ANALYSIS', decisionId: 'dec-containment', optionId: 'opt-continue' }]);
    assert('P4-ADV-01', adv1.lastOut.severity === 'UNSAFE' && adv1.lastOut.outcomeAppropriate === false, 'Case 4 adversarial: continuing without holding is correctly flagged UNSAFE');

    const adv2 = await run(c, [
      { type: 'ACKNOWLEDGE_SIGNAL' }, { type: 'HOLD_RESULTS', decisionId: 'dec-containment', optionId: 'opt-hold' },
      { type: 'RESUME_SERVICE' },
    ]);
    assert('P4-ADV-02', adv2.lastOut.error !== null && /Illegal service-state transition/.test(adv2.lastOut.error), 'Case 4 adversarial: the engine refuses to resume from HELD without a genuine successful verification (Illegal service-state transition), never silently permitting premature resume');
  }

  /* ===================== Case 5: Increased Imprecision ===================== */
  console.log('\n=== Case 5: Increased Imprecision (Family C) ===');
  {
    const c = case05IncreasedImprecision;
    const expert = await run(c, [
      { type: 'ACKNOWLEDGE_SIGNAL' }, { type: 'HOLD_RESULTS', decisionId: 'dec-containment', optionId: 'opt-hold' },
      { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' }, { type: 'INSPECT_PANEL', panelId: 'panel-lj-chart' },
      { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-imprecision' },
      { type: 'INSPECT_PANEL', panelId: 'panel-sigma' }, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-sigma-degraded' },
      { type: 'INSPECT_PANEL', panelId: 'panel-maintenance' }, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-probe-flagged' },
      { type: 'APPLY_INTERVENTION', decisionId: 'dec-intervention', optionId: 'opt-service-probe' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-post-service-sd-recovery' },
      { type: 'VERIFY_RECOVERY' }, { type: 'RESUME_SERVICE', decisionId: 'dec-disposition', optionId: 'opt-resume-verified' },
    ]);
    assert('P5-EXPERT-01', expert.error === null && expert.state.serviceState === 'RESUMED', 'Case 5 expert path resumes cleanly after a genuine post-service repeat window');

    const adv1 = await run(c, [{ type: 'ACKNOWLEDGE_SIGNAL' }, { type: 'CONTINUE_ANALYSIS', decisionId: 'dec-containment', optionId: 'opt-continue-mean-fine' }]);
    assert('P5-ADV-01', adv1.lastOut.severity === 'UNSAFE' && adv1.lastOut.outcomeAppropriate === false, 'Case 5 adversarial: dismissing because the mean is fine is correctly flagged UNSAFE');

    const adv2 = await run(c, [
      { type: 'ACKNOWLEDGE_SIGNAL' }, { type: 'HOLD_RESULTS', decisionId: 'dec-containment', optionId: 'opt-hold' },
      { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' }, { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-lot' },
      { type: 'APPLY_INTERVENTION', decisionId: 'dec-intervention', optionId: 'opt-service-probe' },
    ]);
    assert('P5-ADV-02', adv2.lastOut.reasoningSupported === false && adv2.lastOut.severity === 'UNSUPPORTED', 'Case 5 adversarial: intervening before obtaining ev-probe-flagged is correctly unsupported');
  }

  /* ===================== Case 6: Calibration Shift ===================== */
  console.log('\n=== Case 6: Calibration Shift (Family D) ===');
  {
    const c = case06CalibrationShift;
    const expert = await run(c, [
      { type: 'ACKNOWLEDGE_SIGNAL' }, { type: 'HOLD_RESULTS', decisionId: 'dec-containment', optionId: 'opt-hold' },
      { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' }, { type: 'INSPECT_PANEL', panelId: 'panel-lj-chart' },
      { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-bad-calibration' },
      { type: 'INSPECT_PANEL', panelId: 'panel-calibration' }, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-cal-high-recovery-out' },
      { type: 'INSPECT_PANEL', panelId: 'panel-reagent-lot' }, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-no-lot-change' },
      { type: 'APPLY_INTERVENTION', decisionId: 'dec-intervention', optionId: 'opt-recalibrate' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-recalibration-verified' },
      { type: 'VERIFY_RECOVERY' }, { type: 'RESUME_SERVICE' },
    ]);
    assert('P6-EXPERT-01', expert.error === null && expert.state.serviceState === 'RESUMED', 'Case 6 expert path resumes cleanly');

    const adv1 = await run(c, [{ type: 'ACKNOWLEDGE_SIGNAL' }, { type: 'CONTINUE_ANALYSIS', decisionId: 'dec-containment', optionId: 'opt-continue-cal-fixed' }]);
    assert('P6-ADV-01', adv1.lastOut.severity === 'UNSAFE' && adv1.lastOut.outcomeAppropriate === false, 'Case 6 adversarial: assuming calibration fixed it is correctly flagged UNSAFE');

    const adv2 = await run(c, [
      { type: 'ACKNOWLEDGE_SIGNAL' }, { type: 'HOLD_RESULTS', decisionId: 'dec-containment', optionId: 'opt-hold' },
      { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' }, { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-lot' },
      { type: 'APPLY_INTERVENTION', decisionId: 'dec-intervention', optionId: 'opt-recalibrate' },
      { type: 'VERIFY_RECOVERY' },
    ]);
    assert('P6-ADV-02', adv2.lastOut.severity === 'UNSAFE', 'Case 6 adversarial: attempting verification without the recalibration-verified evidence is correctly flagged UNSAFE, and the engine keeps the case in a held/investigative state rather than permitting resume');
  }

  /* ===================== Case 7: No Patient Impact ===================== */
  console.log('\n=== Case 7: No Patient Impact (Family E) ===');
  {
    const c = case07NoPatientImpact;
    const expert = await run(c, [
      { type: 'ACKNOWLEDGE_SIGNAL' }, { type: 'HOLD_RESULTS', decisionId: 'dec-containment', optionId: 'opt-hold' },
      { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' }, { type: 'INSPECT_PANEL', panelId: 'panel-analyzer-status' },
      { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-environmental' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-temp-excursion' }, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-qc-self-resolved' },
      { type: 'VERIFY_RECOVERY' }, { type: 'INSPECT_PANEL', panelId: 'panel-patient-distribution' },
      { type: 'REVIEW_PATIENT_IMPACT', targetState: 'INDICATED' }, { type: 'REVIEW_PATIENT_IMPACT', targetState: 'PENDING' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-patient-results-reviewed' },
      { type: 'REVIEW_PATIENT_IMPACT', targetState: 'COMPLETED_NO_AFFECTED_RESULTS' },
      { type: 'RESUME_SERVICE', decisionId: 'dec-disposition', optionId: 'opt-resume-reviewed' },
    ]);
    assert('P7-EXPERT-01', expert.error === null && expert.state.serviceState === 'RESUMED' && expert.state.patientImpactState === 'COMPLETED_NO_AFFECTED_RESULTS', 'Case 7 expert path resumes with a genuine no-affected-results conclusion');

    const adv1Setup = [
      { type: 'ACKNOWLEDGE_SIGNAL' }, { type: 'HOLD_RESULTS', decisionId: 'dec-containment', optionId: 'opt-hold' },
      { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' }, { type: 'INSPECT_PANEL', panelId: 'panel-analyzer-status' },
      { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-environmental' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-temp-excursion' }, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-qc-self-resolved' },
      { type: 'VERIFY_RECOVERY' },
    ];
    const adv1 = await run(c, [...adv1Setup, { type: 'RESUME_SERVICE', decisionId: 'dec-disposition', optionId: 'opt-resume-skip-review' }]);
    assert('P7-ADV-01', adv1.lastOut.severity === 'UNSAFE' && adv1.lastOut.outcomeAppropriate === false, 'Case 7 adversarial: resuming without patient-impact review is correctly flagged UNSAFE');

    const adv2 = await run(c, [...adv1Setup, { type: 'REVIEW_PATIENT_IMPACT', targetState: 'INDICATED' }, { type: 'REVIEW_PATIENT_IMPACT', targetState: 'PENDING' }, { type: 'REVIEW_PATIENT_IMPACT', targetState: 'COMPLETED_NO_AFFECTED_RESULTS' }]);
    assert('P7-ADV-02', adv2.lastOut.error !== null && /Cannot reach terminal patient-impact state/.test(adv2.lastOut.error), 'Case 7 adversarial: claiming no-affected-results without the review evidence is correctly refused by the engine');
  }

  /* ===================== Case 8: EQA Discordance ===================== */
  console.log('\n=== Case 8: EQA Discordance (Family I) ===');
  {
    const c = case08EqaDiscordance;
    const expert = await run(c, [
      { type: 'ACKNOWLEDGE_SIGNAL' }, { type: 'INSPECT_PANEL', panelId: 'panel-eqa' }, { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' },
      { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-method-difference' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-iqc-stable' }, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-method-subgroup-closer' },
      { type: 'INSPECT_PANEL', panelId: 'panel-reagent-lot' }, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-no-lot-change' },
      { type: 'DOCUMENT', decisionId: 'dec-disposition', optionId: 'opt-investigate-method-difference', fields: {} },
    ]);
    assert('P8-EXPERT-01', expert.error === null && expert.state.serviceState === 'RUNNING', 'Case 8 expert path documents correctly without an unnecessary hold');

    const adv1 = await run(c, [
      { type: 'ACKNOWLEDGE_SIGNAL' }, { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' }, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-iqc-stable' },
      { type: 'DOCUMENT', decisionId: 'dec-disposition', optionId: 'opt-dismiss-iqc-fine', fields: {} },
    ]);
    assert('P8-ADV-01', adv1.lastOut.severity === 'UNSUPPORTED' && adv1.lastOut.outcomeAppropriate === false, 'Case 8 adversarial: dismissing EQA because IQC is stable is correctly flagged UNSUPPORTED');

    const adv2 = await run(c, [
      { type: 'ACKNOWLEDGE_SIGNAL' }, { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' }, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-iqc-stable' },
      { type: 'DOCUMENT', decisionId: 'dec-disposition', optionId: 'opt-investigate-method-difference', fields: {} },
    ]);
    assert('P8-ADV-02', adv2.lastOut.reasoningSupported === false, 'Case 8 adversarial: concluding the method-difference explanation before obtaining the decisive peer-subgroup evidence is correctly unsupported');
  }

  /* ===================== Case 9: Seek More Evidence ===================== */
  console.log('\n=== Case 9: Seek More Evidence (Family O) ===');
  {
    const c = case09SeekMoreEvidence;
    const expert = await run(c, [
      { type: 'ACKNOWLEDGE_SIGNAL' }, { type: 'HOLD_RESULTS', decisionId: 'dec-containment', optionId: 'opt-hold' },
      { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' }, { type: 'INSPECT_PANEL', panelId: 'panel-analyzer-status' },
      { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-aspiration' }, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-aspiration-flag' },
      { type: 'INSPECT_PANEL', panelId: 'panel-reagent-lot' }, { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-lot' }, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-new-lot' },
      { type: 'REPEAT_QC' }, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-repeat-discriminates' },
      { type: 'VERIFY_RECOVERY' }, { type: 'RESUME_SERVICE', decisionId: 'dec-disposition', optionId: 'opt-resume-after-repeat' },
    ]);
    assert('P9-EXPERT-01', expert.error === null && expert.state.serviceState === 'RESUMED', 'Case 9 expert path resumes only after the discriminating repeat');

    const adv1 = await run(c, [{ type: 'ACKNOWLEDGE_SIGNAL' }, { type: 'HOLD_RESULTS', decisionId: 'dec-containment', optionId: 'opt-hold' }, { type: 'RESUME_SERVICE' }]);
    assert('P9-ADV-01', adv1.lastOut.error !== null && /Illegal service-state transition/.test(adv1.lastOut.error), 'Case 9 adversarial: the engine refuses premature resume before the discriminating evidence is obtained');

    const adv2 = await run(c, [{ type: 'ACKNOWLEDGE_SIGNAL' }, { type: 'HOLD_RESULTS', decisionId: 'dec-containment', optionId: 'opt-hold' }, { type: 'VERIFY_RECOVERY' }]);
    assert('P9-ADV-02', adv2.lastOut.severity === 'UNSAFE', 'Case 9 adversarial: attempting verification before any discriminating evidence is correctly flagged UNSAFE');
  }

  /* ===================== Case 10: Premature-Release Trap ===================== */
  console.log('\n=== Case 10: Premature-Release Trap (Family P) ===');
  {
    const c = case10PrematureReleaseTrap;
    const expert = await run(c, [
      { type: 'ACKNOWLEDGE_SIGNAL' }, { type: 'HOLD_RESULTS', decisionId: 'dec-containment', optionId: 'opt-hold' },
      { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' }, { type: 'INSPECT_PANEL', panelId: 'panel-reagent-lot' },
      { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-new-lot' }, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-lot-timing' },
      { type: 'APPLY_INTERVENTION', decisionId: 'dec-intervention', optionId: 'opt-revert-lot' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-first-repeat-still-high' }, { type: 'VERIFY_RECOVERY' },
      { type: 'INSPECT_PANEL', panelId: 'panel-analyzer-status' }, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-ise-electrode-flagged' },
      { type: 'APPLY_INTERVENTION', decisionId: 'dec-intervention', optionId: 'opt-replace-electrode' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-second-repeat-normal' }, { type: 'VERIFY_RECOVERY' },
      { type: 'RESUME_SERVICE', decisionId: 'dec-disposition', optionId: 'opt-resume-verified' },
    ]);
    assert('P10-EXPERT-01', expert.error === null && expert.state.serviceState === 'RESUMED', 'Case 10 expert path resumes after correctly responding to a failed first verification');

    const adv1 = await run(c, [
      { type: 'ACKNOWLEDGE_SIGNAL' }, { type: 'HOLD_RESULTS', decisionId: 'dec-containment', optionId: 'opt-hold' },
      { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' }, { type: 'INSPECT_PANEL', panelId: 'panel-reagent-lot' }, { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-new-lot' }, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-lot-timing' },
      { type: 'APPLY_INTERVENTION', decisionId: 'dec-intervention', optionId: 'opt-revert-lot' },
      { type: 'RESUME_SERVICE' },
    ]);
    assert('P10-ADV-01', adv1.lastOut.error !== null && /Illegal service-state transition/.test(adv1.lastOut.error), 'Case 10 adversarial: the engine refuses to resume immediately after reverting the lot without any post-intervention verification');

    const adv2 = await run(c, [
      { type: 'ACKNOWLEDGE_SIGNAL' }, { type: 'HOLD_RESULTS', decisionId: 'dec-containment', optionId: 'opt-hold' },
      { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' }, { type: 'INSPECT_PANEL', panelId: 'panel-reagent-lot' }, { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-new-lot' }, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-lot-timing' },
      { type: 'APPLY_INTERVENTION', decisionId: 'dec-intervention', optionId: 'opt-revert-lot' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-first-repeat-still-high' }, { type: 'VERIFY_RECOVERY' },
    ]);
    assert('P10-ADV-02', adv2.lastOut.severity === 'UNSAFE', 'Case 10 adversarial: verification after only the FIRST (ineffective) intervention is correctly flagged UNSAFE, not treated as adequate recovery');
  }

  /* ===================== Case 11: Concurrent Triage ===================== */
  console.log('\n=== Case 11: Concurrent Triage (Family N) ===');
  {
    const c = case11ConcurrentTriage;
    const expert = await run(c, [
      { type: 'ACKNOWLEDGE_SIGNAL' }, { type: 'HOLD_RESULTS', decisionId: 'dec-containment', optionId: 'opt-hold-both' },
      { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' }, { type: 'INSPECT_PANEL', panelId: 'panel-qc-history-tsh' },
      { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-tsh-cal-drift', decisionId: 'dec-priority', optionId: 'opt-prioritize-tsh' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-tsh-trend' }, { type: 'INSPECT_PANEL', panelId: 'panel-calibration' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-tsh-cal-overdue' }, { type: 'APPLY_INTERVENTION', decisionId: 'dec-intervention', optionId: 'opt-recalibrate-tsh' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-tsh-post-recal-recovery' },
      { type: 'REPEAT_QC' }, { type: 'INSPECT_PANEL', panelId: 'panel-glucose-repeat' },
      { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-glucose-random' }, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-glucose-repeat-normal' },
      { type: 'VERIFY_RECOVERY' }, { type: 'RESUME_SERVICE', decisionId: 'dec-disposition', optionId: 'opt-resume-both-verified' },
    ]);
    assert('P11-EXPERT-01', expert.error === null && expert.state.serviceState === 'RESUMED', 'Case 11 expert path correctly prioritizes TSH, obtains genuine post-recalibration recovery, and resumes after verifying both analytes independently');

    const adv1 = await run(c, [
      { type: 'ACKNOWLEDGE_SIGNAL' }, { type: 'HOLD_RESULTS', decisionId: 'dec-containment', optionId: 'opt-hold-both' },
      { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' },
      { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-glucose-random', decisionId: 'dec-priority', optionId: 'opt-prioritize-glucose' },
    ]);
    assert('P11-ADV-01', adv1.lastOut.severity === 'UNSUPPORTED' && adv1.lastOut.outcomeAppropriate === false, 'Case 11 adversarial: prioritizing glucose over the sustained TSH trend reflects salience bias and is correctly flagged UNSUPPORTED');

    const adv2 = await run(c, [
      { type: 'ACKNOWLEDGE_SIGNAL' }, { type: 'HOLD_RESULTS', decisionId: 'dec-containment', optionId: 'opt-hold-both' },
      { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' }, { type: 'INSPECT_PANEL', panelId: 'panel-calibration' }, { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-tsh-cal-drift' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-tsh-cal-overdue' }, { type: 'APPLY_INTERVENTION', decisionId: 'dec-intervention', optionId: 'opt-recalibrate-tsh' },
      { type: 'VERIFY_RECOVERY' },
    ]);
    assert('P11-ADV-02', adv2.lastOut.severity === 'UNSAFE', 'Case 11 adversarial: verifying only TSH without independently confirming glucose is correctly flagged UNSAFE');
  }

  /* ===================== Case 12: Maintenance Coincidence ===================== */
  console.log('\n=== Case 12: Maintenance Coincidence (Family D) ===');
  {
    const c = case12MaintenanceCoincidence;
    const expert = await run(c, [
      { type: 'ACKNOWLEDGE_SIGNAL' }, { type: 'HOLD_RESULTS', decisionId: 'dec-containment', optionId: 'opt-hold' },
      { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' }, { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-maintenance-inadequate' },
      { type: 'INSPECT_PANEL', panelId: 'panel-maintenance' }, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-maintenance-adequate' },
      { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-light-source' }, { type: 'INSPECT_PANEL', panelId: 'panel-analyzer-status' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-light-source-flagged' },
      { type: 'APPLY_INTERVENTION', decisionId: 'dec-intervention', optionId: 'opt-replace-light-source' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-post-replacement-recovery' },
      { type: 'VERIFY_RECOVERY' }, { type: 'RESUME_SERVICE', decisionId: 'dec-disposition', optionId: 'opt-resume-verified' },
    ]);
    assert('P12-EXPERT-01', expert.error === null && expert.state.serviceState === 'RESUMED', 'Case 12 expert path finds the independent cause after confirming maintenance was adequate, then resumes');

    const adv1 = await run(c, [
      { type: 'ACKNOWLEDGE_SIGNAL' }, { type: 'HOLD_RESULTS', decisionId: 'dec-containment', optionId: 'opt-hold' },
      { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' }, { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-maintenance-inadequate' },
      { type: 'APPLY_INTERVENTION', decisionId: 'dec-intervention', optionId: 'opt-redo-maintenance' },
    ]);
    assert('P12-ADV-01', adv1.lastOut.severity === 'UNSUPPORTED' && adv1.lastOut.outcomeAppropriate === false, 'Case 12 adversarial: redoing the maintenance without evidence it was inadequate is correctly flagged UNSUPPORTED');

    const adv2 = await run(c, [
      { type: 'ACKNOWLEDGE_SIGNAL' }, { type: 'HOLD_RESULTS', decisionId: 'dec-containment', optionId: 'opt-hold' },
      { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' }, { type: 'INSPECT_PANEL', panelId: 'panel-maintenance' }, { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-maintenance-inadequate' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-maintenance-adequate' }, { type: 'VERIFY_RECOVERY' },
    ]);
    assert('P12-ADV-02', adv2.lastOut.severity === 'UNSAFE', 'Case 12 adversarial: treating "maintenance was adequate" as itself sufficient verification is correctly flagged UNSAFE');
  }

  const total = passed + failed;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Expanded Case Path Tests: ${passed}/${total} passed, ${failed} failed`);
  if (failed > 0) { console.error('EXPANDED CASE PATH TESTS FAILED.'); process.exit(1); }
  console.log('EXPANDED CASE PATH TESTS PASSED.');
  process.exit(0);
}
main().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
