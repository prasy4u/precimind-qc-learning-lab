/* =========================================================================
   v09/app/morning-qc/ui/ui-adapter.js

   Morning QC Room — Stage 12B Engine Adapter
   PROVENANCE: V09_NEW

   The ONLY bridge between React and the Stage 12A engine. This module
   contains ZERO scientific/simulation rules of its own — every
   availability, safety, and correctness decision is delegated to
   Stage 12A's engine.js, case-validator.js, decision-model.js,
   evidence-model.js, scoring-model.js, and debrief-model.js.

   Section 6 contract: the adapter may INITIALIZE, DISPATCH, and EXPOSE
   engine state. It must NEVER independently decide whether a panel,
   evidence item, or decision is available/safe/correct — those
   predicates are either read directly from engine-exported pure
   functions (createInitialState, applyAction, deriveUnlockedPhaseIndex,
   canReturnToPhase) or derived from PUBLIC engine STATE FIELDS that the
   engine itself already treats as authoritative (inspectedPanelIds,
   obtainedEvidenceIds, actionHistory, systemEvents, serviceState,
   patientImpactState, verificationAttempts). Any residual imprecision in
   this adapter's convenience filtering can NEVER cause a forgery or
   leak, because every dispatch() call still goes through the real,
   unmodified engine.applyAction() — which remains the sole authority
   and will reject anything illegitimate regardless of what this adapter
   "thought" was available (Section 16: "Engine rejection remains
   authoritative").

   LEAKAGE DISCIPLINE (Section 33): getViewModel() below NEVER exposes
   groundTruth, decisive, severity, outcomeAppropriate, reasoningSupported,
   decisionCategory's authored consequenceSummary (the answer-key text),
   or requiredEvidenceIdsForSupportedReasoning during active play. These
   fields are only surfaced via getDeveloperDebriefPreview(), an
   explicitly-labeled developer/test tool (Section 25), never through the
   learner-facing view model.
   ========================================================================= */

import { createInitialState, applyAction, deriveUnlockedPhaseIndex } from '../engine.js';
import { SIMULATION_PHASES } from '../states.js';
import { generateDebrief } from '../debrief-model.js';

function phaseIndex(name) {
  return SIMULATION_PHASES.indexOf(name);
}

/**
 * Creates a fresh room controller for a given Stage 12A case object.
 * Holds the single authoritative engine state; every mutation flows
 * through engine.applyAction(). Returns a controller object, not a
 * React hook, so it can be tested and reasoned about independent of React.
 */
export function createRoomController(caseObj) {
  let state = createInitialState(caseObj);
  let lastError = null;
  let lastOutcome = null;

  function dispatch(action) {
    const outcome = applyAction(caseObj, state, action);
    lastOutcome = outcome;
    if (outcome.error) {
      lastError = outcome.error;
      // State intentionally NOT advanced — engine already guarantees no
      // mutation occurred on a rejected action (see engine.js's pure-
      // function contract, verified in Stage 12A's progression-invariant
      // suite: UNCHANGED-01/02).
      return outcome;
    }
    lastError = null;
    state = outcome.state;
    return outcome;
  }

  function getRawState() {
    return state;
  }

  function reset() {
    // Section 35: switching cases must produce a COMPLETELY fresh engine
    // state. Re-invoking createInitialState(caseObj) guarantees this —
    // no field here is carried over by hand.
    state = createInitialState(caseObj);
    lastError = null;
    lastOutcome = null;
  }

  return {
    dispatch,
    getRawState,
    getViewModel: () => buildViewModel(caseObj, state),
    getLastError: () => lastError,
    getLastOutcome: () => lastOutcome,
    getDeveloperDebriefPreview: () => generateDebrief(caseObj, state),
    reset,
  };
}

/**
 * Reconstructs a controller's state via deterministic replay — a
 * developer/test helper (Section 36) proving the UI-visible state is
 * fully reproducible from case + action history. Not exposed to learners.
 */
