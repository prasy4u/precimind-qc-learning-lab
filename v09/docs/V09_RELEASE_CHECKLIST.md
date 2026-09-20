# v1.0.0 Release Checklist

(This checklist tracks the same accepted governance/scientific state
first established for the v0.9.0 release candidate and now carried
forward, plus the version/DOI promotion described in `CHANGELOG.md`.)

States used: `PASS`, `FAIL`, `BLOCKED`, `NOT APPLICABLE`, `NOT TESTED`.

## Scientific integrity
- Stage 12A engine/pilot-paths/progression-invariants (167/167) + governance (121/121): **PASS** (the earlier package-lock.json-staleness check was subsequently corrected to verify the substantive metadata/dependency invariant; no unresolved caveat remains)
- Stage 12D case-bank/expanded-paths/adaptive/analytics/numeric-audit: **PASS**
- Historical v0.8 regression (3849/3849) + Stage 11A-11C2: **PASS**
- No scientific arithmetic drift (verified via `git diff` against every prior accepted baseline this stage): **PASS**
- Case bank / QC mathematics / Westgard doctrine unchanged: **PASS**

## Runtime integrity
- Production build succeeds: **PASS**
- Production build hash: historical pre-QC-03 hash `04fa0a3222150b7d07300617685eaf3ccc46fd08dd3f0129fe027377ce2b2ed1`; previously accepted v0.9.0 RC hash `3de8d5d9f69fcd4edae0aa39136be2bf61573c39cab2c15aff84f125f97bffa7`; current v1.0.0 hash `850457b66e7e769060e8319191548edac3d1b8eeb44d5f546a9ebb0788c2de95` — legitimately changed because the About modal's learner-visible version/DOI text was updated (Version 1.0.0; DOI 10.5281/zenodo.22856598) — no calculation, decision logic, QC rule, case, scientific content, navigation, or CSS changed; reproducible rebuild (2 consecutive independent rebuilds from the same committed source): **PASS**
- No console errors in clean-room web validation (aside from the browser's own harmless automatic favicon request): **PASS**
- No unhandled page exceptions in clean-room web/offline validation: **PASS**
- No unexpected (non-localhost) network requests: **PASS**

## Browser validation
- Chromium, desktop 1920×1080 / 1366×768, mobile 390×844: **PASS**
- Firefox: **NOT TESTED** — browser engine unavailable in this validation environment
- WebKit: **NOT TESTED** — browser engine unavailable in this validation environment

## Accessibility
- Targeted verification performed (keyboard reachability/Tab traversal, visible focus, accessible names, heading structure, `role="status"`/`role="alert"`, non-color-only meaning, ≥44px touch targets, mobile overflow): **PASS**
- Formal WCAG conformance certification: **NOT APPLICABLE** — not claimed; only targeted verification was performed, and this is stated explicitly rather than implied

## Privacy
- No PII field exists in the canonical schema (structural, not just tested): **PASS**
- No external network transmission of learner data: **PASS**
- Malformed-container status surfaced truthfully (never coerced to a false "0 excluded"): **PASS**
- Exact wall-clock timestamps absent from default research export (attempts + events): **PASS**
- Secret/local-path scan of repository and public packages: **PASS** (no secrets, no personal filesystem paths found in delivered packages)

## Research export (regression check only, no new features)
- Valid/malformed-record handling, malformed-container handling, canonical event non-timing parity, relative timing, 7-file completeness, data/metric dictionary coverage, synthetic-fixture isolation, genuine learner storage unchanged during demo mode: **PASS** (re-run of the Stage 12E accepted suites: research.test.cjs 242/242, storage-robustness 52/52, governance 26/26)

## Offline execution
- Documented method (local static HTTP server) verified working in clean-room re-extraction: **PASS**
- Direct `file://` double-click launch: **FAIL** (tested and confirmed non-functional due to absolute asset paths) — documented honestly in `release/offline-package/README.md`, not claimed as supported

## Web deployment
- Root-path deployment: **PASS** (clean-room verified)
- Non-root subpath deployment: **FAIL** (tested and confirmed non-functional) — documented as a deployment constraint, not silently patched into the frozen production build

## Historical evidence
- Stage 12B/12C evidence 27/27 byte-identical: **PASS**

## Production navigation
- Exactly 14 primary destinations: **PASS**
- Morning QC labeled CAPSTONE, never QC-13: **PASS**
- No instructor primary-nav item: **PASS**

## Reproducibility
- Production build file-tree hash reproducible (verified via 2 independent rebuilds): **PASS**
- Development build file-tree hash reproducible: **PASS**
- Byte-for-byte ZIP reproducibility: **NOT APPLICABLE** — not claimed; `SHA256SUMS.txt` pins the exact delivered bytes instead (see `REPRODUCIBILITY.md`)

## Dependencies/assets
- Third-party runtime/build/test dependency inventory complete: **PASS** (`THIRD_PARTY_NOTICES.md`)
- No unresolved license/provenance on any inventoried asset: **PASS**

## Citation
- `CITATION.cff` present and YAML-valid: **PASS**
- Real, confirmed author/ORCID/repository/license metadata: **PASS** — resolved by the project owner (Prasenjit Mitra; ORCID 0000-0003-4826-1587)
- DOI metadata: **PASS** — `10.5281/zenodo.22856598` (https://doi.org/10.5281/zenodo.22856598), recorded in `CITATION.cff` and release provenance.

## Licensing
- Source-code license decided and documented: **PASS** — Apache License 2.0, resolved by the project owner (`LICENSE`, `NOTICE`, `LICENSE_STATUS.md`, `package.json`)

## Security contact
- Real public security-reporting channel published: **PASS** — `drmitraprasenjit@gmail.com` (`SECURITY.md`)

## Documentation
- Public README, DISCLAIMER, PRIVACY, SECURITY, RELEASE_NOTES, SCIENTIFIC_BASIS, THIRD_PARTY_NOTICES, REPRODUCIBILITY: **PASS** (all present, reviewed for accuracy against actual tested behavior)

## Public artifact content
- Web/Offline packages free of tests, fixtures, instructor workspace, `.git`, browser evidence, internal audit docs: **PASS** (verified via automated content scan of the packaged directories)

## Provenance
- `RELEASE_PROVENANCE.json` present with source commit, build hashes, all schema versions: **PASS**
- Git state clean, correct HEAD/commit count at delivery: **PASS**

## Checksums
- `SHA256SUMS.txt` covering all 3 external artifacts + production/dev tree hashes: **PASS**

## Overall classification

**READY FOR INDEPENDENT RELEASE AUDIT** — see `RELEASE_BLOCKERS.md`.
Ownership, copyright, authorship, ORCID, software license, and the
security-reporting contact are all now resolved by the project owner.
Every software/scientific/runtime/privacy item above is **PASS**.
The GitHub repository is public and the application is deployed via
the repository's GitHub Pages workflow (see `RELEASE_BLOCKERS.md`).
The external publication sequence is documented in `RELEASE_BLOCKERS.md`.
