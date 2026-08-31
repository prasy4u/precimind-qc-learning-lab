/* =========================================================================
   tests/stage3a-opchar.test.js

   NEW RECOVERY TESTS — Stage 3A (NOT the historical test suite)
   The historical opchar test suite was lost. These are newly written tests
   that validate the recovered operating-characteristic engine in
   src/opchar/functions.js.

   Historical context: the project previously reported 71 opchar assertions
   after scientific hardening. That count is Class C (externally reported,
   not independently recovered). Tests here optimise for semantic coverage.

   DIRECTLY RECOVERED FIXTURES are derived from explicit numeric values
   encoded in the HTML source:
   - Phi(0) = 0.5 (normalCDF symmetry, stated in source comments)
   - Phi(3) = 0.99865 (stated in source comments)
   - CHANGE_PED_HOLD_M_EXPERIMENT presets:
       N=1, deltaSE=3.000 -> Ped approx 0.50
       N=1, deltaSE=3.674 -> Ped approx 0.75
       N=1, deltaSE=4.282 -> Ped approx 0.90
       N=1, deltaSE=5.326 -> Ped approx 0.99
     (all stated "to within 0.001" of labelled target in HTML)

   Run: node tests/stage3a-opchar.test.js
   ========================================================================= */

'use strict';

const {
  erf, normalCDF,
  pfr1_3sSingle, pfr1_3s,
  pedSingle1_3s, ped1_3s,
  operatingCharacteristic13s, unsupportedOperatingCharacteristic,
  UNSUPPORTED_OPCHAR_NOTE, UNSUPPORTED_OPCHAR_REASON,
  operatingCharacteristic
} = require('../src/opchar/functions');

let passed = 0, failed = 0;

function assert(id, condition, detail) {
  if (condition) { console.log(`  ✓ [${id}] ${detail}`); passed++; }
  else { console.error(`  ✗ [${id}] FAIL: ${detail}`); failed++; }
}

const near = (a, b, tol = 0.001) => isFinite(a) && isFinite(b) && Math.abs(a - b) <= tol;

/* -----------------------------------------------------------------------
   SECTION 1: DIRECTLY RECOVERED FIXTURES (Class A)
   These values are explicitly encoded in the original HTML source.
   ----------------------------------------------------------------------- */
console.log('\n=== DIRECTLY RECOVERED OPERATING-CHARACTERISTIC FIXTURES ===');
console.log('    Source: recovery/original-v0.8.html (explicit numeric claims)');

// Phi(0) = 0.5 — stated in source comment: "standard normal table facts such as Phi(0)=0.5"
assert('FIXTURE-CDF-01', near(normalCDF(0), 0.5, 0.000001), 'normalCDF(0) = 0.5 (source-stated fact)');

// Phi(3) = 0.99865 — stated in source comment: "Phi(3)=0.99865"
assert('FIXTURE-CDF-02', near(normalCDF(3), 0.99865, 0.00001), 'normalCDF(3) = 0.99865 (source-stated fact)');

// CHANGE_PED_HOLD_M_EXPERIMENT presets from HTML lines ~5610-5614:
// "ped1_3s(deltaSE, N) genuinely lands at (to within 0.001) the labelled target"
// Preset: N=1, deltaSE=3.000 -> Ped approx 0.50
assert('FIXTURE-PED-01', near(ped1_3s(3.000, 1), 0.50, 0.001),
  'ped1_3s(deltaSE=3.000, N=1) ≈ 0.50 (source-encoded preset, tol=0.001)');

// Preset: N=1, deltaSE=3.674 -> Ped approx 0.75
assert('FIXTURE-PED-02', near(ped1_3s(3.674, 1), 0.75, 0.001),
  'ped1_3s(deltaSE=3.674, N=1) ≈ 0.75 (source-encoded preset, tol=0.001)');

// Preset: N=1, deltaSE=4.282 -> Ped approx 0.90
assert('FIXTURE-PED-03', near(ped1_3s(4.282, 1), 0.90, 0.001),
  'ped1_3s(deltaSE=4.282, N=1) ≈ 0.90 (source-encoded preset, tol=0.001)');

// Preset: N=1, deltaSE=5.326 -> Ped approx 0.99
assert('FIXTURE-PED-04', near(ped1_3s(5.326, 1), 0.99, 0.001),
  'ped1_3s(deltaSE=5.326, N=1) ≈ 0.99 (source-encoded preset, tol=0.001)');

