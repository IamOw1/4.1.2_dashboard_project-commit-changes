import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel, StatCard } from "@/components/dashboard/Panel";
import { DroneMap, type MapProvider } from "@/components/dashboard/DroneMap";
import {
  initialFleet,
  initialGeoZones,
  droneStatusLabel,
  flightModeLabel,
  type FleetDrone,
} from "@/lib/mock-data";
import {
  Battery,
  Wifi,
  Plane,
  Home,
  PauseCircle,
  PlayCircle,
  AlertTriangle,
  Radio,
  Users,
  CheckSquare,
  Square as SquareIcon,
  Send,
  Network,
  Lock,
  Plus,
} from "lucide-react";

export const Route = createFileRoute("/fleet")({
  head: () => ({
    meta: [
      { title: "Флот · COBA AI" },
      { name: "description", content: "Управление флотом дронов, группами и mesh-сетью COBA AI." },
    ],
  }),
  component: FleetPage,
});

const statusTone: Record<FleetDrone["status"], string> = {
  online: "bg-success/15 text-success border-success/30",
  offline: "bg-muted text-muted-foreground border-border",
  mission: "bg-primary/15 text-primary border-primary/30",
  charging: "bg-warning/15 text-warning border-warning/30",
  maintenance: "bg-destructive/15 text-destructive border-destructive/30",
};

type BulkCommand =
  | { id: "rtl"; label: "Возврат домой"; tone: "warning" }
  | { id: "pause"; label: "Удержание"; tone: "info" }
  | { id: "resume"; label: "Продолжить"; tone: "success" }
  | { id: "land"; label: "Посадка"; tone: "default" }
  | { id: "emg"; label: "Аварийный СТОП"; tone: "destructive" };

const bulkCommands: BulkCommand[] = [
  { id: "rtl", label: "Возврат домой", tone: "warning" },
  { id: "pause", label: "Удержание", tone: "info" },
  { id: "resume", label: "Продолжить", tone: "success" },
  { id: "land", label: "Посадка", tone: "default" },
  { id: "emg", label: "Аварийный СТОП", tone: "destructive" },
];

const cmdToneClass: Record<BulkCommand["tone"], string> = {
  warning: "border-warning/40 bg-warning/10 text-warning hover:bg-warning/20",
  info: "border-info/40 bg-info/10 text-info hover:bg-info/20",
  success: "border-success/40 bg-success/10 text-success hover:bg-success/20",
  default: "border-border bg-card text-foreground hover:bg-secondary",
  destructive: "border-destructive/50 bg-destructive/15 text-destructive hover:bg-destructive/25",
};

interface CommandLog {
  id: number;
  timestamp: string;
  command: string;
  drones: string[];
}

