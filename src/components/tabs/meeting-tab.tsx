"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Card, CardTitle } from "@/components/ui/card";
import { KpiCard, formatKpiPercent } from "@/components/ui/kpi-card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/components/dashboard/context";
import type { ClassifiedCall } from "@/lib/types";

const OUTCOME_LABELS: Record<string, string> = {
  meeting_agreed: "Встреча согласована",
  whatsapp_requested: "Просьба WhatsApp",
  callback_requested: "Перезвонить позже",
  client_refused: "Клиент отказался",
  bot_did_not_offer: "Бот не предложил",
  unclear: "Неясный исход",
};

export function MeetingTab() {
  const { filteredCalls, setSelectedCall } = useDashboard();
  const withDialogue = filteredCalls.filter((c) => c.hasDialogue);
  const offered = withDialogue.filter((c) => c.meetingOffered);
  const total = withDialogue.length || 1;

  const agreed = withDialogue.filter((c) => c.meetingAgreed).length;
  const whatsapp = withDialogue.filter((c) => c.meetingOutcome === "whatsapp_requested").length;
  const callback = withDialogue.filter((c) => c.meetingOutcome === "callback_requested").length;
  const refused = withDialogue.filter((c) => c.meetingOutcome === "client_refused").length;

  const repliesBeforeOffer = offered.map((c) => {
    const idx = c.turns.findIndex((t) => t.role === "bot" && t.text.toLowerCase().includes("встреч"));
    return idx >= 0 ? idx : c.turns.length;
  });
  const avgReplies = repliesBeforeOffer.length
    ? Math.round(repliesBeforeOffer.reduce((a, b) => a + b, 0) / repliesBeforeOffer.length)
    : 0;

  const problemCalls = withDialogue.filter(
    (c) => (c.offerReaction === "interest" || c.consent) && !c.meetingAgreed && !c.meetingOffered
  );

  const columns: ColumnDef<ClassifiedCall>[] = [
    { accessorKey: "phone", header: "Телефон" },
    { id: "outcome", header: "Исход", cell: ({ row }) => OUTCOME_LABELS[row.original.meetingOutcome] },
    { accessorKey: "dropOffStage", header: "Этап" },
    { accessorKey: "lastClientMessage", header: "Последняя реплика", cell: ({ row }) => <span className="max-w-[200px] truncate block text-xs">{row.original.lastClientMessage}</span> },
    { id: "open", header: "", cell: ({ row }) => <Button size="sm" variant="ghost" onClick={() => setSelectedCall(row.original)}>Открыть</Button> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard title="Встреча предложена" value={offered.length} description="Раз бот предложил" status="neutral" />
        <KpiCard title="Доля предложений" value={formatKpiPercent(offered.length / total)} description="От всех диалогов" status="neutral" />
        <KpiCard title="Согласие на встречу" value={formatKpiPercent(agreed / total)} description={`${agreed} диалогов`} status="good" />
        <KpiCard title="WhatsApp" value={formatKpiPercent(whatsapp / total)} description={`${whatsapp} диалогов`} status="warning" />
        <KpiCard title="Перезвонить" value={formatKpiPercent(callback / total)} description={`${callback} диалогов`} status="warning" />
        <KpiCard title="Отказы" value={formatKpiPercent(refused / total)} description={`${refused} диалогов`} status="bad" />
        <KpiCard title="Реплик до предложения" value={avgReplies} description="Среднее" status="neutral" />
      </div>

      <Card>
        <CardTitle>Интерес есть, встреча не согласована, бот не сделал шаг</CardTitle>
        <div className="mt-4">
          <DataTable data={problemCalls} columns={columns} />
        </div>
      </Card>
    </div>
  );
}
