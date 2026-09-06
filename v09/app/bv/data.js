import { EQA_RESULT_FIELDS } from "../eqa/data.js";

/* =========================================================================
   RECOVERY PROVENANCE NOTE (added during Stage 7B recovery):
   Artifact Class A — directly recovered from recovery/original-v0.8.html
   (SHA-256: e5317bf135f350b258428b985c1034a081e244a295f2e580c93cb6a6a091c8e4)
   Source lines: 10734-11301 (BV & RCV Lab static data section)
   Historical reported v0.8 commit: 3cc62b1 (not independently verified)
   Recovery date: 2026-09-01
   The block below is the unmodified source text from the HTML artifact.
   ========================================================================= */

/* =========================================================================
   BV & RCV Lab (QC-07) — v0.7 static teaching content: pathway, glossary,
   the BiologicalVariationEstimate data model, a small deterministic
   educational BV dataset, BIVAC/transportability conceptual content, the
   RI-vs-RCV signature cases, the CVA/CVI/CVG signature experiments, the
   APS-vs-RCV trap, and the Serial Result Challenge Bank. Calculation logic
   lives only in 27-bv-calc.js; this file holds structure and text
   consumed by the UI, in the same pattern as 20-investigation-data.js and
   24-eqa-data.js.
   ========================================================================= */

/* -------------------------------------------------------------------------
   Principal reasoning pathway and mandatory core teaching (spec header,
   sections 1, 4).
   ------------------------------------------------------------------------- */
export const BV_PATHWAY_STEPS = ["Understand variation", "Identify CVA/CVI/CVG", "Check data provenance", "Assess individuality", "Derive BV-based APS", "Select an RCV model", "Interpret serial change", "State limitations"];
export const BV_PATHWAY_CAUTION = "This is an educational reasoning pathway, not a rigid universal sequence — real interpretation of serial results may revisit earlier steps as new evidence (a repeat result, a preanalytical explanation, a provenance check) emerges.";

export const MANDATORY_LESSONS = [
  "A population reference interval and a reference change value answer different questions.",
  "A change exceeding an RCV is not automatically a pathological, clinically important, or treatment-requiring change."
];

/* -------------------------------------------------------------------------
   Symbol discipline (spec section 3). CVA/CVI/CVG only, in-engine and in
   all authored UI text; alternates are shown here ONLY as a glossary
   cross-reference for learners who encounter other notations elsewhere.
   ------------------------------------------------------------------------- */
export const BV_SYMBOL_GLOSSARY = [
  { symbol: "CVA", meaning: "Analytical coefficient of variation — imprecision of the measurement procedure itself.", alternatesSeenElsewhere: ["CVw (rare)"] },
  { symbol: "CVI", meaning: "Within-subject biological coefficient of variation — how much a single healthy person's own true concentration/activity varies over time, aside from analytical error.", alternatesSeenElsewhere: ["CVi", "CVw (ambiguous — avoid)"] },
  { symbol: "CVG", meaning: "Between-subject biological coefficient of variation — how much the average (homeostatic set point) differs from person to person across a population.", alternatesSeenElsewhere: ["CVb", "CVg", "CVp"] }
];
export const BV_SYMBOL_DISCIPLINE_NOTE = "This laboratory always writes CVA, CVI and CVG — never CVw/CVi/CVp or CVb/CVg interchangeably within a calculation or a worked example. The alternates above exist only so you recognise them in other sources; they are not used as working notation here.";

/* -------------------------------------------------------------------------
   "Which component answers which question?" persistent panel (spec
   section 4), including the mandatory CVG statement.
   ------------------------------------------------------------------------- */
export const COMPONENT_QUESTION_PANEL = [
  { component: "CVA", question: "How much does the measurement procedure itself add to the noise in a single result?" },
  { component: "CVI", question: "How much does this same person's own true value naturally move, tested repeatedly, apart from analytical noise? — the component that matters for interpreting a change in ONE person over time." },
  { component: "CVG", question: "How much does the population's average value differ from person to person? — the component that determines how useful a POPULATION reference interval is for THIS person." }
];
export const CVG_NOT_IN_RCV_STATEMENT = "CVG is not part of the RCV formula implemented here. This is presented as a deliberate teaching exercise: CVG shapes how informative a population reference interval is for an individual (via the index of individuality) and shapes the bias component of a biological-variation-derived APS, but it plays no role in deciding how large a change between two results from the SAME person needs to be before it is unlikely to be explained by analytical and within-subject noise alone.";

/* -------------------------------------------------------------------------
   Variation Foundations signature experiment (spec sections 5-6, 53-61) —
   described as "one of the strongest interactive teaching experiences in
   the entire module." Fixed CVA/CVI, three CVG steps; the UI computes
   live values via 27-bv-calc.js rather than hard-coding derived numbers
   here (only the inputs and the required correct-answer explanation are
   fixed content).
   ------------------------------------------------------------------------- */
export const CVG_SIGNATURE_EXPERIMENT = {
  fixedCva: 2,
  fixedCvi: 6,
  cvgSteps: [6, 12, 24],
  expectedIndexOfIndividuality: [1.0, 0.5, 0.25],
  question: "As CVG rises from 6% to 12% to 24% (CVA and CVI held constant), what happens to the classical RCV, and what happens to the index of individuality?",
  correctAnswer: "The classical RCV stays exactly the same at every CVG value. The index of individuality falls from 1.0, to 0.5, to 0.25.",
  explanation: "RCV is built only from CVA and CVI — it answers 'how much could this one person's own result plausibly move?' and has no dependency on how spread out the wider population is. The index of individuality (CVI/CVG) answers a different question — 'how useful is a population reference interval for this person?' — and it falls as CVG rises, because a wider population spread makes the shared population reference interval progressively less informative about this one individual, even though nothing about this person's own monitoring threshold has changed."
};

