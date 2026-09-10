/* =========================================================================
   v09/app/morning-qc/adaptive/sequencing-model.js

   Morning QC Room — Stage 12D Sequencing Orchestration
   PROVENANCE: V09_NEW

   Converts a genuine, already-gated debrief projection (from
   debrief-adapter.js — never raw case/groundTruth data) into the safe,
   reduced attemptRecord shape (Section 20), and orchestrates the
   recommend-next-case call. This module never reads groundTruth.
   ========================================================================= */
import { recordAttempt, listAttempts, resetHistory as resetHistoryStore } from './attempt-store.js';
import { recommendNextCase } from './case-recommender.js';

let attemptCounter = 0;
function nextAttemptId() {
  attemptCounter += 1;
  return `attempt-${Date.now()}-${attemptCounter}`;
}

/**
 * Builds a safe attemptRecord from a debrief projection (Section 20).
 * Contains ONLY simulation-learning data — no raw groundTruth object,
 * no personal identifiers (Section 22).
 */
export function buildAttemptRecord(caseId, projection, { startedAt, completedAt } = {}) {
  return {
    attemptId: nextAttemptId(),
    caseId,
    startedAt: startedAt ?? Date.now(),
    completedAt: completedAt ?? Date.now(),
    competencyProfile: projection.competencyProfile,
    decisionSummary: projection.decisionReview.map(d => ({ quadrant: d.quadrant })),
    confidenceSummary: projection.confidenceCalibration.map(c => ({ category: c.category })),
    evidenceSummary: {
      highValueObtainedCount: projection.evidenceReview.obtained.highValueObtainedCount,
      lowValueObtainedCount: projection.evidenceReview.obtained.lowValueObtainedCount,
    },
    finalServiceState: projection.caseResolution.actualServiceState,
    recommendedLearningPriorities: projection.learningPriorities,
  };
}

export function recordCompletedAttempt(caseId, projection, timing, storage) {
  const record = buildAttemptRecord(caseId, projection, timing);
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
