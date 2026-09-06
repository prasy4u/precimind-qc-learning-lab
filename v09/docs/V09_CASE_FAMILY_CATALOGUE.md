# Morning QC Room — Case Family Catalogue (Design Only, Not Implemented)

**Status:** Design proposal for future Stage 12C. No case data is written yet.

Each family below is a teaching pattern, not a specific case. Multiple concrete cases may be authored per family in Stage 12C.

---

## A. Random QC Excursion Without Sustained Failure
- **Teaching purpose:** Distinguish common-cause noise from a true analytical signal.
- **Relevant competencies:** Statistics, LJ interpretation, multirule QC.
- **Misleading-but-plausible information:** A single out-of-range point that looks alarming but is isolated.
- **Required decisions:** Recognize the pattern as non-sustained; decide whether repeat testing or immediate hold is warranted.
- **Forbidden deterministic inference:** "One high point = reagent lot failure."
- **Debrief concept:** Random variation vs. systematic signal; base rate of false alarms.

## B. Persistent Analytical Shift After Reagent Lot Change
- **Teaching purpose:** Recognize a sustained shift and correlate timing with a plausible cause without assuming causation.
- **Relevant competencies:** LJ interpretation, pattern recognition, investigation.
- **Misleading-but-plausible information:** Lot change coincides with shift, but calibration also occurred nearby in time.
- **Required decisions:** Identify shift onset; generate hypotheses (lot vs. calibration vs. other); select evidence to discriminate.
- **Forbidden deterministic inference:** "Lot changed near the shift, therefore lot is the cause."
- **Debrief concept:** Correlation vs. causation; competing hypothesis testing.

## C. Increased Imprecision
- **Teaching purpose:** Recognize increased scatter distinct from a mean shift.
- **Relevant competencies:** Statistics (SD/CV), pattern recognition, Sigma.
- **Misleading-but-plausible information:** Mean appears unchanged, masking a true precision problem.
- **Required decisions:** Correctly classify the pattern as imprecision, not shift; assess Sigma impact.
- **Forbidden deterministic inference:** "Mean is on target, so nothing is wrong."
- **Debrief concept:** Imprecision vs. inaccuracy; effect on Sigma and false-rejection rates.

## D. Calibration-Associated Shift
- **Teaching purpose:** Evaluate a shift temporally associated with a calibration event.
- **Relevant competencies:** Investigation, LJ interpretation, risk reasoning.
- **Misleading-but-plausible information:** Calibration "should" have improved performance; learner may wrongly assume post-cal data is automatically trustworthy.
- **Required decisions:** Verify calibration adequacy with evidence, not assumption.
- **Forbidden deterministic inference:** "Calibration was performed, therefore the system is now correct."
- **Debrief concept:** Verification after intervention is mandatory, not optional.

## E. QC Failure With No Obvious Patient Impact
- **Teaching purpose:** Separate QC failure from patient-impact determination.
- **Relevant competencies:** Patient impact, risk reasoning, investigation.
- **Misleading-but-plausible information:** QC clearly failed, tempting an assumption of definite patient harm.
- **Required decisions:** Conduct patient-impact review; conclude appropriately even when impact is minimal or absent.
- **Forbidden deterministic inference:** "QC failed, therefore all patient results in the run are wrong."
- **Debrief concept:** QC failure is a signal for review, not proof of harm.

## F. QC Signal With Patient-Result Review Required
- **Teaching purpose:** Execute a genuine patient-impact review workflow.
- **Relevant competencies:** Patient impact, BV/RCV, risk reasoning.
- **Misleading-but-plausible information:** Some patient results are outside the candidate window and look concerning but may be clinically insignificant.
- **Required decisions:** Correctly bound the review window; assess result-by-result significance.
- **Forbidden deterministic inference:** Assuming every result in the shift is affected equally.
- **Debrief concept:** Bounded review windows; RCV-informed significance assessment.

## G. High-Sigma Assay Where Excessive QC Frequency Has Been Used
- **Teaching purpose:** Recognize over-testing relative to assay performance.
- **Relevant competencies:** Sigma, QC frequency, QC procedure design.
- **Misleading-but-plausible information:** "More QC is always safer" is a plausible but wrong intuition.
- **Required decisions:** Recommend a more efficient, evidence-based QC frequency.
- **Forbidden deterministic inference:** None specific — this case targets an intuition trap, not a causal shortcut.
- **Debrief concept:** Risk-based QC frequency; diminishing returns of excessive testing.

## H. Low-Sigma Assay Requiring Stronger Control Strategy
- **Teaching purpose:** Recognize inadequate QC strategy for a poorly performing assay.
- **Relevant competencies:** Sigma, QC procedure design, APS.
- **Misleading-but-plausible information:** Existing QC procedure looks "standard" but is insufficient for this Sigma level.
- **Required decisions:** Design or recommend a stronger multirule/frequency strategy.
- **Forbidden deterministic inference:** None specific.
- **Debrief concept:** Sigma-based QC design (Westgard/Sigma-metric approach).

