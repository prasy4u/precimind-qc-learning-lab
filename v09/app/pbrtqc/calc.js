/* =========================================================================
   RECOVERY PROVENANCE NOTE (added during Stage 8A recovery):
   Artifact Class A — directly recovered from recovery/original-v0.8.html
   (SHA-256: e5317bf135f350b258428b985c1034a081e244a295f2e580c93cb6a6a091c8e4)
   Source lines: 12023-12474 (Patient Surveillance Lab calc section)
   Historical reported v0.8 commit: 3cc62b1 (not independently verified)
   Recovery date: 2026-09-01
   The block below is the unmodified source text from the HTML artifact.
   ========================================================================= */

/* =========================================================================
   Patient Surveillance Lab (QC-12) — v0.8 pure calculation and enum layer.
   No React, no scenario content — those live in 32-pbrtqc-data.js and
   34-pbrtqc-screens.jsx. Every function here is pure and independently
   unit-tested (test-pbrtqc.js). Mirrors the architecture of
   27-bv-calc.js / 23-eqa-calc.js / 19-investigation-calc.js.

   ARCHITECTURAL NAMING RULE (spec sections 10-13): this file and everything
   built on it uses the symbol **W** for "PBRTQC moving-window size — the
   number of eligible patient results contributing to the configured moving
   window." It NEVER reuses N (already the app-wide symbol for the number of
   QC measurements per event/run, defined in 01-core.js / the Rule
   Laboratory) as a stand-in for window size, anywhere in source, UI labels,
   variable names, or slider ids. See W_N_R_M_DISTINCTION_NOTE in
   32-pbrtqc-data.js and the "W semantic regression" section of
   test-pbrtqc.js, which scans this file's own source text for violations.

   Three algorithms are implemented numerically: sliding moving mean,
   sliding moving median, and EWMA — all SLIDING (recomputed at every new
   eligible result), never non-overlapping blocks. Bull's algorithm,
   Average of Normals, moving SD, moving delta, moving sum of outliers,
   moving percentiles, CUSUM and any ML/AI method are deliberately NOT
   implemented here (evidence content may mention them; this engine does
   not compute them).

   The seven-step processing pipeline (spec section 30) — metadata
   generated -> metadata inclusion/exclusion applied -> synthetic
   analytical error applied to the result -> numeric truncation applied ->
   eligible value enters the algorithm -> statistic calculated -> statistic
   compared with control limits — is enforced STRUCTURALLY by
   runPbrtqcStream() below, in that exact order; it is not merely tested
   after the fact.
   ========================================================================= */

/* -------------------------------------------------------------------------
   Window-size validation shared by the two windowed algorithms. W must be
   a finite integer >= 1. Zero, negative, non-integer, NaN and Infinity are
   all rejected explicitly rather than silently coerced.
   ------------------------------------------------------------------------- */
export function validateWindowSize(W) {
  if (typeof W !== "number" || !isFinite(W)) {
    return { valid: false, reason: "Window size (W) must be a finite number." };
  }
  if (!Number.isInteger(W)) {
    return { valid: false, reason: "Window size (W) must be a whole number of eligible patient results." };
  }
  if (W < 1) {
    return { valid: false, reason: "Window size (W) must be at least 1 eligible patient result." };
  }
  return { valid: true };
}

/* -------------------------------------------------------------------------
   Sliding moving mean (spec sections 18-20). Mean of the W most recent
   eligible values, recomputed at every new eligible result. Before W
   eligible values have accumulated, the point is reported as
   "warming-up" with statistic left undefined — never filled with zeros,
   a baseline value, or a partial-window mean.
   ------------------------------------------------------------------------- */
export function calculateSlidingMean(values, W) {
  const check = validateWindowSize(W);
  if (!check.valid) return { supported: false, algorithmId: "moving-mean", series: null, reason: check.reason };
  if (!Array.isArray(values)) return { supported: false, algorithmId: "moving-mean", series: null, reason: "Eligible values must be supplied as an array." };
  const series = values.map((v, i) => {
    if (i < W - 1) return { index: i, warmupStatus: "warming-up", statistic: undefined };
    let sum = 0;
    for (let k = i - W + 1; k <= i; k++) sum += values[k];
    return { index: i, warmupStatus: "complete", statistic: sum / W };
  });
  return { supported: true, algorithmId: "moving-mean", windowSize: W, series };
}

