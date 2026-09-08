# PreciMind QC Learning Lab v0.9 — Morning QC Room UI Architecture

**Stage 12B — Interaction Shell + Panel Architecture**
Artifact Class: V09_NEW / V09_TEST (as marked per file)

## 1. Purpose and boundary

Stage 12B builds the first learner-facing interface for the Morning QC
Room. It is explicitly **not** the full capstone experience — it
establishes the visual shell, panel architecture, action controls, and
engine binding needed to validate the interaction model, while Stage 12A
remains the sole authority for every scientific, progression, evidence,
decision, patient-impact, service-state, scoring, confidence, and debrief
fact.

**The one governing rule**: Stage 12B consumes the engine. It never
recreates engine rules in React. Every availability, safety, and
correctness decision is delegated to Stage 12A's `engine.js`,
`case-validator.js`, `decision-model.js`, `evidence-model.js`,
`scoring-model.js`, and `debrief-model.js`.

## 2. File layout

```
v09/app/morning-qc/ui/
  ui-adapter.js            — the ONLY bridge between React and the engine
  ui-model.js               — pure display-label lookups (no logic)
  morning-qc-room.css        — visual system (reuses v0.9 tokens)
  morning-qc-room.jsx        — stateful root component
  room-layout.jsx            — pure grid shell
  room-header.jsx             — top bar (identity, elapsed time, status)
  room-status.jsx             — subtle, non-wizard progress dots
  service-state-banner.jsx    — engine-verbatim service-state display
  case-briefing.jsx           — BRIEFING-legitimate content only
  panel-dock.jsx               — left rail: available panels only
  panel-card.jsx                — individual panel button
  panel-viewer.jsx              — main content area for the open panel
  hypothesis-workspace.jsx      — right rail: learner-considered hypotheses
  evidence-tray.jsx              — right rail: obtained evidence only
  patient-impact-panel.jsx       — right rail: patientImpactState UI
  action-dock.jsx                 — bottom bar, grouped contextual actions
  decision-dialog.jsx              — case-authored decision modal
  confidence-control.jsx            — decisionEventId-bound confidence UI
  documentation-drawer.jsx           — allowlisted learner documentation
  event-timeline.jsx                  — real action history (sanitized)
  dev-launcher.jsx                     — Stage-12B-only pilot-case picker
  index.js                              — public exports
```

## 3. The engine adapter (`ui-adapter.js`)

`createRoomController(caseObj)` holds the **single authoritative** engine
state for a case. It exposes:

- `dispatch(action)` — the only way state changes; calls
  `engine.applyAction()` directly and never applies an action if the
  engine rejects it (the engine's own pure-function no-mutation-on-
  rejection contract, verified in Stage 12A's progression-invariant
  suite, is relied upon rather than re-implemented).
- `getViewModel()` — a learner-safe projection of state (see Section 5).
- `getDeveloperDebriefPreview()` — the ONLY path that reaches
  `debrief-model.js`'s ground-truth-consuming output; explicitly named
  and never used by learner-facing components.
- `reset()` / remounting via `key` — guarantees zero state leakage
  between cases (Section 35).

Every availability predicate in the adapter either calls an
engine-exported pure function (`deriveUnlockedPhaseIndex`) directly, or
reads a **public** engine state field the engine itself already treats as
authoritative (`inspectedPanelIds`, `obtainedEvidenceIds`, `actionHistory`,
`systemEvents`). Any imprecision in this convenience filtering can never
cause a forgery or leak, because `dispatch()` always still goes through
the real, unmodified `engine.applyAction()`.

## 4. Learner-safe view model (leakage discipline)

`getViewModel()` **never** exposes: `groundTruth`, `decisive`, `severity`,
`outcomeAppropriate`, `reasoningSupported`, `decisionCategory`'s authored
`consequenceSummary` (answer-key text), `requiredEvidenceIdsForSupportedReasoning`,
or panel `relevance`. Panel `content` is exposed only once the adapter
confirms genuine inspection (`inspectedPanelIds.includes(panel.id)`) —
never a preview before the learner's own `INSPECT_PANEL` dispatch.

