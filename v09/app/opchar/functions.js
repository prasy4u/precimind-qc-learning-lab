/* =========================================================================
   core/opchar — validated operating-characteristic math (Ped / Pfr).

   Per the v0.3 spec, this application does NOT fabricate Ped/Pfr values and
   does NOT infer them from Sigma alone. It implements the "Alternative"
   scientifically-safe path: validated numerical calculations for a
   RESTRICTED SET of simple single-rule procedures only (here: 1_3s applied
   to N independent control measurements assumed Normally distributed),
   derived from standard normal-distribution theory and unit-tested against
   independently calculable reference values (standard normal table facts
   such as Phi(0)=0.5, Phi(3)=0.99865).

   For any multirule / sequential procedure (2_2s, R_4s, 4_1s, 10x and
   combinations of these), exact closed-form Ped/Pfr requires simulation
   that has not been independently validated in this build. Those
   procedures report { validated: false } and the UI must display:
   "Operating-characteristic estimate not implemented in this version."
   Nothing about their true operating characteristics is fabricated or
   inferred from Sigma. This module must never silently change that.

   PROVENANCE: Class A — directly recovered from recovery/original-v0.8.html
   (SHA-256: e5317bf135f350b258428b985c1034a081e244a295f2e580c93cb6a6a091c8e4)
   Source lines: ~4155-4282 (core/opchar section within app-source script)
   Historical reported v0.8 commit: 3cc62b1 (not independently verified)
   Recovery date: 2026-08-31
   ========================================================================= */

/* Abramowitz & Stegun 7.1.26 rational approximation to the error function,
   accurate to |error| <= 1.5e-7. Used to build the standard normal CDF. */
export function erf(x) {
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741,
    a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

/* Standard normal cumulative distribution function, P(Z <= z). */
export function normalCDF(z) {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

/* Probability that a single control result, distributed N(0,1) under a
   stable (in-control) process, exceeds +3 SD or -3 SD (the 1_3s limit). */
export function pfr1_3sSingle() {
  return 1 - (2 * normalCDF(3) - 1);
}

/* Probability of false rejection for the 1_3s rule applied independently
   to N control measurements in the stable-process case: at least one of N
   independent results exceeds +-3 SD. */
export function pfr1_3s(N) {
  const pStayWithin = 2 * normalCDF(3) - 1;
  return 1 - Math.pow(pStayWithin, N);
}

/* Probability that a single control result detects a systematic shift of
   deltaSE standard-deviation units (the process mean has moved by
   deltaSE * SD) under the 1_3s rule: P(X > 3) + P(X < -3) for X ~ N(deltaSE, 1). */
export function pedSingle1_3s(deltaSE) {
  return (1 - normalCDF(3 - deltaSE)) + normalCDF(-3 - deltaSE);
}

/* Probability of error detection for the 1_3s rule applied independently
   to N control measurements, given a systematic shift of deltaSE SD units:
   at least one of N independent results exceeds +-3 SD. */
export function ped1_3s(deltaSE, N) {
  const pDetectSingle = pedSingle1_3s(deltaSE);
  return 1 - Math.pow(1 - pDetectSingle, N);
}

/* -------------------------------------------------------------------------
   v0.3.1 hardening (spec sections 7-8): operatingCharacteristic() must not
   appear to imply universal multirule support. The actual validated
   numerical method is now named explicitly — operatingCharacteristic13s()
   — and operatingCharacteristic(ruleIds, N, deltaSE) is a thin, safe
   DISPATCHER that calls it ONLY for the exact single-rule case ["13s"].
   Every other ruleIds combination (any multirule procedure, and any
   procedure containing 8x or 10x on its own) explicitly returns
   { supported: false, validated: false } with the exact required note
   text below — never a summed, multiplied, Sigma-inferred, or otherwise
   fabricated number. `validated` is retained alongside `supported` (same
   boolean) for backward compatibility with existing callers/tests.
   ------------------------------------------------------------------------- */
export const UNSUPPORTED_OPCHAR_NOTE = "Numerical operating-characteristic calculation is not implemented for this multirule procedure in the current version.";
export const UNSUPPORTED_OPCHAR_REASON = "Exact closed-form Ped/Pfr for a multirule or sequential procedure (for example 1₃s/2₂s/R₄s, 1₃s/2₂s/R₄s/4₁s, or any procedure including 8x or 10x) requires dedicated joint statistical modelling — simulation or derivation that has not been independently validated in this build. This application never adds individual rule probabilities together, multiplies them as though the rules were statistically independent, infers Ped/Pfr from Sigma alone, or otherwise approximates or fabricates a numeric value for an unvalidated procedure.";

/* The only independently validated numerical operating-characteristic
   calculation in this build: the single 1_3s rule applied on its own to N
   independent control measurements. */
export function operatingCharacteristic13s(N, deltaSE) {
  if (typeof N !== "number" || !(N > 0)) return null;
  return {
    supported: true,
    validated: true,
    ruleId: "13s",
    N,
    deltaSE,
    pfr: pfr1_3s(N),
    ped: ped1_3s(deltaSE, N),
    basis: "Closed-form calculation from standard normal distribution theory (independent control measurements, Gaussian process assumption)."
  };
}

export function unsupportedOperatingCharacteristic() {
  return { supported: false, validated: false, note: UNSUPPORTED_OPCHAR_NOTE, reason: UNSUPPORTED_OPCHAR_REASON };
}

/* Restricted validated operating-characteristic lookup, keyed by the same
   ruleId vocabulary used by the rule engine (07-rules.js). Only "13s" (used
   alone, with no other rule enabled) is validated in this build — this
   includes ruleIds arrays containing "8x" or "10x", alone or combined with
   any other rule, which always fall through to the unsupported branch. */
export function operatingCharacteristic(ruleIds, N, deltaSE) {
  const onlyRule = Array.isArray(ruleIds) && ruleIds.length === 1 ? ruleIds[0] : null;
  if (onlyRule === "13s" && typeof N === "number" && N > 0) {
    return operatingCharacteristic13s(N, deltaSE);
  }
  return unsupportedOperatingCharacteristic();
}

