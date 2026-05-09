// Каталог симуляторов и каналов связи / типов дронов.
// Используется страницами /learning, /simulation, /settings.

export interface SimulatorSpec {
  id: string;
  name: string;
  vendor: string;
  description: string;
  defaultHost: string;
  defaultPort: number;
  protocol: "RPC" | "WebSocket" | "ROS2" | "TCP" | "UDP" | "HTTP";
  sdk: string;
  features: string[];
  docsUrl: string;
}

export const simulators: SimulatorSpec[] = [
  {
    id: "airsim",
    name: "AirSim",
    vendor: "Microsoft",
    description:
      "Открытый симулятор Unreal Engine для дронов и автомобилей. Поддерживает фото-реалистичную графику, мультироторы, фиксированное крыло, погодные эффекты и ИИ-агентов.",
    defaultHost: "127.0.0.1",
    defaultPort: 41451,
    protocol: "RPC",
    sdk: "airsim-python ≥ 1.8 / msgpack-rpc",
    features: ["Photo-real", "Weather", "Lidar/Depth", "Multi-vehicle", "Sim-to-real RL"],
    docsUrl: "https://microsoft.github.io/AirSim/",
  },
  {
    id: "gazebo",
    name: "Gazebo Sim (Ignition)",
    vendor: "Open Robotics",
    description:
      "Стандарт robotics-симуляции для ROS/ROS2. Поддерживает PX4/ArduPilot SITL, физику ODE/Bullet/DART, плагины датчиков.",
    defaultHost: "127.0.0.1",
    defaultPort: 11345,
    protocol: "TCP",
    sdk: "gz-transport / ROS2 bridge",
    features: ["PX4 SITL", "ArduPilot SITL", "ROS2 native", "Plug-ins"],
    docsUrl: "https://gazebosim.org/",
  },
  {
    id: "pybullet",
    name: "PyBullet",
    vendor: "Erwin Coumans",
    description:
      "Лёгкий физический симулятор для RL. Хорошо параллелится (до 32 сред), используется для DQN/PPO/SAC претренинга политик.",
    defaultHost: "127.0.0.1",
    defaultPort: 6010,
    protocol: "TCP",
    sdk: "pybullet ≥ 3.2",
    features: ["Headless RL", "Parallel envs", "URDF", "Soft-body"],
    docsUrl: "https://pybullet.org/",
  },
  {
    id: "webots",
    name: "Webots",
    vendor: "Cyberbotics",
    description:
      "Кроссплатформенный симулятор с богатой библиотекой роботов. Поддерживает прямой контроллер на C/C++/Python/Java.",
    defaultHost: "127.0.0.1",
    defaultPort: 10001,
    protocol: "TCP",
    sdk: "webots-controller",
    features: ["Robotics IDE", "Sensors zoo", "VRML world"],
    docsUrl: "https://cyberbotics.com/",
  },
  {
    id: "jmavsim",
    name: "jMAVSim",
    vendor: "PX4",
    description:
      "Простой Java-симулятор мультироторов для PX4 SITL. Подходит для быстрых проверок MAVLink-команд.",
    defaultHost: "127.0.0.1",
    defaultPort: 14560,
    protocol: "UDP",
    sdk: "PX4 SITL",
    features: ["MAVLink direct", "Lightweight", "PX4 default"],
    docsUrl: "https://docs.px4.io/main/en/simulation/jmavsim.html",
  },
  {
    id: "unity",
    name: "Unity ML-Agents",
    vendor: "Unity",
    description:
      "Среда на Unity для ML-агентов. Используется для кастомных сцен патрулирования/поиска с realtime-рендером.",
    defaultHost: "127.0.0.1",
    defaultPort: 5005,
    protocol: "WebSocket",
    sdk: "ml-agents 0.30+",
    features: ["Custom scenes", "Visual obs", "Curriculum learning"],
    docsUrl: "https://unity.com/products/machine-learning-agents",
  },
  {
    id: "carla",
    name: "CARLA",
    vendor: "CVC / Intel",
    description:
      "Симулятор для autonomous driving, но широко используется для urban-сценариев дронов (низкая высота).",
    defaultHost: "127.0.0.1",
    defaultPort: 2000,
    protocol: "RPC",
    sdk: "carla 0.9.x",
    features: ["Urban scenes", "Traffic", "Sensors", "Weather"],
    docsUrl: "https://carla.org/",
  },
  {
    id: "isaac",
    name: "NVIDIA Isaac Sim",
    vendor: "NVIDIA",
    description:
      "Симулятор на Omniverse с GPU-физикой PhysX 5. Используется для тренировки sim-to-real политик с фотореализмом.",
    defaultHost: "127.0.0.1",
    defaultPort: 9090,
    protocol: "ROS2",
    sdk: "isaac-sim 2023.1+",
    features: ["GPU physics", "Photo-real", "Domain randomization"],
    docsUrl: "https://developer.nvidia.com/isaac-sim",
  },
];

