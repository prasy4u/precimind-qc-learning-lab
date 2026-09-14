import { calcBiasPercent, calcCVPercent, calcMean, calcSampleSD, calcSigma, fmt, fmtSigned } from "../core/statistics.js";
import { ABOUT_TEXT, BROAD_OPTIONS, COMPETENCY_MODULES, CONFIDENCE_OPTIONS, DIAGNOSTIC_QUESTIONS, EDU_DISCLAIMER, EVIDENCE_HIERARCHY_AUTHORITY_NOTE, EVIDENCE_SOURCES, EVIDENCE_TIERS, GLOSSARY, LEVELS, LEVEL_HOME_DESC, LEVEL_LABELS, LJ_LAB_EXPLANATION, NEXT_STEP_OPTIONS, NEXT_STEP_TEXT_BY_LEVEL, ONGOING_DISCUSSION_AREAS, PATTERN_OPTIONS, PROGRESSION_STAGES, RECOMMENDED_PATH, SCENARIOS, SIGMA_CAUTION_POINTS, STATS_PLAYGROUND_EXPLANATION, Z_POS_SHIFT, Z_SCATTER, Z_STABLE_A, Z_TREND_UP, buildDomainProfile, getConfidenceNote, getPatternFeedback, suggestLevelFromScore } from "./app-data.js";
import { LJChart, MetricCard, ScientificBasisNote, SliderField } from "./shared-components.jsx";
import React, { useState, useMemo, useRef, useEffect } from "react";
import { Badge, DistributionView, Modal } from "./shared-components.jsx";

/* =========================================================================
   Screens
   ========================================================================= */

export function Disclaimer() {
  return <div className="disclaimer" role="note"><strong>Disclaimer.</strong> {EDU_DISCLAIMER}</div>;
}

/* ---------------------------- HOME ---------------------------- */
/* Grouped into three phases (spec v0.5 section 87) rather than one long
   crowded row. DOM order is preserved within each phase so relative-order
   assertions remain meaningful; a phase label precedes each group's steps. */
export const PATHWAY_PHASES = [
  { phase: "Understand", steps: [{ label: "Statistics", screen: "stats" }, { label: "QC Materials", screen: "qc-materials" }, { label: "QC charts", screen: "lj" }, { label: "Patterns", screen: "pattern" }] },
  { phase: "Control", steps: [{ label: "Rules", screen: "rules" }, { label: "APS", screen: "strategy" }, { label: "Sigma", screen: "sigma" }, { label: "QC strategy", screen: "strategy" }, { label: "Biological Variation & RCV", screen: "bv-rcv" }] },
  { phase: "Govern", steps: [{ label: "Risk-based QC", screen: "risk" }, { label: "Investigation & Recovery", screen: "investigation" }, { label: "External Assurance", screen: "external-assurance" }, { label: "Patient Surveillance", screen: "pbrtqc" }] }
];
/* Flattened view, preserved for any code that still wants a single ordered
   list of steps (e.g. "start here" logic) without the phase grouping. */
export const LEARNING_PATHWAY = PATHWAY_PHASES.reduce((acc, p) => acc.concat(p.steps), []);

