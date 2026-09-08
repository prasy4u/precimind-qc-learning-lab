/* =========================================================================
   v09/app/morning-qc/ui/morning-qc-room.jsx

   Morning QC Room — Stage 12B Root Component
   PROVENANCE: V09_NEW

   The single stateful root. Holds ONE authoritative controller (created
   via ui-adapter.js's createRoomController) per mounted case — React
   state here is presentation-only (which panel/drawer is open, dialog
   visibility, drawer open/closed), never a second copy of simulation
   truth (Section 7). Re-render is driven by re-reading
   controller.getViewModel() after every dispatch.

   CORRECTIVE-CLOSURE ADDITION (Section 2): infoDrawerOpen/
   reasoningDrawerOpen — legitimate presentation-only state controlling
   the two side rails' mobile/tablet drawer behavior. Opening one closes
   the other (only one overlay needs to be open at a time on narrow
   screens, per the audit). Escape closes whichever is open.

   Section 35 (fresh state on case switch): callers MUST remount this
   component with a `key` derived from the case identity when switching
   cases (see dev-launcher.jsx) — remounting guarantees a brand-new
   controller and zero carried-over local OR presentation state, by
   construction (this now includes the drawer-open state, verified in
   ui-component.test.cjs's reset test).
   ========================================================================= */
import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { createRoomController } from './ui-adapter.js';
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
  const [infoDrawerOpen, setInfoDrawerOpen] = useState(false);
  const [reasoningDrawerOpen, setReasoningDrawerOpen] = useState(false);
  const decisionInvokerRef = useRef(null);
  const documentationInvokerRef = useRef(null);

  const refresh = useCallback(() => setViewModel(controller.getViewModel()), [controller]);

  const dispatch = useCallback((action) => {
    const outcome = controller.dispatch(action);
    setLastError(outcome.error);
    refresh();
    return outcome;
  }, [controller, refresh]);

  const toggleInfoDrawer = useCallback(() => {
    setInfoDrawerOpen(prev => !prev);
    setReasoningDrawerOpen(false); // mutual exclusion — only one overlay open at a time
  }, []);
  const toggleReasoningDrawer = useCallback(() => {
    setReasoningDrawerOpen(prev => !prev);
    setInfoDrawerOpen(false);
  }, []);
  const closeInfoDrawer = useCallback(() => setInfoDrawerOpen(false), []);
  const closeReasoningDrawer = useCallback(() => setReasoningDrawerOpen(false), []);

  // Escape closes whichever drawer is open (decision dialog / documentation
  // drawer already implement their own Escape handling independently).
  useEffect(() => {
    if (!infoDrawerOpen && !reasoningDrawerOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') { setInfoDrawerOpen(false); setReasoningDrawerOpen(false); }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [infoDrawerOpen, reasoningDrawerOpen]);

  const openPanel = useCallback((panelId) => {
    setBriefingActive(false);
    const outcome = dispatch({ type: 'INSPECT_PANEL', panelId });
    setOpenPanelId(panelId);
    setInfoDrawerOpen(false); // selecting a panel closes the mobile info drawer
    return outcome;
  }, [dispatch]);

  const openBriefing = useCallback(() => { setBriefingActive(true); setOpenPanelId(null); setInfoDrawerOpen(false); }, []);

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
        header={
          <RoomHeader
            viewModel={viewModel}
            infoDrawerOpen={infoDrawerOpen}
            reasoningDrawerOpen={reasoningDrawerOpen}
            onToggleInfoDrawer={toggleInfoDrawer}
            onToggleReasoningDrawer={toggleReasoningDrawer}
          />
        }
        infoDrawerOpen={infoDrawerOpen}
        reasoningDrawerOpen={reasoningDrawerOpen}
        onCloseInfoDrawer={closeInfoDrawer}
        onCloseReasoningDrawer={closeReasoningDrawer}
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
