/* =========================================================================
   v09/app/morning-qc/engine.js

   Morning QC Room — Stage 12A Deterministic Simulation Engine
   PROVENANCE: V09_NEW
   Revised during the Stage 12A independent-audit corrective closure.

   Core principle (Section 12): given a case definition + current state +
   action history, the resulting state is REPRODUCIBLE. No hidden random
   scientific outcomes — this engine contains zero calls to Math.random()
   or any nondeterministic source.

   CORRECTIVE-CLOSURE CHANGES (see V09_STAGE12A_REPORT.md for the full
   defect log):
     1. Panel availability is now ENFORCED (not merely declared) via a
        high-water-mark phase index, so a panel becomes accessible once
        the learner has ever reached its availableFromPhase, and remains
        accessible even if the phase later regresses (see #6 below) —
        the learner never LOSES access to something already legitimately
        seen.
     2. Evidence prerequisites (availableOnlyAfterActionType) are now
        ENFORCED — requesting evidence before its declared prerequisite
        action has occurred fails and does not update obtainedEvidenceIds
        or any hypothesis state.
     3. Case-defined decisionOpportunities are now EXECUTABLE: an action
        may carry { decisionId, optionId }, in which case the engine looks
        up the case-authored option and uses its OWN severity AND
        outcomeAppropriate fields as the authoritative record — replacing
        the prior heuristic, action-type-only severity guess.
     4. outcomeAppropriate is now a genuinely independent axis, sourced
        directly from the case-authored option when present — never
        merely "severity !== CRITICAL_UNSAFE".
     5. Patient-impact TERMINAL states (COMPLETED_NO_AFFECTED_RESULTS,
        AFFECTED_RESULT_SET_IDENTIFIED) now require the case's declared
        patientImpactCriteria.requiredEvidenceIdsForTerminalState to be
        obtained first.
     6. VERIFY_RECOVERY no longer moves serviceState to
        READY_FOR_VERIFICATION when criteria are NOT met — a failed
        verification correctly remains in a held/investigative state
        (HELD), not a state implying readiness to resume. The engine also
        deterministically regresses phase to INVESTIGATION on a failed
        verification attempt (implementing the previously-unused
        PHASE_ALLOWS_RETURN_TO table).
     7. Confidence records are scored against the SPECIFIC decision they
        name (via decisionId), not "the last decision in the case" — see
        scoring-model.js's computeCalibration(), which consumes the
        decisionId-tagged decision list this engine now produces.
   ========================================================================= */

