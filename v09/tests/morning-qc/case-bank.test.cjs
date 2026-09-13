/* =========================================================================
   v09/tests/morning-qc/case-bank.test.cjs

   Morning QC Room — Stage 12D Case Bank Tests
   PROVENANCE: V09_TEST

   Verifies: all 12 cases validate, unique IDs, family coverage, metadata
   completeness, neutral learner titles, no root-cause leakage, expert
   path availability, no dangling references, valid competency targets.
   ========================================================================= */
'use strict';
const path = require('path');
const fs = require('fs');

let passed = 0, failed = 0;
function assert(id, cond, detail) {
  if (cond) { console.log(`  ✓ [${id}] ${detail}`); passed++; }
  else { console.error(`  ✗ [${id}] FAIL: ${detail}`); failed++; }
}

const MQC = path.join(__dirname, '..', '..', 'app', 'morning-qc');

// Production-facing neutral title map (must be kept in sync with
// production-case-select.jsx's own PRODUCTION_CASE_META — this test
// re-derives its own check rather than importing the UI's private map,
// so it independently proves the doctrine rather than merely asserting
// the UI agrees with itself).
const ANSWER_KEY_LEAK_TERMS = ['Case-Mix', 'Calibration Shift', 'Imprecision', 'EQA Discordance', 'Maintenance Coincidence', 'Premature-Release'];

