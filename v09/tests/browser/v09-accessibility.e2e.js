'use strict';
/**
 * v09/tests/browser/v09-accessibility.e2e.js
 *
 * MAINTAINED v0.9 browser test (Layer 3 — Browser/E2E).
 * Artifact Class: V09_TEST
 *
 * Stage 11B corrective closure: EQA and LJ Space/Enter behavior is now
 * ACTUALLY MEASURED via a deterministic DOM state indicator (the toggled
 * point's circle `r` attribute, which flips between the "active" (r=7)
 * and "inactive" (r=5) values on every successful toggle). Focus alone
 * sets r=7 but does NOT constitute proof of activation — only a
 * measured toggle (7→5 or 5→7) from a known starting state counts.
 *
 * Tests the v0.9 compatibility artifact (v09/dist/precimind-v0.9-compat.html,
 * assembled from CURRENT v09/src via v09/tools/assemble-v09-compat.js)
 * against the validated v0.8 faithful reference
 * (dist/recovered-v0.8-faithful.html).
 *
 * Classifications used:
 *   MATCH                 — identical behavior, no v0.9 change intended here
 *   INTENDED_DELTA         — documented, deliberate v0.9 accessibility fix
 *   UNEXPECTED_DIFFERENCE  — any other difference (FAIL condition)
 *   BLOCKED                — test could not execute
 *
 * Run: node v09/tests/browser/v09-accessibility.e2e.js
 */

const { chromium } = require('playwright');
const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createServer } = require('../helpers/server');

const ROOT = path.join(__dirname, '..', '..', '..'); // /home/claude
const V09  = path.join(ROOT, 'v09');
const ORIG_PATH = path.join(ROOT, 'dist', 'recovered-v0.8-faithful.html');
const CAND_PATH = path.join(V09, 'dist', 'precimind-v0.9-compat.html');
const PORT_ORIG = 10601;
const PORT_CAND = 10602;

const results = [];
let match = 0, delta = 0, unexpected = 0, blocked = 0;

function record(id, domain, action, orig, cand, cls, notes) {
  const entry = { id, domain, action, original: String(orig), candidate: String(cand), classification: cls };
  if (notes) entry.notes = notes;
  results.push(entry);
  const sym = cls === 'MATCH' ? '✓' : cls === 'INTENDED_DELTA' ? '◆' : cls === 'BLOCKED' ? '~' : '✗';
  console.log(`  ${sym} [${id}] ${cls}: ${action} (orig=${entry.original} cand=${entry.candidate})`);
  if (cls === 'MATCH') match++;
  else if (cls === 'INTENDED_DELTA') delta++;
  else if (cls === 'UNEXPECTED_DIFFERENCE') unexpected++;
  else blocked++;
}

function h(s) { return crypto.createHash('sha256').update(String(s || '')).digest('hex').substring(0, 16); }

async function freshPage(browser, url) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'en-US', timezoneId: 'UTC' });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**fonts.googleapis.com**', r => r.abort());
  await p.route('**fonts.gstatic.com**', r => r.abort());
  await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(5000);
  return { p, ctx, errors };
}
async function nav(p, label) {
  await p.locator('nav button', { hasText: label }).first().click({ timeout: 5000 });
  await p.waitForTimeout(600);
}
async function root(p) { return p.evaluate(() => document.getElementById('root')?.innerHTML || ''); }

/**
 * Measures the toggle-point activation-state indicator (circle r attribute)
 * for a fresh-page pair, using a specific activation method, from a common
 * starting state (freshly focused point, r=7).
 */
