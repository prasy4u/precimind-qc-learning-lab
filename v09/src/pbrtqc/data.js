/* =========================================================================
   RECOVERY PROVENANCE NOTE (added during Stage 8B recovery):
   Artifact Class A — directly recovered from recovery/original-v0.8.html
   (SHA-256: e5317bf135f350b258428b985c1034a081e244a295f2e580c93cb6a6a091c8e4)
   Source lines: 12476-13231 (Patient Surveillance Lab static data section)
   Historical reported v0.8 commit: 3cc62b1 (not independently verified)
   Recovery date: 2026-09-01
   The block below is the unmodified source text from the HTML artifact.
   ========================================================================= */

/* =========================================================================
   Patient Surveillance Lab (QC-12) — v0.8 static content. No calculation
   logic lives here — see 31-pbrtqc-calc.js. Mirrors the architecture of
   28-bv-data.js / 24-eqa-data.js / 20-investigation-data.js.

   Purpose taught by this module: the stream of routine patient results
   provides COMPLEMENTARY evidence about analytical-process stability, and
   under some conditions that evidence becomes misleading. PBRTQC is never
   presented as replacing IQC, and an alert is never presented as a
   root-cause diagnosis.
   ========================================================================= */

const PBRTQC_PATHWAY_STEPS = ["Patient population", "Data conditioning", "Algorithm", "Window", "Control limit", "Analytical error", "Alert", "Detection delay", "False alerts", "Validation", "Complementarity with IQC"];
const PBRTQC_PATHWAY_CAUTION = "This progression is a reasoning aid, not a rigid universal sequence a laboratory must follow in this exact order.";

/* -------------------------------------------------------------------------
   Core principle (spec sections 3-4).
   ------------------------------------------------------------------------- */
const PBRTQC_CORE_PRINCIPLE = "Patient-based real-time quality control (PBRTQC) monitors the analytical process INDIRECTLY, through the statistical behaviour of routine patient results. An observed change in a PBRTQC statistic can arise from an analytical change, a patient-population or case-mix change, a preanalytical or process change, a data or configuration change, or some combination of these. A PBRTQC alert requires interpretation — it is not, by itself, a root-cause diagnosis.";
const PBRTQC_COMPLEMENTARY_NOTE = "PBRTQC and internal quality control (IQC) are complementary sources of evidence about analytical stability, each with different strengths and blind spots. This application never teaches \"PBRTQC is better than IQC\" or the reverse — the two are evaluated together, not ranked.";
const PBRTQC_NOT_JUST_MOVING_AVERAGE_NOTE = "PBRTQC is not simply \"a moving average chart.\" It also depends on how patient results are selected and filtered, how a synthetic or real analytical disturbance is modelled, how a moving-window size or smoothing constant is chosen, how control limits are derived and justified, how detection delay and false-alert behaviour are measured, and how the whole configuration is trained and independently verified before use.";

/* -------------------------------------------------------------------------
   Never call an injected shift "calibration failure" (spec section 9).
   ------------------------------------------------------------------------- */
const NEVER_CALIBRATION_FAILURE_NOTE = "This laboratory never labels an injected shift \"calibration failure,\" \"reagent failure,\" or \"instrument failure.\" The neutral terms used throughout are \"synthetic analytical shift\" or \"injected systematic error\" — the simulation controls the ground truth, but a real PBRTQC alert never comes with that label attached.";

/* -------------------------------------------------------------------------
   Three architecturally separate scientific objects (spec sections 5-9).
   Documented here as field lists for the in-app data-model disclosures —
   never merged into one opaque object anywhere in this build.
   ------------------------------------------------------------------------- */
const PATIENT_POPULATION_SCENARIO_FIELDS = [
  { field: "id", def: "Stable identifier for this synthetic population scenario." },
  { field: "name", def: "Short display name (always states it is synthetic, e.g. \"Synthetic sodium-like distribution — narrow, stable\")." },
  { field: "description", def: "What this population is meant to illustrate and how it was generated." },
  { field: "baseResults[]", def: "The deterministic, pre-generated array of raw patient-result values, in submission order." },
  { field: "subgroupLabels[]", def: "Parallel array of metadata subgroup labels (e.g. \"general\", \"elevated-prevalence-subgroup\"), used only for the metadata-inclusion filter — never consulted by the algorithm directly." },
  { field: "instrumentLabels[]", def: "Optional parallel array identifying which synthetic analyzer produced each result, used only in the multiple-analyzer experiment." },
  { field: "timestamps[]", def: "Optional parallel array of illustrative submission order/time markers, used only for the throughput/elapsed-time teaching content." },
  { field: "distributionDescriptor", def: "A short label for the distribution shape (e.g. \"narrow-stable\", \"broad-heterogeneous\", \"right-skewed\", \"changing-case-mix\", \"bimodal-mixture\")." },
  { field: "stabilityDescriptor", def: "Whether the underlying case-mix is stable or changes partway through the stream, and where." },
  { field: "caseMixPattern", def: "A description of any subgroup-proportion change over the stream, independent of any analytical error." },
  { field: "throughput", def: "An illustrative results-per-hour figure, used only under an explicit constant-throughput teaching assumption." },
  { field: "provenance", def: "Always \"Synthetic deterministic teaching data. Not derived from real patients.\"" },
  { field: "limitations", def: "What this synthetic population does NOT represent (e.g. a specific real analyte's true population distribution)." }
];

const ANALYTICAL_ERROR_SCENARIO_FIELDS = [
  { field: "id", def: "Stable identifier for this synthetic error scenario." },
  { field: "errorType", def: "One of \"none\", \"persistent-additive\", \"persistent-proportional\", \"temporary-additive\", \"temporary-proportional\". No imprecision (random-variance) modelling is implemented." },
  { field: "magnitude", def: "The size of the shift (absolute units for additive; percent for proportional)." },
  { field: "onsetIndex", def: "The 1-based RAW patient index at which the error begins." },
  { field: "duration", def: "For temporary errors only: how many raw patient results the error persists for before reverting." },
  { field: "direction", def: "Illustrative label for whether the injected shift is a rise or a fall, for display purposes." },
  { field: "description", def: "A plain-language description of what this scenario is teaching." }
];

const PBRTQC_ALGORITHM_CONFIGURATION_FIELDS = [
  { field: "id", def: "Stable identifier for this algorithm configuration." },
  { field: "algorithmId", def: "One of \"moving-mean\", \"moving-median\", \"ewma\" — the only three algorithms numerically implemented in v0.8." },
  { field: "windowSize", def: "W — the PBRTQC moving-window size (moving-mean/moving-median only). NEVER called N in this application." },
  { field: "ewmaLambda", def: "The EWMA smoothing constant (0 < lambda <= 1), EWMA only." },
  { field: "metadataInclusionRules", def: "Which subgroup labels are excluded from the algorithm's input, if any." },
  { field: "lowerTruncationLimit / upperTruncationLimit", def: "Hard-exclusion truncation bounds (inclusive of the boundary itself). Either or both may be omitted (no truncation)." },
  { field: "lowerControlLimit / upperControlLimit", def: "The alert thresholds compared against the algorithm's statistic." },
  { field: "baselineCenter", def: "EWMA only: the explicit z0 seed value. Never silently taken from the first observed result." },
  { field: "trainingDatasetId / verificationDatasetId", def: "Which architecturally separate dataset was used for parameter selection versus independent performance verification." },
  { field: "provenance", def: "How this configuration's parameters were obtained — see PARAMETER_PROVENANCE_OPTIONS below. Never left unstated." },
  { field: "assumptions", def: "What this configuration assumes about the population and process it is applied to." }
];

/* -------------------------------------------------------------------------
   N, R, M and W are different (spec sections 10-13). W is the ONLY symbol
   this module uses for PBRTQC moving-window size. N (QC measurements per
   event/run) is never redefined.
   ------------------------------------------------------------------------- */
const N_R_M_W_DISTINCTION_EXAMPLE = {
  n: { symbol: "N", value: 2, meaning: "QC measurements analysed per QC event/run (Rule Laboratory / QC Strategy Lab)." },
  r: { symbol: "R", value: 1, meaning: "QC runs (an \"event\" at which N QC measurements are analysed)." },
  m: { symbol: "M", value: 100, meaning: "Patient samples analysed between two QC events (Risk & Frequency Lab)." },
  w: { symbol: "W", value: 20, meaning: "PBRTQC moving-window size — the number of eligible patient results contributing to the configured moving window (this module)." }
};
const N_R_M_W_DISTINCTION_STATEMENT = "Numerical equality between any of these variables does not make their scientific meanings equivalent. N=2 QC measurements, M=100 patient samples between QC events, and W=20 eligible results in a PBRTQC window all count something, but they count entirely different things, defined in entirely different frameworks.";

const PBRTQC_VS_RCV_DISTINCTION = "PBRTQC is not \"population-level RCV.\" A reference change value (RCV, see the BV & RCV Lab) evaluates whether a change between two SERIAL results from the SAME individual exceeds what combined analytical and within-subject biological variation would explain. PBRTQC evaluates a moving statistic computed across an AGGREGATE STREAM of results from MANY DIFFERENT patients. These answer different questions, using different data, for different purposes — this application never describes PBRTQC as a population-level or aggregate form of RCV.";

