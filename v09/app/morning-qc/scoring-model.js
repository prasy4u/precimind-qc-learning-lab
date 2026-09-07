/* =========================================================================
   v09/app/morning-qc/scoring-model.js

   Morning QC Room — Stage 12A Scoring Model
   PROVENANCE: V09_NEW
   Revised during the Stage 12A independent-audit corrective closure.

   Section 19: a scoring MODEL, not final product gamification. Produces
   per-dimension qualitative ratings — never a single collapsed score.

   CORRECTIVE-CLOSURE CHANGES:
     - DECISION_APPROPRIATENESS now reads the outcomeAppropriate axis
       (correctness of the outcome per case-authored ground truth),
       NOT the reasoningSupported axis (which VERIFICATION_QUALITY and
       others already use). Previously this dimension accidentally
       measured the same thing as several others.
     - METACOGNITIVE_CALIBRATION now associates each confidence record
       with the SPECIFIC decision it names (via decisionId), not "the
       last decision in the entire case" — see computeCalibration().
     - INVESTIGATION_STRATEGY now explicitly penalizes missing high-value
       evidence, regardless of how efficient the OBTAINED evidence ratio
       looks — a learner who grabs one low-value item and stops no longer
       scores misleadingly well merely because they took few actions.
   ========================================================================= */

import { SCORING_DIMENSIONS } from './states.js';
import { summarizeDecisions } from './decision-model.js';
import { summarizeEvidenceUsage, summarizePanelUsage } from './evidence-model.js';

const RATINGS = ['NEEDS_IMPROVEMENT', 'DEVELOPING', 'PROFICIENT', 'STRONG'];

function rate(fraction) {
  if (fraction == null) return null;
  if (fraction < 0.25) return RATINGS[0];
  if (fraction < 0.5) return RATINGS[1];
  if (fraction < 0.8) return RATINGS[2];
  return RATINGS[3];
}

/**
 * Computes a qualitative rating per SCORING_DIMENSIONS from a completed
 * case trace. Every dimension is reported independently — there is no
 * combined numeric total exposed by this function, per Section 19.
 */
export function computeScoringProfile(caseObj, finalState) {
  const decisions = summarizeDecisions(finalState.actionHistory);
  const evidenceUsage = summarizeEvidenceUsage(caseObj, finalState);
  const panelUsage = summarizePanelUsage(caseObj, finalState);

  const containmentDecisions = decisions.filter(d => d.category === 'CONTAINMENT');
  const verificationDecisions = decisions.filter(d => d.category === 'VERIFICATION');
  const dispositionDecisions = decisions.filter(d => d.category === 'DISPOSITION');
  const patientImpactDecisions = decisions.filter(d => d.category === 'PATIENT_IMPACT_REVIEW');

  const fractionSupported = (arr) => arr.length > 0 ? arr.filter(d => d.reasoningSupported).length / arr.length : null;
  const fractionOutcomeAppropriate = (arr) => arr.length > 0 ? arr.filter(d => d.outcomeAppropriate).length / arr.length : null;

  const profile = {};
  profile.SIGNAL_RECOGNITION = rate(finalState.documentation.signal ? 1 : 0);
  profile.STATISTICAL_INTERPRETATION = null; // reserved
  profile.ANALYTICAL_REASONING = rate(fractionSupported(decisions.filter(d => d.category === 'INTERPRETATION')));
  profile.RULE_INTERPRETATION = null; // reserved
  profile.RISK_REASONING = rate(fractionSupported(containmentDecisions));
  // INVESTIGATION_STRATEGY: penalize missed high-value evidence directly,
  // not just the ratio among what was obtained (corrective-closure fix).
  {
    const hasMissedHighValue = evidenceUsage.highValueMissed.length > 0;
    if (hasMissedHighValue) {
      profile.INVESTIGATION_STRATEGY = evidenceUsage.efficiencyRatio != null
        ? RATINGS[Math.max(0, RATINGS.indexOf(rate(evidenceUsage.efficiencyRatio)) - 1)]
        : RATINGS[0];
    } else {
      profile.INVESTIGATION_STRATEGY = rate(evidenceUsage.efficiencyRatio);
    }
  }
  // EVIDENCE_SELECTION (FINAL-closure fix): must reflect BOTH avoiding
  // irrelevant information (selectivityRatio) AND actually obtaining the
  // relevant information that exists (recallRatio) — a pristine,
  // zero-inspection state must NOT score STRONG merely because it
  // trivially avoided irrelevant panels too. Combined via the MINIMUM of
  // the two ratios, so a recall failure drags the score down regardless
  // of selectivity. Returns null (not a numeric default) when there is
  // not yet enough panel-inspection behavior to judge meaningfully.
  {
    const sel = panelUsage.selectivityRatio;
    const rec = panelUsage.recallRatio;
    if (sel == null && rec == null) profile.EVIDENCE_SELECTION = null;
    else if (rec == null) profile.EVIDENCE_SELECTION = rate(sel);
    else if (sel == null) profile.EVIDENCE_SELECTION = rate(rec);
    else profile.EVIDENCE_SELECTION = rate(Math.min(sel, rec));
  }
  profile.PATIENT_IMPACT_REASONING = rate(fractionSupported(patientImpactDecisions));
  // DECISION_APPROPRIATENESS: outcome-correctness axis, not reasoning-support.
  profile.DECISION_APPROPRIATENESS = rate(fractionOutcomeAppropriate(dispositionDecisions));
  profile.VERIFICATION_QUALITY = rate(fractionSupported(verificationDecisions));
  profile.DOCUMENTATION_GOVERNANCE = rate(Object.values(finalState.documentation).filter(v => v != null && (Array.isArray(v) ? v.length > 0 : true)).length / Object.keys(finalState.documentation).length);
  profile.METACOGNITIVE_CALIBRATION = computeCalibration(finalState);

  for (const dim of SCORING_DIMENSIONS) {
    if (!(dim in profile)) profile[dim] = null;
  }
  return profile;
}

