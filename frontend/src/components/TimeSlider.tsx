import { useDashboardStore } from '../store/useDashboardStore';

export function TimeSlider() {
  const hourFilter = useDashboardStore((s) => s.hourFilter);
  const setHourFilter = useDashboardStore((s) => s.setHourFilter);

  return (
    <div className="glass-panel relative z-10 flex items-center gap-3 border-t border-white/10 px-5 py-2.5">
      <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-gray-500">Peak-hour filter</span>
      <input
        type="range"
        min={0}
        max={23}
        step={1}
        value={hourFilter ?? 0}
        onChange={(e) => setHourFilter(Number(e.target.value))}
        className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-cyan-400 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(34,211,238,0.8)]"
      />
      <span className="font-mono-data w-14 text-right text-sm text-white">
        {hourFilter !== null ? `${hourFilter}:00` : 'All'}
      </span>
      {hourFilter !== null && (
        <button
          type="button"
          onClick={() => setHourFilter(null)}
          className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-gray-300 transition hover:border-white/20 hover:bg-white/10"
        >
          Clear
        </button>
      )}
    </div>
  );
}
