import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/Panel";
import {
  Camera as CameraIcon,
  Circle,
  Maximize,
  Mic,
  Settings2,
  Eye,
} from "lucide-react";

export const Route = createFileRoute("/camera")({
  head: () => ({
    meta: [
      { title: "Камера · COBA AI" },
      { name: "description", content: "Видеопоток с детекцией объектов." },
    ],
  }),
  component: CameraPage,
});

const detectedObjects = [
  { label: "Person", count: 2, confidence: 0.94, color: "oklch(0.82 0.18 200)" },
  { label: "Vehicle", count: 1, confidence: 0.88, color: "oklch(0.78 0.16 70)" },
  { label: "Building", count: 4, confidence: 0.97, color: "oklch(0.72 0.18 145)" },
  { label: "Tree", count: 12, confidence: 0.81, color: "oklch(0.70 0.15 290)" },
];

function CameraPage() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [snapHint, setSnapHint] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);

  const takeSnapshot = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
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
        const ts = new Date().toISOString().replace(/[:.]/g, "-");
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

  return (
    <>
      <PageHeader
        title="Камера"
        description="Прямая трансляция видео с детекцией объектов · YOLOv5 · 1080p / 30fps"
        badge={recording ? "REC" : "LIVE"}
        actions={
          <>
            <button className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-secondary">
              <Settings2 className="h-4 w-4" /> Настройки
            </button>
            <button onClick={toggleRecording} className={[
              "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:opacity-90",
              recording ? "bg-warning text-warning-foreground" : "bg-destructive text-destructive-foreground",
            ].join(" ")}>
              <Circle className="h-4 w-4 fill-current" /> {recording ? "Остановить" : "Запись"}
            </button>
          </>
        }
      />

      {snapHint && (
        <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-success/40 bg-success/10 px-3 py-1.5 text-xs text-success">
          {snapHint}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" padded={false}>
          <div className="scan-line relative aspect-video w-full overflow-hidden bg-black">
            {/* Simulated camera view */}
            <svg ref={svgRef} viewBox="0 0 800 450" className="h-full w-full">
              <defs>
                <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.32 0.05 240)" />
                  <stop offset="60%" stopColor="oklch(0.22 0.04 240)" />
                  <stop offset="100%" stopColor="oklch(0.18 0.03 130)" />
                </linearGradient>
              </defs>
              <rect width="800" height="450" fill="url(#sky)" />
              {/* horizon */}
              <line x1="0" y1="280" x2="800" y2="280" stroke="oklch(0.40 0.06 200 / 0.4)" strokeWidth="1" />
              {/* "buildings" */}
              <rect x="80" y="200" width="60" height="80" fill="oklch(0.28 0.03 240)" />
              <rect x="160" y="170" width="80" height="110" fill="oklch(0.30 0.03 240)" />
              <rect x="260" y="220" width="50" height="60" fill="oklch(0.26 0.03 240)" />
              <rect x="600" y="190" width="90" height="90" fill="oklch(0.30 0.03 240)" />
              {/* roads */}
              <path d="M 0 380 L 800 360 L 800 450 L 0 450 Z" fill="oklch(0.18 0.02 240)" />
              <path d="M 0 380 L 800 360" stroke="oklch(0.78 0.16 70 / 0.6)" strokeDasharray="20 12" strokeWidth="2" />

              {/* Detection boxes */}
              <g>
                <rect x="180" y="180" width="60" height="100" fill="none" stroke="oklch(0.82 0.18 200)" strokeWidth="2" />
                <rect x="180" y="160" width="80" height="18" fill="oklch(0.82 0.18 200)" />
                <text x="184" y="173" fontSize="11" fontFamily="JetBrains Mono" fill="oklch(0.15 0.02 240)">Person 0.94</text>
              </g>
              <g>
                <rect x="380" y="320" width="120" height="60" fill="none" stroke="oklch(0.78 0.16 70)" strokeWidth="2" />
                <rect x="380" y="302" width="100" height="18" fill="oklch(0.78 0.16 70)" />
                <text x="384" y="315" fontSize="11" fontFamily="JetBrains Mono" fill="oklch(0.15 0.02 240)">Vehicle 0.88</text>
              </g>
              <g>
                <rect x="600" y="190" width="90" height="90" fill="none" stroke="oklch(0.72 0.18 145)" strokeWidth="2" />
                <rect x="600" y="172" width="100" height="18" fill="oklch(0.72 0.18 145)" />
                <text x="604" y="185" fontSize="11" fontFamily="JetBrains Mono" fill="oklch(0.15 0.02 240)">Building 0.97</text>
              </g>

              {/* Crosshair */}
              <g stroke="oklch(0.82 0.18 200 / 0.6)" strokeWidth="1" fill="none">
                <line x1="380" y1="225" x2="420" y2="225" />
                <line x1="400" y1="205" x2="400" y2="245" />
                <circle cx="400" cy="225" r="20" />
              </g>

              {/* HUD */}
              <text x="20" y="30" fontSize="13" fontFamily="JetBrains Mono" fill="oklch(0.82 0.18 200)">ALT 32.4m</text>
              <text x="20" y="48" fontSize="13" fontFamily="JetBrains Mono" fill="oklch(0.82 0.18 200)">SPD 6.2m/s</text>
              <text x="700" y="30" fontSize="13" fontFamily="JetBrains Mono" fill="oklch(0.82 0.18 200)">REC 00:14:32</text>
              <circle cx="688" cy="25" r="5" fill="oklch(0.65 0.24 25)">
                <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
              </circle>
            </svg>

            {/* Bottom toolbar overlay */}
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-background/85 px-3 py-1.5 backdrop-blur">
              <button onClick={takeSnapshot} title="Снимок" className="rounded-full p-1.5 text-muted-foreground hover:text-primary">
                <CameraIcon className="h-4 w-4" />
              </button>
              <button title="Микрофон" className="rounded-full p-1.5 text-muted-foreground hover:text-primary">
                <Mic className="h-4 w-4" />
              </button>
              <button onClick={toggleRecording} title={recording ? "Остановить запись" : "Начать запись"} className={["rounded-full p-1.5", recording ? "text-warning" : "text-destructive"].join(" ")}>
                <Circle className="h-4 w-4 fill-current" />
              </button>
              <button title="Полноэкран" className="rounded-full p-1.5 text-muted-foreground hover:text-primary">
                <Maximize className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Распознанные объекты" subtitle="YOLOv5 · реал-тайм">
            <div className="space-y-2">
              {detectedObjects.map((o) => (
                <div key={o.label} className="flex items-center gap-3 rounded-md border border-border bg-card/50 px-3 py-2">
                  <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: o.color }} />
                  <span className="text-sm font-medium text-foreground">{o.label}</span>
                  <span className="ml-auto font-mono text-xs text-muted-foreground">×{o.count}</span>
                  <span className="font-mono text-xs font-semibold text-success">
                    {(o.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Параметры камеры">
            <div className="space-y-3 text-sm">
              <Row label="Разрешение" value="1920×1080" />
              <Row label="FPS" value="30" />
              <Row label="Кодек" value="H.264" />
              <Row label="Битрейт" value="6 Мбит/с" />
              <Row label="Зум" value="2.4×" />
              <Row label="Стабилизация" value="Активна" tone="success" />
              <Row label="ИК-режим" value="Авто" />
            </div>
          </Panel>

          <button onClick={takeSnapshot} className="flex w-full items-center justify-center gap-2 rounded-md border border-primary/40 bg-primary/10 py-2.5 text-sm font-semibold text-primary hover:bg-primary/20">
            <Eye className="h-4 w-4" /> Сделать снимок
          </button>
        </div>
      </div>
    </>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "success" }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-1.5 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={["font-mono text-xs font-semibold", tone === "success" ? "text-success" : "text-foreground"].join(" ")}>
        {value}
      </span>
    </div>
  );
}
