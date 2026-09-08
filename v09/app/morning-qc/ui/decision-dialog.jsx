/* v09/app/morning-qc/ui/decision-dialog.jsx — Stage 12B, PROVENANCE: V09_NEW
   Section 17: case-authored decisions presented as real professional
   choices. Options expose ONLY label/actionType (via the adapter) — never
   severity, outcomeAppropriate, reasoningSupported, or the case-authored
   consequenceSummary answer-key text. No immediate correctness feedback
   after execution; Morning QC uses delayed debrief (Stage 12A's
   debrief-model.js), not inline reveal.
   Section 30: traps focus, closes on Escape, returns focus to the
   invoking control. */
import React, { useEffect, useRef } from 'react';

export function DecisionDialog({ decision, onChoose, onClose, returnFocusRef }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll('button');
    if (focusable.length > 0) focusable[0].focus();

    function handleKeyDown(e) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Tab' && focusable.length > 0) {
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    el.addEventListener('keydown', handleKeyDown);
    return () => {
      el.removeEventListener('keydown', handleKeyDown);
      if (returnFocusRef?.current) returnFocusRef.current.focus();
    };
  }, [onClose, returnFocusRef]);

  if (!decision) return null;

  return (
    <div className="mqc-dialog-overlay" onClick={onClose}>
      <div
        className="mqc-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mqc-decision-title"
        ref={dialogRef}
        onClick={e => e.stopPropagation()}
      >
        <h2 id="mqc-decision-title" className="mqc-dialog__title">Decision required</h2>
        <p className="mqc-dialog__body">Choose how to proceed. You will receive feedback in the case debrief, not immediately.</p>
        {decision.options.map(opt => (
          <button
            key={opt.id}
            type="button"
            className="mqc-decision-option"
            onClick={() => onChoose(decision.id, opt)}
          >
            {opt.label}
          </button>
        ))}
        <button type="button" className="mqc-btn" onClick={onClose} style={{ marginTop: 8 }}>Cancel</button>
      </div>
    </div>
  );
}
