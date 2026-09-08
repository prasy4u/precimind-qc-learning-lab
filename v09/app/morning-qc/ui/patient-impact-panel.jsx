/* v09/app/morning-qc/ui/patient-impact-panel.jsx — Stage 12B, PROVENANCE: V09_NEW
   Section 20: visibly distinct from QC signal/root cause/disposition.
   Consumes patientImpactState directly from the engine — never infers
   "affected results" merely because a QC problem occurred. Transitions
   themselves remain evidence-gated by Stage 12A (engine rejection is
   authoritative if the learner attempts a terminal state prematurely).

   CORRECTIVE-CLOSURE FIX: previously hardcoded a second, local copy of
   the legal-transition table (REVIEWABLE_TARGETS) — a duplicate of
   Stage 12A's own PATIENT_IMPACT_TRANSITIONS that could silently drift
   out of sync (it was in fact already missing the
   AFFECTED_RESULT_SET_IDENTIFIED -> ESCALATION_REQUIRED transition).
   Now imports PATIENT_IMPACT_TRANSITIONS directly from states.js — a
   read-only reference to the single Stage 12A authority, not a second
   copy. Engine rejection remains the final guard regardless. */
import React from 'react';
import { patientImpactLabel } from './ui-model.js';
import { PATIENT_IMPACT_TRANSITIONS } from '../states.js';

export function PatientImpactPanel({ viewModel, onReview }) {
  const nextTargets = PATIENT_IMPACT_TRANSITIONS[viewModel.patientImpactState] || [];
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
