"""Efficiency (token %) and clarity heuristics for Human Delta."""

from __future__ import annotations

import re

_VAGUE = (
    "something",
    "stuff",
    "things",
    "somehow",
    "maybe",
    "might",
    "kind of",
    "sort of",
    "etc",
    "and so on",
)


def efficiency_percent(before: float, after: float) -> float:
    if before <= 0:
        return 0.0
    raw = ((before - after) / before) * 100
    return max(0.0, min(100.0, round(raw, 1)))


def clarity_score(
    original: str,
    optimized: str,
    mode: str,
    reverted: bool,
    *,
    meaning_loss: bool,
    constraint_drop: bool,
) -> float:
    """
    Net clarity / quality score 0–100 (hackathon heuristic).
    """
    score = 55.0

    lo = original.lower()
    opt = optimized.lower()

    removed = 0
    for w in _VAGUE:
        if w in lo and w not in opt:
            removed += 1
    score += min(10.0, removed * 3.5)

    if mode == "structured" and "\n- " in optimized:
        score += 5.0
    elif "\n" in optimized and "\n" not in original and mode == "precise":
        score += 5.0

    if reverted:
        score += 3.0

    if meaning_loss:
        score -= 20.0
    if constraint_drop:
        score -= 10.0

    return max(0.0, min(100.0, round(score, 1)))


def detect_meaning_loss(original: str, optimized: str, mode: str) -> bool:
    if mode == "compact":
        return False
    if not original.strip():
        return False
    ratio = len(optimized) / max(len(original), 1)
    return ratio < 0.42
