import { roundTo } from "../core/statistics.js";

/* =========================================================================
   Static content & deterministic data. No calculation logic lives here —
   only fixtures, text and metadata consumed by the screens.
   ========================================================================= */

export const LEVELS = ["beginner", "intermediate", "advanced", "expert"];
export const LEVEL_LABELS = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert"
};
export const LEVEL_HOME_DESC = {
  beginner: "New to analytical QC. Build terminology, basic statistics and the meaning of an LJ chart.",
  intermediate: "Comfortable with basics. Interpret QC data, recognise visual patterns, and reason cautiously about random vs. systematic behaviour.",
  advanced: "Connect APS, bias, CV and Sigma. Analyse QC failures and reason about QC design choices.",
  expert: "Critique QC strategy: risk, error detection, false rejection, patient impact and QC governance."
};

/* -------------------------------------------------------------------------
   Competency Map — the larger knowledge pathway (only some modules enabled)
   ------------------------------------------------------------------------- */
/* status: "available" (dedicated interactive module), "introduced" (concept
   touched upon within an available module, but not a dedicated module of
   its own), or "coming-later" (not addressed in this build). */
export const COMPETENCY_MODULES = [
  { id: "QC-01", title: "Statistical Foundations", stage: "Understand", status: "available", screen: "stats" },
  { id: "QC-02", title: "Analytical Variation, Precision & Bias", stage: "Understand", status: "available", screen: "stats" },
  { id: "QC-03", title: "QC Materials & Control Statistics", stage: "Understand", status: "available", screen: "qc-materials" },
  { id: "QC-04", title: "Levey-Jennings Interpretation", stage: "Interpret", status: "available", screen: "lj" },
  { id: "QC-05", title: "Statistical Control Rules", stage: "Interpret", status: "available", screen: "rules" },
  { id: "QC-06", title: "Analytical Performance Specifications", stage: "Apply", status: "available", screen: "strategy" },
  { id: "QC-07", title: "Biological Variation & RCV", stage: "Apply", status: "available", screen: "bv-rcv" },
  { id: "QC-08", title: "Sigma Metrics & QC Design", stage: "Apply", status: "available", screen: "strategy" },
  { id: "QC-09", title: "QC Failure Investigation", stage: "Design", status: "available", screen: "investigation" },
  { id: "QC-10", title: "EQA / PT & Long-Term Performance", stage: "Design", status: "available", screen: "external-assurance" },
  { id: "QC-11", title: "Risk-Based QC", stage: "Govern", status: "available", screen: "risk" },
  { id: "QC-12", title: "PBRTQC & Advanced Surveillance", stage: "Govern", status: "available", screen: "pbrtqc" }
];
export const PROGRESSION_STAGES = ["Understand", "Interpret", "Apply", "Design", "Govern"];
/* Recommended-next priority order for modules with a dedicated screen. */
export const RECOMMENDED_PATH = ["stats", "lj", "pattern", "rules", "strategy", "sigma", "bv-rcv", "risk", "investigation", "external-assurance", "pbrtqc"];

/* -------------------------------------------------------------------------
   Glossary
   ------------------------------------------------------------------------- */
export const GLOSSARY = [
  { term: "Mean", def: "The arithmetic average of a set of observations; a measure of central location." },
  { term: "Standard deviation (SD)", def: "A measure of dispersion around the mean. This application uses the sample SD (denominator n−1) whenever SD is estimated from entered observations." },
  { term: "Coefficient of variation (CV)", def: "SD expressed relative to the mean, as a percentage (CV% = SD / mean × 100). Useful for comparing imprecision across analytes with different concentrations." },
  { term: "Precision", def: "The closeness of agreement between repeated measurements of the same material. Poor precision manifests as increased random scatter, not necessarily displacement." },
  { term: "Bias", def: "A systematic displacement of the observed process mean from a target or reference value, usually expressed as a signed percentage." },
  { term: "Target value", def: "The assigned or reference value against which observed results are compared, e.g. a QC material's assigned mean." },
  { term: "QC material", def: "A stable material analysed alongside patient samples to monitor analytical performance over time." },
  { term: "Calibrator", def: "A material with an assigned value used to establish or adjust the measurement relationship of an assay; distinct from QC material, which monitors ongoing performance." },
  { term: "Assayed control", def: "QC material for which the manufacturer provides an assigned target value (and often an expected range)." },
  { term: "Unassayed control", def: "QC material without a manufacturer-assigned target; the laboratory establishes its own working statistics." },
  { term: "Third-party control", def: "QC material sourced independently of the reagent/instrument manufacturer." },
  { term: "Control lot", def: "A specific manufactured batch of QC material; a new lot may have different statistics from the previous one and should be evaluated before routine use." },
  { term: "Control limit", def: "A boundary, typically expressed in SD units from the mean, used as a visual or statistical reference on a control chart." },
  { term: "Levey-Jennings chart", def: "A control chart plotting QC results in run order against the mean and SD-based control limits, used to visualise analytical stability over time." },
  { term: "Analytical performance specification (APS)", def: "A stated requirement for acceptable analytical performance (e.g. allowable bias, imprecision or total error), selected using a defined scientific rationale." },
  { term: "Allowable total error (TEa)", def: "A specification expressing the maximum combined bias and imprecision considered acceptable for a given analyte and clinical context." },
  { term: "Sigma metric", def: "In the simplified total-error framework used here, Sigma = (TEa% − |Bias%|) / CV%. It expresses analytical performance relative to a selected requirement, not an absolute or universal quality label." },
  { term: "Random analytical variation", def: "Variation without a consistent direction, reflected as scatter around the mean rather than a sustained shift or trend." },
  { term: "Systematic analytical change", def: "A consistent displacement or drift in results, compatible with (but not proof of) causes such as calibration, reagent lot, or QC lot changes." }
];

/* -------------------------------------------------------------------------
   Deterministic z-score datasets for LJ Laboratory & Pattern Challenge
   ------------------------------------------------------------------------- */
export const Z_STABLE_A = [-0.4, 0.3, -0.8, 0.6, 1.1, -0.2, 0.5, -1.0, 0.2, 0.7, -0.5, 0.1, 0.9, -0.7, 0.4, -0.1, 0.6, -0.9, 0.3, -0.2];
export const Z_STABLE_B = [0.6, -0.5, 0.2, -0.3, 0.8, -0.6, 0.1, 0.4, -0.9, 0.3, -0.2, 0.7, -0.4, 0.9, -0.1, 0.5, -0.7, 0.2, -0.3, 0.4];
export const Z_ISOLATED = [-0.3, 0.5, -0.6, 0.2, -0.1, 0.7, -0.4, 0.3, -0.8, 0.1, 3.4, 0.6, -0.2, 0.4, -0.5, 0.2, -0.3, 0.8, -0.6, 0.3];
export const Z_POS_SHIFT = [-0.4, 0.3, -0.6, 0.5, -0.2, 0.4, -0.5, 0.2, -0.3, 0.1, 1.4, 1.6, 1.3, 1.7, 1.5, 1.4, 1.6, 1.3, 1.5, 1.6];
export const Z_NEG_SHIFT = [-0.4, 0.3, -0.6, 0.5, -0.2, 0.4, -0.5, 0.2, -0.3, 0.1, -1.4, -1.6, -1.3, -1.7, -1.5, -1.4, -1.6, -1.3, -1.5, -1.6];
export const Z_TREND_UP = [-1.4, -1.4, -1.1, -1.1, -0.8, -0.8, -0.5, -0.4, -0.2, -0.2, 0.1, 0.2, 0.5, 0.5, 0.8, 0.8, 1.1, 1.1, 1.4, 1.5];
export const Z_TREND_DOWN = Z_TREND_UP.map(v => roundTo(-v, 1));
export const Z_SCATTER = [2.1, -1.8, 2.3, -1.5, 2.0, -1.7, 2.2, -1.6, 2.3, -1.9, 2.1, -1.7, 2.2, -1.5, 2.0, -1.8, 2.3, -1.6, 2.1, -1.9];
export const Z_OUTLIER_2SD = [-0.3, 0.4, -0.5, 0.2, -0.1, 0.6, -0.4, 0.3, -0.7, 0.1, 2.2, 0.5, -0.2, 0.4, -0.6, 0.2, -0.3, 0.7, -0.5, 0.3];
export const Z_STEP_EVENT = [-0.3, 0.4, -0.5, 0.2, -0.1, 0.6, -0.4, 0.3, -0.7, 0.1, 1.5, 1.4, 1.6, 1.3, 1.5, 1.7, 1.4, 1.5, 1.6, 1.4];

export const NEXT_STEP_OPTIONS = [
  { id: "history", text: "Review QC history for this analyte and QC level before drawing conclusions." },
  { id: "levels", text: "Examine additional QC levels or materials run concurrently." },
  { id: "events", text: "Review calibration, reagent-lot and QC-lot change records for temporal association." },
  { id: "investigate", text: "Investigate before attributing a specific cause." },
  { id: "proceed", text: "No action beyond routine monitoring — proceed, as no convincing evidence of instability is present." }
];

export const PATTERN_OPTIONS = [
  { id: "stable", label: "Apparently stable" },
  { id: "isolated", label: "Isolated extreme observation" },
  { id: "pos-shift", label: "Positive shift" },
  { id: "neg-shift", label: "Negative shift" },
  { id: "up-trend", label: "Upward trend" },
  { id: "down-trend", label: "Downward trend" },
  { id: "scatter", label: "Increased scatter / imprecision" },
  { id: "indeterminate", label: "Indeterminate" }
];

export const CONFIDENCE_OPTIONS = [
  { id: "high", label: "High" },
  { id: "moderate", label: "Moderate" },
  { id: "low", label: "Low" }
];

export const BROAD_OPTIONS = [
  { id: "no-instability", label: "No convincing instability apparent" },
  { id: "systematic", label: "Possible systematic change" },
  { id: "random", label: "Possible increased random variation" },
  { id: "insufficient", label: "Insufficient information" }
];

