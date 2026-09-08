/* v09/app/morning-qc/ui/panel-viewer.jsx — Stage 12B, PROVENANCE: V09_NEW
   Section 9: a reusable viewer for whichever panel is currently open.
   Accepts case data rather than hardcoding any pilot's values (Section 9).
   Content is only ever present on the view-model panel object once the
   adapter has confirmed genuine inspection (see ui-adapter.js).
   Rendering itself is delegated to panel-renderers/index.js's type-aware
   registry (Section 10) — never recalculating or fabricating data here. */
import React from 'react';
import { panelTypeLabel } from './ui-model.js';
import { renderPanelContent } from './panel-renderers/index.js';

export function PanelViewer({ panel, onRequestEvidence, requestableForThisPanel }) {
  if (!panel) {
    return (
      <div className="mqc-empty-state">
        No information source is open. Choose something from the list on the left,
        or review the shift briefing.
      </div>
    );
  }
  return (
    <div className="mqc-panel-viewer">
      <h2 className="mqc-panel-viewer__title">{panelTypeLabel(panel.type)}</h2>
      {panel.provenance && <p className="mqc-panel-viewer__provenance">Source: {panel.provenance}</p>}
      <div className="mqc-panel-viewer__body">
        {renderPanelContent(panel)}
      </div>
      {requestableForThisPanel && requestableForThisPanel.length > 0 && (
        <div style={{ marginTop: 16 }}>
          {requestableForThisPanel.map(ev => (
            <button key={ev.id} type="button" className="mqc-btn" onClick={() => onRequestEvidence(ev.id)}>
              Request: {ev.source}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