/* -------------------------------------------------------------------------
   Sliding moving median (spec sections 21-23). Ordinary median of the W
   most recent eligible values after sorting: for odd W, the middle value;
   for even W, the mean of the two central values (documented convention,
   never silently switched to a different convention).
   ------------------------------------------------------------------------- */
export function calculateSlidingMedian(values, W) {
  const check = validateWindowSize(W);
  if (!check.valid) return { supported: false, algorithmId: "moving-median", series: null, reason: check.reason };
  if (!Array.isArray(values)) return { supported: false, algorithmId: "moving-median", series: null, reason: "Eligible values must be supplied as an array." };
  const series = values.map((v, i) => {
    if (i < W - 1) return { index: i, warmupStatus: "warming-up", statistic: undefined };
    const windowSorted = values.slice(i - W + 1, i + 1).slice().sort((a, b) => a - b);
    const mid = Math.floor(W / 2);
    const statistic = (W % 2 === 1) ? windowSorted[mid] : (windowSorted[mid - 1] + windowSorted[mid]) / 2;
    return { index: i, warmupStatus: "complete", statistic };
  });
  return {
    supported: true,
    algorithmId: "moving-median",
    windowSize: W,
    series,
    medianConvention: "Ordinary median of the W most recent eligible values, sorted: for odd W, the middle value; for even W, the mean of the two central values."
  };
}

/* -------------------------------------------------------------------------
   EWMA (spec sections 24-27). z_t = lambda*x_t + (1-lambda)*z_(t-1), using
   a SEPARATELY SPECIFIED baselineCenter as z_0 — never silently
   initialised from the first eligible value. 0 < lambda <= 1; lambda=1 is
   valid (produces the current value each time, i.e. no smoothing). EWMA
   has no warm-up state: it is defined from the first eligible point
   onward because the baseline provides the required seed.
   ------------------------------------------------------------------------- */
export function calculateEWMA(values, lambda, baselineCenter) {
  if (typeof lambda !== "number" || !isFinite(lambda) || lambda <= 0 || lambda > 1) {
    return { supported: false, algorithmId: "ewma", series: null, reason: "The EWMA smoothing constant (lambda) must be a finite number with 0 < lambda <= 1." };
  }
  if (typeof baselineCenter !== "number" || !isFinite(baselineCenter)) {
    return { supported: false, algorithmId: "ewma", series: null, reason: "An explicit baseline centre (z0) must be supplied for EWMA. It is never silently initialised from the first eligible value." };
  }
  if (!Array.isArray(values)) return { supported: false, algorithmId: "ewma", series: null, reason: "Eligible values must be supplied as an array." };
  let prev = baselineCenter;
  const series = values.map((v, i) => {
    const statistic = lambda * v + (1 - lambda) * prev;
    prev = statistic;
    return { index: i, warmupStatus: "complete", statistic };
  });
  return { supported: true, algorithmId: "ewma", lambda, baselineCenter, series };
}

/* -------------------------------------------------------------------------
   Metadata inclusion/exclusion filter (spec sections 30-31). Operates on
   the ORIGINAL patient-metadata subgroup label only — it never consults
   the (possibly error-affected, possibly truncated) numeric result, so
   changing the analytical result can never change subgroup identity.
   ------------------------------------------------------------------------- */
export function applyMetadataFilter(subgroupLabel, excludedSubgroups) {
  const excluded = Array.isArray(excludedSubgroups) ? excludedSubgroups : [];
  if (subgroupLabel != null && excluded.indexOf(subgroupLabel) !== -1) {
    return { included: false, exclusionReason: "Excluded by configured metadata filter: subgroup \"" + subgroupLabel + "\" is on the exclusion list for this scenario." };
  }
  return { included: true, exclusionReason: null };
}

/* -------------------------------------------------------------------------
   Synthetic analytical error injection (spec sections 54-59). Applied to
   a single raw patient result BEFORE truncation — callers (runPbrtqcStream
   below) must invoke this before applyHardTruncation(), never after.
   Supported errorType values: "none", "persistent-additive",
   "persistent-proportional", "temporary-additive", "temporary-proportional".
   No imprecision modelling. rawPatientIndex and onsetIndex are 1-based raw
   patient indices, matching the UI convention.
   ------------------------------------------------------------------------- */
