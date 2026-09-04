# Assembly Map — PreciMind v0.8 Faithful Reconstruction

**Artifact Class:** D (recovery infrastructure)  
**Stage:** 10A  
**Output:** `dist/recovered-v0.8-faithful.html` (Class B — deterministic reconstruction, NOT Class A)  
**Assembler:** `tools/assemble-v08.js`  
**Candidate SHA-256:** `a9fe9a3acbb8c35347cc735292ad63883778e5c12845f4da529129119b72c886`

---

## Document Envelope (from original-v0.8.html — Class A reference material)

| HTML lines | Content | Type |
|-----------|---------|------|
| 1–6 | `<meta charset>`, `<title>`, viewport, Google Font links | original-document-envelope |
| 7 | `<style>` open tag | original-document-envelope |
| 8–529 | CSS content | frozen-recovered-css → `src/ui/original-v0.8.css` (Class A, SHA `fda2285cb24966f3...`) |
| 530 | `</style>` close | original-document-envelope |
| 531 | `<div id="root"></div>` | original-document-envelope |
| 532–836 | `<script>` React + ReactDOM + Babel standalone `</script>` | original-document-envelope-vendor (NOT duplicated into modules, SHA `248400a26843f7b6...`) |
| 837 | `<script id="app-source" type="text/plain">` | original-document-envelope |
| 838–14025 | Original app-source content | **replaced in faithful candidate by ordered module concatenation** |
| 14026 | `</script>` (app-source close) | original-document-envelope |
| 14027 | `<script>` (bootstrap open) | original-document-envelope |
| 14028–14034 | Bootstrap JS | frozen-recovered-source → `src/ui/runtime-bootstrap.js` (Class A, SHA `f2bffcb0ab1b0653...`) |
| 14035 | `</script>` (bootstrap close) | original-document-envelope |

---

## Module Assembly Order (34 source modules — Class A)

