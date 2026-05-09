# 🚀 Быстрая шпаргалка (Quick Start)

## 1️⃣ Самый быстрый способ (30 секунд)

### Linux/Mac
```bash
chmod +x start_dashboard.sh
./start_dashboard.sh
```

### Windows
```cmd
start_dashboard.bat
```

**Готово!** Все откроется в браузере автоматически 🎉

---

## 2️⃣ Ручной запуск (если что-то не так)

### Окно 1: API сервер
```bash
python main.py
```

### Окно 2: HTML интерфейс
```bash
cd web_interface
python -m http.server 8080
```

### Окно 3: Streamlit приложение
```bash
streamlit run dashboard/app.py
```

---

## 3️⃣ Адреса для открытия в браузере

| Что | Адрес | Описание |
|-----|-------|---------|
| 🖥️ HTML Dashboard | http://localhost:8080 | ⭐ **Главный интерфейс** |
| 📊 Streamlit App | http://localhost:8501 | Детальное управление |
| 📡 API | http://localhost:8000 | Для программистов |

---

## 4️⃣ Опции по ОС

### macOS
```bash
# Установка зависимостей
brew install python3
pip3 install -r requirements.txt

# Запуск
./start_dashboard.sh
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install python3 python3-pip
pip3 install -r requirements.txt

./start_dashboard.sh
```

### Windows 10/11
```cmd
REM Установка Python с python.org, затем:
pip install -r requirements.txt

REM Запуск
start_dashboard.bat
```

---

## 5️⃣ Docker (если установлен)

```bash
docker-compose up
```

---

## ❓ FAQ

**Q: Дашборд не открывается**
A: Убедитесь что Python установлен и работает:
```bash
python3 --version
```

**Q: Ошибка "порт уже используется"**
A: Закройте другие приложения на этих портах или используйте другие:
```bash
python -m http.server 8081  # вместо 8080
streamlit run dashboard/app.py --server.port 8502  # вместо 8501
```

**Q: "API недоступен"**
A: Убедитесь что API запущен в первом окне:
```bash
python main.py
```

---

## 📱 Структура интерфейса

### HTML Dashboard (🖥️ Главный)
```
┌─────────────────────────────────┐
│ NAVBAR: COBA AI | Status        │ ← Статус на живо
├─────────────────────────────────┤
│ CONNECT PANEL: URL input        │ ← Подключение
├──────┬──────┬──────┬──────┬─────┤
│ STA │ BATT │ ALT │ SPEED │ SGN │ ← 6 показателей
├──────────────────────────────────┤
│ □ Telemetry │ □ Controls │ □ Map │ ← Основные разделы
│ □ Scenarios │ □ Tools    │ □ Log │ 
└──────────────────────────────────┘
```

### Streamlit App (📊 Детальное)
```
SIDEBAR:
├─ 🎛️ Control Panel
├─ Agent Management
├─ System Tools
└─ Settings

TABS:
├─ 📊 Dashboard
├─ 📈 Telemetry  
├─ 🗺️ Missions
├─ 🎮 Flight Controls
└─ 🚀 Scenarios
```

---

## ⌨️ Клавиши и команды

### Главные команды
| Кнопка | Действие |
|--------|----------|
| **Connect** | Подключиться к API |
| **Takeoff** | Взлет на 15м |
| **Land** | Посадка |
| **RTL** | Возврат на базу |
| **Hover** | Зависание на месте |

### Сценарии (один клик)
| Кнопка | Функция |
|--------|---------|
| 👁️ Patrol | Облет периметра |
| 🔍 Search | Поиск объектов |
| 📸 Survey | Съемка территории |
| 📦 Delivery | Доставка груза |
| 🐝 Swarm | Роевой полет |
| 🔧 Inspection | Инспекция объекта |

---

## 🎨 Горячие клавиши

| Клавиша | Действие |
|---------|----------|
| Ctrl+Shift+M | Мобильное меню (Streamlit) |
| Ctrl+Shift+R | Перезагрузить страницу |
| F12 | Открыть DevTools (отладка) |

---

## 📊 Понимание показателей

### Батарея 🔋
- 🟢 > 80% - Отлично
- 🟡 50-80% - Хорошо
- 🔴 < 50% - Нужна зарядка

### Сигнал 📡
- 🟢 > 80% - Сильный
- 🟡 40-80% - Средний
- 🔴 < 40% - Слабый

### Высота ⬆️
- Показывает в метрах (м)
- Предел в 100м

### Ориентация
- **Roll** - наклон влево/вправо
- **Pitch** - наклон вперед/назад
- **Yaw** - поворот (0-360°)

---

## 🛠️ Если что-то не работает

### Шаг 1: Проверьте соединение
```bash
curl http://localhost:8000/health
```

### Шаг 2: Посмотрите логи
```bash
tail -f logs/api.log          # API логи
tail -f logs/html_dashboard.log  # HTML логи
tail -f logs/streamlit.log    # Streamlit логи
```

### Шаг 3: Перезагрузите все
```bash
# Завершите все процессы (Ctrl+C)
# Запустите снова:
./start_dashboard.sh  # или start_dashboard.bat для Windows
```

---

## 📚 Где мне больше информации?

| Файл | Информация |
|------|-----------|
| 📖 [DASHBOARD_GUIDE.md](DASHBOARD_GUIDE.md) | Полное руководство |
| 📖 [RUN_DASHBOARD.md](RUN_DASHBOARD.md) | Все способы запуска |
| 📖 [API_REFERENCE.md](API_REFERENCE.md) | API документация |
| 📖 [README.md](README.md) | Основная информация |

---

## 🎯 Типичные сценарии

### Я хочу просто посмотреть статус дрона
→ Откройте **HTML Dashboard** (http://localhost:8080)

### Я хочу создать сложную миссию
→ Откройте **Streamlit** (http://localhost:8501)

### Я разработчик и интегрирую API
→ Используйте **http://localhost:8000/api/v1/...**

### Я хочу запустить сценарий
→ Нажмите карточку в HTML Dashboard

---

## ✨ Советы для лучшего опыта

💡 **Совет 1:** Откройте оба интерфейса в разных вкладках браузера

💡 **Совет 2:** Используйте HTML для быстрых команд, Streamlit для детальной работы

💡 **Совет 3:** Следите за логом внизу HTML интерфейса - там все события

💡 **Совет 4:** Если дрон не подчиняется, проверьте батарею и сигнал

💡 **Совет 5:** Монитор система в боковой панели Streamlit

---

## 🚀 Готово примерно за...

| Способ | Время |
|--------|-------|
| Скрипт запуска | **30 сек** ⚡ |
| Ручной запуск | **2 мин** |
| Docker Compose | **3 мин** |
| Первая команда дрону | **5 мин** |

---

**Наслаждайтесь управлением дроном!** 🚁✨

Вопросы? Смотрите документацию в файлах проекта! 📖
