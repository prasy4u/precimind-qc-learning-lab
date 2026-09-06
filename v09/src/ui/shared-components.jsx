/* =========================================================================
   Reusable UI components
   ========================================================================= */
const { useState, useMemo, useRef, useEffect } = React;

function Badge({ children, tone }) {
  return <span className={"badge badge-" + (tone || "neutral")}>{children}</span>;
}

/* Small contextual pointer to the Evidence page — never duplicates the
   bibliography, just orients the learner toward its scope and sources. */
function ScientificBasisNote({ goto, text }) {
  return (
    <details className="basis-note">
      <summary>Scientific basis</summary>
      <p>{text} <button className="btn-link" onClick={() => goto("evidence")}>View full Evidence &amp; Scientific Basis page</button></p>
    </details>
  );
}

function SliderField({ label, value, min, max, step, onChange, suffix, id, hint, signed }) {
  const displayValue = signed ? fmtSigned(value, (String(step).split(".")[1] || "").length || 0) : value;
  return (
    <div className="field">
      <div className="field-row">
        <label htmlFor={id}>{label}</label>
        <span className="field-value">{displayValue}{suffix || ""}</span>
      </div>
      {signed && min < 0 && max > 0 && (
        <div className="sign-quickset" role="group" aria-label={label + " quick sign"}>
          <button type="button" className="btn-tiny" onClick={() => onChange(-Math.abs(value || step))}>Set negative</button>
          <button type="button" className="btn-tiny" onClick={() => onChange(0)}>Zero</button>
          <button type="button" className="btn-tiny" onClick={() => onChange(Math.abs(value || step))}>Set positive</button>
        </div>
      )}
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        aria-valuetext={displayValue + (suffix || "")}
      />
      <div className="field-row field-row-num">
        <input
          type="number"
          className="num-input"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange(v);
          }}
          aria-label={label + " numeric entry"}
        />
        {hint && <span className="field-hint">{hint}</span>}
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, tone }) {
  return (
    <div className={"metric-card" + (tone ? " metric-" + tone : "")}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    if (ref.current) ref.current.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  return (
    <div className="modal-overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-panel" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="btn-icon" onClick={onClose} aria-label={"Close " + title}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Levey-Jennings SVG chart
   points: [{ run, raw }], mean, sd (raw units), unitMode: 'raw'|'sd'
   eventAnnotation: { atIndex, label } (0-based index, optional)
   ------------------------------------------------------------------------- */
const LJ_KEY_RUNS = new Set([1, 5, 10, 15, 20]);

function LJChart({ points, mean, sd, unitMode, eventAnnotation, decimals }) {
  const [active, setActive] = useState(null);

  /* v0.9 accessibility fix (Stage 11B, AD-002): single activation function so
     click, Enter, and Space invoke identical toggle semantics. Focus alone
     continues to show tooltip information (preserved from v0.8); click/
     Enter/Space toggle the active/selected state. This is an INTENDED v0.9
     delta from the v0.8 known limitation (keyboard-focusable but not
     keyboard-activatable via Enter/Space). */
  function toggleActive(i) {
    setActive(a => (i === a ? null : i));
  }
  const W = 760, H = 398;
  const padL = 56, padR = 30, padT = 24, padB = 58;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const dp = decimals != null ? decimals : 2;

  const n = points.length;
  const xFor = i => padL + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const runSpacing = n > 1 ? plotW / (n - 1) : plotW;
  const showAllRunLabels = runSpacing >= 22;

  // y domain
  const domainSD = 4; // ±4 SD always visible
  const yForSD = z => padT + plotH / 2 - (z / domainSD) * (plotH / 2);
  const yForRaw = raw => {
    const z = sd > 0 ? (raw - mean) / sd : 0;
    return yForSD(z);
  };
  const yFor = pt => (unitMode === "sd" ? yForSD(pt.z) : yForRaw(pt.raw));

  const gridLevels = [-3, -2, -1, 0, 1, 2, 3];

  const pathD = points.map((pt, i) => (i === 0 ? "M" : "L") + xFor(i).toFixed(2) + "," + yFor(pt).toFixed(2)).join(" ");

  return (
    <div className="ljchart-wrap">
      <svg viewBox={"0 0 " + W + " " + H} className="ljchart-svg" role="img"
        aria-label={"Levey-Jennings chart, " + unitMode + " units, " + n + " points"}>
        {/* grid lines */}
        {gridLevels.map(lv => {
          const y = yForSD(lv);
          const rawAtLv = mean + lv * sd;
          const label = lv === 0 ? "Mean" : (lv > 0 ? "+" + lv + " SD" : lv + " SD");
          return (
            <g key={lv}>
              <line x1={padL} x2={W - padR} y1={y} y2={y}
                className={lv === 0 ? "grid-line grid-mean" : (Math.abs(lv) === 3 ? "grid-line grid-3" : (Math.abs(lv) === 2 ? "grid-line grid-2" : "grid-line grid-1"))}
                strokeDasharray={lv === 0 ? "0" : (Math.abs(lv) === 3 ? "2 3" : "5 3")} />
              <text x={padL - 8} y={y + 4} textAnchor="end" className="axis-label-y">{label}</text>
              {unitMode === "raw" && <text x={W - padR + 6} y={y + 4} textAnchor="start" className="axis-label-y-right">{rawAtLv.toFixed(dp)}</text>}
            </g>
          );
        })}
        {/* event annotation */}
        {eventAnnotation && eventAnnotation.atIndex < n && (
          <g>
            <line x1={xFor(eventAnnotation.atIndex)} x2={xFor(eventAnnotation.atIndex)}
              y1={padT} y2={H - padB} className="event-line" />
            <text x={xFor(eventAnnotation.atIndex) + 6} y={padT + 12} className="event-label">{eventAnnotation.label}</text>
          </g>
        )}
        {/* connecting line */}
        <path d={pathD} className="ljchart-line" fill="none" />
        {/* points */}
        {points.map((pt, i) => {
          const x = xFor(i), y = yFor(pt);
          const isOut = Math.abs(pt.z) > 3;
          const isWarn = Math.abs(pt.z) > 2 && Math.abs(pt.z) <= 3;
          return (
            <g key={i}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => toggleActive(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
                  e.preventDefault();
                  toggleActive(i);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={"Run " + pt.run + ", value " + pt.raw.toFixed(dp) + ", " + pt.z.toFixed(2) + " SD"}
              className="ljchart-point-g">
              <circle cx={x} cy={y} r={active === i ? 7 : 5}
                className={"ljchart-point" + (isOut ? " point-out" : isWarn ? " point-warn" : "")} />
            </g>
          );
        })}
        {/* x axis run-number ticks: always show key runs (1, 5, 10, 15, 20);
            show every run number when horizontal space permits */}
        {points.map((pt, i) => {
          const isKey = LJ_KEY_RUNS.has(pt.run) || i === 0 || i === n - 1;
          if (!isKey && !showAllRunLabels) return null;
          const x = xFor(i);
          return (
            <g key={"tick" + i}>
              <line x1={x} x2={x} y1={H - padB} y2={H - padB + 4} className={isKey ? "run-tick run-tick-key" : "run-tick"} />
              <text x={x} y={H - padB + 15} textAnchor="middle" className={isKey ? "axis-label-x axis-label-x-key" : "axis-label-x"}>{pt.run}</text>
            </g>
          );
        })}
        {/* x axis label */}
        <text x={padL + plotW / 2} y={H - 8} textAnchor="middle" className="axis-title">Run / observation number</text>
        <text x={16} y={padT + plotH / 2} textAnchor="middle" className="axis-title" transform={"rotate(-90 16 " + (padT + plotH / 2) + ")"}>QC value ({unitMode === "sd" ? "SD units" : "raw units"})</text>
      </svg>
      <div className="ljchart-tooltip" aria-live="polite">
        {active != null ? (
          <span><strong>Run {points[active].run}:</strong> raw value {points[active].raw.toFixed(dp)}, {points[active].z >= 0 ? "+" : ""}{points[active].z.toFixed(2)} SD from mean</span>
        ) : (
          <span className="muted">Click or focus a point to inspect its run number, raw value and SD position.</span>
        )}
      </div>
      <details className="ljchart-table-details">
        <summary>Show data table (text alternative)</summary>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>Run</th><th>Raw value</th><th>SD position</th></tr></thead>
            <tbody>
              {points.map((pt, i) => (
                <tr key={i} className={Math.abs(pt.z) > 3 ? "row-out" : Math.abs(pt.z) > 2 ? "row-warn" : ""}>
                  <td>{pt.run}</td><td>{pt.raw.toFixed(dp)}</td><td>{(pt.z >= 0 ? "+" : "") + pt.z.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

/* Distribution + strip plot for Statistics Playground.
   Target and Process Centre are shown as separate labelled markers whenever
   they differ; when bias is zero they coincide and are shown as one
   combined marker so the chart never implies two different values. */
function DistributionView({ values, mean, target, sd, showBothMarkers }) {
  const W = 640, H = 170;
  const padL = 40, padR = 40, padT = 16, padB = 34;
  const plotW = W - padL - padR;
  const lo = Math.min(target, mean) - 4 * sd - 1;
  const hi = Math.max(target, mean) + 4 * sd + 1;
  const xFor = v => padL + ((v - lo) / (hi - lo)) * plotW;

  // simple bell curve using normal density scaled for display
  const curvePts = [];
  const steps = 60;
  for (let i = 0; i <= steps; i++) {
    const v = lo + (i / steps) * (hi - lo);
    const z = sd > 0 ? (v - mean) / sd : 0;
    const dens = Math.exp(-0.5 * z * z);
    curvePts.push([xFor(v), padT + (1 - dens) * (H - padT - padB - 10)]);
  }
  const curveD = curvePts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");

  return (
    <div className="dist-wrap">
      <svg viewBox={"0 0 " + W + " " + H} className="dist-svg" role="img"
        aria-label={"Distribution and strip plot" + (showBothMarkers ? ", target and process centre shown separately" : ", target and process centre coincide")}>
        <line x1={padL} x2={W - padR} y1={H - padB} y2={H - padB} className="axis-baseline" />
        <path d={curveD} className="dist-curve" fill="none" />
        {showBothMarkers ? (
          <>
            <line x1={xFor(target)} x2={xFor(target)} y1={padT} y2={H - padB} className="target-line" />
            <text x={xFor(target)} y={padT - 4} textAnchor="middle" className="dist-label">Target</text>
            <line x1={xFor(mean)} x2={xFor(mean)} y1={padT} y2={H - padB} className="mean-line" />
            <text x={xFor(mean)} y={H - padB + 14} textAnchor="middle" className="dist-label">Process centre</text>
          </>
        ) : (
          <>
            <line x1={xFor(target)} x2={xFor(target)} y1={padT} y2={H - padB} className="mean-line" />
            <text x={xFor(target)} y={padT - 4} textAnchor="middle" className="dist-label">Target = Process centre</text>
          </>
        )}
        {values.map((v, i) => (
          <circle key={i} cx={xFor(v)} cy={H - padB + 6} r={4} className="strip-point" />
        ))}
      </svg>
    </div>
  );
}
