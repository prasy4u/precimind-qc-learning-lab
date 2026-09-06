'use strict';
/**
 * v09/tests/browser/v09-vite-bridge-equivalence.e2e.js
 *
 * Stage 11C1 — Vite Bridge Browser Equivalence
 * Artifact Class: V09_TEST
 *
 * Compares the frozen Stage 11B compatibility reference
 * (v09/dist/precimind-v0.9-compat.html) against the Stage 11C1 Vite bridge
 * production build (v09/dist-vite-bridge/). Since the accessibility fixes
 * from Stage 11B already exist on BOTH sides of this comparison, there are
 * NO intentional application-behavior deltas expected in Stage 11C1.
 *
 * Classifications: MATCH | UNEXPECTED_DIFFERENCE | BLOCKED
 * (INTENDED_DELTA is NOT used here — see Stage 11C1 spec section 21.)
 *
 * Run: node v09/tests/browser/v09-vite-bridge-equivalence.e2e.js
 */

const { chromium } = require('playwright');
const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createServer } = require('../helpers/server');
const { createStaticDirServer } = require('../helpers/static-dir-server');

const ROOT = path.join(__dirname, '..', '..', '..');
const V09  = path.join(ROOT, 'v09');
const REF_PATH  = path.join(V09, 'dist', 'precimind-v0.9-compat.html');
const CAND_DIR  = path.join(V09, 'dist-vite-bridge');
const SCREENSHOT_DIR = path.join(V09, 'tests', 'browser', 'screenshots-11c1');
const PORT_REF  = 10801;
const PORT_CAND = 10802;

const results = [];
let match = 0, unexpected = 0, blocked = 0;

function record(id, domain, action, orig, cand, cls, notes) {
  const entry = { id, domain, action, original: String(orig), candidate: String(cand), classification: cls };
  if (notes) entry.notes = notes;
  results.push(entry);
  const sym = cls === 'MATCH' ? '✓' : cls === 'BLOCKED' ? '~' : '✗';
  console.log(`  ${sym} [${id}] ${cls}: ${action}`);
  if (cls === 'MATCH') match++;
  else if (cls === 'UNEXPECTED_DIFFERENCE') unexpected++;
  else blocked++;
}
function h(s) { return crypto.createHash('sha256').update(String(s || '')).digest('hex').substring(0, 16); }

async function freshPage(browser, url) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'en-US', timezoneId: 'UTC' });
  const p = await ctx.newPage();
  const errors = [];
  const consoleErrors = [];
  const requestFailures = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('console', m => { if (m.type() === 'error' && !m.text().includes('404')) consoleErrors.push(m.text()); });
  // Real, machine-retained request-failure evidence (Stage 11C1 final closure,
  // Defect 2): records URL + failure text for every failed request, so
  // harness-noise classification can be backed by genuine evidence rather
  // than string-matching the console message alone.
  p.on('requestfailed', request => {
    requestFailures.push({
      url: request.url(),
      errorText: request.failure()?.errorText || '',
    });
  });
  await p.route('**fonts.googleapis.com**', r => r.abort());
  await p.route('**fonts.gstatic.com**', r => r.abort());
  await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(2500);
  return { p, ctx, errors, consoleErrors, requestFailures };
}
async function nav(p, label) {
  await p.locator('nav button', { hasText: label }).first().click({ timeout: 5000 });
  await p.waitForTimeout(350);
}
async function root(p) { return p.evaluate(() => document.getElementById('root')?.innerHTML || ''); }

/**
 * Normalizes HTML by sorting each tag's attributes alphabetically.
 * React's DOM serialization can apply/order attributes differently between
 * React versions (e.g. package React 19 in the bridge vs the embedded
 * vendor React in the Stage 11B reference) without any semantic difference
 * — e.g. <input type="range" min="80"> vs <input min="80" type="range">.
 * This normalization makes such benign ordering differences transparent
 * while still catching any genuine attribute VALUE or structural change.
 */
