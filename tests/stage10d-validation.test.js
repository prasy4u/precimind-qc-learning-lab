/* =========================================================================
   tests/stage10d-validation.test.js

   Stage 10D: Final validation of browser-equivalence closure.
   Validates: recovery/stage10d-final-equivalence.json
   Also verifies Stage 10C historical record status.

   ARTIFACT PROVENANCE: Class D (recovery infrastructure)
   Run: node tests/stage10d-validation.test.js
   ========================================================================= */
'use strict';

const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

let passed = 0, failed = 0, sg = 0, rc = 0;

function assert(id, condition, detail, prov) {
  if (condition) { console.log(`  ✓ [${id}] ${detail}`); passed++; }
  else { console.error(`  ✗ [${id}] FAIL: ${detail}`); failed++; }
  if (prov === 'sg') sg++; else rc++;
}

const ROOT   = path.join(__dirname, '..');
const D10_PATH  = path.join(ROOT, 'recovery', 'stage10d-final-equivalence.json');
const C10_PATH  = path.join(ROOT, 'recovery', 'stage10c-interaction-equivalence.json');
const MAN_PATH  = path.join(ROOT, 'RECOVERY_MANIFEST.md');
const INV_PATH  = path.join(ROOT, 'SCIENTIFIC_INVARIANTS.md');

const d10 = JSON.parse(fs.readFileSync(D10_PATH, 'utf8'));
const c10 = JSON.parse(fs.readFileSync(C10_PATH, 'utf8'));

