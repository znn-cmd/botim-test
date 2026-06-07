"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardTitle } from "@/components/ui/card";
import { HeatmapChart } from "@/components/charts/heatmap-chart";
import { useDashboard } from "@/components/dashboard/context";
import { formatKpiPercent } from "@/components/ui/kpi-card";
import { isValidDate, safeFormatDate } from "@/lib/utils";

export function TimeTab() {
  const { filteredCalls } = useDashboard();

  const byHour: Record<number, { total: number; consent: number; meeting: number; hangup: number; duration: number }> = {};
  for (let h = 0; h < 24; h++) byHour[h] = { total: 0, consent: 0, meeting: 0, hangup: 0, duration: 0 };

  for (const c of filteredCalls) {
    if (!isValidDate(c.dateTime)) continue;
    const h = c.dateTime.getHours();
    byHour[h].total++;
    if (c.consent) byHour[h].consent++;
    if (c.meetingAgreed) byHour[h].meeting++;
    if (c.hangupReason.includes("client_hangup")) byHour[h].hangup++;
    byHour[h].duration += c.durationSec;
  }

  const hourlyData = Object.entries(byHour).map(([hour, d]) => ({
    hour: `${hour}:00`,
    calls: d.total,
    consentRate: d.total ? Math.round((d.consent / d.total) * 100) : 0,
    meetingRate: d.total ? Math.round((d.meeting / d.total) * 100) : 0,
    hangup: d.hangup,
    avgDuration: d.total ? Math.round(d.duration / d.total) : 0,
  }));

  const byDay: Record<string, number> = {};
  for (const c of filteredCalls) {
    if (!isValidDate(c.dateTime)) continue;
    const day = safeFormatDate(c.dateTime, "dd MMM");
    byDay[day] = (byDay[day] || 0) + 1;
  }
  const dailyData = Object.entries(byDay).map(([date, count]) => ({ date, count }));

  const segments = [
    { label: "Первый звонок", count: filteredCalls.filter((c) => c.isFirstCall).length },
    { label: "Повторный звонок", count: filteredCalls.filter((c) => !c.isFirstCall).length },
    { label: "Короткие (<15 сек)", count: filteredCalls.filter((c) => c.durationSec < 15).length },
    { label: "Длинные (>60 сек)", count: filteredCalls.filter((c) => c.durationSec > 60).length },
    { label: "С диалогом", count: filteredCalls.filter((c) => c.hasDialogue).length },
    { label: "Без диалога", count: filteredCalls.filter((c) => !c.hasDialogue).length },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Звонки по дням</CardTitle>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardTitle>Звонки по часам</CardTitle>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="calls" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardTitle>Consent rate по часам</CardTitle>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                <YAxis unit="%" />
                <Tooltip />
                <Bar dataKey="consentRate" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardTitle>client_hangup по часам</CardTitle>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="hangup" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle>Heatmap: meeting agreed rate</CardTitle>
        <div className="mt-4">
          <HeatmapChart calls={filteredCalls} metric="meeting" />
        </div>
      </Card>

      <Card>
        <CardTitle>Сегменты</CardTitle>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {segments.map((s) => (
            <div key={s.label} className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm text-slate-500">{s.label}</p>
              <p className="text-xl font-bold">{s.count} <span className="text-sm font-normal text-slate-500">({formatKpiPercent(s.count / (filteredCalls.length || 1))})</span></p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