| Order | Path | Type | Lines | SHA-256 (first 16) |
|-------|------|------|-------|---------------------|
| 1 | `src/core/statistics.js` | scientific-module-with-recovery-wrapper | 139 | `74e6d07ccd0bfae7` |
| 2 | `src/ui/app-data.js` | exact-html-slice-ui-recovery | 855 | `81cef641a844bd1e` |
| 3 | `src/ui/shared-components.jsx` | exact-html-slice-ui-recovery | 269 | `bd848d01c124c294` |
| 4 | `src/ui/core-screens.jsx` | exact-html-slice-ui-recovery | 716 | `90c2e85828d7aad9` |
| 5 | `src/rules/engine.js` | scientific-module-with-recovery-wrapper | 317 | `a2ea2b71e72c3121` |
| 6 | `src/rules/data.js` | exact-html-slice-ui-recovery | 219 | `41453ef63973f4d4` |
| 7 | `src/rules/ui-components.jsx` | exact-html-slice-ui-recovery | 214 | `4eb7a11042f48962` |
| 8 | `src/rules/screens.jsx` | exact-html-slice-ui-recovery | 408 | `8a374e0a900a591d` |
| 9 | `src/opchar/functions.js` | scientific-module-with-recovery-wrapper | 133 | `1f17659d7fd10fdc` |
| 10 | `src/strategy/core.js` | scientific-module-with-recovery-wrapper | 419 | `01a7431491c3e15c` |
| 11 | `src/strategy/aps-ui-data.js` | exact-html-slice-ui-recovery | 66 | `f45494a47a32498e` |
| 12 | `src/strategy/ui-components.jsx` | exact-html-slice-ui-recovery | 122 | `46ba76ac6c508e34` |
| 13 | `src/strategy/screens.jsx` | exact-html-slice-ui-recovery | 540 | `5283fcccc1a43c36` |
| 14 | `src/risk/detection-delay.js` | scientific-module-with-recovery-wrapper | 162 | `2ba697e4a090d4fc` |
| 15 | `src/risk/data.js` | scientific-module-with-recovery-wrapper | 387 | `2910e94235767ed3` |
| 16 | `src/risk/ui-components.jsx` | exact-html-slice-ui-recovery | 169 | `a71112bcad1ee82a` |
| 17 | `src/risk/screens.jsx` | exact-html-slice-ui-recovery | 485 | `7f0897e8d15704a6` |
| 18 | `src/investigation/calc.js` | scientific-module-with-recovery-wrapper | 153 | `a0fbf5c2457f3987` |
| 19 | `src/investigation/data.js` | exact-html-slice-ui-recovery | 774 | `5a0898859692b19e` |
| 20 | `src/investigation/ui-components.jsx` | exact-html-slice-ui-recovery | 253 | `26a0ae70b65e4ae4` |
| 21 | `src/investigation/screens.jsx` | exact-html-slice-ui-recovery | 662 | `d2794c94352e2ba9` |
| 22 | `src/eqa/calc.js` | scientific-module-with-recovery-wrapper | 313 | `5eca4130aff6a3ea` |
| 23 | `src/eqa/data.js` | exact-html-slice-ui-recovery | 885 | `465ba7674103b9f5` |
| 24 | `src/eqa/ui-components.jsx` | exact-html-slice-ui-recovery | 344 | `f7c973db56992f3d` |
| 25 | `src/eqa/screens.jsx` | exact-html-slice-ui-recovery | 509 | `3b10aa20060305e9` |
| 26 | `src/bv/calc.js` | scientific-module-with-recovery-wrapper | 337 | `203838b74143c183` |
| 27 | `src/bv/data.js` | exact-html-slice-ui-recovery | 578 | `ade1e82cc35b45c3` |
| 28 | `src/bv/ui-components.jsx` | exact-html-slice-ui-recovery | 331 | `91c0b5a18722a5e4` |
| 29 | `src/bv/screens.jsx` | exact-html-slice-ui-recovery | 384 | `4698826081c3d6b0` |
| 30 | `src/pbrtqc/calc.js` | scientific-module-with-recovery-wrapper | 462 | `5d5247c6d712a4a3` |
| 31 | `src/pbrtqc/data.js` | exact-html-slice-ui-recovery | 766 | `4f2dbb7c28ed1071` |
| 32 | `src/pbrtqc/ui-components.jsx` | exact-html-slice-ui-recovery | 236 | `b14efc6651f8b632` |
| 33 | `src/pbrtqc/screens.jsx` | exact-html-slice-ui-recovery | 414 | `2e1cb56d0fa107d5` |
| 34 | `src/ui/app-shell.jsx` | exact-html-slice-ui-recovery | 137 | `56e3d5fac4fcaffa` |

---

## Assembly Policy

- **Module separator:** None — modules are concatenated directly. All are self-delimiting with `/* === */` block headers.
- **CommonJS wrappers:** Preserved unchanged. Guarded blocks (`if (typeof module !== "undefined" && module.exports)`) are harmless in browser context where `module` is undefined.
- **Mount calls:** All 19 `ReactDOM.createRoot(rootEl).render(<App />)` calls from `src/ui/app-shell.jsx` are preserved byte-for-byte. Not deduplicated.
- **CSS:** Frozen `src/ui/original-v0.8.css` — not reformatted or minified.
- **Vendor libraries:** Reused from original HTML envelope lines 532–836. Not duplicated into modules.
- **Bootstrap:** Frozen `src/ui/runtime-bootstrap.js` used verbatim.

---

## Provenance Note

The assembled `app-source` payload is NOT byte-for-byte identical to the original `app-source` block (HTML lines 838–14025) because several scientific modules contain recovery infrastructure (provenance headers, guarded CommonJS exports) that was not present at the original HTML positions. The candidate is a faithful modular reconstruction — Class B — not a Class A byte-for-byte reproduction.
