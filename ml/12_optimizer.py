"""Officer assignment optimizer: turns ranked enforcement_recs into a shift schedule.

Greedily allocates a fixed daily officer pool across 4 six-hour shifts, processing
zones in priority order within each shift so the highest-priority zones get their
full recommended_officers first and lower-priority zones are trimmed or skipped once
a shift's pool is exhausted — avoiding double-booking the same officers across zones
active in the same time window.
"""
import json

from config import OUTPUT_DIR

TOTAL_OFFICERS_PER_SHIFT = 20
SHIFTS = [
    ("Night", 0, 6),
    ("Morning", 6, 12),
    ("Afternoon", 12, 18),
    ("Evening", 18, 24),
]


def shift_for_hour(hour: int) -> str:
    for name, start, end in SHIFTS:
        if start <= hour < end:
            return name
    return SHIFTS[-1][0]


def main():
    with open(OUTPUT_DIR / "enforcement_recs.json") as f:
        recs = json.load(f)

    by_shift: dict[str, list[dict]] = {name: [] for name, _, _ in SHIFTS}
    for r in recs:
        start_hour = int(r["time_window"].split(":")[0])
        by_shift[shift_for_hour(start_hour)].append(r)

    schedule = []
    for shift_name, _, _ in SHIFTS:
        zones = sorted(by_shift[shift_name], key=lambda z: -z["priority_score"])
        remaining = TOTAL_OFFICERS_PER_SHIFT
        assignments = []
        for z in zones:
            requested = z["recommended_officers"]
            allocated = min(requested, remaining)
            if allocated <= 0:
                continue
            assignments.append({
                "zone_id": z["zone_id"],
                "dominant_police_station": z["dominant_police_station"],
                "priority_score": z["priority_score"],
                "time_window": z["time_window"],
                "officers_requested": requested,
                "officers_allocated": allocated,
                "fully_staffed": allocated == requested,
            })
            remaining -= allocated
        schedule.append({
            "shift": shift_name,
            "total_officers": TOTAL_OFFICERS_PER_SHIFT,
            "officers_remaining": remaining,
            "assignments": assignments,
        })

    with open(OUTPUT_DIR / "shift_schedule.json", "w") as f:
        json.dump(schedule, f, indent=2)

    for s in schedule:
        understaffed = sum(1 for a in s["assignments"] if not a["fully_staffed"])
        print(f"{s['shift']}: {len(s['assignments'])} zones staffed, {understaffed} understaffed, {s['officers_remaining']} officers idle")


if __name__ == "__main__":
    main()
