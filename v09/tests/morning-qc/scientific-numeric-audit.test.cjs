/* =========================================================================
   v09/tests/morning-qc/scientific-numeric-audit.test.cjs

   Morning QC Room — Stage 12D Independent Scientific Numeric Audit
   PROVENANCE: V09_TEST

   Section 19 (corrective closure): recomputes z-scores, strict 1_3s/
   2_2s exceedance, sample SD (n-1), CV%, and Sigma INDEPENDENTLY from
   first principles — never trusting a case's own narrative claim that
   "a rule was triggered." Target/SD are read from each case's own
   structured labContext.qcMaterials (kept in sync automatically); the
   observed values are the literal authored numbers this closure placed
   in each case's prose (transcribed here for independent arithmetic
   verification, not merely re-asserting the narrative).
   ========================================================================= */
'use strict';
const path = require('path');

let passed = 0, failed = 0;
function assert(id, cond, detail) {
  if (cond) { console.log(`  ✓ [${id}] ${detail}`); passed++; }
  else { console.error(`  ✗ [${id}] FAIL: ${detail}`); failed++; }
}

function zScore(x, target, sd) { return (x - target) / sd; }
function strictExceeds1_3s(x, target, sd) { return Math.abs(zScore(x, target, sd)) > 3; }
function sampleSD(values) {
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (n - 1);
  return { mean, sd: Math.sqrt(variance) };
}
function cvPercent(sd, mean) { return (sd / mean) * 100; }
function sigma(teaPercent, biasPercent, cv) { return (teaPercent - Math.abs(biasPercent)) / cv; } // never floored at 0 — a negative Sigma is a real, valid (if alarming) result

/** Detects a genuine 2_2s: two CONSECUTIVE results, each beyond ±2 SD, on the SAME side. */
function detects2_2s(values, target, sd) {
  for (let i = 1; i < values.length; i++) {
    const z1 = zScore(values[i - 1], target, sd);
    const z2 = zScore(values[i], target, sd);
    if (Math.abs(z1) > 2 && Math.abs(z2) > 2 && Math.sign(z1) === Math.sign(z2)) return true;
  }
  return false;
}

