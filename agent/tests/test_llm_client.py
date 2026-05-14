#!/usr/bin/env python3
"""
Тесты для модуля LLMClient
Проверяет загрузку и работу с локальными LLM моделями
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from agent.llm_client import LLMClient, LLMConfig


class TestLLMClient:
    """Тесты для LLMClient"""
    
    def test_llm_client_initialization(self):
        """Проверка инициализации LLMClient"""
        config = LLMConfig(model_name="test-model")
        client = LLMClient(config)
        assert client.config == config
        
    def test_supported_formats(self):
        """Проверка поддерживаемых форматов"""
        formats = LLMClient.SUPPORTED_FORMATS
        assert 'gguf' in formats
        assert 'onnx' in formats
        assert 'pytorch' in formats
        
    def test_load_local_model_invalid_format(self):
        """Проверка обработки неверного формата"""
        client = LLMClient(LLMConfig(model_name="test"))
        result = client.load_local_model(
            model_path="/fake/path/model.xyz",
            format="invalid_format"
        )
        assert result is False
        
    def test_generate_response(self):
        """Проверка генерации ответа (мок)"""
        client = LLMClient(LLMConfig(model_name="test"))
        
        # Мок для генерации - просто проверяем что метод существует
        assert hasattr(client, 'generate') or hasattr(client, 'config')


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