/* -----------------------------------------------------------------------
   SECTION 2: RECONSTRUCTED TESTS — normalCDF / erf
   ----------------------------------------------------------------------- */
console.log('\n=== RECONSTRUCTED TESTS — normalCDF and erf ===');

// erf(0) = 0
assert('T-ERF-01', near(erf(0), 0, 0.000001), 'erf(0) = 0');

// erf is odd: erf(-x) = -erf(x)
assert('T-ERF-02', near(erf(-1), -erf(1), 0.000001), 'erf is odd: erf(-1) = -erf(1)');
assert('T-ERF-03', near(erf(-3), -erf(3), 0.000001), 'erf is odd: erf(-3) = -erf(3)');

// erf(x) approaches 1 as x -> infinity (large x)
assert('T-ERF-04', near(erf(10), 1.0, 0.000001), 'erf(10) ≈ 1.0 (asymptote)');
assert('T-ERF-05', near(erf(-10), -1.0, 0.000001), 'erf(-10) ≈ -1.0 (asymptote)');

// erf finite for finite inputs
assert('T-ERF-06', isFinite(erf(0)) && isFinite(erf(1)) && isFinite(erf(-5)), 'erf finite for ordinary inputs');

// normalCDF symmetry: CDF(z) + CDF(-z) = 1
assert('T-CDF-01', near(normalCDF(1) + normalCDF(-1), 1.0, 0.000001), 'normalCDF(1) + normalCDF(-1) = 1');
assert('T-CDF-02', near(normalCDF(2) + normalCDF(-2), 1.0, 0.000001), 'normalCDF(2) + normalCDF(-2) = 1');
assert('T-CDF-03', near(normalCDF(3) + normalCDF(-3), 1.0, 0.000001), 'normalCDF(3) + normalCDF(-3) = 1');

// normalCDF is monotonically increasing
assert('T-CDF-04', normalCDF(-3) < normalCDF(-2) && normalCDF(-2) < normalCDF(0) &&
  normalCDF(0) < normalCDF(2) && normalCDF(2) < normalCDF(3), 'normalCDF is monotonically increasing');

// normalCDF range [0,1] — A&S approximation returns exactly 0 and 1 at extremes; both are within [0,1]
assert('T-CDF-05', normalCDF(-10) >= 0 && normalCDF(10) <= 1, 'normalCDF stays in [0,1] for extreme inputs (A&S approx may reach exact bounds)');
assert('T-CDF-06', isFinite(normalCDF(-10)) && isFinite(normalCDF(10)), 'normalCDF finite for extreme inputs');

// normalCDF(0) = 0.5 (from fixture, repeated as structural test)
assert('T-CDF-07', near(normalCDF(0), 0.5, 0.000001), 'normalCDF(0) = 0.5');

// Phi(1.96) ≈ 0.975 (standard normal table fact, not stated in source but derivable)
assert('T-CDF-08', near(normalCDF(1.96), 0.975, 0.001), 'normalCDF(1.96) ≈ 0.975');

/* -----------------------------------------------------------------------
   SECTION 3: RECONSTRUCTED TESTS — pfr1_3sSingle / pfr1_3s
   ----------------------------------------------------------------------- */
console.log('\n=== RECONSTRUCTED TESTS — pfr1_3sSingle and pfr1_3s ===');

// pfr1_3sSingle: single result exceeds ±3 SD when process is in control
const pfrSingle = pfr1_3sSingle();
assert('T-PFR-01', isFinite(pfrSingle) && pfrSingle > 0 && pfrSingle < 1, 'pfr1_3sSingle is a valid probability');
// For standard normal: P(|Z| > 3) ≈ 0.0027
assert('T-PFR-02', near(pfrSingle, 0.0027, 0.0001), 'pfr1_3sSingle ≈ 0.0027');

// pfr1_3s(N=1) = pfr1_3sSingle()
assert('T-PFR-03', near(pfr1_3s(1), pfr1_3sSingle(), 0.0000001), 'pfr1_3s(N=1) = pfr1_3sSingle()');

// pfr1_3s increases with N (more controls → more chance of false rejection)
assert('T-PFR-04', pfr1_3s(1) < pfr1_3s(2) && pfr1_3s(2) < pfr1_3s(4), 'pfr increases with N');

// pfr1_3s(N) increases with N but A&S float behaviour limits exact ceiling
// At N=1000, the approximation gives ~0.933 due to floating point in Math.pow near 0
// The key invariant is that pfr increases monotonically with N, tested in T-PFR-04
assert('T-PFR-05', pfr1_3s(1000) > pfr1_3s(100), 'pfr1_3s(1000) > pfr1_3s(100) — monotonically increasing with N');

