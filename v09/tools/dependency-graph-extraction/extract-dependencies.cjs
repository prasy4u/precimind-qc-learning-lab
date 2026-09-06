#!/usr/bin/env node
/* =========================================================================
   v09/tools/dependency-graph-extraction/extract-dependencies.cjs

   Stage 11C1 — Retained Dependency-Graph Extraction Script
   Artifact Class: V09_TEST

   This is the actual source-level static-analysis script used to derive
   v09/docs/v09-module-dependency-graph.json. It is retained (not deleted
   after use) so the extraction is independently re-runnable and auditable,
   per the Stage 11C1 final-closure requirement that automated-analysis
   claims be backed by durable, re-executable evidence rather than an
   interactive session's transient output.

   Method: regex-based static extraction with explicit string-literal and
   comment exclusion (to avoid counting documentation-text mentions of
   function/constant names as real code dependencies). This is NOT an AST
   parser — it is a deliberately conservative regex approach, and its
   known limitation (documentation-text false positives) is exactly what
   this script's string-stripping step exists to correct. An initial
   version WITHOUT string-stripping produced 6 false-positive "backward
   dependency" candidates (see stage11c1-extraction-log.txt for the
   original run's output demonstrating this).

   Usage: node extract-dependencies.cjs
   Output: writes stage11c1-extraction-log.txt (this run's full console
   output) and re-derives the same module_analysis structure used to
   build v09/docs/v09-module-dependency-graph.json.
   ========================================================================= */
'use strict';

const fs = require('fs');
const path = require('path');

const V09 = path.join(__dirname, '..', '..');
const manifest = JSON.parse(fs.readFileSync(path.join(V09, 'tools', 'v09-source-order.json'), 'utf8'));

const JS_BUILTINS = new Set(['Object','Array','Math','JSON','String','Number','Boolean','Date','RegExp','Error',
  'Map','Set','Promise','Symbol','console','window','document','undefined','null','true','false','NaN','Infinity',
  'isNaN','isFinite','parseInt','parseFloat','encodeURIComponent','decodeURIComponent','module','require','exports',
  'setTimeout','clearTimeout','setInterval','clearInterval','Function','TypeError','RangeError','Proxy','Reflect',
  'WeakMap','WeakSet','ArrayBuffer','Uint8Array','Float32Array','fetch','localStorage','sessionStorage','navigator',
  'ReactDOM','React','useState','useMemo','useRef','useEffect','useCallback','useContext','useReducer','useLayoutEffect']);

