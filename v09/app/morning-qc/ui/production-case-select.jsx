/* =========================================================================
   v09/app/morning-qc/ui/production-case-select.jsx

   Morning QC Room — Stage 12D Production Case Bank + Adaptive Landing
   PROVENANCE: V09_MODIFIED (Stage 12C -> Stage 12D)

   Section 18/26/27: production-facing case bank — NOT the development
   launcher (dev-launcher.jsx remains isolated to v09/dev/, never
   imported here). Neutral, non-answer-key-revealing titles only.

   Section 28-29/33: adds the recommended-next-case guidance (never a
   lock — Browse all cases / Repeat remain equally available), a modest
   learner progress dashboard (no badges/XP/leaderboards), and completion
   status per case. All driven by the adaptive module, which itself
   never reads groundTruth (verified in adaptive-sequencing.test.cjs).
   ========================================================================= */
import React, { useState, useMemo, useCallback } from 'react';
import { MorningQCRoom } from './morning-qc-room.jsx';
import { getRecommendation, recordCompletedAttempt, resetLearningHistory, getAttemptHistory } from '../adaptive/index.js';
import { buildCompetencyHistory, describeConsistentStrength } from '../adaptive/competency-history.js';
import { dimensionLabel } from '../debrief/debrief-model-ui.js';

// Neutral, non-revealing operational framing per case — difficulty/
// competency focus shown, cause/decisive evidence/pathway never shown.
const PRODUCTION_CASE_META = {
  'pilot-1-reagent-lot-shift': {
    displayTitle: 'Morning QC Room — Glucose Level 2 QC Investigation',
    focus: 'Signal recognition, containment, and investigation',
  },
  'pilot-2-pbrtqc-population-shift': {
    displayTitle: 'Morning QC Room — PBRTQC Moving-Mean Alert',
    focus: 'Statistical interpretation and evidence-based disposition',
  },
  'pilot-3-rcv-patient-impact': {
    displayTitle: 'Morning QC Room — Serial Patient Result Review',
    focus: 'RCV interpretation and patient-impact reasoning',
  },
  'case-04-isolated-excursion': {
    displayTitle: 'Morning QC Room — Single Out-of-Range QC Point',
    focus: 'Signal recognition and avoiding unnecessary intervention',
  },
  'case-05-increased-imprecision': {
    displayTitle: 'Morning QC Room — Widened QC Scatter, Mean On Target',
    focus: 'Statistical interpretation and Sigma impact',
  },
  'case-06-calibration-shift': {
    displayTitle: 'Morning QC Room — Shift Following Scheduled Calibration',
    focus: 'Investigation strategy and verification after intervention',
  },
  'case-07-no-patient-impact': {
    displayTitle: 'Morning QC Room — Brief Shift During an Environmental Event',
    focus: 'Patient-impact reasoning and risk assessment',
  },
  'case-08-eqa-discordance': {
    displayTitle: 'Morning QC Room — External Assessment Flags a Concern',
    focus: 'External quality assessment interpretation',
  },
  'case-09-seek-more-evidence': {
    displayTitle: 'Morning QC Room — Ambiguous Single-Run Deviation',
    focus: 'Evidence selection and metacognitive calibration',
  },
  'case-10-premature-release-trap': {
    displayTitle: 'Morning QC Room — Shift Persists After First Correction',
    focus: 'Verification quality and investigation strategy',
  },
  'case-11-concurrent-triage': {
    displayTitle: 'Morning QC Room — Two Simultaneous QC Signals',
    focus: 'Risk prioritization and investigation strategy',
  },
  'case-12-maintenance-coincidence': {
    displayTitle: 'Morning QC Room — Shift Following Scheduled Maintenance',
    focus: 'Investigation strategy and verification quality',
  },
};

function caseStatus(caseId, attempts, recommendedId) {
  const caseAttempts = attempts.filter(a => a.caseId === caseId);
  if (caseAttempts.length === 0) return 'Not attempted';
  if (caseId === recommendedId) return 'Repeat recommended';
  return 'Completed';
}

