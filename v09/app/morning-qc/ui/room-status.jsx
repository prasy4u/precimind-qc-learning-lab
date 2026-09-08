/* v09/app/morning-qc/ui/room-status.jsx — Stage 12B, PROVENANCE: V09_NEW
   Section 4: a subtle status representation, NEVER a rigid "Step X of 14"
   stepper. Shows a handful of neutral dots reflecting broad reasoning
   progress (signal noted / investigating / concluding) without revealing
   future steps, exact engine phase names, or requiring sequential
   completion. Purely decorative/orienting, derived from already-public
   view-model facts (signalAcknowledged, obtainedEvidence, serviceState). */
import React from 'react';

export function RoomStatus({ viewModel }) {
  const stages = [
    { id: 'noticed', reached: viewModel.signalAcknowledged },
    { id: 'gathering', reached: viewModel.obtainedEvidence.length > 0 || viewModel.hypotheses.length > 0 },
    { id: 'concluding', reached: ['RESUMED', 'ESCALATED'].includes(viewModel.serviceState) || viewModel.documentation.finalDisposition != null },
  ];
  return (
    <div className="mqc-room-status" aria-label="Reasoning progress">
      {stages.map(s => (
        <span key={s.id} className="mqc-room-status__dot" data-reached={s.reached} aria-hidden="true" />
      ))}
    </div>
  );
}