const PBRTQC_VS_CVG_DISTINCTION = "A patient population's result distribution is not equivalent to CVG (between-subject biological variation, see the BV & RCV Lab). A population's observed spread reflects disease prevalence, case-mix, demographics, comorbidity, and many other factors specific to who is being tested and why — not a controlled biological-variation study in healthy volunteers. This module deliberately does NOT reuse the BV & RCV Lab's biological-variation engine to generate PBRTQC patient populations; the two are built from entirely separate, independently authored synthetic data.";

/* -------------------------------------------------------------------------
   Algorithms implemented vs. mentioned vs. excluded (spec sections 14-17).
   ------------------------------------------------------------------------- */
const ALGORITHMS_IMPLEMENTED = [
  { id: "moving-mean", label: "Sliding moving mean", description: "The arithmetic mean of the W most recent eligible results, recomputed at every new eligible result." },
  { id: "moving-median", label: "Sliding moving median", description: "The ordinary median of the W most recent eligible results, recomputed at every new eligible result." },
  { id: "ewma", label: "Exponentially weighted moving average (EWMA)", description: "A recursively smoothed statistic, z_t = lambda*x_t + (1-lambda)*z_(t-1), seeded from an explicit baseline centre." }
];
const ALGORITHMS_MENTIONED_NOT_IMPLEMENTED = [
  "Bull's algorithm (a truncated/adjusted moving average historically used for haematology indices).",
  "Average of Normals (AoN).",
  "Moving standard deviation.",
  "Moving delta checks aggregated across a population.",
  "Moving sum of outliers / moving rate of abnormal results.",
  "Moving percentiles."
];
const ALGORITHMS_EXCLUDED_FROM_V08 = [
  "CUSUM-based PBRTQC.",
  "RARTQC and other regression-adjusted PBRTQC methods.",
  "Non-linear regression-adjusted PBRTQC.",
  "Neural-network-based PBRTQC.",
  "Tree-based (e.g. random-forest, gradient-boosted) PBRTQC.",
  "AI-driven automated parameter optimisation.",
  "General anomaly-detection machine learning applied to patient streams."
];
const ALGORITHM_SCOPE_NOTE = "This lab implements exactly three algorithms numerically: sliding moving mean, sliding moving median, and EWMA — all evaluated as SLIDING statistics (recomputed at every new eligible result), never as non-overlapping blocks. Other approaches described in the literature are mentioned for context but not computed anywhere in this build.";

/* -------------------------------------------------------------------------
   Sliding vs. non-overlapping blocks (spec sections 28-29).
   ------------------------------------------------------------------------- */
const SLIDING_VS_BLOCKS_NOTE = "A SLIDING statistic recomputes at every new eligible result, using the W most recent eligible values each time (overlapping windows). A NON-OVERLAPPING BLOCK approach instead computes one statistic per separate block of W results, with no overlap between blocks. This application's numeric engine uses sliding statistics for both the moving mean and the moving median — it never implements non-overlapping blocks.";

/* -------------------------------------------------------------------------
   Seven-step processing pipeline (spec section 30) — documented here for
   the in-app disclosure; enforced structurally by runPbrtqcStream() in
   31-pbrtqc-calc.js.
   ------------------------------------------------------------------------- */
const PROCESSING_PIPELINE_STEPS = [
  "1. Metadata is generated for the patient result (subgroup, instrument, timing).",
  "2. Metadata inclusion/exclusion filtering is applied.",
  "3. Any synthetic analytical error is applied to the result.",
  "4. Numeric truncation (hard exclusion) is applied.",
  "5. The eligible value enters the configured algorithm.",
  "6. The algorithm's statistic is calculated.",
  "7. The statistic is compared with the configured control limits."
];
const PROCESSING_ORDER_NOTE = "This order matters: error injection happens BEFORE truncation. A value that is only pushed outside the truncation limits because of the injected error is therefore correctly excluded — truncating first, using the un-shifted baseline value, would silently hide the effect of the very error this simulation exists to demonstrate.";

/* -------------------------------------------------------------------------
   Metadata exclusion filters (spec section 31) — synthetic examples only.
   ------------------------------------------------------------------------- */
const METADATA_EXCLUSION_EXAMPLES = [
  { id: "inpatient", label: "Exclude inpatient results" },
  { id: "outpatient", label: "Exclude outpatient results" },
  { id: "emergency", label: "Exclude emergency-department results" },
  { id: "dialysis", label: "Exclude dialysis-programme results" },
  { id: "paediatric", label: "Exclude paediatric results" },
  { id: "elevated-prevalence-subgroup", label: "Exclude the elevated-prevalence subgroup (Population D)" }
];
const METADATA_FILTER_CAUTION = "No metadata exclusion rule listed here is universally appropriate for every laboratory or every analyte. Each is a synthetic teaching example, illustrating a trade-off (representativeness vs. homogeneity of the monitored stream), not a recommended default.";

/* -------------------------------------------------------------------------
   Truncation (spec sections 32-37).
   ------------------------------------------------------------------------- */
const TRUNCATION_NOTE = "This application implements exactly ONE truncation approach: hard exclusion. A result strictly below the lower truncation limit, or strictly above the upper truncation limit, is excluded from the algorithm entirely. A result exactly AT a limit remains eligible. This is never called \"winsorisation\" — winsorisation instead clamps an out-of-range value to the limit rather than excluding it, and is a different technique not implemented anywhere in this build.";
const NO_UNIVERSAL_TRUNCATION_NOTE = "This application never states a \"recommended universal truncation limit\" for any real analyte. Every truncation limit shown is a scenario-specific, illustrative teaching value.";

/* -------------------------------------------------------------------------
   Parameter provenance (spec section 88) — every configuration must state
   how its parameters were obtained.
   ------------------------------------------------------------------------- */
const PARAMETER_PROVENANCE_OPTIONS = [
  { id: "illustrative-teaching", label: "Illustrative teaching configuration", description: "Chosen to make a specific teaching point clear, not derived from any dataset." },
  { id: "derived-from-training-data", label: "Derived from synthetic training data", description: "Computed from the scenario's own training dataset (e.g. a mean and spread from a stable training segment)." },
  { id: "literature-derived-example", label: "Literature-derived example", description: "Based on a value discussed in the cited literature, used here as an example rather than a universal recommendation." },
  { id: "user-entered-experimental", label: "User-entered experimental value", description: "Set directly by the learner while exploring the lab." }
];
const STARTING_CONFIGURATION_LANGUAGE_NOTE = "This application always calls an initial parameter set a \"starting teaching configuration,\" never a \"recommended configuration\" — unexplained defaults are never implied to be optimal.";

/* -------------------------------------------------------------------------
   Control limits (spec sections 50-53).
   ------------------------------------------------------------------------- */
const CONTROL_LIMIT_PROVENANCE_NOTE = "This application never hard-codes a universal \"mean +/- 2SD\" or \"mean +/- 3SD\" control limit for PBRTQC. Every scenario displays HOW its limits were obtained, using the same PARAMETER_PROVENANCE_OPTIONS categories used for every other configuration choice.";
const ALERT_BOUNDARY_NOTE = "Alert boundary convention (v0.8): a statistic strictly below the lower control limit, or strictly above the upper control limit, triggers an alert. A statistic exactly equal to a control limit does NOT trigger an alert.";
const CONTROL_LIMIT_TRADEOFF_NOTE = "Narrower control limits detect smaller shifts sooner but increase the false-alert rate. Wider control limits reduce false alerts but delay or miss smaller shifts. There is no universally optimal trade-off — the right balance depends on the analyte, the population, and the clinical consequences of a missed or a false alert.";

/* -------------------------------------------------------------------------
   Mandatory persistent statements (spec sections 80-84).
   ------------------------------------------------------------------------- */
const ALERT_INTERPRETATION_STATEMENT = "A PBRTQC alert indicates that the configured patient-based statistic crossed its control limit. It does not identify why.";
const STABLE_PBRTQC_DOES_NOT_VALIDATE_STATEMENT = "A stable PBRTQC statistic does not prove that every individual patient result is analytically correct.";
const PBRTQC_NOT_DELTA_CHECK_STATEMENT = "PBRTQC is not a delta check. A delta check compares two serial results from the SAME patient (see the BV & RCV Lab's reference change value tools); PBRTQC evaluates a moving statistic across an aggregate stream of many different patients.";
const PBRTQC_NOT_EQA_STATEMENT = "PBRTQC is not EQA. External quality assessment (see the External Assurance Lab) compares a laboratory's result on a shared, characterised material against peer or reference values at a scheduled interval; PBRTQC continuously monitors routine patient results between those events.";
const ALERT_ROUTES_TO_INVESTIGATION_NOTE = "Interpreting what a PBRTQC alert might mean is routed conceptually to the existing Investigation Lab via an \"Investigate this alert\" link. This application never automatically transfers a PBRTQC alert into a confirmed process-failure state — the two modules do not share mutable scenario state.";

/* -------------------------------------------------------------------------
   False-positive flag rate (spec sections 44-46) and training/verification
   architecture (spec sections 47-49, 90-95).
   ------------------------------------------------------------------------- */
