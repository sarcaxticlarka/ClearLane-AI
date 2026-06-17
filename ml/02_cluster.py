"""Phase 1.4: DBSCAN spatial clustering of violation points into hotspot zones.

Uses haversine metric (ball_tree) so eps is a true ground distance, not a
flat-degree approximation. Auto-tunes eps within the documented 33m-50m band
(eps 0.0002-0.0005 rad equivalent) to land in the target 50-200 zone range.
"""
import json

import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN

from config import DBSCAN_MIN_SAMPLES, OUTPUT_DIR, PROCESSED_PARQUET

EARTH_RADIUS_M = 6_371_000
CANDIDATE_EPS_METERS = [33, 50, 75, 100, 150, 200, 250, 300, 400, 500, 700, 1000]
TARGET_ZONE_RANGE = (50, 200)


def cluster(df: pd.DataFrame, eps_meters: float, min_samples: int = DBSCAN_MIN_SAMPLES):
    coords_rad = np.radians(df[["latitude", "longitude"]].to_numpy())
    eps_rad = eps_meters / EARTH_RADIUS_M
    db = DBSCAN(eps=eps_rad, min_samples=min_samples, metric="haversine", algorithm="ball_tree")
    labels = db.fit_predict(coords_rad)
    return labels


def main():
    df = pd.read_parquet(PROCESSED_PARQUET)

    chosen_eps, labels = None, None
    for eps_m in CANDIDATE_EPS_METERS:
        lbls = cluster(df, eps_m)
        n_zones = len(set(lbls)) - (1 if -1 in lbls else 0)
        print(f"eps={eps_m}m -> {n_zones} zones, noise={int((lbls == -1).sum())}")
        if TARGET_ZONE_RANGE[0] <= n_zones <= TARGET_ZONE_RANGE[1]:
            chosen_eps, labels = eps_m, lbls
            break
        chosen_eps, labels = eps_m, lbls  # keep last as fallback

    df = df.copy()
    df["zone_id"] = labels
    n_zones = len(set(labels)) - (1 if -1 in labels else 0)
    print(f"Final: eps={chosen_eps}m, zones={n_zones}, noise_pts={int((labels == -1).sum())}")

    clustered = df[df["zone_id"] != -1]

    zones_geojson = {"type": "FeatureCollection", "features": []}
    zone_stats = []
    for zid, g in clustered.groupby("zone_id"):
        centroid_lat, centroid_lng = g["latitude"].mean(), g["longitude"].mean()
        lat_min, lat_max = g["latitude"].min(), g["latitude"].max()
        lng_min, lng_max = g["longitude"].min(), g["longitude"].max()
        polygon = [
            [lng_min, lat_min], [lng_max, lat_min],
            [lng_max, lat_max], [lng_min, lat_max], [lng_min, lat_min],
        ]
        zones_geojson["features"].append({
            "type": "Feature",
            "properties": {"zone_id": int(zid), "violation_count": int(len(g))},
            "geometry": {"type": "Polygon", "coordinates": [polygon]},
        })
        dominant_station = g["police_station"].mode().iloc[0] if not g["police_station"].mode().empty else None
        dominant_junction = g["junction_name"].mode().iloc[0] if not g["junction_name"].mode().empty else None
        peak_hour = int(g["hour_of_day"].mode().iloc[0]) if not g["hour_of_day"].mode().empty else None
        zone_stats.append({
            "zone_id": int(zid),
            "centroid_lat": round(float(centroid_lat), 7),
            "centroid_lng": round(float(centroid_lng), 7),
            "violation_count": int(len(g)),
            "dominant_police_station": dominant_station,
            "dominant_junction": dominant_junction,
            "is_junction": bool(g["is_junction"].mean() > 0.5),
            "peak_hour": peak_hour,
            "avg_severity_weight": round(float(g["severity_weight"].mean()), 4),
            "avg_vehicle_weight": round(float(g["vehicle_weight"].mean()), 4),
        })

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_DIR / "zones.geojson", "w") as f:
        json.dump(zones_geojson, f)
    with open(OUTPUT_DIR / "zone_stats.json", "w") as f:
        json.dump(sorted(zone_stats, key=lambda z: -z["violation_count"]), f, indent=2)

    df[["id", "latitude", "longitude", "zone_id"]].to_parquet(OUTPUT_DIR / "point_zone_assignments.parquet", index=False)

    assert n_zones > 0, "DBSCAN produced zero zones"
    print(f"Wrote zones.geojson ({len(zones_geojson['features'])} zones) and zone_stats.json")


if __name__ == "__main__":
    main()
