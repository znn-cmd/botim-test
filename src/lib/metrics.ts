import type {
  AbTestHypothesis,
  ClassifiedCall,
  DashboardMetrics,
  DropOffStat,
  FunnelStep,
  FunnelStage,
  ObjectionStat,
  RecommendedCall,
} from "./types";
import { OBJECTION_LABELS, STAGE_LABELS } from "./types";
import { generateAbTest } from "./ab-tests";
import { median } from "./utils";

const OVERVIEW_FUNNEL: FunnelStage[] = [
  "all_calls",
  "has_dialogue",
  "consent",
  "offer_reached",
  "meeting_offered",
  "meeting_agreed",
  "qualification_completed",
];

const DETAILED_FUNNEL: FunnelStage[] = [
  "all_calls",
  "has_dialogue",
  "client_answered",
  "consent",
  "offer_reached",
  "offer_reacted",
  "meeting_offered",
  "meeting_agreed",
  "qualification_started",
  "qualification_completed",
];

function stageFlag(call: ClassifiedCall, stage: FunnelStage): boolean {
  const map: Record<FunnelStage, boolean> = {
    all_calls: true,
    has_dialogue: call.hasDialogue,
    client_answered: call.clientAnswered,
    consent: call.consent,
    offer_reached: call.offerReached,
    offer_reacted: call.offerReacted,
    meeting_offered: call.meetingOffered,
    meeting_agreed: call.meetingAgreed,
    qualification_started: call.qualificationStarted,
    qualification_completed: call.qualificationCompleted,
  };
  return map[stage];
}

function buildFunnel(calls: ClassifiedCall[], stages: FunnelStage[]): FunnelStep[] {
  const total = calls.length || 1;
  const steps: FunnelStep[] = [];
  let prevCount = total;

  for (const key of stages) {
    const count = calls.filter((c) => stageFlag(c, key)).length;
    steps.push({
      key,
      label: STAGE_LABELS[key],
      count,
      percentOfAll: count / total,
      percentOfPrevious: prevCount > 0 ? count / prevCount : 0,
      losses: prevCount - count,
    });
    prevCount = count;
  }

  return steps;
}

function findWeakestStage(funnel: FunnelStep[]): { stage: string; label: string } {
  let maxDrop = 0;
  let weakest = funnel[1] || funnel[0];

  for (let i = 1; i < funnel.length; i++) {
    const drop = 1 - funnel[i].percentOfPrevious;
    if (drop > maxDrop) {
      maxDrop = drop;
      weakest = funnel[i];
    }
  }

  return { stage: weakest.key, label: weakest.label };
}

function computeDropOffs(calls: ClassifiedCall[]): DropOffStat[] {
  const stageOrder = DETAILED_FUNNEL.slice(1);
  const total = calls.length || 1;

  return stageOrder.map((stage) => {
    const lostCalls = calls.filter((c) => {
      const idx = DETAILED_FUNNEL.indexOf(c.lastReachedStage);
      const stageIdx = DETAILED_FUNNEL.indexOf(stage);
      return idx < stageIdx || (c.lastReachedStage === stage && !stageFlag(c, stage));
    });

    const atStage = calls.filter((c) => c.lastReachedStage === stage && !stageFlag(c, DETAILED_FUNNEL[DETAILED_FUNNEL.indexOf(stage) + 1] as FunnelStage));

    const relevant = atStage.length > 0 ? atStage : calls.filter((c) => {
      const reachedIdx = DETAILED_FUNNEL.indexOf(c.lastReachedStage);
      const targetIdx = DETAILED_FUNNEL.indexOf(stage);
      return reachedIdx === targetIdx;
    });

    const losses = calls.filter((c) => {
      const nextIdx = DETAILED_FUNNEL.indexOf(stage);
      const reachedIdx = DETAILED_FUNNEL.indexOf(c.lastReachedStage);
      return reachedIdx === nextIdx - 1 && !stageFlag(c, stage);
    });

    const group = losses.length > 0 ? losses : relevant;

    const reasonCounts: Record<string, number> = {};
    const clientPhrases: Record<string, number> = {};
    const botPhrases: Record<string, number> = {};

    for (const c of group) {
      reasonCounts[c.lossReason] = (reasonCounts[c.lossReason] || 0) + 1;
      if (c.lastClientMessage) clientPhrases[c.lastClientMessage.slice(0, 80)] = (clientPhrases[c.lastClientMessage.slice(0, 80)] || 0) + 1;
      if (c.lastBotMessage) botPhrases[c.lastBotMessage.slice(0, 80)] = (botPhrases[c.lastBotMessage.slice(0, 80)] || 0) + 1;
    }

    const topReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
    const topClient = Object.entries(clientPhrases).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
    const topBot = Object.entries(botPhrases).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

    return {
      stage: stage,
      label: STAGE_LABELS[stage],
      count: group.length,
      share: group.length / total,
      avgDurationSec: group.length ? group.reduce((s, c) => s + c.durationSec, 0) / group.length : 0,
      topReason,
      topClientPhrase: topClient,
      topBotPhrase: topBot,
    };
  }).filter((d) => d.count > 0);
}

