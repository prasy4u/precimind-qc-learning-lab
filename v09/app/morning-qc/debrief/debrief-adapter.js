/* =========================================================================
   v09/app/morning-qc/debrief/debrief-adapter.js

   Morning QC Room — Stage 12C Debrief Adapter
   PROVENANCE: V09_NEW

   The ONLY learner-facing projection layer for the debrief (Section 30).
   Consumes Stage 12A's generateDebrief(), summarizeDecisions(), and
   computeScoringProfile() DIRECTLY — this module recalculates NOTHING.
   Every rating, outcome-appropriateness, reasoning-support, calibration
   category, and evidence-value judgment is read straight from Stage 12A;
   this file only RESHAPES and LABELS those values for display, and
   layers in the debrief entry gate (Section 8).

   SAFETY-CRITICAL CONTRACT: getDebriefProjection() throws if the case is
   not legitimately debriefable (Section 8) — this is the actual security
   boundary, not merely a UI convenience, since it is the sole place
   caseObj.groundTruth is ever read for learner-facing purposes. Nothing
   in v09/app/morning-qc/debrief/** may import or read `caseObj.groundTruth`
   directly; everything must flow through this adapter's return value.
   ========================================================================= */

import { generateDebrief } from '../debrief-model.js';
import { summarizeDecisions, classifyDecision } from '../decision-model.js';
import { computeScoringProfile, classifyDecisionCalibration } from '../scoring-model.js';
import { SCORING_DIMENSIONS } from '../states.js';

/**
 * Section 8: the debrief entry gate. A case is legitimately debriefable
 * when EITHER the learner has explicitly asked to finish (a presentation-
 * only flag the Room tracks, analogous to drawer-open state — never
 * simulation truth) OR the case has reached a genuine terminal service
 * disposition (RESUMED/ESCALATED). Acknowledging the signal at minimum
 * is required — an utterly untouched case has nothing yet to debrief.
 */
export function isDebriefable(state, { learnerRequestedFinish = false } = {}) {
  if (!state) return false;
  const hasEngaged = state.documentation.signal != null || (state.actionHistory || []).length > 0;
  if (!hasEngaged) return false;
  return learnerRequestedFinish === true || ['RESUMED', 'ESCALATED'].includes(state.serviceState);
}

/**
 * The sole entry point for learner-facing debrief data. Throws if the
 * case is not legitimately debriefable — this is a genuine safety
 * boundary (Section 8), not just a UI nicety: callers cannot obtain a
 * projection of ground-truth-derived content by any other path.
 */
