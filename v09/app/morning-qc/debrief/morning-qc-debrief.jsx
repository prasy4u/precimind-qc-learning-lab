/* =========================================================================
   v09/app/morning-qc/debrief/morning-qc-debrief.jsx

   Morning QC Room — Stage 12C Debrief Root Component
   PROVENANCE: V09_NEW

   Section 33: progressive disclosure — case resolution and performance
   overview lead; detailed sections (decisions, evidence, patient safety,
   documentation, full timeline) follow via expandable sections, never
   all shown flatly above the fold. Section 8: this component NEVER
   computes the debrief projection itself — it receives an
   already-gated projection object as a prop, produced by
   debrief-adapter.js's getDebriefProjection() only after the gate is
   satisfied. If projection is null/undefined, nothing renders (no
   fallback answer-key-shaped placeholder).
   ========================================================================= */
import React, { useState, useRef, useEffect } from 'react';
import { DebriefHeader } from './debrief-header.jsx';
import { CaseResolution } from './case-resolution.jsx';
import { CompetencyProfile } from './competency-profile.jsx';
import { LearningPriorities } from './learning-priorities.jsx';
import { DecisionReview } from './decision-review.jsx';
import { ConfidenceCalibration } from './confidence-calibration.jsx';
import { EvidenceReview } from './evidence-review.jsx';
import { PatientSafetyReview } from './patient-safety-review.jsx';
import { DocumentationReview } from './documentation-review.jsx';
import { ReasoningTimeline } from './reasoning-timeline.jsx';

function Disclosure({ title, children, defaultOpen }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const id = 'mqcd-disc-' + title.replace(/\s+/g, '-').toLowerCase();
  return (
    <div className="mqcd-disclosure">
      <button
        type="button"
        className="mqcd-disclosure__toggle"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(o => !o)}
      >
        {title}
      </button>
      {open && <div id={id}>{children}</div>}
    </div>
  );
}

function HypothesisReview({ hypothesisReview }) {
  return (
    <section aria-labelledby="mqcd-hyp-heading" className="mqcd-section">
      <h2 id="mqcd-hyp-heading" className="mqcd-section__title">Hypothesis Review</h2>
      {hypothesisReview.length === 0 && <p className="mqcd-empty">No hypotheses were formed this case.</p>}
      <ul className="mqcd-hypothesis-review-list">
        {hypothesisReview.map(h => (
          <li key={h.id}>
            <span>{h.label}</span>
            <span className="mqcd-hypothesis-review-list__state">{h.finalState}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MorningQCDebrief({ projection, onRepeat, onAnotherCase, onReturn }) {
  const headingRef = useRef(null);
  useEffect(() => { headingRef.current?.focus(); }, []);

  if (!projection) return null;

  return (
    <div className="mqcd-root" data-testid="morning-qc-debrief">
      <DebriefHeader caseIdentity={projection.caseIdentity} />
      <div className="mqcd-body" tabIndex={-1} ref={headingRef}>
        <CaseResolution caseResolution={projection.caseResolution} />
        <LearningPriorities
          learningPriorities={projection.learningPriorities}
          strengths={projection.strengths}
          recommendedLabs={projection.recommendedLabs}
        />
        <CompetencyProfile competencyProfile={projection.competencyProfile} />

        <Disclosure title="Decisions" defaultOpen>
          <DecisionReview decisionReview={projection.decisionReview} />
          <ConfidenceCalibration confidenceCalibration={projection.confidenceCalibration} revisedDecisions={projection.revisedDecisions} />
        </Disclosure>

        <Disclosure title="Evidence &amp; Hypotheses">
          <EvidenceReview evidenceReview={projection.evidenceReview} />
          <HypothesisReview hypothesisReview={projection.hypothesisReview} />
        </Disclosure>

        <Disclosure title="Patient Safety">
          <PatientSafetyReview patientSafetyReview={projection.patientSafetyReview} />
        </Disclosure>

        <Disclosure title="Documentation">
          <DocumentationReview documentationVsExecuted={projection.documentationVsExecuted} />
        </Disclosure>

        <Disclosure title="Detailed Timeline">
          <ReasoningTimeline reasoningTimeline={projection.reasoningTimeline} />
        </Disclosure>

        <div className="mqcd-actions">
          <button type="button" className="mqc-btn" onClick={onRepeat}>Repeat this case</button>
          <button type="button" className="mqc-btn" onClick={onAnotherCase}>Try another Morning QC case</button>
          <button type="button" className="mqc-btn" data-variant="primary" onClick={onReturn}>Return to PreciMind</button>
        </div>
      </div>
    </div>
  );
}
