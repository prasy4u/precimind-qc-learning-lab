/* =========================================================================
   v09/app/morning-qc/adaptive/attempt-store.js

   Morning QC Room — Stage 12D Local Learner Attempt Store
   PROVENANCE: V09_MODIFIED (Stage 12D FINAL closure — Items 4-5)

   Section 20-22: a deterministic, local-only persistence layer for
   learner attempt records. Uses window.localStorage when available
   (browser/production), falling back to an injectable in-memory Map
   (Node/tests) — no new dependency, no external network call, ever.

   FINAL CLOSURE FIX (Item 4 — deep structural validation): the prior
   validator only checked TOP-LEVEL field names, so a record like
   `{ competencyProfile: [{ email: '...', groundTruth: {...} }] }` or
   even `{}` / `{ attemptId: 'x' }` validated successfully — a nested
   or absent-field attack was never actually caught. Every field is now
   validated for type AND, for nested array/object fields, every
   element's OWN keys and enum values are checked against a strict
   per-field allowlist. An unknown nested key, wrong type, or malformed/
   incomplete record is rejected outright.

   FINAL CLOSURE FIX (Item 5 — validate on read): records written before
   this closure (or by any other code path) could not previously be
   guaranteed to satisfy the deep schema. `readAll()` now re-validates
   every stored record and silently drops (never returns) any record
   that fails deep validation — an invalid legacy record can never reach
   the recommender or instructor analytics. This is schema option (A)
   from the audit (a documented migration): older records are
   revalidated in place rather than requiring a storage-key version
   bump, since the deep validator can correctly assess ANY record,
   including ones written before this fix existed.
   ========================================================================= */
import { SCORING_DIMENSIONS } from '../states.js';
import { CASE_DIFFICULTY_LEVELS, CASE_SCHEMA_VERSION } from '../case-schema.js';

const STORAGE_KEY = 'precimind-morningqc-attempts-v1';

const RATINGS = ['NEEDS_IMPROVEMENT', 'DEVELOPING', 'PROFICIENT', 'STRONG', null];
const QUADRANTS = ['CORRECT_SUPPORTED', 'CORRECT_UNSUPPORTED', 'INCORRECT_SUPPORTED', 'INCORRECT_UNSUPPORTED'];
const CONFIDENCE_LEVELS = ['HIGH', 'MODERATE', 'LOW'];
const CALIBRATION_CATEGORIES = [
  'OVERCONFIDENT_WITH_INSUFFICIENT_EVIDENCE', 'APPROPRIATELY_CAUTIOUS', 'CORRECT_MODERATE',
  'CORRECT_CALIBRATED', 'CORRECT_UNDERCONFIDENT', 'INCORRECT_OVERCONFIDENT',
  'INCORRECT_APPROPRIATELY_UNCERTAIN', 'INCORRECT_MODERATE',
];
const SERVICE_STATES = ['RUNNING', 'HELD', 'RESUMED', 'ESCALATED'];
const ACTION_TYPES_SAFE = [
  'ACKNOWLEDGE_SIGNAL', 'HOLD_RESULTS', 'CONTINUE_ANALYSIS', 'INSPECT_PANEL', 'FORM_HYPOTHESIS',
  'REQUEST_EVIDENCE', 'APPLY_INTERVENTION', 'REPEAT_QC', 'VERIFY_RECOVERY', 'REVIEW_PATIENT_IMPACT',
  'RESUME_SERVICE', 'ESCALATE', 'DOCUMENT',
];

function isPlainObject(v) { return v != null && typeof v === 'object' && !Array.isArray(v); }
function onlyKeys(obj, allowed) { return isPlainObject(obj) && Object.keys(obj).every(k => allowed.includes(k)); }
function isFiniteNumber(v) { return typeof v === 'number' && Number.isFinite(v); }
function isNonNegativeInt(v) { return Number.isInteger(v) && v >= 0; }

/**
 * Deep, structural validation of an attempt record. Every allowed field
 * is checked for type; every nested array/object element's OWN keys
 * are checked against a strict per-field allowlist and, where
 * applicable, enum-validated. Returns {valid, errors} — never silently
 * strips or coerces; any deviation is a hard validation failure.
 */
