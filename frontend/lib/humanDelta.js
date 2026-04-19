/**
 * Human Delta: relate token reduction to a simple “AI compute savings” score.
 */

import { estimateTokens } from "./optimizer";

/**
 * Percentage token reduction (0–100).
 */
export function reductionPercent(beforeTokens, afterTokens) {
  if (beforeTokens <= 0) return 0;
  const raw = ((beforeTokens - afterTokens) / beforeTokens) * 100;
  return Math.max(0, Math.min(100, Math.round(raw * 10) / 10));
}

/**
 * @param {number} beforeTokens
 * @param {number} afterTokens
 * @returns {{
 *   beforeTokens: number,
 *   afterTokens: number,
 *   efficiencyScore: number,
 *   impactLevel: string
 * }}
 */
export function computeHumanDelta(beforeTokens, afterTokens) {
  const efficiencyScore = reductionPercent(beforeTokens, afterTokens);

  let impactLevel;
  if (efficiencyScore > 60) {
    impactLevel = "LOW IMPACT";
  } else if (efficiencyScore > 30) {
    impactLevel = "MEDIUM IMPACT";
  } else {
    impactLevel = "HIGH IMPACT";
  }

  return {
    beforeTokens,
    afterTokens,
    efficiencyScore,
    impactLevel,
  };
}

/**
 * Convenience: raw prompt strings → full delta object.
 */
export function humanDeltaFromPrompts(raw, optimized) {
  const beforeTokens = estimateTokens(raw);
  const afterTokens = estimateTokens(optimized);
  return computeHumanDelta(beforeTokens, afterTokens);
}
