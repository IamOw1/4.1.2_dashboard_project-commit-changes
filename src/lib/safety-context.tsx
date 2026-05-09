// SafetyContext: правила, геозоны, аварийные протоколы и ИИ-предложения.
// Хранится в localStorage; стартовое состояние подмешивает данные из mock-data.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { initialGeoZones, initialDetections, initialMissions, type GeoZone } from "@/lib/mock-data";

export type RuleAction = "RTL" | "LOITER" | "EMERGENCY" | "NOTIFY" | "LOG" | "LAND";
export type RuleOperator = "<" | ">" | "==" | "!=";

export interface SafetyRule {
  id: string;
  title: string;
  group: string;
  field: string;          // например battery, signal, altitude, geofence
  operator: RuleOperator;
  value: number | string;
  action: RuleAction;
  priority: "low" | "normal" | "high" | "critical";
  enabled: boolean;
  createdAt: string;
}

export interface ProtocolStep {
  id: string;
  action: RuleAction;
  delaySec: number;
  note?: string;
}

export interface EmergencyProtocol {
  id: string;
  name: string;
  trigger: string;
  description: string;
  steps: ProtocolStep[];
  enabled: boolean;
}

export interface AISuggestion {
  id: string;
  kind: "rule" | "geozone" | "protocol";
  title: string;
  reason: string;
  confidence: number;
  payload: Partial<SafetyRule> | Partial<GeoZone> | Partial<EmergencyProtocol>;
}

const STORAGE_KEY = "coba.safety.v1";

const seedRules: SafetyRule[] = [
  { id: "r-seed-1", title: "Запрет входа в restricted-геозоны", group: "Полёты", field: "geofence", operator: "==", value: "restricted", action: "RTL", priority: "critical", enabled: true, createdAt: "2025-04-19" },
  { id: "r-seed-2", title: "RTL при батарее < 22%", group: "Безопасность", field: "battery", operator: "<", value: 22, action: "RTL", priority: "critical", enabled: true, createdAt: "2025-04-19" },
  { id: "r-seed-3", title: "LOITER при потере связи > 8с", group: "Связь", field: "linkLost", operator: ">", value: 8, action: "LOITER", priority: "high", enabled: true, createdAt: "2025-04-19" },
  { id: "r-seed-4", title: "Не вести запись над частной территорией", group: "Право", field: "privateZone", operator: "==", value: "true", action: "LOG", priority: "normal", enabled: true, createdAt: "2025-04-19" },
  { id: "r-seed-5", title: "Фиксировать обнаружения человека", group: "Отчётность", field: "detection.person", operator: "==", value: "true", action: "LOG", priority: "normal", enabled: false, createdAt: "2025-04-19" },
];

const seedProtocols: EmergencyProtocol[] = [
  {
    id: "p-seed-1", name: "Критическая батарея",
    trigger: "battery < 15%",
    description: "Немедленный RTL с переходом в посадку при невозможности достичь базы.",
    steps: [
      { id: "s1", action: "NOTIFY", delaySec: 0, note: "Сигнал оператору и в журнал" },
      { id: "s2", action: "RTL", delaySec: 1, note: "Возврат на точку дома" },
      { id: "s3", action: "LAND", delaySec: 0, note: "Если базы не достичь — посадка в безопасной точке" },
    ],
    enabled: true,
  },
  {
    id: "p-seed-2", name: "Потеря связи",
    trigger: "uplink lost > 8s",
    description: "Удержание позиции, попытка mesh-relay, через 30с — RTL.",
    steps: [
      { id: "s1", action: "LOITER", delaySec: 0, note: "Зависнуть в текущей точке" },
      { id: "s2", action: "NOTIFY", delaySec: 5, note: "Авто-уведомление по всем каналам" },
      { id: "s3", action: "RTL", delaySec: 30, note: "Возврат, если связь не восстановлена" },
    ],
    enabled: true,
  },
  {
    id: "p-seed-3", name: "Нарушение геозоны",
    trigger: "enter restricted zone",
    description: "Аварийная остановка движения и разворот.",
    steps: [
      { id: "s1", action: "LOITER", delaySec: 0 },
      { id: "s2", action: "EMERGENCY", delaySec: 1, note: "Перевод в аварийный режим" },
      { id: "s3", action: "RTL", delaySec: 2 },
    ],
    enabled: true,
  },
];

interface SafetyState {
  rules: SafetyRule[];
  geozones: GeoZone[];
  protocols: EmergencyProtocol[];
}

