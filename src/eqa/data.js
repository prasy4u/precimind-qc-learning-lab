/* =========================================================================
   RECOVERY PROVENANCE NOTE (added during Stage 6B recovery):
   Artifact Class A — directly recovered from recovery/original-v0.8.html
   (SHA-256: e5317bf135f350b258428b985c1034a081e244a295f2e580c93cb6a6a091c8e4)
   Source lines: 8671-9545 (External Assurance Lab static data section)
   Historical reported v0.8 commit: 3cc62b1 (not independently verified)
   Recovery date: 2026-09-01
   The block below is the unmodified source text from the HTML artifact.
   ========================================================================= */

/* =========================================================================
   External Assurance Lab (QC-10) — v0.6 static teaching content, status-
   model text, guardrail notes, and the deterministic 14-scenario External
   Assurance Challenge Bank. Calculation logic lives only in
   23-eqa-calc.js; this file holds structure and text consumed by the UI,
   in the same pattern as 20-investigation-data.js.
   ========================================================================= */

/* -------------------------------------------------------------------------
   Principal reasoning pathway (spec header) and mandatory core teaching
   (spec sections 4-5).
   ------------------------------------------------------------------------- */
const EXTERNAL_ASSURANCE_PATHWAY_STEPS = ["Internal stability", "External comparison", "Understand the target", "Interpret deviation", "Assess method/laboratory effect", "Review longitudinally", "Investigate"];
const EXTERNAL_ASSURANCE_PATHWAY_CAUTION = "This is an educational reasoning pathway, not a rigid universal sequence — real EQA interpretation may revisit earlier steps as evidence emerges, exactly as the Investigation Lab's own reasoning pathway does.";

const GOOD_IQC_DOES_NOT_PROVE_TRUENESS_NOTE = "Good IQC does not prove trueness or inter-laboratory comparability.";
const POOR_EQA_DOES_NOT_AUTOMATICALLY_PROVE_BIAS_NOTE = "A poor EQA result does not automatically prove that routine patient results are biased. Interpretation depends on the design and evidentiary capability of the EQA scheme.";

/* -------------------------------------------------------------------------
   Terminology (spec section 5).
   ------------------------------------------------------------------------- */
const EQA_TERMINOLOGY = [
  { term: "EQA — External Quality Assessment", def: "The general process of objectively evaluating a laboratory's performance using material(s) provided by an outside organisation, comparing results against other participants, a peer group, or an assigned target." },
  { term: "PT — Proficiency Testing", def: "A commonly used approach to EQA in which a laboratory's performance is assessed against a defined criterion, often as part of a formal, sometimes regulatory, programme." }
];
const EQA_PT_TERMINOLOGY_CAUTION = "Terminology and regulatory usage vary between settings and countries, and PT is commonly used as one EQA approach among others — but not every EQA programme is identical to every regulatory PT scheme. This application uses \"EQA\" as the general umbrella term and \"PT\" where a scenario specifically concerns a proficiency-testing-style programme.";

/* -------------------------------------------------------------------------
   Core distinction (spec section 2) — a prominent three-way comparison.
   Deliberately NOT reduced to "IQC = precision, EQA = accuracy" (spec
   section 2: that description is pedagogically convenient but incomplete).
   ------------------------------------------------------------------------- */
const CORE_THREE_WAY_DISTINCTION = [
  { id: "iqc", label: "Internal QC", question: "Is the analytical process behaving consistently relative to its established control state?" },
  { id: "eqa", label: "EQA / PT", question: "Depending on scheme design, how does this laboratory compare with an assigned target, other laboratories, a method group, or a higher-order reference?" },
  { id: "comparability", label: "Comparability assessment", question: "Do different measurement systems provide sufficiently comparable results for the intended clinical use?" }
];
const NOT_SIMPLY_PRECISION_VS_ACCURACY_NOTE = "Do not define IQC simply as \"precision\" and EQA simply as \"accuracy.\" Those descriptions are pedagogically convenient but incomplete — IQC can also reveal certain systematic changes relative to its own control state, and EQA's evidentiary capability depends heavily on scheme design (target type, commutability, grouping), not on the word \"accuracy\" alone.";

/* -------------------------------------------------------------------------
   Signature misconception (spec section 3) — mandatory v0.6 lesson.
   ------------------------------------------------------------------------- */
const SIGNATURE_MISCONCEPTION_CASE = {
  iqcNarrative: "Internal QC has been beautifully stable for six months — both control levels tracking close to their means, no rule violations, no trends.",
  eqaNarrative: "Across the same period, EQA/PT shows a persistent +7% deviation from a suitable reference-assigned target.",
  question: "Can an analytical system be internally stable and externally biased?",
  correctAnswer: "Yes.",
  explanation: "Stable IQC demonstrates consistency around the process's current state; it does not independently establish agreement with a higher-order target."
};

/* -------------------------------------------------------------------------
   EQA is not real-time IQC (spec section 4).
   ------------------------------------------------------------------------- */
const EQA_NOT_REALTIME_IQC_NOTE = "EQA/PT is generally periodic rather than continuous and therefore does not substitute for surveillance of day-to-day analytical stability.";
const EQA_CAN_REVEAL = [
  "participant-specific problems",
  "method-group differences",
  "calibration/traceability issues",
  "inter-laboratory variability",
  "longer-term performance concerns"
];
const EQA_REVEAL_DEPENDENCY_NOTE = "What a given EQA round can reveal depends on scheme design — not every scheme can reveal every item on this list. This application does not imply EQA can routinely detect today's analytical failure quickly enough to replace IQC.";

/* -------------------------------------------------------------------------
   EQA result data model (spec section 6) — documented for teaching
   purposes. Not every field has to be populated in every scenario; missing
   information remains missing rather than being invented (enforced by
   convention across EXTERNAL_ASSURANCE_CASES below: absent fields are
   simply omitted, never filled with an invented placeholder value).
   ------------------------------------------------------------------------- */
const EQA_RESULT_FIELDS = [
  { field: "id", def: "A unique identifier for this EQA result/round." },
  { field: "round", def: "Which distribution/round this result belongs to." },
  { field: "measurand", def: "The analyte or quantity being measured." },
  { field: "participantResult", def: "The value this participant/laboratory reported." },
  { field: "units", def: "The units of the reported result." },
  { field: "assignedValue", def: "The target value this result is being compared against." },
  { field: "assignedValueType", def: "What kind of target the assigned value is — see Target Value Types." },
  { field: "assignedValueUncertainty", def: "The uncertainty associated with the assigned value, where stated." },
  { field: "commutabilityStatus", def: "Whether the material's commutability for this comparison has been verified, established, or is unknown." },
  { field: "participantMethod", def: "The measurement procedure/method used by this participant." },
  { field: "peerGroup", def: "How the peer group for comparison was defined (e.g. by method, by instrument)." },
  { field: "peerGroupMean", def: "The mean result reported by the participant's peer group, where available." },
  { field: "allParticipantMean", def: "The mean result across all participants in the scheme, where available." },
  { field: "sdpa", def: "The standard deviation for proficiency assessment, used for z-score calculation where the scheme supplies one." },
  { field: "performanceCriterion", def: "The type and value of the criterion used to judge acceptability for this round, where stated." },
  { field: "schemeCapability", def: "What is known about this scheme's design properties (commutability verification, target type, grouping, replicates, stated criterion)." },
  { field: "interpretationLimitations", def: "Explicit statements of what this particular round cannot establish, given its design." }
];
const MISSING_FIELDS_STAY_MISSING_NOTE = "Not every field in this structure has to be populated in every scenario. Where a scheme does not report something, this application leaves it missing rather than inventing a plausible-looking value.";

/* -------------------------------------------------------------------------
   Target value types (spec section 7) — never all called "the true value".
   Labels/enum live in 23-eqa-calc.js (TARGET_VALUE_TYPES); descriptions
   for teaching content live here.
   ------------------------------------------------------------------------- */
const TARGET_VALUE_TYPE_DESCRIPTIONS = [
  { id: "reference-measurement-procedure", description: "A value assigned using a reference measurement procedure — where available, often the strongest available metrological comparator, but still one specific kind of comparator, not automatically \"the true value.\"" },
  { id: "certified-reference-material", description: "A value assigned from a certified reference material, where the material and measurand are suitable for that certification." },
  { id: "method-specific-peer-group-mean", description: "The mean result among participants using the same (or a closely related) measurement method — answers \"how does this result compare with others using my method?\"" },
  { id: "manufacturer-instrument-peer-group-mean", description: "The mean result among participants using the same manufacturer's instrument/reagent system — a specific kind of peer grouping." },
  { id: "all-participant-consensus", description: "The mean or median across every participant in the distribution, regardless of method — a broad consensus value, not a higher-order reference." },
  { id: "expert-organiser-assigned", description: "A value assigned by expert consensus or by the scheme organiser using a defined procedure, used where a reference procedure or full consensus is not practical." },
  { id: "target-insufficiently-described", description: "The scheme materials do not adequately describe how the target was assigned — a real and important state, not an error to hide." }
];
const NEVER_ALL_CALLED_TRUE_VALUE_NOTE = "None of these target types is referred to as \"the true value\" in this application. Each answers a different question about what the participant's result is being compared with.";

