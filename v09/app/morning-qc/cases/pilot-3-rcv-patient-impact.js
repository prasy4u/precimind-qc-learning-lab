/* =========================================================================
   v09/app/morning-qc/cases/pilot-3-rcv-patient-impact.js

   Morning QC Room — Stage 12A Pilot Case 3
   PROVENANCE: V09_NEW
   Case family: M (Biological Variation / Serial-Result Interpretation
   Embedded in QC Review), integrating IQC + EQA context.

   Revised during the Stage 12A independent-audit corrective closure:
   the case previously over-interpreted RCV exceedance as establishing
   "a genuine biological/clinical change." Corrected so RCV establishes
   ONLY the defensible statistical inference (the change exceeds expected
   combined analytical + within-subject biological variation under the
   case's stated assumptions) — it does NOT establish a diagnosis, a
   specific biological cause, or rule out a specimen-specific/
   preanalytical explanation. A specimen-handling evidence item was added
   so the case does not falsely eliminate every alternative through
   IQC/EQA alone.

   The RCV value (17.53%) and the observed relative difference (21.43%)
   were computed directly via v09/app/bv/calc.js:calculateClassicalRcv
   during case authoring (see V09_STAGE12A_REPORT.md) — not invented.
   ========================================================================= */

export const pilot3RcvPatientImpact = {
  identity: {
    id: 'pilot-3-rcv-patient-impact',
    title: 'Serial Patient Result Change — RCV-Based Statistical Interpretation with Clean IQC/EQA Context',
    caseFamily: 'M',
    version: '1.1.0',
    difficulty: 'LEVEL_3_MULTIPLE_SIGNALS_INCOMPLETE_EVIDENCE',
    intendedLearnerLevel: ['advanced', 'expert'],
    competencyMapping: ['QC-05', 'QC-06', 'QC-11'],
  },
  labContext: {
    analyte: 'Potassium (synthetic educational dataset)',
    analyticalMethod: 'Ion-selective electrode, synthetic assay parameters',
    qcMaterials: [{ levelId: 'L1', levelName: 'Level 1', targetValue: 4.0, targetSD: 0.08 }],
    qcStrategy: 'Conventional 1_3s IQC every 4 hours',
    apsSource: 'biological-variation-derived (synthetic CVA=2%, CVI=6%)',
  },
  timeline: [
    { id: 'evt-1', type: 'QC_OBSERVATION', timestamp: 0, description: 'IQC within control throughout the shift.', panelId: 'panel-qc-history' },
    { id: 'evt-2', type: 'EQA_INFORMATION', timestamp: 60, description: 'Most recent EQA round for this analyte: passed, within acceptable performance criteria.', panelId: 'panel-eqa' },
    { id: 'evt-3', type: 'PATIENT_RESULT_SIGNAL', timestamp: 120, description: 'Patient baseline potassium result: 4.2 mmol/L.', panelId: 'panel-patient-distribution' },
    { id: 'evt-4', type: 'PATIENT_RESULT_SIGNAL', timestamp: 480, description: 'Same patient, repeat sample: 5.1 mmol/L. Clinician queries whether this reflects an analytical problem.', panelId: 'panel-patient-distribution' },
    { id: 'evt-5', type: 'OPERATOR_ACTION', timestamp: 500, description: 'Specimen collection/handling record reviewed for the repeat sample.', panelId: 'panel-specimen-context' },
  ],
  panels: [
    { id: 'panel-qc-history', type: 'QC_HISTORY', availableFromPhase: 'BRIEFING', relevance: 'RELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'LIS QC log', content: { note: 'IQC remains within control across the entire relevant window, both before and after the repeat sample.' } },
    { id: 'panel-eqa', type: 'EQA', availableFromPhase: 'CHARACTERISATION', relevance: 'RELEVANT', costTimeMinutes: 3, mayBeMisleading: true, provenance: 'EQA scheme report', content: { note: 'Most recent round passed. IMPORTANT INTERPRETATION LIMIT: a passing EQA round establishes broad method performance at the time of that round — it does NOT, by itself, prove no analytical issue exists on this specific specimen/day.' } },
    { id: 'panel-patient-distribution', type: 'PATIENT_RESULT_DISTRIBUTION', availableFromPhase: 'SCAN', relevance: 'RELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'LIS patient result history', content: { note: 'Baseline 4.2 mmol/L at t=120; repeat 5.1 mmol/L at t=480. Relative difference = +21.43%.' } },
    { id: 'panel-specimen-context', type: 'PATIENT_RISK_CONTEXT', availableFromPhase: 'CHARACTERISATION', relevance: 'RELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'Specimen collection/handling log', content: { note: 'No documented preanalytical error (hemolysis, clotting, wrong tube, delayed processing) is noted for the repeat specimen. IMPORTANT LIMIT: absence of a DOCUMENTED issue does not exhaustively rule out an undocumented specimen-specific factor — this evidence is supportive, not decisive, on the preanalytical question.' } },
    { id: 'panel-analyzer-status', type: 'ANALYZER_STATUS', availableFromPhase: 'SCAN', relevance: 'IRRELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'Analyzer self-diagnostic log', content: { note: 'No fault codes.' } },
    { id: 'panel-calibration', type: 'CALIBRATION', availableFromPhase: 'CHARACTERISATION', relevance: 'IRRELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'Calibration log', content: { note: 'No calibration events in the relevant window.' } },
  ],
  hypotheses: [
    { id: 'hyp-analytical-error', label: 'An analytical error caused the result change.', plausibleFromStart: true },
    { id: 'hyp-statistically-significant-change', label: 'The change exceeds the RCV threshold under the case\'s stated CVA/CVI assumptions — a statistical finding, not a claim of specific biological etiology.', plausibleFromStart: false },
    { id: 'hyp-preanalytical-factor', label: 'A specimen-specific/preanalytical factor could explain some or all of the change.', plausibleFromStart: false },
  ],
  evidence: [
    { id: 'ev-iqc-clean', source: 'panel-qc-history', sourcePanelId: 'panel-qc-history', timestamp: 480, observedValueOrFinding: 'IQC within control across the entire window.', interpretationLimits: 'Stable IQC does not prove trueness for this specific specimen, but it is evidence against a general, laboratory-wide analytical shift.', supportsHypothesisIds: ['hyp-statistically-significant-change'], weakensHypothesisIds: ['hyp-analytical-error'], decisive: false, relevant: true, availableOnlyAfterActionType: null },
    { id: 'ev-eqa-pass', source: 'panel-eqa', sourcePanelId: 'panel-eqa', timestamp: 60, observedValueOrFinding: 'Most recent EQA round passed.', interpretationLimits: 'A passing EQA round does not automatically establish patient-specific trueness for this specimen — it is supportive, non-decisive context, not proof.', supportsHypothesisIds: ['hyp-statistically-significant-change'], weakensHypothesisIds: ['hyp-analytical-error'], decisive: false, relevant: true, availableOnlyAfterActionType: null },
    { id: 'ev-specimen-handling', source: 'panel-specimen-context', sourcePanelId: 'panel-specimen-context', timestamp: 500, observedValueOrFinding: 'No documented preanalytical error for the repeat specimen.', interpretationLimits: 'Absence of a DOCUMENTED issue does not exhaustively exclude an undocumented specimen-specific factor — this weakens, but does not eliminate, the preanalytical hypothesis.', supportsHypothesisIds: [], weakensHypothesisIds: ['hyp-preanalytical-factor'], decisive: false, relevant: true, availableOnlyAfterActionType: null },
    { id: 'ev-rcv-calculation', source: 'RCV calculation (CVA=2%, CVI=6%, bidirectional-95% convention)', sourcePanelId: null, timestamp: 480, observedValueOrFinding: 'RCV = 17.53%. Observed relative difference = 21.43%, which EXCEEDS the RCV threshold.', interpretationLimits: 'RCV exceedance is a STATISTICAL finding only: the change is unlikely to be explained by combined analytical + within-subject biological variation alone, under the case\'s stated CVA/CVI assumptions. It does NOT by itself establish a diagnosis, a specific biological cause, or exclude a specimen-specific/preanalytical explanation, and it is not a diagnostic cutoff.', supportsHypothesisIds: ['hyp-statistically-significant-change'], weakensHypothesisIds: [], decisive: true, relevant: true, availableOnlyAfterActionType: null },
  ],
  groundTruth: {
    observedSignal: 'Serial patient potassium result change from 4.2 to 5.1 mmol/L (+21.43%).',
    disturbanceEstablished: false,
    disturbanceDescription: null,
    rootCauseEstablished: false,
    rootCauseDescription: null,
    signalExplanationEstablished: true,
    signalExplanationDescription: 'The serial change exceeds the RCV threshold (21.43% > 17.53%) under the case\'s stated CVA=2%/CVI=6% assumptions — a defensible statistical finding that the change is unlikely to reflect combined analytical + within-subject biological variation alone. This does NOT establish a specific biological cause, a diagnosis, or exclude a specimen-specific/preanalytical explanation — clinical and specimen/preanalytical correlation remains appropriate and is intentionally left unresolved by this case\'s evidence.',
    patientImpactStatus: 'NOT_INDICATED',
    appropriateDisposition: 'NO_ANALYTICAL_HOLD_DOCUMENT_RCV_BASED_STATISTICAL_FINDING',
    evidenceForHypotheses: [
      { hypothesisId: 'hyp-statistically-significant-change', supports: true, weight: 'DECISIVE' },
      { hypothesisId: 'hyp-analytical-error', supports: false, weight: 'SUPPORTIVE' },
      { hypothesisId: 'hyp-preanalytical-factor', supports: false, weight: 'WEAK' },
    ],
  },
  decisionOpportunities: [
    { id: 'dec-interpretation', category: 'INTERPRETATION', availableFromPhase: 'SIGNAL_RECOGNITION', options: [
      { id: 'opt-apply-rcv', label: 'Apply RCV to assess statistical significance, without over-claiming biological certainty', consequenceSummary: 'Correct method for this question.', severity: 'INFORMATIONAL', outcomeAppropriate: true, actionType: 'FORM_HYPOTHESIS' },
      { id: 'opt-assume-error', label: 'Assume an analytical error without checking IQC/EQA/RCV', consequenceSummary: 'Applies the forbidden inference for this case family.', severity: 'UNSUPPORTED', outcomeAppropriate: false, actionType: 'FORM_HYPOTHESIS' },
    ]},
    { id: 'dec-disposition', category: 'DISPOSITION', availableFromPhase: 'SIGNAL_RECOGNITION', options: [
      { id: 'opt-no-hold-document', label: 'No analytical hold; document the RCV-based statistical finding, with correct interpretation limits, for the clinical team', consequenceSummary: 'Matches ground truth.', severity: 'INFORMATIONAL', outcomeAppropriate: true, actionType: 'DOCUMENT' },
      { id: 'opt-hold-analytical', label: 'Hold analytical service pending an unnecessary analytical investigation', consequenceSummary: 'IQC and EQA both support ongoing validity; an analytical hold is not evidence-supported here.', severity: 'UNSUPPORTED', outcomeAppropriate: false, actionType: 'HOLD_RESULTS' },
      { id: 'opt-overclaim-biological', label: 'Document that the change definitively reflects a genuine biological/clinical cause', consequenceSummary: 'Over-interprets RCV exceedance as proof of biological etiology — RCV is a statistical threshold, not a diagnostic or causal determination.', severity: 'UNSUPPORTED', outcomeAppropriate: false, actionType: 'DOCUMENT' },
    ]},
  ],
  verificationCriteria: {
    requiredEvidenceIds: ['ev-rcv-calculation'],
    minimumConfirmationDescription: 'The RCV calculation must be obtained and compared against the observed relative difference before concluding whether the change is statistically significant.',
  },
  patientImpactCriteria: {
    requiredEvidenceIdsForTerminalState: ['ev-rcv-calculation'],
    minimumConfirmationDescription: 'This case never requires a terminal patient-impact declaration (patientImpactStatus remains NOT_INDICATED throughout, since no analytical disturbance exists) — this field is present for schema completeness.',
  },
  debriefEvidence: {
    strongPathDescription: 'Check IQC (clean) and EQA (passed, with correctly limited interpretation) context; check the specimen-handling record (supportive, non-decisive); request the RCV calculation; correctly compare the observed 21.43% change against the 17.53% RCV threshold; conclude the change is statistically significant WITHOUT over-claiming a specific biological cause or excluding preanalytical factors; avoid triggering an unnecessary analytical hold; document the RCV-based statistical finding with its correct interpretation limits.',
    weakPathDescriptions: [
      { description: 'Assuming the large result change must reflect an analytical error.', whyWeaker: 'This is the exact forbidden inference for this family — a large change is not automatically an error; IQC and EQA both argue against it, and RCV is the correct tool to assess statistical significance.' },
      { description: 'Treating the passing EQA round as proof the specific result is correct.', whyWeaker: 'EQA passing establishes broad method performance at the time of that round, not patient-specific trueness for this specimen.' },
      { description: 'Concluding the RCV-exceeding change definitively proves a genuine biological/clinical change.', whyWeaker: 'RCV exceedance ≠ disease and does not establish etiological cause — it is a statistical threshold, not a diagnostic determination. This over-claim is exactly as unsupported as assuming analytical error, just in the opposite direction.' },
    ],
    commonMisconceptions: [
      'The result changed, therefore something is wrong with the patient or the assay.',
      'A passing EQA round proves this specific result is correct.',
      'RCV exceedance proves the change is a genuine biological/clinical change (RCV exceedance ≠ disease; it is a statistical finding, not an etiological one).',
    ],
  },
  provenance: {
    provenanceClass: 'V09_NEW',
    scientificDependencies: ['app/bv/calc.js:calculateClassicalRcv'],
  },
};