/* -------------------------------------------------------------------------
   BiologicalVariationEstimate data model (spec sections 7-16) — documented
   for teaching purposes, mirroring EQA_RESULT_FIELDS' "missing fields stay
   missing" convention. Every numeric BV value carried anywhere in this
   module traces back to a record shaped like this.
   ------------------------------------------------------------------------- */
export const BV_ESTIMATE_FIELDS = [
  { field: "id", def: "A unique identifier for this biological-variation estimate/record." },
  { field: "measurand", def: "The analyte or quantity the estimate applies to." },
  { field: "matrix", def: "The specimen matrix the estimate was derived from (e.g. serum, plasma, whole blood)." },
  { field: "population", def: "The population the estimate was derived from (e.g. healthy adults, a specific age range or cohort)." },
  { field: "healthStatus", def: "Whether the underlying subjects were healthy or had a stated condition — biological variation in disease can differ materially from variation in health." },
  { field: "samplingInterval", def: "How far apart samples were taken in the underlying study (e.g. weekly, daily) — a component estimated from widely-spaced samples answers a different question than one from closely-spaced samples." },
  { field: "studyTimeScale", def: "The overall duration the underlying study spanned." },
  { field: "cvi", def: "The estimated within-subject biological CV (%)." },
  { field: "cviCI", def: "The confidence interval stated for the CVI estimate, where available." },
  { field: "cvg", def: "The estimated between-subject biological CV (%)." },
  { field: "cvgCI", def: "The confidence interval stated for the CVG estimate, where available." },
  { field: "sourceType", def: "The kind of evidence behind this estimate (e.g. illustrative teaching value, literature-derived snapshot, single small study, subgroup-only, meta-analysis)." },
  { field: "sourceCitation", def: "The specific source and date this estimate is drawn from, where it is a literature-derived value." },
  { field: "bivacStatus", def: "What is known about this estimate's BIVAC (Biological Variation Data Critical Appraisal Checklist) status, taught conceptually only — never a computed score." },
  { field: "metaAnalysisStatus", def: "Whether this estimate reflects a single study or a pooled meta-analytic estimate." },
  { field: "databaseSnapshotDate", def: "The date this figure was current as of, where relevant — biological variation estimates are periodically revised as new studies appear." },
  { field: "notes", def: "Free-text context specific to this record." },
  { field: "transportabilityCautions", def: "Explicit statements about where this estimate may NOT safely transport (a different population, disease state, or sampling interval)." }
];
export const BV_MISSING_FIELDS_STAY_MISSING_NOTE = "Not every field is populated for every record. Where a property is not known or not stated, this application leaves it missing rather than inventing a plausible-looking value — and, critically, a missing CVA or CVG is never silently treated as zero.";
export const BV_ESTIMATES_NOT_CONSTANTS_NOTE = "Every CVA, CVI and CVG value in this laboratory is an ESTIMATE from a specific study or database snapshot, not a fixed physical constant. Estimates carry uncertainty, can be revised as new studies appear, and may not transport to every population, disease state, or sampling design.";

/* -------------------------------------------------------------------------
   EFLM Biological Variation Database — reference resource only (spec
   section 9). No live API call is ever made from this application.
   ------------------------------------------------------------------------- */
export const EFLM_BV_DATABASE_REFERENCE = {
  name: "EFLM Biological Variation Database",
  informs: "General awareness that a maintained, periodically updated public database of biological variation estimates exists, and roughly what kind of information it catalogues (CVI, CVG, quality/BIVAC-related notes) for many measurands.",
  doesNotEstablish: "No live query is ever made to the EFLM Biological Variation Database from this application, and no value shown anywhere in this laboratory is fetched from it at run time. Every numeric estimate used here is a small, fixed, deterministic teaching value authored into this build — the database improves access to biological variation estimates, but application of any specific estimate to a real patient or population still requires attention to the study's population, health status, sampling interval, and BIVAC-related quality context, which this application only teaches conceptually.",
  link: "https://biologicalvariation.eu/",
  linkLabel: "biologicalvariation.eu — EFLM Biological Variation Database"
};

/* -------------------------------------------------------------------------
   BIVAC — taught conceptually only (spec sections 11-13). 14 named quality
   items, described narratively; deliberately NOT a reproduction of the
   full checklist and NOT an automated scoring engine.
   ------------------------------------------------------------------------- */
