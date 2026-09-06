# v0.9 Accessibility Debt Register

Known accessibility characteristics validated as authentic v0.8 behavior during recovery (Stages 10E/10F). These are improvement candidates for v0.9 — **not modified in Stage 11A.**

---

## AD-001: Rule Laboratory `.mlj-point-g` Keyboard Activation

**Validated v0.8 behavior (Stage 10F):**
- `.mlj-point-g[role="button"][tabindex="0"]` elements ARE keyboard-focusable (Tab navigation works)
- Elements have an authored `onClick` handler
- Elements have **no authored `onKeyDown` handler**
- Enter and Space key presses do **not** activate point selection
- Only mouse click (or a dispatched `MouseEvent`) activates `togglePoint()`

**Impact:** A keyboard-only user can navigate to and "focus" a QC point in Rule Detective but cannot select it without a mouse. This affects the Rule Detective interaction gate (rule + trigger point + scope + confidence required before submission).

**v0.9 improvement candidate:** Add an `onKeyDown` handler that treats Enter/Space identically to click, following standard ARIA `role="button"` conventions.

---

## AD-002: LJ Chart `.ljchart-point-g` Activation Semantics

**Validated v0.8 behavior (Stage 10E):**
- `.ljchart-point-g[role="button"][tabindex="0"]` elements ARE keyboard-focusable
- Focus alone changes the `.ljchart-tooltip` content (this part IS keyboard-accessible)
- Not yet independently verified whether Enter/Space on an LJ point triggers any additional state change beyond the tooltip update, or whether LJ points have further click-only behavior analogous to AD-001

**v0.9 action:** Verify whether LJ chart points have any click-only behavior beyond tooltip display. If so, apply the same keyboard-activation fix as AD-001 for consistency across both chart types.

---

## Cross-Cutting Recommendation

If AD-001 is fixed, apply the identical pattern to AD-002 and any other SVG `role="button"` interactive element in the v0.9 codebase, so keyboard activation semantics are consistent across the whole application rather than fixed piecemeal per screen.

---

## Non-Goals for Stage 11A

This document is a registry only. No code change is made in Stage 11A. Any fix must:
1. Preserve the existing click behavior exactly
2. Add equivalent keyboard behavior
3. Be covered by new v0.9 tests before being considered complete
4. Be verified not to alter any v0.8-inherited scientific/pedagogic behavior
