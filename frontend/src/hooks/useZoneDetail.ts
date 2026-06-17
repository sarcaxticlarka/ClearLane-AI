import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { ZoneDetail } from '../types/api';

export function useZoneDetail(zoneId: number | null) {
  const [detail, setDetail] = useState<ZoneDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (zoneId === null) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api
      .getZoneDetail(zoneId)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [zoneId]);

  return { detail, loading };
}
