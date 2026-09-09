/* v09/app/morning-qc/debrief/patient-safety-review.jsx — Stage 12C, PROVENANCE: V09_NEW
   Section 17: explicit distinction between QC signal, analytical
   disturbance, root cause, patient impact, and disposition — never
   merged into a single "safety score". */
import React from 'react';
import { patientImpactStatusLabel } from './debrief-model-ui.js';

export function PatientSafetyReview({ patientSafetyReview }) {
  const p = patientSafetyReview;
  return (
    <section aria-labelledby="mqcd-safety-heading" className="mqcd-section">
      <h2 id="mqcd-safety-heading" className="mqcd-section__title">Patient Safety Review</h2>
      <dl className="mqcd-safety-facts">
        <dt>Containment</dt>
        <dd>{p.containmentTimely === true ? 'Timely' : p.containmentTimely === false ? 'Occurred before signal acknowledgement' : 'Not recorded'}</dd>
        <dt>Patient impact</dt>
        <dd>{patientImpactStatusLabel(p.patientImpactFinalState)}</dd>
        <dt>Verification</dt>
        <dd>{p.verificationAttempted ? (p.verificationAdequate ? 'Attempted and adequate' : 'Attempted but not adequate') : 'Not attempted'}</dd>
      </dl>
      <p>{p.verificationNote}</p>
    </section>
  );
}
