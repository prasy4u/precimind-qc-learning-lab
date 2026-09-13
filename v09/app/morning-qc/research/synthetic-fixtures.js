/* =========================================================================
   v09/app/morning-qc/research/synthetic-fixtures.js

   Morning QC Room — Stage 12E Deterministic Synthetic Cohort Fixtures
   PROVENANCE: V09_NEW

   Section 14: a deterministic (no Math.random, no Date.now-dependent
   ordering) set of synthetic, canonical-schema-valid attempt records
   for instructor-UI testing, analytics regression, export testing, and
   denominator validation. Every record here is explicitly synthetic —
   never presented as real learner data (the instructor view labels
   these fixtures accordingly whenever used).

   Deliberately heterogeneous, covering: strong/developing/needs-
   improvement performance, overconfident-unsupported and appropriately-
   cautious decisions, no-verification/failed-verification/failed-then-
   successful-verification, evidence-efficient and low-value-heavy
   behaviour, missing confidence, unevaluated competencies, missing
   optional data, a same-learner multi-attempt sequence sufficient for
   Rule D progression, weak performance that must not spike difficulty,
   and one deliberately malformed record for quarantine testing.
   ========================================================================= */

export const SYNTHETIC_FIXTURE_VERSION = '1.0.0';

function base(overrides) {
  return {
    attemptId: 'synthetic', caseId: 'case-04-isolated-excursion', caseFamily: 'A', difficulty: 'LEVEL_1_CLEAR_SIGNAL',
    caseSchemaVersion: '1.1.0', startedAt: 0, completedAt: 1,
    competencyProfile: [], decisionSummary: [], confidenceSummary: [],
    evidenceSummary: { highValueObtainedCount: 0, lowValueObtainedCount: 0 },
    panelSummary: { inspectedCount: 0 },
    verificationSummary: { attempted: false, adequate: false, attemptCount: 0, failedAttemptCount: 0, hadPrematureOrFailedAttemptBeforeSuccess: false },
    finalServiceState: 'RESUMED', executedFinalDisposition: null, recommendedLearningPriorities: [],
    ...overrides,
  };
}

