import { NextResponse } from "next/server";
import { SHEET_CSV_URL } from "@/lib/data-source";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await fetch(SHEET_CSV_URL, {
      cache: "no-store",
      headers: { "User-Agent": "Botamin-Analytics/1.0" },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Google Sheets вернул ${response.status}: ${response.statusText}` },
        { status: response.status }
      );
    }

    const csv = await response.text();

    if (!csv.trim() || csv.includes("<!DOCTYPE html")) {
      return NextResponse.json(
        { error: "Таблица недоступна. Проверьте, что доступ «все, у кого есть ссылка» включён." },
        { status: 403 }
      );
    }

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: `Ошибка загрузки таблицы: ${(e as Error).message}` },
      { status: 500 }
    );
  }
}
