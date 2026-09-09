/* v09/app/morning-qc/debrief/decision-review.jsx — Stage 12C, PROVENANCE: V09_NEW
   Section 11: chronological decision review by exact decisionEventId.
   Preserves the four-quadrant distinction explicitly (Section 11) —
   never collapsed into a binary correct/incorrect. */
import React from 'react';
import { quadrantLabel } from './debrief-model-ui.js';

export function DecisionReview({ decisionReview }) {
  return (
    <section aria-labelledby="mqcd-decision-heading" className="mqcd-section">
      <h2 id="mqcd-decision-heading" className="mqcd-section__title">Decision Review</h2>
      {decisionReview.length === 0 && <p className="mqcd-empty">No case-authored decisions were executed this case.</p>}
      <ol className="mqcd-decision-list">
        {decisionReview.map(d => (
          <li key={d.decisionEventId} className="mqcd-decision-card" data-quadrant={d.quadrant}>
            <div className="mqcd-decision-card__choice">{d.choiceLabel}</div>
            <div className="mqcd-decision-card__quadrant">{quadrantLabel(d.quadrant)}</div>
            {d.explanation && <p className="mqcd-decision-card__explanation">{d.explanation}</p>}
            {d.confidence && <div className="mqcd-decision-card__confidence">Confidence recorded: {d.confidence}</div>}
          </li>
        ))}
      </ol>
    </section>
  );
}
