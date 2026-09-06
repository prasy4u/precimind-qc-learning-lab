import { fmtSigned } from "../core/statistics.js";
import { AMENDMENT_CONSIDERATION_NOTE, CHANGE_EVERYTHING_GUARDRAIL_NOTE, COLLAPSE_CAUTION, CORE_BANNER_SEPARATIONS, CORE_BANNER_TITLE, EVIDENCE_CATEGORIES, FOUR_PRINCIPLES, HYPOTHESIS_REVISION_NOTE, IMMEDIATE_ACTION_OPTIONS, INFORMATION_SEEKING_NOTE, INFORMATION_SEEKING_OPTIONS, INVESTIGATION_SCENARIOS, INVESTIGATION_SEQUENCE_CAUTION, INVESTIGATION_SEQUENCE_STEPS, NO_GAMIFIED_SCORE_NOTE, NO_KEEP_RUNNING_NOTE, NO_PBRTQC_NOTE, NO_STOP_EVERYTHING_NOTE, OUT_OF_CONTROL_DEFINITION, PATIENT_IMPACT_ACTIONS, PROCESS_RECOVERY_VS_RESULT_RELEASE_GUARDRAIL_NOTE, REASONING_PATHWAY_CAUTION, REASONING_PATHWAY_STEPS, RECALIBRATION_GUARDRAIL_NOTE, RECOVERY_NOT_ONE_PASS_NOTE, REPEAT_QC_EXERCISE, REPEAT_QC_PRINCIPLE_NOTE, RESULT_DISPOSITION_DECISION_OPTIONS, RESUME_DECISION_OPTIONS, SIGNAL_VS_CONDITION_CAUTION, SIX_CORE_QUESTIONS, STATISTICAL_SIGNAL_DEFINITION, TARGETED_REPEAT_VS_REPEAT_UNTIL_PASS, TWO_QUESTION_RECOVERY_NOTE } from "./data.js";
import { EventTimeline, EvidenceCardGrid, HypothesisBoard, PatientImpactTable, RecoveryFlowDiagram, StatusRow } from "./ui-components.jsx";
import { ExerciseRevealCard } from "../strategy/screens.jsx";
import { CONFIDENCE_OPTIONS } from "../ui/app-data.js";
import { MetricCard, ScientificBasisNote } from "../ui/shared-components.jsx";
import { useState, useMemo, useRef, useEffect } from "react";
import { REASONING_STAGES, autoCorrectPatientResult, deriveQcSignalStatus, isVisibleAtStage, relativeDifferencePercent, stageIndex } from "./calc.js";
import { ALTERNATE_ANALYSER_NOTE, CANDIDATE_WINDOW_NARROWING_EXAMPLE, CLINICAL_SIGNIFICANCE_GUARDRAIL, COMMUNICATION_CONSIDERATION_OPTIONS, CONCORDANT_EVIDENCE_EXAMPLE, CONFIDENCE_CALIBRATION_NOTE_CONVERGED, CONFIDENCE_CALIBRATION_NOTE_EARLY, CONTRADICTORY_EVIDENCE_EXAMPLE, CORE_DISTINCTION_RECOVERY_VS_DISPOSITION, DETECTION_VS_ONSET_NOTE, DISPOSITION_NOT_SYNONYMOUS_WITH_EXPOSURE_NOTE, EQA_LIMITATION_NOTE, HYPOTHESIS_CATEGORIES, ILLUSTRATIVE_THRESHOLD_CAUTION, ILLUSTRATIVE_THRESHOLD_LABEL, LAST_QC_BOUNDARY_NOTE, LAYER_FOUR_DISPOSITION, NOT_AUTOMATICALLY_INVALID_NOTE, NO_AUTO_AMENDMENT_NOTE, NO_AUTO_CORRECTION_NOTE, NO_AUTO_NOTIFICATION_NOTE, NO_CAUSAL_INTERVAL_ENGINE_NOTE, NO_QUANTITATIVE_CERTAINTY_NOTE, PATIENT_DISTRIBUTION_EVIDENCE_NOTE, QC_SIGNAL_NOT_UNIVERSAL_HOLD_NOTE, RECONSTRUCTION_WORKED_EXAMPLE, TEMPORAL_ASSOCIATION_EXAMPLE, THREE_LAYER_CAUTION, THREE_LAYER_MODEL } from "./data.js";
import { TwoTimelineDiagram } from "./ui-components.jsx";
import { SliderField } from "../ui/shared-components.jsx";

/* =========================================================================
   Investigation Lab — screen: five internal modes (When QC Signals,
   Troubleshooting Lab, Evidence Reconstruction, Patient Result Impact,
   Recovery Challenge). Mirrors the architecture of 14-strategy-screens.jsx
   and 18-risk-screens.jsx. Consumes 20-investigation-data.js (static
   content, scenario bank) and 19-investigation-calc.js (status model,
   patient-impact calculations) — no new calculation logic lives here.
   ========================================================================= */

export const INVESTIGATION_LAB_MODES = [
  { id: "signals", label: "When QC Signals" },
  { id: "troubleshooting", label: "Troubleshooting Lab" },
  { id: "reconstruction", label: "Evidence Reconstruction" },
  { id: "patient-impact", label: "Patient Result Impact" },
  { id: "recovery", label: "Recovery Challenge" }
];

export const REASONING_STAGE_LABELS = {
  "signal": "Signal", "containment": "Containment", "characterisation": "Characterisation",
  "hypothesis": "Hypothesis", "evidence-1": "Evidence", "hypothesis-update": "Hypothesis update",
  "intervention": "Intervention", "verification": "Verification", "patient-impact": "Patient impact",
  "resume-decision": "Resume decision"
};

