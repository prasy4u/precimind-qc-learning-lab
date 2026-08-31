/* =========================================================================
   core/detection-delay — v0.4 restricted, independently validated
   detection-delay calculations (QC-events-to-detection and patient-sample
   exposure under a simplified persistent-shift teaching model).

   Per the v0.4 spec, this module implements ONLY:
     - a simplified geometric "expected QC events to detection" model for a
       fixed, persistent systematic error and a constant per-QC-event
       detection probability p, and
     - two educational patient-sample exposure calculations built on top of
       that same geometric model (immediate post-QC onset, and uniformly
       distributed onset within the interval).

   These are explicitly NOT Parvin's MaxE(Nuf) model (see 16-risk-data.js
   for the conceptual, non-numerical introduction to MaxE(Nuf)) and are
   never applied to a multirule procedure: numerical detection-delay
   modelling in this build is restricted to the exact single-rule case
   ["13s"], for which Ped is already independently validated in
   11-opchar.js (operatingCharacteristic13s). Every function here is pure,
   assumption-aware, and returns the structured
   {modelId, modelName, assumptions, supported, value, units, provenance,
   limitations} shape required by spec v0.4 section 40, so the UI can
   always answer "why did the application calculate this number?".

   PROVENANCE: Class A — directly recovered from recovery/original-v0.8.html
   (SHA-256: e5317bf135f350b258428b985c1034a081e244a295f2e580c93cb6a6a091c8e4)
   Source lines: ~5340-5495 (core/detection-delay section)
   Historical reported v0.8 commit: 3cc62b1 (not independently verified)
   Recovery date: 2026-08-31
   ========================================================================= */

const UNSUPPORTED_DETECTION_DELAY_NOTE = "Numerical detection-delay modelling is not implemented for this multirule procedure in the current version.";

/* Restricted to the exact single-rule case ["13s"] — the same restriction
   boundary validated for Ped/Pfr in 11-opchar.js (spec v0.3.1 section 7). */
function isDetectionDelaySupportedRuleSet(ruleIds) {
  return Array.isArray(ruleIds) && ruleIds.length === 1 && ruleIds[0] === "13s";
}
function detectionDelaySupportForRuleIds(ruleIds) {
  if (isDetectionDelaySupportedRuleSet(ruleIds)) return { supported: true };
  return { supported: false, note: UNSUPPORTED_DETECTION_DELAY_NOTE };
}

/* -------------------------------------------------------------------------
   Simplified persistent-shift detection model (geometric).
   E[number of independent Bernoulli(p) trials to the first success] = 1/p
   — a standard result in probability theory. NOT Parvin's MaxE(Nuf).
   ------------------------------------------------------------------------- */
const GEOMETRIC_MODEL_ID = "geometric-persistent-shift-detection-delay";
const GEOMETRIC_MODEL_NAME = "Simplified persistent-shift detection model (geometric)";
const GEOMETRIC_ASSUMPTIONS = [
  "The systematic shift is constant (persistent) once it begins — it does not change in magnitude or resolve on its own before detection.",
  "Every QC event has the same detection probability p, computed from a single independently validated operating characteristic (currently 1₃s only).",
  "QC-event detection outcomes are treated as independent from one QC event to the next, for this simplified model only.",
  "The process remains out of control — and every intervening patient sample is a candidate for exposure — until the QC procedure detects the shift.",
  "This is a teaching model illustrating a general principle, not a full risk-based QC calculator or a substitute for Parvin's MaxE(Nuf)."
];
const GEOMETRIC_PROVENANCE = "Independently derived from the geometric-distribution expectation E[trials to first success] = 1/p, a standard, textbook result in probability theory. Not a reproduction of any specific published QC-risk model, and explicitly NOT Parvin's MaxE(Nuf) model — see the Risk & Frequency Lab's \"From error detection to patient risk\" section for that separate, conceptually-introduced (not numerically implemented) framework.";
const GEOMETRIC_LIMITATIONS = [
  "Does not calculate MaxE(Nuf) or any specific probability of patient harm.",
  "Assumes independence between successive QC-event detection outcomes, which is a simplification.",
  "Only produces a numeric value for the single 1₃s rule applied on its own — see the multirule safety note for every other procedure."
];

/* Expected number of QC events until the first detection, given a constant
   per-QC-event detection probability p (0 < p <= 1). Never calculated at
   p = 0 (no finite expectation — the shift would never be detected). */
function expectedQcEventsToDetectionGeometric(p) {
  const invalid = typeof p !== "number" || !isFinite(p) || p <= 0 || p > 1;
  if (invalid) {
    return {
      modelId: GEOMETRIC_MODEL_ID, modelName: GEOMETRIC_MODEL_NAME,
      supported: false, value: null, units: "QC events",
      assumptions: GEOMETRIC_ASSUMPTIONS, provenance: GEOMETRIC_PROVENANCE, limitations: GEOMETRIC_LIMITATIONS,
      reason: "p must satisfy 0 < p <= 1. p = 0 has no finite expected detection time under this model (the shift would never be detected), p > 1 is not a valid probability, and non-finite/non-numeric input is rejected rather than silently coerced."
    };
  }
  return {
    modelId: GEOMETRIC_MODEL_ID, modelName: GEOMETRIC_MODEL_NAME,
    supported: true, value: 1 / p, units: "QC events",
    assumptions: GEOMETRIC_ASSUMPTIONS, provenance: GEOMETRIC_PROVENANCE, limitations: GEOMETRIC_LIMITATIONS
  };
}

/* -------------------------------------------------------------------------
   Patient-sample exposure under the same geometric model, for two
   deterministic failure-onset teaching assumptions (spec v0.4 section 7).
   Neither is described as the universal Parvin model.
   ------------------------------------------------------------------------- */
