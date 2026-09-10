/* =========================================================================
   v09/app/morning-qc/cases/case-05-increased-imprecision.js

   Morning QC Room — Stage 12D Case 5
   PROVENANCE: V09_NEW
   Case family: C (Increased Imprecision)

   LEARNING OBJECTIVE: recognize increased scatter (imprecision) as
   distinct from a mean shift — the mean looks fine, masking a true
   precision problem that degrades Sigma performance.

   HIDDEN TRUTH: disturbanceEstablished=true (a genuine imprecision
   problem), rootCauseEstablished=true (a failing pipetting mechanism),
   signalExplanationEstablished=false (not applicable — this IS an
   analytical disturbance).
   ========================================================================= */

export const case05IncreasedImprecision = {
  identity: {
    id: 'case-05-increased-imprecision',
    title: 'Potassium Level 1 QC — Widened Scatter, Mean On Target',
    caseFamily: 'C',
    version: '1.0.0',
    difficulty: 'LEVEL_2_COMPETING_EXPLANATION',
    intendedLearnerLevel: ['intermediate', 'advanced'],
    competencyMapping: ['QC-01', 'QC-02', 'QC-07'],
    curriculum: {
      estimatedMinutes: 12,
      tags: ['imprecision', 'sigma-impact', 'mean-vs-sd'],
      sequencingGroup: 'statistical-interpretation',
      prerequisiteCompetencies: ['SIGNAL_RECOGNITION'],
    },
    instructor: {
      teachingPoints: [
        'A mean that looks "on target" can still hide a genuine, clinically significant precision problem.',
        'Imprecision degrades Sigma performance even when no single point crosses a control limit.',
      ],
      commonFailureModes: [
        'Learner sees the mean is close to target and dismisses the signal entirely.',
        'Learner treats scatter as a lot/calibration problem without checking the pipetting/sampling mechanism.',
      ],
    },
  },
  labContext: {
    analyte: 'Potassium (synthetic educational dataset)',
    analyticalMethod: 'Indirect ISE, synthetic assay parameters',
    qcMaterials: [{ levelId: 'L1', levelName: 'Level 1', targetValue: 3.5, targetSD: 0.08 }],
    qcStrategy: '1_3s/2_2s multirule, QC every 4 hours',
    apsSource: 'manufacturer',
    sigmaContext: { teaPercent: 8, priorCVPercent: 2.3, biasPercent: 0.2, priorSigma: 3.8 },
  },
  timeline: [
    { id: 'evt-1', type: 'QC_OBSERVATION', timestamp: 0, description: 'Run 1: 3.51 mmol/L.', panelId: 'panel-qc-history' },
    { id: 'evt-2', type: 'QC_OBSERVATION', timestamp: 240, description: 'Run 2: 3.38 mmol/L.', panelId: 'panel-qc-history' },
    { id: 'evt-3', type: 'QC_OBSERVATION', timestamp: 480, description: 'Run 3: 3.63 mmol/L.', panelId: 'panel-qc-history' },
    { id: 'evt-4', type: 'QC_OBSERVATION', timestamp: 720, description: 'Run 4: 3.36 mmol/L — 2_2s rule triggered across runs 3-4 range span.', panelId: 'panel-qc-history' },
  ],
  panels: [
    { id: 'panel-qc-history', type: 'QC_HISTORY', availableFromPhase: 'BRIEFING', relevance: 'RELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'LIS QC log', content: { note: 'Mean of the last 4 runs = 3.47 mmol/L (target 3.5) — close to target. SD of the last 4 runs = 0.13 mmol/L, versus the established prior SD of 0.08.' } },
    { id: 'panel-lj-chart', type: 'LJ_CHART', availableFromPhase: 'CHARACTERISATION', relevance: 'RELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'LJ chart export', content: { note: 'Points scatter widely above and below the mean line with no consistent directional shift — the pattern is one of increased spread, not a shifted centerline.' } },
    { id: 'panel-sigma', type: 'SIGMA', availableFromPhase: 'CHARACTERISATION', relevance: 'RELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'Sigma calculation', content: { note: 'Using the CURRENT observed SD (0.13) instead of the prior established CV, Sigma falls from the prior 3.8 to approximately 2.3 — a substantial, clinically relevant degradation.', learnerNote: 'Recalculating Sigma with the current run\u2019s SD (0.13) instead of the prior established SD (0.08) shows Sigma falling from 3.8 to approximately 2.3.' } },
    { id: 'panel-maintenance', type: 'MAINTENANCE', availableFromPhase: 'CHARACTERISATION', relevance: 'RELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'Maintenance log', content: { note: 'The sample probe pipetting mechanism was flagged for irregular aspiration volume during this shift\u2019s automated self-check.' } },
    { id: 'panel-reagent-lot', type: 'REAGENT_LOT', availableFromPhase: 'CHARACTERISATION', relevance: 'IRRELEVANT', costTimeMinutes: 2, mayBeMisleading: true, provenance: 'Reagent lot log', content: { note: 'No reagent lot change has occurred in the past 30 days.', learnerNote: 'No reagent lot change has occurred in the past 30 days.' } },
  ],
  hypotheses: [
    { id: 'hyp-imprecision', label: 'Increased random imprecision (widened scatter), not a shift.', plausibleFromStart: true },
    { id: 'hyp-lot', label: 'A reagent lot change caused the pattern.', plausibleFromStart: false },
    { id: 'hyp-mean-fine-dismiss', label: 'The mean is on target, so nothing is wrong.', plausibleFromStart: false },
  ],
  evidence: [
    { id: 'ev-sd-widened', source: 'panel-qc-history', sourcePanelId: 'panel-qc-history', timestamp: 720, observedValueOrFinding: 'Observed SD (0.13) substantially exceeds the established prior SD (0.08), while the mean remains close to target.', interpretationLimits: 'A widened SD with an on-target mean is the signature of imprecision, not a shift — but this alone does not identify the mechanical cause.', supportsHypothesisIds: ['hyp-imprecision'], weakensHypothesisIds: ['hyp-mean-fine-dismiss'], decisive: false, relevant: true, availableOnlyAfterActionType: null },
    { id: 'ev-sigma-degraded', source: 'panel-sigma', sourcePanelId: 'panel-sigma', timestamp: 720, observedValueOrFinding: 'Sigma falls from 3.8 to approximately 2.3 when recalculated with the current observed SD.', interpretationLimits: 'This quantifies the clinical significance of the imprecision — it does not by itself identify the mechanical cause.', supportsHypothesisIds: ['hyp-imprecision'], weakensHypothesisIds: ['hyp-mean-fine-dismiss'], decisive: false, relevant: true, availableOnlyAfterActionType: null },
    { id: 'ev-probe-flagged', source: 'panel-maintenance', sourcePanelId: 'panel-maintenance', timestamp: 720, observedValueOrFinding: 'The sample probe was flagged for irregular aspiration volume during this shift.', interpretationLimits: 'A flagged mechanical irregularity affecting aspiration volume is a plausible, evidence-based mechanism for genuine imprecision — decisive within this case\u2019s evidence set.', supportsHypothesisIds: ['hyp-imprecision'], weakensHypothesisIds: ['hyp-lot'], decisive: true, relevant: true, availableOnlyAfterActionType: null },
    { id: 'ev-no-lot-change', source: 'panel-reagent-lot', sourcePanelId: 'panel-reagent-lot', timestamp: 720, observedValueOrFinding: 'No reagent lot change in the past 30 days.', interpretationLimits: 'Rules out a lot-related explanation for this pattern.', supportsHypothesisIds: [], weakensHypothesisIds: ['hyp-lot'], decisive: false, relevant: true, availableOnlyAfterActionType: null },
  ],
  decisionOpportunities: [
    { id: 'dec-containment', category: 'CONTAINMENT', availableFromPhase: 'SIGNAL_RECOGNITION', options: [
      { id: 'opt-hold', label: 'Hold reporting pending investigation of the widened scatter', consequenceSummary: 'Appropriate — a 2_2s rule violation reflecting genuine imprecision warrants pausing before further reporting.', severity: 'INFORMATIONAL', outcomeAppropriate: true, actionType: 'HOLD_RESULTS', requiredEvidenceIdsForSupportedReasoning: [] },
      { id: 'opt-continue-mean-fine', label: 'Continue analysis because the mean is on target', consequenceSummary: 'Unsafe — dismissing a precision problem because the mean looks acceptable ignores a genuine, clinically relevant Sigma degradation.', severity: 'UNSAFE', outcomeAppropriate: false, actionType: 'CONTINUE_ANALYSIS', requiredEvidenceIdsForSupportedReasoning: [] },
    ]},
    { id: 'dec-intervention', category: 'INTERVENTION', availableFromPhase: 'HYPOTHESIS_GENERATION', options: [
      { id: 'opt-service-probe', label: 'Service/replace the flagged pipetting probe', consequenceSummary: 'Correct corrective action for a confirmed mechanical imprecision cause.', severity: 'INFORMATIONAL', outcomeAppropriate: true, actionType: 'APPLY_INTERVENTION', requiredEvidenceIdsForSupportedReasoning: ['ev-probe-flagged'] },
    ]},
  ],
  verificationCriteria: { requiredEvidenceIds: ['ev-probe-flagged'], minimumConfirmationDescription: 'Verification requires repeat QC demonstrating SD has returned toward the established prior value after probe service.' },
  patientImpactCriteria: { requiredEvidenceIdsForTerminalState: ['ev-sd-widened'], minimumConfirmationDescription: 'Patient-impact review for a precision (not accuracy) problem focuses on results near clinical decision points during the affected window.' },
  debriefEvidence: {
    commonMisconceptions: ['If the mean is on target, QC is fine.', 'Increased scatter must be a reagent lot problem.'],
    strongPathDescription: 'You recognized that an on-target mean does not rule out a precision problem, quantified its Sigma impact, and correctly traced it to the flagged pipetting mechanism rather than assuming a lot cause.',
    weakPathDescriptions: ['Dismissing the signal because the mean looked acceptable.', 'Concluding a lot-related cause without checking whether a lot change actually occurred.'],
  },
  groundTruth: {
    observedSignal: 'QC Level 1 potassium: mean 3.47 mmol/L (near target 3.5), SD 0.13 versus established prior SD 0.08 — a 2_2s rule triggered by run-to-run range.',
    disturbanceEstablished: true,
    disturbanceDescription: 'Genuine increased imprecision (widened SD) traced to a flagged pipetting-probe irregularity.',
    rootCauseEstablished: true,
    rootCauseDescription: 'Irregular aspiration volume from the sample probe, flagged by the analyzer\u2019s automated self-check during this shift.',
    signalExplanationEstablished: false,
    signalExplanationDescription: null,
    patientImpactStatus: 'NOT_INDICATED',
    appropriateDisposition: 'HOLD_THEN_RESUME_AFTER_PROBE_SERVICE_AND_VERIFIED_SD_RECOVERY',
    evidenceForHypotheses: [
      { hypothesisId: 'hyp-imprecision', supports: true, weight: 'DECISIVE' },
      { hypothesisId: 'hyp-lot', supports: false, weight: 'SUPPORTIVE' },
      { hypothesisId: 'hyp-mean-fine-dismiss', supports: false, weight: 'DECISIVE' },
    ],
  },
  provenance: {
    provenanceClass: 'V09_NEW',
    scientificDependencies: ['app/rules/engine.js:detect2_2s', 'app/opchar/sigma.js:calculateSigma'],
  },
};
