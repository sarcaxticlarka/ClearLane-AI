import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useForecast } from '../hooks/useForecast';

interface ForecastChartProps {
  zoneId: number;
}

export function ForecastChart({ zoneId }: ForecastChartProps) {
  const { forecast, loading, error } = useForecast(zoneId);

  if (loading) return <div className="h-48 w-full animate-pulse rounded-lg bg-white/5" />;
  if (error || !forecast) return <p className="text-sm text-gray-500">No 48h forecast available for this zone.</p>;

  const data = forecast.forecast.map((p) => {
    const d = new Date(p.ds);
    return {
      time: `${d.getDate()} ${d.toLocaleString(undefined, { month: 'short' })} ${String(d.getHours()).padStart(2, '0')}:00`,
      yhat: p.yhat,
      yhat_upper: p.yhat_upper,
    };
  });
  // Show ~6 evenly-spaced ticks regardless of how many forecast points there are,
  // so labels never crowd/overlap each other at the bottom of the chart.
  const tickInterval = Math.max(0, Math.ceil(data.length / 6) - 1);

  return (
    <div className="h-52 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 24, left: -16 }}>
          <defs>
            <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#a855f7" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 9, fill: '#6b7280' }}
            interval={tickInterval}
            angle={-35}
            textAnchor="end"
            height={40}
          />
          <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} width={32} />
          <Tooltip contentStyle={{ background: '#0c0f18', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12, borderRadius: 8 }} />
          <Area type="monotone" dataKey="yhat_upper" stroke="none" fill="#a855f7" fillOpacity={0.08} />
          <Area type="monotone" dataKey="yhat" stroke="#22d3ee" strokeWidth={2} fill="url(#forecastGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
