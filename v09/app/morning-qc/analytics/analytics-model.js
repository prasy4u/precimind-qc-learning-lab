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
  // Stage 12D Section 12 corrective closure: independent audit proved
  // that DECISION_EXECUTED+email+staffId and CASE_COMPLETED+learnerName+
  // institution both previously validated, because the prior check only
  // rejected fields explicitly named in each event's small `prohibited`
  // array. Switched to a STRICT ALLOWLIST — type + schema.required +
  // schema.optional — so ANY field outside that exact set fails
  // validation, automatically preventing hidden/internal/PII payload
  // smuggling regardless of what name it's given. The explicit
  // groundTruth check in `prohibited` is retained as defense-in-depth
  // (a field named exactly "groundTruth" is guaranteed to be flagged
  // even if a future schema change ever added it to required/optional
  // by mistake).
  const allowedFields = new Set(['type', ...schema.required, ...schema.optional]);
  for (const field of Object.keys(event)) {
    if (!allowedFields.has(field)) {
      errors.push(`${event.type}: field "${field}" is not in the allowlist (type + required + optional) — rejected`);
    }
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

/**
 * Stage 12D Section 16: a deterministic, safe event-projection function
 * — makes the 10-event schema OPERATIONAL rather than dead
 * documentation. Projects a genuine, already-sanitized attempt record
 * (the same shape attempt-store.js persists) into a sequence of
 * schema-valid events. Every generated event is verified against
 * validateEvent() before being returned — if any generated event would
 * fail, this throws rather than silently emitting an invalid event.
 * No external transmission ever occurs; this is a pure, local
 * projection function.
 */
export function projectEventsFromAttempt(record) {
  const events = [];
  const baseTimestamp = record.startedAt || 0;

  events.push({ type: 'CASE_STARTED', caseId: record.caseId, timestamp: baseTimestamp, ...(record.caseFamily != null ? { caseFamily: record.caseFamily } : {}), ...(record.difficulty != null ? { difficulty: record.difficulty } : {}) });

  for (const d of record.decisionSummary || []) {
    if (d.decisionEventId && d.decisionId && d.quadrant) {
      events.push({ type: 'DECISION_EXECUTED', caseId: record.caseId, decisionEventId: d.decisionEventId, decisionId: d.decisionId, quadrant: d.quadrant, timestamp: record.completedAt || baseTimestamp });
    }
  }
  for (const c of record.confidenceSummary || []) {
    if (c.decisionEventId && c.category) {
      events.push({ type: 'CONFIDENCE_RECORDED', caseId: record.caseId, decisionEventId: c.decisionEventId, confidence: c.confidence || 'MODERATE', category: c.category, timestamp: record.completedAt || baseTimestamp });
    }
  }
  if (record.verificationSummary && record.verificationSummary.attempted != null) {
    events.push({ type: 'VERIFICATION_ATTEMPTED', caseId: record.caseId, wasSuccessful: !!record.verificationSummary.adequate, timestamp: record.completedAt || baseTimestamp });
  }
  events.push({ type: 'CASE_COMPLETED', caseId: record.caseId, finalServiceState: record.finalServiceState, timestamp: record.completedAt || baseTimestamp, ...(record.competencyProfile != null ? { competencyProfile: record.competencyProfile } : {}) });
  events.push({ type: 'DEBRIEF_VIEWED', caseId: record.caseId, timestamp: record.completedAt || baseTimestamp });

  for (const ev of events) {
    const result = validateEvent(ev);
    if (!result.valid) {
      throw new Error(`projectEventsFromAttempt() produced an invalid event (${ev.type}): ${result.errors.join('; ')}`);
    }
  }
  return events;
}
