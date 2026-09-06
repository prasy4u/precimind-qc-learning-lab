/* =========================================================================
   RECOVERY PROVENANCE NOTE (added during Stage 6A recovery):
   Artifact Class A — directly recovered from recovery/original-v0.8.html
   (SHA-256: e5317bf135f350b258428b985c1034a081e244a295f2e580c93cb6a6a091c8e4)
   Source lines: 8368-8670 (External Assurance Lab calc section)
   Historical reported v0.8 commit: 3cc62b1 (not independently verified)
   Recovery date: 2026-09-01
   The block below is the unmodified source text from the HTML artifact.
   ========================================================================= */

/* =========================================================================
   External Assurance Lab (QC-10) — v0.6 pure calculation and status-model
   helpers. No React, no scenario content — those live in 24-eqa-data.js
   and 26-eqa-screens.jsx. Every function here is pure and independently
   unit-tested (test-eqa.js). Mirrors the architecture of
   19-investigation-calc.js.

   Per the v0.6 spec, this module deliberately does NOT implement:
     - a universal z-score pass/fail rule (section 21 — any illustrative
       band shown in the data/screen layer is labelled as illustrative,
       never as a universal laboratory rule, and provider-specific
       criteria always take precedence in a scenario),
     - an automated Miller et al. Category 1-6 classifier (section 15 —
       describeSchemeCapability() below returns qualitative, composable
       statements from the scheme's own stated properties, never a single
       category number),
     - full method-comparison statistics: no Passing-Bablok, no Deming
       regression, no Bland-Altman limits of agreement, no regression
       confidence intervals, no medical-decision-point bias estimation
       (section 42 — calculatePairedDifference()/calculatePairedRelativeDifference()
       below are a simplified paired-difference display only),
     - any automatic patient-result impact from an EQA event (section 75 —
       no function here sets a held/invalid/amend/reissue disposition;
       that reasoning is left to the existing, unmodified Investigation
       Lab engine in 19-investigation-calc.js / 20-investigation-data.js).
   ========================================================================= */

/* -------------------------------------------------------------------------
   Target value types (spec section 7). Deliberately NOT all called "the
   true value" — each is a distinct kind of comparator answering a
   different question (spec sections 8-9).
   ------------------------------------------------------------------------- */
const TARGET_VALUE_TYPES = [
  "reference-measurement-procedure",
  "certified-reference-material",
  "method-specific-peer-group-mean",
  "manufacturer-instrument-peer-group-mean",
  "all-participant-consensus",
  "expert-organiser-assigned",
  "target-insufficiently-described"
];
const TARGET_VALUE_TYPE_LABELS = {
  "reference-measurement-procedure": "Reference measurement procedure assigned value",
  "certified-reference-material": "Certified/reference-material-based assigned value",
  "method-specific-peer-group-mean": "Method-specific peer-group mean",
  "manufacturer-instrument-peer-group-mean": "Manufacturer/instrument peer-group mean",
  "all-participant-consensus": "All-participant consensus value",
  "expert-organiser-assigned": "Expert/organiser-assigned target",
  "target-insufficiently-described": "Target insufficiently described"
};

/* -------------------------------------------------------------------------
   Commutability status (spec sections 10-12). "commutability-not-established"
   (unknown) is deliberately never treated as equivalent to "noncommutable"
   (known to fail) anywhere in this codebase — unknown != failed.
   ------------------------------------------------------------------------- */
const COMMUTABILITY_STATUSES = [
  "verified-commutable",
  "noncommutable",
  "commutability-not-established",
  "not-applicable-or-insufficient-information"
];

/* -------------------------------------------------------------------------
   This round's own result-vs-criterion status (spec section 54:
   currentEqaStatus). Deliberately separate from longitudinalEqaPattern —
   one round's status must never silently overwrite the longitudinal state.
   ------------------------------------------------------------------------- */
const CURRENT_EQA_STATUSES = ["meets-criterion", "does-not-meet-criterion", "criterion-not-stated", "indeterminate"];

