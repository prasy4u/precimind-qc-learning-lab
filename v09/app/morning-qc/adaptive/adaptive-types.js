/* =========================================================================
   v09/app/morning-qc/adaptive/adaptive-types.js

   Morning QC Room — Stage 12D Adaptive Sequencing Type Documentation
   PROVENANCE: V09_NEW

   Documentation-only (no runtime exports needed) — describes the shapes
   used across this module for reviewers and future maintainers.

   AttemptRecord = {
     attemptId: string,
     caseId: string,
     startedAt: number (epoch ms),
     completedAt: number (epoch ms),
     competencyProfile: Array<{ dimension: string, rating: string|null }>,
     decisionSummary: Array<{ quadrant: string }>,
     confidenceSummary: Array<{ category: string }>,
     evidenceSummary: { highValueObtainedCount: number, lowValueObtainedCount: number },
     finalServiceState: string,
     recommendedLearningPriorities: Array<string>,
   }

   CompetencyHistoryEntry = {
     latestRating: string|null,
     trend: 'NOT_YET_ASSESSED' | 'INITIAL_EVIDENCE' | 'EARLY_PATTERN' | 'IMPROVING' | 'STABLE' | 'NEEDS_MORE_EVIDENCE',
     observationCount: number,
   }

   Recommendation = { case: <case object>, reason: string } | null
   ========================================================================= */
export const ADAPTIVE_MODULE_VERSION = '1.0.0';
