import { classifyCall } from "./classification";
import type { ClassifiedCall } from "./types";

const TOTAL_MOCK_CALLS = 1000;

type MockRow = {
  phone: string;
  dateTime: Date;
  durationSec: number;
  status: string;
  audioUrl: string;
  hangupReason: string;
  transcript: string;
};

const SCENARIOS: { weight: number; build: (id: number) => MockRow }[] = [
  {
    weight: 12,
    build: (id) => ({
      phone: maskPhone(id),
      dateTime: randomDate(id),
      durationSec: rand(2, 8),
      status: pick(["no_answer", "busy", "failed"]),
      audioUrl: "",
      hangupReason: pick(["no_answer", "busy", "failed", "timeout"]),
      transcript: "",
    }),
  },
  {
    weight: 8,
    build: (id) => ({
      phone: maskPhone(id),
      dateTime: randomDate(id),
      durationSec: rand(2, 5),
      status: "completed",
      audioUrl: `https://demo.botamin.io/audio/${id}`,
      hangupReason: "client_hangup",
      transcript: "Бот: Здравствуйте! Это AI-ассистент Botamin...",
    }),
  },
  {
    weight: 14,
    build: (id) => ({
      phone: maskPhone(id),
      dateTime: randomDate(id),
      durationSec: rand(15, 35),
      status: "completed",
      audioUrl: `https://demo.botamin.io/audio/${id}`,
      hangupReason: "client_hangup",
      transcript: `Бот: Здравствуйте! AI-ассистент Botamin. Удобно 20 секунд?
Клиент: ${pick(["Кто это?", "Откуда номер?", "Что надо?", "Я не оставлял заявку"])}
Бот: Звоню по заявке с сайта. Могу кратко рассказать?
Клиент: ${pick(["Не звоните больше", "Удалите номер", "Это спам", "Не интересно"])}`,
    }),
  },
  {
    weight: 12,
    build: (id) => ({
      phone: maskPhone(id),
      dateTime: randomDate(id),
      durationSec: rand(12, 40),
      status: "completed",
      audioUrl: `https://demo.botamin.io/audio/${id}`,
      hangupReason: "client_hangup",
      transcript: `Бот: Добрый день! Botamin на связи. Удобно?
Клиент: ${pick(["Занят", "Некогда", "Перезвоните позже", "Сейчас не могу, на работе"])}
Бот: Понял, перезвоню в удобное время. Хорошего дня!`,
    }),
  },
  {
    weight: 18,
    build: (id) => ({
      phone: maskPhone(id),
      dateTime: randomDate(id),
      durationSec: rand(40, 90),
      status: "completed",
      audioUrl: `https://demo.botamin.io/audio/${id}`,
      hangupReason: "client_hangup",
      transcript: `Бот: Здравствуйте! AI-ассистент Botamin. Удобно поговорить?
Клиент: ${pick(["Да, слушаю", "Говорите", "Удобно", "Ну давайте"])}
Бот: Мы предлагаем голосовых AI-агентов для продаж. Они обзванивают базу и доводят клиента до встречи. Конверсия растёт до 40%.
Клиент: ${pick(["Не понял, повторите", "Что вы предлагаете?", "Неинтересно", "Не нужно", "Напишите в WhatsApp"])}`,
    }),
  },
  {
    weight: 14,
    build: (id) => ({
      phone: maskPhone(id),
      dateTime: randomDate(id),
      durationSec: rand(55, 120),
      status: "completed",
      audioUrl: `https://demo.botamin.io/audio/${id}`,
      hangupReason: "client_hangup",
      transcript: `Бот: Добрый день! Botamin. Удобно?
Клиент: Да, слушаю.
Бот: Наше решение автоматизирует исходящие продажи через AI. Скидка 20% при запуске в июне. Интересно?
Клиент: ${pick(["Интересно, расскажите", "А сколько стоит?", "Хорошо, а как работает?"])}
Бот: Предлагаю короткую встречу на 15 минут. Когда удобно?
Клиент: ${pick(["Не актуально", "Уже решил с другим", "Пока не готов", "Перезвоните через неделю"])}`,
    }),
  },
  {
    weight: 10,
    build: (id) => ({
      phone: maskPhone(id),
      dateTime: randomDate(id),
      durationSec: rand(70, 130),
      status: "completed",
      audioUrl: `https://demo.botamin.io/audio/${id}`,
      hangupReason: "client_hangup",
      transcript: `Бот: Здравствуйте! AI-ассистент Botamin. Удобно?
Клиент: Слушаю.
Бот: Предлагаем AI-агентов для исходящих продаж. Они доводят клиента до встречи.
Клиент: Интересно.
Бот: Предлагаю встречу. Удобно завтра или послезавтра?
Клиент: ${pick(["Напишите в WhatsApp", "Пришлите информацию в ватсап", "Скиньте в WhatsApp"])}`,
    }),
  },
  {
    weight: 10,
    build: (id) => ({
      phone: maskPhone(id),
      dateTime: randomDate(id),
      durationSec: rand(90, 160),
      status: "completed",
      audioUrl: `https://demo.botamin.io/audio/${id}`,
      hangupReason: pick(["client_hangup", "bot_hangup"]),
      transcript: `Бот: Добрый день! Botamin. Удобно 20 секунд?
Клиент: Да, удобно.
Бот: Мы помогаем автоматизировать продажи с помощью голосовых AI-агентов. Экономия до 60% на отделе продаж.
Клиент: Интересно, давайте.
Бот: Предлагаю встречу на 15 минут. ${pick(["Удобно завтра в 14:00?", "Можно в пятницу утром?", "После обеда подойдёт?"])}
Клиент: ${pick(["Давайте завтра в 14", "Удобно в пятницу утром", "После обеда, в 15:00", "Договорились"])}`,
    }),
  },
  {
    weight: 8,
    build: (id) => ({
      phone: maskPhone(id),
      dateTime: randomDate(id),
      durationSec: rand(120, 200),
      status: "completed",
      audioUrl: `https://demo.botamin.io/audio/${id}`,
      hangupReason: "bot_hangup",
      transcript: `Бот: Здравствуйте! AI-ассистент Botamin. Удобно?
Клиент: Да, слушаю вас.
Бот: Предлагаем AI-агентов для продаж. Они обзванивают базу и доводят до встречи.
Клиент: Хорошо, расскажите подробнее.
Бот: Предлагаю демо-встречу. Удобно завтра?
Клиент: Можно в четверг, договорились.
Бот: Отлично! Какой у вас примерный бюджет на автоматизацию?
Клиент: ${pick(["До 500 тысяч", "Около миллиона", "Пока не готов сказать"])}
Бот: Когда планируете запуск?
Клиент: ${pick(["В ближайший месяц", "Через квартал", "Для себя, не инвестиция"])}
Бот: Какой город?
Клиент: ${pick(["Москва", "Санкт-Петербург", "Казань", "Новосибирск"])}`,
    }),
  },
  {
    weight: 4,
    build: (id) => ({
      phone: maskPhone(id),
      dateTime: randomDate(id),
      durationSec: rand(100, 180),
      status: "completed",
      audioUrl: `https://demo.botamin.io/audio/${id}`,
      hangupReason: "client_hangup",
      transcript: `Бот: Добрый день! Botamin. Удобно?
Клиент: Да.
Бот: AI-агенты для продаж — наше предложение. Интересно?
Клиент: Да, интересно.
Бот: Предлагаю встречу. Удобно завтра?
Клиент: Давайте завтра, договорились.
Бот: Сколько менеджеров в отделе продаж?
Клиент: Пять.
Бот: Какой бюджет рассматриваете?
Клиент: Не хочу говорить по телефону, до свидания.`,
    }),
  },
];

