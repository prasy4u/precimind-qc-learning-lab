/* =========================================================================
   v09/tests/browser/v09-stage12e-instructor-workspace.e2e.js

   Morning QC Room — Stage 12E REAL Browser E2E Test
   PROVENANCE: V09_TEST

   Drives a REAL Chromium instance against the real, deterministically-
   built dist-morning-qc-dev/ artifact. Verifies the instructor workspace
   empty state, synthetic-fixture population, denominator-explicit
   metric rendering, research export (real file download), and reset —
   at desktop and mobile viewports. Evidence saved under a DEDICATED
   Stage 12E directory — never overwriting Stage 12B/12C historical
   evidence.
   ========================================================================= */
'use strict';
const path = require('path');
const fs = require('fs');
const http = require('http');

const V09 = path.join(__dirname, '..', '..');
const DIST_DIR = path.join(V09, 'dist-morning-qc-dev');
const EVIDENCE_DIR = path.join(__dirname, 'evidence', 'stage12e');

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

  const PORT = 8990;
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

  console.log('\n=== Desktop 1920x1080: instructor workspace empty state ===');
  {
    const { context, page } = await newPage({ width: 1920, height: 1080 });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Instructor Analytics (Dev)' }).click();
    await page.waitForTimeout(200);
    const view = page.locator('[data-testid="instructor-analytics-view"]');
    assert('EMPTY-STATE-LOADS', await view.count() === 1, 'Instructor workspace loads in its empty state');
    const overviewText = await page.getByTestId('dataset-overview').innerText();
    assert('EMPTY-STATE-ZERO', /Valid attempts: 0/.test(overviewText), 'Empty state shows zero valid attempts, not fabricated data');
    await checkNoOverflow(page, '1920x1080-empty');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'instructor-empty-1920x1080.png') });
    await context.close();
  }

  console.log('\n=== Desktop 1920x1080: populated with synthetic fixtures ===');
  {
    const { context, page } = await newPage({ width: 1920, height: 1080 });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Instructor Analytics (Dev)' }).click();
    await page.getByTestId('load-synthetic-fixtures-button').click();
    await page.waitForTimeout(300);
    const overviewText = await page.getByTestId('dataset-overview').innerText();
    assert('POPULATED-NONZERO', /Valid attempts: 10/.test(overviewText), 'Loading synthetic fixtures populates exactly 10 valid attempts');
    const evidenceText = await page.getByTestId('evidence-use').innerText();
    assert('DENOMINATOR-EXPLICIT', /among \d+ attempts that obtained any evidence/.test(evidenceText), 'Evidence efficiency shows its real eligible-attempt denominator explicitly');
    const confidenceText = await page.getByTestId('confidence-denominator').innerText();
    assert('CONFIDENCE-DENOMINATOR-EXPLICIT', /decision\(s\) where confidence was genuinely recorded/.test(confidenceText), 'Confidence calibration shows its real recorded-confidence denominator explicitly');
    await checkNoOverflow(page, '1920x1080-populated');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'instructor-populated-1920x1080.png'), fullPage: true });

    console.log('\n=== Research export triggers a real file download ===');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('export-research-data-button').click(),
    ]);
    assert('EXPORT-DOWNLOAD-TRIGGERED', download.suggestedFilename() === 'attempts.csv', `Export triggers a real browser download (filename: ${download.suggestedFilename()})`);

    console.log('\n=== Clear learning history ===');
    await page.getByTestId('clear-history-button').click();
    await page.waitForTimeout(200);
    const clearedText = await page.getByTestId('dataset-overview').innerText();
    assert('CLEAR-RESTORES-EMPTY', /Valid attempts: 0/.test(clearedText), 'Clearing history correctly restores the empty state');
    await context.close();
  }

  console.log('\n=== Desktop 1366x768 ===');
  {
    const { context, page } = await newPage({ width: 1366, height: 768 });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Instructor Analytics (Dev)' }).click();
    await page.getByTestId('load-synthetic-fixtures-button').click();
    await page.waitForTimeout(300);
    await checkNoOverflow(page, '1366x768');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'instructor-populated-1366x768.png'), fullPage: true });
    await context.close();
  }

  console.log('\n=== Mobile 390x844 ===');
  {
    const { context, page } = await newPage({ width: 390, height: 844 });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Instructor Analytics (Dev)' }).click();
    await page.getByTestId('load-synthetic-fixtures-button').click();
    await page.waitForTimeout(300);
    await checkNoOverflow(page, '390x844');
    const view = page.locator('[data-testid="instructor-analytics-view"]');
    assert('MOBILE-VIEW-RENDERS', await view.count() === 1, 'Instructor workspace renders on mobile without horizontal overflow');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'instructor-populated-390x844.png'), fullPage: true });
    await context.close();
  }

  console.log('\n=== Learner application: existing flows still function (regression spot-check) ===');
  {
    const { context, page } = await newPage({ width: 1920, height: 1080 });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Glucose Level 2 QC', exact: true }).click();
    await page.waitForSelector('[data-testid="morning-qc-room"]');
    assert('LEARNER-ROOM-LOADS', await page.locator('[data-testid="morning-qc-room"]').count() === 1, 'Learner case room still loads correctly (dev-launcher pilot selection unaffected by Stage 12E additions)');
    await context.close();
  }

  await browser.close();
  server.close();

  const total = passed + failed;
  const result = { status: failed === 0 ? 'PASS' : 'FAIL', passed, failed, total, browserExecutable: execPath, browserEngine: 'chromium', checkpoints };
  fs.writeFileSync(path.join(EVIDENCE_DIR, 'result.json'), JSON.stringify(result, null, 2));
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Stage 12E Browser E2E: ${passed}/${total} passed, ${failed} failed`);
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
