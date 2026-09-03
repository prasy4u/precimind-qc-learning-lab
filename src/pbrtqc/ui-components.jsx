   Patient Surveillance Lab (QC-12) — reusable UI components: a bounded/
   sampled patient-stream visual (never draws one SVG element per raw
   result when the stream is long — spec section 172), moving-statistic
   and EWMA displays, an NPed/ANPed summary card, a training/verification
   disclosure panel, and a separate PBRTQC status-badge icon family (never
   colour alone). All calculation logic is imported from 31-pbrtqc-calc.js;
   all text/scenario content from 32-pbrtqc-data.js. Mirrors the
   architecture of 29-bv-components.jsx / 25-eqa-components.jsx.
   ========================================================================= */

function humanizePbrtqcLabel(s) {
  if (s == null) return "Not stated";
  return String(s).replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

/* -------------------------------------------------------------------------
   PBRTQC status badges — a SEPARATE icon-map family from BV/EQA/
   Investigation badges. Never colour alone: icon + text label together.
   ------------------------------------------------------------------------- */
const PBRTQC_ALERT_ICONS = { alert: "▲", "no-alert": "●", "warming-up": "…", excluded: "✕" };
const PBRTQC_INCLUSION_ICONS = { included: "●", excluded: "✕" };
const PBRTQC_DETECTION_ICONS = { detected: "✓", undetected: "?" };

function PbrtqcStatusBadge({ kind, value, labelOverride }) {
  const icons = kind === "alert" ? PBRTQC_ALERT_ICONS : kind === "inclusion" ? PBRTQC_INCLUSION_ICONS : PBRTQC_DETECTION_ICONS;
  const icon = (value != null && icons[value]) || "•";
  const label = labelOverride || humanizePbrtqcLabel(value);
  return (
    <span className="status-badge">
      <span className="status-badge-icon" aria-hidden="true">{icon}</span>
      <span className="status-badge-label">{label}</span>
    </span>
  );
}

/* -------------------------------------------------------------------------
   Bounded/sampled patient-stream visual (spec sections 85, 172). Caps the
   number of rendered SVG markers regardless of stream length: for a
   stream longer than MAX_RENDERED_POINTS, an evenly spaced sample is
   drawn (documented in the caption) rather than every raw point — the
   calc engine (31-pbrtqc-calc.js) still processes the FULL stream; only
   the on-screen rendering is bounded. Shapes and line styles carry
   meaning (included vs. excluded vs. alert), never colour alone. A text
   data-table alternative and a plain-language summary are always
   available.
   ------------------------------------------------------------------------- */
const MAX_RENDERED_POINTS = 180;

function samplePoints(points) {
  if (points.length <= MAX_RENDERED_POINTS) return { sampled: points, everyNth: 1 };
  const everyNth = Math.ceil(points.length / MAX_RENDERED_POINTS);
  const sampled = points.filter((p, i) => i % everyNth === 0);
  return { sampled, everyNth };
}

function PatientStreamChart({ points, errorOnsetRawIndex, lowerControlLimit, upperControlLimit }) {
  if (!points || points.length === 0) return <p className="event-list-empty">No stream to display.</p>;
  const { sampled, everyNth } = samplePoints(points);
  const W = 760, H = 260, padL = 46, padR = 16, padT = 16, padB = 30;
  const values = points.map(p => (p.statistic != null ? p.statistic : p.includedValue != null ? p.includedValue : p.rawValue)).filter(v => typeof v === "number" && isFinite(v));
  const lo = Math.min(...values, lowerControlLimit != null ? lowerControlLimit : Infinity);
  const hi = Math.max(...values, upperControlLimit != null ? upperControlLimit : -Infinity);
  const span = (hi - lo) || 1;
  const n = sampled.length;
  const xFor = i => padL + (n <= 1 ? 0 : (i / (n - 1)) * (W - padL - padR));
  const yFor = v => padT + (1 - (v - lo) / span) * (H - padT - padB);

  return (
    <div className="pbrtqc-stream-chart">
      <svg viewBox={"0 0 " + W + " " + H} className="ljchart-svg" role="img" aria-label={"Patient-result stream, " + points.length + " raw results" + (everyNth > 1 ? ", sampled every " + everyNth + " points for display" : "") + ". Included results as circles, excluded results as crosses, alerting statistic points as triangles."}>
        {lowerControlLimit != null && <line x1={padL} x2={W - padR} y1={yFor(lowerControlLimit)} y2={yFor(lowerControlLimit)} className="grid-line grid-2" strokeDasharray="4 3" />}
        {upperControlLimit != null && <line x1={padL} x2={W - padR} y1={yFor(upperControlLimit)} y2={yFor(upperControlLimit)} className="grid-line grid-2" strokeDasharray="4 3" />}
        {errorOnsetRawIndex != null && (() => {
          const idx = sampled.findIndex(p => p.rawPatientIndex >= errorOnsetRawIndex);
          if (idx === -1) return null;
          const x = xFor(idx);
          return <line x1={x} x2={x} y1={padT} y2={H - padB} className="grid-line grid-mean" strokeDasharray="2 2" />;
        })()}
        {sampled.map((p, i) => {
          const x = xFor(i);
          if (!p.included) {
            return <text key={i} x={x} y={H / 2} textAnchor="middle" className="pbrtqc-excluded-mark" aria-hidden="true">✕</text>;
          }
          if (p.statistic == null) return null;
          const y = yFor(p.statistic);
          if (p.alert) {
            return <polygon key={i} points={(x - 4) + "," + (y + 4) + " " + (x + 4) + "," + (y + 4) + " " + x + "," + (y - 5)} className="ljchart-point point-out" />;
          }
          return <circle key={i} cx={x} cy={y} r={3} className="ljchart-point" />;
        })}
      </svg>
      <p className="muted small">
        {points.length} raw patient results{everyNth > 1 ? " (every " + everyNth + "th point sampled for this chart; all " + points.length + " were processed by the underlying calculation)" : ""}.
        Dashed horizontal lines: control limits. Dashed vertical line: error onset, if any. Circles: included, statistic within limits. Triangles: included, alerting. Crosses: excluded (metadata filter or truncation).
      </p>
      <details className="ljchart-table-details">
        <summary>Show data table (text alternative, first and last 10 points)</summary>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>Raw #</th><th>Included</th><th>Statistic</th><th>Alert</th></tr></thead>
            <tbody>
              {points.slice(0, 10).concat(points.length > 20 ? [{ separator: true }] : []).concat(points.slice(-10)).map((p, i) => p.separator
                ? <tr key={"sep"}><td colSpan={4} className="muted small">…</td></tr>
                : <tr key={i}><td>{p.rawPatientIndex}</td><td>{p.included ? "Yes" : "No (" + (p.exclusionReason || "excluded") + ")"}</td><td>{p.statistic != null ? p.statistic.toFixed(2) : "—"}</td><td>{p.alert ? "Alert (" + p.alertDirection + ")" : "—"}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Moving-statistic summary card (mean/median). Shows warm-up state
   explicitly rather than a misleading early number.
   ------------------------------------------------------------------------- */
function MovingStatisticSummary({ result }) {
  if (!result || !result.supported) return <p className="muted small">{result ? result.reason : "No result."}</p>;
  const series = result.series;
  const last = series[series.length - 1];
  return (
    <div className="bv-result-card">
      <p className="bv-result-value">{result.algorithmId === "moving-mean" ? "Moving mean" : "Moving median"} (W={result.windowSize})</p>
      {last.statistic != null ? <p>Latest statistic: {last.statistic.toFixed(3)}</p> : <p className="muted small">Warming up — fewer than W eligible results have accumulated yet. No statistic is shown (never zero, never a partial-window value).</p>}
      {result.medianConvention && <p className="muted small">{result.medianConvention}</p>}
    </div>
  );
}

function EwmaSummary({ result }) {
  if (!result || !result.supported) return <p className="muted small">{result ? result.reason : "No result."}</p>;
  const series = result.series;
  const last = series[series.length - 1];
  return (
    <div className="bv-result-card">
      <p className="bv-result-value">EWMA (lambda={result.lambda}, baseline z0={result.baselineCenter})</p>
      <p>Latest statistic: {last.statistic.toFixed(3)}</p>
      <p className="muted small">Smaller lambda: more smoothing, slower response. Larger lambda: more weight on recent results, faster but more variable response. No universally optimal lambda.</p>
    </div>
  );
}

/* -------------------------------------------------------------------------
   NPed / ANPed summary card (spec sections 60-69). Explicitly labels
   censored (undetected) trials rather than silently averaging around them.
   ------------------------------------------------------------------------- */
function NPedSummaryCard({ nped }) {
  if (!nped) return null;
  if (!nped.detected) {
    return (
      <div className="bv-result-card">
        <p><PbrtqcStatusBadge kind="detection" value="undetected" /></p>
        <p className="muted small">{nped.reason || (nped.limitations && nped.limitations[0])}</p>
      </div>
    );
  }
  return (
    <div className="bv-result-card">
      <p><PbrtqcStatusBadge kind="detection" value="detected" /></p>
      <p className="bv-result-value">NPed = {nped.nped}</p>
      <p className="muted small">Onset raw index {nped.errorOnsetIndex}, first alert raw index {nped.firstAlertIndex}. {nped.metricConvention}</p>
    </div>
  );
}

function MultiTrialNpedSummary({ summary }) {
  if (!summary || !summary.supported) return null;
  return (
    <div className="bv-result-card">
      <div className="metric-row">
        <MetricCard label="Detection rate" value={summary.detectionRatePercent.toFixed(1) + "%"} sub={summary.detectedTrials + " / " + summary.totalTrials + " trials"} />
        <MetricCard label="ANPed" value={summary.allTrialsDetected ? summary.anped.toFixed(1) : "Not reported"} />
        <MetricCard label="Mean NPed (detected trials)" value={summary.meanNpedAmongDetected != null ? summary.meanNpedAmongDetected.toFixed(1) : "—"} />
        <MetricCard label="Median NPed (detected trials)" value={summary.medianNpedAmongDetected != null ? summary.medianNpedAmongDetected.toFixed(1) : "—"} />
      </div>
      {!summary.allTrialsDetected && <p className="callout-inline">{summary.censoringNote}</p>}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Training / verification disclosure (spec sections 47-49, 90-95).
   ------------------------------------------------------------------------- */
function TrainingVerificationDisclosure({ trainingLabel, verificationLabel }) {
  return (
    <div className="bv-provenance-card">
      <div className="quadrant-grid">
        <div className="quadrant-cell">
          <h4>Training dataset</h4>
          <p className="muted small">{trainingLabel || "Not configured for this scenario."}</p>
          <p className="muted small">Used for: familiarisation, parameter selection, candidate control limits.</p>
        </div>
        <div className="quadrant-cell">
          <h4>Verification dataset</h4>
          <p className="muted small">{verificationLabel || "Not configured for this scenario."}</p>
          <p className="muted small">Used for: baseline false-alert assessment, error insertion, detection-performance verification.</p>
        </div>
      </div>
      <p className="callout-inline">{VERIFICATION_LEAKAGE_NOTE}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Parameter provenance disclosure — every configurable parameter answers
   "why this value?" (spec section 88).
   ------------------------------------------------------------------------- */
function ParameterProvenanceNote({ provenanceId, paramLabel }) {
  const opt = PARAMETER_PROVENANCE_OPTIONS.find(o => o.id === provenanceId);
  return (
    <p className="muted small">
      <strong>{paramLabel}:</strong> {opt ? opt.label + " — " + opt.description : "Provenance not stated."}
    </p>
  );
}

/* -------------------------------------------------------------------------
   "Changed vs. held constant" experiment panel — used throughout the
   Error Detection Simulator (spec section 87).
   ------------------------------------------------------------------------- */
function ChangedVsConstantPanel({ changed, heldConstant }) {
  return (
    <div className="quadrant-grid">
      <div className="quadrant-cell">
        <h4>Changed</h4>
        <p className="muted small">{changed}</p>
      </div>
      <div className="quadrant-cell">
        <h4>Held constant</h4>
        <p className="muted small">{heldConstant}</p>
      </div>
    </div>
  );
}


