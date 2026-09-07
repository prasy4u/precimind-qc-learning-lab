/* =========================================================================
   v09/app/morning-qc/cases/pilot-3-rcv-patient-impact.js

   Morning QC Room — Stage 12A Pilot Case 3
   PROVENANCE: V09_NEW
   Case family: M (Biological Variation / Serial-Result Interpretation
   Embedded in QC Review), integrating IQC + EQA context.

   A scenario integrating IQC with EQA information and requiring careful
   patient-impact reasoning (Stage 12A Section 26, Pilot 3 requirement).
   The RCV value (17.53%) and the observed relative difference (21.43%)
   were computed directly via v09/app/bv/calc.js:calculateClassicalRcv
   during case authoring (see V09_STAGE12A_REPORT.md for the exact
   computation log) — not invented.
   ========================================================================= */

export const pilot3RcvPatientImpact = {
  identity: {
    id: 'pilot-3-rcv-patient-impact',
    title: 'Serial Patient Result Change — RCV-Based Interpretation with Clean IQC/EQA Context',
    caseFamily: 'M',
    version: '1.0.0',
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
  ],
  panels: [
    { id: 'panel-qc-history', type: 'QC_HISTORY', availableFromPhase: 'BRIEFING', relevance: 'RELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'LIS QC log', content: { note: 'IQC remains within control across the entire relevant window, both before and after the repeat sample.' } },
    { id: 'panel-eqa', type: 'EQA', availableFromPhase: 'CHARACTERISATION', relevance: 'RELEVANT', costTimeMinutes: 3, mayBeMisleading: true, provenance: 'EQA scheme report', content: { note: 'Most recent round passed. IMPORTANT INTERPRETATION LIMIT: a passing EQA round establishes broad method performance at the time of that round — it does NOT, by itself, prove no analytical issue exists on this specific specimen/day (stable IQC and passing EQA together support, but do not conclusively prove, analytical validity for this specific result).' } },
    { id: 'panel-patient-distribution', type: 'PATIENT_RESULT_DISTRIBUTION', availableFromPhase: 'SCAN', relevance: 'RELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'LIS patient result history', content: { note: 'Baseline 4.2 mmol/L at t=120; repeat 5.1 mmol/L at t=480. Relative difference = +21.43%.' } },
    { id: 'panel-analyzer-status', type: 'ANALYZER_STATUS', availableFromPhase: 'SCAN', relevance: 'IRRELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'Analyzer self-diagnostic log', content: { note: 'No fault codes.' } },
    { id: 'panel-calibration', type: 'CALIBRATION', availableFromPhase: 'CHARACTERISATION', relevance: 'IRRELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'Calibration log', content: { note: 'No calibration events in the relevant window.' } },
  ],
  hypotheses: [
    { id: 'hyp-analytical-error', label: 'An analytical error caused the result change.', plausibleFromStart: true },
    { id: 'hyp-genuine-biological-change', label: 'The change reflects a genuine biological/clinical change, statistically distinguishable from combined analytical+biological noise via RCV.', plausibleFromStart: false },
    { id: 'hyp-expected-noise', label: 'The change is within expected combined analytical + within-subject biological variation (not RCV-significant).', plausibleFromStart: false },
  ],
  evidence: [
    { id: 'ev-iqc-clean', source: 'panel-qc-history', timestamp: 480, observedValueOrFinding: 'IQC within control across the entire window.', interpretationLimits: 'Stable IQC does not prove trueness for this specific specimen, but it is evidence against a general analytical shift.', supportsHypothesisIds: ['hyp-genuine-biological-change', 'hyp-expected-noise'], weakensHypothesisIds: ['hyp-analytical-error'], decisive: false, relevant: true, availableOnlyAfterActionType: null },
    { id: 'ev-eqa-pass', source: 'panel-eqa', timestamp: 60, observedValueOrFinding: 'Most recent EQA round passed.', interpretationLimits: 'A passing EQA round does not automatically establish patient-specific trueness for this specimen — it is supportive, non-decisive context, not proof.', supportsHypothesisIds: ['hyp-genuine-biological-change', 'hyp-expected-noise'], weakensHypothesisIds: ['hyp-analytical-error'], decisive: false, relevant: true, availableOnlyAfterActionType: null },
    { id: 'ev-rcv-calculation', source: 'RCV calculation (CVA=2%, CVI=6%, bidirectional-95% convention)', timestamp: 480, observedValueOrFinding: 'RCV = 17.53%. Observed relative difference = 21.43%, which EXCEEDS the RCV threshold.', interpretationLimits: 'RCV exceedance indicates the change is statistically unlikely to be explained by combined analytical + within-subject biological variation alone — it identifies a likely genuine change, but RCV is a statistical threshold, not a diagnostic cutoff, and does not by itself establish clinical importance or an analytical problem.', supportsHypothesisIds: ['hyp-genuine-biological-change'], weakensHypothesisIds: ['hyp-expected-noise'], decisive: true, relevant: true, availableOnlyAfterActionType: 'REQUEST_EVIDENCE' },
  ],
  groundTruth: {
    observedSignal: 'Serial patient potassium result change from 4.2 to 5.1 mmol/L (+21.43%).',
    disturbanceEstablished: false,
    disturbanceDescription: null,
    rootCauseEstablished: true,
    rootCauseDescription: 'The change exceeds RCV (21.43% > 17.53%) and is best explained as a genuine biological/clinical change, not an analytical error — IQC and EQA both support ongoing analytical validity.',
    patientImpactStatus: 'NOT_INDICATED',
    appropriateDisposition: 'NO_ANALYTICAL_HOLD_DOCUMENT_RCV_BASED_CLINICAL_COMMUNICATION',
    evidenceForHypotheses: [
      { hypothesisId: 'hyp-genuine-biological-change', supports: true, weight: 'DECISIVE' },
      { hypothesisId: 'hyp-analytical-error', supports: false, weight: 'SUPPORTIVE' },
      { hypothesisId: 'hyp-expected-noise', supports: false, weight: 'DECISIVE' },
    ],
  },
  decisionOpportunities: [
    { id: 'dec-interpretation', category: 'INTERPRETATION', availableFromPhase: 'HYPOTHESIS_GENERATION', options: [
      { id: 'opt-apply-rcv', label: 'Apply RCV to assess whether the change is statistically significant', consequenceSummary: 'Correct method for this question.', severity: 'INFORMATIONAL' },
      { id: 'opt-assume-error', label: 'Assume an analytical error without checking IQC/EQA/RCV', consequenceSummary: 'Applies the forbidden inference for this case family.', severity: 'UNSUPPORTED' },
    ]},
    { id: 'dec-disposition', category: 'DISPOSITION', availableFromPhase: 'RESUME_OR_HOLD', options: [
      { id: 'opt-no-hold-document', label: 'No analytical hold; document RCV-based interpretation for the clinical team', consequenceSummary: 'Matches ground truth.', severity: 'INFORMATIONAL' },
      { id: 'opt-hold-analytical', label: 'Hold analytical service pending an unnecessary analytical investigation', consequenceSummary: 'IQC and EQA both support ongoing validity; an analytical hold is not evidence-supported here.', severity: 'UNSUPPORTED' },
    ]},
  ],
  verificationCriteria: {
    requiredEvidenceIds: ['ev-rcv-calculation'],
    minimumConfirmationDescription: 'The RCV calculation must be obtained and compared against the observed relative difference before concluding whether the change is statistically significant.',
  },
  debriefEvidence: {
    strongPathDescription: 'Check IQC (clean) and EQA (passed, with correctly limited interpretation) context; request the RCV calculation; correctly compare the observed 21.43% change against the 17.53% RCV threshold; conclude the change is likely genuine; avoid triggering an unnecessary analytical hold; document the RCV-based clinical communication.',
    weakPathDescriptions: [
      { description: 'Assuming the large result change must reflect an analytical error.', whyWeaker: 'This is the exact forbidden inference for this family — a large change is not automatically an error; IQC and EQA both argue against it, and RCV is the correct tool to assess significance.' },
      { description: 'Treating the passing EQA round as proof the specific result is correct.', whyWeaker: 'EQA passing establishes broad method performance at the time of that round, not patient-specific trueness for this specimen — the case panel explicitly documents this interpretation limit.' },
    ],
    commonMisconceptions: [
      'The result changed, therefore something is wrong with the patient or the assay.',
      'A passing EQA round proves this specific result is correct.',
    ],
  },
  provenance: {
    provenanceClass: 'V09_NEW',
    scientificDependencies: ['app/bv/calc.js:calculateClassicalRcv'],
  },
};
