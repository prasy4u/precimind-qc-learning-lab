import { BvRcvLabScreen } from "../bv/screens.jsx";
import { ExternalAssuranceLabScreen } from "../eqa/screens.jsx";
import { InvestigationLabScreen } from "../investigation/screens.jsx";
import { PatientSurveillanceLabScreen } from "../pbrtqc/screens.jsx";
import { RiskFrequencyLabScreen } from "../risk/screens.jsx";
import { RuleLaboratoryScreen } from "../rules/screens.jsx";
import { QCStrategyLabScreen } from "../strategy/screens.jsx";
import { LEVELS, LEVEL_LABELS } from "./app-data.js";
import { AboutModal, CompetencyMapScreen, DiagnosticModal, EvidenceScreen, GlossaryModal, HomeScreen, LJLabScreen, PatternChallengeScreen, SigmaSandboxScreen, StatsPlaygroundScreen } from "./core-screens.jsx";
import { useState, useMemo, useRef, useEffect } from "react";

/* =========================================================================
   Application shell
   ========================================================================= */

export const NAV_ITEMS = [
  { key: "home", label: "Home" },
  { key: "map", label: "Competency Map" },
  { key: "stats", label: "Statistics Playground" },
  { key: "lj", label: "LJ Laboratory" },
  { key: "pattern", label: "Pattern Challenge" },
  { key: "rules", label: "Rule Laboratory" },
  { key: "strategy", label: "QC Strategy Lab" },
  { key: "sigma", label: "Sigma Sandbox" },
  { key: "risk", label: "Risk & Frequency Lab" },
  { key: "investigation", label: "Investigation Lab" },
  { key: "external-assurance", label: "External Assurance Lab" },
  { key: "bv-rcv", label: "BV & RCV Lab" },
  { key: "pbrtqc", label: "Patient Surveillance Lab" },
  { key: "evidence", label: "Evidence" }
];

export function App() {
  const [level, setLevel] = useState("beginner");
  const [screen, setScreen] = useState("home");
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [progress, setProgress] = useState({ stats: false, lj: false, pattern: false, rules: false, strategy: false, sigma: false, risk: false, investigation: false, "external-assurance": false, "bv-rcv": false, pbrtqc: false });

  function markProgress(key) {
    setProgress(p => (p[key] ? p : { ...p, [key]: true }));
  }

  function goto(key) {
    setScreen(key);
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  let body;
  if (screen === "home") body = <HomeScreen level={level} setLevel={setLevel} goto={goto} openDiagnostic={() => setShowDiagnostic(true)} />;
  else if (screen === "map") body = <CompetencyMapScreen level={level} goto={goto} progress={progress} />;
  else if (screen === "stats") body = <StatsPlaygroundScreen level={level} markProgress={markProgress} goto={goto} />;
  else if (screen === "lj") body = <LJLabScreen level={level} markProgress={markProgress} goto={goto} />;
  else if (screen === "pattern") body = <PatternChallengeScreen level={level} markProgress={markProgress} />;
  else if (screen === "rules") body = <RuleLaboratoryScreen level={level} markProgress={markProgress} goto={goto} />;
  else if (screen === "strategy") body = <QCStrategyLabScreen level={level} markProgress={markProgress} goto={goto} />;
  else if (screen === "sigma") body = <SigmaSandboxScreen level={level} markProgress={markProgress} goto={goto} />;
  else if (screen === "risk") body = <RiskFrequencyLabScreen level={level} markProgress={markProgress} goto={goto} />;
  else if (screen === "investigation") body = <InvestigationLabScreen level={level} markProgress={markProgress} goto={goto} />;
  else if (screen === "external-assurance") body = <ExternalAssuranceLabScreen level={level} markProgress={markProgress} goto={goto} />;
  else if (screen === "bv-rcv") body = <BvRcvLabScreen level={level} markProgress={markProgress} goto={goto} />;
  else if (screen === "pbrtqc") body = <PatientSurveillanceLabScreen level={level} markProgress={markProgress} goto={goto} />;
  else if (screen === "evidence") body = <EvidenceScreen />;

  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">Skip to main content</a>
      <header className="app-header">
        <div className="brand">
          <span className="brand-name">PreciMind</span>
          <span className="brand-sub">QC Learning Lab</span>
        </div>
        <nav className="main-nav" aria-label="Primary">
          {NAV_ITEMS.map(item => (
            <button key={item.key}
              className={"nav-btn" + (screen === item.key ? " nav-btn-active" : "")}
              aria-current={screen === item.key ? "page" : undefined}
              onClick={() => goto(item.key)}>{item.label}</button>
          ))}
        </nav>
        <div className="level-switcher">
          <label htmlFor="level-select">Current level</label>
          <select id="level-select" value={level} onChange={e => setLevel(e.target.value)}>
            {LEVELS.map(lv => <option key={lv} value={lv}>{LEVEL_LABELS[lv]}</option>)}
          </select>
        </div>
      </header>

      <main id="main" className="app-main">
        {body}
      </main>

      <footer className="app-footer">
        <div className="footer-brand">PreciMind QC Learning Lab</div>
        <div className="footer-tag">Educational simulation for analytical quality control.</div>
        <div className="footer-links">
          <button className="btn-link" onClick={() => goto("evidence")}>Evidence</button>
          <button className="btn-link" onClick={() => setShowGlossary(true)}>Glossary</button>
          <button className="btn-link" onClick={() => setShowAbout(true)}>About this prototype</button>
        </div>
      </footer>

      {showDiagnostic && <DiagnosticModal onClose={() => setShowDiagnostic(false)} onApply={setLevel} />}
      {showGlossary && <GlossaryModal onClose={() => setShowGlossary(false)} />}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  );
}

