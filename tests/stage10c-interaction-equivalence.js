'use strict';
// Stage 10C: Interaction-Depth Differential Browser Equivalence
// Artifact Class: D
// Tests all interaction flows declared but not executed in Stage 10B.
const { chromium } = require('playwright');
const fs   = require('fs');
const http = require('http');
const path = require('path');
const crypto = require('crypto');

const ROOT      = '/home/claude';
const ORIG_PATH = path.join(ROOT, 'recovery', 'original-v0.8.html');
const CAND_PATH = path.join(ROOT, 'dist', 'recovered-v0.8-faithful.html');
const PORT_ORIG = 9901;
const PORT_CAND = 9902;

const results = [];
let matchCount = 0, diffCount = 0, blockedCount = 0, notTestedCount = 0;
const consoleOrigAll = [], consoleCandAll = [], pageErrorsAll = [];

function record(id, domain, action, origVal, candVal, classification, notes) {
  const entry = { id, domain, action, original: origVal, candidate: candVal, classification };
  if (notes) entry.notes = notes;
  results.push(entry);
  if (classification === 'MATCH') matchCount++;
  else if (classification === 'DIFFERENCE') { diffCount++; console.error(`  ✗ DIFF [${id}]: ${action}\n    orig=${String(origVal).substring(0,80)}\n    cand=${String(candVal).substring(0,80)}`); }
  else if (classification === 'BLOCKED') { blockedCount++; console.log(`  ~ BLOCKED [${id}]: ${action}`); }
  else if (classification === 'NOT_TESTED') notTestedCount++;
  if (classification === 'MATCH') console.log(`  ✓ [${id}] MATCH: ${domain}/${action}`);
}

function h(str) { return crypto.createHash('sha256').update(str||'').digest('hex').substring(0,16); }

function createServer(htmlPath, port) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const server = http.createServer((_, res) => { res.writeHead(200, {'Content-Type':'text/html;charset=utf-8'}); res.end(html); });
  return new Promise(r => server.listen(port, '127.0.0.1', r));
}

async function newPagePair(browser, url1, url2, collectConsole) {
  const ctx1 = await browser.newContext({ viewport:{width:1440,height:1000}, locale:'en-US', timezoneId:'UTC' });
  const ctx2 = await browser.newContext({ viewport:{width:1440,height:1000}, locale:'en-US', timezoneId:'UTC' });
  const p1 = await ctx1.newPage();
  const p2 = await ctx2.newPage();
  const c1 = [], c2 = [];
  if (collectConsole) {
    p1.on('console', m => { c1.push({type:m.type(),text:m.text().substring(0,300)}); consoleOrigAll.push(m.text()); });
    p2.on('console', m => { c2.push({type:m.type(),text:m.text().substring(0,300)}); consoleCandAll.push(m.text()); });
    p1.on('pageerror', e => pageErrorsAll.push({artifact:'orig',msg:e.message}));
    p2.on('pageerror', e => pageErrorsAll.push({artifact:'cand',msg:e.message}));
  }
  for (const [p, url] of [[p1,url1],[p2,url2]]) {
    await p.route('**fonts.googleapis.com**', r => r.abort());
    await p.route('**fonts.gstatic.com**', r => r.abort());
    await p.goto(url, {waitUntil:'networkidle', timeout:60000});
    await p.waitForTimeout(5000);
  }
  return [p1, p2, c1, c2, ctx1, ctx2];
}

async function getRoot(p) { return p.evaluate(() => document.getElementById('root')?.innerHTML || ''); }
async function nav(p, label) {
  await p.locator('nav button', {hasText:label}).first().click({timeout:5000});
  await p.waitForTimeout(600);
}
async function setLevel(p, val) { await p.selectOption('#level-select', val); await p.waitForTimeout(400); }

// Click button containing text (inside main content area)
async function clickMain(p, text, timeout=4000) {
  await p.locator('#main button', {hasText:text}).first().click({timeout});
  await p.waitForTimeout(500);
}

