# License Status

**RELEASE-GOVERNANCE BLOCKER — LICENSE DECISION PENDING.**

No authoritative software license file (e.g. a file named LICENSE,
LICENSE.md, or LICENSE.txt) was found anywhere in this repository, and
no "license" field is present in this project's own package.json. This
repository therefore has **no established open-source (or other)
license for its source code** as of this release candidate.

This is treated here as a **release-governance blocker**, not a
software defect: the licensing/ownership decision for the source code
is a project-owner/institutional decision that Stage 12F does not have
the authority to make. In particular, this document does **not**:

- invent or apply an open-source license (MIT, Apache-2.0, GPL, or
  otherwise) to the source code;
- apply a Creative Commons license to the source code (Creative
  Commons licenses are designed for creative/content works, not
  software, and are not appropriate for source code regardless);
- assume any default license.

## What this means for release

- The compiled learner-facing static application (the "Web" and
  "Offline" distribution packages) may eventually be distributed under
  whatever terms the project owner/institution approves, once decided.
- Until a license decision is made and documented, this source
  repository should be treated as **all rights reserved** by default
  (the standard legal default in the absence of an explicit license
  grant).
- Any educational documentation or content assets that might later
  receive a separate Creative-Commons-style content license are a
  distinct decision from the source-code license, and are likewise not
  decided here.

## Action required before public release

A project owner or institutional authority must:
1. Decide the intended software license (or confirm "all rights
   reserved" is intentional).
2. Add the corresponding LICENSE file at the repository root.
3. Add the corresponding "license" field to this project's package.json.
4. Update this document to reflect the decision.
