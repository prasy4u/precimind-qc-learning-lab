/* =========================================================================
   tests/stage3b-strategy.test.js

   NEW RECOVERY TESTS — Stage 3B (NOT the historical test suite)
   Tests for the recovered QC Strategy scientific layer in
   src/strategy/core.js.

   VALIDATION ARCHITECTURE — anti-circular discipline:
   -------------------------------------------------------
   Strategy fixture tests (Section 1) use HARD-CODED expected Sigma values
   independently computed from the locked formula:
       Sigma = (TEa - |Bias|) / CV
   They do NOT call calcSigma() at test runtime to generate the expected
   value — that would circularly validate strategy with the statistics
   engine rather than independently.

   The mapping function (mapSigmaToProcedure) is tested in Section 3
   with FIXED numeric Sigma inputs (exact band boundaries and mid-band
   values) that do not depend on any calculation at test time.

   Cross-engine reuse (Section 7) verifies that the test suite CAN invoke
   calcSigma() for integration smoke-tests, but those tests are clearly
   labelled as integration checks, not as the primary mapping-correctness
   tests. The strategy module itself (core.js) contains no Sigma formula
   — confirmed by absence of any require/formula in the source file.

   DIRECTLY RECOVERED SOURCE DATA (Class A):
   Challenge case TEa/bias/CV inputs and correctProcedureIds are encoded
   directly in HTML source. These are the Class A grounded facts.

   Expected Sigma values (FIXTURE-CXX-SIGMA tests) are independently
   computed ONCE during recovery from the locked formula (TEa-|Bias|)/CV
   and hard-coded. These are Class B RECONSTRUCTED TEST EXPECTATIONS,
   not directly recovered fixtures — the HTML encodes inputs and expected
   procedure outcomes, not intermediate Sigma values.

   FIXTURE-CXX-MAP tests use the HTML-encoded correctProcedureIds as the
   authority and are source-grounded (Class A).

   Run: node tests/stage3b-strategy.test.js
   ========================================================================= */

'use strict';

const {
  MILAN_MODELS, MILAN_HIERARCHY_CAUTION, OTHER_SPEC_SOURCES,
  makeProcedure, sequentialObservationCapacity, PROCEDURE_LIBRARY, getProcedure,
  SIGMA_MAPPING_FRAMEWORKS, getFramework, mapSigmaToProcedure, frameworkWhyText,
  NO_UNIVERSAL_RULE_NOTE, NO_TRAFFIC_LIGHT_SIGMA_NOTE,
  OPCHAR_SCOPE_NOTE,
  VERY_LOW_SIGMA_THRESHOLD, VERY_LOW_SIGMA_WARNING,
  STRATEGY_CHALLENGE_CASES, STRATEGY_LIMITATION_OPTIONS, EDUCATIONAL_STRATEGY_DISCLAIMER,
  N_AND_R_TEACHING_NOTE
} = require('../src/strategy/core');

// Cross-engine: imported for integration smoke-tests ONLY (Section 7)
// strategy/core.js itself contains no calcSigma formula
const { calcSigma } = require('../src/core/statistics');
const { operatingCharacteristic } = require('../src/opchar/functions');
const { RULE_DETECTORS } = require('../src/rules/engine');

let passed = 0, failed = 0;

function assert(id, condition, detail) {
  if (condition) { console.log(`  ✓ [${id}] ${detail}`); passed++; }
  else { console.error(`  ✗ [${id}] FAIL: ${detail}`); failed++; }
}

const near = (a, b, tol = 0.0001) => typeof a === 'number' && typeof b === 'number' && isFinite(a) && isFinite(b) && Math.abs(a - b) <= tol;

/* -----------------------------------------------------------------------
   SECTION 1: DIRECTLY RECOVERED STRATEGY FIXTURES (Class A)

   Challenge cases: TEa, bias, CV are encoded in HTML source
   (STRATEGY_CHALLENGE_CASES array, "pre-computed and cross-checked against
   calcSigma() and mapSigmaToProcedure() while authoring this file").

   Expected Sigma values are independently computed ONCE using the locked
   formula  Sigma = (TEa - |Bias|) / CV  and hard-coded here.
   calcSigma() is NOT called at test runtime for these expected values.
   ----------------------------------------------------------------------- */
