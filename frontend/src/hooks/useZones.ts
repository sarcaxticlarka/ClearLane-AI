import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { ZoneCard } from '../types/api';

export function useZones() {
  const [zones, setZones] = useState<ZoneCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getZones()
      .then((data) => {
        if (!cancelled) setZones(data);
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
  }, []);

  return { zones, loading, error };
}
