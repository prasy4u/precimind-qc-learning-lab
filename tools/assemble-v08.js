#!/usr/bin/env node
/* =========================================================================
   tools/assemble-v08.js

   Deterministic assembler for recovered-v0.8-faithful.html
   Artifact Class: D (reconstruction infrastructure)
   Output: dist/recovered-v0.8-faithful.html  (Class B)

   Reads frozen Class A source modules in verified dependency order.
   Fails immediately if any frozen SHA mismatches.
   Does NOT modify any Class A source file.
   ========================================================================= */
'use strict';

const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const OUT  = path.join(DIST, 'recovered-v0.8-faithful.html');

// ── Frozen SHA-256 locks (all 36 verified source artifacts) ─────────────────
const FROZEN_SHAS = {
  'src/core/statistics.js':              '74e6d07ccd0bfae7e5cd9821078881b692e762cea3c9b4ad6eaf88799fc8f8d5',
  'src/ui/app-data.js':                  '81cef641a844bd1edb44ab60a81f5115f10eead0d5d6e668a8f6012e832119c1',
  'src/ui/shared-components.jsx':        'bd848d01c124c2941fa11b623adda3ba4e47e89f5e29137c901a276bfd7bad51',
  'src/ui/core-screens.jsx':             '90c2e85828d7aad9e6cb7899489a823290e6555d9216042f58aae6d99b30557d',
  'src/rules/engine.js':                 'a2ea2b71e72c312151c3e223b10815fac46d59b697f27912c6df4fc246ddf66b',
  'src/rules/data.js':                   '41453ef63973f4d463adbbcb0a5cac99f23469da3b3a575814dd0a0f5a2e2022',
  'src/rules/ui-components.jsx':         '4eb7a11042f48962cbdcad41cdf8edf22d42b9b43593960b075ffad8e91473c5',
  'src/rules/screens.jsx':               '8a374e0a900a591d2b810fa53e3d866f09d9e9ecbedbbd0fed629c268a4e3988',
  'src/opchar/functions.js':             '1f17659d7fd10fdc8493401d47801e93d8d6ffcccbc09b2ba1ccdb0fe8dfd4d1',
  'src/strategy/core.js':                '01a7431491c3e15c5c39777445a057b62a9e7b9876887fe1dc7b4ed97ad16f5e',
  'src/strategy/aps-ui-data.js':         'f45494a47a32498eea8272c4be696b584527bb823923f5fd3205a5231abbf827',
  'src/strategy/ui-components.jsx':      '46ba76ac6c508e34dc2e726e829b0d1e475de29090969e94b1d8e53d4f80e784',
  'src/strategy/screens.jsx':            '5283fcccc1a43c3687ccfd2d2c877dcabb186f486e0c5290c6da3589a05ea88a',
  'src/risk/detection-delay.js':         '2ba697e4a090d4fcee4b5d1dc70f5870726faf8f2197b8eb307fcd78b8175e7b',
  'src/risk/data.js':                    '2910e94235767ed3cce297bfa002f1c98b255fc16a7923c448eab585010f5bb2',
  'src/risk/ui-components.jsx':          'a71112bcad1ee82aed32041c65053f6b4e1f427b030a063cd5bdc6f90392e530',
  'src/risk/screens.jsx':                '7f0897e8d15704a66c64467a0f977ca7b6c8f2149ee931daeca2bcc63e0bc5e5',
  'src/investigation/calc.js':           'a0fbf5c2457f3987dd4afd33ede6634f15080bc1be36f36ac003c9881c8e8353',
  'src/investigation/data.js':           '5a0898859692b19e446b0f5e404fa99bd4d03712e1926b533ec0b2404d5ca76e',
  'src/investigation/ui-components.jsx': '26a0ae70b65e4ae422c970748eef4d196f6436e4a9f60a906501b9f51db57cd2',
  'src/investigation/screens.jsx':       'd2794c94352e2ba98aae6a06fcc1c0fa92501d876ee814205d33a014848f05cd',
  'src/eqa/calc.js':                     '5eca4130aff6a3eaee7972ceb45234bb0ccce073b293dc7c4ee3ac3a9853021f',
  'src/eqa/data.js':                     '465ba7674103b9f5a5f5a13dd1cdddefe23ce68abac54ded3c114a0671f99333',
  'src/eqa/ui-components.jsx':           'f7c973db56992f3da241e4537ff2d06e7f3b8925cfcb0495cdb1d06d006811b2',
  'src/eqa/screens.jsx':                 '3b10aa20060305e9067b6349d45697015bfee1b4db7aa251f3967792755cdd86',
  'src/bv/calc.js':                      '203838b74143c1838185351428fbe92844152d8b58ac610cffd7b6fc57e3707c',
  'src/bv/data.js':                      'ade1e82cc35b45c3df3283e4983e632ec3ac1c640e9f606971e47d51a5b803ef',
  'src/bv/ui-components.jsx':            '91c0b5a18722a5e48e07dee91099fea70efa9bda4356a093fb88d694ea9186aa',
  'src/bv/screens.jsx':                  '4698826081c3d6b08a7b03813b0f8901da7ded0bb65e4a272ff7e8620c8fbd2a',
  'src/pbrtqc/calc.js':                  '5d5247c6d712a4a31ce9a5028ac5e048d3b4f02c17842751f1d8067843bf908a',
  'src/pbrtqc/data.js':                  '4f2dbb7c28ed1071b0069788b55ba9c35603d9095e80fb9a4c6b135c08cfb98f',
  'src/pbrtqc/ui-components.jsx':        'b14efc6651f8b632bdbfcc74525f1d72a1096675cd9e0b3e4739907dd3a6ab81',
  'src/pbrtqc/screens.jsx':              '2e1cb56d0fa107d5680ebb59e73502fa3d03d8f308ea075cf2a1fc72559e28b7',
  'src/ui/app-shell.jsx':                '56e3d5fac4fcaffa3184e81f8e8be1fa292558a35d0a77974f0639759d101da4',
  'src/ui/original-v0.8.css':            'fda2285cb24966f3225bdfe5f2bd43f0e7065cef7616d882c24085c3d48b0212',
  'src/ui/runtime-bootstrap.js':         'f2bffcb0ab1b0653b866f7247842f4f878d7b6593eb56a5751c404732210e85a',
};

