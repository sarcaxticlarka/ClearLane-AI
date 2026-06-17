"""Phase 2.3: Event-spike XGBoost regressor.

Joins violations within EVENT_RADIUS_KM / EVENT_WINDOW_HOURS of an event to predict
a spike_multiplier per zone. The Astram events CSV is not present in this project
(docs/Section 2.1 flags its schema as unconfirmed/inferred-only). Per the doc's own
risk mitigation ("cut if Astram schema unclear"), this script checks for the file at
data/raw/astram_events.csv and:
  - if present: trains the XGBoost model as specified
  - if absent: writes an empty event_impacts.json and skips training, so downstream
    consumers (enforcement engine, API) get a well-formed empty list instead of failing
"""
import json

import numpy as np
import pandas as pd

from config import EVENT_RADIUS_KM, EVENT_WINDOW_HOURS, OUTPUT_DIR, PROCESSED_PARQUET, ROOT, XGB_PARAMS

EVENTS_CSV = ROOT / "data/raw/astram_events.csv"
EARTH_RADIUS_KM = 6371

EXPECTED_EVENT_COLUMNS = [
    "event_name", "event_type", "event_date", "venue_name",
    "venue_latitude", "venue_longitude", "expected_crowd_size", "duration_hours",
]


def haversine_km(lat1, lng1, lat2, lng2):
    lat1, lng1, lat2, lng2 = map(np.radians, [lat1, lng1, lat2, lng2])
    dlat, dlng = lat2 - lat1, lng2 - lng1
    a = np.sin(dlat / 2) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlng / 2) ** 2
    return 2 * EARTH_RADIUS_KM * np.arcsin(np.sqrt(a))


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    if not EVENTS_CSV.exists():
        print(f"{EVENTS_CSV} not found — Astram event data unavailable (documented known risk).")
        print("Writing empty event_impacts.json so downstream consumers degrade gracefully.")
        with open(OUTPUT_DIR / "event_impacts.json", "w") as f:
            json.dump([], f)
        return

    events = pd.read_csv(EVENTS_CSV)
    missing_cols = set(EXPECTED_EVENT_COLUMNS) - set(events.columns)
    assert not missing_cols, f"astram_events.csv missing expected columns: {missing_cols}"

    df = pd.read_parquet(PROCESSED_PARQUET)
    events["event_date"] = pd.to_datetime(events["event_date"], utc=True)

    is_synthetic = bool(events["is_synthetic"].any()) if "is_synthetic" in events.columns else False

    rows = []
    for _, ev in events.iterrows():
        window_start = ev["event_date"] - pd.Timedelta(hours=EVENT_WINDOW_HOURS)
        window_end = ev["event_date"] + pd.Timedelta(hours=EVENT_WINDOW_HOURS)
        in_window = df[(df["created_datetime"] >= window_start) & (df["created_datetime"] <= window_end)].copy()
        if in_window.empty:
            continue
        in_window["dist_km"] = haversine_km(
            in_window["latitude"], in_window["longitude"], ev["venue_latitude"], ev["venue_longitude"]
        )
        nearby = in_window[in_window["dist_km"] <= EVENT_RADIUS_KM]
        if nearby.empty:
            continue
        baseline = max(len(df) / max((df["created_datetime"].max() - df["created_datetime"].min()).days, 1), 1)
        spike_multiplier = len(nearby) / baseline
        rows.append({
            "expected_crowd_size": ev["expected_crowd_size"],
            "duration_hours": ev["duration_hours"],
            "event_type": ev["event_type"],
            "violation_count_nearby": len(nearby),
            "spike_multiplier": spike_multiplier,
            "event_name": ev["event_name"],
            "venue_name": ev.get("venue_name"),
            "venue_latitude": ev["venue_latitude"],
            "venue_longitude": ev["venue_longitude"],
            "is_synthetic": is_synthetic,
        })

    if len(rows) < 10:
        print(f"Only {len(rows)} event-violation joins found — too few to train XGBoost reliably.")
        impacts = [{k: v for k, v in r.items() if k != "event_type"} for r in rows]
        with open(OUTPUT_DIR / "event_impacts.json", "w") as f:
            json.dump(impacts, f, indent=2)
        return

    import xgboost as xgb
    from sklearn.preprocessing import LabelEncoder

    train_df = pd.DataFrame(rows)
    le = LabelEncoder()
    train_df["event_type_enc"] = le.fit_transform(train_df["event_type"])
    X = train_df[["expected_crowd_size", "duration_hours", "event_type_enc"]]
    y = train_df["spike_multiplier"]

    model = xgb.XGBRegressor(**XGB_PARAMS)
    model.fit(X, y)
    model.save_model(str(OUTPUT_DIR / "event_spike.json"))

    impacts = train_df.drop(columns=["event_type_enc"]).to_dict("records")
    with open(OUTPUT_DIR / "event_impacts.json", "w") as f:
        json.dump(impacts, f, indent=2)
    label = "SYNTHETIC demo" if is_synthetic else "real"
    print(f"Trained event-spike model on {len(train_df)} {label} events -> event_spike.json, event_impacts.json")


if __name__ == "__main__":
    main()