/** Returns the full deterministic synthetic cohort — one array of canonical, valid attempt records. */
export function buildSyntheticCohort() {
  const t = (n) => n; // fixed, deterministic "timestamps" — no wall-clock dependency
  return [
    // 1. Strong performance, evidence-efficient, well-calibrated HIGH confidence.
    base({
      attemptId: 'syn-01', caseId: 'case-04-isolated-excursion', startedAt: t(100), completedAt: t(110),
      competencyProfile: [{ dimension: 'SIGNAL_RECOGNITION', rating: 'STRONG' }, { dimension: 'INVESTIGATION_STRATEGY', rating: 'STRONG' }],
      decisionSummary: [{ decisionEventId: 'syn01-d1#1', decisionId: 'dec-containment', quadrant: 'CORRECT_SUPPORTED' }],
      confidenceSummary: [{ decisionEventId: 'syn01-d1#1', confidence: 'HIGH', category: 'CORRECT_CALIBRATED' }],
      evidenceSummary: { highValueObtainedCount: 3, lowValueObtainedCount: 0, efficiencyRatio: 1 },
      panelSummary: { inspectedCount: 3 },
      verificationSummary: { attempted: true, adequate: true, attemptCount: 1, failedAttemptCount: 0, hadPrematureOrFailedAttemptBeforeSuccess: false },
      executedFinalDisposition: { actionType: 'RESUME_SERVICE', decisionId: null, optionId: null, decisionEventId: null, outcomeAppropriate: true, reasoningSupported: true },
    }),
    // 2. Developing performance, low-value-heavy evidence acquisition.
    base({
      attemptId: 'syn-02', caseId: 'case-05-increased-imprecision', caseFamily: 'C', difficulty: 'LEVEL_2_COMPETING_EXPLANATION', startedAt: t(200), completedAt: t(215),
      competencyProfile: [{ dimension: 'STATISTICAL_INTERPRETATION', rating: 'DEVELOPING' }],
      decisionSummary: [{ decisionEventId: 'syn02-d1#1', decisionId: 'dec-containment', quadrant: 'CORRECT_UNSUPPORTED' }],
      confidenceSummary: [{ decisionEventId: 'syn02-d1#1', confidence: 'MODERATE', category: 'CORRECT_MODERATE' }],
      evidenceSummary: { highValueObtainedCount: 1, lowValueObtainedCount: 3, efficiencyRatio: 0.25 },
      panelSummary: { inspectedCount: 4 },
      verificationSummary: { attempted: true, adequate: true, attemptCount: 1, failedAttemptCount: 0, hadPrematureOrFailedAttemptBeforeSuccess: false },
      executedFinalDisposition: { actionType: 'RESUME_SERVICE', decisionId: null, optionId: null, decisionEventId: null, outcomeAppropriate: true, reasoningSupported: false },
      recommendedLearningPriorities: ['STATISTICAL_INTERPRETATION'],
    }),
    // 3. NEEDS_IMPROVEMENT, overconfident unsupported decision.
    base({
      attemptId: 'syn-03', caseId: 'case-09-seek-more-evidence', caseFamily: 'O', difficulty: 'LEVEL_3_MULTIPLE_SIGNALS_INCOMPLETE_EVIDENCE', startedAt: t(300), completedAt: t(308),
      competencyProfile: [{ dimension: 'METACOGNITIVE_CALIBRATION', rating: 'NEEDS_IMPROVEMENT' }, { dimension: 'EVIDENCE_SELECTION', rating: 'NEEDS_IMPROVEMENT' }],
      decisionSummary: [{ decisionEventId: 'syn03-d1#1', decisionId: 'dec-disposition', quadrant: 'INCORRECT_UNSUPPORTED' }],
      confidenceSummary: [{ decisionEventId: 'syn03-d1#1', confidence: 'HIGH', category: 'INCORRECT_OVERCONFIDENT' }],
      evidenceSummary: { highValueObtainedCount: 0, lowValueObtainedCount: 1, efficiencyRatio: 0 },
      panelSummary: { inspectedCount: 1 },
      finalServiceState: 'HELD',
      executedFinalDisposition: { actionType: 'HOLD_RESULTS', decisionId: null, optionId: null, decisionEventId: null, outcomeAppropriate: false, reasoningSupported: false },
      recommendedLearningPriorities: ['METACOGNITIVE_CALIBRATION', 'EVIDENCE_SELECTION'],
    }),
    // 4. Appropriately cautious LOW confidence, correct, no verification needed (Case 8-like: no analytical hold).
    base({
      attemptId: 'syn-04', caseId: 'case-08-eqa-discordance', caseFamily: 'I', difficulty: 'LEVEL_3_MULTIPLE_SIGNALS_INCOMPLETE_EVIDENCE', startedAt: t(400), completedAt: t(410),
      competencyProfile: [{ dimension: 'DOCUMENTATION_GOVERNANCE', rating: 'PROFICIENT' }],
      decisionSummary: [{ decisionEventId: 'syn04-d1#1', decisionId: 'dec-disposition', quadrant: 'CORRECT_SUPPORTED' }],
      confidenceSummary: [{ decisionEventId: 'syn04-d1#1', confidence: 'LOW', category: 'CORRECT_UNDERCONFIDENT' }],
      evidenceSummary: { highValueObtainedCount: 2, lowValueObtainedCount: 0, efficiencyRatio: 1 },
      panelSummary: { inspectedCount: 2 },
      finalServiceState: 'RUNNING',
      executedFinalDisposition: { actionType: 'DOCUMENT', decisionId: null, optionId: null, decisionEventId: null, outcomeAppropriate: true, reasoningSupported: true },
    }),
    // 5. Failed-then-successful verification pattern.
    base({
      attemptId: 'syn-05', caseId: 'case-10-premature-release-trap', caseFamily: 'P', difficulty: 'LEVEL_3_MULTIPLE_SIGNALS_INCOMPLETE_EVIDENCE', startedAt: t(500), completedAt: t(520),
      competencyProfile: [{ dimension: 'VERIFICATION_QUALITY', rating: 'PROFICIENT' }],
      decisionSummary: [{ decisionEventId: 'syn05-d1#1', decisionId: 'dec-intervention', quadrant: 'CORRECT_SUPPORTED' }],
      confidenceSummary: [{ decisionEventId: 'syn05-d1#1', confidence: 'MODERATE', category: 'CORRECT_MODERATE' }],
      evidenceSummary: { highValueObtainedCount: 2, lowValueObtainedCount: 1, efficiencyRatio: Math.round((2 / 3) * 1000) / 1000 },
      panelSummary: { inspectedCount: 3 },
      verificationSummary: { attempted: true, adequate: true, attemptCount: 2, failedAttemptCount: 1, hadPrematureOrFailedAttemptBeforeSuccess: true },
      executedFinalDisposition: { actionType: 'RESUME_SERVICE', decisionId: null, optionId: null, decisionEventId: null, outcomeAppropriate: true, reasoningSupported: true },
    }),
    // 6. No confidence recorded at all for this decision (genuinely absent, never MODERATE-defaulted).
    base({
      attemptId: 'syn-06', caseId: 'case-06-calibration-shift', caseFamily: 'D', difficulty: 'LEVEL_2_COMPETING_EXPLANATION', startedAt: t(600), completedAt: t(610),
      competencyProfile: [{ dimension: 'INVESTIGATION_STRATEGY', rating: 'STRONG' }],
      decisionSummary: [{ decisionEventId: 'syn06-d1#1', decisionId: 'dec-intervention', quadrant: 'CORRECT_SUPPORTED' }],
      confidenceSummary: [],
      evidenceSummary: { highValueObtainedCount: 2, lowValueObtainedCount: 0, efficiencyRatio: 1 },
      panelSummary: { inspectedCount: 2 },
      verificationSummary: { attempted: true, adequate: true, attemptCount: 1, failedAttemptCount: 0, hadPrematureOrFailedAttemptBeforeSuccess: false },
      executedFinalDisposition: { actionType: 'RESUME_SERVICE', decisionId: null, optionId: null, decisionEventId: null, outcomeAppropriate: true, reasoningSupported: true },
    }),
    // 7. Unevaluated competencies entirely (empty profile) + correct minimal-inaction (no evidence obtained).
    base({
      attemptId: 'syn-07', caseId: 'case-04-isolated-excursion', startedAt: t(700), completedAt: t(705),
      competencyProfile: [],
      decisionSummary: [{ decisionEventId: 'syn07-d1#1', decisionId: 'dec-containment', quadrant: 'CORRECT_SUPPORTED' }],
      confidenceSummary: [{ decisionEventId: 'syn07-d1#1', confidence: 'HIGH', category: 'CORRECT_CALIBRATED' }],
      evidenceSummary: { highValueObtainedCount: 0, lowValueObtainedCount: 0 },
      panelSummary: { inspectedCount: 0 },
      verificationSummary: { attempted: true, adequate: true, attemptCount: 1, failedAttemptCount: 0, hadPrematureOrFailedAttemptBeforeSuccess: false },
      executedFinalDisposition: { actionType: 'RESUME_SERVICE', decisionId: null, optionId: null, decisionEventId: null, outcomeAppropriate: true, reasoningSupported: true },
    }),
    // 8+9. Same synthetic local learner sequence: two consecutive genuine STRONG/PROFICIENT
    // attempts (sufficient for Rule D progression — exercises the adaptive pipeline's own doctrine).
    base({
      attemptId: 'syn-08', caseId: 'pilot-1-reagent-lot-shift', caseFamily: 'B', difficulty: 'LEVEL_2_COMPETING_EXPLANATION', startedAt: t(800), completedAt: t(815),
      competencyProfile: [{ dimension: 'SIGNAL_RECOGNITION', rating: 'STRONG' }],
      decisionSummary: [{ decisionEventId: 'syn08-d1#1', decisionId: 'dec-containment', quadrant: 'CORRECT_SUPPORTED' }],
      confidenceSummary: [{ decisionEventId: 'syn08-d1#1', confidence: 'HIGH', category: 'CORRECT_CALIBRATED' }],
      evidenceSummary: { highValueObtainedCount: 2, lowValueObtainedCount: 0, efficiencyRatio: 1 },
      panelSummary: { inspectedCount: 2 },
      verificationSummary: { attempted: true, adequate: true, attemptCount: 1, failedAttemptCount: 0, hadPrematureOrFailedAttemptBeforeSuccess: false },
      executedFinalDisposition: { actionType: 'RESUME_SERVICE', decisionId: null, optionId: null, decisionEventId: null, outcomeAppropriate: true, reasoningSupported: true },
    }),
    base({
      attemptId: 'syn-09', caseId: 'case-06-calibration-shift', caseFamily: 'D', difficulty: 'LEVEL_2_COMPETING_EXPLANATION', startedAt: t(900), completedAt: t(915),
      competencyProfile: [{ dimension: 'SIGNAL_RECOGNITION', rating: 'PROFICIENT' }],
      decisionSummary: [{ decisionEventId: 'syn09-d1#1', decisionId: 'dec-intervention', quadrant: 'CORRECT_SUPPORTED' }],
      confidenceSummary: [{ decisionEventId: 'syn09-d1#1', confidence: 'HIGH', category: 'CORRECT_CALIBRATED' }],
      evidenceSummary: { highValueObtainedCount: 2, lowValueObtainedCount: 0, efficiencyRatio: 1 },
      panelSummary: { inspectedCount: 2 },
      verificationSummary: { attempted: true, adequate: true, attemptCount: 1, failedAttemptCount: 0, hadPrematureOrFailedAttemptBeforeSuccess: false },
      executedFinalDisposition: { actionType: 'RESUME_SERVICE', decisionId: null, optionId: null, decisionEventId: null, outcomeAppropriate: true, reasoningSupported: true },
    }),
    // 10. Weak performance that must NOT cause automatic difficulty escalation (Rule C fixture).
    base({
      attemptId: 'syn-10', caseId: 'case-11-concurrent-triage', caseFamily: 'N', difficulty: 'LEVEL_4_ANALYTICAL_PLUS_RISK_TRADEOFF', startedAt: t(1000), completedAt: t(1020),
      competencyProfile: [{ dimension: 'RISK_REASONING', rating: 'NEEDS_IMPROVEMENT' }],
      decisionSummary: [{ decisionEventId: 'syn10-d1#1', decisionId: 'dec-priority', quadrant: 'INCORRECT_UNSUPPORTED' }],
      confidenceSummary: [{ decisionEventId: 'syn10-d1#1', confidence: 'HIGH', category: 'INCORRECT_OVERCONFIDENT' }],
      evidenceSummary: { highValueObtainedCount: 0, lowValueObtainedCount: 2, efficiencyRatio: 0 },
      panelSummary: { inspectedCount: 2 },
      verificationSummary: { attempted: false, adequate: false, attemptCount: 0, failedAttemptCount: 0, hadPrematureOrFailedAttemptBeforeSuccess: false },
      recommendedLearningPriorities: ['RISK_REASONING'],
    }),
  ];
}

/**
 * One deliberately malformed record (for quarantine/read-time-validation
 * testing) — NOT included in buildSyntheticCohort()'s normal output,
 * since a real cohort by definition contains only valid records.
 */
export function buildMalformedFixture() {
  return { attemptId: 'malformed-01', caseId: 'case-04-isolated-excursion', evidenceSummary: {}, panelSummary: {}, verificationSummary: {}, executedFinalDisposition: {} };
}
