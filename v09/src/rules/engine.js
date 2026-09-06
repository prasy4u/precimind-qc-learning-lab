/* =========================================================================
   core/rules — statistical QC rule engine (Rule Laboratory, v0.2)

   Pure, independently testable functions. No UI, no rendering, no React.
   Every detector operates on z-scores (unit-independent) and returns an
   ARRAY of structured event objects — never a bare boolean — so the UI can
   show exactly which observations triggered a rule.

   Data model
   ----------
   A "Run" is: { runNumber, controlResults: [ { levelId, levelName,
   rawValue, zScore } , ... ], event: <string|null> }
   `controlResults` is ordered; the default teaching configuration has
   exactly two entries per run (Level 1, Level 2), but detectors that work
   within a single control material generalise to any levelId.

   Threshold semantics (see spec §5): STRICT "exceeds" — a value exactly
   equal to a control limit (±1, ±2, ±3) never counts as exceeding it.
   This module must never silently change that comparison.

   PROVENANCE: Class A — directly recovered from recovery/original-v0.8.html
   (SHA-256: e5317bf135f350b258428b985c1034a081e244a295f2e580c93cb6a6a091c8e4)
   Source lines: ~2817-3196 (core/rules section within app-source script)
   Historical reported v0.8 commit: 3cc62b1 (not independently verified)
   Recovery date: 2026-08-31
   ========================================================================= */

const RULE_LABELS = {
  "12s": "1₂s",
  "13s": "1₂s".replace("2", "3"), // -> "1₃s", written this way only to keep the glyph list obvious in source; see below
  "22s": "2₂s",
  "r4s": "R₄s",
  "41s": "4₁s",
  "10x": "10x",
  "8x": "8x" // added in v0.3.1 — see detect8x() below; independently validated, NOT a substitute for 10x
};
RULE_LABELS["13s"] = "1₃s"; // explicit, unambiguous (overrides the derivation above)

function exceedsPositive(z, limit) { return typeof z === "number" && isFinite(z) && z > limit; }
function exceedsNegative(z, limit) { return typeof z === "number" && isFinite(z) && z < -limit; }
function exceedsAbs(z, limit) { return exceedsPositive(z, limit) || exceedsNegative(z, limit); }
function sideOf(z) { return z > 0 ? "positive" : (z < 0 ? "negative" : "zero"); }

function flattenPoints(runs) {
  const pts = [];
  runs.forEach(run => {
    (run.controlResults || []).forEach(cr => {
      pts.push({
        runNumber: run.runNumber,
        levelId: cr.levelId,
        levelName: cr.levelName,
        rawValue: cr.rawValue,
        zScore: cr.zScore
      });
    });
  });
  return pts;
}

function pointsByLevel(runs, levelId) {
  const pts = [];
  runs.forEach(run => {
    const cr = (run.controlResults || []).find(c => c.levelId === levelId);
    if (cr) pts.push({ runNumber: run.runNumber, levelId: cr.levelId, levelName: cr.levelName, rawValue: cr.rawValue, zScore: cr.zScore });
  });
  return pts;
}

function levelIdsIn(runs) {
  const set = [];
  runs.forEach(run => (run.controlResults || []).forEach(cr => { if (set.indexOf(cr.levelId) === -1) set.push(cr.levelId); }));
  return set;
}

function makeEvent(ruleId, status, triggerPoints, scope, direction, educationalInterpretation) {
  const runNumbers = Array.from(new Set(triggerPoints.map(p => p.runNumber))).sort((a, b) => a - b);
  const controlLevels = Array.from(new Set(triggerPoints.map(p => p.levelId)));
  return {
    ruleId,
    ruleLabel: RULE_LABELS[ruleId],
    status,
    triggerPoints,
    runNumber: runNumbers[0],
    runNumbers,
    controlLevels,
    direction,
    scope,
    educationalInterpretation
  };
}

/* 1_2s: WARNING only */
function detect12s(runs) {
  const events = [];
  flattenPoints(runs).forEach(pt => {
    if (exceedsAbs(pt.zScore, 2)) {
      events.push(makeEvent(
        "12s", "warning", [pt], "single-measurement", sideOf(pt.zScore),
        "A single control result beyond +/-2 SD. In the traditional multirule procedure, 1_2s functions as a warning criterion that prompts inspection for rejection-rule violations - it is not, by itself, a rejection criterion here."
      ));
    }
  });
  return events;
}

