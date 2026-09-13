/* =========================================================================
   v09/app/morning-qc/adaptive/sequencing-model.js

   Morning QC Room — Stage 12D Sequencing Orchestration
   PROVENANCE: V09_MODIFIED (Stage 12D corrective closure)

   Converts a genuine, already-gated debrief projection (from
   debrief-adapter.js — never raw case/groundTruth data) into the safe,
   reduced, research-ready attemptRecord shape (Section 13/20), and
   orchestrates the recommend-next-case call. This module never reads
   groundTruth.
   ========================================================================= */
import { recordAttempt, listAttempts, resetHistory as resetHistoryStore } from './attempt-store.js';
import { recommendNextCase } from './case-recommender.js';
import { CASE_SCHEMA_VERSION } from '../case-schema.js';

let attemptCounter = 0;
function nextAttemptId() {
  attemptCounter += 1;
  return `attempt-${Date.now()}-${attemptCounter}`;
}

/**
 * Builds a safe attemptRecord from a debrief projection (Section 20),
 * plus optional safe case metadata (Section 13 research-readiness:
 * caseFamily, difficulty — both already learner-safe identity fields,
 * never groundTruth). Contains ONLY simulation-learning data — no raw
 * groundTruth object, no personal identifiers (Section 22).
 */
export function buildAttemptRecord(caseId, projection, options = {}) {
  const { startedAt, completedAt, caseFamily, difficulty } = options;
  const timeline = projection.reasoningTimeline || [];
  const highValueObtainedCount = projection.evidenceReview.obtained.highValueObtainedCount;
  const lowValueObtainedCount = projection.evidenceReview.obtained.lowValueObtainedCount;
  const totalEvidenceObtained = highValueObtainedCount + lowValueObtainedCount;
  // Section 9 corrective closure: expanded, safely-derivable metrics.
  // panelSummary.inspectedCount and verificationSummary.attemptCount/
  // failedAttemptCount are computed directly from reasoningTimeline
  // (real, already-safe action history already exposed by the debrief
  // projection) — never fabricated. relevantInspectedCount/
  // irrelevantInspectedCount are NOT included: they would require panel
  // relevance metadata that is not currently exposed through the safe
  // projection, and this closure does not reopen debrief-adapter.js's
  // Stage 12C-frozen architecture to add it — documented here as a
  // known, deliberate gap rather than fabricated.
  const inspectedCount = timeline.filter(t => t.type === 'INSPECT_PANEL').length;
  const verifyAttempts = timeline.filter(t => t.type === 'VERIFY_RECOVERY');
  const attemptCount = verifyAttempts.length;
  const failedAttemptCount = verifyAttempts.filter(t => t.outcomeAppropriate === false).length;
  const record = {
    attemptId: nextAttemptId(),
    caseId,
    caseSchemaVersion: CASE_SCHEMA_VERSION,
    startedAt: startedAt ?? Date.now(),
    completedAt: completedAt ?? Date.now(),
    competencyProfile: projection.competencyProfile,
    decisionSummary: projection.decisionReview.map(d => ({ decisionEventId: d.decisionEventId, decisionId: d.decisionId, quadrant: d.quadrant })),
    confidenceSummary: projection.confidenceCalibration.map(c => ({ decisionEventId: c.decisionEventId, confidence: c.confidence, category: c.category })),
    evidenceSummary: {
      highValueObtainedCount,
      lowValueObtainedCount,
      ...(totalEvidenceObtained > 0 ? { efficiencyRatio: Math.round((highValueObtainedCount / totalEvidenceObtained) * 1000) / 1000 } : {}),
    },
    panelSummary: { inspectedCount },
    verificationSummary: {
      attempted: projection.patientSafetyReview.verificationAttempted,
      adequate: projection.patientSafetyReview.verificationAdequate,
      attemptCount,
      failedAttemptCount,
      hadPrematureOrFailedAttemptBeforeSuccess: attemptCount > 1 && failedAttemptCount > 0 && !!projection.patientSafetyReview.verificationAdequate,
    },
    finalServiceState: projection.caseResolution.actualServiceState,
    executedFinalDisposition: projection.documentationVsExecuted.executedDisposition,
    recommendedLearningPriorities: projection.learningPriorities,
  };
  if (caseFamily != null) record.caseFamily = caseFamily;
  if (difficulty != null) record.difficulty = difficulty;
  return record;
}

export function recordCompletedAttempt(caseId, projection, options, storage) {
  const record = buildAttemptRecord(caseId, projection, options || {});
  return recordAttempt(record, storage);
}

export function getRecommendation(allCases, storage) {
  const attempts = listAttempts(storage);
  return recommendNextCase(allCases, attempts);
}

export function resetLearningHistory(storage) {
  resetHistoryStore(storage);
}

export function getAttemptHistory(storage) {
  return listAttempts(storage);
}
