import { useShiftSchedule } from '../hooks/useShiftSchedule';
import { Modal } from './ui/Modal';

interface SchedulePanelProps {
  open: boolean;
  onClose: () => void;
}

export function SchedulePanel({ open, onClose }: SchedulePanelProps) {
  const { schedule, loading } = useShiftSchedule(open);
  const totalDeployed = schedule.reduce((sum, s) => sum + (s.total_officers - s.officers_remaining), 0);
  const totalOfficers = schedule.reduce((sum, s) => sum + s.total_officers, 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Officer Shift Schedule"
      subtitle={
        schedule.length > 0
          ? `${totalDeployed}/${totalOfficers} officers deployed across 4 six-hour shifts`
          : 'Greedy allocation by priority score, capped per 6h shift'
      }
      width="w-[52rem]"
      icon={
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="16" y1="2" x2="16" y2="6" />
        </svg>
      }
    >
      {loading && (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      )}

      {!loading && schedule.length === 0 && (
        <p className="text-sm text-gray-500">No schedule data available. Run `python ml/12_optimizer.py` first.</p>
      )}

      {!loading && schedule.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {schedule.map((s) => {
            const deployed = s.total_officers - s.officers_remaining;
            const pct = Math.round((deployed / s.total_officers) * 100);
            return (
              <div key={s.shift} className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">{s.shift}</h3>
                  <span className="font-mono-data text-[11px] text-gray-400">
                    {deployed}/{s.total_officers} deployed
                  </span>
                </div>
                <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {s.assignments.length === 0 && (
                  <p className="text-[11px] text-gray-600">
                    No enforcement-priority zones fall in this window — historically low violation activity
                    here, so all {s.total_officers} officers are free for redeployment.
                  </p>
                )}
                <ul className="flex flex-col gap-1.5">
                  {s.assignments.map((a) => (
                    <li key={a.zone_id} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-2 py-1.5">
                      <div>
                        <p className="text-[11px] text-white">
                          Zone {a.zone_id} <span className="text-gray-500">· {a.dominant_police_station}</span>
                        </p>
                        <p className="text-[10px] text-gray-500">{a.time_window}</p>
                      </div>
                      <span
                        className={`font-mono-data rounded-full px-1.5 py-0.5 text-[10px] ${
                          a.fully_staffed ? 'bg-emerald-500/15 text-emerald-300' : 'bg-orange-500/15 text-orange-300'
                        }`}
                      >
                        {a.officers_allocated}/{a.officers_requested}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
