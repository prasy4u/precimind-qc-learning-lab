# v0.9 Module Dependency Graph — Stage 11C1

**Machine-readable source:** `v09/docs/v09-module-dependency-graph.json`

---

## 1. Scope and Method

This document explains the dependency structure of the **34 accepted Stage 11B application modules**, listed in `v09/tools/v09-source-order.json`, in preparation for the Stage 11C2 ES-module migration. **Exactly 34 application modules were inspected** — CSS (`src/ui/original-v0.8.css`) and the runtime bootstrap (`src/ui/runtime-bootstrap.js`) are tracked separately in the source manifest and are not counted among the 34.

**Method:** each module's raw source was read directly and analyzed via:
1. Top-level `function Name(...)` and `const/let/var Name = ...` (including destructuring) declarations → **defines**.
2. All identifier usages in code, with string literals, template-literal text, and comments explicitly stripped before scanning (a first analysis pass without this exclusion produced several false positives — module names that were only *mentioned in documentation/evidence-note text*, not actually referenced in code; these were caught and discarded by cross-checking the surrounding source).
3. Cross-referencing each module's used-but-not-locally-defined identifiers against the full 34-module define map, to determine genuine cross-module consumption.
4. Manual source inspection to confirm high-value findings: the implicit React-hook global pattern, the exact 19-mount-call count, and the zero-collision result.

Dependencies were **not** inferred from filenames, directory names, or domain labels. Every dependency reported below was confirmed by direct code-level cross-reference.

---

## 2. Broad Dependency Layering

The 34 modules fall into a clean, strictly layered structure (see below — **zero cycles were found**, see Section 4):

| Layer | Modules | Description |
|---|---|---|
| **1. Pure calculation (leaf)** | statistics.js, rules/engine.js, opchar/functions.js, strategy/core.js, risk/detection-delay.js, investigation/calc.js, eqa/calc.js, bv/calc.js, pbrtqc/calc.js (9 modules) | Zero dependencies on any other of the 34 modules. All 9 are CommonJS-guarded. |
| **2. Static data (leaf or near-leaf)** | app-data.js, rules/data.js, risk/data.js, investigation/data.js, eqa/data.js, bv/data.js, pbrtqc/data.js, strategy/aps-ui-data.js (8 modules) | Mostly declarative content/data. Only `rules/data.js` and `app-data.js` have a genuine (not just documentation-text) dependency, both on `roundTo()` from statistics.js. |
| **3. Shared UI infrastructure** | shared-components.jsx, core-screens.jsx | Broad fan-out — consumed by most later modules. `shared-components.jsx` is the sole source of the implicit React-hook global (see Section 4B). |
| **4. Domain UI components** | rules/ui-components.jsx, strategy/ui-components.jsx, risk/ui-components.jsx, investigation/ui-components.jsx, eqa/ui-components.jsx, bv/ui-components.jsx, pbrtqc/ui-components.jsx (7 modules) | Consume their domain's calc/data modules plus shared-components.jsx. |
| **5. Domain screens** | rules/screens.jsx, strategy/screens.jsx, risk/screens.jsx, investigation/screens.jsx, eqa/screens.jsx, bv/screens.jsx, pbrtqc/screens.jsx (7 modules) | Compose domain UI components into the full lab screen. `strategy/screens.jsx` is itself consumed by 4 later domain screens (risk, investigation, eqa reuse `ExerciseRevealCard` and similar shared exercise components defined there). |
| **6. App shell (runtime entry)** | app-shell.jsx | Consumes all 7 domain screens directly, plus app-data.js and core-screens.jsx. Contains the 19 historical mount calls. |

---

## 3. Major Shared Globals

### A. `React` hook destructuring (the primary implicit global)

`src/ui/shared-components.jsx` (module order 3) contains, at top level:

```js
const { useState, useMemo, useRef, useEffect } = React;
```

