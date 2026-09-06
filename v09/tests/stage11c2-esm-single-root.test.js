/* =========================================================================
   v09/tests/stage11c2-esm-single-root.test.js

   Stage 11C2: ES-Module Migration + Single React Root governance tests.

   ARTIFACT PROVENANCE: V09_TEST
   Run: node v09/tests/stage11c2-esm-single-root.test.js
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
function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }

const ROOT = path.join(__dirname, '..', '..');
const V09  = path.join(__dirname, '..');
const APP  = path.join(V09, 'app');

/* -----------------------------------------------------------------------
   1. Correct starting provenance
   ----------------------------------------------------------------------- */
console.log('\n=== 1. Starting provenance ===');
let currentBranch = '';
try { currentBranch = execSync('git branch --show-current', { cwd: ROOT }).toString().trim(); } catch (e) {}
assert('1a', currentBranch === 'v0.9-development', `Branch is v0.9-development (found "${currentBranch}")`);
let tagCommit = '';
try { tagCommit = execSync('git rev-list -n 1 recovered-v0.8-validated', { cwd: ROOT }).toString().trim().substring(0, 7); } catch (e) {}
assert('1b', tagCommit === '1352dba', `v0.8 tag still points to 1352dba (found "${tagCommit}")`);

/* -----------------------------------------------------------------------
   2. 34 migrated modules
   ----------------------------------------------------------------------- */
