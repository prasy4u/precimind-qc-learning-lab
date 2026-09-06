import { COMMUNICATION_CONSIDERATION_STATUSES, initialResultDispositionStatus } from "./calc.js";

/* =========================================================================
   RECOVERY PROVENANCE NOTE (added during Stage 5B recovery):
   Artifact Class A — directly recovered from recovery/original-v0.8.html
   (SHA-256: e5317bf135f350b258428b985c1034a081e244a295f2e580c93cb6a6a091c8e4)
   Source lines: 6684-7447 (Investigation Lab static data section)
   Historical reported v0.8 commit: 3cc62b1 (not independently verified)
   Recovery date: 2026-09-01
   The block below is the unmodified source text from the HTML artifact.
   ========================================================================= */

/* =========================================================================
   Investigation Lab — v0.5 static teaching content, status-model text,
   guardrail notes, and the deterministic 13-scenario Recovery Challenge
   Bank. Calculation logic lives only in 19-investigation-calc.js; this
   file holds structure and text consumed by the UI, in the same pattern
   as 12-strategy-data.js and 16-risk-data.js.
   ========================================================================= */

/* -------------------------------------------------------------------------
   Core conceptual banner (spec section 3) — mandatory, shown prominently.
   ------------------------------------------------------------------------- */
export const CORE_BANNER_TITLE = "A QC signal is not a root cause.";
export const CORE_BANNER_SEPARATIONS = [
  "QC signal detected",
  "analytical mechanism established",
  "all patient results invalid",
  "clinical harm established"
];

/* -------------------------------------------------------------------------
   Terminology (spec section 5).
   ------------------------------------------------------------------------- */
export const STATISTICAL_SIGNAL_DEFINITION = "Statistical QC signal: a defined statistical control criterion has triggered.";
export const OUT_OF_CONTROL_DEFINITION = "Out-of-control analytical condition: evidence indicates that the analytical process departed from its stable state.";
export const SIGNAL_VS_CONDITION_CAUTION = "These two terms are not automatically synonymous. A statistical rejection criterion can occasionally trigger even when the underlying process remains stable, because false rejection is possible — the signal itself is not proof that the process actually departed from its stable state.";

/* -------------------------------------------------------------------------
   Reasoning pathway (spec header + section 23).
   ------------------------------------------------------------------------- */
export const REASONING_PATHWAY_STEPS = ["Signal", "Contain", "Characterise", "Investigate", "Test hypotheses", "Correct", "Verify recovery", "Assess patient impact", "Document", "Resume"];
export const REASONING_PATHWAY_CAUTION = "This is an educational reasoning framework. It is not a universal laboratory SOP.";
export const INVESTIGATION_SEQUENCE_STEPS = ["Verify signal and context", "Characterise pattern", "Review recent process events", "Generate hypotheses", "Seek discriminating evidence", "Intervene deliberately", "Verify recovery", "Assess patient-result impact"];
export const INVESTIGATION_SEQUENCE_CAUTION = "This is a reasoning framework, not a rigid universal sequence — a real investigation may revisit earlier steps as evidence emerges.";

/* -------------------------------------------------------------------------
   Four mandatory teaching principles (spec sections 72-75).
   ------------------------------------------------------------------------- */
export const FOUR_PRINCIPLES = [
  { id: "impact-window-not-impact", text: "Being analysed during the candidate interval identifies a result for assessment; it does not by itself prove that the result was materially affected." },
  { id: "difference-not-harm", text: "Demonstrating an analytical difference does not by itself establish that clinical interpretation or patient management was affected." },
  { id: "repeat-not-erase", text: "A subsequent acceptable QC result adds evidence about current performance; it does not make the original signal cease to have occurred." },
  { id: "correlation-not-cause", text: "A process event occurring near a QC failure may support a hypothesis but does not establish causation without corroborating evidence." }
];

/* -------------------------------------------------------------------------
   Six core learning-objective questions (spec section 1).
   ------------------------------------------------------------------------- */
export const SIX_CORE_QUESTIONS = [
  "Has the defined QC procedure produced a statistical signal?",
  "Does available evidence support an actual analytical-process disturbance?",
  "What mechanism might explain the disturbance?",
  "Has the mechanism been adequately supported, or does it remain only a hypothesis?",
  "Which patient results were produced during a period in which analytical validity may have been compromised?",
  "Which of those results, if any, show evidence of a meaningful analytical effect?",
  "What verification is needed before routine testing resumes?"
];
export const COLLAPSE_CAUTION = "Do not collapse these questions into: \"QC failed → recalibrate → repeat QC → release.\"";

/* -------------------------------------------------------------------------
   Module 1 — When QC Signals (spec sections 6-13).
   ------------------------------------------------------------------------- */
export const IMMEDIATE_ACTION_OPTIONS = [
  { id: "inspect-pattern", label: "Inspect the complete QC pattern" },
  { id: "inspect-other-levels", label: "Inspect other QC level(s)" },
  { id: "review-history", label: "Review recent QC history" },
  { id: "review-alarms", label: "Review analyser alarms/events" },
  { id: "check-qc-material", label: "Check QC material preparation/handling" },
  { id: "review-calibration", label: "Review recent calibration" },
  { id: "review-reagent", label: "Review reagent lot/change" },
  { id: "hold-results", label: "Temporarily hold results whose validity is genuinely in question" },
  { id: "targeted-repeat", label: "Perform a targeted repeat QC measurement for a stated investigative purpose" },
  { id: "recalibrate", label: "Recalibrate" },
  { id: "replace-reagent", label: "Replace reagent" },
  { id: "replace-qc-material", label: "Replace QC material" },
  { id: "repeat-patients", label: "Repeat patient specimens" },
  { id: "continue-release", label: "Continue routine release" }
];
export const NO_STOP_EVERYTHING_NOTE = "This application does not teach that every 1₂s warning requires stopping all testing, and does not teach that every QC anomaly requires holding every patient result. The appropriate response depends on the laboratory's configured QC procedure, warning versus rejection status, the affected analyte(s), evidence of process instability, the defined local procedure, and potential patient impact.";
export const NO_KEEP_RUNNING_NOTE = "Conversely, this application does not teach that testing should always continue whenever a repeat control passes. Where analytical validity remains in question, results whose analytical validity is in question may need to be withheld or managed according to the validated local procedure until the concern is resolved — this is different from saying all results are invalid.";

export const REPEAT_QC_PRINCIPLE_NOTE = "Repeating QC can be a legitimate investigative action. Repeating QC solely until a result falls inside limits and then ignoring the original signal is not sound analytical reasoning.";

export const REPEAT_QC_EXERCISE = {
  initial: [{ level: "Level 1", z: 3.4 }, { level: "Level 2", z: 3.1 }],
  repeat: [{ level: "Level 1", z: 0.3 }, { level: "Level 2", z: 0.1 }],
  question: "Has the original analytical concern been resolved?",
  correctAnswer: "Not necessarily.",
  explanation: "A passing repeat provides new evidence but does not retrospectively erase the original rejection signal. Further interpretation depends on QC preparation, aspiration, a transient analyser event, the control material, statistical false rejection, calibration/reagent history, and additional QC evidence."
};

export const TARGETED_REPEAT_VS_REPEAT_UNTIL_PASS = {
  appropriate: { label: "Appropriate investigative repeat", example: "Hypothesis: the original control aliquot may have been improperly prepared. Run a newly prepared aliquot to test that hypothesis." },
  poor: { label: "Poor reasoning", example: "Repeat the same control repeatedly until one result falls inside ±2 SD, then release patient results." }
};

export const RECALIBRATION_GUARDRAIL_NOTE = "Recalibration is an intervention, not a diagnostic explanation. This application does not recommend recalibration automatically after every QC signal — a premature recalibration can obscure evidence about the original disturbance, introduce another process change, and prevent understanding of the root cause. Recalibration may be appropriate when supported by the analytical context.";
export const CHANGE_EVERYTHING_GUARDRAIL_NOTE = "This application does not teach replacing QC material, replacing reagent, recalibrating and performing maintenance all at once. Changing multiple components simultaneously may restore performance but makes causal attribution difficult. In these troubleshooting simulations, hypothesis-driven interventions are encouraged wherever practical.";

/* -------------------------------------------------------------------------
   Evidence categories (spec section 16) — reference metadata only.
   ------------------------------------------------------------------------- */
export const EVIDENCE_CATEGORIES = [
  { id: "qc-pattern", label: "QC-pattern evidence", examples: ["one level versus multiple levels", "one analyte versus multiple analytes", "systematic displacement", "increased scatter", "transient extreme result", "sequence/history"] },
  { id: "qc-material", label: "QC-material evidence", examples: ["vial age", "preparation/reconstitution", "storage", "alternate vial", "alternate lot"] },
  { id: "reagent", label: "Reagent evidence", examples: ["lot change", "reagent replacement", "onboard stability", "preparation", "lot comparison"] },
  { id: "calibration", label: "Calibration evidence", examples: ["calibration event", "calibration verification", "calibration history"] },
  { id: "instrument", label: "Instrument evidence", examples: ["analyser alarms", "probe pressure", "aspiration error", "temperature", "photometric response", "maintenance event"] },
  { id: "cross-assay", label: "Cross-assay evidence", examples: ["other assays on the same platform"] },
  { id: "comparison", label: "Comparison evidence", examples: ["alternate analyser", "alternate method", "retained patient specimens"] },
  { id: "patient-data", label: "Patient-data evidence", examples: ["deterministic patient-result summary", "population summary", "remeasurement results"] }
];
export const NO_PBRTQC_NOTE = "This application does not implement patient-based real-time quality control (PBRTQC) in the Investigation Lab. A deterministic patient-result summary may appear as corroborative patient-data evidence within an authored scenario, but no moving-average or patient-based alarm algorithm is calculated here.";

