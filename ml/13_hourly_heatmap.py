"""Hour-by-hour KDE surfaces for the timeline replay feature.

The dataset spans ~5 months without a single continuous "live" day, so replay is
built from the typical violation pattern at each hour_of_day (0-23) rather than a
literal historical timestamp scrub — i.e. "what does a typical 3am vs 6pm look like."
Each hour's surface is computed and trimmed independently to keep the combined
payload small enough to ship to the frontend in one request.
"""
import json

import numpy as np
import pandas as pd
from scipy.stats import gaussian_kde

from config import BENGALURU_BBOX, KDE_BW_METHOD, OUTPUT_DIR, PROCESSED_PARQUET

GRID_SIZE = 120
POINTS_PER_HOUR = 1200
MIN_SAMPLES_FOR_KDE = 30


def kde_for_subset(df: pd.DataFrame) -> list[dict]:
    if len(df) < MIN_SAMPLES_FOR_KDE:
        return []

    lats, lngs = df["latitude"].to_numpy(), df["longitude"].to_numpy()
    kde = gaussian_kde(np.vstack([lngs, lats]), bw_method=KDE_BW_METHOD)

    lng_grid = np.linspace(BENGALURU_BBOX["lng_min"], BENGALURU_BBOX["lng_max"], GRID_SIZE)
    lat_grid = np.linspace(BENGALURU_BBOX["lat_min"], BENGALURU_BBOX["lat_max"], GRID_SIZE)
    lng_mesh, lat_mesh = np.meshgrid(lng_grid, lat_grid)
    grid_coords = np.vstack([lng_mesh.ravel(), lat_mesh.ravel()])

    density = kde(grid_coords)
    density = (density - density.min()) / (density.max() - density.min() + 1e-12)

    order = np.argsort(-density)[:POINTS_PER_HOUR]
    return [
        {"lat": round(float(lat_mesh.ravel()[i]), 5), "lng": round(float(lng_mesh.ravel()[i]), 5), "intensity": round(float(density[i]), 4)}
        for i in order
        if density[i] > 0.02
    ]


def main():
    df = pd.read_parquet(PROCESSED_PARQUET)

    hourly = {}
    for hour in range(24):
        subset = df[df["hour_of_day"] == hour]
        points = kde_for_subset(subset)
        hourly[str(hour)] = points
        print(f"hour {hour:02d}: {len(subset)} violations -> {len(points)} heat points")

    out = {"hours": hourly, "grid_size": GRID_SIZE}
    out_path = OUTPUT_DIR / "hourly_heatmap.json"
    with open(out_path, "w") as f:
        json.dump(out, f)

    size_mb = out_path.stat().st_size / (1024 * 1024)
    print(f"Wrote {out_path} ({size_mb:.2f} MB)")


if __name__ == "__main__":
    main()
