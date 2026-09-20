/* =========================================================================
   app/qc-materials/screens.jsx — QC-03: QC Materials & Control Statistics
   PROVENANCE: V09_NEW (pre-release content closure)

   A five-station interactive module completing the QC-01 -> QC-12
   learner-visible competency pathway. Mounted as an INTERNAL screen
   (route "qc-materials", hash #/qc-materials) — deliberately NOT a
   15th primary navigation destination and NOT a 12th globally
   progress-tracked laboratory (Sections 3-4). Local session state only
   tracks the learner's progress through this module's own stations and
   the final learning check; it never writes to the app's global
   11-laboratory progress model.

   Reuses the accepted central statistics functions (calcMean,
   calcSampleSD, calcCVPercent, fmt) — no second competing
   implementation — and the existing shared UI components (MetricCard,
   LJChart, ScientificBasisNote, Badge) and CSS classes (tabbar, tab,
   calc-panel, option-list, option-btn, prompt-box, btn-primary,
   btn-secondary, btn-link) already used throughout the application.
   ========================================================================= */
import { useState } from "react";
import { calcMean, calcSampleSD, calcCVPercent, fmt } from "../core/statistics.js";
import { Badge, LJChart, MetricCard, ScientificBasisNote } from "../ui/shared-components.jsx";
import {
  QC03_TITLE, QC03_INTRO, QC03_LEVEL_TEXT,
  QC03_CLASSIFICATION_ITEMS, QC03_CLASSIFICATION_OPTIONS, QC03_COMPARISON_CARDS, QC03_MATRIX_CAUTION,
  QC03_HANDLING_HEADING, QC03_HANDLING_FACTORS, QC03_HANDLING_DOCTRINE, QC03_HANDLING_SYNTHETIC_EXAMPLE,
  QC03_ESTABLISH_DATASET, QC03_ESTABLISH_UNIT, QC03_ESTABLISH_NOTE,
  QC03_OUTLIER_FULL_DATASET, QC03_OUTLIER_JUSTIFIED_DATASET, QC03_OUTLIER_CONSPICUOUS_VALUE,
  QC03_OUTLIER_CHOICES, QC03_OUTLIER_DOCUMENTED_EVIDENCE, QC03_OUTLIER_JUSTIFICATION_STATEMENT,
  QC03_SD_DEMO_MEAN, QC03_SD_DEMO_FUTURE_RAW, QC03_SD_SCENARIOS, QC03_SD_EXPLANATION, QC03_CONTROL_LIMIT_VS_APS,
  QC03_OLD_LOT_DATASET, QC03_NEW_LOT_DATASET, QC03_LOT_CHOICES, QC03_LOT_CONCLUSION,
  QC03_LEARNING_CHECK,
} from "./data.js";

const STATIONS = [
  { key: "station1", label: "1. Know Your Control Material" },
  { key: "station2", label: "2. Establish the Statistics" },
  { key: "station3", label: "3. Investigate Before Excluding" },
  { key: "station4", label: "4. See What the SD Does" },
  { key: "station5", label: "5. New Lot, New Question" },
  { key: "check", label: "Learning Check" },
];

