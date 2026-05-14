"""
Модуль валидации настроек языковых моделей для агентов.

Проверяет наличие и корректность моделей Core и Sub агентов
перед запуском системы, определяет режим работы (реальные модели или демо).
"""

import logging
import os
from pathlib import Path
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


def _get_setting(name: str, default: Optional[str] = None) -> Optional[str]:
    """Получает значение настройки из переменных окружения."""
    return os.environ.get(name, default)


def check_model(model_path: Optional[str]) -> Dict[str, Any]:
    """
    Проверяет существование и доступность файла модели.
    
    Args:
        model_path: Путь к файлу модели из конфигурации.
        
    Returns:
        Словарь с результатами проверки:
        - exists: bool - существует ли файл
        - path: str - нормализованный путь
        - size_mb: float - размер файла в МБ (если существует)
        - valid: bool - прошла ли модель проверку
    """
    result: Dict[str, Any] = {
        'exists': False,
        'path': '',
        'size_mb': 0.0,
        'valid': False
    }
    
    if not model_path:
        logger.debug("Путь к модели не указан")
        return result
    
    model_file = Path(model_path)
    result['path'] = str(model_file.absolute())
    
    if not model_file.exists():
        logger.debug(f"Файл модели не найден: {model_path}")
        return result
    
    if not model_file.is_file():
        logger.warning(f"Указанный путь не является файлом: {model_path}")
        return result
    
    result['exists'] = True
    result['size_mb'] = round(model_file.stat().st_size / (1024 * 1024), 2)
    
    # Проверка минимального размера (защита от пустых файлов)
    if result['size_mb'] < 10:  # Минимум 10 МБ
        logger.warning(f"Файл модели слишком мал ({result['size_mb']} МБ): {model_path}")
        return result
    
    # Проверка расширения
    valid_extensions = {'.gguf', '.onnx', '.pt', '.bin', '.safetensors'}
    if model_file.suffix.lower() not in valid_extensions:
        logger.warning(f"Неизвестное расширение модели: {model_file.suffix}")
        # Не считаем это критической ошибкой, помечаем как валидную
        result['valid'] = True
    else:
        result['valid'] = True
    
    logger.info(f"Модель проверена: {result['path']} ({result['size_mb']} МБ)")
    return result


def validate_model_setup() -> Dict[str, Any]:
    """
    Проверяет наличие и корректность моделей перед запуском.
    
    Выполняет полную проверку конфигурации языковых моделей для
    Core и Sub агентов, определяет режим работы системы.
    
    Returns:
        Словарь с результатами валидации:
        - core_agent: Dict - результаты проверки Core агента
        - sub_agent: Dict - результаты проверки Sub агента
        - fallback: str - режим работы ('real_models' или 'stub_mode')
        - ready: bool - готова ли система к работе с реальными моделями
    """
    logger.info("🔍 Начало валидации настроек моделей...")
    
    # Получаем пути к моделям из переменных окружения
    core_model_path = _get_setting(
        'CORE_AGENT_MODEL_PATH',
        'data/models/core_agent/llama-3-8b.Q4_K_M.gguf'
    )
    sub_model_path = _get_setting(
        'SUB_AGENT_MODEL_PATH',
        'data/models/sub_agent/qwen2.5-7b.Q5_K_S.gguf'
    )
    
    result: Dict[str, Any] = {
        'core_agent': check_model(core_model_path),
        'sub_agent': check_model(sub_model_path),
        'fallback': 'real_models',
        'ready': False
    }
    
    # Определяем режим работы
    core_ready = result['core_agent']['valid']
    sub_ready = result['sub_agent']['valid']
    
    if not (core_ready and sub_ready):
        result['fallback'] = 'stub_mode'
        logger.warning("⚠️ Модели не найдены или не прошли валидацию.")
        logger.warning("Запуск в демо-режиме с заглушками.")
        
        if not core_ready:
            logger.info(
                f"💡 Core Agent: модель не готова "
                f"(путь: {core_model_path})"
            )
        
        if not sub_ready:
            logger.info(
                f"💡 Sub Agent: модель не готова "
                f"(путь: {sub_model_path})"
            )
        
        logger.info(
            "📚 Скачайте модели по инструкции в README.md "
            "для полной функциональности."
        )
    else:
        logger.info("✅ Все модели готовы к работе.")
        logger.info(
            f"   Core Agent: {result['core_agent']['size_mb']} МБ"
        )
        logger.info(
            f"   Sub Agent: {result['sub_agent']['size_mb']} МБ"
        )
    
    result['ready'] = (result['fallback'] == 'real_models')
    
    return result


def get_model_info() -> Dict[str, Any]:
    """
    Возвращает подробную информацию о настроенных моделях.
    
    Returns:
        Словарь с информацией о моделях:
        - format: str - формат модели (gguf/onnx/pytorch)
        - quantization: str - квантование (для GGUF)
        - recommended: bool - соответствует ли рекомендуемым параметрам
    """
    core_model_path = _get_setting(
        'CORE_AGENT_MODEL_PATH',
        'data/models/core_agent/llama-3-8b.Q4_K_M.gguf'
    )
    sub_model_path = _get_setting(
        'SUB_AGENT_MODEL_PATH',
        'data/models/sub_agent/qwen2.5-7b.Q5_K_S.gguf'
    )
    model_format = _get_setting('AGENT_MODEL_FORMAT', 'gguf')
    quantization = _get_setting('AGENT_QUANTIZATION', 'Q4_K_M')
    
    info: Dict[str, Any] = {
        'core_agent': {
            'path': core_model_path,
            'format': model_format,
            'quantization': quantization,
        },
        'sub_agent': {
            'path': sub_model_path,
            'format': model_format,
            'quantization': quantization,
        }
    }
    
    # Определение формата по расширению
    for agent_key in ['core_agent', 'sub_agent']:
        path = info[agent_key]['path']
        if path:
            ext = Path(path).suffix.lower()
            if ext == '.gguf':
                info[agent_key]['detected_format'] = 'gguf'
            elif ext == '.onnx':
                info[agent_key]['detected_format'] = 'onnx'
            elif ext in ['.pt', '.bin', '.safetensors']:
                info[agent_key]['detected_format'] = 'pytorch'
            else:
                info[agent_key]['detected_format'] = 'unknown'
    
    return info


if __name__ == '__main__':
    # Тестовый запуск валидации
    logging.basicConfig(
        level=logging.INFO,
        format='%(levelname)s: %(message)s'
    )
    
    print("=" * 60)
    print("🔍 Валидация настроек моделей агентов")
    print("=" * 60)
    
    result = validate_model_setup()
    
    print("\n📊 Результаты:")
    print(f"   Режим работы: {result['fallback']}")
    print(f"   Система готова: {result['ready']}")
    
    if result['core_agent']['exists']:
        print(
            f"\n✅ Core Agent: {result['core_agent']['size_mb']} МБ"
        )
    else:
        print("\n❌ Core Agent: модель не найдена")
    
    if result['sub_agent']['exists']:
        print(
            f"✅ Sub Agent: {result['sub_agent']['size_mb']} МБ"
        )
    else:
        print("❌ Sub Agent: модель не найдена")
    
    print("\n" + "=" * 60)
