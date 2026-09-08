# PreciMind QC Learning Lab v0.9 — Stage 12B Interaction Model

## Experience goal

The learner should feel they have entered a functioning clinical
laboratory at the start of a shift — situational awareness, selective
information gathering, and decision-making under uncertainty. Not a
quiz, wizard, or dashboard revealing every answer at once.

## Progression is never a visible stepper

Stage 12A's fourteen engine phases (BRIEFING → ... → DEBRIEF) are never
rendered as "Step 4 of 14" or a forced sequence. `room-status.jsx`
renders three neutral dots (noticed / gathering / concluding), derived
from already-public facts (signal acknowledged, evidence/hypotheses
present, disposition reached) — enough to orient without revealing
future steps or requiring sequential completion.

## Layout

A three-column desktop grid (panel dock · main viewer · reasoning
workspace) with a header and bottom action bar, collapsing to fixed
overlay drawers on narrower viewports (≤1024px) and a single stacked
column with a vertical action list on mobile (≤480px). See
`morning-qc-room.css`.

## Panel discovery, not a checklist

Only genuinely-available panels appear in the dock (Section 5 of the UI
architecture doc). Panel content is revealed only after the learner's own
`INSPECT_PANEL` dispatch — never previewed. This is deliberately
information-cost-aware: elapsed simulated time is shown in the header,
but no "3/10 panels opened" completion metric is ever displayed, since
Stage 12A already scores selective information gathering
(`EVIDENCE_SELECTION`) and the UI must not undermine that by encouraging
exhaustive panel-opening.

## Decisions without spoilers

Case-authored decision opportunities open a modal presenting each
option's label as a real professional choice — never the case's own
`consequenceSummary` (which is literally answer-key text, e.g. "Correct —
PBRTQC can detect signals IQC misses..."), `severity`, or
`outcomeAppropriate`. Feedback is deferred to the (Stage-12B-minimal,
Stage-12C-eventual) debrief.

## Confidence tied to the exact decision event

Every important decision execution returns a `decisionEventId`; the
confidence control that appears immediately afterward is bound to that
exact identifier, never the reusable `decisionId` — so a learner who
later revises the same decision (the Room's REASSESS doctrine, from
Stage 12A) records confidence against the specific revised event.

## Documentation is a claim, not a fact

The documentation drawer is visually and structurally separate from the
event timeline. Writing "I repeated QC" in documentation is never the
same as having executed `REPEAT_QC` — the engine enforces this (Stage
12A's Invariant A/C), and the UI reflects it by never merging the two
data sources.

## Error handling

Every engine rejection is surfaced as a plain-language banner
(`mqc-error-banner`) — e.g. "This action is not available at the current
point in the investigation" — never a stack trace or internal schema
term. The room never crashes on a rejected dispatch; `dispatch()` in
`morning-qc-room.jsx` always re-reads a valid view model afterward.

## Minimal developer debrief only

Stage 12B does not build the learner-facing polished debrief. A
developer-only preview (`controller.getDeveloperDebriefPreview()`,
explicitly named, never wired into any learner-facing component) exists
solely to verify UI data binding against Stage 12A's real
`debrief-model.js` output. The full learner debrief is Stage 12C's job.
