"""
================================================================================
Модуль агентов для COBA AI Drone Agent v4.1
Интеграция с agent/ модулем - реальные агенты вместо заглушек
================================================================================
"""

# Импорт из основного модуля agent/
import sys
from pathlib import Path

# Добавляем корень проекта в path для импорта agent
project_root = Path(__file__).parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from agent.core_agent import CoreAgent
from agent.sub_agent import SubAgent
from agent.llm_client import LLMClient, ModelConfig as LLMConfig
from agent.memory import ShortTermMemory, LongTermMemory
from agent.decision_maker import DecisionMaker
from agent.learner import Learner
from agent.roles import AgentRole, TaskPriority, TaskDistributor

__all__ = [
    "CoreAgent",
    "SubAgent",
    "LLMClient",
    "LLMConfig",
    "ShortTermMemory",
    "LongTermMemory",
    "DecisionMaker",
    "Learner",
    "AgentRole",
    "TaskPriority",
    "TaskDistributor",
]
