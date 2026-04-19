"""Persistence aligned with db/schema.sql (prompt_runs + prompt_rewrites)."""

from __future__ import annotations

import json
from typing import Any

from psycopg2.extras import RealDictCursor

from db.db import connect_to_database
from settings import DatabaseConfig


def _db_enabled() -> bool:
    return bool(DatabaseConfig.DATABASE_URL)


def insert_prompt_run(
    raw_prompt: str,
    task_type: str | None,
    target_model: str | None,
) -> int | None:
    if not _db_enabled():
        return None
    conn = connect_to_database()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
            INSERT INTO prompt_runs (raw_prompt, task_type, target_model)
            VALUES (%s, %s, %s)
            RETURNING id
            """,
            (raw_prompt, task_type, target_model),
        )
        row = cur.fetchone()
        conn.commit()
        return int(row["id"]) if row else None
    finally:
        conn.close()


def insert_prompt_rewrite(
    run_id: int,
    optimized_prompt: str,
    changes: list[str],
    model_name: str | None,
    latency_ms: int,
) -> None:
    if not _db_enabled():
        return
    conn = connect_to_database()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO prompt_rewrites (
              run_id, optimized_prompt, changes_json, model_name, latency_ms
            )
            VALUES (%s, %s, %s::jsonb, %s, %s)
            """,
            (
                run_id,
                optimized_prompt,
                json.dumps(changes),
                model_name,
                latency_ms,
            ),
        )
        conn.commit()
    finally:
        conn.close()


def get_recent_runs(limit: int = 20) -> list[dict[str, Any]]:
    if not _db_enabled():
        return []
    conn = connect_to_database()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
            SELECT
              r.id,
              r.raw_prompt,
              r.task_type,
              r.target_model,
              r.created_at,
              pr.optimized_prompt,
              pr.changes_json,
              pr.model_name,
              pr.latency_ms
            FROM prompt_runs r
            LEFT JOIN prompt_rewrites pr ON pr.run_id = r.id
            ORDER BY r.created_at DESC
            LIMIT %s
            """,
            (limit,),
        )
        return list(cur.fetchall())
    finally:
        conn.close()
