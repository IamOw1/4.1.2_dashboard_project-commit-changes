import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel, StatCard } from "@/components/dashboard/Panel";
import { DroneMap, type MapProvider } from "@/components/dashboard/DroneMap";
import {
  missionStatusLabel,
  missionTypeLabel,
  missionTemplates,
  initialFleet,
  initialGeoZones,
  type Mission,
  type MissionType,
  type Waypoint,
} from "@/lib/mock-data";
import { useMissions } from "@/lib/mission-context";
import { useOps } from "@/lib/ops-context";
import {
  Plus,
  Play,
  Pause,
  Square,
  Download,
  Upload,
  Clock,
  Route as RouteIcon,
  Trash2,
  Calendar,
  Repeat,
  Save,
  X,
  Pencil,
  Check,
} from "lucide-react";

export const Route = createFileRoute("/missions")({
  head: () => ({
    meta: [
      { title: "Миссии · COBA AI" },
      { name: "description", content: "Создание и управление полётными миссиями COBA AI." },
    ],
  }),
  component: MissionsPage,
});

const statusTone: Record<Mission["status"], string> = {
  running: "bg-primary/15 text-primary border-primary/30",
  pending: "bg-info/15 text-info border-info/30",
  completed: "bg-success/15 text-success border-success/30",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
  paused: "bg-warning/15 text-warning border-warning/30",
};

