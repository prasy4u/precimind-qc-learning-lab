/* =========================================================================
   v09/app/morning-qc/ui/dev-launcher.jsx

   Morning QC Room — Stage 12B Developer/Test Launcher
   PROVENANCE: V09_MODIFIED (Stage 12E CORRECTIVE CLOSURE)

   Section 27: NOT the final learner case-selection experience. A small
   development launcher for choosing among the pilot cases while the
   interaction shell is developed and reviewed independently of
   production navigation. This file is intentionally isolated — never
   wired into v09/app/ui/app-shell.jsx or the 14 production destinations.

   CORRECTIVE CLOSURE FIXES (Sections 3-4):
   Section 3: independent audit reproduced that "Load synthetic fixtures
   (demo)" called resetHistory() and then wrote synthetic records into
   the REAL canonical learner-history storage key — a single click could
   silently erase genuine local learner history. The synthetic
   demonstration cohort is now held ENTIRELY in component state
   (useState), NEVER written to or read from localStorage under any
   circumstance. Entering/exiting demo mode never touches real history.
   Section 4: the dev-only "Clear learning history" control previously
   had no confirmation at all, unlike the production learner reset. It
   now requires the same explicit, cancelable confirmation semantics
   (window.confirm) as the accepted production reset, and only ever
   operates on genuine storage — never on demo state. */
import React, { useState, useMemo } from 'react';
import { MorningQCRoom } from './morning-qc-room.jsx';
import { InstructorAnalyticsView } from '../../../dev/instructor-analytics-view.jsx';
import { getAttemptHistory, resetHistory, inspectStoredAttempts } from '../adaptive/index.js';
import { buildSyntheticCohort } from '../research/index.js';

// Section 11 (Stage 12D FINAL closure): this is a single-user, local-
// only dev environment — there is no real multi-learner storage by
// design (Section 21/22 privacy doctrine). For DEMONSTRATION purposes
// only, the dev-only instructor view round-robins attempts into
// synthetic "Learner A/B/C" buckets so the aggregate/per-learner
// projections can be exercised with more than one bucket. This never
// represents real separate learners.
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
  const [historyVersion, setHistoryVersion] = useState(0);
  // Section 3: demo mode lives ENTIRELY in component state — the
  // synthetic cohort is generated once (useMemo, deterministic) and is
  // never persisted to, or read from, localStorage.
  const [demoMode, setDemoMode] = useState(false);
  const syntheticCohort = useMemo(() => buildSyntheticCohort(), []);
  const selected = cases.find(c => c.identity.id === selectedId) || null;

  function choose(id) { setSelectedId(id); setPickerOpen(false); setShowInstructorView(false); }

  // Section 4: explicit, cancelable confirmation — matching the accepted
  // production reset's semantics. Only ever touches genuine storage;
  // never available while demoMode is active (demo has nothing to
  // clear), and never clears anything but the one intended PreciMind
  // history key (resetHistory()'s existing, unchanged behavior).
  function clearRealHistory() {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(
        'This will permanently delete your local Morning QC learning history from this browser. This action cannot be undone. Continue?'
      );
      if (!confirmed) return;
    }
    resetHistory();
    setHistoryVersion(v => v + 1);
  }

  const inspection = inspectStoredAttempts();
  const realAttempts = getAttemptHistory();
  const activeAttempts = demoMode ? syntheticCohort : realAttempts;
  const activeInspection = demoMode
    ? { totalEncountered: syntheticCohort.length, validAttemptCount: syntheticCohort.length, quarantinedCount: 0, validRecords: syntheticCohort }
    : inspection;

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
        {showInstructorView && (
          <>
            <button type="button" className="mqc-btn" data-variant={demoMode ? 'primary' : undefined} onClick={() => setDemoMode(v => !v)} data-testid="toggle-demo-mode-button">
              {demoMode ? 'Exit synthetic demo' : 'View synthetic demo (non-destructive)'}
            </button>
            {!demoMode && (
              <button type="button" className="mqc-btn" onClick={clearRealHistory} data-testid="clear-history-button">
                Clear real learning history
              </button>
            )}
          </>
        )}
      </div>
      <div style={{ flex: 1, minHeight: 0, minWidth: 0, overflow: 'auto' }}>
        {showInstructorView
          ? <InstructorAnalyticsView
              attemptsByLearner={splitIntoSyntheticLearners(activeAttempts)}
              allValidAttempts={activeAttempts}
              inspection={activeInspection}
              isSyntheticDemo={demoMode}
            />
          : selected && !pickerOpen
            ? <MorningQCRoom key={selected.identity.id} caseObj={selected} />
            : <div style={{ padding: 40, color: 'var(--text-muted)' }}>Choose a pilot case above to launch the Morning QC Room.</div>}
      </div>
    </div>
  );
}