/* -------------------------------------------------------------------------
   Target hierarchy guardrail (spec section 8).
   ------------------------------------------------------------------------- */
const TARGET_HIERARCHY_GUARDRAIL_NOTE = "This application does not teach that a reference-method target always exists. For many measurands, suitable higher-order reference measurement systems may be unavailable. Where no reference target exists, peer-group or consensus evaluation may still provide valuable information, but it answers a different question.";

/* Small classification exercise (EQA Target Lab) — five short, deterministic
   scenario descriptions, each mapped to exactly one of the seven target
   value types above. Purely descriptive text; no calculation involved. */
const TARGET_TYPE_CLASSIFICATION_ITEMS = [
  { id: "t1", narrative: "The organiser assigns the target using results from a laboratory that runs a formally recognised reference measurement procedure for this measurand.", correctTargetTypeId: "reference-measurement-procedure" },
  { id: "t2", narrative: "The target is the value certified on the label of a certified reference material distributed with this round.", correctTargetTypeId: "certified-reference-material" },
  { id: "t3", narrative: "The target is the mean of all results reported by other participants using the same measurement method as you.", correctTargetTypeId: "method-specific-peer-group-mean" },
  { id: "t4", narrative: "The target is the mean of all results reported by other participants using the same manufacturer's instrument and reagent system.", correctTargetTypeId: "manufacturer-instrument-peer-group-mean" },
  { id: "t5", narrative: "The target is the mean of every result submitted for this round, regardless of which method or instrument each participant used.", correctTargetTypeId: "all-participant-consensus" },
  { id: "t6", narrative: "A panel of technical experts reviewed the round's results and assigned a target using a defined consensus procedure, because no reference measurement procedure exists for this measurand.", correctTargetTypeId: "expert-organiser-assigned" },
  { id: "t7", narrative: "The scheme report states only a numeric target value, with no description anywhere of how it was derived.", correctTargetTypeId: "target-insufficiently-described" }
];

/* -------------------------------------------------------------------------
   Peer group != truth (spec section 9) — mandatory, must appear both in
   content and in challenge feedback (the latter is wired in
   26-eqa-screens.jsx's feedback panel).
   ------------------------------------------------------------------------- */
const PEER_GROUP_NOT_TRUTH_PRINCIPLE = "Agreement with a peer group demonstrates agreement with that peer group; it does not necessarily demonstrate agreement with a higher-order reference.";

/* -------------------------------------------------------------------------
   Commutability (spec sections 10-13). A dedicated interactive teaching
   component ("Does the EQA material behave like patient samples?") is
   implemented in 25-eqa-components.jsx / 26-eqa-screens.jsx using the
   content below.
   ------------------------------------------------------------------------- */
const COMMUTABILITY_CONCEPT_NOTE = "A commutable material shows relationships between measurement procedures that are representative of the relationships seen with relevant clinical samples.";
const COMMUTABILITY_NOT_JUST_HUMAN_SERUM_NOTE = "Do not reduce commutability to \"the sample is made from human serum.\" Human-derived material can still be noncommutable after processing (lyophilisation, additives, freeze-thaw, or other treatment can each introduce matrix effects that change how the material behaves across different measurement procedures compared with a fresh clinical sample).";

const COMMUTABILITY_STATUS_DESCRIPTIONS = [
  { id: "verified-commutable", description: "The material has been specifically evaluated and shown to behave like relevant clinical samples across the measurement procedures being compared." },
  { id: "noncommutable", description: "The material has been specifically evaluated and shown NOT to behave like relevant clinical samples across the measurement procedures being compared — a known, demonstrated limitation." },
  { id: "commutability-not-established", description: "Commutability has not been specifically evaluated for this material/measurand/method combination. This is an unknown, not a demonstrated failure." },
  { id: "not-applicable-or-insufficient-information", description: "Commutability is not applicable to this comparison, or there is insufficient information in the scenario to say." }
];
const UNKNOWN_NOT_EQUAL_FAILED_NOTE = "\"Commutability-not-established\" is never treated as equivalent to \"noncommutable\" anywhere in this application. Unknown does not mean failed.";

const COMMUTABILITY_CONSEQUENCE_NOTE = "If an EQA material is not commutable across methods, observed method-group differences may partly reflect material-specific matrix effects rather than the relationships that occur for patient specimens. Noncommutable-material results can still be useful for participant/peer comparison in an appropriately designed scheme, but may have limited ability to assess between-method harmonisation or true patient-sample comparability. This application does not simply label noncommutable EQA as \"useless.\"";

/* Commutability Challenge worked example (spec section 13) — the exact
   figures given in the spec. */
const COMMUTABILITY_CHALLENGE_EXAMPLE = {
  patientSampleNarrative: "Method A patient samples and Method B patient samples agree well across the routine reporting range.",
  processedSample: { methodA: 100, methodB: 118 },
  commutabilityStatus: "commutability-not-established",
  question: "Can you conclude Method B has an 18% patient-sample bias?",
  correctAnswer: "No.",
  explanation: "Commutability has not been established for this processed EQA sample. More suitable evidence — for example a commutability study using relevant clinical samples, or a direct patient-sample comparison — is required before concluding that Method B carries an 18% patient-sample bias."
};

/* -------------------------------------------------------------------------
   Scheme Capability Profile (spec sections 14-18). describeSchemeCapability()
   in 23-eqa-calc.js does the qualitative reasoning; this content explains
   the inputs and what each capability dimension can and cannot support.
   ------------------------------------------------------------------------- */
const SCHEME_CAPABILITY_INPUTS = [
  { id: "commutabilityVerified", label: "Commutability verified?" },
  { id: "higherOrderTargetAvailable", label: "Higher-order/reference target available?" },
  { id: "replicateSpecimensIncluded", label: "Replicate specimens included?" },
  { id: "methodGroupsDefined", label: "Method/instrument groups defined?" },
  { id: "performanceSpecificationStated", label: "Performance specification stated?" }
];
const CAPABILITY_MILLER_ATTRIBUTION_NOTE = "This capability-based reasoning approach is informed by the framework Miller et al. (2011) described for characterising EQA/PT capability — see Evidence for the citation. This application implements an original capability interface built from the properties above rather than reproducing the published category table, and does not implement automated Category 1-6 classification.";

const CAPABILITY_PARTICIPANT_PERFORMANCE_NOTE = "A scheme with a suitably defined peer group may provide evidence about whether this participant differs from comparable participants. This is not automatically evidence about absolute trueness.";
const CAPABILITY_METHOD_PERFORMANCE_NOTE = "When appropriate materials, grouping and target assignment exist, EQA may also identify systematic differences affecting an entire measurement procedure or manufacturer group. This must be distinguished from a participant-specific laboratory problem.";
const CAPABILITY_HARMONISATION_NOTE = "Assessment of between-method comparability is strongest when suitable commutable materials and higher-order target assignment are available. A noncommutable peer-group scheme cannot independently establish patient-sample harmonisation across methods.";

/* -------------------------------------------------------------------------
   Performance specification reconnection (spec section 22). Reuses the
   existing, unmodified APS Explorer vocabulary (10-aps-data.js) rather
   than assuming every scheme uses TEa.
   ------------------------------------------------------------------------- */
const PERFORMANCE_CRITERION_APS_LINK_NOTE = "An EQA scheme's performance criterion is not always the same thing as a laboratory's own TEa. This reconnects with the APS Explorer (QC Strategy Lab): a criterion may be a relative or absolute allowable deviation, a z-score/SDPA convention, a biological-variation-derived criterion (Milan Model 2), a regulatory criterion, a state-of-the-art criterion (Milan Model 3), or another scheme-specific criterion. This application does not assume every scheme uses TEa.";

/* -------------------------------------------------------------------------
   EQA Report Interpreter (spec sections 23-27). A simulated report plus
   the mandatory A-G interpretation questions, shown before any conclusion.
   ------------------------------------------------------------------------- */
