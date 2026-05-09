@echo off
REM 🚀 COBA AI Drone System - Startup Script for Windows
REM Запускает все компоненты системы в отдельных окнах

cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║       🚁 COBA AI Drone Control System - Windows Startup       ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Проверка Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python не установлен!
    pause
    exit /b 1
)

echo ✅ Python установлен
echo.

REM Создание папки логов
if not exist logs mkdir logs

REM Установка зависимостей
echo 📦 Проверка зависимостей...
python -m pip show flask >nul 2>&1 || (
    echo ⚠️  Установка Flask...
    python -m pip install -q flask flask-cors
)
python -m pip show streamlit >nul 2>&1 || (
    echo ⚠️  Установка Streamlit...
    python -m pip install -q streamlit requests
)

echo ✅ Все зависимости готовы
echo.

REM Запуск API сервера
echo ℹ️  Запускаю API сервер на порту 8000...
start "COBA AI - API Server" cmd /k "python main.py"
timeout /t 3 >nul

REM Запуск HTML интерфейса
echo ℹ️  Запускаю HTML интерфейс на порту 8080...
start "COBA AI - HTML Dashboard" cmd /k "cd web_interface && python -m http.server 8080"
timeout /t 2 >nul

REM Запуск Streamlit приложения
echo ℹ️  Запускаю Streamlit приложение на порту 8501...
start "COBA AI - Streamlit App" cmd /k "streamlit run dashboard/app.py"
timeout /t 3 >nul

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                   🎉 Система запущена!                        ║
echo ╠════════════════════════════════════════════════════════════════╣
echo ║                                                                ║
echo ║  📊 API              → http://localhost:8000                   ║
echo ║  🖥️  HTML Dashboard   → http://localhost:8080                   ║
echo ║  📈 Streamlit App     → http://localhost:8501                   ║
echo ║                                                                ║
echo ║  Откройте эти ссылки в браузере                                ║
echo ║  Закройте окна для остановки сервисов                         ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

pause
