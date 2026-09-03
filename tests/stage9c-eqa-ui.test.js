/* =========================================================================
   tests/stage9c-eqa-ui.test.js

   NEW RECOVERY TESTS — Stage 9C (NOT the historical test suite)
   Tests for:
     src/eqa/ui-components.jsx  (Class A, HTML lines 9549-9892)
     src/eqa/screens.jsx        (Class A, HTML lines 9895-10403)

   ARTIFACT PROVENANCE: Class D (recovery infrastructure, not historical)

   TEST EXPECTATION PROVENANCE:
   SOURCE-GROUNDED (sg): exact function names, exact constants, exact mode
     IDs/labels, exact stage keys, exact component semantics, exact table
     headers, exact authored safeguard notes — directly from HTML source.
   RECONSTRUCTED (rc): source-fidelity byte comparisons, absence tests,
     no Investigation-UI leakage, no import/export, no build config.

   Run: node tests/stage9c-eqa-ui.test.js
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

const COMP_PATH   = path.join(__dirname, '../src/eqa/ui-components.jsx');
const SCREEN_PATH = path.join(__dirname, '../src/eqa/screens.jsx');
const HTML_PATH   = path.join(__dirname, '../recovery/original-v0.8.html');

const comp   = fs.readFileSync(COMP_PATH,   'utf8');
const scr    = fs.readFileSync(SCREEN_PATH, 'utf8');
const html   = fs.readFileSync(HTML_PATH,   'utf8').split('\n');

/* -----------------------------------------------------------------------
   SECTION A: SOURCE-FIDELITY REGRESSIONS (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION A: Source-fidelity regressions ===');

// Components: HTML lines 9549-9892 (0-indexed 9548:9892)
const compAuth = html.slice(9547, 9891).join('\n') + '\n';
assert('A-COMP', compAuth === comp,
  'eqa/ui-components.jsx exactly matches HTML lines 9548-9891', 'rc');

// Screens: HTML lines 9895-10403 (0-indexed 9894:10403)
const screenAuth = html.slice(9893, 10402).join('\n') + '\n';
assert('A-SCREEN', screenAuth === scr,
  'eqa/screens.jsx exactly matches HTML lines 9894-10402', 'rc');

/* -----------------------------------------------------------------------
   SECTION B: COMPONENT FUNCTION INVENTORY (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION B: Component function inventory ===');

const EXPECTED_COMP_FNS = [
  'humanizeEqaStatus','EqaStatusBadge','EqaStatusRow','EqaReportCard',
  'CommutabilityChallengeComponent','SchemeCapabilityProfileDisplay',
  'SchemeCapabilityProfileBuilder','LongitudinalEqaChart',
  'PairedComparisonTable','LongitudinalComparabilityTable'
];
const actualCompFns = [...comp.matchAll(/^function ([A-Za-z][A-Za-z0-9]*)\(/mg)].map(m=>m[1]);
assert('B-01', JSON.stringify(actualCompFns) === JSON.stringify(EXPECTED_COMP_FNS),
  'ui-components.jsx: exact 10-function inventory in order', 'sg');

/* -----------------------------------------------------------------------
   SECTION C: COMPONENT CONSTANT INVENTORY (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION C: Component constant inventory ===');

const EXPECTED_COMP_CONSTS = [
  'EQA_COMMUTABILITY_ICONS','EQA_CURRENT_STATUS_ICONS','EQA_LONGITUDINAL_ICONS',
  'EQA_COMPARABILITY_ICONS','EQA_INVESTIGATION_ICONS'
];
const actualCompConsts = [...comp.matchAll(/^const ([A-Z_][A-Z0-9_]*)\s*=/mg)].map(m=>m[1]);
assert('C-01', JSON.stringify(actualCompConsts) === JSON.stringify(EXPECTED_COMP_CONSTS),
  'ui-components.jsx: exact 5-constant inventory in order', 'sg');

// Five independent icon-map families (never sharing glyphs with Investigation StatusBadge)
assert('C-02', actualCompConsts.every(k => k.startsWith('EQA_')),
  'All component constants are EQA-prefixed (separate icon-map family)', 'sg');

/* -----------------------------------------------------------------------
   SECTION D: EqaStatusBadge — icon-map independence (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION D: EqaStatusBadge icon-map independence ===');

assert('D-01', comp.includes('aria-hidden'),
  'EqaStatusBadge: icon has aria-hidden (colour not sole carrier)', 'sg');
assert('D-02', comp.includes('humanizeEqaStatus('),
  'EqaStatusBadge: uses humanizeEqaStatus() for readable label', 'sg');
assert('D-03', comp.includes('EqaStatusBadge') && !comp.includes('function StatusBadge('),
  'EqaStatusBadge: distinct from Investigation StatusBadge (no redefinition)', 'sg');

/* -----------------------------------------------------------------------
   SECTION E: EqaReportCard — nine-row structured display (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION E: EqaReportCard ===');

const ercStart = comp.indexOf('function EqaReportCard(');
const ercEnd   = comp.indexOf('function CommutabilityChallengeComponent(');
const erc = comp.slice(ercStart, ercEnd);

const EXPECTED_ERC_ROWS = [
  'Participant result','Assigned value','Assigned value type','Commutability status',
  'Peer group','Peer-group mean','All-participant mean','SDPA','Performance criterion'
];
EXPECTED_ERC_ROWS.forEach(row => {
  assert(`E-01-${row.replace(/\W/g,'').substring(0,10)}`, erc.includes(row),
    `EqaReportCard row: "${row}"`, 'sg');
});
assert('E-02', erc.includes('TARGET_VALUE_TYPE_LABELS'),
  'EqaReportCard: uses TARGET_VALUE_TYPE_LABELS for assigned-value-type label', 'sg');
assert('E-03', erc.includes('No EQA result is authored for this case.'),
  'EqaReportCard: null-result guard message present', 'sg');

/* -----------------------------------------------------------------------
   SECTION F: CommutabilityChallengeComponent (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION F: CommutabilityChallengeComponent ===');

const ccStart = comp.indexOf('function CommutabilityChallengeComponent(');
const ccEnd   = comp.indexOf('function SchemeCapabilityProfileDisplay(');
const cc = comp.slice(ccStart, ccEnd);

assert('F-01', cc.includes('Does the EQA material behave like patient samples?'),
  'CommutabilityChallenge: exact question text', 'sg');
assert('F-02', cc.includes('Processed EQA sample'),
  'CommutabilityChallenge: "Processed EQA sample" table column', 'sg');
assert('F-03', cc.includes('ExerciseRevealCard'),
  'CommutabilityChallenge: uses ExerciseRevealCard for answer reveal', 'sg');
assert('F-04', cc.includes('EqaStatusBadge'),
  'CommutabilityChallenge: renders EqaStatusBadge for commutability status', 'sg');

/* -----------------------------------------------------------------------
   SECTION G: LongitudinalEqaChart SVG semantics (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION G: LongitudinalEqaChart SVG semantics ===');

const ljStart = comp.indexOf('function LongitudinalEqaChart(');
const ljEnd   = comp.indexOf('function PairedComparisonTable(');
const lj = comp.slice(ljStart, ljEnd);

assert('G-01', lj.includes('<svg'), 'LongitudinalEqaChart: SVG rendering (not canvas)', 'sg');
assert('G-02', !lj.includes('<canvas'), 'LongitudinalEqaChart: no canvas element', 'sg');
assert('G-03', lj.includes('role="img"') || lj.includes("role='img'"),
  'LongitudinalEqaChart: SVG has role="img"', 'sg');
assert('G-04', lj.includes('Show data table') || lj.includes('text alternative'),
  'LongitudinalEqaChart: text-alternative table for accessibility', 'sg');

/* -----------------------------------------------------------------------
   SECTION H: PairedComparisonTable headers (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION H: PairedComparisonTable ===');

const pctStart = comp.indexOf('function PairedComparisonTable(');
const pctEnd   = comp.indexOf('function LongitudinalComparabilityTable(');
const pct = comp.slice(pctStart, pctEnd);

const EXPECTED_PCT_HEADERS = [
  'Specimen','Analyzer A (designated comparator)','Analyzer B',
  'Difference (B \u2212 A)','Relative difference'
];
EXPECTED_PCT_HEADERS.forEach(h => {
  assert(`H-01-${h.replace(/\W/g,'').substring(0,10)}`, pct.includes(h),
    `PairedComparisonTable: column header "${h}"`, 'sg');
});
assert('H-02', pct.includes('designated comparator'),
  'PairedComparisonTable: "designated comparator" label (not "reference method")', 'sg');

/* -----------------------------------------------------------------------
   SECTION I: Screen function inventory (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION I: Screen function inventory ===');

const EXPECTED_SCREEN_FNS = [
  'IqcVsEqaPanel','EqaTargetLabPanel','EqaReportExample',
  'EqaReportInterpreterPanel','ComparabilityLabPanel',
  'canAdvanceEqaStage','LongitudinalChallengePanel','ExternalAssuranceLabScreen'
];
const actualScrFns = [...scr.matchAll(/^function ([A-Za-z][A-Za-z0-9]*)\(/mg)].map(m=>m[1]);
assert('I-01', JSON.stringify(actualScrFns) === JSON.stringify(EXPECTED_SCREEN_FNS),
  'screens.jsx: exact 8-function inventory in order', 'sg');

/* -----------------------------------------------------------------------
   SECTION J: Screen constant inventory (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION J: Screen constant inventory ===');

const EXPECTED_SCREEN_CONSTS = [
  'EXTERNAL_ASSURANCE_MODES','EQA_STAGE_LABELS','DEFAULT_EQA_CASE_ANSWER'
];
const actualScrConsts = [...scr.matchAll(/^const ([A-Z_][A-Z0-9_]*)\s*=/mg)].map(m=>m[1]);
assert('J-01', JSON.stringify(actualScrConsts) === JSON.stringify(EXPECTED_SCREEN_CONSTS),
  'screens.jsx: exact 3-constant inventory in order', 'sg');

/* -----------------------------------------------------------------------
   SECTION K: Exact five EQA modes (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION K: Five EQA modes ===');

const MODE_IDS    = ['iqc-vs-eqa','target-lab','report-interpreter','comparability-lab','longitudinal-challenge'];
const MODE_LABELS = ['IQC vs EQA','EQA Target Lab','EQA Report Interpreter','Comparability Lab','Longitudinal Challenge'];
MODE_IDS.forEach((id, i) => {
  assert(`K-01-${id}`, scr.includes(`"${id}"`), `Mode id: "${id}"`, 'sg');
  assert(`K-02-${id}`, scr.includes(`"${MODE_LABELS[i]}"`), `Mode label: "${MODE_LABELS[i]}"`, 'sg');
});

/* -----------------------------------------------------------------------
   SECTION L: EQA_STAGE_LABELS keys (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION L: EQA_STAGE_LABELS keys ===');

const STAGE_KEYS = ['target','commutability','capability','pattern','longitudinal','"next-step"','confidence'];
STAGE_KEYS.forEach(k => {
  assert(`L-01-${k}`, scr.includes(k), `Stage key: ${k}`, 'sg');
});
assert('L-02', scr.includes('"next-step": "Next step"'), 'EQA_STAGE_LABELS: "next-step": "Next step" exact', 'sg');

/* -----------------------------------------------------------------------
   SECTION M: DEFAULT_EQA_CASE_ANSWER fields (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION M: DEFAULT_EQA_CASE_ANSWER fields ===');

const DCA_KEYS = ['stageIdx','targetTypeId','commutabilityJudgementId','capabilityConclusionId',
  'patternJudgementId','longitudinalRelevanceId','nextActionId','confidence','completed'];
DCA_KEYS.forEach(k => {
  assert(`M-01-${k}`, scr.includes(k), `DEFAULT_EQA_CASE_ANSWER key: ${k}`, 'sg');
});

/* -----------------------------------------------------------------------
   SECTION N: canAdvanceEqaStage gating (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION N: canAdvanceEqaStage gating ===');

const casStart = scr.indexOf('function canAdvanceEqaStage(');
const casEnd   = scr.indexOf('function LongitudinalChallengePanel(');
const cas = scr.slice(casStart, casEnd);

['target','commutability','capability','pattern','longitudinal','next-step'].forEach(s => {
  assert(`N-01-${s}`, cas.includes(`"${s}"`), `canAdvanceEqaStage: stage "${s}" gate`, 'sg');
});
assert('N-02', cas.includes('return false'), 'canAdvanceEqaStage: default returns false', 'sg');

/* -----------------------------------------------------------------------
   SECTION O: ExternalAssuranceLabScreen ARIA (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION O: ExternalAssuranceLabScreen ARIA ===');

assert('O-01', scr.includes('<h1>External Assurance Lab</h1>'),
  'ExternalAssuranceLabScreen: <h1>External Assurance Lab</h1>', 'sg');
assert('O-02', scr.includes('role="tablist"'),
  'ExternalAssuranceLabScreen: tablist role on mode bar', 'sg');
assert('O-03', scr.includes('role="tab"'),
  'ExternalAssuranceLabScreen: role="tab" on mode buttons', 'sg');
assert('O-04', scr.includes('aria-selected'),
  'ExternalAssuranceLabScreen: aria-selected on mode buttons', 'sg');
assert('O-05', scr.includes('ScientificBasisNote'),
  'ExternalAssuranceLabScreen: ScientificBasisNote integrated', 'sg');

/* -----------------------------------------------------------------------
   SECTION P: Authored safeguard notes (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION P: Authored safeguard notes ===');

assert('P-01', comp.includes('NO_AUTO_PATIENT_IMPACT_FROM_EQA_NOTE') || scr.includes('NO_AUTO_PATIENT_IMPACT_FROM_EQA_NOTE'),
  'NO_AUTO_PATIENT_IMPACT_FROM_EQA_NOTE preserved', 'sg');
assert('P-02', comp.includes('UNKNOWN_NOT_EQUAL_FAILED_NOTE') || scr.includes('UNKNOWN_NOT_EQUAL_FAILED_NOTE'),
  'UNKNOWN_NOT_EQUAL_FAILED_NOTE: commutability-not-established ≠ noncommutable', 'sg');

/* -----------------------------------------------------------------------
   SECTION Q: No Investigation UI leakage (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION Q: No Investigation UI leakage ===');

['humanizeStatus','StatusBadge','StatusRow','HypothesisBoard',
  'EventTimeline','PatientImpactTable','TwoTimelineDiagram',
  'InvestigationLabScreen','canAdvanceStage'].forEach(name => {
  assert(`Q-01-${name.substring(0,12)}`,
    !comp.includes(`function ${name}(`) && !scr.includes(`function ${name}(`),
    `No Investigation component: ${name}`, 'rc');
});

/* -----------------------------------------------------------------------
   SECTION R: No shared-component duplication (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION R: No shared-component duplication ===');

['Badge','ScientificBasisNote','SliderField','MetricCard','Modal','LJChart','DistributionView'].forEach(name => {
  assert(`R-01-${name}`,
    !comp.includes(`function ${name}(`) && !scr.includes(`function ${name}(`),
    `No Stage 9A component redefined: ${name}`, 'rc');
});

/* -----------------------------------------------------------------------
   SECTION S: No import/export (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION S: No import/export wrapper ===');

[comp, scr].forEach((src, i) => {
  const label = i === 0 ? 'ui-components' : 'screens';
  assert(`S-01-${label}`, !src.includes('import ') && !src.includes('require('),
    `${label}: no import/require`, 'sg');
  assert(`S-02-${label}`, !src.includes('module.exports') && !src.includes('export '),
    `${label}: no module.exports/export`, 'sg');
});

/* -----------------------------------------------------------------------
   SECTION T: Scientific source immutability (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION T: Scientific source immutability ===');

const EXPECTED_SCI_HASHES = {
  '../src/eqa/calc.js':  '5eca4130aff6a3eaee7972ceb45234bb0ccce073b293dc7c4ee3ac3a9853021f',
  '../src/eqa/data.js':  '465ba7674103b9f5a5f5a13dd1cdddefe23ce68abac54ded3c114a0671f99333'
};
Object.entries(EXPECTED_SCI_HASHES).forEach(([rel, expected]) => {
  const content = fs.readFileSync(path.join(__dirname, rel), 'utf8');
  const actual = crypto.createHash('sha256').update(content).digest('hex');
  assert(`T-01-${path.basename(rel)}`, actual === expected,
    `${path.basename(rel)}: SHA-256 matches frozen value`, 'rc');
});

/* -----------------------------------------------------------------------
   SECTION U: No build configuration (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION U: No build configuration ===');

['package.json','webpack.config.js','vite.config.js','babel.config.js'].forEach(f => {
  assert(`U-01-${f.replace(/[^a-zA-Z]/g,'').substring(0,8)}`,
    !fs.existsSync(path.join(__dirname, '..', f)),
    `No build config: ${f}`, 'rc');
});

/* -----------------------------------------------------------------------
   SUMMARY
   ----------------------------------------------------------------------- */
const total = passed + failed;
console.log(`\n${'='.repeat(60)}`);
console.log(`Stage 9C EQA UI Tests: ${passed}/${total} passed, ${failed} failed`);
console.log(`  Source-grounded expectations: ${sg}`);
console.log(`  Reconstructed expectations:   ${rc}`);
console.log(`  Artifact class of test file: D (recovery infrastructure)`);
if (failed > 0) {
  console.error('STAGE 9C FAILED — do not commit.');
  process.exit(1);
} else {
  console.log('STAGE 9C PASSED — all tests green.');
  process.exit(0);
}
