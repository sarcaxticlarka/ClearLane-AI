import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { ShiftSchedule } from '../types/api';

export function useShiftSchedule(enabled: boolean) {
  const [schedule, setSchedule] = useState<ShiftSchedule[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || schedule.length > 0) return;
    let cancelled = false;
    setLoading(true);
    api
      .getShiftSchedule()
      .then((data) => {
        if (!cancelled) setSchedule(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, schedule.length]);

  return { schedule, loading };
}
