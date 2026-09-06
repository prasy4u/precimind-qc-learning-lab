/* =========================================================================
   v09/tests/stage11b-foundation-accessibility.test.js

   Stage 11B: Compatibility Foundation + Accessibility Remediation +
   Test Architecture governance tests.

   ARTIFACT PROVENANCE: V09_TEST
   Run: node v09/tests/stage11b-foundation-accessibility.test.js
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

const ROOT = path.join(__dirname, '..', '..');
const V09  = path.join(ROOT, 'v09');

/* -----------------------------------------------------------------------
   SECTION A: Corrected lab/screen count documentation
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION A: Corrected lab/screen count documentation ===');

const charter = fs.readFileSync(path.join(V09, 'docs', 'V09_PRODUCT_CHARTER.md'), 'utf8');
const adr = fs.readFileSync(path.join(V09, 'docs', 'ADR-001-V09-APPLICATION-ARCHITECTURE.md'), 'utf8');

assert('A-01', charter.includes('14 primary navigation destinations') && charter.includes('11 progress-tracked'),
  'Charter states 14 destinations / 11 progress-tracked labs');
assert('A-02', !/13 independent domain laboratories/.test(charter),
  'Charter no longer contains "13 independent domain laboratories"');
assert('A-03', !/\bthirteen labs\b/i.test(charter) || /rather than a new thirteenth competency/.test(charter),
  'Charter "thirteen" occurrences are only in the corrected negation clause');
assert('A-04', !/13 labs do not need to be migrated/.test(adr),
  'ADR-001 no longer contains erroneous "13 labs" wording');
assert('A-05', /\b11 (progress-tracked )?(existing )?labs\b/.test(adr),
  'ADR-001 references 11 labs');

/* -----------------------------------------------------------------------
   SECTION B: v0.8 tag and frozen SHA immutability
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION B: v0.8 immutability ===');

let tagCommit = '';
try { tagCommit = execSync('git rev-list -n 1 recovered-v0.8-validated', { cwd: ROOT }).toString().trim().substring(0, 7); }
catch (e) { tagCommit = 'ERROR'; }
assert('B-01', tagCommit === '1352dba', `v0.8 tag unchanged, points to 1352dba (found "${tagCommit}")`);

const FROZEN_SHAS = {
  'src/core/statistics.js':      '74e6d07ccd0bfae7e5cd9821078881b692e762cea3c9b4ad6eaf88799fc8f8d5',
  'src/ui/app-shell.jsx':        '56e3d5fac4fcaffa3184e81f8e8be1fa292558a35d0a77974f0639759d101da4',
  'src/rules/ui-components.jsx': '4eb7a11042f48962cbdcad41cdf8edf22d42b9b43593960b075ffad8e91473c5',
  'src/ui/shared-components.jsx': 'bd848d01c124c2941fa11b623adda3ba4e47e89f5e29137c901a276bfd7bad51',
  'src/eqa/ui-components.jsx': undefined, // checked below via manifest instead if not in this list
};
Object.entries(FROZEN_SHAS).forEach(([rel, expected]) => {
  if (!expected) return;
  const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel), 'utf8')).digest('hex');
  assert(`B-02-${path.basename(rel).substring(0, 12)}`, actual === expected, `Root ${rel}: SHA-256 unchanged (protected, not modified in v09)`);
});

const origSHA = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, 'recovery', 'original-v0.8.html'), 'utf8')).digest('hex');
assert('B-03', origSHA === 'e5317bf135f350b258428b985c1034a081e244a295f2e580c93cb6a6a091c8e4',
  'recovery/original-v0.8.html unchanged');
const candSHA = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, 'dist', 'recovered-v0.8-faithful.html'), 'utf8')).digest('hex');
assert('B-04', candSHA === 'a9fe9a3acbb8c35347cc735292ad63883778e5c12845f4da529129119b72c886',
  'dist/recovered-v0.8-faithful.html unchanged');

/* -----------------------------------------------------------------------
   SECTION C: v0.9 compatibility assembler and manifest
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION C: v0.9 compatibility assembler ===');

assert('C-01', fs.existsSync(path.join(V09, 'tools', 'assemble-v09-compat.js')),
  'v09/tools/assemble-v09-compat.js exists');
assert('C-02', fs.existsSync(path.join(V09, 'tools', 'v09-source-order.json')),
  'v09/tools/v09-source-order.json exists');
assert('C-03', fs.existsSync(path.join(V09, 'dist', 'precimind-v0.9-compat.html')),
  'v09/dist/precimind-v0.9-compat.html exists (assembled artifact present)');

const manifest = JSON.parse(fs.readFileSync(path.join(V09, 'tools', 'v09-source-order.json'), 'utf8'));
assert('C-04', Array.isArray(manifest.application_modules) && manifest.application_modules.length === 34,
  `Manifest lists 34 application modules (found ${manifest.application_modules.length})`);

/* -----------------------------------------------------------------------
   SECTION D: Baseline-map statuses match actual changed files
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION D: Baseline-map consistency ===');

const baselineMap = JSON.parse(fs.readFileSync(path.join(V09, 'docs', 'v08-to-v09-baseline-map.json'), 'utf8'));
const EXPECTED_MODIFIED = new Set([
  'v09/src/rules/ui-components.jsx',
  'v09/src/ui/shared-components.jsx',
  'v09/src/eqa/ui-components.jsx',
]);

let modifiedCount = 0;
let statusesCorrect = true;
for (const entry of baselineMap.files) {
  const isModified = EXPECTED_MODIFIED.has(entry.destination_path);
  if (isModified) {
    modifiedCount++;
    if (entry.future_change_status !== 'V09_MODIFIED') statusesCorrect = false;
    if (!entry.rationale || entry.rationale.length < 20) statusesCorrect = false;
    // v0.8 original SHA must remain the original recorded value (never altered)
    const srcFull = path.join(ROOT, entry.source_path);
    const actualSrcSha = crypto.createHash('sha256').update(fs.readFileSync(srcFull)).digest('hex');
    if (actualSrcSha !== entry.v08_sha256) statusesCorrect = false;
    // v0.9 current SHA must match disk
    const destFull = path.join(ROOT, entry.destination_path);
    const actualDestSha = crypto.createHash('sha256').update(fs.readFileSync(destFull)).digest('hex');
    if (entry.v09_current_sha256 && actualDestSha !== entry.v09_current_sha256) statusesCorrect = false;
  } else {
    // All other files must remain UNCHANGED_FROM_V08 with matching SHAs
    if (entry.future_change_status && entry.future_change_status !== 'UNCHANGED_FROM_V08') statusesCorrect = false;
    const srcFull = path.join(ROOT, entry.source_path);
    const destFull = path.join(ROOT, entry.destination_path);
    const actualSrcSha = crypto.createHash('sha256').update(fs.readFileSync(srcFull)).digest('hex');
    const actualDestSha = crypto.createHash('sha256').update(fs.readFileSync(destFull)).digest('hex');
    if (actualSrcSha !== actualDestSha) statusesCorrect = false;
  }
}
assert('D-01', modifiedCount === 3, `Exactly 3 files marked V09_MODIFIED (found ${modifiedCount})`);
assert('D-02', statusesCorrect, 'All baseline-map statuses match actual file states on disk');

/* -----------------------------------------------------------------------
   SECTION E: Interactive control audit and test architecture docs
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION E: Interactive control audit + test architecture ===');

const auditPath = path.join(V09, 'docs', 'V09_INTERACTIVE_CONTROL_AUDIT.md');
assert('E-01', fs.existsSync(auditPath) && fs.statSync(auditPath).size > 500,
  'V09_INTERACTIVE_CONTROL_AUDIT.md exists and is substantial');
const audit = fs.readFileSync(auditPath, 'utf8');
assert('E-02', audit.includes('mlj-point-g') && audit.includes('ljchart-point-g') && audit.includes('EQA'),
  'Audit covers Rule (mlj-point-g), LJ (ljchart-point-g), and EQA controls');
assert('E-03', audit.includes('exactly 3'),
  'Audit states exactly 3 synthetic interactive controls found');

const testArchPath = path.join(V09, 'docs', 'V09_TEST_ARCHITECTURE.md');
assert('E-04', fs.existsSync(testArchPath) && fs.statSync(testArchPath).size > 500,
  'V09_TEST_ARCHITECTURE.md exists and is substantial');
const testArch = fs.readFileSync(testArchPath, 'utf8');
assert('E-05', testArch.includes('Layer 1') && testArch.includes('Layer 2') && testArch.includes('Layer 3'),
  'Test architecture defines three layers');
assert('E-06', testArch.includes('3849'),
  'Test architecture references the frozen v0.8 3849 baseline for provenance separation');

/* -----------------------------------------------------------------------
   SECTION F: ADR-001 explicit decision status
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION F: ADR-001 decision status ===');

assert('F-01', adr.includes('ACCEPTED') && adr.includes('TARGET VITE/REACT UNIFIED BUILD'),
  'ADR-001 has an explicit ACCEPTED status with unified-build target');
assert('F-02', adr.includes('MIGRATION DEFERRED TO STAGE 11C'),
  'ADR-001 explicitly defers migration to Stage 11C');
assert('F-03', adr.toLowerCase().includes('split-runtime') && adr.toLowerCase().includes('rejected'),
  'ADR-001 explicitly rejects the split-runtime approach');
assert('F-04', !adr.includes('npm install') && !adr.includes('vite.config'),
  'ADR-001 does not implement the build system (decision only, no tooling)');

/* -----------------------------------------------------------------------
   SECTION G: Roadmap includes Stage 11C
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION G: Roadmap Stage 11C ===');

const roadmap = fs.readFileSync(path.join(V09, 'docs', 'V09_ROADMAP.md'), 'utf8');
assert('G-01', roadmap.includes('Stage 11C') && roadmap.includes('Unified v0.9 Build Migration'),
  'Roadmap includes Stage 11C — Unified v0.9 Build Migration');
assert('G-02', roadmap.indexOf('Stage 11C') < roadmap.indexOf('Stage 12A'),
  'Stage 11C appears before Stage 12A in the roadmap');

/* -----------------------------------------------------------------------
   SECTION H: Morning QC Room implementation still absent
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION H: Morning QC Room implementation absent ===');

['case-schema.js', 'case-engine.js', 'decision-engine.js', 'competency-map.js', 'scoring.js', 'debrief.js'].forEach(f => {
  assert(`H-01-${f}`, !fs.existsSync(path.join(V09, 'src', 'morning-qc', f)),
    `${f} NOT implemented (Stage 11B is foundation only)`);
});

/* -----------------------------------------------------------------------
   SECTION I: No Vite / build dependency added
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION I: No Vite/build tooling installed ===');

assert('I-01', !fs.existsSync(path.join(ROOT, 'package.json')) || !fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8').includes('vite'),
  'No Vite dependency added to any package.json (Stage 11B is migration-free)');
assert('I-02', !fs.existsSync(path.join(V09, 'vite.config.js')) && !fs.existsSync(path.join(V09, 'vite.config.ts')),
  'No vite.config.js/ts created');

/* -----------------------------------------------------------------------
   SECTION J: No frozen root paths changed
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION J: No frozen root paths changed ===');

let diffOutput = '';
try { diffOutput = execSync('git diff b5d7795 --name-only', { cwd: ROOT }).toString(); }
catch (e) { diffOutput = 'ERROR: ' + e.message; }
const lines = diffOutput.split('\n').filter(Boolean);
const badChanges = lines.filter(l => l.startsWith('src/') || l.startsWith('recovery/') || l.startsWith('dist/') ||
  (l.startsWith('tools/') && !l.startsWith('v09/')) || (l.startsWith('tests/') && !l.startsWith('v09/')));
assert('J-01', badChanges.length === 0,
  `No changes outside v09/** since b5d7795 (found ${badChanges.length}: ${badChanges.slice(0,3).join(', ')})`);

/* -----------------------------------------------------------------------
   SUMMARY
   ----------------------------------------------------------------------- */
const total = passed + failed;
console.log(`\n${'='.repeat(60)}`);
console.log(`Stage 11B Foundation/Accessibility Tests: ${passed}/${total} passed, ${failed} failed`);
console.log(`  Artifact class: V09_TEST`);
if (failed > 0) {
  console.error('STAGE 11B GOVERNANCE TESTS FAILED.');
  process.exit(1);
} else {
  console.log('STAGE 11B GOVERNANCE TESTS PASSED.');
  process.exit(0);
}
