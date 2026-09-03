/* =========================================================================
   tests/stage9d-bv-ui.test.js

   NEW RECOVERY TESTS — Stage 9D (NOT the historical test suite)
   Tests for:
     src/bv/ui-components.jsx  (Class A, HTML lines 11305-11634)
     src/bv/screens.jsx        (Class A, HTML lines 11638-12020)

   ARTIFACT PROVENANCE: Class D (recovery infrastructure, not historical)

   TEST EXPECTATION PROVENANCE:
   SOURCE-GROUNDED (sg): exact function names, exact constants, exact mode
     IDs/labels, exact option IDs, exact component semantics, exact table
     headers — directly from HTML source.
   RECONSTRUCTED (rc): source-fidelity byte comparisons, absence tests,
     no EQA/Investigation leakage, no import/export, no build config.

   Run: node tests/stage9d-bv-ui.test.js
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

const COMP_PATH   = path.join(__dirname, '../src/bv/ui-components.jsx');
const SCREEN_PATH = path.join(__dirname, '../src/bv/screens.jsx');
const HTML_PATH   = path.join(__dirname, '../recovery/original-v0.8.html');

const comp   = fs.readFileSync(COMP_PATH,   'utf8');
const scr    = fs.readFileSync(SCREEN_PATH, 'utf8');
const html   = fs.readFileSync(HTML_PATH,   'utf8').split('\n');

/* -----------------------------------------------------------------------
   SECTION A: SOURCE-FIDELITY REGRESSIONS (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION A: Source-fidelity regressions ===');

// Components: HTML lines 11305-11634 (0-indexed 11304:11634)
const compAuth = html.slice(11303, 11634).join('\n') + '\n';
assert('A-COMP', compAuth === comp,
  'bv/ui-components.jsx exactly matches HTML lines 11304-11634', 'rc');

// Screens: HTML lines 11638-12020 (0-indexed 11637:12020)
const screenAuth = html.slice(11636, 12020).join('\n') + '\n';
assert('A-SCREEN', screenAuth === scr,
  'bv/screens.jsx exactly matches HTML lines 11637-12020', 'rc');

/* -----------------------------------------------------------------------
   SECTION B: COMPONENT FUNCTION INVENTORY (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION B: Component function inventory ===');

const EXPECTED_COMP_FNS = [
  'humanizeBvLabel','BvStatusBadge','ProvenanceCard','HowCalculatedDisclosure',
  'IndexOfIndividualityDisplay','BvApsTable','ClassicalRcvDisplay',
  'LognormalRcvDisplay','RiVsRcvComparisonPanel','VariationFoundationsVisual'
];
const actualCompFns = [...comp.matchAll(/^function ([A-Za-z][A-Za-z0-9]*)\(/mg)].map(m=>m[1]);
assert('B-01', JSON.stringify(actualCompFns) === JSON.stringify(EXPECTED_COMP_FNS),
  'ui-components.jsx: exact 10-function inventory in order', 'sg');

/* -----------------------------------------------------------------------
   SECTION C: COMPONENT CONSTANT INVENTORY (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION C: Component constant inventory ===');

const EXPECTED_COMP_CONSTS = [
  'BV_II_BAND_ICONS','BV_RCV_EXCEEDANCE_ICONS','BV_RI_STATUS_ICONS',
  'BV_TRANSPORTABILITY_ICONS','VARIATION_VISUAL_SET_POINTS','VARIATION_VISUAL_REPLICATE_OFFSETS'
];
const actualCompConsts = [...comp.matchAll(/^const ([A-Z_][A-Z0-9_]*)\s*=/mg)].map(m=>m[1]);
assert('C-01', JSON.stringify(actualCompConsts) === JSON.stringify(EXPECTED_COMP_CONSTS),
  'ui-components.jsx: exact 6-constant inventory in order', 'sg');

// VARIATION_VISUAL_SET_POINTS: deterministic, not random
assert('C-02', comp.includes('VARIATION_VISUAL_SET_POINTS = [-1.4, -0.7, -0.1, 0.4, 1.0, 1.6]'),
  'VARIATION_VISUAL_SET_POINTS: fixed deterministic values [-1.4,-0.7,-0.1,0.4,1.0,1.6]', 'sg');

/* -----------------------------------------------------------------------
   SECTION D: ProvenanceCard fields (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION D: ProvenanceCard fields ===');

const pcStart = comp.indexOf('function ProvenanceCard(');
const pcEnd   = comp.indexOf('function HowCalculatedDisclosure(');
const pc = comp.slice(pcStart, pcEnd);

['Matrix','Population','Health status','Sampling interval','Study time scale',
  'CVA','CVI','CVG','Source citation','BIVAC status','Database snapshot date'].forEach(f => {
  assert(`D-01-${f.replace(/\W/g,'').substring(0,10)}`, pc.includes(f),
    `ProvenanceCard field: "${f}"`, 'sg');
});
assert('D-02', pc.includes('transportability') || pc.includes('Transportability'),
  'ProvenanceCard: transportability cautions section', 'sg');
assert('D-03', pc.includes('BIVAC'),
  'ProvenanceCard: BIVAC status rendered', 'sg');

/* -----------------------------------------------------------------------
   SECTION E: HowCalculatedDisclosure (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION E: HowCalculatedDisclosure ===');

const hcStart = comp.indexOf('function HowCalculatedDisclosure(');
const hcEnd   = comp.indexOf('function IndexOfIndividualityDisplay(');
const hc = comp.slice(hcStart, hcEnd);

assert('E-01', hc.includes('<summary>'),
  'HowCalculatedDisclosure: uses <summary> element', 'sg');
assert('E-02', hc.includes('How was this calculated?'),
  'HowCalculatedDisclosure: "How was this calculated?" summary label', 'sg');

/* -----------------------------------------------------------------------
   SECTION F: IndexOfIndividualityDisplay (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION F: IndexOfIndividualityDisplay ===');

const iiStart = comp.indexOf('function IndexOfIndividualityDisplay(');
const iiEnd   = comp.indexOf('function BvApsTable(');
const ii = comp.slice(iiStart, iiEnd);

assert('F-01', ii.includes('calculateIndexOfIndividuality('),
  'IndexOfIndividualityDisplay: calls calculateIndexOfIndividuality()', 'sg');
assert('F-02', ii.includes('band'),
  'IndexOfIndividualityDisplay: references band field', 'sg');
assert('F-03', ii.includes('not-computable') || ii.includes('not computable'),
  'IndexOfIndividualityDisplay: handles not-computable case (CVG=0)', 'sg');
assert('F-04', ii.includes('II_HEURISTIC_CAUTION') || ii.includes('heuristic'),
  'IndexOfIndividualityDisplay: heuristic caution note present', 'sg');

/* -----------------------------------------------------------------------
   SECTION G: BvApsTable (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION G: BvApsTable ===');

const apsStart = comp.indexOf('function BvApsTable(');
const apsEnd   = comp.indexOf('function ClassicalRcvDisplay(');
const aps = comp.slice(apsStart, apsEnd);

const APS_HEADERS = ['Level','Imprecision (CV%)','Bias (magnitude, %)'];
APS_HEADERS.forEach(h => {
  assert(`G-01-${h.replace(/\W/g,'').substring(0,10)}`, aps.includes(h),
    `BvApsTable column: "${h}"`, 'sg');
});
assert('G-02', aps.includes('Optional: combined TEa (not the primary output)'),
  'BvApsTable: TEa <summary> "Optional: combined TEa (not the primary output)"', 'sg');
assert('G-03', aps.includes('TEa = 1.65\u00d7imprecision + bias (%)'),
  'BvApsTable: TEa formula label "TEa = 1.65×imprecision + bias (%)"', 'sg');
assert('G-04', aps.includes('Not computable'),
  'BvApsTable: "Not computable" guard for unsupported TEa', 'sg');

/* -----------------------------------------------------------------------
   SECTION H: ClassicalRcvDisplay and LognormalRcvDisplay (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION H: Classical and Log-normal RCV displays ===');

const crStart = comp.indexOf('function ClassicalRcvDisplay(');
const crEnd   = comp.indexOf('function LognormalRcvDisplay(');
const cr = comp.slice(crStart, crEnd);
assert('H-01', cr.includes('value'), 'ClassicalRcvDisplay: renders value', 'sg');
assert('H-02', cr.includes('%') || cr.includes('units'), 'ClassicalRcvDisplay: renders units/percent', 'sg');

const lrStart = comp.indexOf('function LognormalRcvDisplay(');
const lrEnd   = comp.indexOf('function RiVsRcvComparisonPanel(');
const lr = comp.slice(lrStart, lrEnd);
assert('H-03', lr.includes('increase'), 'LognormalRcvDisplay: renders increase threshold', 'sg');
assert('H-04', lr.includes('decrease'), 'LognormalRcvDisplay: renders decrease threshold', 'sg');
assert('H-05', lr.includes('asymmetric') || lr.includes('increase') && lr.includes('decrease'),
  'LognormalRcvDisplay: asymmetric nature represented (increase + decrease)', 'sg');

/* -----------------------------------------------------------------------
   SECTION I: VariationFoundationsVisual SVG semantics (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION I: VariationFoundationsVisual ===');

const vfStart = comp.indexOf('function VariationFoundationsVisual(');
const vf = comp.slice(vfStart);
assert('I-01', vf.includes('<svg'), 'VariationFoundationsVisual: SVG rendering', 'sg');
assert('I-02', !vf.includes('<canvas'), 'VariationFoundationsVisual: no canvas', 'sg');
assert('I-03', vf.includes('role="img"') || vf.includes("role='img'"),
  'VariationFoundationsVisual: SVG has role="img"', 'sg');
assert('I-04', comp.includes('VARIATION_VISUAL_REPLICATE_OFFSETS'),
  'VARIATION_VISUAL_REPLICATE_OFFSETS: deterministic offsets for visual jitter', 'sg');

/* -----------------------------------------------------------------------
   SECTION J: Screen function inventory (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION J: Screen function inventory ===');

const EXPECTED_SCREEN_FNS = [
  'VariationFoundationsPanel','BvExplorerPanel','ApsFromBvPanel',
  'RcvLaboratoryPanel','SerialResultChallengePanel','BvRcvLabScreen'
];
const actualScrFns = [...scr.matchAll(/^function ([A-Za-z][A-Za-z0-9]*)\(/mg)].map(m=>m[1]);
assert('J-01', JSON.stringify(actualScrFns) === JSON.stringify(EXPECTED_SCREEN_FNS),
  'screens.jsx: exact 6-function inventory in order', 'sg');

/* -----------------------------------------------------------------------
   SECTION K: Screen constant inventory (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION K: Screen constant inventory ===');

const EXPECTED_SCREEN_CONSTS = ['BV_RCV_MODES','BV_ANSWER_KIND_OPTIONS'];
const actualScrConsts = [...scr.matchAll(/^const ([A-Z_][A-Z0-9_]*)\s*=/mg)].map(m=>m[1]);
assert('K-01', JSON.stringify(actualScrConsts) === JSON.stringify(EXPECTED_SCREEN_CONSTS),
  'screens.jsx: exact 2-constant inventory in order', 'sg');

/* -----------------------------------------------------------------------
   SECTION L: Five BV modes (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION L: Five BV modes ===');

const MODE_IDS    = ['foundations','explorer','aps-from-bv','rcv-lab','challenge'];
const MODE_LABELS = ['Variation Foundations','BV Explorer','APS from BV','RCV Laboratory','Serial Result Challenge'];
MODE_IDS.forEach((id, i) => {
  assert(`L-01-${id}`, scr.includes(`"${id}"`), `Mode id: "${id}"`, 'sg');
  assert(`L-02-${id}`, scr.includes(`"${MODE_LABELS[i]}"`), `Mode label: "${MODE_LABELS[i]}"`, 'sg');
});

/* -----------------------------------------------------------------------
   SECTION M: BV_ANSWER_KIND_OPTIONS (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION M: BV_ANSWER_KIND_OPTIONS ===');

assert('M-01', scr.includes('"yes-no"'), 'BV_ANSWER_KIND_OPTIONS: yes-no kind', 'sg');
assert('M-02', scr.includes('"cvg-formula"'), 'BV_ANSWER_KIND_OPTIONS: cvg-formula kind', 'sg');
assert('M-03', scr.includes('"rcv-ii-cvg"'), 'BV_ANSWER_KIND_OPTIONS: rcv-ii-cvg kind', 'sg');
assert('M-04', scr.includes('"aps-cva-trap"'), 'BV_ANSWER_KIND_OPTIONS: aps-cva-trap kind', 'sg');
// Exact option IDs
assert('M-05', scr.includes('"includes-cvg"') && scr.includes('"excludes-cvg"'),
  'cvg-formula options: includes-cvg / excludes-cvg', 'sg');
assert('M-06', scr.includes('"rcv-rises-ii-same"') || scr.includes('"rcv-unchanged-ii-falls"'),
  'rcv-ii-cvg options: rcv-rises-ii-same / rcv-unchanged-ii-falls', 'sg');
assert('M-07', scr.includes('"desirable-aps-cva"') && scr.includes('"actual-cva"'),
  'aps-cva-trap options: desirable-aps-cva / actual-cva', 'sg');

/* -----------------------------------------------------------------------
   SECTION N: BvRcvLabScreen ARIA (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION N: BvRcvLabScreen ARIA ===');

assert('N-01', scr.includes('BV &amp; RCV Lab') || scr.includes('BV & RCV Lab'),
  'BvRcvLabScreen: h1 "BV & RCV Lab"', 'sg');
assert('N-02', scr.includes('role="tablist"'), 'BvRcvLabScreen: tablist role', 'sg');
assert('N-03', scr.includes('role="tab"'), 'BvRcvLabScreen: role=tab on mode buttons', 'sg');
assert('N-04', scr.includes('aria-selected'), 'BvRcvLabScreen: aria-selected', 'sg');
assert('N-05', scr.includes('ScientificBasisNote'), 'BvRcvLabScreen: ScientificBasisNote integrated', 'sg');

/* -----------------------------------------------------------------------
   SECTION O: SerialResultChallengePanel integration (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION O: SerialResultChallengePanel integration ===');

assert('O-01', scr.includes('SERIAL_RESULT_CHALLENGE_CASES'),
  'SerialResultChallengePanel: references SERIAL_RESULT_CHALLENGE_CASES from data layer', 'sg');
assert('O-02', scr.includes('BV_ANSWER_KIND_OPTIONS'),
  'SerialResultChallengePanel: uses BV_ANSWER_KIND_OPTIONS for rendering', 'sg');

/* -----------------------------------------------------------------------
   SECTION P: No EQA/Investigation leakage (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION P: No EQA/Investigation leakage ===');

['EqaStatusBadge','humanizeEqaStatus','StatusBadge','humanizeStatus',
  'HypothesisBoard','ExternalAssuranceLabScreen','InvestigationLabScreen'].forEach(name => {
  assert(`P-01-${name.substring(0,12)}`,
    !comp.includes(`function ${name}(`) && !scr.includes(`function ${name}(`),
    `No EQA/Investigation component: ${name}`, 'rc');
});

/* -----------------------------------------------------------------------
   SECTION Q: No shared-component duplication (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION Q: No shared-component duplication ===');

['Badge','ScientificBasisNote','SliderField','MetricCard','Modal','LJChart','DistributionView'].forEach(name => {
  assert(`Q-01-${name}`,
    !comp.includes(`function ${name}(`) && !scr.includes(`function ${name}(`),
    `No Stage 9A component redefined: ${name}`, 'rc');
});

/* -----------------------------------------------------------------------
   SECTION R: No import/export (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION R: No import/export ===');

[comp, scr].forEach((src, i) => {
  const label = i === 0 ? 'ui-components' : 'screens';
  assert(`R-01-${label}`, !src.includes('import ') && !src.includes('require('),
    `${label}: no import/require`, 'sg');
  assert(`R-02-${label}`, !src.includes('module.exports') && !src.includes('export '),
    `${label}: no module.exports/export`, 'sg');
});

/* -----------------------------------------------------------------------
   SECTION S: Scientific source immutability (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION S: Scientific source immutability ===');

const EXPECTED_SCI_HASHES = {
  '../src/bv/calc.js': '203838b74143c1838185351428fbe92844152d8b58ac610cffd7b6fc57e3707c',
  '../src/bv/data.js': 'ade1e82cc35b45c3df3283e4983e632ec3ac1c640e9f606971e47d51a5b803ef'
};
Object.entries(EXPECTED_SCI_HASHES).forEach(([rel, expected]) => {
  const content = fs.readFileSync(path.join(__dirname, rel), 'utf8');
  const actual = crypto.createHash('sha256').update(content).digest('hex');
  assert(`S-01-${path.basename(rel)}`, actual === expected,
    `${path.basename(rel)}: SHA-256 matches frozen value`, 'rc');
});

/* -----------------------------------------------------------------------
   SECTION Z: Block-completeness guards (reconstructed)
   Prevents future off-by-one fidelity tests from passing silently.
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION Z: Block-completeness guards ===');

// Z-01: Both files begin with the complete opening delimiter
assert('Z-01-comp', comp.startsWith('/* ========================================================================='),
  'ui-components.jsx: begins with /* ========================================================================= (complete delimiter)', 'rc');
assert('Z-01-scr', scr.startsWith('/* ========================================================================='),
  'screens.jsx: begins with /* ========================================================================= (complete delimiter)', 'rc');

// Z-02: Both files contain the authored closing delimiter
assert('Z-02-comp', comp.includes('========================================================================= */'),
  'ui-components.jsx: opening block comment has authored closing delimiter', 'rc');
