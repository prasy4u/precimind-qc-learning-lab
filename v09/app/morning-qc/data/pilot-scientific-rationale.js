/* =========================================================================
   v09/app/morning-qc/data/pilot-scientific-rationale.js

   Morning QC Room — Stage 12A Pilot Case Scientific Rationale
   PROVENANCE: V09_NEW

   Machine-readable rationale for each of the 3 pilot cases (Section 27),
   explicitly distinguishing what is known from what is intentionally
   uncertain. Numeric values referenced here were computed directly via
   the active scientific modules during case authoring (see
   V09_STAGE12A_REPORT.md for the exact computation transcript).
   ========================================================================= */

export const PILOT_SCIENTIFIC_RATIONALE = {
  'pilot-1-reagent-lot-shift': {
    intendedSignal: 'A sustained +7.07% positive bias appears in Level 2 QC beginning at run 6, immediately after a reagent lot change.',
    disturbance: 'A genuine, established systematic analytical disturbance (not random variation) — confirmed by 6 consecutive post-shift points all exceeding the 1_3s limit in the same direction.',
    evidence: 'Decisive: repeating QC with reserved old-lot reagent (same calibration state) returns results to target, isolating the lot as the causal variable. Non-decisive/supportive: temporal proximity of the lot change to shift onset; the intervening calibration event\'s own verification passed, weakening (not eliminating) the calibration hypothesis.',
    rootCauseStatus: 'ESTABLISHED — via the decisive old-lot repeat test, not via temporal correlation alone.',
    patientImpactStatus: 'AFFECTED_RESULT_SET_IDENTIFIED — patient results run on the new lot during the affected window require review.',
    correctContainmentRange: 'HOLD_RESULTS should occur promptly after the sustained rule violation is recognized (run 6 or shortly after) — holding is never penalized by the engine\'s severity model even if invoked slightly early, since containment errs toward safety.',
    acceptableAlternativePathways: 'A learner may inspect panels in any order (e.g., reagent lot before calibration, or vice versa) and may form either hypothesis first — the case does not mandate a single investigation order, only that the decisive evidence (old-lot repeat) is eventually obtained before verification/disposition.',
    unacceptableDecisions: 'Concluding calibration was the cause without obtaining the old-lot repeat evidence (unsupported); resuming service without a verification attempt that meets criteria (CRITICAL_UNSAFE per the engine); resuming without patient-impact review given an established disturbance with likely-affected results.',
    verificationRequirement: 'At least one QC repeat using corrected/verified reagent, returning within target range, before service resumes (verificationCriteria.requiredEvidenceIds = [ev-old-lot-repeat]).',
    dispositionLogic: 'RESUME_SERVICE is only appropriate after (a) verification criteria are met AND (b) patient-impact review has been addressed (not left at NOT_INDICATED given an established disturbance).',
    competenciesExercised: ['LJ interpretation', 'multirule QC (1_3s)', 'investigation/hypothesis discrimination', 'verification discipline', 'patient-impact review'],
    knownVsUncertain: {
      known: 'The reagent lot caused the shift (established by decisive evidence within the case).',
      intentionallyUncertain: 'Whether the calibration event might ALSO have had some minor, non-decisive contribution is not fully excluded by the case — only that it is not the PRIMARY, decisive explanation. The case does not force an artificially total exclusion of every alternative, consistent with Stage 12A\'s doctrine of permitting genuine uncertainty.',
    },
  },

  'pilot-2-pbrtqc-population-shift': {
    intendedSignal: 'PBRTQC moving-mean statistic crosses its alert threshold at t=720, while all conventional IQC runs throughout remain within control.',
    disturbance: 'NO genuine analytical disturbance exists in this case — this is the central pedagogic point (a PBRTQC alert does not automatically imply an analytical problem).',
    evidence: 'Decisive: a stratified re-analysis of the PBRTQC statistic excluding the new ward\'s specimens shows the statistic remains stable, isolating population case-mix as the driver. Non-decisive/supportive: the new ward\'s opening precedes the trend onset by ~2 hours; IQC remaining stable throughout is supportive but not itself decisive (it argues against, but does not conclusively rule out, an analytical explanation on its own).',
    rootCauseStatus: 'ESTABLISHED (as an explanation of the observed signal) — the observed signal\'s cause is population case-mix change, NOT an analytical disturbance. This is explicitly permitted by the schema: rootCauseEstablished=true does not require disturbanceEstablished=true (see case-validator.js correction log in V09_STAGE12A_REPORT.md).',
    patientImpactStatus: 'NOT_INDICATED — no analytical disturbance occurred, so no QC-driven patient-impact review is triggered by this case.',
    correctContainmentRange: 'Taking the PBRTQC alert seriously (not dismissing it because IQC passed) without over-reacting into an unnecessary, indefinite analytical hold once decisive evidence is obtained.',
    acceptableAlternativePathways: 'A learner may investigate the patient-distribution angle before or after checking IQC stability — both orders are pedagogically valid as long as the decisive stratified re-analysis is eventually obtained.',
    unacceptableDecisions: 'Dismissing the alert solely because IQC passed (the case family\'s forbidden inference); concluding population shift from timing alone without the decisive stratified evidence; continuing to hold/investigate analytically after the decisive evidence is in hand.',
    verificationRequirement: 'The stratified re-analysis (ev-case-mix-decisive) must be obtained before concluding no analytical disturbance exists.',
    dispositionLogic: 'CONTINUE_ANALYSIS with documentation of the case-mix explanation is the ground-truth-matching disposition — there is no analytical problem to hold for.',
    competenciesExercised: ['PBRTQC interpretation', 'patient-distribution reasoning', 'investigation strategy', 'resisting the "IQC passed = PBRTQC alert is false" inference'],
    knownVsUncertain: {
      known: 'The PBRTQC trend is fully explained by the population case-mix change (per the decisive stratified re-analysis defined in this case).',
      intentionallyUncertain: 'The case does not assert that population shifts NEVER coincide with genuine analytical issues in general practice — only that, in THIS case\'s specific evidence, the decisive test isolates population shift as sufficient explanation.',
    },
  },

  'pilot-3-rcv-patient-impact': {
    intendedSignal: 'A patient\'s serial potassium result changes from 4.2 to 5.1 mmol/L (+21.43%), prompting a clinician query about analytical validity.',
    disturbance: 'NO analytical disturbance exists — IQC remains in control and the most recent EQA round passed.',
    evidence: 'Decisive: the classical RCV calculation (CVA=2%, CVI=6%, bidirectional-95% convention, computed via app/bv/calc.js:calculateClassicalRcv) yields RCV=17.53%; the observed 21.43% change exceeds this threshold, indicating the change is statistically unlikely to reflect combined analytical+biological noise alone. Non-decisive/supportive: stable IQC and a passing EQA round both support ongoing analytical validity but do not, individually or together, PROVE trueness for this specific specimen (explicitly documented as an interpretation limit on the EQA panel).',
    rootCauseStatus: 'ESTABLISHED — the RCV-exceeding change is best explained as a genuine biological/clinical change, not an analytical error.',
    patientImpactStatus: 'NOT_INDICATED — this is a QC/analytical-impact model; since no analytical disturbance exists, no QC-driven patient-impact workflow is triggered. (The RCV finding is a clinical-interpretation output for the care team, not a QC patient-impact case in the Section-22 sense.)',
    correctContainmentRange: 'No analytical hold is warranted — the correct action is applying RCV to interpret the *clinical* significance of the change, not investigating the *analytical* system.',
    acceptableAlternativePathways: 'A learner may check IQC or EQA first, in either order, before requesting the RCV calculation — both are legitimate supportive steps preceding the decisive RCV evidence.',
    unacceptableDecisions: 'Assuming an analytical error from the magnitude of change alone without checking IQC/EQA/RCV (the case family\'s forbidden inference); treating a passing EQA round as proof this specific result is correct (a documented interpretation-limit trap in the EQA panel itself); triggering an unnecessary analytical hold.',
    verificationRequirement: 'The RCV calculation (ev-rcv-calculation) must be obtained and compared against the observed relative difference before concluding significance.',
    dispositionLogic: 'NO_ANALYTICAL_HOLD_DOCUMENT_RCV_BASED_CLINICAL_COMMUNICATION is the ground-truth-matching disposition.',
    competenciesExercised: ['RCV/biological-variation reasoning', 'EQA interpretation limits', 'IQC-vs-EQA-vs-RCV distinct-purposes reasoning', 'resisting the "big change = error" inference'],
    knownVsUncertain: {
      known: 'The RCV threshold (17.53%) and the observed relative difference (21.43%) are both exact, computed values — the RCV exceedance itself is not uncertain.',
      intentionallyUncertain: 'Whether the underlying CLINICAL cause of the genuine biological change (e.g., a specific diagnosis) is left deliberately unspecified — this case is scoped to the analytical-vs-biological distinction, not to diagnostic reasoning, which is out of scope for a QC learning tool.',
    },
  },
};
