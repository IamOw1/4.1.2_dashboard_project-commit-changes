import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel, StatCard } from "@/components/dashboard/Panel";
import { simulators } from "@/lib/sim-catalog";
import { FlaskConical, Plug, PlugZap, CheckCircle2, RefreshCw, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/simulation")({
  head: () => ({
    meta: [
      { title: "Симуляция · COBA AI" },
      { name: "description", content: "Подключение ко всем поддерживаемым симуляторам COBA AI: AirSim, Gazebo, PyBullet, Webots, jMAVSim, Unity, CARLA, Isaac." },
    ],
  }),
  component: SimulationPage,
});

const STORAGE_KEY = "coba.sim.connections.v1";

interface SimConnection {
  host: string;
  port: number;
  apiKey: string;
  status: "offline" | "connecting" | "online";
  lastConnected?: string;
}

function SimulationPage() {
  const [conns, setConns] = useState<Record<string, SimConnection>>(() => {
    const base: Record<string, SimConnection> = {};
    simulators.forEach((s) => {
      base[s.id] = { host: s.defaultHost, port: s.defaultPort, apiKey: "", status: "offline" };
    });
    return base;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setConns((prev) => ({ ...prev, ...JSON.parse(raw) }));
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(conns)); } catch { /* ignore */ }
  }, [conns]);

  const update = (id: string, patch: Partial<SimConnection>) =>
    setConns((p) => ({ ...p, [id]: { ...p[id], ...patch } }));

  const connect = (id: string) => {
    update(id, { status: "connecting" });
    window.setTimeout(() => {
      update(id, { status: "online", lastConnected: new Date().toLocaleTimeString("ru-RU") });
    }, 900);
  };
  const disconnect = (id: string) => update(id, { status: "offline" });

  const onlineCount = Object.values(conns).filter((c) => c.status === "online").length;

  return (
    <>
      <PageHeader
        title="Симуляция"
        description="Подключение ко всем поддерживаемым симуляторам · sim-to-real тренировка политик"
        badge={`${onlineCount}/${simulators.length} подключено`}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Симуляторов" value={simulators.length} tone="primary" icon={<FlaskConical className="h-4 w-4" />} />
        <StatCard label="Подключено" value={onlineCount} tone="success" icon={<CheckCircle2 className="h-4 w-4" />} />
        <StatCard label="Протоколы" value="6" tone="default" />
        <StatCard label="Активная сессия" value={onlineCount > 0 ? "ON" : "—"} tone={onlineCount > 0 ? "success" : "default"} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {simulators.map((s) => {
          const c = conns[s.id];
          return (
            <Panel key={s.id} title={s.vendor} subtitle={s.name}
              actions={
                <span className={[
                  "rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase",
                  c.status === "online" ? "border-success/40 bg-success/10 text-success" :
                  c.status === "connecting" ? "border-warning/40 bg-warning/10 text-warning" :
                  "border-border bg-card text-muted-foreground",
                ].join(" ")}>
                  {c.status === "online" ? "online" : c.status === "connecting" ? "connecting" : "offline"}
                </span>
              }
            >
              <p className="text-xs leading-relaxed text-muted-foreground">{s.description}</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
                <div><span className="text-muted-foreground">Протокол: </span><span className="font-mono text-foreground">{s.protocol}</span></div>
                <div><span className="text-muted-foreground">SDK: </span><span className="font-mono text-foreground">{s.sdk}</span></div>
                <div><span className="text-muted-foreground">Порт: </span><span className="font-mono text-foreground">{s.defaultPort}</span></div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {s.features.map((f) => (
                  <span key={f} className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-muted-foreground">{f}</span>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <input
                  value={c.host}
                  onChange={(e) => update(s.id, { host: e.target.value })}
                  placeholder="host"
                  className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                />
                <input
                  type="number"
                  value={c.port}
                  onChange={(e) => update(s.id, { port: Number(e.target.value) })}
                  placeholder="port"
                  className="rounded-md border border-border bg-background px-2 py-1.5 text-xs font-mono text-foreground outline-none focus:border-primary"
                />
                <input
                  value={c.apiKey}
                  onChange={(e) => update(s.id, { apiKey: e.target.value })}
                  placeholder="API key / token (опц.)"
                  className="col-span-2 rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                />
              </div>

              <div className="mt-3 flex items-center gap-2">
                {c.status === "online" ? (
                  <button onClick={() => disconnect(s.id)} className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20">
                    <Plug className="h-3.5 w-3.5" /> Отключить
                  </button>
                ) : (
                  <button onClick={() => connect(s.id)} disabled={c.status === "connecting"} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
                    {c.status === "connecting" ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <PlugZap className="h-3.5 w-3.5" />}
                    {c.status === "connecting" ? "Подключение…" : "Подключить"}
                  </button>
                )}
                <a href={s.docsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary">
                  <ExternalLink className="h-3 w-3" /> Документация
                </a>
                {c.lastConnected && (
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground">last: {c.lastConnected}</span>
                )}
              </div>
            </Panel>
          );
        })}
      </div>
    </>
  );
}
