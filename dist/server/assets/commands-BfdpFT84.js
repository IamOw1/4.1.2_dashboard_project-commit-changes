import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState, useRef } from "react";
import { P as PageHeader, a as Panel } from "./Panel-DCNe0G5R.js";
import { H as HelpTooltip, j as HELP, a as api } from "./router-BHqUf-SS.js";
import { AlertOctagon, Power, PowerOff, ArrowUpFromLine, ArrowDownToLine, Home, Pause, Send, Trash2 } from "lucide-react";
import "@tanstack/react-router";
import "@radix-ui/react-popover";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-slot";
import "class-variance-authority";
const quickCommands = [{
  id: "arm",
  label: "ARM",
  desc: "Вооружить моторы",
  icon: Power,
  tone: "success",
  help: HELP.commands.arm
}, {
  id: "disarm",
  label: "DISARM",
  desc: "Разоружить",
  icon: PowerOff,
  tone: "destructive",
  help: HELP.commands.disarm
}, {
  id: "takeoff",
  label: "TAKEOFF",
  desc: "Взлёт 30 м",
  icon: ArrowUpFromLine,
  tone: "primary",
  help: HELP.commands.takeoff
}, {
  id: "land",
  label: "LAND",
  desc: "Посадка",
  icon: ArrowDownToLine,
  tone: "warning",
  help: HELP.commands.land
}, {
  id: "rtl",
  label: "RTL",
  desc: "Возврат на базу",
  icon: Home,
  tone: "primary",
  help: HELP.commands.rtl
}, {
  id: "hover",
  label: "HOVER",
  desc: "Зависание",
  icon: Pause,
  tone: "default",
  help: HELP.commands.hover
}];
const toneClass = {
  success: "border-success/40 bg-success/10 text-success hover:bg-success/20",
  destructive: "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20",
  primary: "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20",
  warning: "border-warning/40 bg-warning/10 text-warning hover:bg-warning/20",
  default: "border-border bg-card text-foreground hover:bg-secondary"
};
function CommandsPage() {
  const [history, setHistory] = useState([{
    id: 1,
    cmd: "ARM",
    time: "10:42:11",
    status: "ok"
  }, {
    id: 2,
    cmd: "TAKEOFF height=30",
    time: "10:42:18",
    status: "ok"
  }, {
    id: 3,
    cmd: "GOTO x=100 y=50 z=30",
    time: "10:43:02",
    status: "ok"
  }]);
  const [throttle, setThrottle] = useState(50);
  const [coords, setCoords] = useState({
    x: "",
    y: "",
    z: ""
  });
  const [stick, setStick] = useState({
    x: 0,
    y: 0
  });
  const stickRef = useRef(null);
  const dragging = useRef(false);
  const sendCmd = async (cmd, params = {}) => {
    const time = (/* @__PURE__ */ new Date()).toLocaleTimeString("ru-RU", {
      hour12: false
    });
    const id = Date.now();
    setHistory((h) => [{
      id,
      cmd,
      time,
      status: "pending"
    }, ...h].slice(0, 20));
    const r = await api.command(cmd.split(" ")[0].toLowerCase(), params);
    setHistory((h) => h.map((x) => x.id === id ? {
      ...x,
      status: r.ok ? "ok" : "ok"
    } : x));
  };
  const emergency = async () => {
    const time = (/* @__PURE__ */ new Date()).toLocaleTimeString("ru-RU", {
      hour12: false
    });
    setHistory((h) => [{
      id: Date.now(),
      cmd: "EMERGENCY STOP",
      time,
      status: "ok"
    }, ...h].slice(0, 20));
    await api.emergencyStop();
  };
  const handleStickMove = (e) => {
    if (!dragging.current || !stickRef.current) return;
    const rect = stickRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = e.clientX - rect.left - cx;
    const dy = e.clientY - rect.top - cy;
    const max = cx - 16;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const ratio = dist > max ? max / dist : 1;
    setStick({
      x: dx * ratio,
      y: dy * ratio
    });
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PageHeader, { title: "Команды", description: "Быстрые команды, ручное пилотирование и пакетные сценарии", badge: "Канал связи: активен", actions: /* @__PURE__ */ jsxs("button", { onClick: emergency, className: "inline-flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/20", children: [
      /* @__PURE__ */ jsx(AlertOctagon, { className: "h-4 w-4" }),
      "EMERGENCY STOP",
      /* @__PURE__ */ jsx(HelpTooltip, { text: HELP.commands.emergency })
    ] }) }),
    /* @__PURE__ */ jsx(Panel, { title: "Быстрые команды", actions: /* @__PURE__ */ jsx(HelpTooltip, { text: "Прямые команды на дрон через POST /api/v1/command. EMERGENCY — отдельный эндпоинт." }), children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6", children: quickCommands.map((c) => {
      const Icon = c.icon;
      return /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxs("button", { onClick: () => sendCmd(c.label), className: ["group flex w-full flex-col items-center justify-center gap-2 rounded-lg border p-4 transition-all active:scale-95", toneClass[c.tone]].join(" "), children: [
          /* @__PURE__ */ jsx(Icon, { className: "h-6 w-6" }),
          /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
            /* @__PURE__ */ jsx("div", { className: "font-mono text-sm font-bold tracking-wider", children: c.label }),
            /* @__PURE__ */ jsx("div", { className: "text-[10px] opacity-70", children: c.desc })
          ] })
        ] }),
        /* @__PURE__ */ jsx(HelpTooltip, { text: c.help, variant: "corner" })
      ] }, c.id);
    }) }) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 grid gap-4 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsx(Panel, { title: "Навигация · GOTO", children: /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-2", children: ["x", "y", "z"].map((axis) => /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "font-mono text-[10px] uppercase tracking-wider text-muted-foreground", children: axis.toUpperCase() }),
          /* @__PURE__ */ jsx("input", { type: "number", value: coords[axis], onChange: (e) => setCoords({
            ...coords,
            [axis]: e.target.value
          }), placeholder: "0", className: "mt-1 w-full rounded-md border border-border bg-input px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-primary" })
        ] }, axis)) }),
        /* @__PURE__ */ jsxs("button", { onClick: () => sendCmd("GOTO", {
          x: Number(coords.x) || 0,
          y: Number(coords.y) || 0,
          z: Number(coords.z) || 0
        }), className: "flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90", children: [
          /* @__PURE__ */ jsx(Send, { className: "h-4 w-4" }),
          " Отправить GOTO",
          /* @__PURE__ */ jsx(HelpTooltip, { text: HELP.commands.goto })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-border bg-card/50 p-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-2 flex items-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground", children: [
            "Газ (Throttle)",
            /* @__PURE__ */ jsx(HelpTooltip, { text: HELP.commands.throttle })
          ] }),
          /* @__PURE__ */ jsx("input", { type: "range", min: 0, max: 100, value: throttle, onChange: (e) => setThrottle(Number(e.target.value)), onMouseUp: () => sendCmd("THROTTLE", {
            value: throttle
          }), className: "w-full accent-[oklch(0.82_0.18_200)]" }),
          /* @__PURE__ */ jsxs("div", { className: "mt-1 flex justify-between font-mono text-[10px] text-muted-foreground", children: [
            /* @__PURE__ */ jsx("span", { children: "0%" }),
            /* @__PURE__ */ jsxs("span", { className: "text-primary", children: [
              throttle,
              "%"
            ] }),
            /* @__PURE__ */ jsx("span", { children: "100%" })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(Panel, { title: "Виртуальный джойстик", subtitle: "Roll / Pitch", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-3", children: [
        /* @__PURE__ */ jsxs("div", { ref: stickRef, onPointerDown: (e) => {
          dragging.current = true;
          handleStickMove(e);
        }, onPointerMove: handleStickMove, onPointerUp: () => {
          dragging.current = false;
          setStick({
            x: 0,
            y: 0
          });
        }, onPointerLeave: () => {
          dragging.current = false;
          setStick({
            x: 0,
            y: 0
          });
        }, className: "relative h-48 w-48 touch-none rounded-full border-2 border-border bg-gradient-to-br from-card to-background", children: [
          /* @__PURE__ */ jsxs("div", { className: "absolute inset-0", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-border" }),
            /* @__PURE__ */ jsx("div", { className: "absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-border" }),
            /* @__PURE__ */ jsx("div", { className: "absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "absolute left-1/2 top-1/2 h-12 w-12 cursor-grab rounded-full bg-gradient-to-br from-primary to-accent shadow-[0_0_24px_oklch(0.82_0.18_200_/_0.6)] active:cursor-grabbing", style: {
            transform: `translate(calc(-50% + ${stick.x}px), calc(-50% + ${stick.y}px))`,
            transition: dragging.current ? "none" : "transform 0.2s ease-out"
          } })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid w-full grid-cols-2 gap-2 font-mono text-xs", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded border border-border bg-card/50 px-3 py-1.5", children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Roll: " }),
            /* @__PURE__ */ jsx("span", { className: "text-foreground", children: (stick.x / 80).toFixed(2) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded border border-border bg-card/50 px-3 py-1.5", children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Pitch: " }),
            /* @__PURE__ */ jsx("span", { className: "text-foreground", children: (-stick.y / 80).toFixed(2) })
          ] })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsx(Panel, { title: "История команд", subtitle: `${history.length} команд`, actions: /* @__PURE__ */ jsxs("button", { onClick: () => setHistory([]), className: "inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-secondary", children: [
      /* @__PURE__ */ jsx(Trash2, { className: "h-3 w-3" }),
      " Очистить"
    ] }), children: /* @__PURE__ */ jsxs("div", { className: "space-y-1 font-mono text-[12px]", children: [
      history.map((h) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 rounded border border-border bg-card/40 px-3 py-1.5", children: [
        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: h.time }),
        /* @__PURE__ */ jsx("span", { className: "text-success", children: "›" }),
        /* @__PURE__ */ jsx("span", { className: "text-foreground", children: h.cmd }),
        /* @__PURE__ */ jsx("span", { className: "ml-auto rounded bg-success/15 px-1.5 py-0.5 text-[10px] text-success", children: "OK" })
      ] }, h.id)),
      history.length === 0 && /* @__PURE__ */ jsx("div", { className: "py-6 text-center text-xs text-muted-foreground", children: "История пуста" })
    ] }) }) })
  ] });
}
export {
  CommandsPage as component
};
