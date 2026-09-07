/* =========================================================================
   v09/tests/stage12a-morning-qc-foundation.test.js

   Stage 12A: Morning QC Room Foundation governance tests.
   ARTIFACT PROVENANCE: V09_TEST
   Run: node v09/tests/stage12a-morning-qc-foundation.test.js
   ========================================================================= */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

let passed = 0, failed = 0;
function assert(id, cond, detail) {
  if (cond) { console.log(`  ✓ [${id}] ${detail}`); passed++; }
  else { console.error(`  ✗ [${id}] FAIL: ${detail}`); failed++; }
}
function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }

const ROOT = path.join(__dirname, '..', '..');
const V09 = path.join(__dirname, '..');
const MQC = path.join(V09, 'app', 'morning-qc');
const BASE_REF = '3581d28';

function unchangedSince(relPath, ref) {
  try { return execSync(`git diff ${ref} --name-only -- ${relPath}`, { cwd: ROOT }).toString().trim().length === 0; }
  catch (e) { return false; }
}

async function main() {
  /* --- 1. Baseline provenance --- */
  console.log('\n=== 1. Baseline provenance ===');
  let branch = '', tagCommit = '';
  try { branch = execSync('git branch --show-current', { cwd: ROOT }).toString().trim(); } catch (e) {}
  try { tagCommit = execSync('git rev-list -n 1 recovered-v0.8-validated', { cwd: ROOT }).toString().trim().substring(0, 7); } catch (e) {}
  assert('1a', branch === 'v0.9-development', `Branch is v0.9-development (found "${branch}")`);
  assert('1b', tagCommit === '1352dba', `v0.8 tag unchanged (found "${tagCommit}")`);

  /* --- 2. Stage 11C2 architecture frozen --- */
  console.log('\n=== 2. Stage 11C2 architecture frozen ===');
  assert('2a', unchangedSince('v09/app/core', BASE_REF) && unchangedSince('v09/app/ui', BASE_REF) &&
    unchangedSince('v09/app/rules', BASE_REF) && unchangedSince('v09/app/strategy', BASE_REF) &&
    unchangedSince('v09/app/risk', BASE_REF) && unchangedSince('v09/app/investigation', BASE_REF) &&
    unchangedSince('v09/app/eqa', BASE_REF) && unchangedSince('v09/app/bv', BASE_REF) &&
    unchangedSince('v09/app/pbrtqc', BASE_REF) && unchangedSince('v09/app/opchar', BASE_REF) &&
    unchangedSince('v09/app/main.jsx', BASE_REF),
    'All 34 inherited active modules + main.jsx unchanged since Stage 11C2');
  assert('2b', unchangedSince('v09/src', BASE_REF), 'Frozen v09/src/** unchanged');
  assert('2c', unchangedSince('v09/dist-vite-bridge', BASE_REF), 'Frozen Stage 11C1 bridge unchanged');

  let modularTreeSha = '';
  try {
    execSync(`node ${path.join(V09, 'tools', 'hash-build-tree.cjs')} ${path.join(V09, 'dist-vite')}`, { cwd: V09 });
    const treeResult = JSON.parse(fs.readFileSync(path.join(V09, 'dist-vite.tree-hash.json'), 'utf8'));
    modularTreeSha = treeResult.tree_hash_sha256;
  } catch (e) { modularTreeSha = 'ERROR: ' + e.message; }
  assert('2d', modularTreeSha === '4614aca944cedfa650b0533280b2923e6f13c2b9f25e7c208501a3fcc477c2a5',
    `Stage 11C2 modular tree SHA unchanged (found ${modularTreeSha.substring(0, 20)}...)`);

  const compatSha = sha256(fs.readFileSync(path.join(V09, 'dist', 'precimind-v0.9-compat.html')));
  assert('2e', compatSha === '975adefb62df00f12372cb705b9c2ef9b51c89a2b8133ade77ebf0db16f8c97c', 'Stage 11B compat SHA unchanged');

  /* --- 3. Current 14-nav application unchanged --- */
  console.log('\n=== 3. 14-nav application unchanged ===');
  const stage11c2ResultPath = path.join(V09, 'tests', 'browser', 'v09-stage11c2-modular-equivalence-result.json');
  const stage11c2Result = JSON.parse(fs.readFileSync(stage11c2ResultPath, 'utf8'));
  const navCp = stage11c2Result.checkpoints.find(cp => cp.id === 'nav-14-destinations');
  assert('3a', navCp && navCp.original === '14', 'Retained Stage 11C2 browser evidence still shows exactly 14 nav destinations');
  assert('3b', unchangedSince('v09/tests/browser/v09-stage11c2-modular-equivalence-result.json', BASE_REF), 'Stage 11C2 browser result unchanged (not silently regenerated)');

  /* --- 4. Morning QC foundation directory + files exist --- */
  console.log('\n=== 4. Morning QC foundation structure ===');
  for (const f of ['types.js', 'states.js', 'case-schema.js', 'case-validator.js', 'engine.js', 'decision-model.js', 'evidence-model.js', 'scoring-model.js', 'debrief-model.js']) {
    assert(`4-${f}`, fs.existsSync(path.join(MQC, f)), `v09/app/morning-qc/${f} exists`);
  }
  assert('4-data', fs.existsSync(path.join(MQC, 'data')), 'v09/app/morning-qc/data/ exists');
  assert('4-cases', fs.existsSync(path.join(MQC, 'cases')), 'v09/app/morning-qc/cases/ exists');

  /* --- 5-9. Load the actual modules --- */
  const { validateCase } = await import('file://' + path.join(MQC, 'case-validator.js'));
  const { createInitialState, applyAction, replay } = await import('file://' + path.join(MQC, 'engine.js'));
  const states = await import('file://' + path.join(MQC, 'states.js'));
  const { pilot1ReagentLotShift, pilot2PbrtqcPopulationShift, pilot3RcvPatientImpact } = await import('file://' + path.join(MQC, 'cases', 'index.js'));
  const { generateDebrief } = await import('file://' + path.join(MQC, 'debrief-model.js'));
  const pilots = [pilot1ReagentLotShift, pilot2PbrtqcPopulationShift, pilot3RcvPatientImpact];

  console.log('\n=== 5. Deterministic engine ===');
  {
    const actions = [{ type: 'INSPECT_PANEL', panelId: pilots[0].panels[0].id }];
    const r1 = replay(pilots[0], actions);
    const r2 = replay(pilots[0], actions);
    assert('5', JSON.stringify(r1.finalState) === JSON.stringify(r2.finalState), 'Engine replay is deterministic');
  }

  console.log('\n=== 6. Explicit service-state model ===');
  assert('6', Array.isArray(states.SERVICE_STATES) && states.SERVICE_STATES.length === 7 && states.SERVICE_STATE_TRANSITIONS, 'Explicit SERVICE_STATES + transition table exist');

  console.log('\n=== 7. Explicit patient-impact model ===');
  assert('7', Array.isArray(states.PATIENT_IMPACT_STATES) && states.PATIENT_IMPACT_STATES.length === 6 && states.PATIENT_IMPACT_TRANSITIONS, 'Explicit PATIENT_IMPACT_STATES + transition table exist');

  console.log('\n=== 8. Explicit hypothesis/evidence distinction ===');
  assert('8a', Array.isArray(states.HYPOTHESIS_EVIDENCE_STATES) && !states.HYPOTHESIS_EVIDENCE_STATES.includes('TRUE') && !states.HYPOTHESIS_EVIDENCE_STATES.includes('FALSE'), 'Hypothesis states are graded, not boolean TRUE/FALSE');
  assert('8b', states.HYPOTHESIS_EVIDENCE_STATES.includes('PLAUSIBLE') && states.HYPOTHESIS_EVIDENCE_STATES.includes('ESTABLISHED'), 'Graded hypothesis states include PLAUSIBLE and ESTABLISHED as distinct steps');

  console.log('\n=== 9. Confidence separate from correctness ===');
  {
    let state = createInitialState(pilots[0]);
    let out = applyAction(pilots[0], state, { type: 'RECORD_CONFIDENCE', decisionId: 'x', confidence: 'HIGH' });
    assert('9', out.state.serviceState === state.serviceState && out.state.patientImpactState === state.patientImpactState, 'RECORD_CONFIDENCE does not alter serviceState/patientImpactState (confidence never substitutes for correctness)');
  }

  console.log('\n=== 10. Structured documentation model ===');
  {
    const state = createInitialState(pilots[0]);
    const requiredDocFields = ['signal', 'containment', 'evidenceReviewed', 'hypothesesConsidered', 'investigationPerformed', 'establishedCause', 'intervention', 'verification', 'patientImpactAssessment', 'finalDisposition', 'escalation'];
    assert('10', requiredDocFields.every(f => f in state.documentation), 'Initial state documentation object contains all required structured fields');
  }

  console.log('\n=== 11. Structured debrief model ===');
  {
    const out = applyAction(pilots[0], createInitialState(pilots[0]), { type: 'ACKNOWLEDGE_SIGNAL' });
    const debrief = generateDebrief(pilots[0], out.state);
    const requiredDebriefFields = ['noticed', 'missed', 'evidenceValue', 'containment', 'hypotheses', 'intervention', 'verification', 'patientImpact', 'disposition', 'confidenceCalibration', 'scoringProfile'];
    assert('11', requiredDebriefFields.every(f => f in debrief), 'Debrief contains all required structured sections (not a bare "correct answer = X")');
  }

  console.log('\n=== 12. Exactly 3 pilot cases ===');
  assert('12', pilots.length === 3, `Exactly 3 pilot cases exist (found ${pilots.length})`);

  console.log('\n=== 13. All 3 pilot cases validate ===');
  {
    const results = pilots.map(p => validateCase(p));
    assert('13', results.every(r => r.valid === true), `All 3 pilot cases pass strict validation (errors: ${JSON.stringify(results.map(r => r.errors))})`);
  }

  console.log('\n=== 14. Expert/safe-inefficient/unsafe paths exist for each ===');
  {
    const pathTestSrc = fs.readFileSync(path.join(V09, 'tests', 'morning-qc', 'pilot-paths.test.cjs'), 'utf8');
    assert('14a', (pathTestSrc.match(/P1-EXPERT-01/g) || []).length >= 1 && (pathTestSrc.match(/P2-EXPERT-01/g) || []).length >= 1 && (pathTestSrc.match(/P3-EXPERT-01/g) || []).length >= 1, 'Expert path tests exist for all 3 pilots');
    assert('14b', (pathTestSrc.match(/SAFEINEFF-01/g) || []).length >= 3, 'Safe-but-inefficient path tests exist for all 3 pilots');
    assert('14c', (pathTestSrc.match(/UNSAFE-01/g) || []).length >= 3, 'Unsafe/premature path tests exist for all 3 pilots');
  }

  console.log('\n=== 15. Unsupported automatic root-cause inference absent ===');
  {
    // Structural check: the engine never sets a hypothesis to ESTABLISHED
    // without at least one decisive evidence item having been processed.
    let state = createInitialState(pilots[0]);
    let out = applyAction(pilots[0], state, { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-lot' });
    assert('15', out.state.hypothesisStates['hyp-lot'] !== 'ESTABLISHED', 'Forming a hypothesis alone (no evidence) never auto-establishes it as root cause');
  }

  console.log('\n=== 16. No production Morning QC nav destination yet ===');
  {
    const appShellSrc = fs.readFileSync(path.join(V09, 'app', 'ui', 'app-shell.jsx'), 'utf8');
    assert('16', !/morning.?qc/i.test(appShellSrc), 'Active app-shell.jsx contains no Morning QC Room reference (not wired into navigation)');
  }

  console.log('\n=== 17. No inherited scientific formulas duplicated unnecessarily ===');
  {
    const calcFiles = fs.readdirSync(MQC).filter(f => f.endsWith('.js'));
    let duplicatesFormulas = false;
    for (const f of calcFiles) {
      const src = fs.readFileSync(path.join(MQC, f), 'utf8');
      if (/calcSampleSD|calculateClassicalRcv|calcSigma\s*\(/.test(src) && !src.includes('scientificDependencies') && !f.includes('rationale')) {
        // only flag if it looks like a reimplementation (defines the function), not a reference/import
        if (/^function calcSampleSD|^function calculateClassicalRcv|^function calcSigma/m.test(src)) duplicatesFormulas = true;
      }
    }
    assert('17', !duplicatesFormulas, 'No Morning QC module reimplements an inherited scientific formula');
  }

  console.log('\n=== 18. All new Stage 12A unit/path tests pass ===');
  {
    let engineOk = false, pathOk = false;
    try { execSync(`node ${path.join(V09, 'tests', 'morning-qc', 'engine.test.cjs')}`); engineOk = true; } catch (e) { engineOk = false; }
    try { execSync(`node ${path.join(V09, 'tests', 'morning-qc', 'pilot-paths.test.cjs')}`); pathOk = true; } catch (e) { pathOk = false; }
    assert('18a', engineOk, 'Engine unit test subprocess passes');
    assert('18b', pathOk, 'Pilot path test subprocess passes');
  }

  console.log('\n=== 19. No frozen Stage 11C2 assets changed ===');
  assert('19a', unchangedSince('v09/tools/verify-stage11c2-transform.cjs', BASE_REF), 'Stage 11C2 transform verifier unchanged');
  assert('19b', unchangedSince('v09/tools/verify-import-graph.cjs', BASE_REF), 'Stage 11C2 import-graph verifier unchanged');
  assert('19c', unchangedSince('v09/package.json', BASE_REF) || (() => {
    // package.json may only gain new scripts; dependencies must be unchanged
    try {
      const diff = execSync(`git diff ${BASE_REF} -- v09/package.json`, { cwd: ROOT }).toString();
      return !diff.includes('"dependencies"') && !diff.includes('"devDependencies"');
    } catch (e) { return false; }
  })(), 'package.json dependencies/devDependencies unchanged (only new scripts may be added)');
  assert('19d', unchangedSince('v09/package-lock.json', BASE_REF), 'package-lock.json unchanged');

  const total = passed + failed;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Stage 12A Morning QC Foundation Tests: ${passed}/${total} passed, ${failed} failed`);
  console.log('  Artifact class: V09_TEST');
  if (failed > 0) { console.error('STAGE 12A GOVERNANCE TESTS FAILED.'); process.exit(1); }
  console.log('STAGE 12A GOVERNANCE TESTS PASSED.');
  process.exit(0);
}
main().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
