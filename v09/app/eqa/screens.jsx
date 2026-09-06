import { TARGET_VALUE_TYPE_LABELS } from "./calc.js";
import { CAPABILITY_CONCLUSION_OPTIONS, COMMUTABILITY_CHALLENGE_EXAMPLE, COMMUTABILITY_CONCEPT_NOTE, COMMUTABILITY_CONSEQUENCE_NOTE, COMMUTABILITY_NOT_JUST_HUMAN_SERUM_NOTE, COMMUTABILITY_STATUS_DESCRIPTIONS, CORE_THREE_WAY_DISTINCTION, EQA_CAN_REVEAL, EQA_NOT_REALTIME_IQC_NOTE, EQA_PT_TERMINOLOGY_CAUTION, EQA_REVEAL_DEPENDENCY_NOTE, EQA_TERMINOLOGY, EXPLORE_INVESTIGATION_LINK_LABEL, EXTERNAL_ASSURANCE_CASES, EXTERNAL_ASSURANCE_PATHWAY_CAUTION, EXTERNAL_ASSURANCE_PATHWAY_STEPS, GOOD_IQC_DOES_NOT_PROVE_TRUENESS_NOTE, IQC_EQA_COMBINED_MATRIX, LONGITUDINAL_RELEVANCE_OPTIONS, NEVER_ALL_CALLED_TRUE_VALUE_NOTE, NEXT_ACTION_OPTIONS, NOT_SIMPLY_PRECISION_VS_ACCURACY_NOTE, NO_AUTO_TRANSFER_BETWEEN_MODULES_NOTE, PATTERN_JUDGEMENT_OPTIONS, PEER_GROUP_NOT_TRUTH_PRINCIPLE, POOR_EQA_DOES_NOT_AUTOMATICALLY_PROVE_BIAS_NOTE, SIGNATURE_MISCONCEPTION_CASE, STABLE_IQC_POOR_EQA_CAUTION, TARGET_HIERARCHY_GUARDRAIL_NOTE, TARGET_TYPE_CLASSIFICATION_ITEMS, TARGET_VALUE_TYPE_DESCRIPTIONS, UNKNOWN_NOT_EQUAL_FAILED_NOTE, UNSTABLE_IQC_ACCEPTABLE_EQA_CAUTION } from "./data.js";
import { CommutabilityChallengeComponent, EqaStatusBadge, EqaStatusRow, LongitudinalEqaChart } from "./ui-components.jsx";
import { RecoveryFlowDiagram } from "../investigation/ui-components.jsx";
import { ExerciseRevealCard } from "../strategy/screens.jsx";
import { CONFIDENCE_OPTIONS } from "../ui/app-data.js";
import { MetricCard, ScientificBasisNote } from "../ui/shared-components.jsx";
import { useState, useMemo, useRef, useEffect } from "react";
import { CAPABILITY_HARMONISATION_NOTE, CAPABILITY_METHOD_PERFORMANCE_NOTE, CAPABILITY_PARTICIPANT_PERFORMANCE_NOTE, COMPARABILITY_LAB_ILLUSTRATIVE_CRITERION, COMPARABILITY_LAB_SCOPE_NOTE, COMPARABILITY_PAIRED_SPECIMENS, CONTROL_MATERIAL_TRAP_CASE, DESIGNATED_COMPARATOR_NOTE, EQA_INVESTIGATION_PATH_CAUTION, EQA_INVESTIGATION_PATH_STEPS, EQA_PROCESS_ERROR_TYPES, EQA_RESULT_FIELDS, EXCLUDED_METHOD_COMPARISON_STATISTICS, EXCLUDED_STATISTICS_NOTE, EXTERNAL_ASSURANCE_STAGES, INVESTIGATE_WHOLE_EQA_PROCESS_NOTE, LABORATORY_SPECIFIC_DEVIATION_REPORT, LONGITUDINAL_COMPARABILITY_SUMMARY, LONGITUDINAL_EQA_TIMELINE, LONGITUDINAL_TIMELINE_TEACHING_NOTE, MISSING_FIELDS_STAY_MISSING_NOTE, NOT_EVERY_DIFFERENCE_CLINICALLY_IMPORTANT_NOTE, NO_AUTOMATIC_TREND_ROOT_CAUSE_NOTE, NO_AUTO_PATIENT_IMPACT_FROM_EQA_NOTE, NO_COMMUTABLE_EQUALS_PERFECT_NOTE, NO_EQA_FAIL_EQUALS_PATIENT_RESULTS_WRONG_NOTE, NO_EQA_PASS_EQUALS_METHOD_VALID_NOTE, NO_PEER_MEAN_EQUALS_REFERENCE_VALUE_NOTE, PATIENT_COMPARISON_TRAP_CASE, PEER_GROUP_HIDES_METHOD_BIAS_REPORT, PERFORMANCE_CRITERION_APS_LINK_NOTE, PT_INTEGRITY_CHALLENGE, REPORT_INTERPRETATION_QUESTIONS, SAMPLE_HANDLING_DISCOURAGED, SAMPLE_HANDLING_INTEGRITY_NOTE, SINGLE_EVENT_VS_TREND_NOTE, TARGET_CHANGES_CONCLUSION_REPORT } from "./data.js";
import { EqaReportCard, LongitudinalComparabilityTable, PairedComparisonTable, SchemeCapabilityProfileBuilder, SchemeCapabilityProfileDisplay, humanizeEqaStatus } from "./ui-components.jsx";

