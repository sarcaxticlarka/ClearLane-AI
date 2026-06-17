import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { ForecastResponse } from '../types/api';

export function useForecast(zoneId: number | null) {
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (zoneId === null) {
      setForecast(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getForecast(zoneId)
      .then((data) => {
        if (!cancelled) setForecast(data);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [zoneId]);

  return { forecast, loading, error };
}
