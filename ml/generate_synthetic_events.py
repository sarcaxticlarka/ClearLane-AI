"""Generates a SYNTHETIC Astram-style events CSV for demo purposes only.

The real Astram events dataset referenced in the docs was never provided to this
project. Rather than leave the event-spike model permanently dark, this script
fabricates plausible Bengaluru event records (real venues, randomized dates/crowd
sizes) so 06_event_model.py and the UI's "Event Impact" feature have something to
show end-to-end. Every record is tagged is_synthetic=true and the UI surfaces a
visible "synthetic demo data" badge — this must never be presented as real data.

Replace data/raw/astram_events.csv with a real export to disable synthetic mode.
"""
import csv
import random
from datetime import datetime, timedelta

from config import ROOT

OUT_PATH = ROOT / "data/raw/astram_events.csv"
RANDOM_SEED = 42

# Real, well-known Bengaluru venues with approximate coordinates.
VENUES = [
    ("M Chinnaswamy Stadium", 12.9788, 77.5996),
    ("Sree Kanteerava Stadium", 12.9783, 77.5946),
    ("Palace Grounds", 13.0011, 77.5921),
    ("Manpho Convention Center", 12.9352, 77.6146),
    ("Bangalore International Exhibition Centre", 13.0807, 77.4900),
    ("UB City Mall", 12.9716, 77.5963),
    ("Freedom Park", 12.9789, 77.5783),
    ("Lalbagh Botanical Garden", 12.9507, 77.5848),
    ("Cubbon Park", 12.9763, 77.5929),
    ("KTPO Whitefield", 12.9886, 77.7339),
]

EVENT_TYPES = ["concert", "cricket_match", "political_rally", "trade_expo", "festival", "marathon"]

DATA_START = datetime(2023, 11, 9)
DATA_END = datetime(2024, 4, 8)


def main():
    random.seed(RANDOM_SEED)
    rows = []
    for i in range(40):
        venue_name, lat, lng = random.choice(VENUES)
        days_offset = random.randint(0, (DATA_END - DATA_START).days)
        event_date = DATA_START + timedelta(days=days_offset, hours=random.randint(8, 21))
        rows.append({
            "event_name": f"{random.choice(EVENT_TYPES).replace('_', ' ').title()} #{i + 1}",
            "event_type": random.choice(EVENT_TYPES),
            "event_date": event_date.strftime("%Y-%m-%d %H:%M:%S"),
            "venue_name": venue_name,
            "venue_latitude": lat,
            "venue_longitude": lng,
            "expected_crowd_size": random.choice([500, 1000, 5000, 10000, 25000, 40000]),
            "duration_hours": random.choice([2, 3, 4, 6, 8]),
            "is_synthetic": True,
        })

    with open(OUT_PATH, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote {len(rows)} SYNTHETIC event records -> {OUT_PATH}")
    print("This is fabricated demo data, not a real Astram export. See module docstring.")


if __name__ == "__main__":
    main()
