# ADR-001: v0.9 Application Architecture

**Status:** ACCEPTED — TARGET VITE/REACT UNIFIED BUILD, MIGRATION DEFERRED TO STAGE 11C  
**Stage:** 11A (proposed) → 11B (accepted, refined) → 11C1 (bridge established)  
**Decision made:** Stage 11B

**Implementation status:**
- **Stage 11C1: VITE BUILD BRIDGE ESTABLISHED.** A package-managed React/Vite toolchain exists under `v09/` (React 19.2.8, ReactDOM 19.2.8, Vite 8.2.2, @vitejs/plugin-react 6.1.1). This remains available as a frozen migration-reference artifact (`v09/app-bridge/`, `v09/dist-vite-bridge/`, tree SHA `c0407262...`).
- **Stage 11C2: ES-MODULE MIGRATION COMPLETE. SINGLE REACT ROOT COMPLETE. UNIFIED VITE/REACT ACTIVE ARCHITECTURE ESTABLISHED.** All 34 modules are now genuine ES modules under `v09/app/**`, with explicit imports/exports, zero CommonJS wrappers, zero implicit cross-file globals, and exactly one authored `createRoot(...).render(<App />)` call (`v09/app/main.jsx`). Verified via: 34/34 strict source-transform PASS (surgical migration only, no scientific/pedagogic content altered), a clean active import graph (0 missing imports, 0 unresolved imports, 0 cycles, 0 CommonJS, 0 bare hook globals), scientific parity testing directly against the active modules (25/25), and full browser equivalence against the frozen Stage 11C1 bridge reference (63/63 MATCH, 0 UNEXPECTED_DIFFERENCE, 0 BLOCKED, including all 8 genuine scientific interactions and pixel-identical screenshots).

**Active source is now `v09/app/**`.** `v09/src/**` is retained as a read-only historical/migration reference. The Stage 11C1 bridge (`v09/app-bridge/**`, `v09/dist-vite-bridge/**`) is retained only as a frozen migration-reference artifact, not part of the active development/build/runtime path.

---

## Context

v0.8 uses a standalone, single-HTML-file architecture: React, ReactDOM, and Babel Standalone are embedded directly in the page; application source is stored in a `<script id="app-source" type="text/plain">` block and transformed to executable JavaScript **at runtime in the browser** via `Babel.transform()`. This was the original v0.8 design and has been faithfully recovered and validated (Stages 1–10F, 3849 Node assertions, 452 zero-difference browser checkpoints).

Morning QC Room will add substantially more state, case data, and interaction complexity than any existing single lab. This ADR evaluates whether to keep the standalone runtime-Babel architecture or move to a build-time bundling approach for v0.9.

---

## Options Considered

### Option A: Continue Standalone Babel-in-Browser Architecture

Keep the exact v0.8 pattern: one HTML file, embedded vendor libraries, runtime JSX transformation.

**Pros:**
- Zero build tooling required — edit source, refresh browser
- Trivially deployable: one file, works from `file://` or any static host, no server config
- Matches the validated v0.8 baseline exactly — lowest risk of introducing new discrepancies
- Excellent for offline educational use (single file can be copied to a USB drive, emailed, etc.)
- No npm/build dependency chain to maintain or go stale

