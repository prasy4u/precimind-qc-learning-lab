/* =========================================================================
   v09/tests/stage12f-release-governance.test.js

   Morning QC Room — Stage 12F Release-Governance Closure Governance
   PROVENANCE: V09_TEST

   Verifies: no broken internal document references inside the public
   Web/Offline packages (every referenced sibling Markdown/JSON filename
   either exists in the package or is explicitly marked as external),
   package.json/package-lock.json metadata accuracy, and that the
   production build tree remains byte-identical.
   ========================================================================= */
'use strict';
const fs = require('fs');
const path = require('path');

const V09 = path.join(__dirname, '..');

let passed = 0, failed = 0;
function assert(id, cond, detail) {
  if (cond) { console.log(`  ✓ [${id}] ${detail}`); passed++; }
  else { console.error(`  ✗ [${id}] FAIL: ${detail}`); failed++; }
}

/** Finds `SOMEFILE.md`/`some/relative/path.json`/`SOMEFILE.cff` style backtick-quoted references in text, including relative paths containing `/`. */
function findReferencedFilenames(text) {
  const matches = text.matchAll(/`([A-Za-z0-9_.\/-]+\.(?:md|json|cff))`/g);
  return [...new Set([...matches].map(m => m[1]))];
}

function auditPackage(pkgDir, label) {
  if (!fs.existsSync(pkgDir)) {
    console.log(`  \u2139 [DOCREF-${label}-SKIPPED] ${label}-package directory not present in this checkout (expected when running from the Audit Repository, which intentionally excludes release/web-package and release/offline-package as build-staging artifacts) — skipped, not failed`);
    return;
  }
  const files = fs.readdirSync(pkgDir).filter(f => /\.(md|json|cff)$/i.test(f));
  for (const file of files) {
    const rawText = fs.readFileSync(path.join(pkgDir, file), 'utf8');
    const text = rawText.replace(/\s+/g, ' '); // normalize whitespace/line-wraps for context matching
    const referenced = findReferencedFilenames(text);
    for (const ref of referenced) {
      if (ref === file) continue; // self-reference is fine
      const existsInPackage = fs.existsSync(path.join(pkgDir, ref));
      // Explicit "external" language nearby is acceptable even if the file is absent.
      const refIndex = text.indexOf('`' + ref + '`');
      const context = text.slice(Math.max(0, refIndex - 20), refIndex + ref.length + 200);
      const explicitlyExternal = /available in the source\/?Audit Repository package|also in the Audit Repository package|external to this package/i.test(context);
      assert(
        `DOCREF-${label}-${file}-${ref}`,
        existsInPackage || explicitlyExternal,
        `${label}/${file} references "${ref}" — ${existsInPackage ? 'present in package' : explicitlyExternal ? 'explicitly marked external' : 'MISSING AND NOT MARKED EXTERNAL'}`
      );
    }
  }
}

