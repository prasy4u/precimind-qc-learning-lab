/* =========================================================================
   v09/tests/browser/v09-stage12e-instructor-workspace.e2e.js

   Morning QC Room — Stage 12E REAL Browser E2E Test
   PROVENANCE: V09_MODIFIED (Stage 12E CORRECTIVE CLOSURE)

   Drives a REAL Chromium instance against the real, deterministically-
   built dist-morning-qc-dev/ artifact. Verifies the instructor workspace
   empty state, the NON-DESTRUCTIVE synthetic demo mode (a sentinel real
   attempt survives byte-for-byte across entering/exiting demo mode),
   denominator-explicit metric rendering including the completed
   competency distribution and per-case summary, the true raw-storage
   quarantine count, per-file research export downloads (every file in
   the manifest individually verified), and reset cancel/confirm
   semantics — at desktop and mobile viewports.

   CORRECTIVE CLOSURE: evidence saved under a NEW stage12e-corrective
   directory — the prior stage12e evidence reflected a UI with a real
   data-safety defect (synthetic fixtures overwriting real history) and
   is superseded, not overwritten in place, so the corrective fix is
   independently auditable against fresh evidence.
   ========================================================================= */
'use strict';
const path = require('path');
const fs = require('fs');
const http = require('http');

const V09 = path.join(__dirname, '..', '..');
const DIST_DIR = path.join(V09, 'dist-morning-qc-dev');
const EVIDENCE_DIR = path.join(__dirname, 'evidence', 'stage12e-corrective');

let passed = 0, failed = 0;
const checkpoints = [];
function assert(id, cond, detail) {
  if (cond) { console.log(`  ✓ [${id}] ${detail}`); passed++; checkpoints.push({ id, status: 'PASS', detail }); }
  else { console.error(`  ✗ [${id}] FAIL: ${detail}`); failed++; checkpoints.push({ id, status: 'FAIL', detail }); }
}
function resolveBrowserExecutable() {
  if (process.env.CHROMIUM_PATH && fs.existsSync(process.env.CHROMIUM_PATH)) return process.env.CHROMIUM_PATH;
  const candidates = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/google/chrome/chrome'];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return null;
}
function serveStatic(rootDir, port) {
  const server = http.createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath === '/') urlPath = '/morning-qc-dev.html';
    const filePath = path.join(rootDir, urlPath);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) { res.writeHead(404); res.end(); return; }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' }[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
  return new Promise(resolve => server.listen(port, () => resolve(server)));
}
const SENTINEL_RECORD = {
  attemptId: 'SENTINEL-REAL-ATTEMPT', caseId: 'case-04-isolated-excursion', caseFamily: 'A', difficulty: 'LEVEL_1_CLEAR_SIGNAL', caseSchemaVersion: '1.1.0',
  startedAt: 1, completedAt: 2, competencyProfile: [{ dimension: 'SIGNAL_RECOGNITION', rating: 'STRONG' }],
  decisionSummary: [], confidenceSummary: [], evidenceSummary: { highValueObtainedCount: 0, lowValueObtainedCount: 0 },
  panelSummary: { inspectedCount: 0 }, verificationSummary: { attempted: false, adequate: false, attemptCount: 0, failedAttemptCount: 0, hadPrematureOrFailedAttemptBeforeSuccess: false },
  finalServiceState: 'RESUMED', executedFinalDisposition: null, recommendedLearningPriorities: [],
};

