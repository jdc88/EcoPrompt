/**
 * Token estimation + legacy single-call optimize (defaults to precise mode).
 */

import { DEFAULT_OPTIMIZATION_MODE, optimizePromptByMode } from "./modes";
import { estimateTokensByModel } from "./tokenEstimate";

export { optimizePromptByMode, OPTIMIZATION_MODES, DEFAULT_OPTIMIZATION_MODE } from "./modes";

/** @deprecated Prefer estimateTokensByModel; kept for API parity (GPT-4 heuristic). */
export function estimateTokens(text) {
  return estimateTokensByModel(text, "GPT-4");
}

/**
 * @deprecated Prefer optimizePromptByMode from ./modes.js
 * @param {{ taskType?: string }} options — ignored; kept for call-site compatibility
 */
export function optimizePrompt(raw, { taskType } = {}) {
  void taskType;
  return optimizePromptByMode(raw, DEFAULT_OPTIMIZATION_MODE).text;
}
