/* v09/app/morning-qc/debrief/evidence-review.jsx — Stage 12C, PROVENANCE: V09_NEW
   Section 14: qualitative framing, never "8/10 panels opened". */
import React from 'react';

export function EvidenceReview({ evidenceReview }) {
  const { obtained, highValueMissed, relevantPanelsUninspected } = evidenceReview;
  return (
    <section aria-labelledby="mqcd-evidence-heading" className="mqcd-section">
      <h2 id="mqcd-evidence-heading" className="mqcd-section__title">Evidence &amp; Information Use</h2>
      <p>
        {obtained.highValueObtainedCount > 0 && obtained.lowValueObtainedCount === 0
          ? 'Selective and targeted — you obtained decisive evidence without spending time on low-value information.'
          : obtained.highValueObtainedCount > 0
            ? 'Broad but reasonably focused information gathering.'
            : 'Limited evidence was obtained this case.'}
      </p>
      {highValueMissed.length > 0 && (
        <p className="mqcd-evidence-missed">Some high-value evidence was never obtained — this may have limited how well-supported your later decisions could be.</p>
      )}
    </section>
  );
}
