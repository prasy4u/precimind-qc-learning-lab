/* =========================================================================
   tests/stage10f-validation.test.js

   Stage 10F: Rule Detective state-transition equivalence validation.
   Validates: recovery/stage10f-rule-point-equivalence.json
   Also verifies Stage 10E historical record accuracy.

   ARTIFACT PROVENANCE: Class D (recovery infrastructure)
   Run: node tests/stage10f-validation.test.js
   ========================================================================= */
'use strict';

const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

let passed = 0, failed = 0, sg = 0, rc = 0;

function assert(id, condition, detail, prov) {
  if (condition) { console.log(`  ✓ [${id}] ${detail}`); passed++; }
  else { console.error(`  ✗ [${id}] FAIL: ${detail}`); failed++; }
  if (prov === 'sg') sg++; else rc++;
}

const ROOT    = path.join(__dirname, '..');
const F10_PATH = path.join(ROOT, 'recovery', 'stage10f-rule-point-equivalence.json');
const E10_PATH = path.join(ROOT, 'recovery', 'stage10e-source-aware-equivalence.json');

const f10 = JSON.parse(fs.readFileSync(F10_PATH, 'utf8'));
const e10 = JSON.parse(fs.readFileSync(E10_PATH, 'utf8'));

/* -----------------------------------------------------------------------
   SECTION A: Stage 10E historical record (INCOMPLETE for Rule Detective)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION A: Stage 10E historical record ===');

assert('A-01', e10.validation_status === 'INCOMPLETE',
  'Stage 10E validation_status = INCOMPLETE', 'sg');
assert('A-02', e10.summary.total === 83,
  'Stage 10E historical total = 83', 'sg');
assert('A-03', e10.summary.match === 83,
  'Stage 10E historical match = 83', 'sg');
assert('A-04', e10.rule_facts && e10.rule_facts.hint_changed_after_activation === false,
  'Stage 10E rule_facts.hint_changed_after_activation = false (corrected)', 'sg');

// Historical checkpoints confirm real .mlj-point-g focus was demonstrated
const ruleTagCp = e10.checkpoints.find(cp => cp.id === 'RULE-tag');
assert('A-05', ruleTagCp?.classification === 'MATCH',
  'Stage 10E: real .mlj-point-g focus was demonstrated (tag=G)', 'sg');
const ruleHintAfter = e10.checkpoints.find(cp => cp.id === 'RULE-hint-after');
assert('A-06', ruleHintAfter?.original === 'none',
  'Stage 10E historical: RULE-hint-after = none (no rule was selected first)', 'sg');
const ruleHintChanged = e10.checkpoints.find(cp => cp.id === 'RULE-hint-changed');
assert('A-07', ruleHintChanged?.original === 'false',
  'Stage 10E historical: RULE-hint-changed = false', 'sg');

/* -----------------------------------------------------------------------
   SECTION B: Stage 10F result structure
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION B: Stage 10F result structure ===');

assert('B-01', f10.stage === '10F', 'Stage 10F result stage = 10F', 'rc');
assert('B-02', f10.original_sha === 'e5317bf135f350b258428b985c1034a081e244a295f2e580c93cb6a6a091c8e4',
  'Original SHA matches authoritative', 'sg');
assert('B-03', f10.candidate_sha === 'a9fe9a3acbb8c35347cc735292ad63883778e5c12845f4da529129119b72c886',
  'Candidate SHA matches assembled faithful', 'sg');
assert('B-04', f10.case_selected === 3,
  'Stage 10F: Case 3 selected', 'sg');
assert('B-05', f10.rule_selected === '1₃s' || f10.rule_selected === '1_3s' || f10.rule_selected?.includes('3s'),
  `Stage 10F: 1₃s rule selected (found "${f10.rule_selected}")`, 'sg');

// Summary computed from array
const computed = {match:0, difference:0, blocked:0, not_tested:0};
f10.checkpoints.forEach(cp => {
  const k = cp.classification.toLowerCase().replace(/-/g,'_');
  if (computed[k] !== undefined) computed[k]++;
});
assert('B-06', f10.summary.total === f10.checkpoints.length,
  `summary.total (${f10.summary.total}) = checkpoint count`, 'rc');
assert('B-07', f10.summary.difference === 0,
  `DIFFERENCE = 0 (found ${f10.summary.difference})`, 'sg');
assert('B-08', f10.summary.blocked === 0,
  `BLOCKED = 0 (found ${f10.summary.blocked})`, 'sg');
assert('B-09', f10.summary.not_tested === 0,
  `NOT_TESTED = 0 (found ${f10.summary.not_tested})`, 'sg');

/* -----------------------------------------------------------------------
   SECTION C: Pre/post-rule hint state
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION C: Hint state machine ===');

assert('C-01', f10.observed.hintBeforeRule === 'ABSENT',
  `Hint absent before rule (found "${f10.observed.hintBeforeRule}")`, 'sg');
assert('C-02', f10.observed.hintAfterRule?.includes('none yet') || f10.observed.hintAfterRule?.includes('Selected: none'),
  `Hint = "Selected: none yet" after 1₃s selected (found "${f10.observed.hintAfterRule}")`, 'sg');

const hintAfterRuleCp = f10.checkpoints.find(cp => cp.id === 'hint-none-after-rule');
assert('C-03', hintAfterRuleCp?.classification === 'MATCH',
  'hint-none-after-rule checkpoint = MATCH', 'sg');
const hintAbsentCp = f10.checkpoints.find(cp => cp.id === 'hint-absent-before-rule');
assert('C-04', hintAbsentCp?.classification === 'MATCH',
  'hint-absent-before-rule checkpoint = MATCH', 'sg');

/* -----------------------------------------------------------------------
   SECTION D: Focused point properties
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION D: Focused SVG point properties ===');

const fp = f10.observed.focusedPoint || {};
assert('D-01', fp.tag?.toUpperCase() === 'G',
  `Focused element tag = G (found "${fp.tag}")`, 'sg');
assert('D-02', fp.cls?.includes('mlj-point-g'),
  `Focused class contains mlj-point-g (found "${fp.cls}")`, 'sg');
assert('D-03', fp.role === 'button',
  `Focused role = button (found "${fp.role}")`, 'sg');
assert('D-04', fp.tabIdx === '0',
  `Focused tabIndex = 0 (found "${fp.tabIdx}")`, 'sg');
assert('D-05', fp.label?.includes('run 4') && (fp.label?.includes('-3.2') || fp.label?.includes('-3.20')),
  `Aria-label contains "run 4" and "-3.20 SD" (found "${fp.label}")`, 'sg');
assert('D-06', fp.label?.toLowerCase().includes('level 1'),
  `Aria-label contains "Level 1" (found "${fp.label}")`, 'sg');

// Verify checkpoint records
const ptTagCp = f10.checkpoints.find(cp => cp.id === 'point-focus-tag');
assert('D-07', ptTagCp?.classification === 'MATCH', 'point-focus-tag = MATCH', 'sg');
const ptAriaCp = f10.checkpoints.find(cp => cp.id === 'point-focus-aria');
assert('D-08', ptAriaCp?.classification === 'MATCH', 'point-focus-aria = MATCH', 'sg');
const ptLevelCp = f10.checkpoints.find(cp => cp.id === 'point-aria-level1-run4');
assert('D-09', ptLevelCp?.classification === 'MATCH',
  'point-aria-level1-run4 = MATCH (label confirms Level 1, run 4, -3.20 SD)', 'sg');

/* -----------------------------------------------------------------------
   SECTION E: Keyboard behavior
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION E: Keyboard Enter/Space behavior ===');

assert('E-01', f10.observed.enterActivated === false,
  'Enter does not activate point (no onKeyDown in v0.8 source)', 'sg');
assert('E-02', f10.observed.spaceActivated === false,
  'Space does not activate point (keyboard-focusable but not keyboard-activatable)', 'sg');
const enterCp = f10.checkpoints.find(cp => cp.id === 'keyboard-enter-result');
assert('E-03', enterCp?.classification === 'MATCH',
  'keyboard-enter-result: original = candidate (matched behavior)', 'sg');
const spaceCp = f10.checkpoints.find(cp => cp.id === 'keyboard-space-result');
assert('E-04', spaceCp?.classification === 'MATCH',
  'keyboard-space-result: original = candidate (matched behavior)', 'sg');

/* -----------------------------------------------------------------------
   SECTION F: Click activation state transitions
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION F: Click activation state transitions ===');

assert('F-01', f10.observed.hintAfterClick?.includes('4:L1') || f10.observed.hintAfterClick?.includes('4,L1'),
  `Post-click hint = "Selected: 4:L1" (found "${f10.observed.hintAfterClick}")`, 'sg');
assert('F-02', f10.observed.ringCountAfterClick >= 1,
  `Ring count >= 1 after click (found ${f10.observed.ringCountAfterClick})`, 'sg');

const hintClickCp = f10.checkpoints.find(cp => cp.id === 'hint-after-click');
assert('F-03', hintClickCp?.classification === 'MATCH', 'hint-after-click = MATCH', 'sg');
const selectedKeyCp = f10.checkpoints.find(cp => cp.id === 'selected-key-4-L1');
assert('F-04', selectedKeyCp?.classification === 'MATCH', 'selected-key-4-L1 = MATCH', 'sg');
const ringCp = f10.checkpoints.find(cp => cp.id === 'selected-ring-count-1');
assert('F-05', ringCp?.classification === 'MATCH',
  'selected-ring-count-1: ring count identical in original and candidate', 'sg');
const domCp = f10.checkpoints.find(cp => cp.id === 'dom-after-selection');
assert('F-06', domCp?.classification === 'MATCH', 'dom-after-selection: DOM identical', 'sg');

/* -----------------------------------------------------------------------
   SECTION G: Deselect (bidirectional state machine)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION G: Deselect state transition ===');

assert('G-01', f10.observed.hintAfterDeselect?.includes('none yet') || f10.observed.hintAfterDeselect?.includes('Selected: none'),
  `Post-deselect hint = "Selected: none yet" (found "${f10.observed.hintAfterDeselect}")`, 'sg');
assert('G-02', f10.observed.ringCountAfterDeselect < f10.observed.ringCountAfterClick,
  `Ring count reduced after deselect (from ${f10.observed.ringCountAfterClick} to ${f10.observed.ringCountAfterDeselect})`, 'sg');

const hintDesCp = f10.checkpoints.find(cp => cp.id === 'hint-after-deselect');
assert('G-03', hintDesCp?.classification === 'MATCH', 'hint-after-deselect = MATCH', 'sg');
const ringDesCp = f10.checkpoints.find(cp => cp.id === 'selected-ring-count-0');
assert('G-04', ringDesCp?.classification === 'MATCH', 'selected-ring-count-0 = MATCH', 'sg');

/* -----------------------------------------------------------------------
   SECTION H: Console errors and submission gate
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION H: Errors and submission gate ===');

const errorCp = f10.checkpoints.find(cp => cp.id === 'console-pageerror');
assert('H-01', errorCp?.classification === 'MATCH' && errorCp?.original === '0',
  'Zero page errors throughout (orig = cand = 0)', 'sg');
const submitCp = f10.checkpoints.find(cp => cp.id === 'submit-enabled');
assert('H-02', submitCp?.classification === 'MATCH',
  'Submission gate enabled identically after full selection', 'sg');

/* -----------------------------------------------------------------------
   SECTION I: Candidate and original SHA integrity
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION I: SHA integrity ===');

const actualCand = crypto.createHash('sha256')
  .update(fs.readFileSync(path.join(ROOT, 'dist', 'recovered-v0.8-faithful.html'), 'utf8'))
  .digest('hex');
assert('I-01', actualCand === 'a9fe9a3acbb8c35347cc735292ad63883778e5c12845f4da529129119b72c886',
  'Candidate SHA-256 unchanged on disk', 'sg');

/* -----------------------------------------------------------------------
   SECTION J: Frozen source immutability
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION J: Frozen source immutability ===');

const FROZEN = {
  'src/core/statistics.js':    '74e6d07ccd0bfae7e5cd9821078881b692e762cea3c9b4ad6eaf88799fc8f8d5',
  'src/ui/app-shell.jsx':      '56e3d5fac4fcaffa3184e81f8e8be1fa292558a35d0a77974f0639759d101da4',
  'src/ui/runtime-bootstrap.js': 'f2bffcb0ab1b0653b866f7247842f4f878d7b6593eb56a5751c404732210e85a',
};
Object.entries(FROZEN).forEach(([rel, expected]) => {
  const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel), 'utf8')).digest('hex');
  assert(`J-01-${path.basename(rel).substring(0, 10)}`, actual === expected,
    `${rel}: SHA-256 unchanged`, 'sg');
});

/* -----------------------------------------------------------------------
   SUMMARY
   ----------------------------------------------------------------------- */
