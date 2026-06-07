import {
  ALREADY_APPLIED_KEYWORDS,
  CALLBACK_KEYWORDS,
  CONSENT_KEYWORDS,
  DISTRUST_KEYWORDS,
  INTEREST_KEYWORDS,
  MEETING_AGREED_KEYWORDS,
  MEETING_OFFER_KEYWORDS,
  NEGATIVE_KEYWORDS,
  NOT_UNDERSTOOD_KEYWORDS,
  NO_TIME_KEYWORDS,
  OFFER_KEYWORDS,
  QUALIFICATION_KEYWORDS,
  REJECTION_KEYWORDS,
  ROBOT_KEYWORDS,
  TECHNICAL_HANGUP_REASONS,
  WHATSAPP_KEYWORDS,
} from "./keywords";
import type {
  ClassifiedCall,
  DialogueTurn,
  FunnelStage,
  MeetingOutcome,
  ObjectionCategory,
  OfferReaction,
  QualificationQuestion,
} from "./types";
import { STAGE_LABELS, OBJECTION_LABELS } from "./types";
import { containsKeyword, toValidDate } from "./utils";

export function parseDuration(value: string | number | undefined): number {
  if (value === undefined || value === null || value === "") return 0;
  if (typeof value === "number") return Math.round(value);

  const str = String(value).trim();
  const colonMatch = str.match(/(\d+)\s*:\s*(\d+)/);
  if (colonMatch) {
    return parseInt(colonMatch[1], 10) * 60 + parseInt(colonMatch[2], 10);
  }

  const secMatch = str.match(/(\d+)\s*сек/i);
  if (secMatch) return parseInt(secMatch[1], 10);

  const minMatch = str.match(/(\d+)\s*мин/i);
  if (minMatch) return parseInt(minMatch[1], 10) * 60;

  const num = parseFloat(str.replace(",", "."));
  return isNaN(num) ? 0 : Math.round(num);
}

export function hasTranscript(transcript: string): boolean {
  return Boolean(transcript && transcript.trim().length > 10);
}

export function parseDialogueTurns(transcript: string): DialogueTurn[] {
  if (!transcript) return [];

  const lines = transcript.split(/\n+/).filter((l) => l.trim());
  const turns: DialogueTurn[] = [];

  for (const line of lines) {
    const botMatch = line.match(/^(бот|bot|assistant|ассистент)\s*[:：\-]\s*(.+)$/i);
    const clientMatch = line.match(/^(клиент|client|user|юзер|абонент)\s*[:：\-]\s*(.+)$/i);

    if (botMatch) {
      turns.push({ role: "bot", text: botMatch[2].trim() });
    } else if (clientMatch) {
      turns.push({ role: "client", text: clientMatch[2].trim() });
    } else if (turns.length > 0) {
      turns[turns.length - 1].text += " " + line.trim();
    } else {
      turns.push({ role: "unknown", text: line.trim() });
    }
  }

  return turns;
}

function getClientTexts(turns: DialogueTurn[]): string[] {
  return turns.filter((t) => t.role === "client").map((t) => t.text);
}

function getBotTexts(turns: DialogueTurn[]): string[] {
  return turns.filter((t) => t.role === "bot").map((t) => t.text);
}

function getAllClientText(turns: DialogueTurn[]): string {
  return getClientTexts(turns).join(" ").toLowerCase();
}

function getAllBotText(turns: DialogueTurn[]): string {
  return getBotTexts(turns).join(" ").toLowerCase();
}

export function detectConsent(turns: DialogueTurn[]): boolean {
  const clientTexts = getClientTexts(turns);
  if (clientTexts.length === 0) return false;

  const firstClient = clientTexts[0].toLowerCase();
  if (containsKeyword(firstClient, NO_TIME_KEYWORDS)) return false;
  if (containsKeyword(firstClient, REJECTION_KEYWORDS)) return false;
  if (containsKeyword(firstClient, NEGATIVE_KEYWORDS)) return false;

  for (const text of clientTexts.slice(0, 3)) {
    if (containsKeyword(text, CONSENT_KEYWORDS)) return true;
    if (text.length > 5 && !containsKeyword(text, DISTRUST_KEYWORDS)) {
      if (!containsKeyword(text, NO_TIME_KEYWORDS) && !containsKeyword(text, REJECTION_KEYWORDS)) {
        return true;
      }
    }
  }
  return false;
}

