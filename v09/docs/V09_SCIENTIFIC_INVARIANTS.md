# v0.9 Scientific Invariants

**v0.9 inherits all validated v0.8 scientific invariants unless an explicit future scientific-change ADR is approved.**

The full recovery history, frozen numerical signatures, and validation record for these invariants lives in the root-level `SCIENTIFIC_INVARIANTS.md` (Stages 1 through 10F) and is **not duplicated here**. That document remains the authoritative historical record for the v0.8 recovery and is permanently unchanged.

This document exists only to state the inheritance rule and the process for any future scientific change.

---

## Inheritance Rule

Every scientific calculation, formula, threshold, and frozen numerical signature validated during the v0.8 recovery (statistics, rules engine, operating characteristics, strategy/APS, risk/detection-delay, investigation, EQA, BV/RCV, PBRTQC) is inherited by v0.9 as-is. This includes but is not limited to:

- Mean, sample SD, CV%, bias calculations (`src/core/statistics.js`)
- Westgard multirule evaluation (`src/rules/engine.js`)
- Operating characteristic functions (`src/opchar/functions.js`)
- QC strategy / APS classification logic (`src/strategy/core.js`)
- Detection delay and risk calculations (`src/risk/detection-delay.js`, `src/risk/data.js`)
- Investigation calculation helpers (`src/investigation/calc.js`)
- EQA calculations (`src/eqa/calc.js`)
- BV/RCV calculations (`src/bv/calc.js`)
- PBRTQC calculations (`src/pbrtqc/calc.js`), including the frozen signatures:
  - Population A, W=20, shift=+6, onset=81 → alert index=93, NPed=12
  - Population A, W=20, shift=+8, onset=81 → alert index=106, NPed=25, excluded=0
  - Same + upper truncation=146 → no alert, excluded=51

---

## Process for Any Future Scientific Semantic Change

Any change to a scientific formula, threshold, or interpretation inherited from v0.8 must have, before merge:

1. **Rationale** — why the change is being made
2. **Literature / source basis** — where applicable, a citation or reference justifying the change
3. **Tests** — new or updated unit tests demonstrating the new expected behavior, plus confirmation that the change was intentional (not an accidental regression)
4. **Versioned migration note** — a dated entry describing what changed, from what, to what, and why, added to this document or a linked ADR

No scientific semantic change may be made silently. A change without the above four elements must be treated as a defect, not a feature.

---

## Status at Stage 11A

No scientific semantic changes have been proposed or made. All `v09/src/` scientific modules are byte-for-byte identical to their validated v0.8 counterparts (see `v08-to-v09-baseline-map.json`).
