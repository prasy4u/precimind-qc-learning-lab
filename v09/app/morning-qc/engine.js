/* =========================================================================
   v09/app/morning-qc/engine.js

   Morning QC Room — Stage 12A Deterministic Simulation Engine
   PROVENANCE: V09_NEW

   Core principle (Section 12): given a case definition + current state +
   action history, the resulting state is REPRODUCIBLE. No hidden random
   scientific outcomes — this engine contains zero calls to Math.random()
   or any nondeterministic source. Replaying the same action list against
   the same case always yields byte-identical state (verified by
   deep-equality in the engine test suite).

   The engine enforces STRUCTURAL legality (service-state and
   patient-impact-state transition tables from states.js) but does not
   itself forbid every unsafe-but-structurally-legal action (e.g. resuming
   service after an inadequate verification attempt) — those are instead
   flagged with a SEVERITY_LEVEL (states.js) for scoring/debrief purposes,
   per Section 20's request for a severity model distinct from blocked
   transitions.
   ========================================================================= */

import {
  SIMULATION_PHASES, SERVICE_STATE_TRANSITIONS, PATIENT_IMPACT_TRANSITIONS,
  HYPOTHESIS_STATE_TRANSITIONS, INFORMATIONAL_ACTION_TYPES, ACTION_TYPES,
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
    terminal: false,
  };
}

function deepCloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

function canTransition(table, from, to) {
  return Array.isArray(table[from]) && table[from].includes(to);
}

/* -----------------------------------------------------------------------
   PHASE DERIVATION (Section 5: non-forced, non-linear; the engine derives
   "current phase" from the furthest legitimate progress the action history
   demonstrates, rather than the learner picking a phase directly.)
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
  if (!target) return currentPhase; // informational/inspection actions don't force phase advance
  const currentIdx = SIMULATION_PHASES.indexOf(currentPhase);
  const targetIdx = SIMULATION_PHASES.indexOf(target);
  // Only advance forward; do not regress phase merely by action type
  // (explicit regression is a separate, intentional mechanic not exercised
  // by pilot cases in Stage 12A, reserved for future case designs).
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
  let note = null;

  switch (action.type) {
    case 'INSPECT_PANEL': {
      const panel = (caseObj.panels || []).find(p => p.id === action.panelId);
      if (!panel) { return { state, error: `Unknown panelId: ${action.panelId}`, severity: null }; }
      if (!next.inspectedPanelIds.includes(action.panelId)) {
        next.inspectedPanelIds.push(action.panelId);
        next.elapsedMinutes += panel.costTimeMinutes || 0;
      }
      severity = panel.relevance === 'IRRELEVANT' ? 'INEFFICIENT' : 'INFORMATIONAL';
      note = panel.relevance === 'IRRELEVANT' ? 'Inspected a panel the case marks irrelevant to this scenario.' : null;
      break;
    }
    case 'INSPECT_REAGENT':
    case 'INSPECT_MAINTENANCE':
    case 'CHECK_EQA':
    case 'CHECK_PBRTQC':
    case 'CHECK_PATIENT_DISTRIBUTION': {
      // These map onto INSPECT_PANEL semantics for a specific canonical panel type.
      const typeMap = {
        INSPECT_REAGENT: 'REAGENT_LOT', INSPECT_MAINTENANCE: 'MAINTENANCE',
        CHECK_EQA: 'EQA', CHECK_PBRTQC: 'PBRTQC', CHECK_PATIENT_DISTRIBUTION: 'PATIENT_RESULT_DISTRIBUTION',
      };
      const panel = (caseObj.panels || []).find(p => p.type === typeMap[action.type]);
      if (panel && !next.inspectedPanelIds.includes(panel.id)) {
        next.inspectedPanelIds.push(panel.id);
        next.elapsedMinutes += panel.costTimeMinutes || 0;
      }
      severity = panel && panel.relevance === 'IRRELEVANT' ? 'INEFFICIENT' : 'INFORMATIONAL';
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
      severity = 'INFORMATIONAL';
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
      if (!ev.relevant) severity = 'INEFFICIENT';
      if (!next.obtainedEvidenceIds.includes(ev.id)) {
        next.obtainedEvidenceIds.push(ev.id);
        next.documentation.evidenceReviewed.push(ev.id);
        // Update hypothesis states based on this evidence's declared support/weakening.
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
      break;
    }
    case 'VERIFY_RECOVERY': {
      const required = caseObj.verificationCriteria?.requiredEvidenceIds || [];
      const criteriaWereMet = required.every(id => next.obtainedEvidenceIds.includes(id));
      next.verificationAttempts.push({ atMinute: next.elapsedMinutes, criteriaWereMet });
      next.documentation.verification = criteriaWereMet
        ? (caseObj.verificationCriteria?.minimumConfirmationDescription || 'Verification criteria met.')
        : 'Verification attempted without meeting the case\'s minimum confirmation criteria.';
      if (canTransition(SERVICE_STATE_TRANSITIONS, next.serviceState, 'READY_FOR_VERIFICATION')) {
        next.serviceState = 'READY_FOR_VERIFICATION';
      } else if (next.serviceState !== 'READY_FOR_VERIFICATION') {
        return { state, error: `Illegal service-state transition: ${next.serviceState} -> READY_FOR_VERIFICATION`, severity: null };
      }
      severity = criteriaWereMet ? 'INFORMATIONAL' : 'UNSAFE';
      note = criteriaWereMet ? null : 'Verification attempted before required evidence was obtained.';
      break;
    }
    case 'REVIEW_PATIENT_IMPACT': {
      const targetState = action.targetState;
      if (!canTransition(PATIENT_IMPACT_TRANSITIONS, next.patientImpactState, targetState)) {
        return { state, error: `Illegal patient-impact transition: ${next.patientImpactState} -> ${targetState}`, severity: null };
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
        note = 'Service resumed without adequate verification — premature release risk.';
      } else if (!patientImpactHandled) {
        severity = 'UNSAFE';
        note = 'Service resumed before patient-impact review was addressed.';
      } else {
        severity = 'INFORMATIONAL';
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

  next.phase = derivePhaseFromAction(action.type, next.phase);
  next.actionHistory.push({ ...action, resultingSeverity: severity, note });
  if (next.serviceState === 'RESUMED' || next.serviceState === 'ESCALATED') {
    if (next.phase === 'DOCUMENTATION' || action.type === 'DOCUMENT') next.terminal = false; // documentation can still follow
  }
  return { state: next, error: null, severity, note };
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
    if (outcome.error) break; // stop replay on first illegal action, like a real session would
    state = outcome.state;
  }
  return { finalState: state, trace };
}
