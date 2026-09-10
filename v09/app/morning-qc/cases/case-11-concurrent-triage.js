/* =========================================================================
   v09/app/morning-qc/cases/case-11-concurrent-triage.js

   Morning QC Room — Stage 12D Case 11
   PROVENANCE: V09_NEW
   Case family: N (Multiple Concurrent Analyzer Events Requiring
   Prioritisation)

   LEARNING OBJECTIVE: practice triage under two simultaneous QC
   signals — the most visually dramatic finding is not necessarily the
   most clinically urgent one to address first.

   HIDDEN TRUTH: disturbanceEstablished=true for the TSH signal only;
   the glucose signal is a random, non-sustained excursion (family A
   pattern). rootCauseEstablished=true for TSH (calibration drift).
   ========================================================================= */

export const case11ConcurrentTriage = {
  identity: {
    id: 'case-11-concurrent-triage',
    title: 'Two Simultaneous QC Signals — Glucose and TSH',
    caseFamily: 'N',
    version: '1.0.0',
    difficulty: 'LEVEL_4_ANALYTICAL_PLUS_RISK_TRADEOFF',
    intendedLearnerLevel: ['advanced', 'expert'],
    competencyMapping: ['QC-05', 'QC-09', 'QC-10'],
    curriculum: {
      estimatedMinutes: 16,
      tags: ['triage', 'prioritization', 'salience-bias', 'multi-signal'],
      sequencingGroup: 'risk-prioritization',
      prerequisiteCompetencies: ['RISK_REASONING', 'INVESTIGATION_STRATEGY'],
    },
    instructor: {
      teachingPoints: [
        'The larger-looking deviation (glucose, far from its limit visually) is not automatically the more urgent problem — TSH\u2019s smaller-looking but sustained, high-risk-analyte shift is the genuine priority.',
        'Two concurrent signals can have entirely different underlying truths; each must be assessed on its own evidence.',
      ],
      commonFailureModes: [
        'Learner addresses the glucose signal first because it looks more dramatic on the LJ chart.',
        'Learner assumes both signals share a single common cause without checking each independently.',
      ],
    },
  },
  labContext: {
    analyte: 'Glucose and TSH (synthetic educational dataset, dual-analyte case)',
    analyticalMethod: 'Glucose: enzymatic; TSH: chemiluminescent immunoassay',
    qcMaterials: [
      { levelId: 'GLU-L2', levelName: 'Glucose Level 2', targetValue: 100, targetSD: 2 },
      { levelId: 'TSH-L2', levelName: 'TSH Level 2', targetValue: 4.0, targetSD: 0.1 },
    ],
    qcStrategy: '1_3s single-rule screening on both analytes, QC every 2 hours',
    apsSource: 'manufacturer',
  },
  timeline: [
    { id: 'evt-1', type: 'QC_OBSERVATION', timestamp: 0, description: 'Glucose run 4: 107.1 mg/dL — exceeds the 1_3s limit (100 \u00b1 6), single point.', panelId: 'panel-qc-history' },
    { id: 'evt-2', type: 'QC_OBSERVATION', timestamp: 0, description: 'TSH run 4: 4.28 \u00b5IU/mL — exceeds the 1_3s limit (4.0 \u00b1 0.3), and runs 2-4 show a sustained upward trend.', panelId: 'panel-qc-history-tsh' },
  ],
  panels: [
    { id: 'panel-qc-history', type: 'QC_HISTORY', availableFromPhase: 'BRIEFING', relevance: 'RELEVANT', costTimeMinutes: 2, mayBeMisleading: true, provenance: 'LIS QC log (glucose)', content: { note: 'Glucose runs 1-3: 99.8, 100.4, 100.1 mg/dL, all in control. Run 4: 107.1 mg/dL, a single isolated exceedance.', learnerNote: 'Glucose runs 1-3 are all in control; run 4 is a single isolated exceedance with no preceding trend.' } },
    { id: 'panel-qc-history-tsh', type: 'QC_HISTORY', availableFromPhase: 'BRIEFING', relevance: 'RELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'LIS QC log (TSH)', content: { note: 'TSH runs 1-4: 4.02, 4.11, 4.19, 4.28 \u00b5IU/mL — a small but consistent, sustained upward trend, with run 4 exceeding the 1_3s limit.' } },
    { id: 'panel-calibration', type: 'CALIBRATION', availableFromPhase: 'CHARACTERISATION', relevance: 'RELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'Calibration log (TSH)', content: { note: 'The TSH assay is 11 days past its manufacturer-recommended calibration interval; glucose was calibrated on schedule.' } },
    { id: 'panel-glucose-repeat', type: 'QC_HISTORY', availableFromPhase: 'INVESTIGATION', relevance: 'RELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'Repeat QC (glucose)', content: { note: 'Repeat glucose QC: 99.9 mg/dL — within control.' } },
  ],
  hypotheses: [
    { id: 'hyp-tsh-cal-drift', label: 'The TSH sustained trend reflects genuine calibration drift, requiring priority attention.', plausibleFromStart: true },
    { id: 'hyp-glucose-random', label: 'The glucose exceedance is a single random point, not a sustained problem.', plausibleFromStart: true },
    { id: 'hyp-common-cause', label: 'Both signals share a single common cause.', plausibleFromStart: false },
  ],
  evidence: [
    { id: 'ev-tsh-trend', source: 'panel-qc-history-tsh', sourcePanelId: 'panel-qc-history-tsh', timestamp: 0, observedValueOrFinding: 'TSH shows a consistent, sustained upward trend across 4 runs, unlike glucose\u2019s single isolated point.', interpretationLimits: 'A sustained trend is more concerning than an isolated point, though the underlying cause still needs to be established.', supportsHypothesisIds: ['hyp-tsh-cal-drift'], weakensHypothesisIds: ['hyp-common-cause'], decisive: false, relevant: true, availableOnlyAfterActionType: null },
    { id: 'ev-tsh-cal-overdue', source: 'panel-calibration', sourcePanelId: 'panel-calibration', timestamp: 0, observedValueOrFinding: 'TSH calibration is 11 days overdue; glucose was calibrated on schedule.', interpretationLimits: 'Establishes a plausible, analyte-specific cause for TSH and confirms the two signals do NOT share a common cause.', supportsHypothesisIds: ['hyp-tsh-cal-drift'], weakensHypothesisIds: ['hyp-common-cause'], decisive: true, relevant: true, availableOnlyAfterActionType: null },
    { id: 'ev-glucose-repeat-normal', source: 'panel-glucose-repeat', sourcePanelId: 'panel-glucose-repeat', timestamp: 20, observedValueOrFinding: 'Repeat glucose QC returns to control (99.9 mg/dL).', interpretationLimits: 'Decisive against a sustained glucose problem for this straightforward case.', supportsHypothesisIds: ['hyp-glucose-random'], weakensHypothesisIds: [], decisive: true, relevant: true, availableOnlyAfterActionType: 'REPEAT_QC' },
  ],
  decisionOpportunities: [
    { id: 'dec-containment', category: 'CONTAINMENT', availableFromPhase: 'SIGNAL_RECOGNITION', options: [
      { id: 'opt-hold-both', label: 'Hold reporting for both analytes pending investigation', consequenceSummary: 'Appropriate — both signals warrant pausing before further reporting, regardless of which is ultimately more concerning.', severity: 'INFORMATIONAL', outcomeAppropriate: true, actionType: 'HOLD_RESULTS', requiredEvidenceIdsForSupportedReasoning: [] },
    ]},
    { id: 'dec-priority', category: 'INTERPRETATION', availableFromPhase: 'CHARACTERISATION', options: [
      { id: 'opt-prioritize-tsh', label: 'Prioritize investigating the TSH trend over the glucose point', consequenceSummary: 'Correct — a sustained trend in a high-clinical-stakes analyte is the more urgent signal, even though the glucose deviation looks more dramatic on a single run.', severity: 'INFORMATIONAL', outcomeAppropriate: true, actionType: 'FORM_HYPOTHESIS', requiredEvidenceIdsForSupportedReasoning: [] },
      { id: 'opt-prioritize-glucose', label: 'Prioritize investigating the glucose point because it deviates further from target', consequenceSummary: 'Reflects salience bias — the more visually dramatic single point is not automatically the more clinically urgent problem; a sustained trend in TSH is the genuine priority.', severity: 'UNSUPPORTED', outcomeAppropriate: false, actionType: 'FORM_HYPOTHESIS', requiredEvidenceIdsForSupportedReasoning: [] },
    ]},
    { id: 'dec-intervention', category: 'INTERVENTION', availableFromPhase: 'HYPOTHESIS_GENERATION', options: [
      { id: 'opt-recalibrate-tsh', label: 'Perform the overdue TSH calibration', consequenceSummary: 'Correct corrective action for the confirmed TSH calibration drift.', severity: 'INFORMATIONAL', outcomeAppropriate: true, actionType: 'APPLY_INTERVENTION', requiredEvidenceIdsForSupportedReasoning: ['ev-tsh-cal-overdue'] },
    ]},
    { id: 'dec-disposition', category: 'DISPOSITION', availableFromPhase: 'VERIFICATION', options: [
      { id: 'opt-resume-both-verified', label: 'Resume both analytes once each is independently verified', consequenceSummary: 'Correct — glucose verified via repeat, TSH verified via recalibration and recovery, each assessed independently.', severity: 'INFORMATIONAL', outcomeAppropriate: true, actionType: 'RESUME_SERVICE', requiredEvidenceIdsForSupportedReasoning: ['ev-tsh-cal-overdue', 'ev-glucose-repeat-normal'] },
    ]},
  ],
  verificationCriteria: { requiredEvidenceIds: ['ev-tsh-cal-overdue', 'ev-glucose-repeat-normal'], minimumConfirmationDescription: 'Each analyte requires its own independent verification — TSH via recalibration and recovery, glucose via a normal repeat.' },
  patientImpactCriteria: { requiredEvidenceIdsForTerminalState: ['ev-tsh-trend'], minimumConfirmationDescription: 'Patient-impact review should focus on the TSH window given its sustained, clinically higher-stakes trend.' },
  debriefEvidence: {
    commonMisconceptions: ['The analyte with the largest-looking single-run deviation is automatically the most urgent.', 'Two concurrent signals must share one common cause.'],
    strongPathDescription: 'You correctly recognized that TSH\u2019s smaller-looking but sustained trend, in a clinically higher-stakes analyte, was the genuine priority over glucose\u2019s more visually dramatic single point — and verified each analyte independently rather than assuming a shared cause.',
    weakPathDescriptions: ['Investigating glucose first because its single point deviated further from target.', 'Assuming both signals share one cause without checking each independently.'],
  },
  groundTruth: {
    observedSignal: 'Two concurrent QC signals: glucose single-run exceedance (107.1 mg/dL) and a sustained TSH upward trend culminating in an exceedance (4.28 \u00b5IU/mL).',
    disturbanceEstablished: true,
    disturbanceDescription: 'A genuine, sustained TSH calibration-drift disturbance. The glucose signal is unrelated and non-sustained.',
    rootCauseEstablished: true,
    rootCauseDescription: 'TSH calibration was 11 days overdue, causing genuine gradual drift. Glucose showed no sustained cause — a single random common-cause point.',
    signalExplanationEstablished: false,
    signalExplanationDescription: null,
    patientImpactStatus: 'NOT_INDICATED',
    appropriateDisposition: 'HOLD_BOTH_PRIORITIZE_TSH_RECALIBRATE_VERIFY_BOTH_INDEPENDENTLY_THEN_RESUME',
    evidenceForHypotheses: [
      { hypothesisId: 'hyp-tsh-cal-drift', supports: true, weight: 'DECISIVE' },
      { hypothesisId: 'hyp-glucose-random', supports: true, weight: 'DECISIVE' },
      { hypothesisId: 'hyp-common-cause', supports: false, weight: 'DECISIVE' },
    ],
  },
  provenance: {
    provenanceClass: 'V09_NEW',
    scientificDependencies: ['app/rules/engine.js:detect1_3s'],
  },
};
