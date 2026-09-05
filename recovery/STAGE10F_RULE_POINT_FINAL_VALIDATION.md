# Stage 10F — Rule Detective State-Transition Final Validation Report

**Stage:** 10F  
**Artifact Class:** D  
**Browser:** Playwright + Chromium 141.0.7390.37  
**Original:** `recovery/original-v0.8.html` SHA `e5317bf1...`  
**Candidate:** `dist/recovered-v0.8-faithful.html` SHA `a9fe9a3a...` (Class B)

---

## Why Stage 10F Was Required

Stage 10E successfully focused the real `.mlj-point-g[role="button"][tabindex="0"]` SVG element but failed to validate the actual `togglePoint()` state transition because no non-none rule had been selected first. The `.point-selection-hint` was absent before and after the click — the click was a no-op. Stage 10F selects Rule `1₃s` first and then demonstrates the full authored state machine.

---

## Test Configuration

| Parameter | Value |
|-----------|-------|
| Case selected | **Case 3** |
| Correct rules (authored) | `["13s"]` / `1₃s` |
| Correct scope (authored) | `"single"` |
| Trigger point | **Level 1, run 4, value 93.60, -3.20 SD** |
| Rule selected | **1₃s** |
| Interaction | Authored `MouseEvent('click', {bubbles:true})` on focused SVG point |

---

## Step-by-Step Results

### Pre-Rule: Hint Absent
`.point-selection-hint` before any rule selected: **ABSENT** (orig = cand = MATCH ✅)  
This is expected authored behavior — point selection is only meaningful after a rule is chosen.

### Select 1₃s Rule
After clicking the `1₃s` button:  
`.point-selection-hint` → **"Selected: none yet"** (orig = cand = MATCH ✅)  
Hint now exists, confirming the rule was registered and point-selection is active.

### Focus Level 1 Run 4 (the -3.20 SD trigger point)

| Property | Original | Candidate | Pass |
|----------|---------|----------|------|
| tagName | **G** | **G** | ✅ |
| class | `mlj-point-g` | `mlj-point-g` | ✅ |
| role | `button` | `button` | ✅ |
| tabIndex | `0` | `0` | ✅ |
| aria-label | `"Level 1, run 4, value 93.60, -3.20 SD"` | identical | ✅ |

### Keyboard Enter Behavior
- Enter keydown/keyup dispatched on focused `.mlj-point-g` element
- Ring count before: 1 (initial chart artifact, not a selection)
- Ring count after Enter: 1 (unchanged)
- `.point-selection-hint` after Enter: "Selected: none yet" (unchanged)
- **Enter does NOT activate the point** — the `.mlj-point-g` element has `onClick` but no authored `onKeyDown` handler
- **Classification: MATCH** — both artifacts behave identically
- **v0.8 accessibility characteristic:** SVG role=button point is keyboard-focusable but not keyboard-activatable via Enter/Space

### Keyboard Space Behavior
- Identical to Enter — Space does not activate the point
- **Classification: MATCH** — both artifacts behave identically

### Click Activation (Authored Interaction)
After `MouseEvent('click', {bubbles:true})` dispatched on the focused Level 1 Run 4 point:

| Metric | Original | Candidate | Pass |
|--------|---------|----------|------|
| `.point-selection-hint` | **"Selected: 4:L1"** | **"Selected: 4:L1"** | ✅ |
| "4:L1" in hint | ✓ | ✓ | ✅ |
| `.mlj-ring-selected` count | 2 | 2 | ✅ |
| Root DOM hash | identical | — | ✅ |

*Note: The authored MLJ chart renders 2 `.mlj-ring-selected` elements per selected point (outer ring + inner sample indicator). This is the authored behavior observed in both artifacts.*

**`togglePoint()` was successfully executed** — the state transition from "none yet" → "4:L1" is confirmed.

### Deselect (Second Click on Same Point)
After second `MouseEvent('click')` on Level 1 Run 4:

| Metric | Original | Candidate | Pass |
|--------|---------|----------|------|
| `.point-selection-hint` | **"Selected: none yet"** | **"Selected: none yet"** | ✅ |
| `.mlj-ring-selected` count | 1 (reduced from 2) | 1 | ✅ |

**Bidirectional state machine confirmed:** select → deselect cycle works identically in original and candidate.

### Reselect + Submission Gate
- Point reselected (rings=2), scope "Single observation" clicked, confidence selected
- Submission button enabled: **orig=true, cand=true** → MATCH ✅

### Console / Page Errors
- Page errors throughout: **0 (orig = cand)** → MATCH ✅

---

## Stage 10F Summary

**Total: 21 checkpoints | MATCH: 21 | DIFFERENCE: 0 | BLOCKED: 0 | NOT_TESTED: 0**

---

## Keyboard Behavior Note (v0.8 Accessibility Characteristic)

The `.mlj-point-g[role="button"][tabindex="0"]` SVG element:
- **IS** keyboard-focusable (tabIndex=0 allows Tab navigation)
- **IS NOT** keyboard-activatable via Enter or Space (no authored `onKeyDown` handler)
- **IS** activatable via mouse click / `MouseEvent('click', {bubbles:true})`

This is an accessibility characteristic of v0.8 — not a recovery discrepancy. Both original and candidate behave identically. This limitation may be addressed in v0.9.

---

## Final Validation Decision

**PASS** — all Stage 10F criteria satisfied:
- DIFFERENCE = 0 ✅
- BLOCKED = 0 ✅
- NOT_TESTED = 0 ✅
- Rule Detective state-transition fully demonstrated ✅
- No page errors ✅
- Candidate SHA unchanged ✅

`recovered-v0.8-validated` tag applied on Stage 10F commit.
