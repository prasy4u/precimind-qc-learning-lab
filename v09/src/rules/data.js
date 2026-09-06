/* =========================================================================
   Rule Laboratory — content and deterministic datasets.
   Calculation logic lives only in 07-rules.js; this file holds static
   data (demo runs, challenge cases, explanatory text) consumed by the UI.
   ========================================================================= */

const RULE_IDS = ["12s", "13s", "22s", "r4s", "41s", "10x"];

function rcr(levelId, levelName, z) {
  return { levelId, levelName, rawValue: roundTo(100 + z * 2, 2), zScore: z };
}
function rrun(n, l1, l2, event) {
  const results = [rcr("L1", "Level 1", l1)];
  if (l2 != null) results.push(rcr("L2", "Level 2", l2));
  return { runNumber: n, controlResults: results, event: event || null };
}

/* -------------------------------------------------------------------------
   "Learn the Rules" — one original, small demonstration dataset per rule.
   Each entry also carries the concise scientific content required for
   that mode (definition / scope / typical interpretation / what it does
   NOT tell you). Detection is run live against 07-rules.js — nothing here
   pre-computes trigger points; the UI calls the real detector.
   ------------------------------------------------------------------------- */
const RULE_DEFINITIONS = [
  {
    id: "12s", label: "1₂s", status: "warning",
    definition: "A single control measurement exceeds +2 SD or −2 SD.",
    scope: "Single measurement.",
    typicalInterpretation: "In the traditional multirule procedure, 1₂s functions as a warning criterion — it prompts inspection for rejection-rule violations, rather than acting as a rejection criterion itself.",
    whatItDoesNotTellYou: "It does not, by itself, identify a specific analytical cause, and in this application it never results in an automatic run rejection.",
    demoRuns: [rrun(1, 0.4, -0.3), rrun(2, -0.3, 0.5), rrun(3, 2.3, 0.4), rrun(4, -0.2, 0.3), rrun(5, 0.5, -0.4)]
  },
  {
    id: "13s", label: "1₃s", status: "rejection",
    definition: "A single control measurement exceeds +3 SD or −3 SD.",
    scope: "Single measurement.",
    typicalInterpretation: "Classified here as a rejection criterion. Such an extreme observation may be compatible with a substantial analytical disturbance.",
    whatItDoesNotTellYou: "It does not, by itself, prove a specific cause (e.g. calibration, reagent, or instrument failure) — investigation is required before attributing a mechanism.",
    demoRuns: [rrun(1, 0.3, -0.2), rrun(2, -0.4, 0.3), rrun(3, -3.2, 0.2), rrun(4, 0.2, -0.3), rrun(5, 0.4, -0.1)]
  },
  {
    id: "22s", label: "2₂s", status: "rejection",
    definition: "Two consecutive control measurements exceed the SAME +2 SD or the SAME −2 SD limit.",
    scope: "Within one run across two materials, OR within one material across two consecutive runs.",
    typicalInterpretation: "Traditionally associated with possible systematic displacement of the analytical process.",
    whatItDoesNotTellYou: "It does not by itself identify a cause, and it never triggers when the two observations are on opposite sides of the mean.",
    demoRuns: [rrun(1, 0.3, -0.2), rrun(2, -0.4, 0.3), rrun(3, 2.3, 2.2), rrun(4, 0.2, -0.3), rrun(5, 0.4, -0.1)]
  },
  {
    id: "r4s", label: "R₄s", status: "rejection",
    definition: "Within the SAME run, one control result exceeds +2 SD while another exceeds −2 SD (a within-run range greater than 4 SD).",
    scope: "Within one run, across materials — evaluated within a single run only in this application.",
    typicalInterpretation: "Traditionally useful for detecting increased random analytical variation.",
    whatItDoesNotTellYou: "It does not prove that a specific random-error mechanism occurred, and — importantly — an apparent >4 SD separation across two DIFFERENT runs is not R₄s in this application.",
    demoRuns: [rrun(1, 0.3, -0.2), rrun(2, -0.4, 0.3), rrun(3, 2.4, -2.3), rrun(4, 0.2, -0.3), rrun(5, 0.4, -0.1)]
  },
  {
    id: "41s", label: "4₁s", status: "rejection",
    definition: "Four consecutive control measurements exceed the SAME +1 SD or the SAME −1 SD limit.",
    scope: "Within one material across four consecutive runs, OR across both materials over two consecutive runs.",
    typicalInterpretation: "Traditionally associated with a persistent systematic displacement.",
    whatItDoesNotTellYou: "It does not by itself identify a cause, and unrelated, nonconsecutive observations are never combined to satisfy it.",
    demoRuns: [rrun(1, 0.3, -0.2), rrun(2, 1.2, 0.3), rrun(3, 1.3, -0.4), rrun(4, 1.1, 0.2), rrun(5, 1.4, -0.1)]
  },
  {
    id: "10x", label: "10x", status: "rejection",
    definition: "Ten consecutive control measurements fall strictly on the same side of the mean (a value exactly equal to the mean interrupts the sequence).",
    scope: "Within one material across ten consecutive runs, OR across both materials across five consecutive runs.",
    typicalInterpretation: "Traditionally associated with a persistent systematic displacement, often smaller in magnitude than would trigger 4₁s.",
    whatItDoesNotTellYou: "It does not by itself identify a cause, and only the sign of each result matters — not its magnitude.",
    configurationNote: "10x uses a ten-observation same-side window. 8x (below) uses an eight-observation window. Neither is a substitute for the other — see 8x for why both exist.",
    demoRuns: [1, 2, 3, 4, 5].map(n => rrun(n, 0.4, 0.3))
  },
  {
    id: "8x", label: "8x", status: "rejection",
    definition: "Eight consecutive control measurements fall strictly on the same side of the mean (a value exactly equal to the mean interrupts the sequence).",
    scope: "Within one material across eight consecutive runs (N=1 control measurement per run for that material, R=8 consecutive runs; N × R = 8), OR across both materials across four consecutive runs (N=2 control measurements per run, R=4 consecutive runs; N × R = 8).",
    typicalInterpretation: "Traditionally associated with a persistent systematic displacement, often smaller in magnitude than would trigger 4₁s. 8x uses a shorter same-side run length than 10x, so it can flag a persistent same-side pattern slightly sooner.",
    whatItDoesNotTellYou: "It does not by itself identify a cause, and only the sign of each result matters — not its magnitude.",
    configurationNote: "Added in v0.3.1 (this N/R explanation corrected in v0.3.2). 8x, 10x, and other same-side consecutive-run rules exist as a family because N (control measurements available per run) and R (consecutive runs inspected) can be chosen to fit a laboratory's own QC procedure configuration, provided N × R gives the intended sequence length — an 8x procedure can use N=2 and R=4, or N=1 and R=8, or N=4 and R=2, among others. The demonstration above uses the within-one-material form (N=1, R=8) because it is the simplest to show on a single-material chart; it is useful for understanding the rule mathematically but is NOT the configuration used by the QC Strategy Lab's Sigma-mapping Procedure D, which instead uses the across-materials form (N=2, R=4) — see QC Strategy Lab → \"What do N and R mean?\" for the general definitions. 8x is not a universal replacement for 10x: both are independently validated and separately taught in this application, and a QC procedure that specifies one does not imply the other is equivalent or interchangeable.",
    demoRuns: [rrun(1, 0.2, -0.1), rrun(2, 0.4, 0.1), rrun(3, 0.1, -0.2), rrun(4, 0.8, 0.1), rrun(5, 0.3, -0.1), rrun(6, 0.7, 0.2), rrun(7, 0.5, -0.1), rrun(8, 0.2, 0.1)]
  }
];