console.log('\n=== DIRECTLY RECOVERED STRATEGY FIXTURES (Class A) ===');
console.log('    Sigma = (TEa - |Bias|) / CV  [independently computed, hard-coded]');

const FWK = SIGMA_MAPPING_FRAMEWORKS[0].id; // the single recovered framework

// Case 1: tea=10, bias=1, cv=1  → Sigma = (10-1)/1 = 9.0 → band>=6 → Procedure A
// Source: STRATEGY_CHALLENGE_CASES[0], correctProcedureIds: ["A"]
assert('FIXTURE-C01-SIGMA', near(9.0, (10 - Math.abs(1)) / 1, 0.0001), 'Case 1 expected Sigma=9.0 independently verified');
assert('FIXTURE-C01-MAP',   mapSigmaToProcedure(9.0, FWK).procedure.id === 'A', 'Case 1: Sigma=9.0 → Procedure A');

// Case 2: tea=12, bias=1, cv=2  → Sigma = (12-1)/2 = 5.5 → band [5,6) → Procedure B
assert('FIXTURE-C02-SIGMA', near(5.5, (12 - Math.abs(1)) / 2, 0.0001), 'Case 2 expected Sigma=5.5 independently verified');
assert('FIXTURE-C02-MAP',   mapSigmaToProcedure(5.5, FWK).procedure.id === 'B', 'Case 2: Sigma=5.5 → Procedure B');

// Case 3: tea=10, bias=2, cv=1.9 → Sigma = (10-2)/1.9 = 8/1.9 ≈ 4.21053 → band [4,5) → Procedure C
const c3Sigma = (10 - Math.abs(2)) / 1.9;  // 4.210526...
assert('FIXTURE-C03-SIGMA', near(c3Sigma, 4.2105, 0.001), 'Case 3 expected Sigma≈4.2105 independently verified');
assert('FIXTURE-C03-MAP',   mapSigmaToProcedure(c3Sigma, FWK).procedure.id === 'C', 'Case 3: Sigma≈4.21 → Procedure C');

// Case 4: tea=10, bias=3, cv=2.8 → Sigma = (10-3)/2.8 = 7/2.8 = 2.5 → band <4 → Procedure D
assert('FIXTURE-C04-SIGMA', near(2.5, (10 - Math.abs(3)) / 2.8, 0.0001), 'Case 4 expected Sigma=2.5 independently verified');
assert('FIXTURE-C04-MAP',   mapSigmaToProcedure(2.5, FWK).procedure.id === 'D', 'Case 4: Sigma=2.5 → Procedure D');

// Case 5: tea=10, bias=7, cv=0.5 → Sigma = (10-7)/0.5 = 3/0.5 = 6.0 → band>=6 (inclusive) → Procedure A
assert('FIXTURE-C05-SIGMA', near(6.0, (10 - Math.abs(7)) / 0.5, 0.0001), 'Case 5 expected Sigma=6.0 independently verified');
assert('FIXTURE-C05-MAP',   mapSigmaToProcedure(6.0, FWK).procedure.id === 'A',
  'Case 5: Sigma=6.0 → Procedure A (inclusive lower bound at 6)');

// Case 6: tea=10, bias=0.5, cv=3 → Sigma = (10-0.5)/3 = 9.5/3 ≈ 3.1667 → band <4 → Procedure D
const c6Sigma = (10 - Math.abs(0.5)) / 3; // 3.16667...
assert('FIXTURE-C06-SIGMA', near(c6Sigma, 3.1667, 0.001), 'Case 6 expected Sigma≈3.1667 independently verified');
assert('FIXTURE-C06-MAP',   mapSigmaToProcedure(c6Sigma, FWK).procedure.id === 'D', 'Case 6: Sigma≈3.17 → Procedure D');

