# HTTP API (FastAPI)

Каноническая реализация: `api/rest_api.py`. Базовый URL по умолчанию: `http://localhost:8000`.

## Система и здоровье

| Метод | Путь | Назначение |
|--------|------|--------------|
| GET | `/` | Метаданные сервиса |
| GET | `/health` | Проверка живости |
| POST | `/api/v1/system/self_test` | Самопроверка модулей процесса API (кнопка «Запустить тест систем» в настройках) |

## Режим работы и симуляторы

| Метод | Путь | Назначение |
|--------|------|--------------|
| POST | `/api/v1/runtime/demo_mode` | Тело: `{"enabled": true\|false}` — выставляет `DEMO_MODE` в процессе API |
| GET | `/api/v1/simulators/status` | Текущая сессия симулятора и переменные окружения |
| POST | `/api/v1/simulators/connect` | Тело: `simulator_id`, опционально `host`, `port` (для неизвестных id порт обязателен) |
| POST | `/api/v1/simulators/disconnect` | Сброс сессии (не останавливает внешний Webots/AirSim) |

## On-premise модели (Core / Sub)

| Метод | Путь | Назначение |
|--------|------|--------------|
| POST | `/api/v1/models/download` | Тело: `{"url": "https://…", "slot": "core"\|"sub"}`. Потоковая загрузка в `data/models/{core\|sub}_agent/`, лимит **512 МБ** за запрос. После успеха выставляет `CORE_AGENT_MODEL_PATH` или `SUB_AGENT_MODEL_PATH` в окружении процесса. |

## Настройки и сенсоры (фрагмент)

| Метод | Путь | Назначение |
|--------|------|--------------|
| GET/POST | `/api/v1/settings` | Чтение env-агрегата и запись override в памяти процесса |
| GET | `/api/v1/sensors/link-quality` | Качество связи (демо/телеметрия) |
| GET | `/api/v1/sensors/environment` | Окружение |
| GET | `/api/v1/sensors/navigation` | Навигация |
| GET | `/api/v1/sensors/visual` | Визуальные каналы |

Полный перечень маршрутов см. декораторы `@app` в `api/rest_api.py` и клиент `src/lib/api-client.ts`.
