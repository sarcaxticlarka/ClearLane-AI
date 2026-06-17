"""EDA pass over the raw violation CSV. Writes findings to /docs/eda_findings.md."""
import json

import pandas as pd

RAW_PATH = "data/raw/violations_raw.csv"
OUT_PATH = "docs/eda_findings.md"

BENGALURU_BBOX = {"lat_min": 12.7, "lat_max": 13.2, "lng_min": 77.3, "lng_max": 77.8}


def main():
    df = pd.read_csv(RAW_PATH, low_memory=False)
    lines = []
    lines.append("# EDA Findings — ClearLane AI\n")
    lines.append(f"## Shape\n\n- Rows: {df.shape[0]}\n- Columns: {df.shape[1]}\n")

    lines.append("## Dtypes\n\n```")
    lines.append(df.dtypes.to_string())
    lines.append("```\n")

    nulls = df.isna().sum()
    nulls = nulls[nulls > 0].sort_values(ascending=False)
    lines.append("## Null counts (non-zero only)\n\n```")
    lines.append(nulls.to_string() if len(nulls) else "(no nulls)")
    lines.append("```\n")

    dt = pd.to_datetime(df["created_datetime"], errors="coerce")
    lines.append("## Datetime range\n")
    lines.append(f"- created_datetime min: {dt.min()}\n- created_datetime max: {dt.max()}\n")

    lines.append("## Violations by hour of day\n\n```")
    lines.append(dt.dt.hour.value_counts().sort_index().to_string())
    lines.append("```\n")

    lines.append("## Violations by day of week (0=Mon)\n\n```")
    lines.append(dt.dt.dayofweek.value_counts().sort_index().to_string())
    lines.append("```\n")

    lat = pd.to_numeric(df["latitude"], errors="coerce")
    lng = pd.to_numeric(df["longitude"], errors="coerce")
    in_bbox = (
        lat.between(BENGALURU_BBOX["lat_min"], BENGALURU_BBOX["lat_max"])
        & lng.between(BENGALURU_BBOX["lng_min"], BENGALURU_BBOX["lng_max"])
    )
    lines.append("## Lat/Lng validation\n")
    lines.append(f"- Null lat or lng: {(lat.isna() | lng.isna()).sum()}\n")
    lines.append(f"- Within Bengaluru bbox {BENGALURU_BBOX}: {in_bbox.sum()} / {len(df)}\n")
    lines.append(f"- lat range observed: [{lat.min()}, {lat.max()}]\n")
    lines.append(f"- lng range observed: [{lng.min()}, {lng.max()}]\n")

    for col in ["violation_type", "junction_name", "police_station", "vehicle_type",
                "updated_vehicle_type", "validation_status", "data_sent_to_scita"]:
        lines.append(f"## value_counts: {col}\n\n```")
        lines.append(df[col].value_counts(dropna=False).head(30).to_string())
        lines.append("```\n")

    lines.append("## offence_code value_counts\n\n```")
    lines.append(df["offence_code"].value_counts(dropna=False).head(30).to_string())
    lines.append("```\n")

    approved_mask = df["validation_status"] == "approved"
    sent_mask = df["data_sent_to_scita"].astype(str).str.lower().isin(["true", "1", "t"])
    lines.append("## Mandatory filter impact\n")
    lines.append(f"- validation_status == 'approved': {approved_mask.sum()} / {len(df)}\n")
    lines.append(f"- data_sent_to_scita truthy: {sent_mask.sum()} / {len(df)}\n")
    combined = approved_mask & sent_mask & in_bbox & lat.notna() & lng.notna()
    lines.append(f"- All 4 mandatory filters combined: {combined.sum()} / {len(df)} rows survive\n")

    with open(OUT_PATH, "w") as f:
        f.write("\n".join(lines))

    print(f"Wrote {OUT_PATH}")
    print(f"Rows surviving all filters: {combined.sum()} / {len(df)}")


if __name__ == "__main__":
    main()
