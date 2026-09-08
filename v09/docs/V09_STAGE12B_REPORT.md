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

---

## Stage 12B FINAL UI INTEGRATION / LEAKAGE Closure

A third independent audit found genuine defects in the interaction shell's integration correctness, plus additional semantic leakage. This closure resolves all of them, and — critically — found and fixed **five further real bugs** while building the deeper verification the audit required, none of which had been flagged explicitly but which surfaced the moment genuine end-to-end interaction was exercised.

### 1. ActionDock bare-dispatch removal (confirmed exactly as reported)

Reproduced the exact errors independently: `REQUEST_EVIDENCE`/`FORM_HYPOTHESIS`/`REVIEW_PATIENT_IMPACT` bare-dispatched from `ActionDock` without their required ID/target payload produced `Unknown evidenceId: undefined`, `Unknown hypothesisId: undefined`, and `Illegal patient-impact transition: NOT_INDICATED -> undefined`. Fixed: `REQUEST_EVIDENCE` and `REVIEW_PATIENT_IMPACT` removed from `ACTION_GROUPS` entirely (their dedicated surfaces — `PanelViewer`'s per-panel evidence buttons, `PatientImpactPanel`'s transition-specific buttons — already existed); `FORM_HYPOTHESIS` now renders in `ActionDock` **only** when bound to a genuine available case-authored decision. 12 new tests across all 3 pilots prove no visible control can produce these errors.

### 2. Hypothesis free-text matcher replaced

The naive `includes()`/first-word matcher matched on stopwords ("a", "an", "the"), producing the exact wrong matches the audit reproduced ("calibration problem" → hyp-population; "sample handling issue"/"preanalytical factor" → hyp-analytical-error). Replaced with `hypothesis-matcher.js`: stopword removal, general (non-case-specific) domain-synonym normalization, and IDF-style token weighting to resolve genuine ties (e.g. distinguishing "lot change" from "population shift" correctly). Verified against every exact case the audit specified, plus stress tests (pure stopwords and gibberish correctly return no match, never a silent guess).

### 3. Pilot 3 panel leakage closed

Added `content.learnerNote` to `panel-eqa` and `panel-specimen-context`, exactly as suggested, without touching `content.note`. The freeze manifest's `sanctionedExceptions` now lists **4** files (adding `pilot-3-rcv-patient-impact.js`), verified against a real `git diff`.

### 4. Real three-pilot browser paths — now genuinely comprehensive (40/40)

The browser E2E suite was extended to exercise the **complete** canonical action sequence for each pilot, using `tests/morning-qc/pilot-paths.test.cjs`'s accepted `expertActions` arrays as the literal semantic reference (no invented pathway). Pilot 1's full path (containment → both hypotheses → both evidence chains → REPEAT_QC → intervention → verification → patient-impact escalation sequence → resume → document) now passes end-to-end through real clicks. Pilot 2's path proves a genuine `FORM_HYPOTHESIS` engine event (not just typed text), a decisionEventId-bound confidence control, zero answer-key reveal, and the full early-unsupported → decisive-evidence → later-supported disposition revision cycle. Pilot 3 confirms no inappropriate analytical hold and distinct patient-impact representation. Governance now verifies the **presence and PASS status of 14 specific named checkpoint IDs**, not merely aggregate `total>0`/`passed===total` (Section 4's explicit requirement).

### 5. Complete mobile screenshot evidence

Added panel-open, decision-dialog, and HELD/verification-state screenshots at 390×844 (previously only initial room + drawer existed), each with real overflow/containment checks.

### 6. Escalation documentation field added

`DocumentationDrawer` now exposes all three Stage-12A-allowlisted fields (`finalDisposition`, `establishedCause`, `escalation`). Verified: documenting escalation text never derives `serviceState` or forges a real `ESCALATE` event in the timeline.

### 7. Narrow-screen drawer accessibility hardened