export const BIVAC_QUALITY_ITEMS = [
  "Study subjects: number, health status and selection criteria clearly described",
  "Sample size justification or power consideration stated",
  "Exclusion of subjects with conditions known to affect the analyte",
  "Steady-state / analyte stability over the study period considered",
  "Standardised sample collection conditions (time, posture, fasting status, etc.)",
  "Appropriate, stated sampling interval for the analyte and question being asked",
  "Appropriate number of samples per subject",
  "Appropriate number of replicate measurements",
  "Samples analysed in a single analytical run/batch where relevant, to control CVA",
  "Analytical method and its imprecision (CVA) reported",
  "Outlier detection method stated and applied consistently",
  "Statistical (e.g. ANOVA-based) method for deriving CVI/CVG stated",
  "Confidence intervals reported for the CVI/CVG estimates",
  "Data and methodology reported with enough detail for independent appraisal"
];
export const BIVAC_TEACHING_NOTE = "BIVAC (the Biological Variation Data Critical Appraisal Checklist) is taught here only as a concept: a structured way to ask how trustworthy a published biological-variation study is. This application does not reproduce the full checklist's exact wording, does not implement an automated rating engine, and never assigns a BIVAC grade to any dataset value on its own — any bivacStatus text shown is a short descriptive note, not a computed score.";
export const BIVAC_MISCONCEPTION_EXERCISE = {
  narrative: "Study 1 reports CVI = 4.2% for an analyte. Study 2 reports CVI = 3.1% for the same analyte.",
  question: "Does the smaller reported number (Study 2, 3.1%) automatically mean it is the more reliable estimate?",
  correctAnswer: "No.",
  explanation: "A numerically smaller CVI is not automatically a better or more trustworthy estimate. A smaller value can just as easily result from a smaller, less carefully controlled study, an inappropriate sampling interval, inadequately excluded confounders, or a narrower/healthier subject group — exactly the properties BIVAC is designed to appraise. Comparing two BV estimates requires comparing their underlying study quality, not just the size of the reported number."
};

/* -------------------------------------------------------------------------
   Transportability (spec sections 14-16). A healthy-population guardrail
   and a time-scale/sampling-interval guardrail, both mandatory.
   ------------------------------------------------------------------------- */
export const TRANSPORTABILITY_HEALTHY_POPULATION_GUARDRAIL = "A CVI or CVG estimated in healthy volunteers does not automatically transport to a population with the disease or condition being monitored — biological variation itself can differ between health and disease.";
export const TRANSPORTABILITY_TIME_SCALE_GUARDRAIL = "A CVI or CVG estimated from samples collected at one sampling interval (e.g. weekly, over several months) does not automatically transport to a very different clinical sampling interval (e.g. hourly, or years apart) — some analytes show biological rhythms or long-term drift that a mismatched sampling interval will not have captured.";
export const BIOLOGICAL_RHYTHMS_NOTE = "Many analytes show biological rhythms (for example, circadian variation across a day, or longer menstrual or seasonal cycles). These rhythms are taught here conceptually only — this application does not model or correct for any specific rhythm, and a biological-variation estimate that does not account for a relevant rhythm may understate or misrepresent true within-subject variation for samples collected at rhythm-sensitive times.";

/* -------------------------------------------------------------------------
   Index of Individuality heuristic bands — display labels only; the
   calculation and exact boundary semantics live in 27-bv-calc.js.
   ------------------------------------------------------------------------- */
export const II_HEURISTIC_CAUTION = "Conventional interpretive heuristic — not a biological law and not a universal clinical cutoff. It describes how useful a shared population reference interval is likely to be for monitoring an individual, nothing more.";

/* -------------------------------------------------------------------------
   RI-vs-RCV signature cases (spec sections 17-24). Exact fixed values.
   Both cases deliberately reuse the standard CVA=2%, CVI=6% teaching pair
   (classical bidirectional-95 RCV = 17.53077294359835%) so the same RCV
   threshold is visible working in two different reference-interval
   contexts. RI status and RCV status are always rendered as two
   independent indicators, never merged into one status.
   ------------------------------------------------------------------------- */
export const RI_VS_RCV_SIGNATURE_CASES = {
  cva: 2,
  cvi: 6,
  zConventionId: "bidirectional-95",
  referenceInterval: { low: 70, high: 110, units: "arbitrary units (illustrative)" },
  caseA: {
    id: "ri-vs-rcv-case-a",
    previousResult: 80,
    currentResult: 100,
    narrative: "Both the previous result (80) and the current result (100) fall inside the reference interval (70-110).",
    question: "Given that both results sit inside the reference interval, can a change this large (+25%) still be an unusually large change for this one person, worth noting?",
    correctAnswer: "Yes.",
    explanation: "The relative change here is +25%, which exceeds this analyte's classical RCV of about 17.5% for the supplied CVA and CVI. A result can move by more than its RCV while both values remain comfortably inside a population reference interval — the reference interval describes where most healthy people's results fall, while the RCV describes how much THIS person's own result plausibly moves. They are independent pieces of information."
  },
  caseB: {
    id: "ri-vs-rcv-case-b",
    previousResult: 112,
    currentResult: 114,
    narrative: "Both the previous result (112) and the current result (114) fall outside the reference interval (70-110).",
    question: "Given that both results sit outside the reference interval, does the small further change between them (~+1.79%) exceed this analyte's RCV?",
    correctAnswer: "No.",
    explanation: "The relative change here is only about +1.79%, well below this analyte's classical RCV of about 17.5%. Being outside the reference interval and exceeding the RCV are separate questions — a result can sit outside the reference interval yet change by an amount fully compatible with ordinary analytical and within-subject noise."
  }
};

/* -------------------------------------------------------------------------
   APS vs RCV — critical distinction panel and the CVA-substitution trap
   (spec sections 30-32).
   ------------------------------------------------------------------------- */
