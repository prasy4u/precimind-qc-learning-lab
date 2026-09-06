/* =========================================================================
   v09/tests/integration/v09-accessibility-source.test.js

   Stage 11B — v0.9 Integration Test Layer (Layer 2)

   Purpose: source-level behavioral assertions confirming the three
   remediated interactive controls (Rule Detective, LJ chart, EQA chart)
   share activation logic across click/Enter/Space, call preventDefault()
   for Space, and preserve prior aria-label / ring / rule-engine semantics.

   This layer complements (does not replace) the browser/E2E layer, which
   exercises the actual rendered/compiled behavior in Chromium.

   ARTIFACT PROVENANCE: V09_TEST
   Run: node v09/tests/integration/v09-accessibility-source.test.js
   ========================================================================= */
'use strict';

const fs   = require('fs');
const path = require('path');

let passed = 0, failed = 0;
function assert(id, condition, detail) {
  if (condition) { console.log(`  ✓ [${id}] ${detail}`); passed++; }
  else { console.error(`  ✗ [${id}] FAIL: ${detail}`); failed++; }
}

const V09_SRC = path.join(__dirname, '..', '..', 'src');

/* -----------------------------------------------------------------------
   RULE DETECTIVE — v09/src/rules/ui-components.jsx
   ----------------------------------------------------------------------- */
console.log('\n=== Rule Detective (.mlj-point-g) ===');
const ruleSrc = fs.readFileSync(path.join(V09_SRC, 'rules', 'ui-components.jsx'), 'utf8');

