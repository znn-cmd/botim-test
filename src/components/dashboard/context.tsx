"use client";

import { createContext, useContext, useMemo, useState, useCallback, useEffect, type ReactNode } from "react";
import { applyFilters, DEFAULT_FILTERS } from "@/lib/filters";
import { calculateMetrics } from "@/lib/metrics";
import { fetchSheetData } from "@/lib/sheet-loader";
import type { ClassifiedCall, DashboardFilters, TabId } from "@/lib/types";

interface DashboardContextValue {
  allCalls: ClassifiedCall[];
  filteredCalls: ClassifiedCall[];
  filters: DashboardFilters;
  setFilters: (f: Partial<DashboardFilters>) => void;
  resetFilters: () => void;
  metrics: ReturnType<typeof calculateMetrics>;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  selectedCall: ClassifiedCall | null;
  setSelectedCall: (call: ClassifiedCall | null) => void;
  isLoading: boolean;
  error: string | null;
  lastUploadAt: Date | null;
  dataSource: "sheets" | "file";
  loadCalls: (calls: ClassifiedCall[], source?: "sheets" | "file") => void;
  refreshData: () => Promise<void>;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [allCalls, setAllCalls] = useState<ClassifiedCall[]>([]);
  const [filters, setFiltersState] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [selectedCall, setSelectedCall] = useState<ClassifiedCall | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUploadAt, setLastUploadAt] = useState<Date | null>(null);
  const [dataSource, setDataSource] = useState<"sheets" | "file">("sheets");

  const setFilters = useCallback((f: Partial<DashboardFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...f }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  const loadCalls = useCallback((calls: ClassifiedCall[], source: "sheets" | "file" = "file") => {
    setAllCalls(calls);
    setDataSource(source);
    setLastUploadAt(new Date());
    setError(null);
  }, []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchSheetData();
      if (result.errors.length > 0) {
        setError(result.errors.join("; "));
        return;
      }
      loadCalls(result.calls, "sheets");
    } catch (e) {
      setError(`Ошибка загрузки: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [loadCalls]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const filteredCalls = useMemo(() => applyFilters(allCalls, filters), [allCalls, filters]);
  const metrics = useMemo(() => calculateMetrics(filteredCalls), [filteredCalls]);

  const value: DashboardContextValue = {
    allCalls,
    filteredCalls,
    filters,
    setFilters,
    resetFilters,
    metrics,
    activeTab,
    setActiveTab,
    selectedCall,
    setSelectedCall,
    isLoading,
    error,
    lastUploadAt,
    dataSource,
    loadCalls,
    refreshData,
    setLoading,
    setError,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
