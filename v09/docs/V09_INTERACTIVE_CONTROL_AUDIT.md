# v0.9 Interactive Control Audit

**Stage:** 11B  
**Scope:** Full search of `v09/src/**` for synthetic (non-native) interactive controls — any element using `role="button"`, `tabIndex={0}`, `onClick` on SVG/div/span, or equivalent patterns.

**Search method:** `grep -rn 'tabIndex\|role="button"' v09/src/` plus a secondary search for `onClick` on non-`<button>` elements.

**Result: exactly 3 synthetic interactive controls found.** No additional undiscovered controls exist beyond the two named in the Stage 11A debt register (Rule, LJ) — the audit additionally confirms EQA as a third, previously-unlisted control of the same kind.

---

## Control 1: Rule Detective QC Point

| Field | Value |
|-------|-------|
| File | `v09/src/rules/ui-components.jsx` |
| Line | 77 |
| Component | `MultiLevelLJChart` (point rendering, `renderSeries`) |
| Element | `<g>` (SVG group) |
| Class | `mlj-point-g` |
| role | `button` |
| tabIndex | `0` |
| Click behavior | `setActive(k); onPointClick(runNumber, levelId)` — selects/toggles the trigger point for Rule Detective scoring |
| Focus behavior | `onFocus={() => setActive(k)}` — sets tooltip-visible "active" point |
| Enter behavior (pre-fix) | **None** — no `onKeyDown` handler |
| Space behavior (pre-fix) | **None** — no `onKeyDown` handler |
| Accessible name | `aria-label`: `"{levelName}, run {runNumber}, value {rawValue}, {zScore} SD"` |
| Remediation required | **YES** |

---

## Control 2: LJ Chart Point

| Field | Value |
|-------|-------|
| File | `v09/src/ui/shared-components.jsx` |
| Line | 169–170 |
| Component | LJ chart point rendering |
| Element | `<g>` (SVG group) |
| Class | `ljchart-point-g` |
| role | `button` |
| tabIndex | `0` |
| Click behavior | `setActive(i === active ? null : i)` — toggles tooltip display for the point |
| Focus behavior | `onFocus={() => setActive(i)}` — shows tooltip on focus alone |
| Enter behavior (pre-fix) | **None** — no `onKeyDown` handler |
| Space behavior (pre-fix) | **None** — no `onKeyDown` handler |
| Accessible name | `aria-label`: `"Run {run}, value {raw}, {z} SD"` |
| Remediation required | **YES** |

---

## Control 3: EQA Longitudinal Chart Point

| Field | Value |
|-------|-------|
| File | `v09/src/eqa/ui-components.jsx` |
| Line | 256 |
| Component | Longitudinal EQA deviation chart point rendering |
| Element | `<g>` (SVG group) |
| Class | `ljchart-point-g` (reused LJ-style class name for the same visual pattern) |
| role | `button` |
| tabIndex | `0` |
| Click behavior | `setActive(i === active ? null : i)` — toggles tooltip display for the round |
| Focus behavior | `onFocus={() => setActive(i)}` — shows tooltip on focus alone |
| Enter behavior (pre-fix) | **None** — no `onKeyDown` handler |
| Space behavior (pre-fix) | **None** — no `onKeyDown` handler |
| Accessible name | `aria-label`: `"Round {round}, deviation {pct}%{, event: ...}"` |
| Remediation required | **YES** |

---

## Non-Synthetic Controls Reviewed (No Remediation Needed)

| Element | File | Reason not flagged |
|---------|------|---------------------|
| `<div role="dialog" tabIndex={-1}>` | `v09/src/ui/shared-components.jsx:86` | Standard modal dialog focus-trap pattern (`tabIndex={-1}` for programmatic focus only, not Tab-navigable). Not a button; no click/Enter/Space semantics expected. |
| All `<button>` elements throughout `v09/src` | Various | Native `<button>` elements already receive Enter/Space activation from the browser automatically — no synthetic remediation is needed. |

---

## Accessibility Rule Applied (Stage 11B)

For every element with `role="button"` and `tabIndex={0}`:

> **Enter and Space must trigger the same semantic action as click**, unless there is a documented reason not to expose button semantics (in which case the button semantics should be removed instead of left non-functional).

All three controls above satisfy the criteria for genuine button semantics — they perform a discrete, click-triggered state change that a sighted mouse user can invoke. None qualify for "remove button semantics instead" — all three receive the keyboard-activation fix (see `V09_ACCESSIBILITY_DEBT.md` for fix status).
