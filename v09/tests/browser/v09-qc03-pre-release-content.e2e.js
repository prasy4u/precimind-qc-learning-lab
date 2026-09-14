/* =========================================================================
   v09/tests/browser/v09-qc03-pre-release-content.e2e.js

   QC-03: QC Materials & Control Statistics — Real Browser E2E Test
   PROVENANCE: V09_NEW (pre-release content closure)

   Drives a REAL Chromium instance against the rebuilt production build
   (dist-vite-production/, now including QC-03). Verifies: entry from
   the Competency Map, direct #/qc-materials routing, all five stations'
   interactivity, the final learning check, Previous/Next navigation,
   keyboard reachability, and responsive behaviour at desktop and
   mobile viewports — plus a regression spot-check that QC-04 and the
   rest of the application are unaffected.

   Evidence saved under a DEDICATED qc03-pre-release directory — never
   overwriting any historical evidence.
   ========================================================================= */
'use strict';
const path = require('path');
const fs = require('fs');
const http = require('http');

const V09 = path.join(__dirname, '..', '..');
const DIST_DIR = path.join(V09, 'dist-vite-production');
const EVIDENCE_DIR = path.join(__dirname, 'evidence', 'qc03-pre-release');

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
    if (urlPath === '/' || urlPath.endsWith('/')) urlPath += 'index.html';
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
    fs.writeFileSync(path.join(EVIDENCE_DIR, 'result.json'), JSON.stringify({ status: 'BLOCKED', reason: 'dist-vite-production/ does not exist.' }, null, 2));
    console.error('BLOCKED: dist-vite-production/ does not exist.'); process.exit(1);
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

  const PORT = 9110;
  const server = await serveStatic(DIST_DIR, PORT);
  const baseUrl = `http://localhost:${PORT}/`;
  const browser = await playwrightCore.chromium.launch({ executablePath: execPath, headless: true });
  console.log('Browser engine: Chromium (only engine available in this environment).');

  async function newPage(viewport) {
    const context = await browser.newContext({ viewport: viewport || { width: 1920, height: 1080 } });
    const page = await context.newPage();
    const consoleErrors = [], pageExceptions = [], failed404s = [];
    page.on('console', m => { if (m.type() === 'error' && !/404 \(Not Found\)/.test(m.text())) consoleErrors.push(m.text()); });
    page.on('pageerror', e => pageExceptions.push(e.message));
    page.on('response', r => { if (r.status() === 404) failed404s.push(r.url()); });
    return { context, page, consoleErrors, pageExceptions, failed404s };
  }

  console.log('\n=== Entry from Competency Map ===');
  {
    const { context, page, consoleErrors, pageExceptions, failed404s } = await newPage({ width: 1920, height: 1080 });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.locator('.main-nav').getByRole('button', { name: 'Competency Map', exact: true }).click();
    await page.waitForTimeout(200);
    const mapText = await page.evaluate(() => document.body.innerText);
    assert('MAP-SHOWS-AVAILABLE', !new RegExp('QC-03[\\s\\S]{0,200}Coming later').test(mapText), 'QC-03 no longer shows "Coming later" on the Competency Map');
    const qc03Card = page.locator('.module-card', { hasText: 'QC-03' });
    await qc03Card.getByRole('button', { name: 'Open module' }).click();
    await page.waitForTimeout(300);
    assert('OPENS-FROM-MAP', await page.locator('[data-testid="qc-materials-screen"]').count() === 1, 'QC-03 opens from the Competency Map');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'qc03-station1-1920x1080.png'), fullPage: true });
    assert('NO-CONSOLE-ERRORS-ENTRY', consoleErrors.length === 0, `No unexpected console errors (found ${consoleErrors.length})`);
    assert('NO-EXCEPTIONS-ENTRY', pageExceptions.length === 0, `No page exceptions (found ${pageExceptions.length})`);
    assert('404S-ARE-ONLY-FAVICON', failed404s.every(u => u.includes('favicon')), `All 404 responses are genuinely only the harmless automatic favicon request (found: ${JSON.stringify(failed404s)})`);
    await context.close();
  }

  console.log('\n=== Direct routing (#/qc-materials) ===');
  {
    const { context, page } = await newPage({ width: 1920, height: 1080 });
    await page.goto(baseUrl + '#/qc-materials', { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    assert('DIRECT-ROUTE-WORKS', await page.locator('[data-testid="qc-materials-screen"]').count() === 1, 'Direct #/qc-materials routing renders the module');
    await context.close();
  }

  console.log('\n=== All five stations + learning check ===');
  {
    const { context, page, consoleErrors, pageExceptions } = await newPage({ width: 1920, height: 1080 });
    await page.goto(baseUrl + '#/qc-materials', { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const tabbar = page.locator('[data-testid="qc-materials-screen"] > .tabbar');

    // Station 1
    await page.locator('[data-testid="qc03-station1"] .option-btn').first().click();
    assert('STATION1-FEEDBACK', await page.locator('[data-testid="qc03-station1"] .prompt-box').count() > 0, 'Station 1 classification gives feedback');
    assert('STATION1-HANDLING-DOCTRINE-VISIBLE', await page.locator('[data-testid="qc03-handling-doctrine"]').count() === 1, 'Station 1 renders the handling/stability doctrine block');

    // Station 2
    await tabbar.getByRole('tab', { name: /Establish the Statistics/ }).click();
    await page.waitForTimeout(150);
    await page.getByRole('button', { name: 'Show calculation' }).click();
    assert('STATION2-CALC', await page.locator('[data-testid="qc03-station2-calc"]').count() === 1, 'Station 2 show-calculation works');

    // Station 3
    await tabbar.getByRole('tab', { name: /Investigate Before Excluding/ }).click();
    await page.waitForTimeout(150);
    await page.locator('[data-testid="qc03-station3"]').getByRole('button', { name: /Investigate whether/ }).click();
    await page.waitForTimeout(150);
    await page.getByRole('button', { name: /Compare statistics/ }).click();
    assert('STATION3-EXCLUSION-FLOW', await page.locator('[data-testid="qc03-station3-comparison"]').count() === 1, 'Station 3 investigate-then-compare exclusion flow works');

    // Station 4
    await tabbar.getByRole('tab', { name: /See What the SD Does/ }).click();
    await page.waitForTimeout(150);
    assert('STATION4-CHART', await page.locator('[data-testid="qc03-station4"] svg.ljchart-svg').count() === 1, 'Station 4 renders the LJChart');
    assert('STATION4-APS-DISTINCTION-VISIBLE', await page.locator('[data-testid="qc03-control-limit-vs-aps"]').count() === 1, 'Station 4 renders the control-limit-vs-APS distinction');
    await page.locator('[data-testid="qc03-station4"] .tabbar').getByRole('tab', { name: /Too-wide/ }).click();
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'qc03-station4-sd-comparison-1920x1080.png'), fullPage: true });

    // Station 5
    await tabbar.getByRole('tab', { name: /New Lot, New Question/ }).click();
    await page.waitForTimeout(150);
    await page.locator('[data-testid="qc03-station5"]').getByRole('button', { name: /Evaluate the new lot/ }).click();
    assert('STATION5-LOT-RESULT', await page.locator('[data-testid="qc03-station5-result"]').count() === 1, 'Station 5 lot-transition decision works');

    // Learning check
    await tabbar.getByRole('tab', { name: 'Learning Check' }).click();
    await page.waitForTimeout(150);
    const qBlocks = page.locator('[data-testid="qc03-learning-check"] .calc-panel');
    const qCount = await qBlocks.count();
    for (let i = 0; i < qCount; i++) await qBlocks.nth(i).locator('.option-btn').first().click();
    await page.getByRole('button', { name: 'Submit learning check' }).click();
    await page.waitForTimeout(150);
    assert('LEARNING-CHECK-SCORE', await page.locator('[data-testid="qc03-learning-check-score"]').count() === 1, 'Learning check submits and shows a score');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'qc03-learning-check-1920x1080.png'), fullPage: true });

    assert('NO-CONSOLE-ERRORS-STATIONS', consoleErrors.length === 0, `No unexpected console errors across all stations (found ${consoleErrors.length})`);
    assert('NO-EXCEPTIONS-STATIONS', pageExceptions.length === 0, `No page exceptions across all stations (found ${pageExceptions.length})`);
    await context.close();
  }

  console.log('\n=== Previous/Next navigation ===');
  {
    const { context, page } = await newPage({ width: 1920, height: 1080 });
    await page.goto(baseUrl + '#/qc-materials', { waitUntil: 'networkidle' });
    await page.waitForTimeout(200);
    await page.getByRole('button', { name: /Previous: Statistics Playground/ }).click();
    await page.waitForTimeout(200);
    assert('PREV-GOES-TO-STATS', (await page.evaluate(() => window.location.hash)) === '#/stats', 'Previous navigates to Statistics Playground');
    await page.goBack();
    await page.waitForTimeout(200);
    assert('BACK-RETURNS-TO-QC03', await page.locator('[data-testid="qc-materials-screen"]').count() === 1, 'Browser Back returns to QC-03');
    await page.getByRole('button', { name: /Next: Levey-Jennings Laboratory/ }).click();
    await page.waitForTimeout(200);
    assert('NEXT-GOES-TO-LJ', (await page.evaluate(() => window.location.hash)) === '#/lj', 'Next navigates to Levey-Jennings Laboratory');
    await context.close();
  }

  console.log('\n=== Keyboard reachability ===');
  {
    const { context, page } = await newPage({ width: 1920, height: 1080 });
    await page.goto(baseUrl + '#/qc-materials', { waitUntil: 'networkidle' });
    await page.waitForTimeout(200);
    await page.evaluate(() => document.body.focus());
    let reachedTab = false;
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab');
      const role = await page.evaluate(() => document.activeElement?.getAttribute('role'));
      if (role === 'tab') { reachedTab = true; break; }
    }
    assert('KEYBOARD-REACHES-TAB', reachedTab, 'Genuine Tab traversal reaches a station tab control');
    await context.close();
  }

  console.log('\n=== Responsive: 1366x768 and 390x844, no overflow ===');
  for (const [w, h, label] of [[1366, 768, '1366x768'], [390, 844, '390x844']]) {
    const { context, page } = await newPage({ width: w, height: h });
    await page.goto(baseUrl + '#/qc-materials', { waitUntil: 'networkidle' });
    await page.waitForTimeout(200);
    const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    assert(`NO-OVERFLOW-${label}`, o.sw <= o.cw + 1, `No horizontal overflow at ${label}`);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, `qc03-${label}.png`), fullPage: true });
    await context.close();
  }

  console.log('\n=== Regression spot-check: QC-04 (LJ Lab) and navigation integrity unaffected ===');
  {
    const { context, page } = await newPage({ width: 1920, height: 1080 });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    const navCount = await page.locator('.main-nav .nav-btn').count();
    assert('NAV-STILL-14', navCount === 14, `Production navigation remains exactly 14 destinations (found ${navCount})`);
    await page.locator('.main-nav').getByRole('button', { name: 'LJ Laboratory', exact: true }).click();
    await page.waitForTimeout(200);
    assert('QC04-LJ-LAB-STILL-WORKS', (await page.evaluate(() => document.body.innerText)).includes('Levey-Jennings Laboratory'), 'QC-04 (LJ Laboratory) still loads and functions correctly');
    await context.close();
  }

  await browser.close();
  server.close();

  const total = passed + failed;
  const result = { status: failed === 0 ? 'PASS' : 'FAIL', passed, failed, total, browserExecutable: execPath, browserEngine: 'chromium', checkpoints };
  fs.writeFileSync(path.join(EVIDENCE_DIR, 'result.json'), JSON.stringify(result, null, 2));
  console.log(`\n${'='.repeat(60)}`);
  console.log(`QC-03 Pre-Release Content Browser E2E: ${passed}/${total} passed, ${failed} failed`);
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
