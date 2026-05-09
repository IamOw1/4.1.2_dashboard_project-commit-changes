# COBA AI Drone Agent v4.1.2

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

Автономная система управления дроном с искусственным интеллектом, телеметрией в реальном времени и возможностью управления оператором. Включает интеграцию локальной LLM, поддержку RC контроллера и комплексное тестирование.

## 🚁 Возможности

- **Автономность на основе ИИ**: Интеграция DeepSeek/GPT-4o с обучением с подкреплением
- **Управление в реальном времени**: FastAPI бэкенд с WebSocket потоком телеметрии
- **Современный UI**: React 19 фронтенд с картами и графиками телеметрии в реальном времени
- **Поддержка локальной LLM**: Интеграция Ollama для обработки ИИ на месте
- **Управление RC**: Приоритетное управление DJI Mini 2 / RC-N1 с автоматической арбитрацией
- **Мультисимуляторы**: AirSim, встроенный сеточный симулятор и пользовательские симуляторы
- **Комплексное тестирование**: Модульные, интеграционные и сквозные наборы тестов

## 🏗️ Архитектура

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React UI      │    │   FastAPI API   │    │   Локальная LLM │
│   (Порт 3000)  │◄──►│   (Порт 8000)   │◄──►│   (Ollama)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   RC Контроллер │    │   ИИ Агент      │    │   Симуляторы    │
│   (DJI RC-N1)   │───►│   (Арбитраж)    │───►│   (AirSim/Grid) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Требования

### Системные требования
- **ОС**: Linux (Ubuntu 20.04+), Windows 10/11, macOS
- **Python**: 3.11 или выше
- **Node.js**: 18 или выше
- **ОЗУ**: минимум 8GB, рекомендуется 16GB
- **Хранилище**: 10GB свободного места

### Оборудование (опционально)
- **Дрон**: DJI Mini 2 или совместимый дрон с MAVLink
- **RC Контроллер**: DJI RC-N1 или совместимый геймпад/джойстик
- **Симулятор**: Unreal Engine с AirSim (опционально)

## 🚀 Local Installation

### Quick Setup (Linux/macOS)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/IamOw1/4.1.2_dashboard_project.git
   cd 4.1.2_dashboard_project
   ```

2. **Run installation script**:
   ```bash
   ./install.sh
   ```
   This will:
   - Check system dependencies
   - Install Python and Node.js packages
   - Set up SQLite database with LLM models table
   - Install and configure Ollama with DeepSeek Coder model
   - Create `.env` configuration file

3. **Start the application**:
   ```bash
   ./run.sh all
   ```

4. **Access the interfaces**:
   - **Frontend UI**: http://localhost:3000
   - **API Documentation**: http://localhost:8000/docs
   - **Backend API**: http://localhost:8000

### Настройка Windows

1. **Клонирование и навигация**:
   ```powershell
   git clone https://github.com/IamOw1/4.1.2_dashboard_project.git
   cd 4.1.2_dashboard_project
   ```

2. **Пуск скрипта инсталляции**:
   ```powershell
   .\install.ps1
   ```

3. **Заастарт приложения**:
   ```powershell
   .\run.ps1
   ```

### Ручная установка

Если скрипты не работают, установите вручную:

```bash
# Зависимости Python
pip install -r requirements.txt

# Зависимости Node.js
npm install

# Установка Ollama (Linux)
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull deepseek-coder

# Инициализация бази данных
python3 -c "
# ... код сетапа базы из install.sh
"
```

## 🎮 Настройка RC контроллера

### Подключение DJI RC-N1

1. **Подключение RC к ПК**:
   - Используйте кабель USB для подключения DJI RC-N1 к компьютеру
   - Windows: Установите DJI Assistant 2 если нужно
   - Linux: Убедитесь в разрешениях джойстика (`sudo chmod a+rw /dev/input/js*`)

2. **Проверка подключения**:
   ```bash
   # Linux
   ls /dev/input/js*
   jstest /dev/input/js0

   # Windows (PowerShell)
   Get-PnpDevice -Class 'HIDClass' | Where-Object {$_.Name -like '*joystick*'}
   ```

3. **Конфигурация**:
   - Система автоматически определяет RC-N1 как геймпад
   - Стандартное отображение:
     - Левый стик X/Y: Roll/Throttle
     - Правый стик X/Y: Yaw/Pitch
     - Кнопка A: Взлет
     - Кнопка X: Посадка
     - Кнопка Y: Аварийная остановка

4. **Логика приоритета**:
   - **Приоритет оператора**: Когда палки отклоняются >10% или нажаты критические кнопки
   - **Команды ИИ**: Только когда оператор неактивен >5 секунд
   - **Аварийная остановка**: Кнопка Y переопределяет все команды

### Тестирование подключения RC

```bash
# Тест с имитацией RC
./run.sh api
# Затем в другом терминале:
python3 -c "
from sim.mock_rc import MockRC
import asyncio

async def test():
    rc = MockRC({'scenario': 'active_pilot'})
    await rc.initialize()
    state = await rc.get_state()
    print(f'Connected: {state.connected}, Active: {state.is_operator_active()}')
    await rc.shutdown()

asyncio.run(test())
"
```

## 🧪 Тестирование

### Запуск всех тестов

```bash
# Запуск полного набора тестов
./test.sh

# Или вручную:
make test
```

### Категории тестов

```bash
# Только модульные тесты
make test-unit
# или
pytest tests/unit/ -v

# Только интеграционные тесты
make test-int
# или
pytest tests/integration/ -v