export function QCMaterialsScreen({ level, goto }) {
  const [stationIdx, setStationIdx] = useState(0);
  const station = STATIONS[stationIdx].key;
  const levelText = QC03_LEVEL_TEXT[level] || QC03_LEVEL_TEXT.beginner;

  return (
    <div className="screen" data-testid="qc-materials-screen">
      <h1>{QC03_TITLE}</h1>
      <p className="muted">QC-03 &middot; Stage: Understand</p>
      <p className="explain-text">{QC03_INTRO}</p>
      <ScientificBasisNote goto={goto} text="Internal QC material practice draws on ISO 15189 and established laboratory-medicine internal-QC recommendations; see Evidence for the full acknowledged source list. This module does not reproduce copyrighted standard text." />

      {/* Visual polish P1-9: station progression is presentational only.
          "done"/"current"/"upcoming" are derived purely from the existing
          stationIdx — there is no second source of truth, no persistence,
          no write to the global 11-lab progress model, and no competency
          state. Every station remains freely selectable, and role="tab" /
          aria-selected semantics are unchanged. */}
      <div className="tabbar qc03-stationbar" role="tablist" aria-label="QC-03 stations">
        {STATIONS.map((s, i) => (
          <button key={s.key} role="tab" aria-selected={stationIdx === i}
            className={"tab qc03-station" + (stationIdx === i ? " tab-active qc03-station-current" : (i < stationIdx ? " qc03-station-done" : " qc03-station-upcoming"))}
            onClick={() => setStationIdx(i)}>
            <span className="qc03-station-label">{s.label}</span>
          </button>
        ))}
      </div>
      <p className="qc03-position muted small" data-testid="qc03-position">
        Station {stationIdx + 1} of {STATIONS.length}
      </p>

      {station === "station1" && <Station1 levelText={levelText.station1} />}
      {station === "station2" && <Station2 levelText={levelText.station2} />}
      {station === "station3" && <Station3 levelText={levelText.station3} />}
      {station === "station4" && <Station4 levelText={levelText.station4} />}
      {station === "station5" && <Station5 levelText={levelText.station5} />}
      {station === "check" && <LearningCheck />}

      <div className="btn-row" style={{ marginTop: 24, justifyContent: "space-between" }}>
        <button className="btn-secondary" onClick={() => goto("stats")}>&larr; Previous: Statistics Playground</button>
        <div className="btn-row">
          {stationIdx > 0 && <button className="btn-secondary" onClick={() => setStationIdx(i => i - 1)}>&larr; Previous station</button>}
          {stationIdx < STATIONS.length - 1 && <button className="btn-primary" onClick={() => setStationIdx(i => i + 1)}>Next station &rarr;</button>}
        </div>
        <button className="btn-secondary" onClick={() => goto("lj")}>Next: Levey‑Jennings Laboratory &rarr;</button>
      </div>
    </div>
  );
}

