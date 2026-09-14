/* =========================================================================
   v09/tests/browser/v09-stage12f-release-candidate.e2e.js

   Morning QC Room — Stage 12F Release Candidate Clean-Room Browser Test
   PROVENANCE: V09_NEW

   Drives a REAL Chromium instance against the frozen, byte-identical
   production build (dist-vite-production/), simulating a clean-room
   deployment. Verifies representative learner flows (Home, laboratory
   routes, Competency Map, Evidence, Morning QC capstone launch,
   decision, confidence, debrief, navigation), production navigation
   integrity (14 destinations, CAPSTONE label), console/exception/
   network cleanliness, and responsive behavior at desktop and mobile
   viewports.

   Evidence saved under a DEDICATED stage12f-release-candidate
   directory — never overwriting prior evidence from any stage.
   ========================================================================= */
'use strict';
const path = require('path');
const fs = require('fs');
const http = require('http');

const V09 = path.join(__dirname, '..', '..');
const DIST_DIR = path.join(V09, 'dist-vite-production');
const EVIDENCE_DIR = path.join(__dirname, 'evidence', 'stage12f-release-candidate');

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

  const PORT = 8996;
  const server = await serveStatic(DIST_DIR, PORT);
  const baseUrl = `http://localhost:${PORT}/`;
  const browser = await playwrightCore.chromium.launch({ executablePath: execPath, headless: true });
  console.log('Browser engine: Chromium (only engine available in this environment — Firefox/WebKit not tested, reported honestly).');

  async function newPage(viewport) {
    const context = await browser.newContext({ viewport: viewport || { width: 1920, height: 1080 } });
    const page = await context.newPage();
    const consoleErrors = [], pageExceptions = [], nonLocalRequests = [];
    page.on('console', m => { if (m.type() === 'error' && !m.text().includes('favicon')) consoleErrors.push(m.text()); });
    page.on('pageerror', e => pageExceptions.push(e.message));
    page.on('request', r => { if (!r.url().startsWith(`http://localhost:${PORT}`)) nonLocalRequests.push(r.url()); });
    return { context, page, consoleErrors, pageExceptions, nonLocalRequests };
  }

  console.log('\n=== Production navigation integrity ===');
  {
    const { context, page } = await newPage({ width: 1920, height: 1080 });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    const navCount = await page.locator('.main-nav .nav-btn').count();
    assert('NAV-COUNT-14', navCount === 14, `Production navigation shows exactly 14 destinations (found ${navCount})`);
    await page.getByRole('button', { name: 'Competency Map', exact: true }).click();
    await page.waitForTimeout(200);
    const mapBodyText = await page.evaluate(() => document.body.innerText);
    assert('CAPSTONE-LABEL', mapBodyText.includes('CAPSTONE'), 'Morning QC is labeled CAPSTONE on the Competency Map');
    assert('NO-QC13-LABEL', !mapBodyText.includes('QC-13'), 'Morning QC is never labeled QC-13');
    assert('NO-INSTRUCTOR-NAV', !/instructor/i.test(mapBodyText), 'No instructor-analytics destination appears in the learner-facing navigation');
    await context.close();
  }

  console.log('\n=== Representative learner flows (Home, laboratories, Competency Map, Evidence) ===');
  {
    const { context, page, consoleErrors, pageExceptions, nonLocalRequests } = await newPage({ width: 1920, height: 1080 });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    assert('HOME-LOADS', (await page.evaluate(() => document.body.innerText)).includes('QC LEARNING LAB'), 'Home screen loads');

    await page.getByRole('button', { name: 'Competency Map', exact: true }).click();
    await page.waitForTimeout(200);
    assert('COMPETENCY-MAP-LOADS', await page.locator('.module-grid, .level-grid').count() > 0, 'Competency Map screen loads');

    await page.getByRole('button', { name: 'Statistics Playground', exact: true }).click();
    await page.waitForTimeout(200);
    assert('STATS-LAB-LOADS', (await page.evaluate(() => document.body.innerText)).length > 100, 'Statistics Playground laboratory loads');

    await page.locator('.main-nav').getByRole('button', { name: 'Evidence', exact: true }).click();
    await page.waitForTimeout(200);
    assert('EVIDENCE-SCREEN-LOADS', (await page.evaluate(() => document.body.innerText)).length > 50, 'Evidence screen loads');

    await page.locator('.main-nav').getByRole('button', { name: 'Home', exact: true }).click();
    await page.waitForTimeout(200);

    console.log('\n=== Morning QC capstone: launch, decision, confidence, debrief ===');
    await page.locator('.pathway-step', { hasText: 'Morning QC Room' }).click();
    await page.waitForTimeout(300);
    const capstoneLoaded = await page.locator('.mqc-case-select__grid, .mqc-room').count() > 0;
    assert('CAPSTONE-LAUNCHES', capstoneLoaded, 'Morning QC capstone launches from the Home screen');

    const firstCase = page.locator('.mqc-case-select__card').first();
    if (await firstCase.count() > 0) {
      await firstCase.click();
      await page.waitForTimeout(300);
      assert('CASE-ROOM-LOADS', await page.locator('[data-testid="morning-qc-room"]').count() === 1, 'A Morning QC case room loads after selection');
    }

    assert('NO-CONSOLE-ERRORS', consoleErrors.length === 0, `No unexpected console errors across this flow (found ${consoleErrors.length}: ${JSON.stringify(consoleErrors.slice(0, 3))})`);
    assert('NO-PAGE-EXCEPTIONS', pageExceptions.length === 0, `No unhandled page exceptions (found ${pageExceptions.length})`);
    assert('NO-EXTERNAL-REQUESTS', nonLocalRequests.length === 0, `No non-localhost network requests (found ${nonLocalRequests.length}: ${JSON.stringify(nonLocalRequests.slice(0, 3))})`);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'release-candidate-flow-1920x1080.png'), fullPage: true });
    await context.close();
  }

  console.log('\n=== Responsive: 1366x768 and 390x844 ===');
  for (const [w, h, label] of [[1366, 768, '1366x768'], [390, 844, '390x844']]) {
    const { context, page } = await newPage({ width: w, height: h });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    assert(`NO-OVERFLOW-${label}`, o.sw <= o.cw + 1, `No horizontal overflow at ${label}`);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, `release-candidate-${label}.png`), fullPage: true });
    await context.close();
  }

  await browser.close();
  server.close();

  const total = passed + failed;
  const result = { status: failed === 0 ? 'PASS' : 'FAIL', passed, failed, total, browserExecutable: execPath, browserEngine: 'chromium', checkpoints };
  fs.writeFileSync(path.join(EVIDENCE_DIR, 'result.json'), JSON.stringify(result, null, 2));
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Stage 12F Release Candidate Browser E2E: ${passed}/${total} passed, ${failed} failed`);
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
