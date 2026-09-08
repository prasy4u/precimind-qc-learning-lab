/* =========================================================================
   v09/tests/morning-qc/progression-invariants.test.cjs

   Morning QC Room — Stage 12A Progression-Invariant Adversarial Test Layer
   PROVENANCE: V09_TEST

   Created during the Stage 12A PROGRESSION-INVARIANT closure. Tests the
   ROOT ARCHITECTURE of deriveUnlockedPhaseIndex() directly — for every
   progression-driving state fact it consumes, demonstrates (1) how it is
   legitimately earned, (2) what lower-level prerequisites are required,
   and (3) that it cannot be generated prematurely to leapfrog the
   unlocked frontier. This is deliberately broader than named-exploit
   regression tests: it exercises the prerequisite-qualified CHAIN model
   itself, not just the four examples the audit demonstrated.
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
  const { createInitialState, applyAction, deriveUnlockedPhaseIndex } = await import('file://' + path.join(APP, 'engine.js'));
  const { pilot1ReagentLotShift, pilot2PbrtqcPopulationShift, pilot3RcvPatientImpact } = await import('file://' + path.join(APP, 'cases', 'index.js'));

  const P1 = pilot1ReagentLotShift, P2 = pilot2PbrtqcPopulationShift, P3 = pilot3RcvPatientImpact;
  const IDX = {
    BRIEFING: 0, SCAN: 1, SIGNAL_RECOGNITION: 2, IMMEDIATE_CONTAINMENT: 3, CHARACTERISATION: 4,
    HYPOTHESIS_GENERATION: 5, EVIDENCE_SELECTION: 6, INVESTIGATION: 7, INTERVENTION: 8,
    VERIFICATION: 9, PATIENT_IMPACT_REVIEW: 10, RESUME_OR_HOLD: 11,
  };

  /* ===================== SIGNAL_RECOGNITION ===================== */
  console.log('\n=== SIGNAL_RECOGNITION: earned only by genuine ACKNOWLEDGE_SIGNAL ===');
  {
    const s = createInitialState(P1);
    assert('SIG-01', deriveUnlockedPhaseIndex(s) === IDX.BRIEFING, 'Pristine state: unlocked index is BRIEFING (0)');
    const acked = applyAction(P1, s, { type: 'ACKNOWLEDGE_SIGNAL' });
    assert('SIG-02', acked.error === null && deriveUnlockedPhaseIndex(acked.state) === IDX.SIGNAL_RECOGNITION, 'Genuine ACKNOWLEDGE_SIGNAL earns SIGNAL_RECOGNITION');
    assert('SIG-03', deriveUnlockedPhaseIndex(s) === IDX.BRIEFING, 'Original (pre-action) state remains unmutated at BRIEFING (pure function, no side effects)');
  }

  /* ===================== IMMEDIATE_CONTAINMENT ===================== */
  console.log('\n=== IMMEDIATE_CONTAINMENT: requires signal + genuine containment decision ===');
  {
    const s = createInitialState(P1);
    // Premature: HOLD_RESULTS before ACK is blocked by the signal guard entirely.
    const prematureHold = applyAction(P1, s, { type: 'HOLD_RESULTS' });
    assert('CONT-01', prematureHold.error !== null, 'HOLD_RESULTS before ACKNOWLEDGE_SIGNAL is rejected outright (cannot earn IMMEDIATE_CONTAINMENT without SIGNAL_RECOGNITION first)');
    const acked = applyAction(P1, s, { type: 'ACKNOWLEDGE_SIGNAL' });
    const held = applyAction(P1, acked.state, { type: 'HOLD_RESULTS' });
    assert('CONT-02', held.error === null && deriveUnlockedPhaseIndex(held.state) === IDX.IMMEDIATE_CONTAINMENT, 'Genuine ACK + HOLD_RESULTS earns IMMEDIATE_CONTAINMENT');
    assert('CONT-03', held.state.containmentDecided === true, 'containmentDecided flag genuinely set by the containment action, not inferred elsewhere');
  }

  /* ===================== CHARACTERISATION ===================== */
  console.log('\n=== CHARACTERISATION: requires signal + genuine panel inspection (NOT containment) ===');
  {
    // Exploit 4 (BRIEFING panel before signal): panel-pbrtqc is BRIEFING-tier
    // and may be legitimately inspected pre-signal, but must NOT unlock
    // CHARACTERISATION by itself.
    const s2 = createInitialState(P2);
    const briefingPanel = applyAction(P2, s2, { type: 'INSPECT_PANEL', panelId: 'panel-pbrtqc' });
    assert('CHAR-01', briefingPanel.error === null, 'Legitimate BRIEFING-tier panel inspection is permitted before signal acknowledgement');
    assert('CHAR-02', deriveUnlockedPhaseIndex(briefingPanel.state) === IDX.BRIEFING, 'That inspection alone does NOT unlock CHARACTERISATION (still BRIEFING, since signal not yet acknowledged)');

    // ACK alone (fresh state, no prior panel inspection) must also not reach CHARACTERISATION.
    const freshState = createInitialState(P2);
    const ackOnly = applyAction(P2, freshState, { type: 'ACKNOWLEDGE_SIGNAL' });
    assert('CHAR-03', deriveUnlockedPhaseIndex(ackOnly.state) === IDX.SIGNAL_RECOGNITION, 'ACK alone (fresh state, no panel ever inspected) reaches only SIGNAL_RECOGNITION, not CHARACTERISATION');

    // Genuine: ACK + a (any) panel inspection reaches CHARACTERISATION,
    // documented as NOT requiring containment first (Pilot 3 never contains).
    const genuinePanel = applyAction(P2, ackOnly.state, { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' });
    assert('CHAR-04', deriveUnlockedPhaseIndex(genuinePanel.state) === IDX.CHARACTERISATION, 'ACK + genuine panel inspection (post-signal) legitimately earns CHARACTERISATION');

    // Pilot 3 confirms characterisation is reachable WITHOUT any containment
    // decision at all (no analytical disturbance in that case).
    const s3 = createInitialState(P3);
    const a1 = applyAction(P3, s3, { type: 'ACKNOWLEDGE_SIGNAL' });
    const a2 = applyAction(P3, a1.state, { type: 'INSPECT_PANEL', panelId: 'panel-patient-distribution' });
    assert('CHAR-05', a2.state.containmentDecided === false && deriveUnlockedPhaseIndex(a2.state) === IDX.CHARACTERISATION, 'Pilot 3: CHARACTERISATION reached genuinely without any containment decision (documented design: containment is not a CHARACTERISATION prerequisite)');
  }

  /* ===================== HYPOTHESIS_GENERATION ===================== */
  console.log('\n=== HYPOTHESIS_GENERATION: requires genuine CHARACTERISATION + learner consideration ===');
  {
    const s = createInitialState(P1);
    const acked = applyAction(P1, s, { type: 'ACKNOWLEDGE_SIGNAL' });
    // Premature: FORM_HYPOTHESIS before any panel inspected is rejected
    // (cannot earn HYPOTHESIS_GENERATION without CHARACTERISATION first).
    const prematureHyp = applyAction(P1, acked.state, { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-lot' });
    assert('HYP-01', prematureHyp.error !== null, 'FORM_HYPOTHESIS before genuine CHARACTERISATION is rejected');
    const panel = applyAction(P1, acked.state, { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' });
    const hyp = applyAction(P1, panel.state, { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-lot' });
    assert('HYP-02', hyp.error === null && deriveUnlockedPhaseIndex(hyp.state) === IDX.HYPOTHESIS_GENERATION, 'Genuine CHARACTERISATION + FORM_HYPOTHESIS earns HYPOTHESIS_GENERATION');
  }

  /* ===================== EVIDENCE_SELECTION ===================== */
  console.log('\n=== EVIDENCE_SELECTION: requires genuine CHARACTERISATION + evidence obtained ===');
  {
    const s = createInitialState(P3);
    const acked = applyAction(P3, s, { type: 'ACKNOWLEDGE_SIGNAL' });
    // ev-rcv-calculation has sourcePanelId=null AND availableOnlyAfterActionType=null
    // (no per-evidence prerequisite) — but REQUEST_EVIDENCE itself still
    // carries the CHARACTERISATION execution prerequisite, so it cannot
    // leapfrog EVIDENCE_SELECTION from a pristine post-ACK state either.
    const prematureEv = applyAction(P3, acked.state, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-rcv-calculation' });
    assert('EVID-01', prematureEv.error !== null, 'REQUEST_EVIDENCE before genuine CHARACTERISATION is rejected, even for evidence with no other declared prerequisite');
    const panel = applyAction(P3, acked.state, { type: 'INSPECT_PANEL', panelId: 'panel-patient-distribution' });
    const ev = applyAction(P3, panel.state, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-rcv-calculation' });
    assert('EVID-02', ev.error === null && deriveUnlockedPhaseIndex(ev.state) === IDX.EVIDENCE_SELECTION, 'Genuine CHARACTERISATION + REQUEST_EVIDENCE earns EVIDENCE_SELECTION');
  }

  /* ===================== INVESTIGATION (REPEAT_QC / REPEAT_CALIBRATION) ===================== */
  console.log('\n=== INVESTIGATION: REPEAT_QC/REPEAT_CALIBRATION require genuine CHARACTERISATION ===');
  {
    const s = createInitialState(P1);
    const pristineQc = applyAction(P1, s, { type: 'REPEAT_QC', wasNecessary: true });
    assert('INVEST-01', pristineQc.error !== null, 'REPEAT_QC from pristine BRIEFING is rejected outright');
    assert('INVEST-02', s.documentation.investigationPerformed.length === 0, 'Rejected attempt does not populate investigationPerformed');
    assert('INVEST-03', deriveUnlockedPhaseIndex(s) === IDX.BRIEFING, 'Rejected attempt does not change the unlock frontier');

    const pristineCal = applyAction(P1, s, { type: 'REPEAT_CALIBRATION', wasNecessary: true });
    assert('INVEST-04', pristineCal.error !== null, 'REPEAT_CALIBRATION from pristine BRIEFING is rejected outright');

    // ACK alone (no panel) also insufficient.
    const acked = applyAction(P1, s, { type: 'ACKNOWLEDGE_SIGNAL' });
    const ackOnlyQc = applyAction(P1, acked.state, { type: 'REPEAT_QC', wasNecessary: true });
    assert('INVEST-05', ackOnlyQc.error !== null, 'REPEAT_QC after ACK alone (no panel inspected) is still rejected');

    // Genuine: ACK + panel + REPEAT_QC.
    const panel = applyAction(P1, acked.state, { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' });
    const genuineQc = applyAction(P1, panel.state, { type: 'REPEAT_QC', wasNecessary: true });
    assert('INVEST-06', genuineQc.error === null && deriveUnlockedPhaseIndex(genuineQc.state) === IDX.INVESTIGATION, 'Genuine CHARACTERISATION + REPEAT_QC legitimately earns INVESTIGATION');
    const genuineCal = applyAction(P1, panel.state, { type: 'REPEAT_CALIBRATION', wasNecessary: true });
    assert('INVEST-07', genuineCal.error === null && deriveUnlockedPhaseIndex(genuineCal.state) === IDX.INVESTIGATION, 'Genuine CHARACTERISATION + REPEAT_CALIBRATION legitimately earns INVESTIGATION');
  }

  /* ===================== INTERVENTION ===================== */
  console.log('\n=== INTERVENTION: requires genuine HYPOTHESIS_GENERATION ===');
  {
    const s = createInitialState(P1);
    const acked = applyAction(P1, s, { type: 'ACKNOWLEDGE_SIGNAL' });
    const prematureIntervention = applyAction(P1, acked.state, { type: 'APPLY_INTERVENTION', description: 'x', evidenceSupported: true });
    assert('INTERV-01', prematureIntervention.error !== null, 'APPLY_INTERVENTION before genuine HYPOTHESIS_GENERATION is rejected');
    const panel = applyAction(P1, acked.state, { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' });
    const hyp = applyAction(P1, panel.state, { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-lot' });
    const intervention = applyAction(P1, hyp.state, { type: 'APPLY_INTERVENTION', description: 'x', evidenceSupported: true });
    assert('INTERV-02', intervention.error === null && deriveUnlockedPhaseIndex(intervention.state) === IDX.INTERVENTION, 'Genuine HYPOTHESIS_GENERATION + APPLY_INTERVENTION legitimately earns INTERVENTION');
  }

  /* ===================== VERIFICATION (failed vs successful) ===================== */
  console.log('\n=== VERIFICATION: failed attempt must NOT unlock; only genuine success does ===');
  {
    const s = createInitialState(P1);
    const acked = applyAction(P1, s, { type: 'ACKNOWLEDGE_SIGNAL' });
    const held = applyAction(P1, acked.state, { type: 'HOLD_RESULTS' });
    const panel = applyAction(P1, held.state, { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' });
    const failedVerify = applyAction(P1, panel.state, { type: 'VERIFY_RECOVERY' });
    assert('VERIF-01', failedVerify.state.verificationAttempts.length === 1 && failedVerify.state.verificationAttempts[0].criteriaWereMet === false, 'Failed attempt IS recorded in verificationAttempts (for history/debrief)');
    assert('VERIF-02', deriveUnlockedPhaseIndex(failedVerify.state) === IDX.CHARACTERISATION, 'Failed attempt does NOT unlock VERIFICATION — frontier remains at CHARACTERISATION (the highest genuinely-earned tier in this path, since a panel was inspected before the failed attempt)');
    assert('VERIF-03', failedVerify.state.phase === 'INVESTIGATION' && deriveUnlockedPhaseIndex(failedVerify.state) < IDX.VERIFICATION, 'Narrative phase reports INVESTIGATION regression while unlock frontier correctly does NOT include VERIFICATION — no contradiction between the two');

    // Later panels requiring VERIFICATION (if any existed) would remain
    // blocked; demonstrate via a synthetic phase-index comparison since no
    // pilot panel currently uses VERIFICATION as availableFromPhase.
    assert('VERIF-04', IDX.VERIFICATION > deriveUnlockedPhaseIndex(failedVerify.state), 'VERIFICATION-tier information remains genuinely locked after a failed attempt');

    // Genuine: obtain required evidence, then succeed.
    const afterRepeat = applyAction(P1, failedVerify.state, { type: 'REPEAT_QC', wasNecessary: true });
    const withEvidence = applyAction(P1, afterRepeat.state, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-old-lot-repeat' });
    const successVerify = applyAction(P1, withEvidence.state, { type: 'VERIFY_RECOVERY' });
    assert('VERIF-05', successVerify.state.verificationAttempts.some(v => v.criteriaWereMet === true), 'A successful attempt (criteriaWereMet=true) is genuinely recorded');
    assert('VERIF-06', deriveUnlockedPhaseIndex(successVerify.state) === IDX.VERIFICATION, 'Only the GENUINE success unlocks VERIFICATION');
  }

  /* ===================== RESUME_OR_HOLD ===================== */
  console.log('\n=== RESUME_OR_HOLD: requires genuine service resumption/escalation ===');
  {
    const s = createInitialState(P1);
    const acked = applyAction(P1, s, { type: 'ACKNOWLEDGE_SIGNAL' });
    const held = applyAction(P1, acked.state, { type: 'HOLD_RESULTS' });
    const panel = applyAction(P1, held.state, { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' });
    const repeat = applyAction(P1, panel.state, { type: 'REPEAT_QC', wasNecessary: true });
    const ev = applyAction(P1, repeat.state, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-old-lot-repeat' });
    const verify = applyAction(P1, ev.state, { type: 'VERIFY_RECOVERY' });
    assert('RESUME-01', deriveUnlockedPhaseIndex(verify.state) === IDX.VERIFICATION, 'Prior to resume: frontier is VERIFICATION, not yet RESUME_OR_HOLD');
    const panel2 = applyAction(P1, verify.state, { type: 'CHECK_PATIENT_DISTRIBUTION' });
    const evWindow = applyAction(P1, panel2.state, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-affected-window' });
    const pi1 = applyAction(P1, evWindow.state, { type: 'REVIEW_PATIENT_IMPACT', targetState: 'INDICATED' });
    const pi2 = applyAction(P1, pi1.state, { type: 'REVIEW_PATIENT_IMPACT', targetState: 'PENDING' });
    const pi3 = applyAction(P1, pi2.state, { type: 'REVIEW_PATIENT_IMPACT', targetState: 'AFFECTED_RESULT_SET_IDENTIFIED' });
    const resumed = applyAction(P1, pi3.state, { type: 'RESUME_SERVICE' });
    assert('RESUME-02', resumed.error === null && deriveUnlockedPhaseIndex(resumed.state) === IDX.RESUME_OR_HOLD, 'Genuine successful RESUME_SERVICE legitimately earns RESUME_OR_HOLD');
  }

  /* ===================== Unsuccessful actions leave progression unchanged ===================== */
  console.log('\n=== Unsuccessful/rejected actions never change the unlock frontier ===');
  {
    const s = createInitialState(P1);
    const before = deriveUnlockedPhaseIndex(s);
    const rejected1 = applyAction(P1, s, { type: 'REPEAT_QC', wasNecessary: true });
    const rejected2 = applyAction(P1, s, { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-lot' });
    const rejected3 = applyAction(P1, s, { type: 'VERIFY_RECOVERY' });
    assert('UNCHANGED-01', rejected1.error !== null && rejected2.error !== null && rejected3.error !== null, 'All three premature actions are rejected');
    assert('UNCHANGED-02', deriveUnlockedPhaseIndex(s) === before, 'Original state is never mutated by rejected attempts (pure function contract preserved)');
  }

  const total = passed + failed;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Progression-Invariant Tests: ${passed}/${total} passed, ${failed} failed`);
  if (failed > 0) { console.error('PROGRESSION-INVARIANT TESTS FAILED.'); process.exit(1); }
  console.log('PROGRESSION-INVARIANT TESTS PASSED.');
  process.exit(0);
}
main().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