/* =========================================================================
   External Assurance Lab (QC-10) — screen: ONE primary nav item with five
   internal modes (IQC vs EQA | EQA Target Lab | EQA Report Interpreter |
   Comparability Lab | Longitudinal Challenge). Mirrors the architecture of
   22-investigation-screens.jsx. Consumes 24-eqa-data.js (static content,
   the 14-case challenge bank) and 23-eqa-calc.js (status model,
   calculations) — no new calculation logic lives here.
   ========================================================================= */

export const EXTERNAL_ASSURANCE_MODES = [
  { id: "iqc-vs-eqa", label: "IQC vs EQA" },
  { id: "target-lab", label: "EQA Target Lab" },
  { id: "report-interpreter", label: "EQA Report Interpreter" },
  { id: "comparability-lab", label: "Comparability Lab" },
  { id: "longitudinal-challenge", label: "Longitudinal Challenge" }
];

export const EQA_STAGE_LABELS = {
  target: "Target", commutability: "Commutability", capability: "Capability",
  pattern: "Pattern", longitudinal: "Longitudinal", "next-step": "Next step", confidence: "Confidence"
};

/* ---------------------------- IQC vs EQA ---------------------------- */
export function IqcVsEqaPanel({ markProgress }) {
  const [touched, setTouched] = useState(false);
  useEffect(() => { if (touched) markProgress("external-assurance"); }, [touched]);

  return (
    <div>
      <h3>Three questions, not one</h3>
      <div className="quadrant-grid">
        {CORE_THREE_WAY_DISTINCTION.map(c => (
          <div key={c.id} className="quadrant-cell">
            <h4>{c.label}</h4>
            <p className="muted small">{c.question}</p>
          </div>
        ))}
      </div>
      <p className="callout-inline">{NOT_SIMPLY_PRECISION_VS_ACCURACY_NOTE}</p>

      <h3>Terminology</h3>
      <ul className="mini-explain-list">{EQA_TERMINOLOGY.map((t, i) => <li key={i}><strong>{t.term}:</strong> {t.def}</li>)}</ul>
      <p className="callout-inline">{EQA_PT_TERMINOLOGY_CAUTION}</p>

      <h3>The signature misconception</h3>
      <div className="exercise-reveal-card">
        <p>{SIGNATURE_MISCONCEPTION_CASE.iqcNarrative}</p>
        <p>{SIGNATURE_MISCONCEPTION_CASE.eqaNarrative}</p>
        <ExerciseRevealCard title="" prompt={SIGNATURE_MISCONCEPTION_CASE.question} answer={SIGNATURE_MISCONCEPTION_CASE.correctAnswer} note={SIGNATURE_MISCONCEPTION_CASE.explanation} />
      </div>
      <button className="btn-secondary" onClick={() => setTouched(true)}>Mark as reviewed</button>

      <h3>EQA is not real-time IQC</h3>
      <p>{EQA_NOT_REALTIME_IQC_NOTE}</p>
      <p className="muted">What a well-designed EQA scheme can reveal, depending on its design:</p>
      <ul className="mini-explain-list">{EQA_CAN_REVEAL.map((e, i) => <li key={i}>{e}</li>)}</ul>
      <p className="callout-inline">{EQA_REVEAL_DEPENDENCY_NOTE}</p>

      <h3>IQC + EQA combined — four scenarios</h3>
      <div className="quadrant-grid">
        {IQC_EQA_COMBINED_MATRIX.map(m => (
          <div key={m.id} className="quadrant-cell">
            <h4>{m.label}</h4>
            <p className="muted small"><strong>Suggests:</strong> {m.suggests}</p>
            <p className="muted small"><strong>Cannot establish:</strong> {m.cannotEstablish}</p>
          </div>
        ))}
      </div>
      <div className="callout">{STABLE_IQC_POOR_EQA_CAUTION}</div>
      <div className="callout">{UNSTABLE_IQC_ACCEPTABLE_EQA_CAUTION}</div>
    </div>
  );
}