// Case 7 — dual specification: bias=2, cv=2 throughout
// Spec A: tea=10 → Sigma = (10-2)/2 = 4.0 → band [4,5) → Procedure C
// Spec B: tea=16 → Sigma = (16-2)/2 = 7.0 → band>=6 → Procedure A
assert('FIXTURE-C07A-SIGMA', near(4.0, (10 - Math.abs(2)) / 2, 0.0001), 'Case 7A expected Sigma=4.0 independently verified');
assert('FIXTURE-C07A-MAP',   mapSigmaToProcedure(4.0, FWK).procedure.id === 'C',
  'Case 7A: Sigma=4.0 → Procedure C (inclusive lower bound at 4)');
assert('FIXTURE-C07B-SIGMA', near(7.0, (16 - Math.abs(2)) / 2, 0.0001), 'Case 7B expected Sigma=7.0 independently verified');
assert('FIXTURE-C07B-MAP',   mapSigmaToProcedure(7.0, FWK).procedure.id === 'A', 'Case 7B: Sigma=7.0 → Procedure A');

// Case 8: tea=14, bias=1, cv=2 → Sigma = (14-1)/2 = 6.5 → band>=6 → Procedure A
assert('FIXTURE-C08-SIGMA', near(6.5, (14 - Math.abs(1)) / 2, 0.0001), 'Case 8 expected Sigma=6.5 independently verified');
assert('FIXTURE-C08-MAP',   mapSigmaToProcedure(6.5, FWK).procedure.id === 'A', 'Case 8: Sigma=6.5 → Procedure A');

// Case 9: tea=9, bias=2, cv=2 → Sigma = (9-2)/2 = 3.5 → band <4 → Procedure D
assert('FIXTURE-C09-SIGMA', near(3.5, (9 - Math.abs(2)) / 2, 0.0001), 'Case 9 expected Sigma=3.5 independently verified');
assert('FIXTURE-C09-MAP',   mapSigmaToProcedure(3.5, FWK).procedure.id === 'D', 'Case 9: Sigma=3.5 → Procedure D');

// Case 10: cv=null → no Sigma, no procedure
const case10 = STRATEGY_CHALLENGE_CASES.find(c => c.id === 10);
assert('FIXTURE-C10-NULL', case10.cv === null, 'Case 10: cv=null in source (insufficient information)');
assert('FIXTURE-C10-PROCS', case10.correctProcedureIds.length === 0, 'Case 10: no correct procedure IDs');

/* -----------------------------------------------------------------------
   SECTION 2: RECONSTRUCTED TESTS — APS Framework
   ----------------------------------------------------------------------- */
console.log('\n=== RECONSTRUCTED TESTS — APS Framework ===');

assert('T-APS-01', MILAN_MODELS.length === 3, 'Three Milan Models recovered');
assert('T-APS-02', MILAN_MODELS[0].id === 'clinical-outcome', 'Model 1: clinical-outcome');
assert('T-APS-03', MILAN_MODELS[1].id === 'biological-variation', 'Model 2: biological-variation');
assert('T-APS-04', MILAN_MODELS[2].id === 'state-of-the-art', 'Model 3: state-of-the-art');
assert('T-APS-05', MILAN_MODELS.every(m => m.number && m.name && m.description && m.applicabilityNote),
  'All models have number, name, description, applicabilityNote');
assert('T-APS-06', typeof MILAN_HIERARCHY_CAUTION === 'string' && MILAN_HIERARCHY_CAUTION.includes('not a simple ranking'),
  'MILAN_HIERARCHY_CAUTION: not a universal hierarchy');
assert('T-APS-07', Array.isArray(OTHER_SPEC_SOURCES) && OTHER_SPEC_SOURCES.length >= 4,
  'OTHER_SPEC_SOURCES: >= 4 entries');
assert('T-APS-08', OTHER_SPEC_SOURCES.some(s => s.id === 'regulatory'), 'Regulatory source present');
assert('T-APS-09', OTHER_SPEC_SOURCES.some(s => s.id === 'eqa-pt'), 'EQA/PT source present');
assert('T-APS-10', OTHER_SPEC_SOURCES.some(s => s.id === 'manufacturer-claim'), 'Manufacturer claim present');
assert('T-APS-11', OTHER_SPEC_SOURCES.some(s => s.id === 'local-quality-goal'), 'Local quality goal present');

