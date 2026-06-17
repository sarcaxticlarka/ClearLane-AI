import { useEnforcement } from '../hooks/useEnforcement';
import { useDashboardStore } from '../store/useDashboardStore';
import { downloadCSV } from '../lib/csv';

const SEVERITY_STYLES: Record<string, { badge: string; bar: string }> = {
  critical: { badge: 'bg-red-500/20 text-red-300 border-red-500/40', bar: 'from-red-500 to-rose-400' },
  high: { badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40', bar: 'from-orange-500 to-amber-400' },
  medium: { badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40', bar: 'from-yellow-500 to-lime-400' },
  low: { badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', bar: 'from-emerald-500 to-teal-400' },
};

export function ZoneSidebar() {
  const { recs, loading } = useEnforcement();
  const selectZone = useDashboardStore((s) => s.selectZone);
  const selectedZoneId = useDashboardStore((s) => s.selectedZoneId);
  const compareZoneIds = useDashboardStore((s) => s.compareZoneIds);
  const toggleCompareZone = useDashboardStore((s) => s.toggleCompareZone);
  const setCompareOpen = useDashboardStore((s) => s.setCompareOpen);

  return (
    <aside className="glass-panel relative z-10 flex h-full w-80 flex-col overflow-y-auto border-r border-white/10 p-3">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
          Enforcement Priorities
        </h2>
        <span className="font-mono-data rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] text-violet-300">
          Top {recs.length}
        </span>
      </div>

      <button
        type="button"
        disabled={recs.length === 0}
        onClick={() =>
          downloadCSV(
            `clearlane_patrol_sheet_${new Date().toISOString().slice(0, 10)}.csv`,
            recs.map((r) => ({
              zone_id: r.zone_id,
              police_station: r.dominant_police_station,
              severity: r.severity,
              priority_score: r.priority_score,
              obstruction_score: r.obstruction_score,
              recommended_officers: r.recommended_officers,
              time_window: r.time_window,
              estimated_improvement_pct: r.estimated_improvement_pct,
              reason: r.reason,
              lat: r.centroid_lat,
              lng: r.centroid_lng,
            }))
          )
        }
        className="mb-3 flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] py-1.5 text-xs text-gray-300 transition hover:border-cyan-400/30 hover:text-white disabled:opacity-40"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Export patrol sheet (CSV)
      </button>

      {compareZoneIds.length > 0 && (
        <button
          type="button"
          onClick={() => setCompareOpen(true)}
          className="mb-3 flex items-center justify-between rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-200 transition hover:bg-cyan-400/15"
        >
          <span>
            Compare zones {compareZoneIds.join(' vs ')}
            {compareZoneIds.length < 2 ? ' — select one more' : ''}
          </span>
          {compareZoneIds.length === 2 && <span className="font-semibold">View →</span>}
        </button>
      )}

      {loading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {recs.map((rec, idx) => {
          const style = SEVERITY_STYLES[rec.severity] ?? SEVERITY_STYLES.low;
          const isSelected = selectedZoneId === rec.zone_id;
          const isComparing = compareZoneIds.includes(rec.zone_id);
          return (
            <li key={rec.zone_id}>
              <div
                className={`group relative w-full overflow-hidden rounded-xl border p-3 text-left transition-all duration-200 ${
                  isSelected
                    ? 'border-cyan-400/50 bg-cyan-400/[0.07] glow-border-cyan'
                    : isComparing
                      ? 'border-violet-400/40 bg-violet-400/[0.06]'
                      : 'border-white/8 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                }`}
              >
                <div className={`absolute left-0 top-0 h-full w-1 bg-gradient-to-b ${style.bar}`} />
                <div className="flex items-center justify-between pl-2">
                  <button
                    type="button"
                    onClick={() => selectZone(rec.zone_id)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <span className="font-mono-data text-[11px] text-gray-500">#{idx + 1}</span>
                    <span className="font-medium text-white">Zone {rec.zone_id}</span>
                  </button>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style.badge}`}>
                      {rec.severity}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCompareZone(rec.zone_id);
                      }}
                      title={isComparing ? 'Remove from comparison' : 'Add to comparison'}
                      className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-bold transition ${
                        isComparing
                          ? 'border-violet-400/50 bg-violet-400/20 text-violet-200'
                          : 'border-white/15 bg-white/5 text-gray-400 hover:border-violet-400/40 hover:text-violet-200'
                      }`}
                    >
                      {isComparing ? '✓' : '+'}
                    </button>
                  </div>
                </div>
                <button type="button" onClick={() => selectZone(rec.zone_id)} className="block w-full text-left">
                  <p className="mt-1.5 pl-2 text-xs text-gray-400">{rec.dominant_police_station}</p>
                  <div className="mt-2 flex items-center gap-3 pl-2 font-mono-data text-[11px] text-gray-300">
                    <span className="text-cyan-300">{rec.priority_score.toFixed(0)} pri</span>
                    <span>·</span>
                    <span>{rec.recommended_officers} officers</span>
                    <span>·</span>
                    <span>{rec.time_window}</span>
                  </div>
                  <p className="mt-1.5 pl-2 text-[11px] leading-snug text-gray-500">{rec.reason}</p>
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
