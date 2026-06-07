import { type ClassValue, clsx } from "clsx";
import { format, isValid } from "date-fns";
import { ru } from "date-fns/locale";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function toValidDate(value: Date | string | number | null | undefined): Date {
  if (value instanceof Date && isValid(value)) return value;
  if (typeof value === "number" && !Number.isNaN(value)) {
    const fromMs = new Date(value);
    if (isValid(fromMs)) return fromMs;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);
    if (isValid(parsed)) return parsed;
  }
  return new Date();
}

export function isValidDate(date: Date): boolean {
  return date instanceof Date && isValid(date);
}

export function formatDateTime(date: Date): string {
  if (!isValidDate(date)) return "—";
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function safeFormatDate(date: Date, pattern: string): string {
  if (!isValidDate(date)) return "—";
  return format(date, pattern, { locale: ru });
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function containsKeyword(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

export function findFirstKeyword(text: string, keywords: string[]): string | null {
  const lower = text.toLowerCase();
  for (const kw of keywords) {
    if (lower.includes(kw.toLowerCase())) return kw;
  }
  return null;
}

export type MetricStatus = "good" | "warning" | "bad" | "neutral";

export function getRateStatus(
  rate: number,
  goodThreshold: number,
  warningThreshold: number
): MetricStatus {
  if (rate >= goodThreshold) return "good";
  if (rate >= warningThreshold) return "warning";
  return "bad";
}

export function statusColors(status: MetricStatus): string {
  switch (status) {
    case "good":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "bad":
      return "border-rose-200 bg-rose-50 text-rose-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export function statusDot(status: MetricStatus): string {
  switch (status) {
    case "good":
      return "bg-emerald-500";
    case "warning":
      return "bg-amber-500";
    case "bad":
      return "bg-rose-500";
    default:
      return "bg-slate-400";
  }
}
