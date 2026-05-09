// Расширенный справочник инструментов COBA AI.
// Дополняет initialTools[] детальными описаниями, функциями, входами/выходами и параметрами,
// чтобы дашборд отражал весь функционал, описанный в коде системы.

export interface ToolParameter {
  key: string;
  label: string;
  kind: "range" | "select" | "toggle" | "text";
  min?: number;
  max?: number;
  step?: number;
  default: number | string | boolean;
  options?: string[];
  unit?: string;
  hint?: string;
}

export interface ToolFunctionSpec {
  name: string;       // имя функции/метода в коде
  signature: string;  // сигнатура для отображения
  description: string;
}

export interface ToolDetails {
  id: string;            // совпадает с initialTools[].id
  longDescription: string;
  role: string;
  inputs: string[];
  outputs: string[];
  dependencies: string[]; // сенсоры/каналы/модули
  modes: string[];
  functions: ToolFunctionSpec[];
  parameters: ToolParameter[];
  example: string;
  metrics: { label: string; value: string }[];
}

export const toolsCatalog: Record<string, ToolDetails> = {
  t1: {
    id: "t1",
    longDescription:
      "Планировщик траектории строит оптимальный полётный маршрут между точками миссии с учётом препятствий, геозон, ветра и остатка батареи. Использует A* по 3D-сетке и сглаживание B-сплайнами.",
    role: "Преобразует список waypoints в исполнимую траекторию для PID-контроллера.",
    inputs: ["Waypoints миссии", "GeoZones (запретные/предупреждение)", "Карта препятствий от LiDAR", "Прогноз ветра"],
    outputs: ["Сглаженная траектория (lat,lng,alt,vx,vy,vz)", "Оценка длительности и расхода батареи"],
    dependencies: ["GPS", "IMU", "LiDAR/Depth", "Weather feed"],
    modes: ["Стандарт", "Энергоэффективный", "Скоростной", "Скрытный (low-altitude)"],
    functions: [
      { name: "planRoute", signature: "planRoute(waypoints, constraints) -> Trajectory", description: "Главный планировщик A* + B-spline." },
      { name: "avoidObstacle", signature: "avoidObstacle(point, radius) -> Detour", description: "Локальный объезд препятствия по облаку точек." },
      { name: "estimateBattery", signature: "estimateBattery(trajectory, wind) -> %", description: "Прогноз остаточного заряда после миссии." },
      { name: "snapToCorridor", signature: "snapToCorridor(traj, geoZones) -> Trajectory", description: "Подгонка траектории под коридор разрешённых зон." },
    ],
    parameters: [
      { key: "safetyMargin", label: "Запас по препятствиям", kind: "range", min: 1, max: 10, default: 3, step: 0.5, unit: "м" },
      { key: "smoothing", label: "Сглаживание B-spline", kind: "range", min: 0, max: 100, default: 65, unit: "%" },
      { key: "mode", label: "Режим планирования", kind: "select", options: ["Стандарт", "Энергоэффективный", "Скоростной", "Скрытный"], default: "Стандарт" },
      { key: "respectWind", label: "Учитывать ветер", kind: "toggle", default: true },
    ],
    example: "Перед миссией патруля периметра №7 планировщик уплотнил маршрут с учётом запретной зоны аэродрома и сократил расход батареи на 11%.",
    metrics: [
      { label: "Среднее время расчёта", value: "240 мс" },
      { label: "Точность построения", value: "± 0.6 м" },
    ],
  },
  t2: {
    id: "t2",
    longDescription:
      "Детекция объектов на видеопотоке: YOLOv5n с дообучением на классы person/vehicle/fire/animal/anomaly. Работает на edge-GPU дрона, передаёт только метаданные и кропы.",
    role: "Источник DetectedObject[] для журнала, миссий и протоколов реагирования.",
    inputs: ["RGB-кадры 1920×1080@30", "Тепловизионные кадры (опц.)"],
    outputs: ["DetectedObject{type, position, confidence, box}", "Кроп объекта 256×256"],
    dependencies: ["Camera", "Thermal", "GPS (геопривязка)"],
    modes: ["Только люди", "Авто (все классы)", "Тепловой приоритет", "Ночной режим"],
    functions: [
      { name: "detect", signature: "detect(frame) -> DetectedObject[]", description: "Один проход YOLO по кадру." },
      { name: "track", signature: "track(objectId, frame) -> Box", description: "ByteTrack-сопровождение между кадрами." },
      { name: "classifyThermal", signature: "classifyThermal(thermalFrame) -> Heatmap", description: "Классификация тепловых аномалий (fire/human)." },
      { name: "approveDetection", signature: "approveDetection(obj) -> void", description: "Запись подтверждённого обнаружения в журнал." },
    ],
    parameters: [
      { key: "confidence", label: "Порог уверенности", kind: "range", min: 40, max: 95, default: 75, unit: "%" },
      { key: "minSize", label: "Мин. размер объекта", kind: "range", min: 20, max: 200, default: 50, unit: "px" },
      { key: "classes", label: "Классы", kind: "select", options: ["Все", "Люди", "Транспорт", "Огонь", "Аномалии"], default: "Все" },
      { key: "autoApproach", label: "Авто-приближение к объекту", kind: "toggle", default: true },
      { key: "triplePhoto", label: "Серия из 3 фото", kind: "toggle", default: true },
      { key: "notifyOperator", label: "Уведомлять оператора", kind: "toggle", default: false },
    ],
    example: "DR-001 обнаружил человека на confidence 92% — миссия зависла на 10с и сделала 3 фото согласно директивам.",
    metrics: [
      { label: "FPS на дроне", value: "22" },
      { label: "mAP@0.5", value: "0.81" },
    ],
  },
  t3: {
    id: "t3",
    longDescription:
      "Система навигации сливает GPS/ГЛОНАСС/Galileo, IMU и баровысотомер через EKF. Поддерживает RTK через базовую станцию для точности до 2 см.",
    role: "Поставщик позиции (lat, lng, alt, heading, vel) для всех подсистем.",
    inputs: ["GNSS (L1/L2)", "IMU 200 Гц", "Барометр", "RTK-коррекции (опц.)"],
    outputs: ["Position", "Velocity", "Heading", "FixQuality"],
    dependencies: ["GPS-приёмник", "IMU", "Барометр"],
    modes: ["Стандарт", "RTK", "Inertial-only (GNSS-denied)", "Visual-Inertial"],
    functions: [
      { name: "getPosition", signature: "getPosition() -> Position", description: "Текущая позиция с метой времени." },
      { name: "setHomePoint", signature: "setHomePoint(lat,lng,alt) -> void", description: "Установка точки возврата RTL." },
      { name: "calibrateIMU", signature: "calibrateIMU() -> Promise<void>", description: "Запуск калибровки IMU на земле." },
      { name: "enableRTK", signature: "enableRTK(baseUrl) -> void", description: "Подключение к NTRIP-кастеру." },
    ],
    parameters: [
      { key: "minSats", label: "Мин. число спутников", kind: "range", min: 4, max: 20, default: 8 },
      { key: "ekfStrictness", label: "Строгость EKF", kind: "range", min: 1, max: 10, default: 6 },
      { key: "rtkEnabled", label: "RTK-коррекции", kind: "toggle", default: false },
      { key: "homeOnArm", label: "Точка дома при ARM", kind: "toggle", default: true },
    ],
    example: "После взлёта DR-002 захватил 14 спутников и получил 3D-fix за 6 секунд.",
    metrics: [
      { label: "Точность Standalone", value: "± 1.5 м" },
      { label: "Точность RTK-fix", value: "± 0.02 м" },
    ],
  },
  t4: {
    id: "t4",
    longDescription:
      "PID-контроллер положения и скорости. Каскадная схема: позиция → скорость → угол → угловая скорость → ШИМ моторов.",
    role: "Низкоуровневое управление, исполняющее траекторию от планировщика.",
    inputs: ["Целевая точка/скорость", "Текущее состояние от EKF"],
    outputs: ["ШИМ-сигналы 4 моторов"],
    dependencies: ["IMU", "Моторы", "ESC"],
    modes: ["AUTO", "MANUAL", "LOITER", "ALT-HOLD", "ACRO"],
    functions: [
      { name: "tunePID", signature: "tunePID(axis, kp, ki, kd) -> void", description: "Подстройка коэффициентов оси." },
      { name: "autoTune", signature: "autoTune() -> Promise<PIDSet>", description: "Автотюнинг в полёте 60-90с." },
      { name: "setMode", signature: "setMode(FlightMode) -> void", description: "Смена режима полёта." },
    ],
    parameters: [
      { key: "rollKp", label: "Roll Kp", kind: "range", min: 0.1, max: 5, default: 1.4, step: 0.1 },
      { key: "pitchKp", label: "Pitch Kp", kind: "range", min: 0.1, max: 5, default: 1.4, step: 0.1 },
      { key: "yawKp", label: "Yaw Kp", kind: "range", min: 0.1, max: 5, default: 0.8, step: 0.1 },
      { key: "altKp", label: "Alt Kp", kind: "range", min: 0.1, max: 5, default: 1.2, step: 0.1 },
    ],
    example: "После автотюна гашение колебаний по yaw улучшилось на 28%.",
    metrics: [
      { label: "Цикл управления", value: "400 Гц" },
      { label: "Задержка до моторов", value: "1.8 мс" },
    ],
  },
  t5: {
    id: "t5",
    longDescription:
      "MAVLink v2 поверх UDP/TCP/Serial. Реализованы heartbeat, command_long, mission upload/download, param protocol, file transfer.",
    role: "Канал команд и телеметрии между дроном и наземной станцией (GCS).",
    inputs: ["MAVLink-пакеты от GCS"],
    outputs: ["Heartbeat 1Гц", "Telemetry stream", "ACK"],
    dependencies: ["Wi-Fi/Radio/LTE uplink"],
    modes: ["UDP", "TCP", "Serial", "Mesh-relay"],
    functions: [
      { name: "sendCommand", signature: "sendCommand(cmd, params) -> ACK", description: "Отправка command_long." },
      { name: "uploadMission", signature: "uploadMission(waypoints) -> void", description: "Запись миссии в дрон." },
      { name: "subscribeTelemetry", signature: "subscribeTelemetry(rate) -> Stream", description: "Подписка на поток телеметрии." },
    ],
    parameters: [
      { key: "systemId", label: "System ID", kind: "range", min: 1, max: 250, default: 1 },
      { key: "componentId", label: "Component ID", kind: "range", min: 1, max: 250, default: 1 },
      { key: "telemetryRate", label: "Частота телеметрии", kind: "range", min: 1, max: 50, default: 10, unit: "Гц" },
      { key: "transport", label: "Транспорт", kind: "select", options: ["UDP", "TCP", "Serial"], default: "UDP" },
    ],
    example: "При потере Wi-Fi MAVLink автоматически переключается на mesh-relay через DR-002.",
    metrics: [
      { label: "Поддерживаемые сообщения", value: "180+" },
      { label: "Размер heartbeat", value: "9 байт" },
    ],
  },
  t6: {
    id: "t6",
    longDescription:
      "Расширенный фильтр Калмана (EKF24): 24-state vector — поза, скорость, гироскоп-bias, акселерометр-bias, магнитное поле, ветер.",
    role: "Слияние всех сенсоров в единое непротиворечивое состояние.",
    inputs: ["GNSS", "IMU", "Mag", "Baro", "Optical flow", "LiDAR"],
    outputs: ["State vector x[24]", "Covariance P[24×24]"],
    dependencies: ["Все навигационные сенсоры"],
    modes: ["Полный (24)", "Лёгкий (16)", "Vision-only"],
    functions: [
      { name: "predict", signature: "predict(dt) -> void", description: "Предсказание состояния по модели IMU." },
      { name: "update", signature: "update(measurement) -> void", description: "Коррекция по измерению (GPS/Mag/Baro)." },
      { name: "resetBias", signature: "resetBias() -> void", description: "Сброс bias гироскопа на земле." },
    ],
    parameters: [
      { key: "imuRate", label: "Частота IMU", kind: "range", min: 100, max: 1000, default: 200, unit: "Гц" },
      { key: "gpsNoise", label: "GPS шум", kind: "range", min: 0.5, max: 5, default: 1.5, step: 0.1, unit: "м" },
      { key: "magWeight", label: "Вес магнитометра", kind: "range", min: 0, max: 100, default: 60, unit: "%" },
    ],
    example: "На участке с GPS-шумом EKF удержал позицию по optical flow и LiDAR с дрейфом < 0.4 м/мин.",
    metrics: [
      { label: "Размер вектора состояния", value: "24" },
      { label: "Частота обновления", value: "200 Гц" },
    ],
  },
  t7: {
    id: "t7",
    longDescription:
      "Глубокое Q-обучение (DQN) с приоритезированным replay-buffer и dueling-архитектурой. Среда — симулятор (AirSim/Gazebo/PyBullet) с переносом политики на реальный дрон.",
    role: "Адаптация поведения дрона под новые сценарии без ручного программирования.",
    inputs: ["Состояние среды (62-dim)", "Награда (reward)"],
    outputs: ["Action ∈ {hover,forward,turn,climb,descend}", "Q-values"],
    dependencies: ["Симулятор", "GPU edge", "Replay buffer"],
    modes: ["Training", "Replay миссии", "Sim-to-real fine-tune", "Evaluation"],
    functions: [
      { name: "selectAction", signature: "selectAction(state, ε) -> Action", description: "ε-greedy выбор действия." },
      { name: "storeTransition", signature: "storeTransition(s,a,r,s') -> void", description: "Запись в replay buffer." },
      { name: "trainStep", signature: "trainStep(batch) -> loss", description: "Шаг градиентного спуска." },
      { name: "exportPolicy", signature: "exportPolicy() -> .onnx", description: "Экспорт обученной политики." },
    ],
    parameters: [
      { key: "lr", label: "Learning rate", kind: "range", min: 0.00001, max: 0.01, default: 0.0003, step: 0.00001 },
      { key: "gamma", label: "Discount γ", kind: "range", min: 0.8, max: 0.999, default: 0.99, step: 0.001 },
      { key: "epsilon", label: "ε (exploration)", kind: "range", min: 0.01, max: 1, default: 0.12, step: 0.01 },
      { key: "batchSize", label: "Batch size", kind: "select", options: ["32", "64", "128", "256"], default: "64" },
      { key: "replaySize", label: "Replay buffer", kind: "select", options: ["10000", "50000", "100000", "500000"], default: "100000" },
    ],
    example: "После 1240 эпизодов в Лесном поиске reward вырос с 0.31 до 0.89, политика применена к DR-001.",
    metrics: [
      { label: "Параметров сети", value: "1.2M" },
      { label: "Inference на дроне", value: "4 мс" },
    ],
  },
  t8: {
    id: "t8",
    longDescription:
      "Логирование всех данных полёта: телеметрия, события, видео-теги, MAVLink-трафик. Сжатие и автоматическая отправка в архив.",
    role: "Источник данных для разбора миссий, обучения и судебной экспертизы.",
    inputs: ["TelemetryPoint stream", "EventLog", "Video timestamps"],
    outputs: ["CSV/Parquet/JSON логи", "Бэкап-архив"],
    dependencies: ["Все подсистемы"],
    modes: ["Compact (1Гц)", "Full (10Гц)", "Forensic (50Гц)"],
    functions: [
      { name: "startSession", signature: "startSession(missionId) -> SessionId", description: "Открыть новую лог-сессию." },
      { name: "log", signature: "log(channel, payload) -> void", description: "Запись точки в указанный канал." },
      { name: "exportCSV", signature: "exportCSV(sessionId) -> File", description: "Выгрузка лога в CSV." },
      { name: "rotate", signature: "rotate(maxSizeMB) -> void", description: "Ротация файла по размеру." },
    ],
    parameters: [
      { key: "rate", label: "Частота записи", kind: "range", min: 1, max: 50, default: 10, unit: "Гц" },
      { key: "compress", label: "Сжатие zstd", kind: "toggle", default: true },
      { key: "format", label: "Формат", kind: "select", options: ["CSV", "Parquet", "JSON"], default: "CSV" },
    ],
    example: "За миссию MIS-003 записано 41 МБ логов, ротация выполнена 2 раза.",
    metrics: [
      { label: "Каналы", value: "32" },
      { label: "Сжатие", value: "~7.2x" },
    ],
  },
  t9: {
    id: "t9",
    longDescription:
      "Физический симулятор PyBullet/Bullet для предполётной проверки траектории и обучения DQN. Поддерживает аэродинамику, ветер, столкновения.",
    role: "Безопасный stage для прогона миссий и алгоритмов до реального вылета.",
    inputs: ["URDF дрона", "Сцена (мир, препятствия)", "Полётная миссия"],
    outputs: ["Симулированная телеметрия", "Видео-рендер"],
    dependencies: ["GPU (опц.)", "PyBullet >=3.2"],
    modes: ["Headless", "GUI", "Realtime", "Fast (×8)"],
    functions: [
      { name: "loadScene", signature: "loadScene(urdf) -> SceneId", description: "Загрузка мира и дрона." },
      { name: "step", signature: "step(action) -> State", description: "Шаг симуляции 1/240с." },
      { name: "applyWind", signature: "applyWind(vx,vy,vz) -> void", description: "Включить ветер." },
      { name: "render", signature: "render(camera) -> Frame", description: "Рендер кадра с виртуальной камеры." },
    ],
    parameters: [
      { key: "speed", label: "Множитель скорости", kind: "range", min: 0.1, max: 10, default: 1, step: 0.1 },
      { key: "wind", label: "Ветер", kind: "range", min: 0, max: 20, default: 6, unit: "м/с" },
      { key: "gravity", label: "Гравитация", kind: "range", min: 1, max: 12, default: 9.81, step: 0.01 },
      { key: "headless", label: "Headless режим", kind: "toggle", default: true },
    ],
    example: "Перед MIS-002 в симуляторе откатали 50 эпизодов доставки — ни одного столкновения.",
    metrics: [
      { label: "Частота физики", value: "240 Гц" },
      { label: "Параллельных сред", value: "до 32" },
    ],
  },
  t10: {
    id: "t10",
    longDescription:
      "Координатор роя распределяет миссии между несколькими дронами, синхронизирует их во времени и пространстве, разрешает конфликты маршрутов.",
    role: "Превращает группу одиночных дронов в единую исполнительную единицу.",
    inputs: ["Список доступных дронов", "Совместная миссия", "Mesh-сеть"],
    outputs: ["Назначения droneId → waypoints", "Слот-расписание"],
    dependencies: ["Mesh", "MAVLink", "Планировщик"],
    modes: ["Master-slave", "Consensus (Raft)", "Auction-based"],
    functions: [
      { name: "assign", signature: "assign(missions, drones) -> Plan", description: "Распределение миссий по дронам." },
      { name: "rebalance", signature: "rebalance() -> void", description: "Перераспределение при сбое узла." },
      { name: "synchronize", signature: "synchronize(checkpoint) -> void", description: "Синхронизация всех узлов в точке." },
    ],
    parameters: [
      { key: "minDrones", label: "Мин. дронов в рое", kind: "range", min: 2, max: 10, default: 2 },
      { key: "spacing", label: "Дистанция между дронами", kind: "range", min: 5, max: 100, default: 25, unit: "м" },
      { key: "strategy", label: "Стратегия", kind: "select", options: ["Master-slave", "Consensus", "Auction"], default: "Auction" },
    ],
    example: "На MIS-001 заданы DR-001 и DR-002 — координатор разделил периметр на 2 дуги, синхронизировал старт.",
    metrics: [
      { label: "Макс. размер роя", value: "32" },
      { label: "Время перепланирования", value: "< 800 мс" },
    ],
  },
  t11: {
    id: "t11",
    longDescription:
      "Обработка чрезвычайных ситуаций: критическая батарея, потеря связи, отказ мотора, нарушение геозоны. Автоматически выбирает протокол и исполняет.",
    role: "Последняя линия защиты — гарантирует безопасное завершение полёта.",
    inputs: ["Триггеры событий", "Состояние дрона", "Геозоны"],
    outputs: ["Команды RTL/LAND/EMERGENCY", "Уведомления"],
    dependencies: ["EKF", "Связь", "PID"],
    modes: ["Strict (мгновенно)", "Soft (с задержкой)", "Operator-confirm"],
    functions: [
      { name: "trigger", signature: "trigger(event, severity) -> Protocol", description: "Запуск протокола по триггеру." },
      { name: "abort", signature: "abort() -> void", description: "Прерывание текущего протокола оператором." },
      { name: "registerProtocol", signature: "registerProtocol(proto) -> void", description: "Регистрация пользовательского протокола." },
    ],
    parameters: [
      { key: "lowBatteryRTL", label: "RTL при батарее <", kind: "range", min: 10, max: 40, default: 22, unit: "%" },
      { key: "linkLostTimeout", label: "Таймаут потери связи", kind: "range", min: 2, max: 30, default: 8, unit: "с" },
      { key: "operatorConfirm", label: "Подтверждение оператора", kind: "toggle", default: false },
      { key: "autoLand", label: "Авто-посадка при отказе мотора", kind: "toggle", default: true },
    ],
    example: "DR-003 разрядился до 22% — протокол отправил его на базу за 3 минуты, миссия передана DR-006.",
    metrics: [
      { label: "Реакция на триггер", value: "< 200 мс" },
      { label: "Зарегистрировано протоколов", value: "11" },
    ],
  },
  t12: {
    id: "t12",
    longDescription:
      "ИИ-помощник на базе DeepSeek/LLM. Помогает оператору планировать миссии текстом, объясняет данные телеметрии, предлагает действия.",
    role: "Снижает когнитивную нагрузку на оператора, превращает естественный язык в команды.",
    inputs: ["Сообщение оператора", "Контекст: миссии, флот, события"],
    outputs: ["Ответ", "Предлагаемые действия (call_tool)"],
    dependencies: ["LLM API (Lovable AI Gateway)"],
    modes: ["Чат", "Автопредложения", "Voice-to-mission"],
    functions: [
      { name: "ask", signature: "ask(message, ctx) -> Reply", description: "Запрос к ассистенту с контекстом." },
      { name: "suggestActions", signature: "suggestActions() -> Action[]", description: "Предложения на основе текущего состояния." },
      { name: "summarizeMission", signature: "summarizeMission(id) -> Summary", description: "Краткое резюме миссии." },
    ],
    parameters: [
      { key: "model", label: "Модель", kind: "select", options: ["gemini-3-flash", "gemini-3-pro", "deepseek-r1"], default: "gemini-3-flash" },
      { key: "temperature", label: "Temperature", kind: "range", min: 0, max: 1, default: 0.3, step: 0.05 },
      { key: "voiceInput", label: "Голосовой ввод", kind: "toggle", default: false },
    ],
    example: "Оператор: «постройте патруль вокруг здания» → ассистент сгенерировал 8 waypoints и предложил применить шаблон.",
    metrics: [
      { label: "Среднее время ответа", value: "1.2 с" },
      { label: "Использованных функций", value: "12" },
    ],
  },
  t13: {
    id: "t13",
    longDescription:
      "Видеообработка H.264/H.265 с адаптивным битрейтом, RTSP/WebRTC выходом и наложением OSD (HUD-телеметрии).",
    role: "Доставляет живое видео оператору с минимальной задержкой и записывает в архив.",
    inputs: ["RAW-кадры с CSI/USB-камеры"],
    outputs: ["RTSP stream", "MP4 архив", "WebRTC peer"],
    dependencies: ["Camera", "uplink"],
    modes: ["Low-latency (WebRTC)", "Archive (MP4)", "Multi-bitrate"],
    functions: [
      { name: "startStream", signature: "startStream(url) -> void", description: "Запуск RTSP/WebRTC потока." },
      { name: "recordSegment", signature: "recordSegment(seconds) -> File", description: "Запись отрезка в MP4." },
      { name: "snapshot", signature: "snapshot() -> JPEG", description: "Сделать кадр." },
      { name: "overlayOSD", signature: "overlayOSD(telemetry) -> void", description: "Наложение HUD на видео." },
    ],
    parameters: [
      { key: "bitrate", label: "Битрейт", kind: "range", min: 1, max: 20, default: 6, unit: "Мбит/с" },
      { key: "resolution", label: "Разрешение", kind: "select", options: ["720p", "1080p", "4K"], default: "1080p" },
      { key: "codec", label: "Кодек", kind: "select", options: ["H.264", "H.265", "AV1"], default: "H.264" },
      { key: "osd", label: "OSD-телеметрия", kind: "toggle", default: true },
    ],
    example: "Live-стрим DR-001 идёт по WebRTC с задержкой 180 мс, OSD показывает высоту/скорость/батарею.",
    metrics: [
      { label: "Задержка WebRTC", value: "150-220 мс" },
      { label: "Сжатие H.265", value: "до 50%" },
    ],
  },
};

export function getToolDetails(id: string): ToolDetails | undefined {
  return toolsCatalog[id];
}