export function getDebriefProjection(caseObj, state, options) {
  if (!isDebriefable(state, options)) {
    throw new Error('Case is not yet legitimately debriefable — the debrief gate has not been satisfied.');
  }

  const debrief = generateDebrief(caseObj, state);
  const decisions = summarizeDecisions(state.actionHistory);

  // ---- Case resolution (Section 9) — derived from case/debrief model, never hardcoded per-pilot ----
  const gt = caseObj.groundTruth || {};
  const caseResolution = {
    disturbanceDescription: gt.disturbanceEstablished ? gt.disturbanceDescription : null,
    rootCauseDescription: gt.rootCauseEstablished ? gt.rootCauseDescription : null,
    signalExplanationDescription: gt.signalExplanationEstablished ? gt.signalExplanationDescription : null,
    patientImpactStatus: gt.patientImpactStatus || null,
    appropriateDisposition: gt.appropriateDisposition || null,
    actualServiceState: state.serviceState,
    verificationAdequate: debrief.verification.adequate,
  };

  // ---- Decision review (Section 11) — chronological, by decisionEventId ----
  const decisionReview = decisions
    .filter(d => d.decisionEventId)
    .map(d => {
      const opportunity = (caseObj.decisionOpportunities || []).find(o => o.id === d.decisionId);
      const option = opportunity ? (opportunity.options || []).find(o => o.id === d.optionId) : null;
      const confidenceRecord = (state.confidenceRecords || []).find(r => r.decisionEventId === d.decisionEventId);
      let quadrant;
      if (d.outcomeAppropriate && d.reasoningSupported) quadrant = 'CORRECT_SUPPORTED';
      else if (d.outcomeAppropriate && !d.reasoningSupported) quadrant = 'CORRECT_UNSUPPORTED';
      else if (!d.outcomeAppropriate && d.reasoningSupported) quadrant = 'INCORRECT_SUPPORTED';
      else quadrant = 'INCORRECT_UNSUPPORTED';
      return {
        decisionEventId: d.decisionEventId,
        decisionId: d.decisionId,
        category: d.category,
        choiceLabel: option ? option.label : d.actionType,
        explanation: option ? option.consequenceSummary : null, // safe ONLY here, post-gate
        outcomeAppropriate: d.outcomeAppropriate,
        reasoningSupported: d.reasoningSupported,
        quadrant,
        confidence: confidenceRecord ? confidenceRecord.confidence : null,
      };
    });

  // ---- Confidence calibration (Section 12/13) — by decisionEventId, never grouped by reusable decisionId ----
  const confidenceCalibration = decisionReview
    .filter(d => d.confidence != null)
    .map(d => ({
      decisionEventId: d.decisionEventId,
      decisionId: d.decisionId,
      confidence: d.confidence,
      category: classifyDecisionCalibration(d.confidence, d.outcomeAppropriate, d.reasoningSupported),
    }));

  // ---- Revised decisions (Section 13): group by reusable decisionId, preserving each event separately ----
  const revisedDecisionGroups = {};
  for (const d of decisionReview) {
    if (!d.decisionId) continue;
    (revisedDecisionGroups[d.decisionId] = revisedDecisionGroups[d.decisionId] || []).push(d);
  }
  const revisedDecisions = Object.entries(revisedDecisionGroups)
    .filter(([, events]) => events.length > 1)
    .map(([decisionId, events]) => ({ decisionId, events }));

  // ---- Evidence review (Section 14) ----
  const evidenceReview = {
    obtained: debrief.evidenceValue,
    highValueMissed: debrief.missed.highValueEvidenceMissed,
    relevantPanelsUninspected: debrief.missed.relevantPanelsUninspected,
  };

  // ---- Reasoning timeline (Section 15) — real action history, POST-gate may include severity/outcome ----
  const reasoningTimeline = (state.actionHistory || []).map((h, i) => ({
    index: i,
    type: h.type,
    panelId: h.panelId ?? null,
    evidenceId: h.evidenceId ?? null,
    hypothesisId: h.hypothesisId ?? null,
    decisionId: h.decisionId ?? null,
    decisionEventId: h.decisionEventId ?? null,
    outcomeAppropriate: h.outcomeAppropriate,
    reasoningSupported: h.reasoningSupported,
  }));

  // ---- Hypothesis review (Section 16) — only genuinely-considered hypotheses; no hidden-catalogue dump ----
  const hypothesisReview = (caseObj.hypotheses || [])
    .filter(h => (state.systemEvents?.hypothesesFormed || []).includes(h.id))
    .map(h => {
      const gtEntry = (gt.evidenceForHypotheses || []).find(e => e.hypothesisId === h.id);
      return {
        id: h.id,
        label: h.label,
        finalState: state.hypothesisStates ? state.hypothesisStates[h.id] : null,
        wasSupportedByGroundTruth: gtEntry ? gtEntry.supports : null,
      };
    });

  // ---- Documentation vs executed (Section 10) ----
  const documentationVsExecuted = {
    documentedFinalDisposition: debrief.disposition.documentedFinalDisposition,
    executedDisposition: debrief.disposition.executedDisposition,
    documentedEstablishedCause: state.documentation.establishedCause,
    documentedEscalation: state.documentation.escalation,
    actualInterventionApplied: debrief.intervention.applied,
    actualServiceState: state.serviceState,
  };

  // ---- Patient-safety review (Section 17) ----
  const patientSafetyReview = {
    containmentTimely: debrief.containment.timely,
    containmentNote: debrief.containment.note,
    patientImpactAddressed: debrief.patientImpact.addressed,
    patientImpactFinalState: debrief.patientImpact.finalState,
    verificationAttempted: debrief.verification.attempted,
    verificationAdequate: debrief.verification.adequate,
    verificationNote: debrief.verification.note,
  };

  // ---- Competency profile (Section 19) — exact Stage 12A rating bands, never invented pseudo-precision ----
  const competencyProfile = SCORING_DIMENSIONS.map(dim => ({
    dimension: dim,
    rating: debrief.scoringProfile[dim],
  }));

  // ---- Learning priorities (Section 20) — max 3, derived from real weak dimensions ----
  const WEAK_RATINGS = ['NEEDS_IMPROVEMENT', 'DEVELOPING'];
  const weakDimensions = competencyProfile.filter(c => WEAK_RATINGS.includes(c.rating));
  const strongDimensions = competencyProfile.filter(c => c.rating === 'STRONG');
  const learningPriorities = weakDimensions.slice(0, 3).map(c => c.dimension);
  const strengths = strongDimensions.slice(0, 2).map(c => c.dimension);

  // ---- Recommended labs (Section 21) — max 3, mapped from weak dimensions to EXISTING lab names only ----
  const DIMENSION_TO_LAB = {
    RULE_INTERPRETATION: 'Rule Laboratory',
    ANALYTICAL_REASONING: 'Rule Laboratory',
    INVESTIGATION_STRATEGY: 'Investigation Lab',
    STATISTICAL_INTERPRETATION: 'Sigma Sandbox',
    VERIFICATION_QUALITY: 'Investigation Lab',
    EVIDENCE_SELECTION: 'Investigation Lab',
  };
  const recommendedLabs = [...new Set(weakDimensions.map(c => DIMENSION_TO_LAB[c.dimension]).filter(Boolean))].slice(0, 3);

  return {
    caseIdentity: caseObj.identity,
    caseResolution,
    decisionReview,
    confidenceCalibration,
    revisedDecisions,
    evidenceReview,
    reasoningTimeline,
    hypothesisReview,
    documentationVsExecuted,
    patientSafetyReview,
    competencyProfile,
    learningPriorities,
    strengths,
    recommendedLabs,
    commonMisconceptions: debrief.commonMisconceptions,
  };
}
