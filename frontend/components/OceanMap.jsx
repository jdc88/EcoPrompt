"use client";

import { useEffect, useMemo, useRef } from "react";

/**
 * ArcGIS SceneView + “ocean health” overlay driven by Human Delta efficiency (0–100).
 * Overlay opacity ≈ 1 − score/100 — clearer water when prompts are leaner.
 */
export default function OceanMap({ efficiencyScore }) {
  const containerRef = useRef(null);
  const viewRef = useRef(null);

  const score = efficiencyScore ?? 0;

  const tier = useMemo(() => {
    if (score >= 80) return "clear";
    if (score >= 40) return "medium";
    return "murky";
  }, [score]);

  const overlayOpacity = useMemo(
    () => Math.min(1, Math.max(0, 1 - score / 100)),
    [score],
  );

  const overlayBackground = useMemo(() => {
    if (tier === "clear") {
      return "linear-gradient(145deg, rgba(10,120,160,0.55) 0%, rgba(15,65,110,0.35) 100%)";
    }
    if (tier === "medium") {
      return "linear-gradient(145deg, rgba(110,85,55,0.52) 0%, rgba(40,55,65,0.42) 100%)";
    }
    return "linear-gradient(165deg, rgba(35,18,12,0.78) 0%, rgba(8,10,14,0.92) 100%)";
  }, [tier]);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      const [{ default: EsriMap }, { default: SceneView }] = await Promise.all([
        import("@arcgis/core/Map"),
        import("@arcgis/core/views/SceneView"),
      ]);
      await import("@arcgis/core/assets/esri/themes/dark/main.css");

      if (!containerRef.current || cancelled) return;

      const map = new EsriMap({
        basemap: "oceans",
        ground: "world-elevation",
      });

      const view = new SceneView({
        container: containerRef.current,
        map,
        qualityProfile: "medium",
      });

      if (view.environment?.lighting) {
        view.environment.lighting.directShadowsEnabled = false;
      }

      try {
        await view.when();
        await view
          .goTo(
            {
              position: [-118.35, 33.72, -45],
              heading: 22,
              tilt: 94,
            },
            { duration: 1200 },
          )
          .catch(() => {});
      } catch {
        /* non-fatal */
      }

      viewRef.current = view;
    }

    setup();

    return () => {
      cancelled = true;
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, []);

  const tierCaption =
    tier === "clear"
      ? "Clear coastal water — strong token efficiency."
      : tier === "medium"
        ? "Moderate turbidity — room to trim prompts further."
        : "Heavy overlay — inefficient language strains compute (murkier ocean).";

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">
            Ocean metaphor
          </h2>
          <p className="max-w-xl text-xs text-slate-400">
            Spatial view: cleaner water when Human Delta savings are higher. Overlay
            opacity follows{" "}
            <code className="rounded bg-white/10 px-1 py-0.5 text-[10px] text-cyan-200">
              1 − score / 100
            </code>
            .
          </p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-200">
          Δ score:{" "}
          <span className="tabular-nums text-white">{score.toFixed(1)}</span>
          {" · "}
          {tier === "clear"
            ? "Low murk"
            : tier === "medium"
              ? "Medium turbidity"
              : "High murk"}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-inner">
        <div
          ref={containerRef}
          className="relative z-0 h-[min(52vh,420px)] min-h-[280px] w-full [&_.esri-view-surface]:outline-none"
          role="presentation"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 transition-[opacity,background] duration-700 ease-out"
          style={{
            opacity: overlayOpacity,
            background: overlayBackground,
            mixBlendMode: "multiply",
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[#040d1b]/90 via-[#040d1b]/20 to-transparent px-4 py-3">
          <p className="text-[11px] leading-snug text-slate-300">{tierCaption}</p>
        </div>
      </div>
    </section>
  );
}
