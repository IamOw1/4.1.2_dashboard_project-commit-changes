#!/bin/bash
# 🚀 Unified Dashboard 1+2 — скрипт запуска
# Запускает бэкенд и фронтенд в одном окне

set -e

echo "🚀 Unified Dashboard 1+2 — запуск"
echo "=================================="

# 1. Проверка зависимостей
echo "🔍 Проверка зависимостей..."
command -v python3 >/dev/null 2>&1 || { echo "❌ Python 3 не найден"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ Node.js не найден"; exit 1; }
echo "✅ Зависимости найдены"

# 2. Установка (если нужно)
if [ ! -d "backend/venv" ]; then
    echo "📦 Установка Python-зависимостей..."
    python3 -m venv backend/venv
    source backend/venv/bin/activate
    pip install --upgrade pip
    if [ -f "backend/requirements.txt" ]; then
        pip install -r backend/requirements.txt
    fi
    deactivate
fi

if [ ! -d "node_modules" ]; then
    echo "📦 Установка Node.js-зависимостей..."
    npm install
fi

# 3. Генерация TypeScript-типов из OpenAPI (если есть бэкенд)
if [ -f "backend/main.py" ]; then
    echo "🔄 Генерация типов из OpenAPI..."
    source backend/venv/bin/activate
    python -m backend.main --generate-openapi > openapi.json 2>/dev/null || echo "⚠️ Не удалось сгенерировать OpenAPI schema"
    if [ -f "openapi.json" ] && [ -s "openapi.json" ]; then
        npx openapi-typescript openapi.json -o src/types/api.ts 2>/dev/null || echo "⚠️ Не удалось сгенерировать TypeScript типы"
    fi
    deactivate
fi

# 4. Запуск в фоне
echo ""
echo "🔌 Запуск бэкенда..."
source backend/venv/bin/activate
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..
deactivate

echo "🎨 Запуск фронтенда..."
npm run dev -- --port 3000 &
FRONTEND_PID=$!

# 5. Ожидание и открытие браузера
echo ""
echo "⏳ Ожидание запуска сервисов..."
sleep 5

# Проверяем, запущены ли сервисы
if kill -0 $BACKEND_PID 2>/dev/null && kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "✅ Сервисы запущены!"
    echo ""
    echo "🌐 Откройте в браузере: http://localhost:3000"
    echo ""
    echo "   • Демо-режим: переключатель в шапке"
    echo "   • Локальные модели: поместите .gguf в backend/data/models/"
    echo "   • Остановка: Ctrl+C (остановит оба процесса)"
    echo ""
    
    # Пробуем открыть браузер
    if command -v xdg-open >/dev/null 2>&1; then
        xdg-open http://localhost:3000
    elif command -v open >/dev/null 2>&1; then
        open http://localhost:3000
    fi
else
    echo "❌ Ошибка запуска сервисов"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 1
fi

# Обработка Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo ''; echo '🛑 Остановлено'; exit 0" INT TERM

wait
