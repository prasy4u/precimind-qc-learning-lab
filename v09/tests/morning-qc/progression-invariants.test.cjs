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

  /* ===================== DOCUMENT cannot forge progression (Invariant A) ===================== */
  console.log('\n=== Invariant A: DOCUMENT cannot forge system-owned progression milestones ===');
  {
    // DOC-01: DOCUMENT attempts to write hypothesesConsidered.
    let s = createInitialState(P2);
    let acked = applyAction(P2, s, { type: 'ACKNOWLEDGE_SIGNAL' });
    let panel = applyAction(P2, acked.state, { type: 'INSPECT_PANEL', panelId: 'panel-pbrtqc' });
    assert('DOC-00', deriveUnlockedPhaseIndex(panel.state) === IDX.CHARACTERISATION, 'Sanity: genuine ACK + panel reaches CHARACTERISATION only');
    const forgeHyp = applyAction(P2, panel.state, { type: 'DOCUMENT', fields: { hypothesesConsidered: ['hyp-population'] } });
    assert('DOC-01', forgeHyp.error === null && deriveUnlockedPhaseIndex(forgeHyp.state) === IDX.CHARACTERISATION, 'DOCUMENT writing hypothesesConsidered directly does NOT advance progression to HYPOTHESIS_GENERATION (real FORM_HYPOTHESIS never occurred)');
    assert('DOC-01b', forgeHyp.state.documentation.hypothesesConsidered.length === 0, 'The forged field is not even applied to the learner-facing documentation object (system-maintained field protected)');

    // DOC-02: DOCUMENT attempts to write investigationPerformed.
    const forgeInvest = applyAction(P2, panel.state, { type: 'DOCUMENT', fields: { investigationPerformed: ['REPEAT_QC'] } });
    assert('DOC-02', forgeInvest.error === null && deriveUnlockedPhaseIndex(forgeInvest.state) === IDX.CHARACTERISATION, 'DOCUMENT writing investigationPerformed directly does NOT advance progression to INVESTIGATION (real REPEAT_QC never occurred)');
    assert('DOC-02b', forgeInvest.state.documentation.investigationPerformed.length === 0, 'The forged field is not applied to learner-facing documentation either');

    // DOC-03: DOCUMENT attempts to write intervention.
    const forgeInterv = applyAction(P2, panel.state, { type: 'DOCUMENT', fields: { intervention: 'forged intervention text' } });
    assert('DOC-03', forgeInterv.error === null && deriveUnlockedPhaseIndex(forgeInterv.state) === IDX.CHARACTERISATION, 'DOCUMENT writing intervention directly does NOT advance progression to INTERVENTION (real APPLY_INTERVENTION never occurred)');
    assert('DOC-03b', forgeInterv.state.documentation.intervention === null, 'The forged intervention text is not applied to learner-facing documentation either');

    // DOC-04: a single DOCUMENT combining ALL forgery attempts simultaneously
    // (the exact scenario the audit demonstrated) still only reaches CHARACTERISATION.
    const forgeAll = applyAction(P2, panel.state, { type: 'DOCUMENT', fields: {
      hypothesesConsidered: ['hyp-population'], investigationPerformed: ['REPEAT_QC'], intervention: 'forged',
      signal: 'forged signal', containment: 'forged containment', evidenceReviewed: ['fake-ev'],
      verification: 'forged verification', patientImpactAssessment: 'forged pi',
    }});
    assert('DOC-04', forgeAll.error === null && deriveUnlockedPhaseIndex(forgeAll.state) === IDX.CHARACTERISATION, 'A single DOCUMENT combining every forgery attempt (the exact audit-demonstrated scenario) still only reaches CHARACTERISATION — genuine unlock frontier cannot be rewritten by learner-editable documentation');
    assert('DOC-04b', forgeAll.state.documentation.signal === 'PBRTQC moving-mean statistic crosses alert threshold at t=720.', 'System-maintained documentation.signal retains its genuine engine-set value, unaffected by the forgery attempt (not overwritten with "forged signal")');
    assert('DOC-04c', forgeAll.state.documentation.containment === null && forgeAll.state.documentation.verification === null && forgeAll.state.documentation.patientImpactAssessment === null, 'Other system-maintained fields (containment/verification/patientImpactAssessment) similarly remain unaffected by the combined forgery attempt');

    // Confirm the allowlisted fields (finalDisposition, escalation,
    // establishedCause) STILL work normally — DOCUMENT is not disabled,
    // only the system-owned subset is protected.
    const legitDoc = applyAction(P2, panel.state, { type: 'DOCUMENT', fields: { finalDisposition: 'CONTINUE_ANALYSIS_DOCUMENTED', escalation: null, establishedCause: 'Population shift.' } });
    assert('DOC-05', legitDoc.error === null && legitDoc.state.documentation.finalDisposition === 'CONTINUE_ANALYSIS_DOCUMENTED' && legitDoc.state.documentation.establishedCause === 'Population shift.', 'Genuinely learner-authored fields (finalDisposition, establishedCause) remain fully writable by DOCUMENT');
  }

  /* ===================== Early ESCALATE cannot unlock reasoning frontier (Invariant B) ===================== */
  console.log('\n=== Invariant B: early operational ESCALATE cannot unlock the reasoning frontier ===');
  {
    let s = createInitialState(P1);
    let acked = applyAction(P1, s, { type: 'ACKNOWLEDGE_SIGNAL' });
    let held = applyAction(P1, acked.state, { type: 'HOLD_RESULTS' });
    // ESC-01: ACK + HOLD + ESCALATE is operationally valid (structurally legal).
    const escalated = applyAction(P1, held.state, { type: 'ESCALATE' });
    assert('ESC-01', escalated.error === null && escalated.state.serviceState === 'ESCALATED', 'ACK + HOLD + ESCALATE is operationally valid — service-state transition succeeds');

    // ESC-02: the same early ESCALATE must NOT unlock RESUME_OR_HOLD.
    assert('ESC-02', deriveUnlockedPhaseIndex(escalated.state) === IDX.IMMEDIATE_CONTAINMENT, `Early ESCALATE does not unlock RESUME_OR_HOLD — genuine frontier remains at IMMEDIATE_CONTAINMENT (found ${deriveUnlockedPhaseIndex(escalated.state)})`);

    // ESC-03: a CHARACTERISATION-gated panel remains locked after early escalation.
    const stillBlocked = applyAction(P1, escalated.state, { type: 'INSPECT_PANEL', panelId: 'panel-reagent-lot' });
    assert('ESC-03', stillBlocked.error !== null, 'CHARACTERISATION-gated panel-reagent-lot remains locked after early escalation');

    // ESC-04: escalation history/service-state remains correctly recorded
    // despite the information frontier remaining limited.
    assert('ESC-04', escalated.state.documentation.escalation === 'Escalated.' && escalated.state.serviceState === 'ESCALATED' && escalated.state.actionHistory.some(h => h.type === 'ESCALATE'),
      'Escalation is genuinely recorded (serviceState, documentation.escalation, actionHistory) despite the information frontier remaining appropriately limited');
  }

  /* ===================== Invariant C: documentation cannot forge decision credit ===================== */
  console.log('\n=== Invariant C: learner documentation cannot forge decision/operational credit ===');
  {
    const { generateDebrief } = await import('file://' + path.join(APP, 'debrief-model.js'));
    const { computeScoringProfile } = await import('file://' + path.join(APP, 'scoring-model.js'));
    const { summarizeDecisions } = await import('file://' + path.join(APP, 'decision-model.js'));

    // DTRUTH-01: the exact audit-demonstrated exploit.
    let s1 = createInitialState(P1);
    let a1 = applyAction(P1, s1, { type: 'ACKNOWLEDGE_SIGNAL' });
    let a2 = applyAction(P1, a1.state, { type: 'DOCUMENT', fields: { finalDisposition: P1.groundTruth.appropriateDisposition } });
    assert('DTRUTH-01a', a2.state.serviceState === 'RUNNING', 'serviceState remains RUNNING — no disposition action ever genuinely occurred');
    assert('DTRUTH-01b', summarizeDecisions(a2.state.actionHistory).filter(d => d.category === 'DISPOSITION').length === 0, 'No actual DISPOSITION decision event exists in the trace');
    assert('DTRUTH-01c', a2.state.documentation.finalDisposition === P1.groundTruth.appropriateDisposition, 'The documented final disposition IS retained as learner documentation (not erased)');
    const debrief1 = generateDebrief(P1, a2.state);
    assert('DTRUTH-01d', debrief1.disposition.executedDisposition === null && debrief1.disposition.plausiblyJustified === null, 'Debrief does NOT mark an actual executed disposition as justified — executedDisposition and plausiblyJustified are both null');
    const profile1 = computeScoringProfile(P1, a2.state);
    assert('DTRUTH-01e', profile1.DECISION_APPROPRIATENESS !== 'STRONG', `DECISION_APPROPRIATENESS is not STRONG for documentation-only disposition (found ${profile1.DECISION_APPROPRIATENESS})`);

    // DTRUTH-02: generic DOCUMENT without decisionId/optionId is not summarized as DISPOSITION.
    let s2 = createInitialState(P1);
    let b1 = applyAction(P1, s2, { type: 'ACKNOWLEDGE_SIGNAL' });
    let b2 = applyAction(P1, b1.state, { type: 'DOCUMENT', fields: { finalDisposition: 'anything' } });
    const decisions2 = summarizeDecisions(b2.state.actionHistory);
    assert('DTRUTH-02', decisions2.every(d => !(d.actionType === 'DOCUMENT' && d.decisionId === null)), 'Generic DOCUMENT (no decisionId/optionId) never appears as a summarized decision at all');

    // DTRUTH-03: a genuine case-authored DOCUMENT-bound disposition option
    // remains correctly summarized as DISPOSITION (Pilots 2/3 unaffected).
    let s3 = createInitialState(P2);
    let c1 = applyAction(P2, s3, { type: 'ACKNOWLEDGE_SIGNAL' });
    let c2 = applyAction(P2, c1.state, { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' });
    let c3 = applyAction(P2, c2.state, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-iqc-stable' });
    let c4 = applyAction(P2, c3.state, { type: 'INSPECT_PANEL', panelId: 'panel-patient-distribution' });
    let c5 = applyAction(P2, c4.state, { type: 'CHECK_PATIENT_DISTRIBUTION' });
    let c6 = applyAction(P2, c5.state, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-case-mix-decisive' });
    let c7 = applyAction(P2, c6.state, { type: 'DOCUMENT', decisionId: 'dec-disposition', optionId: 'opt-continue-documented', fields: {} });
    const decisions3 = summarizeDecisions(c7.state.actionHistory);
    assert('DTRUTH-03', decisions3.some(d => d.category === 'DISPOSITION' && d.decisionId === 'dec-disposition'), 'Genuine case-authored DOCUMENT-bound disposition option (Pilot 2) remains correctly summarized as a DISPOSITION decision');

    // DTRUTH-04: a learner may document one disposition but execute another
    // — both facts preserved distinctly.
    let d1 = applyAction(P2, c6.state, { type: 'DOCUMENT', decisionId: 'dec-disposition', optionId: 'opt-continue-documented', fields: { finalDisposition: 'A DIFFERENT WRITTEN CLAIM' } });
    const debrief4 = generateDebrief(P2, d1.state);
    assert('DTRUTH-04', debrief4.disposition.documentedFinalDisposition === 'A DIFFERENT WRITTEN CLAIM' && debrief4.disposition.executedDisposition !== null && debrief4.disposition.executedDisposition.decisionId === 'dec-disposition',
      'Documented claim and genuinely-executed disposition are preserved as distinct facts, even when they differ in wording');

    // CONF-DEBRIEF-01: decisionEventId survives into the debrief.
    let e1 = applyAction(P2, c1.state, { type: 'INSPECT_PANEL', panelId: 'panel-pbrtqc' });
    let e2 = applyAction(P2, e1.state, { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-analytical', decisionId: 'dec-take-seriously', optionId: 'opt-investigate' });
    let e3 = applyAction(P2, e2.state, { type: 'RECORD_CONFIDENCE', decisionEventId: e2.decisionEventId, confidence: 'HIGH' });
    const debriefConf1 = generateDebrief(P2, e3.state);
    assert('CONF-DEBRIEF-01', debriefConf1.confidenceCalibration.length === 1 && debriefConf1.confidenceCalibration[0].decisionEventId === 'dec-take-seriously#1', `The exact decisionEventId survives into the debrief (found ${JSON.stringify(debriefConf1.confidenceCalibration)})`);

    // CONF-DEBRIEF-02: two revisions under the same decisionId produce two distinct events, not conflated.
    let f1 = applyAction(P2, e2.state, { type: 'DOCUMENT', decisionId: 'dec-take-seriously', optionId: 'opt-dismiss', fields: {} });
    let f2 = applyAction(P2, f1.state, { type: 'RECORD_CONFIDENCE', decisionEventId: e2.decisionEventId, confidence: 'HIGH' });
    let f3 = applyAction(P2, f2.state, { type: 'RECORD_CONFIDENCE', decisionEventId: f1.decisionEventId, confidence: 'LOW' });
    const debriefConf2 = generateDebrief(P2, f3.state);
    const eventIds = debriefConf2.confidenceCalibration.map(c => c.decisionEventId).sort();
    assert('CONF-DEBRIEF-02', eventIds.length === 2 && eventIds[0] === 'dec-take-seriously#1' && eventIds[1] === 'dec-take-seriously#2', `Two revisions under the same decisionId produce two DISTINCT decisionEventIds in the debrief, never conflated (found ${JSON.stringify(eventIds)})`);
  }

  const total = passed + failed;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Progression-Invariant Tests: ${passed}/${total} passed, ${failed} failed`);
  if (failed > 0) { console.error('PROGRESSION-INVARIANT TESTS FAILED.'); process.exit(1); }
  console.log('PROGRESSION-INVARIANT TESTS PASSED.');
  process.exit(0);
}
main().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
