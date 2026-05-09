import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  initialBackups,
  initialEvents,
  type Backup,
  type EventLog,
} from "@/lib/mock-data";

export interface TrainingPoint {
  ep: number;
  reward: number;
  loss: number;
}

type TrainingStatus = "idle" | "running" | "paused";

interface TrainingConfig {
  simulator: string;
  goal: string;
  mode: "training" | "replay";
  weather: string;
  wind: number;
  terrain: string;
}

interface OpsContextValue {
  events: EventLog[];
  backups: Backup[];
  trainingStatus: TrainingStatus;
  trainingSeries: TrainingPoint[];
  trainingConfig: TrainingConfig;
  trainingSummary: {
    episode: number;
    reward: number;
    loss: number;
    bestReward: number;
  };
  unreadEvents: number;
  appendEvent: (event: Omit<EventLog, "id" | "timestamp">) => void;
  createBackup: (type?: Backup["type"]) => void;
  restoreBackup: (backup: Backup) => void;
  deleteBackup: (backupId: string) => void;
  startTraining: () => void;
  pauseTraining: () => void;
  resetTraining: () => void;
  updateTrainingConfig: (patch: Partial<TrainingConfig>) => void;
  markEventsSeen: () => void;
}

const baseTrainingSeries = Array.from({ length: 24 }, (_, index) => ({
  ep: index + 1,
  reward: Number((0.28 + Math.log(index + 2) * 0.16).toFixed(3)),
  loss: Number(Math.max(0.08, 1.42 - Math.log(index + 2) * 0.24).toFixed(3)),
}));

const OpsContext = createContext<OpsContextValue | null>(null);

export function OpsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<EventLog[]>(initialEvents);
  const [backups, setBackups] = useState<Backup[]>(initialBackups);
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>("idle");
  const [trainingSeries, setTrainingSeries] = useState<TrainingPoint[]>(baseTrainingSeries);
  const [trainingConfig, setTrainingConfig] = useState<TrainingConfig>({
    simulator: "AirSim",
    goal: "Обход препятствий",
    mode: "training",
    weather: "Переменная облачность",
    wind: 6,
    terrain: "Городской квартал",
  });
  const [seenCount, setSeenCount] = useState(initialEvents.length);

  const appendEvent = (event: Omit<EventLog, "id" | "timestamp">) => {
    const next: EventLog = {
      id: `evt-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString("ru-RU", { hour12: false }),
      ...event,
    };
    setEvents((prev) => [next, ...prev].slice(0, 120));
  };

  const createBackup = (type: Backup["type"] = "manual") => {
    const stamp = new Date();
    const next: Backup = {
      id: `b-${stamp.getTime()}`,
      name: `backup_${stamp.toISOString().slice(0, 19).replace(/[:T]/g, "_")}`,
      size: `${220 + Math.floor(Math.random() * 40)} МБ`,
      type,
      createdAt: stamp.toLocaleString("ru-RU"),
    };
    setBackups((prev) => [next, ...prev]);
    appendEvent({ level: "success", source: "Backup", message: `Создана резервная копия ${next.name}` });
  };

  const restoreBackup = (backup: Backup) => {
    appendEvent({ level: "warning", source: "Backup", message: `Выполнено восстановление из ${backup.name}` });
  };

  const deleteBackup = (backupId: string) => {
    setBackups((prev) => prev.filter((item) => item.id !== backupId));
    appendEvent({ level: "info", source: "Backup", message: `Копия ${backupId} удалена из активного списка` });
  };

  const startTraining = () => {
    setTrainingStatus("running");
    appendEvent({
      level: "info",
      source: "Training",
      message: `Запуск обучения: ${trainingConfig.simulator} · цель «${trainingConfig.goal}»`,
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

  const updateTrainingConfig = (patch: Partial<TrainingConfig>) => {
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
      message: `Эпизод ${last.ep}: reward ${last.reward.toFixed(2)}, loss ${last.loss.toFixed(3)}`,
    });
  }, [trainingSeries, trainingStatus]);

  const trainingSummary = useMemo(() => {
    const last = trainingSeries[trainingSeries.length - 1] ?? { ep: 0, reward: 0, loss: 0 };
    const bestReward = Math.max(...trainingSeries.map((item) => item.reward));
    return {
      episode: last.ep,
      reward: last.reward,
      loss: last.loss,
      bestReward,
    };
  }, [trainingSeries]);

  const value = useMemo<OpsContextValue>(
    () => ({
      events,
      backups,
      trainingStatus,
      trainingSeries,
      trainingConfig,
      trainingSummary,
      unreadEvents: Math.max(0, events.length - seenCount),
      appendEvent,
      createBackup,
      restoreBackup,
      deleteBackup,
      startTraining,
      pauseTraining,
      resetTraining,
      updateTrainingConfig,
      markEventsSeen,
    }),
    [events, backups, trainingStatus, trainingSeries, trainingConfig, trainingSummary, seenCount],
  );

  return <OpsContext.Provider value={value}>{children}</OpsContext.Provider>;
}

export function useOps() {
  const ctx = useContext(OpsContext);
  if (!ctx) throw new Error("useOps must be used within OpsProvider");
  return ctx;
}