export const SUPPORTED_ERROR_TYPES = ["none", "persistent-additive", "persistent-proportional", "temporary-additive", "temporary-proportional"];

export function injectAnalyticalError(value, rawPatientIndex, errorScenario) {
  if (typeof value !== "number" || !isFinite(value)) {
    return { value, affected: false, reason: "Value is not a finite number." };
  }
  if (!errorScenario || !errorScenario.errorType || errorScenario.errorType === "none") {
    return { value, affected: false };
  }
  const errorType = errorScenario.errorType;
  if (SUPPORTED_ERROR_TYPES.indexOf(errorType) === -1) {
    return { value, affected: false, reason: "Unrecognised error type. v0.8 implements only persistent/temporary additive/proportional shifts — no imprecision modelling." };
  }
  const magnitude = errorScenario.magnitude;
  const onsetIndex = errorScenario.onsetIndex;
  if (typeof magnitude !== "number" || !isFinite(magnitude)) {
    return { value, affected: false, reason: "Error magnitude must be a finite number." };
  }
  if (typeof onsetIndex !== "number" || !isFinite(onsetIndex) || onsetIndex < 1) {
    return { value, affected: false, reason: "Error onset raw patient index must be a finite number >= 1." };
  }
  if (typeof rawPatientIndex !== "number" || rawPatientIndex < onsetIndex) {
    return { value, affected: false };
  }
  const isTemporary = errorType.indexOf("temporary") === 0;
  if (isTemporary) {
    const duration = errorScenario.duration;
    if (typeof duration !== "number" || !isFinite(duration) || duration < 1) {
      return { value, affected: false, reason: "A temporary error requires a finite duration (>= 1) expressed in raw patient results." };
    }
    if (rawPatientIndex >= onsetIndex + duration) {
      return { value, affected: false };
    }
  }
  const isAdditive = errorType.indexOf("additive") !== -1;
  const newValue = isAdditive ? (value + magnitude) : (value * (1 + magnitude / 100));
  return { value: newValue, affected: true, errorType, magnitude };
}

/* -------------------------------------------------------------------------
   Numeric truncation (spec sections 32-37). ONE approach only: hard
   exclusion. A value strictly below lowerTruncationLimit or strictly
   above upperTruncationLimit is excluded; a value exactly AT a limit
   remains eligible. This is never called "winsorisation" — winsorisation
   (clamping a value to the limit rather than excluding it) is a different
   technique and is not implemented anywhere in this file.
   ------------------------------------------------------------------------- */
export function applyHardTruncation(value, lowerTruncationLimit, upperTruncationLimit) {
  if (typeof value !== "number" || !isFinite(value)) {
    return { included: false, value, exclusionReason: "Value is not a finite number." };
  }
  const hasLower = typeof lowerTruncationLimit === "number" && isFinite(lowerTruncationLimit);
  const hasUpper = typeof upperTruncationLimit === "number" && isFinite(upperTruncationLimit);
  if (hasLower && value < lowerTruncationLimit) {
    return { included: false, value, exclusionReason: "Below the configured lower truncation limit (" + lowerTruncationLimit + ")." };
  }
  if (hasUpper && value > upperTruncationLimit) {
    return { included: false, value, exclusionReason: "Above the configured upper truncation limit (" + upperTruncationLimit + ")." };
  }
  return { included: true, value, exclusionReason: null };
}

/* -------------------------------------------------------------------------
   Control-limit evaluation (spec section 53). Strict-exceeds semantics:
   a statistic exactly equal to a control limit does NOT trigger an alert
   — only strictly below the lower limit or strictly above the upper limit
   does. This is a deliberate v0.8 convention, not a floating-point
   accident, and is tested at exact boundary values.
   ------------------------------------------------------------------------- */