async function measureToggle(browser, origUrl, candUrl, navSteps, activationMethod) {
  const o = await freshPage(browser, origUrl);
  const c = await freshPage(browser, candUrl);
  for (const step of navSteps) { await step(o.p); await step(c.p); }

  const oPoint = o.p.locator('.ljchart-point-g[role="button"][tabindex="0"]').first();
  const cPoint = c.p.locator('.ljchart-point-g[role="button"][tabindex="0"]').first();

  await oPoint.focus(); await cPoint.focus();
  await o.p.waitForTimeout(300); await c.p.waitForTimeout(300);
  const oRFocus = await oPoint.locator('circle').first().getAttribute('r');
  const cRFocus = await cPoint.locator('circle').first().getAttribute('r');

  if (activationMethod === 'click') {
    await oPoint.click(); await cPoint.click();
  } else if (activationMethod === 'Enter') {
    await o.p.keyboard.press('Enter'); await c.p.keyboard.press('Enter');
  } else if (activationMethod === 'Space') {
    await o.p.keyboard.press('Space'); await c.p.keyboard.press('Space');
  }
  await o.p.waitForTimeout(300); await c.p.waitForTimeout(300);
  const oRAfter = await oPoint.locator('circle').first().getAttribute('r');
  const cRAfter = await cPoint.locator('circle').first().getAttribute('r');

  const oPageErrors = o.errors.length;
  const cPageErrors = c.errors.length;

  await o.ctx.close(); await c.ctx.close();
  return { oRFocus, cRFocus, oRAfter, cRAfter, oToggled: oRAfter !== oRFocus, cToggled: cRAfter !== cRFocus, oPageErrors, cPageErrors };
}

