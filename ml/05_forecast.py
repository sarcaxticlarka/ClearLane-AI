"""Phase 2.2: Prophet 48h forecast for the top-N zones by violation count."""
import json
import logging

import pandas as pd
from prophet import Prophet

from config import OUTPUT_DIR, PROCESSED_PARQUET, PROPHET_FORECAST_HOURS, PROPHET_TOP_N_ZONES

logging.getLogger("cmdstanpy").setLevel(logging.WARNING)
logging.getLogger("prophet").setLevel(logging.WARNING)

FORECAST_DIR = OUTPUT_DIR / "forecasts"


def hourly_series(df: pd.DataFrame, zone_id: int) -> pd.DataFrame:
    g = df[df["zone_id"] == zone_id].copy()
    g["ds"] = g["created_datetime"].dt.floor("h").dt.tz_localize(None)
    counts = g.groupby("ds").size().rename("y").reset_index()
    full_range = pd.date_range(counts["ds"].min(), counts["ds"].max(), freq="h")
    counts = counts.set_index("ds").reindex(full_range, fill_value=0).rename_axis("ds").reset_index()
    return counts


def main():
    df = pd.read_parquet(PROCESSED_PARQUET)
    assignments = pd.read_parquet(OUTPUT_DIR / "point_zone_assignments.parquet")
    df = df.merge(assignments[["id", "zone_id"]], on="id", how="inner")

    with open(OUTPUT_DIR / "zone_scores.json") as f:
        zone_scores = json.load(f)
    top_zones = [z["zone_id"] for z in zone_scores[:PROPHET_TOP_N_ZONES]]

    FORECAST_DIR.mkdir(parents=True, exist_ok=True)
    summary = []
    for zid in top_zones:
        series = hourly_series(df, zid)
        if len(series) < 48 or series["y"].sum() == 0:
            print(f"zone {zid}: insufficient history, skipping")
            continue

        m = Prophet(
            weekly_seasonality=True,
            daily_seasonality=True,
            seasonality_mode="multiplicative",
            changepoint_prior_scale=0.05,
        )
        m.fit(series)

        future = m.make_future_dataframe(periods=PROPHET_FORECAST_HOURS, freq="h")
        fcst = m.predict(future)
        fcst_tail = fcst.tail(PROPHET_FORECAST_HOURS)[["ds", "yhat", "yhat_lower", "yhat_upper"]]
        fcst_tail = fcst_tail.assign(
            yhat=fcst_tail["yhat"].clip(lower=0),
            yhat_lower=fcst_tail["yhat_lower"].clip(lower=0),
            yhat_upper=fcst_tail["yhat_upper"].clip(lower=0),
        )

        out = {
            "zone_id": int(zid),
            "forecast": [
                {
                    "ds": row.ds.isoformat(),
                    "yhat": round(float(row.yhat), 2),
                    "yhat_lower": round(float(row.yhat_lower), 2),
                    "yhat_upper": round(float(row.yhat_upper), 2),
                }
                for row in fcst_tail.itertuples()
            ],
        }
        with open(FORECAST_DIR / f"{zid}.json", "w") as f:
            json.dump(out, f)
        peak = max(out["forecast"], key=lambda p: p["yhat"])
        summary.append({"zone_id": int(zid), "peak_forecast_hour": peak["ds"], "peak_forecast_yhat": peak["yhat"]})
        print(f"zone {zid}: forecasted, peak {peak['yhat']:.1f} at {peak['ds']}")

    with open(OUTPUT_DIR / "forecast_summary.json", "w") as f:
        json.dump(summary, f, indent=2)
    print(f"Forecasted {len(summary)} / {len(top_zones)} zones")


if __name__ == "__main__":
    main()
