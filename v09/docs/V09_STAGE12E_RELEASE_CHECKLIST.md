# PreciMind QC Learning Lab v0.9 — Release-Candidate Checklist

Status as of the Stage 12E corrective closure. Items are marked
complete ONLY where genuinely tested; anything not actually verified is
marked accordingly rather than assumed.

## Scientific integrity
- [x] Stage 12A engine/pilot-paths/progression-invariants/governance suites pass (268/268)
- [x] Stage 12D case-bank/expanded-paths/adaptive/analytics/numeric-audit suites pass
- [x] No scientific arithmetic drift (verified via `git diff` against every prior accepted baseline)
- [x] Case bank unchanged this stage (zero case files touched)

## Runtime integrity
- [x] Both `dist-morning-qc-dev/` and `dist-vite-production/` build successfully
- [x] `dist-vite-production/` is byte-identical to the pre-Stage-12E accepted hash (confirms new instructor/research code is unreachable from production)
- [x] No console errors observed during real-browser testing
- [ ] Full formal cross-browser (Firefox/WebKit) verification — **not performed**; those engines were unavailable in this environment
- [x] No unexpected network calls found in the new Stage 12E modules (source-audited)

## Privacy
- [x] No PII field exists anywhere in the canonical attempt schema (structural, not just tested)
- [x] No external transmission — local-only persistence and export, source-audited
- [x] Strict, deep record validation (top-level + all nested structures)
- [x] Research export independently re-validates the RAW stored dataset before export
- [x] Exact wall-clock timestamps excluded from the default export; rationale documented

## Pedagogy
- [x] No competency misuse (unevaluated/null never converted to a poor rating)
- [x] No false progression (Rule C/D both directly tested and reproduced-then-fixed across two closures)
- [x] No ranking/leaderboard anywhere in instructor analytics (tested)
- [x] No certification claim anywhere in the UI or documentation

## Analytics
- [x] Denominators explicit everywhere tested; zero-denominator never rendered as "0%"
- [x] Missing/unevaluated data handled correctly and distinguished from a real rating
- [x] Confidence categories preserved exactly (HIGH/MODERATE/LOW never coerced)
- [x] Verification distinctions preserved (attempt-count vs. case-count kept separate)

## Data safety (Stage 12E corrective closure)
- [x] Synthetic demonstration data cannot overwrite, append to, or otherwise touch real learner history (directly verified: a sentinel real attempt survives byte-for-byte across entering/exiting demo mode)
- [x] The dev-only history-clear control requires explicit, cancelable confirmation
- [x] Raw-storage quarantine counts are truthfully reported to both the instructor UI and the export manifest

## Accessibility
- [x] Targeted audit of the new Stage 12E instructor/research controls (heading hierarchy, accessible names, `role="status"`/`role="alert"`, `aria-labelledby`, explicit `type="button"`)
- [x] No horizontal overflow at 1920×1080, 1366×768, or 390×844 with the instructor workspace populated
- [ ] Full formal WCAG conformance audit — **not performed**; only a targeted, source- and browser-verified pass over the new controls was conducted, per the corrective closure's explicit narrow scope

## Provenance
- [x] Correct Git state (branch, HEAD, commit count all verified before and after)
- [x] Real (non-fabricated) browser-test evidence, saved to a dedicated Stage 12E evidence directory
- [x] Historical Stage 12B/12C evidence remains 27/27 byte-identical
- [x] Build tree hashes reported and reconfirmed reproducible across independent rebuilds
- [x] No `v0.9` release tag created — this remains a release-candidate CANDIDATE pending independent audit