const REPORT_INTERPRETATION_QUESTIONS = [
  { id: "a", label: "A. Compared with what is your result being evaluated?" },
  { id: "b", label: "B. Is the EQA material suitable for the conclusion you are trying to make?" },
  { id: "c", label: "C. Is the deviation participant-specific or shared by the method group?" },
  { id: "d", label: "D. Does the result meet the stated criterion?" },
  { id: "e", label: "E. What can this EQA round not prove?" },
  { id: "f", label: "F. What should be reviewed next?" },
  { id: "g", label: "G. Confidence" }
];

/* Signature case: peer group hides method bias (spec section 25). */
const PEER_GROUP_HIDES_METHOD_BIAS_REPORT = {
  title: "Signature case — peer group hides a method-wide bias",
  eqaResult: {
    round: "2026-R2", measurand: "Analyte X", participantResult: 108, units: "arbitrary units",
    assignedValue: 100, assignedValueType: "reference-measurement-procedure",
    commutabilityStatus: "verified-commutable", peerGroup: "Method-specific peer group", peerGroupMean: 107,
    allParticipantMean: 103, performanceCriterion: { type: "relative-allowable-deviation", value: "±10%" },
    schemeCapability: { commutabilityVerified: true, higherOrderTargetAvailable: true, methodGroupsDefined: true, performanceSpecificationStated: true, replicateSpecimensIncluded: false }
  },
  question: "Is the participant uniquely performing poorly?",
  correctAnswer: "Not necessarily.",
  explanation: "The participant agrees reasonably with its method group (108 vs. a peer-group mean of 107), while the method group itself appears positively displaced relative to the appropriately-assigned reference target (100). This is a critical case: agreement with peers can mask a method-wide effect that only becomes visible against a higher-order reference."
};

/* Opposite signature case: laboratory-specific deviation (spec section 26). */
const LABORATORY_SPECIFIC_DEVIATION_REPORT = {
  title: "Opposite signature case — a laboratory-specific deviation",
  eqaResult: {
    round: "2026-R2", measurand: "Analyte X", participantResult: 108, units: "arbitrary units",
    assignedValue: 100, assignedValueType: "reference-measurement-procedure",
    commutabilityStatus: "verified-commutable", peerGroup: "Method-specific peer group", peerGroupMean: 100.5,
    performanceCriterion: { type: "relative-allowable-deviation", value: "±10%" },
    schemeCapability: { commutabilityVerified: true, higherOrderTargetAvailable: true, methodGroupsDefined: true, performanceSpecificationStated: true, replicateSpecimensIncluded: false }
  },
  question: "Does this pattern primarily suggest a method-wide issue?",
  correctAnswer: "No.",
  explanation: "The participant (108) diverges from its own method peer group (100.5), which itself agrees closely with the reference target (100). The participant-specific process deserves investigation. This application does not immediately identify the physical root cause from the EQA report alone — see the Investigation Lab for that reasoning framework."
};

/* Target changes the conclusion (spec section 27). */
const TARGET_CHANGES_CONCLUSION_REPORT = {
  title: "Target changes the conclusion",
  eqaResult: {
    round: "2026-R2", measurand: "Analyte X", participantResult: 105, units: "arbitrary units",
    assignedValue: 100, assignedValueType: "reference-measurement-procedure",
    peerGroup: "Method-specific peer group", peerGroupMean: 105,
    commutabilityStatus: "verified-commutable",
    schemeCapability: { commutabilityVerified: true, higherOrderTargetAvailable: true, methodGroupsDefined: true, performanceSpecificationStated: false, replicateSpecimensIncluded: false }
  },
  question: "What question is answered by each comparison?",
  explanation: "Compared with the peer target (105), the participant (105) shows no deviation at all. Compared with the reference target (100), the same participant result shows a +5% deviation. Agreement with peer group and agreement with reference target are distinct analytical questions — this scenario deliberately has both a peer target and a reference target so a single result can appear either \"in agreement\" or \"deviating,\" depending entirely on which comparison is used."
};

/* -------------------------------------------------------------------------
   Single EQA event vs. trend (spec section 28).
   ------------------------------------------------------------------------- */
const SINGLE_EVENT_VS_TREND_NOTE = "One unusual EQA result deserves review but does not, by itself, establish persistent longitudinal bias. Conversely, repeated smaller deviations in the same direction may become important even when individual rounds remain within a broad acceptance criterion.";

/* -------------------------------------------------------------------------
   Longitudinal EQA view (spec sections 29-31) — a generic 10-round dataset
   for the Longitudinal Challenge mode's timeline visualisation, spanning
   the required patterns the learner must be able to distinguish.
   ------------------------------------------------------------------------- */
const LONGITUDINAL_EQA_TIMELINE = [
  { round: 1, deviationPct: 1.1, targetType: "reference-measurement-procedure", criterion: "±10%", event: null },
  { round: 2, deviationPct: -0.8, targetType: "reference-measurement-procedure", criterion: "±10%", event: null },
  { round: 3, deviationPct: 0.5, targetType: "reference-measurement-procedure", criterion: "±10%", event: null },
  { round: 4, deviationPct: 1.0, targetType: "reference-measurement-procedure", criterion: "±10%", event: null },
  { round: 5, deviationPct: 7.2, targetType: "reference-measurement-procedure", criterion: "±10%", event: "Isolated excursion — no corroborating IQC change recorded" },
  { round: 6, deviationPct: 0.6, targetType: "reference-measurement-procedure", criterion: "±10%", event: null },
  { round: 7, deviationPct: -0.4, targetType: "reference-measurement-procedure", criterion: "±10%", event: null },
  { round: 8, deviationPct: 6.8, targetType: "reference-measurement-procedure", criterion: "±10%", event: "Reagent lot change" },
  { round: 9, deviationPct: 7.1, targetType: "reference-measurement-procedure", criterion: "±10%", event: null },
  { round: 10, deviationPct: 6.9, targetType: "reference-measurement-procedure", criterion: "±10%", event: null }
];
const LONGITUDINAL_TIMELINE_TEACHING_NOTE = "This ten-round timeline is designed so the learner must distinguish an isolated excursion (round 5, which resolves on its own) from a step change coinciding with a reagent lot event (round 8, which persists through rounds 9-10). Both patterns can involve a similarly large single-round deviation — the distinguishing evidence is what happens in the surrounding rounds, not the size of any one deviation alone.";
const LONGITUDINAL_PATTERN_LABELS = {
  "stable-no-persistent-deviation-apparent": "Stable — no persistent deviation apparent",
  "isolated-eqa-excursion": "Isolated EQA excursion",
  "persistent-positive-deviation": "Persistent positive deviation",
  "persistent-negative-deviation": "Persistent negative deviation",
  "step-change": "Step change",
  "performance-improving": "Performance improving",
  "method-group-pattern": "Method-group pattern",
  "indeterminate": "Indeterminate"
};
const LONGITUDINAL_STATUSES_ARE_DESCRIPTIONS_NOTE = "These longitudinal classifications are scenario descriptions, not universal statistical diagnoses computed from a formula.";

/* -------------------------------------------------------------------------
   No automatic trend root cause (spec section 31).
   ------------------------------------------------------------------------- */
const NO_AUTOMATIC_TREND_ROOT_CAUSE_NOTE = "Persistent EQA bias may be compatible with a calibration/traceability problem, a method-group bias, a laboratory implementation problem, a reagent/calibrator lot effect, or another systematic analytical difference. An EQA pattern alone does not identify which mechanism is responsible.";

/* -------------------------------------------------------------------------
   EQA + IQC combined matrix (spec sections 32-34).
   ------------------------------------------------------------------------- */
const IQC_EQA_COMBINED_MATRIX = [
  {
    id: "stable-acceptable", iqc: "stable", eqa: "acceptable",
    label: "IQC stable / EQA acceptable",
    suggests: "The process appears consistent internally and compares acceptably against the external comparison used.",
    cannotEstablish: "This combination alone does not establish that every other aspect of the measurement procedure is optimal, nor that agreement would hold for every analyte level or every clinical use of the result."
  },
  {
    id: "stable-biased", iqc: "stable", eqa: "persistently-biased",
    label: "IQC stable / EQA persistently biased",
    suggests: "The process may be precise/stable around a displaced value, or may have a systematic alignment issue not visible to internal QC alone.",
    cannotEstablish: "This combination does not by itself identify the mechanism responsible. Do not simply say \"calibration is wrong.\""
  },
  {
    id: "unstable-acceptable", iqc: "unstable", eqa: "acceptable",
    label: "IQC unstable / EQA acceptable",
    suggests: "A single satisfactory EQA event does not negate evidence of unstable routine analytical performance. EQA is a sparse periodic sample of performance.",
    cannotEstablish: "This combination does not establish that the instability is resolved or clinically unimportant — the IQC evidence still stands on its own and should be investigated on its own terms."
  },
  {
    id: "unstable-problematic", iqc: "unstable", eqa: "problematic",
    label: "IQC unstable / EQA problematic",
    suggests: "Two independent lines of evidence point toward a genuine analytical concern, strengthening the case for investigation.",
    cannotEstablish: "Even here, the combination does not by itself identify the mechanism, distinguish participant-specific from method-group causes, or establish which historical patient results (if any) require review."
  }
];
const STABLE_IQC_POOR_EQA_CAUTION = "Do not simply say \"calibration is wrong.\" The process may be precise/stable around a displaced value or may have a systematic alignment issue not visible to internal QC alone — several mechanisms remain possible.";
const UNSTABLE_IQC_ACCEPTABLE_EQA_CAUTION = "A single satisfactory EQA event does not negate evidence of unstable routine analytical performance. EQA is a sparse periodic sample of performance.";

