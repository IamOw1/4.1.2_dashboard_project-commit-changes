# 🚀 Запуск Дашбордов COBA AI Drone

Быстрое руководство для запуска визуальных интерфейсов управления дроном.

## 📋 Требования

```bash
# Все зависимости указаны в requirements.txt
pip install -r requirements.txt

# Основные пакеты:
- streamlit >= 1.28
- requests >= 2.31
- flask >= 2.3 (для HTTP сервера HTML)
```

## 🎨 Вариант 1: HTML Интерфейс

### Самый быстрый способ (с Python)

```bash
# 1. В корневой папке проекта:
cd web_interface

# 2. Запустите встроенный Python HTTP сервер:
python -m http.server 8080

# 3. Откройте в браузере:
# http://localhost:8080
```

### Для более надежной работы (Flask)

```bash
# 1. Установите Flask (если еще не установлен):
pip install flask

# 2. Создайте файл server.py в папке web_interface:
```

Содержимое `server.py`:

```python
from flask import Flask, render_template, send_from_directory
import os

app = Flask(__name__, static_folder='.', template_folder='.')

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)
```

```bash
# 3. Запустите сервер:
python server.py

# 4. Откройте http://localhost:8080
```

### С Docker (для продакшена)

```bash
# Используйте встроенный Dockerfile проекта:
docker build -t coba-drone-ui .
docker run -p 8080:80 coba-drone-ui
```

---

## 📊 Вариант 2: Streamlit Приложение

### Стандартный запуск

```bash
# 1. В корневой папке проекта:
streamlit run dashboard/app.py

# 2. Приложение автоматически откроется в браузере
# Обычно на http://localhost:8501
```

### Запуск с конфигурацией

```bash
# Создайте файл .streamlit/config.toml в корне проекта:
mkdir -p .streamlit
```

Содержимое `.streamlit/config.toml`:

```ini
[client]
showErrorDetails = true
serverPort = 8501

[logger]
level = "info"

[theme]
primaryColor = "#00d4ff"
backgroundColor = "#0f1419"
secondaryBackgroundColor = "#1a1f2e"
textColor = "#ffffff"
font = "sans serif"
```

```bash
# Запустите:
streamlit run dashboard/app.py --logger.level=debug
```

### Расширенные параметры запуска

```bash
# С автоперезагрузкой при изменении файлов:
streamlit run dashboard/app.py --logger.level=info

# С отключением аналитики:
streamlit run dashboard/app.py --client.showErrorDetails=false

# На указанном хосте и порту:
streamlit run dashboard/app.py --server.address 0.0.0.0 --server.port 8501
```

---

## 🔀 Оба интерфейса одновременно

Для использования обоих дашбордов параллельно:

```bash
# Терминал 1: HTML интерфейс
cd web_interface
python -m http.server 8080

# Терминал 2: Streamlit приложение
streamlit run dashboard/app.py

# Терминал 3: API сервер (если еще не запущен)
python main.py
```

Теперь доступны оба интерфейса:
- 🖥️ HTML: http://localhost:8080
- 📊 Streamlit: http://localhost:8501
- 🔌 API: http://localhost:8000

---

## 🐳 Docker Compose (Рекомендуется)

Создайте `docker-compose.yml` в корневой папке:

```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - PYTHONUNBUFFERED=1
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs

  html-dashboard:
    image: python:3.9
    ports:
      - "8080:8080"
    working_dir: /app
    command: python -m http.server 8080
    volumes:
      - ./web_interface:/app

  streamlit-dashboard:
    image: python:3.9
    ports:
      - "8501:8501"
    working_dir: /app
    command: bash -c "pip install streamlit requests -q && streamlit run dashboard/app.py --server.address 0.0.0.0"
    volumes:
      - .:/app
    environment:
      - PYTHONUNBUFFERED=1
```

```bash
# Запуск все сразу:
docker-compose up

# Остановка:
docker-compose down
```

---

## 🌐 Сетевая конфигурация

### Локальный доступ

```bash
# HTML: http://localhost:8080
# Streamlit: http://localhost:8501
# API: http://localhost:8000
```

