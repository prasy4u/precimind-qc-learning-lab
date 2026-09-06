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
   AUDIT CORRECTIVE CLOSURE ASSERTIONS (Sections A-F per audit prompt)
   ----------------------------------------------------------------------- */
console.log('\n=== AUDIT CORRECTIVE CLOSURE: genuine scientific interactions ===');

// A. Browser result contains genuine state-changing scientific-interaction
//    checkpoints for all 8 required domain groups, with evidence of an
//    actual before/after state change — not merely checkpoint-ID presence.
const REQUIRED_SCI_DOMAINS = [
  'sci-statistics-bias', 'sci-rules-detective', 'sci-sigma-specA', 'sci-risk-frequency',
  'sci-investigation-containment', 'sci-eqa-classify', 'sci-bv-cva', 'sci-pbrtqc-window',
];
const sciCheckpoints = REQUIRED_SCI_DOMAINS.map(id => (browserResult.checkpoints || []).find(cp => cp.id === id));
const allSciPresent = sciCheckpoints.every(cp => !!cp);
assert('AUDIT-A-01', allSciPresent, `All 8 required scientific-interaction domain checkpoints present (${REQUIRED_SCI_DOMAINS.join(', ')})`);

// Verify each records genuine changed=true evidence in BOTH original and candidate
// (not just that the ID exists) — parsing the "before=X|after=Y|changed=Z" format.
function parseChanged(evidenceStr) {
  const m = /changed=(true|false)/.exec(evidenceStr || '');
  return m ? m[1] === 'true' : null;
}
let allGenuinelyChanged = true;
for (const cp of sciCheckpoints) {
  if (!cp) { allGenuinelyChanged = false; continue; }
  const oChanged = parseChanged(cp.original);
  const cChanged = parseChanged(cp.candidate);
  if (oChanged !== true || cChanged !== true) allGenuinelyChanged = false;
}
assert('AUDIT-A-02', allGenuinelyChanged,
  'Every scientific-interaction checkpoint records changed=true in BOTH original and candidate evidence strings (genuine state change demonstrated on both sides, not a hollow no-op comparison)');

// B. All 8 scientific-interaction checkpoints are MATCH.
const allSciMatch = sciCheckpoints.every(cp => cp && cp.classification === 'MATCH');
assert('AUDIT-B-01', allSciMatch, 'All 8 scientific-interaction checkpoints are classified MATCH');

// C. Application console errors are correctly classified and zero in candidate.
const consoleAppErrCp = (browserResult.checkpoints || []).find(cp => cp.id === 'startup-console-application-errors');
assert('AUDIT-C-01', !!consoleAppErrCp, 'Console application-error checkpoint exists (post infrastructure-noise classification)');
assert('AUDIT-C-02', consoleAppErrCp && consoleAppErrCp.candidate.includes('changed=') === false && /before=0\|after=0/.test(consoleAppErrCp.candidate) === false,
  'Console application-error checkpoint uses direct count evidence (not the runInteraction before/after format, which does not apply here)');
// Candidate application error count must be zero: candidate field looks like "0"
assert('AUDIT-C-03', consoleAppErrCp && consoleAppErrCp.candidate === '0',
  `Candidate application console errors are zero (found "${consoleAppErrCp?.candidate}")`);
const harnessNoiseCp = (browserResult.checkpoints || []).find(cp => cp.id === 'startup-console-harness-noise');
assert('AUDIT-C-04', !!harnessNoiseCp && !/(?<!NOT )HTTP 403|is a?n? 403|= ?403\b/i.test(harnessNoiseCp.notes.replace(/NOT HTTP 403/gi, '')),
  'Harness-noise checkpoint does not affirmatively claim HTTP 403 as fact (may correctly state "NOT HTTP 403")');
assert('AUDIT-C-05', !!harnessNoiseCp && harnessNoiseCp.notes.includes('requestfailed'),
  'Harness-noise checkpoint cites the actual requestfailed event evidence used to classify the error');

console.log('\n=== AUDIT CORRECTIVE CLOSURE: dependency-graph documentation accuracy ===');

// D. Dependency graph / human documentation no longer claims a prior 19->1
//    experiment proved equivalence.
const depGraphDoc = fs.readFileSync(depGraphDocPath, 'utf8');
const hasFalseClaimAsFact = /Stage 10A.{0,10}10D.{0,30}prov(ed|es)/i.test(depGraphDoc) &&
  !/(incorrectly|previously and incorrectly|no such experiment)/i.test(depGraphDoc.substring(Math.max(0, depGraphDoc.search(/Stage 10A.{0,10}10D.{0,30}prov(ed|es)/i) - 200), depGraphDoc.search(/Stage 10A.{0,10}10D.{0,30}prov(ed|es)/i) + 400));