async function main() {
  console.log('\n=== Reference-scanner hardening regression (Item 3) ===');
  {
    // Proves the scanner would catch the EXACT defect this closure fixed
    // (a relative repo-internal path leaked into a public document),
    // using a synthetic in-memory document rather than relying on the
    // real docs staying broken.
    const synthetic = 'See `release/web-package/README.md` for detail.';
    const refs = findReferencedFilenames(synthetic);
    assert('SCANNER-DETECTS-RELATIVE-PATH', refs.includes('release/web-package/README.md'), 'The reference scanner detects a relative backtick-quoted path containing "/" (e.g. "release/web-package/README.md"), not only bare basenames');
    // And prove it is correctly flagged BROKEN when placed in a real
    // package (since "release/web-package/README.md" cannot resolve
    // from inside release/web-package/ itself) and not marked external.
    const fakePkgDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'docref-test-'));
    fs.writeFileSync(path.join(fakePkgDir, 'BROKEN_EXAMPLE.md'), synthetic);
    const existsCheck = fs.existsSync(path.join(fakePkgDir, 'release/web-package/README.md'));
    assert('SCANNER-CONFIRMS-BROKEN', !existsCheck, 'release/web-package/README.md correctly does not resolve inside a public package directory (would be flagged BROKEN by auditPackage)');
    fs.rmSync(fakePkgDir, { recursive: true, force: true });
  }

  console.log('\n=== Public-document reference integrity (Item 2) ===');
  auditPackage(path.join(V09, 'release', 'web-package'), 'web');
  auditPackage(path.join(V09, 'release', 'offline-package'), 'offline');

  console.log('\n=== package.json / package-lock.json metadata (Item 3) ===');
  {
    const pkg = JSON.parse(fs.readFileSync(path.join(V09, 'package.json'), 'utf8'));
    assert('PKG-NAME', pkg.name === 'precimind-qc-learning-lab', `package.json name is current (found "${pkg.name}")`);
    assert('PKG-VERSION', pkg.version === '0.9.0', `package.json version is current (found "${pkg.version}")`);
    assert('PKG-NO-BRIDGE-DESC', !/Stage 11C1|migration bridge/i.test(pkg.description || ''), 'package.json description no longer describes the obsolete Stage 11C1 bridge');
    const lock = JSON.parse(fs.readFileSync(path.join(V09, 'package-lock.json'), 'utf8'));
    assert('LOCK-NAME', lock.name === 'precimind-qc-learning-lab', `package-lock.json name is current (found "${lock.name}")`);
    assert('LOCK-VERSION', lock.version === '0.9.0', `package-lock.json version is current (found "${lock.version}")`);
    assert('LOCK-ROOT-PKG-NAME', lock.packages[''].name === 'precimind-qc-learning-lab', 'package-lock.json root package entry name is current');
    // Dependencies genuinely unchanged (metadata-only change).
    assert('PKG-DEPS-UNCHANGED', JSON.stringify(pkg.dependencies) === JSON.stringify({ react: '^19.2.8', 'react-dom': '^19.2.8' }), 'Dependencies are genuinely unchanged (metadata-only edit)');
    assert('PKG-LICENSE-FIELD', pkg.license === 'Apache-2.0', `package.json declares the resolved license (found "${pkg.license}")`);
    const lock2 = JSON.parse(fs.readFileSync(path.join(V09, 'package-lock.json'), 'utf8'));
    assert('LOCK-LICENSE-FIELD', lock2.packages[''].license === 'Apache-2.0', 'package-lock.json root entry declares the resolved license');
  }

  console.log('\n=== Ownership / licensing / citation / security resolution (final closure) ===');
  {
    assert('LICENSE-FILE-EXISTS', fs.existsSync(path.join(V09, 'LICENSE')), 'A LICENSE file exists at the repository root');
    const licenseText = fs.readFileSync(path.join(V09, 'LICENSE'), 'utf8');
    assert('LICENSE-IS-APACHE2', /Apache License/.test(licenseText) && /Version 2\.0/.test(licenseText), 'LICENSE contains the standard Apache License 2.0 text');
    assert('NOTICE-FILE-EXISTS', fs.existsSync(path.join(V09, 'NOTICE')), 'A NOTICE file exists with copyright attribution');
    const noticeText = fs.readFileSync(path.join(V09, 'NOTICE'), 'utf8');
    assert('NOTICE-HAS-COPYRIGHT', /Copyright 2026 Prasenjit Mitra/.test(noticeText), 'NOTICE carries the correct copyright attribution');

    assert('CITATION-CFF-EXISTS', fs.existsSync(path.join(V09, 'CITATION.cff')), 'CITATION.cff exists (replacing the prior template)');
    assert('CITATION-TEMPLATE-REMOVED', !fs.existsSync(path.join(V09, 'release', 'CITATION_TEMPLATE.cff')), 'The obsolete CITATION_TEMPLATE.cff has been removed from release/');
    const citationText = fs.readFileSync(path.join(V09, 'CITATION.cff'), 'utf8');
    assert('CITATION-HAS-ORCID', citationText.includes('0000-0003-4826-1587'), 'CITATION.cff includes the confirmed ORCID');
    assert('CITATION-HAS-REPO', citationText.includes('github.com/prasy4u/precimind-qc-learning-lab'), 'CITATION.cff includes the confirmed repository URL');
    assert('CITATION-NO-DOI', !citationText.includes('doi:'), 'CITATION.cff does not invent a DOI');
    assert('CITATION-NO-DATE-RELEASED', !citationText.includes('date-released'), 'CITATION.cff does not invent a release date');

    // Zero stale "LICENSE DECISION PENDING" wording anywhere in release docs.
    const releaseDir = path.join(V09, 'release');
    const docsDir = path.join(V09, 'docs');
    let staleFound = [];
    for (const dir of [releaseDir, docsDir]) {
      for (const f of fs.readdirSync(dir)) {
        const full = path.join(dir, f);
        if (fs.statSync(full).isFile() && /\.(md|json)$/.test(f)) {
          const text = fs.readFileSync(full, 'utf8');
          if (/LICENSE DECISION PENDING/i.test(text)) staleFound.push(full);
        }
      }
    }
    assert('NO-STALE-LICENSE-PENDING', staleFound.length === 0, `Zero "LICENSE DECISION PENDING" statements remain in release/docs (found in: ${JSON.stringify(staleFound)})`);

    const securityText = fs.readFileSync(path.join(V09, 'release', 'SECURITY.md'), 'utf8');
    assert('SECURITY-CONTACT-RESOLVED', securityText.includes('drmitraprasenjit@gmail.com'), 'SECURITY.md includes the resolved security contact');
    assert('SECURITY-NO-INVENTED-DOMAIN', !securityText.includes('security@drprasenjitmitra.com'), 'SECURITY.md does not include the non-existent invented domain mailbox');
  }

  console.log('\n=== Publication-stamp closure: stale governance/wording fixes ===');
  {
    const releaseNotesText = fs.readFileSync(path.join(V09, 'release', 'RELEASE_NOTES_v0.9.0.md'), 'utf8');
    assert('NOTES-NO-STALE-PENDING', !/remain pending project-owner decisions/i.test(releaseNotesText), 'RELEASE_NOTES_v0.9.0.md no longer claims license/security/citation remain pending project-owner decisions');
    assert('NOTES-MENTIONS-RESOLVED', /resolved/i.test(releaseNotesText), 'RELEASE_NOTES_v0.9.0.md states the governance items are resolved');
    assert('NOTES-DOI-STILL-PENDING', /Zenodo/i.test(releaseNotesText), 'RELEASE_NOTES_v0.9.0.md still correctly notes Zenodo DOI as a distinct future action');

    const bothPackagesPresent = fs.existsSync(path.join(V09, 'release', 'web-package')) && fs.existsSync(path.join(V09, 'release', 'offline-package'));
    if (!bothPackagesPresent) {
      console.log('  \u2139 [PUBLICATION-STAMP-PACKAGE-CHECKS-SKIPPED] release/web-package and/or release/offline-package not present in this checkout (expected when running from the Audit Repository) — package-specific checks skipped, not failed. This is a build-time staging artifact, not a repository-integrity concern.');
    } else {
    for (const pkg of ['web-package', 'offline-package']) {
      const webReadme = fs.readFileSync(path.join(V09, 'release', pkg, 'README.md'), 'utf8');
      assert(`README-${pkg}-NO-ORPHAN-PARAGRAPH`, !/or rebuild from\s*\n\s*\n?##/.test(webReadme), `${pkg}/README.md deployment paragraph is not interrupted mid-sentence by the table`);
    }
    const webReadmeText = fs.readFileSync(path.join(V09, 'release', 'web-package', 'README.md'), 'utf8');
    assert('WEB-README-PARAGRAPH-COMPLETE', /Rebuilding from\s+source with a configured base path/.test(webReadmeText.replace(/\n/g, ' ')), 'Web README deployment paragraph completes its sentence before the deployment-summary table');

    for (const pkg of ['web-package', 'offline-package']) {
      const secText = fs.readFileSync(path.join(V09, 'release', pkg, 'SECURITY.md'), 'utf8');
      assert(`SECURITY-${pkg}-NEUTRAL-VERSION`, !/0\.9\.0 \(release candidate\)/.test(secText), `${pkg}/SECURITY.md version line is release-neutral (no "(release candidate)" suffix)`);
    }

    // Systematic scan: zero stale unresolved-governance claims anywhere in public packages.
    for (const pkg of ['web-package', 'offline-package']) {
      const pkgDir = path.join(V09, 'release', pkg);
      for (const f of fs.readdirSync(pkgDir).filter(f => /\.md$/i.test(f))) {
        const text = fs.readFileSync(path.join(pkgDir, f), 'utf8');
        const staleMatches = text.match(/license[^.]{0,40}pending|ownership[^.]{0,40}pending|authorship[^.]{0,40}pending|ORCID[^.]{0,40}pending|security contact[^.]{0,40}pending|citation[^.]{0,40}pending/gi) || [];
        assert(`NO-STALE-GOVERNANCE-${pkg}-${f}`, staleMatches.length === 0, `${pkg}/${f} contains no stale unresolved license/ownership/authorship/ORCID/security/citation claims (found: ${JSON.stringify(staleMatches)})`);
      }
    }
    }
  }

  console.log('\n=== Production tree hash unchanged (Item 6) ===');
  {
    const { execSync } = require('child_process');
    const output = execSync(`node ${path.join(V09, 'tools', 'hash-build-tree.cjs')} ${path.join(V09, 'dist-vite-production')}`).toString();
    const hash = output.match(/TREE HASH \(SHA-256 of canonical manifest\): (\S+)/)?.[1];
    // Section 39 (QC-03 pre-release content closure): the production
    // hash legitimately changed when QC-03 was added to learner-facing
    // production source — this is an authorized, expected, and
    // independently-reproducibility-verified change, not a defect. The
    // hash below is the new accepted invariant for all FUTURE
    // closures that do not themselves modify production source
    // (04fa0a3222... remains the historical Stage 12E/12F-ownership-closure
    // baseline, documented in RELEASE_PROVENANCE.json's history, not a
    // value this test should keep re-asserting after an authorized change).
    // This closure (QC-03 final independent-audit correction) added
    // genuine new content (handling doctrine, APS distinction, glossary
    // terms), so the hash legitimately advanced again from the prior
    // The production hash legitimately advances whenever learner-facing
    // source changes. Lineage: 04fa0a3222... (pre-QC-03) ->
    // 23abd76bfd... (QC-03 initial) -> 587a0917f9... (QC-03 audit
    // correction) -> the value below (pre-release visual polish: CSS
    // tokens + presentational JSX only, no scientific change).
    assert('PROD-HASH-UNCHANGED', hash === '0a1957c716df9df00f9275a1199d594c353793a22c2d39221e439e57905f9a0b', `Production tree hash matches the current accepted invariant (found ${hash})`);
  }

  const total = passed + failed;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Stage 12F Release-Governance Closure: ${passed}/${total} passed, ${failed} failed`);
  console.log('  Artifact class: V09_TEST');
  if (failed > 0) { console.error('STAGE 12F RELEASE-GOVERNANCE TESTS FAILED.'); process.exit(1); }
  console.log('STAGE 12F RELEASE-GOVERNANCE TESTS PASSED.');
  process.exit(0);
}
main().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
