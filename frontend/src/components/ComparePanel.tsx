import { useDashboardStore } from '../store/useDashboardStore';
import { useZoneDetail } from '../hooks/useZoneDetail';
import { ObstructionGauge } from './ObstructionGauge';
import { ForecastChart } from './ForecastChart';
import { Modal } from './ui/Modal';

const SEVERITY_TEXT: Record<string, string> = {
  critical: 'text-red-300',
  high: 'text-orange-300',
  medium: 'text-yellow-300',
  low: 'text-emerald-300',
};

function ZoneCompareColumn({ zoneId }: { zoneId: number }) {
  const { detail, loading } = useZoneDetail(zoneId);

  if (loading || !detail) {
    return (
      <div className="min-w-0 flex-1 space-y-3 rounded-xl border border-white/8 bg-white/[0.02] p-4">
        <div className="mx-auto h-28 w-28 animate-pulse rounded-full bg-white/5" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-white/5" />
        <div className="h-32 w-full animate-pulse rounded bg-white/5" />
      </div>
    );
  }

  return (
    <div className="min-w-0 flex-1 rounded-xl border border-white/8 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Zone</p>
          <h3 className="text-xl font-semibold text-white">{zoneId}</h3>
        </div>
        <span className={`text-xs font-semibold uppercase tracking-wide ${SEVERITY_TEXT[detail.severity] ?? 'text-gray-400'}`}>
          {detail.severity}
        </span>
      </div>
      <div className="mt-2 flex justify-center">
        <ObstructionGauge score={detail.obstruction_score} severity={detail.severity} />
      </div>
      <div className="mt-4 flex flex-col gap-1.5 text-xs text-gray-300">
        <Row label="Police station" value={detail.dominant_police_station ?? 'N/A'} />
        <Row label="Violations" value={String(detail.violation_count)} />
        <Row label="Peak hour" value={detail.peak_hour !== null ? `${detail.peak_hour}:00` : 'N/A'} />
        <Row label="Road centrality" value={detail.centrality_score.toFixed(4)} />
        <Row label="Anomaly flagged" value={detail.anomaly_flag ? 'Yes' : 'No'} />
      </div>
      <div className="mt-4">
        <p className="mb-1 text-[10px] uppercase tracking-wide text-gray-500">48h Forecast</p>
        <ForecastChart zoneId={zoneId} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-white/5 py-1">
      <span className="text-gray-500">{label}</span>
      <span className="font-mono-data text-white">{value}</span>
    </div>
  );
}

export function ComparePanel() {
  const compareOpen = useDashboardStore((s) => s.compareOpen);
  const compareZoneIds = useDashboardStore((s) => s.compareZoneIds);
  const setCompareOpen = useDashboardStore((s) => s.setCompareOpen);
  const clearCompare = useDashboardStore((s) => s.clearCompare);

  if (compareZoneIds.length < 2) return null;

  return (
    <Modal
      open={compareOpen}
      onClose={() => setCompareOpen(false)}
      title="Zone Comparison"
      subtitle={`Zone ${compareZoneIds[0]} vs Zone ${compareZoneIds[1]}`}
      width="w-[56rem]"
      icon={
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
        </svg>
      }
    >
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={clearCompare}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400 transition hover:border-white/20 hover:text-white"
        >
          Clear comparison
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <ZoneCompareColumn zoneId={compareZoneIds[0]} />
        <ZoneCompareColumn zoneId={compareZoneIds[1]} />
      </div>
    </Modal>
  );
}
