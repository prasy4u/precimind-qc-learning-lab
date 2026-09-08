/* v09/app/morning-qc/ui/patient-impact-panel.jsx — Stage 12B, PROVENANCE: V09_NEW
   Section 20: visibly distinct from QC signal/root cause/disposition.
   Consumes patientImpactState directly from the engine — never infers
   "affected results" merely because a QC problem occurred. Transitions
   themselves remain evidence-gated by Stage 12A (engine rejection is
   authoritative if the learner attempts a terminal state prematurely). */
import React from 'react';
import { patientImpactLabel } from './ui-model.js';

const REVIEWABLE_TARGETS = {
  NOT_INDICATED: ['INDICATED'],
  INDICATED: ['PENDING'],
  PENDING: ['COMPLETED_NO_AFFECTED_RESULTS', 'AFFECTED_RESULT_SET_IDENTIFIED'],
};

export function PatientImpactPanel({ viewModel, onReview }) {
  const nextTargets = REVIEWABLE_TARGETS[viewModel.patientImpactState] || [];
  return (
    <section aria-label="Patient impact">
      <div className="mqc-reasoning__section-title">Patient Impact</div>
      <p style={{ fontSize: 14 }}>{patientImpactLabel(viewModel.patientImpactState)}</p>
      {nextTargets.map(t => (
        <button key={t} type="button" className="mqc-btn" style={{ marginRight: 8, marginTop: 6 }} onClick={() => onReview(t)}>
          {patientImpactLabel(t)}
        </button>
      ))}
    </section>
  );
}
