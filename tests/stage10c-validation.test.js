/* =========================================================================
   tests/stage10c-validation.test.js

   Stage 10C: Validation of interaction-depth equivalence result artifact
   Validates: recovery/stage10c-interaction-equivalence.json
   Does NOT re-run browser tests — validates their recorded result.

   ARTIFACT PROVENANCE: Class D (recovery infrastructure)
   Run: node tests/stage10c-validation.test.js
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

const ROOT   = path.join(__dirname, '..');
const C10_PATH = path.join(ROOT, 'recovery', 'stage10c-interaction-equivalence.json');
const C10B_PATH = path.join(ROOT, 'recovery', 'stage10b-equivalence.json');
const MAN_PATH  = path.join(ROOT, 'RECOVERY_MANIFEST.md');
const AMAP_PATH = path.join(ROOT, 'recovery', 'assembly-map.json');

const eq  = JSON.parse(fs.readFileSync(C10_PATH, 'utf8'));
const eq10b = JSON.parse(fs.readFileSync(C10B_PATH, 'utf8'));
const manifest = fs.readFileSync(MAN_PATH, 'utf8');
const amap = JSON.parse(fs.readFileSync(AMAP_PATH, 'utf8'));

/* -----------------------------------------------------------------------
   SECTION A: Result file structure
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION A: Stage 10C result structure ===');

assert('A-01', eq.stage === '10C', 'Result stage is 10C', 'rc');
assert('A-02', eq.artifact_class === 'D', 'Artifact class is D', 'rc');
assert('A-03', eq.original_sha === 'e5317bf135f350b258428b985c1034a081e244a295f2e580c93cb6a6a091c8e4',
  'Original SHA matches authoritative', 'sg');
assert('A-04', eq.candidate_sha === 'a9fe9a3acbb8c35347cc735292ad63883778e5c12845f4da529129119b72c886',
  'Candidate SHA matches assembled faithful', 'sg');
assert('A-05', Array.isArray(eq.checkpoints) && eq.checkpoints.length >= 100,
  `Checkpoint array non-trivial (${eq.checkpoints.length} entries)`, 'rc');

/* -----------------------------------------------------------------------
   SECTION B: Summary computed from checkpoint array (not hardcoded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION B: Summary computed from checkpoints ===');

const computed = { match: 0, difference: 0, blocked: 0, not_tested: 0 };
eq.checkpoints.forEach(cp => {
  const k = cp.classification.toLowerCase().replace(/-/g, '_');
  if (computed[k] !== undefined) computed[k]++;
});

assert('B-01', eq.summary.total === eq.checkpoints.length,
  `summary.total (${eq.summary.total}) equals checkpoint array length (${eq.checkpoints.length})`, 'rc');
assert('B-02', eq.summary.match === computed.match,
  `summary.match (${eq.summary.match}) computed correctly from array`, 'rc');
assert('B-03', eq.summary.difference === computed.difference,
  `summary.difference (${eq.summary.difference}) computed correctly from array`, 'rc');
assert('B-04', eq.summary.blocked === computed.blocked,
  `summary.blocked (${eq.summary.blocked}) computed correctly from array`, 'rc');
assert('B-05', eq.summary.not_tested === computed.not_tested,
  `summary.not_tested (${eq.summary.not_tested}) computed correctly`, 'rc');

/* -----------------------------------------------------------------------
   SECTION C: Validation pass criteria
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION C: Stage 10C historical record accuracy ===');

assert('C-01', eq.summary.difference === 0,
  `Stage 10C historical DIFFERENCE = 0 (confirmed)`, 'sg');
assert('C-02', eq.summary.not_tested === 0,
  `Stage 10C historical NOT_TESTED = 0 (confirmed)`, 'sg');
assert('C-03', eq.summary.match === 145,
  `Stage 10C historical MATCH count = 145 (found ${eq.summary.match})`, 'sg');
// BLOCKED is permitted if explained (selector misses re-run with correct selectors)
// Stage 10C historical record: blocked = 19 (not 0 — this is why Stage 10D was required)
assert('C-04-hist', eq.summary.blocked === 19,
  `Stage 10C historical BLOCKED count = 19 (confirmed, not 0)`, 'rc');
// Confirm validation_status correctly records INCOMPLETE
assert('C-05-status', eq.validation_status === 'INCOMPLETE',
  'Stage 10C validation_status = INCOMPLETE (correctly recorded)', 'rc');

/* -----------------------------------------------------------------------
   SECTION D: All required interaction domains represented
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION D: Required domains represented ===');

const REQUIRED_DOMAINS = [
  'diagnostic', 'stats', 'lj', 'pattern', 'rules',
  'strategy', 'risk', 'investigation', 'eqa', 'bv', 'pbrtqc', 'keyboard'
];
const represented = new Set(eq.checkpoints.map(cp => cp.domain));
for (const dom of REQUIRED_DOMAINS) {
  assert(`D-${dom}`, represented.has(dom),
    `Domain "${dom}" represented in checkpoints`, 'sg');
}

/* -----------------------------------------------------------------------
   SECTION E: Key interaction flows present
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION E: Key interaction flows ===');

assert('E-01', eq.checkpoints.some(cp => cp.domain === 'diagnostic' && cp.classification === 'MATCH'),
  'Diagnostic modal: at least one MATCH checkpoint', 'sg');
assert('E-02', eq.checkpoints.some(cp => cp.id === 'LJ-ds0' && cp.classification === 'MATCH'),
  'LJ Lab: dataset switching checkpoint present', 'sg');
assert('E-03', eq.checkpoints.some(cp => cp.id === 'STRAT-APS-case1' && cp.classification === 'MATCH'),
  'APS Explorer: case 1 checkpoint MATCH', 'sg');
assert('E-04', eq.checkpoints.some(cp => cp.id === 'STRAT-APS-case8' && cp.classification === 'MATCH'),
  'APS Explorer: case 8 (Insufficient information) checkpoint MATCH', 'sg');
assert('E-05', eq.checkpoints.some(cp => cp.id.startsWith('RISK-M25') && cp.classification === 'MATCH'),
  'Risk Frequency Simulator M=25 checkpoint MATCH', 'sg');
assert('E-06', eq.checkpoints.some(cp => cp.id.startsWith('RISK-M500') && cp.classification === 'MATCH'),
  'Risk Frequency Simulator M=500 checkpoint MATCH', 'sg');
assert('E-07', eq.checkpoints.some(cp => cp.id.startsWith('INV-RC') && cp.classification === 'MATCH'),
  'Investigation Recovery Challenge checkpoint MATCH', 'sg');
assert('E-08', eq.checkpoints.some(cp => cp.id === 'INV-PATIENT-dom' && cp.classification === 'MATCH'),
  'Patient impact table DOM MATCH', 'sg');
assert('E-09', eq.checkpoints.some(cp => cp.id === 'EQA-COMP-wording' && cp.classification === 'MATCH'),
  'EQA "designated comparator" wording MATCH', 'sg');
assert('E-10', eq.checkpoints.some(cp => cp.id === 'EQA-COMP-wording'),
  'EQA comparability wording checkpoint present', 'sg');

const apsAll8 = [1,2,3,4,5,6,7,8].every(i =>
  eq.checkpoints.some(cp => cp.id === `STRAT-APS-case${i}` && cp.classification === 'MATCH')
);
assert('E-11', apsAll8, 'All 8 APS classification cases MATCH', 'sg');

assert('E-12', eq.checkpoints.some(cp => cp.id === 'PBRTQC-alg-mean' && cp.classification === 'MATCH'),
  'PBRTQC moving mean algorithm MATCH', 'sg');
assert('E-13', eq.checkpoints.some(cp => cp.id === 'PBRTQC-alg-EWMA' && cp.classification === 'MATCH'),
  'PBRTQC EWMA algorithm MATCH', 'sg');
assert('E-14', eq.checkpoints.some(cp => cp.id === 'PBRTQC-SIM-W20' && cp.classification === 'MATCH'),
  'PBRTQC Simulator W=20 MATCH', 'sg');
assert('E-15', eq.checkpoints.some(cp => cp.domain === 'keyboard' && cp.classification === 'MATCH'),
  'Extended keyboard: at least one MATCH checkpoint', 'sg');

/* -----------------------------------------------------------------------
   SECTION F: Stage 10B accurately preserved
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION F: Stage 10B result integrity ===');

assert('F-01', eq10b.summary.total === 115,
  'Stage 10B result: 115 checkpoints preserved', 'sg');
assert('F-02', eq10b.summary.match === 115,
  'Stage 10B result: 115 MATCH preserved', 'sg');
assert('F-03', Array.isArray(eq10b.declared_but_not_executed) && eq10b.declared_but_not_executed.length >= 20,
  `Stage 10B declared_but_not_executed field present (${eq10b.declared_but_not_executed?.length} entries)`, 'rc');
assert('F-04', typeof eq10b.stage10b_note === 'string' && eq10b.stage10b_note.length > 50,
  'Stage 10B note field present explaining the 115-vs-not_tested discrepancy', 'rc');

/* -----------------------------------------------------------------------
   SECTION G: Provenance consistency across manifest and assembly map
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION G: Provenance consistency ===');

const COMPOSITE_FILES = [
  'src/core/statistics.js', 'src/rules/engine.js', 'src/opchar/functions.js',
  'src/strategy/core.js', 'src/risk/detection-delay.js', 'src/risk/data.js',
  'src/investigation/calc.js', 'src/eqa/calc.js', 'src/bv/calc.js', 'src/pbrtqc/calc.js',
];

const amapComposite = amap.modules.filter(m => m.artifact_class === 'composite');
const amapPureA     = amap.modules.filter(m => m.artifact_class === 'A');

assert('G-01', amapComposite.length === 10,
  `assembly-map.json: 10 composite modules (found ${amapComposite.length})`, 'sg');
assert('G-02', amapPureA.length === 24,
  `assembly-map.json: 24 pure Class A modules (found ${amapPureA.length})`, 'sg');

// Check RECOVERY_MANIFEST uses A+D composite wording for all 10 composite files
for (const file of COMPOSITE_FILES) {
  const hasComposite = manifest.includes(file) &&
    (manifest.includes('A+D composite') || manifest.includes('composite'));
  assert(`G-03-${file.split('/').pop().substring(0,10)}`,
    hasComposite,
    `RECOVERY_MANIFEST: ${file.split('/').pop()} marked composite`, 'rc');
}

/* -----------------------------------------------------------------------
   SECTION H: 19-mount wording is observational (not causal)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION H: 19-mount wording ===');

const baseline = fs.readFileSync(path.join(ROOT, 'SCIENTIFIC_INVARIANTS.md'), 'utf8');
assert('H-01', !baseline.includes('React silently coalesces'),
  'SCIENTIFIC_INVARIANTS: "React silently coalesces" removed', 'rc');
assert('H-02', !baseline.includes('React runtime coalesces'),
  'SCIENTIFIC_INVARIANTS: "React runtime coalesces" removed', 'rc');
assert('H-03', baseline.includes('not directly instrumented') || baseline.includes('not further instrumented'),
  'SCIENTIFIC_INVARIANTS: neutral "not instrumented" wording present', 'rc');
assert('H-04', baseline.includes('one root child'),
  'SCIENTIFIC_INVARIANTS: observable "one root child" finding present', 'rc');

/* -----------------------------------------------------------------------
   SECTION I: Candidate SHA unchanged throughout
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION I: Candidate SHA integrity ===');

const actualSHA = crypto.createHash('sha256')
  .update(fs.readFileSync(path.join(ROOT, 'dist', 'recovered-v0.8-faithful.html'), 'utf8'))
  .digest('hex');
assert('I-01', actualSHA === 'a9fe9a3acbb8c35347cc735292ad63883778e5c12845f4da529129119b72c886',
  'dist/recovered-v0.8-faithful.html SHA unchanged on disk', 'sg');
assert('I-02', eq.candidate_sha === actualSHA,
  'stage10c result candidate_sha matches disk SHA', 'sg');

/* -----------------------------------------------------------------------
   SECTION J: Frozen src/ files unchanged
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION J: Frozen source immutability ===');

const FROZEN = {
  'src/core/statistics.js':    '74e6d07ccd0bfae7e5cd9821078881b692e762cea3c9b4ad6eaf88799fc8f8d5',
  'src/ui/app-shell.jsx':      '56e3d5fac4fcaffa3184e81f8e8be1fa292558a35d0a77974f0639759d101da4',
  'src/risk/screens.jsx':      '7f0897e8d15704a66c64467a0f977ca7b6c8f2149ee931daeca2bcc63e0bc5e5',
  'src/ui/runtime-bootstrap.js': 'f2bffcb0ab1b0653b866f7247842f4f878d7b6593eb56a5751c404732210e85a',
  'src/rules/engine.js':       'a2ea2b71e72c312151c3e223b10815fac46d59b697f27912c6df4fc246ddf66b',
};
Object.entries(FROZEN).forEach(([rel, expected]) => {
  const actual = crypto.createHash('sha256')
    .update(fs.readFileSync(path.join(ROOT, rel), 'utf8')).digest('hex');
  assert(`J-01-${path.basename(rel).substring(0,10)}`, actual === expected,
    `${rel}: frozen SHA-256 unchanged`, 'sg');
});

/* -----------------------------------------------------------------------
   SECTION K: Missing required interaction categories = 0
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION K: Required categories coverage ===');

assert('K-01', !eq.missing_required_categories || eq.missing_required_categories.length === 0,
  'No missing required interaction categories', 'sg');
assert('K-02', eq.summary.not_tested === 0,
  'not_tested = 0 (all required flows were attempted)', 'sg');

/* -----------------------------------------------------------------------
   SUMMARY
   ----------------------------------------------------------------------- */
