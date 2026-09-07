/* =========================================================================
   v09/app/morning-qc/engine.js

   Morning QC Room — Stage 12A Deterministic Simulation Engine
   PROVENANCE: V09_NEW
   Revised during the Stage 12A independent-audit FINAL engine-semantics
   closure (see V09_STAGE12A_REPORT.md for the full defect log).

   FINAL-CLOSURE CHANGES:
     1. Panel-derived evidence (evidence.sourcePanelId != null) now
        requires the source panel to have been ACTUALLY INSPECTED, not
        merely "available" — closing an exploit where evidence could be
        obtained from a panel never opened.
     2. Phase high-water-mark advancement is now GUARDED: every
        phase-advancing action except ACKNOWLEDGE_SIGNAL requires
        documentation.signal to already be set (i.e. the signal must be
        genuinely acknowledged first). This closes an exploit where
        DOCUMENT, REVIEW_PATIENT_IMPACT, or FORM_HYPOTHESIS could fire
        from a pristine BRIEFING state and unlock later-phase panels
        purely by their nominal phase target, without any real
        investigative progress. The guard REJECTS the action entirely
        (no state mutation) when unmet — it does not merely skip the
        phase-advance.
     3. Case-authored decisionId/optionId execution is now a genuine
        contract: each option declares an `actionType`; the engine
        REJECTS execution if action.type does not match, and separately
        enforces the owning decision's `availableFromPhase` against
        maxPhaseIndexReached (checked BEFORE the action's own phase
        advance, avoiding a chicken-and-egg self-unlock). The executed
        decision's `category` is recorded on the action-history entry
        (decisionCategory) for decision-model.js to consume directly,
        rather than re-deriving category from action.type alone.
     4. Phase regression (failed VERIFY_RECOVERY) now genuinely consults
        PHASE_ALLOWS_RETURN_TO via a canReturnToPhase() helper, rather
        than hardcoding the target phase — the engine still decides WHEN
        regression occurs; the table is the validation authority for
        WHETHER the target is a legitimate return.
     5. RECORD_CONFIDENCE now validates that decisionId refers to a
        decision genuinely already executed in this trace — an unknown/
        never-made decisionId is REJECTED outright (fail-closed), not
        silently recorded and later excluded from scoring. Duplicate
        confidence for the same decisionId follows an explicit,
        deterministic policy: the LATEST recorded value REPLACES the
        earlier one.

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
    phase: 'BRIEFING',
    maxPhaseIndexReached: 0,
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
    // Stage 12A Section 13 resolution (Option B, retained from the prior
    // corrective closure): terminal/DEBRIEF are explicitly DEFERRED to
    // Stage 12B. Not reopened in this final closure.
    terminal: false,
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
   PHASE-RETURN GOVERNANCE (final-closure fix #4): genuinely consults
   PHASE_ALLOWS_RETURN_TO as the validation authority. The engine still
   decides WHEN a regression happens (see VERIFY_RECOVERY below); this
   helper only answers WHETHER a candidate target is a legitimate return
   from a given phase.
   ----------------------------------------------------------------------- */
export function canReturnToPhase(fromPhase, toPhase) {
  return Array.isArray(PHASE_ALLOWS_RETURN_TO[fromPhase]) && PHASE_ALLOWS_RETURN_TO[fromPhase].includes(toPhase);
}

/* -----------------------------------------------------------------------
   PANEL / EVIDENCE AVAILABILITY (final-closure fix #1)
   ----------------------------------------------------------------------- */
function isPanelAvailable(panel, state) {
  if (!panel) return false;
  return state.maxPhaseIndexReached >= phaseIndex(panel.availableFromPhase);
}

