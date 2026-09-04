# Stage 10B Differential Browser Equivalence Report

**Stage:** 10B  
**Artifact Class:** D  
**Browser:** Playwright + Chromium 141.0.7390.37  
**Original:** `recovery/original-v0.8.html` SHA `e5317bf1...`  
**Candidate:** `dist/recovered-v0.8-faithful.html` SHA `a9fe9a3a...` (Class B)

---

## External Network Policy

Google Fonts requests (`fonts.googleapis.com`, `fonts.gstatic.com`) were **aborted identically** for both artifacts using Playwright route interception. React, ReactDOM, and Babel are embedded in the HTML and were not intercepted.

---

## Part A: Provenance Corrections (from Stage 10B)

The Stage 10A assembly map incorrectly labeled all 34 assembled modules as pure Class A. Corrected in this stage:

- **24 exact Class A HTML-slice modules** — byte-for-byte recovered source (ui-components, screens, data, app-data, shared-components, core-screens, app-shell)
- **10 composite A+D modules** — Class A scientific content + Class D recovery wrapper (statistics.js, engine.js, functions.js, core.js, detection-delay.js, risk/data.js, calc.js files)
- `recovery/assembly-map.json` and `recovery/ASSEMBLY_MAP.md` updated with correct provenance structure
- `recovery/STAGE10A_RUNTIME_BASELINE.md` and `SCIENTIFIC_INVARIANTS.md` corrected to remove overconfident claim about "final of 19 mounts is the effective one" → replaced with "The internal disposition of the repeated roots was not instrumented in Stage 10A."

---

## Browser Equivalence Matrix

### Total: 115 checkpoints — **115 MATCH, 0 DIFFERENCE, 0 BLOCKED**

### Initial State (9 checkpoints — all MATCH)
Document title, initial h1, nav item count, nav item order, level-select default, active nav item, root DOM hash, skip link text, footer text.

### 14-Screen Traversal (42 checkpoints — all MATCH)
All 14 screens: home, map, stats, lj, pattern, rules, strategy, sigma, risk, investigation, external-assurance, bv-rcv, pbrtqc, evidence.  
Per screen: h1 text, active nav item, complete `#root.innerHTML` hash.

### Level Switching (16 checkpoints — all MATCH)
All 4 levels (beginner, intermediate, advanced, expert):  
level-select value, Home DOM hash, Competency Map DOM hash, Pattern Challenge DOM hash.

### Modals (6 checkpoints — all MATCH)
Glossary: DOM hash, item count, close via button.  
About: DOM hash, version string `Version 0.8 — PBRTQC & Patient Surveillance`, Escape close.

### Domain Lab Screens — Initial DOM (8 checkpoints — all MATCH)
Stats Playground, Rule Laboratory, QC Strategy Lab, Risk Lab, Investigation Lab, EQA Lab, BV/RCV Lab, PBRTQC Lab — initial screen DOM hash.

### Investigation Lab All 5 Modes (5 checkpoints — all MATCH)
signals, troubleshooting, reconstruction, patient-impact, recovery.

### Console / Page Errors (4 checkpoints — all MATCH)
Page error count (0), ReactDOM message count (0), application error count (0), Babel deoptimise message count (1).

### Keyboard / Accessibility (4 checkpoints — all MATCH)
Skip link Tab target, Escape closes modal, aria-current on active nav, nav aria-label attribute.

### Desktop Screenshots 1440×1000 (9 checkpoints — all MATCH)
Home, Statistics Playground, Rule Laboratory, QC Strategy Lab, Risk & Frequency Lab, Investigation Lab, External Assurance Lab, BV & RCV Lab, Patient Surveillance Lab.  
**Pixel-exact PNG SHA-256 match** between original and candidate for all 9 screens.

### Mobile Screenshots 390×844 (4 checkpoints — all MATCH)
Home, Rule Laboratory, Risk & Frequency Lab, Patient Surveillance Lab.  
**Pixel-exact PNG SHA-256 match** for all 4 screens.

### 19-Mount Instrumented Check (5 checkpoints — all MATCH)

| Measurement | Original | Candidate |
|-------------|----------|-----------|
| ReactDOM mount warnings | 0 | 0 |
| Page errors from mounts | 0 | 0 |
| Root children after 19 mounts | 1 | 1 |

**New finding (Stage 10B direct instrumentation):** After all 19 `ReactDOM.createRoot(rootEl).render(<App />)` calls execute, the `#root` element contains exactly **1 child** in both the original and the candidate. The React runtime silently coalesces the repeated calls to a single root child. The internal disposition is now directly measured, not inferred.

---

## 19-Mount Decision

**DECISION: PRESERVE RECOVERED 19-MOUNT SOURCE IN v0.8 BASELINE**

**Rationale:**
- The 19 mount calls are authoritative recovered v0.8 source (Class A, frozen SHA `56e3d5fa...`)
- No ReactDOM warning or error is produced in either the original or the candidate
- No page errors occur
- The `#root` element ends with exactly 1 child in both artifacts — functionally identical outcome
- No functional discrepancy has been demonstrated across 115 browser checkpoints
- Deduplication would alter the recovered baseline without resolving any demonstrated defect
- Cleanup may be considered only in a future development version (v0.9+)

---

## Differences and Blocked Checkpoints

**None.** All 115 checkpoints classified MATCH.

---

## Limitations

Not exhaustively tested in Stage 10B (NOT_TESTED):
- Interactive form input in Statistics Playground (value changes)
- LJ chart interaction (dataset switching)
- Pattern Challenge game flow (submitting answers)
- Rule Lab detective case completion
- Strategy Challenge completion
- Frequency Simulator M-value manipulation
- Recovery Challenge full stage traversal
- EQA challenge completion
- BV/RCV serial-result challenge completion
- PBRTQC simulator parameter manipulation
- Diagnostic modal full Q&A flow
- Keyboard navigation of all interactive elements

These were excluded from this stage due to application interactivity complexity. The initial screen DOM match for all 14 screens, all 4 levels, and pixel-exact screenshots provide high confidence in equivalence. Further interaction testing may be conducted in Stage 10C if warranted.

---

## Validation Status

All Stage 10B pass criteria satisfied:
- ✅ All required checkpoints executed
- ✅ No unexplained DIFFERENCE
- ✅ No candidate-only fatal error
- ✅ All 14 primary screens match
- ✅ All 4 learner levels match
- ✅ Required modal flows match
- ✅ Keyboard/accessibility behavior matches within tested scope
- ✅ Desktop and mobile visual checks: pixel-exact match
- ✅ Node regression 3500/3500 green
- ✅ No frozen source changed
- ✅ Candidate SHA unchanged throughout
- ✅ 19-mount decision: PRESERVE

**Browser equivalence declared within the declared test matrix.**  
`recovered-v0.8-validated` tag applied.