const FALSE_FLAG_RATE_NOTE = "A formal false-positive flag rate is calculated ONLY on a verification stream explicitly designated stable, with no injected error and no case-mix shift: pointwise false-flag rate = (points outside the control limits / evaluable points) x 100. Consecutive moving-window statistics are correlated with one another (they share overlapping eligible values), so this is not equivalent to a set of independent hypothesis tests and is never called simply \"alpha.\"";
const TRAINING_VERIFICATION_SEPARATION_NOTE = "Training and verification datasets are architecturally separate fields in this application, never one shared field reused for two purposes. The TRAINING dataset supports familiarisation, parameter selection, and candidate control limits. The VERIFICATION dataset supports baseline false-alert assessment, error insertion, and detection-performance verification.";
const VERIFICATION_LEAKAGE_NOTE = "Repeatedly tuning a configuration against the verification dataset, then reporting the resulting performance figures as if they came from an independent verification, is NOT independent verification. This is a form of data leakage, and this application teaches it as a signature mistake to recognise and avoid.";
const HISTORICAL_DATA_NOTE = "Developing a PBRTQC configuration requires enough historical data to characterise the population and estimate baseline behaviour reliably — there is no single universal minimum number of results that applies to every analyte and laboratory. Training/verification split examples such as 50:50 or 80:20 (see Loh et al., 2020) are shown as EXAMPLES from the literature, not as a mandated split.";

/* -------------------------------------------------------------------------
   No live data (spec sections 96-99).
   ------------------------------------------------------------------------- */
const NO_LIVE_DATA_NOTE = "This module uses no live patient data of any kind: no CSV upload, no LIS/analyser interface, no identifiable data, and no real historical datasets. Every population in the Patient Distribution Lab is a small, deterministic, pre-generated synthetic array, always labelled accordingly.";
const SYNTHETIC_DATA_CARD_LABEL = "Synthetic deterministic teaching data. Not derived from real patients.";
const PRIVACY_BRIEF_NOTE = "A real PBRTQC implementation processes identifiable patient data and must be governed by the laboratory's data-protection and privacy obligations. This application does not build any privacy infrastructure — it never collects, stores, or transmits real patient data, because none is ever used.";

/* -------------------------------------------------------------------------
   Informatics reliability (spec sections 100-102) — taught conceptually.
   ------------------------------------------------------------------------- */
const INFORMATICS_RELIABILITY_TOPICS = [
  "Analyzer identification and correct routing of results to the intended patient-stream configuration.",
  "Timestamp accuracy and ordering, since PBRTQC algorithms are order-sensitive.",
  "Units consistency across instruments, interfaces and reporting.",
  "Result status (e.g. preliminary vs. final, corrected vs. original) reaching the PBRTQC feed correctly.",
  "Correct application of the configured metadata inclusion/exclusion filters at the interface layer.",
  "Interface reliability — dropped messages, delayed messages, or reordered messages.",
  "Duplicated or edited results reaching the PBRTQC feed more than once, or being silently corrected without the correction propagating.",
  "Data routing changes (e.g. a new middleware version) that alter which results reach the PBRTQC stream without any analytical change occurring."
];
const INFORMATICS_CHALLENGE_SCENARIO = {
  narrative: "A laboratory's PBRTQC statistic shifts abruptly. Around the same time, a middleware update began duplicating a subset of results onto the PBRTQC feed. No calibration, reagent, or QC-material change occurred, and IQC remains within limits.",
  question: "What is the most defensible next step?",
  correctAnswer: "investigate-pipeline",
  explanation: "The correct next step is to investigate the data pipeline (duplicate-feed / interface behaviour), not to assume analytical bias. A PBRTQC statistic reflects whatever data actually reaches it — an informatics fault can move the statistic exactly as an analytical fault can, and the two are not distinguishable from the statistic alone."
};

/* -------------------------------------------------------------------------
   Validation lifecycle (spec section 92-95, 103).
   ------------------------------------------------------------------------- */
const VALIDATION_LIFECYCLE_STEPS = ["Training (familiarisation)", "Parameter selection", "Independent verification", "Implementation", "Ongoing review", "Re-verification after material change"];
const VALIDATION_LIFECYCLE_NOTE = "This lifecycle never implies a PBRTQC configuration is \"validated once, forever.\" Ongoing review and re-verification after a material change are part of the same lifecycle, not an optional afterthought.";
const MATERIAL_CHANGE_EXAMPLES = [
  "A reagent lot or platform change affecting the monitored analyte.",
  "A significant shift in referral pattern or case mix (e.g. a new clinical service sending samples).",
  "A change to the informatics pipeline feeding the PBRTQC stream.",
  "A change to the metadata inclusion/exclusion rules.",
  "A change to the algorithm, window size, smoothing constant, or control limits themselves."
];
const MATERIAL_CHANGE_LIST_CAUTION = "This is not an exhaustive or universal trigger list — what counts as a \"material change\" requiring re-verification is a laboratory-specific judgement.";
const NO_AUTO_OPTIMIZER_NOTE = "This application deliberately does NOT implement a \"find the best PBRTQC configuration\" auto-optimiser. Parameter selection is shown as a reasoned, documented choice with stated provenance, never as a button that searches for and returns an optimal answer.";
const NO_UNIVERSAL_TARGETS_NOTE = "This application never states a universal performance target (for example, \"ANPed < 20\" or \"false-flag rate < 1%\" or \"W = 20 is the correct window size\" or \"lambda = 0.2 is the correct smoothing constant\") as a fixed requirement for every laboratory and analyte. Every numeric target shown is scenario-specific and illustrative.";
const IQC_FREQUENCY_CONNECTION_EXPERIMENT = {
  narrative: "In one scenario, M=200 patient samples typically separate two scheduled IQC events, and a PBRTQC configuration in the same laboratory detects an injected error after NPed=35 patient results — well before the next scheduled IQC event.",
  question: "What does this demonstrate?",
  correctAnswer: "complementary",
  explanation: "This demonstrates complementary surveillance — PBRTQC can, in this scenario, provide earlier evidence of a disturbance than the next scheduled IQC event would. It does NOT mean PBRTQC replaces scheduled IQC: IQC still tests a characterised material at known concentrations under controlled conditions, which PBRTQC cannot do."
};
const V04_ANPED_REMINDER_NOTE = "v0.4 introduced ANPed conceptually within the Risk & Frequency Lab's patient-risk framework. This module reuses the SAME NAME for a different but related quantity (mean patient results before detection, here computed across PBRTQC error-injection trials) and does not rewrite or reconnect to v0.4's patient-risk engine — see the distinct-metrics note below.";
const NPED_VS_MAXENUF_NOTE = "NPed/ANPed and MaxE(Nuf) are different metrics derived in different quality-control frameworks. This application never combines their formulas or presents one as a substitute for the other.";
const REPORT_FROM_BACK_NOTE = "\"Report from the back\" — holding a block of results pending completion of the block before releasing them — is mentioned here only as a conceptual approach some laboratories use alongside PBRTQC. This application does not implement any automated result-holding or auto-release logic.";

/* -------------------------------------------------------------------------
   Throughput (spec sections 74-75).
   ------------------------------------------------------------------------- */
const THROUGHPUT_NOTE = "Patient-count detection delay (NPed, measured in patient results) is not the same as elapsed-time detection delay. The same NPed=50 means roughly 1 hour at a throughput of 50 results/hour, but roughly 10 hours at a throughput of 5 results/hour.";
const THROUGHPUT_EXAMPLE = { nped: 50, labA: { resultsPerHour: 50, elapsedHours: 1 }, labB: { resultsPerHour: 5, elapsedHours: 10 } };
const THROUGHPUT_ASSUMPTION_LABEL = "Simplified constant-throughput teaching assumption — real submission rates vary by time of day, day of week, and clinical demand, so this elapsed-time figure is illustrative, not a prediction.";

/* -------------------------------------------------------------------------
   Multiple analyzers (spec sections 76-77).
   ------------------------------------------------------------------------- */
const MULTIPLE_ANALYZER_NOTE = "Combining patient results across instruments changes the monitored process and must be validated for that configuration.";
const MULTIPLE_ANALYZER_EXPERIMENT = {
  narrative: "Analyzer A develops a persistent additive shift starting at raw patient result 81 (magnitude +6, on a synthetic narrow-stable population, W=20 moving mean, limits 137-143). Analyzer B, sampled independently from the same underlying distribution, remains stable throughout.",
  separateStreams: { analyzerAFirstAlertRawIndex: 93, analyzerANped: 12, analyzerBAlertCount: 0 },
  pooledStream: { pooledFirstAlertRawIndex: 182, pooledOnsetRawIndex: 161, pooledNped: 21, windowSize: 40 },
  lesson: "Monitored separately, Analyzer A's shift is detected after 12 of its own patient results (NPed=12). Pooled 1:1 with stable Analyzer B into a single interleaved stream (window doubled to keep the same number of contributing instrument-A results per window), the same underlying shift is detected only after 21 pooled-stream results have accumulated. Pooling does not always help or always hurt detection — here it changed the effective units and timing of detection, illustrating why a pooled configuration is a different monitored process requiring its own validation, not simply \"the same PBRTQC applied to more data.\""
};

/* -------------------------------------------------------------------------
   Case-mix instability (spec sections 78-79).
   ------------------------------------------------------------------------- */
