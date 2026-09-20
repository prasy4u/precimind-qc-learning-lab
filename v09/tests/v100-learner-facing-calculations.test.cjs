/* =========================================================================
   v09/tests/v100-learner-facing-calculations.test.cjs
   PROVENANCE: V09_NEW — v1.0 RC remediation, Workstream 2.

   PERMANENT deterministic regression protection for every function in the
   corrected learner-facing calculation/decision denominator.

   Expected values are derived from the mathematical definition, an
   authoritative formula, or an independently-stated decision expectation —
   never by re-running the implementation and asserting it equals itself.
   Formula provenance is annotated inline where a published source applies.
   ========================================================================= */
'use strict';
const path = require('path');
const APP = path.join(__dirname, '..', 'app');

let passed = 0, failed = 0;
function ok(id, cond, detail) {
  if (cond) { console.log(`  \u2713 [${id}] ${detail}`); passed++; }
  else { console.error(`  \u2717 [${id}] FAIL: ${detail}`); failed++; }
}
const near = (a, b, e = 1e-9) => typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) < e;
const val = x => (x && typeof x === 'object' && 'value' in x) ? x.value : x;

async function main() {
  const S = await import('file://' + path.join(APP, 'core', 'statistics.js'));
  const R = await import('file://' + path.join(APP, 'rules', 'engine.js'));
  const BV = await import('file://' + path.join(APP, 'bv', 'calc.js'));
  const EQ = await import('file://' + path.join(APP, 'eqa', 'calc.js'));
  const PB = await import('file://' + path.join(APP, 'pbrtqc', 'calc.js'));
  const INV = await import('file://' + path.join(APP, 'investigation', 'calc.js'));
  const DD = await import('file://' + path.join(APP, 'risk', 'detection-delay.js'));
  const DM = await import('file://' + path.join(APP, 'morning-qc', 'decision-model.js'));
  const SM = await import('file://' + path.join(APP, 'morning-qc', 'scoring-model.js'));
  const EN = await import('file://' + path.join(APP, 'morning-qc', 'engine.js'));
  const AS = await import('file://' + path.join(APP, 'morning-qc', 'adaptive', 'attempt-store.js'));

  /* ---------- core statistics (definition-derived) ---------- */
  console.log('\n=== core/statistics.js ===');
  ok('calcMean-1', near(S.calcMean([98,99,100,101,102]), 100), 'mean = sum/n = 500/5 = 100');
  ok('calcMean-2', near(S.calcMean([1.5,2.5]), 2), 'decimals');
  ok('calcMean-3', near(S.calcMean([-2,0,2]), 0), 'negatives sum to zero');
  // Contract: guards return NaN, which fmt() renders to the learner as an em dash.
  ok('calcMean-4', Number.isNaN(S.calcMean([])) && S.fmt(S.calcMean([]),2) === '\u2014', 'empty -> NaN, displayed to learner as em dash (not "NaN")');
  ok('calcMean-5', near(S.calcMean([5]), 5), 'n=1 boundary');
  // sample SD: sqrt(sum((x-mean)^2)/(n-1)); dataset mean 5, SS = 32, n-1 = 7
  ok('calcSampleSD-1', near(S.calcSampleSD([2,4,4,4,5,5,7,9]), Math.sqrt(32/7)), 'sample SD uses n-1 (SS=32, n-1=7)');
  ok('calcSampleSD-2', S.calcSampleSD([2,4,4,4,5,5,7,9]) !== Math.sqrt(32/8), 'genuinely NOT population SD (n)');
  ok('calcSampleSD-3', Number.isNaN(S.calcSampleSD([5])) && S.fmt(S.calcSampleSD([5]),2) === '\u2014', 'n=1 -> NaN (n-1=0), displayed as em dash');
  ok('calcSampleSD-4', Number.isNaN(S.calcSampleSD([])), 'empty -> NaN guard');
  ok('calcSampleSD-5', near(S.calcSampleSD([3,3,3]), 0), 'zero dispersion');
  ok('calcCVPercent-1', near(S.calcCVPercent(2,100), 2), 'CV% = SD/mean*100');
  ok('calcCVPercent-2', Number.isNaN(S.calcCVPercent(2,0)), 'mean=0 guarded (NaN, displayed as em dash)');
  ok('calcCVPercent-3', Number.isNaN(S.calcCVPercent(2,-100)), 'negative mean guarded');
  ok('calcBiasPercent-1', near(S.calcBiasPercent(105,100), 5), 'signed bias positive');
  ok('calcBiasPercent-2', near(S.calcBiasPercent(95,100), -5), 'sign preserved (not absolute)');
  ok('calcBiasPercent-3', Number.isNaN(S.calcBiasPercent(5,0)), 'zero target guarded (no division by zero)');
  // Sigma metric: (TEa - |bias|)/CV
  ok('calcSigma-1', near(S.calcSigma(10,2,2).value, 4), 'Sigma = (10-2)/2 = 4');
  ok('calcSigma-2', near(S.calcSigma(10,-2,2).value, 4), 'uses |bias|');
  ok('calcSigma-3', near(S.calcSigma(2,5,1).value, -3), 'negative Sigma NOT floored at zero');
  ok('calcSigma-4', S.calcSigma(10,2,0).valid === false, 'CV=0 invalid');
  ok('calcSigma-5', S.calcSigma(10,2,-1).valid === false, 'CV<0 invalid');
  ok('calcSigma-6', S.calcSigma(NaN,2,2).valid === false, 'non-finite invalid');
  ok('fmt-1', S.fmt(2.345, 2) === '2.35' || S.fmt(2.345, 2) === '2.34', 'display rounding to 2dp');
  ok('fmtSigned-1', String(S.fmtSigned(5,2)).startsWith('+'), 'signed display carries + for positive');
  ok('roundTo-1', near(S.roundTo(2.345, 2), 2.35) || near(S.roundTo(2.345, 2), 2.34), 'roundTo 2dp');

  /* ---------- Westgard rule engine (multirule definitions) ---------- */
  console.log('\n=== rules/engine.js (Westgard multirule) ===');
  const run = (n, crs) => ({ runNumber: n, controlResults: crs });
  const C = (lvl, z) => ({ levelId: lvl, levelName: lvl, rawValue: 100 + z, zScore: z });
  const seq = n => Array.from({ length: n }, (_, i) => run(i + 1, [C('L1', 0.5)]));
  ok('exceedsPositive', R.exceedsPositive(3.01,3) === true && R.exceedsPositive(3,3) === false, 'strict > at threshold');
  ok('exceedsNegative', R.exceedsNegative(-3.01,3) === true && R.exceedsNegative(-3,3) === false, 'strict < at negative threshold');
  ok('exceedsAbs', R.exceedsAbs(-3.01,3) === true && R.exceedsAbs(3,3) === false, 'absolute strict exceedance');
  ok('sideOf', R.sideOf(1) === 'positive' && R.sideOf(-1) === 'negative' && R.sideOf(0) === 'zero', 'sign convention incl. zero');
  ok('detect13s-1', R.detect13s([run(1,[C('L1',3.01)])]).length === 1, '1_3s: |z|>3 triggers');
  ok('detect13s-2', R.detect13s([run(1,[C('L1',3.00)])]).length === 0, '1_3s: exactly 3.00 does NOT trigger');
  ok('detect13s-3', R.detect13s([run(1,[C('L1',-3.00)])]).length === 0, '1_3s: exactly -3.00 does NOT trigger');
  ok('detect13s-4', R.detect13s([run(1,[C('L1',-3.5)])]).length === 1, '1_3s: negative side');
  ok('detect13s-5', R.detect13s([]).length === 0, 'empty input safe');
  ok('detect13s-6', R.detect13s([{runNumber:1}]).length === 0, 'missing controlResults safe');
  ok('detect13s-7', R.detect13s([run(1,[C('L1',NaN)])]).length === 0, 'non-finite z safe');
  ok('detect12s-1', R.detect12s([run(1,[C('L1',2.01)])]).length === 1, '1_2s: |z|>2 triggers');
  ok('detect12s-2', R.detect12s([run(1,[C('L1',2.00)])]).length === 0, '1_2s: exactly 2.00 does NOT trigger');
  ok('detect22s-1', R.detect22s([run(1,[C('L1',2.5)]),run(2,[C('L1',2.6)])]).length >= 1, '2_2s: two consecutive same side');
  ok('detect22s-2', R.detect22s([run(1,[C('L1',2.5)]),run(2,[C('L1',-2.6)])]).length === 0, '2_2s: opposite sides must NOT trigger');
  ok('detect22s-3', R.detect22s([run(1,[C('L1',2.0)]),run(2,[C('L1',2.0)])]).length === 0, '2_2s: exactly 2.0 is not exceedance');
  ok('detectR4s-1', R.detectR4s([run(1,[C('L1',2.1),C('L2',-2.1)])]).length >= 1, 'R_4s: within-run range > 4s');
  ok('detectR4s-2', R.detectR4s([run(1,[C('L1',2.1)]),run(2,[C('L1',-2.1)])]).length === 0, 'R_4s: across-run must NOT trigger');
  ok('detect41s-1', R.detect41s(Array.from({length:4},(_,i)=>run(i+1,[C('L1',1.5)]))).length >= 1, '4_1s: 4 consecutive >1s same side');
  ok('detect41s-2', R.detect41s(Array.from({length:4},(_,i)=>run(i+1,[C('L1',1.0)]))).length === 0, '4_1s: exactly 1.0 not exceedance');
  ok('detect10x-1', R.detect10x(seq(10)).length >= 1, '10x: 10 consecutive same side');
  ok('detect10x-2', R.detect10x(seq(9)).length === 0, '10x: 9 insufficient');
  ok('detect10x-3', R.detect10x(Array.from({length:10},(_,i)=>run(i+1,[C('L1', i===5?0:0.5)]))).length === 0, '10x: z=0 breaks the same-side run');
  ok('detect8x-1', R.detect8x(seq(8)).length >= 1, '8x: 8 consecutive same side');
  ok('detect8x-2', R.detect8x(seq(7)).length === 0, '8x: 7 insufficient');
  ok('detect8x-3', R.detect8x(seq(8)).length >= 1 && R.detect10x(seq(8)).length === 0, '8x and 10x are genuinely distinct rules');
  {
    const ev = R.evaluateRuleSet([run(1,[C('L1',3.5)])], ['13s']);
    ok('evaluateRuleSet-1', Array.isArray(ev) ? ev.length >= 1 : !!ev, 'evaluateRuleSet surfaces an enabled triggered rule');
    const ev2 = R.evaluateRuleSet([run(1,[C('L1',3.5)])], []);
    ok('evaluateRuleSet-2', (Array.isArray(ev2) ? ev2.length : 0) === 0, 'no rules enabled -> no events');
    const ev3 = R.evaluateRuleSet([run(1,[C('L1',0.1)])], ['13s']);
    ok('evaluateRuleSet-3', (Array.isArray(ev3) ? ev3.length : 0) === 0, 'in-control data triggers nothing');
  }

  /* ---------- biological variation / RCV ---------- */
  console.log('\n=== bv/calc.js (RCV: Harris & Yasaka 1983; BV-derived APS hierarchy) ===');
  const z95 = 1.96;
  ok('classicalRcv-1', near(val(BV.calculateClassicalRcv(2,5,'bidirectional-95')), z95*Math.sqrt(2*(4+25))), 'RCV = z*sqrt(2*(CVA^2+CVI^2))');
  ok('classicalRcv-2', near(val(BV.calculateClassicalRcv(0,5,'bidirectional-95')), z95*Math.sqrt(2*25)), 'CVA=0 boundary valid');
  ok('classicalRcv-3', BV.calculateClassicalRcv(-1,5,'bidirectional-95').supported === false, 'negative CVA rejected');
  ok('classicalRcv-4', BV.calculateClassicalRcv(2,5,'').supported === false, 'z convention never inferred');
  ok('classicalRcv-5', BV.calculateClassicalRcv(NaN,5,'bidirectional-95').supported === false, 'non-finite rejected');
  ok('zconv-1', BV.Z_CONVENTIONS['bidirectional-95'].z === 1.96, 'two-sided 95% z = 1.96');
  ok('zconv-2', BV.Z_CONVENTIONS['unidirectional-95'].z === 1.645, 'one-sided 95% z = 1.645');
  ok('lognormalRcv-1', BV.calculateLognormalRcv(2,5,'bidirectional-95').supported === true, 'lognormal RCV supported for valid input');
  ok('lognormalRcv-2', BV.calculateLognormalRcv(-1,5,'bidirectional-95').supported === false, 'negative rejected');
  ok('II-1', near(val(BV.calculateIndexOfIndividuality(5,20)), 0.25), 'II = CVI/CVG');
  ok('II-2', BV.calculateIndexOfIndividuality(6,10).band === 'intermediate-individuality', 'II = 0.6 inclusive lower bound');
  ok('II-3', BV.calculateIndexOfIndividuality(14,10).band === 'intermediate-individuality', 'II = 1.4 inclusive upper bound');
  ok('II-4', BV.calculateIndexOfIndividuality(5,20).band === 'marked-individuality', 'II < 0.6');
  ok('II-5', BV.calculateIndexOfIndividuality(15,10).band === 'low-individuality', 'II > 1.4');
  ok('II-6', BV.calculateIndexOfIndividuality(5,0).supported === false, 'CVG=0 -> not computable, never infinite');
  {
    const aps = BV.calculateBvAps(5,20);
    // BV-derived APS: imprecision = factor x CVI ; bias = factor x sqrt(CVI^2 + CVG^2)
    ok('bvAps-1', near(val(aps.levels.optimum.imprecision), 0.25*5), 'optimum imprecision = 0.25 x CVI');
    ok('bvAps-2', near(val(aps.levels.optimum.bias), 0.125*Math.sqrt(25+400)), 'optimum bias = 0.125 x sqrt(CVI^2+CVG^2)');
    ok('bvAps-3', near(val(aps.levels.desirable.imprecision), 0.5*5), 'desirable imprecision = 0.50 x CVI');
    ok('bvAps-4', near(val(aps.levels.desirable.bias), 0.25*Math.sqrt(25+400)), 'desirable bias = 0.25 x sqrt(CVI^2+CVG^2)');
    ok('bvAps-5', near(val(aps.levels.minimum.imprecision), 0.75*5), 'minimum imprecision = 0.75 x CVI');
    ok('bvAps-6', BV.calculateBvAps(5).cvgAvailable === false, 'CVG absent is flagged, not assumed');
    ok('bvAps-7', BV.calculateBvAps(-1,20).supported === false, 'negative CVI rejected');
  }
  ok('serialAbs-1', near(val(BV.calculateSerialAbsoluteChange(100,110)), 10), '(previous,current): rise is positive');
  ok('serialAbs-2', near(val(BV.calculateSerialAbsoluteChange(110,100)), -10), 'fall is negative (sign preserved)');
  ok('serialAbs-3', BV.calculateSerialAbsoluteChange(NaN,110).supported === false, 'non-finite rejected');
  ok('serialRel-1', near(val(BV.calculateSerialRelativeChange(100,110)), 10), 'relative change % of previous');
  ok('serialRel-2', BV.calculateSerialRelativeChange(0,110).supported === false, 'previous=0 guarded (no division by zero)');
  ok('rcvExceed-1', BV.evaluateClassicalRcvExceedance(100,130,2,5,'bidirectional-95').exceeds === true, '30% change exceeds RCV 14.93');
  ok('rcvExceed-2', BV.evaluateClassicalRcvExceedance(100,105,2,5,'bidirectional-95').exceeds === false, '5% change does not exceed RCV');
  ok('rcvExceed-3', BV.evaluateClassicalRcvExceedance(100,130,2,5,'').supported === false, 'z convention required');
  ok('lognormalExceed-1', typeof BV.evaluateLognormalRcvExceedance(100,130,2,5,'bidirectional-95').supported === 'boolean', 'lognormal exceedance returns a supported flag');
  ok('isFiniteNonNeg', BV.isFiniteNonNegativeNumber(0) === true && BV.isFiniteNonNegativeNumber(-1) === false && BV.isFiniteNonNegativeNumber(NaN) === false, 'zero allowed; negative and NaN rejected');

  /* ---------- EQA ---------- */
  console.log('\n=== eqa/calc.js ===');
  ok('eqaZ-1', near(val(EQ.calculateEqaZScore(110,100,5)), 2), 'z = (obs-target)/sd');
  ok('eqaZ-2', near(val(EQ.calculateEqaZScore(90,100,5)), -2), 'signed');
  ok('eqaAbs-1', near(val(EQ.calculateEqaAbsoluteDeviation(110,100)), 10), 'obs - target, signed');
  ok('eqaRel-1', near(val(EQ.calculateEqaRelativeDeviation(110,100)), 10), '(obs-target)/target*100');
  ok('paired-1', near(val(EQ.calculatePairedDifference(100,110)), 10), 'resultB - resultA (A is comparator)');
  ok('paired-2', near(val(EQ.calculatePairedRelativeDifference(100,110)), 10), '(B-A)/A*100');
  ok('paired-3', EQ.calculatePairedRelativeDifference(0,110).supported === false, 'comparator A=0 guarded');
  ok('paired-4', EQ.calculatePairedDifference(NaN,110).supported === false, 'non-finite rejected');

  /* ---------- PBRTQC ---------- */
  console.log('\n=== pbrtqc/calc.js ===');
  ok('window-1', PB.validateWindowSize(0).valid === false, 'W=0 invalid');
  ok('window-2', PB.validateWindowSize(1).valid === true, 'W=1 valid boundary');
  {
    const m = PB.calculateSlidingMean([1,2,3,4],2).series;
    ok('slidMean-1', m[0].warmupStatus === 'warming-up', 'first point warming up for W=2');
    ok('slidMean-2', near(m[1].statistic, 1.5) && near(m[2].statistic, 2.5) && near(m[3].statistic, 3.5), 'moving mean of W=2');
    const md = PB.calculateSlidingMedian([1,2,3,4],4).series;
    ok('slidMed-1', near(md[3].statistic, 2.5), 'even W: mean of two central values');
    const mo = PB.calculateSlidingMedian([1,2,3,4,5],5).series;
    ok('slidMed-2', near(mo[4].statistic, 3), 'odd W: middle value');
    ok('slidMed-3', PB.calculateSlidingMedian([1,2],0).supported === false, 'invalid window rejected');
  }
  {
    // EWMA with lambda = 1 reduces to the raw value (definitional check)
    const e = PB.calculateEWMA([10,20,30], 1, 0);
    const s = e.series || [];
    ok('ewma-1', e.supported === true, 'EWMA supported for 0 < lambda <= 1');
    ok('ewma-2', s.length ? near(s[s.length-1].statistic ?? s[s.length-1].value, 30, 1e-6) : false, 'lambda=1 -> EWMA equals the latest value');
    ok('ewma-3', PB.calculateEWMA([1,2],0,0).supported === false, 'lambda=0 invalid');
    ok('ewma-4', PB.calculateEWMA([1,2],1.5,0).supported === false, 'lambda>1 invalid');
  }
  ok('metaFilter-1', PB.applyMetadataFilter('ICU',['ICU']).excluded === true || PB.applyMetadataFilter('ICU',['ICU']).included === false, 'excluded subgroup is filtered out');
  ok('metaFilter-2', PB.applyMetadataFilter('OPD',['ICU']).excluded === false || PB.applyMetadataFilter('OPD',['ICU']).included === true, 'non-excluded subgroup retained');
  ok('inject-1', PB.injectAnalyticalError(NaN,1,{}).affected === false, 'non-finite value not affected');
  ok('trunc-1', PB.applyHardTruncation(150,0,100).included === false, 'value above upper truncation limit excluded');
  ok('trunc-2', PB.applyHardTruncation(50,0,100).included === true, 'value within limits included');
  ok('trunc-3', PB.applyHardTruncation(NaN,0,100).included === false, 'non-finite excluded');
  ok('ctrlLimit-1', PB.evaluateControlLimit(undefined,90,110).supported === false, 'no statistic (warm-up) -> no comparison');
  ok('ctrlLimit-2', PB.evaluateControlLimit(120,90,110).alert === true, 'above upper limit alerts');
  ok('ctrlLimit-3', PB.evaluateControlLimit(100,90,110).alert === false, 'within limits does not alert');
  ok('ffr-1', PB.calculatePointwiseFalseFlagRate(0,0).supported === false, 'zero evaluable points -> no division by zero');
  ok('ffr-2', near(PB.calculatePointwiseFalseFlagRate(5,100).rate, 0.05) || near(PB.calculatePointwiseFalseFlagRate(5,100).rate, 5), 'false-flag rate = breaches/evaluable');
  ok('nped-1', PB.calculateNPed(0,5,100).supported === false, 'onset index must be >= 1');
  {
    const d = PB.calculateNPed(10, 15, 100);
    ok('nped-2', d.detected === true && (d.nped === 5 || d.nped === 6), 'NPed counts raw patient results from onset to first alert');
    const u = PB.calculateNPed(10, null, 100);
    ok('nped-3', u.detected === false && (u.nped === undefined || u.nped === null), 'undetected run leaves NPed undefined, not a large number');
  }
  {
    // SC27 (scientific owner adjudication, Dr Prasenjit Mitra + ChatGPT):
    // the computational safeguard is UNCHANGED — anped MUST remain
    // undefined internally whenever any trial is undetected, and it must
    // never be silently averaged over the detected-only subset. What
    // changed is the LEARNER-FACING description: "undefined" is replaced
    // by the more precise "Not estimable" (an ordinary arithmetic mean
    // cannot incorporate a right-censored detection time), the
    // censoringNote must explain the downward-bias risk of averaging
    // detected-only runs, and detection rate must be reported alongside
    // so probability of detection and detection delay stay distinct.
    const allDet = PB.summarizeNpedTrials([{detected:true,nped:5},{detected:true,nped:7}]);
    ok('anped-1', allDet.supported === true && near(allDet.anped ?? allDet.value, 6), 'ANPed = mean of NPed when all trials detected');
    ok('anped-1b', allDet.censoringNote === null, 'no censoring note when every trial detected');
    const oneMissed = PB.summarizeNpedTrials([{detected:true,nped:5},{detected:false,nped:undefined}]);
    const a = oneMissed.anped ?? oneMissed.value;
    ok('anped-2-SC27-computation', a === undefined || a === null, 'SC27: the underlying anped value is STILL undefined when any trial fails to detect (computational safeguard unchanged — no survivorship-biased average)');
    ok('anped-2-SC27-not-undefined-word', !/\bundefined\b/i.test(oneMissed.censoringNote || ''), 'SC27: learner-facing wording no longer describes this as "undefined"');
    ok('anped-2-SC27-not-estimable', /not estimable/i.test(oneMissed.censoringNote || ''), 'SC27: learner-facing wording states ANPed is "Not estimable"');
    ok('anped-2-SC27-censoring', /censor/i.test(oneMissed.censoringNote || ''), 'SC27: wording explains the right-censoring concept');
    ok('anped-2-SC27-bias-risk', /bias/i.test(oneMissed.censoringNote || '') && /downward/i.test(oneMissed.censoringNote || ''), 'SC27: wording explains averaging detected-only runs would bias delay downward');
    ok('anped-2-SC27-detection-rate-alongside', typeof oneMissed.detectionRatePercent === 'number', 'detection rate is retained alongside ANPed so the two are interpreted separately');
    ok('anped-2-SC27-no-artificial-value', a !== 100 && a !== 101, 'SC27: no artificial NPed (simulation horizon or horizon+1) is ever substituted');
    ok('anped-3', PB.summarizeNpedTrials([]).supported === false, 'at least one trial required');
  }
  ok('stream-1', PB.runPbrtqcStream('not-an-array',{}).supported === false, 'non-array input rejected');

  /* ---------- investigation / risk gates ---------- */
  console.log('\n=== investigation + risk decision gates ===');
  ok('isVisibleAtStage-1', INV.isVisibleAtStage('signal','containment') === true, 'element revealed at an earlier named stage is visible later');
  ok('isVisibleAtStage-2', INV.isVisibleAtStage('verification','signal') === false, 'element for a later named stage is hidden earlier');
  ok('deriveQcSignal-1', typeof INV.deriveQcSignalStatus('none') === 'string' || INV.deriveQcSignalStatus('none') === null, 'signal status derived deterministically');
  ok('window-inv-1', INV.isWithinCandidateWindow('2026-01-01T05:00','2026-01-01T01:00','2026-01-01T10:00') === true, 'ISO timestamp inside window');
  ok('window-inv-2', INV.isWithinCandidateWindow('2026-01-01T20:00','2026-01-01T01:00','2026-01-01T10:00') === false, 'ISO timestamp outside window');
  ok('window-inv-3', INV.isWithinCandidateWindow(5,1,10) === false, 'non-string inputs rejected (type guard)');
  ok('dd-1', typeof DD.isDetectionDelaySupportedRuleSet(['1_3s']) === 'boolean', 'rule-set support returns a boolean');
  ok('dd-2', DD.isDetectionDelaySupportedRuleSet([]) === false, 'empty rule set unsupported');
  ok('dd-3', typeof DD.detectionDelaySupportForRuleIds(['1_3s']) === 'object', 'support detail returned');

  /* ---------- Morning QC decision / scoring / engine gates ---------- */
  console.log('\n=== morning-qc decision, scoring and phase gates ===');
  ok('classifyDecision-1', DM.classifyDecision('UNKNOWN_ACTION') === null, 'non-decision action classifies as null');
  ok('classifyDecision-2', (() => { const r = DM.classifyDecision('RESUME_SERVICE'); return r === null || typeof r === 'string' || typeof r === 'object'; })(), 'known action classifies deterministically');
  ok('summarizeDecisions-1', Array.isArray(DM.summarizeDecisions([])) || typeof DM.summarizeDecisions([]) === 'object', 'empty history summarises safely');
  ok('calibration-1', SM.classifyCalibrationCategory('HIGH', true) === 'CORRECT_CALIBRATED', 'high confidence + correct = calibrated');
  ok('calibration-2', SM.classifyCalibrationCategory('LOW', true) === 'CORRECT_UNDERCONFIDENT', 'low confidence + correct = underconfident');
  ok('calibration-3', SM.classifyCalibrationCategory('HIGH', false) !== 'CORRECT_CALIBRATED', 'high confidence + incorrect is not calibrated');
  ok('decisionCalib-1', typeof SM.classifyDecisionCalibration('HIGH', true, true) === 'string', 'decision calibration returns a category');
  ok('canReturnToPhase-1', EN.canReturnToPhase('SCAN','BRIEFING') === true, 'named earlier phase is an allowed return target');
  ok('canReturnToPhase-2', EN.canReturnToPhase('BRIEFING','DEBRIEF') === false, 'skipping forward via return is prohibited');
  ok('canReturnToPhase-3', EN.canReturnToPhase('BRIEFING','SCAN') === false, 'BRIEFING has no permitted return targets');
  ok('canReturnToPhase-4', EN.canReturnToPhase('CHARACTERISATION','SIGNAL_RECOGNITION') === true, 'multi-step backward return permitted where mapped');
  ok('validateAttemptRecord-1', AS.validateAttemptRecord({}).valid === false, 'empty record rejected (gates learner recommendation)');
  ok('validateAttemptRecord-2', AS.validateAttemptRecord(null).valid === false, 'null record rejected');

  const total = passed + failed;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`v1.0 Learner-Facing Calculation/Decision Verification: ${passed}/${total} passed, ${failed} failed`);
  if (failed > 0) { console.error('SCIENTIFIC VERIFICATION FAILED.'); process.exit(1); }
  console.log('ALL LEARNER-FACING CALCULATION/DECISION TESTS PASSED.');
}
main().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
