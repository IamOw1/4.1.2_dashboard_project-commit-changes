# API Reference COBA AI Drone Agent v4.1.2

## Обзор

API системы построено на FastAPI и предоставляет RESTful интерфейс для всех функций управления дронами. Базовый URL: `http://localhost:8000/api/v1`

## Аутентификация

Не требуется (демо-режим). В продакшене рекомендуется добавить JWT или API ключи.

## Общие параметры

### Формат ответов

Все ответы возвращаются в формате JSON:

```json
{
  "data": {...},
  "ok": true,
  "source": "backend|mock|error",
  "error": "описание ошибки"
}
```

### Коды ошибок

- `200`: Успешно
- `400`: Неверный запрос
- `403`: Доступ запрещен
- `404`: Ресурс не найден
- `500`: Внутренняя ошибка сервера
- `503`: Сервис недоступен

## Эндпоинты

### Агент

#### GET /agent/status
Получение статуса агента.

**Ответ:**
```json
{
  "agent_id": "drone_001",
  "state": "READY",
  "uptime": 3600,
  "memory_usage": 45.2
}
```

#### POST /agent/initialize
Инициализация агента.

**Ответ:**
```json
{
  "success": true,
  "agent_id": "drone_001",
  "message": "Агент инициализирован"
}
```

#### POST /agent/shutdown
Завершение работы агента.

**Ответ:**
```json
{
  "success": true,
  "message": "Агент завершил работу"
}
```

### Миссии

#### POST /mission/start
Запуск миссии.

**Тело запроса:**
```json
{
  "name": "Патруль периметра",
  "waypoints": [
    {"lat": 55.7558, "lng": 37.6173, "altitude": 50},
    {"lat": 55.7560, "lng": 37.6180, "altitude": 50}
  ],
  "speed": 5.0
}
```

**Ответ:**
```json
{
  "success": true,
  "mission_id": "MIS-001",
  "status": "started"
}
```

#### POST /mission/stop
Остановка текущей миссии.

**Ответ:**
```json
{
  "success": true,
  "message": "Миссия остановлена"
}
```

#### GET /mission/status
Получение статуса миссии.

**Ответ:**
```json
{
  "mission_id": "MIS-001",
  "status": "running",
  "progress": 65,
  "current_waypoint": 2,
  "remaining_time": 180
}
```

#### GET /missions
Получение списка миссий.

**Ответ:**
```json
{
  "missions": [
    {
      "id": "MIS-001",
      "name": "Патруль",
      "status": "completed",
      "created_at": "2026-05-05T10:00:00Z"
    }
  ]
}
```

### Телеметрия

#### GET /telemetry
Получение данных телеметрии.

**Ответ:**
```json
{
  "altitude": 45.2,
  "speed": 8.5,
  "battery": 78,
  "temperature": 32.1,
  "signal": 85,
  "gps": {"lat": 55.7558, "lng": 37.6173},
  "heading": 90,
  "mode": "AUTO"
}
```

### Инструменты

#### GET /tools
Получение списка инструментов.

**Ответ:**
```json
{
  "tools": [
    {
      "id": "object_detection",
      "name": "Детекция объектов",
      "category": "Сенсоры",
      "enabled": true,
      "status": "ok",
      "version": "1.2.0"
    }
  ]
}
```

#### POST /tools/{tool_name}/execute
Выполнение инструмента.

**Параметры:**
- `tool_name`: Имя инструмента

**Тело запроса:**
```json
{
  "params": {
    "confidence": 0.8,
    "classes": ["person", "vehicle"]
  }
}
```

**Ответ:**
```json
{
  "result": "Выполнено успешно",
  "data": {...}
}
```

### Обучение

#### POST /learning/start
Запуск обучения.

**Тело запроса:**
```json
{
  "simulator": "AirSim",
  "task": "obstacle_avoidance",
  "config": {
    "episodes": 1000,
    "learning_rate": 0.001
  }
}
```

**Ответ:**
```json
{
  "training_id": "train_001",
  "status": "started"
}
```

#### GET /learning/progress
Получение прогресса обучения.

**Ответ:**
```json
{
  "training_id": "train_001",
  "status": "running",
  "episode": 450,
  "reward": 1250.5,
  "loss": 0.023,
  "best_reward": 1450.2,
  "estimated_time": 1800
}
```

### Флот

#### GET /fleet/status
Получение статуса флота.

**Ответ:**
```json
{
  "drones": [
    {
      "id": "drone_001",
      "name": "COBA-Alpha",
      "status": "online",
      "battery": 78,
      "mission": "MIS-001",
      "position": {"lat": 55.7558, "lng": 37.6173}
    }
  ],
  "formation": "line",
  "leader": "drone_001"
}
```

#### GET /fleet/{drone_id}/telemetry
Телеметрия конкретного дрона.

**Ответ:** См. `/telemetry`

#### POST /fleet/formation
Установка формации.

**Тело запроса:**
```json
{
  "formation": "circle",
  "spacing": 10.0
}
```

**Ответ:**
```json
{
  "success": true,
  "formation": "circle"
}
```

### Mesh-сеть

#### GET /mesh/topology
Получение топологии mesh-сети.

**Ответ:**
```json
{
  "nodes": [
    {
      "id": "drone_001",
      "position": {"lat": 55.7558, "lng": 37.6173},
      "connections": ["drone_002", "drone_003"],
      "signal_strength": 85
    }
  ],
  "links": [
    {
      "from": "drone_001",
      "to": "drone_002",
      "quality": 92
    }
  ]
}
```

### Камера

#### GET /camera/frame
Получение кадра с камеры.

**Ответ:** Изображение в формате PNG

