"""
Система логирования
"""
import logging
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List


def setup_logger(name: str, level: int = logging.INFO) -> logging.Logger:
    """
    Настройка логгера.

    Args:
        name (str): Имя логгера.
        level (int): Уровень логирования.

    Returns:
        logging.Logger: Настроенный логгер.
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)

    # Проверка на существующие обработчики
    if logger.handlers:
        return logger

    # Форматтер
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    # Консольный обработчик
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # Файловый обработчик
    log_dir = Path("logs")
    log_dir.mkdir(parents=True, exist_ok=True)

    log_file = log_dir / f"{datetime.now().strftime('%Y%m%d')}.log"
    file_handler = logging.FileHandler(log_file, encoding='utf-8')
    file_handler.setLevel(level)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    return logger


class Logger:
    """Класс для управления событиями и логами"""

    def __init__(self):
        self.events = []
        self.logger = setup_logger("api_logger")

    async def get_recent_logs(self, limit: int = 100) -> List[Dict]:
        """Получение недавних логов"""
        # Заглушка - в реальности читать из файлов
        return [
            {
                "timestamp": datetime.now().isoformat(),
                "level": "INFO",
                "component": "api",
                "message": f"Sample log {i}",
                "drone_id": "drone_001"
            }
            for i in range(min(limit, 10))
        ]

    async def filter_logs(self, level=None, component=None, drone_id=None, start=None, end=None) -> List[Dict]:
        """Фильтрация логов"""
        # Заглушка
        return await self.get_recent_logs(50)

    async def configure_alerts(self, config: Dict):
        """Настройка оповещений"""
        # Заглушка
        pass

    async def delete_event(self, event_id: str):
        """Удаление события"""
        # Заглушка
        pass

    async def export_logs(self, format_type: str) -> Dict:
        """Экспорт логов"""
        # Заглушка
        return {"data": "exported_logs"}

    async def get_statistics(self) -> Dict:
        """Получение статистики"""
        return {
            "total_events": 100,
            "error_count": 5,
            "warning_count": 15,
            "info_count": 80
        }
