# v0.9 Test Architecture

**Stage:** 11B  
**Purpose:** Establish three maintained test layers for all future v0.9 development, distinguishing v0.9 development-test provenance from the historical v0.8 recovery-test provenance.

---

## Provenance Separation (Critical)

**v0.8 historical recovery tests** (root `tests/`, 30 suites, 3849 assertions) validate the *recovery* of the original v0.8 artifact — they answer "does the recovered source match what the original HTML did?" These tests are frozen, immutable, and never modified. Their assertion count (3849) is a permanent historical fact and must never be merged with v0.9 test counts.

**v0.9 development tests** (`v09/tests/`) validate *new v0.9 work* — they answer "does the v0.9 derivative behave as intended, including intentional deltas from v0.8?" These tests grow as v0.9 develops and are reported as a **separate total**, never combined with the 3849 baseline into one number.

---

## Layer 1 — Unit

**Scope:** Pure, deterministic scientific and state functions. No DOM, no browser.

**v0.9 unit tests do not rewrite the 3849 v0.8 tests.** Instead, `v09/tests/unit/v09-scientific-compat.test.js` establishes a **compatibility gate**: a smaller, targeted set of assertions confirming that the scientific functions copied into `v09/src` still produce the critical frozen v0.8 signatures. This exists so that any future accidental scientific regression during v0.9 development (e.g. a refactor that silently breaks a calculation) is caught quickly, without requiring the full 3849-assertion historical suite to be run and interpreted for that purpose.

The full frozen v0.8 suite continues to run unchanged and remains the authoritative scientific validation record.

**Location:** `v09/tests/unit/`

---

## Layer 2 — Integration

**Scope:** Component and screen-level interaction semantics, including accessibility states (keyboard activation, ARIA attributes, focus management). Runs against rendered/simulated component behavior or DOM fixtures, not necessarily a full browser.

For Stage 11B, integration-level verification of the three remediated controls (Rule Detective point, LJ chart point, EQA chart point) is expressed as source-level behavioral assertions confirming:
- a single activation function is used for click/Enter/Space (no duplicated logic)
- `preventDefault()` is called for Space (to avoid page scroll)
- the aria-label, ring/selection classes, and rule-engine call signatures are preserved unchanged

**Location:** `v09/tests/integration/`

---

## Layer 3 — Browser / E2E

**Scope:** Critical user journeys in a real browser (Playwright + Chromium — the same tooling validated throughout the v0.8 recovery, Stages 10A–10F).

Unlike the v0.8 recovery, which used one-off Playwright scripts per validation stage, **v0.9 browser tests are maintained files**, checked into `v09/tests/browser/`, re-run for every future stage rather than rewritten from scratch. The first maintained test is `v09-accessibility.e2e.js`, covering:
- Non-regression: 14 nav destinations, all 11 labs, Home/Map/Evidence, all 4 learner levels
- Rule Detective: click unchanged, Enter/Space now activate (documented `INTENDED_DELTA`)
- LJ chart: focus/tooltip/click unchanged, Enter now toggles (`INTENDED_DELTA`)
- EQA chart: click unchanged, Enter now toggles (`INTENDED_DELTA`)

**Location:** `v09/tests/browser/`  
**Helpers:** `v09/tests/helpers/`

---

## Classification Vocabulary for Browser Tests

| Classification | Meaning |
|---|---|
| `MATCH` | Original (v0.8 reference) and candidate (v0.9 compat artifact) behave identically |
| `INTENDED_DELTA` | A documented, deliberate v0.9 change (e.g. an accessibility fix) — the difference is expected and correct |
| `UNEXPECTED_DIFFERENCE` | Any other difference — treated as a defect |
| `BLOCKED` | Test could not execute (e.g. required fixture/data not present) |

Pass criterion for any v0.9 browser test run: `UNEXPECTED_DIFFERENCE = 0` and `BLOCKED = 0`.

---

## Reporting Rule

Every future v0.9 stage report must state, separately:
1. The v0.8 historical regression result (expected: unchanged at 3849/3849, 30 suites, forever)
2. The v0.9 test totals (Stage 11A governance + Stage 11B governance + unit + integration, growing over time)
3. Browser checkpoint counts by classification (MATCH / INTENDED_DELTA / UNEXPECTED_DIFFERENCE / BLOCKED) — never folded into the Node assertion totals unless they are literally implemented as Node assertions (e.g. a Node test that validates a stored browser-test JSON result, as done for the v0.8 Stage 10B–10F historical validators).
