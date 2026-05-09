# Руководство пользователя - COBA AI Drone Agent v4.1

## О проекте

**COBA AI Drone Agent** - это комплексная система автономного управления дроном с искусственным интеллектом. Система включает интеллектуальных агентов, симуляцию полета, сбор телеметрии и сетевые возможности для координации нескольких дронов.

## 🚀 Быстрый старт

### 1. Установка и запуск

```bash
# Клонирование репозитория
git clone https://github.com/IamOw1/preview-version-4.1_coba_ai_drone_final.git
cd preview-version-4.1_coba_ai_drone_final

# Установка зависимостей
pip install -r requirements.txt

# Проверка системы
python main.py check

# Запуск полной системы
python main.py all
```

### 2. Доступ к интерфейсам

После запуска будут доступны:
- **REST API**: http://localhost:8000
- **Web Dashboard**: http://localhost:8501
- **Документация API**: http://localhost:8000/docs

## 🧩 Архитектура системы

### Компоненты

#### 🤖 Core Agent
Основной агент принятия решений с непрерывным циклом:
- **Восприятие** (perceive): сбор данных от сенсоров
- **Решение** (decide): анализ ситуации и выбор действия
- **Действие** (act): выполнение команд

#### 🧠 Sub-Agent
Помощник с ИИ для:
- Анализа сложных ситуаций
- Формирования рекомендаций
- Интеграции с внешними ИИ (DeepSeek)

#### 🛩️ PitControllers
Система управления моторами:
- Поддержка 4/6/8 моторов
- Протоколы: DShot, PWM
- Команды: ARM, DISARM, TAKEOFF, LAND, HOVER

#### 🌐 Mesh Network
Сетевая координация дронов:
- UDP-based коммуникация
- Автообнаружение узлов
- Шифрование данных

#### 📊 OpenQ
Аналитика полетов:
- Сбор телеметрии в реальном времени
- Статистический анализ
- Сжатие и хранение данных

## 🎮 Использование

### Через Web Dashboard

1. Откройте http://localhost:8501
2. Авторизуйтесь (по умолчанию: admin/admin)
3. Используйте интерфейс для:
   - Мониторинга телеметрии
   - Отправки команд
   - Просмотра миссий
   - Анализа данных

### Через REST API

#### Проверка статуса
```bash
curl http://localhost:8000/health
```

#### Получение телеметрии
```bash
curl http://localhost:8000/api/v1/telemetry
```

#### Отправка команд
```bash
# Взлет
curl -X POST http://localhost:8000/api/v1/command \
  -H "Content-Type: application/json" \
  -d '{"command": "TAKEOFF", "params": {"altitude": 10}}'

# Посадка
curl -X POST http://localhost:8000/api/v1/command \
  -H "Content-Type: application/json" \
  -d '{"command": "LAND"}'

# Зависание
curl -X POST http://localhost:8000/api/v1/command \
  -H "Content-Type: application/json" \
  -d '{"command": "HOVER"}'
```

#### Запуск миссии
```bash
curl -X POST http://localhost:8000/api/v1/mission/start \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Mission",
    "waypoints": [
      {"lat": 55.7558, "lon": 37.6173, "alt": 50},
      {"lat": 55.7560, "lon": 37.6180, "alt": 50}
    ],
    "altitude": 50,
    "speed": 10
  }'
```

### Через WebSocket

```javascript
// Подключение
const ws = new WebSocket('ws://localhost:8000/ws/telemetry');

// Получение телеметрии
ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('Telemetry:', data);
};

// Отправка команд
ws.send(JSON.stringify({
    type: 'command',
    command: 'TAKEOFF',
    params: {altitude: 10}
}));
```

### Через GUI

```bash
python main.py gui
```

Графический интерфейс на PyQt с полным контролем.

## 🌐 Веб-дашборд

### Обзор

Веб-дашборд предоставляет полный контроль над системой через браузер. Доступен по адресу http://localhost:8501.

### Вкладки дашборда

#### 📊 Dashboard
- Общая сводка системы
- Метрики состояния (батарея, высота, скорость, сигнал)
- Статус агента и инструментов

#### 📈 Telemetry
- Детальная телеметрия в реальном времени
- Графики высоты, скорости, батареи, температуры
- Карта с позицией дрона (Google Maps, Yandex, OpenStreetMap)
- Индикаторы режима полёта, статуса моторов, уровня сигнала
- Настраиваемый интервал обновления (1-10 сек)

