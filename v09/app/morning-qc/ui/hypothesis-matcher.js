/* =========================================================================
   v09/app/morning-qc/ui/hypothesis-matcher.js

   Morning QC Room — Stage 12B Hypothesis Free-Text Matcher
   PROVENANCE: V09_NEW

   FINAL-UI-INTEGRATION-CLOSURE FIX: replaces the prior naive matcher
   (`normalize(label).includes(query) || query.includes(normalize(label)
   .split(' ')[0])`), which silently matched on stopword first-words
   ("a", "an", "the") and produced confirmed wrong matches — e.g.
   "calibration problem" incorrectly resolving to hyp-population,
   "sample handling issue"/"preanalytical factor" incorrectly resolving
   to hyp-analytical-error.

   This is a GENERAL matcher — no case-ID branching, no pilot-specific
   logic. It:
     1. Tokenizes both the query and each hypothesis label, stripping
        punctuation/hyphens, filtering stopwords, and normalizing a small
        set of GENERAL laboratory/QC domain synonyms (shift≈change≈trend,
        issue≈problem≈error, sample≈specimen, etc.) — vocabulary
        reasonable for any future case, not tied to any one pilot's exact
        wording.
     2. Scores each candidate hypothesis via IDF-style weighting: a token
        appearing in FEWER of the case's own hypotheses is a stronger,
        more distinctive signal than one appearing in several (e.g.
        "lot" is distinctive to one Pilot 1 hypothesis; a generic
        synonym-normalized "change" token appearing in multiple
        hypotheses' labels is intentionally down-weighted so it cannot
        alone decide a match).
     3. Requires a UNIQUE top-scoring candidate — a tie, or zero
        candidates with any token overlap at all, returns no match
        (never silently guesses).
   ========================================================================= */

const STOPWORDS = new Set([
  'a', 'an', 'the', 'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'to', 'of', 'in', 'on', 'at', 'by', 'for', 'with', 'from', 'into', 'despite', 'under', 'over', 'than',
  'and', 'or', 'but', 'not', 'no', 'nor', 'some', 'all', 'any', 'it', 'its', 'as', 'if', 'so', 'due', 'because',
  'could', 'can', 'may', 'might', 'would', 'will', 'should', 'occurring', 'occurs', 'introduced', 'responsible',
  'driving', 'caused', 'explain', 'explains', 'specific',
]);

// General (non-case-specific) QC/laboratory-domain synonym groups.
const SYNONYM_CANON = new Map();
function addSynonymGroup(words, canonical) { for (const w of words) SYNONYM_CANON.set(w, canonical); }
addSynonymGroup(['shift', 'change', 'trend', 'drift', 'variation', 'changes'], 'change');
addSynonymGroup(['issue', 'problem', 'error', 'fault', 'errors', 'problems', 'issues'], 'issue');
addSynonymGroup(['sample', 'specimen', 'specimens', 'samples'], 'specimen');
addSynonymGroup(['handling', 'preanalytical', 'pre-analytical'], 'preanalytical');
addSynonymGroup(['lot', 'lots'], 'lot');
addSynonymGroup(['population', 'case-mix', 'casemix', 'mix'], 'population');
addSynonymGroup(['calibration', 'calibrations', 'calibrate'], 'calibration');
addSynonymGroup(['analytical', 'analytic', 'analyzer'], 'analytical');
addSynonymGroup(['random', 'chance', 'noise'], 'random');
addSynonymGroup(['statistically', 'statistical', 'statistics'], 'statistical');
addSynonymGroup(['factor', 'factors'], 'factor');

export function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .filter(w => w.length > 2 || /^\d+$/.test(w))
    .filter(w => !STOPWORDS.has(w))
    .map(w => SYNONYM_CANON.get(w) || w);
}

/**
 * Returns the uniquely-credible hypothesis match for a learner's free-text
 * draft, or `null` if there is no match or the match is ambiguous (never
 * silently guesses). `hypotheses` is an array of `{ id, label }`.
 */
export function findUniqueHypothesisMatch(query, hypotheses) {
  const queryTokens = [...new Set(tokenize(query))];
  if (queryTokens.length === 0 || hypotheses.length === 0) return null;

  const labelTokenSets = hypotheses.map(h => new Set(tokenize(h.label)));
  const docFreq = new Map();
  for (const t of queryTokens) {
    let count = 0;
    for (const set of labelTokenSets) if (set.has(t)) count++;
    docFreq.set(t, count);
  }

  const scored = hypotheses
    .map((h, i) => {
      let score = 0;
      for (const t of queryTokens) {
        if (labelTokenSets[i].has(t)) score += 1 / (docFreq.get(t) || 1);
      }
      return { h, score };
    })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return null;
  if (scored.length > 1 && scored[0].score === scored[1].score) return null;
  return scored[0].h;
}
