import { useEffect, useState } from 'react';
import { Users, Wifi, Battery, MapPin } from 'lucide-react';
import { api } from '../services/api';
import type { FleetStatusResponse } from '../types/api';
import { HelpTooltip } from './ui/HelpTooltip';
import { HELP } from './ui/helpTexts';

const FORMATIONS = ['LINE', 'CIRCLE', 'PYRAMID', 'V-SHAPE'] as const;

export default function FleetTab() {
  const [fleet, setFleet] = useState<FleetStatusResponse | null>(null);
  const [leaderInput, setLeaderInput] = useState('');

  const load = async () => {
    try {
      const f = await api.fleetStatus();
      setFleet(f);
      if (!leaderInput && f.leader_id) setLeaderInput(f.leader_id);
    } catch {
      setFleet(null);
    }
  };

  useEffect(() => {
    void load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, []);

  const setFormation = async (f: string) => {
    await api.fleetFormation(f);
    await load();
  };

  const swapLeader = async () => {
    if (!leaderInput.trim()) return;
    await api.fleetSwapLeader(leaderInput.trim());
    await load();
  };

  const drones = fleet?.drones ?? [];
  const formation = fleet?.formation ?? 'LINE';
  const avg = fleet?.average_battery ?? 0;

  const formationActive = (label: (typeof FORMATIONS)[number]) => {
    const mapped = label === 'V-SHAPE' ? 'V_SHAPE' : label;
    return formation === mapped;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Управление флотом
        </h2>
        <p className="text-gray-400">Координация группы дронов</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
          <Users className="w-8 h-8 text-cyan-400 mb-2" />
          <p className="text-sm text-gray-400">Подключено дронов</p>
          <p className="text-2xl font-bold text-white">{drones.length}</p>
        </div>
        <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
          <Battery className="w-8 h-8 text-green-400 mb-2" />
          <p className="text-sm text-gray-400 flex items-center gap-1">
            Средний заряд
            <HelpTooltip text={HELP.fleetCharge} />
          </p>
          <p className="text-2xl font-bold text-white">{avg.toFixed(0)}%</p>
        </div>
        <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
          <Wifi className="w-8 h-8 text-purple-400 mb-2" />
          <p className="text-sm text-gray-400">Формация</p>
          <p className="text-2xl font-bold text-white">{formation}</p>
        </div>
        <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
          <MapPin className="w-8 h-8 text-blue-400 mb-2" />
          <p className="text-sm text-gray-400 flex items-center gap-1">
            Лидер
            <HelpTooltip text={HELP.fleetLeader} />
          </p>
          <p className="text-xl font-bold text-white truncate">{fleet?.leader_id ?? '—'}</p>
        </div>
      </div>

      <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600/50">
        <h3 className="text-xl font-bold text-cyan-400 mb-4">Список дронов</h3>
        <div className="space-y-3">
          {drones.map((drone) => (
            <div key={drone.id} className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white">{drone.name}</h4>
                  <p className="text-sm text-gray-400">ID: {drone.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm text-gray-400">Заряд</p>
                  <p className="text-lg font-bold text-green-400">{drone.battery}%</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Статус</p>
                  <p className="text-sm font-semibold text-cyan-300">{drone.state}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600/50">
        <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
          Управление формацией
          <HelpTooltip text={HELP.fleetFormation} />
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {FORMATIONS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => void setFormation(f)}
              className={`px-4 py-3 rounded-lg border font-medium transition-all ${
                formationActive(f)
                  ? 'border-cyan-500 bg-cyan-600/40 text-white'
                  : 'border-gray-600 bg-gray-800 hover:border-cyan-500 text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm text-gray-400 mb-1 block">Сменить лидера (ID)</label>
          <input
            value={leaderInput}
            onChange={(e) => setLeaderInput(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white"
          />
        </div>
        <button
          type="button"
          onClick={() => void swapLeader()}
          className="px-6 py-2 bg-cyan-600 rounded-lg text-white hover:bg-cyan-500"
        >
          Назначить лидера
        </button>
      </div>
    </div>
  );
}
