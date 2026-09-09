# PreciMind QC Learning Lab v0.9 — Stage 12C Production Integration

## The 14-destination invariant

Morning QC Room is reachable as a controlled internal screen
(`screen === "morning-qc"` in `app-shell.jsx`), never a 15th entry in
`NAV_ITEMS`. Verified directly (not merely grepped) via both a jsdom
count of rendered navigation buttons (`NAV-COUNT-14`, real browser) and
a source-level count of `NAV_ITEMS` array entries — both confirm exactly
14.

## An architectural tension, resolved

Modifying `app-shell.jsx`, `core-screens.jsx`, and `main.jsx` for this
integration would make the *committed*, frozen Stage 11C2 build artifact
(`dist-vite/`) stale relative to source — but that artifact's tree hash
(`4614aca9...`) must remain byte-identical per the accepted Stage 11C2
baseline. Resolved by creating a **new**, separate deterministic build
(`dist-vite-production/`, via a new `vite.production-integrated.config.mjs`
that shares the same `app/main.jsx` entry point but writes to its own
output directory) rather than rebuilding `dist-vite/` in place.
`dist-vite/` and `vite.modular.config.mjs` are never touched by this
stage — reconfirmed via direct hash computation, not assumed.

## Sanctioned Stage 11C2 file changes (exactly 3, explicitly listed)

- `app/main.jsx` — two additional global CSS imports
  (`morning-qc/ui/morning-qc-room.css`, `morning-qc/debrief/morning-qc-debrief.css`).
  No new `createRoot()` call — Stage 11C2's single-active-root invariant
  reconfirmed passing (49/49).
- `app/ui/app-shell.jsx` — one new import block, one new `else if`
  screen branch. `NAV_ITEMS` itself is untouched.
- `app/ui/core-screens.jsx` — one new capstone section in `HomeScreen`,
  one new capstone card in `CompetencyMapScreen`.

No scientific calculation file was touched.

## Case selection is neutral, not the dev launcher

`production-case-select.jsx` is a genuinely separate component from
`dev-launcher.jsx` (which remains isolated to `v09/dev/`, referenced only
by the isolated dev build). It never uses "Pilot 1/2/3" labels — several
of the raw case `identity.title` fields directly reveal root cause in
their subtitle (e.g. Pilot 1's "...After Reagent Lot Change"), so a
separate, hand-authored `PRODUCTION_CASE_META` display-title map is used
instead, showing only neutral operational framing plus difficulty —
never cause, decisive evidence, or pathway.

## Routing behavior

Screen transitions use the app's existing pure-React-state `goto()`
mechanism (no URL/history sync anywhere in this app, for any screen —
this is a pre-existing characteristic, not a Stage 12C regression).
"Return to PreciMind" and "Try another case" both call back into this
same mechanism. Refresh does not expose ground truth, since the debrief
gate re-evaluates on every render from the controller's actual state,
never from a URL parameter.
