/* v09/app/morning-qc/ui/event-timeline.jsx — Stage 12B, PROVENANCE: V09_NEW
   Section 24: shows WHAT actually happened (the real action-history
   sequence, via the adapter's already-sanitized eventTimeline field) —
   never severity/outcomeAppropriate/reasoningSupported/ground truth, and
   never what the learner separately documented (that is shown only in
   the documentation drawer, kept visually distinct per Invariant C). */
import React from 'react';
import { actionTypeLabel } from './ui-model.js';

export function EventTimeline({ viewModel }) {
  return (
    <ol aria-label="Event history" style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13.5 }}>
      {viewModel.eventTimeline.map(ev => (
        <li key={ev.index} style={{ padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
          {actionTypeLabel(ev.type)}
        </li>
      ))}
      {viewModel.eventTimeline.length === 0 && <li style={{ color: 'var(--text-faint)' }}>No actions taken yet.</li>}
    </ol>
  );
}