/**
 * Confidence calibration (Section 18, corrective-closure fix): each
 * confidence record is now matched to the SPECIFIC decision it names via
 * `decisionId` (looked up among action-history entries that executed a
 * case decision option), rather than always comparing against "the last
 * decision in the entire case." A confidence record whose decisionId
 * does not correspond to ANY decision actually made in the trace is
 * excluded from calibration (it cannot be scored against a decision that
 * never happened).
 */
/**
 * Confidence calibration (Section 18, ACCEPTANCE-closure fix): each
 * confidence record is matched to the SPECIFIC decision EVENT it names
 * via `decisionEventId` (not the reusable `decisionId`) — so a learner
 * who legitimately REVISES a decision under the same decisionId (per the
 * Room's REASSESS doctrine) and records new confidence is scored against
 * the exact revised event, never an earlier occurrence of the same
 * decision definition.
 */
function computeCalibration(finalState) {
  if (!finalState.confidenceRecords || finalState.confidenceRecords.length === 0) return null;
  const decisions = summarizeDecisions(finalState.actionHistory).filter(d => d.decisionEventId);
  let calibrated = 0, total = 0;
  for (const rec of finalState.confidenceRecords) {
    const matchingDecision = decisions.find(d => d.decisionEventId === rec.decisionEventId);
    if (!matchingDecision) continue; // defensive; engine.js already prevents this case
    total++;
    const highConfidenceCorrect = rec.confidence === 'HIGH' && matchingDecision.outcomeAppropriate;
    const lowConfidenceIncorrect = rec.confidence === 'LOW' && !matchingDecision.outcomeAppropriate;
    const moderateEither = rec.confidence === 'MODERATE';
    if (highConfidenceCorrect || lowConfidenceIncorrect || moderateEither) calibrated++;
  }
  return total > 0 ? rate(calibrated / total) : null;
}

export function classifyCalibrationCategory(confidence, wasCorrect) {
  if (wasCorrect && confidence === 'HIGH') return 'CORRECT_CALIBRATED';
  if (wasCorrect && confidence === 'LOW') return 'CORRECT_UNDERCONFIDENT';
  if (!wasCorrect && confidence === 'HIGH') return 'INCORRECT_OVERCONFIDENT';
  if (!wasCorrect && confidence === 'LOW') return 'INCORRECT_APPROPRIATELY_UNCERTAIN';
  return wasCorrect ? 'CORRECT_MODERATE' : 'INCORRECT_MODERATE';
}
