/* =========================================================================
   v09/app/morning-qc/cases/case-04-isolated-excursion.js

   Morning QC Room — Stage 12D Case 4
   PROVENANCE: V09_NEW
   Case family: A (Random QC Excursion Without Sustained Failure)

   LEARNING OBJECTIVE: distinguish a single random common-cause QC
   exceedance from a true sustained analytical signal — and recognize
   that "doing less" (repeat + confirm + resume, no lot/calibration
   intervention) is the correct expert response once repeat testing
   confirms normal performance.

   HIDDEN TRUTH: disturbanceEstablished=false, rootCauseEstablished=false,
   signalExplanationEstablished=true (a single random common-cause
   exceedance, unrelated to any lot or calibration change).
   ========================================================================= */

export const case04IsolatedExcursion = {
  identity: {
    id: 'case-04-isolated-excursion',
    title: 'Sodium Level 2 QC — Single Out-of-Range Point',
    caseFamily: 'A',
    version: '1.0.0',
    difficulty: 'LEVEL_1_CLEAR_SIGNAL',
    intendedLearnerLevel: ['beginner', 'intermediate'],
    competencyMapping: ['QC-02', 'QC-04'],
    curriculum: {
      estimatedMinutes: 8,
      tags: ['random-variation', 'repeat-testing', 'avoid-unnecessary-intervention'],
      sequencingGroup: 'signal-interpretation-foundation',
      prerequisiteCompetencies: [],
    },
    instructor: {
      teachingPoints: [
        'A single 1_3s violation is a genuine QC rule violation and always warrants pausing — but pausing is not the same as concluding a sustained analytical problem exists.',
        'Repeat testing that returns to control is decisive evidence against a sustained disturbance; it is not merely "inefficient."',
      ],
      commonFailureModes: [
        'Learner immediately blames the reagent lot or calibration without checking whether either actually changed.',
        'Learner resumes without ever repeating QC to confirm the point was isolated.',
      ],
    },
  },
  labContext: {
    analyte: 'Sodium (synthetic educational dataset)',
    analyticalMethod: 'Indirect ISE, synthetic assay parameters',
    qcMaterials: [{ levelId: 'L2', levelName: 'Level 2', targetValue: 140, targetSD: 2 }],
    qcStrategy: '1_3s single-rule screening rule, QC every 2 hours',
    apsSource: 'manufacturer',
  },
  timeline: [
    { id: 'evt-1', type: 'QC_OBSERVATION', timestamp: 0, description: 'Run 1: 140.1 mmol/L — within control.', panelId: 'panel-qc-history' },
    { id: 'evt-2', type: 'QC_OBSERVATION', timestamp: 120, description: 'Run 2: 139.6 mmol/L — within control.', panelId: 'panel-qc-history' },
    { id: 'evt-3', type: 'QC_OBSERVATION', timestamp: 240, description: 'Run 3: 140.4 mmol/L — within control.', panelId: 'panel-qc-history' },
    { id: 'evt-4', type: 'QC_OBSERVATION', timestamp: 360, description: 'Run 4: 146.5 mmol/L — exceeds the 1_3s limit (140 ± 6).', panelId: 'panel-qc-history' },
  ],
  panels: [
    { id: 'panel-qc-history', type: 'QC_HISTORY', availableFromPhase: 'BRIEFING', relevance: 'RELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'LIS QC log', content: { note: 'Runs 1–3: 140.1, 139.6, 140.4 mmol/L, all within control. Run 4: 146.5 mmol/L, a single point exceeding the 1_3s limit (target 140, SD 2).' } },
    { id: 'panel-lj-chart', type: 'LJ_CHART', availableFromPhase: 'CHARACTERISATION', relevance: 'RELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'LJ chart export', content: { note: 'The chart shows three unremarkable points followed by one isolated excursion at run 4, with no preceding trend or shift.' } },
    { id: 'panel-reagent-lot', type: 'REAGENT_LOT', availableFromPhase: 'CHARACTERISATION', relevance: 'CONDITIONALLY_RELEVANT', costTimeMinutes: 2, mayBeMisleading: true, provenance: 'Reagent lot log', content: { note: 'No reagent lot change has occurred in the past 30 days.', learnerNote: 'No reagent lot change has occurred in the past 30 days.' } },
    { id: 'panel-calibration', type: 'CALIBRATION', availableFromPhase: 'CHARACTERISATION', relevance: 'CONDITIONALLY_RELEVANT', costTimeMinutes: 2, mayBeMisleading: true, provenance: 'Calibration log', content: { note: 'No calibration has been performed in the past 14 days.', learnerNote: 'No calibration has been performed in the past 14 days.' } },
  ],
  hypotheses: [
    { id: 'hyp-random', label: 'A single random common-cause exceedance, not a sustained analytical problem.', plausibleFromStart: true },
    { id: 'hyp-lot', label: 'A reagent lot change caused a shift.', plausibleFromStart: false },
    { id: 'hyp-calibration', label: 'A calibration event caused a shift.', plausibleFromStart: false },
  ],
  evidence: [
    { id: 'ev-single-point', source: 'panel-qc-history', sourcePanelId: 'panel-qc-history', timestamp: 360, observedValueOrFinding: 'Only run 4 exceeds the limit; runs 1–3 and the surrounding pattern show no trend.', interpretationLimits: 'A single exceedance alone does not establish whether it is isolated or the start of a sustained problem — repeat testing is required to distinguish these.', supportsHypothesisIds: ['hyp-random'], weakensHypothesisIds: [], decisive: false, relevant: true, availableOnlyAfterActionType: null },
    { id: 'ev-no-lot-change', source: 'panel-reagent-lot', sourcePanelId: 'panel-reagent-lot', timestamp: 360, observedValueOrFinding: 'No reagent lot change in the past 30 days.', interpretationLimits: 'Absence of a lot change makes a lot-related cause implausible but does not by itself confirm the point is random.', supportsHypothesisIds: ['hyp-random'], weakensHypothesisIds: ['hyp-lot'], decisive: false, relevant: true, availableOnlyAfterActionType: null },
    { id: 'ev-no-recent-cal', source: 'panel-calibration', sourcePanelId: 'panel-calibration', timestamp: 360, observedValueOrFinding: 'No calibration in the past 14 days.', interpretationLimits: 'Absence of a recent calibration makes a calibration-related cause implausible but does not by itself confirm the point is random.', supportsHypothesisIds: ['hyp-random'], weakensHypothesisIds: ['hyp-calibration'], decisive: false, relevant: true, availableOnlyAfterActionType: null },
    { id: 'ev-repeat-normal', source: 'repeat QC run', sourcePanelId: null, timestamp: 380, observedValueOrFinding: 'Repeat QC Level 2: 140.2 mmol/L — within control.', interpretationLimits: 'A single normal repeat is decisive evidence against a sustained disturbance for a case this straightforward — it does not retroactively explain WHY run 4 occurred, only that performance has returned to control.', supportsHypothesisIds: ['hyp-random'], weakensHypothesisIds: ['hyp-lot', 'hyp-calibration'], decisive: true, relevant: true, availableOnlyAfterActionType: 'REPEAT_QC' },
  ],
  decisionOpportunities: [
    { id: 'dec-containment', category: 'CONTAINMENT', availableFromPhase: 'SIGNAL_RECOGNITION', options: [
      { id: 'opt-hold', label: 'Hold reporting pending repeat QC', consequenceSummary: 'Appropriate — any 1_3s violation warrants pausing to confirm before reporting continues.', severity: 'INFORMATIONAL', outcomeAppropriate: true, actionType: 'HOLD_RESULTS', requiredEvidenceIdsForSupportedReasoning: [] },
      { id: 'opt-continue', label: 'Continue analysis without pausing', consequenceSummary: 'Unsafe — a genuine QC rule violation was never verified before reporting continued.', severity: 'UNSAFE', outcomeAppropriate: false, actionType: 'CONTINUE_ANALYSIS', requiredEvidenceIdsForSupportedReasoning: [] },
    ]},
    { id: 'dec-disposition', category: 'DISPOSITION', availableFromPhase: 'VERIFICATION', options: [
      { id: 'opt-resume-confirmed-random', label: 'Resume after repeat QC confirms normal performance', consequenceSummary: 'Correct — repeat testing is decisive evidence against a sustained disturbance; no lot/calibration intervention was ever needed.', severity: 'INFORMATIONAL', outcomeAppropriate: true, actionType: 'RESUME_SERVICE', requiredEvidenceIdsForSupportedReasoning: ['ev-repeat-normal'] },
      { id: 'opt-resume-without-repeat', label: 'Resume without repeating QC', consequenceSummary: 'Unsafe — resuming without ever confirming performance returned to control.', severity: 'UNSAFE', outcomeAppropriate: false, actionType: 'RESUME_SERVICE', requiredEvidenceIdsForSupportedReasoning: [] },
    ]},
  ],
  verificationCriteria: { requiredEvidenceIds: ['ev-repeat-normal'], minimumConfirmationDescription: 'A single normal repeat QC result is sufficient verification for this case.' },
  patientImpactCriteria: { requiredEvidenceIdsForTerminalState: ['ev-repeat-normal'], minimumConfirmationDescription: 'No patient impact is indicated once repeat QC confirms an isolated, non-sustained excursion.' },
  debriefEvidence: {
    commonMisconceptions: ['A single out-of-range QC point always means a reagent lot or calibration problem exists.', 'Once a point is out of range, service can never resume without a formal intervention.'],
    strongPathDescription: 'You correctly held reporting on the initial exceedance, checked for a lot/calibration explanation without assuming one, and used repeat testing as the decisive step before resuming — no unnecessary intervention was performed.',
    weakPathDescriptions: ['Concluding a lot or calibration cause without checking whether either actually changed.', 'Resuming service without ever repeating QC to confirm normal performance.'],
  },
  groundTruth: {
    observedSignal: 'QC Level 2 result at run 4 = 146.5 mmol/L, exceeding the 1_3s limit (target 140, SD 2, limit 146).',
    disturbanceEstablished: false,
    disturbanceDescription: null,
    rootCauseEstablished: false,
    rootCauseDescription: null,
    signalExplanationEstablished: true,
    signalExplanationDescription: 'A single random common-cause exceedance. No reagent lot change and no calibration occurred in the relevant window, and an immediate repeat returned to control — there is no sustained analytical disturbance to explain.',
    patientImpactStatus: 'NOT_INDICATED',
    appropriateDisposition: 'RESUME_AFTER_REPEAT_CONFIRMS_RANDOM_VARIATION',
    evidenceForHypotheses: [
      { hypothesisId: 'hyp-random', supports: true, weight: 'DECISIVE' },
      { hypothesisId: 'hyp-lot', supports: false, weight: 'SUPPORTIVE' },
      { hypothesisId: 'hyp-calibration', supports: false, weight: 'SUPPORTIVE' },
    ],
  },
  provenance: {
    provenanceClass: 'V09_NEW',
    scientificDependencies: ['app/rules/engine.js:detect1_3s'],
  },
};
