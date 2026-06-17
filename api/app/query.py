"""NL query endpoint: lightweight RAG over pre-computed zone/enforcement/anomaly JSON via Groq.

If GROQ_API_KEY is unset or the API call fails (rate limit, network), falls back to a
deterministic templated answer built from the same context — documented in the build plan
as the mitigation for LLM rate limits during a live demo.
"""
import os
import re

from .models import QueryResponse
from .state import DataStore

_client = None

GROQ_MODEL = "llama-3.3-70b-versatile"


def _get_client():
    global _client
    if _client is not None:
        return _client
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        return None
    from groq import Groq

    _client = Groq(api_key=api_key)
    return _client


def _build_context(store: DataStore) -> str:
    top_zones = sorted(store.zones, key=lambda z: -z["obstruction_score"])[:10]
    lines = ["Top enforcement-priority zones in Bengaluru (from ClearLane AI analysis):"]
    for z in top_zones:
        lines.append(
            f"- Zone {z['zone_id']} near {z.get('dominant_police_station', 'unknown')} station: "
            f"obstruction score {z['obstruction_score']}/100 ({z['severity']}), "
            f"{z['violation_count']} violations, junction={z.get('is_junction', False)}, "
            f"peak hour {z.get('peak_hour')}:00"
        )
    if store.anomalies:
        lines.append("\nAnomalous zones flagged by Isolation Forest:")
        for a in store.anomalies[:5]:
            lines.append(f"- Zone {a['zone_id']} ({a.get('dominant_police_station')}): anomaly score {a['anomaly_score']}")
    return "\n".join(lines)


def _extract_zone_ids(text: str) -> list[int]:
    return sorted({int(m) for m in re.findall(r"[Zz]one\s+(\d+)", text)})


def _fallback_answer(question: str, store: DataStore) -> QueryResponse:
    top = sorted(store.zones, key=lambda z: -z["obstruction_score"])[:3]
    if not top:
        return QueryResponse(answer="No zone data is available yet.", referenced_zone_ids=[])
    parts = [
        f"Zone {z['zone_id']} ({z.get('dominant_police_station', 'unknown')}) — "
        f"obstruction score {z['obstruction_score']}/100, {z['violation_count']} violations"
        for z in top
    ]
    answer = (
        "The AI assistant is unavailable right now, so here is the top-priority data directly: "
        + "; ".join(parts) + "."
    )
    return QueryResponse(answer=answer, referenced_zone_ids=[z["zone_id"] for z in top])


async def answer_question(question: str, store: DataStore) -> QueryResponse:
    client = _get_client()
    if client is None:
        return _fallback_answer(question, store)

    context = _build_context(store)
    system_prompt = (
        "You are ClearLane AI's traffic enforcement assistant for Bengaluru. "
        "Answer using ONLY the data context provided. "
        "Be concise (2-4 sentences) and reference zone IDs and real station/locations when relevant."
    )
    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"DATA CONTEXT:\n{context}\n\nQUESTION: {question}"},
            ],
            temperature=0.3,
            max_tokens=300,
        )
        text = response.choices[0].message.content or ""
        return QueryResponse(answer=text, referenced_zone_ids=_extract_zone_ids(text))
    except Exception:
        return _fallback_answer(question, store)
