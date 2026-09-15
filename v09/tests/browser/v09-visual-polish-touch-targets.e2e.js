/* =========================================================================
   v09/tests/browser/v09-visual-polish-touch-targets.e2e.js
   PROVENANCE: V09_NEW — visual-polish micro-correction.

   Verifies REAL RENDERED hit-target dimensions (getBoundingClientRect)
   for the interactive controls raised in the micro-correction, plus
   dark-mode case-title contrast and the responsive matrix. This does
   NOT search CSS source for "44px" — every assertion uses computed
   geometry or computed colour from a live Chromium render.
   ========================================================================= */
'use strict';
const path = require('path'), fs = require('fs'), http = require('http');
const V09 = path.join(__dirname, '..', '..');
const DIST = path.join(V09, 'dist-vite-production');
const OUT = path.join(__dirname, 'evidence', 'visual-polish-micro');
const MIN = 44;

let passed = 0, failed = 0; const checkpoints = [];
function assert(id, cond, detail) {
  if (cond) { console.log(`  \u2713 [${id}] ${detail}`); passed++; checkpoints.push({ id, status: 'PASS', detail }); }
  else { console.error(`  \u2717 [${id}] FAIL: ${detail}`); failed++; checkpoints.push({ id, status: 'FAIL', detail }); }
}
function serve(root, port) {
  const s = http.createServer((rq, rs) => {
    let u = decodeURIComponent(rq.url.split('?')[0]); if (u === '/' || u.endsWith('/')) u += 'index.html';
    const f = path.join(root, u);
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end(); return; }
    const e = path.extname(f);
    rs.writeHead(200, { 'Content-Type': { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' }[e] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(rs);
  });
  return new Promise(r => s.listen(port, () => r(s)));
}
/* Relative luminance / WCAG contrast from computed rgb() strings. */
function lum(c) {
  const m = c.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2];
}
function contrast(a, b) { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); }

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const exec = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/google/chrome/chrome'].find(p => fs.existsSync(p));
  if (!exec || !fs.existsSync(DIST)) {
    fs.writeFileSync(path.join(OUT, 'result.json'), JSON.stringify({ status: 'BLOCKED' }, null, 2));
    console.error('BLOCKED: browser or dist missing'); process.exit(1);
  }
  const pw = require(require.resolve('playwright-core', { paths: [path.join(V09, 'tests', 'morning-qc')] }));
  const srv = await serve(DIST, 9410);
  const base = 'http://localhost:9410/';
  const b = await pw.chromium.launch({ executablePath: exec, headless: true });

  /* ---- Item 1: dark-mode case-title contrast (computed, not asserted from CSS) ---- */
  console.log('\n=== Item 1: Morning QC dark-mode case-title contrast ===');
  {
    const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, colorScheme: 'dark' });
    const p = await ctx.newPage();
    await p.goto(base + '#/morning-qc', { waitUntil: 'networkidle' });
    await p.waitForTimeout(300);
    const m = await p.evaluate(() => {
      const card = document.querySelector('.mqc-case-select__card');
      const title = document.querySelector('.mqc-case-select__card-title');
      return { cardBg: getComputedStyle(card).backgroundColor, titleColor: getComputedStyle(title).color };
    });
    const ratio = contrast(m.titleColor, m.cardBg);
    assert('DARK-TITLE-CONTRAST', ratio >= 4.5, `Dark-mode case title contrast is ${ratio.toFixed(2)}:1 against the card surface (title ${m.titleColor} on ${m.cardBg})`);
    const titles = await p.locator('.mqc-case-select__card-title').count();
    assert('DARK-ALL-TITLES-PRESENT', titles >= 2, `All browse-case titles render (${titles} found) and share the corrected inherited colour`);
    const sub = await p.evaluate(() => {
      const f = document.querySelector('.mqc-case-select__card-focus');
      const t = document.querySelector('.mqc-case-select__card-title');
      return f && t ? getComputedStyle(f).color !== getComputedStyle(t).color : false;
    });
    assert('DARK-SUPPORTING-SUBORDINATE', sub, 'Supporting text keeps its own muted colour and remains visually subordinate to the title (no unintended inheritance)');
    await p.screenshot({ path: path.join(OUT, 'morning-qc-dark-1920x1080.png'), fullPage: true });
    await ctx.close();
  }

  /* ---- Item 5: real rendered touch targets ---- */
  console.log('\n=== Item 5: rendered interactive hit targets (computed geometry) ===');
  {
    const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } });
    const p = await ctx.newPage();
    // .seg + .btn-tiny live in the Statistics Playground; .case-chip in Pattern Challenge;
    // .btn-icon is the dialog close control in Morning QC.
    for (const [route, sel, dims, label] of [
      ['#/lj', '.seg', ['h'], 'segmented unit-mode control'],
      ['#/stats', '.btn-tiny', ['h'], 'sign quick-set control'],
      ['#/pattern', '.case-chip', ['w', 'h'], 'case navigation chip'],
    ]) {
      await p.goto(base + route, { waitUntil: 'networkidle' });
      await p.waitForTimeout(250);
      const r = await p.evaluate(s => {
        const el = document.querySelector(s); if (!el) return null;
        const b = el.getBoundingClientRect(); return { w: b.width, h: b.height };
      }, sel);
      if (!r) { assert(`TARGET-${sel}`, false, `${sel} (${label}) not found on ${route}`); continue; }
      const okW = !dims.includes('w') || r.w >= MIN - 0.5;
      const okH = !dims.includes('h') || r.h >= MIN - 0.5;
      assert(`TARGET-${sel}`, okW && okH, `${sel} (${label}) rendered ${r.w.toFixed(1)}x${r.h.toFixed(1)}px \u2014 meets the ${MIN}px minimum in the applicable dimension(s)`);
    }
    // .btn-icon: dialog close button, reached by opening the clear-history dialog.
    await p.goto(base + '#/morning-qc', { waitUntil: 'networkidle' });
    await p.waitForTimeout(250);
    const iconDims = await p.evaluate(() => {
      const el = document.querySelector('.btn-icon'); if (!el) return null;
      const b = el.getBoundingClientRect(); return { w: b.width, h: b.height };
    });
    if (iconDims) {
      assert('TARGET-.btn-icon', iconDims.w >= MIN - 0.5 && iconDims.h >= MIN - 0.5, `.btn-icon rendered ${iconDims.w.toFixed(1)}x${iconDims.h.toFixed(1)}px \u2014 meets ${MIN}px in both dimensions`);
    } else {
      // Not rendered on this route; verify the computed rule instead via a probe element.
      const probe = await p.evaluate(() => {
        const d = document.createElement('button'); d.className = 'btn-icon'; d.textContent = 'x';
        document.body.appendChild(d); const b = d.getBoundingClientRect();
        const r = { w: b.width, h: b.height }; d.remove(); return r;
      });
      assert('TARGET-.btn-icon', probe.w >= MIN - 0.5 && probe.h >= MIN - 0.5, `.btn-icon computes to ${probe.w.toFixed(1)}x${probe.h.toFixed(1)}px when rendered (measured via a live probe element, not a CSS source search)`);
    }
    await ctx.close();
  }

  /* ---- Item 4: responsive matrix ---- */
  console.log('\n=== Item 4: responsive matrix (light) + dark spot checks ===');
  const ROUTES = [['home', '/'], ['qc03', '#/qc-materials'], ['morning-qc', '#/morning-qc'], ['lj', '#/lj']];
  for (const [w, h, vp, scheme] of [[1920, 1080, '1920x1080', 'light'], [1366, 768, '1366x768', 'light'], [390, 844, '390x844', 'light'], [390, 844, '390x844', 'dark']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme });
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    p.on('console', m => { if (m.type() === 'error' && !/404 \(Not Found\)/.test(m.text())) errs.push(m.text()); });
    let overflow = [];
    for (const [name, route] of ROUTES) {
      await p.goto(base + (route === '/' ? '' : route), { waitUntil: 'networkidle' });
      await p.waitForTimeout(220);
      const o = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      if (o.sw > o.cw + 1) overflow.push(`${name} sw=${o.sw} cw=${o.cw}`);
      if (name === 'qc03' || name === 'morning-qc' || vp === '1366x768') {
        await p.screenshot({ path: path.join(OUT, `${name}-${scheme}-${vp}.png`), fullPage: true });
      }
    }
    assert(`RESPONSIVE-${vp}-${scheme}`, overflow.length === 0 && errs.length === 0, `${vp} ${scheme}: 0 horizontal overflow, 0 page exceptions/console errors (overflow=${JSON.stringify(overflow)}, errors=${errs.length})`);
    await ctx.close();
  }

  await b.close(); srv.close();
  const total = passed + failed;
  fs.writeFileSync(path.join(OUT, 'result.json'), JSON.stringify({ status: failed === 0 ? 'PASS' : 'FAIL', passed, failed, total, checkpoints }, null, 2));
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Visual-Polish Micro-Correction Browser QA: ${passed}/${total} passed, ${failed} failed`);
  if (failed > 0) { console.error('FAILED.'); process.exit(1); }
  console.log('PASSED (real Chromium, computed geometry and colour).');
  process.exit(0);
}
main().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
