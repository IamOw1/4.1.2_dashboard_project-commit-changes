import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useRouterState, Link, createRootRoute, Outlet, HeadContent, Scripts, createFileRoute, lazyRouteComponent, createRouter, useRouter } from "@tanstack/react-router";
import { Radar, Activity, Map, Shield, Gamepad2, Wrench, Brain, FlaskConical, Plane, Camera, ScrollText, Database, SlidersHorizontal, HelpCircle, Satellite, Search, Plug, Server, Wifi, Battery, Bell, Sparkles, Bot, X, Target, MessageSquare, Send } from "lucide-react";
import * as React from "react";
import { useState, useEffect, useMemo, createContext, useContext, useCallback } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
const appCss = "/assets/styles-cjDLWBBK.css";
const navItems = [
  { to: "/", label: "Телеметрия", icon: Activity, exact: true },
  { to: "/missions", label: "Миссии", icon: Map },
  { to: "/instructions", label: "Инструкции", icon: Shield },
  { to: "/commands", label: "Команды", icon: Gamepad2 },
  { to: "/tools", label: "Инструменты", icon: Wrench },
  { to: "/learning", label: "Обучение DQN", icon: Brain },
  { to: "/simulation", label: "Симуляция", icon: FlaskConical },
  { to: "/fleet", label: "Флот", icon: Plane },
  { to: "/camera", label: "Камера", icon: Camera },
  { to: "/events", label: "Журнал", icon: ScrollText },
  { to: "/backups", label: "Бэкапы", icon: Database },
  { to: "/settings", label: "Настройки", icon: SlidersHorizontal }
];
function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return /* @__PURE__ */ jsxs("aside", { className: "hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex h-16 items-center gap-3 border-b border-sidebar-border px-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative flex h-9 w-9 items-center justify-center rounded-md bg-primary/15 text-primary", children: [
        /* @__PURE__ */ jsx(Radar, { className: "h-5 w-5" }),
        /* @__PURE__ */ jsx("span", { className: "absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-success pulse-dot" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "leading-tight", children: [
        /* @__PURE__ */ jsx("div", { className: "text-sm font-bold tracking-wide text-foreground", children: "COBA AI" }),
        /* @__PURE__ */ jsx("div", { className: "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground", children: "Drone v4.1.2" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("nav", { className: "flex-1 space-y-0.5 overflow-y-auto p-3", children: navItems.map((item) => {
      const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
      const Icon = item.icon;
      return /* @__PURE__ */ jsxs(
        Link,
        {
          to: item.to,
          className: [
            "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all",
            active ? "bg-primary/15 text-primary shadow-[inset_3px_0_0_0_var(--color-primary)]" : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
          ].join(" "),
          children: [
            /* @__PURE__ */ jsx(Icon, { className: ["h-4 w-4", active ? "text-primary" : ""].join(" ") }),
            /* @__PURE__ */ jsx("span", { children: item.label })
          ]
        },
        item.to
      );
    }) }),
    /* @__PURE__ */ jsx("div", { className: "border-t border-sidebar-border p-4", children: /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-border bg-card/60 p-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-2 flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("span", { className: "font-mono text-[10px] uppercase tracking-wider text-muted-foreground", children: "Система" }),
        /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 text-[11px] font-medium text-success", children: [
          /* @__PURE__ */ jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-success pulse-dot" }),
          "Онлайн"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 text-[11px]", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: "CPU" }),
          /* @__PURE__ */ jsx("div", { className: "font-mono font-semibold text-foreground", children: "34%" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: "RAM" }),
          /* @__PURE__ */ jsx("div", { className: "font-mono font-semibold text-foreground", children: "2.1 ГБ" })
        ] })
      ] })
    ] }) })
  ] });
}
const seed = (offset, droneSeed = 0) => {
  const t = Date.now() / 1e3 + offset + droneSeed * 11;
  return {
    altitude: 30 + Math.sin(t / 5) * 8 + Math.random() * 2,
    altitudeTarget: 35,
    speed: 6 + Math.sin(t / 3) * 2 + Math.random(),
    speedVertical: Math.sin(t / 4) * 1.5,
    battery: Math.max(15, 78 - Date.now() % 6e5 / 12e3 + droneSeed * 4),
    temperature: 42 + Math.sin(t / 7) * 4 + Math.random(),
    signal: 78 + Math.sin(t / 4) * 10 + Math.random() * 4
  };
};
const initialHistory = (droneSeed = 0) => {
  const points = [];
  for (let i = 30; i >= 0; i--) {
    const v = seed(-i, droneSeed);
    const d = new Date(Date.now() - i * 2e3);
    points.push({
      time: `${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`,
      altitude: Math.round(v.altitude * 10) / 10,
      altitudeTarget: v.altitudeTarget,
      speed: Math.round(v.speed * 10) / 10,
      speedVertical: Math.round(v.speedVertical * 10) / 10,
      battery: Math.round(v.battery),
      temperature: Math.round(v.temperature * 10) / 10,
      signal: Math.round(v.signal)
    });
  }
  return points;
};
function useTelemetry(intervalMs = 2e3, droneSeed = 0) {
  const [history, setHistory] = useState(() => initialHistory(droneSeed));
  useEffect(() => {
    setHistory(initialHistory(droneSeed));
  }, [droneSeed]);
  useEffect(() => {
    const id = setInterval(() => {
      setHistory((prev) => {
        const v = seed(0, droneSeed);
        const d = /* @__PURE__ */ new Date();
        const next = {
          time: `${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`,
          altitude: Math.round(v.altitude * 10) / 10,
          altitudeTarget: v.altitudeTarget,
          speed: Math.round(v.speed * 10) / 10,
          speedVertical: Math.round(v.speedVertical * 10) / 10,
          battery: Math.round(v.battery),
          temperature: Math.round(v.temperature * 10) / 10,
          signal: Math.round(v.signal)
        };
        const arr = [...prev, next];
        return arr.length > 60 ? arr.slice(arr.length - 60) : arr;
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, droneSeed]);
  const current = history[history.length - 1];
  return { history, current };
}
const missionTypeLabel = {
  patrol: "Патрулирование",
  search: "Поиск",
  delivery: "Доставка",
  survey: "Обследование",
  mapping: "Картография",
  tracking: "Сопровождение",
  emergency: "ЧС",
  test: "Тест",
  inspection: "Инспекция"
};
const missionStatusLabel = {
  pending: "В ожидании",
  running: "Выполняется",
  completed: "Завершена",
  failed: "Сбой",
  paused: "Пауза"
};
const wp = (lat, lng, altitude = 30, speed = 6, action) => ({
  lat,
  lng,
  altitude,
  speed,
  action
});
const initialMissions = [
  {
    id: "MIS-001",
    name: "Патруль периметра №7",
    type: "patrol",
    status: "running",
    waypoints: [
      wp(55.7558, 37.6173, 30, 7),
      wp(55.7575, 37.6195, 35, 7, "scan"),
      wp(55.759, 37.622, 35, 7, "scan"),
      wp(55.7585, 37.626, 30, 7, "photo"),
      wp(55.7558, 37.628, 30, 7),
      wp(55.753, 37.626, 30, 7),
      wp(55.752, 37.622, 35, 7, "scan"),
      wp(55.753, 37.6195, 30, 7),
      wp(55.7558, 37.6173, 30, 5)
    ],
    distance: 4.2,
    duration: 18,
    progress: 64,
    createdAt: "2025-04-19 08:14",
    droneId: "DR-001",
    droneIds: ["DR-001", "DR-002"],
    priority: "high",
    directives: "Сохраняй малую высоту над лесополосой, избегай засвета окон. При обнаружении человека — зависни на 10с и сделай 3 фото с разных ракурсов."
  },
  {
    id: "MIS-002",
    name: "Доставка к точке Альфа",
    type: "delivery",
    status: "pending",
    waypoints: [
      wp(55.7558, 37.6173, 25, 8),
      wp(55.76, 37.61, 40, 10),
      wp(55.765, 37.6, 40, 10),
      wp(55.768, 37.595, 20, 5, "drop")
    ],
    distance: 2.1,
    duration: 9,
    progress: 0,
    createdAt: "2025-04-19 09:02",
    priority: "critical",
    directives: "Лети как можно быстрее, не жалей батарею. Главное — доставить аптечку до 09:30. По прибытии сразу RTL."
  },
  {
    id: "MIS-003",
    name: "Картография зоны Б-3",
    type: "mapping",
    status: "completed",
    waypoints: Array.from({ length: 24 }, (_, i) => {
      const row = Math.floor(i / 6);
      const col = i % 6;
      return wp(55.75 + row * 2e-3, 37.61 + col * 3e-3, 60, 8, "photo");
    }),
    distance: 8.7,
    duration: 41,
    progress: 100,
    createdAt: "2025-04-18 15:22"
  },
  {
    id: "MIS-004",
    name: "Поисковая операция К-12",
    type: "search",
    status: "paused",
    waypoints: [
      wp(55.7612, 37.6094, 50, 6, "scan"),
      wp(55.762, 37.605, 50, 6, "scan"),
      wp(55.76, 37.602, 50, 6, "scan"),
      wp(55.758, 37.605, 50, 6, "scan")
    ],
    distance: 6.4,
    duration: 28,
    progress: 32,
    createdAt: "2025-04-19 07:45",
    droneId: "DR-004"
  },
  {
    id: "MIS-005",
    name: "Тестовый облёт",
    type: "test",
    status: "failed",
    waypoints: [wp(55.7558, 37.6173, 20, 4)],
    distance: 1.8,
    duration: 7,
    progress: 18,
    createdAt: "2025-04-18 11:08"
  }
];
const missionTemplates = [
  { id: "tpl-1", name: "Патрулирование периметра", type: "patrol", description: "Облёт по замкнутому контуру с автоматическим сканированием", defaultAltitude: 35, defaultSpeed: 7, recommendedDrone: "COBA-Alpha" },
  { id: "tpl-2", name: "Поиск в лесу", type: "search", description: "Сетка поиска с тепловизором и распознаванием объектов", defaultAltitude: 50, defaultSpeed: 6, recommendedDrone: "COBA-Bravo" },
  { id: "tpl-3", name: "Инспекция крыши", type: "inspection", description: "Облёт здания с фотофиксацией дефектов кровли", defaultAltitude: 15, defaultSpeed: 3, recommendedDrone: "COBA-Foxtrot" },
  { id: "tpl-4", name: "Доставка груза", type: "delivery", description: "Прямой маршрут до точки сброса с возвратом", defaultAltitude: 40, defaultSpeed: 10, recommendedDrone: "COBA-Delta" },
  { id: "tpl-5", name: "Картография зоны", type: "mapping", description: "Сетка съёмки с перекрытием 80% для построения ортофотоплана", defaultAltitude: 60, defaultSpeed: 8, recommendedDrone: "COBA-Bravo" },
  { id: "tpl-6", name: "Сопровождение объекта", type: "tracking", description: "Автоматическое следование за движущейся целью", defaultAltitude: 30, defaultSpeed: 12, recommendedDrone: "COBA-Alpha" }
];
const initialTools = [
  { id: "t1", name: "Планировщик траектории", description: "Оптимизация маршрутов с учётом препятствий", enabled: true, category: "Навигация", status: "ok" },
  { id: "t2", name: "Детекция объектов", description: "Распознавание объектов через YOLOv5", enabled: true, category: "Зрение", status: "ok" },
  { id: "t3", name: "Система навигации", description: "GPS + IMU слияние данных", enabled: true, category: "Навигация", status: "ok" },
  { id: "t4", name: "PID-контроллер", description: "Управление полётом через PID", enabled: true, category: "Управление", status: "ok" },
  { id: "t5", name: "MAVLink коммуникация", description: "Связь с наземной станцией", enabled: true, category: "Связь", status: "ok" },
  { id: "t6", name: "EKF фильтр", description: "Слияние датчиков, расширенный фильтр Калмана", enabled: true, category: "Сенсоры", status: "ok" },
  { id: "t7", name: "DQN машинное обучение", description: "Глубокое Q-обучение в реальном времени", enabled: true, category: "ИИ", status: "warning" },
  { id: "t8", name: "Логирование данных", description: "CSV-логи каждого полёта", enabled: true, category: "Данные", status: "ok" },
  { id: "t9", name: "Симулятор Bullet", description: "Физический симулятор для тестов", enabled: false, category: "Тестирование", status: "ok" },
  { id: "t10", name: "Координатор роя", description: "Управление группой дронов", enabled: true, category: "Флот", status: "ok" },
  { id: "t11", name: "Обработка ЧС", description: "Протоколы экстренного реагирования", enabled: true, category: "Безопасность", status: "ok" },
  { id: "t12", name: "ИИ-помощник", description: "DeepSeek интеграция для оператора", enabled: true, category: "ИИ", status: "ok" },
  { id: "t13", name: "Видеообработка H.264", description: "Кодирование и трансляция видео", enabled: true, category: "Камера", status: "ok" }
];
const motors = (avgTemp, load) => Array.from({ length: 4 }, (_, i) => ({
  rpm: 5800 + Math.round(Math.random() * 400) + i * 30,
  temperature: avgTemp + (Math.random() - 0.5) * 4,
  load
}));
const initialFleet = [
  {
    id: "DR-001",
    name: "COBA-Alpha",
    status: "mission",
    battery: 64,
    signal: 89,
    location: "55.7558° N, 37.6173° E",
    position: [55.7575, 37.6195],
    heading: 45,
    mission: "MIS-001",
    mode: "AUTO",
    motors: motors(48, 72),
    sensors: { gps: "ok", camera: "ok", thermal: "ok", lidar: "ok", imu: "ok" },
    flightTimeRemaining: 14,
    group: "Альфа"
  },
  {
    id: "DR-002",
    name: "COBA-Bravo",
    status: "online",
    battery: 92,
    signal: 95,
    location: "База 1",
    position: [55.75, 37.61],
    heading: 0,
    mode: "STANDBY",
    motors: motors(28, 0),
    sensors: { gps: "ok", camera: "ok", thermal: "ok", lidar: "ok", imu: "ok" },
    flightTimeRemaining: 28,
    group: "Альфа"
  },
  {
    id: "DR-003",
    name: "COBA-Charlie",
    status: "charging",
    battery: 38,
    signal: 0,
    location: "База 1",
    position: [55.75, 37.61],
    heading: 0,
    mode: "STANDBY",
    motors: motors(24, 0),
    sensors: { gps: "weak", camera: "ok", thermal: "missing", lidar: "ok", imu: "ok" },
    flightTimeRemaining: 0,
    group: "Альфа"
  },
  {
    id: "DR-004",
    name: "COBA-Delta",
    status: "mission",
    battery: 71,
    signal: 82,
    location: "55.7612° N, 37.6094° E",
    position: [55.7612, 37.6094],
    heading: 130,
    mission: "MIS-004",
    mode: "AUTO",
    motors: motors(46, 68),
    sensors: { gps: "ok", camera: "ok", thermal: "ok", lidar: "off", imu: "ok" },
    flightTimeRemaining: 17,
    group: "Браво"
  },
  {
    id: "DR-005",
    name: "COBA-Echo",
    status: "maintenance",
    battery: 0,
    signal: 0,
    location: "Сервис",
    position: [55.74, 37.65],
    heading: 0,
    mode: "STANDBY",
    motors: motors(22, 0),
    sensors: { gps: "off", camera: "off", thermal: "off", lidar: "off", imu: "error" },
    flightTimeRemaining: 0,
    group: "Браво"
  },
  {
    id: "DR-006",
    name: "COBA-Foxtrot",
    status: "online",
    battery: 100,
    signal: 96,
    location: "База 2",
    position: [55.77, 37.63],
    heading: 0,
    mode: "STANDBY",
    motors: motors(26, 0),
    sensors: { gps: "ok", camera: "ok", thermal: "ok", lidar: "ok", imu: "ok" },
    flightTimeRemaining: 32,
    group: "Чарли"
  }
];
const droneStatusLabel = {
  online: "Онлайн",
  offline: "Офлайн",
  mission: "В миссии",
  charging: "Зарядка",
  maintenance: "Обслуживание"
};
const flightModeLabel = {
  MANUAL: "Ручной",
  AUTO: "Автоматический",
  RTL: "Возврат домой",
  LOITER: "Удержание",
  EMERGENCY: "Аварийный",
  STANDBY: "Ожидание"
};
const detectedObjectLabel = {
  person: "Человек",
  vehicle: "Автомобиль",
  fire: "Возгорание",
  animal: "Животное",
  anomaly: "Аномалия"
};
const initialDetections = [
  { id: "obj-1", type: "person", position: [55.7585, 37.621], detectedAt: "10:38:42", detectedBy: "DR-001", confidence: 92, description: "Один человек, движется на восток вдоль ограждения" },
  { id: "obj-2", type: "vehicle", position: [55.754, 37.624], detectedAt: "10:36:11", detectedBy: "DR-001", confidence: 88, description: "Грузовой автомобиль, припаркован у въезда" },
  { id: "obj-3", type: "fire", position: [55.7615, 37.6075], detectedAt: "10:34:55", detectedBy: "DR-004", confidence: 76, description: "Тепловая аномалия 320°C, требуется проверка" },
  { id: "obj-4", type: "animal", position: [55.7595, 37.626], detectedAt: "10:32:18", detectedBy: "DR-001", confidence: 81, description: "Группа из 3 особей, предположительно собаки" }
];
const initialGeoZones = [
  {
    id: "gz-1",
    name: "Рабочая зона A",
    type: "allowed",
    polygon: [[55.75, 37.61], [55.77, 37.61], [55.77, 37.63], [55.75, 37.63]]
  },
  {
    id: "gz-2",
    name: "Запретная зона (аэродром)",
    type: "restricted",
    polygon: [[55.766, 37.635], [55.772, 37.635], [55.772, 37.645], [55.766, 37.645]]
  },
  {
    id: "gz-3",
    name: "Школа · ограничение высоты 30м",
    type: "warning",
    polygon: [[55.753, 37.623], [55.756, 37.623], [55.756, 37.628], [55.753, 37.628]]
  }
];
const initialEvents = [
  { id: "e1", timestamp: "10:42:18", level: "success", source: "Mission", message: "Миссия MIS-003 успешно завершена" },
  { id: "e2", timestamp: "10:41:02", level: "info", source: "Telemetry", message: "Связь восстановлена с DR-001" },
  { id: "e3", timestamp: "10:39:54", level: "warning", source: "Battery", message: "DR-003: уровень заряда 38%, рекомендуется зарядка" },
  { id: "e4", timestamp: "10:38:11", level: "info", source: "Mission", message: "Запуск миссии MIS-001 (Патруль периметра №7)" },
  { id: "e5", timestamp: "10:35:47", level: "error", source: "Sensor", message: "DR-005: ошибка GPS-модуля, требуется обслуживание" },
  { id: "e6", timestamp: "10:32:09", level: "info", source: "AI", message: "DQN модель обучена за 1240 шагов, reward = 0.89" },
  { id: "e7", timestamp: "10:30:00", level: "success", source: "System", message: "Резервная копия создана: backup_20250419.zip" },
  { id: "e8", timestamp: "10:28:33", level: "warning", source: "Weather", message: "Скорость ветра 9 м/с — близко к лимиту" },
  { id: "e9", timestamp: "10:25:14", level: "info", source: "Fleet", message: "DR-006 готов к вылету" },
  { id: "e10", timestamp: "10:22:01", level: "info", source: "System", message: "Система запущена, все модули в норме" }
];
const initialBackups = [
  { id: "b1", name: "backup_20250419_full", size: "248 МБ", type: "auto", createdAt: "2025-04-19 06:00" },
  { id: "b2", name: "backup_20250418_full", size: "241 МБ", type: "auto", createdAt: "2025-04-18 06:00" },
  { id: "b3", name: "backup_20250418_pre-update", size: "239 МБ", type: "manual", createdAt: "2025-04-18 14:32" },
  { id: "b4", name: "backup_20250417_full", size: "236 МБ", type: "auto", createdAt: "2025-04-17 06:00" },
  { id: "b5", name: "backup_20250416_full", size: "232 МБ", type: "auto", createdAt: "2025-04-16 06:00" }
];
const currentWeather = {
  windSpeed: 7,
  windDirection: "СЗ",
  temperature: 12,
  visibility: 10,
  pressure: 756,
  humidity: 58
};
const __vite_import_meta_env__ = {};
const BASE = typeof import.meta !== "undefined" && __vite_import_meta_env__?.VITE_API_URL || "http://localhost:8000";
const TIMEOUT_MS = 6e3;
let lastBackendOk = false;
let lastCheck = 0;
const HEALTH_CACHE_MS = 5e3;
async function rawFetch(path, init = {}, fallback, strict = false) {
  const url = `${BASE}${path}`;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...init.headers || {}
      }
    });
    clearTimeout(id);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ct = res.headers.get("content-type") || "";
    const data = ct.includes("application/json") ? await res.json() : await res.text();
    lastBackendOk = true;
    return { data, ok: true, source: "backend" };
  } catch (e) {
    clearTimeout(id);
    lastBackendOk = false;
    const msg = e instanceof Error ? e.message : String(e);
    if (strict || fallback === void 0) {
      return { data: fallback, ok: false, source: "error", error: msg };
    }
    return { data: fallback, ok: false, source: "mock", error: msg };
  }
}
async function pingBackend() {
  const now = Date.now();
  if (now - lastCheck < HEALTH_CACHE_MS) return lastBackendOk;
  lastCheck = now;
  const r = await rawFetch("/health", {}, void 0, true);
  return r.ok;
}
function getApiBaseUrl() {
  return BASE;
}
const api = {
  // --- Agent ---
  agentStatus: (fb) => rawFetch("/api/v1/agent/status", {}, fb),
  agentInitialize: (body) => rawFetch("/api/v1/agent/initialize", { method: "POST", body: JSON.stringify(body ?? {}) }),
  agentShutdown: () => rawFetch("/api/v1/agent/shutdown", { method: "POST" }),
  // --- Mission ---
  missionStart: (body) => rawFetch("/api/v1/mission/start", { method: "POST", body: JSON.stringify(body) }),
  missionStop: (body) => rawFetch("/api/v1/mission/stop", { method: "POST", body: JSON.stringify(body ?? {}) }),
  missionStatus: (fb) => rawFetch("/api/v1/mission/status", {}, fb),
  // --- Command / Emergency ---
  command: (command, params = {}) => rawFetch("/api/v1/command", { method: "POST", body: JSON.stringify({ command, params }) }),
  emergencyStop: () => rawFetch("/api/v1/emergency/stop", { method: "POST" }),
  // --- Telemetry ---
  telemetry: (fb) => rawFetch("/api/v1/telemetry", {}, fb),
  // --- Tools ---
  toolsList: (fb) => rawFetch("/api/v1/tools", {}, fb),
  toolExecute: (toolName, params = {}) => rawFetch(`/api/v1/tools/${encodeURIComponent(toolName)}/execute`, {
    method: "POST",
    body: JSON.stringify(params)
  }),
  // --- Learning ---
  learningProgress: (fb) => rawFetch("/api/v1/learning/progress", {}, fb),
  learningStart: (body) => rawFetch("/api/v1/learning/start", { method: "POST", body: JSON.stringify(body) }),
  learningConfigUpdate: (body) => rawFetch("/api/v1/learning/config", { method: "PUT", body: JSON.stringify(body) }),
  learningTasks: (fb) => rawFetch("/api/v1/learning/tasks", {}, fb),
  learningCurriculumProgress: (body) => rawFetch("/api/v1/learning/curriculum/progress", { method: "POST", body: JSON.stringify(body) }),
  learningExport: (body) => rawFetch("/api/v1/learning/export", { method: "POST", body: JSON.stringify(body ?? {}) }),
  // --- Memory / Sub-agent / Reports ---
  memoryShortTerm: (fb) => rawFetch("/api/v1/memory/short_term", {}, fb),
  subAgentAsk: (question) => rawFetch(`/api/v1/sub_agent/ask?q=${encodeURIComponent(question)}`),
  reportsMissions: (fb) => rawFetch("/api/v1/reports/missions", {}, fb),
  // --- Sensors (дашборд «Настройки» / сенсоры) ---
  sensorsLinkQuality: (fb) => rawFetch("/api/v1/sensors/link-quality", {}, fb),
  sensorsEnvironment: (fb) => rawFetch("/api/v1/sensors/environment", {}, fb),
  sensorsNavigation: (fb) => rawFetch("/api/v1/sensors/navigation", {}, fb),
  sensorsVisual: (fb) => rawFetch("/api/v1/sensors/visual", {}, fb),
  // --- Health / Settings ---
  health: () => rawFetch("/health", {}, void 0, true),
  settingsGet: (fb) => rawFetch("/api/v1/settings", {}, fb),
  settingsSet: (body) => rawFetch("/api/v1/settings", { method: "POST", body: JSON.stringify(body) }),
  /** Переключатель «Демо / Реальный» в шапке дашборда → бэкенд. */
  runtimeDemoMode: (enabled) => rawFetch("/api/v1/runtime/demo_mode", {
    method: "POST",
    body: JSON.stringify({ enabled })
  }),
  simulatorsStatus: (fb) => rawFetch("/api/v1/simulators/status", {}, fb),
  simulatorsConnect: (body) => rawFetch("/api/v1/simulators/connect", { method: "POST", body: JSON.stringify(body) }),
  simulatorsDisconnect: () => rawFetch("/api/v1/simulators/disconnect", { method: "POST", body: "{}" }),
  /** On-premise загрузка GGUF/другого файла модели по URL (лимит см. API.md). */
  modelsDownload: (body) => rawFetch("/api/v1/models/download", { method: "POST", body: JSON.stringify(body) }),
  /** Самопроверка подсистем (кнопка «Запустить тест систем» в настройках). */
  systemSelfTest: (fb) => rawFetch("/api/v1/system/self_test", { method: "POST", body: "{}" }, fb),
  // --- Fleet / Mesh ---
  fleetStatus: (fb) => rawFetch("/api/v1/fleet/status", {}, fb),
  fleetTelemetry: (droneId, fb) => rawFetch(`/api/v1/fleet/${encodeURIComponent(droneId)}/telemetry`, {}, fb),
  fleetFormation: (body) => rawFetch("/api/v1/fleet/formation", { method: "POST", body: JSON.stringify(body) }),
  fleetSwapLeader: (body) => rawFetch("/api/v1/fleet/swap_leader", { method: "POST", body: JSON.stringify(body ?? {}) }),
  meshTopology: (fb) => rawFetch("/api/v1/mesh/topology", {}, fb),
  // --- Camera ---
  cameraFrame: (fb) => rawFetch("/api/v1/camera/frame", {}, fb),
  cameraStreamUrl: () => `${BASE}/api/v1/camera/stream`,
  cameraRecordStart: () => rawFetch("/api/v1/camera/record/start", { method: "POST" }),
  cameraRecordStop: () => rawFetch("/api/v1/camera/record/stop", { method: "POST" }),
  // --- Detection ---
  detectionResults: (fb) => rawFetch("/api/v1/detection/results", {}, fb),
  // --- Events ---
  eventsLog: (fb) => rawFetch("/api/v1/events/log", {}, fb),
  eventsFilter: (query, fb) => {
    const qs = new URLSearchParams(query).toString();
    return rawFetch(`/api/v1/events/filter?${qs}`, {}, fb);
  },
  eventsAlertConfig: (body) => rawFetch("/api/v1/events/alert/config", { method: "POST", body: JSON.stringify(body) }),
  eventsDelete: (eventId) => rawFetch(`/api/v1/events/log/${encodeURIComponent(eventId)}`, { method: "DELETE" }),
  eventsExport: (fb) => rawFetch("/api/v1/events/export", {}, fb),
  eventsStatistics: (fb) => rawFetch("/api/v1/events/statistics", {}, fb),
  // --- Backups ---
  backupCreate: (body) => rawFetch("/api/v1/backup/create", { method: "POST", body: JSON.stringify(body) }),
  backupList: (fb) => rawFetch("/api/v1/backup/list", {}, fb),
  backupRestore: (backupId, body) => rawFetch(`/api/v1/backup/restore/${encodeURIComponent(backupId)}`, {
    method: "POST",
    body: JSON.stringify(body)
  }),
  backupDelete: (backupId) => rawFetch(`/api/v1/backup/${encodeURIComponent(backupId)}`, { method: "DELETE" }),
  // --- Export ---
  exportMissions: (body) => rawFetch("/api/v1/export/missions", { method: "POST", body: JSON.stringify(body) }),
  exportTelemetry: (body) => rawFetch("/api/v1/export/telemetry", { method: "POST", body: JSON.stringify(body) }),
  exportModels: (body) => rawFetch("/api/v1/export/models", { method: "POST", body: JSON.stringify(body ?? {}) })
};
const baseTrainingSeries = Array.from({ length: 24 }, (_, index) => ({
  ep: index + 1,
  reward: Number((0.28 + Math.log(index + 2) * 0.16).toFixed(3)),
  loss: Number(Math.max(0.08, 1.42 - Math.log(index + 2) * 0.24).toFixed(3))
}));
const OpsContext = createContext(null);
function OpsProvider({ children }) {
  const [events, setEvents] = useState(initialEvents);
  const [backups, setBackups] = useState(initialBackups);
  const [trainingStatus, setTrainingStatus] = useState("idle");
  const [trainingSeries, setTrainingSeries] = useState(baseTrainingSeries);
  const [trainingConfig, setTrainingConfig] = useState({
    simulator: "AirSim",
    goal: "Обход препятствий",
    mode: "training",
    weather: "Переменная облачность",
    wind: 6,
    terrain: "Городской квартал"
  });
  const [seenCount, setSeenCount] = useState(initialEvents.length);
  const [demoMode, setDemoMode] = useState(true);
  const toggleDemoMode = (mode) => {
    setDemoMode(mode);
    void api.runtimeDemoMode(mode).then((r) => {
      if (r.ok) {
        appendEvent({
          level: mode ? "info" : "warning",
          source: "Система",
          message: mode ? "Демо-режим: UI и бэкенд синхронизированы (DEMO_MODE=true)." : "Реальный режим: бэкенд DEMO_MODE=false (при смене RC/MAVLink может потребоваться перезапуск API)."
        });
      } else {
        appendEvent({
          level: "warning",
          source: "Система",
          message: "Режим изменён только в интерфейсе: сервер API недоступен."
        });
      }
    });
  };
  const appendEvent = (event) => {
    const next = {
      id: `evt-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString("ru-RU", { hour12: false }),
      ...event
    };
    setEvents((prev) => [next, ...prev].slice(0, 120));
  };
  const createBackup = (type = "manual") => {
    const stamp = /* @__PURE__ */ new Date();
    const next = {
      id: `b-${stamp.getTime()}`,
      name: `backup_${stamp.toISOString().slice(0, 19).replace(/[:T]/g, "_")}`,
      size: `${220 + Math.floor(Math.random() * 40)} МБ`,
      type,
      createdAt: stamp.toLocaleString("ru-RU")
    };
    setBackups((prev) => [next, ...prev]);
    appendEvent({ level: "success", source: "Backup", message: `Создана резервная копия ${next.name}` });
  };
  const restoreBackup = (backup) => {
    appendEvent({ level: "warning", source: "Backup", message: `Выполнено восстановление из ${backup.name}` });
  };
  const deleteBackup = (backupId) => {
    setBackups((prev) => prev.filter((item) => item.id !== backupId));
    appendEvent({ level: "info", source: "Backup", message: `Копия ${backupId} удалена из активного списка` });
  };
  const startTraining = () => {
    setTrainingStatus("running");
    appendEvent({
      level: "info",
      source: "Training",
      message: `Запуск обучения: ${trainingConfig.simulator} · цель «${trainingConfig.goal}»`
    });
  };
  const pauseTraining = () => {
    setTrainingStatus("paused");
    appendEvent({ level: "warning", source: "Training", message: "Обучение поставлено на паузу" });
  };
  const resetTraining = () => {
    setTrainingStatus("idle");
    setTrainingSeries(baseTrainingSeries);
    appendEvent({ level: "info", source: "Training", message: "Сессия обучения сброшена к базовому состоянию" });
  };
  const updateTrainingConfig = (patch) => {
    setTrainingConfig((prev) => ({ ...prev, ...patch }));
  };
  const markEventsSeen = () => setSeenCount(events.length);
  useEffect(() => {
    if (trainingStatus !== "running") return;
    const intervalId = window.setInterval(() => {
      setTrainingSeries((prev) => {
        const last = prev[prev.length - 1] ?? { ep: 0, reward: 0.3, loss: 1.2 };
        const ep = last.ep + 1;
        const reward = Number(Math.min(1.6, last.reward + 0.012 + Math.random() * 0.03).toFixed(3));
        const loss = Number(Math.max(0.04, last.loss - 0.018 - Math.random() * 0.03).toFixed(3));
        return [...prev, { ep, reward, loss }].slice(-60);
      });
    }, 1800);
    return () => window.clearInterval(intervalId);
  }, [trainingStatus]);
  useEffect(() => {
    if (trainingStatus !== "running") return;
    const last = trainingSeries[trainingSeries.length - 1];
    if (!last || last.ep % 5 !== 0) return;
    appendEvent({
      level: last.reward > 1.1 ? "success" : "info",
      source: "Training",
      message: `Эпизод ${last.ep}: reward ${last.reward.toFixed(2)}, loss ${last.loss.toFixed(3)}`
    });
  }, [trainingSeries, trainingStatus]);
  const trainingSummary = useMemo(() => {
    const last = trainingSeries[trainingSeries.length - 1] ?? { ep: 0, reward: 0, loss: 0 };
    const bestReward = Math.max(...trainingSeries.map((item) => item.reward));
    return {
      episode: last.ep,
      reward: last.reward,
      loss: last.loss,
      bestReward
    };
  }, [trainingSeries]);
  const value = useMemo(
    () => ({
      events,
      backups,
      trainingStatus,
      trainingSeries,
      trainingConfig,
      trainingSummary,
      unreadEvents: Math.max(0, events.length - seenCount),
      demoMode,
      toggleDemoMode,
      appendEvent,
      createBackup,
      restoreBackup,
      deleteBackup,
      startTraining,
      pauseTraining,
      resetTraining,
      updateTrainingConfig,
      markEventsSeen
    }),
    [events, backups, trainingStatus, trainingSeries, trainingConfig, trainingSummary, seenCount, demoMode]
  );
  return /* @__PURE__ */ jsx(OpsContext.Provider, { value, children });
}
function useOps() {
  const ctx = useContext(OpsContext);
  if (!ctx) throw new Error("useOps must be used within OpsProvider");
  return ctx;
}
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverContent = React.forwardRef(({ className, align = "center", sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx(PopoverPrimitive.Portal, { children: /* @__PURE__ */ jsx(
  PopoverPrimitive.Content,
  {
    ref,
    align,
    sideOffset,
    className: cn(
      "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-popover-content-transform-origin)",
      className
    ),
    ...props
  }
) }));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;
function HelpTooltip({
  text,
  children,
  variant = "inline",
  className,
  side = "top",
  title
}) {
  return /* @__PURE__ */ jsxs(Popover, { children: [
    /* @__PURE__ */ jsx(
      PopoverTrigger,
      {
        type: "button",
        "aria-label": "Подсказка",
        className: cn(
          "inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          variant === "corner" && "absolute right-1.5 top-1.5 h-5 w-5 bg-card/80 backdrop-blur",
          variant === "inline" && "ml-1 align-middle",
          className
        ),
        onClick: (e) => e.stopPropagation(),
        children: /* @__PURE__ */ jsx(HelpCircle, { className: "h-3.5 w-3.5" })
      }
    ),
    /* @__PURE__ */ jsxs(PopoverContent, { side, className: "w-72 text-xs leading-relaxed", children: [
      title && /* @__PURE__ */ jsx("div", { className: "mb-1 text-sm font-semibold text-foreground", children: title }),
      /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: children ?? text })
    ] })
  ] });
}
const HELP = {
  // ===== Команды (api/v1/command, /api/v1/emergency/stop) =====
  commands: {
    arm: "ARM — вооружить моторы. Дрон готов к взлёту, пропеллеры начнут вращаться по команде TAKEOFF. Нельзя выполнять при низком заряде или ошибках сенсоров.",
    disarm: "DISARM — разоружить моторы. Безопасно использовать только после посадки. В воздухе приведёт к падению.",
    takeoff: "TAKEOFF — автоматический взлёт на заданную высоту (по умолчанию 30 м). Перед командой нужен ARM и стабильный GPS.",
    land: "LAND — автоматическая посадка в текущей точке с контролем вертикальной скорости.",
    rtl: "RTL (Return To Launch) — возврат в точку взлёта на безопасной высоте. Активируется автоматически при низком заряде или потере связи.",
    hover: "HOVER / LOITER — удержание текущей позиции. Используйте при перепланировании маршрута.",
    goto: "GOTO — отправить дрон в точку с координатами X/Y/Z (метры от точки взлёта). Маршрут просчитывается с учётом препятствий.",
    throttle: "Газ (Throttle) — мощность моторов в процентах. В режиме MANUAL влияет напрямую, в AUTO/GUIDED игнорируется.",
    emergency: "EMERGENCY STOP — аварийная остановка моторов. Дрон упадёт на месте. Использовать только при угрозе людям."
  },
  // ===== Системное =====
  system: {
    backendStatus: "Статус Python-бэкенда. Зелёный — отвечает, серый — недоступен (дашборд работает на мок-данных)."
  }
};
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return /* @__PURE__ */ jsx(Comp, { className: cn(buttonVariants({ variant, size, className })), ref, ...props });
  }
);
Button.displayName = "Button";
function useBackendStatus() {
  const [online, setOnline] = useState(null);
  useEffect(() => {
    let alive = true;
    const check = async () => {
      const ok = await pingBackend();
      if (alive) setOnline(ok);
    };
    check();
    const id = setInterval(check, 6e3);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);
  return online;
}
function useClock() {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(/* @__PURE__ */ new Date());
    const id = setInterval(() => setNow(/* @__PURE__ */ new Date()), 1e3);
    return () => clearInterval(id);
  }, []);
  return now;
}
function Header() {
  const now = useClock();
  const { trainingStatus, unreadEvents, demoMode, toggleDemoMode } = useOps();
  const backendOnline = useBackendStatus();
  const time = now?.toLocaleTimeString("ru-RU", { hour12: false }) ?? "--:--:--";
  const date = now?.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }) ?? "—";
  return /* @__PURE__ */ jsxs("header", { className: "sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/85 px-4 backdrop-blur lg:px-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 lg:hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary", children: /* @__PURE__ */ jsx(Satellite, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx("span", { className: "text-sm font-bold", children: "COBA AI" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "hidden md:flex items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-1.5 w-72", children: [
      /* @__PURE__ */ jsx(Search, { className: "h-4 w-4 text-muted-foreground" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          placeholder: "Поиск миссий, команд, дронов…",
          className: "w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        }
      ),
      /* @__PURE__ */ jsx("kbd", { className: "hidden font-mono text-[10px] text-muted-foreground md:inline", children: "⌘K" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "ml-auto flex items-center gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 rounded-lg border border-border bg-muted p-1", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: demoMode ? "default" : "outline",
            size: "sm",
            onClick: () => toggleDemoMode(true),
            className: `h-7 px-3 text-xs ${demoMode ? "bg-green-600 hover:bg-green-700" : ""}`,
            children: [
              /* @__PURE__ */ jsx(Gamepad2, { className: "mr-1 h-3 w-3" }),
              "Демо"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: !demoMode ? "default" : "outline",
            size: "sm",
            onClick: () => toggleDemoMode(false),
            className: `h-7 px-3 text-xs ${!demoMode ? "bg-blue-600 hover:bg-blue-700" : ""}`,
            children: [
              /* @__PURE__ */ jsx(Plug, { className: "mr-1 h-3 w-3" }),
              "Реальный"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs(
        "div",
        {
          className: "hidden items-center gap-1.5 rounded-md border border-border bg-card/60 px-2.5 py-1.5 md:flex",
          title: `API: ${getApiBaseUrl()}`,
          children: [
            /* @__PURE__ */ jsx(Server, { className: `h-3.5 w-3.5 ${backendOnline ? "text-success" : backendOnline === false ? "text-muted-foreground" : "text-warning"}` }),
            /* @__PURE__ */ jsx("span", { className: "text-[11px] text-muted-foreground", children: "Бэкенд" }),
            /* @__PURE__ */ jsx("span", { className: `font-mono text-xs font-semibold ${backendOnline ? "text-success" : backendOnline === false ? "text-muted-foreground" : "text-warning"}`, children: backendOnline === null ? "…" : backendOnline ? "ON" : "MOCK" }),
            /* @__PURE__ */ jsx(HelpTooltip, { text: HELP.system.backendStatus })
          ]
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "hidden items-center gap-2 md:flex", children: [
        /* @__PURE__ */ jsx(StatusPill, { icon: /* @__PURE__ */ jsx(Wifi, { className: "h-3.5 w-3.5" }), label: "Связь", value: "89%", tone: "success" }),
        /* @__PURE__ */ jsx(StatusPill, { icon: /* @__PURE__ */ jsx(Battery, { className: "h-3.5 w-3.5" }), label: "Батарея", value: "64%", tone: "warning" }),
        /* @__PURE__ */ jsx(StatusPill, { icon: /* @__PURE__ */ jsx(Satellite, { className: "h-3.5 w-3.5" }), label: "GPS", value: "14 спут.", tone: "success" }),
        /* @__PURE__ */ jsx(
          StatusPill,
          {
            icon: /* @__PURE__ */ jsx(Satellite, { className: "h-3.5 w-3.5" }),
            label: "Обучение",
            value: trainingStatus === "running" ? "RUN" : trainingStatus === "paused" ? "PAUSE" : "IDLE",
            tone: trainingStatus === "running" ? "success" : trainingStatus === "paused" ? "warning" : "destructive"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "hidden text-right lg:block", children: [
        /* @__PURE__ */ jsx("div", { className: "font-mono text-sm font-semibold text-foreground tabular-nums", children: time }),
        /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground", children: date })
      ] }),
      /* @__PURE__ */ jsxs("button", { className: "relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground", children: [
        /* @__PURE__ */ jsx(Bell, { className: "h-4 w-4" }),
        unreadEvents > 0 && /* @__PURE__ */ jsx("span", { className: "absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 font-mono text-[9px] text-destructive-foreground", children: Math.min(unreadEvents, 9) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-primary to-accent font-mono text-sm font-bold text-primary-foreground", children: "ОП" })
    ] })
  ] });
}
function StatusPill({
  icon,
  label,
  value,
  tone
}) {
  const toneClass = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-destructive";
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 rounded-md border border-border bg-card/60 px-2.5 py-1.5", children: [
    /* @__PURE__ */ jsx("span", { className: toneClass, children: icon }),
    /* @__PURE__ */ jsx("span", { className: "text-[11px] text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("span", { className: `font-mono text-xs font-semibold ${toneClass}`, children: value })
  ] });
}
const items = [
  { to: "/", label: "Телем.", icon: Activity, exact: true },
  { to: "/missions", label: "Миссии", icon: Map },
  { to: "/instructions", label: "Правила", icon: Shield },
  { to: "/commands", label: "Команды", icon: Gamepad2 },
  { to: "/tools", label: "Тулзы", icon: Wrench },
  { to: "/learning", label: "DQN", icon: Brain },
  { to: "/fleet", label: "Флот", icon: Plane },
  { to: "/camera", label: "Камера", icon: Camera },
  { to: "/events", label: "Журнал", icon: ScrollText },
  { to: "/backups", label: "Бэкап", icon: Database },
  { to: "/settings", label: "Сетап", icon: SlidersHorizontal }
];
function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return /* @__PURE__ */ jsx("nav", { className: "lg:hidden sticky bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur", children: /* @__PURE__ */ jsx("div", { className: "flex overflow-x-auto", children: items.map((item) => {
    const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
    const Icon = item.icon;
    return /* @__PURE__ */ jsxs(
      Link,
      {
        to: item.to,
        className: [
          "flex min-w-[72px] flex-col items-center gap-1 px-3 py-2 text-[10px] font-medium transition-colors",
          active ? "text-primary" : "text-muted-foreground"
        ].join(" "),
        children: [
          /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4" }),
          item.label
        ]
      },
      item.to
    );
  }) }) });
}
const MissionContext = createContext(null);
function MissionProvider({ children }) {
  const [missions, setMissions] = useState(initialMissions);
  const updateMissionStatus = (missionId, status) => {
    setMissions((prev) => prev.map((mission) => mission.id === missionId ? { ...mission, status } : mission));
  };
  return /* @__PURE__ */ jsx(MissionContext.Provider, { value: { missions, setMissions, updateMissionStatus }, children });
}
function useMissions() {
  const ctx = useContext(MissionContext);
  if (!ctx) throw new Error("useMissions must be used within MissionProvider");
  return ctx;
}
const initialMsgs = [
  {
    id: 1,
    role: "assistant",
    text: "Здравствуйте! Я ИИ-помощник COBA. Я в курсе активных миссий, директив оператора и состояния флота. Спросите про статус, телеметрию или попросите запустить задачу."
  }
];
const suggestions = [
  "Какие активные директивы?",
  "Кто выполняет MIS-001?",
  "Уровень заряда всех дронов",
  "Обнаружил автомобиль, что делать?"
];
function AIChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState(initialMsgs);
  const [input, setInput] = useState("");
  const { missions } = useMissions();
  const { events, markEventsSeen, appendEvent } = useOps();
  const activeContext = useMemo(() => {
    const active = missions.filter(
      (m) => (m.status === "running" || m.status === "pending" || m.status === "paused") && (m.directives || m.droneIds && m.droneIds.length > 0 || m.droneId)
    );
    return active;
  }, [missions]);
  const send = async (text) => {
    const t = text.trim();
    if (!t) return;
    const userMsg = { id: Date.now(), role: "user", text: t };
    setMsgs((m) => [...m, userMsg]);
    setInput("");
    const r = await api.subAgentAsk(t);
    let body;
    if (r.ok && r.data && typeof r.data === "object" && r.data.response != null) {
      body = String(r.data.response);
    } else {
      body = smartReply(t, activeContext);
    }
    const reply = {
      id: Date.now() + 1,
      role: "assistant",
      text: body
    };
    setMsgs((m) => [...m, reply]);
    appendEvent({ level: "info", source: "AI", message: `Оператор отправил побочную инструкцию: ${t}` });
  };
  const eventFeed = events.slice(0, 6);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    !open && /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => {
          setOpen(true);
          markEventsSeen();
        },
        className: "fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-[0_8px_32px_oklch(0.82_0.18_200_/_0.45)] transition-transform hover:scale-105 lg:bottom-6 lg:right-6",
        "aria-label": "Открыть ИИ-помощника",
        children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "h-6 w-6" }),
          /* @__PURE__ */ jsx("span", { className: "absolute -top-1 -right-1 h-3 w-3 rounded-full bg-success ring-2 ring-background pulse-dot" }),
          activeContext.length > 0 && /* @__PURE__ */ jsx("span", { className: "absolute -bottom-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-background bg-accent px-1 font-mono text-[9px] font-bold text-accent-foreground", children: activeContext.length })
        ]
      }
    ),
    open && /* @__PURE__ */ jsxs("div", { className: "fixed bottom-20 right-4 z-40 flex h-[600px] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-border bg-popover shadow-2xl lg:bottom-6 lg:right-6", children: [
      /* @__PURE__ */ jsxs("header", { className: "flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/15 to-accent/10 px-4 py-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground", children: /* @__PURE__ */ jsx(Bot, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold", children: "ИИ-помощник COBA" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-[10px] text-muted-foreground", children: [
              /* @__PURE__ */ jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-success" }),
              "Подключено · DeepSeek"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setOpen(false),
            className: "rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
            children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
          }
        )
      ] }),
      activeContext.length > 0 && /* @__PURE__ */ jsxs("div", { className: "max-h-32 overflow-y-auto border-b border-accent/30 bg-accent/5 px-3 py-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-1.5 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-accent-foreground", children: [
          /* @__PURE__ */ jsx(Target, { className: "h-3 w-3" }),
          "Активный контекст · ",
          activeContext.length
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-1.5", children: activeContext.map((m) => {
          const droneIds = m.droneIds && m.droneIds.length > 0 ? m.droneIds : m.droneId ? [m.droneId] : [];
          const droneNames = droneIds.map((id) => initialFleet.find((d) => d.id === id)?.name ?? id).join(", ");
          return /* @__PURE__ */ jsxs(
            "div",
            {
              className: "rounded border border-border/60 bg-card/60 p-1.5 text-[10px]",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-mono text-muted-foreground", children: m.id }),
                  /* @__PURE__ */ jsx("span", { className: "font-semibold text-foreground", children: m.name }),
                  m.priority && m.priority !== "normal" && /* @__PURE__ */ jsx(
                    "span",
                    {
                      className: [
                        "rounded px-1 font-mono text-[8px] uppercase",
                        m.priority === "critical" && "bg-destructive/20 text-destructive",
                        m.priority === "high" && "bg-warning/20 text-warning",
                        m.priority === "low" && "bg-secondary text-muted-foreground"
                      ].filter(Boolean).join(" "),
                      children: m.priority
                    }
                  )
                ] }),
                droneNames && /* @__PURE__ */ jsxs("div", { className: "mt-0.5 text-muted-foreground", children: [
                  "🛸 ",
                  droneNames
                ] }),
                m.directives && /* @__PURE__ */ jsxs("div", { className: "mt-0.5 line-clamp-2 italic text-foreground/80", children: [
                  "✦ ",
                  m.directives
                ] })
              ]
            },
            m.id
          );
        }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-3 overflow-y-auto p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-card/40 p-3", children: [
          /* @__PURE__ */ jsx("div", { className: "mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground", children: "События всех дронов · realtime" }),
          /* @__PURE__ */ jsx("div", { className: "space-y-2", children: eventFeed.map((event) => /* @__PURE__ */ jsxs("div", { className: "text-[11px] leading-relaxed text-muted-foreground", children: [
            /* @__PURE__ */ jsx("span", { className: "font-mono text-primary", children: event.timestamp }),
            " · ",
            /* @__PURE__ */ jsx("span", { className: "text-foreground", children: event.source }),
            " · ",
            event.message
          ] }, event.id)) })
        ] }),
        msgs.map((m) => /* @__PURE__ */ jsx(
          "div",
          {
            className: `flex ${m.role === "user" ? "justify-end" : "justify-start"}`,
            children: /* @__PURE__ */ jsx(
              "div",
              {
                className: [
                  "max-w-[85%] whitespace-pre-line rounded-lg px-3 py-2 text-sm leading-relaxed",
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                ].join(" "),
                children: m.text
              }
            )
          },
          m.id
        ))
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "border-t border-border bg-card/50 p-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-2 flex flex-wrap gap-1.5", children: [
          suggestions.map((s) => /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => send(s),
              className: "rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary hover:text-primary",
              children: s
            },
            s
          )),
          [
            "Сделать фото",
            "Изучить объект",
            "Собрать данные",
            "Вернуть домой"
          ].map((action) => /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => send(action),
              className: "rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] text-primary transition-colors hover:bg-primary/15",
              children: action
            },
            action
          ))
        ] }),
        /* @__PURE__ */ jsxs(
          "form",
          {
            onSubmit: (e) => {
              e.preventDefault();
              send(input);
            },
            className: "flex items-center gap-2 rounded-md border border-border bg-input px-3 py-2",
            children: [
              /* @__PURE__ */ jsx(MessageSquare, { className: "h-4 w-4 text-muted-foreground" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  value: input,
                  onChange: (e) => setInput(e.target.value),
                  placeholder: "Напишите сообщение…",
                  className: "w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "submit",
                  className: "flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground transition-opacity hover:opacity-90",
                  children: /* @__PURE__ */ jsx(Send, { className: "h-3.5 w-3.5" })
                }
              )
            ]
          }
        )
      ] })
    ] })
  ] });
}
function smartReply(q, context) {
  const lower = q.toLowerCase();
  if (lower.includes("директив") || lower.includes("услов") || lower.includes("инструкц")) {
    if (context.length === 0) {
      return "Сейчас нет активных миссий с заданными директивами. Откройте «Миссии», выберите миссию и нажмите «Изменить» рядом с «Условности миссии».";
    }
    return "Активные директивы оператора:\n\n" + context.filter((m) => m.directives).map((m) => `• ${m.id} «${m.name}»${m.priority && m.priority !== "normal" ? ` [${m.priority}]` : ""}:
  ${m.directives}`).join("\n\n");
  }
  const misMatch = lower.match(/mis[-\s]?(\d{1,3})/i);
  if (misMatch) {
    const id = `MIS-${misMatch[1].padStart(3, "0")}`;
    const m = context.find((x) => x.id.toUpperCase() === id) ?? context[0];
    if (!m) return `Миссия ${id} не найдена в активном контексте.`;
    const droneIds = m.droneIds && m.droneIds.length > 0 ? m.droneIds : m.droneId ? [m.droneId] : [];
    const drones = droneIds.map((d) => initialFleet.find((f) => f.id === d)?.name ?? d).join(", ");
    return `${m.id} «${m.name}»
Тип: ${missionTypeLabel[m.type]}
Статус: ${missionStatusLabel[m.status]}, прогресс ${m.progress}%
Исполнители: ${drones || "не назначены"}
` + (m.priority ? `Приоритет: ${m.priority}
` : "") + (m.directives ? `
✦ Директивы: ${m.directives}` : "");
  }
  if (lower.includes("стат") && lower.includes("mis")) {
    return "MIS-001 «Патруль периметра №7» — выполняется, прогресс 64%, дрон COBA-Alpha, заряд 64%. Расчётное время до завершения: 6 минут.";
  }
  if (lower.includes("заряд") || lower.includes("батаре")) {
    return "Текущий заряд флота:\n• COBA-Alpha — 64%\n• COBA-Bravo — 92%\n• COBA-Charlie — 38% (на зарядке)\n• COBA-Delta — 71%\n• COBA-Foxtrot — 100%\n\nСредний заряд активных дронов: 76%.";
  }
  if (lower.includes("патрул") || lower.includes("запус")) {
    const ctxNote = context.find((m) => m.directives) ? `

Учту активные директивы: «${context.find((m) => m.directives)?.directives}»` : "";
    return `Готов запустить миссию «Патруль периметра». Использовать дрон COBA-Bravo (92%)? Подтвердите командой «да».${ctxNote}`;
  }
  if (lower.includes("погод")) {
    return "Текущие условия: ветер 7 м/с (С-З), видимость 10 км, температура +12 °C. Условия пригодны для полётов.";
  }
  const ctxHint = context.length > 0 ? `

В работе сейчас: ${context.map((m) => m.id).join(", ")}.` : "";
  return `Принято. Обрабатываю запрос… (демо-режим — подключите DeepSeek API в Настройках, чтобы получать живые ответы).${ctxHint}`;
}
const STORAGE_KEY = "coba.safety.v1";
const seedRules = [
  { id: "r-seed-1", title: "Запрет входа в restricted-геозоны", group: "Полёты", field: "geofence", operator: "==", value: "restricted", action: "RTL", priority: "critical", enabled: true, createdAt: "2025-04-19" },
  { id: "r-seed-2", title: "RTL при батарее < 22%", group: "Безопасность", field: "battery", operator: "<", value: 22, action: "RTL", priority: "critical", enabled: true, createdAt: "2025-04-19" },
  { id: "r-seed-3", title: "LOITER при потере связи > 8с", group: "Связь", field: "linkLost", operator: ">", value: 8, action: "LOITER", priority: "high", enabled: true, createdAt: "2025-04-19" },
  { id: "r-seed-4", title: "Не вести запись над частной территорией", group: "Право", field: "privateZone", operator: "==", value: "true", action: "LOG", priority: "normal", enabled: true, createdAt: "2025-04-19" },
  { id: "r-seed-5", title: "Фиксировать обнаружения человека", group: "Отчётность", field: "detection.person", operator: "==", value: "true", action: "LOG", priority: "normal", enabled: false, createdAt: "2025-04-19" }
];
const seedProtocols = [
  {
    id: "p-seed-1",
    name: "Критическая батарея",
    trigger: "battery < 15%",
    description: "Немедленный RTL с переходом в посадку при невозможности достичь базы.",
    steps: [
      { id: "s1", action: "NOTIFY", delaySec: 0, note: "Сигнал оператору и в журнал" },
      { id: "s2", action: "RTL", delaySec: 1, note: "Возврат на точку дома" },
      { id: "s3", action: "LAND", delaySec: 0, note: "Если базы не достичь — посадка в безопасной точке" }
    ],
    enabled: true
  },
  {
    id: "p-seed-2",
    name: "Потеря связи",
    trigger: "uplink lost > 8s",
    description: "Удержание позиции, попытка mesh-relay, через 30с — RTL.",
    steps: [
      { id: "s1", action: "LOITER", delaySec: 0, note: "Зависнуть в текущей точке" },
      { id: "s2", action: "NOTIFY", delaySec: 5, note: "Авто-уведомление по всем каналам" },
      { id: "s3", action: "RTL", delaySec: 30, note: "Возврат, если связь не восстановлена" }
    ],
    enabled: true
  },
  {
    id: "p-seed-3",
    name: "Нарушение геозоны",
    trigger: "enter restricted zone",
    description: "Аварийная остановка движения и разворот.",
    steps: [
      { id: "s1", action: "LOITER", delaySec: 0 },
      { id: "s2", action: "EMERGENCY", delaySec: 1, note: "Перевод в аварийный режим" },
      { id: "s3", action: "RTL", delaySec: 2 }
    ],
    enabled: true
  }
];
const SafetyContext = createContext(null);
function SafetyProvider({ children }) {
  const [state, setState] = useState({
    rules: seedRules,
    geozones: initialGeoZones,
    protocols: seedProtocols
  });
  const [dismissed, setDismissed] = useState([]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setState((prev) => ({ ...prev, ...parsed.state }));
        setDismissed(parsed.dismissed ?? []);
      }
    } catch {
    }
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, dismissed }));
    } catch {
    }
  }, [state, dismissed]);
  const addRule = (rule) => setState((s) => ({
    ...s,
    rules: [
      { ...rule, id: `r-${Date.now()}`, createdAt: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10) },
      ...s.rules
    ]
  }));
  const removeRule = (id) => setState((s) => ({ ...s, rules: s.rules.filter((r) => r.id !== id) }));
  const toggleRule = (id) => setState((s) => ({ ...s, rules: s.rules.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r) }));
  const addGeoZone = (zone) => setState((s) => ({ ...s, geozones: [...s.geozones, { ...zone, id: `gz-${Date.now()}` }] }));
  const removeGeoZone = (id) => setState((s) => ({ ...s, geozones: s.geozones.filter((z) => z.id !== id) }));
  const addProtocol = (proto) => setState((s) => ({ ...s, protocols: [{ ...proto, id: `p-${Date.now()}` }, ...s.protocols] }));
  const removeProtocol = (id) => setState((s) => ({ ...s, protocols: s.protocols.filter((p) => p.id !== id) }));
  const toggleProtocol = (id) => setState((s) => ({ ...s, protocols: s.protocols.map((p) => p.id === id ? { ...p, enabled: !p.enabled } : p) }));
  const suggestions2 = useMemo(() => {
    const list = [];
    const failed = initialMissions.filter((m) => m.status === "failed" || m.status === "paused").length;
    if (failed >= 2) {
      list.push({
        id: "sug-rtl-25",
        kind: "rule",
        title: "Поднять порог RTL до 25%",
        reason: `${failed} миссий завершились некорректно. Анализ показывает, что более ранний RTL мог бы их спасти.`,
        confidence: 78,
        payload: {
          title: "RTL при батарее < 25%",
          group: "Безопасность",
          field: "battery",
          operator: "<",
          value: 25,
          action: "RTL",
          priority: "high",
          enabled: true
        }
      });
    }
    const fires = initialDetections.filter((d) => d.type === "fire");
    if (fires.length > 0) {
      const f = fires[0];
      list.push({
        id: "sug-fire-zone",
        kind: "geozone",
        title: "Создать warning-зону вокруг очагов возгорания",
        reason: `Обнаружено ${fires.length} тепловых аномалий. Рекомендуется ограничить высоту полётов в радиусе 200м.`,
        confidence: 85,
        payload: {
          name: "Warning · тепловые аномалии",
          type: "warning",
          polygon: [
            [f.position[0] - 2e-3, f.position[1] - 2e-3],
            [f.position[0] + 2e-3, f.position[1] - 2e-3],
            [f.position[0] + 2e-3, f.position[1] + 2e-3],
            [f.position[0] - 2e-3, f.position[1] + 2e-3]
          ]
        }
      });
    }
    const persons = initialDetections.filter((d) => d.type === "person").length;
    if (persons > 0) {
      list.push({
        id: "sug-person-log",
        kind: "rule",
        title: "Включить обязательное логирование обнаружений людей",
        reason: `За сессию зафиксировано ${persons} обнаружений человека. Согласно регламенту они должны попадать в журнал.`,
        confidence: 92,
        payload: {
          title: "Лог обнаружений людей",
          group: "Отчётность",
          field: "detection.person",
          operator: "==",
          value: "true",
          action: "LOG",
          priority: "normal",
          enabled: true
        }
      });
    }
    const swarmMissions = initialMissions.filter((m) => m.droneIds && m.droneIds.length > 1).length;
    if (swarmMissions > 0) {
      list.push({
        id: "sug-swarm-land",
        kind: "protocol",
        title: "Добавить протокол синхронной посадки роя",
        reason: "В системе есть мульти-дроновые миссии — рекомендуем единый протокол одновременной посадки при ЧС.",
        confidence: 70,
        payload: {
          name: "Синхронная посадка роя",
          trigger: "swarm emergency",
          description: "Координированная остановка всех дронов миссии.",
          enabled: true,
          steps: [
            { id: "s1", action: "NOTIFY", delaySec: 0, note: "Оповестить оператора" },
            { id: "s2", action: "LOITER", delaySec: 1, note: "Все дроны зависают" },
            { id: "s3", action: "LAND", delaySec: 5, note: "Синхронная посадка" }
          ]
        }
      });
    }
    return list.filter((s) => !dismissed.includes(s.id));
  }, [dismissed]);
  const applySuggestion = useCallback(
    (s) => {
      if (s.kind === "rule") {
        addRule(s.payload);
      } else if (s.kind === "geozone") {
        addGeoZone(s.payload);
      } else if (s.kind === "protocol") {
        addProtocol(s.payload);
      }
      setDismissed((d) => [...d, s.id]);
    },
    []
  );
  const dismissSuggestion = (id) => setDismissed((d) => [...d, id]);
  const value = {
    ...state,
    addRule,
    removeRule,
    toggleRule,
    addGeoZone,
    removeGeoZone,
    addProtocol,
    removeProtocol,
    toggleProtocol,
    suggestions: suggestions2,
    applySuggestion,
    dismissSuggestion
  };
  return /* @__PURE__ */ jsx(SafetyContext.Provider, { value, children });
}
function NotFoundComponent() {
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsx("div", { className: "font-mono text-[10px] uppercase tracking-[0.3em] text-primary", children: "COBA AI · Ошибка маршрута" }),
    /* @__PURE__ */ jsx("h1", { className: "mt-4 font-mono text-7xl font-bold text-foreground", children: "404" }),
    /* @__PURE__ */ jsx("h2", { className: "mt-2 text-xl font-semibold text-foreground", children: "Страница не найдена" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Запрошенный маршрут не существует в системе управления." }),
    /* @__PURE__ */ jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsx(
      Link,
      {
        to: "/",
        className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
        children: "Вернуться к телеметрии"
      }
    ) })
  ] }) });
}
const Route$c = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "COBA AI · Дашборд управления дронами" },
      {
        name: "description",
        content: "Полнофункциональная система управления ИИ-дронами COBA: телеметрия, миссии, флот и автономный ИИ-помощник."
      },
      { name: "author", content: "COBA AI" },
      { property: "og:title", content: "COBA AI · Дашборд управления дронами" },
      {
        property: "og:description",
        content: "Реал-тайм телеметрия, управление миссиями, флотом и ИИ-помощник."
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "COBA AI · Дашборд управления дронами" },
      { name: "description", content: "A Russian-language dashboard application for monitoring drone telemetry and mission data." },
      { property: "og:description", content: "A Russian-language dashboard application for monitoring drone telemetry and mission data." },
      { name: "twitter:description", content: "A Russian-language dashboard application for monitoring drone telemetry and mission data." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/5fe61ed8-fb7f-4c92-9e5b-233aa4a7a9b8/id-preview-17af7fdc--2cd8e1f3-acd4-439d-b4c4-59d0a515aca0.lovable.app-1776612402061.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/5fe61ed8-fb7f-4c92-9e5b-233aa4a7a9b8/id-preview-17af7fdc--2cd8e1f3-acd4-439d-b4c4-59d0a515aca0.lovable.app-1776612402061.png" }
    ],
    links: [{ rel: "stylesheet", href: appCss }]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "ru", children: [
    /* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  return /* @__PURE__ */ jsx(MissionProvider, { children: /* @__PURE__ */ jsx(OpsProvider, { children: /* @__PURE__ */ jsx(SafetyProvider, { children: /* @__PURE__ */ jsxs("div", { className: "flex h-screen w-full overflow-hidden bg-background", children: [
    /* @__PURE__ */ jsx(Sidebar, {}),
    /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 flex-1 flex-col", children: [
      /* @__PURE__ */ jsx(Header, {}),
      /* @__PURE__ */ jsx("main", { className: "flex-1 overflow-y-auto px-4 py-6 lg:px-8", children: /* @__PURE__ */ jsx(Outlet, {}) }),
      /* @__PURE__ */ jsx(MobileNav, {})
    ] }),
    /* @__PURE__ */ jsx(AIChat, {})
  ] }) }) }) });
}
const $$splitComponentImporter$b = () => import("./tools-wImhf5De.js");
const Route$b = createFileRoute("/tools")({
  head: () => ({
    meta: [{
      title: "Инструменты · COBA AI"
    }, {
      name: "description",
      content: "13 интегрированных модулей системы COBA AI."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$b, "component")
});
const $$splitComponentImporter$a = () => import("./simulation-DB3HhaeC.js");
const Route$a = createFileRoute("/simulation")({
  head: () => ({
    meta: [{
      title: "Симуляция · COBA AI"
    }, {
      name: "description",
      content: "Подключение ко всем поддерживаемым симуляторам COBA AI: AirSim, Gazebo, PyBullet, Webots, jMAVSim, Unity, CARLA, Isaac."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$a, "component")
});
const $$splitComponentImporter$9 = () => import("./settings-mq7Pyo9X.js");
const Route$9 = createFileRoute("/settings")({
  head: () => ({
    meta: [{
      title: "Настройки · COBA AI"
    }, {
      name: "description",
      content: "Сенсоры, связь, калибровка и системные тесты COBA AI."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const $$splitComponentImporter$8 = () => import("./missions-cAG0I2Qg.js");
const Route$8 = createFileRoute("/missions")({
  head: () => ({
    meta: [{
      title: "Миссии · COBA AI"
    }, {
      name: "description",
      content: "Создание и управление полётными миссиями COBA AI."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./learning-DVhZZ63e.js");
const Route$7 = createFileRoute("/learning")({
  head: () => ({
    meta: [{
      title: "Обучение DQN · COBA AI"
    }, {
      name: "description",
      content: "Глубокое Q-обучение в реальном времени."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./instructions-Dq2AM_PX.js");
const Route$6 = createFileRoute("/instructions")({
  head: () => ({
    meta: [{
      title: "Инструкции · COBA AI"
    }, {
      name: "description",
      content: "Правила, геозоны и протоколы безопасности для операций COBA AI."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./fleet-Ba5DACA6.js");
const Route$5 = createFileRoute("/fleet")({
  head: () => ({
    meta: [{
      title: "Флот · COBA AI"
    }, {
      name: "description",
      content: "Управление флотом дронов, группами и mesh-сетью COBA AI."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./events-iCk7EPVE.js");
const Route$4 = createFileRoute("/events")({
  head: () => ({
    meta: [{
      title: "Журнал событий · COBA AI"
    }, {
      name: "description",
      content: "Журнал событий и уведомлений системы COBA AI."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./commands-BfdpFT84.js");
const Route$3 = createFileRoute("/commands")({
  head: () => ({
    meta: [{
      title: "Команды · COBA AI"
    }, {
      name: "description",
      content: "Ручное управление и быстрые команды для дрона COBA AI."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./camera-DovseMLw.js");
const Route$2 = createFileRoute("/camera")({
  head: () => ({
    meta: [{
      title: "Камера · COBA AI"
    }, {
      name: "description",
      content: "Видеопоток с детекцией объектов."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./backups-Bqdk73El.js");
const Route$1 = createFileRoute("/backups")({
  head: () => ({
    meta: [{
      title: "Бэкапы · COBA AI"
    }, {
      name: "description",
      content: "Управление резервными копиями системы."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./index-3Vn2kj8Y.js");
const Route = createFileRoute("/")({
  head: () => ({
    meta: [{
      title: "Телеметрия · COBA AI"
    }, {
      name: "description",
      content: "Реал-тайм мониторинг полётных параметров дрона COBA AI."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const ToolsRoute = Route$b.update({
  id: "/tools",
  path: "/tools",
  getParentRoute: () => Route$c
});
const SimulationRoute = Route$a.update({
  id: "/simulation",
  path: "/simulation",
  getParentRoute: () => Route$c
});
const SettingsRoute = Route$9.update({
  id: "/settings",
  path: "/settings",
  getParentRoute: () => Route$c
});
const MissionsRoute = Route$8.update({
  id: "/missions",
  path: "/missions",
  getParentRoute: () => Route$c
});
const LearningRoute = Route$7.update({
  id: "/learning",
  path: "/learning",
  getParentRoute: () => Route$c
});
const InstructionsRoute = Route$6.update({
  id: "/instructions",
  path: "/instructions",
  getParentRoute: () => Route$c
});
const FleetRoute = Route$5.update({
  id: "/fleet",
  path: "/fleet",
  getParentRoute: () => Route$c
});
const EventsRoute = Route$4.update({
  id: "/events",
  path: "/events",
  getParentRoute: () => Route$c
});
const CommandsRoute = Route$3.update({
  id: "/commands",
  path: "/commands",
  getParentRoute: () => Route$c
});
const CameraRoute = Route$2.update({
  id: "/camera",
  path: "/camera",
  getParentRoute: () => Route$c
});
const BackupsRoute = Route$1.update({
  id: "/backups",
  path: "/backups",
  getParentRoute: () => Route$c
});
const IndexRoute = Route.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$c
});
const rootRouteChildren = {
  IndexRoute,
  BackupsRoute,
  CameraRoute,
  CommandsRoute,
  EventsRoute,
  FleetRoute,
  InstructionsRoute,
  LearningRoute,
  MissionsRoute,
  SettingsRoute,
  SimulationRoute,
  ToolsRoute
};
const routeTree = Route$c._addFileChildren(rootRouteChildren)._addFileTypes();
function DefaultErrorComponent({ error, reset }) {
  const router2 = useRouter();
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsx("div", { className: "mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10", children: /* @__PURE__ */ jsx(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        className: "h-8 w-8 text-destructive",
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        strokeWidth: 2,
        children: /* @__PURE__ */ jsx(
          "path",
          {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            d: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          }
        )
      }
    ) }),
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight text-foreground", children: "Something went wrong" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "An unexpected error occurred. Please try again." }),
    false,
    /* @__PURE__ */ jsxs("div", { className: "mt-6 flex items-center justify-center gap-3", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => {
            router2.invalidate();
            reset();
          },
          className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
          children: "Try again"
        }
      ),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "/",
          className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
          children: "Go home"
        }
      )
    ] })
  ] }) });
}
const getRouter = () => {
  const router2 = createRouter({
    routeTree,
    context: {},
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultErrorComponent
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  HelpTooltip as H,
  api as a,
  useMissions as b,
  initialFleet as c,
  missionTypeLabel as d,
  initialGeoZones as e,
  missionStatusLabel as f,
  flightModeLabel as g,
  droneStatusLabel as h,
  initialTools as i,
  HELP as j,
  useTelemetry as k,
  initialMissions as l,
  missionTemplates as m,
  initialDetections as n,
  currentWeather as o,
  detectedObjectLabel as p,
  router as r,
  useOps as u
};
