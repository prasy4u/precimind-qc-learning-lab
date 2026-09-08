/* v09/app/morning-qc/ui/action-dock.jsx — Stage 12B, PROVENANCE: V09_NEW
   Section 16: context-aware action dock, grouped by semantic category.
   For any action type that matches a currently-available case-authored
   decision option, clicking routes through the decision dialog (so the
   learner picks among the case's OWN options, per Section 17) rather
   than dispatching a bare action directly. Engine rejection remains
   authoritative for anything this light filtering gets wrong (Section 16).

   FINAL-UI-INTEGRATION-CLOSURE FIX: this dock previously fell back to a
   bare `onDispatch({ type: actionType })` for REQUEST_EVIDENCE,
   FORM_HYPOTHESIS, and REVIEW_PATIENT_IMPACT whenever no matching
   case-authored decision existed — each of these requires a specific
   target payload (evidenceId / hypothesisId / targetState) that this
   generic dock cannot supply, guaranteeing engine rejection
   ("Unknown evidenceId: undefined", "Unknown hypothesisId: undefined",
   "Illegal patient-impact transition: ... -> undefined") on every click.
   REQUEST_EVIDENCE and REVIEW_PATIENT_IMPACT are now omitted from
   ACTION_GROUPS entirely (ui-model.js) — their dedicated, payload-aware
   surfaces are PanelViewer's per-panel evidence buttons and
   PatientImpactPanel's transition-specific buttons, respectively.
   FORM_HYPOTHESIS now renders here ONLY when it is bound to a genuine
   available case-authored decision (real hypothesisId via
   {decisionId, optionId}); with no such decision, generic hypothesis
   formation belongs exclusively to HypothesisWorkspace's composer. */
import React from 'react';
import { ACTION_GROUPS, actionTypeLabel } from './ui-model.js';
import { SIMULATION_PHASES } from '../states.js';

// Actions hidden once their obviously-terminal precondition no longer
// applies — a UX convenience only; the engine independently enforces
// every one of these regardless of what is shown here.
function isPlausible(actionType, viewModel) {
  switch (actionType) {
    case 'ACKNOWLEDGE_SIGNAL': return !viewModel.signalAcknowledged;
    case 'HOLD_RESULTS': case 'CONTINUE_ANALYSIS':
      return viewModel.signalAcknowledged && !['HELD', 'RESUMED', 'ESCALATED'].includes(viewModel.serviceState);
    case 'ESCALATE': return viewModel.signalAcknowledged && viewModel.serviceState !== 'ESCALATED' && viewModel.serviceState !== 'RESUMED';
    case 'RESUME_SERVICE': return viewModel.serviceState === 'READY_FOR_VERIFICATION';
    case 'VERIFY_RECOVERY': return viewModel.signalAcknowledged && viewModel.serviceState !== 'RESUMED';
    case 'REPEAT_QC': case 'REPEAT_CALIBRATION':
      return viewModel.signalAcknowledged;
    case 'FORM_HYPOTHESIS': return true; // gated separately below (must ALSO match a real decision)
    case 'APPLY_INTERVENTION': return viewModel.signalAcknowledged;
    case 'DOCUMENT': return viewModel.signalAcknowledged;
    default: return true;
  }
}

function findMatchingDecision(actionType, availableDecisions) {
  // FINAL-UI-INTEGRATION-CLOSURE FIX: when MULTIPLE currently-available
  // decisions share an option with this actionType (e.g. Pilot 2's
  // dec-take-seriously has a DOCUMENT-actionType "Dismiss" option, while
  // dec-disposition ALSO has a DOCUMENT-actionType "Continue analysis,
  // document..." option), naively returning the FIRST match picked the
  // wrong decision — confirmed by direct browser reproduction: clicking
  // "Document" opened dec-take-seriously's dialog instead of
  // dec-disposition's. Ties are now broken by preferring the decision
  // whose availableFromPhase unlocks LATEST — a general, non-case-ID
  // heuristic (a decision requiring a later phase is the more specific/
  // current one once both happen to be simultaneously available), read
  // directly from Stage 12A's own SIMULATION_PHASES ordering, never a
  // duplicated or invented ranking.
  const matches = availableDecisions.filter(d => d.options.some(o => o.actionType === actionType));
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];
  return matches.reduce((latest, d) =>
    SIMULATION_PHASES.indexOf(d.availableFromPhase) > SIMULATION_PHASES.indexOf(latest.availableFromPhase) ? d : latest
  );
}

export function ActionDock({ viewModel, onDispatch, onOpenDecision, onOpenDocumentation }) {
  return (
    <div className="mqc-action-dock">
      {ACTION_GROUPS.map(group => {
        const visibleActions = group.actionTypes
          .filter(t => isPlausible(t, viewModel))
          // FORM_HYPOTHESIS renders here ONLY when it is the actionType
          // of a currently-available case-authored decision option — a
          // real dialog with a real, engine-recognized hypothesisId
          // bound to it via {decisionId, optionId}. With no matching
          // decision, generic hypothesis formation belongs exclusively
          // to HypothesisWorkspace's free-text composer; showing a
          // second, payload-less button here would only ever produce
          // "Unknown hypothesisId: undefined" on click.
          .filter(t => t !== 'FORM_HYPOTHESIS' || findMatchingDecision(t, viewModel.availableDecisions) !== null);
        if (visibleActions.length === 0) return null;
        return (
          <div key={group.id} className="mqc-action-group">
            <span className="mqc-action-group__label">{group.label}</span>
            {visibleActions.map(actionType => {
              const matchingDecision = findMatchingDecision(actionType, viewModel.availableDecisions);
              if (actionType === 'DOCUMENT' && !matchingDecision) {
                return (
                  <button key={actionType} type="button" className="mqc-btn" onClick={onOpenDocumentation}>
                    {actionTypeLabel(actionType)}
                  </button>
                );
              }
              return (
                <button
                  key={actionType}
                  type="button"
                  className="mqc-btn"
                  onClick={() => {
                    if (matchingDecision) onOpenDecision(matchingDecision);
                    else onDispatch({ type: actionType });
                  }}
                >
                  {actionTypeLabel(actionType)}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
