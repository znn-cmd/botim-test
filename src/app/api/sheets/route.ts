import { NextResponse } from "next/server";
import { GOOGLE_SHEET_GID, GOOGLE_SHEET_ID } from "@/lib/data-source";

export const dynamic = "force-dynamic";

const EXPORT_URLS = [
  `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv&gid=${GOOGLE_SHEET_GID}`,
  `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&gid=${GOOGLE_SHEET_GID}`,
];

function isValidCsv(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.includes("<!DOCTYPE html") || trimmed.includes("<html")) return false;
  return trimmed.includes("телефон") || trimmed.includes("phone");
}

async function fetchSheetCsv(): Promise<{ csv?: string; error?: string }> {
  let lastError = "Неизвестная ошибка";

  for (const url of EXPORT_URLS) {
    try {
      const response = await fetch(url, {
        cache: "no-store",
        headers: { "User-Agent": "Botamin-Analytics/1.0" },
        redirect: "follow",
      });

      if (!response.ok) {
        lastError = `Google Sheets вернул ${response.status}`;
        continue;
      }

      const csv = await response.text();
      if (isValidCsv(csv)) return { csv };

      lastError = "Таблица недоступна для публичного чтения";
    } catch (e) {
      lastError = (e as Error).message;
    }
  }

  return {
    error: `${lastError}. Откройте доступ: «Настройки доступа» → «Все, у кто есть ссылка» → «Читатель».`,
  };
}

export async function GET() {
  const result = await fetchSheetCsv();

  if (result.error || !result.csv) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  return new NextResponse(result.csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