/* 1_3s: REJECTION */
function detect13s(runs) {
  const events = [];
  flattenPoints(runs).forEach(pt => {
    if (exceedsAbs(pt.zScore, 3)) {
      events.push(makeEvent(
        "13s", "rejection", [pt], "single-measurement", sideOf(pt.zScore),
        "One control result beyond +/-3 SD. This may be compatible with a substantial analytical disturbance, but does not by itself prove a specific cause - investigation is required before attributing a mechanism."
      ));
    }
  });
  return events;
}

/* 2_2s: REJECTION - same-side only */
function detect22s(runs) {
  const events = [];
  runs.forEach(run => {
    const results = run.controlResults || [];
    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        const a = results[i], b = results[j];
        const sameSideExceed = (exceedsPositive(a.zScore, 2) && exceedsPositive(b.zScore, 2)) ||
          (exceedsNegative(a.zScore, 2) && exceedsNegative(b.zScore, 2));
        if (sameSideExceed) {
          const pa = { runNumber: run.runNumber, levelId: a.levelId, levelName: a.levelName, rawValue: a.rawValue, zScore: a.zScore };
          const pb = { runNumber: run.runNumber, levelId: b.levelId, levelName: b.levelName, rawValue: b.rawValue, zScore: b.zScore };
          events.push(makeEvent(
            "22s", "rejection", [pa, pb], "within-run-across-materials", sideOf(a.zScore),
            "Two different control materials in the same run both exceed the same 2 SD limit."
          ));
        }
      }
    }
  });
  levelIdsIn(runs).forEach(levelId => {
    const pts = pointsByLevel(runs, levelId);
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const sameSideExceed = (exceedsPositive(a.zScore, 2) && exceedsPositive(b.zScore, 2)) ||
        (exceedsNegative(a.zScore, 2) && exceedsNegative(b.zScore, 2));
      if (sameSideExceed) {
        events.push(makeEvent(
          "22s", "rejection", [a, b], "within-material-across-runs", sideOf(a.zScore),
          "The same control material exceeds the same 2 SD limit in two consecutive runs."
        ));
      }
    }
  });
  return events;
}

/* R_4s: WITHIN-RUN ONLY */
function detectR4s(runs) {
  const events = [];
  runs.forEach(run => {
    const results = run.controlResults || [];
    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        const a = results[i], b = results[j];
        const oppositeExceed = (exceedsPositive(a.zScore, 2) && exceedsNegative(b.zScore, 2)) ||
          (exceedsNegative(a.zScore, 2) && exceedsPositive(b.zScore, 2));
        if (oppositeExceed) {
          const pa = { runNumber: run.runNumber, levelId: a.levelId, levelName: a.levelName, rawValue: a.rawValue, zScore: a.zScore };
          const pb = { runNumber: run.runNumber, levelId: b.levelId, levelName: b.levelName, rawValue: b.rawValue, zScore: b.zScore };
          events.push(makeEvent(
            "r4s", "rejection", [pa, pb], "within-run-across-materials", "mixed",
            "Within the same run, one control result exceeds +2 SD while another exceeds -2 SD."
          ));
        }
      }
    }
  });
  return events;
}

/* 4_1s: REJECTION */
function detect41s(runs) {
  const events = [];
  levelIdsIn(runs).forEach(levelId => {
    const pts = pointsByLevel(runs, levelId);
    for (let i = 0; i + 3 < pts.length; i++) {
      const window = pts.slice(i, i + 4);
      const allPos = window.every(p => exceedsPositive(p.zScore, 1));
      const allNeg = window.every(p => exceedsNegative(p.zScore, 1));
      if (allPos || allNeg) {
        events.push(makeEvent(
          "41s", "rejection", window, "within-material-across-runs", allPos ? "positive" : "negative",
          "Four consecutive results for the same control material exceed the same 1 SD limit."
        ));
      }
    }
  });
  for (let i = 0; i + 1 < runs.length; i++) {
    const runA = runs[i], runB = runs[i + 1];
    const window = (runA.controlResults || []).map(cr => ({ runNumber: runA.runNumber, levelId: cr.levelId, levelName: cr.levelName, rawValue: cr.rawValue, zScore: cr.zScore }))
      .concat((runB.controlResults || []).map(cr => ({ runNumber: runB.runNumber, levelId: cr.levelId, levelName: cr.levelName, rawValue: cr.rawValue, zScore: cr.zScore })));
    if (window.length >= 4) {
      const allPos = window.every(p => exceedsPositive(p.zScore, 1));
      const allNeg = window.every(p => exceedsNegative(p.zScore, 1));
      if (allPos || allNeg) {
        events.push(makeEvent(
          "41s", "rejection", window, "across-materials-and-runs", allPos ? "positive" : "negative",
          "Both control materials exceed the same 1 SD limit across two consecutive runs."
        ));
      }
    }
  }
  return events;
}

