/* =========================================================================
   v09/app/morning-qc/case-validator.js

   Morning QC Room — Stage 12A Strict Case Validator
   PROVENANCE: V09_NEW
   Revised during the Stage 12A independent-audit corrective closure.

   Fails CLOSED: returns { valid: false, errors: [...] } with SPECIFIC
   error messages for every violation found. A case with zero errors is
   valid; any single error makes the whole case invalid.

   CORRECTIVE-CLOSURE CHANGES:
     - rootCauseEstablished now means EXCLUSIVELY an analytical root
       cause, and MUST be false whenever disturbanceEstablished is false.
       signalExplanationEstablished is validated as the SEPARATE construct
       for explaining an observed signal without an analytical disturbance
       (case families K, M) — this replaces the Stage 12A-original,
       overly permissive combination check.
     - Decision options are now validated for executable identity
       (id/label/consequenceSummary/severity/outcomeAppropriate all
       present and outcomeAppropriate is a genuine boolean).
     - patientImpactCriteria is validated: required fields present,
       referenced evidence exists, and (reachability) at least one
       evidence item is genuinely obtainable to satisfy it.
     - Evidence prerequisite reachability: an evidence item's
       availableOnlyAfterActionType must not create a tautological/
       self-referential gate with no meaningful semantics (e.g. an
       evidence item gated behind requesting evidence itself).
   ========================================================================= */

import {
  IDENTITY_REQUIRED_FIELDS, CASE_DIFFICULTY_LEVELS, LEARNER_LEVELS,
  LAB_CONTEXT_REQUIRED_FIELDS, EVENT_TYPES, EVENT_REQUIRED_FIELDS,
  PANEL_TYPES, PANEL_REQUIRED_FIELDS, GROUND_TRUTH_REQUIRED_FIELDS,
  DECISION_OPPORTUNITY_REQUIRED_FIELDS, DECISION_OPTION_REQUIRED_FIELDS,
  VERIFICATION_CRITERIA_REQUIRED_FIELDS, PATIENT_IMPACT_CRITERIA_REQUIRED_FIELDS,
  DEBRIEF_EVIDENCE_REQUIRED_FIELDS, HYPOTHESIS_REQUIRED_FIELDS,
  EVIDENCE_REQUIRED_FIELDS, CASE_TOP_LEVEL_REQUIRED_FIELDS,
  V09_PROVENANCE_CLASSES, CASE_PROVENANCE_REQUIRED_FIELDS,
} from './case-schema.js';
import { SIMULATION_PHASES, DECISION_CATEGORIES, SEVERITY_LEVELS, PATIENT_IMPACT_STATES, ACTION_TYPES } from './states.js';

function hasAllFields(obj, fields, errors, context) {
  for (const f of fields) {
    if (obj == null || !(f in obj) || obj[f] === undefined) {
      errors.push(`${context}: missing required field "${f}"`);
    }
  }
}

function checkDuplicateIds(items, context, errors) {
  const seen = new Set();
  for (const item of items || []) {
    if (item && item.id != null) {
      if (seen.has(item.id)) errors.push(`${context}: duplicate id "${item.id}"`);
      seen.add(item.id);
    }
  }
}