Built a shared `DrawerRegion` component: genuine focus trap, visible Close control, `role="dialog"`/`aria-modal` applied **only** while open (never affecting desktop's permanent three-column behavior, verified directly). Mutual exclusion retained.

### Five further real bugs found and fixed while building genuine end-to-end verification

None of these were explicitly named by the audit; each surfaced only once the full canonical paths were actually driven through a real browser, confirming the value of the deeper testing the audit required:

1. **`CHECK_PATIENT_DISTRIBUTION`/`CHECK_EQA`/`CHECK_PBRTQC` had no UI control at all.** These are engine actions *distinct* from merely inspecting the corresponding panel — some decisive evidence (Pilot 1's `ev-affected-window`, Pilot 2's `ev-case-mix-decisive`) is gated specifically behind them via `availableOnlyAfterActionType`, not by panel inspection alone. Without a control for this, those evidence items were structurally unreachable through the interface. Fixed: a "Formally check [panel type]" button now appears in `PanelViewer` for these three panel types.
2. **Evidence with `sourcePanelId: null` had no UI surface anywhere.** `PanelViewer`'s per-panel evidence buttons are filtered to the currently-open panel; Briefing (shown when no panel is open) never rendered evidence buttons either. Fixed: `EvidenceTray` now shows a persistent "Other Evidence Available" section for this category, reachable regardless of which panel is open.
3. **A second, subtler instance of the audit's own Section-1 defect class**: `Pilot 2`'s `dec-take-seriously`/`opt-investigate` decision option carries `actionType: FORM_HYPOTHESIS` but — like all such options — does **not** embed its own `hypothesisId`; Stage 12A's own accepted pilot-path tests supply it as a separate, explicit argument alongside `decisionId`/`optionId`. Choosing this option through the decision dialog was bare-dispatching `FORM_HYPOTHESIS` with no `hypothesisId`, reproducing the exact `Unknown hypothesisId: undefined` error the audit's Section 1 targeted — just via the decision-dialog path rather than the plain ActionDock fallback. Fixed: `HypothesisWorkspace` now accepts an optional `pendingDecision`; choosing such an option opens the composer (auto-triggered), and only once the learner's own wording resolves a unique hypothesis match does the combined `{decisionId, optionId, hypothesisId}` action dispatch.
4. **`findMatchingDecision` picked the wrong decision when multiple decisions shared an actionType.** Pilot 2's `dec-take-seriously` has a `DOCUMENT`-actionType "Dismiss" option; `dec-disposition` *also* has a `DOCUMENT`-actionType option. Clicking the generic "Document" button opened `dec-take-seriously`'s dialog instead of `dec-disposition`'s — confirmed by direct browser reproduction. Fixed with a general (non-case-ID) tie-break: prefer the decision whose `availableFromPhase` unlocks *latest*, read directly from Stage 12A's own `SIMULATION_PHASES` ordering.
5. **The prior closure's header z-index fix (raising `.mqc-header` above the drawer backdrop) created a new bug**: the header's height is dynamic (wraps at narrow widths), so a drawer starting at `top: 0` could end up rendering *underneath* an unexpectedly-tall header, blocking drawer content. Fixed more surgically: only the toggle buttons themselves are elevated (`z-index: 45`), not the whole header — robust regardless of header height.

Each of these was caught by genuinely running the full canonical paths through a real browser and debugging actual failures — not assumed away or left implicit.

### Updated test totals

- UI component tests: **95/95** (was 60, +35)
- Stage 12B governance: **59/59** (was 57, +2)
- Real browser E2E: **40/40** (was 25, fully rewritten with genuine 3-pilot depth)
- Stage 12A regression: unchanged, **265/265**
- All historical baselines: unchanged and reconfirmed
- Frozen manifest sanctioned exceptions: **4 files** (case-schema.js + all 3 pilot cases)

---

## Stage 12B FINAL INTERVENTION-SEMANTICS ACCEPTANCE Closure

A fourth independent audit found exactly one material product defect remaining: generic bare-dispatched `APPLY_INTERVENTION` could receive full positive semantic credit without any case-authored evidentiary backing. This closure resolves it, adds the required Pilot 1 case-authored intervention decision, completes the Pilot 3 browser path, and re-verifies the entire system end to end.

### 1. Generic APPLY_INTERVENTION removal

Reproduced exactly as reported: in Pilot 2, after signal recognition, characterisation, and analytical hypothesis formation, bare `APPLY_INTERVENTION` returned `outcomeAppropriate=true`, `reasoningSupported=true`, `severity=INFORMATIONAL`, and `debrief.intervention.evidenceSupported=true` — despite Pilot 2's accepted ground truth being a population/case-mix explanation, not an analytical disturbance. `action-dock.jsx` now gates `APPLY_INTERVENTION` identically to `FORM_HYPOTHESIS`: it renders only when bound to a genuine available case-authored decision. No case-ID branching; the absence in Pilots 2/3 follows structurally from decision non-availability.

### 2. Pilot 1 case-authored intervention decision

Added `dec-intervention`/`opt-revert-lot` (category `INTERVENTION`, `availableFromPhase: 'HYPOTHESIS_GENERATION'`, `actionType: 'APPLY_INTERVENTION'`, `requiredEvidenceIdsForSupportedReasoning: ['ev-old-lot-repeat']`) using only the existing, unmodified Stage 12A decision-authoring machinery (the same `authoredOption`/evidence-prerequisite mechanism `dec-containment` and `dec-disposition` already use). **Zero engine.js or decision-model.js changes were needed or made** — the dynamic pre/post-evidence severity computation the audit requested is already fully general Stage 12A behavior.

### 3. Pre-evidence vs. post-evidence behavior — verified exact match

- Before `ev-old-lot-repeat`: `outcomeAppropriate=true, reasoningSupported=false, severity=UNSUPPORTED`
- After `ev-old-lot-repeat`: `outcomeAppropriate=true, reasoningSupported=true, severity=INFORMATIONAL`

Both verified directly against the running engine, matching the audit's exact specification.

### 4/5. Pilot 2 and Pilot 3 intervention absence

Verified directly: neither case has any decision opportunity with an `APPLY_INTERVENTION`-actionType option, so the control is structurally absent from both rooms — confirmed via both adapter-level checks and full interactive UI rendering.

### 6. Revised Pilot 1 path

`tests/morning-qc/pilot-paths.test.cjs`'s expert path — explicitly sanctioned by the audit for this change — now executes the intervention via `{decisionId: 'dec-intervention', optionId: 'opt-revert-lot'}` instead of a caller-supplied `evidenceSupported: true` flag. Still passes 39/39 unchanged; no additional assertions were required since the existing assertions already validate outcome/safety generically.

### 7/8. Completed Pilot 3 Chromium path and new checkpoints

Extended the real browser E2E suite: Pilot 3 now obtains `ev-rcv-calculation` (reachable via the persistent "Other Evidence Available" section, confirming the prior closure's fix generalizes), executes `dec-disposition`/`opt-no-hold-document`, confirms a real `decisionEventId`, records confidence against it, and confirms the service remains appropriately un-held with zero answer-key leakage. New named checkpoints: `P3-RCV-EVIDENCE-OBTAINED`, `P3-NO-ANSWER-KEY-REVEAL`, `P3-SUPPORTED-DISPOSITION`, `P3-CONFIDENCE-CONTROL`, `P3-STILL-NO-HOLD`. Pilot 1's section was also updated: "Apply intervention" now correctly routes through the decision dialog (`P1-INTERVENTION-DECISION-DIALOG`) with confidence recording (`P1-INTERVENTION-CONFIDENCE`).

### 9. Broader UI contract documented

Added Section 9 to `V09_MORNING_QC_UI_ARCHITECTURE.md`: the "no-caller-adjudication" invariant — the UI must never bare-dispatch an action whose semantic correctness depends on a caller-supplied adjudication flag. Scoped narrowly to `APPLY_INTERVENTION` per the audit's explicit instruction; `REPEAT_QC`/`REPEAT_CALIBRATION` deliberately left untouched since no failing invariant implicates them.

### Updated test totals

- UI component tests: **105/105** (was 95, +10 new: `INT-01` through `INT-07`, plus sub-assertions)
- Stage 12B governance: **65/65** (was 59, +6 new: dedicated Section 18 verifying the intervention fix structurally and via new named checkpoints)
- Real browser E2E: **47/47** (was 40, +7 new checkpoints)
- Stage 12A regression: unchanged, **265/265** (engine 49/49, pilot paths 39/39 — same count, revised content per Section 6 above — progression-invariants 59/59, governance 118/118)
- All historical baselines: unchanged and reconfirmed
- Frozen manifest sanctioned exceptions: still **4 files**, with `pilot-1-reagent-lot-shift.js`'s hash updated and the exceptions description expanded to transparently cover this new kind of change (a new decisionOpportunity, not merely a `learnerNote` projection)
- Isolated dev-build tree hash: `de533550074cc91bf13c177713d42fc7a081cbd5b13fb6fcfb72222ac8158cb0` (reconfirmed reproducible across 3 rebuilds)
