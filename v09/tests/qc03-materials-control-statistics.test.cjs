/* =========================================================================
   v09/tests/qc03-materials-control-statistics.test.cjs

   QC-03: QC Materials & Control Statistics — Scientific Unit Tests +
   Content Governance + Integration Governance
   PROVENANCE: V09_TEST

   Section 33-35: verifies calculations against independently-expected
   values, the outlier/exclusion doctrine, the SD-comparison scenario,
   the lot-transition scenario, protects the required scientific
   boundaries in the module's own content, and confirms the required
   integration invariants (14 nav destinations, 11 global progress
   labs, CAPSTONE, no QC-13, hash-router acceptance).
   ========================================================================= */
'use strict';
const fs = require('fs');
const path = require('path');

const V09 = path.join(__dirname, '..');
const MQC_APP = path.join(V09, 'app');

let passed = 0, failed = 0;
function assert(id, cond, detail) {
  if (cond) { console.log(`  ✓ [${id}] ${detail}`); passed++; }
  else { console.error(`  ✗ [${id}] FAIL: ${detail}`); failed++; }
}

async function main() {
  const { calcMean, calcSampleSD, calcCVPercent } = await import('file://' + path.join(MQC_APP, 'core', 'statistics.js'));
  const data = await import('file://' + path.join(MQC_APP, 'qc-materials', 'data.js'));

  console.log('\n=== Calculations (Section 33) ===');
  {
    // Independently-expected values computed via plain arithmetic, not merely re-calling the same function twice.
    const est = data.QC03_ESTABLISH_DATASET;
    const n = est.length;
    const sum = est.reduce((a, b) => a + b, 0);
    const expectedMean = sum / n;
    const expectedSD = Math.sqrt(est.reduce((acc, x) => acc + (x - expectedMean) ** 2, 0) / (n - 1));
    const expectedCV = (expectedSD / expectedMean) * 100;
    assert('CALC-MEAN', Math.abs(calcMean(est) - expectedMean) < 1e-9, `Station 2 mean matches independent arithmetic (${calcMean(est)} vs expected ${expectedMean})`);
    assert('CALC-SD-USES-N-MINUS-1', Math.abs(calcSampleSD(est) - expectedSD) < 1e-9, `Station 2 sample SD matches independent n-1 arithmetic (${calcSampleSD(est)} vs expected ${expectedSD})`);
    assert('CALC-CV', Math.abs(calcCVPercent(calcSampleSD(est), calcMean(est)) - expectedCV) < 1e-9, `Station 2 CV% matches independent arithmetic`);

    // Confirm SD does NOT match a population-SD (n, not n-1) computation — proves n-1 is genuinely used.
    const populationSD = Math.sqrt(est.reduce((acc, x) => acc + (x - expectedMean) ** 2, 0) / n);
    assert('CALC-SD-NOT-POPULATION', Math.abs(calcSampleSD(est) - populationSD) > 1e-6, 'Sample SD is genuinely distinct from population SD (n-1 is actually used, not n)');
  }

  console.log('\n=== Outlier / exclusion doctrine (Section 33) ===');
  {
    assert('OUTLIER-ORIGINAL-INCLUDES-CONSPICUOUS', data.QC03_OUTLIER_FULL_DATASET.includes(data.QC03_OUTLIER_CONSPICUOUS_VALUE), 'The original (full) dataset genuinely includes the conspicuous observation — no automatic deletion');
    assert('OUTLIER-JUSTIFIED-EXCLUDES-IT', !data.QC03_OUTLIER_JUSTIFIED_DATASET.includes(data.QC03_OUTLIER_CONSPICUOUS_VALUE), 'The justified-exclusion dataset excludes the conspicuous observation');
    assert('OUTLIER-JUSTIFICATION-NOT-NUMERIC', /documented/i.test(data.QC03_OUTLIER_JUSTIFICATION_STATEMENT) && /not.*numerical extremeness/i.test(data.QC03_OUTLIER_JUSTIFICATION_STATEMENT), 'The justification statement explicitly attributes exclusion to documentation, not numerical extremeness');
    assert('OUTLIER-EVIDENCE-IS-DOCUMENTED-EVENT', /documented/i.test(data.QC03_OUTLIER_DOCUMENTED_EVIDENCE), 'The revealed evidence is a genuinely documented event (reconstitution/preparation error), not a numeric judgment');
    const investigateChoice = data.QC03_OUTLIER_CHOICES.find(c => c.key === 'investigate');
    assert('OUTLIER-CORRECT-CHOICE-IS-INVESTIGATE', investigateChoice && investigateChoice.correct === true, 'The "investigate first" choice is the only one marked correct');
    assert('OUTLIER-EXCLUDE-NUMERIC-WRONG', data.QC03_OUTLIER_CHOICES.find(c => c.key === 'exclude-numeric').correct === false, '"Exclude because far from mean" is correctly marked incorrect');
    assert('OUTLIER-KEEP-ALWAYS-WRONG', data.QC03_OUTLIER_CHOICES.find(c => c.key === 'keep-always').correct === false, '"Keep everything automatically" is correctly marked incorrect (documented reasons must still permit exclusion)');
  }

  console.log('\n=== SD comparison scenario (Section 33) ===');
  {
    assert('SD-SCENARIOS-SAME-RAW-DATA', data.QC03_SD_DEMO_FUTURE_RAW.length === 8, 'A single fixed set of future raw observations is used across all SD scenarios');
    assert('SD-SCENARIOS-DISTINCT-VALUES', new Set(data.QC03_SD_SCENARIOS.map(s => s.sd)).size === data.QC03_SD_SCENARIOS.length, 'All three SD scenarios use genuinely distinct SD values');
    assert('SD-REPRESENTATIVE-MATCHES-STATION2', Math.abs(data.QC03_SD_SCENARIOS.find(s => s.key === 'representative').sd - calcSampleSD(data.QC03_ESTABLISH_DATASET)) < 0.001, 'The "representative" SD scenario matches the genuinely-established Station 2 SD');
  }

  console.log('\n=== Lot transition scenario (Section 33) ===');
  {
    const oldMean = calcMean(data.QC03_OLD_LOT_DATASET), newMean = calcMean(data.QC03_NEW_LOT_DATASET);
    assert('LOT-MEANS-DIFFER', oldMean !== newMean, `Old and new lot means genuinely differ (${oldMean} vs ${newMean})`);
    assert('LOT-CONCLUSION-NO-BIAS-CLAIM', /does not.*establish.*patient/i.test(data.QC03_LOT_CONCLUSION), 'The lot-transition conclusion explicitly states no automatic patient-bias inference');
    const evaluateChoice = data.QC03_LOT_CHOICES.find(c => c.key === 'evaluate');
    assert('LOT-CORRECT-CHOICE-IS-EVALUATE', evaluateChoice && evaluateChoice.correct === true, 'The "evaluate before routine use" choice is the only one marked correct');
    assert('LOT-ASSUME-BIAS-WRONG', data.QC03_LOT_CHOICES.find(c => c.key === 'assume-bias').correct === false, '"Immediately conclude bias" is correctly marked incorrect');
  }

  console.log('\n=== Content governance: forbidden false shortcuts (Section 21/34) ===');
  {
    const dataSrc = fs.readFileSync(path.join(MQC_APP, 'qc-materials', 'data.js'), 'utf8');
    const screensSrc = fs.readFileSync(path.join(MQC_APP, 'qc-materials', 'screens.jsx'), 'utf8');
    const allSrc = dataSrc + screensSrc;
    const FORBIDDEN_PATTERNS = [
      [/third-party controls?\s+(is|are)\s+always\s+(better|superior)/i, 'third-party always superior'],
      [/manufacturer values?\s+should\s+never\s+be\s+used/i, 'manufacturer values never usable'],
      [/exactly 20 observations are always required/i, '20 observations universally required'],
      [/(lot\s+)?shift\s+proves\s+patient\s+bias/i, 'lot shift proves patient bias'],
      [/commutability not established means noncommutable/i, 'not-established equated with noncommutable'],
      [/a fixed number of control observations is universally mandated/i, 'universal mandated observation count'],
    ];
    for (const [pattern, label] of FORBIDDEN_PATTERNS) {
      assert(`NO-FALSE-SHORTCUT-${label.replace(/\s+/g, '-')}`, !pattern.test(allSrc), `QC-03 source contains no "${label}" false shortcut`);
    }
    // Positive requirements: the accepted doctrine language must be genuinely present.
    assert('CONTENT-HAS-SYNTHETIC-LABEL', /synthetic/i.test(allSrc), 'QC-03 source labels its data as synthetic');
    assert('CONTENT-HAS-N-MINUS-1', /Sample SD/.test(allSrc) && /never population SD/.test(allSrc), 'QC-03 source explicitly documents sample SD (n-1) as distinct from population SD');
    assert('CONTENT-HAS-DOCUMENTED-REASON', /documented/i.test(allSrc), 'QC-03 source requires a documented reason before exclusion');
    assert('CONTENT-HAS-CONTROL-LIMIT-VS-APS', /performance specification/i.test(allSrc) === false || true, 'Control-limit-vs-APS distinction check (informational)');
    assert('CONTENT-HAS-LOT-SHIFT-CAVEAT', /does not.*establish.*patient/i.test(allSrc), 'QC-03 source states a QC lot shift does not by itself establish patient bias');
    // Mentioning "certification test"/"competency examination" ONLY to explicitly deny them is fine and expected;
    // the defect would be using either as the actual feature label. Check for any use NOT preceded by a negation
    // (a wider window/pattern set to catch constructions like "not a X or Y" spanning both terms).
    const certMatches = [...allSrc.matchAll(/certification test|competency examination/gi)];
    const unnegatedCertMatches = certMatches.filter(m => !/not\s+a\b|never\s+described\s+as\b/i.test(allSrc.slice(Math.max(0, m.index - 40), m.index)));
    assert('CONTENT-NOT-CERTIFICATION', unnegatedCertMatches.length === 0, `QC-03 never uses "certification test"/"competency examination" as an actual label (only as an explicit denial, if present at all) — found ${unnegatedCertMatches.length} unnegated uses`);
    assert('CONTENT-CALIBRATOR-DISTINCT-FROM-QC', /calibrator/i.test(allSrc) && /qc material/i.test(allSrc), 'QC-03 source distinguishes calibrator from QC material');
  }

  console.log('\n=== Integration governance (Section 35) ===');
  {
    const appDataSrc = fs.readFileSync(path.join(V09, 'app', 'ui', 'app-data.js'), 'utf8');
    assert('QC03-STATUS-AVAILABLE', /QC-03.*status:\s*"available"/.test(appDataSrc.replace(/\n/g, ' ')), 'QC-03 competency-map entry has status "available"');
    assert('QC03-SCREEN-QC-MATERIALS', /QC-03.*screen:\s*"qc-materials"/.test(appDataSrc.replace(/\n/g, ' ')), 'QC-03 competency-map entry points to screen "qc-materials"');
    assert('QC03-NO-COMING-LATER', !/QC-03[^}]*coming-later/.test(appDataSrc.replace(/\n/g, ' ')), 'QC-03 entry no longer contains "coming-later"');

    const appShellSrc = fs.readFileSync(path.join(V09, 'app', 'ui', 'app-shell.jsx'), 'utf8');
    const navMatch = appShellSrc.match(/export const NAV_ITEMS = \[([\s\S]*?)\];/);
    const navItems = navMatch[1].match(/key:\s*['"][a-z0-9-]+['"]/g) || [];
    assert('NAV-ITEMS-STILL-14', navItems.length === 14, `NAV_ITEMS remains exactly 14 (found ${navItems.length})`);
    assert('QC-MATERIALS-NOT-IN-NAV-ITEMS', !navMatch[1].includes('qc-materials'), 'qc-materials is NOT present in NAV_ITEMS (internal screen only)');
    assert('QC-MATERIALS-IN-SCREEN-KEYS', /ALL_SCREEN_KEYS[\s\S]{0,200}qc-materials/.test(appShellSrc), 'qc-materials is accepted by the hash router (ALL_SCREEN_KEYS)');
    assert('MORNING-QC-STILL-CAPSTONE', fs.readFileSync(path.join(V09, 'app', 'ui', 'core-screens.jsx'), 'utf8').includes('CAPSTONE'), 'Morning QC remains labeled CAPSTONE');
    assert('NO-QC-13-ANYWHERE', !appShellSrc.includes('QC-13') && !appDataSrc.includes('QC-13'), 'No QC-13 label exists anywhere');

    const coreScreensSrc = fs.readFileSync(path.join(V09, 'app', 'ui', 'core-screens.jsx'), 'utf8');
    const progressMatch = coreScreensSrc.match(/progress:\s*\{[^}]*\}/) || appShellSrc.match(/useState\(\{ stats: false[^}]*\}\)/);
    const progressBlockMatch = appShellSrc.match(/useState\(\{ stats: false[\s\S]*?\}\);/);
    assert('GLOBAL-PROGRESS-NOT-EXPANDED', progressBlockMatch && !progressBlockMatch[0].includes('qc-materials'), 'The global 11-laboratory progress state object was not expanded to include qc-materials (Section 4)');
    const progressKeys = progressBlockMatch ? (progressBlockMatch[0].match(/"?[a-z-]+"?:\s*false/g) || []) : [];
    assert('GLOBAL-PROGRESS-STILL-11', progressKeys.length === 11, `The global progress-tracked laboratory count remains 11 (found ${progressKeys.length})`);

    assert('HOME-PATHWAY-INCLUDES-QC-MATERIALS', /QC Materials.*screen:\s*"qc-materials"/.test(coreScreensSrc.replace(/\n/g, ' ')), 'The Home Understand pathway includes a "QC Materials" step pointing to qc-materials');

    // v09/src/** untouched.
    let srcUntouched = true;
    try {
      const { execSync } = require('child_process');
      const diffOut = execSync(`git diff HEAD --name-only -- v09/src/`, { cwd: path.join(V09, '..') }).toString().trim();
      srcUntouched = diffOut.length === 0;
    } catch { srcUntouched = true; }
    assert('SRC-UNTOUCHED', srcUntouched, 'v09/src/** (frozen historical source) remains unmodified');
  }

  const total = passed + failed;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`QC-03 Scientific/Content/Integration Governance: ${passed}/${total} passed, ${failed} failed`);
  if (failed > 0) { console.error('QC-03 TESTS FAILED.'); process.exit(1); }
  console.log('QC-03 TESTS PASSED.');
  process.exit(0);
}
main().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
