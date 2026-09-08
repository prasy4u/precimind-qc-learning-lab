/* =========================================================================
   v09/app/morning-qc/engine.js

   Morning QC Room — Stage 12A Deterministic Simulation Engine
   PROVENANCE: V09_NEW
   Revised during the Stage 12A independent-audit FINAL ACCEPTANCE
   micro-closure (see V09_STAGE12A_REPORT.md for the full defect log).

   ACCEPTANCE-CLOSURE CHANGES:
     1. PROGRESSION AUTHORITY REDESIGNED. The prior model mutated
        maxPhaseIndexReached whenever an action's NOMINAL phase target was
        forward progress — meaning any action mapped to a "late" phase
        (DOCUMENT -> DOCUMENTATION, FORM_HYPOTHESIS -> HYPOTHESIS_GENERATION,
        REVIEW_PATIENT_IMPACT -> PATIENT_IMPACT_REVIEW) could unlock later
        panels merely by being CALLED, regardless of genuine investigative
        work. This is now replaced by deriveUnlockedPhaseIndex(state), a
        PURE function recomputed fresh every time from GENUINE, GENERIC
        STATE FACTS (signal acknowledged, a containment decision made, at
        least one panel inspected, at least one hypothesis formed, at
        least one evidence item obtained, an investigative repeat
        performed, an intervention documented, a verification attempted,
        service resumed/escalated) — NEVER from "an action of type X was
        called." DOCUMENT and REVIEW_PATIENT_IMPACT are DELIBERATELY
        EXCLUDED from these facts: they may execute as "limited
        administrative records" once the signal is acknowledged, but their
        execution NEVER unlocks anything further. `phase` remains a
        separate, purely NARRATIVE descriptor (still driven by the action
        that most recently occurred) — `maxPhaseIndexReached` (the sole
        GATING authority) is now cleanly independent of it, so one can
        never impersonate the other.
     2. Several previously-unguarded phase-advancing actions
        (FORM_HYPOTHESIS, REQUEST_EVIDENCE, APPLY_INTERVENTION,
        VERIFY_RECOVERY) now carry an explicit EXECUTION-TIME prerequisite
        against deriveUnlockedPhaseIndex — rejected outright (no state
        mutation) if the genuinely-unlocked progression has not yet
        reached the required tier. This is what prevents a single early
        action from ever retroactively "jumping" the monotonic unlock
        index past a tier it never genuinely earned.
     3. Executed case-authored decisions now receive a stable, deterministic
        decisionEventId (`${decisionId}#${occurrenceNumber}`, 1-indexed per
        distinct decisionId within this trace) — recorded on every
        decision-executing action-history entry alongside the reusable
        decisionId. RECORD_CONFIDENCE now references decisionEventId, not
        decisionId, so a learner who legitimately REVISES a decision (per
        the Room's REASSESS doctrine) and records new confidence is scored
        against the SPECIFIC (revised) decision event, never an earlier one.
     4. Duplicate confidence policy (latest replaces earlier) now applies
        per decisionEventId, not decisionId — a later confidence record for
        the SAME occurrence still replaces the earlier one; confidence for
        a DIFFERENT occurrence of the same decisionId is a distinct record.

   Core principle (unchanged): given a case definition + current state +
   action history, the resulting state is REPRODUCIBLE. Zero
   Math.random() or any nondeterministic source.
   ========================================================================= */

import {
  SIMULATION_PHASES, PHASE_ALLOWS_RETURN_TO, SERVICE_STATE_TRANSITIONS,
  PATIENT_IMPACT_TRANSITIONS, HYPOTHESIS_STATE_TRANSITIONS, ACTION_TYPES,
} from './states.js';

/* -----------------------------------------------------------------------
   INITIAL STATE
   ----------------------------------------------------------------------- */