export const APS_VS_RCV_DISTINCTION_PANEL = [
  { question: "What does a BV-derived APS answer?", answer: "How precise and how unbiased should this MEASUREMENT PROCEDURE be, as a design/performance target for the method and the laboratory?" },
  { question: "What does an RCV answer?", answer: "How much does a result from ONE PERSON need to move, between two time points, before it is unlikely to be explained by analytical and within-subject noise alone?" },
  { question: "Can a desirable-APS CVA be substituted into an RCV calculation instead of the laboratory's actual CVA?", answer: "No — doing so silently assumes the method is already performing at its target, which may not be true." }
];
export const CVA_SUBSTITUTION_TRAP_CASE = {
  id: "aps-target-substituted-incorrectly",
  cvi: 6,
  desirableApsCva: 3,
  actualLabCva: 5,
  narrative: "For this analyte, CVI = 6%. The desirable BV-derived APS for imprecision works out to a target CVA of 3%. This laboratory's actual, currently demonstrated CVA is 5%.",
  question: "Which CVA should be used to calculate this laboratory's RCV — the 3% desirable-APS target, or the 5% actual demonstrated CVA?",
  correctAnswer: "The actual demonstrated CVA (5%).",
  explanation: "An RCV describes what this laboratory's results can actually distinguish today, using its actual analytical performance — not the performance it aspires to reach. Substituting the APS target CVA (3%) for the real CVA (5%) would understate the RCV and could make a change look more informative than the laboratory's current analytical performance actually supports. This application's RCV functions never call or reuse the APS functions' output — the two calculations are kept structurally separate for exactly this reason."
};

/* -------------------------------------------------------------------------
   RCV is not a diagnostic cutoff (spec section 56) — mandatory persistent
   statement, and preanalytical trap scenario (spec section 58).
   ------------------------------------------------------------------------- */
export const RCV_NOT_DIAGNOSTIC_CUTOFF_STATEMENT = "A reference change value is a statistical threshold about the size of change that ordinary analytical and within-subject variation can plausibly produce — it is not a diagnostic cutoff, and exceeding it does not, by itself, make a change clinically important.";

export const PREANALYTICAL_TRAP_SCENARIO = {
  id: "preanalytical-confounding",
  narrative: "A patient's morning cortisol sample is drawn at 07:00 on the first visit and at 16:00 on the second visit. The relative change between the two results exceeds the analyte's classical RCV.",
  question: "Does this exceeded RCV, on its own, indicate a genuine change in this patient's underlying physiology?",
  correctAnswer: "No, not on its own.",
  explanation: "Cortisol shows a pronounced circadian rhythm; the two samples were drawn roughly nine hours apart at very different points in that rhythm. The RCV used here assumes variation of the kind captured by the underlying CVI estimate, not a large preanalytical/timing confound of this size. Before concluding anything about the patient, the mismatched collection times need to be considered and, where possible, controlled for by comparing samples collected at similar times of day."
};

/* -------------------------------------------------------------------------
   Transportability scenarios (spec sections 60-61): disease-population and
   sampling-interval mismatch.
   ------------------------------------------------------------------------- */
export const DISEASE_POPULATION_TRANSPORTABILITY_SCENARIO = {
  id: "healthy-bv-to-disease",
  narrative: "A CVI of 6% for this analyte was estimated from a study of healthy adult volunteers. A clinician wants to use this CVI to interpret serial results in a patient with an active flare of a chronic inflammatory condition known to affect this analyte.",
  question: "Can the healthy-population CVI be applied to this patient's monitoring without qualification?",
  correctAnswer: "No, not without qualification.",
  explanation: "Biological variation estimated in healthy volunteers does not automatically describe variation during active disease, where the analyte's regulation, and therefore its natural fluctuation, may differ. The healthy-population estimate is still useful context, but it should be applied with an explicit caution about this mismatch rather than treated as directly transportable."
};
export const SAMPLING_INTERVAL_TRANSPORTABILITY_SCENARIO = {
  id: "sampling-interval-mismatch",
  narrative: "A CVI for this analyte was estimated from samples collected once weekly over several months. A clinician wants to interpret two results collected four hours apart during an acute inpatient admission.",
  question: "Does the weekly-interval CVI directly describe the variation expected between two results four hours apart?",
  correctAnswer: "No, not directly.",
  explanation: "A CVI estimated from widely spaced samples reflects longer-term within-subject fluctuation and may not capture short-term (hour-scale) variation, which can be smaller, larger, or governed by a different physiological process (e.g. a rhythm or an acute response). Using a mismatched-interval CVI to judge a very differently-spaced pair of results is a transportability error, not a calculation error."
};

/* -------------------------------------------------------------------------
   Small deterministic educational BV dataset (spec section 62) — 8
   measurands, each illustrating a DIFFERENT evidence situation. Every
   record is explicitly labelled with its sourceType; the one
   literature-derived snapshot is deliberately narrow in scope with an
   explicit non-generalisation caution (spec: EuBIVAS thyroid example).
   ------------------------------------------------------------------------- */
