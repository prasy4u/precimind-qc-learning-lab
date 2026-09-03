   BV & RCV Lab (QC-07) — reusable UI components: BV-specific status badges
   (a separate icon-map family, never colour alone), the Provenance Card,
   the Variation Foundations interactive visual (individuals' set points +
   repeated measurements + population distribution, with a text-alternative
   data table), the BV-derived APS table, the classical and log-normal RCV
   displays (each with a "How was this calculated?" disclosure), the
   Index-of-Individuality display, and the RI-vs-RCV comparison panel
   (two always-independent status indicators). All calculation logic is
   imported from 27-bv-calc.js; all text/scenario content from
   28-bv-data.js — no new content or calculation is authored here. Mirrors
   the architecture of 25-eqa-components.jsx.
   ========================================================================= */

function humanizeBvLabel(s) {
  if (s == null) return "Not stated";
  return String(s).replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

/* -------------------------------------------------------------------------
   BV status badges — a separate icon-map family from EQA/Investigation
   badges (never colour alone; icon + text label together).
   ------------------------------------------------------------------------- */
const BV_II_BAND_ICONS = {
  "marked-individuality": "◆",
  "intermediate-individuality": "◈",
  "low-individuality": "◇",
  "not-computable": "—"
};
const BV_RCV_EXCEEDANCE_ICONS = {
  "exceeds": "▲",
  "does-not-exceed": "●",
  "not-computable": "—"
};
const BV_RI_STATUS_ICONS = {
  "inside-reference-interval": "○",
  "outside-reference-interval": "△",
  "not-stated": "—"
};
const BV_TRANSPORTABILITY_ICONS = {
  "direct-match": "✓",
  "caution-needed": "!",
  "not-transportable-as-is": "✕",
  "unknown": "?"
};

function BvStatusBadge({ kind, value, labelOverride }) {
  const icons = kind === "ii-band" ? BV_II_BAND_ICONS
    : kind === "rcv-exceedance" ? BV_RCV_EXCEEDANCE_ICONS
    : kind === "ri-status" ? BV_RI_STATUS_ICONS
    : BV_TRANSPORTABILITY_ICONS;
  const icon = (value != null && icons[value]) || "•";
  const label = labelOverride || humanizeBvLabel(value);
  return (
    <span className="status-badge">
      <span className="status-badge-icon" aria-hidden="true">{icon}</span>
      <span className="status-badge-label">{label}</span>
    </span>
  );
}

/* -------------------------------------------------------------------------
   Provenance Card (spec section 63) — shown wherever a BV estimate is
   displayed. Missing fields are shown as "Not stated," never invented.
   ------------------------------------------------------------------------- */
function ProvenanceCard({ estimate }) {
  if (!estimate) return <p className="event-list-empty">No biological-variation estimate is authored for this case.</p>;
  const isIllustrative = estimate.sourceType === "illustrative-teaching-value";
  return (
    <div className="bv-provenance-card">
      <div className="eqa-report-head">
        <span className="eqa-report-measurand">{estimate.measurand || "Measurand not stated"}</span>
        <Badge tone={isIllustrative ? "neutral" : "available"}>{humanizeBvLabel(estimate.sourceType) || "Source type not stated"}</Badge>
      </div>
      <div className="table-scroll">
        <table className="data-table">
          <tbody>
            <tr><td>Matrix</td><td>{estimate.matrix || "Not stated"}</td></tr>
            <tr><td>Population</td><td>{estimate.population || "Not stated"}</td></tr>
            <tr><td>Health status</td><td>{estimate.healthStatus || "Not stated"}</td></tr>
            <tr><td>Sampling interval</td><td>{estimate.samplingInterval || "Not stated"}</td></tr>
            <tr><td>Study time scale</td><td>{estimate.studyTimeScale || "Not stated"}</td></tr>
            <tr><td>CVA</td><td>{estimate.cva != null ? estimate.cva + "%" : "Not available"}</td></tr>
            <tr><td>CVI</td><td>{estimate.cvi != null ? estimate.cvi + "%" + (estimate.cviCI ? " (CI: " + estimate.cviCI + ")" : "") : "Not available"}</td></tr>
            <tr><td>CVG</td><td>{estimate.cvg != null ? estimate.cvg + "%" + (estimate.cvgCI ? " (CI: " + estimate.cvgCI + ")" : "") : "Not available"}</td></tr>
            <tr><td>Source citation</td><td>{estimate.sourceCitation || "Not stated"}</td></tr>
            <tr><td>BIVAC status</td><td>{estimate.bivacStatus || "Not stated"}</td></tr>
            <tr><td>Database snapshot date</td><td>{estimate.databaseSnapshotDate || "Not stated"}</td></tr>
          </tbody>
        </table>
      </div>
      {estimate.notes && <p className="muted small">{estimate.notes}</p>}
      {estimate.transportabilityCautions && estimate.transportabilityCautions.length > 0 && (
        <div>
          <p className="muted small"><strong>Transportability cautions:</strong></p>
          <ul className="mini-explain-list">{estimate.transportabilityCautions.map((c, i) => <li key={i}>{c}</li>)}</ul>
        </div>
      )}
      <p className="muted small">{BV_MISSING_FIELDS_STAY_MISSING_NOTE}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------
   "How was this calculated?" disclosure (spec section 134). Renders any
   27-bv-calc.js result object's provenance metadata uniformly.
   ------------------------------------------------------------------------- */
function HowCalculatedDisclosure({ result }) {
  if (!result || !result.supported) return null;
  return (
    <details className="basis-note">
      <summary>How was this calculated?</summary>
      <div className="mini-explain-list-wrap">
        {result.formulaFramework && <p><strong>Framework:</strong> {result.formulaFramework}</p>}
        {result.formula && <p><strong>Formula:</strong> {result.formula}</p>}
        {result.zLabel && <p><strong>z-value convention:</strong> {result.zLabel}</p>}
        {result.directionConvention && <p><strong>Direction convention:</strong> {result.directionConvention}</p>}
        {result.inputs && (
          <p><strong>Inputs:</strong> {Object.entries(result.inputs).map(([k, v]) => k.toUpperCase() + "=" + (v == null ? "not available" : v + "%")).join(", ")}</p>
        )}
        {result.assumptions && result.assumptions.length > 0 && (
          <div><p className="muted small"><strong>Assumptions:</strong></p><ul className="mini-explain-list">{result.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul></div>
        )}
        {result.limitations && result.limitations.length > 0 && (
          <div><p className="muted small"><strong>Limitations:</strong></p><ul className="mini-explain-list">{result.limitations.map((l, i) => <li key={i}>{l}</li>)}</ul></div>
        )}
      </div>
    </details>
  );
}

/* -------------------------------------------------------------------------
   Index of Individuality display (spec sections 17-24).
   ------------------------------------------------------------------------- */
function IndexOfIndividualityDisplay({ cvi, cvg }) {
  const result = calculateIndexOfIndividuality(cvi, cvg);
  if (!result.supported) {
    return (
      <div className="bv-result-card">
        <p><BvStatusBadge kind="ii-band" value="not-computable" /></p>
        <p className="muted small">{result.reason}</p>
      </div>
    );
  }
  return (
    <div className="bv-result-card">
      <p className="bv-result-value">II = {result.value.toFixed(2)}</p>
      <p><BvStatusBadge kind="ii-band" value={result.band} labelOverride={result.bandLabel} /></p>
      <p className="muted small">{result.heuristicCaveat}</p>
      <HowCalculatedDisclosure result={result} />
    </div>
  );
}

/* -------------------------------------------------------------------------
   BV-derived APS table (spec sections 25-32). TEa shown only inside its
   own expandable disclosure per level, never as the headline output.
   ------------------------------------------------------------------------- */
function BvApsTable({ cvi, cvg }) {
  const result = calculateBvAps(cvi, cvg);
  if (!result.supported) {
    return <p className="muted small">{result.reason}</p>;
  }
  return (
    <div className="bv-result-card">
      <div className="table-scroll">
        <table className="data-table">
          <thead><tr><th>Level</th><th>Imprecision (CV%)</th><th>Bias (magnitude, %)</th></tr></thead>
          <tbody>
            {["optimum", "desirable", "minimum"].map(id => {
              const lvl = result.levels[id];
              return (
                <tr key={id}>
                  <td>{lvl.label}</td>
                  <td>{lvl.imprecision.supported ? lvl.imprecision.value.toFixed(2) + "%" : <span title={lvl.imprecision.reason}>Not computable</span>}</td>
                  <td>{lvl.bias.supported ? lvl.bias.value.toFixed(2) + "%" : <span title={lvl.bias.reason}>Not computable</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!result.cvgAvailable && <p className="muted small">Bias APS is not computable without CVG. Imprecision APS remains computable from CVI alone.</p>}
      <details className="basis-note">
        <summary>Optional: combined TEa (not the primary output)</summary>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>Level</th><th>TEa = 1.65×imprecision + bias (%)</th></tr></thead>
            <tbody>
              {["optimum", "desirable", "minimum"].map(id => {
                const lvl = result.levels[id];
                return <tr key={id}><td>{lvl.label}</td><td>{lvl.tea.supported ? lvl.tea.value.toFixed(2) + "%" : "Not computable"}</td></tr>;
              })}
            </tbody>
          </table>
        </div>
        <p className="muted small">This combined figure is shown only for reference — the imprecision and bias components above are the primary outputs of this model.</p>
      </details>
      <HowCalculatedDisclosure result={result} />
    </div>
  );
}

/* -------------------------------------------------------------------------
   Classical symmetric RCV display (spec sections 33-37).
   ------------------------------------------------------------------------- */
function ClassicalRcvDisplay({ cva, cvi, zConventionId }) {
  const result = calculateClassicalRcv(cva, cvi, zConventionId);
  if (!result.supported) return <p className="muted small">{result.reason}</p>;
  return (
    <div className="bv-result-card">
      <p className="bv-result-value">RCV = ±{result.value.toFixed(2)}%</p>
      <p className="muted small">{result.zLabel} — {result.directionConvention}</p>
      <HowCalculatedDisclosure result={result} />
    </div>
  );
}

/* -------------------------------------------------------------------------
   Log-normal asymmetric RCV display (spec sections 38-43). Always shows
   BOTH the increase and decrease limits, never a single averaged figure.
   ------------------------------------------------------------------------- */
function LognormalRcvDisplay({ cva, cvi, zConventionId }) {
  const result = calculateLognormalRcv(cva, cvi, zConventionId);
  if (!result.supported) return <p className="muted small">{result.reason}</p>;
  return (
    <div className="bv-result-card">
      <div className="table-scroll">
        <table className="data-table">
          <tbody>
            <tr><td>Allowable increase</td><td>+{result.increase.value.toFixed(2)}%</td></tr>
            <tr><td>Allowable decrease (magnitude)</td><td>−{result.decrease.value.toFixed(2)}%</td></tr>
          </tbody>
        </table>
      </div>
      <p className="muted small">{result.zLabel} — {result.directionConvention}</p>
      <HowCalculatedDisclosure result={result} />
    </div>
  );
}

/* -------------------------------------------------------------------------
   RI-vs-RCV comparison panel (spec sections 17-24) — two INDEPENDENT
   status indicators, deliberately never merged into a single status.
   ------------------------------------------------------------------------- */
function RiVsRcvComparisonPanel({ referenceInterval, previousResult, currentResult, cva, cvi, zConventionId }) {
  const change = calculateSerialRelativeChange(previousResult, currentResult);
  const exceedance = evaluateClassicalRcvExceedance(previousResult, currentResult, cva, cvi, zConventionId);
  const riStatusFor = v => {
    if (!referenceInterval || v == null) return "not-stated";
    return (v >= referenceInterval.low && v <= referenceInterval.high) ? "inside-reference-interval" : "outside-reference-interval";
  };
  return (
    <div className="bv-comparison-panel">
      <div className="quadrant-grid">
        <div className="quadrant-cell">
          <h4>Reference interval status (independent question)</h4>
          <p>Previous: <BvStatusBadge kind="ri-status" value={riStatusFor(previousResult)} /></p>
          <p>Current: <BvStatusBadge kind="ri-status" value={riStatusFor(currentResult)} /></p>
        </div>
        <div className="quadrant-cell">
          <h4>RCV status (independent question)</h4>
          {exceedance.supported ? (
            <>
              <p>Relative change: {change.supported ? change.value.toFixed(2) + "%" : "Not computable"}</p>
              <p><BvStatusBadge kind="rcv-exceedance" value={exceedance.exceeds ? "exceeds" : "does-not-exceed"} /></p>
            </>
          ) : <p className="muted small">{exceedance.reason}</p>}
        </div>
      </div>
      <p className="callout-inline">A reference interval describes where most healthy people's results fall. An RCV describes how much one person's own result plausibly moves. These two panels are never combined into a single status.</p>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Variation Foundations interactive visual (spec sections 5-6). Several
   illustrative individuals, each with their own homeostatic set point
   (spread according to CVG) and several repeated measurements around that
   set point (spread according to CVI, with additional CVA noise on top of
   each single measurement). Shapes/labels carry meaning, never colour
   alone; a text-alternative data table is always available.
   ------------------------------------------------------------------------- */
const VARIATION_VISUAL_SET_POINTS = [-1.4, -0.7, -0.1, 0.4, 1.0, 1.6]; /* fixed, deterministic relative positions (SD units) */
const VARIATION_VISUAL_REPLICATE_OFFSETS = [-0.6, 0.2, 0.7]; /* fixed, deterministic relative replicate offsets (SD units) */

function VariationFoundationsVisual({ cva, cvi, cvg }) {
  const W = 720, H = 260;
  const padL = 40, padR = 40, midY = H / 2;
  const scale = 26; /* pixels per "1 unit" of the underlying illustrative scale */
  const individuals = VARIATION_VISUAL_SET_POINTS.map((sp, i) => ({
    id: i,
    setPointX: W / 2 + sp * (cvg / 10) * scale,
    replicates: VARIATION_VISUAL_REPLICATE_OFFSETS.map(off => sp * (cvg / 10) * scale + off * (cvi / 10) * scale)
  }));
  return (
    <div className="bv-variation-visual">
      <svg viewBox={"0 0 " + W + " " + H} className="ljchart-svg" role="img" aria-label="Illustrative individuals, their repeated measurements, and the resulting population spread, as CVA, CVI and CVG change.">
        <line x1={padL} x2={W - padR} y1={midY} y2={midY} className="grid-line grid-mean" />
        {individuals.map(ind => (
          <g key={ind.id}>
            <line x1={W / 2 + ind.setPointX - (W / 2)} x2={W / 2 + ind.setPointX - (W / 2)} y1={midY - 60} y2={midY + 60} className="grid-line grid-1" strokeDasharray="3 3" />
            {ind.replicates.map((rx, ri) => (
              <circle key={ri} cx={W / 2 + rx - (W / 2) + (W / 2)} cy={midY - 20 + ri * 4} r={3 + cva / 4} className="ljchart-point" />
            ))}
            <rect x={ind.setPointX - 4} y={midY + 30} width={8} height={8} className="ljchart-point point-warn" transform={"rotate(45 " + ind.setPointX + " " + (midY + 34) + ")"} />
          </g>
        ))}
        <text x={W / 2} y={H - 12} textAnchor="middle" className="axis-title">Illustrative scale (not a real unit) — diamonds: individual set points (spread by CVG); dots: repeated measurements per individual (spread by CVI, sized by CVA)</text>
      </svg>
      <details className="ljchart-table-details">
        <summary>Show data table (text alternative)</summary>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>Individual</th><th>Set point (illustrative)</th><th>Replicate measurements (illustrative)</th></tr></thead>
            <tbody>
              {individuals.map(ind => (
                <tr key={ind.id}>
                  <td>{ind.id + 1}</td>
                  <td>{(ind.setPointX - W / 2).toFixed(1)}</td>
                  <td>{ind.replicates.map(r => r.toFixed(1)).join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <p className="muted small">CVA = {cva}%, CVI = {cvi}%, CVG = {cvg}% (illustrative scale — the visual exaggerates spacing for teaching clarity and does not use real measurement units).</p>
    </div>
  );
}