This was independently verified with an explicit runtime leakage audit
against real rendered HTML (`ui-component.test.cjs`), not merely a
source-code claim.

## 5. Panel availability (Section 11 safety requirement)

Unavailable panels are **omitted** from the dock entirely (the audit's
preferred treatment), not shown locked — this also avoids a panel's mere
title hinting at what to inspect before the learner has earned that
information. A panel becomes visible the moment the engine's own
`deriveUnlockedPhaseIndex()` check flips true, as a side effect of
legitimate actions taken elsewhere — never because the UI "decided" so.

## 6. Decisions, confidence, and documentation (Invariants A/B/C)

- Decision dialogs show only `label`/`actionType` per option — never the
  case-authored `consequenceSummary`, `severity`, or `outcomeAppropriate`.
  No immediate correctness reveal; Morning QC Room uses delayed debrief.
- Confidence is always bound to the exact `decisionEventId` the engine
  returned from the executed decision — never the reusable `decisionId`.
  A revised decision under the same `decisionId` gets its own event and
  its own independent confidence control.
- The documentation drawer writes only the three fields Stage 12A's
  `DOCUMENT` handler allowlists (`finalDisposition`, `escalation`,
  `establishedCause`) — the engine itself silently strips anything else,
  so this is a UX courtesy, not the real security boundary.

## 7. Reuse of the established v0.9 visual system

`morning-qc-room.css` reuses the existing `:root` design tokens from
`app/ui/original-v0.8.css` (`--bg`, `--surface`, `--border`, `--text`,
`--brand`, `--ok`, `--warn`, `--danger`, `--font`, `--font-mono`,
`--radius`, `--shadow`) rather than introducing a parallel palette, per
the project's established visual identity.

## 8. Generic, data-driven case support

No file in `v09/app/morning-qc/ui/` branches on a case identity
(`if (caseId === 'pilot-1')` or equivalent). All three pilots are
supported through the same adapter and components, driven entirely by
case data and engine state — verified directly in governance (Section 6
of `stage12b-morning-qc-shell.test.js`).

## 9. The no-caller-adjudication UI invariant (Stage 12B FINAL INTERVENTION-SEMANTICS ACCEPTANCE closure)

**Invariant**: the UI must never bare-dispatch an action whose semantic
correctness depends on a caller-supplied adjudication flag (e.g. an
`evidenceSupported` boolean, or any other flag the case data itself does
not derive from genuine evidence prerequisites). At minimum this applies
to `APPLY_INTERVENTION`: Stage 12A's generic (non-case-authored) code
path for this action treats an absent adjudication flag as effectively
"supported," so a bare UI dispatch received full positive credit
(`outcomeAppropriate=true`, `reasoningSupported=true`,
`debrief.intervention.evidenceSupported=true`) with zero case-authored
evidentiary backing — confirmed reproducible in both Pilot 2 and Pilot 3,
neither of which has a scientifically justified intervention.

The fix is structural, not case-specific: `APPLY_INTERVENTION` now
receives the same treatment `FORM_HYPOTHESIS` already received in the
prior closure — it renders in `ActionDock` only when bound to a genuine
available case-authored decision (`{decisionId, optionId}`), whose
`reasoningSupported` the engine then derives from that decision's own
`requiredEvidenceIdsForSupportedReasoning`, never from an absent flag.
Where no such decision exists (Pilots 2 and 3), the control is simply
absent — a consequence of decision non-availability, never of the UI
checking a case ID or answer key.

This invariant is scoped narrowly to `APPLY_INTERVENTION` for this
closure; `REPEAT_QC`/`REPEAT_CALIBRATION` were deliberately left
unchanged since no failing invariant currently implicates them (their
own `wasNecessary` flag, when supplied, only ever downgrades severity to
`INEFFICIENT` — it can never manufacture false positive evidentiary
credit the way an absent `evidenceSupported` could for intervention).
