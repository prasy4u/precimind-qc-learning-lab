import { ped1_3s, pfr1_3s } from "../opchar/functions.js";

/* =========================================================================
   Risk & Frequency Lab — v0.4 static teaching content, definitions and
   deterministic challenge data. Calculation logic lives only in
   src/opchar/functions.js and src/risk/detection-delay.js; this file holds
   structure and text consumed by the UI, in the same pattern as
   src/strategy/core.js.

   PROVENANCE: Class A — directly recovered from recovery/original-v0.8.html
   (SHA-256: e5317bf135f350b258428b985c1034a081e244a295f2e580c93cb6a6a091c8e4)
   Source lines: ~5499-5870 (Risk & Frequency Lab static data section)
   Historical reported v0.8 commit: 3cc62b1 (not independently verified)
   Recovery date: 2026-08-31
   ========================================================================= */

/* -------------------------------------------------------------------------
   Core educational distinction (spec v0.4 section 2): QC procedure vs QC
   event vs QC frequency vs analytical run, and the three mandatory
   "do not imply" cautions.
   ------------------------------------------------------------------------- */
export const QC_PROCEDURE_DEFINITION = "QC procedure: the statistical rules, number of control measurements (N), and associated configuration used at a QC event.";
export const QC_EVENT_DEFINITION = "QC event: an occurrence in which one or more QC measurements are made and the QC procedure is evaluated.";
export const QC_FREQUENCY_DEFINITION = "QC frequency: how frequently QC events occur. For continuous-production systems, this may be expressed educationally as the number of patient samples between QC events, or as \"run size\", where applicable.";
export const ANALYTICAL_RUN_V4_DEFINITION = "Analytical run: the configured interval or group over which the QC decision framework applies.";

export const CORE_DISTINCTION_CAUTIONS = [
  "Do not imply that a run is universally equivalent to a calendar day or shift.",
  "Do not imply that run size is the same thing as N (the number of QC measurements per event).",
  "Do not imply that QC frequency is the same thing as R (the number of consecutive runs a sequential rule looks back across)."
];

/* -------------------------------------------------------------------------
   N, R and M (spec v0.4 sections 3-4). N and R retain their v0.3.2
   meaning exactly; M is a new, separate variable introduced only for the
   v0.4 teaching model and is never stored in, or confused with, N or R.
   ------------------------------------------------------------------------- */
export const N_LABEL = "N = QC measurements/event";
export const R_LABEL = "R = rule look-back across QC runs";
export const M_LABEL = "M = patient samples between QC events";

export const N_R_M_DISTINCTION_NOTE = "N, R and M answer three different questions, and none of them can be derived from either of the others. N is the number of control measurements evaluated at a single QC event. R is the number of consecutive analytical runs a sequential rule looks back across, where a rule extends over more than one run. M is the number of patient samples processed between successive QC events (the \"run size\" for continuous-production teaching purposes) — an entirely separate design decision about frequency, not about the statistical procedure itself. Worked example: N=2, R=1, M=100 means two QC measurements are evaluated at the QC event; the configured rule requires only the current run (no look-back); and 100 patient specimens are processed between successive QC events. Changing M does not change N or R, and changing N or R does not change M.";

export const M_OPTIONS = [10, 25, 50, 100, 250, 500, 1000];

/* -------------------------------------------------------------------------
   Systematic-shift injection (spec section 6) — never attributed to a
   specific physical cause.
   ------------------------------------------------------------------------- */
export const SHIFT_OPTIONS_SD = [0.5, 1, 2, 3, 4];
export const SYNTHETIC_SHIFT_INTRODUCED_TEXT = "Synthetic systematic shift introduced.";
export const SHIFT_CAUSE_CAUTION = "This application never automatically equates an injected analytical shift with a particular physical cause. It will say \"Synthetic systematic shift introduced,\" never \"Calibration failure occurred\" or any other specific attributed cause — a real shift's cause can only be established by laboratory investigation.";

/* -------------------------------------------------------------------------
   Failure-onset teaching assumptions (spec section 7). Two deterministic
   modes; neither is described as the universal Parvin model.
   ------------------------------------------------------------------------- */