function computeObjections(calls: ClassifiedCall[]): ObjectionStat[] {
  const withDialogue = calls.filter((c) => c.hasDialogue);
  const total = withDialogue.length || 1;
  const groups: Record<string, ClassifiedCall[]> = {};

  for (const call of withDialogue) {
    if (!call.objectionCategory) continue;
    const cat = call.objectionCategory;
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(call);
  }

  return Object.entries(groups)
    .map(([category, group]) => ({
      category: category as ObjectionStat["category"],
      label: OBJECTION_LABELS[category as ObjectionStat["category"]],
      count: group.length,
      share: group.length / total,
      stage: group[0]?.dropOffStage || "—",
      examplePhrase: group[0]?.lastClientMessage.slice(0, 100) || "—",
      callIds: group.map((c) => c.id),
    }))
    .sort((a, b) => b.count - a.count);
}

function computeRecommendedCalls(calls: ClassifiedCall[], weakestLabel: string): RecommendedCall[] {
  return calls
    .filter((c) => c.hasDialogue && c.dialogueProgressScore < 6)
    .map((call) => {
      let reason = call.lossReason;
      if (call.dropOffStage === weakestLabel) reason = `Потеря на слабом этапе: ${weakestLabel}`;
      else if (call.durationSec > 90 && !call.meetingAgreed) reason = "Длинный диалог без встречи";
      else if (call.offerReaction === "interest" && !call.meetingAgreed) reason = "Интерес без согласования встречи";
      else if (call.objectionCategory === "whatsapp") reason = "Клиент просил WhatsApp";
      else if (call.objectionCategory === "callback_later") reason = "Клиент просил перезвонить";
      else if (call.hangupReason === "client_hangup" && call.offerReached) reason = "Сброс после оффера";

      return { call, priority: call.priorityScore, reason };
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 20);
}

function computeLossMap(calls: ClassifiedCall[]): { label: string; count: number }[] {
  const total = calls.length || 1;
  return [
    { label: "До согласия", count: calls.filter((c) => c.hasDialogue && !c.consent).length },
    { label: "После приветствия", count: calls.filter((c) => c.consent && !c.offerReached).length },
    { label: "После оффера", count: calls.filter((c) => c.offerReached && !c.meetingOffered).length },
    { label: "На предложении встречи", count: calls.filter((c) => c.meetingOffered && !c.meetingAgreed).length },
    { label: "На квалификации", count: calls.filter((c) => c.qualificationStarted && !c.qualificationCompleted).length },
    { label: "Технические", count: calls.filter((c) => c.isTechnicalLoss).length },
  ].map((item) => ({ ...item, count: item.count }));
}

function categorizeHangup(reason: string): string {
  const r = reason.toLowerCase();
  if (r.includes("client_hangup")) return "client_hangup";
  if (r.includes("bot_hangup")) return "bot_hangup";
  return "technical/other";
}

function computeHangupReasons(calls: ClassifiedCall[]) {
  const groups: Record<string, number> = {};
  for (const c of calls) {
    const cat = categorizeHangup(c.hangupReason);
    groups[cat] = (groups[cat] || 0) + 1;
    if (c.hangupReason) {
      groups[c.hangupReason] = (groups[c.hangupReason] || 0) + 1;
    }
  }

  return Object.entries(groups)
    .map(([reason, count]) => ({
      reason,
      count,
      category: categorizeHangup(reason),
    }))
    .sort((a, b) => b.count - a.count);
}

export function calculateMetrics(calls: ClassifiedCall[]): DashboardMetrics {
  const total = calls.length;
  const uniquePhones = new Set(calls.map((c) => c.phone)).size;
  const durations = calls.map((c) => c.durationSec);
  const withTranscript = calls.filter((c) => c.hasTranscript).length;
  const technical = calls.filter((c) => c.isTechnicalLoss).length;
  const consentCount = calls.filter((c) => c.consent).length;
  const offerCount = calls.filter((c) => c.offerReached).length;
  const meetingOfferedCount = calls.filter((c) => c.meetingOffered).length;
  const meetingAgreedCount = calls.filter((c) => c.meetingAgreed).length;
  const qualStarted = calls.filter((c) => c.qualificationStarted).length;
  const qualCompleted = calls.filter((c) => c.qualificationCompleted).length;
  const withDialogue = calls.filter((c) => c.hasDialogue).length;

  const funnel = buildFunnel(calls, OVERVIEW_FUNNEL);
  const detailedFunnel = buildFunnel(calls, DETAILED_FUNNEL);
  const weakest = findWeakestStage(funnel);
  const objections = computeObjections(calls);
  const recommendedCalls = computeRecommendedCalls(calls, weakest.label);
  const abTest = generateAbTest(weakest.stage, calls, recommendedCalls);

  const scores = calls.filter((c) => c.hasDialogue).map((c) => c.dialogueProgressScore);

  return {
    totalCalls: total,
    uniqueContacts: uniquePhones,
    repeatedCalls: total - uniquePhones,
    callsWithTranscript: withTranscript,
    transcriptRate: total ? withTranscript / total : 0,
    technicalLossRate: total ? technical / total : 0,
    avgDurationSec: total ? durations.reduce((a, b) => a + b, 0) / total : 0,
    medianDurationSec: median(durations),
    shortCallsUnder5Sec: calls.filter((c) => c.durationSec < 5).length,
    shortCallsUnder10Sec: calls.filter((c) => c.durationSec < 10).length,
    shortCallsUnder15Sec: calls.filter((c) => c.durationSec < 15).length,
    consentCount,
    consentRate: withDialogue ? consentCount / withDialogue : 0,
    offerReachedCount: offerCount,
    offerReachedRate: withDialogue ? offerCount / withDialogue : 0,
    meetingOfferedCount,
    meetingOfferedRate: withDialogue ? meetingOfferedCount / withDialogue : 0,
    meetingAgreedCount,
    meetingAgreedRate: withDialogue ? meetingAgreedCount / withDialogue : 0,
    qualificationStartedCount: qualStarted,
    qualificationCompletedCount: qualCompleted,
    qualificationCompletedRate: qualStarted ? qualCompleted / qualStarted : 0,
    avgDialogueProgressScore: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
    weakestStage: weakest.stage,
    weakestStageLabel: weakest.label,
    dropOffByStage: computeDropOffs(calls),
    objections,
    topObjection: objections[0] || null,
    recommendedCalls,
    funnel,
    detailedFunnel,
    abTest,
    dialogueRate: total ? withDialogue / total : 0,
    lossMap: computeLossMap(calls),
    hangupReasons: computeHangupReasons(calls),
  };
}

export function getWeakestInsight(metrics: DashboardMetrics): string {
  const funnel = metrics.funnel;
  let maxDrop = 0;
  let fromLabel = "";
  let toLabel = "";
  let fromPct = 0;
  let toPct = 0;

  for (let i = 1; i < funnel.length; i++) {
    const drop = 1 - funnel[i].percentOfPrevious;
    if (drop > maxDrop) {
      maxDrop = drop;
      fromLabel = funnel[i - 1].label;
      toLabel = funnel[i].label;
      fromPct = funnel[i - 1].percentOfAll;
      toPct = funnel[i].percentOfAll;
    }
  }

  const recommendations: Record<string, string> = {
    "Согласие на разговор": "Рекомендуется проверить opening, идентификацию бота и запрос разрешения на 20 секунд.",
    "Оффер озвучен": "Рекомендуется проверить длину оффера, формулировку ценности и переход к встрече.",
    "Встреча предложена": "Рекомендуется смягчить предложение встречи и предложить короткий следующий шаг.",
    "Встреча согласована": "Рекомендуется пересмотреть порядок квалификационных вопросов.",
    "Есть диалог": "Рекомендуется усилить приветствие и снизить сбросы до первой реплики клиента.",
  };

  const rec = recommendations[toLabel] || "Рекомендуется разобрать проблемные диалоги и сформулировать A/B-тест.";

  return `Основная потеря происходит на этапе «${fromLabel} → ${toLabel}». До «${fromLabel.toLowerCase()}» доходит ${(fromPct * 100).toFixed(0)}% звонков, но только ${(toPct * 100).toFixed(0)}% переходят дальше. ${rec}`;
}
