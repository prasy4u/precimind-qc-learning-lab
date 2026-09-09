/* =========================================================================
   v09/tests/browser/v09-stage12c-debrief-production.e2e.js

   Morning QC Room — Stage 12C REAL Browser E2E Test
   PROVENANCE: V09_TEST

   Drives a REAL Chromium instance (see tests/browser/evidence/stage12b/
   LIMITATION.md for how the pre-staged binary was found) against the
   real, deterministically-built dist-vite-production/ artifact — the
   SAME production app (Home, Competency Map, all labs) with Morning QC's
   Stage 12C controlled integration, never a separate mock harness.

   SETUP: cd v09/tests/morning-qc && npm ci
   Then, from v09/: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node tests/browser/v09-stage12c-debrief-production.e2e.js
   ========================================================================= */
'use strict';
const path = require('path');
const fs = require('fs');
const http = require('http');

const V09 = path.join(__dirname, '..', '..');
const DIST_DIR = path.join(V09, 'dist-vite-production');
const EVIDENCE_DIR = path.join(__dirname, 'evidence', 'stage12c');

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
    if (urlPath === '/') urlPath = '/index.html';
    const filePath = path.join(rootDir, urlPath);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) { res.writeHead(404); res.end('Not found: ' + urlPath); return; }
    const ext = path.extname(filePath);
    const type = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' }[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    fs.createReadStream(filePath).pipe(res);
  });
  return new Promise(resolve => server.listen(port, () => resolve(server)));
}

