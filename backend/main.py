"""
EcoPrompt FastAPI: mode-based prompt optimization + Human Delta metrics.
Run: cd backend && .venv/bin/uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

from __future__ import annotations

import logging
import time

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field

from db import queries
from optimizer import (
    DEFAULT_MODE,
    MODES,
    loses_constraints,
    optimize_prompt,
)
from scoring import clarity_score, detect_meaning_loss, efficiency_percent
from settings import DatabaseConfig
from token_estimate import estimate_tokens_by_model

logger = logging.getLogger(__name__)

app = FastAPI(title="EcoPrompt API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=DatabaseConfig.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PromptRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    prompt: str
    mode: str = Field(default=DEFAULT_MODE, description="clean | precise | compact | structured")


class OptimizeResponse(BaseModel):
    optimized: str
    beforeTokens: float
    afterTokens: float
    efficiency: float
    clarityScore: float
    mode: str


@app.get("/health")
def health():
    return {"status": "ok", "db": bool(DatabaseConfig.DATABASE_URL)}


@app.post("/optimize", response_model=OptimizeResponse)
def optimize_endpoint(req: PromptRequest):
    raw = req.prompt.strip()
    if not raw:
        raise HTTPException(status_code=400, detail="prompt is required")

    mode = (req.mode or DEFAULT_MODE).lower().strip()
    if mode not in MODES:
        mode = DEFAULT_MODE

    t0 = time.perf_counter()
    optimized, reverted = optimize_prompt(raw, mode)

    before_t = estimate_tokens_by_model(raw, "GPT-4")
    after_t = estimate_tokens_by_model(optimized, "GPT-4")
    eff = efficiency_percent(before_t, after_t)

    meaning_loss = (not reverted) and detect_meaning_loss(raw, optimized, mode)
    constraint_drop = (not reverted) and loses_constraints(raw, optimized)

    clar = clarity_score(
        raw,
        optimized,
        mode,
        reverted,
        meaning_loss=meaning_loss,
        constraint_drop=constraint_drop,
    )

    latency_ms = int((time.perf_counter() - t0) * 1000)

    run_id = queries.insert_prompt_run(raw, mode, "EcoPrompt")
    if run_id is not None:
        try:
            queries.insert_prompt_rewrite(
                run_id,
                optimized,
                [f"mode:{mode}", "constraint-aware rules"],
                "rules",
                latency_ms,
            )
        except Exception as e:
            logger.warning("DB persist failed (non-fatal): %s", e)

    return OptimizeResponse(
        optimized=optimized,
        beforeTokens=before_t,
        afterTokens=after_t,
        efficiency=eff,
        clarityScore=clar,
        mode=mode,
    )


@app.get("/runs")
def list_runs(limit: int = 20):
    if limit > 100:
        limit = 100
    rows = queries.get_recent_runs(limit)
    return {"runs": rows}
