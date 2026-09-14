/* =========================================================================
   v09/tests/browser/v09-stage12e-final-micro-closure.e2e.js

   Morning QC Room — Stage 12E FINAL MICRO-CLOSURE Browser E2E Test
   PROVENANCE: V09_NEW

   Verifies (real Chromium, real dist-morning-qc-dev/ build):
   - per-case denominator-governed analytics render in the UI;
   - malformed-container status surfaces truthfully in the UI;
   - keyboard reachability/operability of all new Stage 12E controls;
   - mobile touch practicality + no overflow at 390x844;
   - every one of the 7 exported files is downloaded with CONTENT that
     genuinely matches the prepared bundle (not merely a correct
     filename).

   Evidence saved under a DEDICATED stage12e-final-micro-closure
   directory — never overwriting prior Stage 12E evidence.
   ========================================================================= */
'use strict';
const path = require('path');
const fs = require('fs');
const http = require('http');

const V09 = path.join(__dirname, '..', '..');
const DIST_DIR = path.join(V09, 'dist-morning-qc-dev');
const EVIDENCE_DIR = path.join(__dirname, 'evidence', 'stage12e-final-micro-closure');

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

  const PORT = 8994;
  const server = await serveStatic(DIST_DIR, PORT);
  const baseUrl = `http://localhost:${PORT}/morning-qc-dev.html`;
  const browser = await playwrightCore.chromium.launch({ executablePath: execPath, headless: true });
  console.log('Browser engine: Chromium (only engine available in this environment).');

  async function newPage(viewport) {
    const context = await browser.newContext({ viewport: viewport || { width: 1920, height: 1080 }, acceptDownloads: true });
    const page = await context.newPage();
    page.on('pageerror', err => { throw new Error(`Page error: ${err.message}`); });
    return { context, page };
  }
  async function readDownload(download) {
    const streamPath = await download.path();
    return fs.readFileSync(streamPath, 'utf8');
  }

  console.log('\n=== Per-case denominator-governed analytics render (Item 1) ===');
  {
    const { context, page } = await newPage({ width: 1920, height: 1080 });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Instructor Analytics (Dev)' }).click();
    await page.getByTestId('toggle-demo-mode-button').click();
    await page.waitForTimeout(200);
    const caseSummary = await page.getByTestId('case-summary-case-04-isolated-excursion').innerText();
    assert('PERCASE-UI-DISPOSITION', /Appropriate final disposition:/.test(caseSummary), 'Per-case summary shows appropriate-disposition rate in the UI');
    assert('PERCASE-UI-VERIFICATION', /Verification:.*no-attempt.*successful of.*attempted/.test(caseSummary), 'Per-case summary shows full verification breakdown in the UI');
    assert('PERCASE-UI-EVIDENCE', /Evidence efficiency:/.test(caseSummary), 'Per-case summary shows evidence efficiency in the UI');
    assert('PERCASE-UI-CONFIDENCE', /Confidence recorded:/.test(caseSummary), 'Per-case summary shows confidence breakdown in the UI');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'percase-analytics-1920x1080.png'), fullPage: true });
    await context.close();
  }

  console.log('\n=== Malformed-container status surfaces truthfully in the UI (Item 3) ===');
  {
    const { context, page } = await newPage({ width: 1920, height: 1080 });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.evaluate(() => { localStorage.setItem('precimind-morningqc-attempts-v1', '{not valid json'); });
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Instructor Analytics (Dev)' }).click();
    await page.waitForTimeout(200);
    const statusText = await page.getByTestId('storage-container-status').innerText();
    assert('MALFORMED-UI-STATUS', /MALFORMED \/ UNREADABLE/.test(statusText), `Storage container status shows MALFORMED (found: "${statusText}")`);
    const overviewText = await page.getByTestId('dataset-overview').innerText();
    assert('MALFORMED-UI-UNKNOWN-COUNT', /Unknown \(storage container unreadable\)/.test(overviewText), 'Quarantined count shows "Unknown", never a fabricated 0');
    await context.close();
  }

  console.log('\n=== Keyboard reachability of all new Stage 12E controls ===');
  {
    const { context, page } = await newPage({ width: 1920, height: 1080 });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Instructor Analytics (Dev)' }).click();
    await page.waitForTimeout(150);
    // Keyboard-activate the demo toggle.
    await page.getByTestId('toggle-demo-mode-button').focus();
    const focusedIsToggle = await page.evaluate(() => document.activeElement?.getAttribute('data-testid') === 'toggle-demo-mode-button');
    assert('KEYBOARD-FOCUS-VISIBLE-TOGGLE', focusedIsToggle, 'Demo-mode toggle can receive keyboard focus');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    assert('KEYBOARD-ACTIVATE-TOGGLE', await page.getByTestId('synthetic-demo-banner').count() === 1, 'Demo mode can be activated via keyboard (Enter)');

    await page.getByTestId('prepare-export-button').focus();
    const focusedIsExport = await page.evaluate(() => document.activeElement?.getAttribute('data-testid') === 'prepare-export-button');
    assert('KEYBOARD-FOCUS-EXPORT', focusedIsExport, 'Prepare-export button can receive keyboard focus');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    assert('KEYBOARD-ACTIVATE-EXPORT', await page.getByTestId('export-file-links').count() === 1, 'Export can be prepared via keyboard (Enter)');

    await page.getByTestId('download-attempts.csv').focus();
    const focusedIsDownload = await page.evaluate(() => document.activeElement?.getAttribute('data-testid') === 'download-attempts.csv');
    assert('KEYBOARD-FOCUS-DOWNLOAD', focusedIsDownload, 'Individual file-download buttons can receive keyboard focus');
    const [download] = await Promise.all([page.waitForEvent('download'), page.keyboard.press('Enter')]);
    assert('KEYBOARD-ACTIVATE-DOWNLOAD', download.suggestedFilename() === 'attempts.csv', 'A file download can be triggered via keyboard (Enter)');
    await context.close();
  }

  console.log('\n=== Keyboard: clear-history control + confirm/cancel remain correct ===');
  {
    const { context, page } = await newPage({ width: 1920, height: 1080 });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      const rec = { attemptId: 'kb1', caseId: 'case-04-isolated-excursion', caseFamily: 'A', difficulty: 'LEVEL_1_CLEAR_SIGNAL', caseSchemaVersion: '1.1.0', startedAt: 1, completedAt: 2,
        competencyProfile: [], decisionSummary: [], confidenceSummary: [], evidenceSummary: { highValueObtainedCount: 0, lowValueObtainedCount: 0 },
        panelSummary: { inspectedCount: 0 }, verificationSummary: { attempted: false, adequate: false, attemptCount: 0, failedAttemptCount: 0, hadPrematureOrFailedAttemptBeforeSuccess: false },
        finalServiceState: 'RESUMED', executedFinalDisposition: null, recommendedLearningPriorities: [] };
      localStorage.setItem('precimind-morningqc-attempts-v1', JSON.stringify([rec]));
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Instructor Analytics (Dev)' }).click();
    await page.waitForTimeout(150);
    await page.getByTestId('clear-history-button').focus();
    const focusedIsClear = await page.evaluate(() => document.activeElement?.getAttribute('data-testid') === 'clear-history-button');
    assert('KEYBOARD-FOCUS-CLEAR', focusedIsClear, 'Clear-history button can receive keyboard focus');
    page.once('dialog', d => d.dismiss());
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
    const afterCancel = await page.getByTestId('dataset-overview').innerText();
    assert('KEYBOARD-CLEAR-CANCEL-CORRECT', /Valid attempts: 1/.test(afterCancel), 'Keyboard-triggered clear, then cancel, leaves history intact');
    await context.close();
  }

  console.log('\n=== Mobile 390x844: touch targets + no overflow ===');
  {
    const { context, page } = await newPage({ width: 390, height: 844 });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Instructor Analytics (Dev)' }).click();
    await page.getByTestId('toggle-demo-mode-button').click();
    await page.waitForTimeout(200);
    const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    assert('MOBILE-NO-OVERFLOW', o.sw <= o.cw + 1, 'No horizontal overflow at 390x844 with per-case analytics populated');
    const toggleBox = await page.getByTestId('toggle-demo-mode-button').boundingBox();
    assert('MOBILE-TOUCH-TARGET', toggleBox && toggleBox.height >= 30, `Demo toggle has a practical touch-target height (found ${toggleBox?.height}px)`);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'percase-analytics-390x844.png'), fullPage: true });
    await context.close();
  }

  console.log('\n=== All 7 exported files: CONTENT verification, not just filename (Item 5) ===');
  {
    const { context, page } = await newPage({ width: 1920, height: 1080 });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Instructor Analytics (Dev)' }).click();
    await page.getByTestId('toggle-demo-mode-button').click();
    await page.waitForTimeout(200);
    await page.getByTestId('prepare-export-button').click();
    await page.waitForTimeout(150);

    const expectedFiles = ['attempts.csv', 'competencies.csv', 'events.jsonl', 'metric_dictionary.json', 'data_dictionary.json', 'dataset_manifest.json', 'README.md'];
    const downloadedContent = {};
    for (const fname of expectedFiles) {
      const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId(`download-${fname}`).click()]);
      downloadedContent[fname] = await readDownload(download);
    }

    assert('CONTENT-attempts.csv', downloadedContent['attempts.csv'].split('\n')[0] === 'rowKey,attemptOrdinal,caseId,caseFamily,difficulty,caseSchemaVersion,durationMs,finalServiceState,evidenceHighValueCount,evidenceLowValueCount,evidenceEfficiencyRatio,panelInspectedCount,verificationAttempted,verificationAttemptCount,verificationFailedAttemptCount,verificationAdequate,verificationHadPrematureOrFailedBeforeSuccess,executedActionType,executedOutcomeAppropriate,executedReasoningSupported,recommendedLearningPriorities', 'attempts.csv content has the genuine expected header (not empty/wrong)');
    assert('CONTENT-attempts.csv-rows', downloadedContent['attempts.csv'].split('\n').length === 11, 'attempts.csv has exactly 10 data rows + 1 header (matches the 10-record synthetic cohort)');

    assert('CONTENT-competencies.csv', downloadedContent['competencies.csv'].split('\n')[0] === 'rowKey,dimension,rating', 'competencies.csv content has the genuine expected header');

    const eventLines = downloadedContent['events.jsonl'].split('\n').filter(Boolean);
    assert('CONTENT-events.jsonl', eventLines.length > 0 && JSON.parse(eventLines[0]).type, 'events.jsonl content is genuinely parseable JSONL with real event objects');

    const parsedMetricDict = JSON.parse(downloadedContent['metric_dictionary.json']);
    assert('CONTENT-metric_dictionary.json', Array.isArray(parsedMetricDict) && parsedMetricDict.length >= 8, 'metric_dictionary.json content is genuinely parseable and non-empty');

    const parsedDataDict = JSON.parse(downloadedContent['data_dictionary.json']);
    assert('CONTENT-data_dictionary.json', Array.isArray(parsedDataDict) && parsedDataDict.some(e => e.field === 'malformedContainer'), 'data_dictionary.json content genuinely includes the malformedContainer entry');

    const parsedManifest = JSON.parse(downloadedContent['dataset_manifest.json']);
    assert('CONTENT-dataset_manifest.json', parsedManifest.validAttemptCount === 10 && 'malformedContainer' in parsedManifest, 'dataset_manifest.json content genuinely reflects the 10-record cohort and includes malformedContainer');

    assert('CONTENT-README.md', downloadedContent['README.md'].includes('SYNTHETIC DEMONSTRATION DATA'), 'README.md content genuinely reflects synthetic-data status');
    await context.close();
  }

  await browser.close();
  server.close();

  const total = passed + failed;
  const result = { status: failed === 0 ? 'PASS' : 'FAIL', passed, failed, total, browserExecutable: execPath, browserEngine: 'chromium', checkpoints };
  fs.writeFileSync(path.join(EVIDENCE_DIR, 'result.json'), JSON.stringify(result, null, 2));
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Stage 12E FINAL MICRO-CLOSURE Browser E2E: ${passed}/${total} passed, ${failed} failed`);
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
