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

  console.log('\n=== 20. Corrective-closure: panel/evidence availability enforcement ===');
  {
    const premature = applyAction(pilots[0], createInitialState(pilots[0]), { type: 'INSPECT_PANEL', panelId: 'panel-reagent-lot' });
    assert('20a', premature.error !== null, 'Panel gated behind CHARACTERISATION cannot be inspected from BRIEFING');
    const prematureEv = applyAction(pilots[0], createInitialState(pilots[0]), { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-old-lot-repeat' });
    assert('20b', prematureEv.error !== null, 'Evidence gated behind REPEAT_QC cannot be obtained prematurely');
  }

  console.log('\n=== 21. Corrective-closure: decision opportunities affect engine classifications ===');
  {
    const s = createInitialState(pilots[0]);
    const acked = applyAction(pilots[0], s, { type: 'ACKNOWLEDGE_SIGNAL' });
    const out = applyAction(pilots[0], acked.state, { type: 'CONTINUE_ANALYSIS', decisionId: 'dec-containment', optionId: 'opt-continue' });
    assert('21', out.severity === 'UNSAFE' && out.outcomeAppropriate === false, 'Case-authored decisionId/optionId genuinely drives engine severity/outcomeAppropriate');
  }

  console.log('\n=== 22. Corrective-closure: Pilot 2 dismissal is genuinely UNSUPPORTED ===');
  {
    const r = replay(pilots[1], [
      { type: 'ACKNOWLEDGE_SIGNAL' },
      { type: 'INSPECT_PANEL', panelId: 'panel-pbrtqc' },
      { type: 'INSPECT_PANEL', panelId: 'panel-qc-history' },
      { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-iqc-stable' },
      { type: 'DOCUMENT', decisionId: 'dec-take-seriously', optionId: 'opt-dismiss', fields: {} },
    ]);
    const last = r.trace[r.trace.length - 1];
    assert('22', last.severity === 'UNSUPPORTED' && last.outcomeAppropriate === false, 'Pilot 2\'s dismissal path produces an ACTUAL engine-recorded UNSUPPORTED decision');
  }

  console.log('\n=== 23. Corrective-closure: Pilot 3 unsupported analytical hold is classified ===');
  {
    const r = replay(pilots[2], [
      { type: 'ACKNOWLEDGE_SIGNAL' },
      { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-analytical-error', decisionId: 'dec-interpretation', optionId: 'opt-assume-error' },
    ]);
    const last = r.trace[r.trace.length - 1];
    assert('23', last.severity === 'UNSUPPORTED' && last.outcomeAppropriate === false, 'Pilot 3\'s unsupported analytical-error assumption is engine-classified');
  }

  console.log('\n=== 24. Corrective-closure: patient-impact terminal state requires evidence ===');
  {
    let s = createInitialState(pilots[0]);
    let acked = applyAction(pilots[0], s, { type: 'ACKNOWLEDGE_SIGNAL' });
    let o1 = applyAction(pilots[0], acked.state, { type: 'REVIEW_PATIENT_IMPACT', targetState: 'INDICATED' });
    let o2 = applyAction(pilots[0], o1.state, { type: 'REVIEW_PATIENT_IMPACT', targetState: 'PENDING' });
    let o3 = applyAction(pilots[0], o2.state, { type: 'REVIEW_PATIENT_IMPACT', targetState: 'AFFECTED_RESULT_SET_IDENTIFIED' });
    assert('24', o3.error !== null && o3.error.includes('required evidence'), `Terminal patient-impact state cannot be declared without the case-required evidence (found error: ${o3.error})`);
  }

  console.log('\n=== 25. Corrective-closure: failed verification does not produce a misleading ready/resume state ===');
  {
    let s = createInitialState(pilots[0]);
    let acked = applyAction(pilots[0], s, { type: 'ACKNOWLEDGE_SIGNAL' });
    let held = applyAction(pilots[0], acked.state, { type: 'HOLD_RESULTS' });
    let failedVerify = applyAction(pilots[0], held.state, { type: 'VERIFY_RECOVERY' });
    assert('25a', failedVerify.state.serviceState === 'HELD', 'Failed verification remains HELD, does not advance to READY_FOR_VERIFICATION');
    assert('25b', failedVerify.state.phase === 'INVESTIGATION', 'Failed verification returns phase to INVESTIGATION');
  }

  console.log('\n=== 26. Corrective-closure: signal explanation separate from analytical root cause ===');
  {
    assert('26a', pilots[1].groundTruth.rootCauseEstablished === false && pilots[1].groundTruth.signalExplanationEstablished === true,
      'Pilot 2: rootCauseEstablished=false while signalExplanationEstablished=true — genuinely independent');
    const badCombo = JSON.parse(JSON.stringify(pilots[1]));
    badCombo.groundTruth.rootCauseEstablished = true;
    assert('26b', validateCase(badCombo).valid === false, 'Validator rejects an analytical root cause without an established disturbance');
  }

  console.log('\n=== 27. Corrective-closure: RCV case does not claim biological etiology ===');
  {
    const gt = pilots[2].groundTruth;
    assert('27a', gt.rootCauseEstablished === false, 'Pilot 3 does not claim an analytical root cause');
    assert('27b', !/genuine biological/i.test(gt.signalExplanationDescription || ''), 'Pilot 3\'s signal explanation does not assert a "genuine biological" cause as fact');
    assert('27c', /does not establish/i.test(gt.signalExplanationDescription || ''), 'Pilot 3\'s signal explanation explicitly states what RCV does NOT establish');
    const rcvEvidence = pilots[2].evidence.find(e => e.id === 'ev-rcv-calculation');
    assert('27d', /does not|not establish/i.test(rcvEvidence.interpretationLimits), 'RCV evidence documents its own interpretation limits');
  }

  console.log('\n=== 28. Corrective-closure: confidence linked to the intended decision ===');
  {
    const { computeScoringProfile } = await import('file://' + path.join(MQC, 'scoring-model.js'));
    let s = createInitialState(pilots[0]);
    let onlyConf = applyAction(pilots[0], s, { type: 'RECORD_CONFIDENCE', decisionId: 'dec-disposition', confidence: 'HIGH' });
    const profile = computeScoringProfile(pilots[0], onlyConf.state);
    assert('28', profile.METACOGNITIVE_CALIBRATION === null, 'Confidence naming a decision never actually made is excluded from calibration');
  }

  console.log('\n=== 29. Corrective-closure: Sigma 0.97 has explicit CV=2% provenance ===');
  {
    const stats = await import('file://' + path.join(V09, 'app', 'core', 'statistics.js'));
    const sigmaCtx = pilots[0].labContext.sigmaContext;
    assert('29a', sigmaCtx && sigmaCtx.cvaUsedForSigma === 2, 'Pilot 1 labContext.sigmaContext explicitly declares CV=2% as the Sigma input');
    const sigma = stats.calcSigma(9, 7.0667, 2);
    assert('29b', Math.abs(sigma.value - 0.9667) < 0.001 && sigma.valid === true, `calcSigma(9, 7.0667, 2) reproduces 0.9667 exactly (found ${sigma.value})`);
  }

  console.log('\n=== 30. All 3 revised pilot cases validate ===');
  {
    const results = pilots.map(p => validateCase(p));
    assert('30', results.every(r => r.valid === true), `All 3 revised pilots validate cleanly (errors: ${JSON.stringify(results.map(r => r.errors))})`);
  }

  console.log('\n=== 31. FINAL CLOSURE: panel-derived evidence cannot bypass panel inspection ===');
  {
    let s1 = applyAction(pilots[0], createInitialState(pilots[0]), { type: 'ACKNOWLEDGE_SIGNAL' });
    let s2 = applyAction(pilots[0], s1.state, { type: 'HOLD_RESULTS' });
    let s3 = applyAction(pilots[0], s2.state, { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-lot' });
    const prematureEv = applyAction(pilots[0], s3.state, { type: 'REQUEST_EVIDENCE', evidenceId: 'ev-lot-timing' });
    assert('31', prematureEv.error !== null, 'Panel-derived evidence (ev-lot-timing) cannot be obtained without inspecting its source panel first');
  }

  console.log('\n=== 32. FINAL CLOSURE: DOCUMENT at briefing cannot unlock later panels ===');
  {
    const s = createInitialState(pilots[0]);
    const out = applyAction(pilots[0], s, { type: 'DOCUMENT', fields: {} });
    assert('32', out.error !== null && s.maxPhaseIndexReached === 0, 'DOCUMENT at pristine BRIEFING is rejected and does not advance maxPhaseIndexReached');
  }

  console.log('\n=== 33. FINAL CLOSURE: premature patient-impact action cannot unlock late panels ===');
  {
    const s = createInitialState(pilots[0]);
    const out = applyAction(pilots[0], s, { type: 'REVIEW_PATIENT_IMPACT', targetState: 'INDICATED' });
    assert('33', out.error !== null, 'REVIEW_PATIENT_IMPACT at pristine BRIEFING is rejected');
  }

  console.log('\n=== 34. FINAL CLOSURE: decision availableFromPhase is enforced ===');
  {
    let acked = applyAction(pilots[0], createInitialState(pilots[0]), { type: 'ACKNOWLEDGE_SIGNAL' });
    const tooEarly = applyAction(pilots[0], acked.state, { type: 'RESUME_SERVICE', decisionId: 'dec-disposition', optionId: 'opt-resume-verified' });
    assert('34', tooEarly.error !== null, 'dec-disposition (availableFromPhase=VERIFICATION) cannot execute before that phase is reached, even with the correct action type');
  }

  console.log('\n=== 35. FINAL CLOSURE: wrong action type cannot execute a decision option ===');
  {
    let acked = applyAction(pilots[0], createInitialState(pilots[0]), { type: 'ACKNOWLEDGE_SIGNAL' });
    const wrongType = applyAction(pilots[0], acked.state, { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-lot', decisionId: 'dec-containment', optionId: 'opt-hold' });
    assert('35', wrongType.error !== null, 'dec-containment/opt-hold (actionType=HOLD_RESULTS) cannot be executed via FORM_HYPOTHESIS');
  }

  console.log('\n=== 36. FINAL CLOSURE: case-authored decision category survives into scoring ===');
  {
    let acked = applyAction(pilots[0], createInitialState(pilots[0]), { type: 'ACKNOWLEDGE_SIGNAL' });
    const out = applyAction(pilots[0], acked.state, { type: 'HOLD_RESULTS', decisionId: 'dec-containment', optionId: 'opt-hold' });
    const { evaluateDecision } = await import('file://' + path.join(MQC, 'decision-model.js'));
    const evaluated = evaluateDecision(out.state.actionHistory[out.state.actionHistory.length - 1]);
    assert('36', evaluated.category === 'CONTAINMENT', `Engine-recorded decisionCategory (CONTAINMENT) survives into decision-model.js evaluation (found ${evaluated.category})`);
  }

  console.log('\n=== 37. All four outcome/reasoning combinations are represented ===');
  {
    const { syntheticFixtureCase } = await import('file://' + path.join(MQC, 'cases', 'synthetic-fixture.js'));
    assert('37a', validateCase(syntheticFixtureCase).valid === true, 'Synthetic fixture (used for the 4-combination matrix) validates cleanly');
    let acked = applyAction(syntheticFixtureCase, createInitialState(syntheticFixtureCase), { type: 'ACKNOWLEDGE_SIGNAL' });
    let charInspected = applyAction(syntheticFixtureCase, acked.state, { type: 'INSPECT_PANEL', panelId: 'panel-a' });
    const tt = applyAction(syntheticFixtureCase, charInspected.state, { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-x', decisionId: 'dec-tt', optionId: 'opt-tt' });
    const hypFirst = applyAction(syntheticFixtureCase, charInspected.state, { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-x' });
    const tf = applyAction(syntheticFixtureCase, hypFirst.state, { type: 'APPLY_INTERVENTION', decisionId: 'dec-tf', optionId: 'opt-tf', description: 'x' });
    const ft = applyAction(syntheticFixtureCase, acked.state, { type: 'CONTINUE_ANALYSIS', decisionId: 'dec-ft', optionId: 'opt-ft' });
    const ff = applyAction(syntheticFixtureCase, acked.state, { type: 'DOCUMENT', decisionId: 'dec-ff', optionId: 'opt-ff', fields: {} });
    assert('37b', tt.error === null && tt.outcomeAppropriate === true && tt.severity !== 'CRITICAL_UNSAFE' && tt.severity !== 'UNSAFE' && tt.severity !== 'UNSUPPORTED', `Combination (true,true) represented (error: ${tt.error})`);
    assert('37c', tf.error === null && tf.outcomeAppropriate === true && tf.severity === 'UNSUPPORTED', `Combination (true,false) represented (error: ${tf.error})`);
    assert('37d', ft.outcomeAppropriate === false && ft.severity !== 'CRITICAL_UNSAFE' && ft.severity !== 'UNSAFE' && ft.severity !== 'UNSUPPORTED', 'Combination (false,true) represented');
    assert('37e', ff.outcomeAppropriate === false && ff.severity === 'CRITICAL_UNSAFE', 'Combination (false,false) represented');
  }

  console.log('\n=== 38. Confidence uses outcome correctness, not reasoning support ===');
  {
    const { syntheticFixtureCase } = await import('file://' + path.join(MQC, 'cases', 'synthetic-fixture.js'));
    const { computeScoringProfile } = await import('file://' + path.join(MQC, 'scoring-model.js'));
    let acked = applyAction(syntheticFixtureCase, createInitialState(syntheticFixtureCase), { type: 'ACKNOWLEDGE_SIGNAL' });
    const ft = applyAction(syntheticFixtureCase, acked.state, { type: 'CONTINUE_ANALYSIS', decisionId: 'dec-ft', optionId: 'opt-ft' }); // outcomeAppropriate=false, reasoningSupported=true
    const withConf = applyAction(syntheticFixtureCase, ft.state, { type: 'RECORD_CONFIDENCE', decisionEventId: ft.decisionEventId, confidence: 'LOW' });
    const profile = computeScoringProfile(syntheticFixtureCase, withConf.state);
    assert('38', profile.METACOGNITIVE_CALIBRATION === 'STRONG', `LOW confidence correctly calibrated against outcomeAppropriate=false, using decisionEventId identity (found ${profile.METACOGNITIVE_CALIBRATION})`);
  }

  console.log('\n=== 39. Unknown/unmade decision-event confidence is rejected ===');
  {
    const s = createInitialState(pilots[0]);
    const out = applyAction(pilots[0], s, { type: 'RECORD_CONFIDENCE', decisionEventId: 'NEVER_EXECUTED#1', confidence: 'HIGH' });
    assert('39', out.error !== null, 'RECORD_CONFIDENCE for a decisionEventId never executed in this trace is rejected outright');
  }

  console.log('\n=== ACCEPTANCE CLOSURE 1: ACK + DOCUMENT does not unlock future panels ===');
  {
    const { deriveUnlockedPhaseIndex } = await import('file://' + path.join(MQC, 'engine.js'));
    let acked = applyAction(pilots[0], createInitialState(pilots[0]), { type: 'ACKNOWLEDGE_SIGNAL' });
    let doc = applyAction(pilots[0], acked.state, { type: 'DOCUMENT', fields: {} });
    const blocked = applyAction(pilots[0], doc.state, { type: 'INSPECT_PANEL', panelId: 'panel-reagent-lot' });
    assert('43', doc.error === null && blocked.error !== null, 'ACK + DOCUMENT succeeds administratively but does NOT unlock CHARACTERISATION-gated panels');
  }

  console.log('\n=== ACCEPTANCE CLOSURE 2: ACK + REVIEW_PATIENT_IMPACT does not unlock future panels ===');
  {
    let acked = applyAction(pilots[0], createInitialState(pilots[0]), { type: 'ACKNOWLEDGE_SIGNAL' });
    let pi = applyAction(pilots[0], acked.state, { type: 'REVIEW_PATIENT_IMPACT', targetState: 'INDICATED' });
    const blocked = applyAction(pilots[0], pi.state, { type: 'INSPECT_PANEL', panelId: 'panel-calibration' });
    assert('44', pi.error === null && blocked.error !== null, 'ACK + REVIEW_PATIENT_IMPACT succeeds administratively but does NOT unlock CHARACTERISATION-gated panels');
  }

  console.log('\n=== ACCEPTANCE CLOSURE 3: ACK + FORM_HYPOTHESIS cannot game the progression high-water mark ===');
  {
    let acked = applyAction(pilots[0], createInitialState(pilots[0]), { type: 'ACKNOWLEDGE_SIGNAL' });
    const prematureHyp = applyAction(pilots[0], acked.state, { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-lot' });
    assert('45', prematureHyp.error !== null, 'FORM_HYPOTHESIS immediately after ACK (no genuine CHARACTERISATION progress) is rejected as premature');
  }

  console.log('\n=== ACCEPTANCE CLOSURE 4: Pilot 2 disposition cannot execute before genuine EVIDENCE_SELECTION ===');
  {
    let acked = applyAction(pilots[1], createInitialState(pilots[1]), { type: 'ACKNOWLEDGE_SIGNAL' });
    let doc = applyAction(pilots[1], acked.state, { type: 'DOCUMENT', fields: {} });
    const prematureDisposition = applyAction(pilots[1], doc.state, { type: 'DOCUMENT', decisionId: 'dec-disposition', optionId: 'opt-continue-documented', fields: {} });
    assert('46', prematureDisposition.error !== null, 'dec-disposition (requires EVIDENCE_SELECTION) rejected with zero evidence obtained, even after generic DOCUMENT');
  }

  console.log('\n=== ACCEPTANCE CLOSURE 5: decision phase gating uses the genuine progression authority ===');
  {
    const { deriveUnlockedPhaseIndex } = await import('file://' + path.join(MQC, 'engine.js'));
    let acked = applyAction(pilots[0], createInitialState(pilots[0]), { type: 'ACKNOWLEDGE_SIGNAL' });
    assert('47', deriveUnlockedPhaseIndex(acked.state) === states.SIMULATION_PHASES.indexOf('SIGNAL_RECOGNITION'), 'Genuinely-unlocked index reflects only real milestones, consulted directly by decision gating (not a mutable action-driven counter)');
  }

  console.log('\n=== ACCEPTANCE CLOSURE 6-9: decisionEventId architecture and revision ===');
  {
    let acked = applyAction(pilots[1], createInitialState(pilots[1]), { type: 'ACKNOWLEDGE_SIGNAL' });
    let inspected = applyAction(pilots[1], acked.state, { type: 'INSPECT_PANEL', panelId: 'panel-pbrtqc' });
    const first = applyAction(pilots[1], inspected.state, { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-analytical', decisionId: 'dec-take-seriously', optionId: 'opt-investigate' });
    assert('48', first.decisionEventId === 'dec-take-seriously#1', 'Executed decision receives a stable decisionEventId');
    const revised = applyAction(pilots[1], first.state, { type: 'DOCUMENT', decisionId: 'dec-take-seriously', optionId: 'opt-dismiss', fields: {} });
    assert('49', revised.decisionEventId === 'dec-take-seriously#2' && revised.decisionEventId !== first.decisionEventId, 'Revised decision under the same decisionId receives a DISTINCT decisionEventId');

    const { computeScoringProfile } = await import('file://' + path.join(MQC, 'scoring-model.js'));
    const confFirst = applyAction(pilots[1], revised.state, { type: 'RECORD_CONFIDENCE', decisionEventId: first.decisionEventId, confidence: 'HIGH' });
    const profileFirst = computeScoringProfile(pilots[1], confFirst.state);
    assert('50', profileFirst.METACOGNITIVE_CALIBRATION === 'STRONG', 'Calibration evaluates the EXACT referenced decision event (first, correct: HIGH confidence well-calibrated)');

    const confRevised = applyAction(pilots[1], revised.state, { type: 'RECORD_CONFIDENCE', decisionEventId: revised.decisionEventId, confidence: 'HIGH' });
    const profileRevised = computeScoringProfile(pilots[1], confRevised.state);
    assert('51', profileRevised.METACOGNITIVE_CALIBRATION !== 'STRONG', 'HIGH confidence in an INCORRECT revised decision does NOT score STRONG merely because the earlier decision was correct (calibration does not conflate decision events)');
  }

  console.log('\n=== 40. Zero-inspection state cannot produce STRONG Evidence Selection ===');
  {
    const { computeScoringProfile } = await import('file://' + path.join(MQC, 'scoring-model.js'));
    const profile = computeScoringProfile(pilots[0], createInitialState(pilots[0]));
    assert('40', profile.EVIDENCE_SELECTION !== 'STRONG', `Pristine state does not score STRONG on EVIDENCE_SELECTION (found ${profile.EVIDENCE_SELECTION})`);
  }

  console.log('\n=== 41. Impossible CHECK_EQA prerequisite (no EQA panel) is rejected ===');
  {
    const broken = JSON.parse(JSON.stringify(pilots[0])); // Pilot 1 has no EQA panel
    broken.evidence[0].availableOnlyAfterActionType = 'CHECK_EQA';
    assert('41', validateCase(broken).valid === false, 'CHECK_EQA prerequisite rejected when no EQA panel exists in the case');
  }

  console.log('\n=== 42. Failed-verification phase regression governed by the declared return model ===');
  {
    const { canReturnToPhase } = await import('file://' + path.join(MQC, 'engine.js'));
    assert('42a', canReturnToPhase('VERIFICATION', 'INVESTIGATION') === true, 'canReturnToPhase consults the declared PHASE_ALLOWS_RETURN_TO table');
    let acked = applyAction(pilots[0], createInitialState(pilots[0]), { type: 'ACKNOWLEDGE_SIGNAL' });
    let held = applyAction(pilots[0], acked.state, { type: 'HOLD_RESULTS' });
    let failedVerify = applyAction(pilots[0], held.state, { type: 'VERIFY_RECOVERY' });
    assert('42b', failedVerify.state.phase === 'INVESTIGATION' && failedVerify.state.serviceState === 'HELD', 'Failed verification regresses to INVESTIGATION while remaining HELD, per the declared return model');
  }

  const total = passed + failed;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Stage 12A Morning QC Foundation Tests: ${passed}/${total} passed, ${failed} failed`);
  console.log('  Artifact class: V09_TEST');
  if (failed > 0) { console.error('STAGE 12A GOVERNANCE TESTS FAILED.'); process.exit(1); }
  console.log('STAGE 12A GOVERNANCE TESTS PASSED.');
  process.exit(0);
}
main().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
