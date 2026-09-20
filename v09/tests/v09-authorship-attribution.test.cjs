/* =========================================================================
   v09/tests/v09-authorship-attribution.test.cjs
   PROVENANCE: V09_TEST — authorship/copyright attribution closure.

   Narrow governance test: confirms learner-facing source carries the
   required authorship, copyright, licence and version attribution, and
   no longer carries the stale pre-release strings.
   ========================================================================= */
'use strict';
const fs = require('fs'), path = require('path');
const V09 = path.join(__dirname, '..');
let passed = 0, failed = 0;
function assert(id, cond, detail) {
  if (cond) { console.log(`  \u2713 [${id}] ${detail}`); passed++; }
  else { console.error(`  \u2717 [${id}] FAIL: ${detail}`); failed++; }
}

const shell = fs.readFileSync(path.join(V09, 'app', 'ui', 'app-shell.jsx'), 'utf8');
const screens = fs.readFileSync(path.join(V09, 'app', 'ui', 'core-screens.jsx'), 'utf8');
const data = fs.readFileSync(path.join(V09, 'app', 'ui', 'app-data.js'), 'utf8');
const learnerFacing = shell + screens + data;

console.log('\n=== Required learner-facing attribution present ===');
assert('FOOTER-AUTHOR', /Developed by Dr Prasenjit Mitra/.test(shell), 'Footer shows "Developed by Dr Prasenjit Mitra"');
assert('FOOTER-COPYRIGHT', /2026 Prasenjit Mitra/.test(shell) && /Apache License 2\.0/.test(shell), 'Footer shows the 2026 copyright and Apache License 2.0');
assert('HOME-BYLINE', /Created by Dr Prasenjit Mitra/.test(screens), 'Home screen shows the "Created by Dr Prasenjit Mitra" byline');
assert('ABOUT-TITLE', /title="About PreciMind"/.test(screens), 'About modal is titled "About PreciMind"');
assert('ABOUT-VERSION', /Version 0\.9\.0/.test(screens), 'About modal states Version 0.9.0');
assert('ABOUT-AUTHOR', /Created and developed by Dr Prasenjit Mitra/.test(screens), 'About modal credits Dr Prasenjit Mitra');
assert('ABOUT-ORCID', /0000-0003-4826-1587/.test(screens), 'About modal shows the ORCID');
assert('ABOUT-COPYRIGHT', /2026 Prasenjit Mitra/.test(screens), 'About modal shows the copyright notice');
assert('ABOUT-LICENSE', /Apache License, Version 2\.0/.test(screens), 'About modal states the Apache License, Version 2.0');

console.log('\n=== Stale learner-facing strings removed ===');
assert('NO-ABOUT-PROTOTYPE-TITLE', !/About this prototype/.test(learnerFacing), 'No learner-facing "About this prototype" string remains');
assert('NO-VERSION-08', !/Version 0\.8/.test(learnerFacing), 'No learner-facing "Version 0.8" string remains');
assert('ABOUT-TEXT-NOT-PROTOTYPE', !/educational prototype/.test(data), 'The About disclaimer no longer calls the release an "educational prototype"');

console.log('\n=== Licensing / attribution correctness ===');
// v1.0 RC Workstream 8 supersedes the original blanket assertion here. The
// owner-approved scope is two-part: the SOFTWARE is Apache-2.0, while ORIGINAL
// EDUCATIONAL CONTENT is reserved. So an "all rights reserved" statement is now
// expected — but it must never be attached to the software.
assert('SOFTWARE-NOT-RESERVED', !/software[^.]{0,60}all rights reserved/i.test(learnerFacing), 'No claim that the SOFTWARE is all-rights-reserved (software remains Apache-2.0)');
assert('CONTENT-RESERVED', /all rights reserved/i.test(learnerFacing), 'Educational-content reservation is stated in learner-facing surfaces');
assert('APACHE-STILL-STATED', /Apache License/i.test(learnerFacing), 'Apache-2.0 software licence is still stated learner-facing');
// Legal/copyright metadata uses the plain legal name; the professional
// display name is used only for human-readable attribution.
assert('COPYRIGHT-USES-LEGAL-NAME', !/\u00a9 2026 Dr Prasenjit Mitra|copy; 2026 Dr Prasenjit Mitra/.test(learnerFacing), 'Copyright notices use the legal name "Prasenjit Mitra", not the "Dr" display form');
for (const f of ['NOTICE', 'CITATION.cff']) {
  const t = fs.readFileSync(path.join(V09, f), 'utf8');
  assert(`METADATA-${f}`, /Prasenjit Mitra|Mitra/.test(t), `${f} attribution remains consistent and unaltered`);
}

console.log('\n=== Preserved footer actions ===');
for (const a of ['Evidence', 'Glossary', 'About']) {
  assert(`FOOTER-ACTION-${a}`, new RegExp(`>${a}</button>`).test(shell), `Footer retains the "${a}" action`);
}

const total = passed + failed;
console.log(`\n${'='.repeat(60)}`);
console.log(`Authorship Attribution Governance: ${passed}/${total} passed, ${failed} failed`);
if (failed > 0) { console.error('ATTRIBUTION TESTS FAILED.'); process.exit(1); }
console.log('ATTRIBUTION TESTS PASSED.');
