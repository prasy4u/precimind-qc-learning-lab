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

/** Finds `SOMEFILE.md`/`SOMEFILE.json`/`SOMEFILE.cff` style backtick-quoted references in text. */
function findReferencedFilenames(text) {
  const matches = text.matchAll(/`([A-Za-z0-9_.-]+\.(?:md|json|cff))`/g);
  return [...new Set([...matches].map(m => m[1]))];
}

function auditPackage(pkgDir, label) {
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
      const context = text.slice(Math.max(0, refIndex - 20), refIndex + ref.length + 100);
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
  }

  console.log('\n=== Production tree hash unchanged (Item 6) ===');
  {
    const { execSync } = require('child_process');
    const output = execSync(`node ${path.join(V09, 'tools', 'hash-build-tree.cjs')} ${path.join(V09, 'dist-vite-production')}`).toString();
    const hash = output.match(/TREE HASH \(SHA-256 of canonical manifest\): (\S+)/)?.[1];
    assert('PROD-HASH-UNCHANGED', hash === '04fa0a3222150b7d07300617685eaf3ccc46fd08dd3f0129fe027377ce2b2ed1', `Production tree hash remains byte-identical (found ${hash})`);
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
