"""
Минимальные тесты LLM-клиента (актуальный API v4.1.x).
"""

import os

import pytest

from agent.llm_client import LLMClient, ModelConfig, ModelFormat


def test_model_config_dataclass():
    """Базовая конфигурация модели."""
    cfg = ModelConfig(format=ModelFormat.DEEPSEEK_API, model_name="deepseek-chat", is_local=False)
    assert cfg.model_name == "deepseek-chat"
    assert cfg.format == ModelFormat.DEEPSEEK_API


def test_llm_client_core_type():
    """Инициализация клиента для core-агента."""
    c = LLMClient(agent_type="core")
    assert c.agent_type == "core"


def test_llm_client_sub_type():
    """Инициализация клиента для sub-агента."""
    c = LLMClient(agent_type="sub")
    assert c.agent_type == "sub"


def test_llm_client_stub_generate():
    """Без ключа и локальной модели generate возвращает демо-строку."""
    c = LLMClient(agent_type="core")
    out = c.generate("hello")
    assert "[демо-LLM]" in out or "hello" in out


@pytest.mark.skipif(
    not os.getenv("DEEPSEEK_API_KEY"),
    reason="Нет DEEPSEEK_API_KEY — пропуск сетевого вызова generate",
)
def test_generate_stub_or_network():
    """При отсутствии локальной модели generate не должен падать с синтаксической ошибкой."""
    c = LLMClient(agent_type="core")
    out = c.generate("ping", max_tokens=8, temperature=0.1)
    assert isinstance(out, str)
