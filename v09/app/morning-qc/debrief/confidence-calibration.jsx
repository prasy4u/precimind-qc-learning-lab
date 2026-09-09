/* v09/app/morning-qc/debrief/confidence-calibration.jsx — Stage 12C, PROVENANCE: V09_NEW
   Section 12/13: uses exact decisionEventId throughout — revised
   decisions under the same reusable decisionId are shown as separate
   events, never overwritten or merged. */
import React from 'react';
import { calibrationCategoryLabel } from './debrief-model-ui.js';

export function ConfidenceCalibration({ confidenceCalibration, revisedDecisions }) {
  const revisedIds = new Set(revisedDecisions.map(r => r.decisionId));
  return (
    <section aria-labelledby="mqcd-calibration-heading" className="mqcd-section">
      <h2 id="mqcd-calibration-heading" className="mqcd-section__title">Confidence Calibration</h2>
      {confidenceCalibration.length === 0 && <p className="mqcd-empty">No confidence was recorded this case.</p>}
      <ul className="mqcd-calibration-list">
        {confidenceCalibration.map(c => (
          <li key={c.decisionEventId} className="mqcd-calibration-item">
            <span>{c.confidence}</span>
            <span className="mqcd-calibration-item__category">{calibrationCategoryLabel(c.category)}</span>
            {revisedIds.has(c.decisionId) && <span className="mqcd-calibration-item__revised">Revised decision</span>}
          </li>
        ))}
      </ul>
      {revisedDecisions.length > 0 && (
        <div className="mqcd-revised-decisions">
          <h3>Reasoning evolution</h3>
          {revisedDecisions.map(r => (
            <ol key={r.decisionId} className="mqcd-revised-sequence">
              {r.events.map((e, i) => (
                <li key={e.decisionEventId}>Decision {i + 1}: {e.choiceLabel} {e.confidence ? `(confidence: ${e.confidence})` : ''}</li>
              ))}
            </ol>
          ))}
        </div>
      )}
    </section>
  );
}
