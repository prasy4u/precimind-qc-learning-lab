/* =========================================================================
   v09/app/morning-qc/research/research-export.js

   Morning QC Room — Stage 12E Educational Research Export
   PROVENANCE: V09_NEW

   Section 12-13: a safe, deterministic local export derived ONLY from
   already-validated canonical attempt records. Never exposes raw
   engine groundTruth, raw learner free-text documentation, patient
   identifiers, learner identity, device fingerprints, network
   identifiers, or institutional identity — there are no such fields in
   the canonical attempt-record schema to begin with (attempt-store.js's
   strict allowlist already prevents them from ever being persisted),
   and this module does not read from any other source.

   Before export, EVERY stored record is re-validated (Section 13):
   malformed/legacy records are excluded and counted in the manifest,
   never silently coerced.
   ========================================================================= */
import { validateAttemptRecord } from '../adaptive/attempt-store.js';
import { CASE_SCHEMA_VERSION } from '../case-schema.js';
import { ANALYTICS_SCHEMA_VERSION } from '../analytics/analytics-types.js';
import { METRIC_REGISTRY_VERSION, METRIC_REGISTRY } from './metric-registry.js';

export const EXPORT_SCHEMA_VERSION = '1.0.0';
export const APPLICATION_VERSION = 'PreciMind QC Learning Lab v0.9';

/** Generates a short, non-identifying local research key — never derived from any identity field (none exist to derive from). */
function anonymousRowKey(index) {
  return `row-${String(index + 1).padStart(4, '0')}`;
}

const ATTEMPT_CSV_COLUMNS = [
  'rowKey', 'caseId', 'caseFamily', 'difficulty', 'caseSchemaVersion',
  'startedAt', 'completedAt', 'finalServiceState',
  'evidenceHighValueCount', 'evidenceLowValueCount', 'evidenceEfficiencyRatio',
  'panelInspectedCount',
  'verificationAttempted', 'verificationAttemptCount', 'verificationFailedAttemptCount', 'verificationAdequate', 'verificationHadPrematureOrFailedBeforeSuccess',
  'executedActionType', 'executedOutcomeAppropriate', 'executedReasoningSupported',
  'recommendedLearningPriorities',
];

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function recordToAttemptRow(record, index) {
  return {
    rowKey: anonymousRowKey(index),
    caseId: record.caseId, caseFamily: record.caseFamily ?? '', difficulty: record.difficulty ?? '', caseSchemaVersion: record.caseSchemaVersion,
    startedAt: record.startedAt, completedAt: record.completedAt, finalServiceState: record.finalServiceState,
    evidenceHighValueCount: record.evidenceSummary?.highValueObtainedCount ?? '', evidenceLowValueCount: record.evidenceSummary?.lowValueObtainedCount ?? '', evidenceEfficiencyRatio: record.evidenceSummary?.efficiencyRatio ?? '',
    panelInspectedCount: record.panelSummary?.inspectedCount ?? '',
    verificationAttempted: record.verificationSummary?.attempted ?? '', verificationAttemptCount: record.verificationSummary?.attemptCount ?? '', verificationFailedAttemptCount: record.verificationSummary?.failedAttemptCount ?? '', verificationAdequate: record.verificationSummary?.adequate ?? '', verificationHadPrematureOrFailedBeforeSuccess: record.verificationSummary?.hadPrematureOrFailedAttemptBeforeSuccess ?? '',
    executedActionType: record.executedFinalDisposition?.actionType ?? '', executedOutcomeAppropriate: record.executedFinalDisposition?.outcomeAppropriate ?? '', executedReasoningSupported: record.executedFinalDisposition?.reasoningSupported ?? '',
    recommendedLearningPriorities: (record.recommendedLearningPriorities || []).join('|'),
  };
}

function rowsToCsv(columns, rows) {
  const header = columns.join(',');
  const lines = rows.map(row => columns.map(c => csvEscape(row[c])).join(','));
  return [header, ...lines].join('\n');
}

const EVENT_CSV_COLUMNS = ['rowKey', 'decisionEventId', 'decisionId', 'quadrant', 'confidence', 'confidenceCategory'];

function recordToEventRows(record, index) {
  const rowKey = anonymousRowKey(index);
  const confidenceByEvent = Object.fromEntries((record.confidenceSummary || []).map(c => [c.decisionEventId, c]));
  return (record.decisionSummary || []).map(d => {
    const conf = confidenceByEvent[d.decisionEventId];
    return {
      rowKey, decisionEventId: d.decisionEventId, decisionId: d.decisionId, quadrant: d.quadrant,
      confidence: conf?.confidence ?? '', confidenceCategory: conf?.category ?? '',
    };
  });
}

/**
 * Builds the full export bundle. `storedRecords` is the RAW array read
 * directly from storage (may include malformed/legacy entries) — this
 * function performs its own independent revalidation pass (Section 13),
 * never trusting a prior filter.
 */
export function buildResearchExportBundle(storedRecords, { syntheticFlag = false } = {}) {
  const validRecords = [];
  let excludedCount = 0;
  for (const rec of storedRecords || []) {
    const result = validateAttemptRecord(rec);
    if (result.valid) validRecords.push(rec);
    else excludedCount += 1;
  }

  const attemptRows = validRecords.map((r, i) => recordToAttemptRow(r, i));
  const eventRows = validRecords.flatMap((r, i) => recordToEventRows(r, i));

  const attemptsCsv = rowsToCsv(ATTEMPT_CSV_COLUMNS, attemptRows);
  const eventsCsv = rowsToCsv(EVENT_CSV_COLUMNS, eventRows);
  const metricDictionaryJson = JSON.stringify(METRIC_REGISTRY, null, 2);

  const manifest = {
    exportSchemaVersion: EXPORT_SCHEMA_VERSION,
    analyticsSchemaVersion: ANALYTICS_SCHEMA_VERSION,
    caseSchemaVersion: CASE_SCHEMA_VERSION,
    metricDefinitionVersion: METRIC_REGISTRY_VERSION,
    applicationVersion: APPLICATION_VERSION,
    validAttemptCount: validRecords.length,
    excludedRecordCount: excludedCount,
    generatedFiles: ['attempts.csv', 'events.csv', 'metric_dictionary.json', 'dataset_manifest.json', 'README.md'],
    syntheticData: syntheticFlag,
    generatedAtEpochMs: null, // set by caller if a real timestamp is desired — never fabricated here
  };

  const readme = [
    '# PreciMind QC Learning Lab — Educational Research Export',
    '',
    syntheticFlag ? '**THIS DATASET IS SYNTHETIC. It does not represent real learner data.**' : 'This dataset is derived entirely from local, anonymised simulation-learning attempt records.',
    '',
    'Simulation-learning analytics only. Not a measure of clinical competence or employment performance.',
    '',
    'Files:',
    '- attempts.csv: one row per valid attempt (anonymous rowKey, no learner identity).',
    '- events.csv: one row per decision event within each attempt (decisionEventId preserved for linkage).',
    '- metric_dictionary.json: the authoritative definition of every metric, including numerator/denominator/eligibility.',
    '- dataset_manifest.json: schema versions, valid/excluded record counts, and generation metadata.',
    '',
    `Valid attempts: ${validRecords.length}. Excluded (malformed/legacy) records: ${excludedCount}.`,
  ].join('\n');

  return { attemptsCsv, eventsCsv, metricDictionaryJson, manifestJson: JSON.stringify(manifest, null, 2), readme, manifest };
}