/* -------------------------------------------------------------------------
   Longitudinal EQA pattern classifications (spec sections 30, 54). These
   are scenario descriptions authored against a multi-round history, not
   universal statistical diagnoses computed from a formula (spec section 30).
   ------------------------------------------------------------------------- */
const LONGITUDINAL_EQA_STATUSES = [
  "stable-no-persistent-deviation-apparent",
  "isolated-eqa-excursion",
  "persistent-positive-deviation",
  "persistent-negative-deviation",
  "step-change",
  "performance-improving",
  "method-group-pattern",
  "indeterminate"
];

/* -------------------------------------------------------------------------
   Comparability status (spec sections 38, 45, 54) — for the Comparability
   Lab's longitudinal Analyzer-A-vs-Analyzer-B summaries.
   ------------------------------------------------------------------------- */
const COMPARABILITY_STATUSES = [
  "stable-agreement",
  "step-change",
  "gradual-divergence",
  "temporary-excursion",
  "recovery-after-intervention",
  "indeterminate"
];

/* -------------------------------------------------------------------------
   EQA investigation status (spec sections 54-55, 75-76) — deliberately a
   small, EQA-scoped vocabulary. This is NOT the Investigation Lab's
   ProcessStatus/CauseStatus engine reimplemented; where a scenario
   warrants deeper investigation, the UI links to the existing,
   unmodified Investigation Lab rather than duplicating its reasoning.
   ------------------------------------------------------------------------- */
const EQA_INVESTIGATION_STATUSES = [
  "not-yet-reviewed",
  "under-review",
  "referred-to-investigation-lab",
  "resolved-participant-specific",
  "resolved-method-group",
  "resolved-reporting-error",
  "unresolved"
];

/* -------------------------------------------------------------------------
   Performance-criterion types (spec section 22) — reconnects with the
   existing, unmodified APS Explorer (10-aps-data.js: MILAN_MODELS,
   OTHER_SPEC_SOURCES) rather than assuming every EQA scheme uses TEa.
   ------------------------------------------------------------------------- */
const PERFORMANCE_CRITERION_TYPES = [
  "relative-allowable-deviation",
  "absolute-allowable-deviation",
  "z-score-sdpa",
  "biological-variation-derived",
  "regulatory-criterion",
  "state-of-the-art-criterion",
  "other-scheme-specific",
  "not-stated"
];
const PERFORMANCE_CRITERION_TYPE_LABELS = {
  "relative-allowable-deviation": "Relative allowable deviation",
  "absolute-allowable-deviation": "Absolute allowable deviation",
  "z-score-sdpa": "Z-score / SDPA",
  "biological-variation-derived": "Biological-variation-derived criterion",
  "regulatory-criterion": "Regulatory criterion",
  "state-of-the-art-criterion": "State-of-the-art criterion",
  "other-scheme-specific": "Other scheme-specific criterion",
  "not-stated": "Not stated by the scheme"
};

/* -------------------------------------------------------------------------
   EQA deviation calculations (spec section 19). Pure, never fabricates a
   numeric result, never returns Infinity/NaN.
   ------------------------------------------------------------------------- */
function calculateEqaAbsoluteDeviation(participantResult, assignedValue) {
  if (typeof participantResult !== "number" || typeof assignedValue !== "number" || !isFinite(participantResult) || !isFinite(assignedValue)) {
    return { supported: false, value: null, reason: "Both the participant result and the assigned value must be finite numbers." };
  }
  return { supported: true, value: participantResult - assignedValue, units: "same units as the participant result" };
}

/* Relative deviation (%) = (participant - assigned) / assigned * 100. Sign
   retained. Zero or non-finite assigned values are explicitly rejected —
   never Infinity, never NaN silently rendered (spec section 19). */
function calculateEqaRelativeDeviation(participantResult, assignedValue) {
  const invalidInputs = typeof participantResult !== "number" || typeof assignedValue !== "number" || !isFinite(participantResult) || !isFinite(assignedValue);
  if (invalidInputs) {
    return { supported: false, value: null, reason: "Both the participant result and the assigned value must be finite numbers." };
  }
  if (assignedValue === 0) {
    return { supported: false, value: null, reason: "Relative deviation is not calculated when the assigned value is zero (division by zero). Use the absolute deviation instead." };
  }
  return { supported: true, value: ((participantResult - assignedValue) / assignedValue) * 100, units: "%" };
}

