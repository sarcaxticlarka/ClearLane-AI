import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { EnforcementRec } from '../types/api';

export function useEnforcement() {
  const [recs, setRecs] = useState<EnforcementRec[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getEnforcement()
      .then((data) => {
        if (!cancelled) setRecs(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { recs, loading };
}
