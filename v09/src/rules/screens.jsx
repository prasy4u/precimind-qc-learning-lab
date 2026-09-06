/* =========================================================================
   Rule Laboratory — screen: three internal modes (Learn the Rules,
   Inspect a QC Sequence, Rule Detective). All detection is delegated to
   07-rules.js; nothing in this file recomputes or hand-codes a "correct"
   answer that isn't cross-checked against the live engine.
   ========================================================================= */

const RULE_LAB_MODES = [
  { id: "learn", label: "Learn the Rules" },
  { id: "inspect", label: "Inspect a QC Sequence" },
  { id: "detective", label: "Rule Detective" }
];

function setsEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

/* ---------------------------- LEARN THE RULES ---------------------------- */
function LearnRulesPanel() {
  const [ruleId, setRuleId] = useState(RULE_DEFINITIONS[0].id);
  const [revealed, setRevealed] = useState(false);
  const rule = RULE_DEFINITIONS.find(r => r.id === ruleId);
  const events = useMemo(() => evaluateRuleSet(rule.demoRuns, [rule.id]), [ruleId]);
  const revealKeys = useMemo(() => {
    if (!revealed) return null;
    const s = new Set();
    events.forEach(e => e.triggerPoints.forEach(p => s.add(keyFor(p.runNumber, p.levelId))));
    return s;
  }, [revealed, events]);

  function selectRule(id) { setRuleId(id); setRevealed(false); }

  return (
    <div>
      <p className="muted">Select a rule to see its definition and an original, small demonstration dataset (not a reproduction of any proprietary Westgard chart), then run the actual detector against it.</p>
      <div className="tabbar" role="tablist" aria-label="Select a rule to learn">
        {RULE_DEFINITIONS.map(r => (
          <button key={r.id} role="tab" aria-selected={r.id === ruleId}
            className={"tab" + (r.id === ruleId ? " tab-active" : "")}
            onClick={() => selectRule(r.id)}>{r.label}</button>
        ))}
      </div>

      <div className="rule-detail-panel">
        <div className="rule-detail-head">
          <h2>{rule.label}</h2>
          <Badge tone={rule.status === "warning" ? "warn-badge" : "rejection-badge"}>{rule.status === "warning" ? "Warning criterion" : "Rejection criterion"}</Badge>
        </div>
        <dl className="evidence-fields">
          <dt>Definition</dt><dd>{rule.definition}</dd>
          <dt>Scope</dt><dd>{rule.scope}</dd>
          <dt>Typical interpretation</dt><dd>{rule.typicalInterpretation}</dd>
          <dt>What it does NOT tell you</dt><dd>{rule.whatItDoesNotTellYou}</dd>
          {rule.configurationNote && <><dt>Relation to N×R configuration</dt><dd>{rule.configurationNote}</dd></>}
        </dl>

        <MultiLevelLJChart runs={rule.demoRuns} showL1={true} showL2={true} revealKeys={revealKeys} decimals={2} />

        <div className="btn-row">
          {!revealed
            ? <button className="btn-primary" onClick={() => setRevealed(true)}>Run detection</button>
            : <button className="btn-secondary" onClick={() => setRevealed(false)}>Hide detected events</button>}
        </div>

        {revealed && (
          events.length
            ? events.map((e, i) => <EventCard key={rule.id + i} event={e} />)
            : <p className="event-list-empty">No {rule.label} violation is present in this demonstration dataset.</p>
        )}
      </div>
    </div>
  );
}

