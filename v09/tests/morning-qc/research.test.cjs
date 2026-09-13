/* =========================================================================
   v09/tests/morning-qc/research.test.cjs

   Morning QC Room — Stage 12E Research Instrumentation Tests
   PROVENANCE: V09_TEST

   Covers: metric registry, denominator-governed instructor metrics,
   synthetic fixture determinism, and research export validation/safety.
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
  const { METRIC_REGISTRY, getMetricDefinition, safeRatio, formatRatioForDisplay } = await import('file://' + path.join(MQC, 'research', 'metric-registry.js'));
  const { computeInstructorMetrics } = await import('file://' + path.join(MQC, 'research', 'instructor-metrics.js'));
  const { buildSyntheticCohort, buildMalformedFixture } = await import('file://' + path.join(MQC, 'research', 'synthetic-fixtures.js'));
  const { buildResearchExportBundle } = await import('file://' + path.join(MQC, 'research', 'research-export.js'));
  const { validateAttemptRecord } = await import('file://' + path.join(MQC, 'adaptive', 'attempt-store.js'));

  console.log('\n=== Metric registry ===');
  {
    const ids = METRIC_REGISTRY.map(m => m.metricId);
    assert('METRIC-UNIQUE-IDS', new Set(ids).size === ids.length, 'All metric IDs are unique');
    const REQUIRED_FIELDS = ['metricId', 'displayName', 'definition', 'numerator', 'denominator', 'eligibilityCriteria', 'exclusions', 'missingDataHandling', 'sourceFields', 'interpretation', 'nonInterpretation'];
    for (const m of METRIC_REGISTRY) {
      const missing = REQUIRED_FIELDS.filter(f => !(f in m) || m[f] == null || m[f] === '');
      assert(`METRIC-COMPLETE-${m.metricId}`, missing.length === 0, `${m.metricId} defines all required fields (missing: ${JSON.stringify(missing)})`);
    }
    assert('METRIC-LOOKUP', getMetricDefinition('evidence_efficiency_ratio') !== null, 'getMetricDefinition() finds a real metric by ID');
    assert('METRIC-LOOKUP-MISS', getMetricDefinition('not_a_real_metric') === null, 'getMetricDefinition() returns null for an unknown ID');
  }

  console.log('\n=== safeRatio / formatRatioForDisplay — zero-denominator handling ===');
  {
    assert('SAFERATIO-ZERO-DENOM', safeRatio(5, 0) === null, 'safeRatio() returns null (never 0 or Infinity) for a zero denominator');
    assert('SAFERATIO-NORMAL', safeRatio(1, 4) === 0.25, 'safeRatio() computes a normal ratio correctly');
    assert('FORMAT-NULL', formatRatioForDisplay(null) === 'Not applicable (no eligible data)', 'formatRatioForDisplay() never renders "0%" for a null ratio');
    assert('FORMAT-NORMAL', formatRatioForDisplay(0.5) === '50%', 'formatRatioForDisplay() renders a normal ratio as a percentage');
  }

  console.log('\n=== Synthetic fixture determinism ===');
  {
    const cohort1 = buildSyntheticCohort();
    const cohort2 = buildSyntheticCohort();
    assert('FIXTURE-DETERMINISTIC', JSON.stringify(cohort1) === JSON.stringify(cohort2), 'Identical fixture generation calls produce byte-identical output');
    assert('FIXTURE-SIZE', cohort1.length >= 10, `Fixture cohort is genuinely heterogeneous (found ${cohort1.length} records)`);
    let allValid = true;
    for (const rec of cohort1) if (!validateAttemptRecord(rec).valid) allValid = false;
    assert('FIXTURE-ALL-VALID', allValid, 'Every synthetic fixture record passes deep canonical validation');
    const malformed = buildMalformedFixture();
    assert('FIXTURE-MALFORMED-INVALID', !validateAttemptRecord(malformed).valid, 'The deliberately malformed fixture correctly fails validation');

    // Coverage of required heterogeneous patterns.
    const ratings = cohort1.flatMap(a => a.competencyProfile.map(c => c.rating));
    assert('FIXTURE-COVERS-STRONG', ratings.includes('STRONG'), 'Fixtures include STRONG performance');
    assert('FIXTURE-COVERS-DEVELOPING', ratings.includes('DEVELOPING'), 'Fixtures include DEVELOPING performance');
    assert('FIXTURE-COVERS-NEEDS-IMPROVEMENT', ratings.includes('NEEDS_IMPROVEMENT'), 'Fixtures include NEEDS_IMPROVEMENT performance');
    const categories = cohort1.flatMap(a => a.confidenceSummary.map(c => c.category));
    assert('FIXTURE-COVERS-OVERCONFIDENT', categories.includes('INCORRECT_OVERCONFIDENT'), 'Fixtures include an overconfident unsupported decision');
    assert('FIXTURE-COVERS-UNDERCONFIDENT', categories.includes('CORRECT_UNDERCONFIDENT'), 'Fixtures include an appropriately cautious decision');
    assert('FIXTURE-COVERS-NO-VERIFICATION', cohort1.some(a => a.verificationSummary.attempted === false), 'Fixtures include a no-verification-attempted case');
    assert('FIXTURE-COVERS-FAILED-BEFORE-SUCCESS', cohort1.some(a => a.verificationSummary.hadPrematureOrFailedAttemptBeforeSuccess === true), 'Fixtures include a failed-before-successful verification pattern');
    assert('FIXTURE-COVERS-EMPTY-COMPETENCY', cohort1.some(a => a.competencyProfile.length === 0), 'Fixtures include an attempt with unevaluated (empty) competencies');
    assert('FIXTURE-COVERS-EMPTY-CONFIDENCE', cohort1.some(a => a.confidenceSummary.length === 0), 'Fixtures include a decision with no confidence recorded at all');
  }

  console.log('\n=== Denominator-governed instructor metrics ===');
  {
    const cohort = buildSyntheticCohort();
    const metrics = computeInstructorMetrics(cohort);
    assert('METRICS-DATASET-COUNT', metrics.datasetOverview.validAttemptCount === cohort.length, 'Dataset overview reports the correct valid attempt count');

    // Competency: not-evaluated is tracked separately, never folded into a rating.
    const docGov = metrics.competencySummary.DOCUMENTATION_GOVERNANCE;
    assert('METRICS-COMPETENCY-DENOMINATOR', docGov.evaluatedCount + docGov.notEvaluatedCount === cohort.length, 'Competency evaluated+not-evaluated counts sum to the full cohort');
    for (const dim of Object.keys(metrics.competencySummary)) {
      const c = metrics.competencySummary[dim];
      if (c.evaluatedCount === 0) {
        assert(`METRICS-ZERO-DENOM-${dim}`, Object.values(c.ratingProportions).every(p => p === null), `${dim}: zero evaluated count correctly yields null proportions, never 0%`);
      }
    }

    // Confidence: denominator is genuine recorded-confidence count, not total attempts.
    const totalConfidenceEntries = cohort.flatMap(a => a.confidenceSummary).length;
    assert('METRICS-CONFIDENCE-DENOMINATOR', metrics.confidenceCalibration.recordedConfidenceDenominator === totalConfidenceEntries, 'Confidence calibration denominator is the genuine recorded-confidence count, not total attempts');
    assert('METRICS-CONFIDENCE-NOT-COERCED', metrics.confidenceCalibration.recordedConfidenceDenominator < cohort.length * 2, 'Missing confidence is never coerced into a phantom recorded entry');

    // Evidence efficiency: attempts with zero evidence excluded from the denominator.
    const zeroEvidenceCount = cohort.filter(a => a.evidenceSummary.highValueObtainedCount + a.evidenceSummary.lowValueObtainedCount === 0).length;
    assert('METRICS-EVIDENCE-EXCLUDES-ZERO', metrics.evidenceUse.eligibleAttemptCount === cohort.length - zeroEvidenceCount, 'Attempts with zero obtained evidence are excluded from the efficiency-ratio denominator, not scored as 0%');

    // Verification: case counts vs attempt-sum counts kept genuinely distinct.
    assert('METRICS-VERIFICATION-DISTINCT', typeof metrics.verificationBehavior.totalFailedVerificationAttempts === 'number' && typeof metrics.verificationBehavior.casesSuccessfullyVerified === 'number', 'Verification metrics report attempt-sums and case-counts as distinct fields');

    // No ranking / no per-learner league table anywhere in the output.
    const metricsStr = JSON.stringify(metrics);
    assert('METRICS-NO-RANKING', !/rank|leaderboard|top.?learner|bottom.?learner/i.test(metricsStr), 'Instructor metrics contain no ranking, leaderboard, or top/bottom-learner concept');
  }

  console.log('\n=== One valid attempt (denominator edge case) ===');
  {
    const single = [buildSyntheticCohort()[0]];
    const m = computeInstructorMetrics(single);
    assert('METRICS-SINGLE-ATTEMPT', m.datasetOverview.validAttemptCount === 1, 'A single-attempt dataset computes without error');
  }

  console.log('\n=== Empty dataset (denominator edge case) ===');
  {
    const m = computeInstructorMetrics([]);
    assert('METRICS-EMPTY-DATASET', m.datasetOverview.validAttemptCount === 0, 'An empty dataset computes without error');
    assert('METRICS-EMPTY-NO-CRASH-RATIO', m.evidenceUse.efficiencyRatio === null, 'An empty dataset\u2019s efficiency ratio is null, not 0% or NaN');
  }

  console.log('\n=== Research export ===');
  {
    const cohort = buildSyntheticCohort();
    const malformed = buildMalformedFixture();
    const bundle = buildResearchExportBundle([...cohort, malformed], { syntheticFlag: true });
    assert('EXPORT-VALID-COUNT', bundle.manifest.validAttemptCount === cohort.length, 'Export manifest reports the correct valid attempt count');
    assert('EXPORT-EXCLUDED-COUNT', bundle.manifest.excludedRecordCount === 1, 'Export manifest correctly counts the one excluded malformed record');
    assert('EXPORT-ROW-COUNT', bundle.attemptsCsv.split('\n').length === cohort.length + 1, 'attempts.csv has exactly one header row plus one row per valid attempt');
    assert('EXPORT-SYNTHETIC-FLAG', bundle.manifest.syntheticData === true, 'Export manifest correctly flags synthetic data as synthetic');
    assert('EXPORT-SCHEMA-VERSIONS-PRESENT', !!bundle.manifest.exportSchemaVersion && !!bundle.manifest.analyticsSchemaVersion && !!bundle.manifest.caseSchemaVersion && !!bundle.manifest.metricDefinitionVersion, 'Export manifest includes all required schema versions');

    const allExportText = bundle.attemptsCsv + bundle.eventsCsv + bundle.metricDictionaryJson + bundle.manifestJson + bundle.readme;
    const FORBIDDEN_PATTERNS = [/groundTruth/i, /learnerName/i, /patientId/i, /\bemail\b/i, /staffId/i, /institution/i, /deviceId/i, /ipAddress/i];
    for (const pattern of FORBIDDEN_PATTERNS) {
      assert(`EXPORT-NO-${pattern.source.replace(/\W/g, '')}`, !pattern.test(allExportText), `Export bundle contains no "${pattern.source}"-matching content`);
    }
    assert('EXPORT-DECISIONEVENTID-PRESERVED', bundle.eventsCsv.includes('syn01-d1#1'), 'events.csv preserves the genuine decisionEventId for linkage');

    // Deterministic structure: identical input produces identical output.
    const bundle2 = buildResearchExportBundle([...cohort, malformed], { syntheticFlag: true });
    assert('EXPORT-DETERMINISTIC', bundle.attemptsCsv === bundle2.attemptsCsv && bundle.eventsCsv === bundle2.eventsCsv, 'Identical export input produces byte-identical CSV output');
  }

  const total = passed + failed;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Research Instrumentation Tests: ${passed}/${total} passed, ${failed} failed`);
  if (failed > 0) { console.error('RESEARCH INSTRUMENTATION TESTS FAILED.'); process.exit(1); }
  console.log('RESEARCH INSTRUMENTATION TESTS PASSED.');
  process.exit(0);
}
main().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
