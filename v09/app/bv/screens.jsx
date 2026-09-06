import { calculateClassicalRcv, calculateIndexOfIndividuality, calculateSerialRelativeChange } from "./calc.js";
import { BIOLOGICAL_RHYTHMS_NOTE, BIVAC_MISCONCEPTION_EXERCISE, BIVAC_QUALITY_ITEMS, BIVAC_TEACHING_NOTE, BV_CONFIDENCE_NEVER_ALTERS_SCORE_NOTE, BV_DATASET, BV_ESTIMATES_NOT_CONSTANTS_NOTE, BV_ESTIMATE_FIELDS, BV_LEVEL_EXPLANATION, BV_MISSING_FIELDS_STAY_MISSING_NOTE, BV_PATHWAY_CAUTION, BV_PATHWAY_STEPS, BV_REASONING_DIMENSIONS, BV_SYMBOL_DISCIPLINE_NOTE, COMPONENT_QUESTION_PANEL, CVG_NOT_IN_RCV_STATEMENT, CVG_SIGNATURE_EXPERIMENT, DISEASE_POPULATION_TRANSPORTABILITY_SCENARIO, EFLM_BV_DATABASE_REFERENCE, MANDATORY_LESSONS, PREANALYTICAL_TRAP_SCENARIO, RI_VS_RCV_SIGNATURE_CASES, SAMPLING_INTERVAL_TRANSPORTABILITY_SCENARIO, SERIAL_RESULT_CHALLENGE_CASES, TRANSPORTABILITY_HEALTHY_POPULATION_GUARDRAIL, TRANSPORTABILITY_TIME_SCALE_GUARDRAIL } from "./data.js";
import { ProvenanceCard, RiVsRcvComparisonPanel, VariationFoundationsVisual } from "./ui-components.jsx";
import { RecoveryFlowDiagram } from "../investigation/ui-components.jsx";
import { ExerciseRevealCard } from "../strategy/screens.jsx";
import { CONFIDENCE_OPTIONS, getConfidenceNote } from "../ui/app-data.js";
import { MetricCard, ScientificBasisNote, SliderField } from "../ui/shared-components.jsx";
import { useState, useMemo, useRef, useEffect } from "react";
import { Z_CONVENTIONS, Z_CONVENTION_IDS, evaluateClassicalRcvExceedance, evaluateLognormalRcvExceedance } from "./calc.js";
import { APS_VS_RCV_DISTINCTION_PANEL, CVA_SUBSTITUTION_TRAP_CASE, RCV_NOT_DIAGNOSTIC_CUTOFF_STATEMENT } from "./data.js";
import { BvApsTable, BvStatusBadge, ClassicalRcvDisplay, LognormalRcvDisplay } from "./ui-components.jsx";

/* =========================================================================
   BV & RCV Lab (QC-07) — screen: ONE primary nav item with five internal
   modes (Variation Foundations | BV Explorer | APS from BV | RCV
   Laboratory | Serial Result Challenge). Mirrors the architecture of
   26-eqa-screens.jsx / 22-investigation-screens.jsx. Consumes 28-bv-data.js
   (static content, the 16-case challenge bank) and 27-bv-calc.js
   (calculations) — no new calculation logic lives here.
   ========================================================================= */

export const BV_RCV_MODES = [
  { id: "foundations", label: "Variation Foundations" },
  { id: "explorer", label: "BV Explorer" },
  { id: "aps-from-bv", label: "APS from BV" },
  { id: "rcv-lab", label: "RCV Laboratory" },
  { id: "challenge", label: "Serial Result Challenge" }
];

