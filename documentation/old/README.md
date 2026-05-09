# COBA AI Drone Agent (v4.1)

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**COBA AI Drone Agent** - это комплексная система автономного управления дроном с ИИ, включающая Core Agent, Sub-Agent, симуляцию полета, сбор телеметрии и сетевые возможности.

## 🚀 Возможности

### 🤖 Интеллектуальные агенты
- **Core Agent**: Непрерывный цикл принятия решений (восприятие → решение → действие)
- **Sub-Agent**: Анализ данных и формирование рекомендаций с поддержкой DeepSeek AI

### 🛩️ Управление полетом
- **PitControllers**: Симуляция и контроль моторов (4/6/8 моторов)
- **Автономный полет**: Взлет, посадка, зависание, навигация
- **Безопасность**: Мониторинг батареи, сигнала, температуры

### 🌐 Сетевая инфраструктура
- **Mesh Network**: UDP-based mesh сеть для обмена данными между дронами
- **REST API**: Полный HTTP API для управления и мониторинга
- **WebSocket**: Реал-тайм телеметрия и события

### 📊 Аналитика и данные
- **OpenQ**: Сбор и анализ данных полета
- **Визуализация**: Streamlit dashboard и PyQt GUI
- **Логирование**: Структурированные логи с ротацией

### 🛠️ Модульная архитектура
- **Инструменты**: SLAM навигация, обнаружение объектов, картографирование
- **Симуляторы**: Поддержка AirSim, Unreal Engine, SkyRover
- **Расширяемость**: Плагинная система для новых инструментов

## 📋 Системные требования

- **Python**: 3.9+
- **Операционная система**: Linux, Windows, macOS
- **RAM**: 4GB+ (рекомендуется 8GB)
- **Диск**: 2GB+ свободного места

### Зависимости
- PyTorch 2.0+ (для ИИ)
- OpenCV (для компьютерного зрения)
- FastAPI (для API)
- Streamlit (для dashboard)
- PyQt6 (для GUI)

## 🏗️ Установка

### Локальная установка

1. **Клонирование репозитория**
```bash
git clone https://github.com/IamOw1/preview-version-4.1_coba_ai_drone_final.git
cd preview-version-4.1_coba_ai_drone_final
```

2. **Создание виртуального окружения**
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate     # Windows
```

3. **Установка зависимостей**
```bash
pip install -r requirements.txt
```

4. **Проверка системы**
```bash
python main.py check
```

### Docker установка

```bash
# Сборка и запуск
docker-compose up --build

# Или отдельно
docker build -t coba-drone .
docker run -p 8000:8000 -p 8501:8501 coba-drone
```

## 🚀 Запуск

### Основные команды

```bash
# Полная система (API + Dashboard + Agent)
python main.py all

# Только API сервер с агентом
python main.py api

# Только Web Dashboard
python main.py dashboard

# Только агент (консольный режим)
python main.py agent

# Графический интерфейс
python main.py gui

# Проверка системы
python main.py check
```

### Режимы работы

| Команда | Описание | Порты |
|---------|----------|-------|
| `all` | Полная система | 8000 (API), 8501 (Dashboard) |
| `api` | REST API + Agent | 8000 |
| `dashboard` | Web интерфейс | 8501 |
| `agent` | Только агент | - |
| `gui` | PyQt интерфейс | - |

## 📡 API Документация

### Базовый URL
```
http://localhost:8000
```

### Основные эндпоинты

#### Статус системы
```bash
GET /health
```

#### Телеметрия
```bash
GET /api/v1/telemetry
```

#### Управление
```bash
POST /api/v1/command
Content-Type: application/json

{
  "command": "TAKEOFF",
  "params": {"altitude": 10}
}
```

#### Состояние моторов
```bash
GET /api/v1/motors
```

#### Миссии
```bash
POST /api/v1/mission/start
GET /api/v1/mission/status/{mission_id}
```

### WebSocket
```javascript
// Реал-тайм телеметрия
const ws = new WebSocket('ws://localhost:8000/ws/telemetry');
```

### Примеры использования API

#### Взлет
```bash
curl -X POST http://localhost:8000/api/v1/command \
  -H "Content-Type: application/json" \
  -d '{"command": "TAKEOFF", "params": {"altitude": 10}}'
