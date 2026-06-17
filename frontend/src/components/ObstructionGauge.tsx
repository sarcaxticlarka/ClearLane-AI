import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const SEVERITY_COLOR: Record<string, string> = {
  critical: '#f87171',
  high: '#fb923c',
  medium: '#facc15',
  low: '#34d399',
};

interface ObstructionGaugeProps {
  score: number;
  severity: string;
}

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ObstructionGauge({ score, severity }: ObstructionGaugeProps) {
  const circleRef = useRef<SVGCircleElement | null>(null);
  const textRef = useRef<HTMLSpanElement | null>(null);
  const color = SEVERITY_COLOR[severity] ?? '#9ca3af';

  useEffect(() => {
    const circle = circleRef.current;
    const text = textRef.current;
    if (!circle || !text) return;

    const offset = CIRCUMFERENCE * (1 - score / 100);
    gsap.fromTo(
      circle,
      { strokeDashoffset: CIRCUMFERENCE },
      { strokeDashoffset: offset, duration: 1.1, ease: 'power2.out' }
    );

    const counter = { val: 0 };
    gsap.to(counter, {
      val: score,
      duration: 1.1,
      ease: 'power2.out',
      onUpdate: () => {
        if (text) text.textContent = Math.round(counter.val).toString();
      },
    });
  }, [score]);

  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      <svg width="112" height="112" viewBox="0 0 112 112" className="-rotate-90">
        <circle cx="56" cy="56" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle
          ref={circleRef}
          cx="56"
          cy="56"
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          style={{ filter: `drop-shadow(0 0 6px ${color}aa)` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span ref={textRef} className="font-mono-data text-2xl font-bold text-white">
          0
        </span>
        <span className="text-[9px] uppercase tracking-wider text-gray-500">/ 100</span>
      </div>
    </div>
  );
}
