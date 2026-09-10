/* =========================================================================
   v09/tests/morning-qc/build-support/jsx-build.cjs

   Stage 12B/12C TEST-ONLY build helper. PROVENANCE: V09_TEST.

   Transforms the Morning QC Room .jsx components (both app/morning-qc/ui/
   and app/morning-qc/debrief/) into plain ESM .mjs files (via Vite's
   bundled OXC transform — no new project dependency added; vite is
   already a committed devDependency) so they can be rendered with
   react-dom/client in plain Node + jsdom for interactive verification in
   an environment where a real browser binary cannot always be relied
   upon. This script is NEVER imported by production code.

   Mirrors the REAL source tree's sibling structure
   (app/morning-qc/{ui,debrief}) under OUT_ROOT/{ui,debrief} so that
   cross-directory relative imports (morning-qc-room.jsx's
   '../debrief/index.js'; reasoning-timeline.jsx's '../ui/ui-model.js')
   resolve correctly without rewriting — only imports reaching OUTSIDE
   both directories (into the frozen Stage 12A engine modules one level
   further up) are rewritten to absolute file:// URLs pointing at the
   real, unmodified source.
   ========================================================================= */
'use strict';
const fs = require('fs');
const path = require('path');

const MQC_DIR = path.join(__dirname, '..', '..', '..', 'app', 'morning-qc');
const OUT_ROOT = path.join(__dirname, '..', '..', '..', '.mqc-ui-build');
const SUBDIRS = ['ui', 'debrief', 'adaptive', 'analytics'];

// Files that must be copied verbatim (never JSX-transformed) but whose
// relative imports still need adjusting to the mirrored output tree.
const PASSTHROUGH_JS = new Set(['ui-adapter.js', 'index.js', 'dev-launcher.jsx', 'debrief-adapter.js']);

function walk(dir, relBase) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    const rel = path.join(relBase, entry.name);
    if (entry.isDirectory()) files.push(...walk(abs, rel));
    else files.push(rel);
  }
  return files;
}

async function buildAll() {
  const vite = await import('vite');
  fs.rmSync(OUT_ROOT, { recursive: true, force: true });
  fs.mkdirSync(OUT_ROOT, { recursive: true });

  for (const subdir of SUBDIRS) {
    const srcDir = path.join(MQC_DIR, subdir);
    const outDir = path.join(OUT_ROOT, subdir);
    const allFiles = walk(srcDir, '');
    const jsxFiles = allFiles.filter(f => f.endsWith('.jsx') && !PASSTHROUGH_JS.has(path.basename(f)));
    const plainFiles = allFiles.filter(f => !jsxFiles.includes(f));

    for (const relFile of jsxFiles) {
      const src = fs.readFileSync(path.join(srcDir, relFile), 'utf8');
      const result = await vite.transformWithOxc(src, relFile, {});
      let code = result.code;
      // Same-subdir or cross-subdir relative imports (./x.jsx, ../ui/x.jsx,
      // ../debrief/x.jsx) — just fix the extension; the mirrored tree
      // structure means the relative PATH itself needs no rewriting.
      code = code.replace(/from\s+(['"])(\.{1,2}\/[^'"]+)\.jsx\1/g, "from $1$2.mjs$1");
      // Imports reaching past BOTH subdirs into the real Stage 12A engine
      // directory (e.g. '../states.js', '../engine.js', '../debrief-model.js')
      // are rewritten to absolute file:// URLs pointing at the real,
      // unmodified source — never copied or duplicated.
      code = code.replace(/from\s+(['"])\.\.\/([a-zA-Z0-9_-]+\.js)\1/g, (m, q, filename) => {
        if (fs.existsSync(path.join(MQC_DIR, filename))) {
          return `from ${q}${'file://' + path.join(MQC_DIR, filename)}${q}`;
        }
        return m; // not a top-level engine file — leave as-is (shouldn't occur)
      });
      const outPath = path.join(outDir, relFile.replace(/\.jsx$/, '.mjs'));
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, code);
    }

    for (const relFile of plainFiles) {
      const outPath = path.join(outDir, relFile);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      // Rewrite '../engine.js' style imports (reaching past this
      // mirrored subdir into the real Stage 12A engine source) to
      // absolute file:// URLs, and '.jsx' extensions to '.mjs' —
      // applied to EVERY plain .js file copied, not just a specific
      // named list, since new modules (adaptive/, analytics/) keep
      // being added and each may need either rewrite. Harmless no-op
      // for files with neither pattern.
      let src = fs.readFileSync(path.join(srcDir, relFile), 'utf8');
      src = src.replace(/from\s+(['"])\.\.\/([a-zA-Z0-9_-]+\.js)\1/g, (m, q, filename) => {
        if (fs.existsSync(path.join(MQC_DIR, filename))) {
          return `from ${q}${'file://' + path.join(MQC_DIR, filename)}${q}`;
        }
        return m;
      });
      src = src.replace(/from\s+(['"])(\.{1,2}\/[^'"]+)\.jsx\1/g, "from $1$2.mjs$1");
      fs.writeFileSync(outPath, src);
    }
  }

  return OUT_ROOT;
}

module.exports = { buildAll, OUT_DIR: path.join(OUT_ROOT, 'ui') };