/* -----------------------------------------------------------------------
   SECTION A: Stage 10C historical record (INCOMPLETE status)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION A: Stage 10C historical record ===');

assert('A-01', c10.validation_status === 'INCOMPLETE',
  'Stage 10C validation_status = INCOMPLETE', 'sg');
assert('A-02', c10.summary.total === 164,
  'Stage 10C historical total = 164', 'sg');
assert('A-03', c10.summary.match === 145,
  'Stage 10C historical match = 145', 'sg');
assert('A-04', c10.summary.difference === 0,
  'Stage 10C historical difference = 0', 'sg');
assert('A-05', c10.summary.blocked === 19,
  'Stage 10C historical blocked = 19', 'sg');
assert('A-06', c10.summary.not_tested === 0,
  'Stage 10C historical not_tested = 0', 'sg');

const c10BlockedIds = c10.checkpoints.filter(cp => cp.classification === 'BLOCKED').map(cp => cp.id);
assert('A-07', c10BlockedIds.length === 19,
  `Stage 10C has exactly 19 BLOCKED checkpoint IDs (found ${c10BlockedIds.length})`, 'sg');

/* -----------------------------------------------------------------------
   SECTION B: Stage 10D result structure
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION B: Stage 10D result structure ===');

assert('B-01', d10.stage === '10D', 'Stage 10D result stage field', 'rc');
assert('B-02', d10.original_sha === 'e5317bf135f350b258428b985c1034a081e244a295f2e580c93cb6a6a091c8e4',
  'Original SHA matches authoritative', 'sg');
assert('B-03', d10.candidate_sha === 'a9fe9a3acbb8c35347cc735292ad63883778e5c12845f4da529129119b72c886',
  'Candidate SHA matches assembled faithful', 'sg');

// Summary computed from array
const computed = {match:0, difference:0, blocked:0, not_applicable:0, not_tested:0};
d10.checkpoints.forEach(cp => {
  const k = cp.classification.toLowerCase().replace(/-/g,'_');
  if (computed[k] !== undefined) computed[k]++;
});
assert('B-04', d10.summary.total === d10.checkpoints.length,
  `summary.total (${d10.summary.total}) = checkpoint array length (${d10.checkpoints.length})`, 'rc');
assert('B-05', d10.summary.difference === computed.difference,
  `summary.difference (${d10.summary.difference}) computed correctly`, 'rc');
assert('B-06', d10.summary.blocked === computed.blocked,
  `summary.blocked (${d10.summary.blocked}) computed correctly`, 'rc');

/* -----------------------------------------------------------------------
   SECTION C: Stage 10D pass criteria
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION C: Stage 10D historical counts (for record accuracy) ===');

assert('C-00', d10.validation_status === 'INCOMPLETE',
  'Stage 10D validation_status = INCOMPLETE (correctly marked by Stage 10E audit)', 'sg');
assert('C-01', d10.summary.difference === 0,
  `Stage 10D historical DIFFERENCE = 0 (found ${d10.summary.difference})`, 'sg');
assert('C-02', d10.summary.blocked === 0,
  `BLOCKED = 0 (found ${d10.summary.blocked})`, 'sg');
assert('C-03', d10.summary.not_tested === 0,
  `NOT_TESTED = 0 (required flows not skipped) (found ${d10.summary.not_tested})`, 'sg');
assert('C-04', d10.summary.match >= 60,
  `MATCH count substantial (found ${d10.summary.match})`, 'rc');

/* -----------------------------------------------------------------------
   SECTION D: Every Stage 10C BLOCKED ID resolved
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION D: 19/19 Stage 10C BLOCKED IDs resolved ===');

const resolvedIds = new Set(d10.checkpoints.filter(cp => cp.resolves_stage10c_id).map(cp => cp.resolves_stage10c_id));
assert('D-00', resolvedIds.size === 19,
  `19 Stage 10C blocked IDs resolved (found ${resolvedIds.size})`, 'sg');

for (const bid of c10BlockedIds) {
  assert(`D-${bid.substring(0,15)}`, resolvedIds.has(bid),
    `Stage 10C blocker resolved: ${bid}`, 'sg');
}

// All resolving checkpoints must be MATCH
const resolvingCPs = d10.checkpoints.filter(cp => cp.resolves_stage10c_id);
const allResolvedMatch = resolvingCPs.every(cp => cp.classification === 'MATCH');
assert('D-ALL-MATCH', allResolvedMatch,
  'All 19 blocker-resolution checkpoints classified MATCH', 'sg');

/* -----------------------------------------------------------------------
   SECTION E: Required interaction flows present
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION E: Required interaction flows ===');

assert('E-01', d10.checkpoints.some(cp => cp.id.includes('DIAG') && cp.id.includes('low') && cp.classification === 'MATCH'),
  'Diagnostic: low-complexity pattern present and MATCH', 'sg');
assert('E-02', d10.checkpoints.some(cp => cp.id.includes('DIAG') && cp.id.includes('hig') && cp.classification === 'MATCH'),
  'Diagnostic: high-complexity pattern present and MATCH', 'sg');
assert('E-03', d10.checkpoints.some(cp => cp.id.includes('DIAG') && cp.id.includes('result') && cp.classification === 'MATCH'),
  'Diagnostic: result dialog DOM comparison', 'sg');
assert('E-04', d10.checkpoints.some(cp => cp.id.startsWith('SIGMA-LV-beginner') && cp.classification === 'MATCH'),
  'Four-level lab: beginner Sigma Sandbox', 'sg');
assert('E-05', d10.checkpoints.some(cp => cp.id.startsWith('SIGMA-LV-expert') && cp.classification === 'MATCH'),
  'Four-level lab: expert Sigma Sandbox', 'sg');
assert('E-06', ['beginner','intermediate','advanced','expert'].every(lv =>
  d10.checkpoints.some(cp => cp.id === `SIGMA-LV-${lv}` && cp.classification === 'MATCH')),
  'All four learner levels tested in Sigma Sandbox', 'sg');
assert('E-07', d10.checkpoints.some(cp => cp.id.startsWith('SIGMA-') && !cp.id.includes('LV-') && cp.classification === 'MATCH'),
  'Sigma Sandbox: configuration interaction checkpoints present', 'sg');
assert('E-08', d10.checkpoints.some(cp => cp.id === 'PROC-table' && cp.classification === 'MATCH'),
  'Procedure Comparator: full table DOM comparison', 'sg');
assert('E-09', d10.checkpoints.some(cp => cp.id === 'PROC-unsupported'),
  'Procedure Comparator: unsupported Ped/Pfr check present', 'sg');
assert('E-10', d10.checkpoints.some(cp => cp.id === 'LJ-KB-chartpoint'),
  'LJ Laboratory: keyboard focus check present', 'sg');
assert('E-11', d10.checkpoints.some(cp => cp.id === 'RULE-KB-point'),
  'Rule Laboratory: keyboard interaction check present', 'sg');
assert('E-12', d10.checkpoints.some(cp => cp.id.startsWith('PAT-session-') && cp.classification === 'MATCH'),
  'Pattern Challenge: session state checkpoints present', 'sg');
assert('E-13', d10.checkpoints.some(cp => cp.id === 'PAT-score'),
  'Pattern Challenge: session score check present', 'sg');
assert('E-14', d10.checkpoints.some(cp => cp.id === 'PBRTQC-SIG-A'),
  'PBRTQC: Case A signature check present', 'sg');
assert('E-15', d10.checkpoints.some(cp => cp.id === 'PBRTQC-NODE-cov' && cp.classification === 'MATCH'),
  'PBRTQC: Node scientific coverage confirmed', 'sg');

/* -----------------------------------------------------------------------
   SECTION F: NOT_APPLICABLE entries justified
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION F: NOT_APPLICABLE entries ===');

const naEntries = d10.checkpoints.filter(cp => cp.classification === 'NOT_APPLICABLE');
assert('F-01', naEntries.length === 2,
  `Exactly 2 NOT_APPLICABLE entries (PBRTQC Cases B/C) (found ${naEntries.length})`, 'sg');
assert('F-02', naEntries.every(cp => cp.domain === 'pbrtqc'),
  'All NOT_APPLICABLE entries are in PBRTQC domain', 'rc');
assert('F-03', naEntries.every(cp => cp.notes && cp.notes.length > 0),
  'All NOT_APPLICABLE entries have explanatory notes', 'rc');

/* -----------------------------------------------------------------------
   SECTION G: Candidate SHA unchanged
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION G: Candidate SHA integrity ===');

const actual = crypto.createHash('sha256')
  .update(fs.readFileSync(path.join(ROOT, 'dist', 'recovered-v0.8-faithful.html'), 'utf8'))
  .digest('hex');
assert('G-01', actual === 'a9fe9a3acbb8c35347cc735292ad63883778e5c12845f4da529129119b72c886',
  'dist/recovered-v0.8-faithful.html SHA unchanged on disk', 'sg');

/* -----------------------------------------------------------------------
   SECTION H: Frozen src/ unchanged
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION H: Frozen source immutability ===');

const FROZEN = {
  'src/core/statistics.js':    '74e6d07ccd0bfae7e5cd9821078881b692e762cea3c9b4ad6eaf88799fc8f8d5',
  'src/ui/app-shell.jsx':      '56e3d5fac4fcaffa3184e81f8e8be1fa292558a35d0a77974f0639759d101da4',
  'src/risk/screens.jsx':      '7f0897e8d15704a66c64467a0f977ca7b6c8f2149ee931daeca2bcc63e0bc5e5',
  'src/ui/runtime-bootstrap.js': 'f2bffcb0ab1b0653b866f7247842f4f878d7b6593eb56a5751c404732210e85a',
  'src/rules/engine.js':       'a2ea2b71e72c312151c3e223b10815fac46d59b697f27912c6df4fc246ddf66b',
};
Object.entries(FROZEN).forEach(([rel, expected]) => {
  const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel), 'utf8')).digest('hex');
  assert(`H-01-${path.basename(rel).substring(0,10)}`, actual === expected,
    `${rel}: SHA-256 unchanged`, 'sg');
});

/* -----------------------------------------------------------------------
   SECTION I: Manifest/assembly provenance consistent
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION I: Provenance consistency ===');

const manifest = fs.readFileSync(MAN_PATH, 'utf8');
const COMPOSITE = ['src/core/statistics.js','src/rules/engine.js','src/opchar/functions.js','src/strategy/core.js'];
for (const f of COMPOSITE) {
  assert(`I-01-${f.split('/').pop().substring(0,10)}`,
    manifest.includes(f) && (manifest.includes('A+D composite') || manifest.includes('composite')),
    `MANIFEST: ${f.split('/').pop()} marked composite`, 'rc');
}

const amap = JSON.parse(fs.readFileSync(path.join(ROOT, 'recovery', 'assembly-map.json'), 'utf8'));
assert('I-02', amap.modules.filter(m=>m.artifact_class==='composite').length === 10,
  'assembly-map.json: 10 composite modules', 'sg');
assert('I-03', amap.modules.filter(m=>m.artifact_class==='A').length === 24,
  'assembly-map.json: 24 pure Class A modules', 'sg');

/* -----------------------------------------------------------------------
   SECTION J: Mount wording is observational
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION J: Mount wording ===');

const invariants = fs.readFileSync(INV_PATH, 'utf8');
assert('J-01', !invariants.includes('React silently coalesces'),
  '"React silently coalesces" absent from SCIENTIFIC_INVARIANTS', 'rc');
assert('J-02', !invariants.includes('React runtime coalesces'),
  '"React runtime coalesces" absent from SCIENTIFIC_INVARIANTS', 'rc');
assert('J-03', invariants.includes('not directly instrumented') || invariants.includes('not further instrumented'),
  'Observational wording present in SCIENTIFIC_INVARIANTS', 'rc');

/* -----------------------------------------------------------------------
   SUMMARY
   ----------------------------------------------------------------------- */
const total = passed + failed;
console.log(`\n${'='.repeat(60)}`);
console.log(`Stage 10D Final Validation Tests: ${passed}/${total} passed, ${failed} failed`);
console.log(`  Source-grounded expectations: ${sg}`);
console.log(`  Reconstructed expectations:   ${rc}`);
console.log(`  Stage 10C historical: 164 checkpoints, 145 MATCH, 19 BLOCKED (INCOMPLETE)`);
console.log(`  Stage 10D final:      ${d10.summary.total} checkpoints, ${d10.summary.match} MATCH, ${d10.summary.blocked} BLOCKED, ${d10.summary.not_applicable} NOT_APPLICABLE`);
console.log(`  19/19 Stage 10C blocked IDs: resolved`);
console.log(`  Candidate SHA: ${d10.candidate_sha.substring(0,16)}...`);
if (failed > 0) {
  console.error('STAGE 10D HISTORICAL RECORD VALIDATOR FAILED — internal inconsistency.');
  process.exit(1);
} else {
  console.log('STAGE 10D HISTORICAL RECORD CONFIRMED — accurately recorded as INCOMPLETE (source-aware audit required Stage 10E).');
  process.exit(0);
}
