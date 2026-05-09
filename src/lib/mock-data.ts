// Симуляция данных для дашборда COBA AI Drone

import { useEffect, useState } from "react";

// ================== ТЕЛЕМЕТРИЯ ==================

export interface TelemetryPoint {
  time: string;
  altitude: number;
  altitudeTarget: number;
  speed: number;
  speedVertical: number;
  battery: number;
  temperature: number;
  signal: number;
}

const seed = (offset: number, droneSeed = 0) => {
  const t = Date.now() / 1000 + offset + droneSeed * 11;
  return {
    altitude: 30 + Math.sin(t / 5) * 8 + Math.random() * 2,
    altitudeTarget: 35,
    speed: 6 + Math.sin(t / 3) * 2 + Math.random(),
    speedVertical: Math.sin(t / 4) * 1.5,
    battery: Math.max(15, 78 - (Date.now() % 600000) / 12000 + droneSeed * 4),
    temperature: 42 + Math.sin(t / 7) * 4 + Math.random(),
    signal: 78 + Math.sin(t / 4) * 10 + Math.random() * 4,
  };
};

const initialHistory = (droneSeed = 0): TelemetryPoint[] => {
  const points: TelemetryPoint[] = [];
  for (let i = 30; i >= 0; i--) {
    const v = seed(-i, droneSeed);
    const d = new Date(Date.now() - i * 2000);
    points.push({
      time: `${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`,
      altitude: Math.round(v.altitude * 10) / 10,
      altitudeTarget: v.altitudeTarget,
      speed: Math.round(v.speed * 10) / 10,
      speedVertical: Math.round(v.speedVertical * 10) / 10,
      battery: Math.round(v.battery),
      temperature: Math.round(v.temperature * 10) / 10,
      signal: Math.round(v.signal),
    });
  }
  return points;
};

