"""Repeat-offender leaderboard: vehicles with the most recorded violations, globally and per zone."""
import json

import pandas as pd

from config import OUTPUT_DIR, PROCESSED_PARQUET

GLOBAL_TOP_N = 50
PER_ZONE_TOP_N = 5
MIN_REPEAT_COUNT = 2


def main():
    df = pd.read_parquet(PROCESSED_PARQUET)
    assignments = pd.read_parquet(OUTPUT_DIR / "point_zone_assignments.parquet")
    df = df.merge(assignments[["id", "zone_id"]], on="id", how="inner")
    df = df[df["zone_id"] != -1]

    vehicle_counts = df.groupby("vehicle_number").size().rename("violation_count")
    repeat_vehicles = vehicle_counts[vehicle_counts >= MIN_REPEAT_COUNT].sort_values(ascending=False)

    global_rows = []
    for vehicle_number, count in repeat_vehicles.head(GLOBAL_TOP_N).items():
        sub = df[df["vehicle_number"] == vehicle_number]
        zone_ids = sorted(sub["zone_id"].unique().tolist())
        global_rows.append({
            "vehicle_number": vehicle_number,
            "vehicle_type": sub["vehicle_type_final"].mode().iloc[0],
            "violation_count": int(count),
            "zone_ids": [int(z) for z in zone_ids],
            "dominant_police_station": sub["police_station"].mode().iloc[0],
        })

    with open(OUTPUT_DIR / "repeat_offenders.json", "w") as f:
        json.dump(global_rows, f, indent=2)

    by_zone: dict[int, list[dict]] = {}
    for zone_id, g in df.groupby("zone_id"):
        zc = g.groupby("vehicle_number").size().rename("violation_count")
        zc = zc[zc >= MIN_REPEAT_COUNT].sort_values(ascending=False).head(PER_ZONE_TOP_N)
        if zc.empty:
            continue
        rows = []
        for vehicle_number, count in zc.items():
            sub = g[g["vehicle_number"] == vehicle_number]
            rows.append({
                "vehicle_number": vehicle_number,
                "vehicle_type": sub["vehicle_type_final"].mode().iloc[0],
                "violation_count": int(count),
            })
        by_zone[int(zone_id)] = rows

    with open(OUTPUT_DIR / "repeat_offenders_by_zone.json", "w") as f:
        json.dump(by_zone, f, indent=2)

    print(f"Global repeat offenders: {len(global_rows)} (>= {MIN_REPEAT_COUNT} violations)")
    print(f"Zones with repeat offenders: {len(by_zone)}")


if __name__ == "__main__":
    main()