#### 🗺️ Missions
- **Создание и управление миссиями**
  - Пошаговая инструкция создания миссии
  - Типы миссий: патрулирование, обследование, доставка, поиск, картографирование, сопровождение, экстренное реагирование, тестовая
  - Интерактивная карта для рисования маршрута (левый клик - добавить точку, правый - удалить)
  - Настройка параметров полёта (высота, скорость, действия в точках)
  - Особые инструкции текстом
  - Предпросмотр и сохранение миссии
  - Запуск и мониторинг выполнения
  - Пример: поиск человека на открытой территории с автоматическим сканированием

#### 🎮 Flight
- Быстрые кнопки: ARM/DISARM, TAKEOFF, LAND, RTL, HOVER, GOTO
- Ручное управление: виртуальный джойстик, ползунки тяги
- Пакетные команды (последовательности действий)

#### 🚀 Scenarios
- 6 готовых сценариев полёта
- Патрулирование, поиск, обследование, доставка, рой, инспекция

#### 🧠 Learning
- Прогресс обучения с подкреплением (DQN)
- Графики reward и loss
- Управление процессом: старт/пауза/сброс
- Экспорт обученных весов нейросети
- Симуляция сценариев для тестирования ИИ

#### 🐝 Fleet
- Управление группой дронов
- Список дронов с статусом и позицией
- Координация роя: распределение задач, синхронизация
- Симуляция флотилии
- Визуализация mesh-топологии

#### 📹 Camera
- Видеопоток в реальном времени
- Управление камерой: зум, угол, режим съёмки
- Запись и скриншоты
- Интеграция с ObjectDetection (выделение объектов)

#### 📋 Events
- Журнал всех действий, ошибок, предупреждений
- Фильтрация по времени, типу события, идентификатору дрона
- Экспорт логов (CSV, JSON, текст)
- Настройка уведомлений (email, Telegram, webhook)

#### 💾 Backups
- Автоматическое резервное копирование
- Отчёты о миссиях: статистика, графики, анализ
- Восстановление состояния
- Экспорт данных для сторонних систем

### Плавающий чат с ИИ-помощником

- Доступен на всех вкладках
- Быстрые ответы для типовых сценариев
- Уведомления от дронов в реальном времени
- Возможность давать дополнительные инструкции во время миссии

### Запуск дашборда

```bash
# Запуск API сервера
uvicorn api.rest_api:app --port 8000

# Запуск дашборда (в другом терминале)
streamlit run dashboard/app.py --server.port 8501
```

Или используйте скрипт:

```bash
./start_dashboard.sh
```

## ⚙️ Конфигурация

### Основные настройки (config/config.yaml)

```yaml
agent_id: "drone_agent_001"
log_level: "INFO"

simulation:
  enabled: true
  simulator: "airsim"

safety:
  enabled: true
  battery_critical: 15
  max_altitude: 120

api:
  host: "0.0.0.0"
  port: 8000

dashboard:
  port: 8501
```

### Переменные окружения

```bash
# API ключи
export DEEPSEEK_API_KEY="your-deepseek-key"
export COBA_API_KEY="your-api-key"

# Система
export LOG_LEVEL="INFO"
export DASHBOARD_PASSWORD="secure-password"

# Дрон
export DRONE_CONNECTION_STRING="udp:127.0.0.1:14550"
```

## 🔧 Модели и симуляторы

### Поддерживаемые симуляторы

#### AirSim
```yaml
simulation:
  enabled: true
  simulator: "airsim"
  connection_string: "127.0.0.1:41451"
```

#### Unreal Engine
```yaml
simulation:
  enabled: true
  simulator: "unreal"
  connection_string: "127.0.0.1:41451"
```

#### SkyRover
```yaml
simulation:
  enabled: true
  simulator: "skyrover"
  connection_string: "127.0.0.1:9090"
```

### Реальный дрон

```yaml
simulation:
  enabled: false

hardware:
  drone_type: "real"
  connection_string: "udp:127.0.0.1:14550"
```

## 📊 Мониторинг и аналитика

### Телеметрия

Система собирает данные:
- **Позиция**: GPS координаты, высота
- **Движение**: скорость, ускорение, attitude
- **Система**: батарея, температура, сигнал
- **Моторы**: RPM, ток, температура

### OpenQ Analytics

```bash
# Просмотр полетов
curl http://localhost:8000/api/v1/flights

# Статус OpenQ
curl http://localhost:8000/api/v1/openq
```

### Логи

Логи сохраняются в `logs/`:
- `coba_agent.log` - действия агента
- `api.log` - API запросы
- `errors.log` - ошибки

