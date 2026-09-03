/* =========================================================================
   tests/stage9f-foundation-ui.test.js

   NEW RECOVERY TESTS — Stage 9F (NOT the historical test suite)
   Tests for:
     src/ui/app-data.js      (Class A, HTML lines 970-1824)
     src/ui/core-screens.jsx (Class A, HTML lines 2098-2813)

   ARTIFACT PROVENANCE: Class D (recovery infrastructure, not historical)

   TEST EXPECTATION PROVENANCE:
   SOURCE-GROUNDED (sg): exact function/constant inventories, exact array
     counts, exact version string, exact level names, exact presence of
     authored governance notes — directly from HTML source.
   RECONSTRUCTED (rc): source-fidelity byte comparisons, absence tests,
     no-duplication guards, no app-shell leakage, block-completeness guards.

   Run: node tests/stage9f-foundation-ui.test.js
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

const DATA_PATH   = path.join(__dirname, '../src/ui/app-data.js');
const SCREEN_PATH = path.join(__dirname, '../src/ui/core-screens.jsx');
const HTML_PATH   = path.join(__dirname, '../recovery/original-v0.8.html');

const data   = fs.readFileSync(DATA_PATH,   'utf8');
const scr    = fs.readFileSync(SCREEN_PATH, 'utf8');
const html   = fs.readFileSync(HTML_PATH,   'utf8').split('\n');

/* -----------------------------------------------------------------------
   SECTION A: SOURCE-FIDELITY (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION A: Source-fidelity ===');

const dataAuth = html.slice(969, 1824).join('\n') + '\n';
assert('A-DATA', dataAuth === data,
  'app-data.js exactly matches HTML lines 970-1824', 'rc');

const scrAuth = html.slice(2097, 2813).join('\n') + '\n';
assert('A-SCR', scrAuth === scr,
  'core-screens.jsx exactly matches HTML lines 2098-2813', 'rc');

/* -----------------------------------------------------------------------
   SECTION B: BLOCK-COMPLETENESS GUARDS (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION B: Block-completeness guards ===');

assert('B-01', data.startsWith('/* ========================================================================='),
  'app-data.js: begins with complete opening block delimiter', 'rc');
assert('B-02', data.includes('========================================================================= */'),
  'app-data.js: opening comment has authored closing delimiter', 'rc');
assert('B-03', scr.startsWith('/* ========================================================================='),
  'core-screens.jsx: begins with complete opening block delimiter', 'rc');
assert('B-04', scr.includes('========================================================================= */'),
  'core-screens.jsx: opening comment has authored closing delimiter', 'rc');
assert('B-05', data.includes('ONGOING_DISCUSSION_AREAS'),
  'app-data.js: final constant ONGOING_DISCUSSION_AREAS present', 'sg');
assert('B-06', scr.includes('function AboutModal('),
  'core-screens.jsx: final function AboutModal present', 'sg');
assert('B-07', !data.includes('NAV_ITEMS') && !data.includes('function App('),
  'app-data.js: no app-shell content', 'rc');
assert('B-08', !scr.includes('NAV_ITEMS') && !scr.includes('function App('),
  'core-screens.jsx: no app-shell content', 'rc');

