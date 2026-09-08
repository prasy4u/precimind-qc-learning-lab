/* v09/app/morning-qc/ui/room-layout.jsx — Stage 12B, PROVENANCE: V09_NEW
   Section 8: pure layout — the grid shell only. All simulation/engine
   logic lives elsewhere; this component just arranges children.

   CORRECTIVE-CLOSURE FIX (Section 2): the info dock and reasoning
   workspace are now genuinely controllable drawers below the 1024px
   breakpoint, via `infoDrawerOpen`/`reasoningDrawerOpen` presentation
   state.

   FINAL-UI-INTEGRATION-CLOSURE FIX (Section 7): each rail is now wrapped
   in DrawerRegion, giving it a genuine focus trap, visible Close
   control, and modal dialog semantics ONLY while open (i.e. only ever in
   normal use below 1024px) — desktop's permanent three-column behavior
   is unaffected, since these props are never true there in normal use. */
import React from 'react';
import { DrawerRegion } from './drawer-region.jsx';

export function RoomLayout({ header, dock, main, reasoning, actions, infoDrawerOpen, reasoningDrawerOpen, onCloseInfoDrawer, onCloseReasoningDrawer, infoToggleRef, reasoningToggleRef }) {
  return (
    <div className="mqc-room">
      {header}
      <DrawerRegion
        as="nav"
        id="mqc-info-drawer-region"
        label="Information sources"
        open={infoDrawerOpen}
        onClose={onCloseInfoDrawer}
        returnFocusRef={infoToggleRef}
        extraProps={{ className: 'mqc-dock' }}
      >
        {dock}
      </DrawerRegion>
      <main className="mqc-main">{main}</main>
      <DrawerRegion
        as="aside"
        id="mqc-reasoning-drawer-region"
        label="Reasoning workspace"
        open={reasoningDrawerOpen}
        onClose={onCloseReasoningDrawer}
        returnFocusRef={reasoningToggleRef}
        extraProps={{ className: 'mqc-reasoning' }}
      >
        {reasoning}
      </DrawerRegion>
      {actions}
      {infoDrawerOpen && <div className="mqc-drawer-backdrop" onClick={onCloseInfoDrawer} aria-hidden="true" />}
      {reasoningDrawerOpen && <div className="mqc-drawer-backdrop" onClick={onCloseReasoningDrawer} aria-hidden="true" />}
    </div>
  );
}
