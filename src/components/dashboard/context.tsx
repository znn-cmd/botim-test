"use client";

import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from "react";
import { getMockCalls } from "@/lib/mock-data";
import { applyFilters, DEFAULT_FILTERS } from "@/lib/filters";
import { calculateMetrics } from "@/lib/metrics";
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
  isDemo: boolean;
  isLoading: boolean;
  error: string | null;
  lastUploadAt: Date | null;
  loadCalls: (calls: ClassifiedCall[]) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [allCalls, setAllCalls] = useState<ClassifiedCall[]>(getMockCalls());
  const [filters, setFiltersState] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [selectedCall, setSelectedCall] = useState<ClassifiedCall | null>(null);
  const [isDemo, setIsDemo] = useState(true);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUploadAt, setLastUploadAt] = useState<Date | null>(null);

  const setFilters = useCallback((f: Partial<DashboardFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...f }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  const loadCalls = useCallback((calls: ClassifiedCall[]) => {
    setAllCalls(calls);
    setIsDemo(false);
    setLastUploadAt(new Date());
    setError(null);
  }, []);

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
    isDemo,
    isLoading,
    error,
    lastUploadAt,
    loadCalls,
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
