"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Card, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/components/dashboard/context";
import { formatKpiPercent } from "@/components/ui/kpi-card";
import type { ClassifiedCall, ObjectionStat } from "@/lib/types";

export function ObjectionsTab() {
  const { metrics, filteredCalls, setSelectedCall } = useDashboard();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const columns: ColumnDef<ObjectionStat>[] = [
    {
      id: "label",
      header: "Категория",
      accessorKey: "label",
      cell: ({ row }) => (
        <button className="text-indigo-600 hover:underline" onClick={() => setSelectedCategory(row.original.category)}>
          {row.original.label}
        </button>
      ),
    },
    { accessorKey: "count", header: "Количество" },
    { id: "share", header: "Доля", cell: ({ row }) => formatKpiPercent(row.original.share) },
    { accessorKey: "stage", header: "Этап" },
    { accessorKey: "examplePhrase", header: "Пример", cell: ({ row }) => <span className="max-w-[200px] truncate block text-xs">{row.original.examplePhrase}</span> },
  ];

  const categoryCalls = selectedCategory
    ? filteredCalls.filter((c) => c.objectionCategory === selectedCategory)
    : [];

  const searchedCalls = search
    ? filteredCalls.filter((c) => c.transcript.toLowerCase().includes(search.toLowerCase()))
    : categoryCalls;

  const callColumns: ColumnDef<ClassifiedCall>[] = [
    { accessorKey: "phone", header: "Телефон" },
    { accessorKey: "dropOffStage", header: "Этап" },
    { accessorKey: "lastClientMessage", header: "Фраза клиента", cell: ({ row }) => <span className="max-w-[250px] truncate block text-xs">{row.original.lastClientMessage}</span> },
    { id: "open", header: "", cell: ({ row }) => <Button size="sm" variant="ghost" onClick={() => setSelectedCall(row.original)}>Открыть</Button> },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>Классификация возражений</CardTitle>
        <div className="mt-4">
          <DataTable data={metrics.objections} columns={columns} />
        </div>
      </Card>

      <Card>
        <CardTitle>Поиск по тексту диалога</CardTitle>
        <input
          type="text"
          placeholder="Введите фразу для поиска..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setSelectedCategory(null); }}
          className="mt-3 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
        />
      </Card>

      {(selectedCategory || search) && (
        <Card>
          <CardTitle>
            {search ? `Результаты поиска: «${search}»` : `Диалоги: ${metrics.objections.find((o) => o.category === selectedCategory)?.label}`}
          </CardTitle>
          <div className="mt-4">
            <DataTable data={searchedCalls} columns={callColumns} />
          </div>
        </Card>
      )}
    </div>
  );
}
