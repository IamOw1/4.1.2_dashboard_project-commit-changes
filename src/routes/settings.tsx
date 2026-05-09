import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Camera, Radar, Navigation, Radio, Thermometer, Wifi, PlayCircle, Save, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel, StatCard } from "@/components/dashboard/Panel";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Настройки · COBA AI" },
      { name: "description", content: "Сенсоры, связь, калибровка и системные тесты COBA AI." },
    ],
  }),
  component: SettingsPage,
});

const PROFILES_KEY = "coba.settings.profiles.v1";
const ACTIVE_PROFILE_KEY = "coba.settings.active.v1";

interface SettingsProfile {
  name: string;
  meshEnabled: boolean;
  thermalEnabled: boolean;
  savedAt: string;
}

function SettingsPage() {
  const [meshEnabled, setMeshEnabled] = useState(true);
  const [thermalEnabled, setThermalEnabled] = useState(true);
  const [systemTested, setSystemTested] = useState(false);
  const [profileName, setProfileName] = useState("Профиль A");
  const [profiles, setProfiles] = useState<SettingsProfile[]>([]);
  const [savedHint, setSavedHint] = useState(false);

  // load on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(PROFILES_KEY);
      if (raw) setProfiles(JSON.parse(raw));
      const active = window.localStorage.getItem(ACTIVE_PROFILE_KEY);
      if (active) {
        const list: SettingsProfile[] = raw ? JSON.parse(raw) : [];
        const p = list.find((x) => x.name === active);
        if (p) {
          setProfileName(p.name);
          setMeshEnabled(p.meshEnabled);
          setThermalEnabled(p.thermalEnabled);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  // persist profiles list
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    } catch {
      /* ignore */
    }
  }, [profiles]);

  const saveProfile = () => {
    const name = profileName.trim() || `Профиль ${profiles.length + 1}`;
    const profile: SettingsProfile = {
      name,
      meshEnabled,
      thermalEnabled,
      savedAt: new Date().toISOString(),
    };
    setProfiles((prev) => {
      const without = prev.filter((p) => p.name !== name);
      return [...without, profile].sort((a, b) => a.name.localeCompare(b.name));
    });
    try {
      window.localStorage.setItem(ACTIVE_PROFILE_KEY, name);
    } catch {
      /* ignore */
    }
    setSavedHint(true);
    window.setTimeout(() => setSavedHint(false), 1800);
  };

  const loadProfile = (p: SettingsProfile) => {
    setProfileName(p.name);
    setMeshEnabled(p.meshEnabled);
    setThermalEnabled(p.thermalEnabled);
    try {
      window.localStorage.setItem(ACTIVE_PROFILE_KEY, p.name);
    } catch {
      /* ignore */
    }
  };

  const deleteProfile = (name: string) => {
    setProfiles((prev) => prev.filter((p) => p.name !== name));
  };

  return (
    <>
      <PageHeader
        title="Настройки"
        description="Сенсоры, каналы связи, калибровка и проверки систем"
        badge="Профиль оператора · Сессия А"
        actions={
          <div className="flex gap-2">
            <input value={profileName} onChange={(e) => setProfileName(e.target.value)} className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground" />
            <button
              onClick={() => setSystemTested(true)}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              <PlayCircle className="h-4 w-4" /> Запустить тест систем
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Визуальные сенсоры" value="4" tone="primary" icon={<Camera className="h-4 w-4" />} />
        <StatCard label="Навигация" value="GPS+IMU" tone="success" icon={<Navigation className="h-4 w-4" />} />
        <StatCard label="Mesh / Radio" value={meshEnabled ? "ON" : "OFF"} tone="warning" icon={<Radio className="h-4 w-4" />} />
        <StatCard label="Тест систем" value={systemTested ? "OK" : "Не запускался"} tone={systemTested ? "success" : "default"} icon={<Radar className="h-4 w-4" />} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="8.1 Визуальные сенсоры">
          <SettingRow label="Стандартная камера" value="4K / 30fps" />
          <SettingRow label="Тепловизор" value={thermalEnabled ? "Включён" : "Выключен"} action={<ToggleButton active={thermalEnabled} onClick={() => setThermalEnabled((v) => !v)} />} />
          <SettingRow label="Depth / LiDAR" value="Калибровка выполнена" />
          <SettingRow label="Автофокус" value="Следящий режим" />
        </Panel>

        <Panel title="8.2 Навигация и 8.3 состояние">
          <SettingRow label="GPS / ГЛОНАСС / Galileo" value="14 спутников · 3D Fix" />
          <SettingRow label="IMU" value="Калибровано" />
          <SettingRow label="Батарея" value="Норма · 24.1V" />
          <SettingRow label="Температура / Давление" value="42°C · 756 мм" action={<Thermometer className="h-4 w-4 text-warning" />} />
        </Panel>

        <Panel title="8.4 Связь и mesh-сеть">
          <SettingRow label="Wi‑Fi uplink" value="Стабильно · -58 dBm" action={<Wifi className="h-4 w-4 text-success" />} />
          <SettingRow label="Mesh сеть" value={meshEnabled ? "Самоорганизация активна" : "Отключена"} action={<ToggleButton active={meshEnabled} onClick={() => setMeshEnabled((v) => !v)} />} />
          <SettingRow label="Радиоканал" value="868 MHz · AES-256" />
          <SettingRow label="Failover" value="Автовосстановление маршрута" />
        </Panel>

        <Panel title="8.5 Проверка систем">
          <div className="space-y-3 text-sm">
            {[
              "Питание и силовая часть",
              "Сенсоры обзора",
              "Навигационный стек",
              "Канал связи оператора",
              "Mesh-маршрутизация и резервирование",
            ].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-md border border-border bg-card/40 px-3 py-2">
                <span className="text-foreground">{item}</span>
                <span className={[
                  "rounded-full px-2 py-0.5 text-[10px] font-mono uppercase",
                  systemTested ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground",
                ].join(" ")}>
                  {systemTested ? "готово" : "ожидает"}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button onClick={saveProfile} className="rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary">Применить</button>
            <button onClick={saveProfile} className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20">
              <Save className="h-3.5 w-3.5" /> Сохранить как профиль
            </button>
            {savedHint && <span className="text-xs text-success">Сохранено</span>}
          </div>
        </Panel>

        <Panel title="Сохранённые профили" subtitle="Профили хранятся локально для быстрых переключений между конфигурациями." className="xl:col-span-2">
          {profiles.length === 0 ? (
            <div className="rounded-md border border-dashed border-border bg-card/30 px-3 py-4 text-center text-xs text-muted-foreground">
              Ещё нет сохранённых профилей. Введите имя выше и нажмите «Сохранить как профиль».
            </div>
          ) : (
            <div className="grid gap-2 lg:grid-cols-2">
              {profiles.map((p) => (
                <div key={p.name} className="flex items-center gap-2 rounded-md border border-border bg-card/50 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-foreground">{p.name}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">
                      mesh:{p.meshEnabled ? "on" : "off"} · thermal:{p.thermalEnabled ? "on" : "off"}
                    </div>
                  </div>
                  <button
                    onClick={() => loadProfile(p)}
                    className="rounded-md border border-border bg-card px-2 py-1 text-[11px] font-semibold text-foreground hover:bg-secondary"
                  >
                    Загрузить
                  </button>
                  <button
                    onClick={() => deleteProfile(p.name)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive"
                    title="Удалить"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

function SettingRow({ label, value, action }: { label: string; value: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-2 last:border-b-0">
      <div>
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">{value}</div>
      </div>
      {action}
    </div>
  );
}

function ToggleButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={[
        "inline-flex rounded-full border px-2 py-1 text-[11px] font-medium transition-colors",
        active ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground",
      ].join(" ")}
    >
      {active ? "Вкл" : "Выкл"}
    </button>
  );
}