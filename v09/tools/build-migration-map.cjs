#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const V09 = path.join(__dirname, '..');
const MANIFEST = JSON.parse(fs.readFileSync(path.join(V09, 'tools', 'v09-source-order.json'), 'utf8'));
const GRAPH = JSON.parse(fs.readFileSync(path.join(V09, 'docs', 'v09-module-dependency-graph.json'), 'utf8'));
const TRANSFORM_RESULT = JSON.parse(fs.readFileSync(path.join(V09, 'docs', 'stage11c2-transform-verification-result.json'), 'utf8'));

function sha256(content) { return crypto.createHash('sha256').update(content).digest('hex'); }

function extractActualImports(src) {
  const imports = [];
  const importRe = /^import\s+(?:([A-Za-z_$][\w$]*)\s*,\s*)?\{([^}]*)\}\s+from\s+["']([^"']+)["']/gm;
  let m;
  while ((m = importRe.exec(src))) {
    imports.push({ default: m[1] || null, names: m[2].split(',').map(s => s.trim()).filter(Boolean), from: m[3] });
  }
  const defaultRe = /^import\s+([A-Za-z_$][\w$]*)\s+from\s+["']([^"']+)["']/gm;
  while ((m = defaultRe.exec(src))) {
    if (!imports.some(i => i.from === m[2])) imports.push({ default: m[1], names: [], from: m[2] });
  }
  return imports;
}
function extractActualExports(src) {
  const exports = [];
  const exportRe = /^export\s+(?:function\s+([A-Za-z_$][\w$]*)|(?:const|let|var)\s+([A-Za-z_$][\w$]*))/gm;
  let m;
  while ((m = exportRe.exec(src))) exports.push(m[1] || m[2]);
  return exports;
}

const map = [];
for (const mod of MANIFEST.application_modules) {
  const legacyPath = mod.path;
  const activePath = legacyPath.replace(/^src\//, 'app/');
  const graphEntry = GRAPH.modules.find(m => m.path === legacyPath);
  const transformEntry = TRANSFORM_RESULT.results.find(r => r.legacyPath === legacyPath);

  const legacySrc = fs.readFileSync(path.join(V09, legacyPath), 'utf8');
  const activeSrc = fs.readFileSync(path.join(V09, activePath), 'utf8');

  const actualImports = extractActualImports(activeSrc);
  const actualExports = extractActualExports(activeSrc);

  const hadGuard = /typeof module !== "undefined"/.test(legacySrc);
  const stillHasGuard = /typeof module !== "undefined"/.test(activeSrc);
  const stillHasHookGlobalDestructure = /const\s*\{\s*useState/.test(activeSrc) && legacyPath !== 'src/ui/shared-components.jsx';
  const mountCount = (activeSrc.match(/ReactDOM\.createRoot\(/g) || []).length;

  map.push({
    order: mod.order,
    legacy_path: legacyPath,
    active_path: activePath,
    legacy_sha256: sha256(legacySrc),
    active_sha256: sha256(activeSrc),
    imports: actualImports.map(i => ({ from: i.from, names: i.names, default: i.default })),
    exports: actualExports,
    commonjs_wrapper_removed: hadGuard && !stillHasGuard,
    commonjs_wrapper_present_in_active: stillHasGuard,
    react_dependency_status: legacyPath === 'src/ui/shared-components.jsx'
      ? 'ORIGIN — now imports hooks from react directly (no longer destructures from global React)'
      : (actualImports.some(i => i.from === 'react') ? 'imports required hooks/React directly from react' : 'no react import needed'),
    source_transform_verification: transformEntry ? (transformEntry.permittedTransformsOnly ? 'PASS' : 'FAIL') : 'NOT_RUN',
    migration_risk_inherited_from_stage11c1: graphEntry ? graphEntry.migration_risk : null,
    mount_call_count_in_active: mountCount,
    migration_notes: legacyPath === 'src/ui/app-shell.jsx'
      ? 'All 19 historical mount statements and the mount-only rootEl declaration removed. App and NAV_ITEMS exported. Single createRoot call now lives in app/main.jsx.'
      : (legacyPath === 'src/ui/shared-components.jsx'
        ? 'React-hook destructuring (const { useState, ... } = React;) replaced with explicit import { useState, useMemo, useRef, useEffect } from "react". Application exports unchanged (Badge, LJChart, MetricCard, Modal, SliderField, etc.) — hooks are NOT exported.'
        : (hadGuard
          ? 'CommonJS recovery-export guard removed; declarations converted to named ES exports.'
          : 'No CommonJS guard existed (already-plain declarative/component module); declarations converted to named ES exports.')),
  });
}

fs.writeFileSync(path.join(V09, 'docs', 'v09-stage11c2-module-map.json'), JSON.stringify({
  stage: '11C2',
  artifact_class: 'V09_TEST',
  total_modules: map.length,
  modules: map,
}, null, 2));

console.log(`Migration map written: ${map.length} modules`);
console.log(`CommonJS wrappers removed: ${map.filter(m => m.commonjs_wrapper_removed).length}`);
console.log(`CommonJS wrappers still present (should be 0): ${map.filter(m => m.commonjs_wrapper_present_in_active).length}`);
console.log(`Total mount calls in active tree (should be 0): ${map.reduce((s, m) => s + m.mount_call_count_in_active, 0)}`);
console.log(`Source-transform verification failures (should be 0): ${map.filter(m => m.source_transform_verification === 'FAIL').length}`);