function maskPhone(id: number): string {
  const base = 1000 + (id % 850);
  return `+7***${base}`;
}

function randomDate(id: number): Date {
  const start = new Date("2026-05-15T08:00:00");
  const dayOffset = id % 23;
  const hour = 8 + (id % 11);
  const minute = (id * 7) % 60;
  const d = new Date(start);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function rand(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickScenario(id: number): MockRow {
  const totalWeight = SCENARIOS.reduce((s, sc) => s + sc.weight, 0);
  let r = id % totalWeight;
  for (const sc of SCENARIOS) {
    r -= sc.weight;
    if (r < 0) return sc.build(id);
  }
  return SCENARIOS[0].build(id);
}

function generateMockRows(count: number): MockRow[] {
  const rows: MockRow[] = [];
  const repeatSlots = Math.floor(count * 0.12);

  for (let i = 0; i < count - repeatSlots; i++) {
    rows.push(pickScenario(i));
  }

  for (let i = 0; i < repeatSlots; i++) {
    const source = rows[i * 5] ?? rows[0];
    rows.push({
      ...pickScenario(count + i),
      phone: source.phone,
      dateTime: new Date(source.dateTime.getTime() + rand(1, 5) * 86400000),
    });
  }

  return rows;
}

export function getMockCalls(): ClassifiedCall[] {
  const allRows = generateMockRows(TOTAL_MOCK_CALLS);
  const firstSeen: Record<string, boolean> = {};

  return allRows.map((row, index) => {
    const isFirst = !firstSeen[row.phone];
    firstSeen[row.phone] = true;
    return classifyCall(row, `mock-${index}`, isFirst);
  });
}
