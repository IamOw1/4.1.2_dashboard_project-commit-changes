"""
================================================================================
Logger - Настройка логирования
================================================================================
"""
import logging
import sys
from pathlib import Path
try:
    # Optional dependency: used for colored console logs.
    from colorlog import ColoredFormatter  # type: ignore
except ModuleNotFoundError:
    ColoredFormatter = None  # fallback to standard logging formatter


def setup_logger(name: str, level: str = None) -> logging.Logger:
    """Настройка логгера с цветным выводом"""
    
    if level is None:
        import os
        level = os.getenv("LOG_LEVEL", "INFO")
    
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level.upper()))
    
    # Удаление существующих обработчиков
    logger.handlers = []
    
    # Консольный вывод с цветами
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.DEBUG)
    
    if ColoredFormatter is not None:
        color_formatter = ColoredFormatter(
            "%(log_color)s%(asctime)s | %(name)-20s | %(levelname)-8s | %(message)s%(reset)s",
            datefmt="%H:%M:%S",
            log_colors={
                'DEBUG': 'cyan',
                'INFO': 'green',
                'WARNING': 'yellow',
                'ERROR': 'red',
                'CRITICAL': 'red,bg_white',
            }
        )
        console_handler.setFormatter(color_formatter)
    else:
        # colorlog is not installed; keep output format stable.
        fallback_formatter = logging.Formatter(
            "%(asctime)s | %(name)-20s | %(levelname)-8s | %(message)s",
            datefmt="%H:%M:%S"
        )
        console_handler.setFormatter(fallback_formatter)
    logger.addHandler(console_handler)
    
    # Файловый вывод
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    file_handler = logging.FileHandler(log_dir / "drone_agent.log", encoding='utf-8')
    file_handler.setLevel(logging.DEBUG)
    file_formatter = logging.Formatter(
        "%(asctime)s | %(name)-20s | %(levelname)-8s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    file_handler.setFormatter(file_formatter)
    logger.addHandler(file_handler)
    
    return logger