/* -------------------------------------------------------------------------
   "Inspect a QC Sequence" — one deterministic, richer multilevel sequence
   with several embedded (genuine) events for free rule-by-rule exploration.
   ------------------------------------------------------------------------- */
const INSPECTOR_DEFAULT_RUNS = [
  rrun(1, 0.3, -0.2), rrun(2, -0.5, 0.4), rrun(3, 0.4, -0.6), rrun(4, -0.2, 0.3),
  rrun(5, 2.3, 0.5), rrun(6, -0.3, 0.5), rrun(7, 0.1, -0.3), rrun(8, -0.4, 0.2),
  rrun(9, 0.5, -0.3), rrun(10, -3.2, 0.2), rrun(11, 0.2, -0.1), rrun(12, -0.3, 0.4),
  rrun(13, 2.4, -2.3), rrun(14, 0.1, -0.2), rrun(15, -2.2, 0.3), rrun(16, -2.3, -0.1),
  rrun(17, 1.2, 1.3), rrun(18, 1.4, 1.1), rrun(19, -0.2, 0.3), rrun(20, 0.3, -0.4)
];

/* -------------------------------------------------------------------------
   "Rule Detective" — 12 deterministic cases, each verified against the
   actual engine (07-rules.js) while authoring this file. At least 3 of the
   12 (25%) contain NO rejection-rule violation, per spec.
   ------------------------------------------------------------------------- */
