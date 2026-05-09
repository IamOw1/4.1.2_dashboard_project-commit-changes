#!/bin/bash
# 🚀 COBA AI Drone System - Complete Startup Script
# Запускает API, HTML интерфейс и Streamlit приложение одновременно

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║       🚁 COBA AI Drone Control System - Startup              ║"
echo "╚════════════════════════════════════════════════════════════════╝"

# Проверка Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 не установлен!"
    exit 1
fi

echo "✅ Python найден: $(python3 --version)"

# Проверка зависимостей
echo ""
echo "📦 Проверка зависимостей..."

if ! python3 -c "import flask" 2>/dev/null; then
    echo "⚠️ Flask не установлен. Установка..."
    pip install -q flask flask-cors
fi

if ! python3 -c "import streamlit" 2>/dev/null; then
    echo "⚠️ Streamlit не установлен. Установка..."
    pip install -q streamlit requests
fi

if ! python3 -c "import requests" 2>/dev/null; then
    echo "⚠️ Requests не установлен. Установка..."
    pip install -q requests
fi

echo "✅ Все зависимости установлены!"

# Функции для цветного вывода
print_info() {
    echo "ℹ️  $1"
}

print_success() {
    echo "✅ $1"
}

print_error() {
    echo "❌ $1"
}

# Создание логов папки
mkdir -p logs

# Запуск API
print_info "Запускаю API сервер на порту 8000..."
python3 main.py > logs/api.log 2>&1 &
API_PID=$!
echo "API PID: $API_PID"

sleep 2

# Проверка API
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    print_success "API запущен и доступен на http://localhost:8000"
else
    print_error "API не стартовал. Проверьте logs/api.log"
    kill $API_PID 2>/dev/null || true
    exit 1
fi

echo ""

# Запуск HTML интерфейса
print_info "Запускаю HTML интерфейс на порту 8080..."
cd web_interface
python3 -m http.server 8080 > ../logs/html_dashboard.log 2>&1 &
HTML_PID=$!
echo "HTML PID: $HTML_PID"
cd ..

sleep 1
print_success "HTML интерфейс доступен на http://localhost:8080"

echo ""

# Запуск Streamlit приложения
print_info "Запускаю Streamlit приложение на порту 8501..."
streamlit run dashboard/app.py --logger.level=info --client.showErrorDetails=false > logs/streamlit.log 2>&1 &
STREAMLIT_PID=$!
echo "Streamlit PID: $STREAMLIT_PID"

sleep 3
print_success "Streamlit приложение доступен на http://localhost:8501"

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                   🎉 Система запущена!                        ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║                                                                ║"
echo "║  📊 API              → http://localhost:8000                   ║"
echo "║  🖥️  HTML Dashboard   → http://localhost:8080                   ║"
echo "║  📈 Streamlit App     → http://localhost:8501                   ║"
echo "║                                                                ║"
echo "║  Нажмите Ctrl+C для остановки всех сервисов                   ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"

# Функция для перехвата Ctrl+C
cleanup() {
    echo ""
    echo "🛑 Остановка сервисов..."

    kill $API_PID 2>/dev/null || true
    kill $HTML_PID 2>/dev/null || true
    kill $STREAMLIT_PID 2>/dev/null || true

    sleep 1

    print_success "Все сервисы остановлены"
    exit 0
}

# Установка обработчика сигнала
trap cleanup SIGINT SIGTERM

# Ожидание в фоне
wait
