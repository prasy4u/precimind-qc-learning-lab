/* =========================================================================
   v09/app/morning-qc/debrief-model.js

   Morning QC Room — Stage 12A Debrief Model
   PROVENANCE: V09_NEW

   Section 24: the debrief must not simply reveal "Correct answer = X."
   This module produces a structured, multi-part debrief object covering
   what was noticed/missed, evidence value, containment timeliness,
   hypothesis premature-ness, intervention support, verification adequacy,
   patient-impact reasoning, disposition justification, and confidence
   calibration — ground truth (Section 9) is only consulted HERE, after
   the case is complete, never exposed to the learner mid-case.
   ========================================================================= */

import { summarizeEvidenceUsage, summarizePanelUsage } from './evidence-model.js';
import { summarizeDecisions } from './decision-model.js';
import { computeScoringProfile } from './scoring-model.js';

export function generateDebrief(caseObj, finalState) {
  const evidenceUsage = summarizeEvidenceUsage(caseObj, finalState);
  const panelUsage = summarizePanelUsage(caseObj, finalState);
  const decisions = summarizeDecisions(finalState.actionHistory);
  const scoringProfile = computeScoringProfile(caseObj, finalState);

  const containmentDecisions = decisions.filter(d => d.category === 'CONTAINMENT');
  const firstContainmentIdx = finalState.actionHistory.findIndex(h => h.type === 'HOLD_RESULTS');
  const signalAckIdx = finalState.actionHistory.findIndex(h => h.type === 'ACKNOWLEDGE_SIGNAL');
  const containmentTimely = firstContainmentIdx === -1 ? null : (signalAckIdx === -1 || firstContainmentIdx >= signalAckIdx);

  const hypothesesFormedBeforeEvidence = finalState.actionHistory.filter((h, i) => {
    if (h.type !== 'FORM_HYPOTHESIS') return false;
    const priorEvidenceCount = finalState.actionHistory.slice(0, i).filter(x => x.type === 'REQUEST_EVIDENCE').length;
    return priorEvidenceCount === 0;
  });

  const lastVerification = finalState.verificationAttempts[finalState.verificationAttempts.length - 1];
  const verificationAdequate = !!(lastVerification && lastVerification.criteriaWereMet);

  const patientImpactAddressed = finalState.patientImpactState !== 'NOT_INDICATED' ||
    caseObj.groundTruth?.patientImpactStatus === 'NOT_INDICATED';

  const dispositionDecisions = decisions.filter(d => d.category === 'DISPOSITION');
  // Stage 12A FINAL DEBRIEF/SCORING TRUTH closure: disposition
  // justification must derive from what ACTUALLY OCCURRED in the trace
  // (a genuine DISPOSITION-category decision event — either a
  // case-authored decisionId/optionId execution, or a raw RESUME_SERVICE/
  // ESCALATE), never from string-matching learner-authored
  // documentation.finalDisposition against groundTruth.appropriateDisposition.
  // documentedFinalDisposition (what the learner WROTE) and
  // executedDisposition (what the learner actually DID) are modeled as
  // explicitly separate facts — Invariant C: "learner-authored
  // documentation can describe or claim an action/conclusion, but it
  // cannot rewrite the engine's record of what actually occurred and
  // cannot receive operational/decision credit by itself."
  const executedDispositionEvent = dispositionDecisions.length > 0 ? dispositionDecisions[dispositionDecisions.length - 1] : null;
  const executedDisposition = executedDispositionEvent ? {
    actionType: executedDispositionEvent.actionType,
    decisionId: executedDispositionEvent.decisionId,
    optionId: executedDispositionEvent.optionId,
    decisionEventId: executedDispositionEvent.decisionEventId,
    outcomeAppropriate: executedDispositionEvent.outcomeAppropriate,
    reasoningSupported: executedDispositionEvent.reasoningSupported,
  } : null;
  // plausiblyJustified: true only when a genuine disposition event
  // actually occurred AND that event's own outcome was appropriate AND
  // adequately evidence-supported. null (not false) when no disposition
  // was ever executed — absence of a decision is not itself a poor
  // decision; it is simply the absence of one.
  const plausiblyJustified = executedDispositionEvent === null
    ? null
    : (executedDispositionEvent.outcomeAppropriate && executedDispositionEvent.reasoningSupported);

  return {
    noticed: {
      signalAcknowledged: !!finalState.documentation.signal,
      highValueEvidenceObtained: evidenceUsage.highValueObtained,
    },
    missed: {
      highValueEvidenceMissed: evidenceUsage.highValueMissed,
      relevantPanelsUninspected: panelUsage.relevantUninspectedIds,
    },
    evidenceValue: {
      highValueObtainedCount: evidenceUsage.highValueObtained.length,
      lowValueObtainedCount: evidenceUsage.lowValueObtained.length,
      efficiencyRatio: evidenceUsage.efficiencyRatio,
    },
    containment: {
      timely: containmentTimely,
      note: containmentTimely === false
        ? 'Containment occurred before the signal was acknowledged — review whether this was justified or premature.'
        : (containmentTimely === true ? 'Containment followed signal acknowledgement.' : 'No containment action recorded.'),
    },
    hypotheses: {
      formedBeforeAnyEvidence: hypothesesFormedBeforeEvidence.map(h => h.hypothesisId),
      note: hypothesesFormedBeforeEvidence.length > 0
        ? 'One or more hypotheses were formed before any evidence was requested — review whether this reflected the case narrative (Section 9 background) or premature closure.'
        : 'Hypotheses were formed after at least some evidence gathering.',
    },
    intervention: {
      // Stage 12A PROGRESSION-AUTHORITY-HARDENING closure: reads the
      // engine-owned systemEvents authority, not the learner-facing
      // documentation mirror, for the same reason deriveUnlockedPhaseIndex()
      // does — genuine occurrence, never learner-editable text.
      applied: finalState.systemEvents.interventionApplied === true,
      evidenceSupported: decisions.filter(d => d.category === 'INTERVENTION').every(d => d.reasoningSupported),
    },
    verification: {
      attempted: finalState.verificationAttempts.length > 0,
      adequate: verificationAdequate,
      note: verificationAdequate
        ? 'Verification criteria were met before service disposition.'
        : 'Verification was not adequately completed before disposition — this is a patient-safety-relevant gap, not merely a style note.',
    },
    patientImpact: {
      addressed: patientImpactAddressed,
      finalState: finalState.patientImpactState,
    },
    disposition: {
      documentedFinalDisposition: finalState.documentation.finalDisposition, // learner's CLAIM — may be null, may differ from what was executed
      executedDisposition, // what genuinely occurred — null if no disposition decision was ever executed
      plausiblyJustified,
      groundTruthDisposition: caseObj.groundTruth?.appropriateDisposition || null,
    },
    confidenceCalibration: finalState.confidenceRecords.map(r => {
      // Stage 12A FINAL DEBRIEF/SCORING TRUTH closure: decisionEventId is
      // the authoritative event identity (supports revised decisions
      // under the same reusable decisionId — see decisionEventId
      // architecture). The reusable decisionId is resolved from action
      // history as an additional, non-authoritative display convenience.
      const matchingEntry = finalState.actionHistory.find(h => h.decisionEventId === r.decisionEventId);
      return {
        decisionEventId: r.decisionEventId,
        decisionId: matchingEntry ? matchingEntry.decisionId : null,
        confidence: r.confidence,
      };
    }),
    scoringProfile,
    commonMisconceptions: caseObj.debriefEvidence?.commonMisconceptions || [],
    strongPathDescription: caseObj.debriefEvidence?.strongPathDescription || null,
    weakPathDescriptions: caseObj.debriefEvidence?.weakPathDescriptions || [],
  };
}