export function detectOfferReached(turns: DialogueTurn[]): boolean {
  const botTexts = getBotTexts(turns);
  if (botTexts.length < 2) return false;

  const combined = getAllBotText(turns);
  return containsKeyword(combined, OFFER_KEYWORDS) || botTexts.length >= 3;
}

export function detectMeetingOffered(turns: DialogueTurn[]): boolean {
  const botTexts = getBotTexts(turns);
  for (const text of botTexts) {
    if (containsKeyword(text, MEETING_OFFER_KEYWORDS)) return true;
  }
  return false;
}

export function detectMeetingAgreed(turns: DialogueTurn[]): boolean {
  const clientText = getAllClientText(turns);
  return containsKeyword(clientText, MEETING_AGREED_KEYWORDS);
}

export function detectQualificationStarted(turns: DialogueTurn[]): boolean {
  const botTexts = getBotTexts(turns);
  for (const text of botTexts) {
    const lower = text.toLowerCase();
    if (lower.includes("?") && containsKeyword(text, QUALIFICATION_KEYWORDS)) return true;
    if (containsKeyword(text, QUALIFICATION_KEYWORDS) && lower.length > 20) return true;
  }
  return false;
}

export function detectQualificationCompleted(turns: DialogueTurn[]): boolean {
  if (!detectQualificationStarted(turns)) return false;
  const questions = extractQualificationQuestions(turns);
  if (questions.length === 0) return false;
  const answered = questions.filter((q) => q.answered).length;
  return answered >= Math.min(2, questions.length);
}

export function extractQualificationQuestions(turns: DialogueTurn[]): QualificationQuestion[] {
  const questions: QualificationQuestion[] = [];
  const botTexts = getBotTexts(turns);
  const clientTexts = getClientTexts(turns);

  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    if (turn.role !== "bot") continue;
    const lower = turn.text.toLowerCase();
    if (!lower.includes("?") && !containsKeyword(turn.text, QUALIFICATION_KEYWORDS)) continue;

    const nextClient = turns.slice(i + 1).find((t) => t.role === "client");
    const answered = Boolean(
      nextClient &&
        nextClient.text.length > 2 &&
        !containsKeyword(nextClient.text, REJECTION_KEYWORDS) &&
        !containsKeyword(nextClient.text, NO_TIME_KEYWORDS)
    );

    const isLast = i === turns.length - 1 || !nextClient;
    questions.push({
      question: turn.text.slice(0, 120),
      answered,
      dropped: !answered && isLast,
    });
  }

  if (questions.length === 0 && botTexts.length > 0) {
    for (const text of botTexts) {
      if (text.includes("?") && containsKeyword(text, QUALIFICATION_KEYWORDS)) {
        questions.push({ question: text.slice(0, 120), answered: clientTexts.length > 0, dropped: false });
      }
    }
  }

  return questions;
}

export function detectObjectionCategory(turns: DialogueTurn[]): ObjectionCategory | null {
  const clientTexts = getClientTexts(turns);
  for (const text of [...clientTexts].reverse()) {
    if (containsKeyword(text, WHATSAPP_KEYWORDS)) return "whatsapp";
    if (containsKeyword(text, CALLBACK_KEYWORDS)) return "callback_later";
    if (containsKeyword(text, NO_TIME_KEYWORDS)) return "no_time";
    if (containsKeyword(text, NOT_UNDERSTOOD_KEYWORDS)) return "not_understood";
    if (containsKeyword(text, DISTRUST_KEYWORDS)) return "distrust";
    if (containsKeyword(text, ROBOT_KEYWORDS)) return "is_robot";
    if (containsKeyword(text, ALREADY_APPLIED_KEYWORDS)) return "already_applied";
    if (containsKeyword(text, NEGATIVE_KEYWORDS)) return "negative";
    if (containsKeyword(text, REJECTION_KEYWORDS)) return "not_interested";
  }
  return null;
}