#### GET /camera/stream
URL для видеопотока.

**Ответ:**
```json
{
  "stream_url": "http://localhost:8000/api/v1/camera/frame"
}
```

#### POST /camera/record/start
Запуск записи видео.

**Ответ:**
```json
{
  "status": "recording_started",
  "filename": "recording_20260505_120000.mp4"
}
```

#### POST /camera/record/stop
Остановка записи.

**Ответ:**
```json
{
  "status": "recording_stopped",
  "duration": 120
}
```

### Детекция

#### GET /detection/results
Результаты детекции объектов.

**Ответ:**
```json
{
  "detections": [
    {
      "id": "det_001",
      "class": "person",
      "confidence": 0.95,
      "bbox": [100, 200, 150, 300],
      "timestamp": "2026-05-05T12:00:00Z"
    }
  ]
}
```

### События

#### GET /events/log
Журнал событий.

**Параметры:**
- `limit`: Максимальное количество (по умолчанию 100)

**Ответ:**
```json
{
  "events": [
    {
      "id": "evt_001",
      "level": "info",
      "source": "agent",
      "message": "Миссия запущена",
      "timestamp": "2026-05-05T12:00:00Z"
    }
  ]
}
```

#### GET /events/filter
Фильтрация событий.

**Параметры:**
- `level`: Уровень (info, warning, error)
- `source`: Источник
- `start`: Начало периода
- `end`: Конец периода

**Ответ:** См. `/events/log`

#### POST /events/alert/config
Настройка уведомлений.

**Тело запроса:**
```json
{
  "email": "admin@example.com",
  "telegram": "@admin_bot",
  "webhook": "https://example.com/webhook"
}
```

**Ответ:**
```json
{
  "status": "configured"
}
```

#### GET /events/export
Экспорт событий.

**Параметры:**
- `format`: json или csv

**Ответ:** Файл с событиями

#### GET /events/statistics
Статистика событий.

**Ответ:**
```json
{
  "total": 1250,
  "levels": {
    "info": 800,
    "warning": 350,
    "error": 100
  },
  "sources": {
    "agent": 600,
    "tools": 400,
    "fleet": 250
  }
}
```

### Бэкапы

#### POST /backup/create
Создание бэкапа.

**Тело запроса:**
```json
{
  "components": ["missions", "config", "models"]
}
```

**Ответ:**
```json
{
  "backup_id": "backup_20260505_120000",
  "size": "45MB",
  "components": ["missions", "config", "models"]
}
```

#### GET /backup/list
Список бэкапов.

**Ответ:**
```json
{
  "backups": [
    {
      "id": "backup_20260505_120000",
      "created_at": "2026-05-05T12:00:00Z",
      "size": "45MB",
      "components": ["missions", "config", "models"]
    }
  ]
}
```

#### POST /backup/restore/{backup_id}
Восстановление бэкапа.

**Тело запроса:**
```json
{
  "mode": "merge"
}
```

**Ответ:**
```json
{
  "status": "restored",
  "restored_components": ["missions", "config"]
}
```

### Экспорт

#### POST /export/missions
Экспорт миссий.

**Тело запроса:**
```json
{
  "format": "json",
  "start": "2026-05-01",
  "end": "2026-05-05"
}
```

**Ответ:** Файл с миссиями

#### POST /export/telemetry
Экспорт телеметрии.

**Ответ:** Файл с телеметрией

#### POST /export/models
Экспорт моделей обучения.

**Ответ:** Файл с моделями

### Настройки

#### GET /settings
Получение настроек.

**Ответ:**
```json
{
  "sensors": {
    "camera": {"enabled": true, "resolution": "1080p"},
    "gps": {"enabled": true, "accuracy": "high"}
  },
  "network": {
    "mesh": {"enabled": true, "range": 1000}
  }
}
```

#### POST /settings
Обновление настроек.

**Тело запроса:**
```json
{
  "key": "sensors.camera.resolution",
  "value": "4K"
}
```

**Ответ:**
```json
{
  "status": "updated"
}
```

### Память и суб-агент

#### GET /memory/short_term
Получение краткосрочной памяти агента.

**Ответ:**
```json
{
  "memory": [
    {
      "timestamp": "2026-05-05T12:00:00Z",
      "event": "mission_started",
      "data": {"mission_id": "MIS-001"}
    }
  ]
}
```

#### GET /sub_agent/ask
Запрос к суб-агенту.

**Параметры:**
- `q`: Вопрос

**Ответ:**
```json
{
  "response": "На основе анализа данных, рекомендую..."
}
```

### Отчеты

#### GET /reports/missions
Отчеты по миссиям.

**Ответ:**
```json
{
  "reports": [
    {
      "mission_id": "MIS-001",
      "duration": 1200,
      "distance": 5.2,
      "battery_used": 25,
      "events_count": 15
    }
  ]
}
```

## WebSocket

### /ws/telemetry
Реал-тайм телеметрия.

**Сообщения:**
```json
{
  "type": "telemetry",
  "data": {...}  // см. GET /telemetry
}
```

## Ошибки и отладка

### Логи
- Сервер: `logs/api.log`
- Агент: `logs/agent.log`
- Система: `logs/system.log`

### Отладка API
```bash
# Включить отладку
export DEBUG_API=1

# Проверить здоровье
curl http://localhost:8000/health

# Документация
open http://localhost:8000/docs
```

### Mock-режим
Если бэкенд недоступен, API возвращает mock-данные с `source: "mock"`.

## Производительность

- **Timeout**: 6 секунд на запрос
- **Кэш**: 5 секунд для `/health`
- **Лимиты**: 100 элементов по умолчанию для списков
- **Формат**: JSON для всех ответов