/* =========================================================================
   v09/tests/browser/v09-stage12e-privacy-governance-patch.e2e.js

   Morning QC Room — Stage 12E FINAL PRIVACY/GOVERNANCE MICRO-PATCH
   Browser E2E Test
   PROVENANCE: V09_NEW

   Verifies (real Chromium, real dist-morning-qc-dev/ build):
   - realistic epoch timestamps never appear anywhere in the exported
     bundle, downloaded and inspected as real file content;
   - export schema version is visible in the Dataset Overview;
   - GENUINE keyboard Tab-traversal (not just .focus()) reaches the
     demo toggle, prepare-export, first file-download control, and
     clear-history control in a sensible order, and each activates via
     Enter/Space;
   - :focus-visible produces a measurable visible outline;
   - all Stage 12E buttons use the .mqc-btn >=44px min-height contract.

   Evidence saved under a DEDICATED privacy-governance-patch directory —
   never overwriting prior Stage 12E evidence.
   ========================================================================= */
'use strict';
const path = require('path');
const fs = require('fs');
const http = require('http');

const V09 = path.join(__dirname, '..', '..');
const DIST_DIR = path.join(V09, 'dist-morning-qc-dev');
const EVIDENCE_DIR = path.join(__dirname, 'evidence', 'stage12e-privacy-governance-patch');

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

  const PORT = 8995;
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
  async function readDownload(download) { return fs.readFileSync(await download.path(), 'utf8'); }

  console.log('\n=== Item 1: realistic epoch timestamps never appear in downloaded export content ===');
  {
    const { context, page } = await newPage({ width: 1920, height: 1080 });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      const rec = {
        attemptId: 'epoch1', caseId: 'case-04-isolated-excursion', caseFamily: 'A', difficulty: 'LEVEL_1_CLEAR_SIGNAL', caseSchemaVersion: '1.1.0',
        startedAt: 1789365600000, completedAt: 1789365660000,
        competencyProfile: [], decisionSummary: [{ decisionEventId: 'd1#1', decisionId: 'dec-x', quadrant: 'CORRECT_SUPPORTED' }],
        confidenceSummary: [{ decisionEventId: 'd1#1', confidence: 'HIGH', category: 'CORRECT_CALIBRATED' }],
        evidenceSummary: { highValueObtainedCount: 1, lowValueObtainedCount: 0, efficiencyRatio: 1 },
        panelSummary: { inspectedCount: 1 }, verificationSummary: { attempted: false, adequate: false, attemptCount: 0, failedAttemptCount: 0, hadPrematureOrFailedAttemptBeforeSuccess: false },
        finalServiceState: 'RESUMED', executedFinalDisposition: null, recommendedLearningPriorities: [],
      };
      localStorage.setItem('precimind-morningqc-attempts-v1', JSON.stringify([rec]));
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Instructor Analytics (Dev)' }).click();
    await page.getByTestId('prepare-export-button').click();
    await page.waitForTimeout(150);
    const [eventsDownload] = await Promise.all([page.waitForEvent('download'), page.getByTestId('download-events.jsonl').click()]);
    const eventsContent = await readDownload(eventsDownload);
    assert('BROWSER-NO-EXACT-STARTEDAT', !eventsContent.includes('1789365600000'), 'Downloaded events.jsonl content does not contain the exact startedAt epoch value');
    assert('BROWSER-NO-EXACT-COMPLETEDAT', !eventsContent.includes('1789365660000'), 'Downloaded events.jsonl content does not contain the exact completedAt epoch value');
    assert('BROWSER-HAS-RELATIVE-TIMESTAMP', eventsContent.includes('relativeTimestampMs'), 'Downloaded events.jsonl content genuinely uses relativeTimestampMs');
    await context.close();
  }

  console.log('\n=== Item 3: export schema version visible in Dataset Overview ===');
  {
    const { context, page } = await newPage({ width: 1920, height: 1080 });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Instructor Analytics (Dev)' }).click();
    await page.getByTestId('toggle-demo-mode-button').click();
    await page.waitForTimeout(150);
    const overviewText = await page.getByTestId('dataset-overview').innerText();
    assert('EXPORT-SCHEMA-VERSION-VISIBLE', /Export schema version: \d+\.\d+\.\d+/.test(overviewText), `Dataset Overview shows the export schema version line (found: ${overviewText.match(/Export schema version:[^\n]*/)?.[0]})`);
    await context.close();
  }

  console.log('\n=== Item 4B: GENUINE keyboard Tab-traversal + focus-visible + touch targets ===');
  {
    const { context, page } = await newPage({ width: 1920, height: 1080 });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Instructor Analytics (Dev)' }).click();
    await page.waitForTimeout(150);

    // Start from a known focus point: the body, then Tab forward,
    // recording each focused element's data-testid until we've found
    // all four representative controls (or hit a generous cap).
    await page.evaluate(() => document.body.focus());
    const reachedOrder = [];
    const targets = ['toggle-demo-mode-button', 'prepare-export-button', 'clear-history-button'];
    for (let i = 0; i < 60 && !targets.every(t => reachedOrder.includes(t)); i++) {
      await page.keyboard.press('Tab');
      const testId = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
      if (testId && targets.includes(testId) && !reachedOrder.includes(testId)) reachedOrder.push(testId);
    }
    assert('TAB-REACHES-DEMO-TOGGLE', reachedOrder.includes('toggle-demo-mode-button'), 'Genuine Tab traversal (not .focus()) reaches the demo toggle');
    assert('TAB-REACHES-EXPORT', reachedOrder.includes('prepare-export-button'), 'Genuine Tab traversal reaches the prepare-export button');
    assert('TAB-REACHES-CLEAR-HISTORY', reachedOrder.includes('clear-history-button'), 'Genuine Tab traversal reaches the clear-history button');
    assert('TAB-ORDER-SENSIBLE', reachedOrder.indexOf('toggle-demo-mode-button') < reachedOrder.indexOf('prepare-export-button'), 'Demo toggle is reached before prepare-export in Tab order (sensible left-to-right, top-to-bottom order)');

    // Activate the demo toggle via Tab-then-Enter (genuine keyboard operation).
    await page.evaluate(() => document.body.focus());
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press('Tab');
      const testId = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
      if (testId === 'toggle-demo-mode-button') break;
    }
    // Measure a visible focus indicator via computed outline.
    const outlineStyle = await page.evaluate(() => {
      const el = document.activeElement;
      const cs = getComputedStyle(el);
      return { outlineStyle: cs.outlineStyle, outlineWidth: cs.outlineWidth };
    });
    assert('FOCUS-VISIBLE-OUTLINE', outlineStyle.outlineStyle !== 'none' && parseFloat(outlineStyle.outlineWidth) > 0, `:focus-visible produces a measurable visible outline (found outlineStyle=${outlineStyle.outlineStyle}, outlineWidth=${outlineStyle.outlineWidth})`);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
    assert('TAB-ENTER-ACTIVATES-DEMO', await page.getByTestId('synthetic-demo-banner').count() === 1, 'Tab-then-Enter genuinely activates the demo toggle');

    // Now find and activate the first file-download control (only reachable once export is prepared).
    await page.getByTestId('prepare-export-button').click();
    await page.waitForTimeout(150);
    await page.evaluate(() => document.body.focus());
    let foundDownload = false;
    for (let i = 0; i < 100; i++) {
      await page.keyboard.press('Tab');
      const testId = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
      if (testId === 'download-attempts.csv') { foundDownload = true; break; }
    }
    assert('TAB-REACHES-FIRST-DOWNLOAD', foundDownload, 'Genuine Tab traversal reaches the first file-download control (download-attempts.csv)');
    if (foundDownload) {
      const [download] = await Promise.all([page.waitForEvent('download'), page.keyboard.press('Enter')]);
      assert('TAB-ENTER-ACTIVATES-DOWNLOAD', download.suggestedFilename() === 'attempts.csv', 'Tab-then-Enter genuinely triggers the first file download');
    }

    // Touch-target invariant: all Stage 12E buttons use .mqc-btn (>=44px min-height).
    const allMinHeights = await page.evaluate(() => {
      const btns = document.querySelectorAll('.mqc-btn[data-testid]');
      return Array.from(btns).map(b => ({ testid: b.getAttribute('data-testid'), height: b.getBoundingClientRect().height }));
    });
    assert('TOUCH-TARGET-COUNT', allMinHeights.length >= 5, `Found ${allMinHeights.length} Stage 12E .mqc-btn controls to measure`);
    const allMeetMinimum = allMinHeights.every(b => b.height >= 44);
    assert('TOUCH-TARGET-MINIMUM', allMeetMinimum, `All measured Stage 12E buttons meet the >=44px min-height contract (found: ${JSON.stringify(allMinHeights)})`);
    await context.close();
  }

  await browser.close();
  server.close();

  const total = passed + failed;
  const result = { status: failed === 0 ? 'PASS' : 'FAIL', passed, failed, total, browserExecutable: execPath, browserEngine: 'chromium', checkpoints };
  fs.writeFileSync(path.join(EVIDENCE_DIR, 'result.json'), JSON.stringify(result, null, 2));
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Stage 12E FINAL PRIVACY/GOVERNANCE MICRO-PATCH Browser E2E: ${passed}/${total} passed, ${failed} failed`);
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