# С отчетом о покрытии
pytest tests/ --cov=. --cov-report=html
```

### Структура тестов

```
tests/
├── unit/                    # Модульные тесты (быстрые, изолированные)
│   ├── test_llm_client.py   # Функциональность LLM клиента
│   ├── test_rc_input.py     # Управление состоянием RC
│   └── test_arbitrator.py   # Логика арбитрации команд
└── integration/             # Интеграционные тесты
    ├── test_llm_integration.py    # Интеграция LLM API
    └── test_rc_arbitration.py     # Интеграция RC + ИИ
```

### Ручное тестирование

```bash
# Тест интеграции LLM
python3 -c "
import asyncio
from agent.llm_client import generate_with_fallback

async def test():
    response = await generate_with_fallback('Привет, тест LLM')
    print(f'Ответ: {response.text}')
    print(f'Ошибка: {response.error}')

asyncio.run(test())
"

# Тест арбитрации RC
python3 -c "
import asyncio
from hardware.rc_input import RCInputSource, get_rc_input
from controllers.control_arbitrator import get_control_arbitrator

async def test():
    rc = get_rc_input(RCInputSource.MOCK, {'scenario': 'idle'})
    await rc.initialize()
    arbitrator = get_control_arbitrator()
    
    state = await rc.get_state()
    command = arbitrator.arbitrate(state)
    print(f'Команда: {command.action} от {command.source.value}')
    
    await rc.shutdown()

asyncio.run(test())
"
```

## ⚙️ Настройка

### Переменные окружения (.env)

```bash
# Ключи API ИИ (опционально, локальная LLM предпочтительна)
OPENAI_API_KEY=your_openai_key_here
DEEPSEEK_API_KEY=your_deepseek_key_here

# Настройка локальной LLM
LLM_MODEL_PATH=./models
LLM_ENDPOINT=http://localhost:11434

# База данных
DATABASE_PATH=data/memory/knowledge_base.db

# Симуляция
SIMULATION_MODE=true
SIMULATOR_TYPE=grid

# Настройка RC
RC_SOURCE=real  # real, mock, или simulator
RC_DEVICE=0     # Индекс устройства (Windows) или /dev/input/js0 (Linux)

# Логирование
LOG_LEVEL=INFO
```

### Продвинутая конфигурация (config/config.yaml)

Смотрите `config/config.yaml` для детальных параметров агента, безопасности и полета.

## 🛠️ Разработка

### Структура проекта

```
├── agent/           # Ядро ИИ агента
├── api/            # REST/WebSocket API FastAPI
├── controllers/    # Системы управления и арбитрация
├── hardware/       # Интерфейсы оборудования (RC, MAVLink)
├── sim/           # Симуляторы и макеты устройств
├── src/           # React фронтенд
├── tests/         # Наборы тестов
├── tools/         # Специализированные инструменты ИИ
└── utils/         # Утилиты и помощники
```

### Ключевые компоненты

- **Ядро агента** (`agent/core.py`): Основной автономный агент
- **Клиент LLM** (`agent/llm_client.py`): Интерфейс к локальной LLM
- **Вход RC** (`hardware/rc_input.py`): Абстракция контроллера RC
- **Арбитр** (`controllers/control_arbitrator.py`): Логика приоритета команд
- **API** (`api/rest_api.py`): Конечные точки REST API

### Добавление новых функций

1. **Интеграция LLM**: Расширьте `LLMClient` для новых моделей
2. **Поддержка RC**: Добавьте новый адаптер в `hardware/`
3. **Инструменты**: Наследуйте от `BaseTool` в `tools/base_tool.py`
4. **Тесты**: Добавьте в соответствующий подкаталог `tests/`

## 📊 Справочник API

### REST конечные точки

- `GET /health` - Проверка здоровья
- `GET /api/v1/status` - Статус агента
- `POST /api/v1/mission/start` - Начать миссию
- `GET /api/v1/telemetry` - Телеметрия в реальном времени
- `POST /api/v1/sub_agent/ask` - Запрос к ИИ помощнику

### WebSocket потоки

- `/ws/telemetry` - Данные телеметрии в реальном времени
- `/ws/commands` - Подтверждение команд

Полная документация API находится на http://localhost:8000/docs при запуске.

## 🐛 Решение проблем

### Частые проблемы

1. **LLM не отвечает**:
   ```bash
   # Проверьте статус Ollama
   ollama list
   ollama serve  # Запустите если не работает
   ```

2. **RC не обнаружен**:
   ```bash
   # Разрешения Linux
   sudo chmod a+rw /dev/input/js*
   # Windows: Проверьте Device Manager для HID устройств
   ```

3. **Конфликты портов**:
   - Измените порты в `.env` или файлах конфигурации
   - Убейте процессы: `lsof -ti:8000 | xargs kill`

4. **Проблемы с базой данных**:
   ```bash
   # Сброс базы данных
   rm data/memory/knowledge_base.db
   ./install.sh  # Переинициализируйте
   ```

### Логи

- **Логи приложения**: `logs/`
- **Логи Ollama**: `logs/ollama.log`
- **Результаты тестов**: `test_results/`

## 🤝 Вклад

1. Разветвите репозиторий
2. Создайте ветку функции: `git checkout -b feature/amazing-feature`
3. Запустите тесты: `./test.sh`
4. Проведите изменения: `git commit -m 'Add amazing feature'`
5. Отправьте: `git push origin feature/amazing-feature`
6. Откройте Pull Request

## 📄 Лицензия

Этот проект лицензирован по лицензии MIT - см. файл [LICENSE](LICENSE) для деталей.

## 🙏 Благодарности

- DeepSeek за модель ИИ
- Ollama за локальной времени выполнения LLM
- FastAPI за веб-фреймворк
- React за фронтенд фреймворк
- DJI за вдохновение дроновой технологией