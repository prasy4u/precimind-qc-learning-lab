/* =========================================================================
   v09/dev/instructor-analytics-view.jsx

   Morning QC Room — Stage 12D Instructor Dev-Only Analytics View
   PROVENANCE: V09_NEW

   Section 15: a genuine dev-only instructor analytics screen. Lives
   under v09/dev/ (outside app/**), matching morning-qc-dev-entry.jsx's
   precedent — NEVER imported by app/ui/app-shell.jsx or any production
   entry, and NEVER a production navigation destination (Section 51:
   production navigation remains exactly 14).

   Consumes ONLY the safe, anonymised aggregation from
   analytics/instructor-projection.js — never raw attempt records
   directly, never groundTruth. Displays the mandatory disclaimer
   verbatim, non-negotiably, at the top of the view.
   ========================================================================= */
import React from 'react';
import { buildInstructorSummary } from '../app/morning-qc/analytics/instructor-projection.js';
import { dimensionLabel } from '../app/morning-qc/debrief/debrief-model-ui.js';

export function InstructorAnalyticsView({ attemptsByLearner }) {
  const summary = buildInstructorSummary(attemptsByLearner || {});
  const { aggregate } = summary;

  return (
    <div className="mqc-instructor-view" data-testid="instructor-analytics-view">
      <div className="mqc-instructor-view__disclaimer" role="note">{summary.disclaimer}</div>
      <h1 className="mqc-instructor-view__title">Instructor Analytics (Development Only)</h1>

      <section aria-labelledby="iav-attempts-heading">
        <h2 id="iav-attempts-heading">Aggregate Case Attempts</h2>
        <p>Total attempts: {aggregate.totalAttempts}</p>
        <ul>
          {Object.entries(aggregate.attemptsByCase).map(([caseId, count]) => (
            <li key={caseId}>{caseId}: {count}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="iav-competency-heading">
        <h2 id="iav-competency-heading">Common Low-Rated Competencies</h2>
        {aggregate.commonLowRatedCompetencies.length === 0 ? (
          <p>No low-rated competencies recorded yet.</p>
        ) : (
          <ul>{aggregate.commonLowRatedCompetencies.map(dim => <li key={dim}>{dimensionLabel(dim)}</li>)}</ul>
        )}
      </section>

      <section aria-labelledby="iav-unsupported-heading">
        <h2 id="iav-unsupported-heading">Common Unsupported Reasoning Patterns</h2>
        <p>Unsupported-decision count: {aggregate.unsupportedDecisionCount}</p>
        <ul>
          {Object.entries(aggregate.decisionQuadrantCounts).map(([quadrant, count]) => (
            <li key={quadrant}>{quadrant}: {count}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="iav-calibration-heading">
        <h2 id="iav-calibration-heading">Confidence-Calibration Patterns</h2>
        <ul>
          {Object.entries(aggregate.confidenceCalibrationCounts).map(([category, count]) => (
            <li key={category}>{category}: {count}</li>
          ))}
        </ul>
      </section>

      {Object.keys(summary.perLearner).length > 0 && (
        <section aria-labelledby="iav-perlearner-heading">
          <h2 id="iav-perlearner-heading">Per-Learner Summary (Synthetic Labels Only)</h2>
          <ul>
            {Object.entries(summary.perLearner).map(([label, agg]) => (
              <li key={label}>{label}: {agg.totalAttempts} attempt(s)</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
