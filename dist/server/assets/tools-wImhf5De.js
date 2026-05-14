import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { P as PageHeader, S as StatCard, a as Panel } from "./Panel-DCNe0G5R.js";
import { u as useOps, i as initialTools } from "./router-BHqUf-SS.js";
import { SlidersHorizontal, CircleCheck, CircleAlert, Power, Settings, FlaskConical, Save } from "lucide-react";
import "@tanstack/react-router";
import "@radix-ui/react-popover";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-slot";
import "class-variance-authority";
function ToolsPage() {
  const {
    appendEvent
  } = useOps();
  const [tools, setTools] = useState(initialTools);
  const [filter, setFilter] = useState("Все");
  const [sort, setSort] = useState("group");
  const [selectedToolId, setSelectedToolId] = useState(initialTools[0]?.id ?? "");
  const [confidence, setConfidence] = useState(75);
  const [objectSize, setObjectSize] = useState(50);
  const [autoApproach, setAutoApproach] = useState(true);
  const [triplePhoto, setTriplePhoto] = useState(true);
  const [notifyOperator, setNotifyOperator] = useState(false);
  const categories = ["Все", ...Array.from(new Set(tools.map((t) => t.category)))];
  const filtered = useMemo(() => {
    const base = filter === "Все" ? tools : tools.filter((t) => t.category === filter);
    return [...base].sort((a, b) => {
      if (sort === "alpha") return a.name.localeCompare(b.name, "ru");
      if (sort === "usage") return Number(b.enabled) - Number(a.enabled);
      return a.category.localeCompare(b.category, "ru") || a.name.localeCompare(b.name, "ru");
    });
  }, [filter, sort, tools]);
  const selectedTool = tools.find((tool) => tool.id === selectedToolId) ?? filtered[0] ?? tools[0];
  const enabled = tools.filter((t) => t.enabled).length;
  const warnings = tools.filter((t) => t.status === "warning").length;
  const errors = tools.filter((t) => t.status === "error").length;
  const toggle = (id) => setTools((arr) => arr.map((t) => t.id === id ? {
    ...t,
    enabled: !t.enabled
  } : t));
  const applySettings = () => {
    appendEvent({
      level: "success",
      source: "Tools",
      message: `Настройки модуля ${selectedTool?.name} применены к текущей сессии`
    });
  };
  const saveProfile = () => {
    appendEvent({
      level: "info",
      source: "Tools",
      message: `Профиль настроек для ${selectedTool?.name} сохранён`
    });
  };
  const runToolTest = () => {
    appendEvent({
      level: selectedTool?.id === "t2" ? "success" : "info",
      source: "Tools",
      message: `Тест модуля ${selectedTool?.name}: ${selectedTool?.id === "t2" ? "готов к работе" : "проверка завершена без ошибок"}`
    });
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PageHeader, { title: "Инструменты", description: "13 интегрированных модулей · конфигурация и диагностика", badge: `${enabled} активны`, actions: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(SlidersHorizontal, { className: "h-4 w-4 text-primary" }),
      /* @__PURE__ */ jsxs("select", { value: sort, onChange: (e) => setSort(e.target.value), className: "rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground", children: [
        /* @__PURE__ */ jsx("option", { value: "group", children: "По группам" }),
        /* @__PURE__ */ jsx("option", { value: "alpha", children: "По алфавиту" }),
        /* @__PURE__ */ jsx("option", { value: "usage", children: "По активности" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 lg:grid-cols-4", children: [
      /* @__PURE__ */ jsx(StatCard, { label: "Всего модулей", value: tools.length, tone: "primary" }),
      /* @__PURE__ */ jsx(StatCard, { label: "Активных", value: enabled, tone: "success", icon: /* @__PURE__ */ jsx(CircleCheck, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx(StatCard, { label: "Предупреждения", value: warnings, tone: "warning", icon: /* @__PURE__ */ jsx(CircleAlert, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx(StatCard, { label: "Ошибки", value: errors, tone: "destructive" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-6 mb-3 flex flex-wrap gap-1.5", children: categories.map((c) => /* @__PURE__ */ jsx("button", { onClick: () => setFilter(c), className: ["rounded-full border px-3 py-1 text-xs font-medium transition-colors", filter === c ? "border-primary bg-primary/15 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground"].join(" "), children: c }, c)) }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-4 xl:grid-cols-[1.5fr_0.9fr]", children: [
      /* @__PURE__ */ jsx("div", { className: "grid gap-3 md:grid-cols-2", children: filtered.map((t) => /* @__PURE__ */ jsxs("div", { className: "panel relative flex flex-col p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-2 flex items-start justify-between gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("span", { className: "rounded bg-secondary px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground", children: t.category }),
              t.status === "warning" && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-[10px] text-warning", children: [
                /* @__PURE__ */ jsx(CircleAlert, { className: "h-3 w-3" }),
                " warn"
              ] }),
              t.status === "error" && /* @__PURE__ */ jsx("span", { className: "text-[10px] text-destructive", children: "error" })
            ] }),
            /* @__PURE__ */ jsx("button", { onClick: () => setSelectedToolId(t.id), className: "mt-1.5 text-left text-sm font-semibold text-foreground hover:text-primary", children: t.name })
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: () => {
            toggle(t.id);
            appendEvent({
              level: "info",
              source: "Tools",
              message: `${t.name}: ${t.enabled ? "выключен" : "включён"}`
            });
          }, className: ["relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors", t.enabled ? "bg-primary" : "bg-secondary"].join(" "), children: /* @__PURE__ */ jsx("span", { className: ["inline-block h-5 w-5 transform rounded-full bg-background shadow-md transition-transform", t.enabled ? "translate-x-5" : "translate-x-0.5"].join(" ") }) })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mb-3 flex-1 text-xs leading-relaxed text-muted-foreground", children: t.description }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-t border-border pt-3", children: [
          /* @__PURE__ */ jsxs("span", { className: ["flex items-center gap-1.5 text-[11px] font-medium", t.enabled ? "text-success" : "text-muted-foreground"].join(" "), children: [
            /* @__PURE__ */ jsx(Power, { className: "h-3 w-3" }),
            t.enabled ? "Включён" : "Выключен"
          ] }),
          /* @__PURE__ */ jsxs("button", { onClick: () => setSelectedToolId(t.id), className: "inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary", children: [
            /* @__PURE__ */ jsx(Settings, { className: "h-3 w-3" }),
            " Настроить"
          ] })
        ] })
      ] }, t.id)) }),
      /* @__PURE__ */ jsx(Panel, { title: "Настройки выбранного инструмента", subtitle: selectedTool?.name ?? "Модуль не выбран", children: /* @__PURE__ */ jsxs("div", { className: "space-y-4 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-border bg-card/40 p-3 text-xs leading-relaxed text-muted-foreground", children: [
          /* @__PURE__ */ jsx("div", { className: "mb-1 font-semibold text-foreground", children: "Описание" }),
          selectedTool?.description,
          /* @__PURE__ */ jsx("div", { className: "mt-3 font-semibold text-foreground", children: "Пример" }),
          "Для ObjectDetection: выбрать типы объектов, размер, порог уверенности, затем применить и запустить тест без реального воздействия."
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
          /* @__PURE__ */ jsxs("label", { className: "text-xs text-muted-foreground", children: [
            "Минимальный размер объекта: ",
            /* @__PURE__ */ jsxs("span", { className: "font-mono text-foreground", children: [
              objectSize,
              "px"
            ] })
          ] }),
          /* @__PURE__ */ jsx("input", { type: "range", min: 20, max: 120, value: objectSize, onChange: (e) => setObjectSize(Number(e.target.value)), className: "w-full" }),
          /* @__PURE__ */ jsxs("label", { className: "text-xs text-muted-foreground", children: [
            "Порог уверенности: ",
            /* @__PURE__ */ jsxs("span", { className: "font-mono text-foreground", children: [
              confidence,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsx("input", { type: "range", min: 40, max: 95, value: confidence, onChange: (e) => setConfidence(Number(e.target.value)), className: "w-full" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-2 rounded-md border border-border bg-card/40 p-3 text-xs", children: [[autoApproach, setAutoApproach, "Автоматически приближаться к обнаруженному объекту"], [triplePhoto, setTriplePhoto, "Делать серию из 3 фото при обнаружении"], [notifyOperator, setNotifyOperator, "Отправлять уведомление оператору"]].map(([value, setter, label]) => /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-foreground", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", checked: value, onChange: (e) => setter(e.target.checked) }),
          label
        ] }, label)) }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
          /* @__PURE__ */ jsxs("button", { onClick: runToolTest, className: "inline-flex items-center justify-center gap-2 rounded-md border border-success/40 bg-success/10 px-3 py-2 text-xs font-semibold text-success hover:bg-success/20", children: [
            /* @__PURE__ */ jsx(FlaskConical, { className: "h-3.5 w-3.5" }),
            " Запустить тест"
          ] }),
          /* @__PURE__ */ jsxs("button", { onClick: applySettings, className: "inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90", children: [
            /* @__PURE__ */ jsx(Settings, { className: "h-3.5 w-3.5" }),
            " Применить"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: saveProfile, className: "inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary", children: [
          /* @__PURE__ */ jsx(Save, { className: "h-3.5 w-3.5" }),
          " Сохранить как профиль"
        ] })
      ] }) })
    ] })
  ] });
}
export {
  ToolsPage as component
};
