/* =========================================================================
   Investigation Lab — v0.5 pure calculation and status-model helpers.
   No React, no scenario content — those live in 20-investigation-data.js
   and 22-investigation-screens.jsx. Every function here is pure and
   independently unit-tested (test-investigation.js).

   Per the v0.5 spec, this module deliberately does NOT implement:
     - any automated root-cause diagnosis, scoring, or Bayesian inference
       (sections 18, 29, 66 — reasoning is scenario-authored, not computed),
     - any automatic patient-result correction (section 37 — see
       autoCorrectPatientResult() below, which always returns unsupported),
     - any causal-interval inference engine (section 29).

   PROVENANCE: Class A — directly recovered from recovery/original-v0.8.html
   (SHA-256: e5317bf135f350b258428b985c1034a081e244a295f2e580c93cb6a6a091c8e4)
   Source lines: ~6536-6683 (Investigation Lab calc section)
   Historical reported v0.8 commit: 3cc62b1 (not independently verified)
   Recovery date: 2026-08-31
   ========================================================================= */

/* -------------------------------------------------------------------------
   Status model (spec section 4). Enumerated exactly as specified — there is
   deliberately no "confirmed" CauseStatus and no "invalid" or "harmed"
   PatientImpactStatus/PatientResultCategory value anywhere in this build.
   ------------------------------------------------------------------------- */
export const QC_SIGNAL_STATUSES = ["none", "warning", "rejection-signal"];
export const PROCESS_STATUSES = ["apparently-stable", "validity-in-question", "evidence-of-instability", "recovery-being-verified", "recovered", "indeterminate"];
export const CAUSE_STATUSES = ["no-hypothesis", "candidate-hypothesis", "supported-hypothesis", "strongly-corroborated", "unresolved"];
export const PATIENT_IMPACT_STATUSES = ["not-assessed", "candidate-review-window-defined", "potentially-exposed-results", "analytical-impact-evidence-present", "no-impact-demonstrated", "impact-unresolved"];
export const PATIENT_RESULT_CATEGORIES = ["outside candidate interval", "potentially exposed", "reviewed", "no material analytical difference demonstrated", "analytical difference demonstrated", "further clinical assessment required", "unresolved"];

/* -------------------------------------------------------------------------
   v0.5.1 — ResultDispositionStatus (spec section 1). A fifth, separate
   status concept: the disposition of PREVIOUSLY GENERATED patient results
   is a distinct decision from current analytical process recovery (spec
   section 2). Deliberately no "invalid"/"unsafe"/"harmed" value.
   ------------------------------------------------------------------------- */
export const RESULT_DISPOSITION_STATUSES = ["routine-release", "temporarily-held", "review-required", "eligible-for-release-after-review", "amendment-or-reissue-being-considered", "resolved", "indeterminate"];

/* v0.5.1 — CommunicationConsideration (spec section 10). Qualitative and
   scenario-authored only — no function anywhere in this codebase derives a
   communication requirement automatically from an analytical-difference
   calculation, and no automated clinician-notification rule exists. */
export const COMMUNICATION_CONSIDERATION_STATUSES = ["none-demonstrated", "laboratory-review", "clinical-team-communication-may-be-required", "communication-completed-within-scenario"];

/* v0.5.1 (spec sections 3-4, 16 Tests 3-4). The ONLY function that computes
   an initial ResultDispositionStatus. It depends solely on whether a
   result falls within the scenario's own candidate impact window — never
   on whether the investigation is still open, and never on ProcessStatus.
   This is what keeps "process recovered" and "result disposition" from
   ever being coupled by a shared computation path:
     - outside the candidate window  -> "routine-release" (never held,
       regardless of whether the investigation remains open — Test 3);
     - inside the candidate window   -> "review-required" (never
       auto-escalated to "amendment-or-reissue-being-considered" — that
       status is only ever scenario-authored once evidence supports it —
       Test 4).
   Every other automatic hold/release rule (spec sections 3-4) is
   deliberately absent from this file. */
