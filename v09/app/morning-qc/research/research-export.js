/* =========================================================================
   v09/app/morning-qc/research/research-export.js

   Morning QC Room — Stage 12E Educational Research Export
   PROVENANCE: V09_MODIFIED (Stage 12E CORRECTIVE CLOSURE)

   Section 12-13: a safe, deterministic local export derived ONLY from
   already-validated canonical attempt records. Never exposes raw
   engine groundTruth, raw learner free-text documentation, patient
   identifiers, learner identity, device fingerprints, network
   identifiers, or institutional identity.

   CORRECTIVE CLOSURE FIXES:

   Section 1: genuinely re-validates the RAW stored dataset (via
   attempt-store.js's inspectStoredAttempts(), a narrow read-only
   interface addition) before export, so excludedRecordCount reflects
   the truth about the raw stored dataset, not merely records already
   silently filtered upstream by listAttempts(). When called with a
   pre-filtered array (e.g. in-memory synthetic-demo data with no raw
   storage to inspect), falls back to its own independent
   re-validation pass exactly as before — this module never trusts a
   prior filter either way.

   Section 2: event export now uses the ALREADY ACCEPTED
   projectEventsFromAttempt() as the sole, authoritative event
   projection — never reinterprets or reconstructs the event model.
   Exported as events.jsonl (one JSON object per line) rather than CSV,
   since the event schema is genuinely heterogeneous across event types
   (Section 2's explicit allowance) — a fixed CSV column set would
   either lose fields or force a lossy common denominator. Preserves
   ALL events an attempt genuinely projects, including duplicate
   CONFIDENCE_RECORDED entries for the same decisionEventId (the prior
   CSV-row-merge design silently collapsed these via Object.fromEntries
   — an export-scoped rowKey field is added to each event without
   altering any of the event's own canonical fields).

   Section 5: adds competencies.csv (long-form, one row per dimension
   per attempt) so unevaluated/null competencies remain distinguishable
   from NEEDS_IMPROVEMENT, and a machine-checkable research data
   dictionary covering every exported field.

   Section 6: the default attempts.csv no longer exports exact
   startedAt/completedAt epoch timestamps (a quasi-identifier risk when
   combined with external schedules/logs) — it exports attemptOrdinal
   (position within the encountered dataset) and durationMs (a relative
   measure) instead. Exact timestamps are never included by default.
   ========================================================================= */
import { validateAttemptRecord } from '../adaptive/attempt-store.js';
import { projectEventsFromAttempt } from '../analytics/analytics-model.js';
import { CASE_SCHEMA_VERSION } from '../case-schema.js';
import { ANALYTICS_SCHEMA_VERSION } from '../analytics/analytics-types.js';
import { METRIC_REGISTRY_VERSION, METRIC_REGISTRY } from './metric-registry.js';
import { RESEARCH_DATA_DICTIONARY } from './data-dictionary.js';

export const EXPORT_SCHEMA_VERSION = '2.0.0'; // bumped: events.jsonl + competencies.csv + privacy-minimised timing are a genuine schema change
export const APPLICATION_VERSION = 'PreciMind QC Learning Lab v0.9';

function anonymousRowKey(index) {
  return `row-${String(index + 1).padStart(4, '0')}`;
}

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function rowsToCsv(columns, rows) {
  const header = columns.join(',');
  const lines = rows.map(row => columns.map(c => csvEscape(row[c])).join(','));
  return [header, ...lines].join('\n');
}

const ATTEMPT_CSV_COLUMNS = [
  'rowKey', 'attemptOrdinal', 'caseId', 'caseFamily', 'difficulty', 'caseSchemaVersion', 'durationMs', 'finalServiceState',
  'evidenceHighValueCount', 'evidenceLowValueCount', 'evidenceEfficiencyRatio',
  'panelInspectedCount',
  'verificationAttempted', 'verificationAttemptCount', 'verificationFailedAttemptCount', 'verificationAdequate', 'verificationHadPrematureOrFailedBeforeSuccess',
  'executedActionType', 'executedOutcomeAppropriate', 'executedReasoningSupported',
  'recommendedLearningPriorities',
];

function recordToAttemptRow(record, index) {
  const duration = (typeof record.completedAt === 'number' && typeof record.startedAt === 'number') ? record.completedAt - record.startedAt : '';
  return {
    rowKey: anonymousRowKey(index), attemptOrdinal: index + 1,
    caseId: record.caseId, caseFamily: record.caseFamily ?? '', difficulty: record.difficulty ?? '', caseSchemaVersion: record.caseSchemaVersion,
    durationMs: duration, finalServiceState: record.finalServiceState,
    evidenceHighValueCount: record.evidenceSummary?.highValueObtainedCount ?? '', evidenceLowValueCount: record.evidenceSummary?.lowValueObtainedCount ?? '', evidenceEfficiencyRatio: record.evidenceSummary?.efficiencyRatio ?? '',
    panelInspectedCount: record.panelSummary?.inspectedCount ?? '',
    verificationAttempted: record.verificationSummary?.attempted ?? '', verificationAttemptCount: record.verificationSummary?.attemptCount ?? '', verificationFailedAttemptCount: record.verificationSummary?.failedAttemptCount ?? '', verificationAdequate: record.verificationSummary?.adequate ?? '', verificationHadPrematureOrFailedBeforeSuccess: record.verificationSummary?.hadPrematureOrFailedAttemptBeforeSuccess ?? '',
    executedActionType: record.executedFinalDisposition?.actionType ?? '', executedOutcomeAppropriate: record.executedFinalDisposition?.outcomeAppropriate ?? '', executedReasoningSupported: record.executedFinalDisposition?.reasoningSupported ?? '',
    recommendedLearningPriorities: (record.recommendedLearningPriorities || []).join('|'),
  };
}

