'use client';

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// Mock data for demo - will wire to real data later
const MOCK_DATA = [
  { date: 'Mar 12', tokens: 1.2, cost: 16.80 },
  { date: 'Mar 13', tokens: 0.8, cost: 11.20 },
  { date: 'Mar 14', tokens: 2.1, cost: 29.40 },
  { date: 'Mar 15', tokens: 1.5, cost: 21.00 },
  { date: 'Mar 16', tokens: 0.9, cost: 12.60 },
  { date: 'Mar 17', tokens: 1.8, cost: 25.20 },
  { date: 'Mar 18', tokens: 2.4, cost: 33.60 },
];

export function UsageChart() {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={MOCK_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94A3B8', fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94A3B8', fontSize: 12 }}
            tickFormatter={(value) => `${value}M`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#F8FAFC',
            }}
            labelStyle={{ color: '#94A3B8' }}
            formatter={(value, name) => {
              const numericValue = typeof value === 'number' ? value : Number(value ?? 0);
              return [
                name === 'tokens' ? `${numericValue}M tokens` : `$${numericValue.toFixed(2)}`,
                name === 'tokens' ? 'Tokens' : 'Cost',
              ];
            }}
          />
          <Area
            type="monotone"
            dataKey="tokens"
            stroke="#22C55E"
            strokeWidth={2}
            fill="url(#tokenGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CostBreakdown() {
  const totalCost = MOCK_DATA.reduce((sum, d) => sum + d.cost, 0);
  const avgDaily = totalCost / MOCK_DATA.length;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
        <p className="text-sm text-slate-400">Total (7 days)</p>
        <p className="mt-1 text-2xl font-semibold text-emerald-400">${totalCost.toFixed(2)}</p>
      </div>
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
        <p className="text-sm text-slate-400">Daily average</p>
        <p className="mt-1 text-2xl font-semibold">${avgDaily.toFixed(2)}</p>
      </div>
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
        <p className="text-sm text-slate-400">Projected (30 days)</p>
        <p className="mt-1 text-2xl font-semibold">${(avgDaily * 30).toFixed(2)}</p>
      </div>
    </div>
  );
}
