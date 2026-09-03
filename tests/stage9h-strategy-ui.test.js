/* =========================================================================
   tests/stage9h-strategy-ui.test.js

   NEW RECOVERY TESTS — Stage 9H (NOT the historical test suite)
   Tests for:
     src/strategy/aps-ui-data.js    (Class A fragment, HTML lines 4086-4151)
     src/strategy/ui-components.jsx (Class A, HTML lines 4675-4796)
     src/strategy/screens.jsx       (Class A, HTML lines 4799-5338)

   ARTIFACT PROVENANCE: Class D (recovery infrastructure, not historical)

   TEST EXPECTATION PROVENANCE:
   SOURCE-GROUNDED (sg): exact function/constant inventories, exact mode
     labels, exact APS option IDs, exact counts, exact authored strings.
   RECONSTRUCTED (rc): source-fidelity byte comparisons, absence tests,
     no-duplication guards, block-completeness guards.

   Run: node tests/stage9h-strategy-ui.test.js
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

const APS_PATH  = path.join(__dirname, '../src/strategy/aps-ui-data.js');
const COMP_PATH = path.join(__dirname, '../src/strategy/ui-components.jsx');
const SCR_PATH  = path.join(__dirname, '../src/strategy/screens.jsx');
const HTML_PATH = path.join(__dirname, '../recovery/original-v0.8.html');

const aps  = fs.readFileSync(APS_PATH,  'utf8');
const comp = fs.readFileSync(COMP_PATH, 'utf8');
const scr  = fs.readFileSync(SCR_PATH,  'utf8');
const html = fs.readFileSync(HTML_PATH, 'utf8').split('\n');

/* -----------------------------------------------------------------------
   SECTION A: SOURCE-FIDELITY (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION A: Source-fidelity ===');

const apsAuth  = html.slice(4085, 4151).join('\n') + '\n';
assert('A-APS',  apsAuth  === aps,  'aps-ui-data.js exactly matches HTML lines 4086-4151', 'rc');
const compAuth = html.slice(4674, 4796).join('\n') + '\n';
assert('A-COMP', compAuth === comp, 'ui-components.jsx exactly matches HTML lines 4675-4796', 'rc');
const scrAuth  = html.slice(4798, 5338).join('\n') + '\n';
assert('A-SCR',  scrAuth  === scr,  'screens.jsx exactly matches HTML lines 4799-5338', 'rc');

/* -----------------------------------------------------------------------
   SECTION B: BLOCK-COMPLETENESS GUARDS (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION B: Block-completeness guards ===');

assert('B-01-aps', aps.startsWith('const SPEC_SOURCE_CAUTION'),
  'aps-ui-data.js: starts with const SPEC_SOURCE_CAUTION (source fragment)', 'sg');
assert('B-02-aps', aps.includes('APS_CLASSIFICATION_CASES'),
  'aps-ui-data.js: APS_CLASSIFICATION_CASES present (final constant)', 'sg');
assert('B-03-aps', !aps.includes('const MILAN_MODELS'),
  'aps-ui-data.js: MILAN_MODELS NOT redefined (frozen in strategy/core.js)', 'rc');
assert('B-04-comp', comp.startsWith('/* ========================================================================='),
  'ui-components.jsx: begins with complete opening delimiter', 'rc');
assert('B-05-comp', comp.includes('function ComparatorTable('),
  'ui-components.jsx: final function ComparatorTable present', 'sg');
assert('B-06-comp', !comp.includes('function ExerciseRevealCard(') && !comp.includes('STRATEGY_LAB_MODES'),
  'ui-components.jsx: Strategy screen block absent', 'rc');
assert('B-07-scr', scr.startsWith('/* ========================================================================='),
  'screens.jsx: begins with complete opening delimiter', 'rc');
assert('B-08-scr', scr.includes('function QCStrategyLabScreen('),
  'screens.jsx: final function QCStrategyLabScreen present', 'sg');
assert('B-09-scr', !scr.includes('expectedQcEventsToDetection') && !scr.includes('expectedPatientSamples'),
  'screens.jsx: detection-delay content absent', 'rc');

/* -----------------------------------------------------------------------
   SECTION C: APS UI-DATA FRAGMENT INVENTORY (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION C: APS UI-data inventory ===');

const actualApsConsts = [...aps.matchAll(/^const ([A-Z_][A-Z0-9_]*)\s*=/mg)].map(m=>m[1]);
assert('C-01', JSON.stringify(actualApsConsts) === JSON.stringify(['SPEC_SOURCE_CAUTION','APS_SOURCE_OPTIONS','APS_CLASSIFICATION_CASES']),
  'aps-ui-data.js: exact 3-constant inventory [SPEC_SOURCE_CAUTION, APS_SOURCE_OPTIONS, APS_CLASSIFICATION_CASES]', 'sg');
assert('C-02', [...aps.matchAll(/^function /mg)].length === 0,
  'aps-ui-data.js: zero functions (data-only fragment)', 'sg');

// APS_SOURCE_OPTIONS: 8 exact IDs in order
const opsBlock = aps.slice(aps.indexOf('APS_SOURCE_OPTIONS'), aps.indexOf('APS_CLASSIFICATION_CASES'));
const optIds = [...opsBlock.matchAll(/id:\s*"([^"]+)"/g)].map(m=>m[1]);
assert('C-03', JSON.stringify(optIds) === JSON.stringify([
  'clinical-outcome','biological-variation','state-of-the-art','regulatory',
  'eqa-pt','manufacturer-claim','local-quality-goal','insufficient-information']),
  'APS_SOURCE_OPTIONS: exact 8 IDs in order', 'sg');
assert('C-04', optIds.includes('insufficient-information'),
  'APS_SOURCE_OPTIONS: insufficient-information present (missing provenance)', 'sg');

// APS_CLASSIFICATION_CASES: 8 deterministic cases
const casesBlock = aps.slice(aps.indexOf('APS_CLASSIFICATION_CASES'));
const caseCount = [...casesBlock.matchAll(/\bid:\s*\d+/g)].length;
assert('C-05', caseCount === 8, `APS_CLASSIFICATION_CASES: ${caseCount}/8 cases`, 'sg');

// APS provenance safeguard
assert('C-06', aps.includes('SPEC_SOURCE_CAUTION'),
  'SPEC_SOURCE_CAUTION: APS provenance caution preserved', 'sg');

/* -----------------------------------------------------------------------
   SECTION D: COMPONENT FUNCTION INVENTORY (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION D: Component function inventory ===');

const actualCompFns = [...comp.matchAll(/^function ([A-Za-z][A-Za-z0-9]*)\(/mg)].map(m=>m[1]);
assert('D-01', JSON.stringify(actualCompFns) === JSON.stringify([
  'ruleLabelList','qualitativeComplexity','qualitativeDetection',
  'qualitativeFalseRejectionBurden','FrameworkProvenanceNote','ProcedureCard','ComparatorTable']),
  'ui-components.jsx: exact 7-function inventory in order', 'sg');
assert('D-02', [...comp.matchAll(/^const ([A-Z_][A-Z0-9_]*)\s*=/mg)].length === 0,
  'ui-components.jsx: zero top-level const declarations', 'sg');

/* -----------------------------------------------------------------------
   SECTION E: QUALITATIVE METRIC SAFEGUARD (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION E: Qualitative metric safeguard ===');

assert('E-01', comp.includes('qualitative') || comp.includes('ordinal') || comp.includes('teaching'),
  'ui-components.jsx: qualitative/ordinal teaching nature documented in source', 'sg');
assert('E-02', !comp.includes('function calcSigma(') && !comp.includes('function operatingCharacteristic('),
  'ui-components.jsx: no scientific engine function redefined', 'rc');
assert('E-03', comp.includes('operatingCharacteristic'),
  'ComparatorTable: references frozen operatingCharacteristic', 'sg');
assert('E-04', comp.includes('Not numerically implemented'),
  'ComparatorTable: "Not numerically implemented" for multirule Ped/Pfr', 'sg');
assert('E-05', comp.includes('RULE_LABELS') || comp.includes('ruleLabelList'),
  'ruleLabelList: references or consumes RULE_LABELS from frozen engine', 'sg');

/* -----------------------------------------------------------------------
   SECTION F: SCREEN FUNCTION/CONSTANT INVENTORY (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION F: Screen inventory ===');

const actualScrFns = [...scr.matchAll(/^function ([A-Za-z][A-Za-z0-9]*)\(/mg)].map(m=>m[1]);
assert('F-01', JSON.stringify(actualScrFns) === JSON.stringify([
  'ExerciseRevealCard','APSExplorerPanel','SigmaLaboratoryPanel',
  'QCProcedureComparatorPanel','WhyNotAllRulesCard','WhyNotOnly13sCard',
  'StrategyDesignerPanel','StrategyChallengePanel','QCStrategyLabScreen']),
  'screens.jsx: exact 9-function inventory in order', 'sg');

const actualScrConsts = [...scr.matchAll(/^const ([A-Z_][A-Z0-9_]*)\s*=/mg)].map(m=>m[1]);
assert('F-02', JSON.stringify(actualScrConsts) === JSON.stringify(['STRATEGY_LAB_MODES','SD_DEFAULTS','DEFAULT_STRATEGY_ANSWER']),
  'screens.jsx: exact 3-constant inventory [STRATEGY_LAB_MODES, SD_DEFAULTS, DEFAULT_STRATEGY_ANSWER]', 'sg');

/* -----------------------------------------------------------------------
   SECTION G: EXACT FIVE MODES (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION G: Five modes ===');

const MODE_IDS    = ['aps','sigma-lab','comparator','designer','challenge'];
const MODE_LABELS = ['APS Explorer','Sigma Laboratory','QC Procedure Comparator','Strategy Designer','Strategy Challenge'];
MODE_IDS.forEach((id, i) => {
  assert(`G-01-${id}`, scr.includes(`"${id}"`), `Mode id: "${id}"`, 'sg');
  assert(`G-02-${id}`, scr.includes(`"${MODE_LABELS[i]}"`), `Mode label: "${MODE_LABELS[i]}"`, 'sg');
});
assert('G-03', !scr.includes('"risk"') && !scr.includes('"detection-delay"'),
  'No sixth mode (risk/detection-delay)', 'rc');

/* -----------------------------------------------------------------------
   SECTION H: SCREEN SHELL + TEACHING NOTES (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION H: Screen shell and teaching notes ===');

assert('H-01', scr.includes('<h1>QC Strategy Lab</h1>'),
  'QCStrategyLabScreen: <h1>QC Strategy Lab</h1>', 'sg');
assert('H-02', scr.includes('role="tablist"') || scr.includes("role='tablist'"),
  'QCStrategyLabScreen: tablist role', 'sg');
assert('H-03', scr.includes('aria-label="QC Strategy Lab mode"') || scr.includes("aria-label='QC Strategy Lab mode'"),
  'QCStrategyLabScreen: aria-label on tablist exact', 'sg');
assert('H-04', scr.includes('N_AND_R_TEACHING_NOTE'),
  'QCStrategyLabScreen: N_AND_R_TEACHING_NOTE rendered', 'sg');
assert('H-05', scr.includes('RUN_FREQUENCY_NOTE'),
  'QCStrategyLabScreen: RUN_FREQUENCY_NOTE rendered', 'sg');
assert('H-06', scr.includes('PATIENT_RISK_PREVIEW_NOTE'),
  'QCStrategyLabScreen: PATIENT_RISK_PREVIEW_NOTE rendered', 'sg');
assert('H-07', scr.includes('NO_TRAFFIC_LIGHT_SIGMA_NOTE'),
  'QCStrategyLabScreen: NO_TRAFFIC_LIGHT_SIGMA_NOTE rendered', 'sg');

/* -----------------------------------------------------------------------
   SECTION I: STRATEGY SAFEGUARDS (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION I: Strategy safeguards ===');

assert('I-01', scr.includes('SD_DEFAULTS = { tea: 10, bias: 2, cv: 2, levels: 2 }'),
  'SD_DEFAULTS: exact {tea:10, bias:2, cv:2, levels:2}', 'sg');
assert('I-02', scr.includes('VERY_LOW_SIGMA_WARNING'),
  'VERY_LOW_SIGMA_WARNING: intensifying QC does not correct poor method', 'sg');
assert('I-03', scr.includes('EDUCATIONAL_STRATEGY_DISCLAIMER') || scr.includes('educational candidate strategy'),
  'EDUCATIONAL_STRATEGY_DISCLAIMER: generated strategy is NOT a lab SOP', 'sg');
assert('I-04', scr.includes('not a competency certification'),
  'Score safeguard: "not a competency certification"', 'sg');
assert('I-05', scr.includes('MILAN_MODELS'),
  'APSExplorerPanel: references MILAN_MODELS (from frozen core.js)', 'sg');
assert('I-06', !scr.includes('const MILAN_MODELS'),
  'screens.jsx: MILAN_MODELS NOT redefined', 'rc');
assert('I-07', scr.includes('calcSigma') && !scr.includes('function calcSigma('),
  'Sigma delegation: calcSigma referenced, not redefined', 'sg');
assert('I-08', scr.includes('WHY_NOT_ALL_RULES_EXERCISE') || scr.includes('WhyNotAllRulesCard'),
  'WhyNotAllRulesCard: trade-off reasoning preserved', 'sg');
assert('I-09', scr.includes('WHY_NOT_ONLY_13S_EXERCISE') || scr.includes('WhyNotOnly13sCard'),
  'WhyNotOnly13sCard: 1_3s-not-universal preserved', 'sg');

/* -----------------------------------------------------------------------
   SECTION J: NO DUPLICATION / NO LEAKAGE (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION J: No duplication / no leakage ===');

const FROZEN_FNS = ['calcSigma','operatingCharacteristic','mapSigmaToProcedure',
  'getProcedure','sequentialObservationCapacity'];
FROZEN_FNS.forEach(fn => {
  assert(`J-01-${fn.substring(0,12)}`,
    !aps.includes(`function ${fn}(`) && !comp.includes(`function ${fn}(`) && !scr.includes(`function ${fn}(`),
    `No frozen function redefined: ${fn}`, 'rc');
});

// No shared Stage 9A redefinition
['Badge','ScientificBasisNote','LJChart','Modal','SliderField','MetricCard'].forEach(name => {
  assert(`J-02-${name}`,
    !comp.includes(`function ${name}(`) && !scr.includes(`function ${name}(`),
    `No Stage 9A component redefined: ${name}`, 'rc');
});

// No app-shell
[aps, comp, scr].forEach((src, i) => {
  const label = ['aps','comp','scr'][i];
  assert(`J-03-${label}`, !src.includes('NAV_ITEMS') && !src.includes('function App('),
    `${label}: no app-shell content`, 'rc');
});

// No import/export
[aps, comp, scr].forEach((src, i) => {
  const label = ['aps','comp','scr'][i];
  assert(`J-04-${label}`, !src.includes('import ') && !src.includes('require('),
    `${label}: no import/require`, 'sg');
  assert(`J-05-${label}`, !src.includes('module.exports') && !src.includes('export '),
    `${label}: no module.exports/export`, 'sg');
});

/* -----------------------------------------------------------------------
   SECTION K: SCIENTIFIC SOURCE IMMUTABILITY (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION K: Scientific source immutability ===');

const FROZEN_HASHES = {
  '../src/strategy/core.js': '01a7431491c3e15c5c39777445a057b62a9e7b9876887fe1dc7b4ed97ad16f5e',
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
console.log(`Stage 9H Strategy UI Tests: ${passed}/${total} passed, ${failed} failed`);
console.log(`  Source-grounded expectations: ${sg}`);
console.log(`  Reconstructed expectations:   ${rc}`);
console.log(`  Artifact class of test file: D (recovery infrastructure)`);
if (failed > 0) {
  console.error('STAGE 9H FAILED — do not commit.');
  process.exit(1);
} else {
  console.log('STAGE 9H PASSED — all tests green.');
  process.exit(0);
}
