/* v09/app/morning-qc/debrief/debrief-header.jsx — Stage 12C, PROVENANCE: V09_NEW
   Section 28: visually distinct from active-case state — reflection,
   not operational uncertainty. Reuses Stage 12B's header visual language
   (mqc-header) with a debrief-specific modifier class. */
import React from 'react';

export function DebriefHeader({ caseIdentity }) {
  return (
    <header className="mqc-header mqcd-header">
      <div className="mqc-header__identity">
        <span className="mqc-header__title">Case Debrief</span>
        <span className="mqc-header__subtitle">{caseIdentity?.title || 'Morning QC Room'}</span>
      </div>
      <div className="mqcd-header__badge">Review &amp; Reflection</div>
    </header>
  );
}
