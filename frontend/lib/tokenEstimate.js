/**
 * Model-specific token heuristics (frontend-only).
 * GPT: word × 1.3 (tiktoken-quality counting would need WASM/server; this matches prior app default).
 * Claude: word × 1.2
 * LLaMA: word × 1.4
 */

export const TOKEN_MODELS = ["GPT-4", "Claude", "LLaMA"];

const MULTIPLIERS = {
  "GPT-4": 1.3,
  Claude: 1.2,
  LLaMA: 1.4,
};

function wordCount(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

/**
 * @param {string} text
 * @param {string} model One of TOKEN_MODELS
 */
export function estimateTokensByModel(text, model) {
  const mult = MULTIPLIERS[model] ?? MULTIPLIERS["GPT-4"];
  return Math.round(wordCount(text) * mult * 10) / 10;
}
