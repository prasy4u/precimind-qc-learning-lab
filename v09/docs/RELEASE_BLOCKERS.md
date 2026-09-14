# Release Blockers — v0.9.0 Release Candidate

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
- **Intended public GitHub repository identity**: `prasy4u/precimind-qc-learning-lab`.
- **Intended public application hosting architecture**: root of its
  own subdomain, `https://precimind.drprasenjitmitra.com/`.

None of the above remain blockers.

## Publication/deployment actions (not software defects, not blockers)

These are sequenced actions the project owner will take at actual
publication time — none of them reflect a defect in this candidate,
and none require further Stage 12F engineering work:

- Create the public GitHub repository and push the accepted commit.
- Create the final `v0.9.0` tag — only after independent acceptance audit.
- Create a GitHub Release.
- Enable/configure GitHub Pages (or equivalent) for
  `precimind.drprasenjitmitra.com`, including DNS and HTTPS enforcement.
- Optionally enable GitHub Private Vulnerability Reporting as an
  additional channel alongside the email contact.
- Deposit the release into Zenodo and receive a DOI — **naturally
  inapplicable until deposition occurs**; update `CITATION.cff` and the
  Zenodo metadata with the DOI at that time. This is a
  **PENDING RELEASE ACTION**, never a FAIL/BLOCKED item.

## Known, documented, non-blocking limitations

- Subpath web deployment (e.g. a non-root path under a shared domain)
  does not work with the current absolute-path build; documented as a
  deployment constraint, consistent with the confirmed root-of-subdomain
  hosting architecture (`https://precimind.drprasenjitmitra.com/`) —
  not a defect requiring a fix before this release.
- Only Chromium browser testing was performed in this validation
  environment (Firefox/WebKit unavailable) — reported honestly, not
  claimed as a defect or as full cross-browser support.
- A full formal WCAG conformance audit was not performed; only
  targeted accessibility verification (documented in
  `V09_RELEASE_CHECKLIST.md`).

## Classification

**READY FOR INDEPENDENT RELEASE AUDIT.** All software/scientific/
runtime/privacy requirements pass, and all governance decisions
required before public release (ownership, license, authorship,
security contact) are resolved. Only publication/deployment actions
remain, sequenced above — none of which are defects in this candidate.
