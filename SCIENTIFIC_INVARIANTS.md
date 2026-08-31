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

## Stage 2+ (not yet recovered)

The following modules are pending recovery and will be documented here
when each stage is approved:

- Rule engine (Westgard, multirule)
- Ped / Pfr
- QC Strategy
- Risk / frequency
- Investigation
- EQA
- BV / RCV
- PBRTQC

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
**Architectural note:** `strategy/core.js` contains no Sigma formula. It imports `calcSigma` from `src/core/statistics.js` (architectural deduplication, no scientific-behaviour change). Opchar results come exclusively from `src/opchar/functions.js`.

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

### Stage 3B Test Summary

| Category | Count | Status |
|----------|-------|--------|
| Directly recovered fixtures (challenge Sigma + map) | 22 | ✅ pass |
| APS framework | 11 | ✅ pass |
| Sigma mapping (fixed inputs) | 21 | ✅ pass |
| Procedure library structure | 18 | ✅ pass |
| Procedure C mandatory check | 10 | ✅ pass |
| Procedure D mandatory check | 10 | ✅ pass |
| Alternative 8x config | 5 | ✅ pass |
| N/R semantics | 5 | ✅ pass |
| Opchar integration | 12 | ✅ pass |
| Challenge bank structure | 17 | ✅ pass |
| Cross-engine integration smoke | 3 | ✅ pass |
| Doctrine notes | 4 | ✅ pass |
| **Total Stage 3B** | **158** | **✅ all pass** |