export function evaluateControlLimit(statistic, lowerControlLimit, upperControlLimit) {
  if (typeof statistic !== "number" || !isFinite(statistic)) {
    return { supported: false, alert: false, direction: "none", reason: "No statistic is available for this point (warm-up or excluded), so no control-limit comparison is made." };
  }
  const hasLower = typeof lowerControlLimit === "number" && isFinite(lowerControlLimit);
  const hasUpper = typeof upperControlLimit === "number" && isFinite(upperControlLimit);
  let alert = false, direction = "none";
  if (hasLower && statistic < lowerControlLimit) { alert = true; direction = "low"; }
  else if (hasUpper && statistic > upperControlLimit) { alert = true; direction = "high"; }
  return {
    supported: true, alert, direction, statistic,
    lowerControlLimit: hasLower ? lowerControlLimit : null,
    upperControlLimit: hasUpper ? upperControlLimit : null
  };
}

/* -------------------------------------------------------------------------
   Pointwise false-flag rate (spec sections 44-46). Computed ONLY on a
   verification stream explicitly designated stable / no-error / no-case-
   mix-shift. Consecutive moving-window statistics are correlated with one
   another, so this is not equivalent to a set of independent hypothesis
   tests and must never be called simply "alpha."
   ------------------------------------------------------------------------- */
export function calculatePointwiseFalseFlagRate(breachCount, evaluableCount) {
  if (typeof evaluableCount !== "number" || !isFinite(evaluableCount) || evaluableCount <= 0) {
    return { supported: false, rate: null, reason: "At least one evaluable point is required. A false-flag rate is not computed for zero evaluable points (no division by zero)." };
  }
  if (typeof breachCount !== "number" || !isFinite(breachCount) || breachCount < 0) {
    return { supported: false, rate: null, reason: "Breach count must be a non-negative finite number." };
  }
  return {
    supported: true,
    rate: (breachCount / evaluableCount) * 100,
    breachCount,
    evaluableCount,
    correlationCaveat: "Consecutive moving-window statistics are correlated with one another (they share overlapping eligible values), so this pointwise rate is not equivalent to a set of independent hypothesis tests and should not be reported simply as \"alpha.\""
  };
}

/* -------------------------------------------------------------------------
   NPed — number of patient results affected before error detection (spec
   sections 60-69). Uses RAW patient indices (1-based), not eligible-value
   count, because a truncated-out result may still have been analytically
   affected. detected=false, nped=undefined for an undetected trial —
   never Infinity, never an invented numeric value. An alert index earlier
   than the error onset index is treated as an invalid configuration, not
   silently accepted.
   ------------------------------------------------------------------------- */
export function calculateNPed(errorOnsetRawIndex, firstAlertRawIndex, simulationHorizon) {
  if (typeof errorOnsetRawIndex !== "number" || !isFinite(errorOnsetRawIndex) || errorOnsetRawIndex < 1) {
    return { supported: false, detected: false, nped: undefined, reason: "A valid error onset raw patient index (>= 1) is required." };
  }
  const horizon = (simulationHorizon != null && isFinite(simulationHorizon)) ? simulationHorizon : null;
  if (firstAlertRawIndex == null) {
    return {
      supported: true, detected: false, nped: undefined,
      errorOnsetIndex: errorOnsetRawIndex, firstAlertIndex: null, simulationHorizon: horizon,
      metricConvention: "NPed = first alert raw patient index minus error onset raw patient index (1-based raw indexing).",
      limitations: ["No alert occurred within the simulated horizon. NPed is not reported as Infinity or as any invented numeric placeholder for an undetected trial."]
    };
  }
  if (typeof firstAlertRawIndex !== "number" || !isFinite(firstAlertRawIndex)) {
    return { supported: false, detected: false, nped: undefined, reason: "First alert raw patient index must be a finite number when provided." };
  }
  if (firstAlertRawIndex < errorOnsetRawIndex) {
    return { supported: false, detected: false, nped: undefined, reason: "An alert raw patient index earlier than the error onset raw patient index cannot be a valid detection of this error — this indicates a configuration or data error, not NPed = negative." };
  }
  return {
    supported: true, detected: true, nped: firstAlertRawIndex - errorOnsetRawIndex,
    errorOnsetIndex: errorOnsetRawIndex, firstAlertIndex: firstAlertRawIndex, simulationHorizon: horizon,
    metricConvention: "NPed = first alert raw patient index minus error onset raw patient index (1-based raw indexing)."
  };
}

