import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { ReportPeriod, ReportResponse } from '../types/api';

export function useReport(period: ReportPeriod, enabled: boolean) {
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getReport(period)
      .then((data) => {
        if (!cancelled) setReport(data);
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
  }, [period, enabled]);

  return { report, loading, error };
}
