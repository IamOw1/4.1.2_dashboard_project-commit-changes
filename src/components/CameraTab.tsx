import { useEffect, useState } from 'react';
import { Camera, Video, Image as ImageIcon, ZoomIn, Sun } from 'lucide-react';
import { api } from '../services/api';
import { HelpTooltip } from './ui/HelpTooltip';
import { HELP } from './ui/helpTexts';

export default function CameraTab() {
  const [ts, setTs] = useState(() => String(Date.now()));
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(0.5);
  const [recording, setRecording] = useState(false);
  const [detections, setDetections] = useState<{ label?: string; confidence?: number }[]>([]);

  useEffect(() => {
    const id = setInterval(() => setTs(String(Date.now())), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const d = (await api.cameraDetections()) as { detections?: unknown[] };
        const raw = Array.isArray(d.detections) ? d.detections : [];
        setDetections(
          raw.map((x) => {
            const o = x as Record<string, unknown>;
            return {
              label: String(o.label ?? o.class ?? 'объект'),
              confidence: typeof o.confidence === 'number' ? o.confidence : 0,
            };
          })
        );
      } catch {
        setDetections([]);
      }
    };
    void load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, []);

  const snapshotSrc = `${api.cameraSnapshotUrl(ts)}`;

  const applyZoom = async (v: number) => {
    setZoom(v);
    try {
      await api.cameraZoom(v);
    } catch {
      /* ignore */
    }
  };

  const applyBrightness = async (v: number) => {
    setBrightness(v);
    try {
      await api.cameraBrightness(v);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Камера и видеопоток
        </h2>
        <p className="text-gray-400">Снимок и параметры виртуальной камеры</p>
      </div>

      <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600/50">
        <div className="flex items-center gap-2 mb-2">
          <Camera className="w-5 h-5 text-cyan-400" />
          <span className="text-sm text-gray-400">Кадр обновляется каждую секунду</span>
          <HelpTooltip text={HELP.camSnapshot} />
        </div>
        <div className="aspect-video bg-gray-800/50 rounded-lg flex items-center justify-center border border-gray-600 overflow-hidden">
          <img
            src={snapshotSrc}
            alt="Снимок камеры"
            className="max-h-full max-w-full object-contain"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
          <div className="flex items-center gap-2 mb-2">
            <ZoomIn className="w-6 h-6 text-cyan-400" />
            <p className="text-sm text-gray-400">Зум</p>
            <HelpTooltip text={HELP.camZoom} />
          </div>
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => void applyZoom(Number(e.target.value))}
            className="w-full mt-2"
          />
          <p className="text-xs text-gray-500 mt-1">{zoom.toFixed(2)}×</p>
        </div>
        <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
          <div className="flex items-center gap-2 mb-2">
            <Sun className="w-6 h-6 text-yellow-400" />
            <p className="text-sm text-gray-400">Яркость</p>
            <HelpTooltip text={HELP.camBright} />
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={brightness}
            onChange={(e) => void applyBrightness(Number(e.target.value))}
            className="w-full mt-2"
          />
        </div>
        <button
          type="button"
          onClick={async () => {
            const r = (await api.cameraRecordStart()) as { active?: boolean };
            setRecording(!!r.active);
          }}
          className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 hover:bg-red-500/30 transition-all text-left"
        >
          <div className="flex justify-between gap-2">
            <div>
              <Video className="w-6 h-6 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-white font-medium">Запись</p>
              <p className="text-xs text-gray-500">{recording ? 'идёт' : 'стоп'}</p>
            </div>
            <HelpTooltip text={HELP.camRecord} placement="left" />
          </div>
        </button>
        <button
          type="button"
          onClick={async () => {
            const r = (await api.cameraRecordStop()) as { active?: boolean };
            setRecording(!!r.active);
          }}
          className="bg-gray-700 border border-gray-600 rounded-lg p-4 hover:bg-gray-600 transition-all"
        >
          <p className="text-sm text-white font-medium text-center">Стоп записи</p>
        </button>
        <button
          type="button"
          onClick={() => setTs(String(Date.now()))}
          className="bg-cyan-500/20 border border-cyan-500/50 rounded-lg p-4 hover:bg-cyan-500/30 transition-all md:col-span-2"
        >
          <div className="flex justify-between gap-2">
            <div className="text-center flex-1">
              <ImageIcon className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
              <p className="text-sm text-white font-medium">Обновить кадр</p>
            </div>
            <HelpTooltip text={HELP.camSnapshot} placement="left" />
          </div>
        </button>
      </div>

      <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600/50">
        <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
          Обнаруженные объекты
          <HelpTooltip text={HELP.camDetect} />
        </h3>
        <div className="space-y-2">
          {detections.length === 0 ? (
            <p className="text-gray-500 text-sm">Нет детекций или список пуст</p>
          ) : (
            detections.map((d, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg">
                <span className="text-white">{d.label}</span>
                <span className="text-cyan-400 font-semibold">
                  {(d.confidence * 100).toFixed(0)}% уверенности
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
