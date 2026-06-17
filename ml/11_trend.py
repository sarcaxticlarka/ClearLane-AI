"""Historical monthly violation trend per zone (Nov 2023 - Apr 2024)."""
import json

import pandas as pd

from config import OUTPUT_DIR, PROCESSED_PARQUET

TREND_DIR = OUTPUT_DIR / "trends"


def main():
    df = pd.read_parquet(PROCESSED_PARQUET)
    assignments = pd.read_parquet(OUTPUT_DIR / "point_zone_assignments.parquet")
    df = df.merge(assignments[["id", "zone_id"]], on="id", how="inner")
    df = df[df["zone_id"] != -1]

    df["month_period"] = df["created_datetime"].dt.tz_localize(None).dt.to_period("M")

    TREND_DIR.mkdir(parents=True, exist_ok=True)

    global_trend = (
        df.groupby("month_period").size().rename("violation_count").reset_index()
    )
    global_trend["month"] = global_trend["month_period"].astype(str)
    global_out = global_trend[["month", "violation_count"]].to_dict("records")
    with open(OUTPUT_DIR / "trend_global.json", "w") as f:
        json.dump(global_out, f, indent=2)

    n_zones = 0
    for zone_id, g in df.groupby("zone_id"):
        monthly = g.groupby("month_period").agg(
            violation_count=("id", "size"),
            avg_severity_weight=("severity_weight", "mean"),
        ).reset_index()
        monthly["month"] = monthly["month_period"].astype(str)
        rows = monthly[["month", "violation_count", "avg_severity_weight"]].copy()
        rows["avg_severity_weight"] = rows["avg_severity_weight"].round(3)
        out = {"zone_id": int(zone_id), "monthly": rows.to_dict("records")}
        with open(TREND_DIR / f"{zone_id}.json", "w") as f:
            json.dump(out, f)
        n_zones += 1

    print(f"Wrote trend_global.json and {n_zones} per-zone trend files")


if __name__ == "__main__":
    main()
