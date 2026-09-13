/* =========================================================================
   v09/dev/instructor-analytics-view.jsx

   Morning QC Room — Stage 12D/12E Instructor Dev-Only Analytics View
   PROVENANCE: V09_MODIFIED (Stage 12E CORRECTIVE CLOSURE)

   Section 15: a genuine dev-only instructor analytics screen. Lives
   under v09/dev/ (outside app/**) — NEVER imported by
   app/ui/app-shell.jsx or any production entry, NEVER a production
   navigation destination.

   CORRECTIVE CLOSURE FIXES:
   Section 1/8: dataset overview now uses the true raw-storage
   inspection (quarantined count reflects reality, never silently 0
   because an already-filtered array was the only thing available).
   Section 3: renders a prominent "SYNTHETIC DEMONSTRATION DATA" banner
   whenever isSyntheticDemo is true — this data is held entirely by the
   caller (DevLauncher) in component state and never touches real
   storage.
   Section 7: full denominator-governed competency distribution
   (evaluated/not-evaluated + 4 rating counts per dimension, each
   proportion using ITS OWN evaluated count as denominator) and a
   completed per-case summary, replacing the "Common Low-Rated
   Competencies" list as the PRIMARY competency view (retained
   underneath as a supplementary summary).
   Section 9: explicit per-file download links/buttons for every file
   in the export bundle, instead of relying on several silent automatic
   downloads.
   ========================================================================= */
import React, { useState, useCallback } from 'react';
import { buildInstructorSummary } from '../app/morning-qc/analytics/instructor-projection.js';
import { dimensionLabel } from '../app/morning-qc/debrief/debrief-model-ui.js';
import { computeInstructorMetrics, formatRatioForDisplay, buildResearchExportBundle } from '../app/morning-qc/research/index.js';

const EXPORT_FILES = [
  ['attempts.csv', 'attemptsCsv', 'text/csv'],
  ['competencies.csv', 'competenciesCsv', 'text/csv'],
  ['events.jsonl', 'eventsJsonl', 'application/x-ndjson'],
  ['metric_dictionary.json', 'metricDictionaryJson', 'application/json'],
  ['data_dictionary.json', 'dataDictionaryJson', 'application/json'],
  ['dataset_manifest.json', 'manifestJson', 'application/json'],
  ['README.md', 'readme', 'text/markdown'],
];

