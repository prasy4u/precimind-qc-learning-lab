/* =========================================================================
   v09/app/morning-qc/ui/panel-renderers/index.js

   Morning QC Room — Stage 12B Panel Renderer Registry
   PROVENANCE: V09_NEW

   Section 10 (corrective closure): a registry mapping each Stage 12A
   panel `type` to a small, type-specific presentational structure —
   never a recalculation of scientific truth. Every renderer here
   consumes ALREADY-COMPUTED, already-authored `panel.content` (in
   practice, across all three real Stage 12A pilots, this is always a
   `{ note: string }` prose payload — confirmed by direct inspection: no
   pilot panel currently carries structured/array data). Per Section 10's
   explicit instruction, when a panel type is conceptually chart-shaped
   (QC_HISTORY, LJ_CHART, PBRTQC, PATIENT_RESULT_DISTRIBUTION) but the
   authored content is prose-only, this registry renders a professionally
   structured INFORMATIONAL SOURCE (a labeled, categorized presentation
   of the real text) rather than fabricating a chart from invented
   numbers. If a future case provides genuine structured series data,
   `renderStructuredSeries` below is where a real chart (reusing
   app/ui/shared-components.jsx's existing LJChart/DistributionView
   primitives, per Section 32 — never a new independent implementation)
   would be wired in; no such data exists in any current pilot, so no
   chart is fabricated today.
   ========================================================================= */
import React from 'react';
import { panelTypeLabel } from '../ui-model.js';

const TYPE_CATEGORY = {
  QC_HISTORY: 'Quality Control',
  LJ_CHART: 'Quality Control',
  ANALYZER_STATUS: 'System Status',
  REAGENT_LOT: 'Reagent',
  CALIBRATION: 'Calibration',
  MAINTENANCE: 'Maintenance',
  EQA: 'External Quality Assurance',
  PATIENT_RESULT_DISTRIBUTION: 'Patient Results',
  PBRTQC: 'Patient-Based Real-Time QC',
  PREVIOUS_UNRESOLVED_EVENTS: 'Prior Events',
  APS_TEA: 'Analytical Performance Specification',
  SIGMA: 'Sigma Metric',
  QC_STRATEGY_FREQUENCY: 'QC Strategy',
  PATIENT_RISK_CONTEXT: 'Patient / Specimen Context',
};

/**
 * Renders a panel's ALREADY-AUTHORED content (never independently
 * recalculated) with type-appropriate structure. `panel` here is the
 * adapter's sanitized view-model panel object (id/type/content/
 * provenance) — it never carries `relevance`, `decisive`, or any other
 * case-authored answer-key field (see ui-adapter.js).
 */
export function renderPanelContent(panel) {
  const category = TYPE_CATEGORY[panel.type] || 'Information';
  if (!panel.content) {
    return React.createElement('p', null, 'No further detail recorded for this source.');
  }
  // Every current pilot's content is prose-only; render it as a
  // structured informational card. `content.learnerNote` (when authored)
  // is the purely-factual, non-interpretive projection intended for
  // active-play display — preferred over `content.note`, which remains
  // the full authored text and may legitimately embed author/debrief-level
  // interpretation not meant for the learner mid-case (see the semantic
  // leakage review in V09_STAGE12B_REPORT.md).
  if (Array.isArray(panel.content.points) || Array.isArray(panel.content.series)) {
    return renderStructuredSeries(panel);
  }
  return React.createElement(
    'div',
    { className: 'mqc-panel-renderer' },
    React.createElement('div', { className: 'mqc-panel-renderer__category' }, category),
    React.createElement('p', null, panel.content.learnerNote || panel.content.note || 'No further detail recorded for this source.')
  );
}

/**
 * Reserved for genuine structured data. Deliberately unimplemented beyond
 * a safe fallback, since no current Stage 12A pilot provides structured
 * series data on any panel (verified by direct inspection during this
 * closure) — implementing a chart here today would require inventing
 * placeholder values, which Section 10 explicitly forbids. When a future
 * case genuinely provides `points`/`series`, this function is where
 * app/ui/shared-components.jsx's existing LJChart/DistributionView
 * primitives should be wired in (reused, not reimplemented — Section 32).
 */
function renderStructuredSeries(panel) {
  return React.createElement(
    'div',
    { className: 'mqc-panel-renderer' },
    React.createElement('div', { className: 'mqc-panel-renderer__category' }, TYPE_CATEGORY[panel.type] || 'Information'),
    React.createElement('p', null, panel.content.note || 'Structured data present; chart rendering not yet wired for this panel type.')
  );
}

export function panelCategoryLabel(type) {
  return TYPE_CATEGORY[type] || panelTypeLabel(type);
}
