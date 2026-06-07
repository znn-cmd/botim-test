import type { AbTestHypothesis, ClassifiedCall, RecommendedCall } from "./types";

const TEMPLATES: Record<string, Omit<AbTestHypothesis, "supportingCallIds" | "sampleSize">> = {
  consent: {
    weakStage: "Приветствие",
    problem: "Много сбросов до согласия на разговор",
    metricToImprove: "Consent rate",
    variantA: "Текущее приветствие",
    variantB:
      "«Здравствуйте, это AI-ассистент Botamin. Удобно 20 секунд — скажу, по какому поводу звоню?»",
    primaryMetric: "consent rate",
    secondaryMetric: "offer reached rate",
    guardrails: ["client_hangup", "негативные реакции", "offer reached rate"],
  },
  has_dialogue: {
    weakStage: "Приветствие",
    problem: "Много звонков без осмысленного диалога",
    metricToImprove: "Dialogue rate",
    variantA: "Текущее приветствие",
    variantB:
      "«Здравствуйте, это AI-ассистент Botamin. Удобно 20 секунд — скажу, по какому поводу звоню?»",
    primaryMetric: "consent rate",
    secondaryMetric: "dialogue rate",
    guardrails: ["client_hangup", "негативные реакции", "short calls < 10s"],
  },
  offer_reached: {
    weakStage: "Оффер",
    problem: "Клиент сбрасывает после длинного оффера",
    metricToImprove: "Offer-to-meeting conversion",
    variantA: "Текущая версия оффера",
    variantB:
      "Короткий оффер до 15 секунд с одной ключевой выгодой. Вопрос в конце: «Есть смысл коротко обсудить?»",
    primaryMetric: "offer-to-meeting conversion",
    secondaryMetric: "offer reached rate",
    guardrails: ["«не понял»", "«неинтересно»", "client_hangup after offer"],
  },
  meeting_offered: {
    weakStage: "Встреча",
    problem: "Бот доносит оффер, но не переводит в следующий шаг",
    metricToImprove: "Meeting agreed rate",
    variantA: "Прямое предложение встречи",
    variantB:
      "Мягкое предложение короткого созвона / WhatsApp-следующего шага без обязательства",
    primaryMetric: "meeting agreed rate",
    secondaryMetric: "meeting offered rate",
    guardrails: ["отказ от встречи", "негатив", "qualification started rate"],
  },
  meeting_agreed: {
    weakStage: "Квалификация",
    problem: "Клиент отваливается на квалификационных вопросах",
    metricToImprove: "Qualification completed rate",
    variantA: "Текущий порядок вопросов",
    variantB:
      "Сначала лёгкие вопросы, чувствительные позже. Часть вопросов перенести после согласия на встречу.",
    primaryMetric: "qualification completed rate",
    secondaryMetric: "meeting agreed rate",
    guardrails: ["meeting agreed rate", "client_hangup during qualification"],
  },
  qualification_completed: {
    weakStage: "Квалификация",
    problem: "Низкая доля завершённых квалификаций",
    metricToImprove: "Qualification completed rate",
    variantA: "Текущий порядок вопросов",
    variantB: "Сначала лёгкие вопросы, потом чувствительные",
    primaryMetric: "qualification completed rate",
    secondaryMetric: "meeting agreed rate",
    guardrails: ["meeting agreed rate", "client_hangup during qualification"],
  },
};

export function generateAbTest(
  weakStage: string,
  calls: ClassifiedCall[],
  recommended: RecommendedCall[]
): AbTestHypothesis {
  const template = TEMPLATES[weakStage] || TEMPLATES.consent;
  const baseline = calls.filter((c) => c.hasDialogue).length || 1;
  const sampleSize = Math.max(200, Math.ceil(baseline * 0.3));

  return {
    ...template,
    sampleSize,
    supportingCallIds: recommended.slice(0, 10).map((r) => r.call.id),
  };
}
