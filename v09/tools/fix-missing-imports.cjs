#!/usr/bin/env node
/* Comprehensive missing-import finder using precise word-boundary regex
   directly on raw source (avoids the earlier stripNonCode JSX-apostrophe
   bug). May have false positives for identifiers appearing only inside
   string/JSX text, but those are harmless over-reports we can review;
   the goal here is to catch every TRUE missing import (no false negatives)
   even at the cost of manually reviewing some false positives. */
'use strict';
const fs = require('fs');
const path = require('path');

const APP_DIR = path.join(__dirname, '..', 'app');

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
  'React','useState','useMemo','useRef','useEffect','fetch','localStorage','navigator','key','i','e','v','n','m','x','y','t','a','b','c','d','s','p','r','l','k']);

const allFiles = findAllFiles(APP_DIR).filter(f => path.basename(f) !== 'main.jsx');
const fileData = {};

for (const file of allFiles) {
  const rel = path.relative(APP_DIR, file);
  const src = fs.readFileSync(file, 'utf8');
  const exportNames = new Set();
  let m;
  const exportRe = /^export\s+(?:function\s+([A-Za-z_$][\w$]*)|(?:const|let|var)\s+([A-Za-z_$][\w$]*))/gm;
  while ((m = exportRe.exec(src))) exportNames.add(m[1] || m[2]);
  fileData[rel] = { file, src, exportNames };
}

const globalExports = {};
for (const [rel, d] of Object.entries(fileData)) {
  for (const name of d.exportNames) {
    if (!globalExports[name]) globalExports[name] = [];
    globalExports[name].push(rel);
  }
}

let totalMissing = 0;
for (const [rel, d] of Object.entries(fileData)) {
  const src = d.src;
  // local declares (top-level)
  const localNames = new Set();
  let m;
  const localRe = /^(?:function\s+([A-Za-z_$][\w$]*)|(?:const|let|var)\s+([A-Za-z_$][\w$]*))/gm;
  while ((m = localRe.exec(src))) localNames.add(m[1] || m[2]);
  // imported names
  const importedNames = new Set();
  const importRe = /^import\s+(?:([A-Za-z_$][\w$]*)\s*,\s*)?\{([^}]*)\}\s+from/gm;
  while ((m = importRe.exec(src))) {
    if (m[1]) importedNames.add(m[1]);
    m[2].split(',').forEach(n => { const nm = n.trim(); if (nm) importedNames.add(nm); });
  }
  const defaultRe = /^import\s+([A-Za-z_$][\w$]*)\s+from/gm;
  while ((m = defaultRe.exec(src))) importedNames.add(m[1]);
  // function params (rough: destructured/named params shouldn't be flagged) — skip deep analysis, rely on scope via localNames only

  for (const [name, definers] of Object.entries(globalExports)) {
    if (definers.includes(rel)) continue; // it's the definer itself
    if (localNames.has(name)) continue;
    if (importedNames.has(name)) continue;
    if (JS_BUILTINS.has(name)) continue;
    // word-boundary check for actual usage in this file
    const useRe = new RegExp('(?<![A-Za-z0-9_$])' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![A-Za-z0-9_$])');
    if (useRe.test(src)) {
      console.log(`${rel}: uses "${name}" (exported by ${definers.join(',')}) but does not import it`);
      totalMissing++;
    }
  }
}
console.log(`\nTotal potential missing imports: ${totalMissing}`);
