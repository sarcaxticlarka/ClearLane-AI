"""Pydantic v2 response contracts shared by all endpoints."""
from typing import Literal

from pydantic import BaseModel

Severity = Literal["critical", "high", "medium", "low"]


class ZoneCard(BaseModel):
    zone_id: int
    centroid_lat: float
    centroid_lng: float
    violation_count: int
    obstruction_score: float
    dominant_police_station: str | None
    is_junction: bool
    peak_hour: int | None
    severity: Severity
    anomaly_flag: bool


class ZoneDetail(ZoneCard):
    dominant_junction: str | None
    avg_severity_weight: float
    avg_vehicle_weight: float
    centrality_score: float
    polygon: list[list[float]] | None = None


class ForecastPoint(BaseModel):
    ds: str
    yhat: float
    yhat_lower: float
    yhat_upper: float


class ForecastResponse(BaseModel):
    zone_id: int
    forecast: list[ForecastPoint]


class AnomalyAlert(BaseModel):
    zone_id: int
    centroid_lat: float
    centroid_lng: float
    dominant_police_station: str | None
    obstruction_score: float
    violation_count: int
    anomaly_score: float


class EnforcementRec(BaseModel):
    zone_id: int
    centroid_lat: float
    centroid_lng: float
    dominant_police_station: str | None
    obstruction_score: float
    severity: Severity
    priority_score: float
    spike_risk: float
    anomaly_flag: bool
    recommended_officers: int
    time_window: str
    estimated_improvement_pct: float
    reason: str


class HeatmapPoint(BaseModel):
    lat: float
    lng: float
    intensity: float


class HeatmapResponse(BaseModel):
    points: list[HeatmapPoint]
    bbox: dict[str, float]
    grid_size: int


class EventImpact(BaseModel):
    event_name: str | None = None
    venue_name: str | None = None
    venue_latitude: float | None = None
    venue_longitude: float | None = None
    expected_crowd_size: float | None = None
    duration_hours: float | None = None
    violation_count_nearby: int | None = None
    spike_multiplier: float | None = None
    is_synthetic: bool = False


class QueryRequest(BaseModel):
    question: str


class QueryResponse(BaseModel):
    answer: str
    referenced_zone_ids: list[int] = []


class RepeatOffender(BaseModel):
    vehicle_number: str
    vehicle_type: str
    violation_count: int
    dominant_police_station: str | None = None
    zone_ids: list[int] = []


class ZoneRepeatOffender(BaseModel):
    vehicle_number: str
    vehicle_type: str
    violation_count: int


class CascadeNode(BaseModel):
    zone_id: int
    centroid_lat: float
    centroid_lng: float
    obstruction_score: float
    cascade_risk: float
    degree: int


class CascadeEdge(BaseModel):
    source: int
    target: int
    distance_km: float


class CascadeGraph(BaseModel):
    nodes: list[CascadeNode]
    edges: list[CascadeEdge]
    radius_km: float


class TrendMonth(BaseModel):
    month: str
    violation_count: int
    avg_severity_weight: float | None = None


class ZoneTrend(BaseModel):
    zone_id: int
    monthly: list[TrendMonth]


class GlobalTrendMonth(BaseModel):
    month: str
    violation_count: int


class ShiftAssignment(BaseModel):
    zone_id: int
    dominant_police_station: str | None
    priority_score: float
    time_window: str
    officers_requested: int
    officers_allocated: int
    fully_staffed: bool


class ShiftSchedule(BaseModel):
    shift: str
    total_officers: int
    officers_remaining: int
    assignments: list[ShiftAssignment]


class HourlyHeatmapResponse(BaseModel):
    hours: dict[str, list[HeatmapPoint]]
    grid_size: int


class ReportTrendPoint(BaseModel):
    date: str
    count: int


class ReportDateRange(BaseModel):
    start: str | None
    end: str | None


class ReportSeverityBreakdown(BaseModel):
    critical: int
    high: int
    medium: int
    low: int


class ReportResponse(BaseModel):
    period: Literal["daily", "weekly", "monthly"]
    date_range: ReportDateRange
    trend: list[ReportTrendPoint]
    total_violations: int
    current_period_count: int
    prior_period_count: int | None
    change_pct: float | None
    severity_breakdown: ReportSeverityBreakdown
    top_zones: list[ZoneCard]
    anomaly_count: int
    enforcement_summary: list[EnforcementRec]
    suggestions: list[str]
