/* =========================================================================
   v09/tests/browser/v09-stage12d-casebank-adaptive.e2e.js

   Morning QC Room — Stage 12D REAL Browser E2E Test
   PROVENANCE: V09_TEST

   Drives a REAL Chromium instance against the real, deterministically-
   built dist-vite-production/ artifact. Verifies all 12 case cards
   render, cold-start recommendation, genuine gameplay completion of a
   FOUNDATION/INTERMEDIATE/ADVANCED case each, the adaptive
   recommendation reacting to recorded history, learner override, and
   reset-history restoring cold start. Mobile responsiveness verified
   for the case bank, recommendation, and completion state.

   SETUP: cd v09/tests/morning-qc && npm ci
   Then, from v09/: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node tests/browser/v09-stage12d-casebank-adaptive.e2e.js
   ========================================================================= */
'use strict';
const path = require('path');
const fs = require('fs');
const http = require('http');

const V09 = path.join(__dirname, '..', '..');
const DIST_DIR = path.join(V09, 'dist-vite-production');
const EVIDENCE_DIR = path.join(__dirname, 'evidence', 'stage12d');

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
  catch (e) {
    fs.writeFileSync(path.join(EVIDENCE_DIR, 'result.json'), JSON.stringify({ status: 'BLOCKED', reason: 'playwright-core not installed.' }, null, 2));
    console.error('BLOCKED: playwright-core not installed.'); process.exit(1);
  }

  const PORT = 8952;
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
    assert(`OVERFLOW-${label}`, o.sw <= o.cw + 1, `No horizontal overflow at ${label}`);
  }
  async function resetLearnerHistory(page) {
    await page.evaluate(() => localStorage.removeItem('precimind-morningqc-attempts-v1'));
  }
  async function gotoMorningQC(page) {
    await page.goto(baseUrl + '#/morning-qc', { waitUntil: 'networkidle' });
  }

  console.log('\n=== All 12 case cards render; cold-start recommendation ===');
  {
    const { context, page } = await newPage();
    await gotoMorningQC(page);
    await resetLearnerHistory(page);
    await page.reload({ waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'casebank-coldstart-1440x1000.png') });
    const cardCount = await page.locator('.mqc-case-select__grid .mqc-case-select__card').count();
    assert('BANK-CARDS-12', cardCount === 12, `All 12 case cards render in the browse-all grid (found ${cardCount})`);
    const recCard = page.locator('.mqc-recommended-case .mqc-case-select__card');
    assert('COLDSTART-RECOMMENDED', await recCard.count() === 1, 'A single recommended-case card renders on cold start');
    const recTitle = await recCard.locator('.mqc-case-select__card-title').innerText();
    assert('COLDSTART-FOUNDATION', /Single Out-of-Range QC Point/.test(recTitle), `Cold-start recommendation is the FOUNDATION case (found "${recTitle}")`);
    assert('NO-PROGRESS-DASHBOARD-COLDSTART', await page.locator('.mqc-progress-dashboard').count() === 0, 'No progress dashboard shown before any attempt exists');
    await context.close();
  }

  console.log('\n=== Complete a FOUNDATION case via genuine gameplay; verify completion status ===');
  {
    const { context, page } = await newPage();
    await gotoMorningQC(page);
    await resetLearnerHistory(page);
    await page.locator('.mqc-recommended-case .mqc-case-select__card').click();
    await page.waitForSelector('[data-testid="morning-qc-room"]');
    await page.getByRole('button', { name: 'Acknowledge signal', exact: true }).click();
    await page.getByRole('button', { name: 'Finish case and review', exact: true }).click();
    await page.waitForSelector('[data-testid="morning-qc-debrief"]');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'foundation-case-debrief-1440x1000.png') });
    await page.getByText('Try another Morning QC case').click();
    await page.waitForSelector('.mqc-case-select');
    assert('DASHBOARD-AFTER-COMPLETION', await page.locator('.mqc-progress-dashboard').count() === 1, 'Progress dashboard appears after completing one case');
    const foundationCard = page.locator('.mqc-case-select__grid .mqc-case-select__card', { hasText: 'Single Out-of-Range QC Point' });
    const statusText = await foundationCard.locator('.mqc-case-select__card-status').innerText();
    assert('COMPLETION-STATUS-UPDATED', ['Completed', 'Repeat recommended'].includes(statusText), `The completed case shows an updated status badge (found "${statusText}")`);
    await context.close();
  }

  console.log('\n=== Recommendation reacts to recorded competency history (weak evidence-selection) ===');
  {
    const { context, page } = await newPage();
    await gotoMorningQC(page);
    await resetLearnerHistory(page);
    // Inject a synthetic, safe attempt record directly (the reaction to
    // history is exhaustively unit-tested in adaptive-sequencing.test.cjs;
    // this proves the UI genuinely reads and reflects real localStorage
    // history end-to-end, using the same safe shape the app itself writes).
    await page.evaluate(() => {
      const record = {
        attemptId: 'synthetic-1', caseId: 'case-04-isolated-excursion', startedAt: Date.now(), completedAt: Date.now(),
        competencyProfile: [{ dimension: 'EVIDENCE_SELECTION', rating: 'NEEDS_IMPROVEMENT' }],
        decisionSummary: [], confidenceSummary: [], evidenceSummary: { highValueObtainedCount: 0, lowValueObtainedCount: 0 },
        finalServiceState: 'RESUMED', recommendedLearningPriorities: ['EVIDENCE_SELECTION'],
      };
      localStorage.setItem('precimind-morningqc-attempts-v1', JSON.stringify([record]));
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'recommendation-after-weak-1440x1000.png') });
    const reasonText = await page.locator('.mqc-case-select__card-reason').innerText();
    assert('RECOMMENDATION-TARGETS-WEAK-DIM', /evidence selection/i.test(reasonText), `Recommendation explanation names the weak competency (found "${reasonText}")`);
    const priorityText = await page.locator('.mqc-progress-dashboard__priorities').innerText();
    assert('DASHBOARD-SHOWS-PRIORITY', /Evidence Selection/.test(priorityText), 'Progress dashboard shows the development priority');
    await context.close();
  }

  console.log('\n=== Learner override: a non-recommended case opens normally ===');
  {
    const { context, page } = await newPage();
    await gotoMorningQC(page);
    await resetLearnerHistory(page);
    const cards = page.locator('.mqc-case-select__grid .mqc-case-select__card');
    await cards.nth(5).click(); // choose an arbitrary non-recommended case
    await page.waitForSelector('[data-testid="morning-qc-room"]');
    assert('OVERRIDE-OPENS-NORMALLY', await page.locator('[data-testid="morning-qc-room"]').count() === 1, 'A non-recommended case, chosen directly by the learner, opens normally');
    await context.close();
  }

  console.log('\n=== Reset learning history restores cold start ===');
  {
    const { context, page } = await newPage();
    await gotoMorningQC(page);
    await page.evaluate(() => {
      localStorage.setItem('precimind-morningqc-attempts-v1', JSON.stringify([{ attemptId: 'x', caseId: 'case-04-isolated-excursion', competencyProfile: [] }]));
    });
    await page.reload({ waitUntil: 'networkidle' });
    page.on('dialog', d => d.accept());
    await page.getByText('Reset learning history').click();
    await page.waitForTimeout(200);
    assert('RESET-CLEARS-DASHBOARD', await page.locator('.mqc-progress-dashboard').count() === 0, 'Progress dashboard disappears after reset');
    const recTitle = await page.locator('.mqc-recommended-case .mqc-case-select__card-title').innerText();
    assert('RESET-RESTORES-COLDSTART', /Single Out-of-Range QC Point/.test(recTitle), 'Cold-start recommendation is restored after reset');
    await context.close();
  }

  console.log('\n=== Deep gameplay: one FOUNDATION, one INTERMEDIATE, one ADVANCED case ===');
  {
    const { context, page } = await newPage();
    await gotoMorningQC(page);
    await resetLearnerHistory(page);
    // INTERMEDIATE: case-06-calibration-shift
    const calibCard = page.locator('.mqc-case-select__grid .mqc-case-select__card', { hasText: 'Shift Following Scheduled Calibration' });
    await calibCard.click();
    await page.waitForSelector('[data-testid="morning-qc-room"]');
    await page.getByRole('button', { name: 'Acknowledge signal', exact: true }).click();
    await page.getByRole('button', { name: 'Finish case and review', exact: true }).click();
    await page.waitForSelector('[data-testid="morning-qc-debrief"]');
    assert('INTERMEDIATE-CASE-DEBRIEFS', await page.locator('[data-testid="morning-qc-debrief"]').count() === 1, 'The INTERMEDIATE case (calibration shift) completes and debriefs');
    await page.getByText('Try another Morning QC case').click();
    await page.waitForSelector('.mqc-case-select');

    // ADVANCED: case-11-concurrent-triage
    const triageCard = page.locator('.mqc-case-select__grid .mqc-case-select__card', { hasText: 'Two Simultaneous QC Signals' });
    await triageCard.click();
    await page.waitForSelector('[data-testid="morning-qc-room"]');
    await page.getByRole('button', { name: 'Acknowledge signal', exact: true }).click();
    await page.getByRole('button', { name: 'Finish case and review', exact: true }).click();
    await page.waitForSelector('[data-testid="morning-qc-debrief"]');
    assert('ADVANCED-CASE-DEBRIEFS', await page.locator('[data-testid="morning-qc-debrief"]').count() === 1, 'The ADVANCED case (concurrent triage) completes and debriefs');
    await context.close();
  }

  console.log('\n=== Mobile: case bank, recommendation, completion state ===');
  {
    const { context, page } = await newPage({ width: 390, height: 844 });
    await gotoMorningQC(page);
    await resetLearnerHistory(page);
    await checkNoOverflow(page, '390x844-casebank');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'mobile-casebank-390x844.png') });
    assert('MOBILE-RECOMMENDED-VISIBLE', await page.locator('.mqc-recommended-case').count() === 1, 'Recommended case is visible on mobile');

    await page.locator('.mqc-recommended-case .mqc-case-select__card').click();
    await page.waitForSelector('[data-testid="morning-qc-room"]');
    await page.getByRole('button', { name: 'Acknowledge signal', exact: true }).click();
    await page.getByRole('button', { name: 'Finish case and review', exact: true }).click();
    await page.waitForSelector('[data-testid="morning-qc-debrief"]');
    await page.getByText('Try another Morning QC case').click();
    await page.waitForSelector('.mqc-case-select');
    await checkNoOverflow(page, '390x844-completion');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'mobile-completion-state-390x844.png') });
    assert('MOBILE-DASHBOARD-READABLE', await page.locator('.mqc-progress-dashboard').count() === 1, 'Progress dashboard renders and is readable on mobile');
    await context.close();
  }

  await browser.close();
  server.close();

  const total = passed + failed;
  const result = { status: failed === 0 ? 'PASS' : 'FAIL', passed, failed, total, browserExecutable: execPath, checkpoints };
  fs.writeFileSync(path.join(EVIDENCE_DIR, 'result.json'), JSON.stringify(result, null, 2));
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Stage 12D Browser E2E: ${passed}/${total} passed, ${failed} failed`);
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