export function createInitialState(caseObj) {
  const hypothesisStates = {};
  for (const h of caseObj.hypotheses || []) {
    hypothesisStates[h.id] = h.plausibleFromStart ? 'PLAUSIBLE' : 'NOT_CONSIDERED';
  }
  return {
    phase: 'BRIEFING', // narrative descriptor only — NEVER consulted for gating (see deriveUnlockedPhaseIndex)
    maxPhaseIndexReached: 0, // cached mirror of deriveUnlockedPhaseIndex(state); always recomputed, never incrementally mutated
    containmentDecided: false, // genuine milestone flag: a HOLD_RESULTS/CONTINUE_ANALYSIS action has executed
    serviceState: 'RUNNING',
    patientImpactState: 'NOT_INDICATED',
    hypothesisStates,
    inspectedPanelIds: [],
    obtainedEvidenceIds: [],
    actionHistory: [],
    elapsedMinutes: 0,
    confidenceRecords: [],
    documentation: {
      signal: null, containment: null, evidenceReviewed: [], hypothesesConsidered: [],
      investigationPerformed: [], establishedCause: null, intervention: null,
      verification: null, patientImpactAssessment: null, finalDisposition: null, escalation: null,
    },
    verificationAttempts: [],
    terminal: false, // Stage 12A Section 13: deferred to Stage 12B, permanently false here
  };
}

function deepCloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

function canTransition(table, from, to) {
  return Array.isArray(table[from]) && table[from].includes(to);
}

function phaseIndex(phaseName) {
  return SIMULATION_PHASES.indexOf(phaseName);
}

/* -----------------------------------------------------------------------
   PROGRESSION AUTHORITY (acceptance-closure fix #1)

   The SOLE source of truth for what is genuinely unlocked. Recomputed
   fresh from concrete state facts every time — never incrementally
   mutated based on an action's nominal phase target. DOCUMENT and
   REVIEW_PATIENT_IMPACT are deliberately NOT among the facts consulted:
   executing them is always allowed once the signal is acknowledged (as a
   limited administrative record), but never itself advances unlocked
   progression.
   ----------------------------------------------------------------------- */
export function deriveUnlockedPhaseIndex(state) {
  // Stage 12A PROGRESSION-INVARIANT closure: each tier is now
  // PREREQUISITE-QUALIFIED — a later milestone contributes to the
  // unlocked frontier ONLY when its own preceding context was
  // genuinely, legitimately satisfied. The prior model treated every
  // fact (signal, containment, panel, hypothesis, evidence, repeat,
  // intervention, verification-attempted) as INDEPENDENT, letting a
  // single out-of-order action (e.g. REPEAT_QC from a pristine state)
  // leapfrog straight to a late tier. This is now an explicit AND-chain,
  // documented per tier below.
  let idx = phaseIndex('BRIEFING');

  const signalAcked = state.documentation.signal != null;
  if (!signalAcked) return idx; // nothing beyond BRIEFING is reachable without a genuinely acknowledged signal

  idx = Math.max(idx, phaseIndex('SIGNAL_RECOGNITION'));

  // IMMEDIATE_CONTAINMENT requires signal acknowledgement (already true
  // here) plus a genuine containment decision (HOLD_RESULTS/CONTINUE_ANALYSIS).
  const containmentReached = state.containmentDecided;
  if (containmentReached) idx = Math.max(idx, phaseIndex('IMMEDIATE_CONTAINMENT'));

  // CHARACTERISATION requires signal acknowledgement (already true here)
  // PLUS at least one genuine panel inspection — closing the exploit
  // where inspecting a BRIEFING/SCAN-tier panel BEFORE ACKNOWLEDGE_SIGNAL
  // would previously unlock CHARACTERISATION regardless of signal state.
  // Documented design decision: containment is deliberately NOT a
  // prerequisite for characterisation — Pilot 3 never contains anything
  // (no analytical disturbance exists in that case), and its expert path
  // legitimately proceeds straight from signal recognition into
  // characterising/inspecting evidence without ever calling HOLD_RESULTS.
  const characterisationReached = signalAcked && state.inspectedPanelIds.length > 0;
  if (characterisationReached) idx = Math.max(idx, phaseIndex('CHARACTERISATION'));

  // HYPOTHESIS_GENERATION requires genuine CHARACTERISATION (not merely
  // "a hypothesis exists" — see the prior closure's plausibleFromStart
  // fix, still in effect via hypothesesConsidered) PLUS learner-performed
  // consideration.
  const hypothesisGenReached = characterisationReached && state.documentation.hypothesesConsidered.length > 0;
  if (hypothesisGenReached) idx = Math.max(idx, phaseIndex('HYPOTHESIS_GENERATION'));

  // EVIDENCE_SELECTION requires genuine CHARACTERISATION plus evidence
  // actually obtained — an evidence flag can no longer leapfrog past an
  // unearned CHARACTERISATION tier.
  const evidenceSelReached = characterisationReached && state.obtainedEvidenceIds.length > 0;
  if (evidenceSelReached) idx = Math.max(idx, phaseIndex('EVIDENCE_SELECTION'));

  // INVESTIGATION requires genuine CHARACTERISATION plus a genuinely
  // permitted investigative repeat (REPEAT_QC/REPEAT_CALIBRATION now also
  // carry their own execution-time CHARACTERISATION prerequisite — see
  // EXECUTION_PREREQUISITES below — so this fact can never be recorded
  // before CHARACTERISATION is genuinely reached in the first place;
  // the check is retained here too for defense-in-depth / clarity).
  const investigationReached = characterisationReached && state.documentation.investigationPerformed.length > 0;
  if (investigationReached) idx = Math.max(idx, phaseIndex('INVESTIGATION'));

  // INTERVENTION requires genuine HYPOTHESIS_GENERATION plus a documented
  // intervention (APPLY_INTERVENTION already carries its own execution-time
  // HYPOTHESIS_GENERATION prerequisite; retained here for clarity/defense).
  const interventionReached = hypothesisGenReached && state.documentation.intervention != null;
  if (interventionReached) idx = Math.max(idx, phaseIndex('INTERVENTION'));

  // VERIFICATION requires genuine IMMEDIATE_CONTAINMENT plus a
  // SUCCESSFUL verification — NOT merely an attempt. A failed
  // VERIFY_RECOVERY (criteriaWereMet: false) is recorded in
  // verificationAttempts for history/debrief purposes, but must never
  // itself establish that the VERIFICATION tier has been legitimately
  // reached for information-unlocking purposes — closing the exploit
  // where a premature, failed verification attempt inflated the unlock
  // frontier despite the engine simultaneously reporting a regression
  // back to INVESTIGATION.
  const verificationReached = containmentReached && state.verificationAttempts.some(v => v.criteriaWereMet === true);
  if (verificationReached) idx = Math.max(idx, phaseIndex('VERIFICATION'));

  // RESUME_OR_HOLD remains dependent on the service-state machine's own
  // structural transition rules (RESUME_SERVICE/ESCALATE already require
  // a genuinely successful verification and/or valid prior state via
  // SERVICE_STATE_TRANSITIONS elsewhere in this file).
  if (state.serviceState === 'RESUMED' || state.serviceState === 'ESCALATED') idx = Math.max(idx, phaseIndex('RESUME_OR_HOLD'));

  // DOCUMENTATION / DEBRIEF are never auto-unlocked — Stage 12A Section 13 deferral.
  return idx;
}