assert('RULE-01', /function activatePoint\(/.test(ruleSrc),
  'Single activatePoint() function defined');
assert('RULE-02', /onClick=\{.*activatePoint/.test(ruleSrc),
  'onClick calls activatePoint()');
assert('RULE-03', /onKeyDown=\{/.test(ruleSrc) && /activatePoint/.test(ruleSrc.match(/onKeyDown=\{[\s\S]*?\}\}/)?.[0] || ''),
  'onKeyDown handler calls activatePoint() (same function as onClick)');
assert('RULE-04', /key === "Enter"/.test(ruleSrc),
  'Enter key is checked in onKeyDown');
assert('RULE-05', /key === " "/.test(ruleSrc) || /key === "Spacebar"/.test(ruleSrc),
  'Space key is checked in onKeyDown');
assert('RULE-06', /e\.preventDefault\(\)/.test(ruleSrc),
  'preventDefault() called (prevents page scroll on Space)');
assert('RULE-07', /aria-label=\{p\.cr\.levelName/.test(ruleSrc),
  'aria-label construction preserved unchanged');
assert('RULE-08', /className="mlj-point-g"/.test(ruleSrc),
  'mlj-point-g class name preserved');
assert('RULE-09', /mlj-ring-selected/.test(ruleSrc) && /mlj-ring-correct/.test(ruleSrc),
  'Ring class logic (mlj-ring-selected / mlj-ring-correct) preserved');
assert('RULE-10', /role="button"/.test(ruleSrc) && /tabIndex=\{0\}/.test(ruleSrc),
  'role="button" and tabIndex={0} preserved (element remains keyboard-focusable)');

/* -----------------------------------------------------------------------
   LJ CHART — v09/src/ui/shared-components.jsx
   ----------------------------------------------------------------------- */
console.log('\n=== LJ Chart (.ljchart-point-g) ===');
const ljSrc = fs.readFileSync(path.join(V09_SRC, 'ui', 'shared-components.jsx'), 'utf8');

assert('LJ-01', /function toggleActive\(/.test(ljSrc),
  'Single toggleActive() function defined');
assert('LJ-02', /onClick=\{\(\) => toggleActive/.test(ljSrc),
  'onClick calls toggleActive()');
const ljOnKeyDownBlocks = ljSrc.match(/onKeyDown=\{[\s\S]*?\}\}/g) || [];
assert('LJ-03', ljOnKeyDownBlocks.some(b => /toggleActive/.test(b)),
  'onKeyDown handler calls toggleActive() (same function as onClick)');
assert('LJ-04', ljOnKeyDownBlocks.some(b => /key === "Enter"/.test(b)),
  'Enter key checked in LJ onKeyDown');
assert('LJ-05', ljOnKeyDownBlocks.some(b => /key === " "/.test(b) || /key === "Spacebar"/.test(b)),
  'Space key checked in LJ onKeyDown');
assert('LJ-06', ljOnKeyDownBlocks.some(b => /preventDefault/.test(b)),
  'preventDefault() called in LJ onKeyDown');
assert('LJ-07', /onFocus=\{\(\) => setActive/.test(ljSrc),
  'onFocus still directly sets active (tooltip-on-focus preserved, unchanged)');
assert('LJ-08', /className="ljchart-point-g"/.test(ljSrc),
  'ljchart-point-g class name preserved');
assert('LJ-09', /Click or focus a point to inspect/.test(ljSrc),
  'Original tooltip placeholder text preserved unchanged');

/* -----------------------------------------------------------------------
   EQA CHART — v09/src/eqa/ui-components.jsx
   ----------------------------------------------------------------------- */
console.log('\n=== EQA Longitudinal Chart (.ljchart-point-g) ===');
const eqaSrc = fs.readFileSync(path.join(V09_SRC, 'eqa', 'ui-components.jsx'), 'utf8');

assert('EQA-01', /function toggleActive\(/.test(eqaSrc),
  'Single toggleActive() function defined');
assert('EQA-02', /onClick=\{\(\) => toggleActive/.test(eqaSrc),
  'onClick calls toggleActive()');
const eqaOnKeyDownBlocks = eqaSrc.match(/onKeyDown=\{[\s\S]*?\}\}/g) || [];
assert('EQA-03', eqaOnKeyDownBlocks.some(b => /toggleActive/.test(b)),
  'onKeyDown handler calls toggleActive() (same function as onClick)');
assert('EQA-04', eqaOnKeyDownBlocks.some(b => /key === "Enter"/.test(b)),
  'Enter key checked in EQA onKeyDown');
assert('EQA-05', eqaOnKeyDownBlocks.some(b => /key === " "/.test(b) || /key === "Spacebar"/.test(b)),
  'Space key checked in EQA onKeyDown');
assert('EQA-06', eqaOnKeyDownBlocks.some(b => /preventDefault/.test(b)),
  'preventDefault() called in EQA onKeyDown');
assert('EQA-07', /aria-label=\{"Round " \+ p\.round/.test(eqaSrc),
  'aria-label construction preserved unchanged');
assert('EQA-08', /className="ljchart-point-g"/.test(eqaSrc),
  'ljchart-point-g class name preserved (reused pattern, matches LJ)');

/* -----------------------------------------------------------------------
   CROSS-CUTTING: no duplicated activation logic
   ----------------------------------------------------------------------- */
console.log('\n=== Cross-Cutting: no duplicated selection logic ===');

// Each file should have exactly ONE definition of its activation function
const ruleActivateDefs = (ruleSrc.match(/function activatePoint\(/g) || []).length;
assert('CROSS-01', ruleActivateDefs === 1,
  `Rule Detective: exactly one activatePoint() definition (found ${ruleActivateDefs})`);
const ljToggleDefs = (ljSrc.match(/function toggleActive\(/g) || []).length;
assert('CROSS-02', ljToggleDefs === 1,
  `LJ chart: exactly one toggleActive() definition (found ${ljToggleDefs})`);
const eqaToggleDefs = (eqaSrc.match(/function toggleActive\(/g) || []).length;
assert('CROSS-03', eqaToggleDefs === 1,
  `EQA chart: exactly one toggleActive() definition (found ${eqaToggleDefs})`);

/* -----------------------------------------------------------------------
   SUMMARY
   ----------------------------------------------------------------------- */
const total = passed + failed;
console.log(`\n${'='.repeat(60)}`);
console.log(`v0.9 Integration Test Layer: ${passed}/${total} passed, ${failed} failed`);
console.log(`  Artifact class: V09_TEST`);
if (failed > 0) {
  console.error('v0.9 INTEGRATION TESTS FAILED.');
  process.exit(1);
} else {
  console.log('v0.9 INTEGRATION TESTS PASSED.');
  process.exit(0);
}
