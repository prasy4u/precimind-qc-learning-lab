# V08 → V09 Baseline Copy Map

**v0.8 validated tag:** `recovered-v0.8-validated`
**v0.8 validated commit:** `1352dba`
**Total files copied:** 36
**Files modified since copy (Stage 11B):** 3

This is the permanent audit trail for every file copied from the frozen root `src/` (Class A / composite recovered v0.8 source) into the `v09/src/` development tree. Every future modification to a file in this table must be recorded with an updated status and rationale.

## Provenance Note

At copy time (Stage 11A), every file in `v09/src/` was byte-for-byte identical to its frozen root `src/` counterpart. As of Stage 11B, 3 files have been intentionally modified for keyboard-accessibility remediation (see below). All other files remain `UNCHANGED_FROM_V08`. The frozen root `src/` copy remains permanently unchanged as historical reference material — this table never affects it.

## Stage 11B Modifications

### `v09/src/eqa/ui-components.jsx`
- **v0.8 original SHA-256:** `f7c973db56992f3d...`
- **v0.9 current SHA-256:** `287308302293d9d4...`
- **Status:** V09_MODIFIED
- **Rationale:** Stage 11B (audit-discovered, same pattern as AD-002): added onKeyDown handler and single toggleActive() function for the Longitudinal EQA chart point, so Enter/Space match click toggle semantics. Validated: click unchanged (MATCH), Enter now toggles (INTENDED_DELTA).

### `v09/src/ui/shared-components.jsx`
- **v0.8 original SHA-256:** `bd848d01c124c294...`
- **v0.9 current SHA-256:** `fc8125520d89becb...`
- **Status:** V09_MODIFIED
- **Rationale:** Stage 11B (AD-002): added onKeyDown handler and single toggleActive() function so Enter/Space trigger the same LJ chart point toggle semantics as click. Focus-shows-tooltip behavior preserved unchanged. Validated: focus/click unchanged (MATCH), Enter now toggles (INTENDED_DELTA).

### `v09/src/rules/ui-components.jsx`
- **v0.8 original SHA-256:** `4eb7a11042f48962...`
- **v0.9 current SHA-256:** `5ce873a0c97573a5...`
- **Status:** V09_MODIFIED
- **Rationale:** Stage 11B (AD-001): added onKeyDown handler and single activatePoint() function so Enter/Space trigger the same MLJ point-selection semantics as click. Preserves aria-label, ring behavior, rule-engine truth. Validated: click unchanged (MATCH), Enter/Space now activate (INTENDED_DELTA vs v0.8 known limitation).

## Full File Table

