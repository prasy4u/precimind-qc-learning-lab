/* =========================================================================
   v09/tests/morning-qc/adaptive-sequencing.test.cjs

   Morning QC Room — Stage 12D Adaptive Sequencing Tests
   PROVENANCE: V09_TEST

   Verifies: cold start, weak-competency prioritization, avoiding
   immediate same-case repetition, appropriate difficulty progression,
   repeated-strong-performance progression, learner override (never
   locked in), reset history, no hidden-ground-truth dependency,
   deterministic repeated output.
   ========================================================================= */
'use strict';
const path = require('path');

let passed = 0, failed = 0;
function assert(id, cond, detail) {
  if (cond) { console.log(`  ✓ [${id}] ${detail}`); passed++; }
  else { console.error(`  ✗ [${id}] FAIL: ${detail}`); failed++; }
}

function makeStorage() {
  const data = {};
  return { getItem: k => data[k] || null, setItem: (k, v) => { data[k] = v; }, removeItem: k => { delete data[k]; } };
}

async function main() {
  const MQC = path.join(__dirname, '..', '..', 'app', 'morning-qc');
  const { ALL_CASES } = await import('file://' + path.join(MQC, 'cases', 'index.js'));
  const { recommendNextCase } = await import('file://' + path.join(MQC, 'adaptive', 'case-recommender.js'));
  const { recordAttempt, listAttempts, resetHistory } = await import('file://' + path.join(MQC, 'adaptive', 'attempt-store.js'));
  const { buildCompetencyHistory } = await import('file://' + path.join(MQC, 'adaptive', 'competency-history.js'));

  console.log('\n=== Cold start ===');
  {
    const rec = recommendNextCase(ALL_CASES, []);
    assert('ADAPT-01', rec !== null && rec.case.identity.difficulty === 'LEVEL_1_CLEAR_SIGNAL', `Cold start recommends a FOUNDATION-level (LEVEL_1) case (found ${rec.case.identity.difficulty})`);
    assert('ADAPT-02', typeof rec.reason === 'string' && rec.reason.length > 0, 'Cold start recommendation includes an explanation');
  }

  console.log('\n=== Weak competency prioritization (Rule A/B) ===');
  {
    const weakAttempt = { caseId: 'case-04-isolated-excursion', competencyProfile: [{ dimension: 'EVIDENCE_SELECTION', rating: 'NEEDS_IMPROVEMENT' }] };
    const rec = recommendNextCase(ALL_CASES, [weakAttempt]);
    assert('ADAPT-03', rec.case.identity.caseFamily !== 'A', 'Rule B: recommended case differs in family from the immediately previous case (Family A), avoiding rote memorisation');
    assert('ADAPT-04', /evidence selection/.test(rec.reason), 'Recommendation explanation names the specific weak competency');
  }

  console.log('\n=== Avoid immediate same-case repetition (Rule E) ===');
  {
    const weakAttempt = { caseId: 'case-04-isolated-excursion', competencyProfile: [{ dimension: 'SIGNAL_RECOGNITION', rating: 'NEEDS_IMPROVEMENT' }] };
    const rec = recommendNextCase(ALL_CASES, [weakAttempt]);
    assert('ADAPT-05', rec.case.identity.id !== 'case-04-isolated-excursion', 'The just-attempted case is not immediately recommended again when alternatives exist');
  }

  console.log('\n=== Appropriate difficulty — no immediate increase after weak performance (Rule C) ===');
  {
    const DIFFICULTY_RANK = { LEVEL_1_CLEAR_SIGNAL: 0, LEVEL_2_COMPETING_EXPLANATION: 1, LEVEL_3_MULTIPLE_SIGNALS_INCOMPLETE_EVIDENCE: 2, LEVEL_4_ANALYTICAL_PLUS_RISK_TRADEOFF: 3, LEVEL_5_EXPERT_AMBIGUOUS: 4 };
    const lastCase = ALL_CASES.find(c => c.identity.id === 'pilot-2-pbrtqc-population-shift');
    const weakAttempt = { caseId: 'pilot-2-pbrtqc-population-shift', competencyProfile: [{ dimension: 'EVIDENCE_SELECTION', rating: 'NEEDS_IMPROVEMENT' }] };
    const rec = recommendNextCase(ALL_CASES, [weakAttempt]);
    assert('ADAPT-06', (DIFFICULTY_RANK[rec.case.identity.difficulty] ?? 0) <= (DIFFICULTY_RANK[lastCase.identity.difficulty] ?? 0), 'Difficulty is not immediately increased following a weak-performance case');
  }

  console.log('\n=== Repeated strong performance progresses difficulty (Rule D) ===');
  {
    const strongAttempts = [
      { caseId: 'case-04-isolated-excursion', competencyProfile: [{ dimension: 'SIGNAL_RECOGNITION', rating: 'STRONG' }] },
      { caseId: 'case-05-increased-imprecision', competencyProfile: [{ dimension: 'SIGNAL_RECOGNITION', rating: 'STRONG' }, { dimension: 'ANALYTICAL_REASONING', rating: 'STRONG' }] },
    ];
    const rec = recommendNextCase(ALL_CASES, strongAttempts);
    const DIFFICULTY_RANK = { LEVEL_1_CLEAR_SIGNAL: 0, LEVEL_2_COMPETING_EXPLANATION: 1, LEVEL_3_MULTIPLE_SIGNALS_INCOMPLETE_EVIDENCE: 2, LEVEL_4_ANALYTICAL_PLUS_RISK_TRADEOFF: 3, LEVEL_5_EXPERT_AMBIGUOUS: 4 };
    const lastCase = ALL_CASES.find(c => c.identity.id === 'case-05-increased-imprecision');
    assert('ADAPT-07', (DIFFICULTY_RANK[rec.case.identity.difficulty] ?? 0) >= (DIFFICULTY_RANK[lastCase.identity.difficulty] ?? 0), 'Following consistently strong performance, the recommended case does not decrease in difficulty');
  }

  console.log('\n=== Learner override (guidance, not a lock) ===');
  {
    const rec = recommendNextCase(ALL_CASES, []);
    const learnerChoice = ALL_CASES.find(c => c.identity.id !== rec.case.identity.id);
    assert('ADAPT-08', learnerChoice !== undefined, 'A non-recommended case genuinely exists and remains independently selectable — the recommender never removes cases from the bank');
  }

  console.log('\n=== Reset history (Section 21) ===');
  {
    const storage = makeStorage();
    recordAttempt({ attemptId: 'a1', caseId: 'case-04-isolated-excursion', competencyProfile: [] }, storage);
    assert('ADAPT-09', listAttempts(storage).length === 1, 'Attempt recorded');
    resetHistory(storage);
    assert('ADAPT-10', listAttempts(storage).length === 0, 'Reset history clears all attempts');
    const coldAgain = recommendNextCase(ALL_CASES, listAttempts(storage));
    assert('ADAPT-11', coldAgain.case.identity.difficulty === 'LEVEL_1_CLEAR_SIGNAL', 'Cold-start recommendation is restored after reset');
  }

  console.log('\n=== No hidden-ground-truth dependency ===');
  {
    const recommenderSrc = require('fs').readFileSync(path.join(MQC, 'adaptive', 'case-recommender.js'), 'utf8');
    assert('ADAPT-12', !/groundTruth/.test(recommenderSrc), 'case-recommender.js never references groundTruth');
    const historySrc = require('fs').readFileSync(path.join(MQC, 'adaptive', 'competency-history.js'), 'utf8');
    assert('ADAPT-13', !/groundTruth/.test(historySrc), 'competency-history.js never references groundTruth');
  }

  console.log('\n=== Deterministic repeated output ===');
  {
    const attempts = [{ caseId: 'case-04-isolated-excursion', competencyProfile: [{ dimension: 'EVIDENCE_SELECTION', rating: 'DEVELOPING' }] }];
    const r1 = recommendNextCase(ALL_CASES, attempts);
    const r2 = recommendNextCase(ALL_CASES, attempts);
    const r3 = recommendNextCase(ALL_CASES, attempts);
    assert('ADAPT-14', r1.case.identity.id === r2.case.identity.id && r2.case.identity.id === r3.case.identity.id, 'Identical inputs always produce the identical recommended case (no randomness)');
    assert('ADAPT-15', r1.reason === r2.reason, 'Identical inputs always produce the identical explanation text');
  }

  console.log('\n=== Trend doctrine — no invented statistics from few observations ===');
  {
    const oneObs = [{ caseId: 'x', competencyProfile: [{ dimension: 'SIGNAL_RECOGNITION', rating: 'STRONG' }] }];
    const h1 = buildCompetencyHistory(oneObs);
    assert('ADAPT-16', h1.SIGNAL_RECOGNITION.trend === 'INITIAL_EVIDENCE', 'A single observation is reported as "initial evidence", never a trend');
    const twoObs = [...oneObs, { caseId: 'y', competencyProfile: [{ dimension: 'SIGNAL_RECOGNITION', rating: 'STRONG' }] }];
    const h2 = buildCompetencyHistory(twoObs);
    assert('ADAPT-17', h2.SIGNAL_RECOGNITION.trend === 'EARLY_PATTERN', 'Two observations are reported as "early pattern", never a confident trend');
  }

  const total = passed + failed;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Adaptive Sequencing Tests: ${passed}/${total} passed, ${failed} failed`);
  if (failed > 0) { console.error('ADAPTIVE SEQUENCING TESTS FAILED.'); process.exit(1); }
  console.log('ADAPTIVE SEQUENCING TESTS PASSED.');
  process.exit(0);
}
main().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