export const BV_ANSWER_KIND_OPTIONS = {
  "yes-no": [{ id: "yes", label: "Yes" }, { id: "no", label: "No" }],
  "cvg-formula": [{ id: "includes-cvg", label: "Includes CVG (larger threshold)" }, { id: "excludes-cvg", label: "Excludes CVG (correct classical formula)" }],
  "rcv-ii-cvg": [
    { id: "rcv-rises-ii-same", label: "RCV rises, index of individuality stays the same" },
    { id: "rcv-unchanged-ii-falls", label: "RCV stays the same, index of individuality falls" },
    { id: "both-rise", label: "Both rise" },
    { id: "both-fall", label: "Both fall" }
  ],
  "aps-cva-trap": [{ id: "desirable-aps-cva", label: "The desirable-APS target CVA" }, { id: "actual-cva", label: "The laboratory's actual demonstrated CVA" }],
  "classical-lognormal": [
    { id: "both-exceed", label: "Both models are exceeded" },
    { id: "neither-exceeds", label: "Neither model is exceeded" },
    { id: "classical-only", label: "Only the classical model is exceeded" },
    { id: "lognormal-only", label: "Only the log-normal model is exceeded" }
  ],
  "missing-scope": [
    { id: "rcv-and-imprecision-aps-only", label: "RCV and imprecision APS only" },
    { id: "everything", label: "Everything (RCV, index of individuality, imprecision APS, and bias APS)" },
    { id: "nothing", label: "Nothing is computable without CVG" },
    { id: "ii-and-bias-aps-only", label: "Index of individuality and bias APS only" }
  ]
};

