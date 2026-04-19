/**
 * Rule-based prompt compression: strip fillers, normalize whitespace,
 * compact task directive. Token estimate ≈ words × 1.3.
 */

const FILLER_PATTERNS = [
  /\bcan you please\b/gi,
  /\bcould you please\b/gi,
  /\bi want you to\b/gi,
  /\bi need you to\b/gi,
  /\bin detail\b/gi,
  /\bplease note that\b/gi,
  /\bit would be great if you could\b/gi,
  /\bi would like you to\b/gi,
  /\bas much detail as possible\b/gi,
  /\bplease\b/gi,
];

const TASK_DIRECTIVE = {
  Explain: "Explain",
  Summarize: "Summarize",
  Analyze: "Analyze",
  Generate: "Generate",
};

function wordCount(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function estimateTokens(text) {
  return Math.round(wordCount(text) * 1.3 * 10) / 10;
}

function normalizeWhitespace(str) {
  return str.replace(/\s+/g, " ").trim();
}

function stripFillers(text) {
  let out = text;
  for (const re of FILLER_PATTERNS) {
    out = out.replace(re, " ");
  }
  return normalizeWhitespace(out);
}

function compactLeadingDirective(taskType, body) {
  const verb = TASK_DIRECTIVE[taskType] || "Complete";
  const lower = body.toLowerCase();
  const prefixes = ["explain ", "summarize ", "analyze ", "generate "];
  let rest = body;
  for (const p of prefixes) {
    if (lower.startsWith(p)) {
      rest = body.slice(p.length).trim();
      break;
    }
  }
  return `${verb}: ${rest}`.trim();
}

/**
 * @param {string} raw
 * @param {{ taskType: string }} options
 */
export function optimizePrompt(raw, { taskType }) {
  const stripped = stripFillers(raw);
  if (!stripped) {
    return "";
  }

  let core = stripped;

  const sentences = core.split(/(?<=[.!?])\s+/).filter(Boolean);
  const seen = new Set();
  const deduped = [];
  for (const s of sentences) {
    const key = s.toLowerCase().replace(/\s+/g, " ");
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(s);
    }
  }
  core = deduped.join(" ");

  core = compactLeadingDirective(taskType, core);

  return core;
}
