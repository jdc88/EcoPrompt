"""Human Delta scoring (parity with frontend lib/humanDelta.js)."""

from token_estimate import estimate_tokens_by_model


def reduction_percent(before: float, after: float) -> float:
    if before <= 0:
        return 0.0
    raw = ((before - after) / before) * 100
    return max(0.0, min(100.0, round(raw, 1)))


def compute_human_delta(before_tokens: float, after_tokens: float) -> dict:
    efficiency_score = reduction_percent(before_tokens, after_tokens)
    if efficiency_score > 60:
        impact = "LOW IMPACT"
    elif efficiency_score > 30:
        impact = "MEDIUM IMPACT"
    else:
        impact = "HIGH IMPACT"
    return {
        "beforeTokens": before_tokens,
        "afterTokens": after_tokens,
        "efficiencyScore": efficiency_score,
        "impactLevel": impact,
    }


def human_delta_from_prompts(raw: str, optimized: str, model: str = "GPT-4") -> dict:
    b = estimate_tokens_by_model(raw, model)
    a = estimate_tokens_by_model(optimized, model)
    return compute_human_delta(b, a)
