/* =========================================================================
   v09/tests/morning-qc/stage12e-storage-robustness.test.cjs

   Morning QC Room — Stage 12E Storage Robustness + Deep Privacy Tests
   PROVENANCE: V09_TEST

   Section 18/20: hardens persistence against foreseeable local failures
   and probes deeply-nested identity-field injection across the research
   export pipeline (attempt-store/analytics privacy was already
   extensively tested in Stage 12D; this suite extends coverage to the
   new Stage 12E research-export surface specifically).
   ========================================================================= */
'use strict';
const path = require('path');

let passed = 0, failed = 0;
function assert(id, cond, detail) {
  if (cond) { console.log(`  ✓ [${id}] ${detail}`); passed++; }
  else { console.error(`  ✗ [${id}] FAIL: ${detail}`); failed++; }
}

function makeStorage(initial) {
  const data = initial ? { 'precimind-morningqc-attempts-v1': initial } : {};
  return { getItem: k => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = v; }, removeItem: k => { delete data[k]; } };
}

async function main() {
  const MQC = path.join(__dirname, '..', '..', 'app', 'morning-qc');
  const { listAttempts } = await import('file://' + path.join(MQC, 'adaptive', 'attempt-store.js'));
  const { buildSyntheticCohort, buildMalformedFixture } = await import('file://' + path.join(MQC, 'research', 'synthetic-fixtures.js'));
  const { buildResearchExportBundle } = await import('file://' + path.join(MQC, 'research', 'research-export.js'));

  console.log('\n=== Storage resilience (Section 18) ===');
  {
    assert('STORAGE-MISSING-ENTRY', listAttempts(makeStorage()).length === 0, 'Missing storage entry returns empty array, never throws');
    assert('STORAGE-EMPTY-STRING', listAttempts(makeStorage('')).length === 0, 'Empty-string storage value returns empty array');
    assert('STORAGE-MALFORMED-JSON', listAttempts(makeStorage('{not valid json')).length === 0, 'Malformed JSON in storage returns empty array, never throws');
    assert('STORAGE-NOT-AN-ARRAY', listAttempts(makeStorage('{"foo":"bar"}')).length === 0, 'A valid-JSON-but-non-array value returns empty array');
    assert('STORAGE-ARRAY-OF-NULLS', listAttempts(makeStorage('[null, null]')).length === 0, 'An array of nulls is safely quarantined, never crashes');
    assert('STORAGE-ARRAY-OF-STRINGS', listAttempts(makeStorage('["not", "objects"]')).length === 0, 'An array of non-object entries is safely quarantined');

    const validRecord = buildSyntheticCohort()[0];
    const malformedNested = buildMalformedFixture();
    const mixedStorage = makeStorage(JSON.stringify([validRecord, malformedNested, null, 'garbage', {}]));
    const mixedResult = listAttempts(mixedStorage);
    assert('STORAGE-MIXED-QUARANTINE', mixedResult.length === 1 && mixedResult[0].attemptId === validRecord.attemptId, 'A mixed valid/malformed/null/garbage array correctly quarantines everything except the one genuinely valid record');

    // Duplicate attempt IDs: both retained (store does not dedupe by ID — documented behavior, not a crash).
    const dup1 = { ...validRecord, attemptId: 'dup-1' };
    const dup2 = { ...validRecord, attemptId: 'dup-1' };
    const dupStorage = makeStorage(JSON.stringify([dup1, dup2]));
    assert('STORAGE-DUPLICATE-IDS-SAFE', listAttempts(dupStorage).length === 2, 'Duplicate attemptId values do not crash reading (both retained; dedup is not a correctness requirement here)');
  }

  console.log('\n=== Research export handles malformed/mixed input safely (Section 13/18) ===');
  {
    const cohort = buildSyntheticCohort();
    const bundleWithGarbage = buildResearchExportBundle([...cohort, null, 'garbage', {}, buildMalformedFixture()]);
    assert('EXPORT-SAFE-WITH-GARBAGE', bundleWithGarbage.manifest.validAttemptCount === cohort.length, 'Export bundle safely excludes null/string/empty-object/malformed entries mixed into the raw input, without throwing');
    assert('EXPORT-EXCLUDED-COUNT-GARBAGE', bundleWithGarbage.manifest.excludedRecordCount === 4, 'Export manifest correctly counts all 4 non-cohort excluded entries (null, string, empty object, malformed)');
  }

  console.log('\n=== Deep nested privacy injection across the export pipeline (Section 20) ===');
  {
    const FORBIDDEN_KEYS = ['name', 'learnerName', 'email', 'staffId', 'employeeId', 'institution', 'hospital', 'patientId', 'patientName', 'MRN', 'IP', 'ipAddress', 'deviceId', 'fingerprint'];
    const { validateAttemptRecord } = await import('file://' + path.join(MQC, 'adaptive', 'attempt-store.js'));
    const base = buildSyntheticCohort()[0];
    for (const key of FORBIDDEN_KEYS) {
      // Shallow top-level injection.
      const shallow = { ...base, [key]: 'INJECTED' };
      assert(`PRIVACY-SHALLOW-${key}`, !validateAttemptRecord(shallow).valid, `Top-level "${key}" injection is rejected`);
      // Deeply nested injection inside executedFinalDisposition.
      const nested = { ...base, executedFinalDisposition: { ...base.executedFinalDisposition, [key]: 'INJECTED' } };
      assert(`PRIVACY-NESTED-EFD-${key}`, !validateAttemptRecord(nested).valid, `Nested "${key}" injection inside executedFinalDisposition is rejected`);
      // Deeply nested injection inside competencyProfile entries.
      const nestedProfile = { ...base, competencyProfile: [{ dimension: 'SIGNAL_RECOGNITION', rating: 'STRONG', [key]: 'INJECTED' }] };
      assert(`PRIVACY-NESTED-PROFILE-${key}`, !validateAttemptRecord(nestedProfile).valid, `Nested "${key}" injection inside competencyProfile is rejected`);
    }
  }

  const total = passed + failed;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Stage 12E Storage Robustness + Privacy Tests: ${passed}/${total} passed, ${failed} failed`);
  if (failed > 0) { console.error('STAGE 12E STORAGE/PRIVACY TESTS FAILED.'); process.exit(1); }
  console.log('STAGE 12E STORAGE/PRIVACY TESTS PASSED.');
  process.exit(0);
}
main().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
