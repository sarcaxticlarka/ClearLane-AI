import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { HeatmapResponse } from '../types/api';

export function useHeatmap() {
  const [heatmap, setHeatmap] = useState<HeatmapResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getHeatmap()
      .then((data) => {
        if (!cancelled) setHeatmap(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { heatmap, loading };
}
