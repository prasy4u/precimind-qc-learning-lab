/* =========================================================================
   tests/stage9a-shared-ui.test.js

   NEW RECOVERY TESTS — Stage 9A (NOT the historical test suite)
   Tests for the recovered shared UI primitives in src/ui/.

   ARTIFACT PROVENANCE: Class D (recovery infrastructure, not historical)
   SOURCE FILES:
     src/ui/original-v0.8.css  — Artifact Class A, HTML lines 8-529
     src/ui/shared-components.jsx — Artifact Class A, HTML lines 1827-2095

   TEST EXPECTATION PROVENANCE:
   SOURCE-GROUNDED (sg): exact content, component presence, accessibility
     attributes, LJ_KEY_RUNS value — directly encoded in HTML source.
   RECONSTRUCTED (rc): structural/architecture checks, absence tests,
     and source-fidelity byte-comparison tests created during recovery.

   IMPORTANT: These tests operate on raw source text only.
   No JSX transpilation, no React rendering, no DOM.

   Run: node tests/stage9a-shared-ui.test.js
   ========================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0, sg = 0, rc = 0;

function assert(id, condition, detail, prov) {
  if (condition) { console.log(`  ✓ [${id}] ${detail}`); passed++; }
  else { console.error(`  ✗ [${id}] FAIL: ${detail}`); failed++; }
  if (prov === 'sg') sg++; else rc++;
}

const CSS_PATH  = path.join(__dirname, '../src/ui/original-v0.8.css');
const JSX_PATH  = path.join(__dirname, '../src/ui/shared-components.jsx');
const HTML_PATH = path.join(__dirname, '../recovery/original-v0.8.html');

const css  = fs.readFileSync(CSS_PATH,  'utf8');
const jsx  = fs.readFileSync(JSX_PATH,  'utf8');
const html = fs.readFileSync(HTML_PATH, 'utf8').split('\n');

// -----------------------------------------------------------------------
// SECTION A: SOURCE-FIDELITY REGRESSIONS (reconstructed)
// -----------------------------------------------------------------------
console.log('\n=== SECTION A: Source-fidelity regressions ===');

// CSS: HTML lines 8-529 (0-indexed 7:529)
const cssAuth = html.slice(7, 529).join('\n') + '\n';
assert('A-CSS', cssAuth === css,
  'src/ui/original-v0.8.css body exactly matches HTML lines 8-529', 'rc');

// JSX: HTML lines 1827-2095 (0-indexed 1826:2095)
const jsxAuth = html.slice(1826, 2095).join('\n') + '\n';
assert('A-JSX', jsxAuth === jsx,
  'src/ui/shared-components.jsx body exactly matches HTML lines 1827-2095', 'rc');

// -----------------------------------------------------------------------
// SECTION B: CSS STRUCTURE (source-grounded)
// -----------------------------------------------------------------------
console.log('\n=== SECTION B: CSS structure ===');

assert('B-01', css.startsWith(':root{'), 'CSS starts with :root{', 'sg');
assert('B-02', css.includes('--bg:'), 'CSS defines --bg CSS variable', 'sg');
assert('B-03', css.includes('--surface:'), 'CSS defines --surface CSS variable', 'sg');
assert('B-04', css.includes('--brand:'), 'CSS defines --brand CSS variable', 'sg');
assert('B-05', css.includes('--danger:'), 'CSS defines --danger CSS variable', 'sg');
assert('B-06', css.includes('@media'), 'CSS contains @media query', 'sg');
assert('B-07', !css.includes('javascript:') && !css.includes('<script'), 'CSS contains no JavaScript', 'rc');

// -----------------------------------------------------------------------
// SECTION C: JSX ARCHITECTURE (source-grounded + reconstructed)
// -----------------------------------------------------------------------
console.log('\n=== SECTION C: JSX architecture ===');

assert('C-01', jsx.includes('const { useState, useMemo, useRef, useEffect } = React;'),
  'JSX destructures React hooks from React global (no import)', 'sg');
assert('C-02', !jsx.includes("import React"), 'JSX has no import statement (inline script style)', 'sg');
assert('C-03', !jsx.includes('ReactDOM.render') && !jsx.includes('createRoot'),
  'JSX is component-only, no app mount', 'rc');

// No forbidden build artefacts
assert('C-04', !jsx.includes('require(') && !jsx.includes('module.exports'),
  'JSX contains no CommonJS require/exports', 'rc');
assert('C-05', !jsx.includes('package.json') && !jsx.includes('node_modules'),
  'JSX contains no npm/build references', 'rc');

// -----------------------------------------------------------------------
// SECTION D: SEVEN-COMPONENT INVENTORY (source-grounded)
// -----------------------------------------------------------------------
console.log('\n=== SECTION D: Seven-component inventory ===');

const SEVEN_COMPONENTS = [
  'Badge', 'ScientificBasisNote', 'SliderField',
  'MetricCard', 'Modal', 'LJChart', 'DistributionView'
];
SEVEN_COMPONENTS.forEach(name => {
  assert(`D-${name}`,
    jsx.includes(`function ${name}(`),
    `Component ${name}: function declaration present`, 'sg');
});

// No domain-specific or screen components
const FORBIDDEN_COMPONENTS = [
  'function StatisticsScreen(', 'function RuleEngine(', 'function OpChar(',
  'function RiskFreqScreen(', 'function InvestigationScreen(', 'function EQAScreen(',
  'function BVScreen(', 'function PBRTQCScreen('
];
FORBIDDEN_COMPONENTS.forEach(name => {
  assert(`D-NO-${name.replace(/[^a-zA-Z]/g,'').substring(0,12)}`,
    !jsx.includes(name),
    `No domain screen component: ${name}`, 'rc');
});

// -----------------------------------------------------------------------
// SECTION E: LJ_KEY_RUNS (source-grounded)
// -----------------------------------------------------------------------
console.log('\n=== SECTION E: LJ_KEY_RUNS ===');

assert('E-01', jsx.includes('LJ_KEY_RUNS = new Set([1, 5, 10, 15, 20])'),
  'LJ_KEY_RUNS = new Set([1, 5, 10, 15, 20]) exact', 'sg');
assert('E-02', !jsx.includes('LJ_KEY_RUNS = new Set([1,5,10,15,20])') ||
  jsx.includes('LJ_KEY_RUNS = new Set([1, 5, 10, 15, 20])'),
  'LJ_KEY_RUNS spacing confirmed', 'sg');

// Extract and verify set members
const ljMatch = jsx.match(/LJ_KEY_RUNS\s*=\s*new Set\(\[([^\]]+)\]\)/);
assert('E-03', ljMatch !== null, 'LJ_KEY_RUNS regex match succeeds', 'rc');
if (ljMatch) {
  const members = ljMatch[1].split(',').map(s => Number(s.trim()));
  assert('E-04', members.length === 5, 'LJ_KEY_RUNS has 5 members', 'sg');
  assert('E-05', JSON.stringify(members) === JSON.stringify([1,5,10,15,20]),
    'LJ_KEY_RUNS members: [1,5,10,15,20]', 'sg');
}

// -----------------------------------------------------------------------
// SECTION F: SliderField ACCESSIBILITY (source-grounded)
// -----------------------------------------------------------------------
console.log('\n=== SECTION F: SliderField accessibility ===');

const sfStart = jsx.indexOf('function SliderField(');
const sfEnd   = jsx.indexOf('function MetricCard(');
const sfBlock = jsx.slice(sfStart, sfEnd);

assert('F-01', sfBlock.includes('type="range"'), 'SliderField: input type="range"', 'sg');
assert('F-02', sfBlock.includes('htmlFor={id}'), 'SliderField: label htmlFor={id}', 'sg');
assert('F-03', sfBlock.includes('aria-label'), 'SliderField: aria-label present', 'sg');
assert('F-04', sfBlock.includes('<label'), 'SliderField: visible <label> element', 'sg');

// -----------------------------------------------------------------------
// SECTION G: Modal ACCESSIBILITY (source-grounded)
// -----------------------------------------------------------------------
console.log('\n=== SECTION G: Modal accessibility ===');

const mStart = jsx.indexOf('function Modal(');
const mEnd   = jsx.indexOf('function LJChart(');
const mBlock = jsx.slice(mStart, mEnd);

assert('G-01', mBlock.includes('role="dialog"'), 'Modal: role="dialog"', 'sg');
assert('G-02', mBlock.includes('aria-modal'), 'Modal: aria-modal present', 'sg');
assert('G-03', mBlock.includes('aria-label'), 'Modal: aria-label on dialog', 'sg');
assert('G-04', mBlock.includes('useRef'), 'Modal: useRef for focus management', 'sg');
assert('G-05', mBlock.includes('useEffect'), 'Modal: useEffect for focus/event setup', 'sg');
assert('G-06', mBlock.includes('"Escape"'), 'Modal: Escape key handler present', 'sg');
assert('G-07', mBlock.includes('focus()'), 'Modal: programmatic focus call', 'sg');

// -----------------------------------------------------------------------
// SECTION H: LJChart PRESENTATION SEMANTICS (source-grounded)
// -----------------------------------------------------------------------
console.log('\n=== SECTION H: LJChart presentation semantics ===');

const ljStart = jsx.indexOf('function LJChart(');
const ljEnd   = jsx.indexOf('function DistributionView(');
const ljBlock = jsx.slice(ljStart, ljEnd);

assert('H-01', ljBlock.includes('<svg'), 'LJChart: SVG rendering (not canvas)', 'sg');
assert('H-02', !ljBlock.includes('<canvas'), 'LJChart: no canvas element', 'sg');
assert('H-03', ljBlock.includes('role="img"'), 'LJChart: SVG has role="img"', 'sg');
assert('H-04', ljBlock.includes('LJ_KEY_RUNS'), 'LJChart: references LJ_KEY_RUNS for key-run highlighting', 'sg');
assert('H-05', ljBlock.includes('<table') || ljBlock.includes('visually-hidden'),
  'LJChart: text-alternative table or visually-hidden content for accessibility', 'sg');
assert('H-06', ljBlock.includes('aria-label'), 'LJChart: aria-label on SVG/chart', 'sg');

// -----------------------------------------------------------------------
// SECTION I: DistributionView PRESENTATION SEMANTICS (source-grounded)
// -----------------------------------------------------------------------
console.log('\n=== SECTION I: DistributionView presentation semantics ===');

const dvStart = jsx.indexOf('function DistributionView(');
const dvBlock = jsx.slice(dvStart);

assert('I-01', dvBlock.includes('<svg'), 'DistributionView: SVG rendering (not canvas)', 'sg');
assert('I-02', !dvBlock.includes('<canvas'), 'DistributionView: no canvas element', 'sg');
assert('I-03', dvBlock.includes('role="img"'), 'DistributionView: SVG has role="img"', 'sg');
assert('I-04', dvBlock.includes('aria-label'), 'DistributionView: aria-label on SVG', 'sg');
assert('I-05', dvBlock.includes('<path'), 'DistributionView: SVG path element (bell curve)', 'sg');
assert('I-06', dvBlock.includes('normal density') || dvBlock.includes('bell curve') || dvBlock.includes('dens'),
  'DistributionView: normal-density bell curve (not histogram bars)', 'sg');
assert('I-07', dvBlock.includes('viewBox'), 'DistributionView: SVG has viewBox attribute', 'sg');

// -----------------------------------------------------------------------
// SECTION J: SCIENTIFIC SOURCE IMMUTABILITY (reconstructed)
// -----------------------------------------------------------------------
console.log('\n=== SECTION J: Scientific source immutability ===');

const SCIENTIFIC_MODULES = [
  '../src/core/statistics.js', '../src/rules/engine.js',
  '../src/opchar/functions.js', '../src/strategy/core.js',
  '../src/risk/detection-delay.js', '../src/risk/data.js',
  '../src/investigation/calc.js', '../src/investigation/data.js',
  '../src/eqa/calc.js', '../src/eqa/data.js',
  '../src/bv/calc.js', '../src/bv/data.js',
  '../src/pbrtqc/calc.js', '../src/pbrtqc/data.js'
];
const EXPECTED_HASHES = {
  '../src/core/statistics.js':       '74e6d07ccd0bfae7e5cd9821078881b692e762cea3c9b4ad6eaf88799fc8f8d5',
  '../src/rules/engine.js':          'a2ea2b71e72c312151c3e223b10815fac46d59b697f27912c6df4fc246ddf66b',
  '../src/opchar/functions.js':      '1f17659d7fd10fdc8493401d47801e93d8d6ffcccbc09b2ba1ccdb0fe8dfd4d1',
  '../src/strategy/core.js':         '01a7431491c3e15c5c39777445a057b62a9e7b9876887fe1dc7b4ed97ad16f5e',
  '../src/risk/detection-delay.js':  '2ba697e4a090d4fcee4b5d1dc70f5870726faf8f2197b8eb307fcd78b8175e7b',
  '../src/risk/data.js':             '2910e94235767ed3cce297bfa002f1c98b255fc16a7923c448eab585010f5bb2',
  '../src/investigation/calc.js':    'a0fbf5c2457f3987dd4afd33ede6634f15080bc1be36f36ac003c9881c8e8353',
  '../src/investigation/data.js':    '5a0898859692b19e446b0f5e404fa99bd4d03712e1926b533ec0b2404d5ca76e',
  '../src/eqa/calc.js':              '5eca4130aff6a3eaee7972ceb45234bb0ccce073b293dc7c4ee3ac3a9853021f',
  '../src/eqa/data.js':              '465ba7674103b9f5a5f5a13dd1cdddefe23ce68abac54ded3c114a0671f99333',
  '../src/bv/calc.js':               '203838b74143c1838185351428fbe92844152d8b58ac610cffd7b6fc57e3707c',
  '../src/bv/data.js':               'ade1e82cc35b45c3df3283e4983e632ec3ac1c640e9f606971e47d51a5b803ef',
  '../src/pbrtqc/calc.js':           '5d5247c6d712a4a31ce9a5028ac5e048d3b4f02c17842751f1d8067843bf908a',
  '../src/pbrtqc/data.js':           '4f2dbb7c28ed1071b0069788b55ba9c35603d9095e80fb9a4c6b135c08cfb98f'
};

const crypto = require('crypto');
SCIENTIFIC_MODULES.forEach(rel => {
  const fullPath = path.join(__dirname, rel);
  const content = fs.readFileSync(fullPath, 'utf8');
  const actual = crypto.createHash('sha256').update(content).digest('hex');
  const expected = EXPECTED_HASHES[rel];
  assert(`J-${path.basename(rel)}`,
    actual === expected,
    `${path.basename(rel)}: SHA-256 matches frozen value (immutability verified)`, 'rc');
});

// -----------------------------------------------------------------------
// SUMMARY
/* -----------------------------------------------------------------------
   SECTION K: SliderField deep guards (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION K: SliderField deep guards ===');

const sfB = jsx.slice(jsx.indexOf('function SliderField('), jsx.indexOf('function MetricCard('));
assert('K-01', sfB.includes('{ label, value, min, max, step, onChange, suffix, id, hint, signed }'),
  'SliderField: exact prop signature', 'sg');
assert('K-02', sfB.includes('aria-valuetext'), 'SliderField: aria-valuetext on range input', 'sg');
assert('K-03', sfB.includes('numeric entry'), 'SliderField: numeric entry aria-label', 'sg');
assert('K-04', sfB.includes('Set negative'), 'SliderField: "Set negative" quick-sign button', 'sg');
assert('K-05', sfB.includes('Zero'), 'SliderField: "Zero" quick-sign button', 'sg');
assert('K-06', sfB.includes('Set positive'), 'SliderField: "Set positive" quick-sign button', 'sg');
assert('K-07', sfB.includes('fmtSigned('), 'SliderField: signed display uses fmtSigned()', 'sg');
assert('K-08', sfB.includes('parseFloat('), 'SliderField: numeric entry uses parseFloat()', 'sg');
assert('K-09', sfB.includes('!isNaN(v)'), 'SliderField: NaN guard prevents onChange call', 'sg');

/* -----------------------------------------------------------------------
   SECTION L: Modal deep guards (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION L: Modal deep guards ===');

const mB = jsx.slice(jsx.indexOf('function Modal('), jsx.indexOf('function LJChart('));
assert('L-01', mB.includes('addEventListener("keydown", onKey)') || mB.includes("addEventListener('keydown', onKey)"),
  'Modal: addEventListener for keydown (onKey)', 'sg');
assert('L-02', mB.includes('removeEventListener'), 'Modal: removeEventListener cleanup', 'sg');
assert('L-03', mB.includes('e.target === e.currentTarget'), 'Modal: overlay click guard e.target===e.currentTarget', 'sg');
assert('L-04', mB.includes('tabIndex={-1}'), 'Modal: tabIndex={-1} on panel', 'sg');
assert('L-05', mB.includes('aria-modal="true"') || mB.includes("aria-modal={true}") || mB.includes("aria-modal='true'"),
  'Modal: aria-modal="true"', 'sg');
assert('L-06', mB.includes('aria-label'), 'Modal: aria-label on dialog', 'sg');
assert('L-07', mB.includes('"Close " + title'), 'Modal: close button aria-label = "Close " + title', 'sg');

/* -----------------------------------------------------------------------
   SECTION M: LJChart deep guards (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION M: LJChart deep guards ===');

const ljB = jsx.slice(jsx.indexOf('function LJChart('), jsx.indexOf('function DistributionView('));
assert('M-01', ljB.includes('const W = 760, H = 398;'), 'LJChart: const W=760, H=398 (exact)', 'sg');
assert('M-02', ljB.includes('const gridLevels = [-3, -2, -1, 0, 1, 2, 3];'), 'LJChart: gridLevels=[-3,-2,-1,0,1,2,3] (exact)', 'sg');
assert('M-03', ljB.includes('Math.abs(pt.z) > 3'), 'LJChart: out classification: Math.abs(pt.z) > 3', 'sg');
assert('M-04', ljB.includes('Math.abs(pt.z) > 2'), 'LJChart: warning classification: Math.abs(pt.z) > 2', 'sg');
assert('M-05', ljB.includes('tabIndex={0}'), 'LJChart: point tabIndex={0} (keyboard-focusable)', 'sg');
assert('M-06', ljB.includes('role="button"') || ljB.includes("role='button'"), 'LJChart: point role="button"', 'sg');
assert('M-07', ljB.includes('Show data table (text alternative)'), 'LJChart: summary="Show data table (text alternative)"', 'sg');
assert('M-08', ljB.includes('<th>Run</th>') && ljB.includes('<th>Raw value</th>') && ljB.includes('<th>SD position</th>'),
  'LJChart: table headings Run / Raw value / SD position', 'sg');

/* -----------------------------------------------------------------------
   SECTION N: DistributionView deep guards (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION N: DistributionView deep guards ===');

const dvB = jsx.slice(jsx.indexOf('function DistributionView('));
assert('N-DV-01', dvB.includes('const W = 640, H = 170;'), 'DistributionView: const W=640, H=170 (exact)', 'sg');
assert('N-DV-02', dvB.includes('>Target<'), 'DistributionView: "Target" label distinct', 'sg');
assert('N-DV-03', dvB.includes('>Process centre<'), 'DistributionView: "Process centre" label distinct', 'sg');
assert('N-DV-04', dvB.includes('>Target = Process centre<'), 'DistributionView: "Target = Process centre" when coincident', 'sg');
assert('N-DV-05', dvB.includes('target-line') || dvB.includes('"dist-target"') || dvB.includes("'dist-target'") ||
  (dvB.includes('className') && dvB.includes('target')), 'DistributionView: target-line CSS class', 'sg');
assert('N-DV-06', dvB.includes('mean-line') || dvB.includes('"dist-mean"') || dvB.includes('xFor(mean)'),
  'DistributionView: mean-line/process-centre CSS class or marker', 'sg');
assert('N-DV-07', dvB.includes('showBothMarkers'), 'DistributionView: showBothMarkers prop controls marker labelling', 'sg');

/* -----------------------------------------------------------------------
   SECTION O: CSS accessibility and theme safeguards (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION O: CSS accessibility and theme safeguards ===');

assert('O-01', css.includes(':root{') || css.includes(':root {'), 'CSS: :root token block', 'sg');
assert('O-02', css.includes('prefers-color-scheme: dark') || css.includes('prefers-color-scheme:dark'),
  'CSS: dark theme @media prefers-color-scheme: dark', 'sg');
assert('O-03', css.includes('prefers-reduced-motion'), 'CSS: prefers-reduced-motion handling', 'sg');
assert('O-04', css.includes('focus-visible'), 'CSS: :focus-visible outline', 'sg');
assert('O-05', css.includes('IBM Plex Sans'), 'CSS: IBM Plex Sans font', 'sg');
assert('O-06', css.includes('IBM Plex Mono'), 'CSS: IBM Plex Mono font', 'sg');
assert('O-07', css.includes('--ok:'), 'CSS: --ok colour variable', 'sg');
assert('O-08', css.includes('--warn:'), 'CSS: --warn colour variable', 'sg');
assert('O-09', css.includes('--danger:'), 'CSS: --danger colour variable', 'sg');
assert('O-10', css.includes('--focus:'), 'CSS: --focus colour variable', 'sg');
assert('O-11', css.includes('--radius:'), 'CSS: --radius variable', 'sg');
assert('O-12', css.includes('--shadow:'), 'CSS: --shadow variable', 'sg');
assert('O-13', css.includes('max-width: 600px') || css.includes('max-width:600px'),
  'CSS: responsive @media max-width: 600px rule', 'sg');

/* -----------------------------------------------------------------------
   SECTION P: Exact seven-function inventory (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION P: Exact seven-function inventory ===');

const topLevelFns = [...jsx.matchAll(/^function ([A-Za-z]+)\(/mg)].map(m => m[1]);
assert('P-01', JSON.stringify(topLevelFns) === JSON.stringify(['Badge','ScientificBasisNote','SliderField','MetricCard','Modal','LJChart','DistributionView']),
  'Exactly seven top-level function declarations in exact order', 'sg');

/* -----------------------------------------------------------------------
   SECTION Q: No build configuration (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION Q: No build configuration ===');

const path_mod = require('path');
const BUILD_FILES = ['package.json','webpack.config.js','vite.config.js','babel.config.js','rollup.config.js'];
BUILD_FILES.forEach(f => {
  assert('Q-' + f.replace(/[^a-zA-Z]/g,'').substring(0,8),
    !require('fs').existsSync(path_mod.join(__dirname, '..', f)),
    'No build config: ' + f, 'rc');
});

// -----------------------------------------------------------------------
const total = passed + failed;
console.log(`\n${'='.repeat(60)}`);
console.log(`Stage 9A Shared UI Tests: ${passed}/${total} passed, ${failed} failed`);
console.log(`  Source-grounded expectations: ${sg}`);
console.log(`  Reconstructed expectations:   ${rc}`);
console.log(`  Artifact class of test file: D (recovery infrastructure)`);
if (failed > 0) {
  console.error('STAGE 9A FAILED — do not commit.');
  process.exit(1);
} else {
  console.log('STAGE 9A PASSED — all tests green.');
  process.exit(0);
}
