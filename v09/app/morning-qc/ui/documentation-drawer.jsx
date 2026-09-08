/* v09/app/morning-qc/ui/documentation-drawer.jsx — Stage 12B, PROVENANCE: V09_NEW
   Section 23: what the learner documents is not automatically what
   happened. This drawer only ever writes the exact three fields Stage
   12A's DOCUMENT handler allowlists (finalDisposition, escalation,
   establishedCause) — engine.js silently strips anything else, so this
   is a UX courtesy, not the actual security boundary. No unrestricted
   object editor is offered.

   FINAL-UI-INTEGRATION-CLOSURE FIX: added the previously-missing
   `escalation` field (Stage 12A allowlists finalDisposition, escalation,
   AND establishedCause — this drawer had only exposed the first and
   third). Documented escalation remains, per the Stage 12A truth
   doctrine, a learner CLAIM only — writing it here never derives
   serviceState or rewrites event history; a real ESCALATE action is a
   completely separate engine event (verified in ui-component.test.cjs's
   DOC-ESCALATION test). */
import React, { useState, useEffect, useRef } from 'react';

export function DocumentationDrawer({ open, documentation, onClose, onSubmit, returnFocusRef }) {
  const [finalDisposition, setFinalDisposition] = useState(documentation?.finalDisposition || '');
  const [establishedCause, setEstablishedCause] = useState(documentation?.establishedCause || '');
  const [escalation, setEscalation] = useState(documentation?.escalation || '');
  const drawerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const el = drawerRef.current;
    const focusable = el ? Array.from(el.querySelectorAll('textarea, input, button')) : [];
    if (focusable.length > 0) focusable[0].focus();

    function handleKeyDown(e) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Tab' && focusable.length > 0) {
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (returnFocusRef?.current) returnFocusRef.current.focus();
    };
  }, [open, onClose, returnFocusRef]);

  if (!open) return null;

  return (
    <>
      <div className="mqc-drawer-overlay" onClick={onClose} />
      <div className="mqc-drawer" role="dialog" aria-modal="true" aria-label="Documentation" ref={drawerRef}>
        <h2 style={{ marginBottom: 16 }}>Documentation</h2>
        <div className="mqc-drawer__field">
          <label htmlFor="mqc-doc-disposition">Final disposition (your written record)</label>
          <textarea id="mqc-doc-disposition" rows={3} value={finalDisposition} onChange={e => setFinalDisposition(e.target.value)} />
        </div>
        <div className="mqc-drawer__field">
          <label htmlFor="mqc-doc-cause">Established cause (your written record)</label>
          <textarea id="mqc-doc-cause" rows={3} value={establishedCause} onChange={e => setEstablishedCause(e.target.value)} />
        </div>
        <div className="mqc-drawer__field">
          <label htmlFor="mqc-doc-escalation">Escalation (your written record)</label>
          <textarea id="mqc-doc-escalation" rows={3} value={escalation} onChange={e => setEscalation(e.target.value)} />
        </div>
        <button type="button" className="mqc-btn" data-variant="primary" onClick={() => onSubmit({ finalDisposition, establishedCause, escalation })}>
          Save documentation
        </button>
        <button type="button" className="mqc-btn" style={{ marginLeft: 8 }} onClick={onClose}>Close</button>
      </div>
    </>
  );
}
