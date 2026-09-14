/* =========================================================================
   v09/app/morning-qc/research/instructor-metrics.js

   Morning QC Room — Stage 12E Denominator-Governed Instructor Metrics
   PROVENANCE: V09_MODIFIED (Stage 12E FINAL MICRO-closure)

   Section 9/11: transforms safe, already-validated attempt records into
   fully denominator-explicit instructor summaries, deriving definitions
   from metric-registry.js rather than duplicating semantics. Every
   percentage/proportion here uses safeRatio() — a zero-eligible-
   denominator NEVER renders as 0%; it is reported as null (displayed as
   "not applicable" by the UI layer). Never converts null/unevaluated
   competence into a poor rating; never defaults missing confidence to
   MODERATE; never fabricates a verification attempt from a final
   adequate state; never produces a ranking or league table.

   FINAL MICRO-CLOSURE FIX (Item 1): the prior caseLevelSummary reduced
   each case to only {attemptCount, caseFamily, difficulty} — a
   metadata-only summary, not the denominator-governed per-case
   analytics the corrective specification actually required. Extracted
   the shared computation into computeAggregateMetrics() so the EXACT
   SAME denominator-governed logic (final disposition, decision
   quality, confidence calibration, evidence use, verification
   behavior) used for the whole dataset is now also computed per case,
   with zero duplicated definitions.

   FINAL MICRO-CLOSURE FIX (Item 4): dataset overview now surfaces
   malformedContainer/recordCountsReliable truthfully (Item 3), and
   uses a privacy-minimised temporal summary (attempt-ordinal span,
   duration range) instead of exact wall-clock date range.
   ========================================================================= */
import { SCORING_DIMENSIONS } from '../states.js';
import { METRIC_REGISTRY_VERSION, safeRatio } from './metric-registry.js';

const RATING_STATES = ['NEEDS_IMPROVEMENT', 'DEVELOPING', 'PROFICIENT', 'STRONG'];

/**
 * The single shared, denominator-governed aggregation over any list of
 * attempts — used identically for the whole dataset AND for each
 * individual case's slice, so per-case and dataset-level metrics can
 * never drift from a single definition.
 */
