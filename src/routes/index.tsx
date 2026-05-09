import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from "recharts";
import {
  Battery,
  Gauge,
  Mountain,
  Thermometer,
  Wifi,
  Satellite,
  Wind,
  Cpu,
  RotateCw,
  Pause,
  Home,
  Plane as PlaneIcon,
  Camera as CameraIcon,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  useTelemetry,
  initialFleet,
  initialMissions,
  initialDetections,
  initialGeoZones,
  currentWeather,
  flightModeLabel,
  type FlightMode,
} from "@/lib/mock-data";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel, StatCard } from "@/components/dashboard/Panel";
import { DroneMap, type MapProvider } from "@/components/dashboard/DroneMap";
import { useOps } from "@/lib/ops-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Телеметрия · COBA AI" },
      { name: "description", content: "Реал-тайм мониторинг полётных параметров дрона COBA AI." },
    ],
  }),
  component: TelemetryPage,
});

const chartColors = {
  primary: "oklch(0.82 0.18 200)",
  accent: "oklch(0.78 0.16 70)",
  success: "oklch(0.72 0.18 145)",
  destructive: "oklch(0.65 0.24 25)",
  grid: "oklch(0.30 0.025 245 / 0.5)",
  text: "oklch(0.68 0.02 240)",
};

const tooltipStyle = {
  backgroundColor: "oklch(0.20 0.025 245)",
  border: "1px solid oklch(0.30 0.025 245)",
  borderRadius: 8,
  fontSize: 12,
  color: "oklch(0.96 0.01 220)",
  fontFamily: "JetBrains Mono, monospace",
};

const refreshOptions = [1000, 2000, 5000, 10000];