/* ---------------------------- INSPECT A QC SEQUENCE ---------------------------- */
function InspectSequencePanel({ markProgress }) {
  const [enabled, setEnabled] = useState(() => {
    const o = {}; RULE_ORDER.forEach(id => { o[id] = true; }); return o;
  });
  const [workflow, setWorkflow] = useState("classic");
  const [showL1, setShowL1] = useState(true);
  const [showL2, setShowL2] = useState(true);
  const [unitMode, setUnitMode] = useState("z");
  const [touched, setTouched] = useState(false);

  useEffect(() => { if (touched) markProgress("rules"); }, [touched]);

  const enabledRuleIds = RULE_ORDER.filter(id => enabled[id]);
  const events = useMemo(() => evaluateRuleSet(INSPECTOR_DEFAULT_RUNS, enabledRuleIds), [enabled]);
  const warningEvents = events.filter(e => e.status === "warning");
  const rejectionEvents = events.filter(e => e.status === "rejection");
  const warningRuns = new Set(warningEvents.flatMap(e => e.runNumbers));

  function toggleRule(id) { setEnabled(e => ({ ...e, [id]: !e[id] })); setTouched(true); }

  return (
    <div>
      <p className="muted">One deterministic 20-run, two-level sequence for free exploration. Toggle rules on or off, compare the classic and direct workflows, and inspect any point on the chart. Nothing here infers a root cause automatically.</p>

      <div className="control-row">
        <div className="control-group">
          <span className="control-group-label">Enabled rules</span>
          <div className="checkbox-row">
            {RULE_ORDER.map(id => (
              <label key={id}>
                <input type="checkbox" checked={!!enabled[id]} onChange={() => toggleRule(id)} />
                {RULE_LABELS[id]}
              </label>
            ))}
          </div>
        </div>
        <div className="control-group">
          <span className="control-group-label">Evaluation workflow</span>
          <div className="segmented">
            <button className={"seg" + (workflow === "classic" ? " seg-active" : "")} onClick={() => { setWorkflow("classic"); setTouched(true); }}>Classic (warning-gated)</button>
            <button className={"seg" + (workflow === "direct" ? " seg-active" : "")} onClick={() => { setWorkflow("direct"); setTouched(true); }}>Direct evaluation</button>
          </div>
        </div>
        <div className="control-group">
          <span className="control-group-label">Chart units</span>
          <div className="segmented">
            <button className={"seg" + (unitMode === "z" ? " seg-active" : "")} onClick={() => setUnitMode("z")}>SD units</button>
            <button className={"seg" + (unitMode === "raw" ? " seg-active" : "")} onClick={() => setUnitMode("raw")}>Raw value</button>
          </div>
        </div>
      </div>

      <div className="level-toggles">
        <label><input type="checkbox" checked={showL1} onChange={e => setShowL1(e.target.checked)} /> Show Level 1</label>
        <label><input type="checkbox" checked={showL2} onChange={e => setShowL2(e.target.checked)} /> Show Level 2</label>
      </div>

      <MultiLevelLJChart runs={INSPECTOR_DEFAULT_RUNS} showL1={showL1} showL2={showL2} unitMode={unitMode} decimals={2} />

      <h3>Detected events ({events.length})</h3>
      {workflow === "classic" ? (
        <>
          <p className="callout-inline">{CLASSIC_MODE_NOTE}</p>
          <h4>Step 1 — warning signals (1₂s)</h4>
          {warningEvents.length
            ? warningEvents.map((e, i) => <EventCard key={"w" + i} event={e} />)
            : <p className="event-list-empty">No 1₂s warning is present with the currently enabled rules.</p>}
          <h4>Step 2 — rejection criteria inspected as a result</h4>
          {rejectionEvents.length ? rejectionEvents.map((e, i) => (
            <div key={"r" + i}>
              <EventCard event={e} />
              {!e.runNumbers.some(rn => warningRuns.has(rn)) && (
                <p className="muted small">This rejection-rule violation is mathematically present even though no 1₂s warning occurred in the same run — the underlying calculation is identical regardless of which workflow is used to look for it.</p>
              )}
            </div>
          )) : <p className="event-list-empty">No rejection-rule violation is present with the currently enabled rules.</p>}
        </>
      ) : (
        <>
          <p className="callout-inline">{DIRECT_MODE_NOTE}</p>
          {events.length
            ? events.map((e, i) => <EventCard key={"d" + i} event={e} />)
            : <p className="event-list-empty">No rule violation is detected with the currently enabled rules.</p>}
        </>
      )}
    </div>
  );
}

/* ---------------------------- RULE DETECTIVE ---------------------------- */
const DEFAULT_DETECTIVE_ANSWER = { rules: [], points: null, scope: null, confidence: null, submitted: false };

