"""Lifespan-loaded JSON data store. All ML outputs are pre-computed; no live inference."""
import json
from pathlib import Path

ML_OUTPUT_DIR = Path(__file__).resolve().parent.parent.parent / "ml" / "output"


class DataStore:
    zones: list[dict] = []
    zones_by_id: dict[int, dict] = {}
    zones_geojson: dict = {}
    heatmap: dict = {}
    anomalies: list[dict] = []
    anomaly_zone_ids: set[int] = set()
    enforcement_recs: list[dict] = []
    event_impacts: list[dict] = []
    repeat_offenders: list[dict] = []
    repeat_offenders_by_zone: dict[str, list[dict]] = {}
    cascade_graph: dict = {}
    trend_global: list[dict] = []
    shift_schedule: list[dict] = []
    hourly_heatmap: dict = {}
    report_trends: dict = {}
    forecasts_dir: Path = ML_OUTPUT_DIR / "forecasts"
    trends_dir: Path = ML_OUTPUT_DIR / "trends"

    def load(self):
        self.zones = _load_json(ML_OUTPUT_DIR / "zone_scores.json", [])
        self.zones_by_id = {z["zone_id"]: z for z in self.zones}
        self.zones_geojson = _load_json(ML_OUTPUT_DIR / "zones.geojson", {})
        self.heatmap = _load_json(ML_OUTPUT_DIR / "kde_points.json", {"points": [], "bbox": {}, "grid_size": 0})
        self.anomalies = _load_json(ML_OUTPUT_DIR / "anomalies.json", [])
        self.anomaly_zone_ids = {a["zone_id"] for a in self.anomalies}
        self.enforcement_recs = _load_json(ML_OUTPUT_DIR / "enforcement_recs.json", [])
        self.event_impacts = _load_json(ML_OUTPUT_DIR / "event_impacts.json", [])
        self.repeat_offenders = _load_json(ML_OUTPUT_DIR / "repeat_offenders.json", [])
        self.repeat_offenders_by_zone = _load_json(ML_OUTPUT_DIR / "repeat_offenders_by_zone.json", {})
        self.cascade_graph = _load_json(ML_OUTPUT_DIR / "cascade_graph.json", {"nodes": [], "edges": [], "radius_km": 0})
        self.trend_global = _load_json(ML_OUTPUT_DIR / "trend_global.json", [])
        self.shift_schedule = _load_json(ML_OUTPUT_DIR / "shift_schedule.json", [])
        self.hourly_heatmap = _load_json(ML_OUTPUT_DIR / "hourly_heatmap.json", {"hours": {}, "grid_size": 0})
        self.report_trends = _load_json(ML_OUTPUT_DIR / "report_trends.json", {"daily": [], "weekly": [], "monthly": []})

    def forecast_for_zone(self, zone_id: int) -> dict | None:
        path = self.forecasts_dir / f"{zone_id}.json"
        if not path.exists():
            return None
        return _load_json(path, None)

    def trend_for_zone(self, zone_id: int) -> dict | None:
        path = self.trends_dir / f"{zone_id}.json"
        if not path.exists():
            return None
        return _load_json(path, None)


def _load_json(path: Path, default):
    if not path.exists():
        return default
    with open(path) as f:
        return json.load(f)


store = DataStore()
