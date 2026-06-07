"use client";

import type { ClassifiedCall } from "@/lib/types";
import { formatPercent, isValidDate } from "@/lib/utils";

const DAYS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function HeatmapChart({ calls, metric }: { calls: ClassifiedCall[]; metric: "consent" | "meeting" }) {
  const grid: Record<string, { total: number; success: number }> = {};

  for (const call of calls.filter((c) => c.hasDialogue && isValidDate(c.dateTime))) {
    const day = call.dateTime.getDay();
    const hour = call.dateTime.getHours();
    const key = `${day}-${hour}`;
    if (!grid[key]) grid[key] = { total: 0, success: 0 };
    grid[key].total++;
    if (metric === "consent" && call.consent) grid[key].success++;
    if (metric === "meeting" && call.meetingAgreed) grid[key].success++;
  }

  const getRate = (day: number, hour: number) => {
    const cell = grid[`${day}-${hour}`];
    if (!cell || cell.total === 0) return null;
    return cell.success / cell.total;
  };

  const getColor = (rate: number | null) => {
    if (rate === null) return "bg-slate-50";
    if (rate >= 0.5) return "bg-emerald-400";
    if (rate >= 0.3) return "bg-amber-300";
    if (rate >= 0.1) return "bg-orange-200";
    return "bg-rose-200";
  };

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div className="flex gap-0.5">
          <div className="w-8" />
          {HOURS.map((h) => (
            <div key={h} className="w-8 text-center text-[10px] text-slate-500">{h}</div>
          ))}
        </div>
        {DAYS.map((dayLabel, dayIdx) => (
          <div key={dayIdx} className="flex gap-0.5">
            <div className="flex w-8 items-center text-[10px] text-slate-500">{dayLabel}</div>
            {HOURS.map((hour) => {
              const rate = getRate(dayIdx, hour);
              return (
                <div
                  key={hour}
                  title={rate !== null ? formatPercent(rate) : "Нет данных"}
                  className={`h-6 w-8 rounded-sm ${getColor(rate)}`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
        <span>Низкий</span>
        <div className="h-3 w-6 rounded bg-rose-200" />
        <div className="h-3 w-6 rounded bg-amber-300" />
        <div className="h-3 w-6 rounded bg-emerald-400" />
        <span>Высокий</span>
      </div>
    </div>
  );
}