/* -------------------------------------------------------------------------
   EQA sample handling integrity (spec sections 35-36).
   ------------------------------------------------------------------------- */
const SAMPLE_HANDLING_INTEGRITY_NOTE = "EQA/PT specimens should be processed in a manner representative of routine examination practice according to the applicable programme/laboratory requirements.";
const SAMPLE_HANDLING_DISCOURAGED = [
  "special calibration solely for the EQA sample",
  "sending the sample elsewhere for a result",
  "consulting another participant for the answer",
  "excessive repeat measurements beyond routine practice merely to obtain a preferred value"
];
const PT_INTEGRITY_CHALLENGE = {
  scenario: "The first EQA measurement looks unusual.",
  options: [
    { id: "process-routine", label: "Process according to routine procedure", correct: true },
    { id: "repeat-if-justified", label: "Repeat only if routine patient procedure would justify it", correct: true },
    { id: "recalibrate-because-eqa", label: "Recalibrate solely because it is an EQA specimen", correct: false },
    { id: "ask-another-lab", label: "Ask another laboratory for its value", correct: false },
    { id: "report-and-investigate", label: "Report the routine result and investigate after submission as appropriate", correct: true }
  ],
  teachingPoint: "EQA is an assessment of routine performance, not a special examination to \"pass.\""
};

/* -------------------------------------------------------------------------
   EQA error is not always analyser bias (spec section 37).
   ------------------------------------------------------------------------- */
const EQA_PROCESS_ERROR_TYPES = [
  "incorrect sample preparation",
  "unit conversion error",
  "transcription/reporting error",
  "wrong method code",
  "inappropriate peer-group assignment",
  "instrument problem",
  "calibration/reagent issue"
];
const INVESTIGATE_WHOLE_EQA_PROCESS_NOTE = "The learner should investigate the whole EQA process, not assume analyser bias by default.";

/* -------------------------------------------------------------------------
   Comparability Lab (spec sections 38-45). Deliberately simple and
   transparent — not a full CLSI EP09 method-comparison module (spec 38),
   and deliberately excludes full method-comparison statistics (spec 42).
   ------------------------------------------------------------------------- */
const COMPARABILITY_LAB_SCOPE_NOTE = "This is not a full CLSI EP09 method-comparison module. Calculations here are deliberately simple and transparent: paired differences and relative differences only.";
const DESIGNATED_COMPARATOR_NOTE = "Analyzer A is called the designated comparator for this teaching exercise, never \"the reference method.\" This application does not automatically treat either analyser as truth.";
const EXCLUDED_METHOD_COMPARISON_STATISTICS = [
  "Passing-Bablok regression",
  "Deming regression",
  "Bland-Altman limits of agreement",
  "regression confidence intervals",
  "medical decision-point bias estimation"
];
const EXCLUDED_STATISTICS_NOTE = "These may become a dedicated advanced comparability module later if desired. They are explicitly excluded from v0.6.";

/* Multi-analyser paired dataset (spec section 39) — 16 synthetic paired
   patient specimens, Analyzer B = Analyzer A + a small consistent
   positive displacement plus modest scatter, deterministic. */
const COMPARABILITY_PAIRED_SPECIMENS = [
  { id: "S01", analyzerA: 98, analyzerB: 101 },
  { id: "S02", analyzerA: 102, analyzerB: 104 },
  { id: "S03", analyzerA: 105, analyzerB: 109 },
  { id: "S04", analyzerA: 110, analyzerB: 112 },
  { id: "S05", analyzerA: 95, analyzerB: 97 },
  { id: "S06", analyzerA: 120, analyzerB: 125 },
  { id: "S07", analyzerA: 88, analyzerB: 90 },
  { id: "S08", analyzerA: 130, analyzerB: 134 },
  { id: "S09", analyzerA: 100, analyzerB: 103 },
  { id: "S10", analyzerA: 115, analyzerB: 118 },
  { id: "S11", analyzerA: 92, analyzerB: 95 },
  { id: "S12", analyzerA: 108, analyzerB: 111 },
  { id: "S13", analyzerA: 125, analyzerB: 129 },
  { id: "S14", analyzerA: 97, analyzerB: 99 },
  { id: "S15", analyzerA: 103, analyzerB: 106 },
  { id: "S16", analyzerA: 112, analyzerB: 116 }
];
const COMPARABILITY_LIMIT_LABEL = "Scenario-specific comparability criterion";
const COMPARABILITY_LIMIT_CAUTION = "Where a teaching scenario uses a numeric criterion, it is labelled a scenario-specific comparability criterion, and its source (or illustrative status) is stated explicitly. This application does not invent a universal allowable between-analyser difference.";
const COMPARABILITY_LAB_ILLUSTRATIVE_CRITERION = { value: "±5%", source: "Illustrative for this teaching exercise only — not drawn from any regulatory or manufacturer document." };

/* Control-material comparability trap (spec section 43). */
const CONTROL_MATERIAL_TRAP_CASE = {
  narrative: "Analyzer A and Analyzer B show a persistent disagreement on a commercial QC material (Analyzer B reads systematically higher). Paired patient samples analysed on both systems, however, agree well across the reporting range.",
  question: "Does the QC-material disagreement prove the two analysers are noncomparable for patient samples?",
  correctAnswer: "No.",
  explanation: "Control-material differences may reflect material-specific behaviour and do not automatically prove patient-sample noncomparability. This directly reinforces the commutability principle: a control material is itself a processed material, and its relationship between two measurement procedures is not guaranteed to represent the relationship for patient specimens."
};

/* Patient-comparison trap — the reverse scenario (spec section 44). */
const PATIENT_COMPARISON_TRAP_CASE = {
  narrative: "Analyzer A and Analyzer B agree closely on a commercial QC material. Paired patient specimens, however, show a systematic difference across the measurement range.",
  question: "Does agreement on the QC material establish that the two systems are comparable for patient samples?",
  correctAnswer: "No.",
  explanation: "Agreement on one QC material does not establish patient-sample comparability across the measurement range. Whichever direction the mismatch runs, a single material's behaviour on its own is not sufficient evidence about patient-sample comparability."
};

/* Longitudinal comparability (spec section 45) — monthly deterministic
   summaries of Analyzer A vs Analyzer B mean difference. */
const LONGITUDINAL_COMPARABILITY_SUMMARY = [
  { period: "Jan", meanDifference: 2.1, status: "stable-agreement", event: null },
  { period: "Feb", meanDifference: 2.3, status: "stable-agreement", event: null },
  { period: "Mar", meanDifference: 2.0, status: "stable-agreement", event: null },
  { period: "Apr", meanDifference: 6.8, status: "step-change", event: "Analyzer B reagent lot change" },
  { period: "May", meanDifference: 7.1, status: "step-change", event: null },
  { period: "Jun", meanDifference: 3.5, status: "gradual-divergence", event: null },
  { period: "Jul", meanDifference: 8.2, status: "temporary-excursion", event: "Analyzer B maintenance event (transient)" },
  { period: "Aug", meanDifference: 2.4, status: "recovery-after-intervention", event: "Analyzer B recalibrated" }
];
const NOT_EVERY_DIFFERENCE_CLINICALLY_IMPORTANT_NOTE = "Do not label every difference clinically important. Whether a given between-analyser difference matters clinically depends on the analyte, the magnitude relative to a stated comparability criterion, and the clinical use of the result.";

/* -------------------------------------------------------------------------
   EQA investigation path (spec section 55) — a reasoning framework, not a
   universal mandated sequence.
   ------------------------------------------------------------------------- */
const EQA_INVESTIGATION_PATH_STEPS = [
  "Verify report/sample identity and units",
  "Understand target and criterion",
  "Review peer/method-group context",
  "Review commutability",
  "Review IQC/calibration/reagent history",
  "Review prior EQA rounds",
  "Investigate participant versus method effect",
  "Correct where supported",
  "Document follow-up"
];
const EQA_INVESTIGATION_PATH_CAUTION = "This is a reasoning framework, not a universal mandated sequence — as with the Investigation Lab's own pathway, a real EQA investigation may revisit earlier steps as evidence emerges.";

