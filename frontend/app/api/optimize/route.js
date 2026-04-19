import { NextResponse } from "next/server";
import { optimizePrompt, estimateTokens } from "@/lib/optimizer";
import { computeHumanDelta } from "@/lib/humanDelta";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt : "";
  const taskType =
    typeof body.taskType === "string" ? body.taskType : "Explain";

  const trimmed = prompt.trim();
  if (!trimmed) {
    return NextResponse.json({
      optimized: "",
      beforeTokens: 0,
      afterTokens: 0,
      efficiencyScore: 0,
      impactLevel: "HIGH IMPACT",
    });
  }

  const optimized = optimizePrompt(trimmed, { taskType });
  const beforeTokens = estimateTokens(trimmed);
  const afterTokens = estimateTokens(optimized);
  const { efficiencyScore, impactLevel } = computeHumanDelta(
    beforeTokens,
    afterTokens,
  );

  return NextResponse.json({
    optimized,
    beforeTokens,
    afterTokens,
    efficiencyScore,
    impactLevel,
  });
}
