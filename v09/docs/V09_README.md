# PreciMind QC Learning Lab v0.9 — README

## What this is

PreciMind QC Learning Lab is an educational simulation for laboratory-
medicine quality-control (QC) decision-making. Learners practice QC
signal recognition, investigation, intervention, verification, and
documentation across 12 scenario cases. The **Morning QC Room**
capstone integrates QC statistics, investigation strategy, and
patient-impact reasoning into a single guided decision simulation.

This is **educational simulation software**, not a clinical tool, not a
certification system, and not an employee-performance system.

## How to run it

The application is a static, local web build (`dist-vite-production/`
for the learner-facing app; `dist-morning-qc-dev/` for the isolated
developer/instructor launcher). Serve either directory with any static
file server (no build step or server-side component is required at
runtime) and open `index.html` (production) or `morning-qc-dev.html`
(dev launcher) in a browser.

Supported/tested runtime: a modern Chromium-based browser, verified via
real automated browser testing at desktop (1920×1080, 1366×768) and
mobile (390×844) viewports. Firefox and WebKit were not available for
testing in this development environment and their support is therefore
unverified, not claimed.

## Morning QC

Reached from the production navigation's 14th destination (labeled
CAPSTONE). Learners work through a QC signal, investigate using
information panels and evidence, apply interventions where genuinely
warranted, verify recovery, and receive a debrief comparing their
decisions and confidence against the case's accepted ground truth.
Correct **inaction** (not opening every panel, not intervening when
none is warranted) is explicitly valued — the simulation does not
reward busywork.

## Local learning history

Your progress (competency ratings, decision outcomes, confidence
calibration, verification behavior) is stored **only in your browser's
local storage** — never transmitted anywhere. You can reset this
history at any time from the case-bank screen; the control requires
explicit confirmation and cannot be triggered accidentally.

## Privacy

No name, email, staff ID, institution, patient identifier, IP address,
or device fingerprint is ever collected, stored, or exported — the
underlying data schema does not have fields for any of these, and
every attempt record is validated against a strict allowlist before
being persisted or exported. See `docs/V09_STAGE12D_ANALYTICS_SCHEMA.md`
(the accepted analytics-schema document — there is no separate
Stage 12E analytics schema; Stage 12E's research module documents its
own additional export fields in `data_dictionary.json`) and
the research data dictionary for exact field-level detail.

## Instructor / development workspace

A separate, **development-only** workspace (never part of the 14
production learner destinations) provides aggregate, denominator-
governed analytics over local attempt history: competency
distributions, confidence calibration, evidence-acquisition patterns,
verification behavior, and per-case summaries. It is reachable only
through the isolated developer launcher, not through normal learner
navigation, and every screen carries the disclaimer: *"Simulation-
learning analytics only. Not a measure of clinical competence or
employment performance."* There is no ranking, leaderboard, or
pass/fail threshold anywhere in this workspace.

## Synthetic demonstration data

The instructor workspace includes a "View synthetic demo (non-
destructive)" toggle that displays a fixed, clearly-labeled synthetic
dataset for demonstration and testing purposes. Activating it **never**
reads, writes, or otherwise touches your real local learning history —
it is held entirely in temporary in-browser state and disappears when
you exit the demo or reload the page. A prominent banner is shown
throughout demo mode so it can never be mistaken for real data.

## Educational research export

From the instructor workspace, you can prepare a local, anonymous
research-export bundle (`attempts.csv`, `competencies.csv`,
`events.jsonl`, a metric dictionary, a field-level data dictionary, and
a manifest) derived only from valid, already-anonymized attempt
records. Every record is independently re-validated before export;
malformed/legacy records are excluded and the exclusion count is
reported in the manifest, never silently hidden. Exact timestamps are
not included anywhere by default — `attempts.csv` uses a relative
attempt ordinal and duration, and `events.jsonl` uses a
`relativeTimestampMs` field (each event's time relative to that
attempt's own start) in place of the underlying analytics event's
absolute timestamp — to avoid the quasi-identifier risk of exact
wall-clock times combined with external schedules.

## Limitations

- This is a simulation-learning tool; it does not establish clinical
  competence or readiness for independent practice.
- Only Chromium has been tested; other browser engines are unverified.
- The case bank (12 cases) is not large enough to support statistically
  robust educational-research conclusions on its own.
- The instructor workspace is a development-stage tool, not a
  production LMS integration.

## Documents

- `V09_STAGE12D_REPORT.md` / `V09_STAGE12E_REPORT.md`: stage-by-stage
  implementation and audit history.
- `V09_STAGE12D_ADAPTIVE_SEQUENCING.md`,
  `V09_STAGE12D_ANALYTICS_SCHEMA.md`: adaptive/analytics design docs.
- `V09_STAGE12E_RELEASE_CHECKLIST.md`: the formal release-candidate
  checklist.
