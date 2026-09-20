/* =========================================================================
   app/qc-materials/data.js — QC-03: QC Materials & Control Statistics
   PROVENANCE: V09_NEW (pre-release content closure)

   Static content & deterministic datasets only. No calculation logic
   lives here — every numeric statistic used in screens.jsx is computed
   at render time from these raw arrays using the accepted central
   functions in app/core/statistics.js (calcMean, calcSampleSD,
   calcCVPercent), never a second competing implementation.

   All datasets are synthetic, deterministic, and reproducible — no
   randomness, no network access, no real patient or manufacturer data.
   ========================================================================= */

export const QC03_ID = "QC-03";
export const QC03_TITLE = "QC Materials & Control Statistics";
export const QC03_STAGE = "Understand";

export const QC03_INTRO =
  "Reliable QC interpretation begins before the first point is plotted on a Levey‑Jennings chart. " +
  "The control material, its handling, the centre and dispersion assigned to it, and how those statistics " +
  "were established all influence what the chart means.";

/* -------------------------------------------------------------------------
   Station 1 — Know Your Control Material
   ------------------------------------------------------------------------- */

/* Classification exercise: each item must be sorted into exactly one of
   Calibrator / QC material / Patient specimen. `correct` is the accepted
   classification; `explain` is shown after the learner answers. */
export const QC03_CLASSIFICATION_ITEMS = [
  { id: "cal-1", text: "A manufacturer-provided material with an assigned value, used to establish or adjust the measurement relationship on an analyser.", correct: "calibrator", explain: "This is a calibrator: its purpose is to establish/adjust the assay's response, not to monitor ongoing performance." },
  { id: "qc-1", text: "A stable control material intended for internal quality control, run at defined intervals specifically to monitor whether the analytical process remains in control.", correct: "qc-material", explain: "This is QC material: it monitors ongoing analytical performance rather than establishing the measurement relationship." },
  { id: "pt-1", text: "A blood sample collected from an individual for diagnostic testing and clinical decision-making.", correct: "patient-specimen", explain: "This is a patient specimen: real clinical material, never QC or calibration material." },
  { id: "qc-2", text: "A third-party, independent control material run alongside routine testing to check analytical stability over time.", correct: "qc-material", explain: "Still QC material — independence from the reagent/instrument manufacturer does not change its fundamental role." },
  { id: "cal-2", text: "A set of materials with assigned target values used during instrument setup to define the calibration curve.", correct: "calibrator", explain: "Calibration materials establish the measurement relationship; they are not used to monitor day-to-day performance." },
];

export const QC03_CLASSIFICATION_OPTIONS = [
  { key: "calibrator", label: "Calibrator" },
  { key: "qc-material", label: "QC material" },
  { key: "patient-specimen", label: "Patient specimen" },
];

/* Comparison cards — informational, not quiz items. */
export const QC03_COMPARISON_CARDS = [
  {
    title: "Assayed vs. unassayed control material",
    left: { label: "Assayed", text: "Manufacturer provides an assigned target value (and often an expected range) established through the manufacturer's own testing." },
    right: { label: "Unassayed", text: "No manufacturer target is provided; the laboratory must establish its own working statistics from its own data." },
    caution: "Assayed does not mean \u201cno local verification needed\u201d, and unassayed does not mean \u201cinferior\u201d \u2014 both require the laboratory to verify or establish statistics appropriate to its own method and conditions.",
  },
  {
    title: "Manufacturer vs. third-party (independent) control",
    left: { label: "Manufacturer control", text: "Supplied by the same manufacturer as the reagent/instrument system." },
    right: { label: "Third-party control", text: "Supplied independently of the reagent/instrument manufacturer." },
    caution: "Third-party material can offer useful independence, but it is not universally superior. Matrix behaviour, concentration coverage, stability, logistics, cost, and method suitability all matter for material selection.",
  },
  {
    title: "Multiple control levels",
    left: { label: "Single level", text: "A single control concentration demonstrates behaviour only near that concentration." },
    right: { label: "Multiple levels", text: "Low/mid/high levels provide information at different clinically relevant concentrations across the measuring range." },
    caution: "There is no universal mandatory number of levels for every test \u2014 the appropriate number depends on the test, its clinically relevant decision points, and laboratory procedure.",
  },
];