## I. Stable IQC but Problematic EQA
- **Teaching purpose:** Recognize that internal QC and external assessment can disagree.
- **Relevant competencies:** External assurance, investigation, comparability.
- **Misleading-but-plausible information:** "IQC is fine" is used to wrongly dismiss an EQA problem.
- **Required decisions:** Investigate EQA discordance despite reassuring IQC.
- **Forbidden deterministic inference:** "IQC is in control, therefore the EQA result must be an outlier/error."
- **Debrief concept:** IQC precision vs. EQA trueness/comparability — different questions.

## J. PBRTQC Alert With Stable Conventional IQC
- **Teaching purpose:** Recognize that PBRTQC can detect signals IQC misses.
- **Relevant competencies:** PBRTQC, investigation, risk reasoning.
- **Misleading-but-plausible information:** "IQC passed, so nothing is wrong" is a tempting but incorrect dismissal.
- **Required decisions:** Take the PBRTQC alert seriously and investigate independently of IQC status.
- **Forbidden deterministic inference:** "IQC passed, therefore the PBRTQC alert must be a false alarm."
- **Debrief concept:** Complementary detection — IQC and PBRTQC monitor different things.

## K. Apparent PBRTQC Alert Caused by Population Shift
- **Teaching purpose:** Recognize a PBRTQC alert driven by patient population change, not analytical error.
- **Relevant competencies:** PBRTQC, patient distribution reasoning, investigation.
- **Misleading-but-plausible information:** Alert pattern resembles an analytical shift.
- **Required decisions:** Distinguish population-driven change from analytical error using available context (e.g., ward mix, seasonal effects).
- **Forbidden deterministic inference:** "PBRTQC alerted, therefore the analyzer has an error."
- **Debrief concept:** PBRTQC signal specificity limitations; population confounding.

## L. Discordant IQC and PBRTQC Information
- **Teaching purpose:** Reason under genuine conflicting evidence.
- **Relevant competencies:** PBRTQC, IQC interpretation, investigation, risk reasoning.
- **Misleading-but-plausible information:** Both signals seem to point to different conclusions.
- **Required decisions:** Weigh evidence without forcing false resolution; may require seeking more evidence.
- **Forbidden deterministic inference:** Arbitrarily picking one signal as "the truth" without justification.
- **Debrief concept:** Living with genuine uncertainty; evidence weighing.

## M. Biological Variation / Serial-Result Interpretation Embedded in QC Review
- **Teaching purpose:** Apply RCV reasoning within a QC-review context.
- **Relevant competencies:** BV/RCV, patient impact, statistics.
- **Misleading-but-plausible information:** A patient's serial change looks concerning but is within expected biological + analytical variation.
- **Required decisions:** Apply RCV correctly to determine if the serial change is significant.
- **Forbidden deterministic inference:** "The result changed, therefore something is wrong with the patient or the assay."
- **Debrief concept:** RCV as the correct threshold for serial-result significance.

## N. Multiple Concurrent Analyzer Events Requiring Prioritisation
- **Teaching purpose:** Practice triage under multiple simultaneous demands.
- **Relevant competencies:** Risk reasoning, investigation, QC procedure, patient impact.
- **Misleading-but-plausible information:** The most visually dramatic event may not be the most clinically urgent.
- **Required decisions:** Correctly prioritize which event to address first based on patient risk, not salience.
- **Forbidden deterministic inference:** "The biggest QC deviation must be the most urgent issue."
- **Debrief concept:** Risk-based prioritization; salience bias.

## O. Incomplete-Information Case Where the Correct Decision Is to Seek More Evidence
- **Teaching purpose:** Recognize when the correct action is deferral pending more evidence, not a premature decision.
- **Relevant competencies:** Investigation, metacognitive calibration, evidence selection.
- **Misleading-but-plausible information:** Available information seems to point toward a decision, but critical evidence is missing.
- **Required decisions:** Choose to seek specific additional evidence rather than act prematurely.
- **Forbidden deterministic inference:** Forcing a conclusion from incomplete evidence.
- **Debrief concept:** Appropriate uncertainty; premature closure as a reasoning failure.

## P. Recovery Verification / Premature-Release Trap
- **Teaching purpose:** Test whether the learner verifies recovery before resuming/releasing.
- **Relevant competencies:** Investigation, verification, governance.
- **Misleading-but-plausible information:** An intervention has been performed and looks like it should have fixed the problem.
- **Required decisions:** Require verification evidence before declaring recovery and releasing results/resuming testing.
- **Forbidden deterministic inference:** "The intervention was performed, therefore the system is fixed."
- **Debrief concept:** Verification-before-release doctrine; premature release as a patient-safety risk.

---

*This catalogue is a design artifact for Stage 12C case authoring. No case data, scoring, or engine logic exists yet.*
