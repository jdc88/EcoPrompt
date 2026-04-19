"use client";

import { useMemo, useState } from "react";
import { estimateTokens, optimizePrompt } from "@/lib/promptOptimizer";

const TASK_TYPES = ["Explain", "Summarize", "Analyze", "Generate"];
const MODELS = ["GPT-4", "Claude", "LLaMA"];

function pctReduction(before, after) {
  if (before <= 0) return 0;
  return Math.max(0, Math.round(((before - after) / before) * 1000) / 10);
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [taskType, setTaskType] = useState("Explain");
  const [targetModel, setTargetModel] = useState("GPT-4");
  const [optimized, setOptimized] = useState("");
  const [tokensBefore, setTokensBefore] = useState(null);
  const [tokensAfter, setTokensAfter] = useState(null);
  const [copied, setCopied] = useState(false);

  const reductionPct = useMemo(() => {
    if (tokensBefore == null || tokensAfter == null) return null;
    return pctReduction(tokensBefore, tokensAfter);
  }, [tokensBefore, tokensAfter]);

  const efficiencyLabel =
    reductionPct != null && reductionPct > 50 ? "HIGH" : "MEDIUM";

  function handleOptimize() {
    const raw = prompt.trim();
    if (!raw) {
      setOptimized("");
      setTokensBefore(null);
      setTokensAfter(null);
      return;
    }

    const before = estimateTokens(raw);
    const out = optimizePrompt(raw, { taskType });
    const after = estimateTokens(out);

    setOptimized(out);
    setTokensBefore(before);
    setTokensAfter(after);
    setCopied(false);
  }

  async function handleCopy() {
    if (!optimized) return;
    try {
      await navigator.clipboard.writeText(optimized);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const tokenDelta =
    tokensBefore != null && tokensAfter != null
      ? Math.max(0, Math.round((tokensBefore - tokensAfter) * 10) / 10)
      : null;

  const panelClass =
    "rounded-2xl border border-white/10 bg-white/10 p-6 shadow-glow backdrop-blur-xl transition hover:border-cyan-400/25 hover:bg-white/[0.12]";

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-10 md:px-8">
      <header className="text-center md:text-left">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-300/80">
          Same intent · fewer tokens · lower cost
        </p>
      </header>

      <div className="grid flex-1 gap-6 md:grid-cols-2 md:gap-8">
        {/* Left — Input */}
        <section className={`${panelClass} flex flex-col gap-6`}>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              🌿 EcoPrompt
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-300">
              Trim noise from your prompts before they hit the model—clearer
              instructions, fewer tokens, and less wasted compute.
            </p>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Your prompt
            </span>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={8}
              placeholder="Paste a verbose prompt…"
              className="min-h-[180px] w-full resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none ring-cyan-400/30 transition focus:border-cyan-400/40 focus:ring-2"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Task type
              </span>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-slate-100 outline-none ring-cyan-400/30 transition focus:border-cyan-400/40 focus:ring-2"
              >
                {TASK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Target model
              </span>
              <select
                value={targetModel}
                onChange={(e) => setTargetModel(e.target.value)}
                className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-slate-100 outline-none ring-cyan-400/30 transition focus:border-cyan-400/40 focus:ring-2"
              >
                {MODELS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            type="button"
            onClick={handleOptimize}
            className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-5 py-3.5 text-sm font-semibold text-ocean-deep shadow-glow transition hover:from-cyan-400 hover:to-cyan-300 hover:shadow-[0_0_48px_-8px_rgba(34,211,238,0.55)] active:scale-[0.99]"
          >
            <span className="relative z-10">Optimize Prompt</span>
            <span
              aria-hidden
              className="absolute inset-0 bg-white/10 opacity-0 transition group-hover:opacity-100"
            />
          </button>
        </section>

        {/* Right — Output */}
        <section className={`${panelClass} flex flex-col gap-6`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">
              Optimized Output
            </h2>
            <button
              type="button"
              disabled={!optimized}
              onClick={handleCopy}
              className="rounded-lg border border-cyan-400/35 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-cyan-200 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="min-h-[180px] rounded-xl border border-white/10 bg-black/25 px-4 py-3">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-100">
              {optimized || (
                <span className="text-slate-500">
                  Run optimize to see a tighter prompt here.
                </span>
              )}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Tokens
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-white">
                {tokensBefore != null && tokensAfter != null ? (
                  <>
                    {tokensBefore}
                    <span className="mx-1 text-slate-500">→</span>
                    {tokensAfter}
                  </>
                ) : (
                  <span className="text-slate-500">—</span>
                )}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Reduction
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-cyan-300">
                {reductionPct != null ? `${reductionPct}%` : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Efficiency
              </p>
              <p className="mt-1 text-lg font-semibold text-white">
                {tokensBefore != null ? efficiencyLabel : "—"}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-cyan-400/20 bg-cyan-950/30 px-4 py-4">
            <h3 className="text-sm font-semibold text-cyan-200">🧬 Human Delta</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Every token skipped is a little less attention math and energy per
              request.
              {tokenDelta != null && tokensBefore != null && tokensBefore > 0 ? (
                <>
                  {" "}
                  At roughly{" "}
                  <span className="font-medium text-cyan-100">
                    {tokenDelta} fewer estimated tokens
                  </span>{" "}
                  than your original draft ({tokensBefore} → {tokensAfter}), you
                  shrink forward passes without changing what you meant to ask.
                </>
              ) : (
                <>
                  {" "}
                  Optimize a prompt to see how many estimated tokens you could
                  shave off each call.
                </>
              )}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">What Changed</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                Removed filler words
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                Reduced redundancy
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                Improved clarity
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                Compressed structure
              </li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