const total = passed + failed;
console.log(`\n${'='.repeat(60)}`);
console.log(`Stage 10F Validation Tests: ${passed}/${total} passed, ${failed} failed`);
console.log(`  Source-grounded expectations: ${sg}`);
console.log(`  Reconstructed expectations:   ${rc}`);
console.log(`  Stage 10E: INCOMPLETE (historical — rule hint-changed=false)`);
console.log(`  Stage 10F: ${f10.summary.total} checkpoints — ${f10.summary.match} MATCH / ${f10.summary.difference} DIFF / ${f10.summary.blocked} BLOCKED`);
console.log(`  Case: ${f10.case_selected} | Rule: ${f10.rule_selected} | Trigger: ${f10.trigger_point}`);
console.log(`  Post-click hint: "${f10.observed.hintAfterClick}" | rings: ${f10.observed.ringCountAfterClick}`);
console.log(`  Post-deselect hint: "${f10.observed.hintAfterDeselect}" | rings: ${f10.observed.ringCountAfterDeselect}`);
console.log(`  Keyboard Enter activates: false | Space activates: false (matched v0.8 limitation)`);
if (failed > 0) {
  console.error('STAGE 10F VALIDATION FAILED.');
  process.exit(1);
} else {
  console.log('STAGE 10F VALIDATION PASSED — Rule Detective state-transition evidence confirmed.');
  process.exit(0);
}
