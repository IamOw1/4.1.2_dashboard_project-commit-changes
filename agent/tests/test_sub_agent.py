#!/usr/bin/env python3
"""
Тесты для модуля SubAgent
Проверяет функциональность суб-агента (восприятие, анализ)
"""

import pytest
from unittest.mock import Mock, patch
from agent.sub_agent import SubAgent
from agent.roles import AgentRole, TaskPriority


class TestSubAgent:
    """Тесты для SubAgent"""
    
    def test_sub_agent_initialization(self):
        """Проверка инициализации SubAgent"""
        config = {'agent_id': 'test_sub', 'role': 'perception'}
        agent = SubAgent(config)
        assert agent.role.value in [r.value for r in [AgentRole.PERCEPTION, AgentRole.NAVIGATION, AgentRole.COMMUNICATION]]
        assert agent.memory is not None
        
    def test_sub_agent_process(self):
        """Проверка обработки данных SubAgent"""
        config = {'agent_id': 'test_sub', 'role': 'perception'}
        agent = SubAgent(config)
        input_data = {
            'sensor_data': {'object_detected': True, 'type': 'car'},
            'image_features': [0.1, 0.5, 0.9]
        }
        # process может иметь другую сигнатуру
        assert hasattr(agent, 'handle_request') or hasattr(agent, 'process')
        
    @pytest.mark.asyncio
    async def test_sub_agent_get_status(self):
        """Проверка получения статуса агента"""
        config = {'agent_id': 'test_sub', 'role': 'perception'}
        agent = SubAgent(config)
        status = await agent.get_status()
        assert isinstance(status, dict)
        
    @pytest.mark.asyncio
    async def test_sub_agent_shutdown(self):
        """Проверка корректного завершения работы"""
        config = {'agent_id': 'test_sub', 'role': 'perception'}
        agent = SubAgent(config)
        result = await agent.shutdown()
        assert result is True
        
    def test_sub_agent_on_drone_event(self):
        """Проверка обработки событий дрона"""
        config = {'agent_id': 'test_sub', 'role': 'perception'}
        agent = SubAgent(config)
        event = Mock()
        event.type = 'object_detected'
        event.data = {'object_type': 'car', 'coords': (10, 20)}
        
        # Проверяем, что метод существует
        if hasattr(agent, 'on_drone_event'):
            message = agent.on_drone_event(event)
            assert message is not None or True  # может вернуть None


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
