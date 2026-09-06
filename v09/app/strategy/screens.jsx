import { calcSigma, fmtSigned } from "../core/statistics.js";
import { operatingCharacteristic } from "../opchar/functions.js";
import { APS_CLASSIFICATION_CASES, APS_SOURCE_OPTIONS, SPEC_SOURCE_CAUTION } from "./aps-ui-data.js";
import { APS_CHANGE_EXERCISE, BIAS_IMPROVEMENT_EXERCISE, CV_IMPROVEMENT_EXERCISE, EDUCATIONAL_STRATEGY_DISCLAIMER, MILAN_HIERARCHY_CAUTION, MILAN_MODELS, NO_TRAFFIC_LIGHT_SIGMA_NOTE, NO_UNIVERSAL_RULE_NOTE, N_AND_R_TEACHING_NOTE, OPCHAR_SCOPE_NOTE, OTHER_SPEC_SOURCES, PATIENT_RISK_PREVIEW_NOTE, PED_DEFINITION, PED_PFR_TRADEOFF_NOTE, PFR_DEFINITION, PROCEDURE_LIBRARY, RUN_FREQUENCY_NOTE, SIGMA_MAPPING_FRAMEWORKS, SOURCE_DEPENDENCE_EXERCISE, STRATEGY_CHALLENGE_CASES, STRATEGY_LIMITATION_OPTIONS, VERY_LOW_SIGMA_THRESHOLD, VERY_LOW_SIGMA_WARNING, WHY_NOT_ALL_RULES_EXERCISE, WHY_NOT_ONLY_13S_EXERCISE, frameworkWhyText, getProcedure, mapSigmaToProcedure, sequentialObservationCapacity } from "./core.js";
import { ComparatorTable, FrameworkProvenanceNote, ruleLabelList } from "./ui-components.jsx";
import { CONFIDENCE_OPTIONS, getConfidenceNote } from "../ui/app-data.js";
import { Badge, MetricCard, SliderField } from "../ui/shared-components.jsx";
import { useState, useMemo, useRef, useEffect } from "react";

/* =========================================================================
   QC Strategy Lab — screen: five internal modes (APS Explorer, Sigma
   Laboratory, QC Procedure Comparator, Strategy Designer, Strategy
   Challenge). The existing Sigma Sandbox screen is left untouched and
   remains directly reachable from navigation and from Sigma Laboratory.
   ========================================================================= */

export const STRATEGY_LAB_MODES = [
  { id: "aps", label: "APS Explorer" },
  { id: "sigma-lab", label: "Sigma Laboratory" },
  { id: "comparator", label: "QC Procedure Comparator" },
  { id: "designer", label: "Strategy Designer" },
  { id: "challenge", label: "Strategy Challenge" }
];

/* Small reusable "scenario -> reveal answer" card used across Sigma
   Laboratory and Strategy Designer's illustrative exercises. */
export function ExerciseRevealCard({ title, prompt, children, answer, note }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="exercise-reveal-card">
      <h4>{title}</h4>
      {children}
      <p className="q-prompt">{prompt}</p>
      {!revealed
        ? <button className="btn-secondary" onClick={() => setRevealed(true)}>Reveal answer</button>
        : (
          <div className="feedback-panel">
            <p><strong>{answer}</strong></p>
            {note && <p className="muted small">{note}</p>}
          </div>
        )}
    </div>
  );
}

