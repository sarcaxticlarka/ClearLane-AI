import { useRef, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useReport } from '../hooks/useReport';
import { exportNodeToPdf } from '../lib/exportPdf';
import { Modal } from './ui/Modal';
import type { ReportPeriod } from '../types/api';

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
}

const PERIODS: { key: ReportPeriod; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
];

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#f87171',
  high: '#fb923c',
  medium: '#facc15',
  low: '#34d399',
};

export function ReportModal({ open, onClose }: ReportModalProps) {
  const [period, setPeriod] = useState<ReportPeriod>('weekly');
  const [exporting, setExporting] = useState(false);
  const { report, loading, error } = useReport(period, open);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const handleDownload = async () => {
    if (!contentRef.current) return;
    setExporting(true);
    try {
      await exportNodeToPdf(contentRef.current, `clearlane_${period}_report_${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generate Report"
      subtitle={report?.date_range.start ? `Data range: ${report.date_range.start} to ${report.date_range.end}` : undefined}
      width="w-[52rem]"
      icon={
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      }
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1 rounded-lg border border-white/8 bg-white/[0.02] p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={`rounded-md px-4 py-1.5 text-xs font-medium transition ${
                period === p.key ? 'bg-gradient-to-r from-cyan-500/30 to-violet-500/30 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={!report || exporting}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-xs font-semibold text-black transition hover:opacity-90 disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {exporting ? 'Generating PDF...' : 'Download PDF'}
        </button>
      </div>

      {loading && (
        <div className="flex flex-col gap-3">
          <div className="h-24 animate-pulse rounded-xl bg-white/5" />
          <div className="h-48 animate-pulse rounded-xl bg-white/5" />
          <div className="h-32 animate-pulse rounded-xl bg-white/5" />
        </div>
      )}

      {error && <p className="text-sm text-red-400">Failed to load report: {error}</p>}

      {report && !loading && (
        <div ref={contentRef} className="rounded-xl bg-[#0c0f18] p-1">
          {/* Header for the PDF export */}
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-lg font-semibold text-white">
                ClearLane AI — {PERIODS.find((p) => p.key === period)?.label} Report
              </h3>
              <p className="text-xs text-gray-500">
                {report.date_range.start} to {report.date_range.end} · Generated {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* KPI row */}
          <div className="mb-4 grid grid-cols-4 gap-3">
            <KpiCard label="Total Violations" value={report.total_violations.toLocaleString()} />
            <KpiCard
              label="This Period"
              value={report.current_period_count.toLocaleString()}
              delta={report.change_pct}
            />
            <KpiCard label="Anomalies" value={String(report.anomaly_count)} accent="text-yellow-300" />
            <KpiCard
              label="Critical Zones"
              value={String(report.severity_breakdown.critical)}
              accent="text-red-400"
            />
          </div>

          {/* Trend chart */}
          <div className="mb-4 rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Violation Trend</p>
            <div className="h-48 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={report.trend} margin={{ top: 4, right: 8, bottom: 20, left: -16 }}>
                  <defs>
                    <linearGradient id="reportGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#6b7280' }} angle={-30} textAnchor="end" height={36} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} width={36} />
                  <Tooltip contentStyle={{ background: '#0c0f18', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12, borderRadius: 8 }} />
                  <Area type="monotone" dataKey="count" stroke="#22d3ee" strokeWidth={2} fill="url(#reportGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Severity breakdown */}
          <div className="mb-4 rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Zone Severity Breakdown</p>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/5">
              {(['critical', 'high', 'medium', 'low'] as const).map((sev) => {
                const total =
                  report.severity_breakdown.critical +
                  report.severity_breakdown.high +
                  report.severity_breakdown.medium +
                  report.severity_breakdown.low;
                const pct = total > 0 ? (report.severity_breakdown[sev] / total) * 100 : 0;
                return <div key={sev} style={{ width: `${pct}%`, background: SEVERITY_COLORS[sev] }} />;
              })}
            </div>
            <div className="mt-3 flex gap-4 text-xs">
              {(['critical', 'high', 'medium', 'low'] as const).map((sev) => (
                <div key={sev} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: SEVERITY_COLORS[sev] }} />
                  <span className="capitalize text-gray-400">{sev}</span>
                  <span className="font-mono-data text-white">{report.severity_breakdown[sev]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top zones */}
          <div className="mb-4 rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Top Priority Zones</p>
            <ul className="flex flex-col gap-1.5">
              {report.top_zones.map((z, idx) => (
                <li key={z.zone_id} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
                  <span className="flex items-center gap-2 text-sm text-white">
                    <span className="font-mono-data text-xs text-gray-600">#{idx + 1}</span>
                    Zone {z.zone_id} <span className="text-gray-500">· {z.dominant_police_station}</span>
                  </span>
                  <span className="font-mono-data text-xs" style={{ color: SEVERITY_COLORS[z.severity] }}>
                    {z.obstruction_score}/100
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Suggestions */}
          <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.04] p-4">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-cyan-300">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                <path d="M12 2l1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6L12 2z" />
              </svg>
              AI-Generated Suggestions
            </p>
            <ul className="flex flex-col gap-2">
              {report.suggestions.map((s, idx) => (
                <li key={idx} className="flex gap-2 text-sm leading-relaxed text-gray-300">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-cyan-400" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Modal>
  );
}

function KpiCard({ label, value, delta, accent }: { label: string; value: string; delta?: number | null; accent?: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
      <p className="text-[10px] uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`font-mono-data text-xl font-semibold ${accent ?? 'text-white'}`}>{value}</p>
      {delta !== undefined && delta !== null && (
        <p className={`text-[11px] font-medium ${delta > 0 ? 'text-red-400' : delta < 0 ? 'text-emerald-400' : 'text-gray-500'}`}>
          {delta > 0 ? '↑' : delta < 0 ? '↓' : '–'} {Math.abs(delta).toFixed(1)}% vs prior
        </p>
      )}
    </div>
  );
}
