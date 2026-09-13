/* =========================================================================
   v09/app/morning-qc/adaptive/attempt-store.js

   Morning QC Room — Stage 12D Local Learner Attempt Store
   PROVENANCE: V09_MODIFIED (Stage 12D corrective closure)

   Section 20-22: a deterministic, local-only persistence layer for
   learner attempt records. Uses window.localStorage when available
   (browser/production), falling back to an injectable in-memory Map
   (Node/tests) — no new dependency, no external network call, ever.

   PRIVACY HARDENING (Section 11 corrective closure): independent audit
   proved that a raw recordAttempt() call could persist arbitrary fields
   — including groundTruth and email — completely unchanged, since the
   prior version trusted its caller entirely. recordAttempt() now
   validates every record against a strict ALLOWLIST
   (ATTEMPT_RECORD_ALLOWED_FIELDS) before ever writing to storage: any
   field outside that allowlist causes the entire record to be
   REJECTED (not silently stripped — a caller passing a disallowed
   field is a bug that should fail loudly, not be quietly "fixed").
   ========================================================================= */

const STORAGE_KEY = 'precimind-morningqc-attempts-v1';

// Stage 12D Section 11/13: the complete, strict allowlist of fields a
// safe attempt record may contain. Includes the research-readiness
// fields from Section 13 (caseFamily, difficulty, caseSchemaVersion,
// decisionEventId/quadrant inside decisionSummary, decisionEventId/
// category inside confidenceSummary, evidence/verification summaries,
// executedFinalDisposition) — but NEVER groundTruth, and NEVER any
// personal identifier (name, email, staff/patient ID, institution, IP,
// device fingerprint).
export const ATTEMPT_RECORD_ALLOWED_FIELDS = [
  'attemptId', 'caseId', 'caseFamily', 'difficulty', 'caseSchemaVersion',
  'startedAt', 'completedAt',
  'competencyProfile', 'decisionSummary', 'confidenceSummary',
  'evidenceSummary', 'verificationSummary',
  'finalServiceState', 'executedFinalDisposition', 'recommendedLearningPriorities',
];

/**
 * Validates a candidate record against the strict allowlist. Returns
 * {valid, errors} — never silently strips fields; an out-of-schema
 * field is a hard validation failure.
 */
export function validateAttemptRecord(record) {
  const errors = [];
  if (record == null || typeof record !== 'object') {
    return { valid: false, errors: ['attempt record must be a non-null object'] };
  }
  for (const key of Object.keys(record)) {
    if (!ATTEMPT_RECORD_ALLOWED_FIELDS.includes(key)) {
      errors.push(`attempt record contains a field outside the strict allowlist: "${key}"`);
    }
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
  // Node/test fallback — a simple Map-backed shim with the same get/setItem contract.
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
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(records, storage) {
  const backend = getBackend(storage);
  backend.setItem(STORAGE_KEY, JSON.stringify(records));
}

/**
 * Records a single attempt — but ONLY if it validates against the
 * strict allowlist (Section 11). Throws if the record contains any
 * disallowed field (including groundTruth or any personal identifier),
 * rather than silently sanitizing and persisting a partial record.
 */
export function recordAttempt(record, storage) {
  const { valid, errors } = validateAttemptRecord(record);
  if (!valid) {
    throw new Error(`recordAttempt() refused an unsafe attempt record: ${errors.join('; ')}`);
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