const total = passed + failed;
console.log(`\n${'='.repeat(60)}`);
console.log(`Stage 10C Validation Tests: ${passed}/${total} passed, ${failed} failed`);
console.log(`  Source-grounded expectations: ${sg}`);
console.log(`  Reconstructed expectations:   ${rc}`);
console.log(`  Browser checkpoints validated: ${eq.summary.total}`);
console.log(`    MATCH:    ${eq.summary.match}`);
console.log(`    DIFF:     ${eq.summary.difference}`);
console.log(`    BLOCKED:  ${eq.summary.blocked}`);
console.log(`    NOT_TESTED: ${eq.summary.not_tested}`);
console.log(`  Candidate SHA: ${eq.candidate_sha.substring(0, 16)}...`);
console.log(`  Artifact class of test file: D (recovery infrastructure)`);
// This test validates the Stage 10C HISTORICAL RECORD, not a final validation pass.
// Stage 10C had BLOCKED=19 and did not satisfy BLOCKED=0 for final validation.
// This test passes when it confirms Stage 10C is accurately recorded.
if (failed > 0) {
  console.error('STAGE 10C HISTORICAL RECORD VALIDATOR FAILED — internal inconsistency.');
  process.exit(1);
} else {
  console.log('STAGE 10C HISTORICAL RECORD CONFIRMED — accurately recorded as INCOMPLETE.');
  process.exit(0);
}
