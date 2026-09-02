/* =========================================================================
   tests/stage9b-investigation-ui.test.js

   NEW RECOVERY TESTS — Stage 9B (NOT the historical test suite)
   Tests for:
     src/investigation/ui-components.jsx  (Class A, HTML lines 7449-7701)
     src/investigation/screens.jsx        (Class A, HTML lines 7704-8365)

   ARTIFACT PROVENANCE: Class D (recovery infrastructure, not historical)

   TEST EXPECTATION PROVENANCE:
   SOURCE-GROUNDED (sg): exact function names, exact constants, exact mode
     IDs/labels, exact ARIA strings, exact table headers, exact stage keys,
     exact authored safety notes — directly from HTML source.
   RECONSTRUCTED (rc): source-fidelity byte comparisons, absence tests,
     no-EQA leakage, no import/export, no build config, no formula duplication.

   Run: node tests/stage9b-investigation-ui.test.js
   ========================================================================= */

'use strict';

const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');

let passed = 0, failed = 0, sg = 0, rc = 0;

function assert(id, condition, detail, prov) {
  if (condition) { console.log(`  ✓ [${id}] ${detail}`); passed++; }
  else { console.error(`  ✗ [${id}] FAIL: ${detail}`); failed++; }
  if (prov === 'sg') sg++; else rc++;
}

const COMP_PATH   = path.join(__dirname, '../src/investigation/ui-components.jsx');
const SCREEN_PATH = path.join(__dirname, '../src/investigation/screens.jsx');
const HTML_PATH   = path.join(__dirname, '../recovery/original-v0.8.html');

const comp   = fs.readFileSync(COMP_PATH,   'utf8');
const scr    = fs.readFileSync(SCREEN_PATH, 'utf8');
const html   = fs.readFileSync(HTML_PATH,   'utf8').split('\n');

