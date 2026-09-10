/* =========================================================================
   v09/app/morning-qc/cases/case-09-seek-more-evidence.js

   Morning QC Room — Stage 12D Case 9
   PROVENANCE: V09_NEW
   Case family: O (Incomplete-Information Case Where the Correct Decision
   Is to Seek More Evidence)

   LEARNING OBJECTIVE: recognize when the correct action is deferral
   pending more evidence, not a premature decision — the available
   information plausibly points two directions, and the expert path is
   to obtain the one piece of evidence that discriminates between them
   before disposing of the case at all.

   HIDDEN TRUTH: disturbanceEstablished=true, rootCauseEstablished=true
   (a partially clotted specimen aspiration issue), signalExplanationEstablished=false.
   ========================================================================= */

export const case09SeekMoreEvidence = {
  identity: {
    id: 'case-09-seek-more-evidence',
    title: 'Magnesium Level 2 QC — Ambiguous Single-Run Deviation',
    caseFamily: 'O',
    version: '1.0.0',
    difficulty: 'LEVEL_3_MULTIPLE_SIGNALS_INCOMPLETE_EVIDENCE',
    intendedLearnerLevel: ['advanced', 'expert'],
    competencyMapping: ['QC-05', 'QC-11', 'QC-12'],
    curriculum: {
      estimatedMinutes: 12,
      tags: ['premature-closure', 'metacognitive-calibration', 'defer-decision'],
      sequencingGroup: 'evidence-selection-deferral',
      prerequisiteCompetencies: ['EVIDENCE_SELECTION'],
    },
    instructor: {
      teachingPoints: [
        'Sometimes the correct expert action is to obtain one more specific, discriminating piece of evidence before disposing of the case at all — not to force a conclusion from what is already available.',
        'Two plausible explanations can both be genuinely consistent with the evidence so far; the expert difference is knowing what evidence would discriminate between them.',
      ],
      commonFailureModes: [
        'Learner forces a conclusion (reagent problem vs. instrument problem) before checking the one piece of evidence that would discriminate.',
        'Learner records high confidence despite the case explicitly being ambiguous at that point.',
      ],
    },
  },
  labContext: {
    analyte: 'Magnesium (synthetic educational dataset)',
    analyticalMethod: 'Colorimetric, synthetic assay parameters',
    qcMaterials: [{ levelId: 'L2', levelName: 'Level 2', targetValue: 2.0, targetSD: 0.05 }],
    qcStrategy: '1_3s single-rule screening, QC every 4 hours',
    apsSource: 'manufacturer',
  },
  timeline: [
    { id: 'evt-1', type: 'QC_OBSERVATION', timestamp: 0, description: 'Run 1: 1.79 mg/dL — exceeds the 1_3s lower limit (2.0 \u00b1 0.15).', panelId: 'panel-qc-history' },
  ],
  panels: [
    { id: 'panel-qc-history', type: 'QC_HISTORY', availableFromPhase: 'BRIEFING', relevance: 'RELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'LIS QC log', content: { note: 'A single run: 1.79 mg/dL, exceeding the 1_3s lower limit. No prior pattern is available yet within this shift.' } },
    { id: 'panel-analyzer-status', type: 'ANALYZER_STATUS', availableFromPhase: 'CHARACTERISATION', relevance: 'CONDITIONALLY_RELEVANT', costTimeMinutes: 2, mayBeMisleading: true, provenance: 'Analyzer system log', content: { note: 'The analyzer logged a minor "aspiration pressure variance" flag on the affected run, within the range the manufacturer classifies as usually not clinically significant.', learnerNote: 'The analyzer logged a minor "aspiration pressure variance" flag on the affected run, within the range the manufacturer classifies as usually not clinically significant.' } },
    { id: 'panel-reagent-lot', type: 'REAGENT_LOT', availableFromPhase: 'CHARACTERISATION', relevance: 'CONDITIONALLY_RELEVANT', costTimeMinutes: 2, mayBeMisleading: true, provenance: 'Reagent lot log', content: { note: 'A new reagent lot was brought into service earlier this shift, before this run.', learnerNote: 'A new reagent lot was brought into service earlier this shift, before this run.' } },
  ],
  hypotheses: [
    { id: 'hyp-aspiration', label: 'A minor aspiration/sampling irregularity on this specific run.', plausibleFromStart: true },
    { id: 'hyp-lot', label: 'The new reagent lot is the cause.', plausibleFromStart: true },
  ],
  evidence: [
    { id: 'ev-aspiration-flag', source: 'panel-analyzer-status', sourcePanelId: 'panel-analyzer-status', timestamp: 0, observedValueOrFinding: 'A minor aspiration pressure variance flag was logged on the affected run.', interpretationLimits: 'Plausible but not decisive on its own — the new lot is an equally plausible competing explanation at this point, and neither can be ruled out from this evidence alone.', supportsHypothesisIds: ['hyp-aspiration'], weakensHypothesisIds: [], decisive: false, relevant: true, availableOnlyAfterActionType: null },
    { id: 'ev-new-lot', source: 'panel-reagent-lot', sourcePanelId: 'panel-reagent-lot', timestamp: 0, observedValueOrFinding: 'A new reagent lot was brought into service earlier this shift.', interpretationLimits: 'Plausible but not decisive on its own — the aspiration flag is an equally plausible competing explanation at this point.', supportsHypothesisIds: ['hyp-lot'], weakensHypothesisIds: [], decisive: false, relevant: true, availableOnlyAfterActionType: null },
    { id: 'ev-repeat-discriminates', source: 'repeat QC run', sourcePanelId: null, timestamp: 20, observedValueOrFinding: 'A repeat run on the SAME reagent lot returns 2.01 mg/dL, within control — discriminating decisively against the lot explanation and toward a run-specific (aspiration) cause.', interpretationLimits: 'This is the single piece of evidence that actually discriminates between the two competing, equally-plausible hypotheses — obtaining it before disposing of the case is the correct expert action, not a premature conclusion from either panel alone.', supportsHypothesisIds: ['hyp-aspiration'], weakensHypothesisIds: ['hyp-lot'], decisive: true, relevant: true, availableOnlyAfterActionType: 'REPEAT_QC' },
  ],
  decisionOpportunities: [
    { id: 'dec-containment', category: 'CONTAINMENT', availableFromPhase: 'SIGNAL_RECOGNITION', options: [
      { id: 'opt-hold', label: 'Hold reporting pending repeat QC', consequenceSummary: 'Appropriate — a 1_3s violation warrants pausing, and with two equally plausible competing explanations, repeat testing is the correct next step before any conclusion.', severity: 'INFORMATIONAL', outcomeAppropriate: true, actionType: 'HOLD_RESULTS', requiredEvidenceIdsForSupportedReasoning: [] },
    ]},
    { id: 'dec-disposition', category: 'DISPOSITION', availableFromPhase: 'VERIFICATION', options: [
      { id: 'opt-resume-after-repeat', label: 'Resume after the discriminating repeat confirms a run-specific cause', consequenceSummary: 'Correct — you obtained the one piece of evidence that actually discriminated between the two competing hypotheses before concluding anything.', severity: 'INFORMATIONAL', outcomeAppropriate: true, actionType: 'RESUME_SERVICE', requiredEvidenceIdsForSupportedReasoning: ['ev-repeat-discriminates'] },
      { id: 'opt-conclude-lot-early', label: 'Conclude the new lot is the cause without repeating on the same lot', consequenceSummary: 'Unsupported — this forces a conclusion from evidence that does not discriminate between the two equally plausible explanations.', severity: 'UNSUPPORTED', outcomeAppropriate: false, actionType: 'RESUME_SERVICE', requiredEvidenceIdsForSupportedReasoning: [] },
    ]},
  ],
  verificationCriteria: { requiredEvidenceIds: ['ev-repeat-discriminates'], minimumConfirmationDescription: 'Verification requires the discriminating repeat result, not merely acknowledging both panels exist.' },
  patientImpactCriteria: { requiredEvidenceIdsForTerminalState: ['ev-repeat-discriminates'], minimumConfirmationDescription: 'No patient impact is indicated once the single affected run is confirmed run-specific rather than lot-wide.' },
  debriefEvidence: {
    commonMisconceptions: ['Whichever explanation you notice first (aspiration flag or new lot) must be the answer.', 'With two plausible explanations, you must pick one immediately rather than seek discriminating evidence.'],
    strongPathDescription: 'You recognized that the aspiration flag and the new lot were both merely plausible, not decisive, and correctly sought the one discriminating piece of evidence — a repeat on the same lot — before concluding anything.',
    weakPathDescriptions: ['Concluding the new lot was the cause without ever repeating QC on that same lot to check.', 'Recording high confidence in either explanation before the discriminating evidence was obtained.'],
  },
  groundTruth: {
    observedSignal: 'Magnesium Level 2 QC: single run at 1.79 mg/dL, exceeding the 1_3s lower limit (2.0 \u00b1 0.15).',
    disturbanceEstablished: true,
    disturbanceDescription: 'A genuine, run-specific analytical deviation caused by a minor aspiration irregularity, not the newly introduced reagent lot.',
    rootCauseEstablished: true,
    rootCauseDescription: 'A minor aspiration pressure irregularity on the specific affected run, confirmed by a normal repeat on the same reagent lot.',
    signalExplanationEstablished: false,
    signalExplanationDescription: null,
    patientImpactStatus: 'NOT_INDICATED',
    appropriateDisposition: 'HOLD_THEN_RESUME_AFTER_DISCRIMINATING_REPEAT_CONFIRMS_RUN_SPECIFIC_CAUSE',
    evidenceForHypotheses: [
      { hypothesisId: 'hyp-aspiration', supports: true, weight: 'DECISIVE' },
      { hypothesisId: 'hyp-lot', supports: false, weight: 'DECISIVE' },
    ],
  },
  provenance: {
    provenanceClass: 'V09_NEW',
    scientificDependencies: ['app/rules/engine.js:detect1_3s'],
  },
};