/* Each scenario: id, title, zScores[], patternClass, broadBehaviour,
   whatItShows, whatItDoesNotProve, recommendedNextStep, eventAnnotation,
   difficultyLevel */
export const SCENARIOS = [
  {
    id: 1, title: "Case 1", zScores: Z_STABLE_A, patternClass: "stable", broadBehaviour: "no-instability",
    whatItShows: "Values scattered on both sides of the mean within roughly ±1.1 SD, with no sustained displacement or directional drift.",
    whatItDoesNotProve: "It does not prove the process will remain stable in future runs — it describes this run sequence only.",
    recommendedNextStep: "proceed", difficultyLevel: "beginner"
  },
  {
    id: 2, title: "Case 2", zScores: Z_ISOLATED, patternClass: "isolated", broadBehaviour: "insufficient",
    whatItShows: "A stable background pattern with one observation exceeding +3 SD.",
    whatItDoesNotProve: "A single extreme point does not by itself establish whether the underlying process is systematically or randomly disturbed — it could reflect a transient error, a background stable process, or the onset of a new problem.",
    recommendedNextStep: "investigate", difficultyLevel: "beginner"
  },
  {
    id: 3, title: "Case 3", zScores: Z_POS_SHIFT, patternClass: "pos-shift", broadBehaviour: "systematic",
    whatItShows: "An early segment centred near zero, followed by a sustained displacement to roughly +1.3 to +1.7 SD.",
    whatItDoesNotProve: "The shift is compatible with a systematic analytical change (for example calibration, reagent lot, or QC lot effects) but does not by itself identify which of these occurred.",
    recommendedNextStep: "events", difficultyLevel: "intermediate"
  },
  {
    id: 4, title: "Case 4", zScores: Z_NEG_SHIFT, patternClass: "neg-shift", broadBehaviour: "systematic",
    whatItShows: "An early segment centred near zero, followed by a sustained displacement to roughly −1.3 to −1.7 SD.",
    whatItDoesNotProve: "The shift is compatible with a systematic analytical change but does not by itself identify a specific cause.",
    recommendedNextStep: "events", difficultyLevel: "intermediate"
  },
  {
    id: 5, title: "Case 5", zScores: Z_TREND_UP, patternClass: "up-trend", broadBehaviour: "systematic",
    whatItShows: "A gradual, progressive increase spanning roughly −1.5 SD to +1.5 SD across the run sequence.",
    whatItDoesNotProve: "A progressive trend is compatible with a developing systematic change, but visual trend alone does not equate to any specific statistical rejection rule.",
    recommendedNextStep: "investigate", difficultyLevel: "advanced"
  },
  {
    id: 6, title: "Case 6", zScores: Z_TREND_DOWN, patternClass: "down-trend", broadBehaviour: "systematic",
    whatItShows: "A gradual, progressive decrease spanning roughly +1.5 SD to −1.5 SD across the run sequence.",
    whatItDoesNotProve: "A progressive trend is compatible with a developing systematic change, but visual trend alone does not equate to any specific statistical rejection rule.",
    recommendedNextStep: "investigate", difficultyLevel: "advanced"
  },
  {
    id: 7, title: "Case 7", zScores: Z_SCATTER, patternClass: "scatter", broadBehaviour: "random",
    whatItShows: "Observations distributed widely on both sides of the mean (approximately −2.3 to +2.3 SD) with alternating sign and no sustained directional displacement.",
    whatItDoesNotProve: "Wide scatter is compatible with increased random (imprecision-related) variation, but does not itself quantify the change or identify its source.",
    recommendedNextStep: "history", difficultyLevel: "intermediate"
  },
  {
    id: 8, title: "Case 8", zScores: Z_OUTLIER_2SD, patternClass: "stable", broadBehaviour: "no-instability",
    whatItShows: "A stable background pattern with one observation slightly above +2 SD.",
    whatItDoesNotProve: "A single value slightly beyond 2 SD does not, by itself, justify simplistic rejection outside the context of the laboratory's defined QC procedure and other available control information.",
    recommendedNextStep: "proceed", difficultyLevel: "advanced",
    caution: "This observation deserves attention in context, but interpretation depends on the laboratory's defined QC procedure and other control information."
  },
  {
    id: 9, title: "Case 9", zScores: Z_STEP_EVENT, patternClass: "pos-shift", broadBehaviour: "systematic",
    whatItShows: "A sustained displacement beginning shortly after a recorded process event.",
    whatItDoesNotProve: "Temporal association with the recorded event strengthens the hypothesis that it contributed to the change, but does not by itself prove causality.",
    recommendedNextStep: "events", difficultyLevel: "expert",
    eventAnnotation: { atIndex: 10, label: "New reagent lot introduced" },
    causalityCheck: true
  },
  {
    id: 10, title: "Case 10", zScores: Z_STABLE_B, patternClass: "stable", broadBehaviour: "no-instability",
    whatItShows: "A different, independently generated stable pattern — values scattered on both sides of the mean with no sustained displacement or trend.",
    whatItDoesNotProve: "It does not prove that every dataset in this activity contains a defect — many QC runs are, in fact, unremarkable.",
    recommendedNextStep: "proceed", difficultyLevel: "beginner"
  }
];

/* -------------------------------------------------------------------------
   Diagnostic — "Assess My Level" (8 deterministic questions, weights 1–4)
   ------------------------------------------------------------------------- */
export const DIAGNOSTIC_QUESTIONS = [
  {
    topic: "Mean & SD", domain: "statistics",
    prompt: "A QC dataset is 98, 100, 101, 99, 102. What does the standard deviation mainly tell you?",
    options: [
      { text: "The single most common value in the dataset", w: 1 },
      { text: "How far the values typically lie from the mean", w: 2 },
      { text: "The spread of the data expressed in the same units as the mean, usable to judge scatter run-to-run", w: 3 },
      { text: "An estimate of dispersion whose reliability itself depends on sample size and estimation method", w: 4 }
    ]
  },
  {
    topic: "CV", domain: "statistics",
    prompt: "Why might CV% be preferred over raw SD when comparing imprecision across two analytes?",
    options: [
      { text: "CV% is always a smaller, easier number to work with", w: 1 },
      { text: "CV% expresses SD relative to the mean, allowing fairer comparison across different concentrations", w: 2 },
      { text: "CV% removes the need to ever calculate SD", w: 1 },
      { text: "CV% is only meaningful once linked to an analytical performance specification", w: 4 }
    ]
  },
  {
    topic: "Bias", domain: "precisionBias",
    prompt: "An observed process centres at 102 against a target of 100. How would you describe this?",
    options: [
      { text: "The process is imprecise", w: 1 },
      { text: "A signed bias of +2%, a displacement from target rather than a change in spread", w: 3 },
      { text: "The SD has increased", w: 1 },
      { text: "A +2% bias, whose clinical importance depends on the applicable performance specification", w: 4 }
    ]
  },
  {
    topic: "Precision vs. systematic displacement", domain: "precisionBias",
    prompt: "Two QC processes both show a mean shifted +3% from target, but one has doubled its SD as well. What is the key distinction?",
    options: [
      { text: "Both processes have the same problem", w: 1 },
      { text: "One shows only displacement (bias); the other shows displacement plus increased random scatter — two distinct underlying issues", w: 3 },
      { text: "Bias and imprecision cannot occur together", w: 1 },
      { text: "Confirming this distinction requires quantifying both bias and CV rather than relying on visual impression alone", w: 4 }
    ]
  },
  {
    topic: "LJ interpretation", domain: "lj",
    prompt: "On a Levey-Jennings chart, a single point appears just above the +2 SD line. What is the most defensible immediate interpretation?",
    options: [
      { text: "The run has failed and must be rejected", w: 1 },
      { text: "The point deserves attention but is not, by itself, proof of instability", w: 3 },
      { text: "Nothing — one point can never matter", w: 1 },
      { text: "Interpretation depends on the laboratory's defined control procedure, other QC levels, and context — not the position alone", w: 4 }
    ]
  },
  {
    topic: "APS awareness", domain: "apsSigma",
    prompt: "What is an analytical performance specification (APS) most accurately described as?",
    options: [
      { text: "A fixed number that is the same for every analyte", w: 1 },
      { text: "A stated requirement for acceptable performance, chosen for a given analyte and context", w: 3 },
      { text: "A rule automatically generated by the analyser", w: 1 },
      { text: "A requirement that may be derived from different legitimate models, requiring scientific judgement to select", w: 4 }
    ]
  },
  {
    topic: "Sigma interpretation", domain: "apsSigma",
    prompt: "A method's calculated Sigma value changes when a stricter TEa specification is applied, even though nothing on the analyser changed. Why?",
    options: [
      { text: "This must be a calculation error", w: 1 },
      { text: "Sigma reflects performance relative to the chosen requirement, not a fixed property of the analyser", w: 3 },
      { text: "Sigma only changes if bias changes", w: 1 },
      { text: "This illustrates why a single Sigma value should never be treated as a universal quality label", w: 4 }
    ]
  },
  {
    topic: "QC reasoning", domain: "lj",
    prompt: "A sustained shift appears on the QC chart shortly after a reagent lot change. What is the most defensible conclusion?",
    options: [
      { text: "The reagent lot change definitely caused the shift", w: 1 },
      { text: "The reagent lot change is one plausible explanation among others worth checking", w: 2 },
      { text: "Temporal association strengthens the hypothesis but investigation is needed before attributing cause", w: 3 },
      { text: "Any conclusion should also weigh QC design factors — detection power, false rejection risk, and patient impact — before deciding on action", w: 4 }
    ]
  }
];

export function suggestLevelFromScore(avgWeight) {
  if (avgWeight < 1.75) return "beginner";
  if (avgWeight < 2.5) return "intermediate";
  if (avgWeight < 3.25) return "advanced";
  return "expert";
}

