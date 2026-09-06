# v0.9 Technical Debt Register

Recorded during Stage 11A. No fixes are applied yet.

---

## TD-001: 19 Repeated `ReactDOM.createRoot`/`render` Statements

**Source:** `src/ui/app-shell.jsx` (frozen v0.8), copied unchanged into `v09/src/ui/app-shell.jsx`.

**Status:** VALIDATED v0.8 CHARACTERISTIC (Stages 10A–10D confirmed zero functional discrepancy; root ends with 1 DOM child regardless of the 19 repeated calls).

**v0.9 decision:** Eligible for cleanup in the v0.9 derivative only. The frozen root `src/ui/app-shell.jsx` must never be modified. Any deduplication happens exclusively in `v09/src/ui/app-shell.jsx` (or its eventual replacement), with full regression testing before/after.

---

## TD-002: Runtime Babel Standalone Transformation

**Status: PARTIALLY_RESOLVED_STAGE_11C1**

**Source:** `src/ui/runtime-bootstrap.js` — transforms JSX at runtime in-browser via `Babel.transform(..., {presets: [["react", {runtime: "classic"}]]})`.

**Stage 11C1 resolution:** The new Vite bridge (`v09/app-bridge/`, built via `npm run build:bridge`) uses build-time JSX transformation through `@vitejs/plugin-react` — **no runtime Babel** exists in this new path, and the Babel deoptimisation console warning does not occur in the Vite bridge (verified: 0 occurrences of `Babel.transform` in the built output).

**What remains unresolved:** The frozen Stage 11B compatibility artifact (`v09/dist/precimind-v0.9-compat.html`), assembled by the still-frozen `v09/tools/assemble-v09-compat.js`, still uses runtime Babel — this is intentional. It remains available as a **historical/migration reference artifact** for browser-equivalence comparisons (as used throughout Stage 11C1's own equivalence testing) and must not be modified. Full resolution — i.e. no runtime-Babel path existing anywhere in active development — occurs only once Stage 11C2 completes the ES-module migration and the Vite build becomes the sole active development path.

---

## TD-003: CommonJS Recovery Wrappers in Composite Scientific Modules

**Status: OPEN — Stage 11C2**

**Source:** 14 modules (identified precisely via Stage 11C1 source inspection — see `v09/docs/V09_MODULE_DEPENDENCY_GRAPH.md` Section 6) contain guarded `if (typeof module !== "undefined" && module.exports) {...}` blocks added during recovery, not originally part of the browser-executed source.

**Status:** Harmless in browser context (guard evaluates false, confirmed safe in both the Stage 11B runtime-Babel path and the new Stage 11C1 Vite bridge); used by the Node test suites to import the scientific functions for unit testing.

**Not resolved in Stage 11C1** (explicitly out of scope — Stage 11C1 performs no CommonJS-to-ES-module conversion). Stage 11C2 should replace each guard with a plain `export { ... }` per the recommended migration order in the dependency graph document (pure-calculation modules first, since all 14 guarded modules are calculation/data modules with zero or minimal cross-module dependencies).

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

## Priority (Updated Post-Stage-11C1)

1. ~~TD-004 / AD-001 / AD-002 / AD-003 (accessibility)~~ — **DONE, Stage 11B**
2. ~~TD-005 (testing architecture)~~ — **DONE, Stage 11B**
3. ~~TD-002 (runtime Babel)~~ — **PARTIALLY DONE, Stage 11C1** (new Vite bridge path has zero runtime Babel; frozen Stage 11B artifact intentionally retains it as historical reference)
4. **TD-003 (CommonJS wrapper → ES module conversion) — Stage 11C2, next priority.** Now precisely scoped: 14 modules, zero cross-module dependencies among 9 of them, recommended migration order documented in `V09_MODULE_DEPENDENCY_GRAPH.md`.
5. TD-001 (19-mount cleanup) — remains lowest priority; **not addressed in Stage 11C1** either (frozen source unchanged, bridge preserves all 19 calls exactly). Stage 11C2's single-root conversion (Section 13 of the dependency graph document) is the natural point to resolve this, since it already requires touching `app-shell.jsx`'s mount logic.