function isEvidenceAvailable(evidenceItem, caseObj, state) {
  if (!evidenceItem) return false;
  // Panel-derived evidence: the source panel must exist, be legitimately
  // available, AND have actually been inspected.
  if (evidenceItem.sourcePanelId != null) {
    const panel = (caseObj.panels || []).find(p => p.id === evidenceItem.sourcePanelId);
    if (!panel) return false;
    if (!isPanelAvailable(panel, state)) return false;
    if (!state.inspectedPanelIds.includes(evidenceItem.sourcePanelId)) return false;
  }
  // Action-generated evidence: the declared prerequisite action must
  // have occurred. Independent of, and in addition to, the panel check.
  if (evidenceItem.availableOnlyAfterActionType != null) {
    if (!state.actionHistory.some(h => h.type === evidenceItem.availableOnlyAfterActionType)) return false;
  }
  return true;
}

/* -----------------------------------------------------------------------
   DECISION-OPTION LOOKUP AND CONTRACT ENFORCEMENT (final-closure fix #3)
   ----------------------------------------------------------------------- */
function findDecisionOption(caseObj, decisionId, optionId) {
  const decision = (caseObj.decisionOpportunities || []).find(d => d.id === decisionId);
  if (!decision) return null;
  const option = (decision.options || []).find(o => o.id === optionId);
  if (!option) return null;
  return { decision, option };
}

/* -----------------------------------------------------------------------
   PHASE-ADVANCE GUARD (final-closure fix #2): every phase-advancing
   action except ACKNOWLEDGE_SIGNAL requires the signal to already be
   genuinely acknowledged. This is checked BEFORE the action executes;
   if unmet, the action is REJECTED ENTIRELY (no state mutation, no
   partial effect) — closing the "call a late-phase action from a
   pristine state to unlock everything" exploit while still permitting
   free (non-linear) ordering of INSPECT_PANEL and other non-phase-
   advancing actions at any time information is genuinely available.
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

function derivePhaseFromAction(actionType, currentPhase) {
  const target = PHASE_ADVANCING_ACTIONS[actionType];
  if (!target) return currentPhase;
  const currentIdx = phaseIndex(currentPhase);
  const targetIdx = phaseIndex(target);
  return targetIdx > currentIdx ? target : currentPhase;
}

/* -----------------------------------------------------------------------
   APPLY ACTION
   ----------------------------------------------------------------------- */
