/* =========================================================================
   tests/stage2-rules.test.js

   NEW RECOVERY TESTS — Stage 2 (NOT the historical test suite)
   The historical rule test suite was lost. These are newly written tests
   that validate the recovered rule engine in src/rules/engine.js.

   Historical context: the project previously reported 68 rule assertions
   after 8x hardening. That count is Class C (externally reported, not
   independently recovered). Tests here optimise for semantic coverage,
   not for matching that count.

   Run: node tests/stage2-rules.test.js
   ========================================================================= */

'use strict';

const {
  exceedsPositive, exceedsNegative, exceedsAbs, sideOf,
  flattenPoints, pointsByLevel, levelIdsIn,
  detect12s, detect13s, detect22s, detectR4s, detect41s, detect10x, detect8x,
  evaluateRuleSet, RULE_DETECTORS, RULE_ORDER, RULE_LABELS
} = require('../src/rules/engine');

let passed = 0, failed = 0;

function assert(id, condition, detail) {
  if (condition) { console.log(`  ✓ [${id}] ${detail}`); passed++; }
  else { console.error(`  ✗ [${id}] FAIL: ${detail}`); failed++; }
}

/* -----------------------------------------------------------------------
   HELPERS
   ----------------------------------------------------------------------- */

function makeRun(runNumber, lvl1z, lvl2z) {
  return {
    runNumber,
    controlResults: [
      { levelId: 'L1', levelName: 'Level 1', rawValue: 100 + lvl1z, zScore: lvl1z },
      { levelId: 'L2', levelName: 'Level 2', rawValue: 200 + lvl2z, zScore: lvl2z }
    ]
  };
}

function makeSingleRun(runNumber, z) {
  return {
    runNumber,
    controlResults: [
      { levelId: 'L1', levelName: 'Level 1', rawValue: 100 + z, zScore: z }
    ]
  };
}

function makeRuns(zPairs) {
  return zPairs.map((pair, i) => makeRun(i + 1, pair[0], pair[1]));
}

function noneOf(events, ruleId) {
  return events.filter(e => e.ruleId === ruleId).length === 0;
}

function someOf(events, ruleId) {
  return events.filter(e => e.ruleId === ruleId).length > 0;
}

/* -----------------------------------------------------------------------
   SECTION 1: THRESHOLD HELPERS & BOUNDARY SEMANTICS
   ----------------------------------------------------------------------- */
console.log('\n=== BOUNDARY SEMANTICS — strict exceedance ===');

assert('T-THRESH-01', !exceedsPositive(1.0, 1), 'z=+1.0 does NOT exceed limit 1 (strict)');
assert('T-THRESH-02', exceedsPositive(1.001, 1), 'z=+1.001 DOES exceed limit 1');
assert('T-THRESH-03', !exceedsNegative(-1.0, 1), 'z=-1.0 does NOT exceed limit 1 (strict)');
assert('T-THRESH-04', exceedsNegative(-1.001, 1), 'z=-1.001 DOES exceed limit 1');
assert('T-THRESH-05', !exceedsPositive(2.0, 2), 'z=+2.0 does NOT exceed limit 2');
assert('T-THRESH-06', exceedsPositive(2.001, 2), 'z=+2.001 DOES exceed limit 2');
assert('T-THRESH-07', !exceedsNegative(-2.0, 2), 'z=-2.0 does NOT exceed limit 2');
assert('T-THRESH-08', exceedsNegative(-2.001, 2), 'z=-2.001 DOES exceed limit 2');
assert('T-THRESH-09', !exceedsPositive(3.0, 3), 'z=+3.0 does NOT exceed limit 3');
assert('T-THRESH-10', exceedsPositive(3.001, 3), 'z=+3.001 DOES exceed limit 3');
assert('T-THRESH-11', !exceedsNegative(-3.0, 3), 'z=-3.0 does NOT exceed limit 3');
assert('T-THRESH-12', exceedsNegative(-3.001, 3), 'z=-3.001 DOES exceed limit 3');
assert('T-THRESH-13', !exceedsAbs(0, 1), 'z=0 does not exceed any positive limit');
assert('T-THRESH-14', exceedsAbs(2.001, 2) && exceedsAbs(-2.001, 2), 'exceedsAbs works both sides');

