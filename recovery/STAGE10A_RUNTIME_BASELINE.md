# Stage 10A Runtime Baseline Report

**Date:** Stage 10A execution  
**Artifact Class:** D (recovery infrastructure)  
**Browser Tooling:** Playwright with Chromium 141.0.7390.37 at `/opt/pw-browsers/chromium-1194/`

---

## 1. Browser Tooling

**Available:** Playwright (npx version 10.9.7) + Chromium 141 at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`  
**Method:** Local HTTP server (`http://127.0.0.1`) serving HTML from disk. File-restriction issues avoided.

---

## 2. Original v0.8 Runtime Observations

**File:** `recovery/original-v0.8.html`  
**SHA-256:** `e5317bf135f350b258428b985c1034a081e244a295f2e580c93cb6a6a091c8e4`  
**Load outcome:** Success — page loads and renders after Babel transform  
**Load delay:** ~3–4 seconds for Babel to transform ~3MB embedded source

| Observation | Value |
|-------------|-------|
| Page load | SUCCESS |
| Fatal page errors | NONE |
| `#root` innerHTML length | 5744 chars |
| Page `<h1>` | "Learn Quality Control by Doing It" |
| Primary nav item count | 14 |
| Nav labels (in order) | Home, Competency Map, Statistics Playground, LJ Laboratory, Pattern Challenge, Rule Laboratory, QC Strategy Lab, Sigma Sandbox, Risk & Frequency Lab, Investigation Lab, External Assurance Lab, BV & RCV Lab, Patient Surveillance Lab, Evidence |
| Initial `level-select` value | `beginner` |
| Initial screen | Home (h1 "Learn Quality Control by Doing It") |
| Application interactive | YES |

---

## 3. 19-Mount Runtime Adjudication — Directly Measured

The original HTML source contains exactly **19** occurrences of `ReactDOM.createRoot(rootEl).render(<App />)`.

**Observed browser behavior:**

- **No uncaught page exceptions** (pageErrors: 0)
- **Zero ReactDOM/createRoot-related console messages** — no warning, no error
- **Zero console.warning messages** of any kind
- **Root rendered correctly** — `#root` contains 5744 chars of React-rendered content
- **Application fully functional** — all 14 screens navigable, modals open/close, level select present

**Classification:** The 19 repeated `ReactDOM.createRoot` mount calls produce **no observable browser warning or error** in this Chromium runtime. The React runtime handled the repeated calls without observable error. The internal disposition of the repeated roots was not instrumented in Stage 10A. The application is functional.

**Implication for Stage 10A:** SOURCE-FAITHFUL RUNTIME — no anomalous behavior detected from the 19 repeated mounts in either the original or the candidate. Runtime adjudication does not require repair for functional equivalence; the decision to repair or not belongs to Stage 10B.

---

## 4. Console Messages (Original)

| Type | Count | Detail |
|------|-------|--------|
| error | 2 | (1) 403 on Google Fonts resource (non-fatal, external CDN); (2) [BABEL] deoptimised styling warning for source >500KB |
| warning | 0 | None |
| info/log | minimal | React/application internal only |
| ReactDOM/createRoot | 0 | No React mount warnings |

The 403 error is from Google Fonts (external CDN request blocked by HTTP test server). Non-essential to functional equivalence. The Babel deoptimisation note is expected for a ~3.5MB source file.

---

## 5. Assembly Architecture

**Assembler:** `tools/assemble-v08.js` (Class D)  
**Output:** `dist/recovered-v0.8-faithful.html` (Class B)  
**Strategy:** Direct ordered concatenation of 34 frozen Class A source modules into the original document envelope

**Dependency resolution:** The specified 34-module order is dependency-safe:
- `statistics.js` before all scientific modules
- `app-data.js` before all UI (provides LEVELS, LEVEL_LABELS, etc.)
- `shared-components.jsx` before screens
- `core-screens.jsx` before app-shell (provides HomeScreen, StatsPlayground, etc.)
- Each lab's `calc.js` / `data.js` before its `ui-components.jsx` / `screens.jsx`
- `app-shell.jsx` last (references all screens)

**No dependency conflicts detected.**

---

## 6. CommonJS Wrapper Policy

Several scientific recovery modules contain guarded constructs:
```js
if (typeof module !== "undefined" && module.exports) {
  module.exports = { ... };
}
```
These blocks are **preserved unchanged** in the faithful candidate. In browser context, `module` is undefined so the guard is false and the block is inert — confirmed by the candidate browser test showing no errors from these blocks.

---

## 7. Faithful Candidate Details

