# PreciMind QC Learning Lab v0.9 — Stage 12B Report

## Morning QC Room Interaction Shell + Panel Architecture

### 1. Starting provenance
Branch `v0.9-development`, starting HEAD `080649c6daa9abc8c17753ce77607d5bd3a95f0d`
(Stage 12A accepted baseline, commit count 63).

### 2. UI architecture
See `V09_MORNING_QC_UI_ARCHITECTURE.md`. New code lives entirely under
`v09/app/morning-qc/ui/**` (17 component files + adapter + model + CSS +
index + dev launcher). Zero Stage 12A engine/domain files touched (see
Section 19, freeze-check).

### 3. Engine-adapter design
`ui-adapter.js`'s `createRoomController()` is the sole bridge. Every
availability/safety/correctness predicate calls an engine-exported pure
function (`deriveUnlockedPhaseIndex`) or reads public engine state
already treated as authoritative by the engine itself. `dispatch()`
always calls the real, unmodified `engine.applyAction()` — any adapter
imprecision is safely caught by engine rejection, never causing a leak
or forgery. Verified directly: premature panel/action dispatches are
rejected by the real engine (governance assertions 9a/9b).

### 4. Room layout
Desktop three-column grid (dock · main · reasoning) with header and
bottom action bar; collapses to overlay drawers ≤1024px and a stacked
single column ≤480px. `morning-qc-room.css` reuses the established v0.9
design tokens rather than a new palette.

