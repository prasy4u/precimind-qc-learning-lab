# PreciMind QC Learning Lab — Release Notes — v0.9.0

## Overview

PreciMind QC Learning Lab v0.9.0 is the first stable public release
candidate of an educational simulation platform for laboratory-medicine
quality-control (QC) decision-making.

## What's included

**Eleven tracked interactive QC laboratories** covering: core
statistics, the statistical QC rule engine (Westgard rules), operating
characteristics, QC strategy, risk-based frequency, investigation
methodology, external quality assessment (EQA), biological
variation/reference change value (BV/RCV), and patient-based real-time
QC (PBRTQC) — each with interactive playgrounds, worked exercises, and
underlying scientific calculators.

**Morning QC — the capstone simulation.** A guided, realistic QC
decision scenario across 12 distinct cases spanning multiple reasoning
families: recognizing a genuine QC signal, selectively gathering
evidence, forming and testing hypotheses, deciding whether intervention
is warranted, verifying recovery, and reaching a final disposition —
with a full debrief comparing the learner's decisions, reasoning
support, and confidence calibration against each case's accepted
resolution.

**Competency model.** Learner performance is tracked across twelve
scoring dimensions (e.g. signal recognition, evidence selection,
investigation strategy, verification quality), always distinguishing
genuinely evaluated dimensions from unevaluated ones — an unevaluated
competency is never silently treated as a poor rating.

**Local adaptive sequencing.** The next recommended case adapts to a
learner's own local history, but only ever progresses difficulty after
genuinely repeated strong performance — a single strong attempt, or an
empty/unevaluated performance record, never triggers an unearned
difficulty increase.

**Privacy-safe learner history.** All learner progress is stored
locally in the browser only. No name, email, staff ID, institution,
patient identifier, device fingerprint, or IP address is ever
collected. Learners can reset their local history at any time via an
explicit, confirmable control.

**Instructor/research instrumentation** (development workspace, not
part of the standard 14 learner destinations): denominator-governed
aggregate and per-case analytics, a formally defined metric registry,
and a deterministic, privacy-minimised local research-export bundle —
built entirely on the same canonical, validated attempt data the
learner application itself produces.

**Deterministic, privacy-minimised research export.** Exported research
data uses relative event timing rather than exact wall-clock
timestamps, independently re-validates every record before export, and
truthfully reports (rather than silently hides) any malformed or
unreadable storage state.

**Offline/local-first design.** The learner-facing application requires
no account, no cloud service, and no internet connectivity once loaded
— see the Offline distribution package and its documented supported
launch method.

## Major validation performed

Extensive automated scientific-regression and software-governance
testing across every development stage, including: independently
recomputed numeric verification of every scientific invariant from
first principles, deep schema/privacy validation of all persisted and
exported data, real-browser end-to-end testing (desktop and mobile
viewports), and multiple rounds of independent audit and corrective
closure. See `CHANGELOG.md` for the detailed stage-by-stage history and
`V09_RELEASE_CHECKLIST.md` for the current release-readiness state.

## Known limitations

- This is simulation-learning software; it does not establish clinical
  competence, readiness for independent practice, or any form of
  professional certification.
- Only Chromium-based browser testing has been performed in this
  validation environment; other browser engines are untested (not
  claimed as unsupported, simply unverified).
- The 12-case Morning QC bank, while covering 11 distinct reasoning
  families, is not large enough on its own to support statistically
  robust educational-research conclusions.
- Software licensing, a public security-reporting contact, and formal
  citation/archival metadata remain pending project-owner decisions —
  see `RELEASE_BLOCKERS.md`.
