#!/bin/bash

# Скрипт установки COBA AI Drone Agent для локальной разработки без Docker
# Запуск с: ./install.sh

set -e  # Выход при любой ошибке

echo "🚀 Начало локальной установки COBA AI Drone Agent..."

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # Нет цвета

# Функция для вывода окрашенного сообщения
print_status() {
    echo -e "${GREEN}[ИНФОРМАЦИЯ]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[ПРЕДУПРЕЖДЕНИЕ]${NC} $1"
}

print_error() {
    echo -e "${RED}[ОШИБКА]${NC} $1"
}

# Проверка если команда существует
check_command() {
    if ! command -v "$1" &> /dev/null; then
        print_error "$1 не установлен. Пожалуйста установите его сначала."
        return 1
    fi
    print_status "$1 найден: $(which $1)"
    return 0
}

# Установить пакет Python если не присутствует
ensure_python_package() {
    if ! python3 -c "import $1" &> /dev/null; then
        print_warning "$1 не найден, установка..."
        pip3 install "$1"
    else
        print_status "$1 уже установлен"
    fi
}

# Проверка системных зависимостей
print_status "Проверка системных зависимостей..."

# Проверка Python 3.11+
if ! python3 --version | grep -q "Python 3\."; then
    print_error "Python 3.11+ требуется"
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
if python3 -c "import sys; sys.exit(0 if sys.version_info >= (3, 11) else 1)"; then
    print_status "Python $PYTHON_VERSION ✓"
else
    print_error "Python 3.11+ требуется, найден $PYTHON_VERSION"
    exit 1
fi

check_command pip3 || exit 1
check_command node || exit 1
check_command npm || exit 1

# Проверка SQLite3
if ! python3 -c "import sqlite3; print('SQLite version:', sqlite3.sqlite_version)" &> /dev/null; then
    print_error "SQLite3 не доступен в Python"
    exit 1
fi
print_status "SQLite3 доступен"

# Установка зависимостей Python
print_status "Установка зависимостей Python..."
pip3 install -r requirements.txt

# Установка дополнительных пакетов для ввода RC
ensure_python_package pygame

# Установка зависимостей Node.js
print_status "Установка зависимостей Node.js..."
npm install

# Создание необходимых директориев
print_status "Создание директориев данных..."
mkdir -p data/memory
mkdir -p data/missions
mkdir -p data/reports
mkdir -p data/state
mkdir -p data/flight_data
mkdir -p data/detections
mkdir -p data/maps
mkdir -p data/tiles
mkdir -p logs

# Наборка файла окружения
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        print_status "Создан .env из .env.example"
        print_warning "Пожалуйста отредактируйте .env с вашими ключами API и настройками"
    else
        print_warning ".env.example не найден, создание базового .env"
        cat > .env << EOF
# Переменные окружения COBA AI Drone Agent

# Ключи API ИИ (опционально, будет использована локальная LLM если не установлено)
OPENAI_API_KEY=your_openai_key_here
DEEPSEEK_API_KEY=your_deepseek_key_here

# Конфигурация локальной LLM
LLM_MODEL_PATH=./models
LLM_ENDPOINT=http://localhost:11434

# База данных
DATABASE_PATH=data/memory/knowledge_base.db

# Симуляция
SIMULATION_MODE=true
SIMULATOR_TYPE=grid

# Настройка RC
RC_SOURCE=real
RC_DEVICE=/dev/input/js0

# Остальные настройки
LOG_LEVEL=INFO
EOF
    fi
else
    print_status ".env уже существует"
fi

# Инициализация базы данных
print_status "Инициализация базы данных..."
python3 -c "
import sqlite3
import os

db_path = 'data/memory/knowledge_base.db'
os.makedirs(os.path.dirname(db_path), exist_ok=True)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Создание существующих таблиц
cursor.execute('''
CREATE TABLE IF NOT EXISTS experience (
    id INTEGER PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    state TEXT,
    action TEXT,
    reward REAL,
    next_state TEXT,
    mission_id TEXT,
    metadata TEXT
)
''')

cursor.execute('''
CREATE TABLE IF NOT EXISTS knowledge (
    id INTEGER PRIMARY KEY,
    key TEXT UNIQUE,
    value TEXT,
    category TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)
''')

# Создание новой таблицы llm_models
cursor.execute('''
CREATE TABLE IF NOT EXISTS llm_models (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT,
    provider TEXT NOT NULL,
    endpoint_url TEXT,
    model_path TEXT,
    status TEXT DEFAULT 'inactive',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
''')

# Вставка записи о локальной LLM по умолчанию
cursor.execute('''
INSERT OR IGNORE INTO llm_models (name, version, provider, endpoint_url, status)
VALUES (?, ?, ?, ?, ?)
''', ('deepseek-coder', '1.0', 'local_ollama', 'http://localhost:11434', 'inactive'))

conn.commit()
conn.close()
print('База данных инициализирована успешно')
"

# Установка Ollama для локальной LLM
print_status "Настройка локальной LLM с помощью Ollama..."

# Проверка если Ollama установлена
if ! command -v ollama &> /dev/null; then
    print_warning "Ollama не найдена. Установка Ollama..."
    
    # Установка Ollama (Linux)
    curl -fsSL https://ollama.ai/install.sh | sh
    
    if [ $? -ne 0 ]; then
        print_error "Автоматическая установка Ollama не удалась"
        print_warning "Пожалуйста установите Ollama вручную с https://ollama.ai/"
        print_warning "Затем запустите: ollama pull deepseek-coder"
        exit 1
    fi
else
    print_status "Ollama уже установлена"
fi

# Запуск сервиса Ollama
print_status "Запуск сервиса Ollama..."
if pgrep -x "ollama" > /dev/null; then
    print_status "Ollama уже работает"
else
    nohup ollama serve > logs/ollama.log 2>&1 &
    sleep 2
fi

# Загрузка модели
print_status "Загрузка модели DeepSeek Coder..."
if ollama list | grep -q "deepseek-coder"; then
    print_status "Модель DeepSeek Coder уже доступна"
else
    ollama pull deepseek-coder
    if [ $? -ne 0 ]; then
        print_error "Не удалось загрузить модель"
        print_warning "Вы можете попробовать снова позже или использовать другую модель"
    fi
fi

# Тест LLM
print_status "Тестирование локальной LLM..."
python3 -c "
import requests
import time

try:
    # Ожидание когда Ollama будет готова
    time.sleep(3)
    
    response = requests.post('http://localhost:11434/api/generate', 
                           json={'model': 'deepseek-coder', 'prompt': 'Hello', 'stream': False},
                           timeout=10)
    
    if response.status_code == 200:
        print('Локальная LLM работает!')
        # Обновление статуса БД
        import sqlite3
        conn = sqlite3.connect('data/memory/knowledge_base.db')
        conn.execute(\"UPDATE llm_models SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE name = 'deepseek-coder'\")
        conn.commit()
        conn.close()
    else:
        print('Тест LLM не прошел, но продолжаю...')
        
except Exception as e:
    print(f'Ошибка теста LLM: {e}')
    print('Продолжаю с установкой...')
"

# Проверка системы
print_status "Запуск проверки системы..."
python3 check_system.py

print_status "Установка завершена успешно! 🎉"
echo ""
echo "Следующие шаги:"
echo "1. Отредактируйте файл .env с вашими ключами API если нужно"
echo "2. Запустите ./run.sh для на запуск приложения"
echo "3. Откройте дашборд на http://localhost:3000"
echo "4. API доступен на http://localhost:8000"
echo ""
echo "Для настройки RC, смотрите раздел README.md про подключение DJI RC-N1"