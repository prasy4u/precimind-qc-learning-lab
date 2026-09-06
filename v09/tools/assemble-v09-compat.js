#!/usr/bin/env node
/* =========================================================================
   v09/tools/assemble-v09-compat.js

   v0.9 Compatibility Assembler
   Artifact Class: V09_TEST (development infrastructure)

   Assembles the CURRENT v09/src derivative using the same browser/runtime
   model as the validated v0.8 faithful candidate (runtime Babel transform,
   reused original document/vendor envelope). Consumes v09/src, NOT root src.

   This is a Stage 11B COMPATIBILITY path — it does NOT use Vite. Its
   purpose is to let v09/src changes be assembled and browser-tested using
   the same deterministic process validated during v0.8 recovery, before
   any unified build migration (Stage 11C).

   Output: v09/dist/precimind-v0.9-compat.html (NOT a v0.8 artifact —
   reflects whatever is currently in v09/src, which may include intentional
   v0.9 modifications).
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

function readFile(relPath) {
  const full = path.join(V09, relPath);
  if (!fs.existsSync(full)) {
    console.error(`ASSEMBLY FAIL: Missing v09 source file: ${relPath}`);
    process.exit(1);
  }
  return fs.readFileSync(full, 'utf8');
}

console.log('=== v0.9 Compatibility Assembly ===');
console.log(`Output: ${OUT}`);
console.log('Consuming: v09/src (NOT root src/)');

if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });

if (!fs.existsSync(MANIFEST_PATH)) {
  console.error('ASSEMBLY FAIL: v09-source-order.json manifest not found. Run manifest generation first.');
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

// 1. CSS
console.log('\nReading CSS...');
const css = readFile(manifest.css.path);
console.log(`  CSS: ${css.split('\n').length} lines, SHA ${sha256(css).substring(0, 16)}...`);
const cssChanged = sha256(css) !== manifest.css.sha256;
if (cssChanged) console.log(`  NOTE: CSS content differs from manifest-recorded SHA (expected if intentionally modified since manifest generation)`);

// 2. Original document envelope (reused verbatim from validated v0.8 reference — NOT mutated)
const htmlLines = fs.readFileSync(
  path.join(ROOT, 'recovery', 'original-v0.8.html'), 'utf8'
).split('\n');
const metaLines = htmlLines.slice(0, 6).join('\n');
const vendorBlock = htmlLines.slice(531, 836).join('\n') + '\n';
console.log(`\nVendor envelope reused from recovery/original-v0.8.html (HTML 532-836), SHA ${sha256(vendorBlock).substring(0, 16)}... (unmodified reference)`);

// 3. Runtime bootstrap
const bootstrap = readFile(manifest.runtime_bootstrap.path);
console.log(`Bootstrap: ${bootstrap.split('\n').length} lines, SHA ${sha256(bootstrap).substring(0, 16)}...`);

// 4. Assemble app-source from ordered v09/src modules
console.log(`\nAssembling app-source from ${manifest.application_modules.length} v09/src modules:`);
let appSource = '';
let anyModuleChanged = false;
for (const mod of manifest.application_modules) {
  const content = readFile(mod.path);
  const currentSha = sha256(content);
  const changed = currentSha !== mod.sha256;
  if (changed) anyModuleChanged = true;
  appSource += content;
  console.log(`  [${String(mod.order).padStart(2, '0')}/${manifest.application_modules.length}] ${mod.path} (${content.split('\n').length}L)${changed ? ' [MODIFIED since manifest]' : ''}`);
}

const mountCount = (appSource.match(/ReactDOM\.createRoot\(/g) || []).length;
console.log(`\nReactDOM.createRoot mount calls in assembled source: ${mountCount}`);
if (mountCount !== 19) {
  console.log(`  NOTE: mount count is ${mountCount}, not the historical 19 (expected if TD-001 cleanup has occurred; not expected in Stage 11B)`);
}

// 5. Build HTML
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
console.log(`Any module modified vs manifest: ${anyModuleChanged}`);
console.log(`Artifact class: V09_TEST (compatibility path, not Vite, not a v0.8 artifact)`);
