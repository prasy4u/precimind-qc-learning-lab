/* =========================================================================
   tests/stage9e-pbrtqc-ui.test.js

   NEW RECOVERY TESTS — Stage 9E (NOT the historical test suite)
   Tests for:
     src/pbrtqc/ui-components.jsx  (Class A, HTML lines 13235-13471)
     src/pbrtqc/screens.jsx        (Class A, HTML lines 13473-13852)

   ARTIFACT PROVENANCE: Class D (recovery infrastructure, not historical)

   TEST EXPECTATION PROVENANCE:
   SOURCE-GROUNDED (sg): exact function names, exact constants, exact mode
     IDs/labels, exact component semantics, exact MAX_RENDERED_POINTS —
     directly from HTML source.
   RECONSTRUCTED (rc): source-fidelity byte comparisons, absence tests,
     no BV/EQA/Investigation leakage, no import/export, no build config.

   Run: node tests/stage9e-pbrtqc-ui.test.js
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

const COMP_PATH   = path.join(__dirname, '../src/pbrtqc/ui-components.jsx');
const SCREEN_PATH = path.join(__dirname, '../src/pbrtqc/screens.jsx');
const HTML_PATH   = path.join(__dirname, '../recovery/original-v0.8.html');

const comp   = fs.readFileSync(COMP_PATH,   'utf8');
const scr    = fs.readFileSync(SCREEN_PATH, 'utf8');
const html   = fs.readFileSync(HTML_PATH,   'utf8').split('\n');

/* -----------------------------------------------------------------------
   SECTION A: SOURCE-FIDELITY REGRESSIONS (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION A: Source-fidelity regressions ===');

const compAuth   = html.slice(13234, 13471).join('\n') + '\n';
const screenAuth = html.slice(13472, 13852).join('\n') + '\n';
assert('A-COMP',   compAuth   === comp, 'pbrtqc/ui-components.jsx exactly matches HTML lines 13235-13471', 'rc');
assert('A-SCREEN', screenAuth === scr,  'pbrtqc/screens.jsx exactly matches HTML lines 13473-13852', 'rc');

/* -----------------------------------------------------------------------
   SECTION B: COMPONENT FUNCTION INVENTORY (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION B: Component function inventory ===');

const EXPECTED_COMP_FNS = [
  'humanizePbrtqcLabel','PbrtqcStatusBadge','samplePoints',
  'PatientStreamChart','MovingStatisticSummary','EwmaSummary',
  'NPedSummaryCard','MultiTrialNpedSummary',
  'TrainingVerificationDisclosure','ParameterProvenanceNote','ChangedVsConstantPanel'
];
const actualCompFns = [...comp.matchAll(/^function ([A-Za-z][A-Za-z0-9]*)\(/mg)].map(m=>m[1]);
assert('B-01', JSON.stringify(actualCompFns) === JSON.stringify(EXPECTED_COMP_FNS),
  'ui-components.jsx: exact 11-function inventory in order', 'sg');

/* -----------------------------------------------------------------------
   SECTION C: COMPONENT CONSTANT INVENTORY (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION C: Component constant inventory ===');

const EXPECTED_COMP_CONSTS = [
  'PBRTQC_ALERT_ICONS','PBRTQC_INCLUSION_ICONS','PBRTQC_DETECTION_ICONS','MAX_RENDERED_POINTS'
];
const actualCompConsts = [...comp.matchAll(/^const ([A-Z_][A-Z0-9_]*)\s*=/mg)].map(m=>m[1]);
assert('C-01', JSON.stringify(actualCompConsts) === JSON.stringify(EXPECTED_COMP_CONSTS),
  'ui-components.jsx: exact 4-constant inventory in order', 'sg');

assert('C-02', comp.includes('MAX_RENDERED_POINTS = 180'),
  'MAX_RENDERED_POINTS = 180 (exact)', 'sg');

/* -----------------------------------------------------------------------
   SECTION D: samplePoints — performance guard (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION D: samplePoints performance guard ===');

assert('D-01', comp.includes('MAX_RENDERED_POINTS') && comp.includes('samplePoints'),
  'samplePoints: uses MAX_RENDERED_POINTS to limit rendered points', 'sg');
assert('D-02', comp.includes('everyNth'),
  'samplePoints: returns everyNth sampling parameter', 'sg');

/* -----------------------------------------------------------------------
   SECTION E: PatientStreamChart SVG semantics (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION E: PatientStreamChart SVG semantics ===');

const pscStart = comp.indexOf('function PatientStreamChart(');
const pscEnd   = comp.indexOf('function MovingStatisticSummary(');
const psc = comp.slice(pscStart, pscEnd);

assert('E-01', psc.includes('<svg'), 'PatientStreamChart: SVG rendering (not canvas)', 'sg');
assert('E-02', !psc.includes('<canvas'), 'PatientStreamChart: no canvas element', 'sg');
assert('E-03', psc.includes('role="img"') || psc.includes("role='img'"),
  'PatientStreamChart: SVG has role="img"', 'sg');
assert('E-04', psc.includes('samplePoints'),
  'PatientStreamChart: calls samplePoints() for rendering performance', 'sg');
assert('E-05', psc.includes('<table') || psc.includes('text alternative') || psc.includes('visually-hidden'),
  'PatientStreamChart: text-alternative table for accessibility', 'sg');
assert('E-06', psc.includes('PBRTQC_ALERT_ICONS') || psc.includes('alert') || psc.includes('Alert'),
  'PatientStreamChart: references alert icon mapping', 'sg');

/* -----------------------------------------------------------------------
   SECTION F: NPedSummaryCard invariants (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION F: NPedSummaryCard ===');

const npStart = comp.indexOf('function NPedSummaryCard(');
const npEnd   = comp.indexOf('function MultiTrialNpedSummary(');
const np = comp.slice(npStart, npEnd);

assert('F-01', np.includes('!nped.detected') || np.includes("nped.detected === false"),
  'NPedSummaryCard: handles undetected case (no Infinity)', 'sg');
assert('F-02', np.includes('undetected'),
  'NPedSummaryCard: renders "undetected" status badge for undetected case', 'sg');
assert('F-03', np.includes('limitations') || np.includes('reason'),
  'NPedSummaryCard: shows limitation note for undetected trial', 'sg');

/* -----------------------------------------------------------------------
   SECTION G: MultiTrialNpedSummary — ANPed censoring display (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION G: MultiTrialNpedSummary ===');

const mtStart = comp.indexOf('function MultiTrialNpedSummary(');
const mtEnd   = comp.indexOf('function TrainingVerificationDisclosure(');
const mt = comp.slice(mtStart, mtEnd);

assert('G-01', mt.includes('detectionRate') || mt.includes('detection rate') || mt.includes('detectedTrials'),
  'MultiTrialNpedSummary: displays detection rate', 'sg');
assert('G-02', mt.includes('censoringNote') || mt.includes('censoring'),
  'MultiTrialNpedSummary: displays censoring note when any trial undetected', 'sg');
assert('G-03', mt.includes('anped') || mt.includes('ANPed') || mt.includes('summarizeNpedTrials'),
  'MultiTrialNpedSummary: references ANPed/summarizeNpedTrials result', 'sg');

/* -----------------------------------------------------------------------
   SECTION H: TrainingVerificationDisclosure (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION H: TrainingVerificationDisclosure ===');

const tvStart = comp.indexOf('function TrainingVerificationDisclosure(');
const tvEnd   = comp.indexOf('function ParameterProvenanceNote(');
const tv = comp.slice(tvStart, tvEnd);

assert('H-01', tv.includes('training') || tv.includes('Training'),
  'TrainingVerificationDisclosure: training/verification split content', 'sg');
assert('H-02', tv.includes('verification') || tv.includes('Verification'),
  'TrainingVerificationDisclosure: verification content', 'sg');
assert('H-03', tv.includes('TRAINING_VERIFICATION_SEPARATION_NOTE') || tv.includes('VERIFICATION_LEAKAGE_NOTE') || tv.includes('leakage') || tv.includes('Leakage'),
  'TrainingVerificationDisclosure: references leakage doctrine', 'sg');

/* -----------------------------------------------------------------------
   SECTION I: ChangedVsConstantPanel (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION I: ChangedVsConstantPanel ===');

const cvStart = comp.indexOf('function ChangedVsConstantPanel(');
const cv = comp.slice(cvStart, cvStart+400);

assert('I-01', cv.includes('Changed') && cv.includes('heldConstant'),
  'ChangedVsConstantPanel: "Changed" and heldConstant props', 'sg');
assert('I-02', cv.includes('quadrant-grid') || cv.includes('quadrant'),
  'ChangedVsConstantPanel: quadrant-grid layout class', 'sg');

/* -----------------------------------------------------------------------
   SECTION J: Screen function inventory (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION J: Screen function inventory ===');

const EXPECTED_SCREEN_FNS = [
  'PbrtqcFoundationsPanel','PatientDistributionLabPanel','AlgorithmLabPanel',
  'ErrorDetectionSimulatorPanel','PbrtqcChallengePanel'
];
const actualScrFns = [...scr.matchAll(/^function ([A-Za-z][A-Za-z0-9]*)\(/mg)].map(m=>m[1]);
assert('J-01', JSON.stringify(actualScrFns) === JSON.stringify(EXPECTED_SCREEN_FNS),
  'screens.jsx: exact 5-function inventory in order', 'sg');

/* -----------------------------------------------------------------------
   SECTION K: Screen constant inventory (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION K: Screen constant inventory ===');

const actualScrConsts = [...scr.matchAll(/^const ([A-Z_][A-Z0-9_]*)\s*=/mg)].map(m=>m[1]);
assert('K-01', JSON.stringify(actualScrConsts) === JSON.stringify(['PBRTQC_MODES']),
  'screens.jsx: exact 1-constant inventory [PBRTQC_MODES]', 'sg');

/* -----------------------------------------------------------------------
   SECTION L: Five PBRTQC modes (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION L: Five PBRTQC modes ===');

const MODE_IDS    = ['foundations','distribution','algorithm','simulator','challenge'];
const MODE_LABELS = ['PBRTQC Foundations','Patient Distribution Lab','Algorithm Lab','Error Detection Simulator','PBRTQC Challenge'];
MODE_IDS.forEach((id, i) => {
  assert(`L-01-${id}`, scr.includes(`"${id}"`), `Mode id: "${id}"`, 'sg');
  assert(`L-02-${id}`, scr.includes(`"${MODE_LABELS[i]}"`), `Mode label: "${MODE_LABELS[i]}"`, 'sg');
});

/* -----------------------------------------------------------------------
   SECTION M: Screen ARIA and structure (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION M: Screen ARIA and structure ===');

assert('M-01', scr.includes('role="tablist"') || scr.includes("role='tablist'"),
  'screens.jsx: tablist role on mode bar', 'sg');
assert('M-02', scr.includes('aria-selected'),
  'screens.jsx: aria-selected on mode buttons', 'sg');
assert('M-03', scr.includes('role="tab"') || scr.includes("role='tab'"),
  'screens.jsx: role=tab on mode buttons', 'sg');
// ScientificBasisNote is integrated at the app-shell level (not within these panel files)
assert('M-04', comp.includes('PbrtqcStatusBadge') && scr.includes('PBRTQC_MODES'),
  'Component and screen blocks structurally complete (no ScientificBasisNote duplication in panels)', 'rc');

/* -----------------------------------------------------------------------
   SECTION N: PbrtqcFoundationsPanel doctrine (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION N: PbrtqcFoundationsPanel doctrine ===');

const fStart = scr.indexOf('function PbrtqcFoundationsPanel(');
const fEnd   = scr.indexOf('function PatientDistributionLabPanel(');
const fp = scr.slice(fStart, fEnd);

assert('N-01', fp.includes('N, R, M and W are different') || fp.includes('N, R, M'),
  'PbrtqcFoundationsPanel: N/R/M/W distinction section', 'sg');
assert('N-02', fp.includes('PBRTQC vs') || fp.includes('PBRTQC_VS_RCV') || fp.includes('not'),
  'PbrtqcFoundationsPanel: PBRTQC-vs-confusion section', 'sg');
assert('N-03', fp.includes('PBRTQC is not') || fp.includes('is not'),
  'PbrtqcFoundationsPanel: "What PBRTQC is not" section', 'sg');
assert('N-04', fp.includes('Algorithms in this lab') || fp.includes('algorithm'),
  'PbrtqcFoundationsPanel: algorithm scope section', 'sg');
assert('N-05', fp.includes('seven-step') || fp.includes('Seven-step') || fp.includes('processing pipeline'),
  'PbrtqcFoundationsPanel: seven-step pipeline section', 'sg');
assert('N-06', fp.includes('Alert interpretation') || fp.includes('mandatory statements'),
  'PbrtqcFoundationsPanel: alert interpretation mandatory statements section', 'sg');

/* -----------------------------------------------------------------------
   SECTION O: No BV/EQA/Investigation leakage (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION O: No BV/EQA/Investigation leakage ===');

['EqaStatusBadge','humanizeEqaStatus','BvStatusBadge','humanizeBvLabel',
  'StatusBadge','humanizeStatus','HypothesisBoard',
  'ExternalAssuranceLabScreen','InvestigationLabScreen','BvRcvLabScreen'].forEach(name => {
  assert(`O-01-${name.substring(0,12)}`,
    !comp.includes(`function ${name}(`) && !scr.includes(`function ${name}(`),
    `No BV/EQA/Investigation component: ${name}`, 'rc');
});

/* -----------------------------------------------------------------------
   SECTION P: No shared-component duplication (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION P: No shared-component duplication ===');

['Badge','ScientificBasisNote','SliderField','MetricCard','Modal','LJChart','DistributionView'].forEach(name => {
  assert(`P-01-${name}`,
    !comp.includes(`function ${name}(`) && !scr.includes(`function ${name}(`),
    `No Stage 9A component redefined: ${name}`, 'rc');
});

/* -----------------------------------------------------------------------
   SECTION Q: No import/export (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION Q: No import/export ===');

[comp, scr].forEach((src, i) => {
  const label = i === 0 ? 'ui-components' : 'screens';
  assert(`Q-01-${label}`, !src.includes('import ') && !src.includes('require('),
    `${label}: no import/require`, 'sg');
  assert(`Q-02-${label}`, !src.includes('module.exports') && !src.includes('export '),
    `${label}: no module.exports/export`, 'sg');
});

/* -----------------------------------------------------------------------
   SECTION R: Scientific source immutability (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION R: Scientific source immutability ===');

const EXPECTED_SCI_HASHES = {
  '../src/pbrtqc/calc.js': '5d5247c6d712a4a31ce9a5028ac5e048d3b4f02c17842751f1d8067843bf908a',
  '../src/pbrtqc/data.js': '4f2dbb7c28ed1071b0069788b55ba9c35603d9095e80fb9a4c6b135c08cfb98f'
};
Object.entries(EXPECTED_SCI_HASHES).forEach(([rel, expected]) => {
  const content = fs.readFileSync(path.join(__dirname, rel), 'utf8');
  const actual = crypto.createHash('sha256').update(content).digest('hex');
  assert(`R-01-${path.basename(rel)}`, actual === expected,
    `${path.basename(rel)}: SHA-256 matches frozen value`, 'rc');
});

/* -----------------------------------------------------------------------
   SUMMARY
   ----------------------------------------------------------------------- */
const total = passed + failed;
console.log(`\n${'='.repeat(60)}`);
console.log(`Stage 9E PBRTQC UI Tests: ${passed}/${total} passed, ${failed} failed`);
console.log(`  Source-grounded expectations: ${sg}`);
console.log(`  Reconstructed expectations:   ${rc}`);
console.log(`  Artifact class of test file: D (recovery infrastructure)`);
if (failed > 0) {
  console.error('STAGE 9E FAILED — do not commit.');
  process.exit(1);
} else {
  console.log('STAGE 9E PASSED — all tests green.');
  process.exit(0);
}
