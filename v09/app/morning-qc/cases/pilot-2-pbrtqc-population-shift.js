/* =========================================================================
   v09/app/morning-qc/cases/pilot-2-pbrtqc-population-shift.js

   Morning QC Room — Stage 12A Pilot Case 2
   PROVENANCE: V09_NEW
   Case family: K (Apparent PBRTQC Alert Caused by Population Shift)

   A misleading/discordant scenario where the obvious first explanation
   (analytical error) is NOT established, and irrelevant evidence exists
   (Stage 12A Section 26, Pilot 2 requirement).
   ========================================================================= */

export const pilot2PbrtqcPopulationShift = {
  identity: {
    id: 'pilot-2-pbrtqc-population-shift',
    title: 'PBRTQC Moving-Mean Alert — Explained by Ward Case-Mix Change, Not Analytical Error',
    caseFamily: 'K',
    version: '1.0.0',
    difficulty: 'LEVEL_3_MULTIPLE_SIGNALS_INCOMPLETE_EVIDENCE',
    intendedLearnerLevel: ['intermediate', 'advanced', 'expert'],
    competencyMapping: ['QC-08', 'QC-10', 'QC-11'],
  },
  labContext: {
    analyte: 'Troponin (synthetic educational dataset)',
    analyticalMethod: 'Immunoassay, synthetic assay parameters',
    qcMaterials: [{ levelId: 'L1', levelName: 'Level 1', targetValue: 50, targetSD: 3 }],
    qcStrategy: 'Conventional 1_3s IQC every 4 hours + continuous PBRTQC moving-mean surveillance',
    apsSource: 'manufacturer (synthetic)',
  },
  timeline: [
    { id: 'evt-1', type: 'PBRTQC_EVENT', timestamp: 0, description: 'PBRTQC moving-mean stable, no alerts, days 1-6.', panelId: 'panel-pbrtqc' },
    { id: 'evt-2', type: 'OPERATOR_ACTION', timestamp: 480, description: 'New cardiology step-down ward opens, begins sending specimens to this laboratory.', panelId: 'panel-patient-distribution' },
    { id: 'evt-3', type: 'PBRTQC_EVENT', timestamp: 600, description: 'PBRTQC moving-mean statistic begins trending upward.', panelId: 'panel-pbrtqc' },
    { id: 'evt-4', type: 'QC_OBSERVATION', timestamp: 660, description: 'Scheduled IQC run: 49.6 (within control).', panelId: 'panel-qc-history' },
    { id: 'evt-5', type: 'PBRTQC_EVENT', timestamp: 720, description: 'PBRTQC moving-mean statistic exceeds the alert threshold.', panelId: 'panel-pbrtqc' },
    { id: 'evt-6', type: 'QC_OBSERVATION', timestamp: 780, description: 'Scheduled IQC run: 50.3 (within control).', panelId: 'panel-qc-history' },
    { id: 'evt-7', type: 'CALIBRATION', timestamp: 840, description: 'No calibration event in this window (informational entry — nothing occurred).', panelId: 'panel-calibration' },
  ],
  panels: [
    { id: 'panel-pbrtqc', type: 'PBRTQC', availableFromPhase: 'BRIEFING', relevance: 'RELEVANT', costTimeMinutes: 2, mayBeMisleading: true, provenance: 'PBRTQC surveillance dashboard', content: { note: 'Moving-mean statistic trended upward starting shortly after t=480 and crossed the alert threshold at t=720. Superficially resembles an analytical shift pattern.' } },
    { id: 'panel-qc-history', type: 'QC_HISTORY', availableFromPhase: 'SCAN', relevance: 'RELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'LIS QC log', content: { note: 'All conventional IQC runs throughout the entire window remain within control limits — no rule violations at any point.' } },
    { id: 'panel-patient-distribution', type: 'PATIENT_RESULT_DISTRIBUTION', availableFromPhase: 'CHARACTERISATION', relevance: 'RELEVANT', costTimeMinutes: 4, mayBeMisleading: false, provenance: 'LIS case-mix report', content: { note: 'A new cardiology step-down ward began sending specimens at t=480, shifting the patient population toward a higher proportion of elevated-troponin specimens — coincident with the PBRTQC trend onset.' } },
    { id: 'panel-analyzer-status', type: 'ANALYZER_STATUS', availableFromPhase: 'SCAN', relevance: 'IRRELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'Analyzer self-diagnostic log', content: { note: 'No fault codes throughout.' } },
    { id: 'panel-calibration', type: 'CALIBRATION', availableFromPhase: 'CHARACTERISATION', relevance: 'IRRELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'Calibration log', content: { note: 'No calibration events in the relevant window.' } },
    { id: 'panel-maintenance', type: 'MAINTENANCE', availableFromPhase: 'CHARACTERISATION', relevance: 'IRRELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'Maintenance log', content: { note: 'No maintenance events in the relevant window.' } },
  ],
  hypotheses: [
    { id: 'hyp-analytical', label: 'An analytical shift is occurring despite passing IQC.', plausibleFromStart: true },
    { id: 'hyp-population', label: 'A patient-population case-mix change is driving the PBRTQC trend.', plausibleFromStart: false },
    { id: 'hyp-calibration', label: 'An unrecorded calibration issue is responsible.', plausibleFromStart: false },
  ],
  evidence: [
    { id: 'ev-iqc-stable', source: 'panel-qc-history', sourcePanelId: 'panel-qc-history', timestamp: 780, observedValueOrFinding: 'All IQC runs remain within control throughout the PBRTQC trend window.', interpretationLimits: 'IQC passing does not, by itself, prove no analytical issue exists — but sustained normal IQC across the whole window is meaningful, non-decisive evidence against a general analytical shift.', supportsHypothesisIds: ['hyp-population'], weakensHypothesisIds: ['hyp-analytical'], decisive: false, relevant: true, availableOnlyAfterActionType: null },
    { id: 'ev-ward-timing', source: 'panel-patient-distribution', sourcePanelId: 'panel-patient-distribution', timestamp: 480, observedValueOrFinding: 'New cardiology step-down ward begins sending specimens at t=480, ~2 hours before the PBRTQC trend begins.', interpretationLimits: 'Temporal association alone does not establish causation.', supportsHypothesisIds: ['hyp-population'], weakensHypothesisIds: [], decisive: false, relevant: true, availableOnlyAfterActionType: null },
    { id: 'ev-case-mix-decisive', source: 'stratified re-analysis of PBRTQC statistic by ward', sourcePanelId: null, timestamp: 780, observedValueOrFinding: 'Recomputing the PBRTQC moving-mean statistic EXCLUDING the new ward\'s specimens shows the statistic remains stable and does not cross the alert threshold.', interpretationLimits: 'This isolates the case-mix change as the driver of the alert, since removing only the new population removes the signal entirely.', supportsHypothesisIds: ['hyp-population'], weakensHypothesisIds: ['hyp-analytical', 'hyp-calibration'], decisive: true, relevant: true, availableOnlyAfterActionType: 'CHECK_PATIENT_DISTRIBUTION' },
  ],
  groundTruth: {
    observedSignal: 'PBRTQC moving-mean statistic crosses alert threshold at t=720.',
    disturbanceEstablished: false,
    disturbanceDescription: null,
    rootCauseEstablished: false,
    rootCauseDescription: null,
    signalExplanationEstablished: true,
    signalExplanationDescription: 'Patient population case-mix shift (new cardiology step-down ward) explains the PBRTQC trend; no analytical disturbance exists, so this is a signal explanation, not an analytical root cause.',
    patientImpactStatus: 'NOT_INDICATED',
    appropriateDisposition: 'CONTINUE_ANALYSIS_DOCUMENT_EXPLANATION',
    evidenceForHypotheses: [
      { hypothesisId: 'hyp-population', supports: true, weight: 'DECISIVE' },
      { hypothesisId: 'hyp-analytical', supports: false, weight: 'DECISIVE' },
      { hypothesisId: 'hyp-calibration', supports: false, weight: 'SUPPORTIVE' },
    ],
  },
  decisionOpportunities: [
    { id: 'dec-take-seriously', category: 'INTERPRETATION', availableFromPhase: 'SIGNAL_RECOGNITION', options: [
      { id: 'opt-investigate', label: 'Investigate the PBRTQC alert despite passing IQC', consequenceSummary: 'Correct — PBRTQC can detect signals IQC misses; dismissing it because IQC passed is the forbidden inference for this family.', severity: 'INFORMATIONAL', outcomeAppropriate: true, actionType: 'FORM_HYPOTHESIS' },
      { id: 'opt-dismiss', label: 'Dismiss the alert because IQC is passing', consequenceSummary: 'Applies the forbidden deterministic inference for this case family.', severity: 'UNSUPPORTED', outcomeAppropriate: false, actionType: 'DOCUMENT' },
    ]},
    { id: 'dec-disposition', category: 'DISPOSITION', availableFromPhase: 'EVIDENCE_SELECTION', options: [
      { id: 'opt-continue-documented', label: 'Continue analysis, document the case-mix explanation', consequenceSummary: 'Matches ground truth — no analytical disturbance was ever established.', severity: 'INFORMATIONAL', outcomeAppropriate: true, actionType: 'DOCUMENT' },
      { id: 'opt-hold-unnecessarily', label: 'Hold results indefinitely pending further analytical investigation', consequenceSummary: 'Once the decisive case-mix evidence is in hand, continued holding is unsupported by the evidence.', severity: 'UNSUPPORTED', outcomeAppropriate: false, actionType: 'HOLD_RESULTS' },
    ]},
  ],
  verificationCriteria: {
    requiredEvidenceIds: ['ev-case-mix-decisive'],
    minimumConfirmationDescription: 'The stratified re-analysis excluding the new ward\'s specimens must be obtained and show the alert resolves before concluding no analytical disturbance exists.',
  },
  patientImpactCriteria: {
    requiredEvidenceIdsForTerminalState: ['ev-case-mix-decisive'],
    minimumConfirmationDescription: 'This case never requires a terminal patient-impact declaration (patientImpactStatus remains NOT_INDICATED throughout, since no analytical disturbance exists) — this field is present for schema completeness and would gate an AFFECTED/COMPLETED declaration behind the same decisive evidence, if ever pursued.',
  },
  debriefEvidence: {
    strongPathDescription: 'Take the PBRTQC alert seriously despite passing IQC; inspect the patient-distribution panel; recognize the ward-opening timing; request the decisive stratified re-analysis; conclude population shift, not analytical error; continue analysis without unnecessary hold.',
    weakPathDescriptions: [
      { description: 'Dismissing the PBRTQC alert because IQC passed.', whyWeaker: 'This is the exact forbidden inference this case family targets — IQC and PBRTQC monitor different things and passing one does not clear the other.' },
      { description: 'Concluding population shift from timing alone, without the stratified re-analysis.', whyWeaker: 'Temporal correlation is suggestive but not decisive; the case explicitly provides a decisive test (ev-case-mix-decisive) that a thorough investigator should obtain before concluding.' },
    ],
    commonMisconceptions: [
      'IQC passed, therefore the PBRTQC alert must be a false alarm.',
      'PBRTQC alerted, therefore the analyzer has an error.',
    ],
  },
  provenance: {
    provenanceClass: 'V09_NEW',
    scientificDependencies: ['app/pbrtqc/calc.js (conceptual reference — this case narrates a PBRTQC surveillance scenario without invoking runPbrtqcStream() directly, since the case teaching point is population-shift interpretation rather than the moving-mean arithmetic itself)'],
  },
};
