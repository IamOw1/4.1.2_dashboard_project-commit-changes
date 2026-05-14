"""
COBA AI Drone Agent v4.1 - Основной модуль агента
Обновлённая структура с разделением на core_agent и sub_agent
"""
from .core_agent import CoreAgent
from .memory import ShortTermMemory, LongTermMemory
from .decision_maker import DecisionMaker
from .learner import Learner
from .sub_agent import SubAgent
from .llm_client import LLMClient, ModelConfig as LLMConfig
from .roles import AgentRole, TaskPriority, TaskDistributor

__all__ = [
    'CoreAgent',
    'SubAgent',
    'ShortTermMemory',
    'LongTermMemory',
    'DecisionMaker',
    'Learner',
    'LLMClient',
    'LLMConfig',
    'AgentRole',
    'TaskPriority',
    'TaskDistributor',
]