// pfr1_3s stays in (0,1) for reasonable N
assert('T-PFR-06', pfr1_3s(1) > 0 && pfr1_3s(100) < 1, 'pfr1_3s stays in (0,1) for reasonable N');

/* -----------------------------------------------------------------------
   SECTION 4: RECONSTRUCTED TESTS — pedSingle1_3s / ped1_3s
   ----------------------------------------------------------------------- */
console.log('\n=== RECONSTRUCTED TESTS — pedSingle1_3s and ped1_3s ===');

// pedSingle1_3s(0): at zero shift, this is the false-rejection rate for a single measurement
assert('T-PED-01', near(pedSingle1_3s(0), pfr1_3sSingle(), 0.000001),
  'pedSingle1_3s(deltaSE=0) = pfr1_3sSingle() — zero shift detection = false-rejection rate');

// pedSingle1_3s increases with shift magnitude
assert('T-PED-02', pedSingle1_3s(0) < pedSingle1_3s(1) && pedSingle1_3s(1) < pedSingle1_3s(3) &&
  pedSingle1_3s(3) < pedSingle1_3s(5), 'pedSingle1_3s increases with shift magnitude');

// pedSingle1_3s approaches 1 for very large shifts
assert('T-PED-03', pedSingle1_3s(10) > 0.999, 'pedSingle1_3s approaches 1 for large shift');

// Two-sided symmetry: positive and negative shift of same magnitude give same detection probability
assert('T-PED-04', near(pedSingle1_3s(3), pedSingle1_3s(-3), 0.000001),
  'pedSingle1_3s is symmetric: same detection for +shift and -shift of equal magnitude');
assert('T-PED-05', near(pedSingle1_3s(1), pedSingle1_3s(-1), 0.000001),
  'pedSingle1_3s symmetric at deltaSE=±1');

// ped1_3s(0, N=1) = pfr1_3s(1) — zero shift, single measurement
assert('T-PED-06', near(ped1_3s(0, 1), pfr1_3s(1), 0.000001),
  'ped1_3s(deltaSE=0, N=1) = pfr1_3s(N=1) — zero-shift event = false-rejection');

// ped1_3s increases with N for fixed shift
assert('T-PED-07', ped1_3s(3, 1) < ped1_3s(3, 2) && ped1_3s(3, 2) < ped1_3s(3, 4),
  'ped1_3s increases with N for fixed shift');

// ped1_3s increases with shift for fixed N
assert('T-PED-08', ped1_3s(1, 2) < ped1_3s(2, 2) && ped1_3s(2, 2) < ped1_3s(3, 2),
  'ped1_3s increases with shift for fixed N');

// ped1_3s(N=1) = pedSingle1_3s
assert('T-PED-09', near(ped1_3s(3, 1), pedSingle1_3s(3), 0.000001),
  'ped1_3s(deltaSE, N=1) = pedSingle1_3s(deltaSE)');

// ped1_3s finite for ordinary inputs
assert('T-PED-10', isFinite(ped1_3s(0, 1)) && isFinite(ped1_3s(5, 4)) && isFinite(ped1_3s(10, 10)),
  'ped1_3s finite for ordinary inputs');

/* -----------------------------------------------------------------------
   SECTION 5: RECONSTRUCTED TESTS — operatingCharacteristic13s
   ----------------------------------------------------------------------- */
console.log('\n=== RECONSTRUCTED TESTS — operatingCharacteristic13s ===');

const oc13 = operatingCharacteristic13s(2, 3);
assert('T-OC13-01', oc13 !== null, 'operatingCharacteristic13s returns non-null for valid N');
assert('T-OC13-02', oc13.supported === true, 'operatingCharacteristic13s: supported=true');
assert('T-OC13-03', oc13.validated === true, 'operatingCharacteristic13s: validated=true');
assert('T-OC13-04', oc13.ruleId === '13s', 'operatingCharacteristic13s: ruleId="13s"');
assert('T-OC13-05', oc13.N === 2 && oc13.deltaSE === 3, 'operatingCharacteristic13s: N and deltaSE preserved');
assert('T-OC13-06', isFinite(oc13.pfr) && oc13.pfr > 0 && oc13.pfr < 1, 'pfr is valid probability');
assert('T-OC13-07', isFinite(oc13.ped) && oc13.ped > 0 && oc13.ped < 1, 'ped is valid probability');
assert('T-OC13-08', typeof oc13.basis === 'string' && oc13.basis.length > 0, 'basis string present');

