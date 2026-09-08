# Stage 12B Browser Evidence — Resolution Notice

**UPDATE (corrective closure): real browser evidence now exists.** The
original version of this file (superseded below) reported that
Playwright's Chromium binary could not be downloaded in this sandbox.
That specific finding was correct — `npx playwright install chromium`
still fails with HTTP 403 "Host not in allowlist: cdn.playwright.dev".

However, during the corrective-closure audit, this environment was found
to already have several **pre-staged Chromium binaries** on disk (not
downloaded by Playwright, but present from container build):

```
/opt/pw-browsers/chromium-1194/chrome-linux/chrome   (Chromium 141.0.7390.37)
/opt/pw-browsers/chromium_headless_shell-1194/...
/opt/google/chrome/chrome                             (same version)
/home/claude/.cache/puppeteer/chrome/...
```

The npm `playwright-core` package's *default* (latest) version expects a
different browser revision than what's staged here, so a naive
`npm install playwright-core` + `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`
still fails with an executable-not-found error. Matching the **exact**
`playwright-core` version to the pre-staged revision resolves this:

```
npm install playwright-core@1.56.0   # matches revision 1194, exactly
                                       # what /opt/pw-browsers/ contains
                                       # (confirmed against the Python
                                       # playwright package's own pinned
                                       # version, 1.56.0, installed
                                       # separately in this environment)
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node tests/browser/v09-stage12b-morning-qc-shell.e2e.js
```

This is now pinned in `v09/tests/morning-qc/package.json` (the test-local
dependency manifest — see Section 9 of this closure). The E2E harness
(`v09-stage12b-morning-qc-shell.e2e.js`) also supports a `CHROMIUM_PATH`
environment variable override for any environment with a browser at a
different location, and falls back to searching a short list of common
pre-staged paths.

## Result

`tests/browser/v09-stage12b-morning-qc-shell.e2e.js`, run against a REAL
headless Chromium instance (not jsdom, not simulated), driving the real,
deterministically-built `dist-morning-qc-dev/` artifact over a local
static HTTP server: **25/25 assertions pass** across all three real
Stage 12A pilot cases and all four required viewports (1440×1000,
1366×768, 1024×768, 390×844). See `result.json` in this directory for
the full machine-readable checkpoint list, and the `.png` files for the
required screenshot evidence (initial room, panel open, decision dialog,
HELD/verification state, at both a desktop and the mobile reference
width).

**Two genuine bugs were found and fixed by this real browser testing**
that jsdom-based interactive testing (used in the prior closure cycle)
could not have caught, since jsdom does not implement real CSS layout:

1. A `z-index` stacking bug where the drawer backdrop covered the header,
   making the drawer-toggle button unclickable to close the drawer.
2. A classic CSS Grid overflow bug: a bare `1fr` grid track does not
   clamp to the viewport when its content has a larger intrinsic minimum
   width, causing real horizontal document overflow at the 390px mobile
   viewport. Fixed via `minmax(0, 1fr)` plus `min-width: 0` on the
   affected flex/grid children.

A third, unrelated bug was also found and fixed in `dev-launcher.jsx`
(the Stage-12B-only development tool, not the Room shell itself): its
pilot-selector toolbar never collapsed after a case was chosen and had
no responsive handling, independently causing page overflow. Fixed by
collapsing it to a compact "Change pilot" control once a case is active.

## What this does NOT claim

This confirms the shell renders, is interactive, and passes the
specific layout/overflow/containment checks written into this harness —
it is not a claim of exhaustive visual QA, cross-browser testing (only
Chromium was available), or a substitute for human design review.
