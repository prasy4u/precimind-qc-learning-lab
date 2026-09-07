# v0.9 Technical Debt Register

Recorded during Stage 11A. No fixes are applied yet.

---

## TD-001: 19 Repeated `ReactDOM.createRoot`/`render` Statements

**Status: RESOLVED_STAGE_11C2**

**Source:** `src/ui/app-shell.jsx` (frozen v0.8/Stage-11B/Stage-11C1 reference), unchanged in `v09/src/ui/app-shell.jsx`.

**Corrected provenance (Stage 11C2 corrective closure):** The prior wording here overstated what the v0.8 recovery actually established. The accurate historical record is:
- v0.8 retained the historical 19 mounts unchanged.
- Stage 10B measured only the externally observable final root state — `#root` ended with exactly one DOM child, in both the original artifact and the faithful candidate.
- The internal React-root disposition (what happens when 19 `createRoot` calls execute against the same DOM node) was **not instrumented**.
- **No controlled 19-versus-1 equivalence experiment existed anywhere in the v0.8 recovery.** The prior claim that "Stages 10A–10D confirmed zero functional discrepancy" for a 19-vs-1 comparison was inaccurate — that comparison was never performed at that time.
- **Stage 11C2 is the first stage that experimentally establishes observable equivalence of a single-root architecture** against the frozen 19-mount Stage 11C1 Vite bridge reference, via full browser-equivalence testing (63/63 MATCH, 0 UNEXPECTED_DIFFERENCE, 0 BLOCKED — see `v09/tests/browser/v09-stage11c2-modular-equivalence-result.json`).

**v0.9 resolution:** `v09/src/ui/app-shell.jsx` is now frozen (read-only historical/migration reference) and must never be modified — deduplication does NOT happen there. The active single-root application lives in `v09/app/**`: the migrated `v09/app/ui/app-shell.jsx` contains zero mount calls, and a single authored `createRoot(...).render(<App />)` call lives in `v09/app/main.jsx`. This was verified experimentally, not assumed safe from prior documentation.

---

## TD-002: Runtime Babel Standalone Transformation

**Status: RESOLVED_FOR_ACTIVE_V0.9_RUNTIME**

**Source:** `src/ui/runtime-bootstrap.js` — transforms JSX at runtime in-browser via `Babel.transform(..., {presets: [["react", {runtime: "classic"}]]})`.

**Stage 11C1 partial resolution:** The Vite bridge path (`v09/dist-vite-bridge/`) eliminated runtime Babel for that intermediate migration step.

**Stage 11C2 full resolution for the active runtime:** The final active modular build (`v09/dist-vite/`) uses build-time JSX transformation exclusively (`@vitejs/plugin-react`). Verified: zero `Babel.transform` occurrences in the active build output.

**What remains, by design:** The frozen Stage 11B compatibility artifact (`v09/dist/precimind-v0.9-compat.html`) still uses runtime Babel — this is intentional and must not be changed. It remains a historical/migration-reference artifact, not part of the active development/build/runtime path.

## TD-003: CommonJS Recovery Wrappers in Composite Scientific Modules

**Status: RESOLVED_FOR_ACTIVE_V0.9_RUNTIME_STAGE_11C2**

**Source:** 14 modules (identified precisely via Stage 11C1 source inspection) previously contained guarded `if (typeof module !== "undefined" && module.exports) {...}` blocks added during recovery, not originally part of the browser-executed source.

**Stage 11C2 resolution:** All 14 guards removed from the active `v09/app/**` tree; declarations converted to genuine named ES `export` statements. Verified: zero CommonJS wrapper files remain in `v09/app/**` (import-graph governance check). The wrappers remain only in the frozen `v09/src/**` reference tree, where they must stay unchanged as historical evidence.

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

## Priority (Updated Post-Stage-11C2)

1. ~~TD-004 / AD-001 / AD-002 / AD-003 (accessibility)~~ — **DONE, Stage 11B**
2. ~~TD-005 (testing architecture)~~ — **DONE, Stage 11B**
3. ~~TD-002 (runtime Babel)~~ — **RESOLVED_FOR_ACTIVE_V0.9_RUNTIME, Stage 11C2** (the active `v09/dist-vite/` build has zero runtime Babel; the frozen Stage 11B compatibility artifact intentionally retains it as historical reference)
4. ~~TD-003 (CommonJS wrapper → ES module conversion)~~ — **RESOLVED_FOR_ACTIVE_V0.9_RUNTIME_STAGE_11C2.** All 14 previously-guarded modules now use plain ES `export` in the active `v09/app/**` tree; wrappers remain only in the frozen `v09/src/**` reference.
5. ~~TD-001 (19-mount cleanup)~~ — **RESOLVED_STAGE_11C2.** The active modular `v09/app/ui/app-shell.jsx` contains zero mount calls; a single authored `createRoot(...).render(<App />)` call now lives in `v09/app/main.jsx`. Verified experimentally via full browser equivalence against the frozen Stage 11C1 bridge (63/63 MATCH) — this was NOT assumed safe from prior documentation; Stage 11C2 established the equivalence itself. The historical 19 mounts remain unchanged in the frozen `v09/src/ui/app-shell.jsx` and the frozen Stage 11C1 bridge, as historical/reference evidence only.

All five technical-debt items tracked in this document are now resolved for the active v0.9 runtime. Remaining work moves to Stage 12A (Morning QC Room), which is gated on independent audit acceptance of Stage 11C2, not self-authorized here.
