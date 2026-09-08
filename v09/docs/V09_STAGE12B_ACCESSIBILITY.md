# PreciMind QC Learning Lab v0.9 — Stage 12B Accessibility

Consistent with the Stage 11B accessibility doctrine (not regressed).

## Keyboard

- All actionable controls (`mqc-btn`, `mqc-panel-card`, decision options)
  are real `<button>` elements — keyboard-reachable and
  Enter/Space-activatable by native browser behavior, not custom
  click-only handlers on non-interactive elements.
- `decision-dialog.jsx` traps focus within the dialog (Tab/Shift+Tab
  cycle confined to its buttons), closes on `Escape`, and returns focus
  to the control that opened it. **Verified with a genuine jsdom
  `KeyboardEvent` dispatch** (`ui-component.test.cjs`'s `KBD-01`/`KBD-02`
  assertions), not merely asserted from source code.
- `documentation-drawer.jsx` implements the same Escape-to-close and
  focus-return pattern.
- `mqc-panel-card` and `mqc-btn` both define `:focus-visible` outlines
  (`morning-qc-room.css`) rather than suppressing the browser default.

## Screen reader / semantics

- The service-state banner uses `role="status"` with `aria-live="polite"`
  so a service-state change (e.g. RUNNING → HELD) is announced.
- The decision dialog uses `role="dialog"` + `aria-modal="true"` +
  `aria-labelledby`.
- The documentation drawer uses `role="dialog"` + `aria-modal="true"` +
  `aria-label`.
- Panel dock buttons expose `aria-pressed` reflecting the currently-open
  panel.
- The reasoning workspace, event timeline, and patient-impact sections
  each carry an `aria-label` identifying their purpose.
- No information is encoded by color alone: the service-state banner
  pairs its tone with the state's text label; panel dock "inspected"
  status is conveyed by both a filled dot and (via screen reader) no
  separate channel is required since inspection state does not gate
  anything visually necessary to announce beyond the panel's presence.

## No premature correctness signaling (Section 31)

Colors distinguish operational tones only (neutral / attention) — never
green-means-correct or red-means-wrong during active reasoning. This is
enforced structurally: `ui-model.js`'s `SERVICE_STATE_TONE` map has
exactly two values (`neutral`, `attention`), and no component maps
`severity`/`outcomeAppropriate` to any visual treatment at all (those
fields are never even present in the learner-facing view model — see
the UI architecture doc's leakage discipline).

## Reduced motion

`morning-qc-room.css` includes a `prefers-reduced-motion: reduce` rule
disabling transitions/animations, matching the Stage 11B precedent.

## Disclosed limitation

Real assistive-technology testing (e.g. an actual screen reader reading
the live DOM, or automated axe-core/Lighthouse accessibility scoring in
a real browser) could not be performed — this environment cannot launch
a real browser (see `tests/browser/evidence/stage12b/LIMITATION.md` for
the exact, verified network-sandboxing cause). The semantics above were
implemented per the same patterns used successfully in Stage 11B and
verified structurally (correct ARIA attributes present, correct
event-handling code paths genuinely exercised via jsdom), but not
confirmed with a real assistive-technology pass.
