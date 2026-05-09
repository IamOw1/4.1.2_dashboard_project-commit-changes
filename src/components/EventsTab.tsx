import { useEffect, useState } from 'react';
import { FileText, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import type { EventItem, EventStatistics } from '../types/api';
import { HelpTooltip } from './ui/HelpTooltip';
import { HELP } from './ui/helpTexts';

export default function EventsTab() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [stats, setStats] = useState<EventStatistics | null>(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');

  const load = async () => {
    try {
      const ev = await api.events({
        limit: 100,
        type: typeFilter || undefined,
        level: levelFilter || undefined,
      });
      setEvents(ev.events ?? []);
      const st = await api.eventStatistics();
      setStats(st);
    } catch {
      setEvents([]);
    }
  };

  useEffect(() => {
    void load();
  }, [typeFilter, levelFilter]);

  const total = stats?.total ?? 0;
  const byType = stats?.by_type ?? {};
  const byLevel = stats?.by_level ?? {};

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Журнал событий
        </h2>
        <p className="text-gray-400">Мониторинг и просмотр событий системы</p>
      </div>

      <div className="flex flex-wrap gap-3 items-end bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
        <div>
          <label className="text-xs text-gray-400 flex items-center gap-1">
            Тип
            <HelpTooltip text={HELP.evtFilter} />
          </label>
          <input
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            placeholder="фильтр"
            className="mt-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 flex items-center gap-1">
            Уровень
            <HelpTooltip text={HELP.evtFilter} />
          </label>
          <input
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            placeholder="info / warning..."
            className="mt-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="px-4 py-2 bg-cyan-600 rounded-lg text-white text-sm"
        >
          Обновить
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
          <p className="text-sm text-gray-400 flex items-center gap-1">
            Всего
            <HelpTooltip text={HELP.evtStats} />
          </p>
          <p className="text-2xl font-bold text-white">{total}</p>
        </div>
        <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
          <p className="text-sm text-gray-400">Типы (уник.)</p>
          <p className="text-2xl font-bold text-green-400">{Object.keys(byType).length}</p>
        </div>
        <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/30">
          <p className="text-sm text-gray-400">Уровни (уник.)</p>
          <p className="text-2xl font-bold text-yellow-400">{Object.keys(byLevel).length}</p>
        </div>
        <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/30">
          <p className="text-sm text-gray-400">error</p>
          <p className="text-2xl font-bold text-red-400">{byLevel.error ?? byLevel.Error ?? 0}</p>
        </div>
      </div>

      <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600/50">
        <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
          События
          <FileText className="w-5 h-5" />
        </h3>
        <div className="space-y-2 max-h-[420px] overflow-y-auto">
          {events.map((event, index) => {
            const t = (event.type ?? event.level ?? 'info').toLowerCase();
            const getIcon = () => {
              if (t === 'success') return <CheckCircle className="w-5 h-5 text-green-400" />;
              if (t === 'warning') return <AlertCircle className="w-5 h-5 text-yellow-400" />;
              if (t === 'error') return <AlertCircle className="w-5 h-5 text-red-400" />;
              return <Info className="w-5 h-5 text-blue-400" />;
            };
            const time = event.timestamp?.slice(11, 19) ?? event.timestamp ?? '—';

            return (
              <div key={index} className="flex items-center gap-3 bg-gray-800/50 p-3 rounded-lg">
                {getIcon()}
                <span className="text-sm text-gray-400 shrink-0">{time}</span>
                <span className="flex-1 text-white text-sm">
                  {event.message ?? JSON.stringify(event)}
                </span>
              </div>
            );
          })}
          {events.length === 0 && <p className="text-gray-500 text-sm">Нет событий по фильтру</p>}
        </div>
      </div>
    </div>
  );
}
