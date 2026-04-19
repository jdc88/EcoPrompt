"""
Constraint-aware, mode-based prompt optimization (rules engine).
Modes: clean | precise | compact | structured
"""

from __future__ import annotations

import re
from typing import Final

MODES: Final[frozenset[str]] = frozenset({"clean", "precise", "compact", "structured"})
DEFAULT_MODE = "precise"

# Full filler list (used by precise / compact / structured)
_FILLER_FULL: Final[list[re.Pattern[str]]] = [
    re.compile(r"\bcan you please\b", re.I),
    re.compile(r"\bcould you please\b", re.I),
    re.compile(r"\bcan you\b", re.I),
    re.compile(r"\bi want you to\b", re.I),
    re.compile(r"\bi need you to\b", re.I),
    re.compile(r"\bin detail\b", re.I),
    re.compile(r"\bplease note that\b", re.I),
    re.compile(r"\bit would be great if you could\b", re.I),
    re.compile(r"\bi would like you to\b", re.I),
    re.compile(r"\bas much detail as possible\b", re.I),
    re.compile(r"\bplease\b", re.I),
]

# Clean mode: polite / hedging only (do not aggressively rephrase)
_FILLER_CLEAN: Final[list[re.Pattern[str]]] = [
    re.compile(r"\bcan you please\b", re.I),
    re.compile(r"\bcould you please\b", re.I),
    re.compile(r"\bi want you to\b", re.I),
    re.compile(r"\bin detail\b", re.I),
    re.compile(r"\bplease\b", re.I),
    re.compile(r"\bcan you\b", re.I),
]

_TASK_VERB_RE = re.compile(
    r"\b(explain|analyze|analyse|summarise|summarize|describe|compare|list|"
    r"generate|draft|write|evaluate|prove|show|calculate|predict|identify|outline)\b",
    re.I,
)

_WEAK_WORDS_RE = re.compile(
    r"\b(very|really|quite|basically|actually|just|simply|kind of|sort of)\b",
    re.I,
)


def _normalize_ws(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def _strip_by_patterns(text: str, patterns: list[re.Pattern[str]]) -> str:
    out = text
    for pat in patterns:
        out = pat.sub(" ", out)
    return _normalize_ws(out)


def _dedupe_sentences(text: str) -> str:
    parts = re.split(r"(?<=[.!?])\s+", text)
    parts = [p for p in parts if p.strip()]
    if len(parts) <= 1:
        return text
    seen: set[str] = set()
    out: list[str] = []
    for s in parts:
        key = re.sub(r"\s+", " ", s.lower())
        if key not in seen:
            seen.add(key)
            out.append(s.strip())
    return " ".join(out)


def has_task_verb(text: str) -> bool:
    return bool(_TASK_VERB_RE.search(text[:500]))


def constraint_signature(text: str) -> int:
    sig = len(re.findall(r"\d+", text))
    sig += len(re.findall(r'"[^"]+"', text))
    sig += len(re.findall(r"\b[A-Z]{2,}[A-Z]+\b", text))
    return sig


def loses_task_verb(original: str, candidate: str) -> bool:
    return has_task_verb(original) and not has_task_verb(candidate)


def loses_constraints(original: str, candidate: str) -> bool:
    co, cc = constraint_signature(original), constraint_signature(candidate)
    if co >= 3 and cc < max(1, int(co * 0.75)):
        return True
    return False


def _clean_mode(raw: str) -> str:
    return _strip_by_patterns(raw, list(_FILLER_CLEAN))


def _precise_mode(raw: str) -> str:
    s = _strip_by_patterns(raw, list(_FILLER_FULL))
    if not s:
        return ""
    s = _dedupe_sentences(s)
    # Light structure: break long single block into two lines after second sentence end
    if len(s) > 160 and "\n" not in s:
        m = list(re.finditer(r"[.!?]\s+", s))
        if len(m) >= 2:
            cut = m[1].end()
            s = s[:cut].strip() + "\n" + s[cut:].strip()
    return s


def _compact_mode(raw: str) -> str:
    s = _precise_mode(raw)
    if not s:
        return ""
    s = _WEAK_WORDS_RE.sub(" ", s)
    return _normalize_ws(s)


def _structured_mode(raw: str) -> str:
    s = _strip_by_patterns(raw, list(_FILLER_FULL))
    if not s:
        return ""
    chunks = re.split(r"(?:\s*;\s*|\n+|(?<=[.!?])\s+)", s)
    chunks = [c.strip() for c in chunks if c.strip()]
    if len(chunks) <= 1:
        chunks = [p.strip() for p in re.split(r",\s+", s) if len(p.strip()) > 8]
    if len(chunks) <= 1:
        return s
    return "\n".join(f"- {c}" for c in chunks)


def _apply_mode(raw: str, mode: str) -> str:
    if mode == "clean":
        return _clean_mode(raw)
    if mode == "precise":
        return _precise_mode(raw)
    if mode == "compact":
        return _compact_mode(raw)
    if mode == "structured":
        return _structured_mode(raw)
    return _precise_mode(raw)


def optimize_prompt(raw: str, mode: str | None) -> tuple[str, bool]:
    """
    Returns (optimized_text, reverted_to_safe).
    """
    m = (mode or DEFAULT_MODE).lower().strip()
    if m not in MODES:
        m = DEFAULT_MODE

    candidate = _apply_mode(raw, m)
    safe = _clean_mode(raw)

    if not candidate.strip():
        return (safe, True)

    if loses_task_verb(raw, candidate) or loses_constraints(raw, candidate):
        return (safe, True)

    # Aggressive shrink without compact mode
    if m != "compact" and len(candidate) < max(12, int(len(raw) * 0.42)):
        return (safe, True)

    return (candidate, False)
