/**
 * Token efficiency % and clarity heuristics (parity with backend/scoring.py).
 */

const VAGUE = [
  "something",
  "stuff",
  "things",
  "somehow",
  "maybe",
  "might",
  "kind of",
  "sort of",
  "etc",
  "and so on",
];

export function tokenReductionPct(beforeTokens, afterTokens) {
  if (beforeTokens <= 0) return 0;
  const raw = ((beforeTokens - afterTokens) / beforeTokens) * 100;
  return Math.max(0, Math.min(100, Math.round(raw * 10) / 10));
}

export function detectMeaningLoss(original, optimized, mode) {
  if (mode === "compact") return false;
  if (!original.trim()) return false;
  const ratio = optimized.length / Math.max(original.length, 1);
  return ratio < 0.42;
}

/**
 * @param {boolean} opts.meaningLoss
 * @param {boolean} opts.constraintDrop
 */
export function computeClarityScore(
  original,
  optimized,
  mode,
  reverted,
  { meaningLoss, constraintDrop },
) {
  let score = 55;
  const lo = original.toLowerCase();
  const opt = optimized.toLowerCase();

  let removed = 0;
  for (const w of VAGUE) {
    if (lo.includes(w) && !opt.includes(w)) removed += 1;
  }
  score += Math.min(10, removed * 3.5);

  if (mode === "structured" && optimized.includes("\n- ")) score += 5;
  else if (mode === "precise" && optimized.includes("\n") && !original.includes("\n"))
    score += 5;

  if (reverted) score += 3;
  if (meaningLoss) score -= 20;
  if (constraintDrop) score -= 10;

  return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
}
