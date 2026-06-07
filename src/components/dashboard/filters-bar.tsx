"use client";

import { RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboard } from "./context";
import { getUniqueValues } from "@/lib/filters";
import { formatDateTime } from "@/lib/utils";

export function FiltersBar() {
  const { allCalls, filteredCalls, filters, setFilters, resetFilters, lastUploadAt } = useDashboard();
  const statuses = getUniqueValues(allCalls, "status");
  const reasons = getUniqueValues(allCalls, "hangupReason");

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Период с</label>
          <input
            type="date"
            value={filters.dateFrom ? filters.dateFrom.toISOString().split("T")[0] : ""}
            onChange={(e) => setFilters({ dateFrom: e.target.value ? new Date(e.target.value) : null })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Период по</label>
          <input
            type="date"
            value={filters.dateTo ? filters.dateTo.toISOString().split("T")[0] : ""}
            onChange={(e) => setFilters({ dateTo: e.target.value ? new Date(e.target.value) : null })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Статус</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ status: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">Все</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Причина завершения</label>
          <select
            value={filters.hangupReason}
            onChange={(e) => setFilters({ hangupReason: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">Все</option>
            {reasons.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Поиск по телефону</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="+7***"
              value={filters.phoneSearch}
              onChange={(e) => setFilters({ phoneSearch: e.target.value })}
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
            />
          </div>
        </div>
        <div className="flex items-end">
          <Button variant="outline" size="sm" onClick={resetFilters} className="w-full">
            <RotateCcw className="h-4 w-4" />
            Сбросить
          </Button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <span>Строк в выборке: <strong className="text-slate-800">{filteredCalls.length}</strong></span>
        {lastUploadAt && (
          <span>Последняя загрузка: <strong className="text-slate-800">{formatDateTime(lastUploadAt)}</strong></span>
        )}
      </div>
    </div>
  );
}