const IMMEDIATE_ONSET_MODEL_ID = "geometric-immediate-onset-patient-exposure";
const IMMEDIATE_ONSET_MODEL_NAME = "Simplified persistent-shift detection model — immediate post-QC onset (Mode A)";
const IMMEDIATE_ONSET_ASSUMPTIONS = GEOMETRIC_ASSUMPTIONS.concat([
  "Mode A: failure onset is assumed to occur immediately after a successful QC event — a near-worst-position exposure scenario for the configured interval, not a claim that failures typically begin at this moment, and not the universal Parvin model.",
  "M patient samples are processed between successive QC events, and this count is constant across intervals under this teaching model."
]);
const IMMEDIATE_ONSET_LIMITATIONS = GEOMETRIC_LIMITATIONS.concat([
  "Does not distinguish patient samples merely processed while out of control from patient results that actually exceed the analytical quality requirement — see 'unacceptable final patient results' elsewhere in the Risk & Frequency Lab."
]);

/* Expected patient samples processed before detection, if the failure
   begins immediately after a successful QC event: M / p. */
function expectedPatientExposureImmediateOnset(M, p) {
  const invalidP = typeof p !== "number" || !isFinite(p) || p <= 0 || p > 1;
  const invalidM = typeof M !== "number" || !isFinite(M) || M <= 0;
  if (invalidP || invalidM) {
    return {
      modelId: IMMEDIATE_ONSET_MODEL_ID, modelName: IMMEDIATE_ONSET_MODEL_NAME,
      supported: false, value: null, units: "patient samples",
      assumptions: IMMEDIATE_ONSET_ASSUMPTIONS, provenance: GEOMETRIC_PROVENANCE, limitations: IMMEDIATE_ONSET_LIMITATIONS,
      reason: (invalidM ? "M must be a finite number > 0 (received " + JSON.stringify(M) + "). " : "") + (invalidP ? "p must satisfy 0 < p <= 1 (received " + JSON.stringify(p) + ")." : "")
    };
  }
  return {
    modelId: IMMEDIATE_ONSET_MODEL_ID, modelName: IMMEDIATE_ONSET_MODEL_NAME,
    supported: true, value: M / p, units: "patient samples",
    assumptions: IMMEDIATE_ONSET_ASSUMPTIONS, provenance: GEOMETRIC_PROVENANCE, limitations: IMMEDIATE_ONSET_LIMITATIONS
  };
}

const UNIFORM_ONSET_MODEL_ID = "geometric-uniform-onset-patient-exposure";
const UNIFORM_ONSET_MODEL_NAME = "Simplified persistent-shift detection model — uniformly distributed onset within interval (Mode B)";
const UNIFORM_ONSET_ASSUMPTIONS = GEOMETRIC_ASSUMPTIONS.concat([
  "Mode B: for educational calculation only, failure onset is assumed to be uniformly distributed within the patient interval between QC events — a simplified teaching assumption, not the universal Parvin model and not a claim about how failures actually occur in practice.",
  "M patient samples are processed between successive QC events, and this count is constant across intervals under this teaching model."
]);
const UNIFORM_ONSET_LIMITATIONS = IMMEDIATE_ONSET_LIMITATIONS;

/* Educational expected patient-sample exposure under uniformly-distributed
   onset within the first QC interval: M/2 + M*(1-p)/p, algebraically
   equivalent to M*(1/p - 1/2). Independently derived and unit-tested
   (spec v0.4 section 11) and explicitly labelled as belonging to this
   simplified geometric teaching model, never as MaxE(Nuf). */
function expectedPatientExposureUniformOnset(M, p) {
  const invalidP = typeof p !== "number" || !isFinite(p) || p <= 0 || p > 1;
  const invalidM = typeof M !== "number" || !isFinite(M) || M <= 0;
  if (invalidP || invalidM) {
    return {
      modelId: UNIFORM_ONSET_MODEL_ID, modelName: UNIFORM_ONSET_MODEL_NAME,
      supported: false, value: null, units: "patient samples",
      assumptions: UNIFORM_ONSET_ASSUMPTIONS, provenance: GEOMETRIC_PROVENANCE, limitations: UNIFORM_ONSET_LIMITATIONS,
      reason: (invalidM ? "M must be a finite number > 0 (received " + JSON.stringify(M) + "). " : "") + (invalidP ? "p must satisfy 0 < p <= 1 (received " + JSON.stringify(p) + ")." : "")
    };
  }
  return {
    modelId: UNIFORM_ONSET_MODEL_ID, modelName: UNIFORM_ONSET_MODEL_NAME,
    supported: true, value: M / 2 + M * (1 - p) / p, units: "patient samples",
    assumptions: UNIFORM_ONSET_ASSUMPTIONS, provenance: GEOMETRIC_PROVENANCE, limitations: UNIFORM_ONSET_LIMITATIONS
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    UNSUPPORTED_DETECTION_DELAY_NOTE,
    isDetectionDelaySupportedRuleSet, detectionDelaySupportForRuleIds,
    GEOMETRIC_MODEL_ID, GEOMETRIC_MODEL_NAME, GEOMETRIC_ASSUMPTIONS, GEOMETRIC_PROVENANCE, GEOMETRIC_LIMITATIONS,
    expectedQcEventsToDetectionGeometric,
    IMMEDIATE_ONSET_MODEL_ID, IMMEDIATE_ONSET_MODEL_NAME,
    expectedPatientExposureImmediateOnset,
    UNIFORM_ONSET_MODEL_ID, UNIFORM_ONSET_MODEL_NAME,
    expectedPatientExposureUniformOnset
  };
}