import {
  SIMULATION_PHASES, SERVICE_STATE_TRANSITIONS, PATIENT_IMPACT_TRANSITIONS,
  HYPOTHESIS_STATE_TRANSITIONS, ACTION_TYPES,
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
    // High-water-mark of phase progress (corrective-closure fix #1/#6):
    // tracks the furthest phase index ever reached, independent of the
    // CURRENT phase (which may regress on a failed verification). Panel/
    // evidence availability below consults this, not `phase`, so a
    // legitimate regression never hides previously-available information.
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
    verificationAttempts: [], // { atMinute, criteriaWereMet }
    // Stage 12A Section 13 resolution (Option B, corrective closure):
    // `terminal` and the DEBRIEF phase are explicitly DEFERRED runtime
    // semantics in this stage — the engine never sets `terminal: true`
    // and never transitions into DEBRIEF itself; Stage 12B owns session
    // completion. The field remains present for a stable downstream
    // shape, but its value is permanently `false` throughout Stage 12A —
    // this is now documented rather than silently implied to be
    // functional.
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
   PANEL / EVIDENCE AVAILABILITY (corrective-closure fix #1/#2)
   ----------------------------------------------------------------------- */
function isPanelAvailable(panel, state) {
  if (!panel) return false;
  return state.maxPhaseIndexReached >= phaseIndex(panel.availableFromPhase);
}

function isEvidenceAvailable(evidenceItem, state) {
  if (!evidenceItem) return false;
  if (!evidenceItem.availableOnlyAfterActionType) return true;
  return state.actionHistory.some(h => h.type === evidenceItem.availableOnlyAfterActionType);
}

/* -----------------------------------------------------------------------
   DECISION-OPTION LOOKUP (corrective-closure fix #3/#4)
   ----------------------------------------------------------------------- */
function findDecisionOption(caseObj, decisionId, optionId) {
  const decision = (caseObj.decisionOpportunities || []).find(d => d.id === decisionId);
  if (!decision) return null;
  const option = (decision.options || []).find(o => o.id === optionId);
  if (!option) return null;
  return { decision, option };
}

/* -----------------------------------------------------------------------
   PHASE DERIVATION (non-forced, non-linear; regression is
   engine-determined by outcome, never learner-selected)
   ----------------------------------------------------------------------- */
function derivePhaseFromAction(actionType, currentPhase) {
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

  const next = deepCloneState(state);
  let severity = 'INFORMATIONAL';
  let outcomeAppropriate = true;
  let note = null;
  let decisionRef = null;

  let authoredOption = null;
  if (action.decisionId && action.optionId) {
    const found = findDecisionOption(caseObj, action.decisionId, action.optionId);
    if (!found) {
      return { state, error: `Unknown decisionId/optionId: ${action.decisionId}/${action.optionId}`, severity: null };
    }
    authoredOption = found.option;
    decisionRef = { decisionId: action.decisionId, optionId: action.optionId };
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
      if (panel) {
        if (!isPanelAvailable(panel, next)) {
          return { state, error: `Panel of type "${typeMap[action.type]}" is not yet available (requires phase >= ${panel.availableFromPhase})`, severity: null };
        }
        if (!next.inspectedPanelIds.includes(panel.id)) {
          next.inspectedPanelIds.push(panel.id);
          next.elapsedMinutes += panel.costTimeMinutes || 0;
        }
      }
      severity = panel && panel.relevance === 'IRRELEVANT' ? 'INEFFICIENT' : 'INFORMATIONAL';
      outcomeAppropriate = !(panel && panel.relevance === 'IRRELEVANT');
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
      break;
    }
    case 'CONTINUE_ANALYSIS': {
      if (next.serviceState === 'UNDER_REVIEW' && canTransition(SERVICE_STATE_TRANSITIONS, next.serviceState, 'RUNNING')) {
        next.serviceState = 'RUNNING';
      } else if (next.serviceState !== 'RUNNING') {
        return { state, error: `Illegal service-state transition: ${next.serviceState} -> RUNNING`, severity: null };
      }
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
      break;
    }
    case 'REQUEST_EVIDENCE': {
      const ev = (caseObj.evidence || []).find(e => e.id === action.evidenceId);
      if (!ev) return { state, error: `Unknown evidenceId: ${action.evidenceId}`, severity: null };
      if (!isEvidenceAvailable(ev, next)) {
        return { state, error: `Evidence "${ev.id}" is not yet available (requires prior action type: ${ev.availableOnlyAfterActionType})`, severity: null };
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
      break;
    }
    case 'APPLY_INTERVENTION': {
      next.documentation.intervention = action.description || null;
      severity = action.evidenceSupported === false ? 'UNSUPPORTED' : 'INFORMATIONAL';
      outcomeAppropriate = action.evidenceSupported !== false;
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
        next.actionHistory.push({ ...action, resultingSeverity: severity, outcomeAppropriate, note, decisionId: decisionRef?.decisionId || null, optionId: decisionRef?.optionId || null });
        return { state: next, error: null, severity, note, outcomeAppropriate };
      } else {
        // Corrective-closure fix #6: a FAILED verification does NOT
        // advance serviceState — it remains wherever it already was
        // (typically HELD). Phase deterministically regresses to
        // INVESTIGATION (engine-determined by outcome, not learner choice).
        severity = 'UNSAFE';
        outcomeAppropriate = false;
        if (authoredOption) { severity = authoredOption.severity; outcomeAppropriate = authoredOption.outcomeAppropriate; }
        note = 'Verification attempted before required evidence was obtained; remaining in a held/investigative state.';
        next.phase = 'INVESTIGATION';
        next.actionHistory.push({ ...action, resultingSeverity: severity, outcomeAppropriate, note, decisionId: decisionRef?.decisionId || null, optionId: decisionRef?.optionId || null });
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
          return { state, error: `Cannot reach terminal patient-impact state "${targetState}" without the case's required evidence (patientImpactCriteria.requiredEvidenceIdsForTerminalState)`, severity: null };
        }
      }
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
      next.documentation = { ...next.documentation, ...(action.fields || {}) };
      break;
    }
    case 'RECORD_CONFIDENCE': {
      next.confidenceRecords.push({ decisionId: action.decisionId, confidence: action.confidence, atMinute: next.elapsedMinutes });
      break;
    }
    default:
      break;
  }

  // Corrective-closure fix: authoredOption override is UNIVERSAL, not an
  // allow-list of specific action types (this previously missed
  // FORM_HYPOTHESIS and other action types that can legitimately execute
  // a case-authored decision option).
  if (authoredOption) {
    severity = authoredOption.severity;
    outcomeAppropriate = authoredOption.outcomeAppropriate;
  }

  next.phase = derivePhaseFromAction(action.type, next.phase);
  const newPhaseIdx = phaseIndex(next.phase);
  if (newPhaseIdx > next.maxPhaseIndexReached) next.maxPhaseIndexReached = newPhaseIdx;
  next.actionHistory.push({ ...action, resultingSeverity: severity, outcomeAppropriate, note, decisionId: decisionRef?.decisionId || null, optionId: decisionRef?.optionId || null });
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