export function initialResultDispositionStatus(withinCandidateWindow) {
  return withinCandidateWindow ? "review-required" : "routine-release";
}

/* Reasoning-stage order (spec section 68). Evidence and patient-impact data
   are gated against this order — see isVisibleAtStage() below. */
export const REASONING_STAGES = ["signal", "containment", "characterisation", "hypothesis", "evidence-1", "hypothesis-update", "intervention", "verification", "patient-impact", "resume-decision"];

export function stageIndex(stage) {
  const i = REASONING_STAGES.indexOf(stage);
  return i === -1 ? null : i;
}

/* An evidence item (or patient-impact item) is visible only once the
   learner has reached its authored revealStage (spec sections 68-69, 93).
   Never leaks evidence "from the future" of a deterministic scenario. */
export function isVisibleAtStage(revealStage, currentStage) {
  const r = stageIndex(revealStage);
  const c = stageIndex(currentStage);
  if (r == null || c == null) return false;
  return r <= c;
}

/* -------------------------------------------------------------------------
   QC signal classification (spec section 90, Test D). A warning-type
   signal must never be silently upgraded to a rejection-signal, and an
   absent signal must never be silently upgraded to either.
   ------------------------------------------------------------------------- */
export function deriveQcSignalStatus(signalType) {
  if (signalType === "rejection") return "rejection-signal";
  if (signalType === "warning") return "warning";
  return "none";
}

/* -------------------------------------------------------------------------
   Patient-impact calculations (spec sections 34-37, 96-98). Pure,
   assumption-aware, never fabricates a numeric result and never
   auto-corrects a patient result.
   ------------------------------------------------------------------------- */
export function absoluteDifference(original, postRecovery) {
  if (typeof original !== "number" || typeof postRecovery !== "number" || !isFinite(original) || !isFinite(postRecovery)) {
    return { supported: false, value: null, reason: "Both original and post-recovery results must be finite numbers." };
  }
  return { supported: true, value: postRecovery - original, units: "same units as the original result" };
}

/* Relative difference (%) = (post - original) / original * 100. Zero or
   non-finite denominators are explicitly rejected — never Infinity, never
   NaN silently rendered (spec sections 36-37, 97). */
export function relativeDifferencePercent(original, postRecovery) {
  const invalidInputs = typeof original !== "number" || typeof postRecovery !== "number" || !isFinite(original) || !isFinite(postRecovery);
  if (invalidInputs) {
    return { supported: false, value: null, reason: "Both original and post-recovery results must be finite numbers." };
  }
  if (original === 0) {
    return { supported: false, value: null, reason: "Relative difference is not calculated when the original result is zero (division by zero). Use the absolute difference instead." };
  }
  return { supported: true, value: ((postRecovery - original) / original) * 100, units: "%" };
}

/* Deliberately the ONLY function related to "correcting" a patient result:
   it always refuses. This exists so a source-text/behaviour regression
   test (spec section 98) has a concrete function to call and confirm
   never returns a corrected numeric result. There is no other function
   anywhere in this codebase that mutates a patient result from an
   estimated bias. */
export function autoCorrectPatientResult() {
  return {
    supported: false,
    value: null,
    reason: "This application never automatically corrects a previously released patient result from an estimated analytical bias. A post-hoc estimated bias does not by itself justify numerical correction of a released result — that decision belongs to the laboratory's own defined procedure and professional judgement."
  };
}

/* Whether a synthetic timestamp falls within a candidate impact window
   (spec sections 27-28, 95). Timestamps are plain "HH:MM" strings on a
   single synthetic day, compared lexicographically (which is safe for
   same-day zero-padded 24h HH:MM strings). Results strictly before the
   window start are never included in the exposure set. */
export function isWithinCandidateWindow(timestamp, windowStart, windowEnd) {
  if (typeof timestamp !== "string" || typeof windowStart !== "string" || typeof windowEnd !== "string") return false;
  return timestamp >= windowStart && timestamp <= windowEnd;
}