Because the historical v0.8/Stage-11B assembly model **concatenates all 34 modules into a single script scope** (whether via the runtime-Babel bootstrap or the Stage 11C1 Vite bridge's single generated entry file), this destructuring makes `useState`, `useMemo`, `useRef`, and `useEffect` available as **bare identifiers** to every module concatenated *after* it — without any local import.

**12 of the 34 modules rely on this implicit global** (confirmed by direct grep — each calls `useState(`/`useMemo(`/`useRef(`/`useEffect(` with zero local import or destructuring of its own):

`bv/screens.jsx`, `eqa/screens.jsx`, `eqa/ui-components.jsx`, `investigation/screens.jsx`, `investigation/ui-components.jsx`, `pbrtqc/screens.jsx`, `risk/screens.jsx`, `rules/screens.jsx`, `rules/ui-components.jsx`, `strategy/screens.jsx`, `ui/app-shell.jsx`, `ui/core-screens.jsx`.

**This is the single highest-priority Stage 11C2 migration item.** Under true ES modules, each of these 12 files must gain its own `import { useState, useMemo, useRef, useEffect } from "react";` (only the specific hooks each file actually uses) — the current concatenation-scope sharing will not survive module-boundary conversion.

### B. No other implicit globals of comparable scope were found

Beyond the React-hook pattern, no other cross-file bare-identifier reliance was detected. All other cross-module usage is through clearly named top-level declarations (functions, constants, components) that a static analyzer can trace to their defining module — these become ordinary named ES imports in Stage 11C2, not implicit-global fixes.

---

## 4. Actual/Likely Cycles

**Zero circular dependencies were found.** Every module's cross-module consumption was checked against the accepted 34-module load order; in every single case, the consumed identifier's defining module has a **lower** order number than the consuming module (i.e., strictly forward references only, consistent with a script-concatenation model where each module executes after everything it needs has already been defined).

An initial automated pass incorrectly flagged 6 apparent "backward dependencies" — all in `src/ui/app-data.js` (module 2), referencing `calculateClassicalRcv`, `calculateLognormalRcv` (bv/calc.js, module 26), `MILAN_MODELS` (strategy/core.js, module 10), `describeSchemeCapability` (eqa/calc.js, module 22), and two constants from eqa/data.js (module 23). **Manual inspection confirmed these are false positives** — every one of the 6 occurrences is inside a documentation/evidence-note string (`informs: "..."`) describing, in prose, what another module's function does. None is an actual code reference. After excluding string-literal content from the identifier scan, all 6 disappeared, and the true backward-dependency count is zero.

This distinction matters directly for Stage 11C2: **there is no genuine semantic cycle requiring a temporary adapter or restructuring** — the dependency graph, once documentation-text false positives are removed, is a clean DAG (directed acyclic graph) matching the accepted module order exactly.

---

## 5. Collision Risks

**Zero identifier collisions were found.** Every top-level `function`/`const`/`let`/`var` name declared across all 34 modules is globally unique — no two modules define the same top-level identifier. This means Stage 11C2's conversion to ES-module named exports/imports will not require renaming any exported symbol to avoid a naming clash.

---

## 6. CommonJS Recovery-Wrapper Patterns

**14 of the 34 modules** contain a guarded CommonJS export block of the form:

```js
if (typeof module !== "undefined" && module.exports) {
  module.exports = { ...names... };
}
```

All 14 are **pure-calculation or calculation-adjacent modules**: `core/statistics.js`, `rules/engine.js`, `opchar/functions.js`, `strategy/core.js`, `risk/detection-delay.js`, `risk/data.js`, `investigation/calc.js`, `investigation/data.js`, `eqa/calc.js`, `eqa/data.js`, `bv/calc.js`, `bv/data.js`, `pbrtqc/calc.js`, `pbrtqc/data.js`.

This guard was added during the v0.8 recovery to let the root-level Node test suites (`tests/stage*.test.js`) `require()` these functions directly for unit testing, while remaining harmless in the browser (where `typeof module` safely evaluates to `"undefined"`, so the guard body never executes). **Stage 11C2 should replace each guard with a plain `export { name1, name2, ... }`** (or named `export function`/`export const` at each declaration site) — the guard's dual-purpose (browser-safe + Node-testable) role is naturally satisfied by standard ES module exports, which both a bundler and a modern Node ESM-aware test runner can consume directly.

---

## 7. Pure Calculation Modules (Low Risk, Migrate First)

The 9 zero-dependency, CommonJS-guarded calculation modules are the **lowest-risk, highest-priority candidates for early Stage 11C2 migration**:

`core/statistics.js`, `rules/engine.js`, `opchar/functions.js`, `strategy/core.js`, `risk/detection-delay.js`, `investigation/calc.js`, `eqa/calc.js`, `bv/calc.js`, `pbrtqc/calc.js`.

Each requires only: replace the CommonJS guard with `export { ... }` (or inline `export function` declarations). No import statements are needed (zero cross-module dependencies), and no implicit-global fix is needed (none use React hooks).

---

## 8. Static Data Modules

`app-data.js`, `rules/data.js`, `risk/data.js`, `investigation/data.js`, `eqa/data.js`, `bv/data.js`, `pbrtqc/data.js`, `strategy/aps-ui-data.js` — 8 modules, mostly declarative content (challenge text, scenario banks, glossary entries, evidence citations). Two (`app-data.js`, `rules/data.js`) have one genuine dependency each, on `roundTo()` from `statistics.js`; the rest are fully self-contained. Migration is straightforward: `export` the data constants, add the single `roundTo` import where needed.

---

## 9. Shared Components (Broad Fan-Out)

`src/ui/shared-components.jsx` (order 3) is consumed by **21 of the remaining 31 modules** (every domain `ui-components.jsx` and `screens.jsx` file, plus `core-screens.jsx` and `app-shell.jsx`), making it the single most widely-depended-upon module in the codebase. It is also the **sole source of the implicit React-hook global** (Section 3A) — the two concerns compound: Stage 11C2 must both (a) add explicit named imports from `shared-components.jsx` wherever `Badge`, `SliderField`, `MetricCard`, `LJChart`, etc. are used, and (b) add explicit `react` hook imports to the 12 modules currently relying on the implicit destructuring.

`src/ui/core-screens.jsx` (order 4) plays a similar but narrower shared role for the Home/Diagnostic/Competency-Map/Statistics/LJ/Pattern-Challenge/Evidence screens specifically (these are not organized under a per-domain subdirectory the way the 7 later labs are).

---

## 10. Domain Components

Each of the 7 later-added domain labs (Rules, Strategy, Risk, Investigation, EQA, BV, PBRTQC) follows an identical 4-module internal pattern: `calc.js` (pure functions) → `data.js` (static content) → `ui-components.jsx` (domain-specific components, consuming `shared-components.jsx`) → `screens.jsx` (full lab screen, composing the domain's UI components plus, in several cases, reusable exercise components from `strategy/screens.jsx`, e.g. `ExerciseRevealCard`).

---

## 11. Screens

All 7 domain `screens.jsx` modules are **MODERATE** risk (see Section 12) — not because of scientific sensitivity, but purely because of fan-in breadth (each consumes from 5–7 other modules) combined with the implicit hook-global reliance. `strategy/screens.jsx` additionally acts as a secondary shared-component source for 3 later domain screens (risk, investigation, eqa), which should be noted during migration ordering (`strategy/screens.jsx` must be converted, or at minimum its consumed exports stabilized, before those 3 dependents).

---

## 12. App Shell (Runtime Entry) — the Sole HIGH-Risk Module

`src/ui/app-shell.jsx` (order 34, the final module) is classified **HIGH** risk — the only module so classified — because it uniquely combines:
- The widest fan-in of any module (consumes from all 7 domain screens plus `app-data.js` and `core-screens.jsx` — 9 modules total)
- Definition of the single top-level `App()` component and `NAV_ITEMS` navigation table
- All **19 historical `ReactDOM.createRoot(rootEl).render(<App />)` mount calls**
- Maximum startup involvement — any migration error here breaks the entire application at load time, not just one lab screen

This is not a "scientifically important, therefore high risk" classification — app-shell.jsx contains no scientific calculations at all. The HIGH classification is earned purely by structural centrality and startup criticality.

---

## 13. Runtime/Startup Dependencies — the 19 Mounts and the Path to Single-Root

**Current state (frozen, unchanged in Stage 11C1):** `app-shell.jsx` contains exactly 19 syntactically identical occurrences of `ReactDOM.createRoot(rootEl).render(<App />);`. Stage 10A–10D (v0.8 recovery) established that this produces **zero observable functional difference** from a single mount call — the DOM ends up with exactly one root child regardless. The repeated calls are historical/recovered source, not an intentional design choice, and have no demonstrated behavioral purpose.

**Recommended Stage 11C2 approach:** once the 34 modules are converted to genuine ES modules with a single authored entry point, the natural single-root Vite/React pattern is:

```js
// entry point (e.g. src/main.jsx), NOT part of the 34 legacy modules
import { createRoot } from "react-dom/client";
import App from "./ui/app-shell.jsx"; // App exported, not the 19 mount lines

const rootEl = document.getElementById("root");
createRoot(rootEl).render(<App />);
```

The 19 repeated calls in `app-shell.jsx` should be **replaced by a single call**, with `App` exported as a named or default export instead of being mounted from within its own defining module. Because Stage 10A–10D already proved that reducing 19→1 produces no behavioral change (both produce the identical single-root outcome), this collapse is expected to be a **safe, low-risk** part of Stage 11C2's single-root conversion — but it should still be validated with the same before/after browser-equivalence rigor used throughout this project, not merely assumed safe from documentation alone.

---

## 14. Recommended Stage 11C2 Migration Order

Based on the layering above (Section 2) and the zero-cycle DAG structure (Section 4), the following order minimizes risk by converting leaf/low-fan-in modules first, so that by the time a module needing many imports is converted, all of its dependencies already export clean ES names:

1. **9 pure-calculation modules** (statistics, rules/engine, opchar, strategy/core, risk/detection-delay, investigation/calc, eqa/calc, bv/calc, pbrtqc/calc) — replace CommonJS guards with `export`, zero import changes needed.
2. **8 static-data modules** (app-data, rules/data, risk/data, investigation/data, eqa/data, bv/data, pbrtqc/data, strategy/aps-ui-data) — add `export`, plus the 2 modules needing `roundTo` add that one import.
3. **shared-components.jsx** — convert to `export`, and **replace the implicit hook-global pattern with a local `import { useState, useMemo, useRef, useEffect } from "react"`** (this module keeps the import for its own use; it simply stops being the accidental *source* of the global for everyone else).
4. **core-screens.jsx** — add imports from `shared-components.jsx`, `app-data.js`, `statistics.js`; add its own `react` hook import (no longer implicit).
5. **7 domain `ui-components.jsx` modules** — add imports from their domain's `calc.js`/`data.js` and from `shared-components.jsx`; add `react` hook imports where used (`eqa/ui-components.jsx`, `investigation/ui-components.jsx`, `rules/ui-components.jsx`).
6. **`strategy/screens.jsx` before the other 6 domain screens** — since risk/investigation/eqa screens consume shared exercise components from it.
7. **Remaining 6 domain `screens.jsx` modules** (rules, risk, investigation, eqa, bv, pbrtqc) — add their multi-module imports and `react` hook imports.
8. **`app-shell.jsx` last** — add imports from all 7 domain screens + app-data + core-screens + `react`/`react-dom/client`; **collapse the 19 mount calls to 1**; export `App` rather than self-mounting.
9. **New top-level entry file** (outside the 34 legacy modules) performs the single `createRoot(...).render(<App/>)` call.

---

## 15. Temporary Adapters

No temporary adapter layer is anticipated to be strictly *required* by the dependency structure itself (zero cycles, zero collisions). The one area where a thin adapter may ease the transition is the **React-hook global** (Section 3A): during an incremental Stage 11C2 rollout, if some of the 12 dependent modules are converted before `shared-components.jsx` itself, a temporary local hook re-export shim could bridge the gap — but the recommended order (Section 14, step 3 before steps 4–8) avoids needing this by converting `shared-components.jsx` before any of its 12 dependents.

---

## 16. Summary Statistics

| Metric | Value |
|---|---|
| Total application modules inspected | **34** |
| Modules with CommonJS recovery-wrapper guard | **14** |
| Modules relying on the implicit React-hook global | **12** |
| Identifier collisions found | **0** |
| Circular dependencies found | **0** (6 false-positive candidates from documentation-text mentions, ruled out by direct inspection) |
| Migration risk: LOW | **23** |
| Migration risk: MODERATE | **10** |
| Migration risk: HIGH | **1** (`src/ui/app-shell.jsx` only) |
| Historical `ReactDOM.createRoot` mount calls (unchanged in Stage 11C1) | **19**, all in `app-shell.jsx` |

Stage 11C2 is **not** performed in this stage. This document is architecture-planning input only.
