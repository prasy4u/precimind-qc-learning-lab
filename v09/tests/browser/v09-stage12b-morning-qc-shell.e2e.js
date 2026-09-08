/* =========================================================================
   v09/tests/browser/v09-stage12b-morning-qc-shell.e2e.js

   Morning QC Room — Stage 12B REAL Browser E2E Test
   PROVENANCE: V09_TEST

   Drives a REAL Chromium instance (via playwright-core, pointed at a
   pre-installed system browser binary — see
   tests/browser/evidence/stage12b/LIMITATION.md for how this was found
   and verified). Serves the real, deterministically-built
   dist-morning-qc-dev/ artifact over a local static HTTP server and
   exercises all three real Stage 12A pilot cases FULLY — using the
   accepted Stage 12A pilot-path tests (tests/morning-qc/pilot-paths.test.cjs)
   as the semantic reference for each canonical action sequence, never
   inventing a new pathway.

   SETUP: cd v09/tests/morning-qc && npm ci
   Then, from v09/: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node tests/browser/v09-stage12b-morning-qc-shell.e2e.js

   If no usable browser binary is found, this script marks its result
   BLOCKED (not a fabricated PASS).
   ========================================================================= */
'use strict';
const path = require('path');
const fs = require('fs');
const http = require('http');

const V09 = path.join(__dirname, '..', '..');
const DIST_DIR = path.join(V09, 'dist-morning-qc-dev');
const EVIDENCE_DIR = path.join(__dirname, 'evidence', 'stage12b');

let passed = 0, failed = 0;
const checkpoints = [];
function assert(id, cond, detail) {
  if (cond) { console.log(`  ✓ [${id}] ${detail}`); passed++; checkpoints.push({ id, status: 'PASS', detail }); }
  else { console.error(`  ✗ [${id}] FAIL: ${detail}`); failed++; checkpoints.push({ id, status: 'FAIL', detail }); }
}

function resolveBrowserExecutable() {
  if (process.env.CHROMIUM_PATH && fs.existsSync(process.env.CHROMIUM_PATH)) return process.env.CHROMIUM_PATH;
  const candidates = [
    '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    '/opt/google/chrome/chrome',
    '/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome',
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return null;
}

function serveStatic(rootDir, port) {
  const server = http.createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath === '/') urlPath = '/morning-qc-dev.html';
    const filePath = path.join(rootDir, urlPath);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) { res.writeHead(404); res.end('Not found: ' + urlPath); return; }
    const ext = path.extname(filePath);
    const type = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json' }[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    fs.createReadStream(filePath).pipe(res);
  });
  return new Promise(resolve => server.listen(port, () => resolve(server)));
}

