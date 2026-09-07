/* =========================================================================
   v09/app/morning-qc/types.js

   Morning QC Room — Stage 12A Type Documentation
   PROVENANCE: V09_NEW

   Pure JSDoc typedefs for editor/documentation purposes. No runtime
   behavior. The authoritative field lists live in case-schema.js; this
   file exists to give IDE tooling and future contributors a single
   readable reference for the shapes those field lists describe.
   ========================================================================= */

/**
 * @typedef {Object} MorningQcCase
 * @property {Object} identity
 * @property {Object} labContext
 * @property {Array<Object>} timeline
 * @property {Array<Object>} panels
 * @property {Object} groundTruth
 * @property {Array<Object>} decisionOpportunities
 * @property {Object} verificationCriteria
 * @property {Object} debriefEvidence
 * @property {Array<Object>} hypotheses
 * @property {Array<Object>} evidence
 * @property {Object} provenance
 */

/**
 * @typedef {Object} SimulationState
 * @property {string} phase - one of SIMULATION_PHASES
 * @property {string} serviceState - one of SERVICE_STATES
 * @property {string} patientImpactState - one of PATIENT_IMPACT_STATES
 * @property {Object<string,string>} hypothesisStates - hypothesisId -> HYPOTHESIS_EVIDENCE_STATES value
 * @property {Array<string>} inspectedPanelIds
 * @property {Array<string>} obtainedEvidenceIds
 * @property {Array<Object>} actionHistory
 * @property {number} elapsedMinutes
 * @property {Array<Object>} confidenceRecords
 * @property {Object} documentation
 * @property {Array<Object>} verificationAttempts
 * @property {boolean} terminal
 */

/**
 * @typedef {Object} MorningQcAction
 * @property {string} type - one of ACTION_TYPES
 * @property {string} [panelId]
 * @property {string} [hypothesisId]
 * @property {string} [evidenceId]
 * @property {string} [reason]
 * @property {string} [description]
 * @property {string} [targetState]
 * @property {string} [decisionId]
 * @property {string} [confidence] - one of CONFIDENCE_LEVELS
 * @property {boolean} [evidenceSupported]
 * @property {boolean} [wasNecessary]
 * @property {Object} [fields]
 */

export {}; // this module has no runtime exports — types only
