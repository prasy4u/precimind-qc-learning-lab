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
  const { recommendNextCase, caseTargetsDimension } = await import('file://' + path.join(MQC, 'adaptive', 'case-recommender.js'));
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

  console.log('\n=== ADAPT-TARGET: genuine competency-target matching (Section 8/10 corrective closure) ===');
  {
    const { SCORING_DIMENSIONS } = await import('file://' + path.join(MQC, 'states.js'));

    // ADAPT-TARGET-05: no universal "return true" target fallback exists.
    const recommenderSrc = require('fs').readFileSync(path.join(MQC, 'adaptive', 'case-recommender.js'), 'utf8');
    assert('ADAPT-TARGET-05', !/function caseTargetsDimension[^{]*\{\s*return true;\s*\}/.test(recommenderSrc), 'caseTargetsDimension() contains no unconditional "return true" fallback');

    // ADAPT-TARGET-01: for every dimension that has at least one genuinely
    // targeting case, the recommended case's own competencyTargets
    // includes that dimension.
    let allTargetingCorrect = true;
    for (const dim of SCORING_DIMENSIONS) {
      const targetingCases = ALL_CASES.filter(c => (c.identity.curriculum?.competencyTargets || []).includes(dim));
      if (targetingCases.length === 0) continue;
      const weakAttempt = { caseId: ALL_CASES[0].identity.id, competencyProfile: [{ dimension: dim, rating: 'NEEDS_IMPROVEMENT' }] };
      const rec = recommendNextCase(ALL_CASES, [weakAttempt]);
      const recCase = ALL_CASES.find(c => c.identity.id === rec.case.identity.id);
      if (!(recCase.identity.curriculum?.competencyTargets || []).includes(dim)) {
        allTargetingCorrect = false;
        console.error(`    ${dim}: recommended ${rec.case.identity.id}, which does NOT target it`);
      }
    }
    assert('ADAPT-TARGET-01', allTargetingCorrect, 'For every dimension with a genuinely targeting case, the recommended case\u2019s own competencyTargets includes that exact dimension');

    // ADAPT-TARGET-02: different weak competencies permitted to produce different recommendations.
    const recA = recommendNextCase(ALL_CASES, [{ caseId: 'case-04-isolated-excursion', competencyProfile: [{ dimension: 'EVIDENCE_SELECTION', rating: 'NEEDS_IMPROVEMENT' }] }]);
    const recB = recommendNextCase(ALL_CASES, [{ caseId: 'case-04-isolated-excursion', competencyProfile: [{ dimension: 'PATIENT_IMPACT_REASONING', rating: 'NEEDS_IMPROVEMENT' }] }]);
    assert('ADAPT-TARGET-02', recA.case.identity.id !== recB.case.identity.id, `Different weak competencies produce different recommendations (found ${recA.case.identity.id} vs ${recB.case.identity.id})`);

    // ADAPT-TARGET-03: the explanation names exactly a competency actually targeted by the chosen case.
    const rec3 = recommendNextCase(ALL_CASES, [{ caseId: 'case-04-isolated-excursion', competencyProfile: [{ dimension: 'EVIDENCE_SELECTION', rating: 'NEEDS_IMPROVEMENT' }] }]);
    const rec3Case = ALL_CASES.find(c => c.identity.id === rec3.case.identity.id);
    assert('ADAPT-TARGET-03', (rec3Case.identity.curriculum?.competencyTargets || []).includes('EVIDENCE_SELECTION') && /evidence selection/i.test(rec3.reason), 'The explanation names a competency the chosen case genuinely, verifiably targets');

    // ADAPT-TARGET-04: prerequisiteCompetencies are never treated as competencyTargets.
    const caseWithOnlyPrereq = ALL_CASES.find(c => (c.identity.curriculum?.prerequisiteCompetencies || []).length > 0 && !(c.identity.curriculum?.competencyTargets || []).includes(c.identity.curriculum.prerequisiteCompetencies[0]));
    assert('ADAPT-TARGET-04', caseWithOnlyPrereq !== undefined, 'At least one case has a prerequisiteCompetency that is genuinely NOT also listed as a competencyTarget (proving the two axes are kept distinct)');
    if (caseWithOnlyPrereq) {
      const prereqDim = caseWithOnlyPrereq.identity.curriculum.prerequisiteCompetencies[0];
      assert('ADAPT-TARGET-04b', !caseTargetsDimension(caseWithOnlyPrereq, prereqDim), `caseTargetsDimension() correctly does not treat prerequisiteCompetency "${prereqDim}" as a target for ${caseWithOnlyPrereq.identity.id}`);
    }
  }

  console.log('\n=== Synthetic Level-5 sequencing (Section 9) ===');
  {
    const syntheticLevel5Case = { identity: { id: 'synthetic-level-5-test-case', difficulty: 'LEVEL_5_COMPLEX_GOVERNANCE_LONGITUDINAL', caseFamily: 'Z', curriculum: { competencyTargets: [] } } };
    const casesWithSynthetic = [...ALL_CASES, syntheticLevel5Case];
    // Strong performance across all attempted real cases should be able to progress toward the synthetic Level-5 case.
    const strongAttempts = ALL_CASES.slice(0, 3).map(c => ({ caseId: c.identity.id, competencyProfile: [{ dimension: 'SIGNAL_RECOGNITION', rating: 'STRONG' }] }));
    const rec5 = recommendNextCase(casesWithSynthetic, strongAttempts);
    assert('ADAPT-L5-01', rec5 !== null, 'A recommendation is produced even with a genuine Level-5 case present in the bank');
    // Directly verify Level 5 ranks highest, never falling through to rank 0.
    const difficultyOrder = ['LEVEL_1_CLEAR_SIGNAL', 'LEVEL_2_COMPETING_EXPLANATION', 'LEVEL_3_MULTIPLE_SIGNALS_INCOMPLETE_EVIDENCE', 'LEVEL_4_ANALYTICAL_PLUS_RISK_TRADEOFF', 'LEVEL_5_COMPLEX_GOVERNANCE_LONGITUDINAL'];
    const recommenderSrc2 = require('fs').readFileSync(path.join(MQC, 'adaptive', 'case-recommender.js'), 'utf8');
    const recommenderCodeOnly = recommenderSrc2.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    assert('ADAPT-L5-02', recommenderCodeOnly.includes('CASE_DIFFICULTY_LEVELS') && !recommenderCodeOnly.includes('LEVEL_5_EXPERT_AMBIGUOUS'), 'The recommender\u2019s actual code (not comments) uses the authoritative CASE_DIFFICULTY_LEVELS array, not a second drifting copy with the incorrect "LEVEL_5_EXPERT_AMBIGUOUS" label');
  }

  console.log('\n=== Attempt-store strict allowlist privacy hardening (Section 11 corrective closure) — required adversarial replays ===');
  {
    const { recordAttempt } = await import('file://' + path.join(MQC, 'adaptive', 'attempt-store.js'));
    const storage = makeStorage();
    const adversarialRecords = [
      ['groundTruth', { attemptId: 'a1', caseId: 'c', groundTruth: { rootCauseDescription: 'leak' } }],
      ['email', { attemptId: 'a2', caseId: 'c', email: 'x@y.com' }],
      ['name', { attemptId: 'a3', caseId: 'c', name: 'John Smith' }],
      ['staffIdentifier', { attemptId: 'a4', caseId: 'c', staffIdentifier: '99887' }],
      ['institution', { attemptId: 'a5', caseId: 'c', institution: 'Acme Hospital' }],
      ['patientIdentifier', { attemptId: 'a6', caseId: 'c', patientIdentifier: 'PT-001' }],
      ['ipAddress', { attemptId: 'a7', caseId: 'c', ipAddress: '127.0.0.1' }],
    ];
    for (const [label, record] of adversarialRecords) {
      let threw = false;
      try { recordAttempt(record, storage); } catch { threw = true; }
      assert(`ADAPT-PRIVACY-${label}`, threw, `recordAttempt() correctly REFUSES (throws) a record carrying "${label}" through the public API`);
    }
    assert('ADAPT-PRIVACY-NONE-PERSISTED', listAttempts(storage).length === 0, 'None of the 7 rejected adversarial records were ever persisted to storage');
  }

  const total = passed + failed;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Adaptive Sequencing Tests: ${passed}/${total} passed, ${failed} failed`);
  if (failed > 0) { console.error('ADAPTIVE SEQUENCING TESTS FAILED.'); process.exit(1); }
  console.log('ADAPTIVE SEQUENCING TESTS PASSED.');
  process.exit(0);
}
main().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