const CASE_MIX_EXCLUSION_DANGER_NOTE = "Excluding an unstable subgroup from a PBRTQC stream does not automatically make the configuration \"scientifically better.\" It may reduce representativeness, reduce the volume of eligible results (widening detection delay for genuine analytical errors), and create a blind spot for exactly the population segment that was excluded — any such exclusion rule requires its own validation, not just an intuitive justification.";

/* -------------------------------------------------------------------------
   Learner-level adaptation (spec section 166).
   ------------------------------------------------------------------------- */
const PBRTQC_LEVEL_EXPLANATION = {
  beginner: "Focus on what PBRTQC is monitoring (routine patient results, not QC material) and why an alert alone cannot tell you the cause.",
  intermediate: "Explore how algorithm, window size, truncation, and control limits interact to change detection delay and false-alert behaviour.",
  advanced: "Reason about training/verification separation, multiple-analyzer pooling, case-mix instability, and informatics failure modes.",
  expert: "Critique parameter provenance, validation lifecycle, and how PBRTQC evidence should be weighed alongside IQC and other QC frameworks in a governance decision."
};

/* -------------------------------------------------------------------------
   Recommended flow for the Error Detection Simulator (spec section 86).
   ------------------------------------------------------------------------- */
const ERROR_DETECTION_RECOMMENDED_FLOW = ["Population", "Inclusion / truncation", "Error injection", "Algorithm", "Control limits", "Alert", "NPed"];

/* -------------------------------------------------------------------------
   Workflow questions A-G + confidence (spec sections 125-127).
   ------------------------------------------------------------------------- */
const PBRTQC_WORKFLOW_QUESTIONS = [
  { id: "A", text: "What changed?" },
  { id: "B", text: "What remained unchanged?" },
  { id: "C", text: "Is the alert analytically interpretable from this evidence alone?" },
  { id: "D", text: "What does the available evidence support?" },
  { id: "E", text: "What does it NOT prove?" },
  { id: "F", text: "What should be reviewed next?" },
  { id: "G", text: "How confident are you in this reading? (metacognitive only)" }
];
const PBRTQC_CONFIDENCE_NEVER_ALTERS_SCORE_NOTE = "Confidence is recorded for your own metacognitive reflection only. It never changes the scientific-reasoning score for a case.";

/* -------------------------------------------------------------------------
   Scientific-language regression list (spec section 150) — eleven forbidden
   blanket statements. Kept here as data so both the UI's "misconceptions
   to avoid" panel and test-pbrtqc.js's regression scan draw from the same
   single source of truth.
   ------------------------------------------------------------------------- */
const FORBIDDEN_BLANKET_STATEMENTS = [
  "PBRTQC replaces IQC.",
  "A PBRTQC alert proves analytical error.",
  "A stable moving average proves all patient results are correct.",
  "Moving median is always better than moving average.",
  "Smaller window size is always better.",
  "One truncation interval is optimal for every laboratory.",
  "Patient populations are stable over time.",
  "Patient distribution equals biological variation.",
  "PBRTQC is the same as RCV.",
  "Pooling analysers always improves PBRTQC.",
  "Every PBRTQC alert requires patient-result recall.",
  "ANPed is the same as MaxE(Nuf)."
];
const METHODOLOGICAL_DEVELOPMENT_NOTE = "PBRTQC is an active area of methodological development. Algorithm and parameter choices require local validation rather than uncritical transfer from another laboratory.";

/* -------------------------------------------------------------------------
   Exclusion list (spec section 169).
   ------------------------------------------------------------------------- */
const PBRTQC_EXCLUSION_LIST = [
  "CUSUM", "a general moving-SD engine", "moving delta checks", "a moving-sum-of-outliers (MovSum) engine",
  "a moving-percentile engine", "Box-Cox transformation", "winsorisation", "automated parameter optimisation",
  "machine learning of any kind", "RARTQC", "real patient-data upload", "LIS/analyser connectivity",
  "automatic patient-result hold/auto-release", "clinical notification", "automated root-cause diagnosis",
  "real-time production monitoring", "PBRTQC certification", "user accounts", "faculty analytics",
  "the Morning QC Room"
];

/* =========================================================================
   Deterministic synthetic patient populations (spec sections 38-43).
   Pre-generated once with an explicit, documented seed (mulberry32 PRNG,
   Box-Muller normal transform) rather than generated at runtime with
   Math.random — no hidden randomisation. Every card states the mandatory
   provenance line.
   ========================================================================= */
const POPULATION_A_VALUES = [
  139.5, 137.4, 142.3, 141.5, 138.7, 144, 137.6, 139.4, 137.4, 141.7, 137.5, 138.4, 142.6, 140.9, 137.5,
  140.9, 138.6, 141.7, 137.5, 140, 138.1, 147.5, 137.2, 139.5, 140.4, 137.6, 137.7, 140.1, 139.3, 140.7,
  136.8, 131.5, 139.4, 138.2, 142.1, 141.3, 139.4, 140.8, 140.3, 139.4, 142.1, 138.3, 140.1, 139.6, 140.7,
  139.6, 143.7, 141.1, 142.3, 142.6, 142.8, 144.3, 136.6, 141.4, 138.3, 139.2, 139.1, 142.8, 142.2, 134.7,
  138.5, 139, 140.3, 140.4, 141.5, 137.5, 142, 139.6, 139, 140.9, 141.4, 140.9, 138.8, 137.6, 140.2,
  142.8, 141.5, 137.5, 136.7, 141.8, 142.7, 140.1, 140.9, 135.4, 138, 141.1, 136.6, 139.3, 136.8, 136.8,
  139.7, 138.1, 140.6, 139.2, 138.1, 137.5, 134.4, 142.3, 137.1, 139.6, 139.8, 136.7, 142.4, 139, 141.9,
  146, 139.6, 141.1, 139.1, 136.3, 137.4, 139.8, 140.1, 136.3, 138.3, 145.3, 140.2, 140.1, 140.6, 139.4,
  139.9, 144.6, 144, 139.3, 142.9, 136.2, 138.4, 140, 141.3, 141.6, 135.2, 137.2, 137.7, 140.2, 140.1,
  142.9, 144.3, 140.2, 141.4, 137.3, 137.4, 139.7, 139.2, 139.3, 142.3, 140.4, 137.2, 141.4, 139.2, 136.6
];

const POPULATION_B_VALUES = [
  153.9, 138.9, 142.6, 133.6, 145.1, 137.6, 150.2, 128.5, 144.2, 137.6, 141.5, 126.1, 148.6, 121.3, 139.8,
  137.2, 134.7, 142.2, 136.3, 129.5, 135.8, 151.2, 148.8, 137.6, 164.7, 143.4, 149.6, 129.8, 138.2, 141.8,
  145, 143.9, 140.5, 130.8, 147.5, 129.2, 149.3, 152.4, 133.5, 128.4, 137, 135.6, 146.9, 114.7, 128.4,
  146.1, 134.5, 144.5, 154.7, 126.2, 144.9, 141, 122.7, 147.4, 145.4, 161.1, 143.2, 150.6, 151.6, 148.5,
  138.8, 132.2, 144.7, 152.1, 133.3, 139.8, 135.9, 125.7, 142.8, 143.7, 147.1, 129.8, 138.8, 153, 151.9,
  149.7, 150.5, 143.8, 135.2, 135.1, 143.4, 159.2, 144.5, 135.4, 147.3, 150.7, 152.2, 150, 147.6, 149.6,
  129.1, 142.2, 142, 141.6, 134.2, 139.5, 152.4, 141.7, 146.8, 126.1, 159, 130.8, 130.8, 151.5, 131.4,
  150, 149.2, 148.1, 150.5, 134.7, 141.3, 147.6, 124.1, 155.9, 148.9, 142.1, 126, 140.1, 158.5, 142.1,
  137.7, 141.6, 135.5, 145.8, 144.6, 137, 138.2, 143.7, 145.3, 124.8, 138.5, 144, 138.6, 139.4, 145,
  128.9, 143.7, 140.4, 120, 148.6, 141.7, 133.6, 155.4, 146.9, 130.3, 132.9, 146.7, 136.8, 156.6, 138
];

const POPULATION_C_VALUES = [
  62.3, 46.2, 38.5, 65.9, 45.6, 49.3, 63.5, 69.5, 89.5, 59.1, 49.6, 72.2, 58.2, 77.6, 39.2,
  96.1, 114.3, 56.9, 31.4, 56.6, 53.9, 60, 62, 73.6, 37.9, 92, 47.7, 38.9, 40, 53.7,
  67.2, 79.6, 58.2, 35.6, 48.5, 50.2, 35.3, 43.3, 49.6, 62.9, 42.3, 54.9, 32.5, 41.1, 89.8,
  52, 44.3, 60.4, 48.2, 43, 27.3, 71.9, 88.3, 40.6, 17.8, 48, 74.7, 47.1, 51, 50.5,
  47.1, 95, 64.7, 59, 49.2, 35.3, 48, 69, 47.8, 55.4, 38.9, 126.9, 46.2, 45.1, 40.9,
  76.4, 41.8, 42.1, 51.1, 46.3, 32.9, 34.2, 49.4, 61.1, 24.7, 63.8, 35, 37.4, 71.4, 50.7,
  82.3, 83.2, 68.7, 33.5, 90.2, 39, 31.7, 34.5, 52.6, 57.3, 72.6, 54.6, 86.4, 46.6, 60.9,
  55, 62.1, 47.7, 58.7, 49.3, 70.9, 52.4, 23.9, 21.8, 80.7, 34, 44.4, 46.1, 49.4, 57.9,
  31, 52.7, 25.2, 63.9, 40.7, 42.7, 120.4, 26.4, 33.4, 61, 28.8, 75.5, 27.1, 46, 41.8,
  32.7, 29.1, 39.4, 73, 64.2, 68.8, 91.1, 39.6, 71.3, 30.2, 45.9, 45.6, 88.9, 64.8, 66.6
];