export const FAILURE_ONSET_MODES = [
  {
    id: "immediate",
    label: "Mode A — Immediately after successful QC",
    description: "The error is assumed to start just after a successful QC event.",
    caution: "This represents a near-worst-position exposure scenario for the configured interval — the longest possible exposure before the next QC opportunity. It is a simplified teaching assumption, not the universal Parvin model, and not a claim that failures typically begin at this exact moment."
  },
  {
    id: "uniform",
    label: "Mode B — Random position within interval",
    description: "For educational calculation only, failure onset is assumed to be uniformly distributed within the patient interval.",
    caution: "This is a simplified teaching assumption (uniform onset), not the universal Parvin model, adopted here purely to illustrate that average exposure is smaller than the worst case when onset timing is unknown."
  }
];

/* -------------------------------------------------------------------------
   Terminology (spec section 12) — kept strictly separate throughout the UI.
   ------------------------------------------------------------------------- */
export const PATIENT_SAMPLES_EXPOSED_DEFINITION = "Patient samples exposed / processed before detection: a process/detection-delay concept — how many patient specimens were tested while the analytical process was out of control, before the QC procedure detected the shift.";
export const UNACCEPTABLE_RESULTS_DEFINITION = "Unacceptable final patient results: patient results that actually exceed the specific loss/error criterion of a defined patient-risk model (such as Parvin's framework, introduced conceptually below). Not every patient sample processed during an out-of-control period necessarily produced an unacceptable result — the two concepts must not be used interchangeably.";

/* -------------------------------------------------------------------------
   ANPed (spec section 13) — contemporary patient-impact concept.
   ------------------------------------------------------------------------- */
export const ANPED_NOTE = "ANPed (Average Number of Patient samples affected before Error Detection) is a contemporary patient-impact concept used in recent work to compare the consequences of different internal QC (IQC) frequencies and patient-based QC (PBQC) performance. This teaching model illustrates the same fundamental principle: increasing the interval between QC events increases the number of patient samples that may be affected before an analytical error is detected. The simplified v0.4 geometric calculation in this application is not claimed to be numerically identical to every published ANPed implementation — it is an independently derived, independently tested illustration of the same underlying principle, restricted to the validated single-rule (1₃s) case.";

/* -------------------------------------------------------------------------
   Frequency Exposure Lab (spec section 8) — the simplest critical exercise.
   ------------------------------------------------------------------------- */
export const FREQUENCY_EXPOSURE_LAB = {
  sharedConditions: "Same method performance, same QC procedure, same injected systematic shift, same per-event detection probability throughout.",
  strategyA: { label: "Strategy A", M: 50 },
  strategyB: { label: "Strategy B", M: 500 },
  questions: [
    { q: "Did the QC rule change?", a: "No." },
    { q: "Did the probability of error detection at an individual QC event change?", a: "No — if the N/rule configuration is identical, the per-event detection probability is unchanged." },
    { q: "Did potential patient exposure between detection opportunities change?", a: "Yes, substantially — a larger M means more patient samples could be processed before the next opportunity to detect the shift." }
  ],
  teachingPoint: "A statistically appropriate QC procedure can still be an inadequate QC strategy if QC is performed at an inappropriate frequency. The rule and its detection power are unchanged; only the opportunity for patient exposure has changed."
};

/* -------------------------------------------------------------------------
   "Which component changed?" experiment (spec section 14) — fixed example.
   ------------------------------------------------------------------------- */
export const WHICH_COMPONENT_CHANGED_EXPERIMENT = {
  fixedPed: 0.90,
  mValues: [50, 100, 500],
  question: "Under the simplified immediate-post-QC persistent-shift model, which component changed as M increased from 50 to 500?",
  correctAnswer: "m",
  correctAnswerLabel: "QC frequency / run size",
  explanation: "Expected QC events to detection remains unchanged (1/Ped = 1/0.90 ≈ 1.11 events) because Ped did not change. Expected patient-sample exposure changes proportionally with M (M/Ped). Nothing about Sigma, Ped, the rule definition, N, or R changed in this comparison — only the QC frequency (expressed here as M) changed."
};

/* -------------------------------------------------------------------------
   "Change Ped, hold M constant" experiment (spec section 15). Each preset
   uses N=1 with 1_3s and a deltaSE chosen so the independently validated
   ped1_3s(deltaSE, N) genuinely lands at (to within 0.001) the labelled
   target — never a fabricated or rounded-up number.
   ------------------------------------------------------------------------- */
