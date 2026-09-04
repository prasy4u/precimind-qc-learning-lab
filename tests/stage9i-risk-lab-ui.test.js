/* =========================================================================
   tests/stage9i-risk-lab-ui.test.js

   NEW RECOVERY TESTS — Stage 9I (NOT the historical test suite)
   Tests for:
     src/risk/ui-components.jsx (Class A, HTML lines 5877-6045)
     src/risk/screens.jsx       (Class A, HTML lines 6048-6532)

   ARTIFACT PROVENANCE: Class D (recovery infrastructure, not historical)

   TEST EXPECTATION PROVENANCE:
   SOURCE-GROUNDED (sg): exact function/constant inventories, exact mode
     labels, exact authored values, exact engine delegation — from HTML.
   RECONSTRUCTED (rc): source-fidelity byte comparisons, absence tests,
     no-duplication guards, block-completeness guards.

   Run: node tests/stage9i-risk-lab-ui.test.js
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

const COMP_PATH = path.join(__dirname, '../src/risk/ui-components.jsx');
const SCR_PATH  = path.join(__dirname, '../src/risk/screens.jsx');
const HTML_PATH = path.join(__dirname, '../recovery/original-v0.8.html');

const comp = fs.readFileSync(COMP_PATH, 'utf8');
const scr  = fs.readFileSync(SCR_PATH,  'utf8');
const html = fs.readFileSync(HTML_PATH, 'utf8').split('\n');

/* -----------------------------------------------------------------------
   SECTION A: SOURCE-FIDELITY (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION A: Source-fidelity ===');

const compAuth = html.slice(5876, 6045).join('\n') + '\n';
assert('A-COMP', compAuth === comp,
  'ui-components.jsx exactly matches HTML lines 5877-6045', 'rc');
const scrAuth = html.slice(6047, 6532).join('\n') + '\n';
assert('A-SCR', scrAuth === scr,
  'screens.jsx exactly matches HTML lines 6048-6532', 'rc');

/* -----------------------------------------------------------------------
   SECTION B: BLOCK-COMPLETENESS GUARDS (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION B: Block-completeness guards ===');

assert('B-01-comp', comp.startsWith('/* ========================================================================='),
  'ui-components.jsx: begins with complete /* === opening delimiter', 'rc');
assert('B-02-comp', comp.includes('========================================================================= */'),
  'ui-components.jsx: opening block comment has authored closing delimiter', 'rc');
assert('B-03-scr', scr.startsWith('/* ========================================================================='),
  'screens.jsx: begins with complete /* === opening delimiter', 'rc');
assert('B-04-scr', scr.includes('========================================================================= */'),
  'screens.jsx: opening block comment has authored closing delimiter', 'rc');
assert('B-05-comp', comp.includes('function QCTimeline('),
  'ui-components.jsx: final function QCTimeline present (block not truncated)', 'sg');
assert('B-06-scr', scr.includes('function RiskFrequencyLabScreen('),
  'screens.jsx: final function RiskFrequencyLabScreen present (block not truncated)', 'sg');
assert('B-07', !comp.includes('function InvestigationLabScreen(') && !scr.includes('function InvestigationLabScreen('),
  'No Investigation Lab leakage', 'rc');
assert('B-08', !scr.includes('NAV_ITEMS') && !scr.includes('function App('),
  'No app-shell content', 'rc');
assert('B-09', !scr.includes('Investigation Lab — v0.5') && !scr.includes('isVisibleAtStage'),
  'screens.jsx: Investigation Lab block (line 6535+) absent', 'rc');

