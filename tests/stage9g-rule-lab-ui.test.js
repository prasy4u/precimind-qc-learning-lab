/* =========================================================================
   tests/stage9g-rule-lab-ui.test.js

   NEW RECOVERY TESTS — Stage 9G (NOT the historical test suite)
   Tests for:
     src/rules/data.js           (Class A, HTML lines 3199-3417)
     src/rules/ui-components.jsx (Class A, HTML lines 3420-3633)
     src/rules/screens.jsx       (Class A, HTML lines 3636-4043)

   ARTIFACT PROVENANCE: Class D (recovery infrastructure, not historical)

   TEST EXPECTATION PROVENANCE:
   SOURCE-GROUNDED (sg): exact function/constant inventories, exact rule IDs,
     exact mode labels, exact geometry, exact authored strings — from HTML.
   RECONSTRUCTED (rc): source-fidelity byte comparisons, absence tests,
     no-duplication guards, block-completeness guards.

   Run: node tests/stage9g-rule-lab-ui.test.js
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

const DATA_PATH = path.join(__dirname, '../src/rules/data.js');
const COMP_PATH = path.join(__dirname, '../src/rules/ui-components.jsx');
const SCR_PATH  = path.join(__dirname, '../src/rules/screens.jsx');
const HTML_PATH = path.join(__dirname, '../recovery/original-v0.8.html');

const data = fs.readFileSync(DATA_PATH, 'utf8');
const comp = fs.readFileSync(COMP_PATH, 'utf8');
const scr  = fs.readFileSync(SCR_PATH,  'utf8');
const html = fs.readFileSync(HTML_PATH, 'utf8').split('\n');

/* -----------------------------------------------------------------------
   SECTION A: SOURCE-FIDELITY (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION A: Source-fidelity ===');

const dataAuth = html.slice(3198, 3417).join('\n') + '\n';
assert('A-DATA', dataAuth === data,
  'data.js exactly matches HTML lines 3199-3417', 'rc');
const compAuth = html.slice(3419, 3633).join('\n') + '\n';
assert('A-COMP', compAuth === comp,
  'ui-components.jsx exactly matches HTML lines 3420-3633', 'rc');
const scrAuth = html.slice(3635, 4043).join('\n') + '\n';
assert('A-SCR', scrAuth === scr,
  'screens.jsx exactly matches HTML lines 3636-4043', 'rc');

/* -----------------------------------------------------------------------
   SECTION B: BLOCK-COMPLETENESS GUARDS (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION B: Block-completeness guards ===');

[data, comp, scr].forEach((src, i) => {
  const label = ['data','comp','scr'][i];
  assert(`B-01-${label}`, src.startsWith('/* ========================================================================='),
    `${label}: begins with complete opening delimiter`, 'rc');
  assert(`B-02-${label}`, src.includes('========================================================================= */'),
    `${label}: opening comment has authored closing delimiter`, 'rc');
});
assert('B-03', data.includes('RULE_LAB_INTRO'), 'data.js: final constant RULE_LAB_INTRO present', 'sg');
assert('B-04', comp.includes('function EventCard('), 'ui-components.jsx: final function EventCard present', 'sg');
assert('B-05', scr.includes('function RuleLaboratoryScreen('), 'screens.jsx: final function RuleLaboratoryScreen present', 'sg');
assert('B-06', !scr.includes('APS Explorer') && !scr.includes('QCStrategyLabScreen') && !scr.includes('MILAN_MODELS'),
  'screens.jsx: APS/Strategy next subsystem absent', 'rc');

