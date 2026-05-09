import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shield, MapPinned, Siren, Scale, Plus, ToggleLeft, ToggleRight } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel, StatCard } from "@/components/dashboard/Panel";
import { initialGeoZones } from "@/lib/mock-data";

export const Route = createFileRoute("/instructions")({
  head: () => ({
    meta: [
      { title: "Инструкции · COBA AI" },
      { name: "description", content: "Правила, геозоны и протоколы безопасности для операций COBA AI." },
    ],
  }),
  component: InstructionsPage,
});

const baseRules = [
  { id: "r1", title: "Нельзя входить в restricted-геозоны", group: "Полёты", enabled: true },
  { id: "r2", title: "При заряде < 22% инициировать RTL", group: "Безопасность", enabled: true },
  { id: "r3", title: "Не вести запись над частной территорией без разрешения", group: "Право", enabled: true },
  { id: "r4", title: "При потере связи > 8 сек перейти в LOITER", group: "Связь", enabled: true },
  { id: "r5", title: "Фиксировать все обнаружения человека в журнале", group: "Отчётность", enabled: false },
];

function InstructionsPage() {
  const [rules, setRules] = useState(baseRules);

  return (
    <>
      <PageHeader
        title="Инструкции"
        description="Законы, протоколы и рабочие геозоны для миссий"
        badge="Контур безопасности активен"
        actions={
          <button className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-secondary">
            <Plus className="h-4 w-4" /> Добавить правило
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Активных правил" value={rules.filter((rule) => rule.enabled).length} tone="success" icon={<Shield className="h-4 w-4" />} />
        <StatCard label="Всего геозон" value={initialGeoZones.length} tone="primary" icon={<MapPinned className="h-4 w-4" />} />
        <StatCard label="Протоколов ЧС" value="6" tone="warning" icon={<Siren className="h-4 w-4" />} />
        <StatCard label="Нормативов" value="14" tone="default" icon={<Scale className="h-4 w-4" />} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="Свод правил" className="xl:col-span-2">
          <div className="space-y-3">
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center gap-3 rounded-md border border-border bg-card/40 px-3 py-3">
                <div className="flex-1">
                  <div className="text-sm font-semibold text-foreground">{rule.title}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{rule.group}</div>
                </div>
                <button
                  onClick={() => setRules((prev) => prev.map((item) => item.id === rule.id ? { ...item, enabled: !item.enabled } : item))}
                  className="rounded-md p-1 text-primary"
                  aria-label="Переключить правило"
                >
                  {rule.enabled ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6 text-muted-foreground" />}
                </button>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Геозоны и допуски">
          <div className="space-y-3 text-sm">
            {initialGeoZones.map((zone) => (
              <div key={zone.id} className="rounded-md border border-border bg-card/40 p-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-foreground">{zone.name}</div>
                  <span className={[
                    "rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase",
                    zone.type === "allowed" && "border-success/30 bg-success/10 text-success",
                    zone.type === "restricted" && "border-destructive/30 bg-destructive/10 text-destructive",
                    zone.type === "warning" && "border-warning/30 bg-warning/10 text-warning",
                  ].filter(Boolean).join(" ")}>
                    {zone.type}
                  </span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {zone.polygon.length} точек контура · применяется к миссиям и ручному полёту
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}