export const DIAGNOSTIC_DOMAINS = [
  { key: "statistics", label: "Statistics" },
  { key: "precisionBias", label: "Precision / Bias" },
  { key: "lj", label: "LJ Interpretation" },
  { key: "apsSigma", label: "APS / Sigma" }
];

/* Builds a simple per-domain profile from the recorded per-question weights.
   answers: array parallel to DIAGNOSTIC_QUESTIONS, each entry the chosen
   option's weight (1-4). Returns [{ key, label, avg, level }]. */
export function buildDomainProfile(answers) {
  return DIAGNOSTIC_DOMAINS.map(dom => {
    const weights = DIAGNOSTIC_QUESTIONS
      .map((q, i) => (q.domain === dom.key ? answers[i] : null))
      .filter(w => w != null);
    const avg = weights.length ? weights.reduce((a, b) => a + b, 0) / weights.length : 0;
    return { key: dom.key, label: dom.label, avg, level: suggestLevelFromScore(avg) };
  });
}


/* =========================================================================
   Level-adapted explanatory content. Changing learner level changes the
   depth/framing of these texts, not just font size.
   ========================================================================= */

export const STATS_PLAYGROUND_EXPLANATION = {
  beginner: "Mean is the centre of your data. SD is the spread around that centre. CV expresses spread relative to the mean, as a percentage. Bias is a displacement away from a target value.",
  intermediate: "Imprecision shows up as dispersion (SD, CV) around the process centre. Systematic displacement shows up as bias relative to a target. Both behaviours will later look different on a Levey-Jennings chart.",
  advanced: "CV and bias describe two distinct dimensions of analytical performance. Improving CV (reducing random variation) and reducing bias (removing systematic displacement) are different improvement problems, often requiring different corrective actions.",
  expert: "Statistical description of a process — mean, SD, CV, bias — is necessary but not sufficient. Statistical control does not by itself establish clinical fitness for purpose; that judgement also depends on the target value's validity and the applicable analytical performance specification."
};

export const LJ_LAB_EXPLANATION = {
  beginner: "A Levey-Jennings chart plots QC results in run order, with horizontal lines marking the mean and ±1, ±2 and ±3 SD. It lets you see at a glance where each result falls relative to the expected spread.",
  intermediate: "The SD used to draw control limits determines how far a given raw value appears from the mean in SD units. The same raw data can look very different depending on which SD is assigned to the chart.",
  advanced: "Laboratory-established statistics (the assigned mean and SD) are usually derived from historical QC data over a defined period. If that historical estimate is inappropriate — too narrow, too wide, or drawn from an unstable period — every subsequent interpretation built on it is distorted.",
  expert: "Widening or narrowing control limits changes the sensitivity and false-rejection behaviour of the entire QC procedure, independent of any real change in the analytical process. Establishing and periodically reviewing appropriate QC statistics is itself a QC-design decision, not a formality."
};

export const SIGMA_CAUTION_POINTS = [
  "Sigma depends entirely on the quality specification (TEa/APS) selected — it is not an absolute, specification-free number.",
  "The method used to estimate bias (e.g. against a peer group, reference method, or EQA scheme) materially affects the result.",
  "The method used to estimate CV (data source, time period, number of runs) materially affects the result.",
  "Different legitimate performance specifications, chosen for defensible reasons, can produce different Sigma estimates for the same method.",
  "The simplified TEa-based Sigma framework used here is useful for teaching and for some QC-design approaches, but is not the only framework used in modern analytical quality management.",
  "QC design should also weigh method stability, risk, error-detection capability, false-rejection rate, QC frequency and potential patient impact — not Sigma alone."
];

/* Pattern-class explanations, adapted by learner level. Shared across any
   scenario using that pattern class (see SCENARIOS). */
export const PATTERN_LEVEL_FEEDBACK = {
  stable: {
    beginner: "The points stay close to the centre line without a sustained shift to one side. This looks like ordinary run-to-run variation.",
    intermediate: "No sustained directional displacement or scatter increase is evident; the pattern is compatible with a process operating as expected.",
    advanced: "Absence of a visually convincing pattern does not itself confirm long-run stability — it describes this run sequence. Continue routine monitoring.",
    expert: "Apparent visual stability is a necessary but not sufficient basis for confidence; longer-term surveillance and periodic review of assigned statistics remain relevant regardless of any single run's appearance."
  },
  isolated: {
    beginner: "One point stands out far from the rest, but the rest of the pattern looks ordinary. A single unusual point needs a closer look before deciding what it means.",
    intermediate: "An isolated extreme point, on an otherwise stable background, is compatible with a transient error but does not on its own establish a persistent systematic or random pattern.",
    advanced: "Because only one observation is affected, distinguishing a transient (e.g. handling or measurement) error from the onset of a genuine analytical problem requires additional information — repeat analysis, other QC levels, or event review.",
    expert: "Single-point deviations raise questions about detection strategy: was this within the defined control procedure's decision rules, and what would repeat testing or additional levels contribute to reducing uncertainty about its cause?"
  },
  "pos-shift": {
    beginner: "After a certain point, the values move up and stay up — that's different from just being scattered around the middle.",
    intermediate: "A sustained displacement to one side, following an initial stable segment, is more compatible with a systematic change than with ordinary random variation.",
    advanced: "A positive shift is compatible with calibration change, reagent-lot effect, QC-lot effect, or another systematic cause — but the pattern alone does not distinguish between them.",
    expert: "Confirming a systematic shift and attributing a cause are separate tasks. The former can be supported by chart review; the latter requires investigation of process records, other QC levels, and risk-weighted judgement about required action."
  },
  "neg-shift": {
    beginner: "After a certain point, the values move down and stay down — that's different from just being scattered around the middle.",
    intermediate: "A sustained displacement to one side, following an initial stable segment, is more compatible with a systematic change than with ordinary random variation.",
    advanced: "A negative shift is compatible with calibration change, reagent-lot effect, QC-lot effect, or another systematic cause — but the pattern alone does not distinguish between them.",
    expert: "Confirming a systematic shift and attributing a cause are separate tasks. The former can be supported by chart review; the latter requires investigation of process records, other QC levels, and risk-weighted judgement about required action."
  },
  "up-trend": {
    beginner: "The values gradually climb across the run sequence rather than jumping suddenly — a progressive change rather than a step.",
    intermediate: "A gradual, progressive movement across runs is compatible with a developing systematic change rather than an abrupt one.",
    advanced: "Trends often precede a stable shift and can reflect gradually developing causes (e.g. reagent degradation). Visual trend recognition does not equate to any specific statistical rejection rule.",
    expert: "Early trend recognition matters for QC design because it affects error-detection timing; however, formal statistical trend/rule detection is deliberately out of scope for this version and requires a separately validated engine."
  },
  "down-trend": {
    beginner: "The values gradually fall across the run sequence rather than jumping suddenly — a progressive change rather than a step.",
    intermediate: "A gradual, progressive movement across runs is compatible with a developing systematic change rather than an abrupt one.",
    advanced: "Trends often precede a stable shift and can reflect gradually developing causes (e.g. reagent degradation). Visual trend recognition does not equate to any specific statistical rejection rule.",
    expert: "Early trend recognition matters for QC design because it affects error-detection timing; however, formal statistical trend/rule detection is deliberately out of scope for this version and requires a separately validated engine."
  },
  scatter: {
    beginner: "The points have become more spread out around the mean. This indicates increased variation.",
    intermediate: "Dispersion has increased without a sustained directional shift, which is more compatible with increased imprecision than with simple bias.",
    advanced: "Increased scatter suggests deterioration in precision. Review whether CV has changed and investigate sources of random analytical variation.",
    expert: "The process appears less precise, but visual pattern recognition alone does not establish the mechanism. Quantify the change, assess its significance against the relevant performance specification, and investigate process events."
  }
};

export function getPatternFeedback(patternClass, level) {
  const block = PATTERN_LEVEL_FEEDBACK[patternClass];
  if (!block) return "";
  return block[level] || block.intermediate;
}

/* Confidence is recorded and reflected in tone only — it never changes
   pattern-recognition or analytical-reasoning scoring. */
export function getConfidenceNote(confidenceId, wasCorrect) {
  const label = (CONFIDENCE_OPTIONS.find(c => c.id === confidenceId) || {}).label || confidenceId;
  if (confidenceId === "low" && wasCorrect) {
    return "You reported low confidence, but your interpretation matched the most appropriate answer — reviewing the reasoning above may help reinforce this pattern for next time.";
  }
  if (confidenceId === "high" && !wasCorrect) {
    return "You reported high confidence, but the visual evidence favours a different interpretation here — it may help to revisit the distinguishing features described above before the next case.";
  }
  return "You reported " + label.toLowerCase() + " confidence in this interpretation.";
}

export const BROAD_EXPLANATION = {
  "no-instability": "The visual evidence available does not convincingly support either a systematic or a random change.",
  systematic: "The pattern is compatible with a systematic (non-random) analytical change — a consistent displacement or drift rather than symmetric scatter.",
  random: "The pattern is compatible with increased random analytical variation — symmetric scatter without a consistent direction.",
  insufficient: "A single observation or an ambiguous pattern does not provide enough information to classify the behaviour as clearly systematic or clearly random."
};

export const NEXT_STEP_TEXT_BY_LEVEL = {
  beginner: "At this stage, focus on recognising the pattern correctly. As you progress, you'll practise deciding what to do next.",
  intermediate: "Consider what additional information (other QC levels, recent history) would help confirm or refute your interpretation.",
  advanced: "Identify the most appropriate next action from the options provided, bearing in mind that attributing a cause requires more than pattern recognition alone.",
  expert: "Weigh the recommended action against QC governance considerations: detection power, false-rejection risk, and the cost of investigation versus the cost of a missed problem."
};

