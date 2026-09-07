# Morning QC Room — Revised Case Family Catalogue (Stage 12A)

**Supersedes the Stage 11A design-only sketch** (`v09/docs/V09_CASE_FAMILY_CATALOGUE.md`, retained unchanged as historical record — Section 10 of the Stage 12A spec explicitly forbids silently discarding prior concepts).

This document performs the Stage 12A Section 10 review: (1) retrieve and inspect A–P, (2) normalize to the new case contract (`case-schema.js`), (3) classify by learning purpose, (4) identify overlaps, (5) identify gaps, (6) produce a revised candidate catalogue.

---

## 1. Normalization to the New Case Contract

Every family below is now expressed against the `case-schema.js` field categories rather than the informal Stage 11A prose:

| Stage 11A field | Stage 12A schema equivalent |
|---|---|
| Teaching purpose | `identity.title` + narrative intent (informs pilot-case scientific rationale) |
| Relevant competencies | `identity.competencyMapping` (QC-01..QC-12) + `provenance.scientificDependencies` |
| Misleading-but-plausible information | one or more `panels[]` with `mayBeMisleading: true` |
| Required decisions | `decisionOpportunities[]` entries, tagged by `DECISION_CATEGORIES` |
| Forbidden deterministic inference | a `debriefEvidence.commonMisconceptions[]` entry |
| Debrief concept | `debriefEvidence.strongPathDescription` / `weakPathDescriptions[]` |

---

## 2. Classification by Learning Purpose

| Purpose cluster | Families |
|---|---|
| **Signal-vs-noise discrimination** | A, C |
| **Correlation-vs-causation discipline** | B, D |
| **Patient-impact boundary-setting** | E, F, M |
| **QC-strategy design (Sigma-driven)** | G, H |
| **Cross-method signal reconciliation** | I, J, K, L |
| **Prioritisation under multiple demands** | N |
| **Metacognitive discipline (resisting premature closure)** | O, P |

---

## 3. Identified Overlaps (Not Discarded — Explicitly Noted)

- **B and D** share the same underlying reasoning pattern (a temporally-associated event is not automatically the cause) applied to two different event types (reagent lot vs. calibration). Both remain distinct families — the *event type* changes which evidence panels are legitimately available and which are misleading — but case authors should treat them as a matched pair when designing debrief text, to avoid duplicating the same "correlation ≠ causation" lesson without variation.
- **E and F** are two ends of one teaching arc (patient-impact review with a minimal-impact outcome vs. a genuine-impact outcome). They remain separate families because the *decision content* differs (E: concluding appropriately that impact is absent; F: correctly bounding and executing a review that finds real impact) — collapsing them would remove the important lesson that the review process is identical regardless of which outcome it produces.
- **G and H** are an intentional complementary pair (over-control vs. under-control relative to Sigma) and should be authored together so learners see both failure directions of the same design principle.
- **K and L** both involve PBRTQC interpretation nuance but target different failure modes: K is about a confound *within* PBRTQC's own signal (population shift mimicking an analytical shift); L is about reconciling PBRTQC with a *second, independent* signal source (IQC). Kept distinct.
- **O and P** both resist premature closure but at different case phases: O is early (evidence-gathering, before any intervention), P is late (post-intervention, before disposition). Kept distinct — a learner can fail at either point independently.

---

## 4. Identified Gaps (Section 11 Coverage Requirements Not Yet Represented)

Cross-referencing Section 11's required coverage concepts against A–P found five concepts without a dedicated family:

