/* =========================================================================
   v09/app/morning-qc/scoring-model.js

   Morning QC Room — Stage 12A Scoring Model
   PROVENANCE: V09_NEW

   Section 19: establishes a scoring MODEL, not final product gamification.
   Produces per-dimension qualitative ratings (never a single collapsed
   score — Section 19 explicitly forbids this). Does not award points
   simply for opening every panel, and does not punish correctly ignoring
   irrelevant information (Section 19) — see evidence-model.js's
   selectivityRatio, which treats high selectivity as positive.
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
  const interventionDecisions = decisions.filter(d => d.category === 'INTERVENTION');
  const verificationDecisions = decisions.filter(d => d.category === 'VERIFICATION');
  const dispositionDecisions = decisions.filter(d => d.category === 'DISPOSITION');
  const patientImpactDecisions = decisions.filter(d => d.category === 'PATIENT_IMPACT_REVIEW');
  const investigationDecisions = decisions.filter(d => d.category === 'INVESTIGATION');

  const fractionSupported = (arr) => arr.length > 0 ? arr.filter(d => d.reasoningSupported).length / arr.length : null;

  const profile = {};
  profile.SIGNAL_RECOGNITION = rate(finalState.documentation.signal ? 1 : 0);
  profile.STATISTICAL_INTERPRETATION = null; // Stage 12A: not yet wired to a specific numeric-interpretation action; reserved for case-specific extension.
  profile.ANALYTICAL_REASONING = rate(fractionSupported(decisions.filter(d => d.category === 'INTERPRETATION')));
  profile.RULE_INTERPRETATION = null; // reserved: case-specific, populated when a case exercises rule-engine evidence directly.
  profile.RISK_REASONING = rate(fractionSupported(containmentDecisions));
  profile.INVESTIGATION_STRATEGY = rate(evidenceUsage.efficiencyRatio);
  profile.EVIDENCE_SELECTION = rate(panelUsage.selectivityRatio);
  profile.PATIENT_IMPACT_REASONING = rate(fractionSupported(patientImpactDecisions));
  profile.DECISION_APPROPRIATENESS = rate(fractionSupported(dispositionDecisions));
  profile.VERIFICATION_QUALITY = rate(fractionSupported(verificationDecisions));
  profile.DOCUMENTATION_GOVERNANCE = rate(Object.values(finalState.documentation).filter(v => v != null && (Array.isArray(v) ? v.length > 0 : true)).length / Object.keys(finalState.documentation).length);
  profile.METACOGNITIVE_CALIBRATION = computeCalibration(finalState);

  // Every SCORING_DIMENSIONS key must be present (even if null/reserved),
  // so downstream consumers can rely on a stable shape.
  for (const dim of SCORING_DIMENSIONS) {
    if (!(dim in profile)) profile[dim] = null;
  }
  return profile;
}

/**
 * Confidence calibration (Section 18): confidence is never used as a
 * substitute for correctness. This classifies each recorded confidence
 * value against whether the corresponding decision (nearest-in-time
 * action) was reasoning-supported, without altering correctness itself.
 */
function computeCalibration(finalState) {
  if (!finalState.confidenceRecords || finalState.confidenceRecords.length === 0) return null;
  const decisions = summarizeDecisions(finalState.actionHistory);
  let calibrated = 0, total = 0;
  for (const rec of finalState.confidenceRecords) {
    const nearestDecision = decisions[decisions.length - 1]; // Stage 12A: simple nearest-prior-decision heuristic
    if (!nearestDecision) continue;
    total++;
    const highConfidenceCorrect = rec.confidence === 'HIGH' && nearestDecision.reasoningSupported;
    const lowConfidenceIncorrect = rec.confidence === 'LOW' && !nearestDecision.reasoningSupported;
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
