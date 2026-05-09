# Развертывание через Docker (docker-compose)

Этот раздел описывает запуск проекта как “единый сервис” с помощью `docker-compose`.

## 1) Что поднимается
Основной профиль (по умолчанию) запускает сервис:
- `drone-agent` (API + агент + Web Dashboard)

Опциональные профили:
- `gui` (PyQt GUI; для headless окружений может не работать без дополнительных настроек)

## 2) Подготовка конфигурации и ключей
1. Убедитесь, что в папке проекта есть:
   - `config/config.yaml`
   - `.env` (или экспортируйте переменные окружения вручную)
2. Почему важно `config.yaml`:
   - в `docker-compose.yml` он монтируется как read-only (`./config:/app/config:ro`)
   - если файла нет, контейнер не сможет создать его “на лету”

## 3) Быстрый запуск
В корне проекта выполните:
```bash
docker-compose up --build
```

Или, если у вас команда `docker compose`:
```bash
docker compose up --build
```

Открыть:
- API: http://localhost:8000
- Swagger: http://localhost:8000/docs
- Web Dashboard: http://localhost:8501
- WebSocket телеметрии: `ws://localhost:8000/ws/telemetry`

## 4) Порты и сеть
Порты из `docker-compose.yml`:
- `8000:8000` — REST API (и WebSocket `/ws/telemetry`)
- `8501:8501` — Streamlit dashboard
- `9000-9100:9000-9100` — UDP для Mesh Network

> `8765:8765` в compose прокидывается как “WebSocket”, но в текущей реализации FastAPI использует WebSocket на том же порту `8000` (endpoint `/ws/telemetry`). Порт `8765` сейчас не является обязательным.

## 5) Остановка
```bash
docker-compose down
```

## 6) Логи и диагностика
Логи:
```bash
docker-compose logs -f
```

Проверка здоровья (healthcheck):
```bash
curl http://localhost:8000/health
```

## 7) Примечание про зависимости
При сборке образа будут установлены все пакеты из `requirements.txt`. Это может занять время (особенно `torch`/`opencv`/`open3d`).