assert('AUDIT-D-01', !hasFalseClaimAsFact,
  'Dependency graph document does not assert the 19->1 "proof" claim as current fact (a quoted retraction citing it as a past error is acceptable and present)');
assert('AUDIT-D-02', depGraphDoc.includes('NOT further instrumented') || depGraphDoc.includes('not further instrumented'),
  'Dependency graph document accurately states internal React-root disposition was not further instrumented');
assert('AUDIT-D-03', depGraphDoc.includes('NOT pre-proven') || depGraphDoc.includes('not pre-proven') || depGraphDoc.includes('NOT pre-proven behaviorally'),
  'Dependency graph document accurately states 19->1 is a target, not a pre-proven equivalence');

// E. Direct shared-components consumer counts and implicit-hook consumer
//    counts are internally consistent with the machine-readable dependency data.
const depGraphJson = JSON.parse(fs.readFileSync(depGraphPath, 'utf8'));
const directConsumers = depGraphJson.modules.filter(m => (m.consumes_modules || []).includes('src/ui/shared-components.jsx'));
const implicitConsumers = depGraphJson.modules.filter(m => (m.react_dependencies || []).some(r => r.includes('implicit-global') || r.includes('implicit hook global') || r.includes('IMPLICIT')));
assert('AUDIT-E-01', directConsumers.length === 13,
  `Machine graph: exactly 13 direct shared-components.jsx consumers (found ${directConsumers.length})`);
// The corrected shared-components.jsx entry itself now documents the counts in prose;
// verify the human doc's stated numbers match these machine-derived values.
assert('AUDIT-E-02', depGraphDoc.includes('**13**') && depGraphDoc.includes('**12**') && depGraphDoc.includes('**9**') && depGraphDoc.includes('**16**'),
  'Human-readable document states the 13/12/9/16 counts matching the machine-readable graph');

// F. shared-components.jsx proposed exports do not include React hooks.
const sharedComponentsEntry = depGraphJson.modules.find(m => m.path === 'src/ui/shared-components.jsx');
const REACT_HOOK_NAMES = ['useState', 'useMemo', 'useRef', 'useEffect'];
const exportsIncludeHooks = REACT_HOOK_NAMES.some(h => (sharedComponentsEntry?.proposed_stage11c2_exports || []).includes(h));
assert('AUDIT-F-01', !exportsIncludeHooks,
  'shared-components.jsx proposed_stage11c2_exports does NOT include React hook names (useState/useMemo/useRef/useEffect)');
const importsIncludeReactHooks = (sharedComponentsEntry?.proposed_stage11c2_imports || []).some(imp => imp.from === 'react' && REACT_HOOK_NAMES.every(h => imp.names.includes(h)));
assert('AUDIT-F-02', importsIncludeReactHooks,
  'shared-components.jsx proposed_stage11c2_imports correctly includes importing the 4 hooks from "react"');

console.log('\n=== AUDIT CORRECTIVE CLOSURE: migration-risk consistency ===');
assert('AUDIT-G-01', sharedComponentsEntry && sharedComponentsEntry.migration_risk === 'MODERATE',
  `shared-components.jsx migration_risk is MODERATE (reclassified from LOW) (found ${sharedComponentsEntry?.migration_risk})`);
const riskCounts = { LOW: 0, MODERATE: 0, HIGH: 0 };
depGraphJson.modules.forEach(m => { if (riskCounts[m.migration_risk] !== undefined) riskCounts[m.migration_risk]++; });
assert('AUDIT-G-02', riskCounts.LOW === 22 && riskCounts.MODERATE === 11 && riskCounts.HIGH === 1,
  `Risk distribution updated to 22 LOW / 11 MODERATE / 1 HIGH (found ${riskCounts.LOW}/${riskCounts.MODERATE}/${riskCounts.HIGH})`);

console.log('\n=== AUDIT CORRECTIVE CLOSURE: accepted bridge infrastructure untouched ===');
const acceptedTreeHash = 'c0407262fae35c913ec802740f27c37289e31038de9ad4cd542bb803e61d2e65';
const reproEvidence2 = JSON.parse(fs.readFileSync(path.join(V09, 'docs', 'stage11c1-reproducibility-evidence.json'), 'utf8'));
assert('AUDIT-H-01', reproEvidence2.reproduction_a_sha === acceptedTreeHash,
  `Accepted build-tree hash unchanged after corrective closure (found ${reproEvidence2.reproduction_a_sha})`);
const indexHtmlContent = fs.readFileSync(path.join(V09, 'index.html'), 'utf8');
assert('AUDIT-H-02', !indexHtmlContent.includes('fonts.googleapis.com'),
  'v09/index.html left unchanged (no font <link> tags added) — accepted bridge build input not silently modified during this closure');

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
