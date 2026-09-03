const SPEC_SOURCE_CAUTION = "These sources are not conceptually identical, and a laboratory may reasonably encounter several of them for the same analyte. A specification's origin should be recorded and considered when deciding how much weight to give it — this application does not teach that any number found in a table is automatically the correct TEa for a given analyte.";

/* -------------------------------------------------------------------------
   APS Source Classification Exercise — 8 deterministic scenarios.
   ------------------------------------------------------------------------- */
const APS_SOURCE_OPTIONS = [
  { id: "clinical-outcome", label: "Clinical-outcome based" },
  { id: "biological-variation", label: "Biological-variation based" },
  { id: "state-of-the-art", label: "State-of-the-art" },
  { id: "regulatory", label: "Regulatory" },
  { id: "eqa-pt", label: "EQA/PT-derived" },
  { id: "manufacturer-claim", label: "Manufacturer claim" },
  { id: "local-quality-goal", label: "Local quality goal" },
  { id: "insufficient-information", label: "Insufficient information" }
];

const APS_CLASSIFICATION_CASES = [
  {
    id: 1,
    scenario: "A professional working group publishes a consensus imprecision target for a therapeutic-drug analyte, derived from simulation studies linking analytical error to dosing decisions and reported adverse outcomes.",
    correct: "clinical-outcome",
    explanation: "This requirement is derived from a demonstrated link between analytical error and a specific clinical decision/outcome — the defining feature of a clinical-outcome-based specification, even though a professional body is the one publishing it."
  },
  {
    id: 2,
    scenario: "A specification for allowable total error is calculated from the published within-subject and between-subject biological variation coefficients for the analyte, using the standard biological-variation formulae.",
    correct: "biological-variation",
    explanation: "Deriving the requirement directly from within- and between-subject biological variation components is the defining feature of a biological-variation-based specification."
  },
  {
    id: 3,
    scenario: "A specification reflects the imprecision achieved by the best-performing quartile of laboratories in a large multicentre EQA survey for that analyte, with no claimed link to a specific clinical decision.",
    correct: "state-of-the-art",
    explanation: "This describes current achievable method performance across laboratories rather than a clinical-outcome or biological-variation derivation — the defining feature of a state-of-the-art specification."
  },
  {
    id: 4,
    scenario: "A national medical-laboratory regulation sets a minimum acceptable performance limit that laboratories must meet to remain licensed to report the test.",
    correct: "regulatory",
    explanation: "A requirement mandated by a regulatory body for licensure purposes is, by definition, a regulatory specification — regardless of which scientific model (if any) originally informed the regulator's choice."
  },
  {
    id: 5,
    scenario: "An external quality assessment scheme defines the acceptable range around the scheme's consensus (or reference) value that participants must fall within to be scored as satisfactory for that distribution.",
    correct: "eqa-pt",
    explanation: "An acceptability limit defined by and used within a specific EQA/PT scheme to grade participant performance is an EQA/PT-derived specification."
  },
  {
    id: 6,
    scenario: "The instrument manufacturer's package insert states the method's imprecision (CV%) and bias, measured under the manufacturer's own validation protocol.",
    correct: "manufacturer-claim",
    explanation: "Performance figures reported by the manufacturer under its own validation conditions are a manufacturer claim, which may or may not transfer exactly to a given laboratory's own operating conditions."
  },
  {
    id: 7,
    scenario: "A laboratory sets its own internal quality objective for an analyte based on several years of its own QC and patient-result history, informed by discussions with its main clinical users, without reference to any external published specification.",
    correct: "local-quality-goal",
    explanation: "A requirement a laboratory derives for itself from its own data and clinical relationships, without an external published source, is a local validated quality objective."
  },
  {
    id: 8,
    scenario: "A single TEa percentage for the analyte is quoted in a training slide with no stated origin, date, or reference — it is simply presented as \"the TEa\".",
    correct: "insufficient-information",
    explanation: "Without a stated derivation, date, or source, there is no way to know which of the other seven categories this number belongs to — that missing provenance is itself the point being taught. A specification's usefulness depends on knowing where it came from."
  }
];
