/* =========================================================================
   QC Strategy Lab — reusable UI components (procedure cards, framework
   provenance disclosure, comparator table).
   ========================================================================= */

function ruleLabelList(ruleIds) {
  return ruleIds.map(id => RULE_LABELS[id]).join(" / ");
}

/* Ordinal, clearly-labelled-as-qualitative complexity/detection/burden
   estimate derived from rule count and the sequential observation
   capacity (N * R, NOT the raw per-run N — see spec v0.3.2 section 5).
   Never presented as a validated statistic — only operatingCharacteristic()
   results are. */
function qualitativeComplexity(proc) {
  const score = proc.ruleIds.length + sequentialObservationCapacity(proc) / 2;
  if (score <= 3) return "Low";
  if (score <= 5) return "Moderate";
  return "High";
}
function qualitativeDetection(proc) {
  if (proc.ruleIds.length <= 1) return "Lower — catches large/extreme errors only";
  if (proc.ruleIds.length <= 3) return "Moderate — adds sensitivity to some systematic patterns";
  return "Higher — sensitive to smaller sustained systematic errors";
}
function qualitativeFalseRejectionBurden(proc) {
  if (proc.ruleIds.length <= 1) return "Lower";
  if (proc.ruleIds.length <= 3) return "Moderate";
  return "Higher";
}

/* Framework provenance disclosure — attached to every automated Sigma-to-
   procedure suggestion (spec section 37: "the UI must be able to show why
   did the application suggest this procedure, with the provenance attached"). */
function FrameworkProvenanceNote({ mapping }) {
  if (!mapping || !mapping.framework) return null;
  const fw = mapping.framework;
  return (
    <details className="framework-note">
      <summary>Why did the application suggest this procedure?</summary>
      <dl className="evidence-fields">
        <dt>Framework used</dt><dd>{fw.frameworkName}</dd>
        <dt>Source</dt><dd>{fw.frameworkSource}{fw.frameworkLink && <> — <a href={fw.frameworkLink} target="_blank" rel="noopener noreferrer">reference ↗</a></>}</dd>
        <dt>Version / date</dt><dd>{fw.frameworkVersionOrDate}</dd>
        <dt>Assumptions</dt>
        <dd><ul className="mini-explain-list">{fw.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul></dd>
        {Array.isArray(fw.boundaryProvenance) && fw.boundaryProvenance.length > 0 && (
          <>
            <dt>Boundary provenance</dt>
            <dd><ul className="mini-explain-list">{fw.boundaryProvenance.map((b, i) => (
              <li key={i}><strong>Sigma {b.threshold}:</strong> {b.status === "application-convention" ? "Application implementation convention — " : "Directly specified by the cited source — "}{b.note}</li>
            ))}</ul></dd>
          </>
        )}
      </dl>
      {mapping.band && <p className="muted small">{frameworkWhyText(mapping)}</p>}
    </details>
  );
}

function ProcedureCard({ procedure, highlight }) {
  return (
    <div className={"procedure-card" + (highlight ? " procedure-card-highlight" : "")}>
      <div className="procedure-card-head">
        <span className="procedure-name">{procedure.name}</span>
        {highlight && <Badge tone="recommended">Framework-suggested</Badge>}
      </div>
      <dl className="evidence-fields">
        <dt>Rule set</dt><dd>{ruleLabelList(procedure.ruleIds)}</dd>
        <dt>N (control measurements per run)</dt><dd>{procedure.N}</dd>
        <dt>R (consecutive runs)</dt><dd>{procedure.R}</dd>
        <dt>Sequential observations inspected (N × R)</dt><dd>{sequentialObservationCapacity(procedure)}</dd>
        <dt>Interpretation</dt><dd>{procedure.interpretation}</dd>
        <dt>Provenance</dt><dd>{procedure.provenance}</dd>
      </dl>
    </div>
  );
}

/* Comparator table: rule set / N / R / complexity / detection / false-
   rejection burden / operating-characteristic / limitations, for 2+
   candidate procedures at a shared assumed systematic-error size. */
function ComparatorTable({ procedures, deltaSE }) {
  return (
    <div className="table-scroll">
      <table className="data-table comparator-table">
        <thead>
          <tr>
            <th>Procedure</th><th>Rule set</th><th>N (per run)</th><th>R (runs)</th><th>N × R</th>
            <th>Relative complexity</th><th>Detection (qualitative)</th>
            <th>False-rejection burden (qualitative)</th>
            <th>Operating characteristic (Δ={deltaSE} SD)</th>
          </tr>
        </thead>
        <tbody>
          {procedures.map(p => {
            const oc = operatingCharacteristic(p.ruleIds, p.N, deltaSE);
            return (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{ruleLabelList(p.ruleIds)}</td>
                <td>{p.N}</td>
                <td>{p.R}</td>
                <td>{sequentialObservationCapacity(p)}</td>
                <td>{qualitativeComplexity(p)}</td>
                <td>{qualitativeDetection(p)}</td>
                <td>{qualitativeFalseRejectionBurden(p)}</td>
                <td>{oc.supported
                  ? "Ped ≈ " + (oc.ped * 100).toFixed(1) + "%, Pfr ≈ " + (oc.pfr * 100).toFixed(2) + "%"
                  : "Not numerically implemented in this version"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <details className="important-note">
        <summary>Why aren't Ped/Pfr shown for every procedure?</summary>
        <p className="muted small">Multirule operating characteristics require dedicated joint statistical modelling; they are not obtained by treating individual rule detections as independent (for example by adding or multiplying single-rule probabilities together). {OPCHAR_SCOPE_NOTE}</p>
      </details>
    </div>
  );
}
