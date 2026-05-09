import { useMemo, useState } from "react";
import { MessageSquare, X, Send, Sparkles, Bot, Target } from "lucide-react";
import { useMissions } from "@/lib/mission-context";
import { initialFleet, missionTypeLabel, missionStatusLabel } from "@/lib/mock-data";
import { useOps } from "@/lib/ops-context";

interface Msg {
  id: number;
  role: "user" | "assistant";
  text: string;
}

const initialMsgs: Msg[] = [
  {
    id: 1,
    role: "assistant",
    text: "Здравствуйте! Я ИИ-помощник COBA. Я в курсе активных миссий, директив оператора и состояния флота. Спросите про статус, телеметрию или попросите запустить задачу.",
  },
];

const suggestions = [
  "Какие активные директивы?",
  "Кто выполняет MIS-001?",
  "Уровень заряда всех дронов",
  "Обнаружил автомобиль, что делать?",
];

export function AIChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>(initialMsgs);
  const [input, setInput] = useState("");
  const { missions } = useMissions();
  const { events, markEventsSeen, appendEvent } = useOps();

  // Активный контекст для ИИ: миссии running / pending с директивами или назначенными дронами
  const activeContext = useMemo(() => {
    const active = missions.filter(
      (m) =>
        (m.status === "running" || m.status === "pending" || m.status === "paused") &&
        (m.directives || (m.droneIds && m.droneIds.length > 0) || m.droneId),
    );
    return active;
  }, [missions]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    const userMsg: Msg = { id: Date.now(), role: "user", text: t };
    setMsgs((m) => [...m, userMsg]);
    setInput("");
    setTimeout(() => {
      const reply: Msg = {
        id: Date.now() + 1,
        role: "assistant",
        text: smartReply(t, activeContext),
      };
      setMsgs((m) => [...m, reply]);
      appendEvent({ level: "info", source: "AI", message: `Оператор отправил побочную инструкцию: ${t}` });
    }, 600);
  };

  const eventFeed = events.slice(0, 6);

  return (
    <>
      {!open && (
        <button
          onClick={() => {
            setOpen(true);
            markEventsSeen();
          }}
          className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-[0_8px_32px_oklch(0.82_0.18_200_/_0.45)] transition-transform hover:scale-105 lg:bottom-6 lg:right-6"
          aria-label="Открыть ИИ-помощника"
        >
          <Sparkles className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-success ring-2 ring-background pulse-dot" />
          {activeContext.length > 0 && (
            <span className="absolute -bottom-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-background bg-accent px-1 font-mono text-[9px] font-bold text-accent-foreground">
              {activeContext.length}
            </span>
          )}
        </button>
      )}

      {open && (
        <div className="fixed bottom-20 right-4 z-40 flex h-[600px] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-border bg-popover shadow-2xl lg:bottom-6 lg:right-6">
          <header className="flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/15 to-accent/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">ИИ-помощник COBA</div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Подключено · DeepSeek
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          {/* Контекст-баннер: активные директивы и дроны */}
          {activeContext.length > 0 && (
            <div className="max-h-32 overflow-y-auto border-b border-accent/30 bg-accent/5 px-3 py-2">
              <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-accent-foreground">
                <Target className="h-3 w-3" />
                Активный контекст · {activeContext.length}
              </div>
              <div className="space-y-1.5">
                {activeContext.map((m) => {
                  const droneIds =
                    m.droneIds && m.droneIds.length > 0
                      ? m.droneIds
                      : m.droneId
                        ? [m.droneId]
                        : [];
                  const droneNames = droneIds
                    .map((id) => initialFleet.find((d) => d.id === id)?.name ?? id)
                    .join(", ");
                  return (
                    <div
                      key={m.id}
                      className="rounded border border-border/60 bg-card/60 p-1.5 text-[10px]"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-muted-foreground">{m.id}</span>
                        <span className="font-semibold text-foreground">{m.name}</span>
                        {m.priority && m.priority !== "normal" && (
                          <span
                            className={[
                              "rounded px-1 font-mono text-[8px] uppercase",
                              m.priority === "critical" && "bg-destructive/20 text-destructive",
                              m.priority === "high" && "bg-warning/20 text-warning",
                              m.priority === "low" && "bg-secondary text-muted-foreground",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            {m.priority}
                          </span>
                        )}
                      </div>
                      {droneNames && (
                        <div className="mt-0.5 text-muted-foreground">
                          🛸 {droneNames}
                        </div>
                      )}
                      {m.directives && (
                        <div className="mt-0.5 line-clamp-2 italic text-foreground/80">
                          ✦ {m.directives}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            <div className="rounded-lg border border-border bg-card/40 p-3">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                События всех дронов · realtime
              </div>
              <div className="space-y-2">
                {eventFeed.map((event) => (
                  <div key={event.id} className="text-[11px] leading-relaxed text-muted-foreground">
                    <span className="font-mono text-primary">{event.timestamp}</span> · <span className="text-foreground">{event.source}</span> · {event.message}
                  </div>
                ))}
              </div>
            </div>

            {msgs.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={[
                    "max-w-[85%] whitespace-pre-line rounded-lg px-3 py-2 text-sm leading-relaxed",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground",
                  ].join(" ")}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border bg-card/50 p-3">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {s}
                </button>
              ))}
              {[
                "Сделать фото",
                "Изучить объект",
                "Собрать данные",
                "Вернуть домой",
              ].map((action) => (
                <button
                  key={action}
                  onClick={() => send(action)}
                  className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] text-primary transition-colors hover:bg-primary/15"
                >
                  {action}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 rounded-md border border-border bg-input px-3 py-2"
            >
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Напишите сообщение…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function smartReply(q: string, context: ReturnType<typeof useMissions>["missions"]): string {
  const lower = q.toLowerCase();

  // Директивы
  if (lower.includes("директив") || lower.includes("услов") || lower.includes("инструкц")) {
    if (context.length === 0) {
      return "Сейчас нет активных миссий с заданными директивами. Откройте «Миссии», выберите миссию и нажмите «Изменить» рядом с «Условности миссии».";
    }
    return (
      "Активные директивы оператора:\n\n" +
      context
        .filter((m) => m.directives)
        .map((m) => `• ${m.id} «${m.name}»${m.priority && m.priority !== "normal" ? ` [${m.priority}]` : ""}:\n  ${m.directives}`)
        .join("\n\n")
    );
  }

  // Кто выполняет MIS-XXX
  const misMatch = lower.match(/mis[-\s]?(\d{1,3})/i);
  if (misMatch) {
    const id = `MIS-${misMatch[1].padStart(3, "0")}`;
    const m = context.find((x) => x.id.toUpperCase() === id) ?? context[0];
    if (!m) return `Миссия ${id} не найдена в активном контексте.`;
    const droneIds = m.droneIds && m.droneIds.length > 0 ? m.droneIds : m.droneId ? [m.droneId] : [];
    const drones = droneIds.map((d) => initialFleet.find((f) => f.id === d)?.name ?? d).join(", ");
    return (
      `${m.id} «${m.name}»\n` +
      `Тип: ${missionTypeLabel[m.type]}\n` +
      `Статус: ${missionStatusLabel[m.status]}, прогресс ${m.progress}%\n` +
      `Исполнители: ${drones || "не назначены"}\n` +
      (m.priority ? `Приоритет: ${m.priority}\n` : "") +
      (m.directives ? `\n✦ Директивы: ${m.directives}` : "")
    );
  }

  if (lower.includes("стат") && lower.includes("mis")) {
    return "MIS-001 «Патруль периметра №7» — выполняется, прогресс 64%, дрон COBA-Alpha, заряд 64%. Расчётное время до завершения: 6 минут.";
  }
  if (lower.includes("заряд") || lower.includes("батаре")) {
    return "Текущий заряд флота:\n• COBA-Alpha — 64%\n• COBA-Bravo — 92%\n• COBA-Charlie — 38% (на зарядке)\n• COBA-Delta — 71%\n• COBA-Foxtrot — 100%\n\nСредний заряд активных дронов: 76%.";
  }
  if (lower.includes("патрул") || lower.includes("запус")) {
    const ctxNote = context.find((m) => m.directives)
      ? `\n\nУчту активные директивы: «${context.find((m) => m.directives)?.directives}»`
      : "";
    return `Готов запустить миссию «Патруль периметра». Использовать дрон COBA-Bravo (92%)? Подтвердите командой «да».${ctxNote}`;
  }
  if (lower.includes("погод")) {
    return "Текущие условия: ветер 7 м/с (С-З), видимость 10 км, температура +12 °C. Условия пригодны для полётов.";
  }

  const ctxHint = context.length > 0
    ? `\n\nВ работе сейчас: ${context.map((m) => m.id).join(", ")}.`
    : "";
  return `Принято. Обрабатываю запрос… (демо-режим — подключите DeepSeek API в Настройках, чтобы получать живые ответы).${ctxHint}`;
}
