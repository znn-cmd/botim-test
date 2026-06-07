"use client";

import { useRef, useState } from "react";
import { Upload, Link2, Loader2, RefreshCw, Sheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboard } from "./context";
import { parseCSV, parseXLSX, parseGoogleSheetsUrl } from "@/lib/parser";
import { GOOGLE_SHEET_EDIT_URL } from "@/lib/data-source";

export function FileUpload() {
  const { loadCalls, setLoading, setError, isLoading, refreshData, dataSource, allCalls } = useDashboard();
  const fileRef = useRef<HTMLInputElement>(null);
  const [sheetUrl, setSheetUrl] = useState("");
  const [showUrl, setShowUrl] = useState(false);

  const handleFile = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      let result;

      if (ext === "csv") {
        const text = await file.text();
        result = parseCSV(text);
      } else if (ext === "xlsx" || ext === "xls") {
        const buffer = await file.arrayBuffer();
        result = parseXLSX(buffer);
      } else {
        setError("Поддерживаются форматы CSV и XLSX");
        return;
      }

      if (result.errors.length > 0) {
        setError(result.errors.join("; "));
        return;
      }

      loadCalls(result.calls, "file");
    } catch (e) {
      setError(`Ошибка чтения файла: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUrl = async () => {
    if (!sheetUrl.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await parseGoogleSheetsUrl(sheetUrl.trim());
      if (result.errors.length > 0) {
        setError(result.errors.join("; "));
        return;
      }
      loadCalls(result.calls, "file");
    } catch (e) {
      setError(`Ошибка: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        ref={fileRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <Button variant="outline" size="sm" disabled={isLoading} onClick={() => refreshData()}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        Обновить из таблицы
      </Button>
      <Button
        variant="primary"
        size="sm"
        disabled={isLoading}
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="h-4 w-4" />
        Загрузить CSV/XLSX
      </Button>
      <Button variant="outline" size="sm" onClick={() => setShowUrl(!showUrl)}>
        <Link2 className="h-4 w-4" />
        Другая таблица
      </Button>
      {dataSource === "sheets" && allCalls.length > 0 && (
        <a
          href={GOOGLE_SHEET_EDIT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
        >
          <Sheet className="h-3.5 w-3.5" />
          Google Sheets · {allCalls.length} звонков
        </a>
      )}
      {showUrl && (
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <input
            type="url"
            placeholder="Ссылка на Google Sheets"
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <Button size="sm" onClick={handleUrl} disabled={isLoading}>
            Загрузить
          </Button>
        </div>
      )}
    </div>
  );
}
