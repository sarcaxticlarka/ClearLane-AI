import { Component, type ErrorInfo, type ReactNode, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useDashboardStore } from '../store/useDashboardStore';
import { useZoneDetail } from '../hooks/useZoneDetail';
import { useZoneRepeatOffenders } from '../hooks/useZoneRepeatOffenders';
import { ForecastChart } from './ForecastChart';
import { TrendChart } from './TrendChart';
import { ObstructionGauge } from './ObstructionGauge';

class DrawerErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ZoneDrawer crashed', error, info);
  }

  render() {
    if (this.state.hasError) {
      return <div className="p-4 text-sm text-red-400">Zone details failed to load.</div>;
    }
    return this.props.children;
  }
}

const TABS = ['Overview', 'Trend', 'Forecast', 'Offenders'] as const;
type Tab = (typeof TABS)[number];

function ZoneDrawerInner() {
  const drawerOpen = useDashboardStore((s) => s.drawerOpen);
  const selectedZoneId = useDashboardStore((s) => s.selectedZoneId);
  const closeDrawer = useDashboardStore((s) => s.closeDrawer);
  const { detail, loading } = useZoneDetail(selectedZoneId);
  const { offenders: zoneOffenders, loading: offendersLoading } = useZoneRepeatOffenders(selectedZoneId);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const [tab, setTab] = useState<Tab>('Overview');

  useEffect(() => {
    if (!drawerRef.current) return;
    const tween = gsap.fromTo(
      drawerRef.current,
      { x: 40, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.35, ease: 'power2.out' }
    );
    return () => {
      tween.kill();
    };
  }, [selectedZoneId]);

  if (!drawerOpen) return null;

  return (
    <aside
      ref={drawerRef}
      className="glass-panel relative z-10 flex h-full w-96 flex-col overflow-y-auto border-l border-white/10 p-4"
    >
      <div className="mb-1 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Zone Detail</p>
          <h2 className="text-xl font-semibold text-white">Zone {selectedZoneId}</h2>
        </div>
        <button
          type="button"
          onClick={closeDrawer}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-gray-400 transition hover:border-white/20 hover:text-white"
        >
          ✕
        </button>
      </div>

      {loading && (
        <div className="mt-4 flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-6 animate-pulse rounded bg-white/5" />
          ))}
        </div>
      )}

      {detail && (
        <>
          <div className="mt-3 flex items-center gap-4 rounded-xl border border-white/8 bg-white/[0.03] p-3">
            <ObstructionGauge score={detail.obstruction_score} severity={detail.severity} />
            <div className="flex flex-col gap-1">
              <span
                className={`w-fit rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  detail.severity === 'critical'
                    ? 'border-red-500/40 bg-red-500/20 text-red-300'
                    : detail.severity === 'high'
                      ? 'border-orange-500/40 bg-orange-500/20 text-orange-300'
                      : detail.severity === 'medium'
                        ? 'border-yellow-500/40 bg-yellow-500/20 text-yellow-300'
                        : 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {detail.severity}
              </span>
              <p className="text-sm font-medium text-white">{detail.dominant_police_station ?? 'N/A'}</p>
              <p className="text-xs text-gray-500">{detail.dominant_junction ?? 'No named junction'}</p>
              {detail.anomaly_flag && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-yellow-300">
                  <span className="pulse-ring h-1.5 w-1.5 rounded-full bg-yellow-400" /> Anomaly detected
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 flex gap-1 rounded-lg border border-white/8 bg-white/[0.02] p-1">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 rounded-md py-1.5 text-xs font-medium transition ${
                  tab === t ? 'bg-gradient-to-r from-cyan-500/30 to-violet-500/30 text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="mt-4">
            {tab === 'Overview' && (
              <div className="flex flex-col gap-2 text-sm text-gray-300">
                <Field label="Violations recorded" value={String(detail.violation_count)} />
                <Field label="Peak hour" value={detail.peak_hour !== null ? `${detail.peak_hour}:00` : 'N/A'} />
                <Field label="Avg severity weight" value={detail.avg_severity_weight.toFixed(2)} />
                <Field label="Avg vehicle weight" value={detail.avg_vehicle_weight.toFixed(2)} />
                <Field label="Road centrality" value={detail.centrality_score.toFixed(4)} />
              </div>
            )}
            {tab === 'Trend' && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Monthly Trend</h3>
                {selectedZoneId !== null && <TrendChart zoneId={selectedZoneId} />}
              </div>
            )}
            {tab === 'Forecast' && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">48h Forecast</h3>
                {selectedZoneId !== null && <ForecastChart zoneId={selectedZoneId} />}
              </div>
            )}
            {tab === 'Offenders' && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Repeat Offenders</h3>
                {offendersLoading && <div className="h-20 animate-pulse rounded-lg bg-white/5" />}
                {!offendersLoading && zoneOffenders.length === 0 && (
                  <p className="text-xs text-gray-500">No vehicles with repeat violations in this zone.</p>
                )}
                <ul className="flex flex-col gap-1.5">
                  {zoneOffenders.map((o) => (
                    <li
                      key={o.vehicle_number}
                      className="flex items-center justify-between rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2"
                    >
                      <div>
                        <p className="font-mono-data text-xs text-white">{o.vehicle_number}</p>
                        <p className="text-[10px] text-gray-500">{o.vehicle_type}</p>
                      </div>
                      <span className="font-mono-data rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] text-violet-300">
                        {o.violation_count}×
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-white/5 py-1.5">
      <span className="text-gray-500">{label}</span>
      <span className="font-mono-data text-white">{value}</span>
    </div>
  );
}

export function ZoneDrawer() {
  return (
    <DrawerErrorBoundary>
      <ZoneDrawerInner />
    </DrawerErrorBoundary>
  );
}
