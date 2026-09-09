/* v09/app/morning-qc/debrief/case-resolution.jsx — Stage 12C, PROVENANCE: V09_NEW
   Section 9: a concise professional synthesis, not a giant numerical
   score. Every sentence derives from the debrief-adapter projection
   (case/debrief model) — nothing is hardcoded per pilot in this
   component. */
import React from 'react';
import { patientImpactStatusLabel } from './debrief-model-ui.js';

export function CaseResolution({ caseResolution }) {
  const r = caseResolution;
  return (
    <section aria-labelledby="mqcd-case-resolution-heading" className="mqcd-section">
      <h2 id="mqcd-case-resolution-heading" className="mqcd-section__title">Case Resolution</h2>
      <div className="mqcd-resolution-card">
        {r.disturbanceDescription && <p>{r.disturbanceDescription}</p>}
        {r.rootCauseDescription && <p>{r.rootCauseDescription}</p>}
        {r.signalExplanationDescription && <p>{r.signalExplanationDescription}</p>}
        <dl className="mqcd-resolution-facts">
          <dt>Patient impact</dt><dd>{patientImpactStatusLabel(r.patientImpactStatus)}</dd>
          <dt>Verification</dt><dd>{r.verificationAdequate ? 'Adequate before disposition' : 'Not adequately completed'}</dd>
          <dt>Final service state</dt><dd>{r.actualServiceState}</dd>
        </dl>
      </div>
    </section>
  );
}