// pfr matches pfr1_3s(N)
assert('T-OC13-09', near(oc13.pfr, pfr1_3s(2), 0.000001), 'oc13.pfr matches pfr1_3s(N=2)');

// ped matches ped1_3s(deltaSE, N)
assert('T-OC13-10', near(oc13.ped, ped1_3s(3, 2), 0.000001), 'oc13.ped matches ped1_3s(3, 2)');

// Invalid N returns null
assert('T-OC13-11', operatingCharacteristic13s(0, 3) === null, 'N=0 returns null');
assert('T-OC13-12', operatingCharacteristic13s(-1, 3) === null, 'N=-1 returns null');
assert('T-OC13-13', operatingCharacteristic13s('two', 3) === null, 'N=string returns null');
assert('T-OC13-14', operatingCharacteristic13s(NaN, 3) === null, 'N=NaN returns null');

// Zero shift: ped should equal pfr (false rejection)
const oc_zeroShift = operatingCharacteristic13s(2, 0);
assert('T-OC13-15', oc_zeroShift !== null && near(oc_zeroShift.ped, oc_zeroShift.pfr, 0.000001),
  'At deltaSE=0, ped=pfr (detection = false rejection)');

/* -----------------------------------------------------------------------
   SECTION 6: RECONSTRUCTED TESTS — unsupportedOperatingCharacteristic
   ----------------------------------------------------------------------- */
console.log('\n=== RECONSTRUCTED TESTS — unsupportedOperatingCharacteristic ===');

const uns = unsupportedOperatingCharacteristic();
assert('T-UNS-01', uns.supported === false, 'unsupported: supported=false');
assert('T-UNS-02', uns.validated === false, 'unsupported: validated=false');
assert('T-UNS-03', uns.note === UNSUPPORTED_OPCHAR_NOTE, 'unsupported: note matches UNSUPPORTED_OPCHAR_NOTE exactly');
assert('T-UNS-04', uns.reason === UNSUPPORTED_OPCHAR_REASON, 'unsupported: reason matches UNSUPPORTED_OPCHAR_REASON exactly');

// Verify the exact required note text from HTML
assert('T-UNS-05',
  UNSUPPORTED_OPCHAR_NOTE === "Numerical operating-characteristic calculation is not implemented for this multirule procedure in the current version.",
  'UNSUPPORTED_OPCHAR_NOTE matches exact HTML source text');

/* -----------------------------------------------------------------------
   SECTION 7: RECONSTRUCTED TESTS — operatingCharacteristic dispatcher
   ----------------------------------------------------------------------- */
console.log('\n=== RECONSTRUCTED TESTS — operatingCharacteristic dispatcher ===');

// Single 13s — supported
const oc_single = operatingCharacteristic(['13s'], 2, 3);
assert('T-DISP-01', oc_single.supported === true && oc_single.validated === true,
  'operatingCharacteristic(["13s"], ...) is supported');

// Multirule 13s + 22s — unsupported
const oc_13_22 = operatingCharacteristic(['13s', '22s'], 2, 3);
assert('T-DISP-02', oc_13_22.supported === false, 'operatingCharacteristic(["13s","22s"]) is unsupported');
assert('T-DISP-03', oc_13_22.note === UNSUPPORTED_OPCHAR_NOTE, 'multirule returns correct note');

// Multirule 13s + r4s — unsupported
assert('T-DISP-04', operatingCharacteristic(['13s', 'r4s'], 2, 3).supported === false,
  'operatingCharacteristic(["13s","r4s"]) is unsupported');

// Full multirule 13s+22s+r4s+41s — unsupported
assert('T-DISP-05', operatingCharacteristic(['13s', '22s', 'r4s', '41s'], 2, 3).supported === false,
  'operatingCharacteristic(["13s","22s","r4s","41s"]) is unsupported');

// 8x alone — unsupported
assert('T-DISP-06', operatingCharacteristic(['8x'], 4, 3).supported === false,
  'operatingCharacteristic(["8x"]) is unsupported');

// 10x alone — unsupported
assert('T-DISP-07', operatingCharacteristic(['10x'], 5, 3).supported === false,
  'operatingCharacteristic(["10x"]) is unsupported');

