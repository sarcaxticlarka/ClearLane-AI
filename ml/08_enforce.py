"""Phase 2.5: Enforcement priority engine.

priority_score = obstruction*0.6 + spike_risk*0.25 + anomaly_flag*0.15
Ranks zones, emits top-N actionable enforcement recommendations.
"""
import json

from config import OUTPUT_DIR, PRIORITY_WEIGHTS, TOP_N_ENFORCEMENT


def load_json(path, default):
    p = OUTPUT_DIR / path
    if not p.exists():
        return default
    with open(p) as f:
        return json.load(f)


def time_window_for_hour(hour: int | None) -> str:
    if hour is None:
        return "N/A"
    start = f"{hour:02d}:00"
    end = f"{(hour + 2) % 24:02d}:00"
    return f"{start}-{end}"


def main():
    zones = load_json("zone_scores.json", [])
    anomalies = load_json("anomalies.json", [])
    forecast_summary = load_json("forecast_summary.json", [])

    anomaly_zone_ids = {a["zone_id"] for a in anomalies}
    forecast_by_zone = {f["zone_id"]: f["peak_forecast_yhat"] for f in forecast_summary}
    max_forecast = max(forecast_by_zone.values(), default=1) or 1

    recs = []
    for z in zones:
        obstruction = z["obstruction_score"]  # already 0-100
        spike_risk = (forecast_by_zone.get(z["zone_id"], 0) / max_forecast) * 100
        anomaly_flag = 1 if z["zone_id"] in anomaly_zone_ids else 0

        priority_score = (
            PRIORITY_WEIGHTS["obstruction"] * obstruction
            + PRIORITY_WEIGHTS["spike_risk"] * spike_risk
            + PRIORITY_WEIGHTS["anomaly_flag"] * (anomaly_flag * 100)
        )

        recommended_officers = max(1, min(6, round(obstruction / 20) + anomaly_flag))
        estimated_improvement_pct = round(min(45, obstruction * 0.4 + (10 if anomaly_flag else 0)), 1)

        reasons = []
        if obstruction >= 60:
            reasons.append(f"high obstruction score ({obstruction:.0f}/100)")
        if z.get("is_junction"):
            reasons.append("major junction")
        if spike_risk >= 50:
            reasons.append("forecasted violation spike in next 48h")
        if anomaly_flag:
            reasons.append("flagged as statistical anomaly")
        if not reasons:
            reasons.append(f"{z['violation_count']} historical violations")
        reason = ", ".join(reasons).capitalize()

        recs.append({
            "zone_id": z["zone_id"],
            "centroid_lat": z["centroid_lat"],
            "centroid_lng": z["centroid_lng"],
            "dominant_police_station": z["dominant_police_station"],
            "obstruction_score": obstruction,
            "severity": z["severity"],
            "priority_score": round(priority_score, 2),
            "spike_risk": round(spike_risk, 2),
            "anomaly_flag": bool(anomaly_flag),
            "recommended_officers": recommended_officers,
            "time_window": time_window_for_hour(z.get("peak_hour")),
            "estimated_improvement_pct": estimated_improvement_pct,
            "reason": reason,
        })

    recs.sort(key=lambda r: -r["priority_score"])
    top = recs[:TOP_N_ENFORCEMENT]

    with open(OUTPUT_DIR / "enforcement_recs.json", "w") as f:
        json.dump(top, f, indent=2)

    assert len(top) == TOP_N_ENFORCEMENT, f"expected {TOP_N_ENFORCEMENT} recs, got {len(top)}"
    print(f"Wrote {len(top)} enforcement recommendations")
    for r in top[:3]:
        print(f"  zone {r['zone_id']}: priority={r['priority_score']}, officers={r['recommended_officers']}, {r['reason']}")


if __name__ == "__main__":
    main()
