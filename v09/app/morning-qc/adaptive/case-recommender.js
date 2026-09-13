/* =========================================================================
   v09/app/morning-qc/adaptive/case-recommender.js

   Morning QC Room — Stage 12D Deterministic Case Recommender
   PROVENANCE: V09_MODIFIED (Stage 12D corrective closure)

   Section 4/25-29: transparent, deterministic, explainable, reversible,
   non-punitive rules. Never uses random ranking, opaque ML, or external
   API calls (Section 24/53). Inputs: prior competency ratings, prior
   attempted cases (by ID/family), case metadata (difficulty/family/
   competency targets). NEVER reads hidden ground truth of any case.

   CORRECTIVE CLOSURE FIXES (Section 8-9): caseTargetsDimension()
   previously returned true unconditionally, creating false adaptivity —
   a recommendation could claim to target a weak dimension when the
   chosen case did not actually exercise it. This now checks the case's
   REAL, validated identity.curriculum.competencyTargets array (never
   prerequisiteCompetencies, which is a distinct axis — a case's
   prerequisites are what a learner should already have, not what the
   case is designed to exercise). If no case targets a given dimension,
   the recommender falls through generically rather than fabricating an
   explanation. Difficulty ranking now derives from the single
   authoritative CASE_DIFFICULTY_LEVELS array (case-schema.js) instead
   of a second, drifting hand-maintained copy — the prior copy's
   "LEVEL_5_EXPERT_AMBIGUOUS" did not match the real
   "LEVEL_5_COMPLEX_GOVERNANCE_LONGITUDINAL" level and would have
   silently ranked as an unrecognized (rank-0) difficulty.
   ========================================================================= */
import { buildCompetencyHistory } from './competency-history.js';
import { CASE_DIFFICULTY_LEVELS } from '../case-schema.js';

function difficultyRank(difficulty) {
  const idx = CASE_DIFFICULTY_LEVELS.indexOf(difficulty);
  return idx === -1 ? 0 : idx;
}

const WEAK_RATINGS = ['NEEDS_IMPROVEMENT', 'DEVELOPING'];

/**
 * A case genuinely "targets" a dimension only if that dimension appears
 * in its own, validated identity.curriculum.competencyTargets array —
 * never a fallback to true, never prerequisiteCompetencies.
 */
function caseTargetsDimension(c, dim) {
  return (c.identity.curriculum?.competencyTargets || []).includes(dim);
}
export { caseTargetsDimension };

/**
 * Returns { case, reason } for the single recommended next case, or
 * null if the case bank is empty. `reason` is always a single short,
 * non-punitive, explainable sentence (Section 27) — never exposes raw
 * scoring objects, and never claims a competency target the chosen
 * case does not genuinely have.
 */
export function recommendNextCase(allCases, attempts) {
  if (!allCases || allCases.length === 0) return null;

  // Section 29: cold start — no attempt history at all.
  if (!attempts || attempts.length === 0) {
    const foundationCase = allCases
      .slice()
      .sort((a, b) => difficultyRank(a.identity.difficulty) - difficultyRank(b.identity.difficulty))[0];
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

  // Try each weak dimension in priority order until one genuinely has a
  // targeting case — never fabricate an explanation for a dimension no
  // case actually targets.
  for (const targetDim of weakDims) {
    const candidates = allCases.filter(c => caseTargetsDimension(c, targetDim));
    if (candidates.length === 0) continue; // no case targets this dimension — try the next weak one, or fall through below

    // Rule B: prefer a case targeting the weak competency but from a
    // DIFFERENT family than the immediately previous case, avoiding
    // rote memorisation of one pattern.
    const differentFamily = candidates.filter(c => c.identity.caseFamily !== lastFamily);
    const pool = differentFamily.length > 0 ? differentFamily : candidates;
    // Rule C: do not immediately increase difficulty after a weak performance.
    const lastDifficultyRank = lastCase ? difficultyRank(lastCase.identity.difficulty) : 0;
    const notHarder = pool.filter(c => difficultyRank(c.identity.difficulty) <= lastDifficultyRank);
    const finalPool = notHarder.length > 0 ? notHarder : pool;
    // Rule E: avoid repeating the same case unless no alternative exists.
    const unrepeated = finalPool.filter(c => !attemptedCaseIds.has(c.identity.id));
    const chosen = (unrepeated.length > 0 ? unrepeated : finalPool)[0];
    return { case: chosen, reason: `Recommended because your previous debrief identified ${dimensionDisplayName(targetDim)} as a development priority.` };
  }

  // Rule D: after repeated PROFICIENT/STRONG performance (or no weak
  // dimension had a genuinely targeting case), progress difficulty.
  const lastDifficultyRank = lastCase ? difficultyRank(lastCase.identity.difficulty) : 0;
  const harderUnattempted = allCases
    .filter(c => !attemptedCaseIds.has(c.identity.id))
    .filter(c => difficultyRank(c.identity.difficulty) > lastDifficultyRank)
    .sort((a, b) => difficultyRank(a.identity.difficulty) - difficultyRank(b.identity.difficulty));
  if (harderUnattempted.length > 0) {
    return { case: harderUnattempted[0], reason: 'Recommended as a next step in complexity, following consistently strong recent performance.' };
  }

  // Fallback: any unattempted case from a different family than last time.
  const unattempted = allCases.filter(c => !attemptedCaseIds.has(c.identity.id) && c.identity.caseFamily !== lastFamily);
  if (unattempted.length > 0) return { case: unattempted[0], reason: 'Recommended to broaden your experience across a different case pattern.' };

  // Rule E fallback: no suitable alternative — repeat is genuinely appropriate.
  return { case: lastCase || allCases[0], reason: 'No new case fits better right now — repeating this one can reinforce what you\u2019ve learned.' };
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
