import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect, useMemo } from "react";
import { P as PageHeader, S as StatCard, a as Panel } from "./Panel-DCNe0G5R.js";
import { D as DroneMap } from "./DroneMap-CR6Ae-Kc.js";
import { c as initialFleet, e as initialGeoZones, g as flightModeLabel, h as droneStatusLabel } from "./router-BHqUf-SS.js";
import { Plane, Users, Battery, CheckSquare, Plus, Home, PauseCircle, PlayCircle, AlertTriangle, Network, Lock, Radio, Wifi, Square, Send } from "lucide-react";
import "@tanstack/react-router";
import "@radix-ui/react-popover";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-slot";
import "class-variance-authority";
const statusTone = {
  online: "bg-success/15 text-success border-success/30",
  offline: "bg-muted text-muted-foreground border-border",
  mission: "bg-primary/15 text-primary border-primary/30",
  charging: "bg-warning/15 text-warning border-warning/30",
  maintenance: "bg-destructive/15 text-destructive border-destructive/30"
};
const bulkCommands = [{
  id: "rtl",
  label: "Возврат домой",
  tone: "warning"
}, {
  id: "pause",
  label: "Удержание",
  tone: "info"
}, {
  id: "resume",
  label: "Продолжить",
  tone: "success"
}, {
  id: "land",
  label: "Посадка",
  tone: "default"
}, {
  id: "emg",
  label: "Аварийный СТОП",
  tone: "destructive"
}];
const cmdToneClass = {
  warning: "border-warning/40 bg-warning/10 text-warning hover:bg-warning/20",
  info: "border-info/40 bg-info/10 text-info hover:bg-info/20",
  success: "border-success/40 bg-success/10 text-success hover:bg-success/20",
  default: "border-border bg-card text-foreground hover:bg-secondary",
  destructive: "border-destructive/50 bg-destructive/15 text-destructive hover:bg-destructive/25"
};
function FleetPage() {
  const [fleet, setFleet] = useState(initialFleet);
  const [selectedIds, setSelectedIds] = useState([]);
  const [groupFilter, setGroupFilter] = useState("all");
  const [provider, setProvider] = useState("dark");
  const [activeDroneId, setActiveDroneId] = useState();
  const [cmdLog, setCmdLog] = useState([]);
  const [showMesh, setShowMesh] = useState(true);
  const [simulateSignal, setSimulateSignal] = useState(false);
  const rowRefs = useRef({});
  useEffect(() => {
    if (!activeDroneId) return;
    const el = rowRefs.current[activeDroneId];
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }
  }, [activeDroneId]);
  useEffect(() => {
    if (!simulateSignal || !activeDroneId) return;
    const start = Date.now();
    const id = window.setInterval(() => {
      const t = (Date.now() - start) / 1e3;
      const next = Math.round(62 + Math.sin(t / 1.9) * 32);
      setFleet((prev) => prev.map((d) => d.id === activeDroneId ? {
        ...d,
        signal: Math.max(10, Math.min(99, next))
      } : d));
    }, 500);
    return () => window.clearInterval(id);
  }, [simulateSignal, activeDroneId]);
  const groups = useMemo(() => {
    const set = /* @__PURE__ */ new Set();
    fleet.forEach((d) => d.group && set.add(d.group));
    return Array.from(set);
  }, [fleet]);
  const visibleFleet = useMemo(() => {
    if (groupFilter === "all") return fleet;
    return fleet.filter((d) => d.group === groupFilter);
  }, [fleet, groupFilter]);
  const selected = useMemo(() => fleet.filter((d) => selectedIds.includes(d.id)), [fleet, selectedIds]);
  const stats = useMemo(() => {
    const online = fleet.filter((d) => d.status === "online" || d.status === "mission").length;
    const inMission = fleet.filter((d) => d.status === "mission").length;
    const withBattery = fleet.filter((d) => d.battery > 0);
    const avg = withBattery.length ? Math.round(withBattery.reduce((s, d) => s + d.battery, 0) / withBattery.length) : 0;
    return {
      total: fleet.length,
      online,
      inMission,
      avg,
      groups: groups.length
    };
  }, [fleet, groups]);
  const meshNodes = useMemo(() => fleet.filter((d) => d.status === "mission" || d.status === "online"), [fleet]);
  const toggleSelect = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };
  const selectVisible = () => setSelectedIds(visibleFleet.map((d) => d.id));
  const selectGroup = (group) => {
    setSelectedIds(fleet.filter((d) => d.group === group).map((d) => d.id));
  };
  const clearSelection = () => setSelectedIds([]);
  const sendCommand = (cmd) => {
    if (selectedIds.length === 0) return;
    const log = {
      id: Date.now(),
      timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString("ru-RU"),
      command: cmd.label,
      drones: [...selectedIds]
    };
    setCmdLog((prev) => [log, ...prev].slice(0, 8));
  };
  const mapCenter = activeDroneId ? fleet.find((d) => d.id === activeDroneId)?.position ?? [55.7558, 37.6173] : visibleFleet[0]?.position ?? [55.7558, 37.6173];
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PageHeader, { title: "Флот", description: "Карта · группы · mesh-сеть · массовые команды", badge: `${stats.online}/${stats.total} в строю` }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 lg:grid-cols-5", children: [
      /* @__PURE__ */ jsx(StatCard, { label: "Всего", value: stats.total, tone: "primary", icon: /* @__PURE__ */ jsx(Plane, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx(StatCard, { label: "В строю", value: stats.online, tone: "success" }),
      /* @__PURE__ */ jsx(StatCard, { label: "В миссии", value: stats.inMission, tone: "primary" }),
      /* @__PURE__ */ jsx(StatCard, { label: "Групп", value: stats.groups, tone: "default", icon: /* @__PURE__ */ jsx(Users, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx(StatCard, { label: "Сред. заряд", value: stats.avg, unit: "%", tone: "warning", icon: /* @__PURE__ */ jsx(Battery, { className: "h-4 w-4" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 flex flex-wrap items-center gap-2", children: [
      /* @__PURE__ */ jsx("span", { className: "font-mono text-[10px] uppercase tracking-wider text-muted-foreground", children: "Группа:" }),
      /* @__PURE__ */ jsxs("button", { onClick: () => setGroupFilter("all"), className: ["rounded-full border px-3 py-1 text-xs font-medium transition-colors", groupFilter === "all" ? "border-primary bg-primary/15 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground"].join(" "), children: [
        "Все · ",
        fleet.length
      ] }),
      groups.map((g) => {
        const count = fleet.filter((d) => d.group === g).length;
        const active = groupFilter === g;
        return /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
          /* @__PURE__ */ jsxs("button", { onClick: () => setGroupFilter(g), className: ["rounded-l-full border-y border-l px-3 py-1 text-xs font-medium transition-colors", active ? "border-primary bg-primary/15 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground"].join(" "), children: [
            g,
            " · ",
            count
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: () => selectGroup(g), title: `Выбрать всю группу ${g}`, className: ["rounded-r-full border-y border-r px-2 py-1 transition-colors", active ? "border-primary bg-primary/15 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground"].join(" "), children: /* @__PURE__ */ jsx(CheckSquare, { className: "h-3 w-3" }) })
        ] }, g);
      }),
      /* @__PURE__ */ jsxs("button", { className: "ml-1 inline-flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary", children: [
        /* @__PURE__ */ jsx(Plus, { className: "h-3 w-3" }),
        " Новая группа"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "sticky top-0 z-20 mt-4 rounded-md border border-border bg-card/95 p-3 backdrop-blur", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 pr-2", children: [
          /* @__PURE__ */ jsx(CheckSquare, { className: "h-4 w-4 text-primary" }),
          /* @__PURE__ */ jsxs("span", { className: "text-sm font-semibold text-foreground", children: [
            "Выбрано: ",
            /* @__PURE__ */ jsx("span", { className: "font-mono text-primary", children: selectedIds.length })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-1", children: [
          /* @__PURE__ */ jsx("button", { onClick: selectVisible, className: "rounded-md border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground", children: "Все видимые" }),
          selectedIds.length > 0 && /* @__PURE__ */ jsx("button", { onClick: clearSelection, className: "rounded-md border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground hover:text-destructive", children: "Очистить" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "ml-auto flex flex-wrap gap-1.5", children: bulkCommands.map((cmd) => /* @__PURE__ */ jsxs("button", { onClick: () => sendCommand(cmd), disabled: selectedIds.length === 0, className: ["inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40", cmdToneClass[cmd.tone]].join(" "), children: [
          cmd.id === "rtl" && /* @__PURE__ */ jsx(Home, { className: "h-3 w-3" }),
          cmd.id === "pause" && /* @__PURE__ */ jsx(PauseCircle, { className: "h-3 w-3" }),
          cmd.id === "resume" && /* @__PURE__ */ jsx(PlayCircle, { className: "h-3 w-3" }),
          cmd.id === "land" && /* @__PURE__ */ jsx(Plane, { className: "h-3 w-3" }),
          cmd.id === "emg" && /* @__PURE__ */ jsx(AlertTriangle, { className: "h-3 w-3" }),
          cmd.label
        ] }, cmd.id)) })
      ] }),
      selected.length > 0 && /* @__PURE__ */ jsx("div", { className: "mt-2 flex flex-wrap gap-1 border-t border-border/50 pt-2", children: selected.map((d) => /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] text-primary", children: [
        /* @__PURE__ */ jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-primary" }),
        d.name,
        /* @__PURE__ */ jsx("span", { className: "font-mono text-muted-foreground", children: d.id })
      ] }, d.id)) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-4 xl:grid-cols-3", children: [
      /* @__PURE__ */ jsx(Panel, { title: "Карта флота", subtitle: `${visibleFleet.length} дронов на карте · клик по маркеру для выбора`, padded: false, className: "xl:col-span-2", actions: /* @__PURE__ */ jsx("button", { onClick: () => setSimulateSignal((v) => !v), disabled: !activeDroneId, title: activeDroneId ? "Имитация колебаний сигнала активного дрона для проверки авто-маршрута" : "Сначала выберите активный дрон", className: ["rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors", !activeDroneId ? "cursor-not-allowed border-border bg-card text-muted-foreground/50" : simulateSignal ? "border-warning/50 bg-warning/15 text-warning" : "border-border bg-card text-muted-foreground hover:text-foreground"].join(" "), children: simulateSignal ? "Симуляция: ON" : "Симуляция сигнала" }), children: /* @__PURE__ */ jsx("div", { className: "h-[440px] w-full", children: /* @__PURE__ */ jsx(DroneMap, { drones: visibleFleet, activeDroneId, geoZones: initialGeoZones, center: mapCenter, zoom: 13, provider, onProviderChange: setProvider, gatewayPosition: [55.7558, 37.6173], showMeshLink: true, showFleetMesh: true }) }) }),
      /* @__PURE__ */ jsxs(Panel, { title: "Mesh-сеть", subtitle: `${meshNodes.length} узлов · самоорганизующаяся · AES-256`, actions: /* @__PURE__ */ jsx("button", { onClick: () => setShowMesh((v) => !v), className: "rounded-md border border-border bg-card px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground", children: showMesh ? "Скрыть" : "Показать" }), children: [
        showMesh ? /* @__PURE__ */ jsx(MeshTopology, { nodes: meshNodes, selectedIds, activeId: activeDroneId, onNodeClick: (id) => {
          setActiveDroneId(id);
          toggleSelect(id);
        } }) : /* @__PURE__ */ jsx("div", { className: "py-8 text-center text-xs text-muted-foreground", children: "Визуализация скрыта" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 text-[10px]", children: [
          /* @__PURE__ */ jsx(MeshStat, { icon: /* @__PURE__ */ jsx(Network, { className: "h-3 w-3" }), label: "Узлов", value: `${meshNodes.length}` }),
          /* @__PURE__ */ jsx(MeshStat, { icon: /* @__PURE__ */ jsx(Lock, { className: "h-3 w-3" }), label: "Шифрование", value: "AES-256" }),
          /* @__PURE__ */ jsx(MeshStat, { icon: /* @__PURE__ */ jsx(Radio, { className: "h-3 w-3" }), label: "Маршрутизация", value: "Multi-path" }),
          /* @__PURE__ */ jsx(MeshStat, { icon: /* @__PURE__ */ jsx(Wifi, { className: "h-3 w-3" }), label: "Авто-восст.", value: "Вкл" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-4 xl:grid-cols-3", children: [
      /* @__PURE__ */ jsx(Panel, { title: "Дроны флота", subtitle: groupFilter === "all" ? "Все группы" : `Группа ${groupFilter}`, padded: false, className: "xl:col-span-2", children: /* @__PURE__ */ jsx("div", { className: "divide-y divide-border", children: visibleFleet.map((d) => {
        const checked = selectedIds.includes(d.id);
        const isActive = d.id === activeDroneId;
        return /* @__PURE__ */ jsxs("div", { ref: (el) => {
          rowRefs.current[d.id] = el;
        }, className: ["flex flex-wrap items-center gap-3 border-l-2 px-4 py-3 transition-colors", isActive ? "border-l-primary bg-primary/10 ring-1 ring-inset ring-primary/30" : checked ? "border-l-primary/40 bg-primary/5" : "border-l-transparent hover:bg-secondary/40"].join(" "), children: [
          /* @__PURE__ */ jsx("button", { onClick: () => toggleSelect(d.id), className: ["flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors", checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary"].join(" "), "aria-label": checked ? "Снять выбор" : "Выбрать", children: checked ? /* @__PURE__ */ jsx(CheckSquare, { className: "h-3 w-3" }) : /* @__PURE__ */ jsx(Square, { className: "h-3 w-3 opacity-30" }) }),
          /* @__PURE__ */ jsxs("button", { onClick: () => setActiveDroneId(d.id), className: "flex min-w-0 flex-1 items-center gap-3 text-left", children: [
            /* @__PURE__ */ jsx("div", { className: "font-mono text-[10px] text-muted-foreground w-14", children: d.id }),
            /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ jsx("div", { className: "truncate text-sm font-semibold text-foreground", children: d.name }),
              /* @__PURE__ */ jsxs("div", { className: "mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground", children: [
                /* @__PURE__ */ jsx("span", { children: flightModeLabel[d.mode] }),
                d.group && /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx("span", { children: "·" }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    "гр. ",
                    d.group
                  ] })
                ] }),
                d.mission && /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx("span", { children: "·" }),
                  /* @__PURE__ */ jsx("span", { className: "font-mono text-primary", children: d.mission })
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "hidden items-center gap-2 sm:flex", children: [
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 font-mono text-[11px] text-foreground", children: [
              /* @__PURE__ */ jsx(Battery, { className: "h-3 w-3" }),
              /* @__PURE__ */ jsxs("span", { className: d.battery > 60 ? "text-success" : d.battery > 30 ? "text-warning" : "text-destructive", children: [
                d.battery,
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 font-mono text-[11px] text-muted-foreground", children: [
              /* @__PURE__ */ jsx(Wifi, { className: "h-3 w-3" }),
              d.signal,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsx("span", { className: `inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusTone[d.status]}`, children: droneStatusLabel[d.status] })
        ] }, d.id);
      }) }) }),
      /* @__PURE__ */ jsx(Panel, { title: "Журнал команд", subtitle: "Недавние массовые приказы", children: cmdLog.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "py-8 text-center text-xs text-muted-foreground", children: [
        "Нет отправленных команд.",
        /* @__PURE__ */ jsx("br", {}),
        "Выберите дроны и нажмите команду в верхней панели."
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-2", children: cmdLog.map((log) => /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-border bg-card/60 p-2.5", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-1 flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx(Send, { className: "h-3 w-3 text-primary" }),
            /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-foreground", children: log.command })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "font-mono text-[10px] text-muted-foreground", children: log.timestamp })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1", children: log.drones.map((d) => /* @__PURE__ */ jsx("span", { className: "rounded bg-secondary px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground", children: d }, d)) })
      ] }, log.id)) }) })
    ] })
  ] });
}
function MeshStat({
  icon,
  label,
  value
}) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 rounded border border-border/60 bg-card/40 px-2 py-1.5", children: [
    /* @__PURE__ */ jsx("span", { className: "text-primary", children: icon }),
    /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
      /* @__PURE__ */ jsx("div", { className: "font-mono text-[9px] uppercase tracking-wider text-muted-foreground", children: label }),
      /* @__PURE__ */ jsx("div", { className: "truncate text-[11px] font-semibold text-foreground", children: value })
    ] })
  ] });
}
function MeshTopology({
  nodes,
  selectedIds,
  activeId,
  onNodeClick
}) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 100;
  const placed = nodes.map((d, i) => {
    const angle = i / Math.max(nodes.length, 1) * Math.PI * 2 - Math.PI / 2;
    return {
      drone: d,
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius
    };
  });
  return /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsxs("svg", { width: size, height: size, className: "overflow-visible", children: [
    placed.map((p, i) => {
      const next = placed[(i + 1) % placed.length];
      const activeUplink = p.drone.id === activeId;
      return /* @__PURE__ */ jsxs("g", { children: [
        /* @__PURE__ */ jsx("line", { x1: cx, y1: cy, x2: p.x, y2: p.y, stroke: activeUplink ? "oklch(0.85 0.2 200)" : "oklch(0.82 0.18 200)", strokeOpacity: activeUplink ? 0.95 : p.drone.signal > 70 ? 0.5 : 0.2, strokeWidth: activeUplink ? 2.5 : p.drone.signal > 70 ? 1.5 : 1, strokeDasharray: activeUplink ? "6 6" : p.drone.signal > 70 ? void 0 : "3 3", className: activeUplink ? "mesh-link-flow" : void 0 }),
        placed.length > 1 && /* @__PURE__ */ jsx("line", { x1: p.x, y1: p.y, x2: next.x, y2: next.y, stroke: "oklch(0.75 0.15 290)", strokeOpacity: 0.35, strokeWidth: 1, strokeDasharray: "2 4" })
      ] }, `link-${p.drone.id}`);
    }),
    /* @__PURE__ */ jsx("circle", { cx, cy, r: 18, fill: "oklch(0.82 0.18 200 / 0.2)", stroke: "oklch(0.82 0.18 200)", strokeWidth: 2 }),
    /* @__PURE__ */ jsx("text", { x: cx, y: cy + 3, textAnchor: "middle", className: "fill-primary", style: {
      font: "700 9px 'JetBrains Mono', monospace"
    }, children: "ОП" }),
    /* @__PURE__ */ jsx("text", { x: cx, y: cy + 32, textAnchor: "middle", className: "fill-muted-foreground", style: {
      font: "9px 'JetBrains Mono', monospace"
    }, children: "GATEWAY" }),
    placed.map((p) => {
      const sel = selectedIds.includes(p.drone.id);
      const tone = p.drone.status === "mission" ? "oklch(0.82 0.18 200)" : p.drone.status === "online" ? "oklch(0.72 0.17 145)" : "oklch(0.7 0 0)";
      return /* @__PURE__ */ jsxs("g", { onClick: () => onNodeClick(p.drone.id), className: "cursor-pointer", children: [
        sel && /* @__PURE__ */ jsx("circle", { cx: p.x, cy: p.y, r: 18, fill: "none", stroke: tone, strokeWidth: 2, strokeDasharray: "3 3", children: /* @__PURE__ */ jsx("animate", { attributeName: "r", values: "14;20;14", dur: "2s", repeatCount: "indefinite" }) }),
        /* @__PURE__ */ jsx("circle", { cx: p.x, cy: p.y, r: 12, fill: `${tone}33`, stroke: tone, strokeWidth: 1.5 }),
        /* @__PURE__ */ jsx("text", { x: p.x, y: p.y + 3, textAnchor: "middle", style: {
          font: "700 8px 'JetBrains Mono', monospace",
          fill: tone
        }, children: p.drone.id.slice(-2) }),
        /* @__PURE__ */ jsx("text", { x: p.x, y: p.y + 26, textAnchor: "middle", className: "fill-foreground", style: {
          font: "9px 'JetBrains Mono', monospace"
        }, children: p.drone.name.replace("COBA-", "") }),
        /* @__PURE__ */ jsxs("text", { x: p.x, y: p.y + 38, textAnchor: "middle", className: "fill-muted-foreground", style: {
          font: "8px 'JetBrains Mono', monospace"
        }, children: [
          p.drone.signal,
          "%"
        ] })
      ] }, p.drone.id);
    })
  ] }) });
}
export {
  FleetPage as component
};
