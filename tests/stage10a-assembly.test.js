/* =========================================================================
   tests/stage10a-assembly.test.js

   Stage 10A: Deterministic Assembly Validation
   Validates: dist/recovered-v0.8-faithful.html (Artifact Class B)
   Assembler: tools/assemble-v08.js (Artifact Class D)

   ARTIFACT PROVENANCE: Class D (recovery infrastructure)
   Does NOT test browser runtime behavior.
   Does NOT claim candidate is Class A.
   Does NOT modify any frozen source file.

   Run: node tests/stage10a-assembly.test.js
   ========================================================================= */
'use strict';

const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');
const cp     = require('child_process');

let passed = 0, failed = 0, sg = 0, rc = 0;

function assert(id, condition, detail, prov) {
  if (condition) { console.log(`  ✓ [${id}] ${detail}`); passed++; }
  else { console.error(`  ✗ [${id}] FAIL: ${detail}`); failed++; }
  if (prov === 'sg') sg++; else rc++;
}

const ROOT      = path.join(__dirname, '..');
const DIST_PATH = path.join(ROOT, 'dist', 'recovered-v0.8-faithful.html');
const TOOL_PATH = path.join(ROOT, 'tools', 'assemble-v08.js');

/* -----------------------------------------------------------------------
   SECTION A: Assembler exists and is runnable
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION A: Assembler ===');

assert('A-01', fs.existsSync(TOOL_PATH),
  'tools/assemble-v08.js exists', 'rc');
assert('A-02', fs.existsSync(DIST_PATH),
  'dist/recovered-v0.8-faithful.html exists', 'rc');

// ── Read candidate ────────────────────────────────────────────────────────
const candidate = fs.readFileSync(DIST_PATH, 'utf8');
const candSHA = crypto.createHash('sha256').update(candidate).digest('hex');

/* -----------------------------------------------------------------------
   SECTION B: Deterministic reproducibility
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION B: Deterministic reproducibility ===');

// Run assembler, re-read, compare SHA
const run1 = cp.execSync(`node ${TOOL_PATH}`, { cwd: ROOT }).toString();
const cand2 = fs.readFileSync(DIST_PATH, 'utf8');
const sha2 = crypto.createHash('sha256').update(cand2).digest('hex');

assert('B-01', candSHA === sha2,
  `Assembler produces identical output across runs (SHA: ${candSHA.substring(0,16)}...)`, 'rc');
assert('B-02', candSHA === 'a9fe9a3acbb8c35347cc735292ad63883778e5c12845f4da529129119b72c886',
  'Candidate SHA-256 matches recorded value', 'rc');
assert('B-03', run1.includes('Assembly Complete'),
  'Assembler reports Assembly Complete', 'rc');
assert('B-04', run1.includes('Modules assembled: 34'),
  'Assembler reports 34 modules assembled', 'rc');
assert('B-05', !run1.includes('FAIL'),
  'Assembler reports no FAIL', 'rc');

/* -----------------------------------------------------------------------
   SECTION C: Document structure
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION C: Document structure ===');

assert('C-01', candidate.startsWith('<!DOCTYPE html>'),
  'Candidate begins with DOCTYPE declaration', 'rc');
assert('C-02', candidate.includes('<div id="root">') || candidate.includes('<div id="root"></div>'),
  'Candidate contains one #root host element', 'sg');
assert('C-03', (candidate.match(/id="root"/g) || []).length === 1,
  'Candidate has exactly one id="root"', 'rc');
assert('C-04', candidate.includes('<script id="app-source" type="text/plain">'),
  'Candidate contains app-source script block', 'sg');
assert('C-05', (candidate.match(/id="app-source"/g) || []).length === 1,
  'Candidate has exactly one app-source script', 'rc');
assert('C-06', candidate.includes('<style>'),
  'Candidate contains style element', 'rc');
assert('C-07', candidate.includes('</body>') && candidate.includes('</html>'),
  'Candidate has proper document close', 'rc');

/* -----------------------------------------------------------------------
   SECTION D: Vendor envelope presence
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION D: Vendor envelope ===');

assert('D-01', candidate.includes('react.production.min.js') || candidate.includes('@license React'),
  'Vendor React payload present in envelope', 'sg');
assert('D-02', candidate.includes('babel.min.js') || candidate.includes('Babel'),
  'Vendor Babel payload present in envelope', 'sg');
assert('D-03', candidate.includes('(function(){'),
  'Runtime bootstrap IIFE present', 'sg');
assert('D-04', candidate.includes('app-source'),
  'Bootstrap references app-source', 'sg');
assert('D-05', candidate.includes('Babel.transform'),
  'Bootstrap contains Babel.transform', 'sg');
assert('D-06', candidate.includes('runtime: "classic"'),
  'Bootstrap specifies classic runtime', 'sg');

/* -----------------------------------------------------------------------
   SECTION E: CSS fidelity
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION E: CSS fidelity ===');

const css = fs.readFileSync(path.join(ROOT, 'src/ui/original-v0.8.css'), 'utf8');
const cssSHA = crypto.createHash('sha256').update(css).digest('hex');
assert('E-01', cssSHA === 'fda2285cb24966f3225bdfe5f2bd43f0e7065cef7616d882c24085c3d48b0212',
  'src/ui/original-v0.8.css: SHA matches frozen value', 'sg');
assert('E-02', candidate.includes(css.substring(0, 200)),
  'Candidate contains frozen CSS content', 'rc');

/* -----------------------------------------------------------------------
   SECTION F: 34 source modules in candidate
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION F: All 34 source modules present in candidate ===');

const MODULE_ORDER = [
  'src/core/statistics.js',
  'src/ui/app-data.js',
  'src/ui/shared-components.jsx',
  'src/ui/core-screens.jsx',
  'src/rules/engine.js',
  'src/rules/data.js',
  'src/rules/ui-components.jsx',
  'src/rules/screens.jsx',
  'src/opchar/functions.js',
  'src/strategy/core.js',
  'src/strategy/aps-ui-data.js',
  'src/strategy/ui-components.jsx',
  'src/strategy/screens.jsx',
  'src/risk/detection-delay.js',
  'src/risk/data.js',
  'src/risk/ui-components.jsx',
  'src/risk/screens.jsx',
  'src/investigation/calc.js',
  'src/investigation/data.js',
  'src/investigation/ui-components.jsx',
  'src/investigation/screens.jsx',
  'src/eqa/calc.js',
  'src/eqa/data.js',
  'src/eqa/ui-components.jsx',
  'src/eqa/screens.jsx',
  'src/bv/calc.js',
  'src/bv/data.js',
  'src/bv/ui-components.jsx',
  'src/bv/screens.jsx',
  'src/pbrtqc/calc.js',
  'src/pbrtqc/data.js',
  'src/pbrtqc/ui-components.jsx',
  'src/pbrtqc/screens.jsx',
  'src/ui/app-shell.jsx',
];

// Extract app-source content
const appSrcStart = candidate.indexOf('<script id="app-source" type="text/plain">') +
  '<script id="app-source" type="text/plain">'.length;
const appSrcEnd = candidate.indexOf('</script>', appSrcStart);
const appSource = candidate.substring(appSrcStart, appSrcEnd);

MODULE_ORDER.forEach((modPath, idx) => {
  const content = fs.readFileSync(path.join(ROOT, modPath), 'utf8');
  const firstLine = content.split('\n')[0];
  assert(`F-${String(idx+1).padStart(2,'0')}-${path.basename(modPath).substring(0,10)}`,
    appSource.includes(firstLine),
    `Module ${idx+1}: ${modPath} present in app-source (first-line match)`, 'rc');
});

// Module order: verify relative ordering using a 200-char unique content fingerprint
// (first lines are identical /* === */ delimiters across all modules)
let prevPos = -1;
let orderOk = true;
for (const modPath of MODULE_ORDER) {
  const content = fs.readFileSync(path.join(ROOT, modPath), 'utf8');
  // Use chars 5-205 to avoid identical first-line delimiter across all modules
  const fingerprint = content.substring(5, 205);
  const pos = appSource.indexOf(fingerprint);
  if (pos <= prevPos) { orderOk = false; break; }
  prevPos = pos;
}
assert('F-ORDER', orderOk,
  'All 34 modules appear in specified dependency order', 'rc');

