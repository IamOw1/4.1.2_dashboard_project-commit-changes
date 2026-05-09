import { useEffect, useState } from 'react';
import { MapPin, Plus, Play, Square, Eye, Save } from 'lucide-react';
import { api } from '../services/api';
import { HelpTooltip } from './ui/HelpTooltip';
import { HELP } from './ui/helpTexts';

interface Waypoint {
  x: number;
  y: number;
  z: number;
  speed: number;
}

export default function MissionsTab() {
  const [missionName, setMissionName] = useState('Патрулирование склада');
  const [missionType, setMissionType] = useState('Патрулирование');
  const [altitude, setAltitude] = useState(30);
  const [speed, setSpeed] = useState(5);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([
    { x: 0, y: 0, z: 30, speed: 5 },
    { x: 50, y: 0, z: 30, speed: 5 },
    { x: 50, y: 50, z: 30, speed: 5 },
  ]);
  const [missionTypes, setMissionTypes] = useState<string[]>([]);
  const [banner, setBanner] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeBlock, setActiveBlock] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    void api.missionTypes().then(setMissionTypes).catch(() => undefined);
  }, []);

  useEffect(() => {
    const tick = async () => {
      try {
        const st = await api.missionStatus();
        setActiveBlock((st.active as Record<string, unknown>) ?? null);
      } catch {
        setActiveBlock(null);
      }
    };
    void tick();
    const id = setInterval(tick, 2000);
    return () => clearInterval(id);
  }, []);

  const handleAddWaypoint = () => {
    setWaypoints([...waypoints, { x: 0, y: 0, z: altitude, speed }]);
  };

  const handleRemoveWaypoint = (index: number) => {
    setWaypoints(waypoints.filter((_, i) => i !== index));
  };

  const handleUpdateWaypoint = (index: number, field: keyof Waypoint, value: number) => {
    const updated = [...waypoints];
    updated[index][field] = value;
    setWaypoints(updated);
  };

  const payload = () => ({
    name: missionName,
    mission_type: missionType,
    altitude,
    speed,
    waypoints: waypoints.map((w) => ({ x: w.x, y: w.y, z: w.z, speed: w.speed })),
  });

  const startMission = async () => {
    try {
      await api.startMission(payload());
      setBanner('Миссия отправлена на запуск');
    } catch (e) {
      setBanner(e instanceof Error ? e.message : 'Ошибка запуска');
    }
    setTimeout(() => setBanner(null), 4000);
  };

  const stopMission = async () => {
    try {
      await api.stopMission();
      setBanner('Остановка миссии');
    } catch (e) {
      setBanner(e instanceof Error ? e.message : 'Ошибка');
    }
    setTimeout(() => setBanner(null), 4000);
  };

  const saveMission = async () => {
    try {
      await api.saveMission(payload());
      setBanner('Миссия сохранена в data/missions');
    } catch (e) {
      setBanner(e instanceof Error ? e.message : 'Ошибка сохранения');
    }
    setTimeout(() => setBanner(null), 4000);
  };

  const missionStatusLabel =
    activeBlock?.state != null ? String(activeBlock.state) : 'Нет активной';
  const progress =
    typeof activeBlock?.progress === 'number' ? activeBlock.progress : 0;
  const done =
    typeof activeBlock?.waypoints_done === 'number' ? activeBlock.waypoints_done : 0;
  const total =
    typeof activeBlock?.waypoints_total === 'number'
      ? activeBlock.waypoints_total
      : waypoints.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Управление миссиями
        </h2>
        <p className="text-gray-400">Создание и управление полетными заданиями</p>
      </div>

      {banner && (
        <div className="rounded-lg border border-cyan-500/40 bg-cyan-950/40 px-4 py-2 text-sm text-cyan-100">
          {banner}
        </div>
      )}

      <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600/50 space-y-4">
        <h3 className="text-xl font-bold text-cyan-400 mb-4">Создание новой миссии</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              Название миссии
              <HelpTooltip text={HELP.missionName} />
            </label>
            <input
              type="text"
              value={missionName}
              onChange={(e) => setMissionName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
              placeholder="Введите название миссии"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              Тип миссии
              <HelpTooltip text={HELP.missionType} />
            </label>
            <select
              value={missionType}
              onChange={(e) => setMissionType(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
            >
              {(missionTypes.length ? missionTypes : [missionType]).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              Высота полёта (м)
              <HelpTooltip text={HELP.missionAlt} />
            </label>
            <input
              type="number"
              value={altitude}
              onChange={(e) => setAltitude(Number(e.target.value))}
              min={5}
              max={100}
              className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              Скорость (м/с)
              <HelpTooltip text={HELP.missionSpeed} />
            </label>
            <input
              type="number"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              min={1}
              max={20}
              className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-cyan-400">Точки маршрута</h3>
          <button
            type="button"
            onClick={handleAddWaypoint}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
          >
            <Plus className="w-4 h-4" />
            Добавить точку
            <HelpTooltip text={HELP.missionWpAdd} />
          </button>
        </div>

        <div className="space-y-3">
          {waypoints.map((wp, index) => (
            <div key={index} className="flex items-center gap-3 bg-gray-800/50 p-4 rounded-lg">
              <div className="flex items-center justify-center w-10 h-10 bg-cyan-500/20 rounded-lg">
                <MapPin className="w-5 h-5 text-cyan-400" />
              </div>

              <div className="flex-1 grid grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-gray-400">X (м)</label>
                  <input
                    type="number"
                    value={wp.x}
                    onChange={(e) => handleUpdateWaypoint(index, 'x', Number(e.target.value))}
                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Y (м)</label>
                  <input
                    type="number"
                    value={wp.y}
                    onChange={(e) => handleUpdateWaypoint(index, 'y', Number(e.target.value))}
                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Z (м)</label>
                  <input
                    type="number"
                    value={wp.z}
                    onChange={(e) => handleUpdateWaypoint(index, 'z', Number(e.target.value))}
                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Скорость</label>
                  <input
                    type="number"
                    value={wp.speed}
                    onChange={(e) => handleUpdateWaypoint(index, 'speed', Number(e.target.value))}
                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRemoveWaypoint(index)}
                className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                Удалить
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void startMission()}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg hover:shadow-green-500/50 transition-all"
        >
          <Play className="w-5 h-5" />
          Запустить миссию
          <HelpTooltip text={HELP.missionStart} />
        </button>
        <button
          type="button"
          onClick={() => void stopMission()}
          className="flex items-center gap-2 px-6 py-3 bg-red-600/80 text-white rounded-lg hover:bg-red-600 transition-all"
        >
          <Square className="w-5 h-5" />
          Остановить
          <HelpTooltip text={HELP.missionStop} />
        </button>
        <button
          type="button"
          onClick={() => void saveMission()}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
        >
          <Save className="w-5 h-5" />
          Сохранить миссию
          <HelpTooltip text={HELP.missionSave} />
        </button>
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          <Eye className="w-5 h-5" />
          Предпросмотр
          <HelpTooltip text={HELP.missionPreview} />
        </button>
      </div>

      <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600/50">
        <h3 className="text-xl font-bold text-cyan-400 mb-4">Активная миссия</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-1">Статус</p>
            <p className="text-lg font-bold text-green-400">{missionStatusLabel}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-1">Прогресс</p>
            <p className="text-lg font-bold text-white">{Number(progress).toFixed(0)}%</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-1">Точек пройдено</p>
            <p className="text-lg font-bold text-white">
              {done} / {total}
            </p>
          </div>
        </div>
      </div>

      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-gray-800 border border-cyan-500/30 rounded-xl max-w-lg w-full p-6 shadow-xl">
            <h4 className="text-lg font-bold text-white mb-4">Предпросмотр точек</h4>
            <pre className="text-xs text-gray-300 overflow-auto max-h-64 bg-gray-900/80 p-3 rounded-lg">
              {JSON.stringify(payload(), null, 2)}
            </pre>
            <button
              type="button"
              className="mt-4 w-full py-2 bg-cyan-600 rounded-lg text-white"
              onClick={() => setPreviewOpen(false)}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