/* -----------------------------------------------------------------------
   SECTION C: COMPONENT FUNCTION INVENTORY (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION C: Component function inventory ===');

const EXPECTED_COMP_FNS = [
  'DetectionDelayResultCard','NRMPanel','QuadrantMatrix',
  'intervalWidthPx','iconCountFor','QCTimeline'
];
const actualCompFns = [...comp.matchAll(/^function ([A-Za-z][A-Za-z0-9]*)\(/mg)].map(m=>m[1]);
assert('C-01', JSON.stringify(actualCompFns) === JSON.stringify(EXPECTED_COMP_FNS),
  'ui-components.jsx: exact 6-function inventory in order', 'sg');

/* -----------------------------------------------------------------------
   SECTION D: COMPONENT CONSTANT INVENTORY (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION D: Component constant inventory ===');

const actualCompConsts = [...comp.matchAll(/^const ([A-Z_][A-Z0-9_]*)\s*=/mg)].map(m=>m[1]);
assert('D-01', JSON.stringify(actualCompConsts) === JSON.stringify(['TIMELINE_INTERVALS']),
  'ui-components.jsx: exact 1-constant [TIMELINE_INTERVALS]', 'sg');
assert('D-02', comp.includes('TIMELINE_INTERVALS = 4;'),
  'TIMELINE_INTERVALS = 4 (exact integer, fixed regardless of M)', 'sg');

/* -----------------------------------------------------------------------
   SECTION E: QCTimeline semantics (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION E: QCTimeline semantics ===');

const qtBlock = comp.slice(comp.indexOf('function QCTimeline('));
assert('E-01', qtBlock.includes('TIMELINE_INTERVALS'),
  'QCTimeline: references TIMELINE_INTERVALS', 'sg');
assert('E-02', qtBlock.includes('iconCountFor'),
  'QCTimeline: uses iconCountFor() for icon-count scaling', 'sg');
assert('E-03', qtBlock.includes('intervalWidthPx'),
  'QCTimeline: uses intervalWidthPx() for layout scaling', 'sg');
assert('E-04', qtBlock.includes('expectedQcEventsToDetectionGeometric'),
  'QCTimeline: references frozen expectedQcEventsToDetectionGeometric', 'sg');
assert('E-05', !qtBlock.includes('function expectedQcEventsToDetection'),
  'QCTimeline: does NOT redefine detection-delay engine function', 'rc');
assert('E-06', qtBlock.includes('operatingCharacteristic13s') || qtBlock.includes('isDetectionDelaySupportedRuleSet'),
  'QCTimeline: references frozen opchar engine', 'sg');

// iconCountFor: log2 scaling
const icfBlock = comp.slice(comp.indexOf('function iconCountFor('), comp.indexOf('function QCTimeline('));
assert('E-07', icfBlock.includes('Math.log2') && icfBlock.includes('Math.max') && icfBlock.includes('Math.min'),
  'iconCountFor: log2-based scaling (Math.log2/max/min)', 'sg');
assert('E-08', icfBlock.includes('Math.max(3') && icfBlock.includes('Math.min(8'),
  'iconCountFor: icon count clamped between 3 and 8', 'sg');

// intervalWidthPx: log2 scaling with min
const iwpBlock = comp.slice(comp.indexOf('function intervalWidthPx('), comp.indexOf('function iconCountFor('));
assert('E-09', iwpBlock.includes('Math.log2') && iwpBlock.includes('Math.max(60'),
  'intervalWidthPx: log2 with minimum 60px', 'sg');

/* -----------------------------------------------------------------------
   SECTION F: QuadrantMatrix (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION F: QuadrantMatrix ===');

const qmBlock = comp.slice(comp.indexOf('function QuadrantMatrix('), comp.indexOf('function intervalWidthPx('));
assert('F-01', qmBlock.includes('QUADRANT_MATRIX'),
  'QuadrantMatrix: references frozen QUADRANT_MATRIX from data', 'sg');
assert('F-02', qmBlock.includes('QUADRANT_MATRIX_NOTE'),
  'QuadrantMatrix: renders QUADRANT_MATRIX_NOTE', 'sg');

/* -----------------------------------------------------------------------
   SECTION G: SCREEN FUNCTION INVENTORY (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION G: Screen function inventory ===');

const EXPECTED_SCREEN_FNS = [
  'ConceptsPanel','FrequencySimulatorPanel','DetectionDelayPanel',
  'FrequencyDesignerPanel','SameFrequencyDifferentProcedurePanel',
  'PatientRiskExplorerPanel','FrequencyChallengePanel','RiskFrequencyLabScreen'
];
const actualScrFns = [...scr.matchAll(/^function ([A-Za-z][A-Za-z0-9]*)\(/mg)].map(m=>m[1]);
assert('G-01', JSON.stringify(actualScrFns) === JSON.stringify(EXPECTED_SCREEN_FNS),
  'screens.jsx: exact 8-function inventory in order', 'sg');

/* -----------------------------------------------------------------------
   SECTION H: SCREEN CONSTANT INVENTORY (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION H: Screen constant inventory ===');

const EXPECTED_SCR_CONSTS = ['RISK_LAB_MODES','MISCONCEPTION_NOTES','DEFAULT_RISK_ANSWER'];
const actualScrConsts = [...scr.matchAll(/^const ([A-Z_][A-Z0-9_]*)\s*=/mg)].map(m=>m[1]);
assert('H-01', JSON.stringify(actualScrConsts) === JSON.stringify(EXPECTED_SCR_CONSTS),
  'screens.jsx: exact 3-constant inventory [RISK_LAB_MODES, MISCONCEPTION_NOTES, DEFAULT_RISK_ANSWER]', 'sg');

/* -----------------------------------------------------------------------
   SECTION I: FIVE MODES (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION I: Five modes ===');

const MODE_IDS    = ['concepts','simulator','delay','explorer','challenge'];
const MODE_LABELS = ['Concepts','Frequency Simulator','Detection Delay','Patient-Risk Explorer','Frequency Challenge'];
MODE_IDS.forEach((id, i) => {
  assert(`I-01-${id}`, scr.includes(`"${id}"`), `Mode id: "${id}"`, 'sg');
  assert(`I-02-${id}`, scr.includes(`"${MODE_LABELS[i]}"`), `Mode label: "${MODE_LABELS[i]}"`, 'sg');
});
assert('I-03', !scr.includes('"sigma-lab"') && !scr.includes('"aps"'),
  'No Strategy Lab mode leakage', 'rc');

/* -----------------------------------------------------------------------
   SECTION J: DEFAULT_RISK_ANSWER (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION J: DEFAULT_RISK_ANSWER ===');

const DRA_KEYS = ['whatChanged','likelyEffect','revealedNext','confidence','submitted'];
DRA_KEYS.forEach(k => {
  assert(`J-01-${k}`, scr.includes(k), `DEFAULT_RISK_ANSWER key: ${k}`, 'sg');
});
assert('J-02', scr.includes('whatChanged: null') && scr.includes('submitted: false'),
  'DEFAULT_RISK_ANSWER: exact nulls/false initial values', 'sg');

/* -----------------------------------------------------------------------
   SECTION K: SCREEN SHELL (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION K: Screen shell ===');

assert('K-01', scr.includes('Risk &amp; Frequency Lab') || scr.includes('<h1>Risk'),
  'RiskFrequencyLabScreen: h1 Risk & Frequency Lab', 'sg');
assert('K-02', scr.includes('role="tablist"') || scr.includes("role='tablist'"),
  'RiskFrequencyLabScreen: tablist role', 'sg');
assert('K-03', scr.includes('aria-label="Risk & Frequency Lab mode"') ||
  scr.includes('aria-label=\"Risk & Frequency Lab mode\"'),
  'RiskFrequencyLabScreen: aria-label exact', 'sg');
assert('K-04', scr.includes('ScientificBasisNote'),
  'RiskFrequencyLabScreen: ScientificBasisNote present', 'sg');

/* -----------------------------------------------------------------------
   SECTION L: TEACHING NOTES AND SAFEGUARDS (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION L: Teaching notes and safeguards ===');

assert('L-01', scr.includes('STARTUP_VS_MONITORING_NOTE'),
  'STARTUP_VS_MONITORING_NOTE rendered', 'sg');
assert('L-02', scr.includes('BRACKETED_QC_NOTE'),
  'BRACKETED_QC_NOTE rendered', 'sg');
assert('L-03', scr.includes('MORE_QC_NOT_ALWAYS_BETTER_NOTE'),
  'MORE_QC_NOT_ALWAYS_BETTER_NOTE rendered', 'sg');
assert('L-04', scr.includes('MAXE_NUF_BOUNDARY_NOTE'),
  'MAXE_NUF_BOUNDARY_NOTE: full MaxE(Nuf) not implemented', 'sg');
assert('L-05', scr.includes('RISK_MODEL_LIMITATION_NOTE'),
  'RISK_MODEL_LIMITATION_NOTE rendered', 'sg');
assert('L-06', scr.includes('SameFrequencyDifferentProcedurePanel'),
  'SameFrequencyDifferentProcedurePanel: same M ≠ same patient risk', 'sg');

/* -----------------------------------------------------------------------
   SECTION M: FROZEN ENGINE DELEGATION (reconstructed + source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION M: Frozen engine delegation ===');

assert('M-01', comp.includes('expectedQcEventsToDetectionGeometric') || scr.includes('expectedQcEventsToDetection'),
  'Risk Lab: references frozen detection-delay engine functions', 'sg');
assert('M-02', !comp.includes('function expectedQcEvents') && !scr.includes('function expectedQcEvents'),
  'No detection-delay engine function redefined', 'rc');
assert('M-03', !comp.includes('function operatingCharacteristic13s(') && !scr.includes('function operatingCharacteristic13s('),
  'No opchar engine function redefined', 'rc');

/* -----------------------------------------------------------------------
   SECTION N: NO DUPLICATION / NO LEAKAGE (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION N: No duplication / no leakage ===');

['Badge','ScientificBasisNote','LJChart','Modal','SliderField'].forEach(name => {
  assert(`N-01-${name}`,
    !comp.includes(`function ${name}(`) && !scr.includes(`function ${name}(`),
    `No Stage 9A component redefined: ${name}`, 'rc');
});
['QCStrategyLabScreen','RuleLaboratoryScreen','InvestigationLabScreen','BvRcvLabScreen'].forEach(name => {
  assert(`N-02-${name.substring(0,12)}`,
    !comp.includes(`function ${name}(`) && !scr.includes(`function ${name}(`),
    `No other screen redefined: ${name}`, 'rc');
});

[comp, scr].forEach((src, i) => {
  const label = i === 0 ? 'comp' : 'scr';
  assert(`N-03-${label}`, !src.includes('import ') && !src.includes('require('),
    `${label}: no import/require`, 'sg');
  assert(`N-04-${label}`, !src.includes('module.exports') && !src.includes('export '),
    `${label}: no module.exports/export`, 'sg');
});

/* -----------------------------------------------------------------------
   SECTION O: SCIENTIFIC SOURCE IMMUTABILITY (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION O: Scientific source immutability ===');

const FROZEN_HASHES = {
  '../src/risk/detection-delay.js': '2ba697e4a090d4fcee4b5d1dc70f5870726faf8f2197b8eb307fcd78b8175e7b',
  '../src/risk/data.js':            '2910e94235767ed3cce297bfa002f1c98b255fc16a7923c448eab585010f5bb2',
};
Object.entries(FROZEN_HASHES).forEach(([rel, expected]) => {
  const content = fs.readFileSync(path.join(__dirname, rel), 'utf8');
  const actual = crypto.createHash('sha256').update(content).digest('hex');
  assert(`O-01-${path.basename(rel)}`, actual === expected,
    `${path.basename(rel)}: SHA-256 matches frozen value`, 'rc');
});

/* -----------------------------------------------------------------------
   SUMMARY
   ----------------------------------------------------------------------- */
const total = passed + failed;
console.log(`\n${'='.repeat(60)}`);
console.log(`Stage 9I Risk Lab UI Tests: ${passed}/${total} passed, ${failed} failed`);
console.log(`  Source-grounded expectations: ${sg}`);
console.log(`  Reconstructed expectations:   ${rc}`);
console.log(`  Artifact class of test file: D (recovery infrastructure)`);
if (failed > 0) {
  console.error('STAGE 9I FAILED — do not commit.');
  process.exit(1);
} else {
  console.log('STAGE 9I PASSED — all tests green.');
  process.exit(0);
}
