/* =========================================================================
   v09/app/morning-qc/cases/case-06-calibration-shift.js

   Morning QC Room — Stage 12D Case 6
   PROVENANCE: V09_NEW
   Case family: D (Calibration-Associated Shift)

   LEARNING OBJECTIVE: a shift temporally associated with a calibration
   event must be verified with evidence, not assumed adequate merely
   because calibration "should" have improved performance.

   HIDDEN TRUTH: disturbanceEstablished=true, rootCauseEstablished=true
   (a failed/inadequate calibration), signalExplanationEstablished=false.
   ========================================================================= */

export const case06CalibrationShift = {
  identity: {
    id: 'case-06-calibration-shift',
    title: 'Creatinine Level 2 QC — Shift Following Scheduled Calibration',
    caseFamily: 'D',
    version: '1.0.0',
    difficulty: 'LEVEL_2_COMPETING_EXPLANATION',
    intendedLearnerLevel: ['intermediate', 'advanced'],
    competencyMapping: ['QC-04', 'QC-05', 'QC-09'],
    curriculum: {
      estimatedMinutes: 12,
      tags: ['calibration', 'verification-after-intervention', 'temporal-association-trap'],
      sequencingGroup: 'investigation-verification',
      prerequisiteCompetencies: ['INVESTIGATION_STRATEGY'],
    },
    instructor: {
      teachingPoints: [
        'A calibration event does not automatically mean the system is now correct — it must be verified with QC evidence.',
        'Temporal association (calibration happened, then a shift appeared) is not proof the calibration caused or fixed anything.',
      ],
      commonFailureModes: [
        'Learner assumes recalibrating the same day resolves the shift without checking recovery evidence.',
        'Learner blames the reagent lot instead of checking whether the calibration itself was inadequate.',
      ],
    },
  },
  labContext: {
    analyte: 'Creatinine (synthetic educational dataset)',
    analyticalMethod: 'Enzymatic, synthetic assay parameters',
    qcMaterials: [{ levelId: 'L2', levelName: 'Level 2', targetValue: 2.0, targetSD: 0.06 }],
    qcStrategy: '1_3s/2_2s multirule, QC every 4 hours',
    apsSource: 'manufacturer',
  },
  timeline: [
    { id: 'evt-1', type: 'QC_OBSERVATION', timestamp: 0, description: 'Run 1: 2.01 mg/dL — within control.', panelId: 'panel-qc-history' },
    { id: 'evt-2', type: 'CALIBRATION', timestamp: 60, description: 'Scheduled 2-point calibration performed.', panelId: 'panel-calibration' },
    { id: 'evt-3', type: 'QC_OBSERVATION', timestamp: 240, description: 'Run 2 (post-calibration): 2.19 mg/dL — exceeds the 1_3s limit.', panelId: 'panel-qc-history' },
    { id: 'evt-4', type: 'QC_OBSERVATION', timestamp: 480, description: 'Run 3: 2.21 mg/dL — sustained elevation.', panelId: 'panel-qc-history' },
  ],
  panels: [
    { id: 'panel-qc-history', type: 'QC_HISTORY', availableFromPhase: 'BRIEFING', relevance: 'RELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'LIS QC log', content: { note: 'Pre-calibration: 2.01 mg/dL, in control. Post-calibration runs 2-3: 2.19, 2.21 mg/dL — a sustained positive shift beginning immediately after calibration.' } },
    { id: 'panel-lj-chart', type: 'LJ_CHART', availableFromPhase: 'CHARACTERISATION', relevance: 'RELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'LJ chart export', content: { note: 'A clear step-shift is visible immediately after the calibration timestamp, with no gradual drift beforehand.' } },
    { id: 'panel-calibration', type: 'CALIBRATION', availableFromPhase: 'CHARACTERISATION', relevance: 'RELEVANT', costTimeMinutes: 3, mayBeMisleading: true, provenance: 'Calibration log', content: { note: 'A 2-point calibration was performed at t=60. The calibration report shows the low calibrator recovered acceptably; the high calibrator recovery was outside the manufacturer\u2019s acceptance range but the software accepted the calibration without an operator override flag.', learnerNote: 'A 2-point calibration was performed at t=60. The high calibrator\u2019s recovery was outside the manufacturer\u2019s acceptance range, though the software accepted the calibration.' } },
    { id: 'panel-reagent-lot', type: 'REAGENT_LOT', availableFromPhase: 'CHARACTERISATION', relevance: 'IRRELEVANT', costTimeMinutes: 2, mayBeMisleading: true, provenance: 'Reagent lot log', content: { note: 'No reagent lot change has occurred in the past 30 days.', learnerNote: 'No reagent lot change has occurred in the past 30 days.' } },
  ],
  hypotheses: [
    { id: 'hyp-bad-calibration', label: 'The calibration itself was inadequate (high calibrator recovery out of range).', plausibleFromStart: true },
    { id: 'hyp-cal-fixed-it', label: 'The calibration was performed, so the system must now be correct.', plausibleFromStart: false },
    { id: 'hyp-lot', label: 'A reagent lot change caused the shift.', plausibleFromStart: false },
  ],
  evidence: [
    { id: 'ev-shift-timing', source: 'panel-qc-history', sourcePanelId: 'panel-qc-history', timestamp: 480, observedValueOrFinding: 'The shift begins immediately after calibration, with no gradual drift beforehand.', interpretationLimits: 'Timing alone establishes temporal association, not causation — the calibration record itself must be checked.', supportsHypothesisIds: ['hyp-bad-calibration'], weakensHypothesisIds: ['hyp-lot'], decisive: false, relevant: true, availableOnlyAfterActionType: null },
    { id: 'ev-cal-high-recovery-out', source: 'panel-calibration', sourcePanelId: 'panel-calibration', timestamp: 480, observedValueOrFinding: 'The high calibrator\u2019s recovery was outside the manufacturer\u2019s acceptance range, though the software accepted the calibration.', interpretationLimits: 'A genuinely inadequate calibration, evidenced directly from the calibration record itself — decisive against assuming the calibration was adequate merely because it was performed.', supportsHypothesisIds: ['hyp-bad-calibration'], weakensHypothesisIds: ['hyp-cal-fixed-it'], decisive: true, relevant: true, availableOnlyAfterActionType: null },
    { id: 'ev-no-lot-change', source: 'panel-reagent-lot', sourcePanelId: 'panel-reagent-lot', timestamp: 480, observedValueOrFinding: 'No reagent lot change in the past 30 days.', interpretationLimits: 'Rules out a lot-related explanation.', supportsHypothesisIds: [], weakensHypothesisIds: ['hyp-lot'], decisive: false, relevant: true, availableOnlyAfterActionType: null },
    { id: 'ev-recalibration-verified', source: 'repeat calibration + QC', sourcePanelId: null, timestamp: 500, observedValueOrFinding: 'A repeat calibration with acceptable recovery on both calibrators, followed by QC at 2.02 mg/dL, confirms recovery.', interpretationLimits: 'This is the genuine verification step — repeating QC after a repeat, acceptable calibration.', supportsHypothesisIds: ['hyp-bad-calibration'], weakensHypothesisIds: ['hyp-cal-fixed-it'], decisive: true, relevant: true, availableOnlyAfterActionType: 'APPLY_INTERVENTION' },
  ],
  decisionOpportunities: [
    { id: 'dec-containment', category: 'CONTAINMENT', availableFromPhase: 'SIGNAL_RECOGNITION', options: [
      { id: 'opt-hold', label: 'Hold reporting pending investigation of the post-calibration shift', consequenceSummary: 'Appropriate — a sustained shift after calibration warrants pausing before further reporting.', severity: 'INFORMATIONAL', outcomeAppropriate: true, actionType: 'HOLD_RESULTS', requiredEvidenceIdsForSupportedReasoning: [] },
      { id: 'opt-continue-cal-fixed', label: 'Continue analysis because calibration was just performed', consequenceSummary: 'Unsafe — assuming a recent calibration means the system is correct, without verifying the calibration record itself.', severity: 'UNSAFE', outcomeAppropriate: false, actionType: 'CONTINUE_ANALYSIS', requiredEvidenceIdsForSupportedReasoning: [] },
    ]},
    { id: 'dec-intervention', category: 'INTERVENTION', availableFromPhase: 'HYPOTHESIS_GENERATION', options: [
      { id: 'opt-recalibrate', label: 'Repeat the calibration with an acceptable high-calibrator recovery', consequenceSummary: 'Correct corrective action once the original calibration is confirmed inadequate.', severity: 'INFORMATIONAL', outcomeAppropriate: true, actionType: 'APPLY_INTERVENTION', requiredEvidenceIdsForSupportedReasoning: ['ev-cal-high-recovery-out'] },
    ]},
  ],
  verificationCriteria: { requiredEvidenceIds: ['ev-recalibration-verified'], minimumConfirmationDescription: 'Verification requires a repeat, acceptable calibration AND a subsequent normal QC result — a repeat calibration alone is not sufficient.' },
  patientImpactCriteria: { requiredEvidenceIdsForTerminalState: ['ev-shift-timing'], minimumConfirmationDescription: 'Patient-impact review should bound the window from the original inadequate calibration to the verified recovery.' },
  debriefEvidence: {
    commonMisconceptions: ['A calibration was performed, therefore the analyzer is now correct.', 'The shift must be a reagent lot problem since calibration "should" have fixed things.'],
    strongPathDescription: 'You did not assume the calibration was adequate merely because it occurred — you checked the calibration record itself, found the high-calibrator recovery out of range, and required a genuine repeat calibration plus QC verification before resuming.',
    weakPathDescriptions: ['Resuming service on the assumption that calibration automatically means correctness.', 'Blaming the reagent lot without checking whether a lot change occurred.'],
  },
  groundTruth: {
    observedSignal: 'Creatinine Level 2 QC: 2.01 mg/dL pre-calibration (in control), 2.19 and 2.21 mg/dL post-calibration (sustained 1_3s exceedance).',
    disturbanceEstablished: true,
    disturbanceDescription: 'A genuine, sustained positive analytical shift caused by an inadequate calibration.',
    rootCauseEstablished: true,
    rootCauseDescription: 'The scheduled calibration\u2019s high-calibrator recovery was outside the manufacturer\u2019s acceptance range; the software accepted the calibration without flagging this for operator review.',
    signalExplanationEstablished: false,
    signalExplanationDescription: null,
    patientImpactStatus: 'NOT_INDICATED',
    appropriateDisposition: 'HOLD_THEN_RESUME_AFTER_VERIFIED_RECALIBRATION_AND_QC_RECOVERY',
    evidenceForHypotheses: [
      { hypothesisId: 'hyp-bad-calibration', supports: true, weight: 'DECISIVE' },
      { hypothesisId: 'hyp-cal-fixed-it', supports: false, weight: 'DECISIVE' },
      { hypothesisId: 'hyp-lot', supports: false, weight: 'SUPPORTIVE' },
    ],
  },
  provenance: {
    provenanceClass: 'V09_NEW',
    scientificDependencies: ['app/rules/engine.js:detect1_3s'],
  },
};
