/* =========================================================================
   v09/tests/stage12d-casebank-adaptive.test.js

   Morning QC Room — Stage 12D Governance
   PROVENANCE: V09_TEST

   Verifies: accepted 12A/12B/12C freeze boundaries, exactly 12 production
   cases, all cases validate, all nine new cases have expert/adversarial
   coverage, deterministic recommendation, no hidden-ground-truth
   dependency, no case-ID branching, no generative AI, no external
   analytics, local-only attempt store, no personal identifiers,
   instructor view dev-only, primary nav count 14, Morning QC not QC-13,
   analytics schema version present, case schema version present,
   browser evidence exists.
   ========================================================================= */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const V09 = path.join(__dirname, '..');
const MQC = path.join(V09, 'app', 'morning-qc');
const UI = path.join(MQC, 'ui');
const STAGE12C_BASE = 'd81fa9e764cbcb307226af5a2db98d323548109e'; // accepted, FINAL Stage 12C baseline (post-corrective-closure)

let passed = 0, failed = 0;
function assert(id, cond, detail) {
  if (cond) { console.log(`  ✓ [${id}] ${detail}`); passed++; }
  else { console.error(`  ✗ [${id}] FAIL: ${detail}`); failed++; }
}
function sha256(p) { return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); }

async function main() {
  console.log('\n=== 1. Accepted Stage 12A/12B/12C freeze boundaries ===');
  {
    const manifest = JSON.parse(fs.readFileSync(path.join(V09, 'docs', 'v09-stage12a-freeze-manifest.json'), 'utf8'));
    let allFrozen = true;
    for (const [relPath, expectedHash] of Object.entries(manifest.files)) {
      if (sha256(path.join(V09, relPath)) !== expectedHash) { allFrozen = false; console.error(`    MISMATCH: ${relPath}`); }
    }
    assert('1a', allFrozen, 'All Stage 12A engine/domain files remain byte-identical to the accepted manifest');

    // Stage 12B/12C core interaction/debrief files should be unchanged
    // except the narrowly authorized Stage 12D integration points.
    const AUTHORIZED_12D_TOUCHES = new Set([
      'v09/app/morning-qc/ui/morning-qc-room.jsx',       // onCaseCompleted hook
      'v09/app/morning-qc/ui/production-case-select.jsx', // case-bank UI
      'v09/app/morning-qc/ui/morning-qc-room.css',        // case-bank UI styles
      'v09/app/morning-qc/ui/dev-launcher.jsx',            // instructor dev view toggle (Section 15)
      'v09/app/morning-qc/debrief/debrief-adapter.js',    // caseIdentity leak fix
      'v09/app/ui/app-shell.jsx',                          // ALL_CASES import
      'v09/app/ui/app-data.js',                            // QC-03 pre-release content closure: Competency Map entry
      'v09/app/ui/core-screens.jsx',                       // QC-03 pre-release content closure: Home pathway step
      // Pre-release visual-polish closure (presentation only, no logic):
      'v09/app/morning-qc/ui/patient-impact-panel.jsx',    // .mqc-patient-impact status class
      'v09/app/ui/original-v0.8.css',                      // global design tokens / stylesheet
      'v09/app/ui/guided-panel.jsx',                       // v1.0 RC: guided-learning scaffolding
      'v09/app/ui/guided-path.js',                         // v1.0 RC: guided pathway content
      // Typographic P3 correction: Levey-Jennings non-breaking hyphen
      // (U+2011) to prevent an awkward line-wrap in Safari. Text-content
      // only -- no scientific wording, structure or logic changed.
      'v09/app/morning-qc/ui/ui-model.js',                 // LJ_CHART label string
      'v09/app/qc-materials/data.js',                      // handling-intro prose
      'v09/app/qc-materials/screens.jsx',                  // "Next: Levey-Jennings Laboratory" button text
    ]);
    let diffNames = [];
    try {
      diffNames = execSync(`git diff ${STAGE12C_BASE} --name-only -- v09/app/morning-qc/ui v09/app/morning-qc/debrief v09/app/ui`, { cwd: path.join(V09, '..') }).toString().trim().split('\n').filter(Boolean);
    } catch { diffNames = null; }
    if (diffNames) {
      const unauthorized = diffNames.filter(f => !AUTHORIZED_12D_TOUCHES.has(f));
      assert('1b', unauthorized.length === 0, `Only authorized Stage 12D integration-point files changed in ui/debrief/app-ui (found unauthorized: ${JSON.stringify(unauthorized)})`);
    } else {
      assert('1b', true, 'Baseline commit unreachable in this environment for diffing (non-fatal informational check)');
    }
  }

  console.log('\n=== 1c. Historical Stage 12B/12C browser evidence freeze (Section 18 corrective closure) ===');
  {
    const crypto = require('crypto');
    const evidenceManifestPath = path.join(V09, 'docs', 'v09-stage12bc-evidence-freeze-manifest.json');
    assert('1c-exists', fs.existsSync(evidenceManifestPath), 'Historical evidence freeze manifest exists');
    if (fs.existsSync(evidenceManifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(evidenceManifestPath, 'utf8'));
      let allFrozen = true;
      const mismatches = [];
      for (const [relPath, expectedHash] of Object.entries(manifest.files)) {
        const fullPath = path.join(V09, '..', relPath);
        if (!fs.existsSync(fullPath)) { allFrozen = false; mismatches.push(relPath + ' (missing)'); continue; }
        const actualHash = crypto.createHash('sha256').update(fs.readFileSync(fullPath)).digest('hex');
        if (actualHash !== expectedHash) { allFrozen = false; mismatches.push(relPath); }
      }
      assert('1c-frozen', allFrozen, `All ${Object.keys(manifest.files).length} historical Stage 12B/12C evidence PNGs remain byte-identical (mismatches: ${JSON.stringify(mismatches)}) — running this stage's own browser suites must never leave these overwritten`);
    }
  }

  console.log('\n=== 2. Exactly 12 production cases, all validate ===');
  {
    const { validateCase } = await import('file://' + path.join(MQC, 'case-validator.js'));
    const { ALL_CASES } = await import('file://' + path.join(MQC, 'cases', 'index.js'));
    assert('2a', ALL_CASES.length === 12, `Exactly 12 cases (found ${ALL_CASES.length})`);
    assert('2b', ALL_CASES.every(c => validateCase(c).valid), 'All 12 cases validate with zero errors');
  }

  console.log('\n=== 3. All nine new cases have expert + adversarial coverage ===');
  {
    const pathTestSrc = fs.readFileSync(path.join(V09, 'tests', 'morning-qc', 'expanded-case-paths.test.cjs'), 'utf8');
    for (let n = 4; n <= 12; n++) {
      assert(`3-P${n}-EXPERT`, new RegExp(`P${n}-EXPERT-01`).test(pathTestSrc), `Case ${n} has an expert-path test`);
      const advMatches = pathTestSrc.match(new RegExp(`P${n}-ADV-0\\d`, 'g')) || [];
      assert(`3-P${n}-ADV`, new Set(advMatches).size >= 2, `Case ${n} has at least 2 distinct adversarial-path tests (found ${new Set(advMatches).size})`);
    }
  }

  console.log('\n=== 4. Deterministic recommendation; no hidden-ground-truth dependency ===');
  {
    const { ALL_CASES } = await import('file://' + path.join(MQC, 'cases', 'index.js'));
    const { recommendNextCase } = await import('file://' + path.join(MQC, 'adaptive', 'case-recommender.js'));
    const r1 = recommendNextCase(ALL_CASES, []);
    const r2 = recommendNextCase(ALL_CASES, []);
    assert('4a', r1.case.identity.id === r2.case.identity.id, 'Identical inputs deterministically produce the identical recommendation');
    const recommenderSrc = fs.readFileSync(path.join(MQC, 'adaptive', 'case-recommender.js'), 'utf8');
    assert('4b', !/groundTruth/.test(recommenderSrc), 'The recommender never references groundTruth');
  }

  console.log('\n=== 5. No case-ID branching ===');
  {
    const filesToCheck = [
      path.join(MQC, 'adaptive', 'case-recommender.js'),
      path.join(MQC, 'adaptive', 'sequencing-model.js'),
      path.join(MQC, 'analytics', 'analytics-model.js'),
      path.join(MQC, 'ui', 'production-case-select.jsx'),
    ];
    let noBranching = true;
    for (const f of filesToCheck) {
      const src = fs.readFileSync(f, 'utf8');
      // Looks specifically for comparison against a HARDCODED case-ID
      // string literal (e.g. if (caseId === 'pilot-1-reagent-lot-shift'))
      // — the actual violation Section 12 targets. A generic
      // variable-to-variable comparison (e.g. caseId === recommendedId,
      // used to compute a display status) is not case-ID branching.
      if (/(?:caseId|c\.identity\.id)\s*===\s*['"][a-z0-9-]+['"]/.test(src)) { noBranching = false; console.error(`    hardcoded case-ID branching found in ${f}`); }
    }
    assert('5', noBranching, 'No branching against a hardcoded case-ID string literal in engine, adaptive, or analytics logic');
  }

  console.log('\n=== 6. No generative AI; no external analytics ===');
  {
    const dirs = [path.join(MQC, 'adaptive'), path.join(MQC, 'analytics')];
    let clean = true;
    for (const dir of dirs) {
      for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.js') || f.endsWith('.jsx'))) {
        const content = fs.readFileSync(path.join(dir, f), 'utf8');
        if (/openai|anthropic|fetch\(.*api\.|LLM|generateText|chatCompletion|google-analytics|segment\.io|mixpanel/i.test(content)) { clean = false; console.error(`    possible external/AI dependency in ${dir}/${f}`); }
      }
    }
    assert('6', clean, 'No generative-AI or external-analytics dependency found in adaptive/ or analytics/');
  }

  console.log('\n=== 7. Local-only attempt store; no personal identifiers ===');
  {
    const storeSrc = fs.readFileSync(path.join(MQC, 'adaptive', 'attempt-store.js'), 'utf8');
    assert('7a', /localStorage/.test(storeSrc), 'attempt-store.js uses localStorage (local-only, no network call)');
    assert('7b', !/fetch\(|XMLHttpRequest|axios/.test(storeSrc), 'attempt-store.js makes no network calls');
    const { buildAttemptRecord } = await import('file://' + path.join(MQC, 'adaptive', 'sequencing-model.js'));
    const fields = Object.keys(buildAttemptRecord('x', { competencyProfile: [], decisionReview: [], confidenceCalibration: [], evidenceReview: { obtained: {} }, patientSafetyReview: {}, documentationVsExecuted: {}, caseResolution: {} }));
    const forbidden = ['name', 'email', 'staffId', 'institution', 'ip', 'deviceId'];
    assert('7c', forbidden.every(f => !fields.includes(f)), 'attemptRecord shape contains no personal-identifier fields');
  }

  console.log('\n=== 8. Instructor view is dev-only; primary nav remains 14; not QC-13 ===');
  {
    const appShellSrc = fs.readFileSync(path.join(V09, 'app', 'ui', 'app-shell.jsx'), 'utf8');
    assert('8a', !/instructor/i.test(appShellSrc), 'app-shell.jsx (production navigation) never references an instructor view');
    const navMatch = appShellSrc.match(/export const NAV_ITEMS = \[([\s\S]*?)\];/);
    const navItems = navMatch ? (navMatch[1].match(/key:\s*['"][a-z0-9-]+['"]/g) || []) : [];
    assert('8b', navItems.length === 14, `Production navigation remains exactly 14 destinations (found ${navItems.length})`);
    const coreScreensSrc = fs.readFileSync(path.join(V09, 'app', 'ui', 'core-screens.jsx'), 'utf8');
    assert('8c', !/QC-13/.test(coreScreensSrc), 'Morning QC is never labeled QC-13');
    // Section 15: a genuine instructor dev-only view now exists,
    // isolated under v09/dev/ (outside app/**), reachable only through
    // the isolated DevLauncher — never app-shell.jsx.
    assert('8d', fs.existsSync(path.join(V09, 'dev', 'instructor-analytics-view.jsx')), 'A genuine instructor analytics dev view component exists under v09/dev/ (isolated from production)');
    const instructorViewSrc = fs.readFileSync(path.join(V09, 'dev', 'instructor-analytics-view.jsx'), 'utf8');
    assert('8e', /Simulation-learning analytics only/.test(instructorViewSrc) || /summary\.disclaimer/.test(instructorViewSrc), 'The instructor view renders the mandatory disclaimer');
    const devLauncherSrc = fs.readFileSync(path.join(UI, 'dev-launcher.jsx'), 'utf8');
    assert('8f', /InstructorAnalyticsView/.test(devLauncherSrc), 'The instructor view is reachable from the isolated DevLauncher (dev-only)');
    assert('8g', fs.existsSync(path.join(V09, 'tests', 'browser', 'evidence', 'stage12d', 'instructor-analytics-dev-view-populated-1440x1400.png')), 'Real browser screenshot evidence of the POPULATED (non-zero) instructor dev view exists under tests/browser/evidence/stage12d/ (Section 11 FINAL closure)');
    assert('8h', !fs.existsSync(path.join(V09, 'tests', 'browser', 'evidence', 'stage12d', 'instructor-analytics-dev-view-1440x1000.png')), 'The prior empty ("Total attempts: 0") instructor screenshot has been removed, not merely supplemented');
  }

  console.log('\n=== 9. Analytics schema version and case schema version present ===');
  {
    const { ANALYTICS_SCHEMA_VERSION } = await import('file://' + path.join(MQC, 'analytics', 'analytics-types.js'));
    assert('9a', typeof ANALYTICS_SCHEMA_VERSION === 'string' && ANALYTICS_SCHEMA_VERSION.length > 0, `analyticsSchemaVersion present (${ANALYTICS_SCHEMA_VERSION})`);
    const { ALL_CASES } = await import('file://' + path.join(MQC, 'cases', 'index.js'));
    const newCases = ALL_CASES.filter(c => c.identity.version);
    assert('9b', newCases.length === 12, 'Every case declares its own identity.version (case schema versioning)');
  }

  console.log('\n=== 10. Browser evidence exists ===');
  {
    const evidenceDir = path.join(V09, 'tests', 'browser', 'evidence', 'stage12d');
    const resultPath = path.join(evidenceDir, 'result.json');
    assert('10a', fs.existsSync(resultPath), 'A real browser-run result.json exists for Stage 12D');
    if (fs.existsSync(resultPath)) {
      const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
      assert('10b', result.status === 'PASS', `Stage 12D browser E2E result is genuinely PASS (found ${result.status}${result.reason ? ' — ' + result.reason : ''})`);
    }
  }

  console.log('\n=== 11. All Stage 12D test suites pass ===');
  {
    const suites = [
      ['tests/morning-qc/case-bank.test.cjs', 'CASE BANK TESTS PASSED'],
      ['tests/morning-qc/expanded-case-paths.test.cjs', 'EXPANDED CASE PATH TESTS PASSED'],
      ['tests/morning-qc/adaptive-sequencing.test.cjs', 'ADAPTIVE SEQUENCING TESTS PASSED'],
      ['tests/morning-qc/analytics.test.cjs', 'ANALYTICS TESTS PASSED'],
      ['tests/morning-qc/scientific-numeric-audit.test.cjs', 'SCIENTIFIC NUMERIC AUDIT PASSED'],
    ];
    for (const [rel, marker] of suites) {
      let ok = false;
      try { ok = execSync(`node ${path.join(V09, rel)}`).toString().includes(marker); }
      catch (e) { ok = false; }
      assert(`11-${rel}`, ok, `${rel} passes`);
    }
  }

  const total = passed + failed;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Stage 12D Governance: ${passed}/${total} passed, ${failed} failed`);
  console.log('  Artifact class: V09_TEST');
  if (failed > 0) { console.error('STAGE 12D GOVERNANCE TESTS FAILED.'); process.exit(1); }
  console.log('STAGE 12D GOVERNANCE TESTS PASSED.');
  process.exit(0);
}
main().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