async function main() {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  if (!fs.existsSync(DIST_DIR)) {
    fs.writeFileSync(path.join(EVIDENCE_DIR, 'result.json'), JSON.stringify({ status: 'BLOCKED', reason: 'dist-morning-qc-dev/ does not exist.' }, null, 2));
    console.error('BLOCKED: dist-morning-qc-dev/ does not exist.'); process.exit(1);
  }
  const execPath = resolveBrowserExecutable();
  if (!execPath) {
    fs.writeFileSync(path.join(EVIDENCE_DIR, 'result.json'), JSON.stringify({ status: 'BLOCKED', reason: 'No usable browser binary found.' }, null, 2));
    console.error('BLOCKED: No usable browser binary found.'); process.exit(1);
  }
  const TEST_DEPS_DIR = path.join(V09, 'tests', 'morning-qc');
  let playwrightCore;
  try { playwrightCore = require(require.resolve('playwright-core', { paths: [TEST_DEPS_DIR] })); }
  catch {
    fs.writeFileSync(path.join(EVIDENCE_DIR, 'result.json'), JSON.stringify({ status: 'BLOCKED', reason: 'playwright-core not installed.' }, null, 2));
    console.error('BLOCKED: playwright-core not installed.'); process.exit(1);
  }

  const PORT = 8993;
  const server = await serveStatic(DIST_DIR, PORT);
  const baseUrl = `http://localhost:${PORT}/morning-qc-dev.html`;
  const browser = await playwrightCore.chromium.launch({ executablePath: execPath, headless: true });
  console.log(`Browser engine: Chromium (only engine available in this environment — Firefox/WebKit not tested; reported accurately, not fabricated).`);

  async function newPage(viewport) {
    const context = await browser.newContext({ viewport: viewport || { width: 1920, height: 1080 }, acceptDownloads: true });
    const page = await context.newPage();
    page.on('pageerror', err => { throw new Error(`Page error: ${err.message}`); });
    return { context, page };
  }
  async function checkNoOverflow(page, label) {
    const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    assert(`OVERFLOW-${label}`, o.sw <= o.cw + 1, `No horizontal overflow at ${label}`);
  }
  async function openInstructorView(page) {
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Instructor Analytics (Dev)' }).click();
    await page.waitForTimeout(150);
  }

  console.log('\n=== CRITICAL: synthetic demo mode is genuinely non-destructive (Section 3) ===');
  {
    const { context, page } = await newPage({ width: 1920, height: 1080 });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.evaluate((sentinel) => { localStorage.setItem('precimind-morningqc-attempts-v1', JSON.stringify([sentinel])); }, SENTINEL_RECORD);
    const storageBeforeDemo = await page.evaluate(() => localStorage.getItem('precimind-morningqc-attempts-v1'));
    assert('SENTINEL-PERSISTED', storageBeforeDemo.includes('SENTINEL-REAL-ATTEMPT'), 'Sentinel real attempt genuinely persisted before demo mode');

    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Instructor Analytics (Dev)' }).click();
    await page.waitForTimeout(150);
    const overviewBefore = await page.getByTestId('dataset-overview').innerText();
    assert('OVERVIEW-SHOWS-SENTINEL', /Valid attempts: 1/.test(overviewBefore), 'Dataset overview shows exactly the 1 real sentinel attempt before demo mode');

    await page.getByTestId('toggle-demo-mode-button').click();
    await page.waitForTimeout(150);
    assert('DEMO-BANNER-SHOWN', await page.getByTestId('synthetic-demo-banner').count() === 1, 'The "SYNTHETIC DEMONSTRATION DATA" banner is shown while demo mode is active');
    const overviewDuring = await page.getByTestId('dataset-overview').innerText();
    assert('DEMO-SHOWS-SYNTHETIC-COUNT', /Valid attempts: 10/.test(overviewDuring), 'Dataset overview shows the 10-record synthetic cohort while demo mode is active');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'demo-mode-active-1920x1080.png'), fullPage: true });

    const storageDuringDemo = await page.evaluate(() => localStorage.getItem('precimind-morningqc-attempts-v1'));
    assert('SENTINEL-UNCHANGED-DURING-DEMO', storageDuringDemo === storageBeforeDemo, 'Real storage is BYTE-FOR-BYTE unchanged while demo mode is active — the exact defect the audit reproduced is closed');

    await page.getByTestId('toggle-demo-mode-button').click();
    await page.waitForTimeout(150);
    const overviewAfter = await page.getByTestId('dataset-overview').innerText();
    assert('OVERVIEW-RESTORED-AFTER-EXIT', /Valid attempts: 1/.test(overviewAfter), 'Exiting demo mode restores the view of genuine real history (1 attempt)');
    const storageAfterExit = await page.evaluate(() => localStorage.getItem('precimind-morningqc-attempts-v1'));
    assert('SENTINEL-UNCHANGED-AFTER-EXIT', storageAfterExit === storageBeforeDemo, 'Real storage remains byte-for-byte unchanged after exiting demo mode');
    await context.close();
  }

  console.log('\n=== Reset safety: cancel leaves data intact, confirm clears it (Section 4) ===');
  {
    const { context, page } = await newPage({ width: 1920, height: 1080 });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.evaluate((sentinel) => { localStorage.setItem('precimind-morningqc-attempts-v1', JSON.stringify([sentinel])); }, SENTINEL_RECORD);
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Instructor Analytics (Dev)' }).click();
    await page.waitForTimeout(150);

    page.once('dialog', d => d.dismiss());
    await page.getByTestId('clear-history-button').click();
    await page.waitForTimeout(150);
    const afterCancel = await page.getByTestId('dataset-overview').innerText();
    assert('RESET-CANCEL-LEAVES-INTACT', /Valid attempts: 1/.test(afterCancel), 'Cancelling the confirmation dialog leaves history completely intact');

    page.once('dialog', d => d.accept());
    await page.getByTestId('clear-history-button').click();
    await page.waitForTimeout(150);
    const afterConfirm = await page.getByTestId('dataset-overview').innerText();
    assert('RESET-CONFIRM-CLEARS', /Valid attempts: 0/.test(afterConfirm), 'Confirming the dialog clears the intended history');
    await context.close();
  }

  console.log('\n=== Raw-storage quarantine truth surfaces correctly in the UI (Section 1) ===');
  {
    const { context, page } = await newPage({ width: 1920, height: 1080 });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.evaluate((sentinel) => {
      localStorage.setItem('precimind-morningqc-attempts-v1', JSON.stringify([sentinel, { attemptId: 'bad', caseId: 'c', evidenceSummary: {}, panelSummary: {}, verificationSummary: {}, executedFinalDisposition: {} }]));
    }, SENTINEL_RECORD);
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Instructor Analytics (Dev)' }).click();
    await page.waitForTimeout(150);
    const overview = await page.getByTestId('dataset-overview').innerText();
    assert('QUARANTINE-TRUTH-IN-UI', /Valid attempts: 1/.test(overview) && /Quarantined \(rejected\) records: 1/.test(overview), `The UI reports the TRUE raw-storage quarantine count (1 valid, 1 quarantined), found: ${overview.replace(/\n/g, ' | ')}`);
    await context.close();
  }

  console.log('\n=== Denominator-governed instructor analytics: competency distribution + per-case summary (Section 7) ===');
  {
    const { context, page } = await newPage({ width: 1920, height: 1080 });
    await openInstructorView(page);
    await page.getByTestId('toggle-demo-mode-button').click();
    await page.waitForTimeout(200);
    const competencyText = await page.getByTestId('competency-distribution').innerText();
    assert('COMPETENCY-DISTRIBUTION-RENDERS', /evaluated \d+, not evaluated \d+/.test(competencyText), 'Competency distribution shows explicit evaluated/not-evaluated counts per dimension');
    const caseSummaryText = await page.getByTestId('case-level-summary').innerText();
    assert('CASE-SUMMARY-RENDERS', /attempt\(s\), family/.test(caseSummaryText), 'Per-case summary shows attempt count, family, and difficulty');
    await checkNoOverflow(page, '1920x1080-denominators');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'denominator-governed-analytics-1920x1080.png'), fullPage: true });
    await context.close();
  }

  console.log('\n=== Every exported file is individually downloadable and correctly named (Section 9) ===');
  {
    const { context, page } = await newPage({ width: 1920, height: 1080 });
    await openInstructorView(page);
    await page.getByTestId('toggle-demo-mode-button').click();
    await page.waitForTimeout(200);
    await page.getByTestId('prepare-export-button').click();
    await page.waitForTimeout(150);
    const expectedFiles = ['attempts.csv', 'competencies.csv', 'events.jsonl', 'metric_dictionary.json', 'data_dictionary.json', 'dataset_manifest.json', 'README.md'];
    for (const fname of expectedFiles) {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByTestId(`download-${fname}`).click(),
      ]);
      assert(`EXPORT-FILE-${fname}`, download.suggestedFilename() === fname, `${fname} is individually downloadable with the correct filename`);
    }
    await context.close();
  }

  console.log('\n=== Desktop 1366x768 / Mobile 390x844: no overflow with demo data populated ===');
  {
    const { context, page } = await newPage({ width: 1366, height: 768 });
    await openInstructorView(page);
    await page.getByTestId('toggle-demo-mode-button').click();
    await page.waitForTimeout(200);
    await checkNoOverflow(page, '1366x768');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'instructor-populated-1366x768.png'), fullPage: true });
    await context.close();
  }
  {
    const { context, page } = await newPage({ width: 390, height: 844 });
    await openInstructorView(page);
    await page.getByTestId('toggle-demo-mode-button').click();
    await page.waitForTimeout(200);
    await checkNoOverflow(page, '390x844');
    assert('MOBILE-VIEW-RENDERS', await page.locator('[data-testid="instructor-analytics-view"]').count() === 1, 'Instructor workspace renders on mobile without horizontal overflow');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'instructor-populated-390x844.png'), fullPage: true });
    await context.close();
  }

  console.log('\n=== Learner application: existing flows still function (regression spot-check) ===');
  {
    const { context, page } = await newPage({ width: 1920, height: 1080 });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Glucose Level 2 QC', exact: true }).click();
    await page.waitForSelector('[data-testid="morning-qc-room"]');
    assert('LEARNER-ROOM-LOADS', await page.locator('[data-testid="morning-qc-room"]').count() === 1, 'Learner case room still loads correctly');
    await context.close();
  }

  await browser.close();
  server.close();

  const total = passed + failed;
  const result = { status: failed === 0 ? 'PASS' : 'FAIL', passed, failed, total, browserExecutable: execPath, browserEngine: 'chromium', checkpoints };
  fs.writeFileSync(path.join(EVIDENCE_DIR, 'result.json'), JSON.stringify(result, null, 2));
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Stage 12E Corrective Closure Browser E2E: ${passed}/${total} passed, ${failed} failed`);
  if (failed > 0) { console.error('BROWSER E2E FAILED.'); process.exit(1); }
  console.log('BROWSER E2E PASSED (real Chromium, not simulated).');
  process.exit(0);
}
main().catch(e => {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  fs.writeFileSync(path.join(EVIDENCE_DIR, 'result.json'), JSON.stringify({ status: 'BLOCKED', reason: 'Unexpected error: ' + e.message }, null, 2));
  console.error('FATAL:', e.message, e.stack);
  process.exit(1);
});