const POPULATION_D_VALUES = [
  141.8, 146.1, 139.3, 148, 147.2, 139.4, 142.9, 140.8, 142.3, 137.6, 135.2, 142.9, 140.6, 138.4, 135.7,
  137.1, 139, 139.2, 140.5, 136.6, 144.2, 138.3, 141, 140.1, 143.3, 137.1, 138.9, 140.6, 136.6, 138.1,
  139.7, 137.4, 142.5, 140.9, 141.7, 142.7, 137.9, 141.2, 138.2, 137.5, 143, 149.4, 143, 146.1, 139.4,
  147.7, 138.7, 140.6, 141.1, 137.1, 140.1, 140.2, 139.3, 144.2, 139.4, 137.6, 137.6, 141.8, 139.3, 150.7,
  149.2, 134.7, 136, 136.6, 141.3, 139, 142.3, 149, 140.9, 136.5, 137.7, 137.5, 139.2, 144.3, 142.4,
  143, 153.8, 144.1, 136.3, 140.6, 137.5, 141.4, 144.7, 142.2, 136.3, 139.5, 140.4, 140.5, 132.5, 137.6,
  136.2, 136, 138.6, 151.6, 144, 139, 138.1, 142.1, 137.9, 139.7, 139, 139.7, 139.3, 143.6, 135.8,
  141.5, 151.3, 134.3, 135.4, 138.5, 136, 145.4, 142, 155.9, 140, 142.9, 142.8, 137.2, 138.9, 147.2,
  148.3, 135.8, 134.9, 138.1, 148.6, 150.1, 141.8, 147.5, 139.7, 138.2, 141.9, 142.5, 140, 138, 142.4,
  142.8, 142.3, 140.2, 136.3, 150, 138.1, 141.8, 147.2, 141.1, 137.4, 137.2, 141.6, 144.8, 137.2, 140.6,
  148.7, 151.6, 146.5, 140.4, 152.5, 152.9, 150.9, 136.5, 149.9, 153.7, 154.1, 150.2, 151.3, 144.2, 140.1,
  153.2, 153.9, 152.5, 151.8, 145.7, 139, 145.6, 137.3, 152.5, 150.3, 154.8, 148.2, 142.5, 151.1, 148.1,
  138, 150.5, 140.3, 146.1, 148.5, 143.5, 145.7, 151.1, 146.5, 141, 144.5, 138.8, 151.7, 151.1, 149.1,
  148.4, 149.1, 150.3, 138, 142.4, 141.2, 144.8, 143.8, 146.9, 149.3, 139.5, 148.8, 152.6, 142.6, 143.1,
  139.5, 141.1, 146, 146.3, 137.6, 138.1, 137.6, 147.5, 152.1, 136.6, 143.6, 151.4, 146.7, 152.5, 148.6,
  135.5, 148.4, 155.9, 152, 151.1, 148, 146.4, 146.5, 154.3, 141.1, 136.3, 144, 151.4, 150, 148.3,
  151, 136.4, 149.9, 150.9, 140.3, 149, 145.8, 144.4, 151.6, 149.8, 147.6, 149.4, 157.2, 150.5, 150,
  154.8, 150.6, 141.9, 135.7, 146, 140.3, 150.1, 149.2, 138.4, 143, 147.3, 148.3, 149.9, 140.4, 150.9,
  151.1, 135.1, 153.2, 152, 149.7, 152.5, 135.3, 148.3, 154, 152.7, 138.7, 148, 147, 148.7, 136.8,
  137.2, 136.4, 152, 141.1, 146.7, 138.9, 141.5, 138.9, 136.5, 147.5, 154.4, 142.8, 140.6, 148, 136.5
];

const POPULATION_D_SUBGROUPS = [
  "general", "elevated-prevalence-subgroup", "general", "elevated-prevalence-subgroup", "general", "general",
  "general", "general", "general", "general", "general", "general",
  "general", "general", "general", "general", "general", "general",
  "general", "general", "general", "general", "general", "general",
  "general", "general", "general", "general", "general", "general",
  "general", "general", "general", "general", "general", "general",
  "general", "general", "general", "general", "general", "elevated-prevalence-subgroup",
  "general", "general", "general", "elevated-prevalence-subgroup", "general", "general",
  "general", "general", "general", "general", "general", "general",
  "general", "general", "general", "general", "general", "elevated-prevalence-subgroup",
  "elevated-prevalence-subgroup", "general", "general", "general", "general", "general",
  "general", "elevated-prevalence-subgroup", "general", "general", "general", "general",
  "general", "general", "general", "general", "elevated-prevalence-subgroup", "general",
  "general", "general", "general", "general", "general", "general",
  "general", "general", "general", "general", "general", "general",
  "general", "general", "general", "elevated-prevalence-subgroup", "general", "general",
  "general", "general", "general", "general", "general", "general",
  "general", "general", "general", "general", "elevated-prevalence-subgroup", "general",
  "general", "general", "general", "general", "general", "elevated-prevalence-subgroup",
  "general", "general", "general", "general", "general", "elevated-prevalence-subgroup",
  "general", "general", "general", "general", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup",
  "general", "general", "general", "general", "general", "general",
  "general", "general", "general", "general", "general", "general",
  "general", "elevated-prevalence-subgroup", "general", "general", "general", "general",
  "general", "general", "general", "general", "general", "general",
  "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "general", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup",
  "elevated-prevalence-subgroup", "general", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup",
  "elevated-prevalence-subgroup", "general", "general", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup",
  "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "general", "general", "general", "elevated-prevalence-subgroup",
  "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "general", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup",
  "general", "elevated-prevalence-subgroup", "general", "general", "elevated-prevalence-subgroup", "general",
  "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "general", "general", "general",
  "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup",
  "general", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "general", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup",
  "elevated-prevalence-subgroup", "general", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "general", "general",
  "general", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "general", "general",
  "general", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "general", "general", "elevated-prevalence-subgroup",
  "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "general", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup",
  "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup",
  "general", "general", "general", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup",
  "elevated-prevalence-subgroup", "general", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "general", "elevated-prevalence-subgroup",
  "general", "general", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup",
  "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "general",
  "general", "elevated-prevalence-subgroup", "general", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "general",
  "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "general", "elevated-prevalence-subgroup",
  "elevated-prevalence-subgroup", "general", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup",
  "general", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "general", "elevated-prevalence-subgroup",
  "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "general", "general", "general", "elevated-prevalence-subgroup",
  "general", "elevated-prevalence-subgroup", "general", "general", "general", "general",
  "elevated-prevalence-subgroup", "elevated-prevalence-subgroup", "general", "general", "elevated-prevalence-subgroup", "general"
];

const POPULATION_E_VALUES = [
  160.2, 162.9, 97.3, 158, 157.5, 164.2, 106, 103.3, 99.5, 105, 161.2, 105.7, 104.8, 168.3, 90.4,
  164.5, 102.7, 155.8, 166.7, 97, 165.6, 97.6, 95.4, 156.6, 94.4, 99.1, 96.4, 106.9, 104, 150,
  157.1, 155.5, 95.7, 91.6, 96.1, 158.2, 165, 96.3, 171.6, 102.7, 154.8, 90.7, 163.7, 87.9, 102.5,
  162.2, 98.7, 149.6, 102.1, 98.3, 103.8, 103.3, 108.1, 103, 156.7, 163.7, 95.1, 94.7, 102.5, 103.7,
  147.4, 93.2, 163.6, 101.6, 156.4, 159.8, 109.4, 104.3, 100.2, 101.6, 116.2, 99.6, 99.1, 164.5, 159.5,
  154.9, 100.2, 167.3, 104, 98.5, 100.8, 166.9, 100.2, 99, 102.1, 92.4, 108.8, 89.6, 91.2, 94.1,
  153.6, 160.3, 96.5, 97.8, 160.9, 101.6, 106.9, 152.5, 103.9, 102.2, 102.7, 101.6, 154.1, 157.5, 156.7,
  100.1, 160.8, 94.3, 157.4, 163.5, 157.6, 98.7, 101.1, 164.6, 93.6, 100.5, 161.7, 166.3, 99.6, 159.7,
  102.3, 161.6, 102.1, 94.1, 163.6, 162.3, 160.2, 166.8, 104, 91.6, 162.4, 156.2, 107.7, 103.9, 155.5,
  108.6, 160.2, 160.9, 96.5, 97.7, 157.6, 100.1, 163.2, 156.7, 160.9, 168.3, 161.5, 99.2, 167, 170.8
];

