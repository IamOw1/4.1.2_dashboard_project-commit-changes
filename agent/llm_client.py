"""
Клиент для работы с языковыми моделями (локальными и облачными).

Поддерживает три формата моделей:
- GGUF (через llama-cpp-python)
- ONNX (через onnxruntime)
- PyTorch (через transformers)

Также поддерживает облачные API (DeepSeek) как fallback.

Приоритет подключения:
1. Локальная модель (GGUF/ONNX/PyTorch)
2. DeepSeek API (если локальная модель не найдена)
"""

import os
import logging
from typing import Dict, List, Optional, Any, Union
from pathlib import Path
from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger(__name__)


class ModelFormat(Enum):
    """Поддерживаемые форматы моделей."""
    GGUF = "gguf"
    ONNX = "onnx"
    PYTORCH = "pytorch"
    DEEPSEEK_API = "deepseek_api"


@dataclass
class ModelConfig:
    """Конфигурация модели."""
    format: ModelFormat
    path: Optional[str] = None
    quantization: Optional[str] = None
    api_key: Optional[str] = None
    model_name: Optional[str] = None
    is_local: bool = True


class LLMClient:
    """
    Клиент для работы с языковыми моделями.
    
    Приоритет подключения:
    1. Локальная модель (GGUF/ONNX/PyTorch)
    2. DeepSeek API (если локальная модель не найдена)
    
    Attributes:
        SUPPORTED_FORMATS: Словарь поддерживаемых форматов и квантований.
        DEEPSEEK_API_KEY: API ключ для DeepSeek.
        DEEPSEEK_BASE_URL: Базовый URL API DeepSeek.
        DEEPSEEK_MODEL: Название модели DeepSeek по умолчанию.
    """
    
    SUPPORTED_FORMATS = {
        'gguf': ['Q4_K_M', 'Q5_K_S', 'Q8_0'],  # llama.cpp
        'onnx': ['float32', 'float16'],         # ONNX Runtime
        'pytorch': ['pt', 'bin', 'safetensors'] # PyTorch
    }
    
    # DeepSeek API конфигурация (ключ только из окружения)
    DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
    DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1"
    DEEPSEEK_MODEL = "deepseek-chat"
    
    def __init__(self, agent_type: str = "core"):
        """
        Инициализирует LLM клиент.
        
        Args:
            agent_type: Тип агента ('core' или 'sub').
        """
        self.agent_type = agent_type
        self.model_config: Optional[ModelConfig] = None
        self._model_instance: Any = None
        self._tokenizer: Any = None
        self._use_deepseek = False
        self._stub_mode = False

        # Получаем путь к модели из переменных окружения
        if agent_type == "core":
            self.model_path = os.getenv("CORE_AGENT_MODEL_PATH")
        else:
            self.model_path = os.getenv("SUB_AGENT_MODEL_PATH")
        
        self.model_format = os.getenv("AGENT_MODEL_FORMAT", "gguf")
        self.quantization = os.getenv("AGENT_QUANTIZATION", "Q4_K_M")
        
        # Проверяем наличие локальной модели
        if not self._check_local_model_exists():
            logger.warning(
                f"⚠️ Локальная модель не найдена по пути: {self.model_path}. "
                f"Используем DeepSeek API как fallback."
            )
            self._use_deepseek = True
            self._init_deepseek()
        else:
            logger.info(f"✅ Найдена локальная модель: {self.model_path}")
            self._init_local_model()
    
    def _check_local_model_exists(self) -> bool:
        """
        Проверяет существование файла локальной модели.
        
        Returns:
            bool: True если файл существует и имеет размер > 10 МБ.
        """
        if not self.model_path:
            return False
        
        path = Path(self.model_path)
        if not path.exists():
            return False
        
        # Проверка минимального размера (10 МБ)
        min_size = 10 * 1024 * 1024  # 10 MB
        if path.stat().st_size < min_size:
            logger.warning(
                f"Файл модели слишком маленький ({path.stat().st_size} байт). "
                f"Ожидалось минимум {min_size} байт."
            )
            return False
        
        return True
    
    def _init_local_model(self) -> None:
        """
        Инициализирует локальную модель.
        
        Raises:
            ImportError: Если необходимая библиотека не установлена.
        """
        try:
            format_lower = self.model_format.lower()
            
            if format_lower == 'gguf':
                self._load_gguf_model()
            elif format_lower == 'onnx':
                self._load_onnx_model()
            elif format_lower in ['pytorch', 'pt', 'bin', 'safetensors']:
                self._load_pytorch_model()
            else:
                raise ValueError(f"Неподдерживаемый формат: {self.model_format}")
            
            self.model_config = ModelConfig(
                format=ModelFormat(format_lower),
                path=self.model_path,
                quantization=self.quantization,
                is_local=True
            )
            
            logger.info(f"✅ Локальная модель успешно загружена: {self.model_path}")
            
        except ImportError as e:
            logger.error(f"❌ Ошибка импорта библиотеки: {e}")
            logger.info("💡 Переключаемся на DeepSeek API...")
            self._use_deepseek = True
            self._init_deepseek()
        except Exception as e:
            logger.error(f"❌ Ошибка загрузки локальной модели: {e}")
            logger.info("💡 Переключаемся на DeepSeek API...")
            self._use_deepseek = True
            self._init_deepseek()
    
    def _init_deepseek(self) -> None:
        """
        Инициализирует клиент для работы с DeepSeek API.
        
        Проверяет наличие API ключа и устанавливает соединение.
        """
        try:
            # Проверяем API ключ (может быть переопределён в .env)
            api_key = os.getenv("DEEPSEEK_API_KEY", self.DEEPSEEK_API_KEY)
            
            if not api_key or api_key.strip() == "" or api_key == "your_api_key_here":
                logger.warning(
                    "⚠️ DEEPSEEK_API_KEY не задан — LLM работает в stub-режиме (демо без облака)."
                )
                self._use_deepseek = False
                self._stub_mode = True
                self.model_config = None
                return

            self.model_config = ModelConfig(
                format=ModelFormat.DEEPSEEK_API,
                api_key=api_key,
                model_name=self.DEEPSEEK_MODEL,
                is_local=False
            )
            
            logger.info(f"✅ DeepSeek API инициализирован (модель: {self.DEEPSEEK_MODEL})")
            
        except Exception as e:
            logger.error(f"❌ Ошибка инициализации DeepSeek API: {e}")
            self._use_deepseek = False
            self._stub_mode = True
            self.model_config = None
    
    def _load_gguf_model(self) -> None:
        """Загружает GGUF модель через llama-cpp-python."""
        try:
            from llama_cpp import Llama
            
            llm_kwargs = {
                "model_path": self.model_path,
                "n_ctx": 4096,
                "n_threads": 4,
                "verbose": False
            }
            
            # Добавляем GPU слои если доступна CUDA
            if self.quantization and 'K_M' in self.quantization:
                llm_kwargs["n_gpu_layers"] = -1  # Все слои на GPU
            
            self._model_instance = Llama(**llm_kwargs)
            
        except ImportError:
            logger.error("❌ Библиотека llama-cpp-python не установлена!")
            logger.info("💡 Установите: pip install llama-cpp-python[cuda]")
            raise
    
    def _load_onnx_model(self) -> None:
        """Загружает ONNX модель через onnxruntime."""
        try:
            import onnxruntime as ort
            
            sess_options = ort.SessionOptions()
            sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
            
            self._model_instance = ort.InferenceSession(
                self.model_path,
                sess_options,
                providers=['CUDAExecutionProvider', 'CPUExecutionProvider']
            )
            
        except ImportError:
            logger.error("❌ Библиотека onnxruntime не установлена!")
            logger.info("💡 Установите: pip install onnxruntime-gpu")
            raise
    
    def _load_pytorch_model(self) -> None:
        """Загружает PyTorch модель через transformers."""
        try:
            from transformers import AutoModelForCausalLM, AutoTokenizer
            
            model_dir = os.path.dirname(self.model_path)
            
            self._tokenizer = AutoTokenizer.from_pretrained(
                model_dir,
                trust_remote_code=True
            )
            
            self._model_instance = AutoModelForCausalLM.from_pretrained(
                model_dir,
                torch_dtype="auto",
                device_map="auto",
                trust_remote_code=True
            )
            
        except ImportError:
            logger.error("❌ Библиотека transformers не установлена!")
            logger.info("💡 Установите: pip install transformers torch")
            raise
    
    def load_local_model(self, model_path: str, format: str) -> bool:
        """
        Загружает локальную LLM для Core/Sub агента.
        
        Args:
            model_path: Путь к файлу модели.
            format: Один из SUPPORTED_FORMATS ('gguf', 'onnx', 'pytorch').
            
        Returns:
            bool: True если загрузка успешна.
            
        Example:
            >>> client = LLMClient()
            >>> success = client.load_local_model("models/llama.gguf", "gguf")
        """
        try:
            self.model_path = model_path
            self.model_format = format
            self._use_deepseek = False
            self._init_local_model()
            return True
        except Exception as e:
            logger.error(f"❌ Ошибка загрузки модели: {e}")
            return False
    
    def generate(self, prompt: str, max_tokens: int = 512, temperature: float = 0.7) -> str:
        """
        Генерирует ответ на основе промпта.
        
        Автоматически выбирает между локальной моделью и DeepSeek API.
        
        Args:
            prompt: Входной текст для генерации.
            max_tokens: Максимальное количество токенов в ответе.
            temperature: Температура генерации (0.0-2.0).
            
        Returns:
            str: Сгенерированный ответ.
            
        Raises:
            RuntimeError: Если ни одна модель не инициализирована.
            
        Example:
            >>> client = LLMClient()
            >>> response = client.generate("Привет! Как дела?")
            >>> print(response)
        """
        if getattr(self, "_stub_mode", False):
            return f"[демо-LLM] Заглушка: {prompt[:200]!r}"
        if self._use_deepseek:
            return self._generate_deepseek(prompt, max_tokens, temperature)
        elif self._model_instance:
            return self._generate_local(prompt, max_tokens, temperature)
        else:
            return f"[демо-LLM] Модель не загружена. Промпт: {prompt[:120]!r}"
    
    def _generate_local(self, prompt: str, max_tokens: int, temperature: float) -> str:
        """Генерирует ответ используя локальную модель."""
        try:
            if self.model_config.format == ModelFormat.GGUF:
                # GGUF генерация
                output = self._model_instance(
                    prompt,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    stop=["</s>", "User:", "Assistant:"]
                )
                return output['choices'][0]['text']
            
            elif self.model_config.format == ModelFormat.ONNX:
                # ONNX генерация (упрощённая)
                logger.warning("ONNX генерация требует дополнительной настройки")
                return "[ONNX ответ]"
            
            elif self.model_config.format == ModelFormat.PYTORCH:
                # PyTorch генерация
                inputs = self._tokenizer(prompt, return_tensors="pt").to(
                    self._model_instance.device
                )
                outputs = self._model_instance.generate(
                    **inputs,
                    max_new_tokens=max_tokens,
                    temperature=temperature,
                    do_sample=True,
                    pad_token_id=self._tokenizer.eos_token_id
                )
                return self._tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            else:
                raise ValueError(f"Неподдерживаемый формат: {self.model_config.format}")
                
        except Exception as e:
            logger.error(f"❌ Ошибка генерации локальной моделью: {e}")
            # Fallback на DeepSeek при ошибке
            logger.info("💡 Переключаемся на DeepSeek API...")
            self._use_deepseek = True
            return self._generate_deepseek(prompt, max_tokens, temperature)
    
    def _generate_deepseek(self, prompt: str, max_tokens: int, temperature: float) -> str:
        """
        Генерирует ответ используя DeepSeek API.
        
        Args:
            prompt: Входной промпт.
            max_tokens: Максимум токенов.
            temperature: Температура генерации.
            
        Returns:
            str: Ответ от API.
        """
        try:
            import requests
            
            headers = {
                "Authorization": f"Bearer {self.model_config.api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": self.DEEPSEEK_MODEL,
                "messages": [
                    {"role": "system", "content": "Вы полезный ассистент для управления дронами."},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": max_tokens,
                "temperature": temperature,
                "stream": False
            }
            
            response = requests.post(
                f"{self.DEEPSEEK_BASE_URL}/chat/completions",
                headers=headers,
                json=payload,
                timeout=30
            )
            
            response.raise_for_status()
            data = response.json()
            
            return data['choices'][0]['message']['content']
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Ошибка запроса к DeepSeek API: {e}")
            return f"[Ошибка API: {str(e)}]"
        except Exception as e:
            logger.error(f"❌ Неожиданная ошибка DeepSeek API: {e}")
            return f"[Ошибка генерации: {str(e)}]"
    
    def get_status(self) -> Dict[str, Any]:
        """
        Возвращает статус модели.
        
        Returns:
            Dict: Информация о текущей модели и режиме работы.
            
        Example:
            >>> client = LLMClient()
            >>> status = client.get_status()
            >>> print(status['mode'])  # 'local' или 'deepseek_api'
        """
        return {
            "agent_type": self.agent_type,
            "mode": "deepseek_api" if self._use_deepseek else "local",
            "model_path": self.model_path if not self._use_deepseek else None,
            "model_format": self.model_config.format.value if self.model_config else None,
            "is_local": self.model_config.is_local if self.model_config else False,
            "model_name": self.model_config.model_name if self.model_config and not self.model_config.is_local else None,
            "initialized": self._model_instance is not None or self._use_deepseek
        }
    
    def switch_to_deepseek(self) -> bool:
        """
        Принудительно переключает на DeepSeek API.
        
        Returns:
            bool: True если переключение успешно.
        """
        try:
            self._use_deepseek = True
            self._init_deepseek()
            logger.info("✅ Принудительное переключение на DeepSeek API")
            return True
        except Exception as e:
            logger.error(f"❌ Ошибка переключения на DeepSeek: {e}")
            return False
    
    def switch_to_local(self, model_path: str, format: str) -> bool:
        """
        Принудительно переключает на локальную модель.
        
        Args:
            model_path: Путь к модели.
            format: Формат модели.
            
        Returns:
            bool: True если переключение успешно.
        """
        try:
            self._use_deepseek = False
            success = self.load_local_model(model_path, format)
            if success:
                logger.info(f"✅ Принудительное переключение на локальную модель: {model_path}")
            return success
        except Exception as e:
            logger.error(f"❌ Ошибка переключения на локальную модель: {e}")
            self._use_deepseek = True
            return False


__all__ = ["LLMClient", "ModelFormat", "ModelConfig"]


# Функции обратной совместимости для старых импортов
def get_llm_client(agent_type: str = "core") -> LLMClient:
    """
    Возвращает экземпляр LLM клиента.
    
    Args:
        agent_type: Тип агента ('core' или 'sub').
        
    Returns:
        LLMClient: Инициализированный клиент.
    """
    return LLMClient(agent_type=agent_type)


def generate_with_fallback(prompt: str, agent_type: str = "core", **kwargs) -> str:
    """
    Генерирует ответ с автоматическим fallback.
    
    Args:
        prompt: Входной промпт.
        agent_type: Тип агента.
        **kwargs: Дополнительные параметры для generate().
        
    Returns:
        str: Сгенерированный ответ.
    """
    client = LLMClient(agent_type=agent_type)
    return client.generate(prompt, **kwargs)


__all__ = ["LLMClient", "ModelFormat", "ModelConfig", "get_llm_client", "generate_with_fallback"]
