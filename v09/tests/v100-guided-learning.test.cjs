/* =========================================================================
   v09/tests/v100-guided-learning.test.cjs
   PROVENANCE: V09_NEW — v1.0 RC remediation, Workstreams 4, 5, 6, 7.

   Permanent governance for the guided-learning architecture and for the
   invariants it must NOT break (free exploration, navigation count,
   level selector).
   ========================================================================= */
'use strict';
const fs = require('fs'), path = require('path');
const V09 = path.join(__dirname, '..');
let passed = 0, failed = 0;
function ok(id, c, d) { if (c) { console.log(`  \u2713 [${id}] ${d}`); passed++; } else { console.error(`  \u2717 [${id}] FAIL: ${d}`); failed++; } }

async function main() {
  const G = await import('file://' + path.join(V09, 'app', 'ui', 'guided-path.js'));
  const shell = fs.readFileSync(path.join(V09, 'app', 'ui', 'app-shell.jsx'), 'utf8');
  const screens = fs.readFileSync(path.join(V09, 'app', 'ui', 'core-screens.jsx'), 'utf8');

  console.log('\n=== WS4: guided pathway completeness ===');
  ok('GP-count', G.GUIDED_TOTAL === 13, `pathway has 13 steps (found ${G.GUIDED_TOTAL})`);
  const navMatch = shell.match(/export const NAV_ITEMS = \[([\s\S]*?)\];/);
  const navKeys = [...navMatch[1].matchAll(/key:\s*"([a-z0-9-]+)"/g)].map(m => m[1]);
  G.GUIDED_PATH.forEach((s, i) => {
    ok(`GP-${i + 1}-goal`, typeof s.goal === 'string' && s.goal.length > 40, `step ${i + 1} (${s.label}) states a learning goal`);
    ok(`GP-${i + 1}-todo`, typeof s.whatToDo === 'string' && s.whatToDo.length > 40, `step ${i + 1} states what to do`);
    ok(`GP-${i + 1}-completion`, typeof s.completion === 'string' && /ready to continue|completed the guided/i.test(s.completion), `step ${i + 1} states a completion criterion`);
    ok(`GP-${i + 1}-takeaway`, typeof s.takeaway === 'string' && s.takeaway.length > 40, `step ${i + 1} states a key takeaway`);
    ok(`GP-${i + 1}-screen`, navKeys.includes(s.screen) || s.screen === 'qc-materials', `step ${i + 1} targets a real screen ("${s.screen}")`);
    if (i < G.GUIDED_TOTAL - 1) ok(`GP-${i + 1}-why`, typeof s.whyNext === 'string' && s.whyNext.length > 20, `step ${i + 1} explains why the next topic follows`);
  });
  ok('GP-last-no-why', G.GUIDED_PATH[G.GUIDED_TOTAL - 1].whyNext === null, 'final step has no "why next" (nothing follows)');

  console.log('\n=== WS4: sequence matches the existing authored pathway ===');
  const phaseMatch = screens.match(/export const PATHWAY_PHASES = \[([\s\S]*?)\n\];/);
  const authored = [...phaseMatch[1].matchAll(/screen:\s*"([a-z0-9-]+)"/g)].map(m => m[1]);
  ok('GP-sequence', JSON.stringify(G.GUIDED_PATH.map(s => s.screen)) === JSON.stringify(authored),
    'guided sequence is identical to the existing PATHWAY_PHASES order — no module added, removed or reordered');

  console.log('\n=== WS4: resync keeps the hash authoritative ===');
  ok('RS-same', G.resolveGuidedStep(0, 'stats') === 0, 'step retained when the screen still matches');
  ok('RS-jump', G.resolveGuidedStep(0, 'lj') === 2, 'jumping to another pathway screen resyncs the position');
  ok('RS-exit', G.resolveGuidedStep(0, 'map') === null, 'navigating off the pathway ends guided mode (no lock)');
  ok('RS-null', G.resolveGuidedStep(null, 'stats') === null, 'free exploration never auto-enters guided mode');
  ok('RS-derived-only', !/setGuidedStep\(activeGuidedStep\)/.test(shell), 'guided position is derived during render, never written back');

  console.log('\n=== WS5: Statistics Playground scaffolding ===');
  const s1 = G.GUIDED_PATH[0];
  ok('WS5-first', s1.screen === 'stats', 'Statistics Playground is the first guided module');
  for (const [k, re] of [['SD', /process sd|dispersion/i], ['bias', /bias/i], ['target-vs-centre', /target/i && /centre|center/i], ['CV', /cv/i]]) {
    ok(`WS5-${k}`, re.test(s1.whatToDo), `instructions prompt the learner to observe ${k}`);
  }
  ok('WS5-both-signs', /positive, then negative|positive.*negative/i.test(s1.whatToDo), 'instructions prompt BOTH positive and negative bias');
  ok('WS5-no-spoiler', !/independent of|does not change/i.test(s1.whatToDo), 'the "what to do" text does not reveal the conclusion before observation');
  ok('WS5-takeaway-after', /independent/i.test(s1.takeaway), 'the conclusion is stated in the takeaway, i.e. after the activity');

  console.log('\n=== WS6: free exploration preserved ===');
  ok('WS6-nav14', navKeys.length === 14, `global navigation still has 14 destinations (found ${navKeys.length})`);
  ok('WS6-no-lock', !/disabled=\{[^}]*guided/i.test(shell), 'no navigation control is disabled by guided mode');
  ok('WS6-explore', /data-testid="explore-labs"/.test(screens), 'Home offers an explicit free-exploration entry point');
  ok('WS6-start', /data-testid="start-guided"/.test(screens), 'Home offers an explicit guided entry point');
  ok('WS6-no-bare-goto', !/Start here if you're new to QC/.test(screens), 'the bare unexplained "Start here" route change has been replaced');
  ok('WS6-no-account', !/localStorage\.setItem\([^)]*guided/i.test(shell), 'guided mode persists nothing and requires no account');

  console.log('\n=== WS7: level selector unchanged ===');
  ok('WS7-levels', /LEVELS/.test(screens) && /not separate courses/i.test(screens), 'level explanation text preserved verbatim');
  ok('WS7-no-gate', !/guided.*level|level.*guided/i.test(fs.readFileSync(path.join(V09, 'app', 'ui', 'guided-path.js'), 'utf8')), 'guided content is level-independent and compatible with all four levels');

  const total = passed + failed;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Guided Learning Governance: ${passed}/${total} passed, ${failed} failed`);
  if (failed > 0) { console.error('GUIDED LEARNING TESTS FAILED.'); process.exit(1); }
  console.log('ALL GUIDED LEARNING TESTS PASSED.');
}
main().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
