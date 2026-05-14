import { Bell, Search, Wifi, Battery, Satellite, Server, Gamepad2, Plug } from "lucide-react";
import { useEffect, useState } from "react";
import { useOps } from "@/lib/ops-context";
import { pingBackend, getApiBaseUrl } from "@/lib/api-client";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { HELP } from "@/lib/help-texts";
import { Button } from "@/components/ui/button";

function useBackendStatus() {
  const [online, setOnline] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    const check = async () => {
      const ok = await pingBackend();
      if (alive) setOnline(ok);
    };
    check();
    const id = setInterval(check, 6000);
    return () => { alive = false; clearInterval(id); };
  }, []);
  return online;
}

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function Header() {
  const now = useClock();
  const { trainingStatus, unreadEvents, demoMode, toggleDemoMode } = useOps();
  const backendOnline = useBackendStatus();
  const time = now?.toLocaleTimeString("ru-RU", { hour12: false }) ?? "--:--:--";
  const date = now?.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }) ?? "—";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/85 px-4 backdrop-blur lg:px-6">
      <div className="flex items-center gap-2 lg:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary">
          <Satellite className="h-4 w-4" />
        </div>
        <span className="text-sm font-bold">COBA AI</span>
      </div>

      <div className="hidden md:flex items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-1.5 w-72">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Поиск миссий, команд, дронов…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <kbd className="hidden font-mono text-[10px] text-muted-foreground md:inline">⌘K</kbd>
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Переключатель Демо/Реальный */}
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted p-1">
          <Button
            variant={demoMode ? "default" : "outline"}
            size="sm"
            onClick={() => toggleDemoMode(true)}
            className={`h-7 px-3 text-xs ${demoMode ? "bg-green-600 hover:bg-green-700" : ""}`}
          >
            <Gamepad2 className="mr-1 h-3 w-3" />
            Демо
          </Button>
          <Button
            variant={!demoMode ? "default" : "outline"}
            size="sm"
            onClick={() => toggleDemoMode(false)}
            className={`h-7 px-3 text-xs ${!demoMode ? "bg-blue-600 hover:bg-blue-700" : ""}`}
          >
            <Plug className="mr-1 h-3 w-3" />
            Реальный
          </Button>
        </div>

        {/* backend status */}
        <div
          className="hidden items-center gap-1.5 rounded-md border border-border bg-card/60 px-2.5 py-1.5 md:flex"
          title={`API: ${getApiBaseUrl()}`}
        >
          <Server className={`h-3.5 w-3.5 ${backendOnline ? "text-success" : backendOnline === false ? "text-muted-foreground" : "text-warning"}`} />
          <span className="text-[11px] text-muted-foreground">Бэкенд</span>
          <span className={`font-mono text-xs font-semibold ${backendOnline ? "text-success" : backendOnline === false ? "text-muted-foreground" : "text-warning"}`}>
            {backendOnline === null ? "…" : backendOnline ? "ON" : "MOCK"}
          </span>
          <HelpTooltip text={HELP.system.backendStatus} />
        </div>

        {/* live status pills */}
        <div className="hidden items-center gap-2 md:flex">
          <StatusPill icon={<Wifi className="h-3.5 w-3.5" />} label="Связь" value="89%" tone="success" />
          <StatusPill icon={<Battery className="h-3.5 w-3.5" />} label="Батарея" value="64%" tone="warning" />
          <StatusPill icon={<Satellite className="h-3.5 w-3.5" />} label="GPS" value="14 спут." tone="success" />
          <StatusPill
            icon={<Satellite className="h-3.5 w-3.5" />}
            label="Обучение"
            value={trainingStatus === "running" ? "RUN" : trainingStatus === "paused" ? "PAUSE" : "IDLE"}
            tone={trainingStatus === "running" ? "success" : trainingStatus === "paused" ? "warning" : "destructive"}
          />
        </div>

        <div className="hidden text-right lg:block">
          <div className="font-mono text-sm font-semibold text-foreground tabular-nums">{time}</div>
          <div className="text-[11px] text-muted-foreground">{date}</div>
        </div>

        <button className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <Bell className="h-4 w-4" />
          {unreadEvents > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 font-mono text-[9px] text-destructive-foreground">
              {Math.min(unreadEvents, 9)}
            </span>
          )}
        </button>

        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-primary to-accent font-mono text-sm font-bold text-primary-foreground">
          ОП
        </div>
      </div>
    </header>
  );
}

function StatusPill({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "success" | "warning" | "destructive";
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : "text-destructive";
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-card/60 px-2.5 py-1.5">
      <span className={toneClass}>{icon}</span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className={`font-mono text-xs font-semibold ${toneClass}`}>{value}</span>
    </div>
  );
}