/* -----------------------------------------------------------------------
   SECTION C: DATA FUNCTION INVENTORY (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION C: Data function inventory ===');

const EXPECTED_DATA_FNS = [
  'suggestLevelFromScore','buildDomainProfile','getPatternFeedback','getConfidenceNote'
];
const actualDataFns = [...data.matchAll(/^function ([A-Za-z][A-Za-z0-9]*)\(/mg)].map(m=>m[1]);
assert('C-01', JSON.stringify(actualDataFns) === JSON.stringify(EXPECTED_DATA_FNS),
  'app-data.js: exact 4-function inventory in order', 'sg');

/* -----------------------------------------------------------------------
   SECTION D: DATA CONSTANT INVENTORY (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION D: Data constant inventory ===');

const EXPECTED_DATA_CONSTS = [
  'LEVELS','LEVEL_LABELS','LEVEL_HOME_DESC','COMPETENCY_MODULES','PROGRESSION_STAGES',
  'RECOMMENDED_PATH','GLOSSARY','Z_STABLE_A','Z_STABLE_B','Z_ISOLATED','Z_POS_SHIFT',
  'Z_NEG_SHIFT','Z_TREND_UP','Z_TREND_DOWN','Z_SCATTER','Z_OUTLIER_2SD','Z_STEP_EVENT',
  'NEXT_STEP_OPTIONS','PATTERN_OPTIONS','CONFIDENCE_OPTIONS','BROAD_OPTIONS','SCENARIOS',
  'DIAGNOSTIC_QUESTIONS','DIAGNOSTIC_DOMAINS','STATS_PLAYGROUND_EXPLANATION',
  'LJ_LAB_EXPLANATION','SIGMA_CAUTION_POINTS','PATTERN_LEVEL_FEEDBACK','BROAD_EXPLANATION',
  'NEXT_STEP_TEXT_BY_LEVEL','EDU_DISCLAIMER','ABOUT_TEXT','EVIDENCE_SOURCES',
  'EVIDENCE_TIERS','EVIDENCE_HIERARCHY_AUTHORITY_NOTE','ONGOING_DISCUSSION_AREAS'
];
const actualDataConsts = [...data.matchAll(/^const ([A-Z_][A-Z0-9_]*)\s*=/mg)].map(m=>m[1]);
assert('D-01', JSON.stringify(actualDataConsts) === JSON.stringify(EXPECTED_DATA_CONSTS),
  'app-data.js: exact 36-constant inventory in order', 'sg');

/* -----------------------------------------------------------------------
   SECTION E: HIGH-VALUE DATA COUNTS (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION E: High-value data counts ===');

// Count top-level items in an array constant using bracket depth tracking
function countTopLevel(src, name) {
  const startIdx = src.indexOf('const ' + name + ' = [');
  if (startIdx < 0) return -1;
  let depth = 0, count = 0, inStr = false, strChar = '';
  let i = src.indexOf('[', startIdx);
  while (i < src.length) {
    const ch = src[i];
    if (inStr) {
      if (ch === strChar && src[i-1] !== '\\') inStr = false;
    } else {
      if (ch === '"' || ch === "'") { inStr = true; strChar = ch; }
      else if (ch === '[' || ch === '{' || ch === '(') depth++;
      else if (ch === ']' || ch === '}' || ch === ')') {
        depth--;
        if (depth === 0) break;
      } else if (ch === ',' && depth === 1) count++;
    }
    i++;
  }
  return count + 1;
}

const DATA_COUNTS = [
  ['LEVELS', 4], ['COMPETENCY_MODULES', 12], ['PROGRESSION_STAGES', 5],
  ['RECOMMENDED_PATH', 11], ['GLOSSARY', 14], ['SCENARIOS', 10],
  ['DIAGNOSTIC_QUESTIONS', 8], ['DIAGNOSTIC_DOMAINS', 4], ['PATTERN_OPTIONS', 8],
  ['NEXT_STEP_OPTIONS', 5], ['CONFIDENCE_OPTIONS', 3], ['BROAD_OPTIONS', 4],
  ['EVIDENCE_SOURCES', 40], ['EVIDENCE_TIERS', 7], ['ONGOING_DISCUSSION_AREAS', 52]
];
DATA_COUNTS.forEach(([name, expected]) => {
  const actual = countTopLevel(data, name);
  assert(`E-01-${name}`, actual === expected,
    `${name}.length === ${expected}`, 'sg');
});

// LEVELS exact values (beginner, intermediate, advanced, expert)
assert('E-02', data.includes('"beginner"') && data.includes('"intermediate"') &&
  data.includes('"advanced"') && data.includes('"expert"'),
  'LEVELS: beginner/intermediate/advanced/expert present', 'sg');

/* -----------------------------------------------------------------------
   SECTION F: EVIDENCE GOVERNANCE (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION F: Evidence governance ===');

assert('F-01', data.includes('EVIDENCE_HIERARCHY_AUTHORITY_NOTE'),
  'EVIDENCE_HIERARCHY_AUTHORITY_NOTE: evidence authority differentiation preserved', 'sg');
assert('F-02', data.includes('EVIDENCE_TIERS'),
  'EVIDENCE_TIERS: tiered evidence structure preserved', 'sg');
assert('F-03', data.includes('ONGOING_DISCUSSION_AREAS'),
  '"Areas of ongoing discussion" section preserved', 'sg');

/* -----------------------------------------------------------------------
   SECTION G: SCREEN FUNCTION INVENTORY (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION G: Screen function inventory ===');

const EXPECTED_SCREEN_FNS = [
  'Disclaimer','HomeScreen','DiagnosticModal','CompetencyMapScreen',
  'StatsPlaygroundScreen','LJLabScreen','PatternChallengeScreen',
  'SigmaSandboxScreen','EvidenceScreen','GlossaryModal','AboutModal'
];
const actualScrFns = [...scr.matchAll(/^function ([A-Za-z][A-Za-z0-9]*)\(/mg)].map(m=>m[1]);
assert('G-01', JSON.stringify(actualScrFns) === JSON.stringify(EXPECTED_SCREEN_FNS),
  'core-screens.jsx: exact 11-function inventory in order', 'sg');

/* -----------------------------------------------------------------------
   SECTION H: SCREEN CONSTANT INVENTORY (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION H: Screen constant inventory ===');

const EXPECTED_SCREEN_CONSTS = [
  'PATHWAY_PHASES','LEARNING_PATHWAY','STATUS_LABEL','STATUS_TONE',
  'PLAYGROUND_Z_BEGINNER','PLAYGROUND_Z_STANDARD','PG_DEFAULTS',
  'LJ_DATASETS','LJ_TRUE_MEAN','LJ_DEFAULTS','SG_DEFAULTS'
];
const actualScrConsts = [...scr.matchAll(/^const ([A-Z_][A-Z0-9_]*)\s*=/mg)].map(m=>m[1]);
assert('H-01', JSON.stringify(actualScrConsts) === JSON.stringify(EXPECTED_SCREEN_CONSTS),
  'core-screens.jsx: exact 11-constant inventory in order', 'sg');

/* -----------------------------------------------------------------------
   SECTION I: SCREEN SEMANTIC SAFEGUARDS (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION I: Screen semantic safeguards ===');

// HomeScreen: LEVELS/LEVEL_LABELS/LEVEL_HOME_DESC references
const homeBlock = scr.slice(scr.indexOf('function HomeScreen('), scr.indexOf('function DiagnosticModal('));
assert('I-01', homeBlock.includes('LEVELS'), 'HomeScreen: references LEVELS', 'sg');
assert('I-02', homeBlock.includes('LEVEL_LABELS') || homeBlock.includes('LEVEL_HOME_DESC'),
  'HomeScreen: references LEVEL_LABELS or LEVEL_HOME_DESC', 'sg');

// DiagnosticModal: DIAGNOSTIC_QUESTIONS, suggestLevelFromScore
const diagBlock = scr.slice(scr.indexOf('function DiagnosticModal('), scr.indexOf('function CompetencyMapScreen('));
assert('I-03', diagBlock.includes('DIAGNOSTIC_QUESTIONS'), 'DiagnosticModal: references DIAGNOSTIC_QUESTIONS', 'sg');
assert('I-04', diagBlock.includes('suggestLevelFromScore'), 'DiagnosticModal: calls suggestLevelFromScore', 'sg');

// SigmaSandboxScreen: calcSigma reference (not definition)
const sigmaBlock = scr.slice(scr.indexOf('function SigmaSandboxScreen('), scr.indexOf('function EvidenceScreen('));
assert('I-05', sigmaBlock.includes('calcSigma'), 'SigmaSandboxScreen: references calcSigma', 'sg');
assert('I-06', !sigmaBlock.includes('function calcSigma('), 'SigmaSandboxScreen: does NOT define calcSigma', 'rc');
assert('I-07', sigmaBlock.includes('SIGMA_CAUTION_POINTS'), 'SigmaSandboxScreen: references SIGMA_CAUTION_POINTS', 'sg');

// EvidenceScreen: EVIDENCE_SOURCES, EVIDENCE_HIERARCHY_AUTHORITY_NOTE, ONGOING_DISCUSSION_AREAS
const evBlock = scr.slice(scr.indexOf('function EvidenceScreen('), scr.indexOf('function GlossaryModal('));
assert('I-08', evBlock.includes('EVIDENCE_SOURCES'), 'EvidenceScreen: references EVIDENCE_SOURCES', 'sg');
assert('I-09', evBlock.includes('EVIDENCE_HIERARCHY_AUTHORITY_NOTE'), 'EvidenceScreen: references EVIDENCE_HIERARCHY_AUTHORITY_NOTE', 'sg');
assert('I-10', evBlock.includes('ONGOING_DISCUSSION_AREAS'), 'EvidenceScreen: references "Areas of ongoing discussion"', 'sg');

// AboutModal: Version 0.8
const aboutBlock = scr.slice(scr.indexOf('function AboutModal('));
assert('I-11', aboutBlock.includes('Version 0.8'), 'AboutModal: "Version 0.8" version string preserved', 'sg');

// LJLabScreen: references LJChart (not defines)
const ljBlock = scr.slice(scr.indexOf('function LJLabScreen('), scr.indexOf('function PatternChallengeScreen('));
assert('I-12', ljBlock.includes('LJChart'), 'LJLabScreen: references LJChart', 'sg');
assert('I-13', !ljBlock.includes('function LJChart('), 'LJLabScreen: does NOT define LJChart', 'rc');

// PatternChallengeScreen: confidence/metacognitive
const patBlock = scr.slice(scr.indexOf('function PatternChallengeScreen('), scr.indexOf('function SigmaSandboxScreen('));
assert('I-14', patBlock.includes('CONFIDENCE_OPTIONS'), 'PatternChallengeScreen: references CONFIDENCE_OPTIONS', 'sg');
assert('I-15', patBlock.includes('getPatternFeedback') || patBlock.includes('getConfidenceNote'),
  'PatternChallengeScreen: uses authored pattern/confidence helpers', 'sg');

/* -----------------------------------------------------------------------
   SECTION J: NO DUPLICATION / NO LEAKAGE (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION J: No duplication / no leakage ===');

// No shared Stage 9A component redefinition
['Badge','ScientificBasisNote','SliderField','MetricCard','Modal','LJChart','DistributionView'].forEach(name => {
  assert(`J-01-${name}`, !scr.includes(`function ${name}(`),
    `core-screens.jsx: does NOT redefine Stage 9A component ${name}`, 'rc');
});

// No frozen scientific formula duplication
['calcMean','calcSampleSD','calcCVPercent','calcBiasPercent','calcSigma','calcBiasPercent'].forEach(fn => {
  assert(`J-02-${fn.substring(0,10)}`, !data.includes(`function ${fn}(`) && !scr.includes(`function ${fn}(`),
    `No frozen scientific function redefined: ${fn}`, 'rc');
});

// No Rule Lab leakage
['RuleLaboratoryScreen','RULE_LAB_MODES','RULE_DEFINITIONS','MultiLevelLJChart'].forEach(name => {
  assert(`J-03-${name.substring(0,12)}`, !scr.includes(name) && !data.includes(name),
    `No Rule Lab content: ${name}`, 'rc');
});

// No app-shell leakage
assert('J-04', !scr.includes('NAV_ITEMS') && !scr.includes('function App(') && !scr.includes('ReactDOM'),
  'core-screens.jsx: no app-shell content (NAV_ITEMS/App/ReactDOM)', 'rc');
assert('J-05', !data.includes('NAV_ITEMS') && !data.includes('function App(') && !data.includes('ReactDOM'),
  'app-data.js: no app-shell content', 'rc');

// No import/export
[data, scr].forEach((src, i) => {
  const label = i === 0 ? 'app-data' : 'core-screens';
  assert(`J-06-${label}`, !src.includes('import ') && !src.includes('require('),
    `${label}: no import/require`, 'sg');
  assert(`J-07-${label}`, !src.includes('module.exports') && !src.includes('export '),
    `${label}: no module.exports/export`, 'sg');
});

/* -----------------------------------------------------------------------
   SECTION K: SCIENTIFIC SOURCE IMMUTABILITY (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION K: Scientific source immutability ===');

const FROZEN_HASHES = {
  '../src/ui/original-v0.8.css':      'fda2285cb24966f3225bdfe5f2bd43f0e7065cef7616d882c24085c3d48b0212',
  '../src/ui/shared-components.jsx':  'bd848d01c124c2941fa11b623adda3ba4e47e89f5e29137c901a276bfd7bad51',
};
Object.entries(FROZEN_HASHES).forEach(([rel, expected]) => {
  const content = fs.readFileSync(path.join(__dirname, rel), 'utf8');
  const actual = crypto.createHash('sha256').update(content).digest('hex');
  assert(`K-01-${path.basename(rel)}`, actual === expected,
    `${path.basename(rel)}: SHA-256 matches frozen value`, 'rc');
});

/* -----------------------------------------------------------------------
   SUMMARY
   ----------------------------------------------------------------------- */
const total = passed + failed;
console.log(`\n${'='.repeat(60)}`);
console.log(`Stage 9F Foundation UI Tests: ${passed}/${total} passed, ${failed} failed`);
console.log(`  Source-grounded expectations: ${sg}`);
console.log(`  Reconstructed expectations:   ${rc}`);
console.log(`  Artifact class of test file: D (recovery infrastructure)`);
if (failed > 0) {
  console.error('STAGE 9F FAILED — do not commit.');
  process.exit(1);
} else {
  console.log('STAGE 9F PASSED — all tests green.');
  process.exit(0);
}
