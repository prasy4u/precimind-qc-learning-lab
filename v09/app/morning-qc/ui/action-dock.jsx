/* v09/app/morning-qc/ui/action-dock.jsx — Stage 12B, PROVENANCE: V09_NEW
   Section 16: context-aware action dock, grouped by semantic category.
   For any action type that matches a currently-available case-authored
   decision option, clicking routes through the decision dialog (so the
   learner picks among the case's OWN options, per Section 17) rather
   than dispatching a bare action directly. Engine rejection remains
   authoritative for anything this light filtering gets wrong (Section 16). */
import React from 'react';
import { ACTION_GROUPS, actionTypeLabel } from './ui-model.js';

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
    case 'REPEAT_QC': case 'REPEAT_CALIBRATION': case 'REQUEST_EVIDENCE':
      return viewModel.signalAcknowledged;
    case 'FORM_HYPOTHESIS': return viewModel.formableHypotheses.length > 0;
    case 'APPLY_INTERVENTION': return viewModel.signalAcknowledged;
    case 'REVIEW_PATIENT_IMPACT': return viewModel.signalAcknowledged;
    case 'DOCUMENT': return viewModel.signalAcknowledged;
    default: return true;
  }
}

function findMatchingDecision(actionType, availableDecisions) {
  for (const d of availableDecisions) {
    const opt = d.options.find(o => o.actionType === actionType);
    if (opt) return d;
  }
  return null;
}

export function ActionDock({ viewModel, onDispatch, onOpenDecision, onOpenDocumentation }) {
  return (
    <div className="mqc-action-dock">
      {ACTION_GROUPS.map(group => {
        const visibleActions = group.actionTypes.filter(t => isPlausible(t, viewModel));
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