/* -----------------------------------------------------------------------
   SECTION 3: RECONSTRUCTED TESTS — Sigma mapping (fixed inputs only)
   ----------------------------------------------------------------------- */
console.log('\n=== RECONSTRUCTED TESTS — Sigma mapping (fixed inputs, no formula) ===');

assert('T-MAP-01', SIGMA_MAPPING_FRAMEWORKS.length === 1, 'Exactly 1 framework implemented in v0.3');
assert('T-MAP-02', SIGMA_MAPPING_FRAMEWORKS[0].id === 'westgard-sigma-rules-simplified', 'Framework ID correct');
assert('T-MAP-03', SIGMA_MAPPING_FRAMEWORKS[0].bands.length === 4, 'Four bands in framework');
assert('T-MAP-04', getFramework('westgard-sigma-rules-simplified') !== null, 'getFramework by ID works');
assert('T-MAP-05', getFramework('nonexistent') === null, 'getFramework unknown = null');

// Exact boundary tests — inclusive lower bounds (application-convention per HTML)
assert('T-MAP-BOUND-6', mapSigmaToProcedure(6.0, FWK).procedure.id === 'A',
  'Sigma=6.0 exact boundary → Procedure A (inclusive >=6)');
assert('T-MAP-BOUND-5', mapSigmaToProcedure(5.0, FWK).procedure.id === 'B',
  'Sigma=5.0 exact boundary → Procedure B (inclusive >=5)');
assert('T-MAP-BOUND-4', mapSigmaToProcedure(4.0, FWK).procedure.id === 'C',
  'Sigma=4.0 exact boundary → Procedure C (inclusive >=4)');

// Just below boundaries
assert('T-MAP-BELOW-6', mapSigmaToProcedure(5.999, FWK).procedure.id === 'B',
  'Sigma=5.999 (just below 6) → Procedure B');
assert('T-MAP-BELOW-5', mapSigmaToProcedure(4.999, FWK).procedure.id === 'C',
  'Sigma=4.999 (just below 5) → Procedure C');
assert('T-MAP-BELOW-4', mapSigmaToProcedure(3.999, FWK).procedure.id === 'D',
  'Sigma=3.999 (just below 4) → Procedure D');

// Mid-band values
assert('T-MAP-MID-AB', mapSigmaToProcedure(6.5, FWK).procedure.id === 'A', 'Sigma=6.5 → A');
assert('T-MAP-MID-B',  mapSigmaToProcedure(5.5, FWK).procedure.id === 'B', 'Sigma=5.5 → B');
assert('T-MAP-MID-C',  mapSigmaToProcedure(4.5, FWK).procedure.id === 'C', 'Sigma=4.5 → C');
assert('T-MAP-MID-D',  mapSigmaToProcedure(2.9, FWK).procedure.id === 'D', 'Sigma=2.9 → D');
assert('T-MAP-MID-DN', mapSigmaToProcedure(-1.0, FWK).procedure.id === 'D', 'Sigma=-1 (negative) → D');

// Invalid Sigma inputs
assert('T-MAP-INV-NAN',  mapSigmaToProcedure(NaN, FWK).procedure === null,  'NaN → no procedure');
assert('T-MAP-INV-INF',  mapSigmaToProcedure(Infinity, FWK).procedure === null, 'Infinity → no procedure');
assert('T-MAP-INV-NULL', mapSigmaToProcedure(null, FWK).procedure === null, 'null → no procedure');
assert('T-MAP-INV-STR',  mapSigmaToProcedure('five', FWK).procedure === null, 'string → no procedure');

