"""
COBA AI Drone Agent - Локальный клиент LLM
Предоставляет интерфейс к локальной LLM через Ollama API с резервным копированием облачных API
"""

import asyncio
import json
import logging
import sqlite3
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logger = logging.getLogger(__name__)

@dataclass
class LLMConfig:
    """Конфигурация для клиента LLM"""
    model_name: str = "deepseek-coder"
    endpoint_url: str = "http://localhost:11434"
    timeout: int = 30
    max_retries: int = 3
    temperature: float = 0.7
    max_tokens: int = 2048

@dataclass
class LLMResponse:
    """Ответ от LLM"""
    text: str
    model: str
    usage: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class LLMClient:
    """Клиент для взаимодействия с локальной LLM через Ollama"""

    def __init__(self, config: Optional[LLMConfig] = None, db_path: str = "data/memory/knowledge_base.db"):
        self.config = config or LLMConfig()
        self.db_path = db_path
        self.session = self._create_session()

    def _create_session(self) -> requests.Session:
        """Создать HTTP сеанс со стратегией повтора"""
        session = requests.Session()
        retry = Retry(
            total=self.config.max_retries,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
        )
        adapter = HTTPAdapter(max_retries=retry)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        return session

    async def health_check(self) -> bool:
        """Проверить если LLM сервис доступен"""
        try:
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.session.get(
                    f"{self.config.endpoint_url}/api/tags",
                    timeout=5
                )
            )

            if response.status_code == 200:
                data = response.json()
                models = [model['name'] for model in data.get('models', [])]
                if self.config.model_name in models:
                    logger.info(f"LLM health check passed. Available models: {models}")
                    return True
                else:
                    logger.warning(f"Model {self.config.model_name} not available. Available: {models}")
                    return False

            logger.error(f"LLM health check failed with status {response.status_code}")
            return False

        except Exception as e:
            logger.error(f"LLM health check error: {e}")
            return False

    async def generate(self, prompt: str, context: Optional[Dict[str, Any]] = None) -> LLMResponse:
        """Generate response from LLM"""
        try:
            # Prepare request payload
            payload = {
                "model": self.config.model_name,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": self.config.temperature,
                    "num_predict": self.config.max_tokens,
                }
            }

            # Add context if provided
            if context:
                system_prompt = context.get('system_prompt', '')
                if system_prompt:
                    payload['system'] = system_prompt

            logger.debug(f"Sending request to LLM: {payload}")

            # Make request
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.session.post(
                    f"{self.config.endpoint_url}/api/generate",
                    json=payload,
                    timeout=self.config.timeout
                )
            )

            if response.status_code == 200:
                data = response.json()
                text = data.get('response', '').strip()

                usage = {
                    'eval_count': data.get('eval_count'),
                    'eval_duration': data.get('eval_duration'),
                    'total_duration': data.get('total_duration'),
                }

                logger.info(f"LLM response generated successfully ({len(text)} chars)")
                return LLMResponse(
                    text=text,
                    model=self.config.model_name,
                    usage=usage
                )
            else:
                error_msg = f"LLM API error: {response.status_code} - {response.text}"
                logger.error(error_msg)
                return LLMResponse(
                    text="",
                    model=self.config.model_name,
                    error=error_msg
                )

        except Exception as e:
            error_msg = f"LLM generation error: {str(e)}"
            logger.error(error_msg)
            return LLMResponse(
                text="",
                model=self.config.model_name,
                error=error_msg
            )

    def update_model_status(self, status: str):
        """Update model status in database"""
        try:
            conn = sqlite3.connect(self.db_path)
            conn.execute(
                "UPDATE llm_models SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE name = ?",
                (status, self.config.model_name)
            )
            conn.commit()
            conn.close()
            logger.info(f"Updated model {self.config.model_name} status to {status}")
        except Exception as e:
            logger.error(f"Failed to update model status: {e}")

    async def get_available_models(self) -> List[str]:
        """Get list of available models from Ollama"""
        try:
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.session.get(f"{self.config.endpoint_url}/api/tags", timeout=5)
            )

            if response.status_code == 200:
                data = response.json()
                return [model['name'] for model in data.get('models', [])]
            return []
        except Exception as e:
            logger.error(f"Failed to get available models: {e}")
            return []

# Global client instance
_llm_client = None

def get_llm_client() -> LLMClient:
    """Get or create global LLM client instance"""
    global _llm_client
    if _llm_client is None:
        _llm_client = LLMClient()
    return _llm_client

async def generate_with_fallback(prompt: str, context: Optional[Dict[str, Any]] = None) -> LLMResponse:
    """
    Generate response with fallback to cloud APIs if local LLM fails
    """
    client = get_llm_client()

    # Try local LLM first
    if await client.health_check():
        response = await client.generate(prompt, context)
        if not response.error:
            return response

    # Fallback to cloud APIs (implement based on available keys)
    logger.warning("Local LLM failed, attempting cloud fallback...")

    # TODO: Implement cloud API fallbacks (OpenAI, DeepSeek)
    # For now, return error
    return LLMResponse(
        text="",
        model="fallback",
        error="Local LLM unavailable and no cloud fallback configured"
    )