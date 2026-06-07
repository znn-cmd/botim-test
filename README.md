# Botamin Analytics Dashboard

MVP веб-дашборда для аналитика AI-звонков Botamin.

## Запуск

```bash
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000). По умолчанию загружены демо-данные.

## Загрузка данных

- CSV или XLSX с колонками: `телефон`, `дата и время`, `длительность мин:сек`, `статус`, `запись аудио`, `причина завершения`, `история диалога юзер-бот`
- Ссылка на Google Sheets (CSV export)

## Деплой на Vercel

```bash
npx vercel
```

Или подключите репозиторий в [vercel.com](https://vercel.com).

## Стек

Next.js, TypeScript, Tailwind CSS, Recharts, TanStack Table, PapaParse, xlsx, date-fns, lucide-react

## Ключевые файлы

- `src/lib/classification.ts` — эвристики классификации этапов
- `src/lib/keywords.ts` — словари ключевых слов (редактируемые)
- `src/lib/metrics.ts` — расчёт метрик и воронки
