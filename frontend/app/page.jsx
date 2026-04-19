"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import EcoPromptUI from "@/components/EcoPromptUI";

const OceanMap = dynamic(() => import("@/components/OceanMap"), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-slate-400">
      Loading ocean scene…
    </div>
  ),
});

export default function Home() {
  const [signal, setSignal] = useState(null);

  const onSignalMetrics = useCallback((m) => {
    setSignal(m);
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-4 py-10 md:px-8">
      <header className="text-center md:text-left">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-300/80">
          Same intent · clearer signal · efficiency + clarity · compute-flow view
        </p>
      </header>

      <EcoPromptUI onSignalMetrics={onSignalMetrics} />

      <OceanMap
        tokens={signal?.afterTokens ?? 50}
        beforeTokens={signal?.beforeTokens ?? null}
        efficiency={signal?.efficiency ?? 0}
        clarityScore={signal?.clarityScore ?? 50}
      />
    </main>
  );
}
