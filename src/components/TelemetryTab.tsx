import { Battery, Gauge, Signal, Satellite, Navigation, ThermometerSun, LucideIcon } from 'lucide-react';
import { useMemo } from 'react';
import { useTelemetry } from '../hooks/useTelemetry';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import { HelpTooltip } from './ui/HelpTooltip';
import { HELP } from './ui/helpTexts';

function horizSpeed(vx: number, vy: number): number {
  return Math.sqrt(vx * vx + vy * vy);
}

export default function TelemetryTab() {
  const { data: tel, connected } = useTelemetry();
  const { data: status } = useApi(() => api.status(), []);
  const { data: motors } = useApi(() => api.motors(), []);

  const altitude = tel.position?.z ?? 0;
  const vx = tel.velocity?.vx ?? 0;
  const vy = tel.velocity?.vy ?? 0;
  const vz = tel.velocity?.vz ?? 0;
  const speed = horizSpeed(vx, vy);
  const signal =
    typeof (tel as Record<string, unknown>).signal_strength === 'number'
      ? ((tel as Record<string, unknown>).signal_strength as number)
      : connected
        ? 95
        : 0;
  const gps =
    typeof (tel as Record<string, unknown>).gps_status === 'string'
      ? ((tel as Record<string, unknown>).gps_status as string)
      : '—';
  const temperature =
    typeof (tel as Record<string, unknown>).temperature === 'number'
      ? ((tel as Record<string, unknown>).temperature as number)
      : 25;

  const motorLabel = useMemo(() => {
    if (!motors) return '—';
    const m = motors as Record<string, unknown>;
    if (m.is_armed === true) return 'Вооружен';
    if (m.is_flying === true) return 'Полёт';
    return 'Ожидание';
  }, [motors]);

  const navLabel = useMemo(() => {
    if (!status) return '—';
    const s = status as Record<string, unknown>;
    return String(s.state ?? '—');
  }, [status]);

  const linkLabel = useMemo(() => {
    if (!status) return '—';
    const s = status as Record<string, unknown>;
    const sub = s.sub_agent_online;
    return sub ? 'Sub-agent' : 'Локально';
  }, [status]);

  const MetricCard = ({
    icon: Icon,
    label,
    value,
    unit,
    iconWrapClass,
    iconClass,
    helpKey,
  }: {
    icon: LucideIcon;
    label: string;
    value: string | number;
    unit?: string;
    iconWrapClass: string;
    iconClass: string;
    helpKey: keyof typeof HELP;
  }) => (
    <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50 hover:border-cyan-500/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-lg ${iconWrapClass}`}>
          <Icon className={`w-6 h-6 ${iconClass}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1">
            <p className="text-sm text-gray-400">{label}</p>
            <HelpTooltip text={HELP[helpKey]} placement="right" />
          </div>
          <p className="text-2xl font-bold text-white">
            {value} {unit && <span className="text-lg text-gray-400">{unit}</span>}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Телеметрия в реальном времени
        </h2>
        <p className="text-gray-400">Мониторинг состояния дрона {connected ? '(WS+REST)' : '(REST)'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          icon={Battery}
          label="Заряд батареи"
          value={tel.battery.toFixed(1)}
          unit="%"
          iconWrapClass="bg-green-500/20"
          iconClass="text-green-400"
          helpKey="metricBattery"
        />
        <MetricCard
          icon={Gauge}
          label="Высота"
          value={altitude.toFixed(1)}
          unit="м"
          iconWrapClass="bg-blue-500/20"
          iconClass="text-blue-400"
          helpKey="metricAltitude"
        />
        <MetricCard
          icon={Navigation}
          label="Скорость (гориз.)"
          value={speed.toFixed(2)}
          unit="м/с"
          iconWrapClass="bg-purple-500/20"
          iconClass="text-purple-400"
          helpKey="metricSpeed"
        />
        <MetricCard
          icon={Signal}
          label="Сигнал"
          value={Number(signal).toFixed(0)}
          unit="%"
          iconWrapClass="bg-cyan-500/20"
          iconClass="text-cyan-400"
          helpKey="metricSignal"
        />
        <MetricCard
          icon={Satellite}
          label="GPS"
          value={gps}
          iconWrapClass="bg-yellow-500/20"
          iconClass="text-yellow-400"
          helpKey="metricGps"
        />
        <MetricCard
          icon={ThermometerSun}
          label="Температура"
          value={Number(temperature).toFixed(1)}
          unit="°C"
          iconWrapClass="bg-orange-500/20"
          iconClass="text-orange-400"
          helpKey="metricTemp"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600/50">
          <h3 className="text-xl font-bold mb-4 text-cyan-400">Позиция</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">X (Восток):</span>
              <span className="text-white font-mono text-lg">{(tel.position?.x ?? 0).toFixed(2)} м</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Y (Север):</span>
              <span className="text-white font-mono text-lg">{(tel.position?.y ?? 0).toFixed(2)} м</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Z (Высота):</span>
              <span className="text-white font-mono text-lg">{(tel.position?.z ?? 0).toFixed(2)} м</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600/50">
          <h3 className="text-xl font-bold mb-4 text-cyan-400">Ориентация</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Roll:</span>
              <span className="text-white font-mono text-lg">{(tel.attitude?.roll ?? 0).toFixed(2)}°</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Pitch:</span>
              <span className="text-white font-mono text-lg">{(tel.attitude?.pitch ?? 0).toFixed(2)}°</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Yaw:</span>
              <span className="text-white font-mono text-lg">{(tel.attitude?.yaw ?? 0).toFixed(2)}°</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600/50">
          <h3 className="text-xl font-bold mb-4 text-cyan-400">Скорость</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Vx:</span>
              <span className="text-white font-mono text-lg">{vx.toFixed(2)} м/с</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Vy:</span>
              <span className="text-white font-mono text-lg">{vy.toFixed(2)} м/с</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Vz:</span>
              <span className="text-white font-mono text-lg">{vz.toFixed(2)} м/с</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600/50">
          <h3 className="text-xl font-bold mb-4 text-cyan-400 flex items-center gap-2">
            Статус систем
            <HelpTooltip text={HELP.sysMotors} />
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 flex items-center gap-1">
                Моторы
                <HelpTooltip text={HELP.sysMotors} />
              </span>
              <span className="text-cyan-300 font-semibold">{motorLabel}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 flex items-center gap-1">
                Агент
                <HelpTooltip text={HELP.sysNav} />
              </span>
              <span className="text-cyan-300 font-semibold">{navLabel}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 flex items-center gap-1">
                Связь / аналитика
                <HelpTooltip text={HELP.sysLink} />
              </span>
              <span className="text-cyan-300 font-semibold">{linkLabel}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg p-4 border border-cyan-500/30">
        <p className="text-sm text-gray-300">
          <span className="text-cyan-400 font-semibold">Совет:</span> REST-пул каждые 2 с; при активном WebSocket
          данные телеметрии подставляются из потока.
        </p>
      </div>
    </div>
  );
}
