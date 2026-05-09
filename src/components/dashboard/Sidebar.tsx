import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Map,
  Gamepad2,
  Wrench,
  Brain,
  Plane,
  Camera,
  ScrollText,
  Database,
  Radar,
  Shield,
  SlidersHorizontal,
  FlaskConical,
} from "lucide-react";

type NavItem = { to: string; label: string; icon: typeof Activity; exact?: boolean };

const navItems: NavItem[] = [
  { to: "/", label: "Телеметрия", icon: Activity, exact: true },
  { to: "/missions", label: "Миссии", icon: Map },
  { to: "/instructions", label: "Инструкции", icon: Shield },
  { to: "/commands", label: "Команды", icon: Gamepad2 },
  { to: "/tools", label: "Инструменты", icon: Wrench },
  { to: "/learning", label: "Обучение DQN", icon: Brain },
  { to: "/simulation", label: "Симуляция", icon: FlaskConical },
  { to: "/fleet", label: "Флот", icon: Plane },
  { to: "/camera", label: "Камера", icon: Camera },
  { to: "/events", label: "Журнал", icon: ScrollText },
  { to: "/backups", label: "Бэкапы", icon: Database },
  { to: "/settings", label: "Настройки", icon: SlidersHorizontal },
];

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-md bg-primary/15 text-primary">
          <Radar className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-success pulse-dot" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-wide text-foreground">COBA AI</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Drone v4.1.2
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {navItems.map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to as string}
              className={[
                "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-primary/15 text-primary shadow-[inset_3px_0_0_0_var(--color-primary)]"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
              ].join(" ")}
            >
              <Icon className={["h-4 w-4", active ? "text-primary" : ""].join(" ")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-md border border-border bg-card/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Система
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success pulse-dot" />
              Онлайн
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <div className="text-muted-foreground">CPU</div>
              <div className="font-mono font-semibold text-foreground">34%</div>
            </div>
            <div>
              <div className="text-muted-foreground">RAM</div>
              <div className="font-mono font-semibold text-foreground">2.1 ГБ</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
