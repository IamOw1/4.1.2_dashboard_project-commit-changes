import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel, StatCard } from "@/components/dashboard/Panel";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
} from "recharts";
import { Brain, Cpu, Target, TrendingUp, Play, RotateCcw, Download, FlaskConical } from "lucide-react";
import { useOps } from "@/lib/ops-context";

export const Route = createFileRoute("/learning")({
  head: () => ({
    meta: [
      { title: "Обучение DQN · COBA AI" },
      { name: "description", content: "Глубокое Q-обучение в реальном времени." },
    ],
  }),
  component: LearningPage,
});

const colors = {
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
  fontFamily: "JetBrains Mono, monospace",
};

function LearningPage() {
  const {
    trainingStatus,
    trainingSeries,
    trainingSummary,
    trainingConfig,
    startTraining,
    pauseTraining,
    resetTraining,
    updateTrainingConfig,
  } = useOps();

  const rewardSeries = useMemo(() => trainingSeries.map((item) => ({ ep: item.ep, reward: item.reward })), [trainingSeries]);
  const lossSeries = useMemo(() => trainingSeries.map((item) => ({ ep: item.ep, loss: item.loss })), [trainingSeries]);

  return (
    <>
      <PageHeader
        title="Обучение DQN"
        description="Глубокое Q-обучение · мониторинг тренировки модели в реальном времени"
        badge={trainingStatus === "running" ? "Тренировка активна" : trainingStatus === "paused" ? "Тренировка на паузе" : "Готово к запуску"}
        actions={
          <>
            <select
              value={trainingConfig.simulator}
              onChange={(e) => updateTrainingConfig({ simulator: e.target.value })}
              className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
            >
              {[
                "AirSim",
                "Gazebo",
                "PyBullet",
                "Webots",
                "jMAVSim",
              ].map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <select value={trainingConfig.goal} onChange={(e) => updateTrainingConfig({ goal: e.target.value })} className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground">
              {[
                "Обход препятствий",
                "Быстрый поиск объектов",
                "Поиск людей",
                "Энергоэффективный маршрут",
              ].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <button onClick={resetTraining} className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-secondary">
              <RotateCcw className="h-4 w-4" /> Сброс
            </button>
            <button
              onClick={trainingStatus === "running" ? pauseTraining : startTraining}
              className="inline-flex items-center gap-2 rounded-md bg-success px-3 py-2 text-sm font-semibold text-success-foreground"
            >
              <Play className="h-4 w-4" /> {trainingStatus === "running" ? "Пауза" : "Старт"}
            </button>
            <button onClick={() => updateTrainingConfig({ mode: trainingConfig.mode === "training" ? "replay" : "training" })} className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-secondary">
              <FlaskConical className="h-4 w-4" /> {trainingConfig.mode === "training" ? "Replay миссии" : "Режим обучения"}
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Эпизод" value={trainingSummary.episode} tone="primary" icon={<Brain className="h-4 w-4" />} />
        <StatCard label="Reward" value={trainingSummary.reward.toFixed(2)} tone="success" trend={`Лучший ${trainingSummary.bestReward.toFixed(2)}`} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Loss" value={trainingSummary.loss.toFixed(3)} tone="warning" icon={<Target className="h-4 w-4" />} />
        <StatCard label="GPU" value={trainingStatus === "running" ? "87%" : "14%"} unit="нагрузка" tone="default" icon={<Cpu className="h-4 w-4" />} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel title="Reward по эпизодам" subtitle="Среднее вознаграждение">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={rewardSeries}>
                <defs>
                  <linearGradient id="grad-r" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors.success} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={colors.success} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
                <XAxis dataKey="ep" stroke={colors.text} fontSize={10} tickLine={false} />
                <YAxis stroke={colors.text} fontSize={10} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="reward" stroke={colors.success} strokeWidth={2} fill="url(#grad-r)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Loss функция" subtitle="Снижение со временем">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lossSeries}>
                <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
                <XAxis dataKey="ep" stroke={colors.text} fontSize={10} tickLine={false} />
                <YAxis stroke={colors.text} fontSize={10} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="loss" stroke={colors.destructive} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Гиперпараметры" className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
            {[
              ["Learning rate", "0.0003"],
              ["Discount γ", "0.99"],
              ["ε-greedy", trainingStatus === "running" ? "0.09" : "0.12"],
              ["Batch size", "64"],
              ["Replay buffer", "100 000"],
              ["Target update", "1000"],
              ["Optimizer", "Adam"],
              ["Hidden layers", "256, 256"],
              ["Simulator", trainingConfig.simulator],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
                <div className="mt-0.5 font-mono text-sm font-semibold text-foreground">{v}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Среда обучения">
          <div className="space-y-2 text-sm">
            <Row label="Сцена" value={trainingConfig.terrain} />
            <Row label="Цель" value={trainingConfig.goal} />
            <Row label="Режим" value={trainingConfig.mode === "training" ? "Обучение" : "Повтор миссии"} />
            <Row label="Погода" value={trainingConfig.weather} />
            <Row label="Ветер" value={`${trainingConfig.wind} м/с`} />
            <Row label="Шагов / эп." value="500" />
            <Row label="Время на эп." value="~12 сек" />
            <div className="mt-3 rounded-md border border-success/30 bg-success/10 p-3 text-xs text-success">
              ✓ {trainingStatus === "running" ? "Телеметрия обучения обновляется в реальном времени." : "Подготовьте сценарий и запустите симуляцию."}
            </div>
          </div>
        </Panel>

        <Panel title="Сценарии и результат анализа" className="lg:col-span-3">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-2">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Симуляция сценариев</div>
              {[
                "Лесной поиск при порывистом ветре",
                "Городская застройка с GPS-шумом",
                "Ночная миссия с тепловизором",
              ].map((scenario) => (
                <button key={scenario} onClick={() => updateTrainingConfig({ terrain: scenario })} className="block w-full rounded-md border border-border bg-card px-3 py-2 text-left text-xs text-foreground hover:bg-secondary">
                  {scenario}
                </button>
              ))}
            </div>
            <div className="rounded-md border border-border bg-card/40 p-3 text-xs leading-relaxed text-muted-foreground lg:col-span-2">
              <div className="mb-2 font-semibold text-foreground">Вывод по обучению</div>
              Модель стала лучше удерживать траекторию и быстрее принимать решение при частичных помехах. Следующий прогон стоит выполнить с более высоким ветром и увеличить долю сценариев с плохим сигналом, чтобы повысить устойчивость политики в multi-hop сети.
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary">
                  <Download className="h-3.5 w-3.5" /> Экспорт весов
                </button>
                <button className="inline-flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20">
                  <Brain className="h-3.5 w-3.5" /> Применить опыт к миссиям
                </button>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-1.5 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-mono text-xs font-semibold text-foreground">{value}</span>
    </div>
  );
}
