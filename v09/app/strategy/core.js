import { calcSigma } from "../core/statistics.js";

/* =========================================================================
   QC Strategy Lab — procedure model, procedure library, Sigma-guided
   mapping framework(s) with explicit provenance, and deterministic
   exercise / challenge data. Calculation logic (Sigma, Ped/Pfr) lives in
   src/core/statistics.js and src/opchar/functions.js; this file holds
   structure and static teaching content only.

   PROVENANCE: Class A — directly recovered from recovery/original-v0.8.html
   (SHA-256: e5317bf135f350b258428b985c1034a081e244a295f2e580c93cb6a6a091c8e4)
   Source lines: ~4052-4090 (MILAN_MODELS/OTHER_SPEC_SOURCES)
                 ~4284-4676 (QC Strategy Lab scientific/data layer)
   Historical reported v0.8 commit: 3cc62b1 (not independently verified)
   Recovery date: 2026-08-31

   ARCHITECTURAL NOTE: The original standalone HTML assembles all modules
   into one file. In this recovered modular project, Sigma is calculated by
   importing calcSigma from src/core/statistics.js rather than duplicating
   the formula here — this is architectural deduplication with no
   scientific-behaviour change. The Sigma formula and invariants remain
   identical to INVAR-05 in SCIENTIFIC_INVARIANTS.md.
   ========================================================================= */

/* -------------------------------------------------------------------------
   APS framework: Milan Models and other specification sources
   ------------------------------------------------------------------------- */
export const MILAN_MODELS = [
  {
    id: "clinical-outcome",
    number: 1,
    name: "Model 1 — Based on clinical outcome",
    description: "The performance requirement is derived from studies (direct outcome studies, simulation, or biological-variation-linked outcome data) that connect a level of analytical performance to a specific clinical decision or patient outcome.",
    applicabilityNote: "Most directly relevant where a clear, well-studied link exists between an analyte's analytical error and a defined clinical decision (for example a treatment threshold). Such direct evidence is not available for every measurand."
  },
  {
    id: "biological-variation",
    number: 2,
    name: "Model 2 — Based on biological variation",
    description: "The performance requirement is derived from the within-subject and between-subject components of an analyte's biological variation, using established formulae to set allowable imprecision, bias and total error.",
    applicabilityNote: "Widely usable where high-quality biological variation data exist, but the resulting requirement reflects statistical variation, not a directly demonstrated clinical outcome — a distinction worth keeping explicit."
  },
  {
    id: "state-of-the-art",
    number: 3,
    name: "Model 3 — Based on state of the art",
    description: "The performance requirement is derived from what current, well-run methods and laboratories can actually achieve, for example from EQA/PT scheme data or multicentre performance surveys.",
    applicabilityNote: "Useful as a practical benchmark, and often the only option available, but a state-of-the-art specification describes current capability — it does not by itself establish that this level of performance is clinically sufficient or insufficient."
  }
];

export const MILAN_HIERARCHY_CAUTION = "These three models are not a simple ranking in which one automatically overrides another. Which model is most appropriate depends on the measurand, the clinical use of the result, the strength of available evidence, and the specific context — a state-of-the-art specification can be the right choice for one analyte while a biological-variation-based specification is more appropriate for another.";

export const OTHER_SPEC_SOURCES = [
  { id: "regulatory", label: "Regulatory requirements", description: "Performance limits set by a national or regional regulatory body, often as a minimum acceptable standard tied to licensure or accreditation rather than a clinical-outcome derivation." },
  { id: "eqa-pt", label: "Proficiency-testing / EQA criteria", description: "Acceptability limits used by an external quality assessment scheme to grade participant performance — practical and widely used, but scheme-specific and not necessarily identical to a laboratory's own internal requirement." },
  { id: "professional-guideline", label: "Professional guidelines", description: "Recommendations published by a professional or scientific society, which may in turn draw on any of the three Milan models, on consensus opinion, or on a mixture of both." },
  { id: "manufacturer-claim", label: "Manufacturer claims", description: "Performance characteristics reported by the instrument or reagent manufacturer, typically under specific validation conditions that may not match every laboratory's own operating conditions." },
  { id: "local-quality-goal", label: "Local validated quality objectives", description: "A requirement a laboratory sets for itself, informed by its own validation data, patient population and clinical relationships with its users." }
];

