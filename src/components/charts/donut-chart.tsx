"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS: Record<string, string> = {
  client_hangup: "#f43f5e",
  bot_hangup: "#f59e0b",
  "technical/other": "#94a3b8",
};

export function DonutChart({ data }: { data: { reason: string; count: number; category: string }[] }) {
  const aggregated: Record<string, number> = {};
  for (const d of data) {
    aggregated[d.category] = (aggregated[d.category] || 0) + d.count;
  }

  const chartData = Object.entries(aggregated).map(([name, value]) => ({ name, value }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name] || "#6366f1"} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