const COMPETENCY_CSV_COLUMNS = ['rowKey', 'dimension', 'rating'];
function recordToCompetencyRows(record, index) {
  const rowKey = anonymousRowKey(index);
  return (record.competencyProfile || []).map(c => ({ rowKey, dimension: c.dimension, rating: c.rating ?? '' /* null (unevaluated) rendered distinctly from any rating string, including NEEDS_IMPROVEMENT */ }));
}

/**
 * Builds the full export bundle. `storedRecordsOrInspection` may be
 * EITHER a raw array (this module performs its own independent
 * revalidation pass, exactly as before) OR the result of
 * inspectStoredAttempts() (preferred when real localStorage is
 * available, since it reflects the true raw-storage count rather than
 * an already-filtered array — Section 1).
 */
export function buildResearchExportBundle(storedRecordsOrInspection, { syntheticFlag = false } = {}) {
  let validRecords, totalEncountered;
  if (Array.isArray(storedRecordsOrInspection)) {
    validRecords = [];
    let excluded = 0;
    for (const rec of storedRecordsOrInspection || []) {
      const result = validateAttemptRecord(rec);
      if (result.valid) validRecords.push(rec);
      else excluded += 1;
    }
    totalEncountered = validRecords.length + excluded;
  } else {
    // Already-inspected shape: {totalEncountered, validRecords, quarantinedCount}.
    validRecords = storedRecordsOrInspection.validRecords || [];
    totalEncountered = storedRecordsOrInspection.totalEncountered ?? validRecords.length;
  }
  const excludedCount = totalEncountered - validRecords.length;

  const attemptRows = validRecords.map((r, i) => recordToAttemptRow(r, i));
  const competencyRows = validRecords.flatMap((r, i) => recordToCompetencyRows(r, i));
  // Section 2: the SOLE authoritative event projection — never reinterpreted.
  const eventLines = validRecords.flatMap((r, i) => {
    const rowKey = anonymousRowKey(i);
    return projectEventsFromAttempt(r).map(ev => JSON.stringify({ rowKey, ...ev }));
  });

  const attemptsCsv = rowsToCsv(ATTEMPT_CSV_COLUMNS, attemptRows);
  const competenciesCsv = rowsToCsv(COMPETENCY_CSV_COLUMNS, competencyRows);
  const eventsJsonl = eventLines.join('\n');
  const metricDictionaryJson = JSON.stringify(METRIC_REGISTRY, null, 2);
  const dataDictionaryJson = JSON.stringify(RESEARCH_DATA_DICTIONARY, null, 2);

  const manifest = {
    exportSchemaVersion: EXPORT_SCHEMA_VERSION,
    analyticsSchemaVersion: ANALYTICS_SCHEMA_VERSION,
    caseSchemaVersion: CASE_SCHEMA_VERSION,
    metricDefinitionVersion: METRIC_REGISTRY_VERSION,
    applicationVersion: APPLICATION_VERSION,
    validAttemptCount: validRecords.length,
    excludedRecordCount: excludedCount,
    generatedFiles: ['attempts.csv', 'competencies.csv', 'events.jsonl', 'metric_dictionary.json', 'data_dictionary.json', 'dataset_manifest.json', 'README.md'],
    syntheticData: syntheticFlag,
    timingFieldsPolicy: 'Exact wall-clock timestamps are NOT exported by default; attemptOrdinal and durationMs are used instead (see data_dictionary.json for rationale).',
    generatedAtEpochMs: null, // set by caller if a real timestamp is desired — never fabricated here
  };

  const readme = [
    '# PreciMind QC Learning Lab — Educational Research Export',
    '',
    syntheticFlag ? '**THIS DATASET IS SYNTHETIC DEMONSTRATION DATA. It does not represent real learner data.**' : 'This dataset is derived entirely from local, anonymised simulation-learning attempt records.',
    '',
    'Simulation-learning analytics only. Not a measure of clinical competence or employment performance.',
    '',
    'Files:',
    '- attempts.csv: one row per valid attempt (anonymous rowKey, no learner identity, no exact timestamps by default).',
    '- competencies.csv: one row per (attempt, evaluated-or-not dimension) pair — unevaluated dimensions are distinguishable from any rating.',
    '- events.jsonl: the SAME canonical safe analytics events the accepted projectEventsFromAttempt() produces, one JSON object per line, with an added rowKey for linkage only.',
    '- metric_dictionary.json: the authoritative definition of every instructor/research metric.',
    '- data_dictionary.json: field-level documentation for every exported column/field.',
    '- dataset_manifest.json: schema versions, valid/excluded record counts, and generation metadata.',
    '',
    `Valid attempts: ${validRecords.length}. Excluded (malformed/legacy) records: ${excludedCount}.`,
  ].join('\n');

  return { attemptsCsv, competenciesCsv, eventsJsonl, metricDictionaryJson, dataDictionaryJson, manifestJson: JSON.stringify(manifest, null, 2), readme, manifest };
}
