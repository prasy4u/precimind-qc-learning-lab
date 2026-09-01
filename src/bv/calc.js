/* =========================================================================
   RECOVERY PROVENANCE NOTE (added during Stage 7A recovery):
   Artifact Class A — directly recovered from recovery/original-v0.8.html
   (SHA-256: e5317bf135f350b258428b985c1034a081e244a295f2e580c93cb6a6a091c8e4)
   Source lines: 10405-10731 (BV & RCV Lab calc section)
   Historical reported v0.8 commit: 3cc62b1 (not independently verified)
   Recovery date: 2026-09-01
   The block below is the unmodified source text from the HTML artifact.
   ========================================================================= */

/* =========================================================================
   BV & RCV Lab (QC-07) — v0.7 pure calculation and enum layer. No React, no
   scenario content — those live in 28-bv-data.js and 30-bv-screens.jsx.
   Every function here is pure and independently unit-tested (test-bv.js).
   Mirrors the architecture of 19-investigation-calc.js / 23-eqa-calc.js.

   Symbol discipline (spec section 3): this engine uses ONLY
     CVA = analytical coefficient of variation
     CVI = within-subject biological coefficient of variation
     CVG = between-subject biological coefficient of variation
   never the alternates CVw/CVi/CVp or CVb/CVg. All inputs are taken and
   returned as PERCENTAGE numbers (e.g. 6 means 6%) — a value of 0.06 is
   never silently reinterpreted as 6% anywhere in this file (spec section 93).

   Architectural note (spec section 111): calculateClassicalRcv() and
   calculateLognormalRcv() deliberately do NOT accept a CVG parameter at
   all. This is a structural choice, not merely "ignore CVG if passed" —
   CVG cannot affect either RCV formula because the functions have no
   argument slot for it. calculateIndexOfIndividuality() and
   calculateBvAps() are the only functions in this file that take CVG.

   Per the v0.7 spec, this module deliberately does NOT implement:
     - raw/ANOVA/CV-ANOVA/Bayesian estimation of CVA/CVI/CVG from data
       (section 129 — every BV estimate is a supplied constant, never
       derived here from a data series),
     - a BIVAC scoring engine (section 129 — BIVAC is taught conceptually
       in 28-bv-data.js only),
     - disease-specific BV prediction or personalised/AI-derived CVI
       (section 129),
     - a universal clinical decision threshold or automated delta-check
       engine (section 129 — evaluateClassicalRcvExceedance() and
       evaluateLognormalRcvExceedance() report exceedance only, and the
       UI layer is required to avoid clinical-significance language),
     - measurement uncertainty or reference-interval generation (out of
       scope for v0.7 — see 05-screens.jsx About text).
   ========================================================================= */

/* -------------------------------------------------------------------------
   z-value conventions (spec sections 33-34, 93). Always an explicit,
   named choice — never inferred from the sign of an observed change, and
   never presented as a bare "95% confidence" without stating whether it
   is bidirectional or unidirectional.
   ------------------------------------------------------------------------- */
const Z_CONVENTIONS = {
  "bidirectional-95": {
    id: "bidirectional-95",
    z: 1.96,
    label: "Bidirectional 95% (z = 1.96)",
    description: "A two-sided 95% convention: allows for the result to have either increased or decreased. Suitable when there is no prior reason to expect the direction of change."
  },
  "unidirectional-95": {
    id: "unidirectional-95",
    z: 1.645,
    label: "Unidirectional 95% (z = 1.645)",
    description: "A one-sided 95% convention: used only when there is a specific, pre-stated reason to test change in one particular direction. Choosing this convention is a modelling decision made in advance — it is never inferred from which way a particular result happened to move."
  }
};
const Z_CONVENTION_IDS = Object.keys(Z_CONVENTIONS);

function isFiniteNonNegativeNumber(x) {
  return typeof x === "number" && isFinite(x) && x >= 0;
}

/* -------------------------------------------------------------------------
   Index of Individuality (spec sections 17-24). II = CVI / CVG exactly —
   one convention only, never mixed with an alternate formula. Requires
   CVI >= 0 and CVG > 0; CVG = 0 is treated as unsupported (never Infinity).
   The tri-band heuristic is explicitly labelled a conventional
   interpretive heuristic, not a biological law, with exact boundary
   semantics: II < 0.6 -> marked; 0.6 <= II <= 1.4 -> intermediate;
   II > 1.4 -> low.
   ------------------------------------------------------------------------- */