/* ---------------------------- APS EXPLORER ---------------------------- */
export function APSExplorerPanel() {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const kase = APS_CLASSIFICATION_CASES[idx];
  const ans = answers[kase.id] || {};

  function choose(id) {
    if (ans.submitted) return;
    setAnswers(a => ({ ...a, [kase.id]: { choice: id, submitted: true } }));
  }
  const attempted = APS_CLASSIFICATION_CASES.filter(c => answers[c.id]).length;
  const scoreCount = APS_CLASSIFICATION_CASES.filter(c => answers[c.id] && answers[c.id].choice === c.correct).length;

  return (
    <div>
      <p className="muted">An analytical performance specification (APS) is a <strong>selected quality requirement</strong> — not an intrinsic property of the analyte itself. The same analyte can legitimately carry different stated requirements depending on which model or source is used.</p>

      <h3>The three Milan models</h3>
      <div className="milan-grid">
        {MILAN_MODELS.map(m => (
          <div className="milan-card" key={m.id}>
            <h4>{m.name}</h4>
            <p>{m.description}</p>
            <p className="muted small">{m.applicabilityNote}</p>
          </div>
        ))}
      </div>
      <p className="callout-inline">{MILAN_HIERARCHY_CAUTION}</p>

      <h3>Other specification sources</h3>
      <ul className="mini-explain-list">
        {OTHER_SPEC_SOURCES.map(s => <li key={s.id}><strong>{s.label}:</strong> {s.description}</li>)}
      </ul>
      <p className="callout-inline">{SPEC_SOURCE_CAUTION}</p>

      <h3>Exercise — what kind of performance requirement is this?</h3>
      <div className="challenge-nav">
        {APS_CLASSIFICATION_CASES.map((c, i) => (
          <button key={c.id} className={"case-chip" + (i === idx ? " case-chip-active" : "") + (answers[c.id] ? " case-chip-done" : "")}
            onClick={() => setIdx(i)} aria-current={i === idx}>{c.id}</button>
        ))}
      </div>
      <div className="case-panel">
        <h4>Case {kase.id} of {APS_CLASSIFICATION_CASES.length}</h4>
        <p>{kase.scenario}</p>
        <div className="option-list option-list-grid">
          {APS_SOURCE_OPTIONS.map(o => (
            <button key={o.id} disabled={!!ans.submitted}
              className={"option-btn small" + (ans.choice === o.id ? " option-selected" : "")}
              onClick={() => choose(o.id)}>{o.label}</button>
          ))}
        </div>
        {ans.submitted && (
          <div className="feedback-panel">
            <p><strong>{ans.choice === kase.correct ? "Correct." : "Not quite."}</strong> Correct classification: {APS_SOURCE_OPTIONS.find(o => o.id === kase.correct).label}</p>
            <p>{kase.explanation}</p>
            <div className="btn-row">
              {idx < APS_CLASSIFICATION_CASES.length - 1 && <button className="btn-secondary" onClick={() => setIdx(idx + 1)}>Next case</button>}
              {idx > 0 && <button className="btn-link" onClick={() => setIdx(idx - 1)}>Previous case</button>}
            </div>
          </div>
        )}
      </div>
      <div className="score-summary">
        <h3>Session score ({attempted} / {APS_CLASSIFICATION_CASES.length} attempted)</h3>
        <MetricCard label="Correct classifications" value={scoreCount + " / " + APS_CLASSIFICATION_CASES.length} />
      </div>
    </div>
  );
}

