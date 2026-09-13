/* =========================================================================
   v09/app/morning-qc/cases/case-08-eqa-discordance.js

   Morning QC Room — Stage 12D Case 8
   PROVENANCE: V09_MODIFIED (Stage 12D FINAL closure — Item 12, Option A)
   Case family: I (Stable IQC but Problematic EQA)

   LEARNING OBJECTIVE: recognize that internal QC and external quality
   assessment answer different questions (precision vs. peer/method
   comparability) — a stable IQC record must not be used to dismiss an
   EQA discordance, and the correct peer group must be identified before
   drawing any conclusion.

   SCIENTIFIC CORRECTION (Stage 12D FINAL closure, Item 12, OPTION A —
   peer-comparability / signal-explanation model): the original version
   claimed a "genuine trueness/bias problem" and a "reference-method-
   based" root cause without ever authoring a genuine, commutable
   reference-method/assigned target — a peer-group mean (all-methods or
   method-specific) is a PEER STATISTIC, never itself a trueness
   reference. This case now makes NO trueness/bias/interference claim
   and NO root-cause claim. It is a signal-EXPLANATION case: the
   apparent discordance is explained by having compared against the
   WRONG peer group (all-methods) rather than the correct one
   (method-specific); no interference, bias, or laboratory-specific
   problem is established, and no automatic patient-impact inference is
   drawn from subgroup closeness alone.
   ========================================================================= */

