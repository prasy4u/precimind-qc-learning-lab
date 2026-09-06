/* =========================================================================
   v09/tests/stage11c1-vite-bridge.test.js

   Stage 11C1: Unified Vite Build Bridge + Migration Graph governance tests.

   ARTIFACT PROVENANCE: V09_TEST
   Run: node v09/tests/stage11c1-vite-bridge.test.js
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
const V09  = path.join(__dirname, '..');

function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }

/* -----------------------------------------------------------------------
   1-2. Node/npm versions recorded
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 1-2: Environment ===');
let nodeVersion = process.version;
let npmVersion = '';
try { npmVersion = execSync('npm --version', { cwd: V09 }).toString().trim(); } catch (e) { npmVersion = 'ERROR'; }
assert('1', !!nodeVersion, `Node version recorded: ${nodeVersion}`);
assert('2', !!npmVersion && npmVersion !== 'ERROR', `npm version recorded: ${npmVersion}`);

/* -----------------------------------------------------------------------
   3-6. Package.json, lockfile, vite config, index.html exist
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 3-6: Toolchain files ===');
assert('3', fs.existsSync(path.join(V09, 'package.json')), 'v09/package.json exists');
assert('4', fs.existsSync(path.join(V09, 'package-lock.json')), 'v09/package-lock.json exists');
const viteConfigExists = fs.existsSync(path.join(V09, 'vite.config.js')) || fs.existsSync(path.join(V09, 'vite.config.mjs'));
assert('5', viteConfigExists, 'v09/vite.config.(js|mjs) exists');
assert('6', fs.existsSync(path.join(V09, 'index.html')), 'v09/index.html exists');

/* -----------------------------------------------------------------------
   7-11. Exact installed dependency versions
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 7-11: Installed dependency versions ===');
const pkg = JSON.parse(fs.readFileSync(path.join(V09, 'package.json'), 'utf8'));
let reactVer = null, reactDomVer = null, viteVer = null, pluginReactVer = null;
try { reactVer = JSON.parse(fs.readFileSync(path.join(V09, 'node_modules/react/package.json'), 'utf8')).version; } catch (e) {}
try { reactDomVer = JSON.parse(fs.readFileSync(path.join(V09, 'node_modules/react-dom/package.json'), 'utf8')).version; } catch (e) {}
try { viteVer = JSON.parse(fs.readFileSync(path.join(V09, 'node_modules/vite/package.json'), 'utf8')).version; } catch (e) {}
try { pluginReactVer = JSON.parse(fs.readFileSync(path.join(V09, 'node_modules/@vitejs/plugin-react/package.json'), 'utf8')).version; } catch (e) {}

assert('7', !!reactVer && !!reactDomVer && !!viteVer && !!pluginReactVer,
  `Exact installed versions derivable: react=${reactVer} react-dom=${reactDomVer} vite=${viteVer} @vitejs/plugin-react=${pluginReactVer}`);
assert('8', !!reactVer, `React dependency exists (${reactVer})`);
assert('9', !!reactDomVer, `ReactDOM dependency exists (${reactDomVer})`);
assert('10', !!viteVer, `Vite dependency exists (${viteVer})`);
assert('11', !!pluginReactVer, `Official React Vite plugin exists (${pluginReactVer})`);

/* -----------------------------------------------------------------------
   12-13. Bridge generator exists and fails closed on drift
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 12-13: Bridge generator ===');
const generatorPath = path.join(V09, 'tools', 'generate-vite-bridge.cjs');
assert('12', fs.existsSync(generatorPath), 'Bridge generator exists (v09/tools/generate-vite-bridge.cjs)');
const generatorSrc = fs.readFileSync(generatorPath, 'utf8');
assert('13', generatorSrc.includes('Unexpected SHA drift') && /process\.exit\(1\)/.test(generatorSrc),
  'Bridge generator performs fail-closed SHA validation (exits non-zero on drift)');

/* -----------------------------------------------------------------------
   14-17. Manifest / generated bridge module count, order, mount calls
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 14-17: Module count, order, mount preservation ===');
const manifestPath = path.join(V09, 'tools', 'v09-source-order.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
assert('14', Array.isArray(manifest.application_modules) && manifest.application_modules.length === 34,
  `Source manifest contains exactly 34 application modules (found ${manifest.application_modules.length})`);

const bridgeEntryPath = path.join(V09, 'app-bridge', 'bridge-entry.generated.jsx');
assert('15a', fs.existsSync(bridgeEntryPath), 'Generated bridge entry file exists');
const bridgeSrc = fs.existsSync(bridgeEntryPath) ? fs.readFileSync(bridgeEntryPath, 'utf8') : '';

// Verify every manifest module's first line appears in the bridge, in order
let allModulesPresent = true;
let prevPos = -1;
let orderPreserved = true;
for (const mod of manifest.application_modules) {
  const modContent = fs.readFileSync(path.join(V09, mod.path), 'utf8');
  const fingerprint = modContent.substring(5, 205); // skip identical block-comment delimiters
  const pos = bridgeSrc.indexOf(fingerprint);
  if (pos === -1) allModulesPresent = false;
  if (pos !== -1 && pos <= prevPos) orderPreserved = false;
  if (pos !== -1) prevPos = pos;
}
assert('15', allModulesPresent, 'Generated bridge uses exactly the 34 manifest application modules');
assert('16', orderPreserved, 'Accepted dependency/source order is preserved in the generated bridge');

const bridgeMountCount = (bridgeSrc.match(/ReactDOM\.createRoot\(/g) || []).length;
assert('17', bridgeMountCount === 19, `Generated bridge preserves exactly 19 mount calls (found ${bridgeMountCount})`);

/* -----------------------------------------------------------------------
   18-23. Frozen Stage 11B files unchanged
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 18-23: Frozen Stage 11B file integrity ===');

function dirIsUnchangedSince(relDir, baseRef) {
  try {
    const out = execSync(`git diff ${baseRef} --name-only -- ${relDir}`, { cwd: ROOT }).toString().trim();
    return out.length === 0;
  } catch (e) { return false; }
}

const BASE_REF = 'ba9d4d0';
assert('18', dirIsUnchangedSince('v09/src', BASE_REF), 'Frozen v09/src/** unchanged since ba9d4d0');
assert('19', dirIsUnchangedSince('v09/tools/assemble-v09-compat.js', BASE_REF), 'Frozen v09/tools/assemble-v09-compat.js unchanged since ba9d4d0');
assert('20', dirIsUnchangedSince('v09/tools/v09-source-order.json', BASE_REF), 'Frozen v09/tools/v09-source-order.json unchanged since ba9d4d0');
assert('21', dirIsUnchangedSince('v09/dist/precimind-v0.9-compat.html', BASE_REF), 'Frozen v09/dist/precimind-v0.9-compat.html unchanged since ba9d4d0');
assert('22', dirIsUnchangedSince('v09/tests/browser/v09-accessibility-result.json', BASE_REF), 'Frozen v09/tests/browser/v09-accessibility-result.json unchanged since ba9d4d0');

const compatSha = sha256(fs.readFileSync(path.join(V09, 'dist', 'precimind-v0.9-compat.html')));
assert('23', compatSha === '975adefb62df00f12372cb705b9c2ef9b51c89a2b8133ade77ebf0db16f8c97c',
  `Stage 11B compatibility SHA remains exactly 975adef... (found ${compatSha.substring(0,16)}...)`);

/* -----------------------------------------------------------------------
   24-27. No runtime Babel, no historical envelope in Vite HTML
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 24-27: Vite bridge output cleanliness ===');
const bridgeDistDir = path.join(V09, 'dist-vite-bridge');
const bridgeIndexPath = path.join(bridgeDistDir, 'index.html');
assert('28pre', fs.existsSync(bridgeDistDir), 'Vite bridge build output directory exists (dist-vite-bridge)');

let bridgeIndexHtml = '';
let allBuiltJs = '';
if (fs.existsSync(bridgeIndexPath)) {
  bridgeIndexHtml = fs.readFileSync(bridgeIndexPath, 'utf8');
  const assetsDir = path.join(bridgeDistDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    for (const f of fs.readdirSync(assetsDir)) {
      if (f.endsWith('.js')) allBuiltJs += fs.readFileSync(path.join(assetsDir, f), 'utf8');
    }
  }
}
assert('24', !allBuiltJs.includes('Babel.transform'), 'Vite bridge runtime does not use Babel.transform');
assert('25', !bridgeIndexHtml.includes('type="text/plain"') && !bridgeIndexHtml.includes("type='text/plain'"),
  'Vite HTML contains no app-source text/plain payload');
assert('26', !bridgeIndexHtml.includes('(function(){') || !bridgeIndexHtml.includes('Babel.transform'),
  'Vite HTML does not embed the historical runtime bootstrap source');
assert('27', !bridgeIndexHtml.includes('React.createElement') || !bridgeIndexHtml.includes('@license React'),
  'Vite HTML does not embed historical React/ReactDOM vendor payloads directly in the HTML');

/* -----------------------------------------------------------------------
   28. Build output separate from Stage 11B dist
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 28: Separate build output ===');
assert('28', bridgeDistDir !== path.join(V09, 'dist') && fs.existsSync(bridgeDistDir),
  'Bridge build output (dist-vite-bridge) is separate from Stage 11B dist/');

/* -----------------------------------------------------------------------
   29-31. Build-tree hash + reproducibility
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 29-31: Deterministic build-tree hash + reproducibility ===');
const hashToolPath = path.join(V09, 'tools', 'hash-build-tree.cjs');
assert('29', fs.existsSync(hashToolPath), 'Deterministic build-tree hash utility exists');

const treeHashResultPath = path.join(V09, 'dist-vite-bridge.tree-hash.json');
let reproData = null;
if (fs.existsSync(treeHashResultPath)) {
  reproData = JSON.parse(fs.readFileSync(treeHashResultPath, 'utf8'));
}
assert('30pre', !!reproData && !!reproData.tree_hash_sha256, 'Build-tree hash evidence exists (tree_hash_sha256 recorded)');

const reproEvidencePath = path.join(V09, 'docs', 'stage11c1-reproducibility-evidence.json');
let reproEvidence = null;
if (fs.existsSync(reproEvidencePath)) reproEvidence = JSON.parse(fs.readFileSync(reproEvidencePath, 'utf8'));
assert('30', !!reproEvidence && reproEvidence.reproduction_a_sha === reproEvidence.reproduction_b_sha,
  'Repeated-build hashes match (Reproduction A === Reproduction B)');
assert('31', !!reproEvidence && (reproEvidence.npm_ci_sha === reproEvidence.reproduction_a_sha),
  `Clean npm ci reproduction status recorded and genuine (npm_ci_status=${reproEvidence?.npm_ci_status})`);

/* -----------------------------------------------------------------------
   32-35. Dependency graph
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 32-35: Dependency graph ===');
const depGraphPath = path.join(V09, 'docs', 'v09-module-dependency-graph.json');
assert('32', fs.existsSync(depGraphPath), 'Dependency graph JSON exists');
const depGraph = JSON.parse(fs.readFileSync(depGraphPath, 'utf8'));
assert('33', Array.isArray(depGraph.modules) && depGraph.modules.length === 34,
  `Dependency graph covers exactly 34 application modules (found ${depGraph.modules.length})`);

const REQUIRED_FIELDS = ['path', 'order', 'defines', 'consumes', 'react_dependencies', 'scientific_dependencies',
  'ui_dependencies', 'proposed_stage11c2_exports', 'proposed_stage11c2_imports', 'migration_risk', 'migration_notes'];
const allFieldsPresent = depGraph.modules.every(m => REQUIRED_FIELDS.every(f => f in m));
assert('34', allFieldsPresent, 'All mandatory graph fields are present on every module entry');

const depGraphDocPath = path.join(V09, 'docs', 'V09_MODULE_DEPENDENCY_GRAPH.md');
assert('35', fs.existsSync(depGraphDocPath) && fs.statSync(depGraphDocPath).size > 1000,
  'Human-readable dependency graph document exists and is substantial');

/* -----------------------------------------------------------------------
   36-39. Browser equivalence
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 36-39: Browser equivalence ===');
const browserResultPath = path.join(V09, 'tests', 'browser', 'v09-vite-bridge-equivalence-result.json');
assert('36', fs.existsSync(browserResultPath), 'Browser-equivalence result exists');
const browserResult = fs.existsSync(browserResultPath) ? JSON.parse(fs.readFileSync(browserResultPath, 'utf8')) : { summary: {} };
assert('37', browserResult.summary.unexpected_difference === 0,
  `Browser result has zero unexpected differences (found ${browserResult.summary.unexpected_difference})`);
assert('38', browserResult.summary.blocked === 0,
  `Browser result has zero blocked checkpoints (found ${browserResult.summary.blocked})`);

const ruleCheckpoints = (browserResult.checkpoints || []).filter(cp => cp.id.startsWith('rule-') || cp.id.startsWith('lj-') || cp.id.startsWith('eqa-'));
const allAccessibilityMatch = ruleCheckpoints.length > 0 && ruleCheckpoints.every(cp => cp.classification === 'MATCH');
assert('39', allAccessibilityMatch, `Stage 11B accessibility interactions are MATCH in the bridge comparison (${ruleCheckpoints.length} checkpoints)`);

/* -----------------------------------------------------------------------
   40-42. No Morning QC Room, no single-root conversion, 19 mounts remain
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 40-42: Scope boundaries respected ===');
const morningQcFiles = ['case-schema.js', 'case-engine.js', 'decision-engine.js', 'competency-map.js', 'scoring.js', 'debrief.js'];
const noMorningQc = morningQcFiles.every(f => !fs.existsSync(path.join(V09, 'src', 'morning-qc', f)));
assert('40', noMorningQc, 'No Morning QC Room implementation has been introduced');

const appShellSrc = fs.readFileSync(path.join(V09, 'src', 'ui', 'app-shell.jsx'), 'utf8');
const appShellMountCount = (appShellSrc.match(/ReactDOM\.createRoot\(/g) || []).length;
assert('41', appShellMountCount === 19, `No Stage 11C2 single-root conversion has occurred (frozen app-shell.jsx still has ${appShellMountCount} mounts)`);
assert('42', bridgeMountCount === 19, `Exactly 19 historical mounts remain in the Stage 11C1 bridge (found ${bridgeMountCount})`);

/* -----------------------------------------------------------------------
   SUMMARY
   ----------------------------------------------------------------------- */
const total = passed + failed;
console.log(`\n${'='.repeat(60)}`);
console.log(`Stage 11C1 Vite Bridge Tests: ${passed}/${total} passed, ${failed} failed`);
console.log(`  Artifact class: V09_TEST`);
console.log(`  Node: ${nodeVersion} | npm: ${npmVersion}`);
console.log(`  react=${reactVer} react-dom=${reactDomVer} vite=${viteVer} @vitejs/plugin-react=${pluginReactVer}`);
if (failed > 0) {
  console.error('STAGE 11C1 VITE BRIDGE TESTS FAILED.');
  process.exit(1);
} else {
  console.log('STAGE 11C1 VITE BRIDGE TESTS PASSED.');
  process.exit(0);
}
