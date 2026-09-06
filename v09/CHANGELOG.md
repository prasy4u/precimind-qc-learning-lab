# v0.9 Changelog

## v0.9 — In Development

**Baseline:** `recovered-v0.8-validated` (commit `1352dba`)

### Planned Themes

- Morning QC Room capstone (integrates QC-01 through QC-12 competencies)
- Integrated competency-based application layer
- Accessibility improvements (see `docs/V09_ACCESSIBILITY_DEBT.md`)
- Runtime/build modernization if ADR-001 is approved (see `docs/ADR-001-V09-APPLICATION-ARCHITECTURE.md`)
- Maintain scientific compatibility with the validated v0.8 baseline (see `docs/V09_SCIENTIFIC_INVARIANTS.md`)

### Stage 11A — Development Fork + Architecture Charter

- Created `v0.9-development` branch from `recovered-v0.8-validated`
- Created `v09/` development tree (`src/`, `tests/`, `tools/`, `docs/`, `dist/`)
- Copied validated v0.8 application source into `v09/src/` as the development starting point (36 files, all `UNCHANGED_FROM_V08` at copy time)
- Established baseline copy manifest (`docs/V08_TO_V09_BASELINE_MAP.md`, `docs/v08-to-v09-baseline-map.json`)
- Established product charter (`docs/V09_PRODUCT_CHARTER.md`)
- Established technical debt register (`docs/V09_TECHNICAL_DEBT.md`)
- Established accessibility debt register (`docs/V09_ACCESSIBILITY_DEBT.md`)
- Established architecture decision record (`docs/ADR-001-V09-APPLICATION-ARCHITECTURE.md`) — recommends Vite for new Morning QC Room modules, no build tooling installed yet
- Established scientific invariants inheritance statement (`docs/V09_SCIENTIFIC_INVARIANTS.md`)
- Established case family catalogue design (`docs/V09_CASE_FAMILY_CATALOGUE.md`) — 16 case families (A–P), no case data authored
- Established roadmap (`docs/V09_ROADMAP.md`)
- No features implemented. No scientific changes. No accessibility fixes yet.

**This changelog does not claim any feature is complete.** Stage 11A is architecture and governance only.

### Stage 11B — Compatibility Foundation + Accessibility Remediation + Test Architecture

**Documentation correction:**
- Corrected the Stage 11A error stating v0.8 has "13 independent labs" — the validated app shell has 14 primary nav destinations: 11 progress-tracked labs + Home/Competency Map/Evidence. QC-01–12 is a separate competency count from the screen count. Fixed in `V09_PRODUCT_CHARTER.md` and `ADR-001-V09-APPLICATION-ARCHITECTURE.md`.

**Deterministic v0.9 compatibility baseline:**
- Created `v09/tools/v09-source-order.json` (source-order manifest, 34 application modules + CSS + bootstrap)
- Created `v09/tools/assemble-v09-compat.js` (consumes `v09/src`, reuses the validated v0.8 document/vendor envelope, deterministic, reports SHA/module count/mount count)
- Pre-fix compatibility artifact SHA matched the v0.8 faithful candidate exactly (`a9fe9a3a...`) — confirmed via a 21-checkpoint Playwright smoke differential (`V09_COMPAT_BASELINE_MATCH`: 21/21 MATCH, 0 DIFFERENCE)

**Accessibility audit and remediation:**
- Full-repository search of `v09/src/**` found exactly 3 synthetic `role="button"` SVG controls: Rule Detective (`.mlj-point-g`), LJ chart (`.ljchart-point-g`), and EQA longitudinal chart (`.ljchart-point-g` in `eqa/ui-components.jsx`) — the third was not named in the Stage 11A debt register and was discovered by this audit. Documented in `V09_INTERACTIVE_CONTROL_AUDIT.md`.
- Fixed all three in `v09/src` only (root `src/` unchanged): each now uses a single shared activation function so click/Enter/Space all invoke identical semantics, with `preventDefault()` on Space. Click behavior verified unchanged; Enter/Space verified newly functional (documented `INTENDED_DELTA` vs. the validated v0.8 known limitation).
- `V09_ACCESSIBILITY_DEBT.md` updated: AD-001, AD-002 status → `FIXED_STAGE_11B`; new AD-003 (EQA) added and marked `FIXED_STAGE_11B`.