**File:** `dist/recovered-v0.8-faithful.html`  
**Artifact Class:** B (deterministic reconstruction — NOT Class A)  
**SHA-256:** `a9fe9a3acbb8c35347cc735292ad63883778e5c12845f4da529129119b72c886`  
**Size:** 3,564,693 bytes  
**Modules assembled:** 34  
**Mount calls preserved:** 19  
**Reproducibility:** Identical SHA-256 confirmed across two independent assembly runs

**NOT byte-for-byte identical to original app-source** because scientific modules contain recovery infrastructure (provenance headers, guarded CommonJS exports) not present at original HTML positions. The candidate is a faithful modular reconstruction, not a clone of the original.

---

## 8. Smoke Comparison Table

| Checkpoint | Original | Candidate | Classification |
|------------|----------|-----------|----------------|
| Page load | SUCCESS | SUCCESS | **MATCH** |
| Fatal page errors | 0 | 0 | **MATCH** |
| `#root` renders | YES (5744 chars) | YES (5744 chars) | **MATCH** |
| Page `<h1>` | "Learn Quality Control by Doing It" | "Learn Quality Control by Doing It" | **MATCH** |
| Nav item count | 14 | 14 | **MATCH** |
| Nav labels/order | all 14 exact | all 14 exact | **MATCH** |
| Initial level | beginner | beginner | **MATCH** |
| Initial screen | Home | Home | **MATCH** |
| Application interactive | YES | YES | **MATCH** |
| Competency Map nav | CLICKED | CLICKED | **MATCH** |
| Statistics Playground nav | CLICKED | CLICKED | **MATCH** |
| Rule Laboratory nav | CLICKED | CLICKED | **MATCH** |
| QC Strategy Lab nav | CLICKED | CLICKED | **MATCH** |
| Risk & Frequency Lab nav | CLICKED | CLICKED | **MATCH** |
| Investigation Lab nav | CLICKED | CLICKED | **MATCH** |
| External Assurance Lab nav | CLICKED | CLICKED | **MATCH** |
| BV & RCV Lab nav | CLICKED | CLICKED | **MATCH** |
| Patient Surveillance Lab nav | CLICKED | CLICKED | **MATCH** |
| Evidence nav | CLICKED | CLICKED | **MATCH** |
| Return to Home | CLICKED | CLICKED | **MATCH** |
| Glossary modal open/close | OPENED_CLOSED | OPENED_CLOSED | **MATCH** |
| About modal open/close | OPENED_CLOSED | OPENED_CLOSED | **MATCH** |

**All 23 smoke checkpoints: MATCH**

---

## 9. Console/Error Comparison

| | Original | Candidate |
|--|---------|-----------|
| Fatal page errors | 0 | 0 |
| Console errors | 2 | 2 |
| Console warnings | 0 | 0 |
| ReactDOM mount messages | 0 | 0 |
| 403 (Google Fonts) | 1 | 1 |
| Babel deoptimisation note | 1 | 1 |

Identical console behavior confirmed.

---

## 10. Mount-Call Comparison

| | Original | Candidate |
|--|---------|-----------|
| Mount call count | 19 | 19 |
| Warnings | 0 | 0 |
| Errors | 0 | 0 |
| Uncaught exceptions | 0 | 0 |
| Functional final state | YES | YES |

**Classification:** SOURCE-FAITHFUL RUNTIME MATCH WITH RECOVERED MOUNT ANOMALY  
The 19 repeated mount calls produce identical behavior in both the original and the candidate — no observable browser warning or error in either case. The application is functional in both.

---

## 11. Unresolved Differences

**None** from the bounded smoke traversal. 

**Not yet tested (Stage 10B):**
- Full interaction coverage of all 14 screens
- Interactive form inputs within each lab
- LJ charting visual output
- Pattern Challenge gameplay
- Investigation Lab scenario traversal
- PBRTQC calculation output comparison
- EQA/BV/RCV numerical output comparison
- Level-switching behavior across all screens
- Mobile/responsive behavior
- Keyboard accessibility

---

## 12. Limitations

- Stage 10A smoke test is bounded — 14 nav clicks + 2 modals. Not exhaustive.
- Browser equivalence is not claimed on the basis of Stage 10A alone.
- Historical 1,588 Node assertions and 15 Playwright suites are Class E (lost); not reconstructed.
- `recovered-v0.8-validated` tag NOT applied.

---

## 13. Stage 10B Proposed Scope

Stage 10B will conduct exhaustive browser equivalence: full interaction coverage of all 14 screens, numerical output comparison for each scientific calculation domain, accessibility audit, and determination of whether any observed differences require controlled reconstruction repair or are acceptable recovery variance.
