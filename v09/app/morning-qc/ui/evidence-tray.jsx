/* v09/app/morning-qc/ui/evidence-tray.jsx — Stage 12B, PROVENANCE: V09_NEW
   Section 19: only genuinely obtained evidence, showing only finding/
   source/time — never decisive/relevance/interpretationLimits/hypothesis
   linkage, which the adapter already omits from the view model.

   FINAL-UI-INTEGRATION-CLOSURE FIX: evidence with no sourcePanelId (not
   tied to any specific panel — e.g. Pilot 1's ev-old-lot-repeat, Pilot
   2's ev-case-mix-decisive, gated instead behind a prior action type
   like REPEAT_QC/CHECK_PATIENT_DISTRIBUTION having occurred) previously
   had NO UI surface at all: PanelViewer's request buttons are filtered
   to the currently-open panel, and Briefing (shown when no panel is
   open) never rendered request buttons either — making this evidence
   permanently unreachable through the interface. This tray, which is
   always reachable regardless of which panel is open, now also shows a
   persistent "Other evidence available" section for exactly this
   category, keeping the per-panel evidence flow in PanelViewer
   unchanged for evidence that IS tied to a specific panel. */
import React from 'react';

export function EvidenceTray({ viewModel, otherRequestableEvidence, onRequestEvidence }) {
  return (
    <section aria-label="Evidence obtained">
      <div className="mqc-reasoning__section-title">Evidence Obtained</div>
      {viewModel.obtainedEvidence.length === 0 && (
        <p style={{ color: 'var(--text-faint)', fontSize: 13.5 }}>No evidence obtained yet.</p>
      )}
      {viewModel.obtainedEvidence.map(e => (
        <div key={e.id} className="mqc-evidence-item">
          <div>{e.finding}</div>
          <div className="mqc-evidence-item__source">{e.source}</div>
        </div>
      ))}
      {otherRequestableEvidence && otherRequestableEvidence.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div className="mqc-reasoning__section-title" style={{ fontSize: 12 }}>Other Evidence Available</div>
          {otherRequestableEvidence.map(ev => (
            <button key={ev.id} type="button" className="mqc-btn" style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 6 }} onClick={() => onRequestEvidence(ev.id)}>
              Request: {ev.source}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