/* -------------------------------------------------------------------------
   QC Procedure object model (spec section 13; N/R semantics corrected in
   v0.3.2 — see spec v0.3.2 sections 1, 5).
   N: number of control measurements AVAILABLE PER ANALYTICAL RUN for
   application of the QC procedure (e.g. two control materials measured
   once each per run = N=2; two materials measured in duplicate = N=4).
   R: number of consecutive analytical runs whose QC observations
   participate in evaluation of a sequential rule.
   N and R have no assumed meaning outside this application's stated
   teaching configuration. N is NEVER the total number of observations
   accumulated across all R runs — that total (where a sequential rule
   spans more than one run) is the DERIVED quantity N * R, computed by
   sequentialObservationCapacity() below and never stored as N itself.
   ------------------------------------------------------------------------- */
export function makeProcedure(id, name, ruleIds, N, R, controlLevels, interpretation, provenance) {
  return { id, name, ruleIds, N, R, controlLevels, interpretation, provenance };
}

/* Derived, never stored: the number of sequential control observations
   available to a consecutive-observation rule under this procedure's
   stated N (per-run measurements) and R (consecutive runs) configuration.
   Spec v0.3.2 section 5: "Do not store the derived product as N." */
export function sequentialObservationCapacity(procedure) {
  if (!procedure || typeof procedure.N !== "number" || typeof procedure.R !== "number") return null;
  return procedure.N * procedure.R;
}

export const PROCEDURE_LIBRARY = [
  makeProcedure(
    "A", "Procedure A — 1₃s only", ["13s"], 2, 1, 2,
    "A minimal procedure: only the 1₃s rejection rule is applied, using 2 control measurements (one per level) within a single run.",
    "Independently authored teaching example. The 1₃s-only pairing is conceptually informed by widely published statistical-QC and Sigma-guided QC literature; it is not a reproduction of a specific vendor's proprietary procedure."
  ),
  makeProcedure(
    "B", "Procedure B — 1₃s / 2₂s / R₄s", ["13s", "22s", "r4s"], 2, 1, 2,
    "A moderate multirule procedure combining 1₃s, 2₂s and R₄s, using 2 control measurements (one per level) within a single run.",
    "Independently authored teaching example, conceptually informed by widely published multirule QC literature; not a reproduction of a specific vendor's proprietary procedure."
  ),
  makeProcedure(
    "C", "Procedure C — 1₃s / 2₂s / R₄s / 4₁s", ["13s", "22s", "r4s", "41s"], 2, 2, 2,
    "A more sensitive multirule procedure adding 4₁s. In this application's stated 2-control-level configuration: N = 2 control measurements per run (one per level), R = 2 consecutive runs — up to N × R = 4 sequential observations (both materials, 2 runs) are available to 4₁s in this application's stated configuration.",
    "Independently authored teaching example, conceptually informed by widely published multirule QC literature; not a reproduction of a specific vendor's proprietary procedure."
  ),
  makeProcedure(
    "D", "Procedure D — 1₃s / 2₂s / R₄s / 4₁s / 8x", ["13s", "22s", "r4s", "41s", "8x"], 2, 4, 2,
    "A more intensive multirule strategy adding a same-side consecutive-run rule (8x) to the Procedure C rule set. In this application's stated 2-control-level configuration, 8x is evaluated using both control materials on the same side of the mean across 4 consecutive runs: N = 2 control measurements per run (one per level), R = 4 consecutive runs — sequential observations inspected = N × R = 8. This is one of several valid 8x configurations (any N and R whose product is 8): the Rule Laboratory's \"Learn the Rules\" 8x demonstration instead uses the within-one-material form (N = 1 control measurement per run for that single material, R = 8 consecutive runs; N × R = 8) purely to show the rule mathematically on a single-material chart — that specific demonstration configuration is NOT the configuration used by this Sigma-mapping Procedure D. This procedure uses the across-materials, N=2/R=4 form only, and does not mix it with either alternative.",
    "Independently authored teaching example. This procedure implements and validates a dedicated 8x detector (see 07-rules.js and the Rule Laboratory's \"Learn the Rules\" 8x entry) rather than substituting the previously-validated 10x rule for it — 8x and 10x are related same-side rules but are not mathematically identical and carry different N×R implications; 10x remains a separate, independently validated rule taught in the Rule Laboratory and is not used in this procedure. The cited framework describes this <4-Sigma same-side rule generically; this application implements it using a two-control-per-run, four-run configuration (N=2, R=4). The cited source material also describes an alternative four-control-per-run, two-run configuration (N=4, R=2) that likewise yields N×R=8 sequential observations; this application does not implement that alternative, and the two configurations (N=2,R=4 vs N=4,R=2) are not presented as identical operational configurations merely because both total 8 — they may differ in QC burden (measurements per run) and effective QC frequency (runs between decisions)."
  )
];