export const QC03_MATRIX_CAUTION =
  "Commutability \u2014 whether a control material behaves like a genuine patient specimen for a given method \u2014 is not automatic. " +
  "Do not assume commercial QC material is commutable merely because it is commercially available. At the same time, the absence of " +
  "established commutability data does not itself prove a material is noncommutable \u2014 it simply means commutability has not been established.";

/* Item 1 (QC-03 final independent-audit correction): handling/stability
   doctrine, taught explicitly rather than merely mentioned in passing.
   No universal temperature, stability period, or freeze/thaw limit is
   invented \u2014 the module defers to manufacturer instructions and
   local procedure, exactly as required. */
export const QC03_HANDLING_HEADING = "Handling is part of the control system";
export const QC03_HANDLING_FACTORS = [
  "storage conditions",
  "reconstitution",
  "mixing",
  "aliquoting",
  "open-vial stability",
  "freeze/thaw exposure where relevant",
  "contamination",
  "preparation timing",
];
export const QC03_HANDLING_DOCTRINE =
  "A QC material's observed behaviour can be influenced by how it is stored, reconstituted, mixed, aliquoted, its open-vial stability, " +
  "freeze/thaw exposure where relevant, contamination, and the timing of preparation relative to testing. Follow the control-material " +
  "manufacturer's instructions and the laboratory's validated local procedure \u2014 this module does not invent universal storage " +
  "temperatures, universal stability periods, or universal freeze/thaw limits, because none apply uniformly across all control materials.";
export const QC03_HANDLING_SYNTHETIC_EXAMPLE =
  "Synthetic teaching example (not universal manufacturer guidance): \u201cStore at 2\u20138\u00b0C; use reconstituted material within the " +
  "manufacturer-specified window; mix gently by inversion \u2014 do not vortex.\u201d Any real control material's actual instructions for " +
  "use must be followed instead of this illustrative example.";

/* -------------------------------------------------------------------------
   Station 2 — Establish the Statistics
   ------------------------------------------------------------------------- */

/* Deterministic synthetic establishment dataset (n=10) for one QC
   material/lot. Values chosen to produce a clean, illustrative mean. */
export const QC03_ESTABLISH_DATASET = [98, 99, 100, 101, 102, 99, 100, 101, 100, 100];
export const QC03_ESTABLISH_UNIT = "mg/dL (illustrative)";

export const QC03_ESTABLISH_NOTE =
  "The observation count in this exercise (n=10) is chosen for this teaching exercise and is not presented as a universal " +
  "laboratory requirement. Laboratory control statistics should be established or verified using representative data and an " +
  "appropriate documented procedure rather than adopted uncritically \u2014 manufacturer-assigned values may be useful starting/" +
  "reference information, but are not automatically the laboratory's own final statistics, nor should manufacturer SD simply " +
  "become the laboratory's permanent SD without evaluation.";

/* -------------------------------------------------------------------------
   Station 3 — Investigate Before Excluding
   ------------------------------------------------------------------------- */

/* The full dataset as originally recorded, INCLUDING the conspicuous
   observation (108). Nothing is auto-removed. */
export const QC03_OUTLIER_FULL_DATASET = [98, 99, 100, 101, 102, 99, 100, 101, 100, 100, 108];
/* The justified-exclusion dataset — identical to QC03_ESTABLISH_DATASET
   above (the same 10 genuine observations), revealed ONLY after the
   learner is shown the documented evidence below. */
export const QC03_OUTLIER_JUSTIFIED_DATASET = QC03_ESTABLISH_DATASET;

export const QC03_OUTLIER_CONSPICUOUS_VALUE = 108;

export const QC03_OUTLIER_CHOICES = [
  { key: "exclude-numeric", label: "Exclude the result because it is far from the mean", correct: false },
  { key: "keep-always", label: "Keep every value automatically \u2014 nothing may ever be excluded", correct: false },
  { key: "investigate", label: "Investigate whether a documented, nonrepresentative event occurred before deciding", correct: true },
];

export const QC03_OUTLIER_DOCUMENTED_EVIDENCE =
  "The technologist documented an incorrect reconstitution volume for that specific preparation (a recorded preparation error), " +
  "logged before the result was reviewed for exclusion.";

export const QC03_OUTLIER_JUSTIFICATION_STATEMENT =
  "The exclusion is justified by the documented preparation error, not by the numerical extremeness of the result. " +
  "Numerical extremeness alone is never sufficient justification for exclusion.";

/* -------------------------------------------------------------------------
   Station 4 — See What the SD Does
   ------------------------------------------------------------------------- */

