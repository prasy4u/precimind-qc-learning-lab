import { isWithinCandidateWindow } from "./calc.js";
import { CAUSE_STATUS_HYPOTHESIS_LABEL, EVIDENCE_CATEGORIES, EVIDENCE_STRENGTH_LABELS, NO_QUANTITATIVE_CERTAINTY_NOTE, SUPPORT_RELATION_LABELS, hypothesisLabel } from "./data.js";
import React, { useState, useMemo, useRef, useEffect } from "react";
import { fmtSigned } from "../core/statistics.js";
import { absoluteDifference, relativeDifferencePercent } from "./calc.js";
import { CURRENT_PROCESS_TIMELINE_STEPS, DETECTION_VS_ONSET_NOTE, HISTORICAL_RESULT_TIMELINE_STEPS, NOT_AUTOMATICALLY_INVALID_NOTE, SYNTHETIC_PATIENT_DATA_NOTE, TWO_TIMELINE_EXPLANATION_NOTE } from "./data.js";

/* =========================================================================
   Investigation Lab — reusable UI components: status badges (icon + label,
   never colour alone — spec section 105), evidence cards, the hypothesis
   board, a keyboard-accessible event timeline, the patient-impact table
   (reusing the existing .table-scroll pattern), and the recovery-pathway
   diagram. Mirrors the architecture of 13-strategy-components.jsx and
   17-risk-components.jsx. All calculation logic is imported from
   19-investigation-calc.js; all text/scenario content from
   20-investigation-data.js — no new content or calculation is authored here.
   ========================================================================= */

