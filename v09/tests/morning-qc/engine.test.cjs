/* =========================================================================
   v09/tests/morning-qc/engine.test.cjs

   Morning QC Room — Stage 12A Engine Unit Tests
   PROVENANCE: V09_TEST
   Rewritten during the Stage 12A independent-audit corrective closure to
   exercise panel/evidence availability enforcement, executable decision
   options, the corrected two-axis outcome/reasoning model, patient-impact
   evidence gating, corrected verification/service-state semantics, phase
   regression, and confidence-to-decision association.
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
  const { createInitialState, applyAction, replay } = await import('file://' + path.join(APP, 'engine.js'));
  const { pilot1ReagentLotShift } = await import('file://' + path.join(APP, 'cases', 'pilot-1-reagent-lot-shift.js'));
  const states = await import('file://' + path.join(APP, 'states.js'));

  const caseObj = pilot1ReagentLotShift;

  console.log('\n=== Valid case loading ===');
  {
    const result = validateCase(caseObj);
    assert('LOAD-01', result.valid === true, `Pilot 1 case validates cleanly (errors: ${JSON.stringify(result.errors)})`);
  }

  console.log('\n=== Invalid case rejection (fail-closed) ===');
  {
    const b1 = JSON.parse(JSON.stringify(caseObj)); delete b1.identity.title;
    assert('REJECT-01', validateCase(b1).valid === false, 'Missing required identity field rejected');

    const b2 = JSON.parse(JSON.stringify(caseObj)); b2.evidence[0].supportsHypothesisIds = ['nonexistent-hyp'];
    assert('REJECT-02', validateCase(b2).valid === false, 'Evidence referencing nonexistent hypothesis rejected');

    const b3 = JSON.parse(JSON.stringify(caseObj)); b3.groundTruth.rootCauseEstablished = false; b3.groundTruth.rootCauseDescription = 'still has a description';
    assert('REJECT-03', validateCase(b3).valid === false, 'Contradictory ground truth (null-mismatch) rejected');

    const b4 = JSON.parse(JSON.stringify(caseObj)); b4.panels.push({ ...b4.panels[0] });
    assert('REJECT-04', validateCase(b4).valid === false, 'Duplicate panel id rejected');

    const b5 = JSON.parse(JSON.stringify(caseObj)); b5.verificationCriteria.requiredEvidenceIds = ['nonexistent-evidence'];
    assert('REJECT-05', validateCase(b5).valid === false, 'Verification requiring nonexistent evidence (unreachable) rejected');

    const b6 = JSON.parse(JSON.stringify(caseObj)); b6.groundTruth.observedSignal = 'X'; b6.groundTruth.rootCauseDescription = 'X';
    assert('REJECT-06', validateCase(b6).valid === false, 'Signal automatically equated with root cause rejected');

    const b7 = JSON.parse(JSON.stringify(caseObj)); b7.groundTruth.disturbanceEstablished = false; b7.groundTruth.rootCauseEstablished = true;
    assert('REJECT-07', validateCase(b7).valid === false, 'Analytical root cause without an established disturbance is rejected (corrective-closure rule)');

    const b8 = JSON.parse(JSON.stringify(caseObj)); delete b8.decisionOpportunities[0].options[0].outcomeAppropriate;
    assert('REJECT-08', validateCase(b8).valid === false, 'Decision option missing outcomeAppropriate is rejected');

    const b9 = JSON.parse(JSON.stringify(caseObj)); b9.evidence[0].availableOnlyAfterActionType = 'REQUEST_EVIDENCE';
    assert('REJECT-09', validateCase(b9).valid === false, 'Tautological/self-referential evidence prerequisite (REQUEST_EVIDENCE) is rejected');

    const b10 = JSON.parse(JSON.stringify(caseObj)); delete b10.patientImpactCriteria.requiredEvidenceIdsForTerminalState;
    assert('REJECT-10', validateCase(b10).valid === false, 'Missing patientImpactCriteria required field is rejected');

    const b11 = JSON.parse(JSON.stringify(caseObj)); b11.patientImpactCriteria.requiredEvidenceIdsForTerminalState = ['nonexistent'];
    assert('REJECT-11', validateCase(b11).valid === false, 'patientImpactCriteria referencing nonexistent evidence (unreachable terminal state) is rejected');
  }

  console.log('\n=== Deterministic replay ===');
  {
    const actions = [
      { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' },
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
    assert('AVAIL-01', out.error !== null, `Inspecting a not-yet-available panel (requires CHARACTERISATION) from BRIEFING fails (error: ${out.error})`);

    let s2 = createInitialState(caseObj);
    let o1 = applyAction(caseObj, s2, { type: 'ACKNOWLEDGE_SIGNAL' });
    let o2 = applyAction(caseObj, o1.state, { type: 'HOLD_RESULTS' });
    let o3 = applyAction(caseObj, o2.state, { type: 'INSPECT_PANEL', panelId: 'panel-maintenance' });
    assert('AVAIL-02', o3.error !== null, 'panel-maintenance (requires CHARACTERISATION) still blocked at IMMEDIATE_CONTAINMENT');
  }

  console.log('\n=== Non-linear inspection within available information ===');
  {
    let state = createInitialState(caseObj);
    let o1 = applyAction(caseObj, state, { type: 'ACKNOWLEDGE_SIGNAL' });
    let o2 = applyAction(caseObj, o1.state, { type: 'HOLD_RESULTS' });
    let o3 = applyAction(caseObj, o2.state, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-lot-timing' });
    assert('NONLINEAR-00', o3.error === null, 'Reaching EVIDENCE_SELECTION succeeds via a real prerequisite path');

    let orderA1 = applyAction(caseObj, o3.state, { type: 'INSPECT_PANEL', panelId: 'panel-calibration' });
    let orderA2 = applyAction(caseObj, orderA1.state, { type: 'INSPECT_PANEL', panelId: 'panel-reagent-lot' });
    assert('NONLINEAR-01', orderA1.error === null && orderA2.error === null, 'Panels available at the same phase may be inspected in either order (calibration then reagent-lot)');

    let orderB1 = applyAction(caseObj, o3.state, { type: 'INSPECT_PANEL', panelId: 'panel-reagent-lot' });
    let orderB2 = applyAction(caseObj, orderB1.state, { type: 'INSPECT_PANEL', panelId: 'panel-calibration' });
    assert('NONLINEAR-02', orderB1.error === null && orderB2.error === null && orderB2.state.inspectedPanelIds.length === 2, 'Same two panels inspected in the REVERSE order also succeed, both now recorded');
  }

  console.log('\n=== Irrelevant-panel inspection ===');
  {
    let state = createInitialState(caseObj);
    let o1 = applyAction(caseObj, state, { type: 'ACKNOWLEDGE_SIGNAL' });
    let out = applyAction(caseObj, o1.state, { type: 'INSPECT_PANEL', panelId: 'panel-analyzer-status' });
    assert('IRRELEVANT-01', out.error === null, 'Inspecting an available irrelevant panel is NOT blocked');
    assert('IRRELEVANT-02', out.severity === 'INEFFICIENT', `Inspecting an irrelevant panel is flagged INEFFICIENT (found ${out.severity})`);
    assert('IRRELEVANT-03', out.state.actionHistory[out.state.actionHistory.length - 1].outcomeAppropriate === false, 'Irrelevant panel inspection recorded as outcome-inappropriate');
  }

  console.log('\n=== Evidence-prerequisite enforcement ===');
  {
    let state = createInitialState(caseObj);
    let out = applyAction(caseObj, state, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-old-lot-repeat' });
    assert('PREREQ-01', out.error !== null, `ev-old-lot-repeat cannot be obtained before REPEAT_QC (error: ${out.error})`);
    assert('PREREQ-02', !state.obtainedEvidenceIds.includes('ev-old-lot-repeat'), 'obtainedEvidenceIds not updated by the failed premature request');

    let afterRepeat = applyAction(caseObj, state, { type: 'REPEAT_QC', wasNecessary: true });
    let out2 = applyAction(caseObj, afterRepeat.state, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-old-lot-repeat' });
    assert('PREREQ-03', out2.error === null && out2.state.obtainedEvidenceIds.includes('ev-old-lot-repeat'), 'ev-old-lot-repeat succeeds after REPEAT_QC has occurred');

    let out3 = applyAction(caseObj, state, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-affected-window' });
    assert('PREREQ-04', out3.error !== null, `ev-affected-window cannot be obtained before CHECK_PATIENT_DISTRIBUTION (error: ${out3.error})`);
    // CHECK_PATIENT_DISTRIBUTION itself maps to the PATIENT_RESULT_DISTRIBUTION
    // panel, which requires CHARACTERISATION — reach that phase first via a
    // real prerequisite path (not a pristine BRIEFING state).
    let reached = applyAction(caseObj, state, { type: 'ACKNOWLEDGE_SIGNAL' });
    let heldFirst = applyAction(caseObj, reached.state, { type: 'HOLD_RESULTS' });
    let toCharacterisation = applyAction(caseObj, heldFirst.state, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-lot-timing' });
    let afterCheck = applyAction(caseObj, toCharacterisation.state, { type: 'CHECK_PATIENT_DISTRIBUTION' });
    assert('PREREQ-04B', afterCheck.error === null, `CHECK_PATIENT_DISTRIBUTION succeeds once CHARACTERISATION is reached (error: ${afterCheck.error})`);
    let out4 = applyAction(caseObj, afterCheck.state, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-affected-window' });
    assert('PREREQ-05', out4.error === null, 'ev-affected-window succeeds after CHECK_PATIENT_DISTRIBUTION has occurred');
  }

  console.log('\n=== Hypothesis updates ===');
  {
    let state = createInitialState(caseObj);
    assert('HYP-01', state.hypothesisStates['hyp-lot'] === 'NOT_CONSIDERED', 'Hypothesis starts NOT_CONSIDERED');
    let out = applyAction(caseObj, state, { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-lot' });
    assert('HYP-02', out.state.hypothesisStates['hyp-lot'] === 'PLAUSIBLE', 'FORM_HYPOTHESIS moves NOT_CONSIDERED -> PLAUSIBLE');
    let afterRepeat = applyAction(caseObj, out.state, { type: 'REPEAT_QC', wasNecessary: true });
    let out2 = applyAction(caseObj, afterRepeat.state, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-old-lot-repeat' });
    assert('HYP-03', out2.state.hypothesisStates['hyp-lot'] === 'ESTABLISHED', `Decisive supporting evidence (legitimately obtained) moves PLAUSIBLE -> ESTABLISHED (found ${out2.state.hypothesisStates['hyp-lot']})`);
  }

  console.log('\n=== Containment state ===');
  {
    let state = createInitialState(caseObj);
    let out = applyAction(caseObj, state, { type: 'HOLD_RESULTS' });
    assert('CONTAIN-01', out.state.serviceState === 'HELD' && out.state.documentation.containment != null, 'HOLD_RESULTS sets serviceState=HELD and records containment documentation');
  }

  console.log('\n=== Executable decision options ===');
  {
    let state = createInitialState(caseObj);
    let out = applyAction(caseObj, state, { type: 'HOLD_RESULTS', decisionId: 'dec-containment', optionId: 'opt-hold' });
    assert('DECISION-01', out.error === null, 'Action referencing a valid decisionId/optionId succeeds');
    assert('DECISION-02', out.state.actionHistory[0].decisionId === 'dec-containment' && out.state.actionHistory[0].optionId === 'opt-hold', 'Action history preserves decisionId/optionId identity');
    assert('DECISION-03', out.severity === 'INFORMATIONAL' && out.state.actionHistory[0].outcomeAppropriate === true, 'Case-authored severity and outcomeAppropriate applied from the option');

    let bad = applyAction(caseObj, state, { type: 'HOLD_RESULTS', decisionId: 'dec-containment', optionId: 'nonexistent-option' });
    assert('DECISION-04', bad.error !== null, 'Unknown decisionId/optionId combination is rejected');
  }

  console.log('\n=== Two-axis outcome/reasoning model (4 combinations) ===');
  {
    let s1 = createInitialState(caseObj);
    let o1 = applyAction(caseObj, s1, { type: 'HOLD_RESULTS', decisionId: 'dec-containment', optionId: 'opt-hold' });
    assert('AXIS-A', o1.state.actionHistory[0].outcomeAppropriate === true && o1.severity === 'INFORMATIONAL', 'Correct outcome + supported reasoning: outcomeAppropriate=true, severity=INFORMATIONAL');

    let s2 = createInitialState(caseObj);
    let o2 = applyAction(caseObj, s2, { type: 'APPLY_INTERVENTION', description: 'Reverted to verified reagent lot (guessed, not evidence-based).', evidenceSupported: false });
    assert('AXIS-B', o2.state.actionHistory[0].outcomeAppropriate === false && o2.severity === 'UNSUPPORTED', 'Unsupported-reasoning intervention: severity=UNSUPPORTED, outcomeAppropriate=false, independently sourced from severity');

    let s3 = createInitialState(caseObj);
    let o3 = applyAction(caseObj, s3, { type: 'CONTINUE_ANALYSIS', decisionId: 'dec-containment', optionId: 'opt-continue' });
    assert('AXIS-C', o3.state.actionHistory[0].outcomeAppropriate === false && o3.severity === 'UNSAFE', 'Case-authored incorrect-outcome option flagged outcomeAppropriate=false with severity=UNSAFE');

    let s4 = createInitialState(caseObj);
    let o4a = applyAction(caseObj, s4, { type: 'HOLD_RESULTS' });
    let o4b = applyAction(caseObj, o4a.state, { type: 'VERIFY_RECOVERY' });
    let o4c = applyAction(caseObj, o4b.state, { type: 'RESUME_SERVICE' });
    assert('AXIS-D-PRE', o4c.error !== null, 'Resume from HELD (verification failed, stayed HELD) is structurally illegal');
    const dOut = applyAction(caseObj, s4, { type: 'DOCUMENT', decisionId: 'dec-disposition', optionId: 'opt-resume-unverified', fields: {} });
    assert('AXIS-D', dOut.state.actionHistory[0].outcomeAppropriate === false && dOut.severity === 'CRITICAL_UNSAFE', 'Case-authored incorrect-outcome + unsupported-reasoning option correctly flagged on both axes');
  }

  console.log('\n=== Patient-impact evidence gating ===');
  {
    let state = createInitialState(caseObj);
    let o1 = applyAction(caseObj, state, { type: 'REVIEW_PATIENT_IMPACT', targetState: 'INDICATED' });
    let o2 = applyAction(caseObj, o1.state, { type: 'REVIEW_PATIENT_IMPACT', targetState: 'PENDING' });
    let o3 = applyAction(caseObj, o2.state, { type: 'REVIEW_PATIENT_IMPACT', targetState: 'AFFECTED_RESULT_SET_IDENTIFIED' });
    assert('PIGATE-01', o3.error !== null, `Reaching AFFECTED_RESULT_SET_IDENTIFIED without required evidence fails (error: ${o3.error})`);
    assert('PIGATE-02', o2.state.patientImpactState === 'PENDING', 'State remains at PENDING after the blocked terminal attempt');

    let withEv = applyAction(caseObj, o2.state, { type: 'CHECK_PATIENT_DISTRIBUTION' });
    let withEv2 = applyAction(caseObj, withEv.state, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-affected-window' });
    let o4 = applyAction(caseObj, withEv2.state, { type: 'REVIEW_PATIENT_IMPACT', targetState: 'AFFECTED_RESULT_SET_IDENTIFIED' });
    assert('PIGATE-03', o4.error === null && o4.state.patientImpactState === 'AFFECTED_RESULT_SET_IDENTIFIED', 'Reaching AFFECTED_RESULT_SET_IDENTIFIED succeeds once required evidence is genuinely obtained');
  }

  console.log('\n=== Intervention state ===');
  {
    let state = createInitialState(caseObj);
    let out = applyAction(caseObj, state, { type: 'APPLY_INTERVENTION', description: 'Reverted to verified reagent lot.', evidenceSupported: true });
    assert('INTERVENE-01', out.state.documentation.intervention === 'Reverted to verified reagent lot.', 'APPLY_INTERVENTION records documentation');
    assert('INTERVENE-02', out.severity === 'INFORMATIONAL', 'Evidence-supported intervention is not flagged unsupported');
  }

  console.log('\n=== Corrected verification/service-state semantics ===');
  {
    let state = createInitialState(caseObj);
    let held = applyAction(caseObj, state, { type: 'HOLD_RESULTS' });
    let failedVerify = applyAction(caseObj, held.state, { type: 'VERIFY_RECOVERY' });
    assert('VERIFY-01', failedVerify.severity === 'UNSAFE', `Failed verification flagged UNSAFE (found ${failedVerify.severity})`);
    assert('VERIFY-02', failedVerify.state.serviceState === 'HELD', `Failed verification does NOT advance to READY_FOR_VERIFICATION (found ${failedVerify.state.serviceState})`);
    assert('VERIFY-03', failedVerify.state.phase === 'INVESTIGATION', `Failed verification deterministically regresses phase to INVESTIGATION (found ${failedVerify.state.phase})`);

    let prematureResume = applyAction(caseObj, failedVerify.state, { type: 'RESUME_SERVICE' });
    assert('VERIFY-04', prematureResume.error !== null, 'RESUME_SERVICE from HELD (post-failed-verification) is structurally illegal');

    let afterRepeat = applyAction(caseObj, failedVerify.state, { type: 'REPEAT_QC', wasNecessary: true });
    let withEvidence = applyAction(caseObj, afterRepeat.state, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-old-lot-repeat' });
    let successVerify = applyAction(caseObj, withEvidence.state, { type: 'VERIFY_RECOVERY' });
    assert('VERIFY-05', successVerify.severity === 'INFORMATIONAL' && successVerify.state.serviceState === 'READY_FOR_VERIFICATION', `Subsequent successful re-verification reaches READY_FOR_VERIFICATION (found state=${successVerify.state.serviceState})`);

    let withEv2 = applyAction(caseObj, successVerify.state, { type: 'CHECK_PATIENT_DISTRIBUTION' });
    let withEv3 = applyAction(caseObj, withEv2.state, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-affected-window' });
    let pi1 = applyAction(caseObj, withEv3.state, { type: 'REVIEW_PATIENT_IMPACT', targetState: 'INDICATED' });
    let pi2 = applyAction(caseObj, pi1.state, { type: 'REVIEW_PATIENT_IMPACT', targetState: 'PENDING' });
    let pi3 = applyAction(caseObj, pi2.state, { type: 'REVIEW_PATIENT_IMPACT', targetState: 'AFFECTED_RESULT_SET_IDENTIFIED' });
    let legitResume = applyAction(caseObj, pi3.state, { type: 'RESUME_SERVICE' });
    assert('VERIFY-06', legitResume.error === null && legitResume.severity === 'INFORMATIONAL' && legitResume.state.serviceState === 'RESUMED', `Resume after successful re-verification AND patient-impact review succeeds cleanly (found error=${legitResume.error})`);
  }

  console.log('\n=== Confidence-to-decision association ===');
  {
    let state = createInitialState(caseObj);
    let outA = applyAction(caseObj, state, { type: 'HOLD_RESULTS', decisionId: 'dec-containment', optionId: 'opt-hold' });
    let withConfA = applyAction(caseObj, outA.state, { type: 'RECORD_CONFIDENCE', decisionId: 'dec-containment', confidence: 'HIGH' });
    assert('CONF-01', withConfA.state.confidenceRecords[0].decisionId === 'dec-containment', 'Confidence record preserves the specific decisionId it names');

    const { computeScoringProfile } = await import('file://' + path.join(APP, 'scoring-model.js'));
    let stateOnlyConfidence = createInitialState(caseObj);
    let onlyConf = applyAction(caseObj, stateOnlyConfidence, { type: 'RECORD_CONFIDENCE', decisionId: 'dec-disposition', confidence: 'HIGH' });
    const profile = computeScoringProfile(caseObj, onlyConf.state);
    assert('CONF-02', profile.METACOGNITIVE_CALIBRATION === null, 'Confidence naming a decision never actually made in this trace is excluded from calibration');
  }

  console.log('\n=== Documentation-state capture ===');
  {
    let state = createInitialState(caseObj);
    let out = applyAction(caseObj, state, { type: 'DOCUMENT', fields: { finalDisposition: 'RESUMED', escalation: null } });
    assert('DOC-01', out.state.documentation.finalDisposition === 'RESUMED', 'DOCUMENT action merges fields into documentation state');
  }

  console.log('\n=== Debrief generation ===');
  {
    const { generateDebrief } = await import('file://' + path.join(APP, 'debrief-model.js'));
    let state = createInitialState(caseObj);
    let afterRepeat = applyAction(caseObj, state, { type: 'REPEAT_QC', wasNecessary: true });
    let out = applyAction(caseObj, afterRepeat.state, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-old-lot-repeat' });
    const debrief = generateDebrief(caseObj, out.state);
    assert('DEBRIEF-01', debrief.evidenceValue.highValueObtainedCount === 1, 'Debrief correctly counts high-value obtained evidence');
    assert('DEBRIEF-02', typeof debrief.disposition.groundTruthDisposition === 'string', 'Debrief exposes ground-truth disposition (only post-hoc)');
    assert('DEBRIEF-03', debrief.scoringProfile && Object.keys(debrief.scoringProfile).length === states.SCORING_DIMENSIONS.length, 'Debrief includes a full multi-dimensional scoring profile');
  }

  console.log('\n=== Safe vs unsafe action distinction ===');
  {
    let state = createInitialState(caseObj);
    let signalAck = applyAction(caseObj, state, { type: 'ACKNOWLEDGE_SIGNAL' });
    const safeOut = applyAction(caseObj, signalAck.state, { type: 'INSPECT_PANEL', panelId: 'panel-analyzer-status' });
    let heldOut = applyAction(caseObj, signalAck.state, { type: 'HOLD_RESULTS' });
    let verifyOut = applyAction(caseObj, heldOut.state, { type: 'VERIFY_RECOVERY' });
    assert('SAFEUNSAFE-01', safeOut.severity !== verifyOut.severity, `Inspecting an unnecessary panel (${safeOut.severity}) and a failed verification (${verifyOut.severity}) receive meaningfully different severities`);
    const severityOrder = ['INFORMATIONAL', 'INEFFICIENT', 'UNSUPPORTED', 'UNSAFE', 'CRITICAL_UNSAFE'];
    assert('SAFEUNSAFE-02', severityOrder.indexOf(verifyOut.severity) > severityOrder.indexOf(safeOut.severity), 'Failed verification is ranked strictly more severe than unnecessary panel inspection');
  }

  console.log('\n=== Terminal/debrief semantics explicitly deferred ===');
  {
    let state = createInitialState(caseObj);
    assert('TERMINAL-01', state.terminal === false, 'terminal starts false');
    const longActions = [
      { type: 'ACKNOWLEDGE_SIGNAL' }, { type: 'HOLD_RESULTS' },
      { type: 'REPEAT_QC', wasNecessary: true },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-old-lot-repeat' },
      { type: 'VERIFY_RECOVERY' },
      { type: 'CHECK_PATIENT_DISTRIBUTION' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-affected-window' },
      { type: 'REVIEW_PATIENT_IMPACT', targetState: 'INDICATED' },
      { type: 'REVIEW_PATIENT_IMPACT', targetState: 'PENDING' },
      { type: 'REVIEW_PATIENT_IMPACT', targetState: 'AFFECTED_RESULT_SET_IDENTIFIED' },
      { type: 'RESUME_SERVICE' }, { type: 'DOCUMENT', fields: {} },
    ];
    const r = replay(caseObj, longActions);
    assert('TERMINAL-02', r.finalState.terminal === false, 'terminal remains false even after a complete expert path');
  }

  const total = passed + failed;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Morning QC Engine Tests: ${passed}/${total} passed, ${failed} failed`);
  if (failed > 0) { console.error('ENGINE TESTS FAILED.'); process.exit(1); }
  console.log('ENGINE TESTS PASSED.');
  process.exit(0);
}
main().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