## 🛠️ Инструменты и расширения

### Доступные инструменты

- **SLAM Navigation**: Навигация без GPS
- **Object Detection**: Распознавание объектов
- **Geospatial Mapping**: Картографирование
- **Precision Landing**: Точная посадка
- **Mission Planner**: Планирование миссий

### Добавление инструментов

```python
# tools/custom_tool.py
from tools.base_tool import BaseTool

class CustomTool(BaseTool):
    def __init__(self, config, agent=None):
        super().__init__(config, agent)
        self.name = "custom_tool"
```

## 🌐 Mesh Network

### Настройка сети

```yaml
mesh_network:
  enabled: true
  node_id: "drone_001"
  broadcast_port: 9000
  data_port: 9001
  heartbeat_interval: 5
  encryption: true
```

### Команды mesh

```bash
# Статус сети
curl http://localhost:8000/api/v1/mesh

# Отправка сообщения
curl -X POST http://localhost:8000/api/v1/mesh/broadcast \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello from drone_001"}'
```

## 🔒 Безопасность

### Рекомендации

1. **Измените пароли** по умолчанию
2. **Используйте HTTPS** в продакшене
3. **Настройте firewall** для ограничения доступа
4. **Регулярно обновляйте** систему
5. **Мониторьте логи** на подозрительную активность

### API ключи

```bash
# Генерация ключа
openssl rand -hex 32

# Настройка
export COBA_API_KEY="your-generated-key"
```

## 🚨 Аварийные ситуации

### Автоматические протоколы

Система автоматически реагирует на:
- **Низкий заряд батареи** (< 15%)
- **Потеря сигнала** с базой
- **Перегрев** компонентов
- **Выход за пределы зоны** полета

### Ручное вмешательство

```bash
# Экстренная посадка
curl -X POST http://localhost:8000/api/v1/command \
  -H "Content-Type: application/json" \
  -d '{"command": "EMERGENCY_LAND"}'

# Отключение моторов
curl -X POST http://localhost:8000/api/v1/command \
  -H "Content-Type: application/json" \
  -d '{"command": "DISARM"}'
```

## 📈 Производительность

### Оптимизация

1. **Используйте GPU** для ИИ задач
2. **Настройте кэширование** для частых запросов
3. **Оптимизируйте сеть** для mesh коммуникаций
4. **Мониторьте ресурсы** системы

### Метрики

```bash
# Системные метрики
curl http://localhost:8000/api/v1/metrics

# Производительность агента
curl http://localhost:8000/api/v1/performance
```

## 🔄 Обновление и обслуживание

### Обновление системы

```bash
# Остановка
python main.py stop

# Обновление кода
git pull origin main

# Обновление зависимостей
pip install -r requirements.txt --upgrade

# Запуск
python main.py all
```

### Резервное копирование

```bash
# Создание backup
python main.py backup

# Восстановление
python main.py restore --file backup_20240101.tar.gz
```

## 🐛 Устранение неполадок

### Распространенные проблемы

#### Система не запускается
```bash
# Проверка зависимостей
python main.py check

# Просмотр логов
tail -f logs/coba_agent.log
```

#### API недоступен
```bash
# Проверка порта
netstat -tlnp | grep 8000

# Перезапуск API
python main.py api
```

#### Проблемы с симулятором
```bash
# Проверка подключения
python -c "import airsim; client = airsim.MultirotorClient(); print('OK')"

# Логи симулятора
tail -f logs/simulator.log
```

#### Высокое потребление ресурсов
```bash
# Мониторинг процессов
top -p $(pgrep -f "python main.py")

# Оптимизация настроек
# Уменьшить частоту обновлений в config.yaml
```

## 📚 Дополнительная документация

- [API Reference](API_REFERENCE.md) - Полная документация API
- [Deployment Guide](DEPLOYMENT.md) - Руководство по развертыванию
- [Presentation](PRESENTATION.md) - Обзор архитектуры
- [GitHub Repository](https://github.com/IamOw1/preview-version-4.1_coba_ai_drone_final)

## 📞 Поддержка

- **Документация**: [docs.coba-drone.com](https://docs.coba-drone.com)
- **GitHub Issues**: [Создать issue](https://github.com/IamOw1/preview-version-4.1_coba_ai_drone_final/issues)
- **Email**: support@coba-drone.com
- **Чат**: Discord сервер (ссылка в репозитории)

---

**COBA AI Drone Agent v4.1** - ваш надежный партнер в мире автономных дронов! 🚁🤖
