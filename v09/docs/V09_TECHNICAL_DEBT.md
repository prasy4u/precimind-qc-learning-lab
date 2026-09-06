# v0.9 Technical Debt Register

Recorded during Stage 11A. No fixes are applied yet.

---

## TD-001: 19 Repeated `ReactDOM.createRoot`/`render` Statements

**Source:** `src/ui/app-shell.jsx` (frozen v0.8), copied unchanged into `v09/src/ui/app-shell.jsx`.

**Status:** VALIDATED v0.8 CHARACTERISTIC (Stages 10A–10D confirmed zero functional discrepancy; root ends with 1 DOM child regardless of the 19 repeated calls).

**v0.9 decision:** Eligible for cleanup in the v0.9 derivative only. The frozen root `src/ui/app-shell.jsx` must never be modified. Any deduplication happens exclusively in `v09/src/ui/app-shell.jsx` (or its eventual replacement), with full regression testing before/after.

---

## TD-002: Runtime Babel Standalone Transformation

**Source:** `src/ui/runtime-bootstrap.js` — transforms JSX at runtime in-browser via `Babel.transform(..., {presets: [["react", {runtime: "classic"}]]})`.

**Status:** Validated, functional, but performance-costly (Babel deoptimisation warning observed for >500KB source in Stages 10A/10B).

**Potential v0.9 improvement:** Move to build-time JSX transformation (see ADR-001). Would eliminate the runtime Babel dependency, reduce load time, and remove the Babel deoptimisation warning.

---

## TD-003: CommonJS Recovery Wrappers in Composite Scientific Modules

**Source:** The 10 composite modules (`statistics.js`, `engine.js`, `functions.js`, `core.js`, `detection-delay.js`, `risk/data.js`, `investigation/calc.js`, `eqa/calc.js`, `bv/calc.js`, `pbrtqc/calc.js`) contain guarded `if (typeof module !== "undefined" && module.exports) {...}` blocks added during recovery, not originally part of the browser-executed source.

**Status:** Harmless in browser context (guard evaluates false); used by the Node test suites to import the scientific functions for unit testing.

**Potential v0.9 improvement:** Adopt clean ES module `export`/`import` syntax throughout `v09/src`, compatible with a build step (see ADR-001), removing the dual CommonJS/browser-global pattern.

---

## TD-004: SVG `role="button"` Keyboard Activation Inconsistency

Cross-referenced with `V09_ACCESSIBILITY_DEBT.md` (AD-001, AD-002). Tracked here as a technical-debt item because the fix involves a code-level pattern (missing `onKeyDown` handlers on synthetic button roles), not purely a content/documentation issue.

---

## TD-005: Testing Architecture Grew Organically Through Recovery

**Status:** The v0.8 recovery produced 30 Node test suites (3849 assertions) plus multiple ad hoc Playwright browser harnesses (Stages 10B–10F), each written to answer a specific validation question rather than as a designed test architecture.

**Potential v0.9 improvement:** Formalize into three explicit layers:
1. **Unit layer** — pure scientific function tests (statistics, rules engine, risk, investigation, EQA, BV, PBRTQC calculations) — largely already exists and should be preserved/ported.
2. **Integration layer** — UI component and screen-level tests.
3. **Browser/E2E layer** — a single maintained Playwright suite (not one-off scripts per stage) covering critical user journeys, including Morning QC Room once built.

---

## Priority (Informal, Subject to Stage 11B Refinement)

1. TD-004 / AD-001 / AD-002 (accessibility — user-facing, low risk to fix in isolation)
2. TD-005 (testing architecture — enables safer work on everything else)
3. TD-002 / ADR-001 decision (build system — affects all future development velocity)
4. TD-003 (module export cleanup — depends on ADR-001 outcome)
5. TD-001 (mount cleanup — cosmetic, no demonstrated functional benefit, lowest priority)