/* Shared hypothesis-category vocabulary (spec section 14). Every scenario's
   candidate hypotheses are drawn from this fixed list — never invented
   per-scenario categories — so "candidate explanation" language stays
   consistent across the whole Investigation Lab. */
export const HYPOTHESIS_CATEGORIES = [
  { id: "qc-material", label: "QC material / preparation" },
  { id: "calibration", label: "Calibration-related issue" },
  { id: "reagent", label: "Reagent-related issue" },
  { id: "instrument", label: "Instrument / analyser issue" },
  { id: "aspiration", label: "Aspiration / dispensing instability" },
  { id: "maintenance", label: "Maintenance-related change" },
  { id: "environmental", label: "Environmental/process condition" },
  { id: "operator", label: "Operator/procedural issue" },
  { id: "assay-specific", label: "Assay-specific analytical disturbance" },
  { id: "shared-system", label: "Shared-system disturbance" },
  { id: "false-rejection", label: "Statistical false rejection remains plausible" },
  { id: "insufficient-evidence", label: "Insufficient evidence" }
];
export function hypothesisLabel(id) { const h = HYPOTHESIS_CATEGORIES.find(x => x.id === id); return h ? h.label : id; }

/* Cause-status -> the exact wording the UI must use in front of a
   hypothesis (spec section 15: never bare "Cause" until strongly
   corroborated, and even then prefer "strongly supported explanation"). */
export const CAUSE_STATUS_HYPOTHESIS_LABEL = {
  "no-hypothesis": "No candidate explanation yet",
  "candidate-hypothesis": "Candidate explanation",
  "supported-hypothesis": "Supported explanation",
  "strongly-corroborated": "Strongly supported explanation",
  "unresolved": "Unresolved — no explanation adequately supported"
};

export const EVIDENCE_STRENGTH_LABELS = { weak: "Weak (△)", moderate: "Moderate (◐)", strong: "Strong (●)" };
export const SUPPORT_RELATION_LABELS = { supports: "Supports (＋)", weakens: "Weakens (－)", neutralFor: "Does not distinguish (＝)" };
export const NO_QUANTITATIVE_CERTAINTY_NOTE = "This application never fabricates quantitative certainty for a hypothesis — no \"82% probability reagent problem,\" no AI causal score, no Bayesian likelihood ratio, no arbitrary weighted root-cause ranking. It only summarises, per piece of evidence, whether that evidence supports, weakens, or does not distinguish between the candidate explanations an authored scenario presents.";

export const TEMPORAL_ASSOCIATION_EXAMPLE = {
  events: [{ time: "10:20", label: "New reagent lot introduced" }, { time: "10:35", label: "QC values shift" }],
  question: "Does this prove the reagent caused the shift?",
  correctAnswer: "No.",
  explanation: "Temporal association creates a plausible hypothesis that requires corroboration — for example, lot comparison, alternate-lot testing, calibration history, and other evidence — before it can be treated as more than a candidate explanation."
};
export const CONCORDANT_EVIDENCE_EXAMPLE = {
  narrative: ["New reagent lot at 10:20.", "Both QC levels shift afterward.", "Alternate lot restores baseline.", "Patient comparison shows a similar direction of difference.", "No calibration/instrument event is present."],
  correctFeedback: "Evidence strongly supports a reagent-lot-associated analytical change.",
  overclaimToAvoid: "Reagent lot definitely caused every patient discrepancy."
};
export const CONTRADICTORY_EVIDENCE_EXAMPLE = {
  narrative: ["A new reagent lot was introduced.", "But the shift began before the lot change.", "And an alternate lot produces the same shift."],
  correctConclusion: "The temporal lot-change hypothesis is weakened.",
  teachingPoint: "This example is crucial for avoiding confirmation bias — an attractive, temporally-adjacent hypothesis must still be tested against, and can be weakened by, the available evidence."
};

export const INFORMATION_SEEKING_OPTIONS = [
  { id: "calibration-history", label: "Calibration history" },
  { id: "qc-prep-log", label: "QC preparation log" },
  { id: "reagent-event", label: "Reagent event" },
  { id: "analyser-alarms", label: "Analyser alarms" },
  { id: "patient-remeasurements", label: "Patient remeasurements" },
  { id: "maintenance-log", label: "Maintenance log" }
];
export const INFORMATION_SEEKING_NOTE = "The learner chooses which evidence to inspect next rather than having everything revealed at once. Not every unused option is \"wrong\" — some evidence simply carries higher information value at a given stage of the investigation than others.";

/* -------------------------------------------------------------------------
   Module 3 — Evidence Reconstruction worked example (spec sections 24-28).
   ------------------------------------------------------------------------- */
export const RECONSTRUCTION_WORKED_EXAMPLE = {
  events: [
    { time: "08:00", label: "Accepted QC", kind: "qc" },
    { time: "08:05", label: "Patient testing begins", kind: "testing" },
    { time: "09:40", label: "Maintenance", kind: "process" },
    { time: "10:20", label: "Reagent lot change", kind: "process" },
    { time: "10:30", label: "Calibration", kind: "process" },
    { time: "10:35", label: "Patient testing resumes", kind: "testing" },
    { time: "11:45", label: "QC signal", kind: "qc" },
    { time: "12:00", label: "Testing held", kind: "testing" }
  ],
  lastAcceptedQc: "08:00",
  firstRejectionSignal: "11:45",
  learnerTasks: [
    "Identify the last evidence supporting acceptable performance.",
    "Identify the first evidence supporting abnormal performance.",
    "Identify events capable of constraining the plausible onset.",
    "Identify the uncertainty that remains."
  ]
};
export const LAST_QC_BOUNDARY_NOTE = "The last acceptable QC event establishes evidence of acceptable performance at that point. It does not prove that an analytical failure began immediately afterward. Likewise, the first rejected QC event identifies detection, not necessarily the onset of the analytical disturbance.";
export const DETECTION_VS_ONSET_NOTE = "Failure onset may occur before QC detection, and the exact onset may initially be unknown. Use \"candidate impact interval\" or \"plausible affected interval\" until stronger evidence constrains the timing — never assume every result in that interval is automatically analytically erroneous.";
export const CANDIDATE_WINDOW_NARROWING_EXAMPLE = {
  lastAcceptedQc: "08:00",
  firstRejection: "12:00",
  narrowingEvent: "10:30 reagent lot change",
  narrowedWindow: "10:30–12:00",
  caution: "This narrowing is only valid because the scenario's own investigation evidence strongly supports that specific event as the analytical disturbance — this application does not run a universal algorithm that assumes every reagent change defines onset. The scenario metadata must explicitly support such narrowing."
};
export const NO_CAUSAL_INTERVAL_ENGINE_NOTE = "This application does not infer failure onset from arbitrary user-entered data. v0.5 uses deterministic, validated scenarios with known educational truth states only — there is no AI causal inference and no general root-cause engine.";

/* -------------------------------------------------------------------------
   Module 4 — Patient Result Impact (spec sections 30-42).
   ------------------------------------------------------------------------- */
export const THREE_LAYER_MODEL = [
  { id: "exposure", label: "Layer 1 — Analytical exposure", question: "Which specimens were processed in the candidate interval?", definition: "Patient specimens analysed while analytical validity may have been compromised." },
  { id: "effect", label: "Layer 2 — Analytical effect", question: "Did the disturbance materially alter their measured values?", definition: "Evidence that an analytical disturbance materially changed reported results." },
  { id: "consequence", label: "Layer 3 — Clinical consequence", question: "Could the difference alter patient interpretation or action?", definition: "Potential consequence for interpretation, diagnosis, treatment or monitoring." }
];
export const THREE_LAYER_CAUTION = "These are three different layers and must not be collapsed into one another. Identifying exposure (Layer 1) does not by itself demonstrate an analytical effect (Layer 2), and demonstrating an analytical effect does not by itself establish clinical consequence (Layer 3).";

/* -------------------------------------------------------------------------
   v0.5.1 — Core distinction (spec section 2), taught explicitly and
   verbatim wherever this concept is introduced. This is the foundational
   text underlying the whole ResultDispositionStatus addition.
   ------------------------------------------------------------------------- */
export const CORE_DISTINCTION_RECOVERY_VS_DISPOSITION = "Current analytical recovery and disposition of previously generated patient results are separate decisions. A measurement procedure may have recovered while earlier results remain under review. Conversely, results demonstrated to lie outside the candidate impact interval need not automatically remain held simply because the investigation remains open.";