export function ProductionCaseSelect({ cases, onReturn }) {
  const [selectedId, setSelectedId] = useState(null);
  // A render-triggering counter forces the dashboard/status to recompute
  // after each recorded attempt — attempt history itself lives in
  // localStorage (Section 21), not React state, so no simulation data is
  // ever duplicated into component state.
  const [historyVersion, setHistoryVersion] = useState(0);

  const attempts = useMemo(() => getAttemptHistory(), [historyVersion]);
  const recommendation = useMemo(() => getRecommendation(cases, undefined), [cases, historyVersion]);
  const competencyHistory = useMemo(() => buildCompetencyHistory(attempts), [attempts]);
  const strengths = useMemo(
    () => Object.keys(competencyHistory).map(dim => ({ dim, label: describeConsistentStrength(competencyHistory, dim) })).filter(s => s.label),
    [competencyHistory]
  );
  const priorities = useMemo(
    () => Object.entries(competencyHistory).filter(([, h]) => h.latestRating === 'NEEDS_IMPROVEMENT' || h.latestRating === 'DEVELOPING').slice(0, 3),
    [competencyHistory]
  );

  const handleCaseCompleted = useCallback((caseId, projection) => {
    recordCompletedAttempt(caseId, projection);
    setHistoryVersion(v => v + 1);
  }, []);

  const handleResetHistory = useCallback(() => {
    if (typeof window !== 'undefined' && !window.confirm('Reset all learning history? This cannot be undone.')) return;
    resetLearningHistory();
    setHistoryVersion(v => v + 1);
  }, []);

  const selected = cases.find(c => c.identity.id === selectedId) || null;

  if (selected) {
    return (
      <MorningQCRoom
        key={selected.identity.id}
        caseObj={selected}
        onAnotherCase={() => setSelectedId(null)}
        onReturn={onReturn}
        onCaseCompleted={handleCaseCompleted}
      />
    );
  }

  const completedCount = new Set(attempts.map(a => a.caseId)).size;

  return (
    <div className="mqc-case-select">
      <h1 className="mqc-case-select__title">Morning QC Room</h1>
      <p className="mqc-case-select__intro">
        An integrated decision simulation across QC, investigation, patient risk, and release.
      </p>

      {attempts.length > 0 && (
        <section className="mqc-progress-dashboard" aria-label="Your progress">
          <h2 className="mqc-progress-dashboard__title">Your Progress</h2>
          <p className="mqc-progress-dashboard__stat">{completedCount} case{completedCount === 1 ? '' : 's'} completed</p>
          {strengths.length > 0 && (
            <p className="mqc-progress-dashboard__strength">
              {strengths.map(s => `${dimensionLabel(s.dim)}: ${s.label}`).join(' · ')}
            </p>
          )}
          {priorities.length > 0 && (
            <div className="mqc-progress-dashboard__priorities">
              <span>Development priorities: </span>
              {priorities.map(([dim]) => dimensionLabel(dim)).join(', ')}
            </div>
          )}
          <button type="button" className="mqc-btn" onClick={handleResetHistory} style={{ marginTop: 10 }}>
            Reset learning history
          </button>
        </section>
      )}

      {recommendation && (
        <section className="mqc-recommended-case" aria-label="Recommended next case">
          <span className="mqc-recommended-case__label">Recommended next case</span>
          <button
            type="button"
            className="mqc-case-select__card mqc-case-select__card--recommended"
            onClick={() => setSelectedId(recommendation.case.identity.id)}
          >
            <span className="mqc-case-select__card-title">{(PRODUCTION_CASE_META[recommendation.case.identity.id] || {}).displayTitle || recommendation.case.identity.id}</span>
            <span className="mqc-case-select__card-reason">{recommendation.reason}</span>
          </button>
        </section>
      )}

      <h2 className="mqc-case-select__browse-title">Browse all cases</h2>
      <div className="mqc-case-select__grid">
        {cases.map(c => {
          const meta = PRODUCTION_CASE_META[c.identity.id] || { displayTitle: c.identity.id, focus: '' };
          const status = caseStatus(c.identity.id, attempts, recommendation?.case?.identity?.id);
          return (
            <button
              key={c.identity.id}
              type="button"
              className="mqc-case-select__card"
              onClick={() => setSelectedId(c.identity.id)}
            >
              <span className="mqc-case-select__card-title">{meta.displayTitle}</span>
              <span className="mqc-case-select__card-focus">{meta.focus}</span>
              <span className="mqc-case-select__card-meta-row">
                <span className="mqc-case-select__card-difficulty">{(c.identity.difficulty || '').replace(/_/g, ' ')}</span>
                {c.identity.curriculum && <span className="mqc-case-select__card-time">~{c.identity.curriculum.estimatedMinutes} min</span>}
                <span className={`mqc-case-select__card-status mqc-case-select__card-status--${status.replace(/\s+/g, '-').toLowerCase()}`}>{status}</span>
              </span>
            </button>
          );
        })}
      </div>
      {onReturn && (
        <button type="button" className="mqc-btn" style={{ marginTop: 20 }} onClick={onReturn}>
          Return to PreciMind
        </button>
      )}
    </div>
  );
}