export function getProcedure(id) { return PROCEDURE_LIBRARY.find(p => p.id === id) || null; }

/* -------------------------------------------------------------------------
   Sigma-guided QC mapping framework(s) (spec sections 15-17, 36-39).
   Exactly ONE framework is implemented in v0.3, with full provenance
   metadata attached to every automated suggestion (section 37). Boundary
   semantics are explicit and documented (section 36): each band's lower
   bound is INCLUSIVE (Sigma >= threshold), never ">".
   ------------------------------------------------------------------------- */
export const SIGMA_MAPPING_FRAMEWORKS = [
  {
    id: "westgard-sigma-rules-simplified",
    frameworkName: "Simplified published Sigma Rules educational framework",
    frameworkSource: "Westgard QC — \"Westgard Sigma Rules\" (educational lesson)",
    frameworkLink: "https://www.westgard.com/lessons/westgard-rules/westgard-rules/westgard-sigma-rules.html",
    frameworkVersionOrDate: "Undated web lesson, accessed 2026",
    assumptions: [
      "Bands are adapted here to this application's standard 2-control-level, per-run configuration (N=2 control measurements per run); the source material also describes alternative N/R pairings for the same-side <4-Sigma rule (for example N=4 control measurements per run across R=2 runs, versus this application's N=2 across R=4 runs — both give N×R=8 sequential observations, but are not identical operational configurations) and a separate 3-control-level table, neither of which is reproduced verbatim here.",
      "Band boundaries are treated as Sigma >= lower bound (inclusive) — for example the top band applies at Sigma exactly 6.00 and above, not only above 6.00. See \"boundaryProvenance\" below: this specific inclusive convention is this application's own implementation choice, not a verbatim mathematical inequality quoted from the source.",
      "The source material's <4-Sigma band references an 8x same-side rule; this application implements and validates a dedicated 8x detector for this mapping (see Procedure D provenance and the Rule Laboratory). 10x is a separate, independently validated same-side rule also taught in the Rule Laboratory, but it is not substituted for 8x in this Sigma-framework implementation.",
      "This mapping is one established approach to QC planning, not the only scientifically valid one, and is presented as belonging specifically to this named framework — not as a universal rule."
    ],
    bands: [
      { minSigma: 6, maxSigma: Infinity, procedureId: "A", label: "Sigma ≥ 6" },
      { minSigma: 5, maxSigma: 6, procedureId: "B", label: "5 ≤ Sigma < 6" },
      { minSigma: 4, maxSigma: 5, procedureId: "C", label: "4 ≤ Sigma < 5" },
      { minSigma: -Infinity, maxSigma: 4, procedureId: "D", label: "Sigma < 4" }
    ],
    boundaryProvenance: [
      { threshold: 6, status: "application-convention", note: "The cited source describes \"6 Sigma or higher\" as a performance band; this application's choice to treat Sigma >= 6.00 (inclusive) as the boundary is its own implementation convention, not a literal inequality stated by the source." },
      { threshold: 5, status: "application-convention", note: "The cited source describes a \"5 to 6 Sigma\" band; this application's choice to treat Sigma >= 5.00 (inclusive) as the boundary is its own implementation convention, not a literal inequality stated by the source." },
      { threshold: 4, status: "application-convention", note: "The cited source describes a \"4 to 5 Sigma\" band; this application's choice to treat Sigma >= 4.00 (inclusive) as the boundary is its own implementation convention, not a literal inequality stated by the source." }
    ]
  }
];