```

#### Посадка
```bash
curl -X POST http://localhost:8000/api/v1/command \
  -H "Content-Type: application/json" \
  -d '{"command": "LAND"}'
```

#### Проверка телеметрии
```bash
curl http://localhost:8000/api/v1/telemetry
```

## 🎛️ Web Dashboard

После запуска `python main.py dashboard` или `all` откройте:
```
http://localhost:8501
```

### Возможности dashboard
- 📊 Реал-тайм телеметрия
- 🎮 Управление полетом
- 📈 Графики и метрики
- 🔧 Настройки системы
- 📋 История миссий

## 🖥️ Графический интерфейс

```bash
python main.py gui
```

PyQt-based интерфейс с полным контролем над дроном.

## ⚙️ Конфигурация

### Основной файл конфигурации
```yaml
# config/config.yaml
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
export DEEPSEEK_MODEL=deepseek-chat
export COBA_API_KEY=your_api_key

# Настройки дрона
export DRONE_CONNECTION_STRING=udp:127.0.0.1:14550

# Dashboard
export DASHBOARD_PASSWORD=admin
```

## 🧩 Архитектура

```
COBA AI Drone Agent v4.1
├── 🤖 Core Agent          # Основной агент принятия решений
├── 🧠 Sub-Agent          # Помощник с ИИ
├── 🛩️ PitControllers     # Контроль моторов
├── 🌐 Mesh Network       # Сетевая коммуникация
├── 📊 OpenQ              # Аналитика полетов
├── 🛠️ Tools              # Модульные инструменты
├── 🌐 REST API           # HTTP интерфейс
├── 📡 WebSocket          # Реал-тайм данные
├── 🎛️ Dashboard          # Web интерфейс
└── 🖥️ GUI                # PyQt интерфейс
```

### Компоненты

#### Core Agent
- **Цикл работы**: perceive → decide → act
- **Решения**: Взлет, посадка, навигация, аварийные ситуации
- **Интеграция**: С PitControllers, Mesh Network, OpenQ

#### Sub-Agent
- **Анализ**: Обработка данных телеметрии
- **Рекомендации**: Предложения по действиям
- **ИИ**: Интеграция с DeepSeek API

#### PitControllers
- **Моторы**: Поддержка 4/6/8 моторов
- **Протоколы**: DShot, PWM
- **Команды**: ARM, DISARM, TAKEOFF, LAND, HOVER

#### Mesh Network
- **Протокол**: UDP-based
- **Функции**: Discovery, heartbeat, data exchange
- **Порты**: 9000 (broadcast), 9001 (data)

#### OpenQ
- **Сбор данных**: Телеметрия, события
- **Анализ**: Статистика полетов
- **Хранение**: Сжатые логи

## 🔧 Разработка

### Структура проекта
```
.
├── main.py                 # Точка входа
├── src/                    # Основной код
│   ├── agents/            # Агенты
│   ├── api/               # REST API
│   ├── controllers/       # Контроллеры
│   ├── gui/               # Интерфейсы
│   ├── network/           # Сеть
│   ├── sensors/           # Сенсоры
│   ├── sim/               # Симуляторы
│   └── utils/             # Утилиты
├── tools/                  # Инструменты
├── tests/                  # Тесты
├── config/                 # Конфигурация
├── data/                   # Данные
├── logs/                   # Логи
└── docs/                   # Документация
```

### Запуск тестов
```bash
pytest tests/
```

### Линтинг и форматирование
```bash
black .
flake8 .
mypy .
```

## 📚 Документация

- [Руководство пользователя](USER_MANUAL.md)
- [Презентация](PRESENTATION.md)
- [API Reference](API_REFERENCE.md)
- [Развертывание](DEPLOYMENT.md)

## 🤝 Вклад в проект

1. Fork репозиторий
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](LICENSE) для деталей.

## 🙏 Благодарности

- Команда разработчиков COBA
- Сообщество open-source
- Всех, кто внес вклад в развитие проекта

## 📞 Контакты

- **Email**: contact@coba-drone.com
- **GitHub**: [IamOw1/preview-version-4.1_coba_ai_drone_final](https://github.com/IamOw1/preview-version-4.1_coba_ai_drone_final)
- **Документация**: [docs.coba-drone.com](https://docs.coba-drone.com)

---

**COBA AI Drone Agent v4.1** - будущее автономных дронов уже здесь! 🚁✨
