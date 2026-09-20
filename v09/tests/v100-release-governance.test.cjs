/* =========================================================================
   v09/tests/v100-release-governance.test.cjs
   PROVENANCE: V09_NEW — v1.0 RC remediation, Workstreams 8, 10, 11.

   Permanent governance for the two-part licensing scope, the accepted
   minor release corrections, citation/metadata consistency, and the
   version freeze at 0.9.0.
   ========================================================================= */
'use strict';
const fs = require('fs'), path = require('path');
const V09 = path.join(__dirname, '..');
const ROOT = path.join(V09, '..');
let passed = 0, failed = 0;
const ok = (id, c, d) => { if (c) { console.log(`  \u2713 [${id}] ${d}`); passed++; } else { console.error(`  \u2717 [${id}] FAIL: ${d}`); failed++; } };
const read = p => fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';

console.log('\n=== WS8: two-part licensing scope, stated consistently ===');
const notice = read(path.join(V09, 'NOTICE'));
const lstatus = read(path.join(V09, 'release', 'LICENSE_STATUS.md'));
const rootReadme = read(path.join(ROOT, 'README.md'));
const relReadme = read(path.join(V09, 'release', 'README.md'));
const shell = read(path.join(V09, 'app', 'ui', 'app-shell.jsx'));
const screens = read(path.join(V09, 'app', 'ui', 'core-screens.jsx'));
const cff = read(path.join(V09, 'CITATION.cff'));

const surfaces = { NOTICE: notice, 'LICENSE_STATUS.md': lstatus, 'root README.md': rootReadme, 'release README.md': relReadme, 'in-app footer': shell, 'in-app About': screens };
for (const [name, txt] of Object.entries(surfaces)) {
  ok(`LIC-apache-${name}`, /Apache License[, ]*(Version )?2\.0|Apache-2\.0|Apache License 2\.0/.test(txt), `${name} states the Apache-2.0 software licence`);
  ok(`LIC-reserved-${name}`, /all rights reserved/i.test(txt), `${name} states the educational-content reservation`);
}
ok('LIC-thirdparty-NOTICE', /third-party/i.test(notice) && /respective rights/i.test(notice), 'NOTICE states third-party material keeps its own rights/licences');
ok('LIC-thirdparty-status', /third-party/i.test(lstatus), 'LICENSE_STATUS states the third-party position');
// No surface may claim Apache-2.0 covers the whole work.
for (const [name, txt] of Object.entries(surfaces)) {
  ok(`LIC-noblanket-${name}`, !/entire repository is licensed under the Apache|whole work.{0,20}Apache/i.test(txt), `${name} makes no blanket "everything is Apache" claim`);
}
ok('LIC-no-cc', !/Creative Commons/i.test(notice) || /No Creative Commons|not applied/i.test(lstatus), 'no Creative Commons licence applied to source code');
ok('LIC-pkg-json', JSON.parse(read(path.join(V09, 'package.json'))).license === 'Apache-2.0', 'package.json declares Apache-2.0 for the software package');
ok('LIC-file-exists', read(path.join(V09, 'LICENSE')).includes('Apache License'), 'LICENSE contains the Apache-2.0 text');
ok('LIC-cff-scope-note', /software/i.test(cff) && /all rights\s*\n?#?\s*reserved|reserved/i.test(cff), 'CITATION.cff notes its licence field refers to the software only');

console.log('\n=== WS10: accepted minor corrections ===');
ok('MIN-root-readme', rootReadme.length > 500, 'root README.md exists at the repository root');
ok('MIN-readme-version', /1\.0\.0/.test(rootReadme), 'root README states version 1.0.0');
const pkg = JSON.parse(read(path.join(V09, 'package.json')));
ok('MIN-build-script', pkg.scripts['build:production'] === 'vite build --config vite.production-integrated.config.mjs', 'named production build script exists');
const stats = read(path.join(V09, 'app', 'core', 'statistics.js'));
ok('MIN-no-fixture-log', !/console\.log\("\[PreciMind\] Scientific validation fixtures/.test(stats), 'unconditional fixture console logging removed');
ok('MIN-fixture-failure-kept', /SCIENTIFIC FIXTURE FAILURES/.test(stats), 'a genuine fixture FAILURE is still surfaced');
ok('MIN-fixtures-still-run', /export const FIXTURE_RESULTS = runFixtureChecks\(\)/.test(stats), 'the fixture self-check still runs at import');
ok('MIN-proto-app', !/This prototype draws on established concepts/.test(screens), 'application no longer describes itself as a prototype');
const appData = read(path.join(V09, 'app', 'ui', 'app-data.js'));
ok('MIN-proto-appdata', !/used in this prototype/.test(appData), 'evidence prose no longer calls the application a prototype');
ok('MIN-proto-exercise-kept', /prototype exercise/.test(screens), 'exercise-level "prototype exercise" wording deliberately preserved');

console.log('\n=== WS11: citation / release metadata consistency ===');
ok('CIT-version', /version:\s*1\.0\.0/.test(cff), 'CITATION.cff version is 1.0.0');
ok('CIT-orcid', /0000-0003-4826-1587/.test(cff), 'CITATION.cff carries the ORCID');
ok('CIT-doi-exact', /^doi:\s*10\.5281\/zenodo\.22856598\s*$/m.test(cff), 'CITATION.cff carries the exact reserved DOI (10.5281/zenodo.22856598), not a fabricated or different value');
ok('CIT-doi-future-proof', !/unpublished|not yet active|does not yet resolve/i.test(cff), 'CITATION.cff carries the DOI without temporary publication-status wording');
ok('CIT-no-placeholder', !/DOI-PLACEHOLDER-AWAITING-ZENODO-RESERVATION/.test(rootReadme) && !/DOI-PLACEHOLDER-AWAITING-ZENODO-RESERVATION/.test(relReadme), 'the old DOI placeholder is gone from both READMEs now that a real DOI is reserved');
ok('README-doi-exact', rootReadme.includes('10.5281/zenodo.22856598') && relReadme.includes('10.5281/zenodo.22856598'), 'both READMEs carry the exact reserved DOI');
ok('CIT-orcid-about', /0000-0003-4826-1587/.test(screens), 'About modal carries the same ORCID');
for (const [n, t] of [['root README', rootReadme], ['release README', relReadme], ['About', screens], ['CITATION.cff', cff]]) {
  ok(`CIT-name-${n}`, /Prasenjit Mitra/.test(t), `${n} attributes Prasenjit Mitra`);
}

console.log('\n=== Version freeze at 1.0.0 (promoted from 0.9.0 by explicit instruction) ===');
ok('VER-file', read(path.join(V09, 'VERSION')).trim() === '1.0.0', 'VERSION is 1.0.0');
ok('VER-pkg', pkg.version === '1.0.0', 'package.json version is 1.0.0');
ok('VER-about', /Version 1\.0\.0/.test(screens), 'About modal shows Version 1.0.0');
ok('VER-no-stale-090', !/Version 0\.9\.0/.test(screens) && !/"version":\s*"0\.9\.0"/.test(read(path.join(V09, 'package.json'))), 'no stale "Version 0.9.0" residue in the About modal or package.json now that 1.0.0 is current');

const total = passed + failed;
console.log(`\n${'='.repeat(60)}`);
console.log(`Release Governance (licensing / minor corrections / metadata): ${passed}/${total} passed, ${failed} failed`);
if (failed > 0) { console.error('RELEASE GOVERNANCE TESTS FAILED.'); process.exit(1); }
console.log('ALL RELEASE GOVERNANCE TESTS PASSED.');
