#!/usr/bin/env node
/* =========================================================================
   v09/tools/migrate-to-esm.cjs

   Stage 11C2 — ES-Module Migration Script
   Artifact Class: V09_TEST (migration infrastructure, retained)

   Transforms each of the 34 frozen Stage 11C1 modules (v09/src/**) into a
   genuine ES-module derivative under v09/app/**, using ONLY the structural
   transformations permitted by the Stage 11C2 spec:
     - prepend explicit `import` statements (from the audited Stage 11C1
       dependency graph's proposed_stage11c2_imports)
     - add explicit `export` keywords (using the audited
       proposed_stage11c2_exports list — NOT a blanket "export everything")
     - remove the CommonJS recovery-export guard block
     - replace the shared-components.jsx React-hook destructuring with a
       genuine `import { ... } from "react"` statement
     - add `import React from "react"` only where React.Fragment is used
     - for app-shell.jsx: remove the 19 historical mount statements and the
       mount-only `rootEl` declaration (App is exported instead)

   No scientific, pedagogic, or application-body text is altered.

   Run: node tools/migrate-to-esm.cjs
   ========================================================================= */
'use strict';

const fs = require('fs');
const path = require('path');

const V09 = path.join(__dirname, '..');
const GRAPH = JSON.parse(fs.readFileSync(path.join(V09, 'docs', 'v09-module-dependency-graph.json'), 'utf8'));
const MANIFEST = JSON.parse(fs.readFileSync(path.join(V09, 'tools', 'v09-source-order.json'), 'utf8'));

// Files that use React.Fragment directly and therefore need `import React from "react"`
// (verified by direct source grep during migration planning).
const NEEDS_REACT_DEFAULT_IMPORT = new Set([
  'src/investigation/ui-components.jsx',
  'src/risk/ui-components.jsx',
  'src/ui/core-screens.jsx',
]);

function legacyToActive(legacyPath) {
  // src/domain/file.ext -> app/domain/file.ext
  return legacyPath.replace(/^src\//, 'app/');
}

function moduleByPath(legacyPath) {
  return GRAPH.modules.find(m => m.path === legacyPath);
}

function computeRelativeImportPath(fromActivePath, toActivePath) {
  const fromDir = path.dirname(path.join(V09, fromActivePath));
  const toFull = path.join(V09, toActivePath);
  let rel = path.relative(fromDir, toFull);
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel;
}

function stripCommonJsGuard(src) {
  // Matches the exact recovery-era guard block at the end of file.
  const guardRe = /\n?if \(typeof module !== "undefined" && module\.exports\) \{\s*\n\s*module\.exports = \{[\s\S]*?\};\s*\n\}\s*\n?$/;
  return src.replace(guardRe, '\n');
}

function addExportsToDeclarations(src, exportNames) {
  const nameSet = new Set(exportNames);
  const lines = src.split('\n');
  const out = lines.map(line => {
    // function Name(
    let m = line.match(/^function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (m && nameSet.has(m[1]) && !line.startsWith('export ')) {
      return 'export ' + line;
    }
    // const/let/var Name =
    m = line.match(/^(const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/);
    if (m && nameSet.has(m[2]) && !line.startsWith('export ')) {
      return 'export ' + line;
    }
    return line;
  });
  return out.join('\n');
}

function buildImportBlock(modEntry, activePath) {
  const lines = [];
  for (const imp of modEntry.proposed_stage11c2_imports || []) {
    if (imp.from === 'react') {
      lines.push(`import { ${imp.names.join(', ')} } from "react";`);
    } else {
      const targetActive = legacyToActive(imp.from);
      const rel = computeRelativeImportPath(activePath, targetActive);
      lines.push(`import { ${imp.names.join(', ')} } from "${rel}";`);
    }
  }
  if (NEEDS_REACT_DEFAULT_IMPORT.has(modEntry.path)) {
    // Combine with existing react hook import if present, else add standalone.
    const reactLineIdx = lines.findIndex(l => l.startsWith('import { ') && l.includes('from "react"'));
    if (reactLineIdx >= 0) {
      lines[reactLineIdx] = lines[reactLineIdx].replace('import { ', 'import React, { ');
    } else {
      lines.unshift('import React from "react";');
    }
  }
  return lines.length ? lines.join('\n') + '\n\n' : '';
}

const results = [];

for (const mod of MANIFEST.application_modules) {
  const legacyPath = mod.path;
  const activePath = legacyToActive(legacyPath);
  const graphEntry = moduleByPath(legacyPath);
  if (!graphEntry) { throw new Error(`No graph entry for ${legacyPath}`); }

  let src = fs.readFileSync(path.join(V09, legacyPath), 'utf8');
  const originalLines = src.split('\n').length;

  // 1. Strip CommonJS guard (if present)
  const hadGuard = /typeof module !== "undefined"/.test(src);
  src = stripCommonJsGuard(src);

  // 2. Special case: shared-components.jsx — remove the React-hook
  //    destructuring line (replaced by an explicit react import below).
  if (legacyPath === 'src/ui/shared-components.jsx') {
    src = src.replace(/^const\s*\{\s*useState,\s*useMemo,\s*useRef,\s*useEffect\s*\}\s*=\s*React;\s*\n/m, '');
  }

  // 3. Special case: app-shell.jsx — remove the 19 historical mount
  //    statements and the mount-only rootEl declaration.
  let mountsRemoved = 0;
  if (legacyPath === 'src/ui/app-shell.jsx') {
    const mountLineRe = /^\s*ReactDOM\.createRoot\(rootEl\)\.render\(<App \/>\);\s*$/;
    const linesArr = src.split('\n');
    const filtered = linesArr.filter(l => {
      if (mountLineRe.test(l)) { mountsRemoved++; return false; }
      return true;
    });
    src = filtered.join('\n');
    // Remove the mount-only rootEl declaration (used only by the removed mounts).
    src = src.replace(/^const rootEl = document\.getElementById\("root"\);\s*\n/m, '');
  }

  // 4. Add export keywords to the audited public export list.
  src = addExportsToDeclarations(src, graphEntry.proposed_stage11c2_exports || []);

  // 5. Prepend import block.
  const importBlock = buildImportBlock(graphEntry, activePath);
  src = importBlock + src;

  // Write output.
  const outFull = path.join(V09, activePath);
  fs.mkdirSync(path.dirname(outFull), { recursive: true });
  fs.writeFileSync(outFull, src, 'utf8');

  results.push({
    legacy: legacyPath,
    active: activePath,
    hadGuard,
    mountsRemoved,
    importsAdded: (graphEntry.proposed_stage11c2_imports || []).length + (NEEDS_REACT_DEFAULT_IMPORT.has(legacyPath) ? 1 : 0),
    exportsAdded: (graphEntry.proposed_stage11c2_exports || []).length,
    originalLines,
    newLines: src.split('\n').length,
  });
  console.log(`[${mod.order}/34] ${legacyPath} -> ${activePath} (guard removed: ${hadGuard}, mounts removed: ${mountsRemoved})`);
}

fs.writeFileSync(path.join(V09, 'tools', 'migration-run-log.json'), JSON.stringify(results, null, 2));
console.log(`\nMigration complete. ${results.length} modules processed.`);
console.log(`Total mounts removed: ${results.reduce((s, r) => s + r.mountsRemoved, 0)}`);
