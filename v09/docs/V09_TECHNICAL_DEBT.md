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

**Status: FIXED_STAGE_11B**

Cross-referenced with `V09_ACCESSIBILITY_DEBT.md` (AD-001, AD-002, AD-003). All three synthetic `role="button"` SVG controls found in `v09/src` (Rule Detective, LJ chart, EQA chart) were fixed in Stage 11B: a single shared activation function per control now handles click, Enter, and Space identically. Verified by the maintained `v09/tests/browser/v09-accessibility.e2e.js` (0 UNEXPECTED_DIFFERENCE, 4 documented INTENDED_DELTA) and the new `v09/tests/integration/v09-accessibility-source.test.js` (30/30 assertions).

---

## TD-005: Testing Architecture Grew Organically Through Recovery

**Status: FORMALIZED_STAGE_11B**

The v0.8 recovery produced 30 Node test suites (3849 assertions) plus multiple ad hoc Playwright browser harnesses (Stages 10B–10F), each written to answer a specific validation question rather than as a designed test architecture. These remain frozen and authoritative for v0.8.

**Stage 11B formalized three v0.9 layers** (see `V09_TEST_ARCHITECTURE.md`):
1. **Unit layer** (`v09/tests/unit/`) — a compatibility gate re-verifying critical frozen scientific signatures against the copied v09/src functions (28 assertions), NOT a replacement for the full v0.8 suite.
2. **Integration layer** (`v09/tests/integration/`) — source-level behavioral assertions for component/screen semantics including accessibility state (30 assertions for the Stage 11B accessibility fixes).
3. **Browser/E2E layer** (`v09/tests/browser/`) — one maintained Playwright file (`v09-accessibility.e2e.js`), re-run and extended across stages rather than rewritten per stage.

---

## Decision Record: ADR-001 (Stage 11B)

**Status: ACCEPTED — target unified Vite/React build for both inherited labs and Morning QC Room.** The Stage 11A "split-runtime" recommendation (Vite for new work, standalone for existing labs) was rejected as an eventual architectural trap. Migration is deferred to Stage 11C as its own auditable change — no build tooling is installed in Stage 11B. See `ADR-001-V09-APPLICATION-ARCHITECTURE.md` for full rationale.

---

## Priority (Updated Post-Stage-11B)

1. ~~TD-004 / AD-001 / AD-002 / AD-003 (accessibility)~~ — **DONE, Stage 11B**
2. ~~TD-005 (testing architecture)~~ — **DONE, Stage 11B**
3. **TD-002 / ADR-001 migration (Stage 11C)** — now the next priority: unified Vite/React build, retiring the runtime-Babel path for v0.9 going forward
4. TD-003 (module export cleanup) — folded into the Stage 11C migration (ES modules replace CommonJS guards as part of the same change)
5. TD-001 (19-mount cleanup) — remains lowest priority; **not addressed in Stage 11B**, and not required by the Stage 11C migration decision either (may be revisited afterward if still relevant under the new build)
