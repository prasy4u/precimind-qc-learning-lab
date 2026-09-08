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

  const files = fs.readdirSync(SRC_DIR).filter(f => f.endsWith('.jsx'));
  for (const file of files) {
    const src = fs.readFileSync(path.join(SRC_DIR, file), 'utf8');
    const result = await vite.transformWithOxc(src, file, {});
    let code = result.code;
    // Rewrite relative .jsx import specifiers to .mjs (matching this
    // script's output filenames); plain .js imports (ui-adapter.js,
    // ui-model.js, engine.js, etc.) are left untouched and resolved
    // directly against the real source tree.
    code = code.replace(/from\s+(['"])(\.\/[^'"]+)\.jsx\1/g, "from $1$2.mjs$1");
    // morning-qc-room.jsx imports ui-adapter.js as '../ui-adapter.js'
    // (one level up from ui/); since this build flattens everything
    // into a single OUT_DIR alongside a copy of ui-adapter.js, rewrite
    // that one specifier to a same-directory reference.
    code = code.replace(/from\s+(['"])\.\.\/ui-adapter\.js\1/g, "from $1./ui-adapter.js$1");
    const outPath = path.join(OUT_DIR, file.replace(/\.jsx$/, '.mjs'));
    fs.writeFileSync(outPath, code);
  }
  // ui-model.js and ui-adapter.js are plain ESM already — copy verbatim
  // so relative imports from the transformed .mjs files resolve.
  for (const plain of ['ui-model.js']) {
    fs.copyFileSync(path.join(SRC_DIR, plain), path.join(OUT_DIR, plain));
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
