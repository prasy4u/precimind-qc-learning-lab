/* =========================================================================
   tests/stage9j-app-shell.test.js

   NEW RECOVERY TESTS — Stage 9J (NOT the historical test suite)
   Tests for:
     src/ui/app-shell.jsx        (Class A, HTML lines 13888-14024)
     src/ui/runtime-bootstrap.js (Class A, HTML lines 14028-14034)

   ARTIFACT PROVENANCE: Class D (recovery infrastructure, not historical)

   TEST EXPECTATION PROVENANCE:
   SOURCE-GROUNDED (sg): exact NAV_ITEMS inventory, exact state defaults,
     exact progress keys, exact dispatch mappings, exact authored strings,
     exact ReactDOM mount count, exact bootstrap mechanism — directly from
     verified HTML source.
   RECONSTRUCTED (rc): source-fidelity byte comparisons, absence guards,
     no-duplication guards, block-completeness guards.

   Run: node tests/stage9j-app-shell.test.js
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

const SHELL_PATH = path.join(__dirname, '../src/ui/app-shell.jsx');
const BOOT_PATH  = path.join(__dirname, '../src/ui/runtime-bootstrap.js');
const HTML_PATH  = path.join(__dirname, '../recovery/original-v0.8.html');

const shell = fs.readFileSync(SHELL_PATH, 'utf8');
const boot  = fs.readFileSync(BOOT_PATH,  'utf8');
const html  = fs.readFileSync(HTML_PATH,  'utf8').split('\n');

/* -----------------------------------------------------------------------
   SECTION A: SOURCE-FIDELITY (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION A: Source-fidelity ===');

const shellAuth = html.slice(13887, 14024).join('\n') + '\n';
assert('A-SHELL', shellAuth === shell,
  'app-shell.jsx exactly matches HTML lines 13888-14024', 'rc');

const bootAuth = html.slice(14027, 14034).join('\n') + '\n';
assert('A-BOOT', bootAuth === boot,
  'runtime-bootstrap.js exactly matches HTML lines 14028-14034', 'rc');

/* -----------------------------------------------------------------------
   SECTION B: APP-SHELL BLOCK-COMPLETENESS GUARDS (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION B: App-shell block-completeness ===');

assert('B-01', shell.startsWith('/* ========================================================================='),
  'app-shell.jsx: begins with complete /* === opening delimiter', 'rc');
assert('B-02', shell.includes('========================================================================= */'),
  'app-shell.jsx: opening block comment has authored closing delimiter', 'rc');
assert('B-03', shell.includes('NAV_ITEMS'),
  'app-shell.jsx: contains NAV_ITEMS', 'sg');
assert('B-04', shell.includes('function App('),
  'app-shell.jsx: contains function App(', 'sg');
assert('B-05', shell.includes('document.getElementById("root")') || shell.includes("document.getElementById('root')"),
  'app-shell.jsx: contains rootEl lookup', 'sg');
assert('B-06', !shell.includes('</script>'),
  'app-shell.jsx: does NOT include </script>', 'rc');
assert('B-07', !shell.includes('<script>'),
  'app-shell.jsx: does NOT include <script>', 'rc');
assert('B-08', !shell.includes('Babel.transform'),
  'app-shell.jsx: does NOT include Babel.transform (bootstrap excluded)', 'rc');
assert('B-09', !shell.includes('(function(){'),
  'app-shell.jsx: does NOT include bootstrap IIFE', 'rc');