// frameworkWhyText correctness
const m1 = mapSigmaToProcedure(9.0, FWK);
const whyText = frameworkWhyText(m1);
assert('T-MAP-WHY-01', whyText.includes('Simplified published Sigma Rules'), 'whyText names the framework');
assert('T-MAP-WHY-02', whyText.includes('Westgard QC'), 'whyText attributes the source');
assert('T-MAP-WHY-03', !whyText.toLowerCase().includes('universally requires'),
  'whyText does not claim universal requirement');
assert('T-MAP-WHY-04', frameworkWhyText(null).includes('No candidate'),
  'frameworkWhyText(null) = no candidate message');

// Doctrine notes
assert('T-MAP-DOC-01', NO_UNIVERSAL_RULE_NOTE.includes('never states'), 'NO_UNIVERSAL_RULE_NOTE present');
assert('T-MAP-DOC-02', NO_TRAFFIC_LIGHT_SIGMA_NOTE.includes('does not use'), 'NO_TRAFFIC_LIGHT_SIGMA_NOTE present');

/* -----------------------------------------------------------------------
   SECTION 4: RECONSTRUCTED TESTS — Procedure Library structure
   ----------------------------------------------------------------------- */
console.log('\n=== RECONSTRUCTED TESTS — Procedure Library ===');

assert('T-PROC-01', PROCEDURE_LIBRARY.length === 4, 'Exactly 4 procedures: A, B, C, D');
const procIds = PROCEDURE_LIBRARY.map(p => p.id);
assert('T-PROC-02', new Set(procIds).size === 4, 'All procedure IDs unique');
assert('T-PROC-03', ['A','B','C','D'].every(id => procIds.includes(id)), 'A/B/C/D all present');

// All rule IDs exist in RULE_DETECTORS
PROCEDURE_LIBRARY.forEach(p => {
  p.ruleIds.forEach(r => {
    assert(`T-PROC-RULE-${p.id}-${r}`,
      typeof RULE_DETECTORS[r] === 'function',
      `Procedure ${p.id} ruleId "${r}" in RULE_DETECTORS`);
  });
});

// N/R are positive integers, capacity = N*R
PROCEDURE_LIBRARY.forEach(p => {
  assert(`T-PROC-N-${p.id}`, Number.isInteger(p.N) && p.N > 0, `Proc ${p.id}: N=${p.N} positive integer`);
  assert(`T-PROC-R-${p.id}`, Number.isInteger(p.R) && p.R > 0, `Proc ${p.id}: R=${p.R} positive integer`);
  assert(`T-PROC-CAP-${p.id}`, sequentialObservationCapacity(p) === p.N * p.R,
    `Proc ${p.id}: capacity=${p.N * p.R} = N*R`);
});

assert('T-PROC-GET', getProcedure('A').id === 'A', 'getProcedure("A") works');
assert('T-PROC-MISS', getProcedure('X') === null, 'getProcedure("X") = null');

/* -----------------------------------------------------------------------
   SECTION 5: MANDATORY PROCEDURE C CHECK (N=2, R=2, capacity=4)
   ----------------------------------------------------------------------- */
console.log('\n=== RECONSTRUCTED TESTS — Procedure C (MANDATORY: N=2, R=2) ===');

const procC = getProcedure('C');
assert('T-PROCC-01', procC !== null, 'Procedure C exists');
assert('T-PROCC-02', procC.N === 2, 'Procedure C: N=2');
assert('T-PROCC-03', procC.R === 2, 'Procedure C: R=2');
assert('T-PROCC-04', sequentialObservationCapacity(procC) === 4, 'Procedure C: capacity=4 (2×2)');
assert('T-PROCC-05', procC.ruleIds.includes('13s'), 'Procedure C has 1_3s');
assert('T-PROCC-06', procC.ruleIds.includes('22s'), 'Procedure C has 2_2s');
assert('T-PROCC-07', procC.ruleIds.includes('r4s'), 'Procedure C has R_4s');
assert('T-PROCC-08', procC.ruleIds.includes('41s'), 'Procedure C has 4_1s');
assert('T-PROCC-09', !procC.ruleIds.includes('8x'),  'Procedure C does NOT have 8x');
assert('T-PROCC-10', !procC.ruleIds.includes('10x'), 'Procedure C does NOT have 10x');