function downloadTextFile(filename, content, mimeType) {
  if (typeof document === 'undefined') return;
  const blob = new Blob([content], { type: mimeType || 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function InstructorAnalyticsView({ attemptsByLearner, allValidAttempts, inspection, isSyntheticDemo = false }) {
  const summary = buildInstructorSummary(attemptsByLearner || {});
  const { aggregate } = summary;
  const flatAttempts = allValidAttempts || Object.values(attemptsByLearner || {}).flat();
  const quarantinedCount = inspection?.quarantinedCount ?? 0;
  const denomMetrics = computeInstructorMetrics(flatAttempts, { quarantinedCount });
  const [exportBundle, setExportBundle] = useState(null);

  const handlePrepareExport = useCallback(() => {
    const source = inspection || flatAttempts;
    const bundle = buildResearchExportBundle(source, { syntheticFlag: isSyntheticDemo });
    setExportBundle(bundle);
  }, [flatAttempts, inspection, isSyntheticDemo]);

  return (
    <div className="mqc-instructor-view" data-testid="instructor-analytics-view">
      <div className="mqc-instructor-view__disclaimer" role="note">{summary.disclaimer}</div>
      <p className="mqc-instructor-view__ethics-note">
        Local, educational, and identity-free by design. Not used for ranking, punitive review, or credentialing.
        No leaderboard. No pass/fail certification threshold.
      </p>
      {isSyntheticDemo && (
        <div className="mqc-instructor-view__demo-banner" role="alert" data-testid="synthetic-demo-banner">
          SYNTHETIC DEMONSTRATION DATA — this is not real learner history and has not touched your real learning history.
        </div>
      )}
      <h1 className="mqc-instructor-view__title">Instructor Analytics (Development Only)</h1>

      <section aria-labelledby="iav-dataset-overview-heading" data-testid="dataset-overview">
        <h2 id="iav-dataset-overview-heading">Dataset Overview</h2>
        <ul>
          <li>Valid attempts: {denomMetrics.datasetOverview.validAttemptCount}</li>
          <li>Quarantined (rejected) records: {denomMetrics.datasetOverview.quarantinedRecordCount}</li>
          <li>Cases represented: {denomMetrics.datasetOverview.casesRepresented.length}</li>
        </ul>
      </section>

      <section aria-labelledby="iav-attempts-heading">
        <h2 id="iav-attempts-heading">Aggregate Case Attempts</h2>
        <p>Total attempts: {aggregate.totalAttempts}</p>
        <ul>
          {Object.entries(aggregate.attemptsByCase).map(([caseId, count]) => (
            <li key={caseId}>{caseId}: {count}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="iav-case-summary-heading" data-testid="case-level-summary">
        <h2 id="iav-case-summary-heading">Per-Case Summary</h2>
        <ul>
          {Object.entries(denomMetrics.caseLevelSummary).map(([caseId, s]) => (
            <li key={caseId}>
              {caseId}: {s.attemptCount} attempt(s), family {s.caseFamily || 'n/a'}, difficulty {s.difficulty || 'n/a'}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="iav-competency-distribution-heading" data-testid="competency-distribution">
        <h2 id="iav-competency-distribution-heading">Competency Distribution (Denominator-Governed)</h2>
        <ul>
          {Object.entries(denomMetrics.competencySummary).map(([dim, s]) => (
            <li key={dim}>
              {dimensionLabel(dim)}: evaluated {s.evaluatedCount}, not evaluated {s.notEvaluatedCount}
              {s.evaluatedCount > 0 ? (
                <> — NEEDS_IMPROVEMENT {formatRatioForDisplay(s.ratingProportions.NEEDS_IMPROVEMENT)}, DEVELOPING {formatRatioForDisplay(s.ratingProportions.DEVELOPING)}, PROFICIENT {formatRatioForDisplay(s.ratingProportions.PROFICIENT)}, STRONG {formatRatioForDisplay(s.ratingProportions.STRONG)}</>
              ) : (
                <> — (not applicable: no attempts evaluated this dimension)</>
              )}
            </li>
          ))}
        </ul>
        <h3>Common Low-Rated Competencies (supplementary summary)</h3>
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
        <p data-testid="unsupported-rate-denominator">
          Unsupported-reasoning rate: {formatRatioForDisplay(denomMetrics.decisionQuality.unsupportedRate)} (of {denomMetrics.decisionQuality.totalDecisions} recorded decisions)
        </p>
      </section>

      <section aria-labelledby="iav-calibration-heading">
        <h2 id="iav-calibration-heading">Confidence-Calibration Patterns</h2>
        <ul>
          {Object.entries(aggregate.confidenceCalibrationCounts).map(([category, count]) => (
            <li key={category}>{category}: {count}</li>
          ))}
        </ul>
        <p data-testid="confidence-denominator">
          Based on {denomMetrics.confidenceCalibration.recordedConfidenceDenominator} decision(s) where confidence was genuinely recorded (never defaulted).
        </p>
      </section>

      <section aria-labelledby="iav-evidence-heading" data-testid="evidence-use">
        <h2 id="iav-evidence-heading">Evidence-Acquisition Behavior</h2>
        <ul>
          <li>Evidence efficiency: {formatRatioForDisplay(denomMetrics.evidenceUse.efficiencyRatio)} (among {denomMetrics.evidenceUse.eligibleAttemptCount} attempts that obtained any evidence)</li>
          <li>Total panel inspections: {denomMetrics.evidenceUse.totalPanelInspections}</li>
        </ul>
        <p className="mqc-instructor-view__caveat">Opening more panels is not inherently better — correct minimal inaction is expert behavior.</p>
      </section>

      <section aria-labelledby="iav-verification-heading">
        <h2 id="iav-verification-heading">Verification Behavior</h2>
        <ul>
          <li>Cases with no verification attempted: {aggregate.verificationBehavior.casesWithNoVerificationAttempted}</li>
          <li>Total failed verification attempts (across all cases): {aggregate.verificationBehavior.totalFailedVerificationAttempts}</li>
          <li>Cases ultimately successfully verified: {aggregate.verificationBehavior.casesSuccessfullyVerified}</li>
          <li>Cases with a failed-before-successful pattern: {aggregate.verificationBehavior.casesWithFailedBeforeSuccessfulPattern}</li>
        </ul>
        <p data-testid="verification-success-denominator">
          Success rate among attempted verifications: {formatRatioForDisplay(denomMetrics.verificationBehavior.successRateAmongAttempted)}
        </p>
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

      <section aria-labelledby="iav-export-heading" data-testid="research-export-section">
        <h2 id="iav-export-heading">Educational Research Export</h2>
        <p>Exports a local, anonymous, schema-versioned dataset derived only from valid attempt records. No learner identity, no patient data, no raw ground truth, no exact timestamps by default.</p>
        <button type="button" className="mqc-btn" onClick={handlePrepareExport} data-testid="prepare-export-button">
          Prepare research export
        </button>
        {exportBundle && (
          <div data-testid="export-file-links" role="status">
            <p>{exportBundle.manifest.validAttemptCount} valid attempt(s), {exportBundle.manifest.excludedRecordCount} excluded record(s). Download each file:</p>
            <ul>
              {EXPORT_FILES.map(([filename, contentKey, mimeType]) => (
                <li key={filename}>
                  <button
                    type="button"
                    className="mqc-btn"
                    data-testid={`download-${filename}`}
                    onClick={() => downloadTextFile(filename, exportBundle[contentKey], mimeType)}
                  >
                    Download {filename}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
