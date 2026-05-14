import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { PlayCircle, Camera, Navigation, Radio, Wifi, Radar, Thermometer, Save, Loader2, Download, Brain, Trash2 } from "lucide-react";
import { P as PageHeader, S as StatCard, a as Panel } from "./Panel-DCNe0G5R.js";
import { a as api } from "./router-BHqUf-SS.js";
import "@tanstack/react-router";
import "@radix-ui/react-popover";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-slot";
import "class-variance-authority";
const PROFILES_KEY = "coba.settings.profiles.v1";
const ACTIVE_PROFILE_KEY = "coba.settings.active.v1";
function SettingsPage() {
  const [meshEnabled, setMeshEnabled] = useState(true);
  const [thermalEnabled, setThermalEnabled] = useState(true);
  const [systemTested, setSystemTested] = useState(false);
  const [profileName, setProfileName] = useState("Профиль A");
  const [profiles, setProfiles] = useState([]);
  const [savedHint, setSavedHint] = useState(false);
  const [linkQ, setLinkQ] = useState({});
  const [envS, setEnvS] = useState({});
  const [navS, setNavS] = useState({});
  const [visS, setVisS] = useState({});
  const [modelUrl, setModelUrl] = useState("");
  const [modelSlot, setModelSlot] = useState("core");
  const [modelBusy, setModelBusy] = useState(false);
  const [modelHint, setModelHint] = useState(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [lq, env, nav, vis] = await Promise.all([api.sensorsLinkQuality(), api.sensorsEnvironment(), api.sensorsNavigation(), api.sensorsVisual()]);
      if (cancelled) return;
      if (lq.ok && lq.data && typeof lq.data === "object") {
        const d = lq.data;
        setLinkQ({
          wifi: typeof d.wifi_dbm === "number" ? d.wifi_dbm : String(d.wifi_dbm ?? "—"),
          loss: d.packet_loss_pct != null ? `${d.packet_loss_pct}%` : "—"
        });
      }
      if (env.ok && env.data && typeof env.data === "object") {
        const d = env.data;
        setEnvS({
          t: d.temperature_c != null ? `${d.temperature_c}°C` : "—",
          p: d.pressure_mmhg != null ? `${d.pressure_mmhg} мм` : "—"
        });
      }
      if (nav.ok && nav.data && typeof nav.data === "object") {
        const d = nav.data;
        setNavS({
          gps: String(d.gps_fix ?? "—"),
          sats: d.satellites != null ? String(d.satellites) : "—"
        });
      }
      if (vis.ok && vis.data && typeof vis.data === "object") {
        const d = vis.data;
        setVisS({
          cam: String(d.main_camera ?? "—")
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  const runSystemTest = async () => {
    const r = await api.systemSelfTest();
    setSystemTested(r.ok);
  };
  const downloadModel = async () => {
    const url = modelUrl.trim();
    if (!url) {
      setModelHint("Введите URL модели (http/https).");
      return;
    }
    setModelBusy(true);
    setModelHint(null);
    const r = await api.modelsDownload({
      url,
      slot: modelSlot
    });
    setModelBusy(false);
    if (r.ok && r.data && typeof r.data === "object") {
      const d = r.data;
      setModelHint(`Файл сохранён: ${String(d.path ?? "")} (${String(d.bytes ?? "")} байт). Переменная ${String(d.env_key ?? "")} обновлена в процессе API.`);
    } else {
      setModelHint(r.error ?? "Не удалось скачать модель (проверьте URL и лимит 512 МБ).");
    }
  };
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(PROFILES_KEY);
      if (raw) setProfiles(JSON.parse(raw));
      const active = window.localStorage.getItem(ACTIVE_PROFILE_KEY);
      if (active) {
        const list = raw ? JSON.parse(raw) : [];
        const p = list.find((x) => x.name === active);
        if (p) {
          setProfileName(p.name);
          setMeshEnabled(p.meshEnabled);
          setThermalEnabled(p.thermalEnabled);
        }
      }
    } catch {
    }
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    } catch {
    }
  }, [profiles]);
  const saveProfile = () => {
    const name = profileName.trim() || `Профиль ${profiles.length + 1}`;
    const profile = {
      name,
      meshEnabled,
      thermalEnabled,
      savedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    setProfiles((prev) => {
      const without = prev.filter((p) => p.name !== name);
      return [...without, profile].sort((a, b) => a.name.localeCompare(b.name));
    });
    try {
      window.localStorage.setItem(ACTIVE_PROFILE_KEY, name);
    } catch {
    }
    setSavedHint(true);
    window.setTimeout(() => setSavedHint(false), 1800);
  };
  const loadProfile = (p) => {
    setProfileName(p.name);
    setMeshEnabled(p.meshEnabled);
    setThermalEnabled(p.thermalEnabled);
    try {
      window.localStorage.setItem(ACTIVE_PROFILE_KEY, p.name);
    } catch {
    }
  };
  const deleteProfile = (name) => {
    setProfiles((prev) => prev.filter((p) => p.name !== name));
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PageHeader, { title: "Настройки", description: "Сенсоры, каналы связи, калибровка и проверки систем", badge: "Профиль оператора · Сессия А", actions: /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsx("input", { value: profileName, onChange: (e) => setProfileName(e.target.value), className: "rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground" }),
      /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => void runSystemTest(), className: "inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90", children: [
        /* @__PURE__ */ jsx(PlayCircle, { className: "h-4 w-4" }),
        " Запустить тест систем"
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 lg:grid-cols-4", children: [
      /* @__PURE__ */ jsx(StatCard, { label: "Визуальные сенсоры", value: visS.cam ?? "4", tone: "primary", icon: /* @__PURE__ */ jsx(Camera, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx(StatCard, { label: "Навигация", value: navS.gps ? `${navS.gps} · ${navS.sats} спутн.` : "GPS+IMU", tone: "success", icon: /* @__PURE__ */ jsx(Navigation, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx(StatCard, { label: "Mesh / Radio", value: meshEnabled ? "ON" : "OFF", tone: "warning", icon: /* @__PURE__ */ jsx(Radio, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx(StatCard, { label: "Качество связи", value: linkQ.wifi != null ? `${linkQ.wifi} dBm` : "—", tone: "default", icon: /* @__PURE__ */ jsx(Wifi, { className: "h-4 w-4" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4", children: [
      /* @__PURE__ */ jsx(StatCard, { label: "Тест систем", value: systemTested ? "OK" : "Не запускался", tone: systemTested ? "success" : "default", icon: /* @__PURE__ */ jsx(Radar, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx(StatCard, { label: "Потери пакетов", value: linkQ.loss ?? "—", tone: "default", icon: /* @__PURE__ */ jsx(Radio, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx(StatCard, { label: "Температура / давление", value: `${envS.t ?? "—"} · ${envS.p ?? "—"}`, tone: "default", icon: /* @__PURE__ */ jsx(Thermometer, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx(StatCard, { label: "Камера (API)", value: visS.cam ?? "—", tone: "primary", icon: /* @__PURE__ */ jsx(Camera, { className: "h-4 w-4" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-4 xl:grid-cols-2", children: [
      /* @__PURE__ */ jsxs(Panel, { title: "8.1 Визуальные сенсоры", children: [
        /* @__PURE__ */ jsx(SettingRow, { label: "Стандартная камера", value: visS.cam ?? "4K / 30fps" }),
        /* @__PURE__ */ jsx(SettingRow, { label: "Тепловизор", value: thermalEnabled ? "Включён" : "Выключен", action: /* @__PURE__ */ jsx(ToggleButton, { active: thermalEnabled, onClick: () => setThermalEnabled((v) => !v) }) }),
        /* @__PURE__ */ jsx(SettingRow, { label: "Depth / LiDAR", value: "Калибровка выполнена" }),
        /* @__PURE__ */ jsx(SettingRow, { label: "Автофокус", value: "Следящий режим" })
      ] }),
      /* @__PURE__ */ jsxs(Panel, { title: "8.2 Навигация и 8.3 состояние", children: [
        /* @__PURE__ */ jsx(SettingRow, { label: "GPS / ГЛОНАСС / Galileo", value: `${navS.sats ?? "14"} спутников · ${navS.gps ?? "3D Fix"}` }),
        /* @__PURE__ */ jsx(SettingRow, { label: "IMU", value: "Калибровано" }),
        /* @__PURE__ */ jsx(SettingRow, { label: "Батарея", value: "Норма · 24.1V" }),
        /* @__PURE__ */ jsx(SettingRow, { label: "Температура / Давление", value: `${envS.t ?? "42°C"} · ${envS.p ?? "756 мм"}`, action: /* @__PURE__ */ jsx(Thermometer, { className: "h-4 w-4 text-warning" }) })
      ] }),
      /* @__PURE__ */ jsxs(Panel, { title: "8.4 Связь и mesh-сеть", children: [
        /* @__PURE__ */ jsx(SettingRow, { label: "Wi‑Fi uplink", value: linkQ.wifi != null ? `Стабильно · ${linkQ.wifi} dBm` : "Стабильно · -58 dBm", action: /* @__PURE__ */ jsx(Wifi, { className: "h-4 w-4 text-success" }) }),
        /* @__PURE__ */ jsx(SettingRow, { label: "Потери пакетов", value: linkQ.loss ?? "—" }),
        /* @__PURE__ */ jsx(SettingRow, { label: "Mesh сеть", value: meshEnabled ? "Самоорганизация активна" : "Отключена", action: /* @__PURE__ */ jsx(ToggleButton, { active: meshEnabled, onClick: () => setMeshEnabled((v) => !v) }) }),
        /* @__PURE__ */ jsx(SettingRow, { label: "Радиоканал", value: "868 MHz · AES-256" }),
        /* @__PURE__ */ jsx(SettingRow, { label: "Failover", value: "Автовосстановление маршрута" })
      ] }),
      /* @__PURE__ */ jsxs(Panel, { title: "8.5 Проверка систем", children: [
        /* @__PURE__ */ jsx("div", { className: "space-y-3 text-sm", children: ["Питание и силовая часть", "Сенсоры обзора", "Навигационный стек", "Канал связи оператора", "Mesh-маршрутизация и резервирование"].map((item) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between rounded-md border border-border bg-card/40 px-3 py-2", children: [
          /* @__PURE__ */ jsx("span", { className: "text-foreground", children: item }),
          /* @__PURE__ */ jsx("span", { className: ["rounded-full px-2 py-0.5 text-[10px] font-mono uppercase", systemTested ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground"].join(" "), children: systemTested ? "готово" : "ожидает" })
        ] }, item)) }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsx("button", { onClick: saveProfile, className: "rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary", children: "Применить" }),
          /* @__PURE__ */ jsxs("button", { onClick: saveProfile, className: "inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20", children: [
            /* @__PURE__ */ jsx(Save, { className: "h-3.5 w-3.5" }),
            " Сохранить как профиль"
          ] }),
          savedHint && /* @__PURE__ */ jsx("span", { className: "text-xs text-success", children: "Сохранено" })
        ] })
      ] }),
      /* @__PURE__ */ jsx(Panel, { title: "On-premise: языковые модели Core / Sub", subtitle: "Скачивание в data/models через бэкенд (POST /api/v1/models/download). Лимит 512 МБ за запрос.", className: "xl:col-span-2", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsx("label", { className: "text-muted-foreground", children: "Слот" }),
          /* @__PURE__ */ jsxs("select", { value: modelSlot, onChange: (e) => setModelSlot(e.target.value), className: "rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground", children: [
            /* @__PURE__ */ jsx("option", { value: "core", children: "Core Agent" }),
            /* @__PURE__ */ jsx("option", { value: "sub", children: "Sub-Agent" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("input", { value: modelUrl, onChange: (e) => setModelUrl(e.target.value), placeholder: "https://…/model.gguf", className: "w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono text-foreground outline-none focus:border-primary" }),
        /* @__PURE__ */ jsxs("button", { type: "button", disabled: modelBusy, onClick: () => void downloadModel(), className: "inline-flex max-w-xs items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50", children: [
          modelBusy ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Download, { className: "h-4 w-4" }),
          "Скачать модель"
        ] }),
        modelHint && /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsx(Brain, { className: "mr-1 inline h-3.5 w-3.5 align-text-bottom text-primary" }),
          modelHint
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(Panel, { title: "Сохранённые профили", subtitle: "Профили хранятся локально для быстрых переключений между конфигурациями.", className: "xl:col-span-2", children: profiles.length === 0 ? /* @__PURE__ */ jsx("div", { className: "rounded-md border border-dashed border-border bg-card/30 px-3 py-4 text-center text-xs text-muted-foreground", children: "Ещё нет сохранённых профилей. Введите имя выше и нажмите «Сохранить как профиль»." }) : /* @__PURE__ */ jsx("div", { className: "grid gap-2 lg:grid-cols-2", children: profiles.map((p) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 rounded-md border border-border bg-card/50 px-3 py-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsx("div", { className: "truncate text-sm font-semibold text-foreground", children: p.name }),
          /* @__PURE__ */ jsxs("div", { className: "text-[10px] font-mono text-muted-foreground", children: [
            "mesh:",
            p.meshEnabled ? "on" : "off",
            " · thermal:",
            p.thermalEnabled ? "on" : "off"
          ] })
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => loadProfile(p), className: "rounded-md border border-border bg-card px-2 py-1 text-[11px] font-semibold text-foreground hover:bg-secondary", children: "Загрузить" }),
        /* @__PURE__ */ jsx("button", { onClick: () => deleteProfile(p.name), className: "rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive", title: "Удалить", children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" }) })
      ] }, p.name)) }) })
    ] })
  ] });
}
function SettingRow({
  label,
  value,
  action
}) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-border/60 py-2 last:border-b-0", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("div", { className: "text-sm font-medium text-foreground", children: label }),
      /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: value })
    ] }),
    action
  ] });
}
function ToggleButton({
  active,
  onClick
}) {
  return /* @__PURE__ */ jsx("button", { onClick, className: ["inline-flex rounded-full border px-2 py-1 text-[11px] font-medium transition-colors", active ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"].join(" "), children: active ? "Вкл" : "Выкл" });
}
export {
  SettingsPage as component
};
