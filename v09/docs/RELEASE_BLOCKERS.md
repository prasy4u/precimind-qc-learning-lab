# Release Blockers — v0.9.0 Release Candidate

## Software/runtime/scientific blockers

**No unresolved software/runtime/scientific blockers.**

All scientific-regression, Stage 12A-12E governance, historical
regression, and clean-room validation performed during Stage 12F
passed. See `V09_RELEASE_CHECKLIST.md` for the full item-by-item state.

## Governance blockers (require project-owner/institutional decision)

**Sequencing.** These are not equivalent in urgency or nature:
- **Must be resolved before public release**: software licensing,
  citation/authorship confirmation, and a real security-reporting
  channel. These are prerequisites to responsibly publishing source
  code and accepting public reports.
- **Deployment-time decisions**: public repository URL and hosting
  provider selection. These naturally cannot be finalized until an
  actual hosting/publication venue is chosen, and do not block
  preparing the release candidate itself.
- **Naturally sequenced after deposition**: a Zenodo DOI cannot exist
  until archival deposition actually occurs. This is not a software
  defect or a governance failure — it is simply not yet applicable.

- **Software licensing decision pending.** No authoritative license
  file or `package.json` license field exists. See `LICENSE_STATUS.md`.
- **Public security-reporting contact pending.** No real
  vulnerability-reporting email/channel has been supplied. See
  `SECURITY.md`.
- **Citation/authorship metadata pending PI confirmation.** Only a
  development-sandbox placeholder git identity exists in repository
  history; no real author/institution has been confirmed. See
  `CITATION_TEMPLATE.cff`.
- **Public repository URL pending.** No public hosting location has
  been chosen yet; referenced only as "PENDING" in provenance/citation/
  Zenodo templates.
- **Zenodo DOI pending.** Deposition has not been attempted; see
  `ZENODO_METADATA_TEMPLATE.json` (preparation only, not uploaded).
- **Hosting-provider selection pending.** `PRIVACY.md` cannot describe
  a specific hosting provider's log-retention practice until one is
  chosen.

## Known, documented, non-blocking limitations

- Subpath web deployment (e.g. `https://host/precimind/`) does not
  work with the current absolute-path build; documented as a
  deployment constraint in `release/web-package/README.md`, not a
  defect requiring a fix before this release.
- Only Chromium browser testing was performed in this validation
  environment (Firefox/WebKit unavailable) — reported honestly, not
  claimed as a defect or as full cross-browser support.
- A full formal WCAG conformance audit was not performed; only
  targeted accessibility verification (documented in
  `V09_RELEASE_CHECKLIST.md`).

## Classification

Given the genuinely unresolved governance blockers above (license,
citation/authorship, security contact — all required before public
release), this candidate is classified as a
**CONDITIONAL RELEASE CANDIDATE**, not "ready for release" outright.

This classification concerns external/governance readiness only. The
**software/runtime itself has no known release-blocking defect**: all
scientific, privacy, and clean-room validation gates pass (see
`V09_RELEASE_CHECKLIST.md`), and the production build remains
byte-identical to the Stage 12E-accepted baseline.

