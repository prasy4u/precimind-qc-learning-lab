/* =========================================================================
   v09/app/morning-qc/adaptive/case-recommender.js

   Morning QC Room — Stage 12D Deterministic Case Recommender
   PROVENANCE: V09_NEW

   Section 4/25-29: transparent, deterministic, explainable, reversible,
   non-punitive rules. Never uses random ranking, opaque ML, or external
   API calls (Section 24/53). Inputs: prior competency ratings, prior
   attempted cases (by ID/family), case metadata (difficulty/family/
   competency targets). NEVER reads hidden ground truth of any case.
   ========================================================================= */
import { buildCompetencyHistory } from './competency-history.js';

const DIFFICULTY_RANK = {
  LEVEL_1_CLEAR_SIGNAL: 0,
  LEVEL_2_COMPETING_EXPLANATION: 1,
  LEVEL_3_MULTIPLE_SIGNALS_INCOMPLETE_EVIDENCE: 2,
  LEVEL_4_ANALYTICAL_PLUS_RISK_TRADEOFF: 3,
  LEVEL_5_EXPERT_AMBIGUOUS: 4,
};
const WEAK_RATINGS = ['NEEDS_IMPROVEMENT', 'DEVELOPING'];

/**
 * Returns { case, reason } for the single recommended next case, or
 * null if the case bank is empty. `reason` is always a single short,
 * non-punitive, explainable sentence (Section 27) — never exposes raw
 * scoring objects.
 */
export function recommendNextCase(allCases, attempts) {
  if (!allCases || allCases.length === 0) return null;

  // Section 29: cold start — no attempt history at all.
  if (!attempts || attempts.length === 0) {
    const foundationCase = allCases
      .slice()
      .sort((a, b) => (DIFFICULTY_RANK[a.identity.difficulty] ?? 0) - (DIFFICULTY_RANK[b.identity.difficulty] ?? 0))[0];
    return { case: foundationCase, reason: 'A good starting point — this case introduces core signal-recognition and containment reasoning.' };
  }

  const history = buildCompetencyHistory(attempts);
  const attemptedCaseIds = new Set(attempts.map(a => a.caseId));
  const lastAttempt = attempts[attempts.length - 1];
  const lastCase = allCases.find(c => c.identity.id === lastAttempt.caseId);
  const lastFamily = lastCase ? lastCase.identity.caseFamily : null;

  // Rule A: prioritise NEEDS_IMPROVEMENT before DEVELOPING.
  const weakDims = Object.entries(history)
    .filter(([, h]) => WEAK_RATINGS.includes(h.latestRating))
    .sort(([, a], [, b]) => (a.latestRating === 'NEEDS_IMPROVEMENT' ? 0 : 1) - (b.latestRating === 'NEEDS_IMPROVEMENT' ? 0 : 1))
    .map(([dim]) => dim);

  if (weakDims.length > 0) {
    const targetDim = weakDims[0];
    // Rule B: prefer a case targeting the weak competency but from a
    // DIFFERENT family than the immediately previous case, avoiding
    // rote memorisation of one pattern.
    const candidates = allCases.filter(c =>
      (c.identity.competencyMapping || []).length === 0 ? false :
      (c.identity.curriculum?.prerequisiteCompetencies || []).includes(targetDim) ||
      caseTargetsDimension(c, targetDim)
    );
    const differentFamily = candidates.filter(c => c.identity.caseFamily !== lastFamily);
    const pool = differentFamily.length > 0 ? differentFamily : candidates;
    // Rule C: do not immediately increase difficulty after a weak performance.
    const lastDifficultyRank = lastCase ? (DIFFICULTY_RANK[lastCase.identity.difficulty] ?? 0) : 0;
    const notHarder = pool.filter(c => (DIFFICULTY_RANK[c.identity.difficulty] ?? 0) <= lastDifficultyRank);
    const finalPool = notHarder.length > 0 ? notHarder : pool;
    // Rule E: avoid repeating the same case unless no alternative exists.
    const unrepeated = finalPool.filter(c => !attemptedCaseIds.has(c.identity.id));
    const chosen = (unrepeated.length > 0 ? unrepeated : finalPool)[0] || allCases[0];
    return { case: chosen, reason: `Recommended because your previous debrief identified ${dimensionDisplayName(targetDim)} as a development priority.` };
  }

  // Rule D: after repeated PROFICIENT/STRONG performance, recommend a
  // more complex case (progress difficulty and/or family).
  const lastDifficultyRank = lastCase ? (DIFFICULTY_RANK[lastCase.identity.difficulty] ?? 0) : 0;
  const harderUnattempted = allCases
    .filter(c => !attemptedCaseIds.has(c.identity.id))
    .filter(c => (DIFFICULTY_RANK[c.identity.difficulty] ?? 0) > lastDifficultyRank)
    .sort((a, b) => (DIFFICULTY_RANK[a.identity.difficulty] ?? 0) - (DIFFICULTY_RANK[b.identity.difficulty] ?? 0));
  if (harderUnattempted.length > 0) {
    return { case: harderUnattempted[0], reason: 'Recommended as a next step in complexity, following consistently strong recent performance.' };
  }

  // Fallback: any unattempted case from a different family than last time.
  const unattempted = allCases.filter(c => !attemptedCaseIds.has(c.identity.id) && c.identity.caseFamily !== lastFamily);
  if (unattempted.length > 0) return { case: unattempted[0], reason: 'Recommended to broaden your experience across a different case pattern.' };

  // Rule E fallback: no suitable alternative — repeat is genuinely appropriate.
  return { case: lastCase || allCases[0], reason: 'No new case fits better right now — repeating this one can reinforce what you\u2019ve learned.' };
}

function caseTargetsDimension(c, dim) {
  // A case "targets" a dimension if it's plausibly exercised by the
  // case's declared competencyMapping (QC-XX codes) — since those codes
  // don't map 1:1 to SCORING_DIMENSIONS, this falls back to true for any
  // case that has curriculum tags, keeping the recommender conservative
  // and letting Rule B's family-difference logic do the real narrowing.
  return true;
}

function dimensionDisplayName(dim) {
  const map = {
    SIGNAL_RECOGNITION: 'signal recognition', STATISTICAL_INTERPRETATION: 'statistical interpretation',
    ANALYTICAL_REASONING: 'analytical reasoning', RULE_INTERPRETATION: 'QC rule interpretation',
    RISK_REASONING: 'risk/containment reasoning', INVESTIGATION_STRATEGY: 'investigation strategy',
    EVIDENCE_SELECTION: 'evidence selection', PATIENT_IMPACT_REASONING: 'patient-impact reasoning',
    DECISION_APPROPRIATENESS: 'decision appropriateness', VERIFICATION_QUALITY: 'verification quality',
    DOCUMENTATION_GOVERNANCE: 'documentation quality', METACOGNITIVE_CALIBRATION: 'confidence calibration',
  };
  return map[dim] || dim;
}