export function validateCase(caseObj) {
  const errors = [];

  if (caseObj == null || typeof caseObj !== 'object') {
    return { valid: false, errors: ['case: not an object'] };
  }

  hasAllFields(caseObj, CASE_TOP_LEVEL_REQUIRED_FIELDS, errors, 'case');

  // Identity
  const identity = caseObj.identity;
  hasAllFields(identity, IDENTITY_REQUIRED_FIELDS, errors, 'identity');
  if (identity) {
    if (identity.difficulty && !CASE_DIFFICULTY_LEVELS.includes(identity.difficulty)) {
      errors.push(`identity.difficulty: "${identity.difficulty}" is not a recognized CASE_DIFFICULTY_LEVEL`);
    }
    if (Array.isArray(identity.intendedLearnerLevel)) {
      for (const lv of identity.intendedLearnerLevel) {
        if (!LEARNER_LEVELS.includes(lv)) errors.push(`identity.intendedLearnerLevel: "${lv}" is not a recognized learner level`);
      }
    } else if (identity.intendedLearnerLevel !== undefined) {
      errors.push('identity.intendedLearnerLevel: must be an array');
    }
  }

  // Lab context
  hasAllFields(caseObj.labContext, LAB_CONTEXT_REQUIRED_FIELDS, errors, 'labContext');

  // Timeline / events
  const timeline = caseObj.timeline || [];
  if (!Array.isArray(timeline)) errors.push('timeline: must be an array');
  else {
    timeline.forEach((ev, i) => {
      hasAllFields(ev, EVENT_REQUIRED_FIELDS, errors, `timeline[${i}]`);
      if (ev && ev.type && !EVENT_TYPES.includes(ev.type)) errors.push(`timeline[${i}]: unrecognized event type "${ev.type}"`);
    });
    checkDuplicateIds(timeline, 'timeline', errors);
  }

  // Panels
  const panels = caseObj.panels || [];
  if (!Array.isArray(panels)) errors.push('panels: must be an array');
  else {
    panels.forEach((p, i) => {
      hasAllFields(p, PANEL_REQUIRED_FIELDS, errors, `panels[${i}]`);
      if (p) {
        if (p.type && !PANEL_TYPES.includes(p.type)) errors.push(`panels[${i}]: unrecognized panel type "${p.type}"`);
        if (p.availableFromPhase && !SIMULATION_PHASES.includes(p.availableFromPhase)) errors.push(`panels[${i}]: invalid availableFromPhase "${p.availableFromPhase}"`);
        if (p.relevance && !['RELEVANT', 'IRRELEVANT', 'CONDITIONALLY_RELEVANT'].includes(p.relevance)) errors.push(`panels[${i}]: invalid relevance "${p.relevance}"`);
        if (typeof p.costTimeMinutes === 'number' && p.costTimeMinutes < 0) errors.push(`panels[${i}]: costTimeMinutes must be >= 0`);
      }
    });
    checkDuplicateIds(panels, 'panels', errors);
  }

  // Hypotheses
  const hypotheses = caseObj.hypotheses || [];
  if (!Array.isArray(hypotheses)) errors.push('hypotheses: must be an array');
  else {
    hypotheses.forEach((h, i) => hasAllFields(h, HYPOTHESIS_REQUIRED_FIELDS, errors, `hypotheses[${i}]`));
    checkDuplicateIds(hypotheses, 'hypotheses', errors);
  }
  const hypothesisIds = new Set((hypotheses || []).map(h => h && h.id).filter(Boolean));

  // Evidence — required fields, hypothesis references, and prerequisite sanity
  const evidence = caseObj.evidence || [];
  const panelIdsSet = new Set((caseObj.panels || []).map(p => p && p.id).filter(Boolean));
  // Stage 12A FINAL closure: which panel TYPES actually exist in this
  // case, keyed by the action type that depends on them — used to reject
  // an evidence/action prerequisite referencing a panel-dependent action
  // (e.g. CHECK_EQA) when no panel of the required type exists at all
  // (Section 7's exact "CHECK_EQA with no EQA panel" example).
  const PANEL_DEPENDENT_ACTION_TO_PANEL_TYPE = {
    CHECK_EQA: 'EQA', CHECK_PBRTQC: 'PBRTQC', CHECK_PATIENT_DISTRIBUTION: 'PATIENT_RESULT_DISTRIBUTION',
    INSPECT_REAGENT: 'REAGENT_LOT', INSPECT_MAINTENANCE: 'MAINTENANCE',
  };
  const presentPanelTypes = new Set((caseObj.panels || []).map(p => p && p.type).filter(Boolean));
  if (!Array.isArray(evidence)) errors.push('evidence: must be an array');
  else {
    evidence.forEach((e, i) => {
      hasAllFields(e, EVIDENCE_REQUIRED_FIELDS, errors, `evidence[${i}]`);
      if (e) {
        for (const hid of e.supportsHypothesisIds || []) {
          if (!hypothesisIds.has(hid)) errors.push(`evidence[${i}]: supportsHypothesisIds references nonexistent hypothesis "${hid}"`);
        }
        for (const hid of e.weakensHypothesisIds || []) {
          if (!hypothesisIds.has(hid)) errors.push(`evidence[${i}]: weakensHypothesisIds references nonexistent hypothesis "${hid}"`);
        }
        // Stage 12A FINAL closure: sourcePanelId must reference a real panel.
        if (e.sourcePanelId != null && !panelIdsSet.has(e.sourcePanelId)) {
          errors.push(`evidence[${i}]: sourcePanelId references nonexistent panel "${e.sourcePanelId}" (evidence would be unreachable)`);
        }
        if (e.availableOnlyAfterActionType != null) {
          if (!ACTION_TYPES.includes(e.availableOnlyAfterActionType)) {
            errors.push(`evidence[${i}]: availableOnlyAfterActionType "${e.availableOnlyAfterActionType}" is not a recognized action type`);
          }
          // Reachability/tautology check (Section 25/14): a prerequisite
          // of "REQUEST_EVIDENCE" gates evidence behind "some evidence was
          // requested" — since requesting THIS evidence item is itself a
          // REQUEST_EVIDENCE action, this can create a self-referential,
          // no-op gate unless it genuinely refers to a DIFFERENT evidence
          // item having been requested first. The schema does not track
          // "which" REQUEST_EVIDENCE, so this specific action type is
          // disallowed as a prerequisite to avoid an inherently ambiguous,
          // tautological gate.
          if (e.availableOnlyAfterActionType === 'REQUEST_EVIDENCE') {
            errors.push(`evidence[${i}]: availableOnlyAfterActionType="REQUEST_EVIDENCE" is a tautological/self-referential prerequisite (requesting evidence is itself a REQUEST_EVIDENCE action) — use null (no prerequisite) or a semantically distinct action type instead`);
          }
          // Stage 12A FINAL closure: a panel-dependent action prerequisite
          // (e.g. CHECK_EQA) requires a panel of the corresponding type to
          // actually exist in this case, or the prerequisite can never be
          // satisfied (Section 7's exact example: CHECK_EQA with no EQA panel).
          const requiredPanelType = PANEL_DEPENDENT_ACTION_TO_PANEL_TYPE[e.availableOnlyAfterActionType];
          if (requiredPanelType && !presentPanelTypes.has(requiredPanelType)) {
            errors.push(`evidence[${i}]: availableOnlyAfterActionType="${e.availableOnlyAfterActionType}" requires a panel of type "${requiredPanelType}", but no such panel exists in this case (unreachable prerequisite)`);
          }
        }
      }
    });
    checkDuplicateIds(evidence, 'evidence', errors);
  }
  const evidenceIds = new Set((evidence || []).map(e => e && e.id).filter(Boolean));

  // Ground truth — corrective-closure model: rootCauseEstablished means
  // EXCLUSIVELY an analytical root cause; signalExplanationEstablished is
  // the separate, non-disturbance explanation construct.
  const gt = caseObj.groundTruth;
  hasAllFields(gt, GROUND_TRUTH_REQUIRED_FIELDS, errors, 'groundTruth');
  if (gt) {
    if (gt.rootCauseEstablished === false && gt.rootCauseDescription != null) {
      errors.push('groundTruth: rootCauseDescription must be null when rootCauseEstablished is false');
    }
    if (gt.rootCauseEstablished === true && gt.rootCauseDescription == null) {
      errors.push('groundTruth: rootCauseDescription is required when rootCauseEstablished is true');
    }
    // Corrective-closure rule: an analytical root cause cannot exist
    // without an established analytical disturbance. This is the
    // corrected form of the doctrine "signal ≠ disturbance ≠ root cause" —
    // rootCauseEstablished now ONLY ever describes an analytical cause.
    if (gt.disturbanceEstablished === false && gt.rootCauseEstablished === true) {
      errors.push('groundTruth: rootCauseEstablished cannot be true when disturbanceEstablished is false (an analytical root cause requires an established analytical disturbance — use signalExplanationEstablished for a non-disturbance explanation of the observed signal instead)');
    }
    if (gt.signalExplanationEstablished === false && gt.signalExplanationDescription != null) {
      errors.push('groundTruth: signalExplanationDescription must be null when signalExplanationEstablished is false');
    }
    if (gt.signalExplanationEstablished === true && gt.signalExplanationDescription == null) {
      errors.push('groundTruth: signalExplanationDescription is required when signalExplanationEstablished is true');
    }
    // Section 25: "a case automatically equates signal with root cause" —
    // checked as literal identity between the observed-signal description
    // and either the root-cause or signal-explanation description.
    if (gt.observedSignal && gt.rootCauseDescription && gt.observedSignal === gt.rootCauseDescription) {
      errors.push('groundTruth: observedSignal and rootCauseDescription are identical strings — the case must distinguish the observed signal from its established cause');
    }
    if (gt.observedSignal && gt.signalExplanationDescription && gt.observedSignal === gt.signalExplanationDescription) {
      errors.push('groundTruth: observedSignal and signalExplanationDescription are identical strings — the case must distinguish the observed signal from its established explanation');
    }
    if (gt.patientImpactStatus && !PATIENT_IMPACT_STATES.includes(gt.patientImpactStatus)) {
      errors.push(`groundTruth: invalid patientImpactStatus "${gt.patientImpactStatus}"`);
    }
    for (const ev of gt.evidenceForHypotheses || []) {
      if (!hypothesisIds.has(ev.hypothesisId)) errors.push(`groundTruth.evidenceForHypotheses: references nonexistent hypothesis "${ev.hypothesisId}"`);
    }
  }

  // Decision opportunities — required fields, category/phase validity,
  // AND executable option identity (corrective-closure requirement).
  const decisions = caseObj.decisionOpportunities || [];
  if (!Array.isArray(decisions)) errors.push('decisionOpportunities: must be an array');
  else {
    decisions.forEach((d, i) => {
      hasAllFields(d, DECISION_OPPORTUNITY_REQUIRED_FIELDS, errors, `decisionOpportunities[${i}]`);
      if (d) {
        if (d.category && !DECISION_CATEGORIES.includes(d.category)) errors.push(`decisionOpportunities[${i}]: invalid category "${d.category}"`);
        if (d.availableFromPhase && !SIMULATION_PHASES.includes(d.availableFromPhase)) errors.push(`decisionOpportunities[${i}]: invalid availableFromPhase "${d.availableFromPhase}"`);
        for (const opt of d.options || []) {
          hasAllFields(opt, DECISION_OPTION_REQUIRED_FIELDS, errors, `decisionOpportunities[${i}].options[${opt.id || '?'}]`);
          if (opt.severity && !SEVERITY_LEVELS.includes(opt.severity)) errors.push(`decisionOpportunities[${i}]: option "${opt.id}" has invalid severity "${opt.severity}"`);
          if (opt.outcomeAppropriate !== undefined && typeof opt.outcomeAppropriate !== 'boolean') {
            errors.push(`decisionOpportunities[${i}]: option "${opt.id}" outcomeAppropriate must be a boolean, found ${typeof opt.outcomeAppropriate}`);
          }
          // Stage 12A FINAL closure: actionType must be a recognized
          // action type — this is the executable contract binding this
          // option to a specific, legitimate action (engine.js rejects
          // any attempt to execute this option via a non-matching action).
          if (opt.actionType != null && !ACTION_TYPES.includes(opt.actionType)) {
            errors.push(`decisionOpportunities[${i}]: option "${opt.id}" actionType "${opt.actionType}" is not a recognized action type`);
          }
          // Stage 12A FINAL EVIDENCE/REASONING closure: every referenced
          // requiredEvidenceIdsForSupportedReasoning entry must exist in
          // THIS case's evidence array — fail closed on dangling references.
          // An empty array is valid (genuinely evidence-independent option).
          if (opt.requiredEvidenceIdsForSupportedReasoning !== undefined) {
            if (!Array.isArray(opt.requiredEvidenceIdsForSupportedReasoning)) {
              errors.push(`decisionOpportunities[${i}]: option "${opt.id}" requiredEvidenceIdsForSupportedReasoning must be an array`);
            } else {
              for (const eid of opt.requiredEvidenceIdsForSupportedReasoning) {
                if (!evidenceIds.has(eid)) {
                  errors.push(`decisionOpportunities[${i}]: option "${opt.id}" requiredEvidenceIdsForSupportedReasoning references nonexistent evidence "${eid}" (unreachable reasoning requirement)`);
                }
              }
            }
          }
        }
        checkDuplicateIds(d.options || [], `decisionOpportunities[${i}].options`, errors);
      }
    });
    checkDuplicateIds(decisions, 'decisionOpportunities', errors);
  }

  // Verification criteria — required evidence must exist and be reachable
  const vc = caseObj.verificationCriteria;
  hasAllFields(vc, VERIFICATION_CRITERIA_REQUIRED_FIELDS, errors, 'verificationCriteria');
  if (vc && Array.isArray(vc.requiredEvidenceIds)) {
    for (const eid of vc.requiredEvidenceIds) {
      if (!evidenceIds.has(eid)) errors.push(`verificationCriteria.requiredEvidenceIds: references nonexistent evidence "${eid}" (verification would be unreachable)`);
    }
    if (vc.requiredEvidenceIds.length === 0) errors.push('verificationCriteria.requiredEvidenceIds: must not be empty');
  }

  // Patient-impact criteria (corrective-closure addition) — required
  // fields, referenced evidence exists, and is genuinely reachable
  // (no availableOnlyAfterActionType pointing at an action type the case
  // never legitimately exposes a path to).
  const pic = caseObj.patientImpactCriteria;
  hasAllFields(pic, PATIENT_IMPACT_CRITERIA_REQUIRED_FIELDS, errors, 'patientImpactCriteria');
  if (pic && Array.isArray(pic.requiredEvidenceIdsForTerminalState)) {
    if (pic.requiredEvidenceIdsForTerminalState.length === 0) {
      errors.push('patientImpactCriteria.requiredEvidenceIdsForTerminalState: must not be empty — a terminal patient-impact state must be evidence-backed, not freely declarable');
    }
    for (const eid of pic.requiredEvidenceIdsForTerminalState) {
      if (!evidenceIds.has(eid)) errors.push(`patientImpactCriteria.requiredEvidenceIdsForTerminalState: references nonexistent evidence "${eid}" (terminal patient-impact state would be unreachable)`);
    }
  }

  // Debrief evidence
  hasAllFields(caseObj.debriefEvidence, DEBRIEF_EVIDENCE_REQUIRED_FIELDS, errors, 'debriefEvidence');

  // Provenance
  hasAllFields(caseObj.provenance, CASE_PROVENANCE_REQUIRED_FIELDS, errors, 'provenance');
  if (caseObj.provenance && caseObj.provenance.provenanceClass &&
      !V09_PROVENANCE_CLASSES.includes(caseObj.provenance.provenanceClass)) {
    errors.push(`provenance.provenanceClass: "${caseObj.provenance.provenanceClass}" is not a recognized v0.9 provenance class`);
  }

  // Global duplicate-ID check across all id-bearing collections
  const allIds = [
    ...(timeline || []).map(x => x && x.id),
    ...(panels || []).map(x => x && x.id),
    ...(hypotheses || []).map(x => x && x.id),
    ...(evidence || []).map(x => x && x.id),
    ...(decisions || []).map(x => x && x.id),
  ].filter(Boolean);
  const seenGlobal = new Set();
  for (const id of allIds) {
    if (seenGlobal.has(id)) errors.push(`case: id "${id}" is reused across different collections`);
    seenGlobal.add(id);
  }

  return { valid: errors.length === 0, errors };
}