function RuleDetectivePanel({ level, markProgress }) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const kase = DETECTIVE_CASES[idx];
  const ans = answers[kase.id] || DEFAULT_DETECTIVE_ANSWER;
  const points = ans.points || new Set();

  const allSubmitted = DETECTIVE_CASES.every(c => answers[c.id] && answers[c.id].submitted);
  useEffect(() => { if (allSubmitted) markProgress("rules"); }, [allSubmitted]);

  function updateAns(patch) {
    setAnswers(a => ({ ...a, [kase.id]: { ...ans, points, ...patch } }));
  }

  const isNoneSelected = ans.rules.length === 1 && ans.rules[0] === "none";

  function toggleRuleChoice(id) {
    if (ans.submitted) return;
    let rules;
    if (id === "none") {
      rules = ans.rules.includes("none") ? [] : ["none"];
    } else {
      rules = ans.rules.filter(r => r !== "none");
      rules = rules.includes(id) ? rules.filter(r => r !== id) : rules.concat([id]);
    }
    updateAns({ rules, points: new Set(), scope: null });
  }

  function togglePoint(runNumber, levelId) {
    if (ans.submitted || isNoneSelected || ans.rules.length === 0) return;
    const k = keyFor(runNumber, levelId);
    const next = new Set(points);
    if (next.has(k)) next.delete(k); else next.add(k);
    updateAns({ points: next });
  }

  function chooseScope(id) {
    if (ans.submitted) return;
    updateAns({ scope: id });
  }
  function chooseConfidence(id) {
    if (ans.submitted) return;
    updateAns({ confidence: id });
  }

  const canSubmit = ans.rules.length > 0 && ans.confidence &&
    (isNoneSelected || (ans.scope && points.size > 0));

  function submit() {
    if (!canSubmit) return;
    updateAns({ submitted: true });
  }

  /* Ground truth is derived live from the actual engine restricted to the
     pedagogically-intended rule(s) for this case — never hand-typed. */
  const correctRuleId = kase.correctRules[0] === "none" ? null : kase.correctRules[0];
  const truthEvents = useMemo(() => correctRuleId ? evaluateRuleSet(kase.runs, [correctRuleId]) : [], [kase.id]);
  const truthKeys = useMemo(() => {
    const s = new Set();
    truthEvents.forEach(e => e.triggerPoints.forEach(p => s.add(keyFor(p.runNumber, p.levelId))));
    return s;
  }, [truthEvents]);

  const rulesSorted = ans.rules.slice().sort();
  const correctRulesSorted = kase.correctRules.slice().sort();
  const ruleCorrect = JSON.stringify(rulesSorted) === JSON.stringify(correctRulesSorted);
  const pointsCorrect = isNoneSelected ? points.size === 0 : setsEqual(points, truthKeys);
  const scopeCorrect = kase.correctScope === null ? true : ans.scope === kase.correctScope;
  const wasFullyCorrect = ans.submitted && ruleCorrect && pointsCorrect && scopeCorrect;

  const ruleScore = DETECTIVE_CASES.reduce((acc, c) => {
    const a = answers[c.id];
    if (!a || !a.submitted) return acc;
    return acc + (JSON.stringify(a.rules.slice().sort()) === JSON.stringify(c.correctRules.slice().sort()) ? 1 : 0);
  }, 0);
  const scopeScore = DETECTIVE_CASES.reduce((acc, c) => {
    const a = answers[c.id];
    if (!a || !a.submitted) return acc;
    const ok = c.correctScope === null ? true : a.scope === c.correctScope;
    return acc + (ok ? 1 : 0);
  }, 0);
  const pointScore = DETECTIVE_CASES.reduce((acc, c) => {
    const a = answers[c.id];
    if (!a || !a.submitted) return acc;
    const isNone = a.rules.length === 1 && a.rules[0] === "none";
    const cid = c.correctRules[0] === "none" ? null : c.correctRules[0];
    const tk = new Set();
    if (cid) evaluateRuleSet(c.runs, [cid]).forEach(e => e.triggerPoints.forEach(p => tk.add(keyFor(p.runNumber, p.levelId))));
    const ok = isNone ? (a.points ? a.points.size === 0 : true) : setsEqual(a.points || new Set(), tk);
    return acc + (ok ? 1 : 0);
  }, 0);
  const attemptedCount = DETECTIVE_CASES.filter(c => answers[c.id] && answers[c.id].submitted).length;

  const correctRuleLabel = correctRuleId
    ? (RULE_OPTIONS_FOR_CHALLENGE.find(o => o.id === correctRuleId) || {}).label
    : "No defined rule violation";
  const correctScopeLabel = kase.correctScope
    ? (SCOPE_OPTIONS_FOR_CHALLENGE.find(o => o.id === kase.correctScope) || {}).label
    : "Not applicable — no rule violation was identified";
  const whySatisfied = truthEvents.length
    ? truthEvents[0].educationalInterpretation
    : "No observation in this sequence exceeds any defined rule threshold, regardless of how the points are grouped.";

  return (
    <div>
      <p className="muted">Twelve deterministic cases. For each: (A) decide which rule, if any, applies; (B) click the actual observation(s) that trigger it on the chart; (C) classify its scope; (D) record your confidence; then commit for full feedback. Not every case contains a violation.</p>

      <div className="challenge-nav">
        {DETECTIVE_CASES.map((c, i) => (
          <button key={c.id} className={"case-chip" + (i === idx ? " case-chip-active" : "") + (answers[c.id] && answers[c.id].submitted ? " case-chip-done" : "")}
            onClick={() => setIdx(i)} aria-current={i === idx}>{c.id}</button>
        ))}
      </div>

      <div className="case-panel">
        <h2>Case {kase.id} of {DETECTIVE_CASES.length}</h2>

        <MultiLevelLJChart runs={kase.runs} showL1={true} showL2={true}
          onPointClick={togglePoint}
          selectedKeys={points}
          revealKeys={ans.submitted ? truthKeys : null}
          decimals={2} />

        <div className="question-block">
          <p className="q-prompt">A — Which rule, if any, applies?</p>
          <div className="option-list option-list-grid">
            {RULE_OPTIONS_FOR_CHALLENGE.map(o => (
              <button key={o.id} disabled={ans.submitted}
                className={"option-btn small" + (ans.rules.includes(o.id) ? " option-selected" : "")}
                onClick={() => toggleRuleChoice(o.id)}>{o.label}</button>
            ))}
          </div>
          <p className="muted small">More than one rule may apply at once; select all that do. Choosing "No defined rule violation" clears any other selection.</p>
        </div>

        {!isNoneSelected && ans.rules.length > 0 && (
          <div className="question-block">
            <p className="q-prompt">B — Click the actual triggering observation(s) on the chart above.</p>
            <p className="point-selection-hint">Selected: {points.size === 0 ? "none yet" : Array.from(points).join(", ")}</p>
          </div>
        )}

        {!isNoneSelected && ans.rules.length > 0 && (
          <div className="question-block">
            <p className="q-prompt">C — What is the scope of this pattern?</p>
            <div className="option-list option-list-grid">
              {SCOPE_OPTIONS_FOR_CHALLENGE.map(o => (
                <button key={o.id} disabled={ans.submitted}
                  className={"option-btn small" + (ans.scope === o.id ? " option-selected" : "")}
                  onClick={() => chooseScope(o.id)}>{o.label}</button>
              ))}
            </div>
          </div>
        )}
        {isNoneSelected && (
          <p className="detective-scope-note">Trigger-point selection and scope classification are not applicable — no rule violation was selected.</p>
        )}

        <div className="question-block">
          <p className="q-prompt">D — How confident are you in this interpretation?</p>
          <div className="option-list option-list-grid option-list-narrow">
            {CONFIDENCE_OPTIONS.map(o => (
              <button key={o.id} disabled={ans.submitted}
                className={"option-btn small" + (ans.confidence === o.id ? " option-selected" : "")}
                onClick={() => chooseConfidence(o.id)}>{o.label}</button>
            ))}
          </div>
          <p className="muted small">Confidence is recorded for reflection only — it does not change your score.</p>
        </div>

        {!ans.submitted ? (
          <button className="btn-primary" onClick={submit} disabled={!canSubmit}>Commit interpretation</button>
        ) : (
          <div className="feedback-panel">
            <h3>Feedback</h3>
            <p><strong>Your rule selection:</strong> {ans.rules.map(r => (RULE_OPTIONS_FOR_CHALLENGE.find(o => o.id === r) || {}).label).join(", ")} {ruleCorrect ? "— correct" : "— not the intended answer"}</p>
            <p><strong>Expected interpretation:</strong> {correctRuleLabel}</p>
            <p><strong>Triggering observations:</strong> {truthKeys.size ? Array.from(truthKeys).join(", ") : "None — no rule was triggered"} {pointsCorrect ? "(your selection matched)" : "(your selection did not fully match)"}</p>
            <p><strong>Why satisfied:</strong> {whySatisfied}</p>
            <p><strong>Why tempting alternatives are not satisfied:</strong> {kase.temptingAlternative}</p>
            <p><strong>Scope:</strong> {correctScopeLabel} {kase.correctScope ? (scopeCorrect ? "— correct" : "— not the intended answer") : ""}</p>
            <p><strong>What it suggests:</strong> {kase.whatItSuggests}</p>
            <p><strong>What it does not prove:</strong> {kase.whatItDoesNotProve}</p>
            <p><strong>On your confidence:</strong> {getConfidenceNote(ans.confidence, wasFullyCorrect)}</p>
            <div className="btn-row">
              {idx < DETECTIVE_CASES.length - 1 && <button className="btn-secondary" onClick={() => setIdx(idx + 1)}>Next case</button>}
              {idx > 0 && <button className="btn-link" onClick={() => setIdx(idx - 1)}>Previous case</button>}
            </div>
          </div>
        )}
      </div>

      <div className="score-summary">
        <h3>Session score ({attemptedCount} / {DETECTIVE_CASES.length} attempted)</h3>
        <div className="metric-row">
          <MetricCard label="Rule identification" value={ruleScore + " / " + DETECTIVE_CASES.length} />
          <MetricCard label="Trigger-point identification" value={pointScore + " / " + DETECTIVE_CASES.length} />
          <MetricCard label="Scope classification" value={scopeScore + " / " + DETECTIVE_CASES.length} />
        </div>
        {allSubmitted && <p className="muted">All cases attempted for this session. This score reflects a short prototype exercise and is not a competency certification.</p>}
      </div>
    </div>
  );
}

