# PreciMind QC Learning Lab v0.9 — Stage 12C Debrief Architecture

## Purpose

Stage 12C answers three learner questions: what did I do, how good was my
reasoning, and what should I improve. It builds a learner-facing debrief,
competency profile, confidence-calibration feedback, and controlled
production integration — consuming Stage 12A's scoring/debrief models
directly, never recalculating.

## File layout

```
v09/app/morning-qc/debrief/
  debrief-adapter.js         — the ONLY learner-facing projection layer
  debrief-model-ui.js         — pure display-label lookups
  morning-qc-debrief.css       — visual system (reuses v0.9/Stage 12B tokens)
  morning-qc-debrief.jsx        — root component, progressive disclosure
  debrief-header.jsx             — visually distinct from active-case state
  case-resolution.jsx             — concise professional synthesis
  competency-profile.jsx            — 12-dimension horizontal cards
  decision-review.jsx                — four-quadrant outcome/reasoning display
  confidence-calibration.jsx           — by decisionEventId, revision-aware
  evidence-review.jsx                   — qualitative, never a completion %
  documentation-review.jsx                — documented vs. executed
  patient-safety-review.jsx                 — QC/disturbance/cause/impact/disposition kept distinct
  reasoning-timeline.jsx                      — only phases actually encountered
  learning-priorities.jsx                       — max 3 priorities + max 3 lab recs
  index.js
```

## The debrief adapter (safety-critical)

`isDebriefable(state, options)` is the entry gate: a case is legitimately
debriefable only once the learner has genuinely engaged AND either
explicitly requested to finish or reached a real terminal service state
(`RESUMED`/`ESCALATED`).

`getDebriefProjection(caseObj, state, options)` **throws** if the gate is
not satisfied — this is the actual security boundary, verified directly
(not merely a UI convenience): nothing in `v09/app/morning-qc/debrief/**`
reads `caseObj.groundTruth` except through this function's return value.

The projection recalculates nothing. Every rating comes from
`computeScoringProfile()`; every decision's outcome/reasoning axis comes
from `summarizeDecisions()`; every debrief fact (containment timing,
evidence value, disposition truth-separation) comes from
`generateDebrief()`. This file only reshapes and labels those values —
resolving option labels/`consequenceSummary` text (safe only post-gate),
grouping decisions by reusable `decisionId` for revision display while
preserving each `decisionEventId` separately, and capping learning
priorities/lab recommendations at 3 each.

## Entry point wiring

`morning-qc-room.jsx` owns a `learnerRequestedFinish`/`debriefOpen`
presentation-state pair (analogous to drawer-open state — never
simulation truth). A "Finish case and review" button appears once the
signal is acknowledged; clicking it sets both flags and the room
computes the projection via `getDebriefProjection()`, swapping to
`<MorningQCDebrief>` entirely (Section 28: active-case and debrief are
never shown simultaneously). "Repeat this case" calls `controller.reset()`
plus clears every piece of local UI state, guaranteeing a genuinely fresh
engine state (verified: `CYCLE-07`/`CYCLE-08` in `debrief-ui.test.cjs`).
