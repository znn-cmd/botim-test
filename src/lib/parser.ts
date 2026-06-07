import Papa from "papaparse";
import * as XLSX from "xlsx";
import { parse, isValid } from "date-fns";
import { ru } from "date-fns/locale";
import { classifyCall } from "./classification";
import { COLUMN_ALIASES } from "./keywords";
import type { ClassifiedCall } from "./types";

export interface ParseResult {
  calls: ClassifiedCall[];
  errors: string[];
}

function normalizeKey(key: string): string {
  const trimmed = key.trim().toLowerCase();
  return COLUMN_ALIASES[trimmed] || trimmed;
}

function normalizeRow(row: Record<string, unknown>): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value instanceof Date) {
      normalized[normalizeKey(key)] = isValid(value) ? value.toISOString() : "";
    } else {
      normalized[normalizeKey(key)] = String(value ?? "").trim();
    }
  }
  return normalized;
}

function parseExcelSerial(serial: number): Date | null {
  if (serial < 1 || serial > 1000000) return null;
  const parsed = XLSX.SSF.parse_date_code(serial);
  if (!parsed) return null;
  const d = new Date(parsed.y, parsed.m - 1, parsed.d, parsed.H, parsed.M, Math.round(parsed.S));
  return isValid(d) ? d : null;
}

function parseDateTime(value: string | number | Date): Date {
  if (value instanceof Date) return isValid(value) ? value : new Date();
  if (typeof value === "number" && !Number.isNaN(value)) {
    const fromExcel = parseExcelSerial(value);
    if (fromExcel) return fromExcel;
    const fromMs = new Date(value);
    if (isValid(fromMs)) return fromMs;
    return new Date();
  }

  const str = String(value ?? "").trim();
  if (!str || str === "Invalid Date") return new Date();

  const excelNum = parseFloat(str.replace(",", "."));
  if (!Number.isNaN(excelNum) && /^\d+([.,]\d+)?$/.test(str)) {
    const fromExcel = parseExcelSerial(excelNum);
    if (fromExcel) return fromExcel;
  }

  const formats = [
    "dd.MM.yyyy HH:mm:ss",
    "dd.MM.yyyy HH:mm",
    "yyyy-MM-dd HH:mm:ss",
    "yyyy-MM-dd HH:mm",
    "yyyy-MM-dd'T'HH:mm:ss",
    "dd/MM/yyyy HH:mm",
    "dd.MM.yyyy",
  ];

  for (const fmt of formats) {
    const d = parse(str, fmt, new Date(), { locale: ru });
    if (isValid(d)) return d;
  }

  const fallback = new Date(str);
  return isValid(fallback) ? fallback : new Date();
}

function rowsToCalls(rows: Record<string, string>[]): ClassifiedCall[] {
  const phoneCounts: Record<string, number> = {};

  const rawCalls = rows
    .filter((row) => row["телефон"])
    .map((row, index) => {
      const phone = maskPhone(row["телефон"] || `unknown-${index}`);
      phoneCounts[phone] = (phoneCounts[phone] || 0) + 1;

      return {
        phone,
        dateTime: parseDateTime(row["дата и время"] || ""),
        durationSec: parseDurationFromRow(row["длительность мин:сек"]),
        status: row["статус"] || "",
        audioUrl: row["запись аудио"] || "",
        hangupReason: row["причина завершения"] || "",
        transcript: row["история диалога юзер-бот"] || "",
        index,
      };
    });

  const firstSeen: Record<string, boolean> = {};

  return rawCalls.map((raw) => {
    const isFirst = !firstSeen[raw.phone];
    firstSeen[raw.phone] = true;
    return classifyCall(raw, `${raw.phone}-${raw.index}`, isFirst);
  });
}

function parseDurationFromRow(value: string): number {
  if (!value) return 0;
  const colonMatch = value.match(/(\d+)\s*:\s*(\d+)/);
  if (colonMatch) return parseInt(colonMatch[1], 10) * 60 + parseInt(colonMatch[2], 10);
  const num = parseFloat(value.replace(",", "."));
  return isNaN(num) ? 0 : Math.round(num);
}

export function parseCSV(text: string): ParseResult {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => normalizeKey(h),
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    return { calls: [], errors: result.errors.map((e) => e.message) };
  }

  const rows = result.data.map(normalizeRow);
  const calls = rowsToCalls(rows);

  if (calls.length === 0) {
    return { calls: [], errors: ["Файл не содержит распознанных строк с колонкой «телефон»"] };
  }

  return { calls, errors: [] };
}

export function parseXLSX(buffer: ArrayBuffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false });
  const rows = json.map(normalizeRow);
  const calls = rowsToCalls(rows);

  if (calls.length === 0) {
    return { calls: [], errors: ["Excel-файл не содержит распознанных данных"] };
  }

  return { calls, errors: [] };
}

function buildGoogleSheetsExportUrl(url: string): string {
  const idMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!idMatch) return url;

  const gidMatch = url.match(/[?&#]gid=(\d+)/);
  const gid = gidMatch ? `&gid=${gidMatch[1]}` : "";
  return `https://docs.google.com/spreadsheets/d/${idMatch[1]}/export?format=csv${gid}`;
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 4) return `+7***${digits.slice(-4)}`;
  return phone;
}

export async function parseGoogleSheetsUrl(url: string): Promise<ParseResult> {
  try {
    const fetchUrl = url.includes("docs.google.com/spreadsheets")
      ? buildGoogleSheetsExportUrl(url)
      : url;

    const response = await fetch(fetchUrl);
    if (!response.ok) {
      return { calls: [], errors: [`Не удалось загрузить данные: ${response.statusText}`] };
    }
    const text = await response.text();
    return parseCSV(text);
  } catch (e) {
    return { calls: [], errors: [`Ошибка загрузки Google Sheets: ${(e as Error).message}`] };
  }
}

export function exportCallsToCSV(calls: ClassifiedCall[]): string {
  const rows = calls.map((c) => ({
    "дата и время": c.dateTime.toISOString(),
    телефон: c.phone,
    "длительность мин:сек": `${Math.floor(c.durationSec / 60)}:${(c.durationSec % 60).toString().padStart(2, "0")}`,
    статус: c.status,
    "причина завершения": c.hangupReason,
    "последний этап": c.dropOffStage,
    score: c.dialogueProgressScore,
    возражение: c.objectionCategory || "",
    "запись аудио": c.audioUrl,
  }));

  return Papa.unparse(rows);
}
