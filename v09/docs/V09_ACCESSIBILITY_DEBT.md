# v0.9 Accessibility Debt Register

Known accessibility characteristics validated as authentic v0.8 behavior during recovery (Stages 10E/10F). These are improvement candidates for v0.9 — **not modified in Stage 11A.**

---

## AD-001: Rule Laboratory `.mlj-point-g` Keyboard Activation

**Status: FIXED_STAGE_11B**

**Validated v0.8 behavior (Stage 10F, unchanged, preserved as historical record):**
- `.mlj-point-g[role="button"][tabindex="0"]` elements ARE keyboard-focusable (Tab navigation works)
- Elements have an authored `onClick` handler
- Elements have **no authored `onKeyDown` handler**
- Enter and Space key presses do **not** activate point selection
- Only mouse click (or a dispatched `MouseEvent`) activates `togglePoint()`

**Impact (as it existed in v0.8, and in v09/src before Stage 11B):** A keyboard-only user can navigate to and "focus" a QC point in Rule Detective but cannot select it without a mouse.

**Stage 11B fix (`v09/src/rules/ui-components.jsx` only — root `src/` unchanged):** Added a single `activatePoint()` function invoked identically by `onClick` and by `onKeyDown` (Enter and Space, with `preventDefault()` on Space to avoid page scroll). Verified via `v09/tests/browser/v09-accessibility.e2e.js`: click behavior unchanged (MATCH against v0.8 reference); Enter/Space now activate the point (`INTENDED_DELTA` — a documented, deliberate improvement over the v0.8 known limitation, not an unexpected regression).

---

## AD-002: LJ Chart `.ljchart-point-g` Activation Semantics

**Status: FIXED_STAGE_11B**

**Validated v0.8 behavior (Stage 10E, unchanged, preserved as historical record):**
- `.ljchart-point-g[role="button"][tabindex="0"]` elements ARE keyboard-focusable
- Focus alone changes the `.ljchart-tooltip` content (this part IS keyboard-accessible)
- Click toggles the active/selected point (on/off)
- Stage 11B audit confirmed: no additional Enter/Space handling existed pre-fix — click-only toggle beyond the focus-driven tooltip

**Stage 11B fix (`v09/src/ui/shared-components.jsx` only — root `src/` unchanged):** Added a single `toggleActive()` function invoked identically by `onClick` and `onKeyDown` (Enter/Space, `preventDefault()` on Space). Focus-shows-tooltip behavior is unchanged. Verified: focus/click MATCH against v0.8 reference; Enter now toggles (`INTENDED_DELTA`).

---

## AD-003: EQA Longitudinal Chart Point Keyboard Activation (Discovered Stage 11B)

**Status: FIXED_STAGE_11B**

Not named in the Stage 11A debt register — found by the Stage 11B full-repository interactive-control audit (`V09_INTERACTIVE_CONTROL_AUDIT.md`).

**Pre-fix v0.8/v09 behavior:** `v09/src/eqa/ui-components.jsx` — the Longitudinal EQA deviation chart uses the identical pattern as AD-002: `.ljchart-point-g[role="button"][tabindex="0"]`, click toggles active round, focus shows tooltip, no `onKeyDown`.

**Stage 11B fix:** Same pattern as AD-002 — single `toggleActive()` function shared by click/Enter/Space. Verified: click MATCH; Enter now toggles (`INTENDED_DELTA`).

---

## Cross-Cutting Outcome

All three synthetic `role="button"` controls found in `v09/src` (Rule Detective, LJ chart, EQA chart) now share the accessibility rule: **Enter and Space trigger the same semantic action as click.** The full-repository audit (Stage 11B) confirms these are the only three such controls — no further undiscovered controls remain in `v09/src` as of this stage.

---

## Non-Goals Carried Forward

Fixes were scoped exclusively to `v09/src/**`. The root `src/**` recovered v0.8 source remains byte-for-byte unchanged (verified by SHA-256 checks in the Stage 11B governance test) — the v0.8 accessibility limitation is preserved as an accurate historical record in the frozen recovery artifacts, while `v09/src` carries the improvement forward.
