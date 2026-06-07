"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ExternalLink, MessageSquare } from "lucide-react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { KpiCard, formatKpiPercent } from "@/components/ui/kpi-card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { FunnelChart } from "@/components/charts/funnel-chart";
import { LossMapChart } from "@/components/charts/loss-map-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { useDashboard } from "@/components/dashboard/context";
import { getWeakestInsight } from "@/lib/metrics";
import { formatDuration, formatDateTime, getRateStatus } from "@/lib/utils";
import type { ObjectionStat, RecommendedCall } from "@/lib/types";

export function OverviewTab() {
  const { metrics, setSelectedCall } = useDashboard();
  const m = metrics;

  const kpis = [
    { title: "Всего звонков", value: m.totalCalls, desc: "Звонков в выборке", status: "neutral" as const, tooltip: "Общее количество звонков за период" },
    { title: "Уникальных контактов", value: m.uniqueContacts, desc: "Уникальные телефоны", status: "neutral" as const, tooltip: "Количество уникальных номеров" },
    { title: "Доля с диалогом", value: formatKpiPercent(m.dialogueRate), desc: "Звонки с расшифровкой", status: getRateStatus(m.dialogueRate, 0.6, 0.4), tooltip: "Звонки, где есть осмысленный диалог" },
    { title: "Технические потери", value: formatKpiPercent(m.technicalLossRate), desc: "Без диалога / тех. сбой", status: m.technicalLossRate < 0.2 ? "good" as const : m.technicalLossRate < 0.35 ? "warning" as const : "bad" as const, tooltip: "no_answer, busy, сброс до диалога" },
    { title: "Согласие на разговор", value: formatKpiPercent(m.consentRate), desc: `${m.consentCount} диалогов`, status: getRateStatus(m.consentRate, 0.5, 0.3), tooltip: "Клиент согласился продолжить разговор" },
    { title: "Дошли до оффера", value: formatKpiPercent(m.offerReachedRate), desc: `${m.offerReachedCount} диалогов`, status: getRateStatus(m.offerReachedRate, 0.4, 0.25), tooltip: "Бот озвучил предложение" },
    { title: "Встреча предложена", value: formatKpiPercent(m.meetingOfferedRate), desc: `${m.meetingOfferedCount} диалогов`, status: getRateStatus(m.meetingOfferedRate, 0.25, 0.15), tooltip: "Бот предложил встречу" },
    { title: "Встреча согласована", value: formatKpiPercent(m.meetingAgreedRate), desc: `${m.meetingAgreedCount} диалогов`, status: getRateStatus(m.meetingAgreedRate, 0.15, 0.08), tooltip: "Клиент согласился на встречу" },
    { title: "Квалификация завершена", value: formatKpiPercent(m.qualificationCompletedRate), desc: `${m.qualificationCompletedCount} диалогов`, status: getRateStatus(m.qualificationCompletedRate, 0.5, 0.3), tooltip: "Клиент ответил на квалификационные вопросы" },
    { title: "Слабый шаг воронки", value: m.weakestStageLabel, desc: "Максимальная потеря", status: "bad" as const, tooltip: "Этап с наибольшим drop-off" },
    { title: "Топ-возражение", value: m.topObjection?.label || "—", desc: m.topObjection ? `${m.topObjection.count} раз` : "Нет данных", status: m.topObjection ? "warning" as const : "neutral" as const, tooltip: "Самое частое возражение клиента" },
    { title: "Dialogue Progress Score", value: m.avgDialogueProgressScore.toFixed(1), desc: "Средний score 0–6", status: m.avgDialogueProgressScore >= 3 ? "good" as const : m.avgDialogueProgressScore >= 1.5 ? "warning" as const : "bad" as const, tooltip: "Средняя глубина прохождения воронки" },
  ];

  const objectionColumns: ColumnDef<ObjectionStat>[] = [
    { accessorKey: "label", header: "Возражение" },
    { accessorKey: "count", header: "Количество" },
    { accessorKey: "share", header: "Доля", cell: ({ row }) => formatKpiPercent(row.original.share) },
    { accessorKey: "stage", header: "Этап" },
    { accessorKey: "examplePhrase", header: "Пример фразы", cell: ({ row }) => <span className="max-w-xs truncate block">{row.original.examplePhrase}</span> },
  ];

  const recommendedColumns: ColumnDef<RecommendedCall>[] = [
    { id: "date", header: "Дата", accessorFn: (r) => r.call.dateTime.getTime(), cell: ({ row }) => formatDateTime(row.original.call.dateTime) },
    { accessorFn: (r) => r.call.phone, id: "phone", header: "Телефон" },
    { id: "duration", header: "Длительность", accessorFn: (r) => r.call.durationSec, cell: ({ row }) => formatDuration(row.original.call.durationSec) },
    { id: "stage", header: "Последний этап", accessorFn: (r) => r.call.dropOffStage },
    { id: "reason", header: "Причина завершения", accessorFn: (r) => r.call.hangupReason },
    { id: "loss", header: "Причина потери", accessorFn: (r) => r.reason },
    { id: "client", header: "Последняя реплика клиента", accessorFn: (r) => r.call.lastClientMessage, cell: ({ row }) => <span className="max-w-[200px] truncate block text-xs">{row.original.call.lastClientMessage}</span> },
    { id: "bot", header: "Последняя реплика бота", accessorFn: (r) => r.call.lastBotMessage, cell: ({ row }) => <span className="max-w-[200px] truncate block text-xs">{row.original.call.lastBotMessage}</span> },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex gap-1">
          {row.original.call.audioUrl && (
            <a href={row.original.call.audioUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <Button variant="ghost" size="sm" onClick={() => setSelectedCall(row.original.call)}>
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} title={kpi.title} value={kpi.value} description={kpi.desc} status={kpi.status} tooltip={kpi.tooltip} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Главная воронка</CardTitle>
          <CardDescription>Абсолютные значения и конверсия между этапами</CardDescription>
          <div className="mt-4">
            <FunnelChart data={m.funnel} />
          </div>
          <div className="mt-2 space-y-1">
            {m.funnel.map((step) => (
              <div key={step.key} className="flex justify-between text-xs text-slate-600">
                <span>{step.label}</span>
                <span>{step.count} · {formatKpiPercent(step.percentOfAll)} · {formatKpiPercent(step.percentOfPrevious)} от пред.</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle>Карта потерь</CardTitle>
          <CardDescription>Где теряются клиенты</CardDescription>
          <div className="mt-4">
            <LossMapChart data={m.lossMap} />
          </div>
        </Card>
      </div>

      <Card className="border-amber-200 bg-amber-50">
        <CardTitle>Главное слабое место недели</CardTitle>
        <p className="mt-2 text-sm leading-relaxed text-amber-900">{getWeakestInsight(m)}</p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Причины завершения</CardTitle>
          <DonutChart data={m.hangupReasons} />
        </Card>

        <Card>
          <CardTitle>Первый A/B-тест</CardTitle>
          <div className="mt-3 space-y-2 text-sm">
            <p><strong>Слабый этап:</strong> {m.abTest.weakStage}</p>
            <p><strong>Проблема:</strong> {m.abTest.problem}</p>
            <p><strong>Вариант A:</strong> {m.abTest.variantA}</p>
            <p><strong>Вариант B:</strong> {m.abTest.variantB}</p>
            <p><strong>Primary metric:</strong> {m.abTest.primaryMetric}</p>
            <p><strong>Guardrails:</strong> {m.abTest.guardrails.join(", ")}</p>
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle>Топ возражений</CardTitle>
        <div className="mt-4">
          <DataTable data={m.objections} columns={objectionColumns} emptyMessage="Возражения не обнаружены" />
        </div>
      </Card>

      <Card>
        <CardTitle>Разобрать в первую очередь</CardTitle>
        <CardDescription>Приоритетные диалоги для ручного разбора</CardDescription>
        <div className="mt-4">
          <DataTable data={m.recommendedCalls} columns={recommendedColumns} />
        </div>
      </Card>
    </div>
  );
}