function calculateIndexOfIndividuality(cvi, cvg) {
  if (typeof cvi !== "number" || !isFinite(cvi) || cvi < 0) {
    return { supported: false, value: null, reason: "CVI must be a finite number greater than or equal to zero." };
  }
  if (typeof cvg !== "number" || !isFinite(cvg) || cvg <= 0) {
    return {
      supported: false,
      value: null,
      reason: "The index of individuality requires a between-subject biological CV (CVG) greater than zero. When CVG is not available, the index of individuality is not computable — it is never reported as infinite."
    };
  }
  const value = cvi / cvg;
  let band;
  if (value < 0.6) band = "marked-individuality";
  else if (value <= 1.4) band = "intermediate-individuality";
  else band = "low-individuality";
  const bandLabels = {
    "marked-individuality": "Marked individuality (II < 0.6)",
    "intermediate-individuality": "Intermediate individuality (0.6 ≤ II ≤ 1.4)",
    "low-individuality": "Low individuality (II > 1.4)"
  };
  return {
    supported: true,
    modelId: "index-of-individuality",
    value,
    units: "ratio (dimensionless)",
    formula: "II = CVI / CVG",
    inputs: { cvi, cvg },
    band,
    bandLabel: bandLabels[band],
    heuristicCaveat: "Conventional interpretive heuristic for how informative a population reference interval is for this analyte — not a biological law and not a universal clinical cutoff.",
    assumptions: ["CVI and CVG are taken as supplied, at face value, for the same measurand/population/matrix context."],
    limitations: ["A low index of individuality means a population reference interval is a poor tool for this analyte, not that serial monitoring itself is invalid."]
  };
}

/* -------------------------------------------------------------------------
   BV-derived Analytical Performance Specifications (spec sections 25-32,
   Milan Model 2). Three levels only: Optimum / Desirable / Minimum.
   Imprecision APS depends on CVI alone and is therefore computable even
   when CVG is missing. Bias APS (magnitude only) depends on both CVI and
   CVG and is NOT computable when CVG is missing. An optional combined TEa
   is provided only as metadata for an expandable disclosure — callers
   must not treat it as the primary output.
   ------------------------------------------------------------------------- */
const BV_APS_LEVELS = [
  { id: "optimum", label: "Optimum", imprecisionFactor: 0.25, biasFactor: 0.125 },
  { id: "desirable", label: "Desirable", imprecisionFactor: 0.50, biasFactor: 0.250 },
  { id: "minimum", label: "Minimum", imprecisionFactor: 0.75, biasFactor: 0.375 }
];

function calculateBvAps(cvi, cvg) {
  if (typeof cvi !== "number" || !isFinite(cvi) || cvi < 0) {
    return { supported: false, levels: null, reason: "CVI must be a finite number greater than or equal to zero." };
  }
  const cvgUsable = typeof cvg === "number" && isFinite(cvg) && cvg >= 0;
  const levels = {};
  for (const level of BV_APS_LEVELS) {
    const imprecision = { supported: true, value: level.imprecisionFactor * cvi, units: "% CV" };
    const bias = cvgUsable
      ? { supported: true, value: level.biasFactor * Math.sqrt(cvi * cvi + cvg * cvg), units: "% (magnitude only)" }
      : { supported: false, value: null, reason: "Bias APS requires CVG, which is not available." };
    const tea = cvgUsable
      ? { supported: true, value: 1.65 * imprecision.value + bias.value, units: "%", disclosureOnly: true }
      : { supported: false, value: null, reason: "The optional combined TEa requires both imprecision and bias APS.", disclosureOnly: true };
    levels[level.id] = { label: level.label, imprecisionFactor: level.imprecisionFactor, biasFactor: level.biasFactor, imprecision, bias, tea };
  }
  return {
    supported: true,
    modelId: "bv-aps-milan-model-2",
    formulaFramework: "Milan Model 2 — analytical performance specifications derived from biological variation (Fraser/Petersen formulae), one of several Milan-model approaches; not a universal specification.",
    inputs: { cvi, cvg: cvgUsable ? cvg : null },
    levels,
    cvgAvailable: cvgUsable,
    assumptions: ["CVI and CVG are taken as supplied for the same measurand/population/matrix context.", "TEa combines imprecision and bias using the conventional 1.65×imprecision + bias formulation and is shown only as an optional, non-primary combined figure."],
    limitations: ["These specifications are statistically derived from population biological variation, not directly demonstrated against a clinical outcome.", "Bias APS is a magnitude only; it does not indicate the direction of any bias."]
  };
}

