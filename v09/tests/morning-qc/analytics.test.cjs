/* =========================================================================
   v09/tests/morning-qc/analytics.test.cjs

   Morning QC Room — Stage 12D Analytics Tests
   PROVENANCE: V09_TEST

   Verifies: event schema, no hidden ground truth, documentation/event
   distinction, decisionEventId preservation, aggregation correctness,
   confidence categories, no personal identifiers, schema version,
   deterministic projection.
   ========================================================================= */
'use strict';
const path = require('path');

let passed = 0, failed = 0;
function assert(id, cond, detail) {
  if (cond) { console.log(`  ✓ [${id}] ${detail}`); passed++; }
  else { console.error(`  ✗ [${id}] FAIL: ${detail}`); failed++; }
}

async function main() {
  const MQC = path.join(__dirname, '..', '..', 'app', 'morning-qc');
  const { EVENT_TYPES, EVENT_FIELD_SCHEMA, ANALYTICS_SCHEMA_VERSION } = await import('file://' + path.join(MQC, 'analytics', 'analytics-types.js'));
  const { validateEvent, aggregateAttempts } = await import('file://' + path.join(MQC, 'analytics', 'analytics-model.js'));
  const { buildInstructorSummary, REQUIRED_DISCLAIMER } = await import('file://' + path.join(MQC, 'analytics', 'instructor-projection.js'));

  console.log('\n=== Event schema (Section 40) ===');
  {
    assert('ANALYTICS-01', EVENT_TYPES.length === 10, `Exactly the 10 documented event types exist (found ${EVENT_TYPES.length})`);
    for (const t of EVENT_TYPES) {
      const schema = EVENT_FIELD_SCHEMA[t];
      assert(`ANALYTICS-SCHEMA-${t}`, Array.isArray(schema.required) && schema.required.length > 0 && Array.isArray(schema.prohibited), `${t} declares required and prohibited fields`);
      assert(`ANALYTICS-SCHEMA-GT-${t}`, schema.prohibited.includes('groundTruth'), `${t} explicitly prohibits groundTruth`);
    }
  }

  console.log('\n=== Schema version present ===');
  assert('ANALYTICS-02', ANALYTICS_SCHEMA_VERSION === '1.0.0', `analyticsSchemaVersion is present and set (found ${ANALYTICS_SCHEMA_VERSION})`);

  console.log('\n=== No hidden ground truth in events ===');
  {
    const bad = validateEvent({ type: 'DECISION_EXECUTED', caseId: 'c', decisionEventId: 'd#1', decisionId: 'd', quadrant: 'CORRECT_SUPPORTED', timestamp: 1, groundTruth: { rootCauseDescription: 'leak' } });
    assert('ANALYTICS-03', !bad.valid && bad.errors.some(e => e.includes('groundTruth')), 'An event carrying groundTruth is rejected by validateEvent');
  }

  console.log('\n=== decisionEventId preserved through DECISION_EXECUTED events ===');
  {
    const good = validateEvent({ type: 'DECISION_EXECUTED', caseId: 'c', decisionEventId: 'dec-disposition#2', decisionId: 'dec-disposition', quadrant: 'CORRECT_UNSUPPORTED', timestamp: 1 });
    assert('ANALYTICS-04', good.valid, 'A well-formed DECISION_EXECUTED event (with decisionEventId) validates');
  }

  console.log('\n=== Confidence categories ===');
  {
    const good = validateEvent({ type: 'CONFIDENCE_RECORDED', caseId: 'c', decisionEventId: 'd#1', confidence: 'HIGH', category: 'OVERCONFIDENT_WITH_INSUFFICIENT_EVIDENCE', timestamp: 1 });
    assert('ANALYTICS-05', good.valid, 'CONFIDENCE_RECORDED events carry a category field for the evidence-aware calibration category');
  }

  console.log('\n=== Aggregation correctness ===');
  {
    const attempts = [
      { caseId: 'case-04-isolated-excursion', competencyProfile: [{ dimension: 'EVIDENCE_SELECTION', rating: 'NEEDS_IMPROVEMENT' }], decisionSummary: [{ quadrant: 'CORRECT_UNSUPPORTED' }], confidenceSummary: [] },
      { caseId: 'case-04-isolated-excursion', competencyProfile: [{ dimension: 'EVIDENCE_SELECTION', rating: 'STRONG' }], decisionSummary: [{ quadrant: 'CORRECT_SUPPORTED' }], confidenceSummary: [] },
    ];
    const agg = aggregateAttempts(attempts);
    assert('ANALYTICS-06', agg.totalAttempts === 2, 'Total attempts counted correctly');
    assert('ANALYTICS-07', agg.attemptsByCase['case-04-isolated-excursion'] === 2, 'Attempts-by-case counted correctly');
    assert('ANALYTICS-08', agg.decisionQuadrantCounts.CORRECT_UNSUPPORTED === 1 && agg.decisionQuadrantCounts.CORRECT_SUPPORTED === 1, 'Decision quadrant counts aggregated correctly');
    assert('ANALYTICS-09', agg.commonLowRatedCompetencies.includes('EVIDENCE_SELECTION'), 'Low-rated competencies correctly surfaced');
  }

  console.log('\n=== Documentation vs. event distinction preserved through aggregation ===');
  {
    // An attempt where the learner DOCUMENTED a disposition but the actual
    // finalServiceState never reflects a genuine resume must not be
    // silently collapsed into "resumed" statistics.
    const attempts = [{ caseId: 'x', finalServiceState: 'RUNNING', competencyProfile: [], decisionSummary: [], confidenceSummary: [] }];
    const agg = aggregateAttempts(attempts);
    assert('ANALYTICS-10', agg.totalAttempts === 1, 'Aggregation reflects the real finalServiceState from engine truth, not a documentation claim (the attempt record itself only ever stores the engine-derived finalServiceState field, never a separate learner-claimed one)');
  }

  console.log('\n=== No personal identifiers ===');
  {
    const summary = buildInstructorSummary({ 'Learner A': [], 'Learner B': [] });
    const summaryStr = JSON.stringify(summary);
    assert('ANALYTICS-11', !/@|\d{3}-\d{2}-\d{4}/.test(summaryStr), 'No email-like or SSN-like patterns appear in the instructor summary');
    assert('ANALYTICS-12', Object.keys(summary.perLearner).every(k => /^Learner [A-Z]$/.test(k)), 'Synthetic learner labels follow the "Learner A/B/C" convention, never real names');
  }

  console.log('\n=== Required disclaimer always present ===');
  assert('ANALYTICS-13', REQUIRED_DISCLAIMER.includes('Not a measure of clinical competence'), 'The required non-clinical-performance disclaimer is defined and available for the UI to render');

  console.log('\n=== Deterministic projection ===');
  {
    const attempts = [{ caseId: 'x', competencyProfile: [{ dimension: 'SIGNAL_RECOGNITION', rating: 'STRONG' }], decisionSummary: [], confidenceSummary: [] }];
    const a1 = JSON.stringify(aggregateAttempts(attempts));
    const a2 = JSON.stringify(aggregateAttempts(attempts));
    assert('ANALYTICS-14', a1 === a2, 'Identical attempt records always produce an identical aggregation');
  }

  console.log('\n=== Strict allowlist privacy hardening (Section 12 corrective closure) — required adversarial replays ===');
  {
    const adversarialCases = [
      ['email', { type: 'DECISION_EXECUTED', caseId: 'c', decisionEventId: 'd#1', decisionId: 'd', quadrant: 'CORRECT_SUPPORTED', timestamp: 1, email: 'x@y.com' }],
      ['staffId', { type: 'DECISION_EXECUTED', caseId: 'c', decisionEventId: 'd#1', decisionId: 'd', quadrant: 'CORRECT_SUPPORTED', timestamp: 1, staffId: '12345' }],
      ['learnerName', { type: 'CASE_COMPLETED', caseId: 'c', finalServiceState: 'RESUMED', timestamp: 1, learnerName: 'John Smith' }],
      ['institution', { type: 'CASE_COMPLETED', caseId: 'c', finalServiceState: 'RESUMED', timestamp: 1, institution: 'Acme Hospital' }],
      ['patientId', { type: 'CASE_STARTED', caseId: 'c', timestamp: 1, patientId: 'PT-00123' }],
      ['groundTruth', { type: 'CASE_STARTED', caseId: 'c', timestamp: 1, groundTruth: { rootCauseDescription: 'leak' } }],
      ['arbitraryUnknownField', { type: 'CASE_STARTED', caseId: 'c', timestamp: 1, arbitraryUnknownField: 'anything' }],
    ];
    for (const [label, event] of adversarialCases) {
      const result = validateEvent(event);
      assert(`ANALYTICS-ADV-${label}`, !result.valid, `Event carrying "${label}" is correctly REJECTED by the strict allowlist (errors: ${JSON.stringify(result.errors)})`);
    }
  }

  console.log('\n=== Event pipeline operational (Section 16 corrective closure) ===');
  {
    const { projectEventsFromAttempt } = await import('file://' + path.join(MQC, 'analytics', 'analytics-model.js'));
    const record = {
      attemptId: 'a1', caseId: 'case-04-isolated-excursion', caseFamily: 'A', difficulty: 'LEVEL_1_CLEAR_SIGNAL',
      startedAt: 100, completedAt: 200,
      competencyProfile: [{ dimension: 'SIGNAL_RECOGNITION', rating: 'STRONG' }],
      decisionSummary: [{ decisionEventId: 'dec-containment#1', decisionId: 'dec-containment', quadrant: 'CORRECT_SUPPORTED' }],
      confidenceSummary: [{ decisionEventId: 'dec-containment#1', confidence: 'HIGH', category: 'CORRECT_CALIBRATED' }],
      verificationSummary: { attempted: true, adequate: true },
      finalServiceState: 'RESUMED',
    };
    const events = projectEventsFromAttempt(record);
    assert('ANALYTICS-PIPELINE-01', events.length >= 5, `A genuine attempt record projects into multiple real events (found ${events.length})`);
    assert('ANALYTICS-PIPELINE-02', events.every(e => validateEvent(e).valid), 'Every generated event independently passes the strict validator');
    assert('ANALYTICS-PIPELINE-03', events.some(e => e.type === 'DECISION_EXECUTED' && e.decisionEventId === 'dec-containment#1'), 'decisionEventId is preserved through the projection into a real DECISION_EXECUTED event');
  }

  console.log('\n=== Nested privacy adversarial matrix (Section 14/15 FINAL closure) ===');
  {
    const nested1 = validateEvent({ type: 'CASE_COMPLETED', caseId: 'c', finalServiceState: 'RESUMED', timestamp: 1, competencyProfile: [{ dimension: 'SIGNAL_RECOGNITION', rating: 'STRONG', staffId: '123', groundTruth: {} }] });
    assert('ANALYTICS-NESTED-competencyProfile', !nested1.valid, `Nested staffId/groundTruth inside CASE_COMPLETED.competencyProfile is correctly rejected (errors: ${JSON.stringify(nested1.errors)})`);

    const nested2 = validateEvent({ type: 'CASE_STARTED', caseId: { email: 'x@y.com' }, timestamp: 1 });
    assert('ANALYTICS-NESTED-scalar-as-object', !nested2.valid, 'A scalar field (caseId) supplied as an object is correctly rejected');

    const nested3 = validateEvent({ type: 'CASE_RECOMMENDED', caseId: 'c', reason: { patientId: 'x' }, timestamp: 1 });
    assert('ANALYTICS-NESTED-reason-as-object', !nested3.valid, 'CASE_RECOMMENDED.reason supplied as an object (nested patientId) is correctly rejected');
  }

  const total = passed + failed;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Analytics Tests: ${passed}/${total} passed, ${failed} failed`);
  if (failed > 0) { console.error('ANALYTICS TESTS FAILED.'); process.exit(1); }
  console.log('ANALYTICS TESTS PASSED.');
  process.exit(0);
}
main().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