/* -------------------------------------------------------------------------
   Cross-module link (spec section 76) — conceptual only; this application
   does not automatically transfer scenario truth states between modules,
   and does not duplicate the Investigation Lab's engine.
   ------------------------------------------------------------------------- */
const EXPLORE_INVESTIGATION_LINK_LABEL = "Explore how to investigate this";
const NO_AUTO_TRANSFER_BETWEEN_MODULES_NOTE = "Where an EQA result warrants investigation, this application links to the existing Investigation Lab reasoning framework rather than duplicating its engine, and does not automatically transfer scenario truth states between modules.";

/* -------------------------------------------------------------------------
   Mandatory guardrail statements (spec sections 50-53).
   ------------------------------------------------------------------------- */
const NO_EQA_PASS_EQUALS_METHOD_VALID_NOTE = "A satisfactory result in one EQA event provides useful external evidence but does not by itself validate every aspect of the measurement procedure.";
const NO_EQA_FAIL_EQUALS_PATIENT_RESULTS_WRONG_NOTE = "An unacceptable or unexpected EQA result requires investigation; its implications for routine patient results depend on the nature of the error, material commutability, timing, method behaviour and corroborating evidence. This application does not automatically reopen historical patient results from one EQA event.";
const NO_PEER_MEAN_EQUALS_REFERENCE_VALUE_NOTE = "A peer-group mean is a consensus comparator for that group, not automatically a metrologically higher-order reference.";
const NO_COMMUTABLE_EQUALS_PERFECT_NOTE = "Verified commutability supports interpretation of relationships among measurement procedures for relevant clinical samples; it does not guarantee that the target assignment, performance criterion or all other programme features are optimal.";

/* -------------------------------------------------------------------------
   No auto-patient-impact from EQA (spec sections 75-76).
   ------------------------------------------------------------------------- */
const NO_AUTO_PATIENT_IMPACT_FROM_EQA_NOTE = "An unacceptable EQA event must never automatically set historical patient results to held, invalid, amend, or reissue in this application. Where patient impact needs assessment, this routes conceptually to the validated Investigation Lab reasoning framework rather than duplicating its engine here.";

/* -------------------------------------------------------------------------
   External Assurance Challenge Bank — 14 deterministic integrated cases
   (spec sections 46-49). Case distribution (spec 47) is satisfied across
   the bank as a whole: >=2 participant-specific (2, 8, 14), >=2
   method-group (3, 13), >=2 commutability-limited (4, 5), >=2 longitudinal
   (1, 6, 7, 11, 13), >=2 comparability (9, 10), >=2 insufficient-
   information (1, 5, 12) — verified programmatically in test-eqa.js.
   ------------------------------------------------------------------------- */
const PATTERN_JUDGEMENT_OPTIONS = [
  { id: "participant-specific", label: "Participant-specific" },
  { id: "method-group", label: "Method-group" },
  { id: "indeterminate", label: "Indeterminate / insufficient information" }
];
const CAPABILITY_CONCLUSION_OPTIONS = [
  { id: "participant-performance", label: "This scheme may support participant-performance evaluation" },
  { id: "method-performance", label: "This scheme may support method-performance evaluation" },
  { id: "harmonisation", label: "This scheme may support between-method harmonisation assessment" },
  { id: "insufficient-basis", label: "Insufficient basis to conclude any of the above" }
];
const LONGITUDINAL_RELEVANCE_OPTIONS = [
  { id: "changes-interpretation", label: "Yes — longitudinal history changes the interpretation" },
  { id: "does-not-change-interpretation", label: "No — longitudinal history does not change the interpretation" },
  { id: "not-applicable-insufficient-history", label: "Not applicable / insufficient history available" }
];
const NEXT_ACTION_OPTIONS = [
  { id: "review-calibration-reagent-history", label: "Review calibration/reagent history" },
  { id: "review-peer-group-assignment", label: "Review peer-group/method-code assignment" },
  { id: "contact-eqa-organiser", label: "Contact the EQA scheme organiser for clarification" },
  { id: "escalate-to-investigation-lab", label: "Escalate to the Investigation Lab reasoning framework" },
  { id: "request-additional-rounds", label: "Request/await additional round or replicate data" },
  { id: "no-action-routine-monitoring", label: "No action beyond routine monitoring" },
  { id: "correct-reporting-error", label: "Correct the identified reporting/transcription error" }
];

const EXTERNAL_ASSURANCE_STAGES = ["target", "commutability", "capability", "pattern", "longitudinal", "next-step", "confidence"];

