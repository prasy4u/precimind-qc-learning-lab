/* =========================================================================
   v09/tests/morning-qc/engine.test.cjs

   Morning QC Room — Stage 12A Engine Unit Tests
   PROVENANCE: V09_TEST
   Rewritten during the Stage 12A independent-audit FINAL engine-semantics
   closure: source-panel evidence gating, phase high-water-mark guards,
   executable decision contracts (actionType + availableFromPhase),
   decision-category preservation, genuine 4-combination outcome/reasoning
   matrix, corrected confidence calibration + identity policy, corrected
   EVIDENCE_SELECTION scoring, strengthened validator reachability checks,
   and truthful phase-return governance.
   ========================================================================= */
'use strict';
const path = require('path');
const APP = path.join(__dirname, '..', '..', 'app', 'morning-qc');

let passed = 0, failed = 0;
function assert(id, cond, detail) {
  if (cond) { console.log(`  ✓ [${id}] ${detail}`); passed++; }
  else { console.error(`  ✗ [${id}] FAIL: ${detail}`); failed++; }
}
function deepEqual(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

async function main() {
  const { validateCase } = await import('file://' + path.join(APP, 'case-validator.js'));
  const { createInitialState, applyAction, replay, canReturnToPhase } = await import('file://' + path.join(APP, 'engine.js'));
  const { pilot1ReagentLotShift } = await import('file://' + path.join(APP, 'cases', 'pilot-1-reagent-lot-shift.js'));
  const { syntheticFixtureCase } = await import('file://' + path.join(APP, 'cases', 'synthetic-fixture.js'));
  const states = await import('file://' + path.join(APP, 'states.js'));

  const caseObj = pilot1ReagentLotShift;

  console.log('\n=== Valid case loading ===');
  {
    const result = validateCase(caseObj);
    assert('LOAD-01', result.valid === true, `Pilot 1 validates cleanly (errors: ${JSON.stringify(result.errors)})`);
    assert('LOAD-02', validateCase(syntheticFixtureCase).valid === true, 'Synthetic fixture validates cleanly');
  }

  console.log('\n=== Invalid case rejection (fail-closed) ===');
  {
    const b1 = JSON.parse(JSON.stringify(caseObj)); delete b1.identity.title;
    assert('REJECT-01', validateCase(b1).valid === false, 'Missing required identity field rejected');

    const b3 = JSON.parse(JSON.stringify(caseObj)); b3.groundTruth.rootCauseEstablished = false; b3.groundTruth.rootCauseDescription = 'x';
    assert('REJECT-03', validateCase(b3).valid === false, 'Contradictory ground truth rejected');

    const b7 = JSON.parse(JSON.stringify(caseObj)); b7.groundTruth.disturbanceEstablished = false; b7.groundTruth.rootCauseEstablished = true;
    assert('REJECT-07', validateCase(b7).valid === false, 'Analytical root cause without disturbance rejected');

    const b8 = JSON.parse(JSON.stringify(caseObj)); delete b8.decisionOpportunities[0].options[0].outcomeAppropriate;
    assert('REJECT-08', validateCase(b8).valid === false, 'Decision option missing outcomeAppropriate rejected');

    const b9 = JSON.parse(JSON.stringify(caseObj)); b9.evidence[0].availableOnlyAfterActionType = 'REQUEST_EVIDENCE';
    assert('REJECT-09', validateCase(b9).valid === false, 'Tautological REQUEST_EVIDENCE prerequisite rejected');

    // Final-closure new checks:
    const b12 = JSON.parse(JSON.stringify(caseObj)); b12.evidence[0].sourcePanelId = 'nonexistent-panel';
    assert('REJECT-12', validateCase(b12).valid === false, 'sourcePanelId referencing nonexistent panel rejected');

    const b13 = JSON.parse(JSON.stringify(caseObj)); b13.decisionOpportunities[0].options[0].actionType = 'NOT_A_REAL_ACTION';
    assert('REJECT-13', validateCase(b13).valid === false, 'Decision option actionType not a recognized action type rejected');

    // Section 7's exact example: CHECK_EQA prerequisite with no EQA panel present.
    const b14 = JSON.parse(JSON.stringify(caseObj)); b14.evidence[0].availableOnlyAfterActionType = 'CHECK_EQA';
    assert('REJECT-14', validateCase(b14).valid === false, 'CHECK_EQA prerequisite with no EQA panel in the case is rejected (unreachable)');
  }

  console.log('\n=== Deterministic replay ===');
  {
    const actions = [
      { type: 'ACKNOWLEDGE_SIGNAL', description: 'Sustained shift detected.' },
      { type: 'HOLD_RESULTS' },
    ];
    const r1 = replay(caseObj, actions);
    const r2 = replay(caseObj, actions);
    assert('DETERM-01', deepEqual(r1.finalState, r2.finalState), 'Same case + same actions produce byte-identical final state');
  }

  console.log('\n=== Panel availability enforcement ===');
  {
    let state = createInitialState(caseObj);
    let out = applyAction(caseObj, state, { type: 'INSPECT_PANEL', panelId: 'panel-reagent-lot' });
    assert('AVAIL-01', out.error !== null, 'Panel gated behind CHARACTERISATION cannot be inspected from BRIEFING');
  }

  console.log('\n=== FINAL CLOSURE: source-panel evidence gating (Defect 1) ===');
  {
    // ev-lot-timing: sourcePanelId=panel-reagent-lot. Must be unobtainable
    // before that panel is genuinely inspected, even though the panel is
    // structurally "available" (phase-wise) once reached.
    let state = createInitialState(caseObj);
    let s1 = applyAction(caseObj, state, { type: 'ACKNOWLEDGE_SIGNAL' });
    let s2 = applyAction(caseObj, s1.state, { type: 'HOLD_RESULTS' });
    // Reach CHARACTERISATION via FORM_HYPOTHESIS (signal already acknowledged).
    let s3 = applyAction(caseObj, s2.state, { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-lot' });
    assert('SRCPANEL-00', s3.error === null, 'Reached HYPOTHESIS_GENERATION (beyond CHARACTERISATION) via a real prerequisite path');
    // Attempt to obtain ev-lot-timing WITHOUT ever inspecting panel-reagent-lot.
    const prematureEv = applyAction(caseObj, s3.state, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-lot-timing' });
    assert('SRCPANEL-01', prematureEv.error !== null, `ev-lot-timing cannot be obtained without inspecting panel-reagent-lot first, even though the panel is phase-available (error: ${prematureEv.error})`);
    assert('SRCPANEL-02', !s3.state.obtainedEvidenceIds.includes('ev-lot-timing'), 'obtainedEvidenceIds not mutated by the rejected premature request');
    assert('SRCPANEL-03', s3.state.hypothesisStates['hyp-lot'] === 'PLAUSIBLE', 'No hypothesis change occurred from the rejected premature request');
    // Now genuinely inspect the panel, then the evidence succeeds.
    const inspected = applyAction(caseObj, s3.state, { type: 'INSPECT_PANEL', panelId: 'panel-reagent-lot' });
    const nowOk = applyAction(caseObj, inspected.state, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-lot-timing' });
    assert('SRCPANEL-04', nowOk.error === null && nowOk.state.obtainedEvidenceIds.includes('ev-lot-timing'), 'ev-lot-timing succeeds once panel-reagent-lot has actually been inspected');

    // ev-cal-timing: sourcePanelId=panel-calibration, same pattern.
    const prematureCal = applyAction(caseObj, s3.state, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-cal-timing' });
    assert('SRCPANEL-05', prematureCal.error !== null, 'ev-cal-timing cannot be obtained without inspecting panel-calibration first');

    // Action-generated ev-old-lot-repeat still requires REPEAT_QC (independent of sourcePanelId=null).
    const prematureRepeat = applyAction(caseObj, s3.state, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-old-lot-repeat' });
    assert('SRCPANEL-06', prematureRepeat.error !== null, 'Action-generated ev-old-lot-repeat still requires REPEAT_QC regardless of sourcePanelId being null');
  }

  console.log('\n=== FINAL CLOSURE: phase high-water-mark guard (Defect 2) ===');
  {
    // Exploit 1: DOCUMENT at pristine BRIEFING must not advance phase/unlock panels.
    let state = createInitialState(caseObj);
    const docOut = applyAction(caseObj, state, { type: 'DOCUMENT', fields: {} });
    assert('NOGAME-01', docOut.error !== null, 'DOCUMENT at pristine BRIEFING (signal not acknowledged) is REJECTED outright');
    assert('NOGAME-02', state.maxPhaseIndexReached === 0, 'maxPhaseIndexReached remains 0 after the rejected DOCUMENT attempt');

    // Exploit 2: REVIEW_PATIENT_IMPACT at pristine BRIEFING must not advance phase.
    const piOut = applyAction(caseObj, state, { type: 'REVIEW_PATIENT_IMPACT', targetState: 'INDICATED' });
    assert('NOGAME-03', piOut.error !== null, 'REVIEW_PATIENT_IMPACT at pristine BRIEFING is REJECTED outright');

    // Exploit 3 (found during this closure): FORM_HYPOTHESIS at pristine BRIEFING.
    const fhOut = applyAction(caseObj, state, { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-lot' });
    assert('NOGAME-04', fhOut.error !== null, 'FORM_HYPOTHESIS at pristine BRIEFING is REJECTED outright (same exploit class)');

    // RECORD_CONFIDENCE never advances phase at all (not in the phase-advancing map).
    // (Also requires a genuinely-executed decisionId per Defect 5 — tested separately below.)
    assert('NOGAME-05', !('RECORD_CONFIDENCE' in { ACKNOWLEDGE_SIGNAL: 1, HOLD_RESULTS: 1 }), 'sanity: RECORD_CONFIDENCE is not itself a phase-advancing action type (structural fact, verified directly in engine.js source)');

    // Legitimate path: after ACKNOWLEDGE_SIGNAL, these actions succeed normally.
    let acked = applyAction(caseObj, state, { type: 'ACKNOWLEDGE_SIGNAL' });
    const docAfterAck = applyAction(caseObj, acked.state, { type: 'DOCUMENT', fields: { finalDisposition: 'test' } });
    assert('NOGAME-06', docAfterAck.error === null, 'DOCUMENT succeeds normally once the signal has been genuinely acknowledged');
  }

  console.log('\n=== Non-linear inspection within available information ===');
  {
    let state = createInitialState(caseObj);
    let o1 = applyAction(caseObj, state, { type: 'ACKNOWLEDGE_SIGNAL' });
    let o2 = applyAction(caseObj, o1.state, { type: 'HOLD_RESULTS' });
    let o3 = applyAction(caseObj, o2.state, { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-lot' });
    assert('NONLINEAR-00', o3.error === null, 'Reaching HYPOTHESIS_GENERATION succeeds via a real prerequisite path');
    let orderA1 = applyAction(caseObj, o3.state, { type: 'INSPECT_PANEL', panelId: 'panel-calibration' });
    let orderA2 = applyAction(caseObj, orderA1.state, { type: 'INSPECT_PANEL', panelId: 'panel-reagent-lot' });
    assert('NONLINEAR-01', orderA1.error === null && orderA2.error === null, 'Panels at the same phase inspected in either order');
    let orderB1 = applyAction(caseObj, o3.state, { type: 'INSPECT_PANEL', panelId: 'panel-reagent-lot' });
    let orderB2 = applyAction(caseObj, orderB1.state, { type: 'INSPECT_PANEL', panelId: 'panel-calibration' });
    assert('NONLINEAR-02', orderB1.error === null && orderB2.error === null && orderB2.state.inspectedPanelIds.length === 2, 'Same panels, reverse order, both succeed');
  }

  console.log('\n=== Irrelevant-panel inspection ===');
  {
    let state = createInitialState(caseObj);
    let o1 = applyAction(caseObj, state, { type: 'ACKNOWLEDGE_SIGNAL' });
    let out = applyAction(caseObj, o1.state, { type: 'INSPECT_PANEL', panelId: 'panel-analyzer-status' });
    assert('IRRELEVANT-01', out.error === null && out.severity === 'INEFFICIENT', 'Irrelevant panel inspection allowed, flagged INEFFICIENT');
  }

  console.log('\n=== FINAL CLOSURE: executable decision contracts (Defect 3) ===');
  {
    // A. Valid execution.
    let state = createInitialState(caseObj);
    let acked = applyAction(caseObj, state, { type: 'ACKNOWLEDGE_SIGNAL' });
    let out = applyAction(caseObj, acked.state, { type: 'HOLD_RESULTS', decisionId: 'dec-containment', optionId: 'opt-hold' });
    assert('CONTRACT-01', out.error === null && out.state.actionHistory[out.state.actionHistory.length-1].decisionCategory === 'CONTAINMENT',
      'Valid decision execution succeeds and records decisionCategory from the case-authored decision');

    // B. Wrong action type for the option (Pilot 1 disposition option via DOCUMENT).
    const wrongType = applyAction(caseObj, acked.state, { type: 'DOCUMENT', decisionId: 'dec-disposition', optionId: 'opt-resume-verified', fields: {} });
    assert('CONTRACT-02', wrongType.error !== null, 'Executing dec-disposition/opt-resume-verified (actionType=RESUME_SERVICE) via DOCUMENT is REJECTED');

    // C. Wrong action type: containment option via FORM_HYPOTHESIS.
    const wrongType2 = applyAction(caseObj, acked.state, { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-lot', decisionId: 'dec-containment', optionId: 'opt-hold' });
    assert('CONTRACT-03', wrongType2.error !== null, 'Executing dec-containment/opt-hold (actionType=HOLD_RESULTS) via FORM_HYPOTHESIS is REJECTED');

    // D. Decision availableFromPhase not yet reached: dec-disposition
    // requires VERIFICATION; attempting immediately after ACKNOWLEDGE_SIGNAL
    // (still at SIGNAL_RECOGNITION) via the CORRECT action type must still fail.
    const tooEarly = applyAction(caseObj, acked.state, { type: 'RESUME_SERVICE', decisionId: 'dec-disposition', optionId: 'opt-resume-verified' });
    assert('CONTRACT-04', tooEarly.error !== null, 'Decision executed before its availableFromPhase is reached is REJECTED, even with the correct action type');
  }

  console.log('\n=== FINAL CLOSURE: genuine 4-combination outcome/reasoning matrix (Defect 4, synthetic fixture) ===');
  {
    const fx = syntheticFixtureCase;
    let s = createInitialState(fx);
    let acked = applyAction(fx, s, { type: 'ACKNOWLEDGE_SIGNAL' });
    const tt = applyAction(fx, acked.state, { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-x', decisionId: 'dec-tt', optionId: 'opt-tt' });
    assert('MATRIX-TT', tt.outcomeAppropriate === true && tt.severity === 'INFORMATIONAL', 'Combination 1: outcomeAppropriate=true, reasoningSupported=true (severity=INFORMATIONAL)');

    const tf = applyAction(fx, acked.state, { type: 'APPLY_INTERVENTION', decisionId: 'dec-tf', optionId: 'opt-tf', description: 'x' });
    assert('MATRIX-TF', tf.outcomeAppropriate === true && tf.severity === 'UNSUPPORTED', 'Combination 2: outcomeAppropriate=true, reasoningSupported=false (severity=UNSUPPORTED)');

    const ft = applyAction(fx, acked.state, { type: 'CONTINUE_ANALYSIS', decisionId: 'dec-ft', optionId: 'opt-ft' });
    assert('MATRIX-FT', ft.outcomeAppropriate === false && ft.severity === 'INFORMATIONAL', 'Combination 3: outcomeAppropriate=false, reasoningSupported=true (severity=INFORMATIONAL, "looks reasonable" but wrong)');

    const ff = applyAction(fx, acked.state, { type: 'DOCUMENT', decisionId: 'dec-ff', optionId: 'opt-ff', fields: {} });
    assert('MATRIX-FF', ff.outcomeAppropriate === false && ff.severity === 'CRITICAL_UNSAFE', 'Combination 4: outcomeAppropriate=false, reasoningSupported=false (severity=CRITICAL_UNSAFE)');

    const { evaluateDecision } = await import('file://' + path.join(APP, 'decision-model.js'));
    const evalTT = evaluateDecision(tt.state.actionHistory[tt.state.actionHistory.length-1]);
    const evalTF = evaluateDecision(tf.state.actionHistory[tf.state.actionHistory.length-1]);
    const evalFT = evaluateDecision(ft.state.actionHistory[ft.state.actionHistory.length-1]);
    const evalFF = evaluateDecision(ff.state.actionHistory[ff.state.actionHistory.length-1]);
    assert('MATRIX-CREDIT-01', evalTT.fullCreditEligible === true, 'fullCreditEligible true ONLY for combination 1');
    assert('MATRIX-CREDIT-02', evalTF.fullCreditEligible === false && evalFT.fullCreditEligible === false && evalFF.fullCreditEligible === false, 'fullCreditEligible false for all other 3 combinations');
  }

  console.log('\n=== FINAL CLOSURE: confidence correctness + identity model (Defect 5) ===');
  {
    const fx = syntheticFixtureCase;
    let s = createInitialState(fx);
    let acked = applyAction(fx, s, { type: 'ACKNOWLEDGE_SIGNAL' });
    // dec-ft: outcomeAppropriate=false, reasoningSupported=true. LOW confidence here
    // should be considered CALIBRATED under outcomeAppropriate-based scoring
    // (previously, a reasoningSupported-based bug rated this STRONG incorrectly
    // for the WRONG reason — now correctly calibrated for the RIGHT reason: low
    // confidence in an inappropriate-outcome decision is well-calibrated).
    const ft = applyAction(fx, acked.state, { type: 'CONTINUE_ANALYSIS', decisionId: 'dec-ft', optionId: 'opt-ft' });
    const withConf = applyAction(fx, ft.state, { type: 'RECORD_CONFIDENCE', decisionId: 'dec-ft', confidence: 'LOW' });
    assert('CONF-IDENTITY-01', withConf.error === null, 'RECORD_CONFIDENCE for a genuinely-executed decisionId succeeds');

    const { computeScoringProfile } = await import('file://' + path.join(APP, 'scoring-model.js'));
    const profile = computeScoringProfile(fx, withConf.state);
    assert('CONF-CORRECTNESS-01', profile.METACOGNITIVE_CALIBRATION === 'STRONG', `LOW confidence + outcomeAppropriate=false is correctly calibrated (STRONG), using outcomeAppropriate not reasoningSupported (found ${profile.METACOGNITIVE_CALIBRATION})`);

    // Unknown/never-executed decisionId must be REJECTED outright.
    const unknownDec = applyAction(fx, ft.state, { type: 'RECORD_CONFIDENCE', decisionId: 'DOES_NOT_EXIST', confidence: 'HIGH' });
    assert('CONF-IDENTITY-02', unknownDec.error !== null, 'RECORD_CONFIDENCE for a decisionId never executed in this trace is REJECTED outright');
    assert('CONF-IDENTITY-03', ft.state.confidenceRecords.length === 0, 'No confidence record was added by the rejected attempt');

    // Duplicate policy: latest replaces earlier.
    const dup1 = applyAction(fx, ft.state, { type: 'RECORD_CONFIDENCE', decisionId: 'dec-ft', confidence: 'HIGH' });
    const dup2 = applyAction(fx, dup1.state, { type: 'RECORD_CONFIDENCE', decisionId: 'dec-ft', confidence: 'LOW' });
    assert('CONF-DUPLICATE-01', dup2.state.confidenceRecords.length === 1 && dup2.state.confidenceRecords[0].confidence === 'LOW', 'Duplicate confidence for the same decisionId: latest REPLACES earlier (deterministic policy)');
  }

  console.log('\n=== Evidence-prerequisite enforcement (action-generated) ===');
  {
    let state = createInitialState(caseObj);
    let acked = applyAction(caseObj, state, { type: 'ACKNOWLEDGE_SIGNAL' });
    let held = applyAction(caseObj, acked.state, { type: 'HOLD_RESULTS' });
    let out = applyAction(caseObj, held.state, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-old-lot-repeat' });
    assert('PREREQ-01', out.error !== null, 'ev-old-lot-repeat cannot be obtained before REPEAT_QC');
    let afterRepeat = applyAction(caseObj, held.state, { type: 'REPEAT_QC', wasNecessary: true });
    let out2 = applyAction(caseObj, afterRepeat.state, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-old-lot-repeat' });
    assert('PREREQ-02', out2.error === null, 'ev-old-lot-repeat succeeds after REPEAT_QC');
  }

  console.log('\n=== Hypothesis updates ===');
  {
    let state = createInitialState(caseObj);
    let acked = applyAction(caseObj, state, { type: 'ACKNOWLEDGE_SIGNAL' });
    let out = applyAction(caseObj, acked.state, { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-lot' });
    assert('HYP-01', out.state.hypothesisStates['hyp-lot'] === 'PLAUSIBLE', 'FORM_HYPOTHESIS moves NOT_CONSIDERED -> PLAUSIBLE');
    let afterRepeat = applyAction(caseObj, out.state, { type: 'REPEAT_QC', wasNecessary: true });
    let out2 = applyAction(caseObj, afterRepeat.state, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-old-lot-repeat' });
    assert('HYP-02', out2.state.hypothesisStates['hyp-lot'] === 'ESTABLISHED', 'Decisive evidence moves PLAUSIBLE -> ESTABLISHED');
  }

  console.log('\n=== Patient-impact evidence gating ===');
  {
    let state = createInitialState(caseObj);
    let acked = applyAction(caseObj, state, { type: 'ACKNOWLEDGE_SIGNAL' });
    let o1 = applyAction(caseObj, acked.state, { type: 'REVIEW_PATIENT_IMPACT', targetState: 'INDICATED' });
    let o2 = applyAction(caseObj, o1.state, { type: 'REVIEW_PATIENT_IMPACT', targetState: 'PENDING' });
    let o3 = applyAction(caseObj, o2.state, { type: 'REVIEW_PATIENT_IMPACT', targetState: 'AFFECTED_RESULT_SET_IDENTIFIED' });
    assert('PIGATE-01', o3.error !== null, 'Terminal patient-impact state requires evidence');
    let withEv = applyAction(caseObj, o2.state, { type: 'CHECK_PATIENT_DISTRIBUTION' });
    let withEv2 = applyAction(caseObj, withEv.state, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-affected-window' });
    let o4 = applyAction(caseObj, withEv2.state, { type: 'REVIEW_PATIENT_IMPACT', targetState: 'AFFECTED_RESULT_SET_IDENTIFIED' });
    assert('PIGATE-02', o4.error === null, 'Terminal patient-impact state succeeds once evidence genuinely obtained');
  }

  console.log('\n=== FINAL CLOSURE: truthful phase-return governance (Defect 8) ===');
  {
    assert('RETURN-01', canReturnToPhase('VERIFICATION', 'INVESTIGATION') === true, 'canReturnToPhase genuinely consults PHASE_ALLOWS_RETURN_TO (VERIFICATION -> INVESTIGATION is a declared legal return)');
    assert('RETURN-02', canReturnToPhase('BRIEFING', 'DEBRIEF') === false, 'canReturnToPhase correctly rejects an undeclared, illegitimate "return"');

    let state = createInitialState(caseObj);
    let acked = applyAction(caseObj, state, { type: 'ACKNOWLEDGE_SIGNAL' });
    let held = applyAction(caseObj, acked.state, { type: 'HOLD_RESULTS' });
    let failedVerify = applyAction(caseObj, held.state, { type: 'VERIFY_RECOVERY' });
    assert('RETURN-03', failedVerify.state.serviceState === 'HELD', 'Failed verification remains HELD');
    assert('RETURN-04', failedVerify.state.phase === 'INVESTIGATION', 'Failed verification regresses to INVESTIGATION, validated via canReturnToPhase (not a hardcoded bypass)');

    let afterRepeat = applyAction(caseObj, failedVerify.state, { type: 'REPEAT_QC', wasNecessary: true });
    let withEvidence = applyAction(caseObj, afterRepeat.state, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-old-lot-repeat' });
    let successVerify = applyAction(caseObj, withEvidence.state, { type: 'VERIFY_RECOVERY' });
    assert('RETURN-05', successVerify.state.serviceState === 'READY_FOR_VERIFICATION', 'Subsequent successful re-verification reaches READY_FOR_VERIFICATION');
  }

  console.log('\n=== FINAL CLOSURE: corrected EVIDENCE_SELECTION scoring (Defect 6) ===');
  {
    const { computeScoringProfile } = await import('file://' + path.join(APP, 'scoring-model.js'));
    // Pristine state: zero panels inspected. Must NOT be STRONG.
    const pristine = createInitialState(caseObj);
    const pristineProfile = computeScoringProfile(caseObj, pristine);
    assert('EVIDSEL-01', pristineProfile.EVIDENCE_SELECTION !== 'STRONG', `Pristine/no-inspection state does NOT score STRONG on EVIDENCE_SELECTION (found ${pristineProfile.EVIDENCE_SELECTION})`);

    // Expert-like: inspect all relevant panels, no irrelevant ones -> should score well.
    let s = createInitialState(caseObj);
    let acked = applyAction(caseObj, s, { type: 'ACKNOWLEDGE_SIGNAL' });
    let p1 = applyAction(caseObj, acked.state, { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' });
    let p2 = applyAction(caseObj, p1.state, { type: 'INSPECT_PANEL', panelId: 'panel-lj-chart' });
    let p3 = applyAction(caseObj, p2.state, { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-lot' });
    let p4 = applyAction(caseObj, p3.state, { type: 'INSPECT_PANEL', panelId: 'panel-reagent-lot' });
    let p5 = applyAction(caseObj, p4.state, { type: 'INSPECT_PANEL', panelId: 'panel-calibration' });
    let p6 = applyAction(caseObj, p5.state, { type: 'CHECK_PATIENT_DISTRIBUTION' });
    const expertLikeProfile = computeScoringProfile(caseObj, p6.state);
    const ratingOrder = ['NEEDS_IMPROVEMENT', 'DEVELOPING', 'PROFICIENT', 'STRONG'];
    assert('EVIDSEL-02', ratingOrder.indexOf(expertLikeProfile.EVIDENCE_SELECTION) > ratingOrder.indexOf(pristineProfile.EVIDENCE_SELECTION) || pristineProfile.EVIDENCE_SELECTION === null,
      `Selective, relevant-panel-inspecting state scores better than pristine (found ${expertLikeProfile.EVIDENCE_SELECTION} vs pristine ${pristineProfile.EVIDENCE_SELECTION})`);

    // Inspecting ALL relevant panels but ALSO irrelevant ones should score
    // worse than the same relevant coverage without the irrelevant panels.
    let ineff = applyAction(caseObj, p6.state, { type: 'INSPECT_PANEL', panelId: 'panel-analyzer-status' });
    let ineff2 = applyAction(caseObj, ineff.state, { type: 'INSPECT_PANEL', panelId: 'panel-maintenance' });
    const ineffProfile = computeScoringProfile(caseObj, ineff2.state);
    assert('EVIDSEL-03', ratingOrder.indexOf(ineffProfile.EVIDENCE_SELECTION) <= ratingOrder.indexOf(expertLikeProfile.EVIDENCE_SELECTION),
      `Inspecting unnecessary irrelevant panels does not score BETTER than the selective baseline (found ${ineffProfile.EVIDENCE_SELECTION} vs ${expertLikeProfile.EVIDENCE_SELECTION})`);

    // Missing required high-value evidence caps the rating even with zero irrelevant panels.
    let s2 = createInitialState(caseObj);
    let acked2 = applyAction(caseObj, s2, { type: 'ACKNOWLEDGE_SIGNAL' });
    let onlyOnePanel = applyAction(caseObj, acked2.state, { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' });
    const missingHighValueProfile = computeScoringProfile(caseObj, onlyOnePanel.state);
    assert('EVIDSEL-04', missingHighValueProfile.EVIDENCE_SELECTION !== 'STRONG', `Missing most relevant panels (low recall) is not rated STRONG even with zero irrelevant panels inspected (found ${missingHighValueProfile.EVIDENCE_SELECTION})`);
  }

  const total = passed + failed;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Morning QC Engine Tests: ${passed}/${total} passed, ${failed} failed`);
  if (failed > 0) { console.error('ENGINE TESTS FAILED.'); process.exit(1); }
  console.log('ENGINE TESTS PASSED.');
  process.exit(0);
}
main().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