export function replayToViewModel(caseObj, actionHistory) {
  let state = createInitialState(caseObj);
  for (const action of actionHistory) {
    const outcome = applyAction(caseObj, state, action);
    if (outcome.error) break;
    state = outcome.state;
  }
  return buildViewModel(caseObj, state);
}

/* -----------------------------------------------------------------------
   VIEW MODEL CONSTRUCTION — the learner-facing projection of engine state.
   Every predicate below either calls an engine-exported function directly
   or reads a public engine state field the engine itself treats as
   authoritative. No independent judgment is made about availability,
   safety, or correctness.
   ----------------------------------------------------------------------- */
function buildViewModel(caseObj, state) {
  const unlockedIdx = deriveUnlockedPhaseIndex(state);

  const panels = (caseObj.panels || []).map(p => ({
    id: p.id,
    type: p.type,
    // Availability read directly from the engine's own exported
    // progression-authority function — never inferred from narrative
    // phase, visual position, or score (Section 11).
    available: unlockedIdx >= phaseIndex(p.availableFromPhase),
    inspected: state.inspectedPanelIds.includes(p.id),
    costTimeMinutes: p.costTimeMinutes || 0,
    // Content is exposed ONLY for genuinely-inspected panels — never
    // preview-able before the learner has actually spent the action to
    // inspect it, even if it happens to already be "available". This is
    // deliberately conservative: content is the informational payload a
    // panel exists to deliver, so it must never leak ahead of the
    // learner's own INSPECT_PANEL dispatch. `relevance` and any other
    // case-authored answer-key field are never included here.
    //
    // Semantic leakage discipline (Stage 12B corrective closure): when a
    // panel authors an optional `content.learnerNote` (the purely-
    // factual, non-interpretive projection — see case-schema.js), ONLY
    // that projection is exposed here — `content.note` (which may
    // legitimately embed author/debrief-level interpretation not meant
    // for the learner mid-case) is never sent to the client at all in
    // that case, not merely "sent but unrendered". When no learnerNote
    // is authored, `note` itself is exposed unchanged (fully
    // backward-compatible with every panel that has no interpretation
    // to strip).
    content: state.inspectedPanelIds.includes(p.id)
      ? (p.content ? {
          note: p.content.learnerNote || p.content.note || null,
          // Structured series data (points/series), when a future case
          // provides it, is factual/numeric rather than interpretive
          // prose — passed through unchanged for panel-renderers/index.js
          // to route to a real chart primitive. No current pilot
          // provides this (verified during Stage 12B); nothing is
          // fabricated here.
          points: Array.isArray(p.content.points) ? p.content.points : undefined,
          series: Array.isArray(p.content.series) ? p.content.series : undefined,
        } : null)
      : null,
    provenance: state.inspectedPanelIds.includes(p.id) ? (p.provenance || null) : null,
  }));

  // Evidence tray (Section 19): ONLY genuinely obtained evidence, and
  // only the fields explicitly sanctioned as learner-facing. decisive,
  // relevant, supportsHypothesisIds/weakensHypothesisIds, and
  // interpretationLimits are case-authored ANSWER-KEY fields and are
  // never exposed here.
  const obtainedEvidence = (caseObj.evidence || [])
    .filter(e => state.obtainedEvidenceIds.includes(e.id))
    .map(e => ({ id: e.id, source: e.source, timestamp: e.timestamp, finding: e.observedValueOrFinding }));

  // Evidence a REQUEST_EVIDENCE dispatch is LIKELY to succeed for — a
  // pure UX convenience, not a security boundary (see module header).
  // Computed from the exact two public gating facts the schema defines
  // (sourcePanelId inspected; availableOnlyAfterActionType occurred),
  // mirroring — never reimplementing independently of — the engine's
  // own two-part rule. Any mismatch is safely caught by dispatch()
  // rejection.
  const requestableEvidence = (caseObj.evidence || [])
    .filter(e => !state.obtainedEvidenceIds.includes(e.id))
    .filter(e => {
      const panelOk = e.sourcePanelId == null || state.inspectedPanelIds.includes(e.sourcePanelId);
      const actionOk = e.availableOnlyAfterActionType == null || state.actionHistory.some(h => h.type === e.availableOnlyAfterActionType);
      return panelOk && actionOk;
    })
    .map(e => ({ id: e.id, source: e.source }));

  // Hypotheses genuinely considered by the LEARNER (systemEvents, not
  // documentation — the same engine-owned authority deriveUnlockedPhaseIndex
  // itself consults; Section 18: never show ESTABLISHED CAUSE unless
  // legitimately arisen through learner evidence processing, so the
  // learner-visible state IS the real hypothesisStates value, whatever
  // it legitimately is).
  const hypotheses = (caseObj.hypotheses || [])
    .filter(h => state.systemEvents.hypothesesFormed.includes(h.id))
    .map(h => ({ id: h.id, label: h.label, state: state.hypothesisStates[h.id] }));

  const formableHypotheses = (caseObj.hypotheses || [])
    .filter(h => !state.systemEvents.hypothesesFormed.includes(h.id))
    .map(h => ({ id: h.id, label: h.label }));

  // Decision opportunities currently attemptable — availableFromPhase
  // compared against the SAME unlockedIdx the engine itself will check
  // at dispatch time. Options expose ONLY id/label/actionType — NEVER
  // severity, outcomeAppropriate, requiredEvidenceIdsForSupportedReasoning,
  // or consequenceSummary (which is case-authored answer-key text —
  // e.g. Pilot 2's opt-investigate: "Correct — PBRTQC can detect
  // signals IQC misses..." — and must never appear before the learner
  // has chosen).
  const availableDecisions = (caseObj.decisionOpportunities || [])
    .filter(d => unlockedIdx >= phaseIndex(d.availableFromPhase))
    .map(d => ({
      id: d.id,
      category: d.category,
      availableFromPhase: d.availableFromPhase,
      options: (d.options || []).map(o => ({ id: o.id, label: o.label, actionType: o.actionType })),
    }));

  // Learner-facing action history: WHAT happened, never the hidden
  // correctness metadata (severity/outcomeAppropriate/reasoningSupported/
  // note — note frequently contains answer-adjacent hints such as
  // "Verification attempted before required evidence was obtained").
  const eventTimeline = state.actionHistory.map((h, i) => ({
    index: i,
    type: h.type,
    panelId: h.panelId ?? null,
    evidenceId: h.evidenceId ?? null,
    hypothesisId: h.hypothesisId ?? null,
    targetState: h.targetState ?? null,
    decisionId: h.decisionId ?? null,
    optionId: h.optionId ?? null,
  }));

  return {
    caseIdentity: caseObj.identity,
    labContext: caseObj.labContext,
    phase: state.phase, // narrative descriptor only — never used to gate the UI itself
    serviceState: state.serviceState,
    patientImpactState: state.patientImpactState,
    elapsedMinutes: state.elapsedMinutes,
    signalAcknowledged: state.documentation.signal != null,
    signalText: state.documentation.signal,
    panels,
    obtainedEvidence,
    requestableEvidence,
    hypotheses,
    formableHypotheses,
    availableDecisions,
    eventTimeline,
    confidenceRecords: state.confidenceRecords.map(r => ({ decisionEventId: r.decisionEventId, confidence: r.confidence })),
    documentation: {
      finalDisposition: state.documentation.finalDisposition,
      escalation: state.documentation.escalation,
      establishedCause: state.documentation.establishedCause,
    },
    lastVerification: state.verificationAttempts.length > 0
      ? { attempted: true, criteriaWereMet: state.verificationAttempts[state.verificationAttempts.length - 1].criteriaWereMet }
      : { attempted: false, criteriaWereMet: null },
    terminal: state.terminal,
  };
}