function TelemetryPage() {
  const { appendEvent } = useOps();
  const [selectedDroneId, setSelectedDroneId] = useState<string>("DR-001");
  const [refreshMs, setRefreshMs] = useState(2000);
  const [provider, setProvider] = useState<MapProvider>("dark");
  const [showDetections, setShowDetections] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [flightMode, setFlightMode] = useState<FlightMode>("AUTO");

  const droneIndex = initialFleet.findIndex((d) => d.id === selectedDroneId);
  const drone = initialFleet[droneIndex] ?? initialFleet[0];
  const { history, current } = useTelemetry(refreshMs, droneIndex);

  const activeMission = useMemo(
    () => initialMissions.find((m) => m.id === drone.mission),
    [drone.mission],
  );

  const flightTimeMin = drone.flightTimeRemaining;
  const batteryTone = (current?.battery ?? 0) < 30 ? "destructive" : (current?.battery ?? 0) < 50 ? "warning" : "success";

  return (
    <>
      <PageHeader
        title="Телеметрия"
        description={`Реал-тайм мониторинг · ${drone.name} · ${drone.mode}${activeMission ? ` · ${activeMission.name}` : ""}`}
        badge={drone.status === "mission" ? "Активный полёт" : "На земле"}
        actions={
          <>
            <select
              value={selectedDroneId}
              onChange={(e) => setSelectedDroneId(e.target.value)}
              className="rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground"
            >
              {initialFleet.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.id})</option>
              ))}
            </select>
            <div className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1.5 text-xs">
              <RotateCw className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">Авто</span>
              <select
                value={refreshMs}
                onChange={(e) => setRefreshMs(Number(e.target.value))}
                className="bg-transparent font-mono font-semibold text-foreground outline-none"
              >
                {refreshOptions.map((ms) => (
                  <option key={ms} value={ms}>{ms / 1000}с</option>
                ))}
              </select>
            </div>
          </>
        }
      />

      {/* Drone selector strip */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {initialFleet.map((d) => {
          const active = d.id === selectedDroneId;
          const tone = d.status === "mission" ? "text-primary" : d.status === "online" ? "text-success" : d.status === "charging" ? "text-warning" : "text-muted-foreground";
          return (
            <button
              key={d.id}
              onClick={() => setSelectedDroneId(d.id)}
              className={[
                "flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-xs transition-colors",
                active
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card hover:border-primary/40",
              ].join(" ")}
            >
              <span className={`h-1.5 w-1.5 rounded-full bg-current ${tone}`} />
              <span className="font-semibold">{d.name}</span>
              <span className="font-mono text-[10px] text-muted-foreground">{d.battery}%</span>
            </button>
          );
        })}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Батарея"
          value={current?.battery ?? 0}
          unit="%"
          tone={batteryTone}
          icon={<Battery className="h-4 w-4" />}
          trend={`~${flightTimeMin} мин полёта`}
        />
        <StatCard
          label="Высота"
          value={current?.altitude.toFixed(1) ?? "0"}
          unit="м"
          tone="primary"
          icon={<Mountain className="h-4 w-4" />}
          trend={`Цель: ${current?.altitudeTarget ?? 0} м`}
        />
        <StatCard
          label="Скорость"
          value={current?.speed.toFixed(1) ?? "0"}
          unit="м/с"
          tone="primary"
          icon={<Gauge className="h-4 w-4" />}
          trend={`Верт: ${current?.speedVertical?.toFixed(1) ?? 0} м/с`}
        />
        <StatCard
          label="Темп. моторов"
          value={current?.temperature.toFixed(1) ?? "0"}
          unit="°C"
          tone="warning"
          icon={<Thermometer className="h-4 w-4" />}
        />
        <StatCard
          label="Сигнал"
          value={current?.signal ?? 0}
          unit="%"
          tone="success"
          icon={<Wifi className="h-4 w-4" />}
        />
        <StatCard
          label="GPS"
          value="14"
          unit="спутн."
          tone="success"
          icon={<Satellite className="h-4 w-4" />}
          trend="3D Fix · HDOP 0.8"
        />
      </div>

      {/* Map + Camera + Quick Controls */}
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel
          title="Карта полёта"
          subtitle={`${drone.position[0].toFixed(4)}° N, ${drone.position[1].toFixed(4)}° E`}
          padded={false}
          className="xl:col-span-2"
          actions={
            <div className="flex gap-1">
              <button
                onClick={() => setShowDetections((v) => !v)}
                className={`rounded border px-2 py-1 font-mono text-[10px] transition-colors ${showDetections ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"}`}
                title="Обнаруженные объекты"
              >
                Объекты
              </button>
              <button
                onClick={() => setShowZones((v) => !v)}
                className={`rounded border px-2 py-1 font-mono text-[10px] transition-colors ${showZones ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"}`}
                title="Геозоны"
              >
                Геозоны
              </button>
            </div>
          }
        >
          <div className="relative h-[420px] w-full">
            <DroneMap
              drones={initialFleet}
              activeDroneId={selectedDroneId}
              missions={initialMissions.filter((m) => m.status === "running" || m.status === "paused")}
              activeMissionId={drone.mission}
              detections={showDetections ? initialDetections : []}
              geoZones={showZones ? initialGeoZones : []}
              center={drone.position}
              zoom={15}
              provider={provider}
              onProviderChange={setProvider}
            />
          </div>
        </Panel>

        <div className="flex flex-col gap-4">
          {/* Video feed */}
          <Panel
            title="Видеопоток"
            subtitle={`${drone.name} · ${cameraOn ? "1080p · 30fps" : "Отключено"}`}
            padded={false}
            actions={
              <button
                onClick={() => setCameraOn((v) => !v)}
                className="flex items-center gap-1 text-xs text-primary"
              >
                {cameraOn ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                {cameraOn ? "Вкл" : "Выкл"}
              </button>
            }
          >
            <div className="scan-line relative aspect-video overflow-hidden bg-[oklch(0.12_0.02_240)]">
              {cameraOn ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.30_0.04_200_/_0.5)] via-[oklch(0.18_0.02_240)] to-[oklch(0.22_0.03_30_/_0.4)]" />
                  {/* HUD overlay */}
                  <div className="absolute inset-0 p-3 font-mono text-[10px] text-success">
                    <div className="flex justify-between">
                      <div>● REC</div>
                      <div>{drone.name}</div>
                    </div>
                    <div className="absolute bottom-3 left-3">ALT {current?.altitude.toFixed(1)}м</div>
                    <div className="absolute bottom-3 right-3">SPD {current?.speed.toFixed(1)}м/с</div>
                    <div className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-success/50">
                      <div className="absolute left-1/2 top-1/2 h-1 w-6 -translate-x-1/2 -translate-y-1/2 bg-success/70" />
                      <div className="absolute left-1/2 top-1/2 h-6 w-1 -translate-x-1/2 -translate-y-1/2 bg-success/70" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  Камера выключена
                </div>
              )}
            </div>
          </Panel>

          {/* Quick controls */}
          <Panel title="Быстрые команды">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => appendEvent({ level: "warning", source: "Telemetry", message: `${drone.name}: команда паузы отправлена` })} className="flex items-center justify-center gap-1.5 rounded-md border border-warning/40 bg-warning/10 py-2 text-xs font-semibold text-warning hover:bg-warning/20">
                <Pause className="h-3.5 w-3.5" /> Пауза
              </button>
              <button onClick={() => appendEvent({ level: "info", source: "Telemetry", message: `${drone.name}: инициирован возврат домой` })} className="flex items-center justify-center gap-1.5 rounded-md border border-info/40 bg-info/10 py-2 text-xs font-semibold text-info hover:bg-info/20">
                <Home className="h-3.5 w-3.5" /> Домой
              </button>
              <button onClick={() => appendEvent({ level: "info", source: "Telemetry", message: `${drone.name}: включено удержание позиции` })} className="flex items-center justify-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 py-2 text-xs font-semibold text-primary hover:bg-primary/20">
                <PlaneIcon className="h-3.5 w-3.5" /> Висение
              </button>
              <button onClick={() => appendEvent({ level: "error", source: "Telemetry", message: `${drone.name}: аварийная команда EMG отправлена` })} className="flex items-center justify-center gap-1.5 rounded-md border border-destructive/40 bg-destructive/10 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20">
                <AlertTriangle className="h-3.5 w-3.5" /> EMG
              </button>
            </div>
            <div className="mt-3 border-t border-border pt-3">
              <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Режим полёта
              </div>
              <div className="grid grid-cols-3 gap-1">
                {(["MANUAL", "AUTO", "RTL"] as FlightMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setFlightMode(m)}
                    className={`rounded border px-2 py-1.5 font-mono text-[10px] transition-colors ${flightMode === m ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </Panel>
        </div>
      </div>

      {/* Charts */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel
          title="Высота полёта"
          subtitle="Метры · последние 2 минуты"
          actions={<span className="font-mono text-xs text-primary">{current?.altitude.toFixed(1)} м</span>}
        >
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="grad-alt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColors.primary} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={chartColors.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke={chartColors.text} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke={chartColors.text} fontSize={10} tickLine={false} axisLine={false} width={32} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: chartColors.primary, strokeOpacity: 0.4 }} />
                <Area type="monotone" dataKey="altitude" stroke={chartColors.primary} strokeWidth={2} fill="url(#grad-alt)" />
                <Line type="monotone" dataKey="altitudeTarget" stroke={chartColors.accent} strokeWidth={1} strokeDasharray="4 4" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          title="Скорость"
          subtitle="м/с · горизонтальная и вертикальная"
          actions={<span className="font-mono text-xs text-primary">{current?.speed.toFixed(1)} м/с</span>}
        >
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke={chartColors.text} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke={chartColors.text} fontSize={10} tickLine={false} axisLine={false} width={32} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="speed" stroke={chartColors.primary} strokeWidth={2} dot={false} name="Гориз." />
                <Line type="monotone" dataKey="speedVertical" stroke={chartColors.accent} strokeWidth={2} dot={false} name="Верт." />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          title="Заряд батареи"
          subtitle="% · разряд во времени"
          actions={<span className="font-mono text-xs text-success">{current?.battery}%</span>}
        >
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="grad-bat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColors.success} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={chartColors.success} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke={chartColors.text} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke={chartColors.text} fontSize={10} tickLine={false} axisLine={false} width={32} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="battery" stroke={chartColors.success} strokeWidth={2} fill="url(#grad-bat)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          title="Уровень сигнала"
          subtitle="% · качество связи"
          actions={<span className="font-mono text-xs text-info">{current?.signal}%</span>}
        >
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="grad-sig" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.70 0.15 230)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="oklch(0.70 0.15 230)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke={chartColors.text} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke={chartColors.text} fontSize={10} tickLine={false} axisLine={false} width={32} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="signal" stroke="oklch(0.70 0.15 230)" strokeWidth={2} fill="url(#grad-sig)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Status / motors / sensors / weather */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Моторы" subtitle="4 ротора · обороты и температура">
          <div className="grid grid-cols-2 gap-2">
            {drone.motors.map((m, i) => {
              const tone = m.temperature > 55 ? "text-destructive" : m.temperature > 45 ? "text-warning" : "text-success";
              return (
                <div key={i} className="rounded-md border border-border bg-card/50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      M{i + 1}
                    </span>
                    <Cpu className={`h-3.5 w-3.5 ${tone}`} />
                  </div>
                  <div className="mt-1.5 font-mono text-lg font-bold text-foreground">{m.rpm}</div>
                  <div className="text-[10px] text-muted-foreground">RPM</div>
                  <div className={`mt-1 font-mono text-xs ${tone}`}>{m.temperature.toFixed(1)}°C</div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full bg-primary" style={{ width: `${m.load}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Сенсоры" subtitle="Состояние модулей">
          <div className="space-y-2">
            {[
              { name: "GPS / ГЛОНАСС", state: drone.sensors.gps },
              { name: "RGB-камера", state: drone.sensors.camera },
              { name: "Тепловизор", state: drone.sensors.thermal },
              { name: "LiDAR", state: drone.sensors.lidar },
              { name: "IMU", state: drone.sensors.imu },
            ].map((s) => {
              const ok = s.state === "ok";
              const missing = s.state === "missing" || s.state === "off";
              const Icon = ok ? CheckCircle2 : missing ? XCircle : AlertTriangle;
              const tone = ok ? "text-success" : missing ? "text-muted-foreground" : "text-warning";
              return (
                <div key={s.name} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0">
                  <span className="text-xs text-foreground">{s.name}</span>
                  <span className={`flex items-center gap-1.5 font-mono text-xs ${tone}`}>
                    <Icon className="h-3.5 w-3.5" />
                    {s.state.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 rounded-md border border-border bg-card/60 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Текущий режим</span>
              <span className="font-mono font-semibold text-primary">{flightModeLabel[drone.mode]}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Failsafe</span>
              <span className="font-mono text-success">Готов</span>
            </div>
          </div>
        </Panel>

        <Panel title="Погода" subtitle="Условия в зоне полёта">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-info/10">
                <Wind className="h-6 w-6 text-info" />
              </div>
              <div>
                <div className="font-mono text-2xl font-bold text-foreground">{currentWeather.windSpeed} м/с</div>
                <div className="text-[11px] text-muted-foreground">Ветер · {currentWeather.windDirection}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <Stat label="Темп." value={`${currentWeather.temperature}°C`} />
              <Stat label="Видим." value={`${currentWeather.visibility} км`} />
              <Stat label="Давл." value={`${currentWeather.pressure} мм`} />
              <Stat label="Влажн." value={`${currentWeather.humidity}%`} />
            </div>
            <div className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">
              ✓ Условия пригодны для полётов
            </div>
          </div>
        </Panel>
      </div>

      {/* Active tools mini list */}
      <div className="mt-4">
        <Panel title="Активные модули и инструменты" subtitle="Краткий статус">
          <div className="flex flex-wrap gap-2">
            {[
              { n: "Планировщик", s: "ok" },
              { n: "YOLOv5 детекция", s: "ok" },
              { n: "GPS+IMU EKF", s: "ok" },
              { n: "PID контроль", s: "ok" },
              { n: "MAVLink 2.0", s: "ok" },
              { n: "DQN обучение", s: "warning" },
              { n: "H.264 видео", s: "ok" },
              { n: "ИИ-помощник", s: "ok" },
              { n: "Координатор роя", s: "ok" },
              { n: "Failsafe RTL", s: "ok" },
            ].map((t) => (
              <span
                key={t.n}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] ${t.s === "ok" ? "border-success/30 bg-success/10 text-success" : "border-warning/30 bg-warning/10 text-warning"}`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {t.n}
              </span>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border/50 bg-card/40 px-2 py-1.5">
      <div className="text-muted-foreground">{label}</div>
      <div className="font-semibold text-foreground">{value}</div>
    </div>
  );
}
