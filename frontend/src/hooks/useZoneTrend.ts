import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { ZoneTrend } from '../types/api';

export function useZoneTrend(zoneId: number | null) {
  const [trend, setTrend] = useState<ZoneTrend | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (zoneId === null) {
      setTrend(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getZoneTrend(zoneId)
      .then((data) => {
        if (!cancelled) setTrend(data);
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

  return { trend, loading, error };
}
