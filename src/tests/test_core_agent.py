"""
================================================================================
Тесты Core Agent
================================================================================
"""
import pytest
import asyncio
from unittest.mock import patch, AsyncMock

from src.agents.core_agent import CoreAgent, AgentState, MissionParams
from src.agents.agent_roles import TaskType, TaskPriority, AgentRole


@pytest.fixture
def mock_config():
    """Фикстура для конфигурации"""
    return {
        'agent_id': 'test_agent',
        'simulation': {'enabled': True},
        'sub_agent': {'enabled': False},
        'pit_controllers': {'enabled': False},
        'mesh_network': {'enabled': False},
        'openq': {'enabled': False},
        'tools': []
    }


@pytest.fixture
def core_agent(mock_config):
    """Фикстура для Core Agent"""
    with patch('src.agents.core_agent.CoreAgent._load_config', return_value=mock_config):
        agent = CoreAgent()
        return agent


class TestCoreAgent:
    """Тесты Core Agent"""
    
    @pytest.mark.asyncio
    async def test_initialization(self, core_agent):
        """Тест инициализации"""
        assert core_agent.agent_id == 'test_agent'
        assert core_agent.state == AgentState.INITIALIZING
        assert core_agent.role == AgentRole.CORE
    
    @pytest.mark.asyncio
    async def test_perceive(self, core_agent):
        """Тест восприятия"""
        perception = await core_agent.perceive()
        
        assert "telemetry" in perception
        assert "timestamp" in perception
        assert perception["telemetry"]["battery"] == 100.0
    
    @pytest.mark.asyncio
    async def test_decide_hover(self, core_agent):
        """Тест принятия решения - зависание"""
        perception = {"telemetry": {"battery": 80}}
        
        decision = await core_agent.decide(perception)
        
        assert "command" in decision
        assert decision["command"] == "HOVER"
    
    @pytest.mark.asyncio
    async def test_decide_emergency_low_battery(self, core_agent):
        """Тест реакции на низкий заряд"""
        perception = {"telemetry": {"battery": 15}}
        
        decision = await core_agent.decide(perception)
        
        assert decision["command"] == "RTL"
        assert decision["priority"] == "critical"
    
    @pytest.mark.asyncio
    async def test_act(self, core_agent):
        """Тест выполнения действия"""
        decision = {"command": "HOVER", "params": {}}
        
        result = await core_agent.act(decision)
        
        assert result["success"] is True
        assert result["command"] == "HOVER"

    @pytest.mark.asyncio
    async def test_act_emergency_stop(self, core_agent):
        """EMERGENCY_STOP вызывает emergency_stop и переводит агента в EMERGENCY."""
        from src.agents.core_agent import AgentState

        mock_pit = AsyncMock()
        mock_pit.emergency_stop = AsyncMock()
        core_agent.pit_controllers = mock_pit
        core_agent.sub_agent = None

        result = await core_agent.act({"command": "EMERGENCY_STOP", "params": {}})

        mock_pit.emergency_stop.assert_called_once()
        assert result["success"] is True
        assert result["command"] == "EMERGENCY_STOP"
        assert core_agent.state == AgentState.EMERGENCY
    
    @pytest.mark.asyncio
    async def test_mission_params(self):
        """Тест параметров миссии"""
        mission = MissionParams(
            name="Test Mission",
            mission_id="test_001",
            waypoints=[{"x": 0, "y": 0, "z": 10}],
            altitude=50.0,
            speed=10.0
        )
        
        assert mission.name == "Test Mission"
        assert mission.altitude == 50.0
        
        mission_dict = mission.to_dict()
        assert mission_dict["name"] == "Test Mission"
        assert mission_dict["altitude"] == 50.0


class TestAgentRoles:
    """Тесты ролей агентов"""
    
    def test_core_capabilities(self):
        """Тест возможностей Core Agent"""
        from src.agents.agent_roles import CORE_CAPABILITIES
        
        assert CORE_CAPABILITIES.role == AgentRole.CORE
        assert CORE_CAPABILITIES.can_fly is True
        assert CORE_CAPABILITIES.can_decide is True
    
    def test_sub_capabilities(self):
        """Тест возможностей Sub-Agent"""
        from src.agents.agent_roles import SUB_CAPABILITIES
        
        assert SUB_CAPABILITIES.role == AgentRole.SUB
        assert SUB_CAPABILITIES.can_fly is False
        assert SUB_CAPABILITIES.can_decide is False


class TestTaskDistributor:
    """Тесты распределителя задач"""
    
    def test_create_task(self):
        """Тест создания задачи"""
        from src.agents.agent_roles import TaskDistributor
        
        distributor = TaskDistributor()
        task = distributor.create_task(
            task_type=TaskType.DATA_ANALYSIS,
            data={"test": "data"},
            priority=TaskPriority.HIGH
        )
        
        assert task.task_type == TaskType.DATA_ANALYSIS
        assert task.priority == TaskPriority.HIGH
        assert task.assigned_to == AgentRole.SUB
    
    def test_get_next_task_for_core(self):
        """Тест получения задачи для Core"""
        from src.agents.agent_roles import TaskDistributor
        
        distributor = TaskDistributor()
        distributor.create_task(TaskType.FLIGHT_CONTROL, {})
        
        task = distributor.get_next_task(AgentRole.CORE)
        
        assert task is not None
        assert task.task_type == TaskType.FLIGHT_CONTROL
    
    def test_complete_task(self):
        """Тест завершения задачи"""
        from src.agents.agent_roles import TaskDistributor
        
        distributor = TaskDistributor()
        task = distributor.create_task(TaskType.LOGGING, {})
        
        result = distributor.complete_task(task.task_id, {"result": "ok"})
        
        assert result is True
        assert task.status == "completed"
