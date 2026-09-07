/* =========================================================================
   v09/app/morning-qc/evidence-model.js

   Morning QC Room — Stage 12A Evidence Model
   PROVENANCE: V09_NEW

   Section 16: evidence must never automatically dictate a decision unless
   the case genuinely warrants it. This module provides pure summarization
   helpers over a case's evidence array and a completed action trace — it
   does not itself decide anything; it exposes facts (which evidence was
   obtained, which was decisive, which was irrelevant) for the scoring and
   debrief models to interpret.
   ========================================================================= */

export function summarizeEvidenceUsage(caseObj, finalState) {
  const evidence = caseObj.evidence || [];
  const obtained = new Set(finalState.obtainedEvidenceIds || []);

  const obtainedItems = evidence.filter(e => obtained.has(e.id));
  const missedItems = evidence.filter(e => !obtained.has(e.id));

  const highValueObtained = obtainedItems.filter(e => e.decisive && e.relevant);
  const lowValueObtained = obtainedItems.filter(e => !e.relevant);
  const highValueMissed = missedItems.filter(e => e.decisive && e.relevant);

  return {
    totalEvidence: evidence.length,
    obtainedCount: obtainedItems.length,
    highValueObtained: highValueObtained.map(e => e.id),
    lowValueObtained: lowValueObtained.map(e => e.id),
    highValueMissed: highValueMissed.map(e => e.id),
    efficiencyRatio: obtainedItems.length > 0 ? highValueObtained.length / obtainedItems.length : null,
  };
}

export function summarizePanelUsage(caseObj, finalState) {
  const panels = caseObj.panels || [];
  const inspected = new Set(finalState.inspectedPanelIds || []);
  const inspectedItems = panels.filter(p => inspected.has(p.id));
  const irrelevantInspected = inspectedItems.filter(p => p.relevance === 'IRRELEVANT');
  const relevantUninspected = panels.filter(p => p.relevance === 'RELEVANT' && !inspected.has(p.id));

  return {
    totalPanels: panels.length,
    inspectedCount: inspectedItems.length,
    irrelevantInspectedCount: irrelevantInspected.length,
    relevantUninspectedIds: relevantUninspected.map(p => p.id),
    // Expert performance includes correctly NOT inspecting irrelevant panels
    // (Stage 12A Section 6/19) — this is a positive signal, not a penalty
    // for low inspection count; the scoring model interprets this ratio.
    selectivityRatio: panels.length > 0 ? 1 - (irrelevantInspected.length / panels.length) : null,
  };
}