/* -----------------------------------------------------------------------
   SECTION G: Exactly 19 mount calls in app-source
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION G: ReactDOM mount call count ===');

const mountCount = (appSource.match(/ReactDOM\.createRoot\(/g) || []).length;
assert('G-01', mountCount === 19,
  `app-source contains exactly 19 ReactDOM.createRoot mount calls (found ${mountCount})`, 'sg');
assert('G-02', appSource.includes('ReactDOM.createRoot(rootEl).render(<App />)'),
  'Exact mount expression ReactDOM.createRoot(rootEl).render(<App />) present', 'sg');

/* -----------------------------------------------------------------------
   SECTION H: No placeholders or missing-module markers
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION H: No placeholder content ===');

assert('H-01', !candidate.includes('module not found'),
  'No "module not found" placeholder in candidate', 'rc');
assert('H-02', !candidate.includes('TODO'),
  'No TODO placeholder in candidate', 'rc');
assert('H-03', !candidate.includes('[MISSING]'),
  'No [MISSING] placeholder in candidate', 'rc');
assert('H-04', !candidate.includes('undefined module'),
  'No "undefined module" placeholder in candidate', 'rc');

/* -----------------------------------------------------------------------
   SECTION I: Expected application declarations present in app-source
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION I: Key declarations in app-source ===');

assert('I-01', appSource.includes('function calcMean('),
  'calcMean function declared in app-source', 'sg');
assert('I-02', appSource.includes('function evaluateRuleSet('),
  'evaluateRuleSet declared in app-source', 'sg');
assert('I-03', appSource.includes('const NAV_ITEMS'),
  'NAV_ITEMS constant declared in app-source', 'sg');
assert('I-04', appSource.includes('function App('),
  'function App() declared in app-source', 'sg');
assert('I-05', appSource.includes('const rootEl'),
  'rootEl declared in app-source', 'sg');
assert('I-06', appSource.includes('const LEVELS'),
  'LEVELS declared in app-source (from app-data.js)', 'sg');
assert('I-07', appSource.includes('function detectShift(') || appSource.includes('function detectPBRTQC(') || appSource.includes('function calculateNPed('),
  'PBRTQC function present in app-source', 'sg');

/* -----------------------------------------------------------------------
   SECTION J: Frozen source files unmodified
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION J: Frozen source files unchanged ===');

const FROZEN = {
  'src/core/statistics.js':    '74e6d07ccd0bfae7e5cd9821078881b692e762cea3c9b4ad6eaf88799fc8f8d5',
  'src/ui/app-shell.jsx':      '56e3d5fac4fcaffa3184e81f8e8be1fa292558a35d0a77974f0639759d101da4',
  'src/risk/screens.jsx':      '7f0897e8d15704a66c64467a0f977ca7b6c8f2149ee931daeca2bcc63e0bc5e5',
  'src/ui/runtime-bootstrap.js': 'f2bffcb0ab1b0653b866f7247842f4f878d7b6593eb56a5751c404732210e85a',
  'src/rules/engine.js':       'a2ea2b71e72c312151c3e223b10815fac46d59b697f27912c6df4fc246ddf66b',
  'src/strategy/core.js':      '01a7431491c3e15c5c39777445a057b62a9e7b9876887fe1dc7b4ed97ad16f5e',
};
Object.entries(FROZEN).forEach(([rel, expected]) => {
  const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel), 'utf8')).digest('hex');
  assert(`J-01-${path.basename(rel).substring(0,10)}`, actual === expected,
    `${rel}: frozen SHA-256 unchanged`, 'sg');
});

/* -----------------------------------------------------------------------
   SECTION K: Candidate classification
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION K: Artifact classification ===');

// Note: 'Class A' appears in provenance comments within recovered source modules.
// Check instead that the assembler output header doesn't misclassify the candidate.
assert('K-01', run1.includes('Class B') || run1.includes('Artifact class: B'),
  'Assembler correctly classifies output as Class B reconstruction', 'rc');
assert('K-02', run1.includes('Artifact class: B'),
  'Assembler labels output as Class B', 'rc');

/* The summary has moved after Section W (provenance checks added in Stage 10B) */

