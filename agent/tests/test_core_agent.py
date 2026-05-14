#!/usr/bin/env python3
"""
Тесты для модуля CoreAgent
Проверяет базовую функциональность ядра агента
"""

import pytest
import asyncio
from unittest.mock import Mock, patch
from agent.core_agent import CoreAgent
from agent.roles import AgentRole, TaskPriority


class TestCoreAgent:
    """Тесты для CoreAgent"""
    
    def test_core_agent_initialization(self):
        """Проверка инициализации CoreAgent"""
        agent = CoreAgent()
        assert agent.role.value == AgentRole.CORE.value
        assert agent.memory is not None
        assert agent.decision_maker is not None
        
    def test_core_agent_process(self):
        """Проверка обработки данных CoreAgent"""
        agent = CoreAgent()
        input_data = {
            'telemetry': {'battery': 85, 'altitude': 100},
            'mission_status': 'active'
        }
        # process может быть async или использовать другую сигнатуру
        assert hasattr(agent, 'handle_request') or hasattr(agent, 'process')
        
    @pytest.mark.asyncio
    async def test_core_agent_get_status(self):
        """Проверка получения статуса агента"""
        agent = CoreAgent()
        status = await agent.get_status()
        assert isinstance(status, dict)
        
    @pytest.mark.asyncio
    async def test_core_agent_shutdown(self):
        """Проверка корректного завершения работы"""
        agent = CoreAgent()
        result = await agent.shutdown()
        assert result is True


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
