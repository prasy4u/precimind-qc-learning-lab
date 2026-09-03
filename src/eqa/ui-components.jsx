   External Assurance Lab (QC-10) — reusable UI components: EQA-specific
   status badges (a fifth, independent icon-map family — never sharing
   glyphs with 21-investigation-components.jsx's StatusBadge, so an EQA
   "indeterminate" badge is never visually confused with an Investigation
   Lab status), the EQA report card, the commutability challenge component,
   the Scheme Capability Profile display, an accessible longitudinal
   timeline chart (line + point symbols + a text-alternative data table,
   never colour alone), and the paired-comparison table for the
   Comparability Lab. All calculation logic is imported from
   23-eqa-calc.js; all text/scenario content from 24-eqa-data.js — no new
   content or calculation is authored here. Mirrors the architecture of
   21-investigation-components.jsx.
   ========================================================================= */

function humanizeEqaStatus(s) {
  if (s == null) return "Not stated";
  return String(s).replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

/* -------------------------------------------------------------------------
   EQA status badges — a separate icon-map family from the Investigation
   Lab's StatusBadge (spec section 81: never colour alone).
   ------------------------------------------------------------------------- */
const EQA_COMMUTABILITY_ICONS = {
  "verified-commutable": "✓",
  "noncommutable": "✕",
  "commutability-not-established": "?",
  "not-applicable-or-insufficient-information": "—"
};
const EQA_CURRENT_STATUS_ICONS = {
  "meets-criterion": "✓",
  "does-not-meet-criterion": "△",
  "criterion-not-stated": "—",
  "indeterminate": "?"
};
const EQA_LONGITUDINAL_ICONS = {
  "stable-no-persistent-deviation-apparent": "●",
  "isolated-eqa-excursion": "◇",
  "persistent-positive-deviation": "▲",
  "persistent-negative-deviation": "▽",
  "step-change": "⤴",
  "performance-improving": "↗",
  "method-group-pattern": "◈",
  "indeterminate": "?"
};
const EQA_COMPARABILITY_ICONS = {
  "stable-agreement": "●",
  "step-change": "⤴",
  "gradual-divergence": "↝",
  "temporary-excursion": "◇",
  "recovery-after-intervention": "↻",
  "indeterminate": "?"
};
const EQA_INVESTIGATION_ICONS = {
  "not-yet-reviewed": "○",
  "under-review": "◐",
  "referred-to-investigation-lab": "→",
  "resolved-participant-specific": "●",
  "resolved-method-group": "◈",
  "resolved-reporting-error": "✎",
  "unresolved": "?"
};

function EqaStatusBadge({ kind, value }) {
  const icons = kind === "commutability" ? EQA_COMMUTABILITY_ICONS
    : kind === "current" ? EQA_CURRENT_STATUS_ICONS
    : kind === "longitudinal" ? EQA_LONGITUDINAL_ICONS
    : kind === "comparability" ? EQA_COMPARABILITY_ICONS
    : EQA_INVESTIGATION_ICONS;
  const label = kind === "longitudinal" ? (LONGITUDINAL_PATTERN_LABELS[value] || humanizeEqaStatus(value)) : humanizeEqaStatus(value);
  const icon = (value != null && icons[value]) || "•";
  return (
    <span className="status-badge">
      <span className="status-badge-icon" aria-hidden="true">{icon}</span>
      <span className="status-badge-label">{label}</span>
    </span>
  );
}

function EqaStatusRow({ currentEqaStatus, longitudinalEqaPattern, comparabilityStatus, investigationStatus }) {
  return (
    <div className="status-row">
      {currentEqaStatus && <EqaStatusBadge kind="current" value={currentEqaStatus} />}
      {longitudinalEqaPattern && <EqaStatusBadge kind="longitudinal" value={longitudinalEqaPattern} />}
      {comparabilityStatus && <EqaStatusBadge kind="comparability" value={comparabilityStatus} />}
      {investigationStatus && <EqaStatusBadge kind="investigation" value={investigationStatus} />}
    </div>
  );
}

/* -------------------------------------------------------------------------
   EQA report card (spec section 6, 23-27). Renders only the fields present
   on the result — missing fields are shown as "Not stated", never invented
   (spec section 6, MISSING_FIELDS_STAY_MISSING_NOTE).
   ------------------------------------------------------------------------- */
function EqaReportCard({ result }) {
  if (!result) return <p className="event-list-empty">No EQA result is authored for this case.</p>;
  const targetLabel = result.assignedValueType ? (TARGET_VALUE_TYPE_LABELS[result.assignedValueType] || result.assignedValueType) : "Not stated";
  const criterion = result.performanceCriterion;
  return (
    <div className="eqa-report-card">
      <div className="eqa-report-head">
        <span className="eqa-report-round">{result.round || "Round not stated"}</span>
        <span className="eqa-report-measurand">{result.measurand || "Measurand not stated"}</span>
      </div>
      <div className="table-scroll">
        <table className="data-table">
          <tbody>
            <tr><td>Participant result</td><td>{result.participantResult != null ? result.participantResult + " " + (result.units || "") : "Not stated"}</td></tr>
            <tr><td>Assigned value</td><td>{result.assignedValue != null ? result.assignedValue + " " + (result.units || "") : "Not stated"}</td></tr>
            <tr><td>Assigned value type</td><td>{targetLabel}</td></tr>
            <tr><td>Commutability status</td><td>{result.commutabilityStatus ? <EqaStatusBadge kind="commutability" value={result.commutabilityStatus} /> : "Not stated"}</td></tr>
            <tr><td>Peer group</td><td>{result.peerGroup || "Not stated"}</td></tr>
            <tr><td>Peer-group mean</td><td>{result.peerGroupMean != null ? result.peerGroupMean : "Not stated"}</td></tr>
            <tr><td>All-participant mean</td><td>{result.allParticipantMean != null ? result.allParticipantMean : "Not stated"}</td></tr>
            <tr><td>SDPA</td><td>{result.sdpa != null ? result.sdpa : "Not stated"}</td></tr>
            <tr><td>Performance criterion</td><td>{criterion ? (PERFORMANCE_CRITERION_TYPE_LABELS[criterion.type] || criterion.type) + ": " + criterion.value : "Not stated"}</td></tr>
          </tbody>
        </table>
      </div>
      {result.interpretationLimitations && result.interpretationLimitations.length > 0 && (
        <div>
          <p className="muted small"><strong>Stated limitations:</strong></p>
          <ul className="mini-explain-list">{result.interpretationLimitations.map((l, i) => <li key={i}>{l}</li>)}</ul>
        </div>
      )}
      <p className="muted small">{MISSING_FIELDS_STAY_MISSING_NOTE}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Commutability challenge component (spec section 13) — "Does the EQA
   material behave like patient samples?"
   ------------------------------------------------------------------------- */
function CommutabilityChallengeComponent({ example }) {
  const ex = example;
  return (
    <div className="exercise-reveal-card">
      <h4>Does the EQA material behave like patient samples?</h4>
      <p className="muted small">{ex.patientSampleNarrative}</p>
      <div className="table-scroll">
        <table className="data-table">
          <thead><tr><th>Processed EQA sample</th><th>Method A</th><th>Method B</th></tr></thead>
          <tbody><tr><td>Result</td><td>{ex.processedSample.methodA}</td><td>{ex.processedSample.methodB}</td></tr></tbody>
        </table>
      </div>
      <p><EqaStatusBadge kind="commutability" value={ex.commutabilityStatus} /></p>
      <ExerciseRevealCard title="" prompt={ex.question} answer={ex.correctAnswer} note={ex.explanation} />
    </div>
  );
}

/* -------------------------------------------------------------------------
   Scheme Capability Profile display (spec sections 14-18). Renders
   describeSchemeCapability()'s output — qualitative statements/limitations
   plus three independently-computed boolean capability flags, never a
   single Miller-style category number.
   ------------------------------------------------------------------------- */
function SchemeCapabilityProfileDisplay({ profile }) {
  const result = describeSchemeCapability(profile);
  return (
    <div className="eqa-capability-card">
      <div className="quadrant-grid">
        <div className="quadrant-cell">
          <h4>Participant performance</h4>
          <p>{result.canAssessParticipantPerformance ? "✓ May be assessable" : "✕ Not supported by this profile"}</p>
        </div>
        <div className="quadrant-cell">
          <h4>Method performance</h4>
          <p>{result.canAssessMethodPerformance ? "✓ May be assessable" : "✕ Not supported by this profile"}</p>
        </div>
        <div className="quadrant-cell">
          <h4>Harmonisation</h4>
          <p>{result.canAssessHarmonisation ? "✓ May be assessable" : "✕ Not supported by this profile"}</p>
        </div>
      </div>
      {result.statements.length > 0 && (
        <div>
          <p className="muted small"><strong>What this profile supports:</strong></p>
          <ul className="mini-explain-list">{result.statements.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
      )}
      {result.limitations.length > 0 && (
        <div>
          <p className="muted small"><strong>Stated limitations:</strong></p>
          <ul className="mini-explain-list">{result.limitations.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
      )}
      <p className="callout-inline">{CAPABILITY_MILLER_ATTRIBUTION_NOTE}</p>
    </div>
  );
}

/* Interactive builder — five tri-state (Yes / No / Not stated) toggles that
   feed SchemeCapabilityProfileDisplay. Purely a teaching interface over the
   pure describeSchemeCapability() function; no new calculation logic. */
function SchemeCapabilityProfileBuilder({ profile, onChange }) {
  function setField(id, val) { onChange({ ...profile, [id]: val }); }
  return (
    <div>
      <div className="option-list option-list-grid">
        {SCHEME_CAPABILITY_INPUTS.map(inp => (
          <div key={inp.id} className="control-group">
            <span className="control-group-label">{inp.label}</span>
            <div className="btn-row">
              {[["Yes", true], ["No", false], ["Not stated", null]].map(([lbl, v]) => (
                <button key={lbl} type="button"
                  className={"option-btn small" + (profile[inp.id] === v ? " option-selected" : "")}
                  onClick={() => setField(inp.id, v)}>{lbl}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <SchemeCapabilityProfileDisplay profile={profile} />
    </div>
  );
}

/* -------------------------------------------------------------------------
   Longitudinal EQA chart (spec sections 29-31, 80-81). An accessible SVG
   line chart: point shape/labels carry meaning, never colour alone, and a
   text-alternative data table is always available (mirrors LJChart's
   established pattern in 04-components.jsx).
   ------------------------------------------------------------------------- */
function LongitudinalEqaChart({ timeline, criterionLabel }) {
  const [active, setActive] = useState(null);
  if (!timeline || timeline.length === 0) return <p className="event-list-empty">No longitudinal data is authored for this case.</p>;
  const W = 720, H = 320;
  const padL = 56, padR = 24, padT = 20, padB = 50;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const n = timeline.length;
  const xFor = i => padL + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const vals = timeline.map(p => p.deviationPct);
  const maxAbs = Math.max(10, ...vals.map(v => Math.abs(v)));
  const yFor = v => padT + plotH / 2 - (v / maxAbs) * (plotH / 2);
  const gridLevels = [-Math.round(maxAbs), 0, Math.round(maxAbs)];
  const pathD = timeline.map((p, i) => (i === 0 ? "M" : "L") + xFor(i).toFixed(2) + "," + yFor(p.deviationPct).toFixed(2)).join(" ");

  return (
    <div className="ljchart-wrap">
      <svg viewBox={"0 0 " + W + " " + H} className="ljchart-svg" role="img" aria-label={"Longitudinal EQA deviation chart, " + n + " rounds"}>
        {gridLevels.map(lv => (
          <g key={lv}>
            <line x1={padL} x2={W - padR} y1={yFor(lv)} y2={yFor(lv)} className={lv === 0 ? "grid-line grid-mean" : "grid-line grid-1"} strokeDasharray={lv === 0 ? "0" : "5 3"} />
            <text x={padL - 8} y={yFor(lv) + 4} textAnchor="end" className="axis-label-y">{lv > 0 ? "+" + lv + "%" : lv + "%"}</text>
          </g>
        ))}
        <path d={pathD} className="ljchart-line" fill="none" />
        {timeline.map((p, i) => {
          const x = xFor(i), y = yFor(p.deviationPct);
          const hasEvent = !!p.event;
          return (
            <g key={i} onClick={() => setActive(i === active ? null : i)} onFocus={() => setActive(i)} tabIndex={0} role="button"
              aria-label={"Round " + p.round + ", deviation " + p.deviationPct + "%" + (hasEvent ? ", event: " + p.event : "")}
              className="ljchart-point-g">
              {hasEvent && <line x1={x} x2={x} y1={padT} y2={H - padB} className="event-line" />}
              <circle cx={x} cy={y} r={active === i ? 7 : 5} className={"ljchart-point" + (hasEvent ? " point-warn" : "")} />
              {hasEvent && <text x={x + 5} y={padT + 12} className="event-label">Event</text>}
            </g>
          );
        })}
        {timeline.map((p, i) => (
          <text key={"t" + i} x={xFor(i)} y={H - padB + 16} textAnchor="middle" className="axis-label-x">{p.round}</text>
        ))}
        <text x={padL + plotW / 2} y={H - 8} textAnchor="middle" className="axis-title">Round</text>
      </svg>
      <div className="ljchart-tooltip" aria-live="polite">
        {active != null ? (
          <span><strong>Round {timeline[active].round}:</strong> {fmtSigned(timeline[active].deviationPct, 1)}% deviation{timeline[active].event ? " — " + timeline[active].event : ""}</span>
        ) : (
          <span className="muted">Click or focus a point to inspect its round, deviation and any recorded event.</span>
        )}
      </div>
      {criterionLabel && <p className="muted small">Criterion for these rounds: {criterionLabel}</p>}
      <details className="ljchart-table-details">
        <summary>Show data table (text alternative)</summary>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>Round</th><th>Deviation</th><th>Event</th></tr></thead>
            <tbody>{timeline.map((p, i) => <tr key={i}><td>{p.round}</td><td>{fmtSigned(p.deviationPct, 1)}%</td><td>{p.event || "—"}</td></tr>)}</tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Paired-comparison table (Comparability Lab, spec sections 38-42). Uses
   calculatePairedDifference/calculatePairedRelativeDifference only —
   deliberately no regression, no limits of agreement (spec section 42).
   ------------------------------------------------------------------------- */
function PairedComparisonTable({ specimens, criterion }) {
  if (!specimens || specimens.length === 0) return <p className="event-list-empty">No paired specimen data is authored for this exercise.</p>;
  return (
    <div>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr><th>Specimen</th><th>Analyzer A (designated comparator)</th><th>Analyzer B</th><th>Difference (B − A)</th><th>Relative difference</th></tr>
          </thead>
          <tbody>
            {specimens.map(sp => {
              const abs = calculatePairedDifference(sp.analyzerA, sp.analyzerB);
              const rel = calculatePairedRelativeDifference(sp.analyzerA, sp.analyzerB);
              return (
                <tr key={sp.id}>
                  <td>{sp.id}</td><td>{sp.analyzerA}</td><td>{sp.analyzerB}</td>
                  <td>{abs.supported ? fmtSigned(abs.value, 1) : "—"}</td>
                  <td>{rel.supported ? fmtSigned(rel.value, 1) + "%" : <span title={rel.reason}>Not applicable</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {criterion && <p className="muted small">{COMPARABILITY_LIMIT_LABEL}: {criterion.value}. {criterion.source}</p>}
      <p className="muted small">{DESIGNATED_COMPARATOR_NOTE}</p>
    </div>
  );
}

/* Longitudinal Analyzer-A-vs-B summary table (spec section 45). */
function LongitudinalComparabilityTable({ rows }) {
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead><tr><th>Period</th><th>Mean difference</th><th>Status</th><th>Event</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.period}</td><td>{fmtSigned(r.meanDifference, 1)}</td>
              <td><EqaStatusBadge kind="comparability" value={r.status} /></td>
              <td>{r.event || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

