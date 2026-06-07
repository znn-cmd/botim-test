"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Card, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/components/dashboard/context";
import { formatDuration } from "@/lib/utils";
import { formatKpiPercent } from "@/components/ui/kpi-card";
import type { ClassifiedCall, DropOffStat } from "@/lib/types";

export function DropoffsTab() {
  const { metrics, filteredCalls, setSelectedCall } = useDashboard();
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  const dropColumns: ColumnDef<DropOffStat>[] = [
    {
      id: "stage",
      header: "Этап",
      accessorKey: "label",
      cell: ({ row }) => (
        <button className="text-indigo-600 hover:underline" onClick={() => setSelectedStage(row.original.stage)}>
          {row.original.label}
        </button>
      ),
    },
    { accessorKey: "count", header: "Потерь" },
    { id: "share", header: "Доля", cell: ({ row }) => formatKpiPercent(row.original.share) },
    { id: "dur", header: "Ср. длительность", cell: ({ row }) => formatDuration(Math.round(row.original.avgDurationSec)) },
    { accessorKey: "topReason", header: "Топ причина" },
    { accessorKey: "topClientPhrase", header: "Топ фраза клиента", cell: ({ row }) => <span className="max-w-[180px] truncate block text-xs">{row.original.topClientPhrase}</span> },
    { accessorKey: "topBotPhrase", header: "Топ реплика бота", cell: ({ row }) => <span className="max-w-[180px] truncate block text-xs">{row.original.topBotPhrase}</span> },
  ];

  const stageCalls = selectedStage
    ? filteredCalls.filter((c) => c.lastReachedStage === selectedStage || c.dropOffStage === metrics.dropOffByStage.find((d) => d.stage === selectedStage)?.label)
    : [];

  const callColumns: ColumnDef<ClassifiedCall>[] = [
    { id: "phone", accessorKey: "phone", header: "Телефон" },
    { id: "stage", accessorKey: "dropOffStage", header: "Этап" },
    { id: "client", accessorKey: "lastClientMessage", header: "Последняя реплика клиента", cell: ({ row }) => <span className="max-w-[200px] truncate block text-xs">{row.original.lastClientMessage}</span> },
    { id: "bot", accessorKey: "lastBotMessage", header: "Последняя реплика бота", cell: ({ row }) => <span className="max-w-[200px] truncate block text-xs">{row.original.lastBotMessage}</span> },
    { accessorKey: "hangupReason", header: "Причина" },
    { id: "dur", header: "Длительность", cell: ({ row }) => formatDuration(row.original.durationSec) },
    { id: "open", header: "", cell: ({ row }) => <Button size="sm" variant="ghost" onClick={() => setSelectedCall(row.original)}>Открыть</Button> },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>Точки потерь</CardTitle>
        <div className="mt-4">
          <DataTable data={metrics.dropOffByStage} columns={dropColumns} />
        </div>
      </Card>

      {selectedStage && (
        <Card>
          <CardTitle>
            Диалоги на этапе: {metrics.dropOffByStage.find((d) => d.stage === selectedStage)?.label}
            <Button variant="ghost" size="sm" className="ml-2" onClick={() => setSelectedStage(null)}>Закрыть</Button>
          </CardTitle>
          <div className="mt-4">
            <DataTable data={stageCalls} columns={callColumns} emptyMessage="Нет диалогов на этом этапе" />
          </div>
        </Card>
      )}
    </div>
  );
}
