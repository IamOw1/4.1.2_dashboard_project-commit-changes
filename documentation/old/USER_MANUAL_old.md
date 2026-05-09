# Руководство пользователя и описание функционала (v4.0)

Это руководство объясняет, что реально умеет текущая версия проекта и как пользоваться API/доками/интерфейсами. Оно соответствует коду в `src/` и актуальным эндпоинтам `src/api/rest_api.py`.

> В репозитории также присутствуют “полные” корневые пакеты (`agent/`, `api/`, `tools/`, `utils/`), но по умолчанию `main.py` запускает активную версию на базе `src/`. Все примеры и эндпоинты ниже относятся именно к этой активной версии.

## 1) Что это за проект
Проект представляет собой монолитное приложение, где:
- `CoreAgent` непрерывно выполняет цикл: восприятие (`perceive`) -> решение (`decide`) -> действие (`act`)
- `SubAgent` помогает анализировать данные и рекомендовать действия (в текущей версии — логика рекомендаций без “принятия решений” вместо CoreAgent)
- `PitControllers` контролирует состояние “моторов” (в текущей версии — симуляционная модель)
- `MeshNetwork` отвечает за обмен сообщениями между узлами (UDP sockets)
- `OpenQ` отвечает за запись и анализ параметров полёта (в текущей версии — логирование данных и вычисление статистики)
- `FastAPI` предоставляет REST API и WebSocket телеметрии
- `Streamlit dashboard` и `PyQt GUI` предоставляют интерфейсы для пользователя

Ключевой момент для “работоспособности”:
- при запуске `python main.py api` и `python main.py all` в процессе API также запускается `CoreAgent`, и команды реально применяются к симуляционному агенту.

## 2) Быстрый сценарий “как попробовать”
1. Запустите всё:
```bash
python main.py all
```
2. Проверьте, что API жив:
```bash
curl http://localhost:8000/health
```
3. Посмотрите телеметрию:
```bash
curl http://localhost:8000/api/v1/telemetry
```
4. Отправьте команду “взлёт”:
```bash
curl -X POST http://localhost:8000/api/v1/command ^
  -H "Content-Type: application/json" ^
  -d "{\"command\":\"TAKEOFF\",\"params\":{\"altitude\":10}}"
```
5. Посмотрите состояние моторов:
```bash
curl http://localhost:8000/api/v1/motors
```

## 3) Компоненты (что за что отвечает)
### 3.1 CoreAgent
Функции:
- базовая телеметрия (`telemetry`)
- проверка аварийных ситуаций по телеметрии (например, “low_battery”, “signal_lost”, “overheating”)
- выбор команды (по умолчанию `HOVER`)
- применение команды:
  - через `PitControllers` (ARM/DISARM/TAKEOFF/LAND/HOVER/SET_THROTTLE)
  - через `MeshNetwork` (broadcast команд по mesh)

### 3.2 SubAgent
В текущей версии Sub-Agent:
- принимает задачи на анализ (например, `DATA_ANALYSIS`)
- ведёт историю и события
- может включать DeepSeek-интеграцию через API-ключи (опционально)

### 3.3 PitControllers
Симуляционный контроллер моторов:
- поддерживает 4/6/8 моторов (по конфигу `motor_count`)
- команды (как часть `execute_command`):
  - `ARM`, `DISARM`
  - `TAKEOFF` (параметр `altitude`)
  - `LAND`
  - `HOVER`
  - `SET_THROTTLE` (параметры `motor_id` и `throttle`)

### 3.4 MeshNetwork
Самоорганизация в упрощённом виде:
- создаёт UDP sockets
- отправляет periodic discovery/heartbeat
- хранит список узлов и статистику отправленных/полученных сообщений

В документации используйте UDP порты:
- broadcast: `9000`
- data: `9001`

### 3.5 OpenQ
Сбор данных полёта:
- `start_recording(flight_id)` — создаёт файл и включает буфер
- `collect_data(telemetry)` — превращает telemetry в `FlightDataPoint` и буферизирует
- `stop_recording()` — сохраняет/сжимает и возвращает статистику
- `analyze_flight(flight_id)` — читает файл и возвращает агрегированную аналитику

## 4) REST API (актуальные эндпоинты)
Базовый URL: `http://localhost:8000`

### 4.1 `GET /health`
Возвращает статус сервера.

### 4.2 `GET /api/v1/telemetry`
Возвращает текущую телеметрию (демо-данные или данные агента, если он запущен).

Пример:
```bash
curl http://localhost:8000/api/v1/telemetry
```

### 4.3 `GET /api/v1/status`
Статус агента (state, telemetry, информация по текущей миссии и т.д.).

### 4.4 `POST /api/v1/command`
Отправляет команду агенту.

Тело запроса:
```json
{
  "command": "TAKEOFF",
  "params": { "altitude": 10 }
}
```

Примеры:
```bash
curl -X POST http://localhost:8000/api/v1/command ^
  -H "Content-Type: application/json" ^
  -d "{\"command\":\"ARM\",\"params\":{}}"
```
```bash
curl -X POST http://localhost:8000/api/v1/command ^
  -H "Content-Type: application/json" ^
  -d "{\"command\":\"HOVER\",\"params\":{}}"
```
```bash
curl -X POST http://localhost:8000/api/v1/command ^
  -H "Content-Type: application/json" ^
  -d "{\"command\":\"SET_THROTTLE\",\"params\":{\"motor_id\":0,\"throttle\":1500}}"
```

### 4.5 `POST /api/v1/mission/start`
В текущей реализации endpoint возвращает идентификатор миссии и количество waypoint’ов.
Он **не запускает** полноценное выполнение миссии внутри агента (это отдельная зона дальнейшей интеграции).

Тело запроса:
```json
{
  "name": "Mission name",
  "waypoints": [{"x":0,"y":0,"z":10}],
  "altitude": 50.0,
  "speed": 10.0
}
```

### 4.6 `GET /api/v1/motors`
Статус всех моторов.

### 4.7 `GET /api/v1/mesh`
Статус mesh сети (узлы/статистика/соседи).

### 4.8 `GET /api/v1/openq`
Статус OpenQ (recording/список полётов и т.д. — зависит от того, вызывали ли запись).

### 4.9 `GET /api/v1/flights`
Список полётов OpenQ (по файлам логов).

## 5) WebSocket телеметрии
URL: `ws://localhost:8000/ws/telemetry`

Базовая логика:
- сервер отправляет сообщения вида `{ "type": "telemetry", "data": telemetry }`
- клиент может прислать команду в формате:
```json
{ "type": "command", "command": "LAND", "params": {} }
```

## 6) Web Dashboard (Streamlit)
URL: `http://localhost:8501`

Что сделано:
- “Телеметрия”: отображает данные через `GET /api/v1/telemetry` и `GET /api/v1/status`
- “Управление”: кнопки отправляют команды в `POST /api/v1/command`
- “Mesh”: показывает `GET /api/v1/mesh`

Важно про миссии в UI:
- экран создания миссии в dashboard сейчас работает как демонстрационный интерфейс (визуально подтверждает действие, но не запускает миссию через backend).

## 7) PyQt GUI
Запуск:
```bash
python main.py gui
```

GUI в текущей версии:
- использует внутренние демо-данные для части отображений
- как отдельная опция для удобства пользователей (требует окружение с доступом к графической подсистеме)

## 8) Тестирование
```bash
pytest
```

## 9) Roadmap (что ещё добавить)
См. `WHATS_MISSING.md`.