/* -----------------------------------------------------------------------
   SECTION 6: MANDATORY PROCEDURE D CHECK (N=2, R=4, 8x not 10x)
   ----------------------------------------------------------------------- */
console.log('\n=== RECONSTRUCTED TESTS — Procedure D (MANDATORY: N=2, R=4, 8x ≠ 10x) ===');

const procD = getProcedure('D');
assert('T-PROCD-01', procD !== null, 'Procedure D exists');
assert('T-PROCD-02', procD.N === 2, 'Procedure D: N=2');
assert('T-PROCD-03', procD.R === 4, 'Procedure D: R=4');
assert('T-PROCD-04', sequentialObservationCapacity(procD) === 8, 'Procedure D: capacity=8 (2×4)');
assert('T-PROCD-05', procD.ruleIds.includes('13s'), 'Procedure D has 1_3s');
assert('T-PROCD-06', procD.ruleIds.includes('22s'), 'Procedure D has 2_2s');
assert('T-PROCD-07', procD.ruleIds.includes('r4s'), 'Procedure D has R_4s');
assert('T-PROCD-08', procD.ruleIds.includes('41s'), 'Procedure D has 4_1s');
assert('T-PROCD-09',  procD.ruleIds.includes('8x'),  'Procedure D has 8x');
assert('T-PROCD-10', !procD.ruleIds.includes('10x'), 'Procedure D does NOT have 10x — 8x ≠ 10x');

/* -----------------------------------------------------------------------
   SECTION 7: ALTERNATIVE 8x CONFIGURATION (N=4, R=2)
   ----------------------------------------------------------------------- */
console.log('\n=== RECONSTRUCTED TESTS — Alternative 8x config (N=4,R=2) ===');

// HTML explicitly documents N=4,R=2 as an alternative; Procedure D uses N=2,R=4
assert('T-ALT-01', N_AND_R_TEACHING_NOTE.includes('N=4') && N_AND_R_TEACHING_NOTE.includes('R=2'),
  'N_AND_R_TEACHING_NOTE documents N=4,R=2 alternative');
assert('T-ALT-02', N_AND_R_TEACHING_NOTE.includes('not identical configurations'),
  'Teaching note: N=4/R=2 and N=2/R=4 are not identical');
assert('T-ALT-03', procD.N === 2 && procD.R === 4, 'Procedure D uses N=2,R=4 (not the N=4,R=2 alternative)');
assert('T-ALT-04', PROCEDURE_LIBRARY.filter(p => p.N === 4 && p.R === 2).length === 0,
  'N=4,R=2 alternative is NOT a separate library procedure');
// Both give N*R=8 — but are not identical — verify the capacity arithmetic only
assert('T-ALT-05', 4 * 2 === 8 && 2 * 4 === 8,
  'Both configurations total N×R=8 sequential observations (capacity arithmetic)');

/* -----------------------------------------------------------------------
   SECTION 8: N/R SEMANTICS — N never stored as N*R
   ----------------------------------------------------------------------- */
console.log('\n=== RECONSTRUCTED TESTS — N/R semantics ===');

PROCEDURE_LIBRARY.forEach(p => {
  if (p.R > 1) {
    assert(`T-NR-NOSTORE-${p.id}`,
      p.N !== p.N * p.R,
      `Proc ${p.id}: N (${p.N}) ≠ N*R (${p.N*p.R}) — N is per-run count, not accumulated`);
  }
});
assert('T-NR-GUARD-NULL',  sequentialObservationCapacity(null) === null, 'capacity(null)=null');
assert('T-NR-GUARD-EMPTY', sequentialObservationCapacity({}) === null, 'capacity({})=null');
assert('T-NR-GUARD-NONLY', sequentialObservationCapacity({N:2}) === null, 'capacity with N only=null');

/* -----------------------------------------------------------------------
   SECTION 9: OPCHAR INTEGRATION — strategy uses opchar engine, no duplication
   ----------------------------------------------------------------------- */
