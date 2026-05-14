import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area, Line, LineChart } from "recharts";
import { RotateCw, Battery, Mountain, Gauge, Thermometer, Wifi, Satellite, Eye, EyeOff, Pause, Home, Plane, AlertTriangle, Cpu, CheckCircle2, XCircle, Wind } from "lucide-react";
import { u as useOps, c as initialFleet, k as useTelemetry, l as initialMissions, e as initialGeoZones, n as initialDetections, g as flightModeLabel, o as currentWeather } from "./router-BHqUf-SS.js";
import { P as PageHeader, S as StatCard, a as Panel } from "./Panel-DCNe0G5R.js";
import { D as DroneMap } from "./DroneMap-CR6Ae-Kc.js";
import "@tanstack/react-router";
import "@radix-ui/react-popover";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-slot";
import "class-variance-authority";
const chartColors = {
  primary: "oklch(0.82 0.18 200)",
  accent: "oklch(0.78 0.16 70)",
  success: "oklch(0.72 0.18 145)",
  grid: "oklch(0.30 0.025 245 / 0.5)",
  text: "oklch(0.68 0.02 240)"
};
const tooltipStyle = {
  backgroundColor: "oklch(0.20 0.025 245)",
  border: "1px solid oklch(0.30 0.025 245)",
  borderRadius: 8,
  fontSize: 12,
  color: "oklch(0.96 0.01 220)",
  fontFamily: "JetBrains Mono, monospace"
};
const refreshOptions = [1e3, 2e3, 5e3, 1e4];
function TelemetryPage() {
  const {
    appendEvent
  } = useOps();
  const [selectedDroneId, setSelectedDroneId] = useState("DR-001");
  const [refreshMs, setRefreshMs] = useState(2e3);
  const [provider, setProvider] = useState("dark");
  const [showDetections, setShowDetections] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [flightMode, setFlightMode] = useState("AUTO");
  const droneIndex = initialFleet.findIndex((d) => d.id === selectedDroneId);
  const drone = initialFleet[droneIndex] ?? initialFleet[0];
  const {
    history,
    current
  } = useTelemetry(refreshMs, droneIndex);
  const activeMission = useMemo(() => initialMissions.find((m) => m.id === drone.mission), [drone.mission]);
  const flightTimeMin = drone.flightTimeRemaining;
  const batteryTone = (current?.battery ?? 0) < 30 ? "destructive" : (current?.battery ?? 0) < 50 ? "warning" : "success";
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PageHeader, { title: "Телеметрия", description: `Реал-тайм мониторинг · ${drone.name} · ${drone.mode}${activeMission ? ` · ${activeMission.name}` : ""}`, badge: drone.status === "mission" ? "Активный полёт" : "На земле", actions: /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("select", { value: selectedDroneId, onChange: (e) => setSelectedDroneId(e.target.value), className: "rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground", children: initialFleet.map((d) => /* @__PURE__ */ jsxs("option", { value: d.id, children: [
        d.name,
        " (",
        d.id,
        ")"
      ] }, d.id)) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1.5 text-xs", children: [
        /* @__PURE__ */ jsx(RotateCw, { className: "h-3.5 w-3.5 text-primary" }),
        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Авто" }),
        /* @__PURE__ */ jsx("select", { value: refreshMs, onChange: (e) => setRefreshMs(Number(e.target.value)), className: "bg-transparent font-mono font-semibold text-foreground outline-none", children: refreshOptions.map((ms) => /* @__PURE__ */ jsxs("option", { value: ms, children: [
          ms / 1e3,
          "с"
        ] }, ms)) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "mb-4 flex gap-2 overflow-x-auto pb-1", children: initialFleet.map((d) => {
      const active = d.id === selectedDroneId;
      const tone = d.status === "mission" ? "text-primary" : d.status === "online" ? "text-success" : d.status === "charging" ? "text-warning" : "text-muted-foreground";
      return /* @__PURE__ */ jsxs("button", { onClick: () => setSelectedDroneId(d.id), className: ["flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-xs transition-colors", active ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card hover:border-primary/40"].join(" "), children: [
        /* @__PURE__ */ jsx("span", { className: `h-1.5 w-1.5 rounded-full bg-current ${tone}` }),
        /* @__PURE__ */ jsx("span", { className: "font-semibold", children: d.name }),
        /* @__PURE__ */ jsxs("span", { className: "font-mono text-[10px] text-muted-foreground", children: [
          d.battery,
          "%"
        ] })
      ] }, d.id);
    }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6", children: [
      /* @__PURE__ */ jsx(StatCard, { label: "Батарея", value: current?.battery ?? 0, unit: "%", tone: batteryTone, icon: /* @__PURE__ */ jsx(Battery, { className: "h-4 w-4" }), trend: `~${flightTimeMin} мин полёта` }),
      /* @__PURE__ */ jsx(StatCard, { label: "Высота", value: current?.altitude.toFixed(1) ?? "0", unit: "м", tone: "primary", icon: /* @__PURE__ */ jsx(Mountain, { className: "h-4 w-4" }), trend: `Цель: ${current?.altitudeTarget ?? 0} м` }),
      /* @__PURE__ */ jsx(StatCard, { label: "Скорость", value: current?.speed.toFixed(1) ?? "0", unit: "м/с", tone: "primary", icon: /* @__PURE__ */ jsx(Gauge, { className: "h-4 w-4" }), trend: `Верт: ${current?.speedVertical?.toFixed(1) ?? 0} м/с` }),
      /* @__PURE__ */ jsx(StatCard, { label: "Темп. моторов", value: current?.temperature.toFixed(1) ?? "0", unit: "°C", tone: "warning", icon: /* @__PURE__ */ jsx(Thermometer, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx(StatCard, { label: "Сигнал", value: current?.signal ?? 0, unit: "%", tone: "success", icon: /* @__PURE__ */ jsx(Wifi, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx(StatCard, { label: "GPS", value: "14", unit: "спутн.", tone: "success", icon: /* @__PURE__ */ jsx(Satellite, { className: "h-4 w-4" }), trend: "3D Fix · HDOP 0.8" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-4 xl:grid-cols-3", children: [
      /* @__PURE__ */ jsx(Panel, { title: "Карта полёта", subtitle: `${drone.position[0].toFixed(4)}° N, ${drone.position[1].toFixed(4)}° E`, padded: false, className: "xl:col-span-2", actions: /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
        /* @__PURE__ */ jsx("button", { onClick: () => setShowDetections((v) => !v), className: `rounded border px-2 py-1 font-mono text-[10px] transition-colors ${showDetections ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"}`, title: "Обнаруженные объекты", children: "Объекты" }),
        /* @__PURE__ */ jsx("button", { onClick: () => setShowZones((v) => !v), className: `rounded border px-2 py-1 font-mono text-[10px] transition-colors ${showZones ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"}`, title: "Геозоны", children: "Геозоны" })
      ] }), children: /* @__PURE__ */ jsx("div", { className: "relative h-[420px] w-full", children: /* @__PURE__ */ jsx(DroneMap, { drones: initialFleet, activeDroneId: selectedDroneId, missions: initialMissions.filter((m) => m.status === "running" || m.status === "paused"), activeMissionId: drone.mission, detections: showDetections ? initialDetections : [], geoZones: showZones ? initialGeoZones : [], center: drone.position, zoom: 15, provider, onProviderChange: setProvider }) }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4", children: [
        /* @__PURE__ */ jsx(Panel, { title: "Видеопоток", subtitle: `${drone.name} · ${cameraOn ? "1080p · 30fps" : "Отключено"}`, padded: false, actions: /* @__PURE__ */ jsxs("button", { onClick: () => setCameraOn((v) => !v), className: "flex items-center gap-1 text-xs text-primary", children: [
          cameraOn ? /* @__PURE__ */ jsx(Eye, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ jsx(EyeOff, { className: "h-3.5 w-3.5" }),
          cameraOn ? "Вкл" : "Выкл"
        ] }), children: /* @__PURE__ */ jsx("div", { className: "scan-line relative aspect-video overflow-hidden bg-[oklch(0.12_0.02_240)]", children: cameraOn ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-[oklch(0.30_0.04_200_/_0.5)] via-[oklch(0.18_0.02_240)] to-[oklch(0.22_0.03_30_/_0.4)]" }),
          /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 p-3 font-mono text-[10px] text-success", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("div", { children: "● REC" }),
              /* @__PURE__ */ jsx("div", { children: drone.name })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "absolute bottom-3 left-3", children: [
              "ALT ",
              current?.altitude.toFixed(1),
              "м"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "absolute bottom-3 right-3", children: [
              "SPD ",
              current?.speed.toFixed(1),
              "м/с"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-success/50", children: [
              /* @__PURE__ */ jsx("div", { className: "absolute left-1/2 top-1/2 h-1 w-6 -translate-x-1/2 -translate-y-1/2 bg-success/70" }),
              /* @__PURE__ */ jsx("div", { className: "absolute left-1/2 top-1/2 h-6 w-1 -translate-x-1/2 -translate-y-1/2 bg-success/70" })
            ] })
          ] })
        ] }) : /* @__PURE__ */ jsx("div", { className: "flex h-full items-center justify-center text-xs text-muted-foreground", children: "Камера выключена" }) }) }),
        /* @__PURE__ */ jsxs(Panel, { title: "Быстрые команды", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
            /* @__PURE__ */ jsxs("button", { onClick: () => appendEvent({
              level: "warning",
              source: "Telemetry",
              message: `${drone.name}: команда паузы отправлена`
            }), className: "flex items-center justify-center gap-1.5 rounded-md border border-warning/40 bg-warning/10 py-2 text-xs font-semibold text-warning hover:bg-warning/20", children: [
              /* @__PURE__ */ jsx(Pause, { className: "h-3.5 w-3.5" }),
              " Пауза"
            ] }),
            /* @__PURE__ */ jsxs("button", { onClick: () => appendEvent({
              level: "info",
              source: "Telemetry",
              message: `${drone.name}: инициирован возврат домой`
            }), className: "flex items-center justify-center gap-1.5 rounded-md border border-info/40 bg-info/10 py-2 text-xs font-semibold text-info hover:bg-info/20", children: [
              /* @__PURE__ */ jsx(Home, { className: "h-3.5 w-3.5" }),
              " Домой"
            ] }),
            /* @__PURE__ */ jsxs("button", { onClick: () => appendEvent({
              level: "info",
              source: "Telemetry",
              message: `${drone.name}: включено удержание позиции`
            }), className: "flex items-center justify-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 py-2 text-xs font-semibold text-primary hover:bg-primary/20", children: [
              /* @__PURE__ */ jsx(Plane, { className: "h-3.5 w-3.5" }),
              " Висение"
            ] }),
            /* @__PURE__ */ jsxs("button", { onClick: () => appendEvent({
              level: "error",
              source: "Telemetry",
              message: `${drone.name}: аварийная команда EMG отправлена`
            }), className: "flex items-center justify-center gap-1.5 rounded-md border border-destructive/40 bg-destructive/10 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20", children: [
              /* @__PURE__ */ jsx(AlertTriangle, { className: "h-3.5 w-3.5" }),
              " EMG"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-3 border-t border-border pt-3", children: [
            /* @__PURE__ */ jsx("div", { className: "mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground", children: "Режим полёта" }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-1", children: ["MANUAL", "AUTO", "RTL"].map((m) => /* @__PURE__ */ jsx("button", { onClick: () => setFlightMode(m), className: `rounded border px-2 py-1.5 font-mono text-[10px] transition-colors ${flightMode === m ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`, children: m }, m)) })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-4 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsx(Panel, { title: "Высота полёта", subtitle: "Метры · последние 2 минуты", actions: /* @__PURE__ */ jsxs("span", { className: "font-mono text-xs text-primary", children: [
        current?.altitude.toFixed(1),
        " м"
      ] }), children: /* @__PURE__ */ jsx("div", { className: "h-48", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(AreaChart, { data: history, children: [
        /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "grad-alt", x1: "0", y1: "0", x2: "0", y2: "1", children: [
          /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: chartColors.primary, stopOpacity: 0.45 }),
          /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: chartColors.primary, stopOpacity: 0 })
        ] }) }),
        /* @__PURE__ */ jsx(CartesianGrid, { stroke: chartColors.grid, strokeDasharray: "3 3" }),
        /* @__PURE__ */ jsx(XAxis, { dataKey: "time", stroke: chartColors.text, fontSize: 10, tickLine: false, axisLine: false }),
        /* @__PURE__ */ jsx(YAxis, { stroke: chartColors.text, fontSize: 10, tickLine: false, axisLine: false, width: 32 }),
        /* @__PURE__ */ jsx(Tooltip, { contentStyle: tooltipStyle, cursor: {
          stroke: chartColors.primary,
          strokeOpacity: 0.4
        } }),
        /* @__PURE__ */ jsx(Area, { type: "monotone", dataKey: "altitude", stroke: chartColors.primary, strokeWidth: 2, fill: "url(#grad-alt)" }),
        /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "altitudeTarget", stroke: chartColors.accent, strokeWidth: 1, strokeDasharray: "4 4", dot: false })
      ] }) }) }) }),
      /* @__PURE__ */ jsx(Panel, { title: "Скорость", subtitle: "м/с · горизонтальная и вертикальная", actions: /* @__PURE__ */ jsxs("span", { className: "font-mono text-xs text-primary", children: [
        current?.speed.toFixed(1),
        " м/с"
      ] }), children: /* @__PURE__ */ jsx("div", { className: "h-48", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(LineChart, { data: history, children: [
        /* @__PURE__ */ jsx(CartesianGrid, { stroke: chartColors.grid, strokeDasharray: "3 3" }),
        /* @__PURE__ */ jsx(XAxis, { dataKey: "time", stroke: chartColors.text, fontSize: 10, tickLine: false, axisLine: false }),
        /* @__PURE__ */ jsx(YAxis, { stroke: chartColors.text, fontSize: 10, tickLine: false, axisLine: false, width: 32 }),
        /* @__PURE__ */ jsx(Tooltip, { contentStyle: tooltipStyle }),
        /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "speed", stroke: chartColors.primary, strokeWidth: 2, dot: false, name: "Гориз." }),
        /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "speedVertical", stroke: chartColors.accent, strokeWidth: 2, dot: false, name: "Верт." })
      ] }) }) }) }),
      /* @__PURE__ */ jsx(Panel, { title: "Заряд батареи", subtitle: "% · разряд во времени", actions: /* @__PURE__ */ jsxs("span", { className: "font-mono text-xs text-success", children: [
        current?.battery,
        "%"
      ] }), children: /* @__PURE__ */ jsx("div", { className: "h-48", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(AreaChart, { data: history, children: [
        /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "grad-bat", x1: "0", y1: "0", x2: "0", y2: "1", children: [
          /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: chartColors.success, stopOpacity: 0.45 }),
          /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: chartColors.success, stopOpacity: 0 })
        ] }) }),
        /* @__PURE__ */ jsx(CartesianGrid, { stroke: chartColors.grid, strokeDasharray: "3 3" }),
        /* @__PURE__ */ jsx(XAxis, { dataKey: "time", stroke: chartColors.text, fontSize: 10, tickLine: false, axisLine: false }),
        /* @__PURE__ */ jsx(YAxis, { stroke: chartColors.text, fontSize: 10, tickLine: false, axisLine: false, width: 32, domain: [0, 100] }),
        /* @__PURE__ */ jsx(Tooltip, { contentStyle: tooltipStyle }),
        /* @__PURE__ */ jsx(Area, { type: "monotone", dataKey: "battery", stroke: chartColors.success, strokeWidth: 2, fill: "url(#grad-bat)" })
      ] }) }) }) }),
      /* @__PURE__ */ jsx(Panel, { title: "Уровень сигнала", subtitle: "% · качество связи", actions: /* @__PURE__ */ jsxs("span", { className: "font-mono text-xs text-info", children: [
        current?.signal,
        "%"
      ] }), children: /* @__PURE__ */ jsx("div", { className: "h-48", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(AreaChart, { data: history, children: [
        /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "grad-sig", x1: "0", y1: "0", x2: "0", y2: "1", children: [
          /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "oklch(0.70 0.15 230)", stopOpacity: 0.45 }),
          /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "oklch(0.70 0.15 230)", stopOpacity: 0 })
        ] }) }),
        /* @__PURE__ */ jsx(CartesianGrid, { stroke: chartColors.grid, strokeDasharray: "3 3" }),
        /* @__PURE__ */ jsx(XAxis, { dataKey: "time", stroke: chartColors.text, fontSize: 10, tickLine: false, axisLine: false }),
        /* @__PURE__ */ jsx(YAxis, { stroke: chartColors.text, fontSize: 10, tickLine: false, axisLine: false, width: 32, domain: [0, 100] }),
        /* @__PURE__ */ jsx(Tooltip, { contentStyle: tooltipStyle }),
        /* @__PURE__ */ jsx(Area, { type: "monotone", dataKey: "signal", stroke: "oklch(0.70 0.15 230)", strokeWidth: 2, fill: "url(#grad-sig)" })
      ] }) }) }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-4 lg:grid-cols-3", children: [
      /* @__PURE__ */ jsx(Panel, { title: "Моторы", subtitle: "4 ротора · обороты и температура", children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2", children: drone.motors.map((m, i) => {
        const tone = m.temperature > 55 ? "text-destructive" : m.temperature > 45 ? "text-warning" : "text-success";
        return /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-border bg-card/50 p-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("span", { className: "font-mono text-[10px] uppercase tracking-wider text-muted-foreground", children: [
              "M",
              i + 1
            ] }),
            /* @__PURE__ */ jsx(Cpu, { className: `h-3.5 w-3.5 ${tone}` })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-1.5 font-mono text-lg font-bold text-foreground", children: m.rpm }),
          /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground", children: "RPM" }),
          /* @__PURE__ */ jsxs("div", { className: `mt-1 font-mono text-xs ${tone}`, children: [
            m.temperature.toFixed(1),
            "°C"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-2 h-1 overflow-hidden rounded-full bg-secondary", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-primary", style: {
            width: `${m.load}%`
          } }) })
        ] }, i);
      }) }) }),
      /* @__PURE__ */ jsxs(Panel, { title: "Сенсоры", subtitle: "Состояние модулей", children: [
        /* @__PURE__ */ jsx("div", { className: "space-y-2", children: [{
          name: "GPS / ГЛОНАСС",
          state: drone.sensors.gps
        }, {
          name: "RGB-камера",
          state: drone.sensors.camera
        }, {
          name: "Тепловизор",
          state: drone.sensors.thermal
        }, {
          name: "LiDAR",
          state: drone.sensors.lidar
        }, {
          name: "IMU",
          state: drone.sensors.imu
        }].map((s) => {
          const ok = s.state === "ok";
          const missing = s.state === "missing" || s.state === "off";
          const Icon = ok ? CheckCircle2 : missing ? XCircle : AlertTriangle;
          const tone = ok ? "text-success" : missing ? "text-muted-foreground" : "text-warning";
          return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-border/50 pb-2 last:border-0", children: [
            /* @__PURE__ */ jsx("span", { className: "text-xs text-foreground", children: s.name }),
            /* @__PURE__ */ jsxs("span", { className: `flex items-center gap-1.5 font-mono text-xs ${tone}`, children: [
              /* @__PURE__ */ jsx(Icon, { className: "h-3.5 w-3.5" }),
              s.state.toUpperCase()
            ] })
          ] }, s.name);
        }) }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 rounded-md border border-border bg-card/60 p-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs", children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Текущий режим" }),
            /* @__PURE__ */ jsx("span", { className: "font-mono font-semibold text-primary", children: flightModeLabel[drone.mode] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-1.5 flex items-center justify-between text-xs", children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Failsafe" }),
            /* @__PURE__ */ jsx("span", { className: "font-mono text-success", children: "Готов" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(Panel, { title: "Погода", subtitle: "Условия в зоне полёта", children: /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "flex h-12 w-12 items-center justify-center rounded-md bg-info/10", children: /* @__PURE__ */ jsx(Wind, { className: "h-6 w-6 text-info" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "font-mono text-2xl font-bold text-foreground", children: [
              currentWeather.windSpeed,
              " м/с"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-[11px] text-muted-foreground", children: [
              "Ветер · ",
              currentWeather.windDirection
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 font-mono text-[11px]", children: [
          /* @__PURE__ */ jsx(Stat, { label: "Темп.", value: `${currentWeather.temperature}°C` }),
          /* @__PURE__ */ jsx(Stat, { label: "Видим.", value: `${currentWeather.visibility} км` }),
          /* @__PURE__ */ jsx(Stat, { label: "Давл.", value: `${currentWeather.pressure} мм` }),
          /* @__PURE__ */ jsx(Stat, { label: "Влажн.", value: `${currentWeather.humidity}%` })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "rounded-md border border-success/30 bg-success/10 px-3 py-2 text-xs text-success", children: "✓ Условия пригодны для полётов" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsx(Panel, { title: "Активные модули и инструменты", subtitle: "Краткий статус", children: /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: [{
      n: "Планировщик",
      s: "ok"
    }, {
      n: "YOLOv5 детекция",
      s: "ok"
    }, {
      n: "GPS+IMU EKF",
      s: "ok"
    }, {
      n: "PID контроль",
      s: "ok"
    }, {
      n: "MAVLink 2.0",
      s: "ok"
    }, {
      n: "DQN обучение",
      s: "warning"
    }, {
      n: "H.264 видео",
      s: "ok"
    }, {
      n: "ИИ-помощник",
      s: "ok"
    }, {
      n: "Координатор роя",
      s: "ok"
    }, {
      n: "Failsafe RTL",
      s: "ok"
    }].map((t) => /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] ${t.s === "ok" ? "border-success/30 bg-success/10 text-success" : "border-warning/30 bg-warning/10 text-warning"}`, children: [
      /* @__PURE__ */ jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-current" }),
      t.n
    ] }, t.n)) }) }) })
  ] });
}
function Stat({
  label,
  value
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded border border-border/50 bg-card/40 px-2 py-1.5", children: [
    /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: "font-semibold text-foreground", children: value })
  ] });
}
export {
  TelemetryPage as component
};