function computeAggregateMetrics(attempts) {
  // Confidence calibration — denominator is genuine recorded-confidence count, never total attempts.
  const allConfidenceEntries = attempts.flatMap(a => a.confidenceSummary || []);
  const calibrationCategoryCounts = {};
  for (const entry of allConfidenceEntries) calibrationCategoryCounts[entry.category] = (calibrationCategoryCounts[entry.category] || 0) + 1;
  const confidenceLevelCounts = { HIGH: 0, MODERATE: 0, LOW: 0 };
  for (const entry of allConfidenceEntries) { if (entry.confidence in confidenceLevelCounts) confidenceLevelCounts[entry.confidence] += 1; }
  const recordedConfidenceDenominator = allConfidenceEntries.length;

  // Evidence-use — denominator excludes attempts with zero obtained evidence.
  const evidenceEligible = attempts.filter(a => a.evidenceSummary && (a.evidenceSummary.highValueObtainedCount + a.evidenceSummary.lowValueObtainedCount) > 0);
  const totalHighValue = evidenceEligible.reduce((s, a) => s + a.evidenceSummary.highValueObtainedCount, 0);
  const totalLowValue = evidenceEligible.reduce((s, a) => s + a.evidenceSummary.lowValueObtainedCount, 0);

  // Verification — case counts vs attempt-sum counts kept distinct.
  const withVerificationSummary = attempts.filter(a => a.verificationSummary);
  const noAttempt = withVerificationSummary.filter(a => a.verificationSummary.attempted === false).length;
  const attemptedCases = withVerificationSummary.filter(a => a.verificationSummary.attempted === true);
  const totalFailedAttempts = attemptedCases.reduce((s, a) => s + (a.verificationSummary.failedAttemptCount || 0), 0);
  const successfullyVerifiedCases = attemptedCases.filter(a => a.verificationSummary.adequate === true).length;
  const failedBeforeSuccessCases = attemptedCases.filter(a => a.verificationSummary.hadPrematureOrFailedAttemptBeforeSuccess === true).length;

  // Final disposition — canonical validated records only.
  const withDisposition = attempts.filter(a => a.executedFinalDisposition != null);
  const appropriateDispositions = withDisposition.filter(a => a.executedFinalDisposition.outcomeAppropriate === true).length;

  // Decision quality (unsupported-reasoning rate).
  const allDecisions = attempts.flatMap(a => a.decisionSummary || []);
  const unsupportedCount = allDecisions.filter(d => d.quadrant === 'CORRECT_UNSUPPORTED' || d.quadrant === 'INCORRECT_UNSUPPORTED').length;
  const quadrantCounts = {};
  for (const d of allDecisions) quadrantCounts[d.quadrant] = (quadrantCounts[d.quadrant] || 0) + 1;

  return {
    attemptCount: attempts.length,
    confidence: {
      recordedConfidenceDenominator,
      levelCounts: confidenceLevelCounts,
      categoryCounts: calibrationCategoryCounts,
      categoryProportions: Object.fromEntries(Object.entries(calibrationCategoryCounts).map(([k, v]) => [k, safeRatio(v, recordedConfidenceDenominator)])),
    },
    evidence: {
      evidenceEligibleAttemptCount: evidenceEligible.length,
      highValueObtainedTotal: totalHighValue,
      lowValueObtainedTotal: totalLowValue,
      evidenceEfficiencyRatio: safeRatio(totalHighValue, totalHighValue + totalLowValue),
    },
    verification: {
      verificationSummaryEligibleCount: withVerificationSummary.length,
      verificationAttemptedCaseCount: attemptedCases.length,
      noVerificationAttemptCaseCount: noAttempt,
      successfulVerificationCaseCount: successfullyVerifiedCases,
      verificationSuccessRateAmongAttempted: safeRatio(successfullyVerifiedCases, attemptedCases.length),
      failedVerificationAttemptTotal: totalFailedAttempts,
      failedBeforeSuccessfulCaseCount: failedBeforeSuccessCases,
    },
    disposition: {
      dispositionEligibleCount: withDisposition.length,
      appropriateDispositionCount: appropriateDispositions,
      appropriateDispositionRate: safeRatio(appropriateDispositions, withDisposition.length),
    },
    decision: {
      totalDecisionCount: allDecisions.length,
      decisionQuadrantCounts: quadrantCounts,
      unsupportedDecisionCount: unsupportedCount,
      unsupportedDecisionRate: safeRatio(unsupportedCount, allDecisions.length),
    },
  };
}

/**
 * Builds the full denominator-governed instructor summary from a list
 * of already-validated attempt records (the same shape attempt-store.js
 * persists — this function does no validation itself; callers should
 * pass only records that already passed validateAttemptRecord()).
 * `options.malformedContainer` (optional) surfaces TRUE raw-storage
 * status (Section 1/3) rather than a fabricated 0.
 */
