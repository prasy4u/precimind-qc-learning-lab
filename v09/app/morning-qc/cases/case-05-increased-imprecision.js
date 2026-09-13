/* =========================================================================
   v09/app/morning-qc/cases/case-05-increased-imprecision.js

   Morning QC Room — Stage 12D Case 5
   PROVENANCE: V09_NEW
   Case family: C (Increased Imprecision)

   LEARNING OBJECTIVE: recognize increased scatter (imprecision) as
   distinct from a mean shift — the mean looks fine, masking a true
   precision problem that degrades Sigma performance.

   SCIENTIFIC CORRECTION (Stage 12D SCIENTIFIC, ADAPTIVE AND ANALYTICS
   TRUTH closure): the original 4-point design incorrectly claimed a
   "2_2s rule triggered" — none of the 4 points exceeded ±2 SD, and the
   two points nearest each other were on opposite sides of the mean, so
   no same-side 2_2s condition existed. This case now uses a genuine
   20-point rolling QC precision window (a real laboratory practice for
   detecting imprecision, which by its nature is not a single-rule
   violation), with mean/SD/CV/Sigma computed directly and verifiably
   from the authored values below (never hand-waved):

     Values: [3.48, 3.47, 3.48, 3.61, 3.48, 3.26, 3.55, 3.46, 3.47, 3.52,
              3.54, 3.69, 3.61, 3.52, 3.38, 3.34, 3.54, 3.71, 3.51, 3.48]
     mean = 3.505, sample SD (n-1) = 0.1059, CV = 3.02%
     Current Sigma = (TEa - |bias|) / CV = (8 - 0.2) / 3.02 ~ 2.58
     Prior established SD = 0.08, prior CV = 0.08/3.5*100 = 2.2857%
     Prior Sigma = (8 - 0.2) / 2.2857 ~ 3.41

   HIDDEN TRUTH: disturbanceEstablished=true (a genuine imprecision
   problem), rootCauseEstablished=true (a failing pipetting mechanism),
   signalExplanationEstablished=false (not applicable — this IS an
   analytical disturbance). Probe-flagged diagnostic evidence alone
   never satisfies verification — a genuine post-service repeat window
   demonstrating SD recovery is required (RECOV-05).
   ========================================================================= */