export function canReturnToPhase(fromPhase, toPhase) {
  return Array.isArray(PHASE_ALLOWS_RETURN_TO[fromPhase]) && PHASE_ALLOWS_RETURN_TO[fromPhase].includes(toPhase);
}

/* -----------------------------------------------------------------------
   PANEL / EVIDENCE AVAILABILITY — now gated against the genuine,
   recomputed unlocked-phase index, never a mutable high-water mark.
   ----------------------------------------------------------------------- */
function isPanelAvailable(panel, state) {
  if (!panel) return false;
  return deriveUnlockedPhaseIndex(state) >= phaseIndex(panel.availableFromPhase);
}

function isEvidenceAvailable(evidenceItem, caseObj, state) {
  if (!evidenceItem) return false;
  if (evidenceItem.sourcePanelId != null) {
    const panel = (caseObj.panels || []).find(p => p.id === evidenceItem.sourcePanelId);
    if (!panel) return false;
    if (!isPanelAvailable(panel, state)) return false;
    if (!state.inspectedPanelIds.includes(evidenceItem.sourcePanelId)) return false;
  }
  if (evidenceItem.availableOnlyAfterActionType != null) {
    if (!state.actionHistory.some(h => h.type === evidenceItem.availableOnlyAfterActionType)) return false;
  }
  return true;
}

function findDecisionOption(caseObj, decisionId, optionId) {
  const decision = (caseObj.decisionOpportunities || []).find(d => d.id === decisionId);
  if (!decision) return null;
  const option = (decision.options || []).find(o => o.id === optionId);
  if (!option) return null;
  return { decision, option };
}

/* -----------------------------------------------------------------------
   NARRATIVE PHASE (display/story only — NEVER consulted for gating)
   ----------------------------------------------------------------------- */
