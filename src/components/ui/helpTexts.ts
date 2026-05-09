/** Короткие русские подсказки для UI (ключ → текст для HelpTooltip). */
export const HELP = {
  tabTelemetry:
    'Телеметрия в реальном времени: батарея, позиция, ориентация. Данные с бэка или демо.',
  tabMissions: 'Создание маршрута, запуск и сохранение миссий на сервере.',
  tabCommands: 'Команды полёта через CoreAgent и PitControllers. Проверьте зону безопасности.',
  tabTools: 'Системные инструменты и модули; запуск через API.',
  tabLearning: 'Обучение с подкреплением (экспериментально). Прогресс может быть демо.',
  tabFleet: 'Формация флота и обмен через mesh (один дрон — мок расширенного флота).',
  tabCamera: 'Снимок с камеры или заглушка; запись и параметры виртуальной камеры.',
  tabEvents: 'Журнал событий из data/logs/events.jsonl или демо.',
  tabBackups: 'ZIP архивы состояния и конфигурации в каталоге backup/.',

  metricBattery: 'Заряд АКБ от телеметрии агента.',
  metricAltitude: 'Высота по оси Z из позиции телеметрии.',
  metricSpeed: 'Горизонтальная скорость из компонентов vx, vy.',
  metricSignal: 'Оценка качества связи (если есть в телеметрии).',
  metricGps: 'Статус GNSS из телеметрии.',
  metricTemp: 'Температура полётного контроллера или бортовой отчёт.',

  sysMotors: 'Сводка с /api/v1/motors: вооружение и состояние моторов.',
  sysNav: 'Состояние агента и миссии с /api/v1/status.',
  sysLink: 'Sub-agent и mesh из статуса агента.',

  missionName: 'Произвольное имя для сохранения и отображения.',
  missionType: 'Категория задания; список совпадает с бэкендом.',
  missionAlt: 'Целевая высота полёта для расчёта точек по умолчанию.',
  missionSpeed: 'Типичная скорость между точками.',
  missionWpAdd: 'Добавляет точку с текущими высотой и скоростью.',
  missionStart: 'POST /api/v1/mission/start — запускает run_mission на агенте или демо.',
  missionSave: 'Сохраняет JSON миссии в data/missions/.',
  missionPreview: 'Локальный просмотр точек без отправки на дрон.',
  missionStop: 'Прерывание: состояние EMERGENCY останавливает цикл миссии.',

  cmdTakeoff: 'Команда TAKEOFF: взлёт на высоту из параметров (PitControllers).',
  cmdLand: 'Команда LAND: посадка в текущей точке.',
  cmdHover: 'Команда HOVER: удержание позиции.',
  cmdRtl: 'Команда RTL: возврат домой (логика агента / mesh).',
  cmdGoto: 'Команда GOTO: координаты x, y, z в метрах в params.',
  cmdArm: 'Команда ARM — включение моторов; DISARM при повторе через отдельную команду при необходимости.',
  cmdGotoFields: 'Локальные координаты для GOTO (x, y, z).',
  cmdTakeoffParams: 'Высота и скорость профиля взлёта в params для TAKEOFF.',
  emergLand: 'POST /api/v1/emergency/land — посадка с причиной emergency.',
  emergStop: 'POST /api/v1/emergency/stop — emergency_stop моторов и EMERGENCY.',

  toolRun: 'POST /api/v1/tools/execute — запуск выбранного инструмента на сервере.',

  learnStart: 'POST /api/v1/learning/start — заглушка до подключения learner.',
  learnPause: 'POST /api/v1/learning/pause.',
  learnReset: 'POST /api/v1/learning/reset.',
  learnExport: 'POST /api/v1/learning/export.',
  learnDemo: 'Если experimental=true — данные демонстрационные.',

  fleetFormation: 'Запись формации и broadcast в mesh.',
  fleetLeader: 'Лидер флота в локальном состоянии API.',
  fleetCharge: 'Средний заряд по списку дронов из статуса.',

  camSnapshot: 'GET /api/v1/camera/snapshot — JPEG/PNG с симулятора или заглушка.',
  camRecord: 'Старт/стоп записи: флаги на сервере.',
  camZoom: 'Виртуальный зум (состояние API).',
  camBright: 'Яркость виртуальной камеры.',
  camDetect: 'Детекции с ObjectDetectionTool, если подключён; иначе пусто.',

  evtFilter: 'Фильтрация списка событий по типу и уровню.',
  evtStats: 'Агрегаты из того же журнала.',

  backupCreate: 'ZIP: data/state, data/missions, config.',
  backupDownload: 'Скачивание готового ZIP с сервера (GET /api/v1/backup/download/{id}).',
  backupRestore: 'Распаковка выбранного бэкапа (осторожно: перезапись).',
  backupDelete: 'Удаление файла бэкапа на сервере.',

  chatSend: 'Вопрос к Sub-agent через DeepSeek при наличии ключа; иначе offline-ответ.',
  chatOffline: 'Ответ сгенерирован локально без LLM.',

  headerHealth: 'Пульс /health: доступность API.',
} as const;

export type HelpKey = keyof typeof HELP;
