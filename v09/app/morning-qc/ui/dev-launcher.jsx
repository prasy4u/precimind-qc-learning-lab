/* =========================================================================
   v09/app/morning-qc/ui/dev-launcher.jsx

   Morning QC Room — Stage 12B Developer/Test Launcher
   PROVENANCE: V09_NEW

   Section 27: NOT the final learner case-selection experience. A small
   development launcher for choosing among the three Stage 12A pilot
   cases while the interaction shell is developed and reviewed
   independently of production navigation (Section 2/43). This file is
   intentionally isolated — it is never wired into v09/app/ui/app-shell.jsx
   or the 14 production destinations.

   Section 35: switching cases must produce a completely fresh engine
   state. Achieved here structurally via React's `key` prop — changing
   the mounted case's identity id as the key forces a full unmount/remount
   of MorningQCRoom, guaranteeing a brand-new controller with zero
   carried-over state, rather than relying on manual reset logic that
   could be forgotten or buggy.

   CORRECTIVE-CLOSURE FIX: the full three-button pilot selector previously
   remained permanently visible ABOVE the mounted room with no responsive
   handling at all, causing real horizontal page overflow at narrow
   viewports (confirmed via real Chromium testing — the selector's own
   un-wrapped toolbar, not the Room shell itself, was the actual cause).
   Now collapses to a single compact "Change pilot" control once a case
   is selected, and the initial selector wraps properly when not. */
import React, { useState } from 'react';
import { MorningQCRoom } from './morning-qc-room.jsx';
import { InstructorAnalyticsView } from '../../../dev/instructor-analytics-view.jsx';
import { getAttemptHistory } from '../adaptive/index.js';

// Section 11 (Stage 12D FINAL closure): this is a single-user, local-
// only dev environment — there is no real multi-learner storage by
// design (Section 21/22 privacy doctrine). For DEMONSTRATION purposes
// only, the dev-only instructor view round-robins the local attempt
// history into synthetic "Learner A/B/C" buckets so the aggregate/
// per-learner projections can be exercised and reviewed with more than
// one bucket. This never represents real separate learners — only ever
// this same local learner's own history, split for display purposes.
function splitIntoSyntheticLearners(attempts) {
  const labels = ['Learner A', 'Learner B', 'Learner C'];
  const buckets = { 'Learner A': [], 'Learner B': [], 'Learner C': [] };
  attempts.forEach((a, i) => { buckets[labels[i % labels.length]].push(a); });
  return buckets;
}

export function DevLauncher({ cases }) {
  const [selectedId, setSelectedId] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(true);
  const [showInstructorView, setShowInstructorView] = useState(false);
  const selected = cases.find(c => c.identity.id === selectedId) || null;

  function choose(id) { setSelectedId(id); setPickerOpen(false); setShowInstructorView(false); }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--warn-tint)', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', minWidth: 0 }}>
        <strong style={{ fontSize: 13 }}>DEVELOPMENT / TEST LAUNCHER</strong>
        {selected && !pickerOpen ? (
          <button type="button" className="mqc-btn" onClick={() => { setPickerOpen(true); setShowInstructorView(false); }}>
            Change pilot ({selected.identity.title.split(' —')[0].split(' (')[0]})
          </button>
        ) : (
          cases.map(c => (
            <button
              key={c.identity.id}
              type="button"
              className="mqc-btn"
              data-variant={selectedId === c.identity.id ? 'primary' : undefined}
              onClick={() => choose(c.identity.id)}
            >
              {c.identity.title.split(' —')[0].split(' (')[0]}
            </button>
          ))
        )}
        <button type="button" className="mqc-btn" data-variant={showInstructorView ? 'primary' : undefined} onClick={() => { setShowInstructorView(v => !v); setPickerOpen(false); }}>
          Instructor Analytics (Dev)
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 0, minWidth: 0, overflow: 'auto' }}>
        {showInstructorView
          ? <InstructorAnalyticsView attemptsByLearner={splitIntoSyntheticLearners(getAttemptHistory())} />
          : selected && !pickerOpen
            ? <MorningQCRoom key={selected.identity.id} caseObj={selected} />
            : <div style={{ padding: 40, color: 'var(--text-muted)' }}>Choose a pilot case above to launch the Morning QC Room.</div>}
      </div>
    </div>
  );
}
