"""
Unit tests for LLM client
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from agent.llm_client import LLMClient, LLMConfig, LLMResponse


class TestLLMClient:
    """Test LLM client functionality"""

    @pytest.fixture
    def config(self):
        return LLMConfig(
            model_name="test-model",
            endpoint_url="http://localhost:11434",
            timeout=5
        )

    @pytest.fixture
    def client(self, config):
        return LLMClient(config)

    @pytest.mark.asyncio
    async def test_initialization(self, client):
        """Test client initialization"""
        assert client.config.model_name == "test-model"
        assert client.config.endpoint_url == "http://localhost:11434"

    @pytest.mark.asyncio
    async def test_health_check_success(self, client):
        """Test successful health check"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"models": [{"name": "test-model"}]}

        with patch.object(client.session, 'get', return_value=mock_response):
            result = await client.health_check()
            assert result is True

    @pytest.mark.asyncio
    async def test_health_check_model_not_available(self, client):
        """Test health check when model is not available"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"models": [{"name": "other-model"}]}

        with patch.object(client.session, 'get', return_value=mock_response):
            result = await client.health_check()
            assert result is False

    @pytest.mark.asyncio
    async def test_health_check_failure(self, client):
        """Test health check failure"""
        with patch.object(client.session, 'get', side_effect=Exception("Connection failed")):
            result = await client.health_check()
            assert result is False

    @pytest.mark.asyncio
    async def test_generate_success(self, client):
        """Test successful generation"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "response": "Test response",
            "eval_count": 100,
            "eval_duration": 5000000,
            "total_duration": 6000000
        }

        with patch.object(client.session, 'post', return_value=mock_response):
            response = await client.generate("Test prompt")

            assert isinstance(response, LLMResponse)
            assert response.text == "Test response"
            assert response.model == "test-model"
            assert response.usage["eval_count"] == 100
            assert response.error is None

    @pytest.mark.asyncio
    async def test_generate_with_context(self, client):
        """Test generation with context"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"response": "Contextual response"}

        context = {"system_prompt": "You are a helpful assistant"}

        with patch.object(client.session, 'post', return_value=mock_response) as mock_post:
            response = await client.generate("Test prompt", context)

            # Check that context was included in request
            call_args = mock_post.call_args
            request_data = call_args[1]['json']
            assert request_data['system'] == "You are a helpful assistant"

    @pytest.mark.asyncio
    async def test_generate_failure(self, client):
        """Test generation failure"""
        with patch.object(client.session, 'post', side_effect=Exception("API error")):
            response = await client.generate("Test prompt")

            assert isinstance(response, LLMResponse)
            assert response.text == ""
            assert response.error == "LLM generation error: API error"

    @pytest.mark.asyncio
    async def test_generate_timeout(self, client):
        """Test generation timeout"""
        client.config.timeout = 0.001  # Very short timeout

        with patch.object(client.session, 'post', side_effect=asyncio.TimeoutError()):
            response = await client.generate("Test prompt")

            assert isinstance(response, LLMResponse)
            assert "timeout" in response.error.lower()

    def test_update_model_status(self, client):
        """Test updating model status in database"""
        with patch('sqlite3.connect') as mock_connect:
            mock_conn = Mock()
            mock_connect.return_value = mock_conn

            client.update_model_status("active")

            mock_connect.assert_called_once()
            mock_conn.execute.assert_called_once()
            mock_conn.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_available_models(self, client):
        """Test getting available models"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "models": [
                {"name": "model1"},
                {"name": "model2"}
            ]
        }

        with patch.object(client.session, 'get', return_value=mock_response):
            models = await client.get_available_models()
            assert models == ["model1", "model2"]


class TestLLMResponse:
    """Test LLM response dataclass"""

    def test_response_creation(self):
        """Test creating LLM response"""
        response = LLMResponse(
            text="Test text",
            model="test-model",
            usage={"tokens": 100}
        )

        assert response.text == "Test text"
        assert response.model == "test-model"
        assert response.usage == {"tokens": 100}
        assert response.error is None

    def test_response_with_error(self):
        """Test response with error"""
        response = LLMResponse(
            text="",
            model="test-model",
            error="Test error"
        )

        assert response.text == ""
        assert response.error == "Test error"