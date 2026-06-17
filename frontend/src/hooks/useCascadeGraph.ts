import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { CascadeGraph } from '../types/api';

export function useCascadeGraph(enabled: boolean) {
  const [graph, setGraph] = useState<CascadeGraph | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || graph) return;
    let cancelled = false;
    setLoading(true);
    api
      .getCascadeGraph()
      .then((data) => {
        if (!cancelled) setGraph(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, graph]);

  return { graph, loading };
}
