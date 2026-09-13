/* =========================================================================
   v09/app/morning-qc/cases/case-07-no-patient-impact.js

   Morning QC Room — Stage 12D Case 7
   PROVENANCE: V09_NEW
   Case family: E (QC Failure With No Obvious Patient Impact)

   LEARNING OBJECTIVE: separate QC failure from patient-impact
   determination — a QC failure is a signal for review, never proof of
   harm, and the correct conclusion here is genuinely "no affected
   results," reached through review rather than assumption.

   HIDDEN TRUTH: disturbanceEstablished=true (a genuine, brief
   analytical shift), rootCauseEstablished=true (an environmental
   temperature excursion), signalExplanationEstablished=false.
   patientImpactStatus resolves to COMPLETED_NO_AFFECTED_RESULTS.
   ========================================================================= */

export const case07NoPatientImpact = {
  identity: {
    id: 'case-07-no-patient-impact',
    title: 'Calcium Level 1 QC — Brief Shift During HVAC Excursion',
    caseFamily: 'E',
    version: '1.0.0',
    difficulty: 'LEVEL_3_MULTIPLE_SIGNALS_INCOMPLETE_EVIDENCE',
    intendedLearnerLevel: ['intermediate', 'advanced'],
    competencyMapping: ['QC-05', 'QC-09', 'QC-10'],
    curriculum: {
      estimatedMinutes: 14,
      tags: ['patient-impact', 'environmental', 'no-harm-conclusion'],
      sequencingGroup: 'patient-impact-reasoning',
      prerequisiteCompetencies: ['RISK_REASONING'],
      competencyTargets: ['PATIENT_IMPACT_REASONING', 'RISK_REASONING'],
    },
    instructor: {
      teachingPoints: [
        'A confirmed QC failure does not automatically mean every patient result in the run is wrong — patient-impact review must still be performed, and "no affected results" is a legitimate, evidence-backed conclusion, not a shortcut.',
        'Concluding "no impact" without doing the review is just as wrong as assuming impact without evidence.',
      ],
      commonFailureModes: [
        'Learner assumes all results during the QC failure window are automatically wrong.',
        'Learner skips patient-impact review entirely because the analytical cause was quickly identified and fixed.',
      ],
    },
  },
  labContext: {
    analyte: 'Calcium (synthetic educational dataset)',
    analyticalMethod: 'Colorimetric, synthetic assay parameters',
    qcMaterials: [{ levelId: 'L1', levelName: 'Level 1', targetValue: 8.0, targetSD: 0.2 }],
    qcStrategy: '1_3s/2_2s multirule, QC every 4 hours',
    apsSource: 'manufacturer',
  },
  timeline: [
    { id: 'evt-1', type: 'ENVIRONMENTAL', timestamp: 0, description: 'Laboratory HVAC system reports a temperature excursion (ambient rose to 32\u00b0C for approximately 45 minutes).', panelId: 'panel-analyzer-status' },
    { id: 'evt-2', type: 'QC_OBSERVATION', timestamp: 30, description: 'Run at t=30 (during excursion): 8.68 mg/dL — exceeds the 1_3s limit.', panelId: 'panel-qc-history' },
    { id: 'evt-3', type: 'QC_OBSERVATION', timestamp: 90, description: 'Run at t=90 (after HVAC restored): 8.01 mg/dL — within control.', panelId: 'panel-qc-history' },
  ],
  panels: [
    { id: 'panel-qc-history', type: 'QC_HISTORY', availableFromPhase: 'BRIEFING', relevance: 'RELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'LIS QC log', content: { note: 'Run at t=30 (during the HVAC excursion): 8.68 mg/dL, exceeding the 1_3s limit. Run at t=90 (after HVAC restored): 8.01 mg/dL, within control.' } },
    { id: 'panel-analyzer-status', type: 'ANALYZER_STATUS', availableFromPhase: 'CHARACTERISATION', relevance: 'RELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'Facilities/analyzer environmental log', content: { note: 'Ambient temperature rose to 32\u00b0C for approximately 45 minutes (t=0 to t=45) before the HVAC system was restored.' } },
    { id: 'panel-patient-distribution', type: 'PATIENT_RESULT_DISTRIBUTION', availableFromPhase: 'CHARACTERISATION', relevance: 'RELEVANT', costTimeMinutes: 3, mayBeMisleading: false, provenance: 'LIS patient result log', content: { note: 'Three patient calcium specimens were run between t=15 and t=40, within the excursion window.' } },
  ],
  hypotheses: [
    { id: 'hyp-environmental', label: 'A temperature excursion caused a brief, self-resolving analytical shift.', plausibleFromStart: true },
    { id: 'hyp-all-affected', label: 'Every patient result run during the excursion window is definitely wrong.', plausibleFromStart: false },
  ],
  evidence: [
    { id: 'ev-temp-excursion', source: 'panel-analyzer-status', sourcePanelId: 'panel-analyzer-status', timestamp: 30, observedValueOrFinding: 'Ambient temperature rose to 32\u00b0C for ~45 minutes, coinciding with the QC exceedance window.', interpretationLimits: 'Establishes a plausible environmental mechanism and timing — it does not by itself tell you whether any specific patient result was actually affected.', supportsHypothesisIds: ['hyp-environmental'], weakensHypothesisIds: [], decisive: false, relevant: true, availableOnlyAfterActionType: null },
    { id: 'ev-qc-self-resolved', source: 'panel-qc-history', sourcePanelId: 'panel-qc-history', timestamp: 90, observedValueOrFinding: 'QC returned to control (8.01 mg/dL) once the HVAC excursion resolved, with no intervention performed.', interpretationLimits: 'Confirms the shift was transient and environmentally linked, not a persistent analytical fault requiring a component repair.', supportsHypothesisIds: ['hyp-environmental'], weakensHypothesisIds: [], decisive: false, relevant: true, availableOnlyAfterActionType: null },
    { id: 'ev-patient-results-reviewed', source: 'patient-result review against RCV/clinical context', sourcePanelId: null, timestamp: 100, observedValueOrFinding: 'All three patient specimens run within the excursion window were reviewed individually; none showed a calcium value inconsistent with the patient\u2019s prior results or clinical picture beyond expected variation.', interpretationLimits: 'This is the genuine patient-impact review step — a QC exceedance during the window does not, by itself, tell you whether these SPECIFIC results were affected; the review itself is what establishes no affected results were identified.', supportsHypothesisIds: [], weakensHypothesisIds: ['hyp-all-affected'], decisive: true, relevant: true, availableOnlyAfterActionType: 'REVIEW_PATIENT_IMPACT' },
  ],
  decisionOpportunities: [
    { id: 'dec-containment', category: 'CONTAINMENT', availableFromPhase: 'SIGNAL_RECOGNITION', options: [
      { id: 'opt-hold', label: 'Hold reporting pending investigation of the exceedance', consequenceSummary: 'Appropriate — a QC exceedance always warrants pausing before further reporting, regardless of a plausible environmental explanation.', severity: 'INFORMATIONAL', outcomeAppropriate: true, actionType: 'HOLD_RESULTS', requiredEvidenceIdsForSupportedReasoning: [] },
    ]},
    { id: 'dec-disposition', category: 'DISPOSITION', availableFromPhase: 'VERIFICATION', options: [
      { id: 'opt-resume-reviewed', label: 'Resume after verified QC recovery and a genuine patient-impact review', consequenceSummary: 'Correct — the environmental cause is confirmed, QC has recovered, and patient-impact review was genuinely performed rather than assumed.', severity: 'INFORMATIONAL', outcomeAppropriate: true, actionType: 'RESUME_SERVICE', requiredEvidenceIdsForSupportedReasoning: ['ev-patient-results-reviewed'] },
      { id: 'opt-resume-skip-review', label: 'Resume without reviewing patient results from the excursion window', consequenceSummary: 'Unsafe — QC recovery alone does not establish patient results from the affected window were unaffected; the review itself was never performed.', severity: 'UNSAFE', outcomeAppropriate: false, actionType: 'RESUME_SERVICE', requiredEvidenceIdsForSupportedReasoning: [] },
    ]},
  ],
  verificationCriteria: { requiredEvidenceIds: ['ev-qc-self-resolved'], minimumConfirmationDescription: 'Verification requires QC recovery to control after the environmental cause resolved.' },
  patientImpactCriteria: { requiredEvidenceIdsForTerminalState: ['ev-patient-results-reviewed'], minimumConfirmationDescription: 'Reaching COMPLETED_NO_AFFECTED_RESULTS requires an actual individual review of patient results run in the affected window, not merely noting the environmental cause resolved.' },
  debriefEvidence: {
    commonMisconceptions: ['A QC failure means every patient result in the affected window is wrong.', 'Because the cause was quickly identified and resolved itself, patient-impact review can be skipped.'],
    strongPathDescription: 'You correctly held reporting on the exceedance, identified the transient environmental cause, and — critically — performed a genuine patient-impact review rather than assuming impact or dismissing the need to check.',
    weakPathDescriptions: ['Assuming all patient results run during the excursion are automatically wrong without reviewing them.', 'Resuming service without ever reviewing patient-impact for the affected window.'],
  },
  groundTruth: {
    observedSignal: 'Calcium Level 1 QC: 8.68 mg/dL during a laboratory HVAC temperature excursion (exceeds 1_3s limit); 8.01 mg/dL after HVAC restored (within control).',
    disturbanceEstablished: true,
    disturbanceDescription: 'A genuine, brief, self-resolving analytical shift caused by an environmental temperature excursion.',
    rootCauseEstablished: true,
    rootCauseDescription: 'Ambient temperature rose to 32\u00b0C for approximately 45 minutes due to an HVAC malfunction, transiently affecting the colorimetric reaction.',
    signalExplanationEstablished: false,
    signalExplanationDescription: null,
    patientImpactStatus: 'COMPLETED_NO_AFFECTED_RESULTS',
    appropriateDisposition: 'HOLD_THEN_RESUME_AFTER_VERIFIED_RECOVERY_AND_PATIENT_IMPACT_REVIEW_CONFIRMING_NO_AFFECTED_RESULTS',
    evidenceForHypotheses: [
      { hypothesisId: 'hyp-environmental', supports: true, weight: 'SUPPORTIVE' },
      { hypothesisId: 'hyp-all-affected', supports: false, weight: 'DECISIVE' },
    ],
  },
  provenance: {
    provenanceClass: 'V09_NEW',
    scientificDependencies: ['app/rules/engine.js:detect1_3s'],
  },
};