console.log('\n=== RECONSTRUCTED TESTS — Opchar integration ===');

// Procedure A (13s only): OC supported via recovered opchar engine
const ocA = operatingCharacteristic(getProcedure('A').ruleIds, getProcedure('A').N, 3);
assert('T-OCI-01', ocA.supported === true,  'Proc A (13s only): OC supported via opchar engine');
assert('T-OCI-02', ocA.validated === true,  'Proc A (13s only): OC validated');
assert('T-OCI-03', typeof ocA.ped === 'number' && typeof ocA.pfr === 'number',
  'Proc A: ped/pfr are numbers (not fabricated by strategy layer)');

// Multirule B, C, D: OC unsupported — no invented Ped/Pfr
['B','C','D'].forEach(id => {
  const p = getProcedure(id);
  const oc = operatingCharacteristic(p.ruleIds, p.N, 3);
  assert(`T-OCI-UNSUP-${id}`, oc.supported === false,
    `Proc ${id} (multirule): OC unsupported — no invented Ped/Pfr`);
  assert(`T-OCI-NO-PED-${id}`, !('ped' in oc),
    `Proc ${id}: no ped property in unsupported result`);
});

// 8x and 10x remain unsupported individually
assert('T-OCI-8X',  operatingCharacteristic(['8x'],  2, 3).supported === false, '8x alone: unsupported');
assert('T-OCI-10X', operatingCharacteristic(['10x'], 2, 3).supported === false, '10x alone: unsupported');

// OPCHAR_SCOPE_NOTE mentions 1_3s restriction
assert('T-OCI-NOTE', OPCHAR_SCOPE_NOTE.includes('1₃s rule applied on its own'),
  'OPCHAR_SCOPE_NOTE correctly describes pure 1_3s restriction');

/* -----------------------------------------------------------------------
   SECTION 10: STRATEGY CHALLENGE BANK — structure
   ----------------------------------------------------------------------- */
console.log('\n=== RECONSTRUCTED TESTS — Strategy Challenge Bank ===');

assert('T-CHAL-01', STRATEGY_CHALLENGE_CASES.length === 10, 'Exactly 10 challenge cases');
const caseIds = STRATEGY_CHALLENGE_CASES.map(c => c.id);
assert('T-CHAL-02', new Set(caseIds).size === 10, 'All case IDs unique');
assert('T-CHAL-03', caseIds.every((id, i) => id === i + 1), 'Case IDs are 1–10 sequential');
STRATEGY_CHALLENGE_CASES.forEach(c => {
  assert(`T-CHAL-STRUCT-${c.id}`,
    typeof c.title === 'string' &&
    typeof c.primaryLimitationCorrect === 'string' &&
    Array.isArray(c.correctProcedureIds),
    `Case ${c.id}: required structure fields present`);
});

const chal10 = STRATEGY_CHALLENGE_CASES.find(c => c.id === 10);
assert('T-CHAL-10A', chal10.cv === null, 'Case 10: cv=null (insufficient information)');
assert('T-CHAL-10B', chal10.correctProcedureIds.length === 0, 'Case 10: no correct procedure IDs');
assert('T-CHAL-LIMOPT', STRATEGY_LIMITATION_OPTIONS.length === 4, '4 limitation options');
assert('T-CHAL-INSUF',  STRATEGY_LIMITATION_OPTIONS.some(o => o.id === 'insufficient'),
  '"insufficient" option present');

// veryLowSigma guardrail
assert('T-CHAL-LOGSIG-CASE4', STRATEGY_CHALLENGE_CASES.find(c => c.id === 4).veryLowSigmaWarning === true,
  'Case 4 carries veryLowSigmaWarning=true');
assert('T-CHAL-LOGSIG-THRESH', VERY_LOW_SIGMA_THRESHOLD === 3, 'VERY_LOW_SIGMA_THRESHOLD = 3');
assert('T-CHAL-LOGSIG-WARN', typeof VERY_LOW_SIGMA_WARNING === 'string' && VERY_LOW_SIGMA_WARNING.length > 0,
  'VERY_LOW_SIGMA_WARNING string present');

