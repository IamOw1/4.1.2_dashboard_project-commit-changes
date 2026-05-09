import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel, StatCard } from "@/components/dashboard/Panel";
import { type EventLog } from "@/lib/mock-data";
import { useOps } from "@/lib/ops-context";
import {
  CircleAlert,
  CircleCheck,
  Info,
  XCircle,
  Search,
  Download,
  Bell,
  BellOff,
} from "lucide-react";

const NOTIFY_STORAGE_KEY = "coba.notify.v1";
type NotifyConfig = {
  email: { enabled: boolean; address: string };
  telegram: { enabled: boolean; chatId: string };
  webhook: { enabled: boolean; url: string };
};
const defaultNotify: NotifyConfig = {
  email: { enabled: true, address: "" },
  telegram: { enabled: true, chatId: "" },
  webhook: { enabled: false, url: "" },
};

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Журнал событий · COBA AI" },
      { name: "description", content: "Журнал событий и уведомлений системы COBA AI." },
    ],
  }),
  component: EventsPage,
});

const levelMeta: Record<EventLog["level"], { label: string; icon: typeof Info; tone: string }> = {
  info: { label: "Инфо", icon: Info, tone: "text-info" },
  warning: { label: "Предупр.", icon: CircleAlert, tone: "text-warning" },
  error: { label: "Ошибка", icon: XCircle, tone: "text-destructive" },
  success: { label: "Успех", icon: CircleCheck, tone: "text-success" },
};

