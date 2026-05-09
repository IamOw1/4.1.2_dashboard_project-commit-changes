# Установка и локальный запуск (v4.0)

Ниже — пошаговая инструкция для пользователей, которые не знакомы с исходным кодом.

## 1) Системные требования
- OS: Windows 10/11 (локально), Linux/WSL (рекомендуется для Docker)
- Python: 3.9+ (Docker использует Python 3.11)
- RAM: от 8 ГБ
- Доступ в интернет: нужен для установки зависимостей

> В `requirements.txt` есть тяжёлые ML/vision библиотеки (`torch`, `opencv-python`, `open3d` и др.). Установка может занять время.

## 2) Подготовка окружения
1. Откройте папку проекта: `coba_ai_drone_final`
2. Создайте виртуальное окружение:

### Windows
```cmd
python -m venv venv
venv\Scripts\activate
```

### Linux/Mac
```bash
python3 -m venv venv
source venv/bin/activate
```

3. Установите зависимости:
```bash
pip install -U pip
pip install -r requirements.txt
```

## 3) Переменные окружения (`.env`)
В корне проекта есть:
- `.env` (файл для запуска)
- `.env.example` (шаблон)

Если хотите менять значения:
```bash
copy .env.example .env   # Windows
# или: cp .env.example .env  # Linux/Mac
```

Обязательные/полезные переменные:
- `DEEPSEEK_API_KEY` (опционально; Sub-Agent использует это для DeepSeek, если включено)
- `DEEPSEEK_API_BASE` (опционально)
- `DEEPSEEK_MODEL` (опционально)
- `DASHBOARD_PASSWORD` (пароль для dashboard)
- `DRONE_CONNECTION_STRING` (строка подключения к дрону; по умолчанию UDP localhost)
- `LOG_LEVEL` (например `INFO`)

Важно: `main.py` автоматически подгружает `.env` через `python-dotenv`, если файл существует.

## 4) Конфигурация `config/config.yaml`
Конфигурация лежит в `config/config.yaml`.

Что важно знать:
- при первом запуске `python main.py check` может создать `config/config.yaml` по умолчанию, если файла нет;
- в Docker `./config` монтируется как read-only (`:ro`), поэтому в контейнере нельзя “дозаписать” конфиг. Убедитесь, что `config/config.yaml` уже присутствует на хосте.

## 5) Проверка перед стартом
Запустите проверку:
```bash
python main.py check
```

Она:
- создаёт директории `data/`, `logs/`, `backup/`
- создаёт конфиг по умолчанию (если он отсутствует)
- делает импорт-закладки зависимостей (логирует, если что-то отсутствует)

## 6) Запуск

### Всё вместе
```bash
python main.py all
```

Запускает:
- API сервер (FastAPI) и CoreAgent (непрерывный цикл внутри API-процесса)
- Web Dashboard (Streamlit) в отдельном процессе

### Отдельно
```bash
python main.py api        # API + CoreAgent
python main.py dashboard  # Dashboard
python main.py agent      # CoreAgent без API
python main.py gui        # PyQt GUI
```

## 7) Проверка логики (unit-тесты)
```bash
pytest
```

