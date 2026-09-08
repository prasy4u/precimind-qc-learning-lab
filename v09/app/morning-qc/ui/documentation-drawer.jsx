/* v09/app/morning-qc/ui/documentation-drawer.jsx — Stage 12B, PROVENANCE: V09_NEW
   Section 23: what the learner documents is not automatically what
   happened. This drawer only ever writes the exact three fields Stage
   12A's DOCUMENT handler allowlists (finalDisposition, escalation,
   establishedCause) — engine.js silently strips anything else, so this
   is a UX courtesy, not the actual security boundary. No unrestricted
   object editor is offered. */
import React, { useState, useEffect, useRef } from 'react';

export function DocumentationDrawer({ open, documentation, onClose, onSubmit, returnFocusRef }) {
  const [finalDisposition, setFinalDisposition] = useState(documentation?.finalDisposition || '');
  const [establishedCause, setEstablishedCause] = useState(documentation?.establishedCause || '');
  const drawerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const first = drawerRef.current?.querySelector('textarea, input, button');
    first?.focus();
    function handleKeyDown(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (returnFocusRef?.current) returnFocusRef.current.focus();
    };
  }, [open, onClose, returnFocusRef]);

  if (!open) return null;

  return (
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
      <button type="button" className="mqc-btn" data-variant="primary" onClick={() => onSubmit({ finalDisposition, establishedCause })}>
        Save documentation
      </button>
      <button type="button" className="mqc-btn" style={{ marginLeft: 8 }} onClick={onClose}>Close</button>
    </div>
  );
}