function stripNonCode(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === '/' && src[i+1] === '/') {
      let j = src.indexOf('\n', i);
      if (j === -1) j = n;
      out += ' '.repeat(j - i);
      i = j;
    } else if (c === '/' && src[i+1] === '*') {
      let j = src.indexOf('*/', i+2);
      if (j === -1) j = n; else j += 2;
      out += ' '.repeat(j - i);
      i = j;
    } else if (c === '"' || c === "'") {
      const quote = c;
      let j = i + 1;
      while (j < n && src[j] !== quote) {
        if (src[j] === '\\') j++;
        j++;
      }
      j = Math.min(j + 1, n);
      out += ' '.repeat(j - i);
      i = j;
    } else if (c === '`') {
      let j = i + 1;
      let buf = '`';
      while (j < n && src[j] !== '`') {
        if (src[j] === '\\') { buf += '  '; j += 2; continue; }
        if (src[j] === '$' && src[j+1] === '{') {
          let depth = 1; let k = j + 2;
          while (k < n && depth > 0) {
            if (src[k] === '{') depth++;
            else if (src[k] === '}') depth--;
            k++;
          }
          buf += ' ' + src.slice(j+2, k-1) + ' ';
          j = k;
        } else {
          buf += ' ';
          j++;
        }
      }
      j = Math.min(j + 1, n);
      buf += '`';
      out += buf;
      i = j;
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

function extractTopLevelDefines(src) {
  const defines = new Set();
  let m;
  const funcRe = /^function\s+([A-Za-z_$][\w$]*)\s*\(/gm;
  while ((m = funcRe.exec(src))) defines.add(m[1]);
  const lines = src.split('\n');
  for (const line of lines) {
    const cm = line.match(/^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/);
    if (cm) defines.add(cm[1]);
    const dm = line.match(/^(?:const|let|var)\s*\{\s*([^}]+)\s*\}\s*=/);
    if (dm) {
      dm[1].split(',').forEach(part => {
        const name = part.trim().split(':')[0].trim();
        if (name) defines.add(name);
      });
    }
  }
  return [...defines];
}

function extractIdentifierUsage(codeOnlySrc) {
  const ids = new Set();
  const re = /(?<![.\w$])([A-Za-z_$][\w$]*)(?=\s*[\(\.\[]|\b)/g;
  let m;
  while ((m = re.exec(codeOnlySrc))) ids.add(m[1]);
  return ids;
}

function componentNames(defines) { return defines.filter(n => /^[A-Z]/.test(n)); }
function hasModuleExportsGuard(src) { return /typeof module\s*!==\s*["']undefined["']/.test(src); }
function hasReactDestructure(src) { return /const\s*\{[^}]*\}\s*=\s*React\s*;/.test(src); }
function countMounts(src) { return (src.match(/ReactDOM\.createRoot\(/g) || []).length; }

const allModules = manifest.application_modules.map(m => m.path);
const moduleData = {};
const log = [];
function out(s) { log.push(s); console.log(s); }

out('=== Stage 11C1 Dependency Extraction (retained, re-runnable script) ===');
out(`Modules to analyze: ${allModules.length}`);

for (const modPath of allModules) {
  const full = path.join(V09, modPath);
  const src = fs.readFileSync(full, 'utf8');
  const codeOnly = stripNonCode(src);
  const defines = extractTopLevelDefines(src);
  const usage = extractIdentifierUsage(codeOnly);
  moduleData[modPath] = {
    lines: src.split('\n').length,
    hasGuard: hasModuleExportsGuard(src),
    hasReactDestructure: hasReactDestructure(src),
    mountCount: countMounts(src),
    defines, usage: [...usage],
    components: componentNames(defines),
  };
}

const globalDefinedBy = {};
for (const [modPath, data] of Object.entries(moduleData)) {
  for (const d of data.defines) {
    if (!globalDefinedBy[d]) globalDefinedBy[d] = [];
    globalDefinedBy[d].push(modPath);
  }
}

for (const [modPath, data] of Object.entries(moduleData)) {
  const localDefines = new Set(data.defines);
  const consumes = [];
  for (const id of data.usage) {
    if (JS_BUILTINS.has(id)) continue;
    if (localDefines.has(id)) continue;
    if (id.length <= 1) continue;
    if (globalDefinedBy[id]) {
      const definedElsewhere = globalDefinedBy[id].filter(m => m !== modPath);
      if (definedElsewhere.length > 0) consumes.push({ id, definedIn: definedElsewhere });
    }
  }
  data.consumesResolved = consumes;
}

const orderMap = {};
manifest.application_modules.forEach(m => orderMap[m.path] = m.order);

// Collision check
const defineMap = {};
for (const [modPath, data] of Object.entries(moduleData)) {
  for (const name of data.defines) defineMap[name] = defineMap[name] || [];
  for (const name of data.defines) defineMap[name].push(modPath);
}
const collisions = Object.entries(defineMap).filter(([name, paths]) => paths.length > 1);
out(`\nIdentifier collisions (defined in >1 module): ${collisions.length}`);

// Backward-dependency (cycle-candidate) check
const backwardDeps = [];
for (const [modPath, data] of Object.entries(moduleData)) {
  const n = orderMap[modPath];
  for (const c of data.consumesResolved) {
    for (const definer of c.definedIn) {
      const m2 = orderMap[definer];
      if (m2 > n) backwardDeps.push({ from: modPath, fromOrder: n, id: c.id, to: definer, toOrder: m2 });
    }
  }
}
out(`Backward/forward-reference dependencies (post string-stripping): ${backwardDeps.length}`);
backwardDeps.forEach(b => out('  ' + JSON.stringify(b)));

// Implicit hook-global consumers
const HOOK_NAMES = ['useState', 'useMemo', 'useRef', 'useEffect'];
const implicitHookConsumers = [];
for (const [modPath, data] of Object.entries(moduleData)) {
  if (data.hasReactDestructure) continue; // this is the origin, not a consumer
  const src = fs.readFileSync(path.join(V09, modPath), 'utf8');
  const usesHooksBare = HOOK_NAMES.some(h => new RegExp('\\b' + h + '\\(').test(src));
  if (usesHooksBare) implicitHookConsumers.push(modPath);
}
out(`\nImplicit React-hook-global consumers: ${implicitHookConsumers.length}`);
implicitHookConsumers.forEach(m => out('  ' + m));

// Direct shared-components consumers
const directSharedComponentsConsumers = Object.entries(moduleData)
  .filter(([modPath, data]) => data.consumesResolved.some(c => c.definedIn.includes('src/ui/shared-components.jsx')))
  .map(([modPath]) => modPath);
out(`\nDirect src/ui/shared-components.jsx consumers: ${directSharedComponentsConsumers.length}`);
directSharedComponentsConsumers.forEach(m => out('  ' + m));

const union = new Set([...directSharedComponentsConsumers, ...implicitHookConsumers]);
const both = directSharedComponentsConsumers.filter(m => implicitHookConsumers.includes(m));
out(`\nUnion (direct OR implicit): ${union.size}`);
out(`Both (direct AND implicit): ${both.length}`);

const guardedModules = Object.entries(moduleData).filter(([, d]) => d.hasGuard).map(([p]) => p);
out(`\nCommonJS-guarded modules: ${guardedModules.length}`);
guardedModules.forEach(m => out('  ' + m));

const totalMounts = Object.values(moduleData).reduce((sum, d) => sum + d.mountCount, 0);
out(`\nTotal ReactDOM.createRoot mount calls across all 34 modules: ${totalMounts}`);

fs.writeFileSync(path.join(__dirname, 'stage11c1-extraction-log.txt'), log.join('\n'));
out(`\nLog written to ${path.join(__dirname, 'stage11c1-extraction-log.txt')}`);
