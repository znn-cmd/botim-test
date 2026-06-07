"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardTitle } from "@/components/ui/card";
import { KpiCard, formatKpiPercent } from "@/components/ui/kpi-card";
import { useDashboard } from "@/components/dashboard/context";
import { formatDuration, isValidDate, safeFormatDate } from "@/lib/utils";

export function TechnicalTab() {
  const { metrics, filteredCalls } = useDashboard();
  const m = metrics;

  const durationBuckets = [
    { range: "0–5 сек", count: filteredCalls.filter((c) => c.durationSec < 5).length },
    { range: "5–15 сек", count: filteredCalls.filter((c) => c.durationSec >= 5 && c.durationSec < 15).length },
    { range: "15–30 сек", count: filteredCalls.filter((c) => c.durationSec >= 15 && c.durationSec < 30).length },
    { range: "30–60 сек", count: filteredCalls.filter((c) => c.durationSec >= 30 && c.durationSec < 60).length },
    { range: "60+ сек", count: filteredCalls.filter((c) => c.durationSec >= 60).length },
  ];

  const byDay: Record<string, { total: number; clientHangup: number; botHangup: number }> = {};
  for (const c of filteredCalls) {
    if (!isValidDate(c.dateTime)) continue;
    const day = safeFormatDate(c.dateTime, "dd MMM");
    if (!byDay[day]) byDay[day] = { total: 0, clientHangup: 0, botHangup: 0 };
    byDay[day].total++;
    if (c.hangupReason.includes("client_hangup")) byDay[day].clientHangup++;
    if (c.hangupReason.includes("bot_hangup")) byDay[day].botHangup++;
  }
  const dailyData = Object.entries(byDay).map(([date, d]) => ({ date, ...d }));

  const statusCounts: Record<string, number> = {};
  for (const c of filteredCalls) {
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
  }
  const statusData = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Всего звонков" value={m.totalCalls} description="В выборке" status="neutral" />
        <KpiCard title="Уникальных контактов" value={m.uniqueContacts} description="Телефоны" status="neutral" />
        <KpiCard title="Повторных звонков" value={m.repeatedCalls} description="Повторы по базе" status="neutral" />
        <KpiCard title="С расшифровкой" value={formatKpiPercent(m.transcriptRate)} description={`${m.callsWithTranscript} звонков`} status="neutral" />
        <KpiCard title="Без расшифровки" value={formatKpiPercent(1 - m.transcriptRate)} description="Пустые диалоги" status="warning" />
        <KpiCard title="Средняя длительность" value={formatDuration(Math.round(m.avgDurationSec))} description="Среднее" status="neutral" />
        <KpiCard title="Медианная длительность" value={formatDuration(Math.round(m.medianDurationSec))} description="Медиана" status="neutral" />
        <KpiCard title="До 5 секунд" value={formatKpiPercent(m.shortCallsUnder5Sec / (m.totalCalls || 1))} description={`${m.shortCallsUnder5Sec} звонков`} status="warning" />
        <KpiCard title="До 10 секунд" value={formatKpiPercent(m.shortCallsUnder10Sec / (m.totalCalls || 1))} description={`${m.shortCallsUnder10Sec} звонков`} status="warning" />
        <KpiCard title="До 15 секунд" value={formatKpiPercent(m.shortCallsUnder15Sec / (m.totalCalls || 1))} description={`${m.shortCallsUnder15Sec} звонков`} status="warning" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Распределение длительности</CardTitle>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={durationBuckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardTitle>Технические статусы</CardTitle>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardTitle>Звонки по дням</CardTitle>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#6366f1" name="Всего" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardTitle>client_hangup / bot_hangup по дням</CardTitle>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="clientHangup" fill="#f43f5e" name="client_hangup" stackId="a" />
                <Bar dataKey="botHangup" fill="#f59e0b" name="bot_hangup" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