export const case05IncreasedImprecision = {
  identity: {
    id: 'case-05-increased-imprecision',
    title: 'Potassium Level 1 QC — Widened Scatter, Mean On Target',
    caseFamily: 'C',
    version: '1.1.0',
    difficulty: 'LEVEL_2_COMPETING_EXPLANATION',
    intendedLearnerLevel: ['intermediate', 'advanced'],
    competencyMapping: ['QC-01', 'QC-02', 'QC-07'],
    curriculum: {
      estimatedMinutes: 12,
      tags: ['imprecision', 'sigma-impact', 'mean-vs-sd'],
      sequencingGroup: 'statistical-interpretation',
      prerequisiteCompetencies: ['SIGNAL_RECOGNITION'],
      competencyTargets: ['STATISTICAL_INTERPRETATION', 'ANALYTICAL_REASONING'],
    },
    instructor: {
      teachingPoints: [
        'A mean that looks "on target" can still hide a genuine, clinically significant precision problem — detected here through a rolling-window SD/CV/Sigma calculation, not a single Westgard rule violation.',
        'Imprecision degrades Sigma performance even when no single point crosses a control limit.',
        'A diagnostic flag on the suspected mechanism (the probe) is not itself proof of recovery — a genuine post-service repeat window showing SD returning toward the established value is required.',
      ],
      commonFailureModes: [
        'Learner sees the mean is close to target and dismisses the signal entirely.',
        'Learner treats scatter as a lot/calibration problem without checking the pipetting/sampling mechanism.',
        'Learner treats the probe being flagged/serviced as itself sufficient verification, without checking a genuine post-service repeat window.',
      ],
    },
  },
  labContext: {
    analyte: 'Potassium (synthetic educational dataset)',
    analyticalMethod: 'Indirect ISE, synthetic assay parameters',
    qcMaterials: [{ levelId: 'L1', levelName: 'Level 1', targetValue: 3.5, targetSD: 0.08 }],
    qcStrategy: 'Rolling 20-run precision review, QC every 4 hours',
    apsSource: 'manufacturer',
    sigmaContext: { teaPercent: 8, priorCVPercent: 2.2857, biasPercent: 0.2, priorSigma: 3.41 },
  },
  timeline: [
    { id: 'evt-1', type: 'QC_OBSERVATION', timestamp: 0, description: 'Scheduled rolling 20-run precision review flags the current window\u2019s SD as substantially elevated versus the established prior SD.', panelId: 'panel-qc-history' },
  ],
  panels: [
    { id: 'panel-qc-history', type: 'QC_HISTORY', availableFromPhase: 'BRIEFING', relevance: 'RELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'LIS QC log', content: { note: 'Last 20 runs (mmol/L): 3.48, 3.47, 3.48, 3.61, 3.48, 3.26, 3.55, 3.46, 3.47, 3.52, 3.54, 3.69, 3.61, 3.52, 3.38, 3.34, 3.54, 3.71, 3.51, 3.48. Computed mean = 3.505 (target 3.5) — close to target. Computed sample SD = 0.1059, versus the established prior SD of 0.08.' } },
    { id: 'panel-lj-chart', type: 'LJ_CHART', availableFromPhase: 'CHARACTERISATION', relevance: 'RELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'LJ chart export', content: { note: 'Points scatter widely above and below the mean line with no consistent directional shift — the pattern is one of increased spread, not a shifted centerline. No single point exceeds the 1_3s limit.' } },
    { id: 'panel-sigma', type: 'SIGMA', availableFromPhase: 'CHARACTERISATION', relevance: 'RELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'Sigma calculation', content: { note: 'Current CV = 0.1059/3.505*100 ~ 3.02%. Current Sigma = (TEa 8% - |bias| 0.2%) / CV ~ (7.8/3.02) ~ 2.58. Prior established CV = 0.08/3.5*100 ~ 2.29%, prior Sigma ~ (7.8/2.29) ~ 3.41 — a substantial, clinically relevant degradation.', learnerNote: 'Recalculating with the current window\u2019s SD (0.1059) instead of the prior established SD (0.08) shows Sigma falling from approximately 3.41 to approximately 2.58.' } },
    { id: 'panel-maintenance', type: 'MAINTENANCE', availableFromPhase: 'CHARACTERISATION', relevance: 'RELEVANT', costTimeMinutes: 2, mayBeMisleading: false, provenance: 'Maintenance log', content: { note: 'The sample probe pipetting mechanism was flagged for irregular aspiration volume during this shift\u2019s automated self-check.' } },
    { id: 'panel-reagent-lot', type: 'REAGENT_LOT', availableFromPhase: 'CHARACTERISATION', relevance: 'IRRELEVANT', costTimeMinutes: 2, mayBeMisleading: true, provenance: 'Reagent lot log', content: { note: 'No reagent lot change has occurred in the past 30 days.', learnerNote: 'No reagent lot change has occurred in the past 30 days.' } },
  ],
  hypotheses: [
    { id: 'hyp-imprecision', label: 'Increased random imprecision (widened scatter), not a shift.', plausibleFromStart: true },
    { id: 'hyp-lot', label: 'A reagent lot change caused the pattern.', plausibleFromStart: false },
    { id: 'hyp-mean-fine-dismiss', label: 'The mean is on target, so nothing is wrong.', plausibleFromStart: false },
  ],
  evidence: [
    { id: 'ev-sd-widened', source: 'panel-qc-history', sourcePanelId: 'panel-qc-history', timestamp: 0, observedValueOrFinding: 'Computed sample SD (0.1059, n-1) substantially exceeds the established prior SD (0.08), while the computed mean (3.505) remains close to target.', interpretationLimits: 'A widened SD with an on-target mean is the signature of imprecision, not a shift — but this alone does not identify the mechanical cause.', supportsHypothesisIds: ['hyp-imprecision'], weakensHypothesisIds: ['hyp-mean-fine-dismiss'], decisive: false, relevant: true, availableOnlyAfterActionType: null },
    { id: 'ev-sigma-degraded', source: 'panel-sigma', sourcePanelId: 'panel-sigma', timestamp: 0, observedValueOrFinding: 'Sigma falls from approximately 3.41 to approximately 2.58 when recalculated with the current window\u2019s SD.', interpretationLimits: 'This quantifies the clinical significance of the imprecision — it does not by itself identify the mechanical cause.', supportsHypothesisIds: ['hyp-imprecision'], weakensHypothesisIds: ['hyp-mean-fine-dismiss'], decisive: false, relevant: true, availableOnlyAfterActionType: null },
    { id: 'ev-probe-flagged', source: 'panel-maintenance', sourcePanelId: 'panel-maintenance', timestamp: 0, observedValueOrFinding: 'The sample probe was flagged for irregular aspiration volume during this shift.', interpretationLimits: 'A flagged mechanical irregularity affecting aspiration volume is a plausible, evidence-based mechanism for genuine imprecision — decisive within this case\u2019s evidence set for identifying a CAUSE. It is a diagnostic finding only and can NEVER by itself substitute for post-service verification that the imprecision has actually resolved.', supportsHypothesisIds: ['hyp-imprecision'], weakensHypothesisIds: ['hyp-lot'], decisive: true, relevant: true, availableOnlyAfterActionType: null },
    { id: 'ev-no-lot-change', source: 'panel-reagent-lot', sourcePanelId: 'panel-reagent-lot', timestamp: 0, observedValueOrFinding: 'No reagent lot change in the past 30 days.', interpretationLimits: 'Rules out a lot-related explanation for this pattern.', supportsHypothesisIds: [], weakensHypothesisIds: ['hyp-lot'], decisive: false, relevant: true, availableOnlyAfterActionType: null },
    { id: 'ev-post-service-sd-recovery', source: 'repeat QC window after probe service', sourcePanelId: null, timestamp: 40, observedValueOrFinding: 'A new 10-run window collected after probe service shows SD = 0.081 — consistent with the established prior SD of 0.08.', interpretationLimits: 'This is the genuine verification step: a probe diagnostic flag and its subsequent service are not themselves proof of recovery — only a real post-service repeat window demonstrating SD returning toward the established value satisfies verification.', supportsHypothesisIds: ['hyp-imprecision'], weakensHypothesisIds: [], decisive: true, relevant: true, availableOnlyAfterActionType: null, availableOnlyAfterDecisionOption: { decisionId: 'dec-intervention', optionId: 'opt-service-probe' } },
  ],
  decisionOpportunities: [
    { id: 'dec-containment', category: 'CONTAINMENT', availableFromPhase: 'SIGNAL_RECOGNITION', options: [
      { id: 'opt-hold', label: 'Hold reporting pending investigation of the widened scatter', consequenceSummary: 'Appropriate — a substantial, Sigma-relevant precision degradation warrants pausing before further reporting, even with no single-rule violation.', severity: 'INFORMATIONAL', outcomeAppropriate: true, actionType: 'HOLD_RESULTS', requiredEvidenceIdsForSupportedReasoning: [] },
      { id: 'opt-continue-mean-fine', label: 'Continue analysis because the mean is on target', consequenceSummary: 'Unsafe — dismissing a precision problem because the mean looks acceptable ignores a genuine, clinically relevant Sigma degradation.', severity: 'UNSAFE', outcomeAppropriate: false, actionType: 'CONTINUE_ANALYSIS', requiredEvidenceIdsForSupportedReasoning: [] },
    ]},
    { id: 'dec-intervention', category: 'INTERVENTION', availableFromPhase: 'HYPOTHESIS_GENERATION', options: [
      { id: 'opt-service-probe', label: 'Service/replace the flagged pipetting probe', consequenceSummary: 'Correct corrective action for a confirmed mechanical imprecision cause — but must still be verified with a genuine post-service repeat window before resuming.', severity: 'INFORMATIONAL', outcomeAppropriate: true, actionType: 'APPLY_INTERVENTION', requiredEvidenceIdsForSupportedReasoning: ['ev-probe-flagged'] },
    ]},
    { id: 'dec-disposition', category: 'DISPOSITION', availableFromPhase: 'VERIFICATION', options: [
      { id: 'opt-resume-verified', label: 'Resume after a genuine post-service repeat window confirms SD recovery', consequenceSummary: 'Correct — verification required an actual post-service repeat window, not merely the probe diagnostic flag or the service action itself.', severity: 'INFORMATIONAL', outcomeAppropriate: true, actionType: 'RESUME_SERVICE', requiredEvidenceIdsForSupportedReasoning: ['ev-post-service-sd-recovery'] },
      { id: 'opt-resume-probe-flagged-only', label: 'Resume once the probe has been flagged and serviced', consequenceSummary: 'Unsafe — a diagnostic flag and a service action are not themselves proof of recovery; no post-service evidence was ever obtained.', severity: 'UNSAFE', outcomeAppropriate: false, actionType: 'RESUME_SERVICE', requiredEvidenceIdsForSupportedReasoning: [] },
    ]},
  ],
  verificationCriteria: { requiredEvidenceIds: ['ev-post-service-sd-recovery'], minimumConfirmationDescription: 'Verification requires a genuine post-service repeat window demonstrating SD has returned toward the established prior value — the probe diagnostic flag alone never satisfies this.' },
  patientImpactCriteria: { requiredEvidenceIdsForTerminalState: ['ev-sd-widened'], minimumConfirmationDescription: 'Patient-impact review for a precision (not accuracy) problem focuses on results near clinical decision points during the affected window.' },
  debriefEvidence: {
    commonMisconceptions: ['If the mean is on target, QC is fine.', 'Increased scatter must be a reagent lot problem.', 'Flagging and servicing the suspected mechanism is itself proof the problem is resolved.'],
    strongPathDescription: 'You recognized that an on-target mean does not rule out a precision problem, quantified its Sigma impact from a genuine rolling window, correctly traced it to the flagged pipetting mechanism rather than assuming a lot cause, and required an actual post-service repeat window — not just the diagnostic flag — before resuming.',
    weakPathDescriptions: ['Dismissing the signal because the mean looked acceptable.', 'Concluding a lot-related cause without checking whether a lot change actually occurred.', 'Resuming once the probe was serviced, without a genuine post-service repeat window.'],
  },
  groundTruth: {
    observedSignal: 'QC Level 1 potassium: rolling 20-run window, mean 3.505 mmol/L (near target 3.5), computed sample SD 0.1059 versus established prior SD 0.08 — a substantial precision (not accuracy) degradation, Sigma falling from approximately 3.41 to approximately 2.58.',
    disturbanceEstablished: true,
    disturbanceDescription: 'Genuine increased imprecision (widened SD) traced to a flagged pipetting-probe irregularity.',
    rootCauseEstablished: true,
    rootCauseDescription: 'Irregular aspiration volume from the sample probe, flagged by the analyzer\u2019s automated self-check during this shift.',
    signalExplanationEstablished: false,
    signalExplanationDescription: null,
    patientImpactStatus: 'NOT_INDICATED',
    appropriateDisposition: 'HOLD_THEN_RESUME_AFTER_PROBE_SERVICE_AND_VERIFIED_POST_SERVICE_SD_RECOVERY',
    evidenceForHypotheses: [
      { hypothesisId: 'hyp-imprecision', supports: true, weight: 'DECISIVE' },
      { hypothesisId: 'hyp-lot', supports: false, weight: 'SUPPORTIVE' },
      { hypothesisId: 'hyp-mean-fine-dismiss', supports: false, weight: 'DECISIVE' },
    ],
  },
  provenance: {
    provenanceClass: 'V09_NEW',
    scientificDependencies: ['app/opchar/sigma.js:calculateSigma'],
  },
};