console.log('\n=== sideOf ===');
assert('T-SIDE-01', sideOf(1.5) === 'positive', 'sideOf(+1.5) = positive');
assert('T-SIDE-02', sideOf(-1.5) === 'negative', 'sideOf(-1.5) = negative');
assert('T-SIDE-03', sideOf(0) === 'zero', 'sideOf(0) = zero');

/* -----------------------------------------------------------------------
   SECTION 2: GENERAL — valid rule IDs, empty/insufficient data
   ----------------------------------------------------------------------- */
console.log('\n=== GENERAL — rule IDs and empty data ===');

assert('T-GEN-01', typeof RULE_DETECTORS['12s'] === 'function', 'RULE_DETECTORS has 12s');
assert('T-GEN-02', typeof RULE_DETECTORS['13s'] === 'function', 'RULE_DETECTORS has 13s');
assert('T-GEN-03', typeof RULE_DETECTORS['22s'] === 'function', 'RULE_DETECTORS has 22s');
assert('T-GEN-04', typeof RULE_DETECTORS['r4s'] === 'function', 'RULE_DETECTORS has r4s');
assert('T-GEN-05', typeof RULE_DETECTORS['41s'] === 'function', 'RULE_DETECTORS has 41s');
assert('T-GEN-06', typeof RULE_DETECTORS['10x'] === 'function', 'RULE_DETECTORS has 10x');
assert('T-GEN-07', typeof RULE_DETECTORS['8x'] === 'function', 'RULE_DETECTORS has 8x');
assert('T-GEN-08', RULE_DETECTORS['nonsense'] === undefined, 'Unknown rule ID has no detector');
assert('T-GEN-09', evaluateRuleSet([]).length === 0, 'Empty runs array returns no events');
assert('T-GEN-10', evaluateRuleSet([makeRun(1, 0, 0)]).length === 0, 'All-zero run fires no rules');
assert('T-GEN-11', RULE_ORDER.includes('12s') && RULE_ORDER.includes('10x'), 'RULE_ORDER contains expected rules');
assert('T-GEN-12', !RULE_ORDER.includes('8x'), '8x is NOT in RULE_ORDER (evaluated separately)');

// Unsupported rule ID in evaluateRuleSet — should not crash, just skip
const unknownResult = evaluateRuleSet([makeRun(1, 3.5, 0)], ['bogus_rule']);
assert('T-GEN-13', unknownResult.length === 0, 'Unknown rule ID in evaluateRuleSet does not crash, returns []');

/* -----------------------------------------------------------------------
   SECTION 3: 1_2s
   ----------------------------------------------------------------------- */
console.log('\n=== 1_2s — warning rule ===');

assert('T-12S-01', detect12s([makeRun(1, 2.1, 0)]).length > 0, '1_2s fires on z=+2.1');
assert('T-12S-02', detect12s([makeRun(1, -2.1, 0)]).length > 0, '1_2s fires on z=-2.1');
assert('T-12S-03', detect12s([makeRun(1, 2.0, 0)]).length === 0, '1_2s does NOT fire on z=+2.0 (boundary)');
assert('T-12S-04', detect12s([makeRun(1, -2.0, 0)]).length === 0, '1_2s does NOT fire on z=-2.0 (boundary)');
assert('T-12S-05', detect12s([makeRun(1, 2.1, 0)])[0].status === 'warning', '1_2s status is warning, not rejection');
assert('T-12S-06', detect12s([makeRun(1, 1.9, 0)]).length === 0, '1_2s does not fire on z=+1.9');

/* -----------------------------------------------------------------------
   SECTION 4: 1_3s
   ----------------------------------------------------------------------- */
console.log('\n=== 1_3s — rejection rule ===');

assert('T-13S-01', detect13s([makeRun(1, 3.1, 0)]).length > 0, '1_3s fires on z=+3.1');
assert('T-13S-02', detect13s([makeRun(1, -3.1, 0)]).length > 0, '1_3s fires on z=-3.1');
assert('T-13S-03', detect13s([makeRun(1, 3.0, 0)]).length === 0, '1_3s does NOT fire on z=+3.0 (boundary)');
assert('T-13S-04', detect13s([makeRun(1, -3.0, 0)]).length === 0, '1_3s does NOT fire on z=-3.0 (boundary)');
assert('T-13S-05', detect13s([makeRun(1, 3.1, 0)])[0].status === 'rejection', '1_3s status is rejection');
assert('T-13S-06', detect13s([makeRun(1, 2.9, 0)]).length === 0, '1_3s does not fire on z=+2.9');

