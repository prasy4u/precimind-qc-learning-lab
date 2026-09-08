/* v09/app/morning-qc/ui/hypothesis-workspace.jsx — Stage 12B, PROVENANCE: V09_NEW
   Section 18: shows only hypotheses the LEARNER has genuinely considered
   (systemEvents-backed, via the adapter) plus the ability to form a new
   one. Never displays ESTABLISHED as a ground-truth label unless the
   learner's own state has legitimately reached it through evidence
   processing — the state shown IS the real engine hypothesisStates value.

   FINAL-UI-INTEGRATION-CLOSURE FIX: the free-text composer's matching
   algorithm was replaced (see hypothesis-matcher.js) after independent
   audit reproduced confirmed wrong matches from the prior naive
   substring/first-word matcher (e.g. "calibration problem" incorrectly
   resolving to hyp-population). The new matcher requires a UNIQUELY
   credible, IDF-weighted token-overlap match and never silently guesses
   on a tie or a stopword-only query — when the match is absent or
   ambiguous, a neutral "refine your wording" state is shown instead of
   ever revealing the hidden hypothesis catalogue.

   FURTHER FIX (found while building the browser E2E test): some
   case-authored decision options carry actionType FORM_HYPOTHESIS (e.g.
   Pilot 2's dec-take-seriously/opt-investigate) but do NOT embed a
   hypothesisId of their own — Stage 12A's own accepted pilot-path tests
   supply hypothesisId as a SEPARATE, explicit argument alongside
   decisionId/optionId when dispatching these, meaning the caller is
   expected to independently determine which hypothesis is meant. This
   workspace now accepts an optional `pendingDecision` ({decisionId,
   optionId}) — when morning-qc-room.jsx has a decision awaiting a
   hypothesisId, this composer opens automatically, and once the
   learner's own wording uniquely matches a real hypothesis (via the
   SAME matcher used for freestanding hypothesis formation — no separate
   logic), the resulting dispatch carries decisionId/optionId/hypothesisId
   together. This never bare-dispatches FORM_HYPOTHESIS without a
   resolved hypothesisId, closing the same class of defect Section 1
   targeted in the plain ActionDock case. */
import React, { useState, useMemo, useEffect } from 'react';
import { findUniqueHypothesisMatch } from './hypothesis-matcher.js';

const STATE_LABELS = {
  NOT_CONSIDERED: 'Not considered',
  PLAUSIBLE: 'Plausible',
  SUPPORTED: 'Supported',
  ESTABLISHED: 'Established',
  WEAKENED: 'Weakened',
  CONTRADICTED: 'Contradicted',
};

export function HypothesisWorkspace({ viewModel, onFormHypothesis, pendingDecision }) {
  const [draft, setDraft] = useState('');
  const [composing, setComposing] = useState(false);
  const [touched, setTouched] = useState(false);

  // A pending decision (case-authored option with actionType
  // FORM_HYPOTHESIS but no embedded hypothesisId) forces the composer
  // open automatically — the learner must still articulate WHICH
  // hypothesis in their own words before the combined action dispatches.
  useEffect(() => {
    if (pendingDecision) setComposing(true);
  }, [pendingDecision]);

  const match = useMemo(() => {
    if (draft.trim().length < 3) return null;
    return findUniqueHypothesisMatch(draft, viewModel.formableHypotheses);
  }, [draft, viewModel.formableHypotheses]);

  const showRefineState = touched && draft.trim().length >= 3 && !match;

  function submit() {
    if (!match) return;
    if (pendingDecision) onFormHypothesis(match.id, pendingDecision);
    else onFormHypothesis(match.id);
    setDraft(''); setComposing(false); setTouched(false);
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
            <label htmlFor="mqc-hyp-draft">
              {pendingDecision ? 'This decision requires identifying the hypothesis — what do you think is happening?' : 'What do you think might explain this?'}
            </label>
            <input
              id="mqc-hyp-draft"
              type="text"
              value={draft}
              onChange={e => { setDraft(e.target.value); setTouched(true); }}
              placeholder="Describe your thinking..."
              autoFocus
            />
            {match && (
              <button type="button" className="mqc-btn" data-variant="primary" style={{ marginTop: 8 }} onClick={submit}>
                Record this hypothesis
              </button>
            )}
            {showRefineState && (
              <p role="status" style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
                That wording isn't specific enough yet to record as a distinct hypothesis — try describing what you think is actually happening, in more concrete terms.
              </p>
            )}
            {!pendingDecision && (
              <button type="button" className="mqc-btn" style={{ marginTop: 8, marginLeft: match ? 8 : 0 }} onClick={() => { setComposing(false); setDraft(''); setTouched(false); }}>
                Cancel
              </button>
            )}
          </div>
        ) : (
          <button type="button" className="mqc-btn" onClick={() => setComposing(true)}>Form a hypothesis</button>
        )
      )}
    </section>
  );
}
