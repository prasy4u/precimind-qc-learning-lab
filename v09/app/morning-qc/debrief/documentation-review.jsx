/* v09/app/morning-qc/debrief/documentation-review.jsx — Stage 12C, PROVENANCE: V09_NEW
   Section 10: what you actually did (engine/action history) vs. what
   you documented (learner-authored text) — explicitly never conflated.
   "Documenting an action does not mean the action occurred." */
import React from 'react';

export function DocumentationReview({ documentationVsExecuted }) {
  const d = documentationVsExecuted;
  const mismatch = d.documentedFinalDisposition && d.executedDisposition === null;
  return (
    <section aria-labelledby="mqcd-docreview-heading" className="mqcd-section">
      <h2 id="mqcd-docreview-heading" className="mqcd-section__title">What You Did vs. What You Documented</h2>
      <div className="mqcd-doc-compare">
        <div>
          <h3>What you actually did</h3>
          <p>Service ended in state: {d.actualServiceState}.</p>
          <p>Intervention applied: {d.actualInterventionApplied ? 'Yes' : 'No'}.</p>
        </div>
        <div>
          <h3>What you documented</h3>
          <p>{d.documentedFinalDisposition || 'No final disposition was documented.'}</p>
          {d.documentedEstablishedCause && <p>Established cause noted: {d.documentedEstablishedCause}</p>}
          {d.documentedEscalation && <p>Escalation noted: {d.documentedEscalation}</p>}
        </div>
      </div>
      {mismatch && (
        <p className="mqcd-doc-mismatch">You documented a final disposition, but no genuine disposition action was ever executed — a documented claim is not the same as an executed action.</p>
      )}
    </section>
  );
}