/* -----------------------------------------------------------------------
   SECTION 5: 2_2s
   ----------------------------------------------------------------------- */
console.log('\n=== 2_2s — rejection rule ===');

// Within-run, same side positive
const r22_withinPos = detect22s([makeRun(1, 2.5, 2.3)]);
assert('T-22S-01', r22_withinPos.some(e => e.scope === 'within-run-across-materials'), '2_2s fires within-run positive');

// Within-run, same side negative
const r22_withinNeg = detect22s([makeRun(1, -2.5, -2.3)]);
assert('T-22S-02', r22_withinNeg.some(e => e.scope === 'within-run-across-materials'), '2_2s fires within-run negative');

// Within-run, opposite sides — no violation
const r22_opp = detect22s([makeRun(1, 2.5, -2.3)]);
assert('T-22S-03', noneOf(r22_opp, '22s'), '2_2s does NOT fire on opposite-side within-run pair');

// Across runs, same material, same side
const r22_crossRun = detect22s([makeRun(1, 2.5, 0), makeRun(2, 2.3, 0)]);
assert('T-22S-04', r22_crossRun.some(e => e.scope === 'within-material-across-runs'), '2_2s fires same material across runs positive');

// Across runs, opposite sides — no violation
const r22_crossOpp = detect22s([makeRun(1, 2.5, 0), makeRun(2, -2.3, 0)]);
assert('T-22S-05', r22_crossOpp.filter(e => e.scope === 'within-material-across-runs').length === 0, '2_2s does not fire across runs opposite sides');

// Boundary z=+2.0 — no violation
const r22_boundary = detect22s([makeRun(1, 2.0, 2.0)]);
assert('T-22S-06', noneOf(r22_boundary, '22s'), '2_2s does NOT fire on z=+2.0/+2.0 (boundary)');

// Status is rejection
assert('T-22S-07', r22_withinPos[0].status === 'rejection', '2_2s status is rejection');

/* -----------------------------------------------------------------------
   SECTION 6: R_4s — within-run ONLY
   ----------------------------------------------------------------------- */
console.log('\n=== R_4s — within-run only ===');

// Within run, +2.1 and -2.1 — triggers
const r4s_within = detectR4s([makeRun(1, 2.5, -2.5)]);
assert('T-R4S-01', r4s_within.length > 0, 'R_4s fires within-run +2.5 / -2.5');
assert('T-R4S-02', r4s_within[0].scope === 'within-run-across-materials', 'R_4s scope is within-run-across-materials');
assert('T-R4S-03', r4s_within[0].direction === 'mixed', 'R_4s direction is mixed');
assert('T-R4S-04', r4s_within[0].status === 'rejection', 'R_4s status is rejection');

// CRITICAL: +2.5 in run 1, -2.5 in run 2 — must NOT trigger R_4s
const r4s_crossRun = detectR4s([makeRun(1, 2.5, 0), makeRun(2, -2.5, 0)]);
assert('T-R4S-05', r4s_crossRun.length === 0, 'R_4s does NOT fire when +2.5/-2.5 are in different runs (cross-run R_4s not implemented)');

// Boundary: z=+2.0 and -2.0 within run — no violation (strict exceedance)
const r4s_boundary = detectR4s([makeRun(1, 2.0, -2.0)]);
assert('T-R4S-06', r4s_boundary.length === 0, 'R_4s does NOT fire on z=+2.0/-2.0 (boundary)');

// Same side within run — no violation
const r4s_sameSide = detectR4s([makeRun(1, 2.5, 2.3)]);
assert('T-R4S-07', r4s_sameSide.length === 0, 'R_4s does NOT fire when both exceed +2 (same side)');

// REGRESSION: Confirm cross-run detection never occurs even with distinct patterns
const r4s_crossRun2 = detectR4s([makeRun(1, 3.0, 0), makeRun(2, 0, -3.0)]);
assert('T-R4S-08', r4s_crossRun2.length === 0, 'R_4s cross-run regression: +3.0 run1 / -3.0 run2 does NOT trigger');

