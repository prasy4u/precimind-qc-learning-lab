/* =========================================================================
   v09/tests/morning-qc/engine.test.cjs

   Morning QC Room — Stage 12A Engine Unit Tests
   PROVENANCE: V09_TEST
   Rewritten during the Stage 12A independent-audit FINAL ACCEPTANCE
   micro-closure: progression authority redesign (deriveUnlockedPhaseIndex,
   never gameable via a single action's nominal phase target) and
   decision-event identity model (decisionEventId, supporting legitimate
   decision revision under the REASSESS doctrine).
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
  const { createInitialState, applyAction, replay, canReturnToPhase, deriveUnlockedPhaseIndex } = await import('file://' + path.join(APP, 'engine.js'));
  const { pilot1ReagentLotShift, pilot2PbrtqcPopulationShift } = await import('file://' + path.join(APP, 'cases', 'index.js'));
  const { syntheticFixtureCase } = await import('file://' + path.join(APP, 'cases', 'synthetic-fixture.js'));
  const states = await import('file://' + path.join(APP, 'states.js'));

  const caseObj = pilot1ReagentLotShift;

  console.log('\n=== Valid case loading ===');
  {
    assert('LOAD-01', validateCase(caseObj).valid === true, 'Pilot 1 validates cleanly');
    assert('LOAD-02', validateCase(syntheticFixtureCase).valid === true, 'Synthetic fixture validates cleanly');
  }

  console.log('\n=== Invalid case rejection (fail-closed) ===');
  {
    const b1 = JSON.parse(JSON.stringify(caseObj)); delete b1.identity.title;
    assert('REJECT-01', validateCase(b1).valid === false, 'Missing required identity field rejected');
    const b7 = JSON.parse(JSON.stringify(caseObj)); b7.groundTruth.disturbanceEstablished = false; b7.groundTruth.rootCauseEstablished = true;
    assert('REJECT-07', validateCase(b7).valid === false, 'Analytical root cause without disturbance rejected');
    const b14 = JSON.parse(JSON.stringify(caseObj)); b14.evidence[0].availableOnlyAfterActionType = 'CHECK_EQA';
    assert('REJECT-14', validateCase(b14).valid === false, 'CHECK_EQA prerequisite with no EQA panel rejected');
  }

  console.log('\n=== Deterministic replay ===');
  {
    const actions = [{ type: 'ACKNOWLEDGE_SIGNAL' }, { type: 'HOLD_RESULTS' }];
    const r1 = replay(caseObj, actions);
    const r2 = replay(caseObj, actions);
    assert('DETERM-01', deepEqual(r1.finalState, r2.finalState), 'Same case + same actions produce byte-identical final state');
  }

  console.log('\n=== ACCEPTANCE CLOSURE: progression authority cannot be gamed post-acknowledgement ===');
  {
    // Exploit A: ACK -> DOCUMENT must not unlock CHARACTERISATION-or-later panels.
    let s = createInitialState(caseObj);
    let acked = applyAction(caseObj, s, { type: 'ACKNOWLEDGE_SIGNAL' });
    let doc = applyAction(caseObj, acked.state, { type: 'DOCUMENT', fields: {} });
    assert('EXPLOIT-A-01', doc.error === null, 'DOCUMENT succeeds as a limited administrative record once signal is acknowledged');
    assert('EXPLOIT-A-02', deriveUnlockedPhaseIndex(doc.state) === states.SIMULATION_PHASES.indexOf('SIGNAL_RECOGNITION'),
      `DOCUMENT does not advance the genuinely-unlocked index beyond SIGNAL_RECOGNITION (found ${deriveUnlockedPhaseIndex(doc.state)})`);
    const blockedPanel = applyAction(caseObj, doc.state, { type: 'INSPECT_PANEL', panelId: 'panel-reagent-lot' });
    assert('EXPLOIT-A-03', blockedPanel.error !== null, 'CHARACTERISATION-gated panel-reagent-lot remains BLOCKED after ACK+DOCUMENT');

    // Exploit B: ACK -> REVIEW_PATIENT_IMPACT must not unlock later panels.
    let s2 = createInitialState(caseObj);
    let acked2 = applyAction(caseObj, s2, { type: 'ACKNOWLEDGE_SIGNAL' });
    let pi = applyAction(caseObj, acked2.state, { type: 'REVIEW_PATIENT_IMPACT', targetState: 'INDICATED' });
    assert('EXPLOIT-B-01', pi.error === null, 'REVIEW_PATIENT_IMPACT succeeds as a limited administrative record');
    assert('EXPLOIT-B-02', deriveUnlockedPhaseIndex(pi.state) === states.SIMULATION_PHASES.indexOf('SIGNAL_RECOGNITION'),
      `REVIEW_PATIENT_IMPACT does not advance the genuinely-unlocked index (found ${deriveUnlockedPhaseIndex(pi.state)})`);
    const blockedPanel2 = applyAction(caseObj, pi.state, { type: 'INSPECT_PANEL', panelId: 'panel-calibration' });
    assert('EXPLOIT-B-03', blockedPanel2.error !== null, 'CHARACTERISATION-gated panel-calibration remains BLOCKED after ACK+REVIEW_PATIENT_IMPACT');

    // Exploit C: ACK -> FORM_HYPOTHESIS must be rejected (premature) rather
    // than silently unlocking HYPOTHESIS_GENERATION-and-beyond.
    let s3 = createInitialState(caseObj);
    let acked3 = applyAction(caseObj, s3, { type: 'ACKNOWLEDGE_SIGNAL' });
    const prematureHyp = applyAction(caseObj, acked3.state, { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-lot' });
    assert('EXPLOIT-C-01', prematureHyp.error !== null, 'FORM_HYPOTHESIS immediately after ACK (no genuine CHARACTERISATION progress) is REJECTED as premature');
    assert('EXPLOIT-C-02', acked3.state.hypothesisStates['hyp-lot'] === 'NOT_CONSIDERED', 'Rejected premature FORM_HYPOTHESIS leaves hypothesis state unchanged');

    // D: rejected/administrative actions never raise the unlock index.
    assert('EXPLOIT-D-01', deriveUnlockedPhaseIndex(acked3.state) === states.SIMULATION_PHASES.indexOf('SIGNAL_RECOGNITION'), 'Unlock index unaffected by the rejected FORM_HYPOTHESIS attempt');
  }

  console.log('\n=== ACCEPTANCE CLOSURE: Pilot 2 premature-disposition exploit rejected ===');
  {
    // The exact derived exploit from the audit: ACK -> generic DOCUMENT ->
    // dec-disposition/opt-continue-documented, with zero evidence obtained.
    const s = createInitialState(pilot2PbrtqcPopulationShift);
    const acked = applyAction(pilot2PbrtqcPopulationShift, s, { type: 'ACKNOWLEDGE_SIGNAL' });
    const doc = applyAction(pilot2PbrtqcPopulationShift, acked.state, { type: 'DOCUMENT', fields: {} });
    const prematureDisposition = applyAction(pilot2PbrtqcPopulationShift, doc.state, { type: 'DOCUMENT', decisionId: 'dec-disposition', optionId: 'opt-continue-documented', fields: {} });
    assert('P2EXPLOIT-01', prematureDisposition.error !== null, `dec-disposition (requires EVIDENCE_SELECTION) is REJECTED when attempted with zero evidence obtained, even via generic DOCUMENT first (error: ${prematureDisposition.error})`);
  }

  console.log('\n=== Genuine (non-gameable) progression still works via real prerequisites ===');
  {
    let s = createInitialState(caseObj);
    let acked = applyAction(caseObj, s, { type: 'ACKNOWLEDGE_SIGNAL' });
    let held = applyAction(caseObj, acked.state, { type: 'HOLD_RESULTS' });
    assert('GENUINE-01', held.state.containmentDecided === true, 'HOLD_RESULTS genuinely sets containmentDecided');
    let inspected = applyAction(caseObj, held.state, { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' });
    assert('GENUINE-02', deriveUnlockedPhaseIndex(inspected.state) === states.SIMULATION_PHASES.indexOf('CHARACTERISATION'),
      `Genuinely inspecting a panel unlocks CHARACTERISATION (found ${deriveUnlockedPhaseIndex(inspected.state)})`);
    let hyp = applyAction(caseObj, inspected.state, { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-lot' });
    assert('GENUINE-03', hyp.error === null, 'FORM_HYPOTHESIS now succeeds once CHARACTERISATION is genuinely reached');
    let panelReagent = applyAction(caseObj, hyp.state, { type: 'INSPECT_PANEL', panelId: 'panel-reagent-lot' });
    assert('GENUINE-04', panelReagent.error === null, 'CHARACTERISATION-gated panel now genuinely available');
    let ev = applyAction(caseObj, panelReagent.state, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-lot-timing' });
    assert('GENUINE-05', ev.error === null && ev.state.obtainedEvidenceIds.includes('ev-lot-timing'), 'Evidence genuinely obtainable once its source panel was inspected');
  }

  console.log('\n=== Non-linear inspection within genuinely-available information ===');
  {
    let s = createInitialState(caseObj);
    let acked = applyAction(caseObj, s, { type: 'ACKNOWLEDGE_SIGNAL' });
    let held = applyAction(caseObj, acked.state, { type: 'HOLD_RESULTS' });
    let firstPanel = applyAction(caseObj, held.state, { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' }); // unlocks CHARACTERISATION
    let orderA1 = applyAction(caseObj, firstPanel.state, { type: 'INSPECT_PANEL', panelId: 'panel-calibration' });
    let orderA2 = applyAction(caseObj, orderA1.state, { type: 'INSPECT_PANEL', panelId: 'panel-reagent-lot' });
    assert('NONLINEAR-01', orderA1.error === null && orderA2.error === null, 'Panels at the same phase inspected in either order');
    let orderB1 = applyAction(caseObj, firstPanel.state, { type: 'INSPECT_PANEL', panelId: 'panel-reagent-lot' });
    let orderB2 = applyAction(caseObj, orderB1.state, { type: 'INSPECT_PANEL', panelId: 'panel-calibration' });
    assert('NONLINEAR-02', orderB1.error === null && orderB2.error === null && orderB2.state.inspectedPanelIds.length === 3, 'Same panels, reverse order, both succeed');
  }

  console.log('\n=== Irrelevant-panel inspection ===');
  {
    let s = createInitialState(caseObj);
    let acked = applyAction(caseObj, s, { type: 'ACKNOWLEDGE_SIGNAL' });
    let out = applyAction(caseObj, acked.state, { type: 'INSPECT_PANEL', panelId: 'panel-analyzer-status' });
    assert('IRRELEVANT-01', out.error === null && out.severity === 'INEFFICIENT', 'Irrelevant panel inspection allowed, flagged INEFFICIENT');
  }

  console.log('\n=== Source-panel evidence gating ===');
  {
    let s = createInitialState(caseObj);
    let acked = applyAction(caseObj, s, { type: 'ACKNOWLEDGE_SIGNAL' });
    let held = applyAction(caseObj, acked.state, { type: 'HOLD_RESULTS' });
    let inspected = applyAction(caseObj, held.state, { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' });
    const prematureEv = applyAction(caseObj, inspected.state, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-lot-timing' });
    assert('SRCPANEL-01', prematureEv.error !== null, 'ev-lot-timing cannot be obtained without inspecting panel-reagent-lot first');
    const withPanel = applyAction(caseObj, inspected.state, { type: 'INSPECT_PANEL', panelId: 'panel-reagent-lot' });
    const nowOk = applyAction(caseObj, withPanel.state, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-lot-timing' });
    assert('SRCPANEL-02', nowOk.error === null, 'ev-lot-timing succeeds once panel-reagent-lot has actually been inspected');
  }

  console.log('\n=== Executable decision contracts ===');
  {
    let s = createInitialState(caseObj);
    let acked = applyAction(caseObj, s, { type: 'ACKNOWLEDGE_SIGNAL' });
    let out = applyAction(caseObj, acked.state, { type: 'HOLD_RESULTS', decisionId: 'dec-containment', optionId: 'opt-hold' });
    assert('CONTRACT-01', out.error === null && out.state.actionHistory[out.state.actionHistory.length - 1].decisionCategory === 'CONTAINMENT', 'Valid decision execution records decisionCategory');
    const wrongType = applyAction(caseObj, acked.state, { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-lot', decisionId: 'dec-containment', optionId: 'opt-hold' });
    assert('CONTRACT-02', wrongType.error !== null, 'Wrong action type for a decision option is REJECTED');
  }

  console.log('\n=== Genuine four-combination outcome/reasoning matrix (synthetic fixture) ===');
  {
    const fx = syntheticFixtureCase;
    let acked = applyAction(fx, createInitialState(fx), { type: 'ACKNOWLEDGE_SIGNAL' });
    let charInspected = applyAction(fx, acked.state, { type: 'INSPECT_PANEL', panelId: 'panel-a' }); // unlock CHARACTERISATION for FORM_HYPOTHESIS use
    const tt = applyAction(fx, charInspected.state, { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-x', decisionId: 'dec-tt', optionId: 'opt-tt' });
    assert('MATRIX-TT', tt.error === null && tt.outcomeAppropriate === true && tt.severity === 'INFORMATIONAL', `Combination 1 (true,true) (error: ${tt.error})`);
    const tf = applyAction(fx, charInspected.state, { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-x' }); // reach HYPOTHESIS_GENERATION first
    const tf2 = applyAction(fx, tf.state, { type: 'APPLY_INTERVENTION', decisionId: 'dec-tf', optionId: 'opt-tf', description: 'x' });
    assert('MATRIX-TF', tf2.error === null && tf2.outcomeAppropriate === true && tf2.severity === 'UNSUPPORTED', `Combination 2 (true,false) (error: ${tf2.error})`);
    const ft = applyAction(fx, acked.state, { type: 'CONTINUE_ANALYSIS', decisionId: 'dec-ft', optionId: 'opt-ft' });
    assert('MATRIX-FT', ft.error === null && ft.outcomeAppropriate === false && ft.severity === 'INFORMATIONAL', `Combination 3 (false,true) (error: ${ft.error})`);
    const ff = applyAction(fx, acked.state, { type: 'DOCUMENT', decisionId: 'dec-ff', optionId: 'opt-ff', fields: {} });
    assert('MATRIX-FF', ff.error === null && ff.outcomeAppropriate === false && ff.severity === 'CRITICAL_UNSAFE', `Combination 4 (false,false) (error: ${ff.error})`);

    const { evaluateDecision } = await import('file://' + path.join(APP, 'decision-model.js'));
    const evalTT = evaluateDecision(tt.state.actionHistory[tt.state.actionHistory.length - 1]);
    assert('MATRIX-CREDIT-01', evalTT.fullCreditEligible === true, 'fullCreditEligible true only for combination 1');
  }

  console.log('\n=== ACCEPTANCE CLOSURE: decision-event identity + revision (Defect 2) ===');
  {
    const c2 = pilot2PbrtqcPopulationShift;
    let acked = applyAction(c2, createInitialState(c2), { type: 'ACKNOWLEDGE_SIGNAL' });
    let inspected = applyAction(c2, acked.state, { type: 'INSPECT_PANEL', panelId: 'panel-pbrtqc' }); // unlock CHARACTERISATION
    // First execution: dec-take-seriously/opt-investigate (correct, outcomeAppropriate=true)
    const first = applyAction(c2, inspected.state, { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-analytical', decisionId: 'dec-take-seriously', optionId: 'opt-investigate' });
    assert('EVENT-01', first.decisionEventId === 'dec-take-seriously#1', `First execution gets stable decisionEventId (found ${first.decisionEventId})`);
    // Revision: the SAME decisionId, different option (dec-take-seriously/opt-dismiss, incorrect).
    const revised = applyAction(c2, first.state, { type: 'DOCUMENT', decisionId: 'dec-take-seriously', optionId: 'opt-dismiss', fields: {} });
    assert('EVENT-02', revised.decisionEventId === 'dec-take-seriously#2', `Revision gets a DISTINCT decisionEventId (found ${revised.decisionEventId})`);
    assert('EVENT-03', revised.outcomeAppropriate === false && revised.severity === 'UNSUPPORTED', 'Revised decision correctly flagged UNSUPPORTED/inappropriate');

    // Confidence for the FIRST (correct) event: HIGH -> well-calibrated.
    const conf1 = applyAction(c2, revised.state, { type: 'RECORD_CONFIDENCE', decisionEventId: 'dec-take-seriously#1', confidence: 'HIGH' });
    assert('EVENT-04', conf1.error === null, 'Confidence for the first decision event succeeds');
    const { computeScoringProfile } = await import('file://' + path.join(APP, 'scoring-model.js'));
    const profile1 = computeScoringProfile(c2, conf1.state);
    assert('EVENT-05', profile1.METACOGNITIVE_CALIBRATION === 'STRONG', `HIGH confidence in the CORRECT first event is well-calibrated (found ${profile1.METACOGNITIVE_CALIBRATION})`);

    // Now confidence for the SECOND (revised, incorrect) event: HIGH -> overconfident/poor.
    const conf2 = applyAction(c2, revised.state, { type: 'RECORD_CONFIDENCE', decisionEventId: 'dec-take-seriously#2', confidence: 'HIGH' });
    const profile2 = computeScoringProfile(c2, conf2.state);
    assert('EVENT-06', profile2.METACOGNITIVE_CALIBRATION !== 'STRONG', `HIGH confidence in the INCORRECT revised event is NOT well-calibrated, must not reuse the first event's correctness (found ${profile2.METACOGNITIVE_CALIBRATION})`);

    // Nonexistent decisionEventId rejected.
    const badConf = applyAction(c2, revised.state, { type: 'RECORD_CONFIDENCE', decisionEventId: 'dec-take-seriously#99', confidence: 'HIGH' });
    assert('EVENT-07', badConf.error !== null, 'Confidence referencing a nonexistent decisionEventId is REJECTED');

    // Duplicate policy: latest replaces earlier, for the SAME decisionEventId.
    const dup1 = applyAction(c2, revised.state, { type: 'RECORD_CONFIDENCE', decisionEventId: 'dec-take-seriously#1', confidence: 'HIGH' });
    const dup2 = applyAction(c2, dup1.state, { type: 'RECORD_CONFIDENCE', decisionEventId: 'dec-take-seriously#1', confidence: 'LOW' });
    assert('EVENT-08', dup2.state.confidenceRecords.length === 1 && dup2.state.confidenceRecords[0].confidence === 'LOW', 'Duplicate confidence for the SAME decisionEventId: latest replaces earlier');
    // Confidence for event #1 AND event #2 are both retained as distinct records.
    const both = applyAction(c2, conf1.state, { type: 'RECORD_CONFIDENCE', decisionEventId: 'dec-take-seriously#2', confidence: 'LOW' });
    assert('EVENT-09', both.state.confidenceRecords.length === 2, 'Confidence for two DIFFERENT decision events are both retained as separate records');
  }

  console.log('\n=== Patient-impact evidence gating ===');
  {
    let s = createInitialState(caseObj);
    let acked = applyAction(caseObj, s, { type: 'ACKNOWLEDGE_SIGNAL' });
    let o1 = applyAction(caseObj, acked.state, { type: 'REVIEW_PATIENT_IMPACT', targetState: 'INDICATED' });
    let o2 = applyAction(caseObj, o1.state, { type: 'REVIEW_PATIENT_IMPACT', targetState: 'PENDING' });
    let o3 = applyAction(caseObj, o2.state, { type: 'REVIEW_PATIENT_IMPACT', targetState: 'AFFECTED_RESULT_SET_IDENTIFIED' });
    assert('PIGATE-01', o3.error !== null, 'Terminal patient-impact state requires evidence');
    let held = applyAction(caseObj, o2.state, { type: 'HOLD_RESULTS' });
    let panel = applyAction(caseObj, held.state, { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' });
    let withEv = applyAction(caseObj, panel.state, { type: 'CHECK_PATIENT_DISTRIBUTION' });
    let withEv2 = applyAction(caseObj, withEv.state, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-affected-window' });
    let o4 = applyAction(caseObj, withEv2.state, { type: 'REVIEW_PATIENT_IMPACT', targetState: 'AFFECTED_RESULT_SET_IDENTIFIED' });
    assert('PIGATE-02', o4.error === null, 'Terminal patient-impact state succeeds once evidence genuinely obtained');
  }

  console.log('\n=== Corrected verification/service-state semantics ===');
  {
    let s = createInitialState(caseObj);
    let acked = applyAction(caseObj, s, { type: 'ACKNOWLEDGE_SIGNAL' });
    let held = applyAction(caseObj, acked.state, { type: 'HOLD_RESULTS' });
    let failedVerify = applyAction(caseObj, held.state, { type: 'VERIFY_RECOVERY' });
    assert('VERIFY-01', failedVerify.severity === 'UNSAFE' && failedVerify.state.serviceState === 'HELD', 'Failed verification flagged UNSAFE, remains HELD');
    assert('VERIFY-02', failedVerify.state.phase === 'INVESTIGATION', 'Failed verification regresses narrative phase to INVESTIGATION');
    const prematureResume = applyAction(caseObj, failedVerify.state, { type: 'RESUME_SERVICE' });
    assert('VERIFY-03', prematureResume.error !== null, 'RESUME_SERVICE from HELD (post-failed-verification) is structurally illegal');
  }

  console.log('\n=== Corrected EVIDENCE_SELECTION scoring ===');
  {
    const { computeScoringProfile } = await import('file://' + path.join(APP, 'scoring-model.js'));
    const pristineProfile = computeScoringProfile(caseObj, createInitialState(caseObj));
    assert('EVIDSEL-01', pristineProfile.EVIDENCE_SELECTION !== 'STRONG', `Pristine state not STRONG (found ${pristineProfile.EVIDENCE_SELECTION})`);
  }

  console.log('\n=== Terminal/debrief semantics explicitly deferred ===');
  {
    const state = createInitialState(caseObj);
    assert('TERMINAL-01', state.terminal === false, 'terminal starts false');
  }

  const total = passed + failed;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Morning QC Engine Tests: ${passed}/${total} passed, ${failed} failed`);
  if (failed > 0) { console.error('ENGINE TESTS FAILED.'); process.exit(1); }
  console.log('ENGINE TESTS PASSED.');
  process.exit(0);
}
main().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
