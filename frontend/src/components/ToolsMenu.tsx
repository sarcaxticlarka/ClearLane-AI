import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDashboardStore } from '../store/useDashboardStore';
import { useEventImpacts } from '../hooks/useEventImpacts';
import { useEnforcement } from '../hooks/useEnforcement';
import { downloadCSV } from '../lib/csv';
import { RepeatOffendersModal } from './RepeatOffendersModal';
import { EventImpactModal } from './EventImpactModal';
import { ReportModal } from './ReportModal';

interface ToolsMenuProps {
  onOpenSchedule: () => void;
}

export function ToolsMenu({ onOpenSchedule }: ToolsMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [offendersOpen, setOffendersOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const { events } = useEventImpacts();
  const { recs } = useEnforcement();
  const cascadeLayerOn = useDashboardStore((s) => s.cascadeLayerOn);
  const toggleCascadeLayer = useDashboardStore((s) => s.toggleCascadeLayer);
  const replayMode = useDashboardStore((s) => s.replayMode);
  const setReplayMode = useDashboardStore((s) => s.setReplayMode);

  const updatePosition = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMenuPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
  };

  const openMenu = () => {
    updatePosition();
    setMenuOpen(true);
  };

  useEffect(() => {
    if (!menuOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setMenuOpen(false);
      }
    };
    const onScrollOrResize = () => updatePosition();
    document.addEventListener('mousedown', onClickOutside);
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [menuOpen]);

  const items = [
    {
      key: 'report',
      label: 'Generate Report',
      desc: 'Daily / weekly / monthly report with charts & suggestions',
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
      onClick: () => {
        setReportOpen(true);
        setMenuOpen(false);
      },
    },
    {
      key: 'offenders',
      label: 'Repeat Offenders',
      desc: 'Vehicles with the most recorded violations',
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      onClick: () => {
        setOffendersOpen(true);
        setMenuOpen(false);
      },
    },
    ...(events.length > 0
      ? [
          {
            key: 'events',
            label: 'Event Impact',
            desc: `${events.length} events ranked by violation spike`,
            icon: (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            ),
            onClick: () => {
              setEventsOpen(true);
              setMenuOpen(false);
            },
          },
        ]
      : []),
    {
      key: 'schedule',
      label: 'Shift Schedule',
      desc: 'Officer assignment across 4 shifts',
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="16" y1="2" x2="16" y2="6" />
        </svg>
      ),
      onClick: () => {
        onOpenSchedule();
        setMenuOpen(false);
      },
    },
    {
      key: 'export',
      label: 'Export Patrol Sheet',
      desc: 'Download enforcement list as CSV',
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      ),
      onClick: () => {
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
        );
        setMenuOpen(false);
      },
    },
  ];

  const toggleItems = [
    {
      key: 'cascade',
      label: 'Cascade Risk Layer',
      desc: 'Show congestion spillover between nearby zones',
      active: cascadeLayerOn,
      onClick: toggleCascadeLayer,
    },
    {
      key: 'replay',
      label: 'Timeline Replay',
      desc: 'Animate the typical hour-by-hour violation pattern',
      active: replayMode,
      onClick: () => setReplayMode(!replayMode),
    },
  ];

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (menuOpen ? setMenuOpen(false) : openMenu())}
        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
          menuOpen ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200' : 'border-white/15 bg-white/5 text-gray-300 hover:bg-white/10'
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        Tools
        <svg viewBox="0 0 24 24" className={`h-3 w-3 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {menuOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{ position: 'fixed', top: menuPos.top, right: menuPos.right }}
            className="z-[9999] w-80 overflow-hidden rounded-xl border border-white/15 bg-[#0c0f18] shadow-2xl shadow-black/50"
          >
            <div className="border-b border-white/8 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">Open a panel</p>
            </div>
            <ul className="flex flex-col p-1.5">
              {items.map((item) => (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={item.onClick}
                    className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition hover:bg-white/5"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-cyan-300">
                      {item.icon}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm text-white">{item.label}</span>
                      <span className="block truncate text-[11px] text-gray-500">{item.desc}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-y border-white/8 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">Map layers</p>
            </div>
            <ul className="flex flex-col p-1.5">
              {toggleItems.map((item) => (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={item.onClick}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition hover:bg-white/5"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm text-white">{item.label}</span>
                      <span className="block truncate text-[11px] text-gray-500">{item.desc}</span>
                    </span>
                    <span
                      className={`flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition ${
                        item.active ? 'justify-end bg-cyan-500' : 'justify-start bg-white/15'
                      }`}
                    >
                      <span className="h-4 w-4 rounded-full bg-white" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>,
          document.body
        )}

      <RepeatOffendersModal open={offendersOpen} onClose={() => setOffendersOpen(false)} />
      <EventImpactModal open={eventsOpen} onClose={() => setEventsOpen(false)} />
      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} />
    </>
  );
}
