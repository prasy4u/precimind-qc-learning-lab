/* v09/app/morning-qc/debrief/reasoning-timeline.jsx — Stage 12C, PROVENANCE: V09_NEW
   Section 15: reconstructs only phases actually encountered — never the
   full canonical model as a post-hoc checklist. */
import React from 'react';
import { actionTypeLabel } from '../ui/ui-model.js';

export function ReasoningTimeline({ reasoningTimeline }) {
  return (
    <section aria-labelledby="mqcd-timeline-heading" className="mqcd-section">
      <h2 id="mqcd-timeline-heading" className="mqcd-section__title">Detailed Timeline</h2>
      <ol className="mqcd-timeline">
        {reasoningTimeline.map(ev => (
          <li key={ev.index} className="mqcd-timeline__item" data-outcome={ev.outcomeAppropriate === false ? 'poor' : undefined}>
            {actionTypeLabel(ev.type)}
          </li>
        ))}
      </ol>
    </section>
  );
}