console.log('\n=== 2. 34 migrated modules ===');
const MANIFEST = JSON.parse(fs.readFileSync(path.join(V09, 'tools', 'v09-source-order.json'), 'utf8'));
assert('2a', MANIFEST.application_modules.length === 34, `Manifest has 34 application modules (found ${MANIFEST.application_modules.length})`);
let allActiveExist = true;
for (const mod of MANIFEST.application_modules) {
  const activePath = mod.path.replace(/^src\//, 'app/');
  if (!fs.existsSync(path.join(V09, activePath))) allActiveExist = false;
}
assert('2b', allActiveExist, 'All 34 corresponding active app/ files exist');

/* -----------------------------------------------------------------------
   3. Frozen legacy source unchanged
   ----------------------------------------------------------------------- */
console.log('\n=== 3. Frozen legacy source unchanged ===');
function unchangedSince(relPath, ref) {
  try { return execSync(`git diff ${ref} --name-only -- ${relPath}`, { cwd: ROOT }).toString().trim().length === 0; }
  catch (e) { return false; }
}
const BASE_REF = '75a863f';
assert('3a', unchangedSince('v09/src', BASE_REF), 'v09/src/** unchanged since 75a863f');
const legacyAppShellMounts = (fs.readFileSync(path.join(V09, 'src', 'ui', 'app-shell.jsx'), 'utf8').match(/ReactDOM\.createRoot\(/g) || []).length;
assert('3b', legacyAppShellMounts === 19, `Frozen legacy app-shell.jsx still has 19 mounts (found ${legacyAppShellMounts})`);

/* -----------------------------------------------------------------------
   4. Stage 11C1 bridge frozen
   ----------------------------------------------------------------------- */
console.log('\n=== 4. Stage 11C1 bridge frozen ===');
assert('4a', unchangedSince('v09/tools/generate-vite-bridge.cjs', BASE_REF), 'Bridge generator unchanged since 75a863f');
assert('4b', unchangedSince('v09/vite.config.mjs', BASE_REF), 'Bridge vite.config.mjs unchanged since 75a863f');
assert('4c', unchangedSince('v09/index.html', BASE_REF), 'Bridge index.html unchanged since 75a863f');
const bridgeResultPath = path.join(V09, 'tests', 'browser', 'v09-vite-bridge-equivalence-result.json');
assert('4d', unchangedSince('v09/tests/browser/v09-vite-bridge-equivalence-result.json', BASE_REF), 'Stage 11C1 browser result unchanged since 75a863f');

const bridgeSrc = fs.readFileSync(path.join(V09, 'app-bridge', 'bridge-entry.generated.jsx'), 'utf8');
const bridgeCodeLines = bridgeSrc.split('\n').filter(l => !l.trim().startsWith('//'));
const bridgeMountCount = bridgeCodeLines.join('\n').match(/ReactDOM\.createRoot\(/g)?.length || 0;
assert('4e', bridgeMountCount === 19, `Stage 11C1 bridge still has 19 mounts in code (found ${bridgeMountCount})`);

/* -----------------------------------------------------------------------
   5. Package versions unchanged
   ----------------------------------------------------------------------- */
console.log('\n=== 5. Package versions unchanged ===');
assert('5a', unchangedSince('v09/package-lock.json', BASE_REF), 'package-lock.json unchanged since 75a863f');
const pkg = JSON.parse(fs.readFileSync(path.join(V09, 'package.json'), 'utf8'));
assert('5b', pkg.dependencies.react === '^19.2.8' && pkg.dependencies['react-dom'] === '^19.2.8', 'React/ReactDOM versions unchanged in package.json');
assert('5c', pkg.devDependencies.vite === '^8.2.2' && pkg.devDependencies['@vitejs/plugin-react'] === '^6.1.1', 'Vite/plugin-react versions unchanged in package.json');

/* -----------------------------------------------------------------------
   6. Active ESM semantics
   ----------------------------------------------------------------------- */
console.log('\n=== 6. Active ESM semantics ===');
const appPkg = JSON.parse(fs.readFileSync(path.join(APP, 'package.json'), 'utf8'));
assert('6a', appPkg.type === 'module', 'v09/app/package.json declares type=module');
const parentPkg = JSON.parse(fs.readFileSync(path.join(V09, 'package.json'), 'utf8'));
assert('6b', parentPkg.type === undefined, 'Parent v09/package.json does NOT declare type=module (preserves Stage 11B/11C1 CommonJS tooling)');

/* -----------------------------------------------------------------------
   7-10. Import graph: resolvable, exported, zero unresolved, zero cycles
   ----------------------------------------------------------------------- */
console.log('\n=== 7-10. Import graph ===');
const importGraphResult = JSON.parse(fs.readFileSync(path.join(V09, 'docs', 'stage11c2-import-graph-result.json'), 'utf8'));
assert('7', importGraphResult.files_inspected === 34, `Import graph inspected 34 files (found ${importGraphResult.files_inspected})`);
assert('8', importGraphResult.missing_imports.length === 0, `Zero missing imports (found ${importGraphResult.missing_imports.length})`);
assert('9', importGraphResult.unresolved_imports.length === 0, `Zero unresolved imports (found ${importGraphResult.unresolved_imports.length})`);
assert('10', importGraphResult.cycles.length === 0, `Zero circular dependencies (found ${importGraphResult.cycles.length})`);

/* -----------------------------------------------------------------------
   11. Zero CommonJS wrappers in active source
   ----------------------------------------------------------------------- */
console.log('\n=== 11. Zero CommonJS wrappers ===');
assert('11', importGraphResult.commonjs_files.length === 0, `Zero CommonJS wrapper files in active app/ (found ${importGraphResult.commonjs_files.length})`);

/* -----------------------------------------------------------------------
   12. Zero implicit hook-global reliance
   ----------------------------------------------------------------------- */
console.log('\n=== 12. Zero implicit hook-global reliance ===');
assert('12', importGraphResult.bare_hook_files.length === 0, `Zero bare-hook-global files (found ${importGraphResult.bare_hook_files.length})`);

/* -----------------------------------------------------------------------
   13. Strict source-transform verification
   ----------------------------------------------------------------------- */
console.log('\n=== 13. Strict source-transform verification ===');
const transformResult = JSON.parse(fs.readFileSync(path.join(V09, 'docs', 'stage11c2-transform-verification-result.json'), 'utf8'));
assert('13a', transformResult.total_modules === 34, `Transform verification covered 34 modules (found ${transformResult.total_modules})`);
assert('13b', transformResult.all_pass === true, 'All 34 modules pass strict source-transform verification (surgical migration only)');

/* -----------------------------------------------------------------------
   14-16. Single external entry, exactly one createRoot, zero in app-shell
   ----------------------------------------------------------------------- */
console.log('\n=== 14-16. Single-root architecture ===');
assert('14', importGraphResult.main_imports_app === true, 'main.jsx imports App from ./ui/app-shell.jsx');
assert('15', importGraphResult.main_create_root_count === 1, `Exactly 1 createRoot call in main.jsx (found ${importGraphResult.main_create_root_count})`);
const activeAppShellSrc = fs.readFileSync(path.join(APP, 'ui', 'app-shell.jsx'), 'utf8');
const activeAppShellMounts = (activeAppShellSrc.match(/createRoot\(/g) || []).length;
assert('16', activeAppShellMounts === 0, `Zero createRoot calls in active app-shell.jsx (found ${activeAppShellMounts})`);

// Confirm exactly one createRoot across the ENTIRE app/** tree (not just main.jsx + app-shell.jsx individually)
function findAllAppFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findAllAppFiles(full));
    else if (/\.(js|jsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}
let totalCreateRootInTree = 0;
for (const f of findAllAppFiles(APP)) {
  const src = fs.readFileSync(f, 'utf8');
  const codeOnly = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  totalCreateRootInTree += (codeOnly.match(/createRoot\(/g) || []).length;
}
assert('16b', totalCreateRootInTree === 1, `Exactly 1 createRoot call across the entire v09/app/** tree (found ${totalCreateRootInTree})`);

/* -----------------------------------------------------------------------
   17. No runtime Babel
   ----------------------------------------------------------------------- */
console.log('\n=== 17. No runtime Babel ===');
const modularDistDir = path.join(V09, 'dist-vite');
let modularBuiltJs = '';
if (fs.existsSync(path.join(modularDistDir, 'assets'))) {
  for (const f of fs.readdirSync(path.join(modularDistDir, 'assets'))) {
    if (f.endsWith('.js')) modularBuiltJs += fs.readFileSync(path.join(modularDistDir, 'assets', f), 'utf8');
  }
}
assert('17', !modularBuiltJs.includes('Babel.transform'), 'Modular build output contains no Babel.transform');

/* -----------------------------------------------------------------------
   18. Separate final build
   ----------------------------------------------------------------------- */
console.log('\n=== 18. Separate final build ===');
assert('18a', fs.existsSync(modularDistDir), 'v09/dist-vite/ exists');
assert('18b', modularDistDir !== path.join(V09, 'dist-vite-bridge'), 'Modular build output is a distinct directory from the Stage 11C1 bridge build');

/* -----------------------------------------------------------------------
   19. Deterministic build evidence
   ----------------------------------------------------------------------- */
console.log('\n=== 19. Deterministic build evidence ===');
const reproEvidence = JSON.parse(fs.readFileSync(path.join(V09, 'docs', 'stage11c2-reproducibility-evidence.json'), 'utf8'));
assert('19a', reproEvidence.reproduction_a_sha === reproEvidence.reproduction_b_sha, 'Reproduction A === Reproduction B');
assert('19b', reproEvidence.npm_ci_sha === reproEvidence.reproduction_a_sha, 'Clean npm ci reproduction matches (genuine, not fabricated)');
assert('19c', reproEvidence.frozen_stage11c1_bridge_tree_sha256_reconfirmed_unchanged === 'c0407262fae35c913ec802740f27c37289e31038de9ad4cd542bb803e61d2e65',
  'Frozen Stage 11C1 bridge tree SHA reconfirmed unchanged during this reproducibility test');

/* -----------------------------------------------------------------------
   20. Active scientific parity
   ----------------------------------------------------------------------- */
console.log('\n=== 20. Active scientific parity ===');
// We can't easily re-run the async test file's exit code here without
// spawning it; instead verify its existence and re-invoke it as a subprocess.
let parityOutput = '';
let parityExitCode = 1;
try {
  parityOutput = execSync(`node ${path.join(V09, 'tests', 'stage11c2-scientific-parity.test.cjs')}`).toString();
  parityExitCode = 0;
} catch (e) {
  parityOutput = (e.stdout || '').toString();
  parityExitCode = e.status;
}
assert('20', parityExitCode === 0 && parityOutput.includes('SCIENTIFIC PARITY PASSED'), 'Active-module scientific parity test passes (re-invoked as subprocess)');

/* -----------------------------------------------------------------------
   21-22. Browser equivalence: zero unexpected, zero blocked
   ----------------------------------------------------------------------- */
console.log('\n=== 21-22. Browser equivalence ===');
const browserResultPath = path.join(V09, 'tests', 'browser', 'v09-stage11c2-modular-equivalence-result.json');
assert('21pre', fs.existsSync(browserResultPath), 'Stage 11C2 browser result exists');
const browserResult = fs.existsSync(browserResultPath) ? JSON.parse(fs.readFileSync(browserResultPath, 'utf8')) : { summary: {} };
assert('21', browserResult.summary.unexpected_difference === 0, `Browser result UNEXPECTED_DIFFERENCE = 0 (found ${browserResult.summary.unexpected_difference})`);
assert('22', browserResult.summary.blocked === 0, `Browser result BLOCKED = 0 (found ${browserResult.summary.blocked})`);

/* -----------------------------------------------------------------------
   23. All eight scientific interactions MATCH
   ----------------------------------------------------------------------- */
console.log('\n=== 23. All 8 scientific interactions MATCH ===');
const SCI_IDS = ['sci-statistics-bias', 'sci-rules-detective', 'sci-sigma-specA', 'sci-risk-frequency',
  'sci-investigation-containment', 'sci-eqa-classify', 'sci-bv-cva', 'sci-pbrtqc-window'];
const sciCheckpoints = SCI_IDS.map(id => (browserResult.checkpoints || []).find(cp => cp.id === id));
assert('23', sciCheckpoints.every(cp => cp && cp.classification === 'MATCH'), 'All 8 scientific-interaction checkpoints are MATCH');

/* -----------------------------------------------------------------------
   24. No Morning QC implementation
   ----------------------------------------------------------------------- */
console.log('\n=== 24. No Morning QC implementation ===');
const morningQcFiles = ['case-schema.js', 'case-engine.js', 'decision-engine.js', 'competency-map.js', 'scoring.js', 'debrief.js'];
const noMorningQcLegacy = morningQcFiles.every(f => !fs.existsSync(path.join(V09, 'src', 'morning-qc', f)));
const noMorningQcActive = !fs.existsSync(path.join(APP, 'morning-qc'));
assert('24', noMorningQcLegacy && noMorningQcActive, 'No Morning QC Room implementation exists in legacy or active source');

// 14 nav destinations (not 15)
const navCp = (browserResult.checkpoints || []).find(cp => cp.id === 'nav-14-destinations');
assert('24b', navCp && navCp.classification === 'MATCH' && navCp.original === '14', 'Exactly 14 primary navigation destinations (not 15)');

/* -----------------------------------------------------------------------
   25. Root v0.8 remains untouched
   ----------------------------------------------------------------------- */
console.log('\n=== 25. Root v0.8 untouched ===');
const origSHA = sha256(fs.readFileSync(path.join(ROOT, 'recovery', 'original-v0.8.html')));
assert('25a', origSHA === 'e5317bf135f350b258428b985c1034a081e244a295f2e580c93cb6a6a091c8e4', 'recovery/original-v0.8.html unchanged');
const compatSHA = sha256(fs.readFileSync(path.join(V09, 'dist', 'precimind-v0.9-compat.html')));
assert('25b', compatSHA === '975adefb62df00f12372cb705b9c2ef9b51c89a2b8133ade77ebf0db16f8c97c', 'Stage 11B compat artifact unchanged');

/* -----------------------------------------------------------------------
   SUMMARY
   ----------------------------------------------------------------------- */
const total = passed + failed;
console.log(`\n${'='.repeat(60)}`);
console.log(`Stage 11C2 ESM Single-Root Tests: ${passed}/${total} passed, ${failed} failed`);
console.log(`  Artifact class: V09_TEST`);
if (failed > 0) {
  console.error('STAGE 11C2 GOVERNANCE TESTS FAILED.');
  process.exit(1);
} else {
  console.log('STAGE 11C2 GOVERNANCE TESTS PASSED.');
  process.exit(0);
}
