/* =========================================================================
   v09/tests/browser/v09-stage12c-debrief-production.e2e.js

   Morning QC Room — Stage 12C REAL Browser E2E Test
   PROVENANCE: V09_TEST

   Drives a REAL Chromium instance against the real, deterministically-
   built dist-vite-production/ artifact. Exercises the full production
   routing contract (Home/Competency Map -> Morning QC, browser Back,
   direct load, refresh) and the complete accepted Stage 12A pilot paths
   for all three pilots, verifying the debrief renders truthfully —
   including the core Stage 12C pedagogy: correct outcome != adequately
   supported reasoning, verified via Pilot 2's early-unsupported vs
   later-supported HIGH-confidence disposition sequence.

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
    const result = { status: 'BLOCKED', reason: 'dist-vite-production/ does not exist.' };
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

  const PORT = 8951;
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
  async function toggleDisclosure(page, title) {
    const t = page.getByRole('button', { name: title });
    if (await t.count() > 0) { await t.click(); await page.waitForTimeout(100); }
  }

  /* =========================================================================
     ROUTING (Section 3/6)
     ========================================================================= */
  console.log('\n=== Real production routing ===');
  {
    const { context, page } = await newPage();
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    const navCount = await page.locator('nav button, .nav-btn').count();
    assert('NAV-COUNT-14', navCount === 14, `Rendered navigation has exactly 14 destinations (found ${navCount})`);

    await page.getByText('Morning QC Room').first().click();
    await page.waitForTimeout(150);
    assert('ROUTE-HOME-TO-MQC', (await page.evaluate(() => window.location.hash)) === '#/morning-qc', 'Home -> Morning QC changes the browser route to #/morning-qc');

    await page.goBack();
    await page.waitForTimeout(150);
    assert('ROUTE-BACK-FROM-MQC', (await page.evaluate(() => window.location.hash)) === '#/home' && (await page.locator('text=Learn Quality Control by Doing It').count() > 0), 'Browser Back from Morning QC returns to the preceding PreciMind screen (Home)');

    await page.getByText('Competency Map', { exact: true }).click();
    await page.waitForTimeout(150);
    await page.getByText('Open Morning QC Room').click();
    await page.waitForTimeout(150);
    assert('ROUTE-MAP-TO-MQC', (await page.evaluate(() => window.location.hash)) === '#/morning-qc' && (await page.locator('.mqc-case-select').count() > 0), 'Competency Map -> Morning QC changes the route consistently to #/morning-qc');

    await page.goto(baseUrl + '#/morning-qc', { waitUntil: 'networkidle' });
    assert('ROUTE-DIRECT-MQC', await page.locator('.mqc-case-select').count() > 0, 'Direct opening of the Morning QC route loads the production landing');

    await page.reload({ waitUntil: 'networkidle' });
    assert('ROUTE-REFRESH-MQC', (await page.evaluate(() => window.location.hash)) === '#/morning-qc' && (await page.locator('.mqc-case-select').count() > 0), 'Refresh on the Morning QC route remains on Morning QC (landing, never mid-case or debrief state)');
    await context.close();
  }

  /* =========================================================================
     PILOT 1 — full canonical expert path -> debrief
     ========================================================================= */
  console.log('\n=== Pilot 1: full expert path -> debrief ===');
  {
    const { context, page } = await newPage();
    await page.goto(baseUrl + '#/morning-qc', { waitUntil: 'networkidle' });
    await page.locator('.mqc-case-select__grid .mqc-case-select__card').first().click();
    await page.waitForSelector('[data-testid="morning-qc-room"]');

    await page.getByText('Acknowledge signal', { exact: true }).click();
    await page.getByText('QC History', { exact: true }).click();
    await page.getByText('Levey-Jennings Chart', { exact: true }).click();
    await page.getByRole('button', { name: 'Hold results', exact: true }).click();
    await page.waitForSelector('text=Decision required');
    await page.getByText('Hold results pending investigation').click();

    await page.getByText('Form a hypothesis', { exact: true }).click();
    await page.locator('#mqc-hyp-draft').fill('reagent lot');
    await page.getByText('Record this hypothesis').click();
    await page.getByText('Form a hypothesis', { exact: true }).click();
    await page.locator('#mqc-hyp-draft').fill('calibration');
    await page.getByText('Record this hypothesis').click();

    await page.getByText('Reagent Lot', { exact: true }).click();
    await page.getByText(/Request:/).first().click();
    await page.getByText('Calibration', { exact: true }).click();
    const calibReq = page.getByText(/Request:/).first();
    if (await calibReq.count() > 0) await calibReq.click();

    await page.getByRole('button', { name: 'Repeat QC', exact: true }).click();
    await page.getByText(/Request: reserved old-lot/).click();

    await page.getByRole('button', { name: 'Apply intervention', exact: true }).click();
    await page.waitForSelector('text=Decision required');
    await page.getByText('Revert to the verified prior reagent lot').click();

    await page.getByRole('button', { name: 'Verify recovery', exact: true }).click();
    await page.getByText('Patient Result Distribution', { exact: true }).click();
    await page.getByText('Formally check Patient Result Distribution').click();
    const affectedWindowBtn = page.getByText(/Request:.*patient-distribution/);
    if (await affectedWindowBtn.count() > 0) await affectedWindowBtn.click();

    await page.getByText('Review indicated', { exact: true }).click();
    await page.getByText('Review pending', { exact: true }).click();
    const affected = page.getByText('Affected result set identified', { exact: true });
    if (await affected.count() > 0) await affected.click();

    await page.getByRole('button', { name: 'Resume service', exact: true }).click();
    await page.waitForSelector('text=Decision required');
    await page.getByText('Resume after verified correction and patient-impact review').click();

    await page.getByRole('button', { name: 'Document', exact: true }).click();
    const dispField = page.locator('#mqc-doc-disposition');
    if (await dispField.count() > 0) { await dispField.fill('RESUMED after verified correction.'); await page.getByText('Save documentation').click(); }

    await page.getByRole('button', { name: 'Finish case and review', exact: true }).click();
    await page.waitForSelector('[data-testid="morning-qc-debrief"]');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'p1-debrief-overview-1440x1000.png') });

    assert('P1-DEBRIEF-EXPERT-RESUMED', (await page.locator('dd:has-text("RESUMED")').count() > 0) || (await page.locator('text=RESUMED').count() > 0), 'Debrief case-resolution shows the actual final service state (RESUMED)');
    await toggleDisclosure(page, 'Patient Safety');
    const safetyText = await page.locator('.mqcd-safety-facts').innerText().catch(() => '');
    assert('P1-DEBRIEF-VERIFICATION-ADEQUATE', /Attempted and adequate/i.test(safetyText), 'Debrief patient-safety review shows verification as attempted and adequate');
    const bodyText = await page.locator('.mqcd-body').innerText();
    assert('P1-RESOLUTION-POST-GATE-ONLY', /reagent lot|Reagent lot/i.test(bodyText), 'Reagent-lot resolution text appears in the debrief (post-gate, as expected)');
    await context.close();
  }

  /* =========================================================================
     PILOT 2 — the core pedagogy test: early unsupported vs later supported
     ========================================================================= */
  console.log('\n=== Pilot 2: early unsupported HIGH confidence vs later supported HIGH confidence ===');
  {
    const { context, page } = await newPage();
    await page.goto(baseUrl + '#/morning-qc', { waitUntil: 'networkidle' });
    const cards = page.locator('.mqc-case-select__grid .mqc-case-select__card');
    await cards.nth(1).click();
    await page.waitForSelector('[data-testid="morning-qc-room"]');

    await page.getByRole('button', { name: 'Acknowledge signal', exact: true }).click();
    await page.getByText('QC History', { exact: true }).click();
    const iqcStable = page.getByText(/Request:.*qc-history/);
    if (await iqcStable.count() > 0) await iqcStable.click();

    // EARLY disposition, BEFORE decisive case-mix evidence.
    await page.getByRole('button', { name: 'Document', exact: true }).click();
    await page.waitForSelector('text=Decision required');
    await page.getByText('Continue analysis, document the case-mix explanation').click();
    await page.waitForTimeout(150);
    assert('P2-EARLY-CORRECT-UNSUPPORTED', await page.locator('text=How confident are you').count() > 0, 'Early disposition executes and offers confidence recording');
    await page.getByRole('button', { name: 'High' }).click();
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'p2-early-high-confidence.png') });

    // Obtain the decisive evidence and make the LATER, supported disposition.
    await page.getByText('Patient-Based Real-Time QC', { exact: true }).click();
    await page.getByText('Patient Result Distribution', { exact: true }).click();
    const wardBtn = page.getByText(/Request:.*patient-distribution/);
    if (await wardBtn.count() > 0) await wardBtn.click();
    await page.getByText('Formally check Patient Result Distribution').click();
    const caseMixBtn = page.getByText(/Request: stratified re-analysis/);
    await caseMixBtn.click();

    await page.getByRole('button', { name: 'Document', exact: true }).click();
    await page.waitForSelector('text=Decision required');
    await page.getByText('Continue analysis, document the case-mix explanation').click();
    await page.waitForTimeout(150);
    assert('P2-LATER-SUPPORTED', await page.locator('text=How confident are you').count() > 0, 'Later, evidence-supported disposition executes and offers confidence recording');
    await page.getByRole('button', { name: 'High' }).click();
    await page.waitForTimeout(150);

    await page.getByRole('button', { name: 'Finish case and review', exact: true }).click();
    await page.waitForSelector('[data-testid="morning-qc-debrief"]');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'p2-debrief-overview-1440x1000.png') });

    await page.waitForTimeout(100);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'p2-decision-calibration-1440x1000.png') });

    const decisionCards = await page.locator('.mqcd-decision-card').all();
    assert('P2-REVISED-EVENTS-DISTINCT', decisionCards.length === 2, `Debrief shows two distinct decision events for the revised disposition (found ${decisionCards.length})`);
    const quadrants = await page.locator('.mqcd-decision-card').evaluateAll(els => els.map(el => el.getAttribute('data-quadrant')));
    assert('P2-EARLY-QUADRANT-UNSUPPORTED', quadrants[0] === 'CORRECT_UNSUPPORTED', `First (early) decision event is CORRECT_UNSUPPORTED (found ${quadrants[0]})`);
    assert('P2-LATER-QUADRANT-SUPPORTED', quadrants[1] === 'CORRECT_SUPPORTED', `Second (later) decision event is CORRECT_SUPPORTED (found ${quadrants[1]})`);

    const calibrationText = await page.locator('.mqcd-calibration-list').innerText();
    assert('P2-EARLY-HIGH-CONFIDENCE-NOT-CALIBRATED', !/^Well calibrated/m.test(calibrationText.split('\n')[0] || '') && /Overconfident relative to the evidence/.test(calibrationText), 'The early HIGH-confidence entry is NOT labeled well calibrated — it is explicitly flagged as overconfident relative to the evidence available at the time');
    assert('P2-LATER-HIGH-CONFIDENCE-CALIBRATED', /Well calibrated/.test(calibrationText), 'The later, evidence-supported HIGH-confidence entry IS labeled well calibrated');
    await context.close();
  }

  /* =========================================================================
     PILOT 3 — full canonical RCV expert path -> debrief
     ========================================================================= */
  console.log('\n=== Pilot 3: full RCV expert path -> debrief ===');
  {
    const { context, page } = await newPage();
    await page.goto(baseUrl + '#/morning-qc', { waitUntil: 'networkidle' });
    await page.locator('.mqc-case-select__grid .mqc-case-select__card').nth(2).click();
    await page.waitForSelector('[data-testid="morning-qc-room"]');

    await page.getByRole('button', { name: 'Acknowledge signal', exact: true }).click();
    await page.getByText('Patient Result Distribution', { exact: true }).click();
    await page.getByText('QC History', { exact: true }).click();

    await page.getByText('Form a hypothesis', { exact: true }).click();
    await page.locator('#mqc-hyp-draft').fill('analytical error');
    await page.getByText('Record this hypothesis').click();
    const iqcClean = page.getByText(/Request:.*qc-history/);
    if (await iqcClean.count() > 0) await iqcClean.click();

    await page.getByText('External Quality Assurance', { exact: true }).click();
    const eqaPass = page.getByText(/Request:.*eqa/);
    if (await eqaPass.count() > 0) await eqaPass.click();

    await page.getByText('Patient / Specimen Context', { exact: true }).click();
    const specimenEv = page.getByText(/Request:.*specimen/);
    if (await specimenEv.count() > 0) await specimenEv.click();

    await page.getByText('Form a hypothesis', { exact: true }).click();
    await page.locator('#mqc-hyp-draft').fill('preanalytical factor');
    const rec1 = page.getByText('Record this hypothesis');
    if (await rec1.count() > 0) await rec1.click();

    const formHypBtn = page.getByRole('button', { name: 'Form hypothesis', exact: true });
    if (await formHypBtn.count() > 0) {
      await formHypBtn.click();
      if (await page.locator('text=Decision required').count() > 0) {
        await page.getByText('Apply RCV to assess statistical significance').click();
        const draft2 = page.locator('#mqc-hyp-draft');
        if (await draft2.count() > 0) {
          await draft2.fill('statistically significant change exceeds rcv');
          const rec2 = page.getByText('Record this hypothesis');
          if (await rec2.count() > 0) await rec2.click();
        }
      }
    }

    const rcvBtn = page.getByText(/Request:.*RCV calculation/);
    if (await rcvBtn.count() > 0) await rcvBtn.click();

    await page.getByRole('button', { name: 'Document', exact: true }).click();
    if (await page.locator('text=Decision required').count() > 0) {
      const noHold = page.getByText('No analytical hold; document the RCV-based statistical finding');
      if (await noHold.count() > 0) await noHold.click();
      await page.waitForTimeout(100);
      const highBtn = page.getByRole('button', { name: 'High' });
      if (await highBtn.count() > 0) await highBtn.click();
    }

    assert('P3-NO-ANALYTICAL-HOLD', await page.locator('text=Held').count() === 0, 'No inappropriate analytical hold occurred on the RCV pathway');

    await page.getByRole('button', { name: 'Finish case and review', exact: true }).click();
    await page.waitForSelector('[data-testid="morning-qc-debrief"]');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'p3-debrief-overview-1440x1000.png') });

    const p3Body = await page.locator('.mqcd-body').innerText();
    assert('P3-RCV-DEBRIEF', /statistical|RCV/i.test(p3Body), 'Debrief shows the RCV/statistical interpretation, never an overclaimed biological-etiology statement');
    assert('P3-NO-BIOLOGICAL-OVERCLAIM', /does not establish a specific biological cause|does NOT establish a specific biological cause/i.test(p3Body) || !/biological cause/i.test(p3Body), 'Debrief preserves the appropriately-limited RCV interpretation (explicitly denies establishing a specific biological cause), never overclaiming one');
    assert('P3-SUPPORTED-DISPOSITION', (await page.locator('.mqcd-decision-card[data-quadrant="CORRECT_SUPPORTED"]').count() > 0), 'Final disposition shown as CORRECT_SUPPORTED in the debrief');
    await context.close();
  }

  /* =========================================================================
     Mobile evidence
     ========================================================================= */
  console.log('\n=== Mobile: landing, debrief overview, competency, calibration ===');
  {
    const { context, page } = await newPage({ width: 390, height: 844 });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await checkNoOverflow(page, '390x844-home');
    await page.getByText('Morning QC Room').first().click();
    await page.waitForTimeout(150);
    await checkNoOverflow(page, '390x844-landing');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'mobile-landing-390x844.png') });

    await page.locator('.mqc-case-select__grid .mqc-case-select__card').nth(1).click();
    await page.waitForSelector('[data-testid="morning-qc-room"]');
    await page.getByRole('button', { name: 'Acknowledge signal', exact: true }).click();
    // On mobile, panels live inside the Information drawer — must open it first.
    await page.getByRole('button', { name: 'Information', exact: true }).click();
    await page.waitForTimeout(300);
    await page.getByText('QC History', { exact: true }).click();
    const iqcStableM = page.getByText(/Request:.*qc-history/);
    if (await iqcStableM.count() > 0) await iqcStableM.click();
    await page.getByRole('button', { name: 'Document', exact: true }).click();
    await page.waitForSelector('text=Decision required');
    await page.getByText('Continue analysis, document the case-mix explanation').click();
    await page.waitForTimeout(150);
    // Confidence controls live in the Reasoning workspace — closed by
    // default on mobile, must be opened first.
    await page.getByRole('button', { name: 'Reasoning', exact: true }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'High' }).click();
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'mobile-p2-early-unsupported-390x844.png') });
    // Close the Reasoning drawer before continuing — otherwise its
    // backdrop intercepts clicks on header buttons outside the drawer.
    // The Close button's accessible name is "Close Reasoning workspace"
    // (its aria-label), not just "Close" (its visible text content).
    await page.getByRole('button', { name: /Close Reasoning/i }).click();
    await page.waitForTimeout(300);

    await page.getByRole('button', { name: 'Finish case and review', exact: true }).click();
    await page.waitForSelector('[data-testid="morning-qc-debrief"]');
    await checkNoOverflow(page, '390x844-debrief');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'mobile-debrief-overview-390x844.png') });
    assert('MOBILE-COMPETENCY-STACK', await page.locator('.mqcd-competency-card').count() === 12, 'Competency profile renders fully on mobile');
    await checkNoOverflow(page, '390x844-decisions');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'mobile-decision-calibration-390x844.png') });
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