assert('Z-02-scr', scr.includes('========================================================================= */'),
  'screens.jsx: opening block comment has authored closing delimiter', 'rc');

// Z-03: Expected final top-level function is present
assert('Z-03-comp', comp.includes('function VariationFoundationsVisual('),
  'ui-components.jsx: final function VariationFoundationsVisual is present', 'sg');
assert('Z-03-scr', scr.includes('function BvRcvLabScreen('),
  'screens.jsx: final function BvRcvLabScreen is present', 'sg');

// Z-04: Next subsystem is NOT included
assert('Z-04', !comp.includes('Patient Surveillance Lab') && !scr.includes('Patient Surveillance Lab'),
  'Neither file includes next subsystem content: "Patient Surveillance Lab"', 'rc');

/* -----------------------------------------------------------------------
   SUMMARY
   ----------------------------------------------------------------------- */
const total = passed + failed;
console.log(`\n${'='.repeat(60)}`);
console.log(`Stage 9D BV UI Tests: ${passed}/${total} passed, ${failed} failed`);
console.log(`  Source-grounded expectations: ${sg}`);
console.log(`  Reconstructed expectations:   ${rc}`);
console.log(`  Artifact class of test file: D (recovery infrastructure)`);
if (failed > 0) {
  console.error('STAGE 9D FAILED — do not commit.');
  process.exit(1);
} else {
  console.log('STAGE 9D PASSED — all tests green.');
  process.exit(0);
}
