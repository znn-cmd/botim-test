"use client";

import { Card, CardTitle } from "@/components/ui/card";
import { KpiCard, formatKpiPercent } from "@/components/ui/kpi-card";
import { useDashboard } from "@/components/dashboard/context";

export function QualificationTab() {
  const { filteredCalls } = useDashboard();
  const started = filteredCalls.filter((c) => c.qualificationStarted);
  const completed = filteredCalls.filter((c) => c.qualificationCompleted);
  const total = started.length || 1;

  const allQuestions: Record<string, { reached: number; answered: number; dropped: number; examples: string[] }> = {};

  for (const call of started) {
    for (const q of call.qualificationQuestions) {
      const key = q.question.slice(0, 60);
      if (!allQuestions[key]) allQuestions[key] = { reached: 0, answered: 0, dropped: 0, examples: [] };
      allQuestions[key].reached++;
      if (q.answered) allQuestions[key].answered++;
      if (q.dropped) {
        allQuestions[key].dropped++;
        if (call.lastClientMessage) allQuestions[key].examples.push(call.lastClientMessage.slice(0, 80));
      }
    }
  }

  const questionRows = Object.entries(allQuestions)
    .map(([question, data]) => ({
      question,
      ...data,
      dropRate: data.reached ? data.dropped / data.reached : 0,
    }))
    .sort((a, b) => b.dropRate - a.dropRate);

  const avgQuestions = started.length
    ? started.reduce((s, c) => s + c.qualificationQuestions.length, 0) / started.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Дошли до квалификации" value={started.length} description="Диалогов" status="neutral" />
        <KpiCard title="Завершили" value={completed.length} description="Диалогов" status="good" />
        <KpiCard title="Неполные" value={formatKpiPercent((started.length - completed.length) / total)} description={`${started.length - completed.length} диалогов`} status="warning" />
        <KpiCard title="Ср. кол-во вопросов" value={avgQuestions.toFixed(1)} description="На диалог" status="neutral" />
      </div>

      <Card>
        <CardTitle>Квалификационные вопросы</CardTitle>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left">Вопрос</th>
                <th className="px-4 py-2 text-right">Дошли</th>
                <th className="px-4 py-2 text-right">Ответили</th>
                <th className="px-4 py-2 text-right">Потеря</th>
                <th className="px-4 py-2 text-right">% потери</th>
                <th className="px-4 py-2 text-left">Пример отказа</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {questionRows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">Квалификационные вопросы не обнаружены в данных</td></tr>
              ) : (
                questionRows.map((row) => (
                  <tr key={row.question}>
                    <td className="max-w-xs truncate px-4 py-2">{row.question}</td>
                    <td className="px-4 py-2 text-right">{row.reached}</td>
                    <td className="px-4 py-2 text-right">{row.answered}</td>
                    <td className="px-4 py-2 text-right">{row.dropped}</td>
                    <td className="px-4 py-2 text-right text-rose-600">{formatKpiPercent(row.dropRate)}</td>
                    <td className="max-w-[200px] truncate px-4 py-2 text-xs">{row.examples[0] || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