// ----- Алгоритмы обучения -----

export interface AlgorithmSpec {
  id: string;
  name: string;
  family: "Value-based" | "Policy-gradient" | "Actor-Critic";
  description: string;
  hyperparams: Array<{ key: string; label: string; default: string }>;
}

export const algorithms: AlgorithmSpec[] = [
  {
    id: "dqn",
    name: "DQN",
    family: "Value-based",
    description: "Глубокое Q-обучение с experience replay и target network.",
    hyperparams: [
      { key: "lr", label: "Learning rate", default: "0.0003" },
      { key: "gamma", label: "Discount γ", default: "0.99" },
      { key: "epsilon", label: "ε-greedy", default: "0.12" },
      { key: "batch", label: "Batch size", default: "64" },
      { key: "target", label: "Target update", default: "1000" },
    ],
  },
  {
    id: "ddqn",
    name: "Double DQN",
    family: "Value-based",
    description: "DQN с устранением переоценки Q-значений за счёт двух сетей.",
    hyperparams: [
      { key: "lr", label: "Learning rate", default: "0.0002" },
      { key: "gamma", label: "Discount γ", default: "0.99" },
      { key: "epsilon", label: "ε-greedy", default: "0.10" },
      { key: "batch", label: "Batch size", default: "128" },
    ],
  },
  {
    id: "ppo",
    name: "PPO",
    family: "Actor-Critic",
    description: "Proximal Policy Optimization — стабильный on-policy алгоритм с clipped objective.",
    hyperparams: [
      { key: "lr", label: "Learning rate", default: "0.00025" },
      { key: "gamma", label: "Discount γ", default: "0.99" },
      { key: "clip", label: "Clip range", default: "0.2" },
      { key: "epochs", label: "Epochs / update", default: "10" },
    ],
  },
  {
    id: "sac",
    name: "SAC",
    family: "Actor-Critic",
    description: "Soft Actor-Critic с энтропийной регуляризацией для непрерывных действий.",
    hyperparams: [
      { key: "lr", label: "Learning rate", default: "0.0003" },
      { key: "gamma", label: "Discount γ", default: "0.99" },
      { key: "tau", label: "Soft update τ", default: "0.005" },
      { key: "alpha", label: "Entropy α", default: "0.2" },
    ],
  },
  {
    id: "a2c",
    name: "A2C",
    family: "Policy-gradient",
    description: "Advantage Actor-Critic — синхронная версия A3C.",
    hyperparams: [
      { key: "lr", label: "Learning rate", default: "0.0007" },
      { key: "gamma", label: "Discount γ", default: "0.99" },
      { key: "entropy", label: "Entropy coef", default: "0.01" },
    ],
  },
];

// ----- Учебный курс -----

export interface CourseLesson {
  id: string;
  number: number;
  title: string;
  duration: string;
  description: string;
  topics: string[];
}