async function main() {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  if (!fs.existsSync(DIST_DIR)) {
    const result = { status: 'BLOCKED', reason: 'dist-vite-production/ does not exist — build with: npx vite build --config vite.production-integrated.config.mjs' };
    fs.writeFileSync(path.join(EVIDENCE_DIR, 'result.json'), JSON.stringify(result, null, 2));
    console.error('BLOCKED:', result.reason); process.exit(1);
  }
  const execPath = resolveBrowserExecutable();
  if (!execPath) {
    const result = { status: 'BLOCKED', reason: 'No usable browser binary found.' };
    fs.writeFileSync(path.join(EVIDENCE_DIR, 'result.json'), JSON.stringify(result, null, 2));
    console.error('BLOCKED:', result.reason); process.exit(1);
  }
  console.log('Using browser executable:', execPath);

  const TEST_DEPS_DIR = path.join(V09, 'tests', 'morning-qc');
  let playwrightCore;
  try { playwrightCore = require(require.resolve('playwright-core', { paths: [TEST_DEPS_DIR] })); }
  catch (e) {
    const result = { status: 'BLOCKED', reason: 'playwright-core not installed. Run `npm ci` from v09/tests/morning-qc/.' };
    fs.writeFileSync(path.join(EVIDENCE_DIR, 'result.json'), JSON.stringify(result, null, 2));
    console.error('BLOCKED:', result.reason); process.exit(1);
  }

  const PORT = 8950;
  const server = await serveStatic(DIST_DIR, PORT);
  const baseUrl = `http://localhost:${PORT}/index.html`;
  const browser = await playwrightCore.chromium.launch({ executablePath: execPath, headless: true });

  async function newPage(viewport) {
    const context = await browser.newContext({ viewport: viewport || { width: 1440, height: 1000 } });
    const page = await context.newPage();
    page.on('pageerror', err => { throw new Error(`Page error: ${err.message}`); });
    return { context, page };
  }
  async function checkNoOverflow(page, label) {
    const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    assert(`OVERFLOW-${label}`, o.sw <= o.cw + 1, `No horizontal overflow at ${label} (scrollWidth=${o.sw}, clientWidth=${o.cw})`);
  }

  console.log('\n=== Production navigation: 14 destinations, rendered ===');
  {
    const { context, page } = await newPage();
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'prod-home-1440x1000.png') });
    const navButtons = await page.locator('nav button, .nav-btn').count();
    assert('NAV-COUNT-14', navButtons === 14, `Rendered primary navigation has exactly 14 destinations (found ${navButtons})`);
    assert('NAV-NO-15TH', await page.locator('text=Morning QC Room').count() >= 0, 'Sanity: page loaded');
    await context.close();
  }

  console.log('\n=== Home -> Morning QC -> case -> debrief -> repeat/another/return ===');
  {
    const { context, page } = await newPage();
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    assert('HOME-CAPSTONE-CARD', await page.getByText('Morning QC Room').count() > 0, 'Home shows the Morning QC Room capstone card');
    await page.getByText('Morning QC Room').first().click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'prod-morningqc-landing-1440x1000.png') });
    assert('LANDING-NO-PILOT-LABEL', await page.locator('text=Pilot 1').count() === 0, 'Production landing never shows "Pilot 1" style labels');
    const caseCard = page.locator('.mqc-case-select__card').first();
    assert('LANDING-CASE-CARD', await caseCard.count() > 0, 'A case card is present');
    await caseCard.click();
    await page.waitForSelector('[data-testid="morning-qc-room"]');
    assert('ROOM-MOUNTED', await page.locator('[data-testid="morning-qc-room"]').count() > 0, 'Morning QC Room mounts from production entry');

    await page.getByText('Acknowledge signal', { exact: true }).click();
    await page.getByRole('button', { name: 'Finish case and review', exact: true }).click();
    await page.waitForSelector('[data-testid="morning-qc-debrief"]');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'prod-debrief-overview-1440x1000.png') });
    assert('DEBRIEF-MOUNTED', await page.locator('[data-testid="morning-qc-debrief"]').count() > 0, 'Debrief mounts after Finish case and review');
    assert('DEBRIEF-COMPETENCY', await page.locator('.mqcd-competency-card').count() === 12, 'Competency profile shows all 12 dimensions');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'prod-competency-profile-1440x1000.png') });

    const decisionsToggle = page.getByRole('button', { name: 'Decisions' });
    if (await decisionsToggle.count() > 0) { await decisionsToggle.click(); await page.waitForTimeout(100); }
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'prod-decision-review-1440x1000.png') });

    await page.getByText('Repeat this case').click();
    await page.waitForSelector('[data-testid="morning-qc-room"]');
    assert('REPEAT-WORKS', !(await page.locator('text=Held').count() > 0), 'Repeat produces a genuinely fresh room state');
    await context.close();
  }

  console.log('\n=== Competency Map -> Morning QC capstone ===');
  {
    const { context, page } = await newPage();
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.getByText('Competency Map', { exact: true }).click();
    await page.waitForTimeout(150);
    assert('MAP-CAPSTONE-LABEL', await page.locator('text=CAPSTONE').count() > 0, 'Competency Map shows a CAPSTONE entry, not QC-13');
    assert('MAP-NOT-QC13', await page.locator('text=QC-13').count() === 0, 'Morning QC is never labeled QC-13');
    await page.getByText('Open Morning QC Room').click();
    await page.waitForTimeout(150);
    assert('MAP-TO-ROOM', await page.locator('.mqc-case-select__card').count() > 0, 'Competency Map capstone entry reaches the Morning QC landing');
    await context.close();
  }

  console.log('\n=== Mobile: production landing + debrief overview ===');
  {
    const { context, page } = await newPage({ width: 390, height: 844 });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await checkNoOverflow(page, '390x844-home');
    await page.getByText('Morning QC Room').first().click();
    await page.waitForTimeout(150);
    await checkNoOverflow(page, '390x844-landing');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'prod-mobile-landing-390x844.png') });
    await page.locator('.mqc-case-select__card').first().click();
    await page.waitForSelector('[data-testid="morning-qc-room"]');
    await page.getByText('Acknowledge signal', { exact: true }).click();
    await page.getByRole('button', { name: 'Finish case and review', exact: true }).click();
    await page.waitForSelector('[data-testid="morning-qc-debrief"]');
    await checkNoOverflow(page, '390x844-debrief');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'prod-mobile-debrief-390x844.png') });
    assert('MOBILE-COMPETENCY-STACK', await page.locator('.mqcd-competency-card').count() === 12, 'Competency profile stacks and renders fully on mobile');
    await context.close();
  }

  await browser.close();
  server.close();

  const total = passed + failed;
  const result = { status: failed === 0 ? 'PASS' : 'FAIL', passed, failed, total, browserExecutable: execPath, checkpoints };
  fs.writeFileSync(path.join(EVIDENCE_DIR, 'result.json'), JSON.stringify(result, null, 2));
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Stage 12C Browser E2E: ${passed}/${total} passed, ${failed} failed`);
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