export function getFramework(id) { return SIGMA_MAPPING_FRAMEWORKS.find(f => f.id === id) || null; }

/* mapSigmaToProcedure — returns full provenance every time (never a bare
   procedure id), per spec section 37: "the mapping logic must not be
   hidden inside the UI." */
export function mapSigmaToProcedure(sigmaValue, frameworkId) {
  const framework = getFramework(frameworkId || SIGMA_MAPPING_FRAMEWORKS[0].id);
  if (!framework || typeof sigmaValue !== "number" || !isFinite(sigmaValue)) {
    return { framework, band: null, procedure: null };
  }
  const band = framework.bands.find(b => sigmaValue >= b.minSigma && sigmaValue < b.maxSigma) || null;
  const procedure = band ? getProcedure(band.procedureId) : null;
  return { framework, band, procedure };
}

/* "Why did the application suggest this procedure?" — the mandatory
   provenance disclosure text shown alongside every automated suggestion. */
export function frameworkWhyText(mapping) {
  if (!mapping || !mapping.framework || !mapping.band || !mapping.procedure) {
    return "No candidate procedure is suggested because Sigma could not be calculated from the information given.";
  }
  return "Within the selected " + mapping.framework.frameworkName + " (source: " + mapping.framework.frameworkSource + "), a Sigma value in the range " + mapping.band.label + " maps to " + mapping.procedure.name + ". This is a mapping that belongs to this specific published framework, not a universal statement about what Sigma " + (mapping.band.label) + " \"requires.\"";
}

export const NO_UNIVERSAL_RULE_NOTE = "This application never states that a given Sigma value universally requires a specific rule set. Every automated suggestion is phrased as belonging to a named, cited framework — for example \"within the selected published educational framework, this Sigma range maps to …\" — never as \"Sigma 4 always requires 4₁s.\"";

export const NO_TRAFFIC_LIGHT_SIGMA_NOTE = "This application does not use a universal red/yellow/green Sigma quality scale. Where a specific published framework defines its own performance categories, they are shown as belonging to that framework, never as a universal pass/fail judgement.";

/* Ped/Pfr framing text (spec sections 11-12). */
export const PED_DEFINITION = "Probability of Error Detection (Ped): the probability that a QC procedure will detect a defined, medically important analytical error, if that error is actually present.";
export const PFR_DEFINITION = "Probability of False Rejection (Pfr): the probability that a stable, in-control analytical process will be rejected by the QC procedure anyway, purely by chance.";
export const PED_PFR_TRADEOFF_NOTE = "These two probabilities trade off against each other: a more aggressive QC procedure (more rules, more control measurements) generally improves error detection (higher Ped) but also tends to increase the chance of rejecting a run that was never actually wrong (higher Pfr). Neither number is good or bad in isolation — the trade-off has to be weighed against the consequences of a missed error versus the cost of an unnecessary rejection.";
export const OPCHAR_SCOPE_NOTE = "For scientific-integrity reasons, this application only calculates validated Ped/Pfr numbers for the single 1₃s rule applied on its own (a closed-form result derivable from standard normal-distribution theory). For every multirule or sequential procedure — including any procedure containing 8x or 10x — exact Ped/Pfr requires dedicated joint statistical modelling that has not been independently validated in this build, so the application displays \"Not numerically implemented in this version\" rather than a fabricated, summed, or Sigma-inferred number.";

/* Source-dependence exercise (sections 9-10). */
export const SOURCE_DEPENDENCE_EXERCISE = {
  bias: 2, cv: 2,
  specs: [
    { id: "A", label: "Specification A", tea: 10 },
    { id: "B", label: "Specification B", tea: 6 }
  ],
  question: "Which Sigma value is the \"real\" Sigma for this method?",
  correctAnswer: "Both calculations can be mathematically valid. Interpretation depends on whether the selected analytical specification is scientifically appropriate for the intended use — Sigma is not an immutable characteristic of the analyser itself."
};

