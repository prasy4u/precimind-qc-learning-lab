/* v09/app/morning-qc/ui/case-briefing.jsx — Stage 12B, PROVENANCE: V09_NEW
   Section 13: contains only information legitimately available at
   BRIEFING — lab/analyte identity and operational framing. Never includes
   root cause, decisive evidence, or answer-key wording. Remains accessible
   throughout the case (it is simply another content view, not a gate). */
import React from 'react';

export function CaseBriefing({ viewModel }) {
  const { labContext, caseIdentity } = viewModel;
  return (
    <div className="mqc-panel-viewer">
      <h2 className="mqc-panel-viewer__title">Shift Briefing</h2>
      <p className="mqc-panel-viewer__provenance">Start of shift · {labContext?.analyte}</p>
      <div className="mqc-panel-viewer__body">
        <p>You are beginning a shift covering <strong>{labContext?.analyte}</strong>, run on {labContext?.analyticalMethod}.</p>
        <p>QC strategy in effect: {labContext?.qcStrategy || 'as configured for this analyzer.'}</p>
        <p>Review the information available to you on the left before deciding whether anything warrants attention.</p>
      </div>
    </div>
  );
}
