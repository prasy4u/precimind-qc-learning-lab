# PreciMind QC Learning Lab — Offline Distribution Package (v1.0.0)

This package contains the complete learner-facing static web application
for use **without an internet connection**, plus release documentation.

**"Offline" means no internet connection is required *after* download.**
It does **not** mean double-clicking `index.html` directly — see
"How to run it" below for the tested method.

## Educational simulation only

PreciMind QC Learning Lab is an educational simulation platform for
laboratory quality-control reasoning. It is **not** a medical device,
not clinical decision-support software, and not a certification tool.

## Intended audience

Laboratory-medicine and clinical-chemistry learners, educators, and
programs seeking a hands-on, low-stakes way to practice QC reasoning —
here, specifically in an offline/air-gapped or unreliable-connectivity
setting (e.g. a teaching lab without internet access).

## Privacy by design

No learner name, email, staff ID, institution, or any other identity
field is ever required or collected. All learning history is stored
locally in your own browser, on the machine you run this on. See
`PRIVACY.md` for full detail. This is true regardless of whether you
are online or offline.

## How to run it

Direct `file://` launch (double-clicking `index.html`) is **not
supported** — modern browsers restrict module loading from the
`file://` protocol, and this build will not run correctly that way.

The tested method is a local static HTTP server, serving this
package's files from its own **root** (not a subpath):

```bash
cd <this extracted package's folder>
python3 -m http.server 8000
```

Then open **http://localhost:8000/** in a modern Chromium-based
browser. Any other static file server works equally well (Node's
`http-server`, VS Code's "Live Server" extension, etc.) — the
requirement is root-path serving over HTTP(S), not any specific tool.

No internet connection is required once the package is downloaded and
you are serving it locally. No part of the application makes an
outbound network request.

## Supported execution method / browser support actually tested

This v1.0.0 release was validated with a real **Chromium** browser
at desktop (1920×1080, 1366×768) and mobile (390×844) viewports,
served from the root of a local static HTTP server as described above.
Firefox and WebKit/Safari were not available for testing in this
validation environment — this is reported honestly as untested, not
claimed as unsupported. Non-root subpath serving is confirmed
non-functional (the build uses absolute asset paths); rebuilding from
source with a configured base path may allow subpath deployment, but
this has not been tested and is not supported in v1.0.0.

## Online use

If you have internet access, the same functionality is available at
**https://qc.drprasenjitmitra.com/**, or see the separate Web
distribution package for a self-hosted online deployment.

## Research/instructor analytics status

An instructor/research analytics workspace exists in the development
build for use by programs studying their own local learner data; it is
not part of this learner-facing distribution. See the audit repository
package if you need that workspace.

## Educational-use limitation

Completing PreciMind exercises does not certify clinical competence,
does not establish readiness for independent professional practice,
and must not be used for employment-performance evaluation.

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

See `CITATION.cff` for citation metadata (author, ORCID, repository, and
the software licence). Its `license` field refers to the software only.

DOI: [10.5281/zenodo.22856598](https://doi.org/10.5281/zenodo.22856598)