interface SafetyContextValue extends SafetyState {
  addRule: (rule: Omit<SafetyRule, "id" | "createdAt">) => void;
  removeRule: (id: string) => void;
  toggleRule: (id: string) => void;
  addGeoZone: (zone: Omit<GeoZone, "id">) => void;
  removeGeoZone: (id: string) => void;
  addProtocol: (proto: Omit<EmergencyProtocol, "id">) => void;
  removeProtocol: (id: string) => void;
  toggleProtocol: (id: string) => void;
  suggestions: AISuggestion[];
  applySuggestion: (s: AISuggestion) => void;
  dismissSuggestion: (id: string) => void;
}

const SafetyContext = createContext<SafetyContextValue | null>(null);

export function SafetyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SafetyState>({
    rules: seedRules,
    geozones: initialGeoZones,
    protocols: seedProtocols,
  });
  const [dismissed, setDismissed] = useState<string[]>([]);

  // load
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
      /* ignore */
    }
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, dismissed }));
    } catch {
      /* ignore */
    }
  }, [state, dismissed]);

  const addRule: SafetyContextValue["addRule"] = (rule) =>
    setState((s) => ({
      ...s,
      rules: [
        { ...rule, id: `r-${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10) },
        ...s.rules,
      ],
    }));
  const removeRule = (id: string) =>
    setState((s) => ({ ...s, rules: s.rules.filter((r) => r.id !== id) }));
  const toggleRule = (id: string) =>
    setState((s) => ({ ...s, rules: s.rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)) }));

  const addGeoZone: SafetyContextValue["addGeoZone"] = (zone) =>
    setState((s) => ({ ...s, geozones: [...s.geozones, { ...zone, id: `gz-${Date.now()}` }] }));
  const removeGeoZone = (id: string) =>
    setState((s) => ({ ...s, geozones: s.geozones.filter((z) => z.id !== id) }));

  const addProtocol: SafetyContextValue["addProtocol"] = (proto) =>
    setState((s) => ({ ...s, protocols: [{ ...proto, id: `p-${Date.now()}` }, ...s.protocols] }));
  const removeProtocol = (id: string) =>
    setState((s) => ({ ...s, protocols: s.protocols.filter((p) => p.id !== id) }));
  const toggleProtocol = (id: string) =>
    setState((s) => ({ ...s, protocols: s.protocols.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)) }));

  // Анализ миссий и обнаружений → формирование предложений ИИ
  const suggestions = useMemo<AISuggestion[]>(() => {
    const list: AISuggestion[] = [];

    // 1. Если есть failed/paused миссии — предложить более ранний RTL
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
          enabled: true,
        } satisfies Partial<SafetyRule>,
      });
    }

    // 2. Если есть fire-обнаружения — предложить warning-зону
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
            [f.position[0] - 0.002, f.position[1] - 0.002],
            [f.position[0] + 0.002, f.position[1] - 0.002],
            [f.position[0] + 0.002, f.position[1] + 0.002],
            [f.position[0] - 0.002, f.position[1] + 0.002],
          ],
        } satisfies Partial<GeoZone>,
      });
    }

    // 3. Если есть detected-persons — предложить включить правило логирования
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
          enabled: true,
        } satisfies Partial<SafetyRule>,
      });
    }

    // 4. Многомиссионные дроны → предложить протокол синхронной посадки роя
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
            { id: "s3", action: "LAND", delaySec: 5, note: "Синхронная посадка" },
          ],
        } satisfies Partial<EmergencyProtocol>,
      });
    }

    return list.filter((s) => !dismissed.includes(s.id));
  }, [dismissed]);

  const applySuggestion = useCallback(
    (s: AISuggestion) => {
      if (s.kind === "rule") {
        addRule(s.payload as Omit<SafetyRule, "id" | "createdAt">);
      } else if (s.kind === "geozone") {
        addGeoZone(s.payload as Omit<GeoZone, "id">);
      } else if (s.kind === "protocol") {
        addProtocol(s.payload as Omit<EmergencyProtocol, "id">);
      }
      setDismissed((d) => [...d, s.id]);
    },
    [],
  );
  const dismissSuggestion = (id: string) => setDismissed((d) => [...d, id]);

  const value: SafetyContextValue = {
    ...state,
    addRule,
    removeRule,
    toggleRule,
    addGeoZone,
    removeGeoZone,
    addProtocol,
    removeProtocol,
    toggleProtocol,
    suggestions,
    applySuggestion,
    dismissSuggestion,
  };

  return <SafetyContext.Provider value={value}>{children}</SafetyContext.Provider>;
}

export function useSafety() {
  const ctx = useContext(SafetyContext);
  if (!ctx) throw new Error("useSafety must be used within SafetyProvider");
  return ctx;
}
