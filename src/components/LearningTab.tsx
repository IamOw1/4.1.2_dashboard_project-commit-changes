import { Brain, Play, Pause, RotateCcw, Download } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import { HelpTooltip } from './ui/HelpTooltip';
import { HELP } from './ui/helpTexts';

export default function LearningTab() {
  const { data, refresh } = useApi(() => api.learningProgress(), []);
  const pr = (data ?? {}) as Record<string, unknown>;
  const experimental = pr.experimental === true;
  const reward = typeof pr.reward === 'number' ? pr.reward : 0;
  const loss = typeof pr.loss === 'number' ? pr.loss : 0;
  const episodes = typeof pr.episodes === 'number' ? pr.episodes : 0;
  const tasks = Array.isArray(pr.tasks)
    ? (pr.tasks as { name: string; progress: number }[])
    : [];

  const act = async (fn: () => Promise<unknown>) => {
    await fn();
    await refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Обучение с подкреплением
          </h2>
          <p className="text-gray-400">Управление процессом обучения ИИ-агента</p>
        </div>
        {experimental && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-950/40 px-3 py-2 text-amber-100 text-sm">
            Демо-режим
            <HelpTooltip text={HELP.learnDemo} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600/50">
          <p className="text-sm text-gray-400 mb-1">Текущая награда</p>
          <p className="text-3xl font-bold text-cyan-400">{reward.toFixed(2)}</p>
        </div>
        <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600/50">
          <p className="text-sm text-gray-400 mb-1">Потеря (Loss)</p>
          <p className="text-3xl font-bold text-purple-400">{loss.toFixed(4)}</p>
        </div>
        <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600/50">
          <p className="text-sm text-gray-400 mb-1">Эпизодов</p>
          <p className="text-3xl font-bold text-blue-400">{episodes.toLocaleString('ru-RU')}</p>
        </div>
      </div>

      <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600/50">
        <h3 className="text-xl font-bold text-cyan-400 mb-4">Управление обучением</h3>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void act(() => api.learningStart())}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg hover:shadow-green-500/50 transition-all"
          >
            <Play className="w-5 h-5" />
            Начать обучение
            <HelpTooltip text={HELP.learnStart} />
          </button>
          <button
            type="button"
            onClick={() => void act(() => api.learningPause())}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:shadow-lg hover:shadow-yellow-500/50 transition-all"
          >
            <Pause className="w-5 h-5" />
            Приостановить
            <HelpTooltip text={HELP.learnPause} />
          </button>
          <button
            type="button"
            onClick={() => void act(() => api.learningReset())}
            className="flex items-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Сбросить модель
            <HelpTooltip text={HELP.learnReset} />
          </button>
          <button
            type="button"
            onClick={() => void act(() => api.learningExport())}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
          >
            <Download className="w-5 h-5" />
            Экспортировать
            <HelpTooltip text={HELP.learnExport} />
          </button>
        </div>
      </div>

      <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600/50">
        <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
          Прогресс задач
          <Brain className="w-5 h-5 text-cyan-400" />
        </h3>
        <div className="space-y-4">
          {tasks.map((t, i) => (
            <div key={i}>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white">{t.name}</span>
                <span className="text-cyan-400">{t.progress}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, t.progress))}%` }}
                />
              </div>
            </div>
          ))}
          {tasks.length === 0 && <p className="text-gray-500 text-sm">Нет задач в ответе API</p>}
        </div>
      </div>
    </div>
  );
}