/* CV improvement exercise (section 24). */
export const CV_IMPROVEMENT_EXERCISE = {
  tea: 10, bias: 2, cvSteps: [3, 2, 1.5],
  question: "What laboratory improvement produced this change in Sigma?",
  correctAnswer: "Improved precision (a reduction in CV%).",
  teachingNote: "Bias and the analytical requirement were both held constant — only imprecision changed, and Sigma rose as a direct result."
};

/* Bias improvement exercise (section 25). */
export const BIAS_IMPROVEMENT_EXERCISE = {
  tea: 10, cv: 2, biasSteps: [6, 4, 2],
  question: "What laboratory improvement produced this change in Sigma?",
  correctAnswer: "Reduced bias.",
  teachingNote: "Reducing bias and reducing imprecision are different analytical improvement pathways — improving one does not automatically improve the other, and a laboratory needs to know which one is limiting performance before choosing where to invest improvement effort."
};

/* APS-change exercise (section 26). */
export const APS_CHANGE_EXERCISE = {
  bias: 2, cv: 2, teaSteps: [16, 10, 6],
  question: "Did the analytical method improve or deteriorate as Sigma changed here?",
  correctAnswer: "No — the method did not change at all. Only the selected performance requirement (TEa) changed.",
  teachingNote: "Bias and CV were held fixed throughout. Whenever a strategy appears to become more or less demanding without any change in bias or CV, look first at whether the analytical requirement itself changed."
};

/* "Why not use every rule?" exercise (section 22). */
export const WHY_NOT_ALL_RULES_EXERCISE = {
  scenario: "A method has excellent analytical performance (Sigma well above 6).",
  optionA: { id: "aggressive", label: "Apply a very intensive multirule procedure (e.g. Procedure D) regardless of Sigma." },
  optionB: { id: "adequate", label: "Apply a simpler procedure with adequate intended error detection for this performance level (e.g. Procedure A)." },
  question: "Why might applying every available QC rule be undesirable here, even though it sounds like the \"safest\" choice?",
  correctOption: "adequate",
  teachingPoints: [
    "Unnecessary false rejection of runs that were never actually wrong.",
    "Repeated QC testing to resolve those false rejections, consuming control material.",
    "Delayed reporting of patient results while an unnecessary investigation is carried out.",
    "Unnecessary troubleshooting effort spent chasing problems that do not exist."
  ],
  caution: "The goal is not to minimise QC for its own sake. The goal is appropriate detection with an acceptable level of false rejection and risk control — a procedure sized to the method's actual performance."
};

/* "Why not use only 1_3s?" exercise (section 23). */
export const WHY_NOT_ONLY_13S_EXERCISE = {
  scenario: "A method has lower analytical performance (Sigma below 4).",
  question: "What is the limitation of relying on a minimal procedure (1₃s only) here?",
  correctAnswer: "A minimal single-rule procedure is less capable of detecting smaller, but still medically important, systematic errors — its detection power (Ped) is lower for the size of error this method is actually at risk of producing.",
  connectPoints: [
    "Method capability: a lower-Sigma method is more likely to produce clinically important errors of a size that a minimal rule may miss.",
    "Performance requirement: the same absolute error is a larger fraction of what this method's own requirement allows.",
    "Error-detection needs: the QC procedure has to be sized to the error the method can realistically produce, not chosen independently of it."
  ]
};

/* Very-low-Sigma guardrail (section 28). */
export const VERY_LOW_SIGMA_THRESHOLD = 3;
export const VERY_LOW_SIGMA_WARNING = "Intensifying QC does not correct poor method performance. Investigation and improvement of the measurement procedure may be necessary.";

