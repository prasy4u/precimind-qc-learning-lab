/* =========================================================================
   v09/app/morning-qc/research/metric-registry.js

   Morning QC Room — Stage 12E Metric Definition Registry
   PROVENANCE: V09_NEW

   Section 10/11: a single authoritative, machine-readable source of
   truth for every instructor/research metric. The instructor workspace
   and the research export both derive display labels and denominator
   logic from THIS registry — never duplicating metric semantics
   independently. Every metric explicitly states its denominator and
   what happens when that denominator is zero (never silently "0%").
   ========================================================================= */

export const METRIC_REGISTRY_VERSION = '1.0.0';

/**
 * Each entry: metricId, displayName, definition, numerator, denominator,
 * eligibilityCriteria, exclusions, missingDataHandling, sourceFields,
 * interpretation, nonInterpretation (caveat), unit, aggregationLevel,
 * possibleValues (where a fixed enum), schemaVersion.
 */
export const METRIC_REGISTRY = [
  {
    metricId: 'valid_attempt_count',
    displayName: 'Valid attempt count',
    definition: 'The number of attempt records that passed deep canonical-schema validation.',
    numerator: 'Count of attempts where validateAttemptRecord(record).valid === true',
    denominator: 'Total records encountered (valid + quarantined)',
    eligibilityCriteria: 'Record present in localStorage under the attempts key',
    exclusions: 'Records failing deep validation are quarantined, not counted here',
    missingDataHandling: 'N/A — this metric IS the count of non-missing, valid data',
    sourceFields: ['(whole record)'],
    interpretation: 'The size of the dataset every other metric in this registry is computed over.',
    nonInterpretation: 'Does not imply anything about learner performance by itself.',
    unit: 'count', aggregationLevel: 'dataset', possibleValues: 'non-negative integer',
    schemaVersion: METRIC_REGISTRY_VERSION,
  },
  {
    metricId: 'quarantined_record_count',
    displayName: 'Quarantined (rejected) record count',
    definition: 'The number of stored records that failed deep canonical-schema validation and were silently excluded from all analytics.',
    numerator: 'Count of stored records where validateAttemptRecord(record).valid === false',
    denominator: 'Total records encountered (valid + quarantined)',
    eligibilityCriteria: 'Record present in localStorage under the attempts key',
    exclusions: 'None — this counts exactly what it excludes from everything else',
    missingDataHandling: 'N/A',
    sourceFields: ['(whole record)'],
    interpretation: 'A non-zero count may indicate a schema-version mismatch or corrupted local storage — not a performance signal.',
    nonInterpretation: 'Never implies the excluded attempts represent poor performance; their content is not analyzed at all.',
    unit: 'count', aggregationLevel: 'dataset', possibleValues: 'non-negative integer',
    schemaVersion: METRIC_REGISTRY_VERSION,
  },
  {
    metricId: 'competency_rating_distribution',
    displayName: 'Competency rating distribution',
    definition: 'For a given SCORING_DIMENSIONS entry, the distribution of observed ratings across all EVALUATED attempts for that dimension.',
    numerator: 'Count of attempts with a given rating (NEEDS_IMPROVEMENT/DEVELOPING/PROFICIENT/STRONG) for the dimension',
    denominator: 'Count of attempts where that SPECIFIC dimension was evaluated (rating != null) — never total attempt count',
    eligibilityCriteria: 'competencyProfile contains an entry for this dimension with rating != null',
    exclusions: 'Attempts where the dimension was not scored, or scored null, are excluded from the denominator entirely (shown separately as "not evaluated")',
    missingDataHandling: 'Reported as a distinct "not evaluated" count, never folded into NEEDS_IMPROVEMENT or any other rating',
    sourceFields: ['competencyProfile[].dimension', 'competencyProfile[].rating'],
    interpretation: 'Shows the relative frequency of each rating level actually observed for this competency.',
    nonInterpretation: 'Not a ranking of learners; not a pass/fail threshold; a single dimension\u2019s distribution across attempts, not attempts across dimensions.',
    unit: 'percentage or count, per rating', aggregationLevel: 'dataset, per-dimension',
    possibleValues: 'NEEDS_IMPROVEMENT | DEVELOPING | PROFICIENT | STRONG | not_evaluated',
    schemaVersion: METRIC_REGISTRY_VERSION,
  },
  {
    metricId: 'confidence_calibration_distribution',
    displayName: 'Confidence calibration distribution',
    definition: 'The distribution of calibration categories (e.g. CORRECT_CALIBRATED, INCORRECT_OVERCONFIDENT) across all decisions where confidence was genuinely recorded.',
    numerator: 'Count of confidenceSummary entries with a given category',
    denominator: 'Total confidenceSummary entries across all valid attempts where confidence was recorded — never total attempt count or total decision count',
    eligibilityCriteria: 'A confidenceSummary entry exists for the decisionEventId with a genuine, non-fabricated confidence value',
    exclusions: 'Decisions where confidence was never recorded are excluded from this denominator entirely (never coerced to MODERATE)',
    missingDataHandling: 'Reported as a distinct "confidence not recorded" count',
    sourceFields: ['confidenceSummary[].decisionEventId', 'confidenceSummary[].confidence', 'confidenceSummary[].category'],
    interpretation: 'A decision is well-calibrated only when confidence, outcome-appropriateness, and reasoning-support all align (Section 7 doctrine).',
    nonInterpretation: 'Not a measure of overall learner confidence "style"; scoped strictly to decisions with recorded confidence.',
    unit: 'percentage or count, per category', aggregationLevel: 'dataset',
    possibleValues: 'the 8 accepted CALIBRATION_CATEGORIES values',
    schemaVersion: METRIC_REGISTRY_VERSION,
  },
  {
    metricId: 'verification_no_attempt_rate',
    displayName: 'Cases with no verification attempted',
    definition: 'The proportion of valid attempts where verificationSummary.attempted === false.',
    numerator: 'Count of valid attempts with verificationSummary.attempted === false',
    denominator: 'Total valid attempts with a verificationSummary present',
    eligibilityCriteria: 'verificationSummary present and canonical',
    exclusions: 'Attempts without a verificationSummary at all (should not occur for canonical records, but excluded defensively if found)',
    missingDataHandling: 'If denominator is 0, display as "not applicable", never "0%"',
    sourceFields: ['verificationSummary.attempted'],
    interpretation: 'Some cases genuinely require no verification decision (e.g. Case 8); a non-zero rate is not automatically a problem.',
    nonInterpretation: 'Does not by itself indicate poor performance — several accepted cases have no verification step at all.',
    unit: 'percentage', aggregationLevel: 'dataset or per-case',
    possibleValues: '[0,1] or not-applicable',
    schemaVersion: METRIC_REGISTRY_VERSION,
  },
  {
    metricId: 'verification_failed_attempt_total',
    displayName: 'Total failed verification attempts',
    definition: 'The SUM (not a case count) of verificationSummary.failedAttemptCount across all valid attempts where verification was attempted.',
    numerator: 'Sum of verificationSummary.failedAttemptCount',
    denominator: 'N/A — this is a genuine sum/total, not a proportion. Never divided by total attempts.',
    eligibilityCriteria: 'verificationSummary.attempted === true',
    exclusions: 'Attempts with attempted===false contribute 0 (attemptCount is required to be 0 in that case)',
    missingDataHandling: 'N/A',
    sourceFields: ['verificationSummary.failedAttemptCount'],
    interpretation: 'A premature or failed verification attempt followed by a correct one is expected, accepted expert behavior in several cases (e.g. Case 10) — this count distinguishes attempts from cases and must never be presented as a case-level failure rate.',
    nonInterpretation: 'This is an ATTEMPT count, never to be confused with a CASE count (see verification_successful_case_count).',
    unit: 'count', aggregationLevel: 'dataset',
    possibleValues: 'non-negative integer',
    schemaVersion: METRIC_REGISTRY_VERSION,
  },
  {
    metricId: 'verification_successful_case_count',
    displayName: 'Cases ultimately successfully verified',
    definition: 'The count of valid attempts (CASES, not attempts-at-verification) where verificationSummary.adequate === true.',
    numerator: 'Count of valid attempts with verificationSummary.adequate === true',
    denominator: 'Total valid attempts with verificationSummary.attempted === true',
    eligibilityCriteria: 'verificationSummary.attempted === true',
    exclusions: 'Attempts with no verification attempted are excluded from this denominator entirely',
    missingDataHandling: 'If denominator is 0, display "not applicable"',
    sourceFields: ['verificationSummary.adequate'],
    interpretation: 'Reflects whether verification was EVENTUALLY adequate, regardless of how many attempts it took.',
    nonInterpretation: 'A case count, never to be confused with verification_failed_attempt_total, which is an attempt count.',
    unit: 'percentage or count', aggregationLevel: 'dataset',
    possibleValues: '[0,1] or not-applicable',
    schemaVersion: METRIC_REGISTRY_VERSION,
  },
  {
    metricId: 'evidence_efficiency_ratio',
    displayName: 'Evidence-acquisition efficiency',
    definition: 'The proportion of obtained evidence that was high-value, for attempts where at least one piece of evidence was obtained.',
    numerator: 'highValueObtainedCount',
    denominator: 'highValueObtainedCount + lowValueObtainedCount',
    eligibilityCriteria: 'highValueObtainedCount + lowValueObtainedCount > 0',
    exclusions: 'Attempts where no evidence was obtained at all are excluded from this denominator entirely (never scored as 0% efficient)',
    missingDataHandling: 'If denominator is 0, display "not applicable" — correct minimal-inaction behavior is not penalized',
    sourceFields: ['evidenceSummary.highValueObtainedCount', 'evidenceSummary.lowValueObtainedCount', 'evidenceSummary.efficiencyRatio'],
    interpretation: 'Higher values indicate more selective, expert-like information acquisition.',
    nonInterpretation: 'A learner who correctly obtains ZERO evidence (because none was needed) is not penalized by this metric — see Section 6 doctrine: correct inaction is expert behavior.',
    unit: 'ratio [0,1]', aggregationLevel: 'per-attempt or dataset average',
    possibleValues: '[0,1] or not-applicable',
    schemaVersion: METRIC_REGISTRY_VERSION,
  },
  {
    metricId: 'panel_inspection_count',
    displayName: 'Panel inspection count',
    definition: 'The number of information panels a learner inspected during an attempt.',
    numerator: 'panelSummary.inspectedCount',
    denominator: 'N/A — a raw count, not a proportion',
    eligibilityCriteria: 'panelSummary present',
    exclusions: 'None',
    missingDataHandling: 'N/A',
    sourceFields: ['panelSummary.inspectedCount'],
    interpretation: 'Descriptive only.',
    nonInterpretation: 'Explicitly NOT a measure of thoroughness or effort — opening more panels is not inherently better (Section 6 doctrine). Never used alone to imply quality.',
    unit: 'count', aggregationLevel: 'per-attempt or dataset average',
    possibleValues: 'non-negative integer',
    schemaVersion: METRIC_REGISTRY_VERSION,
  },
  {
    metricId: 'unsupported_decision_rate',
    displayName: 'Unsupported-reasoning decision rate',
    definition: 'The proportion of decisions falling into either UNSUPPORTED quadrant (CORRECT_UNSUPPORTED or INCORRECT_UNSUPPORTED).',
    numerator: 'Count of decisionSummary entries with quadrant in {CORRECT_UNSUPPORTED, INCORRECT_UNSUPPORTED}',
    denominator: 'Total decisionSummary entries across all valid attempts',
    eligibilityCriteria: 'decisionSummary entry present with a valid quadrant',
    exclusions: 'None beyond invalid records',
    missingDataHandling: 'If denominator is 0, display "not applicable"',
    sourceFields: ['decisionSummary[].quadrant'],
    interpretation: 'A CORRECT_UNSUPPORTED decision reached the right answer without adequate evidentiary support — a distinct pedagogic concern from an outright incorrect decision (Section 7 doctrine).',
    nonInterpretation: 'Does not distinguish CORRECT_UNSUPPORTED from INCORRECT_UNSUPPORTED on its own — see decisionQuadrantCounts for the full breakdown.',
    unit: 'percentage or count', aggregationLevel: 'dataset',
    possibleValues: '[0,1] or not-applicable',
    schemaVersion: METRIC_REGISTRY_VERSION,
  },
  {
    metricId: 'appropriate_disposition_rate',
    displayName: 'Appropriate final disposition rate',
    definition: 'The proportion of attempts whose executed final disposition (RESUME_SERVICE, HOLD_RESULTS, DOCUMENT, etc.) was the appropriate action, among attempts that reached a genuine, canonical, non-null final disposition.',
    numerator: 'Count of attempts with executedFinalDisposition.outcomeAppropriate === true',
    denominator: 'Count of attempts with a genuine non-null executedFinalDisposition',
    eligibilityCriteria: 'executedFinalDisposition is present and non-null (a real disposition decision was genuinely reached)',
    exclusions: 'Attempts where executedFinalDisposition is null (no disposition decision was reached at all, e.g. an incomplete or in-progress attempt) are excluded from this denominator entirely',
    missingDataHandling: 'If denominator is 0 (no attempts reached a genuine disposition), display "not applicable", never "0%"',
    sourceFields: ['executedFinalDisposition.outcomeAppropriate', 'executedFinalDisposition.actionType'],
    interpretation: 'Reflects whether the learner\u2019s final action (resume, hold, escalate, document) was the scientifically/procedurally correct one for the case, independent of how they got there.',
    nonInterpretation: 'Does not assess reasoning quality on its own — see unsupported_decision_rate and confidence_calibration_distribution for that axis; an appropriate disposition reached via unsupported reasoning is still a distinct, tracked pattern (Section 7 doctrine).',
    unit: 'percentage or count', aggregationLevel: 'dataset or per-case',
    possibleValues: '[0,1] or not-applicable',
    schemaVersion: METRIC_REGISTRY_VERSION,
  },
];

export function getMetricDefinition(metricId) {
  return METRIC_REGISTRY.find(m => m.metricId === metricId) || null;
}

/** Computes a percentage-safe ratio: returns null (not 0) when the denominator is zero. */
export function safeRatio(numerator, denominator) {
  if (!denominator || denominator <= 0) return null;
  return numerator / denominator;
}

/** Formats a safeRatio() result for display — never renders "0%" for a null (undefined) ratio. */
export function formatRatioForDisplay(ratio, digits = 0) {
  if (ratio === null || ratio === undefined) return 'Not applicable (no eligible data)';
  return `${(ratio * 100).toFixed(digits)}%`;
}
