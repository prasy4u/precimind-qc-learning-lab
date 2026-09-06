# Stage 11C2 Migration Report

**Machine-readable map:** `v09/docs/v09-stage11c2-module-map.json`  
**Source-transform verification:** `v09/docs/stage11c2-transform-verification-result.json` — **34/34 PASS**

---

## Summary

All 34 accepted Stage 11C1 modules were migrated to true ES-module form under `v09/app/**`. Every migration was verified surgical (no scientific, pedagogic, or application-body text changed) via an automated normalize-and-diff verifier: after removing exactly the permitted structural transformations (added imports, `export` prefixes, the CommonJS guard, the shared-components.jsx hook-destructuring line, and app-shell.jsx's mount statements), the legacy and active source are byte-identical for all 34 modules.

- CommonJS wrappers removed: **14** (all previously-guarded pure-calculation modules)
- CommonJS wrappers remaining in active source: **0**
- Historical mount calls remaining in active source: **0** (all 19 removed from `app-shell.jsx`; single `createRoot` now lives in `app/main.jsx`)
- Source-transform verification: **34/34 PASS**

---

## Deviations from the Stage 11C1 Proposed Import/Export Plan

The Stage 11C1 dependency graph (`v09-module-dependency-graph.json`) was used as migration-planning input, per the Stage 11C2 spec's explicit instruction to "verify every proposed import/export against the actual source before applying it" and to "not fabricate exact adherence when source inspection required a correction." Source inspection during actual migration found the plan required real corrections:

### 1. `app-shell.jsx` export list correction
The plan's `proposed_stage11c2_exports` for `app-shell.jsx` included `rootEl` — a mount-only DOM reference with no remaining application purpose once the single-root entry point (`app/main.jsx`) took over root creation. Removed from the export list per Stage 11C2 Section 12's explicit instruction to "remove mount-only declarations such as a legacy `rootEl` from the active app shell if they have no remaining application purpose."

### 2. Genuine missing imports discovered during actual migration (a real gap in the Stage 11C1 automated extraction)

The Stage 11C1 dependency graph's `proposed_stage11c2_imports` field, though independently audited and largely accurate for cross-module *function* calls, had a **systematic blind spot for identifiers used only as bare data references** (e.g., `z: Z_STABLE_A` inside an object literal, rather than a function call like `Z_STABLE_A()`). This blind spot originated in the original Stage 11C1 extraction's string/comment-stripping routine, which — for long, prose-heavy files — could lose quote-parity when JSX text contained an apostrophe (e.g., "don't", "it's"), silently truncating everything parsed afterward in that file's usage scan.

**This was caught not by trusting the plan, but by building the application and executing it in a real browser**, which threw genuine `ReferenceError`s (`Z_STABLE_A is not defined`, then `LEVELS is not defined`) the moment an affected screen rendered. Following up with a dedicated, more thorough cross-reference check (comparing every module's actual raw-source identifier usage against every other module's actual exports) surfaced **148 candidate gaps** in total.

Of these 148:
- **6 were confirmed false positives** — identifiers mentioned only inside `informs: "..."` documentation-text strings in `app/ui/app-data.js` (describing what `calculateClassicalRcv`, `calculateLognormalRcv`, `describeSchemeCapability`, `PEER_GROUP_NOT_TRUTH_PRINCIPLE`, `PERFORMANCE_CRITERION_APS_LINK_NOTE`, and `MILAN_MODELS` do in prose, not real code references) — the exact same false-positive pattern already identified and excluded during the Stage 11C1 audit. Verified directly via source inspection before exclusion.
- **142 were genuine missing imports**, added across 16 files: `bv/data.js`, `bv/screens.jsx`, `eqa/calc.js`, `eqa/data.js`, `eqa/screens.jsx`, `eqa/ui-components.jsx`, `investigation/data.js`, `investigation/screens.jsx`, `investigation/ui-components.jsx`, `pbrtqc/data.js`, `pbrtqc/screens.jsx`, `risk/data.js`, `risk/detection-delay.js`, `strategy/core.js`, `strategy/ui-components.jsx`, `ui/core-screens.jsx`.

**This is disclosed prominently because it means the Stage 11C1 dependency graph, while a genuinely useful planning input, was not a complete or fully reliable source of truth for the actual migration** — exactly as the Stage 11C2 spec anticipated ("the dependency graph is an architectural map, not permission to alter scientific logic... verify every proposed import/export against the actual source before applying it"). No scientific or application-body content was altered by adding these imports — every addition is purely a new `import { name } from "path";` line resolving a genuine reference that already existed in the frozen source (in the sense that the *frozen* source relied on concatenation-scope global resolution for these same names — the ES-module form simply makes the dependency explicit, exactly as required by Stage 11C2 Section 10).

### 3. `React.Fragment` default-import requirement (not separately tracked in the Stage 11C1 graph's `react_dependencies` field for hook purposes)
Three files use `<React.Fragment>` directly: `investigation/ui-components.jsx`, `risk/ui-components.jsx`, `ui/core-screens.jsx`. The Stage 11C1 graph's `react_dependencies` field tracked implicit *hook* reliance but not `React.Fragment` usage specifically. Verified via direct source grep and added `import React from "react";` (combined with the hook import where both are needed) to all three.

---

## Verification Method

1. **Automated migration** via a retained script (`v09/tools/migrate-to-esm.cjs`) applying only the permitted structural transformations to all 34 modules from the audited plan.
2. **Real browser execution** as ground truth — not static analysis alone — to catch runtime `ReferenceError`s the plan's automated extraction missed.
3. **Comprehensive cross-reference re-check** (`v09/tools/fix-missing-imports.cjs`, retained) comparing every active module's actual identifier usage against every other active module's actual exports, applied to catch every remaining gap in one pass rather than one error at a time.
4. **Exhaustive interactive click-through**: all 14 navigation destinations and every reachable sub-tab clicked in a real browser after all fixes — **zero page errors**.
5. **Strict source-transformation verification** (`v09/tools/verify-stage11c2-transform.cjs`, retained): normalize-and-diff against the frozen legacy source for all 34 modules — **34/34 PASS**, confirming no scientific or application-body content was altered beyond the permitted structural transformations (including the corrective import additions, which are new `import` lines — filtered by the verifier's normalization — not body changes).

No case data, scientific formula, threshold, PBRTQC signature, rule semantics, or pedagogic text was altered at any point in this migration.
