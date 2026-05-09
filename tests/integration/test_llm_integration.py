"""
Integration tests for LLM functionality
"""

import pytest
import asyncio
from unittest.mock import patch, Mock
from agent.llm_client import generate_with_fallback, LLMClient, LLMConfig


@pytest.mark.integration
class TestLLMIntegration:
    """Integration tests for LLM functionality"""

    @pytest.mark.asyncio
    async def test_generate_with_fallback_success(self):
        """Test successful generation with fallback"""
        # Mock successful local LLM
        mock_response = Mock()
        mock_response.text = "Local response"
        mock_response.error = None

        with patch('agent.llm_client.LLMClient') as mock_client_class:
            mock_client = Mock()
            mock_client.health_check.return_value = True
            mock_client.generate.return_value = mock_response
            mock_client_class.return_value = mock_client

            result = await generate_with_fallback("Test prompt")

            assert result.text == "Local response"
            assert result.error is None
            mock_client.health_check.assert_called_once()
            mock_client.generate.assert_called_once_with("Test prompt", None)

    @pytest.mark.asyncio
    async def test_generate_with_fallback_local_failure_cloud_success(self):
        """Test fallback to cloud when local LLM fails"""
        # Mock local LLM failure, cloud success
        with patch('agent.llm_client.LLMClient') as mock_client_class, \
             patch('agent.llm_client.AsyncOpenAI') as mock_openai_class:

            # Local LLM fails
            mock_client = Mock()
            mock_client.health_check.return_value = False
            mock_client_class.return_value = mock_client

            # Cloud API succeeds
            mock_openai = Mock()
            mock_response = Mock()
            mock_response.choices = [Mock()]
            mock_response.choices[0].message.content = "Cloud response"
            mock_openai.chat.completions.create.return_value = mock_response
            mock_openai_class.return_value = mock_openai

            # Mock the fallback logic
            with patch('builtins.__import__') as mock_import:
                mock_import.return_value = Mock(AsyncOpenAI=mock_openai_class)

                result = await generate_with_fallback("Test prompt")

                # Should return cloud response
                assert "Cloud response" in str(result)

    @pytest.mark.asyncio
    async def test_generate_with_fallback_all_fail(self):
        """Test when both local and cloud LLMs fail"""
        with patch('agent.llm_client.LLMClient') as mock_client_class:
            # Local LLM fails
            mock_client = Mock()
            mock_client.health_check.return_value = False
            mock_client_class.return_value = mock_client

            result = await generate_with_fallback("Test prompt")

            assert "No cloud fallback configured" in result.error

    @pytest.mark.asyncio
    async def test_llm_client_full_integration(self):
        """Test full LLM client integration with mocked HTTP"""
        config = LLMConfig(
            model_name="test-model",
            endpoint_url="http://localhost:11434"
        )
        client = LLMClient(config)

        # Mock successful HTTP responses
        mock_tags_response = Mock()
        mock_tags_response.status_code = 200
        mock_tags_response.json.return_value = {"models": [{"name": "test-model"}]}

        mock_generate_response = Mock()
        mock_generate_response.status_code = 200
        mock_generate_response.json.return_value = {
            "response": "Test generated response",
            "eval_count": 50,
            "eval_duration": 1000000,
            "total_duration": 1200000
        }

        with patch.object(client.session, 'get', return_value=mock_tags_response), \
             patch.object(client.session, 'post', return_value=mock_generate_response):

            # Test health check
            health = await client.health_check()
            assert health is True

            # Test generation
            response = await client.generate("Test prompt")
            assert response.text == "Test generated response"
            assert response.model == "test-model"
            assert response.usage["eval_count"] == 50
            assert response.error is None

    @pytest.mark.asyncio
    async def test_llm_client_error_handling(self):
        """Test LLM client error handling"""
        config = LLMConfig(timeout=0.001)  # Very short timeout
        client = LLMClient(config)

        # Mock timeout
        with patch.object(client.session, 'post', side_effect=asyncio.TimeoutError()):
            response = await client.generate("Test prompt")

            assert response.text == ""
            assert "timeout" in response.error.lower()

    @pytest.mark.asyncio
    async def test_llm_client_http_error(self):
        """Test LLM client HTTP error handling"""
        client = LLMClient()

        mock_response = Mock()
        mock_response.status_code = 500
        mock_response.text = "Internal Server Error"

        with patch.object(client.session, 'post', return_value=mock_response):
            response = await client.generate("Test prompt")

            assert response.text == ""
            assert "500" in response.error