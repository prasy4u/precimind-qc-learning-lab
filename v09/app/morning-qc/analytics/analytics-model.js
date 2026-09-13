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
import { SCORING_DIMENSIONS } from '../states.js';
import { CASE_DIFFICULTY_LEVELS } from '../case-schema.js';

const QUADRANTS = ['CORRECT_SUPPORTED', 'CORRECT_UNSUPPORTED', 'INCORRECT_SUPPORTED', 'INCORRECT_UNSUPPORTED'];
const CONFIDENCE_LEVELS = ['HIGH', 'MODERATE', 'LOW'];
const CALIBRATION_CATEGORIES = [
  'OVERCONFIDENT_WITH_INSUFFICIENT_EVIDENCE', 'APPROPRIATELY_CAUTIOUS', 'CORRECT_MODERATE',
  'CORRECT_CALIBRATED', 'CORRECT_UNDERCONFIDENT', 'INCORRECT_OVERCONFIDENT',
  'INCORRECT_APPROPRIATELY_UNCERTAIN', 'INCORRECT_MODERATE',
];
const RATINGS = ['NEEDS_IMPROVEMENT', 'DEVELOPING', 'PROFICIENT', 'STRONG', null];
const SERVICE_STATES = ['RUNNING', 'HELD', 'RESUMED', 'ESCALATED'];

function isPlainObject(v) { return v != null && typeof v === 'object' && !Array.isArray(v); }
function onlyKeys(obj, allowed) { return isPlainObject(obj) && Object.keys(obj).every(k => allowed.includes(k)); }

/**
 * Field-type/enum checks per scalar field name — applied to EVERY event
 * carrying that field name, regardless of event type. A field supplied
 * as the wrong type (e.g. a scalar field given as an object, a common
 * injection pattern) fails outright rather than merely being "present."
 */
function validateScalarField(field, value, errors, eventType) {
  switch (field) {
    case 'caseId': case 'panelId': case 'evidenceId': case 'decisionEventId': case 'decisionId': case 'reason':
      if (typeof value !== 'string') errors.push(`${eventType}: "${field}" must be a string (found ${typeof value})`);
      break;
    case 'timestamp':
      if (typeof value !== 'number' || !Number.isFinite(value)) errors.push(`${eventType}: "timestamp" must be a finite number`);
      break;
    case 'quadrant':
      if (!QUADRANTS.includes(value)) errors.push(`${eventType}: "quadrant" is not a recognized value ("${JSON.stringify(value)}")`);
      break;
    case 'confidence':
      if (!CONFIDENCE_LEVELS.includes(value)) errors.push(`${eventType}: "confidence" is not a recognized value ("${JSON.stringify(value)}")`);
      break;
    case 'category':
      if (!CALIBRATION_CATEGORIES.includes(value)) errors.push(`${eventType}: "category" is not a recognized calibration category ("${JSON.stringify(value)}")`);
      break;
    case 'wasSuccessful': case 'wasRecommended':
      if (typeof value !== 'boolean') errors.push(`${eventType}: "${field}" must be a boolean (found ${typeof value})`);
      break;
    case 'finalServiceState':
      if (!SERVICE_STATES.includes(value)) errors.push(`${eventType}: "finalServiceState" is not a recognized service state ("${JSON.stringify(value)}")`);
      break;
    case 'caseFamily':
      // Section 5 (FINAL ACCEPTANCE closure): caseFamily has no
      // authoritative enum in the current schema (case families are an
      // open, growing single-letter/short-code set defined per case, not
      // a fixed list) — kept as a documented string contract rather than
      // inventing a duplicate enum that would itself drift.
      if (typeof value !== 'string') errors.push(`${eventType}: "caseFamily" must be a string`);
      break;
    case 'difficulty':
      if (!CASE_DIFFICULTY_LEVELS.includes(value)) errors.push(`${eventType}: "difficulty" is not a recognized CASE_DIFFICULTY_LEVELS entry ("${JSON.stringify(value)}")`);
      break;
    case 'competencyProfile':
      if (!Array.isArray(value)) { errors.push(`${eventType}: "competencyProfile" must be an array`); break; }
      value.forEach((entry, i) => {
        if (!onlyKeys(entry, ['dimension', 'rating'])) errors.push(`${eventType}: competencyProfile[${i}] must contain ONLY {dimension, rating}`);
        else {
          if (!SCORING_DIMENSIONS.includes(entry.dimension)) errors.push(`${eventType}: competencyProfile[${i}].dimension is not a recognized SCORING_DIMENSIONS entry ("${entry.dimension}")`);
          if (!RATINGS.includes(entry.rating)) errors.push(`${eventType}: competencyProfile[${i}].rating is not a recognized rating`);
        }
      });
      break;
    default:
      break; // 'type' itself, already checked separately
  }
}

