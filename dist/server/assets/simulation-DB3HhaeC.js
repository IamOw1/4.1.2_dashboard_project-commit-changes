import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { P as PageHeader, S as StatCard, a as Panel } from "./Panel-DCNe0G5R.js";
import { a as api } from "./router-BHqUf-SS.js";
import { FlaskConical, CheckCircle2, Plug, RefreshCw, PlugZap, ExternalLink } from "lucide-react";
import "@tanstack/react-router";
import "@radix-ui/react-popover";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-slot";
import "class-variance-authority";
const simulators = [
  {
    id: "airsim",
    name: "AirSim",
    vendor: "Microsoft",
    description: "Открытый симулятор Unreal Engine для дронов и автомобилей. Поддерживает фото-реалистичную графику, мультироторы, фиксированное крыло, погодные эффекты и ИИ-агентов.",
    defaultHost: "127.0.0.1",
    defaultPort: 41451,
    protocol: "RPC",
    sdk: "airsim-python ≥ 1.8 / msgpack-rpc",
    features: ["Photo-real", "Weather", "Lidar/Depth", "Multi-vehicle", "Sim-to-real RL"],
    docsUrl: "https://microsoft.github.io/AirSim/"
  },
  {
    id: "gazebo",
    name: "Gazebo Sim (Ignition)",
    vendor: "Open Robotics",
    description: "Стандарт robotics-симуляции для ROS/ROS2. Поддерживает PX4/ArduPilot SITL, физику ODE/Bullet/DART, плагины датчиков.",
    defaultHost: "127.0.0.1",
    defaultPort: 11345,
    protocol: "TCP",
    sdk: "gz-transport / ROS2 bridge",
    features: ["PX4 SITL", "ArduPilot SITL", "ROS2 native", "Plug-ins"],
    docsUrl: "https://gazebosim.org/"
  },
  {
    id: "pybullet",
    name: "PyBullet",
    vendor: "Erwin Coumans",
    description: "Лёгкий физический симулятор для RL. Хорошо параллелится (до 32 сред), используется для DQN/PPO/SAC претренинга политик.",
    defaultHost: "127.0.0.1",
    defaultPort: 6010,
    protocol: "TCP",
    sdk: "pybullet ≥ 3.2",
    features: ["Headless RL", "Parallel envs", "URDF", "Soft-body"],
    docsUrl: "https://pybullet.org/"
  },
  {
    id: "webots",
    name: "Webots",
    vendor: "Cyberbotics",
    description: "Кроссплатформенный симулятор с богатой библиотекой роботов. Поддерживает прямой контроллер на C/C++/Python/Java.",
    defaultHost: "127.0.0.1",
    defaultPort: 10001,
    protocol: "TCP",
    sdk: "webots-controller",
    features: ["Robotics IDE", "Sensors zoo", "VRML world"],
    docsUrl: "https://cyberbotics.com/"
  },
  {
    id: "jmavsim",
    name: "jMAVSim",
    vendor: "PX4",
    description: "Простой Java-симулятор мультироторов для PX4 SITL. Подходит для быстрых проверок MAVLink-команд.",
    defaultHost: "127.0.0.1",
    defaultPort: 14560,
    protocol: "UDP",
    sdk: "PX4 SITL",
    features: ["MAVLink direct", "Lightweight", "PX4 default"],
    docsUrl: "https://docs.px4.io/main/en/simulation/jmavsim.html"
  },
  {
    id: "unity",
    name: "Unity ML-Agents",
    vendor: "Unity",
    description: "Среда на Unity для ML-агентов. Используется для кастомных сцен патрулирования/поиска с realtime-рендером.",
    defaultHost: "127.0.0.1",
    defaultPort: 5005,
    protocol: "WebSocket",
    sdk: "ml-agents 0.30+",
    features: ["Custom scenes", "Visual obs", "Curriculum learning"],
    docsUrl: "https://unity.com/products/machine-learning-agents"
  },
  {
    id: "carla",
    name: "CARLA",
    vendor: "CVC / Intel",
    description: "Симулятор для autonomous driving, но широко используется для urban-сценариев дронов (низкая высота).",
    defaultHost: "127.0.0.1",
    defaultPort: 2e3,
    protocol: "RPC",
    sdk: "carla 0.9.x",
    features: ["Urban scenes", "Traffic", "Sensors", "Weather"],
    docsUrl: "https://carla.org/"
  },
  {
    id: "isaac",
    name: "NVIDIA Isaac Sim",
    vendor: "NVIDIA",
    description: "Симулятор на Omniverse с GPU-физикой PhysX 5. Используется для тренировки sim-to-real политик с фотореализмом.",
    defaultHost: "127.0.0.1",
    defaultPort: 9090,
    protocol: "ROS2",
    sdk: "isaac-sim 2023.1+",
    features: ["GPU physics", "Photo-real", "Domain randomization"],
    docsUrl: "https://developer.nvidia.com/isaac-sim"
  }
];
const STORAGE_KEY = "coba.sim.connections.v1";
function SimulationPage() {
  const [conns, setConns] = useState(() => {
    const base = {};
    simulators.forEach((s) => {
      base[s.id] = {
        host: s.defaultHost,
        port: s.defaultPort,
        apiKey: "",
        status: "offline"
      };
    });
    return base;
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setConns((prev) => ({
        ...prev,
        ...JSON.parse(raw)
      }));
    } catch {
    }
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(conns));
    } catch {
    }
  }, [conns]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await api.simulatorsStatus();
      if (cancelled || !r.ok || !r.data || typeof r.data !== "object") return;
      const sess = r.data.session;
      const sid = sess?.simulator_id;
      const st = sess?.status;
      if (typeof sid !== "string" || st !== "connected") return;
      setConns((prev) => {
        if (!prev[sid]) return prev;
        return {
          ...prev,
          [sid]: {
            ...prev[sid],
            status: "online"
          }
        };
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  const update = (id, patch) => setConns((p) => ({
    ...p,
    [id]: {
      ...p[id],
      ...patch
    }
  }));
  const connect = async (id) => {
    const c = conns[id];
    if (!c) return;
    update(id, {
      status: "connecting"
    });
    const r = await api.simulatorsConnect({
      simulator_id: id,
      host: c.host,
      port: c.port
    });
    if (r.ok) {
      update(id, {
        status: "online",
        lastConnected: (/* @__PURE__ */ new Date()).toLocaleTimeString("ru-RU")
      });
    } else {
      update(id, {
        status: "offline"
      });
    }
  };
  const disconnect = async (id) => {
    await api.simulatorsDisconnect();
    update(id, {
      status: "offline"
    });
  };
  const onlineCount = Object.values(conns).filter((c) => c.status === "online").length;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PageHeader, { title: "Симуляция", description: "Подключение ко всем поддерживаемым симуляторам · sim-to-real тренировка политик", badge: `${onlineCount}/${simulators.length} подключено` }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 lg:grid-cols-4", children: [
      /* @__PURE__ */ jsx(StatCard, { label: "Симуляторов", value: simulators.length, tone: "primary", icon: /* @__PURE__ */ jsx(FlaskConical, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx(StatCard, { label: "Подключено", value: onlineCount, tone: "success", icon: /* @__PURE__ */ jsx(CheckCircle2, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx(StatCard, { label: "Протоколы", value: "6", tone: "default" }),
      /* @__PURE__ */ jsx(StatCard, { label: "Активная сессия", value: onlineCount > 0 ? "ON" : "—", tone: onlineCount > 0 ? "success" : "default" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-4 grid gap-4 lg:grid-cols-2", children: simulators.map((s) => {
      const c = conns[s.id];
      return /* @__PURE__ */ jsxs(Panel, { title: s.vendor, subtitle: s.name, actions: /* @__PURE__ */ jsx("span", { className: ["rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase", c.status === "online" ? "border-success/40 bg-success/10 text-success" : c.status === "connecting" ? "border-warning/40 bg-warning/10 text-warning" : "border-border bg-card text-muted-foreground"].join(" "), children: c.status === "online" ? "online" : c.status === "connecting" ? "connecting" : "offline" }), children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs leading-relaxed text-muted-foreground", children: s.description }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 grid grid-cols-3 gap-2 text-[10px]", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Протокол: " }),
            /* @__PURE__ */ jsx("span", { className: "font-mono text-foreground", children: s.protocol })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "SDK: " }),
            /* @__PURE__ */ jsx("span", { className: "font-mono text-foreground", children: s.sdk })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Порт: " }),
            /* @__PURE__ */ jsx("span", { className: "font-mono text-foreground", children: s.defaultPort })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-3 flex flex-wrap gap-1.5", children: s.features.map((f) => /* @__PURE__ */ jsx("span", { className: "rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-muted-foreground", children: f }, f)) }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 grid grid-cols-2 gap-2", children: [
          /* @__PURE__ */ jsx("input", { value: c.host, onChange: (e) => update(s.id, {
            host: e.target.value
          }), placeholder: "host", className: "rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary" }),
          /* @__PURE__ */ jsx("input", { type: "number", value: c.port, onChange: (e) => update(s.id, {
            port: Number(e.target.value)
          }), placeholder: "port", className: "rounded-md border border-border bg-background px-2 py-1.5 text-xs font-mono text-foreground outline-none focus:border-primary" }),
          /* @__PURE__ */ jsx("input", { value: c.apiKey, onChange: (e) => update(s.id, {
            apiKey: e.target.value
          }), placeholder: "API key / token (опц.)", className: "col-span-2 rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-center gap-2", children: [
          c.status === "online" ? /* @__PURE__ */ jsxs("button", { onClick: () => disconnect(s.id), className: "inline-flex items-center gap-1.5 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20", children: [
            /* @__PURE__ */ jsx(Plug, { className: "h-3.5 w-3.5" }),
            " Отключить"
          ] }) : /* @__PURE__ */ jsxs("button", { onClick: () => connect(s.id), disabled: c.status === "connecting", className: "inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50", children: [
            c.status === "connecting" ? /* @__PURE__ */ jsx(RefreshCw, { className: "h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ jsx(PlugZap, { className: "h-3.5 w-3.5" }),
            c.status === "connecting" ? "Подключение…" : "Подключить"
          ] }),
          /* @__PURE__ */ jsxs("a", { href: s.docsUrl, target: "_blank", rel: "noreferrer", className: "inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary", children: [
            /* @__PURE__ */ jsx(ExternalLink, { className: "h-3 w-3" }),
            " Документация"
          ] }),
          c.lastConnected && /* @__PURE__ */ jsxs("span", { className: "ml-auto font-mono text-[10px] text-muted-foreground", children: [
            "last: ",
            c.lastConnected
          ] })
        ] })
      ] }, s.id);
    }) })
  ] });
}
export {
  SimulationPage as component
};