export const BV_DATASET = [
  {
    id: "bv-1", measurand: "Illustrative Analyte A (general teaching default)", matrix: "serum", population: "healthy adults (illustrative)",
    healthStatus: "healthy", samplingInterval: "illustrative (unspecified)", studyTimeScale: "illustrative (unspecified)",
    cva: 2, cvi: 6, cviCI: null, cvg: 12, cvgCI: null,
    sourceType: "illustrative-teaching-value", sourceCitation: null, bivacStatus: "Not applicable — illustrative value, not drawn from a real study.",
    metaAnalysisStatus: null, databaseSnapshotDate: null,
    notes: "The general-purpose worked example used throughout this module's fixed exercises (Index of Individuality = 0.5; classical bidirectional RCV ≈ 17.53%).",
    transportabilityCautions: ["Illustrative teaching value — do not use for any real patient or population decision."]
  },
  {
    id: "bv-2", measurand: "Illustrative Analyte B (marked individuality)", matrix: "serum", population: "healthy adults (illustrative)",
    healthStatus: "healthy", samplingInterval: "illustrative (unspecified)", studyTimeScale: "illustrative (unspecified)",
    cva: 2, cvi: 3, cviCI: null, cvg: 15, cvgCI: null,
    sourceType: "illustrative-teaching-value", sourceCitation: null, bivacStatus: "Not applicable — illustrative value.",
    metaAnalysisStatus: null, databaseSnapshotDate: null,
    notes: "Index of individuality = 0.2 (marked individuality) — a population reference interval is a comparatively poor tool for this illustrative analyte; serial, person-specific monitoring is comparatively more informative.",
    transportabilityCautions: ["Illustrative teaching value — do not use for any real patient or population decision."]
  },
  {
    id: "bv-3", measurand: "Illustrative Analyte C (low individuality)", matrix: "serum", population: "healthy adults (illustrative)",
    healthStatus: "healthy", samplingInterval: "illustrative (unspecified)", studyTimeScale: "illustrative (unspecified)",
    cva: 2, cvi: 15, cviCI: null, cvg: 8, cvgCI: null,
    sourceType: "illustrative-teaching-value", sourceCitation: null, bivacStatus: "Not applicable — illustrative value.",
    metaAnalysisStatus: null, databaseSnapshotDate: null,
    notes: "Index of individuality = 1.875 (low individuality) — a population reference interval is comparatively more informative for this illustrative analyte, because within-subject variation is large relative to between-subject variation.",
    transportabilityCautions: ["Illustrative teaching value — do not use for any real patient or population decision."]
  },
  {
    id: "bv-4", measurand: "Thyroid stimulating hormone (TSH)", matrix: "serum", population: "healthy European volunteers (EuBIVAS)",
    healthStatus: "healthy", samplingInterval: "weekly", studyTimeScale: "approximately 10 weeks",
    cva: null, cvi: 19, cviCI: "approximate — see primary source", cvg: 20, cvgCI: "approximate — see primary source",
    sourceType: "literature-derived-snapshot", sourceCitation: "Karlović Đurković M, et al. European Biological Variation Study (EuBIVAS): within- and between-subject biological variation estimates for serum thyroid biomarkers. Clin Chem Lab Med. 2021 (DOI 10.1515/cclm-2020-1885).",
    bivacStatus: "Reported as part of the EuBIVAS design, which was constructed to follow BIVAC-style methodological principles (standardised weekly sampling, stated subject criteria).",
    metaAnalysisStatus: "single-study-within-a-coordinated-multi-centre-design", databaseSnapshotDate: "2021 publication",
    notes: "Figures here are rounded, order-of-magnitude approximations of the published EuBIVAS thyroid estimates for TSH, intended only to illustrate what a literature-derived snapshot looks like. Confirm exact current figures against the primary source or the EFLM Biological Variation Database before any real use.",
    transportabilityCautions: ["This estimate is specific to TSH and must not be generalised to other thyroid measurands (e.g. free T4, free T3) or to other analytes.", "Derived from healthy volunteers — see the healthy-population transportability guardrail before applying to patients with thyroid disease."]
  },
  {
    id: "bv-5", measurand: "Illustrative Analyte D (CVG not available)", matrix: "plasma", population: "healthy adults (illustrative)",
    healthStatus: "healthy", samplingInterval: "illustrative (unspecified)", studyTimeScale: "illustrative (unspecified)",
    cva: 2.5, cvi: 8, cviCI: null, cvg: null, cvgCI: null,
    sourceType: "illustrative-teaching-value", sourceCitation: null, bivacStatus: "Not applicable — illustrative value.",
    metaAnalysisStatus: null, databaseSnapshotDate: null,
    notes: "CVG is deliberately not supplied for this record. The classical and log-normal RCV remain fully computable from CVA and CVI alone; the index of individuality and the bias component of a BV-derived APS are NOT computable without CVG.",
    transportabilityCautions: ["Illustrative teaching value — do not use for any real patient or population decision."]
  },
  {
    id: "bv-6", measurand: "Illustrative Analyte E (CVA not available)", matrix: "serum", population: "healthy adults (illustrative)",
    healthStatus: "healthy", samplingInterval: "illustrative (unspecified)", studyTimeScale: "illustrative (unspecified)",
    cva: null, cvi: 7, cviCI: null, cvg: 10, cvgCI: null,
    sourceType: "illustrative-teaching-value", sourceCitation: null, bivacStatus: "Not applicable — illustrative value.",
    metaAnalysisStatus: null, databaseSnapshotDate: null,
    notes: "CVA is deliberately not supplied for this record. This application never assumes a missing CVA is zero; the RCV screen instead reports that analytical-variation information is insufficient unless an illustrative CVA is explicitly and visibly selected by the learner.",
    transportabilityCautions: ["Illustrative teaching value — do not use for any real patient or population decision."]
  },
  {
    id: "bv-7", measurand: "Illustrative Analyte F (limited evidence)", matrix: "serum", population: "a single small cohort (illustrative)",
    healthStatus: "healthy", samplingInterval: "illustrative (unspecified)", studyTimeScale: "short (illustrative)",
    cva: 3, cvi: 11, cviCI: "wide — small sample size", cvg: 18, cvgCI: "wide — small sample size",
    sourceType: "single-small-study", sourceCitation: null, bivacStatus: "Not appraised in detail here; flagged as limited evidence due to small sample size and wide confidence intervals.",
    metaAnalysisStatus: "single-small-study-not-pooled", databaseSnapshotDate: null,
    notes: "Presented as an example of limited BV evidence: a single small study with wide confidence intervals around both CVI and CVG. The point values are usable for teaching, but should be treated with more caution than a pooled, well-replicated estimate.",
    transportabilityCautions: ["Illustrative teaching value standing in for a real limited-evidence situation — do not use for any real patient or population decision."]
  },
  {
    id: "bv-8", measurand: "Illustrative Analyte G (subgroup records, no pooled global estimate)", matrix: "serum", population: "several distinct subgroups studied separately (illustrative)",
    healthStatus: "healthy", samplingInterval: "varies by subgroup study", studyTimeScale: "varies by subgroup study",
    cva: 2, cvi: null, cviCI: null, cvg: null, cvgCI: null,
    sourceType: "subgroup-records-no-global-pooled-estimate", sourceCitation: null, bivacStatus: "Individual subgroup records exist; no pooled/global estimate has been derived across them here.",
    metaAnalysisStatus: "not-pooled", databaseSnapshotDate: null,
    notes: "This record demonstrates a database that HAS entries for this analyte (several subgroup-specific studies exist) but has NO single global CVI/CVG estimate suitable for general use — a real and important state to recognise, not an error to hide.",
    transportabilityCautions: ["No global estimate is available to transport anywhere; a subgroup-specific figure would need its own separate transportability check before use."]
  }
];

