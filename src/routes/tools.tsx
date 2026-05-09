import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel, StatCard } from "@/components/dashboard/Panel";
import { initialTools, type Tool } from "@/lib/mock-data";
import { Settings, CircleAlert, CircleCheck, Power, FlaskConical, Save, SlidersHorizontal } from "lucide-react";
import { useOps } from "@/lib/ops-context";

export const Route = createFileRoute("/tools")({
  head: () => ({
    meta: [
      { title: "Инструменты · COBA AI" },
      { name: "description", content: "13 интегрированных модулей системы COBA AI." },
    ],
  }),
  component: ToolsPage,
});

function ToolsPage() {
  const { appendEvent } = useOps();
  const [tools, setTools] = useState<Tool[]>(initialTools);
  const [filter, setFilter] = useState<string>("Все");
  const [sort, setSort] = useState<"alpha" | "usage" | "group">("group");
  const [selectedToolId, setSelectedToolId] = useState<string>(initialTools[0]?.id ?? "");
  const [confidence, setConfidence] = useState(75);
  const [objectSize, setObjectSize] = useState(50);
  const [autoApproach, setAutoApproach] = useState(true);
  const [triplePhoto, setTriplePhoto] = useState(true);
  const [notifyOperator, setNotifyOperator] = useState(false);

  const categories = ["Все", ...Array.from(new Set(tools.map((t) => t.category)))];
  const filtered = useMemo(() => {
    const base = filter === "Все" ? tools : tools.filter((t) => t.category === filter);
    return [...base].sort((a, b) => {
      if (sort === "alpha") return a.name.localeCompare(b.name, "ru");
      if (sort === "usage") return Number(b.enabled) - Number(a.enabled);
      return a.category.localeCompare(b.category, "ru") || a.name.localeCompare(b.name, "ru");
    });
  }, [filter, sort, tools]);
  const selectedTool = tools.find((tool) => tool.id === selectedToolId) ?? filtered[0] ?? tools[0];

  const enabled = tools.filter((t) => t.enabled).length;
  const warnings = tools.filter((t) => t.status === "warning").length;
  const errors = tools.filter((t) => t.status === "error").length;

  const toggle = (id: string) =>
    setTools((arr) => arr.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t)));

  const applySettings = () => {
    appendEvent({ level: "success", source: "Tools", message: `Настройки модуля ${selectedTool?.name} применены к текущей сессии` });
  };

  const saveProfile = () => {
    appendEvent({ level: "info", source: "Tools", message: `Профиль настроек для ${selectedTool?.name} сохранён` });
  };

  const runToolTest = () => {
    appendEvent({
      level: selectedTool?.id === "t2" ? "success" : "info",
      source: "Tools",
      message: `Тест модуля ${selectedTool?.name}: ${selectedTool?.id === "t2" ? "готов к работе" : "проверка завершена без ошибок"}`,
    });
  };

  return (
    <>
      <PageHeader
        title="Инструменты"
        description="13 интегрированных модулей · конфигурация и диагностика"
        badge={`${enabled} активны`}
        actions={
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
            >
              <option value="group">По группам</option>
              <option value="alpha">По алфавиту</option>
              <option value="usage">По активности</option>
            </select>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Всего модулей" value={tools.length} tone="primary" />
        <StatCard label="Активных" value={enabled} tone="success" icon={<CircleCheck className="h-4 w-4" />} />
        <StatCard label="Предупреждения" value={warnings} tone="warning" icon={<CircleAlert className="h-4 w-4" />} />
        <StatCard label="Ошибки" value={errors} tone="destructive" />
      </div>

      <div className="mt-6 mb-3 flex flex-wrap gap-1.5">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={[
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              filter === c
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_0.9fr]">
        <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((t) => (
          <div key={t.id} className="panel relative flex flex-col p-4">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    {t.category}
                  </span>
                  {t.status === "warning" && (
                    <span className="flex items-center gap-1 text-[10px] text-warning">
                      <CircleAlert className="h-3 w-3" /> warn
                    </span>
                  )}
                  {t.status === "error" && (
                    <span className="text-[10px] text-destructive">error</span>
                  )}
                </div>
                <button onClick={() => setSelectedToolId(t.id)} className="mt-1.5 text-left text-sm font-semibold text-foreground hover:text-primary">{t.name}</button>
              </div>
              <button
                onClick={() => {
                  toggle(t.id);
                  appendEvent({ level: "info", source: "Tools", message: `${t.name}: ${t.enabled ? "выключен" : "включён"}` });
                }}
                className={[
                  "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
                  t.enabled ? "bg-primary" : "bg-secondary",
                ].join(" ")}
              >
                <span
                  className={[
                    "inline-block h-5 w-5 transform rounded-full bg-background shadow-md transition-transform",
                    t.enabled ? "translate-x-5" : "translate-x-0.5",
                  ].join(" ")}
                />
              </button>
            </div>
            <p className="mb-3 flex-1 text-xs leading-relaxed text-muted-foreground">{t.description}</p>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span
                className={[
                  "flex items-center gap-1.5 text-[11px] font-medium",
                  t.enabled ? "text-success" : "text-muted-foreground",
                ].join(" ")}
              >
                <Power className="h-3 w-3" />
                {t.enabled ? "Включён" : "Выключен"}
              </span>
              <button onClick={() => setSelectedToolId(t.id)} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary">
                <Settings className="h-3 w-3" /> Настроить
              </button>
            </div>
          </div>
        ))}
        </div>

        <Panel title="Настройки выбранного инструмента" subtitle={selectedTool?.name ?? "Модуль не выбран"}>
          <div className="space-y-4 text-sm">
            <div className="rounded-md border border-border bg-card/40 p-3 text-xs leading-relaxed text-muted-foreground">
              <div className="mb-1 font-semibold text-foreground">Описание</div>
              {selectedTool?.description}
              <div className="mt-3 font-semibold text-foreground">Пример</div>
              Для ObjectDetection: выбрать типы объектов, размер, порог уверенности, затем применить и запустить тест без реального воздействия.
            </div>

            <div className="grid gap-3">
              <label className="text-xs text-muted-foreground">Минимальный размер объекта: <span className="font-mono text-foreground">{objectSize}px</span></label>
              <input type="range" min={20} max={120} value={objectSize} onChange={(e) => setObjectSize(Number(e.target.value))} className="w-full" />
              <label className="text-xs text-muted-foreground">Порог уверенности: <span className="font-mono text-foreground">{confidence}%</span></label>
              <input type="range" min={40} max={95} value={confidence} onChange={(e) => setConfidence(Number(e.target.value))} className="w-full" />
            </div>

            <div className="space-y-2 rounded-md border border-border bg-card/40 p-3 text-xs">
              {[
                [autoApproach, setAutoApproach, "Автоматически приближаться к обнаруженному объекту"],
                [triplePhoto, setTriplePhoto, "Делать серию из 3 фото при обнаружении"],
                [notifyOperator, setNotifyOperator, "Отправлять уведомление оператору"],
              ].map(([value, setter, label]) => (
                <label key={label as string} className="flex items-center gap-2 text-foreground">
                  <input type="checkbox" checked={value as boolean} onChange={(e) => (setter as (v: boolean) => void)(e.target.checked)} />
                  {label as string}
                </label>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={runToolTest} className="inline-flex items-center justify-center gap-2 rounded-md border border-success/40 bg-success/10 px-3 py-2 text-xs font-semibold text-success hover:bg-success/20">
                <FlaskConical className="h-3.5 w-3.5" /> Запустить тест
              </button>
              <button onClick={applySettings} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90">
                <Settings className="h-3.5 w-3.5" /> Применить
              </button>
            </div>
            <button onClick={saveProfile} className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary">
              <Save className="h-3.5 w-3.5" /> Сохранить как профиль
            </button>
          </div>
        </Panel>
      </div>
    </>
  );
}
