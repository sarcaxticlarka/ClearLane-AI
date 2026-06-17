import type {
  AnomalyAlert,
  CascadeGraph,
  EnforcementRec,
  EventImpact,
  ForecastResponse,
  GlobalTrendMonth,
  HeatmapResponse,
  HourlyHeatmapResponse,
  QueryResponse,
  RepeatOffender,
  ReportPeriod,
  ReportResponse,
  ShiftSchedule,
  ZoneCard,
  ZoneDetail,
  ZoneRepeatOffender,
  ZoneTrend,
} from '../types/api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  getZones: () => getJSON<ZoneCard[]>('/api/zones'),
  getZoneDetail: (zoneId: number) => getJSON<ZoneDetail>(`/api/zones/${zoneId}`),
  getHeatmap: () => getJSON<HeatmapResponse>('/api/heatmap'),
  getAnomalies: () => getJSON<AnomalyAlert[]>('/api/anomalies'),
  getEnforcement: () => getJSON<EnforcementRec[]>('/api/enforcement'),
  getForecast: (zoneId: number) => getJSON<ForecastResponse>(`/api/forecast/${zoneId}`),
  getRepeatOffenders: () => getJSON<RepeatOffender[]>('/api/repeat-offenders'),
  getZoneRepeatOffenders: (zoneId: number) => getJSON<ZoneRepeatOffender[]>(`/api/zones/${zoneId}/repeat-offenders`),
  getCascadeGraph: () => getJSON<CascadeGraph>('/api/cascade'),
  getGlobalTrend: () => getJSON<GlobalTrendMonth[]>('/api/trend'),
  getZoneTrend: (zoneId: number) => getJSON<ZoneTrend>(`/api/zones/${zoneId}/trend`),
  getEventImpacts: () => getJSON<EventImpact[]>('/api/events/impact'),
  getShiftSchedule: () => getJSON<ShiftSchedule[]>('/api/shift-schedule'),
  getHourlyHeatmap: () => getJSON<HourlyHeatmapResponse>('/api/heatmap/hourly'),
  getReport: (period: ReportPeriod) => getJSON<ReportResponse>(`/api/report?period=${period}`),
  postQuery: async (question: string): Promise<QueryResponse> => {
    const res = await fetch(`${BASE_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    if (!res.ok) throw new Error(`query failed: ${res.status}`);
    return res.json() as Promise<QueryResponse>;
  },
};