function FleetPage() {
  const [fleet, setFleet] = useState<FleetDrone[]>(initialFleet);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [provider, setProvider] = useState<MapProvider>("dark");
  const [activeDroneId, setActiveDroneId] = useState<string | undefined>();
  const [cmdLog, setCmdLog] = useState<CommandLog[]>([]);
  const [showMesh, setShowMesh] = useState(true);
  // Симуляция дрейфа сигнала активного дрона: позволяет наглядно увидеть
  // авто-переключение трассы связи между DIRECT и MULTI-HOP.
  const [simulateSignal, setSimulateSignal] = useState(false);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Когда активный дрон меняется (например, кликом по узлу mesh) —
  // плавно скроллим соответствующую строку списка в зону видимости.
  useEffect(() => {
    if (!activeDroneId) return;
    const el = rowRefs.current[activeDroneId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeDroneId]);

  // Тик симуляции: плавно колеблем сигнал активного дрона по синусоиде
  // в диапазоне ~30..95%, чтобы пересекать оба порога гистерезиса (60/70).
  useEffect(() => {
    if (!simulateSignal || !activeDroneId) return;
    const start = Date.now();
    const id = window.setInterval(() => {
      const t = (Date.now() - start) / 1000;
      // период ~12с — медленно, чтобы оператор успел увидеть смену режима
      const next = Math.round(62 + Math.sin(t / 1.9) * 32);
      setFleet((prev) =>
        prev.map((d) =>
          d.id === activeDroneId ? { ...d, signal: Math.max(10, Math.min(99, next)) } : d,
        ),
      );
    }, 500);
    return () => window.clearInterval(id);
  }, [simulateSignal, activeDroneId]);

  const groups = useMemo(() => {
    const set = new Set<string>();
    fleet.forEach((d) => d.group && set.add(d.group));
    return Array.from(set);
  }, [fleet]);

  const visibleFleet = useMemo(() => {
    if (groupFilter === "all") return fleet;
    return fleet.filter((d) => d.group === groupFilter);
  }, [fleet, groupFilter]);

  const selected = useMemo(
    () => fleet.filter((d) => selectedIds.includes(d.id)),
    [fleet, selectedIds],
  );

  const stats = useMemo(() => {
    const online = fleet.filter((d) => d.status === "online" || d.status === "mission").length;
    const inMission = fleet.filter((d) => d.status === "mission").length;
    const withBattery = fleet.filter((d) => d.battery > 0);
    const avg = withBattery.length
      ? Math.round(withBattery.reduce((s, d) => s + d.battery, 0) / withBattery.length)
      : 0;
    return { total: fleet.length, online, inMission, avg, groups: groups.length };
  }, [fleet, groups]);

  // Mesh-узлы: только активные дроны
  const meshNodes = useMemo(
    () => fleet.filter((d) => d.status === "mission" || d.status === "online"),
    [fleet],
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectVisible = () => setSelectedIds(visibleFleet.map((d) => d.id));
  const selectGroup = (group: string) => {
    setSelectedIds(fleet.filter((d) => d.group === group).map((d) => d.id));
  };
  const clearSelection = () => setSelectedIds([]);

  const sendCommand = (cmd: BulkCommand) => {
    if (selectedIds.length === 0) return;
    const log: CommandLog = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString("ru-RU"),
      command: cmd.label,
      drones: [...selectedIds],
    };
    setCmdLog((prev) => [log, ...prev].slice(0, 8));
  };

  const mapCenter: [number, number] =
    activeDroneId
      ? fleet.find((d) => d.id === activeDroneId)?.position ?? [55.7558, 37.6173]
      : visibleFleet[0]?.position ?? [55.7558, 37.6173];

  return (
    <>
      <PageHeader
        title="Флот"
        description="Карта · группы · mesh-сеть · массовые команды"
        badge={`${stats.online}/${stats.total} в строю`}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Всего" value={stats.total} tone="primary" icon={<Plane className="h-4 w-4" />} />
        <StatCard label="В строю" value={stats.online} tone="success" />
        <StatCard label="В миссии" value={stats.inMission} tone="primary" />
        <StatCard label="Групп" value={stats.groups} tone="default" icon={<Users className="h-4 w-4" />} />
        <StatCard label="Сред. заряд" value={stats.avg} unit="%" tone="warning" icon={<Battery className="h-4 w-4" />} />
      </div>

      {/* Group filter chips */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Группа:
        </span>
        <button
          onClick={() => setGroupFilter("all")}
          className={[
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            groupFilter === "all"
              ? "border-primary bg-primary/15 text-primary"
              : "border-border bg-card text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          Все · {fleet.length}
        </button>
        {groups.map((g) => {
          const count = fleet.filter((d) => d.group === g).length;
          const active = groupFilter === g;
          return (
            <div key={g} className="flex items-center">
              <button
                onClick={() => setGroupFilter(g)}
                className={[
                  "rounded-l-full border-y border-l px-3 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {g} · {count}
              </button>
              <button
                onClick={() => selectGroup(g)}
                title={`Выбрать всю группу ${g}`}
                className={[
                  "rounded-r-full border-y border-r px-2 py-1 transition-colors",
                  active
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                <CheckSquare className="h-3 w-3" />
              </button>
            </div>
          );
        })}
        <button
          className="ml-1 inline-flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary"
        >
          <Plus className="h-3 w-3" /> Новая группа
        </button>
      </div>

      {/* Bulk command toolbar */}
      <div className="sticky top-0 z-20 mt-4 rounded-md border border-border bg-card/95 p-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 pr-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              Выбрано: <span className="font-mono text-primary">{selectedIds.length}</span>
            </span>
          </div>

          <div className="flex flex-wrap gap-1">
            <button
              onClick={selectVisible}
              className="rounded-md border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              Все видимые
            </button>
            {selectedIds.length > 0 && (
              <button
                onClick={clearSelection}
                className="rounded-md border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground hover:text-destructive"
              >
                Очистить
              </button>
            )}
          </div>

          <div className="ml-auto flex flex-wrap gap-1.5">
            {bulkCommands.map((cmd) => (
              <button
                key={cmd.id}
                onClick={() => sendCommand(cmd)}
                disabled={selectedIds.length === 0}
                className={[
                  "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                  cmdToneClass[cmd.tone],
                ].join(" ")}
              >
                {cmd.id === "rtl" && <Home className="h-3 w-3" />}
                {cmd.id === "pause" && <PauseCircle className="h-3 w-3" />}
                {cmd.id === "resume" && <PlayCircle className="h-3 w-3" />}
                {cmd.id === "land" && <Plane className="h-3 w-3" />}
                {cmd.id === "emg" && <AlertTriangle className="h-3 w-3" />}
                {cmd.label}
              </button>
            ))}
          </div>
        </div>

        {selected.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1 border-t border-border/50 pt-2">
            {selected.map((d) => (
              <span
                key={d.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] text-primary"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {d.name}
                <span className="font-mono text-muted-foreground">{d.id}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Map + side panel */}
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel
          title="Карта флота"
          subtitle={`${visibleFleet.length} дронов на карте · клик по маркеру для выбора`}
          padded={false}
          className="xl:col-span-2"
          actions={
            <button
              onClick={() => setSimulateSignal((v) => !v)}
              disabled={!activeDroneId}
              title={
                activeDroneId
                  ? "Имитация колебаний сигнала активного дрона для проверки авто-маршрута"
                  : "Сначала выберите активный дрон"
              }
              className={[
                "rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors",
                !activeDroneId
                  ? "cursor-not-allowed border-border bg-card text-muted-foreground/50"
                  : simulateSignal
                    ? "border-warning/50 bg-warning/15 text-warning"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {simulateSignal ? "Симуляция: ON" : "Симуляция сигнала"}
            </button>
          }
        >
          <div className="h-[440px] w-full">
            <DroneMap
              drones={visibleFleet}
              activeDroneId={activeDroneId}
              geoZones={initialGeoZones}
              center={mapCenter}
              zoom={13}
              provider={provider}
              onProviderChange={setProvider}
              gatewayPosition={[55.7558, 37.6173]}
              showMeshLink
              showFleetMesh
            />
          </div>
        </Panel>

        {/* Mesh topology */}
        <Panel
          title="Mesh-сеть"
          subtitle={`${meshNodes.length} узлов · самоорганизующаяся · AES-256`}
          actions={
            <button
              onClick={() => setShowMesh((v) => !v)}
              className="rounded-md border border-border bg-card px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground"
            >
              {showMesh ? "Скрыть" : "Показать"}
            </button>
          }
        >
          {showMesh ? (
            <MeshTopology
              nodes={meshNodes}
              selectedIds={selectedIds}
              activeId={activeDroneId}
              onNodeClick={(id) => {
                setActiveDroneId(id);
                toggleSelect(id);
              }}
            />
          ) : (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Визуализация скрыта
            </div>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 text-[10px]">
            <MeshStat icon={<Network className="h-3 w-3" />} label="Узлов" value={`${meshNodes.length}`} />
            <MeshStat icon={<Lock className="h-3 w-3" />} label="Шифрование" value="AES-256" />
            <MeshStat icon={<Radio className="h-3 w-3" />} label="Маршрутизация" value="Multi-path" />
            <MeshStat icon={<Wifi className="h-3 w-3" />} label="Авто-восст." value="Вкл" />
          </div>
        </Panel>
      </div>

      {/* Drone list with checkboxes + recent commands */}
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel
          title="Дроны флота"
          subtitle={groupFilter === "all" ? "Все группы" : `Группа ${groupFilter}`}
          padded={false}
          className="xl:col-span-2"
        >
          <div className="divide-y divide-border">
            {visibleFleet.map((d) => {
              const checked = selectedIds.includes(d.id);
              const isActive = d.id === activeDroneId;
              return (
                <div
                  key={d.id}
                  ref={(el) => {
                    rowRefs.current[d.id] = el;
                  }}
                  className={[
                    "flex flex-wrap items-center gap-3 border-l-2 px-4 py-3 transition-colors",
                    isActive
                      ? "border-l-primary bg-primary/10 ring-1 ring-inset ring-primary/30"
                      : checked
                        ? "border-l-primary/40 bg-primary/5"
                        : "border-l-transparent hover:bg-secondary/40",
                  ].join(" ")}
                >
                  <button
                    onClick={() => toggleSelect(d.id)}
                    className={[
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                      checked
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:border-primary",
                    ].join(" ")}
                    aria-label={checked ? "Снять выбор" : "Выбрать"}
                  >
                    {checked ? <CheckSquare className="h-3 w-3" /> : <SquareIcon className="h-3 w-3 opacity-30" />}
                  </button>

                  <button
                    onClick={() => setActiveDroneId(d.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <div className="font-mono text-[10px] text-muted-foreground w-14">{d.id}</div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-foreground">{d.name}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{flightModeLabel[d.mode]}</span>
                        {d.group && (<><span>·</span><span>гр. {d.group}</span></>)}
                        {d.mission && (<><span>·</span><span className="font-mono text-primary">{d.mission}</span></>)}
                      </div>
                    </div>
                  </button>

                  <div className="hidden items-center gap-2 sm:flex">
                    <span className="flex items-center gap-1 font-mono text-[11px] text-foreground">
                      <Battery className="h-3 w-3" />
                      <span className={d.battery > 60 ? "text-success" : d.battery > 30 ? "text-warning" : "text-destructive"}>
                        {d.battery}%
                      </span>
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                      <Wifi className="h-3 w-3" />{d.signal}%
                    </span>
                  </div>

                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusTone[d.status]}`}>
                    {droneStatusLabel[d.status]}
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Журнал команд" subtitle="Недавние массовые приказы">
          {cmdLog.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Нет отправленных команд.
              <br />
              Выберите дроны и нажмите команду в верхней панели.
            </div>
          ) : (
            <div className="space-y-2">
              {cmdLog.map((log) => (
                <div key={log.id} className="rounded-md border border-border bg-card/60 p-2.5">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Send className="h-3 w-3 text-primary" />
                      <span className="text-xs font-semibold text-foreground">{log.command}</span>
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground">{log.timestamp}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {log.drones.map((d) => (
                      <span key={d} className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

function MeshStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded border border-border/60 bg-card/40 px-2 py-1.5">
      <span className="text-primary">{icon}</span>
      <div className="min-w-0">
        <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="truncate text-[11px] font-semibold text-foreground">{value}</div>
      </div>
    </div>
  );
}

interface MeshTopologyProps {
  nodes: FleetDrone[];
  selectedIds: string[];
  activeId?: string;
  onNodeClick: (id: string) => void;
}

function MeshTopology({ nodes, selectedIds, activeId, onNodeClick }: MeshTopologyProps) {
  // Размещаем узлы по кругу + центральный шлюз (оператор)
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 100;

  const placed = nodes.map((d, i) => {
    const angle = (i / Math.max(nodes.length, 1)) * Math.PI * 2 - Math.PI / 2;
    return {
      drone: d,
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    };
  });

  return (
    <div className="flex justify-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* Связи: каждый дрон - к шлюзу, и соседи между собой (mesh) */}
        {placed.map((p, i) => {
          const next = placed[(i + 1) % placed.length];
          const activeUplink = p.drone.id === activeId;
          return (
            <g key={`link-${p.drone.id}`}>
              {/* uplink to gateway */}
              <line
                x1={cx}
                y1={cy}
                x2={p.x}
                y2={p.y}
                stroke={activeUplink ? "oklch(0.85 0.2 200)" : "oklch(0.82 0.18 200)"}
                strokeOpacity={activeUplink ? 0.95 : p.drone.signal > 70 ? 0.5 : 0.2}
                strokeWidth={activeUplink ? 2.5 : p.drone.signal > 70 ? 1.5 : 1}
                strokeDasharray={activeUplink ? "6 6" : p.drone.signal > 70 ? undefined : "3 3"}
                className={activeUplink ? "mesh-link-flow" : undefined}
              />
              {/* peer link */}
              {placed.length > 1 && (
                <line
                  x1={p.x}
                  y1={p.y}
                  x2={next.x}
                  y2={next.y}
                  stroke="oklch(0.75 0.15 290)"
                  strokeOpacity={0.35}
                  strokeWidth={1}
                  strokeDasharray="2 4"
                />
              )}
            </g>
          );
        })}

        {/* Центральный шлюз — оператор */}
        <circle cx={cx} cy={cy} r={18} fill="oklch(0.82 0.18 200 / 0.2)" stroke="oklch(0.82 0.18 200)" strokeWidth={2} />
        <text x={cx} y={cy + 3} textAnchor="middle" className="fill-primary" style={{ font: "700 9px 'JetBrains Mono', monospace" }}>
          ОП
        </text>
        <text x={cx} y={cy + 32} textAnchor="middle" className="fill-muted-foreground" style={{ font: "9px 'JetBrains Mono', monospace" }}>
          GATEWAY
        </text>

        {/* Узлы-дроны */}
        {placed.map((p) => {
          const sel = selectedIds.includes(p.drone.id);
          const tone =
            p.drone.status === "mission"
              ? "oklch(0.82 0.18 200)"
              : p.drone.status === "online"
                ? "oklch(0.72 0.17 145)"
                : "oklch(0.7 0 0)";
          return (
            <g
              key={p.drone.id}
              onClick={() => onNodeClick(p.drone.id)}
              className="cursor-pointer"
            >
              {sel && (
                <circle cx={p.x} cy={p.y} r={18} fill="none" stroke={tone} strokeWidth={2} strokeDasharray="3 3">
                  <animate attributeName="r" values="14;20;14" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx={p.x} cy={p.y} r={12} fill={`${tone}33`} stroke={tone} strokeWidth={1.5} />
              <text x={p.x} y={p.y + 3} textAnchor="middle" style={{ font: "700 8px 'JetBrains Mono', monospace", fill: tone }}>
                {p.drone.id.slice(-2)}
              </text>
              <text
                x={p.x}
                y={p.y + 26}
                textAnchor="middle"
                className="fill-foreground"
                style={{ font: "9px 'JetBrains Mono', monospace" }}
              >
                {p.drone.name.replace("COBA-", "")}
              </text>
              <text
                x={p.x}
                y={p.y + 38}
                textAnchor="middle"
                className="fill-muted-foreground"
                style={{ font: "8px 'JetBrains Mono', monospace" }}
              >
                {p.drone.signal}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