/* ---------------------------- EQA TARGET LAB ---------------------------- */
export function EqaTargetLabPanel({ markProgress }) {
  const [classifyAnswers, setClassifyAnswers] = useState({});
  const [profile, setProfile] = useState({ commutabilityVerified: null, higherOrderTargetAvailable: null, replicateSpecimensIncluded: null, methodGroupsDefined: null, performanceSpecificationStated: null });
  const [touched, setTouched] = useState(false);
  useEffect(() => { if (touched) markProgress("external-assurance"); }, [touched]);

  return (
    <div>
      <h3>Seven target value types — never all called "the true value"</h3>
      <div className="table-scroll">
        <table className="data-table">
          <thead><tr><th>Target type</th><th>What it means</th></tr></thead>
          <tbody>{TARGET_VALUE_TYPE_DESCRIPTIONS.map(t => <tr key={t.id}><td>{TARGET_VALUE_TYPE_LABELS[t.id]}</td><td>{t.description}</td></tr>)}</tbody>
        </table>
      </div>
      <p className="callout-inline">{NEVER_ALL_CALLED_TRUE_VALUE_NOTE}</p>
      <div className="callout banner-callout">{TARGET_HIERARCHY_GUARDRAIL_NOTE}</div>
      <div className="callout banner-callout">{PEER_GROUP_NOT_TRUTH_PRINCIPLE}</div>

      <h3>Classify the target</h3>
      <p className="muted">For each scenario, choose the target value type it describes.</p>
      {TARGET_TYPE_CLASSIFICATION_ITEMS.map(item => (
        <div key={item.id} className="exercise-reveal-card">
          <p>{item.narrative}</p>
          <div className="option-list option-list-grid">
            {TARGET_VALUE_TYPE_DESCRIPTIONS.map(t => (
              <button key={t.id} className={"option-btn small" + (classifyAnswers[item.id] === t.id ? " option-selected" : "")}
                onClick={() => { setClassifyAnswers(a => ({ ...a, [item.id]: t.id })); setTouched(true); }}>{TARGET_VALUE_TYPE_LABELS[t.id]}</button>
            ))}
          </div>
          {classifyAnswers[item.id] && (
            <p className="callout-inline">{classifyAnswers[item.id] === item.correctTargetTypeId ? "Correct." : "Not quite — intended answer: " + TARGET_VALUE_TYPE_LABELS[item.correctTargetTypeId] + "."}</p>
          )}
        </div>
      ))}

      <h3>Commutability</h3>
      <p>{COMMUTABILITY_CONCEPT_NOTE}</p>
      <p className="callout-inline">{COMMUTABILITY_NOT_JUST_HUMAN_SERUM_NOTE}</p>
      <div className="table-scroll">
        <table className="data-table">
          <thead><tr><th>Status</th><th>Meaning</th></tr></thead>
          <tbody>{COMMUTABILITY_STATUS_DESCRIPTIONS.map(c => <tr key={c.id}><td><EqaStatusBadge kind="commutability" value={c.id} /></td><td>{c.description}</td></tr>)}</tbody>
        </table>
      </div>
      <p className="callout-inline">{UNKNOWN_NOT_EQUAL_FAILED_NOTE}</p>
      <p>{COMMUTABILITY_CONSEQUENCE_NOTE}</p>

      <h3>Commutability challenge</h3>
      <CommutabilityChallengeComponent example={COMMUTABILITY_CHALLENGE_EXAMPLE} />

      <h3>Scheme Capability Profile</h3>
      <p className="muted">Set what is known about a scheme's design, and see what conclusions that design can and cannot support.</p>
      <SchemeCapabilityProfileBuilder profile={profile} onChange={p => { setProfile(p); setTouched(true); }} />
      <p className="muted small">{CAPABILITY_PARTICIPANT_PERFORMANCE_NOTE}</p>
      <p className="muted small">{CAPABILITY_METHOD_PERFORMANCE_NOTE}</p>
      <p className="muted small">{CAPABILITY_HARMONISATION_NOTE}</p>

      <h3>Performance criteria — not always TEa</h3>
      <p className="callout-inline">{PERFORMANCE_CRITERION_APS_LINK_NOTE}</p>
    </div>
  );
}