/* ---------------------------- WHEN QC SIGNALS ---------------------------- */
export function WhenQcSignalsPanel({ markProgress }) {
  const [containment, setContainment] = useState([]);
  const [touched, setTouched] = useState(false);
  useEffect(() => { if (touched) markProgress("investigation"); }, [touched]);

  function toggle(id) {
    setTouched(true);
    setContainment(c => c.includes(id) ? c.filter(x => x !== id) : c.concat(id));
  }

  return (
    <div>
      <h3>Terminology: a signal is not automatically a condition</h3>
      <p><strong>{STATISTICAL_SIGNAL_DEFINITION}</strong></p>
      <p><strong>{OUT_OF_CONTROL_DEFINITION}</strong></p>
      <p className="callout-inline">{SIGNAL_VS_CONDITION_CAUTION}</p>

      <h3>Seven questions this application keeps separate</h3>
      <ol className="mini-explain-list">{SIX_CORE_QUESTIONS.map((q, i) => <li key={i}>{q}</li>)}</ol>
      <p className="callout-inline">{COLLAPSE_CAUTION}</p>

      <h3>Exercise — what would you consider first?</h3>
      <p className="muted">Scenario: Level 1 rejects at +3.1 SD (1₃s). Level 2 is unaffected. No process events are recorded yet. Select every action you would genuinely consider — there is no single universally correct combination.</p>
      <div className="option-list option-list-grid">
        {IMMEDIATE_ACTION_OPTIONS.map(o => (
          <button key={o.id} className={"option-btn small" + (containment.includes(o.id) ? " option-selected" : "")} onClick={() => toggle(o.id)}>{o.label}</button>
        ))}
      </div>
      {containment.length > 0 && (
        <div className="feedback-panel">
          <p className="muted small">{NO_STOP_EVERYTHING_NOTE}</p>
          <p className="muted small">{NO_KEEP_RUNNING_NOTE}</p>
        </div>
      )}

      <h3>The repeat-QC principle</h3>
      <p className="prompt-box">{REPEAT_QC_PRINCIPLE_NOTE}</p>
      <div className="exercise-reveal-card">
        <h4>Worked example</h4>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th></th><th>Level 1</th><th>Level 2</th></tr></thead>
            <tbody>
              <tr><td>Initial</td><td>{fmtSigned(REPEAT_QC_EXERCISE.initial[0].z, 1)} SD</td><td>{fmtSigned(REPEAT_QC_EXERCISE.initial[1].z, 1)} SD</td></tr>
              <tr><td>Repeat</td><td>{fmtSigned(REPEAT_QC_EXERCISE.repeat[0].z, 1)} SD</td><td>{fmtSigned(REPEAT_QC_EXERCISE.repeat[1].z, 1)} SD</td></tr>
            </tbody>
          </table>
        </div>
        <ExerciseRevealCard title={REPEAT_QC_EXERCISE.question} prompt="Reveal the answer." answer={REPEAT_QC_EXERCISE.correctAnswer} note={REPEAT_QC_EXERCISE.explanation} />
      </div>

      <h3>Targeted repeat vs. repeat-until-pass</h3>
      <div className="compare-grid">
        <div className="compare-col exercise-reveal-card">
          <h4>{TARGETED_REPEAT_VS_REPEAT_UNTIL_PASS.appropriate.label}</h4>
          <p className="muted small">{TARGETED_REPEAT_VS_REPEAT_UNTIL_PASS.appropriate.example}</p>
        </div>
        <div className="compare-col exercise-reveal-card">
          <h4>{TARGETED_REPEAT_VS_REPEAT_UNTIL_PASS.poor.label}</h4>
          <p className="muted small">{TARGETED_REPEAT_VS_REPEAT_UNTIL_PASS.poor.example}</p>
        </div>
      </div>

      <h3>Two guardrails</h3>
      <div className="callout">{RECALIBRATION_GUARDRAIL_NOTE}</div>
      <div className="callout">{CHANGE_EVERYTHING_GUARDRAIL_NOTE}</div>
    </div>
  );
}