const PHASE_ADVANCING_ACTIONS = {
  ACKNOWLEDGE_SIGNAL: 'SIGNAL_RECOGNITION',
  HOLD_RESULTS: 'IMMEDIATE_CONTAINMENT',
  CONTINUE_ANALYSIS: 'IMMEDIATE_CONTAINMENT',
  FORM_HYPOTHESIS: 'HYPOTHESIS_GENERATION',
  REQUEST_EVIDENCE: 'EVIDENCE_SELECTION',
  APPLY_INTERVENTION: 'INTERVENTION',
  VERIFY_RECOVERY: 'VERIFICATION',
  REVIEW_PATIENT_IMPACT: 'PATIENT_IMPACT_REVIEW',
  RESUME_SERVICE: 'RESUME_OR_HOLD',
  ESCALATE: 'RESUME_OR_HOLD',
  DOCUMENT: 'DOCUMENTATION',
};
const PHASE_ADVANCE_REQUIRES_SIGNAL = new Set(Object.keys(PHASE_ADVANCING_ACTIONS).filter(t => t !== 'ACKNOWLEDGE_SIGNAL'));

function deriveNarrativePhase(actionType, currentPhase) {
  const target = PHASE_ADVANCING_ACTIONS[actionType];
  if (!target) return currentPhase;
  const currentIdx = phaseIndex(currentPhase);
  const targetIdx = phaseIndex(target);
  return targetIdx > currentIdx ? target : currentPhase;
}

/* -----------------------------------------------------------------------
   DECISION-EVENT IDENTITY (acceptance-closure fix #3)
   ----------------------------------------------------------------------- */
function nextDecisionEventId(state, decisionId) {
  const priorCount = state.actionHistory.filter(h => h.decisionId === decisionId).length;
  return `${decisionId}#${priorCount + 1}`;
}

/* -----------------------------------------------------------------------
   APPLY ACTION
   ----------------------------------------------------------------------- */
