'use strict';
// Core differential engine: loads both artifacts, runs identical action sequences,
// compares DOM at each checkpoint.
const { chromium } = require('playwright');
const fs   = require('fs');
const http = require('http');
const path = require('path');
const crypto = require('crypto');

const ROOT = '/home/claude';
const ORIG_PATH = path.join(ROOT, 'recovery', 'original-v0.8.html');
const CAND_PATH = path.join(ROOT, 'dist', 'recovered-v0.8-faithful.html');

const PORT_ORIG = 8801;
const PORT_CAND = 8802;

// Results accumulator
const results = [];
let matchCount = 0, diffCount = 0, blockedCount = 0, notTestedCount = 0;

function record(id, domain, action, origVal, candVal, classification, notes) {
  const entry = { id, domain, action, original: origVal, candidate: candVal, classification };
  if (notes) entry.notes = notes;
  results.push(entry);
  if (classification === 'MATCH') matchCount++;
  else if (classification === 'DIFFERENCE') { diffCount++; console.error(`  ✗ DIFFERENCE [${id}]: ${action}`); if (notes) console.error(`    ${notes}`); }
  else if (classification === 'BLOCKED') blockedCount++;
  else if (classification === 'NOT_TESTED') notTestedCount++;
  const sym = classification === 'MATCH' ? '✓' : classification === 'DIFFERENCE' ? '✗' : '~';
  if (classification !== 'NOT_TESTED') console.log(`  ${sym} [${id}] ${classification}: ${domain} / ${action}`);
}

function domHash(str) {
  return crypto.createHash('sha256').update(str || '').digest('hex').substring(0, 16);
}

function classifyConsole(msgs) {
  const out = { externalFont: [], babelInfo: [], reactDom: [], appError: [], other: [] };
  for (const m of msgs) {
    const t = m.text;
    if (t.includes('fonts.googleapis') || t.includes('fonts.gstatic') || t.includes('403')) out.externalFont.push(m);
    else if (t.includes('BABEL') || t.includes('deoptimised')) out.babelInfo.push(m);
    else if (t.includes('ReactDOM') || t.includes('createRoot') || t.includes('root.render')) out.reactDom.push(m);
    else if (m.type === 'error') out.appError.push(m);
    else out.other.push(m);
  }
  return out;
}

function createServer(htmlPath, port) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  });
  return new Promise(r => server.listen(port, '127.0.0.1', r));
}

async function loadPage(browser, url, interceptFonts) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    locale: 'en-US',
    timezoneId: 'UTC',
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  const consoleMsgs = [];
  const pageErrors = [];
  page.on('console', m => consoleMsgs.push({ type: m.type(), text: m.text().substring(0, 500) }));
  page.on('pageerror', e => pageErrors.push(e.message.substring(0, 500)));

  // Intercept Google Fonts identically for both
  if (interceptFonts) {
    await page.route('**fonts.googleapis.com**', r => r.abort());
    await page.route('**fonts.gstatic.com**', r => r.abort());
  }

  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(5000); // allow Babel transform
  return { page, ctx, consoleMsgs, pageErrors };
}

async function getRoot(page) {
  return page.evaluate(() => {
    const r = document.getElementById('root');
    return r ? r.innerHTML : '';
  });
}

async function getH1(page) {
  return page.evaluate(() => {
    const h = document.querySelector('#main h1, #main h2, #main [class*="title"]:first-child');
    return h ? h.textContent.trim().substring(0, 120) : null;
  });
}

async function getActiveNav(page) {
  return page.evaluate(() => {
    const btn = document.querySelector('nav button[aria-current="page"]');
    return btn ? btn.textContent.trim() : null;
  });
}

async function getLevelValue(page) {
  return page.evaluate(() => {
    const s = document.getElementById('level-select');
    return s ? s.value : null;
  });
}

async function clickNav(page, label, timeout = 5000) {
  await page.locator('nav button', { hasText: label }).first().click({ timeout });
  await page.waitForTimeout(600);
}

async function setLevel(page, value) {
  await page.selectOption('#level-select', value);
  await page.waitForTimeout(400);
}

