# PreciMind QC Learning Lab — Recovery Manifest

## Project Identity
- **Project name:** PreciMind QC Learning Lab
- **Recovered baseline:** v0.8 — PBRTQC & Patient Surveillance
- **Original project filename:** `precimindartifact.html`
- **Preserved recovery filename:** `recovery/original-v0.8.html`

## Integrity
- **SHA-256:** `e5317bf135f350b258428b985c1034a081e244a295f2e580c93cb6a6a091c8e4`
  (verified identical for both files on recovery date)

## Historical Context
- **Historical reported v0.8 commit:** `3cc62b1`
- **Status:** The historical Git repository, associated test files, and recovery
  infrastructure were lost during account migration. They cannot be independently
  recovered and are not reconstructed here.
- **This repository** is a fresh recovery repository, newly initialised from the
  surviving v0.8 HTML file. It does NOT recreate or pretend to recreate the
  historical repository or historical commit `3cc62b1`.

## Recovery Date
- **Date:** 2026-08-31

## Provenance Classification

| Item | Class | Notes |
|------|-------|-------|
| `recovery/original-v0.8.html` | **A** | Directly recovered from surviving HTML file |
| `RECOVERY_MANIFEST.md` | **D** | New recovery infrastructure |
| `src/core/statistics.js` | **A** | Directly extracted from HTML (Stage 1) |
| `src/rules/engine.js` | **A** | Directly extracted from HTML (Stage 2, lines ~2817–3196); RULE_LABELS Unicode glyphs restored in Stage 2 closure check |
| `src/opchar/functions.js` | **A** | Directly extracted from HTML (Stage 3A, lines ~4155–4282) |
| `tests/stage1-statistics.test.js` | **D** | New recovery tests — NOT historical test suite |
| `tests/stage2-rules.test.js` | **D** | New recovery tests — NOT historical rule suite |
| `tests/stage3a-opchar.test.js` | **D** | New recovery tests — NOT historical opchar suite |
| `src/strategy/core.js` | **A** | Directly extracted from HTML (Stage 3B, lines ~4052–4090, ~4284–4676) |
| `tests/stage3b-strategy.test.js` | **D** | New recovery tests — NOT historical strategy suite |
| `src/risk/detection-delay.js` | **A** | Directly extracted from HTML (Stage 4A, lines ~5340–5495) |
| `tests/stage4a-detection-delay.test.js` | **D** | New recovery tests — NOT historical suite |
| `src/risk/data.js` | **A** | Directly extracted from HTML (Stage 4B, lines ~5499–5870) |
| `tests/stage4b-risk-data.test.js` | **D** | New recovery tests — NOT historical suite |
| `src/investigation/calc.js` | **A** | Directly extracted from HTML (Stage 5A, lines ~6536–6683) |
| `tests/stage5a-investigation-calc.test.js` | **D** | New recovery tests — NOT historical suite |
| `src/investigation/data.js` | **A** | Directly extracted from HTML (Stage 5B, lines 6684–7447) |
| `tests/stage5b-investigation-data.test.js` | **D** | New recovery tests — NOT historical suite |
| `src/eqa/calc.js` | **A** | Directly extracted from HTML (Stage 6A, lines 8368–8670) |
| `tests/stage6a-eqa-calc.test.js` | **D** | New recovery tests — NOT historical suite |
| `src/eqa/data.js` | **A** | Directly extracted from HTML (Stage 6B, lines 8671–9545) |
| `tests/stage6b-eqa-data.test.js` | **D** | New recovery tests — NOT historical suite |
| `SCIENTIFIC_INVARIANTS.md` | **D** | New recovery documentation (Stages 1–6B) |
| Historical Git repository | **E** | Lost — not recoverable |
| Historical test files | **E** | Lost — not recoverable |
| Historical commit `3cc62b1` | **C** | Reported externally; not independently recovered |
| Recovery git repository | **D** | Newly created recovery/test infrastructure |

### Provenance Key
- **A** = Directly recovered from HTML
- **B** = Deterministically reconstructed from embedded logic
- **C** = Historical information supplied externally but not independently recovered
- **D** = New recovery/test infrastructure
- **E** = Unresolved / not recoverable