export const CHANGE_PED_HOLD_M_EXPERIMENT = {
  fixedM: 100,
  presets: [
    { label: "Ped ≈ 0.50", ruleIds: ["13s"], N: 1, deltaSE: 3.000 },
    { label: "Ped ≈ 0.75", ruleIds: ["13s"], N: 1, deltaSE: 3.674 },
    { label: "Ped ≈ 0.90", ruleIds: ["13s"], N: 1, deltaSE: 4.282 },
    { label: "Ped ≈ 0.99", ruleIds: ["13s"], N: 1, deltaSE: 5.326 }
  ],
  question: "As Ped increases from 0.50 to 0.99 with M held at 100, what happens to expected detection delay?",
  correctAnswer: "Higher detection probability shortens expected detection delay (fewer expected QC events, and fewer expected patient samples exposed, before detection) — this is the difference between the strength of the QC procedure (Ped) and the frequency at which it is applied (M), which are two separate levers.",
  teachingNote: "Compare this experiment with the M-only experiment above: there, changing M changed exposure but not detection; here, changing Ped (procedure strength) changes both expected events to detection and expected exposure, while M is held constant."
};

/* -------------------------------------------------------------------------
   Four-quadrant teaching matrix (spec section 16) — no quadrant is
   universally labelled good or bad.
   ------------------------------------------------------------------------- */
export const QUADRANT_MATRIX = [
  {
    id: "high-frequent", pedLevel: "high", frequencyLevel: "frequent",
    label: "High Ped + frequent QC",
    discussion: "Short expected detection delay and small patient exposure. The likely trade-off is higher QC workload, more control material consumption, and more opportunities for false rejection — appropriate where patient risk from an undetected error is high, but not automatically the right choice everywhere."
  },
  {
    id: "high-infrequent", pedLevel: "high", frequencyLevel: "infrequent",
    label: "High Ped + infrequent QC",
    discussion: "Once a shift occurs, it may still be detected reliably at the next QC event — but the interval between events can allow substantial patient-sample exposure before that opportunity arrives. A high detection probability per event does not, by itself, bound how many patient samples are affected while waiting for that event."
  },
  {
    id: "low-frequent", pedLevel: "low", frequencyLevel: "frequent",
    label: "Low Ped + frequent QC",
    discussion: "Any single QC event is less likely to catch the shift, but frequent QC events mean more attempts occur within a given span of patient testing, and each interval's exposure window is small. Detection may still take several QC events on average, even though each individual exposure window is short."
  },
  {
    id: "low-infrequent", pedLevel: "low", frequencyLevel: "infrequent",
    label: "Low Ped + infrequent QC",
    discussion: "The least favourable combination in this teaching model: detection is unreliable per event, and each missed opportunity carries a large patient-sample exposure window. Both procedure performance and frequency would need attention here — neither alone resolves the concern."
  }
];
export const QUADRANT_MATRIX_NOTE = "Both procedure performance (Ped) and frequency (M) matter, and neither factor alone determines whether a QC strategy is adequate. This matrix is a teaching aid to help you reason about the interaction between the two, not a scoring system with one universally correct quadrant.";

/* -------------------------------------------------------------------------
   Parvin's patient-risk concept (spec sections 17-22) — conceptual only.
   ------------------------------------------------------------------------- */
export const PARVIN_SECTION_INTRO = "From error detection to patient risk. Everything calculated elsewhere in this lab (expected QC events to detection, expected patient-sample exposure) describes process behaviour — it does not yet describe patient harm. Parvin proposed evaluating QC performance using the expected increase in unacceptable final patient results reported while an out-of-control condition remains undetected, and considering the maximum of that quantity over the range of systematic error conditions a method might experience: MaxE(Nuf). Unlike Ped evaluated at a single QC event, MaxE(Nuf) responds to QC frequency — it connects detection performance, error size, and how often QC is performed into one patient-risk-oriented quantity.";
export const MAXE_NUF_DEFINITION = "MaxE(Nuf): the maximum, over a range of systematic error sizes, of the expected increase in the number of unacceptable final patient results reported before an out-of-control condition is detected and corrected.";
export const MAXE_NUF_BOUNDARY_NOTE = "Full numerical MaxE(Nuf) calculation is intentionally not implemented in this version because the patient-risk model requires additional validated assumptions and statistical modelling. This is preferable to an approximate or fabricated calculator. A general MaxE(Nuf) calculator will not be implemented unless all of the following are established: complete mathematical equations from an authoritative source; the model's assumptions; the shift distributions where required; the testing-mode assumptions; the patient-result error model; the relevant QC operating characteristics; and independently known validation fixtures.";
export const MAXE_NUF_NOT_ONLY_FRAMEWORK_NOTE = "Parvin's framework is an established and influential patient-risk framework in the clinical laboratory QC literature — it is not presented here as the only possible model of analytical patient risk. Different risk metrics can answer different questions, and methodological discussion about the underlying assumptions continues (see \"Areas of ongoing discussion\").";

