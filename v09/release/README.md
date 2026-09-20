# PreciMind QC Learning Lab

**Version 1.0.0** — first stable release

An educational simulation platform for laboratory-medicine
quality-control (QC) decision-making.

## What this is

PreciMind QC Learning Lab helps learners practice QC reasoning across
eleven tracked interactive laboratories (statistics, Westgard rules,
operating characteristics, QC strategy, risk-based frequency,
investigation methodology, EQA, BV/RCV, and PBRTQC), integrated by a
**Morning QC** capstone simulation where learners investigate a
realistic QC scenario end-to-end: recognize the signal, gather
evidence selectively, decide whether to intervene, verify recovery,
and reach a final disposition — then review a full debrief.

This is **educational simulation software**. See `DISCLAIMER.md` for
important limitations — it is not a medical device, not clinical
decision-support software, and not a certification tool.

## Intended audience

Laboratory-medicine and clinical-chemistry learners, educators, and
programs seeking a hands-on, low-stakes way to practice QC reasoning.

## Privacy by design

No learner name, email, staff ID, institution, or any other identity
field is ever required or collected. All learning history is stored
locally in your own browser. See `PRIVACY.md` for full detail.

## How to run it

### Online / web deployment
The public application URL is
**https://qc.drprasenjitmitra.com/** (hosted at the root of its
own subdomain). To self-host, serve the contents of this package's
application files with any static web server from the host/domain
**root** and open the served URL in a modern Chromium-based browser.
Non-root subpath deployment of this pre-built package is confirmed
non-functional (the build uses absolute asset paths). Rebuilding from
source with a configured base path may allow subpath deployment, but
this has not been tested and is not supported in v1.0.0 — see
"Supported execution method" below for the tested root-vs-subpath
constraint.

### Offline use
See the separate Offline distribution package and its own instructions
— "offline" means no internet connection is required *after* download,
which is not necessarily the same as double-clicking an HTML file
directly (see that package's README for the actual tested method).

## Supported execution method / browser support actually tested

This v1.0.0 release was validated with a real **Chromium** browser
at desktop (1920×1080, 1366×768) and mobile (390×844) viewports.
Firefox and WebKit/Safari were not available for testing in this
validation environment — this is reported honestly as untested, not
claimed as unsupported.

## Research/instructor analytics status

An instructor/research analytics workspace exists in the development
build for use by programs studying their own local learner data; it is
not part of this learner-facing distribution. See the audit repository
package if you need that workspace.

## Educational-use limitation

Completing PreciMind exercises does not certify clinical competence,
does not establish readiness for independent professional practice,
and must not be used for employment-performance evaluation.

## Source repository

Planned public repository at release:
**https://github.com/prasy4u/precimind-qc-learning-lab**.

## Licensing

This release has a deliberate two-part scope:

| Material | Terms |
|---|---|
| Software / source code | **Apache License 2.0** (`LICENSE`) |
| Original educational content | **© 2026 Prasenjit Mitra. All rights reserved.** |
| Third-party material | Respective rights and licences |

Original educational content means explanatory prose, teaching cases and
scenarios, questions and feedback, guided-pathway content and original
figures. The canonical statement is in `NOTICE`; see also
`LICENSE_STATUS.md`.

## Citation

See `CITATION.cff` for citation metadata (author, ORCID, repository, and the
software licence). Its `license` field refers to the software only.

DOI: [10.5281/zenodo.22856598](https://doi.org/10.5281/zenodo.22856598)
— reserved for this v1.0.0 release. The Zenodo record is currently an
unpublished draft; this DOI is reserved but does not yet resolve
publicly. This is not a confirmation that the Zenodo record has been
published.

## Version and provenance

Version: **1.0.0**. See `RELEASE_PROVENANCE.json` for the exact source
commit, build hashes, and schema versions this package was built from.