/* -----------------------------------------------------------------------
   SECTION C: BOOTSTRAP BLOCK-COMPLETENESS (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION C: Bootstrap block-completeness ===');

assert('C-01', boot.startsWith('(function(){'),
  'runtime-bootstrap.js: starts with (function(){', 'sg');
assert('C-02', boot.trimEnd().endsWith('})();'),
  'runtime-bootstrap.js: ends with })();', 'sg');
assert('C-03', !boot.includes('<script>'),
  'runtime-bootstrap.js: does NOT include <script> tag', 'rc');
assert('C-04', !boot.includes('</script>'),
  'runtime-bootstrap.js: does NOT include </script> tag', 'rc');
assert('C-05', boot.split('\n').filter(l => l.trim()).length === 7,
  'runtime-bootstrap.js: exactly 7 non-empty lines', 'sg');

/* -----------------------------------------------------------------------
   SECTION D: NAV_ITEMS EXACT INVENTORY (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION D: NAV_ITEMS exact 14-entry inventory ===');

const EXPECTED_NAV = [
  ['home',               'Home'],
  ['map',                'Competency Map'],
  ['stats',              'Statistics Playground'],
  ['lj',                 'LJ Laboratory'],
  ['pattern',            'Pattern Challenge'],
  ['rules',              'Rule Laboratory'],
  ['strategy',           'QC Strategy Lab'],
  ['sigma',              'Sigma Sandbox'],
  ['risk',               'Risk & Frequency Lab'],
  ['investigation',      'Investigation Lab'],
  ['external-assurance', 'External Assurance Lab'],
  ['bv-rcv',             'BV & RCV Lab'],
  ['pbrtqc',             'Patient Surveillance Lab'],
  ['evidence',           'Evidence'],
];

// Extract NAV_ITEMS block
const navStart = shell.indexOf('NAV_ITEMS');
let bracketDepth = 0, navEnd = -1;
let inStr = false, strChar = '';
for (let i = shell.indexOf('[', navStart); i < shell.length; i++) {
  const ch = shell[i];
  if (inStr) { if (ch === strChar && shell[i-1] !== '\\') inStr = false; }
  else {
    if (ch === '"' || ch === "'") { inStr = true; strChar = ch; }
    else if (ch === '[') bracketDepth++;
    else if (ch === ']') { bracketDepth--; if (bracketDepth === 0) { navEnd = i; break; } }
  }
}
const navBlock = shell.slice(navStart, navEnd + 1);
const navKeys   = [...navBlock.matchAll(/key:\s*"([^"]+)"/g)].map(m => m[1]);
const navLabels = [...navBlock.matchAll(/label:\s*"([^"]+)"/g)].map(m => m[1]);

assert('D-01', navKeys.length === 14,
  `NAV_ITEMS: exactly 14 entries (found ${navKeys.length})`, 'sg');
EXPECTED_NAV.forEach(([key, label], i) => {
  assert(`D-02-${key}`, navKeys[i] === key,
    `NAV_ITEMS[${i+1}].key === "${key}"`, 'sg');
  assert(`D-03-${key}`, navLabels[i] === label,
    `NAV_ITEMS[${i+1}].label === "${label}"`, 'sg');
});

/* -----------------------------------------------------------------------
   SECTION E: STATE DEFAULTS (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION E: State defaults ===');

assert('E-01', shell.includes('useState("beginner")'),
  'level initial state: "beginner"', 'sg');
assert('E-02', shell.includes('useState("home")'),
  'screen initial state: "home"', 'sg');
assert('E-03', shell.includes('useState(false)'),
  'showDiagnostic/showGlossary/showAbout: false initial', 'sg');
// Verify specific false counts match 3+ useState(false) for the three modals
const falseStateCount = [...shell.matchAll(/useState\(false\)/g)].length;
assert('E-04', falseStateCount >= 3,
  `At least 3 useState(false) calls for modal state defaults (found ${falseStateCount})`, 'sg');

/* -----------------------------------------------------------------------
   SECTION F: 11 PROGRESS KEYS (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION F: 11 progress keys ===');

const EXPECTED_PROGRESS_KEYS = [
  'stats', 'lj', 'pattern', 'rules', 'strategy',
  'sigma', 'risk', 'investigation', 'external-assurance', 'bv-rcv', 'pbrtqc'
];
const progressBlock = shell.slice(
  shell.indexOf('useState({ stats:'),
  shell.indexOf('useState({ stats:') + 300
);
EXPECTED_PROGRESS_KEYS.forEach(key => {
  assert(`F-01-${key}`, progressBlock.includes(key + ':') || progressBlock.includes('"' + key + '"' + ':'),
    `progress key "${key}": false present`, 'sg');
});
assert('F-02', !progressBlock.includes('"home"'),
  'progress: no "home" key', 'sg');
assert('F-03', !progressBlock.includes('"map"'),
  'progress: no "map" key', 'sg');
assert('F-04', !progressBlock.includes('"evidence"'),
  'progress: no "evidence" key', 'sg');

/* -----------------------------------------------------------------------
   SECTION G: markProgress IDEMPOTENT EXPRESSION (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION G: markProgress idempotent expression ===');

assert('G-01', shell.includes('function markProgress(key)'),
  'markProgress: authored function signature', 'sg');
assert('G-02', shell.includes('setProgress(p => (p[key] ? p : { ...p, [key]: true }))'),
  'markProgress: exact idempotent setProgress expression', 'sg');

/* -----------------------------------------------------------------------
   SECTION H: GOTO NAVIGATION BEHAVIOR (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION H: goto navigation behavior ===');

assert('H-01', shell.includes('function goto(key)'),
  'goto: authored function signature', 'sg');
assert('H-02', shell.includes('setScreen(key)'),
  'goto: calls setScreen(key)', 'sg');
assert('H-03', shell.includes('window.scrollTo'),
  'goto: calls window.scrollTo', 'sg');
assert('H-04', !shell.includes('React Router') && !shell.includes('useHistory') && !shell.includes('useNavigate'),
  'goto: no React Router — uses deterministic local state', 'rc');

/* -----------------------------------------------------------------------
   SECTION I: 14 SCREEN DISPATCH MAPPINGS (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION I: 14 screen dispatch mappings ===');

const DISPATCH = [
  ['home',               'HomeScreen'],
  ['map',                'CompetencyMapScreen'],
  ['stats',              'StatsPlaygroundScreen'],
  ['lj',                 'LJLabScreen'],
  ['pattern',            'PatternChallengeScreen'],
  ['rules',              'RuleLaboratoryScreen'],
  ['strategy',           'QCStrategyLabScreen'],
  ['sigma',              'SigmaSandboxScreen'],
  ['risk',               'RiskFrequencyLabScreen'],
  ['investigation',      'InvestigationLabScreen'],
  ['external-assurance', 'ExternalAssuranceLabScreen'],
  ['bv-rcv',             'BvRcvLabScreen'],
  ['pbrtqc',             'PatientSurveillanceLabScreen'],
  ['evidence',           'EvidenceScreen'],
];
DISPATCH.forEach(([key, comp]) => {
  assert(`I-01-${key}`, shell.includes(`screen === "${key}"`) || shell.includes(`screen === '${key}'`),
    `dispatch: screen === "${key}" present`, 'sg');
  assert(`I-02-${key.substring(0,10)}`, shell.includes(`<${comp}`),
    `dispatch: <${comp} rendered`, 'sg');
});

/* -----------------------------------------------------------------------
   SECTION J: KEY PROP WIRING (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION J: Key prop wiring ===');

assert('J-01', shell.includes('level={level}') && shell.includes('setLevel={setLevel}') && shell.includes('goto={goto}') && shell.includes('openDiagnostic='),
  'HomeScreen: level, setLevel, goto, openDiagnostic props', 'sg');
assert('J-02', shell.includes('progress={progress}'),
  'CompetencyMapScreen: progress prop', 'sg');
assert('J-03', shell.includes('markProgress={markProgress}'),
  'Domain labs: markProgress prop', 'sg');
assert('J-04', shell.includes('<EvidenceScreen'),
  'EvidenceScreen: rendered (authored no-prop invocation)', 'sg');

/* -----------------------------------------------------------------------
   SECTION K: ACCESSIBILITY SAFEGUARDS (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION K: Accessibility safeguards ===');

assert('K-01', shell.includes('Skip to main content'),
  'skip link: "Skip to main content" exact text', 'sg');
assert('K-02', shell.includes('#main'),
  'skip link: targets #main', 'sg');
assert('K-03', shell.includes('aria-label="Primary"') || shell.includes("aria-label='Primary'"),
  'Primary nav: aria-label="Primary"', 'sg');
assert('K-04', shell.includes('aria-current'),
  'Active nav: aria-current attribute present', 'sg');
assert('K-05', shell.includes('id="main"') || shell.includes("id='main'"),
  'Main content: id="main"', 'sg');
assert('K-06', shell.includes('htmlFor="level-select"') || shell.includes("htmlFor='level-select'"),
  'Level control: htmlFor="level-select"', 'sg');
assert('K-07', shell.includes('id="level-select"') || shell.includes("id='level-select'"),
  'Level control: id="level-select"', 'sg');

/* -----------------------------------------------------------------------
   SECTION L: LEVELS AND LEVEL_LABELS DEPENDENCIES (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION L: LEVELS/LEVEL_LABELS dependencies ===');

assert('L-01', shell.includes('LEVELS'),
  'app-shell.jsx: references LEVELS (not redefined here)', 'sg');
assert('L-02', shell.includes('LEVEL_LABELS'),
  'app-shell.jsx: references LEVEL_LABELS (not redefined here)', 'sg');
assert('L-03', !shell.includes('const LEVELS'),
  'app-shell.jsx: does NOT redefine LEVELS', 'rc');
assert('L-04', !shell.includes('const LEVEL_LABELS'),
  'app-shell.jsx: does NOT redefine LEVEL_LABELS', 'rc');

/* -----------------------------------------------------------------------
   SECTION M: BRAND AND FOOTER TEXT (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION M: Brand and footer text ===');

assert('M-01', shell.includes('PreciMind'),
  '"PreciMind" brand text preserved', 'sg');
assert('M-02', shell.includes('QC Learning Lab'),
  '"QC Learning Lab" text preserved', 'sg');
assert('M-03', shell.includes('Educational simulation'),
  '"Educational simulation" footer text preserved', 'sg');
assert('M-04', shell.includes('About this prototype'),
  '"About this prototype" footer action preserved', 'sg');
assert('M-05', shell.includes('Evidence') && shell.includes('Glossary'),
  'Footer: Evidence and Glossary actions preserved', 'sg');

/* -----------------------------------------------------------------------
   SECTION N: MODAL WIRING (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION N: Modal wiring ===');

assert('N-01', shell.includes('DiagnosticModal') || shell.includes('showDiagnostic'),
  'DiagnosticModal: conditional rendering wired to showDiagnostic', 'sg');
assert('N-02', shell.includes('GlossaryModal') || shell.includes('showGlossary'),
  'GlossaryModal: conditional rendering wired to showGlossary', 'sg');
assert('N-03', shell.includes('AboutModal') || shell.includes('showAbout'),
  'AboutModal: conditional rendering wired to showAbout', 'sg');

/* -----------------------------------------------------------------------
   SECTION O: EXACT AUTHORITATIVE REACTDOM MOUNT COUNT (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION O: Exact ReactDOM mount count ===');

const mountCount = [...shell.matchAll(/ReactDOM\.createRoot\(/g)].length;
assert('O-01', mountCount === 19,
  `ReactDOM.createRoot( count: exactly 19 (source-grounded, repeated mounts preserved unchanged)`, 'sg');
assert('O-02', shell.includes('ReactDOM.createRoot(rootEl).render(<App />)'),
  'ReactDOM: exact mount expression ReactDOM.createRoot(rootEl).render(<App />)', 'sg');
assert('O-03', !shell.includes('Babel.transform'),
  'app-shell.jsx: Babel.transform NOT present (bootstrap excluded)', 'rc');

/* -----------------------------------------------------------------------
   SECTION P: ROOTEL LOOKUP (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION P: rootEl lookup ===');

assert('P-01', shell.includes('document.getElementById("root")') || shell.includes("document.getElementById('root')"),
  'rootEl: document.getElementById("root")', 'sg');
assert('P-02', shell.includes('const rootEl') || shell.includes('var rootEl') || shell.includes('let rootEl'),
  'rootEl: variable declaration present', 'sg');

/* -----------------------------------------------------------------------
   SECTION Q: BOOTSTRAP SEMANTICS (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION Q: Bootstrap Babel/classic/dynamic-script semantics ===');

assert('Q-01', boot.includes('document.getElementById("app-source").textContent') || boot.includes("document.getElementById('app-source').textContent"),
  'bootstrap: reads app-source element textContent', 'sg');
assert('Q-02', boot.includes('Babel.transform('),
  'bootstrap: calls Babel.transform()', 'sg');
assert('Q-03', boot.includes('"react"') || boot.includes("'react'"),
  'bootstrap: React preset configured', 'sg');
assert('Q-04', boot.includes('runtime: "classic"') || boot.includes("runtime: 'classic'"),
  'bootstrap: classic runtime specified', 'sg');
assert('Q-05', boot.includes('document.createElement("script")') || boot.includes("document.createElement('script')"),
  'bootstrap: creates script element dynamically', 'sg');
assert('Q-06', boot.includes('s.textContent = out'),
  'bootstrap: sets textContent from transformed output', 'sg');
assert('Q-07', boot.includes('document.body.appendChild(s)'),
  'bootstrap: appends script to document body', 'sg');

/* -----------------------------------------------------------------------
   SECTION R: NO SCIENTIFIC DUPLICATION (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION R: No scientific duplication ===');

const FROZEN_FNS = [
  'calcMean', 'calcSampleSD', 'calcSigma', 'evaluateRuleSet',
  'operatingCharacteristic', 'expectedQcEventsToDetection',
  'calcBVPercent', 'calcRCV'
];
FROZEN_FNS.forEach(fn => {
  assert(`R-01-${fn.substring(0,10)}`,
    !shell.includes(`function ${fn}(`) && !boot.includes(`function ${fn}(`),
    `No frozen scientific function redefined: ${fn}`, 'rc');
});

/* -----------------------------------------------------------------------
   SECTION S: NO SCREEN DUPLICATION (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION S: No screen duplication ===');

const FROZEN_SCREENS = [
  'HomeScreen', 'CompetencyMapScreen', 'StatsPlaygroundScreen', 'LJLabScreen',
  'PatternChallengeScreen', 'RuleLaboratoryScreen', 'QCStrategyLabScreen',
  'SigmaSandboxScreen', 'RiskFrequencyLabScreen', 'InvestigationLabScreen',
  'ExternalAssuranceLabScreen', 'BvRcvLabScreen', 'PatientSurveillanceLabScreen',
  'EvidenceScreen', 'DiagnosticModal', 'GlossaryModal', 'AboutModal'
];
FROZEN_SCREENS.forEach(name => {
  assert(`S-01-${name.substring(0,12)}`,
    !shell.includes(`function ${name}(`) && !boot.includes(`function ${name}(`),
    `No frozen screen/modal redefined: ${name}`, 'rc');
});

/* -----------------------------------------------------------------------
   SECTION T: BOOTSTRAP EXCLUSIONS (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION T: Bootstrap exclusion guards ===');

assert('T-01', !boot.includes('NAV_ITEMS'),
  'runtime-bootstrap.js: no application NAV_ITEMS', 'rc');
assert('T-02', !boot.includes('function App('),
  'runtime-bootstrap.js: no application App function', 'rc');
assert('T-03', !boot.includes('ReactDOM.createRoot'),
  'runtime-bootstrap.js: no ReactDOM mount call', 'rc');

/* -----------------------------------------------------------------------
   SECTION U: NO IMPORT/EXPORT (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION U: No import/export ===');

[shell, boot].forEach((src, i) => {
  const label = i === 0 ? 'app-shell' : 'runtime-bootstrap';
  assert(`U-01-${label}`, !src.includes('import ') && !src.includes('require('),
    `${label}: no import/require`, 'sg');
  assert(`U-02-${label}`, !src.includes('module.exports') && !src.includes('export '),
    `${label}: no module.exports/export`, 'sg');
});

/* -----------------------------------------------------------------------
   SECTION V: FROZEN CLASS A FILE IMMUTABILITY (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION V: Frozen file immutability ===');

const FROZEN_HASHES = {
  '../src/ui/original-v0.8.css':      'fda2285cb24966f3225bdfe5f2bd43f0e7065cef7616d882c24085c3d48b0212',
  '../src/ui/shared-components.jsx':  'bd848d01c124c2941fa11b623adda3ba4e47e89f5e29137c901a276bfd7bad51',
  '../src/ui/app-data.js':            '81cef641a844bd1edb44ab60a81f5115f10eead0d5d6e668a8f6012e832119c1',
  '../src/ui/core-screens.jsx':       '90c2e85828d7aad9e6cb7899489a823290e6555d9216042f58aae6d99b30557d',
  '../src/rules/engine.js':           'a2ea2b71e72c312151c3e223b10815fac46d59b697f27912c6df4fc246ddf66b',
};
Object.entries(FROZEN_HASHES).forEach(([rel, expected]) => {
  const content = fs.readFileSync(path.join(__dirname, rel), 'utf8');
  const actual = crypto.createHash('sha256').update(content).digest('hex');
  assert(`V-01-${path.basename(rel)}`, actual === expected,
    `${path.basename(rel)}: SHA-256 matches frozen value`, 'rc');
});

/* -----------------------------------------------------------------------
   SUMMARY
   ----------------------------------------------------------------------- */
const total = passed + failed;
console.log(`\n${'='.repeat(60)}`);
console.log(`Stage 9J App Shell & Bootstrap Tests: ${passed}/${total} passed, ${failed} failed`);
console.log(`  Source-grounded expectations: ${sg}`);
console.log(`  Reconstructed expectations:   ${rc}`);
console.log(`  Artifact class of test file: D (recovery infrastructure)`);
console.log(`  ReactDOM.createRoot mount count: 19 (source-grounded, repeated mounts preserved)`);
if (failed > 0) {
  console.error('STAGE 9J FAILED — do not commit.');
  process.exit(1);
} else {
  console.log('STAGE 9J PASSED — all tests green.');
  process.exit(0);
}