// 13s + 8x — unsupported
assert('T-DISP-08', operatingCharacteristic(['13s', '8x'], 2, 3).supported === false,
  'operatingCharacteristic(["13s","8x"]) is unsupported');

// Empty array — unsupported
assert('T-DISP-09', operatingCharacteristic([], 2, 3).supported === false,
  'operatingCharacteristic([]) is unsupported');

// null/undefined ruleIds — unsupported
assert('T-DISP-10', operatingCharacteristic(null, 2, 3).supported === false,
  'operatingCharacteristic(null) is unsupported');

// Invalid N with rule ["13s"]: dispatcher check is `N > 0`; N=0 and N=-1 fail this and
// route to unsupportedOperatingCharacteristic() — returning {supported:false}, NOT null.
// This is the actual recovered behaviour from the dispatcher's own guard.
assert('T-DISP-11', operatingCharacteristic(['13s'], 0, 3).supported === false,
  'operatingCharacteristic(["13s"], N=0, ...) returns unsupported (dispatcher N>0 guard)');
assert('T-DISP-12', operatingCharacteristic(['13s'], -1, 3).supported === false,
  'operatingCharacteristic(["13s"], N=-1, ...) returns unsupported (dispatcher N>0 guard)');

// Dispatcher produces same result as direct call to 13s
const oc_via_disp = operatingCharacteristic(['13s'], 3, 4);
const oc_direct = operatingCharacteristic13s(3, 4);
assert('T-DISP-13', oc_via_disp !== null && oc_direct !== null &&
  near(oc_via_disp.ped, oc_direct.ped, 0.000001) &&
  near(oc_via_disp.pfr, oc_direct.pfr, 0.000001),
  'operatingCharacteristic dispatcher produces same result as operatingCharacteristic13s directly');

// 12s alone — unsupported (not a supported rule in this build)
assert('T-DISP-14', operatingCharacteristic(['12s'], 2, 3).supported === false,
  'operatingCharacteristic(["12s"]) is unsupported');

/* -----------------------------------------------------------------------
   SECTION 8: N SEMANTICS TESTS
   ----------------------------------------------------------------------- */
console.log('\n=== N SEMANTICS — QC measurements per run ===');

// N=1: single control measurement
const oc_N1 = operatingCharacteristic13s(1, 3);
assert('T-N-01', oc_N1 !== null && oc_N1.N === 1, 'N=1 is valid');

// N=2: two control measurements (two levels, one per level per run)
const oc_N2 = operatingCharacteristic13s(2, 3);
assert('T-N-02', oc_N2 !== null && oc_N2.N === 2, 'N=2 is valid');

// N=4: four control measurements
const oc_N4 = operatingCharacteristic13s(4, 3);
assert('T-N-03', oc_N4 !== null && oc_N4.N === 4, 'N=4 is valid');

// Effect of N: increasing N increases Ped for fixed shift
assert('T-N-04', oc_N1.ped < oc_N2.ped && oc_N2.ped < oc_N4.ped,
  'Ped increases with N for fixed shift (N=1 < N=2 < N=4)');

// Effect of N: increasing N increases Pfr
assert('T-N-05', oc_N1.pfr < oc_N2.pfr && oc_N2.pfr < oc_N4.pfr,
  'Pfr increases with N (N=1 < N=2 < N=4)');

// Non-integer N: the source check is typeof N === "number" && N > 0, so 1.5 is technically valid
// This tests the actual recovered behaviour, not an invented restriction
const oc_Nfrac = operatingCharacteristic13s(1.5, 3);
assert('T-N-06', oc_Nfrac !== null,
  'N=1.5 passes the recovered guard (typeof number && >0) — source does not restrict to integers');

/* -----------------------------------------------------------------------
   SUMMARY
   ----------------------------------------------------------------------- */
const total = passed + failed;
const fixtureCount = 6; // CDF-01, CDF-02, PED-01 through PED-04
const reconstructedCount = total - fixtureCount;

console.log(`\n${'='.repeat(60)}`);
console.log(`Stage 3A OpChar Tests: ${passed}/${total} passed, ${failed} failed`);
console.log(`  Directly recovered fixtures: ${fixtureCount} (Phi(0), Phi(3), 4 Ped presets)`);
console.log(`  Reconstructed tests: ${reconstructedCount}`);
if (failed > 0) {
  console.error('STAGE 3A FAILED — do not commit.');
  process.exit(1);
} else {
  console.log('STAGE 3A PASSED — all tests green.');
  process.exit(0);
}
