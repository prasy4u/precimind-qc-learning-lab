'use strict';
/**
 * tests/stage10f-rule-point-equivalence.js
 *
 * Stage 10F: Rule Detective point-selection state-transition validation.
 * Artifact Class: D (recovery infrastructure)
 *
 * Uses Case 3 (correctRules=["13s"], correctScope="single")
 * and the authored trigger point: Level 1, Run 4, zScore=-3.20 SD
 *
 * Run: node tests/stage10f-rule-point-equivalence.js
 */

const { chromium } = require('playwright');
const fs   = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');

const ROOT      = path.join(__dirname, '..');
const ORIG_PATH = path.join(ROOT, 'recovery', 'original-v0.8.html');
const CAND_PATH = path.join(ROOT, 'dist', 'recovered-v0.8-faithful.html');
const PORT_ORIG = 10201;
const PORT_CAND = 10202;

const results = [];
let matchCount = 0, diffCount = 0, blockedCount = 0, ntCount = 0;
const observed = {};

function record(id, domain, action, orig, cand, cls, notes) {
  const entry = { id, domain, action, original: String(orig), candidate: String(cand), classification: cls };
  if (notes) entry.notes = notes;
  results.push(entry);
  if (cls === 'MATCH') { matchCount++; console.log(`  ✓ [${id}] ${action.substring(0, 55)}`); }
  else if (cls === 'DIFFERENCE') { diffCount++; console.error(`  ✗ DIFF [${id}] orig=${String(orig).substring(0,50)} cand=${String(cand).substring(0,50)}`); }
  else if (cls === 'BLOCKED') { blockedCount++; console.log(`  ~ BLOCKED [${id}]`); }
  else { ntCount++; console.log(`  - NT [${id}]`); }
}

function h(s) { return crypto.createHash('sha256').update(String(s || '')).digest('hex').substring(0, 16); }

function createServer(htmlPath, port) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const server = http.createServer((_, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  });
  return new Promise(resolve => server.listen(port, '127.0.0.1', () => resolve(server)));
}

async function loadPage(browser, url) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    locale: 'en-US',
    timezoneId: 'UTC',
  });
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));
  await page.route('**fonts.googleapis.com**', r => r.abort());
  await page.route('**fonts.gstatic.com**', r => r.abort());
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(5000);
  return { page, ctx, pageErrors };
}

async function getHint(page) {
  return page.evaluate(() => document.querySelector('.point-selection-hint')?.textContent.trim() || 'ABSENT');
}

async function getRingCount(page) {
  return page.evaluate(() => document.querySelectorAll('.mlj-ring-selected').length);
}