const PATIENT_POPULATIONS = [
  {
    id: "population-a", name: "Population A", distributionDescriptor: "narrow-stable",
    displayName: "Synthetic sodium-like distribution — narrow, stable",
    description: "150 deterministic values, approximately normal, mean ~140, SD ~2.4. Illustrates a tightly regulated analyte with low natural between-result variability.",
    baseResults: POPULATION_A_VALUES, subgroupLabels: null, stabilityDescriptor: "stable throughout",
    caseMixPattern: "No case-mix change over the stream.",
    provenance: SYNTHETIC_DATA_CARD_LABEL,
    limitations: "Does not represent any specific real analyte's true population distribution — a teaching illustration only."
  },
  {
    id: "population-b", name: "Population B", distributionDescriptor: "broad-heterogeneous",
    displayName: "Synthetic broad heterogeneous distribution",
    description: "150 deterministic values, approximately normal, mean ~141, SD ~9.1 — roughly 3.7x the spread of Population A despite a similar mean. Illustrates an analyte, or a case-mix, with much greater natural between-result variability.",
    baseResults: POPULATION_B_VALUES, subgroupLabels: null, stabilityDescriptor: "stable throughout",
    caseMixPattern: "No case-mix change over the stream.",
    provenance: SYNTHETIC_DATA_CARD_LABEL,
    limitations: "Does not represent any specific real analyte's true population distribution — a teaching illustration only."
  },
  {
    id: "population-c", name: "Population C", distributionDescriptor: "right-skewed",
    displayName: "Synthetic right-skewed distribution",
    description: "150 deterministic values generated from a log-normal transform, mean ~54, with a long right tail (max ~127). Illustrates an analyte whose result distribution is not symmetric, such as many inflammatory or hormone markers.",
    baseResults: POPULATION_C_VALUES, subgroupLabels: null, stabilityDescriptor: "stable throughout",
    caseMixPattern: "No case-mix change over the stream.",
    provenance: SYNTHETIC_DATA_CARD_LABEL,
    limitations: "Does not represent any specific real analyte's true population distribution — a teaching illustration only."
  },
  {
    id: "population-d", name: "Population D", distributionDescriptor: "changing-case-mix",
    displayName: "Synthetic changing-case-mix distribution",
    description: "300 deterministic values in two segments of 150. In the first segment, an \"elevated-prevalence-subgroup\" makes up about 10% of results; in the second segment it makes up about 65% of results — a case-mix change with NO analytical error at any point.",
    baseResults: POPULATION_D_VALUES, subgroupLabels: POPULATION_D_SUBGROUPS, stabilityDescriptor: "case mix changes after result 150 (no analytical change)",
    caseMixPattern: "Proportion of the elevated-prevalence subgroup rises from ~10% to ~65% at result 151.",
    provenance: SYNTHETIC_DATA_CARD_LABEL,
    limitations: "Does not represent any specific real analyte, disease, or clinical subgroup — a teaching illustration only."
  },
  {
    id: "population-e", name: "Population E (optional)", distributionDescriptor: "bimodal-mixture",
    displayName: "Synthetic bimodal-mixture distribution",
    description: "150 deterministic values drawn roughly evenly from two separated clusters (~mean 100 and ~mean 160). Illustrates a population that is not usefully described by a single mean and SD at all.",
    baseResults: POPULATION_E_VALUES, subgroupLabels: null, stabilityDescriptor: "stable mixture throughout",
    caseMixPattern: "No case-mix change over the stream; the bimodal shape itself is the teaching point.",
    provenance: SYNTHETIC_DATA_CARD_LABEL,
    limitations: "Does not represent any specific real analyte's true population distribution — a teaching illustration only."
  }
];

/* -------------------------------------------------------------------------
   Signature distribution experiment (spec sections 41-42): the SAME
   algorithm, W, truncation, control limits and injected error, run on
   Population A then Population B — verified via runPbrtqcStream() in
   test-pbrtqc.js.
   ------------------------------------------------------------------------- */
const DISTRIBUTION_SIGNATURE_EXPERIMENT = {
  heldConstant: "Algorithm (moving mean), W=20, no truncation, control limits 137-143, injected persistent additive error of magnitude +6 at onset raw index 81.",
  changed: "The patient population the identical configuration is applied to: Population A (narrow-stable) vs. Population B (broad-heterogeneous).",
  populationA: { firstAlertRawIndex: 93, nped: 12, note: "The injected shift is detected 12 patient results after onset." },
  populationB: { firstAlertRawIndex: 65, nped: undefined, note: "An alert fires at raw result 65 — BEFORE the error even begins at result 81 — because Population B's natural spread alone exceeds control limits sized for Population A's much narrower spread." },
  lesson: "An algorithm cannot be evaluated independently of the patient population on which it operates. Control limits derived for one population, naively transferred to a population with different natural variability, can produce a false alert before any analytical error occurs, or fail to detect a real one — the identical numeric configuration behaves completely differently depending on the population."
};

/* -------------------------------------------------------------------------
   Population-shift-without-error scenario (spec section 43) — uses
   Population D. Verified: firstAlertRawIndex 168, occurring in the
   case-mix-shifted second segment, with errorScenario.errorType === "none".
   ------------------------------------------------------------------------- */
const POPULATION_SHIFT_WITHOUT_ERROR_SCENARIO = {
  narrative: "Population D is run through a moving-mean (W=20) PBRTQC configuration with control limits 133-148 and NO injected analytical error (errorType = \"none\"). The elevated-prevalence subgroup's proportion rises from ~10% to ~65% after result 150.",
  firstAlertRawIndex: 168,
  question: "Does this alert prove the analyzer developed a bias?",
  correctAnswer: "no",
  explanation: "No. This alert arises purely from a case-mix (patient-population) change — the scenario's errorType is \"none\" throughout. The correct terminology is an \"alert without injected analytical error\" or a \"non-analytical simulated alert,\" never an automatic \"false alarm\": the statistic genuinely did cross its limit, and in a real laboratory a case-mix shift of this kind would deserve its own investigation, just not an analytical-bias investigation."
};

/* -------------------------------------------------------------------------
   Overly-aggressive-truncation signature experiment (spec section 37) —
   verified via runPbrtqcStream(): with no truncation the injected error is
   detected at NPed=25; with an aggressive upper truncation of 146 the
   error-affected values are themselves excluded and the error is NEVER
   detected within the simulation horizon.
   ------------------------------------------------------------------------- */
const AGGRESSIVE_TRUNCATION_EXPERIMENT = {
  heldConstant: "Population A, moving mean W=20, control limits 133-147, injected persistent additive error of magnitude +8 at onset raw index 81.",
  changed: "Upper truncation limit: none, vs. an aggressive 146.",
  noTruncation: { nped: 25, detected: true },
  aggressiveTruncation: { upperTruncationLimit: 146, detected: false, excludedCount: 51 },
  lesson: "Overly aggressive truncation can WORSEN detection: once the injected bias pushes affected values above the truncation limit, those very values — the ones carrying the evidence of the error — are excluded from the algorithm entirely, and the error is never detected within the simulated horizon."
};

/* -------------------------------------------------------------------------
   Mean-vs-median robustness fixture (spec section 22) shown embedded in a
   longer stream, and the "median is not universally better" caution.
   ------------------------------------------------------------------------- */
const MEAN_VS_MEDIAN_ROBUSTNESS_NOTE = "On the isolated-extreme fixture [100,100,100,100,160] with W=5, the moving mean is pulled to 112 by the single extreme value, while the moving median remains at 100 — unaffected by one outlier. This shows the moving median is MORE ROBUST to an isolated extreme value in this specific situation. It does NOT show that the moving median is always better: because it discards information about the magnitude of individual values, a moving median can respond more slowly, or not at all, to a genuine small, gradual, persistent shift that a moving mean would pick up.";

const MEDIAN_NOT_UNIVERSALLY_BETTER_NOTE = "Robustness and error-detection sensitivity are both configuration-dependent. A moving median that ignores isolated extremes is, by the same mechanism, less sensitive to a real gradual shift whose size stays below the median's \"switch point\" for longer than a moving mean would tolerate. Neither algorithm is universally better — which one suits a given population and error pattern is an empirical, scenario-specific question.";

/* =========================================================================
   PBRTQC Challenge Bank (spec sections 105-124). 16 required cases + 2
   optional cases = 18 total. `distribution` tags support the minimum-count
   regression in test-pbrtqc.js.
   ========================================================================= */
