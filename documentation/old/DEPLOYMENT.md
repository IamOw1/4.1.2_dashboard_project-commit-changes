# Руководство по развертыванию - COBA AI Drone Agent v4.1

## Обзор

COBA AI Drone Agent поддерживает несколько способов развертывания: локальная установка, Docker, Docker Compose и Kubernetes. Выберите подходящий вариант в зависимости от ваших требований.

## 🚀 Быстрое развертывание

### Docker Compose (рекомендуется)

```bash
# Клонирование репозитория
git clone https://github.com/IamOw1/preview-version-4.1_coba_ai_drone_final.git
cd preview-version-4.1_coba_ai_drone_final

# Запуск всех сервисов
docker-compose up --build
```

После запуска будут доступны:
- **API**: http://localhost:8000
- **Dashboard**: http://localhost:8501
- **WebSocket**: ws://localhost:8765

### Docker (одиночный контейнер)

```bash
# Сборка образа
docker build -t coba-drone .

# Запуск контейнера
docker run -p 8000:8000 -p 8501:8501 -p 8765:8765 coba-drone
```

## 📋 Системные требования

### Минимальные требования
- **CPU**: 2 ядра
- **RAM**: 4 GB
- **Диск**: 10 GB
- **ОС**: Linux, Windows 10+, macOS 10.15+

### Рекомендуемые требования
- **CPU**: 4+ ядер
- **RAM**: 8+ GB
- **Диск**: 50+ GB SSD
- **GPU**: NVIDIA с CUDA (опционально, для ускорения ИИ)

### Сетевые требования
- **Порты**: 8000 (API), 8501 (Dashboard), 8765 (WebSocket), 9000-9100 (Mesh)
- **Интернет**: Для обновлений и внешних API (DeepSeek)

## 🐳 Docker развертывание

### Docker Compose конфигурация

```yaml
version: '3.8'

services:
  drone-agent:
    build: .
    ports:
      - "8000:8000"    # REST API
      - "8501:8501"    # Dashboard
      - "8765:8765"    # WebSocket
      - "9000-9100:9000-9100"  # Mesh Network
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
      - ./config:/app/config:ro
    environment:
      - DEEPSEEK_API_KEY=your_key_here
      - COBA_API_KEY=your_api_key
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
```

### Переменные окружения

| Переменная | Описание | Значение по умолчанию |
|------------|----------|----------------------|
| `DEEPSEEK_API_KEY` | Ключ для DeepSeek AI | - |
| `COBA_API_KEY` | API ключ для аутентификации | coba-default-key |
| `DASHBOARD_PASSWORD` | Пароль для dashboard | admin |
| `DRONE_CONNECTION_STRING` | MAVLink соединение | udp:127.0.0.1:14550 |
| `PYTHONPATH` | Python path | /app |

### Volumes

| Volume | Описание |
|--------|----------|
| `./data` | Данные миссий, телеметрия |
| `./logs` | Логи системы |
| `./backup` | Резервные копии |
| `./config` | Конфигурационные файлы |

## ☸️ Kubernetes развертывание

### Deployment манифест

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: coba-drone-agent
spec:
  replicas: 1
  selector:
    matchLabels:
      app: coba-drone
  template:
    metadata:
      labels:
        app: coba-drone
    spec:
      containers:
      - name: drone-agent
        image: coba-drone:latest
        ports:
        - containerPort: 8000
          name: api
        - containerPort: 8501
          name: dashboard
        - containerPort: 8765
          name: websocket
        env:
        - name: DEEPSEEK_API_KEY
          valueFrom:
            secretKeyRef:
              name: coba-secrets
              key: deepseek-api-key
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        volumeMounts:
        - name: data
          mountPath: /app/data
        - name: logs
          mountPath: /app/logs
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: coba-data-pvc
      - name: logs
        persistentVolumeClaim:
          claimName: coba-logs-pvc
```

### Service манифест

```yaml
apiVersion: v1
kind: Service
metadata:
  name: coba-drone-service
spec:
  selector:
    app: coba-drone
  ports:
  - name: api
    port: 8000
    targetPort: 8000
  - name: dashboard
    port: 8501
    targetPort: 8501
  - name: websocket
    port: 8765
    targetPort: 8765
  type: LoadBalancer
```

### Ingress (опционально)

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: coba-drone-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: drone.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: coba-drone-service
            port:
              number: 8000
```

## 🏠 Локальное развертывание

### Ubuntu/Debian

```bash
# Установка системных зависимостей
sudo apt update
sudo apt install -y python3 python3-pip python3-venv git

# Клонирование
git clone https://github.com/IamOw1/preview-version-4.1_coba_ai_drone_final.git
cd preview-version-4.1_coba_ai_drone_final

# Создание виртуального окружения
python3 -m venv venv
source venv/bin/activate

# Установка зависимостей
pip install -r requirements.txt

# Проверка системы
python main.py check

# Запуск
python main.py all
```