function EventsPage() {
  const { events } = useOps();
  const [filter, setFilter] = useState<EventLog["level"] | "all">("all");
  const [q, setQ] = useState("");
  const [notify, setNotify] = useState<NotifyConfig>(defaultNotify);
  const [savedHint, setSavedHint] = useState(false);

  // load + persist notify config in localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(NOTIFY_STORAGE_KEY);
      if (raw) setNotify({ ...defaultNotify, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(NOTIFY_STORAGE_KEY, JSON.stringify(notify));
    } catch {
      /* ignore */
    }
  }, [notify]);

  const updateChannel = <K extends keyof NotifyConfig>(channel: K, patch: Partial<NotifyConfig[K]>) => {
    setNotify((prev) => ({ ...prev, [channel]: { ...prev[channel], ...patch } }));
  };

  const saveNotifications = () => {
    setSavedHint(true);
    window.setTimeout(() => setSavedHint(false), 1800);
  };

  const exportLogs = (format: "csv" | "json" | "txt") => {
    const rows = filtered;
    const content =
      format === "json"
        ? JSON.stringify(rows, null, 2)
        : format === "txt"
          ? rows.map((e) => `[${e.timestamp}] ${e.level.toUpperCase()} ${e.source}: ${e.message}`).join("\n")
          : "timestamp,level,source,message\n" + rows.map((e) => `${e.timestamp},${e.level},${e.source},\"${e.message.replaceAll('"', '""')}\"`).join("\n");
    const blob = new Blob([content], { type: format === "json" ? "application/json" : format === "txt" ? "text/plain" : "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `events_export.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = events.filter((e) => {
    if (filter !== "all" && e.level !== filter) return false;
    if (q && !`${e.message} ${e.source}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const counts = useMemo(() => ({
    info: events.filter((e) => e.level === "info").length,
    warning: events.filter((e) => e.level === "warning").length,
    error: events.filter((e) => e.level === "error").length,
    success: events.filter((e) => e.level === "success").length,
  }), [events]);

  return (
    <>
      <PageHeader
        title="Журнал событий"
        description="Лог системных событий, ошибок и уведомлений"
        badge={`${events.length} событий`}
        actions={
          <div className="flex gap-2">
            <button onClick={() => exportLogs("csv")} className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-secondary">
              <Download className="h-4 w-4" /> CSV
            </button>
            <button onClick={() => exportLogs("json")} className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-secondary">JSON</button>
            <button onClick={() => exportLogs("txt")} className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-secondary">TXT</button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Инфо" value={counts.info} tone="default" icon={<Info className="h-4 w-4" />} />
        <StatCard label="Успех" value={counts.success} tone="success" icon={<CircleCheck className="h-4 w-4" />} />
        <StatCard label="Предупреждения" value={counts.warning} tone="warning" icon={<CircleAlert className="h-4 w-4" />} />
        <StatCard label="Ошибки" value={counts.error} tone="destructive" icon={<XCircle className="h-4 w-4" />} />
      </div>

      <div className="mt-6 mb-3 flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск по сообщению или источнику…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-1.5">
          {(["all", "info", "success", "warning", "error"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setFilter(l)}
              className={[
                "rounded-md border px-3 py-1.5 text-xs font-medium",
                filter === l
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {l === "all" ? "Все" : levelMeta[l].label}
            </button>
          ))}
        </div>
      </div>

      <Panel title="Каналы уведомлений" subtitle="Настройка адресатов и каналов доставки. Сохраняется локально для текущего оператора." className="mb-4">
        <div className="grid gap-3 lg:grid-cols-3">
          <ChannelCard
            title="Email"
            enabled={notify.email.enabled}
            onToggle={(v) => updateChannel("email", { enabled: v })}
            placeholder="ops@example.com"
            value={notify.email.address}
            onChange={(v) => updateChannel("email", { address: v })}
            hint="Адрес получателя для критических событий"
          />
          <ChannelCard
            title="Telegram"
            enabled={notify.telegram.enabled}
            onToggle={(v) => updateChannel("telegram", { enabled: v })}
            placeholder="@operator или 123456789"
            value={notify.telegram.chatId}
            onChange={(v) => updateChannel("telegram", { chatId: v })}
            hint="Username или chat ID бота"
          />
          <ChannelCard
            title="Webhook"
            enabled={notify.webhook.enabled}
            onToggle={(v) => updateChannel("webhook", { enabled: v })}
            placeholder="https://example.com/hook"
            value={notify.webhook.url}
            onChange={(v) => updateChannel("webhook", { url: v })}
            hint="HTTPS endpoint для POST-уведомлений"
          />
        </div>
        <div className="mt-3 flex items-center justify-end gap-2">
          {savedHint && <span className="text-xs text-success">Сохранено</span>}
          <button
            onClick={saveNotifications}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            Применить настройки
          </button>
        </div>
      </Panel>

      <Panel padded={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 text-xs">
          <span className="font-mono uppercase tracking-wider text-muted-foreground">Активные каналы:</span>
          {(["email", "telegram", "webhook"] as const).map((key) => {
            const ch = notify[key];
            return (
              <span key={key} className={[
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1",
                ch.enabled ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground",
              ].join(" ")}>
                {ch.enabled ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}
                {key}
              </span>
            );
          })}
        </div>
        <div className="divide-y divide-border">
          {filtered.map((e) => {
            const m = levelMeta[e.level];
            const Icon = m.icon;
            return (
              <div key={e.id} className="flex items-start gap-3 px-4 py-3 hover:bg-secondary/30">
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${m.tone}`} />
                <span className="font-mono text-[11px] text-muted-foreground w-20 shrink-0">{e.timestamp}</span>
                <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground w-20 text-center shrink-0">
                  {e.source}
                </span>
                <span className="text-sm text-foreground">{e.message}</span>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">Событий не найдено</div>
          )}
        </div>
      </Panel>
    </>
  );
}

function ChannelCard({
  title,
  enabled,
  onToggle,
  placeholder,
  value,
  onChange,
  hint,
}: {
  title: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  hint: string;
}) {
  return (
    <div className={[
      "rounded-md border p-3 transition-colors",
      enabled ? "border-primary/40 bg-primary/5" : "border-border bg-card/40",
    ].join(" ")}>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold text-foreground">{title}</div>
        <button
          onClick={() => onToggle(!enabled)}
          className={[
            "rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase",
            enabled ? "border-primary bg-primary/15 text-primary" : "border-border bg-card text-muted-foreground",
          ].join(" ")}
        >
          {enabled ? "ON" : "OFF"}
        </button>
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={!enabled}
        className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary disabled:opacity-50"
      />
      <div className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">{hint}</div>
    </div>
  );
}