/* Home / welcome disclaimer text (used verbatim in multiple places) */
export const EDU_DISCLAIMER = "Educational simulation only. Examples use synthetic data and simplified teaching models. Laboratory QC procedures must follow validated local procedures, applicable standards, regulatory requirements, manufacturer instructions and professional judgement.";

export const ABOUT_TEXT = "PreciMind QC Learning Lab is an interactive educational simulation platform designed to help laboratory professionals develop analytical quality-control reasoning through simulation. All datasets in this version are synthetic. It is not intended to replace validated laboratory procedures, applicable standards, regulatory requirements or professional judgement.";

/* -------------------------------------------------------------------------
   Structured scientific provenance — Evidence & Scientific Basis page.
   No copyrighted standard/guideline text or proprietary diagrams are
   reproduced; links point to official/public pages.
   ------------------------------------------------------------------------- */
export const EVIDENCE_SOURCES = [
  {
    name: "ISO 15189",
    version: "2022 edition",
    tier: "standard",
    informs: "The overarching medical-laboratory quality management context that explains why internal QC and analytical performance monitoring matter as part of a wider quality system, including — as of v0.5 — the broader QMS concept that examination results must retain ongoing validity and that a laboratory must have a process for responding when that validity is called into question. As of the QC-03 pre-release content closure, this source also informs QC-03's general control-material/control-statistics framing.",
    notClaimed: "This application does not implement, assess, or certify compliance with ISO 15189:2022 in any way, does not reproduce its text, and using it provides no accreditation-relevant evidence.",
    link: "https://www.iso.org/standard/76677.html",
    linkLabel: "iso.org — ISO 15189:2022"
  },
  {
    name: "Giannoli JM, Vassault A, Carobene A, et al. — Ensuring internal quality control practices in medical laboratories: IFCC recommendations for practical applications based on ISO 15189:2022",
    version: "Clinica Chimica Acta, 2025;571:120240",
    tier: "professional-guidance",
    informs: "Contemporary IFCC recommendations translating ISO 15189:2022 into practical internal quality-control guidance, including a risk-oriented framing of IQC design, informing the general framing of QC purpose used in this application, including the QC Strategy Lab's acknowledgement (without full implementation) of risk-based IQC concepts, and — as of v0.5/v0.5.1 — the Investigation Lab's general framing of planning for, and professionally responding to, an IQC failure, and of considering patient-result impact and disposition after one occurs. As of the QC-03 pre-release content closure, this source also informs QC-03's general framing of control-material selection, control-statistics establishment, and the handling/stability doctrine it teaches.",
    notClaimed: "This application does not reproduce, summarise in detail, or implement these IFCC recommendations as a procedure, and does not represent IFCC endorsement of this application. This is professional guidance, not a universal consensus binding every laboratory — contemporary IQC design, including this recommendations paper itself, remains an area of active scientific discussion rather than a single settled doctrine; see the published critical commentary below and \"Areas of ongoing discussion.\"",
    link: "https://doi.org/10.1016/j.cca.2025.120240",
    linkLabel: "doi.org — Giannoli et al., Clinica Chimica Acta (2025)"
  },
  {
    name: "Çubukçu HC, Thelen M, Plebani M — IFCC recommendations for internal quality control practice: a missed opportunity",
    version: "Clinical Chemistry and Laboratory Medicine (CCLM), 2025",
    tier: "commentary",
    informs: "A published critical commentary on aspects of the 2025 IFCC recommendations above, cited — as of v0.5.1 — under \"Areas of ongoing discussion\" to teach that IQC methodology and guidance, including recently published professional recommendations, remain subjects of active scientific discussion rather than settled, uncontested doctrine.",
    notClaimed: "This application does not reproduce this commentary's specific arguments in detail, does not adjudicate between it and the IFCC recommendations it discusses, and does not present this commentary as proving the IFCC recommendations \"wrong\" — both are presented as part of an ongoing scientific conversation, at a different evidentiary tier (commentary/methodological critique) than the primary professional-guidance source itself.",
    link: "https://doi.org/10.1515/cclm-2025-0486",
    linkLabel: "doi.org — Çubukçu et al., CCLM (2025)"
  },
  {
    name: "EFLM Biological Variation Database",
    version: "Ongoing / maintained by EFLM",
    tier: "reference-resource",
    informs: "General awareness that biological variation data and derived analytical performance specifications exist as a maintained, evolving public resource, referenced conceptually by the Sigma Sandbox and, as of v0.7, the BV & RCV Lab's Database Explorer and Evidence content — improving access to biological-variation estimates for many measurands.",
    notClaimed: "No biological variation data values from the database are ever queried live or reproduced automatically. Every numeric estimate used anywhere in this application, including in the BV & RCV Lab's small fixed educational dataset, is a deterministic, authored teaching value with its own stated provenance — the database improving access to estimates does not remove the need to check a given estimate's population, health status, sampling interval, and BIVAC-related study quality before applying it.",
    link: "https://biologicalvariation.eu/",
    linkLabel: "biologicalvariation.eu — EFLM Biological Variation Database"
  },
  {
    name: "Aarsand AK, Røraas T, Fernandez-Calle P, et al. — The Biological Variation Data Critical Appraisal Checklist: A Standard for Evaluating Studies on Biological Variation",
    version: "Clinical Chemistry, 2018;64(3):501-514",
    tier: "peer-reviewed-methodological",
    informs: "The BIVAC (Biological Variation Data Critical Appraisal Checklist) concept — as of v0.7 — taught conceptually in the BV & RCV Lab (14 named quality items) as a way to judge how trustworthy a published biological-variation estimate is, including the mandatory misconception exercise that a numerically smaller CVI/CVG estimate is not automatically the more reliable one.",
    notClaimed: "This application does not reproduce the checklist's exact wording, does not implement an automated BIVAC scoring/rating engine, and never assigns a computed BIVAC grade to any dataset value — any bivacStatus text shown is a short descriptive note authored for teaching, not a computed appraisal.",
    link: "https://doi.org/10.1373/clinchem.2017.281808",
    linkLabel: "doi.org — Aarsand et al., Clinical Chemistry (2018)"
  },
  {
    name: "Bartlett WA, Braga F, Carobene A, et al. — Harmonization initiatives in the generation, reporting and application of biological variation data",
    version: "Clinical Chemistry and Laboratory Medicine (CCLM), 2018",
    tier: "peer-reviewed-methodological",
    informs: "General context — as of v0.7 — for the BV & RCV Lab's 'estimates not constants' framing and its data-provenance emphasis (population, health status, sampling interval, study time scale), reflecting ongoing efforts to harmonise how biological-variation studies are conducted, reported and applied.",
    notClaimed: "This application does not reproduce this paper's specific harmonisation recommendations or checklists, and does not claim its own small educational dataset was produced under a formal harmonisation protocol.",
    link: "https://doi.org/10.1515/cclm-2018-0058",
    linkLabel: "doi.org — Bartlett et al., CCLM (2018)"
  },
  {
    name: "Harris EK, Yasaka T — On the calculation of a reference change for comparing two consecutive measurements",
    version: "Clinical Chemistry, 1983;29(1):25-30",
    tier: "peer-reviewed-methodological",
    informs: "The foundational classical (symmetric) reference change value formula — as of v0.7 — implemented directly in calculateClassicalRcv() (RCV = z × √2 × √(CVA² + CVI²)), with explicit, always-visible z-value conventions (bidirectional-95, unidirectional-95) rather than a bare '95% confidence' figure.",
    notClaimed: "This application does not reproduce this paper's derivation or worked examples, and its RCV functions are independently implemented and independently tested against the formula's published mathematical definition, not against this paper's specific text.",
    link: "https://doi.org/10.1093/clinchem/29.1.25",
    linkLabel: "doi.org — Harris & Yasaka, Clinical Chemistry (1983)"
  },
  {
    name: "Fokkema MR, Herrmann Z, Muskiet FAJ, Moecks J — Reference change values for brain natriuretic peptides revisited",
    version: "Clinical Chemistry, 2006;52(8):1602-1603",
    tier: "peer-reviewed-methodological",
    informs: "The log-normal (asymmetric) reference change value model — as of v0.7 — implemented as the separately-named calculateLognormalRcv(), which returns distinct increase and decrease-magnitude limits and is not presented as universally superior to the classical symmetric model.",
    notClaimed: "This application does not reproduce this paper's specific worked examples or brain-natriuretic-peptide-specific findings, and its log-normal RCV function is independently implemented and independently tested against the model's published mathematical definition, not against this paper's specific data.",
    link: "https://doi.org/10.1373/clinchem.2006.069369",
    linkLabel: "doi.org — Fokkema et al., Clinical Chemistry (2006)"
  },
  {
    name: "Panteghini M, Sandberg S — Defining analytical performance specifications 15 years after the Stockholm conference",
    version: "Clinical Chemistry and Laboratory Medicine (CCLM), 2015;53(6):829-832",
    tier: "peer-reviewed-methodological",
    informs: "General context for the Milan Model 2 biological-variation-derived APS framework — as of v0.7 — reconnecting the BV & RCV Lab's APS-from-BV panel with the existing, unmodified APS Explorer's MILAN_MODELS entry rather than presenting BV-derived APS as a universal specification.",
    notClaimed: "This application does not reproduce this paper's arguments or historical account in detail, and presents the biological-variation model as one of several legitimate APS models, not the only or automatically superior one.",
    link: "https://doi.org/10.1515/cclm-2015-0303",
    linkLabel: "doi.org — Panteghini & Sandberg, CCLM (2015)"
  },
  {
    name: "European Biological Variation Study (EuBIVAS) — within- and between-subject biological variation estimates for serum thyroid biomarkers",
    version: "Clinical Chemistry and Laboratory Medicine (CCLM), 2021",
    tier: "peer-reviewed-methodological",
    informs: "The one literature-derived-snapshot record in the BV & RCV Lab's small educational dataset (thyroid stimulating hormone, TSH) — as of v0.7 — illustrating what a real, dated, sourced biological-variation estimate looks like, alongside the module's illustrative-teaching-value records.",
    notClaimed: "The CVI/CVG figures shown for TSH in this application are rounded, order-of-magnitude approximations for teaching purposes, not a verbatim reproduction of this study's precise reported values, and this thyroid-specific estimate is explicitly not generalised to other thyroid measurands or to any other analyte anywhere in this application.",
    link: "https://doi.org/10.1515/cclm-2020-1885",
    linkLabel: "doi.org — EuBIVAS thyroid biomarkers study, CCLM (2021)"
  },
  {
    name: "Fraser CG — Biological variation: a still maturing aspect of laboratory medicine",
    version: "Advances in Laboratory Medicine / Avances en Medicina de Laboratorio, 2020;1(3)",
    tier: "review",
    informs: "A narrative overview of biological variation's ongoing methodological development — as of v0.7 — informing the BV & RCV Lab's general 'estimates not constants' framing and its acknowledgement that BV methodology itself remains an active area of scientific refinement.",
    notClaimed: "This application does not reproduce this review's text or specific arguments, and treats it as one narrative overview among several rather than a settled, final statement on BV methodology.",
    link: "https://doi.org/10.1515/almed-2019-0032",
    linkLabel: "doi.org — Fraser, Adv Lab Med / Almed (2020)"
  },
  {
    name: "Milan analytical performance specification framework",
    version: "1st EFLM Strategic Conference, Milan, 2014 (consensus statement)",
    tier: "professional-guidance",
    informs: "The general principle used in this application that analytical performance specifications can be derived from different models (e.g. clinical outcome, biological variation, state-of-the-art) and that selecting one requires scientific context.",
    notClaimed: "This application does not reproduce the Milan models in technical detail, does not classify analytes into a specific model tier, and does not claim any TEa value shown here was derived using a Milan-model methodology.",
    link: "https://www.eflm.eu/files/efcc/3.5%20CCLM-Consensus%20Statement.pdf",
    linkLabel: "eflm.eu — Milan consensus statement (CCLM)"
  },
  {
    name: "Statistical QC / multirule literature (Westgard and colleagues)",
    version: "Established body of work, various dates",
    tier: "reference-resource",
    informs: "The general existence and purpose of statistical control-rule approaches to QC interpretation, acknowledged in the Pattern Challenge and LJ Laboratory without being implemented.",
    notClaimed: "No proprietary Westgard diagrams, trademarks, or educational graphics are reproduced. The Rule Laboratory (added in v0.2, extended in v0.3.1) implements independently engineered and independently tested detection logic for seven commonly taught rules (1₂s, 1₃s, 2₂s, R₄s, 4₁s, 10x, and — added in v0.3.1 — 8x), built from their published mathematical definitions rather than from any proprietary Westgard software, chart, or copyrighted material. This application is not affiliated with, and is not endorsed by, Westgard QC or any related entity. This entry covers general statistical-QC concepts only — the specific branded Westgard Sigma Rules™ framework used for QC-procedure selection is cited separately below, since the two are not the same thing and are not to be silently mixed.",
    link: "https://www.westgard.com/",
    linkLabel: "westgard.com"
  },
  {
    name: "Statistical QC Rule Definitions — CLSI C24",
    tier: "professional-guidance",
    version: "Statistical Quality Control for Quantitative Measurement Procedures: Principles and Definitions, 4th Edition, Clinical and Laboratory Standards Institute",
    informs: "The general laboratory-standards context establishing statistical control-rule procedures (including multirule approaches) as a recognised part of internal QC practice (informing the Rule Laboratory), and — as of v0.3 — the broader context for QC strategy planning, QC procedure performance (Ped/Pfr concepts), QC frequency, the run concept, and response to out-of-control conditions used qualitatively throughout the QC Strategy Lab. As of v0.4, this also informs the Risk & Frequency Lab's conceptual treatment of risk-based SQC strategy design, the QC-event/QC-frequency/analytical-run distinction, QC-event scheduling, and the out-of-control recovery preview (results since the last acceptable QC evidence potentially requiring investigation). As of v0.5, this also informs the Investigation Lab's general reasoning framework for statistical QC out-of-control response, recovery/resumption of testing, and consideration of patient results produced during a period of compromised validity.",
    notClaimed: "This application does not reproduce CLSI C24 text, tables, or figures, and does not implement, assess, or certify compliance with the C24 guideline. The Rule Laboratory's seven detectors, the QC Strategy Lab's Ped/Pfr and QC-procedure concepts, the Risk & Frequency Lab's frequency and recovery concepts, and the Investigation Lab's status model and scenario bank were authored and independently tested against published mathematical definitions and standard statistical/QC theory, not against CLSI's copyrighted text. This application does not implement a full retrospective patient-result correction engine, an automated out-of-control recovery workflow, or any institution-specific SOP. This application is not endorsed by Westgard QC, CLSI, ISO, IFCC or EFLM.",
    link: "https://clsi.org/shop/standards/c24/",
    linkLabel: "clsi.org — CLSI C24"
  },
  {
    name: "Parvin — Assessing the Impact of the Frequency of Quality Control Testing on the Quality of Reported Patient Results",
    version: "Clinical Chemistry, 2008;54(12):2049–2054",
    tier: "peer-reviewed-methodological",
    informs: "The Risk & Frequency Lab's conceptual foundation for connecting QC frequency to patient risk: the idea that QC performance can be evaluated by the expected increase in unacceptable final patient results reported while an out-of-control condition remains undetected, and the MaxE(Nuf) concept (maximum of that expectation over a range of systematic error conditions) introduced conceptually in \"From error detection to patient risk.\"",
    notClaimed: "This application does not reproduce Parvin's equations, figures, or worked examples, and does not implement a general numerical MaxE(Nuf) calculator in v0.4 — see the explicit boundary note in the Patient-Risk Explorer. The independently derived geometric detection-delay model implemented in this build (15-detection-delay.js) is explicitly labelled as NOT Parvin's MaxE(Nuf) model.",
    link: "https://doi.org/10.1373/clinchem.2008.113639",
    linkLabel: "doi.org — Parvin, Clinical Chemistry (2008)"
  },
  {
    name: "Yago & Alcover — Selecting Statistical Procedures for Quality Control Planning Based on Risk Management",
    version: "Clinical Chemistry, 2016;62(7):959–965",
    tier: "peer-reviewed-methodological",
    informs: "The general relationship, for single-rule QC procedures, between traditional error-detection performance (Ped) and patient-risk-oriented planning quantities such as MaxE(Nuf) — informing the Risk & Frequency Lab's framing that Ped at one QC event and a frequency-sensitive patient-risk metric answer related but distinct questions.",
    notClaimed: "This application does not reproduce this paper's specific equations, tables, or examples, and does not extend its single-rule treatment to multirule procedures. No numerical MaxE(Nuf) value in this application is claimed to be derived from this source's specific method.",
    link: "https://doi.org/10.1373/clinchem.2015.254094",
    linkLabel: "doi.org — Yago & Alcover, Clinical Chemistry (2016)"
  },
  {
    name: "Bayat & Westgard — Selecting multi-rule quality control procedures based on patient risk",
    version: "Clinical Chemistry and Laboratory Medicine (CCLM), 2017",
    tier: "peer-reviewed-methodological",
    informs: "General awareness, referenced in the Risk & Frequency Lab, that patient-risk-based planning concepts have been extended from single-rule to multirule QC procedures, and connected to run-size planning concepts in the published literature.",
    notClaimed: "This application does not implement any multirule patient-risk or run-size calculation from this source. As throughout this build, numerical Ped/Pfr and detection-delay modelling remain restricted to the single 1₃s rule; this reference is cited for conceptual context only.",
    link: "https://doi.org/10.1515/cclm-2016-1077",
    linkLabel: "doi.org — Bayat & Westgard, CCLM (2017)"
  },
  {
    name: "Bayat, Westgard & Westgard — Planning Risk-Based Statistical Quality Control Strategies: Graphical Tools to Support the New Clinical and Laboratory Standards Institute C24-Ed4 Guidance",
    version: "The Journal of Applied Laboratory Medicine, 2017",
    tier: "peer-reviewed-methodological",
    informs: "The general concept, referenced in the Patient-Risk Explorer, that published planning tools relate Sigma performance, error-detection performance, MaxE(Nuf), and QC run size/frequency through graphical nomograms and calculators — informing this application's clearly-labelled, original conceptual (non-reproduced) nomogram-concept example.",
    notClaimed: "This application does not reproduce this paper's nomograms, graphics, or specific calculator, and does not generalise its run-size relationship (run size = 100 / MaxE(Nuf)) beyond the stated reference conditions of that framework. \"Patient Risk Sigma,\" where mentioned, is attributed to this kind of risk-planning tool rather than presented as ordinary analytical Sigma.",
    link: "https://doi.org/10.1373/jalm.2017.023192",
    linkLabel: "doi.org — Bayat, Westgard & Westgard, JALM (2017)"
  },
  {
    name: "Low et al. — Number of patient samples affected before error detection: strategic implications for IQC and PBQC practices",
    version: "Clinica Chimica Acta, 2025",
    tier: "peer-reviewed-methodological",
    informs: "The contemporary ANPed (Average Number of patient samples affected before Error Detection) concept referenced in the Risk & Frequency Lab as an example of recent work comparing internal QC (IQC) frequency and patient-based QC (PBQC) detection-delay consequences.",
    notClaimed: "This application's simplified v0.4 geometric detection-delay calculation is independently derived and tested, and is not claimed to be numerically identical to this paper's specific ANPed implementation or to reproduce its results — it illustrates the same underlying principle only.",
    link: "https://doi.org/10.1016/j.cca.2025.120166",
    linkLabel: "doi.org — Low et al., Clinica Chimica Acta (2025)"
  },
  {
    name: "Parvin & Baumann — Assessing Quality Control Strategies for HbA1c Measurements From a Patient Risk Perspective",
    version: "Journal of Diabetes Science and Technology, 2018;12(5):994–1000",
    tier: "peer-reviewed-methodological",
    informs: "An example, referenced in the Investigation Lab's Patient Result Impact module, that retrospective remeasurement and report revision after a QC concern has been operationalised in a defined study context (HbA1c) — supporting the general principle that patient-result review after an analytical disturbance is a recognised, published idea rather than one invented for this application.",
    notClaimed: "This application does not reproduce this paper's specific statistical criteria, patient-risk model, or worked examples, and does not generalise its exact HbA1c-specific review criteria to any other analyte or to any laboratory's actual procedure. The retrospective remeasurement exercise in this build uses independently authored, synthetic teaching data only.",
    link: "https://doi.org/10.1177/1932296818758768",
    linkLabel: "doi.org — Parvin & Baumann, J Diabetes Sci Technol (2018)"
  },
  {
    name: "Gruber, Hausch, Mueller et al. — Internal Quality Controls in the Medical Laboratory: A Narrative Review of the Basic Principles of an Appropriate Quality Control Plan",
    version: "Diagnostics, 2024;14(19):2223",
    tier: "review",
    informs: "A contemporary narrative review of internal QC planning principles, informing the Investigation Lab's general framing of QC response and troubleshooting as a structured, evidence-based process rather than a fixed checklist.",
    notClaimed: "This application does not reproduce this review's text, tables, or recommendations, and treats it as one narrative review among several rather than a formal standard or a universally binding QC plan. Where this review (or Gruber's retrospective remeasurement example specifically) is used to illustrate retrospective assessment, this application does not turn that illustrative example into a universal algorithm, and does not hard-code a fixed batch size (such as \"the 10 most recent specimens\"), an automatic return to the last accepted QC as a review boundary, or mandatory repetition of every specimen tested since then. Retrospective assessment should be guided by the defined laboratory procedure and evidence about the plausible affected interval.",
    link: "https://doi.org/10.3390/diagnostics14192223",
    linkLabel: "doi.org — Gruber et al., Diagnostics (2024)"
  },
  {
    name: "McFarlane et al. — Internal Quality Control Practices in Coagulation Laboratories: recommendations based on a patterns-of-practice survey",
    version: "International Journal of Laboratory Hematology, 2015;37(5):579–591",
    tier: "practice-survey",
    informs: "Descriptive, survey-based evidence — referenced in the Investigation Lab's \"areas of ongoing discussion\" — that internal QC practice, including response to IQC failures, genuinely varies across laboratories in practice, not only in theory, including a commonly reported repeat-QC-and-release pattern of behaviour.",
    notClaimed: "This application does not reproduce this survey's data, does not extend its coagulation-specific findings to other analytes, and does not treat descriptive practice-variation evidence as a statement of best practice. A high frequency of a practice in a survey does not establish that the practice is scientifically optimal — this is stated explicitly because this survey found repeat-QC-and-release behaviour to be commonly reported, and this application does not treat that frequency as endorsement.",
    link: "https://doi.org/10.1111/ijlh.12397",
    linkLabel: "doi.org — McFarlane et al., Int J Lab Hematol (2015)"
  },
  {
    name: "Westgard Sigma Rules™ — QC-procedure selection framework",
    version: "Westgard QC educational web lesson, undated, accessed 2026",
    tier: "reference-resource",
    informs: "The QC Strategy Lab's \"Simplified published Sigma Rules educational framework\" — one specific, named, cited approach to mapping a Sigma value onto a candidate QC procedure (rule set, N, R), used as one option among several legitimate ways to plan QC, never as a universal rule.",
    notClaimed: "This application does not reproduce Westgard's proprietary diagrams; all visualisations in the QC Strategy Lab are original. Band boundaries and N/R pairings are adapted to this application's standard 2-control-level teaching configuration and are documented explicitly in the framework's own \"assumptions\" and \"boundaryProvenance\" metadata (visible via each suggestion's \"Why did the application suggest this procedure?\" disclosure) rather than presented as a verbatim reproduction of the source table — including, as of v0.3.1, an explicit note that this application's inclusive (>=) boundary convention is its own implementation choice rather than a literal inequality stated by the source, and that the <4-Sigma band's 8x same-side rule is implemented and validated directly (not substituted with 10x). The phrase \"Westgard Sigma Rules™\" is used here only to refer to that specific branded published framework, with attribution — never as this application's own product name. This application is not affiliated with, and is not endorsed by, Westgard QC or any related entity.",
    link: "https://www.westgard.com/lessons/westgard-rules/westgard-rules/westgard-sigma-rules.html",
    linkLabel: "westgard.com — Westgard Sigma Rules"
  },
  {
    name: "ISO/IEC 17043",
    version: "2023 edition",
    tier: "standard",
    informs: "The general competence framework under which proficiency-testing (PT) providers operate, acknowledged — as of v0.6 — as the standards context for the External Assurance Lab's treatment of EQA/PT scheme design (target assignment, commutability, performance evaluation).",
    notClaimed: "This application does not implement, assess, or certify compliance with ISO/IEC 17043 in any way, does not reproduce its text, and does not simulate an actual accredited PT provider's operations.",
    link: "https://www.iso.org/standard/78798.html",
    linkLabel: "iso.org — ISO/IEC 17043:2023"
  },
  {
    name: "Miller WG, Jones GRD, Horowitz GL, Weykamp C — Proficiency Testing/External Quality Assessment: Current Challenges and Future Directions",
    version: "Clinical Chemistry, 2011;57(12):1670–1680",
    tier: "peer-reviewed-methodological",
    informs: "The capability-based framework this application draws on — as of v0.6 — for reasoning about what a given EQA/PT scheme design can and cannot demonstrate (target-value type, commutability, grouping), informing the External Assurance Lab's original Scheme Capability Profile interface (describeSchemeCapability()).",
    notClaimed: "This application does not reproduce this paper's specific category table, figures, or worked examples, and does not implement an automated Category 1-6 classifier from it — the Scheme Capability Profile is an original, qualitative interface built from the properties this paper discusses, not a reproduction of its published categorisation scheme.",
    link: "https://doi.org/10.1373/clinchem.2011.168641",
    linkLabel: "doi.org — Miller et al., Clinical Chemistry (2011)"
  },
  {
    name: "Miller WG, Myers GL — Commutability Still Matters",
    version: "Clinical Chemistry, 2013;59(9):1291–1293",
    tier: "peer-reviewed-methodological",
    informs: "The commutability concept and its consequences for EQA/PT and method-comparison interpretation — as of v0.6 — informing the External Assurance Lab's commutability status model (verified-commutable / noncommutable / commutability-not-established / not-applicable-or-insufficient-information) and its worked Commutability Challenge.",
    notClaimed: "This application does not reproduce this paper's text or specific examples, and does not implement a formal commutability-evaluation statistical procedure — commutability status in this application is always an authored scenario property, never computed from raw data.",
    link: "https://doi.org/10.1373/clinchem.2013.208785",
    linkLabel: "doi.org — Miller & Myers, Clinical Chemistry (2013)"
  },
  {
    name: "Jones GRD — Harmonisation and Standardisation: What is the Difference?",
    version: "Biochemia Medica, 2017;27(1):211–219",
    tier: "peer-reviewed-methodological",
    informs: "Conceptual vocabulary for distinguishing standardisation (agreement with a higher-order reference) from harmonisation (agreement between methods, with or without a reference) — as of v0.6 — informing the External Assurance Lab's careful separation of \"agreement with peer group\" from \"agreement with a higher-order reference\" (see PEER_GROUP_NOT_TRUTH_PRINCIPLE).",
    notClaimed: "This application does not reproduce this paper's text or specific worked examples, and does not implement any formal standardisation/harmonisation assessment protocol.",
    link: "https://doi.org/10.11613/bm.2017.004",
    linkLabel: "doi.org — Jones, Biochemia Medica (2017)"
  },
  {
    name: "Ceriotti F, Cobbaert C — Harmonization of Clinical Laboratory Results: The Journey Is More Important than the Goal",
    version: "Clinical Chemistry and Laboratory Medicine (CCLM), 2018;56(10):1587–1590",
    tier: "peer-reviewed-methodological",
    informs: "General perspective on the practical challenges of achieving between-method comparability across a laboratory's full test menu — as of v0.6 — informing the Comparability Lab's deliberately modest scope (paired differences only, no full CLSI EP09 statistics) and its framing that comparability work is incremental rather than a single achievable end-state.",
    notClaimed: "This application does not reproduce this paper's text or arguments in detail, and the Comparability Lab does not claim to implement any comprehensive harmonisation programme described or implied by this source.",
    link: "https://doi.org/10.1515/cclm-2018-0265",
    linkLabel: "doi.org — Ceriotti & Cobbaert, CCLM (2018)"
  },
  {
    name: "Secchiero S, Plebani M — External quality assessment schemes: need for recalibrating expectations",
    version: "Clinical Chemistry and Laboratory Medicine (CCLM), 2015;53(9):1341–1343",
    tier: "peer-reviewed-methodological",
    informs: "A published perspective on the evidentiary limits of EQA/PT schemes and the need to calibrate what conclusions a given scheme design can support — as of v0.6 — directly informing this application's two mandatory core lessons (good IQC does not prove trueness; a poor EQA result does not automatically prove routine patient-result bias).",
    notClaimed: "This application does not reproduce this paper's text or specific arguments, and does not present its perspective as the only legitimate view of EQA/PT evidentiary capability — see \"Areas of ongoing discussion.\"",
    link: "https://doi.org/10.1515/cclm-2015-0062",
    linkLabel: "doi.org — Secchiero & Plebani, CCLM (2015)"
  },
  {
    name: "Weykamp C, Secchiero S, Plebani M, et al. — Analytical Performance Specifications for External Quality Assessment — Definitions and Descriptions (Milan, 2014 outcomes; INPUtS)",
    version: "Clinical Chemistry and Laboratory Medicine (CCLM), 2017;55(10):1670–1680",
    tier: "peer-reviewed-methodological",
    informs: "General terminology and definitions for setting performance specifications within EQA/PT schemes — as of v0.6 — informing the External Assurance Lab's PERFORMANCE_CRITERION_APS_LINK_NOTE, which reconnects an EQA scheme's stated criterion with the existing, unmodified APS Explorer/Milan-model vocabulary rather than assuming every scheme uses TEa.",
    notClaimed: "This application does not reproduce this paper's text, definitions verbatim, or specific worked examples, and does not implement any specific numeric EQA performance specification derived from it — all performance criteria shown in External Assurance Lab scenarios are illustrative, scenario-authored values.",
    link: "https://doi.org/10.1515/cclm-2016-0220",
    linkLabel: "doi.org — Weykamp et al., CCLM (2017)"
  },
  {
    name: "Badrick T, Bietenbeck A, Cervinski MA, et al. — Patient-Based Real-Time Quality Control: Review and Recommendations",
    version: "Clinical Chemistry, 2019;65(8):962–971",
    tier: "review",
    informs: "The core review and consensus recommendations underlying the Patient Surveillance Lab (v0.8) — terminology, the general PBRTQC concept, and the recommendation that algorithm and parameter choices require local validation.",
    notClaimed: "This application does not reproduce this paper's text, figures, or specific worked examples, and implements only a small, deliberately restricted subset (three sliding algorithms) of the broader landscape this review surveys.",
    link: "https://doi.org/10.1373/clinchem.2019.305482",
    linkLabel: "doi.org — Badrick et al., Clinical Chemistry (2019)"
  },
  {
    name: "Loh TP, Bietenbeck A, Cervinski MA, et al. — Recommendation for performance verification of patient-based real-time quality control",
    version: "Clinical Chemistry and Laboratory Medicine (CCLM), 2020;58(8):1205–1213",
    tier: "professional-guidance",
    informs: "One of the primary sources for v0.8's training/verification architectural separation, NPed/ANPed detection-delay conventions, and pointwise false-flag-rate methodology, including the illustrative 50:50/80:20 split examples.",
    notClaimed: "This application does not implement this paper's full recommended verification protocol, and does not claim any specific numeric performance figure shown in this build reproduces a result from this paper.",
    link: "https://doi.org/10.1515/cclm-2019-1024",
    linkLabel: "doi.org — Loh et al., CCLM (2020)"
  },
  {
    name: "Bietenbeck A, Cervinski MA, Katayev A, et al. — Understanding Patient-Based Real-Time Quality Control Using Simulation Modeling",
    version: "Clinical Chemistry, 2020;66(8):1072–1083",
    tier: "peer-reviewed-methodological",
    informs: "The general approach of using simulation with synthetic, deterministic patient data (rather than real patient data) to teach how PBRTQC algorithm and parameter choices affect detection behaviour.",
    notClaimed: "This application does not reproduce this paper's specific simulation code, figures, or numeric results — all populations, errors, and configurations shown are this application's own independently authored synthetic data.",
    link: "https://doi.org/10.1093/clinchem/hvaa094",
    linkLabel: "doi.org — Bietenbeck et al., Clinical Chemistry (2020)"
  },
  {
    name: "Badrick T, Cervinski M, Loh TP — A primer on patient-based quality control techniques",
    version: "Clinical Biochemistry, 2019;66:1–7",
    tier: "review",
    informs: "General introductory framing of patient-based quality control techniques and terminology used throughout the Patient Surveillance Lab's Foundations mode.",
    notClaimed: "This application does not reproduce this paper's text or specific technique descriptions verbatim.",
    link: "https://doi.org/10.1016/j.clinbiochem.2018.12.004",
    linkLabel: "doi.org — Badrick, Cervinski & Loh, Clinical Biochemistry (2019)"
  },
  {
    name: "van Rossum HH, Kaufmann M, Loh TP, et al. — Benefits, limitations and controversies on patient-based real-time quality control (PBRTQC) and the evidence behind the practice",
    version: "Clinical Chemistry and Laboratory Medicine (CCLM), 2021;59(8):1354–1361",
    tier: "peer-reviewed-methodological",
    informs: "The complementary (never \"PBRTQC > IQC\" or the reverse) framing of PBRTQC and IQC used throughout this lab, and the acknowledgement that PBRTQC methodology remains an area of active discussion — see \"Areas of ongoing discussion.\"",
    notClaimed: "This application does not present this paper's specific controversies as fully resolved, and does not reproduce its text or arguments.",
    link: "https://doi.org/10.1515/cclm-2021-0072",
    linkLabel: "doi.org — van Rossum et al., CCLM (2021)"
  },
  {
    name: "Smith JD, Badrick T, Bowling F — A direct comparison of patient-based real-time quality control techniques: The importance of the analyte distribution",
    version: "Annals of Clinical Biochemistry, 2020;57(4):288–294",
    tier: "peer-reviewed-methodological",
    informs: "The signature distribution experiment in the Patient Distribution Lab — that an identical PBRTQC configuration behaves very differently depending on the patient population's underlying distribution.",
    notClaimed: "This application does not reproduce this paper's specific analytes, datasets, or numeric results — the narrow-stable and broad-heterogeneous populations shown are this application's own independently authored synthetic data.",
    link: "https://doi.org/10.1177/0004563220902174",
    linkLabel: "doi.org — Smith, Badrick & Bowling, Ann Clin Biochem (2020)"
  },
  {
    name: "Loh TP, Cooke BR, Markus C, et al. — Recommendations for laboratory informatics specifications needed for the application of patient-based real time quality control",
    version: "Clinica Chimica Acta, 2019;495:625–629",
    tier: "professional-guidance",
    informs: "The informatics-reliability topic list and the duplicate-feed informatics challenge scenario, teaching that a data-pipeline fault can move a PBRTQC statistic exactly as an analytical fault can.",
    notClaimed: "This application does not implement any of this paper's specific informatics specifications — the informatics scenario is a conceptual, scenario-authored teaching example, not a compliance checklist.",
    link: "https://doi.org/10.1016/j.cca.2019.06.009",
    linkLabel: "doi.org — Loh et al., Clinica Chimica Acta (2019)"
  },
  {
    name: "Loh TP, Cooke BR, Tran MT, et al. — Impact of combining data from multiple instruments on performance of patient-based real-time quality control",
    version: "Biochemia Medica, 2021;31(2):020705",
    tier: "peer-reviewed-methodological",
    informs: "The multiple-analyzer pooling experiment, and the mandatory statement that combining patient results across instruments changes the monitored process and must be validated for that configuration.",
    notClaimed: "This application does not reproduce this paper's specific instruments, datasets, or numeric results — the pooled-vs-separate comparison shown uses this application's own independently authored synthetic data.",
    link: "https://doi.org/10.11613/BM.2021.020705",
    linkLabel: "doi.org — Loh et al., Biochemia Medica (2021)"
  },
  {
    name: "van Andel B, Loh TP, Bayat H, et al. — Moving average quality control of routine chemistry and hematology parameters: a toolbox for implementation",
    version: "Clinical Chemistry and Laboratory Medicine (CCLM), 2022;60(11):1699–1708",
    tier: "professional-guidance",
    informs: "General practical context for how a laboratory might approach implementing a moving-average PBRTQC configuration, including the illustrative parameter-provenance categories used throughout this lab.",
    notClaimed: "This application does not implement this paper's specific implementation toolbox or algorithm, and does not present any parameter value shown as this toolbox's recommended setting.",
    link: "https://doi.org/10.1515/cclm-2022-0655",
    linkLabel: "doi.org — van Andel et al., CCLM (2022)"
  },
  {
    name: "Duan H, Cao Y, Zhang C, et al. — Next-Generation Patient-Based Real-Time Quality Control Models",
    version: "Annals of Laboratory Medicine, 2024",
    tier: "review",
    informs: "Context for the explicit exclusion, in v0.8, of machine-learning-based and other next-generation PBRTQC methods — cited to acknowledge this active area of development exists, cautiously and not to justify implementing any AI feature.",
    notClaimed: "This application does not implement, and this citation does not justify implementing, any machine-learning, regression-adjusted, or AI-driven PBRTQC method — those remain explicitly excluded from this build.",
    link: "https://doi.org/10.3343/alm.2024.0053",
    linkLabel: "doi.org — Duan et al., Ann Lab Med (2024)"
  }
];