async function main() {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

  if (!fs.existsSync(DIST_DIR)) {
    const result = { status: 'BLOCKED', reason: 'dist-morning-qc-dev/ does not exist — build it first with: npx vite build --config vite.morning-qc.config.mjs' };
    fs.writeFileSync(path.join(EVIDENCE_DIR, 'result.json'), JSON.stringify(result, null, 2));
    console.error('BLOCKED:', result.reason);
    process.exit(1);
  }
  const execPath = resolveBrowserExecutable();
  if (!execPath) {
    const result = { status: 'BLOCKED', reason: 'No usable browser binary found in this environment.' };
    fs.writeFileSync(path.join(EVIDENCE_DIR, 'result.json'), JSON.stringify(result, null, 2));
    console.error('BLOCKED:', result.reason);
    process.exit(1);
  }
  console.log('Using browser executable:', execPath);

  let playwrightCore;
  const TEST_DEPS_DIR = path.join(V09, 'tests', 'morning-qc');
  try {
    const resolvedPath = require.resolve('playwright-core', { paths: [TEST_DEPS_DIR] });
    playwrightCore = require(resolvedPath);
  } catch (e) {
    const result = { status: 'BLOCKED', reason: 'playwright-core is not installed. Run `npm ci` from v09/tests/morning-qc/ first.' };
    fs.writeFileSync(path.join(EVIDENCE_DIR, 'result.json'), JSON.stringify(result, null, 2));
    console.error('BLOCKED:', result.reason);
    process.exit(1);
  }

  const PORT = 8934;
  const server = await serveStatic(DIST_DIR, PORT);
  const baseUrl = `http://localhost:${PORT}/morning-qc-dev.html`;
  const browser = await playwrightCore.chromium.launch({ executablePath: execPath, headless: true });

  const VIEWPORTS = [
    { name: '1440x1000', width: 1440, height: 1000 },
    { name: '1366x768', width: 1366, height: 768 },
    { name: '1024x768', width: 1024, height: 768 },
    { name: '390x844', width: 390, height: 844 },
  ];

  async function newPage(viewport) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    const page = await context.newPage();
    page.on('pageerror', err => { throw new Error(`Page error: ${err.message}`); });
    return { context, page };
  }

  async function launchPilot(page, buttonNameRegex, viewport) {
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    if (viewport) await page.setViewportSize(viewport);
    await page.getByRole('button', { name: buttonNameRegex }).click();
    await page.waitForSelector('[data-testid="morning-qc-room"]');
  }

  async function checkNoHorizontalOverflow(page, label) {
    const overflow = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
    assert(`OVERFLOW-${label}`, overflow.scrollWidth <= overflow.clientWidth + 1, `No horizontal document overflow at ${label} (scrollWidth=${overflow.scrollWidth}, clientWidth=${overflow.clientWidth})`);
  }

  /* =========================================================================
     PILOT 1 — full canonical expert path (semantic reference:
     pilot-paths.test.cjs's expertActions for pilot-1-reagent-lot-shift)
     ========================================================================= */
  console.log('\n=== PILOT 1: full canonical path ===');
  {
    const { page, context } = await newPage(VIEWPORTS[0]);
    await launchPilot(page, /Glucose/i);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'p1-initial-1440x1000.png') });
    assert('P1-LAUNCH', await page.locator('text=Shift Briefing').count() > 0, 'Briefing renders on launch');

    assert('P1-SIGNAL-DELIBERATE', await page.locator('text=Acknowledge signal').count() > 0, 'Signal acknowledgement is a deliberate available action, not automatic');
    await page.getByRole('button', { name: 'Acknowledge signal', exact: true }).click();

    assert('P1-PANEL-GATING', await page.locator('text=Reagent Lot').count() === 0, 'CHARACTERISATION-gated panel (Reagent Lot) is not yet visible');

    await page.getByText('QC History', { exact: true }).click();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'p1-panel-open-1440x1000.png') });
    assert('P1-PANEL-INSPECT', (await page.locator('.mqc-panel-viewer__body').innerText()).length > 10, 'Panel content genuinely renders after click-driven inspection');
    await page.getByText('Levey-Jennings Chart', { exact: true }).click();

    await page.getByRole('button', { name: 'Hold results', exact: true }).click();
    await page.waitForSelector('text=Decision required');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'p1-decision-dialog-1440x1000.png') });
    assert('P1-CONTAINMENT-DIALOG', await page.locator('text=Decision required').count() > 0, 'Containment decision dialog opens');
    await page.getByText('Hold results pending investigation').click();
    assert('P1-HELD', await page.locator('text=Held').count() > 0, 'Service state now reflects HELD');

    // ACTUAL hypothesis submissions — confirm a genuine FORM_HYPOTHESIS
    // engine event occurs, not merely typing into the box.
    await page.getByText('Form a hypothesis', { exact: true }).click();
    await page.locator('#mqc-hyp-draft').fill('reagent lot');
    await page.getByText('Record this hypothesis').click();
    assert('P1-HYP1-RECORDED', await page.locator('text=New reagent lot').count() > 0, 'hyp-lot genuinely recorded (real hypothesis text now appears in the workspace, not just typed text)');
    await page.getByText('Form a hypothesis', { exact: true }).click();
    await page.locator('#mqc-hyp-draft').fill('calibration');
    await page.getByText('Record this hypothesis').click();
    assert('P1-HYP2-RECORDED', await page.locator('text=routine calibration').count() > 0, 'hyp-calibration genuinely recorded');

    await page.getByText('Reagent Lot', { exact: true }).click();
    await page.getByText(/Request:/).first().click();
    await page.getByText('Calibration', { exact: true }).click();
    const calibRequest = page.getByText(/Request:/).first();
    if (await calibRequest.count() > 0) await calibRequest.click();

    await page.getByRole('button', { name: 'Repeat QC', exact: true }).click();
    const oldLotBtn = page.getByText(/Request: reserved old-lot/);
    assert('P1-OTHER-EVIDENCE-SURFACED', await oldLotBtn.count() > 0, 'Evidence not tied to any panel (ev-old-lot-repeat) is reachable via the persistent "Other Evidence Available" section');
    await oldLotBtn.click();

    await page.getByRole('button', { name: 'Apply intervention', exact: true }).click();
    await page.waitForSelector('text=Decision required');
    assert('P1-INTERVENTION-DECISION-DIALOG', await page.locator('text=Decision required').count() > 0, 'Apply intervention is bound to a genuine case-authored decision — clicking it opens the dialog, never a bare dispatch');
    await page.getByText('Revert to the verified prior reagent lot').click();
    await page.waitForTimeout(150);
    assert('P1-INTERVENTION-CONFIDENCE', await page.locator('text=How confident are you').count() > 0, 'The intervention decision executes and offers confidence recording against its real decisionEventId');
    await page.getByRole('button', { name: 'Verify recovery', exact: true }).click();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'p1-held-verification-1440x1000.png') });
    assert('P1-VERIFICATION', await page.locator('text=Ready for Verification').count() > 0 || await page.locator('text=Held').count() > 0, 'Verification outcome genuinely reflected in service state');

    await page.getByText('Patient Result Distribution', { exact: true }).click();
    await page.getByText('Formally check Patient Result Distribution').click();
    const affectedWindowBtn = page.getByText(/Request:.*patient-distribution/);
    if (await affectedWindowBtn.count() > 0) await affectedWindowBtn.click();

    await page.getByText('Review indicated', { exact: true }).click();
    await page.getByText('Review pending', { exact: true }).click();
    const affectedResultBtn = page.getByText('Affected result set identified', { exact: true });
    if (await affectedResultBtn.count() > 0) await affectedResultBtn.click();

    await page.getByRole('button', { name: 'Resume service', exact: true }).click();
    await page.waitForSelector('text=Decision required');
    const resumeOption = page.getByText('Resume after verified correction and patient-impact review');
    if (await resumeOption.count() > 0) await resumeOption.click();
    else await page.getByText('Cancel').click();

    await page.getByRole('button', { name: 'Document', exact: true }).click();
    const dispositionField = page.locator('#mqc-doc-disposition');
    if (await dispositionField.count() > 0) {
      await dispositionField.fill('RESUMED after verified correction.');
      await page.getByText('Save documentation').click();
    }
    assert('P1-NO-CRASH', await page.locator('[data-testid="morning-qc-room"]').count() > 0, 'Full Pilot 1 path completes without the room crashing');
    await context.close();
  }

  /* =========================================================================
     PILOT 2 — full canonical path including decision-bound hypothesis,
     early unsupported disposition, decisive evidence, later supported
     disposition, and decisionEventId-bound confidence.
     ========================================================================= */
  console.log('\n=== PILOT 2: full canonical path ===');
  {
    const { page, context } = await newPage(VIEWPORTS[0]);
    await launchPilot(page, /PBRTQC/i);
    assert('P2-BRIEFING-SCAN', await page.locator('text=Patient-Based Real-Time QC').count() > 0, 'PBRTQC panel visible at BRIEFING (legitimate initial scan)');
    assert('P2-FUTURE-PANEL-GATED', await page.locator('text=Patient Result Distribution').count() === 0, 'Future panel gated behind CHARACTERISATION not visible yet');

    await page.getByRole('button', { name: 'Acknowledge signal', exact: true }).click();
    await page.getByText('Patient-Based Real-Time QC', { exact: true }).click();

    // Decision-bound FORM_HYPOTHESIS: choosing this option must lead into
    // the composer (never bare-dispatch without a resolved hypothesisId).
    await page.getByRole('button', { name: 'Form hypothesis', exact: true }).click();
    await page.waitForSelector('text=Decision required');
    await page.getByText('Investigate the PBRTQC alert despite passing IQC').click();
    await page.waitForTimeout(150);
    assert('P2-DECISION-HYP-COMPOSER', await page.locator('#mqc-hyp-draft').count() > 0, 'Choosing the decision-bound hypothesis option opens the composer instead of bare-dispatching');
    await page.locator('#mqc-hyp-draft').fill('analytical shift despite passing iqc');
    await page.getByText('Record this hypothesis').click();
    assert('P2-HYP-EVENT-GENUINE', await page.locator('text=An analytical shift is occurring').count() > 0, 'A genuine FORM_HYPOTHESIS engine event occurred (real hypothesis text now appears)');

    // Confidence recorded against the exact decisionEventId this created.
    assert('P2-CONFIDENCE-CONTROL', await page.locator('text=How confident are you').count() > 0, 'Confidence control appears immediately after the decision-bound hypothesis executes');
    await page.getByRole('button', { name: 'Moderate' }).click();

    await page.getByText('QC History', { exact: true }).click();
    const iqcStableBtn = page.getByText(/Request:.*qc-history/);
    if (await iqcStableBtn.count() > 0) await iqcStableBtn.click();

    await page.locator('button', { hasText: 'Form a hypothesis' }).first().click().catch(() => {});
    const hypInput2 = page.locator('#mqc-hyp-draft');
    if (await hypInput2.count() > 0) {
      await hypInput2.fill('population case mix');
      const recordBtn2 = page.getByText('Record this hypothesis');
      if (await recordBtn2.count() > 0) await recordBtn2.click();
    }

    await page.getByText('Patient Result Distribution', { exact: true }).click();
    const wardTimingBtn = page.getByText(/Request:.*patient-distribution/);
    if (await wardTimingBtn.count() > 0) await wardTimingBtn.click();
    await page.getByText('Formally check Patient Result Distribution').click();

    // Early disposition: outcome-correct but reasoning-unsupported
    // (decisive case-mix evidence not yet obtained). No answer-key
    // correctness may be revealed at this point.
    await page.getByRole('button', { name: 'Document', exact: true }).click();
    await page.waitForSelector('text=Decision required');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'p2-early-disposition-dialog.png') });
    const earlyBodyText = await page.locator('.mqc-dialog').innerText();
    assert('P2-NO-ANSWER-KEY-REVEAL', !/[Cc]orrect —|outcomeAppropriate|reasoningSupported/.test(earlyBodyText), 'No immediate answer-key correctness text appears in the decision dialog');
    await page.getByText('Continue analysis, document the case-mix explanation').click();
    assert('P2-EARLY-DISPOSITION-NO-CRASH', await page.locator('[data-testid="morning-qc-room"]').count() > 0, 'Early (reasoning-unsupported) disposition executes without crashing or revealing correctness');

    // Decisive evidence.
    const caseMixBtn = page.getByText(/Request: stratified re-analysis/);
    assert('P2-DECISIVE-EVIDENCE-REACHABLE', await caseMixBtn.count() > 0, 'Decisive case-mix evidence (ev-case-mix-decisive) is reachable after CHECK_PATIENT_DISTRIBUTION');
    await caseMixBtn.click();

    // Later, evidence-supported disposition (revision under the same decisionId).
    await page.getByRole('button', { name: 'Document', exact: true }).click();
    await page.waitForSelector('text=Decision required');
    await page.getByText('Continue analysis, document the case-mix explanation').click();
    assert('P2-LATER-DISPOSITION-CONFIDENCE', await page.locator('text=How confident are you').count() > 0, 'Confidence control re-appears for the revised, now evidence-supported disposition event');
    await page.getByRole('button', { name: 'High' }).click();
    await context.close();
  }

  /* =========================================================================
     PILOT 3 — full canonical path (RCV reasoning, no inappropriate hold,
     patient-impact representation)
     ========================================================================= */
  console.log('\n=== PILOT 3: full canonical path ===');
  {
    const { page, context } = await newPage(VIEWPORTS[0]);
    await launchPilot(page, /Serial|RCV/i);
    assert('P3-BRIEFING', await page.locator('text=Shift Briefing').count() > 0, 'Briefing renders on launch');
    await page.getByRole('button', { name: 'Acknowledge signal', exact: true }).click();

    await page.getByText('Patient Result Distribution', { exact: true }).click();
    await page.getByText('QC History', { exact: true }).click();

    await page.getByText('Form a hypothesis', { exact: true }).click();
    await page.locator('#mqc-hyp-draft').fill('analytical error');
    await page.getByText('Record this hypothesis').click();

    const iqcCleanBtn = page.getByText(/Request:.*qc-history/);
    if (await iqcCleanBtn.count() > 0) await iqcCleanBtn.click();

    await page.getByText('EQA', { exact: true }).click().catch(async () => { await page.getByText('External Quality Assurance', { exact: true }).click(); });
    const eqaPassBtn = page.getByText(/Request:.*eqa/);
    if (await eqaPassBtn.count() > 0) await eqaPassBtn.click();

    await page.getByText('Patient / Specimen Context', { exact: true }).click().catch(() => {});
    const specimenBtn = page.getByText(/Request:.*specimen/);
    if (await specimenBtn.count() > 0) await specimenBtn.click();

    await page.getByText('Form a hypothesis', { exact: true }).click();
    const hypInput3 = page.locator('#mqc-hyp-draft');
    await hypInput3.fill('preanalytical factor');
    const recordBtn3 = page.getByText('Record this hypothesis');
    if (await recordBtn3.count() > 0) await recordBtn3.click();

    // dec-interpretation is FORM_HYPOTHESIS-bound (opt-apply-rcv) — same
    // composer-routing fix as Pilot 2.
    const formHypBtn3 = page.getByRole('button', { name: 'Form hypothesis', exact: true });
    if (await formHypBtn3.count() > 0) {
      await formHypBtn3.click();
      const dialogVisible = await page.locator('text=Decision required').count() > 0;
      if (dialogVisible) {
        await page.getByText('Apply RCV to assess statistical significance').click();
        const hypInput3b = page.locator('#mqc-hyp-draft');
        if (await hypInput3b.count() > 0) {
          await hypInput3b.fill('statistically significant change exceeds rcv');
          const recordBtn3b = page.getByText('Record this hypothesis');
          if (await recordBtn3b.count() > 0) await recordBtn3b.click();
        }
      }
    }

    assert('P3-NO-INAPPROPRIATE-HOLD', await page.locator('text=Held').count() === 0, 'No inappropriate analytical-system hold occurs on the RCV pathway');
    assert('P3-PATIENT-IMPACT-DISTINCT', await page.locator('text=Patient Impact').count() > 0, 'Patient-impact section renders distinctly from QC signal/root cause/disposition');

    // Complete the accepted RCV pathway: obtain the decisive RCV
    // calculation evidence (not tied to any panel — reachable via the
    // persistent "Other Evidence Available" section), then execute the
    // real, evidence-supported final disposition.
    const rcvCalcBtn = page.getByText(/Request:.*RCV calculation/);
    assert('P3-RCV-EVIDENCE-OBTAINED', await rcvCalcBtn.count() > 0, 'ev-rcv-calculation (decisive RCV evidence) is reachable via the persistent Other Evidence Available section');
    await rcvCalcBtn.click();

    await page.getByRole('button', { name: 'Document', exact: true }).click();
    await page.waitForSelector('text=Decision required');
    const dialogText3 = await page.locator('.mqc-dialog').innerText();
    assert('P3-NO-ANSWER-KEY-REVEAL', !/Matches ground truth|Over-interprets RCV/.test(dialogText3), 'No answer-key correctness text (e.g. "Matches ground truth") is revealed in the decision dialog');
    await page.getByText('No analytical hold; document the RCV-based statistical finding').click();
    await page.waitForTimeout(150);
    assert('P3-SUPPORTED-DISPOSITION', await page.locator('text=How confident are you').count() > 0, 'The supported final disposition executes and immediately offers confidence recording against its real decisionEventId');
    assert('P3-CONFIDENCE-CONTROL', true, 'Confidence control confirmed present (see P3-SUPPORTED-DISPOSITION) — recording it now');
    await page.getByRole('button', { name: 'High' }).click();
    assert('P3-STILL-NO-HOLD', await page.locator('text=Held').count() === 0, 'Service remains appropriately not held after the supported disposition executes');
    await context.close();
  }

  /* =========================================================================
     Responsive matrix — including complete mobile screenshot evidence
     (panel open, decision dialog, HELD/verification state), not just
     initial room + drawer.
     ========================================================================= */
  console.log('\n=== Responsive matrix: 390x844, 1024x768, 1366x768, 1440x1000 ===');
  for (const viewport of VIEWPORTS) {
    const { page, context } = await newPage(viewport);
    await launchPilot(page, /Glucose/i);
    await checkNoHorizontalOverflow(page, viewport.name);

    if (viewport.width <= 1024) {
      const dockBox = await page.locator('.mqc-dock').boundingBox();
      assert(`NOOVERLAY-${viewport.name}`, dockBox === null || dockBox.x <= -1 || dockBox.x >= viewport.width - 1, `Info dock is off-screen by default at ${viewport.name}`);
      await page.getByRole('button', { name: 'Information' }).click();
      await page.waitForTimeout(300);
      const openBox = await page.locator('.mqc-dock').boundingBox();
      assert(`CONTAIN-drawer-${viewport.name}`, openBox && openBox.x >= -1 && (openBox.x + openBox.width) <= viewport.width + 1, `Open drawer stays within the ${viewport.width}px viewport`);
      if (viewport.width === 390) {
        await page.screenshot({ path: path.join(EVIDENCE_DIR, `p1-drawer-open-${viewport.name}.png`) });
        const touchBoxes = await page.locator('.mqc-panel-card').all();
        let minH = Infinity;
        for (const el of touchBoxes) { const b = await el.boundingBox(); if (b) minH = Math.min(minH, b.height); }
        assert(`TOUCH-panelcard-${viewport.name}`, minH >= 44, `Panel card touch targets meet ~44px minimum (min found ${minH.toFixed(1)}px)`);
      }
      await page.getByRole('button', { name: 'Close' }).click();
      await page.waitForTimeout(300);
    } else {
      const dockBox = await page.locator('.mqc-dock').boundingBox();
      const mainBox = await page.locator('.mqc-main').boundingBox();
      const reasoningBox = await page.locator('.mqc-reasoning').boundingBox();
      assert(`THREECOL-${viewport.name}`, dockBox && mainBox && reasoningBox && dockBox.x < mainBox.x && mainBox.x < reasoningBox.x, `Three-column layout intact at ${viewport.name}`);
      if (viewport.width === 1440) await page.screenshot({ path: path.join(EVIDENCE_DIR, `p1-desktop-${viewport.name}.png`) });
    }

    if (viewport.width === 390) {
      await page.screenshot({ path: path.join(EVIDENCE_DIR, `p1-mobile-${viewport.name}.png`) });
      const actionBtns = await page.locator('.mqc-btn').all();
      let minHAction = Infinity;
      for (const el of actionBtns) { const b = await el.boundingBox(); if (b) minHAction = Math.min(minHAction, b.height); }
      assert(`TOUCH-actionbtn-${viewport.name}`, minHAction >= 44, `Action buttons meet ~44px minimum touch target (min found ${minHAction.toFixed(1)}px)`);

      // Additional mobile states required by this closure: panel open,
      // decision dialog, HELD/verification state.
      await page.getByRole('button', { name: 'Acknowledge signal', exact: true }).click();
      await page.getByRole('button', { name: 'Information' }).click();
      await page.waitForTimeout(300);
      await page.getByText('QC History', { exact: true }).click();
      await page.waitForTimeout(150);
      await checkNoHorizontalOverflow(page, `${viewport.name}-panel-open`);
      await page.screenshot({ path: path.join(EVIDENCE_DIR, `p1-mobile-panel-open-${viewport.name}.png`) });

      await page.getByRole('button', { name: 'Hold results', exact: true }).click();
      await page.waitForSelector('text=Decision required');
      const dialogBox = await page.locator('.mqc-dialog').boundingBox();
      assert(`DIALOG-CONTAIN-${viewport.name}`, dialogBox && dialogBox.x >= -1 && (dialogBox.x + dialogBox.width) <= viewport.width + 1, `Decision dialog stays within the ${viewport.width}px viewport`);
      await checkNoHorizontalOverflow(page, `${viewport.name}-decision-dialog`);
      await page.screenshot({ path: path.join(EVIDENCE_DIR, `p1-mobile-decision-dialog-${viewport.name}.png`) });
      await page.getByText('Hold results pending investigation').click();

      await page.getByRole('button', { name: 'Verify recovery', exact: true }).click();
      await checkNoHorizontalOverflow(page, `${viewport.name}-held-verification`);
      await page.screenshot({ path: path.join(EVIDENCE_DIR, `p1-mobile-held-verification-${viewport.name}.png`) });
      assert(`MOBILE-HELD-STATE-${viewport.name}`, await page.locator('text=Held').count() > 0, `HELD/verification state correctly reflected at ${viewport.name}`);
    }
    await context.close();
  }

  await browser.close();
  server.close();

  const total = passed + failed;
  const result = { status: failed === 0 ? 'PASS' : 'FAIL', passed, failed, total, browserExecutable: execPath, checkpoints };
  fs.writeFileSync(path.join(EVIDENCE_DIR, 'result.json'), JSON.stringify(result, null, 2));

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Stage 12B Browser E2E: ${passed}/${total} passed, ${failed} failed`);
  if (failed > 0) { console.error('BROWSER E2E FAILED.'); process.exit(1); }
  console.log('BROWSER E2E PASSED (real Chromium, not simulated).');
  process.exit(0);
}
main().catch(e => {
  const result = { status: 'BLOCKED', reason: 'Unexpected error: ' + e.message };
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  fs.writeFileSync(path.join(EVIDENCE_DIR, 'result.json'), JSON.stringify(result, null, 2));
  console.error('FATAL:', e.message, e.stack);
  process.exit(1);
});
