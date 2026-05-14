import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect, useMemo } from "react";
import { P as PageHeader, S as StatCard, a as Panel } from "./Panel-DCNe0G5R.js";
import { D as DroneMap } from "./DroneMap-CR6Ae-Kc.js";
import { b as useMissions, u as useOps, c as initialFleet, m as missionTemplates, d as missionTypeLabel, e as initialGeoZones, f as missionStatusLabel } from "./router-BHqUf-SS.js";
import { Upload, Download, Plus, X, Play, Route, Pause, Trash2, Repeat, Save, Square, Calendar, Pencil, Check, Clock } from "lucide-react";
import "@tanstack/react-router";
import "@radix-ui/react-popover";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-slot";
import "class-variance-authority";
const statusTone = {
  running: "bg-primary/15 text-primary border-primary/30",
  pending: "bg-info/15 text-info border-info/30",
  completed: "bg-success/15 text-success border-success/30",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
  paused: "bg-warning/15 text-warning border-warning/30"
};
function MissionsPage() {
  const {
    missions,
    setMissions,
    updateMissionStatus
  } = useMissions();
  const {
    appendEvent
  } = useOps();
  const [selectedId, setSelectedId] = useState(missions[0]?.id ?? "");
  const [provider, setProvider] = useState("dark");
  const [planMode, setPlanMode] = useState(false);
  const [planWaypoints, setPlanWaypoints] = useState([]);
  const [planName, setPlanName] = useState("");
  const [planType, setPlanType] = useState("patrol");
  const [planAltitude, setPlanAltitude] = useState(35);
  const [planSpeed, setPlanSpeed] = useState(7);
  const [planRepeat, setPlanRepeat] = useState(false);
  const [planSchedule, setPlanSchedule] = useState("");
  const [planDroneIds, setPlanDroneIds] = useState([]);
  const [planDirectives, setPlanDirectives] = useState("");
  const [planPriority, setPlanPriority] = useState("normal");
  const fileInputRef = useRef(null);
  const [timeline, setTimeline] = useState(0);
  const [timelinePlaying, setTimelinePlaying] = useState(false);
  const [editingDirectives, setEditingDirectives] = useState(null);
  const [directivesDraft, setDirectivesDraft] = useState("");
  const saveDirectives = (missionId) => {
    setMissions((prev) => prev.map((m) => m.id === missionId ? {
      ...m,
      directives: directivesDraft.trim() || void 0
    } : m));
    setEditingDirectives(null);
  };
  const availableDrones = initialFleet.filter((d) => d.status !== "maintenance" && d.status !== "offline");
  const toggleDrone = (id) => {
    setPlanDroneIds((prev) => prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]);
  };
  const selected = missions.find((m) => m.id === selectedId);
  useEffect(() => {
    setTimeline(0);
    setTimelinePlaying(false);
  }, [selectedId]);
  useEffect(() => {
    if (!timelinePlaying) return;
    const id = window.setInterval(() => {
      setTimeline((t) => {
        const next = t + 0.01;
        if (next >= 1) {
          setTimelinePlaying(false);
          return 1;
        }
        return next;
      });
    }, 80);
    return () => window.clearInterval(id);
  }, [timelinePlaying]);
  const replayPosition = useMemo(() => {
    if (!selected || selected.waypoints.length < 2) return null;
    const wps = selected.waypoints;
    const segments = wps.length - 1;
    const pos = timeline * segments;
    const i = Math.min(Math.floor(pos), segments - 1);
    const frac = pos - i;
    const a = wps[i];
    const b = wps[i + 1];
    return [a.lat + (b.lat - a.lat) * frac, a.lng + (b.lng - a.lng) * frac];
  }, [selected, timeline]);
  const stats = useMemo(() => {
    return {
      total: missions.length,
      running: missions.filter((m) => m.status === "running").length,
      completed: missions.filter((m) => m.status === "completed").length,
      distance: missions.reduce((s, m) => s + m.distance, 0).toFixed(1)
    };
  }, [missions]);
  const mapCenter = planMode && planWaypoints.length > 0 ? [planWaypoints[0].lat, planWaypoints[0].lng] : selected && selected.waypoints.length > 0 ? [selected.waypoints[0].lat, selected.waypoints[0].lng] : [55.7558, 37.6173];
  const handleMapClick = (lat, lng) => {
    if (!planMode) return;
    setPlanWaypoints((prev) => [...prev, {
      lat,
      lng,
      altitude: planAltitude,
      speed: planSpeed
    }]);
  };
  const startNewMission = () => {
    setPlanMode(true);
    setPlanWaypoints([]);
    setPlanName("Новая миссия");
    setPlanType("patrol");
    setPlanDroneIds([]);
    setPlanDirectives("");
    setPlanPriority("normal");
  };
  const cancelPlan = () => {
    setPlanMode(false);
    setPlanWaypoints([]);
    setPlanDroneIds([]);
    setPlanDirectives("");
  };
  const saveMission = () => {
    if (planWaypoints.length < 1 || !planName.trim()) return;
    let dist = 0;
    for (let i = 1; i < planWaypoints.length; i++) {
      const a = planWaypoints[i - 1];
      const b = planWaypoints[i];
      const dx = (b.lng - a.lng) * 111 * Math.cos(a.lat * Math.PI / 180);
      const dy = (b.lat - a.lat) * 111;
      dist += Math.sqrt(dx * dx + dy * dy);
    }
    const newMission = {
      id: `MIS-${String(missions.length + 1).padStart(3, "0")}`,
      name: planName,
      type: planType,
      status: "pending",
      waypoints: planWaypoints,
      distance: Math.round(dist * 10) / 10,
      duration: Math.round(dist / planSpeed * 60),
      progress: 0,
      createdAt: (/* @__PURE__ */ new Date()).toLocaleString("ru-RU"),
      schedule: planRepeat ? planSchedule || "Каждый день" : void 0,
      droneIds: planDroneIds.length > 0 ? planDroneIds : void 0,
      droneId: planDroneIds[0],
      directives: planDirectives.trim() || void 0,
      priority: planPriority
    };
    setMissions((prev) => [newMission, ...prev]);
    setSelectedId(newMission.id);
    cancelPlan();
  };
  const applyTemplate = (templateId) => {
    const tpl = missionTemplates.find((t) => t.id === templateId);
    if (!tpl) return;
    setPlanMode(true);
    setPlanType(tpl.type);
    setPlanName(tpl.name);
    setPlanAltitude(tpl.defaultAltitude);
    setPlanSpeed(tpl.defaultSpeed);
    setPlanWaypoints([]);
    setPlanDroneIds([]);
    setPlanDirectives("");
    setPlanPriority("normal");
  };
  const deleteWaypoint = (index) => {
    setPlanWaypoints((prev) => prev.filter((_, i) => i !== index));
  };
  const exportMission = (mission, format) => {
    let content = "";
    let mime = "application/json";
    let ext = format;
    if (format === "json") {
      content = JSON.stringify(mission, null, 2);
    } else if (format === "csv") {
      content = "index,lat,lng,altitude,speed,action\n" + mission.waypoints.map((w, i) => `${i + 1},${w.lat},${w.lng},${w.altitude},${w.speed},${w.action ?? ""}`).join("\n");
      mime = "text/csv";
    } else if (format === "kml") {
      const coords = mission.waypoints.map((w) => `${w.lng},${w.lat},${w.altitude}`).join(" ");
      content = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${mission.name}</name>
    <Placemark>
      <name>${mission.id}</name>
      <LineString><coordinates>${coords}</coordinates></LineString>
    </Placemark>
  </Document>
</kml>`;
      mime = "application/vnd.google-earth.kml+xml";
    }
    const blob = new Blob([content], {
      type: mime
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${mission.id}_${mission.name}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result;
        let waypoints = [];
        if (file.name.endsWith(".json")) {
          const data = JSON.parse(text);
          waypoints = data.waypoints || data;
        } else if (file.name.endsWith(".csv")) {
          const lines = text.trim().split("\n").slice(1);
          waypoints = lines.map((l) => {
            const [, lat, lng, altitude, speed] = l.split(",");
            return {
              lat: +lat,
              lng: +lng,
              altitude: +altitude,
              speed: +speed
            };
          });
        }
        if (waypoints.length > 0) {
          setPlanMode(true);
          setPlanWaypoints(waypoints);
          setPlanName(file.name.replace(/\.[^.]+$/, ""));
        }
      } catch (err) {
        console.error("Import failed:", err);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };
  const mapMissions = planMode ? [{
    id: "PLAN",
    name: planName,
    type: planType,
    status: "pending",
    waypoints: planWaypoints,
    distance: 0,
    duration: 0,
    progress: 0,
    createdAt: ""
  }] : selected ? [selected] : [];
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PageHeader, { title: "Миссии", description: "Планирование, запуск и мониторинг полётных заданий", badge: `${missions.length} миссий`, actions: /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("input", { ref: fileInputRef, type: "file", accept: ".json,.csv,.kml,.gpx", onChange: handleImport, className: "hidden" }),
      /* @__PURE__ */ jsxs("button", { onClick: () => fileInputRef.current?.click(), className: "inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary", children: [
        /* @__PURE__ */ jsx(Upload, { className: "h-4 w-4" }),
        " Импорт"
      ] }),
      selected && /* @__PURE__ */ jsx("div", { className: "relative inline-block", children: /* @__PURE__ */ jsxs("button", { onClick: () => exportMission(selected, "json"), className: "inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary", children: [
        /* @__PURE__ */ jsx(Download, { className: "h-4 w-4" }),
        " Экспорт JSON"
      ] }) }),
      !planMode ? /* @__PURE__ */ jsxs("button", { onClick: startNewMission, className: "inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-[0_0_24px_oklch(0.82_0.18_200_/_0.4)] transition-opacity hover:opacity-90", children: [
        /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
        " Новая миссия"
      ] }) : /* @__PURE__ */ jsxs("button", { onClick: cancelPlan, className: "inline-flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/20", children: [
        /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }),
        " Отменить"
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 lg:grid-cols-4", children: [
      /* @__PURE__ */ jsx(StatCard, { label: "Всего миссий", value: stats.total, tone: "primary" }),
      /* @__PURE__ */ jsx(StatCard, { label: "Выполняется", value: stats.running, tone: "success", icon: /* @__PURE__ */ jsx(Play, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx(StatCard, { label: "Завершено", value: stats.completed, tone: "default" }),
      /* @__PURE__ */ jsx(StatCard, { label: "Общая дистанция", value: stats.distance, unit: "км", tone: "warning", icon: /* @__PURE__ */ jsx(Route, { className: "h-4 w-4" }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsx(Panel, { title: "Шаблоны миссий", subtitle: "Готовые сценарии · клик для создания", children: /* @__PURE__ */ jsx("div", { className: "grid gap-2 md:grid-cols-2 lg:grid-cols-3", children: missionTemplates.map((tpl) => /* @__PURE__ */ jsxs("button", { onClick: () => applyTemplate(tpl.id), className: "group flex flex-col rounded-md border border-border bg-card/50 p-3 text-left transition-colors hover:border-primary/50 hover:bg-card", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("span", { className: "font-semibold text-foreground", children: tpl.name }),
        /* @__PURE__ */ jsx("span", { className: "rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary", children: missionTypeLabel[tpl.type] })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: tpl.description }),
      /* @__PURE__ */ jsxs("div", { className: "mt-2 flex items-center gap-3 font-mono text-[10px] text-muted-foreground", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          "↑ ",
          tpl.defaultAltitude,
          "м"
        ] }),
        /* @__PURE__ */ jsxs("span", { children: [
          "→ ",
          tpl.defaultSpeed,
          " м/с"
        ] }),
        /* @__PURE__ */ jsxs("span", { children: [
          "· ",
          tpl.recommendedDrone
        ] })
      ] })
    ] }, tpl.id)) }) }) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-4 xl:grid-cols-3", children: [
      /* @__PURE__ */ jsx(Panel, { title: planMode ? "Планирование маршрута" : "Карта миссии", subtitle: planMode ? `Кликайте по карте для добавления точек · ${planWaypoints.length} точек` : selected?.name, padded: false, className: "xl:col-span-2", children: /* @__PURE__ */ jsxs("div", { className: "relative h-[480px] w-full", children: [
        /* @__PURE__ */ jsx(DroneMap, { drones: planMode ? [] : initialFleet.filter((d) => d.mission === selected?.id), missions: mapMissions, activeMissionId: planMode ? "PLAN" : selected?.id, geoZones: initialGeoZones, center: mapCenter, zoom: 14, provider, onProviderChange: setProvider, onMapClick: planMode ? handleMapClick : void 0 }),
        planMode && /* @__PURE__ */ jsx("div", { className: "absolute left-3 top-3 z-[400] rounded-md border border-primary/40 bg-background/90 px-3 py-2 font-mono text-[10px] text-primary backdrop-blur", children: "✦ Режим планирования · клик добавляет точку" }),
        !planMode && selected && selected.waypoints.length >= 2 && /* @__PURE__ */ jsxs("div", { className: "absolute bottom-3 left-3 right-3 z-[400] rounded-md border border-border bg-background/90 px-3 py-2 backdrop-blur", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("button", { onClick: () => setTimelinePlaying((v) => !v), className: "inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90", title: timelinePlaying ? "Пауза" : "Воспроизвести", children: timelinePlaying ? /* @__PURE__ */ jsx(Pause, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ jsx(Play, { className: "h-3.5 w-3.5 fill-current" }) }),
            /* @__PURE__ */ jsx("input", { type: "range", min: 0, max: 1, step: 1e-3, value: timeline, onChange: (e) => {
              setTimelinePlaying(false);
              setTimeline(parseFloat(e.target.value));
            }, className: "flex-1 accent-primary" }),
            /* @__PURE__ */ jsxs("span", { className: "font-mono text-[10px] text-muted-foreground tabular-nums", children: [
              Math.round(timeline * 100),
              "%"
            ] }),
            replayPosition && /* @__PURE__ */ jsxs("span", { className: "hidden font-mono text-[10px] text-muted-foreground sm:inline", children: [
              replayPosition[0].toFixed(4),
              ", ",
              replayPosition[1].toFixed(4)
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-1 text-[10px] uppercase tracking-wider text-muted-foreground", children: [
            "Replay миссии · ",
            selected.waypoints.length,
            " точек"
          ] })
        ] })
      ] }) }),
      planMode ? /* @__PURE__ */ jsx(Panel, { title: "Параметры миссии", subtitle: "Настройте перед сохранением", children: /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsx(Field, { label: "Название", children: /* @__PURE__ */ jsx("input", { value: planName, onChange: (e) => setPlanName(e.target.value), className: "w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:border-primary" }) }),
        /* @__PURE__ */ jsx(Field, { label: "Тип миссии", children: /* @__PURE__ */ jsx("select", { value: planType, onChange: (e) => setPlanType(e.target.value), className: "w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:border-primary", children: Object.entries(missionTypeLabel).map(([k, v]) => /* @__PURE__ */ jsx("option", { value: k, children: v }, k)) }) }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
          /* @__PURE__ */ jsx(Field, { label: "Высота, м", children: /* @__PURE__ */ jsx("input", { type: "number", value: planAltitude, onChange: (e) => setPlanAltitude(+e.target.value), className: "w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:border-primary" }) }),
          /* @__PURE__ */ jsx(Field, { label: "Скорость, м/с", children: /* @__PURE__ */ jsx("input", { type: "number", value: planSpeed, onChange: (e) => setPlanSpeed(+e.target.value), className: "w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:border-primary" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-border bg-card/40 p-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-2 flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("span", { className: "font-mono text-[10px] uppercase tracking-wider text-muted-foreground", children: [
              "Точки маршрута (",
              planWaypoints.length,
              ")"
            ] }),
            planWaypoints.length > 0 && /* @__PURE__ */ jsx("button", { onClick: () => setPlanWaypoints([]), className: "text-[10px] text-destructive hover:underline", children: "Очистить" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "max-h-40 space-y-1 overflow-y-auto", children: [
            planWaypoints.length === 0 && /* @__PURE__ */ jsx("div", { className: "py-3 text-center text-[11px] text-muted-foreground", children: "Кликайте по карте слева" }),
            planWaypoints.map((wp, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 rounded border border-border/50 bg-card/60 px-2 py-1.5", children: [
              /* @__PURE__ */ jsx("span", { className: "flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 font-mono text-[10px] font-bold text-primary", children: i + 1 }),
              /* @__PURE__ */ jsxs("span", { className: "flex-1 font-mono text-[10px] text-foreground", children: [
                wp.lat.toFixed(4),
                ", ",
                wp.lng.toFixed(4)
              ] }),
              /* @__PURE__ */ jsx("button", { onClick: () => deleteWaypoint(i), className: "text-muted-foreground hover:text-destructive", children: /* @__PURE__ */ jsx(Trash2, { className: "h-3 w-3" }) })
            ] }, i))
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Field, { label: `Исполнители (${planDroneIds.length} выбрано)`, children: [
          /* @__PURE__ */ jsx("div", { className: "max-h-36 space-y-1 overflow-y-auto rounded-md border border-border bg-card/40 p-2", children: availableDrones.map((d) => {
            const checked = planDroneIds.includes(d.id);
            return /* @__PURE__ */ jsxs("label", { className: ["flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors", checked ? "bg-primary/15 text-primary" : "text-foreground hover:bg-secondary/60"].join(" "), children: [
              /* @__PURE__ */ jsx("input", { type: "checkbox", checked, onChange: () => toggleDrone(d.id), className: "rounded border-border" }),
              /* @__PURE__ */ jsx("span", { className: "font-mono text-[10px] text-muted-foreground", children: d.id }),
              /* @__PURE__ */ jsx("span", { className: "flex-1 truncate font-medium", children: d.name }),
              /* @__PURE__ */ jsxs("span", { className: "font-mono text-[10px] text-muted-foreground", children: [
                d.battery,
                "%"
              ] })
            ] }, d.id);
          }) }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-[10px] text-muted-foreground", children: "Можно выбрать несколько — миссия выполняется группой" })
        ] }),
        /* @__PURE__ */ jsx(Field, { label: "Приоритет", children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-4 gap-1", children: ["low", "normal", "high", "critical"].map((p) => {
          const tones = {
            low: "border-muted-foreground/30 text-muted-foreground",
            normal: "border-info/40 text-info",
            high: "border-warning/50 text-warning",
            critical: "border-destructive/50 text-destructive"
          };
          const labels = {
            low: "Низкий",
            normal: "Обычный",
            high: "Высокий",
            critical: "Критич."
          };
          const active = planPriority === p;
          return /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setPlanPriority(p), className: ["rounded-md border px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors", tones[p], active ? "bg-secondary" : "bg-card/40 hover:bg-secondary/50"].join(" "), children: labels[p] }, p);
        }) }) }),
        /* @__PURE__ */ jsxs(Field, { label: "Условности миссии", children: [
          /* @__PURE__ */ jsx("textarea", { value: planDirectives, onChange: (e) => setPlanDirectives(e.target.value), rows: 3, placeholder: "Например: «Сопровождай объект, оставаясь незаметным» или «Доставь как можно быстрее, не жалей батарею»", className: "w-full resize-none rounded-md border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-primary" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-[10px] text-muted-foreground", children: "Временные инструкции и приоритеты — ИИ учтёт их при выполнении" })
        ] }),
        /* @__PURE__ */ jsxs(Field, { label: "", children: [
          /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-xs text-foreground", children: [
            /* @__PURE__ */ jsx("input", { type: "checkbox", checked: planRepeat, onChange: (e) => setPlanRepeat(e.target.checked), className: "rounded border-border" }),
            /* @__PURE__ */ jsx(Repeat, { className: "h-3.5 w-3.5 text-primary" }),
            "Повторять по расписанию"
          ] }),
          planRepeat && /* @__PURE__ */ jsx("input", { value: planSchedule, onChange: (e) => setPlanSchedule(e.target.value), placeholder: "Каждый день в 08:00", className: "mt-2 w-full rounded-md border border-border bg-input px-3 py-2 text-xs text-foreground outline-none" })
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: saveMission, disabled: planWaypoints.length === 0 || !planName.trim(), className: "flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40", children: [
          /* @__PURE__ */ jsx(Save, { className: "h-4 w-4" }),
          " Сохранить миссию"
        ] })
      ] }) }) : selected ? /* @__PURE__ */ jsx(Panel, { title: "Детали миссии", subtitle: selected.name, children: /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsxs("button", { onClick: () => {
            updateMissionStatus(selected.id, "running");
            appendEvent({
              level: "success",
              source: "Mission",
              message: `${selected.id}: миссия запущена`
            });
          }, className: "inline-flex items-center gap-1.5 rounded-md bg-success px-3 py-1.5 text-xs font-semibold text-success-foreground hover:opacity-90", children: [
            /* @__PURE__ */ jsx(Play, { className: "h-3.5 w-3.5" }),
            " Запустить"
          ] }),
          /* @__PURE__ */ jsxs("button", { onClick: () => {
            updateMissionStatus(selected.id, "paused");
            appendEvent({
              level: "warning",
              source: "Mission",
              message: `${selected.id}: миссия поставлена на паузу`
            });
          }, className: "inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary", children: [
            /* @__PURE__ */ jsx(Pause, { className: "h-3.5 w-3.5" }),
            " Пауза"
          ] }),
          /* @__PURE__ */ jsxs("button", { onClick: () => {
            updateMissionStatus(selected.id, "failed");
            appendEvent({
              level: "error",
              source: "Mission",
              message: `${selected.id}: миссия остановлена оператором`
            });
          }, className: "inline-flex items-center gap-1.5 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20", children: [
            /* @__PURE__ */ jsx(Square, { className: "h-3.5 w-3.5" }),
            " Стоп"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 rounded-md border border-border bg-card/50 p-3", children: [
          /* @__PURE__ */ jsx(Detail, { label: "Тип", value: missionTypeLabel[selected.type] }),
          /* @__PURE__ */ jsx(Detail, { label: "Статус", value: missionStatusLabel[selected.status] }),
          /* @__PURE__ */ jsx(Detail, { label: "Точек", value: String(selected.waypoints.length) }),
          /* @__PURE__ */ jsx(Detail, { label: "Дистанция", value: `${selected.distance} км` }),
          /* @__PURE__ */ jsx(Detail, { label: "Время", value: `${selected.duration} мин` }),
          /* @__PURE__ */ jsx(Detail, { label: "Прогресс", value: `${selected.progress}%` })
        ] }),
        selected.schedule && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 rounded-md border border-info/30 bg-info/10 px-3 py-2 text-xs text-info", children: [
          /* @__PURE__ */ jsx(Calendar, { className: "h-3.5 w-3.5" }),
          " ",
          selected.schedule
        ] }),
        selected.priority && selected.priority !== "normal" && /* @__PURE__ */ jsxs("div", { className: ["flex items-center gap-2 rounded-md border px-3 py-2 text-xs", selected.priority === "critical" && "border-destructive/40 bg-destructive/10 text-destructive", selected.priority === "high" && "border-warning/40 bg-warning/10 text-warning", selected.priority === "low" && "border-muted-foreground/30 bg-secondary/40 text-muted-foreground"].filter(Boolean).join(" "), children: [
          /* @__PURE__ */ jsx("span", { className: "font-mono text-[10px] uppercase tracking-wider", children: "Приоритет" }),
          /* @__PURE__ */ jsx("span", { className: "font-semibold", children: selected.priority === "critical" ? "Критический" : selected.priority === "high" ? "Высокий" : "Низкий" })
        ] }),
        selected.droneIds && selected.droneIds.length > 0 || selected.droneId ? /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground", children: "Исполнители" }),
          /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5", children: (selected.droneIds && selected.droneIds.length > 0 ? selected.droneIds : selected.droneId ? [selected.droneId] : []).map((did) => {
            const d = initialFleet.find((x) => x.id === did);
            return /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] text-primary", children: [
              /* @__PURE__ */ jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-primary" }),
              d?.name ?? did,
              /* @__PURE__ */ jsx("span", { className: "font-mono text-[9px] text-muted-foreground", children: did })
            ] }, did);
          }) })
        ] }) : null,
        /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-accent/40 bg-accent/5 p-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-1.5 flex items-center justify-between gap-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-accent-foreground", children: [
              /* @__PURE__ */ jsx("span", { children: "✦" }),
              " Условности миссии"
            ] }),
            editingDirectives !== selected.id ? /* @__PURE__ */ jsxs("button", { onClick: () => {
              setEditingDirectives(selected.id);
              setDirectivesDraft(selected.directives ?? "");
            }, className: "inline-flex items-center gap-1 rounded border border-border bg-card/60 px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary", children: [
              /* @__PURE__ */ jsx(Pencil, { className: "h-3 w-3" }),
              selected.directives ? "Изменить" : "Добавить"
            ] }) : /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsxs("button", { onClick: () => saveDirectives(selected.id), className: "inline-flex items-center gap-1 rounded border border-success/40 bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success hover:bg-success/20", children: [
                /* @__PURE__ */ jsx(Check, { className: "h-3 w-3" }),
                " Сохранить"
              ] }),
              /* @__PURE__ */ jsxs("button", { onClick: () => setEditingDirectives(null), className: "inline-flex items-center gap-1 rounded border border-border bg-card/60 px-2 py-0.5 text-[10px] text-muted-foreground hover:text-destructive", children: [
                /* @__PURE__ */ jsx(X, { className: "h-3 w-3" }),
                " Отмена"
              ] })
            ] })
          ] }),
          editingDirectives === selected.id ? /* @__PURE__ */ jsx("textarea", { value: directivesDraft, onChange: (e) => setDirectivesDraft(e.target.value), rows: 4, autoFocus: true, placeholder: "Например: «Сопровождай объект, оставаясь незаметным» или «Доставь как можно быстрее, не жалей батарею»", className: "w-full resize-none rounded-md border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-primary" }) : selected.directives ? /* @__PURE__ */ jsx("p", { className: "text-xs leading-relaxed text-foreground/90", children: selected.directives }) : /* @__PURE__ */ jsx("p", { className: "text-xs italic text-muted-foreground", children: "Директивы не заданы. Нажмите «Добавить», чтобы передать ИИ временные инструкции." })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground", children: "Путевые точки" }),
          /* @__PURE__ */ jsxs("div", { className: "max-h-48 space-y-1 overflow-y-auto", children: [
            selected.waypoints.slice(0, 10).map((wp, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 rounded border border-border bg-card/40 px-3 py-1.5", children: [
              /* @__PURE__ */ jsx("span", { className: "flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 font-mono text-[10px] font-bold text-primary", children: i + 1 }),
              /* @__PURE__ */ jsxs("span", { className: "flex-1 font-mono text-[10px] text-foreground", children: [
                wp.lat.toFixed(4),
                ", ",
                wp.lng.toFixed(4)
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "font-mono text-[10px] text-muted-foreground", children: [
                "↑",
                wp.altitude,
                "м · ",
                wp.speed,
                "м/с"
              ] })
            ] }, i)),
            selected.waypoints.length > 10 && /* @__PURE__ */ jsxs("div", { className: "text-center text-[11px] text-muted-foreground", children: [
              "+ ещё ",
              selected.waypoints.length - 10,
              " точек"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-1 border-t border-border pt-3", children: [
          /* @__PURE__ */ jsx("button", { onClick: () => exportMission(selected, "json"), className: "rounded border border-border bg-card px-2 py-1.5 text-[10px] font-mono text-muted-foreground hover:text-foreground", children: "JSON" }),
          /* @__PURE__ */ jsx("button", { onClick: () => exportMission(selected, "csv"), className: "rounded border border-border bg-card px-2 py-1.5 text-[10px] font-mono text-muted-foreground hover:text-foreground", children: "CSV" }),
          /* @__PURE__ */ jsx("button", { onClick: () => exportMission(selected, "kml"), className: "rounded border border-border bg-card px-2 py-1.5 text-[10px] font-mono text-muted-foreground hover:text-foreground", children: "KML" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-[11px] text-muted-foreground", children: [
          /* @__PURE__ */ jsx(Clock, { className: "h-3.5 w-3.5" }),
          selected.createdAt
        ] })
      ] }) }) : null
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsx(Panel, { title: "Очередь миссий", subtitle: `${missions.length} в списке`, padded: false, children: /* @__PURE__ */ jsx("div", { className: "divide-y divide-border", children: missions.map((m) => /* @__PURE__ */ jsxs("button", { onClick: () => {
      setSelectedId(m.id);
      setPlanMode(false);
    }, className: ["flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-secondary/50", selectedId === m.id && !planMode ? "bg-primary/5" : ""].join(" "), children: [
      /* @__PURE__ */ jsx("div", { className: "font-mono text-[11px] text-muted-foreground w-16", children: m.id }),
      /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsx("div", { className: "truncate text-sm font-semibold text-foreground", children: m.name }),
        /* @__PURE__ */ jsxs("div", { className: "mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground", children: [
          /* @__PURE__ */ jsx("span", { children: missionTypeLabel[m.type] }),
          /* @__PURE__ */ jsx("span", { children: "·" }),
          /* @__PURE__ */ jsxs("span", { children: [
            m.waypoints.length,
            " точек"
          ] }),
          /* @__PURE__ */ jsx("span", { children: "·" }),
          /* @__PURE__ */ jsxs("span", { children: [
            m.distance,
            " км"
          ] }),
          m.schedule && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("span", { children: "·" }),
            /* @__PURE__ */ jsxs("span", { className: "text-info", children: [
              "⏱ ",
              m.schedule
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "hidden w-32 sm:block", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-1 flex justify-between text-[10px] text-muted-foreground", children: [
          /* @__PURE__ */ jsx("span", { children: "Прогресс" }),
          /* @__PURE__ */ jsxs("span", { className: "font-mono", children: [
            m.progress,
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-1.5 w-full overflow-hidden rounded-full bg-secondary", children: /* @__PURE__ */ jsx("div", { className: "h-full rounded-full bg-primary", style: {
          width: `${m.progress}%`
        } }) })
      ] }),
      /* @__PURE__ */ jsx("span", { className: ["inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium", statusTone[m.status]].join(" "), children: missionStatusLabel[m.status] })
    ] }, m.id)) }) }) })
  ] });
}
function Field({
  label,
  children
}) {
  return /* @__PURE__ */ jsxs("div", { children: [
    label && /* @__PURE__ */ jsx("div", { className: "mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground", children: label }),
    children
  ] });
}
function Detail({
  label,
  value
}) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("div", { className: "font-mono text-[10px] uppercase tracking-wider text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: "mt-0.5 text-sm font-semibold text-foreground", children: value })
  ] });
}
export {
  MissionsPage as component
};