/* -------------------------------------------------------------------------
   v0.5.1 — Evidence hierarchy (spec section 13). Every EVIDENCE_SOURCES
   entry above now carries a `tier` field drawn from this fixed list, in
   descending order of general evidentiary formality (not "quality" or
   "correctness" — a standard and a peer-reviewed paper answer different
   kinds of questions). This differentiation exists specifically so this
   application does not present every source as having identical
   evidentiary authority — a professional-guidance document, a narrative
   review, a practice survey and a published critical commentary are not
   interchangeable kinds of evidence.
   ------------------------------------------------------------------------- */
export const EVIDENCE_TIERS = [
  { id: "standard", label: "Standards", description: "Formal international/national standards (e.g. ISO 15189:2022)." },
  { id: "professional-guidance", label: "Professional guidance", description: "Recommendations and consensus statements issued by professional/standards bodies (e.g. CLSI C24, the 2025 IFCC recommendations, the Milan consensus statement)." },
  { id: "peer-reviewed-methodological", label: "Peer-reviewed methodological literature", description: "Original peer-reviewed research papers proposing or evaluating a specific method, model or metric." },
  { id: "review", label: "Reviews", description: "Peer-reviewed narrative reviews synthesising a topic area, rather than presenting new original data." },
  { id: "practice-survey", label: "Practice surveys", description: "Descriptive, survey-based evidence about what laboratories actually do — evidence of practice variation, not a statement of best practice." },
  { id: "commentary", label: "Commentary / methodological critique", description: "Published critical commentary or correspondence discussing another source, reflecting ongoing scientific debate rather than new original data." },
  { id: "reference-resource", label: "Reference resources", description: "Maintained public resources, educational web materials, or an established general body of work, cited for context rather than as a single citable study." }
];
export const EVIDENCE_HIERARCHY_AUTHORITY_NOTE = "Do not present all sources on this page as having identical evidentiary authority. A standard, a professional-guidance document, a peer-reviewed methodological paper, a narrative review, a practice survey, and a commentary/methodological critique each carry a different kind and weight of evidence — grouping them together for reference is not the same as treating them as equally authoritative or as being in full agreement with one another.";

