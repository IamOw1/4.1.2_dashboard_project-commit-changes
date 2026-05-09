# API Reference - COBA AI Drone Agent v4.1

## Обзор

COBA AI Drone Agent предоставляет REST API и WebSocket интерфейсы для управления дроном, мониторинга телеметрии и выполнения миссий.

**Базовый URL:** `http://localhost:8000`

**Формат данных:** JSON

**Аутентификация:** API ключ (опционально, настраивается через переменную окружения `COBA_API_KEY`)

## REST API Эндпоинты

### 1. Корневой эндпоинт

#### GET /
Возвращает информацию о API.

**Ответ:**
```json
{
  "name": "COBA AI Drone Agent API",
  "version": "4.0.0",
  "status": "online",
  "endpoints": [
    "/health",
    "/api/v1/telemetry",
    "/api/v1/status",
    "/api/v1/command",
    "/ws/telemetry"
  ]
}
```

### 2. Проверка здоровья

#### GET /health
Проверяет статус системы.

**Ответ:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00",
  "agent_connected": true
}
```

### 3. Телеметрия

#### GET /api/v1/telemetry
Возвращает текущие данные телеметрии дрона.

**Ответ:**
```json
{
  "position": {
    "x": 0.0,
    "y": 0.0,
    "z": 10.0,
    "lat": 55.7558,
    "lon": 37.6173
  },
  "velocity": {
    "vx": 0.0,
    "vy": 0.0,
    "vz": 0.0
  },
  "attitude": {
    "roll": 0.0,
    "pitch": 0.0,
    "yaw": 0.0
  },
  "battery": 85.5,
  "timestamp": "2024-01-01T12:00:00"
}
```

### 4. Статус агента

#### GET /api/v1/status
Возвращает текущий статус агента и миссии.

**Ответ:**
```json
{
  "agent_id": "drone_agent_001",
  "state": "flying",
  "mission": {
    "id": "mission_20240101_120000",
    "name": "Test Mission",
    "status": "active"
  },
  "timestamp": "2024-01-01T12:00:00"
}
```

### 5. Отправка команд

#### POST /api/v1/command
Отправляет команду управления дроном.

**Тело запроса:**
```json
{
  "command": "TAKEOFF",
  "params": {
    "altitude": 10
  }
}
```

**Доступные команды:**
- `TAKEOFF` - Взлет на указанную высоту
- `LAND` - Посадка
- `HOVER` - Зависание
- `ARM` - Активация моторов
- `DISARM` - Деактивация моторов
- `SET_THROTTLE` - Установка газа мотора

**Ответ:**
```json
{
  "success": true,
  "command": "TAKEOFF",
  "result": {
    "message": "Команда выполнена",
    "altitude": 10
  }
}
```

### 6. Запуск миссии

#### POST /api/v1/mission/start
Запускает новую миссию с waypoints.

**Тело запроса:**
```json
{
  "name": "Delivery Mission",
  "waypoints": [
    {"lat": 55.7558, "lon": 37.6173, "alt": 50},
    {"lat": 55.7560, "lon": 37.6180, "alt": 50}
  ],
  "altitude": 50,
  "speed": 10
}
```

**Ответ:**
```json
{
  "success": true,
  "mission_id": "mission_20240101_120000",
  "name": "Delivery Mission",
  "waypoints_count": 2
}
```

### 7. Статус моторов

#### GET /api/v1/motors
Возвращает статус всех моторов.

**Ответ:**
```json
{
  "is_armed": true,
  "is_flying": true,
  "motors": {
    "0": {
      "name": "Front-Left",
      "state": "active",
      "throttle": 1200
    },
    "1": {
      "name": "Front-Right",
      "state": "active",
      "throttle": 1200
    },
    "2": {
      "name": "Rear-Right",
      "state": "active",
      "throttle": 1200
    },
    "3": {
      "name": "Rear-Left",
      "state": "active",
      "throttle": 1200
    }
  }
}
```

### 8. Статус Mesh сети

#### GET /api/v1/mesh
Возвращает информацию о mesh сети.

**Ответ:**
```json
{
  "node_id": "drone_001",
  "nodes_online": 3,
  "nodes_total": 5,
  "neighbors": [
    {
      "id": "drone_002",
      "last_seen": "2024-01-01T12:00:00",
      "signal_strength": -45
    }
  ]
}
```

### 9. Статус OpenQ

#### GET /api/v1/openq
Возвращает статус системы сбора данных OpenQ.

**Ответ:**
```json
{
  "is_recording": true,
  "current_flight_id": "flight_20240101_120000",
  "total_flights": 15,
  "storage_used_mb": 245.6
}
```

### 10. Список полетов

#### GET /api/v1/flights
Возвращает список всех записанных полетов.

**Ответ:**
```json
[
  {
    "flight_id": "flight_20240101_120000",
    "start_time": "2024-01-01T12:00:00",
    "duration": 3600,
    "distance": 1500.5,
    "max_altitude": 120.0
  }
]
```

## WebSocket API

### 1. Телеметрия в реальном времени

#### /ws/telemetry
WebSocket эндпоинт для получения телеметрии в реальном времени.

**Подключение:**
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/telemetry');
```

