import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useRef, useState } from "react";
import { P as PageHeader, a as Panel } from "./Panel-DCNe0G5R.js";
import { Settings2, Circle, Camera, Mic, Maximize, Eye } from "lucide-react";
const detectedObjects = [{
  label: "Person",
  count: 2,
  confidence: 0.94,
  color: "oklch(0.82 0.18 200)"
}, {
  label: "Vehicle",
  count: 1,
  confidence: 0.88,
  color: "oklch(0.78 0.16 70)"
}, {
  label: "Building",
  count: 4,
  confidence: 0.97,
  color: "oklch(0.72 0.18 145)"
}, {
  label: "Tree",
  count: 12,
  confidence: 0.81,
  color: "oklch(0.70 0.15 290)"
}];
function CameraPage() {
  const svgRef = useRef(null);
  const [snapHint, setSnapHint] = useState(null);
  const [recording, setRecording] = useState(false);
  const takeSnapshot = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8"
    });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1600;
      canvas.height = 900;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement("a");
        const ts = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
        a.href = URL.createObjectURL(blob);
        a.download = `snapshot_${ts}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
      }, "image/png");
      URL.revokeObjectURL(url);
    };
    img.src = url;
    setSnapHint("Снимок сохранён");
    window.setTimeout(() => setSnapHint(null), 1800);
  };
  const toggleRecording = () => {
    setRecording((v) => !v);
    setSnapHint(recording ? "Запись остановлена" : "Запись запущена");
    window.setTimeout(() => setSnapHint(null), 1800);
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PageHeader, { title: "Камера", description: "Прямая трансляция видео с детекцией объектов · YOLOv5 · 1080p / 30fps", badge: recording ? "REC" : "LIVE", actions: /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("button", { className: "inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-secondary", children: [
        /* @__PURE__ */ jsx(Settings2, { className: "h-4 w-4" }),
        " Настройки"
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: toggleRecording, className: ["inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:opacity-90", recording ? "bg-warning text-warning-foreground" : "bg-destructive text-destructive-foreground"].join(" "), children: [
        /* @__PURE__ */ jsx(Circle, { className: "h-4 w-4 fill-current" }),
        " ",
        recording ? "Остановить" : "Запись"
      ] })
    ] }) }),
    snapHint && /* @__PURE__ */ jsx("div", { className: "mb-3 inline-flex items-center gap-2 rounded-md border border-success/40 bg-success/10 px-3 py-1.5 text-xs text-success", children: snapHint }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-4 lg:grid-cols-3", children: [
      /* @__PURE__ */ jsx(Panel, { className: "lg:col-span-2", padded: false, children: /* @__PURE__ */ jsxs("div", { className: "scan-line relative aspect-video w-full overflow-hidden bg-black", children: [
        /* @__PURE__ */ jsxs("svg", { ref: svgRef, viewBox: "0 0 800 450", className: "h-full w-full", children: [
          /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "sky", x1: "0", y1: "0", x2: "0", y2: "1", children: [
            /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "oklch(0.32 0.05 240)" }),
            /* @__PURE__ */ jsx("stop", { offset: "60%", stopColor: "oklch(0.22 0.04 240)" }),
            /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "oklch(0.18 0.03 130)" })
          ] }) }),
          /* @__PURE__ */ jsx("rect", { width: "800", height: "450", fill: "url(#sky)" }),
          /* @__PURE__ */ jsx("line", { x1: "0", y1: "280", x2: "800", y2: "280", stroke: "oklch(0.40 0.06 200 / 0.4)", strokeWidth: "1" }),
          /* @__PURE__ */ jsx("rect", { x: "80", y: "200", width: "60", height: "80", fill: "oklch(0.28 0.03 240)" }),
          /* @__PURE__ */ jsx("rect", { x: "160", y: "170", width: "80", height: "110", fill: "oklch(0.30 0.03 240)" }),
          /* @__PURE__ */ jsx("rect", { x: "260", y: "220", width: "50", height: "60", fill: "oklch(0.26 0.03 240)" }),
          /* @__PURE__ */ jsx("rect", { x: "600", y: "190", width: "90", height: "90", fill: "oklch(0.30 0.03 240)" }),
          /* @__PURE__ */ jsx("path", { d: "M 0 380 L 800 360 L 800 450 L 0 450 Z", fill: "oklch(0.18 0.02 240)" }),
          /* @__PURE__ */ jsx("path", { d: "M 0 380 L 800 360", stroke: "oklch(0.78 0.16 70 / 0.6)", strokeDasharray: "20 12", strokeWidth: "2" }),
          /* @__PURE__ */ jsxs("g", { children: [
            /* @__PURE__ */ jsx("rect", { x: "180", y: "180", width: "60", height: "100", fill: "none", stroke: "oklch(0.82 0.18 200)", strokeWidth: "2" }),
            /* @__PURE__ */ jsx("rect", { x: "180", y: "160", width: "80", height: "18", fill: "oklch(0.82 0.18 200)" }),
            /* @__PURE__ */ jsx("text", { x: "184", y: "173", fontSize: "11", fontFamily: "JetBrains Mono", fill: "oklch(0.15 0.02 240)", children: "Person 0.94" })
          ] }),
          /* @__PURE__ */ jsxs("g", { children: [
            /* @__PURE__ */ jsx("rect", { x: "380", y: "320", width: "120", height: "60", fill: "none", stroke: "oklch(0.78 0.16 70)", strokeWidth: "2" }),
            /* @__PURE__ */ jsx("rect", { x: "380", y: "302", width: "100", height: "18", fill: "oklch(0.78 0.16 70)" }),
            /* @__PURE__ */ jsx("text", { x: "384", y: "315", fontSize: "11", fontFamily: "JetBrains Mono", fill: "oklch(0.15 0.02 240)", children: "Vehicle 0.88" })
          ] }),
          /* @__PURE__ */ jsxs("g", { children: [
            /* @__PURE__ */ jsx("rect", { x: "600", y: "190", width: "90", height: "90", fill: "none", stroke: "oklch(0.72 0.18 145)", strokeWidth: "2" }),
            /* @__PURE__ */ jsx("rect", { x: "600", y: "172", width: "100", height: "18", fill: "oklch(0.72 0.18 145)" }),
            /* @__PURE__ */ jsx("text", { x: "604", y: "185", fontSize: "11", fontFamily: "JetBrains Mono", fill: "oklch(0.15 0.02 240)", children: "Building 0.97" })
          ] }),
          /* @__PURE__ */ jsxs("g", { stroke: "oklch(0.82 0.18 200 / 0.6)", strokeWidth: "1", fill: "none", children: [
            /* @__PURE__ */ jsx("line", { x1: "380", y1: "225", x2: "420", y2: "225" }),
            /* @__PURE__ */ jsx("line", { x1: "400", y1: "205", x2: "400", y2: "245" }),
            /* @__PURE__ */ jsx("circle", { cx: "400", cy: "225", r: "20" })
          ] }),
          /* @__PURE__ */ jsx("text", { x: "20", y: "30", fontSize: "13", fontFamily: "JetBrains Mono", fill: "oklch(0.82 0.18 200)", children: "ALT 32.4m" }),
          /* @__PURE__ */ jsx("text", { x: "20", y: "48", fontSize: "13", fontFamily: "JetBrains Mono", fill: "oklch(0.82 0.18 200)", children: "SPD 6.2m/s" }),
          /* @__PURE__ */ jsx("text", { x: "700", y: "30", fontSize: "13", fontFamily: "JetBrains Mono", fill: "oklch(0.82 0.18 200)", children: "REC 00:14:32" }),
          /* @__PURE__ */ jsx("circle", { cx: "688", cy: "25", r: "5", fill: "oklch(0.65 0.24 25)", children: /* @__PURE__ */ jsx("animate", { attributeName: "opacity", values: "1;0.3;1", dur: "1.5s", repeatCount: "indefinite" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-background/85 px-3 py-1.5 backdrop-blur", children: [
          /* @__PURE__ */ jsx("button", { onClick: takeSnapshot, title: "Снимок", className: "rounded-full p-1.5 text-muted-foreground hover:text-primary", children: /* @__PURE__ */ jsx(Camera, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsx("button", { title: "Микрофон", className: "rounded-full p-1.5 text-muted-foreground hover:text-primary", children: /* @__PURE__ */ jsx(Mic, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsx("button", { onClick: toggleRecording, title: recording ? "Остановить запись" : "Начать запись", className: ["rounded-full p-1.5", recording ? "text-warning" : "text-destructive"].join(" "), children: /* @__PURE__ */ jsx(Circle, { className: "h-4 w-4 fill-current" }) }),
          /* @__PURE__ */ jsx("button", { title: "Полноэкран", className: "rounded-full p-1.5 text-muted-foreground hover:text-primary", children: /* @__PURE__ */ jsx(Maximize, { className: "h-4 w-4" }) })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsx(Panel, { title: "Распознанные объекты", subtitle: "YOLOv5 · реал-тайм", children: /* @__PURE__ */ jsx("div", { className: "space-y-2", children: detectedObjects.map((o) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 rounded-md border border-border bg-card/50 px-3 py-2", children: [
          /* @__PURE__ */ jsx("span", { className: "h-3 w-3 rounded-sm", style: {
            backgroundColor: o.color
          } }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-foreground", children: o.label }),
          /* @__PURE__ */ jsxs("span", { className: "ml-auto font-mono text-xs text-muted-foreground", children: [
            "×",
            o.count
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "font-mono text-xs font-semibold text-success", children: [
            (o.confidence * 100).toFixed(0),
            "%"
          ] })
        ] }, o.label)) }) }),
        /* @__PURE__ */ jsx(Panel, { title: "Параметры камеры", children: /* @__PURE__ */ jsxs("div", { className: "space-y-3 text-sm", children: [
          /* @__PURE__ */ jsx(Row, { label: "Разрешение", value: "1920×1080" }),
          /* @__PURE__ */ jsx(Row, { label: "FPS", value: "30" }),
          /* @__PURE__ */ jsx(Row, { label: "Кодек", value: "H.264" }),
          /* @__PURE__ */ jsx(Row, { label: "Битрейт", value: "6 Мбит/с" }),
          /* @__PURE__ */ jsx(Row, { label: "Зум", value: "2.4×" }),
          /* @__PURE__ */ jsx(Row, { label: "Стабилизация", value: "Активна", tone: "success" }),
          /* @__PURE__ */ jsx(Row, { label: "ИК-режим", value: "Авто" })
        ] }) }),
        /* @__PURE__ */ jsxs("button", { onClick: takeSnapshot, className: "flex w-full items-center justify-center gap-2 rounded-md border border-primary/40 bg-primary/10 py-2.5 text-sm font-semibold text-primary hover:bg-primary/20", children: [
          /* @__PURE__ */ jsx(Eye, { className: "h-4 w-4" }),
          " Сделать снимок"
        ] })
      ] })
    ] })
  ] });
}
function Row({
  label,
  value,
  tone
}) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-border/50 py-1.5 last:border-0", children: [
    /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("span", { className: ["font-mono text-xs font-semibold", tone === "success" ? "text-success" : "text-foreground"].join(" "), children: value })
  ] });
}
export {
  CameraPage as component
};
