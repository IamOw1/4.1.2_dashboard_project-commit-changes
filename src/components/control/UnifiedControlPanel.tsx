import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { useOps } from '@/lib/ops-context';
import { VideoPlayer } from './VideoPlayer';
import { CommandPanel } from './CommandPanel';
import { RCControllerEmulator } from './RCControllerEmulator';
import { useTelemetry } from '@/lib/mock-data';

type ActiveTab = 'camera' | 'commands' | 'rc';

// Конфигурация (заглушки до создания центрального config)
const ALLOW_DEMO_COMMANDS = true;
const ENABLE_RC_EMULATION = true;

/**
 * Единая панель управления "Камера + Команды + RC"
 * 
 * Объединяет три вкладки для удобного управления дроном:
 * - 📷 Камера: видеопоток с детекцией объектов
 * - 🎮 Команды: быстрые команды управления
 * - 📡 RC-контроллер: эмуляция пульта ДУ
 * 
 * @example
 * ```tsx
 * <UnifiedControlPanel />
 * ```
 */
export const UnifiedControlPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('camera');
  const { demoMode } = useOps();
  const telemetry = useTelemetry();

  const handleSnapshot = async () => {
    // Обработка снимка с камеры
    console.log('Snapshot captured');
  };

  const sendCommand = async (command: string, params?: Record<string, unknown>) => {
    // Отправка команды дрону
    console.log('Command sent:', command, params);
  };

  const handleRCInput = (stickData: { left: { x: number; y: number }; right: { x: number; y: number } }) => {
    // Обработка ввода с RC-стиком
    console.log('RC input:', stickData);
  };

  const handleRCButton = (button: string) => {
    // Обработка кнопки RC-пульта
    console.log('RC button:', button);
  };

  return (
    <Card className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="camera">📷 Камера</TabsTrigger>
          <TabsTrigger value="commands">🎮 Команды</TabsTrigger>
          <TabsTrigger value="rc">📡 RC-контроллер</TabsTrigger>
        </TabsList>

        <TabsContent value="camera" className="flex-1 mt-0">
          <VideoPlayer
            streamUrl={demoMode ? '/demo/video-loop.mp4' : '/ws/camera'}
            showObjectDetection={true}
            onSnapshot={handleSnapshot}
          />
        </TabsContent>

        <TabsContent value="commands" className="flex-1 mt-0">
          <CommandPanel
            onSendCommand={sendCommand}
            disabled={demoMode && !ALLOW_DEMO_COMMANDS}
            quickActions={[
              { label: '🚀 Взлёт', command: 'TAKEOFF', confirm: true },
              { label: '🏠 Домой', command: 'RTL', confirm: true },
              { label: '⏸ Пауза', command: 'HOVER', confirm: false },
            ]}
          />
        </TabsContent>

        <TabsContent value="rc" className="flex-1 mt-0">
          <RCControllerEmulator
            enabled={demoMode || ENABLE_RC_EMULATION}
            onStickMove={handleRCInput}
            onButtonPress={handleRCButton}
            telemetry={telemetry}
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
};