**Cons:**
- Runtime Babel transformation cost grows with source size (already produces a deoptimisation warning at v0.8's ~3.5MB combined source)
- No tree-shaking, code-splitting, or minification — the whole app ships and transforms as one blob
- No TypeScript or modern tooling support without additional runtime cost
- Harder to unit-test individual modules in isolation using standard JS tooling (mitigated in v0.8 by the CommonJS guard wrappers — see TD-003)
- Scales poorly as Morning QC Room adds case data and engine logic

### Option B: Vite + React Build

Move to a conventional Vite-based build: ES modules, JSX compiled ahead-of-time, dev server with HMR, production build produces optimized static assets.

**Pros:**
- Compile-time JSX — eliminates runtime Babel cost and the deoptimisation warning entirely (TD-002)
- Tree-shaking and code-splitting — Morning QC Room's case data and engine can be lazily loaded
- Standard ES module imports/exports — removes the CommonJS wrapper pattern (TD-003)
- Fast dev server with hot module replacement — much faster iteration for Morning QC Room's complex UI
- Easy path to TypeScript if desired later
- Still produces static output deployable to any static host (GitHub Pages, S3, etc.) — offline use remains possible (a built `dist/` folder can still be opened locally, though `file://` module loading has caveats depending on browser)

**Cons:**
- Requires Node.js + npm toolchain to build (not to run) — adds a build step that doesn't exist in v0.8
- Slightly more complex deployment (must run `npm run build` and serve the `dist/` output rather than a single file)
- Some divergence from the exact v0.8 single-file mental model — must be careful this doesn't complicate future reference comparisons back to v0.8
- Introduces new dependency surface (Vite, its plugins) that must itself be maintained

### Option C: Other Minimal Bundling Architecture

Considered esbuild directly, or a simpler Rollup config, as leaner alternatives to Vite.

**Assessment:** Vite already wraps esbuild for dev and Rollup for production build, giving the benefits of both without hand-rolling the config. A bespoke esbuild-only or Rollup-only setup would require more manual configuration for React JSX, asset handling, and dev server behavior with no clear benefit over Vite for this project's scale. Option C does not offer genuine superiority over Option B for this project and is not recommended as a separate path.

---

## Evaluation Against Criteria

| Criterion | Option A (standalone) | Option B (Vite) |
|---|---|---|
| Reproducibility | High (matches validated v0.8 exactly) | High (deterministic build output) |
| Scientific-function testability | Adequate (via CommonJS guards) | Better (native ES module imports, standard test runners) |
| Ease of deployment | Best (single file) | Good (static `dist/` folder) |
| Static-host hosting | Trivial | Straightforward |
| Maintenance | Simple now, harder as app grows | More moving parts, but each is well-supported |
| Offline educational use | Best (works from any file location) | Good (built assets are static; some caveats with `file://`) |
| Browser compatibility | Wide (Babel transforms for compatibility) | Wide (Vite/Rollup output targets configurable) |
| Bundle size | Larger (no tree-shaking, ships whole app) | Smaller (tree-shaking, code-splitting) |
| Ease of versioning | Simple (one file, diffable) | Standard (package.json + lockfile versioning) |
| Future Morning QC Room complexity | Risky — runtime transform cost will keep growing | Well-suited — this is exactly the complexity budget a build step is for |
| Risk of unnecessary engineering | Low complexity added | Some — must ensure the build step earns its complexity cost |

---

## Stage 11A Recommendation (Superseded — See Stage 11B Refinement Below)

Stage 11A initially recommended: "Adopt Vite for new v0.9 development (Morning QC Room) while existing labs remain under the current standalone architecture." Stage 11B analysis determined this would create an **awkward split-runtime design** — two parallel application architectures (standalone runtime-Babel for the 11 inherited labs, Vite/React for Morning QC Room) that would have to coexist indefinitely, each requiring separate tooling, separate mental models for contributors, and — worst of all — Morning QC Room would not be able to cleanly share state, navigation, or UI primitives with the inherited labs without an awkward bridge layer between two runtimes.

**This split-runtime approach is REJECTED as a final architecture.**

---

## Stage 11B Refined Decision: Unified Target Architecture

**TARGET ARCHITECTURE:** A single unified v0.9 build/runtime should eventually host **both** the inherited labs and Morning QC Room, built with Vite + React.

### Refined Architecture Principles

1. **One React runtime.** Both the inherited 11 labs and Morning QC Room run inside the same React tree, sharing the same app shell, navigation, and level-selection state — not two separate applications stitched together.
2. **One v0.9 build.** A single Vite build produces the deployable v0.9 artifact. No parallel build pipelines.
3. **Deterministic ES-module boundaries.** Every module (inherited or new) uses standard `import`/`export` — this retires the CommonJS guard-wrapper pattern (TD-003) as part of the migration, rather than perpetuating it alongside a second, cleaner module system.
4. **Inherited labs behavior-preserved.** The migration of the 11 existing labs into the unified build must be validated for browser equivalence against the v0.8 baseline (the same rigor as Stages 10A–10F), not merely "ported and assumed correct."
5. **Morning QC Room integrated into the same application shell** from the start — not bolted on as an isolated route with its own state management.
6. **Optional single-file/offline packaging is a RELEASE OUTPUT, not a second development runtime.** If offline/single-file distribution remains valuable (e.g., for classrooms without reliable internet), that is solved by a packaging step *after* the unified Vite build (e.g., bundling the built static assets plus a tiny static-file server, or an Electron/Tauri-style wrapper) — not by maintaining a second, parallel hand-authored standalone HTML architecture indefinitely.

### Why This Avoids the Split-Runtime Trap

The Stage 11A recommendation optimized for *minimizing short-term risk* (don't touch the validated labs) at the cost of *long-term architectural coherence* (two runtimes forever). Stage 11B accepts a small amount of additional short-term migration risk — mitigated by rigorous browser-equivalence testing, exactly as the v0.8 recovery already demonstrated is achievable — in exchange for a single coherent codebase that Morning QC Room, and any future v1.0 feature, can build on without an ever-widening architectural fork.

### Migration Timing

**No migration occurs in Stage 11B.** The migration itself is scoped as its own auditable change: **Stage 11C — Unified v0.9 Build Migration** (see `V09_ROADMAP.md`). Stage 11B's role is to make this decision explicit and reasoned, not to execute it.

---

## Resolved Questions (Previously Open in Stage 11A)

1. **Should the 11 existing labs eventually be migrated into the Vite build, or permanently remain on the standalone runtime-Babel architecture?** — **Resolved:** Yes, migrated, as part of Stage 11C, to avoid the split-runtime problem identified above.
2. **If migrated, what is the plan for re-validating browser equivalence against the v0.8 baseline after the migration?** — **Resolved (in principle, detailed in Stage 11C):** The same Playwright-based differential methodology used in Stages 10A–10F (original v0.8 reference vs. migrated candidate, checkpoint classification MATCH/INTENDED_DELTA/UNEXPECTED_DIFFERENCE/BLOCKED) will be reused, since it is already proven and the tooling already exists.
3. **What is the acceptable bundle size / load time budget for the combined v0.9 application once Morning QC Room is added?** — **Still open**, to be defined during Stage 11C planning once Morning QC Room's data-volume needs are better understood (deferred, not resolved by this ADR).