const PBRTQC_CHALLENGE_CASES = [
  {
    id: 1, title: "Case 1 — narrow population, persistent bias", distribution: ["population-distribution"],
    narrative: "Population A (narrow-stable, mean ~140, SD ~2.4) is monitored with a moving mean, W=20, control limits 137-143 (derived from this population's own training segment). A persistent additive error of +6 begins at raw patient result 81.",
    answerKind: "nped-value", correctAnswer: "12",
    question: "Using the fixed values above, what is NPed for this trial (first alert raw index 93, onset raw index 81)?",
    explanation: "NPed = first alert raw patient index (93) minus error onset raw patient index (81) = 12. This is a narrow, well-behaved population and appropriately scaled limits, so a moderate shift is detected reasonably quickly."
  },
  {
    id: 2, title: "Case 2 — same numeric configuration, heterogeneous population", distribution: ["population-distribution", "false-non-analytical-alert"],
    narrative: "The IDENTICAL configuration from Case 1 (moving mean, W=20, control limits 137-143, same +6 error at onset 81) is now applied to Population B (broad-heterogeneous, mean ~141, SD ~9.1) instead of Population A.",
    answerKind: "yes-no", correctAnswer: "no",
    question: "Does this identical configuration behave the same way on Population B as it did on Population A in Case 1?",
    explanation: "No — dramatically not. On Population B, the statistic already breaches the (Population-A-sized) limits at raw result 65, BEFORE the injected error even begins at result 81. The limits were sized for Population A's much narrower natural spread; naively transferred to a broader population, they produce a false alert with no analytical cause at all. An algorithm cannot be evaluated independently of the population it monitors."
  },
  {
    id: 3, title: "Case 3 — case-mix shift, no analytical error", distribution: ["population-distribution", "false-non-analytical-alert", "insufficient-evidence-for-analytical-failure"],
    narrative: POPULATION_SHIFT_WITHOUT_ERROR_SCENARIO.narrative,
    answerKind: "yes-no", correctAnswer: POPULATION_SHIFT_WITHOUT_ERROR_SCENARIO.correctAnswer,
    question: POPULATION_SHIFT_WITHOUT_ERROR_SCENARIO.question,
    explanation: POPULATION_SHIFT_WITHOUT_ERROR_SCENARIO.explanation
  },
  {
    id: 4, title: "Case 4 — mean vs. median: outlier robustness", distribution: ["population-distribution", "algorithm-comparison"],
    narrative: "On the fixed sequence [100,100,100,100,160] with W=5: the moving mean at the fifth point is 112; the moving median at the fifth point is 100.",
    answerKind: "mean-median-robustness", correctAnswer: "median-more-robust-here",
    question: "What does this specific fixture demonstrate?",
    explanation: "The moving median is more robust to this ISOLATED extreme value than the moving mean, in this specific case. " + MEDIAN_NOT_UNIVERSALLY_BETTER_NOTE
  },
  {
    id: 5, title: "Case 5 — median is not universally better", distribution: ["algorithm-comparison"],
    narrative: "A laboratory concludes from Case 4 that it should switch its PBRTQC engine from moving mean to moving median for every analyte, reasoning that \"median is always more robust.\"",
    answerKind: "yes-no", correctAnswer: "no",
    question: "Is this a scientifically defensible universal conclusion?",
    explanation: "No. " + MEDIAN_NOT_UNIVERSALLY_BETTER_NOTE + " A moving median can also respond more slowly to a genuine small, gradual, persistent shift than a moving mean would, which can widen — not narrow — detection delay for that error pattern."
  },
  {
    id: 6, title: "Case 6 — overly aggressive truncation worsens detection", distribution: ["truncation-inclusion", "insufficient-evidence-for-analytical-failure"],
    narrative: AGGRESSIVE_TRUNCATION_EXPERIMENT.heldConstant + " " + AGGRESSIVE_TRUNCATION_EXPERIMENT.changed + " Without truncation, NPed=25 (detected). With upper truncation set aggressively to 146, the error is never detected within the simulated horizon, and 51 of 150 results are excluded overall.",
    answerKind: "yes-no", correctAnswer: "yes",
    question: "Can numeric truncation, applied with good intentions to remove implausible values, actively worsen detection of a real analytical error?",
    explanation: AGGRESSIVE_TRUNCATION_EXPERIMENT.lesson + " This is the mechanism: truncation is applied to the error-affected value (step 4 of the pipeline, after error injection in step 3), so once the bias pushes values above the truncation limit, exactly the evidence needed to detect the error is discarded."
  },
  {
    id: 7, title: "Case 7 — no truncation, unstable tails", distribution: ["truncation-inclusion", "false-non-analytical-alert"],
    narrative: "A laboratory configures PBRTQC on Population C (right-skewed, occasional high values up to ~127) with NO truncation at all, reasoning that \"truncation just throws away data.\"",
    answerKind: "yes-no", correctAnswer: "no",
    question: "Is removing all truncation always the scientifically safer choice?",
    explanation: "No. With no truncation, naturally occurring extreme-but-genuine values from a right-skewed population can themselves push a moving statistic toward a control limit, producing alerts unrelated to any analytical change. Truncation and control-limit choice both need to be considered together, and neither \"always truncate aggressively\" nor \"never truncate\" is a universally safe rule — this application never states a single recommended universal truncation limit for any real analyte."
  },
  {
    id: 8, title: "Case 8 — small vs. large window size (W)", distribution: ["algorithm-comparison"],
    narrative: "The same +5 persistent additive error (onset 81, Population A, limits 133-147) is evaluated with a small window (W=5, first alert at raw 125, NPed=44) and a large window (W=50, never alerts within the 150-result horizon).",
    answerKind: "small-vs-large-window", correctAnswer: "tradeoff",
    question: "What does comparing W=5 and W=50 on the identical error demonstrate?",
    explanation: "A smaller W responds faster to a new shift because it is dominated by fewer, more recent results, but is also noisier and more prone to false flags from ordinary random variation. A larger W smooths noise more thoroughly but responds more slowly — here, so slowly it never crosses these particular limits within the simulated horizon. Neither is universally correct: " + CONTROL_LIMIT_TRADEOFF_NOTE
  },
  {
    id: 9, title: "Case 9 — EWMA smoothing constant (lambda)", distribution: ["algorithm-comparison"],
    narrative: "The same +5 persistent additive error (onset 81, Population A, limits 133-147, EWMA baseline 140) is evaluated with a small lambda=0.1 (never alerts within the 150-result horizon) and a larger lambda=0.7 (first alert at raw 106, NPed=25).",
    answerKind: "small-vs-large-window", correctAnswer: "tradeoff",
    question: "What does comparing lambda=0.1 and lambda=0.7 on the identical error demonstrate?",
    explanation: "A smaller lambda gives more smoothing and a slower response to a genuine change (here, slow enough to miss detection within the horizon). A larger lambda gives more weight to recent results, responding faster but with more variability from ordinary noise. There is no universally optimal lambda — the right choice depends on the population, the error pattern of concern, and the acceptable false-alert burden."
  },
  {
    id: 10, title: "Case 10 — pooled analyzers can mask an instrument-specific shift", distribution: ["multiple-analyzer"],
    narrative: MULTIPLE_ANALYZER_EXPERIMENT.narrative + " Monitored separately, Analyzer A's shift gives NPed=" + MULTIPLE_ANALYZER_EXPERIMENT.separateStreams.analyzerANped + ". Pooled 1:1 into a single interleaved stream (window widened to 40), the same underlying shift is detected only after " + MULTIPLE_ANALYZER_EXPERIMENT.pooledStream.pooledNped + " pooled-stream results.",
    answerKind: "yes-no", correctAnswer: "yes",
    question: "Can combining (pooling) results from multiple analyzers into one PBRTQC stream dilute or delay detection of an instrument-specific disturbance?",
    explanation: MULTIPLE_ANALYZER_EXPERIMENT.lesson + " " + MULTIPLE_ANALYZER_NOTE
  },
  {
    id: 11, title: "Case 11 — alert without a known root cause", distribution: ["insufficient-evidence-for-analytical-failure"],
    narrative: "A PBRTQC moving-mean statistic crosses its upper control limit. No further information is given about calibration, reagent lots, QC results, or case mix.",
    answerKind: "yes-no", correctAnswer: "no",
    question: "Can this alert, by itself, be reported as a confirmed analytical failure?",
    explanation: ALERT_INTERPRETATION_STATEMENT + " " + ALERT_ROUTES_TO_INVESTIGATION_NOTE + " The defensible next step is to route this alert conceptually into the Investigation Lab's reasoning framework, not to label a specific cause from the alert alone."
  },
  {
    id: 12, title: "Case 12 — a stable PBRTQC statistic does not validate every patient result", distribution: ["insufficient-evidence-for-analytical-failure"],
    narrative: "A PBRTQC moving-mean statistic has remained comfortably within its control limits for an entire shift.",
    answerKind: "yes-no", correctAnswer: "no",
    question: "Does this prove that every individual patient result reported during that shift was analytically correct?",
    explanation: STABLE_PBRTQC_DOES_NOT_VALIDATE_STATEMENT + " A moving statistic can remain within limits while still containing some affected individual results, particularly if an error is small relative to the population's natural spread, or if the window is large enough to average it out."
  },
  {
    id: 13, title: "Case 13 — same NPed, different throughput", distribution: ["throughput"],
    narrative: "Two laboratories each experience an analytical error detected after NPed=50 patient results. Laboratory A submits results at 50/hour; Laboratory B submits results at 5/hour.",
    answerKind: "throughput-elapsed", correctAnswer: "different-elapsed-time",
    question: "Do these two laboratories experience the same elapsed-time exposure to the undetected error?",
    explanation: "No. " + THROUGHPUT_NOTE + " Laboratory A's NPed=50 corresponds to roughly 1 hour of exposure; Laboratory B's identical NPed=50 corresponds to roughly 10 hours — under the " + THROUGHPUT_ASSUMPTION_LABEL
  },
  {
    id: 14, title: "Case 14 — training/verification leakage", distribution: ["verification-leakage"],
    narrative: "A laboratory repeatedly adjusts its control limits against its verification dataset until the verification dataset's own false-alert rate looks acceptable, then reports this figure as the configuration's \"validated performance.\"",
    answerKind: "yes-no", correctAnswer: "no",
    question: "Is this a valid independent performance verification?",
    explanation: VERIFICATION_LEAKAGE_NOTE + " " + TRAINING_VERIFICATION_SEPARATION_NOTE + " Once the verification dataset has itself been used to choose parameters, it can no longer independently verify those same parameters."
  },
  {
    id: 15, title: "Case 15 — informatics duplicate-feed", distribution: ["informatics", "false-non-analytical-alert"],
    narrative: INFORMATICS_CHALLENGE_SCENARIO.narrative,
    answerKind: "informatics-next-step", correctAnswer: INFORMATICS_CHALLENGE_SCENARIO.correctAnswer,
    question: INFORMATICS_CHALLENGE_SCENARIO.question,
    explanation: INFORMATICS_CHALLENGE_SCENARIO.explanation
  },
  {
    id: 16, title: "Case 16 — PBRTQC vs. RCV confusion", distribution: ["pbrtqc-vs-rcv"],
    narrative: "A learner describes PBRTQC as \"basically an RCV calculation applied to the whole patient population instead of one patient.\"",
    answerKind: "yes-no", correctAnswer: "no",
    question: "Is this an accurate description?",
    explanation: PBRTQC_VS_RCV_DISTINCTION
  },
  {
    id: 17, title: "Case 17 (optional) — IQC stable, PBRTQC shifts", distribution: ["false-non-analytical-alert", "insufficient-evidence-for-analytical-failure"],
    narrative: "IQC results remain within all statistical control-rule limits for the shift. During the same period, a PBRTQC moving-mean statistic drifts outside its control limits.",
    answerKind: "yes-no", correctAnswer: "yes",
    question: "Is it possible for these two pieces of evidence to genuinely disagree without either one being \"wrong\"?",
    explanation: "Yes. IQC and PBRTQC monitor the process through different evidence (a characterised control material vs. the routine patient-result stream) and can be sensitive to different kinds of disturbance. A PBRTQC shift with stable IQC is not proof the IQC \"missed\" something, nor proof PBRTQC is \"more sensitive\" in general — it is a prompt to look at both sources of evidence together, exactly the complementarity this lab teaches."
  },
  {
    id: 18, title: "Case 18 (optional) — IQC signals, PBRTQC stable", distribution: ["false-non-analytical-alert", "insufficient-evidence-for-analytical-failure"],
    narrative: "A single QC result breaches a statistical control rule. The PBRTQC moving-mean statistic, computed over the same period, remains comfortably within its control limits.",
    answerKind: "yes-no", correctAnswer: "no",
    question: "Does the stable PBRTQC statistic mean the QC signal can be safely disregarded?",
    explanation: "No. A stable PBRTQC statistic does not clear an IQC signal — PBRTQC may simply be insensitive to whatever caused the isolated QC signal, especially if it was small, transient, or specific to the QC material rather than patient specimens. " + STABLE_PBRTQC_DOES_NOT_VALIDATE_STATEMENT
  }
];

