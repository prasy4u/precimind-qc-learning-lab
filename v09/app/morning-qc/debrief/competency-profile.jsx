/* v09/app/morning-qc/debrief/competency-profile.jsx — Stage 12C, PROVENANCE: V09_NEW
   Section 19: horizontal competency cards, never a radar chart. Uses
   EXACT Stage 12A rating bands (NEEDS_IMPROVEMENT/DEVELOPING/PROFICIENT/
   STRONG) — never invented pseudo-precision like "82.4%". Section 31:
   non-color-only — the rating text itself always accompanies any visual
   tone. */
import React from 'react';
import { dimensionLabel, ratingLabel, RATING_ORDER } from './debrief-model-ui.js';

const TONE = { NEEDS_IMPROVEMENT: 'attention', DEVELOPING: 'neutral', PROFICIENT: 'neutral', STRONG: 'ok' };

export function CompetencyProfile({ competencyProfile }) {
  return (
    <section aria-labelledby="mqcd-competency-heading" className="mqcd-section">
      <h2 id="mqcd-competency-heading" className="mqcd-section__title">Competency Profile</h2>
      <ul className="mqcd-competency-list">
        {competencyProfile.map(c => (
          <li key={c.dimension} className="mqcd-competency-card" data-tone={c.rating ? TONE[c.rating] : 'unassessed'}>
            <span className="mqcd-competency-card__dim">{dimensionLabel(c.dimension)}</span>
            <span className="mqcd-competency-card__rating">{ratingLabel(c.rating)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
