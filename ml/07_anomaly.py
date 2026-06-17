"""Phase 2.4: Isolation Forest anomaly detection over zone-level features."""
import json

import pandas as pd
from sklearn.ensemble import IsolationForest

from config import ISO_FOREST_CONTAMINATION, ISO_FOREST_N_ESTIMATORS, OUTPUT_DIR

FEATURES = [
    "violation_count", "avg_severity_weight", "avg_vehicle_weight",
    "obstruction_score", "centrality_score", "is_junction",
]


def main():
    with open(OUTPUT_DIR / "zone_scores.json") as f:
        zones = json.load(f)
    df = pd.DataFrame(zones)
    df["is_junction"] = df["is_junction"].astype(int)

    X = df[FEATURES]
    model = IsolationForest(
        n_estimators=ISO_FOREST_N_ESTIMATORS,
        contamination=ISO_FOREST_CONTAMINATION,
        random_state=42,
    )
    df["anomaly_flag"] = model.fit_predict(X) == -1
    df["anomaly_score"] = -model.decision_function(X)  # higher = more anomalous

    flagged = df[df["anomaly_flag"]].sort_values("anomaly_score", ascending=False)
    anomalies = [
        {
            "zone_id": int(r.zone_id),
            "centroid_lat": r.centroid_lat,
            "centroid_lng": r.centroid_lng,
            "dominant_police_station": r.dominant_police_station,
            "obstruction_score": r.obstruction_score,
            "violation_count": int(r.violation_count),
            "anomaly_score": round(float(r.anomaly_score), 4),
        }
        for r in flagged.itertuples()
    ]

    with open(OUTPUT_DIR / "anomalies.json", "w") as f:
        json.dump(anomalies, f, indent=2)

    pct = len(anomalies) / len(df) * 100
    print(f"Flagged {len(anomalies)} / {len(df)} zones ({pct:.1f}%) as anomalous")
    assert pct < 5.0, f"anomaly rate {pct:.1f}% exceeds 5% DoD threshold"


if __name__ == "__main__":
    main()