const PBRTQC_ANSWER_KIND_OPTIONS = {
  "yes-no": [{ id: "yes", label: "Yes" }, { id: "no", label: "No" }],
  "nped-value": [
    { id: "8", label: "8" }, { id: "12", label: "12" }, { id: "14", label: "14" }, { id: "93", label: "93" }
  ],
  "mean-median-robustness": [
    { id: "median-more-robust-here", label: "The median is more robust to this isolated extreme value, in this specific case" },
    { id: "mean-more-robust-here", label: "The mean is more robust to this isolated extreme value, in this specific case" },
    { id: "identical", label: "Both algorithms behave identically here" },
    { id: "median-always-better", label: "This proves the median is always the better algorithm" }
  ],
  "small-vs-large-window": [
    { id: "tradeoff", label: "There is a detection-speed vs. stability/false-flag trade-off; neither setting is universally correct" },
    { id: "smaller-always-better", label: "The smaller/faster-responding setting is always better" },
    { id: "larger-always-better", label: "The larger/smoother setting is always better" },
    { id: "no-difference", label: "The setting makes no meaningful difference" }
  ],
  "throughput-elapsed": [
    { id: "same-elapsed-time", label: "Both laboratories have the same elapsed-time exposure" },
    { id: "different-elapsed-time", label: "The two laboratories have very different elapsed-time exposure, despite the identical NPed" }
  ],
  "informatics-next-step": [
    { id: "investigate-pipeline", label: "Investigate the informatics/data pipeline (duplicate feed, interface behaviour)" },
    { id: "assume-analytical-bias", label: "Assume analytical bias and begin an analytical-cause investigation" },
    { id: "ignore", label: "No action needed — the statistic will settle on its own" }
  ]
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    PBRTQC_PATHWAY_STEPS, PBRTQC_PATHWAY_CAUTION,
    PBRTQC_CORE_PRINCIPLE, PBRTQC_COMPLEMENTARY_NOTE, PBRTQC_NOT_JUST_MOVING_AVERAGE_NOTE, NEVER_CALIBRATION_FAILURE_NOTE,
    PATIENT_POPULATION_SCENARIO_FIELDS, ANALYTICAL_ERROR_SCENARIO_FIELDS, PBRTQC_ALGORITHM_CONFIGURATION_FIELDS,
    N_R_M_W_DISTINCTION_EXAMPLE, N_R_M_W_DISTINCTION_STATEMENT, PBRTQC_VS_RCV_DISTINCTION, PBRTQC_VS_CVG_DISTINCTION,
    ALGORITHMS_IMPLEMENTED, ALGORITHMS_MENTIONED_NOT_IMPLEMENTED, ALGORITHMS_EXCLUDED_FROM_V08, ALGORITHM_SCOPE_NOTE,
    SLIDING_VS_BLOCKS_NOTE, PROCESSING_PIPELINE_STEPS, PROCESSING_ORDER_NOTE,
    METADATA_EXCLUSION_EXAMPLES, METADATA_FILTER_CAUTION,
    TRUNCATION_NOTE, NO_UNIVERSAL_TRUNCATION_NOTE,
    PARAMETER_PROVENANCE_OPTIONS, STARTING_CONFIGURATION_LANGUAGE_NOTE,
    CONTROL_LIMIT_PROVENANCE_NOTE, ALERT_BOUNDARY_NOTE, CONTROL_LIMIT_TRADEOFF_NOTE,
    ALERT_INTERPRETATION_STATEMENT, STABLE_PBRTQC_DOES_NOT_VALIDATE_STATEMENT, PBRTQC_NOT_DELTA_CHECK_STATEMENT, PBRTQC_NOT_EQA_STATEMENT, ALERT_ROUTES_TO_INVESTIGATION_NOTE,
    FALSE_FLAG_RATE_NOTE, TRAINING_VERIFICATION_SEPARATION_NOTE, VERIFICATION_LEAKAGE_NOTE, HISTORICAL_DATA_NOTE,
    NO_LIVE_DATA_NOTE, SYNTHETIC_DATA_CARD_LABEL, PRIVACY_BRIEF_NOTE,
    INFORMATICS_RELIABILITY_TOPICS, INFORMATICS_CHALLENGE_SCENARIO,
    VALIDATION_LIFECYCLE_STEPS, VALIDATION_LIFECYCLE_NOTE, MATERIAL_CHANGE_EXAMPLES, MATERIAL_CHANGE_LIST_CAUTION,
    NO_AUTO_OPTIMIZER_NOTE, NO_UNIVERSAL_TARGETS_NOTE, IQC_FREQUENCY_CONNECTION_EXPERIMENT, V04_ANPED_REMINDER_NOTE, NPED_VS_MAXENUF_NOTE, REPORT_FROM_BACK_NOTE,
    THROUGHPUT_NOTE, THROUGHPUT_EXAMPLE, THROUGHPUT_ASSUMPTION_LABEL,
    MULTIPLE_ANALYZER_NOTE, MULTIPLE_ANALYZER_EXPERIMENT,
    CASE_MIX_EXCLUSION_DANGER_NOTE,
    PBRTQC_LEVEL_EXPLANATION, ERROR_DETECTION_RECOMMENDED_FLOW,
    PBRTQC_WORKFLOW_QUESTIONS, PBRTQC_CONFIDENCE_NEVER_ALTERS_SCORE_NOTE,
    FORBIDDEN_BLANKET_STATEMENTS, METHODOLOGICAL_DEVELOPMENT_NOTE, PBRTQC_EXCLUSION_LIST,
    PATIENT_POPULATIONS,
    DISTRIBUTION_SIGNATURE_EXPERIMENT, POPULATION_SHIFT_WITHOUT_ERROR_SCENARIO, AGGRESSIVE_TRUNCATION_EXPERIMENT,
    MEAN_VS_MEDIAN_ROBUSTNESS_NOTE, MEDIAN_NOT_UNIVERSALLY_BETTER_NOTE,
    PBRTQC_CHALLENGE_CASES, PBRTQC_ANSWER_KIND_OPTIONS
  };
}
