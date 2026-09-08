/* v09/app/morning-qc/ui/panel-viewer.jsx — Stage 12B, PROVENANCE: V09_NEW
   Section 9: a reusable viewer for whichever panel is currently open.
   Accepts case data rather than hardcoding any pilot's values (Section 9).
   Content is only ever present on the view-model panel object once the
   adapter has confirmed genuine inspection (see ui-adapter.js).
   Rendering itself is delegated to panel-renderers/index.js's type-aware
   registry (Section 10) — never recalculating or fabricating data here.

   FINAL-UI-INTEGRATION-CLOSURE ADDITION: three panel types
   (PATIENT_RESULT_DISTRIBUTION, EQA, PBRTQC) have a corresponding
   CHECK_PATIENT_DISTRIBUTION / CHECK_EQA / CHECK_PBRTQC engine action
   that is DISTINCT from merely inspecting the panel — some case-authored
   evidence (e.g. Pilot 1's ev-affected-window, Pilot 2's
   ev-case-mix-decisive) is gated specifically behind that action type
   having occurred (availableOnlyAfterActionType), not just the panel
   having been opened. Previously there was NO UI control for this at
   all, making those evidence items permanently unreachable through the
   interface. A "Formally check" button now offers this distinct action
   when viewing one of these three panel types. */
import React from 'react';
import { panelTypeLabel } from './ui-model.js';
import { renderPanelContent } from './panel-renderers/index.js';

const CHECK_ACTION_FOR_TYPE = {
  PATIENT_RESULT_DISTRIBUTION: 'CHECK_PATIENT_DISTRIBUTION',
  EQA: 'CHECK_EQA',
  PBRTQC: 'CHECK_PBRTQC',
};

export function PanelViewer({ panel, onRequestEvidence, requestableForThisPanel, onCheckPanelType }) {
  if (!panel) {
    return (
      <div className="mqc-empty-state">
        No information source is open. Choose something from the list on the left,
        or review the shift briefing.
      </div>
    );
  }
  const checkActionType = CHECK_ACTION_FOR_TYPE[panel.type];
  return (
    <div className="mqc-panel-viewer">
      <h2 className="mqc-panel-viewer__title">{panelTypeLabel(panel.type)}</h2>
      {panel.provenance && <p className="mqc-panel-viewer__provenance">Source: {panel.provenance}</p>}
      <div className="mqc-panel-viewer__body">
        {renderPanelContent(panel)}
      </div>
      {checkActionType && (
        <div style={{ marginTop: 16 }}>
          <button type="button" className="mqc-btn" onClick={() => onCheckPanelType(checkActionType)}>
            Formally check {panelTypeLabel(panel.type)}
          </button>
        </div>
      )}
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