export const NOMOGRAM_CONCEPT_NOTE = "Because directly calculating a patient-risk-oriented quantity like MaxE(Nuf) from first principles is nontrivial, published planning tools have related Sigma performance, error-detection performance, MaxE(Nuf), and QC run size/frequency through graphical nomograms and calculators, so a laboratory can look up a suggested run size rather than deriving it from scratch each time. This application teaches the underlying planning concept and provides an original conceptual diagram only — it does not reproduce or copy any published nomogram's specific graphical design.";

export const WORKED_NOMOGRAM_EXAMPLE = {
  label: "Published nomogram construction relationship under the stated reference conditions",
  explanation: "In one published risk-based planning framework, calculations were normalised to M = 100 patient samples, and run size was related to the corresponding MaxE(Nuf) value under that framework's specific stated reference conditions (a particular QC procedure, shift-detection model, and error criterion).",
  formulaAsPublished: "run size = 100 / MaxE(Nuf)  — valid ONLY under that framework's specific stated reference conditions (M normalised to 100, and that framework's own procedure/model/error-criterion assumptions).",
  cautionAgainstGeneralisation: "This relationship is not a universal law. It is a construction specific to the cited framework's stated reference conditions, and this application does not apply it outside that context or present it as a general-purpose run-size formula."
};

export const MAXE_GOAL_NOTE = "This application does not state that MaxE(Nuf) = 1 is universally required. A MaxE(Nuf) goal of 1 has commonly been used as a patient-risk planning target in published work. Where alternative risk goals are discussed, they are described as selected risk tolerances appropriate to a given context, not as universal standards that apply everywhere.";

export const PATIENT_RISK_SIGMA_CAUTION = "\"Patient Risk Sigma\" appears in some published QC-frequency planning tools as a term specific to that tool's own risk-planning implementation. This application does not present Patient Risk Sigma as though it were the same quantity as ordinary analytical Sigma, and does not implement its numerical calculation in v0.4 — doing so would require independent validation this build does not yet have.";

/* -------------------------------------------------------------------------
   Startup vs monitoring QC, bracketed QC, and the out-of-control preview
   (spec sections 26-28) — conceptual only; no universal timing prescribed,
   no automatic full-bracket invalidation.
   ------------------------------------------------------------------------- */
export const STARTUP_VS_MONITORING_NOTE = "Startup QC is QC performed before, or at the beginning of, routine analytical operation — it establishes that the system is working correctly at that point in time. Monitoring QC refers to QC events occurring during continuing patient testing, intended to detect changes that develop after startup. A successful startup QC event does not eliminate the need to consider monitoring frequency during ongoing production — a system that passed QC at the start of the day can still develop a problem hours later, and only monitoring QC (at whatever frequency is appropriate) can catch that. This application does not prescribe a universal timing for either.";

export const BRACKETED_QC_NOTE = "Bracketed QC surrounds a block of patient testing with QC events on both sides: QC → patient samples → QC. The two QC events provide surveillance around the intervening patient-testing interval — if both are acceptable, the bracket offers some reassurance that the process was in control on either side of the tested interval. This does not automatically prove that every intervening patient result was correct: an error could still have occurred and self-resolved (or a marginal shift could remain undetected) within the interval, which is part of why frequency, not just bracketing itself, matters.";