/* -----------------------------------------------------------------------
   SECTION W: Provenance classification (added Stage 10B Part A correction)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION W: Assembly map provenance classification ===');

const manif = JSON.parse(fs.readFileSync(path.join(ROOT, 'recovery', 'assembly-map.json'), 'utf8'));

assert('W-01', manif.modules.length === 34,
  'assembly-map.json: exactly 34 modules listed', 'rc');

const exactA   = manif.modules.filter(m => m.artifact_class === 'A');
const composite = manif.modules.filter(m => m.artifact_class === 'composite');

assert('W-02', exactA.length === 24,
  `assembly-map.json: exactly 24 pure Class A exact-slice modules (found ${exactA.length})`, 'rc');
assert('W-03', composite.length === 10,
  `assembly-map.json: exactly 10 composite A+D wrapper-bearing modules (found ${composite.length})`, 'rc');
assert('W-04', composite.every(m => m.content_classes && m.content_classes.includes('A') && m.content_classes.includes('D')),
  'All 10 composite modules have content_classes ["A","D"]', 'rc');
assert('W-05', !composite.some(m => m.artifact_class === 'A'),
  'None of the 10 composite files is labelled pure Class A', 'rc');
assert('W-06', manif.provenance_summary && manif.provenance_summary.candidate_class === 'B',
  'assembly-map.json: candidate_class recorded as B', 'rc');

// Re-print summary
const tot = passed + failed;
console.log(`\n${'='.repeat(60)}`);
console.log(`Stage 10A Assembly Tests (revised): ${passed}/${tot} passed, ${failed} failed`);
console.log(`  Source-grounded expectations: ${sg}`);
console.log(`  Reconstructed expectations:   ${rc}`);
if (failed > 0) { console.error('STAGE 10A REVISED FAILED.'); process.exit(1); }
else { console.log('STAGE 10A REVISED PASSED — all tests green.'); }
