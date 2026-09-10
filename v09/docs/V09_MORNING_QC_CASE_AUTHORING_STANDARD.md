# PreciMind QC Learning Lab v0.9 — Morning QC Case Authoring Standard

Every Morning QC case, existing or new, must document the following
before being added to the production case bank. This standard exists to
prevent cases from becoming arbitrary stories disconnected from genuine
laboratory QC doctrine.

## Required documentation per case

1. **Learning objective** — the single reasoning skill this case is
   designed to test, in one sentence.
2. **Signal** — what the learner first observes (the `groundTruth.observedSignal`).
3. **Hidden analytical truth** — `disturbanceEstablished`,
   `rootCauseEstablished`, `signalExplanationEstablished`, and their
   descriptions. Stated explicitly, since these three booleans are
   independent axes (Stage 12A doctrine) and are the single most
   common source of scientifically incoherent cases if conflated.
4. **Plausible competing hypotheses** — every hypothesis the case
   authors, and which the case's `evidenceForHypotheses` genuinely
   supports/weakens/is decisive for.
5. **Panel architecture** — every panel's type, availability phase, and
   `relevance` (RELEVANT/IRRELEVANT/CONDITIONALLY_RELEVANT).
6. **Evidence hierarchy** — which evidence is `decisive` vs merely
   `relevant`, and its gating (`sourcePanelId`/`availableOnlyAfterActionType`).
7. **Irrelevant/distraction information** — panels/evidence deliberately
   included that a strong learner should recognize as unnecessary.
8. **Immediate containment logic** — what the case-authored containment
   decision (if any) requires to be appropriate.
9. **Patient-impact logic** — the intended `patientImpactStatus` and why.
10. **Intervention logic** — whether a case-authored intervention exists,
    and its `requiredEvidenceIdsForSupportedReasoning`.
11. **Verification criteria** — what genuinely constitutes recovery.
12. **Disposition** — the `groundTruth.appropriateDisposition`.
13. **Debrief teaching message** — the one or two sentences a strong
    learner should walk away understanding (feeds
    `debriefEvidence.strongPathDescription`).
14. **Expected competency dimensions** — which of the 12
    `SCORING_DIMENSIONS` this case genuinely exercises.
15. **Known unsafe shortcuts** — the specific plausible-but-wrong
    inferences this case is designed to catch (feeds
    `debriefEvidence.commonMisconceptions`).
16. **Expected expert path** — the exact action sequence a strong
    learner would take, used directly as the case's expert-path test.

## Non-negotiable scientific doctrine

Every case must respect the accepted Stage 12A/12D scientific rules,
including but not limited to:

- Stable IQC does not prove trueness.
- Poor EQA does not automatically establish patient bias.
- Peer mean is not necessarily truth.
- RCV exceedance does not establish disease or a specific biological cause.
- PBRTQC alert does not establish analytical error.
- A QC signal does not automatically establish patient impact.
- A root cause cannot be inferred merely from temporal association
  (the single most common trap embedded across this case bank —
  calibration/maintenance/lot-change timing coincidences).
- Verification must establish recovery before service is resumed when
  recovery is genuinely required.

## Case-family sourcing

New cases draw their teaching pattern from the Stage 11A case-family
catalogue (`V09_CASE_FAMILY_CATALOGUE.md`, families A–P) and the Stage
12A/12B extensions (`V09_MORNING_QC_CASE_CATALOGUE.md`, families Q–S).
A case's `identity.caseFamily` must reference a real, documented family.
No case invents an undocumented family purely for variety.

## No case-ID branching

Every case must be fully expressible as data consumed by the existing,
generic Stage 12A engine, Stage 12B interaction shell, and Stage 12C
debrief. If a case appears to require new engine logic, STOP and report
it — do not silently add a special case anywhere in the codebase.
