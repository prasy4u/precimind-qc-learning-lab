/* v09/app/morning-qc/ui/room-header.jsx — Stage 12B, PROVENANCE: V09_NEW
   Section 8 top bar: case identity, analyte/system, service state, elapsed
   time, learner level. Never reveals root cause.

   CORRECTIVE-CLOSURE ADDITION (Section 2): concise "Information" /
   "Reasoning" drawer-toggle controls, shown only at <=1024px (hidden via
   CSS on desktop, where both rails already render in-flow). Each carries
   aria-expanded/aria-controls so assistive technology can tell whether
   the corresponding drawer is currently open and which region it governs. */
import React from 'react';
import { ServiceStateBanner } from './service-state-banner.jsx';
import { RoomStatus } from './room-status.jsx';

export function RoomHeader({ viewModel, infoDrawerOpen, reasoningDrawerOpen, onToggleInfoDrawer, onToggleReasoningDrawer }) {
  const { caseIdentity, labContext } = viewModel;
  return (
    <header className="mqc-header">
      <div className="mqc-header__identity">
        <span className="mqc-header__title">Morning QC Room</span>
        <span className="mqc-header__subtitle">{labContext?.analyte || 'Analyte'} · {labContext?.analyticalMethod || ''}</span>
      </div>
      <div className="mqc-header__meta">
        <button
          type="button"
          className="mqc-btn mqc-header__drawer-toggle"
          aria-expanded={infoDrawerOpen}
          aria-controls="mqc-info-drawer-region"
          onClick={onToggleInfoDrawer}
        >
          Information
        </button>
        <RoomStatus viewModel={viewModel} />
        <span className="mqc-header__elapsed" aria-label="Elapsed simulated time">{viewModel.elapsedMinutes} min</span>
        <ServiceStateBanner serviceState={viewModel.serviceState} />
        <button
          type="button"
          className="mqc-btn mqc-header__drawer-toggle"
          aria-expanded={reasoningDrawerOpen}
          aria-controls="mqc-reasoning-drawer-region"
          onClick={onToggleReasoningDrawer}
        >
          Reasoning
        </button>
      </div>
    </header>
  );
}
