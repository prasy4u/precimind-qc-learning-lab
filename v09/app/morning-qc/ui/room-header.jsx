/* v09/app/morning-qc/ui/room-header.jsx — Stage 12B, PROVENANCE: V09_NEW
   Section 8 top bar: case identity, analyte/system, service state, elapsed
   time, learner level. Never reveals root cause. */
import React from 'react';
import { ServiceStateBanner } from './service-state-banner.jsx';
import { RoomStatus } from './room-status.jsx';

export function RoomHeader({ viewModel }) {
  const { caseIdentity, labContext } = viewModel;
  return (
    <header className="mqc-header">
      <div className="mqc-header__identity">
        <span className="mqc-header__title">Morning QC Room</span>
        <span className="mqc-header__subtitle">{labContext?.analyte || 'Analyte'} · {labContext?.analyticalMethod || ''}</span>
      </div>
      <div className="mqc-header__meta">
        <RoomStatus viewModel={viewModel} />
        <span className="mqc-header__elapsed" aria-label="Elapsed simulated time">{viewModel.elapsedMinutes} min</span>
        <ServiceStateBanner serviceState={viewModel.serviceState} />
      </div>
    </header>
  );
}
