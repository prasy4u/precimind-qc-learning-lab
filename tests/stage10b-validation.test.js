/* =========================================================================
   tests/stage10b-validation.test.js

   Stage 10B: Validation of browser equivalence result artifact
   Validates: recovery/stage10b-equivalence.json
   Does NOT re-run browser tests — validates their recorded result.

   ARTIFACT PROVENANCE: Class D (recovery infrastructure)
   Run: node tests/stage10b-validation.test.js
   ========================================================================= */
'use strict';

const fs   = require('fs');
const path = require('path');

let passed = 0, failed = 0, sg = 0, rc = 0;

function assert(id, condition, detail, prov) {
  if (condition) { console.log(`  ✓ [${id}] ${detail}`); passed++; }
  else { console.error(`  ✗ [${id}] FAIL: ${detail}`); failed++; }
  if (prov === 'sg') sg++; else rc++;
}

const ROOT = path.join(__dirname, '..');
const EQ_PATH = path.join(ROOT, 'recovery', 'stage10b-equivalence.json');

const eq = JSON.parse(fs.readFileSync(EQ_PATH, 'utf8'));

/* -----------------------------------------------------------------------
   SECTION A: Equivalence result structure
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION A: Equivalence result structure ===');

assert('A-01', eq.stage === '10B', 'Result is Stage 10B', 'rc');
assert('A-02', eq.artifact_class === 'D', 'Result artifact class is D', 'rc');
assert('A-03', eq.original_sha === 'e5317bf135f350b258428b985c1034a081e244a295f2e580c93cb6a6a091c8e4',
  'Original SHA matches authoritative', 'sg');
assert('A-04', eq.candidate_sha === 'a9fe9a3acbb8c35347cc735292ad63883778e5c12845f4da529129119b72c886',
  'Candidate SHA matches assembled faithful', 'sg');
assert('A-05', Array.isArray(eq.checkpoints) && eq.checkpoints.length > 50,
  `Checkpoint array non-trivial (${eq.checkpoints.length} entries)`, 'rc');

/* -----------------------------------------------------------------------
   SECTION B: Summary statistics
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION B: Summary statistics ===');

assert('B-01', eq.summary.total === 115,
  `Total checkpoints: 115 (found ${eq.summary.total})`, 'sg');
assert('B-02', eq.summary.match === 115,
  `All checkpoints MATCH: 115 (found ${eq.summary.match})`, 'sg');
assert('B-03', eq.summary.difference === 0,
  `Zero DIFFERENCE checkpoints (found ${eq.summary.difference})`, 'sg');
assert('B-04', eq.summary.blocked === 0,
  `Zero BLOCKED checkpoints (found ${eq.summary.blocked})`, 'sg');
assert('B-05', eq.summary.not_tested === 0,
  `Zero NOT_TESTED checkpoints (found ${eq.summary.not_tested})`, 'sg');

/* -----------------------------------------------------------------------
   SECTION C: 14 screens all matched
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION C: 14-screen DOM equivalence ===');

const screenKeys = ['home', 'map', 'stats', 'lj', 'pattern', 'rules', 'strategy',
  'sigma', 'risk', 'investigation', 'external-assurance', 'bv-rcv', 'pbrtqc', 'evidence'];

for (const key of screenKeys) {
  const cp = eq.checkpoints.find(c => c.id === `SCR-${key}-dom`);
  assert(`C-${key}`, cp && cp.classification === 'MATCH',
    `${key}: root DOM hash MATCH`, 'sg');
}

/* -----------------------------------------------------------------------
   SECTION D: All 4 learner levels matched
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION D: Level switching equivalence ===');

for (const lv of ['beginner', 'intermediate', 'advanced', 'expert']) {
  const cpHome = eq.checkpoints.find(c => c.id === `LV-${lv}-home`);
  const cpMap  = eq.checkpoints.find(c => c.id === `LV-${lv}-map`);
  assert(`D-${lv}-home`, cpHome && cpHome.classification === 'MATCH',
    `Level ${lv}: Home DOM MATCH`, 'sg');
  assert(`D-${lv}-map`, cpMap && cpMap.classification === 'MATCH',
    `Level ${lv}: Competency Map DOM MATCH`, 'sg');
}

/* -----------------------------------------------------------------------
   SECTION E: Modal equivalence
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION E: Modal equivalence ===');

assert('E-01', eq.checkpoints.find(c => c.id === 'MOD-glossary-dom')?.classification === 'MATCH',
  'Glossary dialog DOM: MATCH', 'sg');
assert('E-02', eq.checkpoints.find(c => c.id === 'MOD-glossary-count')?.classification === 'MATCH',
  'Glossary item count: MATCH', 'sg');
assert('E-03', eq.checkpoints.find(c => c.id === 'MOD-about-dom')?.classification === 'MATCH',
  'About dialog DOM: MATCH', 'sg');
assert('E-04', eq.checkpoints.find(c => c.id === 'MOD-about-version')?.classification === 'MATCH',
  'About version string: MATCH', 'sg');
assert('E-05', eq.checkpoints.find(c => c.id === 'MOD-about-escape')?.classification === 'MATCH',
  'About Escape key close: MATCH', 'sg');

/* -----------------------------------------------------------------------
   SECTION F: Console/error equivalence
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION F: Console/error equivalence ===');

assert('F-01', eq.checkpoints.find(c => c.id === 'CON-pageErrors')?.classification === 'MATCH',
  'Page error count: MATCH', 'sg');
assert('F-02', eq.checkpoints.find(c => c.id === 'CON-reactDom')?.classification === 'MATCH',
  'ReactDOM message count: MATCH', 'sg');
assert('F-03', eq.checkpoints.find(c => c.id === 'CON-appErrors')?.classification === 'MATCH',
  'Application error count: MATCH (no candidate-only errors)', 'sg');

/* -----------------------------------------------------------------------
   SECTION G: Keyboard/accessibility equivalence
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION G: Keyboard / accessibility equivalence ===');

assert('G-01', eq.checkpoints.find(c => c.id === 'KB-01-skip')?.classification === 'MATCH',
  'Skip link: first Tab target MATCH', 'sg');
assert('G-02', eq.checkpoints.find(c => c.id === 'KB-02-modal-escape')?.classification === 'MATCH',
  'Escape closes modal: MATCH', 'sg');
assert('G-03', eq.checkpoints.find(c => c.id === 'KB-03-aria-current')?.classification === 'MATCH',
  'aria-current active nav: MATCH', 'sg');
assert('G-04', eq.checkpoints.find(c => c.id === 'KB-04-nav-label')?.classification === 'MATCH',
  'nav aria-label: MATCH', 'sg');

/* -----------------------------------------------------------------------
   SECTION H: Visual / screenshot equivalence
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION H: Visual screenshot equivalence ===');

const deskScreens = ['home', 'statistics_playground', 'rule_laboratory', 'qc_strategy_lab',
  'risk_frequency_lab', 'investigation_lab', 'external_assurance_lab', 'bv_rcv_lab', 'patient_surveillance_lab'];
for (const key of deskScreens) {
  const cp = eq.checkpoints.find(c => c.id === `VIS-desk-${key}`);
  assert(`H-desk-${key.substring(0,12)}`, cp && cp.classification === 'MATCH',
    `Desktop ${key}: screenshot MATCH`, 'sg');
}

const mobScreens = ['home', 'rule_laboratory', 'risk_frequency_lab', 'patient_surveillance_lab'];
for (const key of mobScreens) {
  const cp = eq.checkpoints.find(c => c.id === `VIS-mob-${key}`);
  assert(`H-mob-${key.substring(0,12)}`, cp && cp.classification === 'MATCH',
    `Mobile ${key}: screenshot MATCH`, 'sg');
}

/* -----------------------------------------------------------------------
   SECTION I: 19-mount instrumented result
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION I: 19-mount instrumented finding ===');

const origMountWarn = eq.checkpoints.find(c => c.id === 'MOUNT-orig-warnings');
const candMountWarn = eq.checkpoints.find(c => c.id === 'MOUNT-cand-warnings');
const origMountErr  = eq.checkpoints.find(c => c.id === 'MOUNT-orig-errors');
const candMountErr  = eq.checkpoints.find(c => c.id === 'MOUNT-cand-errors');
const mountChildren = eq.checkpoints.find(c => c.id === 'MOUNT-root-children');

assert('I-01', origMountWarn?.original === '0',
  'Original: zero ReactDOM mount warnings', 'sg');
assert('I-02', candMountWarn?.original === '0',
  'Candidate: zero ReactDOM mount warnings', 'sg');
assert('I-03', origMountErr?.original === '0',
  'Original: zero page errors from mounts', 'sg');
assert('I-04', candMountErr?.original === '0',
  'Candidate: zero page errors from mounts', 'sg');
assert('I-05', mountChildren?.original === '1',
  'Root has 1 child after 19 mounts (original) — React runtime coalesces', 'sg');
assert('I-06', mountChildren?.classification === 'MATCH',
  'Root child count identical in original and candidate', 'sg');

/* -----------------------------------------------------------------------
   SECTION J: No candidate-only differences
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION J: No candidate-only differences ===');

const differences = eq.checkpoints.filter(c => c.classification === 'DIFFERENCE');
assert('J-01', differences.length === 0,
  `Zero differences across all ${eq.summary.total} checkpoints`, 'sg');

const blocked = eq.checkpoints.filter(c => c.classification === 'BLOCKED');
assert('J-02', blocked.length === 0,
  `Zero blocked checkpoints`, 'rc');

/* -----------------------------------------------------------------------
   SECTION K: Candidate SHA locked
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION K: Candidate SHA ===');

assert('K-01', eq.candidate_sha === 'a9fe9a3acbb8c35347cc735292ad63883778e5c12845f4da529129119b72c886',
  'Faithful candidate SHA-256 unchanged throughout validation', 'sg');

const actual = require('crypto').createHash('sha256')
  .update(fs.readFileSync(path.join(ROOT, 'dist', 'recovered-v0.8-faithful.html'), 'utf8'))
  .digest('hex');
assert('K-02', actual === 'a9fe9a3acbb8c35347cc735292ad63883778e5c12845f4da529129119b72c886',
  'dist/recovered-v0.8-faithful.html SHA confirmed on disk', 'sg');

/* -----------------------------------------------------------------------
   SUMMARY
   ----------------------------------------------------------------------- */
const total = passed + failed;
console.log(`\n${'='.repeat(60)}`);
console.log(`Stage 10B Validation Tests: ${passed}/${total} passed, ${failed} failed`);
console.log(`  Source-grounded expectations: ${sg}`);
console.log(`  Reconstructed expectations:   ${rc}`);
console.log(`  Browser checkpoints validated: ${eq.summary.total} (all MATCH)`);
console.log(`  Artifact class of test file: D (recovery infrastructure)`);
if (failed > 0) {
  console.error('STAGE 10B VALIDATION FAILED.');
  process.exit(1);
} else {
  console.log('STAGE 10B VALIDATION PASSED.');
  process.exit(0);
}