/* v0.5.1 — Layer 4 of the patient model (spec section 5). Layers 1-3 above
   (THREE_LAYER_MODEL) are retained unmodified; this is a genuinely separate
   fourth layer about what happens to a result once exposure/effect/
   consequence have been considered — the disposition decision itself. */
export const LAYER_FOUR_DISPOSITION = {
  id: "disposition", label: "Layer 4 — Result disposition",
  questions: [
    "Can the original result remain reported?",
    "Does it require review?",
    "Is remeasurement justified?",
    "Should an amended/reissued result be considered?",
    "Is additional clinical assessment required?"
  ],
  definition: "Disposition follows evidence; it is not synonymous with exposure."
};
export const DISPOSITION_NOT_SYNONYMOUS_WITH_EXPOSURE_NOTE = "Disposition follows evidence; it is not synonymous with exposure.";

export const NOT_AUTOMATICALLY_INVALID_NOTE = "This application never states that all results since the last good QC are invalid. It uses: potentially exposed; requires impact assessment; analytical effect demonstrated; no analytical impact demonstrated; unresolved.";
export const SYNTHETIC_PATIENT_DATA_NOTE = "All patient-result scenarios in this application use synthetic identifiers only (P001, P002, P003, …). No real patient information is used, and no uploaded patient datasets are accepted in v0.5.";
export const ILLUSTRATIVE_THRESHOLD_LABEL = "Illustrative scenario-specific analytical review threshold";
export const ILLUSTRATIVE_THRESHOLD_CAUTION = "This is never labelled as a universal TEa, a clinical decision limit, or a regulatory requirement. It exists only for the deterministic teaching scenario that defines it.";
export const NO_AUTO_CORRECTION_NOTE = "This application never implements \"original result / estimated bias = corrected result\" as an automated patient-correction mechanism, and there is no \"fix all affected results\" button anywhere in this build. A post-hoc estimated bias does not automatically justify numerical correction of previously released results.";

export const PATIENT_IMPACT_ACTIONS = [
  { id: "no-action", label: "No additional patient action supported" },
  { id: "review-interval", label: "Review results in the candidate interval" },
  { id: "remeasure-retained", label: "Remeasure a retained specimen" },
  { id: "recollect", label: "Recollect a specimen" },
  { id: "compare-alternate", label: "Compare with an alternative validated system" },
  { id: "discuss-supervisor", label: "Discuss with laboratory supervisor/director" },
  { id: "notify-clinical", label: "Notify the relevant clinical team" },
  { id: "amend-result", label: "Amend/reissue a result" },
  { id: "document", label: "Document the assessment" },
  { id: "insufficient-evidence", label: "Insufficient evidence" }
];
export const CLINICAL_SIGNIFICANCE_GUARDRAIL = "This application does not build a universal clinical-harm calculator. Where a scenario requires clinical context, it uses \"additional clinical assessment required\" rather than automatically concluding \"patient harmed.\" An analytical difference is not the same thing as clinical harm.";
export const ALTERNATE_ANALYSER_NOTE = "An alternate analyser or method can provide useful corroboration only if its performance and comparability are suitable for the question being asked. This application does not teach that \"another analyser = truth.\"";
export const PATIENT_DISTRIBUTION_EVIDENCE_NOTE = "A deterministic summary such as \"the median of recent patient results moved approximately +4%\" may appear as corroborative patient-data evidence, but this is explicitly labelled corroborative patient-data evidence, never PBRTQC — this application does not implement moving averages or patient-based alarm algorithms.";
export const EQA_LIMITATION_NOTE = "EQA/PT may inform long-term trueness, comparability, and persistent bias. It is generally not a real-time mechanism for resolving today's immediate QC failure, and is not used as an instant troubleshooting answer here. QC-10 (EQA/PT) remains a later module.";

/* -------------------------------------------------------------------------
   Module 5 — Recovery (spec sections 43-47).
   ------------------------------------------------------------------------- */
export const RECOVERY_PATHWAY_STEPS = ["Signal", "Investigation", "Corrective intervention where supported", "Verification", "Patient-impact assessment", "Documentation", "Resume"];
export const RECOVERY_NOT_ONE_PASS_NOTE = "A passing QC result after intervention is evidence of recovery, but the laboratory must determine whether sufficient evidence exists to resume routine testing according to its validated procedure. This application does not impose a universal requirement such as exactly two QC levels, exactly two consecutive runs, or exactly three acceptable results — those may be used only within specific, explicitly-defined teaching scenarios.";
export const RECOVERY_EVIDENCE_COMPONENTS = ["Acceptable QC under the defined procedure", "Relevant control levels", "Calibration verification", "Alternate QC material", "Reagent comparison", "Analyser diagnostic status", "Patient-sample comparison", "Repeatability check", "Other appropriate evidence"];
export const DOCUMENTATION_CHECKLIST = ["Original QC signal", "Relevant QC history", "Actions taken", "Evidence reviewed", "Intervention performed", "Recovery evidence", "Patient-result assessment", "Communication where required"];
export const DOCUMENTATION_NOTE = "This application does not require a particular institutional form — the checklist above is a reasoning aid, not a template to fill in and submit.";
export const RESUME_DECISION_OPTIONS = [{ id: "yes", label: "Yes" }, { id: "no", label: "No" }, { id: "additional-evidence", label: "Additional evidence required" }];

/* -------------------------------------------------------------------------
   v0.5.1 — The recovery decision becomes two questions (spec section 7).
   Question A reuses RESUME_DECISION_OPTIONS/correctResumeDecision unchanged.
   Question B is a genuinely separate decision with its own option set and
   its own per-scenario correctResultDispositionDecision field — a scenario
   may legitimately end Resume=Yes while Disposition=Additional review
   required, and this combination must be supported (never treated as
   contradictory or as a data error).
   ------------------------------------------------------------------------- */
export const RESULT_DISPOSITION_DECISION_OPTIONS = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
  { id: "additional-review-required", label: "Additional review required" },
  { id: "not-applicable", label: "Not applicable" }
];
export const TWO_QUESTION_RECOVERY_NOTE = "Recovery is assessed as two separate questions: (A) is there sufficient evidence to resume routine patient testing, and (B) has the disposition of relevant earlier patient results been adequately resolved? A scenario may legitimately end with Resume = Yes while Disposition = Additional review required — this combination must be supported, not treated as an inconsistency.";

/* v0.5.1 — spec section 3: audited into all recovery logic in this build.
   No function in 19-investigation-calc.js or elsewhere computes patient
   result release from ProcessStatus === "recovered" — see
   initialResultDispositionStatus(), which never takes ProcessStatus as an
   input at all. */
export const PROCESS_RECOVERY_VS_RESULT_RELEASE_GUARDRAIL_NOTE = "Process recovery and historical result disposition are separate decisions. This application never implements logic equivalent to \"ProcessStatus = recovered, therefore all held patient results = release.\" A recovered analyser does not by itself mean every previously generated result is valid, and it does not by itself mean every previously generated result must remain held.";

/* v0.5.1 — spec section 4: a QC rejection signal must not automatically set
   every patient result to temporarily-held. See the uniform "indeterminate"
   seeding at the "signal" stage across all 13 scenarios, and Case 12, where
   an isolated QC-material-specific problem ends with resultDispositionStatus
   = "resolved" (no hold at all) once scenario evidence supports it. */
export const QC_SIGNAL_NOT_UNIVERSAL_HOLD_NOTE = "A QC rejection signal does not automatically place every patient result on hold. The scope of any containment or review is scenario- and procedure-dependent — an isolated, QC-material-specific problem can end with no patient-result hold at all when the evidence supports it, just as a shared-system disturbance can require review of results across several assays.";

/* v0.5.1 — spec section 9: the exact required wording, used verbatim
   wherever a scenario demonstrates a meaningful analytical difference in a
   previously reported result (see Case 10). Never auto-amend, never
   auto-notify a clinician through software, never claim every difference
   requires amendment. */
export const AMENDMENT_CONSIDERATION_NOTE = "Amendment or reissue may need to be considered according to the laboratory's validated procedure and clinical context.";
export const NO_AUTO_AMENDMENT_NOTE = "This application never automatically amends or reissues a previously reported result, and does not state that every analytical difference requires amendment. Whether amendment or reissue is appropriate for a specific result is a decision for the laboratory's own validated procedure and clinical context — not an automated outcome of any calculation in this build.";

/* v0.5.1 — spec section 10: CommunicationConsideration. Qualitative and
   scenario-authored only — see COMMUNICATION_CONSIDERATION_STATUSES in
   19-investigation-calc.js. There is deliberately no function anywhere
   that derives a value in this list from a difference calculation, and no
   automated clinician-notification mechanism exists in this build. */