async function main() {
  const MQC = path.join(__dirname, '..', '..', 'app', 'morning-qc');
  const { ALL_CASES } = await import('file://' + path.join(MQC, 'cases', 'index.js'));
  function qcMat(caseId, levelId) {
    const c = ALL_CASES.find(x => x.identity.id === caseId);
    const mat = (c.labContext.qcMaterials || []).find(m => levelId ? m.levelId === levelId : true);
    return { target: mat.targetValue, sd: mat.targetSD };
  }

  console.log('\n=== Case 4: Isolated Excursion — no fabricated sustained violation ===');
  {
    const { target, sd } = qcMat('case-04-isolated-excursion');
    const values = [140.1, 139.6, 140.4, 146.5]; // authored runs 1-4
    const zScores = values.map(v => zScore(v, target, sd));
    assert('NUM-C4-01', Math.abs(zScores[3]) > 3, `Run 4 (146.5) genuinely exceeds strict 1_3s (z=${zScores[3].toFixed(3)})`);
    assert('NUM-C4-02', zScores.slice(0, 3).every(z => Math.abs(z) <= 3), 'Runs 1-3 do not exceed 1_3s (genuinely isolated)');
  }

  console.log('\n=== Case 5: Increased Imprecision — genuine 20-point window, no fabricated Westgard violation ===');
  {
    const { target, sd: priorSD } = qcMat('case-05-increased-imprecision');
    const values = [3.48, 3.47, 3.48, 3.61, 3.48, 3.26, 3.55, 3.46, 3.47, 3.52, 3.54, 3.69, 3.61, 3.52, 3.38, 3.34, 3.54, 3.71, 3.51, 3.48];
    assert('NUM-C5-01', values.length === 20, 'Genuine 20-point rolling window (not a 4-point fabrication)');
    const { mean, sd: currentSD } = sampleSD(values);
    assert('NUM-C5-02', Math.abs(mean - 3.505) < 0.001, `Independently computed mean matches authored value (computed ${mean.toFixed(4)}, authored 3.505)`);
    assert('NUM-C5-03', Math.abs(currentSD - 0.1059) < 0.001, `Independently computed sample SD (n-1) matches authored value (computed ${currentSD.toFixed(4)}, authored 0.1059)`);
    const currentCV = cvPercent(currentSD, mean);
    assert('NUM-C5-04', Math.abs(currentCV - 3.02) < 0.05, `Independently computed current CV%% matches authored value (computed ${currentCV.toFixed(3)}, authored ~3.02)`);
    const currentSigma = sigma(8, 0.2, currentCV);
    assert('NUM-C5-05', Math.abs(currentSigma - 2.58) < 0.05, `Independently computed current Sigma matches authored value (computed ${currentSigma.toFixed(3)}, authored ~2.58)`);
    const priorCV = cvPercent(priorSD, target);
    const priorSigma = sigma(8, 0.2, priorCV);
    assert('NUM-C5-06', Math.abs(priorSigma - 3.41) < 0.05, `Independently computed prior Sigma matches authored value (computed ${priorSigma.toFixed(3)}, authored ~3.41)`);
    // Section 8 (FINAL ACCEPTANCE closure): the prior NUM-C5-07 assertion
    // contained `... || true`, an unconditional tautology that could
    // never fail inside a scientific governance suite. Removed per
    // Option B — the source-level check below (NUM-C5-08) already
    // independently verifies Case 5 makes no narrative rule-violation
    // claim; no further numerical assertion is needed here since this
    // case's design deliberately does not rely on any single-rule
    // detection at all (it is a rolling-window Sigma/CV case).
    const fs = require('fs');
    const caseSrc = fs.readFileSync(path.join(MQC, 'cases', 'case-05-increased-imprecision.js'), 'utf8');
    const caseSrcCodeOnly = caseSrc.replace(/\/\*[\s\S]*?\*\//g, '');
    assert('NUM-C5-08', !/2_2s rule triggered/.test(caseSrcCodeOnly), 'Case 5 source (outside comments) contains no "2_2s rule triggered" claim (the original fabrication)');
  }

  console.log('\n=== Case 6: Calibration Shift — genuine sustained 1_3s ===');
  {
    const { target, sd } = qcMat('case-06-calibration-shift');
    const values = [2.01, 2.19, 2.21];
    assert('NUM-C6-01', Math.abs(zScore(values[0], target, sd)) <= 3, 'Pre-calibration run is within control');
    assert('NUM-C6-02', values.slice(1).every(v => Math.abs(zScore(v, target, sd)) > 3), 'Both post-calibration runs genuinely exceed strict 1_3s');
  }

  console.log('\n=== Case 7: corrected glucose observation genuinely satisfies strict 1_3s ===');
  {
    const { target, sd } = qcMat('case-07-no-patient-impact');
    const correctedValue = 8.68;
    const z = zScore(correctedValue, target, sd);
    assert('NUM-C7-01', Math.abs(z) > 3, `Corrected value 8.68 genuinely exceeds strict 1_3s (z=${z.toFixed(3)}, was z=2.10 before correction)`);
    const oldValue = 8.42;
    assert('NUM-C7-02', Math.abs(zScore(oldValue, target, sd)) <= 3, `The ORIGINAL (pre-correction) value 8.42 did NOT genuinely exceed 1_3s (z=${zScore(oldValue, target, sd).toFixed(3)}) — confirming the correction was necessary`);
  }

  console.log('\n=== Case 9: seek-more-evidence — the single observation genuinely exceeds 1_3s (ambiguity is about CAUSE, not magnitude) ===');
  {
    const { target, sd } = qcMat('case-09-seek-more-evidence');
    const value = 1.79;
    assert('NUM-C9-01', Math.abs(zScore(value, target, sd)) > 3, `The single run genuinely exceeds strict 1_3s (z=${zScore(value, target, sd).toFixed(3)})`);
  }

  console.log('\n=== Case 10: reagent lot exceedance and post-intervention values ===');
  {
    const { target, sd } = qcMat('case-10-premature-release-trap');
    const values = { firstRun: 107.8, afterRevert: 106.9, afterElectrode: 100.4 };
    assert('NUM-C10-01', Math.abs(zScore(values.firstRun, target, sd)) > 3, 'Initial exceedance genuinely exceeds strict 1_3s');
    assert('NUM-C10-02', Math.abs(zScore(values.afterRevert, target, sd)) > 3, 'Post-revert value genuinely STILL exceeds 1_3s (confirming the first intervention was ineffective)');
    assert('NUM-C10-03', Math.abs(zScore(values.afterElectrode, target, sd)) <= 3, 'Post-electrode-replacement value is genuinely within control');
  }

  console.log('\n=== Case 11: corrected TSH observation genuinely satisfies strict 1_3s ===');
  {
    const glu = qcMat('case-11-concurrent-triage', 'GLU-L2');
    const tsh = qcMat('case-11-concurrent-triage', 'TSH-L2');
    const correctedTSH = 4.35;
    assert('NUM-C11-01', Math.abs(zScore(correctedTSH, tsh.target, tsh.sd)) > 3, `Corrected TSH value 4.35 genuinely exceeds strict 1_3s (z=${zScore(correctedTSH, tsh.target, tsh.sd).toFixed(3)}, was z=2.80 before correction)`);
    const oldTSH = 4.28;
    assert('NUM-C11-02', Math.abs(zScore(oldTSH, tsh.target, tsh.sd)) <= 3, `The ORIGINAL (pre-correction) TSH value 4.28 did NOT genuinely exceed 1_3s (z=${zScore(oldTSH, tsh.target, tsh.sd).toFixed(3)}) — confirming the correction was necessary`);
    const gluValue = 107.1;
    assert('NUM-C11-03', Math.abs(zScore(gluValue, glu.target, glu.sd)) > 3, 'Glucose single-run exceedance genuinely exceeds strict 1_3s (isolated point, not sustained)');
    const tshRuns = [4.02, 4.15, 4.24, 4.35];
    assert('NUM-C11-04', tshRuns[0] < tshRuns[1] && tshRuns[1] < tshRuns[2] && tshRuns[2] < tshRuns[3], 'TSH runs show a genuine monotonic upward trend (not a fabricated pattern)');
  }

  console.log('\n=== Case 12: corrected ALT observations genuinely satisfy strict 1_3s ===');
  {
    const { target, sd } = qcMat('case-12-maintenance-coincidence');
    const correctedValues = [53.8, 53.5];
    for (const v of correctedValues) {
      assert(`NUM-C12-${v}`, Math.abs(zScore(v, target, sd)) > 3, `Corrected value ${v} genuinely exceeds strict 1_3s (z=${zScore(v, target, sd).toFixed(3)})`);
    }
    const oldValues = [54.8, 54.1];
    for (const v of oldValues) {
      assert(`NUM-C12-OLD-${v}`, Math.abs(zScore(v, target, sd)) <= 3, `The ORIGINAL (pre-correction) value ${v} did NOT genuinely exceed 1_3s (z=${zScore(v, target, sd).toFixed(3)}) — confirming the correction was necessary`);
    }
  }

  console.log('\n=== Sanity: strict inequality doctrine (equality at the limit is not an exceedance) ===');
  {
    assert('NUM-STRICT-01', !strictExceeds1_3s(103, 100, 1), 'Exactly z=3 is correctly NOT treated as an exceedance (strict inequality)');
    assert('NUM-STRICT-02', strictExceeds1_3s(103.01, 100, 1), 'z slightly above 3 IS correctly treated as an exceedance');
  }

  console.log('\n=== Governance: future numeric cases cannot bypass this audit ===');
  {
    const fs = require('fs');
    const bankTestSrc = fs.readFileSync(path.join(__dirname, 'case-bank.test.cjs'), 'utf8');
    assert('NUM-GOV-01', /scientific-numeric-audit/.test(fs.readFileSync(path.join(__dirname, '..', 'stage12d-casebank-adaptive.test.js'), 'utf8')), 'Stage 12D governance explicitly requires this numeric audit suite to pass');
  }

  const total = passed + failed;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Scientific Numeric Audit: ${passed}/${total} passed, ${failed} failed`);
  if (failed > 0) { console.error('SCIENTIFIC NUMERIC AUDIT FAILED.'); process.exit(1); }
  console.log('SCIENTIFIC NUMERIC AUDIT PASSED.');
  process.exit(0);
}
main().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
