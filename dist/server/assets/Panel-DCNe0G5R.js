import { jsxs, jsx } from "react/jsx-runtime";
function PageHeader({
  title,
  description,
  actions,
  badge
}) {
  return /* @__PURE__ */ jsxs("div", { className: "mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      badge && /* @__PURE__ */ jsxs("div", { className: "mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary", children: [
        /* @__PURE__ */ jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-primary pulse-dot" }),
        badge
      ] }),
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight text-foreground sm:text-3xl", children: title }),
      description && /* @__PURE__ */ jsx("p", { className: "mt-1 max-w-2xl text-sm text-muted-foreground", children: description })
    ] }),
    actions && /* @__PURE__ */ jsx("div", { className: "flex flex-wrap items-center gap-2", children: actions })
  ] });
}
function Panel({
  title,
  subtitle,
  actions,
  children,
  className = "",
  padded = true
}) {
  return /* @__PURE__ */ jsxs("section", { className: `panel relative overflow-hidden ${className}`, children: [
    (title || actions) && /* @__PURE__ */ jsxs("header", { className: "flex items-center justify-between gap-3 border-b border-border px-5 py-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        title && /* @__PURE__ */ jsx("h3", { className: "font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground", children: title }),
        subtitle && /* @__PURE__ */ jsx("p", { className: "mt-0.5 text-sm font-semibold text-foreground", children: subtitle })
      ] }),
      actions && /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: actions })
    ] }),
    /* @__PURE__ */ jsx("div", { className: padded ? "p-5" : "", children })
  ] });
}
function StatCard({
  label,
  value,
  unit,
  trend,
  tone = "default",
  icon
}) {
  const toneClass = {
    default: "text-foreground",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
    primary: "text-primary"
  }[tone];
  return /* @__PURE__ */ jsxs("div", { className: "panel relative overflow-hidden p-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("span", { className: "font-mono text-[10px] uppercase tracking-wider text-muted-foreground", children: label }),
      icon && /* @__PURE__ */ jsx("span", { className: toneClass, children: icon })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-2 flex items-baseline gap-1.5", children: [
      /* @__PURE__ */ jsx("span", { className: `font-mono text-2xl font-bold tabular-nums ${toneClass}`, children: value }),
      unit && /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: unit })
    ] }),
    trend && /* @__PURE__ */ jsx("div", { className: "mt-1 text-[11px] text-muted-foreground", children: trend })
  ] });
}
export {
  PageHeader as P,
  StatCard as S,
  Panel as a
};