/* -------------------------------------------------------------------------
   Provenance Card requirement (spec section 63) — the fields always shown
   together whenever a BV estimate is displayed anywhere in this module.
   ------------------------------------------------------------------------- */
export const PROVENANCE_CARD_FIELDS = ["measurand", "population", "healthStatus", "samplingInterval", "sourceType", "sourceCitation", "bivacStatus", "transportabilityCautions"];

/* -------------------------------------------------------------------------
   Level-adapted explanatory content (spec sections 94-96). Every level has
   access to the same modules; only depth/framing changes.
   ------------------------------------------------------------------------- */
export const BV_LEVEL_EXPLANATION = {
  beginner: "Every result you have ever produced already has some natural wobble built in — even in a perfectly healthy, perfectly stable person, tested with a perfect instrument. Biological variation is the study of how big that wobble usually is, so you can tell an ordinary wobble apart from a change worth a second look.",
  intermediate: "CVA, CVI and CVG separate three different sources of spread in a result: the method, the person's own natural fluctuation, and the difference between people. Each answers a different downstream question — imprecision/bias targets, reference-interval usefulness, or how much a serial change should move before it stands out.",
  advanced: "Biological-variation components feed two largely independent downstream models here: analytical performance specifications (which depend on CVI, and on CVG only for the bias term) and reference change values (which depend on CVA and CVI only). Keeping these dependency chains explicit prevents a common error — assuming a component that helps one model must also help the other.",
  expert: "Treat every CVA/CVI/CVG figure as an estimate with provenance, confidence, and a domain of applicability, not a constant. The interpretive value of any downstream RCV, APS or index-of-individuality figure is bounded by the weakest link in that provenance chain — population match, sampling-interval match, health-status match, and BIVAC-relevant study quality — not by the arithmetic, which is exact once the inputs are trusted."
};

/* -------------------------------------------------------------------------
   Serial Result Challenge Bank (spec sections 67-84). 14 required cases
   plus 2 optional cases = 16 total. Each case carries a `distribution`
   tag array so the required minimums (spec section 84) can be verified
   programmatically (see test-bv.js).
   ------------------------------------------------------------------------- */
