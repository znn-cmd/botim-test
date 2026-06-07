"use client";

import { Card, CardTitle } from "@/components/ui/card";
import { KpiCard, formatKpiPercent } from "@/components/ui/kpi-card";
import { useDashboard } from "@/components/dashboard/context";
import { DISTRUST_KEYWORDS, NO_TIME_KEYWORDS } from "@/lib/keywords";
import { containsKeyword } from "@/lib/utils";

export function GreetingTab() {
  const { filteredCalls } = useDashboard();
  const withDialogue = filteredCalls.filter((c) => c.hasDialogue);
  const total = withDialogue.length || 1;

  const answered = withDialogue.filter((c) => c.clientAnswered).length;
  const consent = withDialogue.filter((c) => c.consent).length;
  const dropBeforeClient = filteredCalls.filter((c) => c.hasTranscript && !c.clientAnswered).length;
  const dropAfterFirstBot = withDialogue.filter((c) => {
    const firstBot = c.turns.find((t) => t.role === "bot");
    const firstClient = c.turns.find((t) => t.role === "client");
    return firstBot && !firstClient;
  }).length;

  const whoIsThis = withDialogue.filter((c) =>
    c.turns.some((t) => t.role === "client" && containsKeyword(t.text, DISTRUST_KEYWORDS))
  ).length;

  const noTime = withDialogue.filter((c) =>
    c.turns.some((t) => t.role === "client" && containsKeyword(t.text, NO_TIME_KEYWORDS))
  ).length;

  const firstBotLengths = withDialogue
    .map((c) => c.turns.find((t) => t.role === "bot")?.text.length || 0)
    .filter((l) => l > 0);
  const avgFirstBotLen = firstBotLengths.length
    ? Math.round(firstBotLengths.reduce((a, b) => a + b, 0) / firstBotLengths.length)
    : 0;

  const recommendations: string[] = [];
  if (whoIsThis / total > 0.15) recommendations.push("Много «кто это?» — усилить идентификацию бота и компании в opening.");
  if (noTime / total > 0.2) recommendations.push("Много «мне некогда» — использовать короткое разрешение на 20 секунд.");
  if (dropAfterFirstBot / total > 0.2) recommendations.push("Много сбросов после первой реплики — сократить opening.");

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard title="Ответ клиента" value={formatKpiPercent(answered / total)} description={`${answered} диалогов`} status="neutral" />
        <KpiCard title="Согласие на разговор" value={formatKpiPercent(consent / total)} description={`${consent} диалогов`} status={consent / total >= 0.5 ? "good" : "warning"} />
        <KpiCard title="Сброс до реплики клиента" value={formatKpiPercent(dropBeforeClient / (filteredCalls.length || 1))} description={`${dropBeforeClient} звонков`} status="warning" />
        <KpiCard title="Сброс после 1-й реплики бота" value={formatKpiPercent(dropAfterFirstBot / total)} description={`${dropAfterFirstBot} диалогов`} status="bad" />
        <KpiCard title="«Кто это?» / «Откуда номер?»" value={formatKpiPercent(whoIsThis / total)} description={`${whoIsThis} диалогов`} status="warning" />
        <KpiCard title="«Мне некогда» / «Занят»" value={formatKpiPercent(noTime / total)} description={`${noTime} диалогов`} status="warning" />
        <KpiCard title="Ср. длина 1-й реплики бота" value={`${avgFirstBotLen} симв.`} description="Символов" status="neutral" />
      </div>

      <Card>
        <CardTitle>Рекомендации</CardTitle>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {recommendations.length > 0 ? (
            recommendations.map((r, i) => <li key={i}>• {r}</li>)
          ) : (
            <li className="text-slate-500">Критических проблем на этапе приветствия не обнаружено.</li>
          )}
        </ul>
      </Card>
    </div>
  );
}