/* -------------------------------------------------------------------------
   Multi-trial NPed summary (spec sections 65-69). ANPed is the mean of
   NPed across trials, but this is an ordinary arithmetic mean and is only
   a valid estimator when every trial's detection time is fully observed.
   When one or more trials never detect the injected error within the
   finite simulation horizon, that trial's detection time is
   RIGHT-CENSORED — known only to exceed the horizon, not what its true
   value would have been. An ordinary arithmetic mean cannot incorporate a
   censored observation, so the unconditional ANPed is NOT ESTIMABLE by an
   ordinary mean in that situation.

   SC27 (scientific owner adjudication, Dr Prasenjit Mitra + ChatGPT): the
   computational safeguard is unchanged — `anped` MUST remain undefined
   whenever any trial is undetected, and this function must NEVER silently
   average the detected-only subset and present that as ANPed, because
   doing so would bias the apparent detection delay downward. The prior
   terminology described this as ANPed being "undefined"; the adjudicated,
   more precise description is that ANPed is "not estimable" due to
   right-censoring. No survival-analysis functionality (e.g. Kaplan-Meier)
   is introduced in v1.0, and no artificial NPed value (the simulation
   horizon, or horizon + 1) is ever assigned to an undetected trial.
   Detection rate and a separately labelled mean/median NPed among
   detected trials are reported alongside, so probability of detection and
   detection delay are interpreted separately rather than conflated.
   ------------------------------------------------------------------------- */
