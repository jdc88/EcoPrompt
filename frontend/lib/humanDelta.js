/**
 * Human Delta: relate token reduction to a simple “AI compute savings” score.
 */

import { estimateTokensByModel } from "./tokenEstimate";

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
 * Convenience: raw + optimized strings → delta for a given tokenizer profile.
 * @param {string} model e.g. "GPT-4" | "Claude" | "LLaMA"
 */
export function humanDeltaFromPrompts(raw, optimized, model = "GPT-4") {
  const beforeTokens = estimateTokensByModel(raw, model);
  const afterTokens = estimateTokensByModel(optimized, model);
  return computeHumanDelta(beforeTokens, afterTokens);
}
