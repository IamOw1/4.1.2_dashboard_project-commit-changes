"""
================================================================================
Ролевое распределение задач между Core Agent и Sub-Agent
================================================================================
"""
from enum import Enum, auto
from dataclasses import dataclass
from typing import Dict, List, Any, Optional
from datetime import datetime


class AgentRole(Enum):
    """Роли агентов в системе"""
    CORE = "core"           # Главный агент - принимает решения
    SUB = "sub"             # Субагент - анализирует, помогает
    HYBRID = "hybrid"       # Совместная работа


class TaskPriority(Enum):
    """Приоритеты задач"""
    CRITICAL = 0    # Критический - немедленное выполнение
    HIGH = 1        # Высокий - в течение 1 секунды
    MEDIUM = 2      # Средний - в течение 5 секунд
    LOW = 3         # Низкий - в течение 30 секунд
    BACKGROUND = 4  # Фоновый - когда есть время


class TaskType(Enum):
    """Типы задач"""
    # Core Agent задачи
    FLIGHT_CONTROL = "flight_control"
    EMERGENCY_RESPONSE = "emergency_response"
    MISSION_EXECUTION = "mission_execution"
    DECISION_MAKING = "decision_making"
    
    # Sub-Agent задачи
    DATA_ANALYSIS = "data_analysis"
    LOGGING = "logging"
    MAPPING = "mapping"
    CALCULATION = "calculation"
    ROUTE_OPTIMIZATION = "route_optimization"
    PREDICTION = "prediction"
    
    # Совместные задачи
    PERCEPTION = "perception"
    NAVIGATION = "navigation"
    VISUAL_ANALYSIS = "visual_analysis"


@dataclass
class Task:
    """Задача для агента"""
    task_id: str
    task_type: TaskType
    priority: TaskPriority
    data: Dict[str, Any]
    assigned_to: AgentRole
    created_at: datetime
    deadline: Optional[datetime] = None
    dependencies: List[str] = None
    result: Any = None
    status: str = "pending"  # pending, in_progress, completed, failed
    
    def __post_init__(self):
        if self.dependencies is None:
            self.dependencies = []


@dataclass
class AgentCapabilities:
    """Возможности агента"""
    role: AgentRole
    can_fly: bool
    can_analyze: bool
    can_log: bool
    can_map: bool
    can_calculate: bool
    can_decide: bool
    can_emergency: bool
    
    # Доступ к инструментам
    available_tools: List[str]


# Определение возможностей по ролям
CORE_CAPABILITIES = AgentCapabilities(
    role=AgentRole.CORE,
    can_fly=True,
    can_analyze=True,  # Core тоже может анализировать
    can_log=True,
    can_map=True,
    can_calculate=True,
    can_decide=True,
    can_emergency=True,
    available_tools=["all"]  # Доступ ко всем инструментам
)

SUB_CAPABILITIES = AgentCapabilities(
    role=AgentRole.SUB,
    can_fly=False,  # Sub не управляет полетом напрямую
    can_analyze=True,
    can_log=True,
    can_map=True,
    can_calculate=True,
    can_decide=False,  # Рекомендует, но не решает
    can_emergency=False,  # Предупреждает, но не действует
    available_tools=["analysis", "mapping", "logging", "calculation"]
)


class TaskDistributor:
    """Распределитель задач между агентами"""
    
    def __init__(self):
        self.task_queue: List[Task] = []
        self.completed_tasks: List[Task] = []
        self.task_handlers = {
            # Core Agent задачи
            TaskType.FLIGHT_CONTROL: AgentRole.CORE,
            TaskType.EMERGENCY_RESPONSE: AgentRole.CORE,
            TaskType.MISSION_EXECUTION: AgentRole.CORE,
            TaskType.DECISION_MAKING: AgentRole.CORE,
            
            # Sub-Agent задачи
            TaskType.DATA_ANALYSIS: AgentRole.SUB,
            TaskType.LOGGING: AgentRole.SUB,
            TaskType.MAPPING: AgentRole.SUB,
            TaskType.CALCULATION: AgentRole.SUB,
            TaskType.ROUTE_OPTIMIZATION: AgentRole.SUB,
            TaskType.PREDICTION: AgentRole.SUB,
            
            # Совместные задачи - оба агента
            TaskType.PERCEPTION: AgentRole.HYBRID,
            TaskType.NAVIGATION: AgentRole.HYBRID,
            TaskType.VISUAL_ANALYSIS: AgentRole.HYBRID,
        }
    
    def create_task(
        self,
        task_type: TaskType,
        data: Dict[str, Any],
        priority: TaskPriority = TaskPriority.MEDIUM,
        assigned_to: AgentRole = None
    ) -> Task:
        """Создание новой задачи"""
        import uuid
        
        if assigned_to is None:
            assigned_to = self.task_handlers.get(task_type, AgentRole.CORE)
        
        task = Task(
            task_id=str(uuid.uuid4()),
            task_type=task_type,
            priority=priority,
            data=data,
            assigned_to=assigned_to,
            created_at=datetime.now()
        )
        
        self.task_queue.append(task)
        self._sort_queue()
        
        return task
    
    def _sort_queue(self):
        """Сортировка очереди по приоритету"""
        self.task_queue.sort(key=lambda t: t.priority.value)
    
    def get_next_task(self, agent_role: AgentRole) -> Optional[Task]:
        """Получение следующей задачи для агента"""
        for task in self.task_queue:
            if task.status == "pending":
                # Core может взять любую задачу
                if agent_role == AgentRole.CORE:
                    task.status = "in_progress"
                    return task
                # Sub берет только свои или гибридные
                elif agent_role == AgentRole.SUB and task.assigned_to in [AgentRole.SUB, AgentRole.HYBRID]:
                    task.status = "in_progress"
                    return task
        return None
    
    def complete_task(self, task_id: str, result: Any):
        """Завершение задачи"""
        for task in self.task_queue:
            if task.task_id == task_id:
                task.status = "completed"
                task.result = result
                self.task_queue.remove(task)
                self.completed_tasks.append(task)
                return True
        return False
    
    def get_task_status(self, task_id: str) -> Optional[str]:
        """Получение статуса задачи"""
        for task in self.task_queue + self.completed_tasks:
            if task.task_id == task_id:
                return task.status
        return None
