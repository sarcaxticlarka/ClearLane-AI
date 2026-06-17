export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface ZoneCard {
  zone_id: number;
  centroid_lat: number;
  centroid_lng: number;
  violation_count: number;
  obstruction_score: number;
  dominant_police_station: string | null;
  is_junction: boolean;
  peak_hour: number | null;
  severity: Severity;
  anomaly_flag: boolean;
}

export interface ZoneDetail extends ZoneCard {
  dominant_junction: string | null;
  avg_severity_weight: number;
  avg_vehicle_weight: number;
  centrality_score: number;
  polygon: number[][] | null;
}

export interface ForecastPoint {
  ds: string;
  yhat: number;
  yhat_lower: number;
  yhat_upper: number;
}

export interface ForecastResponse {
  zone_id: number;
  forecast: ForecastPoint[];
}

export interface AnomalyAlert {
  zone_id: number;
  centroid_lat: number;
  centroid_lng: number;
  dominant_police_station: string | null;
  obstruction_score: number;
  violation_count: number;
  anomaly_score: number;
}

export interface EnforcementRec {
  zone_id: number;
  centroid_lat: number;
  centroid_lng: number;
  dominant_police_station: string | null;
  obstruction_score: number;
  severity: Severity;
  priority_score: number;
  spike_risk: number;
  anomaly_flag: boolean;
  recommended_officers: number;
  time_window: string;
  estimated_improvement_pct: number;
  reason: string;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}

export interface HeatmapResponse {
  points: HeatmapPoint[];
  bbox: Record<string, number>;
  grid_size: number;
}

export interface QueryResponse {
  answer: string;
  referenced_zone_ids: number[];
}

export interface RepeatOffender {
  vehicle_number: string;
  vehicle_type: string;
  violation_count: number;
  dominant_police_station: string | null;
  zone_ids: number[];
}

export interface ZoneRepeatOffender {
  vehicle_number: string;
  vehicle_type: string;
  violation_count: number;
}

export interface CascadeNode {
  zone_id: number;
  centroid_lat: number;
  centroid_lng: number;
  obstruction_score: number;
  cascade_risk: number;
  degree: number;
}

export interface CascadeEdge {
  source: number;
  target: number;
  distance_km: number;
}

export interface CascadeGraph {
  nodes: CascadeNode[];
  edges: CascadeEdge[];
  radius_km: number;
}

export interface TrendMonth {
  month: string;
  violation_count: number;
  avg_severity_weight: number | null;
}

export interface EventImpact {
  event_name: string | null;
  venue_name: string | null;
  venue_latitude: number | null;
  venue_longitude: number | null;
  expected_crowd_size: number | null;
  duration_hours: number | null;
  violation_count_nearby: number | null;
  spike_multiplier: number | null;
  is_synthetic: boolean;
}

export interface ZoneTrend {
  zone_id: number;
  monthly: TrendMonth[];
}

export interface GlobalTrendMonth {
  month: string;
  violation_count: number;
}

export interface ShiftAssignment {
  zone_id: number;
  dominant_police_station: string | null;
  priority_score: number;
  time_window: string;
  officers_requested: number;
  officers_allocated: number;
  fully_staffed: boolean;
}

export interface ShiftSchedule {
  shift: string;
  total_officers: number;
  officers_remaining: number;
  assignments: ShiftAssignment[];
}

export interface HourlyHeatmapResponse {
  hours: Record<string, HeatmapPoint[]>;
  grid_size: number;
}

export type ReportPeriod = 'daily' | 'weekly' | 'monthly';

export interface ReportTrendPoint {
  date: string;
  count: number;
}

export interface ReportSeverityBreakdown {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface ReportResponse {
  period: ReportPeriod;
  date_range: { start: string | null; end: string | null };
  trend: ReportTrendPoint[];
  total_violations: number;
  current_period_count: number;
  prior_period_count: number | null;
  change_pct: number | null;
  severity_breakdown: ReportSeverityBreakdown;
  top_zones: ZoneCard[];
  anomaly_count: number;
  enforcement_summary: EnforcementRec[];
  suggestions: string[];
}
