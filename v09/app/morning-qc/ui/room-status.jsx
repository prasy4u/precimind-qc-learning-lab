/* v09/app/morning-qc/ui/room-status.jsx — Stage 12B, PROVENANCE: V09_NEW
   Section 4: a subtle status representation, NEVER a rigid "Step X of 14"
   stepper. Shows a handful of neutral dots reflecting broad reasoning
   progress (signal noted / investigating / concluding) without revealing
   future steps, exact engine phase names, or requiring sequential
   completion.

   CORRECTIVE-CLOSURE FIX: the "concluding" stage previously treated
   `documentation.finalDisposition != null` as evidence the learner was
   concluding — but documentation is a learner CLAIM, not proof an
   operational disposition occurred (Invariant C). This decorative status
   must not be forgeable by writing text into the documentation drawer.
   Now derived only from genuine engine/event facts already present in
   the view model: serviceState (RESUMED/ESCALATED) or the presence of a
   genuine DISPOSITION-category decision event in the event timeline. */
import React from 'react';

export function RoomStatus({ viewModel }) {
  const stages = [
    { id: 'noticed', reached: viewModel.signalAcknowledged },
    { id: 'gathering', reached: viewModel.obtainedEvidence.length > 0 || viewModel.hypotheses.length > 0 },
    { id: 'concluding', reached: ['RESUMED', 'ESCALATED'].includes(viewModel.serviceState) },
  ];
  return (
    <div className="mqc-room-status" aria-label="Reasoning progress">
      {stages.map(s => (
        <span key={s.id} className="mqc-room-status__dot" data-reached={s.reached} aria-hidden="true" />
      ))}
    </div>
  );
}