export const SERIAL_RESULT_CHALLENGE_CASES = [
  {
    id: "case-ri-vs-rcv-inside",
    answerKind: "yes-no",
    title: "Inside the reference interval, but a large change",
    distribution: ["ri-vs-rcv"],
    cva: 2, cvi: 6, zConventionId: "bidirectional-95",
    referenceInterval: { low: 70, high: 110 },
    previousResult: 80, currentResult: 100,
    narrative: "Both results (80 and 100) fall inside the reference interval (70-110).",
    question: "Is this change (+25%) unusually large for this person, even though both results are inside the reference interval?",
    correctAnswer: "yes",
    explanation: "The change (+25%) exceeds the classical RCV (~17.5%) for this CVA/CVI pair. Reference-interval status and RCV status are independent questions."
  },
  {
    id: "case-ri-vs-rcv-outside",
    answerKind: "yes-no",
    title: "Outside the reference interval, but a small change",
    distribution: ["ri-vs-rcv"],
    cva: 2, cvi: 6, zConventionId: "bidirectional-95",
    referenceInterval: { low: 70, high: 110 },
    previousResult: 112, currentResult: 114,
    narrative: "Both results (112 and 114) fall outside the reference interval (70-110).",
    question: "Does this small further change (~+1.79%) exceed this analyte's RCV?",
    correctAnswer: "no",
    explanation: "The change (~+1.79%) is well below the classical RCV (~17.5%). Being outside the reference interval does not mean every subsequent change is analytically meaningful."
  },
  {
    id: "case-analytical-imprecision-matters",
    answerKind: "yes-no",
    title: "A worse CVA changes the answer",
    distribution: ["cva-cvi-cvg-distinction"],
    cva: 6, cvi: 6, zConventionId: "bidirectional-95",
    previousResult: 100, currentResult: 118,
    narrative: "Same CVI (6%) as the standard example, but this method's actual CVA is 6% rather than 2%.",
    question: "Using the classical model with the ACTUAL CVA (6%), does an observed change of +18% exceed the RCV?",
    correctAnswer: "no",
    explanation: "With CVA=6%, CVI=6%, the classical bidirectional RCV rises to roughly 23.5% — larger than with the sharper CVA=2% method. A less precise method needs a bigger change before that change stands out from analytical noise; +18% no longer exceeds this wider threshold."
  },
  {
    id: "case-cvg-does-not-belong-in-rcv",
    answerKind: "cvg-formula",
    title: "CVG does not belong in the RCV formula",
    distribution: ["cva-cvi-cvg-distinction", "missing-component"],
    cva: 2, cvi: 6, cvg: 12, zConventionId: "bidirectional-95",
    previousResult: 100, currentResult: 120,
    narrative: "CVA=2%, CVI=6%, CVG=12%. A distractor answer proposes an incorrect formula: RCV = z×√2×√(CVA²+CVI²+CVG²), which would give a much larger threshold (~37.6%) than the correct classical formula (~17.5%).",
    question: "Which RCV threshold is correct: the one that includes CVG (~37.6%), or the one that excludes it (~17.5%)?",
    correctAnswer: "excludes-cvg",
    explanation: "The correct classical RCV formula uses only CVA and CVI: RCV = z×√2×√(CVA²+CVI²) ≈ 17.5%. Including CVG is a common but incorrect formula — CVG describes between-person spread, which is irrelevant to how much ONE person's own result can plausibly move."
  },
  {
    id: "case-cvg-changes-ii-not-rcv",
    answerKind: "rcv-ii-cvg",
    title: "CVG changes the index of individuality, not the RCV",
    distribution: ["cva-cvi-cvg-distinction"],
    cva: 2, cvi: 6, zConventionId: "bidirectional-95",
    cvgScenarioValues: [6, 12, 24],
    narrative: "CVA and CVI are held fixed at 2% and 6%. CVG is varied across 6%, 12% and 24%.",
    question: "As CVG rises across these three values, what happens to the RCV, and what happens to the index of individuality?",
    correctAnswer: "rcv-unchanged-ii-falls",
    explanation: "The RCV stays fixed at ~17.5% throughout, because CVG has no term in the RCV formula. The index of individuality falls from 1.0, to 0.5, to 0.25, because it is defined as CVI/CVG."
  },
  {
    id: "case-aps-target-substituted-incorrectly",
    answerKind: "aps-cva-trap",
    title: "Do not substitute the APS target CVA for the real one",
    distribution: ["aps-vs-rcv-trap"],
    cvi: 6, desirableApsCva: 3, actualLabCva: 5, zConventionId: "bidirectional-95",
    narrative: "CVI = 6%. The desirable BV-derived APS target CVA is 3%. This laboratory's actual demonstrated CVA is 5%.",
    question: "Which CVA should be used to compute this laboratory's RCV?",
    correctAnswer: "actual-cva",
    explanation: "The RCV should reflect what the laboratory can actually distinguish today (CVA=5%), not the performance it aspires to (CVA=3%). Substituting the APS target would understate the RCV."
  },
  {
    id: "case-healthy-to-disease",
    answerKind: "yes-no",
    title: "A healthy-population CVI in an active disease flare",
    distribution: ["provenance-transportability"],
    narrative: "A CVI of 6% was estimated in healthy volunteers. A clinician wants to apply it to a patient with an active flare of a condition known to affect this analyte's regulation.",
    question: "Can the healthy-population CVI be applied without qualification?",
    correctAnswer: "no",
    explanation: "Biological variation in active disease can differ from variation in health. The healthy-population estimate does not automatically transport to this patient's situation."
  },
  {
    id: "case-sampling-interval-mismatch",
    answerKind: "yes-no",
    title: "Weekly-interval CVI applied to an hours-apart pair",
    distribution: ["provenance-transportability"],
    narrative: "A CVI was estimated from samples collected weekly over several months. Two results in an acute inpatient are four hours apart.",
    question: "Does the weekly-interval CVI directly describe variation over four hours?",
    correctAnswer: "no",
    explanation: "A CVI from widely spaced samples reflects longer-term fluctuation and may not capture short-term, rhythm-driven, or acute-response variation on a different time scale."
  },
  {
    id: "case-preanalytical-confounding",
    answerKind: "yes-no",
    title: "A circadian confound, not a physiological change",
    distribution: ["preanalytical"],
    narrative: "Morning cortisol drawn at 07:00, then a second sample drawn at 16:00, shows a change exceeding the classical RCV.",
    question: "Does this exceeded RCV, on its own, indicate a genuine physiological change?",
    correctAnswer: "no",
    explanation: "Cortisol has a pronounced circadian rhythm. Samples drawn at very different times of day are not a fair RCV comparison until the timing mismatch is accounted for."
  },
  {
    id: "case-classical-vs-lognormal",
    answerKind: "classical-lognormal",
    title: "Classical and log-normal RCV can disagree at the margin",
    distribution: ["log-normal"],
    cva: 2, cvi: 6, zConventionId: "bidirectional-95",
    previousResult: 100, currentResult: 118.5,
    narrative: "CVA=2%, CVI=6%. Observed change +18.5%.",
    question: "Does +18.5% exceed the classical RCV (~17.53%) and the log-normal increase limit (~19.14%)?",
    correctAnswer: "classical-only",
    explanation: "+18.5% exceeds the classical symmetric RCV (~17.53%) but does not exceed the log-normal increase limit (~19.14%). Neither model is universally correct — they rest on different distributional assumptions, and this is a genuine example of them disagreeing at the margin."
  },
  {
    id: "case-missing-cvg",
    answerKind: "missing-scope",
    title: "CVG is not available",
    distribution: ["insufficient-information", "missing-component"],
    cva: 2.5, cvi: 8, cvg: null,
    narrative: "CVA=2.5%, CVI=8%. CVG is not available for this record.",
    question: "Which of the following remain computable: the classical/log-normal RCV, the index of individuality, the imprecision APS, the bias APS?",
    correctAnswer: "rcv-and-imprecision-aps-only",
    explanation: "RCV needs only CVA and CVI, so it remains fully computable. Imprecision APS needs only CVI, so it remains computable. The index of individuality and the bias APS both need CVG, so both are NOT computable — and CVG is never assumed to be zero."
  },
  {
    id: "case-missing-cva",
    answerKind: "yes-no",
    title: "CVA is not available",
    distribution: ["insufficient-information", "missing-component"],
    cva: null, cvi: 7, cvg: 10,
    narrative: "CVI=7%, CVG=10%. CVA is not available for this record.",
    question: "Can the RCV be calculated without knowing CVA?",
    correctAnswer: "no",
    explanation: "This application does not silently assume a missing CVA is zero. Without a stated or explicitly-selected illustrative CVA, the RCV is reported as not computable due to insufficient analytical-variation information."
  },
  {
    id: "case-limited-bv-evidence",
    answerKind: "yes-no",
    title: "A single small study with wide confidence intervals",
    distribution: ["provenance-transportability", "insufficient-information"],
    cva: 3, cvi: 11, cvg: 18,
    narrative: "The only available CVI/CVG estimates come from a single small study with wide confidence intervals.",
    question: "Should this estimate be treated with the same confidence as a large, well-replicated pooled estimate?",
    correctAnswer: "no",
    explanation: "A single small study with wide confidence intervals is legitimate teaching data but weaker evidence than a well-replicated, appropriately appraised pooled estimate — the numeric answer can still be calculated, but the evidentiary confidence behind it is lower."
  },
  {
    id: "case-database-no-global-estimate",
    answerKind: "yes-no",
    title: "Records exist, but no global estimate",
    distribution: ["provenance-transportability", "insufficient-information"],
    narrative: "Several subgroup-specific studies exist for this analyte, but none has been pooled into a single global CVI/CVG estimate.",
    question: "Is it appropriate to pick one subgroup's figures and present them as the general estimate for this analyte?",
    correctAnswer: "no",
    explanation: "A database having SOME records for an analyte is not the same as having an appropriate GLOBAL estimate. Presenting one subgroup's figures as if they were general would misrepresent the evidence — the honest answer here is that no suitable global estimate is currently available."
  },
  {
    id: "case-method-improves",
    answerKind: "yes-no",
    title: "Optional: an improved method changes the RCV",
    distribution: ["cva-cvi-cvg-distinction"],
    cva: 1, cvi: 6, zConventionId: "bidirectional-95",
    previousResult: 100, currentResult: 113,
    narrative: "The laboratory adopts a more precise method, reducing CVA from 2% to 1% (CVI unchanged at 6%).",
    question: "With the improved method, does a +13% change exceed the new classical RCV (~16.86%)?",
    correctAnswer: "no",
    explanation: "Even a change that would have exceeded the RCV under a less precise method may not exceed it under a more precise one — improving CVA lowers the RCV threshold only slightly here because CVI already dominates the combined variation."
  },
  {
    id: "case-different-patient-context",
    answerKind: "yes-no",
    title: "Optional: the same numbers, a different patient context",
    distribution: ["provenance-transportability"],
    cva: 2, cvi: 6, zConventionId: "bidirectional-95",
    previousResult: 100, currentResult: 120,
    narrative: "The same +20% change and the same CVA/CVI pair used earlier now occurs in a patient population where this analyte's biological variation has not been separately re-estimated.",
    question: "Does re-using the same healthy-population RCV threshold across every patient context require any caveat?",
    correctAnswer: "yes",
    explanation: "Even when the arithmetic is unchanged, applying an RCV derived in one population/context to a different patient context is a transportability decision, not merely a calculation — it should be flagged as an assumption rather than passed over silently."
  }
];

