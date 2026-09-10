/* =========================================================================
   v09/app/morning-qc/adaptive/attempt-store.js

   Morning QC Room — Stage 12D Local Learner Attempt Store
   PROVENANCE: V09_NEW

   Section 20-22: a deterministic, local-only persistence layer for
   learner attempt records. Uses window.localStorage when available
   (browser/production), falling back to an injectable in-memory Map
   (Node/tests) — no new dependency, no external network call, ever.

   PRIVACY (Section 22): an attempt record contains ONLY simulation-
   learning data — no name, email, staff identifier, institution, real
   patient data, IP address, or device fingerprint. Never stores raw
   hidden ground truth (Section 20) — only the SAME safe, post-gate
   debrief projection fields already exposed to the learner.
   ========================================================================= */

const STORAGE_KEY = 'precimind-morningqc-attempts-v1';

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
 * Records a single, safe attempt. `record` must already be the reduced,
 * safe shape (Section 20) — this function does not itself reach into
 * raw case/groundTruth data.
 */
export function recordAttempt(record, storage) {
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
