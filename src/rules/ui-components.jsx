/* =========================================================================
   Rule Laboratory — UI components (multi-level LJ chart, event list)
   ========================================================================= */

function keyFor(runNumber, levelId) { return runNumber + ":" + levelId; }

/* Multi-level Levey-Jennings chart.
   Always plots vertical position from zScore (so two materials with
   different concentrations/units remain comparable on one chart); raw
   values remain fully inspectable via tooltip and the data table.
   Level identity is carried by BOTH shape (circle vs diamond) AND line
   style (solid vs dashed), never by colour alone. Point colour continues
   to encode severity (as in the single-level LJ Laboratory chart).
   selectedKeys: Set of "run:level" the learner has clicked (pre-commit).
   revealKeys: Set of "run:level" that actually triggered a rule
   (post-commit "reveal"); when provided, selectedKeys not in revealKeys
   are flagged as an incorrect pick. */
function MultiLevelLJChart({ runs, showL1, showL2, onPointClick, selectedKeys, revealKeys, eventAnnotationRun, decimals, unitMode }) {
  const [active, setActive] = useState(null);
  const W = 780, H = 400;
  const padL = 56, padR = 34, padT = 24, padB = 56;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const dp = decimals != null ? decimals : 2;
  const n = runs.length;
  const xFor = i => padL + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const domainSD = 4;
  const yForSD = z => padT + plotH / 2 - (z / domainSD) * (plotH / 2);
  const gridLevels = [-3, -2, -1, 0, 1, 2, 3];
  const runSpacing = n > 1 ? plotW / (n - 1) : plotW;
  const showAllRunLabels = runSpacing >= 22;
  const keyRuns = new Set([runs[0] ? runs[0].runNumber : 1, runs[n - 1] ? runs[n - 1].runNumber : n]);

  function seriesFor(levelId) {
    const pts = [];
    runs.forEach((run, i) => {
      const cr = (run.controlResults || []).find(c => c.levelId === levelId);
      if (cr) pts.push({ i, run, cr });
    });
    return pts;
  }
  const l1pts = seriesFor("L1");
  const l2pts = seriesFor("L2");

  function pathFor(pts) {
    return pts.map((p, idx) => (idx === 0 ? "M" : "L") + xFor(p.i).toFixed(2) + "," + yForSD(p.cr.zScore).toFixed(2)).join(" ");
  }

  function pointClass(z) {
    const az = Math.abs(z);
    if (az > 3) return "point-out";
    if (az > 2) return "point-warn";
    return "";
  }

  function renderSeries(pts, levelId, shape) {
    return pts.map(p => {
      const x = xFor(p.i), y = yForSD(p.cr.zScore);
      const k = keyFor(p.run.runNumber, levelId);
      const isActive = active === k;
      const isSelected = selectedKeys && selectedKeys.has(k);
      const isRevealCorrect = revealKeys && revealKeys.has(k);
      const isRevealWrongPick = revealKeys && isSelected && !isRevealCorrect;
      let ringClass = "";
      if (revealKeys) {
        if (isRevealCorrect) ringClass = "mlj-ring mlj-ring-correct";
        else if (isRevealWrongPick) ringClass = "mlj-ring mlj-ring-incorrect";
      } else if (isSelected) {
        ringClass = "mlj-ring mlj-ring-selected";
      }
      const r = isActive ? 7 : 5.5;
      return (
        <g key={k}
          onMouseEnter={() => setActive(k)}
          onFocus={() => setActive(k)}
          onClick={() => { setActive(k); if (onPointClick) onPointClick(p.run.runNumber, levelId); }}
          tabIndex={0} role="button"
          aria-label={p.cr.levelName + ", run " + p.run.runNumber + ", value " + p.cr.rawValue.toFixed(dp) + ", " + p.cr.zScore.toFixed(2) + " SD"}
          className="mlj-point-g" style={{ cursor: onPointClick ? "pointer" : "default" }}>
          {ringClass && <circle cx={x} cy={y} r={r + 5} className={ringClass} fill="none" />}
          {shape === "circle"
            ? <circle cx={x} cy={y} r={r} className={"mlj-point mlj-point-l1 " + pointClass(p.cr.zScore)} />
            : <path d={diamondPath(x, y, r)} className={"mlj-point mlj-point-l2 " + pointClass(p.cr.zScore)} />}
        </g>
      );
    });
  }

  function diamondPath(cx, cy, r) {
    return `M ${cx} ${cy - r} L ${cx + r} ${cy} L ${cx} ${cy + r} L ${cx - r} ${cy} Z`;
  }

  const activePoint = (() => {
    if (!active) return null;
    for (const p of l1pts) if (keyFor(p.run.runNumber, "L1") === active) return { levelName: "Level 1", ...p };
    for (const p of l2pts) if (keyFor(p.run.runNumber, "L2") === active) return { levelName: "Level 2", ...p };
    return null;
  })();

  return (
    <div className="ljchart-wrap">
      <svg viewBox={"0 0 " + W + " " + H} className="ljchart-svg" role="img"
        aria-label={"Multi-level Levey-Jennings chart, " + n + " runs" + (showL1 && showL2 ? ", both levels shown" : showL1 ? ", Level 1 only" : ", Level 2 only")}>
        {gridLevels.map(lv => {
          const y = yForSD(lv);
          const label = lv === 0 ? "Mean" : (lv > 0 ? "+" + lv + " SD" : lv + " SD");
          return (
            <g key={lv}>
              <line x1={padL} x2={W - padR} y1={y} y2={y}
                className={lv === 0 ? "grid-line grid-mean" : (Math.abs(lv) === 3 ? "grid-line grid-3" : (Math.abs(lv) === 2 ? "grid-line grid-2" : "grid-line grid-1"))}
                strokeDasharray={lv === 0 ? "0" : (Math.abs(lv) === 3 ? "2 3" : "5 3")} />
              <text x={padL - 8} y={y + 4} textAnchor="end" className="axis-label-y">{label}</text>
            </g>
          );
        })}
        {eventAnnotationRun != null && runs.some(r => r.runNumber === eventAnnotationRun) && (
          <line x1={xFor(runs.findIndex(r => r.runNumber === eventAnnotationRun))} x2={xFor(runs.findIndex(r => r.runNumber === eventAnnotationRun))} y1={padT} y2={H - padB} className="event-line" />
        )}
        {showL1 && <path d={pathFor(l1pts)} className="mlj-line mlj-line-l1" fill="none" />}
        {showL2 && <path d={pathFor(l2pts)} className="mlj-line mlj-line-l2" fill="none" />}
        {showL1 && renderSeries(l1pts, "L1", "circle")}
        {showL2 && renderSeries(l2pts, "L2", "diamond")}
        {runs.map((run, i) => {
          const isKey = keyRuns.has(run.runNumber) || i === 0 || i === n - 1;
          if (!isKey && !showAllRunLabels) return null;
          const x = xFor(i);
          return (
            <g key={"t" + i}>
              <line x1={x} x2={x} y1={H - padB} y2={H - padB + 4} className={isKey ? "run-tick run-tick-key" : "run-tick"} />
              <text x={x} y={H - padB + 15} textAnchor="middle" className={isKey ? "axis-label-x axis-label-x-key" : "axis-label-x"}>{run.runNumber}</text>
            </g>
          );
        })}
        <text x={padL + plotW / 2} y={H - 8} textAnchor="middle" className="axis-title">Run number</text>
        <text x={16} y={padT + plotH / 2} textAnchor="middle" className="axis-title" transform={"rotate(-90 16 " + (padT + plotH / 2) + ")"}>QC value (SD units)</text>
      </svg>

      <div className="mlj-legend">
        <span className="mlj-legend-item"><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="5" className="mlj-point mlj-point-l1" /></svg> Level 1 — solid line</span>
        <span className="mlj-legend-item"><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d={diamondPath(7, 7, 5)} className="mlj-point mlj-point-l2" /></svg> Level 2 — dashed line</span>
        {revealKeys && <span className="mlj-legend-item"><span className="mlj-ring-sample mlj-ring-correct" /> Rule-triggering observation</span>}
        {revealKeys && <span className="mlj-legend-item"><span className="mlj-ring-sample mlj-ring-incorrect" /> Selected, not part of trigger</span>}
        {!revealKeys && onPointClick && <span className="mlj-legend-item"><span className="mlj-ring-sample mlj-ring-selected" /> Your selection</span>}
      </div>

      <div className="ljchart-tooltip" aria-live="polite">
        {activePoint ? (
          unitMode === "raw" ? (
            <span><strong>{activePoint.levelName}, run {activePoint.run.runNumber}:</strong> raw value {activePoint.cr.rawValue.toFixed(dp)} ({activePoint.cr.zScore >= 0 ? "+" : ""}{activePoint.cr.zScore.toFixed(2)} SD)</span>
          ) : (
            <span><strong>{activePoint.levelName}, run {activePoint.run.runNumber}:</strong> {activePoint.cr.zScore >= 0 ? "+" : ""}{activePoint.cr.zScore.toFixed(2)} SD (raw value {activePoint.cr.rawValue.toFixed(dp)})</span>
          )
        ) : (
          <span className="muted">Click or focus a point to inspect its run number, raw value and SD position.</span>
        )}
      </div>
      <p className="muted small">Point position on this chart is always plotted in SD units, so Level 1 and Level 2 remain comparable on one shared axis even if their raw concentrations differ. The raw / SD toggle below changes which value the table and tooltips lead with.</p>

      <details className="ljchart-table-details">
        <summary>Show data table (text alternative)</summary>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>Run</th><th>Level 1 ({unitMode === "raw" ? "raw" : "SD"})</th><th>Level 2 ({unitMode === "raw" ? "raw" : "SD"})</th></tr></thead>
            <tbody>
              {runs.map(run => {
                const c1 = (run.controlResults || []).find(c => c.levelId === "L1");
                const c2 = (run.controlResults || []).find(c => c.levelId === "L2");
                function cell(c) {
                  if (!c) return "—";
                  return unitMode === "raw" ? c.rawValue.toFixed(dp) : (c.zScore >= 0 ? "+" : "") + c.zScore.toFixed(dp);
                }
                return (
                  <tr key={run.runNumber}>
                    <td>{run.runNumber}</td>
                    <td className={c1 && Math.abs(c1.zScore) > 3 ? "row-out" : c1 && Math.abs(c1.zScore) > 2 ? "row-warn" : ""}>{cell(c1)}</td>
                    <td className={c2 && Math.abs(c2.zScore) > 3 ? "row-out" : c2 && Math.abs(c2.zScore) > 2 ? "row-warn" : ""}>{cell(c2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

const SCOPE_LABELS = {
  "single-measurement": "Single measurement",
  "within-run-across-materials": "Within one run, across materials",
  "within-material-across-runs": "Within one material, across runs",
  "across-materials-and-runs": "Across materials and runs"
};

/* One detected event, with an expandable "Why?" explanation. */
function EventCard({ event }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={"event-card event-card-" + event.status}>
      <div className="event-card-head">
        <span className="event-rule-label">{event.ruleLabel}</span>
        <Badge tone={event.status === "warning" ? "warn-badge" : "rejection-badge"}>{event.status === "warning" ? "Warning" : "Rejection criterion"}</Badge>
        <span className="muted small">{SCOPE_LABELS[event.scope]}</span>
      </div>
      <div className="event-card-meta">
        <span>Run{event.runNumbers.length > 1 ? "s" : ""}: {event.runNumbers.join(", ")}</span>
        <span>Material{event.controlLevels.length > 1 ? "s" : ""}: {event.controlLevels.map(l => l === "L1" ? "Level 1" : "Level 2").join(", ")}</span>
        <span>Direction: {event.direction}</span>
      </div>
      <button className="btn-link" onClick={() => setOpen(o => !o)}>{open ? "Hide" : "Why?"}</button>
      {open && <p className="event-why">{event.educationalInterpretation}</p>}
    </div>
  );
}
