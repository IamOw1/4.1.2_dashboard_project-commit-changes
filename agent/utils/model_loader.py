"""
Загрузчик моделей для локальных LLM (GGUF/ONNX/PyTorch)
"""
import logging
from pathlib import Path
from typing import Dict, Any, Optional
from enum import Enum

logger = logging.getLogger(__name__)


class ModelFormat(Enum):
    """Поддерживаемые форматы моделей"""
    GGUF = "gguf"
    ONNX = "onnx"
    PYTORCH = "pytorch"
    UNKNOWN = "unknown"


class ModelLoader:
    """
    Загрузчик моделей для локальных LLM.
    
    Поддерживает форматы:
    - GGUF: для llama.cpp (CPU/GPU)
    - ONNX: для ONNX Runtime (GPU NVIDIA)
    - PyTorch: для transformers (CPU/GPU)
    """
    
    SUPPORTED_FORMATS = {
        ModelFormat.GGUF: ['Q4_K_M', 'Q5_K_S', 'Q8_0'],
        ModelFormat.ONNX: ['float32', 'float16'],
        ModelFormat.PYTORCH: ['pt', 'bin', 'safetensors']
    }
    
    def __init__(self):
        self.loaded_models: Dict[str, Any] = {}
        
    def detect_format(self, model_path: str) -> ModelFormat:
        """
        Определяет формат модели по расширению файла.
        
        Args:
            model_path: Путь к файлу модели
            
        Returns:
            ModelFormat: Определённый формат модели
        """
        path = Path(model_path)
        suffix = path.suffix.lower()
        
        if suffix == '.gguf':
            return ModelFormat.GGUF
        elif suffix == '.onnx':
            return ModelFormat.ONNX
        elif suffix in ['.pt', '.bin', '.safetensors']:
            return ModelFormat.PYTORCH
        else:
            return ModelFormat.UNKNOWN
    
    def validate_model_path(self, model_path: str) -> bool:
        """
        Проверяет существование файла модели.
        
        Args:
            model_path: Путь к файлу модели
            
        Returns:
            bool: True если файл существует
        """
        path = Path(model_path)
        if not path.exists():
            logger.error(f"Файл модели не найден: {model_path}")
            return False
        
        if not path.is_file():
            logger.error(f"Путь не является файлом: {model_path}")
            return False
            
        return True
    
    def load_gguf_model(self, model_path: str, quantization: str = 'Q4_K_M') -> Optional[Any]:
        """
        Загружает модель в формате GGUF через llama-cpp-python.
        
        Args:
            model_path: Путь к файлу .gguf
            quantization: Тип квантования (Q4_K_M, Q5_K_S, Q8_0)
            
        Returns:
            LlamaCpp instance или None при ошибке
        """
        try:
            from llama_cpp import Llama
            
            logger.info(f"Загрузка GGUF модели: {model_path} (quantization: {quantization})")
            
            # Проверка наличия GPU
            n_gpu_layers = -1  # Все слои на GPU если доступен
            try:
                import torch
                if torch.cuda.is_available():
                    logger.info("CUDA обнаружен, используем GPU-ускорение")
            except ImportError:
                n_gpu_layers = 0
                logger.warning("torch не установлен, используем CPU")
            
            llm = Llama(
                model_path=model_path,
                n_ctx=4096,
                n_batch=512,
                n_gpu_layers=n_gpu_layers,
                verbose=False
            )
            
            self.loaded_models[model_path] = llm
            logger.info(f"✅ Модель GGUF успешно загружена: {model_path}")
            return llm
            
        except ImportError:
            logger.error("llama-cpp-python не установлен. Установите: pip install llama-cpp-python[cuda]")
            return None
        except Exception as e:
            logger.error(f"Ошибка загрузки GGUF модели: {e}")
            return None
    
    def load_onnx_model(self, model_path: str) -> Optional[Any]:
        """
        Загружает модель в формате ONNX через onnxruntime.
        
        Args:
            model_path: Путь к файлу .onnx
            
        Returns:
            InferenceSession или None при ошибке
        """
        try:
            import onnxruntime as ort
            
            logger.info(f"Загрузка ONNX модели: {model_path}")
            
            # Проверка доступных провайдеров
            providers = ['CUDAExecutionProvider', 'CPUExecutionProvider']
            session = ort.InferenceSession(model_path, providers=providers)
            
            self.loaded_models[model_path] = session
            logger.info(f"✅ Модель ONNX успешно загружена: {model_path}")
            return session
            
        except ImportError:
            logger.error("onnxruntime не установлен. Установите: pip install onnxruntime-gpu")
            return None
        except Exception as e:
            logger.error(f"Ошибка загрузки ONNX модели: {e}")
            return None
    
    def load_pytorch_model(self, model_path: str, model_name: str = None) -> Optional[Any]:
        """
        Загружает модель PyTorch через transformers.
        
        Args:
            model_path: Путь к файлу модели или название модели в HuggingFace
            model_name: Название модели (если model_path - это директория)
            
        Returns:
            Pipeline или None при ошибке
        """
        try:
            from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
            
            logger.info(f"Загрузка PyTorch модели: {model_path}")
            
            tokenizer = AutoTokenizer.from_pretrained(model_path)
            model = AutoModelForCausalLM.from_pretrained(model_path)
            
            pipe = pipeline(
                "text-generation",
                model=model,
                tokenizer=tokenizer,
                max_new_tokens=512
            )
            
            self.loaded_models[model_path] = pipe
            logger.info(f"✅ Модель PyTorch успешно загружена: {model_path}")
            return pipe
            
        except ImportError:
            logger.error("transformers не установлен. Установите: pip install transformers[torch]")
            return None
        except Exception as e:
            logger.error(f"Ошибка загрузки PyTorch модели: {e}")
            return None
    
    def load_model(self, model_path: str, format: str = None, **kwargs) -> Optional[Any]:
        """
        Универсальный метод загрузки модели с автоопределением формата.
        
        Args:
            model_path: Путь к файлу модели
            format: Формат модели (gguf/onnx/pytorch), если None - автоопределение
            **kwargs: Дополнительные параметры для загрузчика
            
        Returns:
            Загруженная модель или None при ошибке
        """
        if not self.validate_model_path(model_path):
            return None
        
        if format is None:
            detected_format = self.detect_format(model_path)
            if detected_format == ModelFormat.UNKNOWN:
                logger.error(f"Неизвестный формат модели: {model_path}")
                return None
        else:
            try:
                detected_format = ModelFormat(format.lower())
            except ValueError:
                logger.error(f"Неподдерживаемый формат: {format}")
                return None
        
        logger.info(f"Загрузка модели формата {detected_format.value}: {model_path}")
        
        if detected_format == ModelFormat.GGUF:
            quantization = kwargs.get('quantization', 'Q4_K_M')
            return self.load_gguf_model(model_path, quantization)
        elif detected_format == ModelFormat.ONNX:
            return self.load_onnx_model(model_path)
        elif detected_format == ModelFormat.PYTORCH:
            return self.load_pytorch_model(model_path)
        else:
            logger.error(f"Формат {detected_format.value} не поддерживается")
            return None
    
    def unload_model(self, model_path: str) -> bool:
        """
        Выгружает модель из памяти.
        
        Args:
            model_path: Путь к загруженной модели
            
        Returns:
            bool: True если модель была выгружена
        """
        if model_path in self.loaded_models:
            del self.loaded_models[model_path]
            logger.info(f"Модель выгружена: {model_path}")
            return True
        return False
    
    def get_loaded_models(self) -> Dict[str, Any]:
        """Возвращает словарь загруженных моделей."""
        return self.loaded_models.copy()
    
    def check_dependencies(self) -> Dict[str, bool]:
        """
        Проверяет наличие необходимых зависимостей для каждого формата.
        
        Returns:
            Dict[str, bool]: Статус доступности каждой зависимости
        """
        deps = {
            'llama_cpp': False,
            'onnxruntime': False,
            'transformers': False,
            'torch_cuda': False
        }
        
        try:
            from llama_cpp import Llama
            deps['llama_cpp'] = True
        except ImportError:
            pass
        
        try:
            import onnxruntime
            deps['onnxruntime'] = True
        except ImportError:
            pass
        
        try:
            from transformers import pipeline
            deps['transformers'] = True
        except ImportError:
            pass
        
        try:
            import torch
            deps['torch_cuda'] = torch.cuda.is_available()
        except ImportError:
            pass
        
        return deps


# Глобальный экземпляр загрузчика
_model_loader = None

def get_model_loader() -> ModelLoader:
    """Получает или создаёт глобальный экземпляр ModelLoader."""
    global _model_loader
    if _model_loader is None:
        _model_loader = ModelLoader()
    return _model_loader
