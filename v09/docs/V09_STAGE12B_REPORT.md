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

---

## Stage 12B Corrective Closure

A subsequent independent audit found several real defects and one major
environment-capability correction. This section documents the closure.

### Environment correction: real browser testing IS possible here

The prior closure concluded Playwright's Chromium binary could not be
obtained in this sandbox. That specific finding (the CDN download itself
being blocked) was correct, but incomplete: this environment has
**pre-staged Chromium binaries already on disk** at
`/opt/pw-browsers/chromium-1194/` (matching browser revision 1194,
Chromium 141.0.7390.37) and `/opt/google/chrome/`. Installing the
**exact matching** `playwright-core@1.56.0` (rather than the npm
registry's latest, which expects a newer, undownloadable revision) and
pointing `PLAYWRIGHT_BROWSERS_PATH` at that directory allows genuine,
real Playwright-driven Chromium automation. This was verified directly:
a real browser was launched, real HTML rendered, and real DOM content
read back, before any Room-specific testing began. Full detail in
`tests/browser/evidence/stage12b/LIMITATION.md` (retitled from a
limitation disclosure to a resolution notice).

### Real browser E2E test now exists and passes

`tests/browser/v09-stage12b-morning-qc-shell.e2e.js` drives the real,
deterministically-built `dist-morning-qc-dev/` artifact (built via the
new isolated `vite.morning-qc.config.mjs` + `morning-qc-dev.html`) over
a local static HTTP server, exercising all three real Stage 12A pilot
cases and the full required viewport matrix (1440×1000, 1366×768,
1024×768, 390×844). **25/25 assertions pass.** Screenshot evidence
(initial room, panel open, decision dialog, HELD/verification state, at
both desktop and mobile widths) is checked in under
`tests/browser/evidence/stage12b/`.

### Four real bugs found and fixed by this real browser testing

None of these were catchable by jsdom (which does not implement real CSS
layout) — each was found only once genuine Chromium rendering was
available:

1. **Drawer backdrop z-index bug**: the drawer backdrop (`z-index: 39`)
   covered the header (previously no explicit z-index), making the
   drawer-toggle button unclickable to close an open drawer. Fixed by
   giving `.mqc-header` `z-index: 45`.
2. **Classic CSS Grid overflow bug**: a bare `1fr` grid track does not
   clamp to available space when a descendant's content has a larger
   intrinsic minimum width — causing genuine horizontal document
   overflow at the 390px mobile viewport (confirmed: `scrollWidth=725`
   against a 390px `clientWidth`). Fixed via `minmax(0, 1fr)` on both
   the desktop and mobile grid-template-columns, plus `min-width: 0` on
   `.mqc-header`/`.mqc-header__identity`/`.mqc-action-dock` so text
   ellipsis truncation and internal horizontal scrolling actually engage
   instead of forcing their containers wider.
3. **Dev-launcher toolbar overflow** (in the Stage-12B-only dev tool, not
   the Room shell itself): the three-button pilot selector never
   collapsed after a case was chosen and had no responsive handling,
   independently causing page overflow. Fixed by collapsing it to a
   compact "Change pilot" control once a case is active.
4. **A real production-code bug**, not merely a test-harness
   accommodation: `morning-qc-room.jsx` imported `ui-adapter.js` via
   `'../ui-adapter.js'` when the file is actually in the *same*
   directory (`ui/ui-adapter.js`, not `morning-qc/ui-adapter.js`). This
   had been silently working around by the test build script's import
   rewriting, which would have produced a broken production Vite build
   had it gone unnoticed. Fixed at the source; the test build script's
   special-case rewrite is now dead code (harmless — it simply no longer
   matches anything) rather than load-bearing.

A fifth, purely cosmetic issue was also found and fixed by direct visual
review of the captured screenshots: the room did not fill the full
viewport height (a large dead gray area below the content at 1440×1000),
caused by a missing `height: 100%` / flex chain from the dev entry's root
down through `.mqc-morning-qc-room` into `.mqc-room`. Fixed by making
`.mqc-morning-qc-room` a `height: 100%` flex column and `.mqc-room`
`flex: 1 1 auto` within it.

### Responsive drawer architecture (Section 2 of the corrective audit)

`infoDrawerOpen`/`reasoningDrawerOpen` are now genuine React state in
`morning-qc-room.jsx` (presentation-only, never simulation truth),
driving a `data-open` attribute the CSS uses to slide each rail
on/off-screen via `transform`. Mutual exclusion (opening one closes the
other), Escape-to-close, backdrop click-to-close, and automatic info-
drawer close on panel selection are all implemented and verified via
both jsdom (`DRAWER-01` through `DRAWER-11`) and the real browser E2E
suite. `room-header.jsx` gained matching toggle controls with
`aria-expanded`/`aria-controls`.

### Mobile action pattern (Section 3)

The bottom action dock now scrolls horizontally (`overflow-x: auto`,
`flex-wrap: nowrap`) below 1024px instead of stacking into an
ever-taller vertical list. All interactive controls carry a `min-height:
44px` touch-target minimum, verified directly against real rendered
button heights in the browser E2E suite (`TOUCH-panelcard-390x844`,
`TOUCH-actionbtn-390x844`).

### Truth-derivation fixes (Sections 12-15)

- **`room-status.jsx`**: the "concluding" status dot previously treated
  `documentation.finalDisposition != null` (a learner CLAIM) as evidence
  of concluding. Removed; now derives only from genuine `serviceState`
  (`RESUMED`/`ESCALATED`). Verified: writing documentation without any
  real disposition event does NOT advance this indicator (`STATUS-01`,
  `STATUS-02`).
- **`patient-impact-panel.jsx`**: previously hardcoded a local
  `REVIEWABLE_TARGETS` duplicate of Stage 12A's own transition table —
  which had already silently drifted out of sync, missing the
  `AFFECTED_RESULT_SET_IDENTIFIED → ESCALATION_REQUIRED` transition.
  Now imports `PATIENT_IMPACT_TRANSITIONS` directly from `states.js`
  (a read-only reference to the single Stage 12A authority, never a
  copy). Verified (`PI-SRC-01`–`03`).
- **`documentation-drawer.jsx`**: declared `aria-modal="true"` without
  actually trapping focus. Now traps focus identically in rigor to
  `decision-dialog.jsx` (Tab/Shift+Tab cycle confined, Escape closes,
  focus returns). Verified (`DOCTRAP-01`–`04`, including a genuine
  Tab-wraps-to-first assertion).
- **`hypothesis-workspace.jsx`**: previously exposed every remaining
  case-authored hypothesis as a static button menu — a checklist of
  every possible cause. Replaced with a free-text composer: the learner
  types their own thinking, and only once their text approximately
  matches a genuine case hypothesis's label does a submit control
  appear. The full authored hypothesis set is never rendered as a menu.
  Verified (`HYPUX-01`–`03`).
- **Case switch now resets presentation state, not just engine state**
  (`SWITCH-01`/`02`): opening a drawer on one case and then switching
  cases (remounting via `key`) now correctly resets the drawer state too
  — presentation state was previously untested for this.

### Semantic panel-content leakage review (Section 11) — sanctioned Stage 12A case-data exception

Direct inspection of every panel's authored `content.note` text across
all three real pilots found two panels whose text embedded
author/debrief-level interpretive conclusions rather than pure fact:
Pilot 1's `panel-calibration` ("...but does not itself explain a shift
that only appears after the LATER lot change") and Pilot 2's
`panel-pbrtqc` ("Superficially resembles an analytical shift pattern").
Both effectively told the learner the conclusion they were meant to
reach independently.

Per the audit's explicit instruction ("a narrowly justified
learner-facing projection field may be proposed if genuinely necessary,
but Stage 12A case modifications require explicit listing in the final
report" — this section is that listing), an additive, optional
`content.learnerNote` field was added: `case-schema.js`'s documentation
comment for `PANEL_REQUIRED_FIELDS`, and the two affected panels in
`pilot-1-reagent-lot-shift.js` and `pilot-2-pbrtqc-population-shift.js`.
**`content.note` itself was never altered or removed anywhere** — it
remains the full authored text, unchanged, for audit/debrief purposes.
`ui-adapter.js`'s panel-content projection now exposes only
`content.learnerNote` when present (falling back to `content.note`
unchanged when absent), so the interpretive text never reaches the
client at all in the two affected cases — not merely "sent but
unrendered."

This is the **only** change to Stage 12A case/schema files in this
closure. The Stage 12A freeze manifest
(`docs/v09-stage12a-freeze-manifest.json`) was updated to explicitly
document this as a `sanctionedExceptions` list of exactly these 3 files,
and Stage 12B governance now verifies (a) all 12 manifested files match
the current manifest exactly, (b) the manifest's sanctioned-exceptions
list contains exactly these 3 files and no others, and (c) a real `git
diff` against the original Stage 12A baseline commit touches only these
3 files among the 12 — not a self-reported claim alone.

### Panel renderer registry (Section 10)

`app/morning-qc/ui/panel-renderers/index.js` — a type-aware presentation
registry. Direct inspection confirmed every current pilot's panel
content is prose-only (`{ note: string }`); per the audit's explicit
instruction, no chart is fabricated from invented numbers. The registry
is structured to route genuine future structured `points`/`series` data
to a real chart primitive (reusing `app/ui/shared-components.jsx`'s
existing `LJChart`/`DistributionView`, never reimplementing) — but does
nothing beyond a labeled prose card today, since no such data exists.

### Test-dependency reproducibility (Section 9)

`v09/tests/morning-qc/package.json` + `package-lock.json` now pin
`jsdom` and `playwright-core@1.56.0` as a genuinely reproducible,
`npm ci`-installable test-local manifest — replacing the prior
closure's undeclared, ad-hoc `npm install --no-save jsdom`. This
manifest is deliberately isolated from the main `v09/package.json`
(confirmed via `git diff` to remain completely untouched): an earlier
attempt in this same closure to add `jsdom` there broke two of Stage
12A's own governance assertions checking `package.json`/
`package-lock.json` byte-identity back to Stage 11C1 — caught by
re-running that suite, and correctly reverted rather than overridden.

### A Stage 11C2 regression was found and fixed during this closure

Adding `dev-entry.jsx` under `v09/app/morning-qc/ui/` initially broke
Stage 11C2's frozen governance assertion enforcing exactly one
`createRoot()` call across the entire `v09/app/**` tree (the
single-active-React-root architecture doctrine) — a second
`createRoot()` anywhere under `app/**`, even in an isolated dev-only
file, trips that check. Caught by re-running the full historical
regression suite (not skipped), and fixed by relocating the entry point
to `v09/dev/morning-qc-dev-entry.jsx` — outside `app/**` entirely —
which preserves Stage 11C2's invariant untouched while `dev-launcher.jsx`
and `morning-qc-room.jsx` (which it imports) remain exactly where they
were; only the `createRoot()` call site itself needed to move.

### Governance strengthened, not merely re-asserted

Stage 12B governance (`stage12b-morning-qc-shell.test.js`) grew from
38 to **57 assertions**, adding: sanctioned-exception verification for
the freeze manifest (2b–2d), test-dependency reproducibility (DEP-01–04),
and — replacing the prior "limitation disclosure exists" check entirely
— a real requirement that `tests/browser/evidence/stage12b/result.json`
report genuine `status: "PASS"` with a non-zero, all-passing checkpoint
count and a recorded real browser executable path (16a–16i), plus direct
CSS verification that the responsive drawer architecture avoids the
exact overflow bug class found this cycle (RESP-01–04). A result of
`BLOCKED` or `FAIL` — or no result file at all — now fails governance
outright; it is never silently accepted as equivalent to a disclosed
limitation.

### Updated test totals

- UI component tests (`ui-component.test.cjs`): **60/60** (was 35, +25)
- Stage 12B governance (`stage12b-morning-qc-shell.test.js`): **57/57**
  (was 38, +19)
- Real browser E2E (`v09-stage12b-morning-qc-shell.e2e.js`): **25/25**
  (new this cycle — genuine Chromium, not simulated)
- Stage 12A regression: unchanged, **265/265**
- All historical baselines (Stage 11A/11B/11C1/11C2/v0.8): unchanged and
  reconfirmed, **including the Stage 11C2 regression found and fixed
  during this closure** (49/49, restored from a 48/49 break)