/* -----------------------------------------------------------------------
   SECTION C: DATA FUNCTION INVENTORY (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION C: Data function inventory ===');

const actualDataFns = [...data.matchAll(/^function ([A-Za-z][A-Za-z0-9]*)\(/mg)].map(m=>m[1]);
assert('C-01', JSON.stringify(actualDataFns) === JSON.stringify(['rcr','rrun']),
  'data.js: exact 2-function inventory [rcr, rrun]', 'sg');

/* -----------------------------------------------------------------------
   SECTION D: DATA CONSTANT INVENTORY (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION D: Data constant inventory ===');

const EXPECTED_DATA_CONSTS = [
  'RULE_IDS','RULE_DEFINITIONS','INSPECTOR_DEFAULT_RUNS','RULE_OPTIONS_FOR_CHALLENGE',
  'SCOPE_OPTIONS_FOR_CHALLENGE','DETECTIVE_CASES','RUN_CONCEPT_NOTE','CLASSIC_MODE_NOTE',
  'DIRECT_MODE_NOTE','FALSE_REJECTION_NOTE','DECISION_GUARDRAIL_NOTE','RULE_LAB_INTRO'
];
const actualDataConsts = [...data.matchAll(/^const ([A-Z_][A-Z0-9_]*)\s*=/mg)].map(m=>m[1]);
assert('D-01', JSON.stringify(actualDataConsts) === JSON.stringify(EXPECTED_DATA_CONSTS),
  'data.js: exact 12-constant inventory in order', 'sg');

/* -----------------------------------------------------------------------
   SECTION E: RULE_IDS vs RULE_DEFINITIONS DISTINCTION (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION E: RULE_IDS vs RULE_DEFINITIONS distinction ===');

// RULE_IDS: exactly 6
const ruleIdsMatch = data.match(/const RULE_IDS\s*=\s*\[([^\]]+)\]/);
const ruleIds = ruleIdsMatch ? [...ruleIdsMatch[1].matchAll(/"([^"]+)"/g)].map(m=>m[1]) : [];
assert('E-01', JSON.stringify(ruleIds) === JSON.stringify(['12s','13s','22s','r4s','41s','10x']),
  'RULE_IDS: exactly [12s, 13s, 22s, r4s, 41s, 10x] (6 IDs)', 'sg');
assert('E-02', !ruleIds.includes('8x'),
  'RULE_IDS: does NOT include 8x (deliberate exclusion)', 'sg');

// RULE_DEFINITIONS: 7 including 8x
assert('E-03', data.includes('"8x"') || data.includes("'8x'"),
  'RULE_DEFINITIONS: includes 8x entry (independently taught)', 'sg');
assert('E-04', data.includes('"10x"') || data.includes("'10x'"),
  'RULE_DEFINITIONS: includes 10x entry', 'sg');
assert('E-05', data.includes('"12s"') && data.includes('"13s"') && data.includes('"22s"'),
  'RULE_DEFINITIONS: includes 12s, 13s, 22s', 'sg');

// Status distinctions (source-grounded)
assert('E-06', data.includes('"warning"'),
  'RULE_DEFINITIONS: 1_2s has status "warning"', 'sg');
assert('E-07', data.includes('"rejection"'),
  'RULE_DEFINITIONS: rejection criteria have status "rejection"', 'sg');

/* -----------------------------------------------------------------------
   SECTION F: DATA STRUCTURE COUNTS (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION F: Data structure counts ===');

// Count array entries using item-count heuristic (id: or rrun() entries)
const dcBlock = data.slice(data.indexOf('const DETECTIVE_CASES'), data.indexOf('const RUN_CONCEPT_NOTE'));
const caseCount = [...dcBlock.matchAll(/\bid:\s*\d+/g)].length;
assert('F-01', caseCount === 12, `DETECTIVE_CASES: ${caseCount}/12 cases`, 'sg');

const roBlock = data.slice(data.indexOf('const RULE_OPTIONS_FOR_CHALLENGE'), data.indexOf('const SCOPE_OPTIONS_FOR_CHALLENGE'));
const roCount = [...roBlock.matchAll(/\bid:/g)].length;
assert('F-02', roCount === 7, `RULE_OPTIONS_FOR_CHALLENGE: ${roCount}/7 options`, 'sg');

const soBlock = data.slice(data.indexOf('const SCOPE_OPTIONS_FOR_CHALLENGE'), data.indexOf('const DETECTIVE_CASES'));
const soCount = [...soBlock.matchAll(/\bid:/g)].length;
assert('F-03', soCount === 5, `SCOPE_OPTIONS_FOR_CHALLENGE: ${soCount}/5 options`, 'sg');

// INSPECTOR_DEFAULT_RUNS (20 entries — uses rrun() calls)
const irBlock = data.slice(data.indexOf('const INSPECTOR_DEFAULT_RUNS'), data.indexOf('const RULE_OPTIONS_FOR_CHALLENGE'));
const irCount = [...irBlock.matchAll(/\brrun\(/g)].length;
assert('F-04', irCount === 20, `INSPECTOR_DEFAULT_RUNS: ${irCount}/20 rrun() entries`, 'sg');

/* -----------------------------------------------------------------------
   SECTION G: RULE SEMANTIC SAFEGUARDS (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION G: Rule semantic safeguards ===');

assert('G-01', data.includes('FALSE_REJECTION_NOTE'), 'FALSE_REJECTION_NOTE: more rules may increase false rejection', 'sg');
assert('G-02', data.includes('DECISION_GUARDRAIL_NOTE'), 'DECISION_GUARDRAIL_NOTE: rule violation != root cause / patient result invalidity', 'sg');
assert('G-03', data.includes('CLASSIC_MODE_NOTE'), 'CLASSIC_MODE_NOTE: classic warning-gated mode documented', 'sg');
assert('G-04', data.includes('DIRECT_MODE_NOTE'), 'DIRECT_MODE_NOTE: direct evaluation mode documented', 'sg');
assert('G-05', data.includes('RUN_CONCEPT_NOTE'), 'RUN_CONCEPT_NOTE present', 'sg');

/* -----------------------------------------------------------------------
   SECTION H: COMPONENT FUNCTION/CONSTANT INVENTORY (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION H: Component inventory ===');

const actualCompFns = [...comp.matchAll(/^function ([A-Za-z][A-Za-z0-9]*)\(/mg)].map(m=>m[1]);
assert('H-01', JSON.stringify(actualCompFns) === JSON.stringify(['keyFor','MultiLevelLJChart','EventCard']),
  'ui-components.jsx: exact 3-function inventory [keyFor, MultiLevelLJChart, EventCard]', 'sg');
const actualCompConsts = [...comp.matchAll(/^const ([A-Z_][A-Z0-9_]*)\s*=/mg)].map(m=>m[1]);
assert('H-02', JSON.stringify(actualCompConsts) === JSON.stringify(['SCOPE_LABELS']),
  'ui-components.jsx: exact 1-constant [SCOPE_LABELS]', 'sg');

/* -----------------------------------------------------------------------
   SECTION I: MULTILEVEL LJ CHART GEOMETRY AND ACCESSIBILITY (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION I: MultiLevelLJChart geometry and accessibility ===');

const mljBlock = comp.slice(comp.indexOf('function MultiLevelLJChart('), comp.indexOf('function EventCard('));

assert('I-01', mljBlock.includes('const W = 780, H = 400'),
  'MultiLevelLJChart: W=780, H=400 (exact)', 'sg');
assert('I-02', mljBlock.includes('domainSD = 4'),
  'MultiLevelLJChart: domainSD=4 (±4 SD visual domain)', 'sg');
assert('I-03', mljBlock.includes('[-3, -2, -1, 0, 1, 2, 3]'),
  'MultiLevelLJChart: gridLevels=[-3,-2,-1,0,1,2,3] (exact)', 'sg');
assert('I-04', mljBlock.includes('az > 3') || mljBlock.includes('Math.abs(z) > 3'),
  'MultiLevelLJChart: abs(z)>3 → point-out', 'sg');
assert('I-05', mljBlock.includes('az > 2') || mljBlock.includes('Math.abs(z) > 2'),
  'MultiLevelLJChart: abs(z)>2 → point-warn', 'sg');

// Dual encoding: level distinction by shape AND line style
assert('I-06', mljBlock.includes('dashed') || mljBlock.includes('strokeDasharray'),
  'MultiLevelLJChart: Level 2 uses dashed line (not colour alone)', 'sg');
assert('I-07', mljBlock.includes('diamond') || mljBlock.includes('M 0,-'),
  'MultiLevelLJChart: Level 2 uses diamond marker (not colour alone)', 'sg');
assert('I-08', (mljBlock.includes('solid line') || mljBlock.includes('solid')) &&
  (mljBlock.includes('dashed line') || mljBlock.includes('dashed')),
  'MultiLevelLJChart: both solid/dashed labels present for legend', 'sg');

// Accessibility
assert('I-09', mljBlock.includes('role="img"') || mljBlock.includes("role='img'"),
  'MultiLevelLJChart: SVG has role="img"', 'sg');
assert('I-10', mljBlock.includes('tabIndex={0}'),
  'MultiLevelLJChart: points have tabIndex={0} (keyboard focusable)', 'sg');
assert('I-11', mljBlock.includes('role="button"') || mljBlock.includes("role='button'"),
  'MultiLevelLJChart: points have role="button"', 'sg');
assert('I-12', mljBlock.includes('aria-live'),
  'MultiLevelLJChart: aria-live="polite" for tooltip update', 'sg');
assert('I-13', mljBlock.includes('Show data table (text alternative)'),
  'MultiLevelLJChart: text-alternative summary exact', 'sg');

// Trigger-point ring states
assert('I-14', comp.includes('mlj-ring-selected'), 'mlj-ring-selected CSS class present', 'sg');
assert('I-15', comp.includes('mlj-ring-correct'), 'mlj-ring-correct CSS class present', 'sg');
assert('I-16', comp.includes('mlj-ring-incorrect'), 'mlj-ring-incorrect CSS class present', 'sg');

/* -----------------------------------------------------------------------
   SECTION J: SCREEN FUNCTION AND CONSTANT INVENTORY (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION J: Screen inventory ===');

const actualScrFns = [...scr.matchAll(/^function ([A-Za-z][A-Za-z0-9]*)\(/mg)].map(m=>m[1]);
assert('J-01', JSON.stringify(actualScrFns) === JSON.stringify([
  'setsEqual','LearnRulesPanel','InspectSequencePanel','RuleDetectivePanel','RuleLaboratoryScreen']),
  'screens.jsx: exact 5-function inventory in order', 'sg');

const actualScrConsts = [...scr.matchAll(/^const ([A-Z_][A-Z0-9_]*)\s*=/mg)].map(m=>m[1]);
assert('J-02', JSON.stringify(actualScrConsts) === JSON.stringify(['RULE_LAB_MODES','DEFAULT_DETECTIVE_ANSWER']),
  'screens.jsx: exact 2-constant inventory [RULE_LAB_MODES, DEFAULT_DETECTIVE_ANSWER]', 'sg');

/* -----------------------------------------------------------------------
   SECTION K: THREE MODES (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION K: Three modes ===');

assert('K-01', scr.includes('"learn"') && scr.includes('"Learn the Rules"'),
  'Mode: learn / "Learn the Rules"', 'sg');
assert('K-02', scr.includes('"inspect"') && scr.includes('"Inspect a QC Sequence"'),
  'Mode: inspect / "Inspect a QC Sequence"', 'sg');
assert('K-03', scr.includes('"detective"') && scr.includes('"Rule Detective"'),
  'Mode: detective / "Rule Detective"', 'sg');
assert('K-04', !scr.includes('"strategy"') && !scr.includes('"aps"'),
  'No APS/Strategy fourth mode', 'rc');

/* -----------------------------------------------------------------------
   SECTION L: LIVE ENGINE DELEGATION (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION L: Live engine delegation ===');

assert('L-01', scr.includes('evaluateRuleSet'),
  'screens.jsx: references frozen evaluateRuleSet (truth evaluation)', 'sg');
assert('L-02', !scr.includes('function detect12s(') && !scr.includes('function detect13s('),
  'screens.jsx: does NOT reimplement rule detectors', 'rc');
assert('L-03', !data.includes('function evaluateRuleSet('),
  'data.js: does NOT redefine evaluateRuleSet', 'rc');

/* -----------------------------------------------------------------------
   SECTION M: RULE DETECTIVE SAFEGUARDS (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION M: Rule Detective safeguards ===');

assert('M-01', scr.includes('DETECTIVE_CASES'),
  'RuleDetectivePanel: references DETECTIVE_CASES', 'sg');
assert('M-02', scr.includes('keyFor'),
  'RuleDetectivePanel: uses keyFor to derive trigger points', 'sg');
assert('M-03', scr.includes('does not change your score') || scr.includes('does not affect your score'),
  'Confidence metacognitive: "does not change your score"', 'sg');
assert('M-04', scr.includes('not a competency certification') || scr.includes('not a certification'),
  'Score safeguard: "not a competency certification" preserved', 'sg');

/* -----------------------------------------------------------------------
   SECTION N: RULE LAB SCREEN SHELL (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION N: RuleLaboratoryScreen shell ===');

assert('N-01', scr.includes('<h1>Rule Laboratory</h1>'),
  'RuleLaboratoryScreen: <h1>Rule Laboratory</h1>', 'sg');
assert('N-02', scr.includes('role="tablist"') || scr.includes("role='tablist'"),
  'RuleLaboratoryScreen: tablist role', 'sg');
assert('N-03', scr.includes('aria-label="Rule Laboratory mode"') || scr.includes("aria-label='Rule Laboratory mode'"),
  'RuleLaboratoryScreen: aria-label on tablist', 'sg');
assert('N-04', scr.includes('ScientificBasisNote'),
  'RuleLaboratoryScreen: ScientificBasisNote present', 'sg');
assert('N-05', scr.includes('RULE_LAB_INTRO'),
  'RuleLaboratoryScreen: RULE_LAB_INTRO rendered', 'sg');
assert('N-06', scr.includes('FALSE_REJECTION_NOTE'),
  'RuleLaboratoryScreen: FALSE_REJECTION_NOTE rendered', 'sg');
assert('N-07', scr.includes('DECISION_GUARDRAIL_NOTE'),
  'RuleLaboratoryScreen: DECISION_GUARDRAIL_NOTE rendered', 'sg');
assert('N-08', scr.includes('RUN_CONCEPT_NOTE'),
  'RuleLaboratoryScreen: RUN_CONCEPT_NOTE rendered', 'sg');

/* -----------------------------------------------------------------------
   SECTION O: NO DUPLICATION / NO LEAKAGE (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION O: No duplication / no leakage ===');

// No frozen scientific function redefinition
['evaluateRuleSet','detect12s','detect13s','detect22s','detectR4s','detect41s'].forEach(fn => {
  assert(`O-01-${fn.substring(0,10)}`,
    !data.includes(`function ${fn}(`) && !comp.includes(`function ${fn}(`) && !scr.includes(`function ${fn}(`),
    `No frozen engine function redefined: ${fn}`, 'rc');
});

// No shared Stage 9A component redefinition
['Badge','ScientificBasisNote','LJChart','Modal','SliderField','MetricCard'].forEach(name => {
  assert(`O-02-${name}`,
    !comp.includes(`function ${name}(`) && !scr.includes(`function ${name}(`),
    `No Stage 9A component redefined: ${name}`, 'rc');
});

// No APS/Strategy leakage
assert('O-03', !scr.includes('MILAN_MODELS') && !scr.includes('APS_CLASSIFICATION_CASES') &&
  !scr.includes('QCStrategyLabScreen'),
  'No APS/Strategy content in screens.jsx', 'rc');

// No import/export
[data, comp, scr].forEach((src, i) => {
  const label = ['data','comp','scr'][i];
  assert(`O-04-${label}`, !src.includes('import ') && !src.includes('require('),
    `${label}: no import/require`, 'sg');
  assert(`O-05-${label}`, !src.includes('module.exports') && !src.includes('export '),
    `${label}: no module.exports/export`, 'sg');
});

/* -----------------------------------------------------------------------
   SECTION P: SCIENTIFIC SOURCE IMMUTABILITY (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION P: Scientific source immutability ===');

const FROZEN_ENGINE_HASH = 'a2ea2b71e72c312151c3e223b10815fac46d59b697f27912c6df4fc246ddf66b';
const engineContent = fs.readFileSync(path.join(__dirname, '../src/rules/engine.js'), 'utf8');
const engineActual = crypto.createHash('sha256').update(engineContent).digest('hex');
assert('P-01', engineActual === FROZEN_ENGINE_HASH,
  'src/rules/engine.js: SHA-256 matches frozen value (not modified)', 'rc');

/* -----------------------------------------------------------------------
   SUMMARY
   ----------------------------------------------------------------------- */
const total = passed + failed;
console.log(`\n${'='.repeat(60)}`);
console.log(`Stage 9G Rule Lab UI Tests: ${passed}/${total} passed, ${failed} failed`);
console.log(`  Source-grounded expectations: ${sg}`);
console.log(`  Reconstructed expectations:   ${rc}`);
console.log(`  Artifact class of test file: D (recovery infrastructure)`);
if (failed > 0) {
  console.error('STAGE 9G FAILED — do not commit.');
  process.exit(1);
} else {
  console.log('STAGE 9G PASSED — all tests green.');
  process.exit(0);
}
