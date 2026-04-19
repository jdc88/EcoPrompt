"""Model-specific token heuristics (parity with frontend lib/tokenEstimate.js)."""

TOKEN_MODELS = ("GPT-4", "Claude", "LLaMA")

_MULTIPLIERS = {
    "GPT-4": 1.3,
    "Claude": 1.2,
    "LLaMA": 1.4,
}


def _word_count(text: str) -> int:
    t = text.strip()
    if not t:
        return 0
    return len(t.split())


def estimate_tokens_by_model(text: str, model: str) -> float:
    mult = _MULTIPLIERS.get(model, _MULTIPLIERS["GPT-4"])
    return round(_word_count(text) * mult, 1)