/* -------------------------------------------------------------------------
   Z-score (spec section 20). Implemented as calculateEqaZScore() —
   deliberately NOT a generic process z-score — and requires SDPA > 0.
   Invalid inputs (missing target, zero/negative SDPA, NaN, Infinity)
   return a structured unsupported state rather than propagating
   Infinity/NaN (spec sections 20, 67).
   ------------------------------------------------------------------------- */
function calculateEqaZScore(participantResult, assignedValue, sdpa) {
  const numeric = typeof participantResult === "number" && typeof assignedValue === "number" && typeof sdpa === "number";
  if (!numeric || !isFinite(participantResult) || !isFinite(assignedValue) || !isFinite(sdpa)) {
    return { supported: false, value: null, reason: "The participant result, assigned value and SDPA must all be finite numbers." };
  }
  if (sdpa <= 0) {
    return { supported: false, value: null, reason: "SDPA must be greater than zero. A zero or negative SDPA cannot be used to calculate a z-score." };
  }
  return { supported: true, value: (participantResult - assignedValue) / sdpa, units: "SD units (SDPA)" };
}

/* -------------------------------------------------------------------------
   No universal z-score pass/fail (spec section 21). This constant exists
   only to be displayed as an explicitly-labelled illustrative convention —
   never applied automatically to decide a scenario's outcome, and always
   subordinate to a scenario's own provider-specific performanceCriterion.
   ------------------------------------------------------------------------- */
const ILLUSTRATIVE_ZSCORE_BANDS = [
  { id: "satisfactory", label: "Illustrative: |z| ≤ 2", range: "|z| ≤ 2" },
  { id: "questionable", label: "Illustrative: 2 < |z| ≤ 3", range: "2 < |z| ≤ 3" },
  { id: "unsatisfactory", label: "Illustrative: |z| > 3", range: "|z| > 3" }
];
const ILLUSTRATIVE_ZSCORE_BANDS_CAUTION = "Illustrative proficiency-scoring convention (loosely following common ISO 13528-style educational bands) — not a universal laboratory pass/fail rule, and not a reproduction of any protected standard's text. Where a scenario states the actual EQA provider's own performance criterion, that provider-specific criterion always takes precedence over this illustrative convention.";

/* -------------------------------------------------------------------------
   Comparability Lab paired-difference calculations (spec sections 38-42).
   A simplified, transparent display only — deliberately not a
   Passing-Bablok/Deming/Bland-Altman implementation (spec section 42).
   B is "Analyzer B", A is the "designated comparator for this teaching
   exercise" — never labelled "reference method" (spec section 39).
   ------------------------------------------------------------------------- */
function calculatePairedDifference(resultA, resultB) {
  if (typeof resultA !== "number" || typeof resultB !== "number" || !isFinite(resultA) || !isFinite(resultB)) {
    return { supported: false, value: null, reason: "Both paired results must be finite numbers." };
  }
  return { supported: true, value: resultB - resultA, units: "same units as the paired results" };
}

function calculatePairedRelativeDifference(resultA, resultB) {
  const invalidInputs = typeof resultA !== "number" || typeof resultB !== "number" || !isFinite(resultA) || !isFinite(resultB);
  if (invalidInputs) {
    return { supported: false, value: null, reason: "Both paired results must be finite numbers." };
  }
  if (resultA === 0) {
    return { supported: false, value: null, reason: "Relative difference is not calculated when the comparator (A) result is zero (division by zero). Use the absolute difference instead." };
  }
  return { supported: true, value: ((resultB - resultA) / resultA) * 100, units: "%" };
}

