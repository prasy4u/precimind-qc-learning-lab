/* =========================================================================
   tests/stage10e-validation.test.js

   Stage 10E: Source-aware final browser equivalence validation.
   Validates: recovery/stage10e-source-aware-equivalence.json
   Also verifies Stage 10D historical record status.

   ARTIFACT PROVENANCE: Class D (recovery infrastructure)
   Run: node tests/stage10e-validation.test.js
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
const E10_PATH = path.join(ROOT, 'recovery', 'stage10e-source-aware-equivalence.json');
const D10_PATH = path.join(ROOT, 'recovery', 'stage10d-final-equivalence.json');

const e10 = JSON.parse(fs.readFileSync(E10_PATH, 'utf8'));
const d10 = JSON.parse(fs.readFileSync(D10_PATH, 'utf8'));

/* -----------------------------------------------------------------------
   SECTION A: Stage 10D historical record = INCOMPLETE
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION A: Stage 10D historical record ===');

assert('A-01', d10.validation_status === 'INCOMPLETE',
  'Stage 10D validation_status = INCOMPLETE', 'sg');
assert('A-02', d10.summary.total === 69,
  'Stage 10D historical total = 69', 'sg');
assert('A-03', d10.summary.match === 67,
  'Stage 10D historical match = 67', 'sg');
assert('A-04', d10.summary.difference === 0,
  'Stage 10D historical difference = 0', 'sg');
assert('A-05', d10.summary.blocked === 0,
  'Stage 10D historical blocked = 0', 'sg');
assert('A-06', d10.summary.not_applicable === 2,
  'Stage 10D historical not_applicable = 2', 'sg');

/* -----------------------------------------------------------------------
   SECTION B: Stage 10E result structure and pass criteria
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION B: Stage 10E pass criteria ===');

assert('B-01', e10.stage === '10E', 'Stage 10E result stage = 10E', 'rc');
assert('B-01b', e10.validation_status === 'INCOMPLETE',
  'Stage 10E validation_status = INCOMPLETE (Rule Detective state-transition not validated)', 'sg');
assert('B-02', e10.original_sha === 'e5317bf135f350b258428b985c1034a081e244a295f2e580c93cb6a6a091c8e4',
  'Original SHA matches authoritative', 'sg');
assert('B-03', e10.candidate_sha === 'a9fe9a3acbb8c35347cc735292ad63883778e5c12845f4da529129119b72c886',
  'Candidate SHA matches assembled faithful', 'sg');

// Summary computed from array
const computed = {match:0,difference:0,blocked:0,not_applicable:0,not_tested:0};
e10.checkpoints.forEach(cp => {
  const k = cp.classification.toLowerCase().replace(/-/g,'_');
  if (computed[k] !== undefined) computed[k]++;
});
assert('B-04', e10.summary.total === e10.checkpoints.length,
  `summary.total (${e10.summary.total}) equals checkpoint count`, 'rc');
assert('B-05', e10.summary.difference === 0,
  `DIFFERENCE = 0 (found ${e10.summary.difference})`, 'sg');
assert('B-06', e10.summary.blocked === 0,
  `BLOCKED = 0 (found ${e10.summary.blocked})`, 'sg');
assert('B-07', e10.summary.not_tested === 0,
  `NOT_TESTED = 0 (found ${e10.summary.not_tested})`, 'sg');
assert('B-08', e10.summary.difference === computed.difference,
  'summary.difference computed correctly from array', 'rc');

/* -----------------------------------------------------------------------
   SECTION C: Required coverage categories
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION C: Required coverage ===');

const req = e10.required_coverage || {};
assert('C-01', req['diagnostic-low-8q'] === true, 'diagnostic-low-8q covered', 'sg');
assert('C-02', req['diagnostic-high-8q'] === true, 'diagnostic-high-8q covered', 'sg');
assert('C-03', req['diagnostic-apply'] === true, 'diagnostic-apply covered', 'sg');
assert('C-04', req['pbrtqc-case-a'] === true, 'pbrtqc-case-a covered', 'sg');
assert('C-05', req['pbrtqc-case-b'] === true, 'pbrtqc-case-b covered', 'sg');
assert('C-06', req['pbrtqc-case-c'] === true, 'pbrtqc-case-c covered', 'sg');
assert('C-07', req['lj-real-chart-point-keyboard'] === true, 'lj-real-chart-point-keyboard covered', 'sg');
assert('C-08', req['rule-real-chart-point-keyboard'] === true, 'rule-real-chart-point-keyboard covered', 'sg');
assert('C-09', req['pattern-three-submitted-cases'] === true, 'pattern-three-submitted-cases covered', 'sg');

/* -----------------------------------------------------------------------
   SECTION D: Diagnostic — exactly 8 questions both patterns
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION D: Diagnostic 8-question validation ===');

const df = e10.diagnostic_facts || {};
const patA = df.patternA || {};
const patB = df.patternB || {};

assert('D-01', patA.answeredCount === 8,
  `Pattern A: exactly 8 questions answered (found ${patA.answeredCount})`, 'sg');
assert('D-02', patB.answeredCount === 8,
  `Pattern B: exactly 8 questions answered (found ${patB.answeredCount})`, 'sg');

const VALID_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];
assert('D-03', VALID_LEVELS.includes(patA.suggestedLevel),
  `Pattern A: suggested level is valid (found "${patA.suggestedLevel}")`, 'sg');
assert('D-04', VALID_LEVELS.includes(patB.suggestedLevel),
  `Pattern B: suggested level is valid (found "${patB.suggestedLevel}")`, 'sg');
assert('D-05', VALID_LEVELS.includes(patA.appliedLevel),
  `Pattern A: applied level is valid (found "${patA.appliedLevel}")`, 'sg');
assert('D-06', VALID_LEVELS.includes(patB.appliedLevel),
  `Pattern B: applied level is valid (found "${patB.appliedLevel}")`, 'sg');

// Two patterns should ideally produce different recommendations (Pattern A=beginner, B=advanced)
// If they happen to match that's still valid, but record the fact
const differentRecs = patA.suggestedLevel !== patB.suggestedLevel;
assert('D-07', differentRecs,
  `Two patterns produce different level recommendations (A=${patA.suggestedLevel}, B=${patB.suggestedLevel})`, 'sg');

// Four domain profile rows must be represented in checkpoints
const DOMAIN_ROWS = ['Stati', 'Preci', 'LJ In', 'APS'];
for (const row of DOMAIN_ROWS) {
  const cpA = e10.checkpoints.find(cp => cp.id.includes('PatA-domain-') && cp.id.includes(row));
  const cpB = e10.checkpoints.find(cp => cp.id.includes('PatB-domain-') && cp.id.includes(row));
  assert(`D-08-${row}`, cpA?.classification === 'MATCH' && cpB?.classification === 'MATCH',
    `Domain profile "${row}": both patterns MATCH`, 'sg');
}

// Result DOM non-empty (not sha of empty string)
const emptyHash = 'd41d8cd98f00b204'; // md5 of empty — using sha256 prefix '0' logic
const domA = e10.checkpoints.find(cp => cp.id === 'DIAG-PatA-dom');
const domB = e10.checkpoints.find(cp => cp.id === 'DIAG-PatB-dom');
assert('D-09', domA?.original && domA.original !== '0000000000000000',
  'Pattern A: result DOM hash is non-empty', 'sg');
assert('D-10', domB?.original && domB.original !== '0000000000000000',
  'Pattern B: result DOM hash is non-empty', 'sg');

/* -----------------------------------------------------------------------
   SECTION E: PBRTQC frozen signature verification
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION E: PBRTQC frozen signatures ===');

const pb = e10.pbrtqc_facts || {};
const cA = pb.caseA || {}; const cB = pb.caseB || {}; const cC = pb.caseC || {};

assert('E-01', cA.alert_index === '93',
  `PBRTQC Case A: alert index = 93 (found "${cA.alert_index}")`, 'sg');
assert('E-02', cA.NPed === '12',
  `PBRTQC Case A: NPed = 12 (found "${cA.NPed}")`, 'sg');
assert('E-03', cB.alert_index === '106',
  `PBRTQC Case B: alert index = 106 (found "${cB.alert_index}")`, 'sg');
assert('E-04', cB.NPed === '25',
  `PBRTQC Case B: NPed = 25 (found "${cB.NPed}")`, 'sg');
assert('E-05', cB.excluded === '0',
  `PBRTQC Case B: excluded = 0 (found "${cB.excluded}")`, 'sg');
assert('E-06', cC.alert_index === 'None',
  `PBRTQC Case C: alert = None (found "${cC.alert_index}")`, 'sg');
assert('E-07', cC.excluded === '51',
  `PBRTQC Case C: excluded = 51 (found "${cC.excluded}")`, 'sg');
assert('E-08', cC.NPed && cC.NPed.includes('not reported'),
  `PBRTQC Case C: NPed not reported (found "${cC.NPed}")`, 'sg');

// No required PBRTQC checkpoint is NOT_APPLICABLE
const pbNAs = e10.checkpoints.filter(cp => cp.domain === 'pbrtqc' && cp.classification === 'NOT_APPLICABLE');
assert('E-09', pbNAs.length === 0,
  `No PBRTQC checkpoint is NOT_APPLICABLE (found ${pbNAs.length})`, 'sg');

// All PBRTQC control checkpoints are MATCH
const pbCtrlCheckpoints = e10.checkpoints.filter(cp => cp.domain === 'pbrtqc' && cp.id.includes('ctrl'));
assert('E-10', pbCtrlCheckpoints.every(cp => cp.classification === 'MATCH'),
  'All PBRTQC control verification checkpoints MATCH', 'sg');

/* -----------------------------------------------------------------------
   SECTION F: LJ keyboard — real .ljchart-point-g element
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION F: LJ real chart point keyboard ===');

const lj = e10.lj_facts || {};
assert('F-01', lj.focused_tag === 'G (SVG group element)',
  `LJ: focused tag = G (found "${lj.focused_tag}")`, 'sg');
assert('F-02', lj.focused_class === '.ljchart-point-g',
  `LJ: focused class = .ljchart-point-g (found "${lj.focused_class}")`, 'sg');
assert('F-03', lj.focused_role === 'button',
  `LJ: focused role = button (found "${lj.focused_role}")`, 'sg');
assert('F-04', lj.focused_tabIndex === '0',
  `LJ: tabIndex = 0 (found "${lj.focused_tabIndex}")`, 'sg');
assert('F-05', lj.aria_label_example && lj.aria_label_example.startsWith('Run '),
  `LJ: aria-label starts with "Run " (found "${lj.aria_label_example}")`, 'sg');
assert('F-06', lj.tooltip_changed_after_focus === true,
  'LJ: tooltip changed after focus', 'sg');

// Verify the checkpoint records
const ljTagCp = e10.checkpoints.find(cp => cp.id === 'LJ-tag');
assert('F-07', ljTagCp?.classification === 'MATCH',
  'LJ-tag checkpoint = MATCH', 'sg');
const ljTooltipCp = e10.checkpoints.find(cp => cp.id === 'LJ-tooltip-match');
assert('F-08', ljTooltipCp?.classification === 'MATCH',
  'LJ-tooltip-match checkpoint = MATCH', 'sg');

/* -----------------------------------------------------------------------
   SECTION G: Rule keyboard — real .mlj-point-g element
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION G: Rule real QC point keyboard ===');

const rf = e10.rule_facts || {};
assert('G-01', rf.focused_tag === 'G (SVG group element)',
  `Rule: focused tag = G (found "${rf.focused_tag}")`, 'sg');
assert('G-02', rf.focused_class === '.mlj-point-g',
  `Rule: focused class = .mlj-point-g (found "${rf.focused_class}")`, 'sg');
assert('G-03', rf.focused_role === 'button',
  `Rule: focused role = button (found "${rf.focused_role}")`, 'sg');
assert('G-04', rf.focused_tabIndex === '0',
  `Rule: tabIndex = 0 (found "${rf.focused_tabIndex}")`, 'sg');
assert('G-05', rf.aria_label_example && /level|run|value|SD/i.test(rf.aria_label_example),
  `Rule: aria-label contains run/value/SD (found "${rf.aria_label_example}")`, 'sg');
assert('G-06', rf.hint_changed_after_activation === false,
  'Rule: hint_changed_after_activation = false (corrected — no rule was selected first)', 'sg');

const ruleTagCp = e10.checkpoints.find(cp => cp.id === 'RULE-tag');
assert('G-07', ruleTagCp?.classification === 'MATCH', 'RULE-tag checkpoint = MATCH', 'sg');
const ruleHintCp = e10.checkpoints.find(cp => cp.id === 'RULE-hint-changed');
// Historical: hint-changed = false for both (no rule selected before click)
assert('G-08', ruleHintCp?.classification === 'MATCH' && ruleHintCp?.original === 'false',
  'RULE-hint-changed = MATCH of false (historically: no rule was selected first)', 'sg');
const ruleHintBefore = e10.checkpoints.find(cp => cp.id === 'RULE-hint-before');
assert('G-09', ruleHintBefore?.original === 'none',
  'RULE-hint-before = none (matched absence — no rule yet selected)', 'sg');
const ruleHintAfter = e10.checkpoints.find(cp => cp.id === 'RULE-hint-after');
assert('G-10', ruleHintAfter?.original === 'none',
  'RULE-hint-after = none (matched — point click without rule did not activate)', 'sg');

/* -----------------------------------------------------------------------
   SECTION H: Pattern — 3 actual submitted cases with scores
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION H: Pattern 3 submitted cases ===');

const pf = e10.pattern_facts || {};
assert('H-01', pf.three_cases_submitted === true, 'Pattern: 3 cases submitted', 'sg');
assert('H-02', pf.final_attempted_count === '3 / 10',
  `Pattern: final count = "3 / 10" (found "${pf.final_attempted_count}")`, 'sg');
assert('H-03', pf.count_is_not_zero === true, 'Pattern: attempted count is not 0/10', 'sg');

for (let trial = 0; trial < 3; trial++) {
  const feedbackCp = e10.checkpoints.find(cp => cp.id === `PAT-feedback${trial}`);
  assert(`H-04-${trial}`, feedbackCp?.classification === 'MATCH',
    `Trial ${trial+1}: feedback checkpoint = MATCH`, 'sg');
  const countCp = e10.checkpoints.find(cp => cp.id === `PAT-count${trial}`);
  assert(`H-05-${trial}`, countCp?.classification === 'MATCH' && countCp.notes?.includes(`${trial+1} / 10`),
    `Trial ${trial+1}: attempt count ${trial+1}/10 confirmed`, 'sg');
  const domCp = e10.checkpoints.find(cp => cp.id === `PAT-dom${trial}`);
  assert(`H-06-${trial}`, domCp?.classification === 'MATCH', `Trial ${trial+1}: DOM = MATCH`, 'sg');
}

/* -----------------------------------------------------------------------
   SECTION I: Candidate SHA unchanged
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION I: Candidate SHA integrity ===');

const actual = crypto.createHash('sha256')
  .update(fs.readFileSync(path.join(ROOT, 'dist', 'recovered-v0.8-faithful.html'), 'utf8'))
  .digest('hex');
assert('I-01', actual === 'a9fe9a3acbb8c35347cc735292ad63883778e5c12845f4da529129119b72c886',
  'dist/recovered-v0.8-faithful.html SHA unchanged on disk', 'sg');

/* -----------------------------------------------------------------------
   SECTION J: Frozen source immutability
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION J: Frozen source immutability ===');

const FROZEN = {
  'src/core/statistics.js':    '74e6d07ccd0bfae7e5cd9821078881b692e762cea3c9b4ad6eaf88799fc8f8d5',
  'src/ui/app-shell.jsx':      '56e3d5fac4fcaffa3184e81f8e8be1fa292558a35d0a77974f0639759d101da4',
  'src/risk/screens.jsx':      '7f0897e8d15704a66c64467a0f977ca7b6c8f2149ee931daeca2bcc63e0bc5e5',
  'src/ui/runtime-bootstrap.js': 'f2bffcb0ab1b0653b866f7247842f4f878d7b6593eb56a5751c404732210e85a',
};
Object.entries(FROZEN).forEach(([rel, expected]) => {
  const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel), 'utf8')).digest('hex');
  assert(`J-01-${path.basename(rel).substring(0,10)}`, actual === expected, `${rel}: SHA-256 unchanged`, 'sg');
});

/* -----------------------------------------------------------------------
   SECTION K: 19-mount wording is observational
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION K: Mount wording ===');

const invariants = fs.readFileSync(path.join(ROOT, 'SCIENTIFIC_INVARIANTS.md'), 'utf8');
assert('K-01', !invariants.includes('React silently coalesces'),
  '"React silently coalesces" absent from SCIENTIFIC_INVARIANTS', 'rc');
assert('K-02', invariants.includes('not directly instrumented') || invariants.includes('not further instrumented'),
  'Observational mount wording present', 'rc');

/* -----------------------------------------------------------------------
   SUMMARY
   ----------------------------------------------------------------------- */
const total = passed + failed;
console.log(`\n${'='.repeat(60)}`);
console.log(`Stage 10E Source-Aware Validation Tests: ${passed}/${total} passed, ${failed} failed`);
console.log(`  Source-grounded expectations: ${sg}`);
console.log(`  Reconstructed expectations:   ${rc}`);
console.log(`  Stage 10D: INCOMPLETE (historical record)`);
console.log(`  Stage 10E: ${e10.summary.total} browser checkpoints — ${e10.summary.match} MATCH / ${e10.summary.difference} DIFF / ${e10.summary.blocked} BLOCKED`);
console.log(`  Candidate SHA: ${e10.candidate_sha.substring(0,16)}...`);
if (failed > 0) {
  console.error('STAGE 10E HISTORICAL RECORD VALIDATOR FAILED — internal inconsistency.');
  process.exit(1);
} else {
  console.log('STAGE 10E HISTORICAL RECORD CONFIRMED — incomplete Rule Detective state-transition validation.');
  process.exit(0);
}