/* -----------------------------------------------------------------------
   SECTION 7: 4_1s
   ----------------------------------------------------------------------- */
console.log('\n=== 4_1s — rejection rule ===');

// Valid positive sequence, single level
const r41_pos = detect41s([makeRun(1,1.5,0),makeRun(2,1.3,0),makeRun(3,1.7,0),makeRun(4,1.1,0)]);
assert('T-41S-01', r41_pos.some(e => e.direction === 'positive'), '4_1s fires on 4-run positive sequence (L1)');

// Valid negative sequence, single level
const r41_neg = detect41s([makeRun(1,-1.5,0),makeRun(2,-1.3,0),makeRun(3,-1.7,0),makeRun(4,-1.1,0)]);
assert('T-41S-02', r41_neg.some(e => e.direction === 'negative'), '4_1s fires on 4-run negative sequence (L1)');

// Zero interrupts sequence
const r41_zero = detect41s([makeRun(1,1.5,0),makeRun(2,0,0),makeRun(3,1.3,0),makeRun(4,1.7,0),makeRun(5,1.1,0)]);
assert('T-41S-03', r41_zero.filter(e => e.scope === 'within-material-across-runs').length === 0, '4_1s: z=0 interrupts same-side sequence');

// Opposite side interrupts
const r41_opp = detect41s([makeRun(1,1.5,0),makeRun(2,-0.1,0),makeRun(3,1.3,0),makeRun(4,1.7,0),makeRun(5,1.1,0)]);
assert('T-41S-04', r41_opp.filter(e => e.scope === 'within-material-across-runs').length === 0, '4_1s: negative value interrupts positive sequence');

// Only 3 runs — insufficient
const r41_insuf = detect41s([makeRun(1,1.5,0),makeRun(2,1.3,0),makeRun(3,1.7,0)]);
assert('T-41S-05', r41_insuf.filter(e => e.scope === 'within-material-across-runs').length === 0, '4_1s does not fire on 3 runs only');

// Boundary: z=+1.0 — no violation
const r41_bound = detect41s([makeRun(1,1.0,0),makeRun(2,1.0,0),makeRun(3,1.0,0),makeRun(4,1.0,0)]);
assert('T-41S-06', r41_bound.filter(e => e.scope === 'within-material-across-runs').length === 0, '4_1s does NOT fire on z=+1.0 (boundary)');

// Across-materials 2-run pattern (all 4 points same side)
const r41_across = detect41s([makeRun(1,1.5,1.3),makeRun(2,1.2,1.1)]);
assert('T-41S-07', r41_across.some(e => e.scope === 'across-materials-and-runs'), '4_1s fires across-materials-and-runs when all 4 points positive');

assert('T-41S-08', r41_pos.filter(e => e.scope === 'within-material-across-runs')[0].status === 'rejection', '4_1s status is rejection');

/* -----------------------------------------------------------------------
   SECTION 8: 8x
   ----------------------------------------------------------------------- */
console.log('\n=== 8x — distinct from 10x ===');

// 8 positive runs, single level
const pos8 = Array.from({length: 8}, (_,i) => makeRun(i+1, 0.5, 0));
const r8x_pos = detect8x(pos8);
assert('T-8X-01', r8x_pos.some(e => e.direction === 'positive'), '8x fires on 8-run positive sequence L1');
assert('T-8X-02', r8x_pos[0].status === 'rejection', '8x status is rejection');

// 8 negative runs, single level
const neg8 = Array.from({length: 8}, (_,i) => makeRun(i+1, -0.5, 0));
const r8x_neg = detect8x(neg8);
assert('T-8X-03', r8x_neg.some(e => e.direction === 'negative'), '8x fires on 8-run negative sequence L1');

// 7 runs only — no violation
const pos7 = Array.from({length: 7}, (_,i) => makeRun(i+1, 0.5, 0));
assert('T-8X-04', detect8x(pos7).filter(e => e.scope === 'within-material-across-runs').length === 0, '8x does NOT fire on only 7 runs');

// Zero interrupts
const runs8_zero = [
  makeRun(1,0.5,0), makeRun(2,0,0), makeRun(3,0.5,0), makeRun(4,0.5,0),
  makeRun(5,0.5,0), makeRun(6,0.5,0), makeRun(7,0.5,0), makeRun(8,0.5,0)
];
assert('T-8X-05', detect8x(runs8_zero).filter(e => e.scope === 'within-material-across-runs').length === 0, '8x: z=0 interrupts same-side sequence');

