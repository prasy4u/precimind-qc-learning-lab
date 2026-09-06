/* =========================================================================
   Patient Surveillance Lab (QC-12) — screen: ONE primary nav item with
   five internal modes (PBRTQC Foundations | Patient Distribution Lab |
   Algorithm Lab | Error Detection Simulator | PBRTQC Challenge). Mirrors
   the architecture of 30-bv-screens.jsx / 26-eqa-screens.jsx. Consumes
   32-pbrtqc-data.js (static content, the 18-case challenge bank) and
   31-pbrtqc-calc.js (calculations) — no new calculation logic lives here.
   ========================================================================= */

const PBRTQC_MODES = [
  { id: "foundations", label: "PBRTQC Foundations" },
  { id: "distribution", label: "Patient Distribution Lab" },
  { id: "algorithm", label: "Algorithm Lab" },
  { id: "simulator", label: "Error Detection Simulator" },
  { id: "challenge", label: "PBRTQC Challenge" }
];

/* ---------------------------- PBRTQC FOUNDATIONS ---------------------------- */
function PbrtqcFoundationsPanel({ markProgress }) {
  useEffect(() => { markProgress("pbrtqc"); }, []);
  return (
    <div>
      <div className="callout banner-callout">{PBRTQC_CORE_PRINCIPLE}</div>
      <p className="callout-inline">{PBRTQC_NOT_JUST_MOVING_AVERAGE_NOTE}</p>
      <p className="callout-inline">{PBRTQC_COMPLEMENTARY_NOTE}</p>
      <p className="callout-inline">{NEVER_CALIBRATION_FAILURE_NOTE}</p>

      <h3>N, R, M and W are different</h3>
      <div className="nrm-row">
        <div className="quadrant-cell"><h4>{N_R_M_W_DISTINCTION_EXAMPLE.n.symbol} = {N_R_M_W_DISTINCTION_EXAMPLE.n.value}</h4><p className="muted small">{N_R_M_W_DISTINCTION_EXAMPLE.n.meaning}</p></div>
        <div className="quadrant-cell"><h4>{N_R_M_W_DISTINCTION_EXAMPLE.r.symbol} = {N_R_M_W_DISTINCTION_EXAMPLE.r.value}</h4><p className="muted small">{N_R_M_W_DISTINCTION_EXAMPLE.r.meaning}</p></div>
        <div className="quadrant-cell"><h4>{N_R_M_W_DISTINCTION_EXAMPLE.m.symbol} = {N_R_M_W_DISTINCTION_EXAMPLE.m.value}</h4><p className="muted small">{N_R_M_W_DISTINCTION_EXAMPLE.m.meaning}</p></div>
        <div className="quadrant-cell"><h4>{N_R_M_W_DISTINCTION_EXAMPLE.w.symbol} = {N_R_M_W_DISTINCTION_EXAMPLE.w.value}</h4><p className="muted small">{N_R_M_W_DISTINCTION_EXAMPLE.w.meaning}</p></div>
      </div>
      <div className="callout banner-callout">{N_R_M_W_DISTINCTION_STATEMENT}</div>

      <h3>PBRTQC vs. two easily confused ideas</h3>
      <div className="quadrant-grid">
        <div className="quadrant-cell"><h4>PBRTQC vs. RCV</h4><p className="muted small">{PBRTQC_VS_RCV_DISTINCTION}</p></div>
        <div className="quadrant-cell"><h4>PBRTQC vs. CVG / biological variation</h4><p className="muted small">{PBRTQC_VS_CVG_DISTINCTION}</p></div>
      </div>

      <h3>What PBRTQC is not</h3>
      <div className="quadrant-grid">
        <div className="quadrant-cell"><p>{PBRTQC_NOT_DELTA_CHECK_STATEMENT}</p></div>
        <div className="quadrant-cell"><p>{PBRTQC_NOT_EQA_STATEMENT}</p></div>
      </div>

      <h3>Algorithms in this lab</h3>
      <div className="table-scroll">
        <table className="data-table">
          <thead><tr><th>Implemented numerically</th><th>Description</th></tr></thead>
          <tbody>{ALGORITHMS_IMPLEMENTED.map(a => <tr key={a.id}><td>{a.label}</td><td>{a.description}</td></tr>)}</tbody>
        </table>
      </div>
      <p className="muted small">{ALGORITHM_SCOPE_NOTE}</p>
      <details className="important-note">
        <summary>Mentioned in evidence, NOT implemented here</summary>
        <ul className="mini-explain-list">{ALGORITHMS_MENTIONED_NOT_IMPLEMENTED.map((a, i) => <li key={i}>{a}</li>)}</ul>
      </details>
      <details className="important-note">
        <summary>Explicitly excluded from v0.8</summary>
        <ul className="mini-explain-list">{ALGORITHMS_EXCLUDED_FROM_V08.map((a, i) => <li key={i}>{a}</li>)}</ul>
      </details>
      <p className="muted small">{SLIDING_VS_BLOCKS_NOTE}</p>

      <h3>The seven-step processing pipeline</h3>
      <ol className="mini-explain-list">{PROCESSING_PIPELINE_STEPS.map((s, i) => <li key={i}>{s}</li>)}</ol>
      <p className="callout-inline">{PROCESSING_ORDER_NOTE}</p>

      <h3>Alert interpretation — mandatory statements</h3>
      <div className="callout banner-callout">{ALERT_INTERPRETATION_STATEMENT}</div>
      <div className="callout banner-callout">{STABLE_PBRTQC_DOES_NOT_VALIDATE_STATEMENT}</div>
      <p className="muted small">{ALERT_ROUTES_TO_INVESTIGATION_NOTE}</p>
    </div>
  );
}