export const case08EqaDiscordance = {
  identity: {
    id: 'case-08-eqa-discordance',
    title: 'Total Bilirubin — External Assessment Flags a Concern',
    caseFamily: 'I',
    version: '1.1.0',
    difficulty: 'LEVEL_3_MULTIPLE_SIGNALS_INCOMPLETE_EVIDENCE',
    intendedLearnerLevel: ['advanced', 'expert'],
    competencyMapping: ['QC-06', 'QC-09'],
    curriculum: {
      estimatedMinutes: 14,
      tags: ['eqa', 'peer-group-comparability', 'iqc-limitation'],
      sequencingGroup: 'external-assurance',
      prerequisiteCompetencies: ['ANALYTICAL_REASONING'],
      competencyTargets: ['STATISTICAL_INTERPRETATION', 'ANALYTICAL_REASONING', 'DOCUMENTATION_GOVERNANCE'],
    },
    instructor: {
      teachingPoints: [
        'IQC monitors precision/stability against your own material; it cannot detect a systematic difference present across all your results relative to another peer group — and a peer-group mean (all-methods or method-specific) is itself a peer STATISTIC, never a trueness reference.',
        '"IQC is fine" is not a valid reason to dismiss an EQA discordance.',
        'This case makes NO trueness/bias/interference claim — it is a signal-EXPLANATION case: the apparent discordance is explained by comparison against the wrong peer group, not by identifying any laboratory-specific problem or mechanism.',
      ],
      commonFailureModes: [
        'Learner uses a stable IQC history to argue the EQA result must be an outlier or clerical error.',
        'Learner treats "closer to the method-specific peer mean" as proof of a specific interference mechanism, rather than as evidence that peer-group selection explains the apparent gap.',
        'Learner infers a patient-impact conclusion from subgroup closeness alone, without it being separately evidenced.',
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
    { id: 'evt-1', type: 'EQA_INFORMATION', timestamp: 0, description: 'EQA round result received: laboratory value 6.8 mg/dL vs. all-methods peer group mean 5.1 mg/dL, a deviation index outside the acceptable range.', panelId: 'panel-eqa' },
  ],
  panels: [
    { id: 'panel-qc-history', type: 'QC_HISTORY', availableFromPhase: 'BRIEFING', relevance: 'CONDITIONALLY_RELEVANT', costTimeMinutes: 2, mayBeMisleading: true, provenance: 'LIS QC log', content: { note: 'The past 60 days of Level 2 IQC show a stable mean of 4.48 mg/dL against a target of 4.5, with no rule violations.', learnerNote: 'The past 60 days of Level 2 IQC show a stable mean of 4.48 mg/dL against a target of 4.5, with no rule violations.' } },
    { id: 'panel-eqa', type: 'EQA', availableFromPhase: 'BRIEFING', relevance: 'RELEVANT', costTimeMinutes: 3, mayBeMisleading: false, provenance: 'EQA scheme report', content: { note: 'This round\u2019s result: laboratory 6.8 mg/dL vs. all-methods peer group mean 5.1 mg/dL. Deviation index outside the acceptable range. The method-specific (diazo-only) peer subgroup mean is 6.6 mg/dL — diazo methods are a known, pre-existing higher-reading group for this analyte relative to the all-methods average.', learnerNote: 'This round\u2019s result: laboratory 6.8 mg/dL vs. all-methods peer group mean 5.1 mg/dL (deviation index outside acceptable range). The method-specific (diazo-only) peer subgroup mean is 6.6 mg/dL.' } },
    { id: 'panel-reagent-lot', type: 'REAGENT_LOT', availableFromPhase: 'CHARACTERISATION', relevance: 'CONDITIONALLY_RELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'Reagent lot log', content: { note: 'No reagent lot change has occurred in the past 30 days.', learnerNote: 'No reagent lot change has occurred in the past 30 days.' } },
  ],
  hypotheses: [
    { id: 'hyp-method-difference', label: 'Comparison against the wrong (all-methods) peer group explains most of the apparent discordance; the method-specific peer group is the appropriate comparator.', plausibleFromStart: true },
    { id: 'hyp-iqc-fine-dismiss', label: 'IQC is stable, so the EQA result must be an outlier or clerical error.', plausibleFromStart: false },
  ],
  evidence: [
    { id: 'ev-iqc-stable', source: 'panel-qc-history', sourcePanelId: 'panel-qc-history', timestamp: 0, observedValueOrFinding: 'IQC has been stable for 60 days with no rule violations.', interpretationLimits: 'Stable IQC establishes precision/stability against your OWN material — it does NOT, by itself, establish which peer group is the appropriate comparator, and cannot be used to dismiss an EQA discordance.', supportsHypothesisIds: [], weakensHypothesisIds: ['hyp-iqc-fine-dismiss'], decisive: false, relevant: true, availableOnlyAfterActionType: null },
    { id: 'ev-method-subgroup-closer', source: 'panel-eqa', sourcePanelId: 'panel-eqa', timestamp: 0, observedValueOrFinding: 'The method-specific (diazo-only) peer subgroup mean (6.6 mg/dL) is much closer to the laboratory\u2019s result (6.8) than the all-methods peer mean (5.1).', interpretationLimits: 'This is decisive evidence that the apparent discordance is explained by comparison against the wrong peer group — it does NOT establish a specific interference mechanism, a laboratory-specific problem, or that the small residual difference from the method peer group is necessarily zero.', supportsHypothesisIds: ['hyp-method-difference'], weakensHypothesisIds: ['hyp-iqc-fine-dismiss'], decisive: true, relevant: true, availableOnlyAfterActionType: null },
    { id: 'ev-no-lot-change', source: 'panel-reagent-lot', sourcePanelId: 'panel-reagent-lot', timestamp: 0, observedValueOrFinding: 'No reagent lot change in the past 30 days.', interpretationLimits: 'Rules out a recent lot-related explanation.', supportsHypothesisIds: [], weakensHypothesisIds: [], decisive: false, relevant: true, availableOnlyAfterActionType: null },
  ],
  decisionOpportunities: [
    { id: 'dec-disposition', category: 'DISPOSITION', availableFromPhase: 'EVIDENCE_SELECTION', options: [
      { id: 'opt-investigate-method-difference', label: 'Re-interpret the discordance against the method-specific peer group and document the finding', consequenceSummary: 'Correct — comparing against the method-specific peer subgroup is the appropriate way to interpret a diazo-method result, and stable IQC never dismisses the EQA discordance.', severity: 'INFORMATIONAL', outcomeAppropriate: true, actionType: 'DOCUMENT', requiredEvidenceIdsForSupportedReasoning: ['ev-method-subgroup-closer'] },
      { id: 'opt-dismiss-iqc-fine', label: 'Dismiss the EQA result because IQC has been stable', consequenceSummary: 'Incorrect and unsupported — this is precisely the forbidden inference this case family targets: IQC precision does not establish which peer group is the appropriate comparator.', severity: 'UNSUPPORTED', outcomeAppropriate: false, actionType: 'DOCUMENT', requiredEvidenceIdsForSupportedReasoning: [] },
    ]},
  ],
  verificationCriteria: { requiredEvidenceIds: ['ev-method-subgroup-closer'], minimumConfirmationDescription: 'Verification here means confirming the re-interpretation against the correct (method-specific) peer group, not a QC-recovery cycle.' },
  patientImpactCriteria: { requiredEvidenceIdsForTerminalState: ['ev-method-subgroup-closer'], minimumConfirmationDescription: 'Patient-impact assessment is not automatically inferred from subgroup closeness alone — this case does not establish a new patient-safety concern beyond existing, already-known method-group awareness.' },
  debriefEvidence: {
    commonMisconceptions: ['A stable IQC record proves the EQA result must be wrong.', 'Any EQA deviation index outside range means a real analytical problem exists.', 'Closeness to the method-specific peer mean proves a specific interference mechanism.'],
    strongPathDescription: 'You recognized that IQC precision does not establish which peer group is the appropriate comparator, and correctly re-interpreted the discordance against the method-specific peer subgroup rather than dismissing it because IQC looked fine or overclaiming a specific mechanism.',
    weakPathDescriptions: ['Dismissing the EQA discordance solely because IQC has been stable.', 'Escalating without checking whether comparison against the correct peer group explains most of the gap.'],
  },
  groundTruth: {
    observedSignal: 'EQA round: laboratory 6.8 mg/dL vs. all-methods peer group mean 5.1 mg/dL, deviation index outside the acceptable range.',
    disturbanceEstablished: false,
    disturbanceDescription: null,
    rootCauseEstablished: false,
    rootCauseDescription: null,
    signalExplanationEstablished: true,
    signalExplanationDescription: 'The apparent discordance is explained by peer-group selection: diazo methods are a known, pre-existing higher-reading group for this analyte relative to the all-methods average. Comparing against the method-specific (diazo-only) peer subgroup, the laboratory\u2019s result (6.8) is close to that subgroup\u2019s mean (6.6) — consistent with expected method-group performance. This does NOT establish a specific interference mechanism, a laboratory-specific problem, or a trueness/bias characteristic beyond the already-known method-group difference; it explains the SIGNAL (why the all-methods comparison looked discordant), not a new analytical disturbance.',
    patientImpactStatus: 'NOT_INDICATED',
    appropriateDisposition: 'DOCUMENT_PEER_GROUP_REINTERPRETATION_NO_ANALYTICAL_HOLD',
    evidenceForHypotheses: [
      { hypothesisId: 'hyp-method-difference', supports: true, weight: 'DECISIVE' },
      { hypothesisId: 'hyp-iqc-fine-dismiss', supports: false, weight: 'DECISIVE' },
    ],
  },
  provenance: {
    provenanceClass: 'V09_MODIFIED',
    scientificDependencies: ['app/eqa/calc.js'],
  },
};
