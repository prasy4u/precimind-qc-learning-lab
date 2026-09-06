#!/usr/bin/env node
/* =========================================================================
   v09/tools/verify-import-graph.cjs

   Stage 11C2 — Active Import-Graph Verifier (v2, hardened)
   Artifact Class: V09_TEST (retained)

   Inspects the REAL active modular source (v09/app/**), not the Stage
   11C1 planning graph. Uses raw-source word-boundary identifier matching
   (NOT a string/comment stripper) for the "missing import" check, because
   an earlier JSX-aware stripper was found during Stage 11C2 migration to
   lose quote-parity on JSX text apostrophes (e.g. "don't"), silently
   corrupting everything parsed afterward in a file and producing false
   negatives (see V09_STAGE11C2_MIGRATION_REPORT.md). Raw word-boundary
   matching can over-report (an identifier appearing only in a string or
   JSX text would be flagged), but never under-reports — appropriate here
   since this check gates a hard PASS/FAIL governance requirement and a
   false negative (silently missing a real bug) is far worse than a false
   positive (requiring one extra manual check).

   Verifies:
     - exactly 34 migrated application modules (+ main.jsx entry, checked separately)
     - zero unresolved relative imports (file not found)
     - zero unresolved imported names (name not exported by target)
     - zero missing imports (bare identifier used, exported elsewhere, not imported)
     - zero circular dependencies
     - zero CommonJS wrappers
     - zero accidental hook globals (React hooks used bare without a local import)
     - App is reachable from the single entry (main.jsx)

   Run: node tools/verify-import-graph.cjs
   ========================================================================= */
'use strict';

const fs = require('fs');
const path = require('path');

const V09 = path.join(__dirname, '..');
const APP_DIR = path.join(V09, 'app');

function findAllFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findAllFiles(full));
    else if (/\.(js|jsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const JS_BUILTINS = new Set(['Object','Array','Math','JSON','String','Number','Boolean','Date','RegExp','Error',
  'Map','Set','Promise','Symbol','console','window','document','undefined','null','true','false','NaN','Infinity',
  'isNaN','isFinite','parseInt','parseFloat','encodeURIComponent','decodeURIComponent',
  'setTimeout','clearTimeout','setInterval','clearInterval','Function','TypeError','RangeError',
  'React','useState','useMemo','useRef','useEffect','fetch','localStorage','navigator',
  'key','i','e','v','n','m','x','y','t','a','b','c','d','s','p','r','l','k','j','w','o','q','u','f','g','h']);

const HOOK_NAMES = ['useState', 'useMemo', 'useRef', 'useEffect'];

const allFiles = findAllFiles(APP_DIR).filter(f => path.basename(f) !== 'main.jsx');
const mainFile = path.join(APP_DIR, 'main.jsx');
const fileData = {};

for (const file of allFiles) {
  const rel = path.relative(APP_DIR, file);
  const src = fs.readFileSync(file, 'utf8');

  const exportNames = new Set();
  let m;
  const exportRe = /^export\s+(?:function\s+([A-Za-z_$][\w$]*)|(?:const|let|var)\s+([A-Za-z_$][\w$]*))/gm;
  while ((m = exportRe.exec(src))) exportNames.add(m[1] || m[2]);

  const localNames = new Set();
  const localRe = /^(?:function\s+([A-Za-z_$][\w$]*)|(?:const|let|var)\s+([A-Za-z_$][\w$]*))/gm;
  while ((m = localRe.exec(src))) localNames.add(m[1] || m[2]);

  const importedNames = new Set();
  const importsList = [];
  const importRe = /^import\s+(?:([A-Za-z_$][\w$]*)\s*,\s*)?\{([^}]*)\}\s+from\s+["']([^"']+)["']/gm;
  while ((m = importRe.exec(src))) {
    if (m[1]) importedNames.add(m[1]);
    const names = m[2].split(',').map(s => s.trim()).filter(Boolean);
    names.forEach(n => importedNames.add(n));
    importsList.push({ from: m[3], names });
  }
  const defaultRe = /^import\s+([A-Za-z_$][\w$]*)\s+from\s+["']([^"']+)["']/gm;
  while ((m = defaultRe.exec(src))) {
    importedNames.add(m[1]);
    if (!importsList.some(i => i.from === m[2])) importsList.push({ from: m[2], names: [] });
  }

  const hasCommonJs = /module\.exports|typeof module|require\(/.test(src);
  const usesBareHooks = HOOK_NAMES.some(h => new RegExp('(?<![.\\w$])' + h + '\\(').test(src) && !importedNames.has(h));

  fileData[rel] = { file, src, exportNames, localNames, importedNames, importsList, hasCommonJs, usesBareHooks };
}

const globalExports = {};
for (const [rel, d] of Object.entries(fileData)) {
  for (const name of d.exportNames) {
    if (!globalExports[name]) globalExports[name] = [];
    globalExports[name].push(rel);
  }
}

// 1. Missing imports (raw word-boundary check)
const missingImports = [];
for (const [rel, d] of Object.entries(fileData)) {
  for (const [name, definers] of Object.entries(globalExports)) {
    if (definers.includes(rel)) continue;
    if (d.localNames.has(name)) continue;
    if (d.importedNames.has(name)) continue;
    if (JS_BUILTINS.has(name)) continue;
    // Documented, source-verified false positives: identifiers mentioned only
    // inside `informs: "..."` documentation-text strings in app-data.js,
    // describing what another module's function/constant does in prose —
    // not a real code reference. Verified by direct source inspection during
    // Stage 11C1 (original discovery) and re-confirmed during Stage 11C2
    // migration (see V09_STAGE11C2_MIGRATION_REPORT.md).
    const KNOWN_FALSE_POSITIVES = {
      'ui/app-data.js': new Set(['calculateClassicalRcv', 'calculateLognormalRcv', 'describeSchemeCapability',
        'PEER_GROUP_NOT_TRUTH_PRINCIPLE', 'PERFORMANCE_CRITERION_APS_LINK_NOTE', 'MILAN_MODELS']),
    };
    if (KNOWN_FALSE_POSITIVES[rel] && KNOWN_FALSE_POSITIVES[rel].has(name)) continue;
    const useRe = new RegExp('(?<![A-Za-z0-9_$])' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![A-Za-z0-9_$])');
    if (useRe.test(d.src)) missingImports.push({ file: rel, identifier: name, availableFrom: definers });
  }
}

// 2. Unresolved relative imports (file not found or name not exported)
const unresolvedImports = [];
for (const [rel, d] of Object.entries(fileData)) {
  for (const imp of d.importsList) {
    if (!imp.from.startsWith('.')) continue; // skip "react"
    const targetRel = path.relative(APP_DIR, path.resolve(path.dirname(d.file), imp.from));
    const targetInfo = fileData[targetRel];
    if (!targetInfo) { unresolvedImports.push({ file: rel, target: imp.from, reason: 'target file not found' }); continue; }
    for (const name of imp.names) {
      if (!targetInfo.exportNames.has(name)) unresolvedImports.push({ file: rel, target: targetRel, name, reason: 'not exported by target' });
    }
  }
}

// 3. Circular dependencies (DFS on the resolved import graph)
const depGraph = {};
for (const [rel, d] of Object.entries(fileData)) {
  depGraph[rel] = [];
  for (const imp of d.importsList) {
    if (!imp.from.startsWith('.')) continue;
    const targetRel = path.relative(APP_DIR, path.resolve(path.dirname(d.file), imp.from));
    if (fileData[targetRel]) depGraph[rel].push(targetRel);
  }
}
const cycles = [];
const visiting = new Set(), visited = new Set();
function dfs(node, stack) {
  if (visiting.has(node)) { cycles.push([...stack, node]); return; }
  if (visited.has(node)) return;
  visiting.add(node); stack.push(node);
  for (const next of depGraph[node] || []) dfs(next, stack);
  stack.pop(); visiting.delete(node); visited.add(node);
}
for (const rel of Object.keys(fileData)) dfs(rel, []);

// 4. CommonJS wrappers
const commonJsFiles = Object.entries(fileData).filter(([, d]) => d.hasCommonJs).map(([rel]) => rel);

// 5. Accidental hook globals
const bareHookFiles = Object.entries(fileData).filter(([, d]) => d.usesBareHooks).map(([rel]) => rel);

// 6. App reachable from single entry
const mainSrc = fs.readFileSync(mainFile, 'utf8');
const mainImportsApp = /import\s*\{\s*App\s*\}\s*from\s*["']\.\/ui\/app-shell\.jsx["']/.test(mainSrc);
// Count only genuine code calls (createRoot followed by a real call, not
// mentioned in a comment). Strip /* */ block comments and // line comments
// first for this specific, narrow check.
const mainCodeOnly = mainSrc
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');
const mainMountCount = (mainCodeOnly.match(/createRoot\(/g) || []).length;

console.log('=== Active Import-Graph Verification (v2, hardened) ===');
console.log(`Application modules inspected: ${allFiles.length} (expected 34)`);
console.log(`Missing imports: ${missingImports.length}`);
missingImports.forEach(mi => console.log(`  ${mi.file}: "${mi.identifier}" (from ${mi.availableFrom.join(',')})`));
console.log(`Unresolved imports: ${unresolvedImports.length}`);
unresolvedImports.forEach(u => console.log(`  ${u.file}: ${u.name || u.target} — ${u.reason}`));
console.log(`Circular dependencies: ${cycles.length}`);
cycles.forEach(c => console.log(`  ${c.join(' -> ')}`));
console.log(`CommonJS wrapper files: ${commonJsFiles.length}`);
commonJsFiles.forEach(f => console.log(`  ${f}`));
console.log(`Accidental bare-hook-global files: ${bareHookFiles.length}`);
bareHookFiles.forEach(f => console.log(`  ${f}`));
console.log(`main.jsx imports App from app-shell.jsx: ${mainImportsApp}`);
console.log(`main.jsx createRoot call count: ${mainMountCount}`);

const allPass = allFiles.length === 34 && missingImports.length === 0 && unresolvedImports.length === 0 &&
  cycles.length === 0 && commonJsFiles.length === 0 && bareHookFiles.length === 0 && mainImportsApp && mainMountCount === 1;

const result = {
  stage: '11C2', artifact_class: 'V09_TEST',
  files_inspected: allFiles.length,
  missing_imports: missingImports, unresolved_imports: unresolvedImports, cycles,
  commonjs_files: commonJsFiles, bare_hook_files: bareHookFiles,
  main_imports_app: mainImportsApp, main_create_root_count: mainMountCount,
  all_pass: allPass,
};
fs.writeFileSync(path.join(V09, 'docs', 'stage11c2-import-graph-result.json'), JSON.stringify(result, null, 2));

console.log(`\n${allPass ? 'PASS' : 'FAIL'}: import graph verification ${allPass ? 'clean' : 'has issues'}.`);
process.exit(allPass ? 0 : 1);
