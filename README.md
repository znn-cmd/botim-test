# Botamin Analytics Dashboard

MVP веб-дашборда для аналитика AI-звонков Botamin.

## Запуск

```bash
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000). Данные загружаются из Google Sheets автоматически.

## Источник данных

Таблица: [calls_week_anon](https://docs.google.com/spreadsheets/d/18lZSxc5G6lhj9hoDgVZKMtrYDYzr2tJ692txym3L7oI/edit?gid=1903196005)

**Важно:** для работы дашборда таблица должна быть доступна по ссылке:
`Файл → Настройки доступа → Все, у кого есть ссылка → Читатель`

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
