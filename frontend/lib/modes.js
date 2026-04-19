/**
 * Mode-based constraint-aware optimization (parity with backend/optimizer.py).
 */

export const OPTIMIZATION_MODES = ["clean", "precise", "compact", "structured"];
export const DEFAULT_OPTIMIZATION_MODE = "precise";

const FILLER_CLEAN = [
  /\bcan you please\b/gi,
  /\bcould you please\b/gi,
  /\bi want you to\b/gi,
  /\bin detail\b/gi,
  /\bplease\b/gi,
  /\bcan you\b/gi,
];

const FILLER_FULL = [
  /\bcan you please\b/gi,
  /\bcould you please\b/gi,
  /\bcan you\b/gi,
  /\bi want you to\b/gi,
  /\bi need you to\b/gi,
  /\bin detail\b/gi,
  /\bplease note that\b/gi,
  /\bit would be great if you could\b/gi,
  /\bi would like you to\b/gi,
  /\bas much detail as possible\b/gi,
  /\bplease\b/gi,
];

const TASK_VERB_RE =
  /\b(explain|analyze|analyse|summarise|summarize|describe|compare|list|generate|draft|write|evaluate|prove|show|calculate|predict|identify|outline)\b/i;

const WEAK_WORDS = /\b(very|really|quite|basically|actually|just|simply|kind of|sort of)\b/gi;

function normalizeWs(str) {
  return str.replace(/\s+/g, " ").trim();
}

function stripByPatterns(text, patterns) {
  let out = text;
  for (const re of patterns) {
    out = out.replace(re, " ");
  }
  return normalizeWs(out);
}

function dedupeSentences(text) {
  const parts = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (parts.length <= 1) return text;
  const seen = new Set();
  const out = [];
  for (const s of parts) {
    const key = s.toLowerCase().replace(/\s+/g, " ");
    if (!seen.has(key)) {
      seen.add(key);
      out.push(s.trim());
    }
  }
  return out.join(" ");
}

export function hasTaskVerb(text) {
  return TASK_VERB_RE.test(text.slice(0, 500));
}

export function constraintSignature(text) {
  const digits = (text.match(/\d+/g) || []).length;
  const quoted = (text.match(/"[^"]+"/g) || []).length;
  const caps = (text.match(/\b[A-Z]{2,}[A-Z]+\b/g) || []).length;
  return digits + quoted + caps;
}

export function losesTaskVerb(original, candidate) {
  return hasTaskVerb(original) && !hasTaskVerb(candidate);
}

export function losesConstraints(original, candidate) {
  const co = constraintSignature(original);
  const cc = constraintSignature(candidate);
  if (co >= 3 && cc < Math.max(1, Math.floor(co * 0.75))) return true;
  return false;
}

function cleanMode(raw) {
  return stripByPatterns(raw, FILLER_CLEAN);
}

function preciseMode(raw) {
  let s = stripByPatterns(raw, FILLER_FULL);
  if (!s) return "";
  s = dedupeSentences(s);
  if (s.length > 160 && !s.includes("\n")) {
    const matches = [...s.matchAll(/[.!?]\s+/g)];
    if (matches.length >= 2) {
      const cut = matches[1].index + matches[1][0].length;
      s = `${s.slice(0, cut).trim()}\n${s.slice(cut).trim()}`;
    }
  }
  return s;
}

function compactMode(raw) {
  let s = preciseMode(raw);
  if (!s) return "";
  s = s.replace(WEAK_WORDS, " ");
  return normalizeWs(s);
}

function structuredMode(raw) {
  const s = stripByPatterns(raw, FILLER_FULL);
  if (!s) return "";
  let chunks = s.split(/\s*;\s*|\n+|(?<=[.!?])\s+/).filter((c) => c.trim());
  if (chunks.length <= 1) {
    chunks = s.split(/,\s+/).filter((c) => c.trim().length > 8);
  }
  if (chunks.length <= 1) return s;
  return chunks.map((c) => `- ${c.trim()}`).join("\n");
}

function applyMode(raw, mode) {
  switch (mode) {
    case "clean":
      return cleanMode(raw);
    case "precise":
      return preciseMode(raw);
    case "compact":
      return compactMode(raw);
    case "structured":
      return structuredMode(raw);
    default:
      return preciseMode(raw);
  }
}

/**
 * @returns {{ text: string, reverted: boolean }}
 */
export function optimizePromptByMode(raw, mode) {
  const m = OPTIMIZATION_MODES.includes(mode) ? mode : DEFAULT_OPTIMIZATION_MODE;
  const candidate = applyMode(raw, m);
  const safe = cleanMode(raw);

  if (!candidate.trim()) {
    return { text: safe, reverted: true };
  }
  if (losesTaskVerb(raw, candidate) || losesConstraints(raw, candidate)) {
    return { text: safe, reverted: true };
  }
  if (m !== "compact" && candidate.length < Math.max(12, raw.length * 0.42)) {
    return { text: safe, reverted: true };
  }
  return { text: candidate, reverted: false };
}