async function main() {
  const { validateCase } = await import('file://' + path.join(MQC, 'case-validator.js'));
  const { ALL_CASES } = await import('file://' + path.join(MQC, 'cases', 'index.js'));
  const { SCORING_DIMENSIONS } = await import('file://' + path.join(MQC, 'states.js'));
  const { createInitialState, applyAction } = await import('file://' + path.join(MQC, 'engine.js'));

  console.log('\n=== Case bank size and validation ===');
  assert('BANK-01', ALL_CASES.length === 12, `Exactly 12 production cases (found ${ALL_CASES.length})`);
  for (const c of ALL_CASES) {
    const r = validateCase(c);
    assert(`BANK-VALID-${c.identity.id}`, r.valid, `${c.identity.id} validates (errors: ${JSON.stringify(r.errors)})`);
  }

  console.log('\n=== Unique IDs across the whole bank ===');
  {
    const caseIds = ALL_CASES.map(c => c.identity.id);
    assert('BANK-02', new Set(caseIds).size === caseIds.length, 'All case IDs are unique');
    for (const c of ALL_CASES) {
      const panelIds = (c.panels || []).map(p => p.id);
      const evidenceIds = (c.evidence || []).map(e => e.id);
      const hypothesisIds = (c.hypotheses || []).map(h => h.id);
      const decisionIds = (c.decisionOpportunities || []).map(d => d.id);
      assert(`BANK-UNIQ-PANEL-${c.identity.id}`, new Set(panelIds).size === panelIds.length, `${c.identity.id}: unique panel IDs`);
      assert(`BANK-UNIQ-EVID-${c.identity.id}`, new Set(evidenceIds).size === evidenceIds.length, `${c.identity.id}: unique evidence IDs`);
      assert(`BANK-UNIQ-HYP-${c.identity.id}`, new Set(hypothesisIds).size === hypothesisIds.length, `${c.identity.id}: unique hypothesis IDs`);
      assert(`BANK-UNIQ-DEC-${c.identity.id}`, new Set(decisionIds).size === decisionIds.length, `${c.identity.id}: unique decision IDs`);
    }
  }

  console.log('\n=== No dangling references ===');
  for (const c of ALL_CASES) {
    const panelIds = new Set((c.panels || []).map(p => p.id));
    const hypothesisIds = new Set((c.hypotheses || []).map(h => h.id));
    let ok = true;
    for (const ev of c.evidence || []) {
      if (ev.sourcePanelId != null && !panelIds.has(ev.sourcePanelId)) { ok = false; console.error(`    ${c.identity.id}: evidence ${ev.id} references missing panel ${ev.sourcePanelId}`); }
      for (const h of [...(ev.supportsHypothesisIds || []), ...(ev.weakensHypothesisIds || [])]) {
        if (!hypothesisIds.has(h)) { ok = false; console.error(`    ${c.identity.id}: evidence ${ev.id} references missing hypothesis ${h}`); }
      }
    }
    for (const gtEv of (c.groundTruth?.evidenceForHypotheses || [])) {
      if (!hypothesisIds.has(gtEv.hypothesisId)) { ok = false; console.error(`    ${c.identity.id}: groundTruth references missing hypothesis ${gtEv.hypothesisId}`); }
    }
    assert(`BANK-DANGLE-${c.identity.id}`, ok, `${c.identity.id}: no dangling panel/hypothesis references from evidence or groundTruth`);
  }

  console.log('\n=== Family coverage (Section 6) ===');
  {
    const families = new Set(ALL_CASES.map(c => c.identity.caseFamily));
    assert('BANK-03', families.size >= 9, `At least 9 distinct case families represented (found ${families.size}: ${[...families].join(', ')})`);
  }

  console.log('\n=== Difficulty distribution ===');
  {
    const difficulties = ALL_CASES.map(c => c.identity.difficulty);
    const distinctLevels = new Set(difficulties);
    assert('BANK-04', distinctLevels.size >= 3, `At least 3 distinct difficulty levels represented (found ${distinctLevels.size})`);
  }

  console.log('\n=== Curriculum metadata completeness (all 12 cases, Section 8 corrective closure) ===');
  {
    const newCases = ALL_CASES.filter(c => c.identity.curriculum);
    // Stage 12D corrective closure (Section 8): the 3 original pilots now
    // also carry metadata-only curriculum additions (competencyTargets
    // etc.) so the adaptive recommender can genuinely match weak
    // competencies across the FULL case bank, not merely the 9 new cases.
    assert('BANK-05', newCases.length === 12, `All 12 cases carry curriculum metadata, including the 3 pilots' metadata-only additions (found ${newCases.length})`);
    for (const c of newCases) {
      const cur = c.identity.curriculum;
      assert(`BANK-CURR-${c.identity.id}`, typeof cur.estimatedMinutes === 'number' && Array.isArray(cur.tags) && typeof cur.sequencingGroup === 'string' && Array.isArray(cur.prerequisiteCompetencies) && Array.isArray(cur.competencyTargets), `${c.identity.id}: curriculum metadata is complete, including competencyTargets`);
      for (const dim of cur.prerequisiteCompetencies) {
        assert(`BANK-CURR-DIM-${c.identity.id}-${dim}`, SCORING_DIMENSIONS.includes(dim), `${c.identity.id}: prerequisite competency "${dim}" is a real SCORING_DIMENSIONS entry`);
      }
      for (const dim of cur.competencyTargets) {
        assert(`BANK-CURR-TARGET-${c.identity.id}-${dim}`, SCORING_DIMENSIONS.includes(dim), `${c.identity.id}: competency target "${dim}" is a real SCORING_DIMENSIONS entry`);
      }
    }
  }

  console.log('\n=== Competency targets valid ===');
  for (const c of ALL_CASES) {
    const targets = c.identity.competencyMapping || [];
    assert(`BANK-COMPETENCY-${c.identity.id}`, Array.isArray(targets) && targets.length > 0, `${c.identity.id}: has at least one competency mapping target`);
  }

  console.log('\n=== No hidden instructor data reaches the learner projection ===');
  {
    const { getDebriefProjection } = await import('file://' + path.join(MQC, 'debrief', 'debrief-adapter.js'));
    for (const c of ALL_CASES.filter(c => c.identity.instructor)) {
      let state = createInitialState(c);
      state = applyAction(c, state, { type: 'ACKNOWLEDGE_SIGNAL' }).state;
      const projection = getDebriefProjection(c, state, { learnerRequestedFinish: true });
      const projectionStr = JSON.stringify(projection);
      const instructorStr = JSON.stringify(c.identity.instructor);
      const leaked = c.identity.instructor.teachingPoints.some(tp => projectionStr.includes(tp)) || c.identity.instructor.commonFailureModes.some(cf => projectionStr.includes(cf));
      assert(`BANK-NOINSTRUCTOR-${c.identity.id}`, !leaked, `${c.identity.id}: instructor-only teachingPoints/commonFailureModes never appear in the learner debrief projection`);
    }
  }

  console.log('\n=== Redundancy audit (Section 17) ===');
  {
    // No two cases should share an identical (caseFamily, rootCauseDescription) pair.
    const signatures = ALL_CASES.map(c => `${c.identity.caseFamily}::${c.groundTruth.rootCauseDescription || c.groundTruth.signalExplanationDescription || ''}`);
    assert('BANK-06', new Set(signatures).size === signatures.length, 'No two cases share an identical family+root-cause/explanation signature');
  }

  console.log('\n=== Neutral production titles (Section 19/26/27) — checked against the actual production UI map ===');
  {
    const prodSelectSrc = fs.readFileSync(path.join(MQC, 'ui', 'production-case-select.jsx'), 'utf8');
    for (const c of ALL_CASES) {
      const idInMap = prodSelectSrc.includes(`'${c.identity.id}'`);
      assert(`BANK-TITLE-MAPPED-${c.identity.id}`, idInMap, `${c.identity.id} has a dedicated neutral production title entry`);
    }
    for (const term of ANSWER_KEY_LEAK_TERMS) {
      const displayTitleBlock = prodSelectSrc.match(/displayTitle:\s*'([^']*)'/g) || [];
      const leaked = displayTitleBlock.some(t => t.includes(term));
      assert(`BANK-NOLEAK-${term.replace(/\s+/g, '_')}`, !leaked, `Production display titles never contain the answer-revealing term "${term}"`);
    }
  }

  console.log('\n=== Full 12-case title-leakage semantic audit (Section 2 corrective closure) ===');
  {
    const prodSelectSrc = fs.readFileSync(path.join(MQC, 'ui', 'production-case-select.jsx'), 'utf8');
    const titleMatches = [...prodSelectSrc.matchAll(/'([a-z0-9-]+)':\s*\{\s*displayTitle:\s*'([^']*)'/g)];
    const titleMap = Object.fromEntries(titleMatches.map(m => [m[1], m[2]]));
    assert('TITLE-AUDIT-COVERAGE', Object.keys(titleMap).length === 12, `All 12 cases have a mapped production title (found ${Object.keys(titleMap).length})`);

    // A title is only genuinely leaking a CONCLUSION (not merely
    // mentioning an OBSERVABLE topic/component the learner sees
    // immediately anyway, e.g. "calibration" or "reagent lot" as case
    // subject matter) if it echoes a substantial MULTI-WORD PHRASE (3+
    // consecutive significant words) from an authored hypothesis label,
    // intervention-option label, or groundTruth field — a much more
    // precise signal than single-word topical overlap, which produced
    // many false positives on benign subject-matter words shared
    // between a case's title and its own (fully expected) topic.
    function normalize(text) {
      return (text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    }
    function hasSharedPhrase(title, sourceText, minWords) {
      const titleWords = normalize(title).split(' ').filter(Boolean);
      const sourceWords = normalize(sourceText).split(' ').filter(Boolean);
      if (sourceWords.length < minWords) return false;
      for (let i = 0; i <= sourceWords.length - minWords; i++) {
        const phrase = sourceWords.slice(i, i + minWords).join(' ');
        if (normalize(title).includes(phrase)) return true;
      }
      return false;
    }

    for (const c of ALL_CASES) {
      const title = titleMap[c.identity.id];
      if (!title) continue;

      const hypothesisLabels = (c.hypotheses || []).map(h => h.label);
      const hypLeak = hypothesisLabels.some(label => hasSharedPhrase(title, label, 3));
      assert(`TITLE-NOHYP-${c.identity.id}`, !hypLeak, `${c.identity.id}: title does not share a 3+ word phrase with any authored hypothesis label`);

      const interventionLabels = (c.decisionOpportunities || [])
        .filter(d => d.category === 'INTERVENTION')
        .flatMap(d => d.options.map(o => o.label));
      const intLeak = interventionLabels.some(label => hasSharedPhrase(title, label, 3));
      assert(`TITLE-NOINTERVENTION-${c.identity.id}`, !intLeak, `${c.identity.id}: title does not share a 3+ word phrase with any authored intervention-option label`);

      const gtFields = [c.groundTruth.rootCauseDescription, c.groundTruth.signalExplanationDescription];
      const gtLeak = gtFields.some(field => field && hasSharedPhrase(title, field, 3));
      assert(`TITLE-NOGROUNDTRUTH-${c.identity.id}`, !gtLeak, `${c.identity.id}: title does not share a 3+ word phrase with any authored groundTruth root-cause/explanation field`);

      // Verification-outcome / future-event leakage: words implying a
      // resolution already known should never appear in a title — these
      // presuppose an outcome the learner has not yet reached.
      const OUTCOME_PRESUPPOSING_WORDS = ['brief', 'resolved', 'transient', 'ambiguous', 'confirmed', 'successful', 'failed', 'persists', 'recovers', 'benign', 'harmless', 'inadequate', 'adequate'];
      const outcomeLeak = OUTCOME_PRESUPPOSING_WORDS.filter(w => title.toLowerCase().includes(w));
      assert(`TITLE-NOOUTCOME-${c.identity.id}`, outcomeLeak.length === 0, `${c.identity.id}: title contains no outcome-presupposing word (found: ${JSON.stringify(outcomeLeak)})`);
    }
  }

  const total = passed + failed;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Case Bank Tests: ${passed}/${total} passed, ${failed} failed`);
  if (failed > 0) { console.error('CASE BANK TESTS FAILED.'); process.exit(1); }
  console.log('CASE BANK TESTS PASSED.');
  process.exit(0);
}
main().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
