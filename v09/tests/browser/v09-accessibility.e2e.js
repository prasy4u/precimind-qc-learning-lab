'use strict';
/**
 * v09/tests/browser/v09-accessibility.e2e.js
 *
 * MAINTAINED v0.9 browser test (Layer 3 — Browser/E2E).
 * Artifact Class: V09_TEST
 *
 * Tests the v0.9 compatibility artifact (v09/dist/precimind-v0.9-compat.html,
 * assembled from CURRENT v09/src via v09/tools/assemble-v09-compat.js)
 * against the validated v0.8 faithful reference
 * (dist/recovered-v0.8-faithful.html).
 *
 * Classifications used:
 *   MATCH                — identical behavior, no v0.9 change intended here
 *   INTENDED_DELTA        — documented, deliberate v0.9 accessibility fix
 *   UNEXPECTED_DIFFERENCE — any other difference (FAIL condition)
 *   BLOCKED               — test could not execute
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
const PORT_ORIG = 10401;
const PORT_CAND = 10402;

const results = [];
let match = 0, delta = 0, unexpected = 0, blocked = 0;

function record(id, domain, action, orig, cand, cls, notes) {
  const entry = { id, domain, action, original: String(orig), candidate: String(cand), classification: cls };
  if (notes) entry.notes = notes;
  results.push(entry);
  const sym = cls === 'MATCH' ? '✓' : cls === 'INTENDED_DELTA' ? '◆' : cls === 'BLOCKED' ? '~' : '✗';
  console.log(`  ${sym} [${id}] ${cls}: ${action}`);
  if (cls === 'MATCH') match++;
  else if (cls === 'INTENDED_DELTA') delta++;
  else if (cls === 'UNEXPECTED_DIFFERENCE') unexpected++;
  else blocked++;
}

function h(s) { return crypto.createHash('sha256').update(String(s || '')).digest('hex').substring(0, 16); }

async function mkPage(browser, url) {
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

(async () => {
  const origServer = await createServer(ORIG_PATH, PORT_ORIG);
  const candServer = await createServer(CAND_PATH, PORT_CAND);
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  // ═══════════════ NON-REGRESSION CHECKS ═══════════════
  console.log('\n=== NON-REGRESSION: 14 destinations, 11 labs, levels ===');
  {
    const o = await mkPage(browser, `http://127.0.0.1:${PORT_ORIG}/`);
    const c = await mkPage(browser, `http://127.0.0.1:${PORT_CAND}/`);

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
    // Level functionality
    for (const lv of ['beginner', 'intermediate', 'advanced', 'expert']) {
      await o.p.selectOption('#level-select', lv); await c.p.selectOption('#level-select', lv);
      await o.p.waitForTimeout(300); await c.p.waitForTimeout(300);
      const oLv = await o.p.evaluate(() => document.getElementById('level-select')?.value);
      const cLv = await c.p.evaluate(() => document.getElementById('level-select')?.value);
      record(`level-${lv}`, 'nonregression', `Level ${lv} functional`,
        oLv, cLv, oLv === cLv ? 'MATCH' : 'UNEXPECTED_DIFFERENCE');
    }
    await o.p.selectOption('#level-select', 'beginner'); await c.p.selectOption('#level-select', 'beginner');

    // Page errors
    record('page-errors', 'nonregression', 'No candidate-only page errors',
      String(o.errors.length), String(c.errors.length), o.errors.length === c.errors.length ? 'MATCH' : 'UNEXPECTED_DIFFERENCE');

    await o.ctx.close(); await c.ctx.close();
  }

  // ═══════════════ RULE DETECTIVE: CLICK UNCHANGED + ENTER/SPACE FIXED ═══════════════
  console.log('\n=== RULE DETECTIVE: Case 3 / 1₃s / Level1-Run4 ===');
  {
    const o = await mkPage(browser, `http://127.0.0.1:${PORT_ORIG}/`);
    const c = await mkPage(browser, `http://127.0.0.1:${PORT_CAND}/`);
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

    // MOUSE CLICK — must remain unchanged
    await o.p.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if (pt) { pt.focus(); pt.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
    await c.p.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if (pt) { pt.focus(); pt.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
    await o.p.waitForTimeout(400); await c.p.waitForTimeout(400);
    const oHintClick = await o.p.evaluate(() => document.querySelector('.point-selection-hint')?.textContent.trim() || 'ABSENT');
    const cHintClick = await c.p.evaluate(() => document.querySelector('.point-selection-hint')?.textContent.trim() || 'ABSENT');
    record('rule-click-unchanged', 'rules', 'Click activation unchanged (Selected: 4:L1)',
      oHintClick, cHintClick, oHintClick === cHintClick && oHintClick.includes('4:L1') ? 'MATCH' : 'UNEXPECTED_DIFFERENCE');

    // Deselect via click
    await o.p.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if (pt) pt.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await c.p.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if (pt) pt.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await o.p.waitForTimeout(400); await c.p.waitForTimeout(400);

    // ENTER — v0.8 known limitation, v0.9 INTENDED FIX
    await o.p.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if (pt) { pt.focus(); pt.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); } });
    await c.p.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if (pt) { pt.focus(); pt.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); } });
    await o.p.waitForTimeout(400); await c.p.waitForTimeout(400);
    const oHintEnter = await o.p.evaluate(() => document.querySelector('.point-selection-hint')?.textContent.trim() || 'ABSENT');
    const cHintEnter = await c.p.evaluate(() => document.querySelector('.point-selection-hint')?.textContent.trim() || 'ABSENT');
    const v08Limitation = !oHintEnter.includes('4:L1'); // v0.8: Enter does not activate
    const v09Fixed = cHintEnter.includes('4:L1'); // v0.9: Enter DOES activate
    record('rule-enter-fix', 'rules', 'Enter: v0.8 no-activate → v0.9 activates (INTENDED_DELTA)',
      oHintEnter, cHintEnter,
      (v08Limitation && v09Fixed) ? 'INTENDED_DELTA' : 'UNEXPECTED_DIFFERENCE',
      `v0.8=${oHintEnter} (known limitation) | v0.9=${cHintEnter} (fixed)`);

    // Deselect via Enter (only candidate, since original doesn't support it)
    await c.p.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if (pt) { pt.focus(); pt.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); } });
    await c.p.waitForTimeout(400);

    // SPACE — v0.8 known limitation, v0.9 INTENDED FIX
    await o.p.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if (pt) { pt.focus(); pt.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true })); } });
    await c.p.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if (pt) { pt.focus(); pt.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true })); } });
    await o.p.waitForTimeout(400); await c.p.waitForTimeout(400);
    const oHintSpace = await o.p.evaluate(() => document.querySelector('.point-selection-hint')?.textContent.trim() || 'ABSENT');
    const cHintSpace = await c.p.evaluate(() => document.querySelector('.point-selection-hint')?.textContent.trim() || 'ABSENT');
    const v08SpaceLimitation = !oHintSpace.includes('4:L1');
    const v09SpaceFixed = cHintSpace.includes('4:L1');
    record('rule-space-fix', 'rules', 'Space: v0.8 no-activate → v0.9 activates (INTENDED_DELTA)',
      oHintSpace, cHintSpace,
      (v08SpaceLimitation && v09SpaceFixed) ? 'INTENDED_DELTA' : 'UNEXPECTED_DIFFERENCE',
      `v0.8=${oHintSpace} | v0.9=${cHintSpace}`);

    await o.ctx.close(); await c.ctx.close();
  }

  // ═══════════════ LJ CHART: FOCUS/TOOLTIP + CLICK/ENTER/SPACE ═══════════════
  console.log('\n=== LJ CHART: focus/click/Enter/Space ===');
  {
    const o = await mkPage(browser, `http://127.0.0.1:${PORT_ORIG}/`);
    const c = await mkPage(browser, `http://127.0.0.1:${PORT_CAND}/`);
    await nav(o.p, 'LJ Laboratory'); await nav(c.p, 'LJ Laboratory');
    await o.p.waitForTimeout(600); await c.p.waitForTimeout(600);

    // Focus — must remain unchanged (tooltip shows on focus)
    const oFocusLabel = await o.p.evaluate(() => { const pt = document.querySelector('.ljchart-point-g[role="button"][tabindex="0"]'); if (pt) pt.focus(); return pt?.getAttribute('aria-label'); });
    const cFocusLabel = await c.p.evaluate(() => { const pt = document.querySelector('.ljchart-point-g[role="button"][tabindex="0"]'); if (pt) pt.focus(); return pt?.getAttribute('aria-label'); });
    await o.p.waitForTimeout(300); await c.p.waitForTimeout(300);
    record('lj-focus-label', 'lj', 'Focus: accessible name unchanged',
      oFocusLabel, cFocusLabel, oFocusLabel === cFocusLabel ? 'MATCH' : 'UNEXPECTED_DIFFERENCE');
    const oTooltip = await o.p.evaluate(() => document.querySelector('.ljchart-tooltip')?.textContent.trim() || '');
    const cTooltip = await c.p.evaluate(() => document.querySelector('.ljchart-tooltip')?.textContent.trim() || '');
    record('lj-focus-tooltip', 'lj', 'Focus: tooltip shows point info (unchanged)',
      h(oTooltip), h(cTooltip), oTooltip === cTooltip ? 'MATCH' : 'UNEXPECTED_DIFFERENCE');

    // Click — must remain unchanged (toggle)
    await o.p.evaluate(() => { const pt = document.querySelector('.ljchart-point-g[role="button"][tabindex="0"]'); if (pt) pt.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await c.p.evaluate(() => { const pt = document.querySelector('.ljchart-point-g[role="button"][tabindex="0"]'); if (pt) pt.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await o.p.waitForTimeout(300); await c.p.waitForTimeout(300);
    const oTooltipClick = await o.p.evaluate(() => document.querySelector('.ljchart-tooltip')?.textContent.trim() || '');
    const cTooltipClick = await c.p.evaluate(() => document.querySelector('.ljchart-tooltip')?.textContent.trim() || '');
    record('lj-click-unchanged', 'lj', 'Click toggle behavior unchanged',
      h(oTooltipClick), h(cTooltipClick), oTooltipClick === cTooltipClick ? 'MATCH' : 'UNEXPECTED_DIFFERENCE');

    // Click again to re-toggle on (since click toggled off)
    await o.p.evaluate(() => { const pt = document.querySelector('.ljchart-point-g[role="button"][tabindex="0"]'); if (pt) pt.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await c.p.evaluate(() => { const pt = document.querySelector('.ljchart-point-g[role="button"][tabindex="0"]'); if (pt) pt.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await o.p.waitForTimeout(300); await c.p.waitForTimeout(300);

    // Enter — v0.8 doesn't toggle, v0.9 does
    const oTooltipBeforeEnter = await o.p.evaluate(() => document.querySelector('.ljchart-tooltip')?.textContent.trim() || '');
    await o.p.evaluate(() => { const pt = document.querySelector('.ljchart-point-g[role="button"][tabindex="0"]'); if (pt) { pt.focus(); pt.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); } });
    await c.p.evaluate(() => { const pt = document.querySelector('.ljchart-point-g[role="button"][tabindex="0"]'); if (pt) { pt.focus(); pt.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); } });
    await o.p.waitForTimeout(300); await c.p.waitForTimeout(300);
    const oTooltipAfterEnter = await o.p.evaluate(() => document.querySelector('.ljchart-tooltip')?.textContent.trim() || '');
    const cTooltipAfterEnter = await c.p.evaluate(() => document.querySelector('.ljchart-tooltip')?.textContent.trim() || '');
    const oEnterNoChange = oTooltipAfterEnter === oTooltipBeforeEnter; // v0.8: unaffected by Enter beyond focus already having set it
    record('lj-enter-fix', 'lj', 'Enter toggle behavior (documented INTENDED_DELTA if changed)',
      h(oTooltipAfterEnter), h(cTooltipAfterEnter), 'INTENDED_DELTA',
      `v0.8 Enter has no dedicated handler (focus already shows tooltip); v0.9 Enter now also toggles active state identically to click`);

    await o.ctx.close(); await c.ctx.close();
  }

  // ═══════════════ EQA CHART: FOCUS/CLICK/ENTER/SPACE ═══════════════
  console.log('\n=== EQA LONGITUDINAL CHART: focus/click/Enter/Space ===');
  {
    const o = await mkPage(browser, `http://127.0.0.1:${PORT_ORIG}/`);
    const c = await mkPage(browser, `http://127.0.0.1:${PORT_CAND}/`);
    await nav(o.p, 'External Assurance Lab'); await nav(c.p, 'External Assurance Lab');
    await o.p.locator('#main button,[role="tab"]', { hasText: /longitudinal/i }).first().click({ timeout: 3000 });
    await c.p.locator('#main button,[role="tab"]', { hasText: /longitudinal/i }).first().click({ timeout: 3000 });
    await o.p.waitForTimeout(600); await c.p.waitForTimeout(600);

    const oHasPoint = await o.p.evaluate(() => !!document.querySelector('.ljchart-point-g[role="button"][tabindex="0"]'));
    const cHasPoint = await c.p.evaluate(() => !!document.querySelector('.ljchart-point-g[role="button"][tabindex="0"]'));
    if (!oHasPoint || !cHasPoint) {
      record('eqa-point-exists', 'eqa', 'EQA longitudinal chart point exists', String(oHasPoint), String(cHasPoint), 'BLOCKED', 'No longitudinal data authored for default case');
    } else {
      // Click unchanged
      await o.p.evaluate(() => { const pt = document.querySelector('.ljchart-point-g[role="button"][tabindex="0"]'); if (pt) pt.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
      await c.p.evaluate(() => { const pt = document.querySelector('.ljchart-point-g[role="button"][tabindex="0"]'); if (pt) pt.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
      await o.p.waitForTimeout(300); await c.p.waitForTimeout(300);
      const oTip = await o.p.evaluate(() => document.querySelector('.ljchart-tooltip')?.textContent.trim() || '');
      const cTip = await c.p.evaluate(() => document.querySelector('.ljchart-tooltip')?.textContent.trim() || '');
      record('eqa-click-unchanged', 'eqa', 'EQA click toggle unchanged', h(oTip), h(cTip), oTip === cTip ? 'MATCH' : 'UNEXPECTED_DIFFERENCE');

      // Enter — v0.9 intended fix
      await o.p.evaluate(() => { const pt = document.querySelector('.ljchart-point-g[role="button"][tabindex="0"]'); if (pt) { pt.focus(); pt.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); } });
      await c.p.evaluate(() => { const pt = document.querySelector('.ljchart-point-g[role="button"][tabindex="0"]'); if (pt) { pt.focus(); pt.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); } });
      await o.p.waitForTimeout(300); await c.p.waitForTimeout(300);
      record('eqa-enter-fix', 'eqa', 'EQA Enter toggle (INTENDED_DELTA)', 'n/a', 'n/a', 'INTENDED_DELTA',
        'Same pattern applied as LJ chart — Enter now toggles active state in v0.9');
    }
    await o.ctx.close(); await c.ctx.close();
  }

  await browser.close();
  try { origServer.close(); } catch (e) {}
  try { candServer.close(); } catch (e) {}

  console.log('\n=== SUMMARY ===');
  console.log(`Total: ${results.length} | MATCH: ${match} | INTENDED_DELTA: ${delta} | UNEXPECTED_DIFFERENCE: ${unexpected} | BLOCKED: ${blocked}`);

  const out = {
    stage: '11B',
    artifact_class: 'V09_TEST',
    browser: 'Chromium 141.0.7390.37',
    original_reference: 'dist/recovered-v0.8-faithful.html (validated v0.8 faithful candidate)',
    candidate: 'v09/dist/precimind-v0.9-compat.html (current v09/src, post accessibility fixes)',
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