export function HomeScreen({ level, setLevel, goto, openDiagnostic }) {
  return (
    <div className="screen">
      <section className="hero">
        <h1>Learn Quality Control by Doing It</h1>
        <p className="hero-sub">Build analytical QC competence through interactive statistics, Levey-Jennings interpretation, pattern recognition and Sigma exploration.</p>
      </section>
      <Disclaimer />

      <section className="pathway-section" aria-labelledby="morning-qc-capstone-heading">
        <h2 id="morning-qc-capstone-heading" className="section-title">Capstone</h2>
        <button
          type="button"
          className="pathway-step"
          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '16px 20px', height: 'auto' }}
          onClick={() => goto("morning-qc")}
        >
          <strong>Morning QC Room</strong>
          <div className="muted" style={{ marginTop: 4 }}>
            Integrated decision simulation across QC, investigation, patient risk and release.
          </div>
        </button>
      </section>

      <section className="pathway-section">
        <h2 className="section-title">Learning pathway</h2>
        {PATHWAY_PHASES.map(group => (
          <div key={group.phase} className="pathway-phase-group">
            <div className="pathway-phase-label">{group.phase}</div>
            <div className="pathway-row">
              {group.steps.map((step, i) => (
                <React.Fragment key={step.label + i}>
                  <button className="pathway-step" onClick={() => goto(step.screen)}>{step.label}</button>
                  {i < group.steps.length - 1 && <span className="pathway-arrow" aria-hidden="true">→</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
        <button className="btn-link start-here-link" onClick={() => goto("stats")}>Start here if you're new to QC →</button>
      </section>

      <h2 className="section-title">Choose your starting level</h2>
      <p className="muted">These are not separate courses — they apply different cognitive depth to the same concepts. You can change your level at any time from the navigation bar.</p>
      <p className="muted">Your level does not lock or unlock any module — every module stays open at every level. What changes is how deeply the explanations, feedback and challenge questions engage with the underlying reasoning: Beginner focuses on terminology and basic calculation; Intermediate adds pattern interpretation and cautious reasoning; Advanced connects APS, bias, CV and Sigma into QC-design judgement; Expert adds critique of QC strategy, risk, and the limits of the simplified models used here.</p>
      <div className="level-grid">
        {LEVELS.map(lv => (
          <button key={lv} className={"level-card" + (level === lv ? " level-card-active" : "")}
            onClick={() => setLevel(lv)}>
            <div className="level-card-title">{LEVEL_LABELS[lv]}</div>
            <div className="level-card-desc">{LEVEL_HOME_DESC[lv]}</div>
            {level === lv && <Badge tone="active">Current level</Badge>}
          </button>
        ))}
      </div>
      <div className="home-actions">
        <button className="btn-secondary" onClick={openDiagnostic}>Assess My Level</button>
        <button className="btn-primary" onClick={() => goto("map")}>Go to Competency Map</button>
      </div>
    </div>
  );
}

/* ---------------------------- DIAGNOSTIC ---------------------------- */
export function DiagnosticModal({ onClose, onApply }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const done = step >= DIAGNOSTIC_QUESTIONS.length;

  function choose(w) {
    const next = answers.slice(0, step).concat([w]);
    setAnswers(next);
    setStep(step + 1);
  }

  const avg = answers.length ? answers.reduce((a, b) => a + b, 0) / answers.length : 0;
  const suggestion = suggestLevelFromScore(avg);
  const domainProfile = done ? buildDomainProfile(answers) : [];

  return (
    <Modal title="Assess My Level" onClose={onClose}>
      {!done ? (
        <div>
          <div className="diag-progress">Question {step + 1} of {DIAGNOSTIC_QUESTIONS.length} — {DIAGNOSTIC_QUESTIONS[step].topic}</div>
          <p className="diag-prompt">{DIAGNOSTIC_QUESTIONS[step].prompt}</p>
          <div className="option-list">
            {DIAGNOSTIC_QUESTIONS[step].options.map((opt, i) => (
              <button key={i} className="option-btn" onClick={() => choose(opt.w)}>{opt.text}</button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <p>You have completed the placement questions.</p>
          <div className="suggestion-box">
            <div className="suggestion-label">Suggested starting level</div>
            <div className="suggestion-value">{LEVEL_LABELS[suggestion]}</div>
          </div>
          <p className="muted">This is a suggestion only, based on a short deterministic set of questions. It does not certify competency. You may accept it or choose a different level.</p>

          <div className="domain-profile">
            <h3>Domain profile</h3>
            <div className="domain-profile-grid">
              {domainProfile.map(d => (
                <div className="domain-profile-item" key={d.key}>
                  <div className="domain-profile-label">{d.label}</div>
                  <div className="domain-profile-value">{LEVEL_LABELS[d.level]}</div>
                </div>
              ))}
            </div>
            <p className="muted small">Each domain reflects only 2 questions — treat this profile as a rough indicator of relative strengths, not a precise measurement.</p>
          </div>

          <div className="option-list">
            {LEVELS.map(lv => (
              <button key={lv} className={"option-btn" + (lv === suggestion ? " option-suggested" : "")}
                onClick={() => { onApply(lv); onClose(); }}>
                {LEVEL_LABELS[lv]}{lv === suggestion ? " — suggested" : ""}
              </button>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ---------------------------- COMPETENCY MAP ---------------------------- */
export const STATUS_LABEL = { available: "Available", introduced: "Introduced", "coming-later": "Coming later" };
export const STATUS_TONE = { available: "available", introduced: "introduced", "coming-later": "later" };

export function CompetencyMapScreen({ level, goto, progress }) {
  function completionFor(mod) {
    if (mod.screen === "stats") return progress.stats;
    if (mod.screen === "lj") return progress.lj;
    if (mod.screen === "sigma") return progress.sigma;
    if (mod.screen === "rules") return progress.rules;
    if (mod.screen === "strategy") return progress.strategy;
    if (mod.screen === "risk") return progress.risk;
    if (mod.screen === "investigation") return progress.investigation;
    if (mod.screen === "external-assurance") return progress["external-assurance"];
    if (mod.screen === "bv-rcv") return progress["bv-rcv"];
    if (mod.screen === "pbrtqc") return progress.pbrtqc;
    return false;
  }
  // Recommended next: first available module (in intended path order) not yet practiced this session.
  const recommendedScreen = RECOMMENDED_PATH.find(scr => {
    if (scr === "pattern") return !progress.pattern;
    return !progress[scr];
  });

  return (
    <div className="screen">
      <h1>Competency Map</h1>
      <p className="muted">The full knowledge pathway for analytical QC competence. Modules are shown in three states: <strong>Available</strong> (a dedicated interactive module in this build), <strong>Introduced</strong> (the concept is touched upon within an available module, but has no dedicated module of its own yet), and <strong>Coming later</strong> (not addressed in this build).</p>
      <div className="stage-legend">
        {PROGRESSION_STAGES.map((s, i) => (
          <span key={s} className="stage-chip">{s}{i < PROGRESSION_STAGES.length - 1 ? " →" : ""}</span>
        ))}
      </div>
      <div className="module-grid">
        {COMPETENCY_MODULES.map(mod => {
          const isRecommended = mod.status === "available" && mod.screen === recommendedScreen;
          return (
            <div key={mod.id} className={"module-card" + (mod.status === "coming-later" ? " module-disabled" : "") + (isRecommended ? " module-recommended" : "")}>
              <div className="module-head">
                <span className="module-id">{mod.id}</span>
                <Badge tone={STATUS_TONE[mod.status]}>{STATUS_LABEL[mod.status]}</Badge>
              </div>
              <div className="module-title">{mod.title}</div>
              <div className="module-stage">Stage: {mod.stage}</div>
              {mod.status === "available" && (
                <div className="module-actions">
                  <button className="btn-link" onClick={() => goto(mod.screen)}>Open module</button>
                  {completionFor(mod) && <Badge tone="done">Practiced this session</Badge>}
                  {isRecommended && <Badge tone="recommended">Recommended next</Badge>}
                </div>
              )}
              {mod.status === "introduced" && (
                <div className="module-actions">
                  <button className="btn-link" onClick={() => goto(mod.introducedIn)}>Touched upon within {mod.introducedInLabel}</button>
                </div>
              )}
              {mod.status === "coming-later" && (
                <div className="module-actions"><span className="muted small">Not implemented in this build</span></div>
              )}
            </div>
          );
        })}
      </div>
      <div className="module-grid" style={{ marginTop: 24 }} aria-label="Capstone">
        <div className="module-card">
          <div className="module-head">
            <span className="module-id">CAPSTONE</span>
            <Badge tone="available">Available</Badge>
          </div>
          <div className="module-title">Morning QC Room</div>
          <div className="module-stage">Integrates QC-01 through QC-12 into a single decision simulation</div>
          <div className="module-actions">
            <button className="btn-link" onClick={() => goto("morning-qc")}>Open Morning QC Room</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- STATISTICS PLAYGROUND ---------------------------- */
/* Beginner base pattern: constructed so its OWN sample mean is exactly 0 and
   its OWN sample SD is exactly 1 (n=12), so that — before any scaling — the
   Configured Process SD and the Observed Sample SD of the generated dataset
   agree at the default setting. */
export const PLAYGROUND_Z_BEGINNER = [-1.634542, -1.225906, -0.91943, -0.612953, -0.306477, -0.102159, 0.102159, 0.306477, 0.612953, 0.91943, 1.225906, 1.634542];
/* Standard base pattern used from Intermediate level up: a fixed, still
   deterministic, illustrative sample whose OWN sample SD (≈0.979) is close
   to but not exactly 1 — used to show that a finite-sample SD estimate can
   differ from the underlying process parameter it estimates. */
export const PLAYGROUND_Z_STANDARD = [-1.6, -1.2, -0.9, -0.6, -0.3, -0.1, 0.1, 0.3, 0.6, 0.9, 1.2, 1.6];

export const PG_DEFAULTS = { target: 100, sd: 2, bias: 0 };

export function StatsPlaygroundScreen({ level, markProgress, goto }) {
  const [mode, setMode] = useState("manipulate");
  const [target, setTarget] = useState(PG_DEFAULTS.target);
  const [sd, setSd] = useState(PG_DEFAULTS.sd);
  const [biasPct, setBiasPct] = useState(PG_DEFAULTS.bias);
  const [interacted, setInteracted] = useState(false);
  const [showSampleNote, setShowSampleNote] = useState(false);

  useEffect(() => { if (interacted) markProgress("stats"); }, [interacted]);

  const basePattern = level === "beginner" ? PLAYGROUND_Z_BEGINNER : PLAYGROUND_Z_STANDARD;
  const baseSampleSD = calcSampleSD(basePattern); // the base pattern's own sample SD, before scaling

  // Target is the assigned reference value and stays fixed when bias changes.
  // Process Centre is the (possibly biased) observed process location.
  const biasAmount = target * (biasPct / 100);
  const processCenter = target + biasAmount;
  const rawValues = useMemo(() => basePattern.map(z => processCenter + z * sd), [processCenter, sd, level]);
  const observedMean = calcMean(rawValues);
  const observedSampleSD = calcSampleSD(rawValues);
  const observedCV = calcCVPercent(observedSampleSD, observedMean);
  const observedBias = calcBiasPercent(observedMean, target);
  const targetsDiffer = Math.abs(processCenter - target) > 1e-9;

  // Mode B — manual entry
  const [dataText, setDataText] = useState("98, 100, 101, 99, 102");
  const [showCalc, setShowCalc] = useState(false);
  const parsed = dataText.split(",").map(s => parseFloat(s.trim())).filter(v => !isNaN(v));
  const bMean = calcMean(parsed);
  const bSD = calcSampleSD(parsed);
  const bCV = calcCVPercent(bSD, bMean);

  function onControlChange(setter) {
    return v => { setter(v); setInteracted(true); };
  }
  function resetExperiment() {
    setTarget(PG_DEFAULTS.target);
    setSd(PG_DEFAULTS.sd);
    setBiasPct(PG_DEFAULTS.bias);
  }

  return (
    <div className="screen">
      <h1>Statistics Playground</h1>
      <p className="explain-text">{STATS_PLAYGROUND_EXPLANATION[level]}</p>
      <ScientificBasisNote goto={goto} text="Mean, SD, CV and bias definitions used throughout this module follow standard laboratory-statistics usage; see Evidence for scope and sources." />

      <div className="tabbar" role="tablist" aria-label="Playground mode">
        <button role="tab" aria-selected={mode === "manipulate"} className={"tab" + (mode === "manipulate" ? " tab-active" : "")} onClick={() => setMode("manipulate")}>Mode A — Manipulate a QC Process</button>
        <button role="tab" aria-selected={mode === "enter"} className={"tab" + (mode === "enter" ? " tab-active" : "")} onClick={() => setMode("enter")}>Mode B — Enter Data</button>
      </div>

      {mode === "manipulate" && (
        <div className="playground-grid">
          <div className="controls-col">
            <SliderField id="pg-target" label="Target value" value={target} min={80} max={120} step={1} onChange={onControlChange(setTarget)} hint="Fixed reference; does not move when bias changes." />
            <SliderField id="pg-sd" label="Configured Process SD" value={sd} min={0.5} max={8} step={0.1} onChange={onControlChange(setSd)} hint="The SD parameter used to generate the illustrative dataset." />
            <SliderField id="pg-bias" label="Bias" value={biasPct} min={-10} max={10} step={0.5} onChange={onControlChange(setBiasPct)} suffix="%" signed hint="Moves the Process Centre away from Target; Target itself never moves." />
            <p className="prompt-box">What changed: location, dispersion, or both?</p>
            {level !== "beginner" && (
              <div>
                <button className="btn-link" onClick={() => setShowSampleNote(s => !s)}>{showSampleNote ? "Hide" : "Show"} why sample SD can differ from the process SD</button>
                {showSampleNote && (
                  <div className="calc-panel">
                    <p>The Configured Process SD ({fmt(sd, 2)}) is the parameter used to generate this illustrative dataset. The Observed Sample SD is calculated from only the {basePattern.length} generated points and will not exactly equal the configured parameter — here the fixed base pattern's own sample SD is {fmt(baseSampleSD, 4)}, so the observed sample SD scales to approximately {fmt(baseSampleSD * sd, 2)} at this configured SD. This is an ordinary consequence of estimating a parameter from a finite sample, not an error.</p>
                  </div>
                )}
              </div>
            )}
            <div className="btn-row"><button className="btn-secondary" onClick={resetExperiment}>Reset experiment</button></div>
          </div>
          <div className="viz-col">
            <DistributionView values={rawValues} mean={processCenter} target={target} sd={sd} showBothMarkers={targetsDiffer} />
            <div className="metric-row">
              <MetricCard label="Target value" value={fmt(target, 2)} sub="Fixed reference" />
              <MetricCard label="Process Centre" value={fmt(processCenter, 2)} sub={targetsDiffer ? "Displaced by bias" : "= Target (no bias)"} />
              <MetricCard label="Configured Process SD" value={fmt(sd, 2)} sub="Generating parameter" />
              <MetricCard label="Observed Sample SD" value={fmt(observedSampleSD, 2)} sub={"From " + basePattern.length + " generated points"} />
              <MetricCard label="CV%" value={fmt(observedCV, 2) + "%"} />
              <MetricCard label="Signed Bias%" value={fmtSigned(observedBias, 2) + "%"} tone={Math.abs(observedBias) > 0.05 ? "warn" : "ok"} />
            </div>
          </div>
        </div>
      )}

      {mode === "enter" && (
        <div className="playground-grid">
          <div className="controls-col">
            <label htmlFor="pg-data">Observations (comma-separated)</label>
            <textarea id="pg-data" className="data-textarea" value={dataText} onChange={e => { setDataText(e.target.value); setInteracted(true); }} rows={3} />
            <div className="btn-row">
              <button className="btn-secondary" onClick={() => setDataText("98, 100, 101, 99, 102")}>Reset to example</button>
              <button className="btn-link" onClick={() => setShowCalc(s => !s)}>{showCalc ? "Hide" : "Show"} calculation</button>
            </div>
            {showCalc && (
              <div className="calc-panel">
                <p><strong>n</strong> = {parsed.length}</p>
                <p><strong>Mean</strong> = (Σx) / n = {fmt(bMean, 4)}</p>
                <p><strong>Observed Sample SD</strong> = √(Σ(x − mean)² / (n − 1)) = {fmt(bSD, 4)}</p>
                <p><strong>CV%</strong> = SD / mean × 100 = {fmt(bCV, 4)}%</p>
              </div>
            )}
          </div>
          <div className="viz-col">
            <div className="metric-row">
              <MetricCard label="n" value={parsed.length} />
              <MetricCard label="Mean" value={fmt(bMean, 4)} />
              <MetricCard label="Observed Sample SD" value={fmt(bSD, 4)} sub="Sample SD (n−1)" />
              <MetricCard label="CV%" value={fmt(bCV, 4) + "%"} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------- LJ LABORATORY ---------------------------- */
export const LJ_DATASETS = [
  { key: "stable", label: "Stable process", z: Z_STABLE_A },
  { key: "posshift", label: "Positive shift", z: Z_POS_SHIFT },
  { key: "trendup", label: "Upward trend", z: Z_TREND_UP },
  { key: "scatter", label: "Increased scatter", z: Z_SCATTER }
];
export const LJ_TRUE_MEAN = 100, LJ_TRUE_SD = 2;
export const LJ_DEFAULTS = { assignedMean: 100, assignedSD: 2, datasetKey: "stable", unitMode: "raw" };

export function LJLabScreen({ level, markProgress, goto }) {
  const [assignedMean, setAssignedMean] = useState(LJ_DEFAULTS.assignedMean);
  const [assignedSD, setAssignedSD] = useState(LJ_DEFAULTS.assignedSD);
  const [datasetKey, setDatasetKey] = useState(LJ_DEFAULTS.datasetKey);
  const [unitMode, setUnitMode] = useState(LJ_DEFAULTS.unitMode);
  const [explored, setExplored] = useState(false);

  useEffect(() => { if (explored) markProgress("lj"); }, [explored]);

  const dataset = LJ_DATASETS.find(d => d.key === datasetKey);
  const rawValues = dataset.z.map(z => LJ_TRUE_MEAN + z * LJ_TRUE_SD);
  const points = rawValues.map((raw, i) => ({
    run: i + 1, raw, z: assignedSD > 0 ? (raw - assignedMean) / assignedSD : 0
  }));

  function resetExperiment() {
    setAssignedMean(LJ_DEFAULTS.assignedMean);
    setAssignedSD(LJ_DEFAULTS.assignedSD);
    setDatasetKey(LJ_DEFAULTS.datasetKey);
    setUnitMode(LJ_DEFAULTS.unitMode);
  }

  return (
    <div className="screen">
      <h1>Levey-Jennings Laboratory</h1>
      <p className="explain-text">{LJ_LAB_EXPLANATION[level]}</p>
      <ScientificBasisNote goto={goto} text="Levey-Jennings charting and SD-based control limits are a long-established laboratory QC convention; see Evidence for the statistical QC literature acknowledged here." />

      <div className="dataset-characteristics">
        <h3>Dataset characteristics <span className="muted small">(fixed — not affected by the controls below)</span></h3>
        <div className="metric-row">
          <MetricCard label="Generating centre" value={fmt(LJ_TRUE_MEAN, 0)} sub="Fixed, true value used to create the raw data" />
          <MetricCard label="Generating SD" value={fmt(LJ_TRUE_SD, 0)} sub="Fixed, true value used to create the raw data" />
          <MetricCard label="Dataset" value={dataset.label} sub={points.length + " runs"} />
        </div>
      </div>

      <h3>Chart settings</h3>
      <div className="lj-controls">
        <div className="field">
          <label htmlFor="lj-dataset">Predefined dataset</label>
          <select id="lj-dataset" value={datasetKey} onChange={e => { setDatasetKey(e.target.value); setExplored(true); }}>
            {LJ_DATASETS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
          </select>
        </div>
        <SliderField id="lj-mean" label="Assigned mean used for chart" value={assignedMean} min={92} max={108} step={0.5} onChange={v => { setAssignedMean(v); setExplored(true); }} />
        <SliderField id="lj-sd" label="Assigned SD used for chart" value={assignedSD} min={0.5} max={6} step={0.1} onChange={v => { setAssignedSD(v); setExplored(true); }} />
        <div className="field">
          <span className="field-row-label">Display units</span>
          <div className="segmented" role="tablist" aria-label="Unit mode">
            <button role="tab" aria-selected={unitMode === "raw"} className={"seg" + (unitMode === "raw" ? " seg-active" : "")} onClick={() => setUnitMode("raw")}>Raw units</button>
            <button role="tab" aria-selected={unitMode === "sd"} className={"seg" + (unitMode === "sd" ? " seg-active" : "")} onClick={() => setUnitMode("sd")}>SD units / z-score</button>
          </div>
        </div>
      </div>
      <div className="btn-row"><button className="btn-secondary" onClick={resetExperiment}>Reset experiment</button></div>

      <LJChart points={points} mean={assignedMean} sd={assignedSD} unitMode={unitMode} decimals={2} />

      <div className="callout">
        <strong>Teaching note.</strong> The underlying raw QC observations above were generated once, from the fixed generating centre and generating SD shown in Dataset Characteristics. Only the <em>chart settings</em> — the assigned mean and assigned SD — change when you move the sliders above; the raw observations themselves never change. Notice how setting an assigned SD that differs from the data's generating SD makes ordinary points appear artificially close to, or far from, the control limits — this is why inappropriate SD estimates distort QC interpretation, even though nothing about the underlying process changed.
      </div>
      {(level === "advanced" || level === "expert") && (
        <div className="callout callout-advanced">
          <strong>{LEVEL_LABELS[level]} note.</strong> Laboratory-established statistics are usually derived from historical QC data collected over a defined period. Inappropriately widening or narrowing control limits — whether from a poor historical estimate or a deliberate but unjustified adjustment — changes the sensitivity of the entire QC procedure without any real change in the analytical process. A full policy recommendation for setting and reviewing QC statistics is outside the scope of this v0.1.x build.
        </div>
      )}
    </div>
  );
}

/* ---------------------------- PATTERN CHALLENGE ---------------------------- */
export function PatternChallengeScreen({ level, markProgress }) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // id -> {pattern, broad, confidence, nextStep, submitted}
  const scenario = SCENARIOS[idx];
  const ans = answers[scenario.id] || {};

  const allSubmitted = SCENARIOS.every(s => answers[s.id] && answers[s.id].submitted);
  useEffect(() => { if (allSubmitted) markProgress("pattern"); }, [allSubmitted]);

  const points = scenario.zScores.map((z, i) => ({ run: i + 1, raw: z, z: z }));

  function updateAns(patch) {
    setAnswers(a => ({ ...a, [scenario.id]: { ...ans, ...patch } }));
  }
  function submit() {
    if (!ans.pattern || !ans.broad || !ans.confidence) return;
    updateAns({ submitted: true });
  }

  const patternScore = SCENARIOS.reduce((acc, s) => {
    const a = answers[s.id];
    return acc + (a && a.submitted && a.pattern === s.patternClass ? 1 : 0);
  }, 0);
  const reasoningScore = SCENARIOS.reduce((acc, s) => {
    const a = answers[s.id];
    return acc + (a && a.submitted && a.broad === s.broadBehaviour ? 1 : 0);
  }, 0);
  const attemptedCount = SCENARIOS.filter(s => answers[s.id] && answers[s.id].submitted).length;
  const wasCorrect = ans.submitted && ans.pattern === scenario.patternClass && ans.broad === scenario.broadBehaviour;

  return (
    <div className="screen">
      <h1>QC Pattern Challenge</h1>
      <p className="muted">Ten deterministic scenarios. Inspect each chart, commit to an interpretation, then review the reasoning behind the most appropriate answer. A visual pattern is never presented here as proof of a specific root cause. This exercise recognises visual patterns only — it does not run a formal statistical control-rule (Westgard-style multirule) engine.</p>

      <div className="challenge-nav">
        {SCENARIOS.map((s, i) => (
          <button key={s.id} className={"case-chip" + (i === idx ? " case-chip-active" : "") + (answers[s.id] && answers[s.id].submitted ? " case-chip-done" : "")}
            onClick={() => setIdx(i)} aria-current={i === idx}>{s.id}</button>
        ))}
      </div>

      <div className="case-panel">
        <h2>Case {scenario.id} of {SCENARIOS.length}</h2>
        <LJChart points={points} mean={0} sd={1} unitMode="sd" eventAnnotation={scenario.eventAnnotation} decimals={2} />

        <div className="question-block">
          <p className="q-prompt">Question 1 — What pattern is most evident?</p>
          <div className="option-list option-list-grid">
            {PATTERN_OPTIONS.map(o => (
              <button key={o.id} disabled={ans.submitted}
                className={"option-btn small" + (ans.pattern === o.id ? " option-selected" : "")}
                onClick={() => updateAns({ pattern: o.id })}>{o.label}</button>
            ))}
          </div>
        </div>

        <div className="question-block">
          <p className="q-prompt">Question 2 — What broad analytical behaviour is most consistent with the visual pattern?</p>
          <div className="option-list option-list-grid">
            {BROAD_OPTIONS.map(o => (
              <button key={o.id} disabled={ans.submitted}
                className={"option-btn small" + (ans.broad === o.id ? " option-selected" : "")}
                onClick={() => updateAns({ broad: o.id })}>{o.label}</button>
            ))}
          </div>
        </div>

        <div className="question-block">
          <p className="q-prompt">Question 3 — How confident are you in this interpretation?</p>
          <div className="option-list option-list-grid option-list-narrow">
            {CONFIDENCE_OPTIONS.map(o => (
              <button key={o.id} disabled={ans.submitted}
                className={"option-btn small" + (ans.confidence === o.id ? " option-selected" : "")}
                onClick={() => updateAns({ confidence: o.id })}>{o.label}</button>
            ))}
          </div>
          <p className="muted small">Confidence is recorded for reflection only — it does not change your pattern-recognition or analytical-reasoning score.</p>
        </div>

        {(level === "advanced" || level === "expert") && (
          <div className="question-block">
            <p className="q-prompt">Question 4 — What should you do next?</p>
            <div className="option-list">
              {NEXT_STEP_OPTIONS.map(o => (
                <button key={o.id} disabled={ans.submitted}
                  className={"option-btn" + (ans.nextStep === o.id ? " option-selected" : "")}
                  onClick={() => updateAns({ nextStep: o.id })}>{o.text}</button>
              ))}
            </div>
          </div>
        )}

        {scenario.causalityCheck && (level === "advanced" || level === "expert") && (
          <div className="question-block">
            <p className="q-prompt">Is the temporal association with the recorded event, by itself, sufficient to prove causality?</p>
            <div className="option-list">
              <button disabled={ans.submitted} className={"option-btn" + (ans.causality === "no" ? " option-selected" : "")} onClick={() => updateAns({ causality: "no" })}>No — it strengthens the hypothesis, but requires investigation</button>
              <button disabled={ans.submitted} className={"option-btn" + (ans.causality === "yes" ? " option-selected" : "")} onClick={() => updateAns({ causality: "yes" })}>Yes — temporal association is proof of cause</button>
            </div>
          </div>
        )}

        {!ans.submitted ? (
          <button className="btn-primary" onClick={submit} disabled={!ans.pattern || !ans.broad || !ans.confidence}>Commit interpretation</button>
        ) : (
          <div className="feedback-panel">
            <h3>Feedback</h3>
            <p><strong>Your interpretation:</strong> {PATTERN_OPTIONS.find(o => o.id === ans.pattern).label} / {BROAD_OPTIONS.find(o => o.id === ans.broad).label}</p>
            <p><strong>Most appropriate interpretation:</strong> {PATTERN_OPTIONS.find(o => o.id === scenario.patternClass).label} / {BROAD_OPTIONS.find(o => o.id === scenario.broadBehaviour).label}</p>
            <p><strong>Why:</strong> {getPatternFeedback(scenario.patternClass, level)}</p>
            {scenario.caution && <p className="callout-inline">{scenario.caution}</p>}
            <p><strong>What this DOES tell you:</strong> {scenario.whatItShows}</p>
            <p><strong>What this DOES NOT prove:</strong> {scenario.whatItDoesNotProve}</p>
            <p><strong>On your confidence:</strong> {getConfidenceNote(ans.confidence, wasCorrect)}</p>
            {(level === "advanced" || level === "expert") && (
              <p><strong>Reasonable next step:</strong> {NEXT_STEP_OPTIONS.find(o => o.id === scenario.recommendedNextStep).text} <span className="muted small">{NEXT_STEP_TEXT_BY_LEVEL[level]}</span></p>
            )}
            {scenario.causalityCheck && (level === "advanced" || level === "expert") && (
              <p><strong>On causality:</strong> No — temporal association strengthens the hypothesis that the recorded event contributed to the change, but it does not by itself prove causality. Other explanations must be excluded through investigation.</p>
            )}
            <div className="btn-row">
              {idx < SCENARIOS.length - 1 && <button className="btn-secondary" onClick={() => setIdx(idx + 1)}>Next case</button>}
              {idx > 0 && <button className="btn-link" onClick={() => setIdx(idx - 1)}>Previous case</button>}
            </div>
          </div>
        )}
      </div>

      <div className="score-summary">
        <h3>Session score ({attemptedCount} / {SCENARIOS.length} attempted)</h3>
        <div className="metric-row">
          <MetricCard label="Pattern recognition" value={patternScore + " / " + SCENARIOS.length} />
          <MetricCard label="Analytical reasoning" value={reasoningScore + " / " + SCENARIOS.length} />
        </div>
        {allSubmitted && (
          <p className="muted">All cases attempted for this session. This score reflects a short prototype exercise and is not a competency certification.</p>
        )}
      </div>
    </div>
  );
}

/* ---------------------------- SIGMA SANDBOX ---------------------------- */
export const SG_DEFAULTS = { tea: 10, bias: 2, cv: 2, specA: 10, specB: 6 };

export function SigmaSandboxScreen({ level, markProgress, goto }) {
  const [tea, setTea] = useState(SG_DEFAULTS.tea);
  const [bias, setBias] = useState(SG_DEFAULTS.bias);
  const [cv, setCv] = useState(SG_DEFAULTS.cv);
  const sigma = calcSigma(tea, bias, cv);

  const [specA, setSpecA] = useState(SG_DEFAULTS.specA);
  const [specB, setSpecB] = useState(SG_DEFAULTS.specB);
  const [exerciseTouched, setExerciseTouched] = useState(false);
  useEffect(() => { if (exerciseTouched) markProgress("sigma"); }, [exerciseTouched]);
  const lockedBias = 2, lockedCV = 2;
  const sigA = calcSigma(specA, lockedBias, lockedCV);
  const sigB = calcSigma(specB, lockedBias, lockedCV);

  function resetExperiment() {
    setTea(SG_DEFAULTS.tea); setBias(SG_DEFAULTS.bias); setCv(SG_DEFAULTS.cv);
    setSpecA(SG_DEFAULTS.specA); setSpecB(SG_DEFAULTS.specB);
  }

  return (
    <div className="screen">
      <h1>Sigma Sandbox</h1>
      <p className="muted">This module explores a <strong>simplified total-error Sigma model</strong>: Sigma = (TEa% − |Bias%|) / CV%. It is not a universal definition of analytical quality — see the interpretation note below.</p>
      <ScientificBasisNote goto={goto} text="The TEa-based Sigma model shown here is one simplified framework among several used in analytical quality management; see Evidence for the Milan APS framework and related literature." />

      <div className="playground-grid">
        <div className="controls-col">
          <div className="field">
            <label htmlFor="sg-tea">Selected allowable total error specification (TEa, %)</label>
            <div className="field-hint field-hint-block">Illustrative teaching value — not a universally accepted specification for any real analyte.</div>
          </div>
          <SliderField id="sg-tea" label="TEa" value={tea} min={2} max={25} step={0.5} onChange={setTea} suffix="%" />
          <SliderField id="sg-bias" label="Bias" value={bias} min={-15} max={15} step={0.5} onChange={setBias} suffix="%" signed />
          <SliderField id="sg-cv" label="CV" value={cv} min={0.2} max={10} step={0.1} onChange={setCv} suffix="%" />
          <div className="btn-row"><button className="btn-secondary" onClick={resetExperiment}>Reset experiment</button></div>
        </div>
        <div className="viz-col">
          <div className={"sigma-display" + (!sigma.valid ? " sigma-invalid" : sigma.value < 0 ? " sigma-negative" : "")}>
            <div className="sigma-label">Calculated Sigma</div>
            <div className="sigma-value">{sigma.valid ? sigma.value.toFixed(2) : "—"}</div>
          </div>
          <p className="info-note">Signed bias ({fmtSigned(bias, 1)}%) indicates direction; the simplified Sigma calculation above uses the <strong>magnitude</strong> of bias (|{fmtSigned(bias, 1)}%| = {Math.abs(bias).toFixed(1)}%).</p>
          {sigma.warning && <p className="warn-box">{sigma.warning}</p>}
          <ul className="mini-explain-list">
            <li><strong>Change CV:</strong> reducing imprecision generally increases calculated Sigma when other inputs are unchanged.</li>
            <li><strong>Change Bias:</strong> increasing bias magnitude (in either direction, positive or negative) reduces calculated Sigma.</li>
            <li><strong>Change TEa / APS:</strong> a more stringent allowable error reduces calculated Sigma even though the analytical method itself has not changed.</li>
          </ul>
        </div>
      </div>

      <section className="exercise-block">
        <h2>Exercise — same assay, different requirement</h2>
        <p className="muted">Bias and CV are held constant at {lockedBias}% and {lockedCV}% (illustrative example only). Compare two different allowable-error specifications.</p>
        <div className="compare-grid">
          <div className="compare-col">
            <label htmlFor="sg-specA">Specification A — TEa (illustrative)</label>
            <input id="sg-specA" type="number" className="num-input" value={specA} min={2} max={25} step={0.5}
              onChange={e => { setSpecA(parseFloat(e.target.value)); setExerciseTouched(true); }} />
            <div className="sigma-display small">Sigma A = {sigA.valid ? sigA.value.toFixed(2) : "—"}</div>
          </div>
          <div className="compare-col">
            <label htmlFor="sg-specB">Specification B — TEa (illustrative)</label>
            <input id="sg-specB" type="number" className="num-input" value={specB} min={2} max={25} step={0.5}
              onChange={e => { setSpecB(parseFloat(e.target.value)); setExerciseTouched(true); }} />
            <div className="sigma-display small">Sigma B = {sigB.valid ? sigB.value.toFixed(2) : "—"}</div>
          </div>
        </div>
        <p className="prompt-box">The analyser did not change. Why did Sigma change?</p>
        <p className="callout">Sigma in this framework is performance relative to the selected analytical requirement. It is not an immutable intrinsic property of the analyser.</p>
      </section>

      <details className="important-note">
        <summary>Important interpretation note</summary>
        <ul>
          {SIGMA_CAUTION_POINTS.map((p, i) => <li key={i}>{p}</li>)}
        </ul>
        <p className="muted small">This application does not classify any Sigma value as universally "acceptable" or "unacceptable," and does not use colour-coded traffic-light categories for Sigma. Whether a given Sigma value is adequate depends on the selected specification, the QC design in use, and clinical context.</p>
      </details>
    </div>
  );
}

/* ---------------------------- EVIDENCE ---------------------------- */
export function EvidenceScreen() {
  return (
    <div className="screen">
      <h1>Evidence & Scientific Basis</h1>
      <p className="muted">This prototype draws on established concepts in analytical quality control. It does not reproduce copyrighted figures or standard text, and does not claim to ensure compliance with any specific standard. For each source below: what it informs in this application, and — just as importantly — what this application does not claim from it.</p>

      <p className="callout small">{EVIDENCE_HIERARCHY_AUTHORITY_NOTE}</p>

      {EVIDENCE_TIERS.map(tier => {
        const sources = EVIDENCE_SOURCES.filter(src => src.tier === tier.id);
        if (!sources.length) return null;
        return (
          <section className="evidence-tier-group" key={tier.id}>
            <h2>{tier.label}</h2>
            <p className="muted small">{tier.description}</p>
            {sources.map(src => (
              <div className="evidence-item" key={src.name}>
                <div className="evidence-head">
                  <h3>{src.name}</h3>
                  {src.version && <span className="evidence-version">{src.version}</span>}
                </div>
                <dl className="evidence-fields">
                  <dt>What it informs in this application</dt>
                  <dd>{src.informs}</dd>
                  <dt>What this application does NOT claim</dt>
                  <dd>{src.notClaimed}</dd>
                </dl>
                {src.link && <a className="evidence-link" href={src.link} target="_blank" rel="noopener noreferrer">{src.linkLabel || src.link} ↗</a>}
              </div>
            ))}
          </section>
        );
      })}

      <div className="callout">
        A dedicated, separately engineered and separately tested statistical QC rule engine (1<sub>2s</sub>, 1<sub>3s</sub>, 2<sub>2s</sub>, R<sub>4s</sub>, 4<sub>1s</sub>, 10x, and — added in v0.3.1 — 8x) is implemented in the Rule Laboratory, added in v0.2 and extended in v0.3.1. The QC Strategy Lab, added in v0.3, implements a named, cited Sigma-guided QC-procedure mapping framework and a validated Ped/Pfr calculation restricted to the single 1<sub>3s</sub> rule only (see QC Strategy Lab → Sigma Laboratory for scope and assumptions) — this restriction applies equally to 8x and 10x, whether used alone or in any multirule combination. As of v0.3.1, Procedure D's &lt;4-Sigma candidate uses a dedicated, independently validated 8x detector rather than substituting the previously-implemented 10x rule. The Risk &amp; Frequency Lab, added in v0.4, extends the same restricted validation boundary to detection-delay modelling: a separately engineered and separately tested geometric "expected QC events/patient samples to detection" model is implemented for the single 1<sub>3s</sub> rule only, and Parvin's patient-risk concept (MaxE(Nuf)) is introduced conceptually, with an explicit refusal to calculate it numerically until further validated assumptions are established. The Investigation Lab, added in v0.5, implements a deterministic, scenario-authored out-of-control-investigation and patient-result-impact reasoning framework (status models, a 13-case Recovery Challenge bank, and absolute/relative patient-result difference calculations) — evidence and outcomes are authored per scenario, not computed by any causal-inference, root-cause-scoring, or AI-generation engine. The External Assurance Lab, added in v0.6, implements a deterministic, scenario-authored EQA/PT, commutability, Scheme Capability Profile, and simplified Comparability Lab reasoning framework (a 14-case External Assurance Challenge Bank, target-value-type and commutability-status models, and paired-difference/z-score calculations) — it deliberately does <strong>not</strong> connect to any live EQA/PT provider or real provider data, does not implement an ISO 13528 statistical engine, does not implement Passing-Bablok, Deming regression, or Bland-Altman limits of agreement, does not query any reference-measurement-procedure database or the JCTLM API, and never automatically recalls, holds, amends, or reissues a patient result from an EQA event. It deliberately does <strong>not</strong> include a general Ped/Pfr simulator for multirule procedures, OPSpecs charts, a general MaxE(Nuf) or patient-harm-probability calculator, patient-risk Sigma, PBRTQC, EWMA, CUSUM, automated root-cause diagnosis, real patient-data upload, LIS/analyser integration, automatic patient-result correction, automated clinician notification, a universal patient-harm calculator, measurement uncertainty, RCV, biological-variation modelling, an AI tutor, or user accounts/analytics — those remain planned for a later development phase. The BV &amp; RCV Lab, added in v0.7, implements a deterministic, scenario-authored biological-variation, analytical-performance-specification-from-biological-variation, and reference-change-value reasoning framework (a small fixed educational biological-variation dataset with stated provenance, a classical symmetric RCV model, a separately named log-normal asymmetric RCV model, an index-of-individuality calculation, and a 16-case Serial Result Challenge Bank) — it deliberately does <strong>not</strong> query the live EFLM Biological Variation Database or scrape biologicalvariation.eu, does not estimate CVA/CVI/CVG from raw data using ANOVA, CV-ANOVA, or Bayesian methods, does not implement an automated BIVAC scoring engine, does not predict disease-specific or personalised/AI-derived biological variation, does not generate a universal clinical decision threshold or an automated delta-check engine, and does not implement measurement uncertainty or full/indirect/patient-specific reference-interval generation. It deliberately does <strong>not</strong> include LIS/analyser integration, real patient-data upload, PBRTQC, EWMA, CUSUM, an AI tutor, user accounts, certification, or faculty analytics — those remain planned for a later development phase. The Patient Surveillance Lab, added in v0.8, implements a deterministic, scenario-authored patient-based real-time quality control (PBRTQC) reasoning framework — three numerically implemented sliding algorithms (moving mean, moving median, EWMA), a seven-step processing pipeline with error injection applied before truncation, hard-exclusion truncation, NPed/ANPed detection-delay metrics with explicit undetected-trial handling, a pointwise false-flag rate on a designated stable verification stream, and an 18-case PBRTQC Challenge Bank — built entirely on small, deterministic, synthetic patient populations, never real or live patient data. It deliberately does <strong>not</strong> implement CUSUM, a general moving-SD engine, moving delta checks, a moving-sum-of-outliers engine, a moving-percentile engine, Box-Cox transformation, winsorisation, automated parameter optimisation, machine learning of any kind, RARTQC, real patient-data upload, LIS/analyser connectivity, automatic patient-result hold/auto-release, clinical notification, automated root-cause diagnosis, real-time production monitoring, PBRTQC certification, user accounts, or faculty analytics — those remain out of scope or planned for a later development phase. It reuses no calculation logic from the BV &amp; RCV Lab or the Risk &amp; Frequency Lab's patient-risk engine, and never reuses the symbol N (QC measurements per run) for PBRTQC window size, using W throughout instead.
      </div>

      <section className="ongoing-discussion">
        <h2>Areas of ongoing discussion</h2>
        <p className="muted">Several topics touched on by this application — especially in the QC Strategy Lab — are areas where methodology and professional guidance may reasonably differ, not settled doctrine. The educational objective here is critical appraisal, not a verdict.</p>
        <ul className="mini-explain-list">
          {ONGOING_DISCUSSION_AREAS.map((a, i) => <li key={i}>{a}</li>)}
        </ul>
      </section>
    </div>
  );
}

/* ---------------------------- GLOSSARY / ABOUT (modal content) ---------------------------- */
export function GlossaryModal({ onClose }) {
  return (
    <Modal title="Glossary" onClose={onClose}>
      <dl className="glossary-list">
        {GLOSSARY.map(g => (
          <div key={g.term} className="glossary-item">
            <dt>{g.term}</dt>
            <dd>{g.def}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}

export function AboutModal({ onClose }) {
  return (
    <Modal title="About this prototype" onClose={onClose}>
      <p>{ABOUT_TEXT}</p>
      <p className="muted small">Version 0.8 — PBRTQC &amp; Patient Surveillance. No login, analytics, external data connections, or AI-generated tutoring are used within this application. All calculations run locally and deterministically.</p>
    </Modal>
  );
}
