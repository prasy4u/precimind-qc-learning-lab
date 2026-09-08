/* =========================================================================
   v09/app/morning-qc/ui/morning-qc-room.jsx

   Morning QC Room — Stage 12B Root Component
   PROVENANCE: V09_NEW

   The single stateful root. Holds ONE authoritative controller (created
   via ui-adapter.js's createRoomController) per mounted case — React
   state here is presentation-only (which panel/drawer is open, dialog
   visibility), never a second copy of simulation truth (Section 7).
   Re-render is driven by re-reading controller.getViewModel() after every
   dispatch.

   Section 35 (fresh state on case switch): callers MUST remount this
   component with a `key` derived from the case identity when switching
   cases (see dev-launcher.jsx) — remounting guarantees a brand-new
   controller and zero carried-over local state, by construction.
   ========================================================================= */
import React, { useMemo, useState, useCallback, useRef } from 'react';
import { createRoomController } from '../ui-adapter.js';
import { RoomLayout } from './room-layout.jsx';
import { RoomHeader } from './room-header.jsx';
import { PanelDock } from './panel-dock.jsx';
import { PanelViewer } from './panel-viewer.jsx';
import { CaseBriefing } from './case-briefing.jsx';
import { HypothesisWorkspace } from './hypothesis-workspace.jsx';
import { EvidenceTray } from './evidence-tray.jsx';
import { PatientImpactPanel } from './patient-impact-panel.jsx';
import { ActionDock } from './action-dock.jsx';
import { DecisionDialog } from './decision-dialog.jsx';
import { ConfidenceControl } from './confidence-control.jsx';
import { DocumentationDrawer } from './documentation-drawer.jsx';
import { EventTimeline } from './event-timeline.jsx';

export function MorningQCRoom({ caseObj }) {
  const controller = useMemo(() => createRoomController(caseObj), [caseObj]);
  const [viewModel, setViewModel] = useState(() => controller.getViewModel());
  const [lastError, setLastError] = useState(null);
  const [openPanelId, setOpenPanelId] = useState(null);
  const [briefingActive, setBriefingActive] = useState(true);
  const [activeDecision, setActiveDecision] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lastDecisionEventId, setLastDecisionEventId] = useState(null);
  const decisionInvokerRef = useRef(null);
  const documentationInvokerRef = useRef(null);

  const refresh = useCallback(() => setViewModel(controller.getViewModel()), [controller]);

  const dispatch = useCallback((action) => {
    const outcome = controller.dispatch(action);
    setLastError(outcome.error);
    refresh();
    return outcome;
  }, [controller, refresh]);

  const openPanel = useCallback((panelId) => {
    setBriefingActive(false);
    const outcome = dispatch({ type: 'INSPECT_PANEL', panelId });
    if (!outcome.error) setOpenPanelId(panelId);
    else setOpenPanelId(panelId); // still show the (empty) viewer so the error is visible in context
  }, [dispatch]);

  const openBriefing = useCallback(() => { setBriefingActive(true); setOpenPanelId(null); }, []);

  const requestEvidence = useCallback((evidenceId) => { dispatch({ type: 'REQUEST_EVIDENCE', evidenceId }); }, [dispatch]);

  const formHypothesis = useCallback((hypothesisId) => { dispatch({ type: 'FORM_HYPOTHESIS', hypothesisId }); }, [dispatch]);

  const reviewPatientImpact = useCallback((targetState) => { dispatch({ type: 'REVIEW_PATIENT_IMPACT', targetState }); }, [dispatch]);

  const openDecision = useCallback((decision, invokerEl) => {
    decisionInvokerRef.current = invokerEl || null;
    setActiveDecision(decision);
  }, []);

  const chooseDecisionOption = useCallback((decisionId, option) => {
    const outcome = dispatch({ type: option.actionType, decisionId, optionId: option.id, fields: {} });
    setActiveDecision(null);
    if (!outcome.error && outcome.decisionEventId) setLastDecisionEventId(outcome.decisionEventId);
  }, [dispatch]);

  const recordConfidence = useCallback((decisionEventId, confidence) => {
    dispatch({ type: 'RECORD_CONFIDENCE', decisionEventId, confidence });
  }, [dispatch]);

  const submitDocumentation = useCallback((fields) => {
    dispatch({ type: 'DOCUMENT', fields });
    setDrawerOpen(false);
  }, [dispatch]);

  const openPanelObj = viewModel.panels.find(p => p.id === openPanelId) || null;
  const requestableForOpenPanel = viewModel.requestableEvidence.filter(ev => {
    const evDef = (caseObj.evidence || []).find(e => e.id === ev.id);
    return evDef && evDef.sourcePanelId === openPanelId;
  });
  const existingConfidenceForLast = lastDecisionEventId
    ? (viewModel.confidenceRecords.find(c => c.decisionEventId === lastDecisionEventId)?.confidence || null)
    : null;

  return (
    <div className="mqc-morning-qc-room" data-testid="morning-qc-room">
      {lastError && <div className="mqc-error-banner" role="alert">{lastError}</div>}
      <RoomLayout
        header={<RoomHeader viewModel={viewModel} />}
        dock={
          <PanelDock
            viewModel={viewModel}
            activePanelId={openPanelId}
            onOpenPanel={openPanel}
            onOpenBriefing={openBriefing}
            briefingActive={briefingActive}
          />
        }
        main={
          briefingActive
            ? <CaseBriefing viewModel={viewModel} />
            : <PanelViewer panel={openPanelObj} onRequestEvidence={requestEvidence} requestableForThisPanel={requestableForOpenPanel} />
        }
        reasoning={
          <>
            <HypothesisWorkspace viewModel={viewModel} onFormHypothesis={formHypothesis} />
            <EvidenceTray viewModel={viewModel} />
            <PatientImpactPanel viewModel={viewModel} onReview={reviewPatientImpact} />
            {lastDecisionEventId && (
              <ConfidenceControl
                decisionEventId={lastDecisionEventId}
                existingConfidence={existingConfidenceForLast}
                onRecordConfidence={recordConfidence}
              />
            )}
            <section aria-label="Event history">
              <div className="mqc-reasoning__section-title">Timeline</div>
              <EventTimeline viewModel={viewModel} />
            </section>
          </>
        }
        actions={
          <ActionDock
            viewModel={viewModel}
            onDispatch={dispatch}
            onOpenDecision={(decision) => openDecision(decision, document.activeElement)}
            onOpenDocumentation={() => { documentationInvokerRef.current = document.activeElement; setDrawerOpen(true); }}
          />
        }
      />
      {activeDecision && (
        <DecisionDialog
          decision={activeDecision}
          onChoose={chooseDecisionOption}
          onClose={() => setActiveDecision(null)}
          returnFocusRef={decisionInvokerRef}
        />
      )}
      <DocumentationDrawer
        open={drawerOpen}
        documentation={viewModel.documentation}
        onClose={() => setDrawerOpen(false)}
        onSubmit={submitDocumentation}
        returnFocusRef={documentationInvokerRef}
      />
    </div>
  );
}