### Удаленный доступ

Если API на другом сервере, отредактируйте в дашбордах:

**HTML интерфейс** - строка 297:
```javascript
let apiUrl = 'http://192.168.1.100:8000'; // Замените IP
```

**Streamlit приложение** - измените переменную окружения:
```bash
API_URL="http://192.168.1.100:8000" streamlit run dashboard/app.py
```

---

## 🔍 Проверка работы

После запуска проверьте:

1. **API статус:**
   ```bash
   curl http://localhost:8000/health
   ```

2. **HTML интерфейс:**
   - Откройте http://localhost:8080
   - Нажмите "Connect"
   - Дождитесь ✅ "Connected"

3. **Streamlit приложение:**
   - Откройте http://localhost:8501
   - В боковой панели должна быть ✅ "API Connected"

---

## 🛠️ Решение проблем

### Порт уже занят

```bash
# Узнайте какой процесс использует порт:
# Linux/Mac:
lsof -i :8080

# Windows:
netstat -ano | findstr :8080

# Завершите процесс или используйте другой порт:
python -m http.server 8081
```

### API не доступен

```bash
# Убедитесь, что API запущен:
curl http://localhost:8000/health

# Если нет - запустите:
python main.py
```

### Streamlit выдает ошибку

```bash
# Очистите кэш:
streamlit cache clear

# Переустановите зависимости:
pip install --upgrade streamlit requests
```

### Проблемы с CORS

Если интерфейсы на другом сервере, может потребоваться CORS:

Отредактируйте `api/rest_api.py`:

```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Добавьте эту строку
```

---

## 📱 Мобильный доступ

### IP адрес вашей машины

```bash
# Linux/Mac:
hostname -I

# Windows:
ipconfig | grep IPv4
```

### Доступ с мобильного

```
HTTP: http://YOUR_IP:8080
Streamlit: http://YOUR_IP:8501
```

---

## ⚙️ Переменные окружения

```bash
# API URL
export API_URL="http://localhost:8000"

# Режим отладки
export DEBUG="true"

# Логирование
export LOG_LEVEL="INFO"

# Запуск:
streamlit run dashboard/app.py
```

---

## 📊 Мониторинг производительности

### HTML интерфейс
- Легче всего (~2 МБ памяти)
- Работает в любом браузере
- Идеален для мобильных устройств

### Streamlit приложение
- Более функционален (~100 МБ памяти)
- Требует Python на сервере
- Лучше для детальной аналитики

---

## 🚀 Production Deployment

### На Linux сервере

```bash
# 1. Используйте systemd сервис

sudo nano /etc/systemd/system/coba-dashboard.service
```

Содержимое:

```ini
[Unit]
Description=COBA AI Drone Dashboard
After=network.target

[Service]
Type=simple
User=drone
WorkingDirectory=/opt/coba-drone
ExecStart=/usr/bin/python3 -m streamlit run dashboard/app.py \
    --server.address 0.0.0.0 \
    --server.port 8501 \
    --client.showErrorDetails false
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# 2. Включите и запустите:
sudo systemctl enable coba-dashboard
sudo systemctl start coba-dashboard

# 3. Проверьте статус:
sudo systemctl status coba-dashboard
```

### С обратным прокси (Nginx)

```bash
# Создайте конфигурацию Nginx:
sudo nano /etc/nginx/sites-available/coba-drone
```

Содержимое:

```nginx
upstream streamlit {
    server 127.0.0.1:8501;
}

upstream html {
    server 127.0.0.1:8080;
}

server {
    listen 80;
    server_name drone.example.com;

    location / {
        proxy_pass http://streamlit;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /html/ {
        proxy_pass http://html/;
    }
}
```

```bash
# Включить конфигурацию:
sudo ln -s /etc/nginx/sites-available/coba-drone /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 📚 Дополнительная информация

- 📖 [Подробное руководство](DASHBOARD_GUIDE.md)
- 🔧 [API Документация](API_REFERENCE.md)
- 🚀 [Главный README](README.md)

---

**Готово!** Ваши дашборды должны быть запущены и работают. 🎉
