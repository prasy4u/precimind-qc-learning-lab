# PreciMind QC Learning Lab v0.9 — Stage 12D Case Scientific Review

Instructor/developer-facing only. For each new case: hidden truth,
scientific rationale, evidence hierarchy, the dangerous misconception
being tested, accepted disposition, and why it's distinct from existing
cases.

## Case 4 — Isolated Excursion (Family A)
**Hidden truth:** a single random common-cause exceedance; no sustained
disturbance. **Rationale:** teaches that a genuine 1_3s violation still
warrants pausing, but repeat-confirmed normal performance is decisive
against a sustained problem — no lot/calibration intervention is needed.
**Evidence hierarchy:** ev-repeat-normal is decisive; the no-lot-change/
no-recent-cal evidence is supportive only. **Misconception targeted:**
"any out-of-range point means a lot or calibration problem." **Disposition:**
resume after repeat confirms random variation. **Distinctness:** the only
case where the correct disposition requires *no* intervention decision at all.

## Case 5 — Increased Imprecision (Family C)
**Hidden truth:** a genuine imprecision problem (failing pipetting probe)
masked by an on-target mean. **Rationale:** IQC's mean/SD are independent
axes; a passing mean does not rule out a real precision problem, which
Sigma quantifies as clinically significant. **Evidence hierarchy:**
ev-probe-flagged is decisive; SD-widened/Sigma-degraded evidence is
supportive. **Misconception targeted:** "if the mean is on target, QC is
fine." **Disposition:** hold, service the probe, verify SD recovery.
**Distinctness:** the only case centered on precision (SD) rather than
accuracy (mean).

## Case 6 — Calibration Shift (Family D)
**Hidden truth:** the calibration itself was genuinely inadequate (high
calibrator recovery out of range). **Rationale:** temporal association
(shift right after calibration) is not proof of cause — the calibration
record itself must be checked. **Evidence hierarchy:**
ev-cal-high-recovery-out is decisive. **Misconception targeted:** "a
calibration was performed, therefore the system is now correct."
**Disposition:** hold, recalibrate correctly, verify. **Distinctness:**
paired with Case 12 (see below) as the two "verify the intervention,
don't assume it worked" cases — here the intervention (recalibration)
genuinely fixes the true cause.

## Case 7 — No Patient Impact (Family E)
**Hidden truth:** a genuine, brief environmental (HVAC) disturbance; no
patient results were actually affected. **Rationale:** a confirmed QC
failure never proves every result in the window is wrong — "no affected
results" must be *reached* through a real review, never assumed either
direction. **Evidence hierarchy:** ev-patient-results-reviewed is
decisive for the patient-impact terminal state. **Misconception
targeted:** "all results in the affected window are automatically
wrong" AND (the opposite trap) "the cause resolved itself, so review can
be skipped." **Disposition:** resume after verified QC recovery and
genuine patient-impact review. **Distinctness:** the only case whose
correct patient-impact terminal state is COMPLETED_NO_AFFECTED_RESULTS
reached through active review, not default absence.

## Case 8 — EQA Discordance (Family I)
**Hidden truth:** a known, expected diazo-method bias relative to the
all-methods peer group — not a laboratory error. **Rationale:** IQC
(precision/stability) and EQA (trueness) answer different questions; a
stable IQC record can never be used to dismiss an EQA discordance.
**Evidence hierarchy:** ev-method-subgroup-closer is decisive.
**Misconception targeted:** "IQC is fine, so the EQA result must be
wrong." **Disposition:** document the method-specific interpretation, no
analytical hold needed. **Distinctness:** the only case with no
containment decision at all — appropriately, since no analytical
disturbance exists.

## Case 9 — Seek More Evidence (Family O)
**Hidden truth:** a minor, run-specific aspiration irregularity; the
concurrently-introduced reagent lot is NOT the cause. **Rationale:** two
hypotheses can be genuinely, simultaneously plausible from available
evidence; the expert move is obtaining the ONE discriminating piece of
evidence (a repeat on the same lot) before concluding anything.
**Evidence hierarchy:** ev-repeat-discriminates is the only decisive
evidence — both panel findings alone are merely supportive.
**Misconception targeted:** premature closure — picking whichever
explanation is noticed first. **Disposition:** hold, obtain the
discriminating repeat, then resume. **Distinctness:** the only case
explicitly designed around metacognitive calibration under genuine
two-hypothesis ambiguity.

## Case 10 — Premature-Release Trap (Family P)
**Hidden truth:** an overdue ISE reference-junction replacement,
coincidentally masked by a simultaneous (but non-causal) reagent lot
change. **Rationale:** an intervention that looks like it should work
(reverting the lot) is not itself verification — QC must confirm actual
recovery, and a failed verification attempt should trigger further
investigation, not resignation or resuming anyway. **Evidence
hierarchy:** ev-first-repeat-still-high is decisive against the lot
hypothesis; ev-second-repeat-normal is decisive for genuine recovery.
**Misconception targeted:** "the intervention was applied, so it must
have worked." **Disposition:** hold, revert lot (fails), replace
electrode (succeeds), verify, resume. **Distinctness:** the only case
with a genuinely failed first intervention attempt built into its
canonical expert path.

## Case 11 — Concurrent Triage (Family N)
**Hidden truth:** two genuinely independent signals — TSH calibration
drift (real, sustained) and glucose random noise (benign, isolated).
**Rationale:** the more visually dramatic single-run deviation (glucose)
is not automatically the more urgent problem; a sustained trend in a
higher-stakes analyte (TSH) is the genuine priority, and each signal
must be verified independently rather than assumed to share one cause.
**Evidence hierarchy:** ev-tsh-cal-overdue is decisive for TSH;
ev-glucose-repeat-normal is decisive for glucose, independently.
**Misconception targeted:** salience bias (dramatic looks = urgent) and
false common-cause assumption. **Disposition:** hold both, prioritize
TSH, recalibrate, verify both independently, resume both. **Distinctness:**
the only case with two concurrent, independently-resolved signals.

## Case 12 — Maintenance Coincidence (Family D-variant)
**Hidden truth:** a failing photometric light source, coincidentally
overlapping with adequately-performed scheduled maintenance.
**Rationale:** a root cause cannot be inferred merely from temporal
association — here, unlike Case 6, the intervention-adjacent record
(maintenance) genuinely WAS adequate, and the correct expert move is to
keep investigating past that point to find the true, independent cause.
**Evidence hierarchy:** ev-maintenance-adequate is decisive against the
maintenance hypothesis; ev-light-source-flagged is decisive for the true
cause. **Misconception targeted:** both "the maintenance must have been
done badly" AND (the opposite trap) "the maintenance record checked out,
so the investigation is over." **Disposition:** hold, confirm maintenance
adequate, find and replace the light source, verify, resume.
**Distinctness:** deliberately paired with Case 6 as the "temporal
association is not causation" family, but with the intervention record
found ADEQUATE rather than inadequate — testing the opposite failure
mode within the same family.