- **"Unstable reagent"** (Section 11) is distinct from "lot change" (family B): a lot change is a discrete, dateable event; reagent *degradation within a lot* (e.g., temperature excursion during storage, or age-related drift) produces a more gradual, harder-to-timestamp pattern. No A–P family covers this.
- **"Maintenance-related change"** (Section 11) is not covered as its own event-type family — D covers calibration specifically, B covers lot changes, but a part-replacement or preventive-maintenance event is a third distinct category with its own plausible-but-wrong assumptions ("maintenance was performed by a qualified engineer, therefore it must have gone correctly").
- **"Failed corrective action"** (Section 11) is not represented — every existing family that includes an intervention (implicitly D, P) assumes the intervention works if the learner reaches it correctly. No family requires the learner to recognize that a first, reasonable intervention *did not* resolve the disturbance and iterate.
- **"Excessive investigation / unnecessary testing"** (Section 11) is addressed only at the *QC-design* level by G (excessive QC frequency as a standing policy), not at the *individual-case investigation* level (a learner over-testing/over-repeating within a single case, wasting time/resources without improving evidence — directly relevant to the engine's `INEFFICIENT` severity classification).
- **"Irrelevant contextual information"** (Section 11) is a cross-cutting requirement (Section 6) present in every case's panel design, but no A–P family makes irrelevant-information discipline the *primary* teaching point the way, e.g., A makes signal-vs-noise the primary point.

---

## 5. Revised Candidate Catalogue: Three New Families (Q, R, S)

## Q. Reagent Degradation Within a Lot (Not a Discrete Change Event)
- **Teaching purpose:** Distinguish a discrete lot-change event (family B) from gradual within-lot reagent degradation, which produces a slower-onset, harder-to-timestamp shift with no clean "before/after" event marker.
- **Relevant competencies:** LJ interpretation, investigation, risk reasoning.
- **Misleading-but-plausible information:** No lot-change or calibration event exists near the shift onset, tempting the learner to conclude "nothing changed" rather than considering gradual degradation.
- **Required decisions:** Recognize a gradual-onset pattern; investigate reagent storage/handling history rather than searching only for discrete events.
- **Forbidden deterministic inference:** "No discrete event occurred, therefore there is no analytical cause."
- **Debrief concept:** Not every analytical disturbance has a single dateable trigger.

## R. Failed Corrective Action Requiring Iteration
- **Teaching purpose:** Test whether the learner re-verifies after an intervention rather than assuming the first reasonable fix worked (extends family P's verification discipline to the case where verification *fails*).
- **Relevant competencies:** Investigation, verification, governance.
- **Misleading-but-plausible information:** The applied intervention is a textbook-correct response to the apparent cause, making it tempting to assume success without re-checking.
- **Required decisions:** Verify recovery; recognize failure; return to hypothesis generation/evidence selection rather than escalating blindly or re-applying the same fix.
- **Forbidden deterministic inference:** "I applied the correct-sounding intervention, therefore the problem is resolved."
- **Debrief concept:** Verification is not a formality — it is the only way to know an intervention actually worked, and iteration is expected, not exceptional.

## S. Unnecessary Investigation / Repeat-Testing Waste
- **Teaching purpose:** Recognize when continued investigation (repeat QC, repeat calibration, additional panel inspection) has stopped adding evidence value and has become time/resource waste rather than diligence.
- **Relevant competencies:** Investigation strategy, evidence selection, metacognitive calibration.
- **Misleading-but-plausible information:** "More testing is always more thorough" is a plausible but incorrect intuition (mirrors family G's QC-frequency version of this trap, applied to individual-case investigation behavior).
- **Required decisions:** Recognize when the evidence obtained already supports a confident hypothesis and further repeat-testing is not adding value.
- **Forbidden deterministic inference:** None specific — this targets an inefficiency trap, not a causal shortcut.
- **Debrief concept:** Investigation strategy quality includes knowing when to stop, not only knowing what to check.

---

## 6. Full Revised Catalogue (19 Families)

A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P (unchanged from Stage 11A, retained in full at `v09/docs/V09_CASE_FAMILY_CATALOGUE.md`), plus the three new families **Q, R, S** above.

**Stage 12A implements exactly three of these nineteen as fully structured pilot cases** (Section 26) — see `V09_STAGE12A_REPORT.md` for which three and why. The remaining sixteen families remain design-stage candidates for later stages (explicitly not all 19 implemented now, per Section 10: "Do NOT automatically implement all 16 as full cases").