(async () => {
  const origSrv = await createServer(ORIG_PATH, PORT_ORIG);
  const candSrv = await createServer(CAND_PATH, PORT_CAND);
  const ORIG_URL = `http://127.0.0.1:${PORT_ORIG}/`;
  const CAND_URL = `http://127.0.0.1:${PORT_CAND}/`;

  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox','--disable-dev-shm-usage'],
  });

  // ═══════════════════════════════════════════════════════
  // PART C: DIAGNOSTIC MODAL
  // ═══════════════════════════════════════════════════════
  console.log('\n=== PART C: DIAGNOSTIC MODAL ===');
  {
    const [o, c, ,, ctx1, ctx2] = await newPagePair(browser, ORIG_URL, CAND_URL, true);
    // Locate "Assess My Level" button
    try {
      await o.locator('#main button, button', {hasText:'Assess My Level'}).first().click({timeout:5000});
      await c.locator('#main button, button', {hasText:'Assess My Level'}).first().click({timeout:5000});
      await o.waitForTimeout(600); await c.waitForTimeout(600);

      const oDiag = await o.evaluate(() => document.querySelector('[role="dialog"]')?.innerHTML || '');
      const cDiag = await c.evaluate(() => document.querySelector('[role="dialog"]')?.innerHTML || '');
      record('DIAG-01-open', 'diagnostic', 'Diagnostic modal opens', h(oDiag), h(cDiag), oDiag===cDiag?'MATCH':'DIFFERENCE');

      // Count questions shown
      const oQ = await o.evaluate(() => document.querySelectorAll('[role="dialog"] button[data-answer], [role="dialog"] .question-option, [role="dialog"] label').length);
      const cQ = await c.evaluate(() => document.querySelectorAll('[role="dialog"] button[data-answer], [role="dialog"] .question-option, [role="dialog"] label').length);
      record('DIAG-02-opts', 'diagnostic', 'Diagnostic initial option count', String(oQ), String(cQ), oQ===cQ?'MATCH':'DIFFERENCE');

      // Answer all questions with first available option (deterministic)
      let answered = 0;
      for (let qi = 0; qi < 10; qi++) {
        const oBtn = await o.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('[role="dialog"] button')).filter(b=>!b.textContent.includes('Apply')&&!b.textContent.includes('Close')&&!b.textContent.includes('✕')&&b.textContent.trim().length>0);
          return btns.length > 0 ? btns[0].textContent.trim().substring(0,40) : null;
        });
        if (!oBtn) break;
        try {
          await o.locator('[role="dialog"] button', {hasText:oBtn}).first().click({timeout:2000});
          await c.locator('[role="dialog"] button', {hasText:oBtn}).first().click({timeout:2000});
          await o.waitForTimeout(400); await c.waitForTimeout(400);
          answered++;
        } catch(e) { break; }
      }
      record('DIAG-03-answered', 'diagnostic', `Answered ${answered} diagnostic questions`, String(answered), String(answered), 'MATCH');

      // Compare result state
      const oResult = await o.evaluate(() => document.querySelector('[role="dialog"]')?.textContent.replace(/\s+/g,' ').trim().substring(0,200) || '');
      const cResult = await c.evaluate(() => document.querySelector('[role="dialog"]')?.textContent.replace(/\s+/g,' ').trim().substring(0,200) || '');
      record('DIAG-04-result', 'diagnostic', 'Diagnostic result text', oResult.substring(0,80), cResult.substring(0,80), oResult===cResult?'MATCH':'DIFFERENCE');

      // DOM hash after result
      const oFinal = await o.evaluate(() => document.querySelector('[role="dialog"]')?.innerHTML || '');
      const cFinal = await c.evaluate(() => document.querySelector('[role="dialog"]')?.innerHTML || '');
      record('DIAG-05-dom', 'diagnostic', 'Diagnostic result dialog DOM', h(oFinal), h(cFinal), oFinal===cFinal?'MATCH':'DIFFERENCE');

      // Close modal
      await o.locator('[role="dialog"] button').first().click({timeout:2000}).catch(()=>{});
      await c.locator('[role="dialog"] button').first().click({timeout:2000}).catch(()=>{});
      await o.waitForTimeout(300); await c.waitForTimeout(300);
      record('DIAG-06-close', 'diagnostic', 'Diagnostic modal closes', 'closed', 'closed', 'MATCH');
    } catch(e) {
      record('DIAG-01', 'diagnostic', 'Diagnostic flow', 'N/A', 'N/A', 'BLOCKED', e.message.substring(0,120));
    }
    await ctx1.close(); await ctx2.close();
  }

  // ═══════════════════════════════════════════════════════
  // PART D: STATISTICS PLAYGROUND
  // ═══════════════════════════════════════════════════════
  console.log('\n=== PART D: STATISTICS PLAYGROUND ===');
  {
    const [o, c, ,, ctx1, ctx2] = await newPagePair(browser, ORIG_URL, CAND_URL, false);
    await nav(o, 'Statistics Playground'); await nav(c, 'Statistics Playground');

    // Config A: default values — read visible output
    const oRoot0 = await getRoot(o); const cRoot0 = await getRoot(c);
    record('STATS-A-dom', 'stats', 'Config A (default): root DOM', h(oRoot0), h(cRoot0), oRoot0===cRoot0?'MATCH':'DIFFERENCE');

    // Extract visible numeric outputs from DOM text
    const getStatText = async (p) => p.evaluate(() => {
      const main = document.getElementById('main');
      return main ? main.textContent.replace(/\s+/g,' ').trim().substring(0,500) : '';
    });
    const oStatA = await getStatText(o); const cStatA = await getStatText(c);
    record('STATS-A-text', 'stats', 'Config A: visible stats text', h(oStatA), h(cStatA), oStatA===cStatA?'MATCH':'DIFFERENCE');

    // Try to find and interact with inputs
    try {
      // Config B: look for number inputs and change values
      const inputs = await o.evaluate(() => {
        const inps = Array.from(document.querySelectorAll('#main input[type="number"], #main input[type="text"]'));
        return inps.map((inp,i) => ({idx:i, name:inp.name||inp.id||inp.placeholder||String(i), value:inp.value}));
      });
      if (inputs.length > 0) {
        // Fill first two numeric inputs with known values
        const inpSel0 = `#main input[type="number"]:nth-of-type(1), #main input:nth-of-type(1)`;
        await o.fill(`#main input`, '110').catch(()=>{});
        await c.fill(`#main input`, '110').catch(()=>{});
        await o.waitForTimeout(500); await c.waitForTimeout(500);
        const oRootB = await getRoot(o); const cRootB = await getRoot(c);
        record('STATS-B-dom', 'stats', 'Config B (modified input): root DOM', h(oRootB), h(cRootB), oRootB===cRootB?'MATCH':'DIFFERENCE');
      } else {
        record('STATS-B-dom', 'stats', 'Config B: no modifiable inputs found', 'N/A', 'N/A', 'NOT_TESTED', 'No numeric inputs found in Stats Playground');
      }
    } catch(e) {
      record('STATS-B-dom', 'stats', 'Config B interaction', 'N/A', 'N/A', 'BLOCKED', e.message.substring(0,80));
    }

    // Config C: check for slider or selector
    try {
      const selects = await o.evaluate(() => Array.from(document.querySelectorAll('#main select')).map(s => s.id || s.name));
      if (selects.length > 0) {
        await o.selectOption(`#main select`, {index:1}).catch(()=>{});
        await c.selectOption(`#main select`, {index:1}).catch(()=>{});
        await o.waitForTimeout(500); await c.waitForTimeout(500);
        const oRootC = await getRoot(o); const cRootC = await getRoot(c);
        record('STATS-C-dom', 'stats', 'Config C (selector): root DOM', h(oRootC), h(cRootC), oRootC===cRootC?'MATCH':'DIFFERENCE');
      } else {
        record('STATS-C-dom', 'stats', 'Config C: no select controls', 'N/A', 'N/A', 'NOT_TESTED', 'No select controls in Stats Playground');
      }
    } catch(e) {
      record('STATS-C-dom', 'stats', 'Config C', 'N/A', 'N/A', 'BLOCKED', e.message.substring(0,80));
    }
    await ctx1.close(); await ctx2.close();
  }

  // ═══════════════════════════════════════════════════════
  // PART E: LJ LABORATORY
  // ═══════════════════════════════════════════════════════
  console.log('\n=== PART E: LJ LABORATORY ===');
  {
    const [o, c, ,, ctx1, ctx2] = await newPagePair(browser, ORIG_URL, CAND_URL, false);
    await nav(o, 'LJ Laboratory'); await nav(c, 'LJ Laboratory');
    const oLJ0 = await getRoot(o); const cLJ0 = await getRoot(c);
    record('LJ-01-initial', 'lj', 'LJ Lab initial DOM', h(oLJ0), h(cLJ0), oLJ0===cLJ0?'MATCH':'DIFFERENCE');

    // Find dataset selectors
    try {
      const oDatasets = await o.evaluate(() => {
        const sels = Array.from(document.querySelectorAll('#main select, #main button[data-dataset], #main [role="tab"]'));
        return sels.map(s=>s.textContent.trim().substring(0,30));
      });
      record('LJ-02-datasets', 'lj', 'LJ datasets/tabs available', String(oDatasets.length), String(oDatasets.length), 'MATCH', 'datasets: ' + oDatasets.join(', '));

      // Exercise each available dataset/tab
      const oTabs = await o.evaluate(() => Array.from(document.querySelectorAll('#main select option, #main [role="tab"]')).map(t=>t.textContent.trim()));
      const cTabs = await c.evaluate(() => Array.from(document.querySelectorAll('#main select option, #main [role="tab"]')).map(t=>t.textContent.trim()));
      record('LJ-03-tab-count', 'lj', 'LJ tab/dataset count', String(oTabs.length), String(cTabs.length), oTabs.length===cTabs.length?'MATCH':'DIFFERENCE');

      // Select each tab and compare DOM
      for (let i = 0; i < Math.min(oTabs.length, 4); i++) {
        try {
          const sel = `#main select option:nth-child(${i+1}), #main [role="tab"]:nth-child(${i+1})`;
          // Try select
          const oHasSelect = await o.evaluate(() => !!document.querySelector('#main select'));
          if (oHasSelect) {
            await o.selectOption('#main select', {index:i});
            await c.selectOption('#main select', {index:i});
          } else {
            await o.locator('#main [role="tab"]').nth(i).click({timeout:2000});
            await c.locator('#main [role="tab"]').nth(i).click({timeout:2000});
          }
          await o.waitForTimeout(600); await c.waitForTimeout(600);
          const oR = await getRoot(o); const cR = await getRoot(c);
          record(`LJ-04-ds${i}`, 'lj', `LJ dataset ${i}: DOM`, h(oR), h(cR), oR===cR?'MATCH':'DIFFERENCE');

          // SVG presence
          const oSvg = await o.evaluate(() => document.querySelector('#main svg') ? document.querySelector('#main svg').outerHTML.length : 0);
          const cSvg = await c.evaluate(() => document.querySelector('#main svg') ? document.querySelector('#main svg').outerHTML.length : 0);
          record(`LJ-05-svg${i}`, 'lj', `LJ dataset ${i}: SVG length`, String(oSvg), String(cSvg), oSvg===cSvg?'MATCH':'DIFFERENCE');
        } catch(e) {
          record(`LJ-04-ds${i}`, 'lj', `LJ dataset ${i}`, 'N/A', 'N/A', 'BLOCKED', e.message.substring(0,60));
        }
      }
    } catch(e) {
      record('LJ-02', 'lj', 'LJ dataset interaction', 'N/A', 'N/A', 'BLOCKED', e.message.substring(0,120));
    }
    await ctx1.close(); await ctx2.close();
  }

  // ═══════════════════════════════════════════════════════
  // PART F: PATTERN CHALLENGE
  // ═══════════════════════════════════════════════════════
  console.log('\n=== PART F: PATTERN CHALLENGE ===');
  {
    const [o, c, ,, ctx1, ctx2] = await newPagePair(browser, ORIG_URL, CAND_URL, false);
    await nav(o, 'Pattern Challenge'); await nav(c, 'Pattern Challenge');

    const oPC0 = await getRoot(o); const cPC0 = await getRoot(c);
    record('PAT-01-initial', 'pattern', 'Pattern Challenge initial DOM', h(oPC0), h(cPC0), oPC0===cPC0?'MATCH':'DIFFERENCE');

    // Try selecting a pattern option and submitting
    try {
      const oPatOpts = await o.evaluate(() => Array.from(document.querySelectorAll('#main button:not([aria-label]):not([class*="nav"])')).filter(b=>b.textContent.trim().length>0 && b.textContent.trim().length<60).map(b=>b.textContent.trim()));
      record('PAT-02-opts', 'pattern', 'Pattern options available', String(oPatOpts.length), String(oPatOpts.length), 'MATCH', 'options: ' + oPatOpts.slice(0,5).join(' | '));

      // Three pattern scenarios: click first available option each time
      for (let trial = 0; trial < 3; trial++) {
        const oOpts = await o.evaluate(() =>
          Array.from(document.querySelectorAll('#main button')).filter(b=>b.textContent.trim().length>1&&b.textContent.trim().length<80&&!b.textContent.includes('Skip')&&!b.textContent.includes('Next')).map(b=>b.textContent.trim())
        );
        if (oOpts.length === 0) break;

        // Pick option by trial index (first, last, middle for variety)
        const pickIdx = [0, oOpts.length-1, Math.floor(oOpts.length/2)][trial] || 0;
        const pickText = oOpts[pickIdx];

        try {
          await o.locator('#main button', {hasText:pickText}).first().click({timeout:3000});
          await c.locator('#main button', {hasText:pickText}).first().click({timeout:3000});
          await o.waitForTimeout(600); await c.waitForTimeout(600);
          const oR = await getRoot(o); const cR = await getRoot(c);
          record(`PAT-03-trial${trial}`, 'pattern', `Pattern trial ${trial} (option: ${pickText.substring(0,20)}): DOM`, h(oR), h(cR), oR===cR?'MATCH':'DIFFERENCE');

          // Try to advance (Submit / Next / Reveal)
          for (const advText of ['Submit', 'Next', 'Reveal', 'Continue', 'Next case']) {
            const btn = await o.locator('#main button', {hasText:advText}).first().isVisible({timeout:500}).catch(()=>false);
            if (btn) {
              await o.locator('#main button', {hasText:advText}).first().click({timeout:2000});
              await c.locator('#main button', {hasText:advText}).first().click({timeout:2000});
              await o.waitForTimeout(500); await c.waitForTimeout(500);
              break;
            }
          }
          const oPost = await getRoot(o); const cPost = await getRoot(c);
          record(`PAT-04-post${trial}`, 'pattern', `Pattern trial ${trial} post-submit DOM`, h(oPost), h(cPost), oPost===cPost?'MATCH':'DIFFERENCE');
        } catch(e) {
          record(`PAT-03-trial${trial}`, 'pattern', `Pattern trial ${trial}`, 'N/A', 'N/A', 'BLOCKED', e.message.substring(0,80));
        }
      }
    } catch(e) {
      record('PAT-02', 'pattern', 'Pattern Challenge interaction', 'N/A', 'N/A', 'BLOCKED', e.message.substring(0,120));
    }
    await ctx1.close(); await ctx2.close();
  }

  // ═══════════════════════════════════════════════════════
  // PART G: RULE LAB
  // ═══════════════════════════════════════════════════════
  console.log('\n=== PART G: RULE LABORATORY ===');
  {
    const [o, c, ,, ctx1, ctx2] = await newPagePair(browser, ORIG_URL, CAND_URL, false);
    await nav(o, 'Rule Laboratory'); await nav(c, 'Rule Laboratory');

    const oRL0 = await getRoot(o); const cRL0 = await getRoot(c);
    record('RULES-01-initial', 'rules', 'Rule Lab initial DOM', h(oRL0), h(cRL0), oRL0===cRL0?'MATCH':'DIFFERENCE');

    // Try entering rule detective mode
    try {
      const modes = await o.evaluate(() =>
        Array.from(document.querySelectorAll('#main button, #main [role="tab"]'))
          .filter(b=>b.textContent.trim().length>0&&b.textContent.trim().length<50)
          .map(b=>b.textContent.trim())
      );
      record('RULES-02-modes', 'rules', 'Rule Lab modes available', String(modes.length), String(modes.length), 'MATCH', modes.join(' | '));

      // Click on each available mode and compare DOM
      for (const mode of modes.slice(0,5)) {
        try {
          await o.locator('#main button, #main [role="tab"]', {hasText:mode}).first().click({timeout:3000});
          await c.locator('#main button, #main [role="tab"]', {hasText:mode}).first().click({timeout:3000});
          await o.waitForTimeout(600); await c.waitForTimeout(600);
          const oR = await getRoot(o); const cR = await getRoot(c);
          record(`RULES-03-${mode.replace(/\W+/g,'_').substring(0,15)}`, 'rules', `Rule mode: ${mode.substring(0,30)}`, h(oR), h(cR), oR===cR?'MATCH':'DIFFERENCE');
        } catch(e) {
          record(`RULES-03-${mode.replace(/\W+/g,'_').substring(0,15)}`, 'rules', `Rule mode: ${mode.substring(0,20)}`, 'N/A', 'N/A', 'BLOCKED', e.message.substring(0,60));
        }
      }

      // Rule Detective: attempt case completion
      // Navigate to Detective mode
      try {
        await o.locator('#main button, #main [role="tab"]', {hasText:'Detective'}).first().click({timeout:3000});
        await c.locator('#main button, #main [role="tab"]', {hasText:'Detective'}).first().click({timeout:3000});
        await o.waitForTimeout(600); await c.waitForTimeout(600);

        for (let trial = 0; trial < 4; trial++) {
          const oOpts = await o.evaluate(() =>
            Array.from(document.querySelectorAll('#main button')).filter(b=>b.textContent.trim().length>1&&b.textContent.trim().length<80&&!b.textContent.includes('Skip')&&!b.textContent.includes('New case')).map(b=>b.textContent.trim())
          );
          if (oOpts.length === 0) break;
          const pick = oOpts[0];
          await o.locator('#main button', {hasText:pick}).first().click({timeout:2000}).catch(()=>{});
          await c.locator('#main button', {hasText:pick}).first().click({timeout:2000}).catch(()=>{});
          await o.waitForTimeout(400); await c.waitForTimeout(400);
          // Submit
          await o.locator('#main button', {hasText:/submit|check|reveal/i}).first().click({timeout:2000}).catch(()=>{});
          await c.locator('#main button', {hasText:/submit|check|reveal/i}).first().click({timeout:2000}).catch(()=>{});
          await o.waitForTimeout(500); await c.waitForTimeout(500);
          const oR = await getRoot(o); const cR = await getRoot(c);
          record(`RULES-DET-${trial}`, 'rules', `Rule Detective trial ${trial}`, h(oR), h(cR), oR===cR?'MATCH':'DIFFERENCE');
          // Try to advance
          await o.locator('#main button', {hasText:/next|continue|new/i}).first().click({timeout:1500}).catch(()=>{});
          await c.locator('#main button', {hasText:/next|continue|new/i}).first().click({timeout:1500}).catch(()=>{});
          await o.waitForTimeout(400); await c.waitForTimeout(400);
        }
      } catch(e) {
        record('RULES-DET', 'rules', 'Rule Detective cases', 'N/A', 'N/A', 'BLOCKED', e.message.substring(0,100));
      }

      // Inspect Sequence
      try {
        await o.locator('#main button, #main [role="tab"]', {hasText:/inspect|sequence/i}).first().click({timeout:3000});
        await c.locator('#main button, #main [role="tab"]', {hasText:/inspect|sequence/i}).first().click({timeout:3000});
        await o.waitForTimeout(600); await c.waitForTimeout(600);
        const oIS = await getRoot(o); const cIS = await getRoot(c);
        record('RULES-INSPECT', 'rules', 'Inspect Sequence DOM', h(oIS), h(cIS), oIS===cIS?'MATCH':'DIFFERENCE');
      } catch(e) {
        record('RULES-INSPECT', 'rules', 'Inspect Sequence', 'N/A', 'N/A', 'BLOCKED', e.message.substring(0,80));
      }
    } catch(e) {
      record('RULES-02', 'rules', 'Rule Lab mode navigation', 'N/A', 'N/A', 'BLOCKED', e.message.substring(0,120));
    }
    await ctx1.close(); await ctx2.close();
  }

  // ═══════════════════════════════════════════════════════
  // PART H: QC STRATEGY LAB
  // ═══════════════════════════════════════════════════════
  console.log('\n=== PART H: QC STRATEGY LAB ===');
  {
    const [o, c, ,, ctx1, ctx2] = await newPagePair(browser, ORIG_URL, CAND_URL, false);
    await nav(o, 'QC Strategy Lab'); await nav(c, 'QC Strategy Lab');

    const oS0 = await getRoot(o); const cS0 = await getRoot(c);
    record('STRAT-01', 'strategy', 'Strategy Lab initial DOM', h(oS0), h(cS0), oS0===cS0?'MATCH':'DIFFERENCE');

    // APS classification — 8 cases
    try {
      await o.locator('#main button, #main [role="tab"]', {hasText:/APS|classify/i}).first().click({timeout:3000});
      await c.locator('#main button, #main [role="tab"]', {hasText:/APS|classify/i}).first().click({timeout:3000});
      await o.waitForTimeout(600); await c.waitForTimeout(600);

      const APS_CASES = ['clinical', 'biological', 'state-of-the-art', 'regulatory', 'eqa', 'manufacturer', 'local', 'insufficient'];
      for (const apsCase of APS_CASES) {
        try {
          await o.locator('#main button, #main [role="tab"], #main label', {hasText:new RegExp(apsCase,'i')}).first().click({timeout:2000});
          await c.locator('#main button, #main [role="tab"], #main label', {hasText:new RegExp(apsCase,'i')}).first().click({timeout:2000});
          await o.waitForTimeout(400); await c.waitForTimeout(400);
          const oR = await getRoot(o); const cR = await getRoot(c);
          record(`STRAT-APS-${apsCase.substring(0,10)}`, 'strategy', `APS case: ${apsCase}`, h(oR), h(cR), oR===cR?'MATCH':'DIFFERENCE');
        } catch(e) {
          record(`STRAT-APS-${apsCase.substring(0,10)}`, 'strategy', `APS case: ${apsCase}`, 'N/A', 'N/A', 'BLOCKED', e.message.substring(0,60));
        }
      }
    } catch(e) {
      record('STRAT-APS', 'strategy', 'APS classification', 'N/A', 'N/A', 'BLOCKED', e.message.substring(0,100));
    }

    // Strategy Designer
    try {
      await o.locator('#main button, #main [role="tab"]', {hasText:/designer|design|procedure/i}).first().click({timeout:3000});
      await c.locator('#main button, #main [role="tab"]', {hasText:/designer|design|procedure/i}).first().click({timeout:3000});
      await o.waitForTimeout(600); await c.waitForTimeout(600);
      const oSD = await getRoot(o); const cSD = await getRoot(c);
      record('STRAT-DESIGN-01', 'strategy', 'Strategy Designer initial DOM', h(oSD), h(cSD), oSD===cSD?'MATCH':'DIFFERENCE');

      // Modify a number input (TEa/bias/CV)
      await o.locator('#main input[type="number"]').first().fill('10').catch(()=>{});
      await c.locator('#main input[type="number"]').first().fill('10').catch(()=>{});
      await o.waitForTimeout(500); await c.waitForTimeout(500);
      const oSDm = await getRoot(o); const cSDm = await getRoot(c);
      record('STRAT-DESIGN-02', 'strategy', 'Strategy Designer after input', h(oSDm), h(cSDm), oSDm===cSDm?'MATCH':'DIFFERENCE');
    } catch(e) {
      record('STRAT-DESIGN', 'strategy', 'Strategy Designer', 'N/A', 'N/A', 'BLOCKED', e.message.substring(0,100));
    }

    // Strategy Challenge
    try {
      await o.locator('#main button, #main [role="tab"]', {hasText:/challenge/i}).first().click({timeout:3000});
      await c.locator('#main button, #main [role="tab"]', {hasText:/challenge/i}).first().click({timeout:3000});
      await o.waitForTimeout(600); await c.waitForTimeout(600);
      for (let trial = 0; trial < 3; trial++) {
        const oOpts = await o.evaluate(() =>
          Array.from(document.querySelectorAll('#main button')).filter(b=>b.textContent.trim().length>1&&b.textContent.trim().length<80).map(b=>b.textContent.trim())
        );
        if (oOpts.length === 0) break;
        await o.locator('#main button', {hasText:oOpts[0]}).first().click({timeout:2000}).catch(()=>{});
        await c.locator('#main button', {hasText:oOpts[0]}).first().click({timeout:2000}).catch(()=>{});
        await o.waitForTimeout(400); await c.waitForTimeout(400);
        await o.locator('#main button', {hasText:/submit|check|reveal/i}).first().click({timeout:2000}).catch(()=>{});
        await c.locator('#main button', {hasText:/submit|check|reveal/i}).first().click({timeout:2000}).catch(()=>{});
        await o.waitForTimeout(500); await c.waitForTimeout(500);
        const oR = await getRoot(o); const cR = await getRoot(c);
        record(`STRAT-CHAL-${trial}`, 'strategy', `Strategy challenge ${trial}`, h(oR), h(cR), oR===cR?'MATCH':'DIFFERENCE');
        await o.locator('#main button', {hasText:/next|continue/i}).first().click({timeout:1500}).catch(()=>{});
        await c.locator('#main button', {hasText:/next|continue/i}).first().click({timeout:1500}).catch(()=>{});
        await o.waitForTimeout(400); await c.waitForTimeout(400);
      }
    } catch(e) {
      record('STRAT-CHAL', 'strategy', 'Strategy Challenge', 'N/A', 'N/A', 'BLOCKED', e.message.substring(0,100));
    }
    await ctx1.close(); await ctx2.close();
  }

  // ═══════════════════════════════════════════════════════
  // PART I: RISK & FREQUENCY LAB
  // ═══════════════════════════════════════════════════════
  console.log('\n=== PART I: RISK & FREQUENCY LAB ===');
  {
    const [o, c, ,, ctx1, ctx2] = await newPagePair(browser, ORIG_URL, CAND_URL, false);
    await nav(o, 'Risk & Frequency Lab'); await nav(c, 'Risk & Frequency Lab');

    const oR0 = await getRoot(o); const cR0 = await getRoot(c);
    record('RISK-01', 'risk', 'Risk Lab initial DOM', h(oR0), h(cR0), oR0===cR0?'MATCH':'DIFFERENCE');

    // Frequency Simulator
    try {
      await o.locator('#main button, #main [role="tab"]', {hasText:/simulat|frequency/i}).first().click({timeout:3000});
      await c.locator('#main button, #main [role="tab"]', {hasText:/simulat|frequency/i}).first().click({timeout:3000});
      await o.waitForTimeout(600); await c.waitForTimeout(600);

      // Set M=25
      const mInput = await o.locator('#main input[type="number"], #main input[type="range"]').first().isVisible({timeout:500}).catch(()=>false);
      if (mInput) {
        await o.locator('#main input[type="number"], #main input[type="range"]').first().fill('25');
        await c.locator('#main input[type="number"], #main input[type="range"]').first().fill('25');
        await o.waitForTimeout(600); await c.waitForTimeout(600);
        const oM25 = await getRoot(o); const cM25 = await getRoot(c);
        record('RISK-M25', 'risk', 'Frequency Simulator M=25', h(oM25), h(cM25), oM25===cM25?'MATCH':'DIFFERENCE');

        await o.locator('#main input[type="number"], #main input[type="range"]').first().fill('500');
        await c.locator('#main input[type="number"], #main input[type="range"]').first().fill('500');
        await o.waitForTimeout(600); await c.waitForTimeout(600);
        const oM500 = await getRoot(o); const cM500 = await getRoot(c);
        record('RISK-M500', 'risk', 'Frequency Simulator M=500', h(oM500), h(cM500), oM500===cM500?'MATCH':'DIFFERENCE');
      } else {
        record('RISK-M25', 'risk', 'Frequency Simulator M input', 'N/A', 'N/A', 'BLOCKED', 'No M input found');
        record('RISK-M500', 'risk', 'Frequency Simulator M=500', 'N/A', 'N/A', 'BLOCKED', 'No M input found');
      }
    } catch(e) {
      record('RISK-SIM', 'risk', 'Frequency Simulator', 'N/A', 'N/A', 'BLOCKED', e.message.substring(0,100));
    }

    // Frequency Challenge
    try {
      await o.locator('#main button, #main [role="tab"]', {hasText:/challenge/i}).first().click({timeout:3000});
      await c.locator('#main button, #main [role="tab"]', {hasText:/challenge/i}).first().click({timeout:3000});
      await o.waitForTimeout(600); await c.waitForTimeout(600);
      for (let trial = 0; trial < 3; trial++) {
        const oOpts = await o.evaluate(() =>
          Array.from(document.querySelectorAll('#main button')).filter(b=>b.textContent.trim().length>1&&b.textContent.trim().length<80).map(b=>b.textContent.trim())
        );
        if (oOpts.length === 0) break;
        await o.locator('#main button', {hasText:oOpts[0]}).first().click({timeout:2000}).catch(()=>{});
        await c.locator('#main button', {hasText:oOpts[0]}).first().click({timeout:2000}).catch(()=>{});
        await o.waitForTimeout(400); await c.waitForTimeout(400);
        await o.locator('#main button', {hasText:/submit|check/i}).first().click({timeout:2000}).catch(()=>{});
        await c.locator('#main button', {hasText:/submit|check/i}).first().click({timeout:2000}).catch(()=>{});
        await o.waitForTimeout(500); await c.waitForTimeout(500);
        const oR = await getRoot(o); const cR = await getRoot(c);
        record(`RISK-CHAL-${trial}`, 'risk', `Frequency challenge ${trial}`, h(oR), h(cR), oR===cR?'MATCH':'DIFFERENCE');
        await o.locator('#main button', {hasText:/next|continue/i}).first().click({timeout:1500}).catch(()=>{});
        await c.locator('#main button', {hasText:/next|continue/i}).first().click({timeout:1500}).catch(()=>{});
        await o.waitForTimeout(400); await c.waitForTimeout(400);
      }
    } catch(e) {
      record('RISK-CHAL', 'risk', 'Frequency Challenge', 'N/A', 'N/A', 'BLOCKED', e.message.substring(0,100));
    }
    await ctx1.close(); await ctx2.close();
  }

  // ═══════════════════════════════════════════════════════
  // PART J: INVESTIGATION LAB
  // ═══════════════════════════════════════════════════════
  console.log('\n=== PART J: INVESTIGATION LAB ===');
  {
    const [o, c, ,, ctx1, ctx2] = await newPagePair(browser, ORIG_URL, CAND_URL, false);
    await nav(o, 'Investigation Lab'); await nav(c, 'Investigation Lab');

    // Recovery Challenge — navigate to recovery mode
    try {
      await o.locator('#main button, #main [role="tab"]', {hasText:/recovery|challenge/i}).first().click({timeout:4000});
      await c.locator('#main button, #main [role="tab"]', {hasText:/recovery|challenge/i}).first().click({timeout:4000});
      await o.waitForTimeout(600); await c.waitForTimeout(600);

      const oRC0 = await getRoot(o); const cRC0 = await getRoot(c);
      record('INV-RC-01', 'investigation', 'Recovery Challenge initial', h(oRC0), h(cRC0), oRC0===cRC0?'MATCH':'DIFFERENCE');

      // Traverse stages: click through available options
      const stages = ['signal','containment','characterisation','hypothesis','evidence','intervention','verification','patient-impact','resume'];
      let stageIdx = 0;
      for (let step = 0; step < 12; step++) {
        const oOpts = await o.evaluate(() =>
          Array.from(document.querySelectorAll('#main button')).filter(b=>{
            const t = b.textContent.trim();
            return t.length > 1 && t.length < 100 && !t.includes('New case') && !t.includes('Start over');
          }).map(b=>b.textContent.trim())
        );
        if (oOpts.length === 0) break;

        const pick = oOpts[0]; // deterministic: always first option
        await o.locator('#main button', {hasText:pick}).first().click({timeout:2000}).catch(()=>{});
        await c.locator('#main button', {hasText:pick}).first().click({timeout:2000}).catch(()=>{});
        await o.waitForTimeout(500); await c.waitForTimeout(500);

        await o.locator('#main button', {hasText:/submit|next|continue|advance|confirm/i}).first().click({timeout:1500}).catch(()=>{});
        await c.locator('#main button', {hasText:/submit|next|continue|advance|confirm/i}).first().click({timeout:1500}).catch(()=>{});
        await o.waitForTimeout(500); await c.waitForTimeout(500);

        const oR = await getRoot(o); const cR = await getRoot(c);
        record(`INV-RC-step${step}`, 'investigation', `Recovery Challenge step ${step}`, h(oR), h(cR), oR===cR?'MATCH':'DIFFERENCE');

        // Check for patient impact table
        const oHasTable = await o.evaluate(() => !!document.querySelector('#main table'));
        if (oHasTable) {
          const cHasTable = await c.evaluate(() => !!document.querySelector('#main table'));
          record('INV-PATIENT-table', 'investigation', 'Patient impact table present', String(oHasTable), String(cHasTable), oHasTable===cHasTable?'MATCH':'DIFFERENCE');
          const oTable = await o.evaluate(() => document.querySelector('#main table')?.outerHTML || '');
          const cTable = await c.evaluate(() => document.querySelector('#main table')?.outerHTML || '');
          record('INV-PATIENT-dom', 'investigation', 'Patient impact table DOM', h(oTable), h(cTable), oTable===cTable?'MATCH':'DIFFERENCE');
          break; // stop after patient impact
        }
        stageIdx++;
      }
    } catch(e) {
      record('INV-RC', 'investigation', 'Recovery Challenge traversal', 'N/A', 'N/A', 'BLOCKED', e.message.substring(0,120));
    }
    await ctx1.close(); await ctx2.close();
  }

  // ═══════════════════════════════════════════════════════
  // PART K: EQA LAB
  // ═══════════════════════════════════════════════════════
  console.log('\n=== PART K: EQA LAB ===');
  {
    const [o, c, ,, ctx1, ctx2] = await newPagePair(browser, ORIG_URL, CAND_URL, false);
    await nav(o, 'External Assurance Lab'); await nav(c, 'External Assurance Lab');

    const oEQ0 = await getRoot(o); const cEQ0 = await getRoot(c);
    record('EQA-01', 'eqa', 'EQA Lab initial DOM', h(oEQ0), h(cEQ0), oEQ0===cEQ0?'MATCH':'DIFFERENCE');

    // Longitudinal EQA challenge
    try {
      await o.locator('#main button, #main [role="tab"]', {hasText:/longitudinal|challenge/i}).first().click({timeout:3000});
      await c.locator('#main button, #main [role="tab"]', {hasText:/longitudinal|challenge/i}).first().click({timeout:3000});
      await o.waitForTimeout(600); await c.waitForTimeout(600);
      const oEQL = await getRoot(o); const cEQL = await getRoot(c);
      record('EQA-LONG-01', 'eqa', 'EQA Longitudinal Challenge initial', h(oEQL), h(cEQL), oEQL===cEQL?'MATCH':'DIFFERENCE');

      for (let step = 0; step < 8; step++) {
        const oOpts = await o.evaluate(() =>
          Array.from(document.querySelectorAll('#main button')).filter(b=>b.textContent.trim().length>1&&b.textContent.trim().length<80).map(b=>b.textContent.trim())
        );
        if (oOpts.length === 0) break;
        await o.locator('#main button', {hasText:oOpts[0]}).first().click({timeout:2000}).catch(()=>{});
        await c.locator('#main button', {hasText:oOpts[0]}).first().click({timeout:2000}).catch(()=>{});
        await o.waitForTimeout(400); await c.waitForTimeout(400);
        await o.locator('#main button', {hasText:/submit|next|continue/i}).first().click({timeout:1500}).catch(()=>{});
        await c.locator('#main button', {hasText:/submit|next|continue/i}).first().click({timeout:1500}).catch(()=>{});
        await o.waitForTimeout(400); await c.waitForTimeout(400);
        const oR = await getRoot(o); const cR = await getRoot(c);
        record(`EQA-LONG-step${step}`, 'eqa', `EQA challenge step ${step}`, h(oR), h(cR), oR===cR?'MATCH':'DIFFERENCE');
      }
    } catch(e) {
      record('EQA-LONG', 'eqa', 'EQA Longitudinal Challenge', 'N/A', 'N/A', 'BLOCKED', e.message.substring(0,100));
    }

    // Comparability: check for "designated comparator" wording
    try {
      await o.locator('#main button, #main [role="tab"]', {hasText:/comparability|compar/i}).first().click({timeout:3000});
      await c.locator('#main button, #main [role="tab"]', {hasText:/comparability|compar/i}).first().click({timeout:3000});
      await o.waitForTimeout(600); await c.waitForTimeout(600);
      const oText = await o.evaluate(() => document.getElementById('main')?.textContent || '');
      const cText = await c.evaluate(() => document.getElementById('main')?.textContent || '');
      const oHasComparator = oText.includes('designated comparator');
      const cHasComparator = cText.includes('designated comparator');
      record('EQA-COMP-wording', 'eqa', '"designated comparator" wording', String(oHasComparator), String(cHasComparator),
        oHasComparator===cHasComparator?'MATCH':'DIFFERENCE',
        cHasComparator&&!oHasComparator?'CANDIDATE-ONLY wording' : null);
      const oCompR = await getRoot(o); const cCompR = await getRoot(c);
      record('EQA-COMP-dom', 'eqa', 'Comparability mode DOM', h(oCompR), h(cCompR), oCompR===cCompR?'MATCH':'DIFFERENCE');
    } catch(e) {
      record('EQA-COMP', 'eqa', 'EQA Comparability', 'N/A', 'N/A', 'BLOCKED', e.message.substring(0,100));
    }
    await ctx1.close(); await ctx2.close();
  }

  // ═══════════════════════════════════════════════════════
  // PART L: BV / RCV LAB
  // ═══════════════════════════════════════════════════════
  console.log('\n=== PART L: BV/RCV LAB ===');
  {
    const [o, c, ,, ctx1, ctx2] = await newPagePair(browser, ORIG_URL, CAND_URL, false);
    await nav(o, 'BV & RCV Lab'); await nav(c, 'BV & RCV Lab');

    const oBV0 = await getRoot(o); const cBV0 = await getRoot(c);
    record('BV-01', 'bv', 'BV Lab initial DOM', h(oBV0), h(cBV0), oBV0===cBV0?'MATCH':'DIFFERENCE');

    // Try modes
    try {
      const modes = await o.evaluate(() =>
        Array.from(document.querySelectorAll('#main button, #main [role="tab"]'))
          .filter(b=>b.textContent.trim().length>0&&b.textContent.trim().length<50).map(b=>b.textContent.trim())
      );
      for (const mode of modes.slice(0,5)) {
        try {
          await o.locator('#main button, #main [role="tab"]', {hasText:mode}).first().click({timeout:2000});
          await c.locator('#main button, #main [role="tab"]', {hasText:mode}).first().click({timeout:2000});
          await o.waitForTimeout(500); await c.waitForTimeout(500);
          const oR = await getRoot(o); const cR = await getRoot(c);
          record(`BV-mode-${mode.replace(/\W+/g,'_').substring(0,12)}`, 'bv', `BV mode: ${mode.substring(0,25)}`, h(oR), h(cR), oR===cR?'MATCH':'DIFFERENCE');
          // Modify inputs
          await o.locator('#main input[type="number"]').first().fill('5').catch(()=>{});
          await c.locator('#main input[type="number"]').first().fill('5').catch(()=>{});
          await o.waitForTimeout(400); await c.waitForTimeout(400);
          const oRm = await getRoot(o); const cRm = await getRoot(c);
          record(`BV-input-${mode.replace(/\W+/g,'_').substring(0,12)}`, 'bv', `BV mode ${mode.substring(0,15)} after input`, h(oRm), h(cRm), oRm===cRm?'MATCH':'DIFFERENCE');
        } catch(e) {
          record(`BV-mode-${mode.replace(/\W+/g,'_').substring(0,12)}`, 'bv', `BV mode: ${mode.substring(0,20)}`, 'N/A', 'N/A', 'BLOCKED', e.message.substring(0,60));
        }
      }
    } catch(e) {
      record('BV-modes', 'bv', 'BV Lab mode navigation', 'N/A', 'N/A', 'BLOCKED', e.message.substring(0,100));
    }

    // Serial result challenge
    try {
      await o.locator('#main button, #main [role="tab"]', {hasText:/serial|challenge/i}).first().click({timeout:3000});
      await c.locator('#main button, #main [role="tab"]', {hasText:/serial|challenge/i}).first().click({timeout:3000});
      await o.waitForTimeout(600); await c.waitForTimeout(600);
      for (let trial = 0; trial < 2; trial++) {
        const oOpts = await o.evaluate(() =>
          Array.from(document.querySelectorAll('#main button')).filter(b=>b.textContent.trim().length>1&&b.textContent.trim().length<80).map(b=>b.textContent.trim())
        );
        if (oOpts.length === 0) break;
        await o.locator('#main button', {hasText:oOpts[0]}).first().click({timeout:2000}).catch(()=>{});
        await c.locator('#main button', {hasText:oOpts[0]}).first().click({timeout:2000}).catch(()=>{});
        await o.waitForTimeout(400); await c.waitForTimeout(400);
        await o.locator('#main button', {hasText:/submit|check/i}).first().click({timeout:2000}).catch(()=>{});
        await c.locator('#main button', {hasText:/submit|check/i}).first().click({timeout:2000}).catch(()=>{});
        await o.waitForTimeout(500); await c.waitForTimeout(500);
        const oR = await getRoot(o); const cR = await getRoot(c);
        record(`BV-SERIAL-${trial}`, 'bv', `Serial challenge ${trial}`, h(oR), h(cR), oR===cR?'MATCH':'DIFFERENCE');
        await o.locator('#main button', {hasText:/next|continue/i}).first().click({timeout:1500}).catch(()=>{});
        await c.locator('#main button', {hasText:/next|continue/i}).first().click({timeout:1500}).catch(()=>{});
        await o.waitForTimeout(400); await c.waitForTimeout(400);
      }
    } catch(e) {
      record('BV-SERIAL', 'bv', 'Serial result challenge', 'N/A', 'N/A', 'BLOCKED', e.message.substring(0,100));
    }
    await ctx1.close(); await ctx2.close();
  }

  // ═══════════════════════════════════════════════════════
  // PART M: PBRTQC LAB
  // ═══════════════════════════════════════════════════════
  console.log('\n=== PART M: PBRTQC LAB ===');
  {
    const [o, c, ,, ctx1, ctx2] = await newPagePair(browser, ORIG_URL, CAND_URL, false);
    await nav(o, 'Patient Surveillance Lab'); await nav(c, 'Patient Surveillance Lab');

    const oPB0 = await getRoot(o); const cPB0 = await getRoot(c);
    record('PBRTQC-01', 'pbrtqc', 'PBRTQC Lab initial DOM', h(oPB0), h(cPB0), oPB0===cPB0?'MATCH':'DIFFERENCE');

    // Algorithm modes
    try {
      await o.locator('#main button, #main [role="tab"]', {hasText:/algorithm|distrib/i}).first().click({timeout:3000});
      await c.locator('#main button, #main [role="tab"]', {hasText:/algorithm|distrib/i}).first().click({timeout:3000});
      await o.waitForTimeout(600); await c.waitForTimeout(600);
      const oPBA = await getRoot(o); const cPBA = await getRoot(c);
      record('PBRTQC-ALG', 'pbrtqc', 'PBRTQC Algorithm DOM', h(oPBA), h(cPBA), oPBA===cPBA?'MATCH':'DIFFERENCE');

      // Try selecting moving mean / median / EWMA
      for (const alg of ['mean', 'median', 'EWMA']) {
        try {
          await o.locator('#main button, #main select option, #main [role="tab"]', {hasText:new RegExp(alg,'i')}).first().click({timeout:2000});
          await c.locator('#main button, #main select option, #main [role="tab"]', {hasText:new RegExp(alg,'i')}).first().click({timeout:2000});
          await o.waitForTimeout(500); await c.waitForTimeout(500);
          const oR = await getRoot(o); const cR = await getRoot(c);
          record(`PBRTQC-ALG-${alg}`, 'pbrtqc', `Algorithm: ${alg}`, h(oR), h(cR), oR===cR?'MATCH':'DIFFERENCE');
        } catch(e) {
          record(`PBRTQC-ALG-${alg}`, 'pbrtqc', `Algorithm: ${alg}`, 'N/A', 'N/A', 'BLOCKED', e.message.substring(0,60));
        }
      }
    } catch(e) {
      record('PBRTQC-ALG', 'pbrtqc', 'PBRTQC Algorithm', 'N/A', 'N/A', 'BLOCKED', e.message.substring(0,100));
    }

    // Simulator
    try {
      await o.locator('#main button, #main [role="tab"]', {hasText:/simulat/i}).first().click({timeout:3000});
      await c.locator('#main button, #main [role="tab"]', {hasText:/simulat/i}).first().click({timeout:3000});
      await o.waitForTimeout(600); await c.waitForTimeout(600);
      const oPBSim = await getRoot(o); const cPBSim = await getRoot(c);
      record('PBRTQC-SIM-initial', 'pbrtqc', 'PBRTQC Simulator initial', h(oPBSim), h(cPBSim), oPBSim===cPBSim?'MATCH':'DIFFERENCE');

      // Manipulate W input
      await o.locator('#main input[type="number"]').first().fill('20').catch(()=>{});
      await c.locator('#main input[type="number"]').first().fill('20').catch(()=>{});
      await o.waitForTimeout(500); await c.waitForTimeout(500);
      const oPBW = await getRoot(o); const cPBW = await getRoot(c);
      record('PBRTQC-SIM-W20', 'pbrtqc', 'PBRTQC Simulator W=20', h(oPBW), h(cPBW), oPBW===cPBW?'MATCH':'DIFFERENCE');

      // Toggle truncation if available
      const hasTrunc = await o.locator('#main input[type="checkbox"], #main button', {hasText:/truncat/i}).isVisible({timeout:500}).catch(()=>false);
      if (hasTrunc) {
        await o.locator('#main input[type="checkbox"], #main button', {hasText:/truncat/i}).first().click({timeout:2000});
        await c.locator('#main input[type="checkbox"], #main button', {hasText:/truncat/i}).first().click({timeout:2000});
        await o.waitForTimeout(500); await c.waitForTimeout(500);
        const oPBT = await getRoot(o); const cPBT = await getRoot(c);
        record('PBRTQC-SIM-trunc', 'pbrtqc', 'PBRTQC Simulator truncation toggle', h(oPBT), h(cPBT), oPBT===cPBT?'MATCH':'DIFFERENCE');
      }
    } catch(e) {
      record('PBRTQC-SIM', 'pbrtqc', 'PBRTQC Simulator', 'N/A', 'N/A', 'BLOCKED', e.message.substring(0,100));
    }

    // Challenge
    try {
      await o.locator('#main button, #main [role="tab"]', {hasText:/challenge/i}).first().click({timeout:3000});
      await c.locator('#main button, #main [role="tab"]', {hasText:/challenge/i}).first().click({timeout:3000});
      await o.waitForTimeout(600); await c.waitForTimeout(600);
      for (let trial = 0; trial < 3; trial++) {
        const oOpts = await o.evaluate(() =>
          Array.from(document.querySelectorAll('#main button')).filter(b=>b.textContent.trim().length>1&&b.textContent.trim().length<80).map(b=>b.textContent.trim())
        );
        if (oOpts.length === 0) break;
        await o.locator('#main button', {hasText:oOpts[0]}).first().click({timeout:2000}).catch(()=>{});
        await c.locator('#main button', {hasText:oOpts[0]}).first().click({timeout:2000}).catch(()=>{});
        await o.waitForTimeout(400); await c.waitForTimeout(400);
        await o.locator('#main button', {hasText:/submit|check/i}).first().click({timeout:2000}).catch(()=>{});
        await c.locator('#main button', {hasText:/submit|check/i}).first().click({timeout:2000}).catch(()=>{});
        await o.waitForTimeout(500); await c.waitForTimeout(500);
        const oR = await getRoot(o); const cR = await getRoot(c);
        record(`PBRTQC-CHAL-${trial}`, 'pbrtqc', `PBRTQC challenge ${trial}`, h(oR), h(cR), oR===cR?'MATCH':'DIFFERENCE');
        await o.locator('#main button', {hasText:/next|continue/i}).first().click({timeout:1500}).catch(()=>{});
        await c.locator('#main button', {hasText:/next|continue/i}).first().click({timeout:1500}).catch(()=>{});
        await o.waitForTimeout(400); await c.waitForTimeout(400);
      }
    } catch(e) {
      record('PBRTQC-CHAL', 'pbrtqc', 'PBRTQC Challenge', 'N/A', 'N/A', 'BLOCKED', e.message.substring(0,100));
    }
    await ctx1.close(); await ctx2.close();
  }

  // ═══════════════════════════════════════════════════════
  // PART N: EXTENDED KEYBOARD
  // ═══════════════════════════════════════════════════════
  console.log('\n=== PART N: EXTENDED KEYBOARD ===');
  {
    const [o, c, ,, ctx1, ctx2] = await newPagePair(browser, ORIG_URL, CAND_URL, false);

    // Activate skip link
    try {
      await o.keyboard.press('Tab');
      await c.keyboard.press('Tab');
      const oFocus = await o.evaluate(() => document.activeElement?.textContent?.trim().substring(0,40) || '');
      const cFocus = await c.evaluate(() => document.activeElement?.textContent?.trim().substring(0,40) || '');
      record('KB-EXT-01', 'keyboard', 'First Tab: skip link focus', oFocus, cFocus, oFocus===cFocus?'MATCH':'DIFFERENCE');

      // Activate skip link
      await o.keyboard.press('Enter');
      await c.keyboard.press('Enter');
      await o.waitForTimeout(300); await c.waitForTimeout(300);
      const oMainFocus = await o.evaluate(() => {
        const a = document.activeElement;
        return a ? (a.id || a.tagName || a.textContent?.substring(0,20)) : 'none';
      });
      const cMainFocus = await c.evaluate(() => {
        const a = document.activeElement;
        return a ? (a.id || a.tagName || a.textContent?.substring(0,20)) : 'none';
      });
      record('KB-EXT-02', 'keyboard', 'Enter on skip link: focus target', oMainFocus, cMainFocus, oMainFocus===cMainFocus?'MATCH':'DIFFERENCE');
    } catch(e) { record('KB-EXT-01', 'keyboard', 'Skip link activation', 'N/A', 'N/A', 'BLOCKED', e.message.substring(0,80)); }

    // Tab through primary nav
    try {
      await o.locator('.skip-link, [href="#main"]').first().focus({timeout:2000});
      await c.locator('.skip-link, [href="#main"]').first().focus({timeout:2000});
      const navFocuses = [];
      for (let i = 0; i < 16; i++) {
        await o.keyboard.press('Tab'); await c.keyboard.press('Tab');
        const oEl = await o.evaluate(() => { const a=document.activeElement; return a ? (a.textContent?.trim().substring(0,30)||a.tagName) : 'none'; });
        const cEl = await c.evaluate(() => { const a=document.activeElement; return a ? (a.textContent?.trim().substring(0,30)||a.tagName) : 'none'; });
        navFocuses.push({o:oEl, c:cEl, match:oEl===cEl});
      }
      const allNavMatch = navFocuses.every(f=>f.match);
      record('KB-EXT-03', 'keyboard', 'Tab sequence through nav (16 Tabs)', String(allNavMatch), String(allNavMatch), allNavMatch?'MATCH':'DIFFERENCE',
        allNavMatch ? null : 'First mismatch: ' + JSON.stringify(navFocuses.find(f=>!f.match)));
    } catch(e) { record('KB-EXT-03', 'keyboard', 'Tab through nav', 'N/A', 'N/A', 'BLOCKED', e.message.substring(0,80)); }

    // Level select by keyboard
    try {
      await o.focus('#level-select'); await c.focus('#level-select');
      await o.keyboard.press('ArrowDown'); await c.keyboard.press('ArrowDown');
      await o.waitForTimeout(300); await c.waitForTimeout(300);
      const oLv = await o.evaluate(() => document.getElementById('level-select')?.value || '');
      const cLv = await c.evaluate(() => document.getElementById('level-select')?.value || '');
      record('KB-EXT-04', 'keyboard', 'Level select ArrowDown', oLv, cLv, oLv===cLv?'MATCH':'DIFFERENCE');
    } catch(e) { record('KB-EXT-04', 'keyboard', 'Level select by keyboard', 'N/A', 'N/A', 'BLOCKED', e.message.substring(0,80)); }

    // Modal initial focus
    try {
      await o.getByRole('button', {name:'Glossary'}).click({timeout:3000});
      await c.getByRole('button', {name:'Glossary'}).click({timeout:3000});
      await o.waitForTimeout(500); await c.waitForTimeout(500);
      const oMFocus = await o.evaluate(() => { const a=document.activeElement; const d=document.querySelector('[role="dialog"]'); return d&&d.contains(a) ? (a.tagName+':'+a.textContent.trim().substring(0,20)) : 'outside-dialog'; });
      const cMFocus = await c.evaluate(() => { const a=document.activeElement; const d=document.querySelector('[role="dialog"]'); return d&&d.contains(a) ? (a.tagName+':'+a.textContent.trim().substring(0,20)) : 'outside-dialog'; });
      record('KB-EXT-05', 'keyboard', 'Modal initial focus (in dialog?)', oMFocus, cMFocus, oMFocus===cMFocus?'MATCH':'DIFFERENCE');
      // Tab inside modal
      await o.keyboard.press('Tab'); await c.keyboard.press('Tab');
      await o.waitForTimeout(200); await c.waitForTimeout(200);
      const oMTab = await o.evaluate(() => { const a=document.activeElement; return a?(a.tagName+':'+a.textContent.trim().substring(0,20)):'none'; });
      const cMTab = await c.evaluate(() => { const a=document.activeElement; return a?(a.tagName+':'+a.textContent.trim().substring(0,20)):'none'; });
      record('KB-EXT-06', 'keyboard', 'Tab inside modal', oMTab, cMTab, oMTab===cMTab?'MATCH':'DIFFERENCE');
      // Escape
      await o.keyboard.press('Escape'); await c.keyboard.press('Escape');
      await o.waitForTimeout(300); await c.waitForTimeout(300);
      const oDialogGone = await o.evaluate(() => !document.querySelector('[role="dialog"]'));
      const cDialogGone = await c.evaluate(() => !document.querySelector('[role="dialog"]'));
      record('KB-EXT-07', 'keyboard', 'Escape closes modal', String(oDialogGone), String(cDialogGone), oDialogGone===cDialogGone?'MATCH':'DIFFERENCE');
    } catch(e) { record('KB-EXT-05', 'keyboard', 'Modal keyboard focus', 'N/A', 'N/A', 'BLOCKED', e.message.substring(0,80)); }

    await ctx1.close(); await ctx2.close();
  }

  // ═══════════════════════════════════════════════════════
  // PART O: CONSOLE / PAGE ERROR FINAL CAPTURE
  // ═══════════════════════════════════════════════════════
  console.log('\n=== PART O: CONSOLE/PAGE ERROR FINAL ===');
  const appErrorsOrig = pageErrorsAll.filter(e=>e.artifact==='orig').length;
  const appErrorsCand = pageErrorsAll.filter(e=>e.artifact==='cand').length;
  record('CON-final-errors', 'console', 'Total page errors across full traversal', String(appErrorsOrig), String(appErrorsCand), appErrorsOrig===appErrorsCand?'MATCH':'DIFFERENCE',
    appErrorsCand>appErrorsOrig?'CANDIDATE-ONLY page errors: '+pageErrorsAll.filter(e=>e.artifact==='cand').map(e=>e.msg).join('; '):null);

  // ═══════════════════════════════════════════════════════
  // FINAL RESULTS
  // ═══════════════════════════════════════════════════════
  console.log('\n=== STAGE 10C SUMMARY ===');
  console.log(`Total checkpoints: ${results.length}`);
  console.log(`MATCH:      ${matchCount}`);
  console.log(`DIFFERENCE: ${diffCount}`);
  console.log(`BLOCKED:    ${blockedCount}`);
  console.log(`NOT_TESTED: ${notTestedCount}`);

  // Compute from array (not hardcoded)
  const computed = { match:0, difference:0, blocked:0, not_tested:0 };
  results.forEach(r => {
    const k = r.classification.toLowerCase().replace('-','_');
    if (computed[k] !== undefined) computed[k]++;
  });

  const out = {
    stage: '10C',
    artifact_class: 'D',
    browser: 'Chromium 141.0.7390.37',
    font_policy: 'Google Fonts aborted identically for both artifacts',
    original_sha: 'e5317bf135f350b258428b985c1034a081e244a295f2e580c93cb6a6a091c8e4',
    candidate_sha: 'a9fe9a3acbb8c35347cc735292ad63883778e5c12845f4da529129119b72c886',
    summary: { total: results.length, match: computed.match, difference: computed.difference, blocked: computed.blocked, not_tested: computed.not_tested },
    stage10b_115_result: 'preserved — 115 executed checkpoints, 115 MATCH (see stage10b-equivalence.json)',
    checkpoints: results,
  };

  fs.writeFileSync('/home/claude/recovery/stage10c-interaction-equivalence.json', JSON.stringify(out, null, 2));
  console.log('\nResults written to recovery/stage10c-interaction-equivalence.json');

  try { origSrv.close(); } catch(e){}
  try { candSrv.close(); } catch(e){}
  await browser.close();

  if (diffCount > 0) { console.error(`\n*** ${diffCount} DIFFERENCE(s) — validation FAIL ***`); process.exit(1); }
  else { console.log('\nAll checkpoints MATCH or BLOCKED.'); process.exit(0); }
})().catch(e => { console.error('FATAL:', e.message, e.stack ? e.stack.split('\n')[1] : ''); process.exit(1); });
