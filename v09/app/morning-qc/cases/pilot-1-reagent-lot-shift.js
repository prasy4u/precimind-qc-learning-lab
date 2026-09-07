/* =========================================================================
   v09/app/morning-qc/cases/pilot-1-reagent-lot-shift.js

   Morning QC Room — Stage 12A Pilot Case 1
   PROVENANCE: V09_NEW
   Case family: B (Persistent Analytical Shift After Reagent Lot Change)

   A relatively straightforward but realistic systematic QC disturbance
   requiring containment, investigation, and verification (Stage 12A
   Section 26, Pilot 1 requirement). All numeric values were computed
   directly via the active v09/app/core/statistics.js functions during
   case authoring (see V09_STAGE12A_REPORT.md for the exact computation
   log) — none are invented.
   ========================================================================= */

export const pilot1ReagentLotShift = {
  identity: {
    id: 'pilot-1-reagent-lot-shift',
    title: 'Glucose Level 2 QC — Sustained Positive Shift After Reagent Lot Change',
    caseFamily: 'B',
    version: '1.0.0',
    difficulty: 'LEVEL_2_COMPETING_EXPLANATION',
    intendedLearnerLevel: ['beginner', 'intermediate', 'advanced'],
    competencyMapping: ['QC-02', 'QC-04', 'QC-07', 'QC-09'],
  },
  labContext: {
    analyte: 'Glucose (synthetic educational dataset)',
    analyticalMethod: 'Enzymatic (hexokinase), synthetic assay parameters',
    qcMaterials: [{ levelId: 'L2', levelName: 'Level 2', targetValue: 100, targetSD: 2 }],
    qcStrategy: '1_3s single-rule screening rule, QC every 2 hours',
    apsSource: 'manufacturer (synthetic TEa = 9% for this educational case)',
  },
  timeline: [
    { id: 'evt-1', type: 'QC_OBSERVATION', timestamp: 0, description: 'Run 1: 99.8 mg/dL', panelId: 'panel-qc-history' },
    { id: 'evt-2', type: 'QC_OBSERVATION', timestamp: 120, description: 'Run 2: 100.3 mg/dL', panelId: 'panel-qc-history' },
    { id: 'evt-3', type: 'QC_OBSERVATION', timestamp: 240, description: 'Run 3: 99.5 mg/dL', panelId: 'panel-qc-history' },
    { id: 'evt-4', type: 'CALIBRATION', timestamp: 300, description: 'Routine (non-corrective) scheduled calibration performed; calibration verification passed within acceptable limits.', panelId: 'panel-calibration' },
    { id: 'evt-5', type: 'QC_OBSERVATION', timestamp: 360, description: 'Run 4: 100.6 mg/dL', panelId: 'panel-qc-history' },
    { id: 'evt-6', type: 'REAGENT_LOT_CHANGE', timestamp: 420, description: 'New reagent lot (Lot #4471) placed into service.', panelId: 'panel-reagent-lot' },
    { id: 'evt-7', type: 'QC_OBSERVATION', timestamp: 480, description: 'Run 5: 99.9 mg/dL (last run on old lot, reserved stock)', panelId: 'panel-qc-history' },
    { id: 'evt-8', type: 'QC_OBSERVATION', timestamp: 600, description: 'Run 6 (new lot): 106.9 mg/dL — exceeds 1_3s limit', panelId: 'panel-qc-history' },
    { id: 'evt-9', type: 'QC_OBSERVATION', timestamp: 720, description: 'Run 7 (new lot): 107.4 mg/dL', panelId: 'panel-qc-history' },
    { id: 'evt-10', type: 'QC_OBSERVATION', timestamp: 840, description: 'Run 8 (new lot): 106.5 mg/dL', panelId: 'panel-qc-history' },
    { id: 'evt-11', type: 'QC_OBSERVATION', timestamp: 960, description: 'Run 9 (new lot): 107.8 mg/dL', panelId: 'panel-qc-history' },
    { id: 'evt-12', type: 'QC_OBSERVATION', timestamp: 1080, description: 'Run 10 (new lot): 107.1 mg/dL', panelId: 'panel-qc-history' },
    { id: 'evt-13', type: 'QC_OBSERVATION', timestamp: 1200, description: 'Run 11 (new lot): 106.7 mg/dL', panelId: 'panel-qc-history' },
  ],
  panels: [
    { id: 'panel-qc-history', type: 'QC_HISTORY', availableFromPhase: 'BRIEFING', relevance: 'RELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'LIS QC log export', content: { note: 'Pre-shift mean=100.02, SD=0.43 (n=5); post-shift mean=107.07, SD=0.48 (n=6). Post-shift signed bias vs target = +7.07%. Sigma with TEa=9%: 0.97 (very poor).' } },
    { id: 'panel-lj-chart', type: 'LJ_CHART', availableFromPhase: 'SCAN', relevance: 'RELEVANT', costTimeMinutes: 1, mayBeMisleading: false, provenance: 'Rendered from panel-qc-history data', content: { note: 'Visual sustained shift beginning at run 6, coinciding with the reagent lot change.' } },
    { id: 'panel-reagent-lot', type: 'REAGENT_LOT', availableFromPhase: 'CHARACTERISATION', relevance: 'RELEVANT', costTimeMinutes: 3, mayBeMisleading: false, provenance: 'Reagent inventory log', content: { note: 'Lot #4471 placed into service at t=420, immediately before the shift onset at run 6 (t=600).' } },
    { id: 'panel-calibration', type: 'CALIBRATION', availableFromPhase: 'CHARACTERISATION', relevance: 'CONDITIONALLY_RELEVANT', costTimeMinutes: 3, mayBeMisleading: true, provenance: 'Calibration log', content: { note: 'A routine, non-corrective calibration occurred at t=300, before the shift and before the lot change — its verification passed. Superficially "close in time" but does not itself explain a shift that only appears after the LATER lot change.' } },
    { id: 'panel-analyzer-status', type: 'ANALYZER_STATUS', availableFromPhase: 'SCAN', relevance: 'IRRELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'Analyzer self-diagnostic log', content: { note: 'No fault codes or error messages throughout the period.' } },
    { id: 'panel-maintenance', type: 'MAINTENANCE', availableFromPhase: 'CHARACTERISATION', relevance: 'IRRELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'Maintenance log', content: { note: 'No maintenance events recorded in the relevant window.' } },
  ],
  hypotheses: [
    { id: 'hyp-lot', label: 'New reagent lot #4471 introduced a positive bias.', plausibleFromStart: false },
    { id: 'hyp-calibration', label: 'The routine calibration at t=300 introduced the shift.', plausibleFromStart: false },
    { id: 'hyp-random', label: 'This is random common-cause variation, not a true disturbance.', plausibleFromStart: false },
  ],
  evidence: [
    { id: 'ev-lot-timing', source: 'panel-reagent-lot', timestamp: 420, observedValueOrFinding: 'Lot change at t=420, shift onset at t=600 (run 6).', interpretationLimits: 'Temporal association alone does not establish causation.', supportsHypothesisIds: ['hyp-lot'], weakensHypothesisIds: ['hyp-random'], decisive: false, relevant: true, availableOnlyAfterActionType: null },
    { id: 'ev-cal-timing', source: 'panel-calibration', timestamp: 300, observedValueOrFinding: 'Calibration at t=300 preceded the lot change and shift onset; verification passed.', interpretationLimits: 'A calibration performed before the shift onset and with passing verification is unlikely to be the proximate cause, but this alone does not fully rule it out.', supportsHypothesisIds: [], weakensHypothesisIds: ['hyp-calibration'], decisive: false, relevant: true, availableOnlyAfterActionType: null },
    { id: 'ev-old-lot-repeat', source: 'reserved old-lot reagent repeat test', timestamp: 660, observedValueOrFinding: 'Repeating QC using RESERVED OLD-LOT reagent (same calibration state) at t=660 produced 100.1 mg/dL — back within target range.', interpretationLimits: 'This isolates the reagent lot as the variable, since calibration state was unchanged between the failing new-lot run and this old-lot repeat.', supportsHypothesisIds: ['hyp-lot'], weakensHypothesisIds: ['hyp-calibration', 'hyp-random'], decisive: true, relevant: true, availableOnlyAfterActionType: 'REPEAT_QC' },
  ],
  groundTruth: {
    observedSignal: 'Sustained +7.07% positive shift in Level 2 QC beginning at run 6.',
    disturbanceEstablished: true,
    disturbanceDescription: 'Sustained systematic positive bias beginning precisely at the reagent lot change.',
    rootCauseEstablished: true,
    rootCauseDescription: 'Reagent lot #4471 introduced a positive analytical bias, isolated by the decisive old-lot repeat test.',
    patientImpactStatus: 'AFFECTED_RESULT_SET_IDENTIFIED',
    appropriateDisposition: 'HELD_THEN_RESUMED_AFTER_VERIFIED_LOT_CORRECTION_AND_PATIENT_IMPACT_REVIEW',
    evidenceForHypotheses: [
      { hypothesisId: 'hyp-lot', supports: true, weight: 'DECISIVE' },
      { hypothesisId: 'hyp-calibration', supports: false, weight: 'SUPPORTIVE' },
      { hypothesisId: 'hyp-random', supports: false, weight: 'DECISIVE' },
    ],
  },
  decisionOpportunities: [
    { id: 'dec-containment', category: 'CONTAINMENT', availableFromPhase: 'IMMEDIATE_CONTAINMENT', options: [
      { id: 'opt-hold', label: 'Hold results pending investigation', consequenceSummary: 'Safe; appropriate given a sustained rule violation.', severity: 'INFORMATIONAL' },
      { id: 'opt-continue', label: 'Continue analysis without holding', consequenceSummary: 'Unsafe given a sustained, uninvestigated shift.', severity: 'UNSAFE' },
    ]},
    { id: 'dec-disposition', category: 'DISPOSITION', availableFromPhase: 'RESUME_OR_HOLD', options: [
      { id: 'opt-resume-verified', label: 'Resume after verified correction and patient-impact review', consequenceSummary: 'Correct disposition.', severity: 'INFORMATIONAL' },
      { id: 'opt-resume-unverified', label: 'Resume immediately after switching lots, without re-verifying', consequenceSummary: 'Premature release risk.', severity: 'CRITICAL_UNSAFE' },
    ]},
  ],
  verificationCriteria: {
    requiredEvidenceIds: ['ev-old-lot-repeat'],
    minimumConfirmationDescription: 'At least one QC repeat using verified/corrected reagent must return within target range before service resumes.',
  },
  debriefEvidence: {
    strongPathDescription: 'Acknowledge the signal, hold results, inspect reagent-lot and calibration timing, request the decisive old-lot repeat test to isolate the cause, apply intervention (revert/replace lot), verify recovery, review patient impact for the affected window, then resume.',
    weakPathDescriptions: [
      { description: 'Assuming the calibration event was the cause because it is "closest in time to the investigation start."', whyWeaker: 'The calibration occurred BEFORE the shift onset and lot change, and its own verification passed — temporal proximity to the investigator\'s attention is not the same as temporal proximity to the actual onset.' },
      { description: 'Resuming service immediately after switching reagent lots without a verification repeat.', whyWeaker: 'Correlational reasoning ("switched lot back, should be fine") without confirmatory testing is exactly the premature-release trap this case is designed to probe.' },
    ],
    commonMisconceptions: [
      'Lot changed near the shift, therefore lot is automatically the cause (temporal correlation alone is not proof — the decisive test is what establishes it here).',
      'Calibration was performed, therefore the system is now correct (verification after any intervention is mandatory, not assumed).',
    ],
  },
  provenance: {
    provenanceClass: 'V09_NEW',
    scientificDependencies: ['app/core/statistics.js:calcMean', 'app/core/statistics.js:calcSampleSD', 'app/core/statistics.js:calcBiasPercent', 'app/core/statistics.js:calcSigma'],
  },
};