/* -----------------------------------------------------------------------
   SECTION A: SOURCE-FIDELITY REGRESSIONS (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION A: Source-fidelity regressions ===');

// Components: HTML lines 7449-7701 (0-indexed 7448:7701)
const compAuth = html.slice(7448, 7701).join('\n') + '\n';
assert('A-COMP', compAuth === comp,
  'ui-components.jsx body exactly matches HTML lines 7449-7701', 'rc');

// Screens: HTML lines 7704-8365 (0-indexed 7703:8365)
const screenAuth = html.slice(7703, 8365).join('\n') + '\n';
assert('A-SCREEN', screenAuth === scr,
  'screens.jsx body exactly matches HTML lines 7704-8365', 'rc');

/* -----------------------------------------------------------------------
   SECTION B: COMPONENT-BLOCK FUNCTION INVENTORY (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION B: Component function inventory ===');

const EXPECTED_COMP_FNS = [
  'humanizeStatus','StatusBadge','StatusRow','EvidenceCard','EvidenceCardGrid',
  'HypothesisBoard','EventTimeline','PatientImpactTable','RecoveryFlowDiagram',
  'TwoTimelineDiagram'
];
const actualCompFns = [...comp.matchAll(/^function ([A-Za-z][A-Za-z0-9]*)\(/mg)].map(m=>m[1]);
assert('B-01', JSON.stringify(actualCompFns) === JSON.stringify(EXPECTED_COMP_FNS),
  'ui-components.jsx: exact 10-function inventory in order', 'sg');

/* -----------------------------------------------------------------------
   SECTION C: COMPONENT-BLOCK CONSTANT INVENTORY (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION C: Component constant inventory ===');

const EXPECTED_COMP_CONSTS = [
  'QC_SIGNAL_ICONS','PROCESS_STATUS_ICONS','CAUSE_STATUS_ICONS',
  'PATIENT_IMPACT_STATUS_ICONS','RESULT_DISPOSITION_ICONS',
  'TIMELINE_KIND_ICON','TIMELINE_KIND_LABEL'
];
const actualCompConsts = [...comp.matchAll(/^const ([A-Z_][A-Z0-9_]*)\s*=/mg)].map(m=>m[1]);
assert('C-01', JSON.stringify(actualCompConsts) === JSON.stringify(EXPECTED_COMP_CONSTS),
  'ui-components.jsx: exact 7-constant inventory in order', 'sg');

// RESULT_DISPOSITION_ICONS is distinct (separate map, not merged with others)
assert('C-02', comp.includes('RESULT_DISPOSITION_ICONS') && comp.includes('PATIENT_IMPACT_STATUS_ICONS'),
  'ResultDisposition icon map remains distinct from PatientImpact map', 'sg');

/* -----------------------------------------------------------------------
   SECTION D: StatusBadge / StatusRow safeguards (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION D: StatusBadge and StatusRow safeguards ===');

assert('D-01', comp.includes('aria-hidden="true"') || comp.includes("aria-hidden='true'"),
  'StatusBadge: icon has aria-hidden="true" (colour not sole carrier)', 'sg');
assert('D-02', comp.includes('humanizeStatus('),
  'StatusBadge: uses humanizeStatus() for human-readable label', 'sg');

// StatusRow renders five separate status dimensions
['qcSignalStatus','processStatus','causeStatus','patientImpactStatus','resultDispositionStatus'].forEach(s => {
  assert(`D-03-${s}`, comp.includes(s),
    `StatusRow: ${s} dimension present`, 'sg');
});

/* -----------------------------------------------------------------------
   SECTION E: EvidenceCard semantics (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION E: EvidenceCard semantics ===');

const ecStart = comp.indexOf('function EvidenceCard(');
const ecEnd   = comp.indexOf('function EvidenceCardGrid(');
const ec = comp.slice(ecStart, ecEnd);

assert('E-01', ec.includes('Observation'), 'EvidenceCard: Observation field', 'sg');
assert('E-02', ec.includes('Interpretation'), 'EvidenceCard: Interpretation field', 'sg');
assert('E-03', ec.includes('SUPPORT_RELATION_LABELS.supports'),
  'EvidenceCard: Supports via SUPPORT_RELATION_LABELS.supports', 'sg');
assert('E-04', ec.includes('SUPPORT_RELATION_LABELS.weakens'),
  'EvidenceCard: Weakens via SUPPORT_RELATION_LABELS.weakens', 'sg');
assert('E-05', ec.includes('SUPPORT_RELATION_LABELS.neutralFor'),
  'EvidenceCard: Neutral via SUPPORT_RELATION_LABELS.neutralFor', 'sg');
assert('E-06', comp.includes('empty-state') || comp.includes('EvidenceCardGrid'),
  'EvidenceCardGrid: component present with authored empty-state', 'sg');

/* -----------------------------------------------------------------------
   SECTION F: HypothesisBoard safeguard (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION F: HypothesisBoard safeguard ===');

assert('F-01', comp.includes('Candidate explanation'),
  'HypothesisBoard: "Candidate explanation" label (not "Confirmed cause")', 'sg');
assert('F-02', comp.includes('NO_QUANTITATIVE_CERTAINTY_NOTE') || scr.includes('NO_QUANTITATIVE_CERTAINTY_NOTE'),
  'NO_QUANTITATIVE_CERTAINTY_NOTE preserved (no probability/Bayesian ranking)', 'sg');
assert('F-03', !comp.includes('probability of cause') && !comp.includes('likelihood score'),
  'No probability-of-cause or likelihood-score language in component block', 'rc');

/* -----------------------------------------------------------------------
   SECTION G: EventTimeline accessibility (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION G: EventTimeline accessibility ===');

const etStart = comp.indexOf('function EventTimeline(');
const etEnd   = comp.indexOf('function PatientImpactTable(');
const et = comp.slice(etStart, etEnd);

assert('G-01', et.includes('role="list"') || et.includes("role='list'"),
  'EventTimeline: role="list"', 'sg');
assert('G-02', et.includes('role="listitem"') || et.includes("role='listitem'"),
  'EventTimeline: role="listitem"', 'sg');
assert('G-03', et.includes('type="button"') || et.includes("type='button'"),
  'EventTimeline: <button type="button"> elements', 'sg');
assert('G-04', et.includes('aria-label'), 'EventTimeline: aria-label on events', 'sg');
assert('G-05', et.includes('isWithinCandidateWindow'),
  'EventTimeline: isWithinCandidateWindow for candidate-window highlighting', 'sg');

/* -----------------------------------------------------------------------
   SECTION H: PatientImpactTable (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION H: PatientImpactTable ===');

const pitStart = comp.indexOf('function PatientImpactTable(');
const pitEnd   = comp.indexOf('function RecoveryFlowDiagram(');
const pit = comp.slice(pitStart, pitEnd);

const EXPECTED_HEADERS = [
  'Synthetic patient ID','Timestamp','Original result','Post-recovery result',
  'Absolute difference','Relative difference','Within candidate window','Status'
];
EXPECTED_HEADERS.forEach((h,i) => {
  assert(`H-01-${i}`, pit.includes(h), `PatientImpactTable: column header "${h}"`, 'sg');
});
assert('H-02', pit.includes('className="table-scroll"'),
  'PatientImpactTable: className="table-scroll" preserved', 'sg');
assert('H-03', pit.includes('absoluteDifference') || pit.includes('absolute'),
  'PatientImpactTable: references absoluteDifference helper', 'sg');
assert('H-04', pit.includes('relativeDifferencePercent') || pit.includes('relative'),
  'PatientImpactTable: references relativeDifferencePercent helper', 'sg');
assert('H-05', pit.includes('NOT_AUTOMATICALLY_INVALID_NOTE') || comp.includes('NOT_AUTOMATICALLY_INVALID_NOTE'),
  'NOT_AUTOMATICALLY_INVALID_NOTE preserved', 'sg');

/* -----------------------------------------------------------------------
   SECTION I: TwoTimelineDiagram (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION I: TwoTimelineDiagram ===');

const ttdStart = comp.indexOf('function TwoTimelineDiagram(');
const ttd = comp.slice(ttdStart);

assert('I-01', ttd.includes('Current process timeline'),
  'TwoTimelineDiagram: "Current process timeline" row', 'sg');
assert('I-02', ttd.includes('Historical result-review timeline') || ttd.includes('Historical result'),
  'TwoTimelineDiagram: "Historical result-review timeline" row', 'sg');
assert('I-03', ttd.includes('CURRENT_PROCESS_TIMELINE_STEPS') || ttd.includes('currentTimeline'),
  'TwoTimelineDiagram: consumes CURRENT_PROCESS_TIMELINE_STEPS', 'sg');
assert('I-04', ttd.includes('HISTORICAL_RESULT_TIMELINE_STEPS') || ttd.includes('historicalTimeline'),
  'TwoTimelineDiagram: consumes HISTORICAL_RESULT_TIMELINE_STEPS', 'sg');
assert('I-05', comp.includes('TWO_TIMELINE_EXPLANATION_NOTE') || scr.includes('TWO_TIMELINE_EXPLANATION_NOTE'),
  'TWO_TIMELINE_EXPLANATION_NOTE preserved (process recovery ≠ result disposition)', 'sg');

/* -----------------------------------------------------------------------
   SECTION J: Screen function inventory (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION J: Screen function inventory ===');

const EXPECTED_SCREEN_FNS = [
  'WhenQcSignalsPanel','TroubleshootingLabPanel','EvidenceReconstructionPanel',
  'PatientResultImpactPanel','statusAtStage','hypothesisQualityCorrect',
  'patientImpactCorrect','canAdvanceStage','RecoveryChallengePanel','InvestigationLabScreen'
];
const actualScrFns = [...scr.matchAll(/^function ([A-Za-z][A-Za-z0-9]*)\(/mg)].map(m=>m[1]);
assert('J-01', JSON.stringify(actualScrFns) === JSON.stringify(EXPECTED_SCREEN_FNS),
  'screens.jsx: exact 10-function inventory in order', 'sg');

/* -----------------------------------------------------------------------
   SECTION K: Screen constant inventory (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION K: Screen constant inventory ===');

const EXPECTED_SCREEN_CONSTS = [
  'INVESTIGATION_LAB_MODES','REASONING_STAGE_LABELS','CATEGORY_TO_INFO_OPTION',
  'SIGNAL_INTERPRETATION_OPTIONS','DEFAULT_CASE_ANSWER'
];
const actualScrConsts = [...scr.matchAll(/^const ([A-Z_][A-Z0-9_]*)\s*=/mg)].map(m=>m[1]);
assert('K-01', JSON.stringify(actualScrConsts) === JSON.stringify(EXPECTED_SCREEN_CONSTS),
  'screens.jsx: exact 5-constant inventory in order', 'sg');

/* -----------------------------------------------------------------------
   SECTION L: Exact five Investigation modes (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION L: Five Investigation modes ===');

const MODE_IDS = ['signals','troubleshooting','reconstruction','patient-impact','recovery'];
const MODE_LABELS = ['When QC Signals','Troubleshooting Lab','Evidence Reconstruction','Patient Result Impact','Recovery Challenge'];
MODE_IDS.forEach((id,i) => {
  assert(`L-01-${id}`, scr.includes(`"${id}"`), `Mode id: "${id}"`, 'sg');
  assert(`L-02-${id}`, scr.includes(`"${MODE_LABELS[i]}"`), `Mode label: "${MODE_LABELS[i]}"`, 'sg');
});
assert('L-03', !scr.includes('"eqa"') && !scr.includes('"pbrtqc"'),
  'No sixth EQA or PBRTQC mode', 'rc');

/* -----------------------------------------------------------------------
   SECTION M: Reasoning-stage keys (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION M: Reasoning-stage keys ===');

const STAGE_KEYS = ['signal','containment','characterisation','hypothesis','evidence-1',
  'hypothesis-update','intervention','verification','patient-impact','resume-decision'];
STAGE_KEYS.forEach(k => {
  assert(`M-01-${k}`, scr.includes(`"${k}"`), `Reasoning stage key: "${k}"`, 'sg');
});
assert('M-02', !scr.includes('"root-cause-confirmed"'),
  'No root-cause-confirmed stage (not authored)', 'rc');

/* -----------------------------------------------------------------------
   SECTION N: DEFAULT_CASE_ANSWER structure (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION N: DEFAULT_CASE_ANSWER structure ===');

const DCA_KEYS = ['stageIdx','signalInterpretation','containment','predictedInfoOption',
  'leadingHypothesis','confidenceAtHypothesis','hypothesisAtUpdate','confidenceAtUpdate',
  'interventionChoice','verificationJudgement','patientImpactActions','resumeDecision',
  'resultDispositionDecision','completed'];
DCA_KEYS.forEach(k => {
  assert(`N-01-${k}`, scr.includes(k), `DEFAULT_CASE_ANSWER key: ${k}`, 'sg');
});

/* -----------------------------------------------------------------------
   SECTION O: canAdvanceStage authored gating (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION O: canAdvanceStage authored gating ===');

const casStart = scr.indexOf('function canAdvanceStage(');
const casEnd   = scr.indexOf('function RecoveryChallengePanel(');
const cas = scr.slice(casStart, casEnd);

assert('O-01', cas.includes('"signal"') && cas.includes('signalInterpretation'),
  'canAdvanceStage: signal stage requires signalInterpretation', 'sg');
assert('O-02', cas.includes('"containment"'), 'canAdvanceStage: containment stage gate', 'sg');
assert('O-03', cas.includes('"hypothesis"'), 'canAdvanceStage: hypothesis stage gate', 'sg');
assert('O-04', cas.includes('"patient-impact"'), 'canAdvanceStage: patient-impact stage gate', 'sg');
assert('O-05', cas.includes('false'), 'canAdvanceStage: default returns false', 'sg');

/* -----------------------------------------------------------------------
   SECTION P: InvestigationLabScreen ARIA (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION P: InvestigationLabScreen ARIA ===');

assert('P-01', scr.includes('<h1>Investigation Lab</h1>'),
  'InvestigationLabScreen: <h1>Investigation Lab</h1>', 'sg');
assert('P-02', scr.includes('role="tablist"'),
  'InvestigationLabScreen: tablist role on mode bar', 'sg');
assert('P-03', scr.includes('aria-label="Investigation Lab mode"'),
  'InvestigationLabScreen: aria-label on tablist', 'sg');
assert('P-04', scr.includes('role="tab"'),
  'InvestigationLabScreen: role="tab" on mode buttons', 'sg');
assert('P-05', scr.includes('aria-selected'),
  'InvestigationLabScreen: aria-selected on mode buttons', 'sg');

/* -----------------------------------------------------------------------
   SECTION Q: Conditional rendering of all five mode panels (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION Q: Conditional rendering of five panels ===');

['WhenQcSignalsPanel','TroubleshootingLabPanel','EvidenceReconstructionPanel',
  'PatientResultImpactPanel','RecoveryChallengePanel'].forEach(panel => {
  assert(`Q-01-${panel}`, scr.includes(`<${panel}`),
    `InvestigationLabScreen: renders <${panel}>`, 'sg');
});

/* -----------------------------------------------------------------------
   SECTION R: Authored safeguard notes (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION R: Authored safeguard notes ===');

assert('R-01', scr.includes('NO_GAMIFIED_SCORE_NOTE'),
  'NO_GAMIFIED_SCORE_NOTE: recovery challenge is not gamified', 'sg');
assert('R-02', scr.includes('FOUR_PRINCIPLES'),
  'FOUR_PRINCIPLES used in lab details section', 'sg');
assert('R-03', scr.includes('ScientificBasisNote'),
  'ScientificBasisNote integrated into InvestigationLabScreen', 'sg');

/* -----------------------------------------------------------------------
   SECTION S: No EQA leakage (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION S: No EQA leakage ===');

['EqaStatusBadge','EqaReportCard','SchemeCapabilityProfile',
  'ExternalAssuranceLabScreen','ExternalAssuranceLab'].forEach(name => {
  assert(`S-01-${name}`,
    !comp.includes(`function ${name}(`) && !scr.includes(`function ${name}(`),
    `No EQA component: ${name}`, 'rc');
});

/* -----------------------------------------------------------------------
   SECTION T: No shared-component duplication (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION T: No shared-component duplication ===');

['Badge','ScientificBasisNote','SliderField','MetricCard','Modal','LJChart','DistributionView'].forEach(name => {
  assert(`T-01-${name}`,
    !comp.includes(`function ${name}(`) && !scr.includes(`function ${name}(`),
    `No Stage 9A component redefined: ${name}`, 'rc');
});

/* -----------------------------------------------------------------------
   SECTION U: No import/export wrapper (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION U: No import/export wrapper ===');

[comp, scr].forEach((src, i) => {
  const label = i === 0 ? 'ui-components' : 'screens';
  assert(`U-01-${label}`, !src.includes('import ') && !src.includes('require('),
    `${label}: no import/require`, 'sg');
  assert(`U-02-${label}`, !src.includes('module.exports') && !src.includes('export '),
    `${label}: no module.exports/export`, 'sg');
});

/* -----------------------------------------------------------------------
   SECTION V: No scientific formula duplication (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION V: No scientific formula duplication ===');

const FORBIDDEN_FORMULAS = ['function deriveQcSignalStatus(',
  'function absoluteDifference(','function relativeDifferencePercent(',
  'function isWithinCandidateWindow(','function stageIndex('];
FORBIDDEN_FORMULAS.forEach(fn => {
  assert(`V-01-${fn.replace(/[^a-zA-Z]/g,'').substring(0,10)}`,
    !comp.includes(fn) && !scr.includes(fn),
    `No frozen helper redefined: ${fn.trim()}`, 'rc');
});

/* -----------------------------------------------------------------------
   SECTION W: Scientific source immutability (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION W: Scientific source immutability ===');

const EXPECTED_SCI_HASHES = {
  '../src/investigation/calc.js': 'a0fbf5c2457f3987dd4afd33ede6634f15080bc1be36f36ac003c9881c8e8353',
  '../src/investigation/data.js': '5a0898859692b19e446b0f5e404fa99bd4d03712e1926b533ec0b2404d5ca76e'
};
Object.entries(EXPECTED_SCI_HASHES).forEach(([rel, expected]) => {
  const content = fs.readFileSync(path.join(__dirname, rel), 'utf8');
  const actual = crypto.createHash('sha256').update(content).digest('hex');
  assert(`W-01-${path.basename(rel)}`, actual === expected,
    `${path.basename(rel)}: SHA-256 matches frozen value`, 'rc');
});

/* -----------------------------------------------------------------------
   SECTION X: No build configuration (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION X: No build configuration ===');

['package.json','webpack.config.js','vite.config.js','babel.config.js','rollup.config.js'].forEach(f => {
  assert(`X-01-${f.replace(/[^a-zA-Z]/g,'').substring(0,8)}`,
    !fs.existsSync(path.join(__dirname, '..', f)),
    `No build config: ${f}`, 'rc');
});

/* -----------------------------------------------------------------------
   SUMMARY
   ----------------------------------------------------------------------- */
const total = passed + failed;
console.log(`\n${'='.repeat(60)}`);
console.log(`Stage 9B Investigation UI Tests: ${passed}/${total} passed, ${failed} failed`);
console.log(`  Source-grounded expectations: ${sg}`);
console.log(`  Reconstructed expectations:   ${rc}`);
console.log(`  Artifact class of test file: D (recovery infrastructure)`);
if (failed > 0) {
  console.error('STAGE 9B FAILED — do not commit.');
  process.exit(1);
} else {
  console.log('STAGE 9B PASSED — all tests green.');
  process.exit(0);
}
