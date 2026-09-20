# Release Blockers — v1.0.0 Release Candidate

## Software/runtime/scientific blockers

**No unresolved software/runtime/scientific blockers.**

All scientific-regression, Stage 12A-12E governance, historical
regression, and clean-room validation performed passed. See
`V09_RELEASE_CHECKLIST.md` for the full item-by-item state.

## Governance decisions — RESOLVED

The project owner has authoritatively resolved the following, which
were previously open governance blockers:

- **Software/copyright ownership**: Prasenjit Mitra (`LICENSE_STATUS.md`, `NOTICE`).
- **Software license**: Apache License 2.0 (`LICENSE`, `package.json`).
- **Software authorship / citation metadata**: Prasenjit Mitra, ORCID
  0000-0003-4826-1587 (`CITATION.cff`).
- **Public security-reporting contact**: `drmitraprasenjit@gmail.com` (`SECURITY.md`).
- **Public GitHub repository**: `https://github.com/prasy4u/precimind-qc-learning-lab` — public.
- **Public application hosting architecture**: the production build
  is deployed through the repository's GitHub Pages workflow to
  `https://qc.drprasenjitmitra.com/` (root of its own subdomain) —
  publicly accessible; manually accepted by the project owner.

None of the above remain blockers.

**Application hosting status**: complete. The application is deployed
through the repository's GitHub Pages workflow and is publicly
accessible at `https://qc.drprasenjitmitra.com/`, and this deployment
has been manually accepted by the project owner. The GitHub repository
itself is also public. This is distinct from, and does not require, a
`v1.0.0` tag, a GitHub Release, or Zenodo publication — each of those
remains a separate, sequenced action listed below.

**DOI status**: a DOI has been **reserved** for this v1.0.0 release —
`10.5281/zenodo.22856598` (https://doi.org/10.5281/zenodo.22856598).
The Zenodo record is currently an **unpublished draft**; the DOI does
not yet resolve publicly. `CITATION.cff` and this release's provenance
metadata already carry the reserved DOI ahead of publication, as
instructed. Publishing the Zenodo draft remains a separate, pending
action (see below).

## Publication/deployment actions (not software defects, not blockers)

These are sequenced actions the project owner will take at actual
publication time — none of them reflect a defect in this candidate,
and none require further Stage 12F engineering work:

- Create the final `v1.0.0` tag — only after independent acceptance audit.
- Create a GitHub Release.
- Optionally enable GitHub Private Vulnerability Reporting as an
  additional channel alongside the email contact.
- Publish the Zenodo draft to activate the reserved DOI
  (`10.5281/zenodo.22856598`) — the DOI is already reserved and already
  recorded in `CITATION.cff` and release provenance ahead of
  publication; only the act of publishing the Zenodo record itself
  remains outstanding. This is a **PENDING RELEASE ACTION**, never a
  FAIL/BLOCKED item.

## Known, documented, non-blocking limitations

- Subpath web deployment (e.g. a non-root path under a shared domain)
  does not work with the current absolute-path build; documented as a
  deployment constraint, consistent with the confirmed root-of-subdomain
  hosting architecture (`https://qc.drprasenjitmitra.com/`) —
  not a defect requiring a fix before this release.
- Only Chromium browser testing was performed in this validation
  environment (Firefox/WebKit unavailable) — reported honestly, not
  claimed as a defect or as full cross-browser support.
- A full formal WCAG conformance audit was not performed; only
  targeted accessibility verification (documented in
  `V09_RELEASE_CHECKLIST.md`).

## v1.1+ enhancement backlog (not blockers, not defects)

- **Multi-trial PBRTQC performance summary UI.** `summarizeNpedTrials`
  (calculation) and `MultiTrialNpedSummary` (display component) in
  `app/pbrtqc/` implement and pass tests against the SC27-adjudicated
  ANPed/censoring doctrine (see `docs/SCIENTIFIC_BASIS.md` and
  `SCIENTIFIC_INVARIANTS.md` INVAR-104), but neither is currently
  imported by `app/pbrtqc/screens.jsx`. The Patient Surveillance Lab
  (`#/pbrtqc`) does not display a multi-trial detection-rate/ANPed
  summary in this release. This is not an incomplete in-progress feature on
  the shipped screen — it is a separate, self-contained function and
  component that were never wired in. Confirmed via a network of checks
  in the v1.0 remediation: no import, call site, or dead reference to
  either symbol exists anywhere in `screens.jsx`, and the corresponding
  learner-facing strings are absent from the production bundle. When
  this is integrated in a future release, the required interpretation
  (detection rate reported alongside ANPed, nondetection represented as
  "Not estimable" rather than a biased detected-runs-only mean, no
  artificial substituted NPed value, no survival-analysis
  functionality) is already implemented and tested — the scientific
  doctrine was corrected prospectively specifically so this would be
  true from the first release that exposes it.

## Classification

**READY FOR INDEPENDENT RELEASE AUDIT.** All software/scientific/
runtime/privacy requirements pass, and all governance decisions
required before public release (ownership, license, authorship,
security contact) are resolved. Only publication/deployment actions
remain, sequenced above — none of which are defects in this candidate.
