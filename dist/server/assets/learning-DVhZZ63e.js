import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useMemo } from "react";
import { P as PageHeader, S as StatCard, a as Panel } from "./Panel-DCNe0G5R.js";
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area, LineChart, Line } from "recharts";
import { RotateCcw, Play, FlaskConical, Brain, TrendingUp, Target, Cpu, Download } from "lucide-react";
import { u as useOps } from "./router-BHqUf-SS.js";
import "@tanstack/react-router";
import "@radix-ui/react-popover";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-slot";
import "class-variance-authority";
const colors = {
  success: "oklch(0.72 0.18 145)",
  destructive: "oklch(0.65 0.24 25)",
  grid: "oklch(0.30 0.025 245 / 0.5)",
  text: "oklch(0.68 0.02 240)"
};
const tooltipStyle = {
  backgroundColor: "oklch(0.20 0.025 245)",
  border: "1px solid oklch(0.30 0.025 245)",
  borderRadius: 8,
  fontSize: 12,
  fontFamily: "JetBrains Mono, monospace"
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
    updateTrainingConfig
  } = useOps();
  const rewardSeries = useMemo(() => trainingSeries.map((item) => ({
    ep: item.ep,
    reward: item.reward
  })), [trainingSeries]);
  const lossSeries = useMemo(() => trainingSeries.map((item) => ({
    ep: item.ep,
    loss: item.loss
  })), [trainingSeries]);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PageHeader, { title: "Обучение DQN", description: "Глубокое Q-обучение · мониторинг тренировки модели в реальном времени", badge: trainingStatus === "running" ? "Тренировка активна" : trainingStatus === "paused" ? "Тренировка на паузе" : "Готово к запуску", actions: /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("select", { value: trainingConfig.simulator, onChange: (e) => updateTrainingConfig({
        simulator: e.target.value
      }), className: "rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground", children: ["AirSim", "Gazebo", "PyBullet", "Webots", "jMAVSim"].map((item) => /* @__PURE__ */ jsx("option", { value: item, children: item }, item)) }),
      /* @__PURE__ */ jsx("select", { value: trainingConfig.goal, onChange: (e) => updateTrainingConfig({
        goal: e.target.value
      }), className: "rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground", children: ["Обход препятствий", "Быстрый поиск объектов", "Поиск людей", "Энергоэффективный маршрут"].map((item) => /* @__PURE__ */ jsx("option", { value: item, children: item }, item)) }),
      /* @__PURE__ */ jsxs("button", { onClick: resetTraining, className: "inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-secondary", children: [
        /* @__PURE__ */ jsx(RotateCcw, { className: "h-4 w-4" }),
        " Сброс"
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: trainingStatus === "running" ? pauseTraining : startTraining, className: "inline-flex items-center gap-2 rounded-md bg-success px-3 py-2 text-sm font-semibold text-success-foreground", children: [
        /* @__PURE__ */ jsx(Play, { className: "h-4 w-4" }),
        " ",
        trainingStatus === "running" ? "Пауза" : "Старт"
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: () => updateTrainingConfig({
        mode: trainingConfig.mode === "training" ? "replay" : "training"
      }), className: "inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-secondary", children: [
        /* @__PURE__ */ jsx(FlaskConical, { className: "h-4 w-4" }),
        " ",
        trainingConfig.mode === "training" ? "Replay миссии" : "Режим обучения"
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 lg:grid-cols-4", children: [
      /* @__PURE__ */ jsx(StatCard, { label: "Эпизод", value: trainingSummary.episode, tone: "primary", icon: /* @__PURE__ */ jsx(Brain, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx(StatCard, { label: "Reward", value: trainingSummary.reward.toFixed(2), tone: "success", trend: `Лучший ${trainingSummary.bestReward.toFixed(2)}`, icon: /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx(StatCard, { label: "Loss", value: trainingSummary.loss.toFixed(3), tone: "warning", icon: /* @__PURE__ */ jsx(Target, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx(StatCard, { label: "GPU", value: trainingStatus === "running" ? "87%" : "14%", unit: "нагрузка", tone: "default", icon: /* @__PURE__ */ jsx(Cpu, { className: "h-4 w-4" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 grid gap-4 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsx(Panel, { title: "Reward по эпизодам", subtitle: "Среднее вознаграждение", children: /* @__PURE__ */ jsx("div", { className: "h-64", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(AreaChart, { data: rewardSeries, children: [
        /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "grad-r", x1: "0", y1: "0", x2: "0", y2: "1", children: [
          /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: colors.success, stopOpacity: 0.5 }),
          /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: colors.success, stopOpacity: 0 })
        ] }) }),
        /* @__PURE__ */ jsx(CartesianGrid, { stroke: colors.grid, strokeDasharray: "3 3" }),
        /* @__PURE__ */ jsx(XAxis, { dataKey: "ep", stroke: colors.text, fontSize: 10, tickLine: false }),
        /* @__PURE__ */ jsx(YAxis, { stroke: colors.text, fontSize: 10, tickLine: false }),
        /* @__PURE__ */ jsx(Tooltip, { contentStyle: tooltipStyle }),
        /* @__PURE__ */ jsx(Area, { type: "monotone", dataKey: "reward", stroke: colors.success, strokeWidth: 2, fill: "url(#grad-r)" })
      ] }) }) }) }),
      /* @__PURE__ */ jsx(Panel, { title: "Loss функция", subtitle: "Снижение со временем", children: /* @__PURE__ */ jsx("div", { className: "h-64", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(LineChart, { data: lossSeries, children: [
        /* @__PURE__ */ jsx(CartesianGrid, { stroke: colors.grid, strokeDasharray: "3 3" }),
        /* @__PURE__ */ jsx(XAxis, { dataKey: "ep", stroke: colors.text, fontSize: 10, tickLine: false }),
        /* @__PURE__ */ jsx(YAxis, { stroke: colors.text, fontSize: 10, tickLine: false }),
        /* @__PURE__ */ jsx(Tooltip, { contentStyle: tooltipStyle }),
        /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "loss", stroke: colors.destructive, strokeWidth: 2, dot: false })
      ] }) }) }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-4 lg:grid-cols-3", children: [
      /* @__PURE__ */ jsx(Panel, { title: "Гиперпараметры", className: "lg:col-span-2", children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3", children: [["Learning rate", "0.0003"], ["Discount γ", "0.99"], ["ε-greedy", trainingStatus === "running" ? "0.09" : "0.12"], ["Batch size", "64"], ["Replay buffer", "100 000"], ["Target update", "1000"], ["Optimizer", "Adam"], ["Hidden layers", "256, 256"], ["Simulator", trainingConfig.simulator]].map(([k, v]) => /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "font-mono text-[10px] uppercase tracking-wider text-muted-foreground", children: k }),
        /* @__PURE__ */ jsx("div", { className: "mt-0.5 font-mono text-sm font-semibold text-foreground", children: v })
      ] }, k)) }) }),
      /* @__PURE__ */ jsx(Panel, { title: "Среда обучения", children: /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-sm", children: [
        /* @__PURE__ */ jsx(Row, { label: "Сцена", value: trainingConfig.terrain }),
        /* @__PURE__ */ jsx(Row, { label: "Цель", value: trainingConfig.goal }),
        /* @__PURE__ */ jsx(Row, { label: "Режим", value: trainingConfig.mode === "training" ? "Обучение" : "Повтор миссии" }),
        /* @__PURE__ */ jsx(Row, { label: "Погода", value: trainingConfig.weather }),
        /* @__PURE__ */ jsx(Row, { label: "Ветер", value: `${trainingConfig.wind} м/с` }),
        /* @__PURE__ */ jsx(Row, { label: "Шагов / эп.", value: "500" }),
        /* @__PURE__ */ jsx(Row, { label: "Время на эп.", value: "~12 сек" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 rounded-md border border-success/30 bg-success/10 p-3 text-xs text-success", children: [
          "✓ ",
          trainingStatus === "running" ? "Телеметрия обучения обновляется в реальном времени." : "Подготовьте сценарий и запустите симуляцию."
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(Panel, { title: "Сценарии и результат анализа", className: "lg:col-span-3", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-4 lg:grid-cols-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("div", { className: "font-mono text-[10px] uppercase tracking-wider text-muted-foreground", children: "Симуляция сценариев" }),
          ["Лесной поиск при порывистом ветре", "Городская застройка с GPS-шумом", "Ночная миссия с тепловизором"].map((scenario) => /* @__PURE__ */ jsx("button", { onClick: () => updateTrainingConfig({
            terrain: scenario
          }), className: "block w-full rounded-md border border-border bg-card px-3 py-2 text-left text-xs text-foreground hover:bg-secondary", children: scenario }, scenario))
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-border bg-card/40 p-3 text-xs leading-relaxed text-muted-foreground lg:col-span-2", children: [
          /* @__PURE__ */ jsx("div", { className: "mb-2 font-semibold text-foreground", children: "Вывод по обучению" }),
          "Модель стала лучше удерживать траекторию и быстрее принимать решение при частичных помехах. Следующий прогон стоит выполнить с более высоким ветром и увеличить долю сценариев с плохим сигналом, чтобы повысить устойчивость политики в multi-hop сети.",
          /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [
            /* @__PURE__ */ jsxs("button", { className: "inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary", children: [
              /* @__PURE__ */ jsx(Download, { className: "h-3.5 w-3.5" }),
              " Экспорт весов"
            ] }),
            /* @__PURE__ */ jsxs("button", { className: "inline-flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20", children: [
              /* @__PURE__ */ jsx(Brain, { className: "h-3.5 w-3.5" }),
              " Применить опыт к миссиям"
            ] })
          ] })
        ] })
      ] }) })
    ] })
  ] });
}
function Row({
  label,
  value
}) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-border/50 py-1.5 last:border-0", children: [
    /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("span", { className: "font-mono text-xs font-semibold text-foreground", children: value })
  ] });
}
export {
  LearningPage as component
};