export function humanizeStatus(s) {
  if (!s) return "";
  return s.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

/* -------------------------------------------------------------------------
   Status badges — every status uses a distinct icon glyph AND a text label,
   so the state is never conveyed by colour alone (spec section 105).
   ------------------------------------------------------------------------- */
export const QC_SIGNAL_ICONS = { "none": "○", "warning": "△", "rejection-signal": "✕" };
export const PROCESS_STATUS_ICONS = { "apparently-stable": "●", "validity-in-question": "?", "evidence-of-instability": "△", "recovery-being-verified": "↻", "recovered": "✓", "indeterminate": "…" };
export const CAUSE_STATUS_ICONS = { "no-hypothesis": "○", "candidate-hypothesis": "◐", "supported-hypothesis": "◉", "strongly-corroborated": "●", "unresolved": "?" };
export const PATIENT_IMPACT_STATUS_ICONS = { "not-assessed": "○", "candidate-review-window-defined": "▤", "potentially-exposed-results": "△", "analytical-impact-evidence-present": "●", "no-impact-demonstrated": "✓", "impact-unresolved": "?" };

/* v0.5.1 — a fifth, genuinely separate icon map for ResultDispositionStatus
   (spec section 1). Deliberately distinct glyphs from PROCESS_STATUS_ICONS
   so "recovered" (process) and "resolved" (disposition) are never visually
   conflated even when both badges appear side by side. */
export const RESULT_DISPOSITION_ICONS = { "routine-release": "✓", "temporarily-held": "⏸", "review-required": "▤", "eligible-for-release-after-review": "◐", "amendment-or-reissue-being-considered": "✎", "resolved": "●", "indeterminate": "…" };

export function StatusBadge({ kind, value, tone }) {
  const icons = kind === "qcSignal" ? QC_SIGNAL_ICONS
    : kind === "process" ? PROCESS_STATUS_ICONS
    : kind === "cause" ? CAUSE_STATUS_ICONS
    : kind === "resultDisposition" ? RESULT_DISPOSITION_ICONS
    : PATIENT_IMPACT_STATUS_ICONS;
  const icon = icons[value] || "•";
  const label = kind === "cause" ? (CAUSE_STATUS_HYPOTHESIS_LABEL[value] || humanizeStatus(value)) : humanizeStatus(value);
  return (
    <span className={"status-badge" + (tone ? " status-badge-" + tone : "")}>
      <span className="status-badge-icon" aria-hidden="true">{icon}</span>
      <span className="status-badge-label">{label}</span>
    </span>
  );
}

export function StatusRow({ qcSignalStatus, processStatus, causeStatus, patientImpactStatus, resultDispositionStatus }) {
  return (
    <div className="status-row">
      {qcSignalStatus && <StatusBadge kind="qcSignal" value={qcSignalStatus} />}
      {processStatus && <StatusBadge kind="process" value={processStatus} />}
      {causeStatus && <StatusBadge kind="cause" value={causeStatus} />}
      {patientImpactStatus && <StatusBadge kind="patientImpact" value={patientImpactStatus} />}
      {resultDispositionStatus && <StatusBadge kind="resultDisposition" value={resultDispositionStatus} />}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Evidence card (spec sections 16-22). Strength and support/weakens/neutral
   relations always pair an icon/symbol with text — never colour alone.
   ------------------------------------------------------------------------- */
export function EvidenceCard({ item }) {
  const catLabel = (EVIDENCE_CATEGORIES.find(c => c.id === item.category) || {}).label || item.category;
  return (
    <div className="evidence-card">
      <div className="evidence-card-head">
        <span className="evidence-card-cat">{catLabel}</span>
        <span className="strength-badge" title="Evidence strength">{EVIDENCE_STRENGTH_LABELS[item.strength] || item.strength}</span>
      </div>
      <h4>{item.title}</h4>
      <p><strong>Observation:</strong> {item.observation}</p>
      <p><strong>Interpretation:</strong> {item.interpretation}</p>
      <div className="support-relations">
        {item.supports && item.supports.length > 0 && (
          <p className="support-relation support-relation-supports">{SUPPORT_RELATION_LABELS.supports}: {item.supports.map(hypothesisLabel).join(", ")}</p>
        )}
        {item.weakens && item.weakens.length > 0 && (
          <p className="support-relation support-relation-weakens">{SUPPORT_RELATION_LABELS.weakens}: {item.weakens.map(hypothesisLabel).join(", ")}</p>
        )}
        {item.neutralFor && item.neutralFor.length > 0 && (
          <p className="support-relation support-relation-neutral">{SUPPORT_RELATION_LABELS.neutralFor}: {item.neutralFor.map(hypothesisLabel).join(", ")}</p>
        )}
      </div>
    </div>
  );
}

export function EvidenceCardGrid({ items }) {
  if (!items || items.length === 0) return <p className="event-list-empty">No evidence has been revealed for this reasoning stage yet.</p>;
  return <div className="evidence-grid">{items.map(item => <EvidenceCard key={item.id} item={item} />)}</div>;
}

/* -------------------------------------------------------------------------
   Hypothesis board (spec sections 14-15). Every candidate is labelled
   "Candidate explanation" until the scenario's own supportedHypothesisId
   advances under the current causeStatus — never a bare "Cause," and never
   a fabricated probability or ranking (spec section 18).
   ------------------------------------------------------------------------- */
export function HypothesisBoard({ candidateHypothesisIds, supportedHypothesisId, causeStatus, selectedId, onSelect }) {
  return (
    <div className="hypothesis-board">
      {candidateHypothesisIds.map(id => {
        const isSupported = id === supportedHypothesisId;
        const label = isSupported ? (CAUSE_STATUS_HYPOTHESIS_LABEL[causeStatus] || "Candidate explanation") : "Candidate explanation";
        const isSelected = selectedId === id;
        return (
          <button
            key={id}
            type="button"
            className={"hypothesis-card" + (isSupported && (causeStatus === "strongly-corroborated" || causeStatus === "supported-hypothesis") ? " hypothesis-card-supported" : "") + (isSelected ? " hypothesis-card-selected" : "")}
            onClick={onSelect ? () => onSelect(id) : undefined}
            disabled={!onSelect}
            aria-pressed={onSelect ? isSelected : undefined}
          >
            <div className="hypothesis-card-label">{hypothesisLabel(id)}</div>
            <div className="hypothesis-card-status">{label}</div>
          </button>
        );
      })}
      <p className="callout-inline">{NO_QUANTITATIVE_CERTAINTY_NOTE}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Event timeline (spec sections 24-29, 105). Rendered as a horizontal list
   of native, individually focusable <button> elements so every event is
   keyboard-accessible (Tab / Shift+Tab / Enter), not just hoverable.
   ------------------------------------------------------------------------- */
export const TIMELINE_KIND_ICON = { qc: "◆", process: "▲", testing: "●" };
export const TIMELINE_KIND_LABEL = { qc: "QC event", process: "Process event", testing: "Testing status" };

export function EventTimeline({ events, candidateImpactWindow }) {
  const [active, setActive] = useState(null);
  if (!events || events.length === 0) return null;
  return (
    <div className="event-timeline-wrap">
      <ul className="event-timeline-track" role="list">
        {events.map((ev, i) => {
          const inWindow = candidateImpactWindow && isWithinCandidateWindow(ev.time, candidateImpactWindow.start, candidateImpactWindow.end);
          return (
            <li key={i} role="listitem" className="event-timeline-item">
              <button
                type="button"
                className={"event-timeline-node" + (inWindow ? " event-timeline-node-window" : "") + (active === i ? " event-timeline-node-active" : "")}
                onClick={() => setActive(active === i ? null : i)}
                onFocus={() => setActive(i)}
                aria-label={ev.time + ": " + ev.label + " (" + TIMELINE_KIND_LABEL[ev.kind] + ")"}
              >
                <span className="event-timeline-icon" aria-hidden="true">{TIMELINE_KIND_ICON[ev.kind] || "•"}</span>
                <span className="event-timeline-time">{ev.time}</span>
              </button>
              <div className="event-timeline-label">{ev.label}</div>
            </li>
          );
        })}
      </ul>
      {active != null && <p className="muted small">{events[active].time} — {events[active].label} ({TIMELINE_KIND_LABEL[events[active].kind]}).</p>}
      {candidateImpactWindow && (
        <p className="muted small">Shaded nodes fall within this scenario's candidate impact window ({candidateImpactWindow.start}–{candidateImpactWindow.end}). {DETECTION_VS_ONSET_NOTE}</p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Patient impact table (spec sections 30-42, 70-77, 96-98). Reuses the
   existing .table-scroll horizontal-scroll pattern rather than a new
   stacked-cards transform, since zero horizontal clipping is mandatory
   (spec section 104) while stacked cards are only optional there.
   ------------------------------------------------------------------------- */
export function PatientImpactTable({ items, candidateImpactWindow }) {
  if (!items || items.length === 0) {
    return <p className="event-list-empty">No synthetic patient-result data is authored for this case.</p>;
  }
  return (
    <div>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Synthetic patient ID</th><th>Timestamp</th><th>Original result</th><th>Post-recovery result</th>
              <th>Absolute difference</th><th>Relative difference</th><th>Within candidate window</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map(row => {
              const abs = absoluteDifference(row.originalResult, row.postRecoveryResult);
              const rel = relativeDifferencePercent(row.originalResult, row.postRecoveryResult);
              const within = candidateImpactWindow ? isWithinCandidateWindow(row.analysisTimestamp, candidateImpactWindow.start, candidateImpactWindow.end) : false;
              const status = !candidateImpactWindow ? "outside candidate interval" : within ? "potentially exposed" : "outside candidate interval";
              return (
                <tr key={row.syntheticPatientId}>
                  <td>{row.syntheticPatientId}</td>
                  <td>{row.analysisTimestamp}</td>
                  <td>{row.originalResult}</td>
                  <td>{row.postRecoveryResult}</td>
                  <td>{abs.supported ? fmtSigned(abs.value, 2) : "—"}</td>
                  <td>{rel.supported ? fmtSigned(rel.value, 1) + "%" : <span title={rel.reason}>Not applicable</span>}</td>
                  <td>{within ? "Yes" : "No"}</td>
                  <td>{status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="muted small">{NOT_AUTOMATICALLY_INVALID_NOTE}</p>
      <p className="muted small">{SYNTHETIC_PATIENT_DATA_NOTE}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Recovery pathway diagram (spec sections 43-47) — reuses the pathway-row /
   pathway-arrow visual pattern already established on the Home screen.
   ------------------------------------------------------------------------- */
export function RecoveryFlowDiagram({ steps, currentIndex }) {
  return (
    <div className="pathway-row recovery-flow">
      {steps.map((s, i) => (
        <React.Fragment key={s + i}>
          <span className={"pathway-step recovery-step" + (currentIndex != null && i === currentIndex ? " recovery-step-current" : "")}>{s}</span>
          {i < steps.length - 1 && <span className="pathway-arrow" aria-hidden="true">→</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------
   v0.5.1 — Two-timeline display (spec section 6). Two visually separate
   compact rows, never merged into one sequence, so learners do not read
   "recovery" (current process) as also meaning "disposition resolved"
   (historical result review) — see TWO_TIMELINE_EXPLANATION_NOTE.
   ------------------------------------------------------------------------- */
export function TwoTimelineDiagram() {
  return (
    <div className="two-timeline">
      <div className="two-timeline-row">
        <div className="two-timeline-label">Current process timeline</div>
        <RecoveryFlowDiagram steps={CURRENT_PROCESS_TIMELINE_STEPS} />
      </div>
      <div className="two-timeline-row">
        <div className="two-timeline-label">Historical result-review timeline</div>
        <RecoveryFlowDiagram steps={HISTORICAL_RESULT_TIMELINE_STEPS} />
      </div>
      <p className="muted small">{TWO_TIMELINE_EXPLANATION_NOTE}</p>
    </div>
  );
}
