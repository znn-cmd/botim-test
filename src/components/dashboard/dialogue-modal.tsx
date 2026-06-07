"use client";

import { X, Copy, ExternalLink, Check } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDashboard } from "./context";
import { formatDateTime, formatDuration } from "@/lib/utils";
import { OBJECTION_LABELS } from "@/lib/types";

export function DialogueModal() {
  const { selectedCall, setSelectedCall } = useDashboard();
  const [copied, setCopied] = useState(false);

  if (!selectedCall) return null;

  const call = selectedCall;
  const lastClientIdx = call.turns.map((t, i) => (t.role === "client" ? i : -1)).filter((i) => i >= 0).pop();

  const copyDialogue = async () => {
    const text = [
      `# Диалог Botamin — ${call.phone}`,
      `Дата: ${formatDateTime(call.dateTime)}`,
      `Длительность: ${formatDuration(call.durationSec)}`,
      `Этап: ${call.dropOffStage}`,
      `Score: ${call.dialogueProgressScore}`,
      `Причина потери: ${call.lossReason}`,
      "",
      "## Расшифровка",
      ...call.turns.map((t) => `${t.role === "bot" ? "Бот" : "Клиент"}: ${t.text}`),
    ].join("\n");

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedCall(null)}>
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Диалог {call.phone}</h2>
            <p className="text-sm text-slate-500">{formatDateTime(call.dateTime)} · {formatDuration(call.durationSec)}</p>
          </div>
          <button onClick={() => setSelectedCall(null)} className="rounded-lg p-2 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div className="flex flex-wrap gap-2">
            <Badge>{call.dropOffStage}</Badge>
            <Badge variant="neutral">Score: {call.dialogueProgressScore}</Badge>
            <Badge variant={call.isTechnicalLoss ? "neutral" : "warning"}>{call.lossReason}</Badge>
            {call.objectionCategory && (
              <Badge variant="bad">{OBJECTION_LABELS[call.objectionCategory]}</Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-slate-500">Статус:</span> {call.status}</div>
            <div><span className="text-slate-500">Завершение:</span> {call.hangupReason}</div>
          </div>

          <div className="space-y-3 rounded-xl bg-slate-50 p-4">
            {call.turns.length === 0 ? (
              <p className="text-sm text-slate-500">Расшифровка отсутствует</p>
            ) : (
              call.turns.map((turn, i) => (
                <div
                  key={i}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    turn.role === "bot"
                      ? "ml-0 mr-8 bg-white text-slate-800"
                      : "ml-8 mr-0 bg-indigo-50 text-indigo-900"
                  } ${i === lastClientIdx ? "ring-2 ring-rose-300" : ""}`}
                >
                  <span className="text-xs font-semibold uppercase opacity-60">
                    {turn.role === "bot" ? "Бот" : "Клиент"}
                  </span>
                  <p className="mt-0.5">{turn.text}</p>
                </div>
              ))
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={copyDialogue}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Скопировано" : "Скопировать для Claude Code"}
            </Button>
            {call.audioUrl && (
              <a href={call.audioUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4" />
                  Аудиозапись
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