export const OUT_OF_CONTROL_EVENT_PREVIEW = {
  scenario: "QC fails at the end of a bracket containing 150 patient specimens.",
  question: "Which patient results may require impact assessment?",
  teachingAnswer: "Results reported since the last acceptable QC evidence may need consideration, according to the laboratory's defined procedure and investigation — not automatically every one of the 150 specimens, and not automatically none of them. The actual scope of review depends on the investigation (for example, whether the failure appears to be a sudden step-change or a gradual drift, and what the laboratory's own out-of-control response procedure specifies).",
  caution: "This application does not build a full retrospective patient-result correction engine or out-of-control recovery workflow in v0.4 — this preview introduces the question only, to connect frequency and bracket size to the scale of a potential downstream investigation."
};

/* -------------------------------------------------------------------------
   Mandatory misconception challenges (spec sections 32-33) and supporting
   context (sections 34-35).
   ------------------------------------------------------------------------- */
export const MORE_QC_NOT_ALWAYS_BETTER_NOTE = "This lab does not teach that more frequent QC is always better. More frequent QC consumes control material, consumes analyser capacity, increases operating burden, and may create additional opportunities for false rejection. The objective is not maximal QC frequency — it is appropriate QC frequency for the analytical performance, the QC procedure in use, process stability, and the patient-risk context.";

export const HIGH_SIGMA_FREQUENCY_MISCONCEPTION_NOTE = "A second mandatory misconception to avoid: \"high Sigma means QC frequency does not matter.\" A high-performing assay may justify a different QC design (for example, a simpler statistical procedure), but analytical capability alone does not remove the need to define an appropriate surveillance interval — an excellent method can still develop a sudden problem, and frequency determines how much patient-sample exposure would occur before that problem is caught.";

export const PROCESS_STABILITY_NOTE = "Method robustness, historical stability, and the frequency of past analytical disturbances are all relevant factors when choosing an appropriate QC frequency — a method with a strong track record of stability may reasonably be treated differently from one with a history of drifting or failing. This application does not calculate these factors quantitatively in v0.4; they are introduced conceptually here to prepare for fuller risk-based QC design.";

export const CLINICAL_CONSEQUENCE_NOTE = "A similar-sized analytical error may carry different potential clinical consequences depending on the measurand and the decision context in which the result is used (for example, a threshold used for an urgent clinical decision versus a routine screening value). Patient-risk planning should therefore not be reduced to Sigma alone. This application does not create arbitrary harm scores or numerical clinical-consequence weightings in v0.4 — the point is introduced qualitatively only.";

/* -------------------------------------------------------------------------
   Frequency Designer (spec section 23) defaults and limitation note.
   ------------------------------------------------------------------------- */
export const FREQUENCY_DESIGNER_DEFAULTS = { N: 2, R: 1, M: 100, deltaSE: 2, onsetMode: "immediate" };
export const RISK_MODEL_LIMITATION_NOTE = "This exposure metric is not MaxE(Nuf). It estimates expected patient-sample exposure before detection under a simplified, independently validated geometric teaching model restricted to the single 1₃s rule — it does not estimate the number of unacceptable final patient results, does not account for patient-harm severity, and is not a substitute for a full risk-based QC design.";

/* -------------------------------------------------------------------------
   Frequency Challenge Bank — 10 deterministic cases (spec section 29).
   Every Ped value quoted is drawn from the independently validated
   ped1_3s()/pfr1_3s() functions (see src/opchar/functions.js), never
   fabricated. At least two cases (5 and 10) have "insufficient information"
   as part of the correct conclusion.

   ARTIFACT PROVENANCE: Class A — case objects directly recovered from HTML.
   TEST EXPECTATION PROVENANCE: source-grounded (correctWhatChanged,
   correctLikelyEffect, misconceptionFlag fields directly encoded in source).
   ------------------------------------------------------------------------- */
export const WHAT_CHANGED_OPTIONS = [
  { id: "procedure", label: "QC procedure" },
  { id: "n", label: "N" },
  { id: "r", label: "R" },
  { id: "m", label: "M / QC frequency" },
  { id: "performance", label: "Analytical performance" },
  { id: "multiple", label: "More than one" },
  { id: "insufficient", label: "Insufficient information" }
];
export const LIKELY_EFFECT_OPTIONS = [
  { id: "detection", label: "Detection probability per QC event" },
  { id: "exposure", label: "Opportunity for patient exposure" },
  { id: "both", label: "Both" },
  { id: "neither", label: "Neither" },
  { id: "insufficient", label: "Insufficient information" }
];

