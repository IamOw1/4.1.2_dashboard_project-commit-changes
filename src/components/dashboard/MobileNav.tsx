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
  Shield,
  SlidersHorizontal,
} from "lucide-react";

type NavItem = { to: string; label: string; icon: typeof Activity; exact?: boolean };

const items: NavItem[] = [
  { to: "/", label: "Телем.", icon: Activity, exact: true },
  { to: "/missions", label: "Миссии", icon: Map },
  { to: "/instructions", label: "Правила", icon: Shield },
  { to: "/commands", label: "Команды", icon: Gamepad2 },
  { to: "/tools", label: "Тулзы", icon: Wrench },
  { to: "/learning", label: "DQN", icon: Brain },
  { to: "/fleet", label: "Флот", icon: Plane },
  { to: "/camera", label: "Камера", icon: Camera },
  { to: "/events", label: "Журнал", icon: ScrollText },
  { to: "/backups", label: "Бэкап", icon: Database },
  { to: "/settings", label: "Сетап", icon: SlidersHorizontal },
];

export function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="lg:hidden sticky bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur">
      <div className="flex overflow-x-auto">
        {items.map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to as string}
              className={[
                "flex min-w-[72px] flex-col items-center gap-1 px-3 py-2 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              ].join(" ")}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
