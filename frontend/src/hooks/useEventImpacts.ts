import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { EventImpact } from '../types/api';

export function useEventImpacts() {
  const [events, setEvents] = useState<EventImpact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getEventImpacts()
      .then((data) => {
        if (!cancelled) setEvents(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { events, loading };
}