**Test architecture:**
- `V09_TEST_ARCHITECTURE.md` — formalizes Unit / Integration / Browser-E2E layers, explicit provenance separation from the frozen v0.8 historical suite
- `v09/tests/unit/v09-scientific-compat.test.js` — 28 assertions (sample SD, signed bias, negative-Sigma preservation, R_4s within-run, 8x vs 10x, single 1₃s operating characteristic, detection-delay model, EQA safeguards, RCV, PBRTQC frozen signatures)
- `v09/tests/integration/v09-accessibility-source.test.js` — 30 assertions (shared activation functions, Enter/Space handling, preventDefault, preserved aria-labels/classes/ring logic)
- `v09/tests/browser/v09-accessibility.e2e.js` (maintained, not disposable) — 30 checkpoints: 26 MATCH, 4 INTENDED_DELTA, 0 UNEXPECTED_DIFFERENCE, 0 BLOCKED

**Baseline provenance map updated:**
- `v09/src/rules/ui-components.jsx`, `v09/src/ui/shared-components.jsx`, `v09/src/eqa/ui-components.jsx` marked `V09_MODIFIED` with rationale; all other 33 copied files remain `UNCHANGED_FROM_V08`

**ADR-001 refined:**
- Rejected the Stage 11A "split-runtime" recommendation (Vite for new work only, standalone for existing labs)
- **Status: ACCEPTED — target unified Vite/React build hosting both inherited labs and Morning QC Room**, migration deferred to new **Stage 11C** (added to roadmap)

**Not done in Stage 11B (explicitly deferred):**
- Vite is NOT installed; no build tooling added
- Morning QC Room schema/engine/case/UI — not started
- TD-001 (19-mount cleanup) — not addressed

### Stage 11B Corrective Closure

Independent audit identified two validation/integrity defects in the initial Stage 11B work, corrected here without reopening the architectural decision (ADR-001 remains ACCEPTED — target unified Vite/React build, migration deferred to Stage 11C):

**1. Assembler changed from drift-warning to fail-closed SHA enforcement.**
- `v09/tools/v09-source-order.json` revised to a two-SHA model: every runtime source entry now records both `v08_baseline_sha256` (immutable) and `expected_current_v09_sha256` (the admitted current state).
- `v09/tools/assemble-v09-compat.js` rewritten: any file whose on-disk SHA does not match its `expected_current_v09_sha256` causes the assembler to print `ASSEMBLY FAIL: Unexpected SHA drift` (with path, expected SHA, actual SHA) and **exit non-zero before writing output** — replacing the previous permissive `[MODIFIED since manifest]` log-and-continue behavior.
- New `v09/tests/unit/v09-assembler-drift-fail.test.js`: proves fail-closed behavior using an isolated temporary workspace (never touches real `v09/src`) — confirms (A) clean source assembles successfully, (B) a simulated one-character drift causes non-zero exit with the correct diagnostic, (C) the previously-accepted candidate file is not corrupted or overwritten by the failed attempt.

