/* v09/app/morning-qc/ui/panel-card.jsx — Stage 12B, PROVENANCE: V09_NEW */
import React from 'react';
import { panelTypeLabel } from './ui-model.js';

export function PanelCard({ panel, active, onOpen }) {
  return (
    <button
      type="button"
      className="mqc-panel-card"
      data-active={active}
      data-inspected={panel.inspected}
      onClick={() => onOpen(panel.id)}
      aria-pressed={active}
    >
      <span className="mqc-panel-card__title">
        <span className="mqc-panel-card__dot" aria-hidden="true" />
        {panelTypeLabel(panel.type)}
      </span>
    </button>
  );
}