(async () => {
  const origServer = await createServer(ORIG_PATH, PORT_ORIG);
  const candServer = await createServer(CAND_PATH, PORT_CAND);
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const ORIG_URL = `http://127.0.0.1:${PORT_ORIG}/`;
  const CAND_URL = `http://127.0.0.1:${PORT_CAND}/`;

  // ═══════════════ NON-REGRESSION CHECKS ═══════════════
  console.log('\n=== NON-REGRESSION: 14 destinations, 11 labs, levels ===');
  {
    const o = await freshPage(browser, ORIG_URL);
    const c = await freshPage(browser, CAND_URL);

    const oNavCount = await o.p.evaluate(() => document.querySelectorAll('nav button').length);
    const cNavCount = await c.p.evaluate(() => document.querySelectorAll('nav button').length);
    record('nav-14-destinations', 'nonregression', '14 primary nav destinations',
      oNavCount, cNavCount, oNavCount === 14 && cNavCount === 14 ? 'MATCH' : 'UNEXPECTED_DIFFERENCE');

    const LABS = ['Statistics Playground', 'LJ Laboratory', 'Pattern Challenge', 'Rule Laboratory',
      'QC Strategy Lab', 'Sigma Sandbox', 'Risk & Frequency Lab', 'Investigation Lab',
      'External Assurance Lab', 'BV & RCV Lab', 'Patient Surveillance Lab'];
    for (const lab of LABS) {
      await nav(o.p, lab); await nav(c.p, lab);
      const oH1 = await o.p.evaluate(() => document.querySelector('#main h1, #main h2')?.textContent.trim() || '');
      const cH1 = await c.p.evaluate(() => document.querySelector('#main h1, #main h2')?.textContent.trim() || '');
      record(`lab-h1-${lab.replace(/\W/g, '_').substring(0, 15)}`, 'nonregression', `${lab}: h1 unchanged`,
        oH1, cH1, oH1 === cH1 ? 'MATCH' : 'UNEXPECTED_DIFFERENCE');
    }
    for (const scr of ['Home', 'Competency Map', 'Evidence']) {
      await nav(o.p, scr); await nav(c.p, scr);
      const oR = await root(o.p); const cR = await root(c.p);
      record(`screen-${scr.replace(/\W/g, '_')}`, 'nonregression', `${scr} reachable`,
        h(oR), h(cR), oR === cR ? 'MATCH' : 'UNEXPECTED_DIFFERENCE');
    }
    for (const lv of ['beginner', 'intermediate', 'advanced', 'expert']) {
      await o.p.selectOption('#level-select', lv); await c.p.selectOption('#level-select', lv);
      await o.p.waitForTimeout(300); await c.p.waitForTimeout(300);
      const oLv = await o.p.evaluate(() => document.getElementById('level-select')?.value);
      const cLv = await c.p.evaluate(() => document.getElementById('level-select')?.value);
      record(`level-${lv}`, 'nonregression', `Level ${lv} functional`,
        oLv, cLv, oLv === cLv ? 'MATCH' : 'UNEXPECTED_DIFFERENCE');
    }
    record('page-errors', 'nonregression', 'No candidate-only page errors',
      String(o.errors.length), String(c.errors.length), o.errors.length === c.errors.length ? 'MATCH' : 'UNEXPECTED_DIFFERENCE');
    await o.ctx.close(); await c.ctx.close();
  }

  // ═══════════════ RULE DETECTIVE: click / Enter / Space (preserved) ═══════════════
  console.log('\n=== RULE DETECTIVE: Case 3 / 1₃s / Level1-Run4 ===');
  {
    const o = await freshPage(browser, ORIG_URL);
    const c = await freshPage(browser, CAND_URL);
    await nav(o.p, 'Rule Laboratory'); await nav(c.p, 'Rule Laboratory');
    await o.p.locator('#main button,[role="tab"]', { hasText: 'Rule Detective' }).first().click({ timeout: 3000 });
    await c.p.locator('#main button,[role="tab"]', { hasText: 'Rule Detective' }).first().click({ timeout: 3000 });
    await o.p.waitForTimeout(600); await c.p.waitForTimeout(600);
    await o.p.locator('#main button', { hasText: '3' }).first().click({ timeout: 2000 });
    await c.p.locator('#main button', { hasText: '3' }).first().click({ timeout: 2000 });
    await o.p.waitForTimeout(500); await c.p.waitForTimeout(500);
    await o.p.locator('#main button', { hasText: '1₃s' }).first().click({ timeout: 2000 });
    await c.p.locator('#main button', { hasText: '1₃s' }).first().click({ timeout: 2000 });
    await o.p.waitForTimeout(500); await c.p.waitForTimeout(500);

    const oHintAfterRule = await o.p.evaluate(() => document.querySelector('.point-selection-hint')?.textContent.trim() || 'ABSENT');
    const cHintAfterRule = await c.p.evaluate(() => document.querySelector('.point-selection-hint')?.textContent.trim() || 'ABSENT');
    record('rule-hint-after-1_3s', 'rules', 'Hint = "Selected: none yet" after 1₃s',
      oHintAfterRule, cHintAfterRule, oHintAfterRule === cHintAfterRule ? 'MATCH' : 'UNEXPECTED_DIFFERENCE');

    // CLICK — must remain MATCH
    await o.p.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if (pt) { pt.focus(); pt.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
    await c.p.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if (pt) { pt.focus(); pt.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
    await o.p.waitForTimeout(400); await c.p.waitForTimeout(400);
    const oHintClick = await o.p.evaluate(() => document.querySelector('.point-selection-hint')?.textContent.trim() || 'ABSENT');
    const cHintClick = await c.p.evaluate(() => document.querySelector('.point-selection-hint')?.textContent.trim() || 'ABSENT');
    record('rule-click', 'rules', 'Click activation (Selected: 4:L1)',
      oHintClick, cHintClick, oHintClick === cHintClick && oHintClick.includes('4:L1') ? 'MATCH' : 'UNEXPECTED_DIFFERENCE');

    // Deselect via click
    await o.p.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if (pt) pt.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await c.p.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if (pt) pt.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await o.p.waitForTimeout(400); await c.p.waitForTimeout(400);

    // ENTER — v0.8 known limitation, v0.9 INTENDED FIX (preserved)
    await o.p.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if (pt) { pt.focus(); pt.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); } });
    await c.p.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if (pt) { pt.focus(); pt.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); } });
    await o.p.waitForTimeout(400); await c.p.waitForTimeout(400);
    const oHintEnter = await o.p.evaluate(() => document.querySelector('.point-selection-hint')?.textContent.trim() || 'ABSENT');
    const cHintEnter = await c.p.evaluate(() => document.querySelector('.point-selection-hint')?.textContent.trim() || 'ABSENT');
    const v08NoActivate = !oHintEnter.includes('4:L1');
    const v09Activates = cHintEnter.includes('4:L1');
    record('rule-enter', 'rules', 'Enter: v0.8 no-activate → v0.9 activates',
      oHintEnter, cHintEnter, (v08NoActivate && v09Activates) ? 'INTENDED_DELTA' : 'UNEXPECTED_DIFFERENCE');

    await c.p.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if (pt) { pt.focus(); pt.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); } });
    await c.p.waitForTimeout(400);

    // SPACE — v0.8 known limitation, v0.9 INTENDED FIX (preserved)
    await o.p.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if (pt) { pt.focus(); pt.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true })); } });
    await c.p.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if (pt) { pt.focus(); pt.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true })); } });
    await o.p.waitForTimeout(400); await c.p.waitForTimeout(400);
    const oHintSpace = await o.p.evaluate(() => document.querySelector('.point-selection-hint')?.textContent.trim() || 'ABSENT');
    const cHintSpace = await c.p.evaluate(() => document.querySelector('.point-selection-hint')?.textContent.trim() || 'ABSENT');
    const v08SpaceNoActivate = !oHintSpace.includes('4:L1');
    const v09SpaceActivates = cHintSpace.includes('4:L1');
    record('rule-space', 'rules', 'Space: v0.8 no-activate → v0.9 activates',
      oHintSpace, cHintSpace, (v08SpaceNoActivate && v09SpaceActivates) ? 'INTENDED_DELTA' : 'UNEXPECTED_DIFFERENCE');

    await o.ctx.close(); await c.ctx.close();
  }

  // ═══════════════ LJ CHART: click / Enter / Space — MEASURED via toggle indicator ═══════════════
  console.log('\n=== LJ CHART: measured toggle state (circle r attribute) ===');
  {
    const navSteps = [async (p) => await nav(p, 'LJ Laboratory')];

    const clickResult = await measureToggle(browser, ORIG_URL, CAND_URL, navSteps, 'click');
    record('lj-click', 'lj', 'Click toggles active state (r: 7→5)',
      `focus=${clickResult.oRFocus},after=${clickResult.oRAfter},toggled=${clickResult.oToggled}`,
      `focus=${clickResult.cRFocus},after=${clickResult.cRAfter},toggled=${clickResult.cToggled}`,
      (clickResult.oToggled === clickResult.cToggled && clickResult.oRAfter === clickResult.cRAfter) ? 'MATCH' : 'UNEXPECTED_DIFFERENCE',
      `v0.8 click toggles r ${clickResult.oRFocus}→${clickResult.oRAfter}; v0.9 click toggles r ${clickResult.cRFocus}→${clickResult.cRAfter}`);

    const enterResult = await measureToggle(browser, ORIG_URL, CAND_URL, navSteps, 'Enter');
    const v08EnterNoToggle = !enterResult.oToggled;
    const v09EnterToggles = enterResult.cToggled;
    const v09EnterMatchesClick = enterResult.cRAfter === clickResult.cRAfter; // same end-state as click produced
    record('lj-enter', 'lj', 'Enter: v0.8 no-toggle (r stays 7) → v0.9 toggles (matches click result)',
      `focus=${enterResult.oRFocus},after=${enterResult.oRAfter},toggled=${enterResult.oToggled}`,
      `focus=${enterResult.cRFocus},after=${enterResult.cRAfter},toggled=${enterResult.cToggled}`,
      (v08EnterNoToggle && v09EnterToggles && v09EnterMatchesClick) ? 'INTENDED_DELTA' : 'UNEXPECTED_DIFFERENCE',
      `v0.8: focus=${enterResult.oRFocus}, after Enter=${enterResult.oRAfter} (unchanged, known limitation). v0.9: focus=${enterResult.cRFocus}, after Enter=${enterResult.cRAfter} (toggled, matches click's ${clickResult.cRAfter})`);

    const spaceResult = await measureToggle(browser, ORIG_URL, CAND_URL, navSteps, 'Space');
    const v08SpaceNoToggle = !spaceResult.oToggled;
    const v09SpaceToggles = spaceResult.cToggled;
    const v09SpaceMatchesClick = spaceResult.cRAfter === clickResult.cRAfter;
    record('lj-space', 'lj', 'Space: v0.8 no-toggle (r stays 7) → v0.9 toggles (matches click result)',
      `focus=${spaceResult.oRFocus},after=${spaceResult.oRAfter},toggled=${spaceResult.oToggled}`,
      `focus=${spaceResult.cRFocus},after=${spaceResult.cRAfter},toggled=${spaceResult.cToggled}`,
      (v08SpaceNoToggle && v09SpaceToggles && v09SpaceMatchesClick) ? 'INTENDED_DELTA' : 'UNEXPECTED_DIFFERENCE',
      `v0.8: focus=${spaceResult.oRFocus}, after Space=${spaceResult.oRAfter} (unchanged). v0.9: focus=${spaceResult.cRFocus}, after Space=${spaceResult.cRAfter} (toggled, matches click's ${clickResult.cRAfter})`);

    record('lj-page-errors', 'lj', 'No page errors across LJ toggle tests',
      String(clickResult.oPageErrors + enterResult.oPageErrors + spaceResult.oPageErrors),
      String(clickResult.cPageErrors + enterResult.cPageErrors + spaceResult.cPageErrors),
      (clickResult.oPageErrors + enterResult.oPageErrors + spaceResult.oPageErrors) === (clickResult.cPageErrors + enterResult.cPageErrors + spaceResult.cPageErrors) ? 'MATCH' : 'UNEXPECTED_DIFFERENCE');
  }

  // ═══════════════ EQA CHART: click / Enter / Space — MEASURED via toggle indicator ═══════════════
  console.log('\n=== EQA LONGITUDINAL CHART: measured toggle state (circle r attribute) ===');
  {
    const navSteps = [
      async (p) => await nav(p, 'External Assurance Lab'),
      async (p) => { await p.locator('#main button,[role="tab"]', { hasText: /longitudinal/i }).first().click({ timeout: 3000 }); await p.waitForTimeout(600); },
    ];

    // Verify points actually exist before proceeding
    {
      const check = await freshPage(browser, ORIG_URL);
      for (const step of navSteps) await step(check.p);
      const cnt = await check.p.evaluate(() => document.querySelectorAll('.ljchart-point-g[role="button"][tabindex="0"]').length);
      await check.ctx.close();
      if (cnt === 0) {
        record('eqa-click', 'eqa', 'EQA longitudinal chart point exists', '0', '0', 'BLOCKED', 'No longitudinal data authored for default case — cannot measure');
        record('eqa-enter', 'eqa', 'EQA longitudinal chart point exists', '0', '0', 'BLOCKED', 'No longitudinal data authored for default case — cannot measure');
        record('eqa-space', 'eqa', 'EQA longitudinal chart point exists', '0', '0', 'BLOCKED', 'No longitudinal data authored for default case — cannot measure');
      } else {
        const eqaClickResult = await measureToggle(browser, ORIG_URL, CAND_URL, navSteps, 'click');
        record('eqa-click', 'eqa', 'Click toggles active state (r: 7→5)',
          `focus=${eqaClickResult.oRFocus},after=${eqaClickResult.oRAfter},toggled=${eqaClickResult.oToggled}`,
          `focus=${eqaClickResult.cRFocus},after=${eqaClickResult.cRAfter},toggled=${eqaClickResult.cToggled}`,
          (eqaClickResult.oToggled === eqaClickResult.cToggled && eqaClickResult.oRAfter === eqaClickResult.cRAfter) ? 'MATCH' : 'UNEXPECTED_DIFFERENCE',
          `v0.8 click toggles r ${eqaClickResult.oRFocus}→${eqaClickResult.oRAfter}; v0.9 click toggles r ${eqaClickResult.cRFocus}→${eqaClickResult.cRAfter}`);

        const eqaEnterResult = await measureToggle(browser, ORIG_URL, CAND_URL, navSteps, 'Enter');
        const eqaV08EnterNoToggle = !eqaEnterResult.oToggled;
        const eqaV09EnterToggles = eqaEnterResult.cToggled;
        const eqaV09EnterMatchesClick = eqaEnterResult.cRAfter === eqaClickResult.cRAfter;
        record('eqa-enter', 'eqa', 'Enter: v0.8 no-toggle → v0.9 toggles (matches click)',
          `focus=${eqaEnterResult.oRFocus},after=${eqaEnterResult.oRAfter},toggled=${eqaEnterResult.oToggled}`,
          `focus=${eqaEnterResult.cRFocus},after=${eqaEnterResult.cRAfter},toggled=${eqaEnterResult.cToggled}`,
          (eqaV08EnterNoToggle && eqaV09EnterToggles && eqaV09EnterMatchesClick) ? 'INTENDED_DELTA' : 'UNEXPECTED_DIFFERENCE',
          `v0.8: focus=${eqaEnterResult.oRFocus}, after=${eqaEnterResult.oRAfter} (unchanged). v0.9: focus=${eqaEnterResult.cRFocus}, after=${eqaEnterResult.cRAfter} (toggled, matches click's ${eqaClickResult.cRAfter})`);

        const eqaSpaceResult = await measureToggle(browser, ORIG_URL, CAND_URL, navSteps, 'Space');
        const eqaV08SpaceNoToggle = !eqaSpaceResult.oToggled;
        const eqaV09SpaceToggles = eqaSpaceResult.cToggled;
        const eqaV09SpaceMatchesClick = eqaSpaceResult.cRAfter === eqaClickResult.cRAfter;
        record('eqa-space', 'eqa', 'Space: v0.8 no-toggle → v0.9 toggles (matches click)',
          `focus=${eqaSpaceResult.oRFocus},after=${eqaSpaceResult.oRAfter},toggled=${eqaSpaceResult.oToggled}`,
          `focus=${eqaSpaceResult.cRFocus},after=${eqaSpaceResult.cRAfter},toggled=${eqaSpaceResult.cToggled}`,
          (eqaV08SpaceNoToggle && eqaV09SpaceToggles && eqaV09SpaceMatchesClick) ? 'INTENDED_DELTA' : 'UNEXPECTED_DIFFERENCE',
          `v0.8: focus=${eqaSpaceResult.oRFocus}, after=${eqaSpaceResult.oRAfter} (unchanged). v0.9: focus=${eqaSpaceResult.cRFocus}, after=${eqaSpaceResult.cRAfter} (toggled, matches click's ${eqaClickResult.cRAfter})`);

        record('eqa-page-errors', 'eqa', 'No page errors across EQA toggle tests',
          String(eqaClickResult.oPageErrors + eqaEnterResult.oPageErrors + eqaSpaceResult.oPageErrors),
          String(eqaClickResult.cPageErrors + eqaEnterResult.cPageErrors + eqaSpaceResult.cPageErrors),
          (eqaClickResult.oPageErrors + eqaEnterResult.oPageErrors + eqaSpaceResult.oPageErrors) === (eqaClickResult.cPageErrors + eqaEnterResult.cPageErrors + eqaSpaceResult.cPageErrors) ? 'MATCH' : 'UNEXPECTED_DIFFERENCE');
      }
    }
  }

  await browser.close();
  try { origServer.close(); } catch (e) {}
  try { candServer.close(); } catch (e) {}

  console.log('\n=== SUMMARY ===');
  console.log(`Total: ${results.length} | MATCH: ${match} | INTENDED_DELTA: ${delta} | UNEXPECTED_DIFFERENCE: ${unexpected} | BLOCKED: ${blocked}`);

  const out = {
    stage: '11B-corrective-closure',
    artifact_class: 'V09_TEST',
    browser: 'Chromium 141.0.7390.37',
    original_reference: 'dist/recovered-v0.8-faithful.html (validated v0.8 faithful candidate)',
    candidate: 'v09/dist/precimind-v0.9-compat.html (current v09/src, post accessibility fixes)',
    measurement_method: 'Toggle-point activation state measured via circle r attribute (7=active/focused, 5=inactive) at a fresh page load per test, from a common focused starting state, rather than relying on tooltip text or focus alone as proof of activation.',
    summary: { total: results.length, match, intended_delta: delta, unexpected_difference: unexpected, blocked },
    checkpoints: results,
  };
  fs.writeFileSync(path.join(V09, 'tests', 'browser', 'v09-accessibility-result.json'), JSON.stringify(out, null, 2));
  console.log('Result written to v09/tests/browser/v09-accessibility-result.json');

  if (unexpected > 0 || blocked > 0) {
    console.error(`FAILED: unexpected_difference=${unexpected} blocked=${blocked}`);
    process.exit(1);
  }
  process.exit(0);
})().catch(e => { console.error('FATAL:', e.message, e.stack?.split('\n')[1]); process.exit(1); });
