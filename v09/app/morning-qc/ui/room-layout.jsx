/* v09/app/morning-qc/ui/room-layout.jsx — Stage 12B, PROVENANCE: V09_NEW
   Section 8: pure layout — the grid shell only. All simulation/engine
   logic lives elsewhere; this component just arranges children. */
import React from 'react';

export function RoomLayout({ header, dock, main, reasoning, actions }) {
  return (
    <div className="mqc-room">
      {header}
      {dock}
      <main className="mqc-main">{main}</main>
      <aside className="mqc-reasoning" aria-label="Reasoning workspace">{reasoning}</aside>
      {actions}
    </div>
  );
}