export function validateAttemptRecord(record) {
  const errors = [];
  if (!isPlainObject(record)) return { valid: false, errors: ['attempt record must be a non-null, non-array object'] };

  const TOP_LEVEL_ALLOWED = [
    'attemptId', 'caseId', 'caseFamily', 'difficulty', 'caseSchemaVersion',
    'startedAt', 'completedAt', 'competencyProfile', 'decisionSummary', 'confidenceSummary',
    'evidenceSummary', 'panelSummary', 'verificationSummary', 'finalServiceState', 'executedFinalDisposition',
    'recommendedLearningPriorities',
  ];
  for (const key of Object.keys(record)) {
    if (!TOP_LEVEL_ALLOWED.includes(key)) errors.push(`top-level field outside the strict allowlist: "${key}"`);
  }

  // Required, minimally-populated fields — an empty {} or a record
  // missing the identifying fields is rejected outright.
  // Section 2 (FINAL ACCEPTANCE closure): the persistence contract must
  // agree with the analytics contract. Previously, {attemptId, caseId}
  // alone validated successfully, even though projectEventsFromAttempt()
  // then failed on the missing fields it genuinely needs (e.g.
  // finalServiceState). Every field buildAttemptRecord() actually always
  // produces is now REQUIRED — an incomplete record is rejected outright
  // rather than accepted and failing downstream.
  const CANONICAL_REQUIRED_FIELDS = [
    'attemptId', 'caseId', 'caseSchemaVersion', 'startedAt', 'completedAt',
    'competencyProfile', 'decisionSummary', 'confidenceSummary', 'evidenceSummary',
    'panelSummary', 'verificationSummary', 'finalServiceState', 'executedFinalDisposition',
    'recommendedLearningPriorities', 'caseFamily', 'difficulty',
  ];
  for (const field of CANONICAL_REQUIRED_FIELDS) {
    // executedFinalDisposition may legitimately be null (no disposition
    // decision reached yet) — its presence as a key is required, but
    // null is an accepted value, not a missing field.
    if (!(field in record)) errors.push(`missing required field "${field}"`);
  }

  if (typeof record.attemptId !== 'string' || record.attemptId.length === 0) errors.push('attemptId must be a non-empty string');
  if (typeof record.caseId !== 'string' || record.caseId.length === 0) errors.push('caseId must be a non-empty string');

  if ('caseFamily' in record && typeof record.caseFamily !== 'string') errors.push('caseFamily must be a string when present');
  if ('difficulty' in record && !CASE_DIFFICULTY_LEVELS.includes(record.difficulty)) errors.push(`difficulty must be a recognized CASE_DIFFICULTY_LEVELS entry (found "${record.difficulty}")`);
  if ('caseSchemaVersion' in record && record.caseSchemaVersion !== CASE_SCHEMA_VERSION) errors.push(`caseSchemaVersion must exactly match the current supported schema version (found "${record.caseSchemaVersion}", expected "${CASE_SCHEMA_VERSION}")`);
  if ('startedAt' in record && !isFiniteNumber(record.startedAt)) errors.push('startedAt must be a finite number');
  if ('completedAt' in record && !isFiniteNumber(record.completedAt)) errors.push('completedAt must be a finite number');

  if ('competencyProfile' in record) {
    if (!Array.isArray(record.competencyProfile)) errors.push('competencyProfile must be an array');
    else {
      record.competencyProfile.forEach((entry, i) => {
        if (!onlyKeys(entry, ['dimension', 'rating'])) errors.push(`competencyProfile[${i}]: must contain ONLY {dimension, rating}`);
        else {
          if (!SCORING_DIMENSIONS.includes(entry.dimension)) errors.push(`competencyProfile[${i}].dimension: not a recognized SCORING_DIMENSIONS entry ("${entry.dimension}")`);
          if (!RATINGS.includes(entry.rating)) errors.push(`competencyProfile[${i}].rating: not a recognized rating ("${entry.rating}")`);
        }
      });
    }
  }

  if ('decisionSummary' in record) {
    if (!Array.isArray(record.decisionSummary)) errors.push('decisionSummary must be an array');
    else {
      record.decisionSummary.forEach((entry, i) => {
        if (!onlyKeys(entry, ['decisionEventId', 'decisionId', 'quadrant'])) errors.push(`decisionSummary[${i}]: must contain ONLY {decisionEventId, decisionId, quadrant}`);
        else {
          if (typeof entry.decisionEventId !== 'string') errors.push(`decisionSummary[${i}].decisionEventId: must be a string`);
          if (typeof entry.decisionId !== 'string') errors.push(`decisionSummary[${i}].decisionId: must be a string`);
          if (!QUADRANTS.includes(entry.quadrant)) errors.push(`decisionSummary[${i}].quadrant: not a recognized quadrant ("${entry.quadrant}")`);
        }
      });
    }
  }

  if ('confidenceSummary' in record) {
    if (!Array.isArray(record.confidenceSummary)) errors.push('confidenceSummary must be an array');
    else {
      record.confidenceSummary.forEach((entry, i) => {
        if (!onlyKeys(entry, ['decisionEventId', 'confidence', 'category'])) errors.push(`confidenceSummary[${i}]: must contain ONLY {decisionEventId, confidence, category}`);
        else {
          if (typeof entry.decisionEventId !== 'string') errors.push(`confidenceSummary[${i}].decisionEventId: must be a string`);
          if (!CONFIDENCE_LEVELS.includes(entry.confidence)) errors.push(`confidenceSummary[${i}].confidence: not a recognized confidence level ("${entry.confidence}")`);
          if (!CALIBRATION_CATEGORIES.includes(entry.category)) errors.push(`confidenceSummary[${i}].category: not a recognized calibration category ("${entry.category}")`);
        }
      });
    }
  }

  if ('evidenceSummary' in record) {
    if (!onlyKeys(record.evidenceSummary, ['highValueObtainedCount', 'lowValueObtainedCount', 'efficiencyRatio'])) {
      errors.push('evidenceSummary: must contain ONLY {highValueObtainedCount, lowValueObtainedCount, efficiencyRatio}');
    } else {
      const es = record.evidenceSummary;
      if ('highValueObtainedCount' in es && !isNonNegativeInt(es.highValueObtainedCount)) errors.push('evidenceSummary.highValueObtainedCount must be a non-negative integer');
      if ('lowValueObtainedCount' in es && !isNonNegativeInt(es.lowValueObtainedCount)) errors.push('evidenceSummary.lowValueObtainedCount must be a non-negative integer');
      if ('efficiencyRatio' in es && !(isFiniteNumber(es.efficiencyRatio) && es.efficiencyRatio >= 0 && es.efficiencyRatio <= 1)) errors.push('evidenceSummary.efficiencyRatio must be a finite number in [0,1]');
      // Section 7 (FINAL ACCEPTANCE closure): if both raw counts and the
      // derived efficiencyRatio are present, verify they are mutually
      // consistent (using the same 3-decimal rounding tolerance
      // buildAttemptRecord() itself uses) — never accept a fabricated or
      // stale ratio alongside genuine counts. Skipped when the
      // denominator is zero, since the ratio is then legitimately absent.
      if ('highValueObtainedCount' in es && 'lowValueObtainedCount' in es && 'efficiencyRatio' in es
          && isNonNegativeInt(es.highValueObtainedCount) && isNonNegativeInt(es.lowValueObtainedCount)) {
        const total = es.highValueObtainedCount + es.lowValueObtainedCount;
        if (total > 0) {
          const expected = Math.round((es.highValueObtainedCount / total) * 1000) / 1000;
          if (Math.abs(expected - es.efficiencyRatio) > 0.0005) {
            errors.push(`evidenceSummary.efficiencyRatio (${es.efficiencyRatio}) is inconsistent with highValueObtainedCount/lowValueObtainedCount (expected ${expected})`);
          }
        }
      }
    }
  }

  if ('panelSummary' in record) {
    if (!onlyKeys(record.panelSummary, ['inspectedCount', 'relevantInspectedCount', 'irrelevantInspectedCount', 'selectivityRatio'])) {
      errors.push('panelSummary: must contain ONLY {inspectedCount, relevantInspectedCount, irrelevantInspectedCount, selectivityRatio}');
    } else {
      const ps = record.panelSummary;
      if ('inspectedCount' in ps && !isNonNegativeInt(ps.inspectedCount)) errors.push('panelSummary.inspectedCount must be a non-negative integer');
      if ('relevantInspectedCount' in ps && !isNonNegativeInt(ps.relevantInspectedCount)) errors.push('panelSummary.relevantInspectedCount must be a non-negative integer');
      if ('irrelevantInspectedCount' in ps && !isNonNegativeInt(ps.irrelevantInspectedCount)) errors.push('panelSummary.irrelevantInspectedCount must be a non-negative integer');
      if ('selectivityRatio' in ps && !(isFiniteNumber(ps.selectivityRatio) && ps.selectivityRatio >= 0 && ps.selectivityRatio <= 1)) errors.push('panelSummary.selectivityRatio must be a finite number in [0,1]');
    }
  }

  if ('verificationSummary' in record) {
    if (!onlyKeys(record.verificationSummary, ['attempted', 'attemptCount', 'failedAttemptCount', 'adequate', 'hadPrematureOrFailedAttemptBeforeSuccess'])) {
      errors.push('verificationSummary: must contain ONLY {attempted, attemptCount, failedAttemptCount, adequate, hadPrematureOrFailedAttemptBeforeSuccess}');
    } else {
      const vs = record.verificationSummary;
      if ('attempted' in vs && typeof vs.attempted !== 'boolean') errors.push('verificationSummary.attempted must be a boolean');
      if ('adequate' in vs && typeof vs.adequate !== 'boolean') errors.push('verificationSummary.adequate must be a boolean');
      if ('attemptCount' in vs && !isNonNegativeInt(vs.attemptCount)) errors.push('verificationSummary.attemptCount must be a non-negative integer');
      if ('failedAttemptCount' in vs && !isNonNegativeInt(vs.failedAttemptCount)) errors.push('verificationSummary.failedAttemptCount must be a non-negative integer');
      if ('hadPrematureOrFailedAttemptBeforeSuccess' in vs && typeof vs.hadPrematureOrFailedAttemptBeforeSuccess !== 'boolean') errors.push('verificationSummary.hadPrematureOrFailedAttemptBeforeSuccess must be a boolean');

      // Section 4 (FINAL ACCEPTANCE closure): reject internally
      // impossible cross-field combinations rather than accepting a
      // contradictory summary at face value. Types were already
      // checked above, so these compare genuine values.
      if (vs.attempted === false && 'attemptCount' in vs && vs.attemptCount !== 0) {
        errors.push('verificationSummary: attempted===false requires attemptCount===0');
      }
      if ('failedAttemptCount' in vs && 'attemptCount' in vs && vs.failedAttemptCount > vs.attemptCount) {
        errors.push('verificationSummary: failedAttemptCount cannot exceed attemptCount');
      }
      if (vs.adequate === true && vs.attempted !== true) {
        errors.push('verificationSummary: adequate===true requires attempted===true');
      }
      if (vs.hadPrematureOrFailedAttemptBeforeSuccess === true) {
        if (vs.attempted !== true) errors.push('verificationSummary: hadPrematureOrFailedAttemptBeforeSuccess===true requires attempted===true');
        if (!(vs.failedAttemptCount > 0)) errors.push('verificationSummary: hadPrematureOrFailedAttemptBeforeSuccess===true requires failedAttemptCount>0');
        if (vs.adequate !== true) errors.push('verificationSummary: hadPrematureOrFailedAttemptBeforeSuccess===true requires adequate===true');
      }
    }
  }

  if ('executedFinalDisposition' in record && record.executedFinalDisposition !== null) {
    if (!onlyKeys(record.executedFinalDisposition, ['actionType', 'decisionId', 'optionId', 'decisionEventId', 'outcomeAppropriate', 'reasoningSupported'])) {
      errors.push('executedFinalDisposition: must contain ONLY {actionType, decisionId, optionId, decisionEventId, outcomeAppropriate, reasoningSupported}');
    } else {
      const efd = record.executedFinalDisposition;
      if ('actionType' in efd && efd.actionType !== null && !ACTION_TYPES_SAFE.includes(efd.actionType)) errors.push(`executedFinalDisposition.actionType: not a recognized action type ("${efd.actionType}")`);
      if ('decisionId' in efd && efd.decisionId !== null && typeof efd.decisionId !== 'string') errors.push('executedFinalDisposition.decisionId must be a string or null');
      if ('optionId' in efd && efd.optionId !== null && typeof efd.optionId !== 'string') errors.push('executedFinalDisposition.optionId must be a string or null');
      if ('decisionEventId' in efd && efd.decisionEventId !== null && typeof efd.decisionEventId !== 'string') errors.push('executedFinalDisposition.decisionEventId must be a string or null');
      if ('outcomeAppropriate' in efd && efd.outcomeAppropriate !== null && typeof efd.outcomeAppropriate !== 'boolean') errors.push('executedFinalDisposition.outcomeAppropriate must be a boolean or null');
      if ('reasoningSupported' in efd && efd.reasoningSupported !== null && typeof efd.reasoningSupported !== 'boolean') errors.push('executedFinalDisposition.reasoningSupported must be a boolean or null');
    }
  }

  if ('finalServiceState' in record && !SERVICE_STATES.includes(record.finalServiceState)) errors.push(`finalServiceState: not a recognized service state ("${record.finalServiceState}")`);

  if ('recommendedLearningPriorities' in record) {
    if (!Array.isArray(record.recommendedLearningPriorities)) errors.push('recommendedLearningPriorities must be an array');
    else record.recommendedLearningPriorities.forEach((dim, i) => {
      if (!SCORING_DIMENSIONS.includes(dim)) errors.push(`recommendedLearningPriorities[${i}]: not a recognized SCORING_DIMENSIONS entry ("${dim}")`);
    });
  }

  return { valid: errors.length === 0, errors };
}

