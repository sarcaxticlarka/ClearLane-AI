import { useEventImpacts } from '../hooks/useEventImpacts';
import { Modal } from './ui/Modal';

interface EventImpactModalProps {
  open: boolean;
  onClose: () => void;
}

export function EventImpactModal({ open, onClose }: EventImpactModalProps) {
  const { events, loading } = useEventImpacts();
  const isSynthetic = events.some((e) => e.is_synthetic);
  const sorted = events.slice().sort((a, b) => (b.spike_multiplier ?? 0) - (a.spike_multiplier ?? 0));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Event Impact"
      subtitle={`${events.length} events ranked by violation spike multiplier`}
      width="w-[36rem]"
      icon={
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      }
    >
      {isSynthetic && (
        <p className="mb-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-2.5 text-xs leading-relaxed text-yellow-300">
          ⚠ <strong>Synthetic demo data.</strong> The real Astram events export wasn't
          available for this project, so these are fabricated events at real Bengaluru
          venues used to illustrate the feature. Replace{' '}
          <code className="font-mono-data">data/raw/astram_events.csv</code> with a real
          export to go live.
        </p>
      )}
      {loading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      )}
      {!loading && events.length === 0 && <p className="text-sm text-gray-500">No event impact data available.</p>}
      <ul className="flex flex-col gap-1.5">
        {sorted.map((e, idx) => (
          <li key={`${e.event_name}-${idx}`} className="rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white">{e.event_name}</p>
              <span className="font-mono-data rounded-full bg-cyan-500/15 px-2.5 py-1 text-xs font-medium text-cyan-300">
                {e.spike_multiplier?.toFixed(1)}× spike
              </span>
            </div>
            <p className="mt-0.5 text-xs text-gray-500">
              {e.venue_name} · {e.violation_count_nearby} nearby violations · {e.expected_crowd_size?.toLocaleString()} expected crowd
            </p>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
