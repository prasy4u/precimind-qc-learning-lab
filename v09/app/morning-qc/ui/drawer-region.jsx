/* =========================================================================
   v09/app/morning-qc/ui/drawer-region.jsx

   Morning QC Room — Stage 12B Drawer Region Wrapper
   PROVENANCE: V09_NEW

   FINAL-UI-INTEGRATION-CLOSURE ADDITION (Section 7): a shared wrapper for
   the Information dock and Reasoning workspace, giving each genuine modal
   drawer semantics ONLY while `open` is true (which, in normal usage, is
   only ever true below the 1024px breakpoint — the toggle buttons that
   set it are CSS-hidden above that width, so desktop's permanent
   three-column behavior is completely unaffected; this wrapper adds
   nothing when `open` is false, which is always the case at desktop
   widths in normal use).

   When open:
     - a visible "Close" control renders at the top of the region;
     - focus enters the region;
     - Tab/Shift+Tab are confined within it (a genuine focus trap,
       matching decision-dialog.jsx's rigor);
     - Escape closes it (in addition to morning-qc-room.jsx's own
       document-level Escape handler — belt and suspenders, and testable
       in isolation);
     - focus returns to the invoking toggle button on close;
     - `aria-modal="true"` is applied only while genuinely acting as a
       modal overlay (i.e. while `open`), never permanently.
   ========================================================================= */
import React, { useEffect, useRef } from 'react';

export function DrawerRegion({ id, label, as: Tag, open, onClose, returnFocusRef, children, extraProps }) {
  const regionRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const el = regionRef.current;
    const focusable = el ? Array.from(el.querySelectorAll('button, a, input, textarea, [tabindex]:not([tabindex="-1"])')) : [];
    if (focusable.length > 0) focusable[0].focus();

    function handleKeyDown(e) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Tab' && focusable.length > 0) {
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    el?.addEventListener('keydown', handleKeyDown);
    return () => {
      el?.removeEventListener('keydown', handleKeyDown);
      if (returnFocusRef?.current) returnFocusRef.current.focus();
    };
  }, [open, onClose, returnFocusRef]);

  return (
    <Tag
      className={extraProps?.className}
      aria-label={label}
      data-open={open}
      id={id}
      ref={regionRef}
      role={open ? 'dialog' : undefined}
      aria-modal={open ? 'true' : undefined}
    >
      {open && (
        <button type="button" className="mqc-btn mqc-drawer-close" onClick={onClose} aria-label={`Close ${label}`}>
          Close
        </button>
      )}
      {children}
    </Tag>
  );
}
