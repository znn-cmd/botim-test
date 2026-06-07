"use client";

import { Card, CardTitle } from "@/components/ui/card";
import { FunnelChart } from "@/components/charts/funnel-chart";
import { LineTrendChart } from "@/components/charts/line-trend-chart";
import { useDashboard } from "@/components/dashboard/context";
import { formatKpiPercent } from "@/components/ui/kpi-card";

export function FunnelTab() {
  const { metrics, filteredCalls } = useDashboard();

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>Подробная сценарная воронка</CardTitle>
        <div className="mt-4">
          <FunnelChart data={metrics.detailedFunnel} />
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left">Этап</th>
                <th className="px-4 py-2 text-right">Кол-во</th>
                <th className="px-4 py-2 text-right">% от всех</th>
                <th className="px-4 py-2 text-right">% от пред.</th>
                <th className="px-4 py-2 text-right">Потери</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metrics.detailedFunnel.map((step) => (
                <tr key={step.key}>
                  <td className="px-4 py-2">{step.label}</td>
                  <td className="px-4 py-2 text-right">{step.count}</td>
                  <td className="px-4 py-2 text-right">{formatKpiPercent(step.percentOfAll)}</td>
                  <td className="px-4 py-2 text-right">{formatKpiPercent(step.percentOfPrevious)}</td>
                  <td className="px-4 py-2 text-right text-rose-600">{step.losses}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardTitle>Динамика конверсий по дням</CardTitle>
        <LineTrendChart calls={filteredCalls} metrics={["consent", "offer", "meeting", "qualification"]} />
      </Card>
    </div>
  );
}