### 5. Panel architecture
`PanelCard`/`PanelViewer` are generic, data-driven (no pilot-specific
markup). Unavailable panels are omitted from the dock entirely (Section
11's preferred treatment). Panel content is exposed only after genuine
inspection — verified: `RENDER-03` confirms an unavailable panel's title
does not even appear in rendered HTML; the panel-open test confirms
content appears only after a real click-driven `INSPECT_PANEL` dispatch.

### 6. Action dock
Grouped by semantic category (signal/immediate, investigation, reasoning,
intervention/verification, documentation), with light plausibility
filtering (UX convenience only — the engine remains the authority).
Actions bound to an available case-authored decision route through the
decision dialog instead of a bare dispatch.

### 7. Decision UX
`decision-dialog.jsx` presents only `label`/`actionType` per option —
verified (`DEC-03`) that the case-authored `consequenceSummary`
(answer-key text) never appears in the rendered dialog. No immediate
correctness reveal.

### 8. Hypothesis / evidence workspace
`hypothesis-workspace.jsx` shows only learner-genuinely-considered
hypotheses (via the adapter's `systemEvents`-backed filtering);
`evidence-tray.jsx` shows only genuinely-obtained evidence, exposing
only `finding`/`source`/`timestamp` — never `decisive`, `relevance`, or
`interpretationLimits`.

### 9. Service-state UI
`service-state-banner.jsx` renders the engine's `serviceState` verbatim
through a label/tone lookup — never a hardcoded or invented state name
(governance assertion 12a).

### 10. Patient-impact UI
`patient-impact-panel.jsx` consumes `patientImpactState` directly;
terminal-state transitions remain gated by the real engine (Stage 12A's
evidence-backed patient-impact doctrine is untouched).

### 11. Confidence decisionEventId binding
Every decision execution's returned `decisionEventId` is threaded
directly into `ConfidenceControl` — verified (governance 10a/10b) that
the view model's confidence records use `decisionEventId`, never the
reusable `decisionId`, as identity.

### 12. Documentation/event separation
`documentation-drawer.jsx` writes only the three allowlisted fields;
`event-timeline.jsx` renders the real, sanitized action history.
Verified (governance 11a/11b): a `DOCUMENT` call attempting to forge
`investigationPerformed` is preserved as a documentation claim but never
appears in the real event timeline.

### 13. All-three-pilot support
Verified generically: no case-ID branching found in any UI file
(governance 6a); the adapter initializes all three pilots identically
(governance 6b).

### 14. Desktop/mobile behavior
Reference breakpoints implemented (1024px, 480px) per Section 28's
required widths. See Section 20 (disclosed limitation) for what could
not be visually confirmed.

### 15. Accessibility results
See `V09_STAGE12B_ACCESSIBILITY.md`. Keyboard focus-trap and Escape-close
behavior verified with genuine jsdom `KeyboardEvent` dispatch, not merely
asserted from source.

### 16. Browser test totals — DISCLOSED LIMITATION
**Playwright's Chromium binary could not be downloaded in this sandbox**
(`cdn.playwright.dev` returns HTTP 403 "Host not in allowlist" — verified
directly by running `npx playwright install chromium`). No
`v09/tests/browser/v09-stage12b-morning-qc-shell.e2e.js` was created,
since it could not be executed. Full disclosure and the exact verified
error output: `tests/browser/evidence/stage12b/LIMITATION.md`.

**Substitute used**: `tests/morning-qc/ui-component.test.cjs` — genuine
interactive testing via jsdom (pure-JS DOM, no browser binary) +
`react-dom/client`'s `createRoot` + React 19's `act()`. Real click
dispatch, real keyboard events, real React reconciliation. **35/35
assertions pass.** This is a legitimate substitute for interaction-logic
verification but does **not** verify real visual layout, paint, or CSS
box-model overflow.

**Test-setup disclosure (important for reproducibility)**: `jsdom` is
required to run `ui-component.test.cjs` but is **deliberately NOT**
added to `package.json`/`package-lock.json` — those files are part of
the frozen architecture inherited from Stage 11C1 (verified directly:
adding `jsdom` as a committed devDependency broke Stage 12A governance
assertions 19c/19d, which check `package.json`/`package-lock.json`
byte-identity back to that stage). Instead, `jsdom` must be installed
ad hoc before running the Stage 12B UI test suite:
```
cd v09 && npm install --no-save jsdom
```
This is the same pattern already used for this stage's own `vite`-based
JSX build helper (no new committed dependency), applied consistently.
`git diff` confirms `package.json`/`package-lock.json` are untouched by
this commit.

### 17. Layout/overflow QA — DISCLOSED LIMITATION
Not performed (same root cause as Section 16 — no real browser/layout
engine available). CSS was written with the required reference widths
and reviewed by inspection only.

### 18. Stage 12B assertion totals
- UI component tests (`ui-component.test.cjs`): **35/35**
- Stage 12B governance (`stage12b-morning-qc-shell.test.js`): **38/38**

### 19. Stage 12A 265/265 regression
Re-run in full: engine 49/49, pilot paths 39/39, progression-invariants
59/59, governance 118/118 — **265/265**, unchanged.

### 20. All historical regressions
Pre-11C1 v0.9 189/189; Stage 11C1 98/98 (installed)/94/94 (clean); Stage
11C2 scientific parity 35/35; Stage 11C2 governance 49/49; v0.8
3849/3849 across 30 suites — see the Regression section below for the
literal re-run output.

### 21. Frozen SHAs
Reconfirmed byte-identical: Stage 11B `975adefb...`, Stage 11C1
`c0407262...`, Stage 11C2 `4614aca9...`.

### 22. Exact changed-file scope
All changes under `v09/app/morning-qc/ui/**` (new), `v09/tests/morning-qc/**`
(new test-support + new test files), `v09/tests/stage12b-morning-qc-shell.test.js`
(new), `v09/tests/browser/evidence/stage12b/LIMITATION.md` (new),
`v09/docs/**` (four new docs + narrow roadmap append), and
`v09/docs/v09-stage12a-freeze-manifest.json` (new). **Zero** Stage 12A
engine/domain files, zero Stage 11C2 modules, zero `package.json`/
`package-lock.json`, zero `app-shell.jsx` changes.

### 23. Final commit SHA/count
See the git log at the time this report is read; expected count 64 on
top of the accepted Stage 12A baseline.

### 24. ZIP integrity
See the delivery message accompanying this report for the verified
ZIP SHA-256 and integrity-test result.

---

## Disclosed limitations (summary)

This stage could not perform real-browser verification (Sections 16-17)
due to a network-sandboxing constraint outside this environment's
control (`cdn.playwright.dev` not in the egress allowlist), which was
verified directly rather than assumed. A genuine, working substitute
(jsdom + react-dom/client interactive testing) was built and used
throughout, and is clearly distinguished from real browser evidence in
`tests/browser/evidence/stage12b/LIMITATION.md`. If real browser
verification is required for acceptance, this should be flagged for a
follow-up pass in an environment with the necessary network access.
