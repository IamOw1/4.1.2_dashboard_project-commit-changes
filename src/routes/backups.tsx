import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel, StatCard } from "@/components/dashboard/Panel";
import { useOps } from "@/lib/ops-context";
import { Database, Download, Upload, RotateCcw, Trash2, HardDrive } from "lucide-react";

export const Route = createFileRoute("/backups")({
  head: () => ({
    meta: [
      { title: "Бэкапы · COBA AI" },
      { name: "description", content: "Управление резервными копиями системы." },
    ],
  }),
  component: BackupsPage,
});

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function BackupsPage() {
  const { backups, createBackup, restoreBackup, deleteBackup } = useOps();
  const total = backups.length;
  const totalSize = `${(backups.reduce((sum, item) => sum + parseFloat(item.size), 0) / 1000).toFixed(2)} ГБ`;

  const exportBackup = (b: (typeof backups)[number]) => {
    const payload = JSON.stringify({ ...b, exportedAt: new Date().toISOString() }, null, 2);
    downloadBlob(`${b.name}.json`, payload, "application/json");
  };

  const exportReport = (format: "csv" | "json" | "external") => {
    const stats = {
      missionsCompleted: 18,
      avgDurationMin: 24,
      commsIncidents: 3,
      generatedAt: new Date().toISOString(),
      backups: backups.map((b) => ({ id: b.id, name: b.name, size: b.size, type: b.type, createdAt: b.createdAt })),
    };
    if (format === "json" || format === "external") {
      downloadBlob(`mission_report_${Date.now()}.json`, JSON.stringify(stats, null, 2), "application/json");
    } else {
      const header = "id,name,size,type,createdAt\n";
      const body = stats.backups.map((b) => `${b.id},${b.name},${b.size},${b.type},${b.createdAt}`).join("\n");
      downloadBlob(`mission_report_${Date.now()}.csv`, header + body, "text/csv");
    }
  };
  return (
    <>
      <PageHeader
        title="Бэкапы"
        description="Резервное копирование, восстановление и история"
        badge="Авто-бэкап включён"
        actions={
          <>
            <button className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-secondary">
              <Upload className="h-4 w-4" /> Загрузить
            </button>
            <button onClick={() => createBackup("manual")} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
              <Database className="h-4 w-4" /> Создать копию
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Всего копий" value={total} tone="primary" icon={<Database className="h-4 w-4" />} />
        <StatCard label="Общий размер" value={totalSize} tone="default" icon={<HardDrive className="h-4 w-4" />} />
        <StatCard label="Авто" value={backups.filter((b) => b.type === "auto").length} tone="success" />
        <StatCard label="Последний" value="06:00" tone="warning" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel title="Хранилище" subtitle="Использовано 1.19 ГБ из 10 ГБ">
          <div className="space-y-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: "12%" }} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md border border-border bg-card/50 p-2">
                <div className="font-mono text-[10px] text-muted-foreground">Использ.</div>
                <div className="font-mono text-sm font-semibold text-primary">1.19 ГБ</div>
              </div>
              <div className="rounded-md border border-border bg-card/50 p-2">
                <div className="font-mono text-[10px] text-muted-foreground">Свободно</div>
                <div className="font-mono text-sm font-semibold text-success">8.81 ГБ</div>
              </div>
              <div className="rounded-md border border-border bg-card/50 p-2">
                <div className="font-mono text-[10px] text-muted-foreground">Лимит</div>
                <div className="font-mono text-sm font-semibold text-foreground">10 ГБ</div>
              </div>
            </div>
            <div className="rounded-md border border-info/30 bg-info/10 p-3 text-xs text-info">
              ℹ Авто-бэкап выполняется ежедневно в 06:00. Срок хранения: 30 дней.
            </div>
          </div>
        </Panel>

        <Panel title="История бэкапов" className="lg:col-span-2" padded={false}>
          <div className="divide-y divide-border">
            {backups.map((b) => (
              <div key={b.id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/15 text-primary">
                  <Database className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-mono text-sm font-semibold text-foreground">{b.name}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{b.createdAt}</span>
                    <span>·</span>
                    <span>{b.size}</span>
                    <span>·</span>
                    <span
                      className={[
                        "rounded px-1.5 py-0.5 font-mono uppercase tracking-wider",
                        b.type === "auto"
                          ? "bg-success/15 text-success"
                          : "bg-warning/15 text-warning",
                      ].join(" ")}
                    >
                      {b.type}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                <button onClick={() => restoreBackup(b)} className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-primary" title="Восстановить">
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  <button onClick={() => exportBackup(b)} className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" title="Скачать JSON">
                    <Download className="h-4 w-4" />
                  </button>
                  <button onClick={() => deleteBackup(b.id)} className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-destructive" title="Удалить">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Отчёты о миссиях" className="lg:col-span-3">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-md border border-border bg-card/40 p-3">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Статистика</div>
              <div className="mt-2 space-y-2 text-sm text-foreground">
                <div>Выполнено миссий: <span className="font-mono text-primary">18</span></div>
                <div>Средняя длительность: <span className="font-mono">24 мин</span></div>
                <div>Инциденты связи: <span className="font-mono text-warning">3</span></div>
              </div>
            </div>
            <div className="rounded-md border border-border bg-card/40 p-3 lg:col-span-2">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Анализ и экспорт</div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Последние миссии завершены стабильно, но для участков с multi-hop связью стоит включить более ранний переход в резервный маршрут и расширить окно буфера телеметрии.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => exportReport("csv")} className="rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary">Экспорт CSV</button>
                <button onClick={() => exportReport("json")} className="rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary">Экспорт JSON</button>
                <button onClick={() => exportReport("external")} className="rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary">Для внешних систем</button>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}