export const RUN_FREQUENCY_NOTE = "A QC procedure (which rules, how many control measurements) and QC frequency (how often QC is run, i.e. how many patient results sit between QC events) are separate, interacting design decisions. A laboratory can have a well-chosen statistical rule set and still have an inappropriate QC frequency for its clinical risk. This application teaches the concept but does not build a QC-frequency calculator in this version; see CLSI C24 and contemporary risk-based internal QC (IQC) literature for the fuller model. One analytical run is not automatically equivalent to one calendar day — its definition depends on the analytical system and the laboratory's own QC strategy.";

export const PATIENT_RISK_PREVIEW_NOTE = "If an analytical failure begins immediately after a successful QC event, the number of patient samples potentially affected before the next QC event depends on how long the interval to that next QC event is — a longer interval between QC events means more patient results could be affected by an undetected failure. This application shows only this simple conceptual timeline in v0.3. It does not calculate MaxE(Nuf), a patient-risk Sigma, or a risk-adjusted run size — those belong to a later version.";

/* -------------------------------------------------------------------------
   Strategy Challenge Bank — 10 deterministic cases (section 27), each
   pre-computed and cross-checked against calcSigma() and
   mapSigmaToProcedure() while authoring this file (never hand-typed
   without verification).
   ------------------------------------------------------------------------- */
