# Scientific Basis / Methods

This document concisely summarizes the scientific invariants underlying
PreciMind QC Learning Lab's accepted software behaviour. It reflects
what the software actually does, verified via the project's automated
scientific-regression suites (`SCIENTIFIC_INVARIANTS.md` at the
repository root documents each invariant exhaustively, with recovered
historical fixtures and full test provenance — this document is the
concise release-facing summary of that source of truth).

## Core statistics
- Sample standard deviation uses **n − 1** (never n).
- **CV%** = SD / mean × 100.
- **Signed Bias%** = (Observed − Target) / Target × 100.
- **Sigma** = (TEa − |Bias|) / CV. Sigma may be **negative** (never
  floored to zero) and is treated as invalid/undefined when CV ≤ 0.

## Westgard rule doctrine (strict exceedance)
- **Exceedance is always strict**: `1_3s` requires `|z| > 3` — equality
  at exactly ±3 SD is never treated as an exceedance.
- **`2_2s`** requires two qualifying results on the **same side** of
  the mean.
- **`R_4s`** is evaluated **within-run only**, across the relevant
  paired QC materials — never inferred across unrelated runs.
- **`8x`** and **`10x`** are kept strictly distinct (`8x` is not part
  of the default multirule order used elsewhere in the software).
- Operating characteristics (Ped/Pfr) are scoped to pure `1_3s` only,
  with no cross-rule probability combination.

## Investigation doctrine
The software never collapses these distinct concepts into one another:
> QC signal ≠ analytical disturbance ≠ root cause ≠ patient impact ≠ final disposition.

## EQA (External Quality Assessment) doctrine
- All-method peer mean, method-specific peer mean, and an
  assigned/reference target are kept as three distinct concepts.
- Stable internal QC does **not**, by itself, establish trueness.
- Poor EQA performance does **not** automatically establish patient-level bias.

## Biological variation / RCV doctrine
- Reference Change Value (RCV) calculations use analytical (CV_A) and
  within-subject biological (CV_I) variation components only.
- RCV exceedance does **not** establish a specific disease or
  biological etiology on its own.

## PBRTQC (patient-based real-time QC) doctrine
- Metadata-based exclusion is applied **before** analytical-error
  simulation, which is applied **before** any truncation/windowing step.
- A **raw** eligible index and a **post-exclusion** eligible index are
  kept distinct.
- **NPed** (number of patient results to detect) is a genuine raw
  patient-result count.
- **ANPed** (average NPed) is explicitly left **undefined** when any
  simulation run failed to detect the introduced error at all, rather
  than silently averaging over only the detected runs.

## Provenance and disagreement policy
If this document and the actual accepted software behaviour ever
disagree, that is reported as a discrepancy to resolve — this document
is never used as a basis to alter accepted scientific behaviour to
match prose. See `SCIENTIFIC_INVARIANTS.md` for the full, line-by-line
invariant catalogue with historical fixture provenance, and the
project's automated scientific-regression suites (case-bank,
scientific-numeric-audit, and the full v0.8-recovered regression) for
executable verification of every invariant listed here.