/* ---------------------------- SIGMA LABORATORY ---------------------------- */
export function SigmaLaboratoryPanel({ goto }) {
  const [deltaSE, setDeltaSE] = useState(2);
  const [n, setN] = useState(2);
  const oc = operatingCharacteristic(["13s"], n, deltaSE);

  return (
    <div>
      <p className="muted">Sigma is not the end point of QC planning — it is one input. This lab explores what changes Sigma, then introduces the two probabilities that actually describe how a QC procedure behaves: Ped and Pfr.</p>
      <p><button className="btn-link" onClick={() => goto("sigma")}>Open the Sigma Sandbox calculator →</button> for the interactive TEa / Bias / CV / Sigma slider tool.</p>

      <h3>Why does Sigma change?</h3>
      <div className="exercise-grid">
        <ExerciseRevealCard title="Same method, different APS" prompt={SOURCE_DEPENDENCE_EXERCISE.question} answer={SOURCE_DEPENDENCE_EXERCISE.correctAnswer}>
          <p className="muted small">Method: Bias {fmtSigned(SOURCE_DEPENDENCE_EXERCISE.bias, 0)}%, CV {SOURCE_DEPENDENCE_EXERCISE.cv}%.</p>
          <ul className="mini-explain-list">
            {SOURCE_DEPENDENCE_EXERCISE.specs.map(s => {
              const sig = calcSigma(s.tea, SOURCE_DEPENDENCE_EXERCISE.bias, SOURCE_DEPENDENCE_EXERCISE.cv);
              return <li key={s.id}>{s.label}: TEa {s.tea}% → Sigma = {sig.value.toFixed(2)}</li>;
            })}
          </ul>
        </ExerciseRevealCard>

        <ExerciseRevealCard title="Same APS, improving CV" prompt={CV_IMPROVEMENT_EXERCISE.question} answer={CV_IMPROVEMENT_EXERCISE.correctAnswer} note={CV_IMPROVEMENT_EXERCISE.teachingNote}>
          <p className="muted small">TEa {CV_IMPROVEMENT_EXERCISE.tea}%, Bias {CV_IMPROVEMENT_EXERCISE.bias}% held constant.</p>
          <ul className="mini-explain-list">
            {CV_IMPROVEMENT_EXERCISE.cvSteps.map(cv => {
              const sig = calcSigma(CV_IMPROVEMENT_EXERCISE.tea, CV_IMPROVEMENT_EXERCISE.bias, cv);
              return <li key={cv}>CV {cv}% → Sigma = {sig.value.toFixed(2)}</li>;
            })}
          </ul>
        </ExerciseRevealCard>

        <ExerciseRevealCard title="Same CV, improving bias" prompt={BIAS_IMPROVEMENT_EXERCISE.question} answer={BIAS_IMPROVEMENT_EXERCISE.correctAnswer} note={BIAS_IMPROVEMENT_EXERCISE.teachingNote}>
          <p className="muted small">TEa {BIAS_IMPROVEMENT_EXERCISE.tea}%, CV {BIAS_IMPROVEMENT_EXERCISE.cv}% held constant.</p>
          <ul className="mini-explain-list">
            {BIAS_IMPROVEMENT_EXERCISE.biasSteps.map(bias => {
              const sig = calcSigma(BIAS_IMPROVEMENT_EXERCISE.tea, bias, BIAS_IMPROVEMENT_EXERCISE.cv);
              return <li key={bias}>Bias {bias}% → Sigma = {sig.value.toFixed(2)}</li>;
            })}
          </ul>
        </ExerciseRevealCard>

        <ExerciseRevealCard title="Same method, changing APS only" prompt={APS_CHANGE_EXERCISE.question} answer={APS_CHANGE_EXERCISE.correctAnswer} note={APS_CHANGE_EXERCISE.teachingNote}>
          <p className="muted small">Bias {APS_CHANGE_EXERCISE.bias}%, CV {APS_CHANGE_EXERCISE.cv}% held constant.</p>
          <ul className="mini-explain-list">
            {APS_CHANGE_EXERCISE.teaSteps.map(tea => {
              const sig = calcSigma(tea, APS_CHANGE_EXERCISE.bias, APS_CHANGE_EXERCISE.cv);
              return <li key={tea}>TEa {tea}% → Sigma = {sig.value.toFixed(2)}</li>;
            })}
          </ul>
        </ExerciseRevealCard>
      </div>

      <h3>Probability of Error Detection (Ped) and Probability of False Rejection (Pfr)</h3>
      <p>{PED_DEFINITION}</p>
      <p>{PFR_DEFINITION}</p>
      <p className="callout-inline">{PED_PFR_TRADEOFF_NOTE}</p>

      <div className="playground-grid">
        <div className="controls-col">
          <SliderField id="oc-deltaSE" label="Assumed systematic error size" value={deltaSE} min={0} max={6} step={0.25} onChange={setDeltaSE} suffix=" SD" />
          <div className="field">
            <label htmlFor="oc-n">Number of control measurements (N) for 1₃s</label>
            <select id="oc-n" value={n} onChange={e => setN(parseInt(e.target.value, 10))}>
              {[1, 2, 3, 4].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
        <div className="viz-col">
          <div className="metric-row">
            <MetricCard label="Ped (1₃s)" value={(oc.ped * 100).toFixed(1) + "%"} sub="Probability this error size is detected" />
            <MetricCard label="Pfr (1₃s)" value={(oc.pfr * 100).toFixed(2) + "%"} sub="Probability of a false rejection" />
          </div>
          <p className="muted small">{OPCHAR_SCOPE_NOTE}</p>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- QC PROCEDURE COMPARATOR ---------------------------- */
export function QCProcedureComparatorPanel() {
  const [sigma, setSigma] = useState(5);
  const [selected, setSelected] = useState({ A: true, C: true, B: false, D: false });
  const [deltaSE, setDeltaSE] = useState(2);
  const mapping = mapSigmaToProcedure(sigma, SIGMA_MAPPING_FRAMEWORKS[0].id);
  const chosenProcedures = PROCEDURE_LIBRARY.filter(p => selected[p.id]);

  function toggle(id) { setSelected(s => ({ ...s, [id]: !s[id] })); }

  return (
    <div>
      <p className="muted">Select an analytical Sigma value and two or more candidate QC procedures to compare. This comparator is meant to support reasoning about trade-offs, not to hand down a ranking.</p>
      <SliderField id="cmp-sigma" label="Analytical Sigma" value={sigma} min={1} max={10} step={0.1} onChange={setSigma} />
      <div className="checkbox-row">
        {PROCEDURE_LIBRARY.map(p => (
          <label key={p.id}><input type="checkbox" checked={!!selected[p.id]} onChange={() => toggle(p.id)} /> {p.name}</label>
        ))}
      </div>
      <SliderField id="cmp-deltaSE" label="Assumed systematic error size (for the operating-characteristic column)" value={deltaSE} min={0} max={6} step={0.25} onChange={setDeltaSE} suffix=" SD" />

      {chosenProcedures.length < 2 ? (
        <p className="event-list-empty">Select at least two procedures to compare.</p>
      ) : (
        <>
          <ComparatorTable procedures={chosenProcedures} deltaSE={deltaSE} />
          {mapping.procedure && (
            <p className="muted small">At Sigma {sigma.toFixed(1)}, the selected framework suggests {mapping.procedure.name}{chosenProcedures.some(p => p.id === mapping.procedure.id) ? " (included above)." : " — not currently in your selection."}</p>
          )}
          <FrameworkProvenanceNote mapping={mapping} />
          <p className="prompt-box">Given this Sigma value, which of your selected candidates offers the most appropriate balance between error detection and unnecessary rejection — and why?</p>
        </>
      )}
      <p className="muted small">{NO_UNIVERSAL_RULE_NOTE}</p>
    </div>
  );
}

/* ---------------------------- STRATEGY DESIGNER ---------------------------- */
export const SD_DEFAULTS = { tea: 10, bias: 2, cv: 2, levels: 2 };

export function WhyNotAllRulesCard() {
  const [choice, setChoice] = useState(null);
  const ex = WHY_NOT_ALL_RULES_EXERCISE;
  return (
    <div className="exercise-reveal-card">
      <h4>Why not use every QC rule?</h4>
      <p className="muted small">{ex.scenario}</p>
      <div className="option-list">
        <button className={"option-btn" + (choice === "aggressive" ? " option-selected" : "")} onClick={() => setChoice("aggressive")}>{ex.optionA.label}</button>
        <button className={"option-btn" + (choice === "adequate" ? " option-selected" : "")} onClick={() => setChoice("adequate")}>{ex.optionB.label}</button>
      </div>
      {choice && (
        <div className="feedback-panel">
          <p><strong>{choice === ex.correctOption ? "This is the more appropriate choice here." : "Consider the simpler option instead — see below."}</strong></p>
          <p>{ex.question}</p>
          <ul className="mini-explain-list">{ex.teachingPoints.map((t, i) => <li key={i}>{t}</li>)}</ul>
          <p className="callout-inline">{ex.caution}</p>
        </div>
      )}
    </div>
  );
}

export function WhyNotOnly13sCard() {
  const [revealed, setRevealed] = useState(false);
  const ex = WHY_NOT_ONLY_13S_EXERCISE;
  return (
    <div className="exercise-reveal-card">
      <h4>Why not rely on a minimal procedure everywhere?</h4>
      <p className="muted small">{ex.scenario}</p>
      <p className="q-prompt">{ex.question}</p>
      {!revealed ? <button className="btn-secondary" onClick={() => setRevealed(true)}>Reveal answer</button> : (
        <div className="feedback-panel">
          <p>{ex.correctAnswer}</p>
          <ul className="mini-explain-list">{ex.connectPoints.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

export function StrategyDesignerPanel({ markProgress }) {
  const [tea, setTea] = useState(SD_DEFAULTS.tea);
  const [bias, setBias] = useState(SD_DEFAULTS.bias);
  const [cv, setCv] = useState(SD_DEFAULTS.cv);
  const [levels, setLevels] = useState(SD_DEFAULTS.levels);
  const [touched, setTouched] = useState(false);
  useEffect(() => { if (touched) markProgress("strategy"); }, [touched]);

  const sigma = calcSigma(tea, bias, cv);
  const mapping = sigma.valid ? mapSigmaToProcedure(sigma.value, SIGMA_MAPPING_FRAMEWORKS[0].id) : { framework: null, band: null, procedure: null };
  const veryLow = sigma.valid && sigma.value < VERY_LOW_SIGMA_THRESHOLD;

  function withTouch(setter) { return v => { setter(v); setTouched(true); }; }

  function reset() { setTea(SD_DEFAULTS.tea); setBias(SD_DEFAULTS.bias); setCv(SD_DEFAULTS.cv); setLevels(SD_DEFAULTS.levels); }

  return (
    <div>
      <p className="muted">Enter an analytical requirement and observed performance to see an <strong>educational candidate strategy</strong> — never a recommended laboratory SOP.</p>
      <div className="playground-grid">
        <div className="controls-col">
          <SliderField id="sd-tea" label="Selected allowable total error specification (TEa, %)" value={tea} min={2} max={25} step={0.5} onChange={withTouch(setTea)} suffix="%" />
          <SliderField id="sd-bias" label="Bias" value={bias} min={-15} max={15} step={0.5} onChange={withTouch(setBias)} suffix="%" signed />
          <SliderField id="sd-cv" label="CV" value={cv} min={0.2} max={10} step={0.1} onChange={withTouch(setCv)} suffix="%" />
          <div className="field">
            <label htmlFor="sd-levels">Number of control levels</label>
            <select id="sd-levels" value={levels} onChange={e => withTouch(setLevels)(parseInt(e.target.value, 10))}>
              <option value={1}>1</option><option value={2}>2</option><option value={3}>3</option>
            </select>
          </div>
          <div className="btn-row"><button className="btn-secondary" onClick={reset}>Reset experiment</button></div>
        </div>
        <div className="viz-col">
          <div className={"sigma-display" + (!sigma.valid ? " sigma-invalid" : sigma.value < 0 ? " sigma-negative" : "")}>
            <div className="sigma-label">Analytical performance — Sigma</div>
            <div className="sigma-value">{sigma.valid ? sigma.value.toFixed(2) : "—"}</div>
          </div>
          {sigma.warning && <p className="warn-box">{sigma.warning}</p>}

          {levels !== 2 ? (
            <p className="callout-inline">More advanced configuration coming in a later version. Full candidate-strategy recommendations in v0.3 support 2 control levels only.</p>
          ) : sigma.valid ? (
            <div className="rule-detail-panel">
              <p><strong>Framework:</strong> {mapping.framework.frameworkName}</p>
              <p><strong>Candidate QC procedure:</strong> {mapping.procedure.name} — <Badge tone="neutral">Educational candidate strategy</Badge></p>
              <dl className="evidence-fields">
                <dt>Rule set</dt><dd>{ruleLabelList(mapping.procedure.ruleIds)}</dd>
                <dt>N (control measurements per run)</dt><dd>{mapping.procedure.N} controls/run</dd>
                <dt>R (consecutive runs)</dt><dd>{mapping.procedure.R} consecutive runs</dd>
                <dt>Sequential observations inspected</dt><dd>N × R = {sequentialObservationCapacity(mapping.procedure)}</dd>
                <dt>Interpretation</dt><dd>{frameworkWhyText(mapping)}</dd>
              </dl>
              <FrameworkProvenanceNote mapping={mapping} />
              {veryLow && <p className="warn-box">{VERY_LOW_SIGMA_WARNING}</p>}
              <p className="muted small"><strong>Important limitation:</strong> QC frequency and patient risk are not yet fully modelled in v0.3 — see the notes below this module.</p>
              <p className="disclaimer">{EDUCATIONAL_STRATEGY_DISCLAIMER}</p>
            </div>
          ) : null}
        </div>
      </div>

      <h3>Two questions every strategy should survive</h3>
      <div className="exercise-grid">
        <WhyNotAllRulesCard />
        <WhyNotOnly13sCard />
      </div>
    </div>
  );
}

/* ---------------------------- STRATEGY CHALLENGE ---------------------------- */
export const DEFAULT_STRATEGY_ANSWER = { apsAdequate: null, sigmaRevealed: false, limitation: null, procedureId: null, improveProcess: null, confidence: null, submitted: false };

export function StrategyChallengePanel({ markProgress }) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const kase = STRATEGY_CHALLENGE_CASES[idx];
  const ans = answers[kase.id] || DEFAULT_STRATEGY_ANSWER;

  const allSubmitted = STRATEGY_CHALLENGE_CASES.every(c => answers[c.id] && answers[c.id].submitted);
  useEffect(() => { if (allSubmitted) markProgress("strategy"); }, [allSubmitted]);

  function updateAns(patch) { setAnswers(a => ({ ...a, [kase.id]: { ...ans, ...patch } })); }

  const isInsufficient = kase.cv == null;
  const sigmaResult = !isInsufficient ? calcSigma(kase.tea, kase.bias, kase.cv) : null;

  const canSubmit = ans.apsAdequate != null && ans.sigmaRevealed && ans.limitation &&
    (isInsufficient || ans.procedureId) && (isInsufficient ? true : ans.improveProcess != null) &&
    (isInsufficient ? ans.procedureId != null : true) && ans.confidence;

  function submit() { if (canSubmit) updateAns({ submitted: true }); }

  const limitationCorrect = ans.limitation === kase.primaryLimitationCorrect;
  const procedureCorrect = isInsufficient ? ans.procedureId === "none" : (kase.correctProcedureIds || []).includes(ans.procedureId);
  const improveCorrect = isInsufficient ? true : ans.improveProcess === (kase.processImprovementPreferable ? "yes" : "no");

  const limScore = STRATEGY_CHALLENGE_CASES.reduce((acc, c) => { const a = answers[c.id]; return acc + (a && a.submitted && a.limitation === c.primaryLimitationCorrect ? 1 : 0); }, 0);
  const procScore = STRATEGY_CHALLENGE_CASES.reduce((acc, c) => {
    const a = answers[c.id]; if (!a || !a.submitted) return acc;
    const ins = c.cv == null; const ok = ins ? a.procedureId === "none" : (c.correctProcedureIds || []).includes(a.procedureId);
    return acc + (ok ? 1 : 0);
  }, 0);
  const improveScore = STRATEGY_CHALLENGE_CASES.reduce((acc, c) => {
    const a = answers[c.id]; if (!a || !a.submitted) return acc;
    const ins = c.cv == null; const ok = ins ? true : a.improveProcess === (c.processImprovementPreferable ? "yes" : "no");
    return acc + (ok ? 1 : 0);
  }, 0);
  const attemptedCount = STRATEGY_CHALLENGE_CASES.filter(c => answers[c.id] && answers[c.id].submitted).length;

  return (
    <div>
      <p className="muted">Ten deterministic cases connecting analytical performance to QC strategy design. Work through each step — not every case has enough information to select a strategy.</p>
      <div className="challenge-nav">
        {STRATEGY_CHALLENGE_CASES.map((c, i) => (
          <button key={c.id} className={"case-chip" + (i === idx ? " case-chip-active" : "") + (answers[c.id] && answers[c.id].submitted ? " case-chip-done" : "")}
            onClick={() => setIdx(i)} aria-current={i === idx}>{c.id}</button>
        ))}
      </div>
      <div className="case-panel">
        <h2>{kase.title}</h2>
        <p className="muted">{kase.scenarioNote}</p>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>TEa</th><th>Bias</th><th>CV</th></tr></thead>
            <tbody>
              <tr>
                <td>{kase.dualSpecs ? kase.dualSpecs.map(s => s.label + " " + s.tea + "%").join(" / ") : (kase.tea + "%")}</td>
                <td>{fmtSigned(kase.bias, 1)}%</td>
                <td>{kase.cv == null ? "not supplied" : kase.cv + "%"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="question-block">
          <p className="q-prompt">A — Is the selected analytical performance specification (TEa) adequately specified?</p>
          <div className="option-list option-list-narrow">
            <button disabled={ans.submitted} className={"option-btn" + (ans.apsAdequate === "yes" ? " option-selected" : "")} onClick={() => updateAns({ apsAdequate: "yes" })}>Yes</button>
            <button disabled={ans.submitted} className={"option-btn" + (ans.apsAdequate === "no" ? " option-selected" : "")} onClick={() => updateAns({ apsAdequate: "no" })}>No</button>
          </div>
        </div>

        <div className="question-block">
          <p className="q-prompt">B — Calculate / verify Sigma.</p>
          {!ans.sigmaRevealed
            ? <button className="btn-secondary" onClick={() => updateAns({ sigmaRevealed: true })}>Calculate Sigma</button>
            : kase.dualSpecs
              ? <ul className="mini-explain-list">{kase.dualSpecs.map(s => { const sg = calcSigma(s.tea, kase.bias, kase.cv); return <li key={s.id}>{s.label} (TEa {s.tea}%): Sigma = {sg.value.toFixed(2)}</li>; })}</ul>
              : isInsufficient
                ? <p className="event-list-empty">Sigma cannot be calculated — CV was not supplied.</p>
                : <p><strong>Sigma = {sigmaResult.value.toFixed(2)}</strong></p>}
        </div>

        <div className="question-block">
          <p className="q-prompt">C — What primarily limits performance here?</p>
          <div className="option-list option-list-grid">
            {STRATEGY_LIMITATION_OPTIONS.map(o => (
              <button key={o.id} disabled={ans.submitted} className={"option-btn small" + (ans.limitation === o.id ? " option-selected" : "")} onClick={() => updateAns({ limitation: o.id })}>{o.label}</button>
            ))}
          </div>
        </div>

        <div className="question-block">
          <p className="q-prompt">D — Choose a candidate QC procedure.</p>
          <div className="option-list option-list-grid">
            {!isInsufficient
              ? PROCEDURE_LIBRARY.map(p => (
                <button key={p.id} disabled={ans.submitted} className={"option-btn small" + (ans.procedureId === p.id ? " option-selected" : "")} onClick={() => updateAns({ procedureId: p.id })}>{p.name}</button>
              ))
              : <button disabled={ans.submitted} className={"option-btn small" + (ans.procedureId === "none" ? " option-selected" : "")} onClick={() => updateAns({ procedureId: "none" })}>Cannot select a strategy — insufficient performance data</button>}
          </div>
        </div>

        {!isInsufficient && (
          <div className="question-block">
            <p className="q-prompt">F — Would improving the analytical process be preferable to merely increasing QC intensity?</p>
            <div className="option-list option-list-narrow">
              <button disabled={ans.submitted} className={"option-btn" + (ans.improveProcess === "yes" ? " option-selected" : "")} onClick={() => updateAns({ improveProcess: "yes" })}>Yes</button>
              <button disabled={ans.submitted} className={"option-btn" + (ans.improveProcess === "no" ? " option-selected" : "")} onClick={() => updateAns({ improveProcess: "no" })}>No</button>
            </div>
          </div>
        )}

        <div className="question-block">
          <p className="q-prompt">G — How confident are you in this strategy?</p>
          <div className="option-list option-list-grid option-list-narrow">
            {CONFIDENCE_OPTIONS.map(o => (
              <button key={o.id} disabled={ans.submitted} className={"option-btn small" + (ans.confidence === o.id ? " option-selected" : "")} onClick={() => updateAns({ confidence: o.id })}>{o.label}</button>
            ))}
          </div>
        </div>

        {!ans.submitted ? (
          <button className="btn-primary" onClick={submit} disabled={!canSubmit}>Commit strategy</button>
        ) : (
          <div className="feedback-panel">
            <h3>Feedback</h3>
            <p><strong>Selected analytical requirement:</strong> {kase.dualSpecs ? kase.dualSpecs.map(s => s.label + " TEa " + s.tea + "%").join(", ") : "TEa " + kase.tea + "%"}, Bias {fmtSigned(kase.bias, 1)}%, CV {kase.cv == null ? "not supplied" : kase.cv + "%"}</p>
            <p><strong>Calculated performance:</strong> {isInsufficient ? "Sigma cannot be calculated" : kase.dualSpecs ? kase.dualSpecs.map(s => { const sg = calcSigma(s.tea, kase.bias, kase.cv); return s.label + ": Sigma " + sg.value.toFixed(2); }).join(", ") : "Sigma " + sigmaResult.value.toFixed(2)}</p>
            <p><strong>Primary limitation:</strong> {STRATEGY_LIMITATION_OPTIONS.find(o => o.id === kase.primaryLimitationCorrect).label} {limitationCorrect ? "— correct" : "— not the intended answer"}</p>
            <p><strong>Your QC strategy:</strong> {isInsufficient ? "No strategy selected (insufficient information)" : (getProcedure(ans.procedureId) || {}).name} {procedureCorrect ? "— matches the educational candidate strategy" : "— differs from the educational candidate strategy"}</p>
            <p><strong>Educational candidate strategy:</strong> {isInsufficient ? "None — insufficient performance data to select a strategy" : kase.correctProcedureIds.map(id => getProcedure(id).name).join(" or ")}</p>
            <p><strong>Why:</strong> {kase.why}</p>
            <p><strong>What a more intensive strategy might improve:</strong> {kase.moreIntensiveImprove}</p>
            <p><strong>What it might cost:</strong> {kase.moreIntensiveCost}</p>
            <p><strong>What QC cannot fix:</strong> {kase.qcCannotFix}</p>
            <p><strong>What remains outside this model:</strong> {kase.outsideModel}</p>
            {kase.veryLowSigmaWarning && <p className="warn-box">{VERY_LOW_SIGMA_WARNING}</p>}
            <p><strong>On your confidence:</strong> {getConfidenceNote(ans.confidence, limitationCorrect && procedureCorrect && improveCorrect)}</p>
            <div className="btn-row">
              {idx < STRATEGY_CHALLENGE_CASES.length - 1 && <button className="btn-secondary" onClick={() => setIdx(idx + 1)}>Next case</button>}
              {idx > 0 && <button className="btn-link" onClick={() => setIdx(idx - 1)}>Previous case</button>}
            </div>
          </div>
        )}
      </div>
      <div className="score-summary">
        <h3>Session score ({attemptedCount} / {STRATEGY_CHALLENGE_CASES.length} attempted)</h3>
        <div className="metric-row">
          <MetricCard label="Primary limitation" value={limScore + " / " + STRATEGY_CHALLENGE_CASES.length} />
          <MetricCard label="QC strategy choice" value={procScore + " / " + STRATEGY_CHALLENGE_CASES.length} />
          <MetricCard label="Process-vs-QC reasoning" value={improveScore + " / " + STRATEGY_CHALLENGE_CASES.length} />
        </div>
        {allSubmitted && <p className="muted">All cases attempted for this session. This score reflects a short prototype exercise and is not a competency certification.</p>}
      </div>
    </div>
  );
}

/* ---------------------------- SCREEN SHELL ---------------------------- */
export function QCStrategyLabScreen({ level, markProgress, goto }) {
  const [mode, setMode] = useState("aps");

  return (
    <div className="screen">
      <h1>QC Strategy Lab</h1>
      <p className="muted">From analytical performance numbers to reasoned QC strategy design. Sigma is not the end point — it is one input into planning a QC procedure that balances error detection against unnecessary rejection.</p>

      <div className="tabbar" role="tablist" aria-label="QC Strategy Lab mode">
        {STRATEGY_LAB_MODES.map(m => (
          <button key={m.id} role="tab" aria-selected={mode === m.id}
            className={"tab" + (mode === m.id ? " tab-active" : "")}
            onClick={() => setMode(m.id)}>{m.label}</button>
        ))}
      </div>

      {mode === "aps" && <APSExplorerPanel />}
      {mode === "sigma-lab" && <SigmaLaboratoryPanel goto={goto} />}
      {mode === "comparator" && <QCProcedureComparatorPanel />}
      {mode === "designer" && <StrategyDesignerPanel markProgress={markProgress} />}
      {mode === "challenge" && <StrategyChallengePanel markProgress={markProgress} />}

      <details className="important-note">
        <summary>What do N and R mean?</summary>
        <p className="muted small">{N_AND_R_TEACHING_NOTE}</p>
      </details>
      <details className="important-note">
        <summary>QC frequency is a separate design decision</summary>
        <p className="muted small">{RUN_FREQUENCY_NOTE}</p>
      </details>
      <details className="important-note">
        <summary>A preview of patient risk (not calculated in this version)</summary>
        <p className="muted small">{PATIENT_RISK_PREVIEW_NOTE}</p>
      </details>
      <div className="callout">{NO_TRAFFIC_LIGHT_SIGMA_NOTE}</div>
    </div>
  );
}