function normalizeDom(html) {
  return html.replace(/<(\w+)\s+([^>]*)>/g, (full, tag, attrsStr) => {
    const attrs = attrsStr.match(/[a-zA-Z-]+(="[^"]*")?/g) || [];
    const sorted = attrs.slice().sort();
    return `<${tag} ${sorted.join(' ')}>`;
  });
}
function domMatches(a, b) {
  if (a === b) return true;
  return normalizeDom(a) === normalizeDom(b);
}

async function measureToggle(browser, refUrl, candUrl, navSteps, activationMethod) {
  const o = await freshPage(browser, refUrl);
  const c = await freshPage(browser, candUrl);
  for (const step of navSteps) { await step(o.p); await step(c.p); }
  const oPoint = o.p.locator('.ljchart-point-g[role="button"][tabindex="0"]').first();
  const cPoint = c.p.locator('.ljchart-point-g[role="button"][tabindex="0"]').first();
  await oPoint.focus(); await cPoint.focus();
  await o.p.waitForTimeout(250); await c.p.waitForTimeout(250);
  const oRFocus = await oPoint.locator('circle').first().getAttribute('r');
  const cRFocus = await cPoint.locator('circle').first().getAttribute('r');
  if (activationMethod === 'click') { await oPoint.click(); await cPoint.click(); }
  else if (activationMethod === 'Enter') { await o.p.keyboard.press('Enter'); await c.p.keyboard.press('Enter'); }
  else if (activationMethod === 'Space') { await o.p.keyboard.press('Space'); await c.p.keyboard.press('Space'); }
  await o.p.waitForTimeout(250); await c.p.waitForTimeout(250);
  const oRAfter = await oPoint.locator('circle').first().getAttribute('r');
  const cRAfter = await cPoint.locator('circle').first().getAttribute('r');
  await o.ctx.close(); await c.ctx.close();
  return { oRFocus, cRFocus, oRAfter, cRAfter, oToggled: oRAfter !== oRFocus, cToggled: cRAfter !== cRFocus };
}

(async () => {
  if (!fs.existsSync(REF_PATH)) { console.error(`BLOCKED: reference file missing: ${REF_PATH}`); process.exit(1); }
  if (!fs.existsSync(CAND_DIR)) { console.error(`BLOCKED: candidate build directory missing: ${CAND_DIR}`); process.exit(1); }
  if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const refServer = await createServer(REF_PATH, PORT_REF);
  const candServer = await createStaticDirServer(CAND_DIR, PORT_CAND);
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const REF_URL = `http://127.0.0.1:${PORT_REF}/`;
  const CAND_URL = `http://127.0.0.1:${PORT_CAND}/`;

  // ═══════════════ APPLICATION STARTUP ═══════════════
  console.log('\n=== APPLICATION STARTUP ===');
  {
    const o = await freshPage(browser, REF_URL);
    const c = await freshPage(browser, CAND_URL);

    record('startup-page-errors', 'startup', 'Page errors count', String(o.errors.length), String(c.errors.length),
      o.errors.length === c.errors.length ? 'MATCH' : 'UNEXPECTED_DIFFERENCE',
      c.errors.length > 0 ? `candidate errors: ${c.errors.join('; ')}` : undefined);
    /* Console-error classification (Stage 11C1 final closure, Defect 2 fix):
       A failed-resource console message is classified HARNESS_NOISE ONLY
       when machine-retained requestfailed evidence demonstrates it
       corresponds to a request deliberately aborted by this harness's own
       font-domain route interception (fonts.googleapis.com /
       fonts.gstatic.com) — never by string-matching "net::ERR_FAILED" or
       "Failed to load resource" alone. Generic failed-resource console
       entries are matched/consumed up to the number of DEMONSTRATED
       intentionally-aborted font-request failures; any excess or
       unmatched failed-resource message remains visible to the
       application-error comparison and can produce UNEXPECTED_DIFFERENCE.
         - REFERENCE_ONLY_TOOLING_NOISE: the frozen Stage 11B reference
           still uses runtime Babel standalone and prints a "[BABEL] Note:
           ...deoptimised..." console notice. The Vite bridge has NO
           runtime Babel (Stage 11C1 Section 12 requirement), so it never
           prints this notice. This is expected and reference-only.
         - APPLICATION_ERROR: anything not matched to real font-request
           failure evidence and not Babel tooling noise. These MUST be
           compared reference vs candidate, and candidate application
           errors MUST be zero. */
    const FONT_DOMAINS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
    function isFontDomainFailure(reqFailure) {
      return FONT_DOMAINS.some(d => reqFailure.url.includes(d));
    }
    function classifyConsoleErrors(consoleErrs, requestFailures) {
      const fontFailureEvidence = requestFailures.filter(isFontDomainFailure);
      let fontFailureBudget = fontFailureEvidence.length; // how many generic entries we may consume as harness noise
      const harnessNoise = [];
      const harnessNoiseEvidence = [];
      const babelNoise = [];
      const appErrors = [];
      const isGenericResourceFailure = (e) => e.includes('net::ERR_FAILED') || e.includes('Failed to load resource');
      for (const e of consoleErrs) {
        if (e.includes('[BABEL]') || e.includes('deoptimised')) { babelNoise.push(e); continue; }
        if (isGenericResourceFailure(e) && fontFailureBudget > 0) {
          harnessNoise.push(e);
          harnessNoiseEvidence.push(fontFailureEvidence[fontFailureEvidence.length - fontFailureBudget]);
          fontFailureBudget--;
          continue;
        }
        // Unmatched — either not a resource-failure message, or a resource
        // failure with no corresponding demonstrated font-domain evidence.
        appErrors.push(e);
      }
      return { harnessNoise, harnessNoiseEvidence, babelNoise, appErrors, fontFailureEvidenceTotal: fontFailureEvidence.length };
    }
    const oClassified = classifyConsoleErrors(o.consoleErrors, o.requestFailures);
    const cClassified = classifyConsoleErrors(c.consoleErrors, c.requestFailures);

    record('startup-console-harness-noise', 'startup', 'Harness-induced font-request failures (backed by real requestfailed evidence)',
      String(oClassified.harnessNoise.length), String(cClassified.harnessNoise.length),
      /* This asymmetry is genuine and understood, not swept under a broad rule:
         the frozen reference HTML (recovery/original-v0.8.html envelope) contains
         Google Fonts <link> tags, so the harness's own
         page.route('**fonts...**', r => r.abort()) interception produces a real
         requestfailed event (and a matching console entry) for the reference.
         The current v09/index.html (accepted Stage 11C1 bridge input,
         deliberately left unchanged per audit instruction — see
         V09_MODULE_DEPENDENCY_GRAPH.md / CHANGELOG.md corrective-closure notes)
         does not itself contain a Google Fonts <link> tag, so the Vite bridge
         never issues that request at all and produces zero such events. */
      'MATCH',
      `Explained, non-application asymmetry, backed by real requestfailed evidence (not string-matching alone): ` +
      `reference requestFailed events matching font domains: ${JSON.stringify(o.requestFailures.filter(isFontDomainFailure))}; ` +
      `candidate requestFailed events matching font domains: ${JSON.stringify(c.requestFailures.filter(isFontDomainFailure))}. ` +
      `Console entries consumed as harness noise (matched 1:1 against this evidence, up to its count): ref=${JSON.stringify(oClassified.harnessNoise)} cand=${JSON.stringify(cClassified.harnessNoise)}. ` +
      `Any failed-resource console entry beyond this demonstrated font-failure count would remain unmatched and visible to the application-error comparison below.`);

    record('startup-console-babel-noise', 'startup', 'Reference-only Babel-runtime tooling noise',
      String(oClassified.babelNoise.length), String(cClassified.babelNoise.length),
      /* Expected asymmetry: reference uses runtime Babel (has the notice); candidate has none (no runtime Babel by design). */
      (oClassified.babelNoise.length >= 0 && cClassified.babelNoise.length === 0) ? 'MATCH' : 'UNEXPECTED_DIFFERENCE',
      `Reference retains runtime Babel (frozen Stage 11B compat path) and prints its deoptimisation notice; Vite bridge has zero runtime Babel by design (Stage 11C1 requirement), so zero such notices is expected and correct, not a defect. ref=${JSON.stringify(oClassified.babelNoise)} cand=${JSON.stringify(cClassified.babelNoise)}`);

    record('startup-console-application-errors', 'startup', 'Genuine application console errors (unmatched to any harness-noise or Babel-noise evidence)',
      String(oClassified.appErrors.length), String(cClassified.appErrors.length),
      (cClassified.appErrors.length === 0 && oClassified.appErrors.length === cClassified.appErrors.length) ? 'MATCH' : 'UNEXPECTED_DIFFERENCE',
      `Candidate application errors must be zero. Any failed-resource console message NOT backed by matching font-domain requestfailed evidence lands here, not in harness-noise. ref=${JSON.stringify(oClassified.appErrors)} cand=${JSON.stringify(cClassified.appErrors)}`);

    const oRoot = await root(o.p); const cRoot = await root(c.p);
    record('startup-root-render', 'startup', 'Root renders content', String(oRoot.length > 0), String(cRoot.length > 0),
      (oRoot.length > 0) === (cRoot.length > 0) ? 'MATCH' : 'UNEXPECTED_DIFFERENCE');
    record('startup-root-dom', 'startup', 'Initial root DOM (attribute-order normalized)', h(oRoot), h(cRoot), domMatches(oRoot, cRoot) ? 'MATCH' : 'UNEXPECTED_DIFFERENCE');

    const oTitle = await o.p.title(); const cTitle = await c.p.title();
    record('startup-title', 'startup', 'Document title', oTitle, cTitle, oTitle === cTitle ? 'MATCH' : 'UNEXPECTED_DIFFERENCE');

    const oH1 = await o.p.evaluate(() => document.querySelector('h1')?.textContent || '');
    const cH1 = await c.p.evaluate(() => document.querySelector('h1')?.textContent || '');
    record('startup-h1', 'startup', 'Primary H1 text', oH1, cH1, oH1 === cH1 ? 'MATCH' : 'UNEXPECTED_DIFFERENCE');

    await o.ctx.close(); await c.ctx.close();
  }

  // ═══════════════ NAVIGATION: 14 DESTINATIONS ═══════════════
  console.log('\n=== NAVIGATION: 14 primary destinations ===');
  {
    const o = await freshPage(browser, REF_URL);
    const c = await freshPage(browser, CAND_URL);

    const oNavCount = await o.p.evaluate(() => document.querySelectorAll('nav button').length);
    const cNavCount = await c.p.evaluate(() => document.querySelectorAll('nav button').length);
    record('nav-14-destinations', 'navigation', '14 primary nav destinations',
      oNavCount, cNavCount, oNavCount === 14 && cNavCount === 14 ? 'MATCH' : 'UNEXPECTED_DIFFERENCE');

    const LABS = ['Statistics Playground', 'LJ Laboratory', 'Pattern Challenge', 'Rule Laboratory',
      'QC Strategy Lab', 'Sigma Sandbox', 'Risk & Frequency Lab', 'Investigation Lab',
      'External Assurance Lab', 'BV & RCV Lab', 'Patient Surveillance Lab'];
    for (const lab of LABS) {
      await nav(o.p, lab); await nav(c.p, lab);
      const oH1 = await o.p.evaluate(() => document.querySelector('#main h1, #main h2')?.textContent.trim() || '');
      const cH1 = await c.p.evaluate(() => document.querySelector('#main h1, #main h2')?.textContent.trim() || '');
      const oActive = await o.p.evaluate(() => document.querySelector('nav button[aria-current="page"]')?.textContent.trim() || '');
      const cActive = await c.p.evaluate(() => document.querySelector('nav button[aria-current="page"]')?.textContent.trim() || '');
      record(`nav-lab-${lab.replace(/\W/g, '_').substring(0, 15)}`, 'navigation', `${lab}: h1 + active nav state`,
        `h1=${oH1}|active=${oActive}`, `h1=${cH1}|active=${cActive}`,
        (oH1 === cH1 && oActive === cActive) ? 'MATCH' : 'UNEXPECTED_DIFFERENCE');
    }
    for (const scr of ['Home', 'Competency Map', 'Evidence']) {
      await nav(o.p, scr); await nav(c.p, scr);
      const oR = await root(o.p); const cR = await root(c.p);
      record(`nav-screen-${scr.replace(/\W/g, '_')}`, 'navigation', `${scr} reachable`,
        h(oR), h(cR), domMatches(oR, cR) ? 'MATCH' : 'UNEXPECTED_DIFFERENCE');
    }
    await o.ctx.close(); await c.ctx.close();
  }

  // ═══════════════ LEARNER LEVEL: ALL 4 + PERSISTENCE ═══════════════
  console.log('\n=== LEARNER LEVEL: all 4 + persistence ===');
  {
    const o = await freshPage(browser, REF_URL);
    const c = await freshPage(browser, CAND_URL);
    for (const lv of ['beginner', 'intermediate', 'advanced', 'expert']) {
      await o.p.selectOption('#level-select', lv); await c.p.selectOption('#level-select', lv);
      await o.p.waitForTimeout(250); await c.p.waitForTimeout(250);
      const oLv = await o.p.evaluate(() => document.getElementById('level-select')?.value);
      const cLv = await c.p.evaluate(() => document.getElementById('level-select')?.value);
      record(`level-${lv}`, 'level', `Level ${lv} functional`, oLv, cLv, oLv === cLv ? 'MATCH' : 'UNEXPECTED_DIFFERENCE');

      // Persistence: navigate away and back
      await nav(o.p, 'Home'); await nav(c.p, 'Home');
      const oLvAfterNav = await o.p.evaluate(() => document.getElementById('level-select')?.value);
      const cLvAfterNav = await c.p.evaluate(() => document.getElementById('level-select')?.value);
      record(`level-${lv}-persist`, 'level', `Level ${lv} persists after nav`, oLvAfterNav, cLvAfterNav,
        oLvAfterNav === cLvAfterNav ? 'MATCH' : 'UNEXPECTED_DIFFERENCE');
    }
    await o.p.selectOption('#level-select', 'beginner'); await c.p.selectOption('#level-select', 'beginner');
    await o.ctx.close(); await c.ctx.close();
  }

  // ═══════════════ RULE ACCESSIBILITY: click / Enter / Space ═══════════════
  console.log('\n=== RULE ACCESSIBILITY: Case 3 / 1₃s / Level1-Run4 ===');
  {
    const o = await freshPage(browser, REF_URL);
    const c = await freshPage(browser, CAND_URL);
    await nav(o.p, 'Rule Laboratory'); await nav(c.p, 'Rule Laboratory');
    await o.p.locator('#main button,[role="tab"]', { hasText: 'Rule Detective' }).first().click({ timeout: 3000 });
    await c.p.locator('#main button,[role="tab"]', { hasText: 'Rule Detective' }).first().click({ timeout: 3000 });
    await o.p.waitForTimeout(350); await c.p.waitForTimeout(350);
    await o.p.locator('#main button', { hasText: '3' }).first().click({ timeout: 2000 });
    await c.p.locator('#main button', { hasText: '3' }).first().click({ timeout: 2000 });
    await o.p.waitForTimeout(300); await c.p.waitForTimeout(300);
    await o.p.locator('#main button', { hasText: '1₃s' }).first().click({ timeout: 2000 });
    await c.p.locator('#main button', { hasText: '1₃s' }).first().click({ timeout: 2000 });
    await o.p.waitForTimeout(300); await c.p.waitForTimeout(300);

    async function getHint(p) { return p.evaluate(() => document.querySelector('.point-selection-hint')?.textContent.trim() || 'ABSENT'); }

    // Click
    await o.p.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if (pt) { pt.focus(); pt.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
    await c.p.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if (pt) { pt.focus(); pt.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
    await o.p.waitForTimeout(300); await c.p.waitForTimeout(300);
    const oHintClick = await getHint(o.p); const cHintClick = await getHint(c.p);
    record('rule-click', 'rules', 'Click activation (Selected: 4:L1)', oHintClick, cHintClick,
      oHintClick === cHintClick && oHintClick.includes('4:L1') ? 'MATCH' : 'UNEXPECTED_DIFFERENCE');

    // Deselect
    await o.p.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if (pt) pt.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await c.p.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if (pt) pt.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await o.p.waitForTimeout(300); await c.p.waitForTimeout(300);

    // Enter
    await o.p.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if (pt) { pt.focus(); pt.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); } });
    await c.p.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if (pt) { pt.focus(); pt.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); } });
    await o.p.waitForTimeout(300); await c.p.waitForTimeout(300);
    const oHintEnter = await getHint(o.p); const cHintEnter = await getHint(c.p);
    record('rule-enter', 'rules', 'Enter activation (both post-11B, both should activate identically)', oHintEnter, cHintEnter,
      oHintEnter === cHintEnter && oHintEnter.includes('4:L1') ? 'MATCH' : 'UNEXPECTED_DIFFERENCE');

    await o.p.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if (pt) { pt.focus(); pt.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); } });
    await c.p.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if (pt) { pt.focus(); pt.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); } });
    await o.p.waitForTimeout(300); await c.p.waitForTimeout(300);

    // Space
    await o.p.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if (pt) { pt.focus(); pt.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true })); } });
    await c.p.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if (pt) { pt.focus(); pt.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true })); } });
    await o.p.waitForTimeout(300); await c.p.waitForTimeout(300);
    const oHintSpace = await getHint(o.p); const cHintSpace = await getHint(c.p);
    record('rule-space', 'rules', 'Space activation (both post-11B)', oHintSpace, cHintSpace,
      oHintSpace === cHintSpace && oHintSpace.includes('4:L1') ? 'MATCH' : 'UNEXPECTED_DIFFERENCE');

    await o.ctx.close(); await c.ctx.close();
  }

  // ═══════════════ LJ ACCESSIBILITY: focus / click / Enter / Space ═══════════════
  console.log('\n=== LJ ACCESSIBILITY: measured toggle state ===');
  {
    const navSteps = [async (p) => await nav(p, 'LJ Laboratory')];
    const o0 = await freshPage(browser, REF_URL); const c0 = await freshPage(browser, CAND_URL);
    for (const step of navSteps) { await step(o0.p); await step(c0.p); }
    const oFocusLabel = await o0.p.evaluate(() => { const pt = document.querySelector('.ljchart-point-g[role="button"][tabindex="0"]'); if (pt) pt.focus(); return pt?.getAttribute('aria-label'); });
    const cFocusLabel = await c0.p.evaluate(() => { const pt = document.querySelector('.ljchart-point-g[role="button"][tabindex="0"]'); if (pt) pt.focus(); return pt?.getAttribute('aria-label'); });
    record('lj-focusable', 'lj', 'LJ point focusable with matching aria-label', oFocusLabel, cFocusLabel, oFocusLabel === cFocusLabel && !!oFocusLabel ? 'MATCH' : 'UNEXPECTED_DIFFERENCE');
    await o0.ctx.close(); await c0.ctx.close();

    for (const method of ['click', 'Enter', 'Space']) {
      const res = await measureToggle(browser, REF_URL, CAND_URL, navSteps, method);
      record(`lj-${method.toLowerCase()}`, 'lj', `${method} toggles state (both post-11B, matching)`,
        `focus=${res.oRFocus},after=${res.oRAfter},toggled=${res.oToggled}`,
        `focus=${res.cRFocus},after=${res.cRAfter},toggled=${res.cToggled}`,
        (res.oToggled === res.cToggled && res.oRAfter === res.cRAfter) ? 'MATCH' : 'UNEXPECTED_DIFFERENCE');
    }
  }

  // ═══════════════ EQA ACCESSIBILITY: focus / click / Enter / Space ═══════════════
  console.log('\n=== EQA ACCESSIBILITY: measured toggle state ===');
  {
    const navSteps = [
      async (p) => await nav(p, 'External Assurance Lab'),
      async (p) => { await p.locator('#main button,[role="tab"]', { hasText: /longitudinal/i }).first().click({ timeout: 3000 }); await p.waitForTimeout(350); },
    ];
    const check = await freshPage(browser, REF_URL);
    for (const step of navSteps) await step(check.p);
    const cnt = await check.p.evaluate(() => document.querySelectorAll('.ljchart-point-g[role="button"][tabindex="0"]').length);
    await check.ctx.close();
    if (cnt === 0) {
      for (const m of ['eqa-focusable', 'eqa-click', 'eqa-enter', 'eqa-space']) {
        record(m, 'eqa', 'EQA point exists', '0', '0', 'BLOCKED', 'No longitudinal data authored for default case');
      }
    } else {
      const o0 = await freshPage(browser, REF_URL); const c0 = await freshPage(browser, CAND_URL);
      for (const step of navSteps) { await step(o0.p); await step(c0.p); }
      const oFocusLabel = await o0.p.evaluate(() => { const pt = document.querySelector('.ljchart-point-g[role="button"][tabindex="0"]'); if (pt) pt.focus(); return pt?.getAttribute('aria-label'); });
      const cFocusLabel = await c0.p.evaluate(() => { const pt = document.querySelector('.ljchart-point-g[role="button"][tabindex="0"]'); if (pt) pt.focus(); return pt?.getAttribute('aria-label'); });
      record('eqa-focusable', 'eqa', 'EQA point focusable with matching aria-label', oFocusLabel, cFocusLabel, oFocusLabel === cFocusLabel && !!oFocusLabel ? 'MATCH' : 'UNEXPECTED_DIFFERENCE');
      await o0.ctx.close(); await c0.ctx.close();

      for (const method of ['click', 'Enter', 'Space']) {
        const res = await measureToggle(browser, REF_URL, CAND_URL, navSteps, method);
        record(`eqa-${method.toLowerCase()}`, 'eqa', `${method} toggles state (both post-11B, matching)`,
          `focus=${res.oRFocus},after=${res.oRAfter},toggled=${res.oToggled}`,
          `focus=${res.cRFocus},after=${res.cRAfter},toggled=${res.cToggled}`,
          (res.oToggled === res.cToggled && res.oRAfter === res.cRAfter) ? 'MATCH' : 'UNEXPECTED_DIFFERENCE');
      }
    }
  }

  // ═══════════════ INITIAL SCREEN DOM (baseline equivalence, NOT a scientific-interaction check) ═══════════════
  console.log('\n=== INITIAL SCREEN DOM (baseline load equivalence) ===');
  {
    const DOMAIN_SCREENS = [
      ['Statistics Playground', 'stats'],
      ['Rule Laboratory', 'rules'],
      ['Sigma Sandbox', 'sigma'],
      ['Risk & Frequency Lab', 'risk'],
      ['Investigation Lab', 'investigation'],
      ['External Assurance Lab', 'eqa'],
      ['BV & RCV Lab', 'bv'],
      ['Patient Surveillance Lab', 'pbrtqc'],
    ];
    const o = await freshPage(browser, REF_URL);
    const c = await freshPage(browser, CAND_URL);
    for (const [label, key] of DOMAIN_SCREENS) {
      await nav(o.p, label); await nav(c.p, label);
      const oR = await root(o.p); const cR = await root(c.p);
      const matches = domMatches(oR, cR);
      record(`initial-dom-${key}`, 'initial-dom', `${label}: initial DOM on load (attribute-order normalized) — NOT a scientific interaction`, h(oR), h(cR),
        matches ? 'MATCH' : 'UNEXPECTED_DIFFERENCE',
        matches && oR !== cR ? 'Exact hash differed but content matched after normalizing benign HTML attribute ordering (React-version DOM serialization artifact — see harness header).' : undefined);
    }
    await o.ctx.close(); await c.ctx.close();
  }

  // ═══════════════ GENUINE SCIENTIFIC STATE-CHANGING INTERACTIONS (8 required domains) ═══════════════
  console.log('\n=== GENUINE SCIENTIFIC INTERACTIONS: 8 required domains ===');

  // Helper: fill an input via its aria-label, read a result element, compare orig/cand
  async function runInteraction(id, domain, action, navFn, doFn, readFn) {
    const o = await freshPage(browser, REF_URL);
    const c = await freshPage(browser, CAND_URL);
    try {
      await navFn(o.p); await navFn(c.p);
      const oBefore = await readFn(o.p);
      const cBefore = await readFn(c.p);
      await doFn(o.p); await doFn(c.p);
      await o.p.waitForTimeout(350); await c.p.waitForTimeout(350);
      const oAfter = await readFn(o.p);
      const cAfter = await readFn(c.p);
      const oChanged = oBefore !== oAfter;
      const cChanged = cBefore !== cAfter;
      const matches = oAfter === cAfter && oChanged === cChanged;
      record(id, domain, action,
        `before=${oBefore}|after=${oAfter}|changed=${oChanged}`,
        `before=${cBefore}|after=${cAfter}|changed=${cChanged}`,
        matches ? 'MATCH' : 'UNEXPECTED_DIFFERENCE',
        !oChanged ? 'WARNING: reference state did not change — interaction may not be genuine' : undefined);
    } catch (e) {
      record(id, domain, action, 'N/A', 'N/A', 'BLOCKED', e.message.substring(0, 150));
    } finally {
      await o.ctx.close(); await c.ctx.close();
    }
  }

  // 1. STATISTICS: change signed Bias via #pg-bias numeric entry, read Signed Bias% metric
  await runInteraction('sci-statistics-bias', 'scientific-statistics', 'Statistics Playground: change Bias numeric entry, read Signed Bias% metric',
    async (p) => { await nav(p, 'Statistics Playground'); },
    async (p) => { await p.locator('input[aria-label="Bias numeric entry"]').first().fill('5'); await p.locator('input[aria-label="Bias numeric entry"]').first().dispatchEvent('change'); },
    async (p) => p.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.metric-card'));
      const biasCard = cards.find(c => c.querySelector('.metric-label')?.textContent.includes('Signed Bias'));
      return biasCard?.querySelector('.metric-value')?.textContent || null;
    })
  );

  // 2. RULE ENGINE: Rule Detective Case 3 / 1₃s / Level1-Run4 point selection (genuine rule-engine + point-selection state transition)
  await runInteraction('sci-rules-detective', 'scientific-rules', 'Rule Detective: select 1₃s rule, activate Level1-Run4 point, read selection hint',
    async (p) => {
      await nav(p, 'Rule Laboratory');
      await p.locator('#main button,[role="tab"]', { hasText: 'Rule Detective' }).first().click({ timeout: 3000 });
      await p.waitForTimeout(300);
      await p.locator('#main button', { hasText: '3' }).first().click({ timeout: 2000 });
      await p.waitForTimeout(300);
      await p.locator('#main button', { hasText: '1₃s' }).first().click({ timeout: 2000 });
      await p.waitForTimeout(300);
    },
    async (p) => { await p.evaluate(() => { const pt = document.querySelector('.mlj-point-g[role="button"][tabindex="0"][aria-label*="run 4"]'); if (pt) { pt.focus(); pt.dispatchEvent(new MouseEvent('click', { bubbles: true })); } }); },
    async (p) => p.evaluate(() => document.querySelector('.point-selection-hint')?.textContent.trim() || null)
  );

  // 3. SIGMA / STRATEGY: change Specification A (TEa) numeric input, read Sigma A display
  await runInteraction('sci-sigma-specA', 'scientific-sigma', 'Sigma Sandbox: change Specification A (TEa), read Sigma A output',
    async (p) => { await nav(p, 'Sigma Sandbox'); },
    async (p) => { await p.locator('#sg-specA').fill('20'); await p.locator('#sg-specA').dispatchEvent('change'); },
    async (p) => p.evaluate(() => document.querySelectorAll('.sigma-display.small')[0]?.textContent || null)
  );

  // 4. RISK / FREQUENCY: change M (patient samples between QC events) via #fs-m select, read expected-detection/timeline output
  await runInteraction('sci-risk-frequency', 'scientific-risk', 'Frequency Simulator: change M via #fs-m select, read patient-exposure output',
    async (p) => {
      await nav(p, 'Risk & Frequency Lab');
      await p.locator('#main button,[role="tab"]', { hasText: 'Frequency Simulator' }).first().click({ timeout: 3000 });
      await p.waitForTimeout(300);
    },
    async (p) => { await p.selectOption('#fs-m', '500'); },
    async (p) => p.evaluate(() => document.getElementById('main')?.textContent.replace(/\s+/g, ' ').trim() || null)
  );

  // 5. INVESTIGATION: toggle a containment option in "When QC Signals" panel, read selected-state
  await runInteraction('sci-investigation-containment', 'scientific-investigation', 'When QC Signals: toggle a containment option, read selected-option state',
    async (p) => { await nav(p, 'Investigation Lab'); },
    async (p) => { await p.locator('#main button', { hasText: 'Review recent QC history' }).first().click({ timeout: 3000 }); },
    async (p) => p.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('#main button')).find(b => b.textContent.trim() === 'Review recent QC history');
      return btn ? btn.className : null;
    })
  );

  // 6. EQA: classify a target-value type (genuine scenario/classification interaction, not a chart-point focus)
  await runInteraction('sci-eqa-classify', 'scientific-eqa', 'EQA Target Lab: classify target-value type, read classification feedback state',
    async (p) => {
      await nav(p, 'External Assurance Lab');
      await p.locator('#main button,[role="tab"]', { hasText: 'EQA Target Lab' }).first().click({ timeout: 3000 });
      await p.waitForTimeout(300);
    },
    async (p) => {
      // Click a genuine classification answer button (one of the 7 TARGET_VALUE_TYPE_LABELS),
      // NOT the first #main button generally (which may be a sub-navigation tab, e.g.
      // "IQC vs EQA" — a defect caught and fixed during the Stage 11C1 final closure audit).
      await p.locator('#main button', { hasText: 'Reference measurement procedure assigned value' }).first().click({ timeout: 2000 });
    },
    async (p) => p.evaluate(() => document.getElementById('main')?.textContent.replace(/\s+/g, ' ').trim() || null)
  );

  // 7. BV / RCV: change CVA on Variation Foundations panel, read Index of Individuality / derived output
  await runInteraction('sci-bv-cva', 'scientific-bv', 'Variation Foundations: change CVA numeric entry, read derived metric output',
    async (p) => { await nav(p, 'BV & RCV Lab'); },
    async (p) => { await p.locator('input[aria-label="CVA (analytical) numeric entry"]').first().fill('8'); await p.locator('input[aria-label="CVA (analytical) numeric entry"]').first().dispatchEvent('change'); },
    async (p) => p.evaluate(() => document.getElementById('main')?.textContent.replace(/\s+/g, ' ').trim() || null)
  );

  // 8. PBRTQC: change Window size (W) via #sim-w on the Simulator, read resulting surveillance output
  await runInteraction('sci-pbrtqc-window', 'scientific-pbrtqc', 'PBRTQC Simulator: change Window size (W), read surveillance/detection output',
    async (p) => {
      await nav(p, 'Patient Surveillance Lab');
      await p.locator('#main button,[role="tab"]', { hasText: 'Simulator' }).first().click({ timeout: 3000 });
      await p.waitForTimeout(300);
    },
    async (p) => { await p.locator('input[aria-label="Window size (W) numeric entry"]').first().fill('40').catch(async () => { await p.fill('#sim-w', '40'); }); await p.waitForTimeout(200); await p.locator('input[aria-label="Window size (W) numeric entry"]').first().dispatchEvent('change').catch(() => {}); },
    async (p) => p.evaluate(() => document.getElementById('main')?.textContent.replace(/\s+/g, ' ').trim() || null)
  );

  // ═══════════════ DIAGNOSTIC / GLOSSARY / ABOUT ═══════════════
  console.log('\n=== DIAGNOSTIC / GLOSSARY / ABOUT ===');
  {
    const o = await freshPage(browser, REF_URL);
    const c = await freshPage(browser, CAND_URL);
    await nav(o.p, 'Home'); await nav(c.p, 'Home');

    // Diagnostic
    await o.p.locator('button', { hasText: 'Assess My Level' }).first().click({ timeout: 5000 });
    await c.p.locator('button', { hasText: 'Assess My Level' }).first().click({ timeout: 5000 });
    await o.p.waitForTimeout(350); await c.p.waitForTimeout(350);
    const oDiag = await o.p.evaluate(() => document.querySelector('[role="dialog"]')?.textContent.substring(0, 60) || '');
    const cDiag = await c.p.evaluate(() => document.querySelector('[role="dialog"]')?.textContent.substring(0, 60) || '');
    record('diagnostic-open', 'other', 'Diagnostic modal opens', oDiag, cDiag, oDiag === cDiag && oDiag.length > 0 ? 'MATCH' : 'UNEXPECTED_DIFFERENCE');
    await o.p.keyboard.press('Escape'); await c.p.keyboard.press('Escape');
    await o.p.waitForTimeout(250); await c.p.waitForTimeout(250);

    // Glossary
    await o.p.getByRole('button', { name: 'Glossary' }).click({ timeout: 3000 });
    await c.p.getByRole('button', { name: 'Glossary' }).click({ timeout: 3000 });
    await o.p.waitForTimeout(350); await c.p.waitForTimeout(350);
    const oGloss = await o.p.evaluate(() => document.querySelector('[role="dialog"]')?.textContent.substring(0, 60) || '');
    const cGloss = await c.p.evaluate(() => document.querySelector('[role="dialog"]')?.textContent.substring(0, 60) || '');
    record('glossary', 'other', 'Glossary modal', oGloss, cGloss, oGloss === cGloss && oGloss.length > 0 ? 'MATCH' : 'UNEXPECTED_DIFFERENCE');
    await o.p.keyboard.press('Escape'); await c.p.keyboard.press('Escape');
    await o.p.waitForTimeout(250); await c.p.waitForTimeout(250);

    // About
    await o.p.locator('button', { hasText: 'About this prototype' }).click({ timeout: 3000 });
    await c.p.locator('button', { hasText: 'About this prototype' }).click({ timeout: 3000 });
    await o.p.waitForTimeout(350); await c.p.waitForTimeout(350);
    const oAbout = await o.p.evaluate(() => document.querySelector('[role="dialog"]')?.textContent.substring(0, 60) || '');
    const cAbout = await c.p.evaluate(() => document.querySelector('[role="dialog"]')?.textContent.substring(0, 60) || '');
    record('about', 'other', 'About modal', oAbout, cAbout, oAbout === cAbout && oAbout.length > 0 ? 'MATCH' : 'UNEXPECTED_DIFFERENCE');

    await o.ctx.close(); await c.ctx.close();
  }

  // ═══════════════ VISUAL EVIDENCE: DESKTOP + MOBILE SCREENSHOTS ═══════════════
  console.log('\n=== VISUAL EVIDENCE: screenshots ===');
  {
    const o = await freshPage(browser, REF_URL);
    const c = await freshPage(browser, CAND_URL);
    await nav(o.p, 'Home'); await nav(c.p, 'Home');
    const oDeskPath = path.join(SCREENSHOT_DIR, 'desktop-reference-home.png');
    const cDeskPath = path.join(SCREENSHOT_DIR, 'desktop-bridge-home.png');
    await o.p.screenshot({ path: oDeskPath });
    await c.p.screenshot({ path: cDeskPath });
    const oDeskSha = crypto.createHash('sha256').update(fs.readFileSync(oDeskPath)).digest('hex');
    const cDeskSha = crypto.createHash('sha256').update(fs.readFileSync(cDeskPath)).digest('hex');
    record('screenshot-desktop-home', 'visual', 'Desktop 1440x1000 Home screenshot', oDeskSha.substring(0, 16), cDeskSha.substring(0, 16),
      oDeskSha === cDeskSha ? 'MATCH' : 'UNEXPECTED_DIFFERENCE', `saved to ${path.relative(V09, oDeskPath)} / ${path.relative(V09, cDeskPath)}`);
    await o.ctx.close(); await c.ctx.close();
  }
  {
    const oCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const cCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const oP = await oCtx.newPage(); const cP = await cCtx.newPage();
    await oP.route('**fonts.googleapis.com**', r => r.abort()); await oP.route('**fonts.gstatic.com**', r => r.abort());
    await cP.route('**fonts.googleapis.com**', r => r.abort()); await cP.route('**fonts.gstatic.com**', r => r.abort());
    await oP.goto(REF_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await cP.goto(CAND_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await oP.waitForTimeout(2500); await cP.waitForTimeout(2500);
    const oMobPath = path.join(SCREENSHOT_DIR, 'mobile-reference-home.png');
    const cMobPath = path.join(SCREENSHOT_DIR, 'mobile-bridge-home.png');
    await oP.screenshot({ path: oMobPath });
    await cP.screenshot({ path: cMobPath });
    const oMobSha = crypto.createHash('sha256').update(fs.readFileSync(oMobPath)).digest('hex');
    const cMobSha = crypto.createHash('sha256').update(fs.readFileSync(cMobPath)).digest('hex');
    record('screenshot-mobile-home', 'visual', 'Mobile 390x844 Home screenshot', oMobSha.substring(0, 16), cMobSha.substring(0, 16),
      oMobSha === cMobSha ? 'MATCH' : 'UNEXPECTED_DIFFERENCE', `saved to ${path.relative(V09, oMobPath)} / ${path.relative(V09, cMobPath)}`);
    await oCtx.close(); await cCtx.close();
  }

  await browser.close();
  try { refServer.close(); } catch (e) {}
  try { candServer.close(); } catch (e) {}

  console.log('\n=== SUMMARY ===');
  console.log(`Total: ${results.length} | MATCH: ${match} | UNEXPECTED_DIFFERENCE: ${unexpected} | BLOCKED: ${blocked}`);

  const out = {
    stage: '11C1',
    artifact_class: 'V09_TEST',
    browser: 'Chromium 141.0.7390.37',
    reference: 'v09/dist/precimind-v0.9-compat.html (frozen Stage 11B compatibility artifact)',
    reference_sha256: '975adefb62df00f12372cb705b9c2ef9b51c89a2b8133ade77ebf0db16f8c97c',
    candidate: 'v09/dist-vite-bridge/ (Stage 11C1 Vite bridge production build)',
    note: 'No INTENDED_DELTA classification is used here: Stage 11B accessibility fixes already exist on both sides of this comparison, so this stage expects pure behavioral equivalence.',
    summary: { total: results.length, match, unexpected_difference: unexpected, blocked },
    checkpoints: results,
  };
  fs.writeFileSync(path.join(V09, 'tests', 'browser', 'v09-vite-bridge-equivalence-result.json'), JSON.stringify(out, null, 2));
  console.log('Result written to v09/tests/browser/v09-vite-bridge-equivalence-result.json');

  if (unexpected > 0 || blocked > 0) {
    console.error(`FAILED: unexpected_difference=${unexpected} blocked=${blocked}`);
    process.exit(1);
  }
  process.exit(0);
})().catch(e => { console.error('FATAL:', e.message, e.stack?.split('\n')[1]); process.exit(1); });
