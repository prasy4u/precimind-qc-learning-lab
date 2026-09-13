/* =========================================================================
   v09/app/morning-qc/research/instructor-metrics.js

   Morning QC Room — Stage 12E Denominator-Governed Instructor Metrics
   PROVENANCE: V09_NEW

   Section 9/11: transforms safe, already-validated attempt records into
   fully denominator-explicit instructor summaries, deriving definitions
   from metric-registry.js rather than duplicating semantics. Every
   percentage/proportion here uses safeRatio() — a zero-eligible-
   denominator NEVER renders as 0%; it is reported as null (displayed as
   "not applicable" by the UI layer). Never converts null/unevaluated
   competence into a poor rating; never defaults missing confidence to
   MODERATE; never fabricates a verification attempt from a final
   adequate state; never produces a ranking or league table.
   ========================================================================= */
import { SCORING_DIMENSIONS } from '../states.js';
import { METRIC_REGISTRY_VERSION, safeRatio } from './metric-registry.js';

const RATING_STATES = ['NEEDS_IMPROVEMENT', 'DEVELOPING', 'PROFICIENT', 'STRONG'];

/**
 * Builds the full denominator-governed instructor summary from a list
 * of already-validated attempt records (the same shape attempt-store.js
 * persists — this function does no validation itself; callers should
 * pass only records that already passed validateAttemptRecord()).
 */
export function computeInstructorMetrics(attempts, options = {}) {
  const quarantinedCount = options.quarantinedCount ?? 0;

  // 9.1 Dataset overview
  const caseIds = new Set(attempts.map(a => a.caseId));
  const timestamps = attempts.flatMap(a => [a.startedAt, a.completedAt]).filter(t => typeof t === 'number' && Number.isFinite(t));
  const dateRange = timestamps.length > 0 ? { earliest: Math.min(...timestamps), latest: Math.max(...timestamps) } : null;

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

  // 9.4 Confidence calibration — denominator is genuine recorded-confidence count, never total attempts.
  const allConfidenceEntries = attempts.flatMap(a => a.confidenceSummary || []);
  const calibrationCategoryCounts = {};
  for (const entry of allConfidenceEntries) {
    calibrationCategoryCounts[entry.category] = (calibrationCategoryCounts[entry.category] || 0) + 1;
  }
  const confidenceLevelCounts = { HIGH: 0, MODERATE: 0, LOW: 0 };
  for (const entry of allConfidenceEntries) {
    if (entry.confidence in confidenceLevelCounts) confidenceLevelCounts[entry.confidence] += 1;
  }
  const recordedConfidenceDenominator = allConfidenceEntries.length;

  // 9.5 Evidence-use summary — denominator excludes attempts with zero obtained evidence.
  const evidenceEligible = attempts.filter(a => a.evidenceSummary && (a.evidenceSummary.highValueObtainedCount + a.evidenceSummary.lowValueObtainedCount) > 0);
  const totalHighValue = evidenceEligible.reduce((s, a) => s + a.evidenceSummary.highValueObtainedCount, 0);
  const totalLowValue = evidenceEligible.reduce((s, a) => s + a.evidenceSummary.lowValueObtainedCount, 0);
  const evidenceEfficiencyRatio = safeRatio(totalHighValue, totalHighValue + totalLowValue);
  const totalPanelInspections = attempts.reduce((s, a) => s + (a.panelSummary?.inspectedCount || 0), 0);

  // 9.6 Verification summary — case counts vs attempt-sum counts kept distinct.
  const withVerificationSummary = attempts.filter(a => a.verificationSummary);
  const noAttempt = withVerificationSummary.filter(a => a.verificationSummary.attempted === false).length;
  const attemptedCases = withVerificationSummary.filter(a => a.verificationSummary.attempted === true);
  const totalFailedAttempts = attemptedCases.reduce((s, a) => s + (a.verificationSummary.failedAttemptCount || 0), 0);
  const successfullyVerifiedCases = attemptedCases.filter(a => a.verificationSummary.adequate === true).length;
  const failedBeforeSuccessCases = attemptedCases.filter(a => a.verificationSummary.hadPrematureOrFailedAttemptBeforeSuccess === true).length;

  // 9.7 Final-disposition summary — canonical validated records only.
  const withDisposition = attempts.filter(a => a.executedFinalDisposition != null);
  const appropriateDispositions = withDisposition.filter(a => a.executedFinalDisposition.outcomeAppropriate === true).length;

  // 9.2 Decision quadrants (unsupported-reasoning rate).
  const allDecisions = attempts.flatMap(a => a.decisionSummary || []);
  const unsupportedCount = allDecisions.filter(d => d.quadrant === 'CORRECT_UNSUPPORTED' || d.quadrant === 'INCORRECT_UNSUPPORTED').length;
  const quadrantCounts = {};
  for (const d of allDecisions) quadrantCounts[d.quadrant] = (quadrantCounts[d.quadrant] || 0) + 1;

  // 9.8 Learning priorities — only from attempts that genuinely produced them.
  const priorityCounts = {};
  for (const a of attempts) {
    for (const dim of a.recommendedLearningPriorities || []) priorityCounts[dim] = (priorityCounts[dim] || 0) + 1;
  }

  return {
    metricRegistryVersion: METRIC_REGISTRY_VERSION,
    datasetOverview: {
      validAttemptCount: attempts.length,
      quarantinedRecordCount: quarantinedCount,
      casesRepresented: [...caseIds],
      dateRange,
    },
    caseLevelSummary: Object.fromEntries([...caseIds].map(caseId => {
      const caseAttempts = attempts.filter(a => a.caseId === caseId);
      return [caseId, {
        attemptCount: caseAttempts.length,
        caseFamily: caseAttempts[0]?.caseFamily ?? null,
        difficulty: caseAttempts[0]?.difficulty ?? null,
      }];
    })),
    competencySummary,
    confidenceCalibration: {
      recordedConfidenceDenominator,
      levelCounts: confidenceLevelCounts,
      categoryCounts: calibrationCategoryCounts,
      categoryProportions: Object.fromEntries(Object.entries(calibrationCategoryCounts).map(([k, v]) => [k, safeRatio(v, recordedConfidenceDenominator)])),
    },
    evidenceUse: {
      eligibleAttemptCount: evidenceEligible.length,
      totalHighValue, totalLowValue,
      efficiencyRatio: evidenceEfficiencyRatio,
      totalPanelInspections,
    },
    verificationBehavior: {
      casesWithNoVerificationAttempted: noAttempt,
      totalFailedVerificationAttempts: totalFailedAttempts,
      casesSuccessfullyVerified: successfullyVerifiedCases,
      casesWithFailedBeforeSuccessfulPattern: failedBeforeSuccessCases,
      successRateAmongAttempted: safeRatio(successfullyVerifiedCases, attemptedCases.length),
    },
    finalDisposition: {
      recordsWithDisposition: withDisposition.length,
      appropriateDispositionRate: safeRatio(appropriateDispositions, withDisposition.length),
    },
    decisionQuality: {
      totalDecisions: allDecisions.length,
      quadrantCounts,
      unsupportedRate: safeRatio(unsupportedCount, allDecisions.length),
    },
    learningPriorities: priorityCounts,
  };
}
