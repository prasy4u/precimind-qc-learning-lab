/* =========================================================================
   v09/tests/morning-qc/build-support/jsx-build.cjs

   Stage 12B TEST-ONLY build helper. PROVENANCE: V09_TEST.

   Transforms the Morning QC Room .jsx components into plain ESM .mjs
   files (via Vite's bundled OXC transform — no new project dependency
   added; vite is already a committed devDependency) so they can be
   rendered with react-dom/server in plain Node for SSR-based
   verification (leakage audits, conditional-rendering checks) in an
   environment where a real browser binary cannot be downloaded
   (see V09_STAGE12B_REPORT.md for the exact network-sandboxing
   constraint). This script is NEVER imported by production code.
   ========================================================================= */
'use strict';
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', '..', '..', 'app', 'morning-qc', 'ui');
const OUT_DIR = path.join(__dirname, '..', '..', '..', '.mqc-ui-build');

async function buildAll() {
  const vite = await import('vite');
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Recursively walk SRC_DIR, preserving relative subdirectory structure
  // (needed for panel-renderers/index.js, imported by panel-viewer.jsx).
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
  const allFiles = walk(SRC_DIR, '');
  const jsxFiles = allFiles.filter(f => f.endsWith('.jsx'));
  const plainJsFiles = allFiles.filter(f => f.endsWith('.js') && f !== 'ui-adapter.js' && f !== 'index.js' && f !== 'dev-launcher.jsx');

  for (const relFile of jsxFiles) {
    const src = fs.readFileSync(path.join(SRC_DIR, relFile), 'utf8');
    const result = await vite.transformWithOxc(src, relFile, {});
    let code = result.code;
    // Rewrite relative .jsx import specifiers to .mjs (matching this
    // script's output filenames); plain .js imports (ui-adapter.js,
    // ui-model.js, engine.js, etc.) are left untouched and resolved
    // directly against the real source tree.
    code = code.replace(/from\s+(['"])(\.{1,2}\/[^'"]+)\.jsx\1/g, "from $1$2.mjs$1");
    // morning-qc-room.jsx imports ui-adapter.js as '../ui-adapter.js'
    // (one level up from ui/); since this build flattens everything
    // into a single OUT_DIR alongside a copy of ui-adapter.js, rewrite
    // that one specifier to a same-directory reference.
    code = code.replace(/from\s+(['"])\.\.\/ui-adapter\.js\1/g, "from $1./ui-adapter.js$1");
    // Any component importing directly from the real Stage 12A engine
    // directory one level up (e.g. patient-impact-panel.jsx importing
    // PATIENT_IMPACT_TRANSITIONS from '../states.js') is rewritten to an
    // absolute file:// URL pointing at the REAL source file — never a
    // copy — so no engine/domain module is duplicated by this test build.
    code = code.replace(/from\s+(['"])\.\.\/([a-zA-Z0-9_-]+\.js)\1/g, (m, q, filename) => {
      return `from ${q}${'file://' + path.join(SRC_DIR, '..', filename)}${q}`;
    });
    const outPath = path.join(OUT_DIR, relFile.replace(/\.jsx$/, '.mjs'));
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, code);
  }
  // Plain .js files elsewhere in the tree (e.g. ui-model.js) are already
  // ESM — copy verbatim, preserving their relative path, so relative
  // imports from the transformed .mjs files resolve correctly.
  for (const relFile of plainJsFiles) {
    const outPath = path.join(OUT_DIR, relFile);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.copyFileSync(path.join(SRC_DIR, relFile), outPath);
  }
  // ui-adapter.js imports from '../engine.js' etc. (one level up) —
  // copy it with the relative path adjusted to point at the real
  // Stage 12A engine modules (absolute file:// URL), so no engine
  // source is copied or duplicated.
  const adapterSrc = fs.readFileSync(path.join(SRC_DIR, 'ui-adapter.js'), 'utf8');
  const engineDir = path.join(SRC_DIR, '..'); // v09/app/morning-qc
  const adapterOut = adapterSrc
    .replace("from '../engine.js'", `from ${JSON.stringify('file://' + path.join(engineDir, 'engine.js'))}`)
    .replace("from '../states.js'", `from ${JSON.stringify('file://' + path.join(engineDir, 'states.js'))}`)
    .replace("from '../debrief-model.js'", `from ${JSON.stringify('file://' + path.join(engineDir, 'debrief-model.js'))}`);
  fs.writeFileSync(path.join(OUT_DIR, 'ui-adapter.js'), adapterOut);

  return OUT_DIR;
}

module.exports = { buildAll, OUT_DIR };
