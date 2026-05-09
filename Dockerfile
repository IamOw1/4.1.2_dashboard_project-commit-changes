# ============================================================================
# COBA AI Drone Agent v4.0 - Docker Image
# Запуск одной командой без установки Python/зависимостей
# ============================================================================

FROM python:3.11-slim-bookworm

# Установка системных зависимостей
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    cmake \
    git \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libusb-1.0-0 \
    libgtk-3-dev \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    libv4l-dev \
    libxvidcore-dev \
    libx264-dev \
    libdc1394-dev \
    libgstreamer-plugins-base1.0-dev \
    libgstreamer1.0-dev \
    libopenexr-dev \
    libtbb-dev \
    libeigen3-dev \
    libhdf5-dev \
    libqt5gui5 \
    libqt5webkit5 \
    libqt5test5 \
    wget \
    curl \
    vim \
    htop \
    && rm -rf /var/lib/apt/lists/*

# Установка рабочей директории
WORKDIR /app

# Копирование requirements первым для кэширования
COPY requirements.txt .

# Установка Python зависимостей
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Копирование всего проекта
COPY . .

# Создание необходимых директорий
RUN mkdir -p data/{missions,reports,state,memory,tiles,flight_data} \
    logs \
    backup \
    assets

# Порт для API
EXPOSE 8000
# Порт для дашборда
EXPOSE 8501
# Порт для WebSocket
EXPOSE 8765
# Порт для Mesh сети
EXPOSE 9000-9100

# Переменные окружения
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV COBA_ENV=docker

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')" || exit 1

# Запуск по умолчанию
CMD ["python", "main.py", "all"]