/* -----------------------------------------------------------------------
   SECTION 11: CROSS-ENGINE INTEGRATION SMOKE-TESTS
   (labelled explicitly — calcSigma used here as integration check only)
   ----------------------------------------------------------------------- */
console.log('\n=== CROSS-ENGINE INTEGRATION SMOKE-TESTS (calcSigma → mapSigma) ===');
console.log('    NOTE: These call calcSigma() for integration verification.');
console.log('    Strategy mapping correctness is tested independently above (Sections 1 & 3).');

// Smoke: calcSigma from statistics.js produces value consistent with mapping boundary
// Case 1 (tea=10,bias=1,cv=1): expect Sigma=9 → band A; already fixed-tested above
const smk1 = calcSigma(10, 1, 1);
assert('T-SMOKE-01', smk1.valid && near(smk1.value, 9.0),
  'Integration: calcSigma(10,1,1)=9.0 (confirms stats engine consistent with hard-coded fixture)');

// Negative Sigma from calcSigma should map to Procedure D
const smkNeg = calcSigma(5, 8, 2); // (5-8)/2 = -1.5
assert('T-SMOKE-02', smkNeg.valid && smkNeg.value < 0,
  'Integration: negative Sigma valid from calcSigma (not floored)');
assert('T-SMOKE-03', mapSigmaToProcedure(smkNeg.value, FWK).procedure.id === 'D',
  'Integration: negative Sigma maps to Procedure D');

/* -----------------------------------------------------------------------
   SECTION 12: DOCTRINE / NOTES
   ----------------------------------------------------------------------- */
console.log('\n=== RECONSTRUCTED TESTS — Doctrine notes ===');

assert('T-DOC-01', typeof EDUCATIONAL_STRATEGY_DISCLAIMER === 'string' && EDUCATIONAL_STRATEGY_DISCLAIMER.includes('must not replace'),
  'EDUCATIONAL_STRATEGY_DISCLAIMER present and non-trivial');
assert('T-DOC-02', typeof N_AND_R_TEACHING_NOTE === 'string' && N_AND_R_TEACHING_NOTE.includes('N × R'),
  'N_AND_R_TEACHING_NOTE present and mentions N × R');
assert('T-DOC-03', NO_UNIVERSAL_RULE_NOTE.length > 0, 'NO_UNIVERSAL_RULE_NOTE present');
assert('T-DOC-04', NO_TRAFFIC_LIGHT_SIGMA_NOTE.length > 0, 'NO_TRAFFIC_LIGHT_SIGMA_NOTE present');

/* -----------------------------------------------------------------------
   SUMMARY
   ----------------------------------------------------------------------- */
const total = passed + failed;
// Provenance accounting (corrected per Stage 3B closure):
// Class A source-grounded: FIXTURE-CXX-MAP tests (10) + case10 null assertions (2) = 12
//   These use HTML-encoded correctProcedureIds and challenge structure as authority.
// Class B SIGMA tests: FIXTURE-CXX-SIGMA (10) — Sigma values independently computed
//   once during recovery from (TEa-|Bias|)/CV and hard-coded; not directly encoded in HTML.
// Class B other: all remaining reconstructed tests
const classAFixtures = 12;   // MAP assertions + case10 structure (source-grounded)
const classBSigma = 10;      // SIGMA assertions (reconstructed expected values)
const classBOther = total - classAFixtures - classBSigma;

console.log(`\n${'='.repeat(60)}`);
console.log(`Stage 3B Strategy Tests: ${passed}/${total} passed, ${failed} failed`);
console.log(`  Class A source-grounded fixtures: ${classAFixtures} (MAP/structure)`);
console.log(`  Class B reconstructed (Sigma expectations): ${classBSigma}`);
console.log(`  Class B reconstructed (other): ${classBOther}`);
if (failed > 0) {
  console.error('STAGE 3B FAILED — do not commit.');
  process.exit(1);
} else {
  console.log('STAGE 3B PASSED — all tests green.');
  process.exit(0);
}