export const COMMUNICATION_CONSIDERATION_OPTIONS = [
  { id: "none-demonstrated", label: "None demonstrated" },
  { id: "laboratory-review", label: "Laboratory review" },
  { id: "clinical-team-communication-may-be-required", label: "Clinical team communication may be required" },
  { id: "communication-completed-within-scenario", label: "Communication completed within scenario" }
];
export const NO_AUTO_NOTIFICATION_NOTE = "This application never sends, drafts, or automatically triggers a clinician notification. Where a scenario illustrates a communication consideration, it is authored qualitatively as part of that scenario's narrative — never derived automatically from an analytical-difference calculation, and never presented as a universal rule that every analytical difference requires clinician notification.";

/* -------------------------------------------------------------------------
   v0.5.1 — Two-timeline display (spec section 6): the current analytical
   process timeline is a genuinely different timeline from the historical
   result-review timeline, and the two should not be visually collapsed
   into one sequence.
   ------------------------------------------------------------------------- */
export const CURRENT_PROCESS_TIMELINE_STEPS = ["Disturbance", "Investigation", "Intervention", "Recovery"];
export const HISTORICAL_RESULT_TIMELINE_STEPS = ["Candidate interval", "Exposed results", "Assessment", "Disposition"];
export const TWO_TIMELINE_EXPLANATION_NOTE = "The current process timeline (disturbance → investigation → intervention → recovery) tracks whether the analytical process itself is working correctly today. The historical result-review timeline (candidate interval → exposed results → assessment → disposition) separately tracks what happens to results already generated. Recovery on the first timeline does not automatically resolve disposition on the second.";

/* -------------------------------------------------------------------------
   Mandatory misconception guardrails (spec sections 32-33, restated here
   for the Investigation Lab; the v0.4 frequency-specific misconceptions
   remain unchanged in 16-risk-data.js).
   ------------------------------------------------------------------------- */
export const HYPOTHESIS_REVISION_NOTE = "A learner is never penalised for revising a hypothesis as evidence emerges. Updating an interpretation when new evidence appears is appropriate analytical reasoning.";
export const CONFIDENCE_CALIBRATION_NOTE_EARLY = "High confidence was expressed before discriminating evidence was available.";
export const CONFIDENCE_CALIBRATION_NOTE_CONVERGED = "Your confidence appropriately increased after independent evidence converged.";
export const NO_GAMIFIED_SCORE_NOTE = "This application never produces a gamified single-number label such as \"Root Cause Expert — 94%.\" Where scoring is shown, it is kept as separate domains: signal interpretation, evidence selection, hypothesis quality, patient-impact reasoning, and recovery decision.";

/* -------------------------------------------------------------------------
   Recovery Challenge Bank — 13 deterministic integrated scenarios (spec
   sections 48-62). Case distribution (section 62) is satisfied across the
   bank as a whole: 2 QC-material cases (1,2), 2 systematic-process cases
   (3,4), 1 random-instability case (5), 2 no-root-cause-initially cases
   (6,7), 2+ no-impact-demonstrated cases (2,9,12), 2 requires-review cases
   (3,10), 1 false-rejection case (7), 1 confirmation-bias case (13).
   ------------------------------------------------------------------------- */
