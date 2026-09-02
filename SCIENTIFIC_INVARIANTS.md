# PreciMind QC Learning Lab — Scientific Invariants

This document records the scientific invariants that the codebase must never
violate, their provenance, and the tests that verify them.

These are not design decisions — they are the mathematical and metrological
definitions used by the application. Refactoring must not alter them.

---

## Stage 1 — Core Statistics Engine

**Source module:** `src/core/statistics.js`
**Provenance:** Class A — directly recovered from `recovery/original-v0.8.html`

---

### INVAR-01: Arithmetic Mean

```
Mean = sum(x_i) / n
```

- Standard arithmetic average.
- Returns `NaN` for empty or non-array input.
- Single-element arrays are valid (returns that element).
- **Function:** `calcMean(values)`
- **Tests:** T-MEAN-01 through T-MEAN-05, FIXTURE-A

---

### INVAR-02: Sample Standard Deviation (n−1)

```
SD = sqrt( sum((x_i - mean)^2) / (n - 1) )
```

- Uses **n−1** (Bessel's correction / sample SD), NOT population SD (n).
- Requires n ≥ 2; returns `NaN` for n < 2.
- **Rationale:** SD is always estimated from a sample of observed QC values.
- **Function:** `calcSampleSD(values)`
- **Tests:** T-SD-01 through T-SD-04, FIXTURE-A

---

### INVAR-03: Coefficient of Variation (CV%)

```
CV% = (SD / Mean) × 100
```

- Guarded: returns `NaN` when mean ≤ 0 (zero or negative mean is physically
  meaningless for a concentration and makes CV undefined/misleading).
- Returns `NaN` for any non-finite input.
- **Function:** `calcCVPercent(sd, mean)`
- **Tests:** T-CV-01 through T-CV-04b, FIXTURE-A

---

### INVAR-04: Signed Bias%

```
Bias% = (Observed − Target) / Target × 100
```

- **Signed** — a result below target yields a negative bias.
- Returns `NaN` when target = 0 (division by zero).
- Returns `NaN` for any non-finite input.
- **Function:** `calcBiasPercent(observed, target)`
- **Tests:** T-BIAS-01 through T-BIAS-04, FIXTURE-B

---

### INVAR-05: Sigma Metric — Absolute Bias in Numerator

```
Sigma = (TEa% − |Bias%|) / CV%
```

- The numerator uses the **absolute magnitude** of bias, not the signed value.
  A positive bias of 2% and a negative bias of 2% produce the same Sigma.
- **Function:** `calcSigma(TEaPercent, biasPercentSigned, cvPercentValue)`
- **Tests:** T-SIG-01, T-SIG-02, T-SIG-03, FIXTURE-C, FIXTURE-D

---

### INVAR-06: Negative Sigma Is Permitted

- When `|Bias%| ≥ TEa%`, the calculated Sigma is zero or negative.
- The result is **not floored to zero** — the negative mathematical value is
  preserved and returned with `valid: true` and a non-null `warning`.
- This is deliberate: clamping to zero would conceal the fact that bias alone
  consumes or exceeds the entire allowable error budget.
- **Function:** `calcSigma(...)` → `{ value: <negative number>, valid: true, warning: <string> }`
- **Tests:** T-SIG-04, T-SIG-04b, T-SIG-08, Guard fixture

---

### INVAR-07: Sigma Invalid When CV ≤ 0

- `calcSigma` returns `{ value: null, valid: false, warning: <string> }` when
  `cvPercentValue ≤ 0` (division by zero or nonsensical input).
- **Tests:** T-SIG-05, Guard fixture

---

## Recovered Fixture Provenance

| Fixture ID | Description | Provenance | Source lines (approx.) |
|------------|-------------|------------|------------------------|
| Fixture A | Mean=100, SD≈1.5811, CV≈1.5811% for [98,100,101,99,102] | Class A | HTML ~922–927 |
| Fixture B | Signed bias = +2.0% for (observed=102, target=100) | Class A | HTML ~930 |
| Fixture C | Sigma = 4.0 for (TEa=10, bias=+2, CV=2) | Class A | HTML ~934 |
| Fixture D | Sigma = 4.0 for (TEa=10, bias=−2, CV=2) — tests absolute bias | Class A | HTML ~938 |
| Guard-CV  | CV undefined when mean ≤ 0 | Class A | HTML ~943 |
| Guard-SigCV | Sigma invalid when CV ≤ 0 | Class A | HTML ~944 |
| Guard-NegSig | Negative Sigma allowed, not floored | Class A | HTML ~945–946 |

**Total runtime fixtures recovered:** 10 / 10
**Total Stage 1 tests:** 48 / 48 passed

---

## Recovery Status (updated after Stage 4B)

Modules already recovered and documented in this file:
- Stage 1: Core Statistics (calcMean, calcSampleSD, calcCVPercent, calcBiasPercent, calcSigma)
- Stage 2: QC Rule Engine (1_2s, 1_3s, 2_2s, R_4s, 4_1s, 8x, 10x)
- Stage 3A: Operating Characteristics (Ped/Pfr for pure 1_3s)
- Stage 3B: QC Strategy Core (APS, procedure library A-D, Sigma mapping, challenge bank)
- Stage 4A: Detection-Delay Engine (geometric model, immediate/uniform onset)
- Stage 4B: Risk & Frequency Teaching Data (in progress / completed this stage)

Pending recovery (not yet extracted):
- Investigation Lab
- EQA
- Biological Variation / RCV
- PBRTQC patient surveillance

---

## Stage 2 — Statistical QC Rule Engine

**Source module:** `src/rules/engine.js`
**Provenance:** Class A — directly recovered from `recovery/original-v0.8.html` (lines ~2817–3196)

---

### INVAR-08: Strict Exceedance — No Border Values Trigger

All rule thresholds use `>` (strictly greater) not `>=`. A z-score exactly equal to ±1, ±2, or ±3 does NOT trigger any rule.

- **Functions:** `exceedsPositive`, `exceedsNegative`, `exceedsAbs`
- **Tests:** T-THRESH-01 through T-THRESH-14

---

### INVAR-09: Zero Interrupts Same-Side Sequences

A z-score of exactly 0 is classified as "zero" (not positive, not negative) and interrupts any same-side sequential rule (4_1s, 8x, 10x).

- **Function:** `sideOf(z)` → "zero" when z === 0
- **Tests:** T-SIDE-03, T-41S-03, T-8X-05, T-10X-04

---

### INVAR-10: 1_2s is a WARNING, Never a Rejection

The 1_2s rule always produces `status: "warning"`. It is never a rejection criterion in this engine, regardless of context.

- **Function:** `detect12s`
- **Tests:** T-12S-01 through T-12S-06

---

### INVAR-11: 1_3s — Single Observation Beyond ±3 SD

Fires when a single z-score strictly exceeds ±3 SD. Status: rejection.

- **Function:** `detect13s`
- **Tests:** T-13S-01 through T-13S-06

---

### INVAR-12: 2_2s — Same-Side Only, Two Configurations

Fires when two observations both exceed the same side of ±2 SD. Two supported configurations: (A) within one run across materials; (B) same material across two consecutive runs. Opposite-side pairs never trigger 2_2s.

- **Function:** `detect22s`
- **Tests:** T-22S-01 through T-22S-07

---

### INVAR-13: R_4s — Within-Run Only (Critical Invariant)

R_4s evaluates only observations within the same analytical run. One result > +2 SD AND another result < -2 SD within the same run. Cross-run R_4s is deliberately NOT implemented.

- **Function:** `detectR4s`
- **Tests:** T-R4S-01 through T-R4S-08 (including explicit cross-run regression tests)

---

### INVAR-14: 4_1s — Four Consecutive Same-Side (>±1 SD)

Two configurations: (A) same material, 4 consecutive runs; (B) both materials, 2 consecutive runs (4 points). Zero or opposite-side value interrupts sequence. Boundary z=±1.0 does not qualify.

- **Function:** `detect41s`
- **Tests:** T-41S-01 through T-41S-08

---

### INVAR-15: 8x — Distinct from 10x (Critical Invariant)

8x is a separately implemented rule (v0.3.1) requiring 8 consecutive same-side observations (no magnitude threshold). It is NOT implemented by calling 10x with a different label. Two configurations: (A) same material, 8 runs; (B) both materials, 4 runs.

- **Function:** `detect8x` (separate function from `detect10x`)
- **Tests:** T-8X-01 through T-8X-07, T-DIST-01 through T-DIST-04

---

### INVAR-16: 10x — Ten Consecutive Same-Side

10x requires 10 consecutive same-side observations (no magnitude threshold). Two configurations: (A) same material, 10 runs; (B) both materials, 5 runs. Zero or side-change interrupts.

- **Function:** `detect10x`
- **Tests:** T-10X-01 through T-10X-06

---

### INVAR-17: 8x NOT in RULE_ORDER

`RULE_ORDER` contains the 6 rules taught together since v0.2. 8x is evaluated separately via `RULE_DETECTORS["8x"]` or `evaluateRuleSet(runs, ["8x"])`. This ensures that adding 8x does not change Inspect-Sequence or Rule-Detective regression behaviour.

- **Tests:** T-GEN-12, T-EVAL-04, T-EVAL-06

---

### INVAR-18: Insufficient Data Returns Empty Array

When runs are empty or there are insufficient observations for a rule's window, the detector returns `[]` — never a false positive.

- **Tests:** T-GEN-09, T-GEN-10, T-8X-04, T-10X-03, T-41S-05

---

### Stage 2 Test Summary

| Category | Count | Status |
|----------|-------|--------|
| Boundary/threshold tests | 17 | ✅ pass |
| General/structural tests | 13 | ✅ pass |
| 1_2s tests | 6 | ✅ pass |
| 1_3s tests | 6 | ✅ pass |
| 2_2s tests | 7 | ✅ pass |
| R_4s tests (incl. cross-run regression) | 8 | ✅ pass |
| 4_1s tests | 8 | ✅ pass |
| 8x tests | 7 | ✅ pass |
| 10x tests | 6 | ✅ pass |
| Rule distinction (8x≠10x) | 4 | ✅ pass |
| evaluateRuleSet integration | 14 | ✅ pass |
| Multi-level / edge cases | 6 | ✅ pass |
| **Total Stage 2** | **102** | **✅ all pass** |

**Directly recovered rule fixtures:** None found in HTML (no distinct rule fixture block analogous to the statistics VALIDATION_FIXTURES). All Stage 2 tests are **Class B — reconstructed scientific regression tests**.

---

## Stage 3A — Operating Characteristics (Ped / Pfr)

**Source module:** `src/opchar/functions.js`
**Provenance:** Class A — directly recovered from `recovery/original-v0.8.html` (lines ~4155–4282)

---

### INVAR-19: Numerical Scope Restricted to Pure 1_3s Only

Validated numerical Ped/Pfr calculations are implemented **only** for the single 1_3s rule applied on its own to N independent control measurements. All other rule configurations (multirule, 8x alone, 10x alone, or any combination) return `{ supported: false, validated: false }`.

- **Dispatcher:** `operatingCharacteristic(ruleIds, N, deltaSE)`
- **Direct function:** `operatingCharacteristic13s(N, deltaSE)`
- **Tests:** T-DISP-01 through T-DISP-14

---

### INVAR-20: Ped Definition (Recovered)

Ped = probability of error detection for the 1_3s rule applied independently to N control measurements, given a systematic shift of `deltaSE` SD units: at least one of N independent results exceeds ±3 SD.

```
Ped = 1 - (1 - pedSingle1_3s(deltaSE))^N
pedSingle1_3s(deltaSE) = P(X > 3) + P(X < -3)  for X ~ N(deltaSE, 1)
```

- **Functions:** `ped1_3s`, `pedSingle1_3s`
- **Tests:** T-PED-01 through T-PED-10, FIXTURE-PED-01 through FIXTURE-PED-04

---

### INVAR-21: Pfr Definition (Recovered)

Pfr = probability that a stable (in-control) process produces at least one result beyond ±3 SD among N independent control measurements.

```
Pfr = 1 - (2*Phi(3) - 1)^N
pfr1_3sSingle() = 1 - (2*normalCDF(3) - 1)  ≈ 0.0027
```

- **Functions:** `pfr1_3s`, `pfr1_3sSingle`
- **Tests:** T-PFR-01 through T-PFR-06

---

### INVAR-22: Two-Sided Rule — Symmetric Detection

Because 1_3s is a two-sided rule (detects exceedance of either +3 SD or -3 SD), `pedSingle1_3s(deltaSE)` is symmetric: `pedSingle1_3s(+x) = pedSingle1_3s(-x)` for any x. The implementation computes both tails explicitly.

- **Tests:** T-PED-04, T-PED-05

---

### INVAR-23: N = QC Measurements Per Analytical Run

N is the number of independent QC measurements available at a single QC event/run. It must not be confused with R (consecutive runs), M (patient samples per run), or PBRTQC window size W.

The `operatingCharacteristic` dispatcher guard: `typeof N === "number" && N > 0`.
When N ≤ 0 with a valid rule: dispatcher returns `unsupportedOperatingCharacteristic()`, not null.
When N ≤ 0 called directly to `operatingCharacteristic13s`: returns null.

- **Tests:** T-N-01 through T-N-06, T-DISP-11, T-DISP-12

---

### INVAR-24: No Multirule Probability Combination

The implementation never adds individual rule probabilities together, multiplies them as though statistically independent, or infers Ped/Pfr from Sigma alone for any multirule procedure.

Exact unsupported note (from HTML, verbatim): **"Numerical operating-characteristic calculation is not implemented for this multirule procedure in the current version."**

- **Tests:** T-UNS-01 through T-UNS-05, T-DISP-02 through T-DISP-10

---

### INVAR-25: erf Approximation — Abramowitz & Stegun 7.1.26

The error function uses the A&S 7.1.26 rational approximation (`|error| ≤ 1.5e-7`). At extreme inputs (|x| ≥ ~10), the approximation returns exactly ±1, and `normalCDF(±10)` returns exactly 0 or 1.

- **Tests:** T-ERF-01 through T-ERF-06, T-CDF-01 through T-CDF-08

---

### Stage 3A Directly Recovered Fixtures

| Fixture | Source | Value | Status |
|---------|--------|-------|--------|
| `normalCDF(0) = 0.5` | HTML line 4164 (comment) | 0.5 exactly | ✅ pass |
| `normalCDF(3) = 0.99865` | HTML line 4164 (comment) | within 0.00001 | ✅ pass |
| `ped1_3s(3.000, 1) ≈ 0.50` | HTML CHANGE_PED preset | within 0.001 | ✅ pass |
| `ped1_3s(3.674, 1) ≈ 0.75` | HTML CHANGE_PED preset | within 0.001 | ✅ pass |
| `ped1_3s(4.282, 1) ≈ 0.90` | HTML CHANGE_PED preset | within 0.001 | ✅ pass |
| `ped1_3s(5.326, 1) ≈ 0.99` | HTML CHANGE_PED preset | within 0.001 | ✅ pass |

**Total Stage 3A tests:** 76 / 76 passed  
**Directly recovered fixtures:** 6 / 6  
**Reconstructed tests (Class B):** 70

---

## Stage 3B — QC Strategy Core

**Source modules:**
- `src/strategy/core.js` — APS framework, procedure library, Sigma mapping, challenge bank
**Provenance:** Class A — directly recovered from `recovery/original-v0.8.html` (lines ~4052–4090, ~4284–4676)
**Architectural note:** `strategy/core.js` is a static strategy scientific/data module and contains no independent Sigma or Ped/Pfr calculation, and no `require`/`import` of any other module. Cross-engine recovery tests verify compatibility with the canonical recovered statistics (`src/core/statistics.js`) and operating-characteristic (`src/opchar/functions.js`) engines. Application/UI integration will later use those canonical engines rather than duplicate their calculations.

---

### INVAR-26: QC Rule ≠ QC Strategy

A QC strategy describes the full procedure configuration: rule set, N (measurements per run), R (consecutive runs), control levels, and their interaction. Selecting a statistical rule set is one component — it does not define the strategy on its own.

- **Tests:** T-PROC-* series, T-PROCC/D-* series

---

### INVAR-27: APS Framework — Three Milan Models, No Universal Hierarchy

Three Milan Models are defined:
1. Clinical outcome
2. Biological variation
3. State of the art

They are not a simple ranked hierarchy. Which model is appropriate depends on the measurand, clinical use, available evidence, and context. TEa used in the simplified Sigma calculation is not presented as the universal definition of APS.

- **Source:** `MILAN_MODELS`, `MILAN_HIERARCHY_CAUTION`, `OTHER_SPEC_SOURCES`
- **Tests:** T-APS-01 through T-APS-11

---

### INVAR-28: N = Measurements Per Run (Strategy Layer)

N in the procedure library is the number of control measurements AVAILABLE PER ANALYTICAL RUN. It is never the total accumulated across R runs. The derived quantity N×R is computed by `sequentialObservationCapacity()` and never stored as N.

- **Source:** `makeProcedure`, `sequentialObservationCapacity`, spec v0.3.2 section 5
- **Tests:** T-NR-NOSTORE-*, T-NR-GUARD-*

---

### INVAR-29: R = Consecutive Runs for Sequential-Rule Evaluation

R is the number of consecutive analytical runs whose observations participate in evaluation of a sequential rule. It is independent of N.

- **Tests:** T-PROCC-03, T-PROCD-03

---

### INVAR-30: Procedure C — N=2, R=2, capacity=4

Procedure C (1₃s/2₂s/R₄s/4₁s): N=2, R=2, sequential capacity=4. Does not include 8x or 10x.

- **Tests:** T-PROCC-01 through T-PROCC-10, FIXTURE-C03-MAP

---

### INVAR-31: Procedure D — N=2, R=4, capacity=8, uses 8x not 10x

Procedure D (1₃s/2₂s/R₄s/4₁s/8x): N=2, R=4, sequential capacity=8. Uses the dedicated 8x detector — 10x is NOT substituted. This is the Sigma-framework's <4-Sigma mapping.

- **Tests:** T-PROCD-01 through T-PROCD-10, FIXTURE-C04-MAP, FIXTURE-C09-MAP

---

### INVAR-32: Alternative 8x Configuration (N=4, R=2) — Documented, Not Implemented

The HTML explicitly describes N=4,R=2 as an alternative 8x configuration yielding N×R=8. It is documented in Procedure D provenance and `N_AND_R_TEACHING_NOTE` but NOT implemented as a separate library procedure. N=2/R=4 and N=4/R=2 are not operationally identical.

- **Tests:** T-ALT-01 through T-ALT-05

---

### INVAR-33: Sigma Mapping — Named Framework, Inclusive Boundaries, Not Universal

One framework is implemented: "Simplified published Sigma Rules educational framework" (Westgard QC). Band boundaries use inclusive lower bounds (≥) as this application's own implementation convention. Every mapping is labelled as belonging to this specific framework — never as a universal rule.

| Band | Procedure |
|------|-----------|
| Sigma ≥ 6 | A |
| 5 ≤ Sigma < 6 | B |
| 4 ≤ Sigma < 5 | C |
| Sigma < 4 | D |

- **Tests:** T-MAP-BOUND-*, T-MAP-BELOW-*, T-MAP-MID-*, T-MAP-INV-*

---

### INVAR-34: Multirule Procedures — No Numerical Opchar in Strategy Layer

The strategy layer calls `operatingCharacteristic()` from `src/opchar/functions.js`. Procedures B, C, D (multirule) return `{supported:false}`. The strategy layer never independently calculates or approximates multirule Ped/Pfr.

- **Tests:** T-OCI-01 through T-OCI-10X, T-OCI-NOTE

---

### Stage 3B Test Summary (provenance accounting corrected)

Provenance corrected from initial draft; see tests/stage3b-strategy.test.js.

Total: **158 tests** composed of:
- **12 source-grounded** (Class A authority): FIXTURE-CXX-MAP (10) + case10 null structure (2) — use HTML-encoded correctProcedureIds as authority
- **10 reconstructed Sigma expectations** (Class B): FIXTURE-CXX-SIGMA — independently computed from (TEa−|Bias|)/CV and hard-coded
- **136 other reconstructed tests** (Class B): all remaining sections

| Section | Count | Provenance | Status |
|---------|-------|-----------|--------|
| MAP assertions + case10 (source-grounded) | 12 | Source-grounded | ✅ pass |
| SIGMA assertions (reconstructed expectations) | 10 | Reconstructed | ✅ pass |
| APS framework | 11 | Reconstructed | ✅ pass |
| Sigma mapping (fixed inputs) | 21 | Reconstructed | ✅ pass |
| Procedure library structure | 18 | Reconstructed | ✅ pass |
| Procedure C mandatory check | 10 | Reconstructed | ✅ pass |
| Procedure D mandatory check | 10 | Reconstructed | ✅ pass |
| Alternative 8x config | 5 | Reconstructed | ✅ pass |
| N/R semantics | 5 | Reconstructed | ✅ pass |
| Opchar integration | 12 | Reconstructed | ✅ pass |
| Challenge bank structure | 17 | Reconstructed | ✅ pass |
| Cross-engine smoke | 3 | Reconstructed | ✅ pass |
| Doctrine notes | 4 | Reconstructed | ✅ pass |
| **Total** | **158** | **12 source-grounded / 146 reconstructed** | **✅ all pass** |

---

## Stage 4A — Detection-Delay Engine

**Source module:** `src/risk/detection-delay.js`
**Provenance:** Class A — directly recovered from `recovery/original-v0.8.html` (lines ~5340–5495)
**Architectural note:** This module is a static calculation layer with no `require`/`import` of other modules. Application/UI integration will supply `p` from `src/opchar/functions.js` rather than this module duplicating the Ped equation.

---

### INVAR-35: Numerical Delay Support Restricted to Pure 1_3s Only

Detection-delay modelling is numerically supported only for the exact single-rule case `["13s"]`. All other rule sets (multirule, 8x alone, 10x alone, etc.) return `{supported: false}`.

- **Functions:** `isDetectionDelaySupportedRuleSet`, `detectionDelaySupportForRuleIds`
- **Note text (verbatim from HTML):** "Numerical detection-delay modelling is not implemented for this multirule procedure in the current version."
- **Tests:** T-SUP-01 through T-SUP-10

---

### INVAR-36: Geometric Expected Detection Delay = 1/p

Expected number of QC events until first detection = 1/p (geometric distribution expectation for Bernoulli(p) trials). Guard: 0 < p ≤ 1; p=0 returns `{supported:false}` (no finite expectation).

```
expectedQcEventsToDetectionGeometric(p) = 1/p
```

- **Function:** `expectedQcEventsToDetectionGeometric`
- **Tests:** T-FVAL-GEO-01 through T-FVAL-GEO-04, T-GUARD-GEO-01 through T-GUARD-GEO-05

---

### INVAR-37: Immediate-Onset Patient Exposure = M/p

Expected patient samples exposed before detection, assuming failure begins immediately after a successful QC event (Mode A, near-worst-case).

```
expectedPatientExposureImmediateOnset(M, p) = M / p
```

- **Function:** `expectedPatientExposureImmediateOnset`
- **Tests:** T-FVAL-IMM-01 through T-FVAL-IMM-03

---

### INVAR-38: Uniform-Onset Patient Exposure = M/2 + M*(1−p)/p

Educational expected exposure assuming failure onset uniformly distributed within the QC interval (Mode B). Algebraically equivalent to M*(1/p − 1/2).

```
expectedPatientExposureUniformOnset(M, p) = M/2 + M*(1-p)/p
                                           = M*(1/p - 1/2)
```

- **Function:** `expectedPatientExposureUniformOnset`
- **Tests:** T-FVAL-UNI-01 through T-FVAL-UNI-04

---

### INVAR-39: This Is NOT Parvin MaxE(Nuf)

The geometric model is explicitly distinguished from Parvin's MaxE(Nuf). The model name, provenance string, assumptions, and limitations all carry explicit statements to this effect. The module never calculates MaxE(Nuf) or any probability of patient harm.

- **Tests:** T-DIST-01 through T-DIST-06

---

### INVAR-40: M = Patient Samples Between QC Events

M is the number of patient samples processed between successive QC events. It is distinct from N (QC measurements per run), R (consecutive runs), and W (PBRTQC window size).

- **Tests:** T-M-01 through T-M-03

---

### INVAR-41: Exposure Result Is Patient-Sample Count, Not Clinical Harm

The output of the exposure calculations is labelled `units: "patient samples"` — the count of samples potentially processed while out of control. It does not equal the count of unacceptable results or any measure of clinical harm.

- **Tests:** T-BEH-07

---

### Stage 4A Directly Recovered Fixtures

None — the HTML encodes the equations and assumptions verbatim, but contains no distinct numeric output table analogous to the opchar CHANGE_PED presets. All 75 Stage 4A tests are Class B (reconstructed from the recovered equations).

**Total Stage 4A tests:** 75 / 75 passed

---

## Stage 4B — Risk & Frequency Teaching Data

**Source module:** `src/risk/data.js`
**Provenance:** Class A — directly recovered from `recovery/original-v0.8.html` (lines ~5499–5870)
**Architectural note:** `data.js` is a static teaching/data module with no `require`/`import` and no calculation functions. All computation lives in `src/opchar/functions.js` and `src/risk/detection-delay.js`. Confirmed: no erf/normalCDF/Ped/Pfr/geometric equations duplicated.

---

### INVAR-42: QC Procedure / Event / Frequency / Run Are Distinct

Four separately defined concepts with mandatory "do not imply" cautions:
1. Run ≠ calendar day or shift
2. Run size ≠ N (QC measurements per event)
3. QC frequency ≠ R (sequential rule look-back)

- **Source:** `QC_PROCEDURE_DEFINITION`, `QC_EVENT_DEFINITION`, `QC_FREQUENCY_DEFINITION`, `ANALYTICAL_RUN_V4_DEFINITION`, `CORE_DISTINCTION_CAUTIONS`
- **Tests:** T-DEF-01 through T-DEF-08, T-RUN-01, T-RUN-02

---

### INVAR-43: N / R / M Are Separately Defined and Non-Derivable

N = QC measurements per event; R = consecutive runs for sequential rule look-back; M = patient samples between QC events. None can be derived from either of the others. Changing M does not change N or R, and vice versa.

- **Source:** `N_LABEL`, `R_LABEL`, `M_LABEL`, `N_R_M_DISTINCTION_NOTE`
- **Tests:** T-NRM-01 through T-NRM-10

---

### INVAR-44: Startup QC Does Not Eliminate Monitoring Need

A successful startup QC event does not eliminate the need for monitoring QC during ongoing production. No universal timing is prescribed.

- **Source:** `STARTUP_VS_MONITORING_NOTE`
- **Tests:** T-STARTUP-01 through T-STARTUP-05

---

### INVAR-45: Bracketed QC Does Not Auto-Invalidate All Results

A failed bracket does not automatically mean every specimen within it is invalid, nor does it mean none are. Investigation determines scope.

- **Source:** `BRACKETED_QC_NOTE`, `OUT_OF_CONTROL_EVENT_PREVIEW`
- **Tests:** T-BRKT-01 through T-BRKT-05

---

### INVAR-46: More QC Is Not Always Better

More frequent QC has operational costs (control material, capacity, false rejection). The objective is appropriate frequency, not maximal frequency.

- **Source:** `MORE_QC_NOT_ALWAYS_BETTER_NOTE`
- **Tests:** T-MQCN-01 through T-MQCN-03

---

### INVAR-47: High Sigma Does Not Make QC Frequency Irrelevant

Analytical capability alone does not remove the need for appropriate surveillance interval. A high-Sigma method can still develop a sudden problem.

- **Source:** `HIGH_SIGMA_FREQUENCY_MISCONCEPTION_NOTE`
- **Tests:** T-HSMIS-01 through T-HSMIS-03

---

### INVAR-48: Patient Exposure ≠ Clinical Harm

Patient samples exposed = process concept (count of specimens tested while out of control). Unacceptable final patient results = a patient-risk model output. These must not be used interchangeably.

- **Source:** `PATIENT_SAMPLES_EXPOSED_DEFINITION`, `UNACCEPTABLE_RESULTS_DEFINITION`, `RISK_MODEL_LIMITATION_NOTE`
- **Tests:** T-HARM-01 through T-HARM-05

---

### INVAR-49: MaxE(Nuf) Not Numerically Implemented

MaxE(Nuf) is introduced conceptually only. Full numerical calculation is intentionally not implemented — preferable to a fabricated calculator. Parvin's framework is not presented as the only patient-risk model.

- **Source:** `MAXE_NUF_BOUNDARY_NOTE`, `MAXE_NUF_NOT_ONLY_FRAMEWORK_NOTE`, `MAXE_GOAL_NOTE`
- **Tests:** T-MAXE-01 through T-MAXE-08

---

### Stage 4B Challenge Bank

10 deterministic Frequency Challenge Cases (IDs 1–10). Artifact provenance: Class A. Test expectation provenance: source-grounded (correctWhatChanged, correctLikelyEffect, misconceptionFlag).

| Case | correctWhatChanged | correctLikelyEffect | misconceptionFlag |
|------|--------------------|---------------------|-------------------|
| 1 | m | exposure | — |
| 2 | m | exposure | high-sigma-frequency |
| 3 | m | exposure | — |
| 4 | n | detection | n-vs-m |
| 5 | r | insufficient | r-vs-m |
| 6 | m | exposure | startup-sufficiency |
| 7 | m | exposure | — |
| 8 | m | exposure | high-sigma-frequency |
| 9 | m | exposure | frequency-fixes-performance |
| 10 | insufficient | insufficient | — |

**Total Stage 4B tests:** 143 / 143 passed

---

## Stage 5A — Investigation Lab Calc Engine

**Source module:** `src/investigation/calc.js`
**Provenance:** Class A — directly recovered from `recovery/original-v0.8.html` (lines ~6536–6683)
**Architectural note:** Pure calc/status-model helpers only. No React, no scenario content, no automated root-cause inference, no causal-interval inference engine. All reasoning is scenario-authored.

---

### INVAR-50: No Automated Root-Cause Diagnosis

This module deliberately does NOT implement automated root-cause diagnosis, scoring, Bayesian inference, or causal-interval inference. Reasoning is scenario-authored, not computed.

- **Source:** HTML spec comments, sections 18, 29, 66
- **Tests:** T-S9-NORC-*, T-S9-NOCAUSAL, T-S9-NONOTIFY

---

### INVAR-51: No "confirmed" CauseStatus or "harmed"/"invalid" PatientImpactStatus

`CAUSE_STATUSES` contains no "confirmed" value. `PATIENT_IMPACT_STATUSES` and `PATIENT_RESULT_CATEGORIES` contain no "harmed" or "invalid" values. These are deliberate omissions per spec section 4.

- **Source:** Status array literals in HTML
- **Tests:** T-S1-PS-08, T-S1-CS-04, T-S1-PIS-02/03, T-S1-PRC-05, T-S1-RDS-05

---

### INVAR-52: Process Recovery and Result Disposition Are Decoupled

`initialResultDispositionStatus(withinCandidateWindow)` takes exactly one argument — the candidate window boolean — never ProcessStatus. This ensures "process recovered" and "result disposition" are never coupled by a shared computation path.

- Inside candidate window → "review-required" (spec Test 4)
- Outside candidate window → "routine-release" (spec Test 3; never held regardless of investigation status)
- Never auto-produces "amendment-or-reissue-being-considered" (scenario-authored only)

- **Tests:** T-S2-TEST3, T-S2-TEST4, T-S2-NOESCAPE, T-S2-NOPROCESS

---

### INVAR-53: QC Signal Is Never Silently Upgraded

`deriveQcSignalStatus(signalType)`: "warning" → "warning" (never upgraded to "rejection-signal"); absent/unknown → "none" (never upgraded). Per spec section 90, Test D.

- **Tests:** T-S4-TESTD-01 through T-S4-TESTD-06, T-S4-CRIT-01

---

### INVAR-54: Patient-Result Calculations Are Not Auto-Correct

`autoCorrectPatientResult()` always returns `{supported: false, value: null}` — the only function related to "correcting" a patient result, and it always refuses. Per spec section 98.

`absoluteDifference(original, postRecovery) = postRecovery - original`
`relativeDifferencePercent(original, postRecovery) = (postRecovery - original) / original × 100`

Zero denominator in relative difference → `{supported: false}` (never Infinity or silent NaN).

- **Tests:** T-S7-ACR-01 through T-S7-ACR-06, T-S5-*, T-S6-*

---

### INVAR-55: Evidence Gating Is Forward-Only

`isVisibleAtStage(revealStage, currentStage)` returns true only when `stageIndex(revealStage) ≤ stageIndex(currentStage)`. Evidence from later stages never leaks into earlier ones. Per spec sections 68–69, 93.

- **Tests:** T-S3-VIS-*, T-S10-*

---

### INVAR-56: Candidate Window Is Inclusive of Start and End, Exclusive of Strictly Before

`isWithinCandidateWindow(timestamp, windowStart, windowEnd)` uses lexicographic comparison of "HH:MM" strings (safe for same-day zero-padded 24h strings). Results strictly before windowStart are never included. Per spec sections 27–28, 95.

**Format limitation (recovered implementation):** Non-string inputs return false (guarded by `typeof`). String inputs are assumed to be valid zero-padded same-day 24-hour HH:MM values — format validation is not implemented. Malformed strings that are nonetheless `typeof string` (e.g. "99:99", "abc") are not caught. This is a recovered limitation of the v0.8 implementation.

- **Tests:** T-S8-WIN-01 through T-S8-WIN-11

---

### Stage 5A Test Provenance

Test file (`tests/stage5a-investigation-calc.test.js`): Artifact **Class D** (recovery infrastructure — not a historical test file).

Test expectation provenance (audited assertion-by-assertion):
- **Source-grounded expectations: 80 / 118** — expected value, mapping, status, return structure, omission, or behaviour explicitly encoded in HTML source. Includes: enum array literals (S1: 29), named spec Tests 3 and 4 (S2: 2), reasoning-stage array and visibility semantics (S3: 18), the three explicit `deriveQcSignalStatus` branches (S4: 3), formula values and units fields (S5: 4, S6: 6), `autoCorrectPatientResult` return shape and reason strings (S7: 5), core window semantics `>=`/`<=` (S8: 5), deliberate-omission invariants from HTML spec comment (S9: 8).
- **Reconstructed expectations: 38 / 118** — boundary, negative, structural, and cross-check expectations written during recovery. Includes structural consequences of spec tests (S2: 3), guard inputs chosen during recovery (S4: 4, S5: 6, S6: 4, S7: 1, S8: 6), and exhaustive loop-generated stage-ordering checks (S10: 14).

**Candidate-window format limitation:** `isWithinCandidateWindow()` performs lexicographic string comparison. String inputs are assumed to be valid zero-padded same-day 24-hour HH:MM values. Format validation is **not** implemented in the recovered v0.8 function — malformed strings that pass the `typeof` check are not rejected. This is a recovered implementation limitation, not a reason to modify the source.

**Total Stage 5A tests:** 118 / 118 passed

---

## Stage 5B — Investigation Lab Static Data and Scenario Bank

**Source module:** `src/investigation/data.js`
**Provenance:** Class A — directly recovered from `recovery/original-v0.8.html` (lines 6684–7447)
**Architectural note:** Static data/teaching module only. No `require`/`import`. Exactly one function exported (`hypothesisLabel`). No Bayesian, PBRTQC, root-cause, auto-correction, auto-amendment, or auto-notification code.

---

### INVAR-57: QC Signal ≠ Proven Process Departure (Investigation Banner)

Core banner: *"A QC signal is not a root cause."* Four explicit separations: QC signal detected → analytical mechanism established → all patient results invalid → clinical harm established. False rejection is explicitly possible; signal is not proof of departure from stability.

- **Source:** `CORE_BANNER_TITLE`, `CORE_BANNER_SEPARATIONS`, `SIGNAL_VS_CONDITION_CAUTION`
- **Tests:** C-01 through C-06

---

### INVAR-58: Repeat-Until-Pass Is Not Sound

Repeating QC solely until a result falls inside limits is not sound analytical reasoning. A passing repeat provides new evidence but does not retrospectively erase the original signal.

- **Source:** `REPEAT_QC_PRINCIPLE_NOTE`, `REPEAT_QC_EXERCISE`, `TARGETED_REPEAT_VS_REPEAT_UNTIL_PASS`
- **Tests:** C-07, C-08, C-09

---

### INVAR-59: No Quantitative Causal Certainty

This application never fabricates quantitative certainty for a hypothesis — no causal percentages, no AI causal score, no Bayesian likelihood ratio, no weighted root-cause ranking.

- **Source:** `NO_QUANTITATIVE_CERTAINTY_NOTE`
- **Tests:** C-13, C-14, C-15

---

### INVAR-60: Three-Layer Patient Model Not Collapsed

Layer 1 (exposure) ≠ Layer 2 (analytical effect) ≠ Layer 3 (clinical consequence). Exposure does not prove effect; effect does not prove harm.

- **Source:** `THREE_LAYER_MODEL`, `THREE_LAYER_CAUTION`, `CLINICAL_SIGNIFICANCE_GUARDRAIL`
- **Tests:** C-18, C-19, C-20

---

### INVAR-61: Process Recovery ≠ Historical Result Disposition (Investigation)

The two timelines — current process recovery and historical result review — must not be collapsed. A recovered analyser does not automatically mean all held results are released. Case 5 is the critical independence fixture.

- **Source:** `CORE_DISTINCTION_RECOVERY_VS_DISPOSITION`, `PROCESS_RECOVERY_VS_RESULT_RELEASE_GUARDRAIL_NOTE`, `TWO_QUESTION_RECOVERY_NOTE`, `TWO_TIMELINE_EXPLANATION_NOTE`
- **Scenario fixture:** Case 5 — ProcessStatus=recovered, ResultDispositionStatus=review-required simultaneously
- **Tests:** C-21 through C-24, F-C5-01 through F-C5-05

---

### INVAR-62: No Automatic Patient Correction, Amendment, or Notification

`NO_AUTO_CORRECTION_NOTE`, `NO_AUTO_AMENDMENT_NOTE`, `NO_AUTO_NOTIFICATION_NOTE` are all present and substantive. No function in this module implements any of these.

- **Tests:** C-25, C-26, C-27, A-07, A-08, A-09

---

### INVAR-63: Recovery Challenge Bank — 13 Scenarios, Fixed Schema

13 deterministic scenarios, IDs 1–13. Each has: id, title, qcData, candidateHypothesisIds, evidenceItems, progressionByStage, finalInterpretation, correctResumeDecision, correctResultDispositionDecision. No scenario has `supportedHypothesisId = "confirmed"`.

Critical case regressions:
- Case 5: ProcessStatus=recovered AND ResultDispositionStatus=review-required (independence invariant)
- Case 6: passing repeat does NOT auto-close; supportedHypothesisId=instrument (late evidence)
- Case 7: supportedHypothesisId=null, CauseStatus=unresolved, ProcessStatus=apparently-stable
- Case 10: window start=10:30, end=12:00; patientImpactStatus=analytical-impact-evidence-present; 4 patient records
- Case 11: supportedHypothesisId=null, all statuses unresolved/indeterminate; recoveryEvidence empty
- Case 12: qc-material, no-impact-demonstrated, correctResultDispositionDecision=yes (no indiscriminate retesting)
- Case 13: shift precedes lot change; supportedHypothesisId=null; correctResumeDecision=no

---

### Stage 5B Test Provenance

Test file: Artifact **Class D** (recovery infrastructure)

Source-grounded expectations: **147 / 371**
Reconstructed expectations: **224 / 371**
Total Stage 5B: **371 / 371** passed

---

## Stage 6A — External Assurance Lab Calc Engine

**Source module:** `src/eqa/calc.js`
**Provenance:** Class A — directly recovered from `recovery/original-v0.8.html` (lines 8368–8670)
**Architectural note:** Pure calc/status-model module. 17 exports, 6 functions (`calculateEqaAbsoluteDeviation`, `calculateEqaRelativeDeviation`, `calculateEqaZScore`, `calculatePairedDifference`, `calculatePairedRelativeDifference`, `describeSchemeCapability`). No React, no scenario content, no Miller Category classifier, no Passing-Bablok, Deming regression, or Bland-Altman implementation, no automatic patient-result action, no root-cause engine.

---

### INVAR-64: Target-Value Types Are Not All "The True Value"

7 distinct target-value types. Each answers a different question. A peer-group mean is not automatically reference truth.

- **Source:** `TARGET_VALUE_TYPES`, `TARGET_VALUE_TYPE_LABELS`
- **Tests:** B-01 through B-07

---

### INVAR-65: commutability-not-established ≠ noncommutable

Unknown commutability must never be silently treated as demonstrated failure. `describeSchemeCapability` produces different limitation text for the two states.

- **Source:** `COMMUTABILITY_STATUSES` (4 values), spec sections 10–12
- **Tests:** C-01 through C-10

---

### INVAR-66: Current EQA Status ≠ Longitudinal EQA Status

`CURRENT_EQA_STATUSES` (4 values) describes this round's result vs criterion. `LONGITUDINAL_EQA_STATUSES` (8 values) describes a multi-round authored pattern. One round's status must never silently overwrite the longitudinal state.

- **Tests:** D-01 through D-09

---

### INVAR-67: Signed EQA Deviation Calculations

`calculateEqaAbsoluteDeviation = participant - assigned` (signed).
`calculateEqaRelativeDeviation = (participant - assigned) / assigned × 100` (signed).
Assigned value = 0 → unsupported (no Infinity/NaN). Non-finite inputs → structured unsupported.

- **Tests:** F-01 through F-09, G-01 through G-10

---

### INVAR-68: SDPA > 0 Required for Z-Score

`calculateEqaZScore = (participant - assigned) / SDPA`. SDPA = 0 or SDPA < 0 → structured unsupported. Non-finite inputs → structured unsupported.

- **Tests:** H-01 through H-11

---

### INVAR-69: Illustrative Z-Score Bands Are Not Universal Pass/Fail

3 bands (`|z| ≤ 2`, `2 < |z| ≤ 3`, `|z| > 3`), all labelled "Illustrative". `ILLUSTRATIVE_ZSCORE_BANDS_CAUTION` explicitly states: "not a universal laboratory pass/fail rule." Provider-specific criteria always take precedence.

- **Tests:** I-01 through I-08

---

### INVAR-70: Paired Difference Direction = B − A

`calculatePairedDifference = resultB - resultA`. Analyzer A is "designated comparator for this teaching exercise" — NOT automatically "reference method".
`calculatePairedRelativeDifference = (B - A) / A × 100`. A = 0 → unsupported.

- **Tests:** J-01 through J-08, K-01 through K-09

---

### INVAR-71: describeSchemeCapability — Qualitative Only, No Miller Category

Returns qualitative statements and limitations from scheme's own stated properties. Booleans: `canAssessHarmonisation` (requires commutabilityVerified AND higherOrderTargetAvailable AND methodGroupsDefined), `canAssessMethodPerformance` (methodGroupsDefined AND (higherOrder OR perfSpec)), `canAssessParticipantPerformance` (any one of the three). Null/undefined = "not stated". No category number or capability score.

- **Tests:** L-01 through L-27

---

### Stage 6A Test Provenance

Test file: Artifact **Class D** (recovery infrastructure)

Source-grounded expectations: **89 / 139**
Reconstructed expectations: **50 / 139**
Total Stage 6A: **139 / 139** passed

---

## Stage 6B — External Assurance Lab Static Data and Challenge Bank

**Source module:** `src/eqa/data.js`
**Provenance:** Class A — directly recovered from `recovery/original-v0.8.html` (lines 8671–9545)
**Architectural note:** Static data/teaching module. 76 exports, 0 functions. Contains the deterministic 14-case External Assurance Challenge Bank (`EXTERNAL_ASSURANCE_CASES`). No React/UI, no calc-engine duplication, no advanced method-comparison implementation, no automatic EQA trend classifier, no root-cause engine, and no automatic patient-result impact engine.

---

### INVAR-72: Stable IQC Does Not Prove Trueness

`GOOD_IQC_DOES_NOT_PROVE_TRUENESS_NOTE` explicitly states stable IQC ≠ proof of trueness. `SIGNATURE_MISCONCEPTION_CASE` demonstrates coexistence of stable IQC and persistent EQA bias (correct answer = "Yes." they can coexist).

- **Tests:** B-05, B-08, B-09

---

### INVAR-73: Poor EQA Does Not Automatically Prove Patient Bias

`POOR_EQA_DOES_NOT_AUTOMATICALLY_PROVE_BIAS_NOTE`, `NO_EQA_FAIL_EQUALS_PATIENT_RESULTS_WRONG_NOTE`. A poor EQA result is evidence requiring interpretation, not automatic proof of patient harm.

- **Tests:** B-06, I-02

---

### INVAR-74: EQA Is Periodic, Not Real-Time IQC

`EQA_NOT_REALTIME_IQC_NOTE` explicitly states EQA does not substitute for day-to-day IQC surveillance.

- **Tests:** B-10

---

### INVAR-75: Peer-Group Mean Is Not Automatically Reference Truth

`NEVER_ALL_CALLED_TRUE_VALUE_NOTE`, `PEER_GROUP_NOT_TRUTH_PRINCIPLE`, `NO_PEER_MEAN_EQUALS_REFERENCE_VALUE_NOTE`. Different target-value types answer different questions.

- **Tests:** C-01, C-02, I-03

---

### INVAR-76: commutability-not-established ≠ noncommutable (Stage 6B)

`UNKNOWN_NOT_EQUAL_FAILED_NOTE`, `COMMUTABILITY_STATUS_DESCRIPTIONS` — distinct description for "not established" versus "noncommutable". Case 5 is the critical fixture.

- **Tests:** D-07, D-08, M-C5-01, M-C5-02

---

### INVAR-77: No Automatic EQA Trend Root-Cause Diagnosis

`LONGITUDINAL_STATUSES_ARE_DESCRIPTIONS_NOTE`, `NO_AUTOMATIC_TREND_ROOT_CAUSE_NOTE`. Longitudinal patterns are authored descriptions, not automatically diagnosed causes.

- **Tests:** F-04, F-05

---

### INVAR-78: EQA Specimen Handling Integrity

`SAMPLE_HANDLING_INTEGRITY_NOTE`, `SAMPLE_HANDLING_DISCOURAGED`. EQA is not an examination to "pass" — specimens should be handled in routine fashion.

- **Tests:** G-04, G-05

---

### INVAR-79: QC Material vs Patient-Sample Comparability Distinction

`CONTROL_MATERIAL_TRAP_CASE`, `PATIENT_COMPARISON_TRAP_CASE`. Disagreement on QC material does not automatically prove patient-sample noncomparability; agreement does not automatically prove patient-sample comparability.

- **Tests:** H-13, H-14

---

### INVAR-80: No Automatic Patient-Result Impact from EQA

`NO_AUTO_PATIENT_IMPACT_FROM_EQA_NOTE`, `NO_AUTO_TRANSFER_BETWEEN_MODULES_NOTE`. EQA module never automatically generates patient-result disposition, root cause, or corrective action.

- **Tests:** I-05, I-06

---

### Stage 6B Challenge Bank

14 deterministic cases, IDs 1–14. Cross-module vocabulary integration verified for all 14 cases against Stage 6A status vocabularies.

Critical case regressions: Cases 1, 2, 3, 4, 5 (CRITICAL: commutability-not-established ≠ noncommutable), 6, 7, 8, 9, 10, 11, 12, 13, 14 — all source-grounded truth values verified.

---

### Stage 6B Test Provenance

Test file: Artifact **Class D** (recovery infrastructure)

Source-grounded expectations: **170 / 313**
Reconstructed expectations: **143 / 313**
Total Stage 6B: **313 / 313** passed

---

## Stage 7A — BV & RCV Lab Calculation Engine

**Source module:** `src/bv/calc.js`
**Provenance:** Class A — directly recovered from `recovery/original-v0.8.html` (lines 10405–10731)
**Architectural note:** Pure calc/enum module. 12 exports, 8 exported functions, 2 internal-only helpers (`isFiniteNonNegativeNumber`, `directionOf`). No React, no scenario bank, no BV estimation from raw data, no BIVAC scoring, no RI generation, no MU engine.

**Symbol discipline:** CVA = analytical CV; CVI = within-subject biological CV; CVG = between-subject biological CV. All inputs are percentage numbers (6 = 6%, not 0.06).

---

### INVAR-81: CVG Structurally Absent from RCV Functions

`calculateClassicalRcv(cva, cvi, zConventionId)` and `calculateLognormalRcv(cva, cvi, zConventionId)` each take exactly 3 arguments. CVG is structurally absent — it does not appear in either function's signature, implementation, or return value inputs field.

- **Tests:** A-05, A-06, G-07, H-08, M-03

---

### INVAR-82: Index of Individuality — II = CVI/CVG; CVG>0 Required

`calculateIndexOfIndividuality(cvi, cvg)`: II = CVI/CVG. CVG=0 → unsupported (strict >0 guard; prevents Infinity). Heuristic bands (inclusive boundaries): II<0.6 = marked; 0.6≤II≤1.4 = intermediate; II>1.4 = low.

- **Tests:** E-01 through E-16

---

### INVAR-83: CVG=0 and Missing-CVG Guard Distinctions — II vs APS

CVG=0 is **unsupported** for `calculateIndexOfIndividuality` (strict >0 required). CVG=0 is **usable** for `calculateBvAps` (`cvgAvailable=true`, ≥0 acceptable; bias = biasFactor × CVI remains finite). For CVI=5, CVG=0: optimum bias = 0.625 (hard-coded). These guards must not be harmonised.

**Missing CVG (undefined)** is distinct from CVG=0 in APS: `cvgAvailable=false`; imprecision supported (=1.25 for CVI=5); bias unsupported (null); optional TEa unsupported (null, disclosureOnly=true).

- **Tests:** E-09, F-07 through F-18

---

### INVAR-84: BV APS — Optimum/Desirable/Minimum Factors

Three levels with exact factors:
- Optimum: imprecisionFactor=0.25, biasFactor=0.125
- Desirable: imprecisionFactor=0.50, biasFactor=0.250
- Minimum: imprecisionFactor=0.75, biasFactor=0.375

Imprecision = factor × CVI (CVG not required). Bias = factor × √(CVI²+CVG²). Optional TEa = 1.65×imprecision + bias; `disclosureOnly=true`.

- **Tests:** C-01 through C-07, F-01 through F-13

---

### INVAR-85: Classical Symmetric RCV = z×√2×√(CVA²+CVI²)

Single symmetric threshold — same magnitude for increase and decrease. No CVG. Invalid or unknown z convention → structured unsupported result.

- **Tests:** G-01 through G-12

---

### INVAR-86: Log-Normal Asymmetric RCV — Distinct from Classical

CVT=√(CVA²+CVI²)/100; sigma=√(ln(1+CVT²)); k=z×√2×sigma; increase=(exp(k)−1)×100; decrease=(1−exp(−k))×100. Returns separate increase and decrease thresholds. No CVG. Asymmetric: increase≠decrease (for non-zero variation).

- **Tests:** H-01 through H-12

---

### INVAR-87: Z Conventions Are Explicit

`Z_CONVENTION_IDS`: `['bidirectional-95', 'unidirectional-95']`. z=1.96 (bidirectional) and z=1.645 (unidirectional) encoded exactly. Unknown convention → unsupported. Convention must not be inferred from change direction.

- **Tests:** B-01 through B-07

---

### INVAR-88: Strict RCV Exceedance Semantics

`EXCEEDANCE_EPSILON = 1e-9`. Strictly above threshold → exceeds=true. Exactly at threshold → exceeds=false. Below threshold → exceeds=false. Log-normal exceedance uses direction-specific threshold (increase uses increase RCV; decrease uses decrease RCV; no-change → exceeds=false).

- **Tests:** D-01, K-03, K-07, L-06, L-07

---

### INVAR-89: RCV Exceedance ≠ Clinical Significance

Exceedance results contain no clinical significance, diagnosis, disease progression, or therapeutic response fields. RCV is a statistical threshold; exceedance does not prove disease progression; non-exceedance does not prove clinical stability.

- **Tests:** M-06, M-07

---

### Stage 7A Test Provenance

Test file: Artifact **Class D** (recovery infrastructure)

Source-grounded expectations: **89 / 133**
Reconstructed expectations: **44 / 133**
Total Stage 7A: **133 / 133** passed

**CVG=0 APS behaviour (source-faithful):** `cvgAvailable=true`; bias = biasFactor × √(CVI²+0) = biasFactor × CVI. For CVI=5, CVG=0: optimum imprecision=1.25, optimum bias=0.625, optional TEa=2.6875.

**Missing CVG (undefined) APS behaviour (source-grounded, F-14 through F-18):** `cvgAvailable=false`; imprecision remains supported; bias unsupported (value=null); optional TEa unsupported (value=null, disclosureOnly=true). This is scientifically distinct from CVG=0.

**Numerical regression constants hard-coded (closure):**
- Classical RCV (CVA=3,CVI=5,z=1.96): 16.16257405242123 %
- Classical RCV (unidirectional): 13.565017508282104 %
- Log-normal sigma: 0.05826004692768121
- Log-normal k: 0.16148861107885468
- Log-normal increase: 17.52590731492456 %
- Log-normal decrease: 14.912377802761245 %
- Optimum APS bias (CVI=5,CVG=3): 0.7288689868556626 %

**Log-normal decrease units (source-exact):** `"% (magnitude of the allowable fall)"`

---

## Stage 7B — BV & RCV Lab Static Data and Challenge Bank

**Source module:** `src/bv/data.js`
**Provenance:** Class A — directly recovered from `recovery/original-v0.8.html` (lines 10734–11301)
**Architectural note:** Static data/teaching module. 33 exports, 0 functions. Contains the 16-case Serial Result Challenge Bank, the 8-record deterministic educational BV dataset, and all BV/RCV/APS/II doctrine notes. No live database queries, no formula duplication, no BIVAC scoring engine.

---

### INVAR-90: CVG Absent from RCV — Explicitly Stated in Data Layer

`CVG_NOT_IN_RCV_STATEMENT` explicitly documents that CVG is absent from both classical and log-normal RCV. `COMPONENT_QUESTION_PANEL` (3 questions) and `CVG_SIGNATURE_EXPERIMENT` reinforce this at the data level.

- **Tests:** C-07, D-07, D-08

---

### INVAR-91: II Changes with CVG; Classical RCV Does Not

`CVG_SIGNATURE_EXPERIMENT` (fixedCva=2, fixedCvi=6, cvgSteps=[6,12,24]) demonstrates that as CVG doubles and quadruples, II falls (from 1.0 to 0.5 to 0.25) while classical RCV remains unchanged at 17.53077...%.

- **Cross-layer hard-coded references:** II(6,6)=1.0; II(6,12)=0.5; II(6,24)=0.25; classical RCV(2,6)=17.53077294359835%
- **Tests:** D-04 through D-08

---

### INVAR-92: RI and RCV Are Independent — Two Signature Cases

`RI_VS_RCV_SIGNATURE_CASES` (cva=2, cvi=6, z=bidirectional-95, RI=70–110):
- Case A: previous=80→current=100 (both inside RI); relative change=25%; exceeds RCV (17.53%): **yes**
- Case B: previous=112→current=114 (both outside RI); relative change≈1.79%; exceeds RCV: **no**

These two cases demonstrate that RI status and RCV exceedance are independent questions.

- **Tests:** I-02 through I-11

---

### INVAR-93: Null BV Fields Stay Null — Never Substituted

BV dataset contains deliberate nulls. Key examples:
- bv-4: CVA=null (TSH literature-derived snapshot — not generalisable)
- bv-5: CVG=null → RCV computable from CVA+CVI, but II unsupported, bias APS unsupported
- bv-6: CVA=null → RCV unsupported; null must never be treated as zero
- bv-8: CVI=null, CVG=null (subgroup records, no global pooled estimate)

`BV_MISSING_FIELDS_STAY_MISSING_NOTE` documents this invariant.

- **Tests:** K-05 through K-13

---

### INVAR-94: CVA Substitution Trap — APS CVA ≠ Lab CVA

`CVA_SUBSTITUTION_TRAP_CASE` (CVI=6, desirableApsCva=3, actualLabCva=5): using the BV-derived APS target CVA as the actual CVA underestimates RCV. RCV(3,6,bi)=18.59%<RCV(5,6,bi)=21.65%.

- **Tests:** J-03 through J-09

---

### INVAR-95: Classical and Log-Normal RCV Give Different Answers

`SERIAL_RESULT_CHALLENGE_CASES` includes case `case-classical-vs-lognormal` (correctAnswer=`classical-only`) — a change that exceeds the classical threshold but not the log-normal (asymmetric) increase threshold.

Cross-layer validation (CVA=2,CVI=6,change≈18.5%): classical RCV=17.53%→exceeds; LN increase=19.14%→does not exceed.

- **Hard-coded:** LN RCV(2,6,bi) increase=19.14044252346827%
- **Tests:** P-05 through P-07

---

### Stage 7B Test Provenance

Test file: Artifact **Class D** (recovery infrastructure)

Source-grounded expectations: **218 / 273**
Reconstructed expectations: **55 / 273**
Total Stage 7B: **273 / 273** passed

**Deferred closure additions (Sections S, T, U):**
- S-01 (rc): source-fidelity regression — HTML lines 10734-11301 == `src/bv/data.js` body byte-for-byte
- T-01 through T-04 (sg): CVG_SIGNATURE_EXPERIMENT.expectedIndexOfIndividuality[0/1/2] = 1/0.5/0.25 (source-encoded)
- T-05 through T-07 (rc): cross-engine validation — calc II values match source-encoded expected values
- T-08 through T-11 (sg): BV_DATASET sourceType distribution tags (exact strings)
- U-01/U-02 (sg): exact pathway steps 0 and 7
- U-03 through U-05 (sg): BIVAC structure — all strings; exact [0] and [13] content
- U-06/U-07 (sg): RI_VS_RCV_SIGNATURE_CASES exact correct-answer strings ("Yes." and "No." with period)
- U-08/U-09 (sg): caseA/caseB exact IDs
- U-10 (sg): EFLM exact link "https://biologicalvariation.eu/"
- U-11 through U-13 (sg): PROVENANCE_CARD_FIELDS all plain strings; exact [0] and [7]
- U-14 (sg): CVA_SUBSTITUTION_TRAP_CASE uses `.cvi` (not `.fixedCvi`) — field name confirmed

**Cross-layer hard-coded reference values (all verified from Stage 7A engine):**
- Classical RCV(CVA=2,CVI=6,z=1.96): 17.53077294359835 %
- Classical RCV(CVA=6,CVI=6,z=1.96): 23.52 %
- Classical RCV(CVA=3,CVI=6,z=1.96): 18.59419264179007 %
- Classical RCV(CVA=5,CVI=6,z=1.96): 21.64890759368703 %
- Classical RCV(CVA=1,CVI=6,z=1.96): 16.860557523403546 %
- LN RCV increase(CVA=2,CVI=6,z=1.96): 19.14044252346827 %
- II(CVI=6,CVG=6): 1.0 ; II(CVI=6,CVG=12): 0.5 ; II(CVI=6,CVG=24): 0.25

---

## Stage 8A — Patient Surveillance Lab (PBRTQC) Calc Engine

**Source module:** `src/pbrtqc/calc.js`
**Provenance:** Class A — directly recovered from `recovery/original-v0.8.html` (lines 12023–12474)
**Architectural note:** Pure calc/enum module. 13 exports: 12 functions + `SUPPORTED_ERROR_TYPES` (5-element array). No React, no scenario bank, no CUSUM, no moving-SD engine, no RI generation, no BV engine, no automatic patient-result action.

**Symbol discipline:** W is the ONLY symbol for PBRTQC window size. N must never be used for window size; N retains its IQC meaning (QC measurements per run). This is explicitly stated in the HTML source and confirmed in the module.

---

### INVAR-96: W Is the PBRTQC Window Size Symbol — Not N

The source explicitly states: "never reuses the symbol N (QC measurements per run) for PBRTQC window size, using W throughout instead." The calc module uses `windowSize` for the parameter/return field, never `N`.

- **Tests:** A-04, A-05, O-01 through O-04

---

### INVAR-97: SUPPORTED_ERROR_TYPES — Five Types Only

`['none', 'persistent-additive', 'persistent-proportional', 'temporary-additive', 'temporary-proportional']`. No imprecision modelling, no Box-Cox, no CUSUM error types.

- **Tests:** B-01 through B-07

---

### INVAR-98: validateWindowSize — Positive Integer Required

W must be a finite, whole, positive number (≥1). W=0, W<0, W=non-integer → invalid with structured reason. Never silently coerced.

- **Tests:** C-01 through C-10

---

### INVAR-99: Sliding Algorithms — W−1 Warm-Up Points

`calculateSlidingMean` and `calculateSlidingMedian` both accept raw numeric arrays. Indices 0 through W−2 have `warmupStatus='warming-up'` and `statistic=undefined`. Index W−1 onward: `warmupStatus='complete'`.

- Hard-coded: [1,2,3,4,5], W=3: series[2]=2.0, [3]=3.0, [4]=4.0
- Even-W median: mean of two central sorted values
- **Tests:** D-01 through D-12, E-01 through E-10

---

### INVAR-100: EWMA — No Warm-Up; Explicit Baseline Required

`calculateEWMA(values, lambda, baselineCenter)`: z₀ = `baselineCenter` (never silently from first value). All points are `complete`. 0 < lambda ≤ 1; lambda=0 invalid; lambda=1 valid (no smoothing).

- Hard-coded: lambda=0.2, z0=0, [1,2,3]: z1=0.2, z2=0.56, z3=1.048
- lambda=0.5, z0=100, x1=110: z1=105
- **Tests:** F-01 through F-12

---

### INVAR-101: Error Injection Before Truncation

`injectAnalyticalError` is applied BEFORE `applyHardTruncation` — never after. This is documented in the source and enforced by `runPbrtqcStream`. No "calibration failure" or "reagent failure" labels are applied to injected errors; neutral language only.

**Executable evidence (Stage 8A N-PIPE/N-META):**
- N-PIPE-06/07: raw=95, +20 additive → errorAffectedValue=115; upper truncation=110 → excluded; `exclusionReason` contains "upper truncation limit" and "110"
- N-META-04: metadata-excluded point has `errorAffected=false`, `errorAffectedValue=null` (metadata exclusion prevents error injection)

- **Tests:** H-08, H-09, N-PIPE-06, N-PIPE-07, N-META-04

---

### INVAR-102: Hard Truncation — Inclusive Boundaries; Never Winsorisation

`applyHardTruncation(value, lowerTruncationLimit, upperTruncationLimit)`:
- Value strictly below lower → excluded
- Value exactly at limit → **included** (inclusive)
- Value strictly above upper → excluded
- Missing limits → all included

The source explicitly names and rejects winsorisation (clamping to limit) as a different, unimplemented technique.

- **Tests:** I-01 through I-07

---

### INVAR-103: NPed Uses 1-Based Raw Indices; Alert Before Onset → Invalid

`calculateNPed(errorOnsetRawIndex, firstAlertRawIndex, simulationHorizon)`:
- NPed = firstAlertRawIndex − errorOnsetRawIndex (1-based raw patient indices)
- Alert before onset → `{supported:false}` — never interpreted as negative NPed
- No alert (null firstAlertRawIndex) → `{detected:false, nped:undefined}` — never Infinity or placeholder
- Onset=0 or negative → invalid

**Executable evidence (Stage 8A N-IDX/N-NPED; Stage 8B V-SIG):**
- N-IDX-02/05: `firstAlertRawIndex=3` (raw); excluded point at raw index 2 has `eligiblePatientIndex=null`
- N-NPED-03: NPed(onset=1, alert=3)=2 confirmed using raw indices across excluded-point gap
- V-SIG-A-01/02: Population A firstAlertRawIndex=93, NPed=12
- V-SIG-B-02: Population B alert at raw 65 before onset 81 → `calculateNPed` unsupported
- V-SIG-D-01: Population D (errorType=none) firstAlertRawIndex=168 (case-mix shift, no analytical error)

- **Tests:** L-01 through L-10, N-IDX-01 through N-IDX-07, N-NPED-01 through N-NPED-03, V-SIG-A-01, V-SIG-A-02, V-SIG-B-01, V-SIG-B-02, V-SIG-D-01

---

### INVAR-104: ANPed Only When All Trials Detected

`summarizeNpedTrials(trials)`: `anped` = mean NPed **only** when `allTrialsDetected=true`. When any trial is undetected: `anped === undefined` — never averaged over detected-only subset and presented as ANPed. Separated `meanNpedAmongDetected` and `detectionRatePercent` are reported separately when censoring occurs.

- **Tests:** M-01 through M-13

---

### Stage 8A Test Provenance

Test file: Artifact **Class D** (recovery infrastructure)

Source-grounded expectations: **111 / 166**
Reconstructed expectations: **55 / 166**
Total Stage 8A: **166 / 166** passed

**Closure additions:**
- A-04, A-05, O-01, O-04 reclassified source-grounded → reconstructed (source-text search pattern tests written during recovery, not cited spec sections)
- O-02, O-03 remain source-grounded (no-N-export, no-windowSize-export: directly from HTML module.exports block)
- Section N fully rebuilt with:
  - **N-01-set (sg):** Export membership check against HTML module.exports
  - **N-01-order (sg):** Export order check against HTML module.exports
  - **N-02-* (rc):** Internal-helper export boundary
  - **N-FID (rc):** Real source-fidelity regression — HTML lines 12023-12474 match calc.js body byte-for-byte
  - **N-PIPE-* (rc):** Object-shaped fixture; error-before-truncation executable proof with exact point assertions (raw=95 +20 → 115 > upper=110 → excluded)
  - **N-META-* (rc):** Metadata-before-error proof (metadata-excluded point: errorAffected=false, errorAffectedValue=null)
  - **N-IDX-* (rc):** Raw-index vs eligible-index proof (firstAlertRawIndex uses raw indexing; excluded point consumes raw index but not eligible index)
  - **N-NPED-* (rc):** Cross-function NPed raw-index regression (NPed=2 from raw onset=1, raw alert=3, eligible stream has only 2 points)
  - **N-SMOKE-* (sg/rc):** Object-shaped smoke test; eligible P3 statistic=100 hard-coded
  - **N-MED-* (rc):** Moving-median orchestration; unsorted [1,9,3] → sorted median=3
  - **N-EWMA-* (rc):** EWMA orchestration; baselineCenter=0, z1=0.2, z2=0.56, z3=1.048
  - **N-UNK-01 (rc):** Unknown algorithm ("cusum") → supported=false
- `src/pbrtqc/calc.js` not modified

---

## Stage 8B — Patient Surveillance Lab Static Data and Challenge Bank

**Source module:** `src/pbrtqc/data.js`
**Provenance:** Class A — directly recovered from `recovery/original-v0.8.html` (lines 12476–13231)
**Architectural note:** Static data/teaching module. 74 exports, 0 functions. Contains the 18-case PBRTQC Challenge Bank, 5 synthetic patient populations, and all PBRTQC doctrine notes. No calc-engine duplication, no live data, no auto-optimizer, no AI/ML functionality.

---

### INVAR-105: PBRTQC Monitors Indirectly — Alert Is Not Root-Cause Diagnosis

`PBRTQC_CORE_PRINCIPLE` states PBRTQC monitors the process INDIRECTLY through patient-result statistics. An alert "is not, by itself, a root-cause diagnosis." `ALERT_ROUTES_TO_INVESTIGATION_NOTE` encodes this pathway.

- **Tests:** B-03, B-04, F-05

---

### INVAR-106: PBRTQC and IQC Are Complementary — Not Ranked

`PBRTQC_COMPLEMENTARY_NOTE` explicitly states the application "never teaches 'PBRTQC is better than IQC' or the reverse." `FORBIDDEN_BLANKET_STATEMENTS` encodes prohibited generalisations.

- **Tests:** B-05, B-06, F-08

---

### INVAR-107: Synthetic Data Only — Never Real Patient Data

`NO_LIVE_DATA_NOTE`, `SYNTHETIC_DATA_CARD_LABEL`, `PRIVACY_BRIEF_NOTE`. All 5 patient populations are synthetic (not real patient data). `PATIENT_POPULATIONS` entries have names indicating synthetic origin.

- **Tests:** G-04, I-04-*

---

### INVAR-108: No Auto-Optimizer, No Universal Targets

`NO_AUTO_OPTIMIZER_NOTE`, `NO_UNIVERSAL_TARGETS_NOTE`. PBRTQC parameters require local validation and stated provenance; no parameter is automatically optimised or universally prescribed.

- **Tests:** G-05, G-06

---

### INVAR-109: Methodological Development Note

`METHODOLOGICAL_DEVELOPMENT_NOTE` explicitly acknowledges PBRTQC is an active area of ongoing development, not a settled one-size-fits-all technique.

---

### Stage 8B Challenge Bank

18 cases, IDs 1–18 sequential. Critical answer keys:
- Case 1: NPed-value answer = 12
- Cases 6, 10, 17: yes; all other yes-no cases: no
- Case 4: median-more-robust-here
- Cases 8, 9: tradeoff
- Case 13: different-elapsed-time
- Case 15: investigate-pipeline

`PBRTQC_ANSWER_KIND_OPTIONS` is a keyed object (not array) mapping kind strings to option arrays.

Patient populations: 5 (`population-a` through `population-e`), each with `baseResults` array (raw numeric, not objects).

---

### Stage 8B Test Provenance

Test file: Artifact **Class D** (recovery infrastructure)

Source-grounded expectations: **198 / 261**
Reconstructed expectations: **63 / 261**
Total Stage 8B: **261 / 261** passed

**Deferred closure additions (Sections S, T, U):**
- S-01 (rc): source-fidelity regression — HTML lines 12476-13231 == `src/pbrtqc/data.js` body byte-for-byte
- T-01 through T-05 (sg): PATIENT_POPULATIONS distributionDescriptor (exact: narrow-stable, broad-heterogeneous, right-skewed, changing-case-mix, bimodal-mixture)
- T-06 through T-08 (sg): stabilityDescriptor regression (exact substrings)
- U-01/U-02 (sg): exact pathway steps 0 and 10
- U-03/U-04 (sg): PROCESSING_PIPELINE_STEPS[2] = error step, [3] = truncation step (exact start text)
- U-05 (sg): error step index < truncation step index (ordering confirmed from data)
- U-06/U-07 (sg): PBRTQC_ANSWER_KIND_OPTIONS yes-no option IDs and labels exact
- U-08 (sg): case 1 correctAnswer = 12 (numeric or string)
- U-09 (sg): population-c right-skewed with >= 5 baseResults (experiment reference valid)
- U-10-* (rc): calc slidingMean processes all 5 populations (cross-module)

---

## Stage 9A — Shared UI Primitives and Original Stylesheet

**Source modules:** `src/ui/original-v0.8.css` (Class A, HTML lines 8–529) and `src/ui/shared-components.jsx` (Class A, HTML lines 1827–2095)

**Scientific core frozen at:** `51ba199` (all 14 scientific modules immutable)

---

### INVAR-UI-01: Original Stylesheet Is Monolithic and Must Not Be Split

`src/ui/original-v0.8.css` is recovered verbatim from HTML lines 8–529 (522 lines). Do not split into domain-specific files; do not reformat, sort, or modernise. SHA-256: `fda2285c...`

### INVAR-UI-02: Shared JSX Is Source-Identical to HTML Lines 1827–2095

`src/ui/shared-components.jsx` matches HTML lines 1827–2095 (269 lines) byte-for-byte. SHA-256: `bd848d01...` No imports, no module exports added.

### INVAR-UI-03: Exactly Seven Shared Components, No More

Badge, ScientificBasisNote, SliderField, MetricCard, Modal, LJChart, DistributionView — in that order. No screen components. No domain-specific reusable components.

`LJ_KEY_RUNS = new Set([1, 5, 10, 15, 20])` exact.

### INVAR-UI-04: Modal Accessibility Semantics (Locked)

- `role="dialog"`, `aria-modal="true"`, `aria-label={title}`, `tabIndex={-1}`
- Escape key closes; listener removed on cleanup (`removeEventListener`)
- Panel receives focus on mount
- Overlay click closes only when `e.target === e.currentTarget`
- Close button: `aria-label={"Close " + title}`

### INVAR-UI-05: SliderField Signed-Mode Semantics

- Range + numeric dual input; `label htmlFor={id}`
- Signed mode: Set negative / Zero / Set positive quick-controls; `fmtSigned()` for display
- `aria-valuetext` on range input; `aria-label` on numeric input
- `parseFloat()` for numeric entry; `!isNaN(v)` guard prevents `onChange` for NaN

### INVAR-UI-06: LJChart Is Presentation Only, Not a QC Rule Engine

- SVG only (no canvas); `role="img"`, `aria-label`
- `W = 760, H = 398`; ±4 SD visual domain
- `gridLevels = [-3, -2, -1, 0, 1, 2, 3]` exact
- `Math.abs(pt.z) > 3` = out; `Math.abs(pt.z) > 2 && <= 3` = warning
- Points: `tabIndex={0}`, `role="button"`, `aria-label` with run/value/SD
- Text alternative: `<summary>Show data table (text alternative)</summary>`; table headings: Run / Raw value / SD position

### INVAR-UI-07: DistributionView Is a Visualization Component, Not a Density Engine

- SVG only (no canvas); `role="img"`, `aria-label`
- `W = 640, H = 170`
- `showBothMarkers=true`: "Target" and "Process centre" are distinct labelled markers
- `showBothMarkers=false`: label is "Target = Process centre"
- Bell curve via normal-density path; not a histogram

### INVAR-UI-08: Browser/Runtime Equivalence Not Yet Established

No JSX was transpiled or rendered in Node.js for Stage 9A. Structural validation only. Browser equivalence awaits later build reconstruction stages.

---

### Stage 9A Test Provenance

Test file: Artifact **Class D** (recovery infrastructure)

Source-grounded expectations: **88 / 122**
Reconstructed expectations: **34 / 122**
Total Stage 9A: **122 / 122** passed