export function validateEvent(event) {
  const errors = [];
  if (!isPlainObject(event)) return { valid: false, errors: ['event must be a non-null, non-array object'] };
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
  // smuggling regardless of what name it's given.
  const allowedFields = new Set(['type', ...schema.required, ...schema.optional]);
  for (const field of Object.keys(event)) {
    if (!allowedFields.has(field)) {
      errors.push(`${event.type}: field "${field}" is not in the allowlist (type + required + optional) — rejected`);
    }
  }
  for (const field of schema.prohibited) {
    if (field in event) errors.push(`${event.type}: prohibited field "${field}" present`);
  }
  // Stage 12D FINAL closure Section 6: DEEP validation — every field's
  // own type/enum is checked, and nested competencyProfile entries are
  // validated recursively. Independently reproduced and closed: a
  // scalar field supplied as an object (e.g. caseId: {email:'...'}), or
  // a nested PII/groundTruth injection inside competencyProfile, no
  // longer passes merely because the top-level field NAME was allowed.
  for (const field of Object.keys(event)) {
    if (field === 'type') continue;
    validateScalarField(field, event[field], errors, event.type);
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

  // Section 10 corrective closure: safe, aggregate verification-behavior
  // analytics — never claims individual competence or staff performance,
  // only counts across the (already-anonymised) attempt set.
  // Section 6 (FINAL ACCEPTANCE closure): independently reproduced the
  // exact bug — a case with attemptCount=2, failedAttemptCount=1,
  // adequate=true previously reported "Failed verification attempts: 0"
  // (since only the FINAL adequate value was checked, never the actual
  // per-attempt failure count). Labels are now explicit about whether a
  // count is CASES or ATTEMPTS, and totalFailedVerificationAttempts is a
  // genuine sum of each record's own verificationSummary.failedAttemptCount.
  let casesWithNoVerificationAttempted = 0, totalFailedVerificationAttempts = 0, casesSuccessfullyVerified = 0, casesWithFailedBeforeSuccessfulPattern = 0;
  for (const a of attempts) {
    const vs = a.verificationSummary;
    if (!vs) continue;
    if (vs.attempted === false) casesWithNoVerificationAttempted += 1;
    else if (vs.attempted === true) {
      totalFailedVerificationAttempts += (vs.failedAttemptCount || 0);
      if (vs.adequate === true) casesSuccessfullyVerified += 1;
      if (vs.hadPrematureOrFailedAttemptBeforeSuccess === true) casesWithFailedBeforeSuccessfulPattern += 1;
    }
  }

  return {
    schemaVersion: ANALYTICS_SCHEMA_VERSION,
    totalAttempts: attempts.length,
    attemptsByCase,
    commonLowRatedCompetencies: lowRatedDimensions.slice(0, 5).map(d => d.dimension),
    decisionQuadrantCounts: quadrantCounts,
    unsupportedDecisionCount: unsupportedDecisionRate,
    confidenceCalibrationCounts: calibrationCounts,
    verificationBehavior: {
      casesWithNoVerificationAttempted,
      totalFailedVerificationAttempts,
      casesSuccessfullyVerified,
      casesWithFailedBeforeSuccessfulPattern,
    },
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
    // Section 7 corrective fix: never fabricate a confidence level.
    // Skip emitting CONFIDENCE_RECORDED entirely if the genuine
    // confidence value is missing — defaulting to MODERATE would
    // silently misrepresent a real HIGH or LOW confidence event.
    if (c.decisionEventId && c.category && c.confidence) {
      events.push({ type: 'CONFIDENCE_RECORDED', caseId: record.caseId, decisionEventId: c.decisionEventId, confidence: c.confidence, category: c.category, timestamp: record.completedAt || baseTimestamp });
    }
  }
  // Section 8 corrective fix: only emit VERIFICATION_ATTEMPTED when a
  // verification attempt genuinely occurred (attempted === true, strict
  // equality) — the prior `!= null` check treated attempted:false (no
  // attempt at all) as if an attempt had occurred and failed, which is
  // false analytics.
  if (record.verificationSummary && record.verificationSummary.attempted === true) {
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