/* ---------------------------- TROUBLESHOOTING LAB ---------------------------- */
export function TroubleshootingLabPanel({ markProgress }) {
  const [inspected, setInspected] = useState(null);
  const [touched, setTouched] = useState(false);
  useEffect(() => { if (touched) markProgress("investigation"); }, [touched]);

  return (
    <div>
      <h3>Investigation sequence (a reasoning framework, not a rigid order)</h3>
      <ol className="mini-explain-list">{INVESTIGATION_SEQUENCE_STEPS.map((s, i) => <li key={i}>{s}</li>)}</ol>
      <p className="callout-inline">{INVESTIGATION_SEQUENCE_CAUTION}</p>

      <h3>Evidence categories</h3>
      <div className="quadrant-grid">
        {EVIDENCE_CATEGORIES.map(c => (
          <div key={c.id} className="quadrant-cell">
            <h4>{c.label}</h4>
            <p className="muted small">{c.examples.join(", ")}</p>
          </div>
        ))}
      </div>
      <p className="callout-inline">{NO_PBRTQC_NOTE}</p>

      <h3>Candidate explanation categories</h3>
      <p className="muted">Every hypothesis in this application is drawn from this fixed list and is always described as a candidate explanation until a scenario's own evidence supports it further.</p>
      <div className="option-list option-list-grid">
        {HYPOTHESIS_CATEGORIES.map(h => <div key={h.id} className="hypothesis-card" style={{ cursor: "default" }}><div className="hypothesis-card-label">{h.label}</div></div>)}
      </div>
      <p className="callout-inline">{NO_QUANTITATIVE_CERTAINTY_NOTE}</p>

      <h3>Temporal association is not causation</h3>
      <div className="exercise-reveal-card">
        <p>{TEMPORAL_ASSOCIATION_EXAMPLE.events.map(e => e.time + " — " + e.label).join("; ")}.</p>
        <ExerciseRevealCard title={TEMPORAL_ASSOCIATION_EXAMPLE.question} prompt="Reveal the answer." answer={TEMPORAL_ASSOCIATION_EXAMPLE.correctAnswer} note={TEMPORAL_ASSOCIATION_EXAMPLE.explanation} />
      </div>

      <h3>Concordant vs. contradictory evidence</h3>
      <div className="compare-grid">
        <div className="compare-col exercise-reveal-card">
          <h4>Concordant evidence</h4>
          <ul className="mini-explain-list">{CONCORDANT_EVIDENCE_EXAMPLE.narrative.map((n, i) => <li key={i}>{n}</li>)}</ul>
          <p><strong>Appropriate conclusion:</strong> {CONCORDANT_EVIDENCE_EXAMPLE.correctFeedback}</p>
          <p className="callout-inline">Overclaim to avoid: "{CONCORDANT_EVIDENCE_EXAMPLE.overclaimToAvoid}"</p>
        </div>
        <div className="compare-col exercise-reveal-card">
          <h4>Contradictory evidence (confirmation-bias check)</h4>
          <ul className="mini-explain-list">{CONTRADICTORY_EVIDENCE_EXAMPLE.narrative.map((n, i) => <li key={i}>{n}</li>)}</ul>
          <p><strong>Appropriate conclusion:</strong> {CONTRADICTORY_EVIDENCE_EXAMPLE.correctConclusion}</p>
          <p className="muted small">{CONTRADICTORY_EVIDENCE_EXAMPLE.teachingPoint}</p>
        </div>
      </div>

      <h3>Choosing what to inspect next</h3>
      <p className="muted">{INFORMATION_SEEKING_NOTE}</p>
      <div className="option-list option-list-grid">
        {INFORMATION_SEEKING_OPTIONS.map(o => (
          <button key={o.id} className={"option-btn small" + (inspected === o.id ? " option-selected" : "")}
            onClick={() => { setInspected(o.id); setTouched(true); }}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------- EVIDENCE RECONSTRUCTION ---------------------------- */
export function EvidenceReconstructionPanel({ markProgress }) {
  const [lastAcceptable, setLastAcceptable] = useState(null);
  const [firstAbnormal, setFirstAbnormal] = useState(null);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => { if (revealed) markProgress("investigation"); }, [revealed]);
  const ex = RECONSTRUCTION_WORKED_EXAMPLE;

  return (
    <div>
      <h3>Worked example — reconstructing a timeline</h3>
      <EventTimeline events={ex.events} />
      <ul className="mini-explain-list">{ex.learnerTasks.map((t, i) => <li key={i}>{t}</li>)}</ul>

      <div className="control-row">
        <div className="control-group">
          <span className="control-group-label" id="er-last-label">Last evidence of acceptable performance</span>
          <select id="er-last" aria-labelledby="er-last-label" value={lastAcceptable || ""} onChange={e => setLastAcceptable(e.target.value)}>
            <option value="">Choose an event…</option>
            {ex.events.map(ev => <option key={ev.time} value={ev.time}>{ev.time} — {ev.label}</option>)}
          </select>
        </div>
        <div className="control-group">
          <span className="control-group-label" id="er-first-label">First evidence of abnormal performance</span>
          <select id="er-first" aria-labelledby="er-first-label" value={firstAbnormal || ""} onChange={e => setFirstAbnormal(e.target.value)}>
            <option value="">Choose an event…</option>
            {ex.events.map(ev => <option key={ev.time} value={ev.time}>{ev.time} — {ev.label}</option>)}
          </select>
        </div>
      </div>
      {!revealed ? (
        <button className="btn-primary" onClick={() => setRevealed(true)} disabled={!lastAcceptable || !firstAbnormal}>Reveal the intended answer</button>
      ) : (
        <div className="feedback-panel">
          <p><strong>Last acceptable evidence:</strong> {ex.lastAcceptedQc} {lastAcceptable === ex.lastAcceptedQc ? "— matches." : "— differs from your selection."}</p>
          <p><strong>First abnormal evidence (detection):</strong> {ex.firstRejectionSignal} {firstAbnormal === ex.firstRejectionSignal ? "— matches." : "— differs from your selection."}</p>
          <p className="callout-inline">{LAST_QC_BOUNDARY_NOTE}</p>
          <p className="callout-inline">{DETECTION_VS_ONSET_NOTE}</p>
        </div>
      )}

      <h3>Narrowing a candidate window — only when evidence supports it</h3>
      <div className="exercise-reveal-card">
        <p>Last accepted QC: {CANDIDATE_WINDOW_NARROWING_EXAMPLE.lastAcceptedQc}. First rejection: {CANDIDATE_WINDOW_NARROWING_EXAMPLE.firstRejection}. Narrowing event: {CANDIDATE_WINDOW_NARROWING_EXAMPLE.narrowingEvent}.</p>
        <p><strong>Narrowed candidate window (this scenario only):</strong> {CANDIDATE_WINDOW_NARROWING_EXAMPLE.narrowedWindow}</p>
        <p className="callout-inline">{CANDIDATE_WINDOW_NARROWING_EXAMPLE.caution}</p>
      </div>
      <p className="muted small">{NO_CAUSAL_INTERVAL_ENGINE_NOTE}</p>
    </div>
  );
}

/* ---------------------------- PATIENT RESULT IMPACT ---------------------------- */
export function PatientResultImpactPanel({ markProgress }) {
  const [threshold, setThreshold] = useState(3);
  const [actions, setActions] = useState([]);
  const [correctionAttempt, setCorrectionAttempt] = useState(null);
  const [touched, setTouched] = useState(false);
  useEffect(() => { if (touched) markProgress("investigation"); }, [touched]);

  const worked = INVESTIGATION_SCENARIOS.find(s => s.id === 3);
  const rows = worked.patientImpactData.map(row => {
    const rel = relativeDifferencePercent(row.originalResult, row.postRecoveryResult);
    const exceeds = rel.supported && Math.abs(rel.value) >= threshold;
    return { ...row, rel, exceeds };
  });

  function toggleAction(id) {
    setTouched(true);
    setActions(a => a.includes(id) ? a.filter(x => x !== id) : a.concat(id));
  }

  return (
    <div>
      <h3>Three layers — never collapsed into one another</h3>
      <div className="quadrant-grid">
        {THREE_LAYER_MODEL.map(l => (
          <div key={l.id} className="quadrant-cell">
            <h4>{l.label}</h4>
            <p className="muted small">{l.question}</p>
            <p className="muted small">{l.definition}</p>
          </div>
        ))}
      </div>
      <p className="callout-inline">{THREE_LAYER_CAUTION}</p>
      <p className="muted small">{NOT_AUTOMATICALLY_INVALID_NOTE}</p>

      <h3>The core distinction (v0.5.1)</h3>
      <div className="callout banner-callout">
        <p>{CORE_DISTINCTION_RECOVERY_VS_DISPOSITION}</p>
      </div>
      <p className="muted small">{PROCESS_RECOVERY_VS_RESULT_RELEASE_GUARDRAIL_NOTE}</p>
      <p className="muted small">{QC_SIGNAL_NOT_UNIVERSAL_HOLD_NOTE}</p>

      <h3>{LAYER_FOUR_DISPOSITION.label} — a fourth, separate layer</h3>
      <div className="quadrant-cell">
        <ul className="mini-explain-list">{LAYER_FOUR_DISPOSITION.questions.map((q, i) => <li key={i}>{q}</li>)}</ul>
        <p className="callout-inline">{DISPOSITION_NOT_SYNONYMOUS_WITH_EXPOSURE_NOTE}</p>
      </div>

      <h3>Two timelines, not one</h3>
      <TwoTimelineDiagram />

      <h3>Retrospective remeasurement — worked example (Case 3 data)</h3>
      <PatientImpactTable items={worked.patientImpactData} candidateImpactWindow={worked.candidateImpactWindow} />
      <p className="muted small">Note patient P104 (original result = 0): relative difference is deliberately not calculated for a zero denominator — see the "Not applicable" cell above.</p>

      <h3>{ILLUSTRATIVE_THRESHOLD_LABEL}</h3>
      <SliderField id="pi-threshold" label="Illustrative review threshold" value={threshold} min={1} max={20} step={1} onChange={v => { setThreshold(v); setTouched(true); }} suffix="%" />
      <p className="callout-inline">{ILLUSTRATIVE_THRESHOLD_CAUTION}</p>
      <ul className="mini-explain-list">
        {rows.map(r => (
          <li key={r.syntheticPatientId}>{r.syntheticPatientId}: {r.rel.supported ? fmtSigned(r.rel.value, 1) + "%" : "not applicable (zero denominator)"} — {r.rel.supported ? (r.exceeds ? "exceeds the illustrative threshold; requires review under this scenario's own definition" : "within the illustrative threshold") : "requires the absolute difference instead"}.</li>
        ))}
      </ul>

      <h3>Why this application never auto-corrects a result</h3>
      <p className="muted small">{NO_AUTO_CORRECTION_NOTE}</p>
      <button className="btn-secondary" onClick={() => { setCorrectionAttempt(autoCorrectPatientResult()); setTouched(true); }}>Attempt automatic correction (teaching demonstration)</button>
      {correctionAttempt && <div className="feedback-panel"><p>{correctionAttempt.reason}</p></div>}

      <h3>Possible patient-impact actions (scenario-dependent — never a fixed table)</h3>
      <div className="option-list option-list-grid">
        {PATIENT_IMPACT_ACTIONS.map(o => (
          <button key={o.id} className={"option-btn small" + (actions.includes(o.id) ? " option-selected" : "")} onClick={() => toggleAction(o.id)}>{o.label}</button>
        ))}
      </div>
      <div className="callout">{CLINICAL_SIGNIFICANCE_GUARDRAIL}</div>
      <p className="muted small">{ALTERNATE_ANALYSER_NOTE}</p>
      <p className="muted small">{PATIENT_DISTRIBUTION_EVIDENCE_NOTE}</p>
      <p className="muted small">{EQA_LIMITATION_NOTE}</p>

      <h3>Amendment/reissue — never automatic</h3>
      <p className="prompt-box">{AMENDMENT_CONSIDERATION_NOTE}</p>
      <p className="muted small">{NO_AUTO_AMENDMENT_NOTE}</p>

      <h3>Communication consideration — qualitative and scenario-authored only</h3>
      <div className="option-list option-list-grid">
        {COMMUNICATION_CONSIDERATION_OPTIONS.map(o => <div key={o.id} className="hypothesis-card" style={{ cursor: "default" }}><div className="hypothesis-card-label">{o.label}</div></div>)}
      </div>
      <p className="muted small">{NO_AUTO_NOTIFICATION_NOTE}</p>
    </div>
  );
}

/* ---------------------------- RECOVERY CHALLENGE ---------------------------- */
export const CATEGORY_TO_INFO_OPTION = {
  "qc-material": "qc-prep-log", "calibration": "calibration-history", "reagent": "reagent-event",
  "instrument": "analyser-alarms", "patient-data": "patient-remeasurements", "cross-assay": "analyser-alarms",
  "comparison": "patient-remeasurements", "qc-pattern": "maintenance-log"
};

export const SIGNAL_INTERPRETATION_OPTIONS = [
  { id: "signal-only", label: "A statistical QC signal has occurred" },
  { id: "condition-confirmed", label: "An out-of-control analytical condition is already confirmed" },
  { id: "all-invalid", label: "All patient results since the last QC are already invalid" }
];

export const DEFAULT_CASE_ANSWER = {
  stageIdx: 0, signalInterpretation: null, containment: [], predictedInfoOption: null,
  leadingHypothesis: null, confidenceAtHypothesis: null,
  hypothesisAtUpdate: null, confidenceAtUpdate: null,
  interventionChoice: null, verificationJudgement: null,
  patientImpactActions: [], resumeDecision: null, resultDispositionDecision: null, completed: false
};

export function statusAtStage(scenario, stageId) {
  const idx = stageIndex(stageId);
  let best = null;
  scenario.progressionByStage.forEach(p => {
    const pIdx = stageIndex(p.stage);
    if (pIdx <= idx && (!best || stageIndex(best.stage) < pIdx)) best = p;
  });
  return best || scenario.progressionByStage[0];
}

export function hypothesisQualityCorrect(scenario, finalHyp) {
  if (scenario.supportedHypothesisId == null) {
    return finalHyp == null || finalHyp === "insufficient-evidence" || finalHyp === "false-rejection";
  }
  return finalHyp === scenario.supportedHypothesisId;
}
export function patientImpactCorrect(scenario, actions) {
  const status = scenario.finalInterpretation.patientImpactStatus;
  if (!scenario.patientImpactData || scenario.patientImpactData.length === 0) {
    return actions.length === 0 || actions.includes("no-action") || actions.includes("document") || actions.includes("insufficient-evidence");
  }
  if (status === "no-impact-demonstrated") return actions.includes("no-action") || actions.includes("document");
  return actions.length > 0 && !(actions.length === 1 && actions[0] === "no-action");
}

export function canAdvanceStage(stageId, ans) {
  switch (stageId) {
    case "signal": return ans.signalInterpretation != null;
    case "containment": return ans.containment.length > 0;
    case "characterisation": return true;
    case "hypothesis": return ans.leadingHypothesis != null && ans.confidenceAtHypothesis != null;
    case "evidence-1": return ans.predictedInfoOption != null;
    case "hypothesis-update": return ans.hypothesisAtUpdate != null && ans.confidenceAtUpdate != null;
    case "intervention": return ans.interventionChoice != null;
    case "verification": return ans.verificationJudgement != null;
    case "patient-impact": return true;
    default: return false;
  }
}

export function RecoveryChallengePanel({ markProgress }) {
  const [idx, setIdx] = useState(0);
  const [byCase, setByCase] = useState({});
  const scenario = INVESTIGATION_SCENARIOS[idx];
  const ans = byCase[scenario.id] || DEFAULT_CASE_ANSWER;
  const stageId = REASONING_STAGES[ans.stageIdx];
  const qcSignalStatus = deriveQcSignalStatus(scenario.qcData.signalType);
  const snapshot = statusAtStage(scenario, stageId);

  const anyCompleted = Object.values(byCase).some(a => a.completed);
  useEffect(() => { if (anyCompleted) markProgress("investigation"); }, [anyCompleted]);

  function update(patch) { setByCase(b => ({ ...b, [scenario.id]: { ...ans, ...patch } })); }
  function goStage(delta) { update({ stageIdx: Math.max(0, Math.min(REASONING_STAGES.length - 1, ans.stageIdx + delta)) }); }
  function toggleContainment(id) { update({ containment: ans.containment.includes(id) ? ans.containment.filter(x => x !== id) : ans.containment.concat(id) }); }
  function toggleImpactAction(id) { update({ patientImpactActions: ans.patientImpactActions.includes(id) ? ans.patientImpactActions.filter(x => x !== id) : ans.patientImpactActions.concat(id) }); }

  const visibleEvidence = scenario.evidenceItems.filter(e => isVisibleAtStage(e.revealStage, stageId));

  const completedCases = Object.keys(byCase).map(k => byCase[k]).filter(a => a.completed);
  const domainScores = {
    signal: completedCases.filter(a => a.signalInterpretation === "signal-only").length,
    evidence: completedCases.filter((a, i) => {
      const s = INVESTIGATION_SCENARIOS.find(sc => byCase[sc.id] === a);
      if (!s) return false;
      const first = s.evidenceItems.find(e => e.revealStage === "evidence-1");
      if (!first) return true;
      return CATEGORY_TO_INFO_OPTION[first.category] === a.predictedInfoOption;
    }).length,
    hypothesis: completedCases.filter(a => {
      const s = INVESTIGATION_SCENARIOS.find(sc => byCase[sc.id] === a);
      return s && hypothesisQualityCorrect(s, a.hypothesisAtUpdate);
    }).length,
    patientImpact: completedCases.filter(a => {
      const s = INVESTIGATION_SCENARIOS.find(sc => byCase[sc.id] === a);
      return s && patientImpactCorrect(s, a.patientImpactActions);
    }).length,
    recovery: completedCases.filter(a => {
      const s = INVESTIGATION_SCENARIOS.find(sc => byCase[sc.id] === a);
      return s && a.resumeDecision === s.correctResumeDecision;
    }).length,
    resultDisposition: completedCases.filter(a => {
      const s = INVESTIGATION_SCENARIOS.find(sc => byCase[sc.id] === a);
      return s && a.resultDispositionDecision === s.correctResultDispositionDecision;
    }).length
  };
  const attempted = completedCases.length;

  function submitCase() { update({ completed: true }); }

  let calibrationNote = null;
  if (ans.completed) {
    if (ans.confidenceAtHypothesis === "high" && ans.hypothesisAtUpdate !== ans.leadingHypothesis) calibrationNote = CONFIDENCE_CALIBRATION_NOTE_EARLY;
    else if (ans.confidenceAtUpdate === "high" && hypothesisQualityCorrect(scenario, ans.hypothesisAtUpdate) && ans.confidenceAtHypothesis !== "high") calibrationNote = CONFIDENCE_CALIBRATION_NOTE_CONVERGED;
  }

  return (
    <div>
      <p className="muted">Thirteen deterministic, integrated investigation-and-recovery scenarios. Work through each reasoning stage in order — later evidence is never shown before its authored stage. Revising your hypothesis as evidence emerges is expected and is never penalised.</p>
      <div className="challenge-nav">
        {INVESTIGATION_SCENARIOS.map((s, i) => (
          <button key={s.id} className={"case-chip" + (i === idx ? " case-chip-active" : "") + ((byCase[s.id] && byCase[s.id].completed) ? " case-chip-done" : "")}
            onClick={() => setIdx(i)} aria-current={i === idx}>{s.id}</button>
        ))}
      </div>

      <div className="case-panel">
        <h2>{scenario.title}</h2>
        <StatusRow qcSignalStatus={qcSignalStatus} processStatus={snapshot.processStatus} causeStatus={snapshot.causeStatus} patientImpactStatus={snapshot.patientImpactStatus} resultDispositionStatus={ans.completed ? scenario.finalInterpretation.resultDispositionStatus : snapshot.resultDispositionStatus} />
        <div className="tabbar reasoning-stage-bar" role="tablist" aria-label="Reasoning stage">
          {REASONING_STAGES.map((s, i) => (
            <button key={s} role="tab" aria-selected={i === ans.stageIdx} disabled={i > ans.stageIdx}
              className={"tab" + (i === ans.stageIdx ? " tab-active" : "")}
              onClick={() => i <= ans.stageIdx && update({ stageIdx: i })}>{REASONING_STAGE_LABELS[s]}</button>
          ))}
        </div>

        {stageId === "signal" && (
          <div className="question-block">
            <p>{scenario.qcData.narrative}</p>
            <div className="table-scroll">
              <table className="data-table"><tbody>{scenario.qcHistory.map((h, i) => <tr key={i}><td>{h}</td></tr>)}</tbody></table>
            </div>
            <p className="q-prompt">What can you say about this event right now?</p>
            <div className="option-list">
              {SIGNAL_INTERPRETATION_OPTIONS.map(o => (
                <button key={o.id} className={"option-btn" + (ans.signalInterpretation === o.id ? " option-selected" : "")} onClick={() => update({ signalInterpretation: o.id })}>{o.label}</button>
              ))}
            </div>
            {ans.signalInterpretation && <p className="callout-inline">{CORE_BANNER_TITLE} {ans.signalInterpretation !== "signal-only" ? "Only \"A statistical QC signal has occurred\" is supported at this stage." : "Correct — nothing more than this is yet established."}</p>}
          </div>
        )}

        {stageId === "containment" && (
          <div className="question-block">
            <p className="q-prompt">Which immediate action(s) would you consider? {scenario.repeatQc.performed && "(A repeat QC was in fact performed in this case — see below.)"}</p>
            <div className="option-list option-list-grid">
              {IMMEDIATE_ACTION_OPTIONS.map(o => (
                <button key={o.id} className={"option-btn small" + (ans.containment.includes(o.id) ? " option-selected" : "")} onClick={() => toggleContainment(o.id)}>{o.label}</button>
              ))}
            </div>
            {scenario.repeatQc.performed && <p className="muted small">Repeat QC result: {scenario.repeatQc.result} — {scenario.repeatQc.note}</p>}
            {ans.containment.length > 0 && <p className="callout-inline">{REPEAT_QC_PRINCIPLE_NOTE}</p>}
          </div>
        )}

        {stageId === "characterisation" && (
          <div className="question-block">
            {scenario.timelineEvents && <EventTimeline events={scenario.timelineEvents} candidateImpactWindow={scenario.candidateImpactWindow} />}
            <EvidenceCardGrid items={visibleEvidence} />
          </div>
        )}

        {stageId === "hypothesis" && (
          <div className="question-block">
            <EvidenceCardGrid items={visibleEvidence} />
            <p className="q-prompt">What is your leading hypothesis?</p>
            <HypothesisBoard candidateHypothesisIds={scenario.candidateHypothesisIds} supportedHypothesisId={null} causeStatus="candidate-hypothesis" selectedId={ans.leadingHypothesis} onSelect={id => update({ leadingHypothesis: id })} />
            <p className="q-prompt">How confident are you?</p>
            <div className="option-list option-list-grid option-list-narrow">
              {CONFIDENCE_OPTIONS.map(o => <button key={o.id} className={"option-btn small" + (ans.confidenceAtHypothesis === o.id ? " option-selected" : "")} onClick={() => update({ confidenceAtHypothesis: o.id })}>{o.label}</button>)}
            </div>
          </div>
        )}

        {stageId === "evidence-1" && (
          <div className="question-block">
            <p className="q-prompt">Before the next evidence is revealed: which of these would you inspect?</p>
            <div className="option-list option-list-grid">
              {INFORMATION_SEEKING_OPTIONS.map(o => <button key={o.id} className={"option-btn small" + (ans.predictedInfoOption === o.id ? " option-selected" : "")} onClick={() => update({ predictedInfoOption: o.id })}>{o.label}</button>)}
            </div>
            <p className="muted small">{INFORMATION_SEEKING_NOTE}</p>
            {ans.predictedInfoOption && <EvidenceCardGrid items={visibleEvidence} />}
          </div>
        )}

        {stageId === "hypothesis-update" && (
          <div className="question-block">
            <EvidenceCardGrid items={visibleEvidence} />
            <p className="q-prompt">Given the new evidence, what is your hypothesis now?</p>
            <HypothesisBoard candidateHypothesisIds={scenario.candidateHypothesisIds} supportedHypothesisId={null} causeStatus="candidate-hypothesis" selectedId={ans.hypothesisAtUpdate} onSelect={id => update({ hypothesisAtUpdate: id })} />
            <p className="q-prompt">Updated confidence:</p>
            <div className="option-list option-list-grid option-list-narrow">
              {CONFIDENCE_OPTIONS.map(o => <button key={o.id} className={"option-btn small" + (ans.confidenceAtUpdate === o.id ? " option-selected" : "")} onClick={() => update({ confidenceAtUpdate: o.id })}>{o.label}</button>)}
            </div>
            {ans.hypothesisAtUpdate && <p className="callout-inline">{HYPOTHESIS_REVISION_NOTE}</p>}
          </div>
        )}

        {stageId === "intervention" && (
          <div className="question-block">
            <EvidenceCardGrid items={visibleEvidence} />
            <p className="q-prompt">Is a corrective intervention warranted yet?</p>
            <div className="option-list">
              <button className={"option-btn" + (ans.interventionChoice === "intervene" ? " option-selected" : "")} onClick={() => update({ interventionChoice: "intervene" })}>Yes — a hypothesis-driven corrective action is warranted</button>
              <button className={"option-btn" + (ans.interventionChoice === "wait" ? " option-selected" : "")} onClick={() => update({ interventionChoice: "wait" })}>Not yet — gather more discriminating evidence first</button>
              <button className={"option-btn" + (ans.interventionChoice === "insufficient" ? " option-selected" : "")} onClick={() => update({ interventionChoice: "insufficient" })}>Insufficient evidence to decide</button>
            </div>
            <p className="callout-inline">{RECALIBRATION_GUARDRAIL_NOTE}</p>
            <p className="callout-inline">{CHANGE_EVERYTHING_GUARDRAIL_NOTE}</p>
          </div>
        )}

        {stageId === "verification" && (
          <div className="question-block">
            <EvidenceCardGrid items={visibleEvidence} />
            <h4>Recovery evidence available in this case</h4>
            {scenario.recoveryEvidence.length > 0 ? <ul className="mini-explain-list">{scenario.recoveryEvidence.map((r, i) => <li key={i}>{r}</li>)}</ul> : <p className="event-list-empty">No recovery evidence has been established in this case.</p>}
            <p className="q-prompt">Is there sufficient evidence of recovery so far?</p>
            <div className="option-list">
              <button className={"option-btn" + (ans.verificationJudgement === "sufficient" ? " option-selected" : "")} onClick={() => update({ verificationJudgement: "sufficient" })}>Sufficient</button>
              <button className={"option-btn" + (ans.verificationJudgement === "not-sufficient" ? " option-selected" : "")} onClick={() => update({ verificationJudgement: "not-sufficient" })}>Not sufficient</button>
              <button className={"option-btn" + (ans.verificationJudgement === "more-needed" ? " option-selected" : "")} onClick={() => update({ verificationJudgement: "more-needed" })}>More evidence needed to decide</button>
            </div>
            <p className="callout-inline">{RECOVERY_NOT_ONE_PASS_NOTE}</p>
          </div>
        )}

        {stageId === "patient-impact" && (
          <div className="question-block">
            <EvidenceCardGrid items={visibleEvidence} />
            <PatientImpactTable items={scenario.patientImpactData} candidateImpactWindow={scenario.candidateImpactWindow} />
            <p className="q-prompt">Which patient-impact action(s), if any, are supported by the evidence in this case?</p>
            <div className="option-list option-list-grid">
              {PATIENT_IMPACT_ACTIONS.map(o => <button key={o.id} className={"option-btn small" + (ans.patientImpactActions.includes(o.id) ? " option-selected" : "")} onClick={() => toggleImpactAction(o.id)}>{o.label}</button>)}
            </div>
            <p className="callout-inline">{FOUR_PRINCIPLES[0].text}</p>
            <p className="callout-inline">{FOUR_PRINCIPLES[1].text}</p>
          </div>
        )}

        {stageId === "resume-decision" && (
          <div className="question-block">
            <EvidenceCardGrid items={visibleEvidence} />
            <p className="muted small">{TWO_QUESTION_RECOVERY_NOTE}</p>
            <p className="q-prompt">A. Is there sufficient evidence to resume routine patient testing?</p>
            <div className="option-list" data-question="resume-decision">
              {RESUME_DECISION_OPTIONS.map(o => <button key={o.id} disabled={ans.completed} className={"option-btn" + (ans.resumeDecision === o.id ? " option-selected" : "")} onClick={() => update({ resumeDecision: o.id })}>{o.label}</button>)}
            </div>
            <p className="q-prompt">B. Has the disposition of relevant earlier patient results been adequately resolved?</p>
            <div className="option-list" data-question="result-disposition-decision">
              {RESULT_DISPOSITION_DECISION_OPTIONS.map(o => <button key={o.id} disabled={ans.completed} className={"option-btn" + (ans.resultDispositionDecision === o.id ? " option-selected" : "")} onClick={() => update({ resultDispositionDecision: o.id })}>{o.label}</button>)}
            </div>
            {!ans.completed ? (
              <button className="btn-primary" onClick={submitCase} disabled={!ans.resumeDecision || !ans.resultDispositionDecision}>Submit case</button>
            ) : (
              <div className="feedback-panel">
                <h3>Feedback</h3>
                <p><strong>Your resume decision (A):</strong> {RESUME_DECISION_OPTIONS.find(o => o.id === ans.resumeDecision).label}</p>
                <p><strong>Intended teaching decision (A):</strong> {RESUME_DECISION_OPTIONS.find(o => o.id === scenario.correctResumeDecision).label}</p>
                <p><strong>Your result-disposition decision (B):</strong> {RESULT_DISPOSITION_DECISION_OPTIONS.find(o => o.id === ans.resultDispositionDecision).label}</p>
                <p><strong>Intended teaching decision (B):</strong> {RESULT_DISPOSITION_DECISION_OPTIONS.find(o => o.id === scenario.correctResultDispositionDecision).label}</p>
                <p><strong>Final interpretation:</strong> {scenario.finalInterpretation.summary}</p>
                <StatusRow processStatus={scenario.finalInterpretation.processStatus} causeStatus={scenario.finalInterpretation.causeStatus} patientImpactStatus={scenario.finalInterpretation.patientImpactStatus} resultDispositionStatus={scenario.finalInterpretation.resultDispositionStatus} />
                {scenario.finalInterpretation.resultDispositionStatus === "amendment-or-reissue-being-considered" && (
                  <p className="callout-inline">{AMENDMENT_CONSIDERATION_NOTE}</p>
                )}
                {scenario.unresolvedQuestions.length > 0 && (
                  <div>
                    <p><strong>Remaining uncertainty:</strong></p>
                    <ul className="mini-explain-list">{scenario.unresolvedQuestions.map((u, i) => <li key={i}>{u}</li>)}</ul>
                  </div>
                )}
                {calibrationNote && <p className="callout-inline">{calibrationNote}</p>}
                <p className="callout-inline">{FOUR_PRINCIPLES[2].text}</p>
                <p className="callout-inline">{FOUR_PRINCIPLES[3].text}</p>
                <p className="callout-inline">{PROCESS_RECOVERY_VS_RESULT_RELEASE_GUARDRAIL_NOTE}</p>
                <div className="btn-row">
                  {idx < INVESTIGATION_SCENARIOS.length - 1 && <button className="btn-secondary" onClick={() => setIdx(idx + 1)}>Next case</button>}
                  {idx > 0 && <button className="btn-link" onClick={() => setIdx(idx - 1)}>Previous case</button>}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="btn-row stage-nav-row">
          {ans.stageIdx > 0 && <button className="btn-link" onClick={() => goStage(-1)}>← Back</button>}
          {stageId !== "resume-decision" && <button className="btn-secondary" onClick={() => goStage(1)} disabled={!canAdvanceStage(stageId, ans)}>Next stage →</button>}
        </div>
      </div>

      <div className="score-summary">
        <h3>Session scoring ({attempted} / {INVESTIGATION_SCENARIOS.length} cases completed)</h3>
        <p className="muted small">{NO_GAMIFIED_SCORE_NOTE}</p>
        <div className="metric-row">
          <MetricCard label="Signal interpretation" value={domainScores.signal + " / " + attempted} />
          <MetricCard label="Evidence selection" value={domainScores.evidence + " / " + attempted} />
          <MetricCard label="Hypothesis quality" value={domainScores.hypothesis + " / " + attempted} />
          <MetricCard label="Patient-impact reasoning" value={domainScores.patientImpact + " / " + attempted} />
          <MetricCard label="Recovery decision" value={domainScores.recovery + " / " + attempted} />
          <MetricCard label="Result disposition" value={domainScores.resultDisposition + " / " + attempted} />
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- SCREEN SHELL ---------------------------- */
export function InvestigationLabScreen({ level, markProgress, goto }) {
  const [mode, setMode] = useState("signals");

  return (
    <div className="screen">
      <h1>Investigation Lab</h1>
      <p className="muted">What happens after a QC signal occurs. This is an educational reasoning pathway — Signal → Contain → Characterise → Investigate → Test hypotheses → Correct → Verify recovery → Assess patient impact → Document → Resume — not a universal laboratory SOP.</p>
      <RecoveryFlowDiagram steps={REASONING_PATHWAY_STEPS} />
      <p className="callout-inline">{REASONING_PATHWAY_CAUTION}</p>

      <div className="callout banner-callout">
        <h2 style={{ marginTop: 0 }}>{CORE_BANNER_TITLE}</h2>
        <p>{CORE_BANNER_SEPARATIONS.join(" ≠ ")}</p>
      </div>

      <div className="tabbar" role="tablist" aria-label="Investigation Lab mode">
        {INVESTIGATION_LAB_MODES.map(m => (
          <button key={m.id} role="tab" aria-selected={mode === m.id}
            className={"tab" + (mode === m.id ? " tab-active" : "")}
            onClick={() => setMode(m.id)}>{m.label}</button>
        ))}
      </div>

      {mode === "signals" && <WhenQcSignalsPanel markProgress={markProgress} />}
      {mode === "troubleshooting" && <TroubleshootingLabPanel markProgress={markProgress} />}
      {mode === "reconstruction" && <EvidenceReconstructionPanel markProgress={markProgress} />}
      {mode === "patient-impact" && <PatientResultImpactPanel markProgress={markProgress} />}
      {mode === "recovery" && <RecoveryChallengePanel markProgress={markProgress} />}

      <details className="important-note">
        <summary>Four principles that hold throughout this lab</summary>
        <ul className="mini-explain-list">{FOUR_PRINCIPLES.map(p => <li key={p.id}>{p.text}</li>)}</ul>
      </details>

      <ScientificBasisNote goto={goto} text="This lab draws on CLSI C24's treatment of response to out-of-control conditions and consideration of patient results during compromised-validity periods, the 2025 IFCC recommendations for internal quality control practice (Giannoli et al., Clinica Chimica Acta) and the published critical commentary on them (Çubukçu et al., CCLM), and Parvin & Baumann's example of retrospective patient-result review in a defined study context — see the Evidence page for full provenance, evidentiary tier, and scope." />
    </div>
  );
}