// Side change interrupts
const runs8_flip = [
  makeRun(1,0.5,0), makeRun(2,-0.1,0), makeRun(3,0.5,0), makeRun(4,0.5,0),
  makeRun(5,0.5,0), makeRun(6,0.5,0), makeRun(7,0.5,0), makeRun(8,0.5,0)
];
assert('T-8X-06', detect8x(runs8_flip).filter(e => e.scope === 'within-material-across-runs').length === 0, '8x: side-change interrupts sequence');

// 2-level 4-run case (8 points total across materials)
const runs4_2level_pos = Array.from({length: 4}, (_,i) => makeRun(i+1, 0.5, 0.3));
const r8x_across = detect8x(runs4_2level_pos);
assert('T-8X-07', r8x_across.some(e => e.scope === 'across-materials-and-runs'), '8x fires across-materials-and-runs (2 levels, 4 runs, 8 points)');

/* -----------------------------------------------------------------------
   SECTION 9: 10x
   ----------------------------------------------------------------------- */
console.log('\n=== 10x — distinct from 8x ===');

// 10 positive runs, single level
const pos10 = Array.from({length: 10}, (_,i) => makeRun(i+1, 0.5, 0));
const r10x_pos = detect10x(pos10);
assert('T-10X-01', r10x_pos.some(e => e.direction === 'positive'), '10x fires on 10-run positive L1');
assert('T-10X-02', r10x_pos[0].status === 'rejection', '10x status is rejection');

// 9 runs only — no violation
const pos9 = Array.from({length: 9}, (_,i) => makeRun(i+1, 0.5, 0));
assert('T-10X-03', detect10x(pos9).filter(e => e.scope === 'within-material-across-runs').length === 0, '10x does NOT fire on only 9 runs');

// Zero interrupts
const runs10_zero = [
  makeRun(1,0.5,0), makeRun(2,0,0),
  ...Array.from({length: 8}, (_,i) => makeRun(i+3, 0.5, 0))
];
assert('T-10X-04', detect10x(runs10_zero).filter(e => e.scope === 'within-material-across-runs').length === 0, '10x: z=0 interrupts sequence');

// Side change interrupts
const runs10_flip = [
  makeRun(1,-0.1,0),
  ...Array.from({length: 9}, (_,i) => makeRun(i+2, 0.5, 0))
];
assert('T-10X-05', detect10x(runs10_flip).filter(e => e.scope === 'within-material-across-runs').length === 0, '10x: side change interrupts sequence');

// 2-level 5-run case (10 points across materials)
const runs5_2level = Array.from({length: 5}, (_,i) => makeRun(i+1, 0.5, 0.3));
const r10x_across = detect10x(runs5_2level);
assert('T-10X-06', r10x_across.some(e => e.scope === 'across-materials-and-runs'), '10x fires across-materials-and-runs (2 levels, 5 runs)');

/* -----------------------------------------------------------------------
   SECTION 10: RULE DISTINCTION — 8x vs 10x separate implementations
   ----------------------------------------------------------------------- */
console.log('\n=== RULE DISTINCTION — 8x and 10x are separate implementations ===');

// 8 positive runs: 8x fires but 10x should NOT (insufficient for 10x)
const pos8_for_distinction = Array.from({length: 8}, (_,i) => makeRun(i+1, 0.5, 0.3));
const r8_only_8x = detect8x(pos8_for_distinction).filter(e => e.ruleId === '8x');
const r8_no_10x = detect10x(pos8_for_distinction).filter(e => e.scope === 'within-material-across-runs');
assert('T-DIST-01', r8_only_8x.length > 0, '8x fires on 8-run dataset');
assert('T-DIST-02', r8_no_10x.length === 0, '10x does NOT fire on 8-run dataset (requires 10)');
assert('T-DIST-03', detect8x !== detect10x, '8x and 10x are different function references');

// 10 runs: both fire
const pos10_both = Array.from({length: 10}, (_,i) => makeRun(i+1, 0.5, 0));
const has8x = detect8x(pos10_both).some(e => e.ruleId === '8x');
const has10x = detect10x(pos10_both).some(e => e.ruleId === '10x');
assert('T-DIST-04', has8x && has10x, 'Both 8x and 10x fire independently on 10-run dataset');

