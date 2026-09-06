/* =========================================================================
   v09/tests/unit/v09-assembler-drift-fail.test.js

   Stage 11B corrective closure — proves the v0.9 compatibility assembler
   fails closed on unexpected SHA drift.

   Method: operates entirely on a TEMPORARY copy of v09/ under os.tmpdir(),
   with a temporary manifest. Never modifies real v09/src or the committed
   manifest. Cleans up after itself unconditionally.

   ARTIFACT PROVENANCE: V09_TEST
   Run: node v09/tests/unit/v09-assembler-drift-fail.test.js
   ========================================================================= */
'use strict';

const fs   = require('fs');
const os   = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

let passed = 0, failed = 0;
function assert(id, condition, detail) {
  if (condition) { console.log(`  ✓ [${id}] ${detail}`); passed++; }
  else { console.error(`  ✗ [${id}] FAIL: ${detail}`); failed++; }
}

const REAL_V09 = path.join(__dirname, '..', '..');
const REAL_ROOT = path.join(REAL_V09, '..');

function sha256(content) { return crypto.createHash('sha256').update(content).digest('hex'); }

// Create an isolated temp workspace: copy the real v09 tree + recovery/original-v0.8.html
const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'v09-drift-test-'));
const tmpRoot = path.join(tmpBase, 'workspace');
const tmpV09  = path.join(tmpRoot, 'v09');

function copyRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyRecursive(s, d);
    else fs.copyFileSync(s, d);
  }
}

let cleanupDone = false;
function cleanup() {
  if (cleanupDone) return;
  cleanupDone = true;
  try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch (e) {}
}
process.on('exit', cleanup);

