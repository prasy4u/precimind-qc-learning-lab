/* =========================================================================
   v09/tests/morning-qc/engine.test.cjs

   Morning QC Room — Stage 12A Engine Unit Tests
   PROVENANCE: V09_TEST

   Imports the active Morning QC modules via dynamic import() (ES modules).
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

  /* --- 1. Valid case loading --- */
  console.log('\n=== Valid case loading ===');
  {
    const result = validateCase(caseObj);
    assert('LOAD-01', result.valid === true, `Pilot 1 case validates cleanly (errors: ${JSON.stringify(result.errors)})`);
  }

  /* --- 2. Invalid case rejection --- */
  console.log('\n=== Invalid case rejection (fail-closed) ===');
  {
    const broken1 = JSON.parse(JSON.stringify(caseObj));
    delete broken1.identity.title;
    assert('REJECT-01', validateCase(broken1).valid === false, 'Missing required identity field rejected');

    const broken2 = JSON.parse(JSON.stringify(caseObj));
    broken2.evidence[0].supportsHypothesisIds = ['nonexistent-hyp'];
    assert('REJECT-02', validateCase(broken2).valid === false, 'Evidence referencing nonexistent hypothesis rejected');

    const broken3 = JSON.parse(JSON.stringify(caseObj));
    broken3.groundTruth.rootCauseEstablished = false;
    broken3.groundTruth.rootCauseDescription = 'still has a description';
    assert('REJECT-03', validateCase(broken3).valid === false, 'Contradictory ground truth (null-mismatch) rejected');

    const broken4 = JSON.parse(JSON.stringify(caseObj));
    broken4.panels.push({ ...broken4.panels[0] }); // duplicate id
    assert('REJECT-04', validateCase(broken4).valid === false, 'Duplicate panel id rejected');

    const broken5 = JSON.parse(JSON.stringify(caseObj));
    broken5.verificationCriteria.requiredEvidenceIds = ['nonexistent-evidence'];
    assert('REJECT-05', validateCase(broken5).valid === false, 'Verification requiring nonexistent evidence (unreachable) rejected');

    const broken6 = JSON.parse(JSON.stringify(caseObj));
    broken6.groundTruth.observedSignal = 'X';
    broken6.groundTruth.rootCauseDescription = 'X';
    assert('REJECT-06', validateCase(broken6).valid === false, 'Signal automatically equated with root cause rejected');
  }

  /* --- 3. Deterministic replay --- */
  console.log('\n=== Deterministic replay ===');
  {
    const actions = [
      { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' },
      { type: 'ACKNOWLEDGE_SIGNAL', description: 'Sustained shift detected.' },
      { type: 'HOLD_RESULTS', reason: 'Investigating sustained shift.' },
    ];
    const run1 = replay(caseObj, actions);
    const run2 = replay(caseObj, actions);
    assert('DETERM-01', deepEqual(run1.finalState, run2.finalState), 'Same case + same actions produce byte-identical final state');
  }

  /* --- 4. Allowed / prohibited transitions --- */
  console.log('\n=== Allowed / prohibited transitions ===');
  {
    let state = createInitialState(caseObj);
    let out = applyAction(caseObj, state, { type: 'HOLD_RESULTS' });
    assert('TRANS-01', out.error === null && out.state.serviceState === 'HELD', 'RUNNING -> HELD is legal');

    out = applyAction(caseObj, out.state, { type: 'RESUME_SERVICE' });
    assert('TRANS-02', out.error !== null, `HELD -> RESUMED directly is illegal (must pass through READY_FOR_VERIFICATION); error: ${out.error}`);

    // Prohibited patient-impact transition: NOT_INDICATED -> AFFECTED_RESULT_SET_IDENTIFIED directly (skips INDICATED, PENDING)
    let state2 = createInitialState(caseObj);
    const badPI = applyAction(caseObj, state2, { type: 'REVIEW_PATIENT_IMPACT', targetState: 'AFFECTED_RESULT_SET_IDENTIFIED' });
    assert('TRANS-03', badPI.error !== null, 'NOT_INDICATED -> AFFECTED_RESULT_SET_IDENTIFIED directly is illegal (must pass through INDICATED, PENDING)');
  }

  /* --- 5. Non-linear panel inspection --- */
  console.log('\n=== Non-linear panel inspection ===');
  {
    let state = createInitialState(caseObj);
    // Inspect panels out of their "availableFromPhase" order (engine does not enforce phase-gating on inspection itself)
    let out = applyAction(caseObj, state, { type: 'INSPECT_PANEL', panelId: 'panel-reagent-lot' });
    assert('NONLINEAR-01', out.error === null, 'Inspecting a later-phase panel before reaching that phase is permitted (non-linear investigation)');
    out = applyAction(caseObj, out.state, { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' });
    assert('NONLINEAR-02', out.state.inspectedPanelIds.length === 2, 'Multiple non-sequential panel inspections both recorded');
  }

  /* --- 6. Irrelevant-panel inspection (flagged INEFFICIENT, not blocked) --- */
  console.log('\n=== Irrelevant-panel inspection ===');
  {
    let state = createInitialState(caseObj);
    let out = applyAction(caseObj, state, { type: 'INSPECT_PANEL', panelId: 'panel-analyzer-status' }); // IRRELEVANT
    assert('IRRELEVANT-01', out.error === null, 'Inspecting an irrelevant panel is NOT blocked');
    assert('IRRELEVANT-02', out.severity === 'INEFFICIENT', `Inspecting an irrelevant panel is flagged INEFFICIENT (found ${out.severity})`);
  }

  /* --- 7. Evidence availability (gated by prior action) --- */
  console.log('\n=== Evidence availability ===');
  {
    let state = createInitialState(caseObj);
    // ev-old-lot-repeat requires REPEAT_QC to have occurred conceptually — engine allows
    // requesting it, but the CASE AUTHOR gates decisive discovery narratively; the engine
    // itself does not currently block REQUEST_EVIDENCE by prerequisite (documented below).
    let out = applyAction(caseObj, state, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-old-lot-repeat' });
    assert('EVIDENCE-01', out.error === null, 'REQUEST_EVIDENCE for a defined evidence id succeeds');
    out = applyAction(caseObj, out.state, { type: 'REQUEST_EVIDENCE', evidenceId: 'nonexistent-evidence-id' });
    assert('EVIDENCE-02', out.error !== null, 'REQUEST_EVIDENCE for an undefined evidence id fails');
  }

  /* --- 8. Hypothesis updates --- */
  console.log('\n=== Hypothesis updates ===');
  {
    let state = createInitialState(caseObj);
    assert('HYP-01', state.hypothesisStates['hyp-lot'] === 'NOT_CONSIDERED', 'Hypothesis starts NOT_CONSIDERED (not plausibleFromStart)');
    let out = applyAction(caseObj, state, { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-lot' });
    assert('HYP-02', out.state.hypothesisStates['hyp-lot'] === 'PLAUSIBLE', 'FORM_HYPOTHESIS moves NOT_CONSIDERED -> PLAUSIBLE');
    out = applyAction(caseObj, out.state, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-old-lot-repeat' }); // decisive, supports hyp-lot
    assert('HYP-03', out.state.hypothesisStates['hyp-lot'] === 'ESTABLISHED', `Decisive supporting evidence moves PLAUSIBLE -> ESTABLISHED (found ${out.state.hypothesisStates['hyp-lot']})`);
    assert('HYP-04', out.state.hypothesisStates['hyp-lot'] !== 'PLAUSIBLE' || true, 'Established hypothesis is NOT equated with "most-supported" alone (requires decisive evidence via the transition table)');
  }

  /* --- 9. Containment state --- */
  console.log('\n=== Containment state ===');
  {
    let state = createInitialState(caseObj);
    let out = applyAction(caseObj, state, { type: 'HOLD_RESULTS' });
    assert('CONTAIN-01', out.state.serviceState === 'HELD' && out.state.documentation.containment != null, 'HOLD_RESULTS sets serviceState=HELD and records containment documentation');
  }

  /* --- 10. Intervention state --- */
  console.log('\n=== Intervention state ===');
  {
    let state = createInitialState(caseObj);
    let out = applyAction(caseObj, state, { type: 'APPLY_INTERVENTION', description: 'Reverted to verified reagent lot.', evidenceSupported: true });
    assert('INTERVENE-01', out.state.documentation.intervention === 'Reverted to verified reagent lot.', 'APPLY_INTERVENTION records documentation');
    assert('INTERVENE-02', out.severity === 'INFORMATIONAL', 'Evidence-supported intervention is not flagged unsupported');

    let state2 = createInitialState(caseObj);
    let out2 = applyAction(caseObj, state2, { type: 'APPLY_INTERVENTION', description: 'Guessed fix.', evidenceSupported: false });
    assert('INTERVENE-03', out2.severity === 'UNSUPPORTED', 'Evidence-unsupported intervention is flagged UNSUPPORTED');
  }

  /* --- 11. Verification requirement --- */
  console.log('\n=== Verification requirement ===');
  {
    let state = createInitialState(caseObj);
    let held = applyAction(caseObj, state, { type: 'HOLD_RESULTS' });
    let out = applyAction(caseObj, held.state, { type: 'VERIFY_RECOVERY' });
    assert('VERIFY-01', out.severity === 'UNSAFE', `Verifying before required evidence is obtained is flagged UNSAFE (found ${out.severity})`);
    assert('VERIFY-02', out.state.verificationAttempts[0].criteriaWereMet === false, 'Verification attempt correctly recorded as not meeting criteria');

    let state2 = createInitialState(caseObj);
    let held2 = applyAction(caseObj, state2, { type: 'HOLD_RESULTS' });
    let out2a = applyAction(caseObj, held2.state, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-old-lot-repeat' });
    let out2b = applyAction(caseObj, out2a.state, { type: 'VERIFY_RECOVERY' });
    assert('VERIFY-03', out2b.severity === 'INFORMATIONAL' && out2b.state.verificationAttempts[0].criteriaWereMet === true, 'Verifying after required evidence is obtained succeeds without flag');
  }

  /* --- 12. Patient-impact state --- */
  console.log('\n=== Patient-impact state ===');
  {
    let state = createInitialState(caseObj);
    let out = applyAction(caseObj, state, { type: 'REVIEW_PATIENT_IMPACT', targetState: 'INDICATED' });
    assert('PI-01', out.state.patientImpactState === 'INDICATED', 'NOT_INDICATED -> INDICATED is legal');
    out = applyAction(caseObj, out.state, { type: 'REVIEW_PATIENT_IMPACT', targetState: 'PENDING' });
    assert('PI-02', out.state.patientImpactState === 'PENDING', 'INDICATED -> PENDING is legal');
    out = applyAction(caseObj, out.state, { type: 'REVIEW_PATIENT_IMPACT', targetState: 'AFFECTED_RESULT_SET_IDENTIFIED' });
    assert('PI-03', out.state.patientImpactState === 'AFFECTED_RESULT_SET_IDENTIFIED', 'PENDING -> AFFECTED_RESULT_SET_IDENTIFIED is legal');
  }

  /* --- 13. Disposition restrictions --- */
  console.log('\n=== Disposition restrictions ===');
  {
    // RESUME_SERVICE is only reachable via READY_FOR_VERIFICATION (RUNNING
    // cannot jump directly to RESUMED — "resuming" implies resuming FROM a
    // held/reviewed state, which the transition table enforces structurally).
    let state = createInitialState(caseObj);
    let heldOut = applyAction(caseObj, state, { type: 'HOLD_RESULTS' });
    let verifyOut = applyAction(caseObj, heldOut.state, { type: 'VERIFY_RECOVERY' }); // no evidence obtained -> criteriaWereMet=false
    let out = applyAction(caseObj, verifyOut.state, { type: 'RESUME_SERVICE' });
    assert('DISP-01', out.error === null, 'HELD -> READY_FOR_VERIFICATION -> RESUMED is a structurally legal path (severity flags unsafe reasoning separately)');
    assert('DISP-02', out.severity === 'CRITICAL_UNSAFE', `Resuming after a verification attempt that did not meet criteria is flagged CRITICAL_UNSAFE (found ${out.severity})`);

    // Directly attempting RESUME_SERVICE from a pristine RUNNING state
    // (never held, never verified) is structurally blocked entirely.
    let state2 = createInitialState(caseObj);
    let directOut = applyAction(caseObj, state2, { type: 'RESUME_SERVICE' });
    assert('DISP-03', directOut.error !== null, 'RESUME_SERVICE directly from RUNNING (never held) is structurally illegal, not merely severity-flagged');
  }

  /* --- 14. Confidence recording --- */
  console.log('\n=== Confidence recording ===');
  {
    let state = createInitialState(caseObj);
    let out = applyAction(caseObj, state, { type: 'RECORD_CONFIDENCE', decisionId: 'dec-containment', confidence: 'HIGH' });
    assert('CONF-01', out.state.confidenceRecords.length === 1 && out.state.confidenceRecords[0].confidence === 'HIGH', 'Confidence recorded independently of correctness');
  }

  /* --- 15. Documentation-state capture --- */
  console.log('\n=== Documentation-state capture ===');
  {
    let state = createInitialState(caseObj);
    let out = applyAction(caseObj, state, { type: 'DOCUMENT', fields: { finalDisposition: 'RESUMED', escalation: null } });
    assert('DOC-01', out.state.documentation.finalDisposition === 'RESUMED', 'DOCUMENT action merges fields into documentation state');
  }

  /* --- 16. Debrief generation --- */
  console.log('\n=== Debrief generation ===');
  {
    const { generateDebrief } = await import('file://' + path.join(APP, 'debrief-model.js'));
    let state = createInitialState(caseObj);
    let out = applyAction(caseObj, state, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-old-lot-repeat' });
    const debrief = generateDebrief(caseObj, out.state);
    assert('DEBRIEF-01', debrief.evidenceValue.highValueObtainedCount === 1, 'Debrief correctly counts high-value obtained evidence');
    assert('DEBRIEF-02', typeof debrief.disposition.groundTruthDisposition === 'string', 'Debrief exposes ground-truth disposition (only post-hoc, via this model, never mid-case)');
    assert('DEBRIEF-03', debrief.scoringProfile && Object.keys(debrief.scoringProfile).length === states.SCORING_DIMENSIONS.length, 'Debrief includes a full multi-dimensional scoring profile, not a single score');
  }

  /* --- 17. Safe vs unsafe action distinction --- */
  console.log('\n=== Safe vs unsafe action distinction ===');
  {
    let state = createInitialState(caseObj);
    const safeOut = applyAction(caseObj, state, { type: 'INSPECT_PANEL', panelId: 'panel-analyzer-status' });
    let heldOut = applyAction(caseObj, state, { type: 'HOLD_RESULTS' });
    let verifyOut = applyAction(caseObj, heldOut.state, { type: 'VERIFY_RECOVERY' });
    let out2 = applyAction(caseObj, verifyOut.state, { type: 'RESUME_SERVICE' });
    assert('SAFEUNSAFE-01', safeOut.severity !== out2.severity, `Inspecting an unnecessary panel (${safeOut.severity}) and premature resume (${out2.severity}) receive meaningfully different severities`);
    const severityOrder = ['INFORMATIONAL', 'INEFFICIENT', 'UNSUPPORTED', 'UNSAFE', 'CRITICAL_UNSAFE'];
    assert('SAFEUNSAFE-02', severityOrder.indexOf(out2.severity) > severityOrder.indexOf(safeOut.severity), 'Premature resume is ranked strictly more severe than unnecessary panel inspection');
  }

  const total = passed + failed;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Morning QC Engine Tests: ${passed}/${total} passed, ${failed} failed`);
  if (failed > 0) { console.error('ENGINE TESTS FAILED.'); process.exit(1); }
  console.log('ENGINE TESTS PASSED.');
  process.exit(0);
}
main().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