/* ---------------------------- SCREEN SHELL ---------------------------- */
function RuleLaboratoryScreen({ level, markProgress, goto }) {
  const [mode, setMode] = useState("learn");

  return (
    <div className="screen">
      <h1>Rule Laboratory</h1>
      <p className="muted">{RULE_LAB_INTRO}</p>
      <ScientificBasisNote goto={goto} text="Rule definitions and scopes reflect widely taught statistical QC concepts; see Evidence for CLSI C24 and Westgard-literature context and explicit non-endorsement statements." />
      <details className="basis-note">
        <summary>What is a "run"?</summary>
        <p>{RUN_CONCEPT_NOTE}</p>
      </details>

      <div className="tabbar" role="tablist" aria-label="Rule Laboratory mode">
        {RULE_LAB_MODES.map(m => (
          <button key={m.id} role="tab" aria-selected={mode === m.id}
            className={"tab" + (mode === m.id ? " tab-active" : "")}
            onClick={() => setMode(m.id)}>{m.label}</button>
        ))}
      </div>

      {mode === "learn" && <LearnRulesPanel />}
      {mode === "inspect" && <InspectSequencePanel markProgress={markProgress} />}
      {mode === "detective" && <RuleDetectivePanel level={level} markProgress={markProgress} />}

      <details className="important-note">
        <summary>About false rejection (qualitative only)</summary>
        <p className="muted small">{FALSE_REJECTION_NOTE}</p>
      </details>
      <div className="callout">{DECISION_GUARDRAIL_NOTE}</div>
    </div>
  );
}