export const courseLessons: CourseLesson[] = [
  {
    id: "l1",
    number: 1,
    title: "Введение в Reinforcement Learning",
    duration: "25 мин",
    description: "Основы RL: агент, среда, награда, политика. Связь с управлением дроном.",
    topics: ["Markov Decision Process", "Reward design", "Episodes & terminal states"],
  },
  {
    id: "l2",
    number: 2,
    title: "Симуляторы и подключение",
    duration: "35 мин",
    description: "Запуск AirSim/Gazebo/PyBullet, RPC-API, headless-режим, параллельные среды.",
    topics: ["AirSim setup", "Headless cluster", "Domain randomization"],
  },
  {
    id: "l3",
    number: 3,
    title: "Q-learning и DQN",
    duration: "40 мин",
    description: "От tabular Q-learning к глубоким Q-сетям. Replay buffer, target network.",
    topics: ["Bellman update", "Experience replay", "Target net", "ε-decay"],
  },
  {
    id: "l4",
    number: 4,
    title: "Дизайн награды для патрулирования",
    duration: "30 мин",
    description: "Как сформулировать reward, чтобы агент не «читерил».",
    topics: ["Sparse vs dense", "Shaping", "Curriculum"],
  },
  {
    id: "l5",
    number: 5,
    title: "Policy gradient: PPO и SAC",
    duration: "45 мин",
    description: "Continuous action spaces, on/off-policy, entropy regularization.",
    topics: ["Advantage estimation", "GAE", "Clipped objective"],
  },
  {
    id: "l6",
    number: 6,
    title: "Sim-to-real перенос",
    duration: "50 мин",
    description: "Domain randomization, дообучение на реальных полётах, безопасность.",
    topics: ["Reality gap", "Fine-tune", "Safety filter", "Fail-safe"],
  },
  {
    id: "l7",
    number: 7,
    title: "Обучение роя",
    duration: "40 мин",
    description: "Multi-agent RL, decentralized vs centralized critic, коммуникация между агентами.",
    topics: ["MADDPG", "QMIX", "Comm channel"],
  },
  {
    id: "l8",
    number: 8,
    title: "Этика и безопасность ИИ-дронов",
    duration: "30 мин",
    description: "Регуляторика, приватность, протоколы failsafe, аудит логов.",
    topics: ["Privacy zones", "Audit trail", "Regulatory compliance"],
  },
];

// ----- Типы реальных дронов -----

export interface DroneModelSpec {
  id: string;
  name: string;
  vendor: string;
  protocol: "MAVLink" | "DJI SDK" | "ROS2" | "Custom";
  defaultBaud?: number;
  cameras: number;
  payloadKg: number;
  maxFlightMin: number;
  notes: string;
}

