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

## 9. Shared Components (Broad Fan-Out) — Corrected Dependency Counts

**Corrected during the Stage 11C1 audit closure.** The previous version of this document stated an unsupported merged figure ("21 of the remaining 31 modules"). The verified counts, recomputed directly from the machine-readable graph, distinguish two genuinely different dependency mechanisms:

| Group | Count | Modules |
|---|---|---|
| **DIRECT** consumers of `shared-components.jsx` exported symbols (Badge, LJChart, MetricCard, Modal, SliderField, etc.) | **13** | `core-screens.jsx`, `rules/ui-components.jsx`, `rules/screens.jsx`, `strategy/ui-components.jsx`, `strategy/screens.jsx`, `risk/ui-components.jsx`, `risk/screens.jsx`, `investigation/screens.jsx`, `eqa/screens.jsx`, `bv/ui-components.jsx`, `bv/screens.jsx`, `pbrtqc/ui-components.jsx`, `pbrtqc/screens.jsx` |
| **IMPLICIT** React-hook-global consumers (bare `useState`/`useMemo`/`useRef`/`useEffect`, no local import — see Section 3A) | **12** | `core-screens.jsx`, `rules/ui-components.jsx`, `rules/screens.jsx`, `strategy/screens.jsx`, `risk/screens.jsx`, `investigation/ui-components.jsx`, `investigation/screens.jsx`, `eqa/ui-components.jsx`, `eqa/screens.jsx`, `bv/screens.jsx`, `pbrtqc/screens.jsx`, `app-shell.jsx` |
| **In BOTH groups** (direct consumer AND implicit-hook reliant) | **9** | `core-screens.jsx`, `rules/ui-components.jsx`, `rules/screens.jsx`, `strategy/screens.jsx`, `risk/screens.jsx`, `investigation/screens.jsx`, `eqa/screens.jsx`, `bv/screens.jsx`, `pbrtqc/screens.jsx` |
| **UNION** (either direct OR implicit) | **16** | (the 13 direct + the 3 implicit-only: `investigation/ui-components.jsx`, `eqa/ui-components.jsx`, `app-shell.jsx`) |

These are two **separate mechanisms** and must not be merged into one unsupported number:
- **Direct consumption** is an ordinary, source-visible dependency — each of the 13 modules already contains an explicit reference to the exact symbol it uses (`<Badge>`, `<SliderField>`, etc.), so Stage 11C2 conversion is a straightforward matter of adding the corresponding named `import { Badge, SliderField, ... } from "./shared-components.jsx"`.
- **Implicit hook-global reliance** is a *hidden* dependency — none of the 12 modules contains any source-visible reference to `shared-components.jsx` for this purpose; the coupling exists only because of concatenation-scope execution order. This is qualitatively riskier because a migration script or reviewer scanning for "what does this file import" would not discover the need for a `react` import without already knowing about this pattern.

`shared-components.jsx` is the sole origin of the implicit hook global (Section 3A). Stage 11C2 must (a) add explicit named imports from `shared-components.jsx` in the 13 direct-consumer modules, and (b) add explicit `react` hook imports in the 12 implicit-consumer modules — these are two independent migration tasks affecting overlapping but distinct sets of files (16 modules in total, per the union above).

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

**Corrected during the Stage 11C1 audit closure.** The previous version of this document overstated what the frozen v0.8 historical record actually established. The accurate historical record is:

**Current state (frozen, unchanged in Stage 11C1):** `app-shell.jsx` contains exactly 19 syntactically identical occurrences of `ReactDOM.createRoot(rootEl).render(<App />);`. The frozen v0.8/Stage-11B historical evidence states:
- All 19 calls were preserved unchanged throughout the v0.8 recovery.
- Stage 10B directly measured that after execution, `#root` contained exactly **one DOM child** in both the original artifact and the faithful Class B candidate.
- The **internal React-root disposition was NOT further instrumented** — Stage 10A/10B explicitly did not measure what happens internally when 19 `createRoot` calls execute against the same DOM node (e.g., whether earlier roots are silently replaced, whether React warns internally, etc.) — only the externally observable single-child outcome was measured.
- Later browser validation stages (10C–10F) found no mount-related observable errors during their respective testing scopes.
- The v0.8 decision, based on this evidence, was to **PRESERVE** the historical 19 calls rather than deduplicate them — not because a 19-vs-1 comparison was performed and found equivalent, but because no demonstrated defect justified modifying frozen recovered source.

**This document previously and incorrectly stated that "Stage 10A–10D proved that reducing 19→1 produces no behavioral difference."** No such experiment was performed at any point in the v0.8 recovery or Stage 11C1. A single-mount version of `app-shell.jsx` has never been built or tested against the frozen reference. This correction does not change the doctrine or the Stage 11C2 target architecture — it only corrects an unsupported evidentiary claim.