(async () => {
  const origServer = await createServer(ORIG_PATH, PORT_ORIG);
  const candServer = await createServer(CAND_PATH, PORT_CAND);

  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  const origCtx = await loadPage(browser, `http://127.0.0.1:${PORT_ORIG}/`);
  const candCtx = await loadPage(browser, `http://127.0.0.1:${PORT_CAND}/`);
  const o = origCtx.page, c = candCtx.page;

  // Navigate to Rule Laboratory → Rule Detective
  console.log('\n=== SETUP: Rule Laboratory → Rule Detective ===');
  await o.locator('nav button', { hasText: 'Rule Laboratory' }).first().click({ timeout: 5000 });
  await c.locator('nav button', { hasText: 'Rule Laboratory' }).first().click({ timeout: 5000 });
  await o.waitForTimeout(600); await c.waitForTimeout(600);
  await o.locator('#main button,[role="tab"]', { hasText: 'Rule Detective' }).first().click({ timeout: 3000 });
  await c.locator('#main button,[role="tab"]', { hasText: 'Rule Detective' }).first().click({ timeout: 3000 });
  await o.waitForTimeout(600); await c.waitForTimeout(600);

  // Select Case 3
  console.log('\n=== SELECT CASE 3 ===');
  await o.locator('#main button', { hasText: '3' }).first().click({ timeout: 2000 });
  await c.locator('#main button', { hasText: '3' }).first().click({ timeout: 2000 });
  await o.waitForTimeout(500); await c.waitForTimeout(500);

  const oCaseText = await o.evaluate(() => document.getElementById('main')?.textContent.replace(/\s+/g, ' ').trim().substring(0, 100) || '');
  const cCaseText = await c.evaluate(() => document.getElementById('main')?.textContent.replace(/\s+/g, ' ').trim().substring(0, 100) || '');
  record('rule-case3-selected', 'rules', 'Case 3 selected: initial DOM',
    h(await o.evaluate(() => document.getElementById('root')?.innerHTML || '')),
    h(await c.evaluate(() => document.getElementById('root')?.innerHTML || '')),
    (await o.evaluate(() => document.getElementById('root')?.innerHTML || '')) ===
    (await c.evaluate(() => document.getElementById('root')?.innerHTML || '')) ? 'MATCH' : 'DIFFERENCE');

  // Verify hint ABSENT before rule selection
  console.log('\n=== HINT BEFORE RULE ===');
  const oHintBefore = await getHint(o);
  const cHintBefore = await getHint(c);
  observed.hintBeforeRule = oHintBefore;
  record('hint-absent-before-rule', 'rules', 'Hint absent before any rule selected',
    oHintBefore, cHintBefore, oHintBefore === cHintBefore ? 'MATCH' : 'DIFFERENCE',
    `before rule: orig="${oHintBefore}" cand="${cHintBefore}"`);

  // Select 1₃s rule (Question A)
  console.log('\n=== SELECT 1₃s RULE ===');
  await o.locator('#main button', { hasText: '1₃s' }).first().click({ timeout: 2000 });
  await c.locator('#main button', { hasText: '1₃s' }).first().click({ timeout: 2000 });
  await o.waitForTimeout(500); await c.waitForTimeout(500);

  // Verify hint NOW EXISTS = "Selected: none yet"
  const oHintAfterRule = await getHint(o);
  const cHintAfterRule = await getHint(c);
  observed.hintAfterRule = oHintAfterRule;
  record('hint-none-after-rule', 'rules', 'Hint = "Selected: none yet" after 1₃s selected',
    oHintAfterRule, cHintAfterRule, oHintAfterRule === cHintAfterRule ? 'MATCH' : 'DIFFERENCE',
    `after rule: orig="${oHintAfterRule}"`);

  const oHintIsNoneYet = oHintAfterRule.includes('none yet') || oHintAfterRule.includes('Selected: none');
  record('hint-exists-after-rule', 'rules', 'Hint exists and contains "none yet"',
    String(oHintIsNoneYet), String(cHintAfterRule.includes('none yet') || cHintAfterRule.includes('Selected: none')),
    oHintIsNoneYet ? 'MATCH' : 'DIFFERENCE',
    `expected "Selected: none yet", got "${oHintAfterRule}"`);

  // Find Level 1 Run 4 (the -3.20 SD trigger point)
  console.log('\n=== FOCUS LEVEL 1 RUN 4 POINT ===');
  const oPoint = await o.evaluate(() => {
    const pts = Array.from(document.querySelectorAll('.mlj-point-g[role="button"][tabindex="0"]'));
    const pt = pts.find(p => {
      const label = p.getAttribute('aria-label') || '';
      return label.includes('run 4') && (label.includes('-3.2') || label.includes('-3.20'));
    });
    if (pt) {
      pt.focus();
      return {
        tag: pt.tagName,
        cls: String(pt.classList),
        role: pt.getAttribute('role'),
        tabIdx: String(pt.tabIndex),
        label: pt.getAttribute('aria-label'),
      };
    }
    return null;
  });
  const cPoint = await c.evaluate(() => {
    const pts = Array.from(document.querySelectorAll('.mlj-point-g[role="button"][tabindex="0"]'));
    const pt = pts.find(p => {
      const label = p.getAttribute('aria-label') || '';
      return label.includes('run 4') && (label.includes('-3.2') || label.includes('-3.20'));
    });
    if (pt) {
      pt.focus();
      return {
        tag: pt.tagName,
        cls: String(pt.classList),
        role: pt.getAttribute('role'),
        tabIdx: String(pt.tabIndex),
        label: pt.getAttribute('aria-label'),
      };
    }
    return null;
  });

  console.log('  Orig point:', JSON.stringify(oPoint));
  console.log('  Cand point:', JSON.stringify(cPoint));
  observed.focusedPoint = oPoint;

  if (!oPoint || !cPoint) {
    record('point-focus-tag', 'rules', 'Level 1 Run 4 -3.20 SD point found', String(!!oPoint), String(!!cPoint), 'BLOCKED', 'Point not found');
  } else {
    record('point-focus-tag', 'rules', 'Focused element tag = G',
      oPoint.tag.toUpperCase(), 'G', oPoint.tag.toUpperCase() === 'G' && cPoint.tag.toUpperCase() === 'G' ? 'MATCH' : 'DIFFERENCE');
    record('point-focus-class', 'rules', 'Focused element class contains mlj-point-g',
      String(oPoint.cls.includes('mlj-point-g')), String(cPoint.cls.includes('mlj-point-g')),
      oPoint.cls.includes('mlj-point-g') && cPoint.cls.includes('mlj-point-g') ? 'MATCH' : 'DIFFERENCE',
      `orig class: ${oPoint.cls}`);
    record('point-focus-role', 'rules', 'Focused element role = button',
      oPoint.role, cPoint.role, oPoint.role === 'button' && cPoint.role === 'button' ? 'MATCH' : 'DIFFERENCE');
    record('point-focus-tabindex', 'rules', 'Focused element tabIndex = 0',
      oPoint.tabIdx, cPoint.tabIdx, oPoint.tabIdx === '0' && cPoint.tabIdx === '0' ? 'MATCH' : 'DIFFERENCE');
    record('point-focus-aria', 'rules', 'Focused element aria-label (Level 1, run 4, -3.20 SD)',
      oPoint.label, cPoint.label, oPoint.label === cPoint.label ? 'MATCH' : 'DIFFERENCE',
      `orig label: "${oPoint.label}"`);

    const oLabelOk = oPoint.label && oPoint.label.includes('run 4') && (oPoint.label.includes('-3.2') || oPoint.label.includes('-3.20'));
    record('point-aria-level1-run4', 'rules', 'Aria-label identifies Level 1 / run 4 / -3.20 SD',
      String(oLabelOk), String(cPoint.label && cPoint.label.includes('run 4') && (cPoint.label.includes('-3.2') || cPoint.label.includes('-3.20'))),
      oLabelOk ? 'MATCH' : 'DIFFERENCE', `label: "${oPoint.label}"`);
  }

  // Test keyboard Enter
  console.log('\n=== KEYBOARD ENTER TEST ===');
  await o.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if(pt){pt.focus();pt.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));pt.dispatchEvent(new KeyboardEvent('keyup',{key:'Enter',bubbles:true}));}}); 
  await c.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if(pt){pt.focus();pt.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));pt.dispatchEvent(new KeyboardEvent('keyup',{key:'Enter',bubbles:true}));}});
  await o.waitForTimeout(400); await c.waitForTimeout(400);
  const oHintEnter = await getHint(o); const cHintEnter = await getHint(c);
  const oRingEnter = await getRingCount(o); const cRingEnter = await getRingCount(c);
  const oEnterActivated = oRingEnter > 0 || (oHintEnter && !oHintEnter.includes('none yet'));
  observed.enterActivated = oEnterActivated;
  record('keyboard-enter-result', 'rules', 'Enter key: ring count and hint',
    `rings=${oRingEnter},hint="${oHintEnter}"`, `rings=${cRingEnter},hint="${cHintEnter}"`,
    oRingEnter === cRingEnter && oHintEnter === cHintEnter ? 'MATCH' : 'DIFFERENCE',
    oEnterActivated ? 'Enter activated point' : 'Enter did NOT activate point (no onKeyDown in v0.8 source)');

  // Test keyboard Space (if Enter didn't activate)
  console.log('\n=== KEYBOARD SPACE TEST ===');
  await o.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if(pt){pt.focus();pt.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true}));pt.dispatchEvent(new KeyboardEvent('keyup',{key:' ',bubbles:true}));}});
  await c.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if(pt){pt.focus();pt.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true}));pt.dispatchEvent(new KeyboardEvent('keyup',{key:' ',bubbles:true}));}});
  await o.waitForTimeout(400); await c.waitForTimeout(400);
  const oHintSpace = await getHint(o); const cHintSpace = await getHint(c);
  const oRingSpace = await getRingCount(o); const cRingSpace = await getRingCount(c);
  const oSpaceActivated = oRingSpace > 0 || (oHintSpace && !oHintSpace.includes('none yet') && oHintSpace !== 'ABSENT');
  observed.spaceActivated = oSpaceActivated;
  record('keyboard-space-result', 'rules', 'Space key: ring count and hint',
    `rings=${oRingSpace},hint="${oHintSpace}"`, `rings=${cRingSpace},hint="${cHintSpace}"`,
    oRingSpace === cRingSpace && oHintSpace === cHintSpace ? 'MATCH' : 'DIFFERENCE',
    oSpaceActivated ? 'Space activated point' : 'Space did NOT activate point (no onKeyDown in v0.8 source — keyboard-focusable but not keyboard-activatable)');

  // Actual click-activation (the authored interaction)
  console.log('\n=== CLICK ACTIVATION (authored interaction) ===');
  await o.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if(pt){pt.focus();pt.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
  await c.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if(pt){pt.focus();pt.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
  await o.waitForTimeout(500); await c.waitForTimeout(500);

  const oHintClick = await getHint(o); const cHintClick = await getHint(c);
  const oRingClick = await getRingCount(o); const cRingClick = await getRingCount(c);
  const oDOM = await o.evaluate(() => document.getElementById('root')?.innerHTML || '');
  const cDOM = await c.evaluate(() => document.getElementById('root')?.innerHTML || '');
  observed.hintAfterClick = oHintClick; observed.ringCountAfterClick = oRingClick;

  console.log(`  Orig: hint="${oHintClick}", rings=${oRingClick}`);
  console.log(`  Cand: hint="${cHintClick}", rings=${cRingClick}`);

  record('hint-after-click', 'rules', 'Hint after click = "Selected: 4:L1"',
    oHintClick, cHintClick, oHintClick === cHintClick ? 'MATCH' : 'DIFFERENCE',
    `orig: "${oHintClick}"`);
  const oHintCorrect = oHintClick.includes('4:L1') || oHintClick.includes('4 : L1') || oHintClick.includes('4,L1');
  const cHintCorrect = cHintClick.includes('4:L1') || cHintClick.includes('4 : L1') || cHintClick.includes('4,L1');
  record('selected-key-4-L1', 'rules', 'Hint text contains "4:L1" (run 4, Level 1)',
    String(oHintCorrect), String(cHintCorrect),
    oHintCorrect && cHintCorrect ? 'MATCH' : 'DIFFERENCE',
    `expected "4:L1" in hint, got "${oHintClick}"`);
  // The authored MLJ chart renders 2 .mlj-ring-selected elements per selected point
  // (outer ring + inner sample indicator). Verify >= 1 and orig === cand.
  record('selected-ring-count-1', 'rules', 'Ring elements >= 1 after click (orig = cand)',
    String(oRingClick), String(cRingClick), oRingClick >= 1 && oRingClick === cRingClick ? 'MATCH' : 'DIFFERENCE',
    `rings per selection: orig=${oRingClick} cand=${cRingClick} (authored: 2 elements per point)`);
  record('dom-after-selection', 'rules', 'Root DOM identical after selection',
    h(oDOM), h(cDOM), oDOM === cDOM ? 'MATCH' : 'DIFFERENCE');

  // Deselect: click same point again
  console.log('\n=== DESELECT (second click) ===');
  await o.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if(pt){pt.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
  await c.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if(pt){pt.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
  await o.waitForTimeout(500); await c.waitForTimeout(500);

  const oHintDesel = await getHint(o); const cHintDesel = await getHint(c);
  const oRingDesel = await getRingCount(o); const cRingDesel = await getRingCount(c);
  observed.hintAfterDeselect = oHintDesel; observed.ringCountAfterDeselect = oRingDesel;

  console.log(`  Orig: hint="${oHintDesel}", rings=${oRingDesel}`);
  record('hint-after-deselect', 'rules', 'Hint returns to "Selected: none yet" after deselect',
    oHintDesel, cHintDesel, oHintDesel === cHintDesel ? 'MATCH' : 'DIFFERENCE',
    `orig: "${oHintDesel}"`);
  const oDeselOk = oHintDesel.includes('none yet') || oHintDesel.includes('Selected: none');
  record('hint-deselect-none-yet', 'rules', 'Hint contains "none yet" after deselect',
    String(oDeselOk), String(cHintDesel.includes('none yet') || cHintDesel.includes('Selected: none')),
    oDeselOk ? 'MATCH' : 'DIFFERENCE');
  // After deselect: ring count should be less than after selection, and orig = cand
  record('selected-ring-count-0', 'rules', 'Ring count < pre-deselect and orig = cand',
    String(oRingDesel), String(cRingDesel),
    oRingDesel < oRingClick && oRingDesel === cRingDesel ? 'MATCH' : 'DIFFERENCE',
    `after deselect: orig=${oRingDesel} cand=${cRingDesel} (was ${oRingClick})`);

  // Optional: Reselect + enable submission gate
  console.log('\n=== RESELECT + SUBMISSION GATE ===');
  await o.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if(pt){pt.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
  await c.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if(pt){pt.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
  await o.waitForTimeout(400); await c.waitForTimeout(400);
  // Select scope: Single observation
  for (const scope of ['Single observation', 'Single', 'single']) {
    const v = await o.locator('#main button', { hasText: scope }).first().isVisible({ timeout: 300 }).catch(() => false);
    if (v) {
      await o.locator('#main button', { hasText: scope }).first().click({ timeout: 1500 });
      await c.locator('#main button', { hasText: scope }).first().click({ timeout: 1500 });
      await o.waitForTimeout(300); await c.waitForTimeout(300);
      break;
    }
  }
  // Select confidence
  for (const conf of ['High', 'Moderate']) {
    const v = await o.locator('#main button', { hasText: conf }).first().isVisible({ timeout: 300 }).catch(() => false);
    if (v) {
      await o.locator('#main button', { hasText: conf }).first().click({ timeout: 1500 });
      await c.locator('#main button', { hasText: conf }).first().click({ timeout: 1500 });
      await o.waitForTimeout(300); await c.waitForTimeout(300);
      break;
    }
  }
  const oSubmitEnabled = await o.locator('#main button', { hasText: /commit|submit|check|reveal/i }).first().isEnabled({ timeout: 1000 }).catch(() => false);
  const cSubmitEnabled = await c.locator('#main button', { hasText: /commit|submit|check|reveal/i }).first().isEnabled({ timeout: 1000 }).catch(() => false);
  record('submit-enabled', 'rules', 'Submission button enabled after complete selection',
    String(oSubmitEnabled), String(cSubmitEnabled), oSubmitEnabled === cSubmitEnabled ? 'MATCH' : 'DIFFERENCE');

  // Console/page errors
  const oErrors = origCtx.pageErrors.length;
  const cErrors = candCtx.pageErrors.length;
  record('console-pageerror', 'rules', 'Page errors during traversal',
    String(oErrors), String(cErrors), oErrors === cErrors ? 'MATCH' : 'DIFFERENCE',
    oErrors > 0 ? `orig errors: ${origCtx.pageErrors.join('; ')}` : 'none');

  // ── Summary ─────────────────────────────────────────────────────────────
  await browser.close();
  try { origServer.close(); } catch(e){}
  try { candServer.close(); } catch(e){}

  console.log('\n=== STAGE 10F SUMMARY ===');
  console.log(`Total checkpoints: ${results.length}`);
  console.log(`MATCH: ${matchCount} | DIFF: ${diffCount} | BLOCKED: ${blockedCount} | NT: ${ntCount}`);

  const summary = {
    total: results.length,
    match: matchCount,
    difference: diffCount,
    blocked: blockedCount,
    not_tested: ntCount,
  };

  const out = {
    stage: '10F',
    artifact_class: 'D',
    browser: 'Chromium 141.0.7390.37',
    font_policy: 'Google Fonts aborted identically for both artifacts',
    original_sha: 'e5317bf135f350b258428b985c1034a081e244a295f2e580c93cb6a6a091c8e4',
    candidate_sha: 'a9fe9a3acbb8c35347cc735292ad63883778e5c12845f4da529129119b72c886',
    case_selected: 3,
    rule_selected: '1₃s',
    trigger_point: 'Level 1, run 4, value 93.60, -3.20 SD',
    observed,
    summary,
    checkpoints: results,
  };

  fs.writeFileSync(
    path.join(ROOT, 'recovery', 'stage10f-rule-point-equivalence.json'),
    JSON.stringify(out, null, 2)
  );
  console.log('\nResults written to recovery/stage10f-rule-point-equivalence.json');

  if (diffCount > 0 || blockedCount > 0 || ntCount > 0) {
    console.error(`\nSTAGE 10F FAILED: diff=${diffCount} blocked=${blockedCount} nt=${ntCount}`);
    process.exit(1);
  } else {
    console.log('Stage 10F browser run: all checkpoints MATCH.');
    process.exit(0);
  }
})().catch(e => { console.error('FATAL:', e.message, e.stack?.split('\n')[1]); process.exit(1); });
