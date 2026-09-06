/* =========================================================================
   v09/tests/stage11a-v09-foundation.test.js

   Stage 11A: v0.9 Development Fork + Architecture Charter governance tests.
   Tests ONLY Stage 11A governance — no Morning QC Room implementation exists.

   ARTIFACT PROVENANCE: V09_TEST
   Run: node v09/tests/stage11a-v09-foundation.test.js
   ========================================================================= */
'use strict';

const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

let passed = 0, failed = 0;

function assert(id, condition, detail) {
  if (condition) { console.log(`  ✓ [${id}] ${detail}`); passed++; }
  else { console.error(`  ✗ [${id}] FAIL: ${detail}`); failed++; }
}

const ROOT = path.join(__dirname, '..', '..'); // /home/claude
const V09  = path.join(ROOT, 'v09');

/* -----------------------------------------------------------------------
   SECTION A: Branch and tag governance
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION A: Branch and tag governance ===');

let currentBranch = '';
try {
  currentBranch = execSync('git branch --show-current', { cwd: ROOT }).toString().trim();
} catch (e) { currentBranch = 'ERROR: ' + e.message; }
assert('A-01', currentBranch === 'v0.9-development',
  `Current branch is v0.9-development (found "${currentBranch}")`);

let tagCommit = '';
try {
  tagCommit = execSync('git rev-list -n 1 recovered-v0.8-validated', { cwd: ROOT }).toString().trim().substring(0, 7);
} catch (e) { tagCommit = 'ERROR'; }
assert('A-02', tagCommit === '1352dba',
  `recovered-v0.8-validated tag points to 1352dba (found "${tagCommit}")`);

/* -----------------------------------------------------------------------
   SECTION B: Frozen v0.8 source immutability
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION B: Frozen v0.8 source immutability ===');

const FROZEN_SHAS = {
  'src/core/statistics.js':      '74e6d07ccd0bfae7e5cd9821078881b692e762cea3c9b4ad6eaf88799fc8f8d5',
  'src/ui/app-shell.jsx':        '56e3d5fac4fcaffa3184e81f8e8be1fa292558a35d0a77974f0639759d101da4',
  'src/ui/runtime-bootstrap.js': 'f2bffcb0ab1b0653b866f7247842f4f878d7b6593eb56a5751c404732210e85a',
  'src/rules/engine.js':         'a2ea2b71e72c312151c3e223b10815fac46d59b697f27912c6df4fc246ddf66b',
  'src/ui/original-v0.8.css':    'fda2285cb24966f3225bdfe5f2bd43f0e7065cef7616d882c24085c3d48b0212',
};
Object.entries(FROZEN_SHAS).forEach(([rel, expected]) => {
  const full = path.join(ROOT, rel);
  const actual = crypto.createHash('sha256').update(fs.readFileSync(full, 'utf8')).digest('hex');
  assert(`B-01-${path.basename(rel).substring(0, 12)}`, actual === expected,
    `${rel}: SHA-256 unchanged`);
});

const origSHA = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, 'recovery', 'original-v0.8.html'), 'utf8')).digest('hex');
assert('B-02', origSHA === 'e5317bf135f350b258428b985c1034a081e244a295f2e580c93cb6a6a091c8e4',
  'recovery/original-v0.8.html SHA-256 unchanged');

const candSHA = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, 'dist', 'recovered-v0.8-faithful.html'), 'utf8')).digest('hex');
assert('B-03', candSHA === 'a9fe9a3acbb8c35347cc735292ad63883778e5c12845f4da529129119b72c886',
  'dist/recovered-v0.8-faithful.html SHA-256 unchanged');

/* -----------------------------------------------------------------------
   SECTION C: v09 tree structure
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION C: v09 tree structure ===');

['src', 'tests', 'tools', 'docs', 'dist'].forEach(dir => {
  assert(`C-01-${dir}`, fs.existsSync(path.join(V09, dir)) && fs.statSync(path.join(V09, dir)).isDirectory(),
    `v09/${dir} exists`);
});

/* -----------------------------------------------------------------------
   SECTION D: Baseline copy map
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION D: Baseline copy map ===');

const mapJsonPath = path.join(V09, 'docs', 'v08-to-v09-baseline-map.json');
assert('D-01', fs.existsSync(mapJsonPath), 'v08-to-v09-baseline-map.json exists');

const mapMdPath = path.join(V09, 'docs', 'V08_TO_V09_BASELINE_MAP.md');
assert('D-02', fs.existsSync(mapMdPath), 'V08_TO_V09_BASELINE_MAP.md exists');

const map = JSON.parse(fs.readFileSync(mapJsonPath, 'utf8'));
assert('D-03', Array.isArray(map.files) && map.files.length > 30,
  `Baseline map has substantial file count (found ${map.files.length})`);
assert('D-04', map.v08_validated_commit === '1352dba',
  'Baseline map records v0.8 validated commit 1352dba');

// Every copied source has matching initial SHA — for files still at
// UNCHANGED_FROM_V08 status. Files intentionally modified in a later stage
// (tracked via future_change_status = V09_MODIFIED in the baseline map)
// are expected to diverge from their initial SHA — that is not a defect,
// it is why the status field and rationale exist.
let allShasMatch = true;
let checkedCount = 0;
for (const entry of map.files) {
  const srcFull = path.join(ROOT, entry.source_path);
  const destFull = path.join(ROOT, entry.destination_path);
  if (!fs.existsSync(srcFull) || !fs.existsSync(destFull)) { allShasMatch = false; continue; }
  const srcSha = crypto.createHash('sha256').update(fs.readFileSync(srcFull)).digest('hex');
  const destSha = crypto.createHash('sha256').update(fs.readFileSync(destFull)).digest('hex');
  checkedCount++;
  // v0.8 original SHA must never change regardless of status
  if (srcSha !== entry.v08_sha256) { allShasMatch = false; continue; }
  const status = entry.future_change_status || 'UNCHANGED_FROM_V08';
  if (status === 'UNCHANGED_FROM_V08') {
    if (destSha !== entry.v09_initial_sha256) allShasMatch = false;
  } else if (status === 'V09_MODIFIED') {
    // Intentional divergence is expected; just require a rationale and a recorded current SHA
    if (!entry.rationale || !entry.v09_current_sha256) allShasMatch = false;
  }
}
assert('D-05', checkedCount === map.files.length,
  `All ${map.files.length} baseline-map entries verified on disk`);
assert('D-06', allShasMatch,
  'Every copied source file matches its recorded status (UNCHANGED_FROM_V08 files match v0.8 exactly; V09_MODIFIED files have rationale + recorded current SHA)');

/* -----------------------------------------------------------------------
   SECTION E: Governance documents exist
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION E: Governance documents ===');

const REQUIRED_DOCS = [
  'V09_PRODUCT_CHARTER.md',
  'V09_ACCESSIBILITY_DEBT.md',
  'V09_TECHNICAL_DEBT.md',
  'ADR-001-V09-APPLICATION-ARCHITECTURE.md',
  'V09_SCIENTIFIC_INVARIANTS.md',
  'V09_ROADMAP.md',
  'V09_CASE_FAMILY_CATALOGUE.md',
];
REQUIRED_DOCS.forEach(doc => {
  const full = path.join(V09, 'docs', doc);
  assert(`E-01-${doc.substring(0, 20)}`, fs.existsSync(full) && fs.statSync(full).size > 100,
    `v09/docs/${doc} exists and is non-trivial`);
});

const changelogPath = path.join(V09, 'CHANGELOG.md');
assert('E-02', fs.existsSync(changelogPath) && fs.statSync(changelogPath).size > 100,
  'v09/CHANGELOG.md exists and is non-trivial');

/* -----------------------------------------------------------------------
   SECTION F: Product charter content checks
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION F: Product charter content ===');

const charter = fs.readFileSync(path.join(V09, 'docs', 'V09_PRODUCT_CHARTER.md'), 'utf8');
assert('F-01', charter.includes('Morning QC Room'), 'Charter mentions Morning QC Room');
assert('F-02', charter.includes('CAPSTONE') || charter.includes('capstone'),
  'Charter describes Morning QC Room as a capstone');
assert('F-03', !charter.includes('QC-13') || charter.includes('NOT'),
  'Charter clarifies Morning QC Room is not "QC-13"');
assert('F-04', charter.includes('UNDERSTAND') && charter.includes('GOVERN'),
  'Charter preserves the UNDERSTAND→...→GOVERN pedagogic progression');
assert('F-05', charter.includes('signal') && charter.includes('root cause'),
  'Charter carries forward the signal≠root-cause investigation doctrine');
assert('F-06', charter.includes('beginner') && charter.includes('LEVEL 1'),
  'Charter distinguishes learner levels from case levels');

/* -----------------------------------------------------------------------
   SECTION G: Technical/accessibility debt content
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION G: Debt register content ===');

const techDebt = fs.readFileSync(path.join(V09, 'docs', 'V09_TECHNICAL_DEBT.md'), 'utf8');
assert('G-01', techDebt.includes('TD-001') && techDebt.includes('19'),
  'Technical debt register includes TD-001 (19 mount calls)');
assert('G-02', techDebt.includes('TD-002') && techDebt.includes('Babel'),
  'Technical debt register includes TD-002 (runtime Babel)');

const a11yDebt = fs.readFileSync(path.join(V09, 'docs', 'V09_ACCESSIBILITY_DEBT.md'), 'utf8');
assert('G-03', a11yDebt.includes('mlj-point-g') && a11yDebt.includes('Enter'),
  'Accessibility debt register documents Rule Detective keyboard limitation');

/* -----------------------------------------------------------------------
   SECTION H: ADR content
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION H: ADR-001 content ===');

const adr = fs.readFileSync(path.join(V09, 'docs', 'ADR-001-V09-APPLICATION-ARCHITECTURE.md'), 'utf8');
assert('H-01', adr.includes('Option A') && adr.includes('Option B'),
  'ADR-001 compares at least two options');
assert('H-02', adr.toLowerCase().includes('recommendation'),
  'ADR-001 gives a recommendation');
assert('H-03', !adr.includes('npm install') && !adr.includes('vite.config'),
  'ADR-001 does not implement the build system (recommendation only)');

/* -----------------------------------------------------------------------
   SECTION I: Morning QC Room provisional structure
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION I: Morning QC Room provisional structure ===');

['cases', 'components', 'screens'].forEach(dir => {
  const full = path.join(V09, 'src', 'morning-qc', dir);
  assert(`I-01-${dir}`, fs.existsSync(full) && fs.statSync(full).isDirectory(),
    `v09/src/morning-qc/${dir}/ exists`);
});
assert('I-02', !fs.existsSync(path.join(V09, 'src', 'morning-qc', 'case-engine.js')),
  'case-engine.js NOT implemented yet (Stage 11A is architecture only)');
assert('I-03', !fs.existsSync(path.join(V09, 'src', 'morning-qc', 'case-schema.js')),
  'case-schema.js NOT implemented yet (Stage 11A is architecture only)');

/* -----------------------------------------------------------------------
   SECTION J: No frozen root src/ files changed
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION J: No frozen root src/ changes ===');

let diffOutput = '';
try {
  diffOutput = execSync('git diff recovered-v0.8-validated --name-only', { cwd: ROOT }).toString();
} catch (e) { diffOutput = 'ERROR: ' + e.message; }
const srcChanges = diffOutput.split('\n').filter(l => l.startsWith('src/'));
assert('J-01', srcChanges.length === 0,
  `No changes to frozen root src/ (found ${srcChanges.length} changed files)`);
const distChanges = diffOutput.split('\n').filter(l => l === 'dist/recovered-v0.8-faithful.html');
assert('J-02', distChanges.length === 0,
  'dist/recovered-v0.8-faithful.html not modified');
const origChanges = diffOutput.split('\n').filter(l => l === 'recovery/original-v0.8.html');
assert('J-03', origChanges.length === 0,
  'recovery/original-v0.8.html not modified');

/* -----------------------------------------------------------------------
   SUMMARY
   ----------------------------------------------------------------------- */
const total = passed + failed;
console.log(`\n${'='.repeat(60)}`);
console.log(`Stage 11A Foundation Tests: ${passed}/${total} passed, ${failed} failed`);
console.log(`  Artifact class of test file: V09_TEST`);
console.log(`  Branch: ${currentBranch}`);
console.log(`  v0.8 baseline tag target: ${tagCommit}`);
if (failed > 0) {
  console.error('STAGE 11A FOUNDATION TESTS FAILED.');
  process.exit(1);
} else {
  console.log('STAGE 11A FOUNDATION TESTS PASSED.');
  process.exit(0);
}