**Correct Stage 11C2 doctrine:**
- **19 → 1 remains the TARGET architecture for Stage 11C2** (a single authored entry point outside the legacy 34 modules, calling `createRoot(rootEl).render(<App />)` once), because this is the ordinary, idiomatic pattern for any ES-module React application and is required to export `App` as a genuine module symbol rather than have `app-shell.jsx` self-mount 19 times.
- **This target is NOT pre-proven behaviorally equivalent by any prior stage.** Reducing 19 calls to 1 is a real code change to startup behavior that has not yet been tested.
- **Stage 11C2 must establish this equivalence experimentally**, using the same before/after browser-equivalence rigor applied throughout this project (Playwright differential testing against the frozen Stage 11C1 Vite bridge reference — not the older v0.8/Stage-11B reference, since Stage 11C2 builds on top of the Stage 11C1 bridge). The externally observable Stage 10B finding (root ends with one child either way) is a reasonable basis for expecting the collapse to be safe, but expectation is not proof, and Stage 11C2 must not skip the validation step on the assumption that this is already settled.

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

**Revised twice during Stage 11C1 closure work:** first during the initial audit corrective closure (shared-components.jsx LOW→MODERATE reclassification, Sections 9/12 corrections), and again during the Stage 11C1 **final** closure, which applied an explicit, consistent classification rule across all 34 modules and caught two further inconsistent classifications.

| Metric | Value |
|---|---|
| Total application modules inspected | **34** |
| Modules with CommonJS recovery-wrapper guard | **14** |
| Modules with DIRECT `shared-components.jsx` symbol consumption | **13** |
| Modules relying on the IMPLICIT React-hook global | **12** |
| Modules in both groups | **9** |
| Union (direct or implicit `shared-components.jsx` dependency) | **16** |
| Identifier collisions found | **0** |
| Circular dependencies found | **0** (6 false-positive candidates from documentation-text mentions, ruled out by direct inspection) |
| Migration risk: LOW | **20** |
| Migration risk: MODERATE | **13** |
| Migration risk: HIGH | **1** (`src/ui/app-shell.jsx` only) |
| Historical `ReactDOM.createRoot` mount calls (unchanged in Stage 11C1) | **19**, all in `app-shell.jsx` — target 19→1 for Stage 11C2, NOT pre-proven equivalent by any prior stage (see Section 13) |

### Migration-Risk Classification Rule (made explicit during the Stage 11C1 final closure)

To catch and prevent silent inconsistency, the classification now follows one explicit rule, checked against every module in a single pass:

> **A module is HIGH if it is `app-shell.jsx`** (unique structural centrality + 19 mount calls + startup criticality). **Otherwise, a module is at least MODERATE if its fan-in (number of *other* application modules it consumes identifiers from) is 3 or more — regardless of whether it also relies on the implicit React-hook global.** A module with fan-in ≤ 2 is LOW, unless (like `shared-components.jsx`) its risk stems from downstream fan-**out** centrality rather than fan-in (see below). Reliance on the implicit hook global can only ever *add* risk, never justify a *lower* classification than a module's fan-in alone would warrant.

**Two further inconsistencies were caught and corrected by applying this rule uniformly** (in addition to the `shared-components.jsx` reclassification already made in the initial audit closure):

- **`src/eqa/ui-components.jsx`**: fan-in = 4 (statistics.js, eqa/calc.js, eqa/data.js, strategy/screens.jsx) **and** relies on the implicit hook global — previously classified LOW. The original classification logic incorrectly treated *any* hook-global-consuming module as LOW regardless of fan-in, while non-hook-consuming modules at the identical fan-in level (`strategy/ui-components.jsx`, fan-in=4) were correctly rated MODERATE. Reclassified to **MODERATE**.
- **`src/ui/core-screens.jsx`**: fan-in = 3 (statistics.js, app-data.js, shared-components.jsx) **and** relies on the implicit hook global — previously classified LOW, inconsistent with `bv/ui-components.jsx` (fan-in=3, no hook reliance) being correctly rated MODERATE at the same fan-in level. Reclassified to **MODERATE**.

**`src/ui/shared-components.jsx` remains a documented exception to the fan-in rule** (its own fan-in is only 1): its MODERATE rating is justified by fan-**out** centrality (13 direct consumers, widest of any of the 34 modules) and its unique status as the sole origin of the implicit hook-global relied on by 12 modules — a downstream risk factor the fan-in-based rule does not, by itself, capture. This exception is explicit and documented, not an unstated special case.

Every one of the 34 modules was checked against this rule in one pass (see the per-module fan-in/fan-out/guard/hook table produced during this audit) to confirm no further inconsistencies remain.

Stage 11C2 is **not** performed in this stage. This document is architecture-planning input only.