**Входящие сообщения (от сервера):**
```json
{
  "type": "telemetry",
  "data": {
    "position": {"x": 0, "y": 0, "z": 10},
    "battery": 85.5,
    "timestamp": "2024-01-01T12:00:00"
  }
}
```

**Исходящие сообщения (к серверу):**
```json
{
  "type": "command",
  "command": "TAKEOFF",
  "params": {"altitude": 10}
}
```

## Модели данных

### TelemetryResponse
```python
{
  "position": Dict[str, float],  # x, y, z, lat, lon
  "velocity": Dict[str, float],  # vx, vy, vz
  "attitude": Dict[str, float],  # roll, pitch, yaw
  "battery": float,              # процент заряда
  "timestamp": str               # ISO формат
}
```

### CommandRequest
```python
{
  "command": str,                # название команды
  "params": Dict[str, Any]       # параметры команды
}
```

### MissionRequest
```python
{
  "name": str,                   # название миссии
  "waypoints": List[Dict[str, float]],  # список точек (lat, lon, alt)
  "altitude": float,             # высота полета
  "speed": float                 # скорость полета
}
```

## Коды ошибок

### HTTP статус коды
- `200` - Успешно
- `400` - Неверный запрос
- `401` - Не авторизован
- `404` - Не найдено
- `500` - Внутренняя ошибка сервера

### Ответы с ошибками
```json
{
  "detail": "Описание ошибки",
  "error_code": "ERROR_CODE"
}
```

## Примеры использования

### Python с requests
```python
import requests

# Проверка здоровья
response = requests.get('http://localhost:8000/health')
print(response.json())

# Получение телеметрии
response = requests.get('http://localhost:8000/api/v1/telemetry')
telemetry = response.json()

# Отправка команды
command = {
    "command": "TAKEOFF",
    "params": {"altitude": 10}
}
response = requests.post('http://localhost:8000/api/v1/command', json=command)
```

### JavaScript с WebSocket
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/telemetry');

ws.onopen = function(event) {
    console.log('WebSocket connected');
};

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    if (data.type === 'telemetry') {
        console.log('Telemetry:', data.data);
    }
};

// Отправка команды
ws.send(JSON.stringify({
    type: 'command',
    command: 'TAKEOFF',
    params: {altitude: 10}
}));
```

### cURL примеры
```bash
# Телеметрия
curl http://localhost:8000/api/v1/telemetry

# Команда взлета
curl -X POST http://localhost:8000/api/v1/command \
  -H "Content-Type: application/json" \
  -d '{"command": "TAKEOFF", "params": {"altitude": 10}}'

# Статус моторов
curl http://localhost:8000/api/v1/motors
```

## Ограничения и особенности

1. **Демо режим**: Если агент не запущен, API работает в демо режиме с фиктивными данными
2. **WebSocket**: Поддерживает множественные одновременные соединения
3. **Асинхронность**: Все операции асинхронные, команды выполняются в фоне
4. **Безопасность**: В продакшене рекомендуется использовать HTTPS и аутентификацию

## Версионирование

API использует семантическое версионирование:
- `v1` - Стабильная версия (текущая)
- Изменения совместимости будут в новых версиях (v2, v3, etc.)

## Поддержка

Для вопросов по API:
- Документация: [docs.coba-drone.com](https://docs.coba-drone.com)
- GitHub Issues: [Создать issue](https://github.com/IamOw1/preview-version-4.1_coba_ai_drone_final/issues)
- Email: api-support@coba-drone.com
