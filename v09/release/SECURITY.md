# Security Policy

## Supported version

| Version | Supported |
|---|---|
| 0.9.0 (release candidate) | Yes |

## Reporting a vulnerability

Security vulnerabilities should be reported **privately** to:

**drmitraprasenjit@gmail.com**

Please do **not** disclose suspected vulnerabilities through public
GitHub issues. Once the public GitHub repository
(`https://github.com/prasy4u/precimind-qc-learning-lab`) exists,
GitHub Private Vulnerability Reporting may also be enabled and used as
an additional reporting channel alongside this email address.

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
for, the security practices of GitHub, any DNS provider, or any
browser/operating system used to run the application.