/* -------------------------------------------------------------------------
   Classical symmetric RCV (spec sections 33-37, Harris & Yasaka 1983).
   RCV = z × √2 × √(CVA² + CVI²). Deliberately has NO parameter for CVG —
   see the architectural note at the top of this file.
   ------------------------------------------------------------------------- */
function calculateClassicalRcv(cva, cvi, zConventionId) {
  if (!isFiniteNonNegativeNumber(cva) || !isFiniteNonNegativeNumber(cvi)) {
    return { supported: false, value: null, reason: "CVA and CVI must both be finite numbers greater than or equal to zero." };
  }
  const zConv = Z_CONVENTIONS[zConventionId];
  if (!zConv) {
    return { supported: false, value: null, reason: "A named z-value convention (\"bidirectional-95\" or \"unidirectional-95\") must be specified explicitly. It is never inferred from the direction of an observed change." };
  }
  const value = zConv.z * Math.sqrt(2 * (cva * cva + cvi * cvi));
  return {
    supported: true,
    modelId: "classical-symmetric-rcv",
    formulaFramework: "Classical (symmetric) reference change value (Harris & Yasaka 1983).",
    formula: "RCV = z × √2 × √(CVA² + CVI²)",
    value,
    units: "%",
    z: zConv.z,
    zConventionId: zConv.id,
    zLabel: zConv.label,
    directionConvention: "symmetric (the same threshold applies to an increase or a decrease)",
    inputs: { cva, cvi },
    assumptions: ["CVA and CVI are assumed to be normally distributed and independent, and are combined by simple addition in quadrature.", "The result applies equally to a rise or a fall of this magnitude."],
    limitations: ["A symmetric threshold can behave poorly for analytes whose combined variation is markedly non-normal — see the log-normal (asymmetric) model for that situation.", "This is a statistical threshold about the size of change likely to reflect analytical and within-subject variation combined — it is not a diagnostic cutoff and does not by itself establish clinical importance."]
  };
}

/* -------------------------------------------------------------------------
   Log-normal asymmetric RCV (spec sections 38-43, Fokkema et al. 2006).
   A separately-named function returning BOTH an increase and a decrease
   limit (they differ), plus full metadata. Also has NO CVG parameter.
   ------------------------------------------------------------------------- */
function calculateLognormalRcv(cva, cvi, zConventionId) {
  if (!isFiniteNonNegativeNumber(cva) || !isFiniteNonNegativeNumber(cvi)) {
    return { supported: false, increase: null, decrease: null, reason: "CVA and CVI must both be finite numbers greater than or equal to zero." };
  }
  const zConv = Z_CONVENTIONS[zConventionId];
  if (!zConv) {
    return { supported: false, increase: null, decrease: null, reason: "A named z-value convention (\"bidirectional-95\" or \"unidirectional-95\") must be specified explicitly. It is never inferred from the direction of an observed change." };
  }
  const cvt = Math.sqrt(cva * cva + cvi * cvi) / 100;
  const sigma = Math.sqrt(Math.log(1 + cvt * cvt));
  const k = zConv.z * Math.sqrt(2) * sigma;
  const increaseValue = (Math.exp(k) - 1) * 100;
  const decreaseValue = (1 - Math.exp(-k)) * 100;
  return {
    supported: true,
    modelId: "lognormal-asymmetric-rcv",
    formulaFramework: "Log-normal (asymmetric) reference change value (Fokkema et al. 2006 and related literature).",
    formula: "CVT = √(CVA²+CVI²)/100; σ = √ln(1+CVT²); k = z×√2×σ; increase% = (e^k − 1)×100; decrease% = (1 − e^−k)×100",
    sigma,
    k,
    increase: { supported: true, value: increaseValue, units: "%", direction: "increase" },
    decrease: { supported: true, value: decreaseValue, units: "% (magnitude of the allowable fall)", direction: "decrease" },
    z: zConv.z,
    zConventionId: zConv.id,
    zLabel: zConv.label,
    directionConvention: "asymmetric (the increase and decrease limits differ, and the decrease limit can never reach 100%)",
    inputs: { cva, cvi },
    assumptions: ["Combined analytical and within-subject variation is modelled as log-normally distributed rather than normally distributed.", "The decrease limit is a magnitude — it is mathematically bounded below 100% because a value cannot fall by 100% or more without reaching zero."],
    limitations: ["This model is not universally superior to the classical symmetric model; it is a different, and for some analytes more appropriate, distributional assumption — the two models are not both simultaneously \"correct\" for every measurand, and neither is invalidated by the existence of the other.", "This is a statistical threshold, not a diagnostic cutoff, and does not by itself establish clinical importance."]
  };
}

