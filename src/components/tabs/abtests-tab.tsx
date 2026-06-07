"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Card, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDashboard } from "@/components/dashboard/context";
import type { ClassifiedCall } from "@/lib/types";

const TEMPLATES = [
  {
    stage: "Приветствие",
    problem: "Много сбросов до согласия",
    variantB: "«Здравствуйте, это AI-ассистент Botamin. Удобно 20 секунд — скажу, по какому поводу звоню?»",
    primary: "consent rate",
    guardrails: ["client_hangup", "негативные реакции", "offer reached rate"],
  },
  {
    stage: "Оффер",
    problem: "Клиент сбрасывает после длинного оффера",
    variantB: "Оффер до 15 секунд, одна ключевая выгода, вопрос: «Есть смысл коротко обсудить?»",
    primary: "offer-to-meeting conversion",
    guardrails: ["«не понял»", "«неинтересно»", "client_hangup after offer"],
  },
  {
    stage: "Встреча",
    problem: "Бот доносит оффер, но не переводит в следующий шаг",
    variantB: "Мягкий следующий шаг: короткий созвон / WhatsApp без обязательства",
    primary: "meeting agreed rate",
    guardrails: ["отказ от встречи", "негатив", "qualification started rate"],
  },
  {
    stage: "Квалификация",
    problem: "Клиент отваливается на вопросах",
    variantB: "Сначала лёгкие вопросы, чувствительные позже, часть — после согласия на встречу",
    primary: "qualification completed rate",
    guardrails: ["meeting agreed rate", "client_hangup during qualification"],
  },
];

export function AbTestsTab() {
  const { metrics, filteredCalls, setSelectedCall } = useDashboard();
  const ab = metrics.abTest;

  const supportingCalls = filteredCalls.filter((c) => ab.supportingCallIds.includes(c.id));

  const columns: ColumnDef<ClassifiedCall>[] = [
    { accessorKey: "phone", header: "Телефон" },
    { accessorKey: "dropOffStage", header: "Этап" },
    { accessorKey: "lossReason", header: "Причина потери" },
    { accessorKey: "lastClientMessage", header: "Фраза клиента", cell: ({ row }) => <span className="max-w-[200px] truncate block text-xs">{row.original.lastClientMessage}</span> },
    { id: "open", header: "", cell: ({ row }) => <Button size="sm" variant="ghost" onClick={() => setSelectedCall(row.original)}>Открыть</Button> },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-indigo-200 bg-indigo-50">
        <div className="flex items-center gap-2">
          <CardTitle>Рекомендованный A/B-тест</CardTitle>
          <Badge variant="warning">Приоритет #1</Badge>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 text-sm">
            <p><strong>Слабый этап:</strong> {ab.weakStage}</p>
            <p><strong>Проблема:</strong> {ab.problem}</p>
            <p><strong>Метрика:</strong> {ab.metricToImprove}</p>
            <p><strong>Primary metric:</strong> {ab.primaryMetric}</p>
            <p><strong>Secondary metric:</strong> {ab.secondaryMetric}</p>
            <p><strong>Объём выборки:</strong> ~{ab.sampleSize} звонков на вариант</p>
          </div>
          <div className="space-y-2 text-sm">
            <p><strong>Вариант A:</strong> {ab.variantA}</p>
            <p><strong>Вариант B:</strong> {ab.variantB}</p>
            <p><strong>Guardrails:</strong></p>
            <ul className="list-inside list-disc text-slate-600">
              {ab.guardrails.map((g) => <li key={g}>{g}</li>)}
            </ul>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>Диалоги-основания для гипотезы</CardTitle>
        <div className="mt-4">
          <DataTable data={supportingCalls} columns={columns} emptyMessage="Нет диалогов" />
        </div>
      </Card>

      <Card>
        <CardTitle>Шаблоны гипотез</CardTitle>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {TEMPLATES.map((t) => (
            <div key={t.stage} className="rounded-lg border border-slate-200 p-4">
              <h4 className="font-semibold text-slate-900">{t.stage}</h4>
              <p className="mt-1 text-sm text-slate-600">{t.problem}</p>
              <p className="mt-2 text-sm"><strong>B:</strong> {t.variantB}</p>
              <p className="mt-1 text-xs text-slate-500">Primary: {t.primary}</p>
              <p className="text-xs text-slate-500">Guardrails: {t.guardrails.join(", ")}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