function getBackend(injectedStorage) {
  if (injectedStorage) return injectedStorage;
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  } catch {
    // localStorage can throw (opaque origins, disabled storage, some
    // sandboxed/test environments) — fall through to the memory shim
    // rather than crashing the whole learner experience over this.
  }
  if (!getBackend._memoryShim) {
    const map = new Map();
    getBackend._memoryShim = {
      getItem: k => (map.has(k) ? map.get(k) : null),
      setItem: (k, v) => map.set(k, v),
      removeItem: k => map.delete(k),
    };
  }
  return getBackend._memoryShim;
}

function readAll(storage) {
  const backend = getBackend(storage);
  try {
    const raw = backend.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Item 5: validate on read — never return a record (legacy or
    // otherwise) that fails deep validation to the recommender or
    // instructor analytics.
    return parsed.filter(r => validateAttemptRecord(r).valid);
  } catch {
    return [];
  }
}

function writeAll(records, storage) {
  const backend = getBackend(storage);
  backend.setItem(STORAGE_KEY, JSON.stringify(records));
}

/**
 * Records a single attempt — but ONLY if it passes deep, structural
 * validation. Throws (never silently strips/coerces) if the record
 * fails validation for any reason, including an unsafe field, wrong
 * type, unknown nested key, or missing required field.
 */
export function recordAttempt(record, storage) {
  const { valid, errors } = validateAttemptRecord(record);
  if (!valid) {
    throw new Error(`recordAttempt() refused an invalid/unsafe attempt record: ${errors.join('; ')}`);
  }
  const all = readAll(storage);
  all.push(record);
  writeAll(all, storage);
  return record;
}

export function listAttempts(storage) {
  return readAll(storage);
}

export function listAttemptsForCase(caseId, storage) {
  return readAll(storage).filter(a => a.caseId === caseId);
}

/** Section 21: "Reset learning history" — always explicit, never silent. */
export function resetHistory(storage) {
  writeAll([], storage);
}
