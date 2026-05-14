import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { P as PageHeader, S as StatCard, a as Panel } from "./Panel-DCNe0G5R.js";
import { u as useOps } from "./router-BHqUf-SS.js";
import { Upload, Database, HardDrive, RotateCcw, Download, Trash2 } from "lucide-react";
import "@tanstack/react-router";
import "react";
import "@radix-ui/react-popover";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-slot";
import "class-variance-authority";
function downloadBlob(filename, content, mime) {
  const blob = new Blob([content], {
    type: mime
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
function BackupsPage() {
  const {
    backups,
    createBackup,
    restoreBackup,
    deleteBackup
  } = useOps();
  const total = backups.length;
  const totalSize = `${(backups.reduce((sum, item) => sum + parseFloat(item.size), 0) / 1e3).toFixed(2)} ГБ`;
  const exportBackup = (b) => {
    const payload = JSON.stringify({
      ...b,
      exportedAt: (/* @__PURE__ */ new Date()).toISOString()
    }, null, 2);
    downloadBlob(`${b.name}.json`, payload, "application/json");
  };
  const exportReport = (format) => {
    const stats = {
      missionsCompleted: 18,
      avgDurationMin: 24,
      commsIncidents: 3,
      generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      backups: backups.map((b) => ({
        id: b.id,
        name: b.name,
        size: b.size,
        type: b.type,
        createdAt: b.createdAt
      }))
    };
    if (format === "json" || format === "external") {
      downloadBlob(`mission_report_${Date.now()}.json`, JSON.stringify(stats, null, 2), "application/json");
    } else {
      const header = "id,name,size,type,createdAt\n";
      const body = stats.backups.map((b) => `${b.id},${b.name},${b.size},${b.type},${b.createdAt}`).join("\n");
      downloadBlob(`mission_report_${Date.now()}.csv`, header + body, "text/csv");
    }
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PageHeader, { title: "Бэкапы", description: "Резервное копирование, восстановление и история", badge: "Авто-бэкап включён", actions: /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("button", { className: "inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-secondary", children: [
        /* @__PURE__ */ jsx(Upload, { className: "h-4 w-4" }),
        " Загрузить"
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: () => createBackup("manual"), className: "inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90", children: [
        /* @__PURE__ */ jsx(Database, { className: "h-4 w-4" }),
        " Создать копию"
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 lg:grid-cols-4", children: [
      /* @__PURE__ */ jsx(StatCard, { label: "Всего копий", value: total, tone: "primary", icon: /* @__PURE__ */ jsx(Database, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx(StatCard, { label: "Общий размер", value: totalSize, tone: "default", icon: /* @__PURE__ */ jsx(HardDrive, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx(StatCard, { label: "Авто", value: backups.filter((b) => b.type === "auto").length, tone: "success" }),
      /* @__PURE__ */ jsx(StatCard, { label: "Последний", value: "06:00", tone: "warning" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 grid gap-4 lg:grid-cols-3", children: [
      /* @__PURE__ */ jsx(Panel, { title: "Хранилище", subtitle: "Использовано 1.19 ГБ из 10 ГБ", children: /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsx("div", { className: "h-2 w-full overflow-hidden rounded-full bg-secondary", children: /* @__PURE__ */ jsx("div", { className: "h-full rounded-full bg-gradient-to-r from-primary to-accent", style: {
          width: "12%"
        } }) }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-2 text-center", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-border bg-card/50 p-2", children: [
            /* @__PURE__ */ jsx("div", { className: "font-mono text-[10px] text-muted-foreground", children: "Использ." }),
            /* @__PURE__ */ jsx("div", { className: "font-mono text-sm font-semibold text-primary", children: "1.19 ГБ" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-border bg-card/50 p-2", children: [
            /* @__PURE__ */ jsx("div", { className: "font-mono text-[10px] text-muted-foreground", children: "Свободно" }),
            /* @__PURE__ */ jsx("div", { className: "font-mono text-sm font-semibold text-success", children: "8.81 ГБ" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-border bg-card/50 p-2", children: [
            /* @__PURE__ */ jsx("div", { className: "font-mono text-[10px] text-muted-foreground", children: "Лимит" }),
            /* @__PURE__ */ jsx("div", { className: "font-mono text-sm font-semibold text-foreground", children: "10 ГБ" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "rounded-md border border-info/30 bg-info/10 p-3 text-xs text-info", children: "ℹ Авто-бэкап выполняется ежедневно в 06:00. Срок хранения: 30 дней." })
      ] }) }),
      /* @__PURE__ */ jsx(Panel, { title: "История бэкапов", className: "lg:col-span-2", padded: false, children: /* @__PURE__ */ jsx("div", { className: "divide-y divide-border", children: backups.map((b) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 px-5 py-3", children: [
        /* @__PURE__ */ jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-md bg-primary/15 text-primary", children: /* @__PURE__ */ jsx(Database, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsx("div", { className: "truncate font-mono text-sm font-semibold text-foreground", children: b.name }),
          /* @__PURE__ */ jsxs("div", { className: "mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground", children: [
            /* @__PURE__ */ jsx("span", { children: b.createdAt }),
            /* @__PURE__ */ jsx("span", { children: "·" }),
            /* @__PURE__ */ jsx("span", { children: b.size }),
            /* @__PURE__ */ jsx("span", { children: "·" }),
            /* @__PURE__ */ jsx("span", { className: ["rounded px-1.5 py-0.5 font-mono uppercase tracking-wider", b.type === "auto" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"].join(" "), children: b.type })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsx("button", { onClick: () => restoreBackup(b), className: "rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-primary", title: "Восстановить", children: /* @__PURE__ */ jsx(RotateCcw, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsx("button", { onClick: () => exportBackup(b), className: "rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground", title: "Скачать JSON", children: /* @__PURE__ */ jsx(Download, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsx("button", { onClick: () => deleteBackup(b.id), className: "rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-destructive", title: "Удалить", children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) })
        ] })
      ] }, b.id)) }) }),
      /* @__PURE__ */ jsx(Panel, { title: "Отчёты о миссиях", className: "lg:col-span-3", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-4 lg:grid-cols-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-border bg-card/40 p-3", children: [
          /* @__PURE__ */ jsx("div", { className: "font-mono text-[10px] uppercase tracking-wider text-muted-foreground", children: "Статистика" }),
          /* @__PURE__ */ jsxs("div", { className: "mt-2 space-y-2 text-sm text-foreground", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              "Выполнено миссий: ",
              /* @__PURE__ */ jsx("span", { className: "font-mono text-primary", children: "18" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              "Средняя длительность: ",
              /* @__PURE__ */ jsx("span", { className: "font-mono", children: "24 мин" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              "Инциденты связи: ",
              /* @__PURE__ */ jsx("span", { className: "font-mono text-warning", children: "3" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-border bg-card/40 p-3 lg:col-span-2", children: [
          /* @__PURE__ */ jsx("div", { className: "font-mono text-[10px] uppercase tracking-wider text-muted-foreground", children: "Анализ и экспорт" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs leading-relaxed text-muted-foreground", children: "Последние миссии завершены стабильно, но для участков с multi-hop связью стоит включить более ранний переход в резервный маршрут и расширить окно буфера телеметрии." }),
          /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [
            /* @__PURE__ */ jsx("button", { onClick: () => exportReport("csv"), className: "rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary", children: "Экспорт CSV" }),
            /* @__PURE__ */ jsx("button", { onClick: () => exportReport("json"), className: "rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary", children: "Экспорт JSON" }),
            /* @__PURE__ */ jsx("button", { onClick: () => exportReport("external"), className: "rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary", children: "Для внешних систем" })
          ] })
        ] })
      ] }) })
    ] })
  ] });
}
export {
  BackupsPage as component
};
