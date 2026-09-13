/* =========================================================================
   v09/app/morning-qc/adaptive/case-recommender.js

   Morning QC Room — Stage 12D Deterministic Case Recommender
   PROVENANCE: V09_MODIFIED (Stage 12D FINAL adaptive/privacy/analytics closure)

   Section 4/25-29: transparent, deterministic, explainable, reversible,
   non-punitive rules. Never uses random ranking, opaque ML, or external
   API calls. Inputs: prior competency ratings, prior attempted cases
   (by ID/family), case metadata (difficulty/family/competency targets).
   NEVER reads hidden ground truth of any case.

   FINAL CLOSURE FIXES:

   Section 1 (Rule C enforcement): previously, if every case genuinely
   targeting a weak dimension happened to be HARDER than the last
   attempted case, the code fell back to the harder pool anyway,
   violating "do not immediately increase difficulty after a weak
   performance" (independently reproduced: Level 1 weak performance ->
   a Level 3 recommendation). Now, when no same-or-lower-difficulty
   targeting case exists, the recommender NEVER silently escalates —
   it instead recommends genuine consolidation practice (any
   unattempted, same-or-lower-difficulty case, preferring a different
   family) with an HONEST explanation that a harder targeting case
   exists but is being deliberately deferred; the learner may still
   choose that harder case directly from "Browse all cases."

   Section 2 (honest no-target-case behavior): when weak dimensions
   exist but NONE has any targeting case anywhere in the bank, the
   recommender must never claim "following consistently strong recent
   performance" — that is a claim about performance, not target
   availability, and asserting it here would be false. It now uses a
   separate, honest "broadening/consolidation" message and does not
   escalate difficulty.

   Section 3 (Rule D requires REPEATED strong performance): a single
   synthetic all-STRONG attempt previously triggered immediate
   difficulty escalation. The documented doctrine ("after REPEATED
   PROFICIENT/STRONG performance") is now enforced with a transparent,
   deterministic threshold: at least 2 attempts, AND no weak dimension
   present, before Rule D difficulty escalation is offered.
   ========================================================================= */
import { buildCompetencyHistory } from './competency-history.js';
import { CASE_DIFFICULTY_LEVELS } from '../case-schema.js';

function difficultyRank(difficulty) {
  const idx = CASE_DIFFICULTY_LEVELS.indexOf(difficulty);
  return idx === -1 ? 0 : idx;
}

const WEAK_RATINGS = ['NEEDS_IMPROVEMENT', 'DEVELOPING'];

/** Section 3: the deterministic threshold for Rule D escalation — documented here, not buried in a magic number. */
export const MIN_ATTEMPTS_FOR_STRONG_PROGRESSION = 2;

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
 * Section 1 (FINAL ACCEPTANCE closure): genuine repeated-strong-
 * performance gate for Rule D. Independently reproduced: two attempts
 * with EMPTY or ALL-NULL competencyProfile previously satisfied
 * `attempts.length >= MIN_ATTEMPTS_FOR_STRONG_PROGRESSION` and
 * triggered a false "following consistently strong recent performance"
 * claim. This helper requires that the most recent
 * MIN_ATTEMPTS_FOR_STRONG_PROGRESSION attempts each contain at least
 * one genuinely evaluated (non-null-rating) competency, and that every
 * evaluated rating across those attempts is PROFICIENT or STRONG — an
 * empty/all-null profile, or any NEEDS_IMPROVEMENT/DEVELOPING
 * observation, never counts as strong performance.
 */
export function hasRepeatedStrongPerformance(attempts) {
  if (!attempts || attempts.length < MIN_ATTEMPTS_FOR_STRONG_PROGRESSION) return false;
  const recent = attempts.slice(-MIN_ATTEMPTS_FOR_STRONG_PROGRESSION);
  for (const attempt of recent) {
    const evaluated = (attempt.competencyProfile || []).filter(p => p.rating != null);
    if (evaluated.length === 0) return false; // empty or all-null — never counts
    if (!evaluated.every(p => p.rating === 'PROFICIENT' || p.rating === 'STRONG')) return false;
  }
  return true;
}

/**
 * Returns { case, reason } for the single recommended next case, or
 * null if the case bank is empty. `reason` is always a single short,
 * non-punitive, explainable sentence — never exposes raw scoring
 * objects, never claims a competency target the chosen case does not
 * genuinely have, and never claims strong performance that was not
 * genuinely observed.
 */
