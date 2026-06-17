import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useZoneTrend } from '../hooks/useZoneTrend';

interface TrendChartProps {
  zoneId: number;
}

export function TrendChart({ zoneId }: TrendChartProps) {
  const { trend, loading, error } = useZoneTrend(zoneId);

  if (loading) return <div className="h-44 w-full animate-pulse rounded-lg bg-white/5" />;
  if (error || !trend || trend.monthly.length === 0) {
    return <p className="text-sm text-gray-500">No historical trend available for this zone.</p>;
  }

  const data = trend.monthly.map((m) => ({ month: m.month, count: m.violation_count }));
  const first = data[0]?.count ?? 0;
  const last = data[data.length - 1]?.count ?? 0;
  const trendDirection = last > first ? 'worsening' : last < first ? 'improving' : 'stable';
  const trendColor = trendDirection === 'worsening' ? 'text-red-300' : trendDirection === 'improving' ? 'text-emerald-300' : 'text-gray-400';

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wide text-gray-500">Nov 2023 – Apr 2024</span>
        <span className={`text-[11px] font-medium capitalize ${trendColor}`}>{trendDirection}</span>
      </div>
      <div className="h-44 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 20, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#6b7280' }} angle={-35} textAnchor="end" height={36} />
            <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} width={32} />
            <Tooltip contentStyle={{ background: '#0c0f18', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="url(#trendBarGradient)" />
            <defs>
              <linearGradient id="trendBarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
