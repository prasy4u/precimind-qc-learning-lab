/* =========================================================================
   v09/app/morning-qc/cases/synthetic-fixture.js

   Morning QC Room — Stage 12A FINAL Closure Synthetic Test Fixture
   PROVENANCE: V09_TEST

   A minimal, deliberately synthetic case used ONLY for isolated adversarial
   engine/validator testing (Section 4/7 of the Stage 12A final-closure
   audit explicitly permits "a small synthetic decision fixture" so the
   three teaching pilots are never distorted merely to exercise every
   engine-semantics combination). This fixture is NOT a teaching case and
   is never referenced by cases/index.js's pilot exports.
   ========================================================================= */

export const syntheticFixtureCase = {
  identity: {
    id: 'synthetic-fixture',
    title: 'Synthetic Engine-Semantics Test Fixture (not a teaching case)',
    caseFamily: 'TEST_FIXTURE',
    version: '1.0.0',
    difficulty: 'LEVEL_1_CLEAR_SIGNAL',
    intendedLearnerLevel: ['expert'],
    competencyMapping: [],
  },
  labContext: {
    analyte: 'Synthetic test analyte',
    analyticalMethod: 'N/A (test fixture)',
    qcMaterials: [{ levelId: 'L1', levelName: 'Level 1', targetValue: 100, targetSD: 2 }],
    qcStrategy: 'N/A',
    apsSource: 'N/A',
  },
  timeline: [],
  panels: [
    { id: 'panel-a', type: 'QC_HISTORY', availableFromPhase: 'BRIEFING', relevance: 'RELEVANT', costTimeMinutes: 0, mayBeMisleading: false, provenance: 'synthetic', content: {} },
  ],
  hypotheses: [
    { id: 'hyp-x', label: 'Synthetic hypothesis X', plausibleFromStart: false },
  ],
  evidence: [
    { id: 'ev-free', source: 'synthetic, no prerequisite', sourcePanelId: null, timestamp: 0, observedValueOrFinding: 'n/a', interpretationLimits: 'n/a', supportsHypothesisIds: ['hyp-x'], weakensHypothesisIds: [], decisive: true, relevant: true, availableOnlyAfterActionType: null },
  ],
  groundTruth: {
    observedSignal: 'Synthetic signal.',
    disturbanceEstablished: true,
    disturbanceDescription: 'Synthetic disturbance.',
    rootCauseEstablished: true,
    rootCauseDescription: 'Synthetic root cause.',
    signalExplanationEstablished: false,
    signalExplanationDescription: null,
    patientImpactStatus: 'NOT_INDICATED',
    appropriateDisposition: 'N/A',
    evidenceForHypotheses: [{ hypothesisId: 'hyp-x', supports: true, weight: 'DECISIVE' }],
  },
  decisionOpportunities: [
    // Four synthetic decisions, one for each outcome x reasoning combination.
    { id: 'dec-tt', category: 'INTERPRETATION', availableFromPhase: 'SIGNAL_RECOGNITION', options: [
      { id: 'opt-tt', label: 'Appropriate outcome, supported reasoning', consequenceSummary: 'Both axes true.', severity: 'INFORMATIONAL', outcomeAppropriate: true, actionType: 'FORM_HYPOTHESIS' },
    ]},
    { id: 'dec-tf', category: 'INTERPRETATION', availableFromPhase: 'SIGNAL_RECOGNITION', options: [
      { id: 'opt-tf', label: 'Appropriate outcome, UNSUPPORTED reasoning', consequenceSummary: 'Outcome happens to be right, but reasoning was not evidence-based.', severity: 'UNSUPPORTED', outcomeAppropriate: true, actionType: 'APPLY_INTERVENTION' },
    ]},
    { id: 'dec-ft', category: 'INTERPRETATION', availableFromPhase: 'SIGNAL_RECOGNITION', options: [
      { id: 'opt-ft', label: 'INAPPROPRIATE outcome, reasoning that looks supported', consequenceSummary: 'A plausible-sounding but wrong conclusion.', severity: 'INFORMATIONAL', outcomeAppropriate: false, actionType: 'CONTINUE_ANALYSIS' },
    ]},
    { id: 'dec-ff', category: 'INTERPRETATION', availableFromPhase: 'SIGNAL_RECOGNITION', options: [
      { id: 'opt-ff', label: 'INAPPROPRIATE outcome, UNSUPPORTED reasoning', consequenceSummary: 'Both axes false.', severity: 'CRITICAL_UNSAFE', outcomeAppropriate: false, actionType: 'DOCUMENT' },
    ]},
  ],
  verificationCriteria: { requiredEvidenceIds: ['ev-free'], minimumConfirmationDescription: 'n/a' },
  patientImpactCriteria: { requiredEvidenceIdsForTerminalState: ['ev-free'], minimumConfirmationDescription: 'n/a' },
  debriefEvidence: { strongPathDescription: 'n/a', weakPathDescriptions: [], commonMisconceptions: [] },
  provenance: { provenanceClass: 'V09_TEST', scientificDependencies: [] },
};