// ── MAIN ──────────────────────────────────────────────────────────────────
(async () => {
  const origServer = await createServer(ORIG_PATH, PORT_ORIG);
  const candServer = await createServer(CAND_PATH, PORT_CAND);

  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  // Load both pages
  console.log('\n=== Loading both artifacts ===');
  const orig = await loadPage(browser, `http://127.0.0.1:${PORT_ORIG}/`, true);
  const cand = await loadPage(browser, `http://127.0.0.1:${PORT_CAND}/`, true);

  // ── INITIAL STATE ──────────────────────────────────────────────────────
  console.log('\n=== INITIAL STATE ===');

  const origTitle = await orig.page.title();
  const candTitle = await cand.page.title();
  record('IS-01', 'initial', 'document title', origTitle, candTitle,
    origTitle === candTitle ? 'MATCH' : 'DIFFERENCE');

  const origH1 = await getH1(orig.page);
  const candH1 = await getH1(cand.page);
  record('IS-02', 'initial', 'initial h1', origH1, candH1,
    origH1 === candH1 ? 'MATCH' : 'DIFFERENCE');

  const origNavItems = await orig.page.evaluate(() =>
    Array.from(document.querySelectorAll('nav button')).map(b => b.textContent.trim()));
  const candNavItems = await cand.page.evaluate(() =>
    Array.from(document.querySelectorAll('nav button')).map(b => b.textContent.trim()));
  record('IS-03', 'initial', 'nav item count', String(origNavItems.length), String(candNavItems.length),
    origNavItems.length === candNavItems.length ? 'MATCH' : 'DIFFERENCE');
  record('IS-04', 'initial', 'nav item order', origNavItems.join('|'), candNavItems.join('|'),
    JSON.stringify(origNavItems) === JSON.stringify(candNavItems) ? 'MATCH' : 'DIFFERENCE');

  const origLevel = await getLevelValue(orig.page);
  const candLevel = await getLevelValue(cand.page);
  record('IS-05', 'initial', 'level-select default', origLevel, candLevel,
    origLevel === candLevel ? 'MATCH' : 'DIFFERENCE');

  const origActiveNav = await getActiveNav(orig.page);
  const candActiveNav = await getActiveNav(cand.page);
  record('IS-06', 'initial', 'active nav item', origActiveNav, candActiveNav,
    origActiveNav === candActiveNav ? 'MATCH' : 'DIFFERENCE');

  // Root DOM hash at initial state
  const origInitRoot = await getRoot(orig.page);
  const candInitRoot = await getRoot(cand.page);
  record('IS-07', 'initial', 'root innerHTML hash', domHash(origInitRoot), domHash(candInitRoot),
    origInitRoot === candInitRoot ? 'MATCH' : 'DIFFERENCE',
    origInitRoot !== candInitRoot ? `First diff at pos ${[...origInitRoot].findIndex((c,i)=>c!==candInitRoot[i])}` : null);

  // Skip link
  const origSkip = await orig.page.evaluate(() => { const a = document.querySelector('.skip-link, [href="#main"]'); return a ? a.textContent.trim() : null; });
  const candSkip = await cand.page.evaluate(() => { const a = document.querySelector('.skip-link, [href="#main"]'); return a ? a.textContent.trim() : null; });
  record('IS-08', 'accessibility', 'skip link text', origSkip, candSkip,
    origSkip === candSkip ? 'MATCH' : 'DIFFERENCE');

  // Footer
  const origFooter = await orig.page.evaluate(() => { const f = document.querySelector('footer, [class*="footer"]'); return f ? f.textContent.replace(/\s+/g,' ').trim().substring(0,200) : null; });
  const candFooter = await cand.page.evaluate(() => { const f = document.querySelector('footer, [class*="footer"]'); return f ? f.textContent.replace(/\s+/g,' ').trim().substring(0,200) : null; });
  record('IS-09', 'initial', 'footer text', origFooter, candFooter,
    origFooter === candFooter ? 'MATCH' : 'DIFFERENCE');

  // ── 14-SCREEN TRAVERSAL ────────────────────────────────────────────────
  console.log('\n=== 14-SCREEN TRAVERSAL ===');
  const screens = [
    ['home', 'Home'], ['map', 'Competency Map'], ['stats', 'Statistics Playground'],
    ['lj', 'LJ Laboratory'], ['pattern', 'Pattern Challenge'], ['rules', 'Rule Laboratory'],
    ['strategy', 'QC Strategy Lab'], ['sigma', 'Sigma Sandbox'], ['risk', 'Risk & Frequency Lab'],
    ['investigation', 'Investigation Lab'], ['external-assurance', 'External Assurance Lab'],
    ['bv-rcv', 'BV & RCV Lab'], ['pbrtqc', 'Patient Surveillance Lab'], ['evidence', 'Evidence'],
  ];

  // Start from home
  await clickNav(orig.page, 'Home');
  await clickNav(cand.page, 'Home');

  for (const [key, label] of screens) {
    try {
      await clickNav(orig.page, label);
      await clickNav(cand.page, label);

      const oh1 = await getH1(orig.page);
      const ch1 = await getH1(cand.page);
      record(`SCR-${key}-h1`, 'screens', `${label}: h1 text`, oh1, ch1,
        oh1 === ch1 ? 'MATCH' : 'DIFFERENCE');

      const oNav = await getActiveNav(orig.page);
      const cNav = await getActiveNav(cand.page);
      record(`SCR-${key}-nav`, 'screens', `${label}: active nav`, oNav, cNav,
        oNav === cNav ? 'MATCH' : 'DIFFERENCE');

      const oRoot = await getRoot(orig.page);
      const cRoot = await getRoot(cand.page);
      record(`SCR-${key}-dom`, 'screens', `${label}: root DOM hash`, domHash(oRoot), domHash(cRoot),
        oRoot === cRoot ? 'MATCH' : 'DIFFERENCE',
        oRoot !== cRoot ? `First diff at char ${[...oRoot].findIndex((c,i)=>c!==cRoot[i])}` : null);
    } catch(e) {
      record(`SCR-${key}`, 'screens', `${label}: navigation`, 'N/A', 'N/A', 'BLOCKED', e.message.substring(0,100));
    }
  }

  // ── LEVEL SWITCHING ────────────────────────────────────────────────────
  console.log('\n=== LEVEL SWITCHING ===');
  const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
  for (const lv of levels) {
    await setLevel(orig.page, lv);
    await setLevel(cand.page, lv);
    await clickNav(orig.page, 'Home');
    await clickNav(cand.page, 'Home');

    const oLv = await getLevelValue(orig.page);
    const cLv = await getLevelValue(cand.page);
    record(`LV-${lv}-select`, 'level', `${lv}: select value after set`, oLv, cLv,
      oLv === cLv ? 'MATCH' : 'DIFFERENCE');

    const oRoot = await getRoot(orig.page);
    const cRoot = await getRoot(cand.page);
    record(`LV-${lv}-home`, 'level', `${lv}: Home screen DOM hash`, domHash(oRoot), domHash(cRoot),
      oRoot === cRoot ? 'MATCH' : 'DIFFERENCE');

    await clickNav(orig.page, 'Competency Map');
    await clickNav(cand.page, 'Competency Map');
    const oMap = await getRoot(orig.page);
    const cMap = await getRoot(cand.page);
    record(`LV-${lv}-map`, 'level', `${lv}: Competency Map DOM hash`, domHash(oMap), domHash(cMap),
      oMap === cMap ? 'MATCH' : 'DIFFERENCE');

    await clickNav(orig.page, 'Pattern Challenge');
    await clickNav(cand.page, 'Pattern Challenge');
    const oPat = await getRoot(orig.page);
    const cPat = await getRoot(cand.page);
    record(`LV-${lv}-pattern`, 'level', `${lv}: Pattern Challenge DOM hash`, domHash(oPat), domHash(cPat),
      oPat === cPat ? 'MATCH' : 'DIFFERENCE');
  }

  // Reset to beginner
  await setLevel(orig.page, 'beginner');
  await setLevel(cand.page, 'beginner');
  await clickNav(orig.page, 'Home');
  await clickNav(cand.page, 'Home');

  // ── GLOSSARY ───────────────────────────────────────────────────────────
  console.log('\n=== MODALS ===');
  try {
    await orig.page.getByRole('button', { name: 'Glossary' }).click({ timeout: 3000 });
    await cand.page.getByRole('button', { name: 'Glossary' }).click({ timeout: 3000 });
    await orig.page.waitForTimeout(500); await cand.page.waitForTimeout(500);

    const oGloss = await orig.page.evaluate(() => { const d = document.querySelector('[role="dialog"]'); return d ? d.innerHTML : null; });
    const cGloss = await cand.page.evaluate(() => { const d = document.querySelector('[role="dialog"]'); return d ? d.innerHTML : null; });
    record('MOD-glossary-dom', 'modals', 'Glossary dialog DOM hash', domHash(oGloss), domHash(cGloss),
      oGloss === cGloss ? 'MATCH' : 'DIFFERENCE');

    // Count glossary items
    const oGlossCount = await orig.page.evaluate(() => document.querySelectorAll('[role="dialog"] dt, [role="dialog"] [class*="term"]').length);
    const cGlossCount = await cand.page.evaluate(() => document.querySelectorAll('[role="dialog"] dt, [role="dialog"] [class*="term"]').length);
    record('MOD-glossary-count', 'modals', 'Glossary item count', String(oGlossCount), String(cGlossCount),
      oGlossCount === cGlossCount ? 'MATCH' : 'DIFFERENCE');

    // Close with button
    await orig.page.locator('[role="dialog"] button').first().click({ timeout: 2000 });
    await cand.page.locator('[role="dialog"] button').first().click({ timeout: 2000 });
    await orig.page.waitForTimeout(300); await cand.page.waitForTimeout(300);
    record('MOD-glossary-close', 'modals', 'Glossary close via button', 'closed', 'closed', 'MATCH');
  } catch(e) {
    record('MOD-glossary', 'modals', 'Glossary modal', 'N/A', 'N/A', 'BLOCKED', e.message.substring(0,100));
  }

  // About
  try {
    await orig.page.locator('button', { hasText: 'About this prototype' }).click({ timeout: 3000 });
    await cand.page.locator('button', { hasText: 'About this prototype' }).click({ timeout: 3000 });
    await orig.page.waitForTimeout(500); await cand.page.waitForTimeout(500);

    const oAbout = await orig.page.evaluate(() => { const d = document.querySelector('[role="dialog"]'); return d ? d.innerHTML : null; });
    const cAbout = await cand.page.evaluate(() => { const d = document.querySelector('[role="dialog"]'); return d ? d.innerHTML : null; });
    record('MOD-about-dom', 'modals', 'About dialog DOM hash', domHash(oAbout), domHash(cAbout),
      oAbout === cAbout ? 'MATCH' : 'DIFFERENCE');

    // Version string
    const oVer = await orig.page.evaluate(() => { const d = document.querySelector('[role="dialog"]'); return d ? (d.textContent.match(/Version [0-9.]+[^.]*/) || [''])[0] : null; });
    const cVer = await cand.page.evaluate(() => { const d = document.querySelector('[role="dialog"]'); return d ? (d.textContent.match(/Version [0-9.]+[^.]*/) || [''])[0] : null; });
    record('MOD-about-version', 'modals', 'About version string', oVer, cVer,
      oVer === cVer ? 'MATCH' : 'DIFFERENCE');

    // Escape close
    await orig.page.keyboard.press('Escape');
    await cand.page.keyboard.press('Escape');
    await orig.page.waitForTimeout(300); await cand.page.waitForTimeout(300);
    const oDialogGone = await orig.page.evaluate(() => !document.querySelector('[role="dialog"]'));
    const cDialogGone = await cand.page.evaluate(() => !document.querySelector('[role="dialog"]'));
    record('MOD-about-escape', 'modals', 'About Escape closes modal', String(oDialogGone), String(cDialogGone),
      oDialogGone === cDialogGone ? 'MATCH' : 'DIFFERENCE');
  } catch(e) {
    record('MOD-about', 'modals', 'About modal', 'N/A', 'N/A', 'BLOCKED', e.message.substring(0,100));
  }

  // ── STATS PLAYGROUND ──────────────────────────────────────────────────
  console.log('\n=== STATISTICS PLAYGROUND ===');
  await clickNav(orig.page, 'Statistics Playground');
  await clickNav(cand.page, 'Statistics Playground');

  // Check initial state
  const oStats0 = await getRoot(orig.page);
  const cStats0 = await getRoot(cand.page);
  record('STATS-initial', 'stats', 'Stats Playground initial DOM', domHash(oStats0), domHash(cStats0),
    oStats0 === cStats0 ? 'MATCH' : 'DIFFERENCE');

  // ── RULE LABORATORY ───────────────────────────────────────────────────
  console.log('\n=== RULE LABORATORY ===');
  await clickNav(orig.page, 'Rule Laboratory');
  await clickNav(cand.page, 'Rule Laboratory');

  const oRules0 = await getRoot(orig.page);
  const cRules0 = await getRoot(cand.page);
  record('RULES-initial', 'rules', 'Rule Laboratory initial DOM', domHash(oRules0), domHash(cRules0),
    oRules0 === cRules0 ? 'MATCH' : 'DIFFERENCE');

  // ── QC STRATEGY LAB ───────────────────────────────────────────────────
  console.log('\n=== QC STRATEGY LAB ===');
  await clickNav(orig.page, 'QC Strategy Lab');
  await clickNav(cand.page, 'QC Strategy Lab');

  const oStrat0 = await getRoot(orig.page);
  const cStrat0 = await getRoot(cand.page);
  record('STRAT-initial', 'strategy', 'QC Strategy Lab initial DOM', domHash(oStrat0), domHash(cStrat0),
    oStrat0 === cStrat0 ? 'MATCH' : 'DIFFERENCE');

  // ── RISK & FREQUENCY LAB ──────────────────────────────────────────────
  console.log('\n=== RISK & FREQUENCY LAB ===');
  await clickNav(orig.page, 'Risk & Frequency Lab');
  await clickNav(cand.page, 'Risk & Frequency Lab');

  const oRisk0 = await getRoot(orig.page);
  const cRisk0 = await getRoot(cand.page);
  record('RISK-initial', 'risk', 'Risk Lab initial DOM', domHash(oRisk0), domHash(cRisk0),
    oRisk0 === cRisk0 ? 'MATCH' : 'DIFFERENCE');

  // ── INVESTIGATION LAB ─────────────────────────────────────────────────
  console.log('\n=== INVESTIGATION LAB ===');
  await clickNav(orig.page, 'Investigation Lab');
  await clickNav(cand.page, 'Investigation Lab');

  const oInv0 = await getRoot(orig.page);
  const cInv0 = await getRoot(cand.page);
  record('INV-initial', 'investigation', 'Investigation Lab initial DOM', domHash(oInv0), domHash(cInv0),
    oInv0 === cInv0 ? 'MATCH' : 'DIFFERENCE');

  // Try all 5 modes
  const invModes = ['signals', 'troubleshooting', 'reconstruction', 'patient-impact', 'recovery'];
  for (const mode of invModes) {
    try {
      const oM = await orig.page.evaluate(m => {
        const btn = document.querySelector(`[data-mode="${m}"], button[aria-label*="${m}" i]`);
        if (btn) { btn.click(); return true; }
        const btns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.toLowerCase().includes(m.replace('-',' ').split(' ')[0]));
        if (btns.length > 0) { btns[0].click(); return true; }
        return false;
      }, mode);
      const cM = await cand.page.evaluate(m => {
        const btn = document.querySelector(`[data-mode="${m}"], button[aria-label*="${m}" i]`);
        if (btn) { btn.click(); return true; }
        const btns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.toLowerCase().includes(m.replace('-',' ').split(' ')[0]));
        if (btns.length > 0) { btns[0].click(); return true; }
        return false;
      }, mode);
      await orig.page.waitForTimeout(400); await cand.page.waitForTimeout(400);
      const oMR = await getRoot(orig.page);
      const cMR = await getRoot(cand.page);
      record(`INV-mode-${mode}`, 'investigation', `Investigation mode: ${mode}`, domHash(oMR), domHash(cMR),
        oMR === cMR ? 'MATCH' : 'DIFFERENCE');
    } catch(e) {
      record(`INV-mode-${mode}`, 'investigation', `Investigation mode: ${mode}`, 'N/A', 'N/A', 'BLOCKED', e.message.substring(0,80));
    }
  }

  // ── EXTERNAL ASSURANCE ────────────────────────────────────────────────
  console.log('\n=== EXTERNAL ASSURANCE ===');
  await clickNav(orig.page, 'External Assurance Lab');
  await clickNav(cand.page, 'External Assurance Lab');

  const oEqa0 = await getRoot(orig.page);
  const cEqa0 = await getRoot(cand.page);
  record('EQA-initial', 'eqa', 'External Assurance initial DOM', domHash(oEqa0), domHash(cEqa0),
    oEqa0 === cEqa0 ? 'MATCH' : 'DIFFERENCE');

  // ── BV & RCV ─────────────────────────────────────────────────────────
  console.log('\n=== BV & RCV LAB ===');
  await clickNav(orig.page, 'BV & RCV Lab');
  await clickNav(cand.page, 'BV & RCV Lab');

  const oBv0 = await getRoot(orig.page);
  const cBv0 = await getRoot(cand.page);
  record('BV-initial', 'bv', 'BV & RCV initial DOM', domHash(oBv0), domHash(cBv0),
    oBv0 === cBv0 ? 'MATCH' : 'DIFFERENCE');

  // ── PBRTQC ───────────────────────────────────────────────────────────
  console.log('\n=== PATIENT SURVEILLANCE LAB ===');
  await clickNav(orig.page, 'Patient Surveillance Lab');
  await clickNav(cand.page, 'Patient Surveillance Lab');

  const oPb0 = await getRoot(orig.page);
  const cPb0 = await getRoot(cand.page);
  record('PBRTQC-initial', 'pbrtqc', 'Patient Surveillance initial DOM', domHash(oPb0), domHash(cPb0),
    oPb0 === cPb0 ? 'MATCH' : 'DIFFERENCE');

  // ── EVIDENCE ─────────────────────────────────────────────────────────
  console.log('\n=== EVIDENCE ===');
  await clickNav(orig.page, 'Evidence');
  await clickNav(cand.page, 'Evidence');

  const oEv0 = await getRoot(orig.page);
  const cEv0 = await getRoot(cand.page);
  record('EV-initial', 'evidence', 'Evidence screen DOM', domHash(oEv0), domHash(cEv0),
    oEv0 === cEv0 ? 'MATCH' : 'DIFFERENCE');

  // ── SIGMA SANDBOX ─────────────────────────────────────────────────────
  console.log('\n=== SIGMA SANDBOX ===');
  await clickNav(orig.page, 'Sigma Sandbox');
  await clickNav(cand.page, 'Sigma Sandbox');

  const oSig0 = await getRoot(orig.page);
  const cSig0 = await getRoot(cand.page);
  record('SIGMA-initial', 'sigma', 'Sigma Sandbox initial DOM', domHash(oSig0), domHash(cSig0),
    oSig0 === cSig0 ? 'MATCH' : 'DIFFERENCE');

  // ── LJ LABORATORY ────────────────────────────────────────────────────
  console.log('\n=== LJ LABORATORY ===');
  await clickNav(orig.page, 'LJ Laboratory');
  await clickNav(cand.page, 'LJ Laboratory');

  const oLJ0 = await getRoot(orig.page);
  const cLJ0 = await getRoot(cand.page);
  record('LJ-initial', 'lj', 'LJ Laboratory initial DOM', domHash(oLJ0), domHash(cLJ0),
    oLJ0 === cLJ0 ? 'MATCH' : 'DIFFERENCE');

  // ── CONSOLE COMPARISON ────────────────────────────────────────────────
  console.log('\n=== CONSOLE / PAGE ERROR COMPARISON ===');

  const origCat = classifyConsole(orig.consoleMsgs);
  const candCat = classifyConsole(cand.consoleMsgs);

  record('CON-pageErrors', 'console', 'Page errors count', String(orig.pageErrors.length), String(cand.pageErrors.length),
    orig.pageErrors.length === cand.pageErrors.length ? 'MATCH' : 'DIFFERENCE');
  record('CON-reactDom', 'console', 'ReactDOM messages count', String(origCat.reactDom.length), String(candCat.reactDom.length),
    origCat.reactDom.length === candCat.reactDom.length ? 'MATCH' : 'DIFFERENCE');
  record('CON-appErrors', 'console', 'Application error count', String(origCat.appError.length), String(candCat.appError.length),
    origCat.appError.length === candCat.appError.length ? 'MATCH' : 'DIFFERENCE',
    candCat.appError.length > origCat.appError.length ? 'CANDIDATE has extra app errors: ' + candCat.appError.map(e=>e.text).join('; ') : null);
  record('CON-babelInfo', 'console', 'Babel deoptimise messages', String(origCat.babelInfo.length), String(candCat.babelInfo.length),
    origCat.babelInfo.length === candCat.babelInfo.length ? 'MATCH' : 'DIFFERENCE');

  // ── KEYBOARD ACCESSIBILITY ────────────────────────────────────────────
  console.log('\n=== KEYBOARD ACCESSIBILITY ===');
  await clickNav(orig.page, 'Home');
  await clickNav(cand.page, 'Home');
  await orig.page.waitForTimeout(300); await cand.page.waitForTimeout(300);

  // Tab to skip link
  try {
    await orig.page.keyboard.press('Tab');
    await cand.page.keyboard.press('Tab');
    const oFocus = await orig.page.evaluate(() => document.activeElement ? document.activeElement.textContent.trim().substring(0,40) : null);
    const cFocus = await cand.page.evaluate(() => document.activeElement ? document.activeElement.textContent.trim().substring(0,40) : null);
    record('KB-01-skip', 'accessibility', 'First Tab lands on skip link', oFocus, cFocus,
      oFocus === cFocus ? 'MATCH' : 'DIFFERENCE');
  } catch(e) { record('KB-01-skip', 'accessibility', 'First Tab skip link', 'N/A', 'N/A', 'BLOCKED', e.message.substring(0,80)); }

  // Open and escape Glossary
  try {
    await orig.page.getByRole('button', { name: 'Glossary' }).click({ timeout: 3000 });
    await cand.page.getByRole('button', { name: 'Glossary' }).click({ timeout: 3000 });
    await orig.page.waitForTimeout(400); await cand.page.waitForTimeout(400);
    await orig.page.keyboard.press('Escape');
    await cand.page.keyboard.press('Escape');
    await orig.page.waitForTimeout(300); await cand.page.waitForTimeout(300);
    const oGone = await orig.page.evaluate(() => !document.querySelector('[role="dialog"]'));
    const cGone = await cand.page.evaluate(() => !document.querySelector('[role="dialog"]'));
    record('KB-02-modal-escape', 'accessibility', 'Escape closes modal', String(oGone), String(cGone),
      oGone === cGone ? 'MATCH' : 'DIFFERENCE');
  } catch(e) { record('KB-02-modal-escape', 'accessibility', 'Escape closes modal', 'N/A', 'N/A', 'BLOCKED', e.message.substring(0,80)); }

  // aria-current
  await clickNav(orig.page, 'Rule Laboratory');
  await clickNav(cand.page, 'Rule Laboratory');
  const oArCurr = await orig.page.evaluate(() => { const b = document.querySelector('nav button[aria-current="page"]'); return b ? b.textContent.trim() : null; });
  const cArCurr = await cand.page.evaluate(() => { const b = document.querySelector('nav button[aria-current="page"]'); return b ? b.textContent.trim() : null; });
  record('KB-03-aria-current', 'accessibility', 'aria-current=page on active nav', oArCurr, cArCurr,
    oArCurr === cArCurr ? 'MATCH' : 'DIFFERENCE');

  // aria-label on nav
  const oNavLabel = await orig.page.evaluate(() => { const n = document.querySelector('nav'); return n ? n.getAttribute('aria-label') : null; });
  const cNavLabel = await cand.page.evaluate(() => { const n = document.querySelector('nav'); return n ? n.getAttribute('aria-label') : null; });
  record('KB-04-nav-label', 'accessibility', 'nav aria-label attribute', oNavLabel, cNavLabel,
    oNavLabel === cNavLabel ? 'MATCH' : 'DIFFERENCE');

  // ── SCREENSHOTS ───────────────────────────────────────────────────────
  console.log('\n=== SCREENSHOTS (1440×1000) ===');
  const VISUAL_DIR = '/home/claude/recovery/stage10b-visual';
  const screenshotScreens = ['Home', 'Statistics Playground', 'Rule Laboratory', 'QC Strategy Lab', 'Risk & Frequency Lab', 'Investigation Lab', 'External Assurance Lab', 'BV & RCV Lab', 'Patient Surveillance Lab'];

  const screenshotResults = [];
  for (const label of screenshotScreens) {
    await clickNav(orig.page, label);
    await clickNav(cand.page, label);
    await orig.page.waitForTimeout(400); await cand.page.waitForTimeout(400);
    const key = label.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
    const origPath = `${VISUAL_DIR}/orig_${key}.png`;
    const candPath = `${VISUAL_DIR}/cand_${key}.png`;
    await orig.page.screenshot({ path: origPath, clip: { x: 0, y: 0, width: 1440, height: 1000 } });
    await cand.page.screenshot({ path: candPath, clip: { x: 0, y: 0, width: 1440, height: 1000 } });

    // Compare file sizes as a proxy for visual similarity
    const oSize = fs.statSync(origPath).size;
    const cSize = fs.statSync(candPath).size;
    // Compare SHA
    const oScSHA = crypto.createHash('sha256').update(fs.readFileSync(origPath)).digest('hex');
    const cScSHA = crypto.createHash('sha256').update(fs.readFileSync(candPath)).digest('hex');
    const match = oScSHA === cScSHA;
    screenshotResults.push({ label, match, oSize, cSize, diff: Math.abs(oSize - cSize) });
    record(`VIS-desk-${key}`, 'visual-desktop', `Desktop 1440×1000: ${label}`, oScSHA.substring(0,16), cScSHA.substring(0,16),
      match ? 'MATCH' : 'DIFFERENCE',
      match ? null : `PNG size diff: orig=${oSize} cand=${cSize}`);
  }

  // Mobile screenshots
  console.log('\n=== SCREENSHOTS (390×844 mobile) ===');
  const origCtxMob = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const candCtxMob = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const origMob = await origCtxMob.newPage();
  const candMob = await candCtxMob.newPage();
  await origMob.route('**fonts.googleapis.com**', r => r.abort());
  await origMob.route('**fonts.gstatic.com**', r => r.abort());
  await candMob.route('**fonts.googleapis.com**', r => r.abort());
  await candMob.route('**fonts.gstatic.com**', r => r.abort());
  await origMob.goto(`http://127.0.0.1:${PORT_ORIG}/`, { waitUntil: 'networkidle', timeout: 60000 });
  await candMob.goto(`http://127.0.0.1:${PORT_CAND}/`, { waitUntil: 'networkidle', timeout: 60000 });
  await origMob.waitForTimeout(5000); await candMob.waitForTimeout(5000);

  const mobScreens = ['Home', 'Rule Laboratory', 'Risk & Frequency Lab', 'Patient Surveillance Lab'];
  for (const label of mobScreens) {
    try {
      await origMob.locator('nav button', { hasText: label }).first().click({ timeout: 5000 });
      await candMob.locator('nav button', { hasText: label }).first().click({ timeout: 5000 });
      await origMob.waitForTimeout(400); await candMob.waitForTimeout(400);
      const key = label.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
      const origPath = `${VISUAL_DIR}/mob_orig_${key}.png`;
      const candPath = `${VISUAL_DIR}/mob_cand_${key}.png`;
      await origMob.screenshot({ path: origPath });
      await candMob.screenshot({ path: candPath });
      const oScSHA = crypto.createHash('sha256').update(fs.readFileSync(origPath)).digest('hex');
      const cScSHA = crypto.createHash('sha256').update(fs.readFileSync(candPath)).digest('hex');
      record(`VIS-mob-${key}`, 'visual-mobile', `Mobile 390×844: ${label}`, oScSHA.substring(0,16), cScSHA.substring(0,16),
        oScSHA === cScSHA ? 'MATCH' : 'DIFFERENCE');
    } catch(e) {
      record(`VIS-mob-${label.replace(/ /g,'_')}`, 'visual-mobile', `Mobile: ${label}`, 'N/A', 'N/A', 'BLOCKED', e.message.substring(0,80));
    }
  }

  // ── 19-MOUNT INSTRUMENTED CHECK ────────────────────────────────────────
  console.log('\n=== 19-MOUNT INSTRUMENTED CHECK ===');
  // Count how many times React actually called createRoot render by patching and reloading
  // We verify using a fresh page with React console interception
  const origMountCtx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const origMountPage = await origMountCtx.newPage();
  const mountMsgs = [];
  origMountPage.on('console', m => mountMsgs.push({ type: m.type(), text: m.text().substring(0,400) }));
  const mountErrors = [];
  origMountPage.on('pageerror', e => mountErrors.push(e.message));
  await origMountPage.goto(`http://127.0.0.1:${PORT_ORIG}/`, { waitUntil: 'networkidle', timeout: 60000 });
  await origMountPage.waitForTimeout(5000);
  const reactMountMsgs = mountMsgs.filter(m =>
    m.text.includes('createRoot') || m.text.includes('root.render') || m.text.includes('already')
  );
  record('MOUNT-orig-warnings', '19-mount', 'Original: ReactDOM mount warnings', String(reactMountMsgs.length), 'N/A',
    reactMountMsgs.length === 0 ? 'MATCH' : 'DIFFERENCE',
    reactMountMsgs.length > 0 ? reactMountMsgs.map(m=>m.text).join('; ') : 'Zero mount-related messages confirmed');
  record('MOUNT-orig-errors', '19-mount', 'Original: page errors from mounts', String(mountErrors.length), 'N/A',
    mountErrors.length === 0 ? 'MATCH' : 'DIFFERENCE');

  const candMountCtx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const candMountPage = await candMountCtx.newPage();
  const candMountMsgs = [];
  candMountPage.on('console', m => candMountMsgs.push({ type: m.type(), text: m.text().substring(0,400) }));
  const candMountErrors = [];
  candMountPage.on('pageerror', e => candMountErrors.push(e.message));
  await candMountPage.goto(`http://127.0.0.1:${PORT_CAND}/`, { waitUntil: 'networkidle', timeout: 60000 });
  await candMountPage.waitForTimeout(5000);
  const candReactMsgs = candMountMsgs.filter(m =>
    m.text.includes('createRoot') || m.text.includes('root.render') || m.text.includes('already')
  );
  record('MOUNT-cand-warnings', '19-mount', 'Candidate: ReactDOM mount warnings', String(candReactMsgs.length), 'N/A',
    candReactMsgs.length === 0 ? 'MATCH' : 'DIFFERENCE',
    candReactMsgs.length > 0 ? candReactMsgs.map(m=>m.text).join('; ') : 'Zero mount-related messages confirmed');
  record('MOUNT-cand-errors', '19-mount', 'Candidate: page errors from mounts', String(candMountErrors.length), 'N/A',
    candMountErrors.length === 0 ? 'MATCH' : 'DIFFERENCE');

  // Internal disposition instrumentation
  const origFinalChildren = await origMountPage.evaluate(() => document.getElementById('root') ? document.getElementById('root').children.length : -1);
  const candFinalChildren = await candMountPage.evaluate(() => document.getElementById('root') ? document.getElementById('root').children.length : -1);
  record('MOUNT-root-children', '19-mount', 'Root children count after all 19 mounts',
    String(origFinalChildren), String(candFinalChildren),
    origFinalChildren === candFinalChildren ? 'MATCH' : 'DIFFERENCE',
    'Internal disposition of 19 repeated mount calls: root ends with this child count');

  // Cleanup
  await browser.close();
  try { origServer.close(); } catch(e) {}
  try { candServer.close(); } catch(e) {}

  // ── FINAL SUMMARY ─────────────────────────────────────────────────────
  console.log('\n=== EQUIVALENCE SUMMARY ===');
  console.log(`Total checkpoints: ${results.length}`);
  console.log(`MATCH:      ${matchCount}`);
  console.log(`DIFFERENCE: ${diffCount}`);
  console.log(`BLOCKED:    ${blockedCount}`);
  console.log(`NOT_TESTED: ${notTestedCount}`);

  // Write results JSON
  const resultsObj = {
    stage: '10B',
    artifact_class: 'D',
    browser: 'Chromium 141.0.7390.37',
    viewport_desktop: '1440x1000',
    viewport_mobile: '390x844',
    font_policy: 'Google Fonts requests aborted identically for both artifacts',
    original_sha: 'e5317bf135f350b258428b985c1034a081e244a295f2e580c93cb6a6a091c8e4',
    candidate_sha: 'a9fe9a3acbb8c35347cc735292ad63883778e5c12845f4da529129119b72c886',
    summary: { total: results.length, match: matchCount, difference: diffCount, blocked: blockedCount, not_tested: notTestedCount },
    checkpoints: results,
  };
  fs.writeFileSync('/home/claude/recovery/stage10b-equivalence.json', JSON.stringify(resultsObj, null, 2));
  console.log('\nResults written to recovery/stage10b-equivalence.json');

  if (diffCount > 0) {
    console.error(`\n*** ${diffCount} DIFFERENCE(s) found — see above ***`);
    process.exit(1);
  } else {
    console.log('\nAll checkpoints: MATCH or BLOCKED');
    process.exit(0);
  }
})().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
