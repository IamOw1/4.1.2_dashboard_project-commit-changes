import { useEffect, useState } from 'react';
import { Database, Download, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import type { BackupItem } from '../types/api';
import { HelpTooltip } from './ui/HelpTooltip';
import { HELP } from './ui/helpTexts';

export default function BackupsTab() {
  const [items, setItems] = useState<BackupItem[]>([]);
  const [banner, setBanner] = useState<string | null>(null);

  const load = async () => {
    try {
      const r = await api.backupList();
      setItems(r.items ?? []);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const createBackup = async () => {
    try {
      await api.backupCreate();
      setBanner('Бэкап создан');
      await load();
    } catch (e) {
      setBanner(e instanceof Error ? e.message : 'Ошибка');
    }
    setTimeout(() => setBanner(null), 4000);
  };

  const remove = async (id: string) => {
    if (!confirm(`Удалить резервную копию ${id}?`)) return;
    try {
      await api.backupDelete(id);
      setBanner('Удалено');
      await load();
    } catch (e) {
      setBanner(e instanceof Error ? e.message : 'Ошибка');
    }
    setTimeout(() => setBanner(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Резервные копии
        </h2>
        <p className="text-gray-400">Управление резервными копиями системы</p>
      </div>

      {banner && (
        <div className="rounded-lg border border-cyan-500/40 bg-cyan-950/40 px-4 py-2 text-sm text-cyan-100">
          {banner}
        </div>
      )}

      <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600/50">
        <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
          Создать новую резервную копию
          <HelpTooltip text={HELP.backupCreate} />
        </h3>
        <button
          type="button"
          onClick={() => void createBackup()}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
        >
          <Database className="w-5 h-5" />
          Создать бэкап
        </button>
      </div>

      <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600/50">
        <h3 className="text-xl font-bold text-cyan-400 mb-4">Доступные резервные копии</h3>
        <div className="space-y-3">
          {items.map((backup) => (
            <div key={backup.id} className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center shrink-0">
                  <Database className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-white truncate">{backup.filename ?? backup.id}</h4>
                  <p className="text-sm text-gray-400">
                    {backup.created_at}
                    {backup.size_bytes != null && ` • ${(backup.size_bytes / 1024 / 1024).toFixed(1)} MB`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={api.backupDownloadUrl(backup.id)}
                  download
                  className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
                  title="Скачать"
                >
                  <Download className="w-5 h-5" />
                </a>
                <HelpTooltip text={HELP.backupDownload} />
                <button
                  type="button"
                  onClick={() => void remove(backup.id)}
                  className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  <span className="sr-only">Удалить</span>
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-gray-500 text-sm">Пока нет файлов в backup/</p>}
        </div>
      </div>
    </div>
  );
}
