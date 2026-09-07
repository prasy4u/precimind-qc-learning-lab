/* =========================================================================
   v09/app/morning-qc/case-validator.js

   Morning QC Room — Stage 12A Strict Case Validator
   PROVENANCE: V09_NEW

   Fails CLOSED (Stage 12A Section 25): returns { valid: false, errors: [...] }
   with SPECIFIC error messages for every violation found, rather than a
   bare boolean. A case with zero errors is valid; any single error makes
   the whole case invalid.
   ========================================================================= */

import {
  IDENTITY_REQUIRED_FIELDS, CASE_DIFFICULTY_LEVELS, LEARNER_LEVELS,
  LAB_CONTEXT_REQUIRED_FIELDS, EVENT_TYPES, EVENT_REQUIRED_FIELDS,
  PANEL_TYPES, PANEL_REQUIRED_FIELDS, GROUND_TRUTH_REQUIRED_FIELDS,
  DECISION_OPPORTUNITY_REQUIRED_FIELDS, VERIFICATION_CRITERIA_REQUIRED_FIELDS,
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

  // 1. Top-level shape
  hasAllFields(caseObj, CASE_TOP_LEVEL_REQUIRED_FIELDS, errors, 'case');

  // 2. Identity
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

  // 3. Lab context
  hasAllFields(caseObj.labContext, LAB_CONTEXT_REQUIRED_FIELDS, errors, 'labContext');

  // 4. Timeline / events
  const timeline = caseObj.timeline || [];
  if (!Array.isArray(timeline)) errors.push('timeline: must be an array');
  else {
    timeline.forEach((ev, i) => {
      hasAllFields(ev, EVENT_REQUIRED_FIELDS, errors, `timeline[${i}]`);
      if (ev && ev.type && !EVENT_TYPES.includes(ev.type)) {
        errors.push(`timeline[${i}]: unrecognized event type "${ev.type}"`);
      }
    });
    checkDuplicateIds(timeline, 'timeline', errors);
  }

  // 5. Panels
  const panels = caseObj.panels || [];
  if (!Array.isArray(panels)) errors.push('panels: must be an array');
  else {
    panels.forEach((p, i) => {
      hasAllFields(p, PANEL_REQUIRED_FIELDS, errors, `panels[${i}]`);
      if (p) {
        if (p.type && !PANEL_TYPES.includes(p.type)) errors.push(`panels[${i}]: unrecognized panel type "${p.type}"`);
        if (p.availableFromPhase && !SIMULATION_PHASES.includes(p.availableFromPhase)) {
          errors.push(`panels[${i}]: invalid availableFromPhase "${p.availableFromPhase}"`);
        }
        if (p.relevance && !['RELEVANT', 'IRRELEVANT', 'CONDITIONALLY_RELEVANT'].includes(p.relevance)) {
          errors.push(`panels[${i}]: invalid relevance "${p.relevance}"`);
        }
        if (typeof p.costTimeMinutes === 'number' && p.costTimeMinutes < 0) {
          errors.push(`panels[${i}]: costTimeMinutes must be >= 0`);
        }
      }
    });
    checkDuplicateIds(panels, 'panels', errors);
  }

  // 6. Hypotheses
  const hypotheses = caseObj.hypotheses || [];
  if (!Array.isArray(hypotheses)) errors.push('hypotheses: must be an array');
  else {
    hypotheses.forEach((h, i) => hasAllFields(h, HYPOTHESIS_REQUIRED_FIELDS, errors, `hypotheses[${i}]`));
    checkDuplicateIds(hypotheses, 'hypotheses', errors);
  }
  const hypothesisIds = new Set((hypotheses || []).map(h => h && h.id).filter(Boolean));

  // 7. Evidence — must reference existing hypotheses and, if gated, existing action types
  const evidence = caseObj.evidence || [];
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
        if (e.availableOnlyAfterActionType != null && !ACTION_TYPES.includes(e.availableOnlyAfterActionType)) {
          errors.push(`evidence[${i}]: availableOnlyAfterActionType "${e.availableOnlyAfterActionType}" is not a recognized action type`);
        }
      }
    });
    checkDuplicateIds(evidence, 'evidence', errors);
  }
  const evidenceIds = new Set((evidence || []).map(e => e && e.id).filter(Boolean));

  // 8. Ground truth — internal consistency (Section 25: "contradictory ground-truth declarations",
  //    "a case automatically equates signal with root cause")
  const gt = caseObj.groundTruth;
  hasAllFields(gt, GROUND_TRUTH_REQUIRED_FIELDS, errors, 'groundTruth');
  if (gt) {
    if (gt.rootCauseEstablished === false && gt.rootCauseDescription != null) {
      errors.push('groundTruth: rootCauseDescription must be null when rootCauseEstablished is false (contradictory ground truth)');
    }
    if (gt.rootCauseEstablished === true && gt.rootCauseDescription == null) {
      errors.push('groundTruth: rootCauseDescription is required when rootCauseEstablished is true');
    }
    // Section 25: "a case automatically equates signal with root cause" —
    // checked as literal identity between the observed-signal description
    // and the root-cause description, which would indicate the case design
    // collapsed the two concepts rather than genuinely distinguishing them.
    // (Note: rootCauseEstablished=true while disturbanceEstablished=false is
    // NOT itself contradictory — case families K and M specifically require
    // this combination, where the established "cause" of the observed
    // signal is a genuine non-disturbance explanation, e.g. a patient
    // population shift or real biological change. Conflating "no analytical
    // disturbance" with "no explanation exists at all" would make those
    // case families impossible to express and was corrected during Stage
    // 12A case authoring after the validator initially, incorrectly,
    // rejected both.)
    if (gt.observedSignal && gt.rootCauseDescription && gt.observedSignal === gt.rootCauseDescription) {
      errors.push('groundTruth: observedSignal and rootCauseDescription are identical strings — the case must distinguish the observed signal from its established cause, not equate them');
    }
    if (gt.patientImpactStatus && !PATIENT_IMPACT_STATES.includes(gt.patientImpactStatus)) {
      errors.push(`groundTruth: invalid patientImpactStatus "${gt.patientImpactStatus}"`);
    }
    for (const ev of gt.evidenceForHypotheses || []) {
      if (!hypothesisIds.has(ev.hypothesisId)) {
        errors.push(`groundTruth.evidenceForHypotheses: references nonexistent hypothesis "${ev.hypothesisId}"`);
      }
    }
  }

  // 9. Decision opportunities
  const decisions = caseObj.decisionOpportunities || [];
  if (!Array.isArray(decisions)) errors.push('decisionOpportunities: must be an array');
  else {
    decisions.forEach((d, i) => {
      hasAllFields(d, DECISION_OPPORTUNITY_REQUIRED_FIELDS, errors, `decisionOpportunities[${i}]`);
      if (d) {
        if (d.category && !DECISION_CATEGORIES.includes(d.category)) errors.push(`decisionOpportunities[${i}]: invalid category "${d.category}"`);
        if (d.availableFromPhase && !SIMULATION_PHASES.includes(d.availableFromPhase)) errors.push(`decisionOpportunities[${i}]: invalid availableFromPhase "${d.availableFromPhase}"`);
        for (const opt of d.options || []) {
          if (opt.severity && !SEVERITY_LEVELS.includes(opt.severity)) errors.push(`decisionOpportunities[${i}]: option "${opt.id}" has invalid severity "${opt.severity}"`);
        }
      }
    });
    checkDuplicateIds(decisions, 'decisionOpportunities', errors);
  }

  // 10. Verification criteria — required evidence must exist; a terminal
  //     disposition/verification must actually be reachable
  const vc = caseObj.verificationCriteria;
  hasAllFields(vc, VERIFICATION_CRITERIA_REQUIRED_FIELDS, errors, 'verificationCriteria');
  if (vc && Array.isArray(vc.requiredEvidenceIds)) {
    for (const eid of vc.requiredEvidenceIds) {
      if (!evidenceIds.has(eid)) errors.push(`verificationCriteria.requiredEvidenceIds: references nonexistent evidence "${eid}" (verification would be unreachable)`);
    }
    if (vc.requiredEvidenceIds.length === 0) {
      errors.push('verificationCriteria.requiredEvidenceIds: must not be empty (a terminal disposition requiring verification must have reachable evidence)');
    }
  }

  // 11. Debrief evidence
  hasAllFields(caseObj.debriefEvidence, DEBRIEF_EVIDENCE_REQUIRED_FIELDS, errors, 'debriefEvidence');

  // 12. Provenance (Section 32)
  hasAllFields(caseObj.provenance, CASE_PROVENANCE_REQUIRED_FIELDS, errors, 'provenance');
  if (caseObj.provenance && caseObj.provenance.provenanceClass &&
      !V09_PROVENANCE_CLASSES.includes(caseObj.provenance.provenanceClass)) {
    errors.push(`provenance.provenanceClass: "${caseObj.provenance.provenanceClass}" is not a recognized v0.9 provenance class`);
  }

  // 13. Global duplicate-ID check across ALL id-bearing collections combined
  //     (Section 25: "duplicate IDs occur" — checked per-collection above;
  //     this additionally guards against cross-collection collisions, e.g.
  //     an evidence id colliding with a hypothesis id, which would make
  //     cross-references ambiguous).
  const allIds = [
    ...(timeline || []).map(x => x && x.id),
    ...(panels || []).map(x => x && x.id),
    ...(hypotheses || []).map(x => x && x.id),
    ...(evidence || []).map(x => x && x.id),
    ...(decisions || []).map(x => x && x.id),
  ].filter(Boolean);
  const seenGlobal = new Set();
  for (const id of allIds) {
    if (seenGlobal.has(id)) errors.push(`case: id "${id}" is reused across different collections (timeline/panels/hypotheses/evidence/decisionOpportunities must share one global id namespace)`);
    seenGlobal.add(id);
  }

  return { valid: errors.length === 0, errors };
}
