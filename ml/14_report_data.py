"""Pre-aggregates violation counts at daily/weekly/monthly granularity for the
report generator. Monthly reuses the same grouping as 11_trend.py's global trend;
daily/weekly are new since nothing else needed that resolution.
"""
import json

import pandas as pd

from config import OUTPUT_DIR, PROCESSED_PARQUET


def main():
    df = pd.read_parquet(PROCESSED_PARQUET)
    dt = df["created_datetime"].dt.tz_localize(None)

    daily = dt.dt.floor("D").value_counts().sort_index()
    weekly = dt.dt.to_period("W").dt.start_time.value_counts().sort_index()
    monthly = dt.dt.to_period("M").astype(str).value_counts().sort_index()

    def series_to_rows(s: pd.Series, date_fmt: str) -> list[dict]:
        return [{"date": (idx.strftime(date_fmt) if hasattr(idx, "strftime") else str(idx)), "count": int(c)} for idx, c in s.items()]

    out = {
        "daily": series_to_rows(daily, "%Y-%m-%d"),
        "weekly": series_to_rows(weekly, "%Y-%m-%d"),
        "monthly": series_to_rows(monthly, "%Y-%m"),
    }

    with open(OUTPUT_DIR / "report_trends.json", "w") as f:
        json.dump(out, f)

    print(f"daily: {len(out['daily'])} points, weekly: {len(out['weekly'])} points, monthly: {len(out['monthly'])} points")


if __name__ == "__main__":
    main()
