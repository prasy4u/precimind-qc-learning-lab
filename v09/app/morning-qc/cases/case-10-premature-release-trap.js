/* =========================================================================
   v09/app/morning-qc/cases/case-10-premature-release-trap.js

   Morning QC Room — Stage 12D Case 10
   PROVENANCE: V09_NEW
   Case family: P (Recovery Verification / Premature-Release Trap)

   LEARNING OBJECTIVE: an intervention that LOOKS like it should have
   fixed the problem must still be verified with QC evidence before
   resuming — "the reagent lot was reverted" is not itself verification.

   HIDDEN TRUTH: disturbanceEstablished=true, rootCauseEstablished=true
   (a reagent lot problem where the FIRST corrective attempt was
   inadequate), signalExplanationEstablished=false.
   ========================================================================= */

export const case10PrematureReleaseTrap = {
  identity: {
    id: 'case-10-premature-release-trap',
    title: 'Chloride Level 1 QC — Investigation Following a Reagent Lot Change',
    caseFamily: 'P',
    version: '1.0.0',
    difficulty: 'LEVEL_3_MULTIPLE_SIGNALS_INCOMPLETE_EVIDENCE',
    intendedLearnerLevel: ['intermediate', 'advanced'],
    competencyMapping: ['QC-05', 'QC-09'],
    curriculum: {
      estimatedMinutes: 12,
      tags: ['verification-before-release', 'premature-resume', 'failed-recovery'],
      sequencingGroup: 'investigation-verification',
      prerequisiteCompetencies: ['VERIFICATION_QUALITY'],
      competencyTargets: ['VERIFICATION_QUALITY', 'INVESTIGATION_STRATEGY'],
    },
    instructor: {
      teachingPoints: [
        'An intervention that looks like it should work is not itself verification — QC must confirm actual recovery.',
        'A failed verification attempt is not a reasoning failure; responding to it by returning to investigation (rather than resuming anyway) is the correct expert response.',
      ],
      commonFailureModes: [
        'Learner resumes service immediately after reverting the reagent lot, without checking a post-intervention QC result.',
        'Learner treats a failed verification attempt as reason to give up or resume anyway rather than investigate further.',
      ],
    },
  },
  labContext: {
    analyte: 'Chloride (synthetic educational dataset)',
    analyticalMethod: 'Indirect ISE, synthetic assay parameters',
    qcMaterials: [{ levelId: 'L1', levelName: 'Level 1', targetValue: 100, targetSD: 2 }],
    qcStrategy: '1_3s single-rule screening, QC every 2 hours',
    apsSource: 'manufacturer',
  },
  timeline: [
    { id: 'evt-1', type: 'REAGENT_LOT_CHANGE', timestamp: 0, description: 'New reagent lot #7712 brought into service.', panelId: 'panel-reagent-lot' },
    { id: 'evt-2', type: 'QC_OBSERVATION', timestamp: 30, description: 'Run 1 (new lot): 107.8 mmol/L — exceeds the 1_3s limit (100 \u00b1 6).', panelId: 'panel-qc-history' },
  ],
  panels: [
    { id: 'panel-qc-history', type: 'QC_HISTORY', availableFromPhase: 'BRIEFING', relevance: 'RELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'LIS QC log', content: { note: 'Run immediately after lot #7712 was brought into service: 107.8 mmol/L, exceeding the 1_3s limit.' } },
    { id: 'panel-reagent-lot', type: 'REAGENT_LOT', availableFromPhase: 'CHARACTERISATION', relevance: 'RELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'Reagent lot log', content: { note: 'Lot #7712 was brought into service immediately before the exceedance; the previous lot (#7698) had no history of problems.' } },
    { id: 'panel-analyzer-status', type: 'ANALYZER_STATUS', availableFromPhase: 'CHARACTERISATION', relevance: 'RELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'Analyzer maintenance system', content: { note: 'The chloride ISE electrode\u2019s reference junction is flagged as due for replacement, overdue by 3 weeks.' } },
  ],
  hypotheses: [
    { id: 'hyp-new-lot', label: 'The new reagent lot (#7712) is causing the shift.', plausibleFromStart: true },
    { id: 'hyp-electrode', label: 'An overdue ISE reference-junction replacement is causing the shift, independent of the lot change.', plausibleFromStart: false },
  ],
  evidence: [
    { id: 'ev-lot-timing', source: 'panel-reagent-lot', sourcePanelId: 'panel-reagent-lot', timestamp: 30, observedValueOrFinding: 'Lot #7712 was brought into service immediately before the exceedance.', interpretationLimits: 'Establishes plausible timing — does not by itself confirm reverting the lot will resolve the shift.', supportsHypothesisIds: ['hyp-new-lot'], weakensHypothesisIds: [], decisive: false, relevant: true, availableOnlyAfterActionType: null },
    { id: 'ev-first-repeat-still-high', source: 'repeat QC on reverted lot', sourcePanelId: null, timestamp: 50, observedValueOrFinding: 'After reverting to the previous lot (#7698), a repeat QC still reads 106.9 mmol/L — still exceeding the limit.', interpretationLimits: 'This is the critical finding: the first corrective attempt (reverting the lot) did NOT resolve the shift, meaning the reagent lot was not the sole or correct explanation. This must not be ignored or treated as a fluke.', supportsHypothesisIds: ['hyp-electrode'], weakensHypothesisIds: ['hyp-new-lot'], decisive: true, relevant: true, availableOnlyAfterActionType: null, availableOnlyAfterDecisionOption: { decisionId: 'dec-intervention', optionId: 'opt-revert-lot' } },
    { id: 'ev-ise-electrode-flagged', source: 'panel-analyzer-status', sourcePanelId: 'panel-analyzer-status', timestamp: 55, observedValueOrFinding: 'The chloride ISE electrode\u2019s reference junction is flagged as due for replacement, overdue by 3 weeks.', interpretationLimits: 'A plausible genuine cause independent of the reagent lot, consistent with the lot revert failing to resolve the shift.', supportsHypothesisIds: ['hyp-electrode'], weakensHypothesisIds: ['hyp-new-lot'], decisive: false, relevant: true, availableOnlyAfterActionType: null },
    { id: 'ev-second-repeat-normal', source: 'repeat QC after electrode replacement', sourcePanelId: null, timestamp: 90, observedValueOrFinding: 'After replacing the overdue reference junction, repeat QC reads 100.4 mmol/L — within control.', interpretationLimits: 'Genuine verification of recovery after the SECOND, correct intervention.', supportsHypothesisIds: ['hyp-electrode'], weakensHypothesisIds: [], decisive: true, relevant: true, availableOnlyAfterActionType: null, availableOnlyAfterDecisionOption: { decisionId: 'dec-intervention', optionId: 'opt-replace-electrode' } },
  ],
  decisionOpportunities: [
    { id: 'dec-containment', category: 'CONTAINMENT', availableFromPhase: 'SIGNAL_RECOGNITION', options: [
      { id: 'opt-hold', label: 'Hold reporting pending investigation', consequenceSummary: 'Appropriate — a 1_3s violation warrants pausing.', severity: 'INFORMATIONAL', outcomeAppropriate: true, actionType: 'HOLD_RESULTS', requiredEvidenceIdsForSupportedReasoning: [] },
    ]},
    { id: 'dec-intervention', category: 'INTERVENTION', availableFromPhase: 'HYPOTHESIS_GENERATION', options: [
      { id: 'opt-revert-lot', label: 'Revert to the previous reagent lot', consequenceSummary: 'A reasonable first attempt given the timing, but verification is still required before assuming it worked.', severity: 'INFORMATIONAL', outcomeAppropriate: true, actionType: 'APPLY_INTERVENTION', requiredEvidenceIdsForSupportedReasoning: ['ev-lot-timing'] },
      { id: 'opt-replace-electrode', label: 'Replace the overdue ISE reference junction', consequenceSummary: 'Correct second intervention once the lot revert is confirmed inadequate.', severity: 'INFORMATIONAL', outcomeAppropriate: true, actionType: 'APPLY_INTERVENTION', requiredEvidenceIdsForSupportedReasoning: ['ev-ise-electrode-flagged'] },
    ]},
    { id: 'dec-disposition', category: 'DISPOSITION', availableFromPhase: 'VERIFICATION', options: [
      { id: 'opt-resume-verified', label: 'Resume only after QC confirms recovery', consequenceSummary: 'Correct — resuming was withheld until a genuine post-intervention QC result confirmed recovery.', severity: 'INFORMATIONAL', outcomeAppropriate: true, actionType: 'RESUME_SERVICE', requiredEvidenceIdsForSupportedReasoning: ['ev-second-repeat-normal'] },
      { id: 'opt-resume-after-revert-only', label: 'Resume immediately after reverting the lot, without checking QC', consequenceSummary: 'Unsafe — assumes the intervention worked without verifying, and misses that the lot revert did not actually resolve the shift.', severity: 'UNSAFE', outcomeAppropriate: false, actionType: 'RESUME_SERVICE', requiredEvidenceIdsForSupportedReasoning: [] },
    ]},
  ],
  verificationCriteria: { requiredEvidenceIds: ['ev-second-repeat-normal'], minimumConfirmationDescription: 'Verification requires a QC result AFTER the correct (second) intervention — a repeat after the first, ineffective intervention does not count.' },
  patientImpactCriteria: { requiredEvidenceIdsForTerminalState: ['ev-first-repeat-still-high'], minimumConfirmationDescription: 'Patient-impact review should bound the window from the original exceedance through the confirmed second-intervention recovery.' },
  debriefEvidence: {
    commonMisconceptions: ['Reverting the reagent lot is itself proof the problem is fixed.', 'A failed verification attempt means you should resume anyway rather than investigate further.'],
    strongPathDescription: 'You did not assume the lot revert had worked — you verified with QC, recognized the shift persisted, correctly returned to investigation, found the overdue electrode, and only resumed once QC genuinely confirmed recovery after the correct intervention.',
    weakPathDescriptions: ['Resuming service immediately after reverting the lot without a post-intervention QC check.', 'Treating a failed verification attempt as a reason to resume anyway.'],
  },
  groundTruth: {
    observedSignal: 'Chloride Level 1 QC: 107.8 mmol/L immediately after reagent lot #7712 was brought into service, exceeding the 1_3s limit (100 \u00b1 6).',
    disturbanceEstablished: true,
    disturbanceDescription: 'A genuine, sustained positive shift. The reagent lot change was coincidental, not causal — the actual cause was an overdue ISE reference junction.',
    rootCauseEstablished: true,
    rootCauseDescription: 'An overdue chloride ISE reference-junction replacement (3 weeks past due), unmasked by but not caused by the coincidental lot change.',
    signalExplanationEstablished: false,
    signalExplanationDescription: null,
    patientImpactStatus: 'NOT_INDICATED',
    appropriateDisposition: 'HOLD_INVESTIGATE_SECOND_INTERVENTION_THEN_RESUME_AFTER_VERIFIED_RECOVERY',
    evidenceForHypotheses: [
      { hypothesisId: 'hyp-new-lot', supports: false, weight: 'DECISIVE' },
      { hypothesisId: 'hyp-electrode', supports: true, weight: 'DECISIVE' },
    ],
  },
  provenance: {
    provenanceClass: 'V09_NEW',
    scientificDependencies: ['app/rules/engine.js:detect1_3s'],
  },
};