### Windows

```powershell
# Установка Python (если не установлен)
# Скачать с https://python.org

# Клонирование
git clone https://github.com/IamOw1/preview-version-4.1_coba_ai_drone_final.git
cd preview-version-4.1_coba_ai_drone_final

# Создание виртуального окружения
python -m venv venv
venv\Scripts\activate

# Установка зависимостей
pip install -r requirements.txt

# Запуск
python main.py all
```

### macOS

```bash
# Установка Homebrew (если не установлен)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Установка Python
brew install python

# Клонирование
git clone https://github.com/IamOw1/preview-version-4.1_coba_ai_drone_final.git
cd preview-version-4.1_coba_ai_drone_final

# Создание виртуального окружения
python3 -m venv venv
source venv/bin/activate

# Установка зависимостей
pip install -r requirements.txt

# Запуск
python main.py all
```

## 🔧 Конфигурация

### config/config.yaml

```yaml
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

### Переменные окружения (.env)

```bash
# API ключи
DEEPSEEK_API_KEY=sk-your-key-here
COBA_API_KEY=coba-production-key

# Система
LOG_LEVEL=INFO
PYTHONPATH=/app

# Дрон
DRONE_CONNECTION_STRING=udp:127.0.0.1:14550

# Безопасность
DASHBOARD_PASSWORD=secure-password
```

## 📊 Мониторинг и логирование

### Логи

Логи сохраняются в директорию `logs/`:
- `coba_agent.log` - основные логи агента
- `api.log` - логи API сервера
- `errors.log` - ошибки системы

### Метрики

API предоставляет эндпоинты для мониторинга:
- `GET /health` - статус системы
- `GET /api/v1/status` - статус агента
- `GET /api/v1/telemetry` - телеметрия

### Health checks

```bash
# Проверка API
curl http://localhost:8000/health

# Проверка dashboard
curl http://localhost:8501

# Проверка WebSocket
websocat ws://localhost:8765
```

## 🔒 Безопасность

### Рекомендации

1. **Используйте HTTPS** в продакшене
2. **Настройте аутентификацию** через API ключи
3. **Ограничьте сетевой доступ** к портам
4. **Регулярно обновляйте** зависимости
5. **Мониторьте логи** на подозрительную активность

### Firewall правила

```bash
# Разрешить только необходимые порты
sudo ufw allow 8000/tcp  # API
sudo ufw allow 8501/tcp  # Dashboard
sudo ufw allow 8765/tcp  # WebSocket
sudo ufw allow 9000:9100/udp  # Mesh Network
```

## 🚀 Масштабирование

### Горизонтальное масштабирование

Для нескольких дронов используйте mesh сеть:

```yaml
# docker-compose для нескольких инстансов
services:
  drone-1:
    # конфигурация для drone-1
  drone-2:
    # конфигурация для drone-2
  load-balancer:
    image: nginx
    # балансировка нагрузки между API инстансами
```

### Вертикальное масштабирование

Увеличьте ресурсы контейнера:

```yaml
services:
  drone-agent:
    deploy:
      resources:
        limits:
          memory: 8G
          cpus: '4.0'
        reservations:
          memory: 4G
          cpus: '2.0'
```

## 🔄 Обновление

### Docker

```bash
# Остановка
docker-compose down

# Обновление образа
docker-compose pull

# Запуск с новыми версиями
docker-compose up --build
```

### Локальное

```bash
# Обновление кода
git pull origin main

# Обновление зависимостей
pip install -r requirements.txt --upgrade

# Перезапуск
python main.py all
```

## 🐛 Устранение неполадок

### Распространенные проблемы

#### API не запускается
```bash
# Проверить порты
netstat -tlnp | grep 8000

# Проверить логи
tail -f logs/api.log
```

#### OpenCV ошибки
```bash
# В headless окружении это нормально
# Установить системные зависимости
sudo apt install libgl1-mesa-glx libglib2.0-0
```

#### Недостаточно памяти
```bash
# Проверить использование памяти
docker stats

# Увеличить лимиты в docker-compose.yml
services:
  drone-agent:
    deploy:
      resources:
        limits:
          memory: 8G
```

#### Проблемы с WebSocket
```bash
# Проверить соединение
curl -I http://localhost:8765

# Проверить логи WebSocket
grep websocket logs/*.log
```

## 📞 Поддержка

- **Документация**: [docs.coba-drone.com](https://docs.coba-drone.com)
- **GitHub Issues**: [Сообщить о проблеме](https://github.com/IamOw1/preview-version-4.1_coba_ai_drone_final/issues)
- **Email**: deployment-support@coba-drone.com

## 📋 Checklist развертывания

- [ ] Системные требования проверены
- [ ] Зависимости установлены
- [ ] Конфигурация настроена
- [ ] Переменные окружения установлены
- [ ] Порты доступны
- [ ] Безопасность настроена
- [ ] Мониторинг включен
- [ ] Резервное копирование настроено
