/* v09/app/morning-qc/ui/evidence-tray.jsx — Stage 12B, PROVENANCE: V09_NEW
   Section 19: only genuinely obtained evidence, showing only finding/
   source/time — never decisive/relevance/interpretationLimits/hypothesis
   linkage, which the adapter already omits from the view model. */
import React from 'react';

export function EvidenceTray({ viewModel }) {
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
    </section>
  );
}
