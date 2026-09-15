import { BvRcvLabScreen } from "../bv/screens.jsx";
import { ExternalAssuranceLabScreen } from "../eqa/screens.jsx";
import { InvestigationLabScreen } from "../investigation/screens.jsx";
import { PatientSurveillanceLabScreen } from "../pbrtqc/screens.jsx";
import { RiskFrequencyLabScreen } from "../risk/screens.jsx";
import { RuleLaboratoryScreen } from "../rules/screens.jsx";
import { QCStrategyLabScreen } from "../strategy/screens.jsx";
import { QCMaterialsScreen } from "../qc-materials/screens.jsx";
import { LEVELS, LEVEL_LABELS } from "./app-data.js";
import { AboutModal, CompetencyMapScreen, DiagnosticModal, EvidenceScreen, GlossaryModal, HomeScreen, LJLabScreen, PatternChallengeScreen, SigmaSandboxScreen, StatsPlaygroundScreen } from "./core-screens.jsx";
import { useState, useMemo, useRef, useEffect } from "react";
// Stage 12C controlled production integration (Section 24-25): Morning
// QC Room is mounted as an internal screen/subview, NOT a 15th primary
// nav destination (it is deliberately absent from NAV_ITEMS below).
import { ProductionCaseSelect } from "../morning-qc/ui/production-case-select.jsx";
import { ALL_CASES } from "../morning-qc/cases/index.js";

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

// Stage 12C FINAL CALIBRATION + PRODUCTION-ROUTING ACCEPTANCE closure:
// a small, deterministic, dependency-free hash router (Section 3). The
// browser hash (#/home, #/map, #/morning-qc, ...) is the SINGLE source
// of truth for which screen is visible — goto() only ever navigates by
// setting the hash; screen state itself is updated exclusively by the
// hashchange listener (see App(), below), so there is never a moment
// where the hash and the rendered screen can drift apart. This is
// intentionally NOT a general-purpose routing library — it owns only
// WHICH SCREEN IS VISIBLE, nothing about Morning QC's own simulation
// state (Section 4): Stage 12A's engine remains simulation authority,
// Stage 12B's controller remains active-case authority, and no
// case/evidence/decision/confidence/ground-truth data is ever encoded
// in the hash or read from it.
// Section 3 (QC-03 pre-release content closure): QC Materials & Control
// Statistics is mounted the same way Morning QC is — an internal screen
// reachable via its own hash route, deliberately absent from NAV_ITEMS
// (never a 15th primary destination).
const ALL_SCREEN_KEYS = new Set([...NAV_ITEMS.map(i => i.key), "morning-qc", "qc-materials"]);

function screenFromHash() {
  const raw = (typeof window !== "undefined" ? window.location.hash : "") || "";
  const key = raw.replace(/^#\/?/, "");
  return ALL_SCREEN_KEYS.has(key) ? key : "home";
}

function setHashForScreen(key) {
  if (typeof window === "undefined") return;
  const target = "#/" + key;
  if (window.location.hash !== target) window.location.hash = target;
}

export function App() {
  const [level, setLevel] = useState("beginner");
  const [screen, setScreen] = useState(() => screenFromHash());
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [progress, setProgress] = useState({ stats: false, lj: false, pattern: false, rules: false, strategy: false, sigma: false, risk: false, investigation: false, "external-assurance": false, "bv-rcv": false, pbrtqc: false });

  // The hash is authoritative: on mount (direct open / refresh) and on
  // every browser Back/Forward (hashchange), re-derive the visible
  // screen from the CURRENT hash. This is the only place screen state
  // is ever set from routing — goto() below never calls setScreen
  // directly, avoiding any dual-authority drift between the hash and
  // the rendered screen.
  useEffect(() => {
    setHashForScreen(screenFromHash()); // normalize an empty/invalid initial hash to a real route
    function handleHashChange() { setScreen(screenFromHash()); }
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  function markProgress(key) {
    setProgress(p => (p[key] ? p : { ...p, [key]: true }));
  }

  function goto(key) {
    // Navigate via the hash ONLY — the hashchange listener above is the
    // sole place setScreen is called, keeping the hash and the rendered
    // screen always in sync (Section 3/4).
    setHashForScreen(key);
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
  else if (screen === "qc-materials") body = <QCMaterialsScreen level={level} goto={goto} />;
  else if (screen === "morning-qc") body = (
    <ProductionCaseSelect
      cases={ALL_CASES}
      onReturn={() => goto("home")}
    />
  );

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
        <div className="footer-author">Developed by Dr Prasenjit Mitra</div>
        <div className="footer-copyright">&copy; 2026 Prasenjit Mitra &middot; Licensed under the Apache License 2.0</div>
        <div className="footer-links">
          <button className="btn-link" onClick={() => goto("evidence")}>Evidence</button>
          <button className="btn-link" onClick={() => setShowGlossary(true)}>Glossary</button>
          <button className="btn-link" onClick={() => setShowAbout(true)}>About</button>
        </div>
      </footer>

      {showDiagnostic && <DiagnosticModal onClose={() => setShowDiagnostic(false)} onApply={setLevel} />}
      {showGlossary && <GlossaryModal onClose={() => setShowGlossary(false)} />}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  );
}

