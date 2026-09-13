/* =========================================================================
   v09/app/morning-qc/cases/case-08-eqa-discordance.js

   Morning QC Room — Stage 12D Case 8
   PROVENANCE: V09_NEW
   Case family: I (Stable IQC but Problematic EQA)

   LEARNING OBJECTIVE: recognize that internal QC and external quality
   assessment answer different questions (precision vs. trueness) — a
   stable IQC record must not be used to dismiss a genuine EQA
   discordance.

   HIDDEN TRUTH: disturbanceEstablished=true (a genuine trueness/bias
   problem invisible to IQC), rootCauseEstablished=true (a
   method-specific interference), signalExplanationEstablished=false.
   ========================================================================= */

export const case08EqaDiscordance = {
  identity: {
    id: 'case-08-eqa-discordance',
    title: 'Total Bilirubin — External Assessment Flags a Trueness Concern',
    caseFamily: 'I',
    version: '1.0.0',
    difficulty: 'LEVEL_3_MULTIPLE_SIGNALS_INCOMPLETE_EVIDENCE',
    intendedLearnerLevel: ['advanced', 'expert'],
    competencyMapping: ['QC-06', 'QC-09'],
    curriculum: {
      estimatedMinutes: 14,
      tags: ['eqa', 'trueness-vs-precision', 'iqc-limitation'],
      sequencingGroup: 'external-assurance',
      prerequisiteCompetencies: ['ANALYTICAL_REASONING'],
      competencyTargets: ['STATISTICAL_INTERPRETATION', 'ANALYTICAL_REASONING'],
    },
    instructor: {
      teachingPoints: [
        'IQC monitors precision/stability against your own material; it cannot detect a systematic bias present across all your results relative to other methods or peer groups — and a peer-group mean (all-methods or method-specific) is itself a peer statistic, never itself "the true value."',
        '"IQC is fine" is not a valid reason to dismiss an EQA discordance.',
      ],
      commonFailureModes: [
        'Learner uses a stable IQC history to argue the EQA result must be an outlier or clerical error.',
        'Learner escalates immediately without checking whether the interference is method-specific and reproducible.',
      ],
    },
  },
  labContext: {
    analyte: 'Total Bilirubin (synthetic educational dataset)',
    analyticalMethod: 'Diazo method, synthetic assay parameters',
    qcMaterials: [{ levelId: 'L2', levelName: 'Level 2', targetValue: 4.5, targetSD: 0.15 }],
    qcStrategy: '1_3s single-rule screening, QC every 8 hours',
    apsSource: 'regulatory',
  },
  timeline: [
    { id: 'evt-1', type: 'EQA_INFORMATION', timestamp: 0, description: 'EQA round result received: laboratory value 6.8 mg/dL vs. peer group mean 5.1 mg/dL (all-methods peer group), a deviation index outside the acceptable range.', panelId: 'panel-eqa' },
  ],
  panels: [
    { id: 'panel-qc-history', type: 'QC_HISTORY', availableFromPhase: 'BRIEFING', relevance: 'CONDITIONALLY_RELEVANT', costTimeMinutes: 2, mayBeMisleading: true, provenance: 'LIS QC log', content: { note: 'The past 60 days of Level 2 IQC show a stable mean of 4.48 mg/dL against a target of 4.5, with no rule violations.', learnerNote: 'The past 60 days of Level 2 IQC show a stable mean of 4.48 mg/dL against a target of 4.5, with no rule violations.' } },
    { id: 'panel-eqa', type: 'EQA', availableFromPhase: 'BRIEFING', relevance: 'RELEVANT', costTimeMinutes: 3, mayBeMisleading: false, provenance: 'EQA scheme report', content: { note: 'This round\u2019s result: laboratory 6.8 mg/dL vs. all-methods peer mean 5.1 mg/dL. Deviation index outside the acceptable range. The method-specific (diazo-only) peer subgroup mean is 6.6 mg/dL.', learnerNote: 'This round\u2019s result: laboratory 6.8 mg/dL vs. all-methods peer mean 5.1 mg/dL (deviation index outside acceptable range). The method-specific (diazo-only) peer subgroup mean is 6.6 mg/dL.' } },
    { id: 'panel-reagent-lot', type: 'REAGENT_LOT', availableFromPhase: 'CHARACTERISATION', relevance: 'CONDITIONALLY_RELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'Reagent lot log', content: { note: 'No reagent lot change has occurred in the past 30 days.', learnerNote: 'No reagent lot change has occurred in the past 30 days.' } },
  ],
  hypotheses: [
    { id: 'hyp-method-difference', label: 'A known diazo-method positive interference/bias explains most of the discordance against the all-methods peer group.', plausibleFromStart: true },
    { id: 'hyp-iqc-fine-dismiss', label: 'IQC is stable, so the EQA result must be an outlier or clerical error.', plausibleFromStart: false },
  ],
  evidence: [
    { id: 'ev-iqc-stable', source: 'panel-qc-history', sourcePanelId: 'panel-qc-history', timestamp: 0, observedValueOrFinding: 'IQC has been stable for 60 days with no rule violations.', interpretationLimits: 'Stable IQC establishes precision/stability against your OWN material — it does NOT, by itself, establish trueness relative to a reference or peer value, and cannot be used to dismiss an EQA discordance.', supportsHypothesisIds: [], weakensHypothesisIds: ['hyp-iqc-fine-dismiss'], decisive: false, relevant: true, availableOnlyAfterActionType: null },
    { id: 'ev-method-subgroup-closer', source: 'panel-eqa', sourcePanelId: 'panel-eqa', timestamp: 0, observedValueOrFinding: 'The method-specific (diazo-only) peer subgroup mean (6.6 mg/dL) is much closer to the laboratory\u2019s result (6.8) than the all-methods peer mean (5.1).', interpretationLimits: 'This is decisive evidence that most of the apparent discordance reflects a KNOWN, expected method difference rather than a laboratory-specific error — it does not mean the small residual difference from the method peer group is necessarily zero.', supportsHypothesisIds: ['hyp-method-difference'], weakensHypothesisIds: ['hyp-iqc-fine-dismiss'], decisive: true, relevant: true, availableOnlyAfterActionType: null },
    { id: 'ev-no-lot-change', source: 'panel-reagent-lot', sourcePanelId: 'panel-reagent-lot', timestamp: 0, observedValueOrFinding: 'No reagent lot change in the past 30 days.', interpretationLimits: 'Rules out a recent lot-related explanation.', supportsHypothesisIds: [], weakensHypothesisIds: [], decisive: false, relevant: true, availableOnlyAfterActionType: null },
  ],
  decisionOpportunities: [
    { id: 'dec-disposition', category: 'DISPOSITION', availableFromPhase: 'EVIDENCE_SELECTION', options: [
      { id: 'opt-investigate-method-difference', label: 'Investigate the discordance against the method-specific peer group and document the finding', consequenceSummary: 'Correct — comparing against the method-specific peer subgroup is the appropriate way to interpret a diazo-method result, and stable IQC never dismisses the EQA discordance.', severity: 'INFORMATIONAL', outcomeAppropriate: true, actionType: 'DOCUMENT', requiredEvidenceIdsForSupportedReasoning: ['ev-method-subgroup-closer'] },
      { id: 'opt-dismiss-iqc-fine', label: 'Dismiss the EQA result because IQC has been stable', consequenceSummary: 'Incorrect and unsupported — this is precisely the forbidden inference this case family targets: IQC precision does not establish trueness.', severity: 'UNSUPPORTED', outcomeAppropriate: false, actionType: 'DOCUMENT', requiredEvidenceIdsForSupportedReasoning: [] },
    ]},
  ],
  verificationCriteria: { requiredEvidenceIds: ['ev-method-subgroup-closer'], minimumConfirmationDescription: 'Verification here means confirming the interpretation against the correct (method-specific) peer group, not a QC-recovery cycle.' },
  patientImpactCriteria: { requiredEvidenceIdsForTerminalState: ['ev-method-subgroup-closer'], minimumConfirmationDescription: 'Patient-impact assessment for a known, expected method difference does not indicate a new patient-safety concern beyond existing method-difference awareness.' },
  debriefEvidence: {
    commonMisconceptions: ['A stable IQC record proves the EQA result must be wrong.', 'Any EQA deviation index outside range means a real analytical problem exists.'],
    strongPathDescription: 'You recognized that IQC precision and EQA trueness answer different questions, and correctly re-interpreted the discordance against the method-specific peer subgroup rather than dismissing it because IQC looked fine.',
    weakPathDescriptions: ['Dismissing the EQA discordance solely because IQC has been stable.', 'Escalating without checking whether a known method difference explains most of the gap.'],
  },
  groundTruth: {
    observedSignal: 'EQA round: laboratory 6.8 mg/dL vs. all-methods peer mean 5.1 mg/dL, deviation index outside the acceptable range.',
    disturbanceEstablished: true,
    disturbanceDescription: 'A genuine, known diazo-method positive bias relative to the all-methods peer group — a real trueness characteristic of the method, invisible to IQC.',
    rootCauseEstablished: true,
    rootCauseDescription: 'A known, method-specific (diazo) positive interference/bias relative to reference-method-based all-methods peer statistics.',
    signalExplanationEstablished: false,
    signalExplanationDescription: null,
    patientImpactStatus: 'NOT_INDICATED',
    appropriateDisposition: 'DOCUMENT_METHOD_SPECIFIC_INTERPRETATION_NO_ANALYTICAL_HOLD',
    evidenceForHypotheses: [
      { hypothesisId: 'hyp-method-difference', supports: true, weight: 'DECISIVE' },
      { hypothesisId: 'hyp-iqc-fine-dismiss', supports: false, weight: 'DECISIVE' },
    ],
  },
  provenance: {
    provenanceClass: 'V09_NEW',
    scientificDependencies: ['app/eqa/calc.js'],
  },
};
