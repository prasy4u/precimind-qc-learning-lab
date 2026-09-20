/* =========================================================================
   app/ui/guided-path.js — Guided Learning pathway content
   PROVENANCE: V09_NEW (v1.0 RC remediation, Workstreams 4 and 5)

   The scientific sequence is the EXISTING intended pathway already
   declared in PATHWAY_PHASES (Understand -> Control -> Govern). It is
   reproduced here unchanged; no module was added, removed or reordered.

   Note: steps 6 (APS) and 8 (QC strategy) both open the QC Strategy Lab.
   That is the existing authored pathway and is deliberately preserved —
   it is why the guided step index is tracked explicitly rather than
   inferred from the screen key alone.

   Each step supplies only what the learner-journey audit found missing:
   position, learning goal, what to do, a completion criterion, a key
   takeaway, and a reason the next topic follows. No scientific claim,
   threshold or conclusion is introduced here, and no step reveals an
   observation the learner is meant to make for themselves.
   ========================================================================= */

export const GUIDED_PATH = [
  {
    screen: "stats", label: "Statistics", phase: "Understand",
    goal: "Understand what mean, standard deviation, CV and bias each describe, and how a target value differs from where a process is actually centred.",
    whatToDo: "Move the Configured Process SD slider across its range and watch the distribution and the Observed Sample SD together. Then return SD to its starting value and move Bias positive, then negative. Finally compare the Target value card with the Process Centre card, and note what CV% and Signed Bias% do in each case.",
    completion: "You are ready to continue when you can say, in your own words, which control changed the spread of the data, which one moved its centre, and why the Target value never moves when you change Bias.",
    takeaway: "Location and dispersion are independent properties of a measurement process. Bias describes displacement from a target; SD and CV describe scatter. Changing one does not change the other, and the target itself is a fixed reference rather than a property of the process.",
    whyNext: "Those statistics have to be estimated from a real control material before they can be plotted, so the next step examines where the mean and SD actually come from."
  },
  {
    screen: "qc-materials", label: "QC Materials", phase: "Understand",
    goal: "Understand what QC material is, how it differs from a calibrator and from a patient specimen, and how a laboratory establishes the mean and SD that every later chart depends on.",
    whatToDo: "Work through the five stations in order and complete the Learning Check at the end.",
    completion: "You are ready to continue when you can explain why a numerically extreme QC result is not, on its own, a reason to exclude it.",
    takeaway: "The quality of a control chart is limited by the quality of the statistics behind it. Control material selection, handling and the way the mean and SD were established all shape what a later chart can tell you.",
    whyNext: "Once a mean and SD exist, QC results can be plotted against them — which is what a Levey-Jennings chart does."
  },
  {
    screen: "lj", label: "QC charts", phase: "Understand",
    goal: "Read a Levey-Jennings chart and understand how the assigned mean and SD determine where every point falls relative to the control lines.",
    whatToDo: "Change the assigned mean and assigned SD and watch how the same underlying results move relative to the ±1, ±2 and ±3 SD lines. Switch between raw units and SD units to see the same data expressed two ways.",
    completion: "You are ready to continue when you can explain why changing the assigned SD changes the appearance of the chart without changing any measured result.",
    takeaway: "A Levey-Jennings chart shows results on a scale defined by the assigned mean and SD. The chart is an interpretation of the data, not the data itself.",
    whyNext: "Once you can read a single chart, the next question is what shapes across several points actually mean."
  },
  {
    screen: "pattern", label: "Patterns", phase: "Understand",
    goal: "Distinguish stable behaviour, isolated results, shifts, trends and increased scatter — and recognise what each pattern does and does not establish.",
    whatToDo: "Work through the scenarios. For each one, commit to a pattern and a broad behaviour before revealing the feedback, then read what the scenario states it does NOT prove.",
    completion: "You are ready to continue when you can name a pattern from its shape and state one thing that pattern does not, by itself, prove.",
    takeaway: "A pattern is an observation, not a diagnosis. Recognising a shift or a trend tells you something has changed; it does not tell you what caused it or whether patients were affected.",
    whyNext: "Patterns are recognised informally by eye; QC rules formalise that recognition into explicit, testable criteria."
  },
  {
    screen: "rules", label: "Rules", phase: "Control",
    goal: "Understand what each statistical control rule actually tests, and why the same data can trigger one rule and not another.",
    whatToDo: "Explore the rule definitions, then work the Detective Cases: for each, decide which rule is violated and over what scope before submitting.",
    completion: "You are ready to continue when you can explain the difference between a rule that looks within a single run and one that looks across several runs.",
    takeaway: "Control rules are explicit criteria applied to defined data, each with its own scope. A rule violation is a signal to investigate, not a conclusion about cause or patient impact.",
    whyNext: "Rules tell you when to react; analytical performance specifications tell you how much error matters in the first place."
  },
  {
    screen: "strategy", label: "APS", phase: "Control",
    goal: "Understand what an analytical performance specification is, where one can legitimately come from, and why the source of a specification matters.",
    whatToDo: "Work through the APS classification cases, deciding for each scenario which category of specification source is being described.",
    completion: "You are ready to continue when you can name more than one legitimate source of an analytical performance specification and say why they are not interchangeable.",
    takeaway: "A performance specification is a stated requirement with a traceable origin. Different sources answer different questions, and a specification is only meaningful alongside the reasoning that produced it.",
    whyNext: "Once a specification exists, Sigma expresses how much of that allowance the process is currently consuming."
  },
  {
    screen: "sigma", label: "Sigma", phase: "Control",
    goal: "Understand how imprecision, bias and an allowable total error combine into a single Sigma value, and what that value can and cannot tell you.",
    whatToDo: "Vary TEa, bias and CV independently and watch the Sigma value respond. Deliberately drive bias up until it approaches and then exceeds TEa, and observe what the calculation reports.",
    completion: "You are ready to continue when you can explain why a large bias can consume the entire error budget even when imprecision is small.",
    takeaway: "Sigma is a ratio, not a grade. It summarises the relationship between allowable error, bias and imprecision, and it is only as meaningful as the specification it is measured against.",
    whyNext: "Sigma is most useful when it informs an actual QC design decision, which is what QC strategy addresses."
  },
  {
    screen: "strategy", label: "QC strategy", phase: "Control",
    goal: "Understand how analytical performance informs the choice of control rules and the number of control measurements.",
    whatToDo: "Explore the Sigma-guided procedure mapping and the stated assumptions and limits of the model.",
    completion: "You are ready to continue when you can explain why a higher-performing method may justify a simpler control procedure.",
    takeaway: "QC design is a reasoned trade-off between error detection and false rejection, made explicit by the method's measured performance rather than chosen by habit.",
    whyNext: "Analytical performance is only half the picture; biological variation determines what size of change is meaningful in a patient."
  },
  {
    screen: "bv-rcv", label: "Biological Variation & RCV", phase: "Control",
    goal: "Understand within-subject and between-subject biological variation, and how they combine with analytical imprecision to define a reference change value.",
    whatToDo: "Vary CVA and CVI and watch the RCV respond, then work the serial-result cases deciding whether each change exceeds the reference change value.",
    completion: "You are ready to continue when you can explain why the same numerical change can be significant for one analyte and unremarkable for another.",
    takeaway: "A reference change value is a statistical threshold about the size of change that ordinary variation can produce. It is not a diagnostic cutoff and does not, by itself, establish clinical importance.",
    whyNext: "Having established what matters analytically and biologically, the remaining questions are about governing risk in routine operation."
  },
  {
    screen: "risk", label: "Risk-based QC", phase: "Govern",
    goal: "Understand how QC frequency relates to the number of patient results potentially exposed before an error is detected.",
    whatToDo: "Work the frequency challenge cases, deciding for each what actually changed and what effect that change would have on detection or exposure.",
    completion: "You are ready to continue when you can explain the difference between changing how quickly an error is detected and changing how many patients are exposed before it is.",
    takeaway: "QC frequency is a risk decision. Detection capability and patient exposure are related but distinct consequences, and a change to one does not automatically change the other.",
    whyNext: "When a QC failure does occur, the question becomes how to investigate it and what to do about results already reported."
  },
  {
    screen: "investigation", label: "Investigation & Recovery", phase: "Govern",
    goal: "Work through a structured out-of-control investigation, keeping the QC signal, the analytical disturbance, the root cause, patient impact and final disposition as separate questions.",
    whatToDo: "Work a recovery case through the reasoning stages in order, committing to a judgement at each stage before advancing.",
    completion: "You are ready to continue when you can state why establishing a root cause is a different question from establishing whether patient results were affected.",
    takeaway: "QC signal, analytical disturbance, root cause, patient impact and disposition are five distinct determinations. Collapsing them together is how investigations go wrong.",
    whyNext: "Internal QC monitors stability over time; external assessment asks a different question about agreement with others."
  },
  {
    screen: "external-assurance", label: "External Assurance", phase: "Govern",
    goal: "Understand what external quality assessment adds beyond internal QC, and the limits of what an EQA result can establish.",
    whatToDo: "Work the external assurance cases, paying attention to the target value type and the commutability status stated for each.",
    completion: "You are ready to continue when you can explain why stable internal QC does not, on its own, establish trueness.",
    takeaway: "Internal QC and external assessment answer different questions. An EQA result depends on the target value type and on whether the material behaves like a patient sample for your method.",
    whyNext: "Both internal QC and EQA use control materials; the final topic monitors the patient results themselves."
  },
  {
    screen: "pbrtqc", label: "Patient Surveillance", phase: "Govern",
    goal: "Understand how patient results themselves can be monitored in real time, and what determines whether such monitoring detects an error quickly or at all.",
    whatToDo: "Vary the algorithm, window size and truncation limits, then examine how the detection metrics respond — including what is reported when an introduced error is never detected.",
    completion: "You have completed the guided pathway when you can explain why a patient-based monitoring configuration might fail to detect an error entirely, and why that outcome must be reported rather than averaged away.",
    takeaway: "Patient-based monitoring complements control materials rather than replacing them. Its sensitivity depends on configuration choices, and an undetected error is a finding in its own right.",
    whyNext: null
  }
];

export const GUIDED_TOTAL = GUIDED_PATH.length;

/* Resynchronise the guided step when the learner navigates by another
   route (global navigation, browser Back, a direct URL). The hash remains
   the single source of truth for WHICH SCREEN is shown; this only keeps
   the guided position consistent with it, and returns null when the
   learner has left the pathway entirely. */
export function resolveGuidedStep(currentStep, screen) {
  if (currentStep === null || currentStep === undefined) return null;
  if (GUIDED_PATH[currentStep] && GUIDED_PATH[currentStep].screen === screen) return currentStep;
  const idx = GUIDED_PATH.findIndex(s => s.screen === screen);
  return idx === -1 ? null : idx;
}
