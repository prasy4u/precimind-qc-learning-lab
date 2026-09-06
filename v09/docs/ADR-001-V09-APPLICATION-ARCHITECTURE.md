# ADR-001: v0.9 Application Architecture

**Status:** Proposed (not implemented)  
**Stage:** 11A  
**Decision needed by:** Stage 11B

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

## Recommendation

**Adopt Option B (Vite + React) for new v0.9 development, specifically for Morning QC Room and any substantially new module**, while:

1. Leaving `v09/src/` as an initially faithful copy of v0.8 (per the baseline map) that can continue to be assembled with the existing `tools/assemble-v08.js`-style approach if a single-file v0.9 build is still desired for some deployment contexts, AND
2. Introducing a Vite-based build path for the new Morning QC Room modules once Stage 12+ begins.

**Rationale:** Morning QC Room is exactly the kind of feature (large case data sets, complex state machine, many interacting UI components) that justifies a build step's added complexity. The existing 13 labs do not need to be migrated as part of this decision — they can continue to run under the current architecture, minimizing risk to already-validated behavior. The build-system decision is scoped to *new* v0.9 work, not a mandatory rewrite of validated v0.8-derived code.

**This is a recommendation only. No build tooling is installed or configured in Stage 11A.** Formal adoption is deferred to Stage 11B, where the specific Vite configuration, module boundaries, and migration plan (if any) for existing labs will be decided.

---

## Open Questions for Stage 11B

1. Should the 13 existing labs eventually be migrated into the Vite build, or permanently remain on the standalone runtime-Babel architecture?
2. If migrated, what is the plan for re-validating browser equivalence against the v0.8 baseline after the migration?
3. What is the acceptable bundle size / load time budget for the combined v0.9 application once Morning QC Room is added?