export function useTelemetry(intervalMs = 2000, droneSeed = 0) {
  const [history, setHistory] = useState<TelemetryPoint[]>(() => initialHistory(droneSeed));

  // reset history when drone changes
  useEffect(() => {
    setHistory(initialHistory(droneSeed));
  }, [droneSeed]);

  useEffect(() => {
    const id = setInterval(() => {
      setHistory((prev) => {
        const v = seed(0, droneSeed);
        const d = new Date();
        const next: TelemetryPoint = {
          time: `${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`,
          altitude: Math.round(v.altitude * 10) / 10,
          altitudeTarget: v.altitudeTarget,
          speed: Math.round(v.speed * 10) / 10,
          speedVertical: Math.round(v.speedVertical * 10) / 10,
          battery: Math.round(v.battery),
          temperature: Math.round(v.temperature * 10) / 10,
          signal: Math.round(v.signal),
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

// ================== МИССИИ ==================

export type MissionType =
  | "patrol" | "search" | "delivery" | "survey" | "mapping" | "tracking" | "emergency" | "test" | "inspection";
export type MissionStatus = "pending" | "running" | "completed" | "failed" | "paused";

export interface Waypoint {
  lat: number;
  lng: number;
  altitude: number;
  speed: number;
  action?: "hover" | "photo" | "drop" | "scan";
  hold?: number; // секунды
}

export interface Mission {
  id: string;
  name: string;
  type: MissionType;
  status: MissionStatus;
  waypoints: Waypoint[];
  distance: number;
  duration: number;
  progress: number;
  createdAt: string;
  droneId?: string;
  droneIds?: string[]; // несколько дронов для совместного выполнения
  schedule?: string;
  directives?: string; // условности миссии — текстовые инструкции для ИИ
  priority?: "low" | "normal" | "high" | "critical";
}

export const missionTypeLabel: Record<MissionType, string> = {
  patrol: "Патрулирование",
  search: "Поиск",
  delivery: "Доставка",
  survey: "Обследование",
  mapping: "Картография",
  tracking: "Сопровождение",
  emergency: "ЧС",
  test: "Тест",
  inspection: "Инспекция",
};

export const missionStatusLabel: Record<MissionStatus, string> = {
  pending: "В ожидании",
  running: "Выполняется",
  completed: "Завершена",
  failed: "Сбой",
  paused: "Пауза",
};

// Базовая точка карты — центр Москвы
export const MAP_CENTER: [number, number] = [55.7558, 37.6173];

const wp = (lat: number, lng: number, altitude = 30, speed = 6, action?: Waypoint["action"]): Waypoint => ({
  lat, lng, altitude, speed, action,
});

export const initialMissions: Mission[] = [
  {
    id: "MIS-001",
    name: "Патруль периметра №7",
    type: "patrol",
    status: "running",
    waypoints: [
      wp(55.7558, 37.6173, 30, 7),
      wp(55.7575, 37.6195, 35, 7, "scan"),
      wp(55.7590, 37.6220, 35, 7, "scan"),
      wp(55.7585, 37.6260, 30, 7, "photo"),
      wp(55.7558, 37.6280, 30, 7),
      wp(55.7530, 37.6260, 30, 7),
      wp(55.7520, 37.6220, 35, 7, "scan"),
      wp(55.7530, 37.6195, 30, 7),
      wp(55.7558, 37.6173, 30, 5),
    ],
    distance: 4.2,
    duration: 18,
    progress: 64,
    createdAt: "2025-04-19 08:14",
    droneId: "DR-001",
    droneIds: ["DR-001", "DR-002"],
    priority: "high",
    directives: "Сохраняй малую высоту над лесополосой, избегай засвета окон. При обнаружении человека — зависни на 10с и сделай 3 фото с разных ракурсов.",
  },
  {
    id: "MIS-002",
    name: "Доставка к точке Альфа",
    type: "delivery",
    status: "pending",
    waypoints: [
      wp(55.7558, 37.6173, 25, 8),
      wp(55.7600, 37.6100, 40, 10),
      wp(55.7650, 37.6000, 40, 10),
      wp(55.7680, 37.5950, 20, 5, "drop"),
    ],
    distance: 2.1,
    duration: 9,
    progress: 0,
    createdAt: "2025-04-19 09:02",
    priority: "critical",
    directives: "Лети как можно быстрее, не жалей батарею. Главное — доставить аптечку до 09:30. По прибытии сразу RTL.",
  },
  {
    id: "MIS-003",
    name: "Картография зоны Б-3",
    type: "mapping",
    status: "completed",
    waypoints: Array.from({ length: 24 }, (_, i) => {
      const row = Math.floor(i / 6);
      const col = i % 6;
      return wp(55.7500 + row * 0.002, 37.6100 + col * 0.003, 60, 8, "photo");
    }),
    distance: 8.7,
    duration: 41,
    progress: 100,
    createdAt: "2025-04-18 15:22",
  },
  {
    id: "MIS-004",
    name: "Поисковая операция К-12",
    type: "search",
    status: "paused",
    waypoints: [
      wp(55.7612, 37.6094, 50, 6, "scan"),
      wp(55.7620, 37.6050, 50, 6, "scan"),
      wp(55.7600, 37.6020, 50, 6, "scan"),
      wp(55.7580, 37.6050, 50, 6, "scan"),
    ],
    distance: 6.4,
    duration: 28,
    progress: 32,
    createdAt: "2025-04-19 07:45",
    droneId: "DR-004",
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
    createdAt: "2025-04-18 11:08",
  },
];

// Шаблоны миссий
export interface MissionTemplate {
  id: string;
  name: string;
  type: MissionType;
  description: string;
  defaultAltitude: number;
  defaultSpeed: number;
  recommendedDrone: string;
}

export const missionTemplates: MissionTemplate[] = [
  { id: "tpl-1", name: "Патрулирование периметра", type: "patrol", description: "Облёт по замкнутому контуру с автоматическим сканированием", defaultAltitude: 35, defaultSpeed: 7, recommendedDrone: "COBA-Alpha" },
  { id: "tpl-2", name: "Поиск в лесу", type: "search", description: "Сетка поиска с тепловизором и распознаванием объектов", defaultAltitude: 50, defaultSpeed: 6, recommendedDrone: "COBA-Bravo" },
  { id: "tpl-3", name: "Инспекция крыши", type: "inspection", description: "Облёт здания с фотофиксацией дефектов кровли", defaultAltitude: 15, defaultSpeed: 3, recommendedDrone: "COBA-Foxtrot" },
  { id: "tpl-4", name: "Доставка груза", type: "delivery", description: "Прямой маршрут до точки сброса с возвратом", defaultAltitude: 40, defaultSpeed: 10, recommendedDrone: "COBA-Delta" },
  { id: "tpl-5", name: "Картография зоны", type: "mapping", description: "Сетка съёмки с перекрытием 80% для построения ортофотоплана", defaultAltitude: 60, defaultSpeed: 8, recommendedDrone: "COBA-Bravo" },
  { id: "tpl-6", name: "Сопровождение объекта", type: "tracking", description: "Автоматическое следование за движущейся целью", defaultAltitude: 30, defaultSpeed: 12, recommendedDrone: "COBA-Alpha" },
];

// ================== ИНСТРУМЕНТЫ ==================

export interface Tool {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: string;
  status: "ok" | "warning" | "error";
}

export const initialTools: Tool[] = [
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
  { id: "t13", name: "Видеообработка H.264", description: "Кодирование и трансляция видео", enabled: true, category: "Камера", status: "ok" },
];

// ================== ФЛОТ ==================

export type DroneStatus = "online" | "offline" | "mission" | "charging" | "maintenance";
export type FlightMode = "MANUAL" | "AUTO" | "RTL" | "LOITER" | "EMERGENCY" | "STANDBY";

export interface MotorState {
  rpm: number;
  temperature: number;
  load: number;
}

export interface SensorState {
  gps: "ok" | "weak" | "off";
  camera: "ok" | "off";
  thermal: "ok" | "off" | "missing";
  lidar: "ok" | "off" | "missing";
  imu: "ok" | "calibrating" | "error";
}

export interface FleetDrone {
  id: string;
  name: string;
  status: DroneStatus;
  battery: number;
  signal: number;
  location: string;
  position: [number, number]; // lat, lng
  heading: number; // 0-360 градусов
  mission?: string;
  mode: FlightMode;
  motors: MotorState[]; // 4 мотора
  sensors: SensorState;
  flightTimeRemaining: number; // минут
  group?: string;
}

const motors = (avgTemp: number, load: number): MotorState[] =>
  Array.from({ length: 4 }, (_, i) => ({
    rpm: 5800 + Math.round(Math.random() * 400) + i * 30,
    temperature: avgTemp + (Math.random() - 0.5) * 4,
    load,
  }));

export const initialFleet: FleetDrone[] = [
  {
    id: "DR-001", name: "COBA-Alpha", status: "mission", battery: 64, signal: 89,
    location: "55.7558° N, 37.6173° E", position: [55.7575, 37.6195], heading: 45,
    mission: "MIS-001", mode: "AUTO",
    motors: motors(48, 72),
    sensors: { gps: "ok", camera: "ok", thermal: "ok", lidar: "ok", imu: "ok" },
    flightTimeRemaining: 14, group: "Альфа",
  },
  {
    id: "DR-002", name: "COBA-Bravo", status: "online", battery: 92, signal: 95,
    location: "База 1", position: [55.7500, 37.6100], heading: 0,
    mode: "STANDBY",
    motors: motors(28, 0),
    sensors: { gps: "ok", camera: "ok", thermal: "ok", lidar: "ok", imu: "ok" },
    flightTimeRemaining: 28, group: "Альфа",
  },
  {
    id: "DR-003", name: "COBA-Charlie", status: "charging", battery: 38, signal: 0,
    location: "База 1", position: [55.7500, 37.6100], heading: 0,
    mode: "STANDBY",
    motors: motors(24, 0),
    sensors: { gps: "weak", camera: "ok", thermal: "missing", lidar: "ok", imu: "ok" },
    flightTimeRemaining: 0, group: "Альфа",
  },
  {
    id: "DR-004", name: "COBA-Delta", status: "mission", battery: 71, signal: 82,
    location: "55.7612° N, 37.6094° E", position: [55.7612, 37.6094], heading: 130,
    mission: "MIS-004", mode: "AUTO",
    motors: motors(46, 68),
    sensors: { gps: "ok", camera: "ok", thermal: "ok", lidar: "off", imu: "ok" },
    flightTimeRemaining: 17, group: "Браво",
  },
  {
    id: "DR-005", name: "COBA-Echo", status: "maintenance", battery: 0, signal: 0,
    location: "Сервис", position: [55.7400, 37.6500], heading: 0,
    mode: "STANDBY",
    motors: motors(22, 0),
    sensors: { gps: "off", camera: "off", thermal: "off", lidar: "off", imu: "error" },
    flightTimeRemaining: 0, group: "Браво",
  },
  {
    id: "DR-006", name: "COBA-Foxtrot", status: "online", battery: 100, signal: 96,
    location: "База 2", position: [55.7700, 37.6300], heading: 0,
    mode: "STANDBY",
    motors: motors(26, 0),
    sensors: { gps: "ok", camera: "ok", thermal: "ok", lidar: "ok", imu: "ok" },
    flightTimeRemaining: 32, group: "Чарли",
  },
];

export const droneStatusLabel: Record<DroneStatus, string> = {
  online: "Онлайн",
  offline: "Офлайн",
  mission: "В миссии",
  charging: "Зарядка",
  maintenance: "Обслуживание",
};

export const flightModeLabel: Record<FlightMode, string> = {
  MANUAL: "Ручной",
  AUTO: "Автоматический",
  RTL: "Возврат домой",
  LOITER: "Удержание",
  EMERGENCY: "Аварийный",
  STANDBY: "Ожидание",
};

// ================== ОБНАРУЖЕННЫЕ ОБЪЕКТЫ ==================

export type DetectedObjectType = "person" | "vehicle" | "fire" | "animal" | "anomaly";

export interface DetectedObject {
  id: string;
  type: DetectedObjectType;
  position: [number, number];
  detectedAt: string;
  detectedBy: string; // drone id
  confidence: number;
  description: string;
  imageUrl?: string;
}

export const detectedObjectLabel: Record<DetectedObjectType, string> = {
  person: "Человек",
  vehicle: "Автомобиль",
  fire: "Возгорание",
  animal: "Животное",
  anomaly: "Аномалия",
};

export const initialDetections: DetectedObject[] = [
  { id: "obj-1", type: "person", position: [55.7585, 37.6210], detectedAt: "10:38:42", detectedBy: "DR-001", confidence: 92, description: "Один человек, движется на восток вдоль ограждения" },
  { id: "obj-2", type: "vehicle", position: [55.7540, 37.6240], detectedAt: "10:36:11", detectedBy: "DR-001", confidence: 88, description: "Грузовой автомобиль, припаркован у въезда" },
  { id: "obj-3", type: "fire", position: [55.7615, 37.6075], detectedAt: "10:34:55", detectedBy: "DR-004", confidence: 76, description: "Тепловая аномалия 320°C, требуется проверка" },
  { id: "obj-4", type: "animal", position: [55.7595, 37.6260], detectedAt: "10:32:18", detectedBy: "DR-001", confidence: 81, description: "Группа из 3 особей, предположительно собаки" },
];

// Геозоны
export interface GeoZone {
  id: string;
  name: string;
  type: "allowed" | "restricted" | "warning";
  polygon: [number, number][];
}

export const initialGeoZones: GeoZone[] = [
  {
    id: "gz-1", name: "Рабочая зона A", type: "allowed",
    polygon: [[55.7500, 37.6100], [55.7700, 37.6100], [55.7700, 37.6300], [55.7500, 37.6300]],
  },
  {
    id: "gz-2", name: "Запретная зона (аэродром)", type: "restricted",
    polygon: [[55.7660, 37.6350], [55.7720, 37.6350], [55.7720, 37.6450], [55.7660, 37.6450]],
  },
  {
    id: "gz-3", name: "Школа · ограничение высоты 30м", type: "warning",
    polygon: [[55.7530, 37.6230], [55.7560, 37.6230], [55.7560, 37.6280], [55.7530, 37.6280]],
  },
];

// ================== ЖУРНАЛ ==================

export interface EventLog {
  id: string;
  timestamp: string;
  level: "info" | "warning" | "error" | "success";
  source: string;
  message: string;
}

export const initialEvents: EventLog[] = [
  { id: "e1", timestamp: "10:42:18", level: "success", source: "Mission", message: "Миссия MIS-003 успешно завершена" },
  { id: "e2", timestamp: "10:41:02", level: "info", source: "Telemetry", message: "Связь восстановлена с DR-001" },
  { id: "e3", timestamp: "10:39:54", level: "warning", source: "Battery", message: "DR-003: уровень заряда 38%, рекомендуется зарядка" },
  { id: "e4", timestamp: "10:38:11", level: "info", source: "Mission", message: "Запуск миссии MIS-001 (Патруль периметра №7)" },
  { id: "e5", timestamp: "10:35:47", level: "error", source: "Sensor", message: "DR-005: ошибка GPS-модуля, требуется обслуживание" },
  { id: "e6", timestamp: "10:32:09", level: "info", source: "AI", message: "DQN модель обучена за 1240 шагов, reward = 0.89" },
  { id: "e7", timestamp: "10:30:00", level: "success", source: "System", message: "Резервная копия создана: backup_20250419.zip" },
  { id: "e8", timestamp: "10:28:33", level: "warning", source: "Weather", message: "Скорость ветра 9 м/с — близко к лимиту" },
  { id: "e9", timestamp: "10:25:14", level: "info", source: "Fleet", message: "DR-006 готов к вылету" },
  { id: "e10", timestamp: "10:22:01", level: "info", source: "System", message: "Система запущена, все модули в норме" },
];

// ================== БЭКАПЫ ==================

export interface Backup {
  id: string;
  name: string;
  size: string;
  type: "auto" | "manual";
  createdAt: string;
}

export const initialBackups: Backup[] = [
  { id: "b1", name: "backup_20250419_full", size: "248 МБ", type: "auto", createdAt: "2025-04-19 06:00" },
  { id: "b2", name: "backup_20250418_full", size: "241 МБ", type: "auto", createdAt: "2025-04-18 06:00" },
  { id: "b3", name: "backup_20250418_pre-update", size: "239 МБ", type: "manual", createdAt: "2025-04-18 14:32" },
  { id: "b4", name: "backup_20250417_full", size: "236 МБ", type: "auto", createdAt: "2025-04-17 06:00" },
  { id: "b5", name: "backup_20250416_full", size: "232 МБ", type: "auto", createdAt: "2025-04-16 06:00" },
];

// ================== ПОГОДА ==================

export interface Weather {
  windSpeed: number; // м/с
  windDirection: string;
  temperature: number; // °C
  visibility: number; // км
  pressure: number; // мм рт.ст.
  humidity: number; // %
  condition: "clear" | "cloudy" | "rain" | "fog";
}

export const currentWeather: Weather = {
  windSpeed: 7,
  windDirection: "СЗ",
  temperature: 12,
  visibility: 10,
  pressure: 756,
  humidity: 58,
  condition: "clear",
};
