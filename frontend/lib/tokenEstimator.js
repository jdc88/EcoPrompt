// Token estimation for multiple models (GPT, Claude, LLaMA)
// If tiktoken is available, use it for GPT. Otherwise, fallback to word count * 1.3

function wordCount(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

// Try to load tiktoken if available (for GPT-4)
let tiktokenEncode = null;
try {
  // eslint-disable-next-line no-undef
  if (typeof window !== "undefined" && window.tiktoken) {
    tiktokenEncode = window.tiktoken.encode;
  }
} catch {}

export function estimateTokensByModel(text, model) {
  const wc = wordCount(text);
  if (model === "GPT-4") {
    if (tiktokenEncode) {
      try {
        return tiktokenEncode(text).length;
      } catch {}
    }
    return Math.round(wc * 1.3 * 10) / 10;
  }
  if (model === "Claude") {
    return Math.round(wc * 1.2 * 10) / 10;
  }
  if (model === "LLaMA") {
    return Math.round(wc * 1.4 * 10) / 10;
  }
  // Default fallback
  return Math.round(wc * 1.3 * 10) / 10;
}
