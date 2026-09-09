/* v09/app/morning-qc/debrief/learning-priorities.jsx — Stage 12C, PROVENANCE: V09_NEW
   Section 20/21: max 3 priorities, max 3 lab recommendations, both
   derived from real weak competency dimensions — never generic when the
   learner performed well. */
import React from 'react';
import { dimensionLabel } from './debrief-model-ui.js';

const PRIORITY_TEXT = {
  SIGNAL_RECOGNITION: 'Acknowledge signals promptly once a genuine disturbance is suspected.',
  ANALYTICAL_REASONING: 'Distinguish stable IQC/EQA performance from evidence that fully explains a specific finding.',
  RISK_REASONING: 'Contain risk (hold/escalate) before continuing analysis on an unresolved signal.',
  INVESTIGATION_STRATEGY: 'Delay final disposition until decisive evidence is available, rather than reasoning from partial information.',
  EVIDENCE_SELECTION: 'Prioritize obtaining high-value evidence before drawing conclusions.',
  PATIENT_IMPACT_REASONING: 'Reassess patient impact explicitly once an analytical disturbance is confirmed.',
  DECISION_APPROPRIATENESS: 'Review the case-authored rationale for each decision option before committing.',
  VERIFICATION_QUALITY: 'Ensure verification criteria are genuinely met before considering recovery complete.',
  DOCUMENTATION_GOVERNANCE: 'Document your final disposition and rationale explicitly before closing a case.',
  METACOGNITIVE_CALIBRATION: 'Calibrate confidence to the strength of evidence actually available at decision time.',
};

export function LearningPriorities({ learningPriorities, strengths, recommendedLabs }) {
  return (
    <section aria-labelledby="mqcd-priorities-heading" className="mqcd-section">
      <h2 id="mqcd-priorities-heading" className="mqcd-section__title">Learning Priorities</h2>
      {strengths.length > 0 && (
        <p className="mqcd-strength">Strong point: {strengths.map(dimensionLabel).join(', ')}.</p>
      )}
      {learningPriorities.length === 0 ? (
        <p className="mqcd-empty">No specific priorities identified — overall performance was solid across assessed dimensions.</p>
      ) : (
        <ul className="mqcd-priorities-list">
          {learningPriorities.map(dim => (
            <li key={dim}>{PRIORITY_TEXT[dim] || `Review ${dimensionLabel(dim)}.`}</li>
          ))}
        </ul>
      )}
      {recommendedLabs.length > 0 && (
        <div className="mqcd-recommended-labs">
          <h3>Related PreciMind labs</h3>
          <ul>{recommendedLabs.map(lab => <li key={lab}>{lab}</li>)}</ul>
        </div>
      )}
    </section>
  );
}
