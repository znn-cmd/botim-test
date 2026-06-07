export type FunnelStage =
  | "all_calls"
  | "has_dialogue"
  | "client_answered"
  | "consent"
  | "offer_reached"
  | "offer_reacted"
  | "meeting_offered"
  | "meeting_agreed"
  | "qualification_started"
  | "qualification_completed";

export type ObjectionCategory =
  | "no_time"
  | "not_interested"
  | "distrust"
  | "not_understood"
  | "whatsapp"
  | "callback_later"
  | "already_applied"
  | "is_robot"
  | "negative"
  | "other";

export type OfferReaction =
  | "interest"
  | "neutral"
  | "no_time"
  | "distrust"
  | "rejection"
  | "confusion"
  | "other";

export type MeetingOutcome =
  | "meeting_agreed"
  | "whatsapp_requested"
  | "callback_requested"
  | "client_refused"
  | "bot_did_not_offer"
  | "unclear";

export interface DialogueTurn {
  role: "bot" | "client" | "unknown";
  text: string;
}

export interface QualificationQuestion {
  question: string;
  answered: boolean;
  dropped: boolean;
}

export interface ClassifiedCall {
  id: string;
  phone: string;
  dateTime: Date;
  durationSec: number;
  status: string;
  audioUrl: string;
  hangupReason: string;
  transcript: string;
  turns: DialogueTurn[];
  hasTranscript: boolean;
  hasDialogue: boolean;
  clientAnswered: boolean;
  consent: boolean;
  offerReached: boolean;
  offerReacted: boolean;
  offerReaction: OfferReaction | null;
  meetingOffered: boolean;
  meetingAgreed: boolean;
  meetingOutcome: MeetingOutcome;
  qualificationStarted: boolean;
  qualificationCompleted: boolean;
  qualificationQuestions: QualificationQuestion[];
  objectionCategory: ObjectionCategory | null;
  lastReachedStage: FunnelStage;
  dialogueProgressScore: number;
  dropOffStage: string;
  lastClientMessage: string;
  lastBotMessage: string;
  lossReason: string;
  isTechnicalLoss: boolean;
  isFirstCall: boolean;
  priorityScore: number;
}

export interface ObjectionStat {
  category: ObjectionCategory;
  label: string;
  count: number;
  share: number;
  stage: string;
  examplePhrase: string;
  callIds: string[];
}

export interface DropOffStat {
  stage: string;
  label: string;
  count: number;
  share: number;
  avgDurationSec: number;
  topReason: string;
  topClientPhrase: string;
  topBotPhrase: string;
}

export interface FunnelStep {
  key: FunnelStage;
  label: string;
  count: number;
  percentOfAll: number;
  percentOfPrevious: number;
  losses: number;
}

export interface RecommendedCall {
  call: ClassifiedCall;
  priority: number;
  reason: string;
}

export interface AbTestHypothesis {
  weakStage: string;
  problem: string;
  metricToImprove: string;
  variantA: string;
  variantB: string;
  primaryMetric: string;
  secondaryMetric: string;
  guardrails: string[];
  sampleSize: number;
  supportingCallIds: string[];
}

export interface DashboardMetrics {
  totalCalls: number;
  uniqueContacts: number;
  repeatedCalls: number;
  callsWithTranscript: number;
  transcriptRate: number;
  technicalLossRate: number;
  avgDurationSec: number;
  medianDurationSec: number;
  shortCallsUnder5Sec: number;
  shortCallsUnder10Sec: number;
  shortCallsUnder15Sec: number;
  consentCount: number;
  consentRate: number;
  offerReachedCount: number;
  offerReachedRate: number;
  meetingOfferedCount: number;
  meetingOfferedRate: number;
  meetingAgreedCount: number;
  meetingAgreedRate: number;
  qualificationStartedCount: number;
  qualificationCompletedCount: number;
  qualificationCompletedRate: number;
  avgDialogueProgressScore: number;
  weakestStage: string;
  weakestStageLabel: string;
  dropOffByStage: DropOffStat[];
  objections: ObjectionStat[];
  topObjection: ObjectionStat | null;
  recommendedCalls: RecommendedCall[];
  funnel: FunnelStep[];
  detailedFunnel: FunnelStep[];
  abTest: AbTestHypothesis;
  dialogueRate: number;
  lossMap: { label: string; count: number }[];
  hangupReasons: { reason: string; count: number; category: string }[];
}

export interface DashboardFilters {
  dateFrom: Date | null;
  dateTo: Date | null;
  status: string;
  hangupReason: string;
  phoneSearch: string;
}

export type TabId =
  | "overview"
  | "technical"
  | "funnel"
  | "dropoffs"
  | "greeting"
  | "offer"
  | "meeting"
  | "qualification"
  | "objections"
  | "time"
  | "dialogues"
  | "abtests";

export const STAGE_LABELS: Record<FunnelStage, string> = {
  all_calls: "Все звонки",
  has_dialogue: "Есть диалог",
  client_answered: "Клиент ответил",
  consent: "Согласие на разговор",
  offer_reached: "Оффер озвучен",
  offer_reacted: "Реакция на оффер",
  meeting_offered: "Встреча предложена",
  meeting_agreed: "Встреча согласована",
  qualification_started: "Квалификация начата",
  qualification_completed: "Квалификация завершена",
};

export const OBJECTION_LABELS: Record<ObjectionCategory, string> = {
  no_time: "Нет времени",
  not_interested: "Неинтересно",
  distrust: "Недоверие",
  not_understood: "Не понял оффер",
  whatsapp: "Напишите в WhatsApp",
  callback_later: "Перезвоните позже",
  already_applied: "Уже обращался",
  is_robot: "Это робот?",
  negative: "Негатив / не звоните",
  other: "Другое",
};