**2. EQA and LJ Space/Enter browser behavior genuinely measured (was previously declared, not measured).**
- The maintained `v09/tests/browser/v09-accessibility.e2e.js` now uses a deterministic DOM state indicator (the toggled point's SVG circle `r` attribute, which flips between 7=active and 5=inactive on every successful toggle) to distinguish focus-only from actual activation — tooltip visibility alone is no longer treated as proof.
- LJ chart: click/Enter/Space are now each independently measured from a fresh, common focused starting state. Click: MATCH. Enter: `INTENDED_DELTA` (v0.8 leaves state unchanged; v0.9 toggles, matching v0.9's own click result). Space: `INTENDED_DELTA` (same pattern).
- EQA chart: the previous invalid checkpoint recording `original="n/a", candidate="n/a"` has been removed entirely. EQA click/Enter/Space are now measured identically to LJ, using the default longitudinal round data. Click: MATCH. Enter: `INTENDED_DELTA`. Space: `INTENDED_DELTA`.
- Result: 32 checkpoints (was 30) — 26 MATCH, 6 INTENDED_DELTA (Rule Enter/Space + LJ Enter/Space + EQA Enter/Space), 0 UNEXPECTED_DIFFERENCE, 0 BLOCKED.
- New `v09/tests/browser/v09-prefix-compat-baseline.json`: retained summary record of the already-executed pre-fix compatibility run (21/21 MATCH, `V09_COMPAT_BASELINE_MATCH`), explicitly labeled as a summary record rather than a freshly rerun trace.

**Test totals updated:** Stage 11B governance test grew from 39 to 67 assertions (added two-SHA manifest checks, fail-closed assembler checks, browser-evidence-quality checks, pre-fix record checks). New unit test `v09-assembler-drift-fail.test.js` adds 16 assertions.

**No architecture change.** ADR-001 status unchanged. No Vite/build tooling installed. No Morning QC Room work performed.

### Stage 11C1 — Unified Vite Build Bridge + Migration Graph

**Package-managed toolchain established** (no prior Vite migration existed):
- `v09/package.json`, `v09/package-lock.json` — React 19.2.8, ReactDOM 19.2.8 (dependencies); Vite 8.2.2, @vitejs/plugin-react 6.1.1 (devDependencies)
- `v09/vite.config.mjs`, `v09/index.html` — ordinary Vite application shell, no embedded historical vendor/runtime payload
- Scripts: `npm run bridge:generate`, `npm run build:bridge`, `npm run hash:build`, `npm run test:stage11c1`, `npm run test:browser-bridge`

**Vite bridge generated** (`v09/app-bridge/bridge-entry.generated.jsx`, via `v09/tools/generate-vite-bridge.cjs`):
- Fail-closed SHA verification against the frozen `v09/tools/v09-source-order.json` manifest before generation (same governance principle as the Stage 11B assembler)
- Concatenates the accepted 34 application modules in accepted order, unchanged
- Exposes package `React` and `react-dom/client`'s `createRoot` under the identifiers the legacy source expects
- Preserves all **19 historical `ReactDOM.createRoot` mount calls** exactly
- No ES-module conversion, no CommonJS-wrapper removal, no scientific/UI changes

**Build output** (`v09/dist-vite-bridge/`, separate from the frozen `v09/dist/precimind-v0.9-compat.html`):
- Zero `Babel.transform` occurrences (runtime Babel eliminated from this path)
- No historical vendor payload / `text/plain` app-source block / runtime-bootstrap IIFE embedded in HTML

**Deterministic build-tree hashing** (`v09/tools/hash-build-tree.cjs`): sorted-path, content-SHA-256 canonical manifest scheme. Confirmed identical tree hash (`c0407262...`) across (A) initial build, (B) remove-and-rebuild, and (C) clean `npm ci` + rebuild.

**Dependency graph** (`v09/docs/v09-module-dependency-graph.json`, `V09_MODULE_DEPENDENCY_GRAPH.md`) — derived from direct source inspection of all 34 modules, not filename/domain inference:
- **Zero circular dependencies** (an initial automated pass found 6 false positives from documentation-text mentions of function names; manual inspection ruled all 6 out)
- **Zero identifier collisions** across all 34 modules
- **12 modules** rely on an implicit React-hook global (`useState`/`useMemo`/`useRef`/`useEffect` destructured once in `shared-components.jsx`, shared via concatenation scope) — the highest-priority Stage 11C2 finding
- **14 modules** carry CommonJS recovery-wrapper guards
- Migration risk classified for all 34 modules: 23 LOW, 10 MODERATE, 1 HIGH (`app-shell.jsx` only, due to structural centrality and startup criticality, not scientific importance)
- Recommended Stage 11C2 migration order documented

**Browser equivalence** (`v09/tests/browser/v09-vite-bridge-equivalence.e2e.js`, maintained): checkpoints comparing the frozen Stage 11B reference against the Vite bridge build. Covers startup, all 14 nav destinations, all 4 learner levels + persistence, Rule/LJ/EQA accessibility (click/Enter/Space), initial-screen-load DOM equivalence across 8 domains, Diagnostic/Glossary/About, and desktop/mobile screenshots. Two benign differences were investigated and resolved during harness development: (1) HTML attribute-serialization ordering differs between React versions with no semantic difference — addressed via attribute-order-normalized DOM comparison; (2) the reference's Babel-deoptimisation console notice is absent in the bridge by design (no runtime Babel) — documented as an expected consequence, not a regression.

**IMPORTANT CORRECTION (see Stage 11C1 Audit Corrective Closure entry below):** the initial submission's "representative scientific interactions across 8 domains" claim was inaccurate — those checkpoints only compared initial-screen-load DOM, not genuine state-changing interactions. This was corrected in the audit closure; see below for the accurate final description and totals.

**Governance test** (`v09/tests/stage11c1-vite-bridge.test.js`): 45/45 assertions, including fail-closed drift verification, frozen-file integrity (5 Stage 11B assets confirmed unchanged via `git diff`), exact mount-count preservation, and dependency-graph completeness.

**Frozen Stage 11B assets confirmed unchanged:** `v09/src/**`, `v09/tools/assemble-v09-compat.js`, `v09/tools/v09-source-order.json`, `v09/dist/precimind-v0.9-compat.html` (SHA `975adef...` unchanged), `v09/tests/browser/v09-accessibility-result.json`.

**v0.9 test totals:** pre-11C1 baseline 189/189 unchanged; Stage 11C1 adds 45 new governance assertions → v0.9 development total 234/234 (reported separately from the immutable v0.8 baseline, which remains 3849/3849).

**ADR-001:** implementation status updated — Stage 11C1: VITE BUILD BRIDGE ESTABLISHED; Stage 11C2: ES-MODULE MIGRATION PENDING. Architectural decision itself unchanged (still ACCEPTED — target unified Vite/React build).

**Not done in Stage 11C1** (explicitly deferred to Stage 11C2): ES-module conversion of the 34 modules, CommonJS-wrapper removal, single-root mount consolidation, any scientific change, Morning QC Room work.

### Stage 11C1 — Audit Corrective Closure

Independent audit of the initial Stage 11C1 submission (commit `6a8d9cf`) identified six defects, all corrected without rebuilding or redesigning the accepted bridge implementation:

**1. Genuine scientific interactions added for all 8 required domains** (replacing initial-DOM-only comparisons, which are retained separately as `initial-dom-*` checkpoints and no longer mislabeled as scientific-interaction evidence):
- Statistics: change Bias numeric entry (`#pg-bias`), read Signed Bias% metric
- Rules: Rule Detective Case 3 / 1₃s rule selection / Level1-Run4 point activation, read selection hint state transition
- Sigma/Strategy: change Specification A TEa (`#sg-specA`), read Sigma A output
- Risk/Frequency: change M via Frequency Simulator (`#fs-m`), read patient-exposure output
- Investigation: toggle a containment option in "When QC Signals", read selected-state class
- EQA: classify a target-value type in EQA Target Lab, read classification feedback
- BV/RCV: change CVA numeric entry in Variation Foundations, read derived metric output
- PBRTQC: change Window size (W) in the Simulator, read surveillance/detection output

A bug was caught during verification: the first implementation truncated read state to 300–400 characters, which happened to capture only a persistent intro paragraph and produced 4 hollow "MATCH" results (both sides showing no change). Fixed by reading full `#main` text content; all 8 interactions now show genuine before/after state changes, all MATCH.

**2. Console-error classification corrected.** Previously used one broad rule ("reference has BABEL notice && candidate has zero → MATCH") and incorrectly assumed a failed resource request was an HTTP 403. Direct capture via Playwright's `requestfailed` event confirmed the actual error is `net::ERR_FAILED`, caused by the harness's own Google-Fonts route interception — not a real HTTP status and not an application error. Console errors are now classified into three explicit, evidenced categories before any comparison: harness-induced noise, reference-only Babel tooling noise, and genuine application errors (which must be zero in the candidate).

**Investigation finding, deliberately NOT patched in this closure:** tracing the harness-noise asymmetry (reference: 1 aborted font request; candidate: 0) revealed that the current `v09/index.html` does not contain a Google Fonts `<link>` tag at all, unlike the original reference HTML — so the Vite bridge never attempts to load the intended IBM Plex Mono/Sans fonts. A fix was drafted and verified to change the build-tree hash as expected, then **deliberately reverted**: per audit instruction, the accepted Stage 11C1 bridge build infrastructure (including `v09/index.html`) must remain unchanged unless a required correction genuinely necessitates it, and the console-error correction only required accurately *classifying and explaining* this asymmetry with real evidence — not silently expanding scope to patch an unrelated HTML-authoring gap. The asymmetry is recorded as an explained, evidenced, non-application difference (both sides traced to concrete request-level evidence) and left as a known item for a future stage's Vite-bridge HTML authoring work, not resolved here. The accepted build-tree hash `c0407262...` is therefore confirmed unchanged by this closure.

**3. 19-mount historical provenance corrected** in `V09_MODULE_DEPENDENCY_GRAPH.md` Section 13. The document previously claimed Stages 10A–10D "proved" that reducing 19 mounts to 1 causes no behavioral difference — no such experiment was ever performed. Corrected to state accurately: Stage 10B measured only that `#root` ends with one child either way; internal React-root disposition was never instrumented; 19→1 remains the Stage 11C2 target architecture but is NOT pre-proven equivalent, and Stage 11C2 must establish this experimentally against the Stage 11C1 bridge reference.

**4. Shared-component dependency counts corrected.** The prior document stated an unsupported merged figure ("21 of the remaining 31 modules"). Recomputed directly from the machine graph: **13 modules** directly consume `shared-components.jsx` symbols; **12 modules** rely on its implicit React-hook global; **9 modules** are in both groups; **16 modules** in the union. Direct consumption and implicit hook-global reliance are now explicitly distinguished as separate mechanisms rather than merged.

**5. Migration-risk reclassification.** `src/ui/shared-components.jsx` was reclassified from LOW to **MODERATE**. The original rating considered only its own upstream dependency count (1 module) and ignored its downstream centrality (widest fan-out of any of the 34 modules, sole origin of the implicit hook-global). Risk distribution updated: **22 LOW / 11 MODERATE / 1 HIGH** (was 23/10/1).

**6. Proposed Stage 11C2 exports corrected.** `shared-components.jsx`'s `proposed_stage11c2_exports` incorrectly listed `useState`/`useMemo`/`useRef`/`useEffect` as application exports. These are React APIs the module currently destructures for internal + accidental-global use, not symbols it should export. Corrected to import these from `react` directly (matching what its 12 implicit-consumer modules will also need to do independently) and export only genuine application symbols (Badge, LJChart, MetricCard, Modal, SliderField, etc.).

**Reproducibility (re-verified, unchanged):** the accepted build-tree hash `c0407262fae35c913ec802740f27c37289e31038de9ad4cd542bb803e61d2e65` is confirmed unchanged, since no accepted bridge build input was modified in this closure. Re-confirmed identical across a fresh build, remove-and-rebuild, and clean `npm ci` + rebuild.

**Browser equivalence (final, corrected):** 63 checkpoints — 63 MATCH, 0 UNEXPECTED_DIFFERENCE, 0 BLOCKED. Includes 8 genuine scientific-interaction checkpoints (all MATCH), 8 initial-DOM checkpoints (correctly relabeled, not conflated with interaction evidence), corrected console-error classification (3 checkpoints), and all previously-passing checks.

**Governance test strengthened** (`v09/tests/stage11c1-vite-bridge.test.js`): added assertions verifying genuine state-changing evidence (not just checkpoint-ID presence) for all 8 scientific domains, mount-provenance wording no longer claims a prior 19→1 experiment, shared-component consumer counts are internally consistent with the machine graph, and shared-components.jsx's proposed exports do not include React hooks.

**Frozen assets confirmed unchanged throughout this closure:** `v09/src/**`, `v09/tools/assemble-v09-compat.js`, `v09/tools/v09-source-order.json`, `v09/dist/precimind-v0.9-compat.html` (SHA `975adef...`), `v09/tests/browser/v09-accessibility-result.json`. The accepted bridge implementation itself (`v09/app-bridge/`, `v09/tools/generate-vite-bridge.cjs`, `v09/tools/hash-build-tree.cjs`) was also left unchanged — only `v09/index.html` (test/documentation-adjacent fidelity fix) and the browser harness/governance test/documentation were modified.

### Stage 11C1 — Final Closure (Independent Verification of Prior Audit Claims)

A further review of the "audit corrective closure" commit found that several of its claims, while directionally correct, were not backed by durable or fully-verified evidence. This closure independently re-verified every claim and fixed defects found in that process, without altering the accepted bridge implementation.

**1. Screenshot evidence strengthened.** The existing `screenshots-11c1/*.png` files were confirmed genuine (viewed directly: real, fully-rendered application UI, not blank/placeholder images) and byte-identical (SHA-256 match between reference and candidate). Beyond that existing SHA check, independent pixel-level evidence was added: `v09/tests/browser/screenshots-11c1/pixel-diff-evidence.json`, computed via PIL `ImageChops.difference` over every pixel — **0 differing pixels out of 1,440,000 (desktop) and 329,160 (mobile)**, with saved diff-visualization images (`diffs/desktop-diff.png`, `diffs/mobile-diff.png`, confirmed all-zero via `Image.getextrema()`). This is now real, re-computable pixel-level proof, not reliance on SHA equality alone.

**2. All 8 scientific-interaction checkpoints traced and independently verified — one genuine defect found and fixed.** Manually inspected the raw before/after evidence for all 8 domains. Seven were confirmed genuine and correct (Statistics: `+0.00%`→`+5.00%`; Rules: `Selected: none yet`→`Selected: 4:L1`; Sigma: `4.00`→`9.00`; Risk: `M = 100`→`M = 500` context, byte-identical between reference/candidate; Investigation: `option-btn small`→`option-btn small option-selected`; BV: `CVA=2%`→`CVA=8%`, `Classical RCV 17.53%`→`27.72%`; PBRTQC: `Window=20`→`Window=40`, `NPed=12`→`NPed=24`). **The 8th (EQA) had a genuine defect**: the interaction selected the first button matching a generic length filter, which was actually a sub-navigation tab ("IQC vs EQA"), not a target-value classification answer — the checkpoint's action label did not match what it actually exercised. Fixed by targeting an exact classification-answer button text ("Reference measurement procedure assigned value"). Re-verified: now genuinely classifies a target value and reads the resulting feedback state, MATCH.

**3. Dependency-graph extraction made durable and re-runnable.** The original extraction was performed in an interactive session with no retained artifact beyond the final JSON. Added `v09/tools/dependency-graph-extraction/extract-dependencies.cjs` (the actual retained extraction script, not a summary) and its output log `stage11c1-extraction-log.txt`. Re-running it reproduces the committed graph's key figures exactly: 0 collisions, 0 circular dependencies, 12 implicit hook-global consumers, 13 direct shared-components.jsx consumers, 14 CommonJS-guarded modules, 19 total mount calls.

**4. Assembler drift-fail test confirmed already genuine.** Re-ran `v09/tests/unit/v09-assembler-drift-fail.test.js`: confirmed it performs a real subprocess invocation of the real assembler in an isolated temp workspace, with real SHA values printed for both the clean and drifted runs, and real exit-code capture. No changes needed — this was already durable, non-simulated evidence.

**5. Migration-risk classification made internally consistent (2 further reclassifications).** Built an explicit fan-in/fan-out/guard/hook-reliance table for all 34 modules and checked it against one explicit rule: fan-in ≥ 3 implies at least MODERATE risk, regardless of hook-global reliance (which can only add risk, never justify a lower rating). This caught two further inconsistencies beyond the shared-components.jsx fix already made in the audit corrective closure:
   - `src/eqa/ui-components.jsx` (fan-in=4, relies on implicit hook global) — was LOW, inconsistent with `strategy/ui-components.jsx` (fan-in=4, no hook reliance) being MODERATE at the same fan-in. Reclassified to **MODERATE**.
   - `src/ui/core-screens.jsx` (fan-in=3, relies on implicit hook global) — was LOW, inconsistent with `bv/ui-components.jsx` (fan-in=3, no hook reliance) being MODERATE at the same fan-in. Reclassified to **MODERATE**.
   
   Risk distribution: **20 LOW / 13 MODERATE / 1 HIGH** (was 22/11/1 after the prior audit closure). `shared-components.jsx` remains a documented, explicit exception to the fan-in rule (justified by fan-**out** centrality, not fan-in).

**6. Font-link revert re-confirmed correct and complete.** Re-verified `v09/index.html` contains no Google Fonts `<link>` tags (confirming the earlier revert was never re-applied), and that the accepted build-tree hash `c0407262fae35c913ec802740f27c37289e31038de9ad4cd542bb803e61d2e65` is reproduced exactly after a fresh build.

**7. All totals independently re-verified, not assumed.** Full harness re-run after the EQA fix: **63/63 MATCH, 0 UNEXPECTED_DIFFERENCE, 0 BLOCKED** (re-confirmed, not merely re-asserted from the prior commit). Governance test grown to **78/78** (was 64/64, +14 new assertions: durable extraction-log verification, pixel-diff evidence verification, EQA-fix verification, and a systematic fan-in-consistency check across all 34 modules that would catch any future recurrence of this class of classification bug). v0.9 pre-11C1 baseline reconfirmed unchanged at 189/189. v0.8 regression reconfirmed unchanged at 3849/3849. v0.9 NEW TOTAL: **267/267**.

**Frozen and accepted-bridge files reconfirmed unchanged throughout:** `v09/src/**`, `v09/tools/assemble-v09-compat.js`, `v09/tools/v09-source-order.json`, `v09/dist/precimind-v0.9-compat.html` (SHA `975adef...`), `v09/tests/browser/v09-accessibility-result.json`, `v09/tools/generate-vite-bridge.cjs`, `v09/tools/hash-build-tree.cjs`, `v09/vite.config.mjs`, `v09/index.html`, `v09/package.json`, `v09/package-lock.json`.
