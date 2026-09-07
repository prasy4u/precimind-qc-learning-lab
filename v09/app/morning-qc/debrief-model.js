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

  const dispositionMatchesGroundTruth = finalState.documentation.finalDisposition &&
    caseObj.groundTruth?.appropriateDisposition &&
    finalState.documentation.finalDisposition.toUpperCase().includes(
      String(caseObj.groundTruth.appropriateDisposition).toUpperCase().split(' ')[0]
    );

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
      applied: !!finalState.documentation.intervention,
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
      final: finalState.documentation.finalDisposition,
      plausiblyJustified: !!dispositionMatchesGroundTruth,
      groundTruthDisposition: caseObj.groundTruth?.appropriateDisposition || null,
    },
    confidenceCalibration: finalState.confidenceRecords.map(r => ({
      decisionId: r.decisionId, confidence: r.confidence,
    })),
    scoringProfile,
    commonMisconceptions: caseObj.debriefEvidence?.commonMisconceptions || [],
    strongPathDescription: caseObj.debriefEvidence?.strongPathDescription || null,
    weakPathDescriptions: caseObj.debriefEvidence?.weakPathDescriptions || [],
  };
}
