# PreciMind QC Learning Lab v0.9 — Product Charter

**Baseline:** `recovered-v0.8-validated` (commit `1352dba`)  
**Status:** Development charter — no implementation yet (Stage 11A)

---

## Core Goal

Transform PreciMind QC Learning Lab from a collection of strong individual learning laboratories into an **integrated competency-based clinical laboratory QC learning environment**.

v0.8 validated 14 primary navigation destinations: 11 progress-tracked learning labs (Statistics Playground, LJ Laboratory, Pattern Challenge, Rule Laboratory, QC Strategy Lab, Sigma Sandbox, Risk & Frequency Lab, Investigation Lab, External Assurance Lab, BV & RCV Lab, Patient Surveillance Lab) plus three supporting screens (Home, Competency Map, Evidence). Each lab teaches a competency in isolation. v0.9's defining feature integrates them.

The competency framework QC-01 through QC-12 is a separate count from the number of lab screens — competencies and screens do not map one-to-one.

---

## The Major New Feature: Morning QC Room

**Morning QC Room is a CAPSTONE.** It is not "QC-13" — a fourteenth isolated lab bolted onto the other thirteen. It is the environment where everything the learner has practiced separately must be **combined and applied under realistic uncertainty**.

### Competencies Integrated

Morning QC Room must draw on:
- Statistics (mean, SD, CV, bias)
- Levey-Jennings interpretation
- Pattern recognition
- Westgard/multirule QC
- APS selection
- Sigma metrics
- QC procedure design
- QC frequency
- Risk / patient exposure
- Investigation methodology
- Patient impact assessment
- External assurance (EQA)
- Biological variation / RCV
- PBRTQC

**Not every case must use every domain.** The learner must determine what information matters — this is itself a tested competency (see Information Economy, below).

---

## Pedagogic Architecture — Preserved and Extended

### Existing Progression (Preserved Unchanged)

```
UNDERSTAND → VISUALISE → INTERPRET → DECIDE → TROUBLESHOOT → DESIGN → GOVERN
```

### Existing Interaction Model (Preserved Unchanged)

```
EXPLAIN → SHOW → LET ME CHANGE IT → MAKE ME INTERPRET IT
        → MAKE ME DECIDE → SHOW ME WHY → GIVE ME ANOTHER CASE
```

### Morning QC Room Extension (New)

```
INTEGRATE → PRIORITISE → ACT → REASSESS → DOCUMENT → RELEASE / HOLD / ESCALATE
```

This extension does not replace the existing pedagogy — every individual lab keeps its EXPLAIN→SHOW→...→GIVE ME ANOTHER CASE cycle. Morning QC Room adds a layer above it where the learner must first decide *which* of the underlying competencies is relevant *before* applying it.

---

## Morning QC Room Conceptual Role

Morning QC Room is a **simulated start-of-day laboratory decision environment**. The learner encounters a *laboratory state*, not an isolated question.

### Potential Information Sources (Non-Exhaustive)

- Today's QC results
- Preceding QC history
- Reagent lot information
- Calibration events
- Maintenance events
- EQA history
- Analyzer status
- Patient workload
- Patient-result distributions
- PBRTQC signals
- Previous unresolved events
- Specimen / reagent / environmental clues
- Method performance characteristics
- APS / TEa context
- Sigma
- QC procedure
- QC frequency
- Relevant patient-risk context

### Core Questions the Learner Must Answer

- What is the signal?
- Is there really a problem?
- What should I check first?
- Can patient testing continue?
- What should be held?
- What evidence would change my decision?
- What action is justified?
- Has the process recovered?
- What patient results require review?
- Can results / the analytical system be released?
- What must be documented or escalated?

---

## Doctrine Inherited from v0.8: No Automatic Root-Cause Assignment

Carried forward unchanged from the v0.8 Investigation Lab doctrine:

```
signal ≠ disturbance ≠ root cause ≠ patient impact ≠ disposition
```

Morning QC Room must **never** tell the learner "QC failed, therefore reagent lot is bad" or any equivalent deterministic causal shortcut. Cases must distinguish:

`observation → hypothesis → evidence → intervention → verification → patient-impact assessment → final disposition`

---

## Morning QC Room Must NOT Be a Quiz

Explicitly prohibited architecture: `question → multiple choice → correct/incorrect → next question`.

Instead, Morning QC Room behaves like a simulated working environment:

- The learner can inspect information in a **non-linear order**
- Available information panels may include: QC chart, Analyzer status, Reagent lot, Maintenance log, EQA record, Patient distribution, Previous shift, QC procedure, APS, Method performance
- Some information is irrelevant to a given case
- Some information becomes relevant only after another observation is made

---

## Information Economy

The learner should **not** be rewarded for opening every information panel. Expertise includes deciding what information is needed *and* what information is unnecessary.

Future case scoring may distinguish **efficient evidence selection** from **indiscriminate information gathering**. *(Not implemented in Stage 11A.)*

---

## Provisional Decision-Quality Model (Future — Not Implemented)

Assessment should track multiple separate dimensions rather than one opaque score:

- Signal recognition
- Statistical interpretation
- Analytical reasoning
- Rule interpretation
- Risk reasoning
- Investigation strategy
- Evidence selection
- Patient-impact reasoning
- Decision appropriateness
- Verification quality
- Documentation / governance
- Metacognitive calibration

---

## Confidence Remains Metacognitive

Consistent with v0.8's Rule Detective and Pattern Challenge doctrine: **confidence must remain separate from correctness.**

Prohibited: "High confidence = more points" or "Low confidence = fewer points."

Future feedback may instead identify:
- correct + well calibrated
- correct + underconfident
- incorrect + overconfident
- incorrect + appropriately uncertain

*(Not implemented in Stage 11A.)*

---

## Case Difficulty Model (Distinct from Learner Level)

Morning QC Room case levels are **provisional and separate from learner levels**:

| Case Level | Description |
|-----------|-------------|
| LEVEL 1 | Clear single analytical signal |
| LEVEL 2 | Signal plus plausible competing explanation |
| LEVEL 3 | Multiple simultaneous signals / incomplete evidence |
| LEVEL 4 | Analytical + patient-risk + operational trade-off |
| LEVEL 5 | Complex governance / longitudinal / multi-system case |

**Learner levels remain:** beginner / intermediate / advanced / expert — these are NOT the same axis as case levels and must not be conflated.

---

## Relationship to v0.8

v0.9 does not discard v0.8's 11 progress-tracked labs — they remain the foundation. Morning QC Room is additive: it is a capstone integrating QC-01 through QC-12 rather than a new thirteenth competency or a fourteenth lab screen bolted onto the existing eleven. A learner who has practiced individual labs brings that practiced competency into Morning QC Room cases; a learner who struggles in Morning QC Room can be directed back to the specific underlying lab that needs more practice (a possible future integration point with the Competency Map).
