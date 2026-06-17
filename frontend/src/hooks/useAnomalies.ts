import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { AnomalyAlert } from '../types/api';

export function useAnomalies() {
  const [anomalies, setAnomalies] = useState<AnomalyAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getAnomalies()
      .then((data) => {
        if (!cancelled) setAnomalies(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { anomalies, loading };
}
