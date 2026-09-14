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
    assert('EXPORT-DECISIONEVENTID-PRESERVED', bundle.eventsJsonl.includes('syn01-d1#1'), 'events.jsonl preserves the genuine decisionEventId for linkage');

    // Deterministic structure: identical input produces identical output.
    const bundle2 = buildResearchExportBundle([...cohort, malformed], { syntheticFlag: true });
    assert('EXPORT-DETERMINISTIC', bundle.attemptsCsv === bundle2.attemptsCsv && bundle.eventsJsonl === bundle2.eventsJsonl, 'Identical export input produces byte-identical output');
  }

  console.log('\n=== CORRECTIVE CLOSURE Section 1: raw-storage/quarantine truth boundary ===');
  {
    const { inspectStoredAttempts } = await import('file://' + path.join(MQC, 'adaptive', 'attempt-store.js'));
    const storage = { data: {}, getItem(k) { return this.data[k] || null; }, setItem(k, v) { this.data[k] = v; }, removeItem(k) { delete this.data[k]; } };
    storage.setItem('precimind-morningqc-attempts-v1', JSON.stringify([buildSyntheticCohort()[0], buildMalformedFixture()]));
    const inspection = inspectStoredAttempts(storage);
    assert('QUARANTINE-TOTAL-ENCOUNTERED', inspection.totalEncountered === 2, 'inspectStoredAttempts() reports 2 raw records encountered');
    assert('QUARANTINE-VALID-COUNT', inspection.validAttemptCount === 1, 'inspectStoredAttempts() reports exactly 1 valid record');
    assert('QUARANTINE-COUNT', inspection.quarantinedCount === 1, 'inspectStoredAttempts() reports exactly 1 quarantined record');
    const { listAttempts } = await import('file://' + path.join(MQC, 'adaptive', 'attempt-store.js'));
    assert('QUARANTINE-LISTATTEMPTS-UNCHANGED', listAttempts(storage).length === 1, 'listAttempts() semantics remain completely unchanged (still 1)');

    const bundleFromInspection = buildResearchExportBundle(inspection, { syntheticFlag: false });
    assert('QUARANTINE-EXPORT-TRUTH-VALID', bundleFromInspection.manifest.validAttemptCount === 1, 'Export manifest built from the raw-storage inspection reports the TRUE valid count (1)');
    assert('QUARANTINE-EXPORT-TRUTH-EXCLUDED', bundleFromInspection.manifest.excludedRecordCount === 1, 'Export manifest built from the raw-storage inspection reports the TRUE excluded count (1) — closing the exact gap the audit reproduced (previously 0)');
  }

  console.log('\n=== CORRECTIVE CLOSURE Section 2: canonical event export parity + duplicate confidence preservation ===');
  {
    const { projectEventsFromAttempt } = await import('file://' + path.join(MQC, 'analytics', 'analytics-model.js'));
    for (const record of buildSyntheticCohort()) {
      const canonicalEvents = projectEventsFromAttempt(record);
      const bundle = buildResearchExportBundle([record]);
      const exportedEvents = bundle.eventsJsonl.split('\n').filter(Boolean).map(l => { const { rowKey, ...rest } = JSON.parse(l); return rest; });
      assert(`EVENT-PARITY-${record.attemptId}`, JSON.stringify(canonicalEvents) === JSON.stringify(exportedEvents), `${record.attemptId}: exported event sequence exactly matches projectEventsFromAttempt() (count: canonical=${canonicalEvents.length}, exported=${exportedEvents.length})`);
    }

    // The exact adversarial regression: two confidenceSummary entries for the SAME decisionEventId.
    const base = buildSyntheticCohort()[0];
    const dupConfidenceRecord = { ...base, confidenceSummary: [
      { decisionEventId: base.decisionSummary[0].decisionEventId, confidence: 'HIGH', category: 'CORRECT_CALIBRATED' },
      { decisionEventId: base.decisionSummary[0].decisionEventId, confidence: 'LOW', category: 'CORRECT_UNDERCONFIDENT' },
    ] };
    const dupBundle = buildResearchExportBundle([dupConfidenceRecord]);
    const confidenceEvents = dupBundle.eventsJsonl.split('\n').filter(l => l.includes('CONFIDENCE_RECORDED'));
    assert('EVENT-DUPLICATE-CONFIDENCE-PRESERVED', confidenceEvents.length === 2, `Both duplicate CONFIDENCE_RECORDED events for the same decisionEventId survive export (found ${confidenceEvents.length}, previously lost one via Object.fromEntries collapse)`);
    const parsedConfEvents = confidenceEvents.map(l => JSON.parse(l));
    assert('EVENT-DUPLICATE-CONFIDENCE-DISTINCT-VALUES', parsedConfEvents[0].confidence === 'HIGH' && parsedConfEvents[1].confidence === 'LOW', 'Both distinct confidence values (HIGH and LOW) are preserved, not merged or overwritten');
  }

  console.log('\n=== CORRECTIVE CLOSURE Section 5: competency export + data dictionary ===');
  {
    const cohort = buildSyntheticCohort();
    const bundle = buildResearchExportBundle(cohort);
    const competencyLines = bundle.competenciesCsv.split('\n');
    assert('COMPETENCY-EXPORT-HEADER', competencyLines[0] === 'rowKey,dimension,rating', 'competencies.csv has the expected long-form header');
    const totalCompetencyEntries = cohort.reduce((s, r) => s + r.competencyProfile.length, 0);
    assert('COMPETENCY-EXPORT-ROW-COUNT', competencyLines.length - 1 === totalCompetencyEntries, 'competencies.csv has exactly one row per (attempt, evaluated dimension) pair');

    const { RESEARCH_DATA_DICTIONARY } = await import('file://' + path.join(MQC, 'research', 'data-dictionary.js'));
    const REQUIRED_DICT_FIELDS = ['field', 'file', 'type', 'nullable', 'source', 'level', 'meaning', 'interpretation', 'limitations'];
    for (const entry of RESEARCH_DATA_DICTIONARY) {
      const missing = REQUIRED_DICT_FIELDS.filter(f => !(f in entry));
      assert(`DICTIONARY-COMPLETE-${entry.file}-${entry.field}`, missing.length === 0, `${entry.file}.${entry.field} data-dictionary entry is complete`);
    }
    // Governance: every exported column has a corresponding dictionary entry.
    const dictFieldsByFile = {};
    for (const entry of RESEARCH_DATA_DICTIONARY) { (dictFieldsByFile[entry.file] = dictFieldsByFile[entry.file] || new Set()).add(entry.field); }
    const attemptsCsvColumns = bundle.attemptsCsv.split('\n')[0].split(',');
    for (const col of attemptsCsvColumns) {
      assert(`DICTIONARY-COVERS-attempts.csv-${col}`, dictFieldsByFile['attempts.csv']?.has(col), `attempts.csv column "${col}" has a data-dictionary entry`);
    }
    const competencyCsvColumns = bundle.competenciesCsv.split('\n')[0].split(',');
    for (const col of competencyCsvColumns) {
      assert(`DICTIONARY-COVERS-competencies.csv-${col}`, dictFieldsByFile['competencies.csv']?.has(col), `competencies.csv column "${col}" has a data-dictionary entry`);
    }

    // Item 2 (FINAL MICRO-closure): every field allowed/emitted through
    // EVENT_FIELD_SCHEMA (required + optional, across ALL event types),
    // plus the export-added rowKey and the type discriminator itself,
    // must have an individual dictionary entry — no generic placeholder.
    const { EVENT_FIELD_SCHEMA } = await import('file://' + path.join(MQC, 'analytics', 'analytics-types.js'));
    const allEventFields = new Set(['rowKey', 'type']);
    for (const schema of Object.values(EVENT_FIELD_SCHEMA)) {
      for (const f of [...schema.required, ...schema.optional]) allEventFields.add(f);
    }
    for (const field of allEventFields) {
      assert(`DICTIONARY-COVERS-events.jsonl-${field}`, dictFieldsByFile['events.jsonl']?.has(field), `events.jsonl field "${field}" (from EVENT_FIELD_SCHEMA) has an individual data-dictionary entry`);
    }
    assert('DICTIONARY-NO-GENERIC-PLACEHOLDER', !dictFieldsByFile['events.jsonl']?.has('(other canonical event fields)'), 'The generic "(other canonical event fields)" placeholder has been removed now that explicit coverage exists');

    // Every manifest field ACTUALLY emitted has a dictionary entry.
    const manifestFields = Object.keys(bundle.manifest);
    for (const field of manifestFields) {
      assert(`DICTIONARY-COVERS-manifest-${field}`, dictFieldsByFile['dataset_manifest.json']?.has(field), `dataset_manifest.json field "${field}" (actually emitted) has a data-dictionary entry`);
    }
  }

  console.log('\n=== CORRECTIVE CLOSURE Section 6: privacy-minimised time fields ===');
  {
    const cohort = buildSyntheticCohort();
    const bundle = buildResearchExportBundle(cohort);
    assert('NO-EXACT-STARTEDAT-COLUMN', !bundle.attemptsCsv.split('\n')[0].split(',').includes('startedAt'), 'attempts.csv does not export exact startedAt epoch timestamp by default');
    assert('NO-EXACT-COMPLETEDAT-COLUMN', !bundle.attemptsCsv.split('\n')[0].split(',').includes('completedAt'), 'attempts.csv does not export exact completedAt epoch timestamp by default');
    assert('HAS-ATTEMPT-ORDINAL', bundle.attemptsCsv.split('\n')[0].split(',').includes('attemptOrdinal'), 'attempts.csv exports attemptOrdinal instead');
    assert('HAS-DURATION-MS', bundle.attemptsCsv.split('\n')[0].split(',').includes('durationMs'), 'attempts.csv exports durationMs instead');
    assert('MANIFEST-DOCUMENTS-TIMING-POLICY', typeof bundle.manifest.timingFieldsPolicy === 'string' && bundle.manifest.timingFieldsPolicy.length > 0, 'The manifest documents the timing-fields privacy policy explicitly');
  }

  console.log('\n=== FINAL MICRO-CLOSURE Item 3: malformed-container truth (A-E scenarios) ===');
  {
    function mkStorage(val) { return { data: val !== undefined ? { 'precimind-morningqc-attempts-v1': val } : {}, getItem(k) { return this.data[k] || null; }, setItem(k, v) { this.data[k] = v; }, removeItem(k) { delete this.data[k]; } }; }
    const { inspectStoredAttempts } = await import('file://' + path.join(MQC, 'adaptive', 'attempt-store.js'));

    const bundleA = buildResearchExportBundle(inspectStoredAttempts(mkStorage()));
    assert('MALFORMED-A-NO-ENTRY', bundleA.manifest.malformedContainer === false && bundleA.manifest.recordCountsReliable === true && bundleA.manifest.excludedRecordCount === 0, 'A: no storage entry is clean, not malformed');

    const bundleB = buildResearchExportBundle(inspectStoredAttempts(mkStorage('[]')));
    assert('MALFORMED-B-EMPTY-ARRAY', bundleB.manifest.malformedContainer === false && bundleB.manifest.recordCountsReliable === true && bundleB.manifest.excludedRecordCount === 0, 'B: a clean empty array is not malformed');

    const storageC = mkStorage();
    storageC.setItem('precimind-morningqc-attempts-v1', JSON.stringify([buildSyntheticCohort()[0], buildMalformedFixture()]));
    const bundleC = buildResearchExportBundle(inspectStoredAttempts(storageC));
    assert('MALFORMED-C-MIXED', bundleC.manifest.malformedContainer === false && bundleC.manifest.validAttemptCount === 1 && bundleC.manifest.excludedRecordCount === 1, 'C: one valid + one invalid record is a reliable count (1 valid, 1 excluded), not malformed');

    const bundleD = buildResearchExportBundle(inspectStoredAttempts(mkStorage('{not valid json')));
    assert('MALFORMED-D-BAD-JSON', bundleD.manifest.malformedContainer === true && bundleD.manifest.recordCountsReliable === false && bundleD.manifest.excludedRecordCount === null, 'D: malformed JSON is truthfully flagged malformed, with excludedRecordCount null (never fabricated as 0)');

    const bundleE = buildResearchExportBundle(inspectStoredAttempts(mkStorage('{"foo":1}')));
    assert('MALFORMED-E-NON-ARRAY', bundleE.manifest.malformedContainer === true && bundleE.manifest.recordCountsReliable === false && bundleE.manifest.excludedRecordCount === null, 'E: valid JSON but non-array is truthfully flagged malformed');

    assert('MALFORMED-D-E-DISTINGUISHABLE-FROM-CLEAN', bundleD.manifest.malformedContainer !== bundleA.manifest.malformedContainer && bundleE.manifest.malformedContainer !== bundleB.manifest.malformedContainer, 'Malformed containers (D, E) are never indistinguishable from a clean empty dataset (A, B)');
  }

  console.log('\n=== FINAL MICRO-CLOSURE Item 1: per-case denominator-governed analytics ===');
  {
    const cohort = buildSyntheticCohort();
    const metrics = computeInstructorMetrics(cohort);
    const REQUIRED_CASE_FIELDS = ['attemptCount', 'caseFamily', 'difficulty', 'confidence', 'evidence', 'verification', 'disposition', 'decision'];
    for (const [caseId, s] of Object.entries(metrics.caseLevelSummary)) {
      const missing = REQUIRED_CASE_FIELDS.filter(f => !(f in s));
      assert(`PERCASE-COMPLETE-${caseId}`, missing.length === 0, `${caseId}: per-case summary includes all required denominator-governed sections (missing: ${JSON.stringify(missing)})`);
    }
    // Per-case sums are internally consistent with the dataset-level aggregate.
    const totalCaseDecisions = Object.values(metrics.caseLevelSummary).reduce((s, c) => s + c.decision.totalDecisionCount, 0);
    assert('PERCASE-DECISION-SUM-CONSISTENT', totalCaseDecisions === metrics.decisionQuality.totalDecisions, 'Summing each case\u2019s totalDecisionCount equals the dataset-level total (single shared definition, no drift)');
    const totalCaseDispositions = Object.values(metrics.caseLevelSummary).reduce((s, c) => s + c.disposition.dispositionEligibleCount, 0);
    assert('PERCASE-DISPOSITION-SUM-CONSISTENT', totalCaseDispositions === metrics.finalDisposition.recordsWithDisposition, 'Summing each case\u2019s dispositionEligibleCount equals the dataset-level total');
  }

  const total = passed + failed;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Research Instrumentation Tests: ${passed}/${total} passed, ${failed} failed`);
  if (failed > 0) { console.error('RESEARCH INSTRUMENTATION TESTS FAILED.'); process.exit(1); }
  console.log('RESEARCH INSTRUMENTATION TESTS PASSED.');
  process.exit(0);
}
main().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
