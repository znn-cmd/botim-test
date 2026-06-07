import { cn, formatPercent, statusColors, statusDot, type MetricStatus } from "@/lib/utils";
import { Info } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  description: string;
  status: MetricStatus;
  tooltip?: string;
}

const STATUS_LABELS: Record<MetricStatus, string> = {
  good: "Хорошо",
  warning: "Внимание",
  bad: "Проблема",
  neutral: "Нейтрально",
};

export function KpiCard({ title, value, description, status, tooltip }: KpiCardProps) {
  return (
    <div className={cn("rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md", statusColors(status))}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide opacity-80">{title}</p>
        {tooltip && (
          <span title={tooltip} className="cursor-help opacity-60">
            <Info className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight">{typeof value === "number" ? value.toLocaleString("ru-RU") : value}</p>
      <p className="mt-1 text-xs opacity-75">{description}</p>
      <div className="mt-3 flex items-center gap-1.5">
        <span className={cn("h-2 w-2 rounded-full", statusDot(status))} />
        <span className="text-xs font-medium">{STATUS_LABELS[status]}</span>
      </div>
    </div>
  );
}

export function formatKpiPercent(rate: number): string {
  return formatPercent(rate);
}
