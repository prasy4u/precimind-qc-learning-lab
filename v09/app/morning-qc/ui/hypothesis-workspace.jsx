/* v09/app/morning-qc/ui/hypothesis-workspace.jsx — Stage 12B, PROVENANCE: V09_NEW
   Section 18: shows only hypotheses the LEARNER has genuinely considered
   (systemEvents-backed, via the adapter) plus the ability to form a new
   one. Never displays ESTABLISHED as a ground-truth label unless the
   learner's own state has legitimately reached it through evidence
   processing — the state shown IS the real engine hypothesisStates value. */
import React, { useState } from 'react';

const STATE_LABELS = {
  NOT_CONSIDERED: 'Not considered',
  PLAUSIBLE: 'Plausible',
  SUPPORTED: 'Supported',
  ESTABLISHED: 'Established',
  WEAKENED: 'Weakened',
  CONTRADICTED: 'Contradicted',
};

export function HypothesisWorkspace({ viewModel, onFormHypothesis }) {
  const [selecting, setSelecting] = useState(false);
  return (
    <section aria-label="Hypotheses">
      <div className="mqc-reasoning__section-title">Hypotheses</div>
      {viewModel.hypotheses.length === 0 && (
        <p style={{ color: 'var(--text-faint)', fontSize: 13.5 }}>No hypotheses considered yet.</p>
      )}
      {viewModel.hypotheses.map(h => (
        <div key={h.id} className="mqc-hypothesis-chip">
          <div>{h.label}</div>
          <div className="mqc-hypothesis-chip__state">{STATE_LABELS[h.state] || h.state}</div>
        </div>
      ))}
      {viewModel.formableHypotheses.length > 0 && (
        selecting ? (
          <div>
            {viewModel.formableHypotheses.map(h => (
              <button key={h.id} type="button" className="mqc-btn" style={{ display: 'block', width: '100%', marginBottom: 6 }}
                onClick={() => { onFormHypothesis(h.id); setSelecting(false); }}>
                {h.label}
              </button>
            ))}
          </div>
        ) : (
          <button type="button" className="mqc-btn" onClick={() => setSelecting(true)}>Form a hypothesis</button>
        )
      )}
    </section>
  );
}
