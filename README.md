# PreciMind QC Learning Lab

**Version 1.0.0** · Educational simulation for clinical laboratory quality control

An interactive, browser-based platform for developing analytical quality-control
reasoning through simulation. Created and developed by **Dr Prasenjit Mitra**
(ORCID [0000-0003-4826-1587](https://orcid.org/0000-0003-4826-1587)).

> **Educational simulation only.** PreciMind is not a medical device, not
> clinical decision-support software, and is not intended for patient-care
> decisions. It does not replace validated laboratory procedures, applicable
> standards, regulatory requirements, manufacturer instructions or professional
> judgement, and it does not certify professional competence. See
> [`release/DISCLAIMER.md`](release/DISCLAIMER.md).

---

## What it contains

- **A 13-step guided learning pathway** (Understand → Control → Govern) with a
  learning goal, a concrete activity, a completion criterion and a key takeaway
  at every step.
- **Eleven tracked interactive laboratories** covering core statistics,
  Levey-Jennings interpretation, pattern recognition, Westgard rules, analytical
  performance specifications, Sigma metrics, QC strategy, biological variation
  and RCV, risk-based QC, investigation and recovery, external quality
  assessment, and patient-based real-time QC (PBRTQC).
- **QC-03 — QC Materials & Control Statistics**, an internal competency module
  completing the QC-01 → QC-12 pathway.
- **Morning QC Room**, a 12-case capstone decision simulation with a structured
  debrief.
- **Evidence & Scientific Basis**, documenting 40 sources, each with an explicit
  statement of what it informs and what is *not* claimed from it.

Every laboratory stays open at every level. Guided learning is scaffolding, not
restriction — a knowledgeable user can open any module directly at any time.

## Privacy

No account, no login, no analytics, no trackers, no external data connections.
Learner history is stored only in the browser's own `localStorage`. No name,
email, staff ID, institution or patient identifier is ever collected. See
[`release/PRIVACY.md`](release/PRIVACY.md).

## Running it

Requires a static web server at a host **root** (the build uses absolute asset
paths; non-root subpath deployment is not supported in v1.0.0).

```bash
cd v09
npm ci
npm run build:production     # -> v09/dist-vite-production/
```

Then serve `dist-vite-production/` at the root of a host or, locally:

```bash
cd v09/dist-vite-production && python3 -m http.server 8000
```

Direct `file://` launch is **not** supported. "Offline" means no internet
connection is required after download — a local static server is still needed.
See [`release/REPRODUCIBILITY.md`](release/REPRODUCIBILITY.md).

## Verification

```bash
cd v09
node tests/v100-learner-facing-calculations.test.cjs    # calculation/decision verification
node tests/v100-scenario-branch-verification.test.cjs   # 513 finite branches + state machine
node tests/v100-guided-learning.test.cjs                # guided-learning governance
```

## Licensing

This repository is released under a deliberate **two-part scope**:

| Material | Terms |
|---|---|
| Software / source code | **Apache License 2.0** ([`LICENSE`](LICENSE)) |
| Original educational content | **© 2026 Prasenjit Mitra. All rights reserved.** |
| Third-party material | Respective rights and licences |

Original educational content means explanatory prose, teaching cases and
scenarios, questions and feedback, guided-pathway content and original figures.
The canonical statement is in [`NOTICE`](NOTICE); see also
[`release/LICENSE_STATUS.md`](release/LICENSE_STATUS.md).

## Citation

See [`CITATION.cff`](v09/CITATION.cff).

> **DOI:** [10.5281/zenodo.22856598](https://doi.org/10.5281/zenodo.22856598)

## Status

**v1.0.0.** First stable citable release of PreciMind QC Learning Lab.
See [`v09/CHANGELOG.md`](v09/CHANGELOG.md) and
[`v09/docs/V09_RELEASE_CHECKLIST.md`](v09/docs/V09_RELEASE_CHECKLIST.md).