/* ---------------------------- EQA REPORT INTERPRETER ---------------------------- */
export function EqaReportExample({ report }) {
  return (
    <div className="exercise-reveal-card">
      <h4>{report.title}</h4>
      <EqaReportCard result={report.eqaResult} />
      <ExerciseRevealCard title="" prompt={report.question} answer={report.correctAnswer || "See explanation"} note={report.explanation} />
    </div>
  );
}

export function EqaReportInterpreterPanel({ markProgress }) {
  const [touched, setTouched] = useState(false);
  const [ptChoices, setPtChoices] = useState([]);
  useEffect(() => { if (touched) markProgress("external-assurance"); }, [touched]);

  function togglePt(id) {
    setTouched(true);
    setPtChoices(c => c.includes(id) ? c.filter(x => x !== id) : c.concat(id));
  }

  return (
    <div>
      <h3>Seven questions to ask before drawing any conclusion</h3>
      <ol className="mini-explain-list">{REPORT_INTERPRETATION_QUESTIONS.map(q => <li key={q.id}>{q.label}</li>)}</ol>

      <h3>EQA result data model</h3>
      <details className="important-note">
        <summary>Every field this application tracks on an EQA result</summary>
        <ul className="mini-explain-list">{EQA_RESULT_FIELDS.map(f => <li key={f.field}><strong>{f.field}:</strong> {f.def}</li>)}</ul>
      </details>
      <p className="muted small">{MISSING_FIELDS_STAY_MISSING_NOTE}</p>

      <h3>Worked reports</h3>
      <p className="muted" onClick={() => setTouched(true)}>{SINGLE_EVENT_VS_TREND_NOTE}</p>
      <div className="compare-grid">
        <EqaReportExample report={PEER_GROUP_HIDES_METHOD_BIAS_REPORT} />
        <EqaReportExample report={LABORATORY_SPECIFIC_DEVIATION_REPORT} />
      </div>
      <EqaReportExample report={TARGET_CHANGES_CONCLUSION_REPORT} />

      <h3>PT/EQA sample integrity</h3>
      <p>{SAMPLE_HANDLING_INTEGRITY_NOTE}</p>
      <p className="muted">Discouraged practices: {SAMPLE_HANDLING_DISCOURAGED.join("; ")}.</p>
      <div className="exercise-reveal-card">
        <p className="q-prompt">{PT_INTEGRITY_CHALLENGE.scenario} Select every action that is appropriate.</p>
        <div className="option-list option-list-grid">
          {PT_INTEGRITY_CHALLENGE.options.map(o => (
            <button key={o.id} className={"option-btn small" + (ptChoices.includes(o.id) ? " option-selected" : "")} onClick={() => togglePt(o.id)}>{o.label}</button>
          ))}
        </div>
        {ptChoices.length > 0 && (
          <div className="feedback-panel">
            {PT_INTEGRITY_CHALLENGE.options.map(o => (
              <p key={o.id} className="muted small">{o.label}: {ptChoices.includes(o.id) === o.correct ? "Correctly identified." : (o.correct ? "This is in fact appropriate — reconsider." : "This is in fact discouraged — reconsider.")}</p>
            ))}
            <p className="callout-inline">{PT_INTEGRITY_CHALLENGE.teachingPoint}</p>
          </div>
        )}
      </div>

      <h3>An unusual EQA result is not always analyser bias</h3>
      <p>{INVESTIGATE_WHOLE_EQA_PROCESS_NOTE}</p>
      <ul className="mini-explain-list">{EQA_PROCESS_ERROR_TYPES.map((t, i) => <li key={i}>{t}</li>)}</ul>
    </div>
  );
}