export function recommendNextCase(allCases, attempts) {
  if (!allCases || allCases.length === 0) return null;

  // Cold start — no attempt history at all.
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
  const lastDifficultyRank = lastCase ? difficultyRank(lastCase.identity.difficulty) : 0;

  // Rule A: prioritise NEEDS_IMPROVEMENT before DEVELOPING.
  const weakDims = Object.entries(history)
    .filter(([, h]) => WEAK_RATINGS.includes(h.latestRating))
    .sort(([, a], [, b]) => (a.latestRating === 'NEEDS_IMPROVEMENT' ? 0 : 1) - (b.latestRating === 'NEEDS_IMPROVEMENT' ? 0 : 1))
    .map(([dim]) => dim);

  let anyWeakDimHadATargetingCaseAnywhere = false;

  for (const targetDim of weakDims) {
    const candidates = allCases.filter(c => caseTargetsDimension(c, targetDim));
    if (candidates.length === 0) continue; // no case anywhere targets this dimension — try the next weak one

    anyWeakDimHadATargetingCaseAnywhere = true;

    // Rule B: prefer a case targeting the weak competency but from a
    // DIFFERENT family than the immediately previous case.
    const differentFamily = candidates.filter(c => c.identity.caseFamily !== lastFamily);
    const pool = differentFamily.length > 0 ? differentFamily : candidates;
    // Rule C: do not immediately increase difficulty after a weak performance.
    const notHarder = pool.filter(c => difficultyRank(c.identity.difficulty) <= lastDifficultyRank);

    if (notHarder.length > 0) {
      const unrepeated = notHarder.filter(c => !attemptedCaseIds.has(c.identity.id));
      const chosen = (unrepeated.length > 0 ? unrepeated : notHarder)[0];
      return { case: chosen, reason: `Recommended because your previous debrief identified ${dimensionDisplayName(targetDim)} as a development priority.` };
    }

    // Every case genuinely targeting this weak dimension is HARDER than
    // the last attempt. Rule C forbids escalating automatically here —
    // recommend genuine consolidation practice instead (never claiming
    // it targets the weak dimension, since it may not).
    const consolidationPool = allCases.filter(c => difficultyRank(c.identity.difficulty) <= lastDifficultyRank && c.identity.caseFamily !== lastFamily);
    const unrepeatedConsolidation = consolidationPool.filter(c => !attemptedCaseIds.has(c.identity.id));
    if (unrepeatedConsolidation.length > 0) {
      return { case: unrepeatedConsolidation[0], reason: `Recommended as consolidation practice at your current level. A case targeting ${dimensionDisplayName(targetDim)} exists, but only at a higher difficulty — you can choose it directly from "Browse all cases" if you feel ready.` };
    }
    return { case: lastCase || allCases[0], reason: `Recommended as consolidation practice. A case targeting ${dimensionDisplayName(targetDim)} exists, but only at a higher difficulty — repeating this case first can help reinforce foundation skills.` };
  }

  // At this point, either there were no weak dimensions at all, or every
  // weak dimension had NO targeting case anywhere in the bank.
  if (weakDims.length > 0 && !anyWeakDimHadATargetingCaseAnywhere) {
    // Section 2: honest broadening message — NEVER the strong-performance
    // escalation message, and difficulty is never increased here.
    const broadeningPool = allCases.filter(c => !attemptedCaseIds.has(c.identity.id) && c.identity.caseFamily !== lastFamily && difficultyRank(c.identity.difficulty) <= lastDifficultyRank);
    if (broadeningPool.length > 0) {
      return { case: broadeningPool[0], reason: 'Recommended to broaden your experience — no case in the current bank specifically targets your most recent development priority yet, so this continues practice at your current level.' };
    }
    const anyUnattempted = allCases.filter(c => !attemptedCaseIds.has(c.identity.id));
    if (anyUnattempted.length > 0) {
      return { case: anyUnattempted[0], reason: 'Recommended to broaden your experience — no case in the current bank specifically targets your most recent development priority yet.' };
    }
    return { case: lastCase || allCases[0], reason: 'No new case fits better right now — repeating this one can reinforce what you\u2019ve learned.' };
  }

  // Rule D: genuinely no weak dimension is currently active. Requires
  // REPEATED, genuinely-evaluated strong performance (never merely
  // `attempts.length >= threshold` — empty/all-null profiles must
  // never satisfy this).
  if (hasRepeatedStrongPerformance(attempts)) {
    const harderUnattempted = allCases
      .filter(c => !attemptedCaseIds.has(c.identity.id))
      .filter(c => difficultyRank(c.identity.difficulty) > lastDifficultyRank)
      .sort((a, b) => difficultyRank(a.identity.difficulty) - difficultyRank(b.identity.difficulty));
    if (harderUnattempted.length > 0) {
      return { case: harderUnattempted[0], reason: 'Recommended as a next step in complexity, following consistently strong recent performance.' };
    }
  }

  // Fallback: any unattempted case from a different family than last
  // time (never claims strong performance — this is a neutral
  // broadening pick). Prefers a same-or-lower-difficulty case first —
  // only genuine repeated strong performance (Rule D, above) may
  // automatically progress difficulty; an unproven performance record
  // (neither weak nor confirmed strong) must not incidentally spike
  // difficulty through this neutral path either.
  const unattemptedNotHarder = allCases.filter(c => !attemptedCaseIds.has(c.identity.id) && c.identity.caseFamily !== lastFamily && difficultyRank(c.identity.difficulty) <= lastDifficultyRank);
  if (unattemptedNotHarder.length > 0) return { case: unattemptedNotHarder[0], reason: 'Recommended to broaden your experience across a different case pattern.' };
  const unattempted = allCases.filter(c => !attemptedCaseIds.has(c.identity.id) && c.identity.caseFamily !== lastFamily);
  if (unattempted.length > 0) return { case: unattempted[0], reason: 'Recommended to broaden your experience across a different case pattern.' };

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
