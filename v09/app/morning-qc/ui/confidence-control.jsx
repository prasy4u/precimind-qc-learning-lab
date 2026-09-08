/* v09/app/morning-qc/ui/confidence-control.jsx — Stage 12B, PROVENANCE: V09_NEW
   Section 22: attaches confidence to the EXACT decisionEventId returned by
   the executed decision — never the reusable decisionId. A revised
   decision under the same decisionId receives its own event and its own
   independent confidence control. */
import React from 'react';
import { CONFIDENCE_LEVELS } from './ui-model.js';

export function ConfidenceControl({ decisionEventId, existingConfidence, onRecordConfidence }) {
  if (!decisionEventId) return null;
  return (
    <div className="mqc-confidence">
      <span className="mqc-confidence__label">How confident are you in that decision?</span>
      {CONFIDENCE_LEVELS.map(level => (
        <button
          key={level}
          type="button"
          className="mqc-btn"
          data-variant={existingConfidence === level ? 'primary' : undefined}
          onClick={() => onRecordConfidence(decisionEventId, level)}
        >
          {level.charAt(0) + level.slice(1).toLowerCase()}
        </button>
      ))}
    </div>
  );
}