/* ---------------------------- STATION 1 ---------------------------- */
function Station1({ levelText }) {
  const [answers, setAnswers] = useState({});
  function answer(itemId, key) {
    setAnswers(a => ({ ...a, [itemId]: key }));
  }
  return (
    <div data-testid="qc03-station1">
      <p className="explain-text">{levelText}</p>
      <h2>Classify each example</h2>
      <div className="option-list">
        {QC03_CLASSIFICATION_ITEMS.map(item => {
          const chosen = answers[item.id];
          return (
            <div key={item.id} className="calc-panel-prose">
              <p>{item.text}</p>
              <div className="option-list-grid">
                {QC03_CLASSIFICATION_OPTIONS.map(opt => (
                  <button key={opt.key} type="button"
                    className={"option-btn" + (chosen === opt.key ? " option-selected" : "")}
                    onClick={() => answer(item.id, opt.key)}>{opt.label}</button>
                ))}
              </div>
              {chosen && (
                <p className="prompt-box" role="status">
                  {chosen === item.correct ? "Correct. " : "Not quite. "}{item.explain}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <h2>Assayed / third-party / multi-level</h2>
      <div className="option-list">
        {QC03_COMPARISON_CARDS.map(card => (
          <div key={card.title} className="calc-panel-prose">
            <h3>{card.title}</h3>
            <div className="qc03-compare">
              <div className="qc03-compare-side">
                <strong>{card.left.label}</strong>{card.left.text}
              </div>
              <div className="qc03-compare-side">
                <strong>{card.right.label}</strong>{card.right.text}
              </div>
            </div>
            <p className="info-note">{card.caution}</p>
          </div>
        ))}
      </div>
      <p className="callout">{QC03_MATRIX_CAUTION}</p>

      <h2>{QC03_HANDLING_HEADING}</h2>
      <div className="calc-panel-prose" data-testid="qc03-handling-doctrine">
        <p>{QC03_HANDLING_DOCTRINE}</p>
        <ul>
          {QC03_HANDLING_FACTORS.map(f => <li key={f}>{f}</li>)}
        </ul>
        <p className="prompt-box">{QC03_HANDLING_SYNTHETIC_EXAMPLE}</p>
      </div>
    </div>
  );
}

/* ---------------------------- STATION 2 ---------------------------- */
function Station2({ levelText }) {
  const [showCalc, setShowCalc] = useState(false);
  const data = QC03_ESTABLISH_DATASET;
  const mean = calcMean(data), sd = calcSampleSD(data), cv = calcCVPercent(sd, mean);
  return (
    <div data-testid="qc03-station2">
      <p className="explain-text">{levelText}</p>
      <h2>Repeated results for one QC material lot ({QC03_ESTABLISH_UNIT})</h2>
      <p className="calc-panel">{data.join(", ")}</p>
      <div className="metric-row">
        <MetricCard label="n" value={String(data.length)} />
        <MetricCard label="Mean" value={fmt(mean, 2)} />
        <MetricCard label="Sample SD (n\u22121)" value={fmt(sd, 4)} />
        <MetricCard label="CV%" value={fmt(cv, 4) + "%"} />
      </div>
      <button className="btn-secondary" onClick={() => setShowCalc(v => !v)}>{showCalc ? "Hide calculation" : "Show calculation"}</button>
      {showCalc && (
        <div className="calc-panel" data-testid="qc03-station2-calc">
          <p>Mean = \u03a3x / n = ({data.join(" + ")}) / {data.length} = {fmt(mean, 4)}</p>
          <p>Sample SD = \u221a[ \u03a3(x \u2212 mean)\u00b2 / (n \u2212 1) ] = {fmt(sd, 4)} (uses n\u22121, never population SD)</p>
          <p>CV% = SD / mean \u00d7 100 = {fmt(cv, 4)}%</p>
        </div>
      )}
      <p className="prompt-box">{QC03_ESTABLISH_NOTE}</p>
    </div>
  );
}

/* ---------------------------- STATION 3 ---------------------------- */
function Station3({ levelText }) {
  const [choice, setChoice] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const fullMean = calcMean(QC03_OUTLIER_FULL_DATASET), fullSD = calcSampleSD(QC03_OUTLIER_FULL_DATASET);
  const justMean = calcMean(QC03_OUTLIER_JUSTIFIED_DATASET), justSD = calcSampleSD(QC03_OUTLIER_JUSTIFIED_DATASET);
  return (
    <div data-testid="qc03-station3">
      <p className="explain-text">{levelText}</p>
      <h2>An unusual result appears</h2>
      <p className="calc-panel">{QC03_OUTLIER_FULL_DATASET.join(", ")} <span className="muted small">(the {QC03_OUTLIER_CONSPICUOUS_VALUE} is the conspicuous result)</span></p>
      <p className="prompt-box">Would you exclude this result?</p>
      <div className="option-list">
        {QC03_OUTLIER_CHOICES.map(c => (
          <button key={c.key} type="button"
            className={"option-btn" + (choice === c.key ? " option-selected" : "")}
            onClick={() => setChoice(c.key)}>{c.label}</button>
        ))}
      </div>
      {choice && (
        <div data-testid="qc03-station3-feedback">
          {choice === "investigate" ? (
            <>
              <p className="prompt-box" role="status">Correct approach. Investigate first \u2014 revealing what was documented:</p>
              <p className="callout">{QC03_OUTLIER_DOCUMENTED_EVIDENCE}</p>
              {!revealed && <button className="btn-primary" onClick={() => setRevealed(true)}>Compare statistics before/after justified exclusion</button>}
            </>
          ) : (
            <p className="prompt-box" role="status">Not the recommended approach. Numerical extremeness alone is never sufficient justification for exclusion \u2014 and an unconditional \u201cnever exclude\u201d rule ignores genuinely documented preparation errors. Try \u201cInvestigate\u2026\u201d instead.</p>
          )}
        </div>
      )}
      {revealed && (
        <div data-testid="qc03-station3-comparison">
          <div className="metric-row">
            <MetricCard label="All observations \u2014 mean" value={fmt(fullMean, 4)} />
            <MetricCard label="All observations \u2014 sample SD" value={fmt(fullSD, 4)} />
            <MetricCard label="After justified exclusion \u2014 mean" value={fmt(justMean, 4)} />
            <MetricCard label="After justified exclusion \u2014 sample SD" value={fmt(justSD, 4)} />
          </div>
          <p className="prompt-box">{QC03_OUTLIER_JUSTIFICATION_STATEMENT}</p>
        </div>
      )}
    </div>
  );
}

/* ---------------------------- STATION 4 ---------------------------- */
function Station4({ levelText }) {
  const [scenarioKey, setScenarioKey] = useState(QC03_SD_SCENARIOS[0].key);
  const scenario = QC03_SD_SCENARIOS.find(s => s.key === scenarioKey);
  const points = QC03_SD_DEMO_FUTURE_RAW.map((raw, i) => ({
    run: i + 1, raw, z: scenario.sd > 0 ? (raw - QC03_SD_DEMO_MEAN) / scenario.sd : 0,
  }));
  return (
    <div data-testid="qc03-station4">
      <p className="callout" data-testid="qc03-control-limit-vs-aps">{QC03_CONTROL_LIMIT_VS_APS}</p>
      <p className="explain-text">{levelText}</p>
      <h2>Same future results, different SD</h2>
      <div className="tabbar" role="tablist" aria-label="SD scenario">
        {QC03_SD_SCENARIOS.map(s => (
          <button key={s.key} role="tab" aria-selected={scenarioKey === s.key}
            className={"tab" + (scenarioKey === s.key ? " tab-active" : "")}
            onClick={() => setScenarioKey(s.key)}>{s.label} (SD={fmt(s.sd, 2)})</button>
        ))}
      </div>
      <LJChart points={points} mean={QC03_SD_DEMO_MEAN} sd={scenario.sd} unitMode="sd" decimals={2} />
      <p className="prompt-box">{QC03_SD_EXPLANATION}</p>
    </div>
  );
}

/* ---------------------------- STATION 5 ---------------------------- */
function Station5({ levelText }) {
  const [choice, setChoice] = useState(null);
  const oldMean = calcMean(QC03_OLD_LOT_DATASET), oldSD = calcSampleSD(QC03_OLD_LOT_DATASET), oldCV = calcCVPercent(oldSD, oldMean);
  const newMean = calcMean(QC03_NEW_LOT_DATASET), newSD = calcSampleSD(QC03_NEW_LOT_DATASET), newCV = calcCVPercent(newSD, newMean);
  return (
    <div data-testid="qc03-station5">
      <p className="explain-text">{levelText}</p>
      <h2>A new QC material lot arrives</h2>
      <p className="prompt-box">What should you do?</p>
      <div className="option-list">
        {QC03_LOT_CHOICES.map(c => (
          <button key={c.key} type="button"
            className={"option-btn" + (choice === c.key ? " option-selected" : "")}
            onClick={() => setChoice(c.key)}>{c.label}</button>
        ))}
      </div>
      {choice && (
        <div data-testid="qc03-station5-result">
          <p className="prompt-box" role="status">{choice === "evaluate" ? "Correct approach." : "Not the recommended approach."}</p>
          <div className="metric-row">
            <MetricCard label="Old lot mean" value={fmt(oldMean, 2)} sub={"SD " + fmt(oldSD, 4) + " / CV " + fmt(oldCV, 4) + "%"} />
            <MetricCard label="New lot mean" value={fmt(newMean, 2)} sub={"SD " + fmt(newSD, 4) + " / CV " + fmt(newCV, 4) + "%"} />
            <MetricCard label="Difference between lot means" value={fmt(newMean - oldMean, 2)} />
          </div>
          <p className="callout">{QC03_LOT_CONCLUSION}</p>
        </div>
      )}
    </div>
  );
}

/* ---------------------------- LEARNING CHECK ---------------------------- */
function LearningCheck() {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const score = QC03_LEARNING_CHECK.filter(q => answers[q.id] === q.correct).length;
  function answer(qId, key) {
    if (submitted) return;
    setAnswers(a => ({ ...a, [qId]: key }));
  }
  return (
    <div data-testid="qc03-learning-check">
      <h2>Learning check</h2>
      <p className="muted">A local, session-only learning check \u2014 not a certification test or competency examination.</p>
      <div className="option-list">
        {QC03_LEARNING_CHECK.map(q => {
          const chosen = answers[q.id];
          return (
            <div key={q.id} className="calc-panel-prose">
              <p>{q.prompt}</p>
              <div className="option-list-grid">
                {q.options.map(opt => (
                  <button key={opt.key} type="button"
                    className={"option-btn" + (chosen === opt.key ? " option-selected" : "")}
                    onClick={() => answer(q.id, opt.key)}>{opt.label}</button>
                ))}
              </div>
              {chosen && <p className="prompt-box" role="status">{chosen === q.correct ? "Correct. " : "Not quite. "}{q.explain}</p>}
            </div>
          );
        })}
      </div>
      {!submitted && <button className="btn-primary" onClick={() => setSubmitted(true)}>Submit learning check</button>}
      {submitted && (
        <div className="metric-row" data-testid="qc03-learning-check-score">
          <MetricCard label="Learning check score" value={score + " / " + QC03_LEARNING_CHECK.length} sub="Session-only \u2014 not a professional competency record" />
          {score >= 5 && <Badge tone="available">Confirmed the core distinctions</Badge>}
        </div>
      )}
    </div>
  );
}
