import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useZones } from '../hooks/useZones';
import { useAnomalies } from '../hooks/useAnomalies';
import { ToolsMenu } from './ToolsMenu';

function KpiCountUp({ value, label, accent }: { value: number; label: string; accent: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const counter = { val: 0 };
    const tween = gsap.to(counter, {
      val: value,
      duration: 1,
      ease: 'power2.out',
      onUpdate: () => {
        if (el) el.textContent = String(Math.round(counter.val));
      },
    });
    return () => {
      tween.kill();
    };
  }, [value]);

  return (
    <div className="flex flex-col items-center px-5">
      <span ref={ref} className={`font-mono-data text-2xl font-semibold ${accent}`}>
        0
      </span>
      <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500">{label}</span>
    </div>
  );
}

interface TopBarProps {
  onOpenSchedule: () => void;
}

export function TopBar({ onOpenSchedule }: TopBarProps) {
  const { zones } = useZones();
  const { anomalies } = useAnomalies();
  const criticalCount = zones.filter((z) => z.severity === 'critical').length;

  return (
    <header className="glass-panel relative z-20 flex h-16 items-center justify-between border-b border-white/10 px-5">
      <div className="flex items-center gap-3">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500">
          <span className="absolute inset-0 animate-pulse rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 opacity-50 blur-md" />
          <svg viewBox="0 0 24 24" className="relative h-5 w-5 text-black" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <div>
          <h1 className="text-base font-semibold tracking-tight text-white">
            ClearLane <span className="text-gradient">AI</span>
          </h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Bengaluru Traffic Intelligence</p>
        </div>
      </div>

      <div className="flex items-center divide-x divide-white/10">
        <KpiCountUp value={zones.length} label="Zones" accent="text-cyan-300" />
        <KpiCountUp value={criticalCount} label="Critical" accent="text-red-400" />
        <KpiCountUp value={anomalies.length} label="Anomalies" accent="text-yellow-300" />
      </div>

      <div className="flex items-center gap-3">
        <ToolsMenu onOpenSchedule={onOpenSchedule} />
        <div className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="font-mono-data text-[11px] text-emerald-300">LIVE</span>
        </div>
      </div>
    </header>
  );
}
