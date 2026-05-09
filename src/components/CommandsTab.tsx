import { useEffect, useState } from 'react';
import { PlaneTakeoff, PlaneLanding, Pause, Home, Navigation, CircleDot, ShieldOff } from 'lucide-react';
import { api } from '../services/api';
import { HelpTooltip } from './ui/HelpTooltip';
import { HELP } from './ui/helpTexts';

export default function CommandsTab() {
  const [gotoX, setGotoX] = useState(50);
  const [gotoY, setGotoY] = useState(50);
  const [gotoZ, setGotoZ] = useState(20);
  const [takeoffAlt, setTakeoffAlt] = useState(15);
  const [takeoffSpeed, setTakeoffSpeed] = useState(2);
  const [banner, setBanner] = useState<string | null>(null);
  const [history, setHistory] = useState<{ time: string; text: string }[]>([]);

  const show = (msg: string) => {
    setBanner(msg);
    setTimeout(() => setBanner(null), 4000);
  };

  const runCommand = async (command: string, params: Record<string, number | string> = {}) => {
    try {
      const r = await api.command(command, params);
      show(r.success ? `${command}: ок` : `${command}: ошибка`);
    } catch (e) {
      show(`${command}: ${e instanceof Error ? e.message : 'ошибка'}`);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const ev = await api.events({ limit: 10 });
        const rows = (ev.events ?? []).map((e) => ({
          time: e.timestamp?.slice(11, 19) ?? '—',
          text: e.message ?? JSON.stringify(e),
        }));
        setHistory(rows);
      } catch {
        setHistory([]);
      }
    };
    void load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const CommandButton = ({
    icon: Icon,
    label,
    description,
    command,
    params,
    color,
    helpKey,
  }: {
    icon: typeof PlaneTakeoff;
    label: string;
    description: string;
    command: string;
    params?: Record<string, number | string>;
    color: 'green' | 'orange' | 'blue' | 'purple' | 'cyan' | 'red';
    helpKey: keyof typeof HELP;
  }) => {
    const ring: Record<typeof color, string> = {
      green: 'hover:border-green-500/50 hover:shadow-green-500/20',
      orange: 'hover:border-orange-500/50 hover:shadow-orange-500/20',
      blue: 'hover:border-blue-500/50 hover:shadow-blue-500/20',
      purple: 'hover:border-purple-500/50 hover:shadow-purple-500/20',
      cyan: 'hover:border-cyan-500/50 hover:shadow-cyan-500/20',
      red: 'hover:border-red-500/50 hover:shadow-red-500/20',
    };
    const iconBg: Record<typeof color, string> = {
      green: 'bg-green-500/20 group-hover:bg-green-500/30',
      orange: 'bg-orange-500/20 group-hover:bg-orange-500/30',
      blue: 'bg-blue-500/20 group-hover:bg-blue-500/30',
      purple: 'bg-purple-500/20 group-hover:bg-purple-500/30',
      cyan: 'bg-cyan-500/20 group-hover:bg-cyan-500/30',
      red: 'bg-red-500/20 group-hover:bg-red-500/30',
    };
    const iconCol: Record<typeof color, string> = {
      green: 'text-green-400',
      orange: 'text-orange-400',
      blue: 'text-blue-400',
      purple: 'text-purple-400',
      cyan: 'text-cyan-400',
      red: 'text-red-400',
    };
    return (
      <button
        type="button"
        onClick={() => void runCommand(command, params ?? {})}
        className={`bg-gray-700/30 rounded-lg p-6 border border-gray-600/50 ${ring[color]} hover:shadow-lg transition-all text-left group`}
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${iconBg[color]} transition-colors`}>
            <Icon className={`w-6 h-6 ${iconCol[color]}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-white">{label}</h3>
              <HelpTooltip text={HELP[helpKey]} />
            </div>
            <p className="text-sm text-gray-400">{description}</p>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Команды управления
        </h2>
        <p className="text-gray-400">Быстрое управление дроном</p>
      </div>

      {banner && (
        <div className="rounded-lg border border-cyan-500/40 bg-cyan-950/40 px-4 py-2 text-sm text-cyan-100">
          {banner}
        </div>
      )}

      <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-4 border border-yellow-500/30">
        <p className="text-sm text-yellow-200">
          <span className="font-semibold">⚠️ Внимание:</span> Убедитесь, что дрон находится в безопасной зоне перед
          выполнением команд.
        </p>
      </div>

      <div>
        <h3 className="text-xl font-bold text-cyan-400 mb-4">Основные команды</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CommandButton
            icon={PlaneTakeoff}
            label="Взлёт"
            description="Автоматический взлёт на заданную высоту"
            command="TAKEOFF"
            params={{ altitude: takeoffAlt, climb_speed: takeoffSpeed }}
            color="green"
            helpKey="cmdTakeoff"
          />
          <CommandButton
            icon={PlaneLanding}
            label="Посадка"
            description="Безопасная посадка в текущей точке"
            command="LAND"
            color="orange"
            helpKey="cmdLand"
          />
          <CommandButton
            icon={Pause}
            label="Зависание"
            description="Остановка и удержание текущей позиции"
            command="HOVER"
            color="blue"
            helpKey="cmdHover"
          />
          <CommandButton
            icon={Home}
            label="Возврат домой"
            description="Автоматический возврат в точку старта"
            command="RTL"
            color="purple"
            helpKey="cmdRtl"
          />
          <CommandButton
            icon={Navigation}
            label="Перейти к точке"
            description="Текущие X/Y/Z из блока «Навигация к точке»"
            command="GOTO"
            params={{ x: gotoX, y: gotoY, z: gotoZ }}
            color="cyan"
            helpKey="cmdGoto"
          />
          <CommandButton
            icon={CircleDot}
            label="Arm"
            description="Включить моторы (ARM)"
            command="ARM"
            color="red"
            helpKey="cmdArm"
          />
          <CommandButton
            icon={ShieldOff}
            label="Disarm"
            description="Выключить моторы (DISARM)"
            command="DISARM"
            color="red"
            helpKey="cmdArm"
          />
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-cyan-400 mb-4">Ручное управление</h3>
        <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600/50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                Навигация к точке
                <HelpTooltip text={HELP.cmdGotoFields} />
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">X (м)</label>
                  <input
                    type="number"
                    value={gotoX}
                    onChange={(e) => setGotoX(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Y (м)</label>
                  <input
                    type="number"
                    value={gotoY}
                    onChange={(e) => setGotoY(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Z (м)</label>
                  <input
                    type="number"
                    value={gotoZ}
                    onChange={(e) => setGotoZ(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void runCommand('GOTO', { x: gotoX, y: gotoY, z: gotoZ })}
                  className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all font-medium"
                >
                  Перейти к точке
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                Параметры взлёта
                <HelpTooltip text={HELP.cmdTakeoffParams} />
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Высота взлёта (м)</label>
                  <input
                    type="number"
                    value={takeoffAlt}
                    min={5}
                    max={100}
                    onChange={(e) => setTakeoffAlt(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Скорость взлёта (м/с)</label>
                  <input
                    type="number"
                    value={takeoffSpeed}
                    min={0.5}
                    max={5}
                    step={0.5}
                    onChange={(e) => setTakeoffSpeed(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    void runCommand('TAKEOFF', { altitude: takeoffAlt, climb_speed: takeoffSpeed })
                  }
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg hover:shadow-green-500/50 transition-all font-medium"
                >
                  Выполнить взлёт
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-cyan-400 mb-4">Аварийные команды</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={async () => {
              try {
                await api.emergencyLand();
                show('Аварийная посадка: запрос отправлен');
              } catch (e) {
                show(e instanceof Error ? e.message : 'Ошибка');
              }
            }}
            className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 hover:bg-red-500/30 hover:shadow-lg hover:shadow-red-500/20 transition-all text-left"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-lg font-bold text-red-400 mb-1">Аварийная посадка</h4>
                <p className="text-sm text-gray-300">Немедленная посадка с максимальной скоростью</p>
              </div>
              <HelpTooltip text={HELP.emergLand} placement="left" />
            </div>
          </button>

          <button
            type="button"
            onClick={async () => {
              try {
                await api.emergencyStop();
                show('Экстренная остановка: запрос отправлен');
              } catch (e) {
                show(e instanceof Error ? e.message : 'Ошибка');
              }
            }}
            className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 hover:bg-red-500/30 hover:shadow-lg hover:shadow-red-500/20 transition-all text-left"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-lg font-bold text-red-400 mb-1">Экстренная остановка</h4>
                <p className="text-sm text-gray-300">Остановка всех моторов (только в безопасных условиях!)</p>
              </div>
              <HelpTooltip text={HELP.emergStop} placement="left" />
            </div>
          </button>
        </div>
      </div>

      <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600/50">
        <h3 className="text-xl font-bold text-cyan-400 mb-4">Последние события (журнал)</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {history.length === 0 ? (
            <p className="text-sm text-gray-500">Нет данных</p>
          ) : (
            history.map((h, i) => (
              <div key={i} className="flex items-center justify-between text-sm gap-2">
                <span className="text-gray-400 shrink-0">{h.time}</span>
                <span className="text-white flex-1 truncate">{h.text}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
