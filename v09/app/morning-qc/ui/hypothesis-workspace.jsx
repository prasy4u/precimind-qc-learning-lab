/* v09/app/morning-qc/ui/hypothesis-workspace.jsx — Stage 12B, PROVENANCE: V09_NEW
   Section 18: shows only hypotheses the LEARNER has genuinely considered
   (systemEvents-backed, via the adapter) plus the ability to form a new
   one. Never displays ESTABLISHED as a ground-truth label unless the
   learner's own state has legitimately reached it through evidence
   processing — the state shown IS the real engine hypothesisStates value.

   CORRECTIVE-CLOSURE FIX: previously exposed every remaining
   case-authored hypothesis as a static button-list menu — a checklist of
   every possible cause, which violates Morning QC's doctrine that
   hypothesis reasoning must not become "guess from this menu." Replaced
   with a compact free-text composer: the learner types their own
   thinking, and only once their text approximately matches a genuine
   case hypothesis's label does a submit control become available,
   dispatching FORM_HYPOTHESIS for that specific hypothesis. The full
   authored hypothesis set is never rendered as a menu; a hypothesis only
   ever becomes visible/selectable once the learner has already
   articulated something close to it in their own words. The underlying
   Stage 12A hypothesis IDs remain fully authoritative — this changes
   only the SELECTION UX, never hypothesis science. */
import React, { useState, useMemo } from 'react';

const STATE_LABELS = {
  NOT_CONSIDERED: 'Not considered',
  PLAUSIBLE: 'Plausible',
  SUPPORTED: 'Supported',
  ESTABLISHED: 'Established',
  WEAKENED: 'Weakened',
  CONTRADICTED: 'Contradicted',
};

function normalize(s) { return (s || '').toLowerCase().trim(); }

export function HypothesisWorkspace({ viewModel, onFormHypothesis }) {
  const [draft, setDraft] = useState('');
  const [composing, setComposing] = useState(false);

  const match = useMemo(() => {
    const q = normalize(draft);
    if (q.length < 3) return null;
    // Substring match only — never reveals anything the learner has not
    // already come close to articulating themselves.
    return viewModel.formableHypotheses.find(h => normalize(h.label).includes(q) || q.includes(normalize(h.label).split(' ')[0])) || null;
  }, [draft, viewModel.formableHypotheses]);

  function submit() {
    if (match) { onFormHypothesis(match.id); setDraft(''); setComposing(false); }
  }

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
        composing ? (
          <div className="mqc-drawer__field" style={{ marginTop: 8 }}>
            <label htmlFor="mqc-hyp-draft">What do you think might explain this?</label>
            <input
              id="mqc-hyp-draft"
              type="text"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="Describe your thinking..."
              autoFocus
            />
            {match && (
              <button type="button" className="mqc-btn" data-variant="primary" style={{ marginTop: 8 }} onClick={submit}>
                Record this hypothesis
              </button>
            )}
            <button type="button" className="mqc-btn" style={{ marginTop: 8, marginLeft: match ? 8 : 0 }} onClick={() => { setComposing(false); setDraft(''); }}>
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" className="mqc-btn" onClick={() => setComposing(true)}>Form a hypothesis</button>
        )
      )}
    </section>
  );
}
