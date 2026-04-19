/**
 * Rough heuristic: tokens → resource footprint (hackathon-scale approximations).
 */

/**
 * @param {number} tokens
 * @returns {{ energy: number, water: number }} kWh and liters
 */
export function calculateImpact(tokens) {
  const t = Math.max(0, Number(tokens) || 0);
  return {
    energy: t * 0.0003,
    water: t * 0.0002,
  };
}

/**
 * @param {number} beforeTokens
 * @param {number} afterTokens
 * @returns {{
 *   energySaved: number,
 *   waterSaved: number,
 *   reductionPercent: number
 * }}
 */
export function calculateSavings(beforeTokens, afterTokens) {
  const before = Math.max(0, Number(beforeTokens) || 0);
  const after = Math.max(0, Number(afterTokens) || 0);
  const bi = calculateImpact(before);
  const ai = calculateImpact(after);
  const energySaved = Math.max(0, bi.energy - ai.energy);
  const waterSaved = Math.max(0, bi.water - ai.water);
  const reductionPercent =
    before <= 0
      ? 0
      : Math.max(0, Math.min(100, Math.round(((before - after) / before) * 1000) / 10));

  return {
    energySaved,
    waterSaved,
    reductionPercent,
  };
}
