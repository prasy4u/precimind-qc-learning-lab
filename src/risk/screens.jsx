   Risk & Frequency Lab — screen: five internal modes (Concepts, Frequency
   Simulator, Detection Delay, Patient-Risk Explorer, Frequency Challenge).
   Mirrors the architecture of 14-strategy-screens.jsx. Consumes
   16-risk-data.js (static content) and 15-detection-delay.js (validated
   calculation engine) — no new calculation logic lives in this file.
   ========================================================================= */

const RISK_LAB_MODES = [
  { id: "concepts", label: "Concepts" },
  { id: "simulator", label: "Frequency Simulator" },
  { id: "delay", label: "Detection Delay" },
  { id: "explorer", label: "Patient-Risk Explorer" },
  { id: "challenge", label: "Frequency Challenge" }
];

const MISCONCEPTION_NOTES = {
  "high-sigma-frequency": HIGH_SIGMA_FREQUENCY_MISCONCEPTION_NOTE,
  "n-vs-m": N_R_M_DISTINCTION_NOTE,
  "r-vs-m": N_R_M_DISTINCTION_NOTE,
  "startup-sufficiency": STARTUP_VS_MONITORING_NOTE,
  "frequency-fixes-performance": MORE_QC_NOT_ALWAYS_BETTER_NOTE
};

/* ---------------------------- CONCEPTS ---------------------------- */
function ConceptsPanel() {
  return (
    <div>
      <h3>Four terms that are easy to conflate</h3>
      <ul className="mini-explain-list">
        <li>{QC_PROCEDURE_DEFINITION}</li>
        <li>{QC_EVENT_DEFINITION}</li>
        <li>{QC_FREQUENCY_DEFINITION}</li>
        <li>{ANALYTICAL_RUN_V4_DEFINITION}</li>
      </ul>
      <div className="callout">
        <ul className="mini-explain-list">{CORE_DISTINCTION_CAUTIONS.map((c, i) => <li key={i}>{c}</li>)}</ul>
      </div>

      <h3>N, R and M — a worked example</h3>
      <NRMPanel N={2} R={1} M={100} />

      <h3>Two different patient-sample counts</h3>
      <p>{PATIENT_SAMPLES_EXPOSED_DEFINITION}</p>
      <p>{UNACCEPTABLE_RESULTS_DEFINITION}</p>
      <p className="callout-inline">{ANPED_NOTE}</p>

      <h3>Startup QC vs. monitoring QC</h3>
      <p>{STARTUP_VS_MONITORING_NOTE}</p>

      <h3>Bracketed QC</h3>
      <p>{BRACKETED_QC_NOTE}</p>
      <div className="case-panel">
        <p className="q-prompt">{OUT_OF_CONTROL_EVENT_PREVIEW.scenario}</p>
        <p>{OUT_OF_CONTROL_EVENT_PREVIEW.question}</p>
        <div className="feedback-panel">
          <p>{OUT_OF_CONTROL_EVENT_PREVIEW.teachingAnswer}</p>
          <p className="muted small">{OUT_OF_CONTROL_EVENT_PREVIEW.caution}</p>
        </div>
      </div>

      <h3>Two misconceptions this lab does not teach</h3>
      <div className="exercise-grid">
        <div className="exercise-reveal-card"><h4>"More QC is always better"</h4><p className="muted small">{MORE_QC_NOT_ALWAYS_BETTER_NOTE}</p></div>
        <div className="exercise-reveal-card"><h4>"High Sigma means frequency doesn't matter"</h4><p className="muted small">{HIGH_SIGMA_FREQUENCY_MISCONCEPTION_NOTE}</p></div>
      </div>

      <h3>Other factors relevant to QC frequency (not calculated in this version)</h3>
      <p className="muted small">{PROCESS_STABILITY_NOTE}</p>
      <p className="muted small">{CLINICAL_CONSEQUENCE_NOTE}</p>
    </div>
  );
}