/* ---------------------------- VARIATION FOUNDATIONS ---------------------------- */
export function VariationFoundationsPanel({ markProgress }) {
  const [cva, setCva] = useState(2);
  const [cvi, setCvi] = useState(6);
  const [cvg, setCvg] = useState(12);
  useEffect(() => { markProgress("bv-rcv"); }, []);

  const rcv = calculateClassicalRcv(2, 6, "bidirectional-95");
  const iiSteps = CVG_SIGNATURE_EXPERIMENT.cvgSteps.map(g => calculateIndexOfIndividuality(CVG_SIGNATURE_EXPERIMENT.fixedCvi, g));

  return (
    <div>
      <h3>Which component answers which question?</h3>
      <div className="quadrant-grid">
        {COMPONENT_QUESTION_PANEL.map(c => (
          <div key={c.component} className="quadrant-cell">
            <h4>{c.component}</h4>
            <p className="muted small">{c.question}</p>
          </div>
        ))}
      </div>
      <div className="callout banner-callout">{CVG_NOT_IN_RCV_STATEMENT}</div>

      <h3>Explore the three components</h3>
      <p className="muted small">{BV_SYMBOL_DISCIPLINE_NOTE}</p>
      <SliderField id="bv-cva" label="CVA (analytical)" value={cva} min={0} max={15} step={0.5} suffix="%" onChange={setCva} />
      <SliderField id="bv-cvi" label="CVI (within-subject biological)" value={cvi} min={0.5} max={20} step={0.5} suffix="%" onChange={setCvi} />
      <SliderField id="bv-cvg" label="CVG (between-subject biological)" value={cvg} min={0.5} max={30} step={0.5} suffix="%" onChange={setCvg} />
      <VariationFoundationsVisual cva={cva} cvi={cvi} cvg={cvg} />

      <div className="metric-row">
        <MetricCard label="Classical RCV (this CVA/CVI)" value={calculateClassicalRcv(cva, cvi, "bidirectional-95").supported ? calculateClassicalRcv(cva, cvi, "bidirectional-95").value.toFixed(2) + "%" : "—"} />
        <MetricCard label="Index of individuality (this CVI/CVG)" value={calculateIndexOfIndividuality(cvi, cvg).supported ? calculateIndexOfIndividuality(cvi, cvg).value.toFixed(2) : "Not computable"} />
      </div>

      <h3>Signature experiment: does CVG change the RCV?</h3>
      <p className="muted">Fixed CVA = {CVG_SIGNATURE_EXPERIMENT.fixedCva}%, CVI = {CVG_SIGNATURE_EXPERIMENT.fixedCvi}%. CVG varies across {CVG_SIGNATURE_EXPERIMENT.cvgSteps.join("%, ")}%.</p>
      <div className="table-scroll">
        <table className="data-table">
          <thead><tr><th>CVG</th><th>Classical RCV (unchanged)</th><th>Index of individuality</th></tr></thead>
          <tbody>
            {CVG_SIGNATURE_EXPERIMENT.cvgSteps.map((g, i) => (
              <tr key={g}>
                <td>{g}%</td>
                <td>{rcv.value.toFixed(2)}%</td>
                <td>{iiSteps[i].value.toFixed(2)} (expected {CVG_SIGNATURE_EXPERIMENT.expectedIndexOfIndividuality[i]})</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ExerciseRevealCard title="" prompt={CVG_SIGNATURE_EXPERIMENT.question} answer={CVG_SIGNATURE_EXPERIMENT.correctAnswer} note={CVG_SIGNATURE_EXPERIMENT.explanation} />

      <div className="callout">
        <h2 style={{ marginTop: 0 }}>Two core lessons</h2>
        {MANDATORY_LESSONS.map((l, i) => <p key={i}>{l}</p>)}
      </div>
    </div>
  );
}

/* ---------------------------- BV EXPLORER ---------------------------- */
export function BvExplorerPanel({ goto }) {
  const [selectedId, setSelectedId] = useState(BV_DATASET[0].id);
  const selected = BV_DATASET.find(d => d.id === selectedId);
  const cases = RI_VS_RCV_SIGNATURE_CASES;

  return (
    <div>
      <h3>Estimates, not constants</h3>
      <p>{BV_ESTIMATES_NOT_CONSTANTS_NOTE}</p>
      <p className="muted small">{BV_MISSING_FIELDS_STAY_MISSING_NOTE}</p>

      <h3>EFLM Biological Variation Database</h3>
      <p className="muted small"><strong>Informs:</strong> {EFLM_BV_DATABASE_REFERENCE.informs}</p>
      <p className="callout-inline">{EFLM_BV_DATABASE_REFERENCE.doesNotEstablish}</p>

      <h3>BIVAC — appraising study quality (conceptual only)</h3>
      <p className="muted small">{BIVAC_TEACHING_NOTE}</p>
      <details className="important-note">
        <summary>14 BIVAC quality items (conceptual list, not a scoring engine)</summary>
        <ol className="mini-explain-list">{BIVAC_QUALITY_ITEMS.map((it, i) => <li key={i}>{it}</li>)}</ol>
      </details>
      <div className="exercise-reveal-card">
        <p>{BIVAC_MISCONCEPTION_EXERCISE.narrative}</p>
        <ExerciseRevealCard title="" prompt={BIVAC_MISCONCEPTION_EXERCISE.question} answer={BIVAC_MISCONCEPTION_EXERCISE.correctAnswer} note={BIVAC_MISCONCEPTION_EXERCISE.explanation} />
      </div>

      <h3>Transportability guardrails</h3>
      <ul className="mini-explain-list">
        <li>{TRANSPORTABILITY_HEALTHY_POPULATION_GUARDRAIL}</li>
        <li>{TRANSPORTABILITY_TIME_SCALE_GUARDRAIL}</li>
      </ul>
      <p className="callout-inline">{BIOLOGICAL_RHYTHMS_NOTE}</p>

      <h3>Transportability scenarios</h3>
      <div className="exercise-reveal-card">
        <p>{DISEASE_POPULATION_TRANSPORTABILITY_SCENARIO.narrative}</p>
        <ExerciseRevealCard title="" prompt={DISEASE_POPULATION_TRANSPORTABILITY_SCENARIO.question} answer={DISEASE_POPULATION_TRANSPORTABILITY_SCENARIO.correctAnswer} note={DISEASE_POPULATION_TRANSPORTABILITY_SCENARIO.explanation} />
      </div>
      <div className="exercise-reveal-card">
        <p>{SAMPLING_INTERVAL_TRANSPORTABILITY_SCENARIO.narrative}</p>
        <ExerciseRevealCard title="" prompt={SAMPLING_INTERVAL_TRANSPORTABILITY_SCENARIO.question} answer={SAMPLING_INTERVAL_TRANSPORTABILITY_SCENARIO.correctAnswer} note={SAMPLING_INTERVAL_TRANSPORTABILITY_SCENARIO.explanation} />
      </div>
      <div className="exercise-reveal-card">
        <p>{PREANALYTICAL_TRAP_SCENARIO.narrative}</p>
        <ExerciseRevealCard title="" prompt={PREANALYTICAL_TRAP_SCENARIO.question} answer={PREANALYTICAL_TRAP_SCENARIO.correctAnswer} note={PREANALYTICAL_TRAP_SCENARIO.explanation} />
      </div>

      <h3>Reference interval vs. reference change value — two signature cases</h3>
      <p className="muted">Both cases use CVA = {cases.cva}%, CVI = {cases.cvi}%, reference interval {cases.referenceInterval.low}-{cases.referenceInterval.high} {cases.referenceInterval.units}.</p>
      <h4>Case A — inside the reference interval</h4>
      <p className="muted small">{cases.caseA.narrative}</p>
      <RiVsRcvComparisonPanel referenceInterval={cases.referenceInterval} previousResult={cases.caseA.previousResult} currentResult={cases.caseA.currentResult} cva={cases.cva} cvi={cases.cvi} zConventionId={cases.zConventionId} />
      <ExerciseRevealCard title="" prompt={cases.caseA.question} answer={cases.caseA.correctAnswer} note={cases.caseA.explanation} />
      <h4>Case B — outside the reference interval</h4>
      <p className="muted small">{cases.caseB.narrative}</p>
      <RiVsRcvComparisonPanel referenceInterval={cases.referenceInterval} previousResult={cases.caseB.previousResult} currentResult={cases.caseB.currentResult} cva={cases.cva} cvi={cases.cvi} zConventionId={cases.zConventionId} />
      <ExerciseRevealCard title="" prompt={cases.caseB.question} answer={cases.caseB.correctAnswer} note={cases.caseB.explanation} />

      <h3>Database Explorer</h3>
      <p className="muted small">{BV_DATASET.length} measurand records, each illustrating a different evidence situation.</p>
      <div className="option-list option-list-grid">
        {BV_DATASET.map(d => (
          <button key={d.id} className={"option-btn small" + (selectedId === d.id ? " option-selected" : "")} onClick={() => setSelectedId(d.id)}>{d.measurand}</button>
        ))}
      </div>
      <ProvenanceCard estimate={selected} />
      {selected.cvg == null && <p className="callout-inline">This record has no CVG. RCV remains computable from CVA/CVI alone; the index of individuality and the bias component of a BV-derived APS are not computable.</p>}
      {selected.cva == null && <p className="callout-inline">This record has no CVA. This application does not assume a missing CVA is zero — RCV is reported as not computable due to insufficient analytical-variation information unless an illustrative CVA is explicitly selected elsewhere.</p>}

      <details className="important-note">
        <summary>BiologicalVariationEstimate data model</summary>
        <dl className="glossary-list">{BV_ESTIMATE_FIELDS.map(f => <div key={f.field} className="glossary-item"><dt>{f.field}</dt><dd>{f.def}</dd></div>)}</dl>
      </details>
    </div>
  );
}

/* ---------------------------- APS FROM BV ---------------------------- */
export function ApsFromBvPanel({ goto }) {
  const [cvi, setCvi] = useState(6);
  const [cvg, setCvg] = useState(12);
  return (
    <div>
      <h3>Milan Model 2 — analytical performance specifications from biological variation</h3>
      <p className="muted">This reconnects with the existing APS Explorer's Milan-model framework — a BV-derived APS is one of several legitimate models, not a universal specification. <button className="btn-link" onClick={() => goto("strategy")}>Open the APS Explorer (QC Strategy Lab)</button></p>
      <SliderField id="aps-cvi" label="CVI" value={cvi} min={0.5} max={20} step={0.5} suffix="%" onChange={setCvi} />
      <SliderField id="aps-cvg" label="CVG" value={cvg} min={0.5} max={30} step={0.5} suffix="%" onChange={setCvg} />
      <BvApsTable cvi={cvi} cvg={cvg} />

      <h3>APS vs. RCV — a critical distinction</h3>
      <div className="quadrant-grid">
        {APS_VS_RCV_DISTINCTION_PANEL.map((qa, i) => (
          <div key={i} className="quadrant-cell">
            <h4>{qa.question}</h4>
            <p className="muted small">{qa.answer}</p>
          </div>
        ))}
      </div>

      <h3>The CVA-substitution trap</h3>
      <div className="exercise-reveal-card">
        <p>{CVA_SUBSTITUTION_TRAP_CASE.narrative}</p>
        <ExerciseRevealCard title="" prompt={CVA_SUBSTITUTION_TRAP_CASE.question} answer={CVA_SUBSTITUTION_TRAP_CASE.correctAnswer} note={CVA_SUBSTITUTION_TRAP_CASE.explanation} />
      </div>
    </div>
  );
}

/* ---------------------------- RCV LABORATORY ---------------------------- */
export function RcvLaboratoryPanel({ goto }) {
  const [cva, setCva] = useState(2);
  const [cvi, setCvi] = useState(6);
  const [zConventionId, setZConventionId] = useState("bidirectional-95");
  const [model, setModel] = useState("classical");
  const [previousResult, setPreviousResult] = useState(100);
  const [currentResult, setCurrentResult] = useState(120);
  const [showRi, setShowRi] = useState(false);
  const [ri, setRi] = useState({ low: 70, high: 110 });

  const classicalExceed = evaluateClassicalRcvExceedance(previousResult, currentResult, cva, cvi, zConventionId);
  const lognormalExceed = evaluateLognormalRcvExceedance(previousResult, currentResult, cva, cvi, zConventionId);
  const activeExceed = model === "classical" ? classicalExceed : lognormalExceed;

  return (
    <div>
      <div className="callout banner-callout">{RCV_NOT_DIAGNOSTIC_CUTOFF_STATEMENT}</div>

      <h3>Select an RCV model</h3>
      <div className="tabbar" role="tablist" aria-label="RCV model">
        <button role="tab" aria-selected={model === "classical"} className={"tab" + (model === "classical" ? " tab-active" : "")} onClick={() => setModel("classical")}>Classical (symmetric)</button>
        <button role="tab" aria-selected={model === "lognormal"} className={"tab" + (model === "lognormal" ? " tab-active" : "")} onClick={() => setModel("lognormal")}>Log-normal (asymmetric)</button>
      </div>

      <SliderField id="rcv-cva" label="CVA (actual, demonstrated)" value={cva} min={0} max={15} step={0.5} suffix="%" onChange={setCva} />
      <SliderField id="rcv-cvi" label="CVI" value={cvi} min={0.5} max={20} step={0.5} suffix="%" onChange={setCvi} />
      <div className="control-group">
        <span className="control-group-label">z-value convention</span>
        <div className="btn-row">
          {Z_CONVENTION_IDS.map(id => (
            <button key={id} type="button" className={"option-btn small" + (zConventionId === id ? " option-selected" : "")} onClick={() => setZConventionId(id)}>{Z_CONVENTIONS[id].label}</button>
          ))}
        </div>
      </div>

      {model === "classical" ? <ClassicalRcvDisplay cva={cva} cvi={cvi} zConventionId={zConventionId} /> : <LognormalRcvDisplay cva={cva} cvi={cvi} zConventionId={zConventionId} />}

      <h3>Interpret a serial change</h3>
      <SliderField id="rcv-prev" label="Previous result" value={previousResult} min={1} max={300} step={1} onChange={setPreviousResult} />
      <SliderField id="rcv-curr" label="Current result" value={currentResult} min={1} max={300} step={1} onChange={setCurrentResult} />
      {activeExceed.supported ? (
        <div className="bv-result-card">
          <p>Relative change: {activeExceed.relativeChange.toFixed(2)}% ({activeExceed.direction})</p>
          <p>Threshold ({model === "classical" ? "classical" : "log-normal, " + activeExceed.direction}): {activeExceed.threshold.toFixed(2)}%</p>
          <p><BvStatusBadge kind="rcv-exceedance" value={activeExceed.exceeds ? "exceeds" : "does-not-exceed"} /></p>
          <p className="muted small">{activeExceed.note}</p>
        </div>
      ) : <p className="muted small">{activeExceed.reason}</p>}

      <button className="btn-secondary" onClick={() => setShowRi(!showRi)}>{showRi ? "Hide" : "Show"} reference-interval overlay (an independent, separate question)</button>
      {showRi && (
        <div>
          <SliderField id="ri-low" label="Reference interval — low" value={ri.low} min={0} max={ri.high - 1} step={1} onChange={v => setRi({ ...ri, low: v })} />
          <SliderField id="ri-high" label="Reference interval — high" value={ri.high} min={ri.low + 1} max={400} step={1} onChange={v => setRi({ ...ri, high: v })} />
          <RiVsRcvComparisonPanel referenceInterval={ri} previousResult={previousResult} currentResult={currentResult} cva={cva} cvi={cvi} zConventionId={zConventionId} />
        </div>
      )}

      <p className="muted small"><button className="btn-link" onClick={() => goto("investigation")}>Explore how an out-of-control investigation is structured (Investigation Lab)</button> — these two modules do not share mutable scenario state; the link is conceptual only.</p>
    </div>
  );
}

/* ---------------------------- SERIAL RESULT CHALLENGE ---------------------------- */
export function SerialResultChallengePanel({ markProgress }) {
  const [idx, setIdx] = useState(0);
  const [byCase, setByCase] = useState({});
  const kase = SERIAL_RESULT_CHALLENGE_CASES[idx];
  const ans = byCase[kase.id] || { answerId: null, confidence: null, completed: false };

  function update(patch) { setByCase(prev => ({ ...prev, [kase.id]: { ...ans, ...patch } })); }
  function submitCase() { update({ completed: true }); markProgress("bv-rcv"); }

  const attempted = Object.values(byCase).filter(a => a.completed).length;
  function scoreForDimension(dimIdx) {
    const dim = BV_REASONING_DIMENSIONS[dimIdx];
    let correct = 0, total = 0;
    SERIAL_RESULT_CHALLENGE_CASES.forEach(c => {
      const a = byCase[c.id];
      if (!a || !a.completed) return;
      total++;
      if (a.answerId === c.correctAnswer) correct++;
    });
    return total > 0 ? correct + " / " + total : "0 / 0";
  }

  const options = BV_ANSWER_KIND_OPTIONS[kase.answerKind] || [];

  return (
    <div>
      <p className="muted">{kase.title ? "" : ""}Sixteen deterministic cases (fourteen required, two optional). Work through each case's reasoning, then record your confidence.</p>
      <div className="challenge-nav">
        {SERIAL_RESULT_CHALLENGE_CASES.map((c, i) => (
          <button key={c.id} className={"case-chip" + (i === idx ? " case-chip-active" : "") + ((byCase[c.id] && byCase[c.id].completed) ? " case-chip-done" : "")} onClick={() => setIdx(i)} aria-current={i === idx}>{i + 1}</button>
        ))}
      </div>

      <div className="case-panel">
        <h2>{kase.title}</h2>
        <p className="muted small">{kase.narrative}</p>
        {kase.previousResult != null && kase.currentResult != null && (
          <p className="muted small">Previous: {kase.previousResult}, Current: {kase.currentResult} ({calculateSerialRelativeChange(kase.previousResult, kase.currentResult).supported ? calculateSerialRelativeChange(kase.previousResult, kase.currentResult).value.toFixed(2) + "%" : "n/a"})</p>
        )}

        <p className="q-prompt">{kase.question}</p>
        <div className="option-list option-list-grid">
          {options.map(o => (
            <button key={o.id} className={"option-btn small" + (ans.answerId === o.id ? " option-selected" : "")} onClick={() => update({ answerId: o.id })}>{o.label}</button>
          ))}
        </div>

        {!ans.completed ? (
          <div>
            <p className="q-prompt">How confident are you in this answer?</p>
            <div className="option-list option-list-grid option-list-narrow">
              {CONFIDENCE_OPTIONS.map(o => <button key={o.id} className={"option-btn small" + (ans.confidence === o.id ? " option-selected" : "")} onClick={() => update({ confidence: o.id })}>{o.label}</button>)}
            </div>
            <button className="btn-primary" onClick={submitCase} disabled={!ans.answerId || !ans.confidence}>Submit case</button>
          </div>
        ) : (
          <div className="feedback-panel">
            <h3>Feedback</h3>
            <p><strong>{ans.answerId === kase.correctAnswer ? "Correct." : "Not quite."}</strong></p>
            <p>{kase.explanation}</p>
            <p className="muted small">{getConfidenceNote(ans.confidence, ans.answerId === kase.correctAnswer)}</p>
            <p className="muted small">{BV_CONFIDENCE_NEVER_ALTERS_SCORE_NOTE}</p>
            <div className="btn-row">
              {idx < SERIAL_RESULT_CHALLENGE_CASES.length - 1 && <button className="btn-secondary" onClick={() => setIdx(idx + 1)}>Next case</button>}
              {idx > 0 && <button className="btn-link" onClick={() => setIdx(idx - 1)}>Previous case</button>}
            </div>
          </div>
        )}
      </div>

      <div className="score-summary">
        <h3>Session scoring ({attempted} / {SERIAL_RESULT_CHALLENGE_CASES.length} cases completed)</h3>
        <p className="muted small">Reasoning dimensions are reported separately — confidence is metacognitive only and never changes these scores.</p>
        <div className="metric-row">
          {BV_REASONING_DIMENSIONS.map((dim, i) => <MetricCard key={dim} label={dim} value={scoreForDimension(i)} />)}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- SCREEN SHELL ---------------------------- */
export function BvRcvLabScreen({ level, markProgress, goto }) {
  const [mode, setMode] = useState("foundations");
  return (
    <div className="screen">
      <h1>BV &amp; RCV Lab</h1>
      <p className="muted">Biological variation, analytical performance specifications derived from it, and reference change values for interpreting serial results. This is an educational reasoning pathway — {BV_PATHWAY_STEPS.join(" → ")} — not a rigid universal sequence.</p>
      <RecoveryFlowDiagram steps={BV_PATHWAY_STEPS} />
      <p className="callout-inline">{BV_PATHWAY_CAUTION}</p>
      <p className="muted small">{BV_LEVEL_EXPLANATION[level] || BV_LEVEL_EXPLANATION.intermediate}</p>

      <div className="tabbar" role="tablist" aria-label="BV & RCV Lab mode">
        {BV_RCV_MODES.map(m => (
          <button key={m.id} role="tab" aria-selected={mode === m.id} className={"tab" + (mode === m.id ? " tab-active" : "")} onClick={() => setMode(m.id)}>{m.label}</button>
        ))}
      </div>

      {mode === "foundations" && <VariationFoundationsPanel markProgress={markProgress} />}
      {mode === "explorer" && <BvExplorerPanel goto={goto} />}
      {mode === "aps-from-bv" && <ApsFromBvPanel goto={goto} />}
      {mode === "rcv-lab" && <RcvLaboratoryPanel goto={goto} />}
      {mode === "challenge" && <SerialResultChallengePanel markProgress={markProgress} />}

      <ScientificBasisNote goto={goto} text="This lab draws on Harris & Yasaka (1983) for the classical reference change value, Fokkema et al. (2006) for the log-normal asymmetric model, Aarsand et al. (2018) and Bartlett et al. (2018) for BIVAC and BV data provenance, Panteghini & Sandberg (2015) and Fraser (2020) for the biological-variation-derived APS context, and the EuBIVAS thyroid study (2021) for the module's one literature-derived-snapshot record — see the Evidence page for full provenance, evidentiary tier, and scope." />
    </div>
  );
}