/* -----------------------------------------------------------------------
   SECTION 11: evaluateRuleSet — integration
   ----------------------------------------------------------------------- */
console.log('\n=== evaluateRuleSet — integration ===');

// Default rule set (RULE_ORDER) — 6 rules, no 8x
const rs_default = evaluateRuleSet([makeRun(1, 3.5, -3.5)]);
assert('T-EVAL-01', rs_default.some(e => e.ruleId === '13s'), 'evaluateRuleSet default includes 13s');
assert('T-EVAL-02', rs_default.some(e => e.ruleId === '12s'), 'evaluateRuleSet default includes 12s');
assert('T-EVAL-03', rs_default.some(e => e.ruleId === 'r4s'), 'evaluateRuleSet default includes r4s');
assert('T-EVAL-04', rs_default.filter(e => e.ruleId === '8x').length === 0, 'evaluateRuleSet default does NOT include 8x events');

// Explicit subset
const rs_13only = evaluateRuleSet([makeRun(1, 3.5, 0)], ['13s']);
assert('T-EVAL-05', rs_13only.every(e => e.ruleId === '13s'), 'evaluateRuleSet respects enabled subset');

// Explicit 8x
const rs_8x = evaluateRuleSet(Array.from({length: 8}, (_,i) => makeRun(i+1, 0.5, 0.3)), ['8x']);
assert('T-EVAL-06', rs_8x.some(e => e.ruleId === '8x'), 'evaluateRuleSet with ["8x"] runs 8x');

// Event structure fields
const ev = rs_default.find(e => e.ruleId === '13s');
assert('T-EVAL-07', ev && typeof ev.ruleId === 'string', 'Event has ruleId');
assert('T-EVAL-08', ev && typeof ev.status === 'string', 'Event has status');
assert('T-EVAL-09', ev && Array.isArray(ev.triggerPoints), 'Event has triggerPoints array');
assert('T-EVAL-10', ev && typeof ev.scope === 'string', 'Event has scope');
assert('T-EVAL-11', ev && typeof ev.direction === 'string', 'Event has direction');
assert('T-EVAL-12', ev && typeof ev.educationalInterpretation === 'string', 'Event has educationalInterpretation');
assert('T-EVAL-13', ev && Array.isArray(ev.runNumbers), 'Event has runNumbers array');
assert('T-EVAL-14', ev && Array.isArray(ev.controlLevels), 'Event has controlLevels array');

/* -----------------------------------------------------------------------
   SECTION 12: MULTI-LEVEL AND EDGE CASES
   ----------------------------------------------------------------------- */
console.log('\n=== MULTI-LEVEL / EDGE CASES ===');

// levelIdsIn with empty runs
assert('T-LVL-01', levelIdsIn([]).length === 0, 'levelIdsIn([]) = []');
assert('T-LVL-02', levelIdsIn([makeRun(1, 0, 0)]).length === 2, 'levelIdsIn 2-level run = 2 IDs');

// flattenPoints empty
assert('T-FLAT-01', flattenPoints([]).length === 0, 'flattenPoints([]) = []');
assert('T-FLAT-02', flattenPoints([makeRun(1, 0, 0)]).length === 2, 'flattenPoints 2-level run = 2 points');

// pointsByLevel
const pbl = pointsByLevel([makeRun(1, 1.5, 2.5), makeRun(2, 1.3, 2.1)], 'L1');
assert('T-FLAT-03', pbl.length === 2 && pbl.every(p => p.levelId === 'L1'), 'pointsByLevel filters correctly');

// No results for unknown level
assert('T-FLAT-04', pointsByLevel([makeRun(1, 0, 0)], 'LX').length === 0, 'pointsByLevel unknown level = []');

/* -----------------------------------------------------------------------
   SUMMARY
   ----------------------------------------------------------------------- */
const total = passed + failed;
console.log(`\n${'='.repeat(60)}`);
console.log(`Stage 2 Rule Engine Tests: ${passed}/${total} passed, ${failed} failed`);
if (failed > 0) {
  console.error('STAGE 2 FAILED — do not commit.');
  process.exit(1);
} else {
  console.log('STAGE 2 PASSED — all tests green.');
  process.exit(0);
}