/* ---------------------------- FREQUENCY SIMULATOR ---------------------------- */
function FrequencySimulatorPanel({ markProgress }) {
  const [M, setM] = useState(100);
  const [shiftSD, setShiftSD] = useState(2);
  const [n, setN] = useState(2);
  const [onsetMode, setOnsetMode] = useState("immediate");
  const [onsetPct, setOnsetPct] = useState(50);
  const [touched, setTouched] = useState(false);
  useEffect(() => { if (touched) markProgress("risk"); }, [touched]);

  const shiftChoices = [0].concat(SHIFT_OPTIONS_SD);

  function withTouch(setter) { return v => { setter(v); setTouched(true); }; }

  return (
    <div>
      <p className="muted">The QC procedure below never changes as you vary M — only the spacing between QC events changes. Watch what that does to the exposure window.</p>
      <div className="control-row">
        <div className="control-group">
          <span className="control-group-label" id="fs-m-label">M (patient samples between QC events)</span>
          <select id="fs-m" aria-labelledby="fs-m-label" value={M} onChange={e => withTouch(setM)(parseInt(e.target.value, 10))}>
            {M_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="control-group">
          <span className="control-group-label" id="fs-n-label">N (control measurements, 1₃s)</span>
          <select id="fs-n" aria-labelledby="fs-n-label" value={n} onChange={e => withTouch(setN)(parseInt(e.target.value, 10))}>
            {[1, 2, 3, 4].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="control-group">
          <span className="control-group-label" id="fs-shift-label">Systematic shift</span>
          <select id="fs-shift" aria-labelledby="fs-shift-label" value={shiftSD} onChange={e => withTouch(setShiftSD)(parseFloat(e.target.value))}>
            {shiftChoices.map(v => <option key={v} value={v}>{v === 0 ? "No shift (baseline)" : v + " SD"}</option>)}
          </select>
        </div>
        <div className="control-group">
          <span className="control-group-label" id="fs-onset-label">Failure-onset assumption</span>
          <select id="fs-onset" aria-labelledby="fs-onset-label" value={onsetMode} onChange={e => withTouch(setOnsetMode)(e.target.value)}>
            {FAILURE_ONSET_MODES.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>
      </div>
      {onsetMode === "uniform" && (
        <SliderField id="onset-pct" label="Illustrative onset position within the first interval" value={onsetPct} min={0} max={100} step={5} onChange={withTouch(setOnsetPct)} suffix="%" />
      )}
      <p className="muted small">{FAILURE_ONSET_MODES.find(m => m.id === onsetMode).caution}</p>

      <QCTimeline M={M} shiftSD={shiftSD} N={n} onsetMode={onsetMode} onsetPositionPct={onsetPct} ruleIds={["13s"]} />

      <h3>Frequency Exposure Lab</h3>
      <p className="muted">{FREQUENCY_EXPOSURE_LAB.sharedConditions}</p>
      <div className="compare-grid">
        <div className="compare-col">
          <h4>{FREQUENCY_EXPOSURE_LAB.strategyA.label}</h4>
          <QCTimeline M={FREQUENCY_EXPOSURE_LAB.strategyA.M} shiftSD={2} N={2} onsetMode="immediate" onsetPositionPct={0} ruleIds={["13s"]} />
        </div>
        <div className="compare-col">
          <h4>{FREQUENCY_EXPOSURE_LAB.strategyB.label}</h4>
          <QCTimeline M={FREQUENCY_EXPOSURE_LAB.strategyB.M} shiftSD={2} N={2} onsetMode="immediate" onsetPositionPct={0} ruleIds={["13s"]} />
        </div>
      </div>
      <div className="exercise-grid">
        {FREQUENCY_EXPOSURE_LAB.questions.map((qa, i) => (
          <ExerciseRevealCard key={i} title={qa.q} prompt="Reveal the answer." answer={qa.a} />
        ))}
      </div>
      <p className="prompt-box">{FREQUENCY_EXPOSURE_LAB.teachingPoint}</p>

      <h3>Signature exercise — same assay, different frequency</h3>
      <p className="muted">TEa, Bias, CV, Sigma, the QC rule, N, R and the injected shift size are all identical below. Only M changes.</p>
      <div className="compare-grid">
        <div className="compare-col">
          <h4>M = 25</h4>
          <QCTimeline M={25} shiftSD={shiftSD || 2} N={n} onsetMode="immediate" onsetPositionPct={0} ruleIds={["13s"]} />
        </div>
        <div className="compare-col">
          <h4>M = 500</h4>
          <QCTimeline M={500} shiftSD={shiftSD || 2} N={n} onsetMode="immediate" onsetPositionPct={0} ruleIds={["13s"]} />
        </div>
      </div>
      <ExerciseRevealCard title="Which strategy potentially exposes more patient results before the next QC detection opportunity?" prompt="Reveal the answer."
        answer="M = 500 — the detection probability per QC event (Ped) is identical in both configurations, but the M = 500 configuration allows up to twenty times more patient samples to be processed before the next QC opportunity."
        note="This is the central v0.4 teaching point: a statistically appropriate QC procedure can still be an inadequate QC strategy if QC is performed at an inappropriate frequency." />
    </div>
  );
}

/* ---------------------------- DETECTION DELAY ---------------------------- */
function DetectionDelayPanel({ markProgress }) {
  const [n, setN] = useState(2);
  const [deltaSE, setDeltaSE] = useState(2);
  const [M, setM] = useState(100);
  const [touched, setTouched] = useState(false);
  useEffect(() => { if (touched) markProgress("risk"); }, [touched]);
  function withTouch(setter) { return v => { setter(v); setTouched(true); }; }

  const oc = operatingCharacteristic13s(n, deltaSE);
  const events = expectedQcEventsToDetectionGeometric(oc.ped);
  const expImmediate = expectedPatientExposureImmediateOnset(M, oc.ped);
  const expUniform = expectedPatientExposureUniformOnset(M, oc.ped);

  const multiruleSupport = detectionDelaySupportForRuleIds(["13s", "22s", "r4s", "41s"]);

  const ped90 = CHANGE_PED_HOLD_M_EXPERIMENT.presets.find(p => p.label.includes("0.90"));
  const oc90 = operatingCharacteristic13s(ped90.N, ped90.deltaSE);
  const events90 = expectedQcEventsToDetectionGeometric(oc90.ped);

  return (
    <div>
      <p className="muted">The Detection Delay Engine implements a restricted, independently validated geometric model — only for the single 1₃s rule applied on its own. Every other procedure displays an explicit "not implemented" note rather than a fabricated number.</p>

      <div className="playground-grid">
        <div className="controls-col">
          <div className="field">
            <label htmlFor="dd-n">N (control measurements, 1₃s)</label>
            <select id="dd-n" value={n} onChange={e => withTouch(setN)(parseInt(e.target.value, 10))}>
              {[1, 2, 3, 4].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <SliderField id="dd-deltaSE" label="Assumed systematic error size" value={deltaSE} min={0.25} max={6} step={0.25} onChange={withTouch(setDeltaSE)} suffix=" SD" />
          <div className="field">
            <label htmlFor="dd-m">M (patient samples between QC events)</label>
            <select id="dd-m" value={M} onChange={e => withTouch(setM)(parseInt(e.target.value, 10))}>
              {M_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <NRMPanel N={n} R={1} M={M} />
          <MetricCard label="Ped (1₃s)" value={(oc.ped * 100).toFixed(1) + "%"} sub={"Δ=" + deltaSE + " SD, N=" + n} />
        </div>
        <div className="viz-col">
          <DetectionDelayResultCard title="Expected QC events to detection" result={events} />
          <DetectionDelayResultCard title="Expected patient-sample exposure — immediate onset (Mode A)" result={expImmediate} />
          <DetectionDelayResultCard title="Expected patient-sample exposure — uniform onset (Mode B)" result={expUniform} />
        </div>
      </div>

      <details className="important-note">
        <summary>What happens for a multirule procedure (e.g. 1₃s / 2₂s / R₄s / 4₁s)?</summary>
        <p className="muted small">{multiruleSupport.note}</p>
      </details>

      <h3>Fixed Ped, varying M — "which component changed?"</h3>
      <p className="muted">Ped is held at the same validated value (Ped ≈ {(oc90.ped * 100).toFixed(1)}%, 1₃s, N={ped90.N}, Δ={ped90.deltaSE} SD) throughout this table. Only M changes.</p>
      <div className="table-scroll">
        <table className="data-table">
          <thead><tr><th>M</th><th>Expected QC events to detection</th><th>Expected patient-sample exposure (immediate onset)</th></tr></thead>
          <tbody>
            {WHICH_COMPONENT_CHANGED_EXPERIMENT.mValues.map(mv => {
              const exp = expectedPatientExposureImmediateOnset(mv, oc90.ped);
              return <tr key={mv}><td>{mv}</td><td>{events90.value.toFixed(2)}</td><td>{exp.value.toFixed(1)}</td></tr>;
            })}
          </tbody>
        </table>
      </div>
      <ExerciseRevealCard title={WHICH_COMPONENT_CHANGED_EXPERIMENT.question} prompt="Reveal the answer." answer={WHICH_COMPONENT_CHANGED_EXPERIMENT.correctAnswerLabel} note={WHICH_COMPONENT_CHANGED_EXPERIMENT.explanation} />

      <h3>Fixed M, varying Ped — "change the procedure's strength, not its frequency"</h3>
      <p className="muted">M is held at {CHANGE_PED_HOLD_M_EXPERIMENT.fixedM} throughout this table. Each row uses a genuinely calculated Ped (1₃s, N=1) at a different assumed shift size.</p>
      <div className="table-scroll">
        <table className="data-table">
          <thead><tr><th>Preset</th><th>Δ (SD)</th><th>Ped</th><th>Expected QC events</th><th>Expected exposure (immediate onset)</th></tr></thead>
          <tbody>
            {CHANGE_PED_HOLD_M_EXPERIMENT.presets.map((p, i) => {
              const ocp = operatingCharacteristic13s(p.N, p.deltaSE);
              const ev = expectedQcEventsToDetectionGeometric(ocp.ped);
              const exp = expectedPatientExposureImmediateOnset(CHANGE_PED_HOLD_M_EXPERIMENT.fixedM, ocp.ped);
              return <tr key={i}><td>{p.label}</td><td>{p.deltaSE}</td><td>{(ocp.ped * 100).toFixed(1)}%</td><td>{ev.value.toFixed(2)}</td><td>{exp.value.toFixed(1)}</td></tr>;
            })}
          </tbody>
        </table>
      </div>
      <ExerciseRevealCard title={CHANGE_PED_HOLD_M_EXPERIMENT.question} prompt="Reveal the answer." answer={CHANGE_PED_HOLD_M_EXPERIMENT.correctAnswer} note={CHANGE_PED_HOLD_M_EXPERIMENT.teachingNote} />
      <p className="callout-inline">{ANPED_NOTE}</p>
    </div>
  );
}

/* ---------------------------- PATIENT-RISK EXPLORER ---------------------------- */
function FrequencyDesignerPanel({ markProgress }) {
  const d = FREQUENCY_DESIGNER_DEFAULTS;
  const [n, setN] = useState(d.N);
  const [M, setM] = useState(d.M);
  const [deltaSE, setDeltaSE] = useState(d.deltaSE);
  const [onsetMode, setOnsetMode] = useState(d.onsetMode);
  const [touched, setTouched] = useState(false);
  useEffect(() => { if (touched) markProgress("risk"); }, [touched]);
  function withTouch(setter) { return v => { setter(v); setTouched(true); }; }

  const oc = operatingCharacteristic13s(n, deltaSE);
  const events = expectedQcEventsToDetectionGeometric(oc.ped);
  const exposure = onsetMode === "immediate" ? expectedPatientExposureImmediateOnset(M, oc.ped) : expectedPatientExposureUniformOnset(M, oc.ped);

  return (
    <div>
      <p className="muted">Design an educational QC-frequency scenario from a validated 1₃s configuration, a patient run size, and a shift assumption. Nothing here is a laboratory recommendation.</p>
      <div className="control-row">
        <div className="control-group">
          <span className="control-group-label" id="fd-n-label">N (1₃s)</span>
          <select id="fd-n" aria-labelledby="fd-n-label" value={n} onChange={e => withTouch(setN)(parseInt(e.target.value, 10))}>{[1, 2, 3, 4].map(v => <option key={v} value={v}>{v}</option>)}</select>
        </div>
        <div className="control-group">
          <span className="control-group-label" id="fd-m-label">M</span>
          <select id="fd-m" aria-labelledby="fd-m-label" value={M} onChange={e => withTouch(setM)(parseInt(e.target.value, 10))}>{M_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}</select>
        </div>
        <div className="control-group">
          <span className="control-group-label" id="fd-onset-label">Onset assumption</span>
          <select id="fd-onset" aria-labelledby="fd-onset-label" value={onsetMode} onChange={e => withTouch(setOnsetMode)(e.target.value)}>{FAILURE_ONSET_MODES.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}</select>
        </div>
      </div>
      <SliderField id="fd-deltaSE" label="Assumed systematic shift size" value={deltaSE} min={0.25} max={6} step={0.25} onChange={withTouch(setDeltaSE)} suffix=" SD" />

      <NRMPanel N={n} R={1} M={M} />
      <div className="metric-row">
        <MetricCard label="QC procedure" value="1₃s" />
        <MetricCard label="Ped at QC event" value={(oc.ped * 100).toFixed(1) + "%"} />
        <MetricCard label="Expected QC events to detection" value={events.supported ? events.value.toFixed(2) : "—"} />
        <MetricCard label="Expected patient-sample exposure" value={exposure.supported ? exposure.value.toFixed(1) : "—"} />
      </div>
      <div className="warn-box">{RISK_MODEL_LIMITATION_NOTE}</div>
    </div>
  );
}

function SameFrequencyDifferentProcedurePanel() {
  const [M] = useState(100);
  const [deltaSE, setDeltaSE] = useState(2);
  const ocLow = operatingCharacteristic13s(1, deltaSE);
  const ocHigh = operatingCharacteristic13s(4, deltaSE);
  const expLow = expectedPatientExposureImmediateOnset(M, ocLow.ped);
  const expHigh = expectedPatientExposureImmediateOnset(M, ocHigh.ped);
  return (
    <div>
      <p className="muted">Since numerical Ped is only validated for the single 1₃s rule, this comparison holds M constant and compares two validated 1₃s N configurations — it does not manufacture a multirule Ped.</p>
      <SliderField id="sf-deltaSE" label="Assumed systematic shift size" value={deltaSE} min={0.25} max={6} step={0.25} onChange={setDeltaSE} suffix=" SD" />
      <div className="table-scroll">
        <table className="data-table">
          <thead><tr><th>Configuration</th><th>N</th><th>M</th><th>Ped</th><th>Expected exposure (immediate onset)</th></tr></thead>
          <tbody>
            <tr><td>1₃s, N=1</td><td>1</td><td>{M}</td><td>{(ocLow.ped * 100).toFixed(1)}%</td><td>{expLow.value.toFixed(1)}</td></tr>
            <tr><td>1₃s, N=4</td><td>4</td><td>{M}</td><td>{(ocHigh.ped * 100).toFixed(1)}%</td><td>{expHigh.value.toFixed(1)}</td></tr>
          </tbody>
        </table>
      </div>
      <p className="muted small">Increasing N improves Ped, which in turn shortens expected patient-sample exposure at the same M — a QC-procedure change, not a frequency change.</p>
    </div>
  );
}

function PatientRiskExplorerPanel({ markProgress }) {
  return (
    <div>
      <h3>{PARVIN_SECTION_INTRO}</h3>
      <p><strong>{MAXE_NUF_DEFINITION}</strong></p>
      <div className="warn-box">{MAXE_NUF_BOUNDARY_NOTE}</div>
      <p className="callout-inline">{MAXE_NUF_NOT_ONLY_FRAMEWORK_NOTE}</p>

      <h3>Why published planning tools use nomograms</h3>
      <p>{NOMOGRAM_CONCEPT_NOTE}</p>
      <div className="exercise-reveal-card">
        <h4>{WORKED_NOMOGRAM_EXAMPLE.label}</h4>
        <p>{WORKED_NOMOGRAM_EXAMPLE.explanation}</p>
        <p className="calc-panel">{WORKED_NOMOGRAM_EXAMPLE.formulaAsPublished}</p>
        <p className="callout-inline">{WORKED_NOMOGRAM_EXAMPLE.cautionAgainstGeneralisation}</p>
      </div>
      <p className="muted small">{MAXE_GOAL_NOTE}</p>
      <p className="muted small">{PATIENT_RISK_SIGMA_CAUTION}</p>

      <h3>Both procedure performance and frequency matter</h3>
      <QuadrantMatrix />

      <h3>Frequency Designer</h3>
      <FrequencyDesignerPanel markProgress={markProgress} />

      <h3>Same frequency, different QC procedure</h3>
      <SameFrequencyDifferentProcedurePanel />
    </div>
  );
}

/* ---------------------------- FREQUENCY CHALLENGE ---------------------------- */
const DEFAULT_RISK_ANSWER = { whatChanged: null, likelyEffect: null, revealedNext: false, confidence: null, submitted: false };

function FrequencyChallengePanel({ markProgress }) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const kase = FREQUENCY_CHALLENGE_CASES[idx];
  const ans = answers[kase.id] || DEFAULT_RISK_ANSWER;

  const allSubmitted = FREQUENCY_CHALLENGE_CASES.every(c => answers[c.id] && answers[c.id].submitted);
  useEffect(() => { if (allSubmitted) markProgress("risk"); }, [allSubmitted]);

  function updateAns(patch) { setAnswers(a => ({ ...a, [kase.id]: { ...ans, ...patch } })); }
  const canSubmit = ans.whatChanged != null && ans.likelyEffect != null && ans.revealedNext && ans.confidence != null;
  function submit() { if (canSubmit) updateAns({ submitted: true }); }

  const whatChangedCorrect = ans.submitted && kase.correctWhatChanged.includes(ans.whatChanged);
  const likelyEffectCorrect = ans.submitted && ans.likelyEffect === kase.correctLikelyEffect;

  const wcScore = FREQUENCY_CHALLENGE_CASES.reduce((acc, c) => { const a = answers[c.id]; return acc + (a && a.submitted && c.correctWhatChanged.includes(a.whatChanged) ? 1 : 0); }, 0);
  const leScore = FREQUENCY_CHALLENGE_CASES.reduce((acc, c) => { const a = answers[c.id]; return acc + (a && a.submitted && a.likelyEffect === c.correctLikelyEffect ? 1 : 0); }, 0);
  const attemptedCount = FREQUENCY_CHALLENGE_CASES.filter(c => answers[c.id] && answers[c.id].submitted).length;

  return (
    <div>
      <p className="muted">Ten deterministic scenarios connecting QC procedure, N, R, M and analytical performance to detection and patient exposure. At least two cases have "insufficient information" as the intended answer — that is a legitimate, teachable conclusion here, not a wrong answer.</p>
      <div className="challenge-nav">
        {FREQUENCY_CHALLENGE_CASES.map((c, i) => (
          <button key={c.id} className={"case-chip" + (i === idx ? " case-chip-active" : "") + (answers[c.id] && answers[c.id].submitted ? " case-chip-done" : "")}
            onClick={() => setIdx(i)} aria-current={i === idx}>{c.id}</button>
        ))}
      </div>
      <div className="case-panel">
        <h2>{kase.title}</h2>
        <p>{kase.scenario}</p>

        <div className="question-block">
          <p className="q-prompt">What changed?</p>
          <div className="option-list option-list-grid">
            {WHAT_CHANGED_OPTIONS.map(o => (
              <button key={o.id} disabled={ans.submitted} className={"option-btn small" + (ans.whatChanged === o.id ? " option-selected" : "")} onClick={() => updateAns({ whatChanged: o.id })}>{o.label}</button>
            ))}
          </div>
        </div>

        <div className="question-block">
          <p className="q-prompt">What is the likely effect?</p>
          <div className="option-list option-list-grid">
            {LIKELY_EFFECT_OPTIONS.map(o => (
              <button key={o.id} disabled={ans.submitted} className={"option-btn small" + (ans.likelyEffect === o.id ? " option-selected" : "")} onClick={() => updateAns({ likelyEffect: o.id })}>{o.label}</button>
            ))}
          </div>
        </div>

        <div className="question-block">
          <p className="q-prompt">What should be considered next?</p>
          {!ans.revealedNext
            ? <button className="btn-secondary" onClick={() => updateAns({ revealedNext: true })}>Reveal consideration</button>
            : <p>{kase.nextConsideration}</p>}
        </div>

        <div className="question-block">
          <p className="q-prompt">How confident are you in this interpretation?</p>
          <div className="option-list option-list-grid option-list-narrow">
            {CONFIDENCE_OPTIONS.map(o => (
              <button key={o.id} disabled={ans.submitted} className={"option-btn small" + (ans.confidence === o.id ? " option-selected" : "")} onClick={() => updateAns({ confidence: o.id })}>{o.label}</button>
            ))}
          </div>
        </div>

        {!ans.submitted ? (
          <button className="btn-primary" onClick={submit} disabled={!canSubmit}>Commit interpretation</button>
        ) : (
          <div className="feedback-panel">
            <h3>Feedback</h3>
            <p><strong>Your interpretation:</strong> {WHAT_CHANGED_OPTIONS.find(o => o.id === ans.whatChanged).label} / {LIKELY_EFFECT_OPTIONS.find(o => o.id === ans.likelyEffect).label}</p>
            <p><strong>Correct distinction:</strong> {whatChangedCorrect && likelyEffectCorrect ? "Matches the intended teaching answer." : "Differs from the intended teaching answer — see below."}</p>
            <p><strong>What changed:</strong> {kase.correctWhatChanged.map(id => WHAT_CHANGED_OPTIONS.find(o => o.id === id).label).join(" / ")}</p>
            <p><strong>What remained unchanged:</strong> {kase.whatRemainedUnchanged}</p>
            <p><strong>Effect on QC detection:</strong> {kase.effectOnDetection}</p>
            <p><strong>Effect on patient exposure:</strong> {kase.effectOnExposure}</p>
            <p><strong>What this model can estimate:</strong> {kase.whatModelCanEstimate}</p>
            <p><strong>What this model cannot estimate:</strong> {kase.whatModelCannotEstimate}</p>
            <p><strong>Reasonable next consideration:</strong> {kase.nextConsideration}</p>
            {kase.misconceptionFlag && <p className="callout-inline">{MISCONCEPTION_NOTES[kase.misconceptionFlag]}</p>}
            <div className="btn-row">
              {idx < FREQUENCY_CHALLENGE_CASES.length - 1 && <button className="btn-secondary" onClick={() => setIdx(idx + 1)}>Next case</button>}
              {idx > 0 && <button className="btn-link" onClick={() => setIdx(idx - 1)}>Previous case</button>}
            </div>
          </div>
        )}
      </div>
      <div className="score-summary">
        <h3>Session score ({attemptedCount} / {FREQUENCY_CHALLENGE_CASES.length} attempted)</h3>
        <div className="metric-row">
          <MetricCard label="What changed" value={wcScore + " / " + FREQUENCY_CHALLENGE_CASES.length} />
          <MetricCard label="Likely effect" value={leScore + " / " + FREQUENCY_CHALLENGE_CASES.length} />
        </div>
        {allSubmitted && <p className="muted">All cases attempted for this session. This score reflects a short prototype exercise and is not a competency certification.</p>}
      </div>
    </div>
  );
}

/* ---------------------------- SCREEN SHELL ---------------------------- */
function RiskFrequencyLabScreen({ level, markProgress, goto }) {
  const [mode, setMode] = useState("concepts");

  return (
    <div className="screen">
      <h1>Risk &amp; Frequency Lab</h1>
      <p className="muted">A statistically appropriate QC procedure can still be an inadequate QC strategy if QC is performed at an inappropriate frequency. This lab keeps the QC procedure (rules, N, R) fixed and varies only how often QC is performed (M), so you can see the two effects separately.</p>

      <div className="tabbar" role="tablist" aria-label="Risk & Frequency Lab mode">
        {RISK_LAB_MODES.map(m => (
          <button key={m.id} role="tab" aria-selected={mode === m.id}
            className={"tab" + (mode === m.id ? " tab-active" : "")}
            onClick={() => setMode(m.id)}>{m.label}</button>
        ))}
      </div>

      {mode === "concepts" && <ConceptsPanel />}
      {mode === "simulator" && <FrequencySimulatorPanel markProgress={markProgress} />}
      {mode === "delay" && <DetectionDelayPanel markProgress={markProgress} />}
      {mode === "explorer" && <PatientRiskExplorerPanel markProgress={markProgress} />}
      {mode === "challenge" && <FrequencyChallengePanel markProgress={markProgress} />}

      <ScientificBasisNote goto={goto} text="This lab draws on Parvin's patient-risk framework and CLSI C24's treatment of QC frequency and risk-based SQC — see the Evidence page for full provenance and scope." />
    </div>
  );
}