/* -------------------------------------------------------------------------
   Scheme Capability Profile (spec sections 14-18). An ORIGINAL capability
   interface — deliberately not a reproduction of the Miller et al. 2011
   category table, and deliberately not an automated Category 1-6
   classifier (spec section 15: "capability-based reasoning is preferred").
   Returns qualitative statements composed from the scheme's own stated
   properties; any property left null/undefined is treated as "not stated"
   rather than guessed.
   ------------------------------------------------------------------------- */
function describeSchemeCapability(profile) {
  const p = profile || {};
  const statements = [];
  const limitations = [];

  if (p.methodGroupsDefined === true) {
    statements.push("This scheme defines method/instrument groups, so it may help distinguish a participant-specific pattern from a pattern shared by the participant's method group.");
  } else if (p.methodGroupsDefined === false) {
    limitations.push("No method/instrument groups are defined, so this scheme cannot distinguish a participant-specific effect from a method-group effect.");
  } else {
    limitations.push("Whether method/instrument groups are defined is not stated, so participant-versus-method-group interpretation is limited.");
  }

  if (p.higherOrderTargetAvailable === true) {
    statements.push("A higher-order/reference target is available, so this scheme may support evaluation against a metrologically higher-order value, not only peer consensus.");
  } else if (p.higherOrderTargetAvailable === false) {
    limitations.push("No higher-order/reference target is available for this measurand in this round; any conclusion is limited to peer/consensus comparison, which answers a different question than agreement with a higher-order reference.");
  } else {
    limitations.push("Whether a higher-order/reference target is available is not stated.");
  }

  if (p.commutabilityVerified === true) {
    statements.push("The material's commutability has been verified, which supports using between-method or between-participant differences as evidence about relationships that would apply to relevant clinical samples.");
  } else if (p.commutabilityVerified === false) {
    limitations.push("The material is known to be noncommutable, so between-method differences observed with it may partly reflect material-specific matrix effects rather than patient-sample relationships.");
  } else {
    limitations.push("Commutability has not been established for this material, so its ability to support between-method or patient-sample conclusions is limited and unknown — not confirmed to have failed.");
  }

  if (p.replicateSpecimensIncluded === true) {
    statements.push("Replicate specimens are included, which may help separate within-run imprecision from a systematic displacement.");
  } else if (p.replicateSpecimensIncluded === false) {
    limitations.push("No replicate specimens are included in this round, limiting the ability to separate imprecision from displacement from a single result.");
  }

  if (p.performanceSpecificationStated === true) {
    statements.push("A performance specification is stated for this round, so a result can be evaluated against an explicit, scheme-defined criterion rather than an assumed one.");
  } else if (p.performanceSpecificationStated === false) {
    limitations.push("No performance specification is stated for this round; any illustrative band shown is not the scheme's own criterion.");
  }

  const canAssessHarmonisation = p.commutabilityVerified === true && p.higherOrderTargetAvailable === true && p.methodGroupsDefined === true;
  const canAssessMethodPerformance = p.methodGroupsDefined === true && (p.higherOrderTargetAvailable === true || p.performanceSpecificationStated === true);
  const canAssessParticipantPerformance = p.methodGroupsDefined === true || p.performanceSpecificationStated === true || p.higherOrderTargetAvailable === true;

  return {
    statements,
    limitations,
    canAssessParticipantPerformance,
    canAssessMethodPerformance,
    canAssessHarmonisation
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    TARGET_VALUE_TYPES, TARGET_VALUE_TYPE_LABELS,
    COMMUTABILITY_STATUSES,
    CURRENT_EQA_STATUSES,
    LONGITUDINAL_EQA_STATUSES,
    COMPARABILITY_STATUSES,
    EQA_INVESTIGATION_STATUSES,
    PERFORMANCE_CRITERION_TYPES, PERFORMANCE_CRITERION_TYPE_LABELS,
    calculateEqaAbsoluteDeviation, calculateEqaRelativeDeviation, calculateEqaZScore,
    ILLUSTRATIVE_ZSCORE_BANDS, ILLUSTRATIVE_ZSCORE_BANDS_CAUTION,
    calculatePairedDifference, calculatePairedRelativeDifference,
    describeSchemeCapability
  };
}