/* -------------------------------------------------------------------------
   Serial result arithmetic (spec sections 44-48). Absolute change retains
   sign; relative change requires a non-zero previous result and retains
   sign; neither ever returns Infinity or NaN.
   ------------------------------------------------------------------------- */
function calculateSerialAbsoluteChange(previousResult, currentResult) {
  if (typeof previousResult !== "number" || typeof currentResult !== "number" || !isFinite(previousResult) || !isFinite(currentResult)) {
    return { supported: false, value: null, reason: "Both the previous and current results must be finite numbers." };
  }
  return { supported: true, value: currentResult - previousResult, units: "same units as the results" };
}

function calculateSerialRelativeChange(previousResult, currentResult) {
  if (typeof previousResult !== "number" || typeof currentResult !== "number" || !isFinite(previousResult) || !isFinite(currentResult)) {
    return { supported: false, value: null, reason: "Both the previous and current results must be finite numbers." };
  }
  if (previousResult === 0) {
    return { supported: false, value: null, reason: "Relative change is not calculated when the previous result is zero (division by zero). Use the absolute change instead." };
  }
  return { supported: true, value: ((currentResult - previousResult) / previousResult) * 100, units: "%" };
}

/* -------------------------------------------------------------------------
   Exceedance evaluation (spec sections 44-52). Strict-exceeds semantics:
   exact equality to the threshold does NOT count as exceeding it. A small
   absolute epsilon absorbs floating-point rounding noise between
   independently-computed values without weakening the "exact equality
   never exceeds" rule.
   ------------------------------------------------------------------------- */
const EXCEEDANCE_EPSILON = 1e-9;

function directionOf(relativeChange) {
  if (relativeChange > 0) return "increase";
  if (relativeChange < 0) return "decrease";
  return "no-change";
}

function evaluateClassicalRcvExceedance(previousResult, currentResult, cva, cvi, zConventionId) {
  const change = calculateSerialRelativeChange(previousResult, currentResult);
  if (!change.supported) {
    return { supported: false, reason: change.reason };
  }
  const rcv = calculateClassicalRcv(cva, cvi, zConventionId);
  if (!rcv.supported) {
    return { supported: false, reason: rcv.reason };
  }
  const magnitude = Math.abs(change.value);
  const exceeds = (magnitude - rcv.value) > EXCEEDANCE_EPSILON;
  return {
    supported: true,
    modelId: "classical-symmetric-rcv",
    relativeChange: change.value,
    magnitude,
    threshold: rcv.value,
    direction: directionOf(change.value),
    exceeds,
    zConventionId: rcv.zConventionId,
    zLabel: rcv.zLabel,
    note: exceeds
      ? "The magnitude of the observed change exceeds the calculated classical RCV threshold for the supplied CVA and CVI."
      : "The magnitude of the observed change does not exceed the calculated classical RCV threshold for the supplied CVA and CVI."
  };
}

function evaluateLognormalRcvExceedance(previousResult, currentResult, cva, cvi, zConventionId) {
  const change = calculateSerialRelativeChange(previousResult, currentResult);
  if (!change.supported) {
    return { supported: false, reason: change.reason };
  }
  const rcv = calculateLognormalRcv(cva, cvi, zConventionId);
  if (!rcv.supported) {
    return { supported: false, reason: rcv.reason };
  }
  const direction = directionOf(change.value);
  const threshold = direction === "decrease" ? rcv.decrease.value : rcv.increase.value;
  const magnitude = Math.abs(change.value);
  const exceeds = direction === "no-change" ? false : (magnitude - threshold) > EXCEEDANCE_EPSILON;
  return {
    supported: true,
    modelId: "lognormal-asymmetric-rcv",
    relativeChange: change.value,
    magnitude,
    threshold,
    direction,
    exceeds,
    zConventionId: rcv.zConventionId,
    zLabel: rcv.zLabel,
    note: exceeds
      ? "The magnitude of the observed change exceeds the calculated log-normal RCV threshold for this direction, given the supplied CVA and CVI."
      : "The magnitude of the observed change does not exceed the calculated log-normal RCV threshold for this direction, given the supplied CVA and CVI."
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    Z_CONVENTIONS, Z_CONVENTION_IDS,
    BV_APS_LEVELS,
    calculateIndexOfIndividuality,
    calculateBvAps,
    calculateClassicalRcv,
    calculateLognormalRcv,
    calculateSerialAbsoluteChange,
    calculateSerialRelativeChange,
    evaluateClassicalRcvExceedance,
    evaluateLognormalRcvExceedance,
    EXCEEDANCE_EPSILON
  };
}
