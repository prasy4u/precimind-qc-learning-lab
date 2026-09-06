#!/usr/bin/env node
/* =========================================================================
   v09/tools/verify-stage11c2-transform.cjs

   Stage 11C2 — Strict Source-Transformation Verifier
   Artifact Class: V09_TEST (retained)

   Demonstrates that each of the 34 active modules (v09/app/**) is a
   SURGICAL ES-module derivative of the corresponding frozen Stage 11C1
   source (v09/src/**), not a rewritten implementation.

   Method: normalize BOTH the frozen legacy source and the active migrated
   source by removing exactly the classes of line explicitly permitted to
   differ:
     - added `import` lines (lines starting with "import ")
     - the CommonJS guard block (module.exports / typeof module check)
     - the `export ` prefix on declarations (normalized away for comparison)
     - for shared-components.jsx: the React-hook destructuring line
     - for app-shell.jsx: the 19 mount lines + the rootEl declaration line

   After normalization, the two versions must be BYTE-IDENTICAL. Any other
   difference (scientific constant, formula, teaching text, case, doctrine,
   etc.) causes verification to FAIL for that module.

   Run: node tools/verify-stage11c2-transform.cjs
   ========================================================================= */
'use strict';

const fs = require('fs');
const path = require('path');

const V09 = path.join(__dirname, '..');
const MANIFEST = JSON.parse(fs.readFileSync(path.join(V09, 'tools', 'v09-source-order.json'), 'utf8'));

function normalizeActive(src, legacyPath) {
  let lines = src.split('\n');

  // Remove added import lines (lines starting with "import ")
  lines = lines.filter(l => !l.startsWith('import '));

  // Remove "export " prefix from declarations for comparison purposes
  lines = lines.map(l => {
    if (l.startsWith('export function ')) return l.replace('export function ', 'function ');
    if (l.startsWith('export const ')) return l.replace('export const ', 'const ');
    if (l.startsWith('export let ')) return l.replace('export let ', 'let ');
    if (l.startsWith('export var ')) return l.replace('export var ', 'var ');
    return l;
  });

  let out = lines.join('\n');

  // Remove leading blank lines left by import removal (normalize whitespace
  // runs at the very start of the file only, to avoid masking body changes).
  out = out.replace(/^\n+/, '');

  return out;
}

function normalizeLegacy(src, legacyPath) {
  let out = src;

  // Remove CommonJS guard block (if present) — same regex as the migration script.
  const guardRe = /\n?if \(typeof module !== "undefined" && module\.exports\) \{\s*\n\s*module\.exports = \{[\s\S]*?\};\s*\n\}\s*\n?$/;
  out = out.replace(guardRe, '\n');

  if (legacyPath === 'src/ui/shared-components.jsx') {
    out = out.replace(/^const\s*\{\s*useState,\s*useMemo,\s*useRef,\s*useEffect\s*\}\s*=\s*React;\s*\n/m, '');
  }

  if (legacyPath === 'src/ui/app-shell.jsx') {
    const mountLineRe = /^\s*ReactDOM\.createRoot\(rootEl\)\.render\(<App \/>\);\s*$/;
    out = out.split('\n').filter(l => !mountLineRe.test(l)).join('\n');
    out = out.replace(/^const rootEl = document\.getElementById\("root"\);\s*\n/m, '');
  }

  out = out.replace(/^\n+/, '');
  return out;
}

const results = [];
let allPass = true;

for (const mod of MANIFEST.application_modules) {
  const legacyPath = mod.path;
  const activePath = legacyPath.replace(/^src\//, 'app/');
  const legacySrc = fs.readFileSync(path.join(V09, legacyPath), 'utf8');
  const activeSrc = fs.readFileSync(path.join(V09, activePath), 'utf8');

  const normalizedLegacy = normalizeLegacy(legacySrc, legacyPath);
  const normalizedActive = normalizeActive(activeSrc, legacyPath);

  const pass = normalizedLegacy === normalizedActive;
  if (!pass) allPass = false;

  let firstDiffContext = null;
  if (!pass) {
    const a = normalizedLegacy, b = normalizedActive;
    let i = 0;
    while (i < Math.min(a.length, b.length) && a[i] === b[i]) i++;
    firstDiffContext = {
      position: i,
      legacyContext: a.substring(Math.max(0, i - 60), i + 60),
      activeContext: b.substring(Math.max(0, i - 60), i + 60),
    };
  }

  results.push({
    legacyPath, activePath,
    permittedTransformsOnly: pass,
    firstDiffContext,
  });
  console.log(`[${mod.order}/34] ${legacyPath}: ${pass ? 'PASS (surgical transform only)' : 'FAIL (unexplained difference)'}`);
  if (!pass) {
    console.log(`    legacy:  ...${JSON.stringify(firstDiffContext.legacyContext)}...`);
    console.log(`    active:  ...${JSON.stringify(firstDiffContext.activeContext)}...`);
  }
}

fs.writeFileSync(path.join(V09, 'docs', 'stage11c2-transform-verification-result.json'), JSON.stringify({
  stage: '11C2',
  artifact_class: 'V09_TEST',
  total_modules: results.length,
  all_pass: allPass,
  results,
}, null, 2));

console.log(`\n=== Summary ===`);
console.log(`Total: ${results.length} | Pass: ${results.filter(r => r.permittedTransformsOnly).length} | Fail: ${results.filter(r => !r.permittedTransformsOnly).length}`);
process.exit(allPass ? 0 : 1);
