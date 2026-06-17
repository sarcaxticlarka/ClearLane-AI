import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { HourlyHeatmapResponse } from '../types/api';

export function useHourlyHeatmap(enabled: boolean) {
  const [data, setData] = useState<HourlyHeatmapResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || data) return;
    let cancelled = false;
    setLoading(true);
    api
      .getHourlyHeatmap()
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, data]);

  return { data, loading };
}
