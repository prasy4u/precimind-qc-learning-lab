/* =========================================================================
   core/statistics — pure calculation functions
   Kept separate from UI rendering. Every function is deterministic and
   side-effect free. See VALIDATION_FIXTURES below for the numeric checks
   required by the build specification (Fixtures A–D).

   PROVENANCE: Class A — directly recovered from recovery/original-v0.8.html
   (SHA-256: e5317bf135f350b258428b985c1034a081e244a295f2e580c93cb6a6a091c8e4)
   Historical reported v0.8 commit: 3cc62b1 (not independently verified)
   Recovery date: 2026-08-31
   ========================================================================= */

export function calcMean(values) {
  if (!Array.isArray(values) || values.length === 0) return NaN;
  const sum = values.reduce((a, b) => a + b, 0);
  return sum / values.length;
}

// Sample standard deviation — denominator (n-1). Requires n >= 2.
// Deliberately NOT the population SD; this function is used whenever SD is
// estimated from a set of entered/observed QC values.
export function calcSampleSD(values) {
  if (!Array.isArray(values) || values.length < 2) return NaN;
  const m = calcMean(values);
  const sumSq = values.reduce((acc, x) => acc + (x - m) * (x - m), 0);
  return Math.sqrt(sumSq / (values.length - 1));
}

// CV% = SD / mean * 100. Guarded against zero/negative mean.
export function calcCVPercent(sd, m) {
  if (!isFinite(sd) || !isFinite(m) || m <= 0) return NaN;
  return (sd / m) * 100;
}

// Signed percentage bias: (Observed - Target) / Target * 100
export function calcBiasPercent(observed, target) {
  if (!isFinite(observed) || !isFinite(target) || target === 0) return NaN;
  return ((observed - target) / target) * 100;
}

// Simplified total-error Sigma metric: Sigma = (TEa% - |Bias%|) / CV%
// Uses the ABSOLUTE magnitude of bias in the numerator (Fixture D).
// Does not force a floor of zero — a negative mathematical result is
// preserved and flagged with a warning rather than clamped.
export function calcSigma(TEaPercent, biasPercentSigned, cvPercentValue) {
  if (!isFinite(TEaPercent) || !isFinite(biasPercentSigned) || !isFinite(cvPercentValue)) {
    return { value: null, valid: false, warning: "Enter valid numeric values for TEa, Bias and CV." };
  }
  if (cvPercentValue <= 0) {
    return { value: null, valid: false, warning: "CV must be greater than zero to calculate a Sigma value." };
  }
  const absBias = Math.abs(biasPercentSigned);
  const value = (TEaPercent - absBias) / cvPercentValue;
  let warning = null;
  if (TEaPercent <= absBias) {
    warning = "The allowable total error does not exceed the observed bias magnitude. The resulting Sigma value is zero or negative — this indicates the bias alone may consume, or exceed, the entire allowable error budget under this specification.";
  }
  return { value, valid: true, warning };
}

export function roundTo(x, dp) {
  if (!isFinite(x)) return x;
  const f = Math.pow(10, dp);
  return Math.round(x * f) / f;
}

export function fmt(x, dp) {
  if (x === null || x === undefined || !isFinite(x)) return "—";
  return x.toFixed(dp);
}

export function fmtSigned(x, dp) {
  if (x === null || x === undefined || !isFinite(x)) return "—";
  const s = x >= 0 ? "+" : "";
  return s + x.toFixed(dp);
}

/* -------------------------------------------------------------------------
   VALIDATION_FIXTURES
   Executed once at module load (see runFixtureChecks below) and logged to
   the console. These correspond exactly to build-spec fixtures A–D and
   acceptance tests 1–4, 6.

   DIRECTLY RECOVERED RUNTIME FIXTURES
   Source: recovery/original-v0.8.html, lines ~911–950
   Provenance: Class A — verbatim from recovered HTML
   ------------------------------------------------------------------------- */
export function runFixtureChecks() {
  const results = [];
  const near = (a, b, tol) => isFinite(a) && Math.abs(a - b) <= (tol || 0.001);

  // Fixture A
  const dataA = [98, 100, 101, 99, 102];
  const mA = calcMean(dataA);
  const sdA = calcSampleSD(dataA);
  const cvA = calcCVPercent(sdA, mA);
  results.push(["Fixture A — mean = 100.0000", near(mA, 100, 0.0001)]);
  results.push(["Fixture A — sample SD ≈ 1.5811", near(sdA, 1.5811, 0.0005)]);
  results.push(["Fixture A — CV ≈ 1.5811%", near(cvA, 1.5811, 0.0005)]);

  // Fixture B
  const biasB = calcBiasPercent(102, 100);
  results.push(["Fixture B — signed bias = +2.0%", near(biasB, 2.0, 0.0001)]);

  // Fixture C
  const sigC = calcSigma(10, 2, 2);
  results.push(["Fixture C — Sigma = 4.0", sigC.valid && near(sigC.value, 4.0, 0.0001)]);

  // Fixture D
  const sigD = calcSigma(10, -2, 2);
  results.push(["Fixture D — Sigma remains 4.0 with negative bias", sigD.valid && near(sigD.value, 4.0, 0.0001)]);
  results.push(["Fixture C/D — equal magnitude regardless of bias sign", near(sigC.value, sigD.value, 1e-9)]);

  // Guards
  results.push(["Guard — CV undefined when mean <= 0", isNaN(calcCVPercent(2, 0)) && isNaN(calcCVPercent(2, -5))]);
  results.push(["Guard — Sigma invalid when CV <= 0", calcSigma(10, 2, 0).valid === false]);
  const sigNeg = calcSigma(5, 8, 2);
  results.push(["Guard — Sigma allowed negative (not floored) when TEa <= |Bias|", sigNeg.valid && sigNeg.value < 0 && !!sigNeg.warning]);

  return results;
}

export const FIXTURE_RESULTS = runFixtureChecks();
if (typeof console !== "undefined") {
  const failed = FIXTURE_RESULTS.filter(r => !r[1]);
  console.log("[PreciMind] Scientific validation fixtures:", FIXTURE_RESULTS);
  if (failed.length) {
    console.error("[PreciMind] FIXTURE FAILURES:", failed);
  } else {
    console.log("[PreciMind] All " + FIXTURE_RESULTS.length + " validation fixtures passed.");
  }
}

