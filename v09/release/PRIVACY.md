# Privacy

## Application behaviour

PreciMind QC Learning Lab, as shipped:

- stores learner history **locally in the browser** (`localStorage`) only;
- does **not** require a learner's name;
- does **not** require an email address;
- does **not** require a staff/employee ID;
- does **not** require an institution to be specified;
- does **not** transmit learning analytics externally — there is no
  server-side account or analytics database in this application;
- does **not** contain third-party analytics trackers;
- does **not** use advertising trackers;
- does **not** require an account or sign-in.

A network audit of the production build found no external
`fetch`/`XMLHttpRequest`/`WebSocket` calls other than the browser's own
standard, same-origin module-preloading (a routine bundler mechanism
that only ever requests the application's own bundled files).

## Research export (instructor/development workspace)

The instructor/development workspace (not part of the 14 production
learner destinations) can prepare a local, anonymous research-export
bundle. It:

- independently re-validates every stored record before export, and
  reports the excluded/quarantined count truthfully — including an
  explicit "storage container unreadable" state distinct from a
  genuinely empty dataset;
- uses **relative** event timing (`relativeTimestampMs`, milliseconds
  since that attempt's own start) rather than exact wall-clock
  timestamps, specifically to avoid the quasi-identifier risk of exact
  times combined with external schedules or logs;
- contains no direct identity field by construction — the canonical
  attempt-record schema has no field for learner name, email, staff ID,
  institution, patient identifier, device fingerprint, or IP address,
  and the record validator strictly rejects any such field if injected;
- links rows within a single export only via a short-lived, anonymous,
  per-export `rowKey` — never derived from any identity field.

**Limitation.** As with any exported behavioral dataset, the absence of
direct identifiers does not guarantee that re-identification is
impossible in every conceivable context (for example, a very small,
unusual dataset combined with strong outside knowledge could in
principle narrow down who generated it). Treat exported data as
sensitive research material and handle it accordingly.

## Hosting distinction

The PreciMind application itself does not transmit learner analytics
to any server. The planned public application URL is
`https://precimind.drprasenjitmitra.com/`, hosted at the root of its
own subdomain (root-path hosting is required — see this package's own
`README.md`
for the documented deployment constraint). Once actually deployed,
that hosting provider will necessarily process ordinary HTTP/security
logs (e.g., IP addresses, request timestamps) according to **that
provider's own policies** — this is a property of web hosting in
general, not of the PreciMind application, and this document does not
claim otherwise before deployment actually occurs.
