import { useEffect, useState } from 'react';
import {
  Plane,
  Activity,
  Map,
  Gamepad,
  Wrench,
  GraduationCap,
  Users,
  Camera,
  FileText,
  Database,
  MessageCircle,
  X,
} from 'lucide-react';
import TelemetryTab from './components/TelemetryTab';
import MissionsTab from './components/MissionsTab';
import CommandsTab from './components/CommandsTab';
import ToolsTab from './components/ToolsTab';
import LearningTab from './components/LearningTab';
import FleetTab from './components/FleetTab';
import CameraTab from './components/CameraTab';
import EventsTab from './components/EventsTab';
import BackupsTab from './components/BackupsTab';
import AIChat from './components/AIChat';
import { api } from './services/api';
import { HelpTooltip } from './components/ui/HelpTooltip';
import { HELP } from './components/ui/helpTexts';

type Tab =
  | 'telemetry'
  | 'missions'
  | 'commands'
  | 'tools'
  | 'learning'
  | 'fleet'
  | 'camera'
  | 'events'
  | 'backups';

const TAB_HELP: Record<Tab, keyof typeof HELP> = {
  telemetry: 'tabTelemetry',
  missions: 'tabMissions',
  commands: 'tabCommands',
  tools: 'tabTools',
  learning: 'tabLearning',
  fleet: 'tabFleet',
  camera: 'tabCamera',
  events: 'tabEvents',
  backups: 'tabBackups',
};

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('telemetry');
  const [chatOpen, setChatOpen] = useState(false);
  const [healthOk, setHealthOk] = useState<boolean | null>(null);

  useEffect(() => {
    const ping = async () => {
      try {
        const h = await api.health();
        setHealthOk(h.status === 'healthy');
      } catch {
        setHealthOk(false);
      }
    };
    void ping();
    const id = setInterval(ping, 10000);
    return () => clearInterval(id);
  }, []);

  const tabs: { id: Tab; label: string; icon: typeof Activity }[] = [
    { id: 'telemetry', label: 'Телеметрия', icon: Activity },
    { id: 'missions', label: 'Миссии', icon: Map },
    { id: 'commands', label: 'Команды', icon: Gamepad },
    { id: 'tools', label: 'Инструменты', icon: Wrench },
    { id: 'learning', label: 'Обучение', icon: GraduationCap },
    { id: 'fleet', label: 'Флот', icon: Users },
    { id: 'camera', label: 'Камера', icon: Camera },
    { id: 'events', label: 'События', icon: FileText },
    { id: 'backups', label: 'Бэкапы', icon: Database },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'telemetry':
        return <TelemetryTab />;
      case 'missions':
        return <MissionsTab />;
      case 'commands':
        return <CommandsTab />;
      case 'tools':
        return <ToolsTab />;
      case 'learning':
        return <LearningTab />;
      case 'fleet':
        return <FleetTab />;
      case 'camera':
        return <CameraTab />;
      case 'events':
        return <EventsTab />;
      case 'backups':
        return <BackupsTab />;
      default:
        return <TelemetryTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <header className="bg-gray-800/50 backdrop-blur-lg border-b border-cyan-500/30 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Plane className="w-8 h-8 text-cyan-400" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  COBA AI Drone Agent v4.1
                </h1>
                <p className="text-sm text-gray-400">Интеллектуальная система управления дронами</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${healthOk ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
                />
                <span className="text-sm text-gray-300">
                  {healthOk === null ? 'Проверка API…' : healthOk ? 'API доступен' : 'API недоступен'}
                </span>
                <HelpTooltip text={HELP.headerHealth} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700/50 mb-6 p-2">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/50 scale-105'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white hover:scale-102'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                  <HelpTooltip text={HELP[TAB_HELP[tab.id]]} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6 min-h-[600px]">
          {renderTabContent()}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-4 rounded-full shadow-2xl shadow-cyan-500/50 hover:scale-110 transition-transform duration-300 z-40"
      >
        {chatOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {chatOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-gray-800/95 backdrop-blur-xl rounded-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 z-50 flex flex-col">
          <AIChat />
        </div>
      )}
    </div>
  );
}

export default App;