const RULE_OPTIONS_FOR_CHALLENGE = [
  { id: "none", label: "No defined rule violation" },
  { id: "12s", label: "1₂s warning only" },
  { id: "13s", label: "1₃s" },
  { id: "22s", label: "2₂s" },
  { id: "r4s", label: "R₄s" },
  { id: "41s", label: "4₁s" },
  { id: "10x", label: "10x" }
];
const SCOPE_OPTIONS_FOR_CHALLENGE = [
  { id: "single", label: "Single observation" },
  { id: "within-run", label: "Within-run" },
  { id: "across-runs", label: "Across runs" },
  { id: "across-materials", label: "Across materials" },
  { id: "across-materials-and-runs", label: "Across materials and runs" }
];

const DETECTIVE_CASES = [
  {
    id: 1, title: "Case 1", correctRules: ["none"], correctScope: null,
    runs: [rrun(1, 0.3, -0.2), rrun(2, -0.5, 0.4), rrun(3, 0.4, -0.6), rrun(4, -0.2, 0.3), rrun(5, 0.6, -0.1), rrun(6, -0.3, 0.5), rrun(7, 0.1, -0.3), rrun(8, -0.4, 0.2)],
    whatItSuggests: "A visually unremarkable, apparently stable two-level process.",
    whatItDoesNotProve: "It does not prove the process will remain stable in future runs.",
    temptingAlternative: "No value here comes close to any control limit, so no rule (including 1₂s) is even a plausible alternative."
  },
  {
    id: 2, title: "Case 2", correctRules: ["12s"], correctScope: "single",
    runs: [rrun(1, 0.3, -0.2), rrun(2, -0.5, 0.4), rrun(3, 2.3, 0.5), rrun(4, -0.2, 0.3), rrun(5, 0.6, -0.1), rrun(6, -0.3, 0.5), rrun(7, 0.1, -0.3), rrun(8, -0.4, 0.2)],
    whatItSuggests: "An isolated warning-level excursion. In the traditional workflow this prompts inspection for rejection-rule violations — none are present here.",
    whatItDoesNotProve: "It does not by itself justify rejecting the run, and does not identify a cause.",
    temptingAlternative: "It may look like it could also satisfy 2₂s, since both materials were measured in the same run, but only the Level 1 result exceeds 2 SD — Level 2 remains well within limits, so the two-material condition is not met."
  },
  {
    id: 3, title: "Case 3", correctRules: ["13s"], correctScope: "single",
    runs: [rrun(1, 0.3, -0.2), rrun(2, -0.5, 0.4), rrun(3, 0.4, -0.6), rrun(4, -3.2, 0.3), rrun(5, 0.6, -0.1), rrun(6, -0.3, 0.5), rrun(7, 0.1, -0.3), rrun(8, -0.4, 0.2)],
    whatItSuggests: "A single extreme observation compatible with a substantial analytical disturbance.",
    whatItDoesNotProve: "It does not identify a specific mechanism (calibration, reagent, instrument, or otherwise).",
    temptingAlternative: "This observation also mathematically exceeds 2 SD, so it technically satisfies 1₂s as well — any point beyond 3 SD is automatically also beyond 2 SD. But 1₃s is the more specific, more severe classification for a point this extreme, and it is the rule graded as correct here."
  },
  {
    id: 4, title: "Case 4", correctRules: ["22s"], correctScope: "across-materials",
    runs: [rrun(1, 0.3, -0.2), rrun(2, -0.5, 0.4), rrun(3, 2.3, 2.2), rrun(4, -0.2, 0.3), rrun(5, 0.6, -0.1), rrun(6, -0.3, 0.5), rrun(7, 0.1, -0.3), rrun(8, -0.4, 0.2)],
    whatItSuggests: "Both control materials exceed the same 2 SD limit in the same run — compatible with possible systematic displacement.",
    whatItDoesNotProve: "It does not identify which specific process step changed.",
    temptingAlternative: "The two values are on the same side and both extreme, which might suggest R₄s, but R₄s requires one result above +2 SD AND another below −2 SD in the same run — here both results are on the SAME side, so R₄s is not satisfied."
  },
  {
    id: 5, title: "Case 5", correctRules: ["22s"], correctScope: "across-runs",
    runs: [rrun(1, 0.3, -0.2), rrun(2, -0.5, 0.4), rrun(3, -2.2, -0.6), rrun(4, -2.3, 0.3), rrun(5, 0.6, -0.1), rrun(6, -0.3, 0.5), rrun(7, 0.1, -0.3), rrun(8, -0.4, 0.2)],
    whatItSuggests: "The same control material exceeds the same 2 SD limit in two consecutive runs — compatible with possible systematic displacement.",
    whatItDoesNotProve: "It does not identify which specific process step changed.",
    temptingAlternative: "Two extreme same-side results in a row might suggest 4₁s is close behind, but 4₁s requires four consecutive results beyond ±1 SD, not two beyond ±2 SD — these are different rules built on different magnitude thresholds and different run counts."
  },
  {
    id: 6, title: "Case 6", correctRules: ["r4s"], correctScope: "within-run",
    runs: [rrun(1, 0.3, -0.2), rrun(2, -0.5, 0.4), rrun(3, 2.4, -2.3), rrun(4, -0.2, 0.3), rrun(5, 0.6, -0.1), rrun(6, -0.3, 0.5), rrun(7, 0.1, -0.3), rrun(8, -0.4, 0.2)],
    whatItSuggests: "A within-run range greater than 4 SD between the two materials — traditionally useful for detecting increased random variation.",
    whatItDoesNotProve: "It does not prove a specific random-error mechanism occurred.",
    temptingAlternative: "Both values exceed 2 SD in magnitude, which might suggest 2₂s, but 2₂s requires both results on the SAME side of the mean — here one is above +2 SD and the other below −2 SD, opposite sides, so 2₂s is explicitly not satisfied."
  },
  {
    id: 7, title: "Case 7", correctRules: ["none"], correctScope: null,
    runs: [rrun(1, 0.3, -0.2), rrun(2, -0.5, 0.4), rrun(3, 2.6, 0.3), rrun(4, 0.2, -2.5), rrun(5, 0.6, -0.1), rrun(6, -0.3, 0.5), rrun(7, 0.1, -0.3), rrun(8, -0.4, 0.2)],
    whatItSuggests: "Two isolated warning-level points in different runs. Although their z-scores span more than 4 SD, they occurred in different runs.",
    whatItDoesNotProve: "This is NOT R₄s — R₄s is evaluated within a single run only in this application. A cross-run separation, however large, does not satisfy it.",
    temptingAlternative: "It is tempting to combine the run 3 and run 4 excursions into a single 'R₄s-like' event because their total spread exceeds 4 SD, but R₄s is defined and evaluated strictly within one run — there is no rule in this application that aggregates excursions across different runs."
  },
  {
    id: 8, title: "Case 8", correctRules: ["41s"], correctScope: "across-runs",
    runs: [rrun(1, 0.3, -0.2), rrun(2, 1.2, 0.4), rrun(3, 1.3, -0.6), rrun(4, 1.1, 0.3), rrun(5, 1.4, -0.1), rrun(6, -0.3, 0.5), rrun(7, 0.1, -0.3), rrun(8, -0.4, 0.2)],
    whatItSuggests: "Four consecutive results for one control material exceed the same 1 SD limit — compatible with a persistent systematic displacement.",
    whatItDoesNotProve: "It does not identify which specific process step changed.",
    temptingAlternative: "It might seem like this sequence could also be building toward 10x, but 10x requires ten consecutive same-side results for one material (or five across both materials) — this sequence has only four, which is exactly the count that satisfies 4₁s, not 10x."
  },
  {
    id: 9, title: "Case 9", correctRules: ["41s"], correctScope: "across-materials-and-runs",
    runs: [rrun(1, 0.3, -0.2), rrun(2, -0.5, 0.4), rrun(3, 1.2, 1.3), rrun(4, 1.4, 1.1), rrun(5, 0.6, -0.1), rrun(6, -0.3, 0.5), rrun(7, 0.1, -0.3), rrun(8, -0.4, 0.2)],
    whatItSuggests: "Both control materials exceed the same 1 SD limit across two consecutive runs — compatible with a persistent systematic displacement.",
    whatItDoesNotProve: "It does not identify which specific process step changed.",
    temptingAlternative: "The same-run pairing might suggest 2₂s, but 2₂s requires both results to exceed the same 2 SD limit — here they exceed only 1 SD, which is the threshold that defines 4₁s, not 2₂s."
  },
  {
    id: 10, title: "Case 10", correctRules: ["10x"], correctScope: "across-runs",
    runs: [rrun(1, 0.3, -0.4), rrun(2, 0.5, 0.3), rrun(3, 0.2, -0.5), rrun(4, 0.8, 0.4), rrun(5, 0.4, -0.3), rrun(6, 0.6, 0.2), rrun(7, 0.1, -0.4), rrun(8, 0.9, 0.3), rrun(9, 0.3, -0.2), rrun(10, 0.5, 0.4)],
    whatItSuggests: "Ten consecutive results for one control material fall on the same side of the mean — compatible with a persistent, possibly small, systematic displacement.",
    whatItDoesNotProve: "It does not identify which specific process step changed, and none of the individual values need to be extreme.",
    temptingAlternative: "It might look like a series of 1₂s warnings or a building 4₁s pattern, but no individual value here exceeds even 1 SD — this rule is defined purely by the consistent sign of ten consecutive results, which is what makes 10x distinct from the magnitude-based rules."
  },
  {
    id: 11, title: "Case 11", correctRules: ["10x"], correctScope: "across-materials-and-runs",
    runs: [rrun(1, -0.3, -0.4), rrun(2, -0.5, -0.3), rrun(3, -0.2, -0.5), rrun(4, -0.8, -0.4), rrun(5, -0.4, -0.3)],
    whatItSuggests: "Both control materials fall on the same side of the mean across five consecutive runs — compatible with a persistent systematic displacement.",
    whatItDoesNotProve: "It does not identify which specific process step changed.",
    temptingAlternative: "Because every value here is negative, it may look like a series of 2₂s or 4₁s events, but no individual magnitude exceeds 1 SD or 2 SD — only the consistent sign across both materials and five runs satisfies a rule, and that rule is the across-materials form of 10x."
  },
  {
    id: 12, title: "Case 12", correctRules: ["none"], correctScope: null,
    runs: [rrun(1, 1.8, -0.3), rrun(2, -1.7, 0.4), rrun(3, 1.6, -0.4), rrun(4, -1.9, 0.3), rrun(5, 1.7, -0.2), rrun(6, -1.8, 0.4), rrun(7, 1.6, -0.3), rrun(8, -1.7, 0.2)],
    whatItSuggests: "A visually busy, oscillating pattern — but no individual value exceeds 2 SD, no same-side run of four or ten occurs, and no within-run range exceeds 4 SD.",
    whatItDoesNotProve: "A visually unusual chart is not, by itself, evidence of a defined rule violation.",
    temptingAlternative: "The alternating, visually dramatic swings might suggest 2₂s or R₄s, but no single value in either material exceeds 2 SD, so none of the magnitude-based rejection rules are mathematically satisfied no matter how the points are grouped."
  }
];