/* A fixed set of FUTURE raw observations (independent of the establishment
   dataset above) — identical across all three SD scenarios below. Only
   the SD used to interpret them changes. */
export const QC03_SD_DEMO_MEAN = 100;
export const QC03_SD_DEMO_FUTURE_RAW = [99.5, 100.8, 99.2, 101.5, 100.1, 99.8, 100.6, 100.3];
export const QC03_SD_SCENARIOS = [
  { key: "representative", label: "Representative SD", sd: 1.1547 },
  { key: "too-wide", label: "Too-wide illustrative SD", sd: 3.0 },
  { key: "too-narrow", label: "Too-narrow illustrative SD", sd: 0.3 },
];

export const QC03_SD_EXPLANATION =
  "Changing the chart SD does not change the underlying measurement results \u2014 the eight future observations above are " +
  "identical in every scenario. It changes only the statistical scale used to interpret them. An excessively wide SD can make " +
  "a genuine change less conspicuous because the control scale is too broad; an unrealistically narrow SD can make ordinary " +
  "analytical variation generate excessive alarms. The goal of establishing SD is a representative estimate of routine " +
  "analytical variation \u2014 not simply choosing the widest or narrowest value.";

/* Item 2 (QC-03 final independent-audit correction): control-limit vs.
   APS distinction. This exact text must render for EVERY level
   (Beginner/Intermediate/Advanced/Expert) — never gated behind a
   level-specific branch — per the explicit "visible to every learner"
   requirement. */
export const QC03_CONTROL_LIMIT_VS_APS =
  "SD-based chart reference/control lines are not the same thing as an analytical performance specification (APS). " +
  "Crossing an SD line is not by itself a universal patient-result release rule.";

/* -------------------------------------------------------------------------
   Station 5 — New Lot, New Question
   ------------------------------------------------------------------------- */

export const QC03_OLD_LOT_DATASET = QC03_ESTABLISH_DATASET; // reuse: old lot statistics
/* New lot: same underlying pattern, deterministically shifted by +3 to
   represent a genuine (illustrative) control-material lot difference. */
export const QC03_NEW_LOT_DATASET = QC03_OLD_LOT_DATASET.map(v => v + 3);

export const QC03_LOT_CHOICES = [
  { key: "carry-forward", label: "Use the old lot's mean and SD unchanged forever", correct: false },
  { key: "assume-bias", label: "Immediately conclude the analyser has developed positive bias", correct: false },
  { key: "evaluate", label: "Evaluate the new lot, compare its behaviour, and establish/verify appropriate statistics before routine use", correct: true },
];

export const QC03_LOT_CONCLUSION =
  "A control-lot difference describes the control materials. By itself it does not establish equivalent bias in patient samples, " +
  "does not automatically indicate reagent failure, and does not automatically indicate a calibration problem.";

/* -------------------------------------------------------------------------
   Final Learning Check (6 questions) — a local, session-only learning
   check. Never described as certification or a competency examination.
   ------------------------------------------------------------------------- */
export const QC03_LEARNING_CHECK = [
  {
    id: "lc-1",
    prompt: "A calibrator and a QC material serve the same purpose and can be used interchangeably.",
    options: [{ key: "true", label: "True" }, { key: "false", label: "False" }],
    correct: "false",
    explain: "False. A calibrator establishes/adjusts the measurement relationship; QC material monitors ongoing analytical performance. They are not interchangeable.",
  },
  {
    id: "lc-2",
    prompt: "Manufacturer-assigned control statistics can always be adopted as the laboratory's own final statistics without any local evaluation.",
    options: [{ key: "true", label: "True" }, { key: "false", label: "False" }],
    correct: "false",
    explain: "False. Manufacturer values may be a useful starting/reference point, but laboratory statistics should be established or verified using the laboratory's own representative data and procedure.",
  },
  {
    id: "lc-3",
    prompt: "A result that looks numerically extreme may be excluded from control-statistics establishment for that reason alone.",
    options: [{ key: "true", label: "True" }, { key: "false", label: "False" }],
    correct: "false",
    explain: "False. Numerical extremeness alone is never sufficient justification. Exclusion requires an independently documented, nonrepresentative reason.",
  },
  {
    id: "lc-4",
    prompt: "An excessively wide control SD can make a genuine analytical change harder to detect.",
    options: [{ key: "true", label: "True" }, { key: "false", label: "False" }],
    correct: "true",
    explain: "True. A too-wide SD broadens the interpretive scale, potentially making genuine shifts less conspicuous against it.",
  },
  {
    id: "lc-5",
    prompt: "When a new QC material lot is introduced, the appropriate first step is to evaluate it and establish/verify its own statistics.",
    options: [{ key: "true", label: "True" }, { key: "false", label: "False" }],
    correct: "true",
    explain: "True. A new lot should be evaluated (e.g. via parallel comparison) and have appropriate statistics established/verified before routine use \u2014 old-lot statistics are not automatically carried forward.",
  },
  {
    id: "lc-6",
    prompt: "A shift in the QC material's lot mean, by itself, establishes bias in patient results.",
    options: [{ key: "true", label: "True" }, { key: "false", label: "False" }],
    correct: "false",
    explain: "False. A QC-material lot difference describes the control material. It does not, by itself, establish patient-result bias, reagent failure, or a calibration problem.",
  },
];