export function detectOfferReaction(turns: DialogueTurn[]): OfferReaction | null {
  const offerIdx = turns.findIndex(
    (t) => t.role === "bot" && (containsKeyword(t.text, OFFER_KEYWORDS) || getBotTexts(turns).indexOf(t.text) >= 2)
  );
  if (offerIdx < 0) return null;

  const afterOffer = turns.slice(offerIdx + 1).filter((t) => t.role === "client");
  if (afterOffer.length === 0) return null;

  const text = afterOffer[0].text;
  if (containsKeyword(text, INTEREST_KEYWORDS)) return "interest";
  if (containsKeyword(text, NO_TIME_KEYWORDS)) return "no_time";
  if (containsKeyword(text, DISTRUST_KEYWORDS)) return "distrust";
  if (containsKeyword(text, NOT_UNDERSTOOD_KEYWORDS)) return "confusion";
  if (containsKeyword(text, REJECTION_KEYWORDS)) return "rejection";
  if (text.includes("?")) return "neutral";
  return "other";
}

export function detectMeetingOutcome(turns: DialogueTurn[]): MeetingOutcome {
  if (detectMeetingAgreed(turns)) return "meeting_agreed";
  const clientText = getAllClientText(turns);
  if (containsKeyword(clientText, WHATSAPP_KEYWORDS)) return "whatsapp_requested";
  if (containsKeyword(clientText, CALLBACK_KEYWORDS)) return "callback_requested";
  if (containsKeyword(clientText, REJECTION_KEYWORDS)) return "client_refused";
  if (!detectMeetingOffered(turns)) return "bot_did_not_offer";
  return "unclear";
}

export function detectLastReachedStage(call: Partial<ClassifiedCall>): FunnelStage {
  if (call.qualificationCompleted) return "qualification_completed";
  if (call.qualificationStarted) return "qualification_started";
  if (call.meetingAgreed) return "meeting_agreed";
  if (call.meetingOffered) return "meeting_offered";
  if (call.offerReacted) return "offer_reacted";
  if (call.offerReached) return "offer_reached";
  if (call.consent) return "consent";
  if (call.clientAnswered) return "client_answered";
  if (call.hasDialogue) return "has_dialogue";
  return "all_calls";
}

export function calculateDialogueProgressScore(call: Partial<ClassifiedCall>): number {
  if (!call.hasDialogue) return 0;
  if (call.qualificationCompleted) return 6;
  if (call.meetingAgreed) return 5;
  if (call.meetingOffered) return 4;
  if (call.offerReached) return 3;
  if (call.consent) return 2;
  if (call.clientAnswered) return 1;
  return 0;
}

export function detectDropOffStage(call: ClassifiedCall): string {
  const stage = call.lastReachedStage;
  const transitions: [FunnelStage, FunnelStage][] = [
    ["all_calls", "has_dialogue"],
    ["has_dialogue", "client_answered"],
    ["client_answered", "consent"],
    ["consent", "offer_reached"],
    ["offer_reached", "offer_reacted"],
    ["offer_reacted", "meeting_offered"],
    ["meeting_offered", "meeting_agreed"],
    ["meeting_agreed", "qualification_started"],
    ["qualification_started", "qualification_completed"],
  ];

  for (const [, next] of transitions) {
    const key = next.replace(/_([a-z])/g, (_, c) => c.toUpperCase()) as keyof ClassifiedCall;
    const camelKey = next
      .split("_")
      .map((w, i) => (i === 0 ? w : w[0].toUpperCase() + w.slice(1)))
      .join("") as keyof ClassifiedCall;

    const flags: Record<string, keyof ClassifiedCall> = {
      has_dialogue: "hasDialogue",
      client_answered: "clientAnswered",
      consent: "consent",
      offer_reached: "offerReached",
      offer_reacted: "offerReacted",
      meeting_offered: "meetingOffered",
      meeting_agreed: "meetingAgreed",
      qualification_started: "qualificationStarted",
      qualification_completed: "qualificationCompleted",
    };

    const flag = flags[next];
    if (flag && !call[flag]) {
      return STAGE_LABELS[stage];
    }
  }

  return STAGE_LABELS[stage];
}

export function extractLastClientMessage(turns: DialogueTurn[]): string {
  const clients = getClientTexts(turns);
  return clients[clients.length - 1] || "";
}