/* -------------------------------------------------------------------------
   Cross-cutting explanatory text
   ------------------------------------------------------------------------- */
const RUN_CONCEPT_NOTE = "An analytical run is the interval or group of patient results over which a QC decision is made — for example, a shift, a calibration cycle, or a fixed number of patient samples. It is not necessarily equivalent to one calendar day, and its exact definition depends on the analytical system and the laboratory's own QC strategy.";

const CLASSIC_MODE_NOTE = "Classic warning-gated: 1₂s is used as a warning trigger. When it occurs, the traditional workflow calls for inspecting the rejection criteria (1₃s, 2₂s, R₄s, 4₁s, 10x) before deciding whether to reject the run.";
const DIRECT_MODE_NOTE = "Direct evaluation: every enabled rejection rule is evaluated directly, without requiring 1₂s to act as a gate. Computerized QC systems can do this in real time. Neither workflow is universally superior — they represent different, equally legitimate ways of organising the same underlying detection logic.";

const FALSE_REJECTION_NOTE = "Applying more QC rules can improve error detection, but may also increase the probability of falsely rejecting an analytical run that is not actually in error (false rejection). This trade-off is introduced here only qualitatively — this build does not calculate probability of error detection (Ped) or probability of false rejection (Pfr), and does not display operating-specification (OPSpecs) charts or recommend rule sets based on Sigma. Those belong to a later QC-design module.";

const DECISION_GUARDRAIL_NOTE = "A rule violation means exactly this: the mathematical condition for that rule was met by these observations. It does not, by itself, establish which analytical cause is responsible (for example calibration failure, reagent deterioration, pipetting error, or instrument malfunction), and it does not automatically invalidate patient results. Those judgements require investigation and belong to the laboratory's own QC procedure.";

const RULE_LAB_INTRO = "The Rule Laboratory teaches statistical QC rules by having you observe a QC sequence, identify which rule (if any) applies, locate exactly which observations caused it, understand whether it evaluates one run or spans several, and interpret what that pattern does and does not establish. It does not replace judgement about the underlying analytical cause.";
