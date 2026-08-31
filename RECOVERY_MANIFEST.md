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
| `tests/stage1-statistics.test.js` | **D** | New recovery tests — NOT historical test suite |
| `SCIENTIFIC_INVARIANTS.md` | **D** | New recovery documentation (Stage 1) |
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