/* -------------------------------------------------------------------------
   Workflow questions A-H (spec sections 85-88). Reused verbatim across
   every challenge case's guided walkthrough; scoring is reported across
   five separately-named reasoning dimensions and confidence remains
   metacognitive only.
   ------------------------------------------------------------------------- */
export const BV_WORKFLOW_QUESTIONS = [
  { id: "A", prompt: "What does the population reference interval tell you here, and what does it NOT tell you?" },
  { id: "B", prompt: "Which BV components (CVA/CVI/CVG) are actually available for this case, and which are missing?" },
  { id: "C", prompt: "Is the index of individuality computable here, and if so, what does it say about how useful the reference interval is for this person?" },
  { id: "D", prompt: "Which RCV model (classical or log-normal) are you selecting, and why?" },
  { id: "E", prompt: "What is the calculated RCV threshold, and does the observed change exceed it?" },
  { id: "F", prompt: "Are there any provenance or transportability cautions that apply before trusting this result (population, health status, sampling interval, timing)?" },
  { id: "G", prompt: "What can you responsibly conclude from this case, in language that avoids clinical-significance claims?" },
  { id: "H", prompt: "What is your confidence in this conclusion?" }
];
export const BV_REASONING_DIMENSIONS = ["Component identification", "Provenance & transportability judgement", "Model selection", "Threshold interpretation", "Guarded conclusion language"];
export const BV_CONFIDENCE_NEVER_ALTERS_SCORE_NOTE = "Confidence (question H) is recorded and reflected in feedback tone only — it never changes the score for any of the five reasoning dimensions above, exactly as the confidence-calibration pattern already used elsewhere in this application (see the Pattern Challenge Lab).";

