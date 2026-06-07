"use client";

import { useState, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Download, MessageSquare } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/components/dashboard/context";
import { exportCallsToCSV } from "@/lib/parser";
import { formatDateTime, formatDuration } from "@/lib/utils";
import { OBJECTION_LABELS } from "@/lib/types";
import type { ClassifiedCall } from "@/lib/types";

export function DialoguesTab() {
  const { filteredCalls, setSelectedCall } = useDashboard();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [objectionFilter, setObjectionFilter] = useState("all");
  const [meetingFilter, setMeetingFilter] = useState("all");
  const [qualFilter, setQualFilter] = useState("all");
  const [durationFilter, setDurationFilter] = useState("all");

  const data = useMemo(() => {
    return filteredCalls.filter((c) => {
      if (search && !c.transcript.toLowerCase().includes(search.toLowerCase()) && !c.phone.includes(search)) return false;
      if (stageFilter !== "all" && c.lastReachedStage !== stageFilter) return false;
      if (reasonFilter !== "all" && c.hangupReason !== reasonFilter) return false;
      if (objectionFilter !== "all" && c.objectionCategory !== objectionFilter) return false;
      if (meetingFilter === "yes" && !c.meetingAgreed) return false;
      if (meetingFilter === "no" && c.meetingAgreed) return false;
      if (qualFilter === "yes" && !c.qualificationCompleted) return false;
      if (qualFilter === "no" && c.qualificationCompleted) return false;
      if (durationFilter === "short" && c.durationSec >= 15) return false;
      if (durationFilter === "long" && c.durationSec <= 60) return false;
      return true;
    });
  }, [filteredCalls, search, stageFilter, reasonFilter, objectionFilter, meetingFilter, qualFilter, durationFilter]);

  const columns: ColumnDef<ClassifiedCall>[] = [
    { id: "date", header: "Дата", accessorFn: (r) => r.dateTime.getTime(), cell: ({ row }) => formatDateTime(row.original.dateTime) },
    { accessorKey: "phone", header: "Телефон" },
    { id: "dur", header: "Длительность", accessorFn: (r) => r.durationSec, cell: ({ row }) => formatDuration(row.original.durationSec) },
    { accessorKey: "status", header: "Статус" },
    { accessorKey: "hangupReason", header: "Причина" },
    { accessorKey: "dropOffStage", header: "Этап" },
    { accessorKey: "dialogueProgressScore", header: "Score" },
    { id: "objection", header: "Возражение", cell: ({ row }) => row.original.objectionCategory ? OBJECTION_LABELS[row.original.objectionCategory] : "—" },
    {
      id: "audio",
      header: "Аудио",
      cell: ({ row }) => row.original.audioUrl ? (
        <a href={row.original.audioUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 text-xs hover:underline">Ссылка</a>
      ) : "—",
    },
    {
      id: "open",
      header: "",
      cell: ({ row }) => (
        <Button size="sm" variant="ghost" onClick={() => setSelectedCall(row.original)}>
          <MessageSquare className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const handleExport = () => {
    const csv = exportCallsToCSV(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `botamin-dialogues-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reasons = [...new Set(filteredCalls.map((c) => c.hangupReason).filter(Boolean))];

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Все диалоги ({data.length})</CardTitle>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Экспорт CSV
          </Button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="text"
            placeholder="Поиск по тексту / телефону"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="all">Все этапы</option>
            <option value="consent">Согласие</option>
            <option value="offer_reached">Оффер</option>
            <option value="meeting_offered">Встреча предложена</option>
            <option value="meeting_agreed">Встреча согласована</option>
            <option value="qualification_completed">Квалификация</option>
          </select>
          <select value={reasonFilter} onChange={(e) => setReasonFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="all">Все причины</option>
            {reasons.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={objectionFilter} onChange={(e) => setObjectionFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="all">Все возражения</option>
            {Object.entries(OBJECTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={meetingFilter} onChange={(e) => setMeetingFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="all">Встреча: все</option>
            <option value="yes">С встречей</option>
            <option value="no">Без встречи</option>
          </select>
          <select value={qualFilter} onChange={(e) => setQualFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="all">Квалификация: все</option>
            <option value="yes">Завершена</option>
            <option value="no">Не завершена</option>
          </select>
          <select value={durationFilter} onChange={(e) => setDurationFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="all">Длительность: все</option>
            <option value="short">Короткие (&lt;15 сек)</option>
            <option value="long">Длинные (&gt;60 сек)</option>
          </select>
        </div>

        <div className="mt-4">
          <DataTable data={data} columns={columns} stickyHeader />
        </div>
      </Card>
    </div>
  );
}