/* ---------------------------- PATIENT DISTRIBUTION LAB ---------------------------- */
function PatientDistributionLabPanel({ goto }) {
  const [popId, setPopId] = useState(PATIENT_POPULATIONS[0].id);
  const pop = PATIENT_POPULATIONS.find(p => p.id === popId);
  const raw = pop.baseResults.map((v, i) => ({ value: v, subgroup: pop.subgroupLabels ? pop.subgroupLabels[i] : undefined }));
  const run = runPbrtqcStream(raw, { algorithmId: "moving-mean", windowSize: 20, lowerControlLimit: null, upperControlLimit: null, errorScenario: { errorType: "none" } });

  return (
    <div>
      <p className="muted">{NO_LIVE_DATA_NOTE}</p>
      <h3>Choose a synthetic population</h3>
      <div className="option-list option-list-grid">
        {PATIENT_POPULATIONS.map(p => <button key={p.id} className={"option-btn small" + (popId === p.id ? " option-selected" : "")} onClick={() => setPopId(p.id)}>{p.name}</button>)}
      </div>
      <div className="bv-provenance-card">
        <h4>{pop.displayName}</h4>
        <p className="muted small">{pop.description}</p>
        <p className="muted small"><strong>Case-mix pattern:</strong> {pop.caseMixPattern}</p>
        <p className="muted small"><strong>Provenance:</strong> {pop.provenance}</p>
        <p className="muted small">{pop.limitations}</p>
      </div>
      <PatientStreamChart points={run.points} lowerControlLimit={null} upperControlLimit={null} />

      <h3>Signature distribution experiment</h3>
      <p className="muted small">{DISTRIBUTION_SIGNATURE_EXPERIMENT.lesson}</p>
      <ChangedVsConstantPanel changed={DISTRIBUTION_SIGNATURE_EXPERIMENT.changed} heldConstant={DISTRIBUTION_SIGNATURE_EXPERIMENT.heldConstant} />
      <div className="table-scroll">
        <table className="data-table">
          <thead><tr><th>Population</th><th>First alert (raw index)</th><th>NPed</th><th>Note</th></tr></thead>
          <tbody>
            <tr><td>Population A</td><td>{DISTRIBUTION_SIGNATURE_EXPERIMENT.populationA.firstAlertRawIndex}</td><td>{DISTRIBUTION_SIGNATURE_EXPERIMENT.populationA.nped}</td><td>{DISTRIBUTION_SIGNATURE_EXPERIMENT.populationA.note}</td></tr>
            <tr><td>Population B</td><td>{DISTRIBUTION_SIGNATURE_EXPERIMENT.populationB.firstAlertRawIndex}</td><td>Not detected (false alert precedes onset)</td><td>{DISTRIBUTION_SIGNATURE_EXPERIMENT.populationB.note}</td></tr>
          </tbody>
        </table>
      </div>

      <h3>Population-shift-without-error scenario</h3>
      <div className="exercise-reveal-card">
        <p>{POPULATION_SHIFT_WITHOUT_ERROR_SCENARIO.narrative}</p>
        <ExerciseRevealCard title="" prompt={POPULATION_SHIFT_WITHOUT_ERROR_SCENARIO.question} answer={POPULATION_SHIFT_WITHOUT_ERROR_SCENARIO.correctAnswer === "no" ? "No" : "Yes"} note={POPULATION_SHIFT_WITHOUT_ERROR_SCENARIO.explanation} />
      </div>

      <h3>Case-mix exclusion caution</h3>
      <p className="callout-inline">{CASE_MIX_EXCLUSION_DANGER_NOTE}</p>
      <p className="muted small"><button className="btn-link" onClick={() => goto("bv-rcv")}>Reminder: a patient population's distribution is NOT the same as CVG (BV & RCV Lab)</button></p>
    </div>
  );
}