| Source (v0.8) | Destination (v0.9) | v0.8 SHA-256 (first 16) | Status |
|---|---|---|---|
| `src/eqa/ui-components.jsx` | `v09/src/eqa/ui-components.jsx` | `f7c973db56992f3d...` | V09_MODIFIED |
| `src/eqa/screens.jsx` | `v09/src/eqa/screens.jsx` | `3b10aa20060305e9...` | UNCHANGED_FROM_V08 |
| `src/eqa/calc.js` | `v09/src/eqa/calc.js` | `5eca4130aff6a3ea...` | UNCHANGED_FROM_V08 |
| `src/eqa/data.js` | `v09/src/eqa/data.js` | `465ba7674103b9f5...` | UNCHANGED_FROM_V08 |
| `src/investigation/ui-components.jsx` | `v09/src/investigation/ui-components.jsx` | `26a0ae70b65e4ae4...` | UNCHANGED_FROM_V08 |
| `src/investigation/screens.jsx` | `v09/src/investigation/screens.jsx` | `d2794c94352e2ba9...` | UNCHANGED_FROM_V08 |
| `src/investigation/calc.js` | `v09/src/investigation/calc.js` | `a0fbf5c2457f3987...` | UNCHANGED_FROM_V08 |
| `src/investigation/data.js` | `v09/src/investigation/data.js` | `5a0898859692b19e...` | UNCHANGED_FROM_V08 |
| `src/ui/shared-components.jsx` | `v09/src/ui/shared-components.jsx` | `bd848d01c124c294...` | V09_MODIFIED |
| `src/ui/app-shell.jsx` | `v09/src/ui/app-shell.jsx` | `56e3d5fac4fcaffa...` | UNCHANGED_FROM_V08 |
| `src/ui/runtime-bootstrap.js` | `v09/src/ui/runtime-bootstrap.js` | `f2bffcb0ab1b0653...` | UNCHANGED_FROM_V08 |
| `src/ui/core-screens.jsx` | `v09/src/ui/core-screens.jsx` | `90c2e85828d7aad9...` | UNCHANGED_FROM_V08 |
| `src/ui/original-v0.8.css` | `v09/src/ui/original-v0.8.css` | `fda2285cb24966f3...` | UNCHANGED_FROM_V08 |
| `src/ui/app-data.js` | `v09/src/ui/app-data.js` | `81cef641a844bd1e...` | UNCHANGED_FROM_V08 |
| `src/opchar/functions.js` | `v09/src/opchar/functions.js` | `1f17659d7fd10fdc...` | UNCHANGED_FROM_V08 |
| `src/risk/ui-components.jsx` | `v09/src/risk/ui-components.jsx` | `a71112bcad1ee82a...` | UNCHANGED_FROM_V08 |
| `src/risk/screens.jsx` | `v09/src/risk/screens.jsx` | `7f0897e8d15704a6...` | UNCHANGED_FROM_V08 |
| `src/risk/detection-delay.js` | `v09/src/risk/detection-delay.js` | `2ba697e4a090d4fc...` | UNCHANGED_FROM_V08 |
| `src/risk/data.js` | `v09/src/risk/data.js` | `2910e94235767ed3...` | UNCHANGED_FROM_V08 |
| `src/rules/ui-components.jsx` | `v09/src/rules/ui-components.jsx` | `4eb7a11042f48962...` | V09_MODIFIED |
| `src/rules/screens.jsx` | `v09/src/rules/screens.jsx` | `8a374e0a900a591d...` | UNCHANGED_FROM_V08 |
| `src/rules/engine.js` | `v09/src/rules/engine.js` | `a2ea2b71e72c3121...` | UNCHANGED_FROM_V08 |
| `src/rules/data.js` | `v09/src/rules/data.js` | `41453ef63973f4d4...` | UNCHANGED_FROM_V08 |
| `src/bv/ui-components.jsx` | `v09/src/bv/ui-components.jsx` | `91c0b5a18722a5e4...` | UNCHANGED_FROM_V08 |
| `src/bv/screens.jsx` | `v09/src/bv/screens.jsx` | `4698826081c3d6b0...` | UNCHANGED_FROM_V08 |
| `src/bv/calc.js` | `v09/src/bv/calc.js` | `203838b74143c183...` | UNCHANGED_FROM_V08 |
| `src/bv/data.js` | `v09/src/bv/data.js` | `ade1e82cc35b45c3...` | UNCHANGED_FROM_V08 |
| `src/pbrtqc/ui-components.jsx` | `v09/src/pbrtqc/ui-components.jsx` | `b14efc6651f8b632...` | UNCHANGED_FROM_V08 |
| `src/pbrtqc/screens.jsx` | `v09/src/pbrtqc/screens.jsx` | `2e1cb56d0fa107d5...` | UNCHANGED_FROM_V08 |
| `src/pbrtqc/calc.js` | `v09/src/pbrtqc/calc.js` | `5d5247c6d712a4a3...` | UNCHANGED_FROM_V08 |
| `src/pbrtqc/data.js` | `v09/src/pbrtqc/data.js` | `4f2dbb7c28ed1071...` | UNCHANGED_FROM_V08 |
| `src/strategy/ui-components.jsx` | `v09/src/strategy/ui-components.jsx` | `46ba76ac6c508e34...` | UNCHANGED_FROM_V08 |
| `src/strategy/aps-ui-data.js` | `v09/src/strategy/aps-ui-data.js` | `f45494a47a32498e...` | UNCHANGED_FROM_V08 |
| `src/strategy/core.js` | `v09/src/strategy/core.js` | `01a7431491c3e15c...` | UNCHANGED_FROM_V08 |
| `src/strategy/screens.jsx` | `v09/src/strategy/screens.jsx` | `5283fcccc1a43c36...` | UNCHANGED_FROM_V08 |
| `src/core/statistics.js` | `v09/src/core/statistics.js` | `74e6d07ccd0bfae7...` | UNCHANGED_FROM_V08 |

## Status Values

- **UNCHANGED_FROM_V08** — byte-for-byte identical to the frozen v0.8 recovered source
- **V09_MODIFIED** — intentionally modified v0.9 derivative (rationale recorded above)
- **V09_SUPERSEDED** — replaced by a wholly new v0.9 module (requires migration note)