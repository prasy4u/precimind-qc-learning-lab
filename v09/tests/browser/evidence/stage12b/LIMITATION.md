# Stage 12B Browser Evidence — Disclosed Limitation

**Real browser screenshots and pixel-level CSS layout QA (as required by
Sections 41–42 of the Stage 12B specification) could NOT be produced in
this environment.**

## What happened

Stage 12B's browser test matrix requires Playwright driving a real
Chromium instance. This sandbox's network egress is allowlisted to a
fixed set of domains (package registries, GitHub, etc.). Playwright's
browser binary is hosted at `cdn.playwright.dev`, which is **not** in
that allowlist.

This was verified directly, not assumed:

```
$ npx playwright install chromium
Downloading Chrome for Testing 153.0.8010.12 (playwright chromium v1243)
  from https://cdn.playwright.dev/builds/cft/153.0.8010.12/linux64/chrome-linux64.zip
Error: Download failed: server returned code 403
  body 'Host not in allowlist: cdn.playwright.dev. Add this host to
  your network egress settings to allow access.'
Failed to install browsers
```

The `playwright` npm package itself installs fine (registry.npmjs.org
is allowlisted) — only the browser binary download is blocked.

## What was done instead

A genuine, working substitute was built and used throughout Stage 12B
testing:

- **`tests/morning-qc/build-support/jsx-build.cjs`** — transforms the
  Morning QC Room `.jsx` components into plain ESM via Vite's bundled
  OXC transform (`vite.transformWithOxc`) — no new project dependency
  was added; `vite` is already a committed devDependency.
- **`tests/morning-qc/build-support/dom-test-harness.cjs`** — installs a
  `jsdom` global DOM (a pure-JS DOM implementation, no native browser
  binary required) and provides `click`/`keydown`/`byText` helpers.
- **`tests/morning-qc/ui-component.test.cjs`** — uses `react-dom/client`'s
  `createRoot` plus React 19's `act()` against that jsdom DOM to perform
  **genuine interactive testing**: real click dispatch, real React
  reconciliation, real conditional re-rendering, real keyboard event
  handling (Escape closes the decision dialog, verified by actually
  dispatching a `KeyboardEvent` and checking the DOM afterward, not by
  asserting source code contains an `onKeyDown` handler).

This is the same underlying technology (jsdom) used by a large fraction
of real-world React test suites (Jest + Testing Library), and it
genuinely exercises interactivity, state transitions, and DOM structure/
ARIA attributes.

## What this substitute does NOT verify

- **No real visual layout or paint.** jsdom does not implement CSS box-
  model layout, so no genuine horizontal-overflow, clipping, or
  off-screen-element detection (Section 42) was possible. The CSS file
  was written with layout intent (Section 28's reference widths,
  responsive breakpoints, no fixed pixel widths that would clip) and
  reviewed by inspection, but this is a source-level review, not
  measured evidence.
- **No screenshots.** Section 41's required screenshot evidence at
  1440×1000 and 390×844 does not exist. No fabricated images have been
  created in its place.
- **No real browser paint of focus indicators, hover states, or
  animation.** These were implemented per the CSS (`:focus-visible`
  outlines, `prefers-reduced-motion` handling) but not visually
  confirmed.

## Recommendation

If browser-level verification is required for acceptance, this stage's
browser test matrix (`v09/tests/browser/v09-stage12b-morning-qc-shell.e2e.js`
— not created, since it cannot be run) should be authored and executed
in an environment where `cdn.playwright.dev` (or an equivalent
self-hosted Chromium binary) is reachable, or where a different browser
automation tool with a pre-installed binary is available.