/* ---------------------------- ALGORITHM LAB ---------------------------- */
function AlgorithmLabPanel() {
  const [algorithmId, setAlgorithmId] = useState("moving-mean");
  const [w, setW] = useState(3);
  const [lambda, setLambda] = useState(0.2);
  const [baseline, setBaseline] = useState(100);
  const meanMedianFixture = [100, 102, 98, 104, 96];
  const ewmaFixture = [100, 110, 110, 110];
  const fixture = algorithmId === "ewma" ? ewmaFixture : meanMedianFixture;

  const meanResult = calculateSlidingMean(meanMedianFixture, w);
  const medianResult = calculateSlidingMedian(meanMedianFixture, w);
  const ewmaResult = calculateEWMA(ewmaFixture, lambda, baseline);
  const activeResult = algorithmId === "moving-mean" ? meanResult : algorithmId === "moving-median" ? medianResult : ewmaResult;

  const robustFixture = [100, 100, 100, 100, 160];
  const robustMean = calculateSlidingMean(robustFixture, 5);
  const robustMedian = calculateSlidingMedian(robustFixture, 5);

  return (
    <div>
      <h3>Explore each algorithm on a fixed sequence</h3>
      <p className="muted small">Fixed sequence for this algorithm: {fixture.join(", ")}.</p>
      <div className="tabbar" role="tablist" aria-label="Algorithm">
        {ALGORITHMS_IMPLEMENTED.map(a => (
          <button key={a.id} role="tab" aria-selected={algorithmId === a.id} className={"tab" + (algorithmId === a.id ? " tab-active" : "")} onClick={() => setAlgorithmId(a.id)}>{a.label}</button>
        ))}
      </div>
      {algorithmId !== "ewma" && <SliderField id="algo-w" label="Window size (W)" value={w} min={1} max={5} step={1} onChange={setW} />}
      {algorithmId === "ewma" && (
        <>
          <SliderField id="algo-lambda" label="EWMA lambda" value={lambda} min={0.1} max={1} step={0.1} onChange={setLambda} />
          <SliderField id="algo-baseline" label="Baseline centre (z0)" value={baseline} min={80} max={120} step={1} onChange={setBaseline} />
        </>
      )}
      {algorithmId === "moving-mean" && <MovingStatisticSummary result={meanResult} />}
      {algorithmId === "moving-median" && <MovingStatisticSummary result={medianResult} />}
      {algorithmId === "ewma" && <EwmaSummary result={ewmaResult} />}
      <div className="table-scroll">
        <table className="data-table">
          <thead><tr><th>Position</th><th>Value</th><th>Statistic</th><th>Status</th></tr></thead>
          <tbody>
            {activeResult.supported && activeResult.series.map((s, i) => (
              <tr key={i}><td>{i + 1}</td><td>{fixture[i]}</td><td>{s.statistic != null ? s.statistic.toFixed(4) : "—"}</td><td>{s.warmupStatus}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>Mean vs. median robustness fixture</h3>
      <p className="muted small">Fixed sequence [100,100,100,100,160], W=5. Moving mean = {robustMean.supported && robustMean.series[4].statistic.toFixed(0)}. Moving median = {robustMedian.supported && robustMedian.series[4].statistic.toFixed(0)}.</p>
      <p className="callout-inline">{MEAN_VS_MEDIAN_ROBUSTNESS_NOTE}</p>
      <div className="callout banner-callout">{MEDIAN_NOT_UNIVERSALLY_BETTER_NOTE}</div>

      <h3>Sliding vs. non-overlapping blocks</h3>
      <p className="muted small">{SLIDING_VS_BLOCKS_NOTE}</p>
    </div>
  );
}

/* ---------------------------- ERROR DETECTION SIMULATOR ---------------------------- */
function ErrorDetectionSimulatorPanel({ markProgress, goto }) {
  const [popId, setPopId] = useState("population-a");
  const [algorithmId, setAlgorithmId] = useState("moving-mean");
  const [w, setW] = useState(20);
  const [lambda, setLambda] = useState(0.2);
  const [lcl, setLcl] = useState(137);
  const [ucl, setUcl] = useState(143);
  const [lowerTrunc, setLowerTrunc] = useState("");
  const [upperTrunc, setUpperTrunc] = useState("");
  const [errorType, setErrorType] = useState("persistent-additive");
  const [magnitude, setMagnitude] = useState(6);
  const [onsetIndex, setOnsetIndex] = useState(81);
  const [duration, setDuration] = useState(20);

  useEffect(() => { markProgress("pbrtqc"); }, []);

  const pop = PATIENT_POPULATIONS.find(p => p.id === popId);
  const raw = pop.baseResults.map((v, i) => ({ value: v, subgroup: pop.subgroupLabels ? pop.subgroupLabels[i] : undefined }));
  const cfg = {
    algorithmId, windowSize: w, ewmaLambda: lambda, baselineCenter: 140,
    lowerControlLimit: lcl, upperControlLimit: ucl,
    lowerTruncationLimit: lowerTrunc === "" ? undefined : Number(lowerTrunc),
    upperTruncationLimit: upperTrunc === "" ? undefined : Number(upperTrunc),
    errorScenario: errorType === "none" ? { errorType: "none" } : { errorType, magnitude, onsetIndex, duration }
  };
  const run = runPbrtqcStream(raw, cfg);
  const nped = run.supported && errorType !== "none" ? calculateNPed(onsetIndex, run.firstAlertRawIndex, raw.length) : null;
  const falseFlag = run.supported ? calculatePointwiseFalseFlagRate(run.points.filter(p => p.alert).length, run.points.filter(p => p.included && p.statistic != null).length) : null;

  return (
    <div>
      <p className="muted small">Recommended flow: {ERROR_DETECTION_RECOMMENDED_FLOW.join(" → ")}.</p>
      <div className="lj-controls">
        <div className="control-group">
          <span className="control-group-label">Population</span>
          <select value={popId} onChange={e => setPopId(e.target.value)}>{PATIENT_POPULATIONS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        </div>
        <div className="control-group">
          <span className="control-group-label">Algorithm</span>
          <select value={algorithmId} onChange={e => setAlgorithmId(e.target.value)}>{ALGORITHMS_IMPLEMENTED.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}</select>
        </div>
        <div className="control-group">
          <span className="control-group-label">Error type</span>
          <select value={errorType} onChange={e => setErrorType(e.target.value)}>
            {SUPPORTED_ERROR_TYPES.map(t => <option key={t} value={t}>{humanizePbrtqcLabel(t)}</option>)}
          </select>
        </div>
      </div>
      {algorithmId !== "ewma" ? <SliderField id="sim-w" label="Window size (W)" value={w} min={1} max={80} step={1} onChange={setW} /> : <SliderField id="sim-lambda" label="EWMA lambda" value={lambda} min={0.1} max={1} step={0.1} onChange={setLambda} />}
      <SliderField id="sim-lcl" label="Lower control limit" value={lcl} min={100} max={160} step={1} onChange={setLcl} />
      <SliderField id="sim-ucl" label="Upper control limit" value={ucl} min={100} max={200} step={1} onChange={setUcl} />
      <div className="lj-controls">
        <label className="control-group">Lower truncation limit (optional)
          <input type="number" value={lowerTrunc} onChange={e => setLowerTrunc(e.target.value)} placeholder="none" />
        </label>
        <label className="control-group">Upper truncation limit (optional)
          <input type="number" value={upperTrunc} onChange={e => setUpperTrunc(e.target.value)} placeholder="none" />
        </label>
      </div>
      {errorType !== "none" && (
        <>
          <SliderField id="sim-magnitude" label="Error magnitude" value={magnitude} min={-20} max={20} step={0.5} onChange={setMagnitude} />
          <SliderField id="sim-onset" label="Onset raw patient index" value={onsetIndex} min={1} max={raw.length} step={1} onChange={setOnsetIndex} />
          {errorType.indexOf("temporary") === 0 && <SliderField id="sim-duration" label="Duration (raw results)" value={duration} min={1} max={raw.length} step={1} onChange={setDuration} />}
        </>
      )}
      <p className="muted small">{STARTING_CONFIGURATION_LANGUAGE_NOTE} {CONTROL_LIMIT_PROVENANCE_NOTE}</p>
      <p className="callout-inline">{ALERT_BOUNDARY_NOTE}</p>

      <PatientStreamChart points={run.points} errorOnsetRawIndex={errorType !== "none" ? onsetIndex : null} lowerControlLimit={lcl} upperControlLimit={ucl} />

      <div className="metric-row">
        <MetricCard label="Raw results" value={run.rawCount} />
        <MetricCard label="Eligible results" value={run.eligibleCount} />
        <MetricCard label="Excluded" value={run.excludedCount} />
        <MetricCard label="First alert (raw index)" value={run.firstAlertRawIndex != null ? run.firstAlertRawIndex : "None"} />
      </div>
      {nped && <NPedSummaryCard nped={nped} />}
      {falseFlag && falseFlag.supported && <p className="muted small">Pointwise false-flag rate on evaluable points: {falseFlag.rate.toFixed(2)}%. {falseFlag.correlationCaveat}</p>}

      <p className="muted small"><button className="btn-link" onClick={() => goto && goto("investigation")}>Investigate this alert (Investigation Lab)</button> — {ALERT_ROUTES_TO_INVESTIGATION_NOTE}</p>

      <h3>Overly aggressive truncation — signature experiment</h3>
      <p className="muted small">{AGGRESSIVE_TRUNCATION_EXPERIMENT.heldConstant} {AGGRESSIVE_TRUNCATION_EXPERIMENT.changed}</p>
      <div className="table-scroll">
        <table className="data-table">
          <thead><tr><th>Configuration</th><th>Detected</th><th>NPed</th><th>Excluded</th></tr></thead>
          <tbody>
            <tr><td>No truncation</td><td>Yes</td><td>{AGGRESSIVE_TRUNCATION_EXPERIMENT.noTruncation.nped}</td><td>0</td></tr>
            <tr><td>Aggressive upper truncation ({AGGRESSIVE_TRUNCATION_EXPERIMENT.aggressiveTruncation.upperTruncationLimit})</td><td>No</td><td>Not reported</td><td>{AGGRESSIVE_TRUNCATION_EXPERIMENT.aggressiveTruncation.excludedCount}</td></tr>
          </tbody>
        </table>
      </div>
      <div className="callout banner-callout">{AGGRESSIVE_TRUNCATION_EXPERIMENT.lesson}</div>
      <p className="muted small">{TRUNCATION_NOTE}</p>

      <h3>Training / verification separation</h3>
      <TrainingVerificationDisclosure trainingLabel="First 75 results of the selected population (illustrative split)." verificationLabel="Remaining results of the selected population, explicitly not used for parameter selection." />

      <h3>Multiple analyzers</h3>
      <p className="muted small">{MULTIPLE_ANALYZER_EXPERIMENT.narrative}</p>
      <div className="table-scroll">
        <table className="data-table">
          <thead><tr><th>Configuration</th><th>First alert</th><th>NPed</th></tr></thead>
          <tbody>
            <tr><td>Analyzer A alone</td><td>{MULTIPLE_ANALYZER_EXPERIMENT.separateStreams.analyzerAFirstAlertRawIndex}</td><td>{MULTIPLE_ANALYZER_EXPERIMENT.separateStreams.analyzerANped}</td></tr>
            <tr><td>Pooled A+B (W={MULTIPLE_ANALYZER_EXPERIMENT.pooledStream.windowSize})</td><td>{MULTIPLE_ANALYZER_EXPERIMENT.pooledStream.pooledFirstAlertRawIndex}</td><td>{MULTIPLE_ANALYZER_EXPERIMENT.pooledStream.pooledNped}</td></tr>
          </tbody>
        </table>
      </div>
      <p className="callout-inline">{MULTIPLE_ANALYZER_EXPERIMENT.lesson}</p>

      <h3>Throughput vs. elapsed time</h3>
      <p className="muted small">{THROUGHPUT_NOTE}</p>
      <div className="metric-row">
        <MetricCard label={"Lab A (" + THROUGHPUT_EXAMPLE.labA.resultsPerHour + "/hr)"} value={"~" + THROUGHPUT_EXAMPLE.labA.elapsedHours + " hr"} sub={"NPed=" + THROUGHPUT_EXAMPLE.nped} />
        <MetricCard label={"Lab B (" + THROUGHPUT_EXAMPLE.labB.resultsPerHour + "/hr)"} value={"~" + THROUGHPUT_EXAMPLE.labB.elapsedHours + " hr"} sub={"NPed=" + THROUGHPUT_EXAMPLE.nped} />
      </div>
      <p className="muted small">{THROUGHPUT_ASSUMPTION_LABEL}</p>
    </div>
  );
}

/* ---------------------------- PBRTQC CHALLENGE ---------------------------- */
function PbrtqcChallengePanel({ markProgress }) {
  const [idx, setIdx] = useState(0);
  const [byCase, setByCase] = useState({});
  const kase = PBRTQC_CHALLENGE_CASES[idx];
  const ans = byCase[kase.id] || { answerId: null, confidence: null, completed: false };

  function update(patch) { setByCase(prev => ({ ...prev, [kase.id]: { ...ans, ...patch } })); }
  function submitCase() { update({ completed: true }); markProgress("pbrtqc"); }

  const attempted = Object.values(byCase).filter(a => a.completed).length;
  const correct = Object.entries(byCase).filter(([id, a]) => {
    if (!a.completed) return false;
    const c = PBRTQC_CHALLENGE_CASES.find(x => String(x.id) === String(id));
    return c && a.answerId === c.correctAnswer;
  }).length;

  const options = PBRTQC_ANSWER_KIND_OPTIONS[kase.answerKind] || [];

  return (
    <div>
      <p className="muted">Eighteen deterministic cases (sixteen required, two optional). Work through each case's reasoning, then record your confidence.</p>
      <div className="challenge-nav">
        {PBRTQC_CHALLENGE_CASES.map((c, i) => (
          <button key={c.id} className={"case-chip" + (i === idx ? " case-chip-active" : "") + ((byCase[c.id] && byCase[c.id].completed) ? " case-chip-done" : "")} onClick={() => setIdx(i)} aria-current={i === idx}>{i + 1}</button>
        ))}
      </div>

      <div className="case-panel">
        <h2>{kase.title}</h2>
        <p className="muted small">{kase.narrative}</p>
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
            <p className="muted small">{PBRTQC_CONFIDENCE_NEVER_ALTERS_SCORE_NOTE}</p>
            <div className="btn-row">
              {idx < PBRTQC_CHALLENGE_CASES.length - 1 && <button className="btn-secondary" onClick={() => setIdx(idx + 1)}>Next case</button>}
              {idx > 0 && <button className="btn-link" onClick={() => setIdx(idx - 1)}>Previous case</button>}
            </div>
          </div>
        )}
      </div>

      <div className="score-summary">
        <h3>Session scoring ({attempted} / {PBRTQC_CHALLENGE_CASES.length} cases completed)</h3>
        <p className="muted small">Confidence is metacognitive only and never changes this score.</p>
        <div className="metric-row"><MetricCard label="Correct" value={correct + " / " + attempted} /></div>
      </div>
    </div>
  );
}

/* ---------------------------- SCREEN SHELL ---------------------------- */
function PatientSurveillanceLabScreen({ level, markProgress, goto }) {
  const [mode, setMode] = useState("foundations");
  return (
    <div className="screen">
      <h1>Patient Surveillance Lab</h1>
      <p className="muted">Patient-based real-time quality control (PBRTQC) and advanced patient-based surveillance. This is an educational reasoning pathway — {PBRTQC_PATHWAY_STEPS.join(" → ")} — not a rigid universal sequence.</p>
      <RecoveryFlowDiagram steps={PBRTQC_PATHWAY_STEPS} />
      <p className="callout-inline">{PBRTQC_PATHWAY_CAUTION}</p>
      <p className="muted small">{PBRTQC_LEVEL_EXPLANATION[level] || PBRTQC_LEVEL_EXPLANATION.intermediate}</p>

      <div className="tabbar" role="tablist" aria-label="Patient Surveillance Lab mode">
        {PBRTQC_MODES.map(m => (
          <button key={m.id} role="tab" aria-selected={mode === m.id} className={"tab" + (mode === m.id ? " tab-active" : "")} onClick={() => setMode(m.id)}>{m.label}</button>
        ))}
      </div>

      {mode === "foundations" && <PbrtqcFoundationsPanel markProgress={markProgress} />}
      {mode === "distribution" && <PatientDistributionLabPanel goto={goto} />}
      {mode === "algorithm" && <AlgorithmLabPanel />}
      {mode === "simulator" && <ErrorDetectionSimulatorPanel markProgress={markProgress} goto={goto} />}
      {mode === "challenge" && <PbrtqcChallengePanel markProgress={markProgress} />}

      <details className="important-note">
        <summary>What v0.8 does not implement</summary>
        <ul className="mini-explain-list">{PBRTQC_EXCLUSION_LIST.map((e, i) => <li key={i}>{humanizePbrtqcLabel(e)}</li>)}</ul>
      </details>
      <p className="callout-inline">{METHODOLOGICAL_DEVELOPMENT_NOTE}</p>

      <ScientificBasisNote goto={goto} text="This lab draws on Badrick, Bietenbeck, Cervinski et al. (2019) for PBRTQC review and recommendations, Loh et al. (2020) for performance-verification methodology, Bietenbeck et al. (2020) for simulation-based understanding of PBRTQC behaviour, Badrick, Cervinski & Loh (2019) for a primer on patient-based quality control techniques, van Rossum et al. (2021) for benefits/limitations/controversies, Smith, Badrick & Bowling (2020) for the role of the analyte distribution, Loh et al. (2019) for informatics specifications, Loh et al. (2021) for the effect of combining data across multiple instruments, van Andel et al. (2022) for a moving-average implementation toolbox, and Duan et al. (2024) for a survey of next-generation PBRTQC models (cited cautiously, and never used to justify any AI feature in this build) — see the Evidence page for full provenance, evidentiary tier, and scope." />
    </div>
  );
}