/* 10x: REJECTION - same-side, no magnitude threshold */
function detect10x(runs) {
  const events = [];
  levelIdsIn(runs).forEach(levelId => {
    const pts = pointsByLevel(runs, levelId);
    for (let i = 0; i + 9 < pts.length; i++) {
      const window = pts.slice(i, i + 10);
      const allPos = window.every(p => p.zScore > 0);
      const allNeg = window.every(p => p.zScore < 0);
      if (allPos || allNeg) {
        events.push(makeEvent(
          "10x", "rejection", window, "within-material-across-runs", allPos ? "positive" : "negative",
          "Ten consecutive results for the same control material fall on the same side of the mean (" + (allPos ? "positive-side sequence" : "negative-side sequence") + ")."
        ));
      }
    }
  });
  for (let i = 0; i + 4 < runs.length; i++) {
    const windowRuns = runs.slice(i, i + 5);
    const window = [];
    windowRuns.forEach(run => (run.controlResults || []).forEach(cr => window.push({ runNumber: run.runNumber, levelId: cr.levelId, levelName: cr.levelName, rawValue: cr.rawValue, zScore: cr.zScore })));
    if (window.length >= 10) {
      const allPos = window.every(p => p.zScore > 0);
      const allNeg = window.every(p => p.zScore < 0);
      if (allPos || allNeg) {
        events.push(makeEvent(
          "10x", "rejection", window, "across-materials-and-runs", allPos ? "positive" : "negative",
          "Both control materials fall on the same side of the mean across five consecutive runs (" + (allPos ? "positive-side sequence" : "negative-side sequence") + ")."
        ));
      }
    }
  }
  return events;
}

/* 8x: REJECTION - DISTINCT from 10x, NOT a substitute */
function detect8x(runs) {
  const events = [];
  levelIdsIn(runs).forEach(levelId => {
    const pts = pointsByLevel(runs, levelId);
    for (let i = 0; i + 7 < pts.length; i++) {
      const window = pts.slice(i, i + 8);
      const allPos = window.every(p => p.zScore > 0);
      const allNeg = window.every(p => p.zScore < 0);
      if (allPos || allNeg) {
        events.push(makeEvent(
          "8x", "rejection", window, "within-material-across-runs", allPos ? "positive" : "negative",
          "Eight consecutive results for the same control material fall on the same side of the mean (" + (allPos ? "positive-side sequence" : "negative-side sequence") + ")."
        ));
      }
    }
  });
  for (let i = 0; i + 3 < runs.length; i++) {
    const windowRuns = runs.slice(i, i + 4);
    const window = [];
    windowRuns.forEach(run => (run.controlResults || []).forEach(cr => window.push({ runNumber: run.runNumber, levelId: cr.levelId, levelName: cr.levelName, rawValue: cr.rawValue, zScore: cr.zScore })));
    if (window.length >= 8) {
      const allPos = window.every(p => p.zScore > 0);
      const allNeg = window.every(p => p.zScore < 0);
      if (allPos || allNeg) {
        events.push(makeEvent(
          "8x", "rejection", window, "across-materials-and-runs", allPos ? "positive" : "negative",
          "Both control materials fall on the same side of the mean across four consecutive runs (" + (allPos ? "positive-side sequence" : "negative-side sequence") + ")."
        ));
      }
    }
  }
  return events;
}

const RULE_DETECTORS = {
  "12s": detect12s,
  "13s": detect13s,
  "22s": detect22s,
  "r4s": detectR4s,
  "41s": detect41s,
  "10x": detect10x,
  "8x": detect8x
};

const RULE_ORDER = ["12s", "13s", "22s", "r4s", "41s", "10x"];

function evaluateRuleSet(runs, enabledRuleIds) {
  const enabled = enabledRuleIds || RULE_ORDER;
  let events = [];
  enabled.forEach(ruleId => {
    const detector = RULE_DETECTORS[ruleId];
    if (detector) events = events.concat(detector(runs));
  });
  return events;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    RULE_LABELS, RULE_ORDER, RULE_DETECTORS,
    exceedsPositive, exceedsNegative, exceedsAbs, sideOf,
    flattenPoints, pointsByLevel, levelIdsIn,
    detect12s, detect13s, detect22s, detectR4s, detect41s, detect10x, detect8x,
    evaluateRuleSet
  };
}