export function applyAction(caseObj, state, action) {
  if (!ACTION_TYPES.includes(action.type)) {
    return { state, error: `Unknown action type: ${action.type}`, severity: null };
  }

  // Final-closure fix #2: reject premature phase-advancing actions
  // outright, before any other processing.
  if (PHASE_ADVANCE_REQUIRES_SIGNAL.has(action.type) && state.documentation.signal == null) {
    return { state, error: `Action "${action.type}" requires the signal to be acknowledged first (ACKNOWLEDGE_SIGNAL) — premature phase-advancing actions are rejected to prevent phase high-water-mark gaming`, severity: null };
  }

  const next = deepCloneState(state);
  let severity = 'INFORMATIONAL';
  let outcomeAppropriate = true;
  let note = null;
  let decisionRef = null;
  let decisionCategory = null;

  // Final-closure fix #3: case-authored decision contract enforcement.
  let authoredOption = null;
  if (action.decisionId && action.optionId) {
    const found = findDecisionOption(caseObj, action.decisionId, action.optionId);
    if (!found) {
      return { state, error: `Unknown decisionId/optionId: ${action.decisionId}/${action.optionId}`, severity: null };
    }
    if (found.option.actionType !== action.type) {
      return { state, error: `Decision option "${action.optionId}" requires action type "${found.option.actionType}", but action type "${action.type}" was submitted — decision identity is bound to a specific, matching action`, severity: null };
    }
    if (state.maxPhaseIndexReached < phaseIndex(found.decision.availableFromPhase)) {
      return { state, error: `Decision "${action.decisionId}" is not yet available (requires phase >= ${found.decision.availableFromPhase})`, severity: null };
    }
    authoredOption = found.option;
    decisionRef = { decisionId: action.decisionId, optionId: action.optionId };
    decisionCategory = found.decision.category;
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
      severity = panel.relevance === 'IRRELEVANT' ? 'INEFFICIENT' : 'INFORMATIONAL';
      outcomeAppropriate = panel.relevance !== 'IRRELEVANT';
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
      if (!panel) {
        return { state, error: `No panel of type "${typeMap[action.type]}" exists in this case — action unreachable`, severity: null };
      }
      if (!isPanelAvailable(panel, next)) {
        return { state, error: `Panel of type "${typeMap[action.type]}" is not yet available (requires phase >= ${panel.availableFromPhase})`, severity: null };
      }
      if (!next.inspectedPanelIds.includes(panel.id)) {
        next.inspectedPanelIds.push(panel.id);
        next.elapsedMinutes += panel.costTimeMinutes || 0;
      }
      severity = panel.relevance === 'IRRELEVANT' ? 'INEFFICIENT' : 'INFORMATIONAL';
      outcomeAppropriate = panel.relevance !== 'IRRELEVANT';
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
      next.documentation.containment = action.reason || 'Held pending investigation.';
      if (authoredOption) { severity = authoredOption.severity; outcomeAppropriate = authoredOption.outcomeAppropriate; }
      break;
    }
    case 'CONTINUE_ANALYSIS': {
      if (next.serviceState === 'UNDER_REVIEW' && canTransition(SERVICE_STATE_TRANSITIONS, next.serviceState, 'RUNNING')) {
        next.serviceState = 'RUNNING';
      } else if (next.serviceState !== 'RUNNING') {
        return { state, error: `Illegal service-state transition: ${next.serviceState} -> RUNNING`, severity: null };
      }
      if (authoredOption) { severity = authoredOption.severity; outcomeAppropriate = authoredOption.outcomeAppropriate; }
      break;
    }
    case 'REPEAT_QC':
    case 'REPEAT_CALIBRATION': {
      next.elapsedMinutes += action.costTimeMinutes || 10;
      next.documentation.investigationPerformed.push(action.type);
      severity = action.wasNecessary === false ? 'INEFFICIENT' : 'INFORMATIONAL';
      outcomeAppropriate = action.wasNecessary !== false;
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
        next.documentation.hypothesesConsidered.push(hid);
      }
      if (authoredOption) { severity = authoredOption.severity; outcomeAppropriate = authoredOption.outcomeAppropriate; }
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
      if (!ev.relevant) { severity = 'INEFFICIENT'; outcomeAppropriate = false; }
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
      if (authoredOption) { severity = authoredOption.severity; outcomeAppropriate = authoredOption.outcomeAppropriate; }
      break;
    }
    case 'APPLY_INTERVENTION': {
      next.documentation.intervention = action.description || null;
      severity = action.evidenceSupported === false ? 'UNSUPPORTED' : 'INFORMATIONAL';
      outcomeAppropriate = action.evidenceSupported !== false;
      if (authoredOption) { severity = authoredOption.severity; outcomeAppropriate = authoredOption.outcomeAppropriate; }
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
        severity = 'INFORMATIONAL';
        outcomeAppropriate = true;
        if (authoredOption) { severity = authoredOption.severity; outcomeAppropriate = authoredOption.outcomeAppropriate; }
        next.phase = derivePhaseFromAction(action.type, next.phase);
        const idx1 = phaseIndex(next.phase);
        if (idx1 > next.maxPhaseIndexReached) next.maxPhaseIndexReached = idx1;
        next.actionHistory.push({ ...action, resultingSeverity: severity, outcomeAppropriate, note, decisionId: decisionRef?.decisionId || null, optionId: decisionRef?.optionId || null, decisionCategory });
        return { state: next, error: null, severity, note, outcomeAppropriate };
      } else {
        severity = 'UNSAFE';
        outcomeAppropriate = false;
        if (authoredOption) { severity = authoredOption.severity; outcomeAppropriate = authoredOption.outcomeAppropriate; }
        note = 'Verification attempted before required evidence was obtained; remaining in a held/investigative state.';
        // Final-closure fix #4: genuinely consult canReturnToPhase() as
        // the validation authority. The attempted action's OWN nominal
        // phase (VERIFICATION) is the "from" side of the return check —
        // attempting VERIFY_RECOVERY represents having reached the
        // VERIFICATION phase conceptually (the attempt happened), and the
        // regression is FROM there back to INVESTIGATION, per the table.
        // Using the pre-attempt current phase instead would incorrectly
        // block the regression whenever verification is attempted before
        // other actions have separately advanced phase that far.
        const nominalPhase = derivePhaseFromAction(action.type, next.phase); // -> 'VERIFICATION' or unchanged
        const regressionTarget = 'INVESTIGATION';
        if (canReturnToPhase(nominalPhase, regressionTarget)) {
          next.phase = regressionTarget;
        } else {
          next.phase = nominalPhase;
        }
        next.actionHistory.push({ ...action, resultingSeverity: severity, outcomeAppropriate, note, decisionId: decisionRef?.decisionId || null, optionId: decisionRef?.optionId || null, decisionCategory });
        return { state: next, error: null, severity, note, outcomeAppropriate };
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
      next.patientImpactState = targetState;
      next.documentation.patientImpactAssessment = action.summary || targetState;
      if (authoredOption) { severity = authoredOption.severity; outcomeAppropriate = authoredOption.outcomeAppropriate; }
      break;
    }
    case 'RESUME_SERVICE': {
      if (!canTransition(SERVICE_STATE_TRANSITIONS, next.serviceState, 'RESUMED')) {
        return { state, error: `Illegal service-state transition: ${next.serviceState} -> RESUMED`, severity: null };
      }
      const lastVerification = next.verificationAttempts[next.verificationAttempts.length - 1];
      const patientImpactHandled = ['NOT_INDICATED', 'COMPLETED_NO_AFFECTED_RESULTS', 'AFFECTED_RESULT_SET_IDENTIFIED'].includes(next.patientImpactState);
      if (!lastVerification || !lastVerification.criteriaWereMet) {
        severity = 'CRITICAL_UNSAFE';
        outcomeAppropriate = false;
        note = 'Service resumed without adequate verification — premature release risk.';
      } else if (!patientImpactHandled) {
        severity = 'UNSAFE';
        outcomeAppropriate = false;
        note = 'Service resumed before patient-impact review was addressed.';
      } else {
        severity = 'INFORMATIONAL';
        outcomeAppropriate = true;
      }
      if (authoredOption) { severity = authoredOption.severity; outcomeAppropriate = authoredOption.outcomeAppropriate; }
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
      if (authoredOption) { severity = authoredOption.severity; outcomeAppropriate = authoredOption.outcomeAppropriate; }
      break;
    }
    case 'DOCUMENT': {
      next.documentation = { ...next.documentation, ...(action.fields || {}) };
      if (authoredOption) { severity = authoredOption.severity; outcomeAppropriate = authoredOption.outcomeAppropriate; }
      break;
    }
    case 'RECORD_CONFIDENCE': {
      // Final-closure fix #5: decisionId must refer to a decision
      // genuinely already executed in this trace. Fail closed otherwise.
      const alreadyExecuted = next.actionHistory.some(h => h.decisionId === action.decisionId);
      if (!alreadyExecuted) {
        return { state, error: `RECORD_CONFIDENCE references decisionId "${action.decisionId}", which has not been executed in this trace`, severity: null };
      }
      // Deterministic duplicate policy: latest replaces earlier for the same decisionId.
      next.confidenceRecords = next.confidenceRecords.filter(r => r.decisionId !== action.decisionId);
      next.confidenceRecords.push({ decisionId: action.decisionId, confidence: action.confidence, atMinute: next.elapsedMinutes });
      break;
    }
    default:
      break;
  }

  next.phase = derivePhaseFromAction(action.type, next.phase);
  const newPhaseIdx = phaseIndex(next.phase);
  if (newPhaseIdx > next.maxPhaseIndexReached) next.maxPhaseIndexReached = newPhaseIdx;
  next.actionHistory.push({ ...action, resultingSeverity: severity, outcomeAppropriate, note, decisionId: decisionRef?.decisionId || null, optionId: decisionRef?.optionId || null, decisionCategory });
  return { state: next, error: null, severity, note, outcomeAppropriate };
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