export function extractLastBotMessage(turns: DialogueTurn[]): string {
  const bots = getBotTexts(turns);
  return bots[bots.length - 1] || "";
}

export function isTechnicalLoss(hangupReason: string, hasDialogue: boolean): boolean {
  const reason = hangupReason.toLowerCase().trim();
  if (!hasDialogue) return true;
  return TECHNICAL_HANGUP_REASONS.some((r) => reason.includes(r));
}

export function inferLossReason(call: Partial<ClassifiedCall>): string {
  if (call.isTechnicalLoss) return "Техническая потеря";
  if (call.objectionCategory) return OBJECTION_LABELS[call.objectionCategory!];
  if (call.hangupReason === "client_hangup") return "Клиент сбросил";
  if (call.hangupReason === "bot_hangup") return "Бот завершил";
  return "Неопределённая причина";
}

export function classifyCall(
  raw: {
    phone: string;
    dateTime: Date;
    durationSec: number;
    status: string;
    audioUrl: string;
    hangupReason: string;
    transcript: string;
  },
  id: string,
  isFirstCall: boolean
): ClassifiedCall {
  const turns = parseDialogueTurns(raw.transcript);
  const transcriptExists = hasTranscript(raw.transcript);
  const clientTexts = getClientTexts(turns);
  const hasDialogue = transcriptExists && turns.length >= 2;
  const clientAnswered = clientTexts.length > 0;
  const consent = detectConsent(turns);
  const offerReached = detectOfferReached(turns);
  const offerReacted = offerReached && clientTexts.length > 1;
  const meetingOffered = detectMeetingOffered(turns);
  const meetingAgreed = detectMeetingAgreed(turns);
  const qualificationStarted = detectQualificationStarted(turns);
  const qualificationCompleted = detectQualificationCompleted(turns);
  const objectionCategory = detectObjectionCategory(turns);
  const technical = isTechnicalLoss(raw.hangupReason, hasDialogue);

  const partial: Partial<ClassifiedCall> = {
    hasDialogue,
    clientAnswered,
    consent,
    offerReached,
    offerReacted,
    meetingOffered,
    meetingAgreed,
    qualificationStarted,
    qualificationCompleted,
    objectionCategory,
    isTechnicalLoss: technical,
    hangupReason: raw.hangupReason,
  };

  const lastReachedStage = detectLastReachedStage(partial);
  const dialogueProgressScore = calculateDialogueProgressScore(partial);

  const call: ClassifiedCall = {
    id,
    phone: raw.phone,
    dateTime: toValidDate(raw.dateTime),
    durationSec: raw.durationSec,
    status: raw.status,
    audioUrl: raw.audioUrl,
    hangupReason: raw.hangupReason,
    transcript: raw.transcript,
    turns,
    hasTranscript: transcriptExists,
    hasDialogue,
    clientAnswered,
    consent,
    offerReached,
    offerReacted,
    offerReaction: detectOfferReaction(turns),
    meetingOffered,
    meetingAgreed,
    meetingOutcome: detectMeetingOutcome(turns),
    qualificationStarted,
    qualificationCompleted,
    qualificationQuestions: extractQualificationQuestions(turns),
    objectionCategory,
    lastReachedStage,
    dialogueProgressScore,
    dropOffStage: "",
    lastClientMessage: extractLastClientMessage(turns),
    lastBotMessage: extractLastBotMessage(turns),
    lossReason: "",
    isTechnicalLoss: technical,
    isFirstCall,
    priorityScore: 0,
  };

  call.dropOffStage = detectDropOffStage(call);
  call.lossReason = inferLossReason(call);
  call.priorityScore = calculatePriorityScore(call);

  return call;
}

function calculatePriorityScore(call: ClassifiedCall): number {
  let score = 0;
  if (call.offerReached && !call.meetingAgreed) score += 30;
  if (call.consent && call.durationSec > 60 && !call.meetingAgreed) score += 25;
  if (call.offerReaction === "interest" && !call.meetingAgreed) score += 20;
  if (call.objectionCategory === "whatsapp" || call.objectionCategory === "callback_later") score += 15;
  if (call.hangupReason === "client_hangup" && call.offerReached) score += 15;
  if (call.durationSec > 90) score += 10;
  score += call.dialogueProgressScore * 5;
  return score;
}