function MissionsPage() {
  const { missions, setMissions, updateMissionStatus } = useMissions();
  const { appendEvent } = useOps();
  const [selectedId, setSelectedId] = useState<string>(missions[0]?.id ?? "");
  const [provider, setProvider] = useState<MapProvider>("dark");
  const [planMode, setPlanMode] = useState(false);
  const [planWaypoints, setPlanWaypoints] = useState<Waypoint[]>([]);
  const [planName, setPlanName] = useState("");
  const [planType, setPlanType] = useState<MissionType>("patrol");
  const [planAltitude, setPlanAltitude] = useState(35);
  const [planSpeed, setPlanSpeed] = useState(7);
  const [planRepeat, setPlanRepeat] = useState(false);
  const [planSchedule, setPlanSchedule] = useState("");
  const [planDroneIds, setPlanDroneIds] = useState<string[]>([]);
  const [planDirectives, setPlanDirectives] = useState("");
  const [planPriority, setPlanPriority] = useState<NonNullable<Mission["priority"]>>("normal");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Replay/timeline: позиция виртуального дрона на маршруте выбранной миссии (0..1).
  const [timeline, setTimeline] = useState(0);
  const [timelinePlaying, setTimelinePlaying] = useState(false);

  const [editingDirectives, setEditingDirectives] = useState<string | null>(null);
  const [directivesDraft, setDirectivesDraft] = useState("");

  const saveDirectives = (missionId: string) => {
    setMissions((prev) =>
      prev.map((m) =>
        m.id === missionId ? { ...m, directives: directivesDraft.trim() || undefined } : m,
      ),
    );
    setEditingDirectives(null);
  };

  const availableDrones = initialFleet.filter((d) => d.status !== "maintenance" && d.status !== "offline");

  const toggleDrone = (id: string) => {
    setPlanDroneIds((prev) => prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]);
  };

  const selected = missions.find((m) => m.id === selectedId);

  // Сбрасываем таймлайн при смене миссии
  useEffect(() => {
    setTimeline(0);
    setTimelinePlaying(false);
  }, [selectedId]);

  // Автоплей таймлайна
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

  // Интерполяция позиции виртуального дрона между waypoints
  const replayPosition = useMemo<[number, number] | null>(() => {
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
      distance: missions.reduce((s, m) => s + m.distance, 0).toFixed(1),
    };
  }, [missions]);

  // map center: selected mission first WP or default
  const mapCenter: [number, number] = planMode && planWaypoints.length > 0
    ? [planWaypoints[0].lat, planWaypoints[0].lng]
    : selected && selected.waypoints.length > 0
      ? [selected.waypoints[0].lat, selected.waypoints[0].lng]
      : [55.7558, 37.6173];

  const handleMapClick = (lat: number, lng: number) => {
    if (!planMode) return;
    setPlanWaypoints((prev) => [
      ...prev,
      { lat, lng, altitude: planAltitude, speed: planSpeed },
    ]);
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
      const dx = (b.lng - a.lng) * 111 * Math.cos((a.lat * Math.PI) / 180);
      const dy = (b.lat - a.lat) * 111;
      dist += Math.sqrt(dx * dx + dy * dy);
    }
    const newMission: Mission = {
      id: `MIS-${String(missions.length + 1).padStart(3, "0")}`,
      name: planName,
      type: planType,
      status: "pending",
      waypoints: planWaypoints,
      distance: Math.round(dist * 10) / 10,
      duration: Math.round((dist / planSpeed) * 60),
      progress: 0,
      createdAt: new Date().toLocaleString("ru-RU"),
      schedule: planRepeat ? planSchedule || "Каждый день" : undefined,
      droneIds: planDroneIds.length > 0 ? planDroneIds : undefined,
      droneId: planDroneIds[0],
      directives: planDirectives.trim() || undefined,
      priority: planPriority,
    };
    setMissions((prev) => [newMission, ...prev]);
    setSelectedId(newMission.id);
    cancelPlan();
  };

  const applyTemplate = (templateId: string) => {
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

  const deleteWaypoint = (index: number) => {
    setPlanWaypoints((prev) => prev.filter((_, i) => i !== index));
  };

  const exportMission = (mission: Mission, format: "json" | "kml" | "csv") => {
    let content = "";
    let mime = "application/json";
    let ext = format;

    if (format === "json") {
      content = JSON.stringify(mission, null, 2);
    } else if (format === "csv") {
      content = "index,lat,lng,altitude,speed,action\n" +
        mission.waypoints.map((w, i) => `${i + 1},${w.lat},${w.lng},${w.altitude},${w.speed},${w.action ?? ""}`).join("\n");
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

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${mission.id}_${mission.name}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        let waypoints: Waypoint[] = [];
        if (file.name.endsWith(".json")) {
          const data = JSON.parse(text);
          waypoints = (data.waypoints || data) as Waypoint[];
        } else if (file.name.endsWith(".csv")) {
          const lines = text.trim().split("\n").slice(1);
          waypoints = lines.map((l) => {
            const [, lat, lng, altitude, speed] = l.split(",");
            return { lat: +lat, lng: +lng, altitude: +altitude, speed: +speed };
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

  // Mission to display on map: planning mission or selected
  const mapMissions: Mission[] = planMode
    ? [
        {
          id: "PLAN",
          name: planName,
          type: planType,
          status: "pending",
          waypoints: planWaypoints,
          distance: 0,
          duration: 0,
          progress: 0,
          createdAt: "",
        },
      ]
    : selected
      ? [selected]
      : [];

  return (
    <>
      <PageHeader
        title="Миссии"
        description="Планирование, запуск и мониторинг полётных заданий"
        badge={`${missions.length} миссий`}
        actions={
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv,.kml,.gpx"
              onChange={handleImport}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <Upload className="h-4 w-4" /> Импорт
            </button>
            {selected && (
              <div className="relative inline-block">
                <button
                  onClick={() => exportMission(selected, "json")}
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  <Download className="h-4 w-4" /> Экспорт JSON
                </button>
              </div>
            )}
            {!planMode ? (
              <button
                onClick={startNewMission}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-[0_0_24px_oklch(0.82_0.18_200_/_0.4)] transition-opacity hover:opacity-90"
              >
                <Plus className="h-4 w-4" /> Новая миссия
              </button>
            ) : (
              <button
                onClick={cancelPlan}
                className="inline-flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/20"
              >
                <X className="h-4 w-4" /> Отменить
              </button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Всего миссий" value={stats.total} tone="primary" />
        <StatCard label="Выполняется" value={stats.running} tone="success" icon={<Play className="h-4 w-4" />} />
        <StatCard label="Завершено" value={stats.completed} tone="default" />
        <StatCard label="Общая дистанция" value={stats.distance} unit="км" tone="warning" icon={<RouteIcon className="h-4 w-4" />} />
      </div>

      {/* Templates */}
      <div className="mt-4">
        <Panel title="Шаблоны миссий" subtitle="Готовые сценарии · клик для создания">
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {missionTemplates.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => applyTemplate(tpl.id)}
                className="group flex flex-col rounded-md border border-border bg-card/50 p-3 text-left transition-colors hover:border-primary/50 hover:bg-card"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{tpl.name}</span>
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">
                    {missionTypeLabel[tpl.type]}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{tpl.description}</p>
                <div className="mt-2 flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
                  <span>↑ {tpl.defaultAltitude}м</span>
                  <span>→ {tpl.defaultSpeed} м/с</span>
                  <span>· {tpl.recommendedDrone}</span>
                </div>
              </button>
            ))}
          </div>
        </Panel>
      </div>

      {/* Main: Map + sidebar */}
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel
          title={planMode ? "Планирование маршрута" : "Карта миссии"}
          subtitle={planMode ? `Кликайте по карте для добавления точек · ${planWaypoints.length} точек` : selected?.name}
          padded={false}
          className="xl:col-span-2"
        >
          <div className="relative h-[480px] w-full">
            <DroneMap
              drones={planMode ? [] : initialFleet.filter((d) => d.mission === selected?.id)}
              missions={mapMissions}
              activeMissionId={planMode ? "PLAN" : selected?.id}
              geoZones={initialGeoZones}
              center={mapCenter}
              zoom={14}
              provider={provider}
              onProviderChange={setProvider}
              onMapClick={planMode ? handleMapClick : undefined}
            />
            {planMode && (
              <div className="absolute left-3 top-3 z-[400] rounded-md border border-primary/40 bg-background/90 px-3 py-2 font-mono text-[10px] text-primary backdrop-blur">
                ✦ Режим планирования · клик добавляет точку
              </div>
            )}
            {!planMode && selected && selected.waypoints.length >= 2 && (
              <div className="absolute bottom-3 left-3 right-3 z-[400] rounded-md border border-border bg-background/90 px-3 py-2 backdrop-blur">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setTimelinePlaying((v) => !v)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90"
                    title={timelinePlaying ? "Пауза" : "Воспроизвести"}
                  >
                    {timelinePlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.001}
                    value={timeline}
                    onChange={(e) => {
                      setTimelinePlaying(false);
                      setTimeline(parseFloat(e.target.value));
                    }}
                    className="flex-1 accent-primary"
                  />
                  <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                    {Math.round(timeline * 100)}%
                  </span>
                  {replayPosition && (
                    <span className="hidden font-mono text-[10px] text-muted-foreground sm:inline">
                      {replayPosition[0].toFixed(4)}, {replayPosition[1].toFixed(4)}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  Replay миссии · {selected.waypoints.length} точек
                </div>
              </div>
            )}
          </div>
        </Panel>

        {planMode ? (
          <Panel title="Параметры миссии" subtitle="Настройте перед сохранением">
            <div className="space-y-3">
              <Field label="Название">
                <input
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                />
              </Field>
              <Field label="Тип миссии">
                <select
                  value={planType}
                  onChange={(e) => setPlanType(e.target.value as MissionType)}
                  className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                >
                  {Object.entries(missionTypeLabel).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Высота, м">
                  <input
                    type="number"
                    value={planAltitude}
                    onChange={(e) => setPlanAltitude(+e.target.value)}
                    className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  />
                </Field>
                <Field label="Скорость, м/с">
                  <input
                    type="number"
                    value={planSpeed}
                    onChange={(e) => setPlanSpeed(+e.target.value)}
                    className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  />
                </Field>
              </div>

              <div className="rounded-md border border-border bg-card/40 p-2">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Точки маршрута ({planWaypoints.length})
                  </span>
                  {planWaypoints.length > 0 && (
                    <button
                      onClick={() => setPlanWaypoints([])}
                      className="text-[10px] text-destructive hover:underline"
                    >
                      Очистить
                    </button>
                  )}
                </div>
                <div className="max-h-40 space-y-1 overflow-y-auto">
                  {planWaypoints.length === 0 && (
                    <div className="py-3 text-center text-[11px] text-muted-foreground">
                      Кликайте по карте слева
                    </div>
                  )}
                  {planWaypoints.map((wp, i) => (
                    <div key={i} className="flex items-center gap-2 rounded border border-border/50 bg-card/60 px-2 py-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 font-mono text-[10px] font-bold text-primary">
                        {i + 1}
                      </span>
                      <span className="flex-1 font-mono text-[10px] text-foreground">
                        {wp.lat.toFixed(4)}, {wp.lng.toFixed(4)}
                      </span>
                      <button
                        onClick={() => deleteWaypoint(i)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Назначение дронов */}
              <Field label={`Исполнители (${planDroneIds.length} выбрано)`}>
                <div className="max-h-36 space-y-1 overflow-y-auto rounded-md border border-border bg-card/40 p-2">
                  {availableDrones.map((d) => {
                    const checked = planDroneIds.includes(d.id);
                    return (
                      <label
                        key={d.id}
                        className={[
                          "flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors",
                          checked ? "bg-primary/15 text-primary" : "text-foreground hover:bg-secondary/60",
                        ].join(" ")}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleDrone(d.id)}
                          className="rounded border-border"
                        />
                        <span className="font-mono text-[10px] text-muted-foreground">{d.id}</span>
                        <span className="flex-1 truncate font-medium">{d.name}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">{d.battery}%</span>
                      </label>
                    );
                  })}
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Можно выбрать несколько — миссия выполняется группой
                </p>
              </Field>

              {/* Приоритет */}
              <Field label="Приоритет">
                <div className="grid grid-cols-4 gap-1">
                  {(["low", "normal", "high", "critical"] as const).map((p) => {
                    const tones = {
                      low: "border-muted-foreground/30 text-muted-foreground",
                      normal: "border-info/40 text-info",
                      high: "border-warning/50 text-warning",
                      critical: "border-destructive/50 text-destructive",
                    };
                    const labels = { low: "Низкий", normal: "Обычный", high: "Высокий", critical: "Критич." };
                    const active = planPriority === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPlanPriority(p)}
                        className={[
                          "rounded-md border px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors",
                          tones[p],
                          active ? "bg-secondary" : "bg-card/40 hover:bg-secondary/50",
                        ].join(" ")}
                      >
                        {labels[p]}
                      </button>
                    );
                  })}
                </div>
              </Field>

              {/* Условности миссии — текстовые директивы для ИИ */}
              <Field label="Условности миссии">
                <textarea
                  value={planDirectives}
                  onChange={(e) => setPlanDirectives(e.target.value)}
                  rows={3}
                  placeholder="Например: «Сопровождай объект, оставаясь незаметным» или «Доставь как можно быстрее, не жалей батарею»"
                  className="w-full resize-none rounded-md border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
                />
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Временные инструкции и приоритеты — ИИ учтёт их при выполнении
                </p>
              </Field>

              <Field label="">
                <label className="flex items-center gap-2 text-xs text-foreground">
                  <input
                    type="checkbox"
                    checked={planRepeat}
                    onChange={(e) => setPlanRepeat(e.target.checked)}
                    className="rounded border-border"
                  />
                  <Repeat className="h-3.5 w-3.5 text-primary" />
                  Повторять по расписанию
                </label>
                {planRepeat && (
                  <input
                    value={planSchedule}
                    onChange={(e) => setPlanSchedule(e.target.value)}
                    placeholder="Каждый день в 08:00"
                    className="mt-2 w-full rounded-md border border-border bg-input px-3 py-2 text-xs text-foreground outline-none"
                  />
                )}
              </Field>

              <button
                onClick={saveMission}
                disabled={planWaypoints.length === 0 || !planName.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                <Save className="h-4 w-4" /> Сохранить миссию
              </button>
            </div>
          </Panel>
        ) : selected ? (
          <Panel title="Детали миссии" subtitle={selected.name}>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <button onClick={() => { updateMissionStatus(selected.id, "running"); appendEvent({ level: "success", source: "Mission", message: `${selected.id}: миссия запущена` }); }} className="inline-flex items-center gap-1.5 rounded-md bg-success px-3 py-1.5 text-xs font-semibold text-success-foreground hover:opacity-90">
                  <Play className="h-3.5 w-3.5" /> Запустить
                </button>
                <button onClick={() => { updateMissionStatus(selected.id, "paused"); appendEvent({ level: "warning", source: "Mission", message: `${selected.id}: миссия поставлена на паузу` }); }} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary">
                  <Pause className="h-3.5 w-3.5" /> Пауза
                </button>
                <button onClick={() => { updateMissionStatus(selected.id, "failed"); appendEvent({ level: "error", source: "Mission", message: `${selected.id}: миссия остановлена оператором` }); }} className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20">
                  <Square className="h-3.5 w-3.5" /> Стоп
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-md border border-border bg-card/50 p-3">
                <Detail label="Тип" value={missionTypeLabel[selected.type]} />
                <Detail label="Статус" value={missionStatusLabel[selected.status]} />
                <Detail label="Точек" value={String(selected.waypoints.length)} />
                <Detail label="Дистанция" value={`${selected.distance} км`} />
                <Detail label="Время" value={`${selected.duration} мин`} />
                <Detail label="Прогресс" value={`${selected.progress}%`} />
              </div>

              {selected.schedule && (
                <div className="flex items-center gap-2 rounded-md border border-info/30 bg-info/10 px-3 py-2 text-xs text-info">
                  <Calendar className="h-3.5 w-3.5" /> {selected.schedule}
                </div>
              )}

              {selected.priority && selected.priority !== "normal" && (
                <div
                  className={[
                    "flex items-center gap-2 rounded-md border px-3 py-2 text-xs",
                    selected.priority === "critical" && "border-destructive/40 bg-destructive/10 text-destructive",
                    selected.priority === "high" && "border-warning/40 bg-warning/10 text-warning",
                    selected.priority === "low" && "border-muted-foreground/30 bg-secondary/40 text-muted-foreground",
                  ].filter(Boolean).join(" ")}
                >
                  <span className="font-mono text-[10px] uppercase tracking-wider">Приоритет</span>
                  <span className="font-semibold">
                    {selected.priority === "critical" ? "Критический" : selected.priority === "high" ? "Высокий" : "Низкий"}
                  </span>
                </div>
              )}

              {(selected.droneIds && selected.droneIds.length > 0) || selected.droneId ? (
                <div>
                  <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Исполнители
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(selected.droneIds && selected.droneIds.length > 0
                      ? selected.droneIds
                      : selected.droneId ? [selected.droneId] : []
                    ).map((did) => {
                      const d = initialFleet.find((x) => x.id === did);
                      return (
                        <span
                          key={did}
                          className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] text-primary"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          {d?.name ?? did}
                          <span className="font-mono text-[9px] text-muted-foreground">{did}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="rounded-md border border-accent/40 bg-accent/5 p-3">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-accent-foreground">
                    <span>✦</span> Условности миссии
                  </div>
                  {editingDirectives !== selected.id ? (
                    <button
                      onClick={() => {
                        setEditingDirectives(selected.id);
                        setDirectivesDraft(selected.directives ?? "");
                      }}
                      className="inline-flex items-center gap-1 rounded border border-border bg-card/60 px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                    >
                      <Pencil className="h-3 w-3" />
                      {selected.directives ? "Изменить" : "Добавить"}
                    </button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => saveDirectives(selected.id)}
                        className="inline-flex items-center gap-1 rounded border border-success/40 bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success hover:bg-success/20"
                      >
                        <Check className="h-3 w-3" /> Сохранить
                      </button>
                      <button
                        onClick={() => setEditingDirectives(null)}
                        className="inline-flex items-center gap-1 rounded border border-border bg-card/60 px-2 py-0.5 text-[10px] text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" /> Отмена
                      </button>
                    </div>
                  )}
                </div>
                {editingDirectives === selected.id ? (
                  <textarea
                    value={directivesDraft}
                    onChange={(e) => setDirectivesDraft(e.target.value)}
                    rows={4}
                    autoFocus
                    placeholder="Например: «Сопровождай объект, оставаясь незаметным» или «Доставь как можно быстрее, не жалей батарею»"
                    className="w-full resize-none rounded-md border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
                  />
                ) : selected.directives ? (
                  <p className="text-xs leading-relaxed text-foreground/90">{selected.directives}</p>
                ) : (
                  <p className="text-xs italic text-muted-foreground">
                    Директивы не заданы. Нажмите «Добавить», чтобы передать ИИ временные инструкции.
                  </p>
                )}
              </div>

              <div>
                <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Путевые точки
                </div>
                <div className="max-h-48 space-y-1 overflow-y-auto">
                  {selected.waypoints.slice(0, 10).map((wp, i) => (
                    <div key={i} className="flex items-center gap-2 rounded border border-border bg-card/40 px-3 py-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 font-mono text-[10px] font-bold text-primary">
                        {i + 1}
                      </span>
                      <span className="flex-1 font-mono text-[10px] text-foreground">
                        {wp.lat.toFixed(4)}, {wp.lng.toFixed(4)}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">↑{wp.altitude}м · {wp.speed}м/с</span>
                    </div>
                  ))}
                  {selected.waypoints.length > 10 && (
                    <div className="text-center text-[11px] text-muted-foreground">
                      + ещё {selected.waypoints.length - 10} точек
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1 border-t border-border pt-3">
                <button onClick={() => exportMission(selected, "json")} className="rounded border border-border bg-card px-2 py-1.5 text-[10px] font-mono text-muted-foreground hover:text-foreground">
                  JSON
                </button>
                <button onClick={() => exportMission(selected, "csv")} className="rounded border border-border bg-card px-2 py-1.5 text-[10px] font-mono text-muted-foreground hover:text-foreground">
                  CSV
                </button>
                <button onClick={() => exportMission(selected, "kml")} className="rounded border border-border bg-card px-2 py-1.5 text-[10px] font-mono text-muted-foreground hover:text-foreground">
                  KML
                </button>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {selected.createdAt}
              </div>
            </div>
          </Panel>
        ) : null}
      </div>

      {/* Mission queue */}
      <div className="mt-4">
        <Panel title="Очередь миссий" subtitle={`${missions.length} в списке`} padded={false}>
          <div className="divide-y divide-border">
            {missions.map((m) => (
              <button
                key={m.id}
                onClick={() => { setSelectedId(m.id); setPlanMode(false); }}
                className={[
                  "flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-secondary/50",
                  selectedId === m.id && !planMode ? "bg-primary/5" : "",
                ].join(" ")}
              >
                <div className="font-mono text-[11px] text-muted-foreground w-16">{m.id}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-foreground">{m.name}</div>
                  <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>{missionTypeLabel[m.type]}</span>
                    <span>·</span>
                    <span>{m.waypoints.length} точек</span>
                    <span>·</span>
                    <span>{m.distance} км</span>
                    {m.schedule && (<><span>·</span><span className="text-info">⏱ {m.schedule}</span></>)}
                  </div>
                </div>
                <div className="hidden w-32 sm:block">
                  <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
                    <span>Прогресс</span>
                    <span className="font-mono">{m.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${m.progress}%` }} />
                  </div>
                </div>
                <span
                  className={[
                    "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                    statusTone[m.status],
                  ].join(" ")}
                >
                  {missionStatusLabel[m.status]}
                </span>
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      {label && (
        <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}
