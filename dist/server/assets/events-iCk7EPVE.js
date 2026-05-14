import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { P as PageHeader, S as StatCard, a as Panel } from "./Panel-DCNe0G5R.js";
import { u as useOps } from "./router-BHqUf-SS.js";
import { Download, Info, CircleCheck, CircleAlert, XCircle, Search, Bell, BellOff } from "lucide-react";
import "@tanstack/react-router";
import "@radix-ui/react-popover";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-slot";
import "class-variance-authority";
const NOTIFY_STORAGE_KEY = "coba.notify.v1";
const defaultNotify = {
  email: {
    enabled: true,
    address: ""
  },
  telegram: {
    enabled: true,
    chatId: ""
  },
  webhook: {
    enabled: false,
    url: ""
  }
};
const levelMeta = {
  info: {
    label: "Инфо",
    icon: Info,
    tone: "text-info"
  },
  warning: {
    label: "Предупр.",
    icon: CircleAlert,
    tone: "text-warning"
  },
  error: {
    label: "Ошибка",
    icon: XCircle,
    tone: "text-destructive"
  },
  success: {
    label: "Успех",
    icon: CircleCheck,
    tone: "text-success"
  }
};
function EventsPage() {
  const {
    events
  } = useOps();
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [notify, setNotify] = useState(defaultNotify);
  const [savedHint, setSavedHint] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(NOTIFY_STORAGE_KEY);
      if (raw) setNotify({
        ...defaultNotify,
        ...JSON.parse(raw)
      });
    } catch {
    }
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(NOTIFY_STORAGE_KEY, JSON.stringify(notify));
    } catch {
    }
  }, [notify]);
  const updateChannel = (channel, patch) => {
    setNotify((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        ...patch
      }
    }));
  };
  const saveNotifications = () => {
    setSavedHint(true);
    window.setTimeout(() => setSavedHint(false), 1800);
  };
  const exportLogs = (format) => {
    const rows = filtered;
    const content = format === "json" ? JSON.stringify(rows, null, 2) : format === "txt" ? rows.map((e) => `[${e.timestamp}] ${e.level.toUpperCase()} ${e.source}: ${e.message}`).join("\n") : "timestamp,level,source,message\n" + rows.map((e) => `${e.timestamp},${e.level},${e.source},"${e.message.replaceAll('"', '""')}"`).join("\n");
    const blob = new Blob([content], {
      type: format === "json" ? "application/json" : format === "txt" ? "text/plain" : "text/csv"
    });
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
    success: events.filter((e) => e.level === "success").length
  }), [events]);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PageHeader, { title: "Журнал событий", description: "Лог системных событий, ошибок и уведомлений", badge: `${events.length} событий`, actions: /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsxs("button", { onClick: () => exportLogs("csv"), className: "inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-secondary", children: [
        /* @__PURE__ */ jsx(Download, { className: "h-4 w-4" }),
        " CSV"
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: () => exportLogs("json"), className: "inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-secondary", children: "JSON" }),
      /* @__PURE__ */ jsx("button", { onClick: () => exportLogs("txt"), className: "inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-secondary", children: "TXT" })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 lg:grid-cols-4", children: [
      /* @__PURE__ */ jsx(StatCard, { label: "Инфо", value: counts.info, tone: "default", icon: /* @__PURE__ */ jsx(Info, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx(StatCard, { label: "Успех", value: counts.success, tone: "success", icon: /* @__PURE__ */ jsx(CircleCheck, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx(StatCard, { label: "Предупреждения", value: counts.warning, tone: "warning", icon: /* @__PURE__ */ jsx(CircleAlert, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx(StatCard, { label: "Ошибки", value: counts.error, tone: "destructive", icon: /* @__PURE__ */ jsx(XCircle, { className: "h-4 w-4" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 mb-3 flex flex-wrap items-center gap-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-1 items-center gap-2 rounded-md border border-border bg-card px-3 py-2", children: [
        /* @__PURE__ */ jsx(Search, { className: "h-4 w-4 text-muted-foreground" }),
        /* @__PURE__ */ jsx("input", { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Поиск по сообщению или источнику…", className: "w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex gap-1.5", children: ["all", "info", "success", "warning", "error"].map((l) => /* @__PURE__ */ jsx("button", { onClick: () => setFilter(l), className: ["rounded-md border px-3 py-1.5 text-xs font-medium", filter === l ? "border-primary bg-primary/15 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground"].join(" "), children: l === "all" ? "Все" : levelMeta[l].label }, l)) })
    ] }),
    /* @__PURE__ */ jsxs(Panel, { title: "Каналы уведомлений", subtitle: "Настройка адресатов и каналов доставки. Сохраняется локально для текущего оператора.", className: "mb-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid gap-3 lg:grid-cols-3", children: [
        /* @__PURE__ */ jsx(ChannelCard, { title: "Email", enabled: notify.email.enabled, onToggle: (v) => updateChannel("email", {
          enabled: v
        }), placeholder: "ops@example.com", value: notify.email.address, onChange: (v) => updateChannel("email", {
          address: v
        }), hint: "Адрес получателя для критических событий" }),
        /* @__PURE__ */ jsx(ChannelCard, { title: "Telegram", enabled: notify.telegram.enabled, onToggle: (v) => updateChannel("telegram", {
          enabled: v
        }), placeholder: "@operator или 123456789", value: notify.telegram.chatId, onChange: (v) => updateChannel("telegram", {
          chatId: v
        }), hint: "Username или chat ID бота" }),
        /* @__PURE__ */ jsx(ChannelCard, { title: "Webhook", enabled: notify.webhook.enabled, onToggle: (v) => updateChannel("webhook", {
          enabled: v
        }), placeholder: "https://example.com/hook", value: notify.webhook.url, onChange: (v) => updateChannel("webhook", {
          url: v
        }), hint: "HTTPS endpoint для POST-уведомлений" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-center justify-end gap-2", children: [
        savedHint && /* @__PURE__ */ jsx("span", { className: "text-xs text-success", children: "Сохранено" }),
        /* @__PURE__ */ jsx("button", { onClick: saveNotifications, className: "inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90", children: "Применить настройки" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Panel, { padded: false, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 text-xs", children: [
        /* @__PURE__ */ jsx("span", { className: "font-mono uppercase tracking-wider text-muted-foreground", children: "Активные каналы:" }),
        ["email", "telegram", "webhook"].map((key) => {
          const ch = notify[key];
          return /* @__PURE__ */ jsxs("span", { className: ["inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1", ch.enabled ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"].join(" "), children: [
            ch.enabled ? /* @__PURE__ */ jsx(Bell, { className: "h-3 w-3" }) : /* @__PURE__ */ jsx(BellOff, { className: "h-3 w-3" }),
            key
          ] }, key);
        })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "divide-y divide-border", children: [
        filtered.map((e) => {
          const m = levelMeta[e.level];
          const Icon = m.icon;
          return /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 px-4 py-3 hover:bg-secondary/30", children: [
            /* @__PURE__ */ jsx(Icon, { className: `mt-0.5 h-4 w-4 shrink-0 ${m.tone}` }),
            /* @__PURE__ */ jsx("span", { className: "font-mono text-[11px] text-muted-foreground w-20 shrink-0", children: e.timestamp }),
            /* @__PURE__ */ jsx("span", { className: "rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground w-20 text-center shrink-0", children: e.source }),
            /* @__PURE__ */ jsx("span", { className: "text-sm text-foreground", children: e.message })
          ] }, e.id);
        }),
        filtered.length === 0 && /* @__PURE__ */ jsx("div", { className: "py-12 text-center text-sm text-muted-foreground", children: "Событий не найдено" })
      ] })
    ] })
  ] });
}
function ChannelCard({
  title,
  enabled,
  onToggle,
  placeholder,
  value,
  onChange,
  hint
}) {
  return /* @__PURE__ */ jsxs("div", { className: ["rounded-md border p-3 transition-colors", enabled ? "border-primary/40 bg-primary/5" : "border-border bg-card/40"].join(" "), children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-2 flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold text-foreground", children: title }),
      /* @__PURE__ */ jsx("button", { onClick: () => onToggle(!enabled), className: ["rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase", enabled ? "border-primary bg-primary/15 text-primary" : "border-border bg-card text-muted-foreground"].join(" "), children: enabled ? "ON" : "OFF" })
    ] }),
    /* @__PURE__ */ jsx("input", { value, onChange: (e) => onChange(e.target.value), placeholder, disabled: !enabled, className: "w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary disabled:opacity-50" }),
    /* @__PURE__ */ jsx("div", { className: "mt-1.5 text-[10px] leading-relaxed text-muted-foreground", children: hint })
  ] });
}
export {
  EventsPage as component
};