export const STRATEGY_CHALLENGE_CASES = [
  {
    id: 1, title: "Case 1 — High Sigma",
    scenarioNote: "A well-established, high-performing method.",
    tea: 10, bias: 1, cv: 1,
    primaryLimitationCorrect: "both",
    correctProcedureIds: ["A"],
    processImprovementPreferable: false,
    why: "At this performance level, a minimal procedure (1₃s only) already provides adequate error detection for the stated requirement.",
    moreIntensiveImprove: "A more intensive procedure could detect even smaller errors, but there is little clinical benefit to doing so here.",
    moreIntensiveCost: "More rules and more control measurements would mainly add false rejections and QC workload without a meaningful gain in patient safety.",
    qcCannotFix: "No QC procedure can substitute for maintaining this level of analytical performance going forward.",
    outsideModel: "QC frequency and patient-risk modelling are not evaluated by this exercise."
  },
  {
    id: 2, title: "Case 2 — Moderate Sigma",
    scenarioNote: "A moderately performing method with a somewhat demanding requirement.",
    tea: 12, bias: 1, cv: 2,
    primaryLimitationCorrect: "imprecision",
    correctProcedureIds: ["B"],
    processImprovementPreferable: false,
    why: "A moderate multirule procedure (1₃s/2₂s/R₄s) matches this performance level within the selected framework.",
    moreIntensiveImprove: "Adding 4₁s (Procedure C) could improve detection of smaller sustained shifts.",
    moreIntensiveCost: "The added sensitivity comes with more control measurements and a higher chance of false rejection than is needed here.",
    qcCannotFix: "QC cannot compensate for imprecision beyond what the procedure is designed to detect within an acceptable false-rejection rate.",
    outsideModel: "QC frequency and patient-risk modelling are not evaluated by this exercise."
  },
  {
    id: 3, title: "Case 3 — Lower Sigma requiring more intensive QC",
    scenarioNote: "A method whose performance is closer to the boundary of what the requirement allows.",
    tea: 10, bias: 2, cv: 1.9,
    primaryLimitationCorrect: "both",
    correctProcedureIds: ["C"],
    processImprovementPreferable: true,
    why: "This Sigma level falls within the band that maps to the more sensitive Procedure C (adding 4₁s) within the selected framework.",
    moreIntensiveImprove: "Procedure D would add further sensitivity to small sustained shifts.",
    moreIntensiveCost: "Procedure D's extra sensitivity would come at a higher false-rejection burden than Procedure C for a method at this Sigma level.",
    qcCannotFix: "QC cannot correct the underlying bias and imprecision that put this method in a lower Sigma band in the first place.",
    outsideModel: "QC frequency and patient-risk modelling are not evaluated by this exercise."
  },
  {
    id: 4, title: "Case 4 — Very low Sigma",
    scenarioNote: "A method performing well below the stated requirement.",
    tea: 10, bias: 3, cv: 2.8,
    primaryLimitationCorrect: "both",
    correctProcedureIds: ["D"],
    processImprovementPreferable: true,
    veryLowSigmaWarning: true,
    why: "Even the most intensive procedure in this library (Procedure D) is offered only as the most sensitive statistical option available here — not as a fix for the underlying performance problem.",
    moreIntensiveImprove: "No further rule intensification is offered in this library; more elaborate multirule schemes exist in the wider literature but carry steeply rising false-rejection burdens at this Sigma level.",
    moreIntensiveCost: "Very intensive QC at this Sigma level would generate frequent false rejections, repeated troubleshooting and delayed reporting, without addressing the root performance problem.",
    qcCannotFix: "Statistical QC intensification alone does not correct poor method performance.",
    outsideModel: "QC frequency and patient-risk modelling are not evaluated by this exercise."
  },
  {
    id: 5, title: "Case 5 — Excellent CV, excessive bias",
    scenarioNote: "A very precise method that is nonetheless off-target.",
    tea: 10, bias: 7, cv: 0.5,
    primaryLimitationCorrect: "bias",
    correctProcedureIds: ["A"],
    processImprovementPreferable: true,
    why: "The overall Sigma is high enough to map to the minimal Procedure A within the selected framework, but that is because imprecision is extremely small — it does not mean bias is unimportant.",
    moreIntensiveImprove: "A more intensive statistical QC procedure would not detect a stable bias any better — bias, by definition, is a consistent displacement that a well-controlled process reproduces run after run.",
    moreIntensiveCost: "There is little to be gained from more QC rules here; the real opportunity is investigating and correcting the source of the bias (e.g. calibration).",
    qcCannotFix: "Routine QC procedures are not designed to diagnose or correct a known systematic bias — that requires investigation of the measurement procedure itself.",
    outsideModel: "QC frequency and patient-risk modelling are not evaluated by this exercise."
  },
  {
    id: 6, title: "Case 6 — Low bias, excessive CV",
    scenarioNote: "A well-centred method with poor reproducibility.",
    tea: 10, bias: 0.5, cv: 3,
    primaryLimitationCorrect: "imprecision",
    correctProcedureIds: ["D"],
    processImprovementPreferable: true,
    why: "This Sigma level falls below 4 within the selected framework, mapping to the most intensive procedure in this library.",
    moreIntensiveImprove: "No further rule intensification is offered in this library.",
    moreIntensiveCost: "At this Sigma level, even Procedure D carries a meaningfully higher false-rejection burden than the simpler procedures.",
    qcCannotFix: "QC cannot substitute for improving the method's precision (e.g. maintenance, reagent handling, technique).",
    outsideModel: "QC frequency and patient-risk modelling are not evaluated by this exercise."
  },
  {
    id: 7, title: "Case 7 — Same method, two specifications",
    scenarioNote: "Bias = 2%, CV = 2% throughout — only the selected specification changes.",
    tea: null, bias: 2, cv: 2,
    dualSpecs: [{ label: "Specification A", tea: 10 }, { label: "Specification B", tea: 16 }],
    primaryLimitationCorrect: "both",
    correctProcedureIds: ["C", "A"],
    processImprovementPreferable: false,
    why: "Specification A (TEa 10%) gives Sigma 4, mapping to Procedure C; Specification B (TEa 16%) gives Sigma 7, mapping to Procedure A. Both are mathematically valid outputs of the same method — the appropriate strategy depends on which specification is scientifically appropriate for the intended clinical use, not on the method having changed.",
    moreIntensiveImprove: "Neither answer is more \"correct\" mathematically; the deciding factor is choosing the right specification for the intended use.",
    moreIntensiveCost: "Choosing the more demanding specification's strategy (Procedure C) when the less demanding one is actually appropriate would add unnecessary QC burden.",
    qcCannotFix: "No QC procedure resolves the underlying question of which analytical performance specification is the scientifically appropriate one — that judgement has to be made first.",
    outsideModel: "QC frequency and patient-risk modelling are not evaluated by this exercise."
  },
  {
    id: 8, title: "Case 8 — Unnecessarily aggressive QC",
    scenarioNote: "A well-performing method. The tempting but excessive choice is Procedure D.",
    tea: 14, bias: 1, cv: 2,
    primaryLimitationCorrect: "imprecision",
    correctProcedureIds: ["A"],
    tempting: "D",
    processImprovementPreferable: false,
    why: "Sigma here is well above 6, mapping to the minimal Procedure A within the selected framework — Procedure D would be considerably more intensive than this performance level calls for.",
    moreIntensiveImprove: "Procedure D would detect somewhat smaller errors, but there is little clinical need to do so at this Sigma level.",
    moreIntensiveCost: "Procedure D's five rules and larger sequential run window (R=4, versus R=1 for Procedure A) would generate materially more false rejections, repeated testing and delayed reporting than Procedure A, for no meaningful gain here.",
    qcCannotFix: "QC intensity is not itself a safety margin — oversized QC has its own real operational costs.",
    outsideModel: "QC frequency and patient-risk modelling are not evaluated by this exercise."
  },
  {
    id: 9, title: "Case 9 — Insufficiently sensitive QC",
    scenarioNote: "A lower-performing method. The tempting but inadequate choice is Procedure A.",
    tea: 9, bias: 2, cv: 2,
    primaryLimitationCorrect: "both",
    correctProcedureIds: ["D"],
    tempting: "A",
    processImprovementPreferable: true,
    why: "Sigma here is below 4, mapping to the most intensive procedure in this library — Procedure A (1₃s only) would be too insensitive to reliably catch the size of error this method can produce.",
    moreIntensiveImprove: "No further rule intensification is offered in this library.",
    moreIntensiveCost: "Procedure D carries a higher false-rejection burden than Procedure A, which is an accepted trade-off given the method's performance.",
    qcCannotFix: "Even the most intensive procedure offered here is not a substitute for improving the underlying method performance.",
    outsideModel: "QC frequency and patient-risk modelling are not evaluated by this exercise."
  },
  {
    id: 10, title: "Case 10 — Insufficient information",
    scenarioNote: "Only bias is known; imprecision (CV) has not been supplied.",
    tea: 10, bias: 2, cv: null,
    primaryLimitationCorrect: "insufficient",
    correctProcedureIds: [],
    processImprovementPreferable: null,
    why: "Sigma cannot be calculated, and no QC strategy should be selected, without both a bias estimate and an imprecision (CV) estimate alongside a stated requirement.",
    moreIntensiveImprove: "Not applicable until the missing performance data is obtained.",
    moreIntensiveCost: "Not applicable until the missing performance data is obtained.",
    qcCannotFix: "No QC procedure choice is more \"correct\" than another when the underlying performance data needed to choose is simply missing.",
    outsideModel: "QC frequency and patient-risk modelling are not evaluated by this exercise."
  }
];

