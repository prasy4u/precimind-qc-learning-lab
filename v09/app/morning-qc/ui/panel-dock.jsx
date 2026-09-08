/* v09/app/morning-qc/ui/panel-dock.jsx — Stage 12B, PROVENANCE: V09_NEW
   Section 8/11: available information sources. Unavailable panels are
   OMITTED entirely (Section 11's preferred treatment) rather than shown
   locked — this also avoids a panel's mere TITLE hinting at what to check
   before the learner has earned that information. A panel newly becomes
   visible here the moment the engine's own availability check flips true,
   which happens naturally as a side effect of legitimate actions elsewhere
   in the room — never because the UI "decided" so.

   Renders only its INNER content — the `<nav className="mqc-dock">`
   wrapper (including the `data-open` drawer-state attribute) is owned by
   room-layout.jsx, since that state is presentation-only React state
   shared with the drawer-toggle controls in room-header.jsx. */
import React from 'react';
import { PanelCard } from './panel-card.jsx';

export function PanelDock({ viewModel, activePanelId, onOpenPanel, onOpenBriefing, briefingActive }) {
  const availablePanels = viewModel.panels.filter(p => p.available);
  return (
    <>
      <div className="mqc-dock__heading">Information</div>
      <button
        type="button"
        className="mqc-panel-card"
        data-active={briefingActive}
        onClick={onOpenBriefing}
        aria-pressed={briefingActive}
      >
        <span className="mqc-panel-card__title">Shift Briefing</span>
      </button>
      {availablePanels.map(p => (
        <PanelCard key={p.id} panel={p} active={p.id === activePanelId} onOpen={onOpenPanel} />
      ))}
    </>
  );
}
