import type { ReactNode } from "react";

export function Panel({
  title,
  subtitle,
  actions,
  children,
  className = "",
  padded = true,
}: {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={`panel relative overflow-hidden ${className}`}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
          <div>
            {title && (
              <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-sm font-semibold text-foreground">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  unit,
  trend,
  tone = "default",
  icon,
}: {
  label: string;
  value: string | number;
  unit?: string;
  trend?: string;
  tone?: "default" | "success" | "warning" | "destructive" | "primary";
  icon?: ReactNode;
}) {
  const toneClass = {
    default: "text-foreground",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
    primary: "text-primary",
  }[tone];

  return (
    <div className="panel relative overflow-hidden p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {icon && <span className={toneClass}>{icon}</span>}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className={`font-mono text-2xl font-bold tabular-nums ${toneClass}`}>
          {value}
        </span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
      {trend && <div className="mt-1 text-[11px] text-muted-foreground">{trend}</div>}
    </div>
  );
}
