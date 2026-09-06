#!/usr/bin/env node
/* =========================================================================
   v09/tools/assemble-v09-compat.js

   v0.9 Compatibility Assembler — FAIL-CLOSED
   Artifact Class: V09_TEST (development infrastructure)

   Assembles the CURRENT v09/src derivative using the same browser/runtime
   model as the validated v0.8 faithful candidate (runtime Babel transform,
   reused original document/vendor envelope). Consumes v09/src, NOT root src.

   SHA GOVERNANCE (Stage 11B corrective closure):
   Every runtime source file has TWO recorded SHAs in the manifest:
     - v08_baseline_sha256:         the original v0.8 recovered value (never changes)
     - expected_current_v09_sha256: the accepted, admitted current v0.9 state
   Assembly is permitted ONLY if the actual on-disk SHA-256 of every runtime
   file equals its expected_current_v09_sha256. Any other value is UNEXPECTED
   DRIFT and fails assembly before any output is written. An intentional
   v0.9 modification must first be explicitly admitted into the manifest
   (i.e. expected_current_v09_sha256 updated to the new accepted value) —
   this creates an auditable development baseline. A file's baseline-vs-
   current SHA comparison also yields an informational classification
   (UNCHANGED_FROM_V08 / V09_MODIFIED), but that classification does NOT
   itself control assembly permission — only the drift check does.

   This is a Stage 11B COMPATIBILITY path — it does NOT use Vite. Its
   purpose is to let v09/src changes be assembled and browser-tested using
   the same deterministic process validated during v0.8 recovery, before
   any unified build migration (Stage 11C).

   Output: v09/dist/precimind-v0.9-compat.html
   ========================================================================= */
'use strict';

const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

const V09  = path.join(__dirname, '..');
const ROOT = path.join(V09, '..');
const DIST = path.join(V09, 'dist');
const OUT  = path.join(DIST, 'precimind-v0.9-compat.html');
const MANIFEST_PATH = path.join(__dirname, 'v09-source-order.json');

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function readAndVerify(relPath, expectedCurrentSha, baselineSha) {
  const full = path.join(V09, relPath);
  if (!fs.existsSync(full)) {
    console.error(`ASSEMBLY FAIL: Missing v09 source file: ${relPath}`);
    process.exit(1);
  }
  const content = fs.readFileSync(full, 'utf8');
  const actualSha = sha256(content);
  if (actualSha !== expectedCurrentSha) {
    console.error(`\nASSEMBLY FAIL: Unexpected SHA drift`);
    console.error(`  path:                         ${relPath}`);
    console.error(`  expected current v0.9 SHA:    ${expectedCurrentSha}`);
    console.error(`  actual SHA:                   ${actualSha}`);
    console.error(`\nThis file's on-disk content does not match the manifest's admitted`);
    console.error(`expected_current_v09_sha256. If this change is intentional, first`);
    console.error(`update v09/tools/v09-source-order.json to admit the new SHA, with`);
    console.error(`rationale recorded in v09/docs/v08-to-v09-baseline-map.json, THEN`);
    console.error(`re-run the assembler. No output was written.`);
    process.exit(1);
  }
  const classification = (baselineSha === expectedCurrentSha) ? 'UNCHANGED_FROM_V08' : 'V09_MODIFIED';
  return { content, classification };
}

// ── Main assembly ─────────────────────────────────────────────────────────
console.log('=== v0.9 Compatibility Assembly (fail-closed SHA governance) ===');
console.log(`Output: ${OUT}`);
console.log('Consuming: v09/src (NOT root src/)');

if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });

if (!fs.existsSync(MANIFEST_PATH)) {
  console.error('ASSEMBLY FAIL: v09-source-order.json manifest not found.');
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

// 1. CSS
console.log('\nVerifying CSS...');
const cssResult = readAndVerify(manifest.css.path, manifest.css.expected_current_v09_sha256, manifest.css.v08_baseline_sha256);
const css = cssResult.content;
console.log(`  CSS: ${css.split('\n').length} lines, SHA ${sha256(css).substring(0, 16)}... [${cssResult.classification}] OK`);

// 2. Original document envelope (reused verbatim from validated v0.8 reference — NOT mutated)
const htmlLines = fs.readFileSync(
  path.join(ROOT, 'recovery', 'original-v0.8.html'), 'utf8'
).split('\n');
const metaLines = htmlLines.slice(0, 6).join('\n');
const vendorBlock = htmlLines.slice(531, 836).join('\n') + '\n';
console.log(`\nVendor envelope reused from recovery/original-v0.8.html (HTML 532-836), SHA ${sha256(vendorBlock).substring(0, 16)}... (unmodified reference)`);

// 3. Runtime bootstrap
console.log('\nVerifying runtime bootstrap...');
const bootResult = readAndVerify(manifest.runtime_bootstrap.path, manifest.runtime_bootstrap.expected_current_v09_sha256, manifest.runtime_bootstrap.v08_baseline_sha256);
const bootstrap = bootResult.content;
console.log(`  Bootstrap: ${bootstrap.split('\n').length} lines, SHA ${sha256(bootstrap).substring(0, 16)}... [${bootResult.classification}] OK`);

// 4. Assemble app-source from ordered v09/src modules — ALL must pass drift check
console.log(`\nVerifying and assembling app-source from ${manifest.application_modules.length} v09/src modules:`);
let appSource = '';
let modifiedCount = 0;
for (const mod of manifest.application_modules) {
  const result = readAndVerify(mod.path, mod.expected_current_v09_sha256, mod.v08_baseline_sha256);
  if (result.classification === 'V09_MODIFIED') modifiedCount++;
  appSource += result.content;
  console.log(`  [${String(mod.order).padStart(2, '0')}/${manifest.application_modules.length}] ${mod.path} (${result.content.split('\n').length}L) [${result.classification}] OK`);
}

console.log(`\nAll runtime source files passed SHA drift verification.`);
console.log(`Files classified V09_MODIFIED (admitted, intentional): ${modifiedCount}`);
console.log(`Files classified UNCHANGED_FROM_V08: ${manifest.application_modules.length - modifiedCount + 2 /* css + bootstrap if unchanged */}`);

const mountCount = (appSource.match(/ReactDOM\.createRoot\(/g) || []).length;
console.log(`\nReactDOM.createRoot mount calls in assembled source: ${mountCount}`);
if (mountCount !== 19) {
  console.log(`  NOTE: mount count is ${mountCount}, not the historical 19 (expected if TD-001 cleanup has occurred; not expected as of this stage)`);
}

// 5. Build HTML — only reached if every file passed the drift check above
const html = `<!DOCTYPE html>\n<html lang="en">\n<head>\n` +
  metaLines + `\n` +
  `<style>\n${css}</style>\n` +
  `</head>\n<body>\n` +
  `<div id="root"></div>\n` +
  vendorBlock +
  `<script id="app-source" type="text/plain">\n` +
  appSource +
  `</script>\n` +
  `<script>\n${bootstrap}</script>\n` +
  `</body>\n</html>`;

fs.writeFileSync(OUT, html, 'utf8');
const outSha = sha256(html);
const outBytes = Buffer.byteLength(html, 'utf8');

console.log('\n=== v0.9 Compatibility Assembly Complete ===');
console.log(`Output: ${OUT}`);
console.log(`Size: ${outBytes} bytes`);
console.log(`SHA-256: ${outSha}`);
console.log(`Mount calls: ${mountCount}`);
console.log(`Modules assembled: ${manifest.application_modules.length}`);
console.log(`Artifact class: V09_TEST (compatibility path, not Vite, not a v0.8 artifact)`);
