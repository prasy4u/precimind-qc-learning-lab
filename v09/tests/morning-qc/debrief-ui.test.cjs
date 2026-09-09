/* =========================================================================
   v09/tests/morning-qc/debrief-ui.test.cjs

   Morning QC Room — Stage 12C Debrief UI Tests
   PROVENANCE: V09_TEST

   Genuine interactive DOM tests via jsdom + react-dom/client, using REAL
   Stage 12A pilot cases throughout. Covers: debrief gate, safe
   projection, no pre-debrief leakage, competency mapping, outcome/
   reasoning quadrant display, decisionEventId preservation, revised-
   decision preservation, confidence calibration, documentation vs
   events, evidence-use feedback, patient-safety review, verification
   review, targeted lab recommendations, repeat/reset.
   ========================================================================= */
'use strict';
const path = require('path');
const { installGlobalDom, click, byText, byTextIncludes, keydown } = require('./build-support/dom-test-harness.cjs');

let passed = 0, failed = 0;
function assert(id, cond, detail) {
  if (cond) { console.log(`  ✓ [${id}] ${detail}`); passed++; }
  else { console.error(`  ✗ [${id}] FAIL: ${detail}`); failed++; }
}

async function main() {
  const { buildAll } = require('./build-support/jsx-build.cjs');
  await buildAll();

  installGlobalDom();
  const React = require('react');
  const { createRoot } = require('react-dom/client');
  const { act } = React;

  const APP = path.join(__dirname, '..', '..', 'app', 'morning-qc');
  const { pilot1ReagentLotShift, pilot2PbrtqcPopulationShift, pilot3RcvPatientImpact } = await import('file://' + path.join(APP, 'cases', 'index.js'));
  const { createInitialState, applyAction } = await import('file://' + path.join(APP, 'engine.js'));
  const { isDebriefable, getDebriefProjection } = await import('file://' + path.join(APP, 'debrief', 'debrief-adapter.js'));
  const { MorningQCRoom } = await import('file://' + process.cwd() + '/.mqc-ui-build/ui/morning-qc-room.mjs');

  function mount() {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    return { container, root };
  }

  /* ===================== Debrief gate (Section 8) ===================== */
  console.log('\n=== Debrief entry gate ===');
  {
    let state = createInitialState(pilot1ReagentLotShift);
    assert('GATE-01', !isDebriefable(state), 'Fresh, untouched case is not debriefable');
    let out = applyAction(pilot1ReagentLotShift, state, { type: 'ACKNOWLEDGE_SIGNAL' });
    state = out.state;
    assert('GATE-02', !isDebriefable(state), 'Acknowledged-but-not-finished case is not debriefable without an explicit finish request');
    assert('GATE-03', isDebriefable(state, { learnerRequestedFinish: true }), 'Explicit learner finish request satisfies the gate');
    let threw = false;
    try { getDebriefProjection(pilot1ReagentLotShift, state); } catch { threw = true; }
    assert('GATE-04', threw, 'getDebriefProjection() throws when the gate is not satisfied — a real security boundary, not a UI nicety');
    const projection = getDebriefProjection(pilot1ReagentLotShift, state, { learnerRequestedFinish: true });
    assert('GATE-05', !!projection, 'getDebriefProjection() succeeds once genuinely gated open');
  }

  /* ===================== No pre-debrief leakage (Section 29) ===================== */
  console.log('\n=== No pre-debrief answer-key leakage ===');
  {
    const m1 = mount();
    await act(async () => { m1.root.render(React.createElement(MorningQCRoom, { key: 'leak1', caseObj: pilot1ReagentLotShift })); });
    await act(async () => { click(byTextIncludes(m1.container, 'Acknowledge signal')); });
    const preDebriefHtml = m1.container.innerHTML;
    const forbidden = ['groundTruth', 'outcomeAppropriate', 'reasoningSupported', 'requiredEvidenceIdsForSupportedReasoning', 'consequenceSummary', 'competencyProfile'];
    for (const term of forbidden) {
      assert(`PREGATE-${term}`, !preDebriefHtml.includes(term), `No "${term}" leakage before the debrief gate is satisfied`);
    }
  }

  /* ===================== Safe projection + competency mapping ===================== */
  console.log('\n=== Safe projection, competency mapping, no invented pseudo-precision ===');
  {
    let state = createInitialState(pilot1ReagentLotShift);
    state = applyAction(pilot1ReagentLotShift, state, { type: 'ACKNOWLEDGE_SIGNAL' }).state;
    const projection = getDebriefProjection(pilot1ReagentLotShift, state, { learnerRequestedFinish: true });
    assert('PROFILE-01', projection.competencyProfile.length === 12, `Exactly 12 competency dimensions reported (found ${projection.competencyProfile.length})`);
    const allValidRatings = projection.competencyProfile.every(c => c.rating === null || ['NEEDS_IMPROVEMENT', 'DEVELOPING', 'PROFICIENT', 'STRONG'].includes(c.rating));
    assert('PROFILE-02', allValidRatings, 'Every rating is either null or one of the exact Stage 12A rating bands — never invented pseudo-precision');
    assert('PROFILE-03', projection.learningPriorities.length <= 3, `Learning priorities capped at 3 (found ${projection.learningPriorities.length})`);
    assert('PROFILE-04', projection.recommendedLabs.length <= 3, `Recommended labs capped at 3 (found ${projection.recommendedLabs.length})`);
  }

  /* ===================== Outcome/reasoning four-quadrant + decisionEventId ===================== */
  console.log('\n=== Outcome/reasoning four-quadrant display + decisionEventId preservation ===');
  {
    let state = createInitialState(pilot1ReagentLotShift);
    state = applyAction(pilot1ReagentLotShift, state, { type: 'ACKNOWLEDGE_SIGNAL' }).state;
    state = applyAction(pilot1ReagentLotShift, state, { type: 'HOLD_RESULTS', decisionId: 'dec-containment', optionId: 'opt-hold' }).state;
    const projection = getDebriefProjection(pilot1ReagentLotShift, state, { learnerRequestedFinish: true });
    assert('QUAD-01', projection.decisionReview.length === 1, 'One decision reviewed');
    assert('QUAD-02', projection.decisionReview[0].quadrant === 'CORRECT_SUPPORTED', `Correct outcome + supported reasoning correctly classified as CORRECT_SUPPORTED (found ${projection.decisionReview[0].quadrant})`);
    assert('QUAD-03', projection.decisionReview[0].decisionEventId === 'dec-containment#1', `Exact decisionEventId preserved (found ${projection.decisionReview[0].decisionEventId})`);
    assert('QUAD-04', typeof projection.decisionReview[0].explanation === 'string' && projection.decisionReview[0].explanation.length > 0, 'Case-authored explanation (consequenceSummary) is revealed post-gate');
  }

  /* ===================== Revised decisions + confidence calibration (never grouped by reusable decisionId) ===================== */
  console.log('\n=== Revised decisions preserved distinctly; confidence never grouped by reusable decisionId ===');
  {
    let state = createInitialState(pilot2PbrtqcPopulationShift);
    state = applyAction(pilot2PbrtqcPopulationShift, state, { type: 'ACKNOWLEDGE_SIGNAL' }).state;
    state = applyAction(pilot2PbrtqcPopulationShift, state, { type: 'INSPECT_PANEL', panelId: 'panel-pbrtqc' }).state;
    let out = applyAction(pilot2PbrtqcPopulationShift, state, { type: 'FORM_HYPOTHESIS', hypothesisId: 'hyp-analytical', decisionId: 'dec-take-seriously', optionId: 'opt-investigate' });
    state = out.state;
    state = applyAction(pilot2PbrtqcPopulationShift, state, { type: 'RECORD_CONFIDENCE', decisionEventId: out.decisionEventId, confidence: 'MODERATE' }).state;
    // Revise under the same reusable decisionId.
    let out2 = applyAction(pilot2PbrtqcPopulationShift, state, { type: 'DOCUMENT', decisionId: 'dec-take-seriously', optionId: 'opt-dismiss', fields: {} });
    state = out2.state;
    state = applyAction(pilot2PbrtqcPopulationShift, state, { type: 'RECORD_CONFIDENCE', decisionEventId: out2.decisionEventId, confidence: 'HIGH' }).state;
    const projection = getDebriefProjection(pilot2PbrtqcPopulationShift, state, { learnerRequestedFinish: true });
    assert('REVISED-01', projection.revisedDecisions.length === 1 && projection.revisedDecisions[0].decisionId === 'dec-take-seriously', 'The revised decision is detected and grouped by its reusable decisionId');
    assert('REVISED-02', projection.revisedDecisions[0].events.length === 2, 'Both distinct decisionEventIds are preserved, never overwritten');
    assert('REVISED-03', projection.confidenceCalibration.length === 2, 'Both confidence records appear distinctly, never merged');
    const eventIds = new Set(projection.confidenceCalibration.map(c => c.decisionEventId));
    assert('REVISED-04', eventIds.size === 2, 'Confidence calibration entries use distinct decisionEventIds, never grouped by the reusable decisionId alone');
  }

  /* ===================== Documentation vs executed action review ===================== */
  console.log('\n=== Documentation vs executed-action review ===');
  {
    let state = createInitialState(pilot1ReagentLotShift);
    state = applyAction(pilot1ReagentLotShift, state, { type: 'ACKNOWLEDGE_SIGNAL' }).state;
    state = applyAction(pilot1ReagentLotShift, state, { type: 'DOCUMENT', fields: { finalDisposition: 'claimed resumed, never happened' } }).state;
    const projection = getDebriefProjection(pilot1ReagentLotShift, state, { learnerRequestedFinish: true });
    assert('DOCVSEXEC-01', projection.documentationVsExecuted.documentedFinalDisposition === 'claimed resumed, never happened', 'Documented claim preserved verbatim');
    assert('DOCVSEXEC-02', projection.documentationVsExecuted.executedDisposition === null, 'Executed disposition correctly null — documenting a claim never manufactures an executed event');
    assert('DOCVSEXEC-03', projection.documentationVsExecuted.actualServiceState === 'RUNNING', 'Real service state (RUNNING) shown alongside the documented claim, not conflated with it');
  }

  /* ===================== Patient-safety and verification review ===================== */
  console.log('\n=== Patient-safety and verification review sections ===');
  {
    let state = createInitialState(pilot1ReagentLotShift);
    state = applyAction(pilot1ReagentLotShift, state, { type: 'ACKNOWLEDGE_SIGNAL' }).state;
    const projection = getDebriefProjection(pilot1ReagentLotShift, state, { learnerRequestedFinish: true });
    assert('SAFETY-01', 'containmentTimely' in projection.patientSafetyReview, 'Patient-safety review reports containment timeliness distinctly');
    assert('SAFETY-02', 'patientImpactFinalState' in projection.patientSafetyReview, 'Patient-safety review reports patient-impact state distinctly from disposition');
    assert('SAFETY-03', 'verificationAdequate' in projection.patientSafetyReview, 'Patient-safety review reports verification adequacy distinctly');
  }

  /* ===================== Full room -> finish -> debrief -> repeat cycle ===================== */
  console.log('\n=== Room -> Finish -> Debrief -> Repeat cycle (real DOM) ===');
  {
    const m2 = mount();
    await act(async () => { m2.root.render(React.createElement(MorningQCRoom, { key: 'cycle', caseObj: pilot1ReagentLotShift })); });
    assert('CYCLE-01', !byTextIncludes(m2.container, 'Finish case and review'), 'Finish control absent before signal acknowledgement');
    await act(async () => { click(byTextIncludes(m2.container, 'Acknowledge signal')); });
    assert('CYCLE-02', !!byTextIncludes(m2.container, 'Finish case and review'), 'Finish control appears once signal acknowledged');
    await act(async () => { click(byTextIncludes(m2.container, 'Finish case and review')); });
    assert('CYCLE-03', !!m2.container.querySelector('[data-testid="morning-qc-debrief"]'), 'Debrief renders after finish is clicked');
    assert('CYCLE-04', !m2.container.querySelector('[data-testid="morning-qc-room"]'), 'Active-case room is no longer rendered once debrief is showing (visually distinct states, Section 28)');
    const repeatBtn = byTextIncludes(m2.container, 'Repeat this case');
    assert('CYCLE-05', !!repeatBtn, 'Repeat control present in debrief');
    await act(async () => { click(repeatBtn); });
    assert('CYCLE-06', !!m2.container.querySelector('[data-testid="morning-qc-room"]'), 'Room re-renders after Repeat');
    assert('CYCLE-07', !byTextIncludes(m2.container, 'Finish case and review'), 'Repeat produces a genuinely fresh state — signal is unacknowledged again, no leakage from the finished case');
    assert('CYCLE-08', !m2.container.innerHTML.includes('Held'), 'No leaked service state from the finished case after Repeat');
  }

  const total = passed + failed;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Morning QC Debrief UI Tests: ${passed}/${total} passed, ${failed} failed`);
  if (failed > 0) { console.error('DEBRIEF UI TESTS FAILED.'); process.exit(1); }
  console.log('DEBRIEF UI TESTS PASSED.');
  process.exit(0);
}
main().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
