"use client";

import { BarChart3, AlertCircle, Loader2 } from "lucide-react";
import { DashboardProvider, useDashboard } from "./context";
import { FileUpload } from "./file-upload";
import { FiltersBar } from "./filters-bar";
import { DialogueModal } from "./dialogue-modal";
import { OverviewTab } from "@/components/tabs/overview-tab";
import { TechnicalTab } from "@/components/tabs/technical-tab";
import { FunnelTab } from "@/components/tabs/funnel-tab";
import { DropoffsTab } from "@/components/tabs/dropoffs-tab";
import { GreetingTab } from "@/components/tabs/greeting-tab";
import { OfferTab } from "@/components/tabs/offer-tab";
import { MeetingTab } from "@/components/tabs/meeting-tab";
import { QualificationTab } from "@/components/tabs/qualification-tab";
import { ObjectionsTab } from "@/components/tabs/objections-tab";
import { TimeTab } from "@/components/tabs/time-tab";
import { DialoguesTab } from "@/components/tabs/dialogues-tab";
import { AbTestsTab } from "@/components/tabs/abtests-tab";
import type { TabId } from "@/lib/types";
import { cn } from "@/lib/utils";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "technical", label: "Техническое качество" },
  { id: "funnel", label: "Воронка диалога" },
  { id: "dropoffs", label: "Потери по шагам" },
  { id: "greeting", label: "Приветствие" },
  { id: "offer", label: "Оффер" },
  { id: "meeting", label: "Встреча" },
  { id: "qualification", label: "Квалификация" },
  { id: "objections", label: "Возражения" },
  { id: "time", label: "Время и сегменты" },
  { id: "dialogues", label: "Диалоги" },
  { id: "abtests", label: "A/B-тесты" },
];

function DashboardContent() {
  const { activeTab, setActiveTab, isLoading, error, filteredCalls } = useDashboard();

  const renderTab = () => {
    switch (activeTab) {
      case "overview": return <OverviewTab />;
      case "technical": return <TechnicalTab />;
      case "funnel": return <FunnelTab />;
      case "dropoffs": return <DropoffsTab />;
      case "greeting": return <GreetingTab />;
      case "offer": return <OfferTab />;
      case "meeting": return <MeetingTab />;
      case "qualification": return <QualificationTab />;
      case "objections": return <ObjectionsTab />;
      case "time": return <TimeTab />;
      case "dialogues": return <DialoguesTab />;
      case "abtests": return <AbTestsTab />;
      default: return <OverviewTab />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Botamin Analytics</h1>
                <p className="text-sm text-slate-500">Дашборд для аналитика AI-продаж</p>
              </div>
            </div>
            <FileUpload />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <FiltersBar />

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-12 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Загрузка данных...
          </div>
        )}

        {!isLoading && filteredCalls.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
            <p className="text-lg font-medium text-slate-700">Нет данных для отображения</p>
            <p className="mt-1 text-sm text-slate-500">
              {error
                ? "Проверьте доступ к Google Sheets или загрузите CSV/XLSX вручную"
                : "Данные загружаются из таблицы. Измените фильтры или нажмите «Обновить из таблицы»"}
            </p>
          </div>
        )}

        {!isLoading && filteredCalls.length > 0 && (
          <>
            <nav className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
              <div className="flex min-w-max gap-1">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                      activeTab === tab.id
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </nav>

            <div>{renderTab()}</div>
          </>
        )}
      </main>

      <DialogueModal />
    </div>
  );
}

export function Dashboard() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}