export const INVESTIGATION_SCENARIOS = [
  {
    id: 1, title: "Case 1 — Control preparation problem",
    distribution: ["qc-material"],
    qcData: { signalType: "rejection", narrative: "One QC level shows an extreme result (Level 1, +3.5 SD). The other level is stable." },
    qcHistory: ["Run -3: both levels acceptable", "Run -2: both levels acceptable", "Run -1: both levels acceptable", "Run 0: Level 1 +3.5 SD (rejected), Level 2 +0.2 SD"],
    repeatQc: { performed: true, result: "normal", note: "A newly prepared aliquot of Level 1 returns to expected behaviour." },
    candidateImpactWindow: null,
    candidateHypothesisIds: ["qc-material", "instrument", "false-rejection"],
    supportedHypothesisId: "qc-material",
    evidenceItems: [
      { id: "e1", category: "qc-pattern", revealStage: "characterisation", title: "Single-level, single-analyte rejection", observation: "Only Level 1 is affected; Level 2 and other analytes are unaffected.", interpretation: "Points toward something specific to this control material rather than the whole analytical system.", supports: ["qc-material"], weakens: ["shared-system"], neutralFor: ["instrument"], strength: "moderate" },
      { id: "e2", category: "qc-material", revealStage: "evidence-1", title: "Reconstitution log", observation: "Incorrect reconstitution volume is documented for this vial.", interpretation: "Directly explains an artificially high control value without implying any patient-affecting process change.", supports: ["qc-material"], weakens: ["instrument", "false-rejection"], neutralFor: [], strength: "strong" },
      { id: "e3", category: "comparison", revealStage: "verification", title: "Newly prepared aliquot", observation: "A freshly prepared aliquot of the same lot returns to expected behaviour.", interpretation: "Corroborates the preparation-error explanation.", supports: ["qc-material"], weakens: [], neutralFor: [], strength: "strong" },
      { id: "e4", category: "patient-data", revealStage: "patient-impact", title: "Patient comparison", observation: "No corresponding shift is seen in concurrent patient results or in a comparison analyser.", interpretation: "No evidence that patients were analytically affected.", supports: [], weakens: [], neutralFor: [], strength: "moderate" }
    ],
    progressionByStage: [
      { stage: "signal", causeStatus: "no-hypothesis", processStatus: "validity-in-question", patientImpactStatus: "not-assessed", resultDispositionStatus: "indeterminate" },
      { stage: "hypothesis", causeStatus: "candidate-hypothesis", processStatus: "validity-in-question", patientImpactStatus: "not-assessed" },
      { stage: "verification", causeStatus: "strongly-corroborated", processStatus: "recovered", patientImpactStatus: "candidate-review-window-defined" },
      { stage: "resume-decision", causeStatus: "strongly-corroborated", processStatus: "recovered", patientImpactStatus: "no-impact-demonstrated" }
    ],
    patientImpactData: [],
    recoveryEvidence: ["Acceptable QC under the defined procedure (newly prepared aliquot)", "No corresponding patient/comparison shift"],
    finalInterpretation: { causeStatus: "strongly-corroborated", processStatus: "recovered", patientImpactStatus: "no-impact-demonstrated", resultDispositionStatus: "resolved", summary: "Strong evidence for a QC-material preparation issue. Patient analytical failure is not inferred solely from the original QC result." },
    unresolvedQuestions: [],
    correctResumeDecision: "yes",
    correctResultDispositionDecision: "yes"
  },
  {
    id: 2, title: "Case 2 — QC material deterioration",
    distribution: ["qc-material", "no-impact-demonstrated"],
    qcData: { signalType: "rejection", narrative: "One control material develops progressive abnormal behaviour over several runs. An alternate control material/lot remains stable." },
    qcHistory: ["Run -3: Level 2 +1.0 SD", "Run -2: Level 2 +1.8 SD", "Run -1: Level 2 +2.6 SD", "Run 0: Level 2 +3.3 SD (rejected)"],
    repeatQc: { performed: true, result: "still abnormal", note: "Repeat of the same vial remains elevated." },
    candidateImpactWindow: null,
    candidateHypothesisIds: ["qc-material", "reagent", "calibration"],
    supportedHypothesisId: "qc-material",
    evidenceItems: [
      { id: "e1", category: "qc-pattern", revealStage: "characterisation", title: "Progressive drift, one material only", observation: "Level 2 drifts upward across four runs; Level 1 and an alternate control lot remain stable throughout.", interpretation: "A gradual, material-specific pattern is more consistent with control deterioration than a sudden process-wide event.", supports: ["qc-material"], weakens: ["calibration"], neutralFor: [], strength: "moderate" },
      { id: "e2", category: "qc-material", revealStage: "evidence-1", title: "Alternate lot comparison", observation: "An alternate lot of the same control material, opened fresh, is stable.", interpretation: "Isolates the problem to this specific vial/lot rather than the assay.", supports: ["qc-material"], weakens: ["reagent", "calibration"], neutralFor: [], strength: "strong" },
      { id: "e3", category: "patient-data", revealStage: "patient-impact", title: "Concurrent patient comparison", observation: "Patient results over the same period show no corresponding shift when compared with a reference method.", interpretation: "No evidence of patient-affecting analytical change.", supports: [], weakens: [], neutralFor: [], strength: "moderate" }
    ],
    progressionByStage: [
      { stage: "signal", causeStatus: "no-hypothesis", processStatus: "validity-in-question", patientImpactStatus: "not-assessed", resultDispositionStatus: "indeterminate" },
      { stage: "evidence-1", causeStatus: "supported-hypothesis", processStatus: "evidence-of-instability", patientImpactStatus: "not-assessed" },
      { stage: "resume-decision", causeStatus: "strongly-corroborated", processStatus: "recovered", patientImpactStatus: "no-impact-demonstrated" }
    ],
    patientImpactData: [],
    recoveryEvidence: ["Alternate control lot performs acceptably", "Concurrent patient comparison unaffected"],
    finalInterpretation: { causeStatus: "strongly-corroborated", processStatus: "recovered", patientImpactStatus: "no-impact-demonstrated", resultDispositionStatus: "resolved", summary: "A QC-material-specific problem is strongly supported. Patient impact is not demonstrated." },
    unresolvedQuestions: [],
    correctResumeDecision: "yes",
    correctResultDispositionDecision: "yes"
  },
  {
    id: 3, title: "Case 3 — Reagent lot-associated shift",
    distribution: ["systematic-process", "requires-review"],
    qcData: { signalType: "rejection", narrative: "Both QC levels shift after a reagent lot change." },
    qcHistory: ["Run -2 (before lot change): both levels acceptable", "Run -1 (before lot change): both levels acceptable", "Run 0 (after lot change): Level 1 +2.9 SD, Level 2 +3.2 SD (rejected)"],
    repeatQc: { performed: true, result: "still abnormal", note: "Repeat with the same lot remains shifted." },
    timelineEvents: [
      { time: "08:00", label: "Accepted QC", kind: "qc" },
      { time: "10:20", label: "Reagent lot change", kind: "process" },
      { time: "10:35", label: "First QC after lot change — rejected", kind: "qc" }
    ],
    candidateImpactWindow: { start: "10:20", end: "12:00" },
    candidateHypothesisIds: ["reagent", "calibration", "instrument"],
    supportedHypothesisId: "reagent",
    evidenceItems: [
      { id: "e1", category: "qc-pattern", revealStage: "characterisation", title: "Both levels affected together", observation: "Both control levels shift in the same direction after the same event.", interpretation: "Consistent with a systematic (rather than random) process change.", supports: ["reagent", "calibration"], weakens: [], neutralFor: ["instrument"], strength: "moderate" },
      { id: "e2", category: "reagent", revealStage: "evidence-1", title: "Temporal association with lot change", observation: "A new reagent lot was introduced at 10:20, shortly before the shift was detected.", interpretation: "A plausible hypothesis, but temporal association alone does not establish causation.", supports: ["reagent"], weakens: [], neutralFor: [], strength: "weak" },
      { id: "e3", category: "reagent", revealStage: "hypothesis-update", title: "Alternate-lot comparison", observation: "Testing the previous reagent lot restores baseline QC behaviour.", interpretation: "Directly corroborates the reagent-lot hypothesis rather than merely correlating with it.", supports: ["reagent"], weakens: ["calibration", "instrument"], neutralFor: [], strength: "strong" },
      { id: "e4", category: "comparison", revealStage: "verification", title: "Independent comparison", observation: "A comparison method shows the same directional difference over the affected period.", interpretation: "Independent, converging evidence — evidence strongly supports a reagent-lot-associated analytical change (this does not mean the lot caused every individual patient discrepancy).", supports: ["reagent"], weakens: [], neutralFor: [], strength: "strong" }
    ],
    progressionByStage: [
      { stage: "signal", causeStatus: "no-hypothesis", processStatus: "validity-in-question", patientImpactStatus: "not-assessed", resultDispositionStatus: "indeterminate" },
      { stage: "evidence-1", causeStatus: "candidate-hypothesis", processStatus: "evidence-of-instability", patientImpactStatus: "candidate-review-window-defined" },
      { stage: "verification", causeStatus: "strongly-corroborated", processStatus: "recovery-being-verified", patientImpactStatus: "candidate-review-window-defined" },
      { stage: "patient-impact", causeStatus: "strongly-corroborated", processStatus: "recovered", patientImpactStatus: "potentially-exposed-results" },
      { stage: "resume-decision", causeStatus: "strongly-corroborated", processStatus: "recovered", patientImpactStatus: "potentially-exposed-results" }
    ],
    patientImpactData: [
      { syntheticPatientId: "P101", analysisTimestamp: "10:10", originalResult: 98, postRecoveryResult: 98 },
      { syntheticPatientId: "P102", analysisTimestamp: "10:40", originalResult: 100, postRecoveryResult: 104 },
      { syntheticPatientId: "P103", analysisTimestamp: "11:10", originalResult: 50, postRecoveryResult: 52 },
      { syntheticPatientId: "P104", analysisTimestamp: "11:50", originalResult: 0, postRecoveryResult: 1 }
    ],
    recoveryEvidence: ["Reverting to the previous reagent lot restores acceptable QC", "Independent comparison method confirms recovery"],
    finalInterpretation: { causeStatus: "strongly-corroborated", processStatus: "recovered", patientImpactStatus: "potentially-exposed-results", resultDispositionStatus: "review-required", summary: "A reagent-lot-associated analytical shift is strongly supported. The candidate patient review interval begins at the supported lot-change event in this scenario — this is scenario-specific, not a universal rule." },
    unresolvedQuestions: ["Whether every result in the candidate interval shows a material analytical effect, versus only some."],
    correctResumeDecision: "additional-evidence",
    correctResultDispositionDecision: "additional-review-required"
  },
  {
    id: 4, title: "Case 4 — Calibration-associated shift",
    distribution: ["systematic-process"],
    qcData: { signalType: "rejection", narrative: "QC is stable before calibration. Both levels shift afterward." },
    qcHistory: ["Run -2 (pre-calibration): both levels acceptable", "Run -1 (pre-calibration): both levels acceptable", "Run 0 (post-calibration): Level 1 +2.8 SD, Level 2 +3.0 SD (rejected)"],
    repeatQc: { performed: true, result: "still abnormal", note: "Repeat under the new calibration remains shifted." },
    candidateImpactWindow: { start: "calibration event", end: "corrective calibration" },
    candidateHypothesisIds: ["calibration", "reagent", "instrument"],
    supportedHypothesisId: "calibration",
    evidenceItems: [
      { id: "e1", category: "qc-pattern", revealStage: "characterisation", title: "Both levels shift together, temporally tied to calibration", observation: "The shift's onset coincides with the calibration event; both levels move in the same direction.", interpretation: "A plausible calibration-associated hypothesis, though temporal proximity alone is not proof.", supports: ["calibration"], weakens: [], neutralFor: [], strength: "weak" },
      { id: "e2", category: "calibration", revealStage: "evidence-1", title: "Independent calibration verification", observation: "An independent calibration verification material indicates a displacement consistent with the QC shift.", interpretation: "Directly corroborates a calibration-related mechanism.", supports: ["calibration"], weakens: ["reagent", "instrument"], neutralFor: [], strength: "strong" },
      { id: "e3", category: "calibration", revealStage: "intervention", title: "Corrective re-calibration", observation: "A corrective calibration restores QC performance.", interpretation: "Consistent with, but not by itself proof of, the calibration displacement hypothesis — restoring performance after an intervention is evidence, not certainty.", supports: ["calibration"], weakens: [], neutralFor: [], strength: "moderate" }
    ],
    progressionByStage: [
      { stage: "signal", causeStatus: "no-hypothesis", processStatus: "validity-in-question", patientImpactStatus: "not-assessed", resultDispositionStatus: "indeterminate" },
      { stage: "evidence-1", causeStatus: "supported-hypothesis", processStatus: "evidence-of-instability", patientImpactStatus: "candidate-review-window-defined" },
      { stage: "resume-decision", causeStatus: "strongly-corroborated", processStatus: "recovered", patientImpactStatus: "candidate-review-window-defined" }
    ],
    patientImpactData: [],
    recoveryEvidence: ["Independent calibration verification within limits after correction", "Both QC levels acceptable after corrective calibration"],
    finalInterpretation: { causeStatus: "strongly-corroborated", processStatus: "recovered", patientImpactStatus: "candidate-review-window-defined", resultDispositionStatus: "review-required", summary: "A calibration-associated systematic change is strongly supported. Temporal proximity to the calibration event alone would not have proven causation — the independent verification evidence is what corroborates it." },
    unresolvedQuestions: ["Whether patient results in the candidate window require individual review — not yet assessed in this case."],
    correctResumeDecision: "yes",
    correctResultDispositionDecision: "additional-review-required"
  },
  {
    id: 5, title: "Case 5 — Random aspiration instability",
    distribution: ["random-instability"],
    qcData: { signalType: "rejection", narrative: "Wide, alternating scatter is seen in both control levels." },
    qcHistory: ["Run -3: Level 1 +2.1 SD, Level 2 -1.9 SD", "Run -2: Level 1 -1.8 SD, Level 2 +2.2 SD", "Run -1: Level 1 +2.3 SD, Level 2 -1.7 SD", "Run 0: Level 1 -2.0 SD, Level 2 +3.1 SD (rejected)"],
    repeatQc: { performed: true, result: "still abnormal", note: "Repeat controls continue to scatter widely with alternating sign." },
    candidateImpactWindow: null,
    candidateHypothesisIds: ["instrument", "aspiration", "qc-material"],
    supportedHypothesisId: "instrument",
    evidenceItems: [
      { id: "e1", category: "qc-pattern", revealStage: "characterisation", title: "Wide alternating scatter, both levels", observation: "Both levels show wide scatter with alternating sign rather than a sustained directional shift.", interpretation: "A random-imprecision pattern is more consistent with an intermittent instrument/aspiration issue than a systematic reagent or calibration change.", supports: ["instrument", "aspiration"], weakens: ["calibration"], neutralFor: [], strength: "moderate" },
      { id: "e2", category: "instrument", revealStage: "evidence-1", title: "Aspiration-pressure alarm log", observation: "The instrument log shows intermittent aspiration-pressure alarms coinciding with the affected runs.", interpretation: "Directly corroborates an instrument/aspiration instability mechanism.", supports: ["instrument"], weakens: ["qc-material"], neutralFor: [], strength: "strong" },
      { id: "e3", category: "instrument", revealStage: "intervention", title: "Maintenance record", observation: "Scheduled maintenance addresses the aspiration system; alarms cease afterward.", interpretation: "Consistent with resolution of the identified instrument issue.", supports: ["instrument"], weakens: [], neutralFor: [], strength: "strong" }
    ],
    progressionByStage: [
      { stage: "signal", causeStatus: "no-hypothesis", processStatus: "validity-in-question", patientImpactStatus: "not-assessed", resultDispositionStatus: "indeterminate" },
      { stage: "evidence-1", causeStatus: "supported-hypothesis", processStatus: "evidence-of-instability", patientImpactStatus: "candidate-review-window-defined" },
      { stage: "resume-decision", causeStatus: "strongly-corroborated", processStatus: "recovered", patientImpactStatus: "candidate-review-window-defined" }
    ],
    patientImpactData: [],
    recoveryEvidence: ["Aspiration-pressure alarms cease after maintenance", "QC scatter returns to expected range across both levels"],
    finalInterpretation: { causeStatus: "strongly-corroborated", processStatus: "recovered", patientImpactStatus: "candidate-review-window-defined", resultDispositionStatus: "review-required", summary: "Instrument/aspiration instability is strongly supported by the alarm log and the maintenance response. Case pattern A: the instrument issue is corrected and recovery QC is acceptable, so current testing can resume — but several earlier results generated during the intermittent scatter remain under comparison/review. Process recovery and historical result disposition are separate decisions here: ProcessStatus = recovered does not by itself resolve ResultDispositionStatus, which remains review-required." },
    unresolvedQuestions: ["Whether any specific patient results during the intermittent period warrant individual review."],
    correctResumeDecision: "yes",
    correctResultDispositionDecision: "additional-review-required"
  },
  {
    id: 6, title: "Case 6 — Passing repeat trap",
    distribution: ["no-root-cause-initially"],
    qcData: { signalType: "rejection", narrative: "Level 1 rejects at +3.2 SD. An immediate repeat is normal. No cause is identified initially." },
    qcHistory: ["Run -2: both levels acceptable", "Run -1: both levels acceptable", "Run 0: Level 1 +3.2 SD (rejected)", "Immediate repeat: Level 1 +0.2 SD (normal)"],
    repeatQc: { performed: true, result: "normal", note: "The immediate repeat is well within limits — but see the repeat-QC principle: this does not by itself resolve the original signal." },
    candidateImpactWindow: null,
    candidateHypothesisIds: ["instrument", "qc-material", "false-rejection", "insufficient-evidence"],
    supportedHypothesisId: "instrument",
    evidenceItems: [
      { id: "e1", category: "qc-pattern", revealStage: "characterisation", title: "Isolated single-run event", observation: "Only the one run is affected; the immediate repeat and subsequent runs are unremarkable.", interpretation: "Consistent with several explanations — insufficient on its own to identify a mechanism.", supports: ["false-rejection", "instrument"], weakens: [], neutralFor: ["qc-material"], strength: "weak" },
      { id: "e2", category: "instrument", revealStage: "verification", title: "Retrospective instrument log review", observation: "The instrument log later shows a transient probe fault recorded at the exact time of the first control measurement.", interpretation: "Provides a specific, corroborated explanation for the original event — arriving only after the fact.", supports: ["instrument"], weakens: ["qc-material", "false-rejection"], neutralFor: [], strength: "strong" }
    ],
    progressionByStage: [
      { stage: "signal", causeStatus: "no-hypothesis", processStatus: "validity-in-question", patientImpactStatus: "not-assessed", resultDispositionStatus: "indeterminate" },
      { stage: "hypothesis", causeStatus: "no-hypothesis", processStatus: "validity-in-question", patientImpactStatus: "not-assessed" },
      { stage: "verification", causeStatus: "supported-hypothesis", processStatus: "recovered", patientImpactStatus: "potentially-exposed-results" },
      { stage: "resume-decision", causeStatus: "supported-hypothesis", processStatus: "recovered", patientImpactStatus: "potentially-exposed-results" }
    ],
    patientImpactData: [],
    recoveryEvidence: ["Immediate repeat and all subsequent QC acceptable", "Retrospective technical evidence explaining the original event"],
    finalInterpretation: { causeStatus: "supported-hypothesis", processStatus: "recovered", patientImpactStatus: "potentially-exposed-results", resultDispositionStatus: "review-required", summary: "The passing repeat did not invalidate the original event — the later technical evidence (a transient probe fault) provides the explanation, arriving after the fact rather than at the time of the repeat." },
    unresolvedQuestions: ["Whether the one patient specimen tested at the time of the original signal requires review."],
    correctResumeDecision: "additional-evidence",
    correctResultDispositionDecision: "additional-review-required"
  },
  {
    id: 7, title: "Case 7 — False rejection remains plausible",
    distribution: ["no-root-cause-initially", "false-rejection", "no-impact-demonstrated"],
    qcData: { signalType: "rejection", narrative: "A single isolated rejection signal occurs on one level; the other level is stable and no trend is present." },
    qcHistory: ["Run -3: both levels acceptable", "Run -2: both levels acceptable", "Run -1: both levels acceptable", "Run 0: Level 1 +3.1 SD (rejected), Level 2 +0.1 SD", "Run +1 (repeat, appropriately obtained): both levels acceptable", "Run +2: both levels acceptable", "Run +3: both levels acceptable"],
    repeatQc: { performed: true, result: "normal", note: "Multiple subsequent, appropriately obtained controls remain stable." },
    candidateImpactWindow: null,
    candidateHypothesisIds: ["false-rejection", "instrument", "qc-material"],
    supportedHypothesisId: null,
    evidenceItems: [
      { id: "e1", category: "qc-pattern", revealStage: "characterisation", title: "Single isolated event, no trend", observation: "Only one level, one run, is affected; no trend precedes or follows it.", interpretation: "Consistent with a chance rejection under the statistical rules in use.", supports: ["false-rejection"], weakens: [], neutralFor: [], strength: "weak" },
      { id: "e2", category: "instrument", revealStage: "evidence-1", title: "No analyser/reagent/calibration event", observation: "No analyser alarm, reagent change, or calibration event is recorded around the time of the signal.", interpretation: "No corroborating technical evidence for any specific mechanism.", supports: ["false-rejection"], weakens: ["instrument", "qc-material"], neutralFor: [], strength: "moderate" },
      { id: "e3", category: "patient-data", revealStage: "verification", title: "No corroborating patient/comparison evidence", observation: "No comparison method or patient-summary evidence supports a sustained process disturbance.", interpretation: "Further weakens the case for a real process disturbance, though it cannot mathematically prove the rejection was false.", supports: ["false-rejection"], weakens: [], neutralFor: [], strength: "moderate" }
    ],
    progressionByStage: [
      { stage: "signal", causeStatus: "no-hypothesis", processStatus: "validity-in-question", patientImpactStatus: "not-assessed", resultDispositionStatus: "indeterminate" },
      { stage: "verification", causeStatus: "unresolved", processStatus: "apparently-stable", patientImpactStatus: "not-assessed" },
      { stage: "resume-decision", causeStatus: "unresolved", processStatus: "apparently-stable", patientImpactStatus: "no-impact-demonstrated" }
    ],
    patientImpactData: [],
    recoveryEvidence: ["Multiple subsequent appropriately-obtained controls remain stable"],
    finalInterpretation: { causeStatus: "unresolved", processStatus: "apparently-stable", patientImpactStatus: "no-impact-demonstrated", resultDispositionStatus: "resolved", summary: "No sustained process disturbance is demonstrated. Statistical false rejection remains plausible — but this has not been, and cannot be, proven mathematically from a single case." },
    unresolvedQuestions: ["Whether this specific event was a true chance rejection or an undetected transient issue — inherently unresolvable from this evidence alone."],
    correctResumeDecision: "yes",
    correctResultDispositionDecision: "not-applicable"
  },
  {
    id: 8, title: "Case 8 — Multi-analyte shared-system disturbance",
    distribution: ["shared-system"],
    qcData: { signalType: "rejection", narrative: "Several assays on a common analytical subsystem shift simultaneously." },
    qcHistory: ["Run -1: all assays acceptable", "Run 0: three unrelated assays sharing a common subsystem all show a rejected or warning signal simultaneously"],
    repeatQc: { performed: true, result: "still abnormal", note: "Repeats across the affected assays remain shifted." },
    candidateImpactWindow: null,
    candidateHypothesisIds: ["shared-system", "assay-specific", "reagent"],
    supportedHypothesisId: "shared-system",
    evidenceItems: [
      { id: "e1", category: "cross-assay", revealStage: "characterisation", title: "Simultaneous multi-assay shift", observation: "Several assays that share a common analytical subsystem, but use different reagents, shift together.", interpretation: "A shared-system explanation is more consistent than an assay-specific reagent issue, since the affected assays do not share a reagent lot.", supports: ["shared-system"], weakens: ["reagent", "assay-specific"], neutralFor: [], strength: "moderate" },
      { id: "e2", category: "instrument", revealStage: "evidence-1", title: "Independent subsystem diagnostic event", observation: "An independent analyser diagnostic log shows an event affecting the shared subsystem at the relevant time.", interpretation: "Corroborates a shared-system disturbance, though the specific physical cause is not yet identified.", supports: ["shared-system"], weakens: [], neutralFor: [], strength: "strong" }
    ],
    progressionByStage: [
      { stage: "signal", causeStatus: "no-hypothesis", processStatus: "validity-in-question", patientImpactStatus: "not-assessed", resultDispositionStatus: "indeterminate" },
      { stage: "evidence-1", causeStatus: "supported-hypothesis", processStatus: "evidence-of-instability", patientImpactStatus: "candidate-review-window-defined" },
      { stage: "resume-decision", causeStatus: "supported-hypothesis", processStatus: "recovered", patientImpactStatus: "candidate-review-window-defined" }
    ],
    patientImpactData: [],
    recoveryEvidence: ["All affected assays return to acceptable QC after the subsystem is serviced"],
    finalInterpretation: { causeStatus: "supported-hypothesis", processStatus: "recovered", patientImpactStatus: "candidate-review-window-defined", resultDispositionStatus: "review-required", summary: "The shared-analytical-system hypothesis is strengthened by the cross-assay pattern and the diagnostic log. No specific physical cause is assigned beyond what the evidence identifies." },
    unresolvedQuestions: ["The precise physical root cause within the shared subsystem remains outside this scenario's evidence."],
    correctResumeDecision: "yes",
    correctResultDispositionDecision: "additional-review-required"
  },
  {
    id: 9, title: "Case 9 — Assay-specific disturbance",
    distribution: ["no-impact-demonstrated"],
    qcData: { signalType: "rejection", narrative: "One assay is affected. Other assays sharing the same platform remain stable." },
    qcHistory: ["Run -1: all assays acceptable", "Run 0: only Assay X shows a rejected signal; all other assays on the same platform are acceptable"],
    repeatQc: { performed: true, result: "still abnormal", note: "Repeat of Assay X remains shifted; other assays remain unaffected." },
    candidateImpactWindow: null,
    candidateHypothesisIds: ["assay-specific", "reagent", "shared-system"],
    supportedHypothesisId: "assay-specific",
    evidenceItems: [
      { id: "e1", category: "cross-assay", revealStage: "characterisation", title: "Isolated to one assay", observation: "Only Assay X is affected; every other assay on the shared platform is acceptable.", interpretation: "Weakens a shared-system explanation and points toward something specific to Assay X.", supports: ["assay-specific"], weakens: ["shared-system"], neutralFor: [], strength: "moderate" },
      { id: "e2", category: "reagent", revealStage: "evidence-1", title: "Assay X reagent-specific evidence", observation: "Assay X's reagent lot comparison shows a difference specific to the current lot; other assays use unrelated reagents.", interpretation: "Corroborates an assay-specific (reagent-related) disturbance.", supports: ["assay-specific", "reagent"], weakens: ["shared-system"], neutralFor: [], strength: "strong" }
    ],
    progressionByStage: [
      { stage: "signal", causeStatus: "no-hypothesis", processStatus: "validity-in-question", patientImpactStatus: "not-assessed", resultDispositionStatus: "indeterminate" },
      { stage: "evidence-1", causeStatus: "strongly-corroborated", processStatus: "evidence-of-instability", patientImpactStatus: "candidate-review-window-defined" },
      { stage: "resume-decision", causeStatus: "strongly-corroborated", processStatus: "recovered", patientImpactStatus: "no-impact-demonstrated" }
    ],
    patientImpactData: [],
    recoveryEvidence: ["Reverting Assay X's reagent lot restores acceptable QC", "Other assays unaffected throughout"],
    finalInterpretation: { causeStatus: "strongly-corroborated", processStatus: "recovered", patientImpactStatus: "no-impact-demonstrated", resultDispositionStatus: "routine-release", summary: "An assay-specific, rather than global system, disturbance is supported. In this scenario the reagent issue was caught before any patient results were released for Assay X, so patient impact is not demonstrated." },
    unresolvedQuestions: [],
    correctResumeDecision: "yes",
    correctResultDispositionDecision: "not-applicable"
  },
  {
    id: 10, title: "Case 10 — Patient impact window narrowing",
    distribution: ["requires-review"],
    qcData: { signalType: "rejection", narrative: "Last accepted QC 08:00; reagent lot change 10:30; rejected QC 12:00." },
    qcHistory: ["08:00: accepted QC", "12:00: Level 1 +3.0 SD, Level 2 +2.9 SD (rejected)"],
    repeatQc: { performed: true, result: "still abnormal", note: "Repeat at 12:10 remains shifted." },
    timelineEvents: [
      { time: "08:00", label: "Last accepted QC", kind: "qc" },
      { time: "10:30", label: "Reagent lot change", kind: "process" },
      { time: "12:00", label: "Rejected QC", kind: "qc" }
    ],
    candidateImpactWindow: { start: "10:30", end: "12:00" },
    candidateHypothesisIds: ["reagent", "calibration"],
    supportedHypothesisId: "reagent",
    evidenceItems: [
      { id: "e1", category: "qc-pattern", revealStage: "characterisation", title: "Wide initial window", observation: "The interval between the last accepted QC (08:00) and the rejected QC (12:00) spans four hours.", interpretation: "Without further evidence, the entire four-hour window is only a candidate interval, not a confirmed exposure window.", supports: [], weakens: [], neutralFor: [], strength: "weak" },
      { id: "e2", category: "reagent", revealStage: "evidence-1", title: "Reagent-lot investigation", observation: "Investigation strongly supports the 10:30 reagent-lot change as the analytical disturbance (reverting the lot restores baseline).", interpretation: "Provides scenario-specific evidence that can narrow the candidate window — this narrowing is not a general rule.", supports: ["reagent"], weakens: ["calibration"], neutralFor: [], strength: "strong" },
      { id: "e3", category: "patient-data", revealStage: "patient-impact", title: "Retrospective patient comparison", observation: "Synthetic retrospective comparison shows no shift in results before 10:30, and a consistent difference in results after 10:30.", interpretation: "Corroborates narrowing the candidate review interval to 10:30–12:00 specifically within this scenario.", supports: ["reagent"], weakens: [], neutralFor: [], strength: "strong" }
    ],
    progressionByStage: [
      { stage: "signal", causeStatus: "no-hypothesis", processStatus: "validity-in-question", patientImpactStatus: "not-assessed", resultDispositionStatus: "indeterminate" },
      { stage: "evidence-1", causeStatus: "strongly-corroborated", processStatus: "evidence-of-instability", patientImpactStatus: "candidate-review-window-defined" },
      { stage: "patient-impact", causeStatus: "strongly-corroborated", processStatus: "recovered", patientImpactStatus: "analytical-impact-evidence-present" },
      { stage: "resume-decision", causeStatus: "strongly-corroborated", processStatus: "recovered", patientImpactStatus: "analytical-impact-evidence-present" }
    ],
    patientImpactData: [
      { syntheticPatientId: "P201", analysisTimestamp: "09:00", originalResult: 100, postRecoveryResult: 100 },
      { syntheticPatientId: "P202", analysisTimestamp: "10:00", originalResult: 80, postRecoveryResult: 80 },
      { syntheticPatientId: "P203", analysisTimestamp: "10:45", originalResult: 100, postRecoveryResult: 105 },
      { syntheticPatientId: "P204", analysisTimestamp: "11:30", originalResult: 60, postRecoveryResult: 63 }
    ],
    recoveryEvidence: ["Reverting the reagent lot restores acceptable QC", "Retrospective comparison confirms recovery after the lot revert"],
    finalInterpretation: { causeStatus: "strongly-corroborated", processStatus: "recovered", patientImpactStatus: "analytical-impact-evidence-present", resultDispositionStatus: "amendment-or-reissue-being-considered", summary: "Within this specific scenario, evidence narrows the candidate patient-review interval to 10:30–12:00. Not every result after 10:30 is automatically labelled clinically incorrect — each requires its own assessment against the illustrative scenario-specific review threshold. Amendment or reissue may need to be considered according to the laboratory's validated procedure and clinical context." },
    unresolvedQuestions: ["Whether the demonstrated analytical differences reach clinical significance for any individual patient — outside this model's scope."],
    correctResumeDecision: "additional-evidence",
    correctResultDispositionDecision: "additional-review-required"
  },
  {
    id: 11, title: "Case 11 — Unresolved root cause",
    distribution: ["no-root-cause-initially"],
    qcData: { signalType: "rejection", narrative: "QC rejects. A repeat passes. No technical event is found, and subsequent evidence is inconsistent." },
    qcHistory: ["Run -1: both levels acceptable", "Run 0: Level 2 +3.3 SD (rejected)", "Repeat: Level 2 +0.4 SD (normal)", "Run +1: Level 2 +1.9 SD (below rejection, but higher than baseline)", "Run +2: Level 2 +0.3 SD"],
    repeatQc: { performed: true, result: "normal", note: "Passes, but subsequent runs show inconsistent behaviour rather than a clean return to baseline." },
    candidateImpactWindow: null,
    candidateHypothesisIds: ["instrument", "qc-material", "reagent", "false-rejection", "insufficient-evidence"],
    supportedHypothesisId: null,
    evidenceItems: [
      { id: "e1", category: "qc-pattern", revealStage: "characterisation", title: "Inconsistent subsequent pattern", observation: "Runs after the repeat are not uniformly acceptable — one run is elevated but below the rejection limit.", interpretation: "Does not cleanly fit a single-event explanation (like a one-off preparation error) or a fully resolved false rejection.", supports: [], weakens: ["false-rejection", "qc-material"], neutralFor: [], strength: "weak" },
      { id: "e2", category: "instrument", revealStage: "evidence-1", title: "No technical event found", observation: "No analyser alarm, reagent change, calibration event, or documented preparation error is found for any of the affected runs.", interpretation: "No corroborating evidence for any specific candidate hypothesis.", supports: [], weakens: ["instrument", "reagent", "qc-material"], neutralFor: [], strength: "moderate" }
    ],
    progressionByStage: [
      { stage: "signal", causeStatus: "no-hypothesis", processStatus: "validity-in-question", patientImpactStatus: "not-assessed", resultDispositionStatus: "indeterminate" },
      { stage: "evidence-1", causeStatus: "unresolved", processStatus: "indeterminate", patientImpactStatus: "impact-unresolved" },
      { stage: "resume-decision", causeStatus: "unresolved", processStatus: "indeterminate", patientImpactStatus: "impact-unresolved" }
    ],
    patientImpactData: [],
    recoveryEvidence: [],
    finalInterpretation: { causeStatus: "unresolved", processStatus: "indeterminate", patientImpactStatus: "impact-unresolved", resultDispositionStatus: "indeterminate", summary: "The cause remains unresolved. This case deliberately does not force a fabricated root cause — the learner must decide whether more verification is necessary before full routine resumption." },
    unresolvedQuestions: ["Whether the inconsistent subsequent pattern reflects ongoing instability or unrelated noise.", "Whether additional targeted verification (e.g. alternate control lot, comparison method) would be more informative than continuing to repeat the same control."],
    correctResumeDecision: "additional-evidence",
    correctResultDispositionDecision: "additional-review-required"
  },
  {
    id: 12, title: "Case 12 — Indiscriminate patient retesting trap",
    distribution: ["qc-material", "no-impact-demonstrated"],
    qcData: { signalType: "rejection", narrative: "A QC abnormality is ultimately shown to be QC-material-specific." },
    qcHistory: ["Run -1: both levels acceptable", "Run 0: Level 1 +3.4 SD (rejected)"],
    repeatQc: { performed: true, result: "normal", note: "A newly prepared aliquot passes." },
    candidateImpactWindow: null,
    candidateHypothesisIds: ["qc-material", "instrument"],
    supportedHypothesisId: "qc-material",
    evidenceItems: [
      { id: "e1", category: "qc-material", revealStage: "evidence-1", title: "Vial-specific defect", observation: "The affected vial shows visible signs of improper storage; a new vial from the same lot performs normally.", interpretation: "Strongly supports a QC-material-specific (not process-wide) issue.", supports: ["qc-material"], weakens: ["instrument"], neutralFor: [], strength: "strong" },
      { id: "e2", category: "patient-data", revealStage: "patient-impact", title: "Patient-system performance evidence", observation: "Independent evidence (comparison method, cross-assay pattern) indicates patient-system performance remained stable throughout.", interpretation: "There is no supporting evidence for a patient-affecting process disturbance.", supports: [], weakens: [], neutralFor: [], strength: "strong" }
    ],
    progressionByStage: [
      { stage: "signal", causeStatus: "no-hypothesis", processStatus: "validity-in-question", patientImpactStatus: "not-assessed", resultDispositionStatus: "indeterminate" },
      { stage: "evidence-1", causeStatus: "strongly-corroborated", processStatus: "recovered", patientImpactStatus: "not-assessed" },
      { stage: "resume-decision", causeStatus: "strongly-corroborated", processStatus: "recovered", patientImpactStatus: "no-impact-demonstrated" }
    ],
    patientImpactData: [],
    recoveryEvidence: ["New vial from the same lot performs acceptably", "Independent patient-system performance evidence is stable"],
    finalInterpretation: { causeStatus: "strongly-corroborated", processStatus: "recovered", patientImpactStatus: "no-impact-demonstrated", resultDispositionStatus: "resolved", summary: "Patient retesting is not supported merely because the control material failed, when independent evidence indicates patient-system performance remained stable. Repeating every patient sample since the last QC would not be justified by this evidence. Case pattern B: a QC-material-specific problem, once independent evidence shows stable patient-system performance, does not justify indiscriminate patient retesting or continued result review." },
    unresolvedQuestions: [],
    correctResumeDecision: "yes",
    correctResultDispositionDecision: "yes"
  },
  {
    id: 13, title: "Case 13 — Confirmation-bias trap: shift precedes the lot change",
    distribution: ["confirmation-bias"],
    qcData: { signalType: "rejection", narrative: "A reagent lot change occurs, but careful review shows the QC shift clearly precedes it." },
    qcHistory: ["Run -3: both levels acceptable", "Run -2: Level 1 +1.6 SD (early, unnoticed upward drift begins)", "Run -1: Level 1 +2.4 SD — reagent lot changed shortly after this run", "Run 0: Level 1 +3.1 SD (rejected)"],
    repeatQc: { performed: true, result: "still abnormal", note: "Repeat with the new lot remains shifted." },
    timelineEvents: [
      { time: "07:00", label: "Run -2: early upward drift begins (unnoticed)", kind: "qc" },
      { time: "08:30", label: "Run -1: further drift", kind: "qc" },
      { time: "08:45", label: "Reagent lot change", kind: "process" },
      { time: "09:15", label: "Run 0: rejected", kind: "qc" }
    ],
    candidateImpactWindow: null,
    candidateHypothesisIds: ["reagent", "instrument", "calibration", "insufficient-evidence"],
    supportedHypothesisId: null,
    evidenceItems: [
      { id: "e1", category: "reagent", revealStage: "hypothesis", title: "Attractive temporal hypothesis", observation: "The reagent lot changed shortly before the rejected run — an appealing, readily-available explanation.", interpretation: "A plausible candidate hypothesis, but only a hypothesis at this stage.", supports: ["reagent"], weakens: [], neutralFor: [], strength: "weak" },
      { id: "e2", category: "qc-pattern", revealStage: "evidence-1", title: "Careful review of the QC history", observation: "Reviewing the full QC history shows the upward drift was already present two runs before the lot change.", interpretation: "The shift began before the reagent lot changed — the lot change cannot be the onset of this particular drift.", supports: [], weakens: ["reagent"], neutralFor: [], strength: "strong" },
      { id: "e3", category: "reagent", revealStage: "hypothesis-update", title: "Alternate-lot comparison", observation: "Testing the previous reagent lot reproduces the same shift.", interpretation: "Directly rules out the reagent lot as the mechanism — the same abnormal behaviour occurs regardless of lot.", supports: [], weakens: ["reagent"], neutralFor: [], strength: "strong" }
    ],
    progressionByStage: [
      { stage: "signal", causeStatus: "no-hypothesis", processStatus: "validity-in-question", patientImpactStatus: "not-assessed", resultDispositionStatus: "indeterminate" },
      { stage: "hypothesis", causeStatus: "candidate-hypothesis", processStatus: "evidence-of-instability", patientImpactStatus: "not-assessed" },
      { stage: "hypothesis-update", causeStatus: "unresolved", processStatus: "evidence-of-instability", patientImpactStatus: "candidate-review-window-defined" },
      { stage: "resume-decision", causeStatus: "unresolved", processStatus: "evidence-of-instability", patientImpactStatus: "candidate-review-window-defined" }
    ],
    patientImpactData: [],
    recoveryEvidence: [],
    finalInterpretation: { causeStatus: "unresolved", processStatus: "evidence-of-instability", patientImpactStatus: "candidate-review-window-defined", resultDispositionStatus: "review-required", summary: "The temporally attractive reagent-lot hypothesis is weakened and effectively ruled out by careful timeline review and an alternate-lot comparison. The true mechanism remains unresolved — this case is a deliberate confirmation-bias challenge: do not accept the first plausible, temporally-adjacent explanation without testing it against the evidence." },
    unresolvedQuestions: ["What actually caused the drift that began before the lot change.", "Whether testing should resume before this is resolved."],
    correctResumeDecision: "no",
    correctResultDispositionDecision: "no"
  }
];

/* Confirmation that the mandatory case-distribution requirement (spec
   section 62) is met is verified programmatically in test-investigation.js
   against the `distribution` tags above, not asserted here. */

