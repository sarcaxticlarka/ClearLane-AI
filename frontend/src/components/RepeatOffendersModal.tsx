import { useRepeatOffenders } from '../hooks/useRepeatOffenders';
import { useDashboardStore } from '../store/useDashboardStore';
import { Modal } from './ui/Modal';

interface RepeatOffendersModalProps {
  open: boolean;
  onClose: () => void;
}

export function RepeatOffendersModal({ open, onClose }: RepeatOffendersModalProps) {
  const { offenders, loading } = useRepeatOffenders();
  const selectZone = useDashboardStore((s) => s.selectZone);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Repeat Offenders"
      subtitle={`Top ${Math.min(offenders.length, 50)} vehicles by recorded violation count`}
      width="w-[36rem]"
      icon={
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      }
    >
      {loading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      )}
      {!loading && offenders.length === 0 && (
        <p className="text-sm text-gray-500">No vehicles with repeat violations found.</p>
      )}
      <ul className="flex flex-col gap-1.5">
        {offenders.map((o, idx) => (
          <li key={o.vehicle_number}>
            <button
              type="button"
              onClick={() => {
                if (o.zone_ids[0] !== undefined) selectZone(o.zone_ids[0]);
                onClose();
              }}
              className="flex w-full items-center justify-between rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2.5 text-left transition hover:border-violet-400/30 hover:bg-white/5"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono-data w-6 text-xs text-gray-600">#{idx + 1}</span>
                <div>
                  <p className="font-mono-data text-sm text-white">{o.vehicle_number}</p>
                  <p className="text-xs text-gray-500">
                    {o.vehicle_type} · {o.dominant_police_station}
                    {o.zone_ids.length > 0 && ` · Zone ${o.zone_ids[0]}`}
                  </p>
                </div>
              </div>
              <span className="font-mono-data rounded-full bg-violet-500/15 px-2.5 py-1 text-xs font-medium text-violet-300">
                {o.violation_count}×
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
