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
  const record = {
    attemptId: nextAttemptId(),
    caseId,
    caseSchemaVersion: CASE_SCHEMA_VERSION,
    startedAt: startedAt ?? Date.now(),
    completedAt: completedAt ?? Date.now(),
    competencyProfile: projection.competencyProfile,
    decisionSummary: projection.decisionReview.map(d => ({ decisionEventId: d.decisionEventId, decisionId: d.decisionId, quadrant: d.quadrant })),
    confidenceSummary: projection.confidenceCalibration.map(c => ({ decisionEventId: c.decisionEventId, category: c.category })),
    evidenceSummary: {
      highValueObtainedCount: projection.evidenceReview.obtained.highValueObtainedCount,
      lowValueObtainedCount: projection.evidenceReview.obtained.lowValueObtainedCount,
    },
    verificationSummary: {
      attempted: projection.patientSafetyReview.verificationAttempted,
      adequate: projection.patientSafetyReview.verificationAdequate,
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