export function summarizeNpedTrials(trials) {
  if (!Array.isArray(trials) || trials.length === 0) {
    return { supported: false, reason: "At least one trial is required to summarise NPed across trials." };
  }
  const totalTrials = trials.length;
  const detected = trials.filter(t => t && t.detected);
  const detectedTrials = detected.length;
  const undetectedTrials = totalTrials - detectedTrials;
  const allTrialsDetected = undetectedTrials === 0;
  const detectedNpeds = detected.map(t => t.nped).filter(n => typeof n === "number" && isFinite(n));
  const meanNpedAmongDetected = detectedNpeds.length ? detectedNpeds.reduce((a, b) => a + b, 0) / detectedNpeds.length : null;
  const sorted = detectedNpeds.slice().sort((a, b) => a - b);
  let medianNpedAmongDetected = null;
  if (sorted.length) {
    const mid = Math.floor(sorted.length / 2);
    medianNpedAmongDetected = (sorted.length % 2 === 1) ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return {
    supported: true,
    totalTrials,
    detectedTrials,
    undetectedTrials,
    detectionRatePercent: (detectedTrials / totalTrials) * 100,
    anped: allTrialsDetected ? meanNpedAmongDetected : undefined,
    meanNpedAmongDetected,
    medianNpedAmongDetected,
    allTrialsDetected,
    censoringNote: allTrialsDetected
      ? null
      : "ANPed is Not estimable: at least one trial did not detect the introduced error within the simulation horizon, so that trial's detection time is right-censored (known only to exceed the horizon). An ordinary arithmetic mean cannot include a censored value, and averaging only the detected trials would bias the apparent detection delay downward — a poorly-performing configuration would look better than it is. The detection rate and the mean/median NPed among the trials that WERE detected are reported separately instead, so probability of detection and detection delay are interpreted as distinct questions."
  };
}

/* -------------------------------------------------------------------------
   Full-stream orchestration. Runs the seven-step processing pipeline over
   an entire raw patient-result stream, in the fixed order required by
   spec section 30: metadata filter -> analytical error injection ->
   numeric truncation -> algorithm (over the compacted eligible sequence)
   -> control-limit comparison. This is the ONLY function in this file
   that combines the primitives above; the primitives themselves remain
   independently callable and independently tested.

   rawResults: array of { value, subgroup? } in raw patient order (1-based
   raw index = array position + 1).
   config: { algorithmId, windowSize, ewmaLambda, baselineCenter,
             lowerTruncationLimit, upperTruncationLimit,
             lowerControlLimit, upperControlLimit,
             excludedSubgroups, errorScenario }
   ------------------------------------------------------------------------- */
export function runPbrtqcStream(rawResults, config) {
  if (!Array.isArray(rawResults)) return { supported: false, reason: "Raw patient results must be supplied as an array." };
  const cfg = config || {};
  const points = [];
  const eligibleValues = [];

  for (let i = 0; i < rawResults.length; i++) {
    const rawPatientIndex = i + 1;
    const r = rawResults[i] || {};
    const baselineValue = r.value;

    // Step 1+2: metadata generated & metadata inclusion/exclusion applied.
    const metaResult = applyMetadataFilter(r.subgroup, cfg.excludedSubgroups);
    if (!metaResult.included) {
      points.push({
        rawPatientIndex, eligiblePatientIndex: null, rawValue: baselineValue,
        errorAffectedValue: null, errorAffected: false, includedValue: null,
        included: false, exclusionReason: metaResult.exclusionReason,
        statistic: undefined, warmupStatus: "excluded", alert: false, alertDirection: "none"
      });
      continue;
    }

    // Step 3: synthetic analytical error applied BEFORE truncation.
    const errResult = injectAnalyticalError(baselineValue, rawPatientIndex, cfg.errorScenario);

    // Step 4: numeric truncation applied to the (possibly error-affected) value.
    const truncResult = applyHardTruncation(errResult.value, cfg.lowerTruncationLimit, cfg.upperTruncationLimit);
    if (!truncResult.included) {
      points.push({
        rawPatientIndex, eligiblePatientIndex: null, rawValue: baselineValue,
        errorAffectedValue: errResult.value, errorAffected: errResult.affected, includedValue: null,
        included: false, exclusionReason: truncResult.exclusionReason,
        statistic: undefined, warmupStatus: "excluded", alert: false, alertDirection: "none"
      });
      continue;
    }

    // Step 5: eligible value enters the algorithm.
    eligibleValues.push(truncResult.value);
    points.push({
      rawPatientIndex, eligiblePatientIndex: eligibleValues.length, rawValue: baselineValue,
      errorAffectedValue: errResult.value, errorAffected: errResult.affected, includedValue: truncResult.value,
      included: true, exclusionReason: null,
      statistic: undefined, warmupStatus: "pending", alert: false, alertDirection: "none"
    });
  }

  // Step 6: statistic calculated, over the compacted eligible sequence.
  let statResult;
  if (cfg.algorithmId === "moving-mean") statResult = calculateSlidingMean(eligibleValues, cfg.windowSize);
  else if (cfg.algorithmId === "moving-median") statResult = calculateSlidingMedian(eligibleValues, cfg.windowSize);
  else if (cfg.algorithmId === "ewma") statResult = calculateEWMA(eligibleValues, cfg.ewmaLambda, cfg.baselineCenter);
  else return { supported: false, reason: "Unrecognised algorithmId. v0.8 implements only \"moving-mean\", \"moving-median\" and \"ewma\"." };

  if (!statResult.supported) return { supported: false, reason: statResult.reason };

  // Step 7: statistic compared with control limits.
  let cursor = 0;
  for (const p of points) {
    if (!p.included) continue;
    const s = statResult.series[cursor];
    cursor++;
    p.algorithmId = cfg.algorithmId;
    p.windowSize = cfg.windowSize != null ? cfg.windowSize : null;
    p.warmupStatus = s.warmupStatus;
    p.statistic = s.statistic;
    p.lowerControlLimit = cfg.lowerControlLimit != null ? cfg.lowerControlLimit : null;
    p.upperControlLimit = cfg.upperControlLimit != null ? cfg.upperControlLimit : null;
    if (s.statistic !== undefined) {
      const ctrl = evaluateControlLimit(s.statistic, cfg.lowerControlLimit, cfg.upperControlLimit);
      p.alert = ctrl.alert;
      p.alertDirection = ctrl.direction;
    }
  }

  const firstAlertPoint = points.find(p => p.alert);
  return {
    supported: true,
    points,
    rawCount: rawResults.length,
    eligibleCount: eligibleValues.length,
    excludedCount: rawResults.length - eligibleValues.length,
    firstAlertRawIndex: firstAlertPoint ? firstAlertPoint.rawPatientIndex : null,
    algorithmId: cfg.algorithmId
  };
}

