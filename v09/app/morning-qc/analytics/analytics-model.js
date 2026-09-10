/* =========================================================================
   v09/app/morning-qc/analytics/analytics-model.js

   Morning QC Room — Stage 12D Analytics Aggregation
   PROVENANCE: V09_NEW

   Section 35/41: aggregates anonymised attempt records into pedagogically
   interpretable metrics only. Explicitly distinguishes learner event
   (engine truth) from learner documentation claim (Section 41) — never
   collapses them.
   ========================================================================= */
import { EVENT_TYPES, EVENT_FIELD_SCHEMA, ANALYTICS_SCHEMA_VERSION } from './analytics-types.js';

export function validateEvent(event) {
  const errors = [];
  if (!EVENT_TYPES.includes(event.type)) { errors.push(`Unknown event type "${event.type}"`); return { valid: false, errors }; }
  const schema = EVENT_FIELD_SCHEMA[event.type];
  for (const field of schema.required) {
    if (!(field in event)) errors.push(`${event.type}: missing required field "${field}"`);
  }
  for (const field of schema.prohibited) {
    if (field in event) errors.push(`${event.type}: prohibited field "${field}" present`);
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Aggregates a list of CASE_COMPLETED-derived attempt records (the same
 * safe shape attempt-store.js persists) into instructor-facing metrics.
 * Only ever computes metrics with a genuine pedagogic interpretation
 * (Section 35) — never raw UI telemetry.
 */
export function aggregateAttempts(attempts) {
  const attemptsByCase = {};
  for (const a of attempts) attemptsByCase[a.caseId] = (attemptsByCase[a.caseId] || 0) + 1;

  const dimensionCounts = {};
  for (const a of attempts) {
    for (const c of a.competencyProfile || []) {
      if (!c.rating) continue;
      dimensionCounts[c.dimension] = dimensionCounts[c.dimension] || {};
      dimensionCounts[c.dimension][c.rating] = (dimensionCounts[c.dimension][c.rating] || 0) + 1;
    }
  }
  const lowRatedDimensions = Object.entries(dimensionCounts)
    .map(([dim, counts]) => ({ dimension: dim, needsImprovementCount: counts.NEEDS_IMPROVEMENT || 0 }))
    .filter(d => d.needsImprovementCount > 0)
    .sort((a, b) => b.needsImprovementCount - a.needsImprovementCount);

  const quadrantCounts = {};
  for (const a of attempts) {
    for (const d of a.decisionSummary || []) quadrantCounts[d.quadrant] = (quadrantCounts[d.quadrant] || 0) + 1;
  }
  const totalDecisions = Object.values(quadrantCounts).reduce((s, v) => s + v, 0);
  const unsupportedDecisionRate = totalDecisions > 0 ? (quadrantCounts.CORRECT_UNSUPPORTED || 0) + (quadrantCounts.INCORRECT_UNSUPPORTED || 0) : 0;

  const calibrationCounts = {};
  for (const a of attempts) {
    for (const c of a.confidenceSummary || []) calibrationCounts[c.category] = (calibrationCounts[c.category] || 0) + 1;
  }

  return {
    schemaVersion: ANALYTICS_SCHEMA_VERSION,
    totalAttempts: attempts.length,
    attemptsByCase,
    commonLowRatedCompetencies: lowRatedDimensions.slice(0, 5).map(d => d.dimension),
    decisionQuadrantCounts: quadrantCounts,
    unsupportedDecisionCount: unsupportedDecisionRate,
    confidenceCalibrationCounts: calibrationCounts,
  };
}