export const STRATEGY_LIMITATION_OPTIONS = [
  { id: "bias", label: "Bias" },
  { id: "imprecision", label: "Imprecision (CV)" },
  { id: "both", label: "Both" },
  { id: "insufficient", label: "Neither / insufficient information" }
];

export const EDUCATIONAL_STRATEGY_DISCLAIMER = "This educational strategy is generated from simplified teaching assumptions and must not replace local validation, applicable requirements, method-specific risk assessment or laboratory professional judgement.";

/* v0.3.2 section 6: user-facing "What do N and R mean?" teaching note. */
export const N_AND_R_TEACHING_NOTE = "N is the number of control measurements available in each analytical run for application of the QC procedure. R is the number of consecutive runs considered when a sequential rule extends across runs. Therefore an 8x procedure can, for example, use N=2 and R=4 (two control measurements per run, over four runs) or N=4 and R=2 (four control measurements per run, over two runs) — both make N × R = 8 sequential observations available, but they are not identical configurations: they can differ in QC burden per run and in effective QC frequency. N is not the same thing as \"number of control levels\": two control materials measured once each per run gives N=2, but two control materials measured in duplicate per run gives N=4. An analytical run is not universally equivalent to a calendar day or shift — R describes a count of analytical runs, not a fixed time interval.";

