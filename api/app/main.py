"""ClearLane AI FastAPI server. Serves pre-computed ML outputs, no live inference."""
import asyncio
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

load_dotenv()

from . import models
from .keepalive import run_keepalive
from .state import store


@asynccontextmanager
async def lifespan(app: FastAPI):
    store.load()
    keepalive_task = asyncio.create_task(run_keepalive())
    yield
    keepalive_task.cancel()


app = FastAPI(title="ClearLane AI API", lifespan=lifespan)

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    """Cheap target for the self-ping keepalive and uptime monitors — no JSON body work."""
    return {"status": "ok"}


def _to_zone_card(z: dict) -> models.ZoneCard:
    return models.ZoneCard(
        zone_id=z["zone_id"],
        centroid_lat=z["centroid_lat"],
        centroid_lng=z["centroid_lng"],
        violation_count=z["violation_count"],
        obstruction_score=z["obstruction_score"],
        dominant_police_station=z.get("dominant_police_station"),
        is_junction=z.get("is_junction", False),
        peak_hour=z.get("peak_hour"),
        severity=z["severity"],
        anomaly_flag=z["zone_id"] in store.anomaly_zone_ids,
    )


@app.get("/api/zones", response_model=list[models.ZoneCard])
async def get_zones():
    return [_to_zone_card(z) for z in store.zones]


@app.get("/api/zones/{zone_id}", response_model=models.ZoneDetail)
async def get_zone_detail(zone_id: int):
    z = store.zones_by_id.get(zone_id)
    if z is None:
        raise HTTPException(status_code=404, detail=f"zone {zone_id} not found")

    polygon = None
    for feature in store.zones_geojson.get("features", []):
        if feature["properties"]["zone_id"] == zone_id:
            polygon = feature["geometry"]["coordinates"][0]
            break

    return models.ZoneDetail(
        **_to_zone_card(z).model_dump(),
        dominant_junction=z.get("dominant_junction"),
        avg_severity_weight=z.get("avg_severity_weight", 0.0),
        avg_vehicle_weight=z.get("avg_vehicle_weight", 0.0),
        centrality_score=z.get("centrality_score", 0.0),
        polygon=polygon,
    )


@app.get("/api/heatmap", response_model=models.HeatmapResponse)
async def get_heatmap():
    return models.HeatmapResponse(**store.heatmap)


@app.get("/api/anomalies", response_model=list[models.AnomalyAlert])
async def get_anomalies():
    return [models.AnomalyAlert(**a) for a in store.anomalies]


@app.get("/api/enforcement", response_model=list[models.EnforcementRec])
async def get_enforcement():
    return [models.EnforcementRec(**r) for r in store.enforcement_recs]


@app.get("/api/forecast/{zone_id}", response_model=models.ForecastResponse)
async def get_forecast(zone_id: int):
    data = store.forecast_for_zone(zone_id)
    if data is None:
        raise HTTPException(status_code=404, detail=f"no forecast available for zone {zone_id}")
    return models.ForecastResponse(**data)


@app.get("/api/events/impact", response_model=list[models.EventImpact])
async def get_event_impacts():
    return [models.EventImpact(**e) for e in store.event_impacts]


@app.post("/api/query", response_model=models.QueryResponse)
async def post_query(req: models.QueryRequest):
    from .query import answer_question

    return await answer_question(req.question, store)


@app.get("/api/repeat-offenders", response_model=list[models.RepeatOffender])
async def get_repeat_offenders():
    return [models.RepeatOffender(**r) for r in store.repeat_offenders]


@app.get("/api/zones/{zone_id}/repeat-offenders", response_model=list[models.ZoneRepeatOffender])
async def get_zone_repeat_offenders(zone_id: int):
    rows = store.repeat_offenders_by_zone.get(str(zone_id), [])
    return [models.ZoneRepeatOffender(**r) for r in rows]


@app.get("/api/cascade", response_model=models.CascadeGraph)
async def get_cascade_graph():
    return models.CascadeGraph(**store.cascade_graph)


@app.get("/api/trend", response_model=list[models.GlobalTrendMonth])
async def get_global_trend():
    return [models.GlobalTrendMonth(**t) for t in store.trend_global]


@app.get("/api/zones/{zone_id}/trend", response_model=models.ZoneTrend)
async def get_zone_trend(zone_id: int):
    data = store.trend_for_zone(zone_id)
    if data is None:
        raise HTTPException(status_code=404, detail=f"no trend data for zone {zone_id}")
    return models.ZoneTrend(**data)


@app.get("/api/shift-schedule", response_model=list[models.ShiftSchedule])
async def get_shift_schedule():
    return [models.ShiftSchedule(**s) for s in store.shift_schedule]


@app.get("/api/heatmap/hourly", response_model=models.HourlyHeatmapResponse)
async def get_hourly_heatmap():
    return models.HourlyHeatmapResponse(**store.hourly_heatmap)


@app.get("/api/report", response_model=models.ReportResponse)
async def get_report(period: str = Query("weekly", pattern="^(daily|weekly|monthly)$")):
    from .report import build_report

    return models.ReportResponse(**build_report(period, store))
