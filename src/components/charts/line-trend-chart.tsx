"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import type { ClassifiedCall } from "@/lib/types";
import { isValidDate, safeFormatDate } from "@/lib/utils";

interface LineTrendChartProps {
  calls: ClassifiedCall[];
  metrics: ("consent" | "offer" | "meeting" | "qualification")[];
}

const METRIC_CONFIG = {
  consent: { key: "consentRate", label: "Consent rate", color: "#6366f1", fn: (c: ClassifiedCall) => c.consent },
  offer: { key: "offerRate", label: "Offer reached", color: "#10b981", fn: (c: ClassifiedCall) => c.offerReached },
  meeting: { key: "meetingRate", label: "Meeting agreed", color: "#f59e0b", fn: (c: ClassifiedCall) => c.meetingAgreed },
  qualification: { key: "qualRate", label: "Qualification done", color: "#8b5cf6", fn: (c: ClassifiedCall) => c.qualificationCompleted },
};

export function LineTrendChart({ calls, metrics }: LineTrendChartProps) {
  const byDay: Record<string, ClassifiedCall[]> = {};
  for (const call of calls) {
    if (!isValidDate(call.dateTime)) continue;
    const day = safeFormatDate(call.dateTime, "yyyy-MM-dd");
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(call);
  }

  const chartData = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, dayCalls]) => {
      const dialogue = dayCalls.filter((c) => c.hasDialogue);
      const base = dialogue.length || 1;
      const row: Record<string, string | number> = {
        date: safeFormatDate(new Date(day), "dd MMM"),
      };
      for (const m of metrics) {
        const cfg = METRIC_CONFIG[m];
        row[cfg.key] = Math.round((dialogue.filter(cfg.fn).length / base) * 100);
      }
      return row;
    });

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis unit="%" domain={[0, 100]} />
          <Tooltip formatter={(v) => [`${v}%`, ""]} />
          <Legend />
          {metrics.map((m) => {
            const cfg = METRIC_CONFIG[m];
            return <Line key={m} type="monotone" dataKey={cfg.key} name={cfg.label} stroke={cfg.color} strokeWidth={2} dot={{ r: 4 }} />;
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
