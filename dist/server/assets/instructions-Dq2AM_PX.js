import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Plus, Shield, MapPinned, Siren, Scale, ToggleRight, ToggleLeft } from "lucide-react";
import { P as PageHeader, S as StatCard, a as Panel } from "./Panel-DCNe0G5R.js";
import { e as initialGeoZones } from "./router-BHqUf-SS.js";
import "@tanstack/react-router";
import "@radix-ui/react-popover";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-slot";
import "class-variance-authority";
const baseRules = [{
  id: "r1",
  title: "Нельзя входить в restricted-геозоны",
  group: "Полёты",
  enabled: true
}, {
  id: "r2",
  title: "При заряде < 22% инициировать RTL",
  group: "Безопасность",
  enabled: true
}, {
  id: "r3",
  title: "Не вести запись над частной территорией без разрешения",
  group: "Право",
  enabled: true
}, {
  id: "r4",
  title: "При потере связи > 8 сек перейти в LOITER",
  group: "Связь",
  enabled: true
}, {
  id: "r5",
  title: "Фиксировать все обнаружения человека в журнале",
  group: "Отчётность",
  enabled: false
}];
function InstructionsPage() {
  const [rules, setRules] = useState(baseRules);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PageHeader, { title: "Инструкции", description: "Законы, протоколы и рабочие геозоны для миссий", badge: "Контур безопасности активен", actions: /* @__PURE__ */ jsxs("button", { className: "inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-secondary", children: [
      /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
      " Добавить правило"
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 lg:grid-cols-4", children: [
      /* @__PURE__ */ jsx(StatCard, { label: "Активных правил", value: rules.filter((rule) => rule.enabled).length, tone: "success", icon: /* @__PURE__ */ jsx(Shield, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx(StatCard, { label: "Всего геозон", value: initialGeoZones.length, tone: "primary", icon: /* @__PURE__ */ jsx(MapPinned, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx(StatCard, { label: "Протоколов ЧС", value: "6", tone: "warning", icon: /* @__PURE__ */ jsx(Siren, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx(StatCard, { label: "Нормативов", value: "14", tone: "default", icon: /* @__PURE__ */ jsx(Scale, { className: "h-4 w-4" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-4 xl:grid-cols-3", children: [
      /* @__PURE__ */ jsx(Panel, { title: "Свод правил", className: "xl:col-span-2", children: /* @__PURE__ */ jsx("div", { className: "space-y-3", children: rules.map((rule) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 rounded-md border border-border bg-card/40 px-3 py-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold text-foreground", children: rule.title }),
          /* @__PURE__ */ jsx("div", { className: "mt-1 text-[11px] text-muted-foreground", children: rule.group })
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => setRules((prev) => prev.map((item) => item.id === rule.id ? {
          ...item,
          enabled: !item.enabled
        } : item)), className: "rounded-md p-1 text-primary", "aria-label": "Переключить правило", children: rule.enabled ? /* @__PURE__ */ jsx(ToggleRight, { className: "h-6 w-6" }) : /* @__PURE__ */ jsx(ToggleLeft, { className: "h-6 w-6 text-muted-foreground" }) })
      ] }, rule.id)) }) }),
      /* @__PURE__ */ jsx(Panel, { title: "Геозоны и допуски", children: /* @__PURE__ */ jsx("div", { className: "space-y-3 text-sm", children: initialGeoZones.map((zone) => /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-border bg-card/40 p-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("div", { className: "font-semibold text-foreground", children: zone.name }),
          /* @__PURE__ */ jsx("span", { className: ["rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase", zone.type === "allowed" && "border-success/30 bg-success/10 text-success", zone.type === "restricted" && "border-destructive/30 bg-destructive/10 text-destructive", zone.type === "warning" && "border-warning/30 bg-warning/10 text-warning"].filter(Boolean).join(" "), children: zone.type })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-2 text-xs text-muted-foreground", children: [
          zone.polygon.length,
          " точек контура · применяется к миссиям и ручному полёту"
        ] })
      ] }, zone.id)) }) })
    ] })
  ] });
}
export {
  InstructionsPage as component
};