export function applyAction(caseObj, state, action) {
  if (!ACTION_TYPES.includes(action.type)) {
    return { state, error: `Unknown action type: ${action.type}`, severity: null };
  }

  if (PHASE_ADVANCE_REQUIRES_SIGNAL.has(action.type) && state.documentation.signal == null) {
    return { state, error: `Action "${action.type}" requires the signal to be acknowledged first (ACKNOWLEDGE_SIGNAL)`, severity: null };
  }

  const unlockedIdx = deriveUnlockedPhaseIndex(state);

  // Acceptance-closure fix #2: explicit execution-time prerequisites for
  // actions that could otherwise retroactively inflate the monotonic
  // unlock index past a tier never genuinely earned.
  const EXECUTION_PREREQUISITES = {
    FORM_HYPOTHESIS: 'CHARACTERISATION',
    REQUEST_EVIDENCE: 'CHARACTERISATION',
    APPLY_INTERVENTION: 'HYPOTHESIS_GENERATION',
    VERIFY_RECOVERY: 'IMMEDIATE_CONTAINMENT',
    // Stage 12A PROGRESSION-INVARIANT closure: REPEAT_QC/REPEAT_CALIBRATION
    // previously had NO execution-time prerequisite at all — accepted from
    // a pristine BRIEFING state and immediately populating
    // documentation.investigationPerformed, which (under the OLD
    // independent-fact unlock model) leapfrogged straight to INVESTIGATION.
    // A genuine investigative repeat presupposes the learner has at least
    // characterised the disturbance (inspected something) first.
    REPEAT_QC: 'CHARACTERISATION',
    REPEAT_CALIBRATION: 'CHARACTERISATION',
  };
  if (EXECUTION_PREREQUISITES[action.type] && unlockedIdx < phaseIndex(EXECUTION_PREREQUISITES[action.type])) {
    return { state, error: `Action "${action.type}" requires genuine progression to at least ${EXECUTION_PREREQUISITES[action.type]} (found unlocked index ${unlockedIdx}) — premature actions cannot retroactively unlock progression they have not genuinely earned`, severity: null };
  }

  const next = deepCloneState(state);
  let severity = 'INFORMATIONAL';
  let outcomeAppropriate = true;
  let reasoningSupported = true;
  let note = null;
  let decisionRef = null;
  let decisionCategory = null;
  let decisionEventId = null;

  let authoredOption = null;
  if (action.decisionId && action.optionId) {
    const found = findDecisionOption(caseObj, action.decisionId, action.optionId);
    if (!found) {
      return { state, error: `Unknown decisionId/optionId: ${action.decisionId}/${action.optionId}`, severity: null };
    }
    if (found.option.actionType !== action.type) {
      return { state, error: `Decision option "${action.optionId}" requires action type "${found.option.actionType}", but action type "${action.type}" was submitted`, severity: null };
    }
    if (unlockedIdx < phaseIndex(found.decision.availableFromPhase)) {
      return { state, error: `Decision "${action.decisionId}" is not yet available (requires genuinely-unlocked phase >= ${found.decision.availableFromPhase}, found unlocked index ${unlockedIdx})`, severity: null };
    }
    authoredOption = found.option;
    decisionRef = { decisionId: action.decisionId, optionId: action.optionId };
    decisionCategory = found.decision.category;
    decisionEventId = nextDecisionEventId(state, action.decisionId);

    // Stage 12A FINAL EVIDENCE/REASONING closure: determine
    // reasoningSupported from BOTH the authored severity (an option
    // authored as UNSUPPORTED/UNSAFE/CRITICAL_UNSAFE for reasons
    // unrelated to evidence timing is never "reasoning supported") AND
    // whether the case-declared requiredEvidenceIdsForSupportedReasoning
    // were genuinely obtained BEFORE this decision (using `state`, i.e.
    // evidence obtained prior to this action — what the learner actually
    // knew at decision time, not evidence this same action might obtain).
    // outcomeAppropriate is preserved EXACTLY as authored regardless —
    // the two axes remain independent: a correct conclusion reached
    // prematurely is still outcomeAppropriate=true, reasoningSupported=false.
    outcomeAppropriate = authoredOption.outcomeAppropriate;
    severity = authoredOption.severity;
    const requiredForReasoning = authoredOption.requiredEvidenceIdsForSupportedReasoning || [];
    const evidenceGenuinelyObtained = requiredForReasoning.every(id => state.obtainedEvidenceIds.includes(id));
    const SEVERITY_ORDER = ['INFORMATIONAL', 'INEFFICIENT', 'UNSUPPORTED', 'UNSAFE', 'CRITICAL_UNSAFE'];
    const authoredImpliesSupported = SEVERITY_ORDER.indexOf(authoredOption.severity) < SEVERITY_ORDER.indexOf('UNSUPPORTED');
    if (authoredImpliesSupported && !evidenceGenuinelyObtained) {
      reasoningSupported = false;
      severity = 'UNSUPPORTED';
    } else {
      reasoningSupported = authoredImpliesSupported;
    }
  }

  switch (action.type) {
    case 'INSPECT_PANEL': {
      const panel = (caseObj.panels || []).find(p => p.id === action.panelId);
      if (!panel) { return { state, error: `Unknown panelId: ${action.panelId}`, severity: null }; }
      if (!isPanelAvailable(panel, next)) {
        return { state, error: `Panel "${action.panelId}" is not yet available (requires phase >= ${panel.availableFromPhase})`, severity: null };
      }
      if (!next.inspectedPanelIds.includes(action.panelId)) {
        next.inspectedPanelIds.push(action.panelId);
        next.elapsedMinutes += panel.costTimeMinutes || 0;
      }
      if (!authoredOption) {
        severity = panel.relevance === 'IRRELEVANT' ? 'INEFFICIENT' : 'INFORMATIONAL';
        outcomeAppropriate = panel.relevance !== 'IRRELEVANT';
      }
      note = panel.relevance === 'IRRELEVANT' ? 'Inspected a panel the case marks irrelevant to this scenario.' : null;
      break;
    }
    case 'INSPECT_REAGENT':
    case 'INSPECT_MAINTENANCE':
    case 'CHECK_EQA':
    case 'CHECK_PBRTQC':
    case 'CHECK_PATIENT_DISTRIBUTION': {
      const typeMap = {
        INSPECT_REAGENT: 'REAGENT_LOT', INSPECT_MAINTENANCE: 'MAINTENANCE',
        CHECK_EQA: 'EQA', CHECK_PBRTQC: 'PBRTQC', CHECK_PATIENT_DISTRIBUTION: 'PATIENT_RESULT_DISTRIBUTION',
      };
      const panel = (caseObj.panels || []).find(p => p.type === typeMap[action.type]);
      if (!panel) return { state, error: `No panel of type "${typeMap[action.type]}" exists in this case`, severity: null };
      if (!isPanelAvailable(panel, next)) {
        return { state, error: `Panel of type "${typeMap[action.type]}" is not yet available (requires phase >= ${panel.availableFromPhase})`, severity: null };
      }
      if (!next.inspectedPanelIds.includes(panel.id)) {
        next.inspectedPanelIds.push(panel.id);
        next.elapsedMinutes += panel.costTimeMinutes || 0;
      }
      if (!authoredOption) {
        severity = panel.relevance === 'IRRELEVANT' ? 'INEFFICIENT' : 'INFORMATIONAL';
        outcomeAppropriate = panel.relevance !== 'IRRELEVANT';
      }
      break;
    }
    case 'ACKNOWLEDGE_SIGNAL': {
      next.documentation.signal = action.description || caseObj.groundTruth?.observedSignal || null;
      break;
    }
    case 'HOLD_RESULTS': {
      if (!canTransition(SERVICE_STATE_TRANSITIONS, next.serviceState, 'HELD')) {
        return { state, error: `Illegal service-state transition: ${next.serviceState} -> HELD`, severity: null };
      }
      next.serviceState = 'HELD';
      next.containmentDecided = true;
      next.documentation.containment = action.reason || 'Held pending investigation.';
      break;
    }
    case 'CONTINUE_ANALYSIS': {
      if (next.serviceState === 'UNDER_REVIEW' && canTransition(SERVICE_STATE_TRANSITIONS, next.serviceState, 'RUNNING')) {
        next.serviceState = 'RUNNING';
      } else if (next.serviceState !== 'RUNNING') {
        return { state, error: `Illegal service-state transition: ${next.serviceState} -> RUNNING`, severity: null };
      }
      next.containmentDecided = true;
      break;
    }
    case 'REPEAT_QC':
    case 'REPEAT_CALIBRATION': {
      next.elapsedMinutes += action.costTimeMinutes || 10;
      next.documentation.investigationPerformed.push(action.type);
      if (!authoredOption) {
        severity = action.wasNecessary === false ? 'INEFFICIENT' : 'INFORMATIONAL';
        outcomeAppropriate = action.wasNecessary !== false;
      }
      break;
    }
    case 'FORM_HYPOTHESIS': {
      const hid = action.hypothesisId;
      if (!(hid in next.hypothesisStates)) return { state, error: `Unknown hypothesisId: ${hid}`, severity: null };
      if (next.hypothesisStates[hid] === 'NOT_CONSIDERED') {
        if (!canTransition(HYPOTHESIS_STATE_TRANSITIONS, 'NOT_CONSIDERED', 'PLAUSIBLE')) {
          return { state, error: `Illegal hypothesis transition for ${hid}`, severity: null };
        }
        next.hypothesisStates[hid] = 'PLAUSIBLE';
      }
      // Stage 12A FINAL EVIDENCE/REASONING closure fix: record genuine
      // learner engagement whenever FORM_HYPOTHESIS is actually EXECUTED,
      // regardless of whether the underlying hypothesis state changed —
      // a hypothesis that started plausibleFromStart:true still requires
      // the LEARNER to genuinely call this action for it to count as
      // learner-performed consideration (the case-authored initial
      // plausibility describes the scenario, not learner progress; see
      // deriveUnlockedPhaseIndex()). Only recorded once per hypothesis.
      if (!next.documentation.hypothesesConsidered.includes(hid)) {
        next.documentation.hypothesesConsidered.push(hid);
      }
      break;
    }
    case 'REQUEST_EVIDENCE': {
      const ev = (caseObj.evidence || []).find(e => e.id === action.evidenceId);
      if (!ev) return { state, error: `Unknown evidenceId: ${action.evidenceId}`, severity: null };
      if (!isEvidenceAvailable(ev, caseObj, next)) {
        const reasonParts = [];
        if (ev.sourcePanelId != null) reasonParts.push(`source panel "${ev.sourcePanelId}" must be inspected`);
        if (ev.availableOnlyAfterActionType != null) reasonParts.push(`prior action type "${ev.availableOnlyAfterActionType}" must have occurred`);
        return { state, error: `Evidence "${ev.id}" is not yet available (${reasonParts.join(' AND ')})`, severity: null };
      }
      if (!ev.relevant && !authoredOption) { severity = 'INEFFICIENT'; outcomeAppropriate = false; }
      if (!next.obtainedEvidenceIds.includes(ev.id)) {
        next.obtainedEvidenceIds.push(ev.id);
        next.documentation.evidenceReviewed.push(ev.id);
        for (const hid of ev.supportsHypothesisIds || []) {
          const cur = next.hypothesisStates[hid] || 'NOT_CONSIDERED';
          const target = ev.decisive ? 'ESTABLISHED' : 'SUPPORTED';
          if (canTransition(HYPOTHESIS_STATE_TRANSITIONS, cur, target)) next.hypothesisStates[hid] = target;
          else if (cur === 'NOT_CONSIDERED' && canTransition(HYPOTHESIS_STATE_TRANSITIONS, 'NOT_CONSIDERED', 'PLAUSIBLE')) {
            next.hypothesisStates[hid] = 'PLAUSIBLE';
          }
        }
        for (const hid of ev.weakensHypothesisIds || []) {
          const cur = next.hypothesisStates[hid] || 'NOT_CONSIDERED';
          const target = ev.decisive ? 'CONTRADICTED' : 'WEAKENED';
          if (canTransition(HYPOTHESIS_STATE_TRANSITIONS, cur, target)) next.hypothesisStates[hid] = target;
        }
      }
      break;
    }
    case 'APPLY_INTERVENTION': {
      next.documentation.intervention = action.description || null;
      if (!authoredOption) {
        severity = action.evidenceSupported === false ? 'UNSUPPORTED' : 'INFORMATIONAL';
        outcomeAppropriate = action.evidenceSupported !== false;
      }
      break;
    }
    case 'VERIFY_RECOVERY': {
      const required = caseObj.verificationCriteria?.requiredEvidenceIds || [];
      const criteriaWereMet = required.every(id => next.obtainedEvidenceIds.includes(id));
      next.verificationAttempts.push({ atMinute: next.elapsedMinutes, criteriaWereMet });
      next.documentation.verification = criteriaWereMet
        ? (caseObj.verificationCriteria?.minimumConfirmationDescription || 'Verification criteria met.')
        : 'Verification attempted without meeting the case\'s minimum confirmation criteria.';
      if (criteriaWereMet) {
        if (!canTransition(SERVICE_STATE_TRANSITIONS, next.serviceState, 'READY_FOR_VERIFICATION') && next.serviceState !== 'READY_FOR_VERIFICATION') {
          return { state, error: `Illegal service-state transition: ${next.serviceState} -> READY_FOR_VERIFICATION`, severity: null };
        }
        next.serviceState = 'READY_FOR_VERIFICATION';
        if (!authoredOption) { severity = 'INFORMATIONAL'; outcomeAppropriate = true; }
        next.phase = deriveNarrativePhase(action.type, next.phase);
        next.maxPhaseIndexReached = deriveUnlockedPhaseIndex(next);
        next.actionHistory.push({ ...action, resultingSeverity: severity, outcomeAppropriate, reasoningSupported, note, decisionId: decisionRef?.decisionId || null, optionId: decisionRef?.optionId || null, decisionCategory, decisionEventId });
        return { state: next, error: null, severity, note, outcomeAppropriate, reasoningSupported, decisionEventId };
      } else {
        if (!authoredOption) { severity = 'UNSAFE'; outcomeAppropriate = false; }
        note = 'Verification attempted before required evidence was obtained; remaining in a held/investigative state.';
        const nominalPhase = deriveNarrativePhase(action.type, next.phase);
        const regressionTarget = 'INVESTIGATION';
        next.phase = canReturnToPhase(nominalPhase, regressionTarget) ? regressionTarget : nominalPhase;
        next.maxPhaseIndexReached = deriveUnlockedPhaseIndex(next);
        next.actionHistory.push({ ...action, resultingSeverity: severity, outcomeAppropriate, reasoningSupported, note, decisionId: decisionRef?.decisionId || null, optionId: decisionRef?.optionId || null, decisionCategory, decisionEventId });
        return { state: next, error: null, severity, note, outcomeAppropriate, reasoningSupported, decisionEventId };
      }
    }
    case 'REVIEW_PATIENT_IMPACT': {
      const targetState = action.targetState;
      if (!canTransition(PATIENT_IMPACT_TRANSITIONS, next.patientImpactState, targetState)) {
        return { state, error: `Illegal patient-impact transition: ${next.patientImpactState} -> ${targetState}`, severity: null };
      }
      const TERMINAL_PI_STATES = ['COMPLETED_NO_AFFECTED_RESULTS', 'AFFECTED_RESULT_SET_IDENTIFIED'];
      if (TERMINAL_PI_STATES.includes(targetState)) {
        const required = caseObj.patientImpactCriteria?.requiredEvidenceIdsForTerminalState || [];
        const met = required.length > 0 && required.every(id => next.obtainedEvidenceIds.includes(id));
        if (!met) {
          return { state, error: `Cannot reach terminal patient-impact state "${targetState}" without the case's required evidence`, severity: null };
        }
      }
      // Acceptance-closure: this action executes as a "limited
      // administrative record" — it never feeds deriveUnlockedPhaseIndex
      // (see that function's comment), so it can never itself unlock
      // later investigative panels, no matter how early it is called.
      next.patientImpactState = targetState;
      next.documentation.patientImpactAssessment = action.summary || targetState;
      break;
    }
    case 'RESUME_SERVICE': {
      if (!canTransition(SERVICE_STATE_TRANSITIONS, next.serviceState, 'RESUMED')) {
        return { state, error: `Illegal service-state transition: ${next.serviceState} -> RESUMED`, severity: null };
      }
      const lastVerification = next.verificationAttempts[next.verificationAttempts.length - 1];
      const patientImpactHandled = ['NOT_INDICATED', 'COMPLETED_NO_AFFECTED_RESULTS', 'AFFECTED_RESULT_SET_IDENTIFIED'].includes(next.patientImpactState);
      if (!lastVerification || !lastVerification.criteriaWereMet) {
        if (!authoredOption) { severity = 'CRITICAL_UNSAFE'; outcomeAppropriate = false; }
        note = 'Service resumed without adequate verification — premature release risk.';
      } else if (!patientImpactHandled) {
        if (!authoredOption) { severity = 'UNSAFE'; outcomeAppropriate = false; }
        note = 'Service resumed before patient-impact review was addressed.';
      } else {
        if (!authoredOption) { severity = 'INFORMATIONAL'; outcomeAppropriate = true; }
      }
      next.serviceState = 'RESUMED';
      next.documentation.finalDisposition = 'RESUMED';
      break;
    }
    case 'ESCALATE': {
      if (!canTransition(SERVICE_STATE_TRANSITIONS, next.serviceState, 'ESCALATED')) {
        return { state, error: `Illegal service-state transition: ${next.serviceState} -> ESCALATED`, severity: null };
      }
      next.serviceState = 'ESCALATED';
      next.documentation.escalation = action.reason || 'Escalated.';
      next.documentation.finalDisposition = 'ESCALATED';
      break;
    }
    case 'DOCUMENT': {
      // Acceptance-closure: a "limited administrative record" — never
      // feeds deriveUnlockedPhaseIndex, so it can never unlock later
      // panels merely by being called, however early.
      next.documentation = { ...next.documentation, ...(action.fields || {}) };
      break;
    }
    case 'RECORD_CONFIDENCE': {
      // Acceptance-closure fix #3/#4: confidence now references a stable
      // decisionEventId (not the reusable decisionId), so a revised
      // decision under the same decisionId is scored as a genuinely
      // distinct event. The referenced event must have actually occurred.
      const alreadyExecuted = next.actionHistory.some(h => h.decisionEventId === action.decisionEventId);
      if (!alreadyExecuted) {
        return { state, error: `RECORD_CONFIDENCE references decisionEventId "${action.decisionEventId}", which has not been executed in this trace`, severity: null };
      }
      next.confidenceRecords = next.confidenceRecords.filter(r => r.decisionEventId !== action.decisionEventId);
      next.confidenceRecords.push({ decisionEventId: action.decisionEventId, confidence: action.confidence, atMinute: next.elapsedMinutes });
      break;
    }
    default:
      break;
  }

  next.phase = deriveNarrativePhase(action.type, next.phase);
  next.maxPhaseIndexReached = deriveUnlockedPhaseIndex(next);
  next.actionHistory.push({ ...action, resultingSeverity: severity, outcomeAppropriate, reasoningSupported, note, decisionId: decisionRef?.decisionId || null, optionId: decisionRef?.optionId || null, decisionCategory, decisionEventId });
  return { state: next, error: null, severity, note, outcomeAppropriate, reasoningSupported, decisionEventId };
}

/* -----------------------------------------------------------------------
   DETERMINISTIC REPLAY
   ----------------------------------------------------------------------- */
export function replay(caseObj, actions) {
  let state = createInitialState(caseObj);
  const trace = [];
  for (const action of actions) {
    const outcome = applyAction(caseObj, state, action);
    trace.push(outcome);
    if (outcome.error) break;
    state = outcome.state;
  }
  return { finalState: state, trace };
}
