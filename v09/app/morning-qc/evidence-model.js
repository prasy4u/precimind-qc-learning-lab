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
  // Corrective-closure clarification: "supportive" evidence (relevant,
  // non-decisive) is explicitly its own bucket, distinct from "low-value"
  // (irrelevant). Appropriate supportive evidence must never be counted
  // as low-value merely because it isn't decisive.
  const supportiveObtained = obtainedItems.filter(e => e.relevant && !e.decisive);
  const lowValueObtained = obtainedItems.filter(e => !e.relevant);
  const highValueMissed = missedItems.filter(e => e.decisive && e.relevant);

  return {
    totalEvidence: evidence.length,
    obtainedCount: obtainedItems.length,
    highValueObtained: highValueObtained.map(e => e.id),
    supportiveObtained: supportiveObtained.map(e => e.id),
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
  const relevantPanels = panels.filter(p => p.relevance === 'RELEVANT');
  const relevantInspected = relevantPanels.filter(p => inspected.has(p.id));
  const relevantUninspected = relevantPanels.filter(p => !inspected.has(p.id));

  return {
    totalPanels: panels.length,
    inspectedCount: inspectedItems.length,
    irrelevantInspectedCount: irrelevantInspected.length,
    relevantUninspectedIds: relevantUninspected.map(p => p.id),
    totalRelevantPanels: relevantPanels.length,
    relevantInspectedCount: relevantInspected.length,
    // Precision-like: correctly avoiding irrelevant panels (Stage 12A
    // Section 6/19) — a positive signal on its own, but NOT sufficient
    // alone (see recallRatio below and scoring-model.js's FINAL-closure
    // fix: a pristine, zero-inspection state must not score STRONG merely
    // because it trivially avoided irrelevant panels too).
    selectivityRatio: panels.length > 0 ? 1 - (irrelevantInspected.length / panels.length) : null,
    // Recall-like: did the learner actually obtain the relevant
    // information that exists, rather than merely avoid the irrelevant?
    // null (not zero) when there are no relevant panels to recall, so
    // rate() doesn't misinterpret an edge case as a failure.
    recallRatio: relevantPanels.length > 0 ? relevantInspected.length / relevantPanels.length : null,
  };
}
