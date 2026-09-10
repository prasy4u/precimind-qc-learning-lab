/* =========================================================================
   v09/app/morning-qc/analytics/instructor-projection.js

   Morning QC Room — Stage 12D Instructor Dev-Only Projection
   PROVENANCE: V09_NEW

   Section 34/38: a development-facing instructor summary only — NOT a
   production primary navigation destination (Section 51). Section 36:
   the resulting UI must always display the required disclaimer;
   Section 37: any synthetic multi-learner fixture uses "Learner A/B/C",
   never real names.
   ========================================================================= */
import { aggregateAttempts } from './analytics-model.js';

export const REQUIRED_DISCLAIMER = 'Simulation-learning analytics only. Not a measure of clinical competence or employment performance.';

/**
 * Builds the dev-only instructor summary from a set of (optionally
 * per-synthetic-learner) attempt records. `attemptsByLearner` is an
 * object keyed by a label ("Learner A", "Learner B", ...) — never a
 * real name, real ID, or any other personal identifier.
 */
export function buildInstructorSummary(attemptsByLearner) {
  const allAttempts = Object.values(attemptsByLearner).flat();
  const aggregate = aggregateAttempts(allAttempts);
  const perLearner = Object.fromEntries(
    Object.entries(attemptsByLearner).map(([label, attempts]) => [label, aggregateAttempts(attempts)])
  );
  return { disclaimer: REQUIRED_DISCLAIMER, aggregate, perLearner };
}