export function computeInstructorMetrics(attempts, options = {}) {
  const quarantinedCount = options.quarantinedCount ?? 0;
  const malformedContainer = options.malformedContainer ?? false;
  const recordCountsReliable = !malformedContainer;

  const caseIds = new Set(attempts.map(a => a.caseId));

  // Privacy-minimised temporal summary (Section 4): NEVER an exact
  // wall-clock date range. Only a relative attempt-ordinal span and a
  // duration range, computed from durationMs where derivable.
  const durations = attempts
    .map(a => (typeof a.completedAt === 'number' && typeof a.startedAt === 'number') ? a.completedAt - a.startedAt : null)
    .filter(d => d != null);
  const temporalSummary = {
    attemptOrdinalSpan: attempts.length > 0 ? { first: 1, last: attempts.length } : null,
    durationMsRange: durations.length > 0 ? { min: Math.min(...durations), max: Math.max(...durations) } : null,
    exactTimestampsIntentionallyOmitted: true,
  };

  // 9.3 Competency summary — per dimension, split evaluated vs not.
  const competencySummary = {};
  for (const dim of SCORING_DIMENSIONS) {
    const evaluated = [];
    let notEvaluatedCount = 0;
    for (const a of attempts) {
      const entry = (a.competencyProfile || []).find(c => c.dimension === dim);
      if (!entry || entry.rating == null) { notEvaluatedCount += 1; continue; }
      evaluated.push(entry.rating);
    }
    const ratingCounts = Object.fromEntries(RATING_STATES.map(r => [r, evaluated.filter(x => x === r).length]));
    competencySummary[dim] = {
      evaluatedCount: evaluated.length,
      notEvaluatedCount,
      ratingCounts,
      ratingProportions: Object.fromEntries(RATING_STATES.map(r => [r, safeRatio(ratingCounts[r], evaluated.length)])),
    };
  }

  const totalPanelInspections = attempts.reduce((s, a) => s + (a.panelSummary?.inspectedCount || 0), 0);
  const priorityCounts = {};
  for (const a of attempts) { for (const dim of a.recommendedLearningPriorities || []) priorityCounts[dim] = (priorityCounts[dim] || 0) + 1; }

  const datasetAggregate = computeAggregateMetrics(attempts);

  return {
    metricRegistryVersion: METRIC_REGISTRY_VERSION,
    datasetOverview: {
      validAttemptCount: attempts.length,
      quarantinedRecordCount: quarantinedCount,
      malformedContainer,
      recordCountsReliable,
      casesRepresented: [...caseIds],
      temporalSummary,
    },
    // Item 1: full denominator-governed per-case analytics — the SAME
    // shape/definitions as the dataset-level aggregate, computed over
    // each case's own attempt slice.
    caseLevelSummary: Object.fromEntries([...caseIds].map(caseId => {
      const caseAttempts = attempts.filter(a => a.caseId === caseId);
      const caseAggregate = computeAggregateMetrics(caseAttempts);
      return [caseId, {
        attemptCount: caseAttempts.length,
        caseFamily: caseAttempts[0]?.caseFamily ?? null,
        difficulty: caseAttempts[0]?.difficulty ?? null,
        ...caseAggregate,
      }];
    })),
    competencySummary,
    confidenceCalibration: {
      recordedConfidenceDenominator: datasetAggregate.confidence.recordedConfidenceDenominator,
      levelCounts: datasetAggregate.confidence.levelCounts,
      categoryCounts: datasetAggregate.confidence.categoryCounts,
      categoryProportions: datasetAggregate.confidence.categoryProportions,
    },
    evidenceUse: {
      eligibleAttemptCount: datasetAggregate.evidence.evidenceEligibleAttemptCount,
      totalHighValue: datasetAggregate.evidence.highValueObtainedTotal,
      totalLowValue: datasetAggregate.evidence.lowValueObtainedTotal,
      efficiencyRatio: datasetAggregate.evidence.evidenceEfficiencyRatio,
      totalPanelInspections,
    },
    verificationBehavior: {
      casesWithNoVerificationAttempted: datasetAggregate.verification.noVerificationAttemptCaseCount,
      totalFailedVerificationAttempts: datasetAggregate.verification.failedVerificationAttemptTotal,
      casesSuccessfullyVerified: datasetAggregate.verification.successfulVerificationCaseCount,
      casesWithFailedBeforeSuccessfulPattern: datasetAggregate.verification.failedBeforeSuccessfulCaseCount,
      successRateAmongAttempted: datasetAggregate.verification.verificationSuccessRateAmongAttempted,
    },
    finalDisposition: {
      recordsWithDisposition: datasetAggregate.disposition.dispositionEligibleCount,
      appropriateDispositionRate: datasetAggregate.disposition.appropriateDispositionRate,
    },
    decisionQuality: {
      totalDecisions: datasetAggregate.decision.totalDecisionCount,
      quadrantCounts: datasetAggregate.decision.decisionQuadrantCounts,
      unsupportedRate: datasetAggregate.decision.unsupportedDecisionRate,
    },
    learningPriorities: priorityCounts,
  };
}