try {
  console.log('\n=== SETUP: isolated temporary workspace ===');
  copyRecursive(REAL_V09, tmpV09);
  fs.mkdirSync(path.join(tmpRoot, 'recovery'), { recursive: true });
  fs.copyFileSync(
    path.join(REAL_ROOT, 'recovery', 'original-v0.8.html'),
    path.join(tmpRoot, 'recovery', 'original-v0.8.html')
  );
  console.log(`  Temporary workspace created at ${tmpBase} (will be deleted)`);
  assert('SETUP-01', fs.existsSync(path.join(tmpV09, 'tools', 'assemble-v09-compat.js')),
    'Temporary v09/tools/assemble-v09-compat.js exists');
  assert('SETUP-02', fs.existsSync(path.join(tmpV09, 'src', 'rules', 'ui-components.jsx')),
    'Temporary v09/src/rules/ui-components.jsx exists');

  /* -----------------------------------------------------------------------
     CASE A: current clean source → assembly passes
     ----------------------------------------------------------------------- */
  console.log('\n=== CASE A: clean source → assembly PASSES ===');
  let caseAResult;
  try {
    const out = execFileSync('node', [path.join(tmpV09, 'tools', 'assemble-v09-compat.js')], { cwd: tmpRoot }).toString();
    caseAResult = { ok: true, out };
  } catch (e) {
    caseAResult = { ok: false, out: (e.stdout || '') + (e.stderr || ''), code: e.status };
  }
  assert('CASE-A-01', caseAResult.ok === true, 'Assembler exits 0 on clean, unmodified source');
  assert('CASE-A-02', caseAResult.out.includes('Assembly Complete'), 'Assembler reports Assembly Complete');
  const candidatePath = path.join(tmpV09, 'dist', 'precimind-v0.9-compat.html');
  assert('CASE-A-03', fs.existsSync(candidatePath), 'Candidate HTML written on clean run');
  const cleanSha = fs.existsSync(candidatePath) ? sha256(fs.readFileSync(candidatePath, 'utf8')) : null;
  assert('CASE-A-04', cleanSha === '975adefb62df00f12372cb705b9c2ef9b51c89a2b8133ade77ebf0db16f8c97c',
    `Clean-run candidate SHA matches the known committed value (found ${cleanSha?.substring(0,16)}...)`);

  /* -----------------------------------------------------------------------
     CASE B: simulated one-character source drift → assembler FAILS
     ----------------------------------------------------------------------- */
  console.log('\n=== CASE B: one-character drift → assembler FAILS (exit non-zero) ===');
  // Introduce a 1-character drift in a file the manifest expects unchanged
  const driftTarget = path.join(tmpV09, 'src', 'core', 'statistics.js');
  const originalContent = fs.readFileSync(driftTarget, 'utf8');
  const driftedContent = originalContent + ' '; // single extra character
  fs.writeFileSync(driftTarget, driftedContent, 'utf8');

  // Remove the clean candidate to unambiguously detect whether Case B overwrites it
  const preCaseBSha = fs.existsSync(candidatePath) ? sha256(fs.readFileSync(candidatePath, 'utf8')) : null;

  let caseBResult;
  try {
    const out = execFileSync('node', [path.join(tmpV09, 'tools', 'assemble-v09-compat.js')], { cwd: tmpRoot }).toString();
    caseBResult = { ok: true, out };
  } catch (e) {
    caseBResult = { ok: false, out: (e.stdout || '') + (e.stderr || ''), code: e.status };
  }
  assert('CASE-B-01', caseBResult.ok === false, 'Assembler exits non-zero on 1-character drift');
  assert('CASE-B-02', typeof caseBResult.code === 'number' && caseBResult.code !== 0,
    `Non-zero exit code recorded (found ${caseBResult.code})`);
  assert('CASE-B-03', caseBResult.out.includes('Unexpected SHA drift'),
    'Failure message explicitly states "Unexpected SHA drift"');
  assert('CASE-B-04', caseBResult.out.includes('statistics.js'),
    'Failure message names the drifted file path');
  assert('CASE-B-05', caseBResult.out.includes('expected current v0.9 SHA') && caseBResult.out.includes('actual SHA'),
    'Failure message includes both expected and actual SHA labels');

  /* -----------------------------------------------------------------------
     CASE C: failure occurs before final candidate write / does not corrupt prior candidate
     ----------------------------------------------------------------------- */
  console.log('\n=== CASE C: failure does not overwrite the previously accepted candidate ===');
  const postCaseBSha = fs.existsSync(candidatePath) ? sha256(fs.readFileSync(candidatePath, 'utf8')) : null;
  assert('CASE-C-01', postCaseBSha === preCaseBSha,
    'Candidate file on disk is unchanged after the failed (Case B) run — no corrupt/partial overwrite');
  assert('CASE-C-02', postCaseBSha === cleanSha,
    'Candidate still matches the known-good clean-run SHA after the failed attempt');

  // Restore the drifted file (within the temp workspace only — real source untouched throughout)
  fs.writeFileSync(driftTarget, originalContent, 'utf8');
  const restoredSha = sha256(fs.readFileSync(driftTarget, 'utf8'));
  const originalSha = sha256(originalContent);
  assert('CASE-C-03', restoredSha === originalSha,
    'Temporary-workspace file restored to its original content (workspace itself is disposable, but confirms no lingering drift within it)');

} finally {
  cleanup();
  console.log('\n=== CLEANUP ===');
  console.log(`  Temporary workspace removed: ${!fs.existsSync(tmpBase)}`);
}

/* -----------------------------------------------------------------------
   REAL v09/src IMMUTABILITY CHECK
   ----------------------------------------------------------------------- */
console.log('\n=== REAL SOURCE IMMUTABILITY (this test never touched real v09/src) ===');
const realStatsPath = path.join(REAL_V09, 'src', 'core', 'statistics.js');
const realStatsExists = fs.existsSync(realStatsPath);
assert('REAL-01', realStatsExists, 'Real v09/src/core/statistics.js still exists');
if (realStatsExists) {
  const realSha = sha256(fs.readFileSync(realStatsPath, 'utf8'));
  assert('REAL-02', realSha === '74e6d07ccd0bfae7e5cd9821078881b692e762cea3c9b4ad6eaf88799fc8f8d5',
    `Real v09/src/core/statistics.js SHA unchanged by this test (found ${realSha.substring(0,16)}...)`);
}

/* -----------------------------------------------------------------------
   SUMMARY
   ----------------------------------------------------------------------- */
const total = passed + failed;
console.log(`\n${'='.repeat(60)}`);
console.log(`v0.9 Assembler Drift-Fail Test: ${passed}/${total} passed, ${failed} failed`);
console.log(`  Artifact class: V09_TEST`);
if (failed > 0) {
  console.error('DRIFT-FAIL TEST FAILED.');
  process.exit(1);
} else {
  console.log('DRIFT-FAIL TEST PASSED — assembler confirmed fail-closed.');
  process.exit(0);
}
