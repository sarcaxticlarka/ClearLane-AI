"""Builds the daily/weekly/monthly report: trend + comparison + snapshot + suggestions.

The dataset is a fixed historical window (Nov 2023 - Apr 2024), not a live feed, so
"daily/weekly/monthly" select the trend's time resolution and how many recent points
are compared (last point vs the one before it) rather than a literal "today" query.
Zone-level snapshot data (top zones, severity breakdown, anomalies) isn't time-sliced
per period — it reflects the full dataset — and is presented as a separate "current
snapshot" section so the report stays honest about what's period-specific and what isn't.
"""
from .state import DataStore

RECENT_POINTS = {"daily": 14, "weekly": 12, "monthly": 5}


def _severity_breakdown(zones: list[dict]) -> dict[str, int]:
    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for z in zones:
        sev = z.get("severity", "low")
        if sev in counts:
            counts[sev] += 1
    return counts


def _build_suggestions(
    period: str,
    change_pct: float | None,
    top_zones: list[dict],
    anomaly_count: int,
    severity: dict[str, int],
) -> list[str]:
    suggestions = []

    if change_pct is not None:
        if change_pct > 10:
            suggestions.append(
                f"Violations rose {change_pct:.0f}% vs the previous {period[:-2] if period.endswith('ly') else period} period — "
                "consider increasing patrol frequency in top-priority zones before the trend compounds."
            )
        elif change_pct < -10:
            suggestions.append(
                f"Violations fell {abs(change_pct):.0f}% vs the previous period — current enforcement levels appear "
                "effective; maintain the existing schedule rather than reallocating officers away."
            )

    if top_zones:
        top = top_zones[0]
        suggestions.append(
            f"Zone {top['zone_id']} ({top.get('dominant_police_station', 'unknown station')}) remains the highest-priority "
            f"hotspot at {top['obstruction_score']}/100 obstruction — sustained enforcement here has the largest "
            "single-zone impact on city-wide congestion."
        )

    if anomaly_count > 0:
        suggestions.append(
            f"{anomaly_count} zone(s) are flagged as statistical anomalies this period — these represent unusual "
            "spikes a routine patrol schedule wouldn't catch; investigate for emerging hotspots or one-off events."
        )

    if severity["critical"] + severity["high"] > 0:
        suggestions.append(
            f"{severity['critical']} critical and {severity['high']} high-severity zones need officers within their "
            "documented peak time windows — see the Shift Schedule tool for the current allocation."
        )

    if not suggestions:
        suggestions.append("No significant changes or anomalies detected this period — conditions are stable.")

    return suggestions


def build_report(period: str, store: DataStore) -> dict:
    trend = store.report_trends.get(period, [])
    n_recent = RECENT_POINTS.get(period, 12)
    recent = trend[-n_recent:] if trend else []

    current_count = recent[-1]["count"] if len(recent) >= 1 else 0
    prior_count = recent[-2]["count"] if len(recent) >= 2 else None
    change_pct = ((current_count - prior_count) / prior_count * 100) if prior_count else None

    total_violations = sum(p["count"] for p in trend)
    top_zones_raw = sorted(store.zones, key=lambda z: -z["obstruction_score"])[:5]
    top_zones = [
        {
            "zone_id": z["zone_id"],
            "centroid_lat": z["centroid_lat"],
            "centroid_lng": z["centroid_lng"],
            "violation_count": z["violation_count"],
            "obstruction_score": z["obstruction_score"],
            "dominant_police_station": z.get("dominant_police_station"),
            "is_junction": z.get("is_junction", False),
            "peak_hour": z.get("peak_hour"),
            "severity": z["severity"],
            "anomaly_flag": z["zone_id"] in store.anomaly_zone_ids,
        }
        for z in top_zones_raw
    ]
    severity = _severity_breakdown(store.zones)
    anomaly_count = len(store.anomalies)
    enforcement_summary = store.enforcement_recs[:5]

    return {
        "period": period,
        "date_range": {
            "start": trend[0]["date"] if trend else None,
            "end": trend[-1]["date"] if trend else None,
        },
        "trend": recent,
        "total_violations": total_violations,
        "current_period_count": current_count,
        "prior_period_count": prior_count,
        "change_pct": round(change_pct, 1) if change_pct is not None else None,
        "severity_breakdown": severity,
        "top_zones": top_zones,
        "anomaly_count": anomaly_count,
        "enforcement_summary": enforcement_summary,
        "suggestions": _build_suggestions(period, change_pct, top_zones, anomaly_count, severity),
    }
