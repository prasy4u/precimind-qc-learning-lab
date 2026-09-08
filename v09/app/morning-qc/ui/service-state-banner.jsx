/* v09/app/morning-qc/ui/service-state-banner.jsx — Stage 12B, PROVENANCE: V09_NEW
   Renders the engine's serviceState verbatim. Never implies ESCALATED means
   investigation complete, or RUNNING means analytically safe (Section 15) —
   the banner shows only the state name, no interpretive claim. */
import React from 'react';
import { serviceStateLabel, SERVICE_STATE_TONE } from './ui-model.js';

export function ServiceStateBanner({ serviceState }) {
  const tone = SERVICE_STATE_TONE[serviceState] || 'neutral';
  return (
    <div className="mqc-service-banner" data-tone={tone} role="status" aria-live="polite">
      <span className="mqc-service-banner__dot" aria-hidden="true" />
      <span>{serviceStateLabel(serviceState)}</span>
    </div>
  );
}