/* -------------------------------------------------------------------------
   "Areas of ongoing discussion" — spec section 34. A short, non-polemical
   acknowledgement that several topics touched on by the QC Strategy Lab
   are areas of live scientific/methodological discussion, not settled
   doctrine. The educational objective is critical appraisal, not a verdict.
   ------------------------------------------------------------------------- */
export const ONGOING_DISCUSSION_AREAS = [
  "Whether the 2025 IFCC recommendations for internal quality control practice strike the right balance in translating ISO 15189:2022 into practical guidance — a published critical commentary (Çubukçu, Thelen & Plebani, 2025, \"a missed opportunity\") raises methodological concerns about aspects of those recommendations, illustrating that even recently published professional guidance remains a subject of active scientific discussion rather than settled, uncontested doctrine.",
  "Which analytical performance specification model (clinical outcome, biological variation, or state-of-the-art) is most appropriate for a given measurand, and how to weigh them when they disagree.",
  "How best to combine bias and imprecision into a single total-error or Sigma-style metric, versus evaluating them separately.",
  "How bias itself should be estimated in practice (e.g. against a reference method, a peer group, or an EQA scheme), since different approaches can give different bias estimates for the same method.",
  "How prescriptive a published QC-procedure-selection framework should be, versus how much laboratory-specific judgement should override it.",
  "How to set QC frequency in a way that is genuinely risk-based rather than a fixed convention (e.g. one run per shift).",
  "How to weigh statistical risk modelling against practical, operational and cost constraints when designing a QC strategy.",
  "Risk-based QC methodology itself continues to evolve, and reasonable experts weigh its assumptions differently — this application does not present Parvin's patient-risk framework, or any single risk metric, as unquestionable or universally definitive.",
  "Different patient-risk-model assumptions (for example, how a systematic error is assumed to begin and behave over time) can materially change a risk-based planning conclusion, and the choice among them is itself a matter of judgement.",
  "Patient harm is not identical to analytical unreliability — a detected or undetected analytical error does not map onto clinical harm in a fixed, universal way, and different risk metrics (e.g. Ped, MaxE(Nuf), ANPed) answer different, complementary questions rather than one superseding the others.",
  "Patient-based real-time quality control (PBRTQC), implemented in the Patient Surveillance Lab as of v0.8, introduces additional approaches to limiting detection delay beyond adjusting the frequency of conventional internal QC, and remains an active area of ongoing methodological development rather than a settled, one-size-fits-all technique.",
  "What the optimal troubleshooting sequence is after a QC signal, and how much a published reasoning framework should be allowed to override laboratory-specific judgement and local procedure.",
  "How to interpret an isolated statistical signal — as likely false rejection, as an early real disturbance, or as genuinely indeterminate — when the available evidence does not clearly favour one interpretation.",
  "How confidently failure onset can ever be identified from QC and process-event timing alone, versus requiring corroborating technical or comparison evidence.",
  "How far retrospective patient-result testing or review should extend after an analytical disturbance is identified, and who should decide this for a given case.",
  "Where the boundary lies between a demonstrated analytical difference and a clinically meaningful difference, and how much of that judgement is analytical versus clinical.",
  "How much weight patient-derived evidence (comparison testing, distribution summaries) should carry relative to QC-material, reagent, calibration, and instrument evidence when they point in different directions.",
  "What recovery evidence is sufficient before resuming routine testing, and whether that threshold should be uniform or should vary by analyte, QC design, and clinical risk — this application does not claim any single institutional answer is universally correct.",
  "How much evidentiary weight a single EQA/PT round should carry relative to a laboratory's own internal QC history, and whether that weighting should differ by analyte or by scheme design (Secchiero & Plebani, 2015).",
  "Whether the Miller et al. (2011) capability-category approach, or an alternative framework, is the most useful way to communicate what a given EQA/PT scheme can and cannot demonstrate to a practising laboratory.",
  "Where the practical line falls between \"commutability not established\" and \"commutability effectively assumed,\" given that formal commutability studies are resource-intensive and not available for every measurand and material combination (Miller & Myers, 2013).",
  "Whether \"harmonisation\" and \"standardisation\" should be pursued as the same goal or treated as genuinely distinct objectives requiring different evidence (Jones, 2017), and how a laboratory should prioritise between them for a given measurand.",
  "How much a peer-group-based EQA scheme, lacking a higher-order reference target, can responsibly claim to demonstrate about a participant's trueness versus its agreement with a possibly-biased peer group.",
  "How prescriptive published PT-integrity guidance should be about repeat measurement of EQA/PT specimens, versus how much should be left to a laboratory's own routine specimen-handling procedure.",
  "How comprehensive a laboratory's own method-comparison programme should be (e.g. whether simplified paired-difference review is sufficient, or full CLSI EP09-style regression and limits-of-agreement analysis is warranted) given available resources (Ceriotti & Cobbaert, 2018).",
  "How to set a scheme-specific or laboratory-specific EQA/PT performance criterion in a way that is scientifically defensible rather than an arbitrary convention (Weykamp et al., 2017), and how much this should vary by analyte and clinical use.",
  "Whether the classical (symmetric) or the log-normal (asymmetric) reference change value model is more appropriate for a given analyte, and how much this choice matters in practice for analytes with modest combined variation.",
  "How much weight a numerically smaller published CVI or CVG estimate should be given relative to a larger one, when the smaller estimate has not been shown to come from a more rigorously appraised (BIVAC-compliant) study.",
  "Whether a single index-of-individuality heuristic band system (marked/intermediate/low) is the most useful way to communicate reference-interval usefulness, versus presenting the continuous ratio alone.",
  "How safely a biological-variation estimate derived in healthy volunteers can be applied to patients with the disease or condition actually being monitored, and how large that gap typically is for a given analyte.",
  "How much a mismatch between a BV study's sampling interval and a real clinical monitoring interval should discount confidence in an RCV calculated from that study's CVI.",
  "Whether combining bias and imprecision into a single BV-derived TEa figure obscures more than it reveals, versus reporting the imprecision and bias components of a BV-derived APS separately.",
  "How prescriptive the Milan Model 2 (biological-variation-derived) APS framework should be relative to clinical-outcome-derived or state-of-the-art-derived APS models when they disagree for the same measurand.",
  "Whether reference change values should ever be adjusted for pre-analytical factors (such as time-of-day or fasting status) at the point of interpretation, or whether that adjustment belongs earlier, in specimen collection practice.",
  "How much biological rhythms (circadian, menstrual, seasonal) that are not explicitly modelled in a given BV estimate should discount confidence in an RCV or reference interval built from that estimate.",
  "Whether EFLM Biological Variation Database entries should be treated as sufficiently current for a given analyte without checking the underlying study's publication date and appraisal status.",
  "How laboratories should communicate an exceeded reference change value to clinicians in a way that avoids implying automatic clinical or pathological significance.",
  "Whether the field should move toward requiring formal BIVAC appraisal before a biological-variation estimate is used to derive any clinical decision support, or whether that bar is impractical for less-studied analytes.",
  "Which PBRTQC algorithm (moving mean, moving median, EWMA, or another approach not implemented in this build) is most appropriate for a given analyte and population, and how much this choice should be re-evaluated as case mix changes.",
  "How to choose a PBRTQC window size (W) or EWMA smoothing constant (lambda) in a way that is scientifically defensible for a specific laboratory, rather than copied from another laboratory's published configuration.",
  "How aggressively to truncate patient results before they enter a PBRTQC algorithm, given that both under-truncation (unstable tails) and over-truncation (discarding evidence of a real error) can worsen performance.",
  "What minimum amount of historical patient data is genuinely sufficient to characterise a population and select PBRTQC parameters responsibly, given that no single number applies to every analyte and laboratory.",
  "How to weigh a PBRTQC configuration's detection-delay performance (NPed/ANPed) against its false-alert burden when the two cannot both be minimised simultaneously.",
  "Whether patient-count detection delay (NPed) or elapsed-time detection delay is the more clinically meaningful way to communicate PBRTQC performance to a laboratory's stakeholders.",
  "How much evidentiary weight a PBRTQC alert should carry relative to IQC when the two disagree, and how a laboratory should structure its response when they do.",
  "Whether combining (pooling) patient results across multiple analyzers or sites into a single PBRTQC stream is worth the validation burden it introduces, for a given laboratory network.",
  "How a laboratory should distinguish a genuine case-mix change from an early analytical disturbance when both can move a PBRTQC statistic in similar ways.",
  "What counts as a \"material change\" requiring PBRTQC re-verification, and how a laboratory should decide this in practice given the absence of a universal trigger list.",
  "How rigorously informatics/data-pipeline reliability needs to be verified before a PBRTQC alert can be reasonably attributed to an analytical rather than an informatics cause.",
  "Whether next-generation (machine-learning-based or regression-adjusted) PBRTQC methods, not implemented in this build, offer a genuine performance advantage over the three classical algorithms implemented here, or introduce validation and interpretability challenges of their own (Duan et al., 2024).",
  "How PBRTQC evidence should be governed and documented alongside a laboratory's existing IQC and EQA governance framework, rather than as a separate, unconnected activity.",
  "Whether \"report from the back\" (holding a block of results pending block completion) is a practice worth adopting alongside PBRTQC, given the operational trade-offs it introduces — not implemented in this build."
];
