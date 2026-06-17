import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { RepeatOffender } from '../types/api';

export function useRepeatOffenders() {
  const [offenders, setOffenders] = useState<RepeatOffender[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getRepeatOffenders()
      .then((data) => {
        if (!cancelled) setOffenders(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { offenders, loading };
}
