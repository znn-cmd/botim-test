"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Card, CardTitle } from "@/components/ui/card";
import { KpiCard, formatKpiPercent } from "@/components/ui/kpi-card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/components/dashboard/context";
import type { ClassifiedCall } from "@/lib/types";
import { OBJECTION_LABELS } from "@/lib/types";

const REACTION_LABELS: Record<string, string> = {
  interest: "Интерес",
  neutral: "Нейтрально",
  no_time: "Нет времени",
  distrust: "Недоверие",
  rejection: "Отказ",
  confusion: "Непонимание",
  other: "Другое",
};

export function OfferTab() {
  const { filteredCalls, setSelectedCall } = useDashboard();
  const withDialogue = filteredCalls.filter((c) => c.hasDialogue);
  const reached = withDialogue.filter((c) => c.offerReached);
  const total = reached.length || 1;

  const hangupAfter = reached.filter((c) => c.hangupReason === "client_hangup" && !c.meetingOffered).length;
  const questions = reached.filter((c) => c.offerReaction === "neutral" || c.turns.some((t) => t.role === "client" && t.text.includes("?"))).length;
  const positive = reached.filter((c) => c.offerReaction === "interest").length;
  const rejected = reached.filter((c) => c.offerReaction === "rejection").length;

  const offerLengths = reached.map((c) => {
    const offerTurn = c.turns.find((t) => t.role === "bot" && t.text.length > 30);
    return offerTurn?.text.length || 0;
  }).filter((l) => l > 0);
  const avgOfferLen = offerLengths.length ? Math.round(offerLengths.reduce((a, b) => a + b, 0) / offerLengths.length) : 0;

  const objectionsAfterOffer = reached.filter((c) => c.objectionCategory).reduce<Record<string, number>>((acc, c) => {
    const key = c.objectionCategory!;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const problemCalls = reached.filter((c) => !c.meetingAgreed && c.hangupReason === "client_hangup");

  const columns: ColumnDef<ClassifiedCall>[] = [
    { accessorKey: "phone", header: "Телефон" },
    { accessorKey: "dropOffStage", header: "Этап" },
    { id: "reaction", header: "Реакция", cell: ({ row }) => REACTION_LABELS[row.original.offerReaction || "other"] },
    { accessorKey: "hangupReason", header: "Завершение" },
    { id: "open", header: "", cell: ({ row }) => <Button size="sm" variant="ghost" onClick={() => setSelectedCall(row.original)}>Открыть</Button> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard title="Дошли до оффера" value={reached.length} description="Диалогов" status="neutral" />
        <KpiCard title="Сброс после оффера" value={formatKpiPercent(hangupAfter / total)} description={`${hangupAfter} диалогов`} status="bad" />
        <KpiCard title="Уточняющие вопросы" value={formatKpiPercent(questions / total)} description={`${questions} диалогов`} status="neutral" />
        <KpiCard title="Позитивные реакции" value={formatKpiPercent(positive / total)} description={`${positive} диалогов`} status="good" />
        <KpiCard title="Отказы после оффера" value={formatKpiPercent(rejected / total)} description={`${rejected} диалогов`} status="warning" />
        <KpiCard title="Ср. длина оффера" value={`${avgOfferLen} симв.`} description="Символов" status="neutral" />
      </div>

      <Card>
        <CardTitle>Топ возражений после оффера</CardTitle>
        <ul className="mt-3 space-y-1 text-sm">
          {Object.entries(objectionsAfterOffer)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, count]) => (
              <li key={cat}>{OBJECTION_LABELS[cat as keyof typeof OBJECTION_LABELS]}: {count}</li>
            ))}
        </ul>
      </Card>

      <Card>
        <CardTitle>Оффер озвучен, встреча не достигнута, client_hangup</CardTitle>
        <div className="mt-4">
          <DataTable data={problemCalls} columns={columns} />
        </div>
      </Card>
    </div>
  );
}
