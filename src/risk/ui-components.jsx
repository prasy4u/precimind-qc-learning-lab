/* =========================================================================
   Risk & Frequency Lab — reusable UI components: the original interactive
   QC timeline visualization (spec v0.4 sections 5-7, 45), the N/R/M
   breakdown panel, the four-quadrant matrix renderer, and small result-
   metadata cards used across the lab's five submodes. Mirrors the
   architecture of 13-strategy-components.jsx.
   ========================================================================= */

/* -------------------------------------------------------------------------
   Detection-delay result card — surfaces the full structured-metadata
   contract from 15-detection-delay.js (spec section 40: "why did the
   application calculate this number?").
   ------------------------------------------------------------------------- */
function DetectionDelayResultCard({ title, result }) {
  if (!result) return null;
  return (
    <div className="ddr-card">
      <div className="ddr-card-head">
        <span className="ddr-card-title">{title}</span>
        {!result.supported && <Badge tone="later">Not numerically implemented</Badge>}
      </div>
      {result.supported ? (
        <div className="ddr-value">{fmt(result.value, 2)} <span className="ddr-units">{result.units}</span></div>
      ) : (
        <p className="event-list-empty">{result.reason || "Not numerically implemented in this version."}</p>
      )}
      <details className="ddr-detail">
        <summary>Why did the application calculate this number?</summary>
        <dl className="evidence-fields">
          <dt>Model</dt><dd>{result.modelName}</dd>
          <dt>Provenance</dt><dd>{result.provenance}</dd>
          <dt>Assumptions</dt>
          <dd><ul className="mini-explain-list">{result.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul></dd>
          <dt>Limitations</dt>
          <dd><ul className="mini-explain-list">{result.limitations.map((l, i) => <li key={i}>{l}</li>)}</ul></dd>
        </dl>
      </details>
    </div>
  );
}

/* -------------------------------------------------------------------------
   N / R / M breakdown panel (spec sections 4, 46). Always shown together
   so the three variables are never allowed to visually collapse into one
   another; the distinction note is an expandable disclosure, not baked
   into prose that could be skipped.
   ------------------------------------------------------------------------- */
function NRMPanel({ N, R, M }) {
  return (
    <div>
      <div className="nrm-row">
        <div className="nrm-cell"><span className="nrm-key">N</span><span className="nrm-val">{N}</span><span className="nrm-desc">{N_LABEL}</span></div>
        <div className="nrm-cell"><span className="nrm-key">R</span><span className="nrm-val">{R}</span><span className="nrm-desc">{R_LABEL}</span></div>
        <div className="nrm-cell"><span className="nrm-key">M</span><span className="nrm-val">{M}</span><span className="nrm-desc">{M_LABEL}</span></div>
      </div>
      <details className="important-note">
        <summary>N, R and M are not the same thing</summary>
        <p className="muted small">{N_R_M_DISTINCTION_NOTE}</p>
      </details>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Four-quadrant teaching matrix (spec section 16). No quadrant is styled
   or labelled as universally good or bad — all four share one neutral
   visual treatment; only the discussion text differs.
   ------------------------------------------------------------------------- */
function QuadrantMatrix({ highlightId }) {
  return (
    <div>
      <div className="quadrant-grid">
        {QUADRANT_MATRIX.map(q => (
          <div key={q.id} className={"quadrant-cell" + (highlightId === q.id ? " quadrant-cell-highlight" : "")}>
            <h4>{q.label}</h4>
            <p className="muted small">{q.discussion}</p>
          </div>
        ))}
      </div>
      <p className="callout-inline">{QUADRANT_MATRIX_NOTE}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Original interactive QC timeline visualization (spec sections 5-7, 45).
   Renders a fixed number of QC events with patient-sample intervals
   between them; M controls each interval's visual scale (compressed,
   never one icon per patient sample); a systematic shift can be injected
   at a chosen onset position within the first interval, and the
   illustrative expected-detection point (from the geometric model, never
   claimed to be a guaranteed detection) is marked separately.
   ------------------------------------------------------------------------- */
const TIMELINE_INTERVALS = 4; // fixed regardless of M — only the interval's internal scale changes

function intervalWidthPx(M) {
  const w = 46 + Math.log2(Math.max(M, 1) + 1) * 22;
  return Math.max(60, Math.min(220, Math.round(w)));
}
function iconCountFor(M) {
  return Math.max(3, Math.min(8, Math.round(Math.log2(Math.max(M, 1) + 1))));
}

function QCTimeline({ M, shiftSD, N, onsetMode, onsetPositionPct, ruleIds }) {
  const supported = isDetectionDelaySupportedRuleSet(ruleIds || ["13s"]);
  const oc = supported ? operatingCharacteristic13s(N, shiftSD) : null;
  const ped = oc ? oc.ped : null;
  const eventsResult = ped != null ? expectedQcEventsToDetectionGeometric(ped) : { supported: false };
  const expectedEvents = eventsResult.supported ? eventsResult.value : null;

  // Onset happens within interval 0 (the first patient-sample interval
  // after the baseline QC event). Immediate mode = 0% into the interval;
  // uniform mode = the chosen illustrative position.
  const onsetPct = onsetMode === "immediate" ? 0 : Math.max(0, Math.min(100, onsetPositionPct));

  // Illustrative expected-detection QC event index (1-based count of QC
  // events after onset; QC event #0 is the baseline event before onset).
  // Never presented as a guaranteed detection point.
  const detectionIndex = expectedEvents != null ? Math.min(Math.ceil(expectedEvents), TIMELINE_INTERVALS) : null;
  const detectionBeyondView = expectedEvents != null && Math.ceil(expectedEvents) > TIMELINE_INTERVALS;

  const iconCount = iconCountFor(M);
  const segW = intervalWidthPx(M);

  return (
    <div className="qc-timeline-wrap">
      <div className="qc-timeline-scroll">
        <div className="qc-timeline-track">
          {Array.from({ length: TIMELINE_INTERVALS + 1 }).map((_, qcIdx) => {
            const isBaseline = qcIdx === 0;
            const isDetectionMarker = detectionIndex != null && qcIdx === detectionIndex;
            const outOfControlByHere = qcIdx >= 1; // onset occurs during interval 0, so QC#1 onward is potentially out of control
            return (
              <React.Fragment key={qcIdx}>
                <div className={"qc-node" + (isDetectionMarker ? " qc-node-detect" : "")}>
                  <div className="qc-node-badge" aria-hidden="true">{isDetectionMarker ? "!" : "✓"}</div>
                  <div className="qc-node-label">{isBaseline ? "QC event (baseline)" : isDetectionMarker ? "Illustrative expected detection" : "QC event"}</div>
                </div>
                {qcIdx < TIMELINE_INTERVALS && (
                  <div className={"qc-interval" + (qcIdx === 0 ? " qc-interval-onset" : outOfControlByHere && (detectionIndex == null || qcIdx < detectionIndex) ? " qc-interval-ooc" : "")}
                    style={{ width: segW + "px", minWidth: segW + "px" }}>
                    {qcIdx === 0 && shiftSD > 0 && (
                      <div className="qc-onset-marker" style={{ left: onsetPct + "%" }} title={SYNTHETIC_SHIFT_INTRODUCED_TEXT}>
                        <div className="qc-onset-flag">Synthetic shift introduced</div>
                      </div>
                    )}
                    <div className="qc-interval-icons" aria-hidden="true">
                      {Array.from({ length: iconCount }).map((_, i) => <span key={i} className="qc-sample-dot" />)}
                    </div>
                    <div className="qc-interval-label">M = {M} patient samples</div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
      <p className="muted small">Same QC rule. Different opportunity for patient exposure. Only M (the spacing between QC events) changes the width of each interval above — the QC procedure itself is unchanged.</p>
      {shiftSD > 0 && (
        <p className="muted small">
          {supported && ped != null
            ? <>Illustrative per-event detection probability at this shift size: Ped ≈ {(ped * 100).toFixed(1)}% (1₃s, N={N}). {expectedEvents != null && <>Expected QC events to detection ≈ {expectedEvents.toFixed(2)}{detectionBeyondView ? " (beyond the intervals shown here)" : ""}.</>}</>
            : UNSUPPORTED_DETECTION_DELAY_NOTE}
        </p>
      )}
      <p className="callout-inline">{SHIFT_CAUSE_CAUTION}</p>
    </div>
  );
}