/* ---------------------------- COMPARABILITY LAB ---------------------------- */
export function ComparabilityLabPanel({ markProgress, goto }) {
  const [touched, setTouched] = useState(false);
  useEffect(() => { if (touched) markProgress("external-assurance"); }, [touched]);

  return (
    <div>
      <h3>Scope</h3>
      <p>{COMPARABILITY_LAB_SCOPE_NOTE}</p>
      <p className="callout-inline">{DESIGNATED_COMPARATOR_NOTE}</p>
      <details className="important-note">
        <summary>What this lab deliberately excludes</summary>
        <ul className="mini-explain-list">{EXCLUDED_METHOD_COMPARISON_STATISTICS.map((s, i) => <li key={i}>{s}</li>)}</ul>
        <p className="muted small">{EXCLUDED_STATISTICS_NOTE}</p>
      </details>

      <h3>Paired patient specimens — Analyzer A vs. Analyzer B</h3>
      <PairedComparisonTable specimens={COMPARABILITY_PAIRED_SPECIMENS} criterion={COMPARABILITY_LAB_ILLUSTRATIVE_CRITERION} onTouch={() => setTouched(true)} />
      <button className="btn-secondary" onClick={() => setTouched(true)}>Mark as reviewed</button>

      <h3>Two traps</h3>
      <div className="compare-grid">
        <div className="compare-col exercise-reveal-card">
          <h4>Control-material trap</h4>
          <p className="muted small">{CONTROL_MATERIAL_TRAP_CASE.narrative}</p>
          <ExerciseRevealCard title="" prompt={CONTROL_MATERIAL_TRAP_CASE.question} answer={CONTROL_MATERIAL_TRAP_CASE.correctAnswer} note={CONTROL_MATERIAL_TRAP_CASE.explanation} />
        </div>
        <div className="compare-col exercise-reveal-card">
          <h4>Patient-comparison trap</h4>
          <p className="muted small">{PATIENT_COMPARISON_TRAP_CASE.narrative}</p>
          <ExerciseRevealCard title="" prompt={PATIENT_COMPARISON_TRAP_CASE.question} answer={PATIENT_COMPARISON_TRAP_CASE.correctAnswer} note={PATIENT_COMPARISON_TRAP_CASE.explanation} />
        </div>
      </div>

      <h3>Longitudinal comparability</h3>
      <LongitudinalComparabilityTable rows={LONGITUDINAL_COMPARABILITY_SUMMARY} />
      <p className="callout-inline">{NOT_EVERY_DIFFERENCE_CLINICALLY_IMPORTANT_NOTE}</p>

      <p className="muted small"><button className="btn-link" onClick={() => goto("investigation")}>{EXPLORE_INVESTIGATION_LINK_LABEL}</button> — {NO_AUTO_TRANSFER_BETWEEN_MODULES_NOTE}</p>
    </div>
  );
}

/* ---------------------------- LONGITUDINAL CHALLENGE ---------------------------- */
export const DEFAULT_EQA_CASE_ANSWER = {
  stageIdx: 0, targetTypeId: null, commutabilityJudgementId: null, capabilityConclusionId: null,
  patternJudgementId: null, longitudinalRelevanceId: null, nextActionId: null, confidence: null, completed: false
};

export function canAdvanceEqaStage(stageId, ans) {
  switch (stageId) {
    case "target": return ans.targetTypeId != null;
    case "commutability": return ans.commutabilityJudgementId != null;
    case "capability": return ans.capabilityConclusionId != null;
    case "pattern": return ans.patternJudgementId != null;
    case "longitudinal": return ans.longitudinalRelevanceId != null;
    case "next-step": return ans.nextActionId != null;
    default: return false;
  }
}

