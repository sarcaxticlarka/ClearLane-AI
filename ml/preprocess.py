"""Phase 1.3: cleaning + feature engineering pipeline.

load_raw() -> apply_filters() -> clean_columns() -> engineer_features() -> export_processed()
"""
import ast
import re

import numpy as np
import pandas as pd

from config import (
    BENGALURU_BBOX,
    DEFAULT_DURATION_EST_MINS,
    DEFAULT_SEVERITY_WEIGHT,
    DEFAULT_VEHICLE_WEIGHT,
    DURATION_EST_BY_SEVERITY,
    PEAK_HOURS,
    PROCESSED_PARQUET,
    RAW_CSV,
    SEVERITY_WEIGHTS,
    VEHICLE_WEIGHTS,
)

JUNCTION_CODE_RE = re.compile(r"^(BTP\d+)")


def load_raw(path=RAW_CSV) -> pd.DataFrame:
    df = pd.read_csv(path, low_memory=False)
    assert len(df) > 0, "raw CSV loaded empty"
    return df


def apply_filters(df: pd.DataFrame) -> pd.DataFrame:
    """4 mandatory filters from docs Section 2: approved, sent_to_scita, valid bbox, non-null lat/lng."""
    lat = pd.to_numeric(df["latitude"], errors="coerce")
    lng = pd.to_numeric(df["longitude"], errors="coerce")
    sent = df["data_sent_to_scita"].astype(str).str.lower().isin(["true", "1", "t"])

    mask = (
        (df["validation_status"] == "approved")
        & sent
        & lat.between(BENGALURU_BBOX["lat_min"], BENGALURU_BBOX["lat_max"])
        & lng.between(BENGALURU_BBOX["lng_min"], BENGALURU_BBOX["lng_max"])
        & lat.notna()
        & lng.notna()
    )
    out = df.loc[mask].copy()
    assert out["latitude"].notna().all() and out["longitude"].notna().all()
    return out


def _parse_offence_codes(raw: str) -> list[int]:
    try:
        codes = ast.literal_eval(raw)
        return [int(c) for c in codes]
    except (ValueError, SyntaxError, TypeError):
        return []


def clean_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["latitude"] = pd.to_numeric(df["latitude"], errors="coerce")
    df["longitude"] = pd.to_numeric(df["longitude"], errors="coerce")
    df["created_datetime"] = pd.to_datetime(df["created_datetime"], errors="coerce", utc=True)
    df["offence_code_list"] = df["offence_code"].apply(_parse_offence_codes)
    df["vehicle_type_final"] = df["updated_vehicle_type"].fillna(df["vehicle_type"])
    df["junction_name"] = df["junction_name"].fillna("No Junction")
    df = df.dropna(subset=["created_datetime"])
    return df


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    dt = df["created_datetime"]

    df["hour_of_day"] = dt.dt.hour
    df["day_of_week"] = dt.dt.dayofweek
    df["is_weekend"] = df["day_of_week"].isin([5, 6])
    df["is_peak_hour"] = df["hour_of_day"].isin(PEAK_HOURS)
    df["month"] = dt.dt.month
    df["is_junction"] = df["junction_name"] != "No Junction"
    df["junction_code"] = df["junction_name"].apply(
        lambda j: (m := JUNCTION_CODE_RE.match(j)) and m.group(1) or None
    )

    df["severity_weight"] = df["offence_code_list"].apply(
        lambda codes: max((SEVERITY_WEIGHTS.get(c, 0) for c in codes), default=DEFAULT_SEVERITY_WEIGHT)
        or DEFAULT_SEVERITY_WEIGHT
    )
    df["duration_est_mins"] = df["severity_weight"].map(DURATION_EST_BY_SEVERITY).fillna(
        DEFAULT_DURATION_EST_MINS
    )
    df["vehicle_weight"] = df["vehicle_type_final"].map(VEHICLE_WEIGHTS).fillna(DEFAULT_VEHICLE_WEIGHT)

    df["police_station_enc"], _ = pd.factorize(df["police_station"])
    df["center_code"] = pd.to_numeric(df["center_code"], errors="coerce").fillna(-1).astype(int)

    vehicle_counts = df["vehicle_number"].value_counts()
    df["is_repeat_vehicle"] = df["vehicle_number"].map(vehicle_counts).fillna(1) > 1

    return df


def export_processed(df: pd.DataFrame, path=PROCESSED_PARQUET) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    keep_cols = [
        "id", "latitude", "longitude", "location", "vehicle_number", "vehicle_type_final",
        "violation_type", "offence_code_list", "created_datetime", "device_id", "center_code",
        "police_station", "junction_name", "validation_status",
        "hour_of_day", "day_of_week", "is_weekend", "is_peak_hour", "month",
        "is_junction", "junction_code", "duration_est_mins", "severity_weight",
        "vehicle_weight", "police_station_enc", "is_repeat_vehicle",
    ]
    out = df[keep_cols].copy()
    out["offence_code_list"] = out["offence_code_list"].apply(str)
    out.to_parquet(path, index=False)
    assert out["latitude"].notna().all() and out["longitude"].notna().all(), "nulls in lat/lng on export"
    print(f"Exported {len(out)} rows -> {path}")


def main():
    df = load_raw()
    df = apply_filters(df)
    df = clean_columns(df)
    df = engineer_features(df)
    export_processed(df)


if __name__ == "__main__":
    main()
