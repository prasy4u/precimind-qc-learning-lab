# Reproducibility

This document distinguishes what is genuinely bit-for-bit reproducible
in this release from what is only file-tree/content reproducible.

## Production build (learner-facing application)

**Reproducible: file-tree content hash**, verified twice via
independent rebuilds in this validation environment:

```
cd v09
npx vite build --config vite.production-integrated.config.mjs
node tools/hash-build-tree.cjs dist-vite-production
```

Expected tree hash (current: QC-03 content + pre-release visual polish): `3de8d5d9f69fcd4edae0aa39136be2bf61573c39cab2c15aff84f125f97bffa7`
(historical pre-QC-03 baseline: `04fa0a3222150b7d07300617685eaf3ccc46fd08dd3f0129fe027377ce2b2ed1`)

This hash is computed over a canonical manifest of file paths and
content hashes (see `tools/hash-build-tree.cjs`), not over raw
filesystem metadata — so it is stable across rebuilds even though
raw file timestamps differ.

## Development build (instructor/research workspace)

Same method, different config:

```
cd v09
npx vite build --config vite.morning-qc.config.mjs
node tools/hash-build-tree.cjs dist-morning-qc-dev
```

Expected tree hash (this release): `c625fa7b53beac8481e24a2e0815843f85c55a0d993e1b3fd4c5bfc25ddc527a`

## Release-package ZIPs (Web / Offline / Audit Repository)

**Not claimed as byte-reproducible.** Standard ZIP archives embed
per-file modification timestamps and, depending on the zip
implementation/OS, other metadata that can differ between packaging
runs even when the underlying file *content* is identical. Rather than
claim false byte-for-byte ZIP reproducibility, this release verifies
reproducibility at the **file-tree hash** level (above) for the
application builds themselves, and via **`SHA256SUMS.txt`** for the
specific delivered ZIP files (which pins those exact bytes as
delivered, without claiming a re-run of the packaging step would
reproduce the identical archive byte-for-byte).

If genuinely byte-reproducible ZIPs are required in the future, this
would require a packaging step that explicitly normalizes file
ordering, strips timestamps, and pins compression settings — not
implemented for this v1.0.0 distribution.

## What is NOT reproducible by design

- Any wall-clock generation timestamp intentionally omitted from
  `RELEASE_PROVENANCE.json` (source commit + build hashes are the
  authoritative provenance anchors instead — see that file).
