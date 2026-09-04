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
| `src/bv/calc.js` | **A** | Directly extracted from HTML (Stage 7A, lines 10405–10731) |
| `tests/stage7a-bv-calc.test.js` | **D** | New recovery tests — NOT historical suite |
| `src/bv/data.js` | **A** | Directly extracted from HTML (Stage 7B, lines 10734–11301) |
| `tests/stage7b-bv-data.test.js` | **D** | New recovery tests — NOT historical suite |
| `src/pbrtqc/calc.js` | **A** | Directly extracted from HTML (Stage 8A, lines 12023–12474) |
| `tests/stage8a-pbrtqc-calc.test.js` | **D** | New recovery tests — NOT historical suite |
| `src/pbrtqc/data.js` | **A** | Directly extracted from HTML (Stage 8B, lines 12476–13231) |
| `tests/stage8b-pbrtqc-data.test.js` | **D** | New recovery tests — NOT historical suite |
| `src/ui/original-v0.8.css` | **A** | Stage 9A, HTML lines 8–529, SHA fda2285c... |
| `src/ui/shared-components.jsx` | **A** | Stage 9A, HTML lines 1827–2095, SHA bd848d01... |
| `tests/stage9a-shared-ui.test.js` | **D** | Stage 9A recovery tests |
| `src/investigation/ui-components.jsx` | **A** | Stage 9B, HTML lines 7449–7701, SHA 26a0ae70... |
| `src/investigation/screens.jsx` | **A** | Stage 9B, HTML lines 7704–8365, SHA d2794c94... |
| `tests/stage9b-investigation-ui.test.js` | **D** | Stage 9B recovery tests |
| `src/eqa/ui-components.jsx` | **A** | Stage 9C (corrected), HTML 9548–9891, 344 lines, SHA f7c973db... |
| `src/eqa/screens.jsx` | **A** | Stage 9C (corrected), HTML 9894–10402, 509 lines, SHA 3b10aa20... |
| `tests/stage9c-eqa-ui.test.js` | **D** | Stage 9C recovery tests |
| `src/bv/ui-components.jsx` | **A** | Stage 9D (corrected), HTML 11304–11634, 331 lines, SHA 91c0b5a1... |
| `src/bv/screens.jsx` | **A** | Stage 9D (corrected), HTML 11637–12020, 384 lines, SHA 46988260... |
| `tests/stage9d-bv-ui.test.js` | **D** | Stage 9D recovery tests |
| `src/pbrtqc/ui-components.jsx` | **A** | Stage 9E (corrected), HTML 13234–13469, 236 lines, SHA b14efc66... |
| `src/pbrtqc/screens.jsx` | **A** | Stage 9E (corrected), HTML 13472–13885, 414 lines, SHA 2e1cb56d...
|  |  | PatientSurveillanceLabScreen incl (lines 13853–13885); ScientificBasisNote inside it; app shell starts 13888 |
| `tests/stage9e-pbrtqc-ui.test.js` | **D** | Stage 9E recovery tests |
| `src/ui/app-data.js` | **A** | Stage 9F, HTML 970–1824, 855 lines, SHA 81cef641... |
| `src/ui/core-screens.jsx` | **A** | Stage 9F, HTML 2098–2813, 716 lines, SHA 90c2e858... |
| `tests/stage9f-foundation-ui.test.js` | **D** | Stage 9F recovery tests |
| `src/rules/data.js` | **A** | Stage 9G, HTML 3199–3417, 219 lines, SHA 41453ef6... |
| `src/rules/ui-components.jsx` | **A** | Stage 9G, HTML 3420–3633, 214 lines, SHA 4eb7a110... |
| `src/rules/screens.jsx` | **A** | Stage 9G, HTML 3636–4043, 408 lines, SHA 8a374e0a... |
| `tests/stage9g-rule-lab-ui.test.js` | **D** | Stage 9G recovery tests |
| `src/strategy/aps-ui-data.js` | **A** | Stage 9H, HTML 4086–4151, 66 lines, SHA f45494a4... (data fragment) |
| `src/strategy/ui-components.jsx` | **A** | Stage 9H, HTML 4675–4796, 122 lines, SHA 46ba76ac... |
| `src/strategy/screens.jsx` | **A** | Stage 9H, HTML 4799–5338, 540 lines, SHA 5283fccc... |
| `tests/stage9h-strategy-ui.test.js` | **D** | Stage 9H recovery tests |
| `src/risk/ui-components.jsx` | **A** | Stage 9I (corrected), HTML 5877–6045, 169 lines, SHA a71112bc... |
| `src/risk/screens.jsx` | **A** | Stage 9I (corrected), HTML 6048–6532, 485 lines, SHA 7f0897e8... |
| `tests/stage9i-risk-lab-ui.test.js` | **D** | Stage 9I recovery tests |
| `SCIENTIFIC_INVARIANTS.md` | **D** | New recovery documentation (Stages 1–9I) |
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
