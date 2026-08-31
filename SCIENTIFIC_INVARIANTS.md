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
