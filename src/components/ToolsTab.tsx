import { useState } from 'react';
import { Wrench, CheckCircle, XCircle, Play } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import type { ToolCard } from '../types/api';
import { HelpTooltip } from './ui/HelpTooltip';
import { HELP } from './ui/helpTexts';

export default function ToolsTab() {
  const { data, loading, error, refresh } = useApi(() => api.tools(), []);
  const [banner, setBanner] = useState<string | null>(null);

  const tools: ToolCard[] = (data && (data as { tools: ToolCard[] }).tools) || [];

  const runTool = async (id: string) => {
    try {
      const r = (await api.toolExecute(id)) as { message?: string; success?: boolean };
      setBanner(r.message ?? (r.success ? 'OK' : 'Ошибка'));
    } catch (e) {
      setBanner(e instanceof Error ? e.message : 'Ошибка');
    }
    setTimeout(() => setBanner(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Инструменты и модули
        </h2>
        <p className="text-gray-400">Управление системными компонентами</p>
      </div>

      {banner && (
        <div className="rounded-lg border border-cyan-500/40 bg-cyan-950/40 px-4 py-2 text-sm text-cyan-100">
          {banner}
        </div>
      )}

      {loading && <p className="text-gray-400 text-sm">Загрузка...</p>}
      {error && (
        <p className="text-red-400 text-sm">
          {error.message}{' '}
          <button type="button" className="underline text-cyan-400" onClick={() => void refresh()}>
            Повторить
          </button>
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <div
            key={tool.id}
            className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50 hover:border-cyan-500/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-lg ${
                  tool.status === 'ready' || tool.status === 'registered'
                    ? 'bg-green-500/20'
                    : 'bg-red-500/20'
                }`}
              >
                {tool.status === 'ready' || tool.status === 'registered' ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Wrench className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-bold text-white">{tool.name}</h3>
                </div>
                <p className="text-sm text-gray-400 mb-3">{tool.description}</p>
                <button
                  type="button"
                  onClick={() => void runTool(tool.id)}
                  className="flex items-center gap-2 px-3 py-2 bg-cyan-600/80 hover:bg-cyan-600 rounded-lg text-white text-sm"
                >
                  <Play className="w-4 h-4" />
                  Запустить
                  <HelpTooltip text={HELP.toolRun} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
