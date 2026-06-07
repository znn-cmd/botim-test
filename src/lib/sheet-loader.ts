import { parseCSV, type ParseResult } from "./parser";

export async function fetchSheetData(): Promise<ParseResult> {
  try {
    const response = await fetch("/api/sheets", { cache: "no-store" });

    if (!response.ok) {
      let message = `Не удалось загрузить таблицу (${response.status})`;
      try {
        const json = await response.json();
        if (json.error) message = json.error;
      } catch {
        // response is not JSON
      }
      return { calls: [], errors: [message] };
    }

    const csv = await response.text();
    return parseCSV(csv);
  } catch (e) {
    return { calls: [], errors: [`Ошибка загрузки Google Sheets: ${(e as Error).message}`] };
  }
}
