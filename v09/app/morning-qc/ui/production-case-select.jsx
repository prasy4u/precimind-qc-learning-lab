/* =========================================================================
   v09/app/morning-qc/ui/production-case-select.jsx

   Morning QC Room — Stage 12C Production Case Selection
   PROVENANCE: V09_NEW

   Section 26/27: production-facing case selection — NOT the development
   launcher (dev-launcher.jsx remains isolated to v09/dev/ and is never
   imported here). Uses neutral, non-case-ID labels and NEVER the raw
   case identity.title fields, since several of those directly reveal
   root cause in their subtitle (e.g. Pilot 1's "...After Reagent Lot
   Change") — appropriate for an internal audit/dev artifact, not for a
   learner about to attempt the case. This mapping is presentation-only;
   it does not alter case data, competency mapping, or scientific content.
   ========================================================================= */
import React, { useState } from 'react';
import { MorningQCRoom } from './morning-qc-room.jsx';

// Neutral, non-revealing operational framing per case — difficulty/
// competency focus shown, cause/decisive evidence/pathway never shown.
const PRODUCTION_CASE_META = {
  'pilot-1-reagent-lot-shift': {
    displayTitle: 'Morning QC Room — Glucose Level 2 QC Investigation',
    focus: 'Signal recognition, containment, and investigation',
  },
  'pilot-2-pbrtqc-population-shift': {
    displayTitle: 'Morning QC Room — PBRTQC Moving-Mean Alert',
    focus: 'Statistical interpretation and evidence-based disposition',
  },
  'pilot-3-rcv-patient-impact': {
    displayTitle: 'Morning QC Room — Serial Patient Result Review',
    focus: 'RCV interpretation and patient-impact reasoning',
  },
};

export function ProductionCaseSelect({ cases, onReturn }) {
  const [selectedId, setSelectedId] = useState(null);
  const selected = cases.find(c => c.identity.id === selectedId) || null;

  if (selected) {
    return (
      <MorningQCRoom
        key={selected.identity.id}
        caseObj={selected}
        onAnotherCase={() => setSelectedId(null)}
        onReturn={onReturn}
      />
    );
  }

  return (
    <div className="mqc-case-select">
      <h1 className="mqc-case-select__title">Morning QC Room</h1>
      <p className="mqc-case-select__intro">
        An integrated decision simulation across QC, investigation, patient risk, and release —
        choose a case to begin.
      </p>
      <div className="mqc-case-select__grid">
        {cases.map(c => {
          const meta = PRODUCTION_CASE_META[c.identity.id] || { displayTitle: c.identity.id, focus: '' };
          return (
            <button
              key={c.identity.id}
              type="button"
              className="mqc-case-select__card"
              onClick={() => setSelectedId(c.identity.id)}
            >
              <span className="mqc-case-select__card-title">{meta.displayTitle}</span>
              <span className="mqc-case-select__card-focus">{meta.focus}</span>
              <span className="mqc-case-select__card-difficulty">{(c.identity.difficulty || '').replace(/_/g, ' ')}</span>
            </button>
          );
        })}
      </div>
      {onReturn && (
        <button type="button" className="mqc-btn" style={{ marginTop: 20 }} onClick={onReturn}>
          Return to PreciMind
        </button>
      )}
    </div>
  );
}