// Module assembly order (34 source modules in dependency-safe order)
const MODULE_ORDER = [
  'src/core/statistics.js',
  'src/ui/app-data.js',
  'src/ui/shared-components.jsx',
  'src/ui/core-screens.jsx',
  'src/rules/engine.js',
  'src/rules/data.js',
  'src/rules/ui-components.jsx',
  'src/rules/screens.jsx',
  'src/opchar/functions.js',
  'src/strategy/core.js',
  'src/strategy/aps-ui-data.js',
  'src/strategy/ui-components.jsx',
  'src/strategy/screens.jsx',
  'src/risk/detection-delay.js',
  'src/risk/data.js',
  'src/risk/ui-components.jsx',
  'src/risk/screens.jsx',
  'src/investigation/calc.js',
  'src/investigation/data.js',
  'src/investigation/ui-components.jsx',
  'src/investigation/screens.jsx',
  'src/eqa/calc.js',
  'src/eqa/data.js',
  'src/eqa/ui-components.jsx',
  'src/eqa/screens.jsx',
  'src/bv/calc.js',
  'src/bv/data.js',
  'src/bv/ui-components.jsx',
  'src/bv/screens.jsx',
  'src/pbrtqc/calc.js',
  'src/pbrtqc/data.js',
  'src/pbrtqc/ui-components.jsx',
  'src/pbrtqc/screens.jsx',
  'src/ui/app-shell.jsx',
];

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function readAndVerify(relPath) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) {
    console.error(`ASSEMBLY FAIL: Missing source file: ${relPath}`);
    process.exit(1);
  }
  const content = fs.readFileSync(full, 'utf8');
  const actual = sha256(content);
  const expected = FROZEN_SHAS[relPath];
  if (expected && actual !== expected) {
    console.error(`ASSEMBLY FAIL: SHA mismatch for ${relPath}`);
    console.error(`  Expected: ${expected}`);
    console.error(`  Actual:   ${actual}`);
    process.exit(1);
  }
  return content;
}

// ── Main assembly ─────────────────────────────────────────────────────────
console.log('=== PreciMind v0.8 Faithful Assembly ===');
console.log(`Output: ${OUT}`);

if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });

// 1. Verify and read CSS
console.log('\nVerifying CSS...');
const css = readAndVerify('src/ui/original-v0.8.css');
console.log(`  CSS: ${css.split('\n').length} lines, SHA ${sha256(css).substring(0,16)}... OK`);

// 2. Read original HTML for envelope slices (vendor scripts + metadata)
const htmlLines = fs.readFileSync(
  path.join(ROOT, 'recovery', 'original-v0.8.html'), 'utf8'
).split('\n');

// Metadata: HTML lines 1-6 (0-indexed 0:6)
const metaLines = htmlLines.slice(0, 6).join('\n');

// Vendor block: HTML lines 532-836 (0-indexed 531:836)
const vendorBlock = htmlLines.slice(531, 836).join('\n') + '\n';
console.log(`Vendor block: HTML 532-836, ${vendorBlock.split('\n').length - 1} lines, SHA ${sha256(vendorBlock).substring(0,16)}...`);

// 3. Verify and read bootstrap
const bootstrap = readAndVerify('src/ui/runtime-bootstrap.js');
console.log(`Bootstrap: ${bootstrap.split('\n').length} lines, SHA ${sha256(bootstrap).substring(0,16)}... OK`);

// 4. Assemble app-source payload from 34 ordered modules
console.log('\nAssembling app-source from 34 modules:');
let appSource = '';
for (const modPath of MODULE_ORDER) {
  const content = readAndVerify(modPath);
  appSource += content;
  process.stdout.write(`  [${String(MODULE_ORDER.indexOf(modPath) + 1).padStart(2, '0')}/34] ${modPath} (${content.split('\n').length}L) SHA-OK\n`);
}

// Verify mount call count
const mountCount = (appSource.match(/ReactDOM\.createRoot\(/g) || []).length;
console.log(`\nReactDOM.createRoot mount calls in assembled source: ${mountCount}`);
if (mountCount !== 19) {
  console.error(`ASSEMBLY FAIL: Expected exactly 19 mount calls, found ${mountCount}`);
  process.exit(1);
}

// 5. Build the HTML document
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

console.log('\n=== Assembly Complete ===');
console.log(`Output: ${OUT}`);
console.log(`Size: ${outBytes} bytes`);
console.log(`SHA-256: ${outSha}`);
console.log(`Mount calls preserved: ${mountCount}`);
console.log(`Modules assembled: ${MODULE_ORDER.length}`);
console.log(`Artifact class: B (deterministic reconstruction - NOT Class A)`);
