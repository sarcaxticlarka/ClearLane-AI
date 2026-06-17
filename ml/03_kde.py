"""Phase 1.5: Gaussian KDE probability surface for the heatmap layer."""
import json

import numpy as np
import pandas as pd
from scipy.stats import gaussian_kde

from config import KDE_BW_METHOD, KDE_GRID_SIZE, KDE_MIN_INTENSITY, OUTPUT_DIR, PROCESSED_PARQUET, BENGALURU_BBOX

MAX_OUTPUT_BYTES = 5 * 1024 * 1024


def main():
    df = pd.read_parquet(PROCESSED_PARQUET)
    lats, lngs = df["latitude"].to_numpy(), df["longitude"].to_numpy()

    kde = gaussian_kde(np.vstack([lngs, lats]), bw_method=KDE_BW_METHOD)

    lng_grid = np.linspace(BENGALURU_BBOX["lng_min"], BENGALURU_BBOX["lng_max"], KDE_GRID_SIZE)
    lat_grid = np.linspace(BENGALURU_BBOX["lat_min"], BENGALURU_BBOX["lat_max"], KDE_GRID_SIZE)
    lng_mesh, lat_mesh = np.meshgrid(lng_grid, lat_grid)
    grid_coords = np.vstack([lng_mesh.ravel(), lat_mesh.ravel()])

    density = kde(grid_coords)
    density = (density - density.min()) / (density.max() - density.min())

    # Auto-relax the intensity threshold downward if too few points clear it,
    # to land within the documented 10k-30k point target.
    threshold = KDE_MIN_INTENSITY
    for _ in range(20):
        mask = density > threshold
        if mask.sum() >= 10000 or threshold <= 0.0001:
            break
        threshold /= 2

    points = [
        {"lat": round(float(lat), 6), "lng": round(float(lng), 6), "intensity": round(float(i), 4)}
        for lat, lng, i in zip(lat_mesh.ravel()[mask], lng_mesh.ravel()[mask], density[mask])
    ]
    points.sort(key=lambda p: -p["intensity"])

    print(f"threshold={threshold}, raw points above threshold: {len(points)}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUTPUT_DIR / "kde_points.json"

    # trim to stay under size budget and within 10k-30k target if needed
    while len(points) > 30000:
        points = points[: int(len(points) * 0.9)]

    with open(out_path, "w") as f:
        json.dump({"points": points, "bbox": BENGALURU_BBOX, "grid_size": KDE_GRID_SIZE}, f)

    size_mb = out_path.stat().st_size / (1024 * 1024)
    print(f"Wrote {len(points)} points -> {out_path} ({size_mb:.2f} MB)")
    assert out_path.stat().st_size < MAX_OUTPUT_BYTES, f"kde_points.json too large: {size_mb:.2f}MB"


if __name__ == "__main__":
    main()
