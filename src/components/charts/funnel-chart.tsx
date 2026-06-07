"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { FunnelStep } from "@/lib/types";
import { formatPercent } from "@/lib/utils";

const COLORS = ["#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe", "#ddd6fe", "#e0e7ff", "#eef2ff"];

export function FunnelChart({ data }: { data: FunnelStep[] }) {
  const chartData = data.map((step, i) => ({
    name: step.label,
    count: step.count,
    percentOfAll: step.percentOfAll,
    percentOfPrevious: step.percentOfPrevious,
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 120, right: 20 }}>
          <XAxis type="number" />
          <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value, _name, props) => {
              const p = props.payload as { percentOfAll: number; percentOfPrevious: number };
              return [
                `${value} (${formatPercent(p.percentOfAll)} от всех, ${formatPercent(p.percentOfPrevious)} от пред.)`,
                "Количество",
              ];
            }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
