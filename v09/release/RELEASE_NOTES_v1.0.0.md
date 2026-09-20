# PreciMind QC Learning Lab — Release Notes — v1.0.0

## Overview

PreciMind QC Learning Lab v1.0.0 is the first stable, citable release
of an educational simulation platform for laboratory-medicine
quality-control (QC) decision-making. It promotes the accepted v0.9.0
release candidate — the same governance-resolved, scientifically
validated production runtime — to a formal version, with a DOI now
reserved ahead of Zenodo publication.

**Software release readiness and Zenodo publication status are
distinct.** The software itself is release-ready: all
scientific/runtime/governance items in `V09_RELEASE_CHECKLIST.md` are
**PASS**. The Zenodo record for this DOI, however, remains an
**unpublished draft** — see "Digital object identifier (DOI)" below.

## What's included

**A complete QC-01 through QC-12 competency pathway**, including the
interactive **QC Materials & Control Statistics** module (QC-03) —
covering calibrator vs. QC material, assayed/unassayed and
manufacturer/third-party control sourcing, establishing representative
control statistics, an investigate-before-excluding outlier doctrine,
how SD estimation quality affects chart interpretation, and QC-lot
transition reasoning.

**Eleven tracked interactive QC laboratories** covering: core
statistics, the statistical QC rule engine (Westgard rules), operating
characteristics, QC strategy, risk-based frequency, investigation
methodology, external quality assessment (EQA), biological
variation/reference change value (BV/RCV), and patient-based real-time
QC (PBRTQC) — each with interactive playgrounds, worked exercises, and
underlying scientific calculators.

**A 13-step guided-learning pathway** for first-time learners, with an
explicit learning goal, task, completion criterion and key takeaway at
every step, alongside full free-exploration access to every laboratory
at any time.

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

**Two-part licensing, clearly stated.** Software/source code is Apache
License 2.0; original educational content (explanatory prose, teaching
cases and scenarios, questions and feedback, guided-pathway content,
original figures) is © 2026 Prasenjit Mitra, all rights reserved;
third-party material remains subject to its own rights and licences.

## What changed since the v0.9.0 release candidate

This promotion is a **version/DOI metadata change only**. The
production runtime is functionally identical: no calculation, decision
logic, QC rule, case, scientific content, navigation, or CSS changed.
The only learner-visible difference is the version number and a
reserved-DOI citation line shown in the About modal. The production
build hash therefore changed — from the accepted v0.9.0 RC hash to a
new v1.0.0 hash — for that reason alone; see `RELEASE_PROVENANCE.json`
for both values and independently reproducible confirmation.

## Digital object identifier (DOI)

A DOI has been **reserved** for this release:

**10.5281/zenodo.22856598** (https://doi.org/10.5281/zenodo.22856598)

The Zenodo record is currently an **unpublished draft**. The DOI is
reserved but does not yet resolve publicly, and the Zenodo record has
not yet been published. `CITATION.cff` and `RELEASE_PROVENANCE.json`
already carry this reserved DOI ahead of publication; publishing the
Zenodo draft to activate it is a separate, pending action — see
`RELEASE_BLOCKERS.md`.

## Major validation performed

Extensive automated scientific-regression and software-governance
testing across every development stage, including: independently
recomputed numeric verification of every scientific invariant from
first principles, deep schema/privacy validation of all persisted and
exported data, real-browser end-to-end testing (desktop and mobile
viewports), and multiple rounds of independent audit and corrective
closure — all carried forward unchanged from the accepted v0.9.0
release candidate. See `CHANGELOG.md` (available in the source/Audit
Repository package) for the detailed stage-by-stage history and
`V09_RELEASE_CHECKLIST.md` (also in the Audit Repository package) for
the current release-readiness state.

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
- Software ownership, copyright, software license (Apache License
  2.0), sole authorship (Prasenjit Mitra, ORCID 0000-0003-4826-1587),
  the public security-reporting contact, and citation metadata are all
  resolved (see `LICENSE`, `NOTICE`, `CITATION.cff`, `SECURITY.md`).
  The GitHub repository is public and the application is deployed via
  the repository's GitHub Pages workflow. The Zenodo record for the
  reserved DOI above remains unpublished — see `RELEASE_BLOCKERS.md`
  (available in the source/Audit Repository package) for its
  sequencing alongside the `v1.0.0` tag and GitHub Release.