export function LongitudinalChallengePanel({ markProgress, goto }) {
  const [idx, setIdx] = useState(0);
  const [byCase, setByCase] = useState({});
  const kase = EXTERNAL_ASSURANCE_CASES[idx];
  const ans = byCase[kase.id] || DEFAULT_EQA_CASE_ANSWER;
  const stageId = EXTERNAL_ASSURANCE_STAGES[ans.stageIdx];

  const anyCompleted = Object.values(byCase).some(a => a.completed);
  useEffect(() => { if (anyCompleted) markProgress("external-assurance"); }, [anyCompleted]);

  function update(patch) { setByCase(b => ({ ...b, [kase.id]: { ...ans, ...patch } })); }
  function goStage(delta) { update({ stageIdx: Math.max(0, Math.min(EXTERNAL_ASSURANCE_STAGES.length - 1, ans.stageIdx + delta)) }); }
  function submitCase() { update({ completed: true }); }

  const completedCases = Object.keys(byCase).map(k => byCase[k]).filter(a => a.completed);
  const attempted = completedCases.length;
  const scoreFor = key => completedCases.filter(a => {
    const s = EXTERNAL_ASSURANCE_CASES.find(sc => byCase[sc.id] === a);
    if (!s) return false;
    if (key === "target") return a.targetTypeId === s.correctTargetTypeId;
    if (key === "commutability") return a.commutabilityJudgementId === s.correctCommutabilityJudgementId;
    if (key === "capability") return a.capabilityConclusionId === s.correctCapabilityConclusionId;
    if (key === "pattern") return a.patternJudgementId === s.correctPatternJudgementId;
    if (key === "longitudinal") return a.longitudinalRelevanceId === s.correctLongitudinalRelevanceId;
    if (key === "next-step") return a.nextActionId === s.correctNextActionId;
    return false;
  }).length;

  return (
    <div>
      <h3>Single event vs. trend</h3>
      <p>{SINGLE_EVENT_VS_TREND_NOTE}</p>
      <h4>Ten-round reference timeline</h4>
      <LongitudinalEqaChart timeline={LONGITUDINAL_EQA_TIMELINE} criterionLabel="±10% (illustrative for this timeline)" />
      <p className="muted small">{LONGITUDINAL_TIMELINE_TEACHING_NOTE}</p>
      <p className="callout-inline">{NO_AUTOMATIC_TREND_ROOT_CAUSE_NOTE}</p>

      <details className="important-note">
        <summary>EQA investigation path (a reasoning framework, not a mandated sequence)</summary>
        <ol className="mini-explain-list">{EQA_INVESTIGATION_PATH_STEPS.map((s, i) => <li key={i}>{s}</li>)}</ol>
        <p className="muted small">{EQA_INVESTIGATION_PATH_CAUTION}</p>
      </details>

      <details className="important-note">
        <summary>Four guardrails that hold throughout this challenge bank</summary>
        <ul className="mini-explain-list">
          <li>{NO_EQA_PASS_EQUALS_METHOD_VALID_NOTE}</li>
          <li>{NO_EQA_FAIL_EQUALS_PATIENT_RESULTS_WRONG_NOTE}</li>
          <li>{NO_PEER_MEAN_EQUALS_REFERENCE_VALUE_NOTE}</li>
          <li>{NO_COMMUTABLE_EQUALS_PERFECT_NOTE}</li>
        </ul>
        <p className="muted small">{NO_AUTO_PATIENT_IMPACT_FROM_EQA_NOTE}</p>
      </details>

      <h3>External Assurance Challenge Bank</h3>
      <p className="muted">Fourteen deterministic, integrated cases. Work through each reasoning stage in order.</p>
      <div className="challenge-nav">
        {EXTERNAL_ASSURANCE_CASES.map((s, i) => (
          <button key={s.id} className={"case-chip" + (i === idx ? " case-chip-active" : "") + ((byCase[s.id] && byCase[s.id].completed) ? " case-chip-done" : "")}
            onClick={() => setIdx(i)} aria-current={i === idx}>{s.id}</button>
        ))}
      </div>

      <div className="case-panel">
        <h2>{kase.title}</h2>
        {kase.iqcNarrative && <p className="muted small">IQC: {kase.iqcNarrative}</p>}
        {!kase.iqcNarrative && kase.iqcStatus && <p className="muted small">IQC status: {humanizeEqaStatus(kase.iqcStatus)}</p>}
        <div className="tabbar reasoning-stage-bar" role="tablist" aria-label="Reasoning stage">
          {EXTERNAL_ASSURANCE_STAGES.map((s, i) => (
            <button key={s} role="tab" aria-selected={i === ans.stageIdx} disabled={i > ans.stageIdx}
              className={"tab" + (i === ans.stageIdx ? " tab-active" : "")}
              onClick={() => i <= ans.stageIdx && update({ stageIdx: i })}>{EQA_STAGE_LABELS[s]}</button>
          ))}
        </div>

        {stageId === "target" && (
          <div className="question-block">
            {kase.eqaResult && <EqaReportCard result={kase.eqaResult} />}
            <p className="q-prompt">What type of target value is being used here?</p>
            <div className="option-list option-list-grid">
              {TARGET_VALUE_TYPE_DESCRIPTIONS.map(t => (
                <button key={t.id} className={"option-btn small" + (ans.targetTypeId === t.id ? " option-selected" : "")} onClick={() => update({ targetTypeId: t.id })}>{TARGET_VALUE_TYPE_LABELS[t.id]}</button>
              ))}
            </div>
          </div>
        )}

        {stageId === "commutability" && (
          <div className="question-block">
            <p className="q-prompt">What is the commutability status of the material used in this round?</p>
            <div className="option-list option-list-grid">
              {COMMUTABILITY_STATUS_DESCRIPTIONS.map(c => (
                <button key={c.id} className={"option-btn small" + (ans.commutabilityJudgementId === c.id ? " option-selected" : "")} onClick={() => update({ commutabilityJudgementId: c.id })}><EqaStatusBadge kind="commutability" value={c.id} /></button>
              ))}
            </div>
            <p className="callout-inline">{UNKNOWN_NOT_EQUAL_FAILED_NOTE}</p>
          </div>
        )}

        {stageId === "capability" && (
          <div className="question-block">
            {kase.eqaResult && kase.eqaResult.schemeCapability && <SchemeCapabilityProfileDisplay profile={kase.eqaResult.schemeCapability} />}
            <p className="q-prompt">What can this scheme's design actually support?</p>
            <div className="option-list">
              {CAPABILITY_CONCLUSION_OPTIONS.map(o => (
                <button key={o.id} className={"option-btn" + (ans.capabilityConclusionId === o.id ? " option-selected" : "")} onClick={() => update({ capabilityConclusionId: o.id })}>{o.label}</button>
              ))}
            </div>
          </div>
        )}

        {stageId === "pattern" && (
          <div className="question-block">
            {kase.comparability && (
              <div className="exercise-reveal-card">
                <p className="muted small">{kase.comparability.narrative || kase.comparability.patientSampleAgreement}</p>
                {kase.comparability.methodA != null && <p className="muted small">Method A: {kase.comparability.methodA}, Method B: {kase.comparability.methodB}</p>}
              </div>
            )}
            <p className="q-prompt">Is this deviation participant-specific, or shared by the method group?</p>
            <div className="option-list">
              {PATTERN_JUDGEMENT_OPTIONS.map(o => (
                <button key={o.id} className={"option-btn" + (ans.patternJudgementId === o.id ? " option-selected" : "")} onClick={() => update({ patternJudgementId: o.id })}>{o.label}</button>
              ))}
            </div>
            <p className="callout-inline">{PEER_GROUP_NOT_TRUTH_PRINCIPLE}</p>
          </div>
        )}

        {stageId === "longitudinal" && (
          <div className="question-block">
            {kase.longitudinal ? <LongitudinalEqaChart timeline={kase.longitudinal} /> : <p className="muted">No multi-round history is authored for this case.</p>}
            <p className="q-prompt">Does the longitudinal history change your interpretation?</p>
            <div className="option-list">
              {LONGITUDINAL_RELEVANCE_OPTIONS.map(o => (
                <button key={o.id} className={"option-btn" + (ans.longitudinalRelevanceId === o.id ? " option-selected" : "")} onClick={() => update({ longitudinalRelevanceId: o.id })}>{o.label}</button>
              ))}
            </div>
          </div>
        )}

        {stageId === "next-step" && (
          <div className="question-block">
            <p className="q-prompt">What is a reasonable next action?</p>
            <div className="option-list option-list-grid">
              {NEXT_ACTION_OPTIONS.map(o => (
                <button key={o.id} className={"option-btn small" + (ans.nextActionId === o.id ? " option-selected" : "")} onClick={() => update({ nextActionId: o.id })}>{o.label}</button>
              ))}
            </div>
          </div>
        )}

        {stageId === "confidence" && (
          <div className="question-block">
            <p className="q-prompt">How confident are you in your overall interpretation of this case?</p>
            <div className="option-list option-list-grid option-list-narrow">
              {CONFIDENCE_OPTIONS.map(o => <button key={o.id} className={"option-btn small" + (ans.confidence === o.id ? " option-selected" : "")} onClick={() => update({ confidence: o.id })}>{o.label}</button>)}
            </div>
            {!ans.completed ? (
              <button className="btn-primary" onClick={submitCase} disabled={!ans.confidence}>Submit case</button>
            ) : (
              <div className="feedback-panel">
                <h3>Feedback</h3>
                <EqaStatusRow {...kase.finalInterpretation} />
                <p><strong>Interpretation:</strong> {kase.finalInterpretation.summary}</p>
                <div>
                  <p><strong>Supports:</strong></p>
                  <ul className="mini-explain-list">{kase.finalInterpretation.supports.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
                <div>
                  <p><strong>Does not prove:</strong></p>
                  <ul className="mini-explain-list">{kase.finalInterpretation.doesNotProve.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
                <p><strong>Reasonable next action:</strong> {kase.finalInterpretation.reasonableNextAction}</p>
                <p className="callout-inline">{PEER_GROUP_NOT_TRUTH_PRINCIPLE}</p>
                <p className="muted small"><button className="btn-link" onClick={() => goto("investigation")}>{EXPLORE_INVESTIGATION_LINK_LABEL}</button> — {NO_AUTO_TRANSFER_BETWEEN_MODULES_NOTE}</p>
                <div className="btn-row">
                  {idx < EXTERNAL_ASSURANCE_CASES.length - 1 && <button className="btn-secondary" onClick={() => setIdx(idx + 1)}>Next case</button>}
                  {idx > 0 && <button className="btn-link" onClick={() => setIdx(idx - 1)}>Previous case</button>}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="btn-row stage-nav-row">
          {ans.stageIdx > 0 && <button className="btn-link" onClick={() => goStage(-1)}>← Back</button>}
          {stageId !== "confidence" && <button className="btn-secondary" onClick={() => goStage(1)} disabled={!canAdvanceEqaStage(stageId, ans)}>Next stage →</button>}
        </div>
      </div>

      <div className="score-summary">
        <h3>Session scoring ({attempted} / {EXTERNAL_ASSURANCE_CASES.length} cases completed)</h3>
        <div className="metric-row">
          <MetricCard label="Target-type identification" value={scoreFor("target") + " / " + attempted} />
          <MetricCard label="Commutability judgement" value={scoreFor("commutability") + " / " + attempted} />
          <MetricCard label="Capability conclusion" value={scoreFor("capability") + " / " + attempted} />
          <MetricCard label="Pattern judgement" value={scoreFor("pattern") + " / " + attempted} />
          <MetricCard label="Longitudinal relevance" value={scoreFor("longitudinal") + " / " + attempted} />
          <MetricCard label="Next action" value={scoreFor("next-step") + " / " + attempted} />
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- SCREEN SHELL ---------------------------- */
export function ExternalAssuranceLabScreen({ level, markProgress, goto }) {
  const [mode, setMode] = useState("iqc-vs-eqa");

  return (
    <div className="screen">
      <h1>External Assurance Lab</h1>
      <p className="muted">EQA/PT, target assignment, commutability, peer-group interpretation, method comparability and longitudinal analytical assurance. This is an educational reasoning pathway — Internal stability → External comparison → Understand the target → Interpret deviation → Assess method/laboratory effect → Review longitudinally → Investigate — not a rigid universal sequence.</p>
      <RecoveryFlowDiagram steps={EXTERNAL_ASSURANCE_PATHWAY_STEPS} />
      <p className="callout-inline">{EXTERNAL_ASSURANCE_PATHWAY_CAUTION}</p>

      <div className="callout banner-callout">
        <h2 style={{ marginTop: 0 }}>Two core lessons</h2>
        <p>{GOOD_IQC_DOES_NOT_PROVE_TRUENESS_NOTE}</p>
        <p>{POOR_EQA_DOES_NOT_AUTOMATICALLY_PROVE_BIAS_NOTE}</p>
      </div>

      <div className="tabbar" role="tablist" aria-label="External Assurance Lab mode">
        {EXTERNAL_ASSURANCE_MODES.map(m => (
          <button key={m.id} role="tab" aria-selected={mode === m.id}
            className={"tab" + (mode === m.id ? " tab-active" : "")}
            onClick={() => setMode(m.id)}>{m.label}</button>
        ))}
      </div>

      {mode === "iqc-vs-eqa" && <IqcVsEqaPanel markProgress={markProgress} />}
      {mode === "target-lab" && <EqaTargetLabPanel markProgress={markProgress} />}
      {mode === "report-interpreter" && <EqaReportInterpreterPanel markProgress={markProgress} />}
      {mode === "comparability-lab" && <ComparabilityLabPanel markProgress={markProgress} goto={goto} />}
      {mode === "longitudinal-challenge" && <LongitudinalChallengePanel markProgress={markProgress} goto={goto} />}

      <ScientificBasisNote goto={goto} text="This lab draws on the framework Miller et al. (2011, Clin Chem) described for EQA/PT capability, Miller & Myers (2013, Clin Chem) on commutability, harmonisation literature (Jones 2017; Ceriotti & Cobbaert 2018), Secchiero & Plebani (2015) and Weykamp et al. (2017) on scheme design and traceability, alongside ISO 15189:2022 and ISO/IEC 17043 — see the Evidence page for full provenance, evidentiary tier, and scope." />
    </div>
  );
}