/* -------------------------------------------------------------------------
   Level-adaptive explanatory text (Section 19). All learners can access
   every station in full; only the explanatory framing text changes.
   ------------------------------------------------------------------------- */
export const QC03_LEVEL_TEXT = {
  beginner: {
    station1: "Focus on the core terms: calibrator, QC material, and patient specimen are three distinct things. Mean, SD, and CV are the three numbers you will use throughout this module.",
    station2: "Watch how mean, sample SD, and CV% are calculated from a real set of numbers \u2014 use \u201cShow calculation\u201d to see every step.",
    station3: "The key idea: never delete a value just because it looks unusual. There must be a documented reason.",
    station4: "See that the raw results don't change \u2014 only how \u201cwide\u201d or \u201cnarrow\u201d the interpreting scale is.",
    station5: "A new QC lot can have a different mean. That's expected \u2014 it doesn't mean something is wrong with your instrument.",
  },
  intermediate: {
    station1: "Beyond terminology, consider how assayed/unassayed status and manufacturer/third-party sourcing affect what you can assume about a material \u2014 and where caution about matrix effects is needed.",
    station2: "Interpret what the calculated mean, SD, and CV actually tell you about this specific lot's typical behaviour under your own conditions.",
    station3: "Practice the reasoning sequence: observe \u2192 investigate \u2192 find (or fail to find) a documented reason \u2192 only then decide on exclusion.",
    station4: "Consider how handling and preparation effects could contribute to whether an SD estimate is representative.",
    station5: "Compare the old and new lot statistics side-by-side and reason about what a parallel evaluation period is protecting you from.",
  },
  advanced: {
    station1: "Consider how material choice interacts with concentration coverage across the measuring range and with later chart/rule interpretation.",
    station2: "Consider how a poorly-estimated SD would propagate into every subsequent QC decision made using this lot's chart.",
    station3: "Distinguish investigation-then-exclusion from any automated statistical outlier-rejection procedure \u2014 this module deliberately uses neither Grubbs, Dixon, nor Tukey rules.",
    station4: "Connect this to your understanding that SD-based chart lines are not analytical performance specifications, and that a rule violation is not itself a root-cause finding.",
    station5: "Consider how a lot transition interacts with the investigation doctrine you will see again in QC-09: a QC signal is not the same as an established root cause.",
  },
  expert: {
    station1: "Consider the governance implications of material selection: independence from a single manufacturer, documented commutability status, and the limits of extrapolating QC-material behaviour to patient specimens.",
    station2: "Critique what would happen if this laboratory adopted manufacturer SD uncritically, or used too few/nonrepresentative observations to establish it.",
    station3: "Critique naive automatic-outlier-deletion practices and articulate why a documented, independent reason is the governing requirement \u2014 not a statistical threshold.",
    station4: "Consider the governance risk of an overly convenient (artificially narrow or wide) local SD chosen to reduce alarm burden or investigation workload.",
    station5: "Articulate why QC-material lot behaviour cannot be automatically extrapolated to patient-sample bias, and what independent evidence would be required to support such a claim.",
  },
};

/* Item 4 (QC-03 final independent-audit correction): the QC-03-specific
   glossary terms formerly declared here as an unused array have been
   merged directly into the authoritative application GLOSSARY in
   app/ui/app-data.js (Calibrator, Assayed control, Unassayed control,
   Third-party control, Control lot) so they are genuinely reachable
   through the real Glossary UI, per Option B. */
