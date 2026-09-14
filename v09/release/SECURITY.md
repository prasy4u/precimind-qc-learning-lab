# Security Policy

## Supported version

| Version | Supported |
|---|---|
| 0.9.0 (release candidate) | Yes |

## Reporting a vulnerability

**RELEASE BLOCKER — SECURITY CONTACT UNRESOLVED.** No public
security-reporting email address or issue tracker has been
authoritatively supplied for this project as of this release
candidate. Before public release, the project owner must configure and
publish an actual reporting channel (e.g. a dedicated security email
address, or a private vulnerability-reporting feature on a public
repository host). This document must be updated with that real contact
information at that time — no placeholder contact should be invented
in the interim.

## Architecture-relevant security notes

- PreciMind has **no server-side account database** — there is nothing
  resembling a username/password store to compromise on the
  application side.
- **No secrets are required** for normal operation (no API keys,
  tokens, or credentials are read, stored, or required at runtime).
- Learner history is stored only in the browser's own `localStorage`,
  scoped by the browser's same-origin policy exactly like any other
  web application's local storage.
- Third-party JavaScript dependencies are limited to `react` and
  `react-dom` at runtime (see `THIRD_PARTY_NOTICES.md`); keeping these
  reasonably current, and monitoring their own published security
  advisories, is the primary ongoing dependency-security practice for
  this project.

## Scope of security claims

This document describes the security posture of the PreciMind
**application** as shipped. It does not describe, and cannot vouch
for, the security practices of any future hosting provider, browser,
or operating system used to run it.
