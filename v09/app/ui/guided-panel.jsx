/* =========================================================================
   app/ui/guided-panel.jsx — Guided Learning scaffolding
   PROVENANCE: V09_NEW (v1.0 RC remediation, Workstreams 4 and 5)

   Presentational scaffolding rendered above and below a module when the
   learner is in guided mode. It adds only what the learner-journey audit
   found missing — position, goal, what to do, completion criterion,
   takeaway and onward navigation — and changes no laboratory.

   Guided mode is scaffolding, never restriction: the global navigation
   remains fully available, no module is locked, nothing is persisted and
   no account is required. The hash remains the single source of truth for
   which screen is shown.
   ========================================================================= */
import { useState } from "react";
import { GUIDED_PATH, GUIDED_TOTAL } from "./guided-path.js";

/** Header: position, learning goal and what to do. */
export function GuidedHeader({ step, goto, onExit }) {
  const s = GUIDED_PATH[step];
  if (!s) return null;
  return (
    <section className="guided-panel guided-panel--header" aria-label="Guided learning: this step" data-testid="guided-header">
      <div className="guided-bar">
        <span className="guided-position" data-testid="guided-position">
          Step {step + 1} of {GUIDED_TOTAL} &middot; {s.label}
        </span>
        <span className="guided-phase">{s.phase}</span>
        <button className="btn-link guided-exit" onClick={onExit} data-testid="guided-exit">
          Leave guided learning
        </button>
      </div>
      <h2 className="guided-h">Learning goal</h2>
      <p className="guided-goal" data-testid="guided-goal">{s.goal}</p>
      <h2 className="guided-h">What to do</h2>
      <p className="guided-todo" data-testid="guided-todo">{s.whatToDo}</p>
    </section>
  );
}

/** Footer: completion criterion, takeaway (on request) and navigation. */
export function GuidedFooter({ step, goto, setStep, onExit }) {
  const s = GUIDED_PATH[step];
  const [showTakeaway, setShowTakeaway] = useState(false);
  if (!s) return null;
  const prev = step > 0 ? GUIDED_PATH[step - 1] : null;
  const next = step < GUIDED_TOTAL - 1 ? GUIDED_PATH[step + 1] : null;
  const go = (i) => { setStep(i); goto(GUIDED_PATH[i].screen); };
  return (
    <section className="guided-panel guided-panel--footer" aria-label="Guided learning: finishing this step" data-testid="guided-footer">
      <h2 className="guided-h">How do I know I am ready to continue?</h2>
      <p className="guided-completion" data-testid="guided-completion">{s.completion}</p>

      {/* The takeaway is withheld until requested so it cannot pre-empt the
          observation the learner is asked to make for themselves. */}
      {!showTakeaway
        ? <button className="btn-secondary" onClick={() => setShowTakeaway(true)} data-testid="guided-takeaway-reveal">
            Show key takeaway
          </button>
        : <div className="guided-takeaway" data-testid="guided-takeaway">
            <h2 className="guided-h">Key takeaway</h2>
            <p>{s.takeaway}</p>
            {next && s.whyNext && <p className="guided-why" data-testid="guided-why-next">{s.whyNext}</p>}
          </div>}

      <nav className="guided-nav" aria-label="Guided learning navigation">
        {prev
          ? <button className="btn-secondary" onClick={() => go(step - 1)} data-testid="guided-prev">&larr; Previous: {prev.label}</button>
          : <span />}
        <button className="btn-secondary" onClick={onExit} data-testid="guided-path-home">Learning Path</button>
        {next
          ? <button className="btn-primary" onClick={() => go(step + 1)} data-testid="guided-next">Next: {next.label} &rarr;</button>
          : <button className="btn-primary" onClick={onExit} data-testid="guided-finish">Finish &mdash; back to Learning Path</button>}
      </nav>
    </section>
  );
}
