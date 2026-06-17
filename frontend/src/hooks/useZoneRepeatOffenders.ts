import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { ZoneRepeatOffender } from '../types/api';

export function useZoneRepeatOffenders(zoneId: number | null) {
  const [offenders, setOffenders] = useState<ZoneRepeatOffender[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (zoneId === null) {
      setOffenders([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api
      .getZoneRepeatOffenders(zoneId)
      .then((data) => {
        if (!cancelled) setOffenders(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [zoneId]);

  return { offenders, loading };
}
