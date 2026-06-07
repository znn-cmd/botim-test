import { isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import type { ClassifiedCall, DashboardFilters } from "./types";
import { isValidDate } from "./utils";

export function applyFilters(calls: ClassifiedCall[], filters: DashboardFilters): ClassifiedCall[] {
  return calls.filter((call) => {
    if (!isValidDate(call.dateTime)) return false;
    if (filters.dateFrom && isBefore(call.dateTime, startOfDay(filters.dateFrom))) return false;
    if (filters.dateTo && isAfter(call.dateTime, endOfDay(filters.dateTo))) return false;
    if (filters.status && filters.status !== "all" && call.status !== filters.status) return false;
    if (filters.hangupReason && filters.hangupReason !== "all" && call.hangupReason !== filters.hangupReason) return false;
    if (filters.phoneSearch && !call.phone.toLowerCase().includes(filters.phoneSearch.toLowerCase())) return false;
    return true;
  });
}

export function getUniqueValues(calls: ClassifiedCall[], field: "status" | "hangupReason"): string[] {
  return [...new Set(calls.map((c) => c[field]).filter(Boolean))].sort();
}

export const DEFAULT_FILTERS: DashboardFilters = {
  dateFrom: null,
  dateTo: null,
  status: "all",
  hangupReason: "all",
  phoneSearch: "",
};
