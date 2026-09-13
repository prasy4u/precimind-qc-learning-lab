/* =========================================================================
   v09/app/morning-qc/cases/case-12-maintenance-coincidence.js

   Morning QC Room — Stage 12D Case 12
   PROVENANCE: V09_NEW
   Case family: D-variant (Maintenance-Associated Shift — analogous to
   family D's calibration pattern, applied to a scheduled maintenance
   event instead)

   LEARNING OBJECTIVE: a shift temporally associated with a maintenance
   event must be verified with evidence — routine maintenance
   "should" improve performance, but a root cause cannot be inferred
   merely from temporal association, and here the maintenance was
   actually adequate; the true cause is a coincidental, independent
   analyzer fault.

   HIDDEN TRUTH: disturbanceEstablished=true, rootCauseEstablished=true
   (a failing light source unrelated to the maintenance performed),
   signalExplanationEstablished=false.
   ========================================================================= */

export const case12MaintenanceCoincidence = {
  identity: {
    id: 'case-12-maintenance-coincidence',
    title: 'ALT QC — Shift Following Scheduled Preventive Maintenance',
    caseFamily: 'D',
    version: '1.0.0',
    difficulty: 'LEVEL_3_MULTIPLE_SIGNALS_INCOMPLETE_EVIDENCE',
    intendedLearnerLevel: ['advanced', 'expert'],
    competencyMapping: ['QC-04', 'QC-05', 'QC-09'],
    curriculum: {
      estimatedMinutes: 14,
      tags: ['maintenance', 'temporal-association-trap', 'coincidental-timing'],
      sequencingGroup: 'investigation-verification',
      prerequisiteCompetencies: ['INVESTIGATION_STRATEGY'],
      competencyTargets: ['INVESTIGATION_STRATEGY', 'VERIFICATION_QUALITY'],
    },
    instructor: {
      teachingPoints: [
        'A root cause cannot be inferred merely from temporal association — the maintenance record must be checked directly, not assumed adequate or inadequate from timing alone.',
        'Here the maintenance was genuinely adequate (correctly performed and documented) — the true, independent cause is a separately failing component discovered through further investigation.',
      ],
      commonFailureModes: [
        'Learner assumes the maintenance itself was inadequate without checking the maintenance record.',
        'Learner stops investigating once the maintenance record is confirmed adequate, without pursuing an independent cause.',
      ],
    },
  },
  labContext: {
    analyte: 'ALT (Alanine Aminotransferase, synthetic educational dataset)',
    analyticalMethod: 'Kinetic UV, synthetic assay parameters',
    qcMaterials: [{ levelId: 'L2', levelName: 'Level 2', targetValue: 60, targetSD: 2 }],
    qcStrategy: '1_3s single-rule screening, QC every 4 hours',
    apsSource: 'manufacturer',
  },
  timeline: [
    { id: 'evt-1', type: 'QC_OBSERVATION', timestamp: 0, description: 'Run 1: 60.2 U/L — within control.', panelId: 'panel-qc-history' },
    { id: 'evt-2', type: 'MAINTENANCE', timestamp: 60, description: 'Scheduled preventive maintenance performed (fluidics cleaning, tubing replacement).', panelId: 'panel-maintenance' },
    { id: 'evt-3', type: 'QC_OBSERVATION', timestamp: 240, description: 'Run 2 (post-maintenance): 53.8 U/L — exceeds the 1_3s lower limit.', panelId: 'panel-qc-history' },
    { id: 'evt-4', type: 'QC_OBSERVATION', timestamp: 480, description: 'Run 3: 53.5 U/L — sustained low.', panelId: 'panel-qc-history' },
  ],
  panels: [
    { id: 'panel-qc-history', type: 'QC_HISTORY', availableFromPhase: 'BRIEFING', relevance: 'RELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'LIS QC log', content: { note: 'Pre-maintenance: 60.2 U/L, in control. Post-maintenance runs 2-3: 53.8, 53.5 U/L — a sustained negative shift beginning after maintenance.' } },
    { id: 'panel-maintenance', type: 'MAINTENANCE', availableFromPhase: 'CHARACTERISATION', relevance: 'RELEVANT', costTimeMinutes: 3, mayBeMisleading: true, provenance: 'Maintenance log', content: { note: 'Scheduled fluidics cleaning and tubing replacement, performed per manufacturer protocol. All post-maintenance functional checks (flow rate, pressure) passed within specification, correctly documented and signed off.', learnerNote: 'Scheduled fluidics cleaning and tubing replacement, performed per manufacturer protocol. All post-maintenance functional checks passed within specification and were correctly documented.' } },
    { id: 'panel-analyzer-status', type: 'ANALYZER_STATUS', availableFromPhase: 'HYPOTHESIS_GENERATION', relevance: 'RELEVANT', costTimeMinutes: 3, mayBeMisleading: false, provenance: 'Analyzer diagnostic log', content: { note: 'The photometric light source shows an intensity reading 18% below its established baseline, flagged by the analyzer\u2019s own diagnostic self-check as approaching end-of-life — unrelated to the fluidics maintenance performed.' } },
    { id: 'panel-reagent-lot', type: 'REAGENT_LOT', availableFromPhase: 'CHARACTERISATION', relevance: 'IRRELEVANT', costTimeMinutes: 2, mayBeMisleading: true, provenance: 'Reagent lot log', content: { note: 'No reagent lot change has occurred in the past 30 days.', learnerNote: 'No reagent lot change has occurred in the past 30 days.' } },
  ],
  hypotheses: [
    { id: 'hyp-maintenance-inadequate', label: 'The maintenance itself was performed inadequately.', plausibleFromStart: true },
    { id: 'hyp-light-source', label: 'A separately failing photometric light source, coincidental with the maintenance timing.', plausibleFromStart: false },
  ],
  evidence: [
    { id: 'ev-shift-timing', source: 'panel-qc-history', sourcePanelId: 'panel-qc-history', timestamp: 480, observedValueOrFinding: 'The shift begins immediately after maintenance, with no gradual drift beforehand.', interpretationLimits: 'Timing alone establishes temporal association only, not causation — the maintenance record itself must be checked before concluding it was the cause.', supportsHypothesisIds: ['hyp-maintenance-inadequate'], weakensHypothesisIds: [], decisive: false, relevant: true, availableOnlyAfterActionType: null },
    { id: 'ev-maintenance-adequate', source: 'panel-maintenance', sourcePanelId: 'panel-maintenance', timestamp: 480, observedValueOrFinding: 'All post-maintenance functional checks passed within specification, correctly documented.', interpretationLimits: 'Decisive evidence AGAINST the maintenance itself being the cause — but this means the true cause must be sought elsewhere, not that nothing further needs investigation.', supportsHypothesisIds: [], weakensHypothesisIds: ['hyp-maintenance-inadequate'], decisive: true, relevant: true, availableOnlyAfterActionType: null },
    { id: 'ev-light-source-flagged', source: 'panel-analyzer-status', sourcePanelId: 'panel-analyzer-status', timestamp: 480, observedValueOrFinding: 'The photometric light source reads 18% below baseline, flagged as approaching end-of-life, unrelated to the maintenance performed.', interpretationLimits: 'Establishes the genuine, independent cause — a separately failing component whose timing coincidentally overlapped with the maintenance.', supportsHypothesisIds: ['hyp-light-source'], weakensHypothesisIds: ['hyp-maintenance-inadequate'], decisive: true, relevant: true, availableOnlyAfterActionType: null },
    { id: 'ev-post-replacement-recovery', source: 'repeat QC after light source replacement', sourcePanelId: null, timestamp: 520, observedValueOrFinding: 'After replacing the light source, repeat QC reads 60.0 U/L — within control.', interpretationLimits: 'Genuine verification of recovery after the correct intervention.', supportsHypothesisIds: ['hyp-light-source'], weakensHypothesisIds: [], decisive: true, relevant: true, availableOnlyAfterActionType: null, availableOnlyAfterDecisionOption: { decisionId: 'dec-intervention', optionId: 'opt-replace-light-source' } },
  ],
  decisionOpportunities: [
    { id: 'dec-containment', category: 'CONTAINMENT', availableFromPhase: 'SIGNAL_RECOGNITION', options: [
      { id: 'opt-hold', label: 'Hold reporting pending investigation of the post-maintenance shift', consequenceSummary: 'Appropriate — a sustained shift after maintenance warrants pausing before further reporting.', severity: 'INFORMATIONAL', outcomeAppropriate: true, actionType: 'HOLD_RESULTS', requiredEvidenceIdsForSupportedReasoning: [] },
    ]},
    { id: 'dec-intervention', category: 'INTERVENTION', availableFromPhase: 'HYPOTHESIS_GENERATION', options: [
      { id: 'opt-replace-light-source', label: 'Replace the flagged photometric light source', consequenceSummary: 'Correct corrective action for the confirmed, independent root cause.', severity: 'INFORMATIONAL', outcomeAppropriate: true, actionType: 'APPLY_INTERVENTION', requiredEvidenceIdsForSupportedReasoning: ['ev-light-source-flagged'] },
      { id: 'opt-redo-maintenance', label: 'Redo the fluidics maintenance', consequenceSummary: 'Unsupported — the maintenance record already confirms the original maintenance was adequate; redoing it does not address the actual, independent cause.', severity: 'UNSUPPORTED', outcomeAppropriate: false, actionType: 'APPLY_INTERVENTION', requiredEvidenceIdsForSupportedReasoning: [] },
    ]},
    { id: 'dec-disposition', category: 'DISPOSITION', availableFromPhase: 'VERIFICATION', options: [
      { id: 'opt-resume-verified', label: 'Resume after verified light-source replacement and QC recovery', consequenceSummary: 'Correct — did not stop at "maintenance was adequate" but continued to the genuine independent cause, then verified recovery.', severity: 'INFORMATIONAL', outcomeAppropriate: true, actionType: 'RESUME_SERVICE', requiredEvidenceIdsForSupportedReasoning: ['ev-post-replacement-recovery'] },
      { id: 'opt-resume-maintenance-fine', label: 'Resume because the maintenance record checked out fine', consequenceSummary: 'Unsafe — confirming the maintenance was adequate does not mean the shift is resolved; the actual cause was never addressed.', severity: 'UNSAFE', outcomeAppropriate: false, actionType: 'RESUME_SERVICE', requiredEvidenceIdsForSupportedReasoning: [] },
    ]},
  ],
  verificationCriteria: { requiredEvidenceIds: ['ev-post-replacement-recovery'], minimumConfirmationDescription: 'Verification requires QC recovery AFTER the light source replacement — confirming the maintenance record was adequate is not itself verification.' },
  patientImpactCriteria: { requiredEvidenceIdsForTerminalState: ['ev-shift-timing'], minimumConfirmationDescription: 'Patient-impact review should bound the window from the original post-maintenance shift through the verified light-source-replacement recovery.' },
  debriefEvidence: {
    commonMisconceptions: ['A shift after maintenance means the maintenance was performed badly.', 'Once the maintenance record checks out fine, the investigation is over.'],
    strongPathDescription: 'You did not assume the maintenance itself was the cause merely from timing — you checked the maintenance record, confirmed it was adequate, and continued investigating to find the genuinely independent, coincidental cause before verifying recovery.',
    weakPathDescriptions: ['Concluding the maintenance was inadequate without checking the maintenance record.', 'Stopping the investigation once the maintenance record checked out fine, without finding the actual cause.'],
  },
  groundTruth: {
    observedSignal: 'ALT Level 2 QC: 60.2 U/L pre-maintenance (in control), 53.8 and 53.5 U/L post-maintenance (sustained 1_3s exceedance).',
    disturbanceEstablished: true,
    disturbanceDescription: 'A genuine, sustained negative analytical shift caused by a failing photometric light source, coincidentally overlapping with scheduled maintenance.',
    rootCauseEstablished: true,
    rootCauseDescription: 'The photometric light source was approaching end-of-life (18% below baseline intensity), unrelated to the fluidics maintenance performed at the same time.',
    signalExplanationEstablished: false,
    signalExplanationDescription: null,
    patientImpactStatus: 'NOT_INDICATED',
    appropriateDisposition: 'HOLD_INVESTIGATE_PAST_MAINTENANCE_REPLACE_LIGHT_SOURCE_THEN_RESUME_AFTER_VERIFIED_RECOVERY',
    evidenceForHypotheses: [
      { hypothesisId: 'hyp-maintenance-inadequate', supports: false, weight: 'DECISIVE' },
      { hypothesisId: 'hyp-light-source', supports: true, weight: 'DECISIVE' },
    ],
  },
  provenance: {
    provenanceClass: 'V09_NEW',
    scientificDependencies: ['app/rules/engine.js:detect1_3s'],
  },
};