export const droneModels: DroneModelSpec[] = [
  { id: "coba-alpha", name: "COBA-Alpha", vendor: "COBA AI", protocol: "MAVLink", cameras: 2, payloadKg: 1.2, maxFlightMin: 32, notes: "Базовый патрульный квадрокоптер" },
  { id: "coba-bravo", name: "COBA-Bravo", vendor: "COBA AI", protocol: "MAVLink", cameras: 4, payloadKg: 2.5, maxFlightMin: 38, notes: "Картография и поиск с тепловизором" },
  { id: "coba-delta", name: "COBA-Delta", vendor: "COBA AI", protocol: "MAVLink", cameras: 1, payloadKg: 5.0, maxFlightMin: 22, notes: "Грузовая доставка до 5 кг" },
  { id: "coba-foxtrot", name: "COBA-Foxtrot", vendor: "COBA AI", protocol: "MAVLink", cameras: 3, payloadKg: 0.8, maxFlightMin: 28, notes: "Инспекция малых объектов" },
  { id: "px4-sitl", name: "PX4 SITL", vendor: "PX4", protocol: "MAVLink", cameras: 1, payloadKg: 0, maxFlightMin: 999, notes: "Симулированный PX4-дрон для тестов" },
  { id: "ardupilot", name: "ArduPilot Custom", vendor: "ArduPilot", protocol: "MAVLink", defaultBaud: 57600, cameras: 1, payloadKg: 1.5, maxFlightMin: 30, notes: "Любой ArduPilot-совместимый аппарат" },
  { id: "dji-mavic3", name: "DJI Mavic 3", vendor: "DJI", protocol: "DJI SDK", cameras: 2, payloadKg: 0.9, maxFlightMin: 46, notes: "Через DJI Onboard SDK" },
  { id: "dji-matrice", name: "DJI Matrice 350 RTK", vendor: "DJI", protocol: "DJI SDK", cameras: 3, payloadKg: 2.7, maxFlightMin: 55, notes: "Промышленный, RTK-точность" },
  { id: "autel-evo2", name: "Autel EVO II Pro", vendor: "Autel", protocol: "Custom", cameras: 1, payloadKg: 1.2, maxFlightMin: 40, notes: "Autel SDK" },
  { id: "ros2-custom", name: "ROS2 Custom Drone", vendor: "Open", protocol: "ROS2", cameras: 1, payloadKg: 2, maxFlightMin: 25, notes: "Любой DDS-совместимый дрон" },
];

// ----- Каналы связи -----

export interface ChannelSpec {
  id: string;
  label: string;
  description: string;
  fields: Array<{ key: string; label: string; placeholder: string; kind?: "password" | "text" | "number" }>;
}

export const channelSpecs: ChannelSpec[] = [
  {
    id: "wifi",
    label: "Wi-Fi uplink",
    description: "Основной канал для полётов в пределах прямой видимости.",
    fields: [
      { key: "ssid", label: "SSID", placeholder: "COBA-OPS-5G" },
      { key: "password", label: "Пароль", placeholder: "•••••••", kind: "password" },
      { key: "band", label: "Диапазон (ГГц)", placeholder: "5.8" },
    ],
  },
  {
    id: "mesh",
    label: "Mesh сеть",
    description: "Самоорганизующаяся сеть между дронами и шлюзом.",
    fields: [
      { key: "meshId", label: "Mesh ID", placeholder: "coba-mesh-01" },
      { key: "key", label: "AES-256 ключ", placeholder: "•••••••", kind: "password" },
      { key: "freq", label: "Частота (МГц)", placeholder: "2412" },
    ],
  },
  {
    id: "radio",
    label: "Радио 868/915 МГц",
    description: "Длинноволновый low-bitrate канал для команд.",
    fields: [
      { key: "freq", label: "Частота (МГц)", placeholder: "868.0" },
      { key: "power", label: "Мощность (дБм)", placeholder: "20" },
      { key: "channel", label: "Канал", placeholder: "12" },
    ],
  },
  {
    id: "lte",
    label: "LTE / 4G modem",
    description: "Резервный канал через сотовую сеть для BVLOS-полётов.",
    fields: [
      { key: "apn", label: "APN", placeholder: "internet" },
      { key: "imsi", label: "IMSI", placeholder: "250010123456789" },
      { key: "operator", label: "Оператор", placeholder: "MTS" },
    ],
  },
  {
    id: "satellite",
    label: "Satellite uplink",
    description: "Iridium/Inmarsat для удалённых районов без покрытия.",
    fields: [
      { key: "imei", label: "IMEI терминала", placeholder: "300234010000000" },
      { key: "plan", label: "Тарифный план", placeholder: "Iridium SBD" },
    ],
  },
  {
    id: "mavlink",
    label: "MAVLink телеметрия",
    description: "Поток телеметрии в формате MAVLink v2.",
    fields: [
      { key: "endpoint", label: "Endpoint", placeholder: "udp://0.0.0.0:14550" },
      { key: "rate", label: "Частота (Гц)", placeholder: "10", kind: "number" },
    ],
  },
];