const EXTERNAL_ASSURANCE_CASES = [
  {
    id: 1, title: "Case 1 — Stable IQC, persistent reference-target EQA bias",
    distribution: ["longitudinal", "insufficient-information"],
    iqcStatus: "stable",
    iqcNarrative: "Internal QC has been stable for six months across both control levels.",
    eqaResult: {
      round: "2026-R3", measurand: "Analyte X", participantResult: 107, units: "arbitrary units",
      assignedValue: 100, assignedValueType: "reference-measurement-procedure",
      commutabilityStatus: "verified-commutable", performanceCriterion: { type: "relative-allowable-deviation", value: "±10%" },
      schemeCapability: { commutabilityVerified: true, higherOrderTargetAvailable: true, methodGroupsDefined: false, performanceSpecificationStated: true, replicateSpecimensIncluded: false }
    },
    longitudinal: LONGITUDINAL_EQA_TIMELINE,
    correctTargetTypeId: "reference-measurement-procedure",
    correctCommutabilityJudgementId: "verified-commutable",
    correctCapabilityConclusionId: "insufficient-basis",
    correctPatternJudgementId: "indeterminate",
    correctLongitudinalRelevanceId: "changes-interpretation",
    correctNextActionId: "review-calibration-reagent-history",
    finalInterpretation: {
      currentEqaStatus: "does-not-meet-criterion", longitudinalEqaPattern: "step-change", comparabilityStatus: null, investigationStatus: "under-review",
      summary: "No method/instrument peer-group data is available in this scheme, so this round alone cannot distinguish a participant-specific problem from a method-group pattern — despite six months of stable IQC. The longitudinal timeline shows this is not an isolated excursion: rounds 8-10 show a persistent step-change coinciding with a reagent lot change.",
      supports: ["Stable IQC and a displaced external target can coexist.", "The longitudinal pattern is a step change, not an isolated excursion."],
      doesNotProve: ["Whether the cause is participant-specific or method-wide (no peer-group data in this scheme).", "That calibration specifically is at fault."],
      reasonableNextAction: "Review calibration/reagent history around the round-8 lot change, and request method-group information from the scheme organiser if available."
    }
  },
  {
    id: 2, title: "Case 2 — Participant differs from peer group",
    distribution: ["participant-specific"],
    iqcStatus: "stable",
    eqaResult: LABORATORY_SPECIFIC_DEVIATION_REPORT.eqaResult,
    correctTargetTypeId: "reference-measurement-procedure",
    correctCommutabilityJudgementId: "verified-commutable",
    correctCapabilityConclusionId: "participant-performance",
    correctPatternJudgementId: "participant-specific",
    correctLongitudinalRelevanceId: "not-applicable-insufficient-history",
    correctNextActionId: "review-calibration-reagent-history",
    finalInterpretation: {
      currentEqaStatus: "does-not-meet-criterion", longitudinalEqaPattern: "indeterminate", comparabilityStatus: null, investigationStatus: "referred-to-investigation-lab",
      summary: "The participant (108) diverges from a method peer group (100.5) that itself agrees closely with the reference target (100). The participant-specific process deserves investigation; this application does not immediately identify the physical root cause from the EQA report alone.",
      supports: ["The deviation is participant-specific, not shared by the method group."],
      doesNotProve: ["The specific mechanism (calibration, reagent, instrument, or otherwise) responsible."],
      reasonableNextAction: "Escalate to the Investigation Lab reasoning framework to work through candidate mechanisms with corroborating evidence."
    }
  },
  {
    id: 3, title: "Case 3 — Entire peer group differs from reference target",
    distribution: ["method-group"],
    iqcStatus: "stable",
    eqaResult: PEER_GROUP_HIDES_METHOD_BIAS_REPORT.eqaResult,
    correctTargetTypeId: "reference-measurement-procedure",
    correctCommutabilityJudgementId: "verified-commutable",
    correctCapabilityConclusionId: "method-performance",
    correctPatternJudgementId: "method-group",
    correctLongitudinalRelevanceId: "not-applicable-insufficient-history",
    correctNextActionId: "contact-eqa-organiser",
    finalInterpretation: {
      currentEqaStatus: "does-not-meet-criterion", longitudinalEqaPattern: "indeterminate", comparabilityStatus: null, investigationStatus: "resolved-method-group",
      summary: "The participant (108) agrees reasonably with its method peer group (107), while the method group itself is displaced from the appropriately-assigned reference target (100). Agreement with a peer group demonstrates agreement with that peer group; it does not necessarily demonstrate agreement with a higher-order reference.",
      supports: ["A method-group-wide pattern relative to the reference target."],
      doesNotProve: ["That this individual participant has a unique, isolated problem."],
      reasonableNextAction: "Contact the EQA scheme organiser and/or the manufacturer about a possible method-wide calibration/traceability issue, since this extends beyond one laboratory."
    }
  },
  {
    id: 4, title: "Case 4 — Noncommutable material creates a misleading between-method difference",
    distribution: ["commutability-limited", "comparability"],
    iqcStatus: "stable",
    eqaResult: {
      round: "2026-R1", measurand: "Analyte Y", participantResult: 100, units: "arbitrary units",
      assignedValue: null, assignedValueType: "target-insufficiently-described",
      commutabilityStatus: "noncommutable", peerGroup: "All-method peer group", peerGroupMean: 115,
      schemeCapability: { commutabilityVerified: true, higherOrderTargetAvailable: false, methodGroupsDefined: true, performanceSpecificationStated: false, replicateSpecimensIncluded: false }
    },
    comparability: { patientSampleAgreement: "Method A and Method B patient samples agree well across the reporting range.", methodA: 100, methodB: 115 },
    correctTargetTypeId: "target-insufficiently-described",
    correctCommutabilityJudgementId: "noncommutable",
    correctCapabilityConclusionId: "insufficient-basis",
    correctPatternJudgementId: "indeterminate",
    correctLongitudinalRelevanceId: "not-applicable-insufficient-history",
    correctNextActionId: "review-peer-group-assignment",
    finalInterpretation: {
      currentEqaStatus: "criterion-not-stated", longitudinalEqaPattern: "indeterminate", comparabilityStatus: "stable-agreement", investigationStatus: "resolved-method-group",
      summary: "This material is known to be noncommutable. The large apparent between-method difference on the EQA material may partly reflect material-specific matrix effects rather than the relationship seen with patient specimens — which, in this scenario, agree well between the two methods.",
      supports: ["Patient-sample agreement between Method A and Method B, from independent evidence."],
      doesNotProve: ["That the EQA material's between-method difference reflects true patient-sample performance."],
      reasonableNextAction: "Review whether a commutable material is available from this or another scheme for future between-method assessment."
    }
  },
  {
    id: 5, title: "Case 5 — Commutability unknown, therefore conclusion limited",
    distribution: ["commutability-limited", "insufficient-information"],
    iqcStatus: "not-described",
    eqaResult: {
      round: "2026-R1", measurand: "Analyte Z", participantResult: 100, units: "arbitrary units",
      assignedValue: null, assignedValueType: "target-insufficiently-described",
      commutabilityStatus: "commutability-not-established", peerGroup: "All-method peer group",
      schemeCapability: { commutabilityVerified: false, higherOrderTargetAvailable: false, methodGroupsDefined: true, performanceSpecificationStated: false, replicateSpecimensIncluded: false }
    },
    comparability: { patientSampleAgreement: "Method A and Method B patient samples agree well across the routine reporting range.", methodA: 100, methodB: 118 },
    correctTargetTypeId: "target-insufficiently-described",
    correctCommutabilityJudgementId: "commutability-not-established",
    correctCapabilityConclusionId: "insufficient-basis",
    correctPatternJudgementId: "indeterminate",
    correctLongitudinalRelevanceId: "not-applicable-insufficient-history",
    correctNextActionId: "review-peer-group-assignment",
    finalInterpretation: {
      currentEqaStatus: "criterion-not-stated", longitudinalEqaPattern: "indeterminate", comparabilityStatus: "indeterminate", investigationStatus: "unresolved",
      summary: "Commutability has not been established for this processed sample. An 18% between-method difference on this material does not, by itself, establish an 18% patient-sample bias — more suitable evidence is required. Commutability-not-established is never treated as equivalent to noncommutable: this is an unknown, not a demonstrated failure.",
      supports: ["That the observed 18% difference is a between-method difference on this specific processed material."],
      doesNotProve: ["That Method B carries an 18% patient-sample bias."],
      reasonableNextAction: "Seek a commutability study or a direct patient-sample comparison before drawing a between-method conclusion."
    }
  },
  {
    id: 6, title: "Case 6 — One isolated poor EQA result",
    distribution: ["longitudinal"],
    iqcStatus: "stable",
    eqaResult: {
      round: "2026-R3", measurand: "Analyte X", participantResult: 107.2, units: "arbitrary units",
      assignedValue: 100, assignedValueType: "reference-measurement-procedure", sdpa: 2.3,
      commutabilityStatus: "verified-commutable", performanceCriterion: { type: "z-score-sdpa", value: "|z| ≤ 3 (scheme-stated)" },
      schemeCapability: { commutabilityVerified: true, higherOrderTargetAvailable: true, methodGroupsDefined: false, performanceSpecificationStated: true, replicateSpecimensIncluded: false }
    },
    longitudinal: LONGITUDINAL_EQA_TIMELINE.slice(0, 6),
    correctTargetTypeId: "reference-measurement-procedure",
    correctCommutabilityJudgementId: "verified-commutable",
    correctCapabilityConclusionId: "participant-performance",
    correctPatternJudgementId: "indeterminate",
    correctLongitudinalRelevanceId: "changes-interpretation",
    correctNextActionId: "no-action-routine-monitoring",
    finalInterpretation: {
      currentEqaStatus: "does-not-meet-criterion", longitudinalEqaPattern: "isolated-eqa-excursion", comparabilityStatus: null, investigationStatus: "resolved-participant-specific",
      summary: "This single round shows a large z-score, but the surrounding rounds (1-4, 6) are unremarkable. One unusual EQA result deserves review but does not, by itself, establish persistent longitudinal bias.",
      supports: ["An isolated excursion pattern, given the surrounding stable rounds."],
      doesNotProve: ["That a persistent bias is present — the history argues against it."],
      reasonableNextAction: "Document the review; no action beyond routine monitoring is supported unless a subsequent round repeats the pattern."
    }
  },
  {
    id: 7, title: "Case 7 — Persistent moderate EQA deviation over multiple rounds",
    distribution: ["longitudinal"],
    iqcStatus: "stable",
    eqaResult: {
      round: "2026-R6", measurand: "Analyte X", participantResult: 104.5, units: "arbitrary units",
      assignedValue: 100, assignedValueType: "all-participant-consensus",
      commutabilityStatus: "commutability-not-established", performanceCriterion: { type: "relative-allowable-deviation", value: "±10% (broad)" },
      schemeCapability: { commutabilityVerified: false, higherOrderTargetAvailable: false, methodGroupsDefined: false, performanceSpecificationStated: true, replicateSpecimensIncluded: false }
    },
    longitudinal: [
      { round: 1, deviationPct: 3.8 }, { round: 2, deviationPct: 4.1 }, { round: 3, deviationPct: 3.6 },
      { round: 4, deviationPct: 4.4 }, { round: 5, deviationPct: 4.0 }, { round: 6, deviationPct: 4.5 }
    ],
    correctTargetTypeId: "all-participant-consensus",
    correctCommutabilityJudgementId: "commutability-not-established",
    correctCapabilityConclusionId: "insufficient-basis",
    correctPatternJudgementId: "indeterminate",
    correctLongitudinalRelevanceId: "changes-interpretation",
    correctNextActionId: "review-calibration-reagent-history",
    finalInterpretation: {
      currentEqaStatus: "meets-criterion", longitudinalEqaPattern: "persistent-positive-deviation", comparabilityStatus: null, investigationStatus: "under-review",
      summary: "Every individual round remains within the broad ±10% criterion, but six consecutive rounds show a consistent +3.6% to +4.5% deviation. Repeated smaller deviations in the same direction may become important even when individual rounds remain within a broad acceptance criterion.",
      supports: ["A persistent positive deviation across six rounds."],
      doesNotProve: ["The mechanism, or whether it is participant-specific versus method-wide (no method-group or higher-order target data in this scheme)."],
      reasonableNextAction: "Review calibration/reagent history over this period even though no single round failed its criterion."
    }
  },
  {
    id: 8, title: "Case 8 — Reporting/unit error rather than analytical error",
    distribution: ["participant-specific"],
    iqcStatus: "stable",
    eqaResult: {
      round: "2026-R4", measurand: "Analyte W", participantResult: 7.8, units: "mmol/L (reported)",
      assignedValue: 140, assignedValueType: "all-participant-consensus",
      commutabilityStatus: "not-applicable-or-insufficient-information",
      schemeCapability: { commutabilityVerified: false, higherOrderTargetAvailable: false, methodGroupsDefined: false, performanceSpecificationStated: false, replicateSpecimensIncluded: false }
    },
    correctTargetTypeId: "all-participant-consensus",
    correctCommutabilityJudgementId: "not-applicable-or-insufficient-information",
    correctCapabilityConclusionId: "insufficient-basis",
    correctPatternJudgementId: "participant-specific",
    correctLongitudinalRelevanceId: "not-applicable-insufficient-history",
    correctNextActionId: "correct-reporting-error",
    finalInterpretation: {
      currentEqaStatus: "does-not-meet-criterion", longitudinalEqaPattern: "indeterminate", comparabilityStatus: null, investigationStatus: "resolved-reporting-error",
      summary: "The reported result (7.8) is wildly discordant with the consensus (140) in a way consistent with a unit conversion error (mg/dL vs. mmol/L) rather than an analytical shift, and internal QC for this analyte remained stable throughout. The learner should investigate the whole EQA process — sample handling, transcription, method code and unit conversion — not assume analyser bias by default.",
      supports: ["A reporting/transcription/unit-conversion explanation, given stable IQC and the specific magnitude and direction of the discrepancy."],
      doesNotProve: ["That the analytical method itself is biased."],
      reasonableNextAction: "Correct the identified reporting/unit error and resubmit or annotate as the scheme allows; verify the method/unit code on file."
    }
  },
  {
    id: 9, title: "Case 9 — Two analysers disagree on QC material but agree on patient samples",
    distribution: ["comparability"],
    iqcStatus: "not-described",
    comparability: CONTROL_MATERIAL_TRAP_CASE,
    correctTargetTypeId: "target-insufficiently-described",
    correctCommutabilityJudgementId: "noncommutable",
    correctCapabilityConclusionId: "insufficient-basis",
    correctPatternJudgementId: "indeterminate",
    correctLongitudinalRelevanceId: "not-applicable-insufficient-history",
    correctNextActionId: "review-peer-group-assignment",
    finalInterpretation: {
      currentEqaStatus: "criterion-not-stated", longitudinalEqaPattern: "indeterminate", comparabilityStatus: "stable-agreement", investigationStatus: "resolved-method-group",
      summary: "Control-material differences may reflect material-specific behaviour and do not automatically prove patient-sample noncomparability. Here, paired patient samples agree well despite the QC-material disagreement.",
      supports: ["Patient-sample comparability, from the paired patient-specimen evidence."],
      doesNotProve: ["That the control material's behaviour is representative of patient specimens (its commutability is not established)."],
      reasonableNextAction: "Investigate the QC material's behaviour on Analyzer B specifically (e.g. lot, matrix) rather than assuming a patient-sample problem."
    }
  },
  {
    id: 10, title: "Case 10 — Two analysers agree on QC material but disagree on patient samples",
    distribution: ["comparability"],
    iqcStatus: "stable",
    comparability: PATIENT_COMPARISON_TRAP_CASE,
    correctTargetTypeId: "target-insufficiently-described",
    correctCommutabilityJudgementId: "not-applicable-or-insufficient-information",
    correctCapabilityConclusionId: "insufficient-basis",
    correctPatternJudgementId: "indeterminate",
    correctLongitudinalRelevanceId: "not-applicable-insufficient-history",
    correctNextActionId: "escalate-to-investigation-lab",
    finalInterpretation: {
      currentEqaStatus: "criterion-not-stated", longitudinalEqaPattern: "indeterminate", comparabilityStatus: "gradual-divergence", investigationStatus: "under-review",
      summary: "Agreement on one QC material does not establish patient-sample comparability across the measurement range. Here, despite QC-material agreement, paired patient specimens show a systematic difference — the more clinically relevant evidence for comparability.",
      supports: ["A genuine patient-sample comparability concern, from the paired patient-specimen evidence."],
      doesNotProve: ["The mechanism responsible, or whether it affects the full reporting range uniformly."],
      reasonableNextAction: "Escalate to the Investigation Lab reasoning framework and consider a broader patient-sample comparison across the reporting range."
    }
  },
  {
    id: 11, title: "Case 11 — Satisfactory EQA does not negate unstable IQC",
    distribution: ["longitudinal"],
    iqcStatus: "unstable",
    iqcNarrative: "Internal QC has shown intermittent rule violations and increased scatter over the past two months.",
    eqaResult: {
      round: "2026-R3", measurand: "Analyte X", participantResult: 101, units: "arbitrary units",
      assignedValue: 100, assignedValueType: "reference-measurement-procedure",
      commutabilityStatus: "verified-commutable", performanceCriterion: { type: "relative-allowable-deviation", value: "±10%" },
      schemeCapability: { commutabilityVerified: true, higherOrderTargetAvailable: true, methodGroupsDefined: false, performanceSpecificationStated: true, replicateSpecimensIncluded: false }
    },
    correctTargetTypeId: "reference-measurement-procedure",
    correctCommutabilityJudgementId: "verified-commutable",
    correctCapabilityConclusionId: "participant-performance",
    correctPatternJudgementId: "indeterminate",
    correctLongitudinalRelevanceId: "does-not-change-interpretation",
    correctNextActionId: "review-calibration-reagent-history",
    finalInterpretation: {
      currentEqaStatus: "meets-criterion", longitudinalEqaPattern: "indeterminate", comparabilityStatus: null, investigationStatus: "under-review",
      summary: "This EQA round is satisfactory, but a single satisfactory EQA event does not negate evidence of unstable routine analytical performance. EQA is a sparse periodic sample of performance and does not substitute for IQC surveillance.",
      supports: ["Nothing that overrides the existing IQC instability evidence."],
      doesNotProve: ["That the IQC instability is resolved or clinically unimportant."],
      reasonableNextAction: "Continue investigating the IQC instability on its own terms — do not close that investigation on the basis of this one EQA round."
    }
  },
  {
    id: 12, title: "Case 12 — Insufficient scheme information to determine whether trueness can be assessed",
    distribution: ["insufficient-information"],
    iqcStatus: "not-described",
    eqaResult: {
      round: "2026-R1", measurand: "Analyte V", participantResult: 45, units: "arbitrary units",
      assignedValue: 44, assignedValueType: "target-insufficiently-described",
      commutabilityStatus: "not-applicable-or-insufficient-information",
      schemeCapability: { commutabilityVerified: null, higherOrderTargetAvailable: null, methodGroupsDefined: null, performanceSpecificationStated: null, replicateSpecimensIncluded: null },
      interpretationLimitations: ["Target-assignment method not stated.", "Commutability not addressed by the scheme documentation.", "No method/instrument grouping described.", "No stated performance criterion."]
    },
    correctTargetTypeId: "target-insufficiently-described",
    correctCommutabilityJudgementId: "not-applicable-or-insufficient-information",
    correctCapabilityConclusionId: "insufficient-basis",
    correctPatternJudgementId: "indeterminate",
    correctLongitudinalRelevanceId: "not-applicable-insufficient-history",
    correctNextActionId: "contact-eqa-organiser",
    finalInterpretation: {
      currentEqaStatus: "criterion-not-stated", longitudinalEqaPattern: "indeterminate", comparabilityStatus: null, investigationStatus: "unresolved",
      summary: "This scheme's documentation does not state how the target was assigned, whether the material is commutable, whether method groups are defined, or what criterion applies. With this little information, this round cannot establish whether trueness can even be assessed — the honest conclusion is insufficiency, not a false reassurance of agreement.",
      supports: ["That the participant result (45) is numerically close to the stated assigned value (44) — nothing more can be concluded from that proximity alone."],
      doesNotProve: ["Trueness, comparability, or absence of a problem — the scheme simply does not provide enough information to assess any of these."],
      reasonableNextAction: "Contact the EQA scheme organiser to request target-assignment, commutability and grouping documentation before relying on this round for anything beyond a rough sanity check."
    }
  },
  {
    id: 13, title: "Case 13 — Method group improves after manufacturer recalibration",
    distribution: ["method-group", "longitudinal"],
    iqcStatus: "stable",
    eqaResult: {
      round: "2026-R5", measurand: "Analyte X", participantResult: 101.5, units: "arbitrary units",
      assignedValue: 100, assignedValueType: "reference-measurement-procedure",
      commutabilityStatus: "verified-commutable", peerGroup: "Manufacturer/instrument peer group", peerGroupMean: 101.2,
      performanceCriterion: { type: "relative-allowable-deviation", value: "±10%" },
      schemeCapability: { commutabilityVerified: true, higherOrderTargetAvailable: true, methodGroupsDefined: true, performanceSpecificationStated: true, replicateSpecimensIncluded: false }
    },
    longitudinal: [
      { round: 1, deviationPct: 7.5, event: null }, { round: 2, deviationPct: 7.8, event: null },
      { round: 3, deviationPct: 7.2, event: "Manufacturer-issued recalibration bulletin for this instrument group" },
      { round: 4, deviationPct: 2.1, event: null }, { round: 5, deviationPct: 1.5, event: null }
    ],
    correctTargetTypeId: "reference-measurement-procedure",
    correctCommutabilityJudgementId: "verified-commutable",
    correctCapabilityConclusionId: "method-performance",
    correctPatternJudgementId: "method-group",
    correctLongitudinalRelevanceId: "changes-interpretation",
    correctNextActionId: "no-action-routine-monitoring",
    finalInterpretation: {
      currentEqaStatus: "meets-criterion", longitudinalEqaPattern: "performance-improving", comparabilityStatus: null, investigationStatus: "resolved-method-group",
      summary: "The manufacturer/instrument peer group was persistently displaced (rounds 1-3), consistent with a method-wide issue, and improved sharply after a manufacturer-issued recalibration bulletin (rounds 4-5). The participant tracks its peer group throughout — this was never a participant-specific problem.",
      supports: ["A method-group pattern that improved following a manufacturer-level intervention."],
      doesNotProve: ["That every instrument in the group is now identically performing, or that the underlying mechanism is fully characterised."],
      reasonableNextAction: "No further participant-level action beyond routine monitoring is supported; continued tracking of the method group is still reasonable."
    }
  },
  {
    id: 14, title: "Case 14 — EQA sample handled specially, invalidating the intended assessment",
    distribution: ["participant-specific"],
    iqcStatus: "stable",
    eqaResult: {
      round: "2026-R4", measurand: "Analyte X", participantResult: 100.2, units: "arbitrary units",
      assignedValue: 100, assignedValueType: "reference-measurement-procedure",
      commutabilityStatus: "verified-commutable",
      schemeCapability: { commutabilityVerified: true, higherOrderTargetAvailable: true, methodGroupsDefined: true, performanceSpecificationStated: true, replicateSpecimensIncluded: false },
      interpretationLimitations: ["The EQA specimen was, per the case narrative, run in triplicate with the best of three results reported, and recalibration was performed solely because it was recognised as an EQA sample — outside routine practice."]
    },
    correctTargetTypeId: "reference-measurement-procedure",
    correctCommutabilityJudgementId: "verified-commutable",
    correctCapabilityConclusionId: "insufficient-basis",
    correctPatternJudgementId: "participant-specific",
    correctLongitudinalRelevanceId: "not-applicable-insufficient-history",
    correctNextActionId: "no-action-routine-monitoring",
    finalInterpretation: {
      currentEqaStatus: "meets-criterion", longitudinalEqaPattern: "indeterminate", comparabilityStatus: null, investigationStatus: "resolved-participant-specific",
      summary: "This result looks excellent, but the case narrative reveals the sample was recalibrated for and repeated beyond routine practice specifically because it was recognised as an EQA specimen. EQA is an assessment of routine performance, not a special examination to \"pass\" — this satisfactory-looking result does not represent routine performance and the intended assessment is invalidated.",
      supports: ["Nothing about routine performance — the special handling defeats the purpose of the assessment."],
      doesNotProve: ["That routine patient testing performs this well; the result reported here was not obtained under routine conditions."],
      reasonableNextAction: "Document the deviation from routine practice, review EQA-handling procedure with staff, and treat future rounds as requiring routine-only processing."
    }
  }
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    EXTERNAL_ASSURANCE_PATHWAY_STEPS, EXTERNAL_ASSURANCE_PATHWAY_CAUTION,
    GOOD_IQC_DOES_NOT_PROVE_TRUENESS_NOTE, POOR_EQA_DOES_NOT_AUTOMATICALLY_PROVE_BIAS_NOTE,
    EQA_TERMINOLOGY, EQA_PT_TERMINOLOGY_CAUTION,
    CORE_THREE_WAY_DISTINCTION, NOT_SIMPLY_PRECISION_VS_ACCURACY_NOTE,
    SIGNATURE_MISCONCEPTION_CASE,
    EQA_NOT_REALTIME_IQC_NOTE, EQA_CAN_REVEAL, EQA_REVEAL_DEPENDENCY_NOTE,
    EQA_RESULT_FIELDS, MISSING_FIELDS_STAY_MISSING_NOTE,
    TARGET_VALUE_TYPE_DESCRIPTIONS, NEVER_ALL_CALLED_TRUE_VALUE_NOTE,
    TARGET_HIERARCHY_GUARDRAIL_NOTE, TARGET_TYPE_CLASSIFICATION_ITEMS,
    PEER_GROUP_NOT_TRUTH_PRINCIPLE,
    COMMUTABILITY_CONCEPT_NOTE, COMMUTABILITY_NOT_JUST_HUMAN_SERUM_NOTE,
    COMMUTABILITY_STATUS_DESCRIPTIONS, UNKNOWN_NOT_EQUAL_FAILED_NOTE,
    COMMUTABILITY_CONSEQUENCE_NOTE, COMMUTABILITY_CHALLENGE_EXAMPLE,
    SCHEME_CAPABILITY_INPUTS, CAPABILITY_MILLER_ATTRIBUTION_NOTE,
    CAPABILITY_PARTICIPANT_PERFORMANCE_NOTE, CAPABILITY_METHOD_PERFORMANCE_NOTE, CAPABILITY_HARMONISATION_NOTE,
    PERFORMANCE_CRITERION_APS_LINK_NOTE,
    REPORT_INTERPRETATION_QUESTIONS,
    PEER_GROUP_HIDES_METHOD_BIAS_REPORT, LABORATORY_SPECIFIC_DEVIATION_REPORT, TARGET_CHANGES_CONCLUSION_REPORT,
    SINGLE_EVENT_VS_TREND_NOTE,
    LONGITUDINAL_EQA_TIMELINE, LONGITUDINAL_TIMELINE_TEACHING_NOTE, LONGITUDINAL_PATTERN_LABELS, LONGITUDINAL_STATUSES_ARE_DESCRIPTIONS_NOTE,
    NO_AUTOMATIC_TREND_ROOT_CAUSE_NOTE,
    IQC_EQA_COMBINED_MATRIX, STABLE_IQC_POOR_EQA_CAUTION, UNSTABLE_IQC_ACCEPTABLE_EQA_CAUTION,
    SAMPLE_HANDLING_INTEGRITY_NOTE, SAMPLE_HANDLING_DISCOURAGED, PT_INTEGRITY_CHALLENGE,
    EQA_PROCESS_ERROR_TYPES, INVESTIGATE_WHOLE_EQA_PROCESS_NOTE,
    COMPARABILITY_LAB_SCOPE_NOTE, DESIGNATED_COMPARATOR_NOTE, EXCLUDED_METHOD_COMPARISON_STATISTICS, EXCLUDED_STATISTICS_NOTE,
    COMPARABILITY_PAIRED_SPECIMENS, COMPARABILITY_LIMIT_LABEL, COMPARABILITY_LIMIT_CAUTION, COMPARABILITY_LAB_ILLUSTRATIVE_CRITERION,
    CONTROL_MATERIAL_TRAP_CASE, PATIENT_COMPARISON_TRAP_CASE,
    LONGITUDINAL_COMPARABILITY_SUMMARY, NOT_EVERY_DIFFERENCE_CLINICALLY_IMPORTANT_NOTE,
    EQA_INVESTIGATION_PATH_STEPS, EQA_INVESTIGATION_PATH_CAUTION,
    EXPLORE_INVESTIGATION_LINK_LABEL, NO_AUTO_TRANSFER_BETWEEN_MODULES_NOTE,
    NO_EQA_PASS_EQUALS_METHOD_VALID_NOTE, NO_EQA_FAIL_EQUALS_PATIENT_RESULTS_WRONG_NOTE,
    NO_PEER_MEAN_EQUALS_REFERENCE_VALUE_NOTE, NO_COMMUTABLE_EQUALS_PERFECT_NOTE,
    NO_AUTO_PATIENT_IMPACT_FROM_EQA_NOTE,
    PATTERN_JUDGEMENT_OPTIONS, CAPABILITY_CONCLUSION_OPTIONS, LONGITUDINAL_RELEVANCE_OPTIONS, NEXT_ACTION_OPTIONS,
    EXTERNAL_ASSURANCE_STAGES,
    EXTERNAL_ASSURANCE_CASES
  };
}
