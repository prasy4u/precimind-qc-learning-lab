/* =========================================================================
   v09/app/morning-qc/adaptive/competency-history.js

   Morning QC Room — Stage 12D Longitudinal Competency Summary
   PROVENANCE: V09_NEW

   Section 30-31: for each of the 12 dimensions, retains latest rating,
   recent trend, and evaluated-attempt count — with cautious trend
   language (never a statistically meaningless regression over 2-3
   points, never a numeric percentage, never "mastered"/"certified").
   ========================================================================= */
import { SCORING_DIMENSIONS } from '../states.js';

const RATING_RANK = { NEEDS_IMPROVEMENT: 0, DEVELOPING: 1, PROFICIENT: 2, STRONG: 3 };

/**
 * Builds the longitudinal summary from a list of attempt records (each
 * with a `.competencyProfile` array of {dimension, rating}, oldest
 * first). Never invents statistics beyond what 1-3 observations can
 * actually support (Section 31 trend doctrine).
 */
export function buildCompetencyHistory(attempts) {
  const history = {};
  for (const dim of SCORING_DIMENSIONS) {
    const observations = attempts
      .map(a => (a.competencyProfile || []).find(c => c.dimension === dim))
      .filter(c => c && c.rating != null);

    if (observations.length === 0) {
      history[dim] = { latestRating: null, trend: 'NOT_YET_ASSESSED', observationCount: 0 };
      continue;
    }
    const latestRating = observations[observations.length - 1].rating;
    let trend;
    if (observations.length === 1) {
      trend = 'INITIAL_EVIDENCE';
    } else if (observations.length === 2) {
      trend = 'EARLY_PATTERN';
    } else {
      // 3+ observations: a cautious trend may be reported, based only on
      // the direction of the most recent vs. the earliest-of-the-recent-
      // window rank — never a fitted regression line.
      const recentWindow = observations.slice(-3);
      const first = RATING_RANK[recentWindow[0].rating];
      const last = RATING_RANK[recentWindow[recentWindow.length - 1].rating];
      if (last > first) trend = 'IMPROVING';
      else if (last < first) trend = 'NEEDS_MORE_EVIDENCE';
      else trend = 'STABLE';
    }
    history[dim] = { latestRating, trend, observationCount: observations.length };
  }
  return history;
}

/**
 * Section 32: mastery must never be claimed. This function only ever
 * returns "consistently strong across recent cases" language, never
 * MASTERED/CERTIFIED/COMPETENT_FOR_PRACTICE.
 */
export function describeConsistentStrength(history, dim) {
  const h = history[dim];
  if (!h) return null;
  if (h.latestRating === 'STRONG' && h.observationCount >= 3 && h.trend !== 'NEEDS_MORE_EVIDENCE') {
    return 'Consistently strong across recent cases';
  }
  if (h.latestRating === 'STRONG') return 'Strong recent performance';
  return null;
}