export const FREQUENCY_CHALLENGE_CASES = [
  {
    id: 1, title: "Case 1 — Same rule, very different frequency",
    scenario: "Procedure A (1₃s, N=2, R=1) is used at M=50 in one laboratory and M=500 in another, with identical method performance and an identical injected shift.",
    correctWhatChanged: ["m"],
    correctLikelyEffect: "exposure",
    whatRemainedUnchanged: "The QC rule, N, R, method performance (Sigma), and the per-QC-event detection probability (Ped) are all identical between the two laboratories.",
    effectOnDetection: "Unchanged — Ped at an individual QC event depends on the rule and N, neither of which changed.",
    effectOnExposure: "Substantially different — expected patient-sample exposure before detection scales with M under this model (M/Ped for immediate onset), so the M=500 laboratory has ten times the expected exposure of the M=50 laboratory for the same detection performance.",
    whatModelCanEstimate: "Expected QC events to detection (unchanged between the two) and expected patient-sample exposure before detection (very different between the two), under the stated simplified assumptions.",
    whatModelCannotEstimate: "The number of unacceptable final patient results, or any patient-harm probability — those require a full patient-risk model such as MaxE(Nuf), not implemented numerically here.",
    nextConsideration: "Whether M=500 is an appropriate frequency given the clinical use of this analyte, independent of whether the QC rule itself is adequate."
  },
  {
    id: 2, title: "Case 2 — High Ped, extremely long QC interval",
    scenario: "A laboratory uses a 1₃s procedure with a large injected shift assumption giving Ped ≈ 0.99 (N=1, deltaSE≈5.33 SD), but runs QC only once every M=1000 patient samples.",
    correctWhatChanged: ["m"],
    correctLikelyEffect: "exposure",
    whatRemainedUnchanged: "The high per-event detection probability (Ped ≈ 0.99) is unaffected by how rarely QC is performed.",
    effectOnDetection: "Unchanged and already high — once a QC event occurs, this shift size is very likely to be caught.",
    effectOnExposure: "Still large — even with Ped ≈ 0.99, an M=1000 interval means up to roughly 1000 patient samples could be processed before the next QC opportunity, if the failure begins right after the previous QC event.",
    whatModelCanEstimate: "That expected exposure remains proportional to M even when Ped is high — a high detection probability per event does not, by itself, bound the size of the exposure window.",
    whatModelCannotEstimate: "Whether 1000 potentially affected patient samples constitutes an acceptable clinical risk for this specific measurand — that depends on clinical context this model does not evaluate.",
    nextConsideration: "Whether the interval itself, not the rule's detection power, should be reconsidered.",
    misconceptionFlag: "high-sigma-frequency"
  },
  {
    id: 3, title: "Case 3 — Lower Ped, frequent QC",
    scenario: "A laboratory uses a 1₃s procedure with a smaller injected shift assumption giving Ped ≈ 0.50 (N=1, deltaSE=3.00 SD), but runs QC every M=25 patient samples.",
    correctWhatChanged: ["m"],
    correctLikelyEffect: "exposure",
    whatRemainedUnchanged: "The moderate per-event detection probability (Ped ≈ 0.50) is unaffected by how often QC is performed.",
    effectOnDetection: "Unchanged at the individual-event level — expected QC events to detection is still 1/0.50 = 2 events on average.",
    effectOnExposure: "Kept small by the frequent QC — even though any single event is only a coin-flip's chance of catching the shift, the small M=25 interval limits how many patient samples can be exposed before an opportunity arises.",
    whatModelCanEstimate: "That frequent QC can partially offset a modest per-event detection probability, in terms of bounding patient-sample exposure.",
    whatModelCannotEstimate: "The QC workload, control-material cost, and false-rejection burden that come with this frequency — those are separate operational trade-offs this exercise does not quantify.",
    nextConsideration: "Whether the operational cost of M=25 is justified by the exposure reduction it buys, given the clinical risk of this analyte."
  },
  {
    id: 4, title: "Case 4 — Confusion between N and M",
    scenario: "A trainee claims: \"If we increase N from 2 to 4 controls per QC event, that means QC is effectively performed twice as often.\"",
    correctWhatChanged: ["n"],
    correctLikelyEffect: "detection",
    whatRemainedUnchanged: "M (patient samples between QC events) is not affected by how many controls are measured at each event — the trainee's claim conflates N with M.",
    effectOnDetection: "N does affect detection: for the validated 1₃s case, increasing N from 2 to 4 independent control measurements increases both Ped and Pfr per event (more independent chances for any one control to exceed the limit).",
    effectOnExposure: "Not affected by this change — expected patient-sample exposure depends on M and Ped, and M did not change here.",
    whatModelCanEstimate: "The correct, validated relationship: N changes per-event Ped/Pfr; it does not change QC frequency.",
    whatModelCannotEstimate: "Nothing about the correctness of the underlying claim — this case is a conceptual check, not a numerical estimate.",
    nextConsideration: "Revisit the definitions: N is a property of the QC procedure at one event; M is a property of how often events occur.",
    misconceptionFlag: "n-vs-m"
  },
  {
    id: 5, title: "Case 5 — Confusion between R and M",
    scenario: "A trainee claims: \"Our rule requires R=4 runs of look-back, so QC events must be happening every 4 patient samples.\"",
    correctWhatChanged: ["r"],
    correctLikelyEffect: "insufficient",
    whatRemainedUnchanged: "M is not determined by R at all — R describes how many consecutive QC runs a sequential rule inspects, not how many patient samples occur between QC events.",
    effectOnDetection: "Cannot be quantified numerically here: R>1 sequential rules in this application's procedure library are multirule configurations, for which numerical Ped/Pfr and detection-delay are not implemented (validated numerical detection-delay modelling is restricted to the single 1₃s rule).",
    effectOnExposure: "Not affected by R at all — exposure depends on M, which is an independent design choice.",
    whatModelCanEstimate: "The conceptual point that R and M are unrelated variables, even though this exercise cannot numerically quantify the multirule procedure's detection performance.",
    whatModelCannotEstimate: "A numerical detection probability or detection delay for any procedure using R>1 (a multirule sequential rule) — displayed as \"Numerical detection-delay modelling is not implemented for this multirule procedure in the current version.\"",
    nextConsideration: "Ask separately: what is R for this rule (a statistical property), and what is M for this laboratory (a frequency decision)? They must be answered independently.",
    misconceptionFlag: "r-vs-m"
  },
  {
    id: 6, title: "Case 6 — Startup-only QC on a long continuous production run",
    scenario: "A laboratory performs a single startup QC event at the beginning of a shift, then continues continuous patient testing for many hours with no further monitoring QC.",
    correctWhatChanged: ["m"],
    correctLikelyEffect: "exposure",
    whatRemainedUnchanged: "The startup QC event's own detection probability, at the moment it was performed, is unaffected by what happens afterward.",
    effectOnDetection: "Not evaluated further after startup — there is no subsequent QC event to provide a detection opportunity until the next one occurs (if any).",
    effectOnExposure: "Effectively unbounded for this teaching model as the interval since the last QC event grows without a further monitoring QC event — a successful startup result does not extend forward in time as protection against a later-developing problem.",
    whatModelCanEstimate: "That exposure grows with the interval since the last QC event, consistent with the M-dependence shown throughout this lab.",
    whatModelCannotEstimate: "The specific point during the shift at which any real failure would begin — that is unknown in practice, which is exactly why monitoring QC frequency needs to be planned for, not deferred to a single startup check.",
    nextConsideration: "Whether monitoring QC events should be scheduled during the production period, and at what frequency, independent of the startup check.",
    misconceptionFlag: "startup-sufficiency"
  },
  {
    id: 7, title: "Case 7 — Bracketed QC with a late failure",
    scenario: "A bracket of 150 patient specimens is tested between two QC events; the QC event at the end of the bracket fails.",
    correctWhatChanged: ["m"],
    correctLikelyEffect: "exposure",
    whatRemainedUnchanged: "The bracket's opening QC event was acceptable — the process was in control at the start of the interval, as far as that single check could establish.",
    effectOnDetection: "The failing QC event did detect a problem — by the end of the bracket, the out-of-control condition was identified.",
    effectOnExposure: "Up to 150 patient specimens fall within the exposure window between the two QC events, though not all 150 are automatically presumed affected.",
    whatModelCanEstimate: "The size of the exposure window associated with this bracket (up to 150 specimens).",
    whatModelCannotEstimate: "Exactly which of the 150 results, if any, are actually incorrect, and whether all, some, or none require correction — that requires the laboratory's own investigation and out-of-control response procedure, which this application previews conceptually but does not implement as a full workflow.",
    nextConsideration: "Results reported since the last acceptable QC evidence may need consideration according to the defined laboratory procedure and investigation — not an automatic presumption that all 150 are invalid."
  },
  {
    id: 8, title: "Case 8 — Very high Sigma assay, frequency still matters",
    scenario: "An assay with Sigma ≈ 8 (excellent analytical performance) is run with QC at M=50 in one configuration and M=1000 in another, same rule and same injected shift throughout.",
    correctWhatChanged: ["m"],
    correctLikelyEffect: "exposure",
    whatRemainedUnchanged: "The excellent analytical performance (Sigma) and the QC rule's detection probability at an individual event are identical in both configurations.",
    effectOnDetection: "Unchanged between the two configurations.",
    effectOnExposure: "Very different — the M=1000 configuration has a much larger expected patient-sample exposure window than the M=50 configuration, despite the assay's excellent performance.",
    whatModelCanEstimate: "That patient-sample exposure before detection is driven by M, not by Sigma, once the QC rule and shift are fixed.",
    whatModelCannotEstimate: "Whether an M=1000 interval is clinically acceptable for this specific analyte — that is a context-dependent judgement, not a Sigma-derived number.",
    nextConsideration: "Whether an appropriate surveillance interval has actually been defined for this assay, rather than assuming its excellent Sigma removes the need to do so.",
    misconceptionFlag: "high-sigma-frequency"
  },
  {
    id: 9, title: "Case 9 — Lower Sigma assay, frequency cannot fix performance",
    scenario: "An assay with Sigma ≈ 2.5 (poor analytical performance relative to its requirement) has its QC frequency increased from M=500 to M=25, with the method itself unchanged.",
    correctWhatChanged: ["m"],
    correctLikelyEffect: "exposure",
    whatRemainedUnchanged: "The method's underlying analytical performance (Sigma ≈ 2.5) did not change — only how often QC is checked changed.",
    effectOnDetection: "Unchanged at the individual-event level — the per-event detection probability of the QC procedure did not improve just because it is now applied more often.",
    effectOnExposure: "Reduced — the smaller M=25 interval limits how many patient samples could be exposed before a detection opportunity, compared with M=500.",
    whatModelCanEstimate: "That increasing frequency reduces expected exposure, holding the procedure and its detection probability fixed.",
    whatModelCannotEstimate: "Whether this frequency increase is an adequate response to the underlying performance problem — it is not. Intensifying QC frequency does not correct poor method performance; investigation and improvement of the measurement procedure may be necessary.",
    nextConsideration: "Whether the analytical process itself should be investigated and improved, rather than relying on frequency alone to manage a performance shortfall.",
    misconceptionFlag: "frequency-fixes-performance"
  },
  {
    id: 10, title: "Case 10 — Insufficient information",
    scenario: "A laboratory asks what QC frequency (M) would be appropriate for a new assay, but has not yet estimated the method's Sigma, has not specified an injected shift size to plan around, and has not stated which QC procedure will be used.",
    correctWhatChanged: ["insufficient"],
    correctLikelyEffect: "insufficient",
    whatRemainedUnchanged: "Nothing can be confirmed as \"unchanged\" because no baseline configuration has been specified at all.",
    effectOnDetection: "Cannot be determined — no QC procedure, N, or shift size has been specified.",
    effectOnExposure: "Cannot be determined — no M has been proposed, and detection probability is also unknown.",
    whatModelCanEstimate: "Nothing numerically, until an analytical performance estimate, a QC procedure, and a shift assumption are specified.",
    whatModelCannotEstimate: "An appropriate frequency recommendation of any kind — this model requires, at minimum, a validated QC procedure and detection probability, and a stated shift assumption, before any exposure or detection-delay estimate is meaningful.",
    nextConsideration: "Establish Sigma, select a QC procedure, and state a shift assumption before any frequency planning can proceed."
  }
];

