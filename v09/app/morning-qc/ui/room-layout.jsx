/* v09/app/morning-qc/ui/room-layout.jsx — Stage 12B, PROVENANCE: V09_NEW
   Section 8: pure layout — the grid shell only. All simulation/engine
   logic lives elsewhere; this component just arranges children.

   CORRECTIVE-CLOSURE FIX (Section 2): the info dock and reasoning
   workspace are now genuinely controllable drawers below the 1024px
   breakpoint. `infoDrawerOpen`/`reasoningDrawerOpen` are presentation-only
   React state owned by morning-qc-room.jsx (never simulation truth) and
   flow down as `data-open` on each rail plus a conditionally-rendered
   backdrop (click-to-close). Above 1024px these props are irrelevant —
   the CSS three-column grid renders both rails in-flow regardless of
   `data-open`, matching desktop's permanent three-column command layout. */
import React from 'react';

export function RoomLayout({ header, dock, main, reasoning, actions, infoDrawerOpen, reasoningDrawerOpen, onCloseInfoDrawer, onCloseReasoningDrawer }) {
  return (
    <div className="mqc-room">
      {header}
      <nav className="mqc-dock" aria-label="Information sources" data-open={infoDrawerOpen} id="mqc-info-drawer-region">{dock}</nav>
      <main className="mqc-main">{main}</main>
      <aside className="mqc-reasoning" aria-label="Reasoning workspace" data-open={reasoningDrawerOpen} id="mqc-reasoning-drawer-region">{reasoning}</aside>
      {actions}
      {infoDrawerOpen && <div className="mqc-drawer-backdrop" onClick={onCloseInfoDrawer} aria-hidden="true" />}
      {reasoningDrawerOpen && <div className="mqc-drawer-backdrop" onClick={onCloseReasoningDrawer} aria-hidden="true" />}
    </div>
  );
}
