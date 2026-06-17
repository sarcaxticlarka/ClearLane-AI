import { useEffect, useRef } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { useHourlyHeatmap } from '../hooks/useHourlyHeatmap';



const STEP_MS = 900;

export function TimelineReplay() {
  const replayMode = useDashboardStore((s) => s.replayMode);
  const replayHour = useDashboardStore((s) => s.replayHour);
  const replayPlaying = useDashboardStore((s) => s.replayPlaying);
  const setReplayMode = useDashboardStore((s) => s.setReplayMode);
  const setReplayHour = useDashboardStore((s) => s.setReplayHour);
  const setReplayPlaying = useDashboardStore((s) => s.setReplayPlaying);
  const advanceReplayHour = useDashboardStore((s) => s.advanceReplayHour);
  const setHourlyHeatmap = useDashboardStore((s) => s.setHourlyHeatmap);
  const { data, loading } = useHourlyHeatmap(replayMode);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (data) setHourlyHeatmap(data);
  }, [data, setHourlyHeatmap]);

  useEffect(() => {
    if (replayPlaying) {
      intervalRef.current = setInterval(advanceReplayHour, STEP_MS);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [replayPlaying, advanceReplayHour]);

  return (
    <div className="glass-panel relative z-10 flex items-center gap-3 border-t border-white/10 px-5 py-2.5">
      <button
        type="button"
        onClick={() => setReplayMode(!replayMode)}
        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide transition ${
          replayMode ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200' : 'border-white/10 text-gray-500 hover:text-gray-300'
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        Replay
      </button>

      {replayMode ? (
        <>
          <button
            type="button"
            onClick={() => setReplayPlaying(!replayPlaying)}
            disabled={loading}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 text-black transition hover:opacity-90 disabled:opacity-40"
          >
            {replayPlaying ? (
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                <rect x="6" y="5" width="4" height="14" />
                <rect x="14" y="5" width="4" height="14" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                <polygon points="6 4 20 12 6 20 6 4" />
              </svg>
            )}
          </button>
          <input
            type="range"
            min={0}
            max={23}
            step={1}
            value={replayHour}
            onChange={(e) => setReplayHour(Number(e.target.value))}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-cyan-400 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(34,211,238,0.8)]"
          />
          <span className="font-mono-data w-16 text-right text-sm text-white">
            {String(replayHour).padStart(2, '0')}:00
          </span>
          {loading && <span className="text-[10px] text-gray-500">loading...</span>}
        </>
      ) : (
        <span className="text-[11px] text-gray-600">
          Replay the typical Bengaluru violation pattern hour-by-hour, computed from 5 months of data
        </span>
      )}
    </div>
  );
